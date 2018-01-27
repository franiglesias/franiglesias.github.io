---
layout: post
title: Ejercicio de refactor (2) Extraer hasta la última gota
categories: articles
tags: [refactor, legacy]
---

Una vez que hemos conseguido describir con tests el comportamiento del método que nos interesa, llega el momento de refactorizar. Queremos cambiar la implementación, pero no alterar el comportamiento público del método. Por lo tanto, los tests han de permanecer en verde tras cada cambio, procurando que la fase roja dure lo menos posible, lo que implica realizar baby-steps y no grandes refactors de una sentada.

La serie **Ejercicio de refactoring** consta de los siguientes artículos:

[Ejercicio de refactoring (1): Los test de caracterización](/ejercicio-de-refactor-1)  
[Ejercicio de refactoring (2): Extraer hasta la última gota](/ejercicio-de-refactor-2)  
[Ejercicio de refactoring (3): Intervenir y seguir o no refactorizando](/ejercicio-de-refactor-3)  
[Ejercicio de refactoring (4): Finalizando](/ejercicio-de-refactor-4)  

Este es el archivo en cuestión:

{% gist 5b4fa5d83ac0fb113d4253560dae2bc6 %}

Así que ahora comienza el trabajo.

## Primera limpieza

Los primeros pasos que vamos a dar son sencillos y consisten en corregir los problemas más evidentes, como puede ser borrar una variable que no se utiliza:

```php
// Antes

if ($selectedPaymentMethod == null) {
    $logger = Logger::getInstance();
    $purchaseId = $order->getPurchaseId();
    $orderId = $order->getId();
    $logger->debug("Medio de pago desconocido");
    if ($order->getDestinationCountry() == Country::FRANCE && $orderId < 745) {
        $paymentMethod = PaymentTypes::PAYPAL;
    }
} else {
    $paymentMethod = $selectedPaymentMethod->getPaymentMethodType()->getIdTipoMedioDePago();
}

// Después

if ($selectedPaymentMethod == null) {
    $logger = Logger::getInstance();
    $orderId = $order->getId();
    $logger->debug("Medio de pago desconocido");
    if ($order->getDestinationCountry() == Country::FRANCE && $orderId < 745) {
        $paymentMethod = PaymentTypes::PAYPAL;
    }
} else {
    $paymentMethod = $selectedPaymentMethod->getPaymentMethodType()->getIdTipoMedioDePago();
}
```

En estos casos, el IDE es un buen aliado al señalar este tipo de situaciones. Si vemos algún punto más que sea de refactor rápido lo podemos hacer ahora, con lo que despejamos un poco más el terreno.

Hay varios puntos llamativos en el método. En primer lugar el bloque try/catch, y en segundo el frondoso bosque de if/else.

## Empezando desde arriba

Lo mejor es empezar por aquello que veamos más claro cómo atacar y luego proceder por pequeños pasos. Es posible que ahora veas claro que, a la larga, puedes aplicar tal o cual patrón. Sin embargo, suele dar mejores resultados ir poco a poco. Me explico: si intentas un refactor masivo es posible que rompas la funcionalidad, lo que se reflejará en muchos tests que dejan de pasar a la vez, y tengas parado ese trozo de código en rojo mucho tiempo. Pero si vas paso por paso, manteniendo los test en verde la mayor parte del tiempo tendrás el código listo para entregar en cualquier momento.

Para este ejemplo, no tengo especial querencia de empezar por una u otra parte, así que primero voy a ir de arriba hacia abajo. Por lo que mi punto de ataque inicial serán las líneas que con las que arranca el método y el bloque try/catch en particular.

Lo primero que no me gusta es el type casting de las líneas 16 y 17, que no debería ser necesario si garantizamos que los métodos llamados en $order devuelven int mediante un return type. En este caso, el refactor nos lleva a modificar otra clase, pero es que no tiene ningún sentido no poder confiar en lo que nos entrega el objeto Order. Hay que tomar nota para vigilar esto.

```php
//Antes
        $productStatus = (int) $order->getProductStatus();
        $orderStatus = (int) $order->getStatus();
        $providerLocator = $order->getProviderLocator();
        
//Después
        $productStatus = $order->getProductStatus();
        $orderStatus = $order->getStatus();
        $providerLocator = $order->getProviderLocator();
```

En cuanto al try/catch, el problema que tenemos es entender qué puede tener que lanzar una excepción, y parece claro que sería `PaymentMethods::getFromOrder`, que tiene toda la pinta de ser un named constructor. Como no tenemos tests que cubran esta situación vamos a añadirlo ahora simulando que se lanza la excepción y viendo el resultado. Para eso es necesario hacer una pequeña trampa.

