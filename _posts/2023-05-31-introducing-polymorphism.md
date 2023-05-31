---
layout: post
title: De condicionales a polimorfismo
categories: articles
tags: refactoring good-practices
---

Con este artículo vamos a finalizar el trabajo de refactorizar el código de Gilded Rose.

En los artículos anteriores hemos visto cómo poner un código complicado bajo test usando Golden Master, después hemos presentado dos formas de refactorizarlo para hacerlo más fácil de comprender. Finalmente, vamos a avanzar un paso más y convertirlo en código orientado a objetos.

Por mucho que el problema Gilded Rose se nos presente como un código organizado con clases y ofreciendo una apariencia de orientación a objetos, lo cierto es que se trata de un código procedural. De hecho, nuestro refactor, hasta ahora, ha mejorado su organización dentro de ese paradigma.

En otras palabras: sigue siendo código procedural, pero mejor estructurado.

En el ejercicio, el objetivo de este refactor es preparar el código para poder introducir nuevos productos en la tienda.

Está claro que ahora es más fácil de hacer, ya que bastaría añadir un nuevo método que gestione el producto y retocar el bucle principal. Pero eso implica modificar el código, rompiendo principio Open for extension and Closed for modification.

Lo que querríamos es no tener que modificar nada para introducir nuevos productos, tan solo añadir el código necesario. Y eso es algo que podemos conseguir aplicando principios de orientación a objetos.

Así que vamos a hacerlo.


## Donde estamos ahora

Recordemos el estado del código, La clase `GildedRose` se sigue ocupando de todo. La diferencia es que según el tipo de item redirige el flujo hacia un método u otro. 

```php
<?php

declare(strict_types=1);

namespace GildedRose;

final class GildedRose
{
    /**
     * @param Item[] $items
     */
    public function __construct(
        private array $items
    )
    {
    }

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

    private function updateSulfuras(Item $item)
    {

    }

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

    private function updateNormal(Item $item): void
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
}
```

Y de momento, vamos a fijarnos en esto:

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

Voy a separar el iterador `foreach` de su bloque de código. Si te fijas, ahora se puede leer: "actualiza cada ítem".

```php
public function updateQuality(): void
{
    foreach ($this->items as $item) {
        $this->update($item);
    }
}
```

Al actualizar un ítem lo que hacemos es mirar el estado de sus propiedades y cambiarlas, lo que indica que no se está respetando el principio "Tell, don't ask". O dicho de otra forma: en programación orientada a objetos le pediríamos al ítem que se actualice, enviándole el mensaje `update`. Algo como esto, que es lo que queremos conseguir:

```php
public function updateQuality(): void
{
    foreach ($this->items as $item) {
        $item->update();
    }
}
```

En esta versión del código, como se puede ver, `GildedRose` simplemente recorre la lista de los ítems y les pide que se actualicen.

Ahora bien, resulta que sabemos que hay varias formas en las que un ítem podría actualizarse dependiendo de su tipo. Existen diversos tipos de ítems y cada uno se actualiza de una forma diferente.

La programación orientada a objetos nos proporciona polimorfismo. El polimorfismo significa que distintos objetos pueden recibir el mismo mensaje y actuar de manera diferente. Es exactamente lo que queremos.

Para introducir el polimorfismo en nuestro ejercicio tenemos que analizar la forma en que `GildedRose` decide cómo actuar ante cada tipo de item:

```php
private function update(Item $item): void
{
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
```

En este momento, el método `update` distribuye el flujo a los distintos métodos dependiendo del tipo de ítem, identificado por su nombre. Sigue siendo un problema de "Tell, don't ask", porque le preguntamos cosas al objeto, a fin de decidir qué hacer con él.

El propio nombre de los métodos nos está diciendo cosas:

```
updateBrie($item)
updateBackStage($item)
updateSulfuras($item)
updateNormal($item)
```

Podemos identificar una parte común `update` que nos indica la acción, y una parte diferente, que nos indica el tipo de ítem sobre el que se aplica.

`update` es justamente el mensaje que queremos poder enviar a los distintos ítems, cuyos tipos son:

```
AgedBrie
BackstagePass
Sulfuras
Normal
```

