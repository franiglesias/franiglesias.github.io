---
layout: post
title: Mensajería variada
categories: articles
tags: design-patterns
---


En este artículo voy a saltar directamente de los comandos a los eventos.

Al fin y al cabo, las queries son como comandos que devolviesen respuesta. Sin embargo, los eventos son lo bastante diferentes como para merecer un tratamiento aparte. Y no solo eso, ya que los eventos tiene una proyección mucho más amplia en el diseño de aplicaciones modernas.

## Mensajes

Los tipos de mensajes:

* **Imperativos o comandos**, que son los que piden al sistema hacer algo. Cada comando tiene un ejecutor destinatario.
* **Interrogativos o queries**, son los que piden información al sistema, por tanto, siempre devolverán una respuesta. Igual que los comandos tienen un ejecutor destinatario.
* **Enunciativos o eventos**, anuncian cosas interesantes que han ocurrido en el dominio. No tienen un destinatario específico, sino que son atendidos por partes de la aplicación que estén interesadas. Por tanto, un evento puede no escucharlo nadie, o un número no determinado de listeners.


## Eventos

Los eventos son especialmente interesantes de entre estos mensajes. Comandos y queries, en general, nos permiten diferir la ejecución de una acción, pero conceptualmente no habría ninguna diferencia con el hecho de ejecutarla en el momento. Se puede decir que el invocador del comando o query, sabe qué necesita y qué esperar como resultado.

En cambio, los eventos desacoplan al emisor del evento de cualquiera de sus oyentes. Es más, el emisor no tiene ni idea de si el evento será escuchado y si alguien reaccionará al recibirlo. Y, por otra parte, el oyente no sabe quién ha emitido el evento, ni para qué. Tan solo sabe que al recibirlo debe hacer alguna cosa y ya. Así se elimina cualquier dependencia entre emisor y receptor.

Esto nos proporciona una sorprendente flexibilidad para desarrollar aplicaciones. Al ocurrir un evento, podemos poner en marcha distintas tareas. Si en el futuro tenemos que añadir alguna más, no tenemos más que crear un nuevo oyente que reaccione a ese evento del que usted me habla. Si tenemos que dejar de hacer algo, solo tenemos que borrar al oyente de la lista de interesados en ese evento.

El caso es que al abordar el tema de eventos nos encontramos con un mundo muy amplio. No es solo que los eventos tengan sentido en el ámbito de una aplicación, sino que el modelo de eventos nos sirve también para la comunicación entre aplicaciones. Este es un de las bases necesarias para la arquitectura distribuida, en la que los diferentes servicios reaccionar a lo que otros comunican.

Y aún hay más. Si registramos la sucesión de eventos, podríamos reconstruir la historia de un sistema. O específicamente la historia de sus entidades y agregados. Es lo que llamamos _event-sourcing_, un paradigma que nos permite modelar realidades en las que el estado de una entidad cambia con los acontecimientos y es siempre provisional.

Pero no quiero acelerarme ni abarcar demasiado. Así que vamos a empezar por entender los eventos en un modelo síncrono y dejaremos los otros temas para más adelante, porque son mundos en sí mismos.

## Introduciendo eventos en una aplicación

En el ejemplo del reloj, cuando llega la hora a la que está programada la alarma pasan dos cosas:

* Se muestra el mensaje de buenos días
* Suena el sonido de alarma

Ahora mismo, esto está resuelto como se puede ver. Cuando ocurre algo se lanzan distintos comandos.

```ruby
class AlarmClock
  def initialize(command_bus, awake_at, sleep_at)
    @command_bus = command_bus
    @awake_at = awake_at
    @sleep_at = sleep_at
  end

  def run
    24.times do |hour|
      case hour
      when @awake_at
        @command_bus.execute(GoodMorningCommand.new(hour))
        @command_bus.execute(PlayAlarmCommand.new(hour))
      when @sleep_at
        @command_bus.execute(GoodNightCommand.new(hour))
      else
        @command_bus.execute(ShowTimeCommand.new(hour))
        @command_bus.execute(PlayBeepCommand.new(hour))
      end
    end
  end
end
```

