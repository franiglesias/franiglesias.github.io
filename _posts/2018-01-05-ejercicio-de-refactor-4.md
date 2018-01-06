---
layout: post
title: Ejercicio de refactoring (4) Finalizando
categories: articles
tags: [refactor, legacy]
---

En el artículo anterior quedaron pendientes algunos refactors en nuestro proyecto. En esta entrega mi intención es tratar de rematarlos, así como hacer alguna reflexión sobre los resultados obtenidos y sus consecuencias.

La serie **Ejercicio de refactoring** consta de los siguientes artículos:

[Ejercicio de refactoring (1): Los test de caracterización](/2017-12-16-ejercicio-de-refactor-1)  
[Ejercicio de refactoring (2): Extraer hasta la última gota](/2017-12-17-ejercicio-de-refactor-2)  
[Ejercicio de refactoring (3): Intervenir y seguir o no refactorizando](/2017-12-27-ejercicio-de-refactor-3)  
[Ejercicio de refactoring (4): Finalizando](/2018-01-05-ejercicio-de-refactor-4)  

Pero antes de empezar, debo señalar que la propuesta de refactor que se muestra aquí no tiene que ser ni la única posible, ni la mejor. Lo interesante de esta serie no es tanto el resultado concreto, como el proceso mediante el que se llega al mismo. Y, particularmente, lo que más me llama la atención es el modo en que, a medida que vamos reorganizando el código, vamos refinando los conceptos, descubriendo patrones y abriendo vías para mejores diseños.

Hasta ahora, he tratado de mantener el refactoring dentro de los límites del método `Notification::getMessagesByOrderStatus()`, un método estático de una clase existente, el cual, por el momento, ha quedado así:

```php
<?php

use Refactor\MessagesByOrderStatusGenerator;

class Notification
{
    /**
     * @param Order $order
     *
     * @return array
     */
    public static function getMessagesByOrderStatus(Order $order)
    {
        $generator = new MessagesByOrderStatusGenerator(Logger::getInstance());
        return $generator->generate($order);
    }
}
```

De esta forma, el resto del código no se entera realmente de los cambios que hemos estado realizando. Un refactor más profundo nos llevaría a rediseñar Notification y de qué forma interactúa con el resto del código, algo que se escapa tanto de los objetivos de estos artículos, como, seguramente, de los del caso real. Manteniéndonos dentro de este límite todavía podemos seguir trabajando un poco más.

## Más extracción de dependencias

Respecto al código con el que empezamos queda todavía una dependencia de PaymentMethods que no me acaba de gustar, así que quiero sacarla fuera de la clase `MessagesByOrderStatusGenerator` y así poder hacer que ésta implemente la interfaz MessageGenerator que creamos en el artículo anterior. De paso, me gustaría eliminar el uso del Logger dentro de la clase, ya que está vinculado con esa dependencia y no se usa más.

Eso implica devolver algo de código a la clase original, aunque creo que es por una buena causa, ya que no se va a generar ningún mensaje en esa situación, ¿para qué invocar al generador?

Toda la transformación que vamos a hacer está protegida por el test de caracterización, pero no por el test que creamos posteriormente y que ahora ya no nos va a servir para lo que queremos. Por tanto, eliminaremos el test.

Tras el cambio, las cosas quedarán así:

Tras corregir un par de tests en el sentido que hicimos en el artículo anterior (usar un Stub de PaymentMethods), el método original recupera el bloque try…catch y se ocupa ahora de la situación de que no podamos obtener un medio de pago, logueandola.

```php
<?php

use Refactor\MessagesByOrderStatusGenerator;

class Notification
{
    /**
     * @param Order $order
     *
     * @return array
     */
    public static function getMessagesByOrderStatus(Order $order)
    {
        try {
            $logger = Logger::getInstance();
            $paymentMethods = PaymentMethods::getFromOrder($order);

            if (null === $paymentMethods->getPaymentMethodFromOrder($order)) {
                $logger->debug("Medio de pago desconocido");
                return [];
            }
            $generator = new MessagesByOrderStatusGenerator();
            return $generator->generate($order, $paymentMethods);

        } catch (Exception $e) {
            return [];
        }
    }
}
```

Podríamos discutir mucho sobre lo que se muestra en este código, al fin y al cabo: ¿no te parece que todo ese follón acerca de los payment methods no tendría un lugar más adecuado en `Order`?

Algo así:

```php
<?php

use Refactor\MessagesByOrderStatusGenerator;

class Notification
{
    /**
     * @param Order $order
     *
     * @return array
     */
    public static function getMessagesByOrderStatus(Order $order)
    {
        $logger = Logger::getInstance();
        if (!$order->hasDefinedPaymentMethod()) {
            $logger->debug("Medio de pago desconocido");
            return [];
        }
        $generator = new MessagesByOrderStatusGenerator();
        return $generator->generate($order);
    }
}
```