Tenemos cuatro variantes de un mismo concepto (Item). En código orientado a objetos solemos expresar esto mediante la herencia de interfaz. Es decir, todos esos subtipos responden al mismo mensaje `update`, cada cual a su manera, según se define en un tipo más abstracto.

La herencia de interfaz puede implementarse de dos maneras:

* Extendiendo una clase, cuando puede interesarnos compartir funcionalidad entre las clases derivadas
* Implementando clases que cumplan la misma interfaz

La pregunta es, ¿cómo podemos cambiar el código de su estado actual a polimorfismo con el menor coste posible?

## Convirtiéndonos al polimorfismo

Como ya he mencionado anteriormente, estos artículos están basados en ideas de Llewellyn Falco, Emily Bache y Sandi Metz, y este tercer artículo no es una excepción. Hay que tener en cuenta, por otro lado, que los ejemplos de código que han usado están en Java y Ruby. La elección del lenguaje de programación puede condicionar la forma en que hacemos los refactorings, por lo que tomaré ideas de una y otra fuente, así como algunas de mi cosecha.

Según el enunciado del ejercicio, estaría prohibido tocar la clase `Item`, que en la práctica no hace más que definir un DTO y que está marcada como final. 

Sería posible realizar el refactor sin tocarla, considerando Item como un DTO e introduciendo otra clase en su lugar. Sin embargo, vamos a intentar convencer al Goblin de que solo queremos añadir comportamiento en el `Item` y que no vamos a alterar su estructura actual. De este modo, por otro lado, evitamos introducir algunas consideraciones que podrían distraernos mucho del objetivo del artículo.  

Esto también significa que quitaremos la marca de `final` a la clase `Item`.

En fin. Como hemos mencionado ya, el objetivo es mover el comportamiento a Item para que la clase GildedRose actúe solo como coordinadora. Y exactamente eso es lo que vamos a hacer. Vamos a copiar todo el código que nos interesa y lo vamos a pegar en Item, adaptándolo a nuestras necesidades.

Y para que sea más seguro utilizaré un refactor automático del IDE: `Move Instance Method` (está en el menú de refactor de IntelliJ).

Empiezo por los métodos `update*($item)`. Por ejemplo, `updateSulfuras`. Muestro aquí el código actual en `GildedRose`:

```php
private function update(Item $item): void
{
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

private function updateSulfuras(Item $item)
{

}
```

Para usar el _Move Instance Method_ me sitúo en el nombre del método `updateSulfuras` e invoco la opción en el menú de Refactor. A continuación indico que lo quiero mover a la clase Item y que su visibilidad sea `public`.

El método desaparece de GildedRose y se mueve a Item:

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

    public function updateSulfuras()
    {

    }
}
```

Pero puede que lo más interesante haya pasado en `GildedRose`, ya que se ha actualizado la llamada para reflejar que el método está en `$item`. Y lo mejor, es que los tests siguen pasando como antes.

```php
private function update(Item $item): void
{
    if ($item->name === 'Aged Brie') {
        $this->updateBrie($item);
    } elseif ($item->name === 'Backstage passes to a TAFKAL80ETC concert') {
        $this->updateBackStage($item);
    } elseif ($item->name === 'Sulfuras, Hand of Ragnaros') {
    
        $item->updateSulfuras();
    
    } else {
        $this->updateNormal($item);
    }
}
```

Es decir, lo que hacemos es copiar el método deseado de `GildedRose` a `Item`, cambiar la llamada en `update` para que invoque la versión de `Item` y, para finalizar, borramos el método en `GildedRose`.

Hacemos lo mismo con los otros tres métodos. `Item` nos habrá quedado así:

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

    public function updateSulfuras()
    {

    }

    public function updateBackStage()
    {
        if ($this->sellIn >= 11) {
            $this->quality += 1;
        } elseif ($this->sellIn >= 6) {
            $this->quality += 2;
        } elseif ($this->sellIn >= 1) {
            $this->quality += 3;
        } else {
            $this->quality = 0;
        }

        if ($this->quality > 50) {
            $this->quality = 50;
        }

        $this->sellIn -= 1;
    }

    public function updateBrie()
    {
        if ($this->sellIn >= 1) {
            $this->quality += 1;
        } else {
            $this->quality += 2;
        }

        if ($this->quality > 50) {
            $this->quality = 50;
        }

        $this->sellIn -= 1;
    }

    public function updateNormal(): void
    {
        if ($this->sellIn >= 1) {
            $this->quality -= 1;
        } else {
            $this->quality -= 2;
        }

        if ($this->quality <= 0) {
            $this->quality = 0;
        }

        $this->sellIn -= 1;
    }
}
```