Si quisiésemos añadir una nueva acción tendríamos que escribir un nuevo comando y ejecutor y modificar este código, añadiendo una nueva línea para invocarlo. Es decir, `AlarmClock` sigue abierta a modificación.

Podríamos reinterpretar este código como la emisión de distintos eventos:

* Ha llegado la hora de levantarse
* Ha llegado la hora de acostarse
* Se ha cumplido una hora en punto

Podríamos representarlos con DTOs, como hemos hecho con los comandos.

```ruby
AwakeHourReached = Struct.new(:hour)

BedtimeHourReached = Struct.new(:hour)

DotHourReached = Struct.new(:hour)
```

¿Quién debería emitir los eventos? Pues, está bastante claro que eso es tarea para un reloj. Un reloj podría hacer un `tick` cada cierto tiempo y emitir eventos cuando se alcancen esos hitos.

_Nota al margen_: no sé si este del reloj es un buen ejemplo, pero aquí hemos venido a jugar, por lo que lo mantendremos un rato más. Es que para que "funcione", el propio reloj tendría que escuchar un evento, por decirlo así.

Pero bueno, imaginemos entonces que el reloj ejecuta un tick cada segundo. En ese tick, el reloj tendría que actualizar su estado interno (¡hey, también podemos hacerlo inmutable!) y se emitirá un evento si ese estado alcanza ciertos valores.

¿Qué queremos decir con emitir un evento? Pues publicarlo en algún bus de eventos para que sus oyentes puedan recibirlo. También podríamos hacer que los oyentes fueran observers del reloj y pudiesen reaccionar cuando este cambie, pero vamos a saltarnos eso porque creo que añadiría ruido al artículo.

Para hacerlo así, el emisor tendría que tener acceso al bus de eventos. Fíjate que nosotras aún no tenemos siquiera un _Event Bus_..., así que a buen lado vamos. 

En caso de tenerlo podríamos inyectarlo al emisor, algo que personalmente me resulta un poco feo e introduce demasiado ruido en los objetos del dominio. La motivación es poder publicar el evento exactamente en cuanto se produce. El inconveniente es que, a veces, un proceso puede generar varios eventos y tal vez no nos interese publicarlos a no ser que dicho proceso haya finalizado exitosamente, por lo que debemos guardarlos hasta confirmar que son publicables. 

Una alternativa, por fin, es recopilar los eventos que se producen en una entidad y pasárselos al event bus una vez se ha completado un proceso, ya sean ninguno o decenas de ellos. La entidad emisora no tiene que recibir el _Event Bus_, aunque sí debe ocuparse de generar y coleccionar sus propios eventos y entregarlos al _Event Bus_ para que los distribuya.

Así quedaría nuestro Clock:

```ruby
# frozen_string_literal: true

AwakeHourReached = Struct.new(:hour)

BedtimeHourReached = Struct.new(:hour)

DotHourReached = Struct.new(:hour)

class Clock
  def initialize(seconds, awake, bedtime)
    @seconds = seconds
    @awake = awake
    @bedtime = bedtime
    @events = []
  end

  def tick
    @seconds += 1
    @seconds = 0 if @seconds >= 86_400

    return if secs != 0
    return if minute != 0

    notify(DotHourReached.new(hour))
    notify(AwakeHourReached.new(hour)) if hour == @awake
    notify(BedtimeHourReached.new(hour)) if hour == @bedtime
  end

  def events
    pending = @events
    @events = []
    pending
  end

  private

  def notify(event)
    @events.append(event)
  end

  def secs
    (@seconds % 3600) % 60
  end

  def minute
    (@seconds % 3600) / 60
  end

  def hour
    @seconds / 3600
  end
end
```

Una vez ejecutado el método `tick`, tendríamos que recoger los eventos invocando `events` y pasárselos al `EventBus` que tengamos... cuando lo tengamos. Mientras tanto, veamos qué pasa si obtengo los eventos y los imprimo:

```ruby
class AlarmClock
  def initialize(command_bus, awake_at, sleep_at)
    @command_bus = command_bus
    @awake_at = awake_at
    @sleep_at = sleep_at
  end

  def run
    clock = Clock.new(0, 7, 22)
    loop do
      clock.tick
      clock.events.each { |event| puts "#{event.class.name} (#{event.hour})" }
    end
  end
end
```

Este es el resultado:

```
DotHourReached (1)
DotHourReached (2)
DotHourReached (3)
DotHourReached (4)
DotHourReached (5)
DotHourReached (6)
DotHourReached (7)
AwakeHourReached (7)
DotHourReached (8)
DotHourReached (9)
DotHourReached (10)
DotHourReached (11)
DotHourReached (12)
```

Este ejemplo nos muestra que se generan los eventos adecuados. ¿Cómo podemos hacer un bus de eventos?

## Construyendo un bus de eventos

Aparte de la diferencia semántica entre comandos y eventos, tenemos otra diferencia llamativa: los comandos tienen una relación 1 a 1 con su ejecutor, mientras que los eventos tienen una relación 1 a N con sus oyentes. Es decir, un mismo evento puede ser interesante para distintos oyentes.

Asi que para tener un Event Bus necesitamos dos cambios principales:

* Un Resolver que nos permita establecer relaciones 1 a N.
* Que la parte de ejecución del bus sea capaz recibir varios ejecutores y aplicarles los middlewares.

Y un poco de _syntactic sugar_: poder pasar varios eventos de una tacada.

Empezaré tomando como plantilla nuestro CommandBus, al que cambiaré el nombre por _EventBus_, aunque eventualmente esto cambiará. Ya veremos por qué:

```ruby
class CommandBus
  def initialize(resolver, middleware)
    @resolver = resolver
    @middleware = middleware
  end

  def execute(command)
    @middleware.execute(command, self)
  end
  
  def handle(command)
    executor = @resolver.executor_for(command)
    executor.execute(command)
  end
end
```

Aquí lo convertimos en un `EventBus`, pero todavía hay trabajo que hacer:

```ruby
class EventBus
  def initialize(resolver, middleware)
    @resolver = resolver
    @middleware = middleware
  end

  def execute(event)
    @middleware.execute(event, self)
  end
  
  def handle(event)
    listener = @resolver.listener_for(event)
    listener.execute(event)
  end
end
```

Como hemos dicho, tenemos que dar soporte a N oyentes (_listeners_) por evento, así que reflejemos eso:

```ruby
class EventBus
  def initialize(resolver, middleware)
    @resolver = resolver
    @middleware = middleware
  end

  def publish(event)
    @middleware.execute(event, self)
  end

  def handle(event)
    listeners = @resolver.listeners_for(event)
    listeners.each do |listener|
      listener.handle(event)
    end
  end
end
```

Además, hemos dicho que querríamos poder pasar varios eventos de una sola vez. Esto es fácil, ya que asumimos que vendrán como arrays. Observa que si no hay listeners no intentamos ejecutar nada.

```ruby
class EventBus
  def initialize(resolver, middleware)
    @resolver = resolver
    @middleware = middleware
  end

  def publish(event)
    @middleware.execute(event, self)
  end

  def publish_events(events)
    events.each do |event|
      publish(event)
    end
  end

  def handle(event)
    listeners = @resolver.listeners_for(event)
    return if listeners.nil?

    listeners.each do |listener|
      listener.handle(event)
    end
  end
end

```

A grandes rasgos, esto es lo que necesitamos para hacer un EventBus. Nos falta el Resolver. Este es el que tenemos:

```ruby
class Resolver
  def initialize
    @executors = {}
  end

  def register(command, executor)
    @executors[command] = executor
  end

  def executor_for(command)
    @executors[command.class.name]
  end
end

```

Vamos a ver cómo sería un resolver que de soporte a los eventos. Primer paso, cambiemos la nomenclatura:

```ruby
class ListenerResolver
  def initialize
    @listeners = {}
  end

  def register(event, listener)
    @listeners[event] = listener
  end

  def listeners_for(event)
    @listeners[event.class.name]
  end
end
```

En pocas palabras, necesitamos guardar colecciones de listeners.

```ruby
class ListenerResolver
  def initialize
    @listeners = {}
  end

  def register(event, listener)
    @listeners[event] = [] unless @listeners.key?(event)
    @listeners[event].append(listener)
  end

  def listeners_for(event)
    @listeners[event.class.name]
  end
end
```

Vamos a necesitar al menos un listener. ¿Quién está interesado en escuchar DotHourReached?

## ¿Cómo se hace un listener?

Un listener es parecido a un ejecutor de un comando: recibe como único parámetro el evento y hace lo que tenga que hacer con sus datos.

```ruby
class ShowTimeListener
  def initialize(display)
    @display = display
  end

  def handle(event)
    raise ArgumentError, 'invalid event' unless event.is_a? DotHourReached

    @display.show("#{event.hour}:00")
  end
end
```

Compáralo con `ShowTimeHandler`. Son idénticos.

```ruby
class ShowTimeHandler
  def initialize(display)
    @display = display
  end

  def execute(command)
    raise ArgumentError, 'invalid command' unless command.is_a? ShowTimeCommand

    @display.show("#{command.time}:00")
  end
end
```

Vamos a verlo en acción, antes de nada. Fíjate que le paso los middlewares al `EventBus`. Tal como lo hemos construido son perfectamente compatibles, aunque la terminología no es la adecuada. Pero ya arreglaremos eso.

```ruby
listener_resolver = ListenerResolver.new
listener_resolver.register('DotHourReached', ShowTimeListener.new(display))

event_bus = EventBus.new(listener_resolver, middlewares)

clock = AlarmClock.new(event_bus, 7, 22)
clock.run
```

y aquí `AlarmClock`, que lanza un bucle infinito, ejecuta el `tick` y obtiene los eventos resultantes para publicarlos:

```ruby
class AlarmClock
  def initialize(event_bus, awake_at, sleep_at)
    @event_bus = event_bus
    @awake_at = awake_at
    @sleep_at = sleep_at
  end

  def run
    clock = Clock.new(0, 7, 22)
    loop do
      clock.tick
      @event_bus.publish_events(clock.events)
    end
  end
end

```

El resultado:

```
1:00
2:00
3:00
4:00
5:00
6:00
7:00
8:00
9:00
10:00
11:00
12:00
```

Podríamos seguir con esta pauta e introducir listeners copiando y adaptando los command handlers. Para una aplicación tan pequeñita como esta es un planeamiento razonable.

Aquí vemos como se introduce un nuevo listener para el evento `DotHourReached`

```ruby
listener_resolver = ListenerResolver.new
listener_resolver.register('DotHourReached', ShowTimeListener.new(display))
listener_resolver.register('DotHourReached', PlayBeepListener.new(sound))

event_bus = EventBus.new(listener_resolver, middlewares)

clock = AlarmClock.new(event_bus, 7, 22)
clock.run
```

Veámoslo en acción:

```
1:00
      Playing... Beep! Beep!
2:00
      Playing... Beep! Beep!
3:00
      Playing... Beep! Beep!
4:00
      Playing... Beep! Beep!
5:00
      Playing... Beep! Beep!
6:00
      Playing... Beep! Beep!
7:00
      Playing... Beep! Beep!
8:00
      Playing... Beep! Beep!
9:00
      Playing... Beep! Beep!
10:00
      Playing... Beep! Beep!
11:00
      Playing... Beep! Beep!
12:00
      Playing... Beep! Beep!
```

### Una variante más sofisticada

Como acabamos de mencionar, implementar lógica en los listener para manejar los eventos es correcto y funciona bien en aplicaciones sencillas o bien dentro de módulos o contextos de aplicaciones. 

Pero veamos otra aproximación un poco más sofisticada para una aplicación que a lo mejor ya está estructurada con comandos. Es un poco más sofisticada porque los oyentes van a usar los comandos, actuando un poco como controladores. Se trata de un concepto interesante que nos proporcionará algunas ventajas en otro tipo de situaciones.

