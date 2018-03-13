---
layout: post
title: El patrón decorador
categories: articles
tags: [design-patterns]
---

El patrón decorador tiene como objetivo permitirnos modificar el comportamiento de un objeto en tiempo de ejecución, esto es, de manera dinámica.

En muchas ocasiones sabemos que un objeto va a tener variantes de comportamiento, pero no podemos predecir cuáles serán éstas, sino que se producirán en tiempo de ejecución, dependiendo de configuraciones, elecciones del usuario y otros motivos. Puede, incluso, que esas variantes sean ortogonales entre sí, de manera que se generen muchas combinaciones de comportamientos posibles.

Para estos casos, el patrón Decorador puede ser una buena solución. La idea es encapsular las variantes de comportamiento en diversos objetos (o decoradores) y componerlos con el objeto base cuyo comportamiento queremos modificar en tiempo real. Normalmente el Decorador tomará la salida del objeto base y la transformará.

En este artículo voy a empezar con un código bastante malo y trataré de mostrar por qué se hace necesario mejorar el diseño al crecer las necesidades que trata de resolver, incorporando el patrón Decorador. De este modo, podremos imitar la historia de códigos con años a sus espaldas que necesitan un poco de cariño para evolucionar.

## Iniciando un negocio

Supongamos que vamos a poner en marcha una tienda online de estampación de camisetas. Al principio sólo tenemos un tipo de máquina para estampar y no ofrecemos ninguna opción extra. Para modelar el precio que cobramos al cliente hacemos algo así:

```php
class TShirt
{
    public function __construct(float $price)
    {
        $this->price = $price;
    }
    public function getPrice() : float
    {
        return $this->price;
    }
}

const VAT = 1.21;
const PRINT_PRICE = 4.35;

$shirt = new TShirt(24.56);
$price = $shirt->getPrice();
$totalPrice = $price + PRINT_PRICE;
$priceWithVAT = $totalPrice * VAT;
```

Con esto, tenemos un objeto básico que simplemente lleva el precio de nuestro producto, le añadimos el precio de la impresión y calculamos el IVA. Como no tenemos ninguna variante en particular, realmente no necesitaríamos mucho más.

## Nuestro negocio crece

Nuestro negocio de estampación de camisetas arranca y hemos tenido cierto éxito. Como no queremos dormirnos en los laureles, hemos decidido incorporar una nueva técnica de estampación, así que ahora ofrecemos la posibilidad de escoger que la camiseta sea estampada usando una u otra técnica.

Para empezar, nos damos cuenta de que nuestro modelo está bastante cojo y tenemos que replantearlo un poco. Así, optamos por que el objeto `TShirt` se haga cargo de más cosas en relación al precio de la camiseta estampada, por lo que reescribimos de esta manera:

```php
class TShirt
{
    private const PRINTED = 4.35;
    private const VAT = 1.21;

    public function __construct(float $price)
    {
        $this->price = $price;
    }
    
    public function getPrice() : float
    {
        return $this->price;
    }

    public function getPricePrinted() : float
    {
        return $this->getPrice() + self::PRINTED;
    }

    public function getPriceWithVAT() : float
    {
        return $this->getPricePrinted() * self::VAT;
    }
}

$shirt = new TShirt(24.56);
$priceWithVAT = $shirt->getPriceWithVAT();
```

Esto no es que esté muy bien, pero es algo mejor de lo que teníamos al principio. La misma consideración de antes sigue siendo válida: tenemos un único producto, sin variantes.

Pero… acabamos de decir que vamos a incorporar una variante en forma de una nueva técnica de estampación. Resulta que ahora ofrecemos dos productos, ¿cómo podemos modelar eso?

### Añadir métodos

Una primera opción sería añadir un nuevo método que refleje esa nueva variedad de comportamiento. Esto supone los siguientes problemas, que se añaden a los que tenía nuestro diseño inicial:

* Violación del principio abierto/cerrado: modificamos una clase.
* Violación del principio de responsabilidad única: siendo estrictos, estamos haciendo que un objeto tenga dos comportamientos ya que responde a las necesidades de una impresión "estándar" y a las de una "extra".
* Violación del principio de segregación de interfaces: cuando se usa para la impresión estándar "cargamos" con el método específico para la impresión extra, y viceversa.

