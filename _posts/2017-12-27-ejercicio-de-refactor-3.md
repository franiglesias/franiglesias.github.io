---
layout: post
title: Ejercicio de refactoring (3) Intervenir y seguir o no refactorizando
categories: articles
tags: refactoring legacy
---

En el artículo anterior colé un error en la estrategia de refactoring y, antes de continuar, voy a detenerme en ese problema porque es realmente interesante.

La serie **Ejercicio de refactoring** consta de los siguientes artículos:

[Ejercicio de refactoring (1): Los test de caracterización](/ejercicio-de-refactor-1)  
[Ejercicio de refactoring (2): Extraer hasta la última gota](/ejercicio-de-refactor-2)  
[Ejercicio de refactoring (3): Intervenir y seguir o no refactorizando](/ejercicio-de-refactor-3)  
[Ejercicio de refactoring (4): Finalizando](/ejercicio-de-refactor-4)  

## El momento de intervenir

Vamos a analizar el asunto: inicialmente el motivo por el que teníamos que atacar este código era la necesidad de arreglar un problema: si un producto no estaba disponible en un determinado proveedor no sale la notificación al usuario.

Para intentar localizar el punto preciso que necesitaba atención hemos iniciado un refactor a fin de comprender mejor el código y facilitar que nos comunique cosas.

Pero ¿en qué momento el código está listo para modificar su comportamiento?

La respuesta es que no hay una respuesta única, ya que es algo que vamos afinando con la experiencia. La clave es que llegará un momento en el que nuestra comprensión del código a través del refactor nos permitirá identificar que hemos llegado a un estado en el que podemos sentirnos bastante seguros de que es el lugar en el que intervenir.

Y para eso nos hace falta un test que, al fallar, pruebe que el problema reside en el código actual.

Una pregunta que me surge a medida que escribo esto es si el test debería haber sido escrito en el momento de la caracterización. Aunque puede parecer una idea atractiva creo que hubiese introducido confusión en la información proporcionada por el TestCase.

Pero ahora sí es el momento.

### Test Driven Bug Smashing

Como decía, necesitamos un test que falle antes de arreglar el bug. Es simplemente TDD: antes de escribir código de producción, necesitamos un test que falle (y de momento lo que tenemos es un test de caracterización que no falla).

El test describirá el comportamiento deseado y, consecuentemente, la existencia de un error implica que el comportamiento actual del código no es el que queremos y el test fallará.

Puede ser una buena idea nombrar el test con referencia al error (o story) para el que lo vamos a escribir. O bien hacerlo en los comentarios.

En nuestro ejemplo, el test debe comprobar que para el Proveedor 1, en caso de no haberse logrado obtener localizador del producto, el mensaje para la notificación debe ser: "pedido no se pudo realizar"

He aquí el test:

```php
    public function testMessageForEmptyProviderLocatorWithProvider1()
    {
        $order = $this->createMock(Order::class);
        $order->method('getProviderLocator')->willReturn('');
        $order->method('getPaymentMethods')->willReturn(new PaymentMethods());
        $order->method('getId')->willReturn('123');
        $order->method('getProvider')->willReturn(Providers::PROVIDER1);

        $sut = new Notification();
        $this->assertEquals(['pedido no se pudo realizar'], $sut::getMessagesByOrderStatus($order));
    }
```

Y el test pasa… WTF!

Cuando un test que debería fallar no lo hace nos puede indicar lo siguiente:

* El test está mal hecho y no prueba lo que debería demostrar. En el ejemplo, que el test no falle contradice el hecho de que tenemos un problema en producción.
* Nuestro refactor ha provocado un cambio de comportamiento, que no hemos podido controlar precisamente por no contar con un test que caracterizase esa situación.

¿Qué ha ocurrido? En principio el test es correcto. Sin embargo, en la última fase de refactor hemos realizado un cambio que ha generado una alteración no esperada del comportamiento:

```php
// Antes
    if (Providers::isProvider1($order->getProvider())) {
        return $this->generateMessageForProvider1($order);
    }

    if (empty($order->getProviderLocator())) {
        return ['pedido no se pudo realizar'];
    }

// Después

    if (empty($order->getProviderLocator())) {
        return ['pedido no se pudo realizar'];
    }

    if (Providers::isProvider1($order->getProvider())) {
        return $this->generateMessageForProvider1($order);
    }
```

Al cambiar el orden en que se ejecutan las condicionales se ha alterado el comportamiento del método, corrigiendo, de hecho, el problema original. Si restauramos el orden de ejecución el test fallará. Y eso está muy bien.

Ahora sí, partiendo de nuestro test en rojo, podemos intervenir en la clase para corregir el error:

```php
    if (empty($order->getProviderLocator())) {
        return ['pedido no se pudo realizar'];
    }

    if (Providers::isProvider1($order->getProvider())) {
        return $this->generateMessageForProvider1($order);
    }
```

## ¿Cuándo es el momento de dejar el refactor?

En la práctica tenemos un tiempo limitado para el refactor. Una vez que hemos conseguido dejar el código en disposición de intervenir en él con cierta seguridad y resuelto la tarea definida en la story, la cuestión es si podemos seguir refinando el código para mejorar la calidad de la solución (y así favorecer futuras intervenciones) o es el momento de entregar.

La respuesta depende del compromiso de entrega adquirido, de lo clara que tengamos la estrategia de refactor y de la relevancia que pueda tener esa parte del código en concreto.

En cuanto al **compromiso de entrega** en el _sprint_ la decisión es bastante simple y se reduce a la pregunta: ¿tenemos tiempo para seguir refactorizando o el refactor es lo bastante obvio como para que no consuma demasiado de este tiempo?

En lo que respecta a **la estrategia**, cuanto más clara u obvia resulte, menos tiempo nos consumirá y, por tanto, más factible es llevarla a cabo.

Finalmente, la relevancia del código puede estar más o menos clara en cada contexto: hay partes del código que son más críticas para nuestro negocio que otras, por tanto, el esfuerzo debería concentrarse en ellas.

Con todo, la regla de dejar el código en mejor estado de cómo lo hemos encontrado siempre es de aplicación. Aunque no emprendamos refactors profundos, el hecho de que mejoremos un poco la calidad del código que revisamos contribuye a la calidad global de nuestro software y facilita la vida de quienes tengan que lidiar con él en el futuro.

Dicho esto, para nuestro ejemplo, en un entorno de trabajo real podríamos parar ahora y dejarlo en el estado actual, ya que hemos conservado el comportamiento, hemos solucionado el problema como se nos pidió y tenemos el código en un estado mejor que el original.

Pero como aquí no tenemos otros condicionantes, o suponiendo que aún disponemos de tiempo, vamos a seguir a ver a dónde nos lleva el refactor.

### Refactors (más o menos) seguros

La única forma de asegurarse de que un refactor no cambia el comportamiento es tener un test que lo demuestre, para lo cual o bien ha de existir ese test o hemos de escribirlo.

Sin embargo, hay unos cuantos refactors que podríamos aplicar dentro de ámbitos bien definidos (una clase, un método, una función) con un riesgo bastante bajo de alterar el comportamiento del código. Por ejemplo:

* **Eliminar código comentado:** ya que no hace nada, mejor quitarlo de ahí.
* **Sustituir números mágicos por constantes:** cada vez que encontremos un valor mágico (puede ser numérico o no) lo sustituimos por una constante que explique su significado.
* **Mejores nombres de variables o parámetros:** si un nombre de variable no nos explica qué significa, lo cambiamos para que sea más explícito, especialmente los nombres de una ó dos letras.
* **Introducir variables explicativas:** poner el resultado de expresiones complejas, o partes de ellas, en variables con un nombre significativo.
* **Mejores nombres de método (privados):** dentro de una clase que tenga métodos privados nos aseguramos de que sus nombres sean lo bastante significativos.
* **Extraer métodos:** con nombres significativos para encapsular condicionales combiandas complejas o para encapsular el código en las "patas" de una condicional. También podemos extraer bloques cohesivos de código dentro de métodos que sean muy largos.

