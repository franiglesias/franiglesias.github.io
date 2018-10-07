---
layout: post
title: Introducción a Behavior Driven Development en PHP (2)
categories: articles
tags: php bdd testing
---

En el [artículo anterior](/bdd-example-1) comenzamos introduciendo el concepto de BDD, el lenguaje Gherkin y la herramienta Behat. Al final del mismo, nos habíamos quedado con una feature escrita en Gherkin y un test de aceptación vinculado fallando.

Antes de continuar me gustaría puntualizar algunas cosas cuya ausencia podríais haber notado.

## Hagamos un inciso

**Qué hay de los tests de navegador**. Muchas personas sabéis que es frecuente hacer tests de navegador con ayuda de estas herramientas ya que es el modo en que el usuario va a interactuar con la aplicación. En su lugar he planteado un test más centrado en el *backend*. Primero porque es un terreno más familiar para mi, pero también me parece que es más fácil entender el funcionamiento del ecosistema BDD sin introducir dificultades extras, como es instalar, configurar y hacer funcionar el navegador de test.

Sin embargo, mi plan es cubrir ese tipo de pruebas más adelante. 

**Tests de integración con Behat**. Con relación a lo anterior, decir que es perfectamente válido utilizar Gherkin y Behat para plantear tests de integración de esta forma. Asumo que en cada equipo de desarrollo y en cada proyecto las cosas pueden ser distintas pero en mi caso esta aproximación sería suficiente en la mayor parte de ocasiones.

**¿Esta cosa es configurable?** Bajando a aspectos más prácticos, todavía no me parado en introducir los detalles de configuración de Behat. Con toda razón habrá quien se pregunte si no es posible guardar los archivos en otra parte o generar más tests que el `FeatureContext` que se crea por defecto. Por supuesto que es posible personalizar la herramienta pero, de nuevo, me ha parecido más fácil centrarnos en entender bien el flujo de trabajo antes de tratar de personalizarlo sin saber por qué o para qué.

**¿Otro entorno de test? ¿Tengo que aprender phpspec?** En la entrega anterior mencioné que usaríamos **phpspec** para la siguiente fase de desarrollo BDD. Sin embargo, no es estrictamente necesario ya que con **phpunit** podemos desarrollar el mismo tipo de test, aunque nos exige algo más de disciplina. Como ya he comentado anteriormente, y la documentación de **phpspec** insiste, se trata de un framework de test con opiniones muy marcadas acerca de cómo deberías programar.

PHPspec impone muchas restricciones que son buenas para forzarnos a respetar los principios de diseño y construir un código desacoplado y sostenible guiados por ejemplos. 

Y con esto, termina este inciso y volvemos al trabajo.

## Recuperando el hilo

El artículo anterior finalizaba con un test que planteaba una solución posible a nuestra *Feature*. Tal como estaba, tendría mucho sentido en una situación en la cual ya tuviésemos algunos elementos implementados, como el repositorio de productos y el lector de CSV. Eso nos permitiría centrarnos en el desarrollo del *Use Case* `UpdatePricesFromUploadedFile`.

Pero vamos a intentar algo un poco más difícil, vamos a suponer que se trata de una feature completamente nueva. Así que tiramos lo que tenemos del artículo anterior y comenzamos con un `FeatureContext` recién sacado de `behat`.

Y, para complicarlo un poco más, nos damos cuenta de que la *feature* no está completamente definida y tenemos que profundizar más en ella con negocio.

## Ampliando la feature

En el diálogo entre negocio y desarrollo normalmente surgirán los escenarios más comunes, incluyendo los escenarios en los que las cosas no acaban bien. La definición de una *feature* debe incluir tanto los *happy paths*, como diversos *sad paths*.

Sin embargo, la visión desde negocio no es la misma que desde desarrollo. La definición de la feature no debería incluir elementos técnicos que presupongan una cierta implementación, los cuales, sin embargo, habrá que desarrollar y testear a través de la especificación.

Por ejemplo. Desde el punto de vista de desarrollador se nos pueden ocurrir varios motivos por los que la *feature* en la que estamos trabajando pueda funcionar mal:

* El usuario aporta un archivo que no es válido.
* Falla la comunicación en algún momento y no se puede subir al sistema.
* Hay algún error que impide que el archivo se pueda utilizar.
* El sistema de almacenamiento se satura e impide realizar la operación.
* Otras razones técnicas.

Negocio, sin embargo, vería probablemente lo siguiente:

* Se ha subido el archivo equivocado (error del usuario).
* Algo no funciona a nivel técnico (error del sistema).

Por la tanto, añadiríamos estos dos escenarios a la *feature*: uno en el que el usuario sube un archivo que no vale y otro en el que el sistema falla, indicando en ambos cómo se espera informar al usuario de lo que ha pasado y qué puede hacer.

Sin embargo, al desarrollar tendremos de contemplar las diferentes causas de fallo para poder detectarlas e implementar las medidas adecuadas para gestionarlas.

### Añadir nuevos escenarios a una feature

Para añadir nuevos escenarios a una feature no tenemos más que ir al documento Gherkin correspondiente y añadirlos. En nuestro caso, podría quedar así:

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
    
  Scenario: Update fails because an invalid file
    Given There are current prices in the system
    And I have a file named "invalid_data.csv" with invalid data
    When I upload the file
    Then A message is shown explaining the problem
    And Changes are not applied to the current prices

  Scenario: Update fails because a system error
    Given There are current prices in the system
    And I have a file named "prices_update.csv" with the new prices
    When I upload the file
    And There is an error in the system
    Then A message is shown explaining the problem
    And Changes are not applied to the current prices
```

Vamos a fijarnos en algunos detalles:

* La estructura de cada escenario es siempre la misma, con secciones para **Given**, **When** y **Then**.
* La clave **And** se utiliza como sinónimo de la sección en la que aparece, lo que facilita la lectura.
* Hemos procurado repetir la formulación de los pasos en la medida de lo posible. Por lo general, muchos pasos podrán reutilizarse, pero para eso necesitamos que puedan ser encontrados por la misma expresión regular asociada a cada definición en la clase **FeatureContext**. Opcionalmente, podemos controlar eso en la definición de los pasos, introduciendo expresiones regulares capaces de capturar pasos redactados de forma ligeramente diferente.

¿Qué nos toca hacer ahora? Tendríamos que escribir las definiciones necesarias en `FeatureContext` para cubrir todos los nuevos pasos que componen el escenario. Pero también podemos dejar que sea `behat` quien lo haga. Sin embargo, primero eliminaré FeatureContext, de modo que Behat pueda regenerarlo.

```bash
rm features/bootstrap/FeatureContext.php
bin/behat init
bin/behat --append-snippets
```

He aquí el resultado final:

```
Feature: Massively update product prices when needed
  As Sales Manager
  I want to be able to massively update product prices
  In order to invoice our customers with the latest prices

  Scenario: Update uploading a csv file with new prices             # features/massiveUpdate.feature:6
    Given There are current prices in the system                    # FeatureContext::thereAreCurrentPricesInTheSystem()
    And I have a file named "prices_update.csv" with the new prices # FeatureContext::iHaveAFileNamedWithTheNewPrices()
    When I upload the file                                          # FeatureContext::iUploadTheFile()
    Then Changes are applied to the current prices                  # FeatureContext::changesAreAppliedToTheCurrentPrices()

  Scenario: Update fails because an invalid file                 # features/massiveUpdate.feature:12
    Given There are current prices in the system                 # FeatureContext::thereAreCurrentPricesInTheSystem()
    And I have a file named "invalid_data.csv" with invalid data
    When I upload the file                                       # FeatureContext::iUploadTheFile()
    Then A message is shown explaining the problem
    And Changes are not applied to the current prices

  Scenario: Update fails because a system error                     # features/massiveUpdate.feature:19
    Given There are current prices in the system                    # FeatureContext::thereAreCurrentPricesInTheSystem()
    And I have a file named "prices_update.csv" with the new prices # FeatureContext::iHaveAFileNamedWithTheNewPrices()
    When I upload the file                                          # FeatureContext::iUploadTheFile()
    And There is an error in the system
    Then A message is shown explaining the problem
    And Changes are not applied to the current prices

3 scenarios (1 passed, 2 undefined)
15 steps (8 passed, 6 undefined, 1 skipped)
0m0.13s (7.11Mb)

 >> default suite has undefined steps. Please choose the context to generate snippets:

  [0] None
  [1] FeatureContext
 > 1
```

Y nos informa de que se han creado estos pasos:

```
u features/bootstrap/FeatureContext.php - `I have a file named "invalid_data.csv" with invalid data` definition added
u features/bootstrap/FeatureContext.php - `A message is shown explaining the problem` definition added
u features/bootstrap/FeatureContext.php - `Changes are not applied to the current prices` definition added
u features/bootstrap/FeatureContext.php - `There is an error in the system` definition added
```

FeatureContext ha quedado así:

```
<?php

use Behat\Behat\Context\Context;
use Behat\Behat\Tester\Exception\PendingException;

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

    /**
     * @Given I have a file named :arg1 with invalid data
     */
    public function iHaveAFileNamedWithInvalidData($arg1)
    {
        throw new PendingException();
    }

    /**
     * @Then A message is shown explaining the problem
     */
    public function aMessageIsShownExplainingTheProblem()
    {
        throw new PendingException();
    }

    /**
     * @Then Changes are not applied to the current prices
     */
    public function changesAreNotAppliedToTheCurrentPrices()
    {
        throw new PendingException();
    }

    /**
     * @When There is an error in the system
     */
    public function thereIsAnErrorInTheSystem()
    {
        throw new PendingException();
    }
}

```

Si lo ejecutamos behat…

```
bin/behat
```

este será el resultado:

```
Feature: Massively update product prices when needed
  As Sales Manager
  I want to be able to massively update product prices
  In order to invoice our customers with the latest prices

  Scenario: Update uploading a csv file with new prices             # features/massiveUpdate.feature:6
    Given There are current prices in the system                    # FeatureContext::thereAreCurrentPricesInTheSystem()
      TODO: write pending definition
    And I have a file named "prices_update.csv" with the new prices # FeatureContext::iHaveAFileNamedWithTheNewPrices()
    When I upload the file                                          # FeatureContext::iUploadTheFile()
    Then Changes are applied to the current prices                  # FeatureContext::changesAreAppliedToTheCurrentPrices()

  Scenario: Update fails because an invalid file                 # features/massiveUpdate.feature:12
    Given There are current prices in the system                 # FeatureContext::thereAreCurrentPricesInTheSystem()
      TODO: write pending definition
    And I have a file named "invalid_data.csv" with invalid data # FeatureContext::iHaveAFileNamedWithInvalidData()
    When I upload the file                                       # FeatureContext::iUploadTheFile()
    Then A message is shown explaining the problem               # FeatureContext::aMessageIsShownExplainingTheProblem()
    And Changes are not applied to the current prices            # FeatureContext::changesAreNotAppliedToTheCurrentPrices()

  Scenario: Update fails because a system error                     # features/massiveUpdate.feature:19
    Given There are current prices in the system                    # FeatureContext::thereAreCurrentPricesInTheSystem()
      TODO: write pending definition
    And I have a file named "prices_update.csv" with the new prices # FeatureContext::iHaveAFileNamedWithTheNewPrices()
    When I upload the file                                          # FeatureContext::iUploadTheFile()
    And There is an error in the system                             # FeatureContext::thereIsAnErrorInTheSystem()
    Then A message is shown explaining the problem                  # FeatureContext::aMessageIsShownExplainingTheProblem()
    And Changes are not applied to the current prices               # FeatureContext::changesAreNotAppliedToTheCurrentPrices()

3 scenarios (3 pending)
15 steps (3 pending, 12 skipped)
0m0.04s (7.11Mb)
```


## A vueltas con el test de aceptación

Tenemos un primer test que nos dice que no hay nada implementado, así que tenemos que empezar a pensar en añadir código. Un posible planteamiento es pensar que esta *Feature* se reflejaría en un *Use Case*.

Nuestro *Use Case* provocará un efecto en el sistema, modificando su estado. Posiblemente necesitará colaboradores, pero no queremos ocuparnos de eso ahora. Ya veremos lo que necesita.

El *Use Case* tendrá como nombre, al menos de momento, `UpdatePricesFromUploadedFile` lo que refleja bastante bien la *Feature* que estamos desarrollando. Como hemos decidido no ocuparnos de los colaboradores, vamos a empezar a escribir nuestro test de aceptación implementando los pasos en los que `UpdatePricesFromUploadedFile` tiene una intervención directa, que serán los pasos **When**. 

Esta es mi primera aproximación:

```php
<?php

use Behat\Behat\Context\Context;
use Behat\Behat\Tester\Exception\PendingException;

/**
 * Defines application features from the specific context.
 */
class FeatureContext implements Context
{
    /** @var string */
    private $pathToFile;
    /** @var UpdatePricesFromUploadedFile */
    private $updatePricesFromUploadedFile;

    /**
     * Initializes context.
     *
     * Every scenario gets its own context instance.
     * You can also pass arbitrary arguments to the
     * context constructor through behat.yml.
     */
    public function __construct()
    {
        $this->updatePricesFromUploadedFile = new UpdatePricesFromUploadedFile();
    }

    /**
     * @Given There are current prices in the system
     */
    public function thereAreCurrentPricesInTheSystem()
    {
        throw new PendingException();
    }

    /**
     * @Given I have a file named :pathToFile with the new prices
     */
    public function iHaveAFileNamedWithTheNewPrices(string $pathToFile)
    {
        throw new PendingException();
    }

    /**
     * @When I upload the file
     */
    public function iUploadTheFile()
    {
        $this->updatePricesFromUploadedFile->usingFile($this->pathToFile);
    }

    /**
     * @Then Changes are applied to the current prices
     */
    public function changesAreAppliedToTheCurrentPrices()
    {
        throw new PendingException();
    }

    /**
     * @Given I have a file named :pathToFile with invalid data
     */
    public function iHaveAFileNamedWithInvalidData(string $pathToFile)
    {
        throw new PendingException();
    }

    /**
     * @Then A message is shown explaining the problem
     */
    public function aMessageIsShownExplainingTheProblem()
    {
        throw new PendingException();
    }

    /**
     * @Then Changes are not applied to the current prices
     */
    public function changesAreNotAppliedToTheCurrentPrices()
    {
        throw new PendingException();
    }

    /**
     * @When There is an error in the system
     */
    public function thereIsAnErrorInTheSystem()
    {
        throw new PendingException();
    }
}
```

Si ejecuto `behat` la feature fallará puesto que no existe el *Use Case*, sin embargo me gustaría fijarme en un par de puntos antes de seguir adelante:

* He inicializado el *Use Case* en el constructor de `FeatureContext` que es justamente el lugar más adecuado para inicializar elementos que necesiten ser usados en varios lugares. `FeatureContext` no deja de ser una clase como otra cualquiera.
* He supuesto que el *Use Case* se usará con el método `usingFile`, que todavía no existe y al que se le pasa como parámetro `$this->filePath`. Esto es así porque el paso en el que la feature Gherkin "pasa" ese parámetro es otro diferente, por lo que usamos propiedades como forma de poder recoger elementos en un paso y utilizarlos en otro. Ya volveremos luego a ese punto.

De momento, para poder avanzar algo con el test, necesitamos tener un `UpdatePricesFromUploadedFile` mínimo con el que poder trabajar.

Por lo que, ahora sí:

## Del test de aceptación a la especificación mediante ejemplos

Tenemos el test de aceptación (bueno, tenemos parte del test de aceptación), pero pretendemos ejecutarlo con elementos que no existen todavía. Podríamos empezar a escribir código sin más, pero queremos ser más rigurosos y desarrollar las clases implicadas mediante TDD sin salirnos del enfoque BDD.

Para ello usaremos una metodología conocida como **especificación mediante ejemplos**.

Los tests tradicionales suelen tener un lenguaje aseverativo: el código hace algo y el test certifica que lo hace. 

Los tests BDD tienen un lenguaje más descriptivo e incluso desiderativo y suelen nombrarse con la fórmula "debería" (should...) porque se definen como una descripción del comportamiento que se espera de ese objeto en una situación dada.

Este tipo de tests se pueden crear en **phpunit** con un poco de disciplina, pero contamos con una herramienta diseñada específicamente para ello que es **phpspec**. Hagamos una pausa para instalarla:

### Añadiendo phpspec al proyecto

Requerimos `phpspec` mediante `composer` para incluirlo en nuestras dependencias de desarrollo.

```bash
composer require --dev phpspec/phpspec
```

Nuestro composer.json necesitará la adición de una clave para autoload PSR-0:

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
    "phpunit/phpunit": "^7.4@dev",
    "behat/behat": "^3.5@dev",
    "phpspec/phpspec": "^5.0@dev"
  },
  "autoload": {
    "psr-4": {
      "TalkingBit\\BddExample\\": "src/"
    }
  },
  "autoload-dev": {
    "psr-0": {
      "": "src/"
    },
    "psr-4": {
      "Tests\\TalkingBit\\BddExample\\": "tests/"
    }
  }
}
```

Al igual que con **Behat**, de momento no nos vamos a preocupar de los detalles de configuración pues para empezar ya nos va bien con su comportamiento por defecto. Excepto por una cosa: el informe.

### Embelleciendo el informe del test

Aunque el reporte por omisión del phpspec funciona bien por lo general, queda muy mal si la presentación del mismo es en monocromática como en este artículo, por lo que para tener un mejor visión de lo que ocurre con nuestra especificación vamos a cambiar su formato con esta opción:

```bash
bin/phpspec run --format pretty
```

La cual podemos fijar como opción por defecto mediante un archivo de configuración `phpspec.yml` que se sitúa en la raíz del proyecto y que más adelante usaremos para añadir más opciones:

```yaml
formatter.name: pretty
```

De esta manera es más fácil saber qué ocurre, como se puede ver en este ejemplo:

```
      TalkingBit\BddExample\UpdatePricesFromUploadedFile

  11  ✔ is initializable (94ms)
  16  ✔ should receieve a path to a file
  21  ✔ should fail if empty path


1 specs
3 examples (3 passed)
97ms
```

Hay varios formatos de reporte, así que puedes escoger el que más útil te resulte.

### Nuestro primer ejemplo

El núcleo de la feature que vamos a desarrollar es el *Use Case* llamado `UpdatePricesFromUploadedFile`.

`UpdatePricesFromUploadedFile` será el responsable de realizar la *feature* y podemos intuir que necesitará ayuda. Incluso, por experiencia, podemos tener una idea bastante clara de cómo debería montarse el sistema. En ese sentido, nuestro planteamiento es correcto. Pero, en lugar de entrar en detalles de cómo deben funcionar los colaboradores, lo que vamos a  hacer es dejar que sea el diseño de `UpdatePricesFromUploadedFile` el que nos lleve a cómo deberían funcionar cuando los necesitemos.

Así que empezamos por *describir* el comportamiento de nuestro *Use Case*:

```bash
bin/phpspec describe 'TalkingBit\BddExample\UpdatePricesFromUploadedFile'
```

En este ejemplo he preferido usar la notación de namespace, que debe ir entre comillas para que la utilidad pueda procesarla correctamente.

La línea anterior produce la respuesta siguiente:

```
Specification for TalkingBit\BddExample\UpdatePricesFromUploadedFile created in /Users/frankie/Sites/csvrepo/spec/TalkingBit/BddExample/UpdatePricesFromUploadedFileSpec.php.
```

Y genera este archivo en la carpeta del proyecto con nombre `spec`:

```php
<?php

namespace spec\TalkingBit\BddExample;

use TalkingBit\BddExample\UpdatePricesFromUploadedFile;
use PhpSpec\ObjectBehavior;
use Prophecy\Argument;

class UpdatePricesFromUploadedFileSpec extends ObjectBehavior
{
    function it_is_initializable()
    {
        $this->shouldHaveType(UpdatePricesFromUploadedFile::class);
    }
}
```

Tenemos nuestro primer test, o mejor dicho: nuestra primera Spec con su primer ejemplo.

Vamos a ver qué pasa haciéndola funcionar:

```bash
bin/phpspec run
```

Pues pasa que el primer ejemplo no se cumple. O dicho en otros términos tenemos un primer test que falla, en realidad está roto porque todavía no está implementada la clase.

Lo bueno es que `phpspec` nos dice por qué falla y nos ofrece una solución.

```

      TalkingBit\BddExample\UpdatePricesFromUploadedFile

  11  ! is initializable (102ms)
        class TalkingBit\BddExample\UpdatePricesFromUploadedFile does not exist.

----  broken examples

        TalkingBit/BddExample/UpdatePricesFromUploadedFile
  11  ! is initializable (102ms)
        class TalkingBit\BddExample\UpdatePricesFromUploadedFile does not exist.


1 specs
1 examples (1 broken)
105ms
                                                                                
  Do you want me to create                                                      
  `TalkingBit\BddExample\UpdatePricesFromUploadedFile` for you?                 
                                                                         [Y/n] 

```

Respondemos que sí pulsando la tecla `y`, lo que da lugar a la siguiente respuesta:

```
Class TalkingBit\BddExample\UpdatePricesFromUploadedFile created in /Users/frankie/Sites/csvrepo/src/TalkingBit/BddExample/UpdatePricesFromUploadedFile.php.


      TalkingBit\BddExample\UpdatePricesFromUploadedFile

  11  ✔ is initializable (84ms)


1 specs
1 examples (1 passed)
85ms
```

Se muestran las estadísticas de la ejecución del test, que ahora pasa ya que se ha creado un archivo con una definición básica de la clase, que ahora ya es inicializable (¡yuhu!):

```php
<?php

namespace TalkingBit\BddExample;

class UpdatePricesFromUploadedFile
{
}

```

No es que sea una clase con mucho contenido, pero ya nos vale para hacer funcionar el test de aceptación. ¿Lo probamos? Sólo tenemos que añadir la siguiente línea a FeatureContext:

```php
use TalkingBit\BddExample\UpdatePricesFromUploadedFile;
```

