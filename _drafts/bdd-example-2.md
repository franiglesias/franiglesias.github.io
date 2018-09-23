---
layout: post
title: Introducción a Behavior Driven Development en PHP (2)
categories: articles
tags: php bdd testing
---

En el [artículo anterior](/2018-09-16-bdd-example-1) comenzamos introduciendo el concepto de BDD, el lenguaje Gherkin y la herramienta Behat. Al final del mismo, nos habíamos quedado con una feature escrita en Gherkin y un test de aceptación vinculado fallando.

Antes de continuar me gustaría puntualizar algunas cosas cuya ausencia podríais haber notado.

## Hagamos un inciso

**Qué hay de los tests de navegador**. Muchas personas sabéis que es frecuente hacer tests de navegador con ayuda de estas herramientas ya que en muchos casos es el modo en que el usuario va a interactuar con la aplicación. En su lugar he planteado un test más centrado en el backend. Primero porque es un terreno más familiar para mi, pero también me parece que es más fácil entender el funcionamiento del ecosistema BDD sin introducir dificultades extras.

Sin embargo, mi plan es cubrir ese tipo de tests en el futuro. 

**Tests de integración con Behat**. Con relación a lo anterior, decir que es perfectamente válido utilizar Gherkin y behat para plantear tests de integración de esta forma. Asumo que en cada equipo de desarrollo y en cada proyecto las cosas pueden ser distintas pero en mi caso esta aproximación sería más que suficiente en la mayor parte de ocasiones.

**¿Esta cosa es configurable?** Bajando a aspectos más técnicos, todavía no me parado en introducir los detalles de configuración de Behat. Con toda razón habrá quien se pregunte si no es posible guardar los archivos en otra parte o generar más tests que el FeatureContext que se crea por defecto. Por supuesto que es posible personalizar la herramienta pero, de nuevo, me ha parecido más fácil centrarnos en entender bien el flujo de trabajo antes de tratar de personalizarlo sin saber por qué o para qué.

**¿Otro entorno de test? ¿Tengo que aprender phpspec?** En la entrega anterior mencioné que usaríamos phpspec para la siguiente fase de desarrollo BDD. Sin embargo, no es estrictamente necesario ya que con phpunit podemos desarrollar el mismo tipo de test, aunque nos exige algo más de disciplina. Como ya he comentado anteriormente, y la documentación de phpspec insiste, se trata de un framework de test con opiniones muy marcadas acerca de cómo deberías programar.

PHPspec impone muchas restricciones que son buenas para forzarnos a respetar los principios de diseños y construir un código desacoplado y sostenible guiados por ejemplos. 

Y con esto, termina este inciso y volvemos al trabajo.

## Recuperando el hilo

El artículo anterior finalizaba con un test que planteaba una solución posible a nuestra Feature. Tal como estaba, tendría mucho sentido en una situación en la cual ya tuviésemos algunos elementos implementados, como repositorio de productos y el lector de CSV. Eso nos permitiría centrarnos en el desarrollo del Use Case `UpdatePricesFromUploadedFile`.

Pero vamos a intentar algo un poco más difícil, vamos a suponer que se trata de una feature completamente nueva. Así que tiramos lo que tenemos del artículo anterior y comenzamos con un FeatureContext recién sacado de behat.

Y, para complicarlo un poco más, nos damos cuenta de que la feature no está completamente definida y tenemos que profundizar más en ella con negocio.


## Ampliando la feature

En el diálogo entre negocio y desarrollo normalmente surgirán los escenarios más comunes, incluyendo estos que hemos detectado ahora que incluyen los escenarios en los que las cosas no acaban bien. La definición de una feature debe incluir tanto los happy paths, como diversos sad paths.

Sin embargo, la visión desde negocio no es la misma que desde desarrollo. La definición de la feature no debería incluir elementos técnicos que supongan una cierta implementación los cuales, sin embargo, habrá que desarrollar y testear a través de la especificación.

Por ejemplo. Desde el punto de vista de desarrollador se nos pueden ocurrir varios motivos por los que la feature en la que estamos trabajando pueda funcionar mal:

* El usuario aporta un archivo que no es válido.
* Falla la comunicación en algún momento y no se puede subir al sistema.
* Hay algún error que impide que el archivo se pueda utilizar.
* El sistema de almacenamiento se satura e impide realizar la operación.
* Otras razones técnicas.

Negocio, sin embargo, vería probablemente lo siguiente:

* Se ha subido el archivo equivocado (error del usuario).
* Algo no funciona a nivel técnico (error del sistema).

