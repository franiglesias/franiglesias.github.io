
Mejorando la test suite

En Holaluz seguimos una metodología de integración y despliegue continuos. A lo largo de un día de trabajo podemos llegar a realizar veinte o treinta despliegues a producción entre los diversos proyectos en los que estamos trabajando. ¡Ah! Y también desplegamos en viernes, a no ser que se trate de alguna *feature* para la que necesitemos mantener un seguimiento especialmente exhaustivo.

Para poder llegar a esto hace falta un trabajo importante en el área **devops** en cuanto al diseño y montaje de los entornos (producción, *staging*) y a la infraestructura de integración continua.

Pero además es necesario tener confianza en el código, y esa confianza la genera una buena suite de tests.

Por ejemplo, en uno de nuestros proyectos principales tenemos a día de hoy más de 1550 tests (y creciendo). Esto significa que los tests, en sí mismos, ya suponen una base de código de tamaño respetable y requiere su propio mantenimiento. Obviamente no se llega a tener 1550 tests en cuatro días, es un trabajo acumulado de varios meses y, cada día que pasa, generamos nuevos tests.

El problema obvio que surge es que cuanto mayor es la cantidad de tests más tiempo tarda en ejecutarse la suite completa, lo que ralentiza el proceso de desarrollo retrasando el feedback, la generación de pull request y su despliegue.

Así que nos hemos planteado mejorar la performance de nuestros tests. ¿En qué aspectos podemos intervenir entonces?

* **Mejorar la velocidad de ejecución de la suite**. Tenemos tests que tienen tiempos de ejecución enormes que no están justificados por el tipo de proceso bajo test. En este caso hemos comprobado que usar **prophecy** como framework para generar *test doubles* es el principal cuello de botella. Utilizar los *doubles* "nativos" de **phpunit** mejora el rendimiento de una forma espectacular. Esta es la medida principal, ya que nos permite mejorar tiempos en saltos muy significativos.
* **Mejorar el código de los tests**. En algunos casos se podría decir que nuestro testing arrastra deuda técnica. Dicho de otro modo, no todos nuestros tests están lo bastante bien escritos como para ejecutarse con agilidad, por lo que cada test que toquemos debería ser refactorizado a fin de ser más útil y más eficiente. Las ganancias en performance en este caso son más pequeñas, pero también resultan útiles ya que, en general, nos permiten consumir menos recursos.
* **Optimizar la cantidad de tests**. Hay áreas de código sobradamente testeadas y si su tiempo de ejecución pasa de cierto umbral quizá nos está dando una indicación de que podríamos reducir la cantidad de tests sin perder la fiabilidad de la suite.
* **Entorno de ejecución**. Tras haber *dockerizado* el entorno de desarrollo (anteriormente lo teníamos en **vagrant**) la velocidad de ejecución de los tests en la combinación macOs/docker ha bajado sustancialmente, por lo que debemos investigar posibles mejoras en este aspecto.

Así que vayamos por partes:

## Mejorar la velocidad de ejecución de la suite de test

### De Prophecy a mocks de PHPUnit

Los tests deberían ser rápidos, particularmente los unitarios. Tener tests muy lentos en la capa de unitarios es un problema y nosotros teníamos algunos tests con duraciones realmente exageradas. Así que empezamos a examinarlos.

Observamos que los tests lentos eran principalmente aquellos en los que se usaban muchos tests doubles, lo que señala como primera sospechosa a nuestra metodología para generar dobles.

Preparamos un pequeño experimento para comparar diferentes estrategias con las que generar dobles. Consiste en un test muy simple, que genera un stub con cada una de las metodologías y realizar un assert sobre el mismo. Cada test se ha repetido 10.000 veces.

El resultado es revelador:

| Method | Time (ms) | Memory |
|:-------|----------:|-------:|
| testMockBuilderExample | 88 | 10.00MB |
| testProphecyExample | 206 | 26.00MB | 
| testRealObjectExample | 269 | 26.00MB | 
| testAnonymousClassExample | 287 | 26.00MB |

Los mocks nativos de **phpunit** son muchísimo más rápidos que los de prophecy. De hecho son muchísimo más rápidos que cualquiera de los otros métodos.

Este único experimento no es concluyente, pero nos da una pista de por dónde van los tiros. Revela que las grandes diferencias están en la generación del doble, ya que el test en sí se limita a llamar a un método para chequear su valor. Por tanto, sólo con cambiar la estrategia de generación de dobles te llevas gratis un aumento de velocidad y menor uso de recursos.

Veamos algunos ejemplos con test cases reales que hemos migrado:

| TestCase   | Prophecy (ms) | Phpunit (ms)|
|:-----------|--------------:|------------:|
| TestCase 1 | 1652          | 377         |
| TestCase 2 | 35774         | 860         |
| TestCase 3 | 74899         | 11682       |

Los datos así ya resultan bastante más interesantes, aunque se puede ver que hay mucho margen de mejora en el Test Case 3. Sin embargo, hay que decir que al menos dos de los Test Case fueron reescritos y se añadieron nuevos tests, mejorando la cobertura de los casos y la expresividad del propio test. Es decir, incluso con más tests podemos ir más rápido.

### Ojo a las fixtures

Consideremos este TestCase:

| TestCase   | Fixture (ms) | Phpunit (ms)|
|:-----------|-------------:|------------:|
| TestCase 4 | 107987       | 1396        |

En este TestCase un objeto utilizado por el *subject under test* se carga mediante una fixture usando Nelmio/Alice. El TestCase tiene 103 tests, generados mediante *data providers* porque se trata de un elemento bastante importante para negocio.

