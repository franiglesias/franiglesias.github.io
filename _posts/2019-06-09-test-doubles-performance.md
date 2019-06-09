---
layout: post
title: La performance de los métodos para crear test doubles
categories: articles
tags: testing
---

Hace algunos meses estuve haciendo algunos análisis sobre la performance de los diversos métodos para crear test doubles y cómo impactan en nuestras suites de tests.

La suite de tests de Holaluz ha crecido mucho y me preocupa un poco cómo compaginar el crecimiento en número de tests y cobertura, manteniendo un tiempo de ejecución razonable.

Una suite de test que tarda mucho en ejecutarse pierde utilidad porque el feedback no llega tan rápido como se desea y comienza a verse como un estorbo más que una herramienta necesaria en el trabajo.

## Velocidad de los tests según la metodología para crear dobles

Son muchos los factores que influyen en el tiempo de ejecución de una suite de tests y, de momento, voy a centrarme en un aspecto concreto: los métodos para generar test doubles. En varios artículos del blog hemos hablado de ellos. Fundamentalmente me interesaba comprar los dobles generados con librerías de mocking frente a usar las clases originales o instanciar clases anónimas como dobles.

Después de unos primeros análisis un tanto improvisados, los resultados fueron un tanto inesperados, ya que el método más eficiente resultó ser la creación de dobles nativos de **phpunit** (los que se obtienen con `createMock`), con bastante diferencia sobre usar las clases originales y sobre los dobles usando la librería **prophecy**.

Un ejemplo de los resultados obtenidos fue este:

| Method                    | Time (ms) |  Memory (MB) |
|:--------------------------|----------:|-------------:|
| testMockBuilderExample    |        88 |        10.00 |
| testProphecyExample       |       206 |        26.00 | 
| testRealObjectExample     |       269 |        26.00 | 
| testAnonymousClassExample |       287 |        26.00 |

Para alguien bastante fan de **prophecy** fueron resultados bastante sorprendentes y un tanto decepcionantes. Sin embargo, reescribí algunos tests que eran particularmente lentos en mi entorno para ver qué efecto tendría cambiar el framework de mocking:

| TestCase   | Prophecy (ms) | Phpunit (ms)|
|:-----------|--------------:|------------:|
| TestCase 1 |          1652 |         377 |
| TestCase 2 |         35774 |         860 |
| TestCase 3 |         74899 |       11682 |

La mejora es muy grande, en algunos casos escandalosamente grande, por lo que empezamos a escribir los tests con los dobles nativos, así como a migrarlos de un framework a otro cuando teníamos oportunidad.

## Un análisis más profundo

Con todo, no quedé muy convencido de este primer análisis. No me cuadraba del todo que crear dobles con una librería fuera más eficiente que las clases originales, por lo menos en casos de Value Objects y otros objetos sin comportamiento. Seguramente en objetos con comportamiento o cuya ejecución pudiese ser lenta, como repositorios, habría ganancias usando dobles, pero no en objetos que residen en memoria.

