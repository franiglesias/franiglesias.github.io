---
layout: post
title: Más allá de SOLID, los principios olvidados
categories: articles
tags: design-principles good-practices
---

Hay mucha vida más allá de los principios SOLID y, sobre todo, mucho antes.

GRASP, General Responsibility Assignment Software Patterns, es un conjunto de patrones o heurísticas para definir el reparto de responsabilidades de un sistema orientado a objetos. Básicamente nos ayudan a responder a la pregunta: ¿a qué clase pertenece esta responsabilidad? Así que se podría decir que cada uno de estos patrones nos proporciona una posible respuesta.

Los principios GRASP son el fundamento de otros muchos principios y nos ayudan a encontrar respuesta a preguntas bastante básicas.

## ¿Quién tiene que crear un objeto? Creator

La responsabilidad de crear un objeto de una cierta clase debería estar en otro objeto tal que cumple una o más de las siguientes condiciones:

* Contiene o agrega instancias de la clase a crear.
* Registra instancias de la clase a crear.
* Usa instancias de de la clase a crear.
* Contiene la información necesaria para instanciar objetos de la clase a crear.

La primera condición, contiene o agrega instancias de otra clase, se aplica, por ejemplo, en los agregados de dominio. En lugar de entregarle objetos ya instanciados, lo correcto sería entregarle los datos necesarios para crearlos de modo que el agregado se responsabiliza de proteger las invariantes de dominio que les afectan.

He aquí un ejemplo. Creamos un objeto `Order` y le añadimos un `Item` pasándole la información necesaria para crearlo:

```ruby
require 'rspec'
require_relative '../src/order.rb'

RSpec.describe 'Order should' do
  it "add items" do
    order = Order.new
    order.add_item 'Item 1', 1, 20
    expect(order.items.length).to eq(1)
  end
end
```

Este es el código. **Order.rb**

```ruby
require_relative './item.rb'

class Order

  def initialize
    @items = []
  end

  def add_item(name, quantity, price)
    new_item = Item.new name, quantity, price
    @items.push(new_item)
  end

  def items
    @items
  end
end
```

e **Item.rb**

```ruby
class Item
  def initialize(name, quantity, price)
    @name = name
    @quantity = quantity
    @price = price
  end
end
```

La cuarta condición nos ayuda a entender patrones de construcción como puede ser Factory o Builder, objetos que tienen la información necesaria para instanciar otros objetos.

## ¿Quién debería hacer esto? Information expert

Pon la responsabilidad en la clase que tenga la información necesaria para ejercerla, que es la `information expert` para ese asunto.

Uno de los ejemplos en los que resulta más fácil verlo en acción es en el modelado de una venta en una tienda, así que podemos aprovechar el ejemplo anterior. 

Supongamos que necesitamos conocer el importa total del pedido. Normalmente tendremos clases como `Order` e `Item`. Es sencillo ver que `Order`, al contener la colección de `Items` solicitados, es quien tiene toda la información necesaria para poder calcular el importe total, mientras que `Item` sería responsable del importe de cada línea.

Lo podemos ver aquí:

```ruby
require 'rspec'
require_relative '../src/order.rb'

RSpec.describe 'Order should' do

  it "sum total amount" do
    order = Order.new
    order.add_item('Item 1', 2, 20)
    order.add_item('Item 2', 3, 15)

    expect(order.total_amount).to eq(85)
  end
end
```



**Item.rb**. `Item` sabe calcular el importe de la línea, ya que sabe tanto el precio como la cantidad:

```ruby
class Item
  def initialize(name, quantity, price)
    @name = name
    @quantity = quantity
    @price = price
  end

  def amount
    @price * @quantity
  end

end
```

**Order.rb**. Mientras, que `Order`, al contener todos los `Items`, puede calcular el total del pedido:

```ruby
require_relative './item.rb'

class Order

  def initialize
    @items = []
  end

  def add_item(name, quantity, price)
    new_item = Item.new name, quantity, price
    @items.push(new_item)
  end

  def items
    @items
  end

  def total_amount
    @items.sum { |item| item.amount }
  end
end
```

