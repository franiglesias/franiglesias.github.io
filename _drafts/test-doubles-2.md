---
layout: post
title: Test doubles (2) Principios de diseño
categories: articles
tags: [tdd, test-doubles]
---

Los principios de diseño están muy relacionados con el testing de modo que son tanto un objetivo de diseño como una herramienta para lograrlo.

Las consecuencias sobre la escritura de tests se podrían sintetizar en dos beneficios principales:

* El código que respeta los principios de diseño es más fácil de testear.
* La creación de *test doubles* se simplifica si las clases que se doblan siguen los principios de diseño.

Por otro lado, los buenos test tienden a llevarnos a mejores diseños, precisamente porque los mejores diseños nos facilitan la escritura de buenos tests. Es un círculo virtuoso.

En otras palabras: cuando es difícil poner bajo test un código es que tiene problemas de diseño.

## Principios de diseño y doubles

Esta relación entre principio de diseño y test doubles se manifiesta de muchas maneras.

Como hemos visto, si el código bajo test sigue principios de diseño, será más fácil escribir los tests y, por el contrario, si vemos que montar la prueba resulta complicado nos está indicando que deberíamos cambiar el diseño del código bajo test.

Incluso si vemos que generar el test double es complicado, eso nos indicaría tanto que la clase colaboradora tiene también problemas de diseño o que la interacción entre unidad bajo test y colaborador no está bien planteada.

### Single Responsibility

Una clase que sólo tiene una razón para cambiar será más fácil de testear que una clase que tiene múltiples responsabilidades.

Al desarrollar los test doubles, este principio nos beneficia en el sentido de que las clases dobladas serán más sencillas de definir al tener que reproducir un sólo tipo de comportamiento. 

### Open/Closed

El principio abierto/cerrado se refiere a que las clases estarán abiertas para que su comportamiento pueda ser modificado extendiéndolas sin cambiar su código.

Cuando creamos un test double lo que queremos conseguir es un objeto equivalente al real, pero con un comportamiento distinto. Por ello, en muchos casos extendemos por herencia la clase original para crear el test double o, mejor, implementamos su interfaz.

### Liskov substitution

El principio de sustitución de Liskov está en la base de nuestra posibilidad de realizar test doubles.

Este principio dice que en una jerarquía de clases, las clases base y las derivadas deben ser intercambiables, sin tener que cambiar el código que las usa.

Cuando creamos test doubles extendemos clases o bien implementamos interfaces, que viene siendo lo mismo. El hecho de que se cumpla este principio es lo que permite que podamos introducir doubles sin tener que tocar el código de la clase bajo test.

### Interface segregation

El principio de segregación de interfaces nos dice que una clase no debe depender de funcionalidad que no necesita. Dicho de otro modo: las interfaces deben exponer sólo los métodos necesarios. Si fuese necesario, una clase implementará varias interfaces.

Cuanto mejor aplicado esté este principio más fácil será crear doubles y los tests serán menos complejos y más precisos ya que no tendremos que simular un montón de comportamientos.

### Dependency Inversion

La inversión de dependencias nos dice que siempre debemos depender de abstracciones. 

De este modo cambiar la implementación que usamos se convierte en algo tan trivial como inyectar una diferente. En la situación de test, inyectamos el double.

### Ley de Demeter

La ley de Demeter nos dice que los objetos sólo deben comunicarse con los objetos que conocen. Si un objeto A llama a otro objeto B que, a su vez, utiliza un tercer objeto C para responder a esa petición, entonces A no debe conocer nada de C.

En el caso de los test esto significa que por muchas dependencias que pueda tener una clase doblada, no las necesitamos para crear el double ya que sólo nos interesa su interfaz o su comportamiento, no su estructura. Y si las necesitásemos entonces es que tenemos un problema con el diseño.

Hay algunas excepciones ya que muchos objetos pueden tener como misión entregar otros objetos, como pueden ser factorías, mensajes como Commands, Request, etc.

### YAGNI: You ain't gonna need it

El principio Yagni nos recuerda que no deberíamos desarrollar aquello que no necesitamos ahora.

Por lo tanto, nuestros tests doubles tienen que responder a la necesidad específica que tengamos en el momento de crearlo. Un test double puede comenzar siendo un simple dummy en un test para pasar a ser un Mock en otro.

Por el mismo motivo, nuestra técnica concreta de creación podría varias en función de los que nos interesa lograr en ese momento concreto.

