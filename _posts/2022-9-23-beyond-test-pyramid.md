---
layout: post
title: Más allá de la pirámide de tests
categories: articles
tags: tdd testing good-practices
---

Un repaso a la(s) pirámide(s) de tests y un vistazo al testing minimalista de Sandi Metz.

Soy muy fan de las charlas de Sandi Metz y, de vez en cuando, reviso alguna. Me ayudan mucho a clarificar y consolidar conceptos. Por ejemplo, tras volver a ver esta sobre [tests unitarios](https://www.youtube.com/watch?v=qPfQM4w4I04) recuperé una idea que llevaba un tiempo rumiando acerca de la pirámide de los tests y qué testear, especialmente en el contexto de TDD.

## Hay pirámides en mi cabeza

La pirámide de tests surge en el ámbito de la QA, como una forma de visualizar la idea de que existen diversas categorías de tests, que estas deben estar presentes para tener una cobertura completa de una aplicación y, además, sugiere cuál es la proporción en la que cada categoría debería estar presente.

Siempre decimos que TDD no es QA, pero usan la misma herramienta básica: los tests. Por eso, merece la pena preguntarse si la pirámide puede ser útil para ayudarnos en el proceso de desarrollo basado en TDD. Spoiler: un poco sí, pero no demasiado.

### La pirámide, versión 1

La pirámide original es de Mike Cohn y Lisa Crispin, (y fue publicada en el libro [Succeding with Agile](https://www.amazon.es/Succeeding-Agile-Software-Development-Signature/dp/0321579364)) y organiza los tests en tres categorías:

* UI tests
* Service tests
* Unit tests

Los **UI tests** testean la aplicación holísticamente, desde el punto de vista del usuaria. De este modo, se hacen tests para ver si las acciones que podría querer llevar a cabo la usuaria funcionan correctamente. Por su naturaleza son lentos y caros, requiriendo mucha preparación y uso de dependencias, por lo que deberían ser pocos. Por ejemplo, sólo se testearían flujos perfectos.

Los **Service tests** testean la aplicación un poquito más adentro, quitando la capa de interfaz de usuario. En algunas arquitecturas esto significaría testear los casos de uso. Estos tests ejercitan partes de la aplicación que realizan un comportamiento concreto, por lo que tienen que hacer uso de tecnologías específicas (bases de datos, etc.). Son algo más económicos y rápidos que los tests de UI, por lo que puede haber más cantidad de esta categoría. Esencialmente, testean lo mismo que los tests de UI, pero al ser más económicos nos permiten examinar, por ejemplo, flujos de error.

Finalmente, los **Unit tests** testean las unidades de software aisladamente, reemplazando componentes que introducen coste (como bases de datos, etc.), por mocks. De este modo, los tests son, en teoría, muy rápidos y fáciles de escribir, por lo que podemos poner muchos para cubrir toda la casuística. Estos tests nos aportan resolución a la hora de diagnosticar un problema. Idealmente, los tests fallarán en todas las capas, pero únicamente la capa unitaria nos puede decir en dónde está la circunstancia que hace fallar el test.

En [The forgotten layer of the test automation pyramid](https://www.mountaingoatsoftware.com/blog/the-forgotten-layer-of-the-test-automation-pyramid), el propio autor explica brevemente la pirámide.

### La pirámide, versión 2

En algún momento se empezaron a introducir algunos cambios en la pirámide. Los podemos ver en [este artículo de BrowserStack](https://www.browserstack.com/guide/testing-pyramid-for-test-automation) o [en este otro, sobre el mismo tema](https://semaphoreci.com/blog/testing-pyramid).

Podemos ver que ahora hablamos de **End to End** en lugar de **UI tests**, así como de **Integration tests**, en lugar de **Service tests**. ¿Qué significan o qué aportan estos cambios?

En general, **End to End** y **UI tests** significan lo mismo en el contexto original de la pirámide. Sin embargo, a medida que el desarrollo de las aplicaciones está tendiendo a un modelo en el que la interfaz de usuario está separada del resto de la aplicación y se comunica con esta por medio de una API, es posible pensar en que **End to End** se refiere a estas API como puntos de entrada y salida de la aplicación. Básicamente, lo que en la definición original serían los **Service tests**.

El segundo cambio, de **Service tests** a **Integration tests** ya requiere un salto mayor. 

En el modelo original, los **Service tests** se ejecutarían contra estas API, o bien los casos de uso que se ejecutan en respuesta a acciones en la interfaz de usuario. Además, usarían las dependencias externas necesarias.

Pero entonces, ¿Qué son los **integration tests**? La definición habitual es que los tests de integración verifican que los distintos elementos del software se comunican correctamente. Sin embargo, esta es una definición bastante poco útil. ¿Los test de integración incluyen o no dependencias externas? Y si no incluyen dependencias externas que habría que doblar, ¿qué los diferencia de los tests unitarios?

Un gran problema que tiene esta capa intermedia es que parece carecer de sentido. Al fin y al cabo, los tests **End to End** y los **Unit tests** cubren los comportamientos testeados en ella.

### La pirámide, versión 3
 
[Una tercera versión de la pirámide de tests, propuesta por Alister Scott](https://alisterbscott.com/2016/05/18/ama-the-eye-above-my-testing-pyramid/) intenta dar mayor importancia a la capa intermedia, subdividiéndola en tres áreas.

Según el artículo [The practical test pyramid](https://medium.com/tide-engineering-team/the-practical-test-pyramid-c4fcdbc8b497) estas capas serían:

* **API tests**, tests de contratos entre la API del sistema bajo tests y sus consumidores o servidores.
* **Integration tests**, que serían tests de unidades en los que no se doblan las dependencias externas.
* **Component tests**, que serían los Service Test de la pirámide original, testeando a través de las capas de la arquitectura.

Con todo, tengo algunas dudas sobre esto tras leer [este artículo de Alister Scott tratando de explicar las diferencias entre Component y Unit tests](https://alisterbscott.com/tag/component-testing/)

Además de eso, Scott acentúa la importancia del testing manual y exploratorio que coloca en la cúspide de la pirámide.

## La sociabilidad de los tests

Por si la pirámide de tests no se estaba complicando lo suficiente, hablemos un poco de los tests unitarios.

La capa de tests unitarios también incluye cierta complicación. Al fin y al cabo, ¿a qué llamamos _unidad de software_? La primera aproximación suele ser considerar una unidad a una clase o una función. En ese caso, el problema del test es verificar el comportamiento de esa unidad de forma aislada de posibles colaboradores. Pero, ¿es eso necesario? Es decir, ¿realmente deberíamos aislar completamente la unidad bajo tests de sus colaboradores?

Jay Fields introdujo los conceptos de tests unitarios solitarios y sociales en su libro [Working Effectively with Unit Tests](https://leanpub.com/wewut).

Los tests solitarios son aquellos en los que la unidad de software es testeada en aislamiento de sus posibles colaboradores que son sustituidos por dobles. Los tests sociales, por su parte son aquellos en los que los colaboradores no son sustituidos por dobles. 

Pero, ¿esto no eran tests de integración? No, porque para que los tests sean unitarios, no deberíamos usar colaboradores que toquen otros sistemas (bases de datos, API, etc.). Los tests unitarios sociales se hacen sobre unidades compuestas que no tienen dependencias externas. Y, en caso necesario, se usarían dobles de tests.

## Los dobles definen fronteras

Las diversas categorías de tests se definen, en buena parte, por la forma en los dobles marcan su frontera. O, dicho de otro modo, en cada categoría de test usamos dobles para todo aquello que queda fuera de esa frontera.

En los **tests unitarios** los dobles se usan para reemplazar los servicios externos de los que depende nuestro código, ya sea la base de datos, el sistema de archivos, el reloj del sistema, una API externa, etc. Estos tests pueden ejercitar unidades simples o compuestas. Por ejemplo, un agregado de dominio no tiene dependencias fuera del dominio, pero está compuesto por diversas entidades y su testeo será unitario.

En los **tests de integración** siempre testeamos unidades compuestas que tocan sistemas externos. Los dobles reemplazan servicios externos que no están bajo nuestro control directo, como podría ser una API externa a la que debemos llamar. Sin embargo, usaríamos recursos reales como la base de datos, aunque sea una instancia específica para el entorno de testing.

Los **tests de componentes** ejercen todas las capas de la arquitectura y testean el equivalente de casos de uso, excluyendo los elementos de interfaz de usuario o, en general, los elementos de contacto con el mundo exterior. Estos tests atacarían los puntos de entrada de la aplicación. En una arquitectura hexagonal, estos tests ejercitarían la aplicación usando los _driver ports_ de la misma.

Los **tests de API** son tests que verifican que se cumplen los contratos que permiten a la aplicación hablar con otras a través de sus respectivas API. Se dobla el sistema externo, generando stubs a partir de los contratos.

Finalmente, los tests **End to End**, verificarían el comportamiento de la aplicación a través de la interfaz de usuario. De nuevo, tenemos que doblar aquellas dependencias que no controlamos, como podrían ser servicios de terceros.

## Qué testear

En este punto insertamos la charla de Sandi Metz porque justamente ayuda a responder a esta pregunta. Lo hace centrándose en el nivel unitario, pero creo que lo podemos trasladar a otros niveles de abstracción.

Metz lo estructura en dos dimensiones, basándose en dos premisas:

* El paradigma de orientación a objetos, objetos que colaboran pasándose mensajes.
* El principio de separación entre comandos y consultas.

De este modo tenemos:

* Los mensajes pueden ser entrantes (mensajes recibidos por el objeto), internos (el objeto se pasa mensajes a sí mismo) y salientes (enviados a otros objetos)
* Los mensajes pueden ser consultas (elicitan una respuesta que podemos capturar) o comandos (producen un efecto que podemos observar)

Esto nos permite hacer la tabla de "Test Unitario Minimalista", en palabras de la autora:

| Mensaje  |            Consulta             |                  Comando                  |
|:--------:|:-------------------------------:|:-----------------------------------------:|
| Entrante |   Aserción sobre la respuesta   |     Aserción sobre efecto observable      |
| Interno  |             No test             |                  No test                  |
| Saliente | No test (stub define escenario) | Expectativa sobre la llamada (mock o spy) |

### El papel de los dobles de tests

¿A quién se dirigen los mensajes salientes? Pues a los colaboradores de la unidad a través de cuya interfaz estamos testeando. En algunos casos significa que estaremos utilizando dobles de tests.

* Las consultas a los colaboradores no se testean. Si estamos usando un doble de test será un _stub_, es decir, una variedad del colaborador que devuelve una respuesta fija, pre-programada. De este modo, verificamos que la unidad bajo test sabe como manejar los diferentes tipos de respuestas que puede esperar de ese colaborador.
* Cuando se envían comandos a un colaborador, no testeamos ningún efecto, simplemente nos aseguramos de que se envía el mensaje fijando una expectativa en un _mock_ o un _spy_, o sea, una variedad del colaborador capaz de saber si está siendo usado de una manera concreta.

### ¿Qué pasa en otros niveles?

¿Sería posible aplicar este mismo enfoque minimalista en otros niveles de testing? Particularmente me interesa desde el punto de vista de la práctica de outside-in TDD, en la que comienzas a partir de un test que puede ser end to end o de componente. Desde el punto de vista del test, el sistema es una caja negra.

Los mensajes entrantes e internos están claros. Se haría exactamente igual. Para los mensajes entrantes, hacemos aserciones sobre la respuesta o sobre efectos que podamos observar (Por ejemplo: ¿Se ha almacenado esta información en la base de datos?).

Los mensajes internos no se testean.

Pero, ¿qué pasa con los mensajes salientes? Pues básicamente lo mismo. Los mensajes salientes de la aplicación irán dirigidos a sistemas externos que tendremos que sustituir por dobles y, por tanto, serán stubs (consultas) o mocks (comandos).

| Mensaje  |            Consulta             |                  Comando                  |
|:--------:|:-------------------------------:|:-----------------------------------------:|
| Entrante |   Aserción sobre la respuesta   |     Aserción sobre efecto observable      |
| Interno  |             No test             |                  No test                  |
| Saliente | No test (stub define escenario) | Expectativa sobre la llamada (mock o spy) |

Pero, ¿y si mi sistema forma parte de una arquitectura de micro-servicios y mis comandos salientes en realidad son eventos?

Pues básicamente tenemos el mismo modelo de orientación a objetos: paso de mensajes entre objetos (servicios), de modo que para verificar comandos salientes lo que compruebo es que el sistema bajo test publica el evento deseado.

| Mensaje  |            Consulta             |              Comando               |
|:--------:|:-------------------------------:|:----------------------------------:|
| Entrante |   Aserción sobre la respuesta   |  Aserción sobre efecto observable  |
| Interno  |             No test             |              No test               |
| Saliente | No test (stub define escenario) | Aserción sobre el evento publicado |
