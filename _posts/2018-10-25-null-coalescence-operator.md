---
layout: post
title: Null coalescence operator
published: true
categories: articles
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





