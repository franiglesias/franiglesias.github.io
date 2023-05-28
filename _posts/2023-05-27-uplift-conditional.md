---
layout: post
title: Despejar una maraña de condicionales
categories: articles
tags: refactoring
---

Aprovechando que al hablar de _Approval Test_ y la técnica _Golden Master_ utilizamos la kata _Gilded Rose_, vamos a hablar de una técnica muy ingeniosa para reorganizar estructuras condicionales extremadamente intrincadas.

_Uplift condition_ es el nombre de una técnica propuesta por Llewellyn Falco y que aplica muy bien al problema de la kata Gilded Rose. ¿Y cuál es este problema? Pues un código en el que se han ido añadiendo reglas de negocio en forma de condiciones anidadas en otras condiciones, de tal forma que la estructura resultante es confusa, difícil de seguir y con bastante riesgo de romper el comportamiento actual en caso de intentar modificarla.

Me he encontrado con este tipo de estructuras con bastante frecuencia. De hecho estoy peleando con una de ellas en el trabajo, por lo que no la puedo usar de ejemplo para este artículo. Pero creo que el ejercicio de Gilded Rose representa muy bien este problema.

Antes de exponer la técnica en sí, voy a intentar explicar mejor el problema.

## ¿Cuándo se torció todo?

Cuando no tenemos mucha experiencia en programación orientada a objetos es frecuente que utilicemos muchas condicionales en el código, es un rasgo propio de la programación procedural.

Por ejemplo, si tenemos que aplicar un descuento al precio de un producto dependiendo de una característica del mismo, como podrían ser los días que lleva en el almacén, introducimos una condición con la que chequear esa característica y aplicar el descuento.

```php
final class PriceCalculator
{
    public function total(array $products): float
    {
        $total = 0;
        foreach ($products as $product) {
            $price = $product->price;
            if ($product->days > 5) {
                $discount = $product->price * .05;
                $price -= $discount;
            }

            $total += $price;
        }

        return $total;
    }
}
```

Sin embargo, en orientación a objetos esta regla estaría encapsulada en el objeto que representa ese producto tipo de producto concreto. De este modo, el propio producto nos diría su precio. En este caso, la decisión se toma en otro momento, que es la instanciación del objeto que representa el producto. De modo que no tiene que tomar ninguna decisión, ni tampoco el código que lo usa.

El problema del enfoque procedural llega cuando tenemos que introducir nuevas reglas de precios. Por ejemplo, algunos productos no tienen que aplicar descuento por mucho tiempo que lleven en el almacén por la razón que sea. Así que tenemos que añadir alguna condición para evitar que el descuento se aplique en esos casos. Aquí, por ejemplo, no se aplicaría a los condimentos:

```php
final class PriceCalculator
{
    public function total(array $products): float
    {
        $total = 0;
        foreach ($products as $product) {
            $price = $product->price;
            if ($product->type !== "condiment") {
                if ($product->days > 5) {
                    $discount = $product->price * .05;
                    $price -= $discount;
                }
            }
            $total += $price;
        }

        return $total;
    }
}
```

Luego, puede ocurrir que nos pidan que el descuento nunca pueda hacer descender el precio por debajo de cierto valor. Esto nos obliga a anidar una condición bajo la pata true del primer `if`.

```php
final class PriceCalculator
{
    public function total(array $products): float
    {
        $total = 0;
        foreach ($products as $product) {
            $price = $product->price;
            if ($product->type !== "condiment") {
                if ($product->days > 5) {
                    $discount = $product->price * .05;
                    if ($product->price - $discount >= 7) {
                        $price -= $discount;
                    }
                }
            }
        }
        $total += $price;
        
        return $total;
    }
}
```

Además, se introduce una nueva regla por la que ciertos productos aumentan de precio si llevan mucho tiempo sin vender. Esto significa otra condición anidada para hacer que únicamente esos productos vean incrementado su precio. 

```php
final class PriceCalculator
{
    public function total(array $products): float
    {
        $total = 0;
        foreach ($products as $product) {
            $price = $product->price;
            if ($product->type !== "condiment") {
                if ($product->type === "wine") {
                    if ($product->days > 5) {
                        $increment = $product->price * .03;
                        $price += $increment;
                    }
                } else {
                    if ($product->days > 5) {
                        $discount = $product->price * .05;
                        if ($product->price - $discount >= 7) {
                            $price -= $discount;
                        }
                    }
                }
            }
        }
        $total += $price;

        return $total;
    }
}
```

Además, este incremento se relaciona con el número de días de edad en tramos definidos.

```php
final class PriceCalculator
{
    public function total(array $products): float
    {
        $total = 0;
        foreach ($products as $product) {
            $price = $product->price;
            if ($product->type !== "condiment") {
                if ($product->type === "wine") {
                    if ($product->days > 20) {
                        $increment = $product->price * .06;
                        $price += $increment;
                    } else if ($product->days > 10) {
                        $increment = $product->price * .03;
                        $price += $increment;
                    } else if ($product->days > 5) {
                        $increment = $product->price * .01;
                        $price += $increment;
                    }
                } else {
                    if ($product->days > 5) {
                        $discount = $product->price * .05;
                        if ($product->price - $discount >= 7) {
                            $price -= $discount;
                        }
                    }
                }
            }
        }
        $total += $price;

        return $total;
    }
}
```

Así que, poco a poco, vamos creando un bloque de código que consiste en estructuras condicionales anidadas a las que vamos añadiendo nuevas reglas y excepciones. Llegado un punto, la estructura resulta tan alambicada y confusa que se hace muy problemático añadir soporte para nuevos productos o reglas sin grandes dificultades. Básicamente, porque averiguar en dónde deberíamos aplicar el cambio se convierte casi en un acto de adivinación.

E imagínate que no haya tests automáticos cubriendo ese código.

En el artículo sobre [Approval Tests](/approval_testing/) vimos, justamente, una técnica para cubrir este tipo de códigos con tests de forma rápida, de tal manera que pudiésemos intervenir en el proyecto sin riesgo. 

Aquí tienes un test creado mediante la misma técnica para lograr cobertura del código que hemos ido desarrollando antes. Esto genera 105 combinaciones de datos que cubren todos los posibles flujos del código.