Únicamente nos queda mover el método `update`, usando el mismo refactor. Puedes observar que todas las llamadas se hacen ahora a `Item`.

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

    public function updateSulfuras()
    {

    }

    public function updateBackStage()
    {
        if ($this->sellIn >= 11) {
            $this->quality += 1;
        } elseif ($this->sellIn >= 6) {
            $this->quality += 2;
        } elseif ($this->sellIn >= 1) {
            $this->quality += 3;
        } else {
            $this->quality = 0;
        }

        if ($this->quality > 50) {
            $this->quality = 50;
        }

        $this->sellIn -= 1;
    }

    public function updateBrie()
    {
        if ($this->sellIn >= 1) {
            $this->quality += 1;
        } else {
            $this->quality += 2;
        }

        if ($this->quality > 50) {
            $this->quality = 50;
        }

        $this->sellIn -= 1;
    }

    public function updateNormal(): void
    {
        if ($this->sellIn >= 1) {
            $this->quality -= 1;
        } else {
            $this->quality -= 2;
        }

        if ($this->quality <= 0) {
            $this->quality = 0;
        }

        $this->sellIn -= 1;
    }

    public function update(): void
    {
        if ($this->name === 'Aged Brie') {
            $this->updateBrie();
        } elseif ($this->name === 'Backstage passes to a TAFKAL80ETC concert') {
            $this->updateBackStage();
        } elseif ($this->name === 'Sulfuras, Hand of Ragnaros') {
            $this->updateSulfuras();
        } else {
            $this->updateNormal();
        }
    }
}
```

¿Y qué ha pasado con GildedRose? Pues que ya está exactamente como queríamos. `GildedRose` envía el mensaje `update` a los objetos `Item`, pero no sabe qué variante concreta maneja en cada momento. 

```php
final class GildedRose
{
    /**
     * @param Item[] $items
     */
    public function __construct(
        private array $items
    )
    {
    }

    public function updateQuality(): void
    {
        foreach ($this->items as $item) {
            $item->update();
        }
    }
}

```

## Derivando las clases

De momento, solo hemos movido comportamiento de una clase a otra. Puede parecer que no es un gran movimiento, pero, por lo pronto, nos está acercando a una solución realmente orientada a objetos.

Lo que queremos ahora es introducir las clases derivadas de `Item`. Por el momento, solo vamos a tenerlas, aunque no hagan nada. Y serán todas de este estilo:

```php
final class AgedBrie extends Item
{
    public function update(): void
    {
        $this->updateBrie();
    }
}
```

En pocas palabras, usarán el constructor por defecto. Y el método `update` llamará al correspondiente método en la clase base. Esto cambiará, pero de momento solo quiero introducir nada más que el código suficiente para lo que necesito ahora.

Las demás clases quedarán así:

```php
final class Sulfuras extends Item
{
    public function update(): void
    {
        $this->updateSulfuras();
    }
}
```

```php
final class BackstagePass extends Item
{
    public function update(): void
    {
        $this->updateBackStage();
    }
}
```

```php
final class Normal extends Item
{
    public function update(): void
    {
        $this->updateNormal();
    }
}
```

Estos cambios no deberían afectar a los tests, por lo que siguen pasando.

## Instanciar el Item correcto

Ahora mismo necesitaríamos una forma de poner a trabajar nuestras clases. Lo que queremos decidir a qué tipo de objeto le enviaremos el mensaje `update` en lugar de mandárselo a Item y que este decida qué algoritmo debe utilizar en cada caso.

Lo mejor sería que al instanciar Item, ya instanciemos la clase correcta según el nombre.

En el ejercicio, esto ocurre en el test:

```php
$updateQuality = static function ($itemName, $sellIn, $quality) {
    $items = [new Item($itemName, $sellIn, $quality)];
    $gildedRose = new GildedRose($items);
    $gildedRose->updateQuality();
    return $items[0];
};
```

Podríamos usar un método factoría en lugar de llamar directamente a los constructores, encapsulando toda la lógica necesaria:

```php
class Item implements \Stringable
{
    public function __construct(
        public string $name,
        public int $sellIn,
        public int $quality
    ) {
    }

    public static function byName(string $name, int $sellIn, int $quality): Item
    {
        if ($name === 'Aged Brie') {
            return new AgedBrie($name, $sellIn, $quality);
        } elseif ($name === 'Backstage passes to a TAFKAL80ETC concert') {
            return new BackstagePass($name, $sellIn, $quality);
        } elseif ($name === 'Sulfuras, Hand of Ragnaros') {
            return new Sulfuras($name, $sellIn, $quality);
        } else {
            return new Normal($name, $sellIn, $quality);
        }
    }
    
    // Removed code   
}
```

Y una vez que lo tenemos, podemos empezar a usarlo:


```php
$updateQuality = static function ($itemName, $sellIn, $quality) {
    $items = [Item::byName($itemName, $sellIn, $quality)];
    $gildedRose = new GildedRose($items);
    $gildedRose->updateQuality();
    return $items[0];
};
```

Y si ejecutamos los tests, vemos que pasan y todo sigue bien.

### Mover el comportamiento a las clases derivadas

Ya nos queda un último paso. Ahora mismo, los distintos ítems se instancian correctamente conforme a su tipo. Pero delegan todo el comportamiento en la clase base `Item`.

Lo que vamos a hacer a continuación es traernos el código necesario mediante el refactor _Inline Method_. Es decir, partiendo de esto:

```php
final class AgedBrie extends Item
{
    public function update(): void
    {
        $this->updateBrie();
    }
}
```

Vamos a copiar el contenido del método `Item::updateBrie()` y ponerlo en `AgedBrie::update()`. Posteriormente, borraremos el método en Item. Con el refactor automático podemos hacer esto en un par de clics, usando `Inline and remove the method`.

```php
final class AgedBrie extends Item
{
    public function update(): void
    {
        if ($this->sellIn >= 1) {
            $this->quality += 1;
        } else {
            $this->quality += 2;
        }

        if ($this->quality > 50) {
            $this->quality = 50;
        }

        $this->sellIn -= 1;
    }
}
```

Hacemos lo mismo en las demás clases.

También tenemos que vaciar el método `update` de `Item`, para que nos quede como sigue. Al aplicar el refactor automático habremos visto como se reincorporó el código de los métodos, pero ahora ya no se ejecuta como podremos comprobar si tiramos los tests con cobertura.

```php
class Item implements \Stringable
{
    public function __construct(
        public string $name,
        public int $sellIn,
        public int $quality
    ) {
    }

    public static function byName(string $name, int $sellIn, int $quality): Item
    {
        if ($name === 'Aged Brie') {
            return new AgedBrie($name, $sellIn, $quality);
        } elseif ($name === 'Backstage passes to a TAFKAL80ETC concert') {
            return new BackstagePass($name, $sellIn, $quality);
        } elseif ($name === 'Sulfuras, Hand of Ragnaros') {
            return new Sulfuras($name, $sellIn, $quality);
        } else {
            return new Normal($name, $sellIn, $quality);
        }
    }

    public function __toString(): string
    {
        return (string) "{$this->name}, {$this->sellIn}, {$this->quality}";
    }

