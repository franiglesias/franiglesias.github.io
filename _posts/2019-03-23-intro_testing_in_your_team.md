---
layout: post
title: Como introducir o aumentar el testing en tu aplicación
categories: articles
author: [fran]
tags: testing good-practices
---

Supongamos que te planteas introducir testing en un proyecto que no lo tiene o que no está suficientemente testeado.

En el podcast [Programar es una mierda](https://www.programaresunamierda.com/) [han entrevistado a Mavi Jiménez](https://www.programaresunamierda.com/2019/03/episodio-44-paparajotest.html), que es nuestra Lead en [HolaluzEng](https://twitter.com/holaluzeng?lang=es), y han estado hablando de testing[^fn3] y este artículo ha surgido en parte de ahí.

[^fn3]: Por cierto, ha salido a colación este blog, aunque no sé por qué.

Una de las cosas que me llaman la atención es que el testing no es una práctica tan extendida como, quizá, debería. No voy a entrar en las razones, pero me he puesto a pensar en cómo un equipo de desarrollo podría introducir o mejorar su testing de una manera sencilla y efectiva.

Para ello, me he inspirado en el modo en que lo hemos hecho en el equipo de Backend PHP de Holaluz y cómo hemos incrementado nuestra cobertura, número de tests, calidad de los mismos y protección de nuestro código en el último año, sin que ello supusiera un sobre esfuerzo o un proyecto *ad-hoc*.

## Análisis de situación

La primera tarea en la que nos centraremos es conocer la situación real del testing de un proyecto. Puede que no haya ni un solo test. O puede que ya haya un cierto nivel de testeo. Y, en este caso, la calidad del mismo puede oscilar entre dudosa y aceptable.

Si no hay tests, el trabajo está claro: decidirse por un framework de testing que nos ayude en la tarea, instalarlo e investigar por dónde empezar.

Si ya existen tests, lo suyo es ejecutarlos y ver qué pasa. Podrían ocurrir varias cosas:

* Los tests funcionan bien, se ejecutan y pasan. Es un buen punto de partida.
* Los tests se ejecutan, pero algunos no pasan. En ese caso toca intentar arreglarlos o, si por algún motivo esto resulta complicado, eliminarlos y quedarse con los que pasan.
* Los tests ni siquiera se pueden ejecutar o si lo hacen fallan todos. Esto es síntoma de que los intentos de test que se hicieron en ese código son seguramente bastante antiguos y se abandonaron. Es muy posible que tengas que eliminar todo y empezar de cero.

En cuanto al framework de test, posiblemente lo mejor es empezar con [PHPUnit](https://PHPUnit.de) que no deja de ser la herramienta de testing estándar en el mundo PHP, pero no descartaría tampoco [codeception](https://codeception.com), al menos para ciertas áreas.

### Cultura de testing

Paralelamente, conviene plantearse varias cosas como equipo:

* Por una parte, tomar una postura común ante el estado del testing en el proyecto y las líneas de actuación que se van a seguir.
* Por otra, evaluar las posibles necesidades de formación ya que el rodaje de cada persona puede ser muy diferente. Si no hay experiencia previa de testing, necesitaremos dedicar algunas sesiones de formación.

El objetivo será favorecer una cultura orientada a la calidad del software que se concrete en que toda subida a producción vaya respaldada con tests.

### Análisis de cobertura

Si ya existe una cierta base de tests lo conveniente ahora es ejecutarlos con una medida de la cobertura.

El índice de cobertura de los tests es una métrica fácil de obtener, pero también es fácil de interpretar mal. Nosotros la utilizaremos para empezar a entender el estado del proyecto. Nos indica el porcentaje de líneas del código que son ejecutadas por los tests. 

Un valor alto nos permite tener una confianza alta en que el comportamiento del código es el que dicen los tests. Eso no nos libra de posibles errores ya que puede haber casos no contemplados o simplemente podríamos haber implementado mal las reglas de negocio por falta de información, pero nos permite hablar de lo que hace la aplicación con un margen alto de seguridad.

Un valor bajo, por el contrario, no nos permite tener esa certeza. La parte no ejecutada de los tests es el lugar en el que se esconden los bugs y los errores que pueden dar lugar a problemas con nuestra aplicación.

Nos interesa obtener un índice global, así como en algunas grandes divisiones del software. Por ejemplo: en las capas de dominio, aplicación e infraestructura. O bien en otras divisiones que tengan sentido para el proyecto.

## Primeros objetivos

Si no estamos en ese nivel, nuestro primer objetivo sería conseguir un índice de cobertura del 50-60% en todas las divisiones que estemos considerando.

Si estamos en ese nivel o por encima, la confianza en el código será alta, aunque todavía podemos mejorarla.

En cualquier caso, el análisis de cobertura es una buena herramienta para identificar las ramas del flujo de ejecución que no están bajo test y que, por tanto, necesitan más atención.

### Cómo priorizar

Cuando la cobertura de tests es baja puede invadirnos una cierta sensación de agobio ante la tarea que nos espera. ¿Por dónde empezar a trabajar y cómo? ¿Debería tener tareas o historias que sean solo técnicas para poder incrementar el nivel de testing?

La cuestión es priorizar y la mejor forma de hacerlo es alineándonos con negocio.

Así, la primera prioridad será aumentar la cobertura en la capa de dominio, o la equivalente en tu código. La razón es bastante obvia: el dominio es aquello a lo que nos dedicamos, lo que define nuestro negocio y es lógico asegurarnos de que funciona bien. 

Además, la capa de dominio si está bien ejecutada no tendría dependencias, lo que la convierte en más fácil de testear. Esto genera una excelente relación entre el coste de testear y el beneficio que vamos a obtener.

A continuación, la prioridad será la capa de aplicación, en la que se definen los casos de uso y los servicios de la aplicación. En esta capa tendremos que usar muchos dobles para verificar cómo los casos de uso orquestan la interacción de los servicios y los elementos del dominio.

La parte menos prioritaria sería la de infraestructura. Pero no hay que confundir menos prioridad con ignorarla por completo.

A este respecto, he visto muchas veces la idea de que no se testea la capa de infraestructura y esto es un error. Obviamente no testeamos los *vendors*, es decir el código que no es nuestro pero que usamos para poder implementar esa capa. Lo que sí debemos testear son los **adaptadores** que sí son código nuestro.

Se puede decir que priorizaremos siguiendo la regla de dependencia.

### Prioridades técnicas

En el aspecto técnico podemos optar por dos enfoques: priorizar los **tests unitarios** o bien priorizar tests **end to end**, que verifiquen la aplicación desde sus puntos de entrada. Veamos razones para cada enfoque:

**Los tests unitarios** nos permiten trabajar de manera rápida y enfocada. Además, nos ayudarán a encontrar problemas de diseño relativamente fáciles de arreglar porque se encuentran circunscritos a unidades relativamente pequeñas.

En cuanto a la cobertura, los tests unitarios nos hacen avanzar lentamente en cuanto al índice global, puesto que cada test ejecuta pocas líneas. Sin embargo, sí que hacen que la cobertura sea más sólida en tanto que cubrimos más caminos de ejecución y éstos se recorren más veces.

**Los tests end-to-end**, que muchas veces se llaman funcionales [^fn1], nos permitirán avanzar muy rápidamente en cuanto a cobertura. Son más difíciles de montar porque necesitarás fixtures y también serán más lentos por la misma razón. Por otro lado, testear de este modo se contradice un poco con la propuesta de priorización que hacíamos más arriba.

[^fn1]: Personalmente, creo que es un error denominarlos funcionales, ya que tests funcionales son todos los tests que verificar el comportamiento de una unidad de software.

Una de las ventajas de este enfoque es que puede funcionar mejor en aquellas bases de código que no están bien organizadas, ayudándonos a tender una red de seguridad para intervenir en el código.

## Organización del trabajo

La primera recomendación puede parecer contradictoria, pero no debería haber tareas o "historias de usuario" dedicadas al testing[^fn2]. Los motivos son varios y los principales, para mí, serían:

[^fn2]: Y tampoco al refactoring. Tanto el testing como el refactoring son parte de nuestro proceso como developers.

* Las historias de testing no aportan valor de negocio *per se*. El testing es fundamental en una auténtica metodología ágil y, de hecho, un código bien testeado es mucho más valioso para negocio que uno que no tiene tests. A la larga, el código testeado hace que los equipos desarrollen nuevas *features* mucho más rápidamente y con menos probabilidad de errores.
* Una historia de testing en general es muy difícil de delimitar en objetivos y en el tiempo. Si ya es complicado estimar una historia de usuario, imagínate estimar una de testing. Una medida de cobertura no nos sirve de gran cosa tampoco.

Pero si estamos de acuerdo con esto, entonces: ¿cuándo testeamos?

### En las Historias de Usuario

Lo primero es introducir el testing como parte de la *Defintion of done* de una Historia de Usuario. Es decir, *una entrega se hace con testing o no se hace*. E igualmente las subtareas técnicas no deberían incluir la palabra test o refactor en ellas.

Esto, además, nos ayuda a definir el ámbito del testing. Idealmente, el testing debería permitirnos afirmar justamente que la entrega que hacemos es lo que se nos pedía en la historia. Como regla práctica, podríamos decir que todo código que toquemos durante la realización de la tarea debería estar cubierto por tests.

Y es aquí donde aplicamos las prioridades que mencionamos más arriba.

### En los Bugs

Los bugs nos proporcionan una buena oportunidad para incrementar el nivel de testing de nuestra aplicación mediante TDD, prestando atención a casos particulares no cubiertos anteriormente.

La mejor forma de empezar es escribir uno o más tests que, al fallar, reproduzcan el bug. Nuestro trabajo, entonces, será hacer pasar esos tests, con lo que resolveremos el fallo y demostraremos además que está solucionado.

El *bonus point* es que estos tests nos proporcionan mejor cobertura de casos.

### Dedicación exclusiva

Si disponemos de más tiempo, entonces quizá podamos invertir algo del mismo en trabajar directamente haciendo nuevos tests de partes del código que hayan podido quedar peor tratadas.

## Beneficios

Una de las consecuencias de trabajar de esta forma es que seguramente nos encontraremos con partes de código ya bien testeadas. El hecho de volver sobre un mismo área de código una y otra vez nos dice que esa parte es importante para el negocio pues es donde se añaden, afinan o eliminan características.

El hecho de volver sobre ellas nos permite mejorar la calidad tanto del código como de los tests y avanzar mucho más rápidamente.

## Cuando es difícil testear

Por lo general, si una parte de nuestro código es difícil de testear, nos está indicando un problema de diseño. Habitualmente se tratará de clases con demasiadas responsabilidades y que deberíamos separar, que tienen dependencias ocultas o que tienen dependencias de implementaciones concretas que necesitan ser invertidas.

Solucionar estos problemas para poder testear mejor también ayudará a incrementar la calidad de nuestro código en general y nos facilitará el desarrollo futuro.

## ¿Cuánto tiempo se necesita para alcanzar un buen nivel?

No es una cuestión de tiempo. Lo más importante es el compromiso del equipo y tener un enfoque y objetivos realistas. Se trata de desarrollar una cultura de calidad.

Lo ideal, como señalamos antes, es incluir el testing y la mejora del código en la definición de terminada de las tareas, de modo que el testing forme parte de la rutina de trabajo. De este modo se avanza con una velocidad más o menos sostenida y se pueden conseguir resultados positivos observables en dos o tres meses con poco esfuerzo y, a partir de ahí, seguir creciendo de forma sostenida.