```ruby
class PlayAlarmListener
  def initialize(command_bus)
    @command_bus = command_bus
  end

  def handle(event)
    raise ArgumentError, 'invalid event' unless event.is_a? AwakeHourReached

    @command_bus.execute(PlayAlarmCommand.new(event.hour))
  end
end
```

El setup no es especialmente complicado:

```ruby
listener_resolver = ListenerResolver.new
listener_resolver.register('DotHourReached', ShowTimeListener.new(display))
listener_resolver.register('DotHourReached', PlayBeepListener.new(sound))
listener_resolver.register('AwakeHourReached', PlayAlarmListener.new(command_bus))

event_bus = EventBus.new(listener_resolver, middlewares)

clock = AlarmClock.new(event_bus, 7, 22)
clock.run
```

Y funciona:

```
1:00
      Playing... Beep! Beep!
2:00
      Playing... Beep! Beep!
3:00
      Playing... Beep! Beep!
4:00
      Playing... Beep! Beep!
5:00
      Playing... Beep! Beep!
6:00
      Playing... Beep! Beep!
7:00
      Playing... Beep! Beep!
      Playing... Sounding Alarm!!!
```

¿Cuándo nos interesa usar este tipo de aproximación? Se me ocurren algunos casos de uso:

* Ya tenemos mucha lógica montada con Commands/Handlers, por lo que reutilizamos el código existente aunque añadamos un mediador.
* Queremos comunicar con eventos distintos _bounded contexts_ en una aplicación monolítica, evitando que se acoplen entre ellos. Tendríamos una capa que escucha lo que ocurre en otros contextos y reacciona mediante comandos o incluso publicando eventos propios del _bounded context_
* Queremos comunicar con eventos aplicaciones distribuidas. A eso no hemos llegado todavía, pero conceptualmente es lo mismo que el punto anterior. Recibimos un evento de algo que ha pasado fuera de la aplicación y reaccionamos con un comando o publicando un evento internamente.

Para este último punto necesitamos otras cosas, claro. Para empezar, un distribuidor o broker de mensajes externo y un consumidor de esos mensajes, que los adapte a nuestra aplicación o micro-servicio. Además de tener en cuenta toda una variedad de cuestiones. Pero esto es otra historia y deberá ser contada en otra ocasión.

Por el momento vamos a volver a nuestro sencillo ejercicio con el reloj y darle una pequeña vuelta de tuerca más. El objetivo ahora es darle una estructura al sistema más similar a lo que sería una aplicación de negocio. No será lo más bonito del mundo, pero creo que servirá para explicar nuestra intención.

`AlarmClock` es un artefacto que necesitamos para que todo funcione, es un punto de entrada a la aplicación. Lo malo es que ahora contiene lógica de dominio, ya que instancia y utiliza un reloj. Esto es conveniente porque nos permite mantener el estado del reloj, el número de segundos transcurrido desde que se puso en marcha, sin necesidad de persistirlo.

Lo adecuado sería que `AlarmClock` invocase un caso de uso que sea el que se encargue de utilizar el objeto de dominio `Clock`, del cual `AlarmClock` no debería saber nada. Queremos conseguir algo así. Ya veremos después el tema de las alarmas. Los casos de uso, que representan las intenciones de los actores interesados en el sistema, normalmente se modelan como comandos.

```ruby
class AlarmClock
  def initialize(command_bus, awake_at, sleep_at)
    @command_bus = command_bus
    @awake_at = awake_at
    @sleep_at = sleep_at
  end

  def run
    loop do
      @command_bus.execute(TickCommand.new(@awake_at, @sleep_at))
    end
  end
end
```

Este sería el comando:

```ruby
TickCommand = Struct.new(:awake_at, :sleep_at)

class TickCommandHandler
  def initialize(event_bus)
    @event_bus = event_bus
  end

  def execute(command)
    raise ArgumentError, 'invalid command' unless command.is_a? TickCommand

    clock = Clock.new(0, command.awake_at, command.sleep_at)
    clock.tick
    @event_bus.publish_events(clock.events)
  end
end
```