```php
final class PriceCalculatorTest extends TestCase
{
    /** @test */
    public function shouldCalculatePrices(): void
    {
        $products = ["condiment", "wine", "fresh cheese"];
        $prices = [6, 7, 8, 10, 100];
        $days = [1, 5, 6, 10, 11, 20, 21];
        CombinationApprovals::verifyAllCombinations3(
            [$this, 'calculate'],
            $products,
            $prices,
            $days,
        );
    }

    public function calculate(string $type, int $price, int $days): float
    {
        $product = new Product();
        $product->type = $type;
        $product->price = $price;
        $product->days = $days;

        $products = [
            $product
        ];

        return (new PriceCalculator())->total($products);
    }
}
```

## Refactorizar con _uplift condition_

El presente artículo completa el proceso introduciendo la técnica _uplift condition_ (_Elevar la condición_). Es posible refactorizar este mismo código acudiendo a otras técnicas, propuestas que podremos tratar en otros artículos.

¿En qué consiste _uplift condition_? El objetivo de _uplift condition_ es reducir la complejidad de las estructuras condicionales, ayudándonos a agrupar toda la lógica que corresponde a una condición clave de tal forma que el resultado del proceso es básicamente un `switch` (o `if/elseif/else` en su caso) que distribuye el flujo a partir de esa condición clave. 

Para usar _uplift condition_ necesitaremos una herramienta de _coverage_, mejor aún si tiene soporte de _path coverage_. Además, un buen IDE nos proporcionará mucha información incluso si no tenemos tests.

A grandes rasgos la técnica consiste en ejecutar el bloque de código en su totalidad bajo una condición y su contraria. Hecho esto, buscamos todo el código muerto, que nunca se ejecuta, bajo cada una de las ramas. Además, simplificamos todas aquellas condiciones que resultan ser siempre ciertas o siempre falsas, lo que nos lleva a aplanar las primeras o eliminar bloques de código en las segundas.

El resultado es que en la rama `true` tendremos todo el código que se debe ejecutar si se cumple esa condición y en la rama `else`, el resto. Basta con ir aplicando iterativamente esta misma técnica a la rama `else` hasta que no tenemos más condiciones clave.

Para entenderlo mejor, vamos a aplicarlo al ejemplo de _Gilded Rose_. Nos apoyamos en el hecho de que tenemos tests que cubren todos los flujos de ejecución gracias a utilizar la técnica _Golden Master_.

## Cómo se _elevan_ condicionales

Este el código original, tal como viene en el ejercicio:

```php
final class GildedRose
{
    /**
     * @param Item[] $items
     */
    public function __construct(
        private array $items
    ) {
    }

    public function updateQuality(): void
    {
        foreach ($this->items as $item) {
            if ($item->name != 'Aged Brie' and $item->name != 'Backstage passes to a TAFKAL80ETC concert') {
                if ($item->quality > 0) {
                    if ($item->name != 'Sulfuras, Hand of Ragnaros') {
                        $item->quality = $item->quality - 1;
                    }
                }
            } else {
                if ($item->quality < 50) {
                    $item->quality = $item->quality + 1;
                    if ($item->name == 'Backstage passes to a TAFKAL80ETC concert') {
                        if ($item->sellIn < 11) {
                            if ($item->quality < 50) {
                                $item->quality = $item->quality + 1;
                            }
                        }
                        if ($item->sellIn < 6) {
                            if ($item->quality < 50) {
                                $item->quality = $item->quality + 1;
                            }
                        }
                    }
                }
            }

            if ($item->name != 'Sulfuras, Hand of Ragnaros') {
                $item->sellIn = $item->sellIn - 1;
            }

            if ($item->sellIn < 0) {
                if ($item->name != 'Aged Brie') {
                    if ($item->name != 'Backstage passes to a TAFKAL80ETC concert') {
                        if ($item->quality > 0) {
                            if ($item->name != 'Sulfuras, Hand of Ragnaros') {
                                $item->quality = $item->quality - 1;
                            }
                        }
                    } else {
                        $item->quality = $item->quality - $item->quality;
                    }
                } else {
                    if ($item->quality < 50) {
                        $item->quality = $item->quality + 1;
                    }
                }
            }
        }
    }
}
```

### Preparando el terreno

El primer paso va a ser aplicar algunos pequeños refactors sugeridos por el IDE. Como hacer estrictas las comparaciones:

```php
$item->name != 'Aged Brie'
```

```php
$item->name !== 'Aged Brie'
```

Y usar la versión compacta de las operaciones de incremento y decremento.

```php
$item->quality = $item->quality - 1;
```

Prefiero usar esta versión en lugar de la notación de incremento (`--$item->quality`) ya que lo hace más visible y explícito.

```php
$item->quality -= 1;
```

El motivo de aplicar ahora estos refactors es reducir ruido del IDE en las siguientes fases. Este es el resultado:

```php
final class GildedRose
{
    /**
     * @param Item[] $items
     */
    public function __construct(
        private array $items
    ) {
    }

    public function updateQuality(): void
    {
        foreach ($this->items as $item) {
            if ($item->name !== 'Aged Brie' and $item->name !== 'Backstage passes to a TAFKAL80ETC concert') {
                if ($item->quality > 0) {
                    if ($item->name !== 'Sulfuras, Hand of Ragnaros') {
                        $item->quality -= 1;
                    }
                }
            } else {
                if ($item->quality < 50) {
                    $item->quality += 1;
                    if ($item->name === 'Backstage passes to a TAFKAL80ETC concert') {
                        if ($item->sellIn < 11) {
                            if ($item->quality < 50) {
                                $item->quality += 1;
                            }
                        }
                        if ($item->sellIn < 6) {
                            if ($item->quality < 50) {
                                $item->quality += 1;
                            }
                        }
                    }
                }
            }

            if ($item->name !== 'Sulfuras, Hand of Ragnaros') {
                $item->sellIn -= 1;
            }

            if ($item->sellIn < 0) {
                if ($item->name !== 'Aged Brie') {
                    if ($item->name !== 'Backstage passes to a TAFKAL80ETC concert') {
                        if ($item->quality > 0) {
                            if ($item->name !== 'Sulfuras, Hand of Ragnaros') {
                                $item->quality -= 1;
                            }
                        }
                    } else {
                        $item->quality -= $item->quality;
                    }
                } else {
                    if ($item->quality < 50) {
                        $item->quality += 1;
                    }
                }
            }
        }
    }
}

```

### Decidir qué condiciones _elevar_

Y vamos ahora con la técnica de _uplift condition_. Lo primero que necesitamos hacer es aislar el bloque de condicionales que vamos a refactorizar en un método, así que lo extraemos. Este refactor consiste en separar la iteración de lo iterado y es muy recomendable hacerlo como norma general cuando tenemos un bucle.

