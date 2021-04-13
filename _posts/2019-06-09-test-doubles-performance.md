---
layout: post
title: La performance de los métodos para crear test doubles
categories: articles
tags: testing
---

Hace algunos meses estuve haciendo análisis sobre la performance de los diversos métodos para crear test doubles y cómo impactan en nuestras suites de tests. Ahora lo he retomado con mejores herramientas.

La suite de tests de Holaluz ha crecido mucho y me preocupa un poco cómo compaginar su crecimiento en número de tests y cobertura, manteniendo un tiempo de ejecución razonable.

Una suite de test que tarda mucho en ejecutarse pierde utilidad porque el feedback no llega tan rápido como se desea y comienza a verse como un estorbo más que una herramienta necesaria en el trabajo.

## Actualización

He modificado bastante los detalles de la metodología para lanzar los test, por lo que he actualizado el artículo con los nuevos resultados. No alteran mucho las conclusiones, pero creo ahora son más confiables.

El cambio es que ahora los test se lanzan en procesos diferentes y aislados. En conjunto hace que sea más lento, por lo que he reducido las repeticiones por defecto a 50.

Por otro lado, la información del consumo de memoria también cambia. Aparte de que sea debido a la nueva forma de lanzar los test, he intentado evitar un efecto de posición: el primer test parecía consumir una cantidad de memoria desproporcionadamente grande. Para evitarlo, lo que ahora se hace es ejecutar una primera vez cada test y medir la memoria solo tras esa primer ejecución. Este aspecto de la memoria es el menos fiable, por lo que no comentaré el dato hasta tener una metodología que me convenza.

Un último comentario es que hay un margen de error en la medida. Si ejecutas los tests en tu propio entorno podrías observar resultados ligeramente diferentes o distinto orden en cada ejecución entre métodos que arrojan tiempos parecidos. Parece que existe un pequeño elemento de aleatoriedad, supongo que dependiendo de procesos que puedan estar corriendo en tu máquina en un momento dado. 