El refactor va dejando en evidencia los problemas de diseño de este código, pero otra cosa muy distinta es que podamos plantearnos arreglarlos en este momento. En el ámbito de este artículo no conocemos el contexto completo del código, por lo tanto sólo podemos hacer algunas propuestas más o menos razonables de cómo continuar.

En todo caso, una vez desbrozado el código y aclarado el campo de trabajo, todo apunta a que la funcionalidad que supuestamente aporta `PaymentMethods` sea propia de `Order`: `Order` debería saber qué `PaymentMethod` tiene definido, como se induce del hecho de que `PaymentMethods` tiene que extraer la información de `Order`, lo que nos indica que `Order` la contiene.

Así que una primera opción sería extender los comportamientos de Order añadiendo nuevos métodos, como podrían ser `getDefinedPaymentMethod` o `hasDefinedPaymentMethod`.

Sin embargo, supongamos que no podemos tocar la clase `Order` por algún motivo, ¿qué hacemos en ese caso?

### No hay problema que no se pueda resolver con un nivel más de indirección

Necesitamos saber estas cosas de nuestro objeto Order:

* el estado
* el estado de los productos
* el medio de pago
* si el medio de pago requiere autorización
* el proveedor
* el localizador de proveedor
* el vendedor

La idea es crear una nuevo objeto que obtenga la información necesaria de los objetos legacy (`Order`, `PaymentMethods`) y pasarselo a los nuevos objetos `MessageGenerator`, lo que implica cambiar interfaz que acabamos de definir en el artículo anterior. Puedes considerar esto algo parecido al refactor Parameter Object.

De este modo no tendríamos que modificar las clases _legacy_ (aunque lo hicimos en el artículo anterior, podríamos revertir ese cambio y encapsularlo aquí para mayor coherencia) y además aislamos las dependencias del código legacy en un único lugar, lo que mola bastante. Llamaremos a esta clase ReportableOrder.

El diseño de esta clase es relativamente sencillo, pero usaremos tests para dirigirlo y tener la seguridad de que nos proporciona los datos que deseamos.


```php
<?php

namespace Refactor;

use Order;
use PaymentMethods;

class ReportableOrder
{
    private $order;
    private $paymentMethods;

    public function __construct(Order $order, PaymentMethods $paymentMethods)
    {
        $this->order = $order;
        $this->paymentMethods = $paymentMethods;
    }

    public function getOrderStatus()
    {
        return $this->order->getStatus();
    }

    public function getProductStatus()
    {
        return $this->order->getProductStatus();
    }

    public function getPaymentMethod()
    {
        return $this->paymentMethods->getPaymentMethodFromOrder($this->order);
    }

    public function paymentMethodRequiresAuthorization()
    {
        return $this->paymentMethods->requiresAuthorization();
    }

    public function getProviderLocator()
    {
        return $this->order->getProviderLocator();
    }

    public function getProvider()
    {
        return $this->order->getProvider();
    }

    public function getReseller()
    {
        return $this->order->getResellerCode();
    }
}
```

Sustituir Order por ReportableOrder en los MessageGenerator nos va a dar un poco de trabajo pues cambia la interfaz. Iremos poco a poco, intentando no romper los tests. 

El primer paso será cambiar la interfaz de `MessageGenerator` añadiendo `ReportableOrder` como tercer parámetro.

```php
<?php

namespace Refactor;


use Order;
use PaymentMethods;

interface MessageGenerator
{
    public function generate(Order $order, PaymentMethods $paymentMethods, ReportableOrder $reportableOrder);
}
```

Al lanzar de nuevo el test de caracterización veremos que falla. por lo que tendremos que revisar el código de los MessageGenerators hasta que volvamos a verde.

Puede parecer un poco lento hacerlo así y no lanzarnos a realizar todos los cambios necesarios, pero es una forma muy buena de poder minimizar el tiempo en que los tests están en rojo. Los pequeños pasos nos mantienen centrados, es fácil gestionar los cambios necesarios y evitamos los típicos errores por intentar hacerlo todo a la vez.

De este modo, una vez corregidos todos los errores que han aparecido al ejecutar el test hemos vuelto a verde y el código de nuestro `Notification` habrá quedado así:

```php
<?php

use Refactor\MessagesByOrderStatusGenerator;
use Refactor\ReportableOrder;

class Notification
{
    /**
     * @param Order $order
     *
     * @return array
     */
    public static function getMessagesByOrderStatus(Order $order)
    {
        try {
            $logger = Logger::getInstance();
            $paymentMethods = PaymentMethods::getFromOrder($order);
            $reportableOrder = new ReportableOrder($order, $paymentMethods);
            if (null === $paymentMethods->getPaymentMethodFromOrder($order)) {
                $logger->debug("Medio de pago desconocido");
                return [];
            }
            $generator = new MessagesByOrderStatusGenerator();
            return $generator->generate($order, $paymentMethods, $reportableOrder);

        } catch (Exception $e) {
            return [];
        }
    }
}

```

Lo suyo es comenzar a reemplazar los usos de los parámetros $order y $paymentMethods por el nuevo $reportableOrder. De momento no eliminaremos los parámetros. Una vez que hemos dejado de usarlos y **con el test pasando correctamente**, los eliminamos de la definción de la interfaz MessageGenerator. Esto hará que falle de nuevo el test, indicándonos que tenemos que arreglar las llamadas a los métodos.

```php
<?php

namespace Refactor;


use Order;
use PaymentMethods;

interface MessageGenerator
{
    public function generate(ReportableOrder $reportableOrder);
}
```

De paso que hacemos esto y manteniendo los test en verde aprovecharmos para hacer algunos refactors sencillos como eliminar algunas variables temporales y alguna dependencia que nos había quedado olvidada.

## Hasta el infinito, y más acá

Llegados a este punto, cabe preguntarse de nuevo hasta dónde seguir con el trabajo de refactorización.

El nuevo estado del código nos permite ver con más claridad algunos problemas, así que todavía podríamos ir un poco más allá. 

Lo más obvio en este momento es que los métodos `generateXXX` dentro de `MessagesByOrderStatusGenerator` tienen pinta de que podrían extraerse a clases `MessageGenerator`.

Aquí tenemos ambas clases:

```php

class Provider1MessageGenerator implements MessageGenerator
{
    public function generate(ReportableOrder $reportableOrder)
    {
        $productStatus = $reportableOrder->getProductStatus();
        if ($productStatus == OrderStatuses::PENDING_PROVIDER_ERROR ||
            $productStatus == OrderStatuses::PENDING
        ) {
            return ['pedido no confirmado con provider 1'];
        }
        if ($productStatus == OrderStatuses::CANCELLED) {
            return ['pedido cancelado'];
        }

        return [];
    }
}

class SoldMessageGenerator
{
    public function generate(ReportableOrder $reportableOrder)
    {
        if ($reportableOrder->getReseller() === Resellers::RESELLER1) {
            return ['pedido confirmado con reseller 1'];
        }

        return ['pedido confirmado'];
    }
}
``` 
Y así queda `MessagesByOrderStatusGenerator` una vez refactorizado. ¿Has detectado el patrón?:

```php
<?php

namespace Refactor;

use Providers;
use PurchaseStatus;

class MessagesByOrderStatusGenerator implements MessageGenerator
{
    public function generate(ReportableOrder $reportableOrder)
    {
        if (empty($reportableOrder->getProviderLocator())) {
            return ['pedido no se pudo realizar'];
        }

        if (Providers::PROVIDER1 === $reportableOrder->getProvider()) {
            $generator = new Provider1MessageGenerator();

            return $generator->generate($reportableOrder);
        }

        $orderStatus = $reportableOrder->getOrderStatus();

        if ($orderStatus == PurchaseStatus::RESERVED ||
            $orderStatus == PurchaseStatus::SOLD) {
            $generator = new SoldMessageGenerator();

            return $generator->generate($reportableOrder);
        }

        if (Providers::isAssociatedProvider($reportableOrder->getProvider())) {
            $generator = new AssociatedProviderMessageGenerator();

            return $generator->generate($reportableOrder);
        }

        $generator = new NoAssociatedProviderMessageGenerator();

        return $generator->generate($reportableOrder);
    }
}
```

Se podría decir que la sombra de la cadena de responsabilidad ha estado planeando durante todo el proceso de refactor, pero es ahora cuando estamos en mejores condiciones para aplicar el patrón.

La pega, hasta cierto punto, es que ya tenemos cuatro generators y podríamos tener uno ó dos más y prefiriríamos no tocarlos. ¿Qué podemos hacer?

La respuesta está en la sobre-ingeniería. Ciertamente, lo que voy a proponer ahora puede considerarse demasiado complejo para un simple generador de mensajes pero, por otra parte, creo que el resultado final resultará intersante. Si bien nuestro ejemplo actual es sencillo, puedo imaginar proyectos más complejos en los que necesitaremos la flexibilidad y sostenibilidad que vamos a conseguir.