```php
final class GildedRose
{
    /**
     * @param Item[] $items
     */
    public function __construct(
        private array $items
    ) {
    }

    public function updateQuality(): void
    {
        foreach ($this->items as $item) {
            $this->updateItemQuality($item);
        }
    }

    protected function updateItemQuality(Item $item): void
    {
        if ($item->name !== 'Aged Brie' and $item->name !== 'Backstage passes to a TAFKAL80ETC concert') {
            if ($item->quality > 0) {
                if ($item->name !== 'Sulfuras, Hand of Ragnaros') {
                    $item->quality -= 1;
                }
            }
        } else {
            if ($item->quality < 50) {
                $item->quality += 1;
                if ($item->name === 'Backstage passes to a TAFKAL80ETC concert') {
                    if ($item->sellIn < 11) {
                        if ($item->quality < 50) {
                            $item->quality += 1;
                        }
                    }
                    if ($item->sellIn < 6) {
                        if ($item->quality < 50) {
                            $item->quality += 1;
                        }
                    }
                }
            }
        }

        if ($item->name !== 'Sulfuras, Hand of Ragnaros') {
            $item->sellIn -= 1;
        }

        if ($item->sellIn < 0) {
            if ($item->name !== 'Aged Brie') {
                if ($item->name !== 'Backstage passes to a TAFKAL80ETC concert') {
                    if ($item->quality > 0) {
                        if ($item->name !== 'Sulfuras, Hand of Ragnaros') {
                            $item->quality -= 1;
                        }
                    }
                } else {
                    $item->quality -= $item->quality;
                }
            } else {
                if ($item->quality < 50) {
                    $item->quality += 1;
                }
            }
        }
    }
}
```

Lo que queremos hacer ahora es "elevar" una de las condiciones de modo que separemos todo el código que se debe ejecutar cuando se cumple. Para ello, lo que tenemos que hacer introducir una estructura `if <condición a elevar>/else`, y ejecutar el mismo bloque de código en ambos.

El razonamiento es que en la rama del `true` se ejecutarán solo las líneas de código necesarias cuando la condición elevada se cumple. Las demás líneas en esa rama se podrán eliminar porque nunca se ejecutan. Por otro lado, algunas condiciones existentes serán siempre verdaderas o falsas bajo la condición _elevada_, y podremos simplificarlas o eliminarlas según el caso.

Por otro lado, en la rama del `false`, habrá líneas que nunca se ejecutarán y podremos eliminar. Y, del mismo modo que en la rama del `true`, algunas condiciones serán siempre verdaderas o siempre falsas.

Es decir queremos tener algo como esto:

```
if <condicion elevada>
   // code block
else
   // the same code block
```

Una forma muy sencilla y eficaz de hacerlo es la siguiente.

Primero, extraemos el bloque completo a un método temporal. De hecho, llamaré a este método `temporal` para que quede claro su naturaleza efímera:

```php
final class GildedRose
{
    /**
     * @param Item[] $items
     */
    public function __construct(
        private array $items
    ) {
    }

    public function updateQuality(): void
    {
        foreach ($this->items as $item) {
            $this->updateItemQuality($item);
        }
    }

    protected function updateItemQuality(Item $item): void
    {
        $this->temporal($item);
    }

    protected function temporal(Item $item): void
    {
        // All the code in the original method
    }
}

```

A continuación, introducimos la condición que queremos elevar. En este ejemplo está bastante claro que la clave es el tipo de producto, por lo que elevaremos ese tipo de condiciones. La primera que nos encontramos es verificar si el item es 'Aged Brie' o no, así que vamos a empezar por ahí. La condición elevada es _positiva_: queremos que se cumpla.

```php
protected function updateItemQuality(Item $item): void
{
    if ($item->name === 'Aged Brie') {
        $this->temporal($item);
    } else {
        $this->temporal($item);
    }
}
```

Y ahora, vamos a deshacer la extracción del método aplicando el refactor _inline method_, lo que nos dará este resultado:

```php
protected function updateItemQuality(Item $item): void
{
    if ($item->name === 'Aged Brie') {
        if ($item->name !== 'Aged Brie' and $item->name !== 'Backstage passes to a TAFKAL80ETC concert') {
            if ($item->quality > 0) {
                if ($item->name !== 'Sulfuras, Hand of Ragnaros') {
                    $item->quality -= 1;
                }
            }
        } else {
            if ($item->quality < 50) {
                $item->quality += 1;
                if ($item->name === 'Backstage passes to a TAFKAL80ETC concert') {
                    if ($item->sellIn < 11) {
                        if ($item->quality < 50) {
                            $item->quality += 1;
                        }
                    }
                    if ($item->sellIn < 6) {
                        if ($item->quality < 50) {
                            $item->quality += 1;
                        }
                    }
                }
            }
        }

        if ($item->name !== 'Sulfuras, Hand of Ragnaros') {
            $item->sellIn -= 1;
        }

        if ($item->sellIn < 0) {
            if ($item->name !== 'Aged Brie') {
                if ($item->name !== 'Backstage passes to a TAFKAL80ETC concert') {
                    if ($item->quality > 0) {
                        if ($item->name !== 'Sulfuras, Hand of Ragnaros') {
                            $item->quality -= 1;
                        }
                    }
                } else {
                    $item->quality -= $item->quality;
                }
            } else {
                if ($item->quality < 50) {
                    $item->quality += 1;
                }
            }
        }
    } else {
        if ($item->name !== 'Aged Brie' and $item->name !== 'Backstage passes to a TAFKAL80ETC concert') {
            if ($item->quality > 0) {
                if ($item->name !== 'Sulfuras, Hand of Ragnaros') {
                    $item->quality -= 1;
                }
            }
        } else {
            if ($item->quality < 50) {
                $item->quality += 1;
                if ($item->name === 'Backstage passes to a TAFKAL80ETC concert') {
                    if ($item->sellIn < 11) {
                        if ($item->quality < 50) {
                            $item->quality += 1;
                        }
                    }
                    if ($item->sellIn < 6) {
                        if ($item->quality < 50) {
                            $item->quality += 1;
                        }
                    }
                }
            }
        }

        if ($item->name !== 'Sulfuras, Hand of Ragnaros') {
            $item->sellIn -= 1;
        }

        if ($item->sellIn < 0) {
            if ($item->name !== 'Aged Brie') {
                if ($item->name !== 'Backstage passes to a TAFKAL80ETC concert') {
                    if ($item->quality > 0) {
                        if ($item->name !== 'Sulfuras, Hand of Ragnaros') {
                            $item->quality -= 1;
                        }
                    }
                } else {
                    $item->quality -= $item->quality;
                }
            } else {
                if ($item->quality < 50) {
                    $item->quality += 1;
                }
            }
        }
    }
}
```

