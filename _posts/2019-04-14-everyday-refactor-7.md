---
layout: post
title: Refactor cotidiano (7). Refactoriza de single return a return early
categories: articles
tags: good-practices refactoring
---

En el blog ya hemos hablado del patrón clásico [Single Exit Point](/lidiando-con-el-patron-single-exit-point/) y cómo acabó derivando en *single return*. También algún momento de esta guía de refactor hemos hablado también del *return early*. Ahora vamos a retomarlos conjuntamente porque seguramente nos los encontraremos más de una vez.

Lo primero será saber de qué estamos hablando:

## Single return

Se trata de que en cada método o función sólo tengamos un único `return`, a pesar de que el código pueda tener diversos caminos que nos permitirían finalizar en otros momentos.

Obviamente, si el método sólo tiene un camino posible tendrá un sólo `return`.

```php
public function isValid(string $luhnCode) : bool
{
    $inverted = strrev($luhnCode);

    $oddAdded = $this->addOddDigits($inverted);
    $evenAdded = $this->addEvenDigits($inverted);

    return ($oddAdded + $evenAdded) % 10 === 0;
}
```

Si el método tiene dos caminos, caben dos posibilidades:

* Uno de los flujos se separa del principal, hace alguna cosa y vuelve de forma natural al tronco para terminar lo que tenga que hacer.

```php
public function forProduct(Client $client, Product $product)
{
    $contract = new Contract($product);
    
    if ($client->hasBenefits()) {
        $contract->addBenefits($client->benefits());
    }
    
    $this->mailer->send($client, $contract);
}
```

* Uno de los flujos se separa para resolver la tarea de una manera alternativa, por lo que podría devolver el resultado una vez obtenido. Sin embargo, si se sigue el patrón *single return*, hay que forzar que el flujo vuelva al principal antes de retornar.


```php
private function reduceToOneDigit($double) : int
{
    if ($double >= 10) {
        $double = intdiv($double, 10) + $double % 10;
    }

    return $double;
}
```


Si el método tiene más de dos caminos se dará una combinación de las posibilidades anteriores, es decir, algunas ramas volverán de forma natural al flujo principal y otras podrían retornar por su cuenta.

En principio, la ventaja del *single Return* es poder controlar con facilidad que se devuelve el tipo de respuesta correcta, algo que sería más difícil si tenemos muchos lugares con `return` . Pero la verdad es que explicitando *return types* es algo de lo que ni siquiera tendríamos que preocuparnos.

En cambio, el mayor problema que tiene Single Return es que fuerza la anidación de condicionales y el uso de `else` hasta extremos exagerados, lo que provoca que el código sea especialmente difícil de leer. Lo peor es que eso no se justifica por necesidades del algoritmo, sino por la gestión del flujo para conseguir que sólo se pueda retornar en un punto.

El origen de esta práctica parece que podría ser una mala interpretación del patrón *Single Exit Point* de Djkstra, un patrón que era útil en lenguajes que permitían que las llamadas a subrutinas y sus retornos pudieran hacerse a líneas arbitrarias. Su objetivo era asegurar que se entrase a una subrutina en su primera línea y se volviese siempre a la línea siguiente a la llamada.

## Early return

El patrón *early return* consiste en salir de una función o método en cuanto sea posible, bien porque se ha detectado un problema (*fail fast*), bien porque se detecta un caso especial que se maneja fuera del algoritmo general o por otro motivo.

Dentro de este patrón encajan cosas como las cláusulas de guarda, que validan los parámetros recibidos y lanzan una excepción si no son correctos.

También se encuentran aquellos casos particulares que necesitan un tratamiento especial, pero que es breve o inmediato.

De este modo, al final nos queda el algoritmo principal.

El principal inconveniente es la posible inconsistencia que pueda darse en los diferentes returns en cuanto al tipo o formato de los datos, algo que se puede controlar fácilmente forzando un *return type*.

Por otra parte, ganamos en legibilidad ya que mantenemos bajo control el anidamiento de condicionales y los niveles de indentación.

Además, al tratar primero los casos especiales podemos centrar la atención en el algoritmo principal de ese método.