Por la tanto, añadiríamos estos dos escenarios a la feature: uno en el que el usuario sube un archivo que no vale y otro en el que el sistema falla, indicando en ambos cómo se espera informar al usuario de lo que ha pasado y qué puede hacer.

Sin embargo, al desarrollar tendremos de contemplar las diferentes causas de fallo para poder detectarlas e implementar las medidas adecuadas para gestionarlas.

### Añadir nuevos escenarios a una feature

Para añadir nuevos escenarios a una feature no tenemos más que ir al documento Gherkin correspondiente y añadirlos. En nuestro caso, podría quedar así:

```gherkin
Feature: Massive data update
  As Sales Manager
  I want to be able to upload csv files
  In order to massive update product prices

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

* La estructura de cada escenario es siempre la misma, con secciones para Given, When y Then.
* La clave And se utiliza como sinónimo de la sección en la que aparece, lo que facilita la lectura.
* Hemos procurado repetir la formulación de los pasos en la medida de lo posible. Por lo general, muchos pasos podrán reutilizarse, pero para eso necesitamos que puedan ser encontrados por la misma expresión regular asociada a cada definición en la clase FeatureContext.

¿Qué nos toca hacer ahora? Tendríamos que escribir las definiciones necesarias en FeatureContext para cubrir todos los nuevos pasos que componen el escenario. Pero también podemos dejar que sea behat quien lo haga, aunque para eso necesitaríamos que los tests actuales se ejecutan. Ahora fallan porque no tenemos ninguno de los elementos necesarios, pero podemos resolver eso de varias formas:

* Seguir desarrollando el primer escenario hasta que lo podamos ejecutar por completo.
* Comentar el código para que behat pueda ejecutarse y añadir las nuevas definiciones.

```bash
bin/behat --append-snippets
```

De momento he optado por símplemente comentar el código para que behat pueda ejecutar la feature completa y generar pasos nuevos:

```
Feature: Massive data update
  As Sales Manager
  I want to be able to upload csv files
  In order to massive update product prices

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

Si lo ejecutamos, éste será el resultado:



Y ahora, sí:

## Del test de aceptación a la especificación mediante ejemplos

Tenemos el test de aceptación, pero pretendemos ejecutarlo con elementos que no existen todavía. Podríamos empezar a escribir código sin más, pero queremos ser más rigurosos y desarrollar las clases implicadas mediante TDD sin salirnos del enfoque BDD.

Para ello usaremos una metodología conocida como especificación mediante ejemplos.

Los tests tradicionales suelen tener un lenguaje aseverativo: el código hace algo y el test confirma que lo hace. 

Los tests BDD tienen un lenguaje más descriptivo e incluso desiderativo y suelen nombrarse con la fórmula "debería" (should...) porque se definen como un descripción del comportamiento que se espera de ese objeto en una situación dada.

Este tipo de tests se pueden crear en phpunit con un poco de disciplina, pero contamos con una herramienta diseñada específicamente para ello que es phpspec.

### Añadiendo phpspec al proyecto

Requerimos phpspec mediante composer para incluirlo en nuestras dependencias dev.

```bash
composer require --dev phpspec/phpspec
```

Nuestro composer.json necesitará la adición de una clave para autoload con psr0:

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
      "TalkingBit\\CSVRepo\\": "src/"
    }
  },
  "autoload-dev": {
    "psr-0": {
      "": "src/"
    },
    "psr-4": {
      "Tests\\TalkingBit\\CSVRepo\\": "tests/"
    }
  }
}
```

Al igual que con behat, de momento no nos vamos a preocupar de los detalles de configuración pues para empezar ya nos va bien con su comportamiento por defecto. Excepto por una cosa: el informe.

### Embelleciendo el informe del test

Aunque el reporte por omisión del phpspec funciona bien por lo general, queda muy mal si la presentación del mismo es en monocromática, como en este artículo, por lo que para tener un mejor visión de lo que ocurre con nuestra especificación vamos a cambiar su formato con esta opción:

```bash
bin/phpspec run --format pretty
```

La cual podemos fijar como opción por defecto mediante un archivo de configuración `phpspec.yml` que se sitúa en la raíz del proyecto y que más adelante usaremos para añadir más opciones:

```yaml
formatter.name: pretty
```

De esta manera es más fácil saber qué ocurre, como se puede ver en este ejemplo:

```
      TalkingBit\CSVRepo\UpdatePricesFromUploadedFile

  11  ✔ is initializable (94ms)
  16  ✔ should receieve a path to a file
  21  ✔ should fail if empty path