Podríamos haber conseguido lo mismo mediante un simple copiar y pegar, pero esta solución es mucho más cómoda y precisa.

Ya tenemos todo listo. Lo primero que nos llamará la atención es que el IDE comenzará a señalarnos duplicaciones de código y otros avisos, como que algunas condiciones son siempre verdaderas o falsas. De momento, no nos vamos a fijar en ello y ejecutaremos los tests **con cobertura**.

Veamos algunos ejemplos:

```php
protected function updateItemQuality(Item $item): void
{
    if ($item->name === 'Aged Brie') {
        if ($item->name !== 'Aged Brie' and $item->name !== 'Backstage passes to a TAFKAL80ETC concert') {
            if ($item->quality > 0) {
                if ($item->name !== 'Sulfuras, Hand of Ragnaros') {
                    $item->quality -= 1;
                }
            }
            
    // Removed code
```

Este bloque aparece marcado en rojo porque no se ha ejecutado. La razón es que la condición bajo la que se ejecuta nunca se cumple. Para empezar, porque contradice la principal:

```php
if ($item->quality > 0) {
    if ($item->name !== 'Sulfuras, Hand of Ragnaros') {
        $item->quality -= 1;
    }
}
```

En pocas palabras: podemos borrar sin miedo todas las líneas que no tengan cobertura. Esto es lo que ha quedado a mí:

```php
protected function updateItemQuality(Item $item): void
{
    if ($item->name === 'Aged Brie') {
        if ($item->name !== 'Aged Brie' and $item->name !== 'Backstage passes to a TAFKAL80ETC concert') {

        } else {
            if ($item->quality < 50) {
                $item->quality += 1;
                if ($item->name === 'Backstage passes to a TAFKAL80ETC concert') {
                    
                    
                }
            }
        }

        if ($item->name !== 'Sulfuras, Hand of Ragnaros') {
            $item->sellIn -= 1;
        }

        if ($item->sellIn < 0) {
            if ($item->name !== 'Aged Brie') {
                
            } else {
                if ($item->quality < 50) {
                    $item->quality += 1;
                }
            }
        }
    } else {
        if ($item->name !== 'Aged Brie' and $item->name !== 'Backstage passes to a TAFKAL80ETC concert') {
            if ($item->quality > 0) {
                if ($item->name !== 'Sulfuras, Hand of Ragnaros') {
                    $item->quality -= 1;
                }
            }
        } else {
            if ($item->quality < 50) {
                $item->quality += 1;
                if ($item->name === 'Backstage passes to a TAFKAL80ETC concert') {
                    if ($item->sellIn < 11) {
                        if ($item->quality < 50) {
                            $item->quality += 1;
                        }
                    }
                    if ($item->sellIn < 6) {
                        if ($item->quality < 50) {
                            $item->quality += 1;
                        }
                    }
                }
            }
        }

        if ($item->name !== 'Sulfuras, Hand of Ragnaros') {
            $item->sellIn -= 1;
        }

        if ($item->sellIn < 0) {
            if ($item->name !== 'Aged Brie') {
                if ($item->name !== 'Backstage passes to a TAFKAL80ETC concert') {
                    if ($item->quality > 0) {
                        if ($item->name !== 'Sulfuras, Hand of Ragnaros') {
                            $item->quality -= 1;
                        }
                    }
                } else {
                    $item->quality -= $item->quality;
                }
            } else {
                
            }
        }
    }
}

```

Como puedes ver, algunas ramas de condicionales han quedado vacías, así que puedes eliminar esas condicionales también porque no hay nada que ejecutar. Normalmente, es porque esa condición siempre es `false`.

Veamos un ejemplo concreto. Este bloque contiene dos ejemplos:

```php
if ($item->name !== 'Aged Brie' and $item->name !== 'Backstage passes to a TAFKAL80ETC concert') {

} else {
    if ($item->quality < 50) {
        $item->quality += 1;
        if ($item->name === 'Backstage passes to a TAFKAL80ETC concert') {


        }
    }
}
```

Vamos a centrarnos en la condicional más "enterrada". Tiene el cuerpo vacío así que tanto da que se ejecute o no. En realidad, siempre es `false` porque la condición elevada es que `$item->name === 'Aged Brie'`, por tanto, nunca podrá haber ahí un `$item` con otro nombre. La eliminamos.

Ahora nos queda el bloque así. 

```php
if ($item->name !== 'Aged Brie' and $item->name !== 'Backstage passes to a TAFKAL80ETC concert') {

} else {
    if ($item->quality < 50) {
        $item->quality += 1;
    }
}
```

La primera rama está vacía. En estos casos, lo mejor es invertir la condición, de forma que nos quedaremos con un `else` vacío que podemos eliminar sin ningún tipo de riesgo:

```php
if ($item->name === 'Aged Brie' or $item->name === 'Backstage passes to a TAFKAL80ETC concert') {
    if ($item->quality < 50) {
        $item->quality += 1;
    }
}
```

Esta condicional siempre va a ser `true`, por lo que podemos "desempaquetarla" y ejecutar el bloque incondicionalmente:

```php
 if ($item->name === 'Aged Brie') {
    /*** Unwrapped condition ***/
    if ($item->quality < 50) {
        $item->quality += 1;
    }
    /*** Unwrapped condition ***/

    if ($item->name !== 'Sulfuras, Hand of Ragnaros') {
        $item->sellIn -= 1;
    }

    if ($item->sellIn < 0) {
        if ($item->name !== 'Aged Brie') {

        } else {
            if ($item->quality < 50) {
                $item->quality += 1;
            }
        }
    }
}
```

La siguiente condición también se cumple siempre:

```php
if ($item->name !== 'Sulfuras, Hand of Ragnaros') {
    $item->sellIn -= 1;
}
```

Y también podemos desempaquetarla:

```php
if ($item->name === 'Aged Brie') {

    if ($item->quality < 50) {
        $item->quality += 1;
    }

    /*** Unwrapped condition ***/
    $item->sellIn -= 1;
    /*** Unwrapped condition ***/

    if ($item->sellIn < 0) {
        if ($item->name !== 'Aged Brie') {

        } else {
            if ($item->quality < 50) {
                $item->quality += 1;
            }
        }
    }
}
```

Por último, nos queda otra condición con una pata _vacía_.

