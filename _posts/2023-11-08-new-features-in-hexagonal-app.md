---
layout: post
title: Como añadir features en arquitectura hexagonal
categories: articles
tags: good-practices design-patterns hexagonal
---

En un equipo de desarrollo orientado a producto las nuevas prestaciones solo tienen sentido si la usuaria o cliente puede usarlas.

La mejor _definition of done_ que he conocido dice algo así como: _la usuaria o cliente puede usar la prestación_. Cualquier otra consideración es superflua... y he tenido la oportunidad de conocer algunas _defintions of done_ realmente complejas con un montón de requisitos. Por supuesto, hay que tener en cuenta que en algunos dominios altamente regulados, como puede ser el sector de la salud, sí que debemos fijarnos en cumplir ciertos requisitos antes de dar por terminada una historia de usuario. En cualquier caso, muchos de ellos podrían incluirse como tales en la propia especificación de la historia.

Pero bueno, centrándonos en el objetivo del artículo, lo que querría desarrollar en esta ocasión es cómo trabajar una prestación en la que un actor está interesado cuando el proyecto está desarrollado sobre el patrón de arquitectura hexagonal.

## Sobre la partición de proyectos

Desarrollar una prestación en Arquitectura Hexagonal requiere que trabajemos en:

* la lógica de negocio o dominio dentro del hexágono
* el puerto implicado
* el adaptador

Por supuesto, dependiendo del estado de desarrollo del proyecto podemos encontrarnos con que ya existen algunos elementos que podemos utilizar, como podría ser que el puerto esté definido, que exista ya un adaptador que podemos extender, etc.

Por supuesto, esto me lleva a considerar también la forma en que definimos las prestaciones que vamos a implementar y cómo abordamos los proyectos. 

En la lista que acabo de escribir hago referencia a un único puerto y un único adaptador. Hay prestaciones que podrían implicar varios puertos y/o varios adaptadores. O que sería interesante que una cierta prestación pueda ejecutarse vía interfaz web, que esté disponible como API o interfaz CLI.

Desde un punto de vista de desarrollo iterativo e incremental, yo las trataría como tres prestaciones diferentes. De hecho, es probable que estemos hablando de tres actores distintos. Imaginemos estas situaciones:

* La interfaz web se usa en una aplicación interna de atención al cliente.
* La API sería necesaria para desarrollar una aplicación móvil, que es como acceden nuestras usuarias.
* La interfaz CLI podríamos necesitarla para poder lanzar esa prestación en lotes, o mediante un cron, por la razón que sea.

Por eso, aunque la lógica de dominio sea exactamente la misma, estaríamos hablando de prestaciones diferentes que interesan a actores diferentes.

¿Cómo priorizar este desarrollo? Puedes encontrar ideas en [este artículo sobre desarrollo iterativo incremental](/iterative_incremental/). En líneas generales, el planteamiento es el siguiente:

El requerimiento de que la prestación tiene que estar en manos de las usuarias nos dice que tenemos que trabajar toda la conversación. Como mencionamos antes: lógica de negocio, puerto y adaptador, que permitan entregar una prestación usable. Pero una vez que hayamos desarrollado la prestación para un actor, para los otros será añadir tan solo el adaptador.

En este caso, la cuestión es decidir a qué actor servir primero, para lo cual podríamos atender a una variedad de criterios que también se comentan en [el artículo enlazado](/iterative_incremental/).

En resumen, todo esto para argumentar que necesitamos decidir por dónde empezar el desarrollo y que debemos contemplarlo globalmente, poniéndonos en el lugar del actor. La pregunta siempre tiene que ser ¿qué es lo más importante que deberíamos estar haciendo ahora que aporte valor? Y una vez que lo sabemos, ¿cómo podemos abordarlo?

## Un ejemplo práctico

Para ilustrar este proceso vamos a implementar una nueva prestación en el proyecto `storage`. En este caso, es la capacidad de configurar una oficina con un cierto número de contenedores de cada tamaño.

Para no desviar mucho la atención del objetivo del artículo, lo que haré será implementar un comando CLI, al igual que hicimos en [el artículo anterior de la serie sobre crear un adaptador](/hexagonal-5/).

Lo que quiero es analizar la problemática de desarrollar una prestación en AH, desde la perspectiva del actor. Podríamos desarrollar la lógica de negocio dentro del hexágono, pero entonces estaría inaccesible al actor. Por tanto, es necesario abordar el desarrollo del puerto y del adaptador.

De hecho, en los artículos anteriores lo hicimos de esta forma aislada por lo que me ha quedado un mal regusto del resultado. Aunque lo justifico pensando que así ponía el foco en entender los elementos de la arquitectura, pese a que la aplicación en sí no estuviese muy bien.

Así que vamos a ello.

## Definiendo lo que queremos

En pocas palabras, queremos que se pueda configurar el sistema de almacenaje definiendo el número de contenedores por tamaño, mediante línea de comandos.

Algo así:

```bash
storage configure --small=4 --medium=3 --large=3
```

Como respuesta, deberíamos tener algo así:

```
Configured storage:

* Small: 4
* Medium: 3
* Large: 3
```

Algunas especificaciones más:

* Hay que indicar al menos un tamaño y cantidad.
* Si no se pasa ninguno se muestra el estado actual. Es decir `storage configure` muestra la configuración que esté vigente. Si está sin configurar muestra un mensaje del tipo `Storage is not configured`.
* Si el sistema ya está configurado nos dará un error porque no se puede cambiar. Quizá en el futuro podamos plantear otras cosas, pero de momento ya nos va bien así.

Por supuesto, quiero empezar con un test. Más exactamente con BDD, definiendo una feature de configuración.

En ese sentido, pienso que el primer escenario podría ser el de obtener la configuración actual, aunque sepamos que está vacía. La razón es que es suficiente para requerir el subcomando `configure` en el adaptador de CLI e invocar un caso de uso en la aplicación. 

## Preparación

Como preparación a este artículo, he estado trabajando bastante en el proyecto. Aunque esencialmente se mantiene la misma estructura, he ido reescribiendo o refactorizando partes a medida que he ido aprendiendo sobre el propio proyecto, tanto al revisar código como al experimentar con él. Los cambios de código no invalidan las líneas generales que he ido explicando en los artículos anteriores de la serie, pero seguramente habrá que matizarlo. Estoy pensando que el próximo artículo de la serie sea un resumen de las prácticas, organización de código, etc.

Uno de los puntos clave de estos cambios ha sido reescribir los pasos de los tests BDD. Al principio lo hice ejercitando directamente los comandos y handlers, lo que resultó relativamente útil para empezar a desarrollar. Sin embargo, creo que acabó haciendo confuso el desarrollo y la estructura.

Esta vez, he ido un poco más lejos y he cambiado estos pasos para que las features sean tests end to end. Es decir, el sistema se testea como actor usuario del adaptador de CLI. Es casi como ejecutar el comando dentro de un test. Esto se podría hacer exactamente así, dicho sea de paso, pero el código necesita aún un grado de madurez que no tenemos.

Este es un ejemplo. Como se puede ver, las llamadas a `@storage.run` se parecen bastante a lo que sería el comando de _shell_ y nos aprovechamos de la simplicidad de configurar el sistema con componentes en memoria. Para producción o tests que ejecuten la línea de comandos, necesitaríamos persistencia indefinida.

```ruby
# frozen_string_literal: true

require_relative "../../setup/cli_adapter_factory"

Given(/^there is enough capacity$/) do
  enough_capacity_conf = {
    small: 1,
    medium: 1,
    large: 1
  }
  @storage = CliAdapterFactory.for_test(enough_capacity_conf)
end

When("Merry registers a package") do
  @output = capture_stdout { @storage.run(%w[register some-locator small]) }
end

Then("first available container is located") do
  @container_name = @output.split.last
  expect(@container_name).to eq("s-1")
end

Then("he puts the package into it") do
  output = capture_stdout { @storage.run(["store", @container_name]) }
  expect(output).to eq("package stored in container #{@container_name}\n")
end

# There is no enough space for allocating package

Given("no container with enough space") do
  no_container_conf = {}
  @storage = CliAdapterFactory.for_test(no_container_conf)
end

Then("there is no available container") do
  expect(@output).to include("no space available")
end

Then("package stays in queue") do
  expect(@output).to include("Package some-locator is in waiting queue")
end

Given("an empty {string} container") do |capacity|
  one_container_conf = {}
  one_container_conf[capacity.to_sym] = 1
  @storage = CliAdapterFactory.for_test(one_container_conf)
end

When("Merry registers a {string} size package") do |size|
  @output = capture_stdout { @storage.run(["register", "some-locator", size]) }
end

Then("package is allocated in container") do
  @container_name = @output.split.last
  expect(@container_name).to eq("s-1")
end

# Container with packages in it and not enough free space

Given("a {string} package stored") do |size|
  output = capture_stdout { @storage.run(["register", "large-pkg", size]) }
  container_name = output.split.last
  @storage.run(["store", container_name])
end

def capture_stdout
  original = $stdout
  foo = StringIO.new
  $stdout = foo
  yield
  $stdout.string
ensure
  $stdout = original
end

```

## Definiendo la _feature_

### Un escenario mínimo

Empezamos con este escenario mínimo. Cuando el sistema no está configurado, nos dice que no lo está. Será suficiente para montar el flujo de ejecución básico a través del adaptador y el hexágono, sin forzarnos a introducir casi nada de lógica.

```gherkin
Feature: Configuring the system
  We can configure the system with an arbitrary number of containers with different sizes

  Rules:
    - Containers can have capacity for 4, 6 or 8 volumes, so:
    * Small = 4 vol
    * Medium = 6 vol
    * Large = 8 vol

  Scenario: Empty system
    Given the system is not configured
    When Merry sends no configuration
    Then System shows status
      """
      Configured storage:

      System is not configured
      """
```

Que se traduce en los siguientes pasos:

```ruby
require_relative "../../setup/cli_adapter_factory"

Given(/^the system is not configured$/) do
  @storage = CliAdapterFactory.for_test({})
end

When(/^Merry sends no configuration$/) do
  @output = capture_stdout { @storage.run(%w[configure]) }
end

Then(/^System shows status$/) do |text|
  expect(@output).to include(text)
end
```

Hacer pasar este escenario me obliga a introducir todos los elementos necesarios para tener un _walking skeleton_ de la feature. 

Vamos a ver todos los elementos. En primer lugar, `CliAdapter` que va a recibir todos los argumentos pasados al script desde la terminal. `CliAdapter` usa `ActionFactory` para que esta construya la Action que se debe ejecutar.

```ruby
class CliAdapter
  def initialize(action_factory)
    @action_factory = action_factory
  end

  def run(args)
    action = @action_factory.for_subcommand(args)
    puts(action.execute)
  end
end
```

Las _*Actions_ en este proyecto no son más que la extracción a objetos del código que se debe ejecutar al identificar un subcomando. Es importante señalar que no son un concepto de la arquitectura hexagonal ni de ninguna otra, sino una forma de organizar el código de este adapter específico.

Aquí podemos ver cómo `ActionFactory` obtiene el subcomando y sus parámetros, devolviendo la Action adecuada y ya configurada con todo lo necesario.

```ruby
class ActionFactory
  def initialize(command_bus, query_bus)
    @command_bus = command_bus
    @query_bus = query_bus
  end

  def for_subcommand(args)
    sub_command = args[0]
    case sub_command
    when "register"
      locator = args[1]
      size = args[2]
      RegisterPackageAction.new(@command_bus, @query_bus, locator, size)
    when "store"
      container = args[1]
      StorePackageAction.new(@command_bus, container)
    when "configure"
      conf = {}
      ConfigureAction.new(@command_bus, conf)
    else
      NoAction.new
    end
  end
end

```

`ConfigureAction` es la traducción del subcomando `configure` de nuestro script de consola y es la que necesitamos desarrollar ahora.

Como se puede ver ejecuta el comando `Configure`, pasándoselo al `CommandBus` y espera recibir una excepción en caso de que `Containers` no esté configurado todavía. El _happy path_, en este caso, consiste en no hacer nada. Pero esto es suficiente para lograr lo que queremos, que es invocar `ConfigureHandler`.

```ruby
class ConfigureAction
  def initialize(command_bus, conf)
    @command_bus = command_bus
    @conf = conf
  end

  def execute
    @command_bus.execute(Configure.new(@conf))
  rescue ContainersNotYetConfigured
    puts "Configured storage:\n\nSystem is not configured"
  else
    puts "Should do something about configuration success"
  end
end
```

`ConfigureHandler` no hace gran cosa en este momento. Se limita a arrojar una excepción, la cual es capturada en `ConfigureAction`, que pone el mensaje deseado en la consola.

```ruby
class ConfigureHandler
  def initialize(containers)
    @containers = containers
  end

  def handle(configure)
    raise ContainersNotYetConfigured.new
  end
end
```

Con esto, tenemos todos los elementos básicos para confeccionar la feature completa y ya sabemos que invocando en la terminal `storage configure ...` se pondrán en uso. Por supuesto, el siguiente paso sería implementar la capacidad de configurar el almacenamiento.

### _CommandBus_?

Puede que a estas alturas te estés preguntado cómo es nuestro `CommandBus`. Lo cierto es que no es nada sofisticado... más bien es bastante burdo. Y `QueryBus` es similar.

```ruby
class CommandBus
  def initialize(queue, containers)
    @queue = queue
    @containers = containers
  end

  def execute(command)
    if command.instance_of?(RegisterPackage)
      RegisterPackageHandler.new(@queue).handle(command)
    end
    if command.instance_of?(StorePackage)
      StorePackageHandler.new(@queue, @containers).handle(command)
    end
    if command.instance_of?(Configure)
      ConfigureHandler.new(@containers).handle(command)
    end
  end
end
```

Como se puede ver es la mínima expresión de un _CommandBus_. Simplemente, identifica el comando que recibe, instancia el _handler_ adecuado y ejecuta su método `handle`, pasándole el comando.

No es más que una solución simple para tener una prueba de concepto que sea funcional. Por supuesto, en un futuro se puede reemplazar por una solución más _profesional_.

### Configurando algo

Tenemos dos posibles opciones para seguir ahora. Una es seguir por la lína de `storage configure` para que, partiendo de un sistema configurado, nos lo muestre en pantalla. La otra opción es introducir una configuración, aunque solo sea parcial. Lo cierto es que, en producción, necesitamos tener la posibilidad de configurar el sistema, así que vamos primero con esto, ya que entregamos más valor.

Lo que querríamos conseguir es algo así:

```shell
storage configure --small=2 --medium=3 --large=1
```

Esto supone que nuestro `CliAdapter` tiene que ser capaz de obtener esas opciones y pasárselos al comando `Configure`. Como hemos visto más arriba, eso se hace en `ActionFactory`.

Pero procesar tres opciones puede ser un poco complicado. Por esa razón vamos a empezar solo con una opción. Generalizarlo a más opciones debería ser fácil. 

```shell
storage configure --small=2
```

En forma de escenario, lo voy a poner así:

```gherkin
  Scenario: Empty system
    Given the system is not configured
    When Merry configures 2 "small" containers
    Then System shows status
      """
      Configured storage:

      * Small: 2
      * Medium: 0
      * Large: 0
      """
```

Traducido a pasos, quedaría algo como esto:

```ruby
Given(/^the system is not configured$/) do
  @storage = CliAdapterFactory.for_test({})
end

When(/^Merry sends no configuration$/) do
  @output = capture_stdout { @storage.run(%w[configure]) }
end

Then(/^System shows status$/) do |text|
  expect(@output).to include(text)
end

When(/^Merry configures (\d+) "([^"]*)" containers$/) do |qty, size|
  @output = capture_stdout { @storage.run(['configure', "--#{size}=#{qty}"]) }
end
```

Las opciones se reciben como strings de la forma "--opcion=valor", con lo que tendría que ser fácil discriminarlas en el array de argumentos y parsearlas, por ejemplo, con una expresión regular. Incluso, podríamos buscar específicamente por las opciones con un nombre específico como sería el caso de `small`, `medium` o `large`.

En este caso, comenzaré introduciendo un objeto `OptionParser` al que pasar el mensaje `by_name_or_default`. Si la opción no está, puede poner un valor por defecto. De momento, no hace gran cosa.

```ruby
class OptionParser
  def initialize(args)
    @args = args
  end
  def by_name_or_default(name, default)
    raise NotImplementedError
  end
end
```

En principio, queremos poder usarlo de esta forma:

```ruby
class ActionFactory
  def initialize(command_bus, query_bus)
    @command_bus = command_bus
    @query_bus = query_bus
  end

  def for_subcommand(args)
    parser = OptionParser.new(args)
    sub_command = args[0]
    case sub_command
    when "register"
      locator = args[1]
      size = args[2]
      RegisterPackageAction.new(@command_bus, @query_bus, locator, size)
    when "store"
      container = args[1]
      StorePackageAction.new(@command_bus, container)
    when "configure"
      conf = {}
      small = parser.by_name_or_default("small", 0).to_i
      conf[:small] = small unless small == 0
      ConfigureAction.new(@command_bus, conf)
    else
      NoAction.new
    end
  end
end
```

Al tirar la excepción `NotImplementedError` el propio test nos va a decir que debemos implementar ese método, cosa que podemos hacer mediante TDD. No voy a ir paso por paso, pero este sería el resultado.

La especificación:

```ruby
RSpec.describe "OptionParser" do
  before do
    # Do nothing
  end

  after do
    # Do nothing
  end

  context "When options are not present" do
    it "should return default" do
      parse(
        example: "subcommand",
        option_name: "option",
        default: 0,
        expected: 0
      )
    end
  end

  context "When options are passed" do
    it "should return value of desired option" do
      parse(
        example: "subcommand --option=3",
        option_name: "option",
        default: 0,
        expected: "3"
      )
    end
    it "should return default if not found" do
      parse(
        example: "subcommand --another=3",
        option_name: "option",
        default: 0,
        expected: 0
      )
    end
    it "should return default if value not specified" do
      parse(
        example: "subcommand --option=",
        option_name: "option",
        default: 0,
        expected: 0
      )
    end
  end
end

def parse(default:, example:, expected:, option_name:)
  parser = OptionParser.new(example.split(" "))
  expect(parser.by_name_or_default(option_name, default)).to eq(expected)
end
```

Y aquí el parser de opciones. Lo que hace es recorrer todos los argumentos y si cumplen el patrón "--name=valor" lo devuelve. Si no encuentra ningún valor, devuelve lo que hayamos indicado por defecto. Este es uno de esos ejemplos en los que Ruby puede resultar tan expresivo y natural:


```ruby
class OptionParser
  def initialize(args)
    @args = args
  end

  def by_name_or_default(name, default)
    @args.each do |part|
      part.match(/--#{name}=(.*)/) do |matches|
        return matches[1] unless matches[1] == ""
      end
    end
    default
  end
end
```

Con esto, podemos ejecutar el escenario que ahora podrá pasar a invocar la `ConfigureAction` y, en consecuencia, el handler adecuado dentro del hexágono. Ahora tenemos que modificar el código para que el escenario anterior siga pasando, pero nos diga que debemos implementar algo. Creo que esto podría servir:

```ruby
class ConfigureHandler
  def initialize(containers)
    @containers = containers
  end

  def handle(configure)
    if configure.conf == {} and !@containers.configured?
      raise ContainersNotYetConfigured.new
    end

    raise NotImplementedError.new
  end
end
```

Y añadimos de momento este método en Containers para saber si ya está configurado o no.

```ruby
class InMemoryContainers
  def initialize
    @containers = []
  end

  def configured?
    @containers != []
  end
  
  # Code removed for clarity
   
end
```