El problema debería ser evidente: cada vez que se ejecuta el tick el reloj está a cero, por lo que tendremos que mantener su estado entre tick y tick de alguna forma. Por tanto, vamos a introducir un objeto que se encargue de que persista en el tiempo.

```ruby
class TickCommandHandler
  def initialize(repository, event_bus)
    @event_bus = event_bus
    @repository = repository
  end

  def execute(command)
    raise ArgumentError, 'invalid command' unless command.is_a? TickCommand

    clock = @repository.retrieve
    clock.tick

    @repository.persist(clock)

    @event_bus.publish_events(clock.events)
  end
end
```

Si te interesan los detalles:


```ruby
class ClockRepository
  def initialize(storage)
    @storage = storage
  end

  def retrieve
    seconds = @storage.read
    Clock.new(seconds, 7, 22)
  end

  def persist(clock)
    @storage.save(clock.seconds)
  end
end
```

```ruby
class MemoryStorage
  def initialize
    @data = 0
  end

  def save(data)
    @data = data
  end

  def read
    @data
  end
end
```

Y este es el setup final, una vez añadidos todos los oyentes de los eventos:

```ruby
listener_resolver = ListenerResolver.new
listener_resolver.register('DotHourReached', ShowTimeListener.new(display))
listener_resolver.register('DotHourReached', PlayBeepListener.new(sound))
listener_resolver.register('AwakeHourReached', GoodMorningListener.new(display, language))
listener_resolver.register('AwakeHourReached', PlayAlarmListener.new(sound))
listener_resolver.register('BedTimeHourReached', GoodNightListener.new(display, language))

event_bus = EventBus.new(listener_resolver, middlewares)

repository = ClockRepository.new(MemoryStorage.new)
tickCommandHandler = TickCommandHandler.new(repository, event_bus)

resolver.register('TickCommand', tickCommandHandler)
command_bus = CommandBus.new(resolver, middlewares)

clock = AlarmClock.new(command_bus, 7, 22)
clock.run
```

Como se puede ver combinando comandos y eventos podemos montar aplicaciones muy apañadas. Cada unidad de código se ocupa de una sola cosa y podemos modificar el comportamiento del sistema muy fácilmente, simplemente reemplazando componentes.

_Nota al margen:_ Efectivamente, el tema de la configuración de horas de levantarse y acostarse no queda resuelto, pero como no es el punto del artículo me voy a permitir pasar de ello.

## Algunas notas sobre esta última solución

El _Command Bus_ que hemos creado en estos artículos es funcional pese a su sencillez y limitaciones. Lo mismo podemos decir del _Event Bus_. Ninguno de ellos tienen grandes complicaciones y, sin embargo, gracias a su capacidad para aceptar _middlewares_, su comportamiento puede ser bastante sofisticado.

Según Juan Manuel Garrido de Paz, este _Command Bus_, o de forma más genérica un bus de mensajes, puede actuar como base para puerto en arquitectura hexagonal y, gracias a los middlewares, la aplicación puede ocuparse de cosas como autenticación, transacciones, etc., sin que ese código contamine la lógica de negocio. Los puertos serían el conjunto de mensajes con el que se construyen las conversaciones del actor externo con la aplicación.

En el ejemplo anterior, no hemos usado _ports & adapters_, sino una versión simple de arquitectura limpia que mucha gente identifica erróneamente con arquitectura hexagonal. El _Command Bus_ nos ayuda a gestionar las dependencias en los puntos de entrada, como los controladores de una aplicación web, ya que solo necesitan conocer el _bus_ y los mensajes que, no olvidemos, son DTOs. 

Tenía pensado extender el artículo explicando como construir un bus de mensajes genérico a partir de lo que hemos estado viendo con el _Command Bus_ y el _Event Bus_. En cualquier caso, me parece que sería mejor hacerlo en una pieza separada. Si tienes curiosidad, debería ser sencillo adaptar el actual EventBus para hacerlo genérico, básicamente a través de la mejora de la terminología.

