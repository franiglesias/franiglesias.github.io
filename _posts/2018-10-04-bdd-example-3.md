---
layout: post
title: Introducción a Behavior Driven Development en PHP (3)
categories: articles
tags: php bdd testing
---

En el [primer artículo de la serie](/bdd-example-1) comenzamos introduciendo el concepto de BDD, el lenguaje Gherkin y la herramienta behat. En el [segundo](/bdd-example-2), utilizamos `PHPSpec` para comenzar a desarrollar nuestra feature, partiendo de un *Use Case* y descubriendo las clases colaboradoras necesarias a medida que identificamos responsabilidades. En esta tercera entrega pretendemos a empezar a unir las piezas.

Al final de la fase anterior conseguimos desarrollar el *Use Case* `UpdatePricesFromUploadedFile` y descubrimos las interfaces de sus colaboradores. Es un buen momento para volver a `FeatureContext` y completar el test de aceptación. Para eso, tenemos que revisar las interfaces generadas, implementar varias cosas y tomar algunas decisiones.

## Por dónde seguimos

Para decidir que empezaríamos por `UpdatePricesFromUploadedFile` lo hicimos sobre la base de que este `Use Case` representa el núcleo de la *Feature* que estamos desarrollando. Ahora nos toca implementar sus colaboradores para poder pasar el test de aceptación.

Nuestra primera tarea es instanciar todos los objetos necesarios. Puesto que solo tenemos interfaces necesitamos implementar clases concretas a partir de ellas. Para poder escribir el código de `FeatureContext` y tener un test que pueda ejecutarse, empezaremos haciendo la implementación mínima ejecutable (expresión que me acabo de inventar, pero que suena tremendamente profesional y *cool*). Básicamente queremos *dummys* para que nuestra *Feature* pueda ejecutarse de principio a fin aunque, de momento, no nos dará resultados viables.

Acabaremos con un código similar al que proponíamos en el primer artículo de la serie y, a partir de ahí, desarrollaremos la funcionalidad que necesitamos.

Pediremos a `PHPSpec` que nos eche una mano en esta tarea, que así será más cómoda.

### FilePath

Aquí tenemos la interfaz de `FilePath`. Como es un Value Object realmente no vamos a necesitar tener varias implementaciones ya que la que necesitamos es la única, por lo tanto, tan solo tenemos que crear la clase y hacer una implementación mínima.

Ya que estamos, aprovecharemos para refinar un poco el código. Por ejemplo, añadiendo el *type hinting* y los *return type* que sean necesarios. Eso hará innecesarios varios tests y aportará solidez a nuestro código. Como contrapartida, nos obligará a trabajar un poquito más, puesto que las implementaciones iniciales serán un poco menos *dummies*.

En fin. Manos a la obra. Aquí tenemos la interfaz de `FilePath`, con el *return type* ya añadido:

```php
<?php

namespace TalkingBit\BddExample\VO;

interface FilePath
{
    public function path(): string;
}
```

Comenzamos diciéndole a PHPSpec que vamos a describir la clase FilePath:

```
bin/PHPSpec describe 'TalkingBit\BddExample\VO\FilePath'
```

Y ejecutamos la *Spec*. Para no tener que ejecutar todas las Specs que tengamos definidas podemos apuntar a la que nos interesa:

```
bin/PHPSpec run 'TalkingBit\BddExample\VO\FilePath'
```

`PHPSpec` detectará que no existe la clase, aunque existe la interfaz, por lo que nos pide permiso para crearla:

```

      TalkingBit\BddExample\VO\FilePath

  11  ! is initializable (87ms)
        class TalkingBit\BddExample\VO\FilePath does not exist.

----  broken examples

        TalkingBit/BddExample/VO/FilePath
  11  ! is initializable (87ms)
        class TalkingBit\BddExample\VO\FilePath does not exist.


1 specs
1 examples (1 broken)
88ms
                                                                                
  Do you want me to create `TalkingBit\BddExample\VO\FilePath` for you?         
                                                                         [Y/n] 

```

Si decimos que sí, puesto que el archivo existe nos preguntará si queremos sobre-escribirlo. Esto ya queda un poco a nuestro gusto, o bien dejamos a `PHPSpec` que cree la clase desde cero (ignorando la interfaz ya existente) o bien modificamos manualmente la interfaz. Nosotros vamos a hacer esto último ya que queremos aprovechar, así que responderemos que no y editaremos el archivo de la interfaz para dejarlo más o menos así:

```php
<?php

namespace TalkingBit\BddExample\VO;

class FilePath
{
    public function path(): string
    {
        return '';
    }
}
```

Al ejecutar la Spec nos dirá que todo va bien. La implementación tonta que tiene el método `path()` nos sirve para evitar el error de tipo. Puedes comprobar que este cambio no afecta a la Spec de `UpdatePricesFromUploadedFile` ejecutando todas con el comando sin argumentos

```
bin/PHPSpec run
```

## Product

En nuestra hipotética aplicación, `Product` sería una entidad de dominio, por lo que tampoco tiene mucho sentido mantener la dualidad interfaz-clase. De nuevo, tan solo queremos tener una una clase instanciable que ya desarrollaremos después.

Seguiremos el mismo proceso que con `FilePath`, por lo que no voy a repetirlo aquí. La interfaz que tenemos es:

```php
<?php

namespace TalkingBit\BddExample;

interface Product
{
    public function setPrice($argument1);
}
```

Reescribimos un poco:

```php
<?php

namespace TalkingBit\BddExample;

interface Product
{
    public function setPrice(float $price): void;
}
```

Generamos la Spec, ejecutando `PHPSpec`:

```
bin/PHPSpec describe 'TalkingBit\BddExample\Product'
```

Y modificamos `Product` para convertirlo en una clase:

```php
<?php

namespace TalkingBit\BddExample;

class Product
{
    public function setPrice(float $price): void
    {
    }
}
```

Finalmente, ejecutamos `PHPSpec` para asegurarnos de que la clase es inicializable.

```
bin/PHPSpec run 'TalkingBit\BddExample\Product'
```

Y ya tenemos, una clase `Product` sin comportamiento, pero suficiente para avanzar.

## ProductRepository y FileReader

Con `ProductRepository` y `FileReader` la cosa cambia un poco. En este caso, necesitamos tanto la interfaz como, al menos, una implementación concreta.

En aplicación del principio de Inversión de Dependencia, la interfaz de `ProductRepository` se define en el Dominio pero se implementa en infrastructura ya que utilizará un mecanismo de persistencia específico, o incluso podría haber varias implementaciones usando distintos mecanismos en función de las necesidades de la aplicación. La cuestión es que eso nos permite aplazar la decisión técnica de qué mecanismo utilizar ya que podemos utilizar implementaciones sencillas para empezar a trabajar y cambiarlas de forma transparente a medida que crecen nuestras necesidades.

`FileReader`, por su parte, se define en la capa de aplicación, pero se implementa en infraestructura. Teniendo en cuenta lo que sabemos, es perfectamente posible que tengamos que crear diversas implementaciones de FileReader, cada una de ellas especializada en un tipo de archivo, en aplicación de un patrón Strategy. De nuevo, podemos aplazar la decisión de qué formato utilizar empezando por uno que nos convenga, como el CSV y cambiarlo si, más adelante, nos conviene más otro.

En ambos casos, de momento vamos a hacer la implementación más simple posible, para poder instanciarlas.

### Product Repository

Como preparación, arreglamos la interfaz:

```php
<?php

namespace TalkingBit\BddExample;

interface ProductRepository
{
    public function getById(string $productId): Product;
}
```

Empezamos describiendo una posible implementación, que será en memoria:

```php
bin/PHPSpec describe 'TalkingBit\BddExample\Persistence\InMemoryProductRepository'
```

Ejecutamos la Spec y damos permiso para crear la clase por nosotros:

```
bin/PHPSpec run 'TalkingBit\BddExample\Persistence\InMemoryProductRepository'
```

Esta es la Spec y vamos a hacer algunas modificaciones ya que queremos que `InMemoryProductRepository` implemente la interfaz `ProductRepository`:

```php
<?php

namespace spec\TalkingBit\BddExample\Persistence;

use TalkingBit\BddExample\Persistence\InMemoryProductRepository;
use PHPSpec\ObjectBehavior;
use Prophecy\Argument;

class InMemoryProductRepositorySpec extends ObjectBehavior
{
    function it_is_initializable()
    {
        $this->shouldHaveType(InMemoryProductRepository::class);
    }
}
```

La dejamos así:

```php
<?php

namespace spec\TalkingBit\BddExample\Persistence;

use TalkingBit\BddExample\Persistence\InMemoryProductRepository;
use PHPSpec\ObjectBehavior;
use Prophecy\Argument;
use TalkingBit\BddExample\ProductRepository;

class InMemoryProductRepositorySpec extends ObjectBehavior
{
    function it_is_initializable()
    {
        $this->shouldHaveType(ProductRepository::class);
    }
}
```

Esto provoca que la Spec falle y nos obliga a cambiar la clase para que implemente la interfaz, lo que nos obligará a incluir el método `getById()`:

```php
<?php

namespace TalkingBit\BddExample\Persistence;

use TalkingBit\BddExample\ProductRepository;

class InMemoryProductRepository implements ProductRepository
{
    public function getById(string $productId): Product
    {
        return new Product(101, 10);
    }
}
```

Y, de momento, tenemos una implementación mínima suficiente.

### FileReader