Y ejecutar `behat`:

```
bin/behat
```

Ahora el test se puede ejecutar, aunque todavía no es útil ya que nos quedan varios pasos por implementar (para empezar todos los **Given**, lo que nos mantiene detenidos todos los escenarios al principio). Sin embargo, todavía no podemos hacerlo, pues no tenemos ni idea de cómo.

Sigamos profundizando en la especificación.

## Anatomía de la especificación por ejemplos

La especificación anterior es la base para definir el comportamiento del *Use Case* que vamos a desarrollar.

`phpspec` genera un primer ejemplo muy simple: que se pueda inicializar el objeto cuyo comportamiento describimos.

`$this` es un proxy al objeto. No tenemos que instanciarlo aunque, como veremos, es posible inicializarlo de una manera determinada para describir un ejemplo específico o para todos en general. Lo veremos en su momento.

La cuestión ahora es que debemos describir cómo queremos que se comporte este objeto o cómo queremos usarlo.

En este caso sigue un patrón Comando y, como tal, provoca un efecto en el sistema, como es leer un archivo y actualizar una tabla de precios. Si se encuentra con algún problema para realizar esta tarea fallará (lanzando una excepción). En cambio, si la ejecuta no comunicará nada: 'no news are good news', tendremos que examinar su efecto en el sistema.

Para ello el *Use Case* necesita saber la ubicación del archivo y la de la tabla de precios. La primera la conocerá en el momento de ejecutarse, mientras que la segunda la sabrá a priori porque estará en un lugar determinado del sistema.

Esto nos da alguna pista:

* La tabla de precios es un conocimiento que debería recibir al construirse.
* La ubicación del archivo es un conocimiento que recibirá al ejecutarse.

Nos vamos a centrar en este segundo punto: lo que nos dice esto es que el *Use Case* `UpdatePricesFromUploadedFile` tendrá un método que recibirá como parámetro el nombre del archivo.

Vamos a describir este comportamiento escribiendo un ejemplo de cómo podríamos querer usarlo:

```php
<?php

namespace spec\TalkingBit\BddExample;

use TalkingBit\BddExample\UpdatePricesFromUploadedFile;
use PhpSpec\ObjectBehavior;
use Prophecy\Argument;

class UpdatePricesFromUploadedFileSpec extends ObjectBehavior
{
    function it_is_initializable()
    {
        $this->shouldHaveType(UpdatePricesFromUploadedFile::class);
    }

    function it_should_receieve_a_path_to_a_file()
    {
        $this->usingFile('/var/tmp/new_prices.csv');
    }
}
```

Como primera cosa a destacar, señalar que los ejemplos se escriben comenzando por `it_` o `its_` (de forma similar a como los test en `phpunit` se escriben comenzando por `test`). Además los nombres se escriben con *underscore* o *snake-case*. Esto va contra las recomendaciones de PSR, pero creo que podremos lidiar con ello.

No esperamos que este método retorne nada, sólo que exista, así que si ejecutamos nos dará un fallo. De nuevo, además de las estadísticas y resultados del test, nos indica que el problema es que no existe el método y nos ofrece crearlo.

```

      TalkingBit\BddExample\UpdatePricesFromUploadedFile

  11  ✔ is initializable (85ms)
  16  ! should receieve a path to a file
        method TalkingBit\BddExample\UpdatePricesFromUploadedFile::usingFile not found.

----  broken examples

        TalkingBit/BddExample/UpdatePricesFromUploadedFile
  16  ! should receieve a path to a file
        method TalkingBit\BddExample\UpdatePricesFromUploadedFile::usingFile not found.


1 specs
2 examples (1 passed, 1 broken)
106ms
                                                                                
  Do you want me to create                                                      
  `TalkingBit\BddExample\UpdatePricesFromUploadedFile::usingFile()` for you?    
                                                                         [Y/n] 
```

Si aceptamos, veremos que se añade el método `usingFile` a la clase correspondiente.

```php
<?php

namespace TalkingBit\BddExample;

class UpdatePricesFromUploadedFile
{
    public function usingFile($argument1)
    {
        // TODO: write logic here
    }
}
```

Y estamos otra vez en verde. 

```

      TalkingBit\BddExample\UpdatePricesFromUploadedFile

  11  ✔ is initializable (168ms)
  16  ✔ should receieve a path to a file


1 specs
2 examples (2 passed)
170ms
```

Es momento de refactorizar y cambiar el nombre genérico del argumento a uno más expresivo, manteniendo los tests pasando.

```php
<?php

namespace TalkingBit\BddExample;

class UpdatePricesFromUploadedFile
{
    public function usingFile(string $pathToFile)
    {
        // TODO: write logic here
    }
}
```

Resulta curioso testear sobre algo que no devuelve nada, ¿verdad?

Pero hay circunstancias que producen un efecto visible. Supongamos que el path que recibe nuestro *Use Case* está vacío, o que el archivo no contenga datos o estén en un formato ilegible o inválido. Parece lógico que falle arrojando una excepción.

### Describiendo lo que puede salir mal

Empezaremos pensando que por alguna razón pueda llegar un path vacío

Describamos eso:

```php
    public function it_should_fail_if_empty_path(): void
    {
        $this->shouldThrow(InvalidArgumentException::class)
             ->during('usingFile', ['']);
    }
```

Lo que dice este ejemplo es que el objeto debería lanzar una excepción `InvalidArgumentException` al ejecutar el método `usingFile`, pasándole los argumentos indicados en el array que en este caso es un `string` vacío. La sintaxis no es del todo intuitiva, pero es usable.

Al ejecutar la suite:

```
bin/phpspec run
```

Obtenemos lo siguiente:

```

      TalkingBit\BddExample\UpdatePricesFromUploadedFile

  11  ✔ is initializable
  16  ✔ should receieve a path to a file
  21  ✘ should fail if empty path (79ms)
        expected to get exception / throwable, none got.

----  failed examples

        TalkingBit/BddExample/UpdatePricesFromUploadedFile
  21  ✘ should fail if empty path (79ms)
        expected to get exception / throwable, none got.


1 specs
3 examples (2 passed, 1 failed)
87ms

```

Puede que hayas notado una diferencia pequeña, pero interesante. En los casos anteriores, `phpspec` nos decía que había "broken examples", es decir, ejemplos que no pasaban porque había algún tipo de error que impedía su ejecución (la clase no estaba definida y el método tampoco). Ahora nos dice que hay "failed examples", es decir, ejemplos que fallan porque el código no hace lo que debería hacer.

Se nos dice que se espera una excepción y no se obtiene ninguna. El ejemplo falla, por lo que debemos implementar algo para que pase:

```php
<?php

namespace TalkingBit\BddExample;

use InvalidArgumentException;

class UpdatePricesFromUploadedFile
{
    public function usingFile(string $pathToFile)
    {
        if ('' === $pathToFile) {
            throw new InvalidArgumentException('No path to file provided');
        }
    }
}
```

Al volver a lanzar la especificación, volveremos a verde:

```

      TalkingBit\BddExample\UpdatePricesFromUploadedFile

  12  ✔ is initializable
  17  ✔ should receieve a path to a file
  22  ✔ should fail if empty path


1 specs
3 examples (3 passed)
8ms
```

Otra cosa que podría salir mal es que no haya archivo donde debería haberlo, así que vamos a protegernos de eso describiendo esa situación:

```php
    public function it_should_fail_it_no_file_in_path(): void 
    {
        $this->shouldThrow(InvalidArgumentException::class)
             ->during('usingFile', ['/var/tmp/no_existent_file.csv']);
    }
```

Ejecutamos y nos da este resultado:

```

      TalkingBit\BddExample\UpdatePricesFromUploadedFile

  12  ✔ is initializable (102ms)
  17  ✔ should receieve a path to a file
  22  ✔ should fail if empty path
  28  ✘ should fail it no file in path
        expected to get exception / throwable, none got.

----  failed examples

        TalkingBit/BddExample/UpdatePricesFromUploadedFile
  28  ✘ should fail it no file in path
        expected to get exception / throwable, none got.


1 specs
4 examples (3 passed, 1 failed)
106ms
```

Como es lógico, el test falla porque no hemos implementado esta situación.

Pero hay una alarma sonando en nuestra cabeza...

## Objetos emergentes

¿No os parece que estamos dedicando demasiado tiempo al path del archivo? Esto empieza a oler a que el *Use Case* se está ocupando de cosas que no deberían estar bajo su responsabilidad. Ha venido aquí para leer un archivo y todavía no ha podido siquiera llegar a él. La responsabilidad de asegurarse de que el archivo está donde tiene que estar y es legible debería ser de otro objeto. Esto empieza a oler a *Value Object*. Al menos, de momento.

### Introducing FilePath value object

Lo que queremos es que nuestro *Use Case* no tenga que ocuparse de verificar que le pasamos una ruta a un archivo utilizable. Su responsabilidad en la validación debería ser sólo que el archivo contiene una estructura de datos que pueda manejar, mientras que el hecho de que sea un path correctamente construido y que apunte a un archivo que existe debería ser de otro objeto.

Una forma de hacerlo es considerar el path al archivo como un *value object* el cual, al construirse se aseguraría de que el string que representa el path apunte a un archivo existente. De este modo, podemos olvidarnos de que `UpdatePricesFromUploadedFile` tenga que ocuparse de esas cosas.

De momento no queremos quitar el foco de esta clase, así que vamos a modificar nuestra Spec para reflejar el nuevo planteamiento y para ello nos sobran dos ejemplos:

```php
<?php

namespace spec\TalkingBit\BddExample;

use InvalidArgumentException;
use TalkingBit\BddExample\UpdatePricesFromUploadedFile;
use PhpSpec\ObjectBehavior;
use Prophecy\Argument;

class UpdatePricesFromUploadedFileSpec extends ObjectBehavior
{
    function it_is_initializable()
    {
        $this->shouldHaveType(UpdatePricesFromUploadedFile::class);
    }

    function it_should_receieve_a_path_to_a_file()
    {
        $this->usingFile('/var/tmp/new_prices.csv');
    }
}
```

Y nos falta un objeto. Atención a la jugada:

```php
<?php

namespace spec\TalkingBit\BddExample;

use InvalidArgumentException;
use TalkingBit\BddExample\UpdatePricesFromUploadedFile;
use TalkingBit\BddExample\VO\FilePath;
use PhpSpec\ObjectBehavior;
use Prophecy\Argument;

class UpdatePricesFromUploadedFileSpec extends ObjectBehavior
{
    function it_is_initializable()
    {
        $this->shouldHaveType(UpdatePricesFromUploadedFile::class);
    }

    function it_should_receieve_a_path_to_a_file(FilePath $filePath)
    {
        $this->usingFile($filePath);
    }
}
```

Hemos añadido `FilePath $filePath` como parámetro en el segundo ejemplo, así como un `use` que defina dónde debería ubicarse. Ahora ejecutemos `phpspec`:

```

      TalkingBit\BddExample\UpdatePricesFromUploadedFile

  13  ✔ is initializable (141ms)
  18  ! should receieve a path to a file (94ms)
        collaborator does not exist : TalkingBit\BddExample\VO\FilePath

----  broken examples

        TalkingBit/BddExample/UpdatePricesFromUploadedFile
  18  ! should receieve a path to a file (94ms)
        collaborator does not exist : TalkingBit\BddExample\VO\FilePath


1 specs
2 examples (1 passed, 1 broken)
237ms
                                                                                
  Would you like me to generate an interface                                    
  `TalkingBit\BddExample\VO\FilePath` for you?                                  
                                                                         [Y/n] 

```

En esta ocasión el ejemplo está roto porque no sabemos nada de ese tal `FilePath`, así que phpspec nos ofrece crear la interfaz que debería implementar el objeto (¡una interfaz! ¿Lo pillas? `phpspec` nos fuerza a aplicar la Inversión de Dependencias). Al indicar su ubicación en `use`, phpspec sabrá dónde colocarla.

```
Interface TalkingBit\BddExample\VO\FilePath created in /Users/frankie/Sites/csvrepo/src/TalkingBit/BddExample/VO/FilePath.php.


      TalkingBit\BddExample\UpdatePricesFromUploadedFile

  13  ✔ is initializable (107ms)
  18  ! should receieve a path to a file (82ms)
        exception [err:TypeError("Argument 1 passed to TalkingBit\BddExample\UpdatePricesFromUploadedFile::usingFile() must be of the type string, object given, called in /Users/frankie/Sites/csvrepo/vendor/phpspec/phpspec/src/PhpSpec/Wrapper/Subject/Caller.php on line 255")] has been thrown.

----  broken examples

        TalkingBit/BddExample/UpdatePricesFromUploadedFile
  18  ! should receieve a path to a file (82ms)
        exception [err:TypeError("Argument 1 passed to TalkingBit\BddExample\UpdatePricesFromUploadedFile::usingFile() must be of the type string, object given, called in /Users/frankie/Sites/csvrepo/vendor/phpspec/phpspec/src/PhpSpec/Wrapper/Subject/Caller.php on line 255")] has been thrown.


1 specs
2 examples (1 passed, 1 broken)
190ms
```

El test sigue fallando. Nos dice que ahora `usingFile` no acepta el tipo de objeto que le estamos pasando ya que esperaba un `string`. Cambiemos eso para volver a verde, eliminando el contenido del método usingFile que ya no tiene sentido:

```
<?php

namespace TalkingBit\BddExample;

use InvalidArgumentException;
use TalkingBit\BddExample\VO\FilePath;

class UpdatePricesFromUploadedFile
{
    public function usingFile(FilePath $pathToFile)
    {
    }
}
```

Si ejecutamos ahora `phpspec`, veremos que estamos en verde.

Por cierto, esta es la interfaz `FilePath`:

```php
<?php

namespace TalkingBit\BddExample\VO;

interface FilePath
{
}
```

¿Y qué es lo que tenemos? `phpspec` va a generar un *Test double* de `FilePath` usando el framework **prophecy**, de modo que podremos simular comportamientos de este objeto como veremos en el apartado siguiente.

## Avanzando con nuestro diseño

Ahora que `UpdatePricesFromUploadedFile` se ha liberado de los detalles del path nos toca empezar a trabajar con el contenido del archivo. O más exactamente: con su ausencia de contenido. En ese caso, sabemos que debería fallar. Este ejemplo se pondrá interesante por varios motivos:

* Tendríamos que crear un archivo vacío en la ruta para que pueda ser leído.
* `FilePath` debería darle a `UpdatePricesFromUploadedFile` una cadena con un path a ese archivo existente.

Vayamos por partes:

* Pondremos un archivo en '/var/tmp/empty_file.csv'.
* Supondremos que FilePath tiene un método `path()` que devuelve lo que te puedes imaginar.

Aquí tenemos la Spec completa:

```php
<?php

namespace spec\TalkingBit\BddExample;

use \RuntimeException;
use InvalidArgumentException;
use TalkingBit\BddExample\UpdatePricesFromUploadedFile;
use TalkingBit\BddExample\VO\FilePath;
use PhpSpec\ObjectBehavior;
use Prophecy\Argument;

class UpdatePricesFromUploadedFileSpec extends ObjectBehavior
{
    public function it_is_initializable()
    {
        $this->shouldHaveType(UpdatePricesFromUploadedFile::class);
    }

    public function it_should_receieve_a_path_to_a_file(FilePath $filePath)
    {
        $this->usingFile($filePath);
    }

    public function it_should_fail_if_file_is_empty(FilePath $filePath)
    {
        $path = '/var/tmp/empty_file.csv';
        file_put_contents($path, '');
        $filePath->path()->willReturn($path);

        $this->shouldThrow(RuntimeException::class)
            ->during('usingFile', [$filePath]);

        unlink($path);
    }
}
```

Estamos de acuerdo en que no es la mejor manera de garantizar la existencia de un archivo en un test (es mejor usar sistemas de archivo virtuales para eso), pero para no desviarme mucho del tema prefiero plantearlo así. Lo que me interesa es lo que ocurre ahora con `FilePath`. Este es el resultado de ejecutar la Spec. El ejemplo está roto, pero tiene arreglo:

```

      TalkingBit\BddExample\UpdatePricesFromUploadedFile

  14  ✔ is initializable (390ms)
  19  ✔ should receieve a path to a file (94ms)
  24  ! should fail if file is empty (73ms)
        method `Double\FilePath\P2::path()` is not defined.

----  broken examples

        TalkingBit/BddExample/UpdatePricesFromUploadedFile
  24  ! should fail if file is empty (73ms)
        method `Double\FilePath\P2::path()` is not defined.


1 specs
3 examples (2 passed, 1 broken)
560ms
                                                                                
  Would you like me to generate a method signature                              
  `TalkingBit\BddExample\VO\FilePath::path()` for you?                          
                                                                         [Y/n] 
```

`phpspec` nos ofrece añadir el método `path` a la interfaz de `FilePath`, ¿no es adorable? Pues si le decimos que sí, lo añade (puedes comprobarlo) y el ejemplo falla porque no hemos implementado nada todavía:

```
  Method signature TalkingBit\BddExample\VO\FilePath::path() has been created.
  

      TalkingBit\BddExample\UpdatePricesFromUploadedFile

  14  ✔ is initializable (85ms)
  19  ✔ should receieve a path to a file
  24  ✘ should fail if file is empty (63ms)
        expected to get exception / throwable, none got.

----  failed examples

        TalkingBit/BddExample/UpdatePricesFromUploadedFile
  24  ✘ should fail if file is empty (63ms)
        expected to get exception / throwable, none got.


1 specs
3 examples (2 passed, 1 failed)
174ms
```

Vamos a ello:

```php
<?php

namespace TalkingBit\BddExample;

use InvalidArgumentException;
use RuntimeException;
use TalkingBit\BddExample\VO\FilePath;

class UpdatePricesFromUploadedFile
{
    public function usingFile(FilePath $pathToFile)
    {
        $path = $pathToFile->path();
        $data = file_get_contents($path);
        if (empty($data)) {
            throw new RuntimeException(sprintf('File %s is empty', $path));
        }
    }
}
```

Y ejecutamos la Spec para ver qué ha pasado, y el resultado es interesante:

```

      TalkingBit\BddExample\UpdatePricesFromUploadedFile

  14  ✔ is initializable (63ms)
  19  ! should receieve a path to a file (151ms)
        warning: file_get_contents(): Filename cannot be empty in
        /Users/frankie/Sites/csvrepo/src/TalkingBit/BddExample/UpdatePricesFromUploadedFile.php line 14
  24  ✔ should fail if file is empty (60ms)

----  broken examples

        TalkingBit/BddExample/UpdatePricesFromUploadedFile
  19  ! should receieve a path to a file (151ms)
        warning: file_get_contents(): Filename cannot be empty in
        /Users/frankie/Sites/csvrepo/src/TalkingBit/BddExample/UpdatePricesFromUploadedFile.php line 14


1 specs
3 examples (2 passed, 1 broken)
275ms
```

El segundo ejemplo falla cuando antes no lo hacía. La razón es que `FilePath` debería devolver un path y en ese ejemplo no lo hace porque no hemos simulado ese comportamiento.

Lo arreglamos:

```
    function it_should_receieve_a_path_to_a_file(FilePath $filePath)
    {
        $filePath->path()->willReturn('/var/tmp/data_file.csv');
        $this->usingFile($filePath);
    }
```

Pero sigue fallando:

```

      TalkingBit\BddExample\UpdatePricesFromUploadedFile

  14  ✔ is initializable
  19  ! should receieve a path to a file (266ms)
        warning: file_get_contents(/var/tmp/data_file.csv): failed to open stream: No such file or directory in
        /Users/frankie/Sites/csvrepo/src/TalkingBit/BddExample/UpdatePricesFromUploadedFile.php line 14
  25  ✔ should fail if file is empty

----  broken examples

        TalkingBit/BddExample/UpdatePricesFromUploadedFile
  19  ! should receieve a path to a file (266ms)
        warning: file_get_contents(/var/tmp/data_file.csv): failed to open stream: No such file or directory in
        /Users/frankie/Sites/csvrepo/src/TalkingBit/BddExample/UpdatePricesFromUploadedFile.php line 14


1 specs
3 examples (2 passed, 1 broken)
289ms
```

## Diseñar es decidir

Tenemos varios posibles cursos de acción aquí:

* El primero es seguir la misma estrategia que con el ejemplo del archivo vacío: generamos un archivo con contenido válido en el momento y lo borramos después de ejecutar el test.
* La segunda posibilidad es trasladar las responsabilidades al objeto `FilePath`, de modo que gestione también el obtener el contenido del archivo.
* La tercera posibilidad es tener una nueva clase que se encargue de leer el contenido del archivo, devolviendo los datos a `UpdatePricesFromUploadedFile` que los usará para realizar su tarea.

Pensemos un poco sobre eso. En nuestra `feature` hemos basado los escenarios en la suposición de que los datos se subirán al sistema en un archivo Csv, que es fácil de generar mediante la hoja de cálculo con la que están trabajando desde negocio. Tiene sentido, entonces, tener un objeto que represente a ese archivo e interprete su contenido, proporcionándonos los datos necesarios para actualizar los precios en nuestro sistema.

Así que apuntamos a la tercera opción: introducir un nuevo objeto que se encargue de pelearse con el contenido del archivo, liberando a `UpdatePricesFromUploadedFile` de esa tarea para que se centre únicamente en su responsabilidad de trasladar esos datos a donde son necesarios.

Tiene sentido que nuestro lector de archivos se le inyecte a `UpdatePricesFromUploadedFile` en construcción porque va a ser necesario siempre, lo que nos va a permitir aprender algo nuevo sobre `phpspec`. Así es como quedará la Spec:

```php
<?php

namespace spec\TalkingBit\BddExample;

use \RuntimeException;
use InvalidArgumentException;
use TalkingBit\BddExample\UpdatePricesFromUploadedFile;
use TalkingBit\BddExample\FileReader\FileReader;
use TalkingBit\BddExample\VO\FilePath;
use PhpSpec\ObjectBehavior;
use Prophecy\Argument;

class UpdatePricesFromUploadedFileSpec extends ObjectBehavior
{
    public function let(FileReader $fileReader): void
    {
        $this->beConstructedWith($fileReader);
    }

    public function it_is_initializable(): void
    {
        $this->shouldHaveType(UpdatePricesFromUploadedFile::class);
    }

    public function it_should_receieve_a_path_to_a_file(FilePath $filePath): void
    {
        $this->usingFile($filePath);
    }

    public function it_should_fail_if_file_is_empty(FileReader $fileReader, FilePath $filePath): void
    {
        $fileReader->readFrom($filePath)
            ->willThrow(RuntimeException::class);
            
        $this->shouldThrow(RuntimeException::class)
            ->during('usingFile', [$filePath]);
    }
}
```

Hay un montón de cosas nuevas aquí, por lo que vamos a analizarlas:

### Let y beConstructedWith

*let* es un método que se ejecuta antes de cada ejemplo, lo que nos permite preparar todo lo necesario y que sea común para todos los ejemplos. En `phpunit` sería `setUp`.

En este caso, lo que hacemos es inicializar nuestro *subject under specification*, haciendo que sea construido con un colaborador, una nueva clase cuya interfaz se llamará `FileReader`. Es cierto que queremos una implementación que lea CSV, pero ya que estamos, vamos a desligarnos de eso y ya dejaremos para luego esa implementación concreta. El método `beConstructedWith` es una especie de factoría que nos permite pasarle los parámetros que requerirá el constructor. Y, sí, también existe una versión para constructores estáticos.

Por supuesto, podrías usar `beConstructedWith` en cualquier ejemplo de la Spec para inicializar el *subject under specification* para un caso particular.

### FilePath ya no es lo que era

Recuerda que `FilePath` es un value object para representar la ruta a un archivo. Dado que `UpdatePricesFromUploadedFile` ya no va a manejar directamente el archivo, se lo pasará a `FileReader` sin más. Lo cierto es que no necesitamos siquiera que su método `path()` devuelva valor alguno: ahora nos basta con un *dummy*. Por tanto, nuestra Spec ya no necesita crear archivos ni nada por el estilo, un problema menos.

### Simulando el comportamiento de FileReader

`FileReader` va a asumir todas las tareas relacionadas con la lectura el archivo. Como no queremos procesar archivos vacíos simularemos, en este caso, que lanza una excepción si el archivo no tiene contenido. Como hemos señalado, `UpdatePricesFromUploadedFile`, deberá pasarle a `FileReader` el path por medio de `FilePath`.

Como todavía no hemos cambiado la implementación, la Spec fallará, pero no está de más ejecutarla para que nos diga por dónde seguir trabajando ahora.

Lo primero que va a pasar es que no tenemos definida la interfaz de `FileReader`, ni el constructor en `UpdatePricesFromUploadedFile`, por lo que `phpspec` nos irá preguntando si los queremos crear. Como ya sabemos que lo hace bien, vamos contestando que sí a todas las preguntas. Finalmente, este es el resultado:

```

      TalkingBit\BddExample\UpdatePricesFromUploadedFile

  20  ✔ is initializable (879ms)
  25  ! should receieve a path to a file
        warning: file_get_contents(): Filename cannot be empty in
        /Users/frankie/Sites/csvrepo/src/TalkingBit/BddExample/UpdatePricesFromUploadedFile.php line 19
  30  ✘ should fail if file is empty
        expected exception of class "RuntimeException", but got
        [exc:PhpSpec\Exception\Example\ErrorException("warning: file_get_contents(): Filename cannot be empty in
        /Users/frankie/Sites/csvrepo/src/TalkingBit/BddExample/UpdatePricesFromUploadedFile.php line 19")].

----  failed examples

        TalkingBit/BddExample/UpdatePricesFromUploadedFile
  30  ✘ should fail if file is empty
        expected exception of class "RuntimeException", but got
        [exc:PhpSpec\Exception\Example\ErrorException("warning: file_get_contents(): Filename cannot be empty in
        /Users/frankie/Sites/csvrepo/src/TalkingBit/BddExample/UpdatePricesFromUploadedFile.php line 19")].

----  broken examples

        TalkingBit/BddExample/UpdatePricesFromUploadedFile
  25  ! should receieve a path to a file
        warning: file_get_contents(): Filename cannot be empty in
        /Users/frankie/Sites/csvrepo/src/TalkingBit/BddExample/UpdatePricesFromUploadedFile.php line 19


1 specs
3 examples (1 passed, 1 failed, 1 broken)
929ms
```

Obviamente, lo primero es ir a `UpdatePricesFromUploadedFile` y modificar el código hasta lograr que la Spec pase, primero arreglando el ejemplo roto y después cambiando la implementación.

```php
<?php

namespace TalkingBit\BddExample;

use InvalidArgumentException;
use RuntimeException;
use TalkingBit\BddExample\FileReader\FileReader;
use TalkingBit\BddExample\VO\FilePath;

class UpdatePricesFromUploadedFile
{
    /** @var FileReader */
    private $fileReader;

    public function __construct(FileReader $fileReader)
    {
        $this->fileReader = $fileReader;
    }

    public function usingFile(FilePath $pathToFile)
    {
        $data = $this->fileReader->readFrom($pathToFile);
    }
}
```

Y, efectivamente, ahora la Spec pasa. Hemos simulado que `FileReader` fallará y la excepción "sube", de modo que nuestro ejemplo, que se aplica sobre `UpdatePricesFromUploadedFile`, pasa correctamente.

### Momento Refactor

Resulta curioso pensar que aún no hemos otorgado nada de funcionalidad a `UpdatePricesFromUploadedFile` sino que más bien le hemos ido quitando de encima responsabilidades que no le corresponden. Antes de continuar, vamos a revisar las interfaces que `phpspec` ha ido creando, ya que necesitarán un poco de cariño en forma de *Type Hinting* y *Return Type*.

**FilePath**

```php
<?php

namespace TalkingBit\BddExample\VO;

interface FilePath
{
    public function path(): string;
}
```

**FileReader**

```php
<?php

namespace TalkingBit\BddExample\FileReader;

use TalkingBit\BddExample\VO\FilePath;

interface FileReader
{
    public function readFrom(FilePath $filePath): array;
}
```

Al añadir *Return Type*, `FileReader` provocará un fallo en el ejemplo, por lo que deberíamos añadir en la Spec que el double devuelva un array, aunque sea vacío. Lo hacemos en `let` para que sea el comportamiento por defecto.


```php
    public function let(FileReader $fileReader, FilePath $filePath): void
    {
        $fileReader->readFrom($filePath)->willReturn([]);
        $this->beConstructedWith($fileReader);
    }
```

Ahora la Spec pasa perfectamente.

Una nota extra: cuando declaras colaboradores como parámetros en los métodos de la Spec, `phpspec` puede reutilizarlos en cualquier otro método siempre que mantengas el mismo nombre. Por eso, el `$fileReader` cuyo comportamiento definimos en `let`, lo mantiene en los demás métodos, a no ser que lo cambiemos para un método concreto como hacemos en nuestro ejemplo.

## Nuevos colaboradores

Ahora mismo, `UpdatePricesFromUploadedFile` ya puede tener la información procedente del archivo y, por tanto, estará en disposición de hacer algo con ello. El objetivo de la *Feature* es actualizar los precios de los productos allí donde estén almacenados, que suele ser un repositorio. Seguramente un repositorio de productos que bien podría llamarse `ProductRepository`.

