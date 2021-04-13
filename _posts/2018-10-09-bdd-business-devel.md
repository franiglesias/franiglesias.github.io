---
layout: post
title: BDD. Tendiendo puentes entre negocio y desarrollo
published: true
categories: articles
tags: php bdd soft-skills
---

Vamos a cambiar un poco de enfoque antes de continuar con otros aspectos y ejemplos técnicos del Desarrollo Guiado por Comportamiento. Vamos a ocuparnos del BDD como herramienta de comunicación.

## Behavior Driven Development para el desarrollo ágil

[Dan North cuenta en este artículo](https://dannorth.net/introducing-bdd/) el proceso mediante el que llegó a concebir la idea de Behavior Driven Development y es una historia interesante.

Pero para contarla hay que remontarse al concepto de Desarrollo Ágil de Software, tal y como se recoge en el [Manifiesto Ágil](http://agilemanifesto.org/iso/es/manifesto.html). Tradicionalmente, los proyectos de desarrollo de software se construían con el llamado [modelo de cascada o waterfall](https://openclassrooms.com/en/courses/4309151-gestiona-tu-proyecto-de-desarrollo/4538221-en-que-consiste-el-modelo-en-cascada), heredado de la ingeniería, en el que un proyecto pasaba por orden las siguientes fases:

* toma de requisitos
* especificación y diseño
* implementación
* pruebas
* mantenimiento

El problema de este modelo en el ámbito del desarrollo de software es que los requisitos suelen cambiar mucho más rápidamente de lo que el equipo es capaz de avanzar en el proyecto, esos cambios generan rediseños, los cuales obligan a postergar y prolongar la fase de implementación, etc. Al final, con frecuencia, los productos se entregan tarde, con mucho esfuerzo y, probablemente, sobrecostes, resultando poco o nada útiles en la práctica pues las circunstancias han cambiado y el software ya no sirve para lo que se había planeado.

Esta constatación fue la que [llevó a que en febrero de 2011](http://agilemanifesto.org/history.html) un grupo de 17 programadores se reuniesen para hablar de formas en las que afrontar esta problemática. El resultado fue un conjunto de valores y principios que constituye el llamado Manifiesto Ágil. 

El Manifiesto Ágil se basa en cuatro valores:

* Individuos e interacciones por encima de procesos y herramientas
* Software funcional por encima de documentación extensiva
* Colaboración con el cliente por encima de negociación de contratos
* Responder al cambio por encima seguir un plan

En general, el desarrollo ágil propone un modelo de trabajo iterativo e incremental. En lugar de intentar entregar un producto completamente acabado y cerrado, se define un mínimo producto viable que aporte valor y se van añadiendo prestaciones en cada ciclo de entrega, recogiendo el feedback para regular el proceso desarrollo.

De este modo se consigue que las necesidades de diseño previo sean menores, a la vez que se obtiene feedback muy pronto y es posible adaptarse a los cambios en los requerimientos de forma rápida y sin incurrir en sobrecostes.

En cierto modo, cada iteración se lleva a cabo siguiendo un modelo waterfall, pero como las entregas al final del ciclo (lo que solemos llamar un *sprint*) son pequeñas se se obtienen beneficios en todas las fases porque cada etapa es mucho menos compleja que el proyecto total, el feedback se obtiene más rápidamente y es posible responder a los cambios de requisitos y a los fallos de diseño con celeridad y bajo coste.

Por resumir, la metodología de desarrollo ágil tiene como objetivo obtener feedback de calidad cuanto antes y para eso prioriza la comunicación por encima de otros elementos.

## La comunicación en el desarrollo de software

En un proyecto agile la comunicación debe fluir entre los interesados en el software (stakeholders) y el equipo de desarrollo.

En un primer momento, los stakeholders expresan sus necesidades, requisitos y objetivos sobre el software que se pretende crear. El equipo de desarrollo tiene que ocuparse de hacer preguntas para reducir las lagunas de información y reducir la ambigüedad y la imprecisión.

A medida que se hacen entregas, los stakeholders deben proporcionar feedback sobre las mismas, para que el equipo de desarrollo sepa si está entregando el producto deseado o debe realizar modificaciones. A su vez, el equipo tiene que expresar las dudas y dificultades que hayan surgido para recabar información que le ayude a resolverlas.

Además, el equipo tiene que coordinarse internamente, comunicando su nivel de progreso, las posibles fuentes de bloqueo o faltas de información y llegar a acuerdos para lograr la interoperabilidad entre diversas partes.

Pero tener feedback de los stakeholders (o de los propios integrantes del equipo) al final de cada sprint no es suficiente. Al fin y al cabo tenemos los requisitos definidos al comienzo de cada sprint y con ellos podemos diseñar tests que nos digan si el software los cumple, tests que podemos escribir y ejecutar cada vez que realizamos un cambio, lo que nos proporciona un feedback mucho más frecuente y, además, replicable. Por eso podemos decir que los tests son documentación.

Así que también tenemos un espacio de comunicación que está basado en el propio código: los tests. Por no hablar del hecho de que el código también comunica.

Esta es, básicamente, la definición de Test Driven Development en el contexto del desarrollo ágil. El testing no solo como una forma de verificar que el código que implementamos se ajusta a las demandas de los stakeholders, sino como una guía para escribirlo y una documentación sobre cómo funciona.

Y esto nos lleva al Bahavior Driven Design (y al artículo de Dan North)

## Comunicación a través de tests: el origen del BDD

[Lo que expone Dan North](https://dannorth.net/introducing-bdd/) es algo que muchas personas descubren cuando intentan introducir la metodología TDD y que se puede resumir en unas pocas preguntas, entre otras:

* ¿Por dónde empiezo?
* ¿Cuánto testing necesito?
* ¿Cómo nombrar los tests?
* ¿Qué es hacer que un test falle?

La respuesta de North a estas preguntas comienza de forma progresiva y es lo que vamos a resumir a continuación:

### Tests como documentación

**Los nombres de los tests deberían ser frases**. De hecho, usando herramientas adecuadas, los nombres de los métodos de los tests sirven como documentación inicial del código:

```php
public function testsFailsIfFileNotFound()
```

se puede convertir en:

```
Fails if file not found
```

Este cambio puede tener un gran efecto, hasta el punto de llevarnos a escribir los nombres de los métodos de los tests como frases que describen lo que esperamos que pase:

```php
public function testsItFailsIfExpectedFileIsNotFound()
```

se puede convertir en:

```
It fails if expected file is not found
```

### Test enfocados

Usar una plantilla para los nombres de los métodos como **ShouldDoThisThing** puede provocar un efecto de enfoque sobre testear una única cosa. North sugiere también que si resulta complicado nombrar el test con esa plantilla nos podría estar indicando que comportamiento pertenece a otra clase.

```php
public function testShouldFailIfExpectedFileIsNotFound()
```

se convierte en:

```
Should fail if expected file is not found
```


### Los tests expresivos ayudan cuando fallan

En general, los tests nos ayudan más cuando fallan, porque nos dicen cosas que no sabíamos. Si un test falla lo podemos identificar fácilmente por su nombre y nos puede dar varios tipos de información:

* Que el comportamiento definido en el test no está implementado, por lo que escribimos lo necesario.
* Que hemos cometido un error y dónde se ha producido, por lo que podemos corregirlo.
* El comportamiento que estamos testeando está en otra parte, así que movemos el test allí.
* El comportamiento que estamos testeando ya no es relevante, así que borramos el test.

### Hablemos de comportamientos y no de tests

Al ir introduciendo estas ideas el concepto mismo de test resulta cuestionable. Un test se asocia con comprobar si se cumple algo, mientras que Test Driven Development busca más bien definir los comportamientos de la unidad de software que estamos desarrollando. En cierto sentido, no podemos testear lo que no existe, pero sí podemos describir cómo queremos que funcione.

### Una herramienta para describir comportamiento

A finales de 2003, Dan North comenzó a desarrollar **JBehave**, como alternativa a **JUnit**, el framework de testing clásico de Java. Es decir, quería crear una herramienta para hacer TDD desde el planteamiento centrado de comportamientos que acabamos de definir, incluyendo la distinta forma de nombrar los test y caracterizar el comportamiento deseado del software.

No es que con **JUnit** no se pudiese hacer BDD, sino que el objetivo era tener una herramienta que favoreciese ese estilo de TDD.

En PHP, la herramienta equivalente es **PHPSpec**.

### Comportamiento y valor de negocio

La conexión entre código y valor de negocio es una de las claves del desarrollo ágil y lo interesante es que al adoptar este enfoque de TDD basado en el comportamiento surge de forma bastante natural una pregunta que reemplaza a la que nos hacíamos al principio. En lugar de "¿por dónde empiezo a testear?", la pregunta que nos hacemos es: "¿cuál es el siguiente comportamiento más importante que el sistema no tiene?" Y, por tanto: "¿cuál es el próximo comportamiento que debería describir?".

O lo que es casi lo mismo: ¿cuál es la siguiente característica que aportará más valor?

Sobre la relación entre desarrollo de software y valor de negocio te recomendaría leer [The Nature of Software Development, de Ron Jeffries](https://pragprog.com/book/rjnsd/the-nature-of-software-development).

### BDD se encuentra con DDD

Poco a poco, lo que parecía una herramienta técnica se va convirtiendo en otra que es útil para dialogar sobre el negocio. Si los nombres de los métodos de los tests son frases que expresan lo que la unidad de software debería hacer en términos de negocio, ¿no estamos hablando de usar el lenguaje ubicuo sugerido por Eric Evans en su propuesta de Domain Driven Design?

Así que, por una parte, BDD podría ser una herramienta que ayude a desarrollar el *lenguaje ubicuo* en un dominio. Pero para ello, se necesita también un cierto lenguaje ubicuo del proceso de análisis, un vocabulario y estructuras de uso común que faciliten la comunicación entre el equipo de desarrollo y los stakeholders.

Este lenguaje es Gherkin y con él se describen las historias de usuario en BDD, junto los criterios de aceptación que definen su comportamiento.

Gherkin es prácticamente lenguaje natural, aunque cuenta con una cierta estructura y un vocabulario preciso, que puede ser usado tanto por desarrolladores como por negocio. Las historias pueden ser construidas en conversación.

### Historias de Usuario ejecutables

El último paso del de BDD llega con las historias de usuario ejecutables.

Las Historias de Usuario son descripciones del valor de negocio que una cierta prestación del software aportaría a los stakeholders. No se limita a ser una descripción de la característica que se ha de implementar: es fundamental que exprese el valor que tiene.

Los criterios de aceptación de las historias, lo que va a demostrar que se han implementado, se definen en forma de escenarios en los que se describen las condiciones de partida, la acción que se aplica al sistema y los resultados que esperamos obtener: lo que viene siendo la estructura básica de los tests.

Si representamos con código esos pasos y los vinculamos con su formulación en Gherkin tenemos un test de aceptación de la historia que ha sido definido por negocio. Para esto, usamos en PHP usamos una herramienta como `behat`.

## Qué es un historia de usario

El artículo de referencia [What's in a story, de Dan North](https://dannorth.net/whats-in-a-story/) explica a fondo de dónde vienen y cómo se escriben las historias de usuario.

Las buenas historias nacen de una conversación. Posiblemente de una conversación entre stakeholders y analistas, pero también personal técnico, testers, etc, a partir de un objetivo que los primeros quieren lograr. Esta conversación sirve para definir una narrativa que nos sirva para definir de forma precisa qué se quiere conseguir, por qué, a quién beneficia y cómo vamos a saber que se ha conseguido.

### Estructura

BDD ofrece una estructura específica para las historias que garantiza que se tratan todos los elementos necesarios para llevarlas a cabo. Aunque la estructura en sí no es obligatoria, sí lo es la presencia de esos elementos.

La historia comienza con un **título** y ese título debería describir una actividad de la persona que usa el sistema.

Tras el título viene la **narrativa** de la historia y ésta debe incluir tres elementos clave:

* **Un rol**: que nos dice quién tiene interés en la historia y con quién hablar de la prestación que se desea desarrollar.
* **Una prestación**: lo que debería poder hacerse como resultado de implementar la historia.
* **Un beneficio**: el valor que esa prestación supone para las personas con ese rol.

La tercera parte de la historia debe ocuparse de decirnos cómo sabremos que se ha desarrollado la prestación deseada a través de criterios de aceptación, los cuales se expresan mediante escenarios.

Los escenarios deberían ser varios y su estructura es sencilla:

* **Título**: que se centra en lo que es diferente y particular de ese escenario.
* **Given**: que representa el contexto en que se realiza la acción.
* **When**: que representa la acción.
* **Then**: que representa el resultado (outcome) que debería producir la ejecución de la acción.

En conjunto, la historia debería tener un tamaño lo bastante pequeño para poder ser realizada en una iteración o sprint. Por tanto, si una historia necesita más de una iteración es que seguramente se puede dividir de algún modo en historias más pequeñas, enfocadas en algún aspecto concreto.

### Beneficios de tener una estructura

Utilizar una estructura como esta para definir las historias de usuario aporta muchos beneficios tanto a stakeholders como al equipo de desarrollo, pues no se trata solo de que las historias sirvan como documento de toma de requisitos. Este tipo de restricciones nos fuerza a pensar de una manera particular y a cuestionarnos nuestras ideas iniciales.

Tener que representar la definición de la prestación con esta estructura y cumplimentar todos los elementos hace reflexionar a los stakeholders sobre el por qué y para qué quieren lo que piden y el balance entre coste y beneficio que supone.

A su vez, nos fuerza como equipo a llegar a acuerdo concretos sobre qué es lo que define la prestación que se va a desarrollar en base a criterios operacionales y verificables. Esto hace que se puedan traducir a un lenguaje de programación y expresar en forma de tests de aceptación ejecutables.

Ya no se trata solo de indicaciones más o menos concretas sobre cómo debería comportarse el software, sino que podemos programar contra ellas y verificar en todo momento si las estamos cumpliendo o no. Es decir, inicialmente son tests de aceptación que fallan y, por tanto, nos obligan a realizar la implementación mínima y necesaria para pasen. Y así, a medida que vamos implementando escenarios, terminamos por desarrollar la prestación solicitada, lo que podemos demostrar porque los escenarios se ejecutan completamente.

### Un ejemplo

En artículos anteriores hemos estado trabajando con una historia de usuario en la que están presentes todos los elementos citados. En esos artículos hemos podido ver cómo la redacción definitiva de la historia forma parte del diálogo de todo el equipo y cómo pasamos de esta definición a una implementación.

La vuelvo a poner aquí:

```gherkin
Feature: Massively update product prices when needed
  As Sales Manager
  I want to be able to massively update product prices
  In order to invoice our customers with the latest prices

  Scenario: Update uploading a csv file with new prices
    Given There are current prices in the system
      | id  | name      | price |
      | 101 | Product 1 | 10.25 |
      | 102 | Product 2 | 14.95 |
      | 103 | Product 3 | 21.75 |
    And I have a file named "prices_update.csv" with the new prices
      | product_id | new_price |
      | 101        | 17        |
      | 103        | 23        |
    When I upload the file
    Then Changes are applied to the current prices
      | id  | name      | price |
      | 101 | Product 1 | 17.00 |
      | 102 | Product 2 | 14.95 |
      | 103 | Product 3 | 23.00 |

  Scenario: Update fails because an invalid file
    Given There are current prices in the system
      | id  | name      | price |
      | 101 | Product 1 | 10.25 |
      | 102 | Product 2 | 14.95 |
      | 103 | Product 3 | 21.75 |
    And I have a file named "invalid_data.csv" with invalid data
      | product_id | product_name |
      | 101        | Product 1    |
      | 103        | Product 2    |
    When I upload the file
    Then A message is shown explaining the problem
      """
      The file doesn't contain valid data to update prices
      """
    And Changes are not applied to the current prices
      | id  | name      | price |
      | 101 | Product 1 | 10.25 |
      | 102 | Product 2 | 14.95 |
      | 103 | Product 3 | 21.75 |

  Scenario: Update fails because a system error
    Given There are current prices in the system
      | id  | name      | price |
      | 101 | Product 1 | 10.25 |
      | 102 | Product 2 | 14.95 |
      | 103 | Product 3 | 21.75 |
    And I have a file named "prices_update.csv" with the new prices
      | product_id | new_price |
      | 101        | 17        |
      | 103        | 23        |
    And There is an error in the system
    When I upload the file
    Then A message is shown explaining the problem
      """
      Something went wrong and it was not possible to update prices
      """
    And Changes are not applied to the current prices
      | id  | name      | price |
      | 101 | Product 1 | 10.25 |
      | 102 | Product 2 | 14.95 |
      | 103 | Product 3 | 21.75 |
```

## Para finalizar

BDD es fundamentalmente una herramienta para favorecer una comunicación honesta y precisa entre negocio y el equipo de desarrollo que se apoya en la metodología TDD extendiéndola para incluir en el proceso a los stakeholders. Todo ello sin perder la formalización necesaria para que la definición de requisitos sea un instrumento que guíe el proceso de trabajo mediante tests que prueben que el objetivo se ha logrado.

Estos tests se definen en base al comportamiento deseado del software expresado en el lenguaje del negocio.




