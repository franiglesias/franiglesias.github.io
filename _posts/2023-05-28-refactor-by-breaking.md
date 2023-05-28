---
layout: post
title: Refactoriza rompiendo cosas
categories: articles
tags: refactoring good-practices
---

En el artículo anterior sobre la técnica [Uplift conditional](/uplift-conditional/) comenté que mostraría alguna otra técnica de refactoring alternativa sobre el mismo problema. Esta vez, la propone ni más ni menos que la gran Sandi Metz, aunque le voy a dar un par de _twists_ de mi cosecha.

La técnica en cuestión se puede ver en la charla [All the Little Things](https://youtu.be/8bZh5LMaSmE) en la RailsConf de 2014. Y sigue siendo una de las mejores charlas que puedas ver sobre programación orientada a objetos.

El punto de partida de la charla es justamente el problema Gilded Rose y su montaña rusa de condicionales. Y digo montaña rusa porque una de las cosas que menciona Metz tiene que ver con la forma del código. Las múltiples sentencias if anidadas nos hablan de la complejidad del código y nos sirven para identificarlo como un código que se beneficiaría de un buen refactor. Particularmente, si tenemos que modificarlo, como propone el ejemplo, para introducir nuevos productos con nuevas reglas.

## Genera muchos tests y luego rómpelos

Pero vamos a la técnica en sí. En primer lugar necesitaremos tener tests si no existen. Ya hemos visto como obtener [Cobertura de test rápida con Golden Master](/approval_testing/) y ese es el punto en que nos encontramos. Tenemos numerosos tests que cubren todos los flujos de código. Este código:

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
            if ($item->name !== 'Aged Brie' && $item->name !== 'Backstage passes to a TAFKAL80ETC concert') {
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

Una de las condiciones que se autoimpone Sandi Metz en la charla, es que la única información que tiene sobre el problema son los tests y el código. Código que, por otra parte, ni entiende ni aspira a entender.

Pero hay una cosa que sí está clara. La clave de este método es que para cada ítem, identificado por su nombre, se aplican una serie de reglas. El resultado de ello está recogido por los tests.

Este es nuestro test combinatorio:

```php
class GildedRoseTest extends TestCase
{
    public function testFoo(): void
    {
        $updateQuality = static function ($itemName, $sellIn, $quality) {
            $items = [new Item($itemName, $sellIn, $quality)];
            $gildedRose = new GildedRose($items);
            $gildedRose->updateQuality();
            return $items[0];
        };

        $itemNames = [
            'foo',
            'Aged Brie',
            'Backstage passes to a TAFKAL80ETC concert',
            'Sulfuras, Hand of Ragnaros',
            ];
        $sellIns = [
            -1,
            0,
            5,
            6,
            10,
            11
        ];
        $qualities = [
            0,
            1,
            49,
            50
        ];

        CombinationApprovals::verifyAllCombinations3(
            $updateQuality,
            $itemNames,
            $sellIns,
            $qualities
        );
    }
}

```

Si nos fijamos en los `$itemNames` vemos que hay cuatro productos:

```
[ ] 'foo',
[ ] 'Aged Brie',
[ ] 'Backstage passes to a TAFKAL80ETC concert',
[ ] 'Sulfuras, Hand of Ragnaros',
```

Uno de ellos, `'foo'`, ni siquiera se menciona en el código, por lo que representaría un ítem estándar o genérico. Tendremos que tener esto en cuenta más adelante. Pero por ahora, empezamos con él.

Lo que vamos a hacer es ignorar el código actual e introducir una condición para tratar ese caso en particular. Pero antes, voy a extraer todo el bloque dentro del `foreach` como hicimos al hablar de _uplift conditional_. Este es uno de los retoques que voy a hacer sobre la técnica de Metz.

```php
public function updateQuality(): void
{
    foreach ($this->items as $item) {
        $this->originalCode($item);
    }
}
```

Este refactor es perfectamente seguro y me proporcionará una cómoda separación entre el código refactorizado y el original.

Ahora introduzco la condicional para tratar el ítem llamado `'foo'`:

```php
public function updateQuality(): void
{
    foreach ($this->items as $item) {
        if ($item->name === 'foo') {
            continue;
        }
        $this->originalCode($item);
    }
}
```

Ajá. Si tiro los tests, ¿qué va a pasar? Pues que un buen montón van a fallar. Exactamente, todos los que cubren el caso de `'foo'`.

Analicemos lo que tendría que pasar. A la izquierda tienes los parámetros del test (nombre del ítem, `$sellIn` y `$quality`) y a la derecha, el resultado esperado.

```
[foo, -1, 0] => foo, -2, 0
[foo, -1, 1] => foo, -2, 0
[foo, -1, 49] => foo, -2, 47
[foo, -1, 50] => foo, -2, 48
[foo, 0, 0] => foo, -1, 0
[foo, 0, 1] => foo, -1, 0
[foo, 0, 49] => foo, -1, 47
[foo, 0, 50] => foo, -1, 48
[foo, 5, 0] => foo, 4, 0
[foo, 5, 1] => foo, 4, 0
[foo, 5, 49] => foo, 4, 48
[foo, 5, 50] => foo, 4, 49
[foo, 6, 0] => foo, 5, 0
[foo, 6, 1] => foo, 5, 0
[foo, 6, 49] => foo, 5, 48
[foo, 6, 50] => foo, 5, 49
[foo, 10, 0] => foo, 9, 0
[foo, 10, 1] => foo, 9, 0
[foo, 10, 49] => foo, 9, 48
[foo, 10, 50] => foo, 9, 49
[foo, 11, 0] => foo, 10, 0
[foo, 11, 1] => foo, 10, 0
[foo, 11, 49] => foo, 10, 48
[foo, 11, 50] => foo, 10, 49
```

Lo que queremos conseguir ahora es volver a hacer que estos tests pasen a verde cuanto antes. Vamos a ver cómo conseguirlo.

Lo primero que podemos tener claro es que los `$sellIn` deberían decrementarse. Como ahora no se hace nada para el item `'foo'`, obviamente no cambia nada.

Así que introduzcamos algo de código:

```php
public function updateQuality(): void
{
    foreach ($this->items as $item) {
        if ($item->name === 'foo') {
            $item->sellIn -= 1;
            continue;
        }
        $this->originalCode($item);
    }
}
```

Lo primero que notamos es que ahora han pasado algunos tests de los que fallaban, así que estamos un poco mejor.

Veamos ahora una comparación parcial. Esto es lo que ha ocurrido para el ítem `foo` y `$sellIn == -1`

```
[foo, -1, 0] => foo, -2, 0
[foo, -1, 1] => foo, -2, 1
[foo, -1, 49] => foo, -2, 49
[foo, -1, 50] => foo, -2, 50
```

Mientras que esto es lo que debería haber pasado:

```
[foo, -1, 0] => foo, -2, 0
[foo, -1, 1] => foo, -2, 0
[foo, -1, 49] => foo, -2, 47
[foo, -1, 50] => foo, -2, 48
```

Si bien los `$sellIn` han sido actualizados correctamente, `$quality` no se ha cambiado. Y, en principio parece que tenemos que restarle dos unidades.

```php
public function updateQuality(): void
{
    foreach ($this->items as $item) {
        if ($item->name === 'foo') {
            $item->sellIn -= 1;
            $item->quality -= 2;
            continue;
        }
        $this->originalCode($item);
    }
}
```

Este es el resultado para los mismos tests que antes:

```
[foo, -1, 0] => foo, -2, -2
[foo, -1, 1] => foo, -2, -1
[foo, -1, 49] => foo, -2, 47
[foo, -1, 50] => foo, -2, 48
```

Comparemos con lo que esperábamos obtener:

```
[foo, -1, 0] => foo, -2, 0
[foo, -1, 1] => foo, -2, 0
[foo, -1, 49] => foo, -2, 47
[foo, -1, 50] => foo, -2, 48
```

Para los valores iniciales de `$quality` 0 y 1 el resultado debería ser 0. Tiene sentido que `$quality` no pueda ser nunca menor que 0, así que podríamos introducir algo para asegurarlo.

```php
public function updateQuality(): void
{
    foreach ($this->items as $item) {
        if ($item->name === 'foo') {
            $item->sellIn -= 1;
            $item->quality -= 2;

            if ($item->quality < 0) {
                $item->quality = 0;
            }
            continue;
        }
        $this->originalCode($item);
    }
}
```

Tiramos de nuevo los tests. Siguen fallando algunos. Esto es lo que obtenemos para `$sellIn == 5`.

```
[foo, 5, 0] => foo, 4, 0
[foo, 5, 1] => foo, 4, 0
[foo, 5, 49] => foo, 4, 47
[foo, 5, 50] => foo, 4, 48
```

Y esto lo que esperábamos:

```
[foo, 5, 0] => foo, 4, 0
[foo, 5, 1] => foo, 4, 0
[foo, 5, 49] => foo, 4, 48
[foo, 5, 50] => foo, 4, 49
```

Parece que para valores iniciales de `$sellIn` mayores o iguales a 5, `$quality` decrece más lentamente y solo hay que restar una unidad. Pongamos este descubrimiento en nuestro código:

```php
public function updateQuality(): void
{
    foreach ($this->items as $item) {
        if ($item->name === 'foo') {
            if ($item->sellIn >= 5) {
                $item->quality -= 1;
            } else  {
                $item->quality -= 2;
            }

            if ($item->quality <= 0) {
                $item->quality = 0;
            }

            $item->sellIn -= 1;

            continue;
        }
        $this->originalCode($item);
    }
}
```

Y ya tenemos los tests pasando de nuevo.

Lo primero que hago ahora es mover este código a su propio método.

```php
public function updateQuality(): void
{
    foreach ($this->items as $item) {
        if ($item->name === 'foo') {
            $this->updateNormal($item);

            continue;
        }
        $this->originalCode($item);
    }
}

protected function updateNormal(Item $item): void
{
    if ($item->sellIn >= 5) {
        $item->quality -= 1;
    } else {
        $item->quality -= 2;
    }

    if ($item->quality <= 0) {
        $item->quality = 0;
    }

    $item->sellIn -= 1;
}
```

Ahora ya tengo el código necesario para actualizar los ítems "normales":

```
[√] 'foo',
[ ] 'Aged Brie',
[ ] 'Backstage passes to a TAFKAL80ETC concert',
[ ] 'Sulfuras, Hand of Ragnaros',
```

## El caso del queso

Le toca el turno a `'Aged Brie'`. Vamos a hacer exactamente lo mismo con una pequeña diferencia. Por claridad, vamos a introducir ya el método que se encargará del cálculo:

```php
public function updateQuality(): void
{
    foreach ($this->items as $item) {
        if ($item->name === 'foo') {
            $this->updateNormal($item);

            continue;
        }
        if ($item->name === 'Aged Brie') {
            $this->updateBrie($item);

            continue;
        }
        $this->originalCode($item);
    }
}

private function updateBrie(Item $item)
{

}
```

Como es de esperar, si tiramos los tests, fallarán unos cuantos. Exactamente, todos los tests para `'Aged Brie'`. Como hicimos antes, vamos a examinar los primeros. Esto es lo que hemos recibido:

```
[Aged Brie, -1, 0] => Aged Brie, -1, 0
[Aged Brie, -1, 1] => Aged Brie, -1, 1
[Aged Brie, -1, 49] => Aged Brie, -1, 49
[Aged Brie, -1, 50] => Aged Brie, -1, 50
```

Y esto es lo que esperábamos:

```
[Aged Brie, -1, 0] => Aged Brie, -2, 2
[Aged Brie, -1, 1] => Aged Brie, -2, 3
[Aged Brie, -1, 49] => Aged Brie, -2, 50
[Aged Brie, -1, 50] => Aged Brie, -2, 50
```

En primer lugar, los `$sellIn` deberían decrecer. Anotemos eso en el código:

```php
private function updateBrie(Item $item)
{
    $item->sellIn -= 1;
}
```

Este es el resultado:

```
[Aged Brie, -1, 0] => Aged Brie, -2, 0
[Aged Brie, -1, 1] => Aged Brie, -2, 1
[Aged Brie, -1, 49] => Aged Brie, -2, 49
[Aged Brie, -1, 50] => Aged Brie, -2, 50
```

Y esto lo que esperábamos tener:

```
[Aged Brie, -1, 0] => Aged Brie, -2, 2
[Aged Brie, -1, 1] => Aged Brie, -2, 3
[Aged Brie, -1, 49] => Aged Brie, -2, 50
[Aged Brie, -1, 50] => Aged Brie, -2, 50
```

De hecho, algunos tests ahora pasan, como es el caso de: `[Aged Brie, -1, 50] => Aged Brie, -2, 50`.

Lo que observamos es que `$quality` debería incrementarse en 2 unidades, excepto que para 49 y 50 parece que hay un tope. Es decir, `$quality` no puede ser mayor que 50. Escribamos eso:

```php
private function updateBrie(Item $item)
{
    $item->sellIn -= 1;

    $item->quality += 2;

    if ($item->quality > 50) {
        $item->quality = 50;
    }
}
```

Si tiramos de nuevo los tests, veremos que empiezan a pasar unos cuantos más. Sin embargo, algunos tests cuando el valor inicial de `$sellIn` es 5 o mayor fallan:

```
[Aged Brie, 5, 0] => Aged Brie, 4, 2
[Aged Brie, 5, 1] => Aged Brie, 4, 3
[Aged Brie, 5, 49] => Aged Brie, 4, 50
[Aged Brie, 5, 50] => Aged Brie, 4, 50
```

Esto es lo que debería salir:

```
[Aged Brie, 5, 0] => Aged Brie, 4, 1
[Aged Brie, 5, 1] => Aged Brie, 4, 2
[Aged Brie, 5, 49] => Aged Brie, 4, 50
[Aged Brie, 5, 50] => Aged Brie, 4, 50
```

Parece que `$quality` se incremente en 1, en lugar de 2 si los `$sellIn` son 5 o más. Veamos:

```php
private function updateBrie(Item $item)
{
    if ($item->sellIn >= 5) {
        $item->quality += 1;
    } else {
        $item->quality += 2;
    }

    if ($item->quality > 50) {
        $item->quality = 50;
    }

    $item->sellIn -= 1;
}
```

Efectivamente, ahora los tests vuelven a pasar.

Por tanto, me muevo al siguiente item:

```
[√] 'foo',
[√] 'Aged Brie',
[ ] 'Backstage passes to a TAFKAL80ETC concert',
[ ] 'Sulfuras, Hand of Ragnaros',
```

### Descubrimos limitaciones en los tests

El primer paso es el mismo que antes. Introduzco un _seam_ con el que pueda trabajar:

```php
public function updateQuality(): void
{
    foreach ($this->items as $item) {
        if ($item->name === 'foo') {
            $this->updateNormal($item);

            continue;
        }
        if ($item->name === 'Aged Brie') {
            $this->updateBrie($item);

            continue;
        }

        if ($item->name === 'Backstage passes to a TAFKAL80ETC concert') {
            $this->updateBackStage($item);

            continue;
        }
        
        $this->originalCode($item);
    }
}

private function updateBackStage(Item $item)
{

}
```

A continuación ejecuto los tests y observo el resultado. Como era de esperar, fallan todos, por lo que examino los resultados para ver qué debería hacer mi código. Esto es lo que recibo:

```
[Backstage ..., -1, 0] => Backstage ..., -1, 0
[Backstage ..., -1, 1] => Backstage ..., -1, 1
[Backstage ..., -1, 49] => Backstage ..., -1, 49
[Backstage ..., -1, 50] => Backstage ..., -1, 50
```

Y esto, lo que espero:

```
[Backstage ..., -1, 0] => Backstage ..., -2, 0
[Backstage ..., -1, 1] => Backstage ..., -2, 0
[Backstage ..., -1, 49] => Backstage ..., -2, 0
[Backstage ..., -1, 50] => Backstage ..., -2, 0
```

Me llaman la atención dos cosas. Los `$sellIn` deberían decrementarse en 1 y `$quality` siempre es cero. Podemos empezar por ahí:

```php
private function updateBackStage(Item $item)
{
    $item->sellIn -= 1;

    $item->quality = 0;

}
```

Como era de esperar, algunos tests pasan, pero hay muchos todavía en rojo. Vamos a ver un ejemplo:

```
[Backstage ..., 5, 0] => Backstage ..., 4, 0
[Backstage ..., 5, 1] => Backstage ..., 4, 0
[Backstage ..., 5, 49] => Backstage ..., 4, 0
[Backstage ..., 5, 50] => Backstage ..., 4, 0
```

Aquí deberíamos tener este resultado:

```
[Backstage ..., 5, 0] => Backstage ..., 4, 3
[Backstage ..., 5, 1] => Backstage ..., 4, 4
[Backstage ..., 5, 49] => Backstage ..., 4, 50
[Backstage ..., 5, 50] => Backstage ..., 4, 50
```

Para hacer pasar estos tests `$quality` tiene que incrementarse en 3. Pero como hemos visto, `$quality` nunca puede ser más de 50.

```php
private function updateBackStage(Item $item)
{
    if ($item->sellIn >= 5) {
        $item->quality += 3;
    } else {
        $item->quality = 0;
    }

    if ($item->quality > 50) {
        $item->quality = 50;
    }

    $item->sellIn -= 1;
}
```

Pues bien, con esto hacemos pasar unos cuantos tests más. Siguen quedando algunos en rojo, por ejemplo:

```
[Backstage ..., 6, 0] => Backstage ..., 5, 3
[Backstage ..., 6, 1] => Backstage ..., 5, 4
...
[Backstage ..., 10, 0] => Backstage ..., 9, 3
[Backstage ..., 10, 1] => Backstage ..., 9, 4
```

Que deberían darnos:

```
[Backstage ..., 6, 0] => Backstage ..., 5, 2
[Backstage ..., 6, 1] => Backstage ..., 5, 3
...
[Backstage ..., 10, 0] => Backstage ..., 9, 2
[Backstage ..., 10, 1] => Backstage ..., 9, 3
```

Estos resultados nos dicen que para `$sellIn` mayor que 6, el incremento de `$quality` debería ser de 2, en lugar de 3.

```php
private function updateBackStage(Item $item)
{
    if ($item->sellIn >= 6) {
        $item->quality += 2;
    } elseif ($item->sellIn >= 5) {
        $item->quality += 3;
    } else {
        $item->quality = 0;
    }

    if ($item->quality > 50) {
        $item->quality = 50;
    }

    $item->sellIn -= 1;
}
```

Si ejecutamos los tests, todavía quedan algunos fallando:

```
[Backstage ..., 11, 0] => Backstage ..., 10, 2
[Backstage ..., 11, 1] => Backstage ..., 10, 3
```

Cuyo resultado tendría que ser:

```
[Backstage ..., 11, 0] => Backstage ..., 10, 1
[Backstage ..., 11, 1] => Backstage ..., 10, 2
```

Es decir, que para `$sellIn` igual o mayor que 11, `$quality` se incrementa en 1.

```php
private function updateBackStage(Item $item)
{
    if ($item->sellIn >= 11) {
        $item->quality += 1;
    } elseif ($item->sellIn >= 6) {
        $item->quality += 2;
    } elseif ($item->sellIn >= 5) {
        $item->quality += 3;
    } else {
        $item->quality = 0;
    }

    if ($item->quality > 50) {
        $item->quality = 50;
    }

    $item->sellIn -= 1;
}
```

Hay un punto que me inquieta:

```
elseif ($item->sellIn >= 5) {
    $item->quality += 3;
}
```

Me parece que no tiene mucho sentido. No tengo tests que me aclaren lo que pasa cuando `$item->sellIn` es un valor entre 1 y 5, por lo que me planteo añadir un nuevo caso de test.

Pero para eso tengo que ejecutar el código antiguo, porque necesito su comportamiento como referencia. Afortunadamente, puedo hacer algo tan simple como comentar la parte nueva del código, generar los nuevos tests y volver a probar.

```php
    public function updateQuality(): void
    {
        foreach ($this->items as $item) {
//            if ($item->name === 'foo') {
//                $this->updateNormal($item);
//
//                continue;
//            }
//            if ($item->name === 'Aged Brie') {
//                $this->updateBrie($item);
//
//                continue;
//            }
//
//            if ($item->name === 'Backstage passes to a TAFKAL80ETC concert') {
//                $this->updateBackStage($item);
//
//                continue;
//            }

            $this->originalCode($item);
        }
    }
```

Nuevos casos de test:

```php
class GildedRoseTest extends TestCase
{
    public function testFoo(): void
    {
        $updateQuality = static function ($itemName, $sellIn, $quality) {
            $items = [new Item($itemName, $sellIn, $quality)];
            $gildedRose = new GildedRose($items);
            $gildedRose->updateQuality();
            return $items[0];
        };

        $itemNames = [
            'foo',
            'Aged Brie',
            'Backstage passes to a TAFKAL80ETC concert',
            'Sulfuras, Hand of Ragnaros',
            ];
        $sellIns = [
            -1,
            0,
            1,
            4,
            5,
            6,
            10,
            11
        ];
        $qualities = [
            0,
            1,
            49,
            50
        ];

        CombinationApprovals::verifyAllCombinations3(
            $updateQuality,
            $itemNames,
            $sellIns,
            $qualities
        );
    }
}
```

Regenero el archivo de `approved` y vuelvo a activar el código nuevo. Al tirar los tests descubro que fallan todos estos, incluso algunos de los items que ya había refactorizado:

```
[foo, 1, 49] => foo, 0, 47
[foo, 1, 50] => foo, 0, 48
[foo, 4, 49] => foo, 3, 47
[foo, 4, 50] => foo, 3, 48

[Aged Brie, 1, 0] => Aged Brie, 0, 2
[Aged Brie, 1, 1] => Aged Brie, 0, 3
[Aged Brie, 4, 0] => Aged Brie, 3, 2
[Aged Brie, 4, 1] => Aged Brie, 3, 3


[Backstage ..., 1, 0] => Backstage ..., 0, 0
[Backstage ..., 1, 1] => Backstage ..., 0, 0
[Backstage ..., 1, 49] => Backstage ..., 0, 0
[Backstage ..., 1, 50] => Backstage ..., 0, 0
[Backstage ..., 4, 0] => Backstage ..., 3, 0
[Backstage ..., 4, 1] => Backstage ..., 3, 0
[Backstage ..., 4, 49] => Backstage ..., 3, 0
[Backstage ..., 4, 50] => Backstage ..., 3, 0
```

Deberían haber sido:

```
[foo, 1, 49] => foo, 0, 48
[foo, 1, 50] => foo, 0, 49
[foo, 4, 49] => foo, 3, 48
[foo, 4, 50] => foo, 3, 49

[Aged Brie, 1, 0] => Aged Brie, 0, 1
[Aged Brie, 1, 1] => Aged Brie, 0, 2
[Aged Brie, 4, 0] => Aged Brie, 3, 1
[Aged Brie, 4, 1] => Aged Brie, 3, 2

[Backstage ..., 1, 0] => Backstage ..., 0, 3
[Backstage ..., 1, 1] => Backstage ..., 0, 4
[Backstage ..., 1, 49] => Backstage ..., 0, 50
[Backstage ..., 1, 50] => Backstage ..., 0, 50
[Backstage ..., 4, 0] => Backstage ..., 3, 3
[Backstage ..., 4, 1] => Backstage ..., 3, 4
[Backstage ..., 4, 49] => Backstage ..., 3, 50
[Backstage ..., 4, 50] => Backstage ..., 3, 50
```

Está claro que no estaba considerando correctamente algunos límites. Vamos a introducir los cambios necesarios.

Para los ítems normales, como 'foo':

```php
protected function updateNormal(Item $item): void
{
    if ($item->sellIn >= 1) {
        $item->quality -= 1;
    } else {
        $item->quality -= 2;
    }

    if ($item->quality <= 0) {
        $item->quality = 0;
    }

    $item->sellIn -= 1;
}
```

Para 'Aged Brie' el cambio es similar:

```php
private function updateBrie(Item $item)
{
    if ($item->sellIn >= 1) {
        $item->quality += 1;
    } else {
        $item->quality += 2;
    }

    if ($item->quality > 50) {
        $item->quality = 50;
    }

    $item->sellIn -= 1;
}
```

Así que volvemos a revisar `Backstage`, que también tiene el mismo problema:

```php
private function updateBackStage(Item $item)
{
    if ($item->sellIn >= 11) {
        $item->quality += 1;
    } elseif ($item->sellIn >= 6) {
        $item->quality += 2;
    } elseif ($item->sellIn >= 1) {
        $item->quality += 3;
    } else {
        $item->quality = 0;
    }

    if ($item->quality > 50) {
        $item->quality = 50;
    }

    $item->sellIn -= 1;
}
```

Y ya tenemos todos los tests pasando otra vez, incluyendo todos los nuevos que hemos introducido.

```
[√] 'foo',
[√] 'Aged Brie',
[√] 'Backstage passes to a TAFKAL80ETC concert',
[ ] 'Sulfuras, Hand of Ragnaros',
```

### El caso que no hace nada

Así que solo nos quedaría `'Sulfuras'`.

```php
public function updateQuality(): void
{
    foreach ($this->items as $item) {
        if ($item->name === 'foo') {
            $this->updateNormal($item);

            continue;
        }
        if ($item->name === 'Aged Brie') {
            $this->updateBrie($item);

            continue;
        }

        if ($item->name === 'Backstage passes to a TAFKAL80ETC concert') {
            $this->updateBackStage($item);

            continue;
        }

        if ($item->name === 'Sulfuras, Hand of Ragnaros') {
            $this->updateSulfuras($item);

            continue;
        }

        $this->originalCode($item);
    }
}

private function updateSulfuras(Item $item)
{

}
```

La sorpresa es que al tirar los tests no falla ninguno. Al igual que descubrimos en el artículo anterior, `'Sulfuras'` siempre se mantiene inmutable.

Si ejecutamos los tests con el informe de cobertura, por otro lado, vemos que el método `originalCode()` ya no se llama nunca. Asi que podemos quitarlo, quedando un código más ordenado.

Por otro lado, ahora que los tests pasan de nuevo podemos emplear algo de tiempo en refactorizar lo que tenemos. Por ejemplo:


```php
public function updateQuality(): void
{
    foreach ($this->items as $item) {
        if ($item->name === 'foo') {
            $this->updateNormal($item);
        } elseif ($item->name === 'Aged Brie') {
            $this->updateBrie($item);
        } elseif ($item->name === 'Backstage passes to a TAFKAL80ETC concert') {
            $this->updateBackStage($item);
        } elseif ($item->name === 'Sulfuras, Hand of Ragnaros') {
            $this->updateSulfuras($item);
        }
    }
}
```

Ahora bien, dado que `'foo'` representa en el test un ítem _normal_, o un conjunto de normas a aplicar por defecto, creo que reordenar las condicionales reflejará mejor lo que tiene que pasar:

```php
public function updateQuality(): void
{
    foreach ($this->items as $item) {
        if ($item->name === 'Aged Brie') {
            $this->updateBrie($item);
        } elseif ($item->name === 'Backstage passes to a TAFKAL80ETC concert') {
            $this->updateBackStage($item);
        } elseif ($item->name === 'Sulfuras, Hand of Ragnaros') {
            $this->updateSulfuras($item);
        } else {
            $this->updateNormal($item);
        }
    }
}
```

## Conclusiones

Como podéis ver, hemos seguido un camino distinto para llegar a un resultado muy similar. 

_Uplift condition_ nos permitió hacer el refactor de manera casi mecánica. Al poner el código bajo una condición elevada, pudimos determinar qué código conservar y cuál quitar dependiendo de si se ejecutaba o no.

En la técnica presentada en este artículo, básicamente hemos ido dejando de usar el código antiguo, reemplazándolo por código nuevo que íbamos deduciendo del resultado de pasar los tests. Primero sin código y añadiendo líneas progresivamente hasta ponerlo todo en verde de nuevo. Hemos usado una especie de patrón _strangler_.

En ambos casos, necesitábamos tener cobertura de tests que conseguimos fácilmente con la técnica Golden Master y la ayuda de la librería Approval Tests. Esto nos permitió desentendernos del código existente. En una de las técnicas simplemente lo conservábamos o lo eliminábamos. En la otra, escribimos el código desde cero, dirigidas por los tests.

Ambas técnicas se han mostrado útiles para mejorar el estado del código. Diría que la técnica de Sandi Metz tiene la ventaja de que nos ayuda a entender el problema que resuelve el código. En el lado negativo, como hemos podido ver, es sensible a la elección de casos de test que hayamos hecho.

Para finalizar, nos queda un paso. Como bien dice, Sandi Metz en su charla, llegadas a este punto del refactor, el código está en mucho mejor estado, pero no está todavía cerrado a modificación. Para ello, tenemos que hacerlo evolucionar a código orientado a objetos. Eso lo abordaremos en un artículo futuro.