Con FileReader vamos a hacer lo mismo. Necesitamos una implementación mínima que acabará siendo responsable de leer y preparar archivos CSV. Así que seguiremos los mismos pasos que antes:

Primero, revisamos la interfaz:

```php
<?php

namespace TalkingBit\BddExample\FileReader;

use TalkingBit\BddExample\VO\FilePath;

interface FileReader
{
    public function readFrom(FilePath $filePath): array;
}

```

A continuación, generamos la Spec:

```
bin/PHPSpec describe 'TalkingBit\BddExample\FileReader\CSVFileReader'
```

La cual modificaremos para que se asegure que CSVFileReader implemente FileReader:

```php
<?php

namespace spec\TalkingBit\BddExample\FileReader;

use TalkingBit\BddExample\FileReader\CSVFileReader;
use PHPSpec\ObjectBehavior;
use Prophecy\Argument;
use TalkingBit\BddExample\FileReader\FileReader;

class CSVFileReaderSpec extends ObjectBehavior
{
    function it_is_initializable()
    {
        $this->shouldHaveType(FileReader::class);
    }
}
```

La ejecutamos y se genera la clase básica. La Spec fallará, por lo que debemos implementar lo mínimo necesario para que pase:

```php
<?php

namespace TalkingBit\BddExample\FileReader;

use TalkingBit\BddExample\VO\FilePath;

class CSVFileReader implements FileReader
{
    public function readFrom(FilePath $filePath): array
    {
        return [];
    }
}
```

Y con esto, ya tenemos todas las piezas para montar **FeatureContext**. Aún nos queda mucho trabajo, pero con esto queda bien definido lo que tenemos que hacer a continuación.

## Volviendo a FeatureContext

Es hora de volver a `FeatureContext`. En el capítulo anterior habíamos implementado únicamente el código suficiente para darnos cuenta de que el núcleo de la *Feature* era el *Use Case* `UpdatePricesFromUploadedFile`. Vamos a intentar montarla por completo y descubrir qué más necesitaremos.

Primero vamos a ver dónde estábamos:

```php
<?php

use behat\behat\Context\Context;
use behat\behat\Tester\Exception\PendingException;
use TalkingBit\BddExample\UpdatePricesFromUploadedFile;

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
        $this->pathToFile = $pathToFile;
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
        $this->pathToFile = $pathToFile;
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

Al ejecutar con behat, el test fallará porque `UpdatePricesFromUploadedFile` no se puede construir sin pasarle sus colaboradores. Y esa es nuestra primera tarea:

```php
    public function __construct()
    {
        $this->updatePricesFromUploadedFile = new UpdatePricesFromUploadedFile(
            new InMemoryProductRepository(),
            new CSVFileReader()
        );
    }
```

Con esto podemos ejecutar la Feature, pero aún no tenemos los pasos implementados. Vamos con el primero:

```php
    /**
     * @Given There are current prices in the system
     */
    public function thereAreCurrentPricesInTheSystem()
    {
        throw new PendingException();
    }
```

Para implementar este paso necesitamos añadir Products en `InMemoryProductRepository`, pero es un comportamiento que aún no tiene. Y, para eso, tenemos que poder acceder a la instancia que pasamos a `UpdatePricesFromUploadedFile`. Tenemos que cambiar eso en el constructor y recurriremos a PHPSpec para modelar el comportamiento de guardar Products en el repositorio.

Así es como queremos usarlo:

```
    public function __construct()
    {
        $this->productRepository = new InMemoryProductRepository();
        $this->updatePricesFromUploadedFile = new UpdatePricesFromUploadedFile(
            $this->productRepository,
            new CSVFileReader()
        );
    }

    /**
     * @Given There are current prices in the system
     */
    public function thereAreCurrentPricesInTheSystem()
    {
        $this->productRepository->store(new Product(101, 10.25));
        $this->productRepository->store(new Product(102, 14.95));
    }
```

Si ejecutamos `behat` vemos que esto empieza a ponerse interesante:

```
bin/behat
```

```
Feature: Massively update product prices when needed
  As Sales Manager
  I want to be able to massively update product prices
  In order to invoice our customers with the latest prices

  Scenario: Update uploading a csv file with new prices             # features/massiveUpdate.feature:6
    Given There are current prices in the system                    # FeatureContext::thereAreCurrentPricesInTheSystem()
      Fatal error: Call to undefined method TalkingBit\BddExample\Persistence\InMemoryProductRepository::store() (behat\Testwork\Call\Exception\FatalThrowableError)
    And I have a file named "prices_update.csv" with the new prices # FeatureContext::iHaveAFileNamedWithTheNewPrices()
    When I upload the file                                          # FeatureContext::iUploadTheFile()
    Then Changes are applied to the current prices                  # FeatureContext::changesAreAppliedToTheCurrentPrices()

  Scenario: Update fails because an invalid file                 # features/massiveUpdate.feature:12
    Given There are current prices in the system                 # FeatureContext::thereAreCurrentPricesInTheSystem()
      Fatal error: Call to undefined method TalkingBit\BddExample\Persistence\InMemoryProductRepository::store() (behat\Testwork\Call\Exception\FatalThrowableError)
    And I have a file named "invalid_data.csv" with invalid data # FeatureContext::iHaveAFileNamedWithInvalidData()
    When I upload the file                                       # FeatureContext::iUploadTheFile()
    Then A message is shown explaining the problem               # FeatureContext::aMessageIsShownExplainingTheProblem()
    And Changes are not applied to the current prices            # FeatureContext::changesAreNotAppliedToTheCurrentPrices()

  Scenario: Update fails because a system error                     # features/massiveUpdate.feature:19
    Given There are current prices in the system                    # FeatureContext::thereAreCurrentPricesInTheSystem()
      Fatal error: Call to undefined method TalkingBit\BddExample\Persistence\InMemoryProductRepository::store() (behat\Testwork\Call\Exception\FatalThrowableError)
    And I have a file named "prices_update.csv" with the new prices # FeatureContext::iHaveAFileNamedWithTheNewPrices()
    When I upload the file                                          # FeatureContext::iUploadTheFile()
    And There is an error in the system                             # FeatureContext::thereIsAnErrorInTheSystem()
    Then A message is shown explaining the problem                  # FeatureContext::aMessageIsShownExplainingTheProblem()
    And Changes are not applied to the current prices               # FeatureContext::changesAreNotAppliedToTheCurrentPrices()

--- Failed scenarios:

    features/massiveUpdate.feature:6
    features/massiveUpdate.feature:12
    features/massiveUpdate.feature:19

3 scenarios (3 failed)
15 steps (3 failed, 12 skipped)
0m0.12s (7.17Mb)
```

La utilidad nos informa de que hay varios escenarios que fallan. ¿Varios? Sí. Todos los escenarios comparten el paso **Given There are current prices in the system**, que falla porque `InMemoryProductRepository` no tiene un método `store`. 

Ahora podríamos escribir el código mínimo que haga pasar el escenario, aunque no tenga comportamiento, dejando para más tarde implementarlo. La otra opción, por supuesto, es hacerlo ahora con la ayuda de **PHPSpec**.

Nosotros vamos a optar por la primera posibilidad y hacer una implementación mínima del método `store()`, el cual debemos añadir a la interfaz ProductRepository.

```php
<?php

namespace TalkingBit\BddExample;

interface ProductRepository
{
    public function getById(string $productId): Product;

    public function store(Product $product): void;
}
```

```php
<?php

namespace TalkingBit\BddExample\Persistence;

use TalkingBit\BddExample\Product;
use TalkingBit\BddExample\ProductRepository;

class InMemoryProductRepository implements ProductRepository
{
    public function getById(string $productId): Product
    {
        return new Product(101, 10);
    }

    public function store(Product $product): void
    {
        // TODO: Implement store() method.
    }
}
```

Con esto conseguimos que el primer paso de los escenarios se ejecute. Vamos con el siguiente:

```php
    /**
     * @Given I have a file named :pathToFile with the new prices
     */
    public function iHaveAFileNamedWithTheNewPrices(string $pathToFile)
    {
        $pathToFile = '/var/tmp/'.$pathToFile;
        $data = <<<EOD
product_id,price
101,17
103,23
EOD;
        file_put_contents($pathToFile, $data);
        $this->pathToFile = new FilePath($pathToFile);
    }
```

Este paso nos plantea dos problemas interesantes.

El más evidente es el hecho de tener que crear un archivo con unos datos de ejemplo. La pregunta es: ¿no deberían estar estos datos en el Gherkin de la Feature? Al fin y al cabo, los ejemplos siempre deberían ser proporcionados por negocio, de modo que sean representativos. También por razones de transparencia: ¿cómo podemos argumentar que hemos probado casos adecuados si su definición está en el código del test?. Y, finalmente, por replicabilidad: podríamos querer probar la misma Feature con otro test, incluso en otro lenguaje.

La otra pregunta es un poco menos evidente y tiene que ver más con la implementación del test. Los argumentos que pasamos a los pasos son siempre números o strings pero muchas veces usamos esos datos para instanciar objetos: ¿hay forma de automatizar eso?

Vamos a ver la respuesta a ambas preguntas:

### Tablas de datos en una Feature

El lenguaje Gherkin nos permite definir ejemplos de colecciones de datos en forma de tablas y `behat` nos proporciona herramientas para utilizar esos ejemplos en el test. En realidad lo único que tenemos que hacer es añadir la tabla delimitando las columnas con el carácter pipe (|). La primera línea debería darnos los nombres de las columnas. Por lo tanto, cambiaremos el escenario para hacerlo así

```gherkin
  Scenario: Update uploading a csv file with new prices
    Given There are current prices in the system
    And I have a file named "prices_update.csv" with the new prices
    | product_id | new_price |
    | 101        | 17        |
    | 103        | 23        |
    When I upload the file
    Then Changes are applied to the current prices