    public function update(): void
    {
    }
}
```

Y con esto, casi estaríamos. Nuestro GildedRose es ahora abierto a extensión. O más bien, está más abierto a extensión que antes. Si queremos añadir un nuevo tipo de Item tendríamos que añadir una clase y tocar el método `Item::byName` para darle soporte. Todavía podemos mejorar algunas cosas, pero lo que hemos conseguido es que los cambios estén mucho más localizados y sean más fáciles de implementar.

## Todavía más orientados a objetos

En la charla que mencionamos en el artículo anterior, Sandi Metz señalaba que el código de la factoría se podría entender como una cuestión de configuración al relacionar un nombre con un tipo de objeto que se debe crear.

En lenguajes como Ruby o PHP es fácil aprovechar esta idea, ya que es posible instanciar una clase dinámicamente. Fíjate como podemos modificar `Item::byName`. Primer paso: ponemos los nombres de las clases en una variable:

```php
public static function byName(string $name, int $sellIn, int $quality): Item
{
    if ($name === 'Aged Brie') {
        $className = AgedBrie::class;
        return new $className($name, $sellIn, $quality);
    } elseif ($name === 'Backstage passes to a TAFKAL80ETC concert') {
        $className = BackstagePass::class;
        return new $className($name, $sellIn, $quality);
    } elseif ($name === 'Sulfuras, Hand of Ragnaros') {
        $className = Sulfuras::class;
        return new $className($name, $sellIn, $quality);
    } else {
        $className = Normal::class;
        return new $className($name, $sellIn, $quality);
    }
}
```

Separamos la parte común:

```php
public static function byName(string $name, int $sellIn, int $quality): Item
{
    if ($name === 'Aged Brie') {
        $className = AgedBrie::class;
    } elseif ($name === 'Backstage passes to a TAFKAL80ETC concert') {
        $className = BackstagePass::class;
    } elseif ($name === 'Sulfuras, Hand of Ragnaros') {
        $className = Sulfuras::class;
    } else {
        $className = Normal::class;
    }
    return new $className($name, $sellIn, $quality);
}
```

Esto se puede convertir en un diccionario en forma de array asociativo en PHP:

```php
public static function byName(string $name, int $sellIn, int $quality): Item
{
    $classMap = [
        'Aged Brie' => AgedBrie::class,
        'Backstage passes to a TAFKAL80ETC concert' => BackstagePass::class,
        'Sulfuras, Hand of Ragnaros' => Sulfuras::class,
    ];
    $className = $classMap[$name] ?? Normal::class;
    
    return new $className($name, $sellIn, $quality);
}
```

De este modo, añadir un nuevo producto supone añadir la nueva clase derivada y modificar `$classMap`. Pero es que todavía podemos hacerlo un poco mejor, dejando claro que `CLASS_MAP` es información y no comportamiento. Es cierto que añadir entradas en `CLASS_MAP` es _modificar_ el código, pero no estamos modificando comportamiento. 

```php
class Item implements \Stringable
{
    private const CLASS_MAP = [
        'Aged Brie' => AgedBrie::class,
        'Backstage passes to a TAFKAL80ETC concert' => BackstagePass::class,
        'Sulfuras, Hand of Ragnaros' => Sulfuras::class,
    ];

    public function __construct(
        public string $name,
        public int    $sellIn,
        public int    $quality
    )
    {
    }

    public static function byName(string $name, int $sellIn, int $quality): Item
    {
        $classMap = self::CLASS_MAP;
        $className = $classMap[$name] ?? Normal::class;

        return new $className($name, $sellIn, $quality);
    }

    public function __toString(): string
    {
        return "{$this->name}, {$this->sellIn}, {$this->quality}";
    }

    public function update(): void
    {
    }
}
```

## Diversión con Value Objects

Observemos esto:

```php
final class AgedBrie extends Item
{

    public function update(): void
    {
        if ($this->sellIn >= 1) {
            $this->quality += 1;
        } else {
            $this->quality += 2;
        }

        if ($this->quality > 50) {
            $this->quality = 50;
        }

        $this->sellIn -= 1;
    }
}
```

Si nos fijamos en $quality vemos que se aplica una regla que es específicamente suya: nunca puede crecer más que 50. Aparte que tiene el comportamiento de incrementarse.

Y también puede decrementarse, pero en este caso no puede bajar de cero:

```php
final class Normal extends Item
{