El problema era que la fixture se cargaba cada vez que se ejecutaba un test lo que aumentaba innecesariamente la duración. Para esto hemos encontrado dos posibles soluciones:

* Instanciar en el setUp un doble del objeto y hacer stub de los métodos necesarios.
* Utilizar el método estático `setUpBeforeClass` del TestCase para cargar la fixture una única vez, utilizándolo en el test mediante una llamada `self::$object`.

En este caso, la diferencia en rendimiento entre ambos métodos no es muy grande y hemos optado por hacer un doble del objeto en cuestión. Sin embargo, en algunos contextos puede tener mucho sentido realizar la carga de fixtures una única vez, aunque no siempre será posible.

Por cierto, otro punto que debería contribuir a un mejor rendimiento de la suite de tests es cargar un juego de fixtures ajustado exactamente a las necesidades del test.

## Mejoras en el código de los tests

Los dobles que se generan con **phpunit** son *dummies* y, por definición, cualquier llamada a sus métodos devuelve `null` (ocurre lo mismo en **prophecy**). Para hacer un `stub` o un `mock` hay que definirlo explícitamente:

```php

public function testSomething(): void
{
    $serviceDouble = $this->createMock(Service::class);
    
    // stub method
    $service->method('handle')->willReturn('response');
    
    // mock method
    $service->expects($this->once())
        ->method('someMethod')
        ->with('parameter1', 'parameter2')
        ->willReturn('response');
}
```

Una de las cosas que pudimos hacer fue simplificar la creación de `stubs` ya que teníamos dobles que simulaban todas las llamadas posibles. De este modo, redujimos los stubs sólo a las llamadas realmente necesarias. 

En este contexto surgió una técnica curiosa para testear y describir el legacy.

### Entendiendo el legacy con dobles

Supón que haces un doble de un clase que tiene muchos métodos (frecuentemente alguna entidad o un objeto request que lleva muchos datos) y haces un stub de todos ellos. ¿Cuáles son realmente necesarios? ¿Tenemos que doblarlos todos?

```php
public function testSomething(): void
{
    $request = $this->createMock(Request::class);
    
    // stub methods
    $request->method('id')->willReturn('some-id');
    $request->method('name')->willReturn('some-name');
    $request->method('address')->willReturn('some-address');
    $request->method('email')->willReturn('some-email');
    $request->method('data')->willReturn('some-data');
}
```

Pues bien, basta con convertir los *stubs* en *mocks*, añadiendo `expects`. Si al ejecutar el test falla la expectativa, entonces puedes eliminar ese *stub* ya que nunca se llama, al menos en el contexto de ese test.

```php
    $request = $this->createMock(Request::class);
    
    // stub methods
    $request->method('id')->willReturn('some-id');
    $request->method('name')->willReturn('some-name');
    $request->method('address')->willReturn('some-address');
    $request->expects($this->once())
        ->method('email')->willReturn('some-email');
    $request->method('data')->willReturn('some-data');
```

Esta técnica nos sirve para eliminar *stubs* que no se usan, pero nosotros también queremos saber cuáles son necesarios y aquí es donde haber trabajado con cierto rigor nos viene bien.

Como decíamos antes, los dobles nacen como *dummies*, por lo que todos los métodos devuelven `null`. Si el código bajo tiene que usar la salida de alguno de esos métodos lo más seguro es que falle, bien sea por temas de type hinting, bien porque espera un tipo o una interfaz. Este fallo nos está indicando qué debería devolver el método, por lo que podremos hacer su stub.

Por cierto que eso nos llevará seguramente a encontrarnos con un montón de violaciones de la Ley de Demeter.

### Lo que pasa en el doble se queda en el doble

Los dobles de tests se utilizan para simular el comportamiento de objetos colaboradores de aquel que estemos probando. Con frecuencia, debido a la naturaleza del comportamiento testeado no es posible hacer aserciones sobre la respuesta del *subject under test* o de sus efectos en el sistema. Por esa razón, establecemos expectativas sobre los dobles: esperamos que sean usados por nuestro *SUT* de cierta manera, lo que los convierte en *mocks* y son la base para que nuestro test nos aporte alguna información.

Un caso típico puede ser un test unitario de un servicio que utiliza un objeto Mailer para enviar un mensaje de correo electrónico. No podemos observar ese efecto para los objetivos del test, tan sólo podemos recoger su respuesta (el Mailer podría devolver un código que nos diga si el envío se ha realizado) o bien asegurarnos de que ha sido llamado por el *SUT* con los parámetros esperados:

```php
public function testShouldSendAnEmail ()
{
    $message = new Message();
    $message->to('person@example.com');
    $message->body('notification for you');

    $mailer = $this->createMock(Mailer::class);
    $mailer->expects($this->once())->method('send')->with($message);    
    
    $service = new SendNotification($mailer);
    $service->notify($message);
}
```

Cualquier cosa que pueda pasar dentro del método `send` de ese mailer es completamente prescindible para nosotros. En el test, lo que verificamos es que nuestro código está usándolo con un objeto mensaje, confiando en que el Mailer real hace su trabajo, bien porque es una biblioteca de terceros, ya porque hemos demostrado que funciona mediante sus propios tests.

A nivel de tests unitarios normalmente no es necesario crear Fakes que tengan comportamiento real, o asimilable a real. En consecuencia no necesitamos doblar  ni sus dependencias ni los objetos que use internamente. Debemos ver esa dependencia de nuestro SUT como una caja negra con una interfaz pública de la que podemos esperar ciertos comportamientos, representados por outputs que nos interesa probar. Lo único que tenemos que hacer es simular que tiene cierto comportamiento, incluyendo lanzar excepciones, para verificar que nuestro código bajo test reacciona adecuadamente.
 