Por otro lado, he mencionado dos temas que quizá también desarrolle:

**Buses asíncronos vs. síncronos**: los buses que he mostrado en estos artículos son síncronos. Es decir, los mensajes se atienden en el momento, en el orden en que se hayan introducido sus oyentes y el emisor espera a que se hayan ejecutado. 

Esto puede funcionar bastante bien para mensajería interna de una aplicación en procesos que no tengan que ser asíncronos por algún motivo. Es ideal, como hemos visto, para realizar varias operaciones en un proceso de forma separada y poder añadir o cambiar pasos sin modificar el código, sino añadiendo nuevas piezas. Por otro lado, como recomendación general, incluso en este caso hay que tratarlos como si los procesos fuesen asíncronos.

En los buses asíncronos, el emisor lanza el mensaje y se olvida. No tiene nada que esperar, pues el proceso de estos mensajes se hace en otro hilo de ejecución. Esto nos lleva a otras consideraciones que tienen que ver con el orden de los mensajes, las condiciones de carrera si distintos procesos operan sobre las mismas entidades, etc.

Y quién dice en otro hilo de ejecución dice en otra aplicación o servicio. ¿Y si podemos hacer que nuestros mensajes puedan ser escuchados por otras aplicaciones? Aquí ya tenemos que tener en cuenta una forma de que distintos sistemas puedan entenderse a través de un _bus_ o _broker_ de mensajes.

Este broker de mensajes actúa _grosso modo_ como lo hace un _Message Bus_: permite que un emisor publique mensajes que puedan ser atendidos por diversos consumidores interesados.

Por supuesto, hay grandes diferencias, al tratarse es un sistema externo. El broker necesita mantener una cierta persistencia o retención de los mensajes, a fin de que puedan ser recibidos por sus destinatarios potenciales y garantizar su entrega, incluso aunque sus consumidores hayan fallado, etc. Por otro lado, debe ofrecer algún tipo de organización (topics, canales, etc.) que permita entender qué mensajes está haciendo circular. 

**Event sourcing**: es el otro gran tema relacionado con eventos. Event sourcing es una forma de modelar en la que las entidades no mantienen un estado estático, sino que se reconstruye a través de los eventos que nos hayan llevado a él. 

Puedes pensar en una cuenta bancaria. La cuenta bancaria se crea en una entidad y se van aplicando movimientos a lo largo del tiempo. En cada momento podemos conocer su saldo, pero también todo lo que ha ocurrido y como ha ido variando. Conocer el saldo actual, o estado, de una cuenta bancaria es importante, pero los cambios que ha experimentado con el tiempo nos proporcionan una información mucho más rica y con potencial para tomar mejores decisiones.

Aplicando este principio si coleccionamos los eventos que se refieren a una entidad de dominio, podremos reconstruir no solo su estado en el momento actual, sino en cualquier momento que nos interese. En este entorno es importante el concepto de proyección. Las proyecciones son estructuras de datos que dan soporte a una funcionalidad y son generadas a partir de los eventos relevantes. Por ejemplo, una proyección podría permitirnos elaborar listados de productos.

Todo esto tiene algunas ventajas adicionales. Podemos realizar cambios en la funcionalidad de la aplicación que también son válidos para nuestros datos más antiguos, ya que nos bastaría con _rebobinar_ los eventos y reproducirlos para reconstruir el estado de la aplicación, pero usando proyecciones diferentes de acuerdo a la nueva funcionalidad.

Además, event sourcing es una solución ideal cuando necesitamos auditoría. Por decirlo de manera burda: la auditoría se hace sola, puesto que guardamos la historia de todo lo ocurrido en nuestro dominio.

En cualquier caso, Event Sourcing implica un cambio grande de mentalidad a la hora de entender las aplicaciones y la forma en que pueden colaborar. Presenta muchos desafíos e introduce cierta complejidad. Pero, paradójicamente, también puede ayudarnos a simplificar ciertas partes de nuestro sistema y resolver problemas de escalado.
