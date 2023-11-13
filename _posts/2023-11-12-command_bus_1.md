---
layout: post
title: Como funciona un bus de mensajes
categories: articles
tags: design-patterns
---

Hace un tiempo que se me ocurrió la idea de explicar algunos componentes relativamente comunes de las aplicaciones construyéndolos. Y me apetecía hacerlo con los buses de mensajes.

Creo que la inspiración lejana de esto viene de una serie de artículos de Fabien Potencier, el creador de Symfony, sobre [cómo construir tu propio framework](https://symfony.com/doc/current/create_framework/index.html). No pretendo llegar a tanto, pero es verdad que es una forma genial de entender cómo funcionan las cosas.

## Hablemos de patrones

### El patrón Command

Para empezar hay que hablar del patrón _Command_. 

Este patrón resuelve el problema de separar el momento de constatar la necesidad de realizar una operación determinada, del momento o el lugar en que se ejecuta dicha operación. 

Es decir, tenemos un módulo emisor (_invoker_ o _sender_) interesado en que ocurra algo, para lo cual encapsula la petición en forma de un objeto comando (_command_). Este comando se pasa a un receptor (_receiver_) que ejecuta el comando cuando sea oportuno. El emisor o invocador no sabe quién, ni cómo, va a ejecutar la acción, y el receptor no sabe quién se lo ha pedido.

El patrón _command_ es muy usado para ejecutar acciones solicitadas desde la interfaz de usuario. Un controlador recibe un evento o petición del mundo real (un clic en un botón, seleccionar un item en un menú, etc.), encapsula esa petición en un comando y se lo pasa a un receptor que lo ejecuta o lo encola.

En general, es un patrón que nos sirve para decidir en una capa, contexto o módulo de software, algo que se deberá ejecutar en otro lugar del código, sin acoplarlos.

Voy a intentar explicarlo con la creación de un reloj despertador que nos saluda por la mañana y nos desea buenas noches al acostarnos. Para saber cómo saludar, vamos a usar una "librería" que nos proporcione expresiones adecuadas en un idioma determinado. De momento, solo español. 

Aquí las librerías.

```ruby
class Spanish
  def morning
    puts "Buenos días"
  end

  def night
    puts "Buenas noches"
  end
end
```

Aquí tenemos `AlarmClock`. Se configura con la hora de levantarse y la de acostarse. En nuestro ejemplo simularemos un día recorriendo las 24 horas, mostrando el mensaje adecuado a los momentos especiales de levantarse y acostarse.

AlarmClock tiene un `AlarmClockDisplay` que es el que genera el output en la pantalla. `AlarmaClock` decide qué comando pasarle a `AlarmClockDisplay` para que este muestra el mensaje correcto en función del momento del día. Además, si no se trata de un momento especial, se envía un comando para mostrar la hora. 

`AlarmClock` sería el _invoker_, que es quien decide qué comando se debe ejecutar en función del contexto. `AlarmClockDisplay` es el _receiver_, que ejecuta el comando solicitado porque es quien sabe como ejecutarlo. En este caso, mostrando la información en la consola.

```ruby
class AlarmClock
  def initialize(awake_at, sleep_at)
    @display = AlarmClockDisplay.new
    @awake_at = awake_at
    @sleep_at = sleep_at
  end

  def run
    24.times do |hour|
      command = case hour
                when @sleep_at
                  NightCommand.new(Spanish.new, hour)
                when @awake_at
                  MorningCommand.new(Spanish.new, hour)
                else
                  ShowTimeCommand.new(hour)
                end
      @display.show(command)
    end
  end
end
```

Podríamos decir que `AlarmClock` está pendiente de tres eventos: que sea la hora de levantarse, que sea la hora de acostarse y que sea cualquier otra hora del día. Cuando suceden estos eventos, le envía a `AlarmClockDisplay` el mensaje adecuado. 

Este por su parte se limita a ejecutar el comando que le pasan el comando configurado para cada uno de los mensajes

```ruby
class AlarmClockDisplay
  def show(command)
    command.execute
  end
end
```

Los comandos implementan una interfaz `Command` que tiene un método `execute`. Gracias a esto, `AlarmClockDisplay` sabe que solo tiene que enviar el mensaje `execute` a los objetos que le pasen.

```ruby
class Command
  def execute()
    raise NotImplementedError.new
  end
end
```

Y aquí están todos los comandos que definen nuestro sistema. Es interesante señalar que cada uno de los comandos recibe por construcción la información o dependencias que necesita para poder ejecutarse. En este ejemplo, la dependencia vendría representada por los idiomas.

```ruby
class MorningCommand < Command
  def initialize(language, time)
    @language = language
    @time = time
  end

  def execute
    print "#{@time}:00 -> "
    @language.morning
  end
end

class NightCommand < Command
  def initialize(language, time)
    @language = language
    @time = time
  end

  def execute
    print "#{@time}:00 -> "
    @language.night
  end
end

class ShowTimeCommand < Command
  def initialize(time)
    @time = time
  end

  def execute
    puts "#{@time}:00"
  end
end
```

Otra cosa interesante en la que fijarse es que cada comando es muy simple, no tiene que tomar decisiones basadas en la hora del día, lo que hace que sean fáciles de testear o de reemplazar. Esas decisiones se han tomado antes, cuando se decide qué comando crear. 

Y aquí tendríamos un ejemplo de funcionamiento.

```ruby
clock = AlarmClock.new(7, 22)
clock.run
```

Al ejecutarlo se genera este resultado:

```
0: 
1: 
2: 
3: 
4: 
5: 
6: 
7: Buenos días
8: 
9: 
10: 
11: 
12: 
13: 
14: 
15: 
16: 
17: 
18: 
19: 
20: 
21: 
22: Buenas noches
23: 
```

Si queremos dar soporte a nuevos eventos, no tenemos más que añadir los comandos necesarios y modificar el bloque case para que nos los proporcione. 

En resumen, en el patrón comando, el objeto comando representa una intención (algo que se quiere hacer) y contiene todo lo necesario para poder hacerlo.


### Separando los datos

Si examinamos alguno de los comandos anterior podemos observar algunos detalles interesantes:

```ruby
class NightCommand < Command
  def initialize(language, time)
    @language = language
    @time = time
  end

  def execute
    print "#{@time}:00 -> "
    @language.night
  end
end
```

Fijémonos en los parámetros de construcción:

`language` representa una dependencia, un colaborador en el que el comando delegará parte de la ejecución. De hecho, esto es similar a lo que haríamos con un patrón Adapter. Como tal dependencia, podríamos inyectarla en tiempo de configuración del sistema. Además, no necesitamos una instancia específica, sino que nos vale con la misma instancia para todos los comandos u otros objetos que la puedan necesitas.

`time`, por su parte, representa un parámetro que el comando necesita para ejecutarse. No podemos conocerlo hasta el momento en que se genera, por lo que tiene que inyectarse en tiempo de ejecución. Se trata, además, de una instancia específica que, en este caso, se ha creado como respuesta a un evento.

Esto nos lleva a pensar en la posibilidad de separar el comando en dos partes:

* la parte que expresa la intención: el propio comando conteniendo los datos necesarios.
* la parte que la implementa: el ejecutor del comando, que implementa la intención y usa sus datos. Es frecuente llamarlo también _handler_.

En esta implementación del patrón el comando es un DTO, un objeto de transporte de datos. Esto es ventajoso porque, como señalamos más arriba, el patrón comando suele implicar trabajo en varias capas (como capa de UI y capa de dominio, por ejemplo). Un DTO es un tipo de objeto ideal para mover información entre capas o sistemas, no require nada especial para su creación ni tiene dependencias. Además, según los lenguajes, nos permite implementarlos mediante tipos de datos como Structs, que simplifican su instanciación y su uso.

Por otro lado, el ejecutor o handler, vive únicamente en la capa donde se realiza el comportamiento y se ocupa de los detalles de implementación.

Esto se puede ver más fácilmente en este ejemplo en el que vamos a reescribir el comando anterior:

Aquí el comando. Como se puede ver, el comando ya no implementa una interfaz. Es un DTO. En Ruby lo podemos implementar como un objeto que expone accesores a sus propiedades. 

```ruby
class NightCommand
  attr_reader :time

  def initialize(time)
    @time = time
  end
end
```

En este caso es ventajoso utilizar _structs_, ya que nos proporciona acceso público a las propiedades y soporta la igualdad. En Ruby, al igual que en Java, cada objeto tiene identidad, lo que resulta bastante incómodo a la hora de hacer comparaciones.

```ruby
NightCommand = Struct.new(:time)
```

Por su parte, aquí está el ejecutor, 

```ruby
class NightCommandExecutor
  def initialize(language)
    @language = language
  end

  def execute(command)
    print "#{command.time}:00 -> "
    @langugage.sleep
  end
end
```

Esta separación convierte al comando en un mensaje de tipo imperativo. El _invoker_ solo tiene que instanciar el mensaje deseado y pasarlo al _receiver_, que se deberá ocupar de encontrar el ejecutor adecuado para cada comando.

Si bien esto simplifica las cosas en el lado del _invoker_, las complica un poco en el lado del _receiver_. Vamos a ver cómo cambian. Para el _invoker_ es algo más fácil decidir e instanciar los comandos, puesto que solo necesitan los datos que ya tiene.

```ruby
class AlarmClock
  def initialize(awake_at, sleep_at)
    @display = AlarmClockDisplay.new
    @awake_at = awake_at
    @sleep_at = sleep_at
  end

  def run
    24.times do |hour|
      command = case hour
                when @sleep_at
                  NightCommand.new(hour)
                when @awake_at
                  MorningCommand.new(hour)
                else
                  ShowTimeCommand.new(hour)
                end
      @display.show(command)
    end
  end
end
```


`AlarmClockDisplay` necesita algo que le permita obtener los ejecutores o _handlers_ que correspondan a los comandos.

```ruby
class AlarmClockDisplay
  def show(command)
    executor = case command.class.name
               when "MorningCommand"
                 MorningHandler.new(Spanish.new)
               when "NightCommand"
                 NightHandler.new(Spanish.new)
               else
                 ShowTimeHandler.new
               end
    executor.execute(command)
  end
end
```

Finalmente, aquí tenemos los comandos y sus ejecutores. Lo más interesante es ver que ahora cada ejecutor recibe un comando con el mensaje `execute`. Lógicamente, sería conveniente verificar que el comando pasado es del tipo adecuado.

```ruby
MorningCommand = Struct.new(:time)

class MorningHandler
  def initialize(language)
    @language = language
  end

  def execute(command)
    raise ArgumentError.new "invalid command" if !command.is_a? MorningCommand

    print "#{command.time}:00 -> "
    @language.morning
  end
end

NightCommand = Struct.new(:time)

class NightHandler
  def initialize(language)
    @language = language
  end

  def execute(command)
    raise ArgumentError.new "invalid command" if !command.is_a? NightCommand

    print "#{command.time}:00 -> "
    @language.night
  end
end

ShowTimeCommand = Struct.new(:time)

class ShowTimeHandler
  def initialize() end

  def execute(command)
    raise ArgumentError.new "invalid command" if !command.is_a? ShowTimeCommand

    puts "#{command.time}:00"
  end
end
```

Esta implementación es un poco más sofisticada y, al menos aparentemente, complica un poco las cosas, pero no demasiado.

El nuevo diseño aporta algunas ventajas que se manifiestan mejor en proyectos más grandes. A pesar de que tenemos más objetos, cada uno tiene sus responsabilidades más acotadas. Y, en ese sentido, el cambio más interesante es que los comandos ahora se han convertido en mensajes.

Bueno, todo ha mejorado, menos en el _receiver_

### _Resolver_

Hay un tema un poco molesto aquí. El _receiver_ ahora tiene que averiguar cuál es el ejecutor del comando, a fin de enviárselo.

```ruby
class AlarmClockDisplay
  def show(command)
    executor = case command.class.name
               when "MorningCommand"
                 MorningHandler.new(Spanish.new)
               when "NightCommand"
                 NightHandler.new(Spanish.new)
               else
                 ShowTimeHandler.new
               end
    executor.execute(command)
  end
end
```


Podemos separarlo en otra clase, que llamaremos `Resolver`

```ruby
class AlarmClockDisplay
  def initialize
    @resolver = Resolver.new
  end

  def show(command)
    executor = @resolver.executor_for(command)
    executor.execute(command)
  end
end

class Resolver
  def executor_for(command)
    case command.class.name
    when 'MorningCommand'
      MorningHandler.new(Spanish.new)
    when 'NightCommand'
      NightHandler.new(Spanish.new)
    else
      ShowTimeHandler.new
    end
  end
end
```

Ahora todo está un poco mejor, ¿no? Por supuesto, se podría objetar que no estoy inyectando algunas dependencias, lo que puede a la larga puede traer algunas complicaciones. Así que dejemos las cosas bien.

```ruby
class AlarmClockDisplay
  def initialize(resolver)
    @resolver = resolver
  end

  def show(command)
    executor = @resolver.executor_for(command)
    executor.execute(command)
  end
end
```

```ruby
class AlarmClock
  def initialize(display, awake_at, sleep_at)
    @display = display
    @awake_at = awake_at
    @sleep_at = sleep_at
  end

  def run
    24.times do |hour|
      command = case hour
                when @sleep_at
                  NightCommand.new(hour)
                when @awake_at
                  MorningCommand.new(hour)
                else
                  ShowTimeCommand.new(hour)
                end
      @display.show(command)
    end
  end
end
```

En consecuencia, para montar y ejecutar nuestra aplicación, el código sería este:

```ruby
resolver = Resolver.new
display = AlarmClockDisplay.new(resolver)
clock = AlarmClock.new(display,7, 22)

clock.run
```

Como decíamos al principio, el patrón _Command_ nos permite separar la decisión de qué necesitamos hacer, del momento y lugar en que se hace. Esto se acentúa al separar la parte de datos y la parte de ejecución. 

Los _invokers_ tan solo tienen que saber instanciar los comandos que necesiten, sin preocuparse de cómo se implementan los ejecutores.

En realidad casi hemos llegado sin querer al _Command Bus_. Fíjate qué ocurre con `AlarmClockDisplay`: recibe un comando, localiza el ejecutor del mismo y se lo pasa. 

Pues eso es lo que hace un _Command Bus_.

## Command Bus

El _Command Bus_ es básicamente un _receiver_ universal que acepta comandos y se los pasa a los ejecutores adecuados. 

Una comparación bastante buena es pensar en una camarera o camarero de un buen restaurante. Recibe peticiones de los clientes y su misión es llevarlas a los distintos servicios del restaurante:

* La comanda de platos a la cocina
* Bebidas a la bodega
* Cafés, licores, cócteles..., al bar
* La cuenta y el pago a la caja

La analogía hay que tomarla con pinzas porque la realidad del mundo de la hostelería no suele estar tan compartimentada, pero puede resultar bastante útil.

Al _Command Bus_ como tal le da igual el significado o implementación de los comandos que gestiona. Sencillamente, lo único que necesita saber es a qué ejecutor se lo debe pasar.

Para conseguirlo, el _Command Bus_ necesita alguna estrategia de mapeo o resolución. La más básica es algo como lo que acabamos de ver: una asociación explícita entre cada comando y su ejecutor.

Debería ser obvio, sin embargo, es que esta es una mala estrategia, ya que tendríamos que cambiar el mapeador cada vez que queramos añadir un comando al sistema, lo que sería una violación del principio Open/Closed.

Pero no nos adelantemos. Lo mejor es verlo en acción. Sin embargo, nuestro diseño actual del `AlarmClock` no es bueno para esto. Así que vamos a plantearlo de otra manera.

Nuestro reloj despertador tendrá dos componentes: la pantalla y un generador de sonido. La pantalla puede mostrar cualquier texto que le pasemos, mientras que el generador de sonido puede producir una señal horaria o una alarma.

Al igual que en los ejemplos anteriores, invocaremos ciertos comandos para ejecutar ciertas acciones según la hora del día:

* A la hora de levantarse, se mostrará un saludo y sonará una alarma.
* A la hora de acostarse, se mostrará una despedida.
* A cada hora se emitirá una pequeña señal horaria.

En general, el diseño del sistema va a tener bastantes diferencias respecto a lo que hemos visto en los otros ejemplos. No estoy muy seguro de por donde empezar, pero como el artículo va sobre _Command Buses_, creo que puedo empezar por aquí. Muy simple:

```ruby
class CommandBus
  def initialize(resolver)
    @resolver = resolver
  end

  def execute(command)
    executor = @resolver.executor_for(command)
    executor.execute(command)
  end
end
```

En pocas palabras: el `CommandBus` obtiene una instancia del ejecutor o handler de un comando y se lo pasa invocando `execute`. Eso est todo.

Se podría decir que la chicha está en el `Resolver`, un objeto al que le pasamos el objeto comando y nos dice quien debería ejecutarlo.

```ruby
class Resolver
  def executor_for(command)
    case command.class.name
    when 'GoodMorningCommand'
      GoodMorningHandler.new(Display.new, SpanishLanguage.new(Spanish.new))
    when 'GoodNightCommand'
      GoodNightHandler.new(Display.new, SpanishLanguage.new(Spanish.new))
    when 'PlayAlarmCommand'
      PlayAlarmHandler.new(Sound.new)
    when 'PlayBeepCommand'
      PlayBeepHandler.new(Sound.new)
    when 'ShowTimeCommand'
      ShowTimeHandler.new(Display.new)
    else
      raise ArgumentError.new, "unknown command #{command.class.name}"
    end
  end
end
```

Es también muy simple: dependiendo del nombre del comando, crea una instancia del ejecutor. Cada ejecutor se construye con todas las dependencias que necesite para su trabajo.

Por supuesto, me diréis que no es necesario crear una instancia nueva de cada dependencia cada vez:

```ruby

class Resolver
  def executor_for(command)
    display = Display.new
    sound = Sound.new
    
    spanish = Spanish.new
    spanish_language = SpanishLanguage.new(spanish)

    case command.class.name
    when 'GoodMorningCommand'
      GoodMorningHandler.new(display, spanish_language)
    when 'GoodNightCommand'
      GoodNightHandler.new(display, spanish_language)
    when 'PlayAlarmCommand'
      PlayAlarmHandler.new(sound)
    when 'PlayBeepCommand'
      PlayBeepHandler.new(sound)
    when 'ShowTimeCommand'
      ShowTimeHandler.new(display)
    else
      raise ArgumentError.new, "unknown command #{command.class.name}"
    end
  end
end
```

Es más, me diréis que en realidad, deberíamos poder instanciar cada ejecutor fuera de `Resolver`, de tal modo que no tenga la responsabilidad de construir esos objetos.

Y, aún más, como mencionamos más arriba, lo suyo sería que esta asociación se pudiese hacer desde fuera, tal vez mediante algún tipo de registro que nos permita asociar un comando con la instancia del handler que lo va a manejar. ¿Qué tal algo así?

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

¿Dónde se han ido todos? Pues a la configuración:

```ruby
display = Display.new
sound = Sound.new

spanish = Spanish.new
spanish_language = SpanishLanguage.new(spanish)

resolver = Resolver.new
resolver.register('GoodMorningCommand', GoodMorningHandler.new(display, spanish_language))
resolver.register('GoodNightCommand', GoodNightHandler.new(display, spanish_language))
resolver.register('PlayAlarmCommand', PlayAlarmHandler.new(sound))
resolver.register('PlayBeepCommand', PlayBeepHandler.new(sound))
resolver.register('ShowTimeCommand', ShowTimeHandler.new(display))

command_bus = CommandBus.new(resolver)

clock = AlarmClock.new(command_bus, 7, 22)
clock.run
```

¿Ha molado? Pues mola bastante, porque ahora vamos a gozar de una flexibilidad tremenda para construir nuestro reloj. Todo el código anterior constituye la base de la arquitectura de nuestro reloj.

Lo único que aún no os he mostrado son los comandos y sus ejecutores. Los pongo aquí y luego volvemos con las explicaciones.

```ruby
GoodMorningCommand = Struct.new(:time)

class GoodMorningHandler
  def initialize(display, language)
    @display = display
    @language = language
  end

  def execute(command)
    raise ArgumentError, 'invalid command' unless command.is_a? GoodMorningCommand

    print "#{command.time}:00 -> "
    @display.show(@language.good_morning)
  end
end

GoodNightCommand = Struct.new(:time)

class GoodNightHandler
  def initialize(display, language)
    @display = display
    @language = language
  end

  def execute(command)
    raise ArgumentError, 'invalid command' unless command.is_a? GoodNightCommand

    print "#{command.time}:00 -> "
    @display.show(@language.good_night)
  end
end

ShowTimeCommand = Struct.new(:time)

class ShowTimeHandler
  def initialize(display)
    @display = display
  end

  def execute(command)
    raise ArgumentError, 'invalid command' unless command.is_a? ShowTimeCommand

    @display.show("#{command.time}:00")
  end
end

PlayAlarmCommand = Struct.new(:time)

class PlayAlarmHandler
  def initialize(sound)
    @sound = sound
  end

  def execute(command)
    raise ArgumentError, 'invalid command' unless command.is_a? PlayAlarmCommand

    @sound.alarm
  end
end

PlayBeepCommand = Struct.new(:time)

class PlayBeepHandler
  def initialize(sound)
    @sound = sound
  end

  def execute(command)
    raise ArgumentError, 'invalid command' unless command.is_a? PlayBeepCommand

    @sound.beep
  end
end
```

Aquí están los servicios que nos abstraen del hardware.

```ruby
class Display
  def show(message)
    puts message
  end
end
```

```ruby
class Sound
  def alarm
    puts '      Playing... Sounding Alarm!!!'
  end

  def beep
    puts '      Playing... Beep! Beep!'
  end
end
```

Y aquí tenemos una librería que actúa como proveedora de los textos necesarios. Hemos introducido el concepto `Language` para tener una interfaz propia que define cómo queremos interactuar con estos proveedores. Y para nuestro ejemplo, implementamos un adaptador para tener un `SpanishLanguage`.

```ruby
class Spanish
  def morning
    'Buenos días'
  end

  def night
    'Buenas noches'
  end
end

class Language
  def good_morning
    raise NotImplementedError.new, 'implement good_morning'
  end

  def good_night
    raise NotImplementedError.new, 'implement good_night'
  end
end

class SpanishLanguage < Language
  def initialize(spanish)
    @spanish = spanish
  end

  def good_morning
    return @spanish.morning
  end

  def good_night
    @spanish.night
  end
end
```

Este es el output generado:

```
0:00
      Playing... Beep! Beep!
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
7:00 -> Buenos días
      Playing... Sounding Alarm!!!
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
13:00
      Playing... Beep! Beep!
14:00
      Playing... Beep! Beep!
15:00
      Playing... Beep! Beep!
16:00
      Playing... Beep! Beep!
17:00
      Playing... Beep! Beep!
18:00
      Playing... Beep! Beep!
19:00
      Playing... Beep! Beep!
20:00
      Playing... Beep! Beep!
21:00
      Playing... Beep! Beep!
22:00 -> Buenas noches
23:00
      Playing... Beep! Beep!
```

## Reflexiones

Como se puede ver, la mayor parte de la lógica de la aplicación está en los pares comando/ejecutor.

`AlarmClock` básicamente recorre las horas del día y según sea una de las configuradas o no, envía el comando correspondiente a través del `CommandBus`. Si queremos que pasen varias cosas a la misma hora, no tenemos más que enviar los nuevos comandos. 

`AlarmClock` no sabe nada acerca de qué componentes del sistema se encargan de qué comandos. Esto nos permitirá cambiar su comportamiento sin tocar su código, simplemente cambiando los ejecutores por otros configurados de manera distinta. Gracias al _Command Bus_ podemos hacer estos cambios respetando el principio Open/Close... o casi.

Nota al margen: Aquí anticipo que hay otras formas de resolver esto, que veremos en otro artículo, porque una cosa lleva a la otra. Centrémonos en el `CommandBus`.

El `CommandBus`, por su parte, tampoco sabe nada de nadie. No tiene ni idea de quién le envía comandos ni quién los ejecuta. Se limita a recibirlos y preguntar al `Resolver` si conoce algún ejecutor que lo pueda manejar, para pasárselo.

`Resolver`, finalmente, registra una asociación arbitraria de nombres de comandos con una instancia de un ejecutor que lo va a poder manejar. El código del resolver tampoco sabe nada de esta asociación, puesto que se la indicamos nosotras. Se limita a registrarla y usarla cuando se le pide.

Por tanto, `CommandBus` y `Resolver` son completamente genéricos, nos valen para montar cualquier aplicación.

En cuanto a los comandos, estos expresan intenciones de las usuarias del sistema: cosas que queremos que pasen. Cada una de estas intenciones se parametriza con los datos necesarios.

Los ejecutores son como aplicaciones pequeñísimas que usan elementos del sistema para cumplimentar la intención. Para ello, se configuran con las dependencias necesarias. En una aplicación grande, esos ejecutores coordinarán objetos del dominio del sistema. En aplicaciones más pequeñas puede que simplemente contengan el código necesario para realizar esa acción.

El hecho de que se trate de acciones muy específicas debería servir para que sean bastante fáciles de poner bajo test.

## A donde vamos a continuación

Para no alargar más esta primera entrega y darnos tiempo a asentar los conceptos básicos, vamos a dejarlo aquí.

Como puedes ver, la idea de usar un _Command Bus_ puede ser una gran solución para estructurar una aplicación de forma sencilla. Pero podemos llegar más lejos.

En las próximas entregas vamos a ver varios temas. Principalmente, puedo anticipar los siguientes:

* Cómo podemos cambiar el comportamiento de la aplicación simplemente configurando otros ejecutores.
* Cómo podemos aprovecharnos del _Command Bus_ para añadir toda una serie de servicios comunes y modificar su comportamiento usando _Middlewares_, que son añadidos que podemos configurar en el _Bus_ y pueden acceder a los comandos y sus resultados.