En un nivel de riesgo mayor, estarían técnicas como las siguientes:

* **Reemplazar condicionales anidadas con cláusulas de guarda:** el ejemplo de single exit point frente a early return, de modo que el _happy path_ quede mucho más limpio y claro.
* **Extraer clases:** cuando la clase en la que estamos trabajando carga con demasiadas responsabilidades.

## Reorganizar el código de forma cohesiva

Nuestro siguiente movimiento debería ser reducir la duplicación de código, pero antes vamos a tener que darle una vuelta a su cohesión.

La duplicación es quizá el _smell_ más básico de todos. En TDD la duplicación de código señala el momento de comenzar la fase de refactoring, con el objetivo de eliminarla a medida que va apareciendo.

La duplicación puede darse de una manera muy explícita, en forma de bloques de código prácticamente idénticos que, normalmente, podremos atacar extrayendo a un método y sustituyendo las repeticiones por llamadas al mismo.

En nuestro ejemplo, podemos ver que los métodos `generateMessageForAssociatedProviders` y `generateMessageForNoAssociatedProviders` tienen estructuras muy similares, auqnue no sean exactamente iguales. Hay alguna sentencia if que se repite literalmente.

Sin embargo, es cierto que se puede observar que la confusa estructura con la que iniciamos esta serie de artículos ha dejado huella en la forma bastante desordenada que tiene el código y en los muchos casos que parece que podrían llegar a darse pero que no parecen cubiertos. En cualquier caso, el batiburrillo de conceptos que se revela aquí nos indica que este método ha sido construido seguramente a base de parches y añadidos a medida que las situaciones eran detectadas.

El problema que tenemos es que el código no está organizado de una manera suficientemente cohesiva: cosas que deberían estar juntas no lo están, o conceptos diferentes se encuentran intercalados.

Por ejemplo, en los métodos citados `generateMessageForAssociatedProviders` y `generateMessageForNoAssociatedProviders` hay un primer bloque que tiene que ver con que el estado del producto esté pendiente (aparentemente en relación a la forma en que se realiza el pago), de modo que hay un mensaje diferente asociado al medio de pago. Veremos esto más adelante.

Un segundo grupo de condicionales devuelve un mensaje en función del estado del producto.

Por otra parte, hay un control que no se refiere al estado del producto (`$productStatus`), sino al estado del pedido (`$orderStatus`), mezclado entre el resto de controles que se hacen a `$productStatus`. Curiosamente ese control es el mismo en los dos métodos sólo que está invertido, mostrando ese tipo de duplicación que no es obvia a primera vista:

```php
// en generateMessageForAssociatedProviders

    if ($orderStatus == PurchaseStatus::RESERVED ||
        $orderStatus == PurchaseStatus::SOLD) {
        if ($order->getResellerCode() == Resellers::RESELLER1) {
            return ['pedido confirmado con reseller 1'];
        }

        return ['pedido confirmado'];
    }
        
// en generateMessageForNoAssociatedProviders

    if ($orderStatus == PurchaseStatus::RESERVED ||
        $orderStatus == PurchaseStatus::SOLD
    ) {
        if ($order->getResellerCode() == Resellers::RESELLER2 ||
            $order->getResellerCode() == Resellers::RESELLER3 ||
            $order->getResellerCode() == Resellers::RESELLER4 ||
            $order->getResellerCode() == Resellers::RESELLER5
        ) {
            return ['pedido confirmado'];
        }

        return ['pedido confirmado reseller 1'];
    }
```

Este podría ser un buen punto para empezar a reducir duplicación de código, extrayendo el bloque a un método. Lo haremos manteniendo los tests pasando, aunque haya que hacer un pequeño arreglo en el mensaje esperado, como veremos luego.

Primero, vamos a mover el bloque en `generateMessageForAssociatedProviders` al final de método, asegurándonos de que el test sigue pasando.

```php
    if ($productStatus == OrderStatuses::CANCELLED ||
        $productStatus == OrderStatuses::REJECTED
    ) {
        return ['pedido cancelado o rechazado'];
    }

    if ($orderStatus == PurchaseStatus::RESERVED ||
        $orderStatus == PurchaseStatus::SOLD) {
        if ($order->getResellerCode() == Resellers::RESELLER1) {
            return ['pedido confirmado con reseller 1'];
        }

        return ['pedido confirmado'];
    }

    return [];
```