## ¿Cómo gestiono variantes basada en clase de objetos? Polymorphism

El polimorfismo nos ayuda cuando tenemos que hacer distintas cosas en función del tipo de objeto o información que recibimos. La responsabilidad de cada variedad de comportamiento corresponde al tipo, de modo que el objeto consumidor u orquestador no tiene que saber previamente el tipo de objeto que está manejando, simplemente le envía el mensaje para que actúe. Hemos tratado esto más ampliamente en [un artículo sobre Programar sin ifs](/programar-sin-ifs/).

El ejemplo clásico de las figuras geométricas nos viene bien aquí. Cada figura tiene unas propiedades ligeramente distintas, pero todas saben dibujarse o calcular su área. El código usuario de las clases no tiene que preguntar primero de qué tipo se trata para dibujarlas. Veámoslo en el siguiente test:

```ruby

require 'rspec'
require_relative '../src/surface_calculator.rb'

RSpec.describe 'Surface Calculator should' do
  it 'calculate surface joining different shapes' do
    surface = SurfaceCalculator.new
    surface.add_triangle 10, 20
    surface.add_square 5
    expect(surface.total).to eq(125)
  end
end
```

**SurfaceCalculator** es capaz de agregar distintos tipos de objetos Shape, cada uno de los cuales es una especialización:

```ruby
require_relative './triangle'
require_relative './square'

class SurfaceCalculator
  def initialize
    @shapes = []
  end

  def add_triangle(base, height)
    triangle = Triangle.new base, height
    @shapes.append triangle
  end

  def add_square(side)
    square = Square.new side
    @shapes.append square
  end

  def total
    @shapes.sum { |shape| shape.area }
  end
end
```

Como podemos ver en el método `total`, `SurfaceCalculator` sólo tiene que preguntarle a cada Shape su area, sin necesidad de preguntarle cuál es su tipo primero. Esto hace que las figuras deban entender el mensaje `area` (o, lo que es lo mismo, tener el método `area`)

He aquí el código de las formas:

**Triangle**, representa un triángulo:

```ruby
class Triangle
  def initialize(base, height)
    @base = base
    @height = height

  end

  def area
    @height * @base / 2
  end

end
```

**Square** un cuadrado:

```ruby
class Square
  def initialize (side)
    @side = side
  end

  def area
    @side ** 2
  end
end
```

Podemos ver, por tanto, que cada una de las formas se encarga de realizar el cálculo especializado de su área, liberando a `SurfaceCalculator` de esa responsabilidad, y centrándolo en la suya propia que es agregar todas las áreas de las figuras que contiene.

Esto tiene el beneficio de que será fácil añadir nuevas formas, como **Rectangle**:

```ruby
class Rectangle
  def initialize(base, height)
    @base = base
    @height = height

  end

  def area
    @height * @base
  end

end
```

El problema es que esta forma de trabajar no es segura ya que nada nos garantiza la existencia previa del método `area` en los diferentes tipos de forma. ¿Podemos garantizarlo de alguna forma? Vayamos al siguiente principio.

## ¿Cómo diseño los objetos para evitar el impacto de las variaciones? Protected variations

Es el principio tras la definición de interfaces. Lo que buscamos al aplicar este principio es proteger a los componentes del sistema de las variaciones de otros componentes. Se trataría de establecer algún tipo de contrato entre los componentes participantes que obligue a ser capaz de responder a unos mensajes determinados.

En Ruby, el lenguaje usando en estos ejemplos, y en otros lenguajes (Golang, etc.) no existe la idea de definir interfaces explícitamente. En su lugar, tenemos interfaces implícitas. Por eso, el código anterior funciona siempre que usemos objetos que tengan el método `area`. Esto ya sería una buena razón para aplicar el principio `Creator`, pues nos puede facilitar el asegurar que `SurfaceCalculator` sólo utiliza formas de las que *sabe* que le pueden dar una respuesta en el método `area`.