Una segunda opción sería reescribir el método para parametrizarlo, de modo que podamos indicar qué proporción usar en cada caso. Pero esta solución, aunque no lo parezca, es idéntica a la anterior y tiene casi los mismos problemas.

### Recurrir a la herencia

Otra opción sería extender la clase y sobreescribir la constante `PRINTED` para reflejar el precio de la nueva técnica, que sería una solución aberrante (¿cómo es que quieres hacer variable una constante?), o bien sobreescribir el método `getPricePrinted()`, que sería algo menos ofensivo (sólo un poco) si lo haces de esta manera (y sin olvidar cambiar la visibilidad de `VAT` a `protected`):

```php
class TShirtExtra extends TShirt
{
    private const PRINTED_EXTRA = 4.35;

    public function getPricePrinted() : float
    {
        return $this->getPrice() + self::PRINTED_EXTRA;
    }
}

$shirt = new TShirtExtra(24.56);
$priceWithVAT = $shirt->getPriceWithVAT();
```

En el lado positivo está que es una solución algo más SOLID:

* Extendemos la clase en lugar de modificarla (bueno, sólo un poquito)
* Cada clase se ocupa de un tipo de impresión
* La interfaz es la misma y no arrastramos métodos que no usamos

Pero, en el lado negativo hay muchas cosas:

* Tal vez no arrastremos métodos, pero sí constantes.
* ¿Qué realidad está modelando el definir la camiseta con la estampación "extra" como descendiente de la camiseta con la estampación "normal"?
* ¿Qué pasa si quiero contemplar una nueva técnica de estampación en el futuro?

### Reorganizar la jerarquía

Hasta cierto punto la herencia no es tan mala solución, pero tenemos que plantear las cosas correctamente. En nuestro ejemplo, la realidad es que tenemos una camiseta base, que nunca vendemos como tal, sobre la que estampamos una imagen de dos formas diferentes. Esa realidad podría quedar mejor reflejada de esta forma:

```php
abstract class TShirt
{
    private const VAT = 1.21;

    public function __construct(float $price)
    {
        $this->price = $price;
    }
    public function getPrice() : float
    {
        return $this->price;
    }

    abstract public function getPricePrinted() : float

    public function getPriceWithVAT() : float
    {
        return $this->getPricePrinted() * self::VAT;
    }
}

class StandardPrintedTShirt extends TShirt
{
    private const PRICE = 4.35;
    
    public function getPricePrinted() : float
    {
        return $this->getPrice() + self::PRICE;
    }
}

class ExtraPrintedTShirt extends TShirt
{
    private const PRICE = 5.15;

    public function getPricePrinted() : float
    {
        return $this->getPrice() + self::PRICE;
    }
}
```

La pinta es bastante mejor, ¿no? Dista mucho de estar del todo bien, pero por lo menos ahora la realidad está mejor modelada, y si acabamos añadiendo una tercera técnica de estampación es sencillo añadir una nueva subclase. El código está en buen estado para crecer con nuestro negocio:

```php
class PremiumPrintedTShirt extends TShirt
{
    private const PRICE = 5.96;

    public function getPricePrinted() : float
    {
        return $this->getPrice() + self::PRICE;
    }
}
```

¿Seguro?

## Multiplicando las opciones

El negocio va viento en popa. No sólo hemos añadido una tercera técnica de estampación, sino que nos hemos dado cuenta de que hay tres o cuatro tamaños de estampación requeridos por los clientes, por lo que nos planteamos que en lugar de cobrar lo mismo por ellos, podríamos ofrecer unos precios más ajustados y ser más competitivos: no es lo mismo estampar un logo del tamaño de un bolsillo, que la camiseta entera o una parte de ella.

Pero esta nueva serie de tamaños se aplica a las tres técnicas de estampación y eso quiere decir que vamos a pasar de ofrecer tres modelos a 12, ni más ni menos: tres tipos de estampación por cuatro tamaños diferentes. ¿Vamos a gestionar eso con herencias?

Es decir. Tengo tres subclases que, a su vez, tienen que extenderse cada una en cuatro subclases más, o bien crear 12 subclases a partir de `TShirt`. Esto empieza a apestar.