Fundamentalmente, mi intención es combinar Specifications con sus correspondientes MessageGenerators usando Mediators que formarán una ChainOfResponsibility.

Sí, suena a sobre-ingeniería que lo flipas.

Sin embargo, hay un problema en el que todavía no me he parado: el código sabe demasiado del negocio: ¿podremos resolverlo? Para responder a esta pregunta, voy a tomar el camino largo. La lógica problemática quedará en las Specifications que, por definición, encapsulan las reglas del negocio aislando el problema y dándonos pistas para solucionarlo.

## Specification

Lo primero sería extraer las condiciones a clases Specification. Ciertamente las condiciones que manejamos aquí no son especialmente complejas, pero encapsularlas en métodos o clases cuyo nombre exprese mejor la intención siempre resulta buena idea como parte de un refactoring. El patrón usa la siguiente interface:

```php
interface Specification
{
    public function isSatisfiedBy(ReportableOrder $reportableOrder) : bool;
}
```

Puesto que empezamos a tener un número de clases respetable, voy a reorganizar, de paso, los archivos del proyecto, crearé las Specifications en su propia carpeta y moveré los Generators a la suya. 

Aquí tenemos algunos ejemplos de las Specification que necesitamos:

```php
class IsProvider1Specification implements Specification
{

    public function __construct()
    {
    }

    public function isSatisfiedBy(ReportableOrder $reportableOrder) : bool
    {
        return Providers::isProvider1($reportableOrder->getProvider());
    }
}

class IsSoldOrReservedOrderSpecification implements Specification
{

    public function __construct()
    {
    }

    public function isSatisfiedBy(ReportableOrder $reportableOrder) : bool
    {
        return $reportableOrder->getOrderStatus() === PurchaseStatus::SOLD ||
            $reportableOrder->getOrderStatus() === PurchaseStatus::RESERVED;
    }
}

```

Aunque hasta ahora no le habíamos prestado mucha atención, si te fijas en `IsSoldOrReservedOrderSpecification` parece que tenemos un pequeño caso de código mentiroso. El método `getOrderStatus` devuelve estados de un concepto `Purchase` y eso debería quedar mejor reflejado en el nombre del propio método, así que lo cambio en la clase ReportableOrder, de modo que el problema (que ya venía de Order) quede controlado de aquí en adelante:

 ```php
class IsSoldOrReservedOrderSpecification implements Specification
{

    public function __construct()
    {
    }

    public function isSatisfiedBy(ReportableOrder $reportableOrder) : bool
    {
        return $reportableOrder->getPurchaseStatus() === PurchaseStatus::SOLD ||
            $reportableOrder->getPurchaseStatus() === PurchaseStatus::RESERVED;
    }
}
```

El resto de Specifications siguen el mismo patrón. Para construirlas usando TDD he seguido el siguiente proceso:

### TDD del patrón Specification

Una dificultad cuando hacemos TDD de clases cuyo comportamiento y estructura tenemos ya muy claros y que, por otra parte, cuya integración ya está cubierta por algún test de caracterización o de integración, es que cuesta bastante escoger un primer test y procecer, a continuación, en baby steps. Sencillamente: ya sabemos mucho de la clase que vamos a escribir y el cuerpo nos pide ir rápido.

En el caso de las Specification tenemos dos posibles estados: o bien la condición se cumple, o bien no se cumple. Además, los objetos de los que controlamos que la cumplan pueden ser varios. Mi enfoque ha sido el siguiente:

Dado que los generadores se ejecutarán si la condición se cumple, empezaré planteando un test que espera que espera un `ReportableOrder` que no la cumple. 

He aquí un ejemplo:

```php
class IsAssociatedProviderSpecificationTest extends TestCase
{
    public function testItIsNotSatisfiedByNotAssociatedProviders()
    {
        $sut = new IsAssociatedProviderSpecification();
        $this->assertFalse($sut->isSatisfiedBy($orderForNotAssociatedProvider));
    }
}
```

El test fallará hasta que creemos la clase `IsAssociatedProviderSpecification` e inicialicemos la variable `$orderForNotAssociatedProvider`, cosa que haremos con un Mock de `ReportableOrder`.

```php
class IsAssociatedProviderSpecification implements Specification
{
    public function __construct()
    {
    }

    public function isSatisfiedBy(ReportableOrder $reportableOrder) : bool
    {
    }
}

class IsAssociatedProviderSpecificationTest extends TestCase
{
    public function testItIsNotSatisfiedByNotAssociatedProviders()
    {
        $sut = new IsAssociatedProviderSpecification();
        $orderForNotAssociatedProvider = $this->createMock(ReportableOrder::class);
        $orderForNotAssociatedProvider->method('getProvider')->willReturn(\Providers::PROVIDER2);
        $this->assertFalse($sut->isSatisfiedBy($orderForNotAssociatedProvider));
    }
}
```

