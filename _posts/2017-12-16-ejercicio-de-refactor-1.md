---
layout: post
title: Ejercicio de refactor (1) Los tests de caracterización
categories: articles
tags: refactor characterization-test legacy
---

¿Qué tal si hablamos de refactor?

Estoy leyendo el libro de referencia sobre estos temas: [Working effectively with legacy code, de Michael Feathers](https://www.amazon.es/Working-Effectively-Legacy-Michael-Feathers/dp/0131177052), y me gustaría ir poniendo en práctica algunas de las técnicas que propone. Para ello, he preparado un ejemplo adaptando ligeramente un caso real.

Por muy espantoso que nos pueda parecer que un código similar al del ejemplo se encuentre en producción en algún lugar recuerda que no debes menospreciarlo. Por varias razones:

Para empezar, ese código seguramente está pagando tu salario. Si está ahí es porque funciona y está generando ingresos y ha permitido a la empresa disponer de dinero para contratarte. Sólo por eso merece ser tratado con mucho respeto.

Por otro lado, si repasas la historia del lenguaje, PHP en este caso, sabrás que no siempre han estado disponibles facilidades como las que disfrutamos hoy. Imagínate lo que puede ser programar sin namespaces, ni type hinting, ni return types, ni soporte completo para objetos, etc. Es decir, en el legacy encontrarás apaños que buscaban superar algunas limitaciones impuestas por el estado del lenguaje de programación y es importante comprender eso.

Yéndonos a cuestiones de estilo, debes tener también presente que las buenas prácticas también han ido cambiando con el tiempo y hay patrones que se estilaban hace unos años que ahora consideramos obsoletos o perjudiciales.

## Refactor para la vida real

En primer lugar hay que recordar que hacer refactor es cambiar la implementación o el diseño de un software sin alterar su funcionalidad. Por tanto:

* **Mientras hacermos refactoring no podemos mmodificar el comportamiento**. Para eso tenemos tests que prueben que durante el proceso el comportamiento no cambia y deben mantenerse pasando.
* **Mientras implementamos funcionalidad no modificamos el diseño**, usando nuevos tests o habiendo modificado tests existentes en caso necesario, tests que inicialmente no pasarán y que debemos hacer que pasen con nuestra intervención.

Estos recordatorios son importantes porque el refactoring debe ser **seguro** en el sentido de garantizar que la mejora de la calidad del código no altere el comportamiento del software, manteniendo su capacidad productiva sin introducir errores o comportamientos extraños. Un buen refactor, además, puede proporcionar beneficios extra, como mejorar las condiciones del código para detectar y solucionar problemas, así como para introducir nuevas funcionalidades con una fricción cada vez menor.

En muchos entornos de trabajo existe una tensión entre la entrega rápida y frecuente de valor y el mantenimiento de la calidad el código:

* La primera fuerza impulsa a los equipos para entregar valor lo más rápido posible lo que, en el peor de los casos, puede llevar a implementar soluciones rápidas y chapuceras que incrementen eso que llamamos "deuda técnica" del código, perjudicando la mantanibilidad futura del mismo. Es decir, se da la paradoja de que incrementando en exceso la velocidad en la entrega de valor en el corto plazo podríamos estar ralentizando el proyecto en el medio o largo plazo.

* La segunda fuerza impulsa a los equipos a mejorar la calidad del código aplicando buenas prácticas tanto al código nuevo como al existente. En el peor de los casos, el equipo podría estar dedicándose a refactorizar toda la base de código hasta la extenuación sin entregar valor con la suficiente velocidad o sin entregar valor alguno en el corto plazo, aunque se gane velocidad en el medio y largo con un código más legible y fácil de mantener.

Un libro muy recomendable para encontrar una solución a esta disyuntiva es [The nature of software development, de Ron Jeffreys](https://www.amazon.es/Nature-Software-Development-Simple-Valuable/dp/1941222374). Resumiendo mucho, podríamos decir que la propuesta que hace es aplicar la _regla del boy-scout_: deja siempre el campamento mejor que como lo has encontrado. De este modo cada parte del código recibirá atención proporcional a la cantidad de veces que debamos intervenir sobre ella, y en cada una de esas veces no sólo evolucionará hacia un mejor diseño, sino que será más fácil realizar las modificaciones requeridas por la user story.

Los proyectos de refactor como tales no parecen muy buena idea, salvo que realmente el estado del código sea tan malo que imposibilite una entrega realista de valor. 

Dejando aparte lo feo que nos pueda parecer un fragmento de código en el que tenemos que intervenir yo diría que hay dos momentos importantes para refactorizar una vez que hemos decidido que hay que intervenir en él:

* **Refactor para entender**: encuentras un código difícil de leer, en el que cuesta mucho enterarse de lo que ocurre, con condicionales combinadas y anidadas, flujos que se entrecruzan, responsabilidades mal asignadas, etc. Reorganizar ese código, con la ayuda de tests de caracterización si no existen tests que cubran la funcionalidad, puede ser parte del análisis, con lo que dejaríamos el campo preparado para aplicar las modificaciones necesarias y facilitaríamos el análisis en futuras _stories_ que tenga que afrontar otro desarrollador.

* **Refactor para mejorar la calidad**: tras desarrollar la solución, adecuadamente cubierta por tests, se procede al refactor para mejorar el diseño del código si lo vemos necesario. 

El resultado es un equilibrio razonable entre la entrega de valor actual y la sostenibilidad del código para acelararla en el futuro.

## El ejemplo

Estamos en una tienda online. Hemos detectado que en ciertos pedidos el cliente no recibe la notificación de que el producto solicitado no se ha podido conseguir por alguna razón y se le ha cobrado igualmente. Esto tiene como consecuencia que la tienda debe conseguir el producto para el cliente y debe asumir los costes, o bien devolver el dinero cobrado de más.

Tras leer la historia y consultar algunos detalles con Negocio, hemos determinado que el problema está en el método Notification::getMessagesByOrderStatus que puedes ver en aquí: 

{% gist 5b4fa5d83ac0fb113d4253560dae2bc6 %}

La misión de este método sería generar los mensajes adecuados para notificar al usuario el estado del pedido.

Y esto es lo que nos encontramos, para empezar:

* La clase se utiliza con llamadas estáticas
* Tenemos un bloque try… catch que se come las excepciones
* Tenemos hasta 6 niveles de anidación de condicionales
* Tenemos un montón de condicionales combinadas
* Tenemos dependencias incrustadas
* Hemos descubierto que el código sabe demasiado sobre el negocio
* Otros problemas

Vamos paso por paso.

### Métodos estáticos

Cuando PHP no tenía _namespaces_ era frecuente utilizar clases con llamadas estáticas para contener diversas funciones relacionadas. Estas clases solían carecer de constructor y no eran especialmente cohesivas. Podría decirse que era una forma de obtener un _namespace_ en un entorno fundamentalmente procedural, no orientado a objetos.

Un posible enfoque para refactorizar es sacar todo el código a una nueva clase con un método público que contenga la misma funcionalidad. Luego, para no romper el código existente, podemos sustituir el contenido del método estático original por una llamada a ese método en una instancia de la nueva clase. A medida que sea necesario, iremos haciendo lo mismo con el resto de métodos.

### Niveles de anidación de condicionales

Los try… catch con bloques catch vacíos son desconcertantes. Hacen desaparecer las excepciones como lágrimas en la lluvia y las pueden esconder durante años… Si es que se producen, porque una inspección rápida del código nos dice que parece muy raro que llamadas a simples getter puedan lanzar excepciones.

La cuestión es, entonces, qué hacer con las posibles excepciones. ¿Qué significa una excepción en este contexto? ¿Indica que la compra no se ha podido realizar de ningún modo? ¿O es que en algún momento había excepciones que capturar, pero algún cambio en el pasado dejó olvidada esta estructura?
 
Si no podemos determinar la necesidad de capturar una excepción, lo mejor será eliminar este bloque.
 
### Niveles de anidación de condicionales
 
Las condicionales aumentan la complejidad del código y, si están anidadas, mucho más. Aquí tenemos hasta 6 niveles de anidación, con bloques `else` o `elseif` incluídos, además de patas de condicionales que incluyen nuevas condicionales. En este caso, parte del problema podría venir del hecho de que se esté aplicando un [patrón _single exit point_](/2017-10-21-lidiando-con-el-patron-single-exit-point) en lugar de _return early_, lo que fuerza en parte la complejidad del método.
 
Por ejemplo, el primer nivel de condicionales tras el bloque `try… catch` nos indica que hay tres cursos de acción posibles:
 
* En el primero encontramos un nuevo `if`, en el que tenemos 3 posibilidades.
* El segundo curso (`elseif`) sólo tiene un curso posible.
* El tercer curso (`else`), nos lleva a un complejo árbol, cuyo primer nivel ya nos ofrece 2 nuevos caminos.
 
A estas alturas estamos hablando de seis posibles cursos sólo en los primeros dos niveles de anidación. Puedes imaginar la complejidad del resto. A eso hay que añadir las condiciones combinadas.

### Condiciones combinadas

Las condiciones combinadas pueden añadir mucha complejidad. Para empezar, pueden ser difíciles de leer si hay distintos operadores implicados, como expresiones que incluyan tanto AND como OR.

Por lo general, es preferible encapsularlas en métodos con nombres significativos que devuelvean el boolean.

### Dependencias incrustadas

En nuestro ejemplo tenemos un `Logger`, que resulta ser un _singleton_, dentro del método que nos ocupa. Las dependencias deberían ser inyectadas y no incrustadas o, como en este caso, llamadas como una global estática.

Hay otras clases que parece que más bien nos aportan constantes y que no deberían suponer problemas especiales, aunque van a necesitar una inspección detallada.

### El código sabe demasiado sobre el negocio

Negocio tiene un problema serio cuando el código "sabe" cosas que no debería. En nuestro ejemplo se pueden ver condicionales que comprueban si los pedidos corresponden a ciertos Providers o Resellers concretos y esto es algo que no debería ocurrir.

Es malo para Negocio porque cuando necesita aplicar alguna nueva regla todo tiene que pasar por un desarrollador que examine el código, busque el lugar adecuado, aplique las modificiones, testee y suba a producción los cambios. La capacidad de acción de Negocio se ve limitada por esta circunstancia y puede suponer retrasos o costes al no poder reaccionar de forma directa a los cambios.

Este tipo de conocimiento debería desaparecer del código y moverse a otro lugar en el que Negocio pueda actuar según sus criterios, bien sea editando un archivo de configuración, modificando datos en una interfaz de administración, etc.

### Otros problemas

El propio IDE nos señala algunos problemas más, como alguna variable que no se usa, así como el problema contrario de variables que son inicializadas varias veces.

También parece, en un primer vistazo, que podría haber algunos problemas con los conceptos de dominio.

Pero lo importante, ahora, es tender una red de seguridad para que el refactor no rompa el comportamiento de nuestra aplicación.

## Test de caracterización

Nuestra primera tarea sería generar **tests de caracterización**, dado que no tenemos tests que prueben la clase. Se trata de algo que podríamos considerar como TDD a la inversa: partiendo del código formulamos hipótesis sobre su funcionamiento y tratamos de probarlas escribiendo tests que pasen.

Hasta cierto punto, estos tests de caracterización podrían convertirse en la base de los tests de aceptación que prepararemos para cumplimentar la historia que nos han pedido.

Una forma de abordarlo es ir identificando outputs que correspondan a determinados flujos y, poco a poco, cubrir todos los casos. En algún momento, podremos comenzar a refactorizar aquellos flujos que tengamos bien cubiertos y sólo en ese caso.

### Primer test y primeros problemas

El primer caso que parece fácil testear es el `elseif` de la línea 47, que comprueba si el pedido tiene asignado un localizador de proveedor y devuelve un mensaje de que no se ha podido realizar. En el test necesitaremos un [stub](/2017-05-19-del-ojimetro-al-tdd) de `Order` que devuelva el `providerLocator` vacío.

Dado que nuestras clases existentes no están bajo un namespace tenemos que configurar Composer para autocargarlas. Podemos utilizar la estrategia de _classmap_, indicando los directorios en los cuales queremos buscar las clases.

```json
{
  "name": "fi/refactoring",
  "description": "refactor exercises",
  "minimum-stability": "dev",
  "license": "MIT",
  "authors": [
    {
      "name": "Fran Iglesias",
      "email": "franiglesias@mac.com"
    }
  ],
  "autoload": {
    "psr-4": {
      "Refactor\\": "src/",
      "Test\\Refactor\\": "tests/"
    },
    "classmap": [
      "src/old"
    ]
  },
  "config": {
    "bin-dir": "bin"
  },
  "require": {
    "phpunit/phpunit": "6.5.4"
  }
}
```

Después de algunas pruebas para ajustar los valores del stub, tenemos nuestro primer test que pasa, describiendo el resultado esperado:

```php
    public function testMessageForEmptyProviderLocator()
    {
        $order = $this->createMock(Order::class);
        $order->method('getProviderLocator')->willReturn('');
        $order->method('getPaymentMethods')->willReturn(new PaymentMethods());
        $order->method('getId')->willReturn('123');
        $order->method('getProvider')->willReturn(0);

        $sut = new Notification();
        $this->assertEquals(['pedido no se pudo realizar'], $sut::getMessagesByOrderStatus($order));
    }
```

### Nuestro segundo grupo de tests

Hemos escrito un test que prueba el flujo más sencillo de nuestra clase. Nuestra mirada se dirige al siguiente punto que parece más sencillo, y que es la primera rama del if de la línea 39. Esta rama comprueba si se trata del proveedor 1 y dentro de ella tiene dos posibles flujos, por lo que necesitaremos tres tests: aunque hay dos itinerarios, uno de ellos tiene dos posibles situaciones en las que debe ejecutarse:

```php
    public function testMessageForProvider1CancelledOrder()
    {
        $order = $this->createMock(Order::class);
        $order->method('getProviderLocator')->willReturn('locator');
        $order->method('getPaymentMethods')->willReturn(new PaymentMethods());
        $order->method('getId')->willReturn('123');
        $order->method('getProvider')->willReturn(Providers::PROVIDER1);
        $order->method('getProductStatus')->willReturn(OrderStatuses::CANCELLED);

        $sut = new Notification();
        $this->assertEquals(['pedido cancelado'], $sut::getMessagesByOrderStatus($order));
    }

    public function testMessageForProvider1CancelledPending()
    {
        $order = $this->createMock(Order::class);
        $order->method('getProviderLocator')->willReturn('locator');
        $order->method('getPaymentMethods')->willReturn(new PaymentMethods());
        $order->method('getId')->willReturn('123');
        $order->method('getProvider')->willReturn(Providers::PROVIDER1);
        $order->method('getProductStatus')->willReturn(OrderStatuses::PENDING);

        $sut = new Notification();
        $this->assertEquals(['pedido no confirmado con provider 1'], $sut::getMessagesByOrderStatus($order));
    }

    public function testMessageForProvider1CancelledPendingBecauseProviderError()
    {
        $order = $this->createMock(Order::class);
        $order->method('getProviderLocator')->willReturn('locator');
        $order->method('getPaymentMethods')->willReturn(new PaymentMethods());
        $order->method('getId')->willReturn('123');
        $order->method('getProvider')->willReturn(Providers::PROVIDER1);
        $order->method('getProductStatus')->willReturn(OrderStatuses::PENDING_PROVIDER_ERROR);

        $sut = new Notification();
        $this->assertEquals(['pedido no confirmado con provider 1'], $sut::getMessagesByOrderStatus($order));
    }
```

Estos tres tests pasan, lo que quiere decir que describen adecuadamente el comportamiento de este path de ejecución. Como hay mucha duplicación, podríamos reducirla con un método que nos monte el stub del objeto Order.

Después de asegurarnos de que los tests siguen pasando el resultado es que son más concisos y expresivos.

```php
    public function testMessageForProvider1CancelledOrder()
    {
        $order = $this->buildOrderStubForProvider1();
        $order->method('getProductStatus')->willReturn(OrderStatuses::CANCELLED);

        $sut = new Notification();
        $this->assertEquals(['pedido cancelado'], $sut::getMessagesByOrderStatus($order));
    }

    public function testMessageForProvider1CancelledPending()
    {
        $order = $this->buildOrderStubForProvider1();
        $order->method('getProductStatus')->willReturn(OrderStatuses::PENDING);

        $sut = new Notification();
        $this->assertEquals(['pedido no confirmado con provider 1'], $sut::getMessagesByOrderStatus($order));
    }

    public function testMessageForProvider1CancelledPendingBecauseProviderError()
    {
        $order = $this->buildOrderStubForProvider1();
        $order->method('getProductStatus')->willReturn(OrderStatuses::PENDING_PROVIDER_ERROR);

        $sut = new Notification();
        $this->assertEquals(['pedido no confirmado con provider 1'], $sut::getMessagesByOrderStatus($order));
    }
    
    protected function buildOrderStubForProvider1() : MockObject
    {
        $order = $this->createMock(Order::class);
        $order->method('getProviderLocator')->willReturn('locator');
        $order->method('getPaymentMethods')->willReturn(new PaymentMethods());
        $order->method('getId')->willReturn('123');
        $order->method('getProvider')->willReturn(Providers::PROVIDER1);

        return $order;
    }
```

Así y todo, esta última parte me preocupa un poco porque es uno de esos momentos es que nuestro código exhibe un conocimiento excesivo del mundo exterior. A la large, eso debería desaparecer.

### Nuevos casos, nuevos tests

La tercera pata del primer nivel del condicional se cierne amenazante sobre nosotros, pero debemos enfrentarla con valor y tests. Nos espera bastante trabajo.

Lo primero que vamos a hacer a continuación es asegurarnos de que creamos un escenario correcto para entrar en esta rama del flujo que se divide en dos; inicialmente, en función de si los proveedores están asociados o no. Por lo tanto, necesitaremos crear dos escenarios básicos y luego un test para cada caso.

Lo que haré, de momento, será utilizar el debugger a fin de hacer un seguimiento del flujo mientras construyo los escenarios necesarios. Debería preguntar a Negocio por ejemplos de proveedores asociados pero, por desgracia, ese conocimiento está en el código y sé que Provider3 o Provider4 son asociados. No debería estar ahí, pero ahora no nos podemos meter con eso.

He decidido comenzar primero por las condiciones más simples, es decir, que no tienen otras condicionales anidadas, con lo que salen unos cuantos tests con bastantes elementos comunes, así que extraigo lo que puedo para simplificar. Os ahorro pasos intermedios y esto es lo que resulta:

```php
    public function testMessageForAssociatedProviderPendingBecauseError()
    {
        $order = $this->buildOrderStubForAssociatedProvider();
        $order->method('getProductStatus')->willReturn( OrderStatuses::PENDING_PROVIDER_ERROR);
        $sut = new Notification();
        $this->assertEquals(['pedido no confirmado por error de proveedor'], $sut::getMessagesByOrderStatus($order));
    }

    public function testMessageForAssociatedProviderError()
    {
        $order = $this->buildOrderStubForAssociatedProvider();
        $order->method('getProductStatus')->willReturn( OrderStatuses::ERROR);
        $sut = new Notification();
        $this->assertEquals(['pedido no confirmado por error de proveedor'], $sut::getMessagesByOrderStatus($order));
    }

    public function testMessageForAssociatedProviderCancelled()
    {
        $order = $this->buildOrderStubForAssociatedProvider();
        $order->method('getProductStatus')->willReturn( OrderStatuses::CANCELLED);
        $sut = new Notification();
        $this->assertEquals(['pedido cancelado o rechazado'], $sut::getMessagesByOrderStatus($order));
    }

    public function testMessageForAssociatedProviderRejected()
    {
        $order = $this->buildOrderStubForAssociatedProvider();
        $order->method('getProductStatus')->willReturn( OrderStatuses::REJECTED);
        $sut = new Notification();
        $this->assertEquals(['pedido cancelado o rechazado'], $sut::getMessagesByOrderStatus($order));
    }
    
    protected function buildOrderStubForAssociatedProvider() : MockObject
    {
        $order = $this->createMock(Order::class);
        $order->method('getProviderLocator')->willReturn('locator');
        $order->method('getPaymentMethods')->willReturn(new PaymentMethods());
        $order->method('getId')->willReturn('123');
        $order->method('getProvider')->willReturn(Providers::PROVIDER3);

        return $order;
    }
```

En la rama de proveedores no asociados nos encontraremos seguramente con varios tests parecidos, aunque un vistazo rápido nos indica que las cosas no van a ser tan sencillas. Aún nos queda trabajo en esta rama. Pero antes podemos hacer algunas observaciones.

Por una parte, nuestros escenarios tienen de momento dos ejes de variación: una es el proveedor (o tipo de proveedor) y otro es el status del pedido. Ahora nos encontraremos con un tercer eje, que será el método de pago, y hasta con un cuarto: el Reseller: hemos podido ver que para ciertos Resellers hay que aplicar un trato especial.

Es posible que, a estas alturas, hayas comenzado a vislumbrar posibles formas de atacar el refactor de este método (esto huele bastante a [Chain of Responsibility](/2016-12-05-cadena-de-responsabilidad) ). Pero no queremos ir demasiado rápido. En primer lugar, tenemos que caracterizar todo el comportamiento del método. En segundo lugar, es conveniente realizar el refactor aplicando el principio de _baby-steps_. Es decir, en lugar de reescribir el método, que sería lo que iba a ocurrir si intentamos aplicar un patrón CoR sin más dilación, iremos en pasos más cortos, limpiando la implementación actual hasta que el propio código nos revele (o no) que el patrón es aplicable.

### Añadiendo el tercer eje de variación

El tercer eje de variación de los casos es el uso de uno u otro medio de pago. Dentro de ciertos estados del pedido, la respuesta va a depender del medio de pago que ha utilizado nuestro usuario.

La primera situación que afrontamos es la de diversos tipos de pedidos en estado pendiente, con varios medios de pago. Este es el resultado tras haber refactorizado los tests, recurriendo a un nuevo builder a un dataProvider para no repetirnos tanto.

```php
    /** @dataProvider orderStatusPendingProvider */
    public function testMessageForAssociatedWithBankTransfer($orderStatus)
    {
        $paymentMethods = $this->configurePaymentMethods(PaymentTypes::BANK_TRANSFER);
        $order = $this->buildOrderStubForAssociatedProviderNoStatus();

        $order->method('getProductStatus')->willReturn( OrderStatuses::WAITING_FOR_PAYMENT);
        $order->method('getPaymentMethods')->willReturn($paymentMethods);
        $sut = new Notification();
        $this->assertEquals(['pendiente de transferencia'], $sut::getMessagesByOrderStatus($order));
    }

    /** @dataProvider orderStatusPendingProvider */
    public function testMessageForAssociatedWithPayPal($orderStatus)
    {
        $paymentMethods = $this->configurePaymentMethods(PaymentTypes::PAYPAL);
        $order = $this->buildOrderStubForAssociatedProviderNoStatus();

        $order->method('getProductStatus')->willReturn( OrderStatuses::WAITING_FOR_PAYMENT);
        $order->method('getPaymentMethods')->willReturn($paymentMethods);
        $sut = new Notification();
        $this->assertEquals(['pago a crédito'], $sut::getMessagesByOrderStatus($order));
    }

    /** @dataProvider orderStatusPendingProvider */
    public function testMessageForAssociatedWithCreditCard($orderStatus)
    {
        $paymentMethods = $this->configurePaymentMethods(PaymentTypes::CREDIT_CARD);
        $order = $this->buildOrderStubForAssociatedProviderNoStatus();

        $order->method('getProductStatus')->willReturn( OrderStatuses::WAITING_FOR_PAYMENT);
        $order->method('getPaymentMethods')->willReturn($paymentMethods);
        $sut = new Notification();
        $this->assertEquals(['pago a crédito'], $sut::getMessagesByOrderStatus($order));
    }

    public function orderStatusPendingProvider()
    {
        return [
            'Provider pending' => [OrderStatuses::PROVIDER_PENDING],
            'Pending' => [OrderStatuses::PENDING],
            'Waiting for payment' => [OrderStatuses::WAITING_FOR_PAYMENT]
        ];
    }

    protected function buildOrderStubForAssociatedProviderNoStatus() : MockObject
    {
        $order = $this->createMock(Order::class);
        $order->method('getProviderLocator')->willReturn('locator');
        $order->method('getId')->willReturn('123');
        $order->method('getProvider')->willReturn(Providers::PROVIDER3);

        return $order;
    }

    protected function configurePaymentMethods($selectedMethod) : MockObject
    {
        $paymentMethodType = $this->createMock(PaymentMethodType::class);
        $paymentMethodType->method('getIdTipoMedioDePago')->willReturn($selectedMethod);

        $paymentMethod = $this->createMock(PaymentMethod::class);
        $paymentMethod->method('getPaymentMethodType')->willReturn($paymentMethodType);

        $paymentMethods = $this->createMock(PaymentMethods::class);
        $paymentMethods->method('getFromOrder')->willReturn($paymentMethods);
        $paymentMethods->method('getSelectedPaymentMethod')->willReturn($paymentMethod);

        return $paymentMethods;
    }
```

De momento nuestra tarea avanza bastante bien, pero cada vez resulta más difícil tener la seguridad de que estamos cubriendo los casos necesarios. Es hora de pedir ayuda.

## Ayudándonos con Code Coverage

Hasta este momento ha sido relativamente fácil orientarnos en el bosque de ifs que puebla este método, pero está llegando un punto en el que resulta complicado saber qué casos hemos cubierto y cuáles no. Aquí puede ayudarnos mucho la herramienta de cobertura de código de PHPUnit, pero necesitamos algo de configuración para hacerla funcionar.

### Preparar el entorno para disponer de CodeCoverage

Por una parte, vamos a crear un archivo de configuración de phpunit. Podemos hacerlo mediante el siguiente comando en shell en la raíz del proyecto:

```bash
bin/phpunit --generate-configuration
```

Este comando es interactivo y nos pedirá confirmar algunos valores que toma del proyecto:

```bash
Bootstrap script (relative to path shown above; default: vendor/autoload.php): 
Tests directory (relative to path shown above; default: tests): 
Source directory (relative to path shown above; default: src): 
```

Lo siguiente será modificar un poco el archivo resultante ya que, por defecto, activa el uso de la anotación @covers y a nosotros no nos interesa. Por tanto, podremos el atributo `forceCoversAnnotion` en `false`. Por lo demás, automáticamente pone en _whitelist_ nuestra carpeta `src`, lo que hace que se analice la cobertura de nuestro código fuente:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<phpunit xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:noNamespaceSchemaLocation="https://schema.phpunit.de/6.5/phpunit.xsd"
         bootstrap="vendor/autoload.php"
         forceCoversAnnotation="false"
         beStrictAboutCoversAnnotation="true"
         beStrictAboutOutputDuringTests="true"
         beStrictAboutTodoAnnotatedTests="true"
         verbose="true">
    <testsuite name="default">
        <directory suffix="Test.php">tests</directory>
    </testsuite>
    <filter>
        <whitelist processUncoveredFilesFromWhitelist="true">
            <directory suffix=".php">src</directory>
        </whitelist>
    </filter>
</phpunit>
```

Ahora, podemos ejecutar `phpunit` con el informe de coverage que más nos convenga:

```bash
bin/phpunit --coverage-html ./coverage
```

La línea anterior generará un informe de cobertura en Html creando la carpeta coverage si no existe. Abriendo el index.html en un navegador podremos acceder a él.

En PHPStorm podemos crear una configuración para test indicando simplemente que use el archivo de configuración alternativo que acabamos de crear. Ejecutando los tests con coverage, el propio IDE nos mostrará qué líneas están cubiertas y cuántas no, usando colores verdes y rojo respectivamente. Además, nos mostrará el número de veces que se ejecuta cada línea.

### Cómo usar el Code Coverage para crear tests de caracterización

La forma más obvia de utilizar Code Coverage para crear tests de caracterización es detectar líneas de código por las que no pasa el flujo de ejecución cuando lanzamos los test. Las líneas marcadas en rojo nos indican que por ahí no hemos pasado, por lo que necesitamos crear un test que lo haga.

Pero, en algunos casos, el hecho de que la línea se haya ejecutado no garantiza que el caso esté bien cubierto. Para eso nos fijamos en el número de **hits**, como los denomina PHPStorm, que no es más que el número de tests que cubre esa línea. En el caso de una línea o bloque cuya ejecución depende de una combinación de condiciones, tenemos que comprobar que el número de hits es, al menos, igual que el número de posibles resultados de la expresión condicional. Para verlo más claro:

* Condicion1 AND Condicion2: para ejecutar el bloque se tiene que dar un caso en el que se cumplen ambas condiciones. 
* Condicion1 OR Condicion2: como mínimo tenemos que tener dos tests: uno en el que se cumple la Condicion1, pero no la Condicion2, y otro en el que se cumple la Condicion2, pero no la Condicion1.

Seguramente veremos líneas cubiertas por todos o casi todos los tests, lo que es correcto toda vez que serán líneas que se ejecutan en todos los casos. En otras palabras: a partir del mínimo necesario de tests los nuevos tests no añaden mucha información, aunque no en todos los casos.

Otras líneas, controladas por condicionales, estarán cubiertas por más tests de los estrictamente necesarios. Esto podría indicar algún problema con nuestro diseño. Aunque no es un síntoma definitivo, lo cierto es que es un indicador que apunta a un excesivo anidamiento de condicionales. En otras palabras: para poder llegar a cierto fragmento de código, la ejecución tiene que tomar muchas desviaciones del flujo principal. Puedes considerarlo un _smell_.

## Seguimos caracterizando

Como acabamos de ver, la métrica de cobertura es útil para determinar qué ramas del flujo de ejecución no han sido visitadas por los tests, que se visualizan en rojo en los informes.

Así que nuestros próximos tests irán encaminados a cubrir las últimas ramificaciones del flujo que afecta a los llamados Proveedores asociados, para esto necesito modificar ligeramente el builder del stub de `PaymentMethods`, a fin de permitirme definir respuestas para las llamadas que se van a hacer en el test.

```php
    protected function configurePaymentMethods($selectedMethod, $isDebitCard = false, $requiresAuth = false) : MockObject
    {
        $paymentMethodType = $this->createMock(PaymentMethodType::class);
        $paymentMethodType->method('getIdTipoMedioDePago')->willReturn($selectedMethod);

        $paymentMethod = $this->createMock(PaymentMethod::class);
        $paymentMethod->method('getPaymentMethodType')->willReturn($paymentMethodType);

        $paymentMethods = $this->createMock(PaymentMethods::class);
        $paymentMethods->method('getFromOrder')->willReturn($paymentMethods);
        $paymentMethods->method('getSelectedPaymentMethod')->willReturn($paymentMethod);
        $paymentMethods->method('hasSelectedDebitCard')->willReturn($isDebitCard);
        $paymentMethods->method('requiresAuthorization')->willReturn($requiresAuth);

        return $paymentMethods;
    }
```

Finalmente, después de varios tests y refactor de tests, hemos conseguido cubrir por completo la rama de ejecución que se ocupa de los proveedores asociados:

```php
    /** @dataProvider orderStatusPendingProvider */
    public function testMessageForAssociatedWithDebitCard($orderStatus)
    {
        $paymentMethods = $this->configurePaymentMethods(PaymentTypes::DEBIT_CARD, true);
        $order = $this->buildOrderStubForAssociatedProviderNoStatus();

        $order->method('getProductStatus')->willReturn( OrderStatuses::WAITING_FOR_PAYMENT);
        $order->method('getPaymentMethods')->willReturn($paymentMethods);
        $sut = new Notification();
        $this->assertEquals(['pago a débito'], $sut::getMessagesByOrderStatus($order));
    }

    /** @dataProvider orderStatusPendingProvider */
    public function testMessageForAssociatedWithNotRequiringAuthPayment($orderStatus)
    {
        $paymentMethods = $this->configurePaymentMethods(PaymentTypes::AUTHORIZED_PAYMENT, false, false);
        $order = $this->buildOrderStubForAssociatedProviderNoStatus();

        $order->method('getProductStatus')->willReturn( OrderStatuses::WAITING_FOR_PAYMENT);
        $order->method('getPaymentMethods')->willReturn($paymentMethods);
        $sut = new Notification();
        $this->assertEquals(['pago no requiere autorización'], $sut::getMessagesByOrderStatus($order));
    }

    public function testMessageForWaitForShipmentWithDebitCard()
    {
        $paymentMethods = $this->configurePaymentMethods(PaymentTypes::DEBIT_CARD, true);
        $order = $this->buildOrderStubForAssociatedProviderNoStatus();

        $order->method('getProductStatus')->willReturn( OrderStatuses::WAITING_FOR_SHIPMENT);
        $order->method('getPaymentMethods')->willReturn($paymentMethods);
        $sut = new Notification();
        $this->assertEquals(['pago confirmado pendiente de envio'], $sut::getMessagesByOrderStatus($order));
    }

    public function testMessageForWaitForShipmentWithNoDebitCard()
    {
        $paymentMethods = $this->configurePaymentMethods(PaymentTypes::CREDIT_CARD);
        $order = $this->buildOrderStubForAssociatedProviderNoStatus();

        $order->method('getProductStatus')->willReturn( OrderStatuses::WAITING_FOR_SHIPMENT);
        $order->method('getPaymentMethods')->willReturn($paymentMethods);
        $sut = new Notification();
        $this->assertEquals(['pendiente de cobro'], $sut::getMessagesByOrderStatus($order));
    }

    public function testMessageForReservedInReseller1()
    {
        $order = $this->buildOrderStubForAssocProviderPaymentCreditCard();

        $order->method('getStatus')->willReturn(PurchaseStatus::RESERVED);
        $order->method('getResellerCode')->willReturn(Resellers::RESELLER1);
        $sut = new Notification();
        $this->assertEquals(['pedido confirmado con reseller 1'], $sut::getMessagesByOrderStatus($order));
    }

    public function testMessageForSoldInReseller1()
    {
        $order = $this->buildOrderStubForAssocProviderPaymentCreditCard();

        $order->method('getStatus')->willReturn(PurchaseStatus::SOLD);
        $order->method('getResellerCode')->willReturn(Resellers::RESELLER1);
        $sut = new Notification();
        $this->assertEquals(['pedido confirmado con reseller 1'], $sut::getMessagesByOrderStatus($order));
    }

    public function testMessageForReservedInOtherResellers()
    {
        $order = $this->buildOrderStubForAssocProviderPaymentCreditCard();

        $order->method('getStatus')->willReturn(PurchaseStatus::RESERVED);
        $order->method('getResellerCode')->willReturn(Resellers::RESELLER2);

        $sut = new Notification();
        $this->assertEquals(['pedido confirmado'], $sut::getMessagesByOrderStatus($order));
    }

    public function testMessageForSoldInOtherResellers()
    {
        $order = $this->buildOrderStubForAssocProviderPaymentCreditCard();

        $order->method('getStatus')->willReturn(PurchaseStatus::SOLD);
        $order->method('getResellerCode')->willReturn(Resellers::RESELLER2);
        $sut = new Notification();
        $this->assertEquals(['pedido confirmado'], $sut::getMessagesByOrderStatus($order));
    }

    protected function buildOrderStubForAssocProviderPaymentCreditCard() : MockObject
    {
        $order = $this->buildOrderStubForAssociatedProviderNoStatus();
        $order->method('getProductStatus')->willReturn(OrderStatuses::OK);
        $paymentMethods = $this->configurePaymentMethods(PaymentTypes::CREDIT_CARD);
        $order->method('getPaymentMethods')->willReturn($paymentMethods);

        return $order;
    }
```

Nuestro test de caracterización va tomando forma, pero empieza a padecer varios problemas. De momento, tenemos 29 tests y aún nos quedan muchos casos por cubrir. Además, hemos tenido que introducir métodos para construir los stubs de algunos objetos, lo que dificulta la lectura del código. Puede ser bueno mover estos builders a sus propias clases, de manera que sean más convenientes para generar nuevos casos. Así que vamos a dedicar un rato a eso antes de continuar.

Para no alargar el ejemplo no voy a incluir esa fase en el artículo, en todo caso puedes ver el código evolucionando en [este repositorio](https://github.com/franiglesias/refactoring).

### Completando la caracterización

Después de dedicar un tiempo a refactorizar los tests y asegurarnos de que siguen pasando, es momento de seguir añadiendo casos que describan el comportamiento del método que vamos a refactorizar. El análisis de cobertura nos confirma que nos queda por revisar la rama que corresponde a proveedores no asociados que, hasta cierto punto, es similar a la que acabamos de cubrir.

La estrategia es la misma que hemos seguido hasta ahora: detectar los casos existentes y escribir los tests que los cubren.

Finalmente, 54 tests después, hemos conseguido caracterizar todo el comportamiento del método. ¿Todo? No. Una línea sigue sin ser cubierta por ningún test: el vacío bloque catch de una excepción que parece que nunca se lanza. De momento, la dejaremos pasar. 

Con esto estamos en condiciones de pasar a la fase de refactor propiamente dicha, que dejaremos para un próximo artículo.