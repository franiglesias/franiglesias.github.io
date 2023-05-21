---
layout: post
title: Cobertura de test rápida con Golden Master
categories: articles
tags: good-practices refactoring
---

La técnica _Golden Master_ nos puede ayudar a conseguir cobertura de tests rápida en códigos problemáticos, de modo que podamos empezar a refactorizar sin miedo.

Este artículo es mi versión de [técnicas propuestas por Llewellyn Falco](https://youtu.be/wp6oSVDdbXQ) y [Emily Bache](https://youtu.be/zyM2Ep28ED8), que derivan del trabajo fundamental de Michael Feathers, [Working Effectively with Legacy Code](https://www.oreilly.com/library/view/working-effectively-with/0131177052/).

## Qué es Golden Master

La técnica _Golden Master_ consiste en obtener una instantánea del comportamiento de una pieza de software _bombardeándola_ con tests de tal modo que consigamos una cobertura del 100%. Esta instantánea se usa como red de seguridad para proceder al refactor de la pieza en cuestión y, de este modo, mejorar su diseño de cara al futuro.

Los tests generados por esta técnica se consideran **tests de caracterización**, en la terminología de M. Feathers, puesto que describen el comportamiento observable de una pieza de software relacionando sus _inputs_ con sus _outputs_. El objetivo de estos tests no es verificar que se cumplen las reglas de negocio, sino tener un criterio que nos permita saber si realizar una modificación del código altera su comportamiento. Con estos tests, entonces, podemos refactorizar el código a un diseño más entendible o adaptable. 

Por supuesto, a medida que consigamos esto, también estaremos en condiciones de introducir tests sobre las reglas de negocio. De hecho, nos desharemos de estos tests de caracterización una vez que han cumplido su misión.

### Cómo funciona Golden Master

Una vez que hemos identificado la pieza de código con la que queremos trabajar lo que nos interesa es identificar sus inputs y sus outputs y la forma de invocarla.

Los inputs son los parámetros que tenemos que pasar a la pieza de código para que se ejecute.

Los outputs son el resultado de ejecutar la pieza de software, ya sea directamente la respuesta de la función o un _side effect_. Lo importante es que podamos capturarlo de alguna manera. Ese output capturado lo conservaremos como criterio para comparar con las siguientes ejecuciones del test.

En frontend es habitual usar este tipo de tests de _snapshots_ o instantáneas en el que se genera un resultado y lo usamos para comparar con nuevas ejecuciones del mismo código.

Por supuesto, no basta con una única prueba con unos parámetros arbitrarios para describir el software, sino que necesitamos probar distintos valores de los diferentes parámetros, que aseguren que recorremos todos los posibles flujos de ejecución del código.

Así, por ejemplo, si tenemos dos parámetros, uno de los cuales tiene cuatro posibles valores y otro tiene siete, necesitaríamos 28 (cuatro por siete) ejecuciones de la pieza de código para asegurar que cubrimos todas las posibilidades. Es un problema de combinatoria.

La dificultad de esta técnica tiene dos caras:

* La dificultad de poner la pieza de software en un entorno de testing
* Determinar la cantidad de ejemplos que necesitamos para lograr que se ejecute el 100% de los flujos de código

## Golden Master con Approval Tests

[Approval Tests](https://approvaltests.com) es una librería, disponible para muchos lenguajes de programación, que nos ayudará a la hora de aplicar este tipo de técnicas. Se encarga de toda la parte de _intendencia_ necesaria para generar tests combinatorios y, sobre todo, registrar las instantáneas y usarlas para comparar a través de las diferentes ejecuciones del test.

Para explicar cómo se usa voy a recurrir al método que usa Emily Bache en el ejercicio clásico de refactoring [GildedRose Refactoring Kata](https://github.com/emilybache/GildedRose-Refactoring-Kata).

El ejercicio incluye un pequeño test que falla, que nos sirve tanto para asegurar que el proyecto está bien configurado para trabajar, como para introducir la librería de _Approvals_, en sustitución de las _Asserts_ habituales de la familia _*Unit_.

### Descripción de la kata Gilded Rose

La kata Gilded Rose se basa en una tienda que vende todo tipo de curiosos artículos. Una característica de estos artículos es que pueden caducar por lo que su calidad desciende con el paso de los días, por lo que un artículo puede empezar a degradarse si pasa su fecha de caducidad. Sin embargo, hay artículos en los que no ocurre esto y otros que, al contrario, mejoran con el tiempo (como el queso Brie), o incrementan su valor hasta el día de la fecha de caducidad (como los pases para un concierto). Además, cada artículo puede hacerlo a diferentes velocidades, dependiendo o no del tiempo que están sin vender.

En principio, el objetivo del ejercicio es ser capaz de introducir nuevos productos sin estropear el comportamiento actual del código.

El código, por su parte, es una pesadilla de condicionales anidadas en las que cada producto puede aparecer mencionado varias veces. La clase `Item`, que representa los productos vendidos es un modelo anémico.

## Introducción a Approval testing

Para este artículo usaré la versión PHP de la kata. En principio todas las consideraciones serán comunes a los demás lenguajes.

El ejercicio nos propone un primer test que falla. Como he mencionado más arriba, esto nos sirve para asegurar que tenemos todo correctamente configurado. Por tanto, si podemos ejecutar este test y ver que falla, es que estamos listas para trabajar.

He aquí el test en cuestión:

```php
class GildedRoseTest extends TestCase
{
    public function testFoo(): void
    {
        $items = [new Item('foo', 0, 0)];
        $gildedRose = new GildedRose($items);
        $gildedRose->updateQuality();
        $this->assertSame('fixme', $items[0]->name);
    }
}
```

Como se puede apreciar fácilmente, el test falla porque espera un item llamado "fixme", cuando el único item que introducimos en el sistema se llama "foo".

La corrección es obvia:

```php
class GildedRoseTest extends TestCase
{
    public function testFoo(): void
    {
        $items = [new Item('foo', 0, 0)];
        $gildedRose = new GildedRose($items);
        $gildedRose->updateQuality();
        $this->assertSame('foo', $items[0]->name);
    }
}
```

Este es un test del estilo habitual en las librerías de testing del tipo _*Unit_ (como JUnit, PHPUnit, etc.), que se basan en aserciones.

Ahora vamos a convertirlo en un test de aprobación, o Approval Test, introduciendo esta librería. El proyecto de Composer ya la incluye, por lo que ya estará instalada tras ejecutar el pertinente `composer install` inicial. En caso de que quisieras usarla en otro proyecto:

```shell
composer require-dev approvals/approval-tests
```

Para el caso de otros lenguajes, consulta las formas de instalación adecuadas.

### Reemplazar aserciones por verificaciones

En fin, lo que vamos a hacer ahora es cambiar la aserción por una verificación:

```php
class GildedRoseTest extends TestCase
{
    public function testFoo(): void
    {
        $items = [new Item('foo', 0, 0)];
        $gildedRose = new GildedRose($items);
        $gildedRose->updateQuality();
        $this->assertSame('foo', $items[0]->name);
        Approvals::verifyString($items[0]->name);
    }
}
```

Debido a que PHP no tiene sobrecarga de métodos, la librería `Approvals` incluye variantes de los métodos para cada caso particular. En otros lenguajes sería algo así como `Approvals.verify(items[0].name)`

Si ejecutamos el test vamos a ver que falla con este mensaje:

```
Failed asserting that two strings are equal.
Expected :'  '
Actual   :'foo'
```

Y te puedes preguntar por qué falla si ya habíamos hecho el cambio y la aserción sigue pasando. Por otro lado, ¿con qué está comparando el resultado si la línea `Approvals::verifyString($items[0]->name);` no indica nada? ¿De dónde sale esa cadena vacía de `Expected :'  '`?

Vamos por partes.

El test falla porque la verificación falla. Y esto es porque todavía no hemos definido cual es el output que esperamos.

Si te fijas dentro de la carpeta tests se han creado algunos archivos:

```
tests
├── GildedRoseTest.php
└── approvals
    ├── GildedRoseTest.testFoo.approved.txt
    └── GildedRoseTest.testFoo.received.txt
```

El archivo `GildedRoseTest.testFoo.approved.txt` está vacío.

Pero `GildedRoseTest.testFoo.received.txt` contiene:

```
foo
```

Que es exactamente lo que estamos esperando que sea el output de la función.

Así que el archivo `*.received.txt` contiene el output actual de nuestra pieza de código bajo tests. O más exactamente el valor que contenga

```php
$items[0]->name
```

¿Y qué hay del archivo `*.approved.txt`? Pues el contenido de ese archivo lo tenemos que decidir nosotras.

Exactamente, tenemos que borrarlo y renombrar el archivo, cosa que podemos hacer en un solo paso con ese comando de consola:  

```sh
mv tests/approvals/GildedRoseTest.testFoo.received.txt tests/approvals/GildedRoseTest.testFoo.approved.txt
```

Si ahora volvemos a ejecutar el test, podremos ver que pasa. Y también vemos que no se han generado nuevos archivos.

En resumen, el archivo `*.received.txt` es el _snapshot_ de la ejecución de nuestro código, mientras que el archivo `*.approved.txt` refleja que hemos escogido uno de esos `received` como criterio para describir el comportamiento de la pieza de código.

Ahora que tenemos un Approval test borramos la aserción.

```php
class GildedRoseTest extends TestCase
{
    public function testFoo(): void
    {
        $items = [new Item('foo', 0, 0)];
        $gildedRose = new GildedRose($items);
        $gildedRose->updateQuality();
        Approvals::verifyString($items[0]->name);
    }
}
```

### Verificaciones complejas

Ciertamente, el test que tenemos no verifica gran cosa. El nombre del producto no es algo que tenga que cambiar, aunque está bien saber que no se altera.

Si examinamos el código y pensamos en la descripción del problema del ejercicio nos daremos cuenta de que sería importante controlar tanto la propiedad `$sellIn`, que nos dice el número de días antes de que el producto caduque, como `$quality`, que nos dice su calidad en el momento actual.

```php
final class Item implements \Stringable
{
    public function __construct(
        public string $name,
        public int $sellIn,
        public int $quality
    ) {
    }

    public function __toString(): string
    {
        return (string) "{$this->name}, {$this->sellIn}, {$this->quality}";
    }
}
```

Podemos ver que Item implementa `Stringable`, una interfaz que nos indica que tiene una representación en forma de string y que, a tenor del código, contiene todos los elementos de información que nos interesan.

Eso quiere decir que podríamos escribir el test de una manera un poco diferente para conseguir una verificación sólida:

```php
class GildedRoseTest extends TestCase
{
    public function testFoo(): void
    {
        $items = [new Item('foo', 0, 0)];
        $gildedRose = new GildedRose($items);
        $gildedRose->updateQuality();
        Approvals::verifyString($items[0]);
    }
}
```

Si lanzamos el test, veremos que falla:

```
Failed asserting that two strings are equal.
Expected :'foo'
Actual   :'foo, -1, 0'
```

Y si nos fijamos en el archivo `*.approved.txt` recién creado, comprobaremos que el nuevo _snapshot_ contiene más información:

```
foo, -1, 0
```

Este es nuestro nuevo criterio de aceptación que debemos aprobar. Recuerda: renombrar el archivo `*.received.txt` como `*.approved.txt`.

```shell
mv tests/approvals/GildedRoseTest.testFoo.received.txt tests/approvals/GildedRoseTest.testFoo.approved.txt
```

### Alternativa: verifica objetos como JSON

¿Quieres un _snapshot_ más sofisticado? Puedes usar la verificación como JSON. Esto hará que el objeto se serialize como JSON y se genere un _snapshot_ en ese formato. Esto puede ser útil para verificar objetos complejos, cumpliendo la interfaz `JsonSerializable` para poder incluir propiedades privadas.

En este ejemplo, dado que `Item` tiene todas sus propiedades públicas, el serializador es capaz de obtener toda la información que necesita:

He aquí el test:

```php
class GildedRoseTest extends TestCase
{
    /**
     * @throws ApprovalMismatchException
     */
    public function testFoo(): void
    {
        $items = [new Item('foo', 0, 0)];
        $gildedRose = new GildedRose($items);
        $gildedRose->updateQuality();
        Approvals::verifyAsJson($items[0]);
    }
}
```

Y este es el _snapshot_ generado:

```json
{
    "name": "foo",
    "sellIn": -1,
    "quality": 0
}
```

Para el resto del artículo volveremos a la verificación normal, pero me pareció interesante mencionar esta posibilidad.

## Verificación combinatoria

Volvamos a considerar el test:

```php
class GildedRoseTest extends TestCase
{
    public function testFoo(): void
    {
        $items = [new Item('foo', 0, 0)];
        $gildedRose = new GildedRose($items);
        $gildedRose->updateQuality();
        Approvals::verifyString($items[0]);
    }
}
```

El test solo prueba un caso de los muchos posibles, lo que no revela mucha información acerca del comportamiento.

De hecho, si ejecutamos el test con _coverage_, comprobaríamos que solamente pasa por el 53% de las líneas, lo que deja casi la mitad del código sin proteger. Definitivamente, no es suficiente para proceder a un refactor.

Por tanto, lo que queremos es poder generar muchos tests con diversas combinaciones de los parámetros: `$name`, `$sellIn` y `$quality`.

Antes de ponernos a escribir un test para cada combinación, vamos a ver qué nos ofrece la librería `Approvals`.

Y lo que nos ofrece en `CombinationApprovals`. Esta variante nos permite pasarle una función y listas de valores para cada parámetro de la misma. La librería generará por nosotras las combinaciones, generando un archivo de _snapshot_ con todos los resultados.

Vamos a verlo paso a paso.

Lo primero que queremos es que el código bajo test se ejecute dentro de una función que podamos pasar a `CombinationApprovals::verify`, que reciba todos los parámetros que queremos considerar.

Mi primer paso es extraer a variables los parámetros con los que construimos un objeto `Item`.

```php
class GildedRoseTest extends TestCase
{
    public function testFoo(): void
    {
        $itemName = 'foo';
        $sellIn = 0;
        $quality = 0;

        $items = [new Item($itemName, $sellIn, $quality)];
        $gildedRose = new GildedRose($items);
        $gildedRose->updateQuality();

        Approvals::verifyString($items[0]);
    }
}
```

También aíslo el resultado:

```php
class GildedRoseTest extends TestCase
{
    public function testFoo(): void
    {
        $itemName = 'foo';
        $sellIn = 0;
        $quality = 0;

        $items = [new Item($itemName, $sellIn, $quality)];
        $gildedRose = new GildedRose($items);
        $gildedRose->updateQuality();
        $item = $items[0];
        
        Approvals::verifyString($item);
    }
}
```

Ahora separamos el bloque de código como una función anónima que asignaremos a una variable.

```php
class GildedRoseTest extends TestCase
{
    public function testFoo(): void
    {
        $itemName = 'foo';
        $sellIn = 0;
        $quality = 0;

        $updateQuality = static function ($itemName, $sellIn, $quality) {
            $items = [new Item($itemName, $sellIn, $quality)];
            $gildedRose = new GildedRose($items);
            $gildedRose->updateQuality();
            return $items[0];
        };
        
        $item = $updateQuality($itemName, $sellIn, $quality);
        
        Approvals::verifyString($item);
    }
}
```

Esto podemos hacerlo también extrayendo el bloque de código a un método.

Ahora ya tenemos todas las piezas que necesitamos para introducir `CombinationApprovals`.

```php
class GildedRoseTest extends TestCase
{
    public function testFoo(): void
    {
        $itemName = 'foo';
        $sellIn = 0;
        $quality = 0;

        $updateQuality = static function ($itemName, $sellIn, $quality) {
            $items = [new Item($itemName, $sellIn, $quality)];
            $gildedRose = new GildedRose($items);
            $gildedRose->updateQuality();
            return $items[0];
        };
        
        CombinationApprovals::verifyAllCombinations3(
            $updateQuality,
            [$itemName],
            [$sellIn],
            [$quality]
        );
    }
}
```

Nos interesa el método `CombinationApprovals::verifyAllCombinations3` porque tenemos tres parámetros en nuestra función. En otros lenguajes el método será `verifyAllCombinations` al disponer de sobrecarga.

El primer parámetro es el `Callable`, en este caso la función anónima. En PHP podríamos pasar un método del test con este formato, con el que podemos referenciar un método del propio test.

```php
        CombinationApprovals::verifyAllCombinations3(
            [$this, "updateQuality"],
            [$itemName],
            [$sellIn],
            [$quality]
        );
```

Los valores para los parámetros se pasan en forma de _arrays_, porque queremos pasar todos los posibles valores en los que estamos interesados. Dentro de un momento veremos cómo obtenerlos.

Si ejecutamos este test veremos que no pasa, ya que ha cambiado la forma en que se guarda el _snapshot_, que ahora tiene este aspecto:

```
[foo, 0, 0] => foo, -1, 0
```

La parte izquierda muestra la combinación de valores testeada y la derecha, el resultado obtenido.

Por tanto, aprobamos el resultado:

```shell
mv tests/approvals/GildedRoseTest.testFoo.received.txt tests/approvals/GildedRoseTest.testFoo.approved.txt
```

Y comprobamos que el test pasa. Ya casi estamos.

Vamos a refactorizar un poquito el test para empezar a trabajar las combinaciones de valores:

Primero extraigo a variables los arrays que pasamos a `verifyAllCombinations`, así les podemos dar un nombre e identificarlos correctamente.

```php
class GildedRoseTest extends TestCase
{
    public function testFoo(): void
    {
        $itemName = 'foo';
        $sellIn = 0;
        $quality = 0;

        $updateQuality = static function ($itemName, $sellIn, $quality) {
            $items = [new Item($itemName, $sellIn, $quality)];
            $gildedRose = new GildedRose($items);
            $gildedRose->updateQuality();
            return $items[0];
        };

        $itemNames = [$itemName];
        $sellIns = [$sellIn];
        $qualities = [$quality];
        
        CombinationApprovals::verifyAllCombinations3(
            $updateQuality,
            $itemNames,
            $sellIns,
            $qualities
        );
    }
}
```

Hecho esto, hago _inline_ de las variables individuales:

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

        $itemNames = ['foo'];
        $sellIns = [0];
        $qualities = [0];
        
        CombinationApprovals::verifyAllCombinations3(
            $updateQuality,
            $itemNames,
            $sellIns,
            $qualities
        );
    }
}
```

Ya está más claro que `$itemNames`, `$sellIns` y `$qualities` van a contener los valores correspondientes a cada parámetro que estoy considerando.

Ahora solo tenemos que añadir más valores a esas listas. ¿Podemos hacerlo de una forma más sistemática?

Sí. La principal es leer el código y buscar los valores que se chequean en las condicionales. Estos nos indicarán los valores que queremos incluir en la lista, junto con, probablemente, los valores adyacentes.

Podemos ayudarnos del code coverage para identificar las partes del código que no se ejecutan. Normalmente, serán ramas de una condicional y no tenemos más que examinarla para saber qué valores podrían forzar a pasar por ahí el flujo de ejecución.

Así que vamos a ver el código bajo test:

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

La primera línea dentro del bucle es una condicional que chequea dos posibles nombres del item. Esto ya nos está diciendo dos valores interesantes para nuestro test. Por tanto, los añadimos.

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
            'Backstage passes to a TAFKAL80ETC concert'
            ];
        $sellIns = [0];
        $qualities = [0];

        CombinationApprovals::verifyAllCombinations3(
            $updateQuality,
            $itemNames,
            $sellIns,
            $qualities
        );
    }
}
```

Vamos a ver qué pasa si ejecutamos el test ahora. Lo lógico es que falle porque vamos a generar tres tests, cuando nuestro _snapshot_ aprobado solo tiene resultados de uno. Esto es lo que recibiremos ahora:

```
[foo, 0, 0] => foo, -1, 0
[Aged Brie, 0, 0] => Aged Brie, -1, 2
[Backstage passes to a TAFKAL80ETC concert, 0, 0] => Backstage passes to a TAFKAL80ETC concert, -1, 0
```

Podemos aprobar este _snapshot_, aunque ahora mismo tampoco es importante dado que estamos centradas en conseguir la máxima cobertura.

De hecho, no hemos aumentado la cobertura con estos valores, aunque son importantes.

En mi caso, la primera línea que aparece en rojo, indicando que no ha sido ejecutada, es esta:

```php
if ($item->name != 'Sulfuras, Hand of Ragnaros') {
    $item->quality = $item->quality - 1;
}
```

Está controlada por esta condicional:

```php
if ($item->quality > 0) {
    if ($item->name != 'Sulfuras, Hand of Ragnaros') {
        $item->quality = $item->quality - 1;
    }
}
```

Esto indica que necesitamos probar un valor de `$quality` que sea mayor que `0`, así que podemos probar con `1`.

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
            'Backstage passes to a TAFKAL80ETC concert'
            ];
        $sellIns = [0];
        $qualities = [
            0,
            1,
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

Al ejecutar el test, vemos que sigue fallando. Es lo esperable dado que es la primera vez que ejecutamos esta versión. Pero, como señalamos antes, no es un problema.

Si nos fijamos en el code coverage veremos que ha aumentado. En PHP nos indica que ahora se cubre hasta un 96% de las líneas, algo que es engañoso por la forma en que se elabora esta métrica, al menos en versiones de PHPUnit anteriores a la 10. ¿Por qué? Básicamente, porque en este momento a PHPUnit le basta con que se pase una vez por la condicional para considerarla cubierta. Para tener una información más realista, necesitamos que nos diga si ha pasado con todos los valores posibles.

En otros lenguajes, como Java, es posible observar el _branch_ o _path_ coverage, lo cual nos permitirá saber si tenemos suficientes valores para probar una condicional.

En cualquier caso, podemos hacerlo a mano.

Volviendo al fragmento de código anterior, vemos que tenemos un nuevo nombre de item:

```php
```php
if ($item->quality > 0) {
    if ($item->name != 'Sulfuras, Hand of Ragnaros') {
        $item->quality = $item->quality - 1;
    }
}
```

Por tanto, lo añadimos a la lista:

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
        $sellIns = [0];
        $qualities = [
            0,
            1,
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

En este bloque no tenemos más que rascar. Asi que fijémonos aquí:

```php
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
```

Para entrar en esta condicional es necesario un valor de `$quality` menor que 50, lo que nos estaría diciendo que tanto 49 como 50 son valores interesantes. Ahora mismo, que solo tenemos 0 y 1, la ejecución entraría siempre, por lo que 50 es un valor significativo para asegurarnos de que tenemos casos en los que no se entra a esta condición.

49 es también interesante porque si nos fijamos, lo primero que se hace es incrementar `$quality` y un poco más abajo de nuevo se comprueba si `$quality` es aún menor que 50. Esto es porque en las instrucciones del ejercicio nos dicen que 50 es el valor máximo de esta propiedad. Por tanto, si empezamos con un valor de `$quality` de 49, se le sumará 1 y al ser 50, no entrará en las condicionales que tenemos más abajo.

Por estos motivos añadimos 49 y 50 a la lista de valores posibles para `$quality`.

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
        $sellIns = [0];
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

En el mismo bloque tenemos valores para $sellIn:

```php
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
```

Estos valores son 11 y 6, que controlan el incremento de calidad para los pases del _Backstage_, dependiendo del número de días que quedan para el concierto. Por asegurar, añadiría también 10 y 5. Puede ser un poco redundante, pero tampoco sobra

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

Un poco más abajo tenemos esta condicional:

```php
if ($item->sellIn < 0)
```

Claramente, nos está señalando que necesitamos probar un valor de `$sellIn` como -1 para asegurar que entramos en esa condicional. De hecho, ahora el coverage la marca como cubierto. Esto es porque existe un caso en que `$sellIn` puede ser negativo y ocurriría justo antes si el `$sellIn` de "Sulfuras" es 0.

```php
if ($item->name != 'Sulfuras, Hand of Ragnaros') {
    $item->sellIn = $item->sellIn - 1;
}
```

`$sellIn` negativo indicaría que se ha superado la fecha de caducidad y, por supuesto, necesitamos caracterizar lo que ocurre en ese caso.

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

Vamos a ejecutar ahora el test para ver qué _snapshot_ nos genera. Ni más ni menos que 96 tests, resultado de combinar los 4 valores de items, con los 6 de $sellIn y los 4 de $quality (4 x 6 x 4 = 96).

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
[Aged Brie, -1, 0] => Aged Brie, -2, 2
[Aged Brie, -1, 1] => Aged Brie, -2, 3
[Aged Brie, -1, 49] => Aged Brie, -2, 50
[Aged Brie, -1, 50] => Aged Brie, -2, 50
[Aged Brie, 0, 0] => Aged Brie, -1, 2
[Aged Brie, 0, 1] => Aged Brie, -1, 3
[Aged Brie, 0, 49] => Aged Brie, -1, 50
[Aged Brie, 0, 50] => Aged Brie, -1, 50
[Aged Brie, 5, 0] => Aged Brie, 4, 1
[Aged Brie, 5, 1] => Aged Brie, 4, 2
[Aged Brie, 5, 49] => Aged Brie, 4, 50
[Aged Brie, 5, 50] => Aged Brie, 4, 50
[Aged Brie, 6, 0] => Aged Brie, 5, 1
[Aged Brie, 6, 1] => Aged Brie, 5, 2
[Aged Brie, 6, 49] => Aged Brie, 5, 50
[Aged Brie, 6, 50] => Aged Brie, 5, 50
[Aged Brie, 10, 0] => Aged Brie, 9, 1
[Aged Brie, 10, 1] => Aged Brie, 9, 2
[Aged Brie, 10, 49] => Aged Brie, 9, 50
[Aged Brie, 10, 50] => Aged Brie, 9, 50
[Aged Brie, 11, 0] => Aged Brie, 10, 1
[Aged Brie, 11, 1] => Aged Brie, 10, 2
[Aged Brie, 11, 49] => Aged Brie, 10, 50
[Aged Brie, 11, 50] => Aged Brie, 10, 50
[Backstage passes to a TAFKAL80ETC concert, -1, 0] => Backstage passes to a TAFKAL80ETC concert, -2, 0
[Backstage passes to a TAFKAL80ETC concert, -1, 1] => Backstage passes to a TAFKAL80ETC concert, -2, 0
[Backstage passes to a TAFKAL80ETC concert, -1, 49] => Backstage passes to a TAFKAL80ETC concert, -2, 0
[Backstage passes to a TAFKAL80ETC concert, -1, 50] => Backstage passes to a TAFKAL80ETC concert, -2, 0
[Backstage passes to a TAFKAL80ETC concert, 0, 0] => Backstage passes to a TAFKAL80ETC concert, -1, 0
[Backstage passes to a TAFKAL80ETC concert, 0, 1] => Backstage passes to a TAFKAL80ETC concert, -1, 0
[Backstage passes to a TAFKAL80ETC concert, 0, 49] => Backstage passes to a TAFKAL80ETC concert, -1, 0
[Backstage passes to a TAFKAL80ETC concert, 0, 50] => Backstage passes to a TAFKAL80ETC concert, -1, 0
[Backstage passes to a TAFKAL80ETC concert, 5, 0] => Backstage passes to a TAFKAL80ETC concert, 4, 3
[Backstage passes to a TAFKAL80ETC concert, 5, 1] => Backstage passes to a TAFKAL80ETC concert, 4, 4
[Backstage passes to a TAFKAL80ETC concert, 5, 49] => Backstage passes to a TAFKAL80ETC concert, 4, 50
[Backstage passes to a TAFKAL80ETC concert, 5, 50] => Backstage passes to a TAFKAL80ETC concert, 4, 50
[Backstage passes to a TAFKAL80ETC concert, 6, 0] => Backstage passes to a TAFKAL80ETC concert, 5, 2
[Backstage passes to a TAFKAL80ETC concert, 6, 1] => Backstage passes to a TAFKAL80ETC concert, 5, 3
[Backstage passes to a TAFKAL80ETC concert, 6, 49] => Backstage passes to a TAFKAL80ETC concert, 5, 50
[Backstage passes to a TAFKAL80ETC concert, 6, 50] => Backstage passes to a TAFKAL80ETC concert, 5, 50
[Backstage passes to a TAFKAL80ETC concert, 10, 0] => Backstage passes to a TAFKAL80ETC concert, 9, 2
[Backstage passes to a TAFKAL80ETC concert, 10, 1] => Backstage passes to a TAFKAL80ETC concert, 9, 3
[Backstage passes to a TAFKAL80ETC concert, 10, 49] => Backstage passes to a TAFKAL80ETC concert, 9, 50
[Backstage passes to a TAFKAL80ETC concert, 10, 50] => Backstage passes to a TAFKAL80ETC concert, 9, 50
[Backstage passes to a TAFKAL80ETC concert, 11, 0] => Backstage passes to a TAFKAL80ETC concert, 10, 1
[Backstage passes to a TAFKAL80ETC concert, 11, 1] => Backstage passes to a TAFKAL80ETC concert, 10, 2
[Backstage passes to a TAFKAL80ETC concert, 11, 49] => Backstage passes to a TAFKAL80ETC concert, 10, 50
[Backstage passes to a TAFKAL80ETC concert, 11, 50] => Backstage passes to a TAFKAL80ETC concert, 10, 50
[Sulfuras, Hand of Ragnaros, -1, 0] => Sulfuras, Hand of Ragnaros, -1, 0
[Sulfuras, Hand of Ragnaros, -1, 1] => Sulfuras, Hand of Ragnaros, -1, 1
[Sulfuras, Hand of Ragnaros, -1, 49] => Sulfuras, Hand of Ragnaros, -1, 49
[Sulfuras, Hand of Ragnaros, -1, 50] => Sulfuras, Hand of Ragnaros, -1, 50
[Sulfuras, Hand of Ragnaros, 0, 0] => Sulfuras, Hand of Ragnaros, 0, 0
[Sulfuras, Hand of Ragnaros, 0, 1] => Sulfuras, Hand of Ragnaros, 0, 1
[Sulfuras, Hand of Ragnaros, 0, 49] => Sulfuras, Hand of Ragnaros, 0, 49
[Sulfuras, Hand of Ragnaros, 0, 50] => Sulfuras, Hand of Ragnaros, 0, 50
[Sulfuras, Hand of Ragnaros, 5, 0] => Sulfuras, Hand of Ragnaros, 5, 0
[Sulfuras, Hand of Ragnaros, 5, 1] => Sulfuras, Hand of Ragnaros, 5, 1
[Sulfuras, Hand of Ragnaros, 5, 49] => Sulfuras, Hand of Ragnaros, 5, 49
[Sulfuras, Hand of Ragnaros, 5, 50] => Sulfuras, Hand of Ragnaros, 5, 50
[Sulfuras, Hand of Ragnaros, 6, 0] => Sulfuras, Hand of Ragnaros, 6, 0
[Sulfuras, Hand of Ragnaros, 6, 1] => Sulfuras, Hand of Ragnaros, 6, 1
[Sulfuras, Hand of Ragnaros, 6, 49] => Sulfuras, Hand of Ragnaros, 6, 49
[Sulfuras, Hand of Ragnaros, 6, 50] => Sulfuras, Hand of Ragnaros, 6, 50
[Sulfuras, Hand of Ragnaros, 10, 0] => Sulfuras, Hand of Ragnaros, 10, 0
[Sulfuras, Hand of Ragnaros, 10, 1] => Sulfuras, Hand of Ragnaros, 10, 1
[Sulfuras, Hand of Ragnaros, 10, 49] => Sulfuras, Hand of Ragnaros, 10, 49
[Sulfuras, Hand of Ragnaros, 10, 50] => Sulfuras, Hand of Ragnaros, 10, 50
[Sulfuras, Hand of Ragnaros, 11, 0] => Sulfuras, Hand of Ragnaros, 11, 0
[Sulfuras, Hand of Ragnaros, 11, 1] => Sulfuras, Hand of Ragnaros, 11, 1
[Sulfuras, Hand of Ragnaros, 11, 49] => Sulfuras, Hand of Ragnaros, 11, 49
[Sulfuras, Hand of Ragnaros, 11, 50] => Sulfuras, Hand of Ragnaros, 11, 50
```

Y, por supuesto, ahora tenemos una sólida cobertura del 100%. Por supuesto, podemos añadir cualquier otro valor que nos pueda aportar información.

Si aprobamos este _snapshot_ tenemos un test que describe el comportamiento. Este test es el _Golden Master_.

Con esto estamos listas para iniciar un proceso de refactoring. En una entrega futura me gustaría mostraros una técnica muy interesante para este ejercicio en concreto.

## Conclusiones

La técnica de Golden Master nos permite cubrir rápidamente una pieza de código con tests de caracterización, estableciendo una red de seguridad para abordar un refactor.

Con la librería [Approval Tests](https://approvaltests.com) tenemos una herramienta con la que generar este Golden Master de una manera bastante cómoda y con relativamente poco esfuerzo. Usando la métrica de cobertura y analizando el código bajo test, podemos encontrar los valores que queremos tener en cuenta para generar las combinaciones necesarias.
