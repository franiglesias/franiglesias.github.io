---
layout: post
title: Refactor cotidiano (6). Aplica Tell, Don't Ask y la Ley de Demeter
categories: articles
tags: good-practices refactoring
---

En este capítulo veremos refactors basados en la redistribución de responsabilidades.

Hasta ahora, hemos trabajado refactors muy orientados a mejorar la expresividad del código la organización de unidades de código. En este capítulo vamos a empezar a trabajar en cómo mejorar las relaciones entre objetos.

Los principios de diseño nos proporcionan criterios útiles tanto para guiarnos en el desarrollo como para evaluar código existente en el que tenemos que intervenir. Vamos a centrarnos en dos principios que son bastante fáciles de aplicar y que mejorarán la inteligibilidad y la posibilidad de testear nuestro código. Se trata de *Tell, Don't Ask* y la *Ley de Demeter*.

Primero haremos un repaso y luego los veremos en acción.

## Tell, don't ask

La traducción de este enunciado a español sería algo así como "Ordena, no preguntes". La idea de fondo de este principio es que cuando queremos modificar un objeto en base a su propio estado, no es buena idea preguntarle por su estado (*ask*), hacer el cálculo y cambiar su estado si fuera preciso. En su lugar, lo propio sería encapsular ese proceso en un método del propio objeto y decirle (*tell*) que lo realice él mismo.

Dicho en otras palabras: cada objeto debe ser responsable de su estado.

Veamos un ejemplo bastante absurdo, pero que lo deja claro.

Supongamos que tenemos una clase `Square` que representa un cuadrado y queremos poder calcular su área.

```php
$square = new Square(20);

$side = $square->side();

$area = $side**2;
```

Si aplicamos el principio *Tell, Don't Ask*, el cálculo del área estaría en la clase `Square`:

```php
$square = new Square(20);

$area = $square->area();
```

Mejor, ¿no? Veamos por qué.

En el dominio de las figuras geométricas planas, el área o superficie es una propiedad que tienen todas ellas y que, a su vez, depende de otras que son su base y su altura, que en el caso del cuadrado coinciden. La función para determinar el área ocupada por una figura plana depende de cada figura específica.

Posiblemente estés de acuerdo en que al modelar este comportamiento lo pondríamos en la clase de cada figura desde el primer momento, lo que seguramente nos llevaría a una interfaz.

```php
interface TwoDimensionalShapeInterface
{
    public function area(): float;
}
```

La primera razón es que toda la información necesaria para calcular el área está en la clase, por lo que tiene todo el sentido del mundo que el conocimiento preciso para calcularla también esté allí. Se aplica el **principio de Cohesión** y el **principio de Encapsulamiento**, manteniendo juntos los datos y las funciones que procesan esos datos.

Una segunda razón es más pragmática: si el conocimiento para calcular el área está en otro lugar, como un servicio, cada vez que necesitemos incorporar una nueva clase al sistema, tendremos que modificar el servicio para añadirle ese conocimiento, rompiendo el **principio Abierto/Cerrado**. 

En tercer lugar, el testing se simplifica. Es fácil hacer tests de las clases que representan las figuras. Por otro lado, el testing de las otras clases que las utilizan también se simplifica. Normalmente esas clases usarán el cálculo del área como una utilidad para llevar a cabo sus propias responsabilidades que es lo que queremos saber si hacen correctamente.

Siguiendo el principio ***Tell, Don't Ask*** movemos responsabilidades a los objetos a los que pertenecen. 

## Ley de Demeter

La **Ley de Demeter**[^demeter] también se conoce como **Principio de menor conocimiento** y, más o menos, dice que un objeto no debería conocer la organización interna de los otros objetos con los que colabora.

[^demeter]: El nombre viene del proyecto donde se usó por primera vez.

Siguiendo la **Ley de Demeter,** como veremos, un método de una clase sólo puede usar los objetos a los que conoce. Estos son:

* La propia clase, de la que puede usar todos sus métodos.
* Objetos que son propiedades de esa clase.
* Objetos creados en el mismo método que los usa.
* Objetos pasados como parámetros a ese método.

La finalidad de la **ley de Demeter** es evitar el acoplamiento estrecho entre objetos. Si un método usa un objeto, contenido en otro objeto que ha recibido o creado, implica un conocimiento que va más allá de la interfaz pública del objeto intermedio.