```php
    public function testPaymentMethodsThrowsException()
    {
        $order = $this->createMock(Order::class);
        $order->method('getProviderLocator')->willReturn('locator');
        $order->method('getId')->willReturn('123');
        $order->method('getProvider')->willReturn(Providers::PROVIDER2);
        $order->method('getPaymentMethods')->willThrowException(new Exception());

        $sut = new Notification();
        $this->assertEquals([], $sut->getMessagesByOrderStatus($order));
    }
```

El test muestra que en el caso de lanzarse una excepción y no se pueda determinar el método de pago, no se devuelve ningún mensaje, lo cual es intrigante y debería llevarnos a preguntar a Negocio qué puede significar eso y cómo deberíamos responder.

Creo que podemos concluir que revela un fallo de diseño del sistema que, tal vez, no se ha puesto de manifiesto porque no ha llegado a darse el caso. Para arreglar esto vamos a necesitar organizar el código de otra manera, así que vamos a dejarlo aparcado durante un rato.

```php
    $paymentMethod = null;

    try {
        $paymentMethods = PaymentMethods::getFromOrder($order);
        $selectedPaymentMethod = $paymentMethods->getSelectedPaymentMethod();
        if ($selectedPaymentMethod == null) {
            $logger = Logger::getInstance();
            $orderId = $order->getId();
            $logger->debug("Medio de pago desconocido");
            if ($order->getDestinationCountry() == Country::FRANCE && $orderId < 745) {
                $paymentMethod = PaymentTypes::PAYPAL;
            }
        } else {
            $paymentMethod = $selectedPaymentMethod->getPaymentMethodType()->getIdTipoMedioDePago();
        }
    } catch (Exception $e) {
    }
```

## Programar sin else

En primer lugar vamos a refactorizar el primer nivel de condicionales usando el patrón _early return_, ya que una vez que entramos en una de las ramas no vamos a volver a pasar por ninguna de las otras. Por tanto, podemos aplanar un poco el método, eliminando, de paso, los else.

```php
// Antes

if (Providers::isProvider1($order->getProvider())) {
    if ($productStatus == OrderStatuses::PENDING_PROVIDER_ERROR||
        $productStatus == OrderStatuses::PENDING
    ) {
        $lines[] = 'pedido no confirmado con provider 1';
    } elseif ($productStatus == OrderStatuses::CANCELLED) {
        $lines[] = 'pedido cancelado';
    }
}

// Después

if (Providers::isProvider1($order->getProvider())) {
    if ($productStatus == OrderStatuses::PENDING_PROVIDER_ERROR||
        $productStatus == OrderStatuses::PENDING
    ) {
        return ['pedido no confirmado con provider 1'];
    }
    if ($productStatus == OrderStatuses::CANCELLED) {
        return ['pedido cancelado'];
    }
}
```

El primer `elseif` se tiene que convertir en if, y como también le toca retornar pronto, nos permite eliminar el último `else` y aplanar la parte más compleja del código.

```php
// Antes
elseif (empty($providerLocator)) {
    $lines[] = 'pedido no se pudo realizar';
} else {

// Después
if (empty($providerLocator)) {
    return ['pedido no se pudo realizar'];
}
```

Si este método no fuese estático una de las aproximaciones sería extraer las distintas patas del if a diferentes métodos, pero ese carácter estático lo dificulta bastante.

Así que vamos a seguir el caminio de reducir la complejidad, eliminando niveles de anidación de condicionales. Ya veremos dónde nos lleva esto.

Por ejemplo, así hemos podido aplanar este bloque:

```php
// Antes
if ($productStatus == OrderStatuses::PROVIDER_PENDING ||
    $productStatus == OrderStatuses::PENDING ||
    $productStatus == OrderStatuses::WAITING_FOR_PAYMENT
) {
    if ($paymentMethod == PaymentTypes::BANK_TRANSFER) {
        $lines[] = 'pendiente de transferencia';
    } else {
        if ($paymentMethod == PaymentTypes::PAYPAL ||
            $paymentMethod == PaymentTypes::CREDIT_CARD) {
            $lines[] = 'pago a crédito';
        } else {
            if ($paymentMethods->hasSelectedDebitCard()) {
                $lines[] = 'pago a débito';
            } elseif (!$paymentMethods->requiresAuthorization()) {
                $lines[] = 'pago no requiere autorización';
            }
        }
    }
}

// Después
if ($productStatus == OrderStatuses::PROVIDER_PENDING ||
    $productStatus == OrderStatuses::PENDING ||
    $productStatus == OrderStatuses::WAITING_FOR_PAYMENT
) {
    if ($paymentMethod == PaymentTypes::BANK_TRANSFER) {
        return ['pendiente de transferencia'];
    }
    if ($paymentMethod == PaymentTypes::PAYPAL ||
        $paymentMethod == PaymentTypes::CREDIT_CARD) {
        return ['pago a crédito'];
    }
    if ($paymentMethods->hasSelectedDebitCard()) {
        return ['pago a débito'];
    }
    if (!$paymentMethods->requiresAuthorization()) {
        return ['pago no requiere autorización'];
    }
}
```

