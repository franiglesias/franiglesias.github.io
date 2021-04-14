---
layout: post
title: Legacy (Blogtober2019)
categories: articles
tags: blogtober19
---

Mi compañera y manager en Holaluz [Mavi Jiménez](https://twitter.com/Linkita) va a hacer un dibujo cada día del mes sobre una palabra propuesta en twitter. Y aquí vamos a intentar escribir [un post por cada una de ellas](https://franiglesias.github.io/blogtober19-status/).


## Legacy

Creo que la mejor definición que se haya dado el código *legacy* es la de Michael Feathers: "Legacy es código sin tests". Es simple, es operativa y es independiente de otras cuestiones.

> To me, legacy code is simply code without tests.  
> *Working Effectively with Legacy Code*

Hay gente a la que el *legacy* parece molestarle. Es código feo, que requiere arremangarse y tener paciencia. Sí, es cierto que es código propenso a ocultar errores. Sí, es cierto que suele resultar confuso al leerlo. Sí, es cierto que requiere bastante trabajo de refactoring antes de ver que empieza a lucir un poco, o que le puedas introducir alguna nueva tecnología molona.

Sin embargo, como se suele decir:

<blockquote class="twitter-tweet" data-conversation="none" data-cards="hidden" data-partner="tweetdeck"><p lang="es" dir="ltr">Toda la razón. Hay mucha gente quejándose del legacy y ese ese legacy el que le paga las nóminas...</p>&mdash; Jesus L.C. (@jeslopcru) <a href="https://twitter.com/jeslopcru/status/1188085510415228929?ref_src=twsrc%5Etfw">October 26, 2019</a></blockquote>

Criticar el *legacy* es fácil. Muchas veces lo comparamos con lo que haríamos nosotros ahora, y por tanto, fuera de contexto:

<blockquote class="twitter-tweet" data-conversation="none"><p lang="es" dir="ltr">El problema de la mala fama del legacy es similar a lo que pasa con el fútbol: todo el mundo sabe cómo se hubiese ganado el partido, cómo se jugaría mejor o cómo se debería haber tirado el penalti decisivo que se falló. Sin embargo, ellos no estaban ahí en el campo &quot;sufriendo&quot;</p>&mdash; José Alberto Ruiz (@jalb80) <a href="https://twitter.com/jalb80/status/1188564964522582016?ref_src=twsrc%5Etfw">October 27, 2019</a></blockquote> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script> 

Olvidando que ese código se creó en un momento dado de la historia del proyecto, con una serie de condicionantes que pueden explicar por qué se escribió así:

<blockquote class="twitter-tweet"><p lang="es" dir="ltr">Estoy un poco hasta el potorro del todo está mal de los programadores. Amiguitos, todo tiene un contexto y un por qué. Menos quejarse y más proponer soluciones.</p>&mdash; Mavis 🎃 (@Linkita) <a href="https://twitter.com/Linkita/status/1188065170528055296?ref_src=twsrc%5Etfw">October 26, 2019</a></blockquote> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>

Sin embargo, creo que hay una manera de considerar el código que nos puede ayudar a ponernos en la disposición adecuada para trabajar con él.

### El código es una representación del conocimiento

La visión del código como una representación ejecutable del conocimiento que tiene el equipo del negocio es muy potente. Esta visión contrasta con la de que el código es una mera solución técnica al problema del negocio, e implica una relación completamente distinta entre desarrolladores y dominio.

En cada momento, el código nos habla de dos cosas:

* La representación del dominio en un modelo ejecutable, expresado en forma de código, más o menos articulada según el conocimiento que comparten desarrolladores y expertos de dominio.
* Las limitaciones de la tecnología o lenguaje utilizados, y la fluidez de los desarrolladores, para realizar ese modelo. O dicho de otra forma: la capacidad que tienen los desarrolladores de expresar el modelo en el lenguaje de programación utilizado.

Según esto, podemos analizar el *legacy* como un código que representa un conocimiento del negocio en un momento anterior de la historia del proyecto. En ese momento puede ocurrir que ciertos conceptos no estén bien representados o desarrollados, o que ciertas relaciones no se habían establecido o han cambiado desde entonces. Además existen limitaciones en los lenguajes que se pueden rastrear en las bases de código, atendiendo a la versión del lenguaje de programación disponible en un momento dado o incluso a los patrones y teorías de diseño dominantes.

Piensa en el código como en el conocimiento científico: siempre es perfeccionable y, de hecho, se ha perfeccionado históricamente. En ese perfeccionamiento han influido muchos factores, entre ellos las herramientas disponibles, tanto las intelectuales, como el método científico o la filosofía de la ciencia, como el alcance, resolución y precisión de los instrumentos de medida. Los cambios en el conocimiento científico reflejan esos avances.

En ese sentido, el problema con el *legacy* aparece cuando este se queda estancado y no evoluciona a la vez que lo hace el conocimiento del negocio. Esto puede ocurrir si hay un parón en el desarrollo, o si es un software encargado a una empresa externa que lo entrega y no sigue desarrollándolo, o si el equipo de desarrollo original desaparece de forma más o menos brusca, sin que se haya producido un relevo. Cuando el desfase entre el modelo representado por el *legacy* y el conocimiento del negocio es muy grande, cabe plantearse que puede ser mejor opción iniciar un proyecto nuevo que sustituya progresivamente al anterior.

Mirado de esta forma, el *legacy* deja de ser *legacy* y el código *nuevo* deja de serlo también. Se trata simplemente de instantáneas de nuestro conocimiento del dominio. Si creemos que hay un desfase entre lo que el código dice y lo que sabemos, nuestro trabajo es reducirlo.