Gracias a [Sergio Susa](https://github.com/sergiosusa) por sus observaciones sobre el efecto de orden en los tests.

## Velocidad de los tests según la metodología para crear dobles

Son muchos los factores que influyen en el tiempo de ejecución de una suite de tests y, de momento, voy a centrarme en un aspecto concreto: los métodos para generar test doubles. En varios artículos del blog hemos hablado de ellos. Fundamentalmente me interesaba comprar los dobles generados con librerías de mocking frente a usar las clases originales o instanciar clases anónimas como dobles.

Después de unos primeros análisis bastante simples, los resultados fueron un tanto inesperados ya que el método más eficiente resultó ser la creación de dobles nativos de **PHPUnit** (los que se obtienen con `createMock`), con bastante diferencia sobre usar las clases originales y sobre los dobles usando la librería **prophecy**, integrada también en **PHPUnit**.

Un ejemplo de los resultados obtenidos fue este:

| Method                    | Time (ms) |  Memory (MB) |
|:--------------------------|----------:|-------------:|
| testMockBuilderExample    |        88 |        10.00 |
| testProphecyExample       |       206 |        26.00 | 
| testRealObjectExample     |       269 |        26.00 | 
| testAnonymousClassExample |       287 |        26.00 |

Para alguien bastante fan de **prophecy** fueron resultados sorprendentes y un tanto decepcionantes. Particularmente me sorprendió que la clase original fuese más lenta que que alguno de los *frameworks*. En principio, eso me hizo sospechar que la metodología no era suficientemente buena.

Sin embargo, reescribí algunos tests que eran particularmente lentos en mi entorno para ver qué efecto tendría cambiar el *framework* de dobles:

| TestCase   | Prophecy (ms) | PHPUnit (ms)|
|:-----------|--------------:|------------:|
| TestCase 1 |          1652 |         377 |
| TestCase 2 |         35774 |         860 |
| TestCase 3 |         74899 |       11682 |

La mejora es muy grande, y en algunos casos escandalosamente grande, por lo que empezamos a escribir los tests con los dobles nativos, así como a migrarlos de un *framework* a otro cuando teníamos oportunidad. De hecho, en alguno de los TestCase reescritos pudimos añadir aún más tests y mantener una velocidad alta.

## Un análisis más profundo

Con todo, no quedé muy convencido de este primer análisis. No me cuadraba del todo que crear dobles con una librería fuera más eficiente que las clases originales, por lo menos en casos de Value Objects y otros objetos sin comportamiento. Seguramente en objetos con comportamiento o cuya ejecución pudiese ser lenta, como repositorios, habría ganancias usando dobles, al menos a partir de un cierto tiempo de ejecución, pero no en objetos que residen en memoria y hacen muy poquitas cosas.

Finalmente, he tenido tiempo para preparar un entorno más robusto y flexible con el que poder comparar la velocidad de ejecución y consumo de memoria de un conjunto de TestCases arbitrario. [Este entorno lo puedes examinar en github](https://github.com/franiglesias/tb-doubles). No voy a entrar en detalles, que se pueden ver en el código, pero la idea es poder ejecutar repetidas veces varios TestCases y comparar el tiempo necesario para ejecutarlos, así como el consumo de recursos o, al menos, una aproximación. En principio, los tests para probar deben llamarse 'test', aunque es algo que espero cambiar en una próxima iteración.

Por tanto, he podido reproducir mi análisis original, obteniendo nuevos resultados y de mejor calidad.

### Clases simples

El primer ejemplo que probé es una clase simple que almacena un valor, una especie de value object, sin apenas comportamiento.

```php
class Sample
{
    /** @var string */
    private $data;

    public function __construct(string $data)
    {
        $this->data = $data;
    }

    public function data(): string
    {
        return $this->data;
    }
}
```

Las clases testeadas y los tests pueden verse en el [repositorio](https://github.com/franiglesias/tb-doubles).

Los resultados han sido estos, ejecutando los test 50 veces:

```
Test Doubles creation methods (50 times)
========================================

 Method                              Time (s)  Memory (KB)

-----------------------------------------------------------
 OriginalClassTest::test............   3.1228         1.44
 AnonymousClassTest::test...........   3.3212         1.44
 NativeMockTest::test...............   9.9685         1.44
 ProphecyMockTest::test.............  13.2614         1.44
```

Para empezar, los resultados parecen más consistentes con lo esperado. La instanciación de la clase bajo test es el método más eficaz, mientras que la instanciación de una clase anónima que extiende de ella es marginalmente más lenta. En términos de ejecución, serían intercambiables.

A cierta distancia, pero no demasiada, los dobles nativos de **PHPUnit** son un poco más lentos. Sin embargo, ofrecen un buen compromiso entre el coste en performance y la complejidad que puede suponer en no pocas ocasiones instanciar la clase real, especialmente si la necesitamos como dummy o solo se nos requiere hacer stub de uno o dos de sus métodos.

Finalmente, generar los dobles con **prophecy** parece ser el método más costoso en tiempo. Lo sorprendente es la gran diferencia con respecto a cualquiera de los otros métodos.

En general, para objetos que no tengan comportamiento, o este es muy simple, o que no tengan dependencias, utilizar la clase original de un colaborador de la unidad bajo test es el método más eficiente. Si se trata de una clase abstracta o incluso una interfaz, la clase anónima es también una buena alternativa.

### Simulando comportamiento

Para simular comportamiento he puesto una clase bastante sencilla con un cálculo muy simple.

```php
<?php
declare (strict_types=1);

namespace App;

class SampleBehaviour
{
    /** @var string */
    private $value;

    public function __construct(string $value)
    {
        $this->value = $value;
    }

    public function execute(string $value): string
    {
        return sprintf('%s %s', $this->value, $value);
    }
}
```

Los resultados están en la línea de los anteriores, siendo los métodos más eficientes los que usan la clase nativa como doble o una clase anónima extendiendo de aquella. Por su parte, el doble creado con **prophecy** sigue siendo el menos eficiente.

En este caso hemos añadido un test que usa como doble una clase anónima que sobreescribe el método bajo test. Como veremos más adelante, esto tiene un efecto visible.

```php
Test Doubles with behaviour creation methods (50 times)
=======================================================

 Method                              Time (s)  Memory (KB)
-----------------------------------------------------------
 AnonymousTest::test................   3.2732         1.45
 AnonymousStubTest::test............   3.3716         1.45
 OriginalTest::test.................   3.5625         1.45
 NativeMockTest::test...............  10.2571         1.45
 ProphecyMockTest::test.............  15.7297         1.45
```

Pero si el comportamiento es complejo o existen dependencias que provocan un tiempo de ejecución alto de la unidad bajo test encontramos unos resultados diferentes.

Para simular esto hemos añadido un `sleep` de 1 segundo para simular un comportamiento complejo, que requiere mucho más tiempo. Imagina que la dependencia sea un repositorio que accede a una base de datos con una query relativamente pesada.

```php
<?php
declare (strict_types=1);

namespace App;

class SampleBehaviour
{
    /** @var string */
    private $value;

    public function __construct(string $value)
    {
        $this->value = $value;
    }

    public function execute(string $value): string
    {
        sleep(1);

        return sprintf('%s %s', $this->value, $value);
    }
}
```

En estas condiciones la mejor forma de generar dobles es mediante clases anónimas sobreescribiendo los métodos implicados en el test para que no ejecuten el comportamiento original (la definición de stub). 

En ese caso el stub basado en una clase anónima con los métodos sobreescritos vence a todos los demás métodos con gran claridad.

Los resultados, por lo demás, eran bastante predecibles y, en esta ocasión, los *frameworks* de creación de dobles ganan la partida a la clase original con gran diferencia, mientras que la instancia real de la clase requiere una cantidad desorbitada de tiempo para un test. Los dobles creados con algún *framework* no ejecutan el comportamiento lento con lo que se libran de la penalización de tiempo, y es por esa razón que los usamos.

```
Test Doubles with behaviour creation methods (50 times)
=======================================================

 Method                              Time (s)  Memory (KB)
-----------------------------------------------------------
 AnonymousStubTest::test............   3.6206         1.45
 NativeMockTest::test...............  10.0466         1.45
 ProphecyMockTest::test.............  13.6494         1.45
 OriginalTest::test.................  53.7431         1.45
 AnonymousTest::test................  53.9065         1.45
```

Comparando los dos *frameworks* que hemos probado, se puede ver que **prophecy** es menos eficiente que el *mock builder* nativo de **PHPUnit** aunque no tanto como esperaba inicialmente (en la versión anterior del proyecto, había una diferencia bastante mayor).

## Conclusiones

Aunque todavía quedan muchas mejoras para este entorno de análisis, creo que puede ser útil para optimizar las suites de test y obtener alguna información con la que fundamentar las decisiones que se tomen para ello.

De entrada, hay que destacar las ventajas de usar instancias de las clases nativas en lugar de dobles: conforman la opción más rápida y la que menos memoria consume. Esto aplica perfectamente para Value Objects, DTO, Events, Commands, objetos-parámetro y también Entidades.

Cuando necesitamos doblar clases abstractas o interfaces podemos usar fácilmente clases anónimas con prácticamente la misma eficiencia.

Si hay comportamiento y este es especialmente complejo o lento, como pueden ser las clases de acceso a bases de datos, servicios de terceros a través de apis, sistemas de archivos, etc. la mejor opción en eficiencia podrían ser las clases anónimas.

Sin embargo, la ventaja de las clases anónimas se diluye un poco ante la conveniencia de los *frameworks* de dobles, ya que no tenemos que preocuparnos por muchas cuestiones a la hora de doblar, como pueden ser sobreescribir el contructor para eliminar las dependencias o sobreescribir todos los métodos implicados en el test. Es decir, nos ahorran trabajo y la penalización en velocidad de ejecución puede compensarse con un esfuerzo de programación menor.

Además, hay que tener en cuenta que podemos tener que utilizar muchas variantes de la misma clase para definir los distintos escenarios de test, lo que suele resultar más cómodo usando un *framework*.

Por otro lado, cuando la complejidad de construir las clases nativas, o incluso su versión anónima, es alta resulta más conveniente utilizar los *frameworks* de test. En general, diría que para todo tipo de servicios, command handlers, etc, que tengan comportamientos complejos y dependencias lo mejor es utilizar un *framework* para obtener sus dobles.

Y en caso de utilizarlo, la opción más eficiente en el *mock builder* nativo de **PHPUnit**.