```php
if ($item->sellIn < 0) {
    if ($item->name !== 'Aged Brie') {

    } else {
        if ($item->quality < 50) {
            $item->quality += 1;
        }
    }
}
```

La invertimos:

```php
if ($item->sellIn < 0) {
    if ($item->name === 'Aged Brie') {
        if ($item->quality < 50) {
            $item->quality += 1;
        }
    }
}
```

Y comprobamos que siempre se cumple. De hecho es la condición que queremos elevar, así que podemos desempaquetar el bloque y nos queda esto bajo la condición elevada.

```php
if ($item->name === 'Aged Brie') {

    if ($item->quality < 50) {
        $item->quality += 1;
    }


    $item->sellIn -= 1;

    if ($item->sellIn < 0) {
        if ($item->quality < 50) {
            $item->quality += 1;
        }
    }
}
```

Ahora tenemos en un solo bloque todas las cosas que tienen que pasar en el caso de que el `$item` sea 'Aged Brie'.

En la rama del `else`, también podemos quitar código aplicando la misma idea. Examinamos las condiciones y eliminamos los bloques bajo las que siempre son falsas y desempaquetamos las que siempre sean ciertas. También borramos los bloques vacíos y las condicionales que las controlan.

Este es el estado actual de la pata `else` de la condición elevada:

```php
if ($item->name !== 'Aged Brie' and $item->name !== 'Backstage passes to a TAFKAL80ETC concert') {
    if ($item->quality > 0) {
        if ($item->name !== 'Sulfuras, Hand of Ragnaros') {
            $item->quality -= 1;
        }
    }
} else {
    if ($item->quality < 50) {
        $item->quality += 1;
        if ($item->name === 'Backstage passes to a TAFKAL80ETC concert') {
            if ($item->sellIn < 11) {
                if ($item->quality < 50) {
                    $item->quality += 1;
                }
            }
            if ($item->sellIn < 6) {
                if ($item->quality < 50) {
                    $item->quality += 1;
                }
            }
        }
    }
}

if ($item->name !== 'Sulfuras, Hand of Ragnaros') {
    $item->sellIn -= 1;
}

if ($item->sellIn < 0) {
    if ($item->name !== 'Aged Brie') {
        if ($item->name !== 'Backstage passes to a TAFKAL80ETC concert') {
            if ($item->quality > 0) {
                if ($item->name !== 'Sulfuras, Hand of Ragnaros') {
                    $item->quality -= 1;
                }
            }
        } else {
            $item->quality -= $item->quality;
        }
    } else {

    }
}
```

Tenemos un par de casos en los que se comprueba que el `$item` no sea 'Aged Brie'. Como estamos en la rama `else`, esa condición será siempre cierta. La podemos reemplazar por `true`.

Por ejemplo:

```php
if ($item->name !== 'Aged Brie' and $item->name !== 'Backstage passes to a TAFKAL80ETC concert') 
```

Cambiando por `true`:

```php
if (true and $item->name !== 'Backstage passes to a TAFKAL80ETC concert') 
```

Se puede simplificar a:

```php
if ($item->name !== 'Backstage passes to a TAFKAL80ETC concert') 
```

En este bloque se usa también:

```php
if ($item->sellIn < 0) {
    if ($item->name !== 'Aged Brie') {
        if ($item->name !== 'Backstage passes to a TAFKAL80ETC concert') {
            if ($item->quality > 0) {
                if ($item->name !== 'Sulfuras, Hand of Ragnaros') {
                    $item->quality -= 1;
                }
            }
        } else {
            $item->quality -= $item->quality;
        }
    } else {

    }
}
```

Primero quitamos el `else` vacío:

```php
if ($item->sellIn < 0) {
    if ($item->name !== 'Aged Brie') {
        if ($item->name !== 'Backstage passes to a TAFKAL80ETC concert') {
            if ($item->quality > 0) {
                if ($item->name !== 'Sulfuras, Hand of Ragnaros') {
                    $item->quality -= 1;
                }
            }
        } else {
            $item->quality -= $item->quality;
        }
    }
}
```

Ahora reemplazamos la condición por `true`:

```php
if ($item->sellIn < 0) {
    if (true) {
        if ($item->name !== 'Backstage passes to a TAFKAL80ETC concert') {
            if ($item->quality > 0) {
                if ($item->name !== 'Sulfuras, Hand of Ragnaros') {
                    $item->quality -= 1;
                }
            }
        } else {
            $item->quality -= $item->quality;
        }
    }
}
```

Lo que implica que podemos desempaquetarla:

```php
if ($item->sellIn < 0) {
    if ($item->name !== 'Backstage passes to a TAFKAL80ETC concert') {
        if ($item->quality > 0) {
            if ($item->name !== 'Sulfuras, Hand of Ragnaros') {
                $item->quality -= 1;
            }
        }
    } else {
        $item->quality -= $item->quality;
    }
}
```

Nos queda una cosa más en el bloque del `else` elevado. Voy a ocultar el código que no nos interesa:

```php
if ($item->name !== 'Backstage passes to a TAFKAL80ETC concert') {
    // Code Removed
} else {
    if ($item->quality < 50) {
        $item->quality += 1;
        if ($item->name === 'Backstage passes to a TAFKAL80ETC concert') {
            // Code removed
        }
    }
}
```

La condición `if ($item->name === 'Backstage passes to a TAFKAL80ETC concert')` siempre se cumple ahí donde está (en el `else` de la condición inversa), por lo que podemos desempaquetarla. Tras eso, el bloque `else` de la condición elevada nos queda así:

```php
if ($item->name !== 'Backstage passes to a TAFKAL80ETC concert') {
    if ($item->quality > 0) {
        if ($item->name !== 'Sulfuras, Hand of Ragnaros') {
            $item->quality -= 1;
        }
    }
} else {
    if ($item->quality < 50) {
        $item->quality += 1;
        if ($item->sellIn < 11) {
            if ($item->quality < 50) {
                $item->quality += 1;
            }
        }
        if ($item->sellIn < 6) {
            if ($item->quality < 50) {
                $item->quality += 1;
            }
        }
    }
}

if ($item->name !== 'Sulfuras, Hand of Ragnaros') {
    $item->sellIn -= 1;
}

if ($item->sellIn < 0) {
    if ($item->name !== 'Backstage passes to a TAFKAL80ETC concert') {
        if ($item->quality > 0) {
            if ($item->name !== 'Sulfuras, Hand of Ragnaros') {
                $item->quality -= 1;
            }
        }
    } else {
        $item->quality -= $item->quality;
    }
}
```

