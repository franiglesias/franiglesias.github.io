---
layout: post
title: Null coalescence operator
published: true
categories: articles
author: [paula, fran]
tags: php tips
---

El operador ternario comparte con null coalescence el símbolo de la interrogación, pero ahí se acaba el parecido.

El tema nos ha dado para alguna discusión por lo que me arriesgo a que me acusen de escribir sobre nuestros dramas técnicos ;), pero creo que el tema lo merece.

## Asignando valores que pueden ser `null`

¿Exactamente que es el **null coalescence operator (??)**? Para explicarlo voy a tomar un pequeño rodeo.

Supongamos un código así:

```php
function doSomething(?string $aValue)
{
    $aField = $aValue;
    //...
}
```

Como se puede ver, en este código se pasa un valor a una función, que puede ser null, y se asigna a una variable dentro de la función. Hasta aquí nada fuera de lo normal.

Obviamente, si `$aValue` es `null`, `$aField` será `null`.

## Ternary operator

Podría ocurrir que necesitemos que `$aField` siempre tenga un valor que no sea null. Es decir, si `$aValue` es `null`, tendríamos que sacar un valor de algún otro sitio. Esto lo podemos hacer, por ejemplo, usando el **ternary operator**:

```php
function doSomething(?string $aValue)
{
    $aField = $aValue !== null ? $aValue : 'default';
    //...
}
```

Pero nosotros hemos venido a hablar de **null coalescence operator**, así que lo haremos a partir de su diferencias con **ternary**.

Fundamentalmente, **ternary operator** nos permite elegir entre dos posibles valores dependiendo de si se cumple o no una condición cualquiera. La condición se pone al principio, seguida de la opción en caso de que se cumple y la opción en caso de que no se cumpla.

```
$aVariable = $aCondition ? $valueIfAConditionIsTrue : $valueIfAConditionIsFalse;
```

## Null Coalescence operator

Por contra, **null coalescence operator** nos va a permitir definir 'una lista priorizada de valores entre los que se escoge el primero que no sea `null`', como bien definió mi compañera Paula Julve.

Por tanto, la función anterior se podría reescribir usando **null coalescence**:

```php
function doSomething(?string $aValue)
{
    $aField = $aValue ?? 'default';
    //...
}
```

Esto se podría leer: asigna a `$aField` el valor `$aValue` si no es `null`, en caso contrario asígnale 'default'.

Pero esta lectura no es del todo correcta. En realidad, se debería leer así:

Si `$aValue` no es `null` asígnalo a `$aField`, si es `null` pasa al siguiente, y repite la comprobación hasta que no haya un valor que no sea null o no haya más valores.

Esto también sería posible:

```php
function doSomething(?string $aValue)
{
    $aField = $aValue ?? doAnotherThing() ?? 'default';
    //...
}
```

Es decir: `$aField` recibirá el primer valor de la lista que no sea `null`. Si `$aValue` fuese `null`, se le asignaría lo que devuelva la función `doAnotherThing()`, siempre que no devuelva `null`, claro, en cuyo caso se le asignaría `'default'`.

## Usos

Tal como se muestra en el ejemplo usado, puedes usar null coalescence para asignar un valor por defecto a una variable en caso de que la expresión de la que toma valor pueda ser `null`.

También se aplica con variables que no han sido inicializadas, como en este ejemplo:

```php
function doSomething(?string $aValue)
{
    $aField = $aValue ?? $another ?? 'default';
}

doSomething(null); // -> 'default'
```

Lo cierto es que **null coalescence** nos proporciona un mecanismo de *fallback* para asignar valores obtenidos de diversas fuentes que no sabemos si han sido inicializadas o no:

```php
$aField = $tryThis ?? $thenThis ?? $thenThat ?? 'default';
```


## Entrando al detalle

### Operador ternario

Ambas funcionalidades no dejan de ser atajos para escribir de una manera más clara funcionalidades que ya tiene PHP. Siendo así, la clave es entender exactamente cuál es esa funcionalidad que está operando por debajo.


El operador ternario es el más fácil de traducir, porque la funcionalidad es más acotada. No deja de ser una manera corta de escribir una estructura if/else.

```php
if (!is_null($value)) {
    $field = $value;
} else {
    $field = 'default';
}
```

Esta estructura básica de if/else puede empezar a acortarse utilizando una cláusula de guarda.

```php
$field = $value;

if (is_null($field)) {
    $field = 'default';
}
```

Queda algo más limpio y más fácil de leer. Pero aún así, el operador ternario es todavía más fácil de leer.

````php
$field = !is_null($value) ? $value : 'default';
````

La potencia del operador ternario es que la parte de la condición puede evaluar cualquier condición, tan compleja como sea necesaria. Puede contener exactamente lo mismo que cualquier if statement. Y en algunos casos, puede utilizar la potencia de los falsy values de PHP para acortarlo aún más.

````php
$field = $value ?: 'default';
````

Esto sería equivalente a comprobar que $value contenga algún valor de los que PHP considera truthy, y si es así, lo asigna a $field. En caso contrario, asignará ‘default’. Sería exactamente equivalente a esto:

```php
$field = $value ? $value : 'default';
```

De nuevo, al tratarse de una condición libre, el operador ternario puede aprovechar la potencia de los truthy y falsy values de PHP, o caer en sus trampas. ¡Cuidado con ellos! Un string vacío, un array vacío, o un boolean false saltarán al segundo valor de los dos posibles, y quizá no es lo que necesitábamos.


### null coalesce

Por el contratio, el null coalesce agrupa una sucesión indeterminada de if/else if/else statements. Es más potente en el sentido de que puedes añadirle más opciones, pero mucho menos en el sentido en que la condición es fija, siempre evalúa lo mismo.

```php
if (isset($value1)) {
    $field = $value1;
} else if (isset($value2)) {
    $field = $value2;
} else if (isset($value3)) {
    $field = $value3;
} else {
    $field = null;
}
```

Un bloque de estas características resulta muy molesto tanto de escribir como de leer. y en ese sentido el null coalesce nos permite mantener un código más limpio. Además de eso, null coalesce siempre efectua la misma comparación que la función isset de php, lo que implica que podríamos pasarle variables sin definir sin que eso resulte en una excepción en tiempo de ejecución. Recordemos que isset devuelve true en caso de que la variable exista y sea diferente de null, y false en caso contrario. No lanza ninguna excepción, pero esto hace que un null coalesce se comporte de manera diferente a un ternario en el caso de falsy values.

```php
$value = '';
$field = $value ?: 'default';   // $field cogería el valor 'default'
$field = $value ?? 'default';   // $field cogería el valor string vacío
```

Además de esto, el null coalesce te permite asumir que si ninguno de los valores proporcionados en la lista es distinto de null, simplemente $field tomará el valor null. Por supuesto, también puedes poner un valor por defecto, igual que haríamos con el ternario.

```php
$field = $value1 ?? $value2 ?? $value3 ?? 'default';
```

Un null coalesce de este tipo no devolverá nunca null sino ‘default’, puesto que al menos este último valor no será nunca null.


## Complejidad ciclomática

Si utilizas algún tipo de herramienta para evaluar la complejidad de tu código, deberás tener en cuenta que, aunque sea poco intuitivo, la complejidad ciclomática de un operador ternario se evalúa dos puntos por encima de la de un bloque if/else estándar. A día de hoy no resulta especialmente fácil encontrar explicación a esta situación, que sigue discutiéndose en varios hilos como [este](https://stackoverflow.com/questions/24197973/why-is-the-ternary-operator-more-complex-than-if-else).

