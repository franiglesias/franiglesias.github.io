---
layout: post
title: Dar estructura a la aplicación
subtitle: Trabajar con legacy y entender el dominio (3)
categories: articles
tags: design-principles good-practices refactoring
---

Seguimos estirando la kata QuoteBot. Ya que estamos, vamos a intentar llevar esta aplicación a un nuevo nivel.

Se puede argumentar que hemos aumentado la complejidad de la solución. Esto es relativamente cierto, ha aumentado la cantidad de archivos, pero a cambio hemos introducido muchos puntos de articulación. Recuerda: al principio este software no se podía siquiera ejecutar y ahora puede ejecutarse de forma adecuada para cada entorno. Antes no era testeable y ahora sí. El beneficio de la complejidad añadida es enorme. Además, el código, en muchos aspectos ha mejorado su expresividad, aunque todavía nos falta desarrollar esta parte.

La expresividad del código, es decir, la capacidad de que puedas hacerte una idea de lo que ocurre simplemente leyéndolo y sin tener que ejecutar mentalmente cada una de las operaciones, es uno de los valores que hace que una aplicación pueda evolucionar en el futuro. Si el código expresa las ideas del negocio podemos `dialogar` con él y hacerlo cambiar a la vez que cambia nuestro modelo mental del negocio y del producto que estamos desarrollando.

Esta inversión que hacemos en conseguir una arquitectura limpia, estructurada conforme a principios estándar, aplicando patrones comunes y orientada a la expresividad y la flexibilidad del código nos permite avanzar fácilmente en el desarrollo e integración de nuevas features y en la mejora de las existentes. También facilita el *on boarding* de nuevas desarrolladoras que encuentran un **lenguaje técnico reconocible** y un **lenguaje de negocio comprensible**.

Así que en esta tercera entrega intentaremos desarrollar esta idea en el código. Aún tenemos trabajo por delante, pero las  cosas están mucho mejor que al principio.

## Introduciendo AdSpace y Blog

Nos queda aún trabajo. Tenemos un concepto que no hemos reflejado, como es el de `Blog` o `AdSpace`. De hecho, tenemos que introducir un filtro en el `AdSpaceProvider` para poder usar solo los espacios que cumplen algunas condiciones. 

Para empezar, tenemos un punto interesante en la discusión de si el concepto que nos interesa es `Blog` o `AdSpace`. Podemos razonar que `Blog` es un tipo de los posibles `AdSpaces` que podríamos tener que gestionar. Por otro lado, si nuestro mercado actual son solo blogs tecnolígicos puede parecer innecesario hacer esta separación. Sin embargo, si lo piensas, el coste futuro de remodelar la aplicación para pasar de `Blog` a `AdSpaces`, es decir de un concepto más concreto a uno más general, puede ser mucho más alto que establecer ahora esa categoría general, desarrollando la versión específica para `Blogs` y creando nuevas especializaciones en el futuro si es necesario.

Mi preferencia es esta última opción. Introducir el concepto general y desarrollar la especialización `Blog` para resolver la tarea inmediata. El coste es mínimo y deja el código en disposición de introducir otros tipos de espacios en el futuro.

Por desgracia, tenemos un poco de lío de naming con la clase `AdSpace`, ya que en realidad designa a una especie de repositorio en lugar de la entidad que es lo que querríamos. Aunque técnicamente podríamos aprovecharnos de los name spaces para evitar el conflicto de nombres, es preferible resolver esta ambigüedad. Sin embargo, si nos fijamos en el código, podemos ver que ya lo tenemos embebido. En este caso `AdSpace` lo que hace es una especie de cache de la implementación real que proporciona la lista de blogs.

```php
<?php


namespace Quotebot\Infrastructure\AdSpaceProvider;


use Quotebot\Domain\AdSpaceProvider;

class BlogAdSpaceProvider implements AdSpaceProvider
{

    public function getSpaces()
    {
        return AdSpace::getAdSpaces();
    }
}
```

La cache es una cuestión técnica así que tendría sentido destacar este punto cambiando el nombre de `AdSpace` y reorganizando un poco el código. Por otra parte, `AdSpace` incluye la dependencia de `TechBlogs`, así que bajo la protección que nos brinda tenerlo todo envuelto en `BlogAdSpaceProvider` vamos a hacer un cambio, que nos permitirá separar ambas cosas y tener más flexibilidad en el futuro.

Fundamentalmente lo que vamos a hacer es cambiar el modo en que se usa la cache, tal como lo define este test:

```php
<?php

namespace Tests\Quotebot;

use PHPUnit\Framework\TestCase;
use Quotebot\Infrastructure\AdSpaceProvider\AdSpacesCache;

class AdSpacesCacheTest extends TestCase
{

    public function testShouldBeEmpty(): void
    {
        $result = AdSpacesCache::getAdSpaces('blogs');

        self::assertEmpty($result);
    }

    public function testShouldCache(): void
    {
        $elements = [
            'Element 1',
            'Element 2'
        ];

        AdSpacesCache::cache('blogs', $elements);

        $stored = AdSpacesCache::getAdSpaces('blogs');

        self::assertEquals($elements, $stored);
    }
}
```

Esto nos permite cambiar 'BlogAdSpaceProvider':

```php
<?php


namespace Quotebot\Infrastructure\AdSpaceProvider;


use Quotebot\Domain\AdSpace\Blog;
use Quotebot\Domain\AdSpaceProvider;

class BlogAdSpaceProvider implements AdSpaceProvider
{

    public function getSpaces()
    {
        return $this->retrieveSpaces();
    }

    private function retrieveSpaces()
    {
        $blogs = AdSpacesCache::getAdSpaces('blogs');

        if ($blogs) {
            return $blogs;
        }

        $rawData = TechBlogs::listAllBlogs();

        $blogs = array_map(static function ($space) {
            return new Blog($space);
        }, $rawData);

        AdSpacesCache::cache('blogs', $blogs);
        
        return $blogs;
    }
}
```

