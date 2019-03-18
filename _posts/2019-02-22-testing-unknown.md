---
layout: post
title: Testeando lo desconocido (1)
categories: articles
tags: testing
---

Recientemente he comenzado a trabajar en otro proyecto dentro de la empresa ayudando con el testing. Es una parte del negocio que conozco poco todavía y la aplicación con la que estoy trabajando es, por supuesto, distinta, aunque similar en planteamiento.

En esta ocasión voy a hablar sobre cómo estoy afrontando el testeo de un código que apenas conozco.

Como primer ejemplo, voy a tomar un caso bastante simple, pero que me permitirá ilustrar el enfoque con el que estoy atacando la tarea.

Se trata de un Middleware para MessageBus. No es un concepto de negocio, pero me viene muy bien porque sólo tiene un flujo de ejecución y, además, me permite poner en juego un par de técnicas interesantes.

Esta es la clase que vamos a testear:

```php
<?php

namespace Project\App\Application\Common;

use Exception;
use Project\App\Domain\Common\Event\DomainEvent;
use Psr\Log\LoggerInterface;
use SimpleBus\Message\Bus\Middleware\MessageBusMiddleware;

class EventLoggerMiddleware implements MessageBusMiddleware
{
    private const DATE_FORMAT = 'Y/m/d H:i:s';

    /** @var LoggerInterface */
    private $logger;

    /**
     * LoggerDomainEventSubscriber constructor.
     * @param LoggerInterface $logger
     */
    public function __construct(
        LoggerInterface $logger
    ) {
        $this->logger = $logger;
    }

    /**
     * @param          $message
     * @param callable $next
     * @return void
     * @throws Exception
     */
    public function handle($message, callable $next): void
    {
        $this->logEvent($message);
        $next($message);
    }

    /**
     * @param $event
     * @throws Exception
     */
    private function logEvent($event): void
    {
        $this->logger->info(
            'Event dispatched',
            [
                'event' => [
                    'name' => get_class($event),
                    'data' => json_encode($event),
                    'occurred_on' => ($event instanceof DomainEvent)
                        ? $event->occurredOn()->format(self::DATE_FORMAT)
                        : (new \DateTime())->format(self::DATE_FORMAT),
                    'string' => ($event instanceof DomainEvent) ? $event->__toString() : ''
                ]
            ]
        );
    }
}
```

Lo primero que hago es preparar el TestCase con los dobles de las dependencias y el propio *subject under test*. Lo defino todo en el `setUp` mirando cómo es el constructor de la clase que voy a testear.

```php
<?php
declare(strict_types=1);

namespace Project\App\Application\Common;

use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;
use Psr\Log\LoggerInterface;

class EventLoggerMiddlewareTest extends TestCase
{
    /** @var LoggerInterface | MockObject */
    private $logger;

    /** @var EventLoggerMiddleware */
    private $eventLoggerMiddleware;

    public function setUp()
    {
        $this->logger = $this->createMock(LoggerInterface::class);
        
        $this->eventLoggerMiddleware = new EventLoggerMiddleware($this->logger);
    }
}
```

Me aseguro de que las dependencias son exactamente las mismas comparando los `use` y verificando que se importan de los mismos namespaces.

El siguiente paso es escribir un test que verifique algún aspecto del flujo que nos interese.

La mayor parte de las veces prefiero empezar testeando *sad paths*, por ejemplo, cuando se pueden lanzar excepciones o se devuelve una respuesta vacía. Habitualmente es bastante sencillo montar estos tests y programar los stubs.

En este caso, no se da ninguna de esas circunstancias, así que tendremos que buscar por otro lado, analizando el flujo y decidiendo qué es lo que mejor describe el comportamiento de la clase.

Nosotros tenemos dos comportamientos importantes:

* Que, efectivamente, al recibir un evento se ejecuta el `logger`.
* Que se ejecuta el `Callable $next`, que sería el siguiente paso en el pipeline del `MessageBus` y se le pasa el evento recibido.

