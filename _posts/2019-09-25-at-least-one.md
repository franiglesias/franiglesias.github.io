---
layout: post
title: Al menos uno
categories: articles
tags: tips refactoring
---

Un ejemplo sencillo que refleja el proceso de refinamiento iterativo que es escribir software.

Supongamos que tenemos un array en el que tenemos que comprobar que al menos uno de los elementos cumpla una condición. Un caso que suelo encontrarme es tener que hacer un test para ver si entre los eventos publicados por un cierto proceso se incluye uno en el que estoy interesado.

En principio, la solución es bastante sencilla, pero por alguna razón se me quedó el problema en la cabeza y he pensado en escribir sobre ello porque me sirve para explicar algunas cosas sobre cómo escribir código mediante refactor continuo, posponiendo decisiones e incluso soluciones más elegantes. Y todo esto tiene que ver con aliviar la carga cognitiva que supone programar.

En el fondo, el algoritmo es muy sencillo:

1. Leo el primer elemento de la lista
2. Si cumple la condición, digo que **sí, hay al menos uno** y termino
3. Si no, leo el siguiente elemento y voy a 2.
4. Si no quedan más elementos, digo que **no, no hay ninguno** y termino.

Para ejemplificar distintos métodos, voy a usar el siguiente TestCase como playground:

```php
<?php
declare (strict_types=1);

namespace App\Tests\App;

use PHPUnit\Framework\TestCase;

class AtLeastOneTest extends TestCase
{

    private function getCheeseNames(): array
    {
        $cheeseNames = [
            'Pecorino',
            'Manchego',
            'Tetilla',
            'San Simón',
            'Cabrales'
        ];

        return $cheeseNames;
    }
}
```

En este caso, en vez de eventos y para simplificar voy a usar nombres de quesos. La condición es comprobar si la lista contiene al menos uno cuyo nombre comienza con cierta letra.

La idea es escribir el código usando un test que defina la feature y una vez que pasa empezar a refactorizar.

## El test
 
```php
    public function testAtLeastOneStartingWith(): void
    {
        $cheeseNames = $this->getCheeseNames();
        $atLeastOne = $this->atLeastOneStartingWith('s', $cheeseNames);
        $this->assertTrue($atLeastOne);

        $atLeastOne = $this->atLeastOneStartingWith('z', $cheeseNames);
        $this->assertFalse($atLeastOne);
    }
```

Como podéis ver, hago dos aserciones para verificar que el algoritmo funciona correctamente.

## La solución `foreach`

Tratándose de arrays, lo primero que viene a la cabeza es utilizar un bucle `foreach` y verificar si cada elemento cumple la condición. He aquí el algoritmo:

```php
    private function atLeastOneStartingWith(string $initial, array $cheeseNames): bool
    {
        $atLeastOne = false;
        foreach ($cheeseNames as $cheeseName) {
            if (mb_strtoupper($cheeseName[0]) === mb_strtoupper($initial)) {
                $atLeastOne = true;
                break;
            }
        }

        return $atLeastOne;
    }
```

El algoritmo en sí, como se puede ver, es muy sencillo. Recorremos el array y cuando encontramos un elemento que cumple la condición nos salimos del bucle y retornamos el resultado. Esta es la aproximación que podríamos considerar como más "ingenua" en el sentido de que intenta reproducir paso por paso el algoritmo manual que hemos descrito al principio.

Lo que me interesa señalar es que nunca es mala idea empezar con la implementación más sencilla, ingenua y poco sofisticada, que se nos ocurra. Así tengamos un montón de variables y un montón de código poco optimizado. El objetivo de la primera aproximación es conseguir un algoritmo que funcione para hacer pasar el test y para ello, es buena idea intentar reproducir en código lo que hemos pensado en pseudo-código o dibujado en un papel o una servilleta.

## Limpiando el `foreach`

`break` nos permite salir de un bucle a la brava. Es decir, se utiliza en estructuras de bucle para salir fuera de ella en el momento en que consideremos, sin necesidad de recorrer el resto. En nuestro caso, nos basta con encontrar el primero de los elementos que cumple la condición, así que en cuanto lo encontramos cambiamos el flag `$atLeastOne` y salimos.

Claro que, en este caso, como no hay nada más que hacer podríamos retornar directamente:

```php
    private function atLeastOneStartingWith(string $initial, array $cheeseNames): bool
    {
        $atLeastOne = false;
        foreach ($cheeseNames as $cheeseName) {
            if (mb_strtoupper($cheeseName[0]) === mb_strtoupper($initial)) {
                $atLeastOne = true;
                return $atLeastOne;
            }
        }

        return $atLeastOne;
    }
```

Comprobamos que el test sigue pasando y ahora caemos en la cuenta de que podemos evitar el flag `$atLeastOne`. No tenemos más que hacer un par de refactors `inline`:

```php
    private function atLeastOneStartingWith(string $initial, array $cheeseNames): bool
    {
        foreach ($cheeseNames as $cheeseName) {
            if (mb_strtoupper($cheeseName[0]) === mb_strtoupper($initial)) {
                return true;
            }
        }

        return false;
    }
```

