---
layout: post
title: TDD outside-in y testing inside-out
categories: articles
tags: testing
---

Una de las preguntas sobre TDD outside-in que más me hacen es acerca del uso de los mocks. Al fin y al cabo, acoplan los tests a la implementación y eso no está bien.

La respuesta corta es que, normalmente, esos tests no los dejo así, sino que vuelvo sobre ellos y los modifico para que sean más útiles.

La respuesta larga es este artículo.

## TDD mockista

A _TDD outside-in_ se le suele llamar también mockista por la razón obvia de que se utilizan los mocks en los ciclos de TDD clásica con el objetivo de diseñar los objetos que van a trabajar juntos en un componente. [Sandro Mancuso tiene un artículo fundamental sobre este tema](https://www.codurance.com/publications/2018/10/18/mocking-as-a-design-tool).

Esto ha provocado algunas críticas. Como decíamos en la introducción, los mocks acoplan el test a la implementación, dado que establecen expectativas sobre los mensajes que los objetos van a intercambiar. Por tanto, si nos viésemos en la necesidad de cambiar loe mensaje, su orden o su número, el test podría fallar por razones ajenas a su comportamiento, al no cumplir las expectativas de los mocks.

Sin embargo, en TDD outside-in, una vez que hemos completado el desarrollo de una prestación, el test ya no está cumpliendo su función de ser herramienta de diseño. Podríamos plantearnos eliminarlo o transformarlo, para convertirlo en un test de QA más fiable y menos acoplado.

Para ello lo que haremos será reemplazar los mocks por _fakes_ o por _stubs_ programables. Una cosa que me gustaría dejar muy clara es que todos los dobles de test, independientemente de la forma en que los obtengamos, ya sea mediante una librería o creando implementaciones propias, van a cumplir su función de simular el funcionamiento de una pieza de software de la que queremos tener controlado su comportamiento.

La diferencia, para el objetivo del artículo, reside en el acoplamiento entre el test y el código de producción. Como veremos, los mocks creados con una librería exponen muchos detalles de implementación en el propio test. Para simular el comportamiento tenemos que describir la forma en que usamos los colaboradores en el código de producción. En el otro caso, son implementaciones alternativas limitadas, pero que se ajustan al contrato definido por la interfaz.

### Fakes

Un Fake es un doble de test que implementa una interfaz, pero lo hace de una manera que sea barata para la ejecución del test. Por lo general, los mocks representan objetos que implementan tecnologías del mundo real, como bases de datos o servicios remotos. No es buena idea usar tecnologías reales en los tests dado que tienen costes de puesta en marcha, de performance y pueden introducir muchísimo ruido en los tests.

Si hemos hecho una abstracción adecuada, podremos usar implementaciones alternativas que tengan un comportamiento similar, pero con un coste menor. Bien sea porque usan una tecnología mucho más barata, como podría ser implementar una base de datos sencilla en memoria, bien porque imitan un comportamiento en el que estamos interesadas.

### Stubs

A veces no es posible crear una implementación alternativa completa. En ese caso, usaremos _stubs_. Los _stubs_ nos permiten simular aquellos comportamientos que nos vienen de los colaboradores de un objeto. En el caso más simple, ese comportamiento está fijado. En otros casos, podemos parametrizarlo un poco. Por ejemplo, podríamos simular una llamada a una API: en una implementación simulamos que se obtiene una respuesta completa, mientras que en otras, simulamos distintos tipos de errores que debemos gestionar.

### Inside-out

Con frecuencia, cuando realizo esta sustitución de mocks por otros objetos, empiezo por los más internos en el ciclo de vida de la petición y me voy moviendo hacia afuera. Esto, en ocasiones, me permite reutilizar algunas de estas implementaciones.

El resultado de este refactor va a ser un test más robusto, resistente a cambios de la implementación y, generalmente, mucho más fácil de entender.

## Ejemplos

Para este artículo voy a utilizar el proyecto de la serie sobre _Vertical Slice Architecture_, puesto que tiene varios ejemplos de tests en los que se utilizan mocks.

### Stub mediante self-shunt

Vamos a empezar con el test del _Handler_ del comando `ReadProposal`. En nuestro caso solo tiene una dependencia de la interfaz `RetrieveProposal`. Este test no hace más que verificar que el _Handler_ recupera una `Proposal` pasando su identificador. `RetrieveProposal` representa la capacidad de recuperar los datos de `Proposal` almacenados, por lo que buscamos simular que tenemos una base de datos que los contiene.

```php
final class ReadProposalHandlerTest extends TestCase
{
    /** @test */
    public function should_retrieve_proposal_with_id(): void
    {
        $proposalId = '01HXE2R5JBCRKAA3K0BZ1TCXT2';
        $now = new \DateTimeImmutable();

        $proposal = new Proposal(
            $proposalId,
            'Proposal Title',
            'A description or abstract of the proposal',
            'Fran Iglesias',
            'fran.iglesias@example.com',
            'talk',
            true,
            'Vigo, Galicia',
            'waiting',
            $now,
        );

        $retrieveProposal = $this->createMock(RetrieveProposal::class);
        $retrieveProposal->method('__invoke')->willReturn($proposal);

        $handler = new ReadProposalHandler($retrieveProposal);
        $command = new ReadProposal($proposalId);

        $response = ($handler)($command);

        assertEquals($proposalId, $response->id);
        assertEquals('Proposal Title', $response->title);
        assertEquals('A description or abstract of the proposal',
            $response->description);
        assertEquals('Fran Iglesias', $response->author);
        assertEquals('fran.iglesias@example.com', $response->email);
        assertEquals('talk', $response->type);
        assertEquals(true, $response->sponsored);
        assertEquals('Vigo, Galicia', $response->location);
        assertEquals('waiting', $response->status);
        assertEquals($now, $response->receivedAt);
    }
}
```

Actualmente, simulamos ese comportamiento mediante este _mock_:

```php
$retrieveProposal = $this->createMock(RetrieveProposal::class);
$retrieveProposal->method('__invoke')->willReturn($proposal);
```

Vamos a reemplazar el mock usando la técnica de _self shunt_. Consiste en usar el test como doble, haciéndole implementar la interfaz del colaborador y pasándoselo al handler. Ya he hablado anteriormente de esta técnica, que puede ser útil en casos sencillos, cuando no nos interesa crear una clase completamente nueva.

Una ventaja adicional es que nos va a permitir esconder muchos detalles dejando el test muy limpio.

**Implementar la interfaz en el mismo test** En primer lugar, hacemos que el test implemente la interfaz, lo que nos obligará a introducir un método `__invoke`.

```php
final class ReadProposalHandlerTest extends TestCase implements RetrieveProposal
{
    /** @test */
    public function should_retrieve_proposal_with_id(): void
    {
        // Code removed for clarity
    }

    public function __invoke(string $id): Proposal
    {
        throw new \RuntimeException('Implement __invoke() method.');
    }
}
```

`__invoke` tiene que devolver un objeto `Proposal`, así que nos interesa mover su creación dentro del propio método. Por desgracia, dependemos de un par de datos (`$proposalId` y `$now`) que necesitamos utilizar en otras partes del código. En este caso, lo vamos a solucionar introduciendo constantes de clase, de este modo usamos el mismo dato en todos los lugares en los que necesitemos.

```php
final class ReadProposalHandlerTest extends TestCase implements RetrieveProposal
{
    private const string PROPOSAL_ID = '01HXE2R5JBCRKAA3K0BZ1TCXT2';
    private const string NOW = '2024-05-15 21:05';

    /** @test */
    public function should_retrieve_proposal_with_id(): void
    {
        $retrieveProposal = $this->createMock(RetrieveProposal::class);
        $retrieveProposal->method('__invoke')->willReturn($proposal);

        $handler = new ReadProposalHandler($retrieveProposal);
        $command = new ReadProposal(self::PROPOSAL_ID);

        $response = ($handler)($command);

        assertEquals(self::PROPOSAL_ID, $response->id);
        assertEquals('Proposal Title', $response->title);
        assertEquals('A description or abstract of the proposal', $response->description);
        assertEquals('Fran Iglesias', $response->author);
        assertEquals('fran.iglesias@example.com', $response->email);
        assertEquals('talk', $response->type);
        assertEquals(true, $response->sponsored);
        assertEquals('Vigo, Galicia', $response->location);
        assertEquals('waiting', $response->status);
        assertEquals(new \DateTimeImmutable(self::NOW), $response->receivedAt);
    }

    public function __invoke(string $id): Proposal
    {
        return new Proposal(
            self::PROPOSAL_ID,
            'Proposal Title',
            'A description or abstract of the proposal',
            'Fran Iglesias',
            'fran.iglesias@example.com',
            'talk',
            true,
            'Vigo, Galicia',
            'waiting',
            new \DateTimeImmutable(self::NOW),
        );
    }
}
```

Con este cambio el test no funcionará, tenemos que pasar el test como colaborador al handler:

```php
final class ReadProposalHandlerTest extends TestCase implements RetrieveProposal
{
    private const string PROPOSAL_ID = '01HXE2R5JBCRKAA3K0BZ1TCXT2';
    private const string NOW = '2024-05-15 21:05';

    /** @test */
    public function should_retrieve_proposal_with_id(): void
    {
        $handler = new ReadProposalHandler($this);
        $command = new ReadProposal(self::PROPOSAL_ID);

        $response = ($handler)($command);

        assertEquals(self::PROPOSAL_ID, $response->id);
        assertEquals('Proposal Title', $response->title);
        assertEquals('A description or abstract of the proposal',
            $response->description);
        assertEquals('Fran Iglesias', $response->author);
        assertEquals('fran.iglesias@example.com', $response->email);
        assertEquals('talk', $response->type);
        assertEquals(true, $response->sponsored);
        assertEquals('Vigo, Galicia', $response->location);
        assertEquals('waiting', $response->status);
        assertEquals(new \DateTimeImmutable(self::NOW), $response->receivedAt);
    }

    public function __invoke(string $id): Proposal
    {
        return new Proposal(
            self::PROPOSAL_ID,
            'Proposal Title',
            'A description or abstract of the proposal',
            'Fran Iglesias',
            'fran.iglesias@example.com',
            'talk',
            true,
            'Vigo, Galicia',
            'waiting',
            new \DateTimeImmutable(self::NOW),
        );
    }
}
```

Por último, podemos ocultar la verificación de `Proposal` a un método y todo quedará más claro:

```php
final class ReadProposalHandlerTest extends TestCase implements RetrieveProposal
{
    private const string PROPOSAL_ID = '01HXE2R5JBCRKAA3K0BZ1TCXT2';
    private const string NOW = '2024-05-15 21:05';

    /** @test */
    public function should_retrieve_proposal_with_id(): void
    {
        $handler = new ReadProposalHandler($this);
        $command = new ReadProposal(self::PROPOSAL_ID);

        $response = ($handler)($command);

        $this->assertIsTheExpectedProposal($response);
    }

    public function __invoke(string $id): Proposal
    {
        return new Proposal(
            self::PROPOSAL_ID,
            'Proposal Title',
            'A description or abstract of the proposal',
            'Fran Iglesias',
            'fran.iglesias@example.com',
            'talk',
            true,
            'Vigo, Galicia',
            'waiting',
            new \DateTimeImmutable(self::NOW),
        );
    }

    public function assertIsTheExpectedProposal(ReadProposalResponse $response): void {
        assertEquals(self::PROPOSAL_ID, $response->id);
        assertEquals('Proposal Title', $response->title);
        assertEquals('A description or abstract of the proposal',
            $response->description);
        assertEquals('Fran Iglesias', $response->author);
        assertEquals('fran.iglesias@example.com', $response->email);
        assertEquals('talk', $response->type);
        assertEquals(true, $response->sponsored);
        assertEquals('Vigo, Galicia', $response->location);
        assertEquals('waiting', $response->status);
        assertEquals(new \DateTimeImmutable(self::NOW), $response->receivedAt);
    }
}
```

Fíjate que ahora el código principal del test es sencillo y claro.

La técnica de _self-shunt_ puede ser muy útil y práctica al evitarnos introducir nuevos objetos que solo tendrán un uso y permitiéndonos mantener mucha información accesible en el test, como en el caso de las constantes que hemos introducido para mantener la consistencia (en principio podríamos haber creado constantes para todos los campos de `Proposal`). 

El lado negativo del _self-shunt_ es que puede ser desconcertante si no estás familiarizada con ella.

### Stub simple con clase anónima

Si vamos de adentro hacia afuera en la feature _ReadProposal_ nos encontramos con un test unitario del controlador. En esta ocasión el objeto del que hacemos un _mock_ es el _Handler_ al que programamos que devuelva un objeto `ReadProposalResponse` cuando es invocado. Fíjate que no estamos fijando ninguna expectativa sobre la llamada, sino que simplemente describimos lo que tiene que pasar cuando enviemos el mensaje `__invoke` a `ReadProposalHandler`. Esto es básicamente un _stub_. Esta forma de hacerlo es la que acopla el test con la implementación.

```php
final class ReadProposalControllerTest extends TestCase
{
    /** @test */
    public function should_retrieve_proposal_by_id(): void
    {
        $id = '01HXMBMMXAG7S1ZFZH98HS3CHP';
        $receivedAt = new \DateTimeImmutable();

        $request = Request::create(
            '/api/proposals/'.$id,
            'GET',
            [],
            [],
            [],
            ['CONTENT-TYPE' => 'json/application'],
        );

        $handler = $this->createMock(ReadProposalHandler::class);

        $query = new ReadProposal($id);

        $expected = new ReadProposalResponse(
            $id,
            'Proposal Title',
            'A description or abstract of the proposal',
            'Fran Iglesias',
            'fran.iglesias@example.com',
            'talk',
            true,
            'Vigo, Galicia',
            'waiting',
            $receivedAt,
        );

        $handler
            ->method('__invoke')
            ->with($query)
            ->willReturn($expected);

        $controller = new ReadProposalController($handler);
        $response = ($controller)($id, $request);

        $body = json_encode(
            [
                'id' => $id,
                'title' => 'Proposal Title',
                'description' => 'A description or abstract of the proposal',
                'author' => 'Fran Iglesias',
                'email' => 'fran.iglesias@example.com',
                'type' => 'talk',
                'sponsored' => true,
                'location' => 'Vigo, Galicia',
                'status' => 'waiting',
                'receivedAt' => $receivedAt,
            ]
        );

        assertEquals(200, $response->getStatusCode());
        assertEquals($body, $response->getContent());
    }
}
```

Dos observaciones importantes aquí:

* No tenemos interfaz explícita del Handler, ya que no necesitamos implementaciones alternativas
* La lógica interna del Handler está probada en el test anterior

¿Qué opciones tenemos aquí aparte de dejarlo como está?

La primera es extraer la interfaz del Handler, de este modo podríamos simularlo mediante _self-shunt_ o mediante una implementación _fake_.

El inconveniente de esta opción es introducir una interfaz que va a tener una única implementación.

La segunda es no doblar el Handler, sino sus colaboradores problemáticos. Exacto: lo mismo que hicimos en el test anterior. Ahora podrías decir que deberíamos haber hecho el doble de test de otra forma para poder reutilizarlo. De todos modos, hay que andarse con cuidado en el tipo de objetos que reutilizamos en los tests.

Con esta opción es cierto que testeamos dos veces el comportamiento del _Handler_, lo que podría introducir algo de ruido en el test del controlador, que deja de ser un test unitario en el sentido de una unidad de código aislada. Sin embargo, en la práctica, el test cubrirá una parte de código que siempre se ejecuta junta, como si fuese una unidad. La parte que doblamos es el acceso a la base de datos, que está en el límite del sistema y, por definición, siempre tendríamos que doblarla.

Para este ejemplo, voy a hacer un stub puro: un objeto que siempre devuelve lo mismo al ser utilizado. Lo vamos a instanciar mediante una clase anónima. Esto nos evita introducir objetos que se puedan reutilizar, o al menos, comunica claramente el mensaje de que su valor está en el ámbito del test que se crea. Como en el caso anterior, tenemos que pasar algunos valores a constantes de clase para que sea posible reutilizarlos. En este caso son públicas para que estén accesibles al crear el objeto doble. Alternativamente, podríamos pasarlas como parámetros al constructor de la clase anónima.

```php
final class ReadProposalControllerTest extends TestCase
{
    public const string PROPOSAL_ID = '01HXMBMMXAG7S1ZFZH98HS3CHP';
    public const string NOW = '2024-05-15 12:34:56';

    /** @test */
    public function should_retrieve_proposal_by_id(): void
    {
        $request = Request::create(
            '/api/proposals/'. self::PROPOSAL_ID,
            'GET',
            [],
            [],
            [],
            ['CONTENT-TYPE' => 'json/application'],
        );

        $handler = $this->createMock(ReadProposalHandler::class);

        $query = new ReadProposal(self::PROPOSAL_ID);

        $expected = new ReadProposalResponse(
            self::PROPOSAL_ID,
            'Proposal Title',
            'A description or abstract of the proposal',
            'Fran Iglesias',
            'fran.iglesias@example.com',
            'talk',
            true,
            'Vigo, Galicia',
            'waiting',
            new \DateTimeImmutable(self::NOW),
        );

        $handler
            ->method('__invoke')
            ->with($query)
            ->willReturn($expected);

        $controller = new ReadProposalController($handler);
        $response = ($controller)(self::PROPOSAL_ID, $request);

        $body = json_encode(
            [
                'id' => self::PROPOSAL_ID,
                'title' => 'Proposal Title',
                'description' => 'A description or abstract of the proposal',
                'author' => 'Fran Iglesias',
                'email' => 'fran.iglesias@example.com',
                'type' => 'talk',
                'sponsored' => true,
                'location' => 'Vigo, Galicia',
                'status' => 'waiting',
                'receivedAt' => new \DateTimeImmutable(self::NOW),
            ]
        );

        assertEquals(200, $response->getStatusCode());
        assertEquals($body, $response->getContent());
    }
}
```

Ahora vamos a introducir la creación del servicio doblado que representa la lectura de la base de datos:

```php
final class ReadProposalControllerTest extends TestCase
{
    public const string PROPOSAL_ID = '01HXMBMMXAG7S1ZFZH98HS3CHP';
    public const string NOW = '2024-05-15 12:34:56';

    // Code removed for clarity

    private function buildRetrieveProposalDouble(): RetrieveProposal
    {
        return new class() implements RetrieveProposal {

            public function __invoke(string $id): Proposal
            {
                return new Proposal(
                    ReadProposalControllerTest::PROPOSAL_ID,
                    'Proposal Title',
                    'A description or abstract of the proposal',
                    'Fran Iglesias',
                    'fran.iglesias@example.com',
                    'talk',
                    true,
                    'Vigo, Galicia',
                    'waiting',
                    new \DateTimeImmutable(ReadProposalControllerTest::NOW),
                );
            }
        };
    }
}
```

El siguiente paso consiste en inyectarlo al Handler para instanciar el controlador. Al hacerlo así, nos sobran las variables `$query` y `$response`, porque ya no tenemos que simular la invocación del Handler, lo que simplifica el test.

```php
final class ReadProposalControllerTest extends TestCase
{
    public const string PROPOSAL_ID = '01HXMBMMXAG7S1ZFZH98HS3CHP';
    public const string NOW = '2024-05-15 12:34:56';

    /** @test */
    public function should_retrieve_proposal_by_id(): void
    {
        $request = Request::create(
            '/api/proposals/' . self::PROPOSAL_ID,
            'GET',
            [],
            [],
            [],
            ['CONTENT-TYPE' => 'json/application'],
        );


        $handler = new ReadProposalHandler($this->buildRetrieveProposalDouble());

        $controller = new ReadProposalController($handler);
        $response = ($controller)(self::PROPOSAL_ID, $request);

        $body = json_encode(
            [
                'id' => self::PROPOSAL_ID,
                'title' => 'Proposal Title',
                'description' => 'A description or abstract of the proposal',
                'author' => 'Fran Iglesias',
                'email' => 'fran.iglesias@example.com',
                'type' => 'talk',
                'sponsored' => true,
                'location' => 'Vigo, Galicia',
                'status' => 'waiting',
                'receivedAt' => new \DateTimeImmutable(self::NOW),
            ]
        );

        assertEquals(200, $response->getStatusCode());
        assertEquals($body, $response->getContent());
    }

    private function buildRetrieveProposalDouble(): RetrieveProposal
    {
        return new class() implements RetrieveProposal {

            public function __invoke(string $id): Proposal
            {
                return new Proposal(
                    ReadProposalControllerTest::PROPOSAL_ID,
                    'Proposal Title',
                    'A description or abstract of the proposal',
                    'Fran Iglesias',
                    'fran.iglesias@example.com',
                    'talk',
                    true,
                    'Vigo, Galicia',
                    'waiting',
                    new \DateTimeImmutable(ReadProposalControllerTest::NOW),
                );
            }
        };
    }
}
```

Como último paso, podemos introducir métodos privados para encapsular la creación tanto de la _request_ como del _payload_ de la respuesta. Esto hace que el cuerpo del test sea más conciso y comprensible.

```php
final class ReadProposalControllerTest extends TestCase
{
    public const string PROPOSAL_ID = '01HXMBMMXAG7S1ZFZH98HS3CHP';
    public const string NOW = '2024-05-15 12:34:56';

    /** @test */
    public function should_retrieve_proposal_by_id(): void
    {
        $handler = new ReadProposalHandler($this->buildRetrieveProposalDouble());
        $controller = new ReadProposalController($handler);

        $request = $this->buildRequest('/api/proposals/' . self::PROPOSAL_ID);
        $response = ($controller)(self::PROPOSAL_ID, $request);

        assertEquals(200, $response->getStatusCode());
        assertEquals($this->buildExpectedPayload(), $response->getContent());
    }

    private function buildRetrieveProposalDouble(): RetrieveProposal
    {
        return new class() implements RetrieveProposal {

            public function __invoke(string $id): Proposal
            {
                return new Proposal(
                    ReadProposalControllerTest::PROPOSAL_ID,
                    'Proposal Title',
                    'A description or abstract of the proposal',
                    'Fran Iglesias',
                    'fran.iglesias@example.com',
                    'talk',
                    true,
                    'Vigo, Galicia',
                    'waiting',
                    new \DateTimeImmutable(ReadProposalControllerTest::NOW),
                );
            }
        };
    }

    private function buildRequest(string $uri): Request
    {
        return Request::create(
            $uri,
            'GET',
            [],
            [],
            [],
            ['CONTENT-TYPE' => 'json/application'],
        );
    }

    private function buildExpectedPayload(): string|false
    {
        return json_encode(
            [
                'id' => self::PROPOSAL_ID,
                'title' => 'Proposal Title',
                'description' => 'A description or abstract of the proposal',
                'author' => 'Fran Iglesias',
                'email' => 'fran.iglesias@example.com',
                'type' => 'talk',
                'sponsored' => true,
                'location' => 'Vigo, Galicia',
                'status' => 'waiting',
                'receivedAt' => new \DateTimeImmutable(self::NOW),
            ]
        );
    }
}
```

Alternativamente, podríamos reescribir estas construcciones usando el patrón _Object Mother_, lo que nos daría la oportunidad tanto de reutilizarlos como de simplificar un poco más el código.

### Fake _espiable_ y Stub programable

Para el siguiente apartado vamos a movernos a la prestación de escritura, `SendProposal` en la que tenemos que usar varios dobles de test, ya que encapsulamos un par de servicios no deterministas (el reloj del sistema y el generador de identidades) y un servicio que escribe en la base de datos. En el caso de este último, nos gustaría poder saber que recibirá los datos correctamente.

Este es el test más interno, que resulta ser el del handler:

```php
final class SendProposalHandlerTest extends TestCase
{
    /** @test */
    public function should_store_valid_proposal(): void
    {
        $storeProposal = $this->buildStoreProposal();

        $proposalId = '01HXE2R5JBCRKAA3K0BZ1TCXT2';
        $identityProvider = $this->buildIdentityProvider($proposalId);

        $now = new DateTimeImmutable();
        $clock = $this->buildClock($now);

        $proposalBuilder = new ProposalBuilder(
            $identityProvider,
            $clock
        );

        $handler = new SendProposalHandler(
            $storeProposal,
            $proposalBuilder
        );

        $proposalTitle = 'Proposal Title';
        $command = SendProposalExample::wellFormedWithTitle($proposalTitle);

        $response = ($handler)($command);

        self::assertTrue($response->success);

        assertEquals($proposalTitle, $response->title);
        assertEquals($proposalId, $response->id);
    }

    private function buildStoreProposal(): MockObject|StoreProposal
    {
        $storeProposal = $this->createMock(StoreProposal::class);
        $storeProposal->expects(self::once())->method('__invoke');
        return $storeProposal;
    }

    private function buildIdentityProvider(string $proposalId
    ): MockObject|IdentityProvider {
        $identityProvider = $this->createMock(IdentityProvider::class);
        $identityProvider->method('next')->willReturn($proposalId);
        return $identityProvider;
    }

    private function buildClock(DateTimeImmutable $now): MockObject|Clock
    {
        $clock = $this->createMock(Clock::class);
        $clock->method('now')->willReturn($now);
        return $clock;
    }
}
```

Por supuesto, el problema tanto de `Clock` como `IdentityProvider` es que sus implementaciones de producción nos darán resultados no deterministas, lo que supone un problema dependiendo de lo que necesitemos probar. La mejor solución en este caso es poder decidir qué van a responder esos servicios cuando se les pida la hora del sistema o un identificador. Sobre todo si parte del test depende de alguno de esos datos.

Para esto, podemos crear un _stub programable_, algo que puede ser bastante sencillo. Tan solo necesitamos un objeto al que le pasemos el dato deseado en construcción y que lo devuelva cuando se le requiera. Aquí tenemos un par de ejemplos:

```php
readonly class ClockStub implements clock
{
    public function __construct(private DateTimeImmutable $now)
    {
    }

    public function now(): DateTimeImmutable
    {
        return $this->now;
    }
}
```

```php
readonly class IdentityProviderStub implements IdentityProvider
{
    public function __construct(private string $id)
    {
    }

    public function next(): string
    {
        return $this->id;
    }
}
```

Y aquí los tenemos en el test, al que hemos podido quitarle algunas líneas gracias a las nuevas clases:

```php
final class SendProposalHandlerTest extends TestCase
{
    /** @test */
    public function should_store_valid_proposal(): void
    {
        $storeProposal = $this->buildStoreProposal();

        $proposalId = '01HXE2R5JBCRKAA3K0BZ1TCXT2';
        $now = new DateTimeImmutable();
        
        $proposalBuilder = new ProposalBuilder(
            new IdentityProviderStub($proposalId),
            new ClockStub($now)
        );

        $handler = new SendProposalHandler(
            $storeProposal,
            $proposalBuilder
        );

        $proposalTitle = 'Proposal Title';
        $command = SendProposalExample::wellFormedWithTitle($proposalTitle);

        $response = ($handler)($command);

        self::assertTrue($response->success);

        assertEquals($proposalTitle, $response->title);
        assertEquals($proposalId, $response->id);
    }

    private function buildStoreProposal(): MockObject|StoreProposal
    {
        $storeProposal = $this->createMock(StoreProposal::class);
        $storeProposal->expects(self::once())->method('__invoke');
        return $storeProposal;
    }
}
```

Nos queda reemplazar el _mock_ de `StoreProposal` por un doble. Nuestra intención sería poder examinar el contenido que se guarda y que es un objeto `Proposal`. La verdad es que ahora mismo no hacemos esa verificación en el test actual, aunque se compensa porque el test _Gherkin_ sí que lo hace.

```php
class StoreProposalFake implements StoreProposal
{
    private Proposal $proposal;
    
    public function __invoke(Proposal $proposal): void
    {
        $this->proposal = $proposal;
    }

    public function proposal(): Proposal
    {
        return $this->proposal;
    }
}
```

```php
final class SendProposalHandlerTest extends TestCase
{
    /** @test */
    public function should_store_valid_proposal(): void
    {
        $storeProposal = new StoreProposalFake();

        $proposalId = '01HXE2R5JBCRKAA3K0BZ1TCXT2';
        $now = new DateTimeImmutable();

        $proposalBuilder = new ProposalBuilder(
            new IdentityProviderStub($proposalId),
            new ClockStub($now)
        );

        $handler = new SendProposalHandler(
            $storeProposal,
            $proposalBuilder
        );

        $proposalTitle = 'Proposal Title';
        $command = SendProposalExample::wellFormedWithTitle($proposalTitle);

        $response = ($handler)($command);

        self::assertTrue($response->success);

        assertEquals($proposalTitle, $response->title);
        assertEquals($proposalId, $response->id);
    }
}
```

En todo caso, esta implementación nos proporciona la posibilidad de _espiar_ el objeto guardado y, gracias a eso, obtener un test de mayor solidez. Pero en este caso, mi recomendación es separar los diversos puntos de interés del test, para lo cual me gusta extraer la parte común y reorganizar las comprobaciones.

En su versión actual, el test prueba que la respuesta del handler es correcta. Nosotras queremos añadir una verificación de que el objeto que se envía para guardar está bien construido.

Esto podemos hacerlo encapsulando las aserciones necesarias en métodos del test. De paso, hemos empezado a mover algunos datos a constantes para que sea más fácil reutilizarlos.

```php
final class SendProposalHandlerTest extends TestCase
{
    private const string PROPOSAL_ID = '01HXE2R5JBCRKAA3K0BZ1TCXT2';
    private const string NOW = '2024-05-16 12:34:56';
    private const string PROPOSAL_TITLE = 'Proposal Title';

    /** @test */
    public function should_store_valid_proposal(): void
    {
        $storeProposal = new StoreProposalFake();

        $proposalBuilder = new ProposalBuilder(
            new IdentityProviderStub(self::PROPOSAL_ID),
            new ClockStub(new DateTimeImmutable(self::NOW))
        );

        $handler = new SendProposalHandler(
            $storeProposal,
            $proposalBuilder
        );

        $command = SendProposalExample::wellFormedWithTitle(self::PROPOSAL_TITLE);

        $response = ($handler)($command);

        $this->assertSendProposalResponse($response);
    }

    private function assertSendProposalResponse(SendProposalResponse $response): void 
    {
        self::assertTrue($response->success);
        assertEquals(self::PROPOSAL_TITLE, $response->title);
        assertEquals(self::PROPOSAL_ID, $response->id);
    }
}
```

Para ganar claridad, nos merece la pena separar la parte de preparación en el `SetUp` y aquí tenemos el test entero. Vuelvo a destacar que el cuerpo principal del test queda muy sencillo y expresa tanto la forma de usar los objetos como lo que se intenta probar.

```php
final class SendProposalHandlerTest extends TestCase
{
    private const string PROPOSAL_ID = '01HXE2R5JBCRKAA3K0BZ1TCXT2';
    private const string NOW = '2024-05-16 12:34:56';
    private const string PROPOSAL_TITLE = 'Proposal Title';
    private StoreProposalFake $storeProposal;
    private SendProposalHandler $handler;

    protected function setUp(): void
    {
        $this->storeProposal = new StoreProposalFake();
        $proposalBuilder = new ProposalBuilder(
            new IdentityProviderStub(self::PROPOSAL_ID),
            new ClockStub(new DateTimeImmutable(self::NOW))
        );
        $this->handler = new SendProposalHandler(
            $this->storeProposal,
            $proposalBuilder
        );
    }

    /** @test */
    public function should_store_valid_proposal(): void
    {
        $command = SendProposalExample::wellFormedWithTitle(self::PROPOSAL_TITLE);
        $response = ($this->handler)($command);

        $this->assertSendProposalResponse($response);
        $this->assertCorrectProposalStored();
    }

    private function assertSendProposalResponse(SendProposalResponse $response
    ): void {
        self::assertTrue($response->success);
        assertEquals(self::PROPOSAL_TITLE, $response->title);
        assertEquals(self::PROPOSAL_ID, $response->id);
    }

    private function assertCorrectProposalStored(): void
    {
        $proposal = $this->storeProposal->proposal();
        assertEquals(self::PROPOSAL_TITLE, $proposal->getTitle());
        assertEquals(self::PROPOSAL_ID, $proposal->getId());
        assertEquals(new DateTimeImmutable(self::NOW), $proposal->getReceivedAt());
    }
}
```

## El último test

Nos queda el test del controlador de esta _feature_, que nos planteará problemas similares a los que ya hemos visto con anterioridad. El controlador usa el Handler como colaborador y no tenemos interfaz para implementar una nueva versión. Como vimos en el caso anterior, preferiríamos montar un nuevo Handler y doblar sus dependencias, ya que todas ellas representan un límite de la aplicación.

En este caso, además, podemos reutilizar los dobles que hemos creado anteriormente. Esta es una de las razones por las que hago este recorrido de refactor de dentro hacia afuera. Como ya hemos explicado estos dobles, no voy a extenderme mucho aquí.

Este es el test en su estado antes de aplicar el refactor:

```php
final class SendProposalControllerTest extends TestCase
{
    /** @test */
    public function should_accept_well_formed_proposal(): void
    {
        $payload = PayloadExample::wellFormedWithTitle('Proposal Title');

        $request = Request::create(
            '/api/proposals',
            'POST',
            [],
            [],
            [],
            ['CONTENT-TYPE' => 'json/application'],
            json_encode($payload)
        );
        $handler = $this->createMock(SendProposalHandler::class);

        $command = new SendProposal(
            'Proposal Title',
            'A description or abstract of the proposal',
            'Fran Iglesias',
            'fran.iglesias@example.com',
            'talk',
            true,
            'Vigo, Galicia',
        );

        $expected = new SendProposalResponse(
            true,
            'proposal-id',
            'Proposal Title'
        );

        $handler
            ->method('__invoke')
            ->with($command)
            ->willReturn($expected);

        $controller = new SendProposalController($handler);
        $response = ($controller)($request);

        assertEquals(202, $response->getStatusCode());
        assertEquals('https://localhost/api/proposals/proposal-id', $response->headers->get("Location"));

        $content = json_decode($response->getContent(), true);
        assertStringContainsString(
            'Your proposal titled "Proposal Title" was registered.',
            $content['message']
        );
    }
}
```

Y este es después de reemplazar el mock del Handler. Como podemos ver hemos podido quitar muchos detalles, y además ahora el test verifica el comportamiento del ciclo completo de la _request_.

```php
final class SendProposalControllerTest extends TestCase
{
    private const string PROPOSAL_TITLE = 'Proposal Title';
    private const string PROPOSAL_ID = 'proposal-id';
    private const string NOW = '2024-05-16 12:34:56';

    private SendProposalController $controller;

    protected function setUp(): void
    {
        $identityProvider = new IdentityProviderStub(self::PROPOSAL_ID);
        $clock = new ClockStub(new \DateTimeImmutable(self::NOW));

        $proposalBuilder = new ProposalBuilder($identityProvider, $clock);
        $storeProposal = new StoreProposalFake();

        $handler = new SendProposalHandler($storeProposal, $proposalBuilder);
        $this->controller = new SendProposalController($handler);
    }


    /** @test */
    public function should_accept_well_formed_proposal(): void
    {
        $request = Request::create(
            '/api/proposals',
            'POST',
            [],
            [],
            [],
            ['CONTENT-TYPE' => 'json/application'],
            json_encode(PayloadExample::wellFormedWithTitle(self::PROPOSAL_TITLE))
        );

        $response = ($this->controller)($request);

        assertEquals(202, $response->getStatusCode());
        assertEquals('https://localhost/api/proposals/proposal-id',
            $response->headers->get("Location"));

        $content = json_decode($response->getContent(), true);
        assertStringContainsString(
            'Your proposal titled "Proposal Title" was registered.',
            $content['message']
        );
    }
}
```

## Conclusiones

En este artículo hemos visto varias técnicas para crear dobles de test que puedan reemplazar a los _mocks_. El resultado ha tenido varios efectos:

* Los tests son menos sensibles a cambios en la implementación del código de producción.
* En general, los test han ganado en claridad al evitarnos muchos detalles preparatorios.
* En algunos casos, hemos podido mejorar la calidad del test y aumentar la confianza.

Aunque los mocks han resultado ser muy útiles para tomar decisiones acerca del diseño y las interfaces, nos damos cuenta de que una vez desarrollado el código de producción los test donde los hemos usado no nos aportan  mucho. Sin embargo, un refactor para usar en su lugar dobles creados por nosotras mismas, nos ha proporcionado varios beneficios.

Para lograrlo, hemos usado varias técnicas y tipos de dobles.