1 specs
3 examples (3 passed)
97ms
```

### Nuestro primer ejemplo

El núcleo de la feature que vamos a desarrollar es un UseCase llamado `UpdatePricesFromUploadedFile`. En el ejemplo, hemos planteado que require de dos colaboradores: el repositorio `ProductRepository` y el servicio `ReadCSVFile`, pero a lo mejor no ha sido buena idea hacerlo así.

`UpdatePricesFromUploadedFile` será el responsable de realizar la feature y podemos intuir que necesitará ayuda. Incluso, por experiencia, podemos tener una idea bastante clara de cómo debería montarse el sistema. En ese sentido, nuestro planteamiento es correcto. Pero, en lugar de entrar en detalles de cómo deben funcionar los colaboradores, lo que vamos a  hacer es dejar que sea el diseño de `UpdatePricesFromUploadedFile` el que nos lleve a cómo deberían funcionar cuando los necesitemos.

Así que empezamos por describir el comportamiento de nuestro Use Case:

```bash
bin/phpspec describe 'TalkingBit\CSVRepo\UpdatePricesFromUploadedFile'
```

En este ejemplo he preferido usar la notación de namespace, que debe ir entre comillas para que la utilidad pueda procesarlo correctamente.

La línea anterior produce la respuesta siguiente:

```
Specification for TalkingBit\CSVRepo\UpdatePricesFromUploadedFile created in /Users/frankie/Sites/csvrepo/spec/TalkingBit/CSVRepo/UpdatePricesFromUploadedFileSpec.php.
```

Y genera este archivo en la carpeta del proyecto con nombre `spec`:

```php
<?php

namespace spec\TalkingBit\CSVRepo;

use TalkingBit\CSVRepo\UpdatePricesFromUploadedFile;
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

Tenemos nuestro primer test, o mejor dicho: nuestro primer ejemplo.

Vamos a ver qué pasa:

```bash
bin/phpspec run
```

Pues que el primer ejemplo no se cumple. O dicho en otros términos tenemos un primer test que falla.

Lo bueno es que phpspec nos dice por qué falla y nos ofrece una solución.

```
TalkingBit/CSVRepo/UpdatePricesFromUploadedFile                                 
  11  - it is initializable
      class TalkingBit\CSVRepo\UpdatePricesFromUploadedFile does not exist.

                                      100%                                       1
1 specs
1 example (1 broken)
110ms

                                                                                
  Do you want me to create `TalkingBit\CSVRepo\UpdatePricesFromUploadedFile`    
  for you?                                                                      
                                                                         [Y/n] 
```

Respondemos que sí pulsando la tecla y, lo que da lugar a la siguiente respuesta:

```
Class TalkingBit\CSVRepo\UpdatePricesFromUploadedFile created in /Users/frankie/Sites/csvrepo/src/TalkingBit/CSVRepo/UpdatePricesFromUploadedFile.php.

                                      100%                                       1
1 specs
1 example (1 passed)
14ms
```

Se muestran las estadísticas de la ejecución del test, que ahora pasa ya que se ha creado un archivo con una definición básica de la clase, suficiente para eso:

```php
<?php

namespace TalkingBit\CSVRepo;

class UpdatePricesFromUploadedFile
{
}
```

## Anatomía de la especificación por ejemplos

La especificación anterior es la base para definir el comportamiento del UseCase que vamos a desarrollar.

Phpspec genera un primer ejemplo muy simple: que se puede inicializar el objeto cuyo comportamiento describimos.

$this es un proxy al objeto. No tenemos que instanciarlo aunque, como veremos, es posible inicializarlo de una manera determinada para describir un ejemplo específico o para todos en general. Lo veremos en su momento.

La cuestión ahora es que debemos describir cómo queremos que se comporte este objeto o cómo queremos usarlo.

En este caso es un Comando y, como tal, provoca un efecto en el sistema, como es leer un archivo y actualizar una tabla de precios. Si se encuentra con algún problema para realizar esta tarea fallará (lanzando una excepción). En cambio, si la ejecuta no comunicará nada: 'no news are good news'.

Para ello necesita saber la ubicación del archivo y la de la tabla de precios. La primera la conocerá en el momento de ejecutarse, mientras que la segunda la sabrá a priori porque estará en un lugar determinado del sistema.

Esto nos da alguna pista:

* La tabla de precios es un conocimiento que debería recibir al construirse.
* La ubicación del archivo es un conocimiento que recibirá al ejecutarse.

Nos vamos a centrar en este segundo punto: lo que nos dice esto es que el UseCase tendrá un método que recibirá como parámetro el nombre del archivo.

Vamos a describir este comportamiento escribiendo un ejemplo de cómo podríamos querer usarlo:

```php
<?php

namespace spec\TalkingBit\CSVRepo;

use TalkingBit\CSVRepo\UpdatePricesFromUploadedFile;
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
        $this->fromPath('/var/tmp/new_prices.csv');
    }
}
```

Como primera cosa a destacar, señalar que los ejemplos se escriben comenzando por it o its (de forma similar a como los test en phpunit se escriben comenzando por test). Además los nombres se escriben con underscore o snake-case. Esto va contra las recomendaciones de PSR.

No esperamos que este método retorne nada, sólo que exista, así que si ejecutamos nos dará un fallo. De nuevo, además de las estadísticas y resultados del test, nos indica que el problema es que no existe el método y nos ofrece crearlo.

```
TalkingBit/CSVRepo/UpdatePricesFromUploadedFile                                   
  16  - it should receieve a path to a file
      method TalkingBit\CSVRepo\UpdatePricesFromUploadedFile::fromPath not found.

                  50%                                     50%                    2
1 specs
2 examples (1 passed, 1 broken)
78ms

                                                                                
  Do you want me to create                                                      
  `TalkingBit\CSVRepo\UpdatePricesFromUploadedFile::fromPath()` for you?        
                                                                         [Y/n] 
```

Si aceptamos, veremos que se añade el método fromPath a la clase correspondiente.

```php
<?php

namespace TalkingBit\CSVRepo;

class UpdatePricesFromUploadedFile
{
    public function fromPath($argument1)
    {
        // TODO: write logic here
    }
}
```

Y estamos otra vez en verde. Es momento de refactorizar y cambiar el nombre genérico del argumento a uno más expresivo.

```php
<?php

namespace TalkingBit\CSVRepo;

class UpdatePricesFromUploadedFile
{
    public function fromPath(string $pathToFile)
    {
        // TODO: write logic here
    }
}
```

Resulta curioso testear sobre algo que no devuelve nada, ¿verdad?

Pero hay circunstancias que producen un efecto visible. Supongamos que el path que recibe nuestro UseCase está vacío, o que el archivo no contenga datos o estén en un formato ilegible o inválido. Parece lógico que falle arrojando una excepción.

Sin embargo, esto nos debería llevar a darnos cuenta que nuestro test de aceptación no contempla el escenario de que el archivo de datos no pueda proporcionar datos válidos a la aplicación. En este punto, deberíamos volver a la feature y hablar con negocio acerca de posibles nuevos escenarios.


## Volviendo a la especificación


Ahora sí, ahora volvemos con la especificación.

### Describiendo lo que puede salir mal

Empezaremos pensando que por alguna razón pueda llegar un path vacío

Describamos eso:

```php
    public function it_should_fail_if_empty_path(): void
    {
        $this->shouldThrow(InvalidArgumentException::class)
             ->during('fromPath', ['']);
    }
```

Lo que dice este ejemplo es que el objeto debería lanzar una excepción `InvalidArgumentException` al ejecutar el método `fromPath`, pasándole los argumentos indicados en el array que en este caso es un path vacío.

Al ejecutar la suite:

```
bin/phpspec run
```

Obtenemos lo siguiente:

```
TalkingBit/CSVRepo/UpdatePricesFromUploadedFile                                   
  21  - it should fail if empty path
      expected to get exception / throwable, none got.

                         66%                                     33%             3
1 specs
3 examples (2 passed, 1 failed)
98ms
```
En donde se nos dice que se espera una excepción y no se obtiene ninguna. El test falla, por lo que debemos implementar algo para que pase:

```php
<?php

namespace TalkingBit\CSVRepo;

use InvalidArgumentException;

class UpdatePricesFromUploadedFile
{
    public function fromPath(string $pathToFile)
    {
        if ('' === $pathToFile) {
            throw new InvalidArgumentException('No path to file provided');
        }
    }
}
```
Al volver a lanzar la especificación, volveremos a verde:

```
                                      100%                                       3
1 specs
3 examples (3 passed)
166ms
```

## Objetos emergentes

¿No os parece que estamos dedicando demasiado tiempo al path del archivo? Esto empieza a oler a que el Use Case se está ocupando de muchas cosas que no deberían ser su responsabilidad. Ha venido aquí para leer un archivo y todavía no ha podido llegar a él. La responsabilidad de asegurarle que el archivo está donde tiene que estar y es legible debería ser de otro objeto. Esto empieza a oler a Value Object.

### Introducing FilePath value object