A continuación, lo extraemos a su propio método:

```php
        if ($orderStatus == PurchaseStatus::RESERVED ||
            $orderStatus == PurchaseStatus::SOLD) {
            return $this->generateMessageForSoldOrder($order);
        }

        return [];
    }

    private function generateMessageForSoldOrder($order)
    {
        if ($order->getResellerCode() == Resellers::RESELLER1) {
            return ['pedido confirmado con reseller 1'];
        }

        return ['pedido confirmado'];
    }
```

Y ahora, hacemos la misma sustitución en el método `generateMessageForNoAssociatedProviders`:

```php
    if ($orderStatus == PurchaseStatus::RESERVED ||
        $orderStatus == PurchaseStatus::SOLD) {
        return $this->generateMessageForSoldOrder($order);
    }

    return [];
```

Al principio, el test fallará porque los textos no coinciden exactamente. Puesto que vemos que quieren transmitir lo mismo, lo que hacemos es retocar los tests para que usen el mismo texto de notificación.

Ahora la pregunta es: si el mismo comportamiento se repite en ambos métodos, ¿no tendría sentido llevarlo al flujo principal del método `generate`?

Pues, ya que tenemos test para estar seguro, no está de más probarlo:

```php
public function generate(Order $order)
{
    try {
        $paymentMethods = PaymentMethods::getFromOrder($order);

        if (empty($order->getProviderLocator())) {
            return ['pedido no se pudo realizar'];
        }

        if (Providers::isProvider1($order->getProvider())) {
            return $this->generateMessageForProvider1($order);
        }

        $orderStatus = $order->getStatus();

        if ($orderStatus == PurchaseStatus::RESERVED ||
            $orderStatus == PurchaseStatus::SOLD) {
            return $this->generateMessageForSoldOrder($order);
        }

        if (Providers::isAssociatedProvider($order->getProvider())) {
            return $this->generateMessageForAssociatedProviders($order, $paymentMethods);
        }

        return $this->generateMessageForNoAssociatedProviders($order, $paymentMethods);
    } catch (\Exception $e) {
    }

    return [];
}
```

¡Bingo! Al hacer la prueba, todo el test de caracterización sigue pasando. Como beneficio extra nuestros métodos específicos son ahora más cohesivos: todos los if de primer nivel se refieren a la misma variable. Y esto nos indica un buen caso para usar una estructura **switch**.

## Refactor refactorizado

Normalmente, cuando escribo este tipo de artículos lo hago a medida que voy resolviendo el problema planteado. Por tanto, suele ocurrir que comienzo con una idea en la cabeza de cómo lo voy a enfocar pero, a medida que avanzo con el código, surgen ideas o leo artículos de referencia que contradicen o matizan mis planteamientos iniciales. De este modo aprendo cosas nuevas.

Así, por ejemplo, en los artículos anteriores, me planteaba que este refactor podría resolverse con un patrón Chain of Responsibility. Sin embargo, ahora mismo creo que puede hacerse de una manera bastante más sencilla: con un switch. Eso no invalida la otras solución, más sofisticada, pero resuelve el problema de una forma más pragmática y menos costosa. De hecho, nuestro test seguirá pasando:

```php
    private function generateMessageForAssociatedProviders(Order $order, $paymentMethods)
    {
        $productStatus = $order->getProductStatus();

        switch ($productStatus) {
            case $productStatus == OrderStatuses::PROVIDER_PENDING:
            case $productStatus == OrderStatuses::PENDING:
            case $productStatus == OrderStatuses::WAITING_FOR_PAYMENT:
                $paymentMethod = $this->getPaymentMethodFromOrder($order, $paymentMethods);
                if ($paymentMethod == PaymentTypes::BANK_TRANSFER) {
                    return ['pendiente de transferencia'];
                }
                if ($paymentMethod == PaymentTypes::PAYPAL || $paymentMethod == PaymentTypes::CREDIT_CARD) {
                    return ['pago a crédito'];
                }
                if ($paymentMethods->hasSelectedDebitCard()) {
                    return ['pago a débito'];
                }
                if (!$paymentMethods->requiresAuthorization()) {
                    return ['pago no requiere autorización'];
                }
                return [];
            case OrderStatuses::WAITING_FOR_SHIPMENT:
                if ($paymentMethods->hasSelectedDebitCard()) {
                    return ['pago confirmado pendiente de envio'];
                }
                return ['pendiente de cobro'];
            case OrderStatuses::PENDING_PROVIDER_ERROR:
            case OrderStatuses::ERROR:
                return ['pedido no confirmado por error de proveedor'];
            case OrderStatuses::CANCELLED:
            case OrderStatuses::REJECTED:
                return ['pedido cancelado o rechazado'];
            default:
                return [];
        }
    }

    private function generateMessageForNoAssociatedProviders(Order $order, $paymentMethods)
    {
        $productStatus = $order->getProductStatus();

        switch ($productStatus) {
            case OrderStatuses::PROVIDER_PENDING:
            case OrderStatuses::PENDING:
                $paymentMethod = $this->getPaymentMethodFromOrder($order, $paymentMethods);
                if ($paymentMethod == PaymentTypes::BANK_TRANSFER) {
                    return ['pendiente de transferencia'];
                }
                if ($paymentMethod == PaymentTypes::PAYPAL) {
                    return ['pendiente de paypal'];
                }
                if ($paymentMethod == PaymentTypes::CREDIT_CARD ||
                    $paymentMethod == PaymentTypes::DEBIT_CARD) {
                    return ['pendiente de pago con tarjeta'];
                }
                if ($paymentMethods->requiresAuthorization()) {
                    return ['pendiente de autorización'];
                }
                return ['pendiente de cobro'];
            case OrderStatuses::WAITING_FOR_SHIPMENT:
                return ['pendiente de envio'];
            case OrderStatuses::CANCELLED:
                return ['pedido cancelado'];
            case OrderStatuses::PENDING_PROVIDER_ERROR:
                return ['pendiente por error en proveedor'];
            default:
                return [];
        }
    }
```

Aunque switch es una estructura no muy apreciada, en este caso hace que el código sea mucho más limpio y legible y, coo bonus, nos permite cohesionar todo lo que tiene que ver con la variable `$paymentMethod`. Ese bloque de código tiene toda la pinta de poder refactorizarse en un nuevo **switch**, pero nosotros no queremos anidarlo, sino que vamos a extraer primero esos bloques a sendos métodos. Luego los reescribimos en forma de **switch** y éste es el resultado, tras algunos ajustes necesarios para pasar el test:


```php
    private function generateMessageForAssociatedProviders(Order $order, $paymentMethods)
    {
        $productStatus = $order->getProductStatus();

        switch ($productStatus) {
            case $productStatus == OrderStatuses::PROVIDER_PENDING:
            case $productStatus == OrderStatuses::PENDING:
            case $productStatus == OrderStatuses::WAITING_FOR_PAYMENT:
                return $this->generateMessageForAssocProvidersAndPaymentmethod($order, $paymentMethods);
            case OrderStatuses::WAITING_FOR_SHIPMENT:
                if ($paymentMethods->hasSelectedDebitCard()) {
                    return ['pago confirmado pendiente de envio'];
                }
                return ['pendiente de cobro'];
            case OrderStatuses::PENDING_PROVIDER_ERROR:
            case OrderStatuses::ERROR:
                return ['pedido no confirmado por error de proveedor'];
            case OrderStatuses::CANCELLED:
            case OrderStatuses::REJECTED:
                return ['pedido cancelado o rechazado'];
            default:
                return [];
        }
    }

    private function generateMessageForNoAssociatedProviders(Order $order, $paymentMethods)
    {
        $productStatus = $order->getProductStatus();
        switch ($productStatus) {
            case OrderStatuses::PROVIDER_PENDING:
            case OrderStatuses::PENDING:
                return $this->generateMessageForNoAssocProviderAndPaymentMethod($order, $paymentMethods);
            case OrderStatuses::WAITING_FOR_SHIPMENT:
                return ['pendiente de envio'];
            case OrderStatuses::CANCELLED:
                return ['pedido cancelado'];
            case OrderStatuses::PENDING_PROVIDER_ERROR:
                return ['pendiente por error en proveedor'];
            default:
                return [];
        }
    }

    private function generateMessageForNoAssocProviderAndPaymentMethod(Order $order, $paymentMethods) : array
    {
        if ($paymentMethods->requiresAuthorization()) {
            return ['pendiente de autorización'];
        }
        $paymentMethod = $this->getPaymentMethodFromOrder($order, $paymentMethods);
        switch ($paymentMethod) {
            case PaymentTypes::BANK_TRANSFER:
                return ['pendiente de transferencia'];
            case PaymentTypes::PAYPAL:
                return ['pendiente de paypal'];
            case PaymentTypes::CREDIT_CARD:
            case PaymentTypes::DEBIT_CARD:
                return ['pendiente de pago con tarjeta'];
            default:
                return ['pendiente de cobro'];
        }
    }

    private function generateMessageForAssocProvidersAndPaymentmethod(Order $order, $paymentMethods) : array
    {
        $paymentMethod = $this->getPaymentMethodFromOrder($order, $paymentMethods);
        switch ($paymentMethod) {
            case PaymentTypes::BANK_TRANSFER:
                return ['pendiente de transferencia'];
            case PaymentTypes::PAYPAL:
            case PaymentTypes::CREDIT_CARD:
            return ['pago a crédito'];
            case PaymentTypes::DEBIT_CARD:
                return ['pago a débito'];
            default:
                if (!$paymentMethods->requiresAuthorization()) {
                    return ['pago no requiere autorización'];
                }
                return [];
        }
    }
```

A simple vista el código tiene ahora muchísima mejor pinta, pero… Siempre hay algún pero.

Los métodos que hemos extraído para generar el mensaje en base al método de pago utilizan "And" en su nombre y eso siempre nos tiene que llevar a reflexionar. El problema es que las responsabilidades de generar los mensajes para cada tipo de proveedor son lo bastante específicas para delegarlas en sus propios generadores. Así pues, podríamos extraer las nuevas clases. La signatura de ambos métodos es la misma y eso sugiere que podríamos extraer una interfaz común `MessageGenerator` con un método público `generate`.

Ahora bien, analizando un poco el código podemos ver varias cosas:

* Ambos métodos necesitan la funcionalidad del método `getPaymentMethodFromOrder` de la clase `MessagesByOrderStatusGenerator`, funcionalidad que, en el fondo, es ajena a las responsabilidades de la clase. El código de este método nos dice que podría pertenecer perfectamente al objeto `$paymentMethods`. Lo único particular es que se logea si el método es desconcido.
* La clase `MessagesByOrderStatusGenerator` es también un Generator, salvo que no requiere el parámetro $paymentMethods, que se obtiene "dentro". ¿Por qué no inyectarlo igualmente en `generate` y así hacer que la clase sea un `MessageGenerator` más? Al fin y al cabo, tenemos la seguridad de trabajar en el ámbito del método estático de la clase original.

Por lo tanto, vamos a empezar con un refactor bastante más profundo.

## Extracción de clases

Al estar protegidos por el test de caracterización los cambios que hacemos en el ámbito del método estático original quedan automáticamente cubiertos, pues actúa como test de aceptación. Obviamente, no resulta muy práctico reproducir todo el test case (recuerda: tiene cincuenta y tantos tests) para desarrollar la clase `MessagesByOrderStatusGenerator` mediante TDD, por eso no lo hemos hecho.

Pero ahora que vamos a trasladar funcionalidad a clases ya existentes o a otras nuevas sería conveniente utilizar la metodología TDD, aunque ya sepamos que el código que vamos a mover funciona.

Así que comenzaríamos el desarrollo del método `getPaymentMethodFromOrder` de la clase `PaymentMethods`, creando un primer test que falle, reescribiendo la funcionalidad necesaria hasta trasladarla toda. El resultado sería algo así:

```php
    public function getPaymentMethodFromOrder(Order $order)
    {
        $selectedPaymentMethod = $this->getSelectedPaymentMethod();
        if ($selectedPaymentMethod !== null) {
            return $selectedPaymentMethod->getPaymentMethodType()->getIdTipoMedioDePago();
        }
        if ($order->getDestinationCountry() == Country::FRANCE && $order->getId() < 745) {
            return PaymentTypes::PAYPAL;
        }
        return null;
    }
``` 

Ahora sustituimos el código por la llamada al nuevo método de la clase: inicialmente, de manera conservadora:

```php
    protected function getPaymentMethodFromOrder(Order $order, $paymentMethods)
    {
        $paymentMethod = $paymentMethods->getPaymentMethodFromOrder($order);
        if (!$paymentMethod) {
            $this->logger->debug("Medio de pago desconocido");
            return null;
        }
        return $paymentMethod;
    }
```

Pero al pasar el test surgen problemas. Hasta ahora teníamos un _stub_ de `PaymentMethods` y ahora necesitamos modificarlo para reconocer la nueva funcionalidad de la clase. Nuestro problema es que hemos llegado tarde a este refactor y nuestro test se ve afectado. La moraleja es que seguramente deberíamos haber encapsulado la funcionalidad mucho antes.

Pero es interesante ver que nuestro método para crear el stub es mucho más sencillo, y eso es bueno ya que hemos ocultado un montón de destalles que realmente sólo importaban a `PaymentMethods`:

```php
class PaymentMethodsStubFactory extends TestCase
{
    public function getPaymentMethods($selectedMethod) : MockObject
    {
        return $this->configurePaymentMethods($selectedMethod);
    }

    public function getDebitCard() : MockObject
    {
        return $this->configurePaymentMethods(PaymentTypes::DEBIT_CARD, true);
    }

    public function getMethodWithRequiredAuthorization() : MockObject
    {
        return $this->configurePaymentMethods(PaymentTypes::REQUIRED_AUTHORIZATION_PAYMENT, false, true);
    }

    protected function configurePaymentMethods(
        string $selectedMethod,
        bool $isDebitCard = false,
        bool $requiresAuth = false) : MockObject
    {
        $paymentMethods = $this->createMock(PaymentMethods::class);
        $paymentMethods->method('getFromOrder')->willReturn($paymentMethods);
        $paymentMethods->method('hasSelectedDebitCard')->willReturn($isDebitCard);
        $paymentMethods->method('requiresAuthorization')->willReturn($requiresAuth);
        $paymentMethods->method('getPaymentMethodFromOrder')->willReturn($selectedMethod);
        return $paymentMethods;
    }
}
```

Para poder usar en condiciones `PaymentMethods` y simplificar el código necesitamos hacer algo con el logeo en caso de que no haya método de pago seleccionado. No cabe la posibilidad de hacer el log desde el propio `PaymentMethods`. Mi hipótesis es que bastaría comprobarlo al principio, loguear y devolver el mensaje vacío.

```php
    public function generate(Order $order)
    {
        try {
            $paymentMethods = PaymentMethods::getFromOrder($order);

            if (empty($order->getProviderLocator())) {
                return ['pedido no se pudo realizar'];
            }

            if (null === $paymentMethods->getPaymentMethodFromOrder($order)) {
                $this->logger->debug("Medio de pago desconocido");
                return [];
            }

            if (Providers::isProvider1($order->getProvider())) {
                return $this->generateMessageForProvider1($order);
            }
            
    //...
```

Pero si hago esto, comienzan a fallar un montón de tests. El problema es que en los tests que fallan no he preparado un _stub_ de `Order` con un `PaymentMethods` adecuado. Para arreglar esto, tengo que cambiar los stub de Order que utilizan un PaymentMethod indefinido (en OrderStubFactory se identifican porque usan `new PaymentMethods` en lugar de un _stub_ de `PaymentMethods`).