Si añadimos una nueva opción en cualquiera de los dos ejes de cambio se multiplican las opciones. ¿Y si añadimos un tercer eje? Pues peor me lo pones: dos opciones en un tercer eje nos proporcionan 24 posibilidades.

Es el momento de plantear un cambio profundo.

### La composición al rescate

Volvamos a pensar un poco en nuestro negocio: nosotros tenemos una camiseta base que decoraremos aplicando una imagen con una técnica de estampación a un tamaño determinado.

```
Camiseta estampada = Camiseta + Estampado + Tamaño
```

Quedémonos con la idea de "decorar" que consiste en añadir elementos a algo para cambiar su aspecto, sin cambiar esencialmente lo que es. Podríamos modelarlo de la siguiente manera en un primer acercamiento:

En el mundo real, lo que hacemos es decorar la camiseta combinando una técnica de impresión y un tamaño de diseño y eso es lo que vamos a modelar. En último término vamos a aplicar una especie de patrón Composite (varios objetos que actúan como si fuesen uno solo), con el matiz de que aquí se "acumulan" sus efectos.

Los objetos que formarán el composite tienen que cumplir una interfaz, así que lo hacemos explícito declarándola:

```php
interface TShirtPriceDecorator {
    public function getPrice() : float;
    public function getPriceWithVAT() : float;
}
```

Podremos prescindir del método `getPricePrinted` porque en cada decoración vamos a recalcular el precio de la camiseta añadiendo el coste de la opción aplicada.

Tanto el objeto base como los "decoradores" implementan la interface que acabamos de definir, esto hace posible usarlos de manera combinada pues nos obliga a implementar los métodos en los que tenemos interés.

```php

class TShirt implements TShirtPriceDecorator
{
    private const VAT = 1.21;

    public function __construct(float $price)
    {
        $this->price = $price;
    }

    public function getPrice() : float
    {
        return $this->price;
    }

    public function getPriceWithVAT() : float
    {
        return $this->getPrice() * self::VAT;
    }
}


class StandardPrinted implements TShirtPriceDecorator
{
    private const PRICE = 4.35;
    private const VAT = 1.21;
    private $shirt;

    public function __construct(TShirtPriceDecorator $shirt)
    {
        $this->shirt = $shirt;
    }
    
    public function getPrice() : float
    {
        return $this->shirt->getPrice() + self::PRICE;
    }

    public function getPriceWithVAT() : float
    {
        return $this->getPrice() * self::VAT;
    }
}

class PocketSize implements TShirtPriceDecorator
{
    private const PRICE = 1;
    private const VAT = 1.21;
    private $shirt;

    public function __construct(TShirtPriceDecorator $shirt)
    {
        $this->shirt = $shirt;
    }

    public function getPrice() : float
    {
        return $this->shirt->getPrice() + self::PRICE;
    }

    public function getPriceWithVAT() : float
    {
        return $this->getPrice() * self::VAT;
    }
}
```

El objeto "decorador" toma como parámetro el objeto base y, a su vez, puede ser decorado por otros objetos. Este anidamiento no tiene límites. De este modo, podemos tener fácilmente una camiseta con estampación estándar de tamaño bolsillo (y prácticamente el código se explica solo):

```php
$decoratedShirt = new PocketSize(
	new StandardPrinted(
		new TShirt(20.50)
		)
	);
```

Ahora no tenemos más que implementar otras modalidades de impresión y otros tamaños:

```php
class ExtraPrinted implements TShirtPriceDecorator
{
    private const PRICE = 5.15;
    private const VAT = 1.21;
    private $shirt;

    public function __construct(TShirtPriceDecorator $shirt)
    {
        $this->shirt = $shirt;
    }
    
    public function getPrice() : float
    {
        return $this->shirt->getPrice() + self::PRICE;
    }

    public function getPriceWithVAT() : float
    {
        return $this->getPrice() * self::VAT;
    }
}

class FullSize implements TShirtPriceDecorator
{
    private const PRICE = 4;
    private const VAT = 1.21;
    private $shirt;

    public function __construct(TShirtPriceDecorator $shirt)
    {
        $this->shirt = $shirt;
    }

    public function getPrice() : float
    {
        return $this->shirt->getPrice() + self::PRICE;
    }

    public function getPriceWithVAT() : float
    {
        return $this->getPrice() * self::VAT;
    }
}
```

