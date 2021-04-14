---
layout: post
title: Sleep (Blogtober2019)
categories: articles
tags: blogtober19
---

Mi compañera y manager en Holaluz [Mavi Jiménez](https://twitter.com/Linkita) va a hacer un dibujo cada día del mes sobre una palabra propuesta en twitter. Y aquí vamos a intentar escribir [un post por cada una de ellas](https://franiglesias.github.io/blogtober19-status/).

<blockquote class="twitter-tweet" data-conversation="none" data-theme="dark"><p lang="en" dir="ltr">20. Sleep <a href="https://twitter.com/SailensMC?ref_src=twsrc%5Etfw">@SailensMC</a> <a href="https://twitter.com/hashtag/Inktober?src=hash&amp;ref_src=twsrc%5Etfw">#Inktober</a> <a href="https://twitter.com/hashtag/linkitober?src=hash&amp;ref_src=twsrc%5Etfw">#linkitober</a> <a href="https://t.co/mucczxXUtu">pic.twitter.com/mucczxXUtu</a></p>&mdash; Mavis 🎃 (@Linkita) <a href="https://twitter.com/Linkita/status/1186410087826501633?ref_src=twsrc%5Etfw">October 21, 2019</a></blockquote> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>

## Sleep

El otro día surgió un _temilla_ en el trabajo relacionado con la función `sleep` y cómo testear un método que la utilice. El problema, como se puede suponer fácilmente, tiene que ver con que el test tardará en ejecutarse debido a este retraso.

Las razones para introducir un `sleep` en el código pueden ser varias, como por ejemplo, dar tiempo para que otro proceso se ejecute y evitar fallos debido a que no haya podido terminar porque necesitamos los datos que genera.

En cualquier caso, todo lo que tiene que ver con el paso del tiempo supone un problema al programar. El tiempo es un estado global y, como ya se ha repetido muchas veces, tenemos que evitar los estados globales, ya que provocan acoplamientos.

¿Cómo atacar estos problemas, entonces? Se me ocurren un par de aproximaciones.

### Tass: Time as a Service

Este enfoque consiste en encapsular las funciones que tienen que ver con el tiempo en un servicio. En su forma más simple, nos bastaría on encapsular las funciones nativas en servicios y utilizar estos en su lugar. De este modo evitamos la dependencia global y podemos crear fácilmente stubs para testing.

He aquí un ejemplo muy sencillo que ilustra lo que quiero decir:

Primero una `interface`, para poder cambiar implementaciones según necesitemos

```php
<?php

declare(strict_types=1);

namespace Dojo\Tass;

use DateTimeImmutable;

interface ClockServiceInterface
{
    public function now(): DateTimeImmutable;

    public function thisTime(string $time): DateTimeImmutable;
}

```

Y luego un servicio sencillo:

```php
<?php

declare(strict_types=1);

namespace Dojo\Tass;

use DateTimeImmutable;

class NativeClock implements ClockServiceInterface
{
    public function now(): DateTimeImmutable
    {
        return new DateTimeImmutable();
    }

    public function thisTime(string $time): DateTimeImmutable
    {
        return new DateTimeImmutable($time);
    }
}
```

El método `now()` nos entrega la fecha y hora del sistema, mientras que `thisTime(string $time)` devuelve la que le especifiquemos con un string válido de fecha y/u hora.

¿Cómo lo usaríamos? Cuando sea necesario, lo pasaríamos como colaborador a la clase que lo necesite.

```php
<?php

declare(strict_types=1);

namespace Dojo\Tass;

class CreateContractCommandHandler
{

    /** @var ContractRepository */
    private $contractRepository;
    /** @var ClockServiceInterface */
    private $clockService;

    public function __construct(
        ContractRepository $contractRepository,
        ClockServiceInterface $clockService
    ) {
        $this->contractRepository = $contractRepository;
        $this->clockService = $clockService;
    }

    public function execute(CreateContractCommand $command)
    {
        $contract = Contract::create(
            $this->contractRepository->nextId(),
            $this->clockService->now(),
            $command->customer(),
            $command->conditions()
        );
        
        $this->contractRepository->store($contract);
    }
}
```

Nope, no haremos una llamada estática porque eso sería volver a establecer la dependencia global y seríamos, de nuevo, incapaces de testear.

Ahora, para testear, solo necesitamos hacer una implementación que sea un stub de la fecha que nos interese:

```php
<?php

declare(strict_types=1);

namespace Dojo\Tass;

use DateTimeImmutable;
use PHPUnit\Framework\TestCase;

class CreateContractCommandHandlerTest extends TestCase
{

    public function testShouldCreateAContractForDate(): void
    {
        $contractId = ContractId::fromString('contract-id');
        $contractRepository = $this->createMock(ContractRepository::class);
        $contractRepository->method('nextId')->willReturn($contractId);
        $clockService = $this->stubClockService();

        $createContractCommandHandler = new CreateContractCommandHandler(
            $contractRepository, 
            $clockService
        );
        
        // ...
    }

    private function stubClockService()
    {
        $clockService = new class implements ClockServiceInterface
        {

            public function now(): DateTimeImmutable
            {
                return new DateTimeImmutable('2019-10-20');
            }

            public function thisTime(string $time): DateTimeImmutable
            {
                return new DateTimeImmutable($time);
            }
        };

        return $clockService;
    }
}
```

Esto también tiene algunas implicaciones. Por ejemplo, las entidades que necesiten fechas deberían obtenerlas de `ClockService` y no crearlas ellas mismas. Esto aumenta la testeabilidad en un factor de 1000 por lo menos. Lo puedes ver aquí:

```php
    $contract = Contract::create(
        $this->contractRepository->nextId(),
        $this->clockService->now(),
        $command->customer(),
        $command->conditions()
    );
```

Al construir el contrato le pasamos tanto el id como la hora de creación y no permitimos que sean autoasignados.

### Volviendo a `sleep`

Para resolver el problema de `sleep` se me ocurre un `TimerService`. He aquí un ejemplo muy sencillo:

```php
<?php

declare(strict_types=1);

namespace Dojo\Tass;

interface TimerServiceInterface
{
    public function sleep(int $seconds): void;
}
```

Implementación sencilla:

```php
<?php

declare(strict_types=1);

namespace Dojo\Tass;

class NativeTimer implements TimerServiceInterface
{
    public function sleep(int $seconds): void
    {
        sleep($seconds);
    }
}
```

Podemos hacer una implementación para tests que no haga ninguna pausa:

```php
<?php

declare(strict_types=1);

namespace Dojo\Tass;

class TimerServiceForTest
{
    public function sleep(int $seconds): void
    {
        return;
    }
}
```

De este modo, el test no tendrá demora independientemente de la que necesites fijar para el código de producción.

### Alternativas a dormir

Cuando tenemos procesos que se ejecutan, por así decir, en paralelo y uno tiene que esperar el resultado de otro hacer una pausa puede ser un problema. No solo en el aspecto de testing, sino que tal vez el contexto lo haga desaconsejable.

¿Qué significa esperar? En unos casos, puede ser literalmente esperar un poco para que la segunda acción tenga tiempo de terminar porque sabemos que es más lenta, pero podemos tener una cierta seguridad de que terminará dentro de ese tiempo.

#### Poll

En otros casos, esperar significa que no podemos seguir un proceso si el otro no ha entregado su resultado. Y entonces, en lugar de esperar, podemos preguntar si ya ha terminado para poder seguir. Cuando tengamos una respuesta definitiva, continuamos.

El siguiente enfoque sencillo que se me ocurre es comprobar un cierto número de veces que el segundo proceso ha terminado. Esto podría incluir también un tiempo de `sleep` entre las comprobaciones, para lo cual aplicaríamos las consideraciones del apartado anterior.

Supongamos que tenemos que esperar por la generación de un archivo a fin de poder enviarlo por email a un cliente.

En este fragmento puedes ver una posible solución al problema, usando reintentos y una pausa entre ellos.

```php
<?php

declare(strict_types=1);

namespace Dojo\Tass;

use function file_exists;

class SendDocumentCommandHandler
{
    public function execute(SendDocumentCommand $command): void
    {
        for ($retry = 1; $retry <= self::MAX_RETRIES; $retry++) {
            if (file_exists($command->document())) {
                $this->notifier->send($command->receiver, $command->document());
                return;
            }
            $this->timer->sleep(self::WAIT_BETWEEN_RETRIES);
        }
        throw new UnableToSendDocument();
    }
}
```

*Nota: Sí, usar `file_exists` también es una dependencia global.*


#### Observers y Publisher-subscribers

Hoy no me voy a meter en estos dos patrones porque requieren más investigación por mi parte dado que implican más elementos y sus diferencias son sutiles, pero sí me gustaría mencionarlos.

En los dos ejemplos anteriores, la responsabilidad de saber que puede seguir recae en el proceso dependiente el que pregunta al otro si ha acabado con lo suyo.

En los patrones Observer y Publisher-subscriber es el otro proceso el que anuncia cuándo ha terminado, haciendo que el proceso que depende de su resultado ejecute su parte cuando todo está listo.

En el patrón Observer, siguiendo el ejemplo anterior, el generador del documento notificaría al servicio de envío, así como a otros servicios interesados que se registran como Observers de su actividad.

En el patrón Publisher-Subscriber, se hace algo parecido, pero en este caso el observador y el observado no se relacionan directamente. El Publisher anuncia (evento) algo en un `EventBus` y este se encarga de comunicárselo a los observadores suscritos a ese evento concreto que harán lo que tengan que hacer.

Yendo aún más lejos, puede hacerse incluso mediante un intermediario llamado "orquestador" que lance los procesos participantes y gestione en qué orden pueden o deben realizar cada uno su trabajo, permitiendo actuar algunos en paralelo si no dependen entre sí mientras que espera por el resultado de otros para lanzarlos.