En otros lenguajes, como Java o PHP, tenemos que definir interfaces explícitamente, de modo que el propio intérprete o compilador nos obligan a que las clases las implementen correctamente.

Para mostrar un ejemplo en Ruby, vamos a simular interfaces con una clase base abstracta `Shape` que tiene el método `area`. Si no lo sobreescribimos en una clase hija, lanzará una excepción.

**Shape** es la clase base que representa una forma genérica.

```ruby
class Shape
  def area
    raise 'Method area not implemented'
  end
end

```

**Triangle**, representa un triángulo:

```ruby
require_relative 'shape.rb'

class Triangle < Shape
  def initialize(base, height)
    @base = base
    @height = height

  end

  def area
    @height * @base / 2
  end

end
```

**Square** un cuadrado:

```ruby
require_relative 'shape.rb'

class Square < Shape
  def initialize (side)
    @side = side
  end

  def area
    @side ** 2
  end
end
```

**Rectangle**:

```ruby
require_relative 'shape.rb'

class Rectangle < Shape
  def initialize(base, height)
    @base = base
    @height = height

  end

  def area
    @height * @base
  end

end
```

Como se puede apreciar es el mismo código, pero ahora hemos definido cada forma como una `Shape` que es capaz de responder al mensaje `area` y decirnos qué superficie tiene.

## ¿Cómo evito el acoplamiento directo? Indirection

El objetivo del patrón **Indirection** es evitar el acoplamiento directo entre otros dos objetos, normalmente introduciendo un objeto intermediario. El objetivo es permitir que los objetos relacionados puedan evolucionar independientemente.

En los ejemplos anteriores hemos creado una clase `SurfaceCalculator` que puede calcular el área de figuras compuestas por triángulos y cuadrados. Sin embargo, ¿qué tenemos que hacer para que pueda procesar también rectángulos u otras figuras?. Tal como está ahora mismo, `SurfaceCalculator` está acoplada al tipo de figuras que conoce. Por el propio principio **Creator**, sólo puede instanciar figuras conocidas y no puede instanciar figuras que no conoce salvo que la modifiquemos.

Algo así:

```ruby
require 'rspec'
require_relative '../src/surface_calculator.rb'

RSpec.describe 'Surface Calculator should' do
  it 'calculate surface joining different shapes' do
    surface = SurfaceCalculator.new
    surface.add_triangle 10, 20
    surface.add_square 5
    surface.add_rectangle 15, 10
    expect(surface.total).to eq(275)
  end
end
```

La cuestión es que podríamos evitar este acoplamiento interponiendo un mediador entre `SurfaceCalculator` y las figuras que soporta.

Por ejemplo, usando una clase `ShapeFactory` que se encargue de fabricar las formas para `SurfaceCalculator`, de modo que ya no necesita saber qué figuras concretas están disponibles. Algo como esto:

```ruby
require 'rspec'
require_relative '../src/surface_calculator.rb'
require_relative '../src/shape_factory.rb'

RSpec.describe 'Surface Calculator should' do

  it 'calculate surface joining different shapes provided by factory' do
    factory = ShapeFactory.new
    surface = SurfaceCalculator.new
    surface.add factory.make 'triangle', 10, 20
    surface.add factory.make 'square', 5
    surface.add factory.make 'rectangle', 15, 10
    expect(surface.total).to eq(275)
  end
end
```

Este es el código de `ShapeFactory`:

```ruby
require_relative './triangle'
require_relative './square'
require_relative './rectangle'

class ShapeFactory

  def make(shape, *param)
    case shape
    when 'triangle'
      Triangle.new param[0], param[1]
    when 'square'
      Square.new param[0]
    when 'rectangle'
      Rectangle.new param[0], param[1]
    else
      raise "Shape #{shape} not supported"
    end
  end
end
```

Gracias a esto, `SurfaceCalculator` queda más simplificado y puede evolucionar sin preocuparse de ninguna *forma*:

```ruby
class SurfaceCalculator
  def initialize
    @shapes = []
  end

  def add(shape)
    @shapes.append shape
  end

  def total
    @shapes.sum { |shape| shape.area }
  end
end
```

