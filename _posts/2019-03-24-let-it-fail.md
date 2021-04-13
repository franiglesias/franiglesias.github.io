---
layout: post
title: Let it fail
categories: articles
tags: testing soft-skills ethics
---

Artículo sobre antipatrones en el uso de dobles de tests y algunas heurísticas útiles para hacer buenos tests cuando necesitamos dobles.

Antes de empezar, repasemos los [tests doubles](https://franiglesias.github.io/test-doubles-1/). Podemos clasificarlos en base a dos dimensiones:

* Por su grado de **comportamiento**.
* Por el **conocimiento** que tienen de cómo son usados por la unidad bajo test.

### Por comportamiento

* **Dummies**: no tienen comportamiento. Sus métodos siempre devuelven null.
* **Stubs**: tienen un comportamiento prefijado.
* **Fakes**: implementaciones alternativas para situaciones de test.

### Por conocimiento

* **Passives**: no recogen ninguna información.
* **Spies**: recogen información sobre cómo son usados, la cual se puede consultar para hacer aserciones sobre ellas.
* **Mocks**: tienen expectativas sobre cómo son usados, haciendo fallar el test si no se cumplen.

## Antipatrones

Llamamos **antipatrones** a ciertas formas de resolver un problema que aunque funcionan resultan ser ineficientes o incluso perjudiciales a la larga para nuestros objetivos.

### Dobles sabihondos (smartass doubles)

Cuando testeamos una unidad de software, utilizamos dobles para controlar el comportamiento de los colaboradores, a los cuales no estamos testeando. 

Pero en ocasiones se pueden observar dobles que intentan comportarse como objetos de negocio reales.

Es más fácil de entender con un ejemplo. Supongamos que estamos testeando un *use case* para actualizar un contrato. El *use case* utiliza un servicio colaborador con el que comprueba si el producto se comercializa actualmente y, en caso de que no, lo reemplaza por la versión equivalente que sí esté disponible. 

El servicio debe ser doblado para hacer el test unitario, pero no tenemos que hacer que este mock "sepa" qué productos están descatalogados y cómo hacer la conversión. Dicho de otro modo: no necesitamos programar en el mock ninguna lógica que haga esa conversión. 

En nuestro test solo necesitamos simular que se ha solicitado un producto y se obtiene otro. Lo que estamos testeando es la capacidad del Use Case para devolver el producto actualizado.

Este fragmento de test intenta construir un doble de `ProductRepository` que "sepa" que si pasamos un *id* que corresponde a un producto descatalogado "de verdad", devuelve un nuevo producto. En este caso se hace poniendo como condición que se pasa un valor determinado como parámetro al método `byId`.

```php
public function testShouldUpdateProductIfDeprecated(): void
{
    $newProduct = $this->createMock(Product::class);
    $productRepository = $this->createMock(ProductRepositoryInterface::class);
    $productRepository->method('byId')
        ->willReturn($newProduct)
        ->with('deprecated-product-id');
    //...
}
```

Pero no hace falta, a efectos del test unitario eso es completamente transparente:

```php
public function testShouldUpdateProductIfDeprecated(): void
{
    $newProduct = $this->createMock(Product::class);
    $productRepository = $this->createMock(ProductRepositoryInterface::class);
    $productRepository->method('byId')
        ->willReturn($newProduct)
    //...
}
```

El test del comportamiento de actualización (que un producto X es sustituido exactamente por un producto Y que es su sucesor según la definición del negocio) corresponde en el nivel unitario al servicio que hace esa función y esa situación merece su propio test en el nivel de aceptación.

Este antipatrón indicaría que se están intentando testear en el nivel unitario responsabilidades que corresponderían al test del colaborador *mockeado*, o que se deberían testear a nivel de aceptación.

### Demasiadas expectativas

Normalmente, tener demasiadas expectativas sobre algo es malo porque es fácil que el resultado final sea decepcionante. Pues bien: en el mundo del testing ocurre lo mismo.

Tenemos dos situaciones:

Cuanto testeamos una **unidad de software que devuelve una respuesta con la ayuda de colaboradores** no necesitamos hacer expectativas sobre esos colaboradores. Nos basta con hacer stubs de las distintas formas posibles de su comportamiento.

Lo que estamos probando es cómo reacciona la unidad bajo test a esos posibles comportamientos de los colaboradores que nosotros definimos en el contexto de cada test. Por ejemplo: el colaborador devuelve un resultado, no devuelve nada o lanza una o varias excepciones.

Por su parte, **cuando testeamos un comando**, que no devuelve una respuesta pero provoca un efecto, en el nivel unitario la única forma que tenemos de testear es mediante un *mock* del efecto que esperamos. Por ejemplo, nuestra unidad de software puede recibir un DTO, construir una entidad a partir de los datos de ese objeto y guardarla en un repositorio. Este último paso sería justamente el efecto que queremos testear.

Este test tiene un exceso de expectativas:

```php
public function testValidApplicationIdShouldSignAndCreateContract(): void
{
    $application = $this->createMock(Application::class);
    $application->expects($this->once())
        ->method('isClientChange')
        ->willReturn(false);
    $this->applicationRepository
        ->method('byIdOrFail')
        ->willReturn($application);

    $this->applicationRepository->expects($this->once())->method('startTransaction');
    $this->createContractFromApplication->expects($this->once())->method('execute');
    $this->applicationRepository->expects($this->once())->method('commitTransaction');

    $this->signContract->execute('1234');
}
```

No hace falta esperar el método `isClientChange` porque para que ocurran lo que el test dice, tiene que haber ocurrido antes que se ha llamado a ese método y ha entregado el valor `false`, pues un vistazo al código nos diría que si el valor es `true` hay que realizar otras operaciones antes.

Tampoco es necesario verificar las llamadas para hacer transaccional esta operación en el test unitario. De hecho, no nos afecta para nada en este nivel ya que no se trata de un repositorio real. Es algo que comprobaríamos en un test de integración o de aceptación, en el que probaremos que si falla la operación que ocurre en `createContractFromApplication` no se ejecutan otras acciones dependientes de esa.

De hecho, nos puede perjudicar si en algún momento decidimos que la transaccionalidad se gestiona de otra forma, por ejemplo mediante un Middleware de un CommandBus a través del cual se ejecute este UseCase. Lo único que hacen esos `expects` es acoplar nuestro test a la implementación.

```php
public function testValidApplicationIdShouldSignAndCreateContract(): void
{
    $application = $this->createMock(Application::class);
    $application
        ->method('isClientChange')
        ->willReturn(false);
    $this->applicationRepository
        ->method('byIdOrFail')
        ->willReturn($application);

    $this->createContractFromApplication->expects($this->once())->method('execute');

    $this->signContract->execute('1234');
}
```

El hecho es que si la entidad garantiza por sí misma una construcción consistente[^fn1], no tenemos ninguna necesidad de *mockear* nada en el DTO. Tan solo entregar un DTO real adecuado para el test o hacer un stub del mismo si nos es más sencillo hacerlo así.

[^fn1]: porque tus entidades garantizan una construcción consistente, ¿verdad?

Lo que sí hacemos es establecer una expectativa sobre el hecho de que la entidad se guarde. O sea, que el método `save` o `store` del repositorio sea llamado. Si necesitamos más precisión podemos testear que sea llamado con una entidad determinada.

En ese caso, puede ser buena idea delegar la construcción de la entidad a partir del DTO a un servicio, de modo que podamos hacer un `stub` del mismo y entregar la entidad que queremos, lo que nos garantizaría que la unidad de software tiene el comportamiento deseado.

No debemos hacer *mocks* de DTO, requests, etc. Es decir, no debemos establecer expectativas sobre cómo esos objetos son usados, pues no hacen más que acoplar el test y la implementación del SUT.

## Let It Fail: una heurística para descubrir cómo hacer los dobles

### Cómo descubrir los test dobles

***Let It Fail*** es una heurística para construir test doubles.

Cuando vamos a testear una clase que utiliza colaboradores es fácil caer en la tentación de intentar diseñar sus dobles. Nuestra propuesta es no hacerlo, sino dejar que sea el propio test el que nos diga lo que necesitamos.

**Set Up del TestCase** En el `setUp` inicializamos como *dummies* todos los colaboradores necesarios para instanciar nuestro **Subject Under Test** o **SUT**. Nuestro objetivo es que se pueda instanciar y nada más, no vamos a hacer *stubs* de ningún comportamiento, ni mucho menos *mocks*.


```php
protected function setUp()
{
    $this->registrationRepository = $this->createMock(RegistrationRepositoryInterface::class);
    $this->contractRepository = $this->createMock(ContractRepositoryInterface::class);
    $this->walleSipsCommunication = $this->createMock(WalleSipsCommunicationInterface::class);
    $this->municipalitiesCommunication = $this->createMock(MunicipalitiesCommunicationInterface::class);
    $this->clientCommunication = $this->createMock(ClientCommunicationInterface::class);
    $this->rateRepository = $this->createMock(RateRepositoryInterface::class);
    $this->generateRegistrationFile = $this->createMock(GenerateRegistrationFile::class);
    $this->guessEnagasCode = $this->createMock(GuessEnagasCode::class);
    $this->eventBus = $this->createMock(MessageBus::class);

    $this->createValidatedRegistration = new CreateValidatedRegistration(
        $this->registrationRepository,
        $this->contractRepository,
        $this->walleSipsCommunication,
        $this->municipalitiesCommunication,
        $this->clientCommunication,
        $this->rateRepository,
        $this->generateRegistrationFile,
        $this->guessEnagasCode,
        $this->eventBus
    );
}
```

**Primer test** A continuación buscamos el resultado posible de ejecutar el **SUT** más inmediato que podamos conseguir y que suele ser una excepción o un retorno precoz.

Lo primero es preparar los parámetros que necesita el método que vamos a ejercitar en el test. Si estos parámetros son objetos, podemos usar el objeto reales o dobles. 

Muchas veces es mejor empezar también con *dummies*. Si los objetos que pasamos son complejos o no tenemos claro qué datos concretos necesitan es mucho más cómodo. En algunos casos, ese objeto solo se va a ir moviendo de colaborador en colaborador, así que eso que salimos ganando.

Una vez que el escenario está listo, ejecutamos el test y observamos lo que ocurre. Aquí tenemos un ejemplo y, como vemos, ni siquiera es necesario hacer que el doble de `RegistrationDto` devuelva datos.

```php
public function testShouldNotGenerateRegistrationIfEmptyData(): void
{
    /** @var RegistrationDto | MockObject $registrationDto */
    $registrationDto = $this->createMock(RegistrationDto::class);
    $this->generateRegistrationFile->expects(self::never())->method('execute');

    $result = $this->createValidatedRegistration->execute($registrationDto);

    $this->assertFalse($result->errors()->isEmpty());
}
```

Si lanza un error o una excepción puede tratarse de dos cosas:

* **Una excepción propia del comportamiento bajo test**, en cuyo caso lo que hacemos es testear que se lanza la excepción en esas condiciones. Por ejemplo, hemos pasado un parámetro inválido, cosa detectada en una cláusula de guarda la cual lanza una excepción. Así que ese es un comportamiento esperable del SUT y nuestro test verifica que si pasamos un parámetro no válido se lanzará la excepción y hacemos que el test verifique eso.
* **Una excepción o error debidos a que no estamos pasando datos en los parámetros**. Por ejemplo, hemos pasado un objeto *dummy* que solo devuelve `null` y que debería permitir al **SUT** obtener un id con el que buscar en un repositorio. Pero como solo devuelve *null* no se satisface el *type hinting* del colaborador que espera un objeto `Uuid`, por ejemplo. En este caso, arreglamos lo que sea necesario para que ese parámetro tenga un valor adecuado, bien sea personalizando el objeto, bien sea fijando *stubs* a través de su doble.

En otras ocasiones puede ocurrir que necesitemos simular el comportamiento de uno de los colaboradores que pasamos al principio. Por ejemplo, un repositorio puede tener que devolver un objeto en una llamada `getById`, o un conjunto de ellos en un un `findBy`, o bien lanzar una excepción porque no se encuentra lo buscado. Lo mismo se puede aplicar a cualquier servicio.

Aquí tenemos un ejemplo de un test en el que solo hacemos stub de uno de los getters del DTO (que en total tiene unos treinta):

```php
public function testShouldDetectInvalidPersonId(): void
{
    /** @var RegistrationDto | MockObject $registrationDto */
    $registrationDto = $this->createMock(RegistrationDto::class);
    $registrationDto->method('personIdNumber')->willReturn('00000000F');

    $result = $this->createValidatedRegistration->execute($registrationDto);

    $this->assertNotNull($result->errors()->get('person_id'));
}
```

## To Mock or not to Mock? Una heurística para determinar que colaboradores necesitan *stubs*

### Si el SUT es un Query

Si el **subject under test** devuelve una respuesta, siempre testearemos sobre la respuesta, por lo que únicamente haremos *dummies* o *stubs* en los colaboradores doblados.

Haremos `stub` de los métodos de los dobles que el test nos vaya pidiendo. Por ejemplo, si un repo tiene que devolver una entidad para que otro servicio la reciba y haga algo con ella, haremos un doble de la entidad, hacemos el stub de la respuesta del repo y ya está.

En ese caso no ponemos ningún `expects` en los dobles. Si el test pasa correctamente, es que se han realizado las llamadas necesarias. Si el test no pasa, indicaría que no se está moviendo la información de la manera esperada.

### Si el SUT es un Command

¿Qué podemos testear si el **subject under test** no devuelve una respuesta, sino que produce un efecto en el sistema?

En el nivel unitario no tenemos forma de observar un efecto real en el sistema, así que en este caso sí tendremos que recurrir a *mocks*.

¿Qué debemos mockear? Pues aquello que hayamos definido como efecto deseado del **subject under test**. Por ejemplo, si el efecto es crear y guardar una entidad en un repositorio, lo que haremos será definir que el repositorio espera que se llame el método `save` con una entidad.

Podemos ser más precisos definiendo qué entidad exacta esperamos recibir (o qué características tiene), aunque hay que tener en cuenta que si se cumple lo siguiente, realmente no hay que llegar a tanta precisión:

* Si el método save tiene *type hinting*, fallará si no recibe una entidad.
* Si la entidad solo se puede construir de manera consistente, el test fallará si pretendemos crearla con datos inconsistentes.

En cualquier caso, la construcción consistente de la entidad debería estar testeada en otra parte. Incluso, puede ser buena idea sacarla del SUT y llevarla a otro colaborador que sí podríamos testear.

## Usar mocks para entender el legacy

Supón que haces un doble de un clase que tiene muchos métodos (frecuentemente alguna entidad o un objeto request que lleva muchos datos). ¿Necesitas hacer stubs de todos esos métodos? ¿Cuáles son realmente necesarios? ¿Tenemos que doblarlos todos?

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

Pues bien, basta con convertir los *stubs* en *mocks*, añadiendo `expects`. Si al ejecutar el test falla la expectativa diciendo que aunque espera llamadas no se ha usando nunca, entonces puedes eliminar ese *stub* ya que nunca se llama, al menos en el contexto de ese test.

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

Si este código falla, puedes quitar el stub del método `email`:

```php
    $request = $this->createMock(Request::class);
    
    // stub methods
    $request->method('id')->willReturn('some-id');
    $request->method('name')->willReturn('some-name');
    $request->method('address')->willReturn('some-address');
    $request->method('data')->willReturn('some-data');
```

En cambio, si el `expects` no falla, es que ese stub era necesario. Pero sí retiramos la expectativa para evitar el antipatrón.

También podemos controlar esto de una manera indirecta. Como decíamos antes, los dobles nacen como *dummies*, por lo que todos los métodos devuelven `null`. Si el código bajo tiene que usar la salida de alguno de esos métodos lo más seguro es que falle, bien sea por temas de *type hinting*, bien porque espera un tipo o una interfaz. Este fallo nos está indicando qué debería devolver el método, por lo que podremos hacer su stub.

Por cierto que eso nos llevará seguramente a encontrarnos con un montón de violaciones de la Ley de Demeter.

## Lo que pasa en el doble se queda en el doble

Los dobles de tests se utilizan para simular el comportamiento de objetos colaboradores de aquel que estemos probando. Con frecuencia, debido a la naturaleza del comportamiento testeado no es posible hacer aserciones sobre la respuesta del *subject under test* o de sus efectos en el sistema. Por esa razón, establecemos expectativas sobre los dobles: esperamos que sean usados por nuestro *SUT* de cierta manera, lo que los convierte en *mocks* y son la base para que nuestro test nos aporte alguna información.

Un caso típico puede ser un test unitario de un servicio que utiliza un objeto Mailer para enviar un mensaje de correo electrónico. No podemos observar ese efecto para los objetivos del test, tan solo podemos recoger su respuesta (el Mailer podría devolver un código que nos diga si el envío se ha realizado) o bien asegurarnos de que ha sido llamado por el *SUT* con los parámetros esperados:

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

A nivel de tests unitarios normalmente no es necesario crear Fakes que tengan comportamiento real, o asimilable a real. En consecuencia no necesitamos doblar  ni sus dependencias ni los objetos que use internamente. Debemos ver esa dependencia de nuestro SUT como una caja negra con una interfaz pública de la que podemos esperar ciertos comportamientos, representados por outputs que nos interesa probar. Lo único que tenemos que hacer es simular esos outputs, incluyendo lanzar excepciones, para verificar que nuestro código bajo test reacciona adecuadamente.