Finalmente, he tenido tiempo para preparar un entorno más robusto y flexible con el que poder comparar la velocidad de ejecución y consumo de memoria de un conjunto de TestCases arbitrario. [Este entorno lo puedes examinar en github](https://github.com/franiglesias/tb-doubles). No voy a entrar en detalles, que se pueden ver en el código, pero la idea es poder ejecutar repetidas veces varios TestCases y comparar el tiempo necesario para ejecutarlos, así como el consumo de recursos o, al menos, una aproximación. En principio, los tests para probar deben llamarse 'test', aunque es algo que espero cambiar en una próxima iteración.

Por tanto, he podido reproducir mi análisis original, obteniendo nuevos resultados y de mejor calidad.

### Clases simples

El primer ejemplo que probé es una clase simple que almacena un valor, una especie de value object, sin apenas comportamiento.

Las clases testeadas y los tests pueden verse en el [repositorio](https://github.com/franiglesias/tb-doubles).

Los resultados han sido estos, ejecutando los test 250 veces:

```
Test Doubles creation methods (250 times)
=========================================

 Method                              Time (s)  Memory (KB)

-----------------------------------------------------------
 AnonymousClassTest.................   0.1980         2.61
 OriginalClassTest..................   0.2008         2.28
 NativeMockTest.....................   0.5319       421.48
 ProphecyMockTest...................   4.0248      4759.34
```

Para empezar, los resultados parecen más consistentes con lo esperado. La instanciación de la clase bajo test es el método más eficaz, mientras que la instanciación de una clase anónima que extiende de ella es marginalmente más lenta y consume un poco más de memoria. Pero, en términos de ejecución, serían intercambiables.

A cierta distancia, pero no demasiada, los dobles nativos de **phpunit** son un poco más lentos y consumen más recursos. Sin embargo, ofrecen un buen compromiso entre el coste en performance y la complejidad que puede suponer en no pocas ocasiones instanciar la clase real, especialmente si la necesitamos como dummy o sólo necesitamos hacer stub de uno o dos métodos.

Finalmente, generar los dobles con **prophecy** parece ser el método más costoso en tiempo y en memoria. Lo sorprendente es la gran diferencia con respecto a cualquiera de los otros métodos.

### Simulando comportamiento

Para simular comportamiento he puesto una clase bastante sencilla con un cálculo muy simple.

Los resultados están en la línea de los anteriores, siendo el método más eficiente el de usar una instancia de la clase nativa como doble. Por su parte, el doble creado con **prophecy** sigue siendo el menos eficiente.

```php
Test Doubles with behaviour creation methods (250 times)
========================================================

 Method                              Time (s)  Memory (KB)

-----------------------------------------------------------
 OriginalSampleBehaviourTest........   0.2589      1275.10
 AnonymousSampleBehaviourTest.......   0.3083      3991.28
 NativeMockSampleBehaviourTest......   0.6499       617.43
 ProphecyMockSampleBehaviourTest....   4.4263      4833.48

```

En este ejemplo, hemos añadido un `sleep` de 1 segundo para simular un comportamiento complejo, que requiere mucho más tiempo.

Los resultados son los esperables y, en esta ocasión, los frameworks de creación de dobles ganan la partida con gran diferencia, mientras que la instancia real de la clase requiere una cantidad desorbitada de tiempo para un test. Los dobles creados con la un framework no ejecutan el comportamiento lento, por eso los usamos.

```
Test Doubles with behaviour creation methods (250 times)
========================================================

 Method                              Time (s)  Memory (KB)

-----------------------------------------------------------
 NativeMockSampleBehaviourTest......   0.6296       532.71
 ProphecyMockSampleBehaviourTest....   4.1648      3251.20
 OriginalSampleBehaviourTest........ 250.2742         2.00
 AnonymousSampleBehaviourTest....... 251.3103       189.60
```

Comparando los dos frameworks que hemos probado, se puede ver que **prophecy** es menos eficiente que el mock builder nativo de **phpunit**, tanto en velocidad, pues tarda casi siete veces más, como en consumo de memoria, pues require unas seis veces más.

Por supuesto, una forma alternativa y económica de generar dobles usando las clases nativas es mediante clases anónimas sobreescribiendo los métodos implicados en el test para que no ejecuten el comportamiento original. En ese caso, las cosas cambian bastante, ya que la clase anónima con los métodos sobreescritos vence a todos los demás métodos.

Los datos no son comparables a los de las otras tablas porque en este ejemplo hemos repetido los test sólo 50 veces en lugar de 250.

```
Test Doubles with behaviour creation methods (50 times)
=======================================================

 Method                              Time (s)  Memory (KB)

-----------------------------------------------------------
 AnonymousSampleBehaviourTest.......   0.1111       189.29
 NativeMockSampleBehaviourTest......   0.2525       523.21
 ProphecyMockSampleBehaviourTest....   1.1069      1902.80
 OriginalSampleBehaviourTest........  50.0740         2.00
```

## Conclusiones

Aunque todavía quedan muchas mejoras para este entorno de análisis, creo que puede ser útil para optimizar las suites de test y obtener alguna información con la que fundamentar las decisiones que se tomen para ello.

De entrada, hay que destacar las ventajas de usar instancias de las clases nativas en lugar de dobles: conforman la opción más rápida y la que menos memoria consume. Esto aplica perfectamente para Value Objects, DTO, Events, Commands, objetos-parámetro y también Entidades.

Cuando necesitamos doblar clases abstractas podemos usar fácilmente clases anónimas con casi la misma eficiencia.

Si hay comportamiento y este es especialmente complejo o lento, como pueden ser las clases de acceso a bases de datos, servicios de terceros a través de apis, sistemas de archivos, etc. la mejor opción en eficiencia podrían ser las clases anónimas.

Sin embargo, la ventaja de las clases anónimas se diluye un poco ante la conveniencia de los frameworks de dobles, ya que no tenemos que preocuparnos por muchas cuestiones a la hora de doblar, como pueden ser sobreescribir el contructor para eliminar las dependencias o sobreescribir todos los métodos implicados en el test.

Por otro lado, cuando la complejidad de construir las clases nativas es alta resulta más conveniente utilizar los frameworks de test. En general, diría que para todo tipo de servicios, command handlers, etc, que tengan dependencias lo mejor es utilizar un framework.

Y en caso de utilizarlo, la opción más eficiente en el *mock builder* nativo de **phpunit**.