En fin, que gracias a esto ya nos pide que implementemos algo en el _handler_ al lanzar el error. En este punto, también nos movemos a un ciclo de TDD clásica. Por el momento haremos que reconfigurar los contenedores equivalga a reemplazar la configuración existente si está vacía. En caso de que ya esté configurado, no se hace ningún cambio.

```ruby
RSpec.describe "ConfigureHandler" do
  context "Containers not configured" do
    it "should reconfigure with passed configuration" do
      containers = InMemoryContainers.configure({})
      handler = ConfigureHandler.new(containers)
      handler.handle(Configure.new({small: 3}))
      expect(containers.total_space).to eq(Capacity.new(12))
    end
  end
end
```

```ruby
class ConfigureHandler
  def initialize(containers)
    @containers = containers
  end

  def handle(configure)
    if configure.conf == {} and !@containers.configured?
      raise ContainersNotYetConfigured.new
    end
    @containers.reconfigure(configure.conf)
  end
end
```

Esto, a su vez, nos pedirá implementar `reconfigure` en containers. Dado que el test del handler espera ese comportamiento, nos podría servir para el desarrollo de ese método de forma rápida. Es más riguroso, en cambio, especificar este comportamiento en `containers_spec`, que nos servirá para que cualquier implementación de containers deba cumplir.

Algo así:

```ruby
shared_examples "a Containers" do
  it { is_expected.to respond_to(:available) }
  it { is_expected.to respond_to(:reconfigure) }

  before do
    @containers = described_class.new
  end

  # Code removed for clarity

  describe ".reconfigure" do
    it "should have capacity of containers configured" do
      @containers.reconfigure({small: 1})
      expect(@containers.total_space).to eq(Capacity.new(4))
    end
    it "should have capacity of containers combined" do
      @containers.reconfigure({small: 2, medium: 2})
      expect(@containers.total_space).to eq(Capacity.new(20))
    end
    it "should not change if already configured" do
      @containers = described_class.configure({small: 2})
      @containers.reconfigure({small: 4})
      expect(@containers.total_space).to eq(Capacity.new(8))
    end
  end
end

```

Como nota al margen: en este punto del proyecto no estoy muy contento con varias cosas. Así que es posible que se vean incongruencias entre el código mostrado en el artículo y el que se puede consultar en el repo del proyecto. Por supuesto, este siempre tiene la versión _buena_.

Una cosa que no tuve en cuenta al principio es que no se hace nada para obtener la configuración, por lo que `ConfigureAction` no puede mostrar nada reflejando que se ha realizado la configuración con éxito. Aquí nos haría falta una query, por lo que `ConfigureAction` podría ser algo así:

```ruby
class ConfigureAction
  def initialize(command_bus, query_bus, conf)
    @command_bus = command_bus
    @query_bus = query_bus
    @conf = conf
  end

  def execute
    @command_bus.execute(Configure.new(@conf))
  rescue ContainersNotYetConfigured
    puts "Configured storage:\n\nSystem is not configured"
  else
    response = @query_bus.execute(GetConfiguration.new)
    puts <<-EOT
    Configured storage:

    * Small:  #{response.small}
    * Medium: #{response.medium}
    * Large:  #{response.large}
    EOT
  end
end
```

A grandes rasgos, introduciremos los objetos necesarios e iremos conectando todo hasta obtener el correspondiente _Walking Sekeleton_ que nos lleve a ejecutar el _handler_. De nuevo, hacemos explícito que no está implementado para que los propios tests nos pidan hacerlo.

```ruby
class GetConfigurationHandler
  def initialize(containers)
    @containers = containers
  end

  def handle(query)
    raise NotImplementedError
  end
end
```

Una vez que conseguimos que al ejecutar el test se muestre el error `NotImplementedError` pasamos a desarrollar esta pieza usando TDD.

En el ejemplo anterior utilicé el fake _InMemoryContainers_. Como tal fake, tiene que implementar el comportamiento del rol `Containers` por lo que introdujimos el método `reconfigure` y lo implementamos.

Otra aproximación para hacer lo mismo es usar dobles, de tal modo que no implementamos nada en Containers, sino que simulamos su comportamiento con el doble. De este modo, aprendemos como lo queremos usar. Voy a intentar mostrar el ejemplo.

Por ejemplo, podemos empezar con un test en el que suponemos que `Containers` no está configurado todavía. Mi idea es que el handler devuelva como respuesta una estructura de datos con todos los campos a 0.

```ruby
GetConfigurationResponse = Struct.new(:small, :medium, :large)
```

Para ello, necesito simular que `Containers` devolverá, a su vez, una estructura similar con los datos de configuración. Lo que todavía no sé es cómo voy a implementar eso, por lo que hacer un doble de ese comportamiento me permite definir como lo voy a invocar y qué respuesta espero. Esto queda recogido en el siguiente test:

```ruby
RSpec.describe "GetConfigurationHandler" do
  
  context "when empty containers" do
    it "should show all sizes 0" do
      containers = double("containers")
      allow(containers).to receive(:configuration) {
        r = Struct.new(:small, :medium, :large)
        r.new(0, 0, 0)
      }

      handler = GetConfigurationHandler.new(containers)
      response = handler.handle(GetConfiguration.new)
      expected = GetConfigurationResponse.new(
        small: 0,
        medium: 0,
        large: 0
      )
      expect(response).to eq(expected)
    end
  end
end
```

La implementación del handler es sencilla, porque la _chicha_ está en otra parte. 

```ruby
class GetConfigurationHandler
  def initialize(containers)
    @containers = containers
  end

  def handle(query)
    conf = @containers.configuration
    GetConfigurationResponse.new(
      small: conf.small,
      medium: conf.medium,
      large: conf.large
    )
  end
end
```

Con esto resuelvo este paso. Podría probar con otros valores de configuración, pero realmente, el _handler_ lo único que hace es pedirle la configuración al objeto `Containers` y prepara la respuesta con esos datos. No hay muchas vueltas que darle.

Ahora bien, si ejecutamos la _feature_, que sería el test _end to end_, veremos que falla porque el método `configuration` no está definido todavía en `InMemoryContainers`, que es la implementación que estamos usando. De nuevo, es una llamada a desarrollarlo en un ciclo de TDD clásico.

```ruby
shared_examples "a Containers" do
  it { is_expected.to respond_to(:available) }
  it { is_expected.to respond_to(:reconfigure) }
  it { is_expected.to respond_to(:configured?) }
  it { is_expected.to respond_to(:configuration) }

  before do
    @containers = described_class.new
  end

  # Code removed for clarity

  describe ".configuration" do
    it "should show 0 containers of each type if not configured" do
      conf = @containers.configuration
      expect(conf.small).to eq(0)
      expect(conf.medium).to eq(0)
      expect(conf.large).to eq(0)
    end

    it "should show current configuration" do
      @containers.reconfigure({small: 2, medium: 4, large: 5})
      conf = @containers.configuration
      expect(conf.small).to eq(2)
      expect(conf.medium).to eq(4)
      expect(conf.large).to eq(5)
    end
  end
end
```

Esto lo resuelvo con el siguiente método que es muy poco OOP, pero que ahora mismo resuelve lo que necesito:


```ruby
  def configuration
    conf = Struct.new(:small, :medium, :large)
    c = conf.new(0, 0, 0)
    @containers.each do |container|
      c.small = c.small + 1 if container.is_a? SmallContainer
      c.medium = c.medium + 1 if container.is_a? MediumContainer
      c.large = c.large + 1 if container.is_a? LargeContainer
    end
    c
  end
```

Se me ocurren dos formas de hacer esto mismo, con mayor limpieza.

* Guardar la configuración original en una propiedad de `Containers`. Cuando se recibe la configuración se generan los contenedores necesarios, pero para saber los que tenemos debemos contarlos. El problema de guardar la configuración a mayores es que en algún momento podría desincronizarse.
* Pasar la struct a cada `container`, de tal forma que cada uno la incremente como corresponda. Esta es la forma más OOP, ya que no tenemos que preguntar a cada container de qué tipo es.

Algo así:

```ruby
  def configuration
    conf = Struct.new(:small, :medium, :large)
    c = conf.new(0, 0, 0)
    @containers.each do |container|
      c = container.count(c)
    end
    c
  end
```

Al ejecutar esto me encuentro con que la feature falla. Pero al fijarme, lo que ocurre es que hay pequeñas diferencias en espacios y retornos. Como no es algo significativo corrijo los tests para que pasen y listo.

Básicamente, este cambio, con el que quitamos caracteres de retorno que se añaden al output.

```ruby
Then(/^System shows status$/) do |text|
  expect(@output.strip).to eq(text)
end
```

Una vez que tenemos todo lo anterior, añadir soporte para las otras opciones de tamaño debería ser sencillo:


```gherkin
  Scenario: Adding all containers sizes
    Given the system is not configured
    When Merry configures 2 "small" containers
    When Merry configures 4 "medium" containers
    When Merry configures 3 "large" containers
    Then System shows status
      """
      Configured storage:

      * Small:  2
      * Medium: 4
      * Large:  3
      """
```

Realmente, tengo que hacer más cambios en los tests para poder configurar varios tamaños:

```ruby
Given(/^the system is not configured$/) do
  @storage = CliAdapterFactory.for_test({})
  @arguments = ["configure"]
end

When(/^Merry sends no configuration$/) do
  @output = capture_stdout { @storage.run(%w[configure]) }
end

Then(/^System shows status$/) do |text|
  @output = capture_stdout { @storage.run(@arguments) }
  expect(@output.strip).to eq(text)
end

When(/^Merry configures (\d+) "([^"]*)" containers$/) do |qty, size|
  @arguments.append "--#{size}=#{qty}"
end
```

Que en el propio código de producción, en el que solo tengo que tocar la `ActionFactory` para que prepare las opciones necesarias:

```ruby
class ActionFactory
  def initialize(command_bus, query_bus)
    @command_bus = command_bus
    @query_bus = query_bus
  end

  def for_subcommand(args)
    parser = OptionParser.new(args)
    sub_command = args[0]
    case sub_command
      
      # Removed code for clarity
    
    when "configure"
      small = parser.by_name_or_default("small", 0).to_i
      medium = parser.by_name_or_default("medium", 0).to_i
      large = parser.by_name_or_default("large", 0).to_i
      conf = {}
      conf[:small] = small unless small == 0
      conf[:medium] = medium unless medium == 0
      conf[:large] = large unless large == 0
      ConfigureAction.new(@command_bus, @query_bus, conf)
    else
      NoAction.new
    end
  end
end

```

## Aumentando una feature y pagando la deuda técnica

Llegadas a este punto parece claro que hay un escenario no contemplado. Hemos dicho que, por el momento, no vamos a querer que se pueda cambiar la configuración de contenedores una vez establecida una. Quizá en el futuro sea una propiedad interesante del sistema, pero ahora mismo no nos interesa. Por tanto, necesitamos especificar eso y definir un comportamiento.

```gherkin
  Scenario: Configured system
    Given the system is already configured with
      | size   | qty |
      | small  | 2   |
      | medium | 4   |
      | large  | 3   |
    When Merry configures 5 "small" containers
    And Merry configures 2 "medium" containers
    And Merry configures 1 "large" containers
    Then System shows status
      """
      Configured storage:

      System is already configured

      * Small:  2
      * Medium: 4
      * Large:  3
      """
```

Estos son los pasos definidos, junto con un par de funciones de ayuda.

```ruby
Given(/^the system is not configured$/) do
  @storage = CliAdapterFactory.for_test({})
  @arguments = ["configure"]
end

Given(/^the system is already configured with$/) do |table|
  configuration = configuration_from(table)

  @storage = CliAdapterFactory.for_test(configuration)
  @arguments = ["configure"]
end

When(/^Merry sends no configuration$/) do
  @output = capture_stdout { @storage.run(%w[configure]) }
end

Then(/^System shows status$/) do |text|
  @output = capture_stdout { @storage.run(@arguments) }
  expect(@output.strip).to eq(text)
end

When(/^Merry configures (\d+) "([^"]*)" containers$/) do |qty, size|
  @arguments.append "--#{size}=#{qty}"
end

def capture_stdout
  original = $stdout
  foo = StringIO.new
  $stdout = foo
  yield
  $stdout.string
ensure
  $stdout = original
end

def configuration_from(table)
  definitions = table.raw.drop(1)

  configuration = {}
  definitions.each do |size, qty|
    qty.to_i.times do
      configuration[size.to_sym] = qty.to_i
    end
  end
  configuration
end
```

Actualmente, `InMemoryContainers` ya controla que no se modifique la configuración actual si existe. Aun así, el escenario no pasa completamente porque no se inserta el mensaje que necesitamos:

```
RSpec::Expectations::ExpectationNotMetError: 
expected: "Configured storage:\n\nSystem is already configured\n\n* Small:  2\n* Medium: 4\n* Large:  3"
     got: "Configured storage:\n\n* Small:  2\n* Medium: 4\n* Large:  3"
```

El problema es que no tenemos forma de saber si ha cambiado o no la configuración. Esto puede ser debido a que lo gestionamos mal en su momento. Si nos fijamos en el método `reconfigure` se debería ver claramente el problema.

```ruby
  def reconfigure(conf)
    if configured?
      return
    end
    @containers = []
    conf.each do |size, qty|
      qty.times do |index|
        name = "#{size[0]}-#{index + 1}"
        add(Container.of_capacity(size.to_sym, name))
      end
    end
  end
```

Se podría decir que `reconfigure` falla silenciosamente si intentamos configurar un sistema que ya está configurado y no debería. 

Además, es que aquí hay varios errores más. El primero es el nombre, ya que `reconfigure` nos indica la posibilidad de volver a _configurar_, cosa que no es cierta. El nombre se lo hemos puesto para evitar el conflicto con `configure`, que es un método factoría y no estoy del todo seguro que tenga uso aparte de los tests. Tendríamos que corregir esto. 

La _feature_ en sí es necesaria, aunque solo se usaría una vez en el caso más habitual. Quizá `install` sea un nombre mejor, ya que indicaría que se trata de una primera vez y no se espera que algo esté instalado, por lo que tendría más sentido el siguiente paso.

La forma más sencilla de notificar el problema es mediante una excepción. Es anómalo intentar instalar algo que ya está instalado. Al lanzar la excepción es posible capturarla y reaccionar de acuerdo a eso, que es lo que necesitamos poder hacer en la `ConfigureAction`.

Así que lo primero que voy a hacer es cambiar el nombre del método `reconfigure` a `install`. Una vez tengo esto, modifico la especificación de `Containers` para que falle con excepción si intento instalar un sistema ya instalado.

```ruby
  describe ".install" do
    it "should have capacity of containers configured" do
      @containers.install({small: 1})
      expect(@containers.total_space).to eq(Capacity.new(4))
    end
    it "should have capacity of containers combined" do
      @containers.install({small: 2, medium: 2})
      expect(@containers.total_space).to eq(Capacity.new(20))
    end
    it "should fail if already configured" do
      @containers = described_class.configure({small: 2})

      expect {
        @containers.install({small: 4})
      }.to raise_error(AlreadyInstalled)
    end
  end
```