## Ejemplo básico

Hace un par de años comencé a practicar un ejercicio para estudiar algoritmos y estructuras de datos, reproduciéndolos en PHP usando metodología TDD. El código visto ahora está un poco pobre, pero me viene bien porque he encontrado varios ejemplos de *single return* y otros puntos de mejora.

En primer lugar, vamos a ver un caso en el que podemos refactorizar un *single return* muy evidente, pero también uno que no lo es tanto:

```php
<?php

namespace Dsa\Algorithms\Sorting;

class QuickSort
{
    public function sort(array $source)
    {
        $length = count($source);
        if ($length > 1) {
            $pivot = $this->median($source);
            $equal = $less = $greater = [];
            for ($i = 0; $i < $length; $i++) {
                if ($source[$i] == $pivot) {
                    $equal[] = $source[$i];
                } elseif ($source[$i] < $pivot) {
                    $less[] = $source[$i];
                } else {
                    $greater[] = $source[$i];
                }
            }
            $sorted = array_merge($this->sort($less), $equal, $this->sort($greater));
        } else {
            $sorted = $source;
        }

        return $sorted;
    }

    private function median($source)
    {
        $points = [];
        for ($i = 0; $i < 3; $i++) {
            $point = array_splice($source, rand(0, count($source) - 1), 1);
            $points[] = array_shift($point);
        }

        return array_sum($points) - max($points) - min($points);
    }
}

```

El primer paso es invertir la condicional, para ver la rama más corta en primer lugar:

```php
public function sort(array $source)
{
    $length = count($source);
    if ($length <= 1) {
        $sorted = $source;
    } else {
        $pivot = $this->median($source);
        $equal = $less = $greater = [];
        for ($i = 0; $i < $length; $i++) {
            if ($source[$i] == $pivot) {
                $equal[] = $source[$i];
            } elseif ($source[$i] < $pivot) {
                $less[] = $source[$i];
            } else {
                $greater[] = $source[$i];
            }
        }
        $sorted = array_merge($this->sort($less), $equal, $this->sort($greater));
    }

    return $sorted;
}
```

Al invertir las ramas es fácil ver que en caso de que `$length` sea menor o igual que uno podemos retornar sin problema. De hecho, no tiene mucho sentido intentar ordenar una lista de un sólo elemento.

Al hacer esto, también podemos eliminar el uso de la variable temporal `$sorted` que es innecesaria.

```php
public function sort(array $source)
{
    $length = count($source);
    if ($length <= 1) {
        return $source;
    }

    $pivot = $this->median($source);
    $equal = $less = $greater = [];
    for ($i = 0; $i < $length; $i++) {
        if ($source[$i] == $pivot) {
            $equal[] = $source[$i];
        } elseif ($source[$i] < $pivot) {
            $less[] = $source[$i];
        } else {
            $greater[] = $source[$i];
        }
    }
    
    return array_merge($this->sort($less), $equal, $this->sort($greater));
}

```

Con este arreglo el código ya mejora mucho su legibilidad gracias a que despejamos el terreno tratando el caso especial y dejando el algoritmo principal limpio.

Pero vamos a ir un paso más allá. El bucle `for` contiene una forma velada de *single return* en forma de estructura `if...else` que voy a intentar explicar.

El algoritmo **quicksort** se basa en hacer pivotar los elementos de la lista en relación a su mediana, es decir, al valor que estaría exactamente en la posición central de la lista ordenada. Para ello, se calcula la mediana de forma aproximada y se van comparando los números para colocarlos en la mitad que les toca: bien por debajo o bien por encima de la mediana.

Para eso se compara cada número con el valor mediano para ver sucesivamente si es igual, menor o mayor, con lo que se añade a la sub-lista correspondiente y se van ordenando esas sub-listas de forma recursiva.

En este caso las cláusulas `else` tienden a hacer más difícil la lectura y, aunque la semántica es correcta, podemos hacerlo un poco más claro.

Como ya sabrás, podemos forzar la salida de un bucle con `continue`:

```php
public function sort(array $source)
{
    $length = count($source);
    if ($length <= 1) {
        return $source;
    }

    $pivot = $this->median($source);
    $equal = $less = $greater = [];
    for ($i = 0; $i < $length; $i++) {
        if ($source[$i] == $pivot) {
            $equal[] = $source[$i];
            continue;
        }

        if ($source[$i] < $pivot) {
            $less[] = $source[$i];
            continue;
        }

        $greater[] = $source[$i];
    }

    return array_merge($this->sort($less), $equal, $this->sort($greater));
}
```

Y, aunque en este caso concreto no es especialmente necesario, esta disposición hace que la lectura del bucle sea más cómoda. Incluso es más fácil reordenarlo y que exprese mejor lo que hace:


```php
public function sort(array $source): array
{
    $length = count($source);
    if ($length <= 1) {
        return $source;
    }

    $pivot = $this->median($source);
    $equal = $less = $greater = [];
    for ($i = 0; $i < $length; $i++) {
        if ($source[$i] > $pivot) {
            $greater[] = $source[$i];
            continue;
        }

        if ($source[$i] < $pivot) {
            $less[] = $source[$i];
            continue;
        }

        $equal[] = $source[$i];
    }

    return array_merge($this->sort($less), $equal, $this->sort($greater));
}
```

## Otro ejemplo

En este caso es un Binary Search Tree, en el que se nota que no tenía muy claro el concepto de *return early* o, al menos, no lo había aplicado hasta sus últimas consecuencias, por lo que el código no mejora apenas:

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

    public function insertNew(
        BinarySearchNode $current,
        BinarySearchNode $new
    ) {
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

    public function contains(
        BinarySearchNode $current = null,
        $value
    ) {
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

    private function findParent(
        BinarySearchNode $current,
        $value
    ) {
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

    private function findNode(
        BinarySearchNode $current = null,
        $value
    ) {
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


Empecemos mejorando el método `insert`:

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

Que podría quedar así:

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

Al método insertNew le sobra indentación:

```php
public function insertNew(
    BinarySearchNode $current,
    BinarySearchNode $new
) {
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

Empezamos aplicando el *return early* una vez:

```php
public function insertNew(
    BinarySearchNode $current,
    BinarySearchNode $new
) {
    if ($new->getValue() < $current->getValue()) {
        if (! $current->getLeft()) {
            $current->setLeft($new);
            
            return;
        }

        $this->insertNew($current->getLeft(), $new);
    } else {
        if (! $current->getRight()) {
            $current->setRight($new);
            
            return;
        }

        $this->insertNew($current->getRight(), $new);
    }
}
```

Y una segunda vez:

```php
public function insertNew(
    BinarySearchNode $current,
    BinarySearchNode $new
): void {
    if ($new->getValue() < $current->getValue()) {
        if (! $current->getLeft()) {
            $current->setLeft($new);
            
            return;
        }

        $this->insertNew($current->getLeft(), $new);
        return;
    }

    if (! $current->getRight()) {
        $current->setRight($new);
        
        return;
    }

    $this->insertNew($current->getRight(), $new);
}
```

Otro lugar que necesita un arreglo es el método `findParent`. Aquí hemos usado return early, pero no habíamos sabido aprovecharlo:


```php
private function findParent(
    BinarySearchNode $current,
    $value
) {
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

Al hacerlo, nos queda un código más limpio:

```php
private function findParent(
    BinarySearchNode $current,
    $value
) {
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

Todos estos refactors se pueden hacer sin riesgo con las herramientas de *Intentions* (comando + return) de PHPStorm que nos ofrecen la **inversión de if/else** (*flip*), y la **separación de flujos** (*split workflows*) cuando son posibles. En todo caso, estas clases estaban cubiertas por tests y éstos siguen pasando sin ningún problema.

Finalmente, arreglamos `findNode`, que estaba así:


```php
    private function findNode(
        BinarySearchNode $current = null,
        $value
    ) {
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

```

Y quedará así:


```php
private function findNode(
    BinarySearchNode $current = null,
    $value
) {
    if (! $current) {
        return false;
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