```

Si ejecutamos ahora `behat` no observaremos ningún cambio ya que nada altera el modo en que se reconoce el paso. Ahora vamos a ver cómo recogemos los datos de la tabla en la definición del paso:

```php
    /**
     * @Given I have a file named :pathToFile with the new prices
     */
    public function iHaveAFileNamedWithTheNewPrices(string $pathToFile, TableNode $table)
    {
        $this->pathToFile = new FilePath('/var/tmp/'.$pathToFile);

        $file = fopen('/var/tmp/'.$pathToFile, 'w');
 
        $header = true;
        foreach ($table as $row) {
            if ($header) {
                fputcsv($file, array_keys($row));
                $header = false;
            }
            fputcsv($file, $row);
        }
        fclose($file);
    }
```

Si ahora ejecutas:

```
bin/behat
```
Veras que el paso se ejecuta y que el archivo se ha creado en la ubicación especificada:

```
cat /var/tmp/prices_update.csv
```

También descubrirás que hay un paso del tercer escenario que falla ya que usa la misma definición pero no hemos especificado datos en el ejemplo, por lo que no hay `$tabla` que se pueda generar.

```
  Scenario: Update fails because a system error                     # features/massiveUpdate.feature:22
    Given There are current prices in the system                    # FeatureContext::thereAreCurrentPricesInTheSystem()
    And I have a file named "prices_update.csv" with the new prices # FeatureContext::iHaveAFileNamedWithTheNewPrices()
      Can not find a matching value for an argument `$table` of the method `FeatureContext::iHaveAFileNamedWithTheNewPrices()`.
    When I upload the file                                          # FeatureContext::iUploadTheFile()
    And There is an error in the system                             # FeatureContext::thereIsAnErrorInTheSystem()
    Then A message is shown explaining the problem                  # FeatureContext::aMessageIsShownExplainingTheProblem()
    And Changes are not applied to the current prices               # FeatureContext::changesAreNotAppliedToTheCurrentPrices()
```

Esto nos lleva a pensar que deberíamos modificar otros pasos en el mismo sentido. Cuando nuestros escenarios dicen que existen datos de productos, no estaría de más, definir ejemplos de esos datos.

Además de las tablas, también es posible introducir textos largos como argumentos mediante las llamadas pystrings, que veremos en otro momento.

### Parámetros que son objetos

Como estamos viendo, los tipos de parámetros que podemos pasar son bastante simples. Puede ocurrir que nos interese construir objetos a partir de ellos o hacer un type casting para asegurarnos de que son del tipo necesario para usarlos.

La cuestión es que podemos extraer la transformación necesaria a un método y definirlo como Transformación de modo que `behat` sabe que al recibir un parámetro debe pasarlo antes al método indicado.

Para ver un ejemplo sencillo, usaremos el caso del parámetro `$pathToFile` que vamos a transformar en un objeto FilePath.

Primero extraemos el método:

```php
    public function getFilePath(string $pathToFile): FilePath
    {
        return new FilePath('/var/tmp/'.$pathToFile);
    }
```

Y luego, le añadimos una anotación que haga un match con el argumento que queremos transformar, ya sea por nombre o mediante una expresión regular:

E indicamos en la signatura de la definición del paso el nuevo tipo que esperamos:

```php
    /**
     * @Given I have a file named :pathToFile with the new prices
     */
    public function iHaveAFileNamedWithTheNewPrices(FilePath $pathToFile, TableNode $table)
    {
        $this->pathToFile = $pathToFile;
        $file = fopen($this->pathToFile->path(), 'w');

        $header = true;
        foreach ($table as $row) {
            if ($header) {
                fputcsv($file, array_keys($row));
                $header = false;
            }
            fputcsv($file, $row);
        }
        fclose($file);
    }
```

Este paso va a fallar porque no hemos implementado `path()` todavía. Pero es una buena noticia ya que ese error nos confirma que `$pathToFile` es ahora un objeto FilePath.

Para poder continuar hacemos una implementación mínima que nos permita hacer pasar el test:

```php
<?php

namespace TalkingBit\BddExample\VO;

class FilePath
{
    /** @var string */
    private $path;

    public function __construct(string $path)
    {
        $this->path = $path;
    }
    
    public function path(): string
    {
        return $this->path;
    }
}
```

Con este cambio el paso se ejecuta y vemos que también pasa el siguiente, que ya habíamos implementado. Así que ahora podemos retomar el problema de la falta de ejemplos en el repositorio de productos que, por lo demás, también nos ayudará a preparar el último paso de nuestro primer escenario.

### Llenar un repositorio con ejemplos
    
Los pasos inicial y final del primer escenario requieren datos de ejemplo que no han sido especificados en la Feature. Por tanto, hemos incrustado algunos en el código. Al margen de que sean buenos ejemplos o no, deberían estar en la *Feature*. Y deberían estar porque es Negocio quien debería tener la última palabra sobre qué ejemplos son relevantes y cuáles no  y porque es la *Feature* el documento compartido sobre el que trabajamos tanto Negocio como Desarrollo. Por lo tanto, deberíamos volver a hablar con Negocio para corregir esa situación.

*Nota al margen*: en un caso real medianamente bien definido los ejemplos estarían o deberían estar desde el principio en el documento de la Feature, pero para estos artículos prefiero adoptar este enfoque aparentemente más errático. Por un lado, me permite avanzar desde lo más básico a temas avanzados, pero también hace que lo podamos ver en el contexto de una necesidad y, por tanto, entender cuándo tiene sentido aplicarlos. Fin de la nota.

Por tanto, añadiremos ejemplos en la feature, de esta manera:

```gherkin
Feature: Massively update product prices when needed
  As Sales Manager
  I want to be able to massively update product prices
  In order to invoice our customers with the latest prices

  Scenario: Update uploading a csv file with new prices
    Given There are current prices in the system
      | id  | name      | price |
      | 101 | Product 1 | 10.25 |
      | 102 | Product 2 | 14.95 |
      | 103 | Product 3 | 21.75 |
    And I have a file named "prices_update.csv" with the new prices
      | product_id | new_price |
      | 101        | 17        |
      | 103        | 23        |
    When I upload the file
    Then Changes are applied to the current prices
      | id  | name      | price |
      | 101 | Product 1 | 17.00 |
      | 102 | Product 2 | 14.95 |
      | 103 | Product 3 | 23.00 |

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

Para no complicarnos, de momento no he añadido los ejemplos a los otros escenarios y me centraré en el primero de ellos. Más adelante terminaremos la feature completa.

En principio, este cambio no afectará al resultado de ejecutar `behat` ya que no hemos cambiado ni el paso en sí, ni su definición.

Ahora, para poder almacenar productos en el repositorio tenemos que esperar en la definición por la tabla de datos y recorrerla instanciando los productos:

```php
    /**
     * @Given There are current prices in the system
     */
    public function thereAreCurrentPricesInTheSystem(TableNode $productTable)
    {
        foreach ($productTable as $productRow) {
            $product = new Product(
                $productRow['id'],
                $productRow['name'],
                $productRow['price']
            );
            $this->productRepository->store($product);
        }
    }
```

Ahora, si ejecutamos `behat` el resultado sigue siendo el mismo. Nosotros sabemos que no hay nada implementado en `InMemoryProductRepository`, pero el test pasa y eso es lo que nos importa en este momento. Hacemos las cosas a medida que las necesitamos.

Esto nos lleva al último paso, en el que debemos comprobar que el Use Case ha producido un efecto en nuestra aplicación.

## Llega el verdadero test

Los pasos **Then** son los pasos en los que debemos asegurar que se ha producido el resultado esperado. En este ejemplo, esperamos que los productos tengan el nuevo precio, así que parece bastante razonable consultar cada producto y ver si su precio es el que esperábamos tener.

En la feature hemos puesto una tabla de los productos existentes y cómo deberían haber quedado tras la actualización. Este paso podemos definirlo así:

```php
    /**
     * @Then Changes are applied to the current prices
     */
    public function changesAreAppliedToTheCurrentPrices(TableNode $productTable)
    {
        foreach ($productTable as $productRow) {
            $product = $this->productRepository->getById($productRow['id']);
            Assert::assertEquals($productRow['price'], $product->price());
        }
    }
```

Al ejecutar `behat` vemos que el test no pasa.

En primer lugar, nos dice que el método price() de Product no existe, así que deberíamos implementarlo. Por otra parte, podemos ver que tampoco tenemos constructor en Product y que esperamos pasarle tres parámetros inicialmente. Como es una implementación bastante trivial la hacemos:

```php
<?php

namespace TalkingBit\BddExample;

class Product
{
    /** @var int */
    private $id;
    /** @var string */
    private $name;
    /** @var float */
    private $price;

    public function __construct(int $id, string $name, float $price)
    {
        $this->id = $id;
        $this->name = $name;
        $this->price = $price;
    }
    
    public function setPrice(float $price): void
    {
    }

    /**
     * @return float
     */
    public function price(): float
    {
        return $this->price;
    }
}
```

Volvemos a lanzar `behat` para que nos diga por dónde seguir:

```
    Then Changes are applied to the current prices                  # FeatureContext::changesAreAppliedToTheCurrentPrices()
      | id  | name      | price |
      | 101 | Product 1 | 17.00 |
      | 102 | Product 2 | 14.95 |
      | 103 | Product 3 | 23.00 |
      Type error: Too few arguments to function TalkingBit\BddExample\Product::__construct(), 2 passed in src/TalkingBit/BddExample/Persistence/InMemoryProductRepository.php on line 12 and exactly 3 expected (behat\Testwork\Call\Exception\FatalThrowableError)
```

Este mensaje nos dice que tenemos una implementación incorrecta en InMemoryProductRepository. Recuerda que, de momento, habíamos puesto una implementación mínima, pero ahora tenemos que hacer algo más elaborado. Este es el código problemático:

```
    public function getById(string $productId): Product
    {
        return new Product(101, 10);
    }
```

El mínimo para hacer pasar el test es construir un Product correctamente. 

```php
    public function getById(string $productId): Product
    {
        return new Product(101, 'Product 1', 10);
    }
```

No es la implementación definitiva, ni muchísimo menos, pero nos permitirá seguir adelante y conseguir "mejores errores" al ejecutar `behat`. Mejores errores como éste:

```
    Then Changes are applied to the current prices                  # FeatureContext::changesAreAppliedToTheCurrentPrices()
      | id  | name      | price |
      | 101 | Product 1 | 17.00 |
      | 102 | Product 2 | 14.95 |
      | 103 | Product 3 | 23.00 |
      Failed asserting that 10.0 matches expected '17.00'.
```

Esto ya suena a test que no pasa. En parte, gracias a que hemos utilizado las asserts de `PHPUnit` pues lanzan excepciones en caso de que no se cumplan. No es necesario usarlas ya que basta lanzar una excepción si observamos que el resultado obtenido no es el esperado, pero nos ahorran mucho trabajo.

La cuestión es que este mensaje nos está diciendo que ya es la hora de implementar ProductRepository.

Podemos empezar haciendo un cambio mínimo en ProductRepository, haciendo que el producto que devuelve tenga un precio de 17.00. Parece algo tonto, pero es bueno para nosotros:

```php
    public function getById(string $productId): Product
    {
        return new Product(101, 'Product 1', 17);
    }
```

El error ya nos dice qué hay que hacer a continuación:

```
    Then Changes are applied to the current prices                  # FeatureContext::changesAreAppliedToTheCurrentPrices()
      | id  | name      | price |
      | 101 | Product 1 | 17.00 |
      | 102 | Product 2 | 14.95 |
      | 103 | Product 3 | 23.00 |
      Failed asserting that 17.0 matches expected '14.95'.

```

Nos dice que no podemos devolver siempre el mismo producto. Por tanto, ha llegado de implementar un repositorio que sea funcional.

### Volvamos a describir comportamiento

La implementación de un repositorio, aunque sea de tipo in memory, no es tan trivial como las que hemos tenido que hacer hasta ahora. Por esa razón retomaremos `PHPSpec` a fin de desarrollarlo. Esto es un buen ejemplo del uso combinado de las dos herramientas. `behat` nos permite ir de la historia de usuario y descubrir los elementos que necesitamos, mientas que PHPSpec nos ayuda en el desarrollo de los mismos.

Como recordarás (espero) tenemos una Spec muy simple que demuestra que nuestro repositorio se puede instanciar, pero nada más. Lo que sí sabemos, gracias a lo que hemos estado haciendo hasta ahora, es que queremos describir dos comportamientos:

* Guardar productos
* Recuperar productos conociendo su id

Así que vamos a ello.

#### Guardar productos 

Podríamos describir así este comportamiento:

```php
    public function it_should_store_products(Product $product)
    {
        $this->store($product);
    }
```

Pero claro: esto no demuestra gran cosa y, de hecho, no nos obliga a implementar nada. Necesitamos saber que efectivamente se guardan productos a través de un método de la interfaz ProductRepository. Parece bastante razonable utilizar `getById()` para comprobarlo.

```php

      TalkingBit\BddExample\Persistence\InMemoryProductRepository

  13  ✔ is initializable (141ms)
  18  ! should store products (58ms)
        method `Double\TalkingBit\BddExample\Product\P1::id()` is not defined.

----  broken examples

        TalkingBit/BddExample/Persistence/InMemoryProductRepository
  18  ! should store products (58ms)
        method `Double\TalkingBit\BddExample\Product\P1::id()` is not defined.


1 specs
2 examples (1 passed, 1 broken)
200ms
```

Todavía no habíamos implementado un método `id()` con el que obtener el id de `Product`, así que lo hacemos ahora para poder ejecutar el test. Una vez hecho esto, volvemos a ejecutar la *Spec*, que esta vez falla porque no se está devolviendo el objeto `Product` que debería estar almacenado.

```php

      TalkingBit\BddExample\Persistence\InMemoryProductRepository

  13  ✔ is initializable
  18  ✘ should store products (54ms)
        expected [obj:Double\TalkingBit\BddExample\Product\P1], but got
        [obj:TalkingBit\BddExample\Product].

----  failed examples

        TalkingBit/BddExample/Persistence/InMemoryProductRepository
  18  ✘ should store products (54ms)
        expected [obj:Double\TalkingBit\BddExample\Product\P1], but got
        [obj:TalkingBit\BddExample\Product].


1 specs
2 examples (1 passed, 1 failed)
61ms
```

Obviamente esto nos lleva a implementar algo para que la Spec pueda pasar completa:

```php
<?php

namespace TalkingBit\BddExample\Persistence;

use TalkingBit\BddExample\Product;
use TalkingBit\BddExample\ProductRepository;

class InMemoryProductRepository implements ProductRepository
{
    private $product;

    public function getById(string $productId): Product
    {
        return $this->product;
    }

    public function store(Product $product): void
    {
        $this->product = $product;
    }
}
```

Con esto la Spec pasa:

```

      TalkingBit\BddExample\Persistence\InMemoryProductRepository

  13  ✔ is initializable
  18  ✔ should store products


1 specs
2 examples (2 passed)
12ms
```

Pero, ¿qué ocurriría con nuestra *feature*?. Lancemos `behat`, que devuelve esto:

```
Feature: Massively update product prices when needed
  As Sales Manager
  I want to be able to massively update product prices
  In order to invoice our customers with the latest prices

  Scenario: Update uploading a csv file with new prices             # features/massiveUpdate.feature:6
    Given There are current prices in the system                    # FeatureContext::thereAreCurrentPricesInTheSystem()
      | id  | name      | price |
      | 101 | Product 1 | 10.25 |
      | 102 | Product 2 | 14.95 |
      | 103 | Product 3 | 21.75 |
    And I have a file named "prices_update.csv" with the new prices # FeatureContext::iHaveAFileNamedWithTheNewPrices()
      | product_id | new_price |
      | 101        | 17        |
      | 103        | 23        |
    When I upload the file                                          # FeatureContext::iUploadTheFile()
    Then Changes are applied to the current prices                  # FeatureContext::changesAreAppliedToTheCurrentPrices()
      | id  | name      | price |
      | 101 | Product 1 | 17.00 |
      | 102 | Product 2 | 14.95 |
      | 103 | Product 3 | 23.00 |
      Failed asserting that 21.75 matches expected '17.00'.
```

Pues que sigue fallando, pero de una manera distinta. 

#### Recuperar precios

Nuestro repositorio solo está almacenando el último `Product` que introducimos, por lo que deberíamos describir mejor su comportamiento. Volvamos a `PHPSpec`, porque aunque lo hemos usado no hemos descrito el comportamiento que esperamos de `getById()`:


```php
    public function it_should_retrieve_a_product_specified_by_its_id(Product $product1, Product $product2)
    {
        $product1->id()->willReturn(1);
        $product2->id()->willReturn(2);
        
        $this->store($product1);
        $this->store($product2);
        
        $this->getById(1)->shouldBe($product1);
        $this->getById(2)->shouldBe($product2);
    }
```

La Spec fallará, como era de esperar:

```

      TalkingBit\BddExample\Persistence\InMemoryProductRepository

  13  ✔ is initializable
  18  ✔ should store products
  25  ✘ should retrieve a product specified by its id
        expected [obj:Double\TalkingBit\BddExample\Product\P2], but got
        [obj:Double\TalkingBit\BddExample\Product\P3].

----  failed examples

        TalkingBit/BddExample/Persistence/InMemoryProductRepository
  25  ✘ should retrieve a product specified by its id
        expected [obj:Double\TalkingBit\BddExample\Product\P2], but got
        [obj:Double\TalkingBit\BddExample\Product\P3].


1 specs
3 examples (2 passed, 1 failed)
14ms
```

Así que implementamos una solución de lo más sencilla:

```php
<?php

namespace TalkingBit\BddExample\Persistence;

use TalkingBit\BddExample\Product;
use TalkingBit\BddExample\ProductRepository;

class InMemoryProductRepository implements ProductRepository
{
    private $products;

    public function getById(string $productId): Product
    {
        return $this->products[$productId];
    }

    public function store(Product $product): void
    {
        $this->products[$product->id()] = $product;
    }
}
```

Que nos permite hacer que pase la Spec:

```

      TalkingBit\BddExample\Persistence\InMemoryProductRepository

  13  ✔ is initializable
  18  ✔ should store products
  25  ✔ should retrieve a product specified by its id


1 specs
3 examples (3 passed)
31ms
```

Volvamos a ejecutar la feature con behat, a ver qué hemos logrado:

```
  Scenario: Update uploading a csv file with new prices             # features/massiveUpdate.feature:6
    Given There are current prices in the system                    # FeatureContext::thereAreCurrentPricesInTheSystem()
      | id  | name      | price |
      | 101 | Product 1 | 10.25 |
      | 102 | Product 2 | 14.95 |
      | 103 | Product 3 | 21.75 |
    And I have a file named "prices_update.csv" with the new prices # FeatureContext::iHaveAFileNamedWithTheNewPrices()
      | product_id | new_price |
      | 101        | 17        |
      | 103        | 23        |
    When I upload the file                                          # FeatureContext::iUploadTheFile()
    Then Changes are applied to the current prices                  # FeatureContext::changesAreAppliedToTheCurrentPrices()
      | id  | name      | price |
      | 101 | Product 1 | 17.00 |
      | 102 | Product 2 | 14.95 |
      | 103 | Product 3 | 23.00 |
      Failed asserting that 10.25 matches expected '17.00'.
```

Por supuesto, sigue fallando, pero ahora no podemos atribuir ese fallo al comportamiento de `InMemoryProductRepository` porque gracias a la Spec sabemos que es el deseable, aunque no hay duda de que puede mejorar.

La conclusión que podemos sacar es que los precios no se están actualizando y eso es debido, como cabría esperar, a que que `CSVFileReader` no implementa ningún comportamiento.

### El comportamiento de CSVFileReader

¿Qué ocurre con `CSVFileReader`? Pues fundamentalmente ocurre que no hace lo que dice que hace. Esto es: no lee archivos.

Como puedes imaginar, volveremos con PHPSpec para describir el comportamiento de CSVFileReader e implementarlo.

```php
<?php

namespace spec\TalkingBit\BddExample\FileReader;

use TalkingBit\BddExample\FileReader\CSVFileReader;
use PHPSpec\ObjectBehavior;
use Prophecy\Argument;
use TalkingBit\BddExample\FileReader\FileReader;
use TalkingBit\BddExample\VO\FilePath;

class CSVFileReaderSpec extends ObjectBehavior
{
    function it_is_initializable()
    {
        $this->shouldHaveType(FileReader::class);
    }

    public function it_should_read_a_file_with_one_line(FilePath $filePath)
    {
        $pathToFile = '/var/tmp/one_line_file.csv';
        $data = <<< EOD
101, 10
EOD;

        touch('' . $pathToFile);
        file_put_contents($pathToFile, $data);
        $filePath->path()->willReturn($pathToFile);
        $this->readFrom($filePath)->shouldHaveCount(1);
        unlink($pathToFile);
    }
}
```

Esta primera Spec fallará, por lo que vamos a implementarla:

```php
<?php

namespace TalkingBit\BddExample\FileReader;

use TalkingBit\BddExample\VO\FilePath;

class CSVFileReader implements FileReader
{
    public function readFrom(FilePath $filePath): array
    {
        return [
            'data'
        ];
    }
}
```

Con esto ya pasa, pero quizá no sea suficiente.

Describir el comportamiento de CSVFileReader va a requerir algo más de esfuerzo:

```php
<?php

namespace spec\TalkingBit\BddExample\FileReader;

use PHPSpec\ObjectBehavior;
use TalkingBit\BddExample\FileReader\FileReader;
use TalkingBit\BddExample\VO\FilePath;

class CSVFileReaderSpec extends ObjectBehavior
{
    function it_is_initializable()
    {
        $this->shouldHaveType(FileReader::class);
    }

    public function it_should_read_a_file_with_one_line(FilePath $filePath)
    {
        $pathToFile = '/var/tmp/one_line_file.csv';
        $data = <<< EOD
101,10
EOD;

        touch('' . $pathToFile);
        file_put_contents($pathToFile, $data);
        $filePath->path()->willReturn($pathToFile);
        $this->readFrom($filePath)->shouldHaveCount(1);
        unlink($pathToFile);
    }

    public function it_should_read_csv_files_with_headers_and_data(FilePath $filePath)
    {
        $pathToFile = '/var/tmp/headers_and_data_file.csv';
        $data = <<< EOD
id,price
101,10
102,14
EOD;

        $expected = [
            [
                'id' => '101',
                'price' => '10'
            ],
            [
                'id' => '102',
                'price' => '14'
            ]
        ];

        touch($pathToFile);
        file_put_contents($pathToFile, $data);
        $filePath->path()->willReturn($pathToFile);
        $this->readFrom($filePath)->shouldHaveCount(2);
        $this->readFrom($filePath)->shouldBe($expected);
        unlink($pathToFile);
    }
}
```

Esto ya requiere algo más de implementación. Vamos a ello:

```php
<?php

namespace spec\TalkingBit\BddExample\FileReader;

use PHPSpec\ObjectBehavior;
use TalkingBit\BddExample\FileReader\FileReader;
use TalkingBit\BddExample\VO\FilePath;

class CSVFileReaderSpec extends ObjectBehavior
{
    function it_is_initializable()
    {
        $this->shouldHaveType(FileReader::class);
    }

    public function it_should_read_a_file_with_one_line(FilePath $filePath)
    {
        $pathToFile = '/var/tmp/one_line_file.csv';
        $data = <<< EOD
101,10
EOD;

        touch('' . $pathToFile);
        file_put_contents($pathToFile, $data);
        $filePath->path()->willReturn($pathToFile);
        $this->readFrom($filePath)->shouldHaveCount(1);
        unlink($pathToFile);
    }

    public function it_should_read_csv_files_with_headers_and_data(FilePath $filePath)
    {
        $pathToFile = '/var/tmp/headers_and_data_file.csv';
        $data = <<< EOD
id,price
101,10
102,14
EOD;

        $expected = [
            [
                'id' => '101',
                'price' => '10'
            ],
            [
                'id' => '102',
                'price' => '14'
            ]
        ];

        touch($pathToFile);
        file_put_contents($pathToFile, $data);
        $filePath->path()->willReturn($pathToFile);
        $this->readFrom($filePath)->shouldHaveCount(2);
        $this->readFrom($filePath)->shouldBe($expected);
        unlink($pathToFile);
    }
}
```

Esta implementación hará fallar el anterior ejemplo, en el cual probábamos un csv sin cabeceras. Lo podemos solucionar de forma relativamente fácil, mediante una "basurita" que nos permita hacer pasar el test:

```php
    public function readFrom(FilePath $filePath): array
    {
        $data = [];
        $csvFile = fopen($filePath->path(), 'r');
        $headers = fgetcsv($csvFile);
        while ($row = fgetcsv($csvFile)) {
            $data[] = array_combine($headers, $row);
        }
        if (empty($data) && $headers) {
            return [$headers];
        }
        return $data;
    }
```

Sin embargo, debemos hacer una reflexión aquí: ¿hemos elegido ejemplos adecuados? No hay nada en la definición de la *feature* que nos diga que CSVFileReader deba manejar este tipo de situaciones. En realidad nos dice que debería fallar si encuentra un archivo vacío o no válido, aunque no hayamos llegado todavía a desarrollar para cumplir esos escenarios.

Un problema cuando necesitamos implementar clases de utilidad como parte de una historia de usuario es que es fácil caer en la tentación de abstraernos de esa historia y tratar de desarrollar esas clases para cubrir toda la casuística, aunque no la necesitemos para el compromiso que hemos adquirido en ese momento.

Este no quiere decir que no debamos hacerlo bajo ningún concepto, sino que deberíamos priorizarlo correctamente: primero, cubriendo las especificaciones derivadas de la historia de usuario, a medida que se plantean, haciendo evolucionar el código para adaptarse a los requisitos que se van introduciendo. Eso es lo que nos permite llegar al MVP y a garantizar la entrega.

## Cumpliendo el primer escenario

Si ejecutamos `behat` ahora, comprobaremos que el último paso del escenario sigue sin pasar. Eso indica que nos falta implementar algo. De nuevo, podemos observar que el mensaje cambia:

```
    Then Changes are applied to the current prices                  # FeatureContext::changesAreAppliedToTheCurrentPrices()
      | id  | name      | price |
      | 101 | Product 1 | 17.00 |
      | 102 | Product 2 | 14.95 |
      | 103 | Product 3 | 23.00 |
      Failed asserting that 10.25 matches expected '17.00'.
```

Nos dice que vuelve a fallar en el primer producto de la tabla. Recuerda que siempre que estamos haciendo implementación estamos buscando la mínima que nos permita pasar cada test, por lo que es posible que este último paso haya generado un cambio que revela que nos falta algo por escribir.

Sabemos que las implementaciones de `InMemoryProductRepository` y de `CSVFileReader` son suficientemente completas como para no ser la causa de este fallo. Así que vamos a mirar de nuevo el código del UseCase `UpdatePricesFromUploadedFile` para ver cuál es la ficha que aún no hemos colocado:

```php
    public function usingFile(FilePath $pathToFile)
    {
        $data = $this->fileReader->readFrom($pathToFile);
        foreach ($data as $row) {
            $product = $this->productRepository->getById($row['product_id']);
            $product->setPrice($row['new_price']);
        }
    }
```

¿Hemos implementado `setPrice()` en `Product`? La respuesta es no, pero hacerlo es trivial:

```php
<?php

namespace TalkingBit\BddExample;

class Product
{
    /** @var int */
    private $id;
    /** @var string */
    private $name;
    /** @var float */
    private $price;

    public function __construct(int $id, string $name, float $price)
    {
        $this->id = $id;
        $this->name = $name;
        $this->price = $price;
    }

    public function setPrice(float $price): void
    {
        $this->price = $price;
    }

    public function price(): float
    {
        return $this->price;
    }

    public function id(): int
    {
        return $this->id;
    }
}
```

Finalmente:

```
  Scenario: Update uploading a csv file with new prices             # features/massiveUpdate.feature:6
    Given There are current prices in the system                    # FeatureContext::thereAreCurrentPricesInTheSystem()
      | id  | name      | price |
      | 101 | Product 1 | 10.25 |
      | 102 | Product 2 | 14.95 |
      | 103 | Product 3 | 21.75 |
    And I have a file named "prices_update.csv" with the new prices # FeatureContext::iHaveAFileNamedWithTheNewPrices()
      | product_id | new_price |
      | 101        | 17        |
      | 103        | 23        |
    When I upload the file                                          # FeatureContext::iUploadTheFile()
    Then Changes are applied to the current prices                  # FeatureContext::changesAreAppliedToTheCurrentPrices()
      | id  | name      | price |
      | 101 | Product 1 | 17.00 |
      | 102 | Product 2 | 14.95 |
      | 103 | Product 3 | 23.00 |
```

Y con esto, por fin hemos hecho que nuestro escenario pase.

## Qué hemos logrado

Hemos comenzado el viaje con una historia de usuario, más o menos representativa, pero definida con la ayuda del lenguaje Gherkin, expresada tanto en valor de negocio como en una serie de escenarios ejecutables que definen criterios observables que podemos comprobar programáticamente en un test, cuyo esqueleto hemos generado con la ayuda de `behat`.

A continuación, hemos convertido la historia en un Use Case y lo hemos introducido en el test, de modo que hemos podido decidir cómo querríamos que funcionase, lo cual nos ha llevado a utilizar `PHPSpec` para especificar el comportamiento del propio Use Case.

Esto nos ha llevado a descubrir las entidades, value objects y colaboradores que iban siendo necesarios para que el Use Case pudiese producir efectos en el sistema, combinando el uso de `behat` y `PHPSpec` para lanzar pruebas cuyos fallos nos fuesen indicando qué pasos seguir a continuación: qué teníamos que desarrollar.

Finalmente, tenemos un Use Case implementado que coordina diversos actores para producir el efecto deseado. Todo este comportamiento se encuentra bajo un test que negocio puede validar, así como bajo una serie de test unitarios en forma de Spec que garantizan que el software que acabamos de escribir hace lo que dice que hace.

Nos quedan por completar dos escenarios, así como tener en cuenta varias consideraciones interesantes.

## Avanzando con los escenarios

Para poder seguir probando escenarios tenemos que arreglar los documentos Gherkin del mismo modo que hemos hecho antes. Lo primero es añadir datos de ejemplo, ya que el primer paso de ambos escenarios no se podrá ejecutar sin ellos.

He aquí la feature con todos los datos de ejemplo:

```php
Feature: Massively update product prices when needed
  As Sales Manager
  I want to be able to massively update product prices
  In order to invoice our customers with the latest prices

  Scenario: Update uploading a csv file with new prices
    Given There are current prices in the system
      | id  | name      | price |
      | 101 | Product 1 | 10.25 |
      | 102 | Product 2 | 14.95 |
      | 103 | Product 3 | 21.75 |
    And I have a file named "prices_update.csv" with the new prices
      | product_id | new_price |
      | 101        | 17        |
      | 103        | 23        |
    When I upload the file
    Then Changes are applied to the current prices
      | id  | name      | price |
      | 101 | Product 1 | 17.00 |
      | 102 | Product 2 | 14.95 |
      | 103 | Product 3 | 23.00 |

  Scenario: Update fails because an invalid file
    Given There are current prices in the system
      | id  | name      | price |
      | 101 | Product 1 | 10.25 |
      | 102 | Product 2 | 14.95 |
      | 103 | Product 3 | 21.75 |
    And I have a file named "invalid_data.csv" with invalid data
      | product_id | product_name|
      | 101        | Product 1   |
      | 103        | Product 2   |
    When I upload the file
    Then A message is shown explaining the problem
      """
      The file doesn't contain valid data to update prices
      """
    And Changes are not applied to the current prices
      | id  | name      | price |
      | 101 | Product 1 | 10.25 |
      | 102 | Product 2 | 14.95 |
      | 103 | Product 3 | 21.75 |

  Scenario: Update fails because a system error
    Given There are current prices in the system
      | id  | name      | price |
      | 101 | Product 1 | 10.25 |
      | 102 | Product 2 | 14.95 |
      | 103 | Product 3 | 21.75 |
    And I have a file named "prices_update.csv" with the new prices
      | product_id | new_price |
      | 101        | 17        |
      | 103        | 23        |
    When I upload the file
    And There is an error in the system
    Then A message is shown explaining the problem
      """
      Something went wrong and it was not possible to update prices
      """
    And Changes are not applied to the current prices
      | id  | name      | price |
      | 101 | Product 1 | 10.25 |
      | 102 | Product 2 | 14.95 |
      | 103 | Product 3 | 21.75 |
```

¿Qué ocurrirá cuando la ejecutemos?

Pues lo que ocurre es que alguno de los pasos del segundo y tercer escenario se ejecutan y pasan, mientras que nos indica que hay pasos que no tienen implementación.

Por ejemplo, esto es lo que pasa con el segundo escenario:

```
  Scenario: Update fails because an invalid file                 # features/massiveUpdate.feature:23
    Given There are current prices in the system                 # FeatureContext::thereAreCurrentPricesInTheSystem()
      | id  | name      | price |
      | 101 | Product 1 | 10.25 |
      | 102 | Product 2 | 14.95 |
      | 103 | Product 3 | 21.75 |
    And I have a file named "invalid_data.csv" with invalid data # FeatureContext::iHaveAFileNamedWithInvalidData()
      | product_id | product_name |
      | 101        | Product 1    |
      | 103        | Product 2    |
      TODO: write pending definition
    When I upload the file                                       # FeatureContext::iUploadTheFile()
    Then A message is shown explaining the problem               # FeatureContext::aMessageIsShownExplainingTheProblem()
      """
      The file doesn't contain valid data to update prices
      """
    And Changes are not applied to the current prices            # FeatureContext::changesAreNotAppliedToTheCurrentPrices()
      | id  | name      | price |
      | 101 | Product 1 | 10.25 |
      | 102 | Product 2 | 14.95 |
      | 103 | Product 3 | 21.75 |
```

El segundo paso está pendiente y tendríamos que escribir su definición, así que buscamos el método de `FeatureContext` asociado con ese paso y lo implementamos:

```php
    /**
     * @Given I have a file named :pathToFile with invalid data
     */
    public function iHaveAFileNamedWithInvalidData(FilePath $pathToFile, TableNode $table)
    {
        $this->pathToFile = $pathToFile;
        $file = fopen($this->pathToFile->path(), 'w');

        $header = true;
        foreach ($table as $row) {
            if ($header) {
                fputcsv($file, array_keys($row));
                $header = false;
            }
            fputcsv($file, $row);
        }
        fclose($file);
    }
```

Resulta que es la misma implementación que el paso equivalente del escenario anterior.

Por otro lado, el paso siguiente (subir el archivo) falla puesto que al intentar utilizar los datos del mismo, no cuadran con lo que espera recibir. Tenemos varios temas interesantes aquí, así que vayamos por partes.

Empecemos por considerar que tenemos código idéntico en dos pasos. Esta repetición nos daría pie a un refactor consistente en extraer el método que monta el archivo csv, aprovechando que los pasos implicados están en verde.

Es decir, la definición anterior quedaría así, lo que nos podría ayudar a entender mejor esta definición y apartar de nuestro foco el código auxiliar:

```php
    /**
     * @Given I have a file named :pathToFile with invalid data
     */
    public function iHaveAFileNamedWithInvalidData(FilePath $pathToFile, TableNode $table)
    {
        $this->pathToFile = $pathToFile;
        $this->createCsvFileWithDataFromTable($this->pathToFile->path(), $table);
    }
```

## Implementando pasos que fallan

El paso "**When** I upload the file" debería generar un fallo pero, a la vez, el paso como tal debe ejecutarse y ponerse en verde. Parece un poco contradictorio. Vamos a intentar desentrañar esto:

* El paso simula que el archivo csv ha sido subido al sistema por el usuario.
* El problema surge porque el contenido del archivo no está estructurado como el Use Case espera.
* Tenemos un servicio CSVFileReader que lee los archivos CSV tengan el formato que tengan y los convierte en arrays. Sin embargo, este servicio no puede validarlo como tal.
* Nos falta que el Use Case valide la estructura de datos leída y, en caso de que no sea la esperada, arroje una excepción que informe del error.

En FeatureContext vamos a hacer que si ocurre una excepción durante el paso se guarde y se procese en el siguiente paso:

```php
    /**
     * @When I upload the file
     */
    public function iUploadTheFile()
    {
        try {
            $this->updatePricesFromUploadedFile->usingFile($this->pathToFile);
        } catch (Throwable $exception) {
            $this->lastException = $exception;
        }
    }
```

Esto permite que el paso se ejecute incluso si el UseCase falla, de modo que se guarda la excepción recibida en una propiedad de FeatureContext y se avanza al siguiente paso, donde compararemos el mensaje de la excepción con el mensaje esperado. No especificamos una excepción concreta porque no la vamos a tratar aquí de forma diferente. Si fuese necesario lo haremos en otro método.

El mensaje esperado lo hemos definido en la feature en un formato denominado *pystring*, delimitando el texto entre comillas triples:

```gherkin
    Then A message is shown explaining the problem
      """
      The file doesn't contain valid data to update prices
      """
```

Eso se maneja en `FeatureContext` con un tipo `PyStringNode`, el cual nos permite obtener el texto con el método `getRaw()`, así de simple:

```php
    /**
     * @Then A message is shown explaining the problem
     */
    public function aMessageIsShownExplainingTheProblem(PyStringNode $expectedMessage)
    {
        $message = $this->lastException->getMessage();
        Assert::assertEquals($expectedMessage->getRaw(), $message);
    }
```

Ahora, al ejecutar `behat` obtenemos un mensaje más interesante que nos dice que aunque ha fallado la importación de los datos no obtenemos el error esperado.

```
  Scenario: Update fails because an invalid file                 # features/massiveUpdate.feature:23
    Given There are current prices in the system                 # FeatureContext::thereAreCurrentPricesInTheSystem()
      | id  | name      | price |
      | 101 | Product 1 | 10.25 |
      | 102 | Product 2 | 14.95 |
      | 103 | Product 3 | 21.75 |
    And I have a file named "invalid_data.csv" with invalid data # FeatureContext::iHaveAFileNamedWithInvalidData()
      | product_id | product_name |
      | 101        | Product 1    |
      | 103        | Product 2    |
    When I upload the file                                       # FeatureContext::iUploadTheFile()
    Then A message is shown explaining the problem               # FeatureContext::aMessageIsShownExplainingTheProblem()
      """
      The file doesn't contain valid data to update prices
      """
      Failed asserting that two strings are equal.
      --- Expected
      +++ Actual
      @@ @@
      -'The file doesn't contain valid data to update prices'
      +'Argument 1 passed to TalkingBit\BddExample\Product::setPrice() must be of the type float, null given, called in src/TalkingBit/BddExample/UpdatePricesFromUploadedFile.php on line 28'
    And Changes are not applied to the current prices            # FeatureContext::changesAreNotAppliedToTheCurrentPrices()
      | id  | name      | price |
      | 101 | Product 1 | 10.25 |
      | 102 | Product 2 | 14.95 |
      | 103 | Product 3 | 21.75 |
```

Este mensaje ya es un mensaje de test que falla. Implementar lo necesario para hacerlo pasar nos va a llevar a volver otra vez a `PHPSpec`.

El objeto que va a lanzar la excepción en último término es `UpdatePricesFromUploadedFile`, así que empezaremos a trabajar con su Spec, añadiendo este ejemplo:

```php
    public function it_should_fail_if_file_has_not_the_right_structure(
        FileReader $fileReader,
        FilePath $filePath
    ) {
        $fileReader
            ->readFrom($filePath)
            ->willReturn(
                [
                    ['product_id' => 101, 'product_name' => 'Product 1']
                ]
            );

        $this->shouldThrow(\UnexpectedValueException::class)->duringUsingFile($filePath);
    }
```

Al ejecutar PHPSpec:

```
bin/PHPSpec run 'TalkingBit\BddExample\UpdatePricesFromUploadedFile'
```

Obtenemos este resultado:

```

      TalkingBit\BddExample\UpdatePricesFromUploadedFile

  22  ✔ is initializable
  27  ✔ should receieve a path to a file
  32  ✔ should fail if file is empty
  39  ✔ should update prices for the products in file
  59  ✘ should fail if file has not the right structure
        expected exception of class "UnexpectedValueException", but got [obj:TypeError] with the
        message: "Return value of Double\ProductRepository\P16::getById() must be an instance of TalkingBit\BddExample\Product,
        null returned"

----  failed examples

        TalkingBit/BddExample/UpdatePricesFromUploadedFile
  59  ✘ should fail if file has not the right structure
        expected exception of class "UnexpectedValueException", but got [obj:TypeError] with the
        message: "Return value of Double\ProductRepository\P16::getById() must be an instance of TalkingBit\BddExample\Product,
        null returned"


1 specs
5 examples (4 passed, 1 failed)
19ms
```

Lo que nos fuerza a implementar en `UpdatePricesFromUploadedFile`:

```php
    public function usingFile(FilePath $pathToFile)
    {
        $data = $this->fileReader->readFrom($pathToFile);
        foreach ($data as $row) {
            if (!isset($row['product_id']) || !isset($row['new_price'])) {
                throw new \UnexpectedValueException('The file doesn\'t contain valid data to update prices');
            }
            $product = $this->productRepository->getById($row['product_id']);
            $product->setPrice($row['new_price']);
        }
    }
```

Y con esto hacemos que la Spec pase, lo que debería hacer que la feature también avance hasta el siguiente paso del escenario, cosa que ocurre.

Es buen momento para refactorizar, ya que la validación del formato del archivo no es precisamente fácil de leer. A mí me gusta extraer este tipo de validaciones como cláusulas de guarda:

```php
<?php

namespace TalkingBit\BddExample;

use TalkingBit\BddExample\FileReader\FileReader;
use TalkingBit\BddExample\VO\FilePath;
use UnexpectedValueException;

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

    public function usingFile(FilePath $pathToFile): void
    {
        $data = $this->fileReader->readFrom($pathToFile);
        foreach ($data as $row) {
            $this->checkIsAValidDataStructure($row);
            $product = $this->productRepository->getById($row['product_id']);
            $product->setPrice($row['new_price']);
        }
    }

    private function checkIsAValidDataStructure($row): void
    {
        if (! isset($row['product_id']) || ! isset($row['new_price'])) {
            throw new UnexpectedValueException('The file doesn\'t contain valid data to update prices');
        }
    }
}
```

## Implementando el último paso

En el segundo escenario nos queda por implementar el último paso, mediante el que comprobamos que los precios no han sufrido cambios. 

```gherkin
    And Changes are not applied to the current prices
      | id  | name      | price |
      | 101 | Product 1 | 10.25 |
      | 102 | Product 2 | 14.95 |
      | 103 | Product 3 | 21.75 |
```

En realidad, es un paso similar al último del primer escenario, que definimos de esta manera:

```
    /**
     * @Then Changes are applied to the current prices
     */
    public function changesAreAppliedToTheCurrentPrices(TableNode $productTable)
    {
        foreach ($productTable as $productRow) {
            $product = $this->productRepository->getById($productRow['id']);
            Assert::assertEquals($productRow['price'], $product->price());
        }
    }
```

Así que podríamos copiar el código:

```php
    /**
     * @Then Changes are not applied to the current prices
     */
    public function changesAreNotAppliedToTheCurrentPrices(TableNode $productTable)
    {
        foreach ($productTable as $productRow) {
            $product = $this->productRepository->getById($productRow['id']);
            Assert::assertEquals($productRow['price'], $product->price());
        }
    }
```

Y así lograr que el segundo escenario quede completo.

```
3 scenarios (2 passed, 1 pending)
15 steps (12 passed, 1 pending, 2 skipped)
0m0.25s (7.77Mb)
```

## Cerrando el último escenario

Nos queda un escenario por terminar, uno en el que un error del sistema impide que un archivo correcto se pueda utilizar para actualizar los precios. En realidad, solo tenemos un paso por implementar, el que nos indica la condición de que ocurre el error del sistema.

Una forma sencilla de provocar este error sería eliminar el archivo que hemos simulado subir, de este modo, el UseCase fallará al no tener nada de dónde leer.

```php

```

Al ejecutar este último escenario se produce un error que no puede ser capturado de la forma deseada.

```
  Scenario: Update fails because a system error                     # features/massiveUpdate.feature:44
    Given There are current prices in the system                    # FeatureContext::thereAreCurrentPricesInTheSystem()
      | id  | name      | price |
      | 101 | Product 1 | 10.25 |
      | 102 | Product 2 | 14.95 |
      | 103 | Product 3 | 21.75 |
    And I have a file named "prices_update.csv" with the new prices # FeatureContext::iHaveAFileNamedWithTheNewPrices()
      | product_id | new_price |
      | 101        | 17        |
      | 103        | 23        |
    When I upload the file                                          # FeatureContext::iUploadTheFile()
    And There is an error in the system                             # FeatureContext::thereIsAnErrorInTheSystem()
    Then A message is shown explaining the problem                  # FeatureContext::aMessageIsShownExplainingTheProblem()
      """
      Something went wrong and it was not possible to update prices
      """
      Fatal error: Call to a member function getMessage() on null (behat\Testwork\Call\Exception\FatalThrowableError)
    And Changes are not applied to the current prices               # FeatureContext::changesAreNotAppliedToTheCurrentPrices()
      | id  | name      | price |
      | 101 | Product 1 | 10.25 |
      | 102 | Product 2 | 14.95 |
      | 103 | Product 3 | 21.75 |
```

Veamos dónde trabajar ese error. En principio `UpdatePricesFromUploadedFile` es el candidato, pero en nuestro desarrollo inicial habíamos decidido que no se ocuparía de los detalles de gestión del archivo, asumiendo un path correcto (al menos en el momento de creación de FilePath) por lo que la circunstancia extraordinaria de que el archivo se hubiese vuelto inaccesible por algún motivo debería recaer en `CsvFileReader` que lanzará una excepción si no encuentra el archivo que debería leer.

De hecho, no hemos descrito todavía esa situación, así que preparamos un ejemplo en `CSVFileReaderSpec`:

```php
    public function it_should_fail_if_file_does_not_exist(FilePath $filePath)
    {
        $pathToFile = '/var/tmp/non_existent_file.csv';
        $filePath->path()->willReturn($pathToFile);
        $this->shouldThrow(RuntimeException::class)->duringReadFrom($filePath);
    }
```

Al escribir este ejemplo es fácil ver que tendría mucha lógica que fuese `FilePath` el objeto responsable de lanzar la excepción en caso de que el archivo ya no exista cuando se solicita el path. Así que nos llevamos un ejemplo parecido a la la `FilePathSpec`.

```php
    public function it_should_fail_if_there_is_not_file_in_the_path()
    {
        $path = '/var/tmp/no_existent.data';
        touch($path);
        $this->beConstructedWith($path);
        unlink($path);
        $this->shouldThrow(\RuntimeException::class)->duringPath();
    }
```

Al ejecutarlo nos encontramos con un fallo, no del todo inesperado:

```

      TalkingBit\BddExample\VO\FilePath

  11  ! is initializable (73ms)
        exception [err:ArgumentCountError("Too few arguments to function TalkingBit\BddExample\VO\FilePath::__construct(), 0 passed and exactly 1 expected")] has been thrown.
  16  ✘ should fail if there is not file in the path
        expected to get exception / throwable, none got.
```

Así que arreglamos primero la Spec y luego implementamos lo que nos falta:

```php
<?php

namespace spec\TalkingBit\BddExample\VO;

use TalkingBit\BddExample\VO\FilePath;
use PHPSpec\ObjectBehavior;
use Prophecy\Argument;

class FilePathSpec extends ObjectBehavior
{
    function it_is_initializable()
    {
        $path = '/var/tmp/file_with.data';
        touch($path);
        $this->beConstructedWith($path);
        $this->shouldHaveType(FilePath::class);
        $this->path()->shouldEqual($path);
    }

    public function it_should_fail_if_there_is_not_file_in_the_path()
    {
        $path = '/var/tmp/no_existent.data';
        touch($path);
        $this->beConstructedWith($path);
        unlink($path);
        $this->shouldThrow(\RuntimeException::class)->duringPath();
    }
}
```

Y esta sería la implementación:

```php
<?php

namespace TalkingBit\BddExample\VO;

use \RuntimeException;

class FilePath
{
    /** @var string */
    private $path;

    public function __construct(string $path)
    {
        $this->path = $path;
    }
    public function path(): string
    {
        if (!file_exists($this->path)) {
            throw new RuntimeException('File not found at '.$this->path);
        }
        return $this->path;
    }
}
```

Si lanzamos `behat` vemos que se produce una regresión, por lo que debemos cambiar la transformación `getFilePath()` mediante el que se que obtiene un `FilePath`, a fin de asegurarnos de que cuando se crea el objeto, hay un archivo en el path:

```php  
    /** @Transform :pathToFile */
    public function getFilePath(string $pathToFile): FilePath
    {
        $fullPathToFile = '/var/tmp/' . $pathToFile;
        touch($fullPathToFile);
        return new FilePath($fullPathToFile);
    }
```

De este modo conseguimos que el paso avance, y obtenemos un test que falla, lo que nos revela que la implementación que tenemos no es suficiente para hacerlo pasar. Fundamentalmente lo que tenemos que hacer es capturar el problema en el lugar adecuado y lanzar una nueva excepción.

Como siempre vamos de fuera hacia adentro buscando el lugar que nos resulta más adecuado. De nuevo, nuestro candidato inicial podría ser el *Use Case* `UpdatePricesFromUploadedFile`. Su tarea consistiría en capturar cualquier error que venga de sus colaboradores y devolver una respuesta adecuada, en este caso lanzar una excepción con el mensaje adecuado.

Esta sería la Spec:

```php
    public function it_should_fail_if_file_does_not_exist(
        FileReader $fileReader,
        FilePath $filePath
    ) {
        $fileReader
            ->readFrom($filePath)
            ->willThrow(RuntimeException::class);

        $exception = new RuntimeException('Something went wrong and it was not possible to update prices');
        $this->shouldThrow($exception)->duringUsingFile($filePath);
    }
```

Lo más interesante de la misma es cómo tratamos las excepciones:

* Primero, simulamos que `FileReader` lanzará una excepción de tipo RuntimeException, la cual en el código lanzaría realmente `FilePath`. Sin embargo, puesto que `FileReader` no la captura, la excepción subiría. Para `UpdatePricesFromUploadedFile` es como si la lanzase `FileReader`, por eso simulamos que la lanza este servicio.
* Segundo, esperamos que `UpdatePricesFromUploadedFile` relance una excepción con un mensaje distinto. Así en lugar de esperar la clase de excepción, definimos una excepción pero con el mensaje que queremos verificar.

Y su ejecución arrojaría el siguiente fallo, ya que no hay nada implementado:

```

      TalkingBit\BddExample\UpdatePricesFromUploadedFile

  21  ✔ is initializable
  26  ✔ should receieve a path to a file
  31  ✔ should fail if file is empty
  38  ✔ should update prices for the products in file
  58  ✔ should fail if file has not the right structure
  73  ✘ should fail if file does not exist
        expected exception `message` to be "Something went wrong and ...", but it is "".
```

El ejemplo pasa con estos cambios, tras un poco de refactor:

```php
<?php

namespace TalkingBit\BddExample;

use RuntimeException;
use TalkingBit\BddExample\FileReader\FileReader;
use TalkingBit\BddExample\VO\FilePath;
use UnexpectedValueException;

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

    public function usingFile(FilePath $pathToFile): void
    {
        try {
            $data = $this->fileReader->readFrom($pathToFile);
            foreach ($data as $row) {
                $this->checkIsAValidDataStructure($row);
                $product = $this->productRepository->getById($row['product_id']);
                $product->setPrice($row['new_price']);
            }
        } catch (UnexpectedValueException $exception) {
            throw $exception;
        } catch (RuntimeException $exception) {
            throw new RuntimeException('Something went wrong and it was not possible to update prices');
        }
    }

    private function checkIsAValidDataStructure($row): void
    {
        if (! isset($row['product_id']) || ! isset($row['new_price'])) {
            throw new UnexpectedValueException('The file doesn\'t contain valid data to update prices');
        }
    }
}
```

Pero aquí pasa algo raro. Al volver a ejecutar `behat` vuelve a darse el mismo error que antes y no se produce ningún cambio.

Un análisis del flujo de pasos de escenarios nos indica que nunca provocamos que se produzca el error porque el paso "And There is an error in the system", en el que simulamos el error del sistema eliminando el archivo, ocurre después de haberlo leído, con lo cual nunca se lanza.

Esto nos indica que hemos situado mal este paso ya que debería estar en **Given** y no en **When**. Es un tipo de error que nos señala la importancia de definir los escenarios correctamente.

Basta colocarlo en el orden adecuado:

```gherkin
  Scenario: Update fails because a system error
    Given There are current prices in the system
      | id  | name      | price |
      | 101 | Product 1 | 10.25 |
      | 102 | Product 2 | 14.95 |
      | 103 | Product 3 | 21.75 |
    And I have a file named "prices_update.csv" with the new prices
      | product_id | new_price |
      | 101        | 17        |
      | 103        | 23        |
    And There is an error in the system
    When I upload the file
    Then A message is shown explaining the problem
      """
      Something went wrong and it was not possible to update prices
      """
    And Changes are not applied to the current prices
      | id  | name      | price |
      | 101 | Product 1 | 10.25 |
      | 102 | Product 2 | 14.95 |
      | 103 | Product 3 | 21.75 |
```

Ahora, ejecutamos `behat` y, por fin, hemos conseguido implementar la historia de usuario que negocio nos ha pedido:

```
3 scenarios (3 passed)
15 steps (15 passed)
0m0.04s (7.80Mb)
```

## Qué hemos conseguido

En estos tres capítulos hemos aprendido a definir una historia de usuario mediante el lenguaje Gherkin, generando un documento en el que podemos trabajar tanto desde negocio como desde desarrollo, a través de un diálogo en el cual desarrollamos los conceptos del lenguaje ubicuo del dominio y, además, reducimos la ambigüedad y la imprecisión a través de ejemplos que definen el comportamiento del software.

Hemos aprendido también a convertir, con la ayuda de `behat`, la definición de la historia de usuario en un test funcional de aceptación, de modo que pueda dirigir nuestro desarrollo de fuera hacia adentro (por así decir).

Este test, nos ayuda a decidir por dónde comenzaremos a desarrollar el software necesario para satisfacer la historia de usuario. Recurriendo a la especificación por ejemplos y la herramienta `PHPSpec`, hemos ido descubriendo las interfaces de los colaboradores necesarios e implementándolos a medida que la ejecución de los tests nos lo reclamaba.

Finalmente, este proceso nos ha permitido completar la `feature`, que no solo es plenamente funcional, en los términos definidos en el documento Gherkin, sino que está totalmente cubierta por tests unitarios y un test de aceptación.

## Hacia dónde vamos ahora

En el próximo capítulo de esta serie intentaremos resolver algunas cuestiones que han quedado pendientes, como pueden ser:

* Cómo asegurar que nuestro tests de aceptación prueba lo que dice que prueba
* Refinar los comportamientos de los objetos participantes usando `PHPSpec` y el test de aceptación como red de seguridad
* Cómo mejorar los test de aceptación y configurar `behat` para adaptarlo a nuestros entornos particulares: cambiar la ubicación de features, tests, nombres, etc.

Además, en [los siguientes capítulos](/bdd-example-4) veremos cómo realizar tests end-to-end, tanto para interfaces web como API. 
