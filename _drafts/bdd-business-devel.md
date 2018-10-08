---
layout: post
title: BDD. Tendiendo puentes entre negocio y desarrollo
published: true
categories: articles
tags: php bdd testing
---

Vamos a cambiar un poco de enfoque antes de continuar con otros aspectos y ejemplos técnicos del Desarrollo Guiado por Comportamiento. Nos queremos ocupar del BDD como herramienta de comunicación.

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

En general, el desarrollo ágil propone un modelo de trabajo iterativo e incremental: el proyecto se divide en pequeñas unidades completas que aportan valor al cliente y que se entregan en tiempos cortos. De este modo se consigue que las necesidades de diseño previo sean menores, a la vez que se obtiene feedback muy pronto y es posible adaptarse a los cambios en los requerimientos de forma rápida y sin incurrir en sobrecostes.

En cierto modo, cada iteración se lleva a cabo siguiendo un modelo waterfall, pero como las entregas al final del ciclo (lo que solemos llamar un *sprint*) son pequeñas se se obtienen beneficios en todas las fases porque cada etapa es mucho menos compleja que el proyecto total, el feedback se obtiene más rápidamente y es posible responder a los cambios de requisitos y a los fallos de diseño con celeridad y bajo coste.

Por resumir, la metodología de desarrollo ágil tiene como objetivo obtener feedback de calidad cuanto antes y para eso prioriza la comunicación por encima de otros elementos.

## La comunicación en el desarrollo de software

En un proyecto agile la comunicación debe fluir entre los interesados (stakeholders) en el software y el equipo de desarrollo.

En un primer momento, los stakeholders expresan sus necesidades, requisitos y objetivos sobre el software que se pretende crear. El equipo de desarrollo tiene que ocuparse de hacer preguntas para reducir las lagunas de información y reducir la ambigüedad y la imprecisión.

A medida que se hacen entregas, los stakeholders deben proporcionar feedback sobre las mismas, para que el equipo de desarrollo sepa si está entregando el producto deseado o debe realizar modificaciones. A su vez, el equipo tiene que expresar dudas y dificultades que hayan surgido para recabar información que le ayude a resolverlas.

Además, el equipo tiene que coordinarse internamente, comunicando su nivel de progreso, las posibles fuentes de bloqueo o faltas de información y llegar a acuerdos para lograr la interoperabilidad entre diversas partes.

Pero tener feedback de los stakeholders (o de los propios integrantes del equipo) al final de cada sprint no es suficiente. Al fin y al cabo tenemos los requisitos definidos al comienzo de cada sprint y con ellos podemos diseñar tests que nos digan si el software los cumple, tests que podemos escribir y ejecutar cada vez que realizamos un cambio, lo que nos proporciona un feedback mucho más frecuente y, además, replicadble.

Así que también tenemos un espacio de comunicación que está basado en el propio código: los tests.

Pero, puesto que tenemos los requisitos o especificaciones antes de escribir el código, ¿por que no escribir los tests antes del código y de este modo programar para llegar a cumplir con los tests y, en consecuencia, con los requisitos?

Esta es, básicamente, la definición de Test Driven Development en el contexto del desarrollo ágil. El testing no sólo como una forma de verificar que el código que implementamos se ajusta a las demandas de los stakeholders, sino como una guía para escribirlo.

Y esto nos lleva al Bahavior Driven Design (y al artículo de Dan North)

## Comunicación a través de tests: el origen del BDD