Al trabajar en pasos pequeños podemos proceder con más seguridad, comprobando en cada momento que los tests siguen pasando.

Siguiendo con la línea emprendida hemos aplicado el principio de return early y hemos podido reducir la profundidad de anidacion de condicionales gracias a eliminar varias sentencias else. Nuestro punto de mira se dirige ahora hacia los elseif, que se pueden convertir en if simples.

Con esto hemos conseguido aplanar la estructura del código, que ahora parece mucho más fácil de leer y bastante menos enrevesado.

{% gist aadf824e2509ecc945fd572fd6053af2 %}

## Más limpieza

Al despejar el código aparecen algunas inconsistencias. Por ejemplo, la línea 23 se repite en la 52 y la 112 innecesariamente, por lo que podemos eliminar estas últimas. Al ejecutar los tests comprobamos que el comportamiento no ha cambiado y no se lanzan errores.

La variable `$lines` no es realmente necesaria ahora, por lo que podemos eliminarla y devolver un array vacío para los casos que no quedan cubiertos por este método.

Y ya que menciono este punto, el aplanamiento de la estructura hace aflorar el problema que ya vismos antes con este método: parece que hay situaciones no cubiertas por los tests, pero que tampoco están cubiertas por el propio método. En el artículo anterior señalábamos que la tarea original consistía precisamente en corregir ese problema con un caso que no devolvía el mensaje correcto.

Hemos despejado bastante el código y, auqnue todavía tenemos mucho margen de mejora en el refactor, estaríamos en condiciones de enfrentarnos ahora al problema planteado en la historia actual y continuar refatorizando una vez lograda la solución. La otra opción es continuar con un refactor más agresivo.

## ¿Por qué tenemos ahora el código en mejor estado?

Aunque hace lo mismo, el código está ahora en un mejor estado porque comunica más cosas.

En primer lugar, nos indica con más claridad los puntos en los que tenemos problemas.

En segundo lugar, la estructura es mucho más expresiva: ahora, en lugar de un laberinto de caminos, nos está indicando que cumpliéndose ciertas condiciones, responderá con un mensaje determinado. Como señalábamos en el artículo anterior de la serie, aquello tenía pinta de ser un caso de un patrón de Cadena de Responsabilidad, y ahora la estructura lo hace casi evidente.

Sólo con esto, ya habríamos mejorado bastante las cosas, no sólo el código es más limpio, sino que tenemos tests. Pero nosotros queremos más.

El camino a continuación pasaría por ir definiendo las reglas que formarán la cadena y reemplazando las estructuras if por ellas.

Pero antes, lo que vamos a hacer es librarnos de las ataduras que nos empone el carácter estático de este método.

## Hagamos una clase con esto

La clase Notification tiene sus métodos estáticos y eso complica las cosas. Lo que vamos a hacer ahora es librarnos de esa dificultad. Para ello reemplazaremos el método `getMessagesByOrderStatus` por una clase que podríamos llamar `MessagesByOrderStatusGenerator` (esto te sonará de un ejemplo del libro de Feathers).

Al fin y al cabo, la clase es un generador de notificaciones, que bien podría estar orquestando a un grupo de generadores más especializados que, juntos, componen nuestras notificaciones al usuario.

Estos son los pasos que seguiremos:

Crearemos la nueva clase `MessagesByOrderStatusGenerator`, con un método `generate` y que recibe el parámetro Order.

```php
class MessagesByOrderStatusGenerator
{
    public function generate(Order $order)
    {
  
    }
}
```
 
Copiaremos todo el código de `Notificacion::getMessagesByOrderStatus` y lo pegamos como cuerpo de método generate de la clase `MessagesByOrderStatusGenerator`.