Con esto, hemos conseguido separar el código que tiene que ejecutarse si el item es 'Aged Brie' del que tiene que ejecutarse cuando no lo es.

Ahora, para dejar el terreno mejor definido, voy a extraer ese código a un método de modo que quede clara la intención:

```php
protected function updateItemQuality(Item $item): void
{
    if ($item->name === 'Aged Brie') {
        $this->updateAgedBrie($item);
    } else {
        if ($item->name !== 'Backstage passes to a TAFKAL80ETC concert') {
            if ($item->quality > 0) {
                if ($item->name !== 'Sulfuras, Hand of Ragnaros') {
                    $item->quality -= 1;
                }
            }
        } else {
            if ($item->quality < 50) {
                $item->quality += 1;
                if ($item->sellIn < 11) {
                    if ($item->quality < 50) {
                        $item->quality += 1;
                    }
                }
                if ($item->sellIn < 6) {
                    if ($item->quality < 50) {
                        $item->quality += 1;
                    }
                }
            }
        }

        if ($item->name !== 'Sulfuras, Hand of Ragnaros') {
            $item->sellIn -= 1;
        }

        if ($item->sellIn < 0) {
            if ($item->name !== 'Backstage passes to a TAFKAL80ETC concert') {
                if ($item->quality > 0) {
                    if ($item->name !== 'Sulfuras, Hand of Ragnaros') {
                        $item->quality -= 1;
                    }
                }
            } else {
                $item->quality -= $item->quality;
            }
        }
    }
}

protected function updateAgedBrie(Item $item): void
{
    if ($item->quality < 50) {
        $item->quality += 1;
    }


    $item->sellIn -= 1;

    if ($item->sellIn < 0) {
        if ($item->quality < 50) {
            $item->quality += 1;
        }
    }
}
```

### Repetir hasta elevar el resto de condiciones

La cuestión ahora es seguir aislando otros items, para lo cual seguiremos el mismo procedimiento. La única diferencia es que esta vez trabajaremos con la rama `else` de la condición elevada. Como hicimos antes, extraeremos todo el código de esa rama a un método temporal, introduciremos la condicional elevada y volveremos a hacer un `inline method` del método temporal.

Primero, extraemos todo el código:

```php
protected function updateItemQuality(Item $item): void
{
    if ($item->name === 'Aged Brie') {
        $this->updateAgedBrie($item);
    } else {
        $this->temporal($item);
    }
}
```

Ahora introducimos la nueva condición elevada:

```php
protected function updateItemQuality(Item $item): void
{
    if ($item->name === 'Aged Brie') {
        $this->updateAgedBrie($item);
    } else {
        if ($item->name === 'Backstage passes to a TAFKAL80ETC concert') {
            $this->temporal($item);
        } else {
            $this->temporal($item);
        }
    }
}
```

Finalmente, reintegramos el código del método temporal:

```php
protected function updateItemQuality(Item $item): void
{
    if ($item->name === 'Aged Brie') {
        $this->updateAgedBrie($item);
    } else {
        if ($item->name === 'Backstage passes to a TAFKAL80ETC concert') {
            if ($item->name !== 'Backstage passes to a TAFKAL80ETC concert') {
                if ($item->quality > 0) {
                    if ($item->name !== 'Sulfuras, Hand of Ragnaros') {
                        $item->quality -= 1;
                    }
                }
            } else {
                if ($item->quality < 50) {
                    $item->quality += 1;
                    if ($item->sellIn < 11) {
                        if ($item->quality < 50) {
                            $item->quality += 1;
                        }
                    }
                    if ($item->sellIn < 6) {
                        if ($item->quality < 50) {
                            $item->quality += 1;
                        }
                    }
                }
            }

            if ($item->name !== 'Sulfuras, Hand of Ragnaros') {
                $item->sellIn -= 1;
            }

            if ($item->sellIn < 0) {
                if ($item->name !== 'Backstage passes to a TAFKAL80ETC concert') {
                    if ($item->quality > 0) {
                        if ($item->name !== 'Sulfuras, Hand of Ragnaros') {
                            $item->quality -= 1;
                        }
                    }
                } else {
                    $item->quality -= $item->quality;
                }
            }
        } else {
            if ($item->name !== 'Backstage passes to a TAFKAL80ETC concert') {
                if ($item->quality > 0) {
                    if ($item->name !== 'Sulfuras, Hand of Ragnaros') {
                        $item->quality -= 1;
                    }
                }
            } else {
                if ($item->quality < 50) {
                    $item->quality += 1;
                    if ($item->sellIn < 11) {
                        if ($item->quality < 50) {
                            $item->quality += 1;
                        }
                    }
                    if ($item->sellIn < 6) {
                        if ($item->quality < 50) {
                            $item->quality += 1;
                        }
                    }
                }
            }

            if ($item->name !== 'Sulfuras, Hand of Ragnaros') {
                $item->sellIn -= 1;
            }

            if ($item->sellIn < 0) {
                if ($item->name !== 'Backstage passes to a TAFKAL80ETC concert') {
                    if ($item->quality > 0) {
                        if ($item->name !== 'Sulfuras, Hand of Ragnaros') {
                            $item->quality -= 1;
                        }
                    }
                } else {
                    $item->quality -= $item->quality;
                }
            }
        }
    }
}
```

Seguidamente, volvemos a tirar los tests **con coverage** y eliminamos todas las líneas que no se hayan ejecutado. Esto es lo que nos queda:

```php
protected function updateItemQuality(Item $item): void
{
    if ($item->name === 'Aged Brie') {
        $this->updateAgedBrie($item);
    } else {
        if ($item->name === 'Backstage passes to a TAFKAL80ETC concert') {
            if ($item->name !== 'Backstage passes to a TAFKAL80ETC concert') {
                
            } else {
                if ($item->quality < 50) {
                    $item->quality += 1;
                    if ($item->sellIn < 11) {
                        if ($item->quality < 50) {
                            $item->quality += 1;
                        }
                    }
                    if ($item->sellIn < 6) {
                        if ($item->quality < 50) {
                            $item->quality += 1;
                        }
                    }
                }
            }

            if ($item->name !== 'Sulfuras, Hand of Ragnaros') {
                $item->sellIn -= 1;
            }

            if ($item->sellIn < 0) {
                if ($item->name !== 'Backstage passes to a TAFKAL80ETC concert') {
                    
                } else {
                    $item->quality -= $item->quality;
                }
            }
        } else {
            if ($item->name !== 'Backstage passes to a TAFKAL80ETC concert') {
                if ($item->quality > 0) {
                    if ($item->name !== 'Sulfuras, Hand of Ragnaros') {
                        $item->quality -= 1;
                    }
                }
            } else {
               
            }

            if ($item->name !== 'Sulfuras, Hand of Ragnaros') {
                $item->sellIn -= 1;
            }

            if ($item->sellIn < 0) {
                if ($item->name !== 'Backstage passes to a TAFKAL80ETC concert') {
                    if ($item->quality > 0) {
                        if ($item->name !== 'Sulfuras, Hand of Ragnaros') {
                            $item->quality -= 1;
                        }
                    }
                } else {
                }
            }
        }
    }
}
```