Ciertamente podemos determinar qué pasa leyendo el código, pero con el test lo vamos a certificar. Podría decirse que vamos a elaborar una hipótesis sobre lo que hace el código y el test nos va a servir para verificarla.

Lo primero que vamos a intentar demostrar es que el evento se añade al log. La forma concreta en que se anota no es lo que nos interesa ahora, simplemente nos basta con asegurarnos de que se hace.

```php
<?php
declare(strict_types=1);

namespace Project\App\Application\Common;

use DateTimeInterface;
use Project\App\Domain\Common\Event\DomainEvent;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;
use Psr\Log\LoggerInterface;

class EventLoggerMiddlewareTest extends TestCase
{
    /** @var LoggerInterface | MockObject */
    private $logger;

    /** @var EventLoggerMiddleware */
    private $eventLoggerMiddleware;

    public function setUp()
    {
        $this->logger = $this->createMock(LoggerInterface::class);

        $this->eventLoggerMiddleware = new EventLoggerMiddleware($this->logger);
    }

    public function testShouldLogTheEvent(): void
    {
        $event = $this->createDomainEvent();

        $this->logger->expects($this->once())->method('info');

        $this->eventLoggerMiddleware->handle($event, function() {});
    }

    private function createDomainEvent()
    {
        $event = new class() implements DomainEvent
        {

            public function occurredOn(): DateTimeInterface
            {
                return new \DateTimeImmutable();
            }

            public function __toString(): string
            {
                return 'Domain Event';
            }
        };

        return $event;
    }
}
```

La clave está en la línea:

```php
$this->logger->expects($this->once())->method('info');
```

Convertimos a `$this->logger` en un mock definiendo una expectativa de cómo queremos que sea usado. Estamos diciendo que esperamos que el método `info` sea llamado una sola vez. Esa es la aserción del test.

Es un test frágil porque si decidiésemos cambiar el nivel de logging, por ejemplo a `notice` o a `warning`, el test fallaría aunque la clase esté funcionando bien. La forma de evitar esto es cambiar el test primero para definir el nuevo comportamiento y modificar el código de producción después.

Por otro lado, los `mocks` se llevan la aserción fuera del test lo que no me gusta demasiado. Una alternativa sería crear un `Logger` específico para tests, al que le pudiésemos preguntar a posteriori qué mensajes ha registrado y, así, realizar las aserciones de la manera habitual en el test. 

Sin embargo, no siempre merece la pena hacer este esfuerzo extra y los dobles nos aportan otras ventajas. En cada caso hay que valorar qué nos viene mejor.

Por otro lado, como veremos en otro momento, los dobles nos permiten trabajar más fácilmente con clases desconocidas e ir descubriendo sus métodos o el tipo de datos que manejan a medida que los necesitamos. En este ejemplo no lo vamos a ver, pero intentaré mostrar más adelante casos en los que evitamos tener que montar objetos complejos para los tests gracias a los dobles.

### Dobles con clases anónimas

Para crear un DomainEvent de prueba utilizaré una clase anónima. 

PHP no permite implementar la interfaz `DateTimeInterface`, por lo que el generador de doubles de **phpunit** no puede hacer un double de nuestro `DomainEvent` pues éste devuelve un objeto DateTimeInterface en el método `occurredOn` y no puede doblarlo.

```php
<?php
namespace Project\App\Domain\Common\Event;

use DateTimeInterface;

interface DomainEvent
{
    public function occurredOn(): DateTimeInterface;
    public function __toString(): string;
}

```

En todo caso, el test pasa, demostrando que el MiddleWare realiza su función principal, que es anotar en el log que el evento ha sido recibido.

### Dobla `Callables` mediante `self-shunt`

El siguiente paso que necesito demostrar es que se ejecuta el `Callable $next`. Esto es necesario para garantizar que el evento sigue su camino en el MessageBus.

La cuestión es: ¿cómo verificar esto?

Lo que se me ha ocurrido es una especie de *self-shunt*. Es decir, crearé un método en el TestCase que pasaré al MiddleWare como Callable. Este método simplemente incrementará un contador de modo que pueda verificar que ha sido llamado al comprobar si tiene un valor mayor que cero.