Reemplazaremos el cuerpo del método Notificacion::getMessagesByOrderStatus con la instanciación de `MessagesByOrderStatusGenerator` y una llamada a su método `generate`, retornando lo que éste devuelve.

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
        $generator = new MessagesByOrderStatusGenerator();
        return $generator->generate($order);
    }
}
```

Y, finalmente, ejecutamos los tests para comprobar que siguen pasando. Seguramente habrá que asegurarse de que importamos las clases utilizadas y demás, pero el test nos lo va indicando, por lo que no debemos continuar hasta haber vuelto a verde, que debería ser pronto.

## Nuevas condiciones

Mover el método a una clase no estática nos va a proporcionar una flexiblidad de la que antes no disponíamos: inyectar dependencias, extraer métodos, etc. Mantendremos el comportamiento de la clase bajo control gracias al tests de caracterización que ya teníamos y podremos crear nuevos test para refactorizar nuestro nuevo Generator.

Lo primero que me interesa ahora es hacer algo con el Logger y arreglar un poco esa parte del código. Para ser precisos, voy a sacar la dependencia e inyectarla. En la versión estática no podía hacer un test para cubrir esto, pero ahora sí, por lo que crearé un nuevo TestCase, que por el momento va a fallar.

```php
<?php

namespace Refactor\Tests;

use Order;
use PaymentMethods;
use Refactor\MessagesByOrderStatusGenerator;
use PHPUnit\Framework\TestCase;

class MessagesByOrderStatusGeneratorTest extends TestCase
{

    public function testLogsUnknownPaymentMethod()
    {
        $logger = $this->createMock(\Logger::class);
        $logger->expects($this->once())->method('debug')->with('Medio de pago desconocido');

        $paymentMethods = $this->createMock(PaymentMethods::class);
        $paymentMethods->method('getFromOrder')->willReturn($paymentMethods);
        $paymentMethods->method('getSelectedPaymentMethod')->willReturn(null);

        $order = $this->createMock(Order::class);
        $order->method('getProviderLocator')->willReturn('123');
        $order->method('getPaymentMethods')->willReturn($paymentMethods);
        $order->method('getId')->willReturn('123');
        $order->method('getProvider')->willReturn(0);

        $sut = new MessagesByOrderStatusGenerator($logger);
        $this->assertEquals([], $sut->generate($order));
    }
}

```

El test va a fallar porque todavía no hemos realizado el refactor, que quedará más o menos así (de paso he aprovechado para poner inline la variable $orderId que tan solo se usa en ese lugar):

```php
class MessagesByOrderStatusGenerator
{
    /**
     * @var Logger
     */
    private $logger;

    public function __construct(Logger $logger)
    {
        $this->logger = $logger;
    }

