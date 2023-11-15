---
layout: post
title: Disfrutando del Command Bus
categories: articles
tags: design-patterns
---

Antes de empezar la segunda parte de esta serie voy a organizar un poco el código en un repositorio y darle un poco de estructura.

[Aquí tenemos el repositorio](https://github.com/franiglesias/ruby-dojo/tree/master/lib/alarm_clock)

En este artículo:

## Cambiando la aplicación con el Command Bus

Cambiar el comportamiento de nuestro reloj sin tocar su código es posible gracias al uso del Command Bus. 

Estrictamente hablando, vamos a tocar el código. Pero lo que es importante destacar es que con este tipo de arquitecturas podemos hacer que esos cambios sean menos problemáticos y no destructivos. Vamos a ver como:

### Cambiar el comportamiento, cambiando la configuración de los componentes

Supongamos que queremos que el reloj emita sus mensajes en inglés. En este fragmento de **bin/alarm_clock** podemos ver que tendríamos que tocar `GoodMorningHandler` y `GoodNightHandler`.

```ruby
spanish = Spanish.new
spanish_language = SpanishLanguage.new(spanish)

resolver = Resolver.new
resolver.register('GoodMorningCommand', GoodMorningHandler.new(display, spanish_language))
resolver.register('GoodNightCommand', GoodNightHandler.new(display, spanish_language))
```

Pues no los vamos a tocar, solo los vamos a configurar de manera diferente. Esta es la forma más sencilla:

```ruby
spanish_language = SpanishLanguage.new(Spanish.new)
english_language = EnglishLanguage.new(English.new)

resolver = Resolver.new
resolver.register('GoodMorningCommand', GoodMorningHandler.new(display, english_language))
resolver.register('GoodNightCommand', GoodNightHandler.new(display, english_language))
```

Aquí tienes el nuevo idioma inglés:

```ruby
class English
  def wakeup
    'Good morning'
  end

  def bed
    'Good night'
  end
end
```

Gracias al patrón adaptador no tenemos que preocuparnos de que la librería English tiene una interfaz diferente.

```ruby
class EnglishLanguage < Language
  def initialize(english)
    @english = english
  end

  def good_morning
    @english.wakeup
  end

  def good_night
    @english.bed
  end
end
```

Este cambio no es específico del uso de _Command Bus_, pero ilustra la idea de que podemos cambiar el comportamiento de la aplicación añadiendo código y reduciendo los cambios a áreas que tienen que ver con la configuración del sistema. En este caso, de los ejecutores en que estamos interesadas.

### Cambiar el comportamiento añadiendo ejecutores

Ahora queremos que, en lugar de mostrar la hora con números, nuestro reloj muestre los emojis de la hora. Esto nos remite aquí, donde asociamos el comando a un 

```ruby
resolver = Resolver.new

# Code removed for clarity

resolver.register('ShowTimeCommand', ShowTimeHandler.new(display))
```

```ruby
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
```

Pero lo mejor es introducir otro ejecutor para el comando `ShowTimeCommand`. Uno que sepa mostrar emojis:

```ruby
class EmojiShowTimeHandler
  def initialize(display)
    @display = display
  end

  def execute(command)
    raise ArgumentError, 'invalid command' unless command.is_a? ShowTimeCommand

    emojis = [
      "🕛", "🕐", "🕑", '🕒', "🕓", "🕔", "🕕", "🕖", "🕗", "🕘", "🕙", "🕚"
    ]
    pick = command.time % 12
    emoji = emojis[pick]

    @display.show("#{emoji}")
  end
end

```

Y únicamente tenemos que usar el nuevo ejecutor:

```ruby
resolver = Resolver.new

# Code removed for clarity

resolver.register('ShowTimeCommand', EmojiShowTimeHandler.new(display))
```

Y esto es lo que obtenemos. Hay un par de errores porque el comando que muestra los textos de alarma no usa emojis.

```
🕛
      Playing... Beep! Beep!
🕐
      Playing... Beep! Beep!
🕑
      Playing... Beep! Beep!
🕒
      Playing... Beep! Beep!
🕓
      Playing... Beep! Beep!
🕔
      Playing... Beep! Beep!
🕕
      Playing... Beep! Beep!
7:00 -> Good morning
      Playing... Sounding Alarm!!!
🕗
      Playing... Beep! Beep!
🕘
      Playing... Beep! Beep!
🕙
      Playing... Beep! Beep!
🕚
      Playing... Beep! Beep!
🕛
      Playing... Beep! Beep!
🕐
      Playing... Beep! Beep!
🕑
      Playing... Beep! Beep!
🕒
      Playing... Beep! Beep!
🕓
      Playing... Beep! Beep!
🕔
      Playing... Beep! Beep!
🕕
      Playing... Beep! Beep!
🕖
      Playing... Beep! Beep!
🕗
      Playing... Beep! Beep!
🕘
      Playing... Beep! Beep!
22:00 -> Good night
🕚
      Playing... Beep! Beep!
```

Bueno, siempre podríamos introducir otros ejecutores que usen emojis. O extraer esa funcionalidad de mostrar las horas como emojis y como números a otros objetos que podamos inyectar y usar como sea necesario.

Es como una forma de immutabilidad: para modificar el comportamiento de un ejecutor o arreglar un bug, no tenemos más que introducir uno nuevo con el nuevo comportamiento o con el fix. No hay necesidad de lidiar con modificaciones de código que nos puedan generar nuevos problemas.

### Algunas consideraciones

Esto debería ser un acicate para hacer ejecutores muy simples, que deleguen lo más posible en otros objetos para que se encarguen solo de coordinar u orquestar. Si los ejecutores son complicados no solo nos costaría modificarlos, sino también nos podría desanimar a escribir otros nuevos para reemplazarlos.

Para el mantenimiento de los ejecutores que dejan de usarse. Podríamos usar _feature toggles_, configuración u opciones en la línea de comandos, dependiendo de nuestras intenciones, para activar o desactivar su uso con facilidad.

```ruby
language = case language_option
when 'spanish'
             SpanishLanguage.new(Spanish.new)
           when 'english'
             EnglishLanguage.new(English.new)
           end

show_time_executor = case display_option
               when 'standard'
                 ShowTimeHandler.new(display)
               when 'emoji'
                 ShowTimeHandler.new(display)
               end

resolver = Resolver.new
resolver.register('GoodMorningCommand', GoodMorningHandler.new(display, language))
resolver.register('GoodNightCommand', GoodNightHandler.new(display, language))
resolver.register('PlayAlarmCommand', PlayAlarmHandler.new(sound))
resolver.register('PlayBeepCommand', PlayBeepHandler.new(sound))
resolver.register('ShowTimeCommand', show_time_executor)
```

Si no quieres mantener los servicios no usados, una vez comprobado que todo funciona puedes marcarlos como `deprecated`, comunicando así el mensaje de que debe dejar de usarse y eliminarlo en un plazo razonable.

Todo esto forma parte del setup de la aplicación, pero como puedes ver ninguno de estos cambios de comportamiento implica un cambio en la lógica de los ejecutores. Simplemente, introducimos cambios añadiendo código. Todo lo demás, son ajustes de configuración, mucho menos costosos y con muchísimo menos riesgo.

## Disfrutando con middlewares

Supongamos que la aplicación crece. Llega un momento en que es difícil sabe qué está pasando, incluso si has configurado bien el `Resolver`, etc. Podrías querer registrar toda la actividad de la aplicación en un log, o quizá chequear que un usuario está autorizado a realizar una cierta acción y un largo etcétera de cosas que no forman parte del dominio de la aplicación, sino que son cuestiones técnicas y que debes realizar para todas las acciones.

¿No sería genial poder interceptar de algún modo los comandos y hacer algo antes o después de ejecutar cada uno? Pues eso es lo que hacen los middlewares.

Se trata de unos objetos que colaboran con el `Command Bus` y que nos permiten hacer cosas antes y después de ejecutar cada comando. Están estructurados en una cadena o más bien una _pipeline_. 

Para empezar a entenderlo vamos a ir poco a poco. Antes de introducir los middlewares como tales, vamos a ver como reproducir su comportamiento con el propio `Command Bus`.

Nuestro primer ejemplo será hacer un log de todo lo que ocurre. Para ello, registraremos el comando recibido en el log. Y cuando haya terminado, añadiremos otra línea con el resultado.

Esto es lo que tenemos ahora:

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

Esto es lo que queremos hacer:

```ruby
class CommandBus
  def initialize(resolver)
    @resolver = resolver
  end

  def execute(command)

    log = File.open('clock.log', 'a')
    log.write("#{Time.now.strftime("%Y-%m-%d %H:%M:%S")}: Executing #{command.class.name}\n")

    executor = @resolver.executor_for(command)
    executor.execute(command)
    
    log.write("#{Time.now.strftime("%Y-%m-%d %H:%M:%S")}: #{command.class.name} finished\n")
    log.close
  end
end
```

Y aquí un ejemplo del resultado:

```ruby
2023-11-14 21:15:58: Executing ShowTimeCommand
2023-11-14 21:15:58: ShowTimeCommand finished
2023-11-14 21:15:58: Executing PlayBeepCommand
2023-11-14 21:15:58: PlayBeepCommand finished
2023-11-14 21:15:58: Executing ShowTimeCommand
2023-11-14 21:15:58: ShowTimeCommand finished
...
```

No ha estado mal, no hemos tenido que tocar ningún ejecutor y podemos ver toda la actividad de la aplicación. Pero, como es obvio, no queremos tener que modificar el `CommandBus` para cada cosa que se nos ocurra. Sería una pesadilla de mantenimiento.

Lo que nos interesa analizar aquí es el modo en que capturamos el comando antes y después de ejecutarlo. Y nos vamos a fijar especialmente en que el bloque que ejecuta el comando se mantiene intacto.

```ruby
    executor = @resolver.executor_for(command)
    executor.execute(command)
```

Lo voy a separar en un método:

```ruby
class CommandBus
  def initialize(resolver)
    @resolver = resolver
  end

  def execute(command)
    log = File.open('clock.log', 'a')
    log.write("#{Time.now.strftime("%Y-%m-%d %H:%M:%S")}: Executing #{command.class.name}\n")

    handle(command)

    log.write("#{Time.now.strftime("%Y-%m-%d %H:%M:%S")}: #{command.class.name} finished\n")
    log.close
  end

  def handle(command)
    executor = @resolver.executor_for(command)
    executor.execute(command)
  end
end
```

Ahora fíjate en este cambio:

```ruby
class CommandBus
  def initialize(resolver)
    @resolver = resolver
  end

  def execute(command)
    log(command)
  end
  
  def handle(command)
    executor = @resolver.executor_for(command)
    executor.execute(command)
  end

  def log(command)
    log = File.open('clock.log', 'a')
    log.write("#{Time.now.strftime("%Y-%m-%d %H:%M:%S")}: Executing #{command.class.name}\n")

    handle(command)

    log.write("#{Time.now.strftime("%Y-%m-%d %H:%M:%S")}: #{command.class.name} finished\n")
    log.close
  end
end
```

Aquí se puede ver más claro cómo `log` _envuelve_ la ejecución de `command`. `log` recibe el `command` y en un momento dado se lo pasa de nuevo al bus a través del método `handle`.

Hemos aprendido cómo funciona un `middleware`. Ahora bien. Si quisiésemos añadir una nueva etapa de procesamiento seguir por este camino sería infructuoso. Tendríamos que modificar el `CommandBus` cada vez. Para estar abiertas a extensión tenemos que extraer la lógica del Logger a otro objeto.

Hagamos un experimento:

```ruby
class CommandLoggerMiddleware
  def execute(command, bus)
    log = File.open('clock.log', 'a')
    log.write("#{Time.now.strftime("%Y-%m-%d %H:%M:%S")}: Executing #{command.class.name}\n")

    bus.handle(command)

    log.write("#{Time.now.strftime("%Y-%m-%d %H:%M:%S")}: #{command.class.name} finished\n")
    log.close
  end
end
```

Y así queda el `CommandBus`:

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

Por supuesto, hemos tenido que hacer cambios. El código es más o menos el mismo, con la salvedad de que ahora podemos inyectar distintos _middlewares_, aunque solo uno cada vez. Ya veremos como mejorar en ese aspecto. Lo que nos tenemos que quedar ahora es que estamos en condiciones de cambiar el comportamiento del `CommandBus` añadiendo código y cambiando solo la forma en que se configura en construcción.

Así, por ejemplo, vamos a añadir este Middleware que captura los errores y los reporta en un archivo `errors.log`:

```ruby
class ErrorLoggerMiddleware
  def execute(command, bus)
    log = File.open('errors.log', 'a')
    begin
    bus.handle(command)
    rescue => e
      log.write("#{Time.now.strftime("%Y-%m-%d %H:%M:%S")}: #{command.class.name} error: #{e.class.name} with message #{e.message}\n")
    end
    log.close
  end
end
```


Vamos a provocar un error, configurando un comando con el ejecutor incorrecto:

```ruby
resolver = Resolver.new

# Code removed for clarity

resolver.register('ShowTimeCommand', PlayBeepHandler.new(sound))
```

Y, obviamente, tenemos que indicar que usaremos otro middleware:

```ruby
errors = ErrorLoggerMiddleware.new

command_bus = CommandBus.new(resolver, errors)

clock = AlarmClock.new(command_bus, 7, 22)
clock.run
```

Y aquí tenemos el _log_ de una ejecución completa:

```ruby
2023-11-15 09:23:55: ShowTimeCommand error: ArgumentError with message invalid command
2023-11-15 09:23:55: ShowTimeCommand error: ArgumentError with message invalid command
2023-11-15 09:23:55: ShowTimeCommand error: ArgumentError with message invalid command
2023-11-15 09:23:55: ShowTimeCommand error: ArgumentError with message invalid command
2023-11-15 09:23:55: ShowTimeCommand error: ArgumentError with message invalid command
2023-11-15 09:23:55: ShowTimeCommand error: ArgumentError with message invalid command
2023-11-15 09:23:55: ShowTimeCommand error: ArgumentError with message invalid command
2023-11-15 09:23:55: ShowTimeCommand error: ArgumentError with message invalid command
...
```

Nos vendría bien añadir más información en este _log_, pero creo que se ve bien el argumento: Puedo cambiar lo que ocurre en el `CommandBus` sin tocar su código. 

Ahora bien, vamos a tener que tocar un poco el código hasta obtener un sistema de _Command Bus_ que admita una sucesión de _Middlewares_, porque nada sería más interesante que poder combinar una variedad de ellos. En pocas palabras lo que necesitamos es:

* Poder registrar n _middlewares_ en el `CommandBus`.
* Hacer que cada middleware pueda invocar al siguiente, si sabe cuál es.
* Cada middleware tiene que ejecutar su propio código
* Finalmente, se debe ejecutar el comando.

Una lista ligada podría darnos una solución a los dos primeros puntos. La lista ligada nos permite componer objetos de tal forma que podemos recorrer la totalidad de la lista desde el primero al último, siguiendo una referencia. El último elemento de la lista no tiene siguiente.

Los puntos tercero y cuarto nos los da una simple decisión: si el middleware actual tiene un _siguiente_ definido, delega en él. Si el middleware es el último invocará el ejecutor del comando.

Esto queda reflejado en este _middleware_ base:

```ruby
class Middleware
  def initialize(next_middleware = nil)
    @next = next_middleware
  end

  def execute(command, bus)
    handle(command, bus)
  end

  def handle(command, bus)
    if @next.nil?
      bus.handle(command)
    else
      @next.execute(command, bus)
    end
  end
end
```

Y así quedaría un ejemplo concreto. El _middleware_ hace lo suyo en el método execute e invoca `handle` para que gestione el comando, que en último término delega en la superclase.

```ruby
class CommandLoggerMiddleware < Middleware
  def initialize(next_middleware = nil)
    super
  end
  
  def execute(command, bus)
    log = File.open('clock.log', 'a')
    log.write("#{Time.now.strftime("%Y-%m-%d %H:%M:%S")}: Executing #{command.class.name}\n")

    handle(command, bus)

    log.write("#{Time.now.strftime("%Y-%m-%d %H:%M:%S")}: #{command.class.name} finished\n")
    log.close
  end
  
  def handle(command, bus)
    super
  end
end
```

Otro ejemplo:

```ruby
class ErrorLoggerMiddleware < Middleware
  def initialize(next_middleware = nil)
    super
  end
  def execute(command, bus)
    log = File.open('errors.log', 'a')
    begin
      handle(command, bus)
    rescue => e
      log.write("#{Time.now.strftime("%Y-%m-%d %H:%M:%S")}: #{command.class.name} error: #{e.class.name} with message #{e.message}\n")
    else
      log.write("#{Time.now.strftime("%Y-%m-%d %H:%M:%S")}: #{command.class.name} OK\n")
    end
    log.close
  end

  def handle(command, bus)
    super
  end
end
```

Aquí tienes un ejemplo de configuración:

```ruby
errors = ErrorLoggerMiddleware.new
logger = CommandLoggerMiddleware.new(errors)

command_bus = CommandBus.new(resolver, logger)
```

El cual podríamos expresar así, lo que nos da pistas del orden en que se aplican:

```ruby
middlewares = CommandLoggerMiddleware.new(
  ErrorLoggerMiddleware.new
)

command_bus = CommandBus.new(resolver, middlewares)
```

Como dato curioso, mencionar que no hemos tenido que tocar el código de `CommandBus`, ya que al pasar los _middlewares_ en forma compuesta, desde el punto de vista del bus es un único objeto.

### Saltarse la cadena

Hay ocasiones en las que querrás evitar la ejecución de un comando de forma condicional o no. Por ejemplo, dependiendo de si el usuario tiene permisos para ello o no. O tal vez, a través de algún modificador.

Imagina que quieres tener un dry run de tu aplicación. Esta es una modalidad que ejecuta la aplicación sin hacer nada, pero nos sirve para ver qué efectos podría tener. Yo lo voy a implementar con un _middleware_.

```ruby
class DryRunMiddleware < Middleware
  def initialize(dry, next_middleware = nil)
    @dry = dry
    super(next_middleware)
  end

  def execute(command, bus)
    handle(command, bus)
  end

  def handle(command, bus)
    if @next.nil?
      bus.handle(command) unless @dry
      puts "Executing #{command.class.name}" if @dry
    else
      @next.execute(command, bus)
    end
  end
end
```

Que se configuraría así:

```ruby
middlewares =
  CommandLoggerMiddleware.new(
    ErrorLoggerMiddleware.new(
      DryRunMiddleware.new(true)
    )
  )

command_bus = CommandBus.new(resolver, middlewares)
```

Tal cual está escrito tiene que ejecutarse el último, pero nos sirve para mostrar que podemos cambiar el método `handle` a fin de gestionar de forma particular la decisión acerca de pasar el comando al siguiente middleware o al bus.

El resultado es que por pantalla ya no nos sale el reloj, sino esto:

```ruby
Executing ShowTimeCommand
Executing PlayBeepCommand
Executing ShowTimeCommand
Executing PlayBeepCommand
Executing ShowTimeCommand
...
```

Y cambiando el parámetro a `false`, se ejecuta la aplicación con toda normalidad.

## Concluyendo

Usar CommandBus nos permite una flexibilidad tremenda para configurar y modificar el comportamiento de las aplicaciones, así como separación de los asuntos de negocio, de muchos de sus aspectos técnicos.

En la primera parte del artículo hemos visto como podemos aprovechar el CommandBus para gestionar fácilmente cambios de comportamiento no destructivos en nuestras aplicaciones. Basta configurar los ejecutores de forma diferente, o escribir otros nuevos con los cambios necesarios.

En la segunda parte, hemos hablado sobre los _middlewares_, una forma de modificar el comportamiento del propio CommandBus sin tener que tocar su código.

Llegadas a este punto puede que me preguntes por las Queries. ¿Existe un QueryBus? Pues sí, es exactamente lo mismo que el CommandBus, pero devolviendo una respuesta. De hecho, he visto librerías de buses que usan por debajo el mismo MessageBus genérico, ignorando la respuesta o no dependiendo de si es CommandBus o QueryBus.

A pesar de lo que hemos dicho de la flexibilidad del bus para modificar el comportamiento de la aplicación sin cambiar su código, es cierto es que todavía no la hemos conseguido del todo: la decisión sobre qué comandos lanzar sigue _hardcoded_. 

Podríamos solucionar esto de varias maneras. Una de ellas es mediante eventos, para lo que necesitaríamos un bus de eventos. Pero de eso preferiría ocuparme en otro artículo.