Resuelto esto, podemos avanzar en nuestro trabajo, sustituyendo las llamadas al método `getPaymentMethodFromOrder` de la clase `MessagesByOrderStatusGenerator` por el de `PaymentMethods` y eliminando aquél. Ahora estamos en condiciones de extraer los generadores. Para no alargar el artículo, aquí tenemos la interfaz y uno de los generadores extraídos:

```php
<?php

namespace Refactor;


use Order;
use PaymentMethods;

interface MessageGenerator
{
    public function generate(Order $order, PaymentMethods $paymentMethods);
}
```

```php
<?php

namespace Refactor;


use Order;
use OrderStatuses;
use PaymentMethods;
use PaymentTypes;

class AssociatedProviderMessageGenerator implements MessageGenerator
{
    public function generate(Order $order, PaymentMethods $paymentMethods)
    {
        $productStatus = $order->getProductStatus();

        switch ($productStatus) {
            case OrderStatuses::PROVIDER_PENDING:
            case OrderStatuses::PENDING:
            case OrderStatuses::WAITING_FOR_PAYMENT:
                return $this->generateMessageForPaymentMethod($order, $paymentMethods);
            case OrderStatuses::WAITING_FOR_SHIPMENT:
                if ($paymentMethods->hasSelectedDebitCard()) {
                    return ['pago confirmado pendiente de envio'];
                }
                return ['pendiente de cobro'];
            case OrderStatuses::PENDING_PROVIDER_ERROR:
            case OrderStatuses::ERROR:
                return ['pedido no confirmado por error de proveedor'];
            case OrderStatuses::CANCELLED:
            case OrderStatuses::REJECTED:
                return ['pedido cancelado o rechazado'];
            default:
                return [];
        }
    }

    private function generateMessageForPaymentMethod(Order $order, PaymentMethods $paymentMethods) : array
    {
        $paymentMethod = $paymentMethods->getPaymentMethodFromOrder($order);
        switch ($paymentMethod) {
            case PaymentTypes::BANK_TRANSFER:
                return ['pendiente de transferencia'];
            case PaymentTypes::PAYPAL:
            case PaymentTypes::CREDIT_CARD:
                return ['pago a crédito'];
            case PaymentTypes::DEBIT_CARD:
                return ['pago a débito'];
            default:
                if (!$paymentMethods->requiresAuthorization()) {
                    return ['pago no requiere autorización'];
                }
                return [];
        }
    }

}
```

Finalmente, así queda el método `generate` de `MessagesByOrderStatusGenerator`:

```php
    public function generate(Order $order)
    {
        try {
            $paymentMethods = PaymentMethods::getFromOrder($order);

            if (empty($order->getProviderLocator())) {
                return ['pedido no se pudo realizar'];
            }

            if (null === $paymentMethods->getPaymentMethodFromOrder($order)) {
                $this->logger->debug("Medio de pago desconocido");
                return [];
            }

            if (Providers::isProvider1($order->getProvider())) {
                return $this->generateMessageForProvider1($order);
            }

            $orderStatus = $order->getStatus();

            if ($orderStatus == PurchaseStatus::RESERVED ||
                $orderStatus == PurchaseStatus::SOLD) {
                return $this->generateMessageForSoldOrder($order);
            }

            if (Providers::isAssociatedProvider($order->getProvider())) {
                $generator = new AssociatedProviderMessageGenerator();
                return $generator->generate($order, $paymentMethods);
            }

            $generator = new NoAssociatedProviderMessageGenerator();
            return $generator->generate($order, $paymentMethods);
        } catch (\Exception $e) {
        }

        return [];
    }
```

Todavía sería posible profundizar en nuestro refactor pero, de momento, vamos a parar aquí. Puedes ver el código completo en el [repositorio del proyecto](https://github.com/franiglesias/refactoring). Los siguientes pasos serían invertir la dependencia de PaymentMethods lo que nos permitiría hacer que la clase implemente la interfaz que acabamos de definir, extraer los métodos específicos que todavía quedan y algunos otros refinamientos.

Pero esos temas, y algunos otros, los dejaremos para la cuarta y, espero, última entrega de esta serie.
