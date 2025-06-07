---
layout: post
title: Poner el código bajo test
subtitle: Trabajar con legacy y entender el dominio (1)
categories: articles
tags: design-principles good-practices refactoring
---

Todo código en producción es legacy, al final es una cuestión de grado.

Imagina que llegas a un equipo nuevo. El código es totalmente desconocido para ti, la distancia entre el conocimiento representado en ese código y el que tienes de ese dominio será la máxima posible.  O imagina que te presentan el típico proyecto legacy, que está funcionando en producción pero que nadie se atreve a tocar, de tal modo que se ha decidido empezar de cero con un proyecto que lo reemplace.

Y, sin embargo, puede que esa no sea la mejor opción.

Hace tiempo que descubrí la [QuoteBot kata](https://github.com/cyriux/legacy-testing-kata-java), un ejercicio para aprender a trabajar con código legacy. Me gustó tanto [que la adapté a PHP](https://github.com/franiglesias/legacy-testing-kata) y la he repetido varias veces.

En esta kata vamos a ver un código que no conocemos, estructurado de una manera que no entendemos y que tiene pinta de no ser precisamente buena. Aparte de eso, no hay ni un solo test. Por otro lado, una condición importante: No podemos tocar lo que hay en la carpeta `lib`, son vendors que no controlamos.

Así que en este primer artículo me voy a centrar en como reestructurar el código para tener una organización más actual. En la segunda parte, veremos como desarrollar una capa de dominio rica, que describa por sí misma lo que hace la aplicación.

## Qué sabemos del dominio de nuestra aplicación

Lo único que sabemos es que un sistema para presentar pujas por espacios de anuncios en sitios de Internet, sin que tengamos muy claro lo que esto significa.

Así que, para intentar entenderlo, vamos a hacer checkout del proyecto y tratar de ejecutarlo.

Al descargar el proyecto y examinar el código por encima comenzamos a ver toda una serie de problemas. Especialmente dependencias. Lo ideal sería intentar ejecutar el software en un entorno de test, pero de momento no tenemos una idea de cómo hacerlo. Así que vamos a probar a ejecutarlo en local, sin más.

## Primer intento de ejecutar el software en local

Lo primero es ejecutar el software en nuestro entorno de desarrollo. Lanzamos el run.php con la ayuda de docker.

```
docker exec -it quotebot php run.php
```

Resultado:

```
PHP Fatal error:  Uncaught RuntimeException: [Stupid license] Missing license!!!! in /var/www/dojo/lib/MarketStudyVendor.php:8
Stack trace:
#0 /var/www/dojo/src/BlogAuctionTask.php(19): MarketStudyVendor->averagePrice('HackerNews')
#1 /var/www/dojo/src/AutomaticQuoteBot.php(12): Quotebot\BlogAuctionTask->priceAndPublish('HackerNews', 'FAST')
#2 /var/www/dojo/src/Application.php(11): Quotebot\AutomaticQuoteBot->sendAllQuotes('FAST')
#3 /var/www/dojo/run.php(7): Quotebot\Application::main()
#4 {main}
  thrown in /var/www/dojo/lib/MarketStudyVendor.php on line 8
```

WTF! Hace falta una licencia para ejecutarlo. Se ha roto en `BlogAuctionTask.php`(19), pero realmente el problema está en `MarkeStudyVendor`(7). La licencia está en una variable de entorno que nuestro local no tiene definida.

**Solución fácil.** Setear una variable de entorno para que el vendor no falle. Al tener el entorno *dockerizado* podríamos añadirla fácilmente, ¿no?

```docker-compose
version: '3'
services:
    php:
        build: ./docker
        container_name: quotebot
        environment:
            license: some
        volumes:
            - ./:/var/www/dojo
        tty: true
```

Esto nos permitirá librarnos del problema momentáneamente y gracias a Docker. No es una buena solución porque imponemos una condición muy específica al entorno. Más adelante podremos volver a ella e intentar resolverla de una forma más correcta.

## Segundo intento de ejecutar el software

Al reiniciar el entorno vemos que aparece un nuevo mensaje de error, que no pinta nada bien:

```
You've pushed a dummy auction to a real ads platform, the business is upset!
```

Esto es, si ejecutamos el software, estamos ejecutándolo contra plataformas reales. ¡Estamos gastando dinero de verdad!

Es necesario parar y recapitular un momento.

En primer lugar, ¿en qué punto del código está sucediendo esto? Si hacemos una búsqueda, veremos que `QuotePublisher`, cuyo método `publish` se invoca en `BlogAuctionTask.php`(46). Aquí tenemos una llamada estática a una dependencia que conecta producción con una plataforma externa.

Ahora ya no podemos optar por una solución simple, ¿eh? En último término tenemos que extraer la dependencia e invertirla mediante una interfaz y adaptadores para usar en el entorno de producción y de test. ¿Podríamos hacer esto y protegernos también con un test?

El problema que tenemos es que si ejecutamos el código se lanzará una nueva puja, por lo que primero vamos a hacer algo que nos permita testear `BlogAuctionTask` sin lanzar pujas. Después trataremos de ponerlo todo en un test, una vez que nos hayamos librado de los efectos con producción.

Nuestro primer paso será aislar la dependencia de `QuotePublisher` en un método protegido de `BlogAuctionTask`.

*Antes*

```php
<?php

namespace Quotebot;

use MarketStudyVendor;

class BlogAuctionTask
{
    /** @var MarketStudyVendor */
    private $marketDataRetriever;

    public function __construct()
    {
        $this->marketDataRetriever = new MarketStudyVendor();
    }

    public function priceAndPublish(string $blog, string $mode)
    {
        $avgPrice = $this->marketDataRetriever->averagePrice($blog);

        // FIXME should actually be +2 not +1

        $proposal = $avgPrice + 1;
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

        $proposal = $proposal % 2 === 0 ? 3.14 * $proposal : 3.15
            * $timeFactor
            * (new \DateTime())->getTimestamp() - (new \DateTime('2000-1-1'))->getTimestamp();

        \QuotePublisher::publish($proposal);
    }
}
```

Y *después*:

```php
<?php

namespace Quotebot;

use MarketStudyVendor;

class BlogAuctionTask
{
    /** @var MarketStudyVendor */
    private $marketDataRetriever;

    public function __construct()
    {
        $this->marketDataRetriever = new MarketStudyVendor();
    }

    public function priceAndPublish(string $blog, string $mode)
    {
        $avgPrice = $this->marketDataRetriever->averagePrice($blog);

        // FIXME should actually be +2 not +1

        $proposal = $avgPrice + 1;
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

        $proposal = $proposal % 2 === 0 ? 3.14 * $proposal : 3.15
            * $timeFactor
            * (new \DateTime())->getTimestamp() - (new \DateTime('2000-1-1'))->getTimestamp();

        $this->publishProposal($proposal);
    }

    protected function publishProposal($proposal): void
    {
        \QuotePublisher::publish($proposal);
    }
}
```

Para empezar a hacer un test, vamos a crear una versión testeable de la clase. Simplemente, la extenderemos sobreescribiendo el método que acabamos `publishProposal` de extraer. De momento lo dejaremos vacío para que no se ejecute nada.

Esto vamos a hacerlo en un test con una clase anónima. Así que empezamos escribiendo un test que realmente no testea nada, pero que nos servirá para ejecutar `BlogAuctionTask` sin que ocurra nada indeseado.

```php
<?php

namespace Tests\Quotebot;

use Quotebot\BlogAuctionTask;
use PHPUnit\Framework\TestCase;

class BlogAuctionTaskTest extends TestCase
{
    public function testShouldRun(): void
    {

        $blogAuctionTask = new class() extends BlogAuctionTask {
            protected function publishProposal($proposal): void
            {
            }
        };

        $blogAuctionTask->priceAndPublish('blog', 'SLOW');

        self::assertTrue(true);
    }

}
```

Al examinar el código parece claro que `MarketStudyVendor` nos proporciona un precio inicial que se va modificando según unas reglas de negocio (que aún no entendemos) para generar una propuesta o puja que, por otro lado, también parece depender de la fecha en que se realiza. Esta puja se hace efectiva con `QuotePublisher`.

Podríamos seguir analizando `BlogAuctionTask`, porque parece ser el componente principal de la aplicación, identificando los conceptos y reglas de negocio que encapsula.

Pero, por otro lado, puede ser valioso ver la aplicación en conjunto, por lo que vamos a intentar poner la aplicación bajo test primero y luego profundizar.

## Intentar tener toda la aplicación en test

Lo que voy a hacer es cambiar la semántica del test, para montar la aplicación completa dentro del mismo.

Esto lo haré a partir del método público de `BlogAuctionTask`, `priceAndPublish`, localizando desde dónde es llamado y subiendo a través de la pila de llamadas, paso a paso.

Esto ocurre en `AutomaticQuoteBot`:

```php
<?php

namespace Quotebot;

class AutomaticQuoteBot
{
    public function sendAllQuotes(string $mode): void
    {
        $blogs = AdSpace::getAdSpaces($mode);
        foreach ($blogs as $blog) {
            $blogAuctionTask = new BlogAuctionTask();
            $blogAuctionTask->priceAndPublish($blog, $mode);
        }
    }
}
```

En principio, `AutomaticQuoteBot` se encarga de obtener una lista de blogs, que podría ser aquellos en los que vamos a contratar espacio publicitario, y generar una puja por cada uno.

Como se puede ver, tenemos otra llamada estática y `BlogAuctionTask` es instanciada dentro de su consumidor. Para poder usar nuestra versión testeable tenemos que poder inyectar esa dependencia, así que cambiaremos el código por pasos.

Primero, `$blogAuctionTask` se ha de convertir en un miembro de `AutomaticQuoteBot` y se debería iniciar en el constructor.

```php
<?php

namespace Quotebot;

class AutomaticQuoteBot
{
    private $blogAuctionTask;

    public function __construct()
    {
        $this->blogAuctionTask = new BlogAuctionTask();
    }

    public function sendAllQuotes(string $mode): void
    {
        $blogs = AdSpace::getAdSpaces($mode);
        foreach ($blogs as $blog) {
            $this->blogAuctionTask->priceAndPublish($blog, $mode);
        }
    }
}

```

Este es un primer paso, pero todavía tenemos que poder inyectarla sin que se vea afectado el software en producción. Eso podemos hacerlo con una técnica de default con la que podremos inyectarla en test, mientras que en producción no cambiaría nada todavía:

```php
<?php

namespace Quotebot;

class AutomaticQuoteBot
{
    private $blogAuctionTask;

    public function __construct(?BlogAuctionTask $blogAuctionTask = null)
    {
        $this->blogAuctionTask = $blogAuctionTask ?? new BlogAuctionTask();
    }

    public function sendAllQuotes(string $mode): void
    {
        $blogs = AdSpace::getAdSpaces($mode);
        foreach ($blogs as $blog) {
            $this->blogAuctionTask->priceAndPublish($blog, $mode);
        }
    }
}
```


Ahora podemos hacer el test, primero le cambiamos su significado con un nombre más genérico y montamos el test.

```php
<?php

namespace Tests\Quotebot;

use Quotebot\AutomaticQuoteBot;
use Quotebot\BlogAuctionTask;
use PHPUnit\Framework\TestCase;

class QuoteBotAppTest extends TestCase
{
    public function testShouldRun(): void
    {
        $blogAuctionTask = new class() extends BlogAuctionTask {
            protected function publishProposal($proposal): void
            {
            }
        };

        $automaticQuoteBot = new AutomaticQuoteBot($blogAuctionTask);
        $automaticQuoteBot->sendAllQuotes('SLOW');

        self::assertTrue(true);
    }

}
```

Lo ejecutamos y pasa, lo que está muy bien, pero nos fijamos en este detalle:

```
Time: 5.49 seconds, Memory: 4.00MB

OK (1 test, 1 assertion)
```

El test tarda 5 segundos en ejecutarse, lo que cual sería excesivo incluso en Docker para Mac. Esto es así porque `AutomaticQuoteBot` obtendría la lista de blogs de un recurso lento que podría ser una base de datos o una API, que aquí está siendo simulado con un sleep para forzar el tiempo de respuesta.

`AutomaticQuoteBot` obtiene la lista de blogs de una dependencia estática llamada `AdSpace`, la cual, a su vez, obtiene la lista de otra dependencia más llamada `TechBlogs`. `AdSpace` actúa haciendo una cache de la lista para evitar que las peticiones sucesivas sean lentas, aunque esto en el test no ocurre porque todo se inicia cada vez.

Una primera estrategia que podemos adoptar es la que hicimos antes: asilar la llamada estática en un método protected de `AutomaticQuoteBot` y usar en el test una versión testeable en la que el método sea sobreescrito para devolver una lista prefijada de blogs. Así que vamos a ello.

Primer paso, modificamos `AutomaticQuoteBot`:

```php
<?php

namespace Quotebot;

class AutomaticQuoteBot
{
    private $blogAuctionTask;

    public function __construct(?BlogAuctionTask $blogAuctionTask = null)
    {
        $this->blogAuctionTask = $blogAuctionTask ?? new BlogAuctionTask();
    }

    public function sendAllQuotes(string $mode): void
    {
        $blogs = $this->getBlogs($mode);
        foreach ($blogs as $blog) {
            $this->blogAuctionTask->priceAndPublish($blog, $mode);
        }
    }

    protected function getBlogs(string $mode)
    {
        return AdSpace::getAdSpaces($mode);
    }
}
```

Segundo paso, transformamos el test para crear una instancia testeable:

```php
<?php

namespace Tests\Quotebot;

use Quotebot\AutomaticQuoteBot;
use Quotebot\BlogAuctionTask;
use PHPUnit\Framework\TestCase;

class QuoteBotAppTest extends TestCase
{
    public function testShouldRun(): void
    {
        $blogAuctionTask = new class() extends BlogAuctionTask {
            protected function publishProposal($proposal): void
            {
            }
        };

        $automaticQuoteBot = new class($blogAuctionTask) extends AutomaticQuoteBot {
            protected function getBlogs(string $mode): array
            {
                return ['Blog1', 'Blog2'];
            }
        };
        
        $automaticQuoteBot->sendAllQuotes('SLOW');

        self::assertTrue(true);
    }

}
```

Ejecutamos el nuevo test y tenemos una mejora sustancial en performance:

```
Time: 409 ms, Memory: 4.00MB

OK (1 test, 1 assertion)
```

## ¿Dónde estamos ahora?

En este momento, empezamos a tener una mayor idea de qué hace la aplicación. En primer lugar, obtiene una lista de blogs para los que generar una puja por un espacio publicitario. Todavía no sabemos muy bien cómo se calcula esa puja, pero ya nos ocuparemos de eso.

Por otro lado, en el aspecto técnico hemos conseguido ejecutar el caso de uso de la aplicación en entorno de test y, lo más importante, sin afectar al funcionamiento en producción. Esto es, hemos conseguido hacer un primer refactor para hacer la aplicación testeable sin perder funcionalidad ni introducir defectos.

EL siguiente punto podría ser introducir ya toda la aplicación en el test. El script `run.php` actúa como *entry point* en producción, pero no hace nada más que instanciar la aplicación. Vamos a poner el objeto `Application` también en test y con eso habremos terminado la primera parte del refactor.

## Otra inyección

Por supuesto, `Application` está acoplado a `AutomaticQuoteBot`, pero se ejecuta con una llamada estática. Esto no debería impedirnos hacer la inyección. Aunque en este caso, de una manera un poco retorcida, pero debería ser suficiente:

```php
<?php

namespace Quotebot;

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
        self::$bot = self::$bot ?? new AutomaticQuoteBot();
        self::$bot->sendAllQuotes('FAST');
    }
}
```

Ahora la introducimos en el test:

```php
<?php

namespace Tests\Quotebot;

use Quotebot\Application;
use Quotebot\AutomaticQuoteBot;
use Quotebot\BlogAuctionTask;
use PHPUnit\Framework\TestCase;

class QuoteBotAppTest extends TestCase
{
    public function testShouldRun(): void
    {
        $blogAuctionTask = new class() extends BlogAuctionTask {
            protected function publishProposal($proposal): void
            {
            }
        };

        $automaticQuoteBot = new class($blogAuctionTask) extends AutomaticQuoteBot {
            protected function getBlogs(string $mode): array
            {
                return ['Blog1', 'Blog2'];
            }
        };

        Application::inject($automaticQuoteBot);
        Application::main();

        self::assertTrue(true);
    }

}
```

Con esto tenemos la aplicación completa en el entorno de test, usando nuestras versiones testeables de las dependencias.

Pero aún nos queda un detalle. Al principio establecimos una variable de entorno license para poder ejecutar el programa. Esa variable era requerida por una dependencia usada por `BlogAuctionTask`. Ahora queremos tomar el control de la misma, por lo que vamos a hacer que sea inyectable, en primer lugar, y luego le pasaremos una versión doblada.

```php
<?php

namespace Quotebot;

use MarketStudyVendor;

class BlogAuctionTask
{
    /** @var MarketStudyVendor */
    protected $marketDataRetriever;

    public function __construct($marketDataRetriever = null)
    {
        $this->marketDataRetriever = $marketDataRetriever ?? new MarketStudyVendor();
    }

    public function priceAndPublish(string $blog, string $mode)
    {
        $avgPrice = $this->marketDataRetriever->averagePrice($blog);

        // FIXME should actually be +2 not +1

        $proposal = $avgPrice + 1;
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

        $proposal = $proposal % 2 === 0 ? 3.14 * $proposal : 3.15
            * $timeFactor
            * (new \DateTime())->getTimestamp() - (new \DateTime('2000-1-1'))->getTimestamp();

        $this->publishProposal($proposal);
    }

    protected function publishProposal($proposal): void
    {
        \QuotePublisher::publish($proposal);
    }
}
```

Y ahora introducimos un doble de test. Por ahora nos basta con un *stub*.

```php
<?php

namespace Tests\Quotebot;

use Quotebot\Application;
use Quotebot\AutomaticQuoteBot;
use Quotebot\BlogAuctionTask;
use PHPUnit\Framework\TestCase;

class QuoteBotAppTest extends TestCase
{
    public function testShouldRun(): void
    {
        $marketStudyVendor = $this->createMock(\MarketStudyVendor::class);

        $blogAuctionTask = new class($marketStudyVendor) extends BlogAuctionTask {
            protected function publishProposal($proposal): void
            {
            }
        };

        $automaticQuoteBot = new class($blogAuctionTask) extends AutomaticQuoteBot {
            protected function getBlogs(string $mode): array
            {
                return ['Blog1', 'Blog2'];
            }
        };

        Application::inject($automaticQuoteBot);
        Application::main();

        self::assertTrue(true);
    }

}
```

Nos quedaría ajustar el valor que debería devolver el stub. Antes de eso, vamos a probar que el test sigue pasando sin fallos. Todavía no verifica otra cosa que no sea que el código se puede ejecutar. Sin embargo, ahora podemos ejecutar el test sin necesidad de tener la variable de entorno.

En este punto, no tenemos ni idea de qué tipo de valores podría retornar `MarketStudyVendor`, así que vamos a empezar explícitamente con `0`. El test queda así:

```php
<?php

namespace Tests\Quotebot;

use Quotebot\Application;
use Quotebot\AutomaticQuoteBot;
use Quotebot\BlogAuctionTask;
use PHPUnit\Framework\TestCase;

class QuoteBotAppTest extends TestCase
{
    public function testShouldRun(): void
    {
        $marketStudyVendor = $this->createMock(\MarketStudyVendor::class);
        $marketStudyVendor->method('averagePrice')->willReturn(0);
        
        $blogAuctionTask = new class($marketStudyVendor) extends BlogAuctionTask {
            protected function publishProposal($proposal): void
            {
            }
        };

        $automaticQuoteBot = new class($blogAuctionTask) extends AutomaticQuoteBot {
            protected function getBlogs(string $mode): array
            {
                return ['Blog1', 'Blog2'];
            }
        };

        Application::inject($automaticQuoteBot);
        Application::main();

        self::assertTrue(true);
    }

}
```

Y con esto deberíamos estar preparadas para empezar a trabajar de verdad.

## Qué hemos aprendido

Si nos fijamos en el test ya podemos ver cómo es la relación entre los componentes principales de la aplicación. Fíjate que estamos usando clases modificadas expresamente para test y *mocks*. Nuestro objetivo es poder ejecutar este mismo test usando los objetos reales que controlamos e implementaciones específicas para test de las dependencias de *vendors* y de infraestructura.

Este test nos servirá para tener una red de seguridad que nos evite romper algo. Sin embargo, esto es solo un primer paso.

## Entendiendo el dominio

¿De qué trata esta pequeña aplicación? Sabemos que consiste en enviar pujas por espacio publicitario en blogs. El meollo o core de la aplicación ocurre en `BlogAuctionTask`. Aquí todavía tenemos pendiente el problema de extraer la dependencia de `QuotePublisher`, pero nos ocuparemos de eso dentro de un rato.

Primero vamos a examinar el código de la clase y ver qué ideas podemos extraer de ella.

```php
<?php

namespace Quotebot;

use MarketStudyVendor;

class BlogAuctionTask
{
    /** @var MarketStudyVendor */
    protected $marketDataRetriever;

    public function __construct($marketDataRetriever = null)
    {
        $this->marketDataRetriever = $marketDataRetriever ?? new MarketStudyVendor();
    }

    public function priceAndPublish(string $blog, string $mode)
    {
        $avgPrice = $this->marketDataRetriever->averagePrice($blog);

        // FIXME should actually be +2 not +1

        $proposal = $avgPrice + 1;
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

        $proposal = $proposal % 2 === 0 ? 3.14 * $proposal : 3.15
            * $timeFactor
            * (new \DateTime())->getTimestamp() - (new \DateTime('2000-1-1'))->getTimestamp();

        $this->publishProposal($proposal);
    }

    protected function publishProposal($proposal): void
    {
        \QuotePublisher::publish($proposal);
    }
}
```

Lo primero que observamos es que se genera una propuesta por blog y modo. El blog nos proporciona un previo medio (`$avgPrice`). A partir del modo se obtiene `$timeFactor` que se aplica en el cálculo de la propuesta.

Esto nos lleva a la fórmula de cálculo. Se puede observar que hay dos variantes. Si el valor de `$proposal` es par se toma un valor y si es impar se calcula en función de un intervalo de tiempo, y esto será un problema ya que tenemos una dependencia global, la función DateTime toma por defecto el valor del reloj del sistema en cada momento, con lo cual su valor es impredecible en el momento de ejecutar el test.

Así que tenemos dos dependencias que necesitamos poder extraer, una explícita y otra implícita. La cuestión es: ¿cómo?

Una opción sería hacer evolucionar nuestro test inicial para poder testear `BlogAuctionTask`, pero quizá sea mejor testearla en aislamiento. Así que vamos a ello. Empecemos por aquí:

```php
<?php

namespace Quotebot;

use PHPUnit\Framework\TestCase;

class BlogAuctionTaskTest extends TestCase
{

    public function testShouldSendAProposal(): void
    {
        $marketStudyVendor = $this->createMock(\MarketStudyVendor::class);
        $marketStudyVendor->method('averagePrice')->willReturn(0);

        $blogAuctionTask = new class($marketStudyVendor) extends BlogAuctionTask {
            protected function publishProposal($proposal): void
            {
            }
        };

        self::assertTrue(true);

    }
}
```

Como primer objetivo voy a sacar la dependencia de `QuotePublisher`, de forma que pueda reemplazarlo por un *mock* y así ser capaz de examinar el valor de `$proposal`. ¿Qué necesito hacer? Ya hemos aislado la dependencia en un método privado. Ahora usaremos el patrón *port + adapter* para invertir la dependencia y extraerlo.

Empezaré por introducir un colaborador en `BlogAuctionTask` con una interfaz que llamaré `ProposalPublisher`. Para producción necesitaré implementar un `QuoteProposalPublisher` que será un `Adapter` envolviendo a `QuotePublisher`.

```php
<?php

namespace Quotebot;

use MarketStudyVendor;

class BlogAuctionTask
{
    /** @var MarketStudyVendor */
    protected $marketDataRetriever;
    /**
     * @var ProposalPublisher|null
     */
    private $proposalPublisher;

    public function __construct(
        $marketDataRetriever = null,
        ?ProposalPublisher $proposalPublisher = null
    )
    {
        $this->marketDataRetriever = $marketDataRetriever ?? new MarketStudyVendor();
        $this->proposalPublisher = $proposalPublisher ?? new QuoteProposalPublisher();
    }

    public function priceAndPublish(string $blog, string $mode)
    {
        $avgPrice = $this->marketDataRetriever->averagePrice($blog);

        // FIXME should actually be +2 not +1

        $proposal = $avgPrice + 1;
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

        $proposal = $proposal % 2 === 0 ? 3.14 * $proposal : 3.15
            * $timeFactor
            * (new \DateTime())->getTimestamp() - (new \DateTime('2000-1-1'))->getTimestamp();

        $this->publishProposal($proposal);
    }

    protected function publishProposal($proposal): void
    {
        $this->proposalPublisher->publish($proposal);
    }
}
```

He aquí la interfaz:

```php
<?php


namespace Quotebot\Domain;


interface ProposalPublisher
{
    public function publish(float $proposal): void;
}
```

Y aquí la implementación del adaptador:

```php
<?php


namespace Quotebot\Infrastructure;


use Quotebot\Domain\ProposalPublisher;

class QuoteProposalPublisher implements ProposalPublisher
{

    public function __construct()
    {
    }

    public function publish(float $proposal): void
    {
        \QuotePublisher::publish($proposal);
    }
}
```

So te fijas en los name spaces observarás que he comenzado a introducir capas en la aplicación.

Ahora puedo modificar el test para pasar un mock de `ProposalPublisher` y montar una instancia de `BlogAuctionTask`. 

```php
<?php

namespace Quotebot;

use PHPUnit\Framework\TestCase;
use Quotebot\Domain\ProposalPublisher;

class BlogAuctionTaskTest extends TestCase
{

    public function testShouldSendAProposal(): void
    {
        $marketStudyVendor = $this->createMock(\MarketStudyVendor::class);
        $marketStudyVendor->method('averagePrice')->willReturn(0);

        $proposalPublisher = $this->createMock(ProposalPublisher::class);

        $blogAuctionTask = new BlogAuctionTask($marketStudyVendor, $proposalPublisher);
        
        self::assertTrue(true);

    }
}
```


Esto mismo lo puedo hacer en `QuoteBotAppTest`.

```php
<?php

namespace Tests\Quotebot;

use Quotebot\Application;
use Quotebot\AutomaticQuoteBot;
use Quotebot\BlogAuctionTask;
use PHPUnit\Framework\TestCase;
use Quotebot\Domain\ProposalPublisher;

class QuoteBotAppTest extends TestCase
{
    public function testShouldRun(): void
    {
        $marketStudyVendor = $this->createMock(\MarketStudyVendor::class);
        $marketStudyVendor->method('averagePrice')->willReturn(0);

        $proposalPublisher = $this->createMock(ProposalPublisher::class);

        $blogAuctionTask = new BlogAuctionTask($marketStudyVendor, $proposalPublisher);
        
        $automaticQuoteBot = new class($blogAuctionTask) extends AutomaticQuoteBot {
            protected function getBlogs(string $mode): array
            {
                return ['Blog1', 'Blog2'];
            }
        };

        Application::inject($automaticQuoteBot);
        Application::main();

        self::assertTrue(true);
    }

}
```

Nuestro test de `BlogAuctionTask` aún no está completo, lo ideal sería testear con el valor de `$proposal`, cosa que podemos hacer con el *mock*, pero recuerda que teníamos el problema de que este valor podría ser impredecible en algunos casos, que es cuando el valor de `$proposal` sea impar antes de aplicar el time factor. Por tanto, si podemos hacer que `$avgPrice` nos genere un valor de `$proposal` adecuado, sí que podríamos tener un primer test.


```php
        $avgPrice = $this->marketDataRetriever->averagePrice($blog);

        // FIXME should actually be +2 not +1

        $proposal = $avgPrice + 1;
        $timeFactor = 1;
```

El comentario nos pide que hagamos el arreglo de cambiar el `+1` por `+2`. Pero no tenemos ningún test. Hagamos uno primero, y luego el arreglo. Lo que hemos podido ver es que si `$avgPrice + 1` es par, se multiplica `$proposal` por 3.14, con lo que ya tenemos un buen valor para empezar.

```php
$proposal = $proposal % 2 === 0 ? 3.14 * $proposal : 3.15
            * $timeFactor
            * (new \DateTime())->getTimestamp() - (new \DateTime('2000-1-1'))->getTimestamp();

```

`MarketStudyVendor` debería entregar un `1`, lo que dará `6.28` como valor de `$proposal`.

He aquí el test:

```php
<?php

namespace Quotebot;

use PHPUnit\Framework\TestCase;
use Quotebot\Domain\ProposalPublisher;

class BlogAuctionTaskTest extends TestCase
{

    public function testShouldSendAProposal(): void
    {
        $marketStudyVendor = $this->createMock(\MarketStudyVendor::class);
        $marketStudyVendor
            ->method('averagePrice')
            ->willReturn(1);

        $proposalPublisher = $this->createMock(ProposalPublisher::class);
        $proposalPublisher
            ->expects(self::once())
            ->method('publish')
            ->with(6.28);

        $blogAuctionTask = new BlogAuctionTask($marketStudyVendor, $proposalPublisher);
        $blogAuctionTask->priceAndPublish('blog', 'SLOW');

    }
}
```

El test pasa, lo que indica que nuestro análisis es correcto. Podemos comprobarlo con otros valores, como `3`, que nos daría `12.56`. Si deployamos a producción todo sigue funcionando también.

## TDD para arreglar bugs

Volvamos al FIXME encontrado en los comentarios. Este nos dice que `$avgPrice` debería ser incrementado con `2` en lugar de con `1`, con lo cual, nuestro test debería cambiar para reflejar el comportamiento corregido. En este caso, `MarketStudyVendor` entregaría un valor de 0 para obtener una `$proposal` de `6.28`.

```php
<?php

namespace Quotebot;

use PHPUnit\Framework\TestCase;
use Quotebot\Domain\ProposalPublisher;

class BlogAuctionTaskTest extends TestCase
{

    public function testShouldSendAProposal(): void
    {
        $marketStudyVendor = $this->createMock(\MarketStudyVendor::class);
        $marketStudyVendor
            ->method('averagePrice')
            ->willReturn(0);

        $proposalPublisher = $this->createMock(ProposalPublisher::class);
        $proposalPublisher
            ->expects(self::once())
            ->method('publish')
            ->with(6.28);

        $blogAuctionTask = new BlogAuctionTask($marketStudyVendor, $proposalPublisher);
        $blogAuctionTask->priceAndPublish('blog', 'SLOW');

    }
}
```


Con el cambio, el test fallará, así que vamos a introducir el fix indicado y hacerlo pasar:

```php
<?php

namespace Quotebot;

use MarketStudyVendor;
use Quotebot\Domain\ProposalPublisher;
use Quotebot\Infrastructure\QuoteProposalPublisher;

class BlogAuctionTask
{
    /** @var MarketStudyVendor */
    protected $marketDataRetriever;
    /**
     * @var ProposalPublisher|null
     */
    private $proposalPublisher;

    public function __construct(
        $marketDataRetriever = null,
        ?ProposalPublisher $proposalPublisher = null
    )
    {
        $this->marketDataRetriever = $marketDataRetriever ?? new MarketStudyVendor();
        $this->proposalPublisher = $proposalPublisher ?? new QuoteProposalPublisher();
    }

    public function priceAndPublish(string $blog, string $mode)
    {
        $avgPrice = $this->marketDataRetriever->averagePrice($blog);
        
        $proposal = $avgPrice + 2;
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

        $proposal = $proposal % 2 === 0 ? 3.14 * $proposal : 3.15
            * $timeFactor
            * (new \DateTime())->getTimestamp() - (new \DateTime('2000-1-1'))->getTimestamp();

        $this->publishProposal($proposal);
    }

    protected function publishProposal($proposal): void
    {
        $this->proposalPublisher->publish($proposal);
    }
}
```

Ya lo tenemos.

## La regla del campamento

Ahora estamos en condiciones de hacer refactors para limpiar el código. Voy a empezar por el test. Lo arreglaré para que sea más legible:

```php
<?php

namespace Quotebot;

use PHPUnit\Framework\TestCase;
use Quotebot\Domain\ProposalPublisher;

class BlogAuctionTaskTest extends TestCase
{

    private $marketStudyVendor;
    private $proposalPublisher;

    protected function setUp()
    {
        $this->marketStudyVendor = $this->createMock(\MarketStudyVendor::class);
        $this->proposalPublisher = $this->createMock(ProposalPublisher::class);
    }


    public function testShouldSendAProposal(): void
    {
        $this->givenAnAveragePrice(0);
        $this->thenAProposalIsSentOf(6.28);
        $this->whenIsPricedWIthMode('SLOW');
    }

    protected function givenAnAveragePrice($averagePrice): void
    {
        $this->marketStudyVendor
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

    protected function whenIsPricedWIthMode($mode): void
    {
        $blogAuctionTask = new BlogAuctionTask($this->marketStudyVendor, $this->proposalPublisher);
        $blogAuctionTask->priceAndPublish('blog', $mode);
    }
}
```

Debido a haber simulado esto con Mocks no es posible tener la estructura Given-When-Then en el orden correcto, pero no solo el test se entiende mejor, sino que también podemos tener un generador de test que facilite su creación en el futuro.

```php
<?php

namespace Quotebot;

use Generator;
use PHPUnit\Framework\TestCase;
use Quotebot\Domain\ProposalPublisher;

class BlogAuctionTaskTest extends TestCase
{

    private $marketStudyVendor;
    private $proposalPublisher;

    protected function setUp()
    {
        $this->marketStudyVendor = $this->createMock(\MarketStudyVendor::class);
        $this->proposalPublisher = $this->createMock(ProposalPublisher::class);
    }

    /** @dataProvider casesProvider */
    public function testShouldSendAProposal($averagePrice, $mode, $proposal): void
    {
        $this->givenAnAveragePrice($averagePrice);
        $this->thenAProposalIsSentOf($proposal);
        $this->whenIsPricedWIthMode($mode);
    }

    public function casesProvider(): Generator
    {
        yield 'Odd path basic calculation' =>  [0, 'SLOW', 6.28];
    }

    protected function givenAnAveragePrice($averagePrice): void
    {
        $this->marketStudyVendor
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

    protected function whenIsPricedWIthMode($mode): void
    {
        $blogAuctionTask = new BlogAuctionTask($this->marketStudyVendor, $this->proposalPublisher);
        $blogAuctionTask->priceAndPublish('blog', $mode);
    }
}
```

Ahora, crear un test nuevo será cuestión de añadir una línea con su descripción y los datos en el método `casesProvider`.

Teniendo un test, podemos refactorizar la clase con más seguridad, reflejar mejor nuestro conocimiento y dejar las cosas más sencillas para quien venga a continuación.

La variable `$avgPrice` podría tener un nombre un poco mejor:

```php
        $averagePrice = $this->marketDataRetriever->averagePrice($blog);

        $proposal = $averagePrice + 2;
        $timeFactor = 1;
```

Mientras que la obtención del `$timeFactor` podría extraerse a un método privado, haciendo más legible el cuerpo del método:

```php
<?php

namespace Quotebot;

use MarketStudyVendor;
use Quotebot\Domain\ProposalPublisher;
use Quotebot\Infrastructure\QuoteProposalPublisher;

class BlogAuctionTask
{
    /** @var MarketStudyVendor */
    protected $marketDataRetriever;
    /**
     * @var ProposalPublisher|null
     */
    private $proposalPublisher;

    public function __construct(
        $marketDataRetriever = null,
        ?ProposalPublisher $proposalPublisher = null
    )
    {
        $this->marketDataRetriever = $marketDataRetriever ?? new MarketStudyVendor();
        $this->proposalPublisher = $proposalPublisher ?? new QuoteProposalPublisher();
    }

    public function priceAndPublish(string $blog, string $mode)
    {
        $averagePrice = $this->marketDataRetriever->averagePrice($blog);

        $proposal = $averagePrice + 2;
        
        $timeFactor = $this->timeFactor($mode);

        $proposal = $proposal % 2 === 0 ? 3.14 * $proposal : 3.15
            * $timeFactor
            * (new \DateTime())->getTimestamp() - (new \DateTime('2000-1-1'))->getTimestamp();

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
}
```

Y esto nos deja cara a cara con los métodos de cálculo de `$proposal`.

Para verlo más claro, vamos a encapsular cada versión del cálculo en un método separado:

```php
<?php

namespace Quotebot;

use MarketStudyVendor;
use Quotebot\Domain\ProposalPublisher;
use Quotebot\Infrastructure\QuoteProposalPublisher;

class BlogAuctionTask
{
    /** @var MarketStudyVendor */
    protected $marketDataRetriever;
    /**
     * @var ProposalPublisher|null
     */
    private $proposalPublisher;

    public function __construct(
        $marketDataRetriever = null,
        ?ProposalPublisher $proposalPublisher = null
    )
    {
        $this->marketDataRetriever = $marketDataRetriever ?? new MarketStudyVendor();
        $this->proposalPublisher = $proposalPublisher ?? new QuoteProposalPublisher();
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
        return 3.15
            * $timeFactor
            * (new \DateTime())->getTimestamp() - (new \DateTime('2000-1-1'))->getTimestamp();
    }
}
```

Me vienen algunas ideas interesantes:

* Mode y TimeFactor están estrechamente relacionadas. En realidad me están sugiriendo fuertemente introducir un Value Object enumerable que encapsule su comportamiento.
* Con Proposal me ocurre algo parecido, la lógica de su cálculo podría extraerse, como poco, a un servicio.
* Todos los escalares, de hecho, podrían modelarse con Value Objects.

Sin embargo sería importante deshacerse de la dependencia del reloj. Veamos por qué.

## Lidiando con una dependencia global

Lo suyo será ponerse un test para intentar entender lo que pasa. Para forzar la estrategia *impar*, podemos hacer que el `$averagePrice` inicial sea 1. `$timeFactor` será 2, pero el resultado del intervalo de tiempo es impredecible, así que esperamos un valor cualquiera y tiramos el test a ver qué pasa. 2 es tan bueno como cualquier otro.

```
Failed asserting that 9135629870.4 matches expected 2.
Expected :2
Actual   :9135629870.4
```

Con esto, ya debería estar claro que tenemos que hacer algo para controlar la dependencia. Pero, para entender mejor el problema, relanzaré el test:

```
Failed asserting that 9135630450.0 matches expected 2.
Expected :2
Actual   :9135630450
```

Se genera otro valor distinto (¡no se podía saber!). A esto nos referimos cuando hablamos de "no determinismo": no podemos predecir o calcular el resultado del algoritmo. Borramos este test para poder mantener los tests existentes en verde.

Otra cuestión es que es muy probable que la fecha incrustada de '2000-1-1' se refiera realmente al comienzo del año para que devuelva valores algo más razonables para nuestro ejemplo. Pero bueno, eso es otra cuestión.

El caso es que, del mismo modo que hemos extraído dependencias de colaboradores, esta también tendremos que sacarla e inyectarla, de tal modo que podamos reemplazarla por un doble de test u otra implementación que podamos controlar.

Así que vamos a ver cómo afrontar esto.

En último término lo que necesitamos en este cálculo es un valor que resulta del cálculo de la diferencia de fechas:

```php
    private function calculateOddProposal(int $timeFactor)
    {
        return 3.15
            * $timeFactor
            * (new \DateTime())->getTimestamp() - (new \DateTime('2000-1-1'))->getTimestamp();
    }
```


Podemos empezar extrayendo una variable que represente el intervalo:

```php
    private function calculateOddProposal(int $timeFactor)
    {
        $timeInterval = (new \DateTime())->getTimestamp() - (new \DateTime('2000-1-1'))->getTimestamp();
        return 3.15
            * $timeFactor
            * $timeInterval;
    }
```

También podemos extraerlo a un método privado para aislar la dependencia, como hemos anteriormente:

```php
    private function calculateOddProposal(int $timeFactor)
    {
        $timeInterval = $this->calculateTimeInterval();
        return 3.15
            * $timeFactor
            * $timeInterval;
    }

    protected function calculateTimeInterval(): int
    {
        return (new \DateTime())->getTimestamp() - (new \DateTime('2000-1-1'))->getTimestamp();
    }
```

Vamos a utilizar la estrategia de encapsular esta lógico en una dependencia inyectable. Lo que queremos es esto:

```php
    private function calculateOddProposal(int $timeFactor)
    {
        $timeInterval = $this->timeService->timeInterval();
        return 3.15
            * $timeFactor
            * $timeInterval;
    }
```

Y quedaría así:

```php
<?php

namespace Quotebot;

use MarketStudyVendor;
use Quotebot\Domain\ProposalPublisher;
use Quotebot\Domain\TimeService;
use Quotebot\Infrastructure\QuoteProposalPublisher;
use Quotebot\Infrastructure\SystemTimeService;

class BlogAuctionTask
{
    /** @var MarketStudyVendor */
    protected $marketDataRetriever;
    /**
     * @var ProposalPublisher|null
     */
    private $proposalPublisher;
    /**
     * @var TimeService
     */
    private $timeService;

    public function __construct(
        $marketDataRetriever = null,
        ?ProposalPublisher $proposalPublisher = null,
        ?TimeService $timeService = null
    )
    {
        $this->marketDataRetriever = $marketDataRetriever ?? new MarketStudyVendor();
        $this->proposalPublisher = $proposalPublisher ?? new QuoteProposalPublisher();
        $this->timeService = $timeService ?? new SystemTimeService();
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

La interfaz:

```php
<?php


namespace Quotebot\Domain;


interface TimeService
{
    public function timeInterval(): int;
}
```

La implementación del sistema, que encapsula el comportamiento actual:

```php
<?php


namespace Quotebot\Infrastructure;


use Quotebot\Domain\TimeService;

class SystemTimeService implements TimeService
{

    public function timeInterval(): int
    {
        return (new \DateTime())->getTimestamp() - (new \DateTime('2000-1-1'))->getTimestamp();
    }
}
```

Y el test transformado:

```php
<?php

namespace Quotebot;

use Generator;
use PHPUnit\Framework\TestCase;
use Quotebot\Domain\ProposalPublisher;
use Quotebot\Domain\TimeService;

class BlogAuctionTaskTest extends TestCase
{

    private $marketStudyVendor;
    private $proposalPublisher;
    private $timeService;
    private $blogAuctionTask;
    
    protected function setUp(): void
    {
        $this->marketStudyVendor = $this->createMock(\MarketStudyVendor::class);
        $this->proposalPublisher = $this->createMock(ProposalPublisher::class);
        $this->timeService = $this->createMock(TimeService::class);

        $this->blogAuctionTask = new BlogAuctionTask(
            $this->marketStudyVendor,
            $this->proposalPublisher,
            $this->timeService
        );
    }

    /** @dataProvider casesProvider */
    public function testShouldSendAProposal($averagePrice, $mode, $proposal): void
    {
        $this->givenAnAveragePrice($averagePrice);
        $this->thenAProposalIsSentOf($proposal);
        $this->whenIsPricedWIthMode($mode);
    }

    public function casesProvider(): Generator
    {
        yield 'Odd path basic calculation' =>  [0, 'SLOW', 6.28];
    }

    protected function givenAnAveragePrice($averagePrice): void
    {
        $this->marketStudyVendor
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

    protected function whenIsPricedWIthMode($mode): void
    {
        $this->blogAuctionTask->priceAndPublish('blog', $mode);
    }
}
```

Tenemos todos los tests en verde y el sistema funciona en producción.

Ahora es cuando podemos recuperar el test borrado, solo que esta vez ya podemos simular el comportamiento de TimeService. Por ejemplo, podemos usar el valor 1, dado que es el elemento neutro de la multiplicación, lo que nos permite `ignorarlo` en el test. De paso arreglamos algún *typo* que se ha colado.

```php
<?php

namespace Quotebot;

use Generator;
use PHPUnit\Framework\TestCase;
use Quotebot\Domain\ProposalPublisher;
use Quotebot\Domain\TimeService;

class BlogAuctionTaskTest extends TestCase
{

    private $marketStudyVendor;
    private $proposalPublisher;
    private $timeService;
    private $blogAuctionTask;

    protected function setUp(): void
    {
        $this->marketStudyVendor = $this->createMock(\MarketStudyVendor::class);
        $this->proposalPublisher = $this->createMock(ProposalPublisher::class);
        $this->timeService = $this->createMock(TimeService::class);

        $this->blogAuctionTask = new BlogAuctionTask(
            $this->marketStudyVendor,
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
        yield 'Odd path basic calculation' =>  [0, 'SLOW', 6.28];
        yield 'Even path basic calculation' => [1, 'SLOW', 6.30];
    }

    protected function givenAnAveragePrice($averagePrice): void
    {
        $this->marketStudyVendor
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

Y con este test ya hemos cubierto ambas variantes del cálculo. En esencia, hemos conseguido garantizar el comportamiento básico de la aplicación. Ya tenemos una red de seguridad para los cambios que todavía tenemos pendientes.

## Más inversión de dependencias

Un aspecto que todavía no está del todo resuelto es la dependencia de `MarketStudyVendor`. Vamos a invertirla para tenerla bajo nuestro control. Después empezaremos a ver cómo construir `BlogAuctionTask` en producción.

En primer lugar, vamos a extraer una interfaz a partir de `MarketStudyVendor`, de tal modo que podamos crear un adaptador. La interfaz se llamará `MarketDataRetriever`, algo sugerido por el código de `BlogAuctionTask`.

```php
<?php

namespace Quotebot\Domain;

interface MarketDataRetriever
{
    public function averagePrice(string $blog): float;
}
```

Ahora implementamos el adaptador:

```php
<?php


namespace Quotebot\Infrastructure;


use MarketStudyVendor;
use Quotebot\Domain\MarketDataRetriever;

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

    public function averagePrice(string $blog): float
    {
        return $this->marketStudyVendor->averagePrice($blog);
    }
}
```

Y cambiamos BlogAuctionTask y los tests para utilizarlo:

```php
<?php

namespace Quotebot;

use MarketStudyVendor;
use Quotebot\Domain\MarketDataRetriever;
use Quotebot\Domain\ProposalPublisher;
use Quotebot\Domain\TimeService;
use Quotebot\Infrastructure\QuoteProposalPublisher;
use Quotebot\Infrastructure\SystemTimeService;

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
        ?ProposalPublisher $proposalPublisher = null,
        ?TimeService $timeService = null
    )
    {
        $this->marketDataRetriever = $marketDataRetriever;
        $this->proposalPublisher = $proposalPublisher ?? new QuoteProposalPublisher();
        $this->timeService = $timeService ?? new SystemTimeService();
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

Pero también tenemos que hacer el cambio en producción. `AutomaticQuoteBot` tendrá que ser instanciado con `BlogAuctionTask`:

```php
<?php

namespace Quotebot;

class AutomaticQuoteBot
{
    private $blogAuctionTask;

    public function __construct(BlogAuctionTask $blogAuctionTask)
    {
        $this->blogAuctionTask = $blogAuctionTask;
    }

    public function sendAllQuotes(string $mode): void
    {
        $blogs = $this->getBlogs($mode);
        foreach ($blogs as $blog) {
            $this->blogAuctionTask->priceAndPublish($blog, $mode);
        }
    }

    protected function getBlogs(string $mode)
    {
        return AdSpace::getAdSpaces($mode);
    }
}
``` 

Y lo montamos todo en `Application`.

```php
<?php

namespace Quotebot;

use MarketStudyVendor;
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
        $marketDataRetriever = new VendorDataRetriever(new MarketStudyVendor());
        $blogAuctionTask = new BlogAuctionTask($marketDataRetriever);

        self::$bot = self::$bot ?? new AutomaticQuoteBot($blogAuctionTask);
        self::$bot->sendAllQuotes('FAST');
    }
}
```

En comparación con otros pasos anteriores, aquí hemos tenido que tocar bastantes archivos. Sin embargo, los tests siguen pasando y la aplicación funciona como es debido en producción.

El siguiente paso es montar `BlogAuctionTask` en producción. No es muy difícil ahora.

```php
<?php

namespace Quotebot;

use MarketStudyVendor;
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
        $marketDataRetriever = new VendorDataRetriever(new MarketStudyVendor());
        $proposalPublisher = new QuoteProposalPublisher();
        $timeService = new SystemTimeService();

        $blogAuctionTask = new BlogAuctionTask(
            $marketDataRetriever,
            $proposalPublisher,
            $timeService
        );

        self::$bot = self::$bot ?? new AutomaticQuoteBot($blogAuctionTask);
        self::$bot->sendAllQuotes('FAST');
    }
}
```

Con esto ya podemos quitar la instanciación dentro la clase y forzar la inyección de dependencias.

```php
<?php

namespace Quotebot;

use Quotebot\Domain\MarketDataRetriever;
use Quotebot\Domain\ProposalPublisher;
use Quotebot\Domain\TimeService;
use Quotebot\Infrastructure\QuoteProposalPublisher;
use Quotebot\Infrastructure\SystemTimeService;

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

## No se vayan todavía, aún hay más.

Ya que estamos, nos convendría extraer la dependencia de `AdSpace`, que es una especie de servicio que nos proporciona la lista de blogs y que, a su vez, tiene otra dependencia incrustada. Ya habíamos aislado la dependencia en un método privado de `AutomaticQuoteBot` para poder testearlo, así que ahora simplemente crearemos la interfaz y el adaptador para convertirlo en inyectable.

He aquí todas las piezas, empezando por la interfaz:

```php
<?php


namespace Quotebot\Domain;


interface AdSpaceProvider
{
    public function getSpaces();
}
```

La implementación:

```php
<?php


namespace Quotebot\Infrastructure;


use Quotebot\AdSpace;
use Quotebot\Domain\AdSpaceProvider;

class BlogAdSpaceProvider implements AdSpaceProvider
{

    public function getSpaces()
    {
        return AdSpace::getAdSpaces();
    }
}
```

El consumidor modificado:

```php
<?php

namespace Quotebot;

use Quotebot\Domain\AdSpaceProvider;

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

    public function sendAllQuotes(string $mode): void
    {
        $blogs = $this->getBlogs($mode);
        foreach ($blogs as $blog) {
            $this->blogAuctionTask->priceAndPublish($blog, $mode);
        }
    }

    protected function getBlogs(string $mode)
    {
        return $this->adSpaceProvider->getSpaces();
    }
}
```

La inyección:

```php
<?php

namespace Quotebot;

use MarketStudyVendor;
use Quotebot\Infrastructure\BlogAdSpaceProvider;
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
        $marketDataRetriever = new VendorDataRetriever(new MarketStudyVendor());
        $proposalPublisher = new QuoteProposalPublisher();
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

Y el test corregido de modo que ya no extendemos clases para test, sino que usamos `stubs`:

```php
<?php

namespace Tests\Quotebot;

use Quotebot\Application;
use Quotebot\AutomaticQuoteBot;
use Quotebot\BlogAuctionTask;
use PHPUnit\Framework\TestCase;
use Quotebot\Domain\AdSpaceProvider;
use Quotebot\Domain\ProposalPublisher;
use Quotebot\Domain\TimeService;

class QuoteBotAppTest extends TestCase
{
    public function testShouldRun(): void
    {
        $marketStudyVendor = $this->createMock(\MarketStudyVendor::class);
        $marketStudyVendor->method('averagePrice')->willReturn(0);

        $proposalPublisher = $this->createMock(ProposalPublisher::class);

        $blogAuctionTask = new BlogAuctionTask(
            $marketStudyVendor,
            $proposalPublisher,
            $timeService = $this->createMock(TimeService::class)
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

## Fin de la primera parte

Aunque todavía quedan algunas cosas pendientes en cuanto a estructura y organización de código, vamos a cerrar esta entrega aquí. Por ejemplo, una de las cuestiones que hay que resolver es la posibilidad de ejecutar la aplicación en local y mejorar algunas implementaciones de los adaptadores. 

Lo que hemos conseguido con el trabajo realizado es tener una aplicación testeable, hemos tomado control de las dependencias y hemos comenzado a entender la estructura del software, lo que nos ha permitido corregir algunos puntos y, en general, hemos podido ganar confianza en este código.

La próxima entrega tratará sobre todo de cómo construir un dominio rico y significativo.

{% include_relative series/legacy-under-control.md %}