En la *Feature* no hemos definido detalles acerca de la estructura del archivo ni de cómo está almacenada la información en el sistema. Así que haremos algunas suposiciones en este momento para poder avanzar. En una próxima entrega modificaremos algunos detalles del código para ser más rigurosos, pero el tiempo apremia y queremos presentar un MVP.

Así que vamos a suponer que el archivo se compone de dos simples columnas: el id del producto y el nuevo precio que se le asignará, en euros.

Por ejemplo (no necesitamos muchísimos):

```csv
product_id,new_price
101,14.50
102,5.95
105,20.50
```

Por tanto, escribiremos un ejemplo que describa justamente eso:

```php
    public function it_should_update_prices_for_the_products_in_file(FileReader $fileReader, FilePath $filePath): void
    {
        $fileReader
            ->readFrom($filePath)
            ->willReturn(
                [
                    ['product_id' => 101, 'new_price' => 14.50],
                    ['product_id' => 102, 'new_price' => 5.95],
                    ['product_id' => 105, 'new_price' => 20.50]
                ]
            );
        $this->usingFile($filePath);
    }
```

Desgraciadamente, el ejemplo pasa, lo que es malo porque no hemos implementado nada que explique que pase. Nos faltan unas cuantas cosas. Para empezar, necesitamos una forma de saber que `UpdatePricesFromUploadedFile` hace su trabajo, pasando la nueva información a `ProductRepository`, al cual no hemos invitado todavía a participar.

`ProductRepository` es un colaborador que debería pasarse en construcción y debemos simular algunos comportamientos. Concretamente, para poder asumir que `UpdatePricesFromUploadedFile` hace lo que debe, debemos fijar unas expectativas en `ProductRepository`, convirtiéndolo en un **Mock**.

Así queda la Spec completa. La explicación, como es habitual, después:

```php
<?php

namespace spec\TalkingBit\BddExample;

use PhpSpec\ObjectBehavior;
use Prophecy\Prophet;
use RuntimeException;
use TalkingBit\BddExample\FileReader\FileReader;
use TalkingBit\BddExample\ProductRepository;
use TalkingBit\BddExample\Product;
use TalkingBit\BddExample\UpdatePricesFromUploadedFile;
use TalkingBit\BddExample\VO\FilePath;

class UpdatePricesFromUploadedFileSpec extends ObjectBehavior
{
    public function let(ProductRepository $productRepository, FileReader $fileReader, FilePath $filePath): void
    {
        $fileReader->readFrom($filePath)->willReturn([]);
        $this->beConstructedWith($productRepository, $fileReader);
    }

    public function it_is_initializable(): void
    {
        $this->shouldHaveType(UpdatePricesFromUploadedFile::class);
    }

    public function it_should_receieve_a_path_to_a_file(FilePath $filePath): void
    {
        $this->usingFile($filePath);
    }

    public function it_should_fail_if_file_is_empty(FileReader $fileReader, FilePath $filePath): void
    {
        $fileReader->readFrom($filePath)->willThrow(RuntimeException::class);
        $this->shouldThrow(RuntimeException::class)
             ->during('usingFile', [$filePath]);
    }

    public function it_should_update_prices_for_the_products_in_file(
        ProductRepository $productRepository,
        Product $product,
        FileReader $fileReader,
        FilePath $filePath
    ): void {
        $fileReader
            ->readFrom($filePath)
            ->willReturn(
                [
                    ['product_id' => 101, 'new_price' => 14.50]
                ]
            );
        $product->setPrice(14.50)->shouldBeCalled();

        $productRepository->getById(101)->shouldBeCalled()->willReturn($product);

        $this->usingFile($filePath);
    }
}
```

Para no complicar el ejemplo voy a hacerlo sólo con un producto, que es un caso sencillo. 

Primero fallará porque hemos cambiado la interfaz del constructor de `UpdatePricesFromUploadedFile`, así que debemos arreglar eso de modo que el primer parámetro sea el repositorio. Una vez reparado eso, volvemos a lanzar `phpspec` y nos pedirá crear la interfaz de `Product`, con su método `setPrice`, así como el método `getById` en `ProductRepository`. Luego la Spec fallará como era de esperar porque no hay implementación.

Nos vamos a `UpdatePricesFromUploadedFile` y añadimos el código necesario para que el test pase.

```php
<?php

namespace TalkingBit\BddExample;

use InvalidArgumentException;
use RuntimeException;
use TalkingBit\BddExample\FileReader\FileReader;
use TalkingBit\BddExample\VO\FilePath;

class UpdatePricesFromUploadedFile
{
    /** @var FileReader */
    private $fileReader;
    /** @var ProductRepository */
    private $productRepository;

    public function __construct(ProductRepository $productRepository, FileReader $fileReader)
    {
        $this->fileReader = $fileReader;
        $this->productRepository = $productRepository;
    }

    public function usingFile(FilePath $pathToFile)
    {
        $data = $this->fileReader->readFrom($pathToFile);
        foreach ($data as $row) {
            $product = $this->productRepository->getById($row['product_id']);
            $product->setPrice($row['new_price']);
        }
    }
}
```

Y con esto, la Spec tiene todos los ejemplos en verde:

```

      TalkingBit\BddExample\UpdatePricesFromUploadedFile

  22  ✔ is initializable
  27  ✔ should receieve a path to a file
  32  ✔ should fail if file is empty
  39  ✔ should update prices for the products in file


1 specs
4 examples (4 passed)
18ms
```

Yo diría que es un buen momento para detenerse y reflexionar sobre lo que hemos logrado.

## Recapitulando

Hemos comenzado el artículo con una feature en lenguaje Gherkin que todavía tenemos que validar con un test de aceptación. El esqueleto del test ha sido generado con Behat y ahora estamos desarrollando a los actores que van a intervenir en él.

Hemos comenzado partiendo de un *Use Case*. En las arquitecturas limpias los *Use Case* suelen representar las acciones que el sistema de software realiza en respuesta a las demandas de los usuarios por lo que tiene mucho sentido empezar por ahí y ver qué es lo que necesitamos.

Al avanzar en el diseño del *Use Case* hemos descubierto algunas cosas. Para empezar, que el *Use Case* necesita preparar una serie de requisitos, como es llegar a un archivo del cual extraer la información, y que esa preparación no siempre le corresponde, por lo que podemos asumir que serán otros objetos los que se encarguen de ello. Serán sus colaboradores.

No vamos a programar ahora a los colaboradores, sino que vamos a imaginarnos cómo queremos que interactúen con el *Use Case*, definiendo sus interfaces desde el punto de vista de su "cliente", tarea en la que los automatismos de `phpspec` nos pueden ayudar. Más adelante tendremos que ocuparnos de desarrollarlos, pero por ahora tenemos más que suficiente.

De hecho, hemos podido desarrollar la funcionalidad básica del *Use Case*, con el mínimo código posible y todo razonablemente bien diseñado y desacoplado, respetando los principios de diseño desde el primer momento.

En el [próximo capítulo](/bdd-example-3) de esta serie, seguiremos avanzando en el desarrollo de la *feature* explorando diversos enfoques, aprendiendo cómo podemos ampliarla con nuevas demandas de negocio y viendo cómo el diálogo entre desarrollo y negocio puede ayudar a ambas partes a crear mejores productos.

Veremos también cómo podemos escribir los colaboradores de manera independiente y también algunas capacidades interesantes tanto de `behat` como de `phpspec`.
