---
layout: post
title: Como hacer una kata de código 
categories: articles
tags: tdd good-practices
---

Con cierta frecuencia he escrito sobre katas de código, especialmente de TDD o refactoring, pero creo que puede ser 
útil un artículo acerca de cómo abordar los ejercicios de código.

## La solución no es tu objetivo

La primera recomendación que se debe tener en cuenta es que se trata de ejercicios orientados a entrenar y automatizar ciertos procesos de pensamiento. Es decir, el objetivo principal no es que resuelvas el problema de código, sino que entrenes el proceso que sigues para conseguirlo.

Por ejemplo, la kata [Leap Year](https://katalyst.codurance.com/leap-year) es un ejercicio de introducción a TDD. Su objetivo es que aprendas a establecer el ciclo red-green-refactor y que procedas en baby-steps. El problema que te plantea es trivial, pero si pasas a resolverlo directamente no estarás practicando el ejercicio.

En consecuencia, deberías centrarte en seguir la cadencia marcada por las leyes de TDD lo más estrictamente que puedas hasta que las automatices.

## Elabora un plan

En el libro fundacional de TDD [Test Driven Development by example](https://www.goodreads.com/book/show/387190.Test_Driven_Development), Kent Beck propone hacer una lista de comportamientos que queremos testear del software que vamos a construir. Es un buen consejo en general.

Pero, ¿qué deberíamos incluir en esa lista? 

Como mínimo, las reglas de negocio que nos proponga el ejercicio.

Por ejemplo, la famosa kata [FizzBuzz](https://katalyst.codurance.com/fizzbuzz) nos pide cumplir tres reglas:

* If the number is a multiple of three, return the string "Fizz".
* If the number is a multiple of five, return the string "Buzz".
* If the number is a multiple of both three and five, return the string "FizzBuzz".

Ahora bien, estas reglas son bastante genéricas. Necesitamos ejemplos concretos que nos permitan escribir tests. Así que añadiremos a la lista, algunos ejemplos básicos:

* Números que no sean múltiplos de 3 o 5: 1, 2, 4, 7...
* Números que sean múltiplos de 3: 3, 6, 9, 12...
* Números que sean múltiplos de 5: 5, 10, 20...
* Números que sean múltiplos de 3 y 5: 15, 30...

Puedes actualizar la lista a medida que avanzas en el ejercicio y descubres que tal vez necesites probar otros casos, o incluso eliminarlos si quedan cubiertos por otros ejemplos.

Puedes incluir la lista como comentario en el archivo del test.

## Una regla cada vez

Si has elaborado un plan de trabajo esta recomendación surge por sí misma: trabaja sobre una parte del problema cada vez. Por lo general, una regla de negocio.

En concreto esto quiere decir:

* No intentes prepararte para lo que pueda venir después, simplemente resuelve la cuestión en la que estés trabajando. No busques un diseño más flexible o general, **aunque sepas cuál es**.
* Intenta que la regla se cumpla (que el test pase) lo antes posible haciendo el código más simple que puedas que pase el test. Una vez que estableces el comportamiento y el test está en verde, es cuando puedes refactorizar. El test en verde garantiza que mantienes el comportamiento al hacer cambios en el diseño.

Esta recomendación se relaciona con la siguiente.

## Reduce el tamaño de los baby-steps (TDD)

Se discute bastante sobre cuál debería ser el tamaño de los baby-steps. Los pasos a los que hacemos referencia son los cambios de código en cada fase de TDD:

* escribir un test que falle
* escribir código de producción
* refactorizar el código de producción

Esto tiene su miga y es una de las recomendaciones que más cuesta cumplir.

Escribir el test más pequeño que pueda fallar implica que el código de producción que lo hace pasar también tiene que ser muy pequeño.

Vamos a ver un ejemplo. 

Para empezar a desarrollar algo: ¿cuál es el test más pequeño que podría escribir? Generalmente, lo que yo hago es escribir un test que instancia la clase que voy a desarrollar. Simplemente eso. Eso implica que el cambio que tengo que hacer es únicamente escribir un esqueleto de esa clase. Para que esté ahí y el test pase.

Normalmente el IDE me va a permitir crear la clase de manera automatizada y ponerla en un archivo en la ubicación adecuada. Puesto que es un proceso automático lo aceptamos.

En algunos lenguajes esto no ocurre y crea la clase en el mismo archivo del test. En ese caso, uso la fase de refactor para moverlo. Como el test está pasando, eso me asegura que moveré la clase al lugar adecuado, ya que de otro modo el test fallará.

Mi siguiente test garantiza que puedo invocar el método en que estoy interesado. O más rigurosamente: que el objeto entenderá el mensaje que le envío.

Y así progreso paso a paso hasta que estoy en condiciones de implementar comportamiento. En ese momento es cuando entran en juego las reglas de negocio, para lo cual tengo que tener una lista de ejemplos que las ejerciten y escribir un test para cada caso.

La kata [String Calculator](https://katalyst.codurance.com/string-calculator) es un buen ejercicio para practicar esta recomendación, ya que su mecánica consiste en presentar una regla de negocio cada vez.

## Reduce el tamaño de los baby steps (refactoring)

En los ejercicios de refactoring los baby-steps vendrían definidos por el tiempo en que el código está _roto_. Bien sea porque los cambios que hacemos hacer fallar temporalmente los tests, bien sea porque el código está en estado "no desplegable" y no se puede ejecutar.

Así que debemos proceder con estrategias que nos permitan limitar ese tiempo al máximo o que nos permitan revertir el cambio que rompe los tests (o que hace fallar el código) en el menor tiempo posible.

Para ello también podemos usar refactors automáticos provistos por el IDE, ya que garantizan que el código mantendrá el mismo comportamiento.

Un ejemplo de kata con la que practicar esta recomendación es la [Tennis Game Refactoring Kata](https://github.com/emilybache/Tennis-Refactoring-Kata), que es de refactor puro. Y otra clásica es [Gilded Rose](https://katalyst.codurance.com/gilded-rose).

## Usa control de versiones

El control de versiones es una herramienta muy buena cuando haces ejercicios de código. Y en algunos casos, es indispensable, particularmente en los ejercicios de refactoring. Aunque no vayas a publicar el ejercicio, estos son algunas de las cosas de las que te puedes beneficiar:

* Ten el proyecto para realizar el ejercicio en un repositorio en master y trabaja en una rama. De este modo, siempre tendrás el proyecto listo para repetirlo.
* Haz commit cada vez que consigues un logro: pasar un test, implementar una regla de negocio, refactorizar alguna parte. De esta forma, si más adelante te encuentras algún escollo que no sabes como resolver puedes volver a una etapa anterior e intentarlo de nuevo con un `git reset`. La versión extrema de esto es [TCR](/tcr).

## Repite el ejercicio decenas de veces

Has leído bien. Repite los ejercicios decenas de veces.

El objetivo es automatizar procesos de pensamiento. Al repetir el ejercicio varias veces te acostumbrarás a detectar ciertos patrones y reaccionar ante ellos. A veces te saldrá exactamente la misma solución, línea por línea. Otras veces, encontrarás una nueva forma de hacerlo.

Aparte de eso, cuando has ejecutado un mismo ejercicio de código el suficiente número de veces, te será más fácil introducir otros conceptos, como pueden ser refactorizar a patrones de diseño, aplicar las ideas de [elegant objects](https://www.elegantobjects.org/), usar el ejercicio para aprender otro lenguaje de programación u otro paradigma. 

## Utiliza las herramientas del IDE

Ya he mencionado antes el uso de los refactorings automatizados, pero los IDE modernos ofrecen una infinidad de utilidades y atajos que estarás aprendiendo toda la vida.

No te agobies por aprenderlos todos, pero plantéate aprender al menos uno nuevo con cada ejercicio o dedica un tiempo al día  hacerlo. Por ejemplo, en IntelliJ IDEA podrás encontrar un curso "Learn IDE Features" bajo el menú Help, en el que estarás descubriendo cosas nuevas a cada paso.

Es decir, aprovecha los ejercicios de código para practicar también tus habilidades con el IDE. Puedes llegar a hacer maravillas casi sin teclear, fíjate lo que hace Emily Bache en [esta serie de vídeos sobre la Gilded Rose kata](https://www.youtube.com/playlist?list=PLuvRKxeqrv4K-rn0zxHPNiXOWBkP9ZZIH), en los que prácticamente no escribe una línea de código.

## Para nota: escribe un test de aceptación

Una vez que adquieres suficiente práctica haciendo TDD es una buena práctica escribir un test de aceptación antes de empezar el desarrollo. El test de aceptación describe el comportamiento del software que vas a desarrollar, en este caso, antes de que exista.

La forma de escribirlo consiste básicamente en imaginar cómo usaríamos ese software en una situación real y usaríamos los ejemplos propuestos por el propio enunciado del ejercicio o las reglas de negocio.

Una kata que se presta muy bien a ello es [Simple Mars Rover Kata](https://katalyst.codurance.com/simple-mars-rover) o [Mars Rover](https://katalyst.codurance.com/mars-rover). En su enunciado encontrarás algunos ejemplos que describen el comportamiento que se espera. Estos ejemplos sirven para probar el Rover, pero son demasiado grandes como para que puedas proceder con TDD.

Para escribir el test de aceptación necesitarás, por supuesto, usar algunas clases inexistentes, pero en esa fase estarás definiendo su API pública.

## Si no te sale, déjalo

Con frecuencia los ejercicios no te saldrán. Incluso los más sencillos pueden atascarse, especialmente si quieres probar algún concepto nuevo, introducir un patrón que acabas de conocer, etc.

Simplemente deja el ejercicio en ese punto. Si usas control de versiones, revierte los cambios hasta un momento confortable anterior. No conserves código por el hecho de conservarlo. Si no ha funcionado, es código que no vale. Bórralo sin remordimiento.

## Ejecuta siempre todos los tests

De este modo aseguras que los cambios no rompen los comportamientos que hayas implementado hasta el momento. Es fácil caer en la tentación de solo ejecutar el test que acabas de escribir, pero podrías estar perdiendo información del cambio preciso que ha roto el código de producción.

Si unes esto a introducir solo cambios pequeños, tienes una herramienta muy poderosa para escribir código libre de defectos, ya que si los cambios son pequeños y provocan un fallo, será fácil identificarlo y revertirlo.

## Aplica Transformation Priority Premise

La [Tranformation Priority Premise](http://blog.cleancoder.com/uncle-bob/2013/05/27/TheTransformationPriorityPremise.html) sugiere la forma de secuenciar los cambios en el código de producción para que sean lo más pequeños que sea posible y nos permitan avanzar hacia la generalización del algoritmo exactamente lo necesario.

Es decir, esta regla nos dice que empecemos con el código de producción en un estado (no hay código) y cambiarlo con cada nuevo test siguiendo una serie de pasos definidos. No son refactors, sino cambios del código de producción. Son estos:

```
({}–>nil) no code at all->code that employs nil
(nil->constant)
(constant->constant+) a simple constant to a more complex constant
(constant->scalar) replacing a constant with a variable or an argument
(statement->statements) adding more unconditional statements.
(unconditional->if) splitting the execution path
(scalar->array)
(array->container)
(statement->recursion)
(if->while)
(expression->function) replacing an expression with a function or algorithm
(variable->assignment) replacing the value of a variable.
```

Ejercitarse en esta secuencia te ayudará a definir mejor el tamaño de los baby-steps y, en general, te ayudará a desarrollar a un ritmo más sostenible.

Algunas katas te permitirán practicar esta secuencia, en particular yo destacaría las clásicas [Bowling Game](https://katalyst.codurance.com/bowling) o [Roman Numerals](https://katalyst.codurance.com/roman-numerals).

## Aplica consistentemente las cuatro reglas del diseño simple

Kent Beck (otra vez) propone [cuatro reglas sencillas para guiar un buen diseño](https://www.martinfowler.com/bliki/BeckDesignRules.html).

### Pasa los tests

El sistema funciona, por lo tanto los tests pasan. Con los tests pasando, puedes centrarte en mejorar el diseño.

### Revela su intención

* Los elementos del sistema tienen nombres que los representan bien.
* Los elementos (clases y funciones) son pequeños.
* Intenta que el código no necesite documentación.

### Evita la duplicación

Elimina la duplicación siempre que sea posible. Aunque es mejor usar la regla de las tres repeticiones. Es decir: considera la duplicación un problema si el código se repite al menos tres veces.

### La menor cantidad de elementos posible

* Elimina código que no se use.
* Intenta no sobre-extraer clases.

## Fin

Siguiendo estas recomendaciones tus ejercicios de código serán más productivos y te ayudarán a desarrollar tus habilidades profesionales.