    public function generate(Order $order)
    {
        $productStatus = (int) $order->getProductStatus();
        $orderStatus = (int) $order->getStatus();
        $providerLocator = $order->getProviderLocator();
        $paymentMethod = null;

        try {
            $paymentMethods = PaymentMethods::getFromOrder($order);
            $selectedPaymentMethod = $paymentMethods->getSelectedPaymentMethod();
            if ($selectedPaymentMethod == null) {
                $this->logger->debug("Medio de pago desconocido");
                if ($order->getDestinationCountry() == Country::FRANCE && $order->getId() < 745) {
                    $paymentMethod = PaymentTypes::PAYPAL;
                }
            } else {
                $paymentMethod = $selectedPaymentMethod->getPaymentMethodType()->getIdTipoMedioDePago();
            }
        } catch (\Exception $e) {
        }
    
    
    // ...
       
    }
```

Ahora fallará nuestro Test de caracterización, por lo que haremos un pequeño arreglo a fin de pasar el logger:

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
Ahora es un buen momento para atacar definitivamente el bloque try…catch. La función de este bloque es obtener el PaymentMethod, así que hagamos esto explícito extrayéndolo a un método:

```php
    protected function getPaymentMethodFromOrder(Order $order, $paymentMethods)
    {
        $selectedPaymentMethod = $paymentMethods->getSelectedPaymentMethod();
        if ($selectedPaymentMethod == null) {
            $this->logger->debug("Medio de pago desconocido");
            if ($order->getDestinationCountry() == Country::FRANCE && $order->getId() < 745) {
                $paymentMethod = PaymentTypes::PAYPAL;
            }
        } else {
            $paymentMethod = $selectedPaymentMethod->getPaymentMethodType()->getIdTipoMedioDePago();
        }

        return $paymentMethod;
    }
```

Comprobamos que siguen pasando los tests y vemos que podemos refactorizar para mayor limpieza:

```php
    protected function getPaymentMethodFromOrder(Order $order, $paymentMethods)
    {
        $selectedPaymentMethod = $paymentMethods->getSelectedPaymentMethod();
        if ($selectedPaymentMethod !== null) {
            return $selectedPaymentMethod->getPaymentMethodType()->getIdTipoMedioDePago();
        }
        if ($order->getDestinationCountry() == Country::FRANCE && $order->getId() < 745) {
            return PaymentTypes::PAYPAL;
        }
        $this->logger->debug("Medio de pago desconocido");
        return null;
    }
```

Tras esta operación, los tests están en verde, y nuestro bloque try… catch ha quedado algo mejor, aunque todavía no me convence, pero necesitaremos usar $paymentMethods más adelante.

```php
    try {
        $paymentMethods = PaymentMethods::getFromOrder($order);
        $paymentMethod = $this->getPaymentMethodFromOrder($order, $paymentMethods);
    } catch (\Exception $e) {
    }
```

La pregunta que puedes hacerte ahora es si no sería mejor aplicar la ley de Demeter (principio Tell, don't ask) aquí porque si algo nos está mostrando este refactor es que estos objetos nuestros hablan con cualquiera y tiran de métodos de objetos que están dentro de otros objetos con toda la libertad del mundo. Lo ideal sería interactuar sólo con Order, pero ese cambio lo haremos seguramente en la próxima entrega de la serie.

De momento, seguimos con las extracciones.

## Extraer, extraer y extraer

A continuación, vamos a ir extrayendo, uno por uno, los bloques de código que están bajo los if. De nuevo, vamos a explicitar lo que están haciendo, de modo que en un primer nivel de abstracción el método nos diga lo que está pasando. Además, la extracción hará que sea más fácil entender cómo se relacionan las variables internas del método.

La mecánica es sencilla: seleccionamos un bloque de código y lo copiamos en el cuerpo de un método privado nuevo, dándole un nombre que refleje claramente lo que hace. Después de cada cambio, vuelve a pasar los tests para comprobar que todo ha ido bien. El resultado, sería algo como lo que sigue:

```php
    public function generate(Order $order)
    {
        $productStatus = (int) $order->getProductStatus();
        $orderStatus = (int) $order->getStatus();
        $providerLocator = $order->getProviderLocator();
        $paymentMethod = null;

        try {
            $paymentMethods = PaymentMethods::getFromOrder($order);
            $paymentMethod = $this->getPaymentMethodFromOrder($order, $paymentMethods);
        } catch (\Exception $e) {
        }

        if (Providers::isProvider1($order->getProvider())) {
            return $this->generateMessageForProvider1($productStatus);
        }

        if (empty($providerLocator)) {
            return ['pedido no se pudo realizar'];
        }

        if (Providers::isAssociatedProvider($order->getProvider())) {
            return $this->generateMessageForAssociatedProviders($order, $productStatus, $orderStatus, $paymentMethod, $paymentMethods);
        }

        return $this->generateMessageForNoAssociatedProviders($order, $productStatus, $orderStatus, $paymentMethod, $paymentMethods);
    }
```

Y las consecuencias más importantes son dos:

El test de caracterización falla porque, finalmente, hemos conseguido que el bloque try…catch nos estalle en la cara. De momento, queremos que el test pase, por lo que aplicamos esta solución sencilla:

```php
    try {
        $paymentMethods = PaymentMethods::getFromOrder($order);
        $paymentMethod = $this->getPaymentMethodFromOrder($order, $paymentMethods);
    } catch (\Exception $e) {
        return [];
    }
``` 

La segunda consecuencia es que podemos ver algo interesante: los parámetros `$productStatus` y `$orderStatus` que pasamos junto con `$order` los podemos obtener de éste último y no necesitamos pasar más que éste, y lo mismo podríamos decir de `$paymentMethod` respecto de `$paymentMethods`. Así que podríamos refactorizar los métodos que los consumen para que reciban sólo los parámetros imprescindibles.

Esto nos da el resultado siguiente, en el que, además, hemos ordenado un poco el código, aunque todavía no hemos tocado los métodos extraídos, algo que dejo para próximas entregas.

{% gist d8c9ce4f8793080a7f0cd648f1ea18a3 %}

El código nos ofrece ahora varias vías de mejora:

* Extraer bloques de código de los métodos "generateXXX".
* Extraer estos mismos métodos a clases XXXGenerator, que implementen una interfaz Generator.
* Seguir la vía de la Cadena de Responsabilidad.

Ya veremos en próximas entregas por dónde nos decidimos a seguir.