Este refactor nos ahorra una variable intermediaria y, además, hace que resulte más fácil de leer el código.

De nuevo, el test pasa y hay poco más que podamos hacer aquí, ¿o sí?


## Enfoque funcional

¿En qué momento damos un salto en el que no solo modificamos el algoritmo, sino incluso el enfoque bajo el que lo afrontamos?

Muchas veces, cuando hemos refactorizado un código hasta un cierto nivel, se despeja el terreno lo suficiente como para vislumbrar otra manera de hacer las cosas. En este caso, el código no tiene pinta de poder mejorarse más a no ser que lo planteemos de otra forma.

En PHP, las funciones `array_*` nos proporcionan una aproximación funcional al trabajo con esta estructura de datos.

Por ejemplo, `array_walk`, nos permite hacer algo con cada elemento del array, cosa que en este caso no resulta muy útil porque queremos lo que realmente queremos hacer es reducir el array a un valor booleano, que nos diga si al menos uno de los elementos cumple la condición. Con `array_map`, nos pasa algo parecido ya que esta función genera un array nuevo con los elementos de la original transformados por otra función.

Esto nos lleva a considerar `array_filter` o `array_reduce`. 

La primera de ellas nos permite escoger los elemento de un array según si cumplen o no una condición. Podríamos intentar aplicar `array_filter`, entonces:

```php
    private function atLeastOneStartingWith(string $initial, array $cheeseNames): bool
    {
        $namesStartingWith = array_filter(
            $cheeseNames,
            static function ($cheeseName) use ($initial) {
                return mb_strtoupper($cheeseName[0]) === mb_strtoupper($initial);
            }
        );

        return count($namesStartingWith) > 0;
    }
```

Este nuevo planteamiento nos permite pasar los tests, pero tiene algunos inconvenientes, como que vuelve a introducir una variable intermediaria. Además, para devolver el resultado tenemos que hacer una nueva comparación. Funciona, pero no es bonito.

Nos queda `array_reduce`. Suele utilizarse para acumular valores. En el caso de los booleans, lo más parecido a "acumular" es hacer OR:

```php
    private function atLeastOneStartingWith(string $initial, array $cheeseNames): bool
    {
        return array_reduce(
            $cheeseNames,
            static function (bool $atLeastOne, $cheeseName) use ($initial) {
                return $atLeastOne || mb_strtoupper($cheeseName[0]) === mb_strtoupper($initial);
            }
        );
    }
```

## Más propuestas

[Manuel Canga](https://twitter.com/trasweb), nos propone esta solución basada en Regex:

```php
    private function atLeastOneStartingWith(string $initial, array $cheeseNames): bool
    {
        $atLeastOneList = preg_grep("/^{$initial}/i", $cheeseNames);

        return ! empty($atLeastOneList);
    }
```

Las expresiones regulares son una herramienta muy potente que puede resolver infinidad de problemas en una línea de código, pero recurrir a ellas normalmente es algo que proporciona la experiencia.

## Algunas reflexiones

¿Es alguna de las soluciones propuestas mejor que las otras?

Resulta difícil decirlo. El primer planteamiento "ingenuo" parece claramente el de menor calidad, pero no hay que olvidar que nos ha resuelto el problema con solvencia y es fácil de leer. Es poco eficiente pero funciona.

La versión refactorizada del mismo es aún más fácil de leer y suficientemente óptima. De hecho no se puede hacer más siguiendo ese camino.

Las soluciones que usan el enfoque "funcional" son interesantes y, en cierto modo, equivalentes a las otras. La versión de `array_filter` se podría considerar como el método "ingenuo", mientras que la de `array_reduce`, representa la versión óptima. Son la versión sofisticada del algoritmo.

Puestos a comparar la última solución es la que "mola" más y la más "técnica", pero quizá la que resulte más complicada de revisar y mantener en el futuro.

En todo caso, lo que me interesa resaltar es, como casi siempre, el proceso. Empezamos con un modelo basto de cómo solucionar nuestro problema y en cada iteración lo refinamos un poco más. Este refinamiento viene conducido por varias fuerzas, como son: nuestro conocimiento del problema, la necesidad de optimizar la solución y el conocimiento de las técnicas de programación.

Además, esta progresión nos ayuda a aliviar la carga cognitiva: la cantidad de cosas que necesitamos mantener en la cabeza a la hora de afrontar una tarea. Programar no es un juego de "ahora o nunca" en el que haya que acertar a las primera con todas las propiedades de la solución, como que resuelva el problema y esté bien construida. Para lograr ambas, tenemos que conocer bien el asunto que estamos tratando y eso, muchas veces, no lo vamos a conseguir hasta tener una primera aproximación que funciona. El `feedback` entre lo que sabemos y lo que pasa en realidad hace que nuestra visión del problema se refine y mejore, permitiéndonos encontrar soluciones cada vez mejores.