    public function update(): void
    {
        if ($this->sellIn >= 1) {
            $this->quality -= 1;
        } else {
            $this->quality -= 2;
        }

        if ($this->quality <= 0) {
            $this->quality = 0;
        }

        $this->sellIn -= 1;
    }
}
```

Quality es un concepto importante del dominio, que nos importa por su valor. Podríamos usar un Value Object. Además, es un tipo primitivo, y ya solo por eso podría interesarnos convertirlo en objeto.

Para introducirlo, voy a ir en paralelo. Dado que toda la construcción se realiza en Item, debería ser fácil introducir el cambio.

De momento, nos podría bastar con crear una clase `Quality` que pueda contener un valor. `Quality` no puede crecer más allá de 50 ni decrecer por debajo de 0. Y tiene métodos para incrementarse o decrementarse. Como podemos ver, también es inmutable.

```php
final class Quality
{
    private int $quality;

    public function __construct(int $quality)
    {
        $this->quality = $quality;
    }

    public function increase(int $delta): Quality
    {
        $increased = $this->quality + $delta;
        if ($increased > 50) {
            $increased = 50;
        }
        return new Quality($increased);
    }

    public function decrease(int $delta): Quality
    {
        $decreased = $this->quality - $delta;
        if ($decreased < 0) {
            $decreased = 0;
        }
        return new Quality($decreased);
    }
}
```

Lo introducimos en `Item` de esta forma, así lo mantenemos aislado sin afectar al código actual.

```php
class Item implements \Stringable
{
    private const CLASS_MAP = [
        'Aged Brie' => AgedBrie::class,
        'Backstage passes to a TAFKAL80ETC concert' => BackstagePass::class,
        'Sulfuras, Hand of Ragnaros' => Sulfuras::class,
    ];

    public function __construct(
        public string $name,
        public int    $sellIn,
        public int    $quality,
        private Quality $qualityValue,
    )
    {
    }

    public static function byName(string $name, int $sellIn, int $quality): Item
    {
        $classMap = self::CLASS_MAP;
        $className = $classMap[$name] ?? Normal::class;

        return new $className($name, $sellIn, $quality, new Quality($quality));
    }

    public function __toString(): string
    {
        return "{$this->name}, {$this->sellIn}, {$this->quality}";
    }

    public function update(): void
    {
    }
}
```

Y ahora podemos empezar a usarlo, todavía sin que tenga efectos en el comportamiento:

```php
final class AgedBrie extends Item
{

    public function update(): void
    {
        if ($this->sellIn >= 1) {
            $this->qualityValue = $this->qualityValue->increase(1);
            $this->quality += 1;
        } else {
            $this->qualityValue = $this->qualityValue->increase(2);
            $this->quality += 2;
        }

        if ($this->quality > 50) {
            $this->quality = 50;
        }

        $this->sellIn -= 1;
    }
}
```

Fíjate que, puesto que Quality controla sus límites, no necesitamos chequearlos nosotras. Siempre se incrementará o decrementará de forma correcta.

Para verificar que los estamos haciendo bien, vamos a sobreescribir el método `__toString` en AgedBrie de manera que se genere usando `qualityValue` en lugar de `quality`. Lo que hará necesario introducir un método `__toString` igualmente en `Quality`, de modo que podamos tener una representación en forma de `string`.

```php
final class Quality implements \Stringable
{
    private int $quality;

    public function __construct(int $quality)
    {
        $this->quality = $quality;
    }

    public function increase(int $delta): Quality
    {
        $increased = $this->quality + $delta;
        if ($increased > 50) {
            $increased = 50;
        }
        return new Quality($increased);
    }

    public function decrease(int $delta): Quality
    {
        $decreased = $this->quality - $delta;
        if ($decreased < 0) {
            $decreased = 0;
        }
        return new Quality($decreased);
    }

    public function __toString(): string
    {
        return (string)$this->quality;
    }
}
```

Y así queda `AgedBrie`, gracias a que `Quality` es `Stringable`, podemos usarlo como si fuese un `string` en este contexto.

```php
final class AgedBrie extends Item
{

    public function update(): void
    {
        if ($this->sellIn >= 1) {
            $this->qualityValue = $this->qualityValue->increase(1);
            $this->quality += 1;
        } else {
            $this->qualityValue = $this->qualityValue->increase(2);
            $this->quality += 2;
        }

        if ($this->quality > 50) {
            $this->quality = 50;
        }

        $this->sellIn -= 1;
    }