[Lo que expone Dan North](https://dannorth.net/introducing-bdd/) es algo que muchas personas descubren cuando intentan introducir la metodología TDD y que se puede resumir en unas pocas preguntas, entre otras:

* ¿Por dónde empiezo?
* ¿Cuánto testing necesito?
* ¿Cómo nombrar los tests?
* ¿Qué es hacer que un test falle?

La respuesta de North a estas preguntas comienza de forma progresiva y es lo que vamos a resumir a continuación:

### Tests como documentación

**Los nombres de los tests deberían ser frases**. De hecho, usando herramientas adecuadas, los nombres de los métodos de los tests sirven como documentación inicial del código:

```php
public function testsFailsIfFileNotFound()
```

se puede convertir en:

```
Fails is file not found
```

Este cambio puede tener un gran efecto, hasta el punto de llevarnos a escribir los nombres de los métodos de los tests como frases que describen lo que esperamos que pase:

```php
public function testsItFailsIfExpectedFileIsNotFound()
```

se puede convertir en:

```
It fails is expected file is not found
```

### Test enfocados

Usar una plantilla para los nombres de los métodos como **ShouldDoThisThing** puede provocar un efecto de enfoque sobre un único tests. North sugiere también que si resulta complicado nombrar el test con esa plantilla nos podría estar indicando que comportamiento pertenece a otra clase.

### Los tests expresivos ayudan cuando fallan

En general, los tests nos ayudan más cuando fallan, porque nos dicen cosas que no sabíamos. Si un test falla lo podemos identificar fácilmente por su nombres y nos puede dar tres tipos de información:

* Que hemos cometido un error y dónde, por lo que podemos corregirlo.
* El comportamiento que estamos testeando está en otra parte, así que movemos el test.
* El comportamiento que estamos testeando ya no es relevante, así que borramos el test.

### Hablemos de comportamientos y no de tests

Al ir introduciendo estas ideas el concepto mismo de test resulta cuestionable. Un test se asocia con comprobar si se cumple algo, mientras que Test Driven Development busca más bien definir los comportamientos de la unidad de software que estamos desarrollando. En cierto sentido, no podemos testear lo que no existe, sino que podemos describir cómo queremos que funcione.

### Una herramienta para describir comportamiento

A finales de 2003, Dan North comenzó a desarrollar JBehave, como alternativa a JUnit. Es decir, quería crear una herramienta para hacer TDD desde el planteamiento centrado de comportamientos que acabamos de definir.

En PHP, la herramienta equivalente es **phpspec**.

### Comportamiento y valor de negocio

La conexión entre código y valor de negocio es una de las claves del desarrollo ágil y lo interesante es que al adoptar este enfoque de TDD basado en el comportamiento surge de forma bastante natural una pregunta que reemplaza a la que nos hacíamos al principio. En lugar de "¿por dónde empiezo a testear?", la pregunta que nos hacemos es: "¿cuál es el siguiente comportamiento más importante que el sistema no tiene?".

O lo que es casi lo mismo: ¿cuál es la siguiente característica que aportará más valor?

### BDD se encuentra con DDD

Poco a poco, una herramienta técnica se va convirtiendo en una herramienta para hablar sobre el negocio. Si los nombres de los métodos de los tests son frases que expresan lo que la unidad de software debería hacer en términos de negocio, ¿no estamos hablando de usar el lenguaje ubicuo sugerido por Eric Evans en su propuesta de Domain Driven Design?

Así que, por una parte, el BDD podría ser una herramienta que ayude a desarrollar el lenguaje ubicuo en un dominio. Pero para ello, se necesita también un cierto lenguaje ubicuo del proceso de análisis, un vocabulario y estructuras de uso común que faciliten la comunicación entre el equipo de desarrollo y los stakeholders.

Este lenguaje es Gherkin y con él se describen las historias de usuario en BDD, junto los criterios de aceptación que definen su comportamiento.

Como Gherkin es un lenguaje natural, sólo que cuenta con una cierta estructura y un vocabulario preciso, puede ser hablado tanto por desarrolladores como por negocio. Las historias pueden ser construidas en conversación.

### Historias de Usuario ejecutables

El último paso del desarrollo de BDD llega con las historias de usuario ejecutables. Los criterios de aceptación de las historias se definen como escenarios en los que se describen las condiciones de partida, la acción que se aplica al sistema y los resultados que esperamos obtener.

Si representamos con código esos pasos y los vinculamos con su formulación en Gherkin tenemos un tests de aceptación de la historia, que ha sido definido por negocio.



## Gherkin a fondo



