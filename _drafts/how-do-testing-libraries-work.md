---
layout: post
title: ¿Cómo funciona una librería de tests?
categories: articles
tags: testing
---

Para responder a esta pregunta, vamos a construir una librería de tests.

Vistas desde fuera, las librerías o frameworks para testing pueden parecer un poco misteriosas y complicadas. Sin embargo, podríamos escribir una lo bastante pequeña como para caber en un _tweet_ de los de antes. Como este ejemplo de [Mathias Verraes: A unit testing framework in a tweet.](https://gist.github.com/mathiasverraes/9046427).

En este artículo no vamos a ir por esa línea, sino reflexionar un poco sobre lo que es un test y los problemas que supone diseñar un framework de testing. Lo voy a hacer en PHP, que ya tiene unas cuantas librerías: [PHPUnit](https://phpunit.de/index.html), [Codeception](https://codeception.com/), [Pest](https://pestphp.com/), [SimpleTest](https://github.com/simpletest/simpletest), [PHPSpec](https://phpspec.net/en/stable/), [Behat](https://docs.behat.org/en/latest/) y creo que me dejo bastantes menos conocidas.

PHPUnit es el estándar _de facto_ y nace como versión PHP de la familia _xUnit_, heredera de _SUnit_, la primera herramienta de testing escrita inicialmente por Kent Beck y Erich Gamma para Smalltalk. Sin embargo, otros frameworks optaron por un enfoque más cercano a la idea de especificación mediante ejemplos propia del _Behaviour Driven Development_, de donde surgen utilidades como _RSpec_ en Ruby, que han sido el modelo para _PHPSpec_. Codeception, por su parte, es una librería bastante popular que se basa en PHPUnit, pero que permite trabajar usando ambas aproximaciones al testing.

En fin, solo decir tras esta chapa, que, por supuesto, aunque terminemos con un framework funcional y posiblemente útil, no pretendo añadir más ruido a esta lista, sino haber obtenido un mejor entendimiento.

## Filosofías de testing

Hay un aspecto importante que señalar en el proyecto. Los _frameworks_ de test no son neutrales. ¿Qué quiero decir con esto? Todos los _frameworks_ son _opinionated_, todos se basan en una cierta manera de entender lo que es el testing, cómo y cuándo usarlo, e incluso cómo deberíamos escribir código en general. 

Es el caso de _PHPSpec_, que intenta promover el foco en el comportamiento y diseño del código, para lo cual no solo introduce un lenguaje determinado, sino que impide ciertas prácticas, como puede ser examinar el estado de los objetos bajo test. Esto hace que vaya muy bien en TDD, pero no es muy viable para poner bajo test un proyecto legacy.

_PHPUnit_, por su parte, está más orientado a la verificación, por lo que pone el foco en tests y aserciones, mientras que no establece ningún límite a lo que puedes examinar en un objeto. Puedes usar _PHPUnit_ para TDD y especificación mediante ejemplos sin problemas, siendo una herramienta útil cuando tienes que poner un código antiguo bajo test.

Por tanto, una decisión que hay que tomar al crear un _framework_ de testing es la filosofía de testing que se quiere promover, lo que va a determinar la introducción de un lenguaje de dominio específico, una forma de organizar los tests, y posiblemente también puede acotar un ámbito de uso.

Para este ejemplo en particular, creo que me gustaría desarrollar un framework que se oriente hacia Test Driven Development.

## ¿Qué es un test?

Un test no es más que un pequeño programa que ejecuta un código y compara el output producido con un criterio preestablecido. Este podría ser el ejemplo de un test.

```php
function testEqual($expected, $output)
{
    if ($expected === $output) {
        print("PASS");
    }
    
    print("FAIL");
}
```

En realidad, este ejemplo es muy restrictivo, ya que solo comprueba que dos cosas son iguales. Normalmente, preferiremos que se verifique una condición en general.

```php
function test(bool $condition)
{
    if ($condition === true) {
        print("PASS");
    }

    print("FAIL");;
}
```

Ahora podríamos usar esa función `test()` para saber si nuestro código, representado por `someFunction` produce el resultado esperado.

```php
function testGreaterThan()
{
    $output = someFunction(1000);
    $minimum = 75;

    test($output > $minimum);
}
```

Ejecutar esto mostrará `PASS` o `FAIL` en la consola lo que, para empezar, no está del todo mal. Es obvio que no es muy práctico, pero debería habernos servido para entender el concepto básico: el test nos dice si lo que evaluamos cumple una condición que hemos puesto.

Y sabiendo esto, ya tenemos nuestro primer framework de test:

```php
function test(bool $condition)
{
    if ($condition === true) {
        print("PASS");
    }

    print("FAIL");;
}
```

Bueno, ni tanto. Pero esta es una de las piezas que necesitamos: **la verificación del resultado**. En algunos modelos a esto le llamamos _assert_ o _then_.

Pero también necesitaremos la **expresión del requisito de negocio**: explicitar qué estamos intentando demostrar que hace el código, lo que nos llevará a plantearnos cómo representamos el escenario (_arrange_ o _given_) y lo que debe suceder (_act_ o _when_).

## La expresión de los requisitos de negocio

En estos ejemplos, el nombre del test no dice mucho. Bueno, sí: dice que algo es más grande que otra cosa, algo que se puede leer de forma bastante clara en la última línea. El nombre del test no se expresa en el lenguaje del dominio, no nos dice qué requerimiento estamos cumpliendo. En todo caso, habla de la post-condición que debe cumplir el resultado obtenido para hacer pasar el test.

```php
testGreaterThan
```

Y, como hemos visto antes, en realidad no es más que la definición operativa del requisito de negocio.

```php
test($output > $minimum);
```

Podríamos decir entonces que un test es la representación ejecutable de un requisito de negocio. Un requisito de negocio se puede expresar en lenguaje natural de una forma tal que resulta fácil de comprender por humanos. Pero un ordenador necesitará una definición precisa, que tomará la forma de uno o más tests.

Para ilustrarlo, vamos a imaginar que tenemos un carro de compra y que en el checkout vamos a aplicar un descuento 3x2 para todos los productos. Esta regla de negocio podría enunciarse como "Aplicaremos un descuento 3x2 por cada tres unidades iguales de producto en el checkout".

Podemos expresar esta asociación entre requisito y test de varias formas. Por ejemplo, usando el nombre de la función que encapsula el test. 

```php
function testApply3x2Discount()
{
    $cart = Cart::pickUp();
    $cart->addProduct(new Product("A", 10, "eur"));
    $cart->addProduct(new Product("A", 10, "eur"));
    $cart->addProduct(new Product("A", 10, "eur"));

    $checkout = $cart->checkout();

    test(20 === $checkout->amount());
}
```

El nombre de la función nos proporciona un contexto para poder leer el código e interpretar cada uno de los elementos. El nombre del test describe el requisito de negocio y dota de sentido a todo lo que ocurre en él. Expresar el requisito usando el nombre del test no es la única forma posible de hacerlo. Veremos otras más adelante.

Normalmente, un requisito de negocio no se puede expresar con un único test. Esto es así porque muchos se materializan de distinta forma dependiendo de las condiciones que concurren en cada caso. En consecuencia, un mismo requisito de negocio se tendrá que expresar mediante varios tests.

### Escenario

El escenario de un test está compuesto por un conjunto de precondiciones que definen un contexto en el que se ejecuta el código probado. En nuestro ejemplo el escenario se define por estas precondiciones:

* El usuario inicia un carro de la compra.
* El usuario añade 3 productos iguales.
* El producto cuesta 10 eur/unidad.

Dadas esas precondiciones, el importe total del carro tendría que ser 20.

¿Y qué pasa si compra 6 productos iguales? Que pagará 40 eur. Ese será otro ejemplo del mismo requisito de negocio. Y nos interesa contemplarlo porque define si se aplicará el descuento una vez, o tantas como el número de unidades lo permita.

Otro ejemplo que contribuye a especificar el requisito sería que el usuario compre 5 unidades. En ese caso pagará 40 euros porque se aplicará un descuento a las primeras 3, y las 2 restantes no son suficientes para que se aplique el descuento. Lo mismo si solo compra 1 ó 2 unidades. Si ponemos estos ejemplos en una tabla, tendríamos algo así:

| Precio unitario | Número de productos iguales | Importe a pagar |
|:---------------:|:---------------------------:|:---------------:|
|       10        |              1              |       10        |
|       10        |              2              |       20        |
|       10        |              3              |       20        |
|       10        |              5              |       40        |
|       10        |              6              |       40        |

En otras palabras: un requisito de negocio se especifica mediante varios ejemplos. Cada ejemplo muestra como funciona el requisito en la práctica definiendo las precondiciones y el resultado esperado.

### La acción

El último elemento del test que nos queda por definir es la acción. La acción es el código que se ejecuta bajo unas precondiciones conocidas y que genera un _outcome_. Este _outcome_ puede ser una respuesta o puede ser un efecto en algún otro lugar, como puede ser publicar un evento, guardar algo en una base de datos, etc.

En nuestro test, la acción es esta línea:

```php
$checkout = $cart->checkout();
```

Y es que normalmente la acción es algo tan simple como esto. La mayor parte de un test es la preparación, y la dificultad va a venir normalmente del diseño del código. Cuanto mejor diseño, más fácil es la preparación del test.

### Los requisitos de negocio como tests

Así que tenemos que un test:

* Tiene un nombre que describe un requisito de negocio o un aspecto del mismo
* Define un escenario en el que ocurre la acción
* Ejecuta la acción que genera el resultado
* Compara el resultado con un criterio

## Pero, ¿no querías hacer un framework orientado a TDD?

Ahora vamos a eso. Un aspecto fundamental de TDD es que no verificamos a posteriori el comportamiento de un código, sino que establecemos una expectativa. Esperamos que lo que estamos testeando produzca un cierto resultado o efecto, antes de saber como producirlo.

Esto se traduce en un lenguaje de dominio específíco (DSL) para test. Así, en un test de verificación llamar test a un test tiene mucho sentido, y algo de perogrullada. Pero en TDD, un test es más una especificación, algo que nos dice lo que debería pasar o lo que esperamos que pase.

Así, en lugar de decir algo como "verificar que se aplica el descuento del 3x2":

```php
function testApply3x2Discount() {
    //...
}
```

En TDD preferiríamos decir algo como "debería aplicarse el descuento del 3x2".

```php
function shouldApply3x2Discount() {
    //...
}
```

Algo parecido ocurre cuando comprobamos que el resultado es el esperado. En tests de verificación tiene sentido usar el nombre _test_, o _assert_:

```php
function test(bool $condition)
{
    if ($condition === true) {
        print("PASS");
    }

    print("FAIL");;
}
```

Pero en una especificación, suena más natural algo como _expect_, o incluso _should_. Esto es lo que ocurre en frameworks como _RSpec_.

```php
function expect(bool $condition)
{
    if ($condition === true) {
        print("PASS");
    }

    print("FAIL");;
}
```

Es cierto. Básicamente, se trata del mismo código y seguimos teniendo la necesidad de definir escenarios y acciones. Eso no cambia. Pero el uso de una terminología u otra puede facilitarnos movernos de una forma u otra. ¿Recuerdas cuando mencionábamos más arriba que hay frameworks de test con fuertes opiniones? Pues una forma de expresar esas opiniones es definiendo un lenguaje de dominio.

```php
function shouldApply3x2Discount()
{
    $cart = Cart::pickUp();
    $cart->addProduct(new Product("A", 10, "eur"));
    $cart->addProduct(new Product("A", 10, "eur"));
    $cart->addProduct(new Product("A", 10, "eur"));

    $checkout = $cart->checkout();

    expect(20 === $checkout->amount());
}
```

## Definiendo un DSL

Obviamente, fiar el significado a una convención en los nombres de las funciones de test puede no ser muy eficaz. Y usar lenguaje natural en ellos tampoco es que funcione muy bien. En ese sentido, algunos frameworks optan por otra aproximación. Una función de test que obliga a usar un verbo y nos da libertad total para redactar un nombre de test natural:

```php
should("add two numbers", function() {
    $a = 10;
    $b = 15;
    expect(25 === $a + $b)
})
```

En este ejemplo, tenemos una función a la que se pasa el nombre del test y la función que lo ejecuta. El nombre de la función (_should_ = debería) fuerza una interpretación del test en el sentido de que se define lo que debería pasar.

Ahora fijémonos justamente en _lo que debería pasar_:

```php
expect(25 === $a + $b)
```

En inglés diríamos algo así como "expect $a + $b to be 25", o, tal vez, "expect $a + $b to be equal to 25". Y podríamos reflejar este vocabulario en nuestro DSL. Aquí tenemos tres variantes sinónimas:

```php
expect($a + $b, toBe(25));
expect($a + $b, toEqual(25));
expect($a + $b, toBeEqualTo(25));
```

Esto mismo puede aplicarse a otras afirmaciones sobre el resultado, también llamadas _asserts_. En algunos _frameworks_ prefieren llamarlas _matchers_. He aquí algunos ejemplos.

```php
expect($result, toBeGreaterThan(100));
expect($result, toContain("eur"));
expect($result, toBeTrue());
```