```php
public function calculatePrice(Product $product, int $units): float
{
    $discountPct = $product->currentPromotion()->discountPct();
    //...
}
```

En el ejemplo, el método `calculatePrice` obtiene el descuento aplicable llamando a un método de `Product`, que devuelve otro objeto al cual le preguntamos sobre el descuento.

¿Qué objeto es este y cuál es su interfaz? Podemos suponer que se trata de un objeto `Promotion`, pero eso es algo que sabemos nosotros, no el código. Este conocimiento excesivo nos dice que estamos ante una violación de la **Ley de Demeter**.

Puedes ponerlo así, pero sigue siendo el mismo problema:

```php
public function calculatePrice(Product $product, int $units): float
{
    $promotions = $product->currentPromotion();
    $discountPct = $promotion->discountPct();
    //...
}
```

Una justificación que se aduce en ocasiones es que puesto que sabes qué clase de objeto devuelve el objeto intermedio, entonces puedes saber su interfaz. Sin embargo, lo que conseguimos es una dependencia oculta de entre dos objetos que no tienen una relación directa. Esto es:

El **objeto A** usa el **objeto B** para obtener y usar el **objeto C**.

El **objeto A** depende del **objeto C**, pero no hay nada en A que nos diga que existe esa dependencia. 


Es posible aplicar varias soluciones. La más adecuada depende de varios factores. 

### Encapsular en nuevos métodos

En algunos casos, se trataría de aplicar el principio ***Tell, Don't Ask***. Esto es. A veces, la responsabilidad de ofrecernos una cierta respuesta encajaría en el objeto intermedio, por lo que podríamos encapsular la cadena de llamadas. Veámoslo con un ejemplo similar:

```php
public function calculatePrice(Product $product, int $units): float
{
    $basePrice = $product->family()->basePrice();
    $unitPrice = $basePrice + $product->extraPrice();
    return $unitPrice * $units;
}
```

En este caso, resulta razonable pensar que la estructura del precio de un producto es algo propio del producto, y los usuarios del objeto no tienen por qué conocerla. En un primer paso, aplicamos la **Ley de Demeter** haciendo que el objeto `Price` sea el que obtiene el precio base, sin que la calculadora tenga que saber de dónde se obtiene.

```php
public function calculatePrice(Product $product, int $units): float
{
    $basePrice = $product->basePrice();
    $unitPrice = $basePrice + $product->extraPrice();
    return $unitPrice * $units;
}
```

En ese caso, `Product` utiliza su colaborador `Family` para obtener el valor que devolver en `basePrice`.

En el segundo paso, aplicamos `Tell, Don't Ask`, ya que realmente estamos pidiéndole cosas a `Product` que puede hacer por sí mismo.

```php
public function calculatePrice(Product $product, int $units): float
{
    return $product->unitPrice() * $units;
}
```

### Reasignación de responsabilidades

El primer ejemplo sobre descuentos es un poco más delicado que el que acabamos de ver:

```php
public function calculatePrice(Product $product, int $units): float
{
    $discountPct = $product->currentPromotion()->discountPct();
    //...
}
```

No está tan claro que las posibles promociones formen parte de la estructura de precios de un producto. Las promociones son seguramente una responsabilidad de Marketing y los productos y precios son de Ventas. Puesto que no queremos tener dos razones para cambiar Producto, lo lógico es que las promociones estén en otra parte.

Dicho de otro modo, no tiene mucho sentido que un producto conozca cuales son las promociones que se le aplican en el contexto de una campaña de marketing, que son puntuales y limitadas en el tiempo, mientras que la estructura de precio es algo permanente.

Tiene más sentido que la responsabilidad de las promociones esté en otro lugar. Podría ser algo así:

```php
public function calculatePrice(Product $product, int $units): float
{
    $discountPct = $this->getPromotions->forProduct($product);
    $price =  $product->unitPrice() * $units;
    return $price - ($price * $discountPct / 100);
}
```

La clase que contiene el método `calculatePrice` tendría un colaborador que le proporciona los descuentos disponibles para un producto.

En resumidas cuentas, el código que incumple la **Ley de Demeter** tratando con objetos que no conoce directamente puede estar revelando problemas más profundos en el diseño y que hay que solucionar. Estos problemas se manifiestan en un acoplamiento fuerte entre objetos que tienen una relación escasa entre sí.