Para no alargar mucho el artículo voy a saltarme el detalle de los siguientes pasos, porque son exactamente los mismos que hemos realizado en la parte anterior. En pocas palabras:

Borramos los bloques que hayan quedado vacíos y las condiciones que los cubren. En su caso, invertimos condiciones para que sea más fácil. Nos debería quedar algo así:

```php
if ($item->name === 'Backstage passes to a TAFKAL80ETC concert') {
    if ($item->name === 'Backstage passes to a TAFKAL80ETC concert') {
        if ($item->quality < 50) {
            $item->quality += 1;
            if ($item->sellIn < 11) {
                if ($item->quality < 50) {
                    $item->quality += 1;
                }
            }
            if ($item->sellIn < 6) {
                if ($item->quality < 50) {
                    $item->quality += 1;
                }
            }
        }
    }

    if ($item->name !== 'Sulfuras, Hand of Ragnaros') {
        $item->sellIn -= 1;
    }

    if ($item->sellIn < 0) {
        if ($item->name === 'Backstage passes to a TAFKAL80ETC concert') {
            $item->quality -= $item->quality;
        }
    }
} else {
    if ($item->name !== 'Backstage passes to a TAFKAL80ETC concert') {
        if ($item->quality > 0) {
            if ($item->name !== 'Sulfuras, Hand of Ragnaros') {
                $item->quality -= 1;
            }
        }
    }

    if ($item->name !== 'Sulfuras, Hand of Ragnaros') {
        $item->sellIn -= 1;
    }

    if ($item->sellIn < 0) {
        if ($item->name !== 'Backstage passes to a TAFKAL80ETC concert') {
            if ($item->quality > 0) {
                if ($item->name !== 'Sulfuras, Hand of Ragnaros') {
                    $item->quality -= 1;
                }
            }
        }
    }
}
```

A continuación, analizamos aquellas condiciones que siempre son ciertas o siempre son falsas, desempaquetando en su caso los bloques de código que contienen o eliminándolo, respectivamente. Nos quedará así:

```php
if ($item->name === 'Backstage passes to a TAFKAL80ETC concert') {
    if ($item->quality < 50) {
        $item->quality += 1;
        if ($item->sellIn < 11) {
            if ($item->quality < 50) {
                $item->quality += 1;
            }
        }
        if ($item->sellIn < 6) {
            if ($item->quality < 50) {
                $item->quality += 1;
            }
        }
    }

    $item->sellIn -= 1;

    if ($item->sellIn < 0) {
        $item->quality -= $item->quality;
    }
} else {
    if ($item->quality > 0) {
        if ($item->name !== 'Sulfuras, Hand of Ragnaros') {
            $item->quality -= 1;
        }
    }

    if ($item->name !== 'Sulfuras, Hand of Ragnaros') {
        $item->sellIn -= 1;
    }

    if ($item->sellIn < 0) {
        if ($item->quality > 0) {
            if ($item->name !== 'Sulfuras, Hand of Ragnaros') {
                $item->quality -= 1;
            }
        }
    }
}
```

En principio, no hay nada más que podamos hacer aquí. El código para la condición `$item->name === 'Backstage passes to a TAFKAL80ETC concert'` ya está aislado, así que lo podemos llevar a su propio método:

```php
if ($item->name === 'Aged Brie') {
    $this->updateAgedBrie($item);
} else {
    if ($item->name === 'Backstage passes to a TAFKAL80ETC concert') {
        $this->updateBackstagePasses($item);
    } else {
        if ($item->quality > 0) {
            if ($item->name !== 'Sulfuras, Hand of Ragnaros') {
                $item->quality -= 1;
            }
        }

        if ($item->name !== 'Sulfuras, Hand of Ragnaros') {
            $item->sellIn -= 1;
        }

        if ($item->sellIn < 0) {
            if ($item->quality > 0) {
                if ($item->name !== 'Sulfuras, Hand of Ragnaros') {
                    $item->quality -= 1;
                }
            }
        }
    }
}
```

```php
protected function updateBackstagePasses(Item $item): void
{
    if ($item->quality < 50) {
        $item->quality += 1;
        if ($item->sellIn < 11) {
            if ($item->quality < 50) {
                $item->quality += 1;
            }
        }
        if ($item->sellIn < 6) {
            if ($item->quality < 50) {
                $item->quality += 1;
            }
        }
    }

    $item->sellIn -= 1;

    if ($item->sellIn < 0) {
        $item->quality -= $item->quality;
    }
}
```

Una cosa que podemos hacer es simplificar un poco la estructura condicional para que sea más clara:

```php
protected function updateItemQuality(Item $item): void
{
    if ($item->name === 'Aged Brie') {
        $this->updateAgedBrie($item);
    } else if ($item->name === 'Backstage passes to a TAFKAL80ETC concert') {
        $this->updateBackstagePasses($item);
    } else {
        if ($item->quality > 0) {
            if ($item->name !== 'Sulfuras, Hand of Ragnaros') {
                $item->quality -= 1;
            }
        }

        if ($item->name !== 'Sulfuras, Hand of Ragnaros') {
            $item->sellIn -= 1;
        }

        if ($item->sellIn < 0) {
            if ($item->quality > 0) {
                if ($item->name !== 'Sulfuras, Hand of Ragnaros') {
                    $item->quality -= 1;
                }
            }
        }
    }
}
```

Seguimos aplicando la misma metodología para elevar la siguiente condición. Extraeremos el bloque de código que nos ha quedado a un método temporal:

```php
protected function updateItemQuality(Item $item): void
{
    if ($item->name === 'Aged Brie') {
        $this->updateAgedBrie($item);
    } else if ($item->name === 'Backstage passes to a TAFKAL80ETC concert') {
        $this->updateBackstagePasses($item);
    } else {
        $this->temporal($item);
    }
}
```

Introducimos la nueva condición elevada:


```php
protected function updateItemQuality(Item $item): void
{
    if ($item->name === 'Aged Brie') {
        $this->updateAgedBrie($item);
    } else if ($item->name === 'Backstage passes to a TAFKAL80ETC concert') {
        $this->updateBackstagePasses($item);
    } else {
        if ($item->name === 'Sulfuras, Hand of Ragnaros') {
            $this->temporal($item);
        } else {
            $this->temporal($item);
        }
    }
}
```

Y finalmente, volvemos a integrar el código:

```php
protected function updateItemQuality(Item $item): void
{
    if ($item->name === 'Aged Brie') {
        $this->updateAgedBrie($item);
    } else if ($item->name === 'Backstage passes to a TAFKAL80ETC concert') {
        $this->updateBackstagePasses($item);
    } else {
        if ($item->name === 'Sulfuras, Hand of Ragnaros') {
            if ($item->quality > 0) {
                if ($item->name !== 'Sulfuras, Hand of Ragnaros') {
                    $item->quality -= 1;
                }
            }

            if ($item->name !== 'Sulfuras, Hand of Ragnaros') {
                $item->sellIn -= 1;
            }

            if ($item->sellIn < 0) {
                if ($item->quality > 0) {
                    if ($item->name !== 'Sulfuras, Hand of Ragnaros') {
                        $item->quality -= 1;
                    }
                }
            }
        } else {
            if ($item->quality > 0) {
                if ($item->name !== 'Sulfuras, Hand of Ragnaros') {
                    $item->quality -= 1;
                }
            }

            if ($item->name !== 'Sulfuras, Hand of Ragnaros') {
                $item->sellIn -= 1;
            }

            if ($item->sellIn < 0) {
                if ($item->quality > 0) {
                    if ($item->name !== 'Sulfuras, Hand of Ragnaros') {
                        $item->quality -= 1;
                    }
                }
            }
        }
    }
}
```

Y volvemos a lanzar los tests con cobertura, borrando el código que no se haya ejecutado.

```php
if ($item->name === 'Sulfuras, Hand of Ragnaros') {
    if ($item->quality > 0) {
        if ($item->name !== 'Sulfuras, Hand of Ragnaros') {
        }
    }

    if ($item->name !== 'Sulfuras, Hand of Ragnaros') {
    }

    if ($item->sellIn < 0) {
        if ($item->quality > 0) {
            if ($item->name !== 'Sulfuras, Hand of Ragnaros') {
                $item->quality -= 1;
            }
        }
    }
} else {
    if ($item->quality > 0) {
        if ($item->name !== 'Sulfuras, Hand of Ragnaros') {
            $item->quality -= 1;
        }
    }

    if ($item->name !== 'Sulfuras, Hand of Ragnaros') {
        $item->sellIn -= 1;
    }

    if ($item->sellIn < 0) {
        if ($item->quality > 0) {
            if ($item->name !== 'Sulfuras, Hand of Ragnaros') {
                $item->quality -= 1;
            }
        }
    }
}
```

Esto nos deja varias condicionales vacías, que podremos eliminar. Así como condicionales que son siempre ciertas o siempre falsas. Una vez completado el trabajo nos encontramos con esto:

```php
if ($item->name === 'Sulfuras, Hand of Ragnaros') {

} else {
    if ($item->quality > 0) {
        $item->quality -= 1;
    }

    $item->sellIn -= 1;

    if ($item->sellIn < 0) {
        if ($item->quality > 0) {
            $item->quality -= 1;
        }
    }
}
```

El item 'Sulfuras' tiene una cualidad tal que no se aplica ninguna de las reglas que rigen la calidad de los otros items. Por tanto, el bloque queda vacío. En este caso vamos a recalcar esto introduciendo un método vacío porque queremos expresar que para 'Sulfuras' no hay que hacer nada.

```php
protected function updateItemQuality(Item $item): void
{
    if ($item->name === 'Aged Brie') {
        $this->updateAgedBrie($item);
    } else if ($item->name === 'Backstage passes to a TAFKAL80ETC concert') {
        $this->updateBackstagePasses($item);
    } else {
        if ($item->name === 'Sulfuras, Hand of Ragnaros') {
            $this->updateSulfuras($item);
        } else {
            if ($item->quality > 0) {
                $item->quality -= 1;
            }

            $item->sellIn -= 1;

            if ($item->sellIn < 0) {
                if ($item->quality > 0) {
                    $item->quality -= 1;
                }
            }
        }
    }
}
```

Reformamos un poquito este código para que nos quede así:

```php
protected function updateItemQuality(Item $item): void
{
    if ($item->name === 'Aged Brie') {
        $this->updateAgedBrie($item);
    } else if ($item->name === 'Backstage passes to a TAFKAL80ETC concert') {
        $this->updateBackstagePasses($item);
    } else if ($item->name === 'Sulfuras, Hand of Ragnaros') {
        $this->updateSulfuras($item);
    } else {
        if ($item->quality > 0) {
            $item->quality -= 1;
        }

        $item->sellIn -= 1;

        if ($item->sellIn < 0) {
            if ($item->quality > 0) {
                $item->quality -= 1;
            }
        }
    }
}
```

### Todo lo que queda es la regla general

El bloque `else` que nos queda ya no contiene ninguna condición que queramos elevar, por lo que podríamos considerarlo como el tratamiento del `Item` genérico. Lo extraemos también.

```php
protected function updateItemQuality(Item $item): void
{
    if ($item->name === 'Aged Brie') {
        $this->updateAgedBrie($item);
    } else if ($item->name === 'Backstage passes to a TAFKAL80ETC concert') {
        $this->updateBackstagePasses($item);
    } else if ($item->name === 'Sulfuras, Hand of Ragnaros') {
        $this->updateSulfuras($item);
    } else {
        $this->updateItem($item);
    }
}
```

```php
protected function updateItem(Item $item): void
{
    if ($item->quality > 0) {
        $item->quality -= 1;
    }

    $item->sellIn -= 1;

    if ($item->sellIn < 0) {
        if ($item->quality > 0) {
            $item->quality -= 1;
        }
    }
}
```

## Conclusiones

El resultado final que hemos obtenido es que las reglas que aplican a cada producto están perfectamente separadas. El estado del código es muchísimo mejor que el original, ya que está perfectamente claro donde tendríamos que intervenir, bien sea para modificar algo o bien para añadir soporte a otros tipos de ítems.

Pero bueno, el refactor no acabaría aquí. La estructura de `if/elseif/else` que hemos conseguido apunta claramente a la necesidad de introducir polimorfismo.

Esto lo trataré en otro artículo, así como técnicas alternativas de refactorizar el mismo código.
