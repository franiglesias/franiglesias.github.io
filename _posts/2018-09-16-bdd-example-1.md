---
layout: post
title: Introducción a Behavior Driven Development en PHP (1)
categories: articles
tags: php bdd testing
---

Como desarrolladores nos gusta que las historias de usuario que definen nuestros Product Owners estén bien escritas, de modo que podamos implementar lo que se nos pide. Lo mejor de todo es que existe una herramienta conceptual y técnica para lograr eso.

Behavior Driven Development comenzó siendo una variedad de TDD que ponía el foco en el comportamiento de los sistemas de software para responder a las demandas del negocio. Sin embargo, ha evolucionado a lo que podríamos considerar una metodología de trabajo que permite establecer un diálogo entre negocio y el equipo de desarrollo

## El problema de qué testear, desde el punto de vista del equipo de desarrollo

¿Por dónde empezar a trabajar? Obviamente por un test.

Si tenemos una User Story bien definida, tendremos bastante claro qué comportamiento queremos obtener del software. Pero otra cosa muy distinta es el cómo vamos a lograrlo. Desde el exterior, nosotros vamos a ver un objeto (o varios) que nos ofrecerá cierta funcionalidad, y eso es exactamente lo que vamos a describir mediante un test. Sin embargo, ¿con qué objeto empezamos?

Esta vez, para crear nuestros tests vamos a adoptar un enfoque un poco diferente. Lo haremos practicando Behavior Driven Design o BDD y aprenderemos cómo eso nos lleva a encontrar un punto de partida.

Uno de las dificultades que tiene TDD es precisamente cómo empezar y qué testear. Es relativamente fácil si tenemos una cierta idea de qué unidades de software vamos a desarrollar. Pero se complica tremendamente en otras circunstancias. En especial, cuando las especificaciones no son técnicas, sino que son de negocio.

Desde el negocio es bastante fácil definir el comportamiento esperado de un software. Supongamos que trabajamos en una empresa que ofrece un servicio de limpieza doméstica. Un requisito de negocio será que los potenciales clientes puedan contratar el servicio y configurar los diversos aspectos, como la periodicidad y las tareas que desea que se realicen, para lo cual se calculará una cuota o presupuesto.

Traducir esto a un sistema de software no es trivial, y no es trivial el problema de responder a la pregunta: ¿por dónde empezamos? Y aquí es donde entra en juego el BDD.

## User Stories y *features*

Lo que negocio espera del software es que tenga unas ciertas prestaciones o **features**.

Siguiendo con el ejemplo anterior, una *feature* es que un cliente pueda contratar el servicio, pero también son *features* que pueda registrarse, que pueda configurar detalles del servicio contratado, que pueda pagarlo y un largo etcétera. También son *features* que un agente de servicio al cliente puede gestionar un caso, o que un comercial pueda realizar ofertas personalizadas o llevar un seguimiento de los contratos en vigor. Negocio decide qué *features* necesita el producto de software aunque no tenga ni idea de cómo lo vamos a implementar los desarrolladores.

El conjunto de *features* define el comportamiento del producto de software.

La mejor manera de definir una *feature* es mediante ejemplos o escenarios, describiendo qué se espera que haga el software en cada uno de ellos. La idea es utilizar ejemplos concretos de modo que se elimine la ambigüedad del lenguaje natural a la hora de describir cosas.

Es importante que las *features* sean, hasta cierto punto, autocontenidas (puedes pensar en el Single Responsibility Principle). Con esto quiero decir que describan unidades de comportamiento que no se mezclen con otras unidades. Puede que unas *features* dependan de otras, pero no deberían entrelazarse por decir así.

En nuestro ejemplo podemos considerar que para que un cliente contrate el servicio de limpieza primero debe registrase. Por tanto, registrarse como usuario de nuestra web y contratar un servicio serían *features* diferentes, pero para un usuario sería necesario estar registrado para poder contratar, por lo que la *feature* "contratar el servicio" sería dependiente de la de "registrarse como usuario".

Las *features* se describen en lenguaje natural y puede que te preguntes cómo traducir eso a un lenguaje más técnico o al menos cómo viajar de esa definición a la implementación y, así, poder desarrollar el software.

Esto se hace en dos grandes etapas:

* De la *feature* al test de aceptación
* Del test de aceptación a la especificación mediante ejemplos

## De la *feature* al test de aceptación

La descripción que hace negocio de las *features* que desea ver implementadas en el software se expresa en lenguaje natural en forma de Historias de Usuario. Esto tiene el inconveniente de que tales descripciones pueden resultar imprecisas y mal ordenadas. 

Para solventar eso se utiliza un formato de texto que proporciona una estructura útil con la que describir las *features* desde el punto de vista del negocio, a la vez que permite la concisión y precisión necesarias para que sean documentos útiles para el equipo de desarrollo.

Este formato es lo que se conoce como lenguaje **Gherkin**.

### El lenguaje Gherkin

Un documento Gherkin nos permite describir una *feature* mediante dos elementos principales:

* Una historia de usuario que describe quién está interesado en la *feature*, qué quiere poder hacer y qué beneficio espera obtener de ello. Este elemento nos habla del valor de la *feature* para negocio y nos ayuda a entender su relevancia y su prioridad.
* Una serie de escenarios que describen ejemplos de cómo debería funcionar la *feature*. Este elemento es el que especifica el comportamiento esperado del software y es nuestro objetivo como equipo de desarrollo.

El lenguaje Gherkin es muy sencillo. Consta de una serie de palabras clave que identifican cada uno de los enunciados de que consta la descripción de una *feature* en términos de negocio, los cuales se redactan siguiendo una determinada estructura. Gracias a esto, es fácil de aprender para cualquiera y permite que los expertos del dominio y los desarrolladores puedan escribirlos juntos.

Un documento Gherkin empieza declarando una determinada Feature:

```gherkin
Feature: Massively update product prices when needed
```

El contenido del archivo serán una serie de declaraciones y ejemplos de escenarios que describen esa *feature*.

Para empezar declaramos quién necesita o se beneficia de la *feature*, usando la clave **As**:

```gherkin
Feature: Massively update product prices when needed
  As a Sales Manager
```

A continuación se expresa en qué consiste a grandes rasgos la *feature*. La clave puede ser **I want to** o similar.

```gherkin
Feature: Massively update product prices when needed
  As Sales Manager
  I want to be able to massively update product prices
```

Por último, describimos el beneficio o resultado que se espera obtener:

```gherkin
Feature: Massively update product prices when needed
  As Sales Manager
  I want to be able to massively update product prices
  In order to invoice our customers with the latest prices
```

Como se puede ver, no hay referencias a ningún artefacto técnico ni se presupone ninguna implementación concreta. Esta introducción es necesaria para entender la *feature* y no tiene otro uso. Sin embargo, es crucial para entender por qué esa característica es importante para negocio y qué valor puede tener.

Con estas primeras líneas queda definida la *feature* en términos de negocio, pero como desarrolladores necesitamos más detalles acerca de cómo debería funcionar. Es cuando entran en juego los escenarios.

La estructura de los escenarios te sonará familiar: un escenario define un estado del sistema, una acción que se realiza sobre él y el output que esperamos obtener.

```gherkin
  Scenario: Update uploading a csv file with new prices
    Given There are current prices in the system
    And I have a file named "prices_update.csv" with the new prices
    When I upload the file
    Then Changes are applied to the current prices
```

La palabra clave que define los escenarios es **Scenario**, y lo que que sigue es su descripción en lenguaje natural, que sirve para identificar el escenario.

Lo que viene a continuación nos interesa más. Cada una de estas líneas es un **paso** del escenario:

**Given**: esta clave nos sirve para definir un estado conocido del sistema sobre el cual se va a aplicar una acción. Es necesario definir este estado inicial, para poder saber que la acción tiene el efecto esperado sobre él.

**And**: en este ejemplo, **And** es sinónimo de **Given**. En ocasiones necesitamos que establecer varias condiciones de partida. Podríamos poner simplemente varias sentencias **Given**, pero la redacción queda más natural si utilizamos la conjunción.

**When**: indica la acción que se aplicará para lograr un efecto en el sistema.

**Then**: indica el resultado que esperamos obtener al aplicar la acción.

Los escenarios así descritos definen tests de aceptación del software.

Gherkin tiene algunas características más, pero las vamos a dejar para otro momento ya que ahora nos interesa quedarnos con lo más básico.

### Ya tenemos la *feature*, ¿dónde están mis tests de aceptación?

Pero te preguntarás: ¿qué utilidad tiene como desarrollador este tipo de documento? Es cierto que puede ser una ayuda interesante a la hora de redactar las historias de usuario entre product owner y equipo de desarrollo, pero tenemos que escribir nuestros tests y, de todos modos, ¿cómo vamos a vincularlos con este documento?

Y ahí es donde entrar en juego herramientas como [Jbehave](https://jbehave.org), [Cucumber](https://cucumber.io) y, en PHP, [Behat](http://behat.org/en/latest/).

La misión de estas herramientas consiste en:

* Generar, a partir del diseño de la *feature* en lenguaje Gherkin, una plantilla de test en el lenguaje de programación que utilicemos.
* Vincular cada uno de los pasos del escenario con un método en el test.
* Ejecutar los tests y mostrar el resultado en los términos de la propia *feature*.

En resumidas cuentas, estas utilidades son analizadores de lenguaje Gherkin que identifican los distintos elementos que definen la *feature* y los vinculan automáticamente para que se ejecute el método del test correspondiente.

Esta vinculación se hace generalmente a través de expresiones regulares. En PHP, **Behat** hace esto permitiéndonos añadir una anotación a cada método del test. Esta anotación consiste es una expresión regular que encaja con una (o varias) de las líneas de definición del escenario,

Así que vamos a verlo en acción.

### Preparemos un proyecto para probar Behat

Creamos la carpeta del proyecto y nos situamos dentro:

``` bash
mkdir csvrepo
cd csvrepo
```

Dentro del proyecto vamos a crear las carpetas `src` y `test`

```bash
mkdir src
mkdir tests
```

Iniciamos el proyecto mediante `composer init` y como primera dependencia requerimos `PHPUnit`.

```bash
composer init
# Fill in with the data needed
composer require --dev PHPUnit/PHPUnit
```

También queremos tener `behat`.

```bash
composer require --dev behat/behat
```

Por último, configuraremos los namespaces del proyecto en `composer.json`, que quedará más o menos así:

```json
{
  "name": "talkingbit/csv_repo",
  "description": "A simple CSV reader",
  "minimum-stability": "dev",
  "license": "MIT",
  "type": "library",
  "config": {
    "bin-dir": "bin"
  },
  "authors": [
    {
      "name": "Fran Iglesias",
      "email": "franiglesiad@mac.com"
    }
  ],
  "require-dev": {
    "PHPUnit/PHPUnit": "^7.4@dev",
    "behat/behat": "^3.5@dev"
  },
  "autoload": {
    "psr-4": {
      "TalkingBit\\CSVRepo\\": "src/"
    }
  },
  "autoload-dev": {
    "psr-4": {
      "Tests\\TalkingBit\\CSVRepo\\": "tests/"
    }
  }
}
```

También hemos añadido la clave `config`, con `bin-dir`, de este modo, los paquetes como `PHPUnit` y `behat` crearán un alias de su ejecutable en la carpeta `bin`, con lo que podremos lanzarlos fácilmente con `bin/PHPUnit` y `bin/behat`, respectivamente.

Después de este cambio puedes hacer un `composer install` o un `composer dump-autoload`, para ponerte en marcha.

```bash
composer install
```

`PHPUnit` necesita un poco de configuración, así que vamos a prepararla ejecutando lo siguiente. Es un interactivo y normalmente nos servirán las respuestas por defecto.

```bash
bin/PHPUnit --generate-configuration
```

Esto generará un archivo de configuración por defecto `PHPUnit.xml` ([más información en este artículo](https://franiglesias.github.io/code-coverage-para-mejores-tests/)). Normalmente hago un pequeño cambio para poder tener medida de cobertura en cualquier código y no tener que pedir explícitamente en cada test, poniendo el parámetro `forceCoversAnnotation` a `false`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<PHPUnit xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:noNamespaceSchemaLocation="https://schema.PHPUnit.de/7.4/PHPUnit.xsd"
         bootstrap="vendor/autoload.php"
         forceCoversAnnotation="false"
         beStrictAboutCoversAnnotation="true"
         beStrictAboutOutputDuringTests="true"
         beStrictAboutTodoAnnotatedTests="true"
         verbose="true">
    <testsuites>
        <testsuite name="default">
            <directory suffix="Test.php">tests</directory>
        </testsuite>
    </testsuites>

    <filter>
        <whitelist processUncoveredFilesFromWhitelist="true">
            <directory suffix=".php">src</directory>
        </whitelist>
    </filter>
</PHPUnit>
```

Por último, iniciaremos `behat`, para que prepare la estructura de directorios que necesita, aunque podemos configurarla a nuestro gusto más adelante.

```bash
bin/behat --init
```

Y ahora añadimos el control de versiones:

```bash
git init
```

Y con esto, podemos empezar.

### Ahora sí, vamos a escribir código

Vamos a ver un ejemplo an acción. Supongamos que tenemos la *feature* definida así, en el archivo `features/massiveUpdate.feature`.

```gherkin
Feature: Massively update product prices when needed
  As Sales Manager
  I want to be able to massively update product prices
  In order to invoice our customers with the latest prices

  Scenario: Update uploading a csv file with new prices
    Given There are current prices in the system
    And I have a file named "prices_update.csv" with the new prices
    When I upload the file
    Then Changes are applied to the current prices
```

Ahora ejecutamos `behat`:

```bash
bin/behat
```

Con lo que obtenemos el siguiente resultado:

```
Feature: Massively update product prices when needed
  As Sales Manager
  I want to be able to massively update product prices
  In order to invoice our customers with the latest prices

  Scenario: Update uploading a csv file with new prices             # features/massiveUpdate.Feature:6
    Given There are current prices in the system
    And I have a file named "prices_update.csv" with the new prices
    When I upload the file
    Then Changes are applied to the current prices

1 scenario (1 undefined)
4 steps (4 undefined)
0m0.09s (7.02Mb)

 >> default suite has undefined steps. Please choose the context to generate snippets:

  [0] None
  [1] *feature*Context
 > 
```

Como se puede ver, las primeras líneas nos muestran la *feature* tal como la hemos escrito. El único cambio es un comentario en la línea de **Scenario**, que indica que se encuentra en la línea 6 del archivo.

Debajo nos informa de que hemos escrito 1 escenario y que ha detectado 4 pasos. Todos están sin definir, lo que quiere decir que no hay un test escrito que represente ninguno de los pasos y, consecuentemente, el escenario no se ejecuta.

Por último, nos pide que elijamos el contexto para generar los snippets de código necesarios, de modo que no los tengamos que escribir nosotros. La opción `[0] None` no hará nada, la opción `[1] *feature*Context` generará los snippets necesarios para añadirlos a la clase `*feature*Context` que se encuentra en el archivo `features/bootstrap/FeatureContext.php`.

Sin embargo, no los añadirá automáticamente, sino que los mostrará por pantalla, con lo cual podremos copiarlos y pegarlos a mano. En alguna ocasión tendremos que hacer esto, pero ahora mismo podemos aprender a generarlos de forma automática.

Para ello, volvemos a ejecutar `behat`, con la opción `--append-snippets`

```bash
bin/behat --append-snippets
```

Escogemos la opción 1 cuando nos lo pida y el resultado es:

```
Feature: Massively update product prices when needed
  As Sales Manager
  I want to be able to massively update product prices
  In order to invoice our customers with the latest prices

  Scenario: Update uploading a csv file with new prices             # features/massiveUpdate.Feature:6
    Given There are current prices in the system
    And I have a file named "prices_update.csv" with the new prices
    When I upload the file
    Then Changes are applied to the current prices

1 scenario (1 undefined)
4 steps (4 undefined)
0m0.01s (7.01Mb)

 >> default suite has undefined steps. Please choose the context to generate snippets:

  [0] None
  [1] *feature*Context
 > 1

u features/bootstrap/FeatureContext.php - `There are current prices in the system` definition added
u features/bootstrap/FeatureContext.php - `I have a file named "prices_update.csv" with the new prices` definition added
u features/bootstrap/FeatureContext.php - `I upload the file` definition added
u features/bootstrap/FeatureContext.php - `Changes are applied to the current prices` definition added
```

Si vamos a mirar el archivo `features/bootstrap/FeatureContext.php`, veremos que tiene lo siguiente:

```php
<?php

use Behat\Behat\Tester\Exception\PendingException;
use Behat\Behat\Context\Context;
use Behat\Gherkin\Node\PyStringNode;
use Behat\Gherkin\Node\TableNode;

/**
 * Defines application features from the specific context.
 */
class FeatureContext implements Context
{
    /**
     * Initializes context.
     *
     * Every scenario gets its own context instance.
     * You can also pass arbitrary arguments to the
     * context constructor through behat.yml.
     */
    public function __construct()
    {
    }

    /**
     * @Given There are current prices in the system
     */
    public function thereAreCurrentPricesInTheSystem()
    {
        throw new PendingException();
    }

    /**
     * @Given I have a file named :arg1 with the new prices
     */
    public function iHaveAFileNamedWithTheNewPrices($arg1)
    {
        throw new PendingException();
    }

    /**
     * @When I upload the file
     */
    public function iUploadTheFile()
    {
        throw new PendingException();
    }

    /**
     * @Then Changes are applied to the current prices
     */
    public function changesAreAppliedToTheCurrentPrices()
    {
        throw new PendingException();
    }
}
```

De momento, vamos a ejecutar el test:

```bash
bin/behat
```

Este es el resultado:

```
Feature: Massively update product prices when needed
  As Sales Manager
  I want to be able to massively update product prices
  In order to invoice our customers with the latest prices

  Scenario: Update uploading a csv file with new prices             # features/massiveUpdate.Feature:6
    Given There are current prices in the system                    # FeatureContext::thereAreCurrentPricesInTheSystem()
      TODO: write pending definition
    And I have a file named "prices_update.csv" with the new prices # FeatureContext::iHaveAFileNamedWithTheNewPrices()
    When I upload the file                                          # FeatureContext::iUploadTheFile()
    Then Changes are applied to the current prices                  # FeatureContext::changesAreAppliedToTheCurrentPrices()

1 scenario (1 pending)
4 steps (1 pending, 3 skipped)
0m0.03s (7.09Mb)
```

Ahora podemos ver que cada paso del escenario aparece asociada a un método de la clase `*feature*Context`. Esta clase equivale más o menos a un `TestCase` en `PHPUnit`, por mencionar un concepto que ya nos es familiar.

La línea **Given** aparece con un mensaje `TODO: write pending definition`. Esto nos está diciendo que tenemos que escribir algo en este método que, obviamente, debería consistir en poner el sistema en el estado indicado. En nuestro ejemplo, tal vez sea tener un repositorio de precios o productos con algún contenido representativo.

Si nos vamos al código de `*feature*Context.php` podremos ver lo siguiente:

```php
    /**
     * @Given There are current prices in the system
     */
    public function thereAreCurrentPricesInTheSystem()
    {
        throw new PendingException();
    }
```

La anotación `@Given` nos remite exactamente al primer paso del escenario. Cada vez que la expresión indicada encaja con algún paso de algún escenario se ejecutará el método `thereAreCurrentPricesInTheSystem`.

Modificando esa anotación para convertirla en una expresión regular podemos hacer que encaje con otras definiciones similares. Por ejemplo, la siguiente expresión nos encajará con 'There are current prices in the system' y con 'There are prices in the system' (para hacer una expresión regular añade los delimitadores de regexp '/' al principio y al final):

```php
    /**
     * @Given /There are (current )?prices in the system/
     */
    public function thereAreCurrentPricesInTheSystem()
    {
        throw new PendingException();
    }
```

Lo siguiente en lo que nos vamos a detener es en el cuerpo del método. En este caso simplemente lanza una excepción propia de `behat` llamada `PendingException` que se refleja en el resultado de la ejecución del test con el mensaje *TODO* que vimos antes.

Si pruebas a quitar esa excepción y lanzar de nuevo `behat`, verás que la utilidad da el test como pasado y nos indica que deberíamos implementar el siguiente paso. Esto también nos está diciendo que para hacer fallar el test de aceptación no tenemos más que lanzar una excepción.

Obviamente, la idea es que comencemos a escribir código para implementar este primer paso y no limitarnos a quitar la excepción sin escribir ningún código.

Por ejemplo, nosotros podríamos pensar que queremos tener esos precios en un repositorio de productos, así que escribimos algo así:

```php
<?php

use Behat\Behat\Tester\Exception\PendingException;
use Behat\Behat\Context\Context;
use Behat\Gherkin\Node\PyStringNode;
use Behat\Gherkin\Node\TableNode;

/**
 * Defines application features from the specific context.
 */
class FeatureContext implements Context
{
    private $productRepository;
    /**
     * Initializes context.
     *
     * Every scenario gets its own context instance.
     * You can also pass arbitrary arguments to the
     * context constructor through behat.yml.
     */
    public function __construct()
    {
        $this->productRepository = new ProductRepository();
    }

    /**
     * @Given /There are (current )?prices in the system/
     */
    public function thereAreCurrentPricesInTheSystem()
    {
        $this->productRepository->addProduct(new Product('Product 1', 15));
        $this->productRepository->addProduct(new Product('Product 2', 20));
    }

//...
```

Obviamente no tenemos escrita ninguna de estas clases por lo que al ejecutar el test veremos que falla.

```
Feature: Massively update product prices when needed
  As Sales Manager
  I want to be able to massively update product prices
  In order to invoice our customers with the latest prices


Fatal error: Uncaught Error: Class 'ProductRepository' not found in /Users/frankie/Sites/csvrepo/features/bootstrap/FeatureContext.php:23
```

Como podemos ver, estamos ya en modo TDD: tenemos tests que fallan y debemos escribir el mínimo código necesario para que pasen.

Por supuesto, podría ser que ya tuviésemos esas clases y previamente implementadas. En esa situación, nuestro primer paso habría sido cumplido y podríamos escribir el código necesario para pasar al siguiente.

En cualquier caso, nuestra tarea en este momento es escribir código para ejecutar todos los pasos. Volveremos a eso en un momento, pero antes vamos a fijarnos un detalle importante:

### Parametrizar los pasos

Nuestro segundo paso es 'And I have a file named "prices_update.csv" with the new prices'. Esto ha generado la definición siguiente:

```php
    /**
     * @Given I have a file named :arg1 with the new prices
     */
    public function iHaveAFileNamedWithTheNewPrices($arg1)
    {
        throw new PendingException();
    }
```

El texto entre comillas ha sido identificado por `behat` como un argumento para el paso. Es decir, que podríamos utilizar la misma definición cambiando el nombre de archivo para probar distintos escenarios o ejemplos.

El nombre de archivo ha sido sustituido por :arg en la anotación y el método `iHaveAFileNamedWithTheNewPrices`. `Behat` es capaz de identificar los textos entre comillas como argumentos, así como los números. Si queremos forzar que `behat` identifique un fragmento del paso como argumento no tenemos más que añadir el nombre del mismo con dos puntos en la expresión.

Del mismo modo, podemos mejorar la legibilidad de esta definición cambiando el nombre por defecto del argumento y añadiendo *type hinting*:

```php
    /**
     * @Given I have a file named :filename with the new prices
     */
    public function iHaveAFileNamedWithTheNewPrices(string $filename)
    {
        throw new PendingException();
    }
```

Y podemos probarlo (tendrás que eliminar o comentar el código del paso anterior para permitir a `behat` llegar hasta ese paso):

```php
    /**
     * @Given I have a file named :filename with the new prices
     */
    public function iHaveAFileNamedWithTheNewPrices(string $filename)
    {
        print($filename . PHP_EOL);
        throw new PendingException();
    }
```

#### El escenario completo

Nuestro escenario completo podría ser más o menos así. Lo explico después:

```php
<?php

use Behat\Behat\Tester\Exception\PendingException;
use Behat\Behat\Context\Context;
use Behat\Gherkin\Node\PyStringNode;
use Behat\Gherkin\Node\TableNode;

/**
 * Defines application features from the specific context.
 */
class FeatureContext implements Context
{
    private $productRepository;
    private $updatePricesFromUploadedFile;
    private $readCSVFile;
    private $filename;
    /**
     * Initializes context.
     *
     * Every scenario gets its own context instance.
     * You can also pass arbitrary arguments to the
     * context constructor through behat.yml.
     */
    public function __construct()
    {
        $this->productRepository = new ProductRepository();
        $this->readCSVFile = new ReadCSVFile();
        $this->updatePricesFromUploadedFile = new UpdatePricesFromUploadedFile(
            $this->productRepository,
            $this->readCSVFile
        );
    }

    /**
     * @Given /There are (current )?prices in the system/
     */
    public function thereAreCurrentPricesInTheSystem()
    {
        $this->productRepository->addProduct(new Product('Product 1', 15));
        $this->productRepository->addProduct(new Product('Product 2', 20));
    }

    /**
     * @Given I have a file named :filename with the new prices
     */
    public function iHaveAFileNamedWithTheNewPrices(string $filename)
    {
        $this->filename = '/var/tmp/'.$filename;
    }

    /**
     * @When I upload the file
     */
    public function iUploadTheFile()
    {
        $newPrices = <<<EOD
product,price
"Product 1",17
"Product 2",23
EOD;
        file_put_contents($this->filename, $newPrices);
        $request = new UpdatePricesFromUploadedFileRequest($this->filename);
        $this->updatePricesFromUploadedFile()->execute($request);
    }

    /**
     * @Then Changes are applied to the current prices
     */
    public function changesAreAppliedToTheCurrentPrices()
    {
        $product1 = $this->productRepository->getByName('Product 1');
        Assert::assertEquals(17, $product1->price());
        $product2 = $this->productRepository->getByName('Product 2');
        Assert::assertEquals(23, $product2->price());
    }
}
```

Nuestra posible solución a esta *feature* pasa por definir un UseCase (`UpdatePricesFromUploadedFile`) que utilizará un repositorio (`ProductRepository`), así como un servicio para leer el archivo CSV (`ReadCSVFile`).

Ahora mismo nuestro test de aceptación no pasará, puesto que no tenemos definidos ningunos de los actores que intervienen en la *feature*. Eso es algo que veremos en la próxima entrega. Pero antes, me gustaría llamar la atención sobre el último paso.

### Cómo saber que el test pasa

El último paso queda definido así:

```php
    /**
     * @Then Changes are applied to the current prices
     */
    public function changesAreAppliedToTheCurrentPrices()
    {
        $product1 = $this->productRepository->getByName('Product 1');
        Assert::assertEquals(17, $product1->price());
        
        $product2 = $this->productRepository->getByName('Product 2');
        Assert::assertEquals(23, $product2->price());
    }
```

La mejor manera de saber si los precios se han actualizado es comprobar que el precio de los productos tras realizar la actualización ha cambiado al indicado en el archivo.

Una buena forma de hacer esto es aprovechar las *Asserts* de `PHPUnit` pues si fallan lanzarán una excepción que, como hemos visto, es la manera que tiene `behat` de hacer que los pasos del escenario fallen. En caso de pasar, nuestras líneas aparecerán en verde y, cuando todas lo hagan, tanto negocio como nosotros estaremos contentos.

Pero nos queda bastante trabajo por hacer.

### Del test de aceptación a la especificación mediante ejemplos

Tenemos un test de aceptación que falla porque realmente no tenemos ninguna funcionalidad implementada. Sin embargo, ya hemos tomado algunas decisiones de diseño y ya empezamos a tener una idea de qué es lo que necesitamos escribir. Ya no partimos de cero, sino que tenemos un objetivo definido.

En nuestra próxima entrega veremos cómo seguir adelante, moviéndonos desde el test de aceptación al nivel unitario con herramientas BDD, recurriendo a `PHPSpec`, [del cual ya hemos hablado alguna vez en este blog](/katando-PHPSpec-1).

Así que [nos vemos dentro de unos días aquí mismo](/bdd-example-2) :-)

## Referencias

[Dan North: Introducing BDD](https://dannorth.net/introducing-bdd/)  
[Dan North: What's in a story?](https://dannorth.net/whats-in-a-story/)  
[Behat](http://behat.org/en/latest/)
[Cucumber backgrounder](https://github.com/cucumber/cucumber/wiki/Cucumber-Backgrounder)   
[Ryan Wilcox: Your Boss Won't Appreciate TDD: Try This Behavior-Driven Development Example](https://www.toptal.com/freelance/your-boss-won-t-appreciate-tdd-try-bdd)
[Javier Garzas: Entendiendo que es BDD](http://www.javiergarzas.com/2014/12/bdd-behavior-driven-development-1.html)