De este modo, la Cache no está acoplada a una fuente de datos concreta, sino que nos sirve para cualquier fuente. Por otro lado, hemos introducido la clase `Blog`, que extiende de `AdSpace`, como entidades que representan los diferentes tipos de espacios para anuncios.

```php
<?php


namespace Quotebot\Domain\AdSpace;


abstract class AdSpace
{
    private $name;
    private $id;

    public function __construct(string $name)
    {
        $this->id = $name;
        $this->name = $name;
    }

    public function getName(): string
    {
        return $this->name;
    }

    public function getId(): string
    {
        return $this->id;
    }

}
```

```php
<?php


namespace Quotebot\Domain\AdSpace;


class Blog extends AdSpace
{

}
```

Nos toca revisar los usos de `Blog` a lo largo del código, cosa que hacemos con ayuda del IDE. Añadimos los *type hintings* y *return types* necesarios. Aquí es importante tener en cuenta que debemos hacer los *type hintings* con `AdSpace`, que es la abstracción. El cambio más significativo tiene que ver con los objetos que solo pueden usar la versión en texto del identificador del blog:

```php
<?php


namespace Quotebot\Infrastructure\MarketDataRetriever;


use Quotebot\Domain\AdSpace\AdSpace;
use Quotebot\Domain\MarketData\MarketDataRetriever;
use Quotebot\Domain\MarketData\Price;

class LocalMarketDataRetriever implements MarketDataRetriever
{

    public function averagePrice(AdSpace $blog): Price
    {
        $blogAvgPrices = [
            'TalkingBit' => 1000,
            'La semana PHP' => 1500,
        ];
        return new Price($blogAvgPrices[$blog->getId()]);
    }
}
```

```php
<?php


namespace Quotebot\Infrastructure\MarketDataRetriever;


use MarketStudyVendor;
use Quotebot\Domain\AdSpace\AdSpace;
use Quotebot\Domain\MarketData\MarketDataRetriever;
use Quotebot\Domain\MarketData\Price;

class VendorDataRetriever implements MarketDataRetriever
{
    /**
     * @var MarketStudyVendor
     */
    private $marketStudyVendor;

    public function __construct(MarketStudyVendor $marketStudyVendor)
    {
        $this->marketStudyVendor = $marketStudyVendor;
    }

    public function averagePrice(AdSpace $blog): Price
    {
        $averagePrice = $this->marketStudyVendor->averagePrice($blog->getName());

        return new Price($averagePrice);
    }
}
```

## Expresando intenciones

También nos podría interesar replantear el modo en que se expresan las acciones que realizan `AutomaticQuoteBot` y `BlogAuctionTask`. 

Ambas clases se utilizan para realizar la intención. Por lo general, representamos estas intenciones usando el patrón `Command`. 

El patrón `Command` nos permite modelar acciones como objetos. En la capa de dominio es habitual que los objetos representen conceptos que pueden tener comportamiento. Son actores. Pero una intención es una acción y, cuando hablamos de casos de uso, son acciones que no podemos atribuir a objetos concretos, sino que coordinan un conjunto de ellos para satisfacer la demanda de la usuaria.

Es bastante evidente que `BlogAuctionTask` o `AutomaticQuoteBot` no expresan intenciones, sino que se trata más bien `actores` que ejecutan esas intenciones. Una primera opción es definir los nuevos comandos implementándolos con estos objetos, sin más cambios. Posteriormente podemos refactorizar moviendo su código al propio comando.

Por ejemplo. Actualmente la intención a la que da servicio la aplicación es obtener la lista de blogs y generar y enviar las correspondientes pujas. Esto se puede expresar mediante un comando llamando `GenerateAllQuotes`. 

La versión del patrón comando que vamos a usar es la `Command` + `CommandHandler`. `Command` es el mensaje y lleva los datos necesarios para que `CommandHandler` sea quien ejecute la intención. 

```php
<?php


namespace Quotebot\Application;


class GenerateAllQuotes
{

    /**
     * @var string
     */
    private $rawMode;

    public function __construct(string $rawMode)
    {
        $this->rawMode = $rawMode;
    }

    public function getRawMode(): string
    {
        return $this->rawMode;
    }
}
```

He aquí el Handler:

```php
<?php


namespace Quotebot\Application;


class GenerateAllQuotesCommandHandler
{
    /**
     * @var AutomaticQuoteBot
     */
    private $automaticQuoteBot;

    public function __construct(AutomaticQuoteBot $automaticQuoteBot)
    {
        $this->automaticQuoteBot = $automaticQuoteBot;
    }

    public function __invoke(GenerateAllQuotes $generateAllQuotes): void
    {
        $this->automaticQuoteBot->sendAllQuotes($generateAllQuotes->getRawMode());
    }

}
```


Ahora, introduciremos esto es la aplicación:

```php
<?php

namespace Quotebot\Infrastructure\EntryPoint;

use Dotenv\Dotenv;
use MarketStudyVendor;
use Quotebot\Application\AutomaticQuoteBot;
use Quotebot\Application\BlogAuctionTask;
use Quotebot\Application\GenerateAllQuotes;
use Quotebot\Application\GenerateAllQuotesCommandHandler;
use Quotebot\Domain\Proposal\CalculateProposal;
use Quotebot\Infrastructure\AdSpaceProvider\BlogAdSpaceProvider;
use Quotebot\Infrastructure\AdSpaceProvider\LocalAdSpaceProvider;
use Quotebot\Infrastructure\MarketDataRetriever\LocalMarketDataRetriever;
use Quotebot\Infrastructure\MarketDataRetriever\VendorDataRetriever;
use Quotebot\Infrastructure\ProposalPublisher\LocalQuoteProposalPublisher;
use Quotebot\Infrastructure\ProposalPublisher\QuoteProposalPublisher;
use Quotebot\Infrastructure\SystemTimeService;

class Application
{
    private static $bot;

    public static function inject($bot)
    {
        self::$bot = $bot;
    }

    /** main application method */
    public static function main(array $args = null)
    {
        $projectRoot = __DIR__ . '/../../..';
        if (file_exists($projectRoot. '/.env')) {
            $dotenv = Dotenv::createImmutable($projectRoot);
            $dotenv->load();
        }

        $environment = $_ENV['APP_ENV'] ?? 'PROD';

        if ($environment === 'LOCAL') {
            $proposalPublisher = new LocalQuoteProposalPublisher();
            $adSpaceProvider = new LocalAdSpaceProvider();
            $marketDataRetriever = new LocalMarketDataRetriever();
        } else {
            $proposalPublisher = new QuoteProposalPublisher();
            $adSpaceProvider = new BlogAdSpaceProvider();
            $marketDataRetriever = new VendorDataRetriever(new MarketStudyVendor());
        }

        $timeService = new SystemTimeService();

        $calculateProposal = new CalculateProposal($timeService);

        $blogAuctionTask = new BlogAuctionTask(
            $marketDataRetriever,
            $proposalPublisher,
            $calculateProposal
        );


        self::$bot = self::$bot ?? new AutomaticQuoteBot(
                $blogAuctionTask,
                $adSpaceProvider
            );

        $generateAllQuotes = new GenerateAllQuotes('FAST');
        $handler = new GenerateAllQuotesCommandHandler(self::$bot);

        ($handler)($generateAllQuotes);
    }
}
```

Esta solución es un poco sofisticada para lo que es esta aplicación, pero en cualquier proyecto medianamente grande puede suponer una gran diferencia, especialmente si utilizamos un `CommandBus`, ya que nos encontraremos que los `EntryPoints`, típicamente controladores o comandos de consola apenas cargan dependencias, ya que se delega en el `CommandBus` determinar quién se encarga de ejecutar cada comando.

Por otro lado, la expresividad del código aumenta muchísimo.

Este proceso que hemos seguido se basa en el principio Open/Close. En lugar de cambiar las clase, con el riesgo de alterar partes del software que pudiesen estar usándolo, lo que hacemos es no modificarla, extendiéndola mediante una composición.

Sin embargo, en el ejemplo solo utilizamos una vez esta clase, por lo que podríamos deshacernos de ella, para lo cual el siguiente paso sería mover el código de `AutomaticQuoteBot` a `GenerateAllQuotes`, reduciendo la cantidad de objetos. En este caso es bastante fácil, pero antes tenemos que cambiar el test `QuoteBotAppTest` pues las cosas no van a funcionar igual ahora.

```php
<?php

namespace Tests\Quotebot;

use PHPUnit\Framework\TestCase;
use Quotebot\Application\BlogAuctionTask;
use Quotebot\Application\GenerateAllQuotesCommandHandler;
use Quotebot\Domain\AdSpace\Blog;
use Quotebot\Domain\AdSpaceProvider;
use Quotebot\Domain\MarketData\MarketDataRetriever;
use Quotebot\Domain\MarketData\Price;
use Quotebot\Domain\Proposal\CalculateProposal;
use Quotebot\Domain\Proposal\TimeService;
use Quotebot\Domain\ProposalPublisher;
use Quotebot\Infrastructure\EntryPoint\Application;

class QuoteBotAppTest extends TestCase
{
    public function testShouldRun(): void
    {
        $marketStudyVendor = $this->createMock(MarketDataRetriever::class);
        $marketStudyVendor->method('averagePrice')->willReturn(new Price(0));

        $proposalPublisher = $this->createMock(ProposalPublisher::class);
        $calculateProposal = new CalculateProposal($this->createMock(TimeService::class));

        $blogAuctionTask = new BlogAuctionTask(
            $marketStudyVendor,
            $proposalPublisher,
            $calculateProposal
        );

        $adSpaceProvider = $this->createMock(AdSpaceProvider::class);
        $adSpaceProvider
            ->method('getSpaces')
            ->willReturn([
                new Blog('Blog1'),
                new Blog('Blog2')
            ]);

        $commandHandler = new GenerateAllQuotesCommandHandler(
            $blogAuctionTask,
            $adSpaceProvider
        );

        Application::inject($commandHandler);
        Application::main();

        self::assertTrue(true);
    }

}
```

```php
<?php


namespace Quotebot\Application;


use Quotebot\Domain\AdSpaceProvider;
use Quotebot\Domain\Proposal\Mode;

class GenerateAllQuotesCommandHandler
{
    /**
     * @var BlogAuctionTask
     */
    private $blogAuctionTask;
    /**
     * @var AdSpaceProvider
     */
    private $adSpaceProvider;

    public function __construct(BlogAuctionTask $blogAuctionTask,
                                AdSpaceProvider $adSpaceProvider)
    {

        $this->blogAuctionTask = $blogAuctionTask;
        $this->adSpaceProvider = $adSpaceProvider;
    }

    public function __invoke(GenerateAllQuotes $generateAllQuotes): void
    {
        $mode = new Mode($generateAllQuotes->getRawMode());
        $blogs = $this->adSpaceProvider->getSpaces();
        foreach ($blogs as $blog) {
            $this->blogAuctionTask->priceAndPublish($blog, $mode);
        }
    }
}
```

Así queda Application, por ejemplo:

```php
<?php

namespace Quotebot\Infrastructure\EntryPoint;

use Dotenv\Dotenv;
use MarketStudyVendor;
use Quotebot\Application\AutomaticQuoteBot;
use Quotebot\Application\BlogAuctionTask;
use Quotebot\Application\GenerateAllQuotes;
use Quotebot\Application\GenerateAllQuotesCommandHandler;
use Quotebot\Domain\Proposal\CalculateProposal;
use Quotebot\Infrastructure\AdSpaceProvider\BlogAdSpaceProvider;
use Quotebot\Infrastructure\AdSpaceProvider\LocalAdSpaceProvider;
use Quotebot\Infrastructure\MarketDataRetriever\LocalMarketDataRetriever;
use Quotebot\Infrastructure\MarketDataRetriever\VendorDataRetriever;
use Quotebot\Infrastructure\ProposalPublisher\LocalQuoteProposalPublisher;
use Quotebot\Infrastructure\ProposalPublisher\QuoteProposalPublisher;
use Quotebot\Infrastructure\SystemTimeService;

class Application
{
    private static $handler;

    public static function inject(GenerateAllQuotesCommandHandler $handler)
    {
        self::$handler = $handler;
    }

    /** main application method */
    public static function main(array $args = null)
    {
        $projectRoot = __DIR__ . '/../../..';
        if (file_exists($projectRoot. '/.env')) {
            $dotenv = Dotenv::createImmutable($projectRoot);
            $dotenv->load();
        }

        $environment = $_ENV['APP_ENV'] ?? 'PROD';

        if ($environment === 'LOCAL') {
            $proposalPublisher = new LocalQuoteProposalPublisher();
            $adSpaceProvider = new LocalAdSpaceProvider();
            $marketDataRetriever = new LocalMarketDataRetriever();
        } else {
            $proposalPublisher = new QuoteProposalPublisher();
            $adSpaceProvider = new BlogAdSpaceProvider();
            $marketDataRetriever = new VendorDataRetriever(new MarketStudyVendor());
        }

        $timeService = new SystemTimeService();

        $calculateProposal = new CalculateProposal($timeService);

        $blogAuctionTask = new BlogAuctionTask(
            $marketDataRetriever,
            $proposalPublisher,
            $calculateProposal
        );


        self::$handler = self::$handler ?? new GenerateAllQuotesCommandHandler(
                $blogAuctionTask,
                $adSpaceProvider
            );

        $generateAllQuotes = new GenerateAllQuotes('FAST');

        (self::$handler)($generateAllQuotes);
    }
}
```

A continuación, nos quedaría hacer algo parecido con `BlogAuctionTask`. El problema es que esta clase ejecuta dos intenciones: generar las propuestas y enviarlas. Es posible que nos convenga separar esto. Lo propio sería tener por una parte la generación de la propuesta y por otro lado el envío. La generación de la propuesta sería `GenerateProposal` y se trata básicamente un servicio de dominio, mientras que el envío tiene más sentido en la capa de aplicación.

Inicialmente, voy a extraer la parte de generación a un método público de `BlogAuctionTask`:

```php
<?php

namespace Quotebot\Application;

use Quotebot\Domain\AdSpace\AdSpace;
use Quotebot\Domain\MarketData\MarketDataRetriever;
use Quotebot\Domain\Proposal\CalculateProposal;
use Quotebot\Domain\Proposal\Mode;
use Quotebot\Domain\ProposalPublisher;

class BlogAuctionTask
{
    /** @var MarketDataRetriever */
    protected $marketDataRetriever;
    /** @var ProposalPublisher|null */
    private $proposalPublisher;
    /** @var CalculateProposal */
    private $calculateProposal;

    public function __construct(
        MarketDataRetriever $marketDataRetriever,
        ProposalPublisher $proposalPublisher,
        CalculateProposal $calculateProposal
    )
    {
        $this->marketDataRetriever = $marketDataRetriever;
        $this->proposalPublisher = $proposalPublisher;
        $this->calculateProposal = $calculateProposal;
    }

    public function priceAndPublish(AdSpace $blog, Mode $mode): void
    {
        $proposal = $this->generateProposal($blog, $mode);

        $this->publishProposal($proposal);
    }

    protected function publishProposal($proposal): void
    {
        $this->proposalPublisher->publish($proposal);
    }

    public function generateProposal(AdSpace $blog, Mode $mode): \Quotebot\Domain\Proposal\Proposal
    {
        $averagePrice = $this->marketDataRetriever->averagePrice($blog);

        return $this->calculateProposal->fromPrice(
            $averagePrice,
            $mode
        );
    }
}
```

Y ahora voy a hacer público el método `pusblishProposal`:

```php
<?php

namespace Quotebot\Application;

use Quotebot\Domain\AdSpace\AdSpace;
use Quotebot\Domain\MarketData\MarketDataRetriever;
use Quotebot\Domain\Proposal\CalculateProposal;
use Quotebot\Domain\Proposal\Mode;
use Quotebot\Domain\ProposalPublisher;

class BlogAuctionTask
{
    /** @var MarketDataRetriever */
    protected $marketDataRetriever;
    /** @var ProposalPublisher|null */
    private $proposalPublisher;
    /** @var CalculateProposal */
    private $calculateProposal;

    public function __construct(
        MarketDataRetriever $marketDataRetriever,
        ProposalPublisher $proposalPublisher,
        CalculateProposal $calculateProposal
    )
    {
        $this->marketDataRetriever = $marketDataRetriever;
        $this->proposalPublisher = $proposalPublisher;
        $this->calculateProposal = $calculateProposal;
    }

    public function priceAndPublish(AdSpace $blog, Mode $mode): void
    {
        $proposal = $this->generateProposal($blog, $mode);

        $this->publishProposal($proposal);
    }

    public function publishProposal($proposal): void
    {
        $this->proposalPublisher->publish($proposal);
    }

    public function generateProposal(AdSpace $blog, Mode $mode): \Quotebot\Domain\Proposal\Proposal
    {
        $averagePrice = $this->marketDataRetriever->averagePrice($blog);

        return $this->calculateProposal->fromPrice(
            $averagePrice,
            $mode
        );
    }
}
```


Este cambio no rompe nada, ahora simplemente utilizaré los nuevos métodos en `GenerateAllQuotes`:

```php
<?php


namespace Quotebot\Application;


use Quotebot\Domain\AdSpaceProvider;
use Quotebot\Domain\Proposal\Mode;

class GenerateAllQuotesCommandHandler
{
    /**
     * @var BlogAuctionTask
     */
    private $blogAuctionTask;
    /**
     * @var AdSpaceProvider
     */
    private $adSpaceProvider;

    public function __construct(BlogAuctionTask $blogAuctionTask,
                                AdSpaceProvider $adSpaceProvider)
    {

        $this->blogAuctionTask = $blogAuctionTask;
        $this->adSpaceProvider = $adSpaceProvider;
    }

    public function __invoke(GenerateAllQuotes $generateAllQuotes): void
    {
        $mode = new Mode($generateAllQuotes->getRawMode());
        $blogs = $this->adSpaceProvider->getSpaces();
        foreach ($blogs as $blog) {
            $proposal = $this->blogAuctionTask->generateProposal($blog, $mode);
            $this->blogAuctionTask->publishProposal($proposal);
        }
    }
}
```

Esto nos abre el camino para separar las acciones en dos servicios. De hecho, nos ha separado las dependencias de BlogAuctionTask, lo que nos permite trasladar una de ellas a `GenerateAllQuotesCommandHandler`:

```php
<?php


namespace Quotebot\Application;


use Quotebot\Domain\AdSpaceProvider;
use Quotebot\Domain\Proposal\Mode;
use Quotebot\Domain\ProposalPublisher;

class GenerateAllQuotesCommandHandler
{
    /**
     * @var BlogAuctionTask
     */
    private $blogAuctionTask;
    /**
     * @var AdSpaceProvider
     */
    private $adSpaceProvider;
    /**
     * @var ProposalPublisher
     */
    private $proposalPublisher;

    public function __construct(BlogAuctionTask $blogAuctionTask,
                                AdSpaceProvider $adSpaceProvider,
                                ProposalPublisher $proposalPublisher
)
    {

        $this->blogAuctionTask = $blogAuctionTask;
        $this->adSpaceProvider = $adSpaceProvider;
        $this->proposalPublisher = $proposalPublisher;
    }

    public function __invoke(GenerateAllQuotes $generateAllQuotes): void
    {
        $mode = new Mode($generateAllQuotes->getRawMode());
        $blogs = $this->adSpaceProvider->getSpaces();
        foreach ($blogs as $blog) {
            $proposal = $this->blogAuctionTask->generateProposal($blog, $mode);
            $this->proposalPublisher->publish($proposal);
        }
    }
}
```

Este cambio nos obliga a modificar el test `QuoteBotAppTest` y `Application` para cambiar el modo en que se construye el CommandHandler, pero es cuestión de añadir una dependencia. Salvo eso, el cambio es bastante indoloro y podemos mezclarlo.

Una vez que comprobamos que el cambio funciona podemos eliminar código innecesario en `BlogAuctionTask`, pero antes debemos cambiar el test ya que no es el mismo comportamiento.

```php
<?php

namespace Quotebot;

use Generator;
use PHPUnit\Framework\TestCase;
use Quotebot\Application\BlogAuctionTask;
use Quotebot\Domain\AdSpace\Blog;
use Quotebot\Domain\MarketData\MarketDataRetriever;
use Quotebot\Domain\MarketData\Price;
use Quotebot\Domain\Proposal\CalculateProposal;
use Quotebot\Domain\Proposal\Mode;
use Quotebot\Domain\Proposal\Proposal;
use Quotebot\Domain\Proposal\TimeService;

class BlogAuctionTaskTest extends TestCase
{

    private $marketDataRetriever;
    private $timeService;
    private $blogAuctionTask;

    protected function setUp(): void
    {
        $this->marketDataRetriever = $this->createMock(MarketDataRetriever::class);
        $this->timeService = $this->createMock(TimeService::class);

        $this->blogAuctionTask = new BlogAuctionTask(
            $this->marketDataRetriever,
            new CalculateProposal($this->timeService)
        );
    }

    /** @dataProvider casesProvider */
    public function testShouldSendAProposal($averagePrice, Mode $mode, Proposal $proposal): void
    {
        $this->givenTimeIntervalIs(1);
        $this->givenAnAveragePrice($averagePrice);
        $this->thenAProposalIsCalculatedOf($mode, $proposal);
    }

    public function casesProvider(): Generator
    {
        yield 'Odd path basic calculation' => [new Price(0), new Mode('SLOW'), new Proposal(6.28)];
        yield 'Even path basic calculation' => [new Price(1), new Mode('SLOW'), new Proposal(6.30)];
    }

    protected function givenAnAveragePrice($averagePrice): void
    {
        $this->marketDataRetriever
            ->method('averagePrice')
            ->willReturn($averagePrice);
    }

    protected function thenAProposalIsCalculatedOf($mode, $proposal): void
    {
        $generated = $this->blogAuctionTask->generateProposal(new Blog('blog'), $mode);

        self::assertEquals($proposal, $generated);
    }

    private function givenTimeIntervalIs($interval): void
    {
        $this->timeService->method('timeInterval')->willReturn($interval);
    }
}
```

Así queda `BlogAuctionTask`.

```php
<?php

namespace Quotebot\Application;

use Quotebot\Domain\AdSpace\AdSpace;
use Quotebot\Domain\MarketData\MarketDataRetriever;
use Quotebot\Domain\Proposal\CalculateProposal;
use Quotebot\Domain\Proposal\Mode;
use Quotebot\Domain\ProposalPublisher;

class BlogAuctionTask
{
    /** @var MarketDataRetriever */
    protected $marketDataRetriever;
    /** @var CalculateProposal */
    private $calculateProposal;

    public function __construct(
        MarketDataRetriever $marketDataRetriever, CalculateProposal $calculateProposal
    )
    {
        $this->marketDataRetriever = $marketDataRetriever;
        $this->calculateProposal = $calculateProposal;
    }

    public function generateProposal(AdSpace $blog, Mode $mode): \Quotebot\Domain\Proposal\Proposal
    {
        $averagePrice = $this->marketDataRetriever->averagePrice($blog);

        return $this->calculateProposal->fromPrice(
            $averagePrice,
            $mode
        );
    }
}
```

En este punto, tendría sentido cambiar el nombre a `GenerateProposal::forAdSpace` y moverlo a la capa de dominio:

```php
<?php


namespace Quotebot\Domain\Proposal;


use Quotebot\Domain\MarketData\Price;

class CalculateProposal
{
    /**
     * @var TimeService
     */
    private $timeService;

    public function __construct(TimeService $timeService)
    {
        $this->timeService = $timeService;
    }

    public function fromPrice(Price $averagePrice, Mode $mode): Proposal
    {
        $proposal = $averagePrice->getPrice() + 2;

        $proposal = $proposal % 2 === 0
            ? $this->calculateEvenProposal($proposal)
            : $this->calculateOddProposal($mode);

        return new Proposal($proposal);
    }

    private function calculateEvenProposal(int $proposal): float
    {
        return 3.14 * $proposal;
    }

    private function calculateOddProposal(Mode $mode)
    {
        $timeInterval = $this->timeService->timeInterval();
        return 3.15
            * $mode->timeFactor()
            * $timeInterval;
    }
}
```

## Recapitulando

Esta es la estructura de la aplicación después de todo el trabajo que hemos llevado a cabo hasta ahora:

```
src
├── Application
│   ├── GenerateAllQuotes.php
│   └── GenerateAllQuotesCommandHandler.php
├── Domain
│   ├── AdSpace
│   │   ├── AdSpace.php
│   │   └── Blog.php
│   ├── AdSpaceProvider.php
│   ├── MarketData
│   │   ├── MarketDataRetriever.php
│   │   └── Price.php
│   ├── Proposal
│   │   ├── CalculateProposal.php
│   │   ├── GenerateProposal.php
│   │   ├── Mode.php
│   │   ├── Proposal.php
│   │   └── TimeService.php
│   └── ProposalPublisher.php
└── Infrastructure
    ├── AdSpaceProvider
    │   ├── AdSpacesCache.php
    │   ├── BlogAdSpaceProvider.php
    │   ├── LocalAdSpaceProvider.php
    │   └── TechBlogs.php
    ├── EntryPoint
    │   └── Application.php
    ├── MarketDataRetriever
    │   ├── LocalMarketDataRetriever.php
    │   └── VendorDataRetriever.php
    ├── ProposalPublisher
    │   ├── LocalQuoteProposalPublisher.php
    │   └── QuoteProposalPublisher.php
    └── SystemTimeService.php
```

El árbol se ha ramificado y ha crecido bastante. Hay una mayor complejidad, pero a la vez, una mayor estructura. Ciertamente, podríamos afinar más algunos nombres y colocar mejor algún concepto. Pero esto es algo que tiene que hacerse de manera continua. Esa estructura es válida en tanto que represente el conocimiento que tenemos de nuestro negocio y nuestro sistema. Y como las necesidades del negocio van cambiando, la estructura de código, y el código mismo, tienen que ir cambiando también.

## Tareas pendientes

Es bastante evidente que esto es un ejercicio y que esta elaboración para el problema inmediato que plantea la kata es un claro caso de sobreingeniería. Pero en un proyecto real, es un enfoque y un tipo de planteamiento que merece la pena considerar.

Por ejemplo, ahora es más fácil intervenir en el código para realizar mejoras o añadir features.

De hecho, tenemos pendiente una: la posibilidad de obtener solo los `Blogs` cuyo nombre comience por la letra `T` (el @todo que teníamos en el código ha desaparecido en algún momento del proceso).

La interfaz en la que nos vamos a detener es la de `AdSpaceProvider`, implementada por `BlogAdSpaceProvider`. Lo primero es que vamos a preparar un poco el terreno. Queremos obtener una lista que cumpla ciertas condiciones, pues parece bastante claro que no nos conviene incrustar en código la condición concreta que nos están pidiendo.

El problema es cómo expresar esas condiciones. Se me ocurren varias opciones:

* Ceñirnos al problema inmediato e introducir un método `findStartingWith` al que le indiquemos la inicial. Es un buen punto de partida y puede ser la mejor opción para obtener un resultado rápidamente.
* Una versión un poco más flexible sería considerar este `AdSpaceProvider` como una especie de colección, con un método `findBy`, al que le pasemos un closure para seleccionar los objetos deseados.
* Lo mismo, pero usando un objeto `Specification`, que se pasa a un método `findSatisfying`.

La principal desventaja del primer método es su inflexibilidad. Si el tipo de criterio cambia en el futuro, tendremos que reemplazar el método por otro. Por el contrario, en los otros dos métodos, un criterio nuevo es básicamente añadirlo y usarlo, siendo más expresivo el de `Specification`.

En cualquier caso, necesitamos una forma de evaluar los `AdSpace`, así que añadiremos algún método para ello. Por ejemplo:

```
<?php

namespace Quotebot\Domain\AdSpace;

use PHPUnit\Framework\TestCase;

class AdSpaceTest extends TestCase
{

    public function testStartsWith(): void
    {
        $space = new class('Example') extends AdSpace {
        } ;

        self::assertTrue($space->startsWith('E') );
        self::assertFalse($space->startsWith('T'));
    }
}
```

```php
<?php


namespace Quotebot\Domain\AdSpace;


abstract class AdSpace
{
    protected $name;
    protected $id;

    public function __construct(string $name)
    {
        $this->id = $name;
        $this->name = $name;
    }

    public function getName(): string
    {
        return $this->name;
    }

    public function getId(): string
    {
        return $this->id;
    }

    public function startsWith(string $start): bool
    {
        return strpos($this->name, $start, 0) === 0;
    }
}
```

De momento, vamos a usar el segundo método, pasando un closure:

```php
<?php


namespace Quotebot\Infrastructure\AdSpaceProvider;


use Quotebot\Domain\AdSpace\Blog;
use Quotebot\Domain\AdSpaceProvider;

class BlogAdSpaceProvider implements AdSpaceProvider
{

    public function getSpaces(): array
    {
        return $this->retrieveSpaces();
    }

    private function retrieveSpaces(): array
    {
        $blogs = AdSpacesCache::getAdSpaces('blogs');

        if ($blogs) {
            return $blogs;
        }

        $rawData = TechBlogs::listAllBlogs();

        $blogs = array_map(static function ($space) {
            return new Blog($space);
        }, $rawData);

        AdSpacesCache::cache('blogs', $blogs);
        
        return $blogs;
    }

    public function findSpaces(callable $specification): array
    {
        $spaces = $this->getSpaces();

        return array_filter($spaces, $specification);
    }
}
```

Y aquí un ejemplo de uso:

```php
<?php


namespace Quotebot\Application;


use Quotebot\Domain\AdSpace\AdSpace;
use Quotebot\Domain\AdSpaceProvider;
use Quotebot\Domain\Proposal\GenerateProposal;
use Quotebot\Domain\Proposal\Mode;
use Quotebot\Domain\ProposalPublisher;

class GenerateAllQuotesCommandHandler
{
    /**
     * @var GenerateProposal
     */
    private $blogAuctionTask;
    /**
     * @var AdSpaceProvider
     */
    private $adSpaceProvider;
    /**
     * @var ProposalPublisher
     */
    private $proposalPublisher;

    public function __construct(GenerateProposal $blogAuctionTask,
                                AdSpaceProvider $adSpaceProvider,
                                ProposalPublisher $proposalPublisher
    )
    {
        $this->blogAuctionTask = $blogAuctionTask;
        $this->adSpaceProvider = $adSpaceProvider;
        $this->proposalPublisher = $proposalPublisher;
    }

    public function __invoke(GenerateAllQuotes $generateAllQuotes): void
    {
        $startingWithT = static function (AdSpace $space) {
            return $space->startsWith('T');
        };

        $mode = new Mode($generateAllQuotes->getRawMode());
        $blogs = $this->adSpaceProvider->findSpaces($startingWithT);
        foreach ($blogs as $blog) {
            $proposal = $this->blogAuctionTask->forAdSpace($blog, $mode);
            $this->proposalPublisher->publish($proposal);
        }
    }
}
```

En realidad, podemos llevarlo a un lugar mejor, pasando el closure a través del comando `GenerateAllQuotes`:

```php
<?php


namespace Quotebot\Application;


use Quotebot\Domain\AdSpace\AdSpace;
use Quotebot\Domain\AdSpaceProvider;
use Quotebot\Domain\Proposal\GenerateProposal;
use Quotebot\Domain\Proposal\Mode;
use Quotebot\Domain\ProposalPublisher;

class GenerateAllQuotesCommandHandler
{
    /**
     * @var GenerateProposal
     */
    private $blogAuctionTask;
    /**
     * @var AdSpaceProvider
     */
    private $adSpaceProvider;
    /**
     * @var ProposalPublisher
     */
    private $proposalPublisher;

    public function __construct(GenerateProposal $blogAuctionTask,
                                AdSpaceProvider $adSpaceProvider,
                                ProposalPublisher $proposalPublisher
    )
    {
        $this->blogAuctionTask = $blogAuctionTask;
        $this->adSpaceProvider = $adSpaceProvider;
        $this->proposalPublisher = $proposalPublisher;
    }

    public function __invoke(GenerateAllQuotes $generateAllQuotes): void
    {
        $mode = new Mode($generateAllQuotes->getRawMode());
        $blogs = $this->adSpaceProvider->findSpaces($generateAllQuotes->getSpecification());
        foreach ($blogs as $blog) {
            $proposal = $this->blogAuctionTask->forAdSpace($blog, $mode);
            $this->proposalPublisher->publish($proposal);
        }
    }
}
```

Por ejemplo, en `Application`, lo que nos proporciona aún mayor flexibilidad:

```php
<?php

namespace Quotebot\Infrastructure\EntryPoint;

use Dotenv\Dotenv;
use MarketStudyVendor;
use Quotebot\Application\GenerateAllQuotes;
use Quotebot\Application\GenerateAllQuotesCommandHandler;
use Quotebot\Domain\AdSpace\AdSpace;
use Quotebot\Domain\Proposal\CalculateProposal;
use Quotebot\Domain\Proposal\GenerateProposal;
use Quotebot\Infrastructure\AdSpaceProvider\BlogAdSpaceProvider;
use Quotebot\Infrastructure\AdSpaceProvider\LocalAdSpaceProvider;
use Quotebot\Infrastructure\MarketDataRetriever\LocalMarketDataRetriever;
use Quotebot\Infrastructure\MarketDataRetriever\VendorDataRetriever;
use Quotebot\Infrastructure\ProposalPublisher\LocalQuoteProposalPublisher;
use Quotebot\Infrastructure\ProposalPublisher\QuoteProposalPublisher;
use Quotebot\Infrastructure\SystemTimeService;

class Application
{
    private static $handler;

    public static function inject(GenerateAllQuotesCommandHandler $handler)
    {
        self::$handler = $handler;
    }

    /** main application method */
    public static function main(array $args = null)
    {
        $projectRoot = __DIR__ . '/../../..';
        if (file_exists($projectRoot. '/.env')) {
            $dotenv = Dotenv::createImmutable($projectRoot);
            $dotenv->load();
        }

        $environment = $_ENV['APP_ENV'] ?? 'PROD';

        if ($environment === 'LOCAL') {
            $proposalPublisher = new LocalQuoteProposalPublisher();
            $adSpaceProvider = new LocalAdSpaceProvider();
            $marketDataRetriever = new LocalMarketDataRetriever();
        } else {
            $proposalPublisher = new QuoteProposalPublisher();
            $adSpaceProvider = new BlogAdSpaceProvider();
            $marketDataRetriever = new VendorDataRetriever(new MarketStudyVendor());
        }

        $timeService = new SystemTimeService();

        $calculateProposal = new CalculateProposal($timeService);

        $blogAuctionTask = new GenerateProposal(
            $marketDataRetriever, $calculateProposal
        );
        
        self::$handler = self::$handler ?? new GenerateAllQuotesCommandHandler(
                $blogAuctionTask,
                $adSpaceProvider,
                $proposalPublisher
            );

        $startingWithT = static function (AdSpace $space) {
            return $space->startsWith('T');
        };

        $generateAllQuotes = new GenerateAllQuotes(
            'FAST',
            $startingWithT
        );

        (self::$handler)($generateAllQuotes);
    }
}
```

Por ejemplo, podríamos parametrizar el callable, de modo que sea posible obtener la letra criterio en una variable de entorno, controlando que si no se define ninguna se haga puja por todos los espacios.

Esta es una primera aproximación a esta idea, todo dentro de `Application`:

```php
        $criteria = $_ENV['SPACES_SELECTION'];

        if (!$criteria) {
            $specification = static function (AdSpace $space) {
                return true;
            };
        } else {
            $specification = static function (AdSpace $space) use ($criteria) {
                return $space->startsWith($criteria);
            };
        }

        $generateAllQuotes = new GenerateAllQuotes(
            'FAST',
            $specification
        );

        (self::$handler)($generateAllQuotes);
```

El archivo `.env` para seleccionar todos los blogs:

```
APP_ENV=PROD
SPACES_SELECTION=
```

El archivo `.env` para filtrar por los que empiezan por la letra `T`:

```
APP_ENV=PROD
SPACES_SELECTION=T
```

Con esto podemos controlar el comportamiento de la aplicación mediante cambios en la configuración, no en el código, en aplicación del principio open/close.

## ¿Fin?

Puede que sí y puede que no. Podría seguir trabajando en esta kata explorando mejoras y refinamientos. A medida que el código se va organizando mejor porque se sincroniza con nuestro conocimiento del problema, nos va brindando nuevas oportunidades de intervención. En muchas ocasiones nos permite descubrir oportunidades de refactor. Otras veces, nos facilita identificar áreas de mejora incluso antes que negocio nos las pida. Y, por último, nos pone en mejores condiciones para responder antes y mejor a los cambios en el negocio.

Me gustaría señalar también que nos han bastado unos pocos tests para mantener bajo control todos estos cambios. Si se tratase de un proyecto real, podríamos haber ido desplegando grupos de cambios en producción sin temor a problemas ni a romper funcionalidad. Este riesgo nunca es cero, pero si los cambios son pequeños y acotados lo normal es poder revertirlos con facilidad o arreglarlos rápidamente. Para que te hagas una idea, la rama en la que he estado desarrollando esta versión tiene 42 commits, siete de los cuales son antiguos y pertenecen a la preparación de la propia kata. Lo importante, en cualquier caso, sería crear un test cuando descubramos un conjunto de cambios que rompe algo, de forma que el test nos garantice que el problema está solucionado.

¿Posibles vías de continuación del ejercicio? 

Una de ellas es introducir un contenedor de inyección de dependencias, gestionando también la construcción de objetos para test, que es ahora mismo el punto que menos me satisface.

Podríamos pasar el dato de `Mode` por configuración, ya que ahora está `hardcoded` en el código de `Application`. Como hemos visto con el criterio de selección es bastante sencillo.

Otra vía es realizar pequeños refactors aquí y allá que puedan mejorar la expresividad, reducir un poco de código, poner algunos conceptos en un lugar más adecuado, etc.

También resultaría interesante eliminar el uso de arrays en `AdSpaceProvider` y retornar colecciones en su lugar. En otros lenguajes esto es nativo, pero no en PHP.

Estos y otros ejercicios pueden sernos útiles para aplicar luego en proyectos reales. Como hemos visto, no siempre es necesario, ni conveniente, tratar de empezar de cero un nuevo proyecto para reemplazar un código desfasado. A veces es mejor ir cambiándolo usando estas estrategias que te permitirán un downtime mínimo y no tener que lidiar con migraciones de datos o usuarios.

{% include_relative parts/legacy-under-control.md %}
