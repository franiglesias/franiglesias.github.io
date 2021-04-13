---
layout: post
title: El nano framework de test con el que aprendo javascript
categories: articles
tags: tdd javascript
---

Llevo un tiempo volviendo a aprender Javascript y estoy empezando a entender este lenguaje. Casi hasta me gusta.

Gracias a Iván Nieto, que me presentó el libro [Eloquent Javascript](http://eloquentjavascript.net) estoy volviendo a retomar de forma ordenada la programación con Javascript.

Javascript es un lenguaje que siempre me ha tenido un poco perplejo. Al principio, apenas era una forma de hacer que las páginas web fueran un poco menos estáticas y, con el tiempo, se ha convertido en una pieza clave del desarrollo para Internet, y más allá. Sin embargo, no hace tantos años aún se planteaba la conveniencia de no usarlo para evitar un montón de problemas de accesibilidad y compatibilidad.

Ahora la situación ha cambiado. No te puedes plantear no usar Javascript. Pero a la vez, es tremendamente confuso. No tanto por el lenguaje en sí, sino por la pléyade de frameworks y opciones que se ofrecen para el desarrollo front-end, los cambios en el propio lenguaje que llegan o no llegan a los navegadores y el hecho de tener dos grandes entornos de trabajo: navegador y ordenador, vía node.js.

A lo largo de mi vida como programador he ido tocando Javascript a ratos, intentando utilizarlo, pero cada vez que me aproximaba al lenguaje había cambiado algún paradigma básico, como la llegada de Ajax, jQuery para resolver gran parte de los problemas iniciales del lenguaje y, últimamente, el concepto reactivo y la diversidad de frameworks que han ido apareciendo y desapareciendo. No fui capaz de llegar a nada muy profundo, por lo que finalmente he decidido empezar de cero.

Viniendo de PHP y otros lenguajes, Javascript resulta raro. Hay lenguajes que siguen ciertos principios y prácticas y moverse de uno a otro no resulta demasiado complejo. Javascript hace algunas cosas de forma diferente a los demás.

En fin. Mi plan era seguir el libro Eloquent Javascript de pe a pa, haciendo ejemplos y ejercicios de modo que pudiese empaparme del lenguaje y su forma de trabajar de manera ordenada. [Este trabajo puede seguirse en este repositorio.](https://github.com/franiglesias/eloquentjs)

Claro que, al poco tiempo, me di cuenta de echaba de menos un entorno de test. Como no tenía ganas de complicarme pensé en hacer algo sencillo. Recordé la idea de Mathias Verraes, a [test framework in a tweet](https://gist.github.com/mathiasverraes/9046427).

## ¿Qué es un test?

Al fin y al cabo, ¿qué es un test?

Un test no es más que un pequeño programa que verifica que cierta condición se cumple. Para ayudarnos, el entorno de test simplemente muestra la información de una manera comprensible: un mensaje que dice lo que el test comprueba y una indicación de que la prueba ha pasado o no. Idealmente, en colores verde y rojo.

Y aquí está:

{% gist 7ed8f3f055fe04b5141e3066bc1ba3c8 %}

Puede recibir todavía muchas mejoras, pero con esta función sencilla ya dispongo de un entorno de test suficiente como para realizar los ejercicios incluso haciendo TDD.

## Una línea que vale su peso en oro

Una vez que tuve mi entorno de test, este demostró ser utilísimo para mejorar mi conocimiento de Javascript, tanto en velocidad como en solidez.

En primer lugar, al poder escribir con metodología TDD el aprendizaje se hace mucho más fácil y potente.

Al crear una función, por ejemplo, empiezas con los casos más sencillos. La metodología de pasos mínimos de TDD te ayuda a ser consciente de algunos casos límite e ir añadiendo las complicaciones poco a poco. Por ejemplo, me ha ayudado a darme cuenta de cuando puedo recurrir a algoritmos recursivos, así como de casos que debo tratar por separado.

También me ha servido para caer en cuestiones que son propias del lenguaje y que se hacen de manera muy distinta que en otros.

## Arrays

Los arrays en PHP son una estructura de datos muy usada porque es tremendamente fácil de manejar. Por ejemplo, puedes crear, modificar y comparar arrays muy fácilmente, así que son ideales para transportar datos complejos y hay quien las usa como DTOs. Al margen de otras cuestiones, como la visibilidad de los datos, los arrays son bastante convenientes, pero para ciertos usos tienes que recurrir a funciones específicas que, como sabemos, en PHP no siempre tienen una sintaxis muy coherente (array_walk, array_map y demás). De hecho, para muchas cosas suele ser buena idea utilizar clases específicas para soportar la estructura de colección.

En JS los arrays son objetos y tienen métodos para manejarlos como colecciones que son realmente elegantes a la hora de trabajar.

Pero también tiene ciertas peculiaridades. Por ejemplo, no puedes comparar arrays sin más. Necesitas crear una función específica (de momento no estoy extendiendo objetos) para lograrlo. Aquí una primera tentativa de solución:

{% gist 2372af7b2cbc5ae0737807d59dd393f6 %}


## Undefined vs null

En PHP null vale para casi todo y, según el contexto, puede evaluar a `false` o a 0 (cero). Esto no es del todo bueno porque introduce ambigüedades. Así, por ejemplo, una función que no devuelve "nada" (return; o return implícito), devuelve null. Eso se ha usado muchas veces cuando se detecta un error y no se puede ejecutar la función. Sin embargo, en esos casos, no podemos diferenciar cuándo se ha producido un error y cuándo no se ha producido resultado. La solución es lanzar un excepción cuando es un error y null cuando no hay una respuesta.

En Javascript undefined se refiere a cualquier cosa que no tiene un valor. Las funciones son undefined si no devuelven nada explícitamente, y las variables declaradas están undefined si no se les asigna un valor. Null es otra cosa y puede usarse de manera más limitada con un significado más restringido. Por ejemplo, en una lista ligada, podríamos poner el enlace next a null para indicar que no apunta a ninguna parte.

## Argumentos en funciones

En javascript todos los argumentos en funciones son opcionales, pero todos son pasados a la función, así que pueden quedar "undefined". Lo que no se puede hacer es darles valores por defecto, como hacemos en PHP. Sin embargo, es posible hacerlo en el cuerpo comprobando si están "undefined".

En este ejemplo de FizzBuzz se puede ver un uso de undefined para asignar un valor por defecto si no se especifica uno de los argumentos de la función, en este caso maxLen en la función fizzBuzzList:

{% gist 5629ef70f9d331648eae54e59ff1692a %}

No es el ejemplo más hermoso de la kata FizzBuzz del mundo, pero algo es algo.

Y estas son algunas de las cosas que he ido aprendiendo estos días. Pronto entraré en el mundo de los objetos Javascript, que también tiene sus peculiaridades.

 
