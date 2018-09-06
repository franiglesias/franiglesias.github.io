---
layout: post
title: Splat operator
categories: articles
tags: php tips
---

Aunque está entre nosotros desde la versión 5.6 de PHP, splat operator es relativamente desconocido y su uso no deja de ser un poco confuso.

Splat operator se expresa con el símbolo ... y tiene dos utilidades principales:

* Ayudarnos en la creación de funciones variádicas
* Argument unpacking o desempaquetado de argumentos

Veamos esto más en detalle.

## Funciones variádicas

La primera utilidad de splat operator tiene que ver con la creación de funciones variádicas.

Las funciones variádicas son funciones a las que podemos pasar un número variable de parámetros (variádicas, variable… lo pillas, ¿no?). No era un concepto nuevo de PHP en la versión 5.6, en la que se introdujo el operador, pero es ciertamente más cómodo.

La utilidad de las funciones variádicas es la de poder tener funciones o métodos que acepten una cantidad indeterminada de argumentos, con frecuencia del mismo tipo aunque no necesariamente. Intentaré poner un par de ejemplos que se me han ocurrido, pero antes veamos qué aporta el operador al respecto de la forma tradicional de hacerlo.

### Old school

Antes del splat, las funciones variádicas se hacían así, recurriendo a `func_get_args()`:

```php
function old_style_variadic_function ()
{
    $arguments = func_get_args();

    foreach ($arguments as $key => $argument) {
        printf('%s -> %s'.PHP_EOL, $key, $argument);
    }
}

old_style_variadic_function ('one', 'two', 'three');
```

Lo que da como resultado:

```
0 -> one
1 -> two
2 -> three
```

Alternativamente, puedes acceder a uno de los argumentos si conoces su posición:

```php
function old_style_variadic_function ()
{
    printf('%s -> %s'.PHP_EOL, 1, func_get_arg(1));
}
```

Que devuelve:

```
1 -> two
```

## Splat operator ...

Usando el splat operator nos ahorramos un par de líneas, además de que la signatura de la función es más explícita, ya que nos indica que espera un número indefinido de argumentos:

```php
function old_style_variadic_function (...$arguments)
{
    foreach ($arguments as $key => $argument) {
        printf('%s -> %s'.PHP_EOL, $key, $argument);
    }
}
```

El resultado es el mismo:

```
0 -> one
1 -> two
2 -> three
```

Pero es que además admite type hinting, por lo que si uno de los argumentos no es del tipo indicado la función fallará:

```php
declare(strict_types=1);

function old_style_variadic_function (string ...$arguments)
{
    foreach ($arguments as $key => $argument) {
        printf('%s -> %s'.PHP_EOL, $key, $argument);
    }
}

old_style_variadic_function ('one', 3, 'three');
```

Que da como resultado un Fatal error: Uncaught TypeError. En el ejemplo he declarado tipado estricto para evitar que PHP convierta al vuelo los tipos escalares.

### Ideas para usar variádicas

Concatena un número indefinido de cadenas de componer textos largos de una sola tacada:

```php
declare(strict_types=1);

function concat (string ...$arguments)
{
    return implode(PHP_EOL.PHP_EOL, $arguments);
}

print (concat(
    'Estimada amiga: ',
    'Le comunicamos que ha sido agraciada con el premio:',
    'Mejor programadora PHP del año 2018',
    'Reciba un cordial saludo.'
));
```

El resultado:

```
Estimada amiga

Le comunicamos que ha sido agraciada con el premio:

Mejor programadora PHP del año 2018

Reciba un cordial saludo.
```

Para opciones a una función de modo que no importe ni el orden ni la cantidad de argumentos:

```php
declare(strict_types=1);

function draw(string $shape, string ...$arguments)
{
    $result = sprintf('Draw a %s with ', $shape);

    foreach ($arguments as $key => $option) {
        switch ($option) {
            case 'border':
                $result .= sprintf(' border %s px thick', $arguments[$key+1]);
                break;
            case 'color':
                $result .= sprintf(' colored with %s', $arguments[$key+1]);
                break;
            default:
                break;
        }
    }
    $result .= PHP_EOL;
    return $result;
}

print(draw('Square', 'border', '3'));

print(draw('Square', 'color', 'red'));

print(draw('Square', 'color', 'red', 'border', '1'));

print(draw('Square', 'border', '2', 'color', 'green'));
```

Dará como resultado lo siguiente:

```
Draw a Square with  border 3 px thick
Draw a Square with  colored with red
Draw a Square with  colored with red border 1 px thick
Draw a Square with  border 2 px thick colored with green
```

Si esto te suena a los argumentos posicionales de bash, estás en lo cierto.

## Argument unpacking

El desempaquetado de argumentos actúa más o menos en el sentido inverso. Con el splat operator podemos hacer que un array se mapee contra los argumentos de una función. En este caso usamos el operador para actuar sobre el array que pasamos como argumento.

```php
declare(strict_types=1);

function pass_me_two_arguments(string $shape, string $color)
{
    return sprintf('Draw a %s with color %s.', $shape, $color). PHP_EOL;
}

print(pass_me_two_arguments('Square', 'blue'));

print(pass_me_two_arguments(...['Triangle', 'yellow']));
```

El resultado será:

```
Draw a Square with color blue.
Draw a Triangle with color yellow
```

Si el array tiene menos elementos que el número de argumentos se lanzará un error.

En cambio, si pasamos array con más argumentos de los necesarios, los que sobren serán ignorados.

## Referencias

* [PHP 5.6 and the Splat Operator](https://lornajane.net/posts/2014/php-5-6-and-the-splat-operator)
* [PHP - Splat Operator](https://blog.programster.org/php-splat-operator)