El TestCase queda así:

```php
<?php
declare(strict_types=1);

namespace Project\App\Application\Common;

use DateTimeInterface;
use Project\App\Domain\Common\Event\DomainEvent;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;
use Psr\Log\LoggerInterface;

class EventLoggerMiddlewareTest extends TestCase
{
    /** @var LoggerInterface | MockObject */
    private $logger;

    /** @var EventLoggerMiddleware */
    private $eventLoggerMiddleware;
    /** @var int */
    private $calls;

    public function setUp()
    {
        $this->calls = 0;

        $this->logger = $this->createMock(LoggerInterface::class);

        $this->eventLoggerMiddleware = new EventLoggerMiddleware($this->logger);
    }

    public function testShouldLogTheEvent(): void
    {
        $event = $this->createDomainEvent();

        $this->logger->expects($this->once())->method('info');

        $this->eventLoggerMiddleware->handle($event, function() {});
    }

    public function testShouldExecuteNext(): void
    {
        $event = $this->createDomainEvent();

        $callable = [$this, 'registerCall'];

        $this->eventLoggerMiddleware->handle($event, $callable);

        $this->assertGreaterThan(0, $this->calls());
    }

    public function registerCall(): void
    {
        $this->calls++;
    }

    public function calls(): int
    {
        return $this->calls;
    }

    private function createDomainEvent()
    {
        $event = new class() implements DomainEvent
        {

            public function occurredOn(): DateTimeInterface
            {
                return new \DateTimeImmutable();
            }

            public function __toString(): string
            {
                return 'Domain Event';
            }
        };

        return $event;
    }
}
```

El test pasa, verificando que se ejecuta el Callable.

Sin embargo, nos queda por verificar que recibe el evento o mensaje, por lo que necesitamos añadir alguna forma de verificar que el mensaje es pasado. 

En principio, bastaría con que `registerCall` nos obligue a pasarle un parámetro, incluso aunque no lo use. Nuestro objetivo es verificar que se pasa, lo que haga el Callable no es un objetivo de este test.

Pero para estar más seguros, vamos a comprobar que es el mismo mensaje que se pasa al Middleware. También cambio el nombre del test para reflejarlo:

```php
<?php
declare(strict_types=1);

namespace Project\App\Application\Common;

use DateTimeInterface;
use Project\App\Domain\Common\Event\DomainEvent;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;
use Psr\Log\LoggerInterface;

class EventLoggerMiddlewareTest extends TestCase
{
    /** @var LoggerInterface | MockObject */
    private $logger;

    /** @var EventLoggerMiddleware */
    private $eventLoggerMiddleware;
    /** @var int */
    private $calls;
    /** @var DomainEvent */
    private $message;

    public function setUp()
    {
        $this->calls = 0;

        $this->logger = $this->createMock(LoggerInterface::class);

        $this->eventLoggerMiddleware = new EventLoggerMiddleware($this->logger);
    }

    public function testShouldLogTheEvent(): void
    {
        $event = $this->createDomainEvent();

        $this->logger->expects($this->once())->method('info');

        $this->eventLoggerMiddleware->handle($event, function() {});
    }

    public function testShouldExecuteNextWithTheMessage(): void
    {
        $event = $this->createDomainEvent();

        $callable = [$this, 'registerCall'];

        $this->eventLoggerMiddleware->handle($event, $callable);

        $this->assertGreaterThan(0, $this->calls());
        $this->assertEquals($event, $this->message);
    }

    public function registerCall($message): void
    {
        $this->calls++;
        $this->message = $message;
    }

    public function calls(): int
    {
        return $this->calls;
    }

    private function createDomainEvent()
    {
        $event = new class() implements DomainEvent
        {

            public function occurredOn(): DateTimeInterface
            {
                return new \DateTimeImmutable();
            }

            public function __toString(): string
            {
                return 'Domain Event';
            }
        };

        return $event;
    }
}
```

Y, con esto, el comportamiento de la clase ha sido caracterizado. De este modo, además de aumentar la cobertura de tests de la aplicación, he podido aprender cómo funciona esta clase.