E implementado así:

```ruby
  def install(conf)
    if configured?
      raise AlreadyInstalled.new
    end
    @containers = []
    conf.each do |size, qty|
      qty.times do |index|
        name = "#{size[0]}-#{index + 1}"
        add(Container.of_capacity(size.to_sym, name))
      end
    end
  end
```

Nada del otro jueves. Una vez resuelto esto y pasando la especificación de `Containers`, podemos volver a la _feature_. Al ejecutarla vemos que se ha lanzado la excepción `AlreadyInstalled`, haciendo fallar el escenario. Pero ahora ya sabemos dónde intervenir.

```ruby

class ConfigureAction
  def initialize(command_bus, query_bus, conf)
    @command_bus = command_bus
    @query_bus = query_bus
    @conf = conf
  end

  def execute
    @command_bus.execute(Configure.new(@conf))
  rescue ContainersNotYetConfigured
    puts <<-EOT
    Configured storage:
    
    System is not configured
    EOT
  rescue AlreadyInstalled
    response = @query_bus.execute(GetConfiguration.new)
    puts <<~EOT
      Configured storage:

      System is already configured
      
      * Small:  #{response.small}
      * Medium: #{response.medium}
      * Large:  #{response.large}
    EOT
  else
    response = @query_bus.execute(GetConfiguration.new)
    puts <<~EOT
      Configured storage:
      
      * Small:  #{response.small}
      * Medium: #{response.medium}
      * Large:  #{response.large}
    EOT
  end
end
```

Todo este proceso nos permite ejemplificar el problema de la deuda técnica cuando estamos desarrollando un producto. Empezamos lanzando funcionalidad basándonos en el conocimiento que tenemos. Gracias a eso logramos aprender cosas sobre nuestro producto y toca volver a reflejar ese conocimiento en el código. Si el código y el conocimiento no se reconcilian regularmente, llegamos a un punto en el que resulta difícil introducir nuevas features o mejorar las que tenemos.

Ahora podría plantearse si sería necesario trasladar este nuevo conocimiento y terminología a todos los demás elementos del código, así como revisar el papel del método `configure`.

## ¿Como haríamos esto en un equipo?

Partimos de la premisa de que un equipo ágil trabaja orientado a la entrega de valor. Muchos equipos no hacen esto, sino que trabajan orientados a tareas, las cuales pueden contribuir a la entrega de valor, o no. Según esto, todo el equipo contribuye a la feature que se haya decidido desarrollar en este momento. Esto incluye el paso de historia de usuario a las decisiones sobre como se va a implementar y el proceso de desarrollo en sí. 

Por tanto, la discusión y decisiones de diseño sobre la feature las haríamos en equipo, así como la creación de las features y escenarios Gherkin. También los acuerdos sobre las conversaciones y los puertos que haya que definir. Sería ideal convertir la historia de usuario, que no debería ser más que la expresión de una necesidad, en una o varias especificaciones por ejemplos.

Teniendo una herramienta como Cucumber (o cualquiera de sus _ports_ a otros lenguajes), la verdad es que tiene mucho sentido expresar las especificaciones como features en Gherkin, lo que hace mucho más fácil para no desarrolladoras participar, generalmente explicando cuáles son los comportamientos esperados, el valor que pueden aportar, los casos que realmente son valiosos, etc.

Por otro lado, una duda típica es la división por especialidad. Si el adapter es, por ejemplo, una interfaz web: ¿dónde se divide el trabajo para la gente de frontend y la de backend?

Creo que en un equipo realmente ágil la pregunta no es adecuada. Sencillamente, cada persona del equipo podrá aportar en mayor o menos grado en cada cosa que sea necesario hacer. Es decir, las tareas específicas no son compartimentos estancos y un **equipo verdaderamente ágil no gestiona carga de trabajo, sino entrega de valor**. 

Así que el equipo trabajaría al completo hasta el punto en que sea más adecuado repartirse por especialización. Por ejemplo, la aplicación web y el backend. La idea es que lleguemos a un momento en el que ya tengamos muy claros los contratos de los puertos, el tipo de funcionalidad que esperamos de la otra parte, etc. Pero la idea de fondo es que todas tengamos muy claro cómo funciona la feature y hagamos esta división cuando el proceso de discusión ya esté muy avanzado. Con todo, pienso que el trabajo conjunto de frontend y backend garantiza que se pueda obtener mucho feedback necesario en el momento, permitiendo llegar a acuerdos que faciliten el trabajo de la otra especialidad.

En algunos casos, las historias de usuario pueden ser lo bastante pequeñas como para que no sea necesario que todo el equipo esté centrado en una sola. Por supuesto, siempre hay cosas que hacer: empezar a trabajar en la siguiente prioridad, o tal vez resolver un bug que acaba de ser notificado, o incluso gestionar deuda técnica, entendida como refactorizar el código existente para que refleje mejor el conocimiento que vamos adquiriendo.