Podríamos discutir dos cosas:

`ShapeFactory` está acoplado a las formas, tiene que tener conocimiento de cuales soporta y cuales no. Efectivamente, sin embargo esa es su responsabilidad: saber qué formas se pueden instanciar.

Por otro lado, ¿no hemos dicho que `SurfaceCalculator`, al agregar formas tendría que ser la `Creator`?. Ciertamente, pero en este caso, nada nos impediría hacer que `ShapeFactory` sea colaboradora de `SurfaceCalculator`, permitiéndonos cumplir de nuevo este principio:

```ruby
require 'rspec'
require_relative '../src/surface_calculator.rb'
require_relative '../src/shape_factory.rb'

RSpec.describe 'Surface Calculator should' do
  it 'calculate surface joining different shapes' do
    factory = ShapeFactory.new
    surface = SurfaceCalculator.new factory
    surface.add 'triangle', 10, 20
    surface.add 'square', 5
    surface.add 'rectangle', 15, 10
    expect(surface.total).to eq(275)
  end
end
```

De modo que ahora, `SurfaceCalculator` quedaría así:

```ruby
class SurfaceCalculator
  def initialize(factory)
    @factory = factory
    @shapes = []
  end

  def add(shape, *params)
    @shapes.append @factory.make shape, *params
  end

  def total
    @shapes.sum { |shape| shape.area }
  end
end
```

## ¿Quién gestiona las entradas al sistema? Controller

Controller es una clase queque representa el sistema en general o bien un caso de uso de la aplicación y que gestiona uno o más eventos del sistema enviados por la capa de UI, de la que no forma parte, encargándose de delegar en otros objetos del sistema para obtener la respuesta que debería devolver.

El uso correcto de Controller incluye la posibilidad de procesar eventos estrechamente relacionados, como pueden ser los distintos verbos en REST para un mismo recurso.

## ¿Cómo reduzco el acoplamiento? Low coupling

Ya [hemos hablado de acoplamiento en una entrega anterior](/beyond-solid). El acoplamiento es el grado de interdependencia entre objetos. Si dos objetos deben interactuar existe un acoplamiento entre ellos, pero es deseable que sea el mínimo posible. La aplicación de otros principios nos permite mantener el acoplamiento reducido y relajado, como puede ser el uso de la indirección, o [la inversión de dependencias](/beyond-solid-2).

## ¿Cómo focalizo las responsabilidades de una clase? High cohesion

En [un artículo anterior](/beyond-solid) también mencionamos la cohesión. La cohesión es la fuerza que mantiene focalizadas las responsabilidades de una clase, o de un módulo en su caso. Una clase con alta cohesión es más fácil de entender porque no tiene elementos que nos puedan hacer dudar de cuales son sus responsabilidades.

La alta cohesión se logra, sobre todo, aprendiendo a decir no a las responsabilidades que no corresponden a una clase, especialmente a aquellas que a primera vista sí parecerían adecuadas. También se contribuye a ella identificando aquellas cosas que cambian juntas ya que, cuando es así, deberían ir juntas.

## ¿Dónde pongo la responsabilidad cuando no puedo asignarla a una clase específica? Pure fabrication

Se trata de una clase que no representa un concepto del dominio, pero que necesitamos cuando no podemos asignar la responsabilidad a una clase que sí lo hace. Este tipo de clase es lo que solemos entender como Servicio. Con frecuencia, los objetos mediadores que usamos al aplicar Indirection son Pure fabrication, también. Es decir, son artificios que introducimos para facilitarnos las cosas. El caso anterior con `ShapeFactory` puede servirnos como ejemplo.

## Referencias

* [GRASP (PDF)](https://www.cs.colorado.edu/~kena/classes/5448/f12/presentation-materials/rao.pdf)
* [GRASP, wikipedia](https://en.wikipedia.org/wiki/GRASP_(object-oriented_design))
* [GRASP – General Responsibility Assignment Software Patterns Explained](http://www.kamilgrzybek.com/design/grasp-explained/)