Lo que nos permite crear todas las combinaciones que vamos a ofrecer a nuestros clientes, como por ejemplo:

```php
$decoratedShirt = new PocketSize(
	new ExtraPrinted(
		new TShirt(20.50)
		)
	);
```

Si lo escribo en la misma línea prácticamente se lee como lenguaje natural:

```php
$anotherTShirtPriceDecorator = new FullSize(new ExtraPrinted(new TShirt(20.50)));
```

## Refinando la solución

Como habrás observado, tenemos un montón de duplicación aquí, además de otros problema de diseño, así que vamos a ver cómo los tratamos. Pero vayamos por partes:

### Código que sabe demasiado

Nuestros objetos exhiben un conocimiento del negocio excesivamente concreto. Cosas como los precios no deberían estar escritas en el código pues cada vez que queramos cambiarlos tendremos que tocar el código, cuando eso son cuestiones que debería poder resolver Negocio directamente.

Por lo tanto, en lugar de tener una constante que defina el precio de cada decoración, lo vamos a pasar en construcción. Esto nos sirve para ejemplificar cómo podemos tener decoradores que admiten otros parámetros en construcción si necesitamos montar objetos realmente complejos.

```php
class PremiumPrinted implements TShirtPriceDecorator
{
    private const VAT = 1.21;
    private $price;

    private $shirt;

    public function __construct(TShirtPriceDecorator $shirt, float $price)
    {
        $this->shirt = $shirt;
        $this->price = $price;
    }
    
    public function getPrice() : float
    {
        return $this->shirt->getPrice() + $this->price;
    }

    public function getPriceWithVAT() : float
    {
        return $this->getPrice() * self::VAT;
    }
}

class HalfSize implements TShirtPriceDecorator
{

    private const VAT = 1.21;
    private $price;
    private $shirt;

    public function __construct(TShirtPriceDecorator $shirt, float $price)
    {
        $this->shirt = $shirt;
        $this->price = $price;
    }
    
    public function getPrice() : float
    {
        return $this->shirt->getPrice() + $this->price;
    }

    public function getPriceWithVAT() : float
    {
        return $this->getPrice() * self::VAT;
    }
}
```

### Demasiadas responsabilidades

El cálculo del precio con IVA se realiza en todos los objetos, sin embargo: ¿no podría ser en sí mismo un decorador? Lo cierto es que sí, y además nos permite simplificar la interfaz porque ya no necesitaremos esos métodos. Sin embargo debemos tomar la precaución de ponerlo siempre como último elemento de la cadena.

La interfaz simplificada:

```php
interface TShirtPriceDecorator {
    public function getPrice() : float;
}
```

Uno de los decoradores reescrito:

```php
class HalfSize implements TShirtPriceDecorator
{
    private $price;
    private $shirt;

    public function __construct(TShirtPriceDecorator $shirt, float $price)
    {
        $this->shirt = $shirt;
        $this->price = $price;
    }
    
    public function getPrice() : float
    {
        return $this->shirt->getPrice() + $this->price;
    }
}
```

Nuestro decorador del IVA:

```php
class VATTax implements TShirtPriceDecorator
{

    private $tax;
    private $shirt;

    public function __construct(TShirtPriceDecorator $shirt, float $tax)
    {
        $this->shirt = $shirt;
        $this->tax = $tax;
    }
    
    public function getPrice() : float
    {
        return $this->shirt->getPrice() * $this->tax;
    }
}
```

Y un ejemplo de uso:

```php

$anotherTShirt = new FullSize(new ExtraPrinted(new TShirt(20.50)));

$withVAT = new VATTax($anotherTShirt, 1.21);
```

### Duplicación

Nuestros decoradores molan, pero como podemos observar son todos prácticamente iguales, hasta el punto de que tal y como está este ejemplo, realmente sólo necesitaríamos dos tipos, que representen los dos tipos de modificación de comportamiento:

* Los que suman el coste de la opción al precio base, que coinciden con las opciones de impresión.
* Los que multiplican el importe, que coinciden con los impuestos.

Una posibilidad sería definir dos clases que encapsulen estas dos modalidades. Algo así como esto:

```php
class PrintingOptionDecorator implements TShirtPriceDecorator
{
    private $price;
    private $shirt;

    public function __construct(TShirtPriceDecorator $shirt, float $price)
    {
        $this->shirt = $shirt;
        $this->price = $price;
    }
    
    public function getPrice() : float
    {
        return $this->shirt->getPrice() + $this->price;
    }
}

class TaxDecorator implements TShirtPriceDecorator
{

    private $tax;
    private $shirt;

    public function __construct(TShirtPriceDecorator $shirt, float $tax)
    {
        $this->shirt = $shirt;
        $this->tax = $tax;
    }
    
    public function getPrice() : float
    {
        return $this->shirt->getPrice() * $this->tax;
    }
}

```

Lo cual nos permitiría hacer lo siguiente:

```php
$anotherTShirt = new PrintingOptionDecorator(
	new PrintingOptionDecorator(
		new TShirt(20.50),
		3.5),
	4.5);

$withVAT = new TaxDecorator($anotherTShirt, 1.21);
```

Que, la verdad, resulta bastante feo.

La parte buena es que estas dos clases sí representan algo que estamos intentando representar como es que tenemos una serie de opciones de impresión que suponen un coste determinado y que simplemente añaden ese coste al precio total y, por otro lado, tenemos un impuesto que es proporcional al importe del producto.

Podríamos, simplemente utilizar esas clases como bases para los decoradores concretos:

```php
class PocketSize extends PrintingOptionDecorator
{}

class HalfSize extends PrintingOptionDecorator
{}

class FullSize extends PrintingOptionDecorator
{}

class StandardPrint extends PrintingOptionDecorator
{}

class ExtraPrint extends PrintingOptionDecorator
{}

class PremiumPrint extends PrintingOptionDecorator
{}

class VATTax extends TaxDecorator
{}
```
## Añadiendo funcionalidad

Para imprimir la factura o ticket nos vendría bien poder desglosar los precios, así que podríamos tener un método para eso. Lo añadimos a la interfaz y lo implementamos en las clases base, las cuales podríamos declarar abstractas:

```php
interface TShirtPriceDecorator {
    public function getPriceBreakdown() : array;
}

class TShirt implements TShirtPriceDecorator
{
    public function __construct(float $price)
    {
        $this->price = $price;
    }

    public function getPrice() : float
    {
        return $this->price;
    }

    public function getPriceBreakdown() : array
    {
        return ['base' => $this->getPrice()];
    }
}

abstract class PrintingOptionDecorator implements TShirtPriceDecorator
{
    private $price;
    private $shirt;

    public function __construct(TShirtPriceDecorator $shirt, float $price)
    {
        $this->shirt = $shirt;
        $this->price = $price;
    }
    
    public function getPrice() : float
    {
        return $this->shirt->getPrice() + $this->price;
    }
    
    public function getPriceBreakdown() : array
    {
        $breakdown = $this->shirt->getPriceBreakdown();
        $breakdown['option'] = $this->price;
        return $breakdown;
    }
}

abstract class TaxDecorator implements TShirtPriceDecorator
{

    private $tax;
    private $shirt;

    public function __construct(TShirtPriceDecorator $shirt, float $tax)
    {
        $this->shirt = $shirt;
        $this->tax = $tax;
    }
    
    public function getPrice() : float
    {
        return $this->shirt->getPrice() * $this->tax;
    }
    
    public function getPriceBreakdown() : array
    {
        $breakdown = $this->shirt->getPriceBreakdown();
        $breakdown['vat ('.$this->getPct().'%)'] = $this->getVatAmount();
        return $breakdown;
    }
    
    private function getVatPct()
    {
    	return $this->tax * 100 - 100;
    }  
    
    private function getVatAmount()
    {
    	return $this->shirt->getPrice() * ($this->tax - 1);
    }
}

class PocketSize extends PrintingOptionDecorator
{}

class HalfSize extends PrintingOptionDecorator
{}

class FullSize extends PrintingOptionDecorator
{}

class StandardPrint extends PrintingOptionDecorator
{}

class ExtraPrint extends PrintingOptionDecorator
{}

class PremiumPrint extends PrintingOptionDecorator
{}

class VATTax extends TaxDecorator
{}
```

Y de este modo tendríamos nuestro negocio modelado usando el patrón Decorador.