Para pasar el test, sólo necesitamos esto:

```php
class IsAssociatedProviderSpecification implements Specification
{
    public function __construct()
    {
    }

    public function isSatisfiedBy(ReportableOrder $reportableOrder) : bool
    {
        return false;
    }
}
```

La clave aquí es al hacer que inicialmente la Specification no se cumpla, cuando tengamos que testear los casos en que se debe cumplir, nos forzará a implementar la lógica necesaria. Por tanto, lo que haremos será probar todos los casos que conocemos que incumplen la Specification mediante un DataProvider (en lugar de escribir un test para cada caso, ya que sabemos que se van a duplicar) y, posteriormente, comenzaremos a escribir los tests de los casos que deberían cumplirla.

Estos tests pasarán sin problema:


```php
class IsAssociatedProviderSpecificationTest extends TestCase
{
    /** @dataProvider NotAssociatedProvidersDataProvider */
    public function testItIsNotSatisfiedByNotAssociatedProviders($provider)
    {
        $sut = new IsAssociatedProviderSpecification();
        $orderForNotAssociatedProvider = $this->createMock(ReportableOrder::class);
        $orderForNotAssociatedProvider->method('getProvider')->willReturn($provider);
        $this->assertFalse($sut->isSatisfiedBy($orderForNotAssociatedProvider));
    }

    public function NotAssociatedProvidersDataProvider()
    {
        return [
            'Provider 1' => ['provider' => Providers::PROVIDER1],
            'Provider 2' => ['provider' => Providers::PROVIDER2],
            'Provider 5' => ['provider' => Providers::PROVIDER5],
            'Provider 6' => ['provider' => Providers::PROVIDER6]
        ];
    }
}
```

A continuación, escribimos el test para los casos positivos, el cual fallará como era de esperar:

```php
    public function testItIsSatisfiedByAssociatedProviders()
    {
        $sut = new IsAssociatedProviderSpecification();
        $orderForAssociatedProvider = $this->createMock(ReportableOrder::class);
        $orderForAssociatedProvider->method('getProvider')->willReturn(Providers::PROVIDER3);
        $this->assertTrue($sut->isSatisfiedBy($orderForAssociatedProvider));
    }
```

Lo que nos obliga a implementar la lógica necesaria, dado que devolver true sin más romperá todos los tests anteriores:

```php
class IsAssociatedProviderSpecification implements Specification
{
    public function __construct()
    {
    }

    public function isSatisfiedBy(ReportableOrder $reportableOrder) : bool
    {
        return Providers::isAssociatedProvider($reportableOrder->getProvider());
    }
}
```

Finalmente, refactorizamos el test con un DataProvider para probar todos los casos positivos.

```php
class IsAssociatedProviderSpecificationTest extends TestCase
{
    /** @dataProvider NotAssociatedProvidersDataProvider */
    public function testItIsNotSatisfiedByNotAssociatedProviders($provider)
    {
        $sut = new IsAssociatedProviderSpecification();
        $orderForNotAssociatedProvider = $this->createMock(ReportableOrder::class);
        $orderForNotAssociatedProvider->method('getProvider')->willReturn($provider);
        $this->assertFalse($sut->isSatisfiedBy($orderForNotAssociatedProvider));
    }

    public function NotAssociatedProvidersDataProvider()
    {
        return [
            'Provider 1' => ['provider' => Providers::PROVIDER1],
            'Provider 2' => ['provider' => Providers::PROVIDER2],
            'Provider 5' => ['provider' => Providers::PROVIDER5],
            'Provider 6' => ['provider' => Providers::PROVIDER6]
        ];
    }

    /** @dataProvider AssociatedProvidersDataProvider */
    public function testItIsSatisfiedByAssociatedProviders($provider)
    {
        $sut = new IsAssociatedProviderSpecification();
        $orderForAssociatedProvider = $this->createMock(ReportableOrder::class);
        $orderForAssociatedProvider->method('getProvider')->willReturn($provider);
        $this->assertTrue($sut->isSatisfiedBy($orderForAssociatedProvider));
    }

    public function AssociatedProvidersDataProvider()
    {
        return [
            'Provider 3' => ['provider' => Providers::PROVIDER3],
            'Provider 4' => ['provider' => Providers::PROVIDER4]
        ];
    }
}
```

Casi estamos. En la clase MessagesByOrderStatusGenerator tenemos lo siguiente:

```php
    if (Providers::isAssociatedProvider($reportableOrder->getProvider())) {
        $generator = new AssociatedProviderMessageGenerator();

        return $generator->generate($reportableOrder);
    }

    $generator = new NoAssociatedProviderMessageGenerator();

    return $generator->generate($reportableOrder);
```

El último generador se lanza incondicionalmente, pero lo correcto sería hacerlo mediante una condición inversa a la anterior. En lugar de negar la Specification que ya hemos creado, necesitaremos una Specification que sea satisfecha por los casos negativos de la anterior.

Esto puede parecer un poco absurdo, pero realmente las Specification son para ser satisfechas y así poder tratarlas todas de la misma manera. No nos interesan, en consecuencia, comprobar que una Specification no sea satisfecha. Por eso tenemos que crear una para lo que ahora son casos negativos. Será muy similar a la anterior:

```php
class NotAssociatedProviderSpecification implements Specification
{

    /**
     * NotAssociatedProviderSpecification constructor.
     */
    public function __construct()
    {
    }

    public function isSatisfiedBy(ReportableOrder $reportableOrder) : bool
    {
        return !Providers::isAssociatedProvider($reportableOrder->getProvider());
    }
}
```

Por último, nos falta crear una Specification y un MessageGenerator para la primera condición del método generate en MessagesByOrderStatusGenerator. Aquí están:

```php
class EmptyProviderLocatorSpecification implements Specification
{

    public function __construct()
    {
    }


    public function isSatisfiedBy(ReportableOrder $reportableOrder) : bool
    {
        return empty($reportableOrder->getProviderLocator());
    }
}


class NoLocatorMessageGenerator implements MessageGenerator
{

    /**
     * NoLocatorMessageGenerator constructor.
     */
    public function __construct()
    {
    }

    public function generate(ReportableOrder $reportableOrder)
    {
        return ['pedido no se pudo realizar'];
    }
}
```

Ahora nos toca utilizarlas en el código. Así que vamos sustituyendo la condición en cada if por la correspondiente Specification, comprobando que no rompemos el test y añadiendo una respuesta por defecto en caso de que no se cumpla ninguna de las especificaciones. El resultado es esta belleza, después de suprimir variables temporales para que la estructura quede más clara:

```php
class MessagesByOrderStatusGenerator implements MessageGenerator
{
    public function generate(ReportableOrder $reportableOrder)
    {
        if ((new EmptyProviderLocatorSpecification())->isSatisfiedBy($reportableOrder)) {
            return (new NoLocatorMessageGenerator())->generate($reportableOrder);
        }

        if ((new IsProvider1Specification())->isSatisfiedBy($reportableOrder)) {
            return (new Provider1MessageGenerator())->generate($reportableOrder);
        }

        if((new IsSoldOrReservedOrderSpecification())->isSatisfiedBy($reportableOrder)) {
            return (new SoldMessageGenerator())->generate($reportableOrder);
        }

        if((new IsAssociatedProviderSpecification())->isSatisfiedBy($reportableOrder)) {
            return (new AssociatedProviderMessageGenerator())->generate($reportableOrder);
        }

        if((new NotAssociatedProviderSpecification())->isSatisfiedBy($reportableOrder)) {
            return (new NoAssociatedProviderMessageGenerator())->generate($reportableOrder);
        }
        
        return [];
    }
}
```

## Mediación encadenada

El código anterior puede entenderse de la siguiente manera:

* Si la Specification es satisfecha, ejecuta el generador correspondiente y termina.
* Si la Specification no es satisfecha, prueba con la siguiente.
* Si no se satisface ninguna Specification (o sea, si no hay más), devuelve un array vacío. 

¿Es o no es una Chain of Responsibility? Pues claro que lo es.

Para montarla vamos a crear unos eslabones que combinen Specifications y Generators, pero sin tocar su código. Escribamos ChainableMessageGenerator, que implementará la interface MessageGenerator.

Empecemos con un test que pruebe que este ChainableGenerator devuelve el mensaje vacío en si no se cumple la Specification.

```php
class ChainableMessageGeneratorTest extends TestCase
{
    public function testItReturnsEmptyMessageIfSpecificationIsNotSatisfied()
    {
        $specification = $this->createMock(Specification::class);
        $specification->method('isSatisfiedBy')->willReturn(false);
        $generator = $this->createMock(MessageGenerator::class);
        $reportableOrder = $this->createMock(ReportableOrder::class);
        $sut = new ChainableMessageGenerator($specification, $generator);
        $this->assertEquals([], $sut->generate($reportableOrder));
    }
}
```

Este test pasará con un código bien simple:

```php
class ChainableMessageGenerator implements MessageGenerator
{
    public function __construct($specification, $generator)
    {
    }

    public function generate(ReportableOrder $reportableOrder)
    {
        return [];
    }
}
```

Ahora probaremos que en caso de satisfacer la Specification se devuelve lo que genere el MessageGenerator.

```php
    public function testItReturnsGeneratedMessageIfSpecificationIsSatisfied()
    {
        $specification = $this->createMock(Specification::class);
        $specification->method('isSatisfiedBy')->willReturn(true);
        $generator = $this->createMock(MessageGenerator::class);
        $generator->method('generate')->willReturn(['something']);
        $reportableOrder = $this->createMock(ReportableOrder::class);
        $sut = new ChainableMessageGenerator($specification, $generator);
        $this->assertEquals(['something'], $sut->generate($reportableOrder));
    }
```

Y el código de producción que permite que pase el test es el siguiente:

```php
class ChainableMessageGenerator implements MessageGenerator
{
    private $specification;
    private $generator;

    public function __construct(Specification $specification, MessageGenerator $generator)
    {
        $this->specification = $specification;
        $this->generator = $generator;
    }

    public function generate(ReportableOrder $reportableOrder)
    {
        if ($this->specification->isSatisfiedBy($reportableOrder)) {
            return $this->generator->generate($reportableOrder);
        }
        return [];
    }
}
```

Ahora necesitamos poder encadenar los ChainableMessageGenerators de modo que sea posible hacer que vayan delegando en su sucesor en el caso de que no se satisfaga la Specification. Por lo general, prefiero hacerlo de forma explícita, aunque es frecuente encontrar otros modelos.

Por tanto, tenemos que probar que encadenando un nuevo Generador a uno existente, el actual delegará la respuesta si la Specification falla. A la larga, tendremos que refactorizar el test para que sea un poco más conciso.

```php
    public function testItDelegatesIfThereIsAChainedGeneratorAndSpecificationIsNotSatisfied()
    {
        $specification = $this->createMock(Specification::class);
        $specification->method('isSatisfiedBy')->willReturn(false);

        $generator = $this->createMock(MessageGenerator::class);
        $generator->method('generate')->willReturn(['something']);

        $delegated = $this->createMock(ChainableMessageGenerator::class);
        $delegated->method('generate')->willReturn(['delegated']);

        $reportableOrder = $this->createMock(ReportableOrder::class);

        $sut = new ChainableMessageGenerator($specification, $generator);
        $sut->chain($delegated);
        $this->assertEquals(['delegated'], $sut->generate($reportableOrder));
    }
```

Implementamos el método chain y la delegación para que el test pueda pasar.

```php
class ChainableMessageGenerator implements MessageGenerator
{
    private $specification;
    private $generator;
    private $next;

    public function __construct(Specification $specification, MessageGenerator $generator)
    {
        $this->specification = $specification;
        $this->generator = $generator;
    }

    public function generate(ReportableOrder $reportableOrder)
    {
        if ($this->specification->isSatisfiedBy($reportableOrder)) {
            return $this->generator->generate($reportableOrder);
        }
        if ($this->next) {
            return $this->next->generate($reportableOrder);
        }
        return [];
    }

    public function chain(ChainableMessageGenerator $delegated)
    {
        $this->next = $delegated;
    }
}
```

Una cosa que puede ser interesante es poder encadenar en el orden deseado los Generators, para lo cual podría venir bien una interface fluída del método chain, que devuelva el último eslabón. De este modo, podríamos expresar el encadenamiento ordenado más o menos así:


```php
   $generator->chain(new ChainableMessageGenerator())->chain(new ChainableMessageGenerator());
```

Este test lo prueba:

```php
    public function testItCanChainGeneratorsInRightOrder()
    {
        $specification = $this->createMock(Specification::class);
        $specification->method('isSatisfiedBy')->willReturn(false);

        $generator = $this->createMock(MessageGenerator::class);
        $generator->method('generate')->willReturn(['something']);

        $delegated = $this->createMock(ChainableMessageGenerator::class);
        $delegated->method('generate')->willReturn(['delegated']);

        $sut = new ChainableMessageGenerator($specification, $generator);
        $this->assertEquals($delegated, $sut->chain($delegated));
    }
```

Y se puede implementar así de sencillamente:

```php
    public function chain(ChainableMessageGenerator $delegated)
    {
        $this->next = $delegated;
        return $this->next;
    }
```

## Migrando a ChainableMessageGenerators

Por el momento, montaremos la cadena en la clase Notification, sin alterar nada del comportamiento actual según lo describe el test de caracterización que hicimos al principio. Nos quedará así:

```php
class Notification
{
    /**
     * @param Order $order
     *
     * @return array
     */
    public static function getMessagesByOrderStatus(Order $order)
    {
        try {
            $logger = Logger::getInstance();
            $paymentMethods = PaymentMethods::getFromOrder($order);
            $reportableOrder = new ReportableOrder($order, $paymentMethods);
            if (null === $reportableOrder->getPaymentMethodFromOrder($order)) {
                $logger->debug("Medio de pago desconocido");
                return [];
            }

            $generatorChain = new ChainableMessageGenerator(
                new EmptyProviderLocatorSpecification(),
                new NoLocatorMessageGenerator()
            );
            $generatorChain
                ->chain(new ChainableMessageGenerator(
                    new IsProvider1Specification(),
                    new Provider1MessageGenerator()
                ))
                ->chain(new ChainableMessageGenerator(
                    new IsSoldOrReservedOrderSpecification(),
                    new SoldMessageGenerator()
                ))
                ->chain(new ChainableMessageGenerator(
                    new IsAssociatedProviderSpecification(),
                    new AssociatedProviderMessageGenerator()
                ))
                ->chain(new ChainableMessageGenerator(
                    new NotAssociatedProviderSpecification(),
                    new NoAssociatedProviderMessageGenerator()
                ));

            return $generatorChain->generate($reportableOrder);
        } catch (Exception $e) {
            return [];
        }
    }
}
```

Y el test de caracterización sigue pasando, lo que nos indica que mantenemos el comportamiento. Ahora podemos deshacernos de la clase MessagesByOrderStatusGenerator que ya no necesitamos más y que nos fue útil para aislar el nuevo código de la parte legacy. Hemos ganado en claridad y en reparto de responsabilidades.

Pero esa no es la mejor parte. En el futuro será bastante fácil hacer dos cosas:

* Añadir nuevas Specification y nuevos Generator a la cadena de responsabilidad, de modo que podamos contemplar nuevas situaciones de las que notificar o corregir los problemas que observemos.
* Eliminar el excesivo conocimiento del negocio que tiene el código hasta el punto de poder extraerlo a un archivo de configuración o a otro soporte en el que pueda ser gestionado directamente por Negocio, sin necesidad de generar una user story en caso de tener que cambiar los mensajes y las condiciones que los controlan.

Para ello, una gran herramienta son las Specification parametrizables.

## Specification parametrizable

Las Specification parametrizables nos permiten modificar su comportamiento pasándoles parámetros en el momento de instanciación, los cuales pueden utilizarse en el método isSatisfiedBy para modular su comportamiento sin tener que cambiar el código.

Así, podríamos diseñar Specification más genéricas, que expresan reglas del dominio pero que no requieren conocimientos concretos de detalles del mismo en el código.

Por ejemplo, `IsProvider1Specification` podría reemplazarse por algo así:

```php
class ProvideIdentifiedBySpecification implements Specification
{

    private $provider;

    public function __construct($provider)
    {
        $this->provider = $provider;
    }

    public function isSatisfiedBy(ReportableOrder $reportableOrder) : bool
    {
        return $reportableOrder->getProvider() === $this->provider;
    }
}
```

Creando nuevas Specification similares podremos desacoplar el código de los detalles concretos de negocio.

Por otro lado, sería posible seguir extendiendo el refactor aplicando los mismos principios que hemos seguido hasta ahora en los MessageGenerators. Podríamos incluso aplicar el patrón Chain of Responsibility si queremos disponer de toda la flexibilidad que nos proporciona.

## Final del trayecto (ahora, sí)

Este refactoring, aunque grande, no lleva tanto tiempo de trabajo como puede parecer. Lo más importante es disponer de tests que documenten el comportamiento del código que estamos refactorizando y proceder en pasos seguros, manteniéndo los tests pasando. De este modo, podemos entregar siempre que tengamos los tests en verde, dejándolo en buenas condiciones modificar el código y seguir mejorando su calidad en futuras intervenciones.

El esfuerzo de mejorar el código compensa en términos de legibilidad y sostenibilidad. Gracias a la mejor legibilidad es más fácil retomar el código en otro momento o por otro programador, de modo que las intervenciones futuras sean menos costosas. Pero además de legible, el código es más sostenible porque el nuevo diseño es más flexible y fácil de modificar, lo que contribuye igualmente a reducir el conste de la intervención.

Podemos argumentar que ciertas partes son menos importantes o necesitan cambiar con menos frecuencia, por lo que tales beneficios serían menos evidentes.

En cualquier caso, mejorar la calidad del código nos desvela patrones con los que podemos perfeccionar el diseño, aumentando su flexibilidad y capacidad de adaptación. 