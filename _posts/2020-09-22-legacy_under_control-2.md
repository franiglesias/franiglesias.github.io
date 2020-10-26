---
layout: post
title: Trabajar con legacy y entender el dominio 2
categories: articles
tags: design-principles good-practices refactoring
---

En el artículo anterior el código ha quedado algo mejor estructurado de lo que estaba y, sobre todo, las dependencias están ahora bajo nuestro control. En esta ocasión querríamos avanzar un poco más en esa misma área de organización de código y, sobre todo, conseguir que la capa de domino sea capaz de contarnos la historia acerca de qué trata la aplicación.

Esta primera parte nos ha servido sobre todo para poner el código en un estado en que lo podemos testear sin riesgo de provocar efectos en producción. Nos quedaría poder ejecutarlo en local con esa misma seguridad. En este punto no nos quedaría más remedio que definir alguna forma de que la aplicación al construirse sepa en qué entorno está corriendo. Actualmente solemos hacerlo con un archivo `.env`.

## Construir la aplicación en función del entorno de ejecución

En mi caso instalaré el paquete `phpdotenv`. Este paquete nos leerá archivos `.env`, dándonos acceso a las variables de entorno en `$_ENV`, lo que debería ser suficiente para nuestro propósito.

```
docker exec -it quotebot composer require vlucas/phpdotenv
```

Una vez instalado, modificaremos el código de Application, pero antes, necesitamos una implementación alternativa de un `ProposalPublisher`. La hemos llamado `LocalQuoteProposalPublisher`. Simplemente nos informa de que ha recibido una propuesta.

```php
<?php


namespace Quotebot\Infrastructure;


use Quotebot\Domain\ProposalPublisher;

class LocalQuoteProposalPublisher implements ProposalPublisher
{

    public function __construct()
    {
    }

    public function publish(float $proposal): void
    {
        printf('Local execution. Proposal of %s created, but it wasn\'t sent.'.chr(10), $proposal);
    }
}
```

Application quedará así:

```php
<?php

namespace Quotebot;

use Dotenv\Dotenv;
use MarketStudyVendor;
use Quotebot\Infrastructure\BlogAdSpaceProvider;
use Quotebot\Infrastructure\LocalQuoteProposalPublisher;
use Quotebot\Infrastructure\QuoteProposalPublisher;
use Quotebot\Infrastructure\SystemTimeService;
use Quotebot\Infrastructure\VendorDataRetriever;

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
        $dotenv = Dotenv::createImmutable(__DIR__.DIRECTORY_SEPARATOR.'..');
        $dotenv->load();

        $environment = $_ENV['APP_ENV'];

        $marketDataRetriever = new VendorDataRetriever(new MarketStudyVendor());

        $timeService = new SystemTimeService();

        if ($environment === 'LOCAL') {
            $proposalPublisher = new LocalQuoteProposalPublisher();
        } else {
            $proposalPublisher = new QuoteProposalPublisher();
        }


        $blogAuctionTask = new BlogAuctionTask(
            $marketDataRetriever,
            $proposalPublisher,
            $timeService
        );

        $adSpaceProvider = new BlogAdSpaceProvider();

        self::$bot = self::$bot ?? new AutomaticQuoteBot(
                $blogAuctionTask,
                $adSpaceProvider
            );
        self::$bot->sendAllQuotes('FAST');
    }
}

```

Y podremos ejecutarla así:

```php
docker exec -it quotebot php run.php
```

Aparecerán varias lineas con propuestas, ya que se generan una para cada blog proporcionado `TechBlogs`. Para garantizar que funciona correctamente en producción sin archivo `.env`, haremos un pequeño cambio:

```php
<?php

namespace Quotebot;

use Dotenv\Dotenv;
use MarketStudyVendor;
use Quotebot\Infrastructure\BlogAdSpaceProvider;
use Quotebot\Infrastructure\LocalQuoteProposalPublisher;
use Quotebot\Infrastructure\QuoteProposalPublisher;
use Quotebot\Infrastructure\SystemTimeService;
use Quotebot\Infrastructure\VendorDataRetriever;

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
        if (file_exists(__DIR__ . DIRECTORY_SEPARATOR. '../.env')) {
            $dotenv = Dotenv::createImmutable(__DIR__.DIRECTORY_SEPARATOR.'..');
            $dotenv->load();
        }

        $environment = $_ENV['APP_ENV'] ?? 'PROD';

        if ($environment === 'LOCAL') {
            $proposalPublisher = new LocalQuoteProposalPublisher();
        } else {
            $proposalPublisher = new QuoteProposalPublisher();
        }

        $marketDataRetriever = new VendorDataRetriever(new MarketStudyVendor());
        $timeService = new SystemTimeService();

        $blogAuctionTask = new BlogAuctionTask(
            $marketDataRetriever,
            $proposalPublisher,
            $timeService
        );

        $adSpaceProvider = new BlogAdSpaceProvider();

        self::$bot = self::$bot ?? new AutomaticQuoteBot(
                $blogAuctionTask,
                $adSpaceProvider
            );
        self::$bot->sendAllQuotes('FAST');
    }
}
```

Y con esto podríamos deployar en producción, no sin antes añadir `.env` a la lista de `.gitignore`.

Con esta capacidad, lo lógico ahora es pensar que nos interesaría crear otras implementaciones locales para `MarketDataRetriever`, por ejemplo, o para `AdSpaceProvider`. Tiene mucho sentido, ya que nos ahorramos también unos cuantos problemas. Por ejemplo, es posible que cada uso de la licencia de `MarketStudyVendor` nos esté costando dinero, mientras que para ejecución local agradeceríamos una respuesta más rápida de `AdSpaceProvider`, incluso tener menos ejemplos de blogs sería ideal algo bueno para nuestras pruebas en entorno local.

Esto es posible gracias a que hemos invertido las dependencias. No tenemos más que escribir una nueva implementación para su uso en entorno local o de testing y aprovechar lo que acabamos de hacer para montar la aplicación.

Por ejemplo, esta podría ser una implementación local de `AdSpaceProvider`:

```php
<?php


namespace Quotebot\Infrastructure;


use Quotebot\Domain\AdSpaceProvider;

class LocalAdSpaceProvider implements AdSpaceProvider
{

    public function getSpaces()
    {
        return [
            'TalkingBit',
            'La semana PHP'
        ];
    }
}
```

Lo mismo para el `MarketDataRetriever`, en el que aprovechamos para tener cierta predictibilidad de los datos:

```php
<?php


namespace Quotebot\Infrastructure;


class LocalMarketDataRetriever implements \Quotebot\Domain\MarketDataRetriever
{

    public function averagePrice(string $blog): float
    {
        $blogAvgPrices = [
            'TalkingBit' => 1000,
            'La semana PHP' => 1500,
        ];
        return $blogAvgPrices[$blog];
    }
}
```

Y así quedaría nuestro `quotebot` gestionando los entornos de ejecución. No hemos cambiado timeservice ya que estamos conformes con que funcione igual en local que en producción, al menos por el momento.

```php
<?php

namespace Quotebot;

use Dotenv\Dotenv;
use MarketStudyVendor;
use Quotebot\Infrastructure\BlogAdSpaceProvider;
use Quotebot\Infrastructure\LocalAdSpaceProvider;
use Quotebot\Infrastructure\LocalMarketDataRetriever;
use Quotebot\Infrastructure\LocalQuoteProposalPublisher;
use Quotebot\Infrastructure\QuoteProposalPublisher;
use Quotebot\Infrastructure\SystemTimeService;
use Quotebot\Infrastructure\VendorDataRetriever;

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
        if (file_exists(__DIR__ . DIRECTORY_SEPARATOR. '../.env')) {
            $dotenv = Dotenv::createImmutable(__DIR__.DIRECTORY_SEPARATOR.'..');
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

        $blogAuctionTask = new BlogAuctionTask(
            $marketDataRetriever,
            $proposalPublisher,
            $timeService
        );


        self::$bot = self::$bot ?? new AutomaticQuoteBot(
                $blogAuctionTask,
                $adSpaceProvider
            );
        self::$bot->sendAllQuotes('FAST');
    }
}
```


## Organización de código

Hasta ahora, cuando hemos tenido que introducir alguna interfaz o alguna clase nueva hemos ido colocándolas en las capas de Dominio e Infraestructura. La separación en capas es la habitual en DDD o en las arquitecturas limpias. Lo importante no es sólo la existencia de las capas, sino la aplicación de la *regla de dependencia* de modo que todas las dependencias apunten hacia el dominio, de modo que:

* Las clases en `Domain` no tienen ninguna dependencia fuera de la capa.
* Las clases en `Application` (esta capa aún no existe) pueden tener dependencias en `Domain`.
* Las clases en `Infrastructure` pueden tener dependencias en `Domain`, `Application` y, en su caso, usar componentes en `lib` o `vendor`.

```
src
├── AdSpace.php
├── Application.php
├── AutomaticQuoteBot.php
├── BlogAuctionTask.php
├── Domain
│   ├── AdSpaceProvider.php
│   ├── MarketDataRetriever.php
│   ├── ProposalPublisher.php
│   └── TimeService.php
├── Infrastructure
│   ├── BlogAdSpaceProvider.php
│   ├── LocalAdSpaceProvider.php
│   ├── LocalMarketDataRetriever.php
│   ├── LocalQuoteProposalPublisher.php
│   ├── QuoteProposalPublisher.php
│   ├── SystemTimeService.php
│   └── VendorDataRetriever.php
└── TechBlogs.php
```

Tener el código bien organizado es independiente del tamaño o complejidad de la aplicación.

Todo proyecto de software se ocupa de un fragmente del conocimiento del mundo en el que viven una serie de conceptos que interactúan y se relacionan conforme a unas reglas específicas, todo lo cual constituye el dominio. Esta capa se organiza internamente en función de los conceptos y sus relaciones, sin que deban existir menciones técnicas.

Por otro lado, los usuarios de este software tienen unas intenciones y unas expectativas al usarlo, que se concretan en casos de uso, que se plasman en la capa de aplicación. La organización de esta capa debería estar dirigida justamente por esos casos de uso.

Finalmente, todo software requiere poner en juego un conjunto de tecnologías que hacen posible su funcionamiento y que conforman la infraestructura. La organización dentro de esta capa puede ser un poco más flexible, mezclando aspectos técnicos genéricos con una organización basada en los contextos del dominio.

Esta estructura de 3 capas puede constituir el esqueleto básico de cualquier proyecto de software moderno, facilitando la consecución de objetivos como la sostenibilidad, la capacidad de adaptación, etc.

Nuestro objetivo, en este artículo será llevar todo el código a esta estructura, poniendo especial atención en desarrollar y enriquecer la capa de dominio. Pero el primer paso será empezar a poner en su sitio las clases que aún están en la raíz.

### Cada cosa en su lugar

Empezare por `Application`. La clase Application actúa como una especie de Front Controller de nuestra aplicación. Su misión es básicamente recibir la orden de la línea de comandos para ejecutar el caso de uso. Su capa natural es `Infrastructure`, de hecho todas sus dependencias o están en `Infrastructure` o en `lib`. En los últimos tiempos suelo tener una carpeta dentro de esta capa llamada `EntryPoint` en la que irían los `Controllers` y, en su caso, los comandos de consola u otros puntos de entrada a la aplicación. Así que, en principio, esto es lo que voy a hacer.

Todos estos cambios son muy sencillos con un buen IDE. En mi caso estoy usando IntelliJ con los plugins para PHP. No hay más que usar el refactor `Move Class…` y el IDE se encarga de todo.

```
src
├── AdSpace.php
├── AutomaticQuoteBot.php
├── BlogAuctionTask.php
├── Domain
│   ├── AdSpaceProvider.php
│   ├── MarketDataRetriever.php
│   ├── ProposalPublisher.php
│   └── TimeService.php
├── Infrastructure
│   ├── BlogAdSpaceProvider.php
│   ├── EntryPoint
│   │   └── Application.php
│   ├── LocalAdSpaceProvider.php
│   ├── LocalMarketDataRetriever.php
│   ├── LocalQuoteProposalPublisher.php
│   ├── QuoteProposalPublisher.php
│   ├── SystemTimeService.php
│   └── VendorDataRetriever.php
└── TechBlogs.php
```

Al cambiar de ubicación, tenemos que hacer una corrección para que el archivo `.env` siga estando accesible:

```php
<?php

namespace Quotebot\Infrastructure\EntryPoint;

use Dotenv\Dotenv;
use MarketStudyVendor;
use Quotebot\Domain\AutomaticQuoteBot;
use Quotebot\Domain\BlogAuctionTask;
use Quotebot\Infrastructure\BlogAdSpaceProvider;
use Quotebot\Infrastructure\LocalAdSpaceProvider;
use Quotebot\Infrastructure\LocalMarketDataRetriever;
use Quotebot\Infrastructure\LocalQuoteProposalPublisher;
use Quotebot\Infrastructure\QuoteProposalPublisher;
use Quotebot\Infrastructure\SystemTimeService;
use Quotebot\Infrastructure\VendorDataRetriever;

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

        $blogAuctionTask = new BlogAuctionTask(
            $marketDataRetriever,
            $proposalPublisher,
            $timeService
        );


        self::$bot = self::$bot ?? new AutomaticQuoteBot(
                $blogAuctionTask,
                $adSpaceProvider
            );
        self::$bot->sendAllQuotes('FAST');
    }
}
```

Por ahora me llevaré a `Domain` tanto a `AutomaticQuoteBot` como a `BlogAuctionTask`. Esto no es una decisión definitiva, pero por el momento puedo ver que no tienen dependencias fuera de esa capa, por lo que pueden estar ahí. La duda consiste en que `AutomaticQuoteBot` ejecuta la intención de la usuaria de la aplicación, pero tal cual está no la expresa. Sin embargo, me gustaría tratar esa cuestión en una fase posterior.

```
src
├── AdSpace.php
├── Domain
│   ├── AdSpaceProvider.php
│   ├── AutomaticQuoteBot.php
│   ├── BlogAuctionTask.php
│   ├── MarketDataRetriever.php
│   ├── ProposalPublisher.php
│   └── TimeService.php
├── Infrastructure
│   ├── BlogAdSpaceProvider.php
│   ├── EntryPoint
│   │   └── Application.php
│   ├── LocalAdSpaceProvider.php
│   ├── LocalMarketDataRetriever.php
│   ├── LocalQuoteProposalPublisher.php
│   ├── QuoteProposalPublisher.php
│   ├── SystemTimeService.php
│   └── VendorDataRetriever.php
└── TechBlogs.php
```

Nos quedan `AdSpace` y `TechBlogs`, que dependen entre ellos y que, examinando su código, pensamos que podrían estar en `Infrastructure`. Y con esto terminaríamos la primera parte de esta reorganización:

```
src
├── Domain
│   ├── AdSpaceProvider.php
│   ├── AutomaticQuoteBot.php
│   ├── BlogAuctionTask.php
│   ├── MarketDataRetriever.php
│   ├── ProposalPublisher.php
│   └── TimeService.php
└── Infrastructure
    ├── AdSpace.php
    ├── BlogAdSpaceProvider.php
    ├── EntryPoint
    │   └── Application.php
    ├── LocalAdSpaceProvider.php
    ├── LocalMarketDataRetriever.php
    ├── LocalQuoteProposalPublisher.php
    ├── QuoteProposalPublisher.php
    ├── SystemTimeService.php
    ├── TechBlogs.php
    └── VendorDataRetriever.php
```

Pero esto sólo es el principio.

## El software representa el conocimiento

Nuestro cerebro organiza la información mediante una estructura de red multienlazada y jerárquica. Cuando se activa un concepto, otros muchos que están relacionados se activan o se inhiben. Si representamos eso gráficamente la forma más adecuada sería un diagrama en forma de árbol invertido, con el concepto más general en lo alto, ramificándose a medida que descendemos por los niveles de abstracción. Cuando más preciso y rico es nuestro conocimiento sobre un tema más ramificado, profundo y detallado estará el árbol.

Algo parecido ocurre en el código. Ahora mismo tenemos dos grandes ramas, pero poca profundidad, pues sólo cuenta con dos niveles. Nos está diciendo que nuestro conocimiento del dominio de la aplicación está poco desarrollado. Puede que la aplicación sea simple, pero también puede que no hayamos identificado y extraído conceptos que deberían estar presentes.

En todo caso, podemos observar que nos falta poblar una capa, la de aplicación, indicando que no hemos representado las intenciones de las usuarias. Además, vemos que hay demasiados elementos al mismo nivel en las capas de dominio e infraestructura, lo que nos sugiere que tal vez deberíamos estructurarlas mejor.

Para empezar, vamos a seguir moviendo clases para establecer esta estructura y después veremos como mover lógica para descubrir y extraer conceptos.

### Infrastructura

En infraestructura vamos a agrupar en función del servicio o concepto al que dan soporte. Por ejemplo, tenemos el concepto `AdSpaceProvider` en dominio, así que agruparemos todo lo relacionado con él:

```
src
├── Domain
│   ├── AdSpaceProvider.php
│   ├── AutomaticQuoteBot.php
│   ├── BlogAuctionTask.php
│   ├── MarketDataRetriever.php
│   ├── ProposalPublisher.php
│   └── TimeService.php
└── Infrastructure
    ├── AdSpaceProvider
    │   ├── AdSpace.php
    │   ├── BlogAdSpaceProvider.php
    │   ├── LocalAdSpaceProvider.php
    │   └── TechBlogs.php
    ├── EntryPoint
    │   └── Application.php
    ├── LocalMarketDataRetriever.php
    ├── LocalQuoteProposalPublisher.php
    ├── QuoteProposalPublisher.php
    ├── SystemTimeService.php
    └── VendorDataRetriever.php
```

Otro concepto es el de `MarketDataRetriever`. Agruparemos con este criterio:

```
src
├── Domain
│   ├── AdSpaceProvider.php
│   ├── AutomaticQuoteBot.php
│   ├── BlogAuctionTask.php
│   ├── MarketDataRetriever.php
│   ├── ProposalPublisher.php
│   └── TimeService.php
└── Infrastructure
    ├── AdSpaceProvider
    │   ├── AdSpace.php
    │   ├── BlogAdSpaceProvider.php
    │   ├── LocalAdSpaceProvider.php
    │   └── TechBlogs.php
    ├── EntryPoint
    │   └── Application.php
    ├── LocalQuoteProposalPublisher.php
    ├── MarketDataRetriever
    │   ├── LocalMarketDataRetriever.php
    │   └── VendorDataRetriever.php
    ├── QuoteProposalPublisher.php
    └── SystemTimeService.php
```

Y, finalmente `ProposalPublisher`:

```
src
├── Domain
│   ├── AdSpaceProvider.php
│   ├── AutomaticQuoteBot.php
│   ├── BlogAuctionTask.php
│   ├── MarketDataRetriever.php
│   ├── ProposalPublisher.php
│   └── TimeService.php
└── Infrastructure
    ├── AdSpaceProvider
    │   ├── AdSpace.php
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

Nos queda suelto `SystemTimeService`. Introducirlo en su propia rama no es especialmente necesario ya que es un único elemento y es bastante explícito, pero si quieres hacerlo por simetría tampoco pasa nada.

En cualquier caso, ahora la capa de infraestructura muestra una organización clara, en la que es bastante más fácil localizar un elemento concreto.

### Dominio

La capa de dominio está ahora mismo compuesta por interfaces y un par de clases. No ofrece muchas posibilidades de articulación a través de lo que podemos ver, por esa razón tendremos que profundizar en el código. El punto más interesante es `BlogAuctionTask` que, como hemos visto, contiene la mayor parte de la funcionalidad de la aplicación.

```php
<?php

namespace Quotebot\Domain;

class BlogAuctionTask
{
    /** @var MarketDataRetriever */
    protected $marketDataRetriever;
    /** @var ProposalPublisher|null */
    private $proposalPublisher;
    /** @var TimeService */
    private $timeService;

    public function __construct(
        MarketDataRetriever $marketDataRetriever,
        ProposalPublisher $proposalPublisher,
        TimeService $timeService
    )
    {
        $this->marketDataRetriever = $marketDataRetriever;
        $this->proposalPublisher = $proposalPublisher;
        $this->timeService = $timeService;
    }

    public function priceAndPublish(string $blog, string $mode)
    {
        $averagePrice = $this->marketDataRetriever->averagePrice($blog);

        $proposal = $averagePrice + 2;

        $timeFactor = $this->timeFactor($mode);

        $proposal = $proposal % 2 === 0
            ? $this->calculateEvenProposal($proposal)
            : $this->calculateOddProposal($timeFactor);

        $this->publishProposal($proposal);
    }

    protected function publishProposal($proposal): void
    {
        $this->proposalPublisher->publish($proposal);
    }

    private function timeFactor(string $mode): int
    {
        $timeFactor = 1;

        if ($mode === 'SLOW') {
            $timeFactor = 2;
        }

        if ($mode === 'MEDIUM') {
            $timeFactor = 4;
        }

        if ($mode === 'FAST') {
            $timeFactor = 8;
        }

        if ($mode === 'ULTRAFAST') {
            $timeFactor = 13;
        }
        return $timeFactor;
    }

    private function calculateEvenProposal(int $proposal): float
    {
        return 3.14 * $proposal;
    }

    private function calculateOddProposal(int $timeFactor)
    {
        $timeInterval = $this->timeService->timeInterval();
        return 3.15
            * $timeFactor
            * $timeInterval;
    }
}

```

Podemos ver que:

* Se manejan varios conceptos representados con escalares: Blog, Price, Proposal, Mode, Time Factor... Estos conceptos podrían modelarse con Value Objects.
* TimeFactor y Mode están estrechamente relacionados y, de hecho, se podría decir que son dos representaciones de la misma idea. 

En este caso, empezaré extrayendo el concepto `Mode`, que nos dará también el valor de TimeFactor. En realidad, ya lo tenemos todo bastante aislado por lo que será muy fácil. Esto es como queda `BlogAuctionTask`.

```php
<?php

namespace Quotebot\Domain;

class BlogAuctionTask
{
    /** @var MarketDataRetriever */
    protected $marketDataRetriever;
    /** @var ProposalPublisher|null */
    private $proposalPublisher;
    /** @var TimeService */
    private $timeService;

    public function __construct(
        MarketDataRetriever $marketDataRetriever,
        ProposalPublisher $proposalPublisher,
        TimeService $timeService
    )
    {
        $this->marketDataRetriever = $marketDataRetriever;
        $this->proposalPublisher = $proposalPublisher;
        $this->timeService = $timeService;
    }

    public function priceAndPublish(string $blog, string $rawMode)
    {
        $mode = new Mode($rawMode);

        $averagePrice = $this->marketDataRetriever->averagePrice($blog);

        $proposal = $averagePrice + 2;

        $proposal = $proposal % 2 === 0
            ? $this->calculateEvenProposal($proposal)
            : $this->calculateOddProposal($mode);

        $this->publishProposal($proposal);
    }

    protected function publishProposal($proposal): void
    {
        $this->proposalPublisher->publish($proposal);
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

Y hemos extraído el Value Object Mode:

```php
<?php


namespace Quotebot\Domain;


class Mode
{
    private $mode;

    public function __construct(string $mode)
    {
        $this->mode = $mode;
    }

    public function timeFactor(): int
    {
        $timeFactor = 1;

        if ($this->mode === 'SLOW') {
            $timeFactor = 2;
        }

        if ($this->mode === 'MEDIUM') {
            $timeFactor = 4;
        }

        if ($this->mode === 'FAST') {
            $timeFactor = 8;
        }

        if ($this->mode === 'ULTRAFAST') {
            $timeFactor = 13;
        }
        return $timeFactor;
    }
}
```

El cual vamos a refactorizar para tener una versión más compacta y elegante, que además aporta una validación, garantizándonos que siempre tendremos un timefactor correcto:

```php
<?php


namespace Quotebot\Domain;


use InvalidArgumentException;

class Mode
{
    private const SLOW = 'SLOW';
    private const MEDIUM = 'MEDIUM';
    private const FAST = 'FAST';
    private const ULTRAFAST = 'ULTRAFAST';

    private const MAP = [
        self::SLOW => 2,
        self::MEDIUM => 4,
        self::FAST => 8,
        self::ULTRAFAST => 13
    ];

    private $mode;

    public function __construct(string $mode)
    {
        $mode = strtoupper($mode);

        $validModes = array_keys(self::MAP);

        if (!in_array($mode, $validModes, true)) {
            throw new InvalidArgumentException('Invalid mode');
        }

        $this->mode = $mode;
    }

    public function timeFactor(): int
    {
        return self::MAP[$this->mode];
    }
}
```

Una cuestión interesante es que `Mode` viene definido desde nuestro Entry Point, la clase `Application`. Si bien ese es un punto demasiado exterior, `AutomaticQuoteBot` podría encargarse de convertir el escalar a un objeto de dominio. De este modo, `BlogAuctionTask` trabajará ya con un objeto de dominio, validado y cuyo significado y comportamiento es conocido. Así que lo instanciamos en `AutomaticQuoteBot` y, de paso, arreglamos que no lo necesitamos para obtener la lista de blogs.

```php
<?php

namespace Quotebot\Domain;

class AutomaticQuoteBot
{
    private $blogAuctionTask;
    /**
     * @var AdSpaceProvider
     */
    private $adSpaceProvider;

    public function __construct(
        BlogAuctionTask $blogAuctionTask,
        AdSpaceProvider $adSpaceProvider
    )
    {
        $this->blogAuctionTask = $blogAuctionTask;
        $this->adSpaceProvider = $adSpaceProvider;
    }

    public function sendAllQuotes(string $rawMode): void
    {
        $mode = new Mode($rawMode);
        $blogs = $this->getBlogs();
        foreach ($blogs as $blog) {
            $this->blogAuctionTask->priceAndPublish($blog, $mode);
        }
    }

    protected function getBlogs()
    {
        return $this->adSpaceProvider->getSpaces();
    }
}
```

Y, por el momento, `BlogAuctionTask` quedará así:

```php
<?php

namespace Quotebot\Domain;

class BlogAuctionTask
{
    /** @var MarketDataRetriever */
    protected $marketDataRetriever;
    /** @var ProposalPublisher|null */
    private $proposalPublisher;
    /** @var TimeService */
    private $timeService;

    public function __construct(
        MarketDataRetriever $marketDataRetriever,
        ProposalPublisher $proposalPublisher,
        TimeService $timeService
    )
    {
        $this->marketDataRetriever = $marketDataRetriever;
        $this->proposalPublisher = $proposalPublisher;
        $this->timeService = $timeService;
    }

    public function priceAndPublish(string $blog, Mode $mode)
    {
        $averagePrice = $this->marketDataRetriever->averagePrice($blog);

        $proposal = $averagePrice + 2;

        $proposal = $proposal % 2 === 0
            ? $this->calculateEvenProposal($proposal)
            : $this->calculateOddProposal($mode);

        $this->publishProposal($proposal);
    }

    protected function publishProposal($proposal): void
    {
        $this->proposalPublisher->publish($proposal);
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

Y también tenemos que cambiar su test:

```php
<?php

namespace Quotebot;

use Generator;
use PHPUnit\Framework\TestCase;
use Quotebot\Domain\BlogAuctionTask;
use Quotebot\Domain\MarketDataRetriever;
use Quotebot\Domain\Mode;
use Quotebot\Domain\ProposalPublisher;
use Quotebot\Domain\TimeService;

class BlogAuctionTaskTest extends TestCase
{

    private $marketDataRetriever;
    private $proposalPublisher;
    private $timeService;
    private $blogAuctionTask;

    protected function setUp(): void
    {
        $this->marketDataRetriever = $this->createMock(MarketDataRetriever::class);
        $this->proposalPublisher = $this->createMock(ProposalPublisher::class);
        $this->timeService = $this->createMock(TimeService::class);

        $this->blogAuctionTask = new BlogAuctionTask(
            $this->marketDataRetriever,
            $this->proposalPublisher,
            $this->timeService
        );
    }

    /** @dataProvider casesProvider */
    public function testShouldSendAProposal($averagePrice, $mode, $proposal): void
    {
        $this->givenTimeIntervalIs(1);
        $this->givenAnAveragePrice($averagePrice);
        $this->thenAProposalIsSentOf($proposal);
        $this->whenIsPricedWithMode($mode);
    }

    public function casesProvider(): Generator
    {
        yield 'Odd path basic calculation' =>  [0, new Mode('SLOW'), 6.28];
        yield 'Even path basic calculation' => [1, new Mode('SLOW'), 6.30];
    }

    protected function givenAnAveragePrice($averagePrice): void
    {
        $this->marketDataRetriever
            ->method('averagePrice')
            ->willReturn($averagePrice);
    }

    protected function thenAProposalIsSentOf($proposal): void
    {
        $this->proposalPublisher
            ->expects(self::once())
            ->method('publish')
            ->with($proposal);
    }

    protected function whenIsPricedWithMode($mode): void
    {
        $this->blogAuctionTask->priceAndPublish('blog', $mode);
    }

    private function givenTimeIntervalIs($interval): void
    {
        $this->timeService->method('timeInterval')->willReturn($interval);
    }
}
```

Otros dos conceptos que se manejan en `BlogAuctionTask` son `Proposal` y `AveragePrice`, que están más relacionados de lo que parece a primera vista. De hecho, `Proposal` se obtiene a partir `AveragePrice`. ¿Por qué no modelar tanto ambos conceptos como su relación? Algo así:

```
$averagePrice = $this->marketDataRetriever->averagePrice($blog);
        
$proposal = $this->calculateProposal->fromPrice($averagePrice);
```

Sin embargo, parece claro que una Proposal es específica para un Blog, así que podría ser más correcto:

```
$averagePrice = $this->marketDataRetriever->averagePrice($blog);
        
$proposal = $this->calculateProposal->fromPriceForBlog($averagePrice, $blog);
```

Realmente hay varias formas de plantear esto mismo, por lo que podemos empezar por aquí y ver a dónde nos lleva. De entrada, ambos conceptos `viven` en `BlogAuctionTask` que ahora quedaría así:

```php
<?php

namespace Quotebot\Domain;

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

    public function priceAndPublish(string $blog, Mode $mode)
    {
        $averagePrice = $this->marketDataRetriever->averagePrice($blog);

        $proposal = $this->calculateProposal->fromPrice(
            new Price($averagePrice),
            $mode
        );

        $this->publishProposal($proposal);
    }

    protected function publishProposal($proposal): void
    {
        $this->proposalPublisher->publish($proposal);
    }

}
```

Se introduce el servicio `CalculateProposal`:

```php
<?php


namespace Quotebot\Domain;


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

Y estos son los objetos `Price` y `Proposal`:

```php
<?php


namespace Quotebot\Domain;


class Price
{
    /**
     * @var float
     */
    private $price;

    /**
     * Price constructor.
     */
    public function __construct(float $price)
    {
        $this->price = $price;
    }

    /**
     * @return float
     */
    public function getPrice(): float
    {
        return $this->price;
    }
}
```

```php
<?php


namespace Quotebot\Domain;


class Proposal
{
    /**
     * @var float
     */
    private $proposal;

    public function __construct(float $proposal)
    {
        $this->proposal = $proposal;
    }

    /**
     * @return float
     */
    public function getProposal(): float
    {
        return $this->proposal;
    }
}
```

Para no hacer el artículo muy largo no voy a mostrar aquí cómo han tenido que cambiar otros objetos para adaptarse a los nuevos tipos.

Ahora parece claro que `MarketDataRetriever` debería devolver objetos `Price`.

Por ejemplo, el adaptador que encapsula `MarketStudyVendor`:

```php
<?php


namespace Quotebot\Infrastructure\MarketDataRetriever;


use MarketStudyVendor;
use Quotebot\Domain\MarketDataRetriever;
use Quotebot\Domain\Price;

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

    public function averagePrice(string $blog): Price
    {
        $averagePrice = $this->marketStudyVendor->averagePrice($blog);
        
        return new Price($averagePrice);
    }
}
```

Por cierto, que al introducir este cambio he descubierto un error que había pasado desapercibido y que se puso de manifiesto por este test:

```php
<?php

namespace Tests\Quotebot;

use PHPUnit\Framework\TestCase;
use Quotebot\Domain\AdSpaceProvider;
use Quotebot\Domain\AutomaticQuoteBot;
use Quotebot\Domain\BlogAuctionTask;
use Quotebot\Domain\CalculateProposal;
use Quotebot\Domain\MarketDataRetriever;
use Quotebot\Domain\Price;
use Quotebot\Domain\ProposalPublisher;
use Quotebot\Domain\TimeService;
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

        $adSpaceProvider->method('getSpaces')->willReturn(['Blog1', 'Blog2']);
        $automaticQuoteBot = new AutomaticQuoteBot(
            $blogAuctionTask,
            $adSpaceProvider
        );

        Application::inject($automaticQuoteBot);
        Application::main();

        self::assertTrue(true);
    }

}

```

Y aprovecho para señalar que estamos gestionando todos estos cambios con tan sólo dos tests. Hasta ahora no hemos necesitado más.

La verdad es que ahora hemos introducido un montón de cambios con este último refactor, sin embargo, podemos desplegar con confianza.

## Estructurando el dominio

Al extraer conceptos la capa de dominio aparece ahora más desorganizada. Puede ser buen momento de darle un orden.

```
src
├── Domain
│   ├── AdSpaceProvider.php
│   ├── AutomaticQuoteBot.php
│   ├── BlogAuctionTask.php
│   ├── CalculateProposal.php
│   ├── MarketDataRetriever.php
│   ├── Mode.php
│   ├── Price.php
│   ├── Proposal.php
│   ├── ProposalPublisher.php
│   └── TimeService.php
└── Infrastructure
    ├── AdSpaceProvider
    │   ├── AdSpace.php
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

Así, por ejemplo, `MarketDataRetriever` está estrechamente vinculado con `Price`:

```
src
├── Domain
│   ├── AdSpaceProvider.php
│   ├── AutomaticQuoteBot.php
│   ├── BlogAuctionTask.php
│   ├── CalculateProposal.php
│   ├── MarketData
│   │   ├── MarketDataRetriever.php
│   │   └── Price.php
│   ├── Mode.php
│   ├── Proposal.php
│   ├── ProposalPublisher.php
│   └── TimeService.php
└── Infrastructure
    ├── AdSpaceProvider
    │   ├── AdSpace.php
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

Por otro lado, `CalculateProposal` y `TimeService` también van juntos. Puede tener sentido que `Proposal` esté dando nombre a este grupo, en el que `Mode` también parece ser un elemento importante:

```
src
├── Domain
│   ├── AdSpaceProvider.php
│   ├── AutomaticQuoteBot.php
│   ├── BlogAuctionTask.php
│   ├── MarketData
│   │   ├── MarketDataRetriever.php
│   │   └── Price.php
│   ├── Proposal
│   │   ├── CalculateProposal.php
│   │   ├── Mode.php
│   │   ├── Proposal.php
│   │   └── TimeService.php
│   └── ProposalPublisher.php
└── Infrastructure
    ├── AdSpaceProvider
    │   ├── AdSpace.php
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

Esto nos deja con un par de clases, `AutomaticQuoteBot` y `BlogAuctionTask` que entrañan cierta dificultad. En realidad no representan conceptos de dominio. Básicamente se encargan de orquestar otros elementos para ejecutar las intenciones de los usuarios. Realmente pertenecen a la capa de aplicación.

```
src
├── Application
│   ├── AutomaticQuoteBot.php
│   └── BlogAuctionTask.php
├── Domain
│   ├── AdSpaceProvider.php
│   ├── MarketData
│   │   ├── MarketDataRetriever.php
│   │   └── Price.php
│   ├── Proposal
│   │   ├── CalculateProposal.php
│   │   ├── Mode.php
│   │   ├── Proposal.php
│   │   └── TimeService.php
│   └── ProposalPublisher.php
└── Infrastructure
    ├── AdSpaceProvider
    │   ├── AdSpace.php
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

## Fin de la segunda parte

Nos queda aún trabajo. Tenemos un concepto que no hemos reflejado, como es el de `Blog` o `AdSpace`. De hecho, tenemos que introducir un filtro en el `AdSpaceProvider` para poder usar sólo los espacios que cumplen algunas condiciones.

También nos podría interesar replantear el modo en que se expresan las acciones que realizan `AutomaticQuoteBot` y `BlogAuctionTask` ya que querríamos introducir el patrón `Command` para mejorar este punto.

Y luego, veremos que con la nueva organización del código, es posible detectar algunas áreas de mejora.

Pero eso lo dejaremos para una tercera parte. Esta kata está dando mucho de sí.
