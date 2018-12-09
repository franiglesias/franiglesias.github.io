---
layout: post
title: Refactor cotidiano (3). Acondiciona las condicionales
categories: articles
tags: good-practices refactoring
---

La tercera entrega de la guía del refactor cotidiano trata sobre cómo mejorar las estructuras condicionales.

Es bastante obvio que si hay algo que añade complejidad a un software es la toma de decisiones y, por tanto, las estructuras condicionales con las que la expresamos.

Hay varios aspectos que pueden generar dificultades a la hora de leer el código con condicionales:

* **La complejidad de las expresiones evaluadas**, sobre todo cuando se combinan mediante operadores lógicos tres o más condiciones.
* **La anidación de condicionales** y la concatenación de condicionales mediante else.
* **El desequilibrio entre las ramas** en las que una rama tiene unas pocas líneas frente a la otra que esconde su propia complejidad. 

## ¿Cuándo refactorizar condicionales?

En general, como regla práctica, hay que refactorizar condicionales cuando su lectura no nos deja claro cuál es su significado. Esto se aplica en dos aspetos:

* **Expresión condicional**: qué tiene que pasar para que el flujo se dirija por una o por otra rama.
* **Ramas**: qué sucede en cada una de las ramas.

Existen otras reglas prácticas:

**Aplanar niveles de indentación**: cuanto menos anidamiento en el código, más fácil de leer es.

**Eliminar else**: en muchos casos, es posible eliminar ramas alternativas, bien directamente, bien encapsulando toda la estructura en un método o función, de modo que dentro de ésta se pueda hacer directamente.

## La rama corta primero

Si una estructura condicional nos lleva por una rama muy corta en caso de cumplirse y por una muy larga en el caso contrario, se recomienda que la rama corta sea la primera, para evitar que pase desapercibida.

Por ejemplo, este fragmento tan feo:

```php
if ($selectedPaymentMethod == null) {
    $logger = Logger::getInstance();
    $logger->debug("Medio de pago desconocido");
    if ($order->getDestinationCountry() == Country::FRANCE && $order->id() < 745) {
        $paymentMethod = PaymentTypes::PAYPAL;
    }
} else {
    $paymentMethod = $selectedPaymentMethod->getPaymentMethodType()->getPaymentMethodTypeId();
}
```

Podría reescribirse así:

```php
if (null !== $selectedPaymentMethod) {
    $paymentMethod = $selectedPaymentMethod->getPaymentMethodType()->getPaymentMethodTypeId();    
} else {
    $logger = Logger::getInstance();
    $logger->debug("Medio de pago desconocido");
    if ($order->getDestinationCountry() == Country::FRANCE && $order->id() < 745) {
        $paymentMethod = PaymentTypes::PAYPAL;
    }
}
```

## Return early

Si estamos dentro de una función o método y podemos hacer el return desde dentro de una rama es bueno hacerlo. Con eso podemos evitar el else y hacer que el código vuelva al nivel de indentación anterior (mejor si es el primero), lo que facilita la lectura.

Imaginemos que tras el código anterior tenemos un return (no hace falta que sea inmediatamente después):

```php
if (null !== $selectedPaymentMethod) {
    $paymentMethod = $selectedPaymentMethod->getPaymentMethodType()->getPaymentMethodTypeId();    
} else {
    $logger = Logger::getInstance();
    $logger->debug("Medio de pago desconocido");
    if ($order->getDestinationCountry() == Country::FRANCE && $order->id() < 745) {
        $paymentMethod = PaymentTypes::PAYPAL;
    }
}

// Some more code to get a value for $paymentMethod

return $paymentMethod;
```

En realidad, en la primera rama ya podríamos volver sin problemas, lo que nos permite eliminar la cláusula else, reduciendo la indentación del código.

```php
if (null !== $selectedPaymentMethod) {
    $paymentMethod = $selectedPaymentMethod->getPaymentMethodType()->getPaymentMethodTypeId();
    
    return $paymentMethod;    
} 

$logger = Logger::getInstance();
$logger->debug("Medio de pago desconocido");

if ($order->getDestinationCountry() == Country::FRANCE && $order->id() < 745) {
    $paymentMethod = PaymentTypes::PAYPAL;
}

// Some more code to get a value for $paymentMethod

return $paymentMethod;
```

Además, no hace falta crear ni poblar una variable con lo que podemos devolver directamente, aplicando lo mismo a la condicional que podemos ver al final:

```php
if (null !== $selectedPaymentMethod) {
    return $selectedPaymentMethod->getPaymentMethodType()->getPaymentMethodTypeId();
} 

$logger = Logger::getInstance();
$logger->debug("Medio de pago desconocido");

if ($order->getDestinationCountry() == Country::FRANCE && $order->id() < 745) {
    return PaymentTypes::PAYPAL;
}

// Some more code to get a value for $paymentMethod

```

Un uso habitual de esta técnica es la de tratar casos particulares o que sean obvios en los primeros pasos del algoritmo, volviendo al flujo principal cuanto antes, de modo que el algoritmo sólo recibe aquellos casos a los que se aplica realmente.

### Cláusulas de guarda

En muchas ocasiones, cuando los datos tienen que ser validados antes de operar con ellos, podemos encapsular esas condiciones que dan lugar a excepciones en forma de cláusulas de guarda. Estas cláusulas de guarda, también se conocen como aserciones, o precondiciones. Si los parámetros no las cumplen, el método o función falla lanzando excepciones.

```php
    if ($parameter > 100 || $parameter < 0) {
        throw new OutOfRangeException(sprintf('Parameter should be between 0 and 100 (inc), %s provided.', $parameter));
    }

// further processing
```

Extraemos toda la estructura a un método privado:

```php
$this->checkTheParameterIsInRange($parameter);

// further processing

private function checkTheParameterIsInRange(int $parameter)
{
    if ($parameter > 100 || $parameter < 0) {
        throw new OutOfRangeException(sprintf('Parameter should be between 0 and 100 (inc), %s provided.', $parameter));
    }
}
```

La lógica bajo este tipo de cláusulas es que si no salta ninguna excepción, quiere decir que `$parameter` ha superado todas las validaciones y lo puedes usar con confianza.

La ventaja es que las reglas de validación resultan muy expresivas, ocultando los detalles técnicos en los métodos extraídos.

## Preferir condiciones afirmativas

Diversos estudios han mostrado que las frases afirmativas son más fáciles de entender que las negativas, por lo que siempre que sea posible deberíamos intentar convertir la condición en afirmativa bien sea invirtiéndola, bien encapsulándola de modo que se exprese de manera afirmativa.

En uno de los ejemplos anteriores habíamos llegado a la siguiente construcción, que es una condición negada especialmente difícil de leer:

```php
if (null !== $selectedPaymentMethod) {
    return $selectedPaymentMethod->getPaymentMethodType()->getPaymentMethodTypeId();
} 
```

Nosotros lo que queremos es devolver el método de pago si es que tenemos uno seleccionado:

```php
if ($selectedPaymentMethod) {
    return $selectedPaymentMethod->getPaymentMethodType()->getPaymentMethodTypeId();
} 
```

Una forma alternativa, si la condición es compleja o simplemente difícil de entender tal cual es encapsularla en un método:

```php
if ($this->userHasSelectedAPaymentMethod($selectedPaymentMethod)) {
    return $selectedPaymentMethod->getPaymentMethodType()->getPaymentMethodTypeId();
} 

function userHasSelectedAPaymentMethod($selectedPaymentMethod)
{
    return null !== $selectedPaymentMethod;
}
```


## Encapsula expresiones complejas en métodos o funciones

La idea es encapsular expresiones condicionales complejas en funciones o métodos, de modo que su nombre exprese el significado de la expresión condicional, manteniendo ocultos los detalles "escabrosos" de la misma. Esto puede hacerse de forma global o por partes.

Justo en el apartado anterior hemos visto un ejemplo de esto mismo, haciendo explícito el significado de una expresión condicional difícil de leer.

Veamos otro caso en el mismo ejemplo, la extraña condicional:

```php
if ($order->getDestinationCountry() == Country::FRANCE && $order->id() < 745) {
    return PaymentTypes::PAYPAL;
}

// Some more code to get a value for $paymentMethod

```

Podría ser un poco más explicativa encapsulada en un método:

```php
if (legacyOrdersWithDestinationFrance($order)) {
    return PaymentTypes::PAYPAL;
}

// Some more code to get a value for $paymentMethod

private function legacyOrdersWithDestinationFrance($order)
{
    return $order->getDestinationCountry() == Country::FRANCE && $order->id() < 745;
}
```

Esto deja el bloque de esta manera:

```php
if ($selectedPaymentMethod) {
    return $selectedPaymentMethod->getPaymentMethodType()->getPaymentMethodTypeId();
} 

$logger = Logger::getInstance();
$logger->debug("Medio de pago desconocido");

if (legacyOrdersWithDestinationFrance($order)) {
    return PaymentTypes::PAYPAL;
}

// Some more code to get a value for $paymentMethod

private function legacyOrdersWithDestinationFrance($order)
{
    return $order->getDestinationCountry() == Country::FRANCE && $order->id() < 745;
}
```

Del singleton que tenemos por ahí no hablaremos en esta ocasión.

## Encapsula ramas en métodos o funciones

Consiste en encapsular todo el bloque de código de cada rama de ejecución en su propio método, de modo que el nombre nos indique qué hace. Esto nos deja las ramas de la estructura condicional al mismo nivel y expresando lo que hacen de manera explícita y global. En los métodos extraídos podemos seguir aplicando refactors progresivos hasta que ya no sea necesario.

Este fragmento de código, que está bastante limpio, podría clarificarse un poco, encapsulando tanto las condiciones como la rama:

```php
if ($productStatus == OrderStatuses::PROVIDER_PENDING ||
    $productStatus == OrderStatuses::PENDING ||
    $productStatus == OrderStatuses::WAITING_FOR_PAYMENT
) {
    if ($paymentMethod == PaymentTypes::BANK_TRANSFER) {
        return 'pendiente de transferencia';
    }
    if ($paymentMethod == PaymentTypes::PAYPAL || $paymentMethod == PaymentTypes::CREDIT_CARD) {
        return 'pago a crédito';
    }
    if ($this->paymentMethods->hasSelectedDebitCard()) {
        return 'pago a débito';
    }
    if (!$this->paymentMethods->requiresAuthorization()) {
        return 'pago no requiere autorización';
    }
}
```

Veamos como:

```php
if ($this->productIsInPendingStatus($productStatus)) {
    return $this->reportForProductInPendingStatus($paymentMethod);
}

private function productIsInPendingStatus($productStatus)
{
    return ($productStatus == OrderStatuses::PROVIDER_PENDING ||
    $productStatus == OrderStatuses::PENDING ||
    $productStatus == OrderStatuses::WAITING_FOR_PAYMENT);
}

private function reportForProductInPendingStatus(paymentMethod)
{
    if ($paymentMethod == PaymentTypes::BANK_TRANSFER) {
        return 'pendiente de transferencia';
    }
    if ($paymentMethod == PaymentTypes::PAYPAL || $paymentMethod == PaymentTypes::CREDIT_CARD) {
        return 'pago a crédito';
    }
    if ($this->paymentMethods->hasSelectedDebitCard()) {
        return 'pago a débito';
    }
    if (!$this->paymentMethods->requiresAuthorization()) {
        return 'pago no requiere autorización';
    }
}
```

De ese modo, la complejidad queda oculta en los métodos y el cuerpo principal se entiende fácilmente. Ya es cuestión nuestra si necesitamos seguir el refactor dentro de los método privados que acabamos de crear.

### Equalize branches

Si hacemos esto en todas las ramas de una condicional o de un switch las dejaremos todas al mismo nivel, lo que facilita su lectura.

## Reemplaza if…else if sucesivos con switch

En muchos casos, sucesiones de `if` o `if…else` quedarán  mejor expresados mediante una estructura `switch`. Por ejemplo, siguiendo con el ejemplo anterior, este método que hemos extraído:

```php
private function reportForProductInPendingStatus(paymentMethod)
{
    if ($paymentMethod == PaymentTypes::BANK_TRANSFER) {
        return 'pendiente de transferencia';
    }
    if ($paymentMethod == PaymentTypes::PAYPAL || $paymentMethod == PaymentTypes::CREDIT_CARD) {
        return 'pago a crédito';
    }
    if ($this->paymentMethods->hasSelectedDebitCard()) {
        return 'pago a débito';
    }
    if (!$this->paymentMethods->requiresAuthorization()) {
        return 'pago no requiere autorización';
    }
}
```

Podría convertirse en algo así:

```php
private function reportForProductInPendingStatus(paymentMethod)
{
    switch $paymentMethod {
        case PaymentTypes::BANK_TRANSFER:
            return 'pendiente de transferencia';
        case PaymentTypes::PAYPAL:
        case PaymentTypes::CREDIT_CARD:
            return 'pago a crédito';
    }
    
    if ($this->paymentMethods->hasSelectedDebitCard()) {
        return 'pago a débito';
    }
    if (!$this->paymentMethods->requiresAuthorization()) {
        return 'pago no requiere autorización';
    }
}
```

## Sustituir if por el operador ternario

A veces, un operador ternario puede ser más legible que una condicional:

```php
function selectElement(Criteria $criteria, Desirability $desirability)
{
    $found = false;
    
    $elements = $this->getElements($criteria);
    
    foreach($elements as $element) {
        if (!$found && $this->isDesired($element, $desirability)) {
            $result = $element;
            $found = true;
        }
    }
    if (!$found) {
        $result = null;
    }
    
    return $result;
}
```

Realmente las últimas líneas pueden expresarse en una sola y queda más claro:

```php
function selectElement(Criteria $criteria, Desirability $desirability)
{
    $found = false;
    
    $elements = $this->getElements($criteria);
    
    foreach($elements as $element) {
        if (!$found && $this->isDesired($element, $desirability)) {
            $result = $element;
            $found = true;
        }
    }
    
    return $found ? $result : null;
}
```

El operador ternario tiene sus problemas pero, en general, es una buena solución cuando queremos expresar un cálculo que se resuelve de dos maneras según una condición. Eso sí: nunca anides operadores ternarios porque su lectura entonces se complica enormemente.

## Resumen del capítulo

Las expresiones y estructuras condicionales pueden hacer que seguir el flujo de un código sea especialmente difícil, particularmente cuando están anidadas o son muy complejas. Mediante técnicas de extracción podemos simplificarlas, aplanarlas y hacerlas más expresivas.