    public function __toString(): string
    {
        return "{$this->name}, {$this->sellIn}, {$this->qualityValue}";
    }
}
```

Al ejecutar los tests vemos que pasan, confirmando que el cambio funciona.

De hecho, aplicar el cambio hasta las últimas consecuencias. Por el momento, solo en `AgedBrie`:

```php
final class AgedBrie extends Item
{

    public function update(): void
    {
        if ($this->sellIn >= 1) {
            $this->qualityValue = $this->qualityValue->increase(1);
        } else {
            $this->qualityValue = $this->qualityValue->increase(2);
        }

        $this->sellIn -= 1;
    }

    public function __toString(): string
    {
        return "{$this->name}, {$this->sellIn}, {$this->qualityValue}";
    }
}
```

Podemos aplicar un cambio similar en todas las demás clases:

```php
final class BackstagePass extends Item
{
    public function update(): void
    {
        if ($this->sellIn >= 11) {
            $this->qualityValue = $this->qualityValue->increase(1);
        } elseif ($this->sellIn >= 6) {
            $this->qualityValue = $this->qualityValue->increase(2);
        } elseif ($this->sellIn >= 1) {
            $this->qualityValue = $this->qualityValue->increase(3);
        } else {
            $this->qualityValue = new Quality(0);
        }

        $this->sellIn -= 1;
    }

    public function __toString(): string
    {
        return "{$this->name}, {$this->sellIn}, {$this->qualityValue}";
    }
}
```

```php
final class Normal extends Item
{

    public function update(): void
    {
        if ($this->sellIn >= 1) {
            $this->qualityValue = $this->qualityValue->decrease(1);
        } else {
            $this->qualityValue = $this->qualityValue->decrease(2);
        }

        $this->sellIn -= 1;
    }

    public function __toString(): string
    {
        return "{$this->name}, {$this->sellIn}, {$this->qualityValue}";
    }
}
```

Una vez que comprobamos que todo funciona, podemos hacer un refactor para eliminar código no usado y eliminar los métodos `__toString` en las subclases, ya que sería común para todas y podemos ponerlo en `Item`. De hecho, `Item` ya no necesita el primitivo `$quality` y en último término podríamos cambiar el nombre de `qualityValue` a `quality`.

```php
class Item implements \Stringable
{
    private const CLASS_MAP = [
        'Aged Brie' => AgedBrie::class,
        'Backstage passes to a TAFKAL80ETC concert' => BackstagePass::class,
        'Sulfuras, Hand of Ragnaros' => Sulfuras::class,
    ];

    public function __construct(
        public string $name,
        public int    $sellIn,
        protected Quality $qualityValue,
    )
    {
    }

    public static function byName(string $name, int $sellIn, int $quality): Item
    {
        $classMap = self::CLASS_MAP;
        $className = $classMap[$name] ?? Normal::class;

        return new $className($name, $sellIn, new Quality($quality));
    }

    public function __toString(): string
    {
        return "{$this->name}, {$this->sellIn}, {$this->qualityValue}";
    }

    public function update(): void
    {
    }
}
```

Podríamos aplicar un tratamiento similar a `$sellIn`. Este concepto siempre decrece en una unidad y puede ser menor que cero. Por otro lado, lo comparamos con algunos valores umbral para tomar decisiones sobre como cambia la calidad.

Como se suele decir, te lo dejo como ejercicio,

## Conclusiones

Al refactorizar un código procedural a un código orientado a objetos tenemos varias ganancias:

* Las responsabilidades se reparten en unidades pequeñas altamente cohesivas
* Estas unidades tiene poca lógica y son fáciles de testear
* Cada una encapsula las reglas que se le aplican, liberando a las demás de tener ese conocimiento controlado
* Nos permite extender el sistema fácilmente, añadiendo código y modificando configuración

Me han quedado algunas ideas en el tintero, por lo que no descarto actualizar el artículo en el futuro.

En conjunto esta serie nos proporciona una guía para abordar la modernización de software o tratar casos de código complejo y difícil de mantener y sobre el que necesites trabajar.
