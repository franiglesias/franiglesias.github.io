---
layout: post
title: Object Calisthenics para adelgazar las clases
categories: articles
tags: good-practices refactoring
---

En este artículo presentamos un ejercicio que puede servir para adquirir soltura a la hora de escribir clases más compactas con métodos más expresivos y sencillos de entender.

Los ejercicios de [Object Calisthenics](https://williamdurand.fr/2013/06/03/object-calisthenics/) nos pueden ayudar a automatizar prácticas que nos permiten acercarnos a los mejores principios de diseño. En cierto modo consiste en aprender a detectar ciertos patrones erróneos en el código y transformar este de modo que avanzamos en el objetivo de mejorar la calidad del código.

La idea de estos ejercicios es imponer unas restricciones artificiales para forzar respuestas que nos obliguen a pensar más allá de las soluciones convencionales.

En este artículo vamos a aplicar estas restricciones:

* Un solo nivel de indentación
* No usar `else`
* Mantener las unidades pequeñas

## Las restricciones

### Un solo nivel de indentación

La indentación es un modelo de organización de código que nos ayuda a identificar fácilmente bloques de instrucciones que formas ramas o caminos en el flujo del software, así como bloques de instrucciones relacionadas. En lenguajes como Python la indentación tiene un significado y, por tanto, es insoslayable. Sin embargo en PHP y muchísimos otros lenguajes, la indentación es una convención útil. Podríamos escribir programas sin indentación y funcionarían igual, solo que serían más difíciles de leer.

La indentación es típica de las estructuras de control, como `if/then`:

```php
if ($length <= 1) {
    return $source;
}
```

`for`:

```php
for ($i = 0; $i < 3; $i++) {
    $point = array_splice($source, rand(0, count($source) - 1), 1);
    $points[] = array_shift($point);
}
```

Y puede tener varios niveles:

```php
$length = count($source);
for ($i = 0; $i < $length; $i++) {
    for ($j = 0; $j < $length; $j++) {
        if ($source[$i] < $source[$j]) {
            $this->swap($source[$i], $source[$j]);
        }
    }
}
```

El reto, en esta ocasión, será reducir a **uno** los niveles de indentación en cada método de una clase.

En esencia, esto nos obliga a considerar lo que hace cada bloque de código y extraerlo a su propio método explicando lo que hace en su nombre.

### No usar `else`

La estructura `if/then/else` puede resultar confusa por varios motivos. Uno de ellos es precisamente el uso innecesario de `else`, particularmente cuando la pata `then` implica una salida del bucle o del método principal.

```php
if (!$current->getRight()) {
    $current->setRight($new);
} else {
    $this->insertNew($current->getRight(), $new);
}
```

He introducido esta restricción porque está bastante relacionada con la anterior.

### Mantener las unidades pequeñas

En el artículo citado al principio se habla de entidades, pero pensándolo mejor, he preferido poner unidades a fin de referirme tanto a clases como a métodos. En último término se trata de que cada unidad, sea cual sea la resolución que estemos manejando, sea lo más pequeña y manejable posible.

Este lleva a una cierta contradicción. Por ejemplo, una clase puede ocupar menos líneas con un único método grande que si dividimos este en varios más pequeños basándonos en principios como reducir los niveles de indentación. Obviamente se trata de decisiones que conllevan compromisos. El equilibrio está en mantener la legibilidad e inteligibilidad de la clase y sus métodos.

## Ejercicios

Hace algún tiempo estuve practicando escribir algoritmos y estructuras de datos clásicos mediante TDD, y aunque se trata de clases relativamente pequeñas, tienen algunas estructuras que podrían mejorarse aplicando las restricciones propuestas, así que vamos a ver algunos ejemplos y cómo los podemos hacer evolucionar.

Como nota de interés decir que voy a hacer la mayor parte de los refactors con las herramientas que proporciona el IDE (PHPStorm).

Empecemos con `BubbleSort`, el algoritmo de ordenación más sencillo e intuitivo, aunque poco eficiente para muchos elementos:

```php
<?php

namespace Dsa\Algorithms\Sorting;

class BubbleSort
{
    public function sort(array $source): array
    {
        $length = count($source);
        for ($i = 0; $i < $length; $i++) {
            for ($j = 0; $j < $length; $j++) {
                if ($source[$i] < $source[$j]) {
                    $tmp = $source[$i];
                    $source[$i] = $source[$j];
                    $source[$j] = $tmp;
                }
            }
        }

        return $source;
    }
}
```

El test es este, por cierto, y está realizado con `PHPSpec`:

```php
<?php

namespace spec\Dsa\Algorithms\Sorting;

use Dsa\Algorithms\Sorting\BubbleSort;
use PHPSpec\ObjectBehavior;


class BubbleSortSpec extends ObjectBehavior
{
    function it_is_initializable()
    {
        $this->shouldHaveType(BubbleSort::class);
    }

    public function it_sorts_an_array_of_integers()
    {
        $source = [1123, 45, 76, 23, 87, 234, 34, 12, 36];
        $this->sort($source)->shouldBe([12, 23, 34, 36, 45, 76, 87, 234, 1123]);
    }
}
```

En este caso tenemos **tres niveles de indentación** y la restricción es que cada método solo puede tener uno como máximo. Para ello, extraeremos el `for` anidado a su propio método con ayuda del IDE, asegurándonos de que los tests siguen pasando:

```php
<?php

namespace Dsa\Algorithms\Sorting;

class BubbleSort
{
    public function sort(array $source): array
    {
        $length = count($source);
        for ($i = 0; $i < $length; $i++) {
            $source = $this->compareEveryElementWithCurrent($source, $length, $i);
        }

        return $source;
    }

    private function compareEveryElementWithCurrent(array $source, int $length, int $i): array
    {
        for ($j = 0; $j < $length; $j++) {
            if ($source[$i] < $source[$j]) {
                $tmp = $source[$i];
                $source[$i] = $source[$j];
                $source[$j] = $tmp;
            }
        }

        return $source;
    }
}
```

El test pasa, así que no hemos roto nada. Podemos ver algunos detalles mejorables en esta extracción:

* El parámetro `$length` es innecesario, ya que lo podemos obtener fácilmente de `$source`, así que lo omitiremos.
* Podríamos haber utilizado una estructura `foreach` en lugar de `for`.
* Cabe la posibilidad de pasar el elemento del array en vez de su índice.

Este es un punto interesante: el hecho de realizar la extracción del método nos provoca unas cuantas reflexiones sobre nuestras decisiones anteriores y posibles mejoras en el código. Así que antes de proseguir vamos a aplicar algunas.

```php
<?php

namespace Dsa\Algorithms\Sorting;

class BubbleSort
{
    public function sort(array $source): array
    {
        foreach ($source as $i => $element) {
            $source = $this->compareEveryElementWithCurrent($source, $i);
        }

        return $source;
    }

    private function compareEveryElementWithCurrent(array $source, int $i): array
    {
        $length = count($source);
        for ($j = 0; $j < $length; $j++) {
            if ($source[$i] < $source[$j]) {
                $tmp = $source[$i];
                $source[$i] = $source[$j];
                $source[$j] = $tmp;
            }
        }

        return $source;
    }
}
```

De momento, pasar el elemento y no el índice no parece viable, pero hemos conseguido algunas mejoras, ya que ahora no necesitamos calcular explícitamente la longitud de `$source`, lo que significa una línea menos y somos más explícitos en representar la idea de que recorremos el array. Seguimos manteniendo un único nivel de indentación que, además, solo tiene una línea.

Ahora tenemos **dos niveles de indentación** dentro del método `compareEveryElementWithCurrent`, así que vamos a tratarlos de la misma manera: extrayendo a un método.

```php
<?php

namespace Dsa\Algorithms\Sorting;

class BubbleSort
{
    public function sort(array $source): array
    {
        foreach ($source as $i => $element) {
            $source = $this->compareEveryElementWithCurrent($source, $i);
        }

        return $source;
    }

    private function compareEveryElementWithCurrent(array $source, int $i): array
    {
        $length = count($source);
        for ($j = 0; $j < $length; $j++) {
            $source = $this->swapElementsIfCurrentIsLower($source, $i, $j);
        }

        return $source;
    }

    private function swapElementsIfCurrentIsLower(array $source, int $i, int $j): array
    {
        if ($source[$i] < $source[$j]) {
            $tmp = $source[$i];
            $source[$i] = $source[$j];
            $source[$j] = $tmp;
        }

        return $source;
    }
}
```

Bien, hay un par de cosas interesantes por aquí:

* Solo tenemos un nivel de indentación en cada método o nivel de abstracción.
* En el nombre del método hacemos una referencia a un *current element*, así que estaría bien expresarla en código cambiando el nombre la variable `$i` a `$currentIndex` o similar, de forma que sea explícita la referencia.
* Podríamos aplicar el mismo tratamiento de convertir el `for` en `foreach` y ahorrarnos la variable `$length`.

Hagamos algunos de estos cambios:

```php
<?php

namespace Dsa\Algorithms\Sorting;

class BubbleSort
{
    public function sort(array $source): array
    {
        foreach ($source as $i => $element) {
            $source = $this->compareEveryElementWithCurrent($source, $i);
        }

        return $source;
    }

    private function compareEveryElementWithCurrent(array $source, int $currentElementIndex): array
    {
        foreach ($source as $j => $element) {
            $source = $this->swapElementsIfCurrentIsLower($source, $currentElementIndex, $j);
        }

        return $source;
    }

    private function swapElementsIfCurrentIsLower(array $source, int $i, int $j): array
    {
        if ($source[$i] < $source[$j]) {
            $tmp = $source[$i];
            $source[$i] = $source[$j];
            $source[$j] = $tmp;
        }

        return $source;
    }
}
```

Con esto hemos *aplanado* los niveles de indentación en todos los métodos. La parte negativa es que la clase ha crecido en número de líneas, pero se ve compensado por el hecho de que cada método explica mejor qué hace y podemos profundizar en la explicación en la medida que necesitemos.

Hay un par de cosas que también merece la pena señalar:

* Vamos pasando el array `$source` de método en método para procesarlo y devolverlo. Nos surge la pregunta de si podría pasarse por referencia, para evitar los retornos y mantener los cambios o incluso guardarlo en la clase como propiedad y operar sobre ella. Respecto a esta última opción diría que no, ya que el algoritmo encapsulado en la clase no tiene por qué tener estado, y guardar el array sería otorgarle uno. Sobre lo de pasar el array por referencia, es una opción que dejaría el código un poco más conciso, pero tal vez tengamos otras maneras de hacerlo así que no lo vamos a aplicar por ahora.
* Por otro lado, en el método `swapElementsIfCurrentIsLower` nos queda un bloque de tres líneas que bien podría merecer ser extraído a su propio método para explicitar su intención.

De paso, extendemos el cambio de nombre de `$i` a todos sus usos para que quede más claro en todo momento:

```php
<?php

namespace Dsa\Algorithms\Sorting;

class BubbleSort
{
    public function sort(array $source): array
    {
        foreach ($source as $currentElementIndex => $element) {
            $source = $this->compareEveryElementWithCurrent($source, $currentElementIndex);
        }

        return $source;
    }

    private function compareEveryElementWithCurrent(array $source, int $currentElementIndex): array
    {
        foreach ($source as $j => $element) {
            $source = $this->swapElementsIfCurrentIsLower($source, $currentElementIndex, $j);
        }

        return $source;
    }

    private function swapElementsIfCurrentIsLower(array $source, int $currentElementIndex, int $j): array
    {
        if ($source[$currentElementIndex] < $source[$j]) {
            $source = $this->swapElements($source, $currentElementIndex, $j);
        }

        return $source;
    }

    private function swapElements(array $source, int $currentElementIndex, int $j): array
    {
        $tmp = $source[$currentElementIndex];
        $source[$currentElementIndex] = $source[$j];
        $source[$j] = $tmp;

        return $source;
    }
}
```

Gracias a este refactor, no tenemos que bajar a las tripas del mecanismo de intercambio para entender qué está pasando con los elementos.

A continuación vamos a intentar hacer algunas mejoras que nos ayuden a limpiar un poco el código y reducir el número de líneas y lo vamos a hacer aprovechando que cada paso del algoritmo está representado en su propio método.

Nos centraremos en `swapElements` y aplicaremos un tratamiento un poco radical, prescindiendo de pasar `$source` y de la variable temporal. Pasaremos los elementos a intercambiar por referencia al método y los reasignaremos mediante una pizca de la poca [syntactic sugar](https://en.wikipedia.org/wiki/Syntactic_sugar) que ofrece PHP:

```php
<?php

namespace Dsa\Algorithms\Sorting;

class BubbleSort
{
    public function sort(array $source): array
    {
        foreach ($source as $currentElementIndex => $element) {
            $source = $this->compareEveryElementWithCurrent($source, $currentElementIndex);
        }

        return $source;
    }

    private function compareEveryElementWithCurrent(array $source, int $currentElementIndex): array
    {
        foreach ($source as $j => $element) {
            $source = $this->swapElementsIfCurrentIsLower($source, $currentElementIndex, $j);
        }

        return $source;
    }

    private function swapElementsIfCurrentIsLower(array $source, int $currentElementIndex, int $j): array
    {
        if ($source[$currentElementIndex] < $source[$j]) {
            $this->swapElements($source[$currentElementIndex], $source[$j]);
        }

        return $source;
    }

    private function swapElements(int &$currentElement, int &$swapWith): void
    {
        [$swapWith, $currentElement] = [$currentElement, $swapWith];
    }
}
```

Se puede decir ahora que cada método tiene el mínimo de niveles de indentación posibles, así como el mínimo de líneas posible.

Es ahora cuando pasaremos `$source` por referencia, ahorrándonos varios `return`, excepto en el método público principal.

```php
<?php

namespace Dsa\Algorithms\Sorting;

class BubbleSort
{
    public function sort(array $source): array
    {
        foreach ($source as $currentElementIndex => $element) {
            $this->compareEveryElementWithCurrent($source, $currentElementIndex);
        }

        return $source;
    }

    private function compareEveryElementWithCurrent(array &$source, int $currentElementIndex): void
    {
        foreach ($source as $j => $element) {
            $this->swapElementsIfCurrentIsLower($source, $currentElementIndex, $j);
        }
    }

    private function swapElementsIfCurrentIsLower(array &$source, int $currentElementIndex, int $j): void
    {
        if ($source[$currentElementIndex] < $source[$j]) {
            $this->swapElements($source[$currentElementIndex], $source[$j]);
        }
    }

    private function swapElements(int &$currentElement, int &$swapWith): void
    {
        [$swapWith, $currentElement] = [$currentElement, $swapWith];
    }
}
```

## Eliminando else

En esta ocasión vamos a revisar un Binary Search Tree, que está a medio arreglar. Es decir: hay algunos primeros intentos de poner el código en mejor estado, pero aún había quedado mucho margen de mejora.

Como podemos ver, hay algunas zonas con dos niveles de indentación y bastantes usos de `else`.

```php
<?php

namespace Dsa\Structures;

class BinarySearchTree
{
    /**
     * @var BinarySearchNode
     */
    private $root;

    public function insert($value)
    {
        $new = new BinarySearchNode($value);
        if (! $this->root) {
            $this->root = $new;
        } else {
            $this->insertNew($this->root, $new);
        }
    }

    public function insertNew(BinarySearchNode $current, BinarySearchNode $new)
    {
        if ($new->getValue() < $current->getValue()) {
            if (! $current->getLeft()) {
                $current->setLeft($new);
            } else {
                $this->insertNew($current->getLeft(), $new);
            }
        } else {
            if (! $current->getRight()) {
                $current->setRight($new);
            } else {
                $this->insertNew($current->getRight(), $new);
            }
        }
    }

    public function isInTree($value)
    {
        if (! $this->root) {
            return false;
        }

        return $this->contains($this->root, $value);
    }

    public function contains(BinarySearchNode $current = null, $value)
    {
        if (! $current) {
            return false;
        }

        return $this->findNode($current, $value) ? true : false;
    }

    public function getParentValueOf($value)
    {
        if ($value == $this->root->getValue()) {
            return null;
        }

        return $this->findParent($this->root, $value)->getValue();
    }

    private function findParent(BinarySearchNode $current, $value)
    {
        if ($value < $current->getValue()) {
            if (! $current->getLeft()) {
                return null;
            } elseif ($current->getLeft()->getValue() == $value) {
                return $current;
            } else {
                return $this->findParent($current->getLeft(), $value);
            }
        } else {
            if (! $current->getRight()) {
                return null;
            } elseif ($current->getRight()->getValue() == $value) {
                return $current;
            } else {
                return $this->findParent($current->getRight(), $value);
            }
        }
    }

    private function findNode(BinarySearchNode $current = null, $value)
    {
        if (! $current) {
            return false;
        }

        if ($current->getValue() == $value) {
            return $current;
        } elseif ($value < $current->getValue()) {
            return $this->findNode($current->getLeft(), $value);
        } else {
            return $this->findNode($current->getRight(), $value);
        }
    }
}

```

El test que nos va a proteger en este proceso es el siguiente:

```php
<?php

namespace spec\Dsa\Structures;

use Dsa\Structures\BinarySearchTree;
use PHPSpec\ObjectBehavior;

class BinarySearchTreeSpec extends ObjectBehavior
{
    function it_is_initializable()
    {
        $this->shouldHaveType(BinarySearchTree::class);
    }

    public function it_knows_that_value_is_not_in_empty_tree()
    {
        $this->shouldNotBeInTree(34);
    }

    public function it_knows_that_value_is_in_tree_if_it_is_the_unique()
    {
        $this->insert(15);
        $this->shouldBeInTree(15);
    }

    public function it_knows_that_other_values_are_not_in_tree()
    {
        $this->insert(15);
        $this->shouldNotBeInTree(76);
    }

    public function it_knows_what_values_are_in_the_tree()
    {
        $this->prepareAnExampleTree();

        $this->shouldBeInTree(34);
        $this->shouldBeInTree(12);
        $this->shouldBeInTree(76);
    }

    public function it_knows_what_values_are_not_in_the_tree()
    {
        $this->prepareAnExampleTree();

        $this->shouldNotBeInTree(65);
        $this->shouldNotBeInTree(2);
        $this->shouldNotBeInTree(123);
    }

    public function it_knows_that_the_parent_of_the_root_is_null()
    {
        $this->prepareAnExampleTree();

        $this->getParentValueOf(15)->shouldBeNull();
    }

    public function it_can_find_the_parent_of_a_node()
    {
        $this->prepareAnExampleTree();

        $this->getParentValueOf(12)->shouldBe(7);
        $this->getParentValueOf(76)->shouldBe(68);
        $this->getParentValueOf(7)->shouldBe(15);
    }

    protected function prepareAnExampleTree(): void
    {
        $this->insert(15);
        $this->insert(34);
        $this->insert(7);
        $this->insert(68);
        $this->insert(12);
        $this->insert(4);
        $this->insert(76);
    }
}
```

La estructura Binary Search Tree se caracteriza porque cada nodo tiene dos hijos. Cuando se inserta un nodo se compara con el nodo raíz. Si no existe, porque todavía no se habían añadido elementos al árbol, se hace que el nuevo nodo sea la raíz. Si existe el nodo raíz, se inserta el nuevo nodo bajo él usando el método `insertNew`. Esto es lo que hace el método `insert`, que es con el que añadimos elementos al árbol.

Vamos allá. Empezamos con el método `insert`, que contiene un `else`:

```php
public function insert($value)
{
    $new = new BinarySearchNode($value);
    if (! $this->root) {
        $this->root = $new;
    } else {
        $this->insertNew($this->root, $new);
    }
}
```

En este caso, nos basta con regresar en la rama del `if`:

```php
public function insert($value): void
{
    $new = new BinarySearchNode($value);
    
    if (! $this->root) {
        $this->root = $new;
        return;
    }

    $this->insertNew($this->root, $new);
}
```

Alternativamente, podríamos haber invertido la condicional para que fuese positiva, que es más fácil de leer:

```php
public function insert($value): void
{
    $new = new BinarySearchNode($value);
    if ($this->root) {
        $this->insertNew($this->root, $new);
        return;
    }

    $this->root = $new;
}
```

El método `insertNew` añade nodos bajo un nodo determinado. En un árbol binario como este, cada nodo puede tener dos hijos (y así recursivamente), de tal modo que el nodo hijo de la izquierda contiene valores menores que el nodo padre, y el otro nodo contiene valores mayores. Si alguno de los nodos hijos ya existe, se le intenta añadir el nuevo nodo de forma recursiva, hasta que se encuentra una "rama" libre en la que colocarlo.

Hablando de `insertNew`, alcanza los dos niveles de indentación y tiene dos `else`, ¿qué podemos hacer al respecto?

```php
public function insertNew(BinarySearchNode $current, BinarySearchNode $new)
{
    if ($new->getValue() < $current->getValue()) {
        if (! $current->getLeft()) {
            $current->setLeft($new);
        } else {
            $this->insertNew($current->getLeft(), $new);
        }
    } else {
        if (! $current->getRight()) {
            $current->setRight($new);
        } else {
            $this->insertNew($current->getRight(), $new);
        }
    }
}
```

Ante de nada, voy a invertir las condicionales negativas:

```php
public function insertNew(BinarySearchNode $current, BinarySearchNode $new): void
{
    if ($new->getValue() < $current->getValue()) {
        if ($current->getLeft()) {
            $this->insertNew($current->getLeft(), $new);
        } else {
            $current->setLeft($new);
        }
    } else {
        if ($current->getRight()) {
            $this->insertNew($current->getRight(), $new);
        } else {
            $current->setRight($new);
        }
    }
}
```

Lo primero que podemos observar es que todas las patas de los condicionales no llevan a la salida y no hay procesamiento antes ni después. Dicho de otro modo, en cada pata podemos poner un `return`. Esto nos facilitará eliminar los `else` porque los hace innecesarios.

```php
public function insertNew(BinarySearchNode $current, BinarySearchNode $new): void
{
    if ($new->getValue() < $current->getValue()) {
        if ($current->getLeft()) {
            $this->insertNew($current->getLeft(), $new);
            return;
        }

        $current->setLeft($new);

        return;
    }

    if ($current->getRight()) {
        $this->insertNew($current->getRight(), $new);
        return;
    }

    $current->setRight($new);
}
```

El test demuestra que este cambio no afecta a la funcionalidad, hemos eliminado los `else` y uno de los casos de dos niveles de indentación.

Para poder aplanar el método necesitamos extraer los dos caminos de ejecución principales a sus propios métodos, haciendo explícita su intención:

```php
public function insertNew(BinarySearchNode $current, BinarySearchNode $new): void
{
    if ($new->getValue() < $current->getValue()) {
        $this->insertNewNodeAsLeftChild($current, $new);
    }

    $this->insertNodeAsRightChild($current, $new);
}
    
private function insertNewNodeAsLeftChild(BinarySearchNode $current, BinarySearchNode $new): void
{
    if ($current->getLeft()) {
        $this->insertNew($current->getLeft(), $new);

        return;
    }

    $current->setLeft($new);
}

private function insertNodeAsRightChild(BinarySearchNode $current, BinarySearchNode $new): void
{
    if ($current->getRight()) {
        $this->insertNew($current->getRight(), $new);

        return;
    }

    $current->setRight($new);
}
```

Las dos vías de ejecución de `insertNew` son ahora explícitas y su código es prácticamente el mismo. Esto es interesante porque pone de relieve una de las interpretaciones erróneas del principio `Don't Repeat Yourself`. El principio DRY se refiere a conocimiento, no a código, aunque a veces sean coincidentes. En este caso tenemos la misma estructura, pero significa cosas diferentes: cómo tratar un valor mayor y cómo tratar un valor menor.

El método `findParent` tiene varios problemas, dos niveles de indentación, condicionales anidadas y cinco `else`, aparte de algunos defectos que podemos arreglar de paso.

```php
private function findParent(BinarySearchNode $current, $value)
{
    if ($value < $current->getValue()) {
        if (! $current->getLeft()) {
            return null;
        } elseif ($current->getLeft()->getValue() == $value) {
            return $current;
        } else {
            return $this->findParent($current->getLeft(), $value);
        }
    } else {
        if (! $current->getRight()) {
            return null;
        } elseif ($current->getRight()->getValue() == $value) {
            return $current;
        } else {
            return $this->findParent($current->getRight(), $value);
        }
    }
}
```

Primero, una limpieza general. Cuando tenemos varios return deberíamos indicar el *return type*, a fin de garantizar que todos ellos son consistentes. En este caso el método puede devolver un `BinarySearchNode` o `null` si no se ha encontrado.


```php
private function findParent(BinarySearchNode $current, $value): ?BinarySearchNode
{
    if ($value < $current->getValue()) {
        if (! $current->getLeft()) {
            return null;
        } elseif ($current->getLeft()->getValue() === $value) {
            return $current;
        } else {
            return $this->findParent($current->getLeft(), $value);
        }
    } else {
        if (! $current->getRight()) {
            return null;
        } elseif ($current->getRight()->getValue() === $value) {
            return $current;
        } else {
            return $this->findParent($current->getRight(), $value);
        }
    }
}
```

Tenemos condicionales negativas. En este caso es un poco más delicado invertirlas al tener tres ramas y podría cambiar el comportamiento. Pero como tenemos tests, vamos a ver qué pasa si lo hacemos:

```php
private function findParent(BinarySearchNode $current, $value): ?BinarySearchNode
{
    if ($value < $current->getValue()) {
        if ($current->getLeft()) {
            if ($current->getLeft()->getValue() === $value) {
                return $current;
            } else {
                return $this->findParent($current->getLeft(), $value);
            }
        } else {
            return null;
        }
    } else {
        if ($current->getRight()) {
            if ($current->getRight()->getValue() === $value) {
                return $current;
            } else {
                return $this->findParent($current->getRight(), $value);
            }
        } else {
            return null;
        }
    }
}
```

La cosa empeora por un lado porque han aumentado los niveles de indentación, pero por otro lado ha mejorado porque algunos de los `else` se han vuelto completamente prescindibles, así que los quitamos sin más.

```php
private function findParent(BinarySearchNode $current, $value): ?BinarySearchNode
{
    if ($value < $current->getValue()) {
        if ($current->getLeft()) {
            if ($current->getLeft()->getValue() === $value) {
                return $current;
            } else {
                return $this->findParent($current->getLeft(), $value);
            }
        }
    } else {
        if ($current->getRight()) {
            if ($current->getRight()->getValue() === $value) {
                return $current;
            } else {
                return $this->findParent($current->getRight(), $value);
            }
        }
    }
}
```

Como todas las ramas tienen su `return` creo que será una buena idea quitar los 3 `else` que quedan:

```php
private function findParent(BinarySearchNode $current, $value): ?BinarySearchNode
{
    if ($value < $current->getValue()) {
        if ($current->getLeft()) {
            if ($current->getLeft()->getValue() === $value) {
                return $current;
            }

            return $this->findParent($current->getLeft(), $value);
        }
    }
    if ($current->getRight()) {
        if ($current->getRight()->getValue() === $value) {
            return $current;
        }

        return $this->findParent($current->getRight(), $value);
    }
}
```


Los tests siguen pasando y el método está un poquito más aplanado. En este momento, parece buena idea deshacer parte de lo avanzado antes, ya que si invierto algunas condicionales puedo reducir niveles de indentación sin extraer métodos:

```php
private function findParent(BinarySearchNode $current, $value): ?BinarySearchNode
{
    if ($value < $current->getValue()) {
        if (! $current->getLeft()) {
            return null;
        }

        if ($current->getLeft()->getValue() === $value) {
            return $current;
        }

        return $this->findParent($current->getLeft(), $value);
    }
    
    if (! $current->getRight()) {
        return null;
    }

    if ($current->getRight()->getValue() === $value) {
        return $current;
    }

    return $this->findParent($current->getRight(), $value);
}
```

Es posible que hubiésemos llegado al mismo punto de no haber invertido las condicionales al enfrentar por primera vez el método. Es lo de menos, lo importante es movernos de manera segura por el código.

Al hacer este cambio queda de manifiesto que el método tiene dos posibles flujos, así que podemos hacerlo explícito moviendo cada bloque a su propio método:

```php
private function findParent(BinarySearchNode $current, $value): ?BinarySearchNode
{
    if ($value < $current->getValue()) {
        return $this->findParentThroughLeftBranch($current, $value);
    }

    return $this->findParentThroughRightBranch($current, $value);
}
    
private function findParentThroughLeftBranch(BinarySearchNode $current, $value): ?BinarySearchNode
{
    if (! $current->getLeft()) {
        return null;
    }

    if ($current->getLeft()->getValue() === $value) {
        return $current;
    }

    return $this->findParent($current->getLeft(), $value);
}

private function findParentThroughRightBranch(BinarySearchNode $current, $value): ?BinarySearchNode
{
    if (! $current->getRight()) {
        return null;
    }

    if ($current->getRight()->getValue() === $value) {
        return $current;
    }

    return $this->findParent($current->getRight(), $value);
}
```

El nuevo `findParent` es ahora mucho más fácil de entender y también lo son sus ramas. Incluso las condicionales negativas actúan ahora como cláusulas de guarda lo que hace que resulte mucho más evidente su función (no hacer nada si no hay nada con lo que trabajar). Ambas ramas extraídas básicamente nos dicen que si el valor buscado coincide con el del hijo, izquierdo o derecho respectivamente, del nodo es que es su nodo padre. Y que si no coincide, siga buscando.

El último método que podemos planchar es `findNode`, que aquí muestro ya con los arreglos necesarios para ponerlo al día. Eliminar los `else` debería ser fácil:

```php
private function findNode(?BinarySearchNode $current, $value): ?BinarySearchNode
{
    if (! $current) {
        return null;
    }

    if ($current->getValue() === $value) {
        return $current;
    } elseif ($value < $current->getValue()) {
        return $this->findNode($current->getLeft(), $value);
    } else {
        return $this->findNode($current->getRight(), $value);
    }
}
```

El método busca el nodo que corresponde a un valor. Si el actual coincide lo devuelve y, si no, busca por el lado izquierdo si es menor y por el derecho si es mayor. El método *aplanado* queda así:

```php
private function findNode(?BinarySearchNode $current, $value): ?BinarySearchNode
{
    if (! $current) {
        return null;
    }

    if ($current->getValue() === $value) {
        return $current;
    }

    if ($value < $current->getValue()) {
        return $this->findNode($current->getLeft(), $value);
    }

    return $this->findNode($current->getRight(), $value);
}
```

Nuestro `BinarySearchTree` es bastante menos intimidante ahora:

```php
<?php

namespace Dsa\Structures;

class BinarySearchTree
{
    /**
     * @var BinarySearchNode
     */
    private $root;

    public function insert($value): void
    {
        $new = new BinarySearchNode($value);
        if ($this->root) {
            $this->insertNew($this->root, $new);

            return;
        }

        $this->root = $new;
    }

    public function insertNew(BinarySearchNode $current, BinarySearchNode $new): void
    {
        if ($new->getValue() < $current->getValue()) {
            $this->insertNewNodeAsLeftChild($current, $new);
        }

        $this->insertNodeAsRightChild($current, $new);
    }

    public function isInTree($value): bool
    {
        if (! $this->root) {
            return false;
        }

        return $this->contains($this->root, $value);
    }

    public function contains(?BinarySearchNode $current, $value): bool
    {
        if (! $current) {
            return false;
        }

        return $this->findNode($current, $value) ? true : false;
    }

    public function getParentValueOf($value)
    {
        if ($value === $this->root->getValue()) {
            return null;
        }

        return $this->findParent($this->root, $value)->getValue();
    }

    private function findParent(BinarySearchNode $current, $value): ?BinarySearchNode
    {
        if ($value < $current->getValue()) {
            return $this->findParentThroughLeftBranch($current, $value);
        }

        return $this->findParentThroughRightBranch($current, $value);
    }

    private function findNode(?BinarySearchNode $current, $value): ?BinarySearchNode
    {
        if (! $current) {
            return null;
        }

        if ($current->getValue() === $value) {
            return $current;
        }

        if ($value < $current->getValue()) {
            return $this->findNode($current->getLeft(), $value);
        }

        return $this->findNode($current->getRight(), $value);
    }

    private function insertNewNodeAsLeftChild(BinarySearchNode $current, BinarySearchNode $new): void
    {
        if ($current->getLeft()) {
            $this->insertNew($current->getLeft(), $new);

            return;
        }

        $current->setLeft($new);
    }

    private function insertNodeAsRightChild(BinarySearchNode $current, BinarySearchNode $new): void
    {
        if ($current->getRight()) {
            $this->insertNew($current->getRight(), $new);

            return;
        }

        $current->setRight($new);
    }

    private function findParentThroughLeftBranch(BinarySearchNode $current, $value): ?BinarySearchNode
    {
        if (! $current->getLeft()) {
            return null;
        }

        if ($current->getLeft()->getValue() === $value) {
            return $current;
        }

        return $this->findParent($current->getLeft(), $value);
    }

    private function findParentThroughRightBranch(BinarySearchNode $current, $value): ?BinarySearchNode
    {
        if (! $current->getRight()) {
            return null;
        }

        if ($current->getRight()->getValue() === $value) {
            return $current;
        }

        return $this->findParent($current->getRight(), $value);
    }
}
```
