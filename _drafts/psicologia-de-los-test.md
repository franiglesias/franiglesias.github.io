---
layout: post
title: Psicología del testing
categories: articles
tags: [php, testing, tdd]
---

Mi primer contacto con los tests, con el propio concepto de test para ser precisos, fue de todo menos una epifanía.

Al principio conseguí desarrollar una noción bastante vaga de la idea de testear software, la cual, afortunadamente, fui elaborando y perfeccionando con el tiempo. Aún hoy sigo trabajando en refinarla.

Por otro lado, también me costó entrar en la técnica del testing. En aquel momento había pocas referencias en el mundo PHP y tampoco es que hubiese mucho interés en hacer pedagogía sobre cómo escribir tests, no digamos ya buenos tests. Toda  mi documentación era la que proveía [SimpleTest](http://simpletest.org), un framework del que no sé si se acordará alguien todavía.

Ni te cuento el shock mental que supuso encontrarme con las metodologías test-first y test driven development. Por entonces, no me cabía en la cabeza la idea de no tener que preparar un montón de cosas antes de plantearme siquiera poder empezar a escribir el test más simple.

Después de varios años ha llegado un punto en el que me cuesta escribir software sin empezar por los tests. Con ellos defino mis objetivos al escribir código o tiendo redes de seguridad para realizar modificaciones y rediseños. Como programador, mi vida es ciertamente mejor con tests.

Y sin embargo…





Tendemos a sentir apego por nuestro código. Puede ser feo, pero es nuestro. En realidad, no lo vemos feo, nos parece un unicornio blanco y hermoso.

Para decirlo de forma más técnica y menos dramática: todos tenemos un cierto prejuicio a favor de nuestro propio código y eso puede condicionar el modo en que lo ponemos a prueba con tests.

Hay varios factores que influyen en la dificultad psicológico de testear:

* La sensación de tarea terminada: cuando conseguimos que un código funciones tenemos la sensación de haber cumplido con la tarea, por lo que la fase de testing se convierte en un extra que no siempre estamos dispuestos a realizar (otras tareas nos pueden arrastrar).
* Tenemos un prejuicio positivo acerca de nuestro código. Sencillamente: nos cuesta ponerlo a prueba y es posible que hasta nos moleste. ¿Juzgar nuestro código es juzgarnos a nosotros mismos?
* Ya sabemos que funciona: ¿para qué testear?
