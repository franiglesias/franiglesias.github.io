---
layout: post
title: Introducción a Behavior Driven Development en PHP (3)
categories: articles
tags: php bdd testing
---

En el [primer artículo de la serie](/2018-09-16-bdd-example-1) comenzamos introduciendo el concepto de BDD, el lenguaje Gherkin y la herramienta Behat. En el [segundo](2018-09-16-bdd-example-2), utilizamos phpspec para comenzar a desarrollar nuestra feature, partiendo de un *Use Case* y descubriendo las clases colaboradoras necesarias a medida que identificamos responsabilidades. En esta tercera entrega pretendemos a empezar a unir las piezas.

Al final de la fase anterior conseguimos desarrollar el *Use Case* `UpdatePricesFromUploadedFile` y descubrimos las interfaces de sus colaboradores. Es un buen momento para volver a `FeatureContext` y completar el test de aceptación. Para eso, tenemos que revisar las interfaces generadas, implementar varias cosas y tomar algunas decisiones.

## Por dónde seguimos ahora

Para decidir que empezaríamos por `UpdatePricesFromUploadedFile` lo hicimos sobre la base de que este `Use Case` representa el núcleo de la *Feature* que estamos desarrollando. Ahora nos toca implementar sus colaboradores para poder pasar el test de aceptación.

Nuestra primera tarea es instanciar todos los objetos necesarios. Puesto que sólo tenemos interfaces necesitamos implementar clases concretas a partir de ellas. Para poder escribir el código de `FeatureContext` y tener un test que pueda ejecutarse, empezaremos haciendo la implementación mínima ejecutable (expresión que me acabo de inventar, pero que suena tremendamente profesional y *cool*). Básicamente queremos *dummys* para que nuestra *Feature* pueda ejecutarse de principio a fin aunque, de momento, no nos dará resultados viables.

Acabaremos con un código similar al que proponíamos en el primer artículo de la serie y, a partir de ahí, desarrollaremos la funcionalidad que necesitamos.

Pediremos a `phpspec` que nos eche una mano en esta tarea, que así será más cómoda.

### FilePath

Aquí tenemos la interfaz de `FilePath`. Como es un Value Object realmente no vamos a necesitar tener varias implementaciones ya que la que necesitamos es la única, por lo tanto, tan sólo tenemos que crear la clase y hacer una implementación mínima.

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

Comenzamos diciéndole a phpspec que vamos a describir la clase FilePath:

```
bin/phpspec describe 'TalkingBit\BddExample\VO\FilePath'
```

Y ejecutamos la Spec. Para no tener que ejecutar todas las Specs que tengamos definidas podemos apuntar a la que nos interesa:

```
bin/phpspec run 'TalkingBit\BddExample\VO\FilePath'
```

phpspec detectará que no existe la clase, aunque existe la interfaz, por lo que nos pide permiso para crearla:

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

Si decimos que sí, puesto que el archivo existe nos preguntará si queremos sobre-escribirlo. Esto ya queda un poco a nuestro gusto, o bien dejamos a `phpspec` que cree la clase desde cero (ignorando la interfaz ya existente) o bien modificamos manualmente la interfaz. Nosotros vamos a hacer esto último ya que queremos aprovechar, así que responderemos que no y editaremos el archivo de la interfaz para dejarlo más o menos así:

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
bin/phpspec run
```

## Product

En nuestra hipotética aplicación, Product sería una entidad de dominio, por lo que tampoco tiene mucho sentido que la dualidad entre interfaz y clase. De nuevo, tan sólo queremos tener una una clase instanciable que ya desarrollaremos después.

Seguiremos el mismo proceso que con FilePath, por lo que no voy a repetirlo aquí. La interfaz que tenemos es:

```php
<?php

namespace TalkingBit\BddExample;

interface Product
{
    public function setPrice($argument1);
}
```

Refactorizamos un poco:


```php
<?php

namespace TalkingBit\BddExample;

interface Product
{
    public function setPrice(float $price): void;
}
```

Generamos la Spec, ejecutando `phpspec`:

```
bin/phpspec describe 'TalkingBit\BddExample\Product'
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

Finalmente, ejecutamos `phpspec` para asegurarnos de que la clase es inicializable.

```
bin/phpspec run 'TalkingBit\BddExample\Product'
```

Y ya tenemos, una clase `Product` sin comportamiento, pero suficiente para avanzar.

## ProductRepository y FileReader

Con `ProductRepository` y `FileReader` la cosa cambia un poco. En este caso, necesitamos tanto la interfaz como, al menos, una implementación concreta.

En aplicación del principio de Inversión de Dependencia, la interfaz de `ProductRepository` se define en el Dominio pero se implementa en infrastructura ya que utilizará un mecanismo de persistencia específico, o incluso podría haber varias implementaciones usando distintos mecanismos en función de las necesidades de la aplicación. La cuestión es que eso nos permite aplazar la decisión técnica de qué mecanismo utilizar ya que podemos utilizar implementaciones sencillas para empezar a trabajar y cambiarlas de forma transparente a medida que crecen nuestras necesidades.

`FileReader`, por su parte, se define en la capa de aplicación, pero se implementa en infraestructura. Teniendo en cuenta lo que sabemos, es perfectamente posible que tengamos que crear diversas implementaciones de FileReader, cada una de ellas especializada en un tipo de archivo, en aplicación de un patrón Strategy. De nuevo, podemos aplazar la decisión de qué formato utilizar empezando por uno que nos convenga, como el CSV y cambiarlo si, más adelante, nos conviene más otro.

En ambos casos, de momento vamos a hacer la implementación más simple posible, para poder instanciarlas.

### Product Repository

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
bin/phpspec describe 'TalkingBit\BddExample\Persistence\InMemoryProductRepository'
```

Ejecutamos la Spec y damos permiso para crear la clase por nosotros:

```
bin/phpspec run 'TalkingBit\BddExample\Persistence\InMemoryProductRepository'
```

Esta es la Spec y vamos a hacer algunas modificaciones ya que queremos que `InMemoryProductRepository` implemente la interfaz `ProductRepository`:

```php
<?php

namespace spec\TalkingBit\BddExample\Persistence;

use TalkingBit\BddExample\Persistence\InMemoryProductRepository;
use PhpSpec\ObjectBehavior;
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
use PhpSpec\ObjectBehavior;
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
bin/phpspec describe 'TalkingBit\BddExample\FileReader\CSVFileReader'
```

La cual modificaremos para que se asegure que CSVFileReader implemente FileReader:

```php
<?php

namespace spec\TalkingBit\BddExample\FileReader;

use TalkingBit\BddExample\FileReader\CSVFileReader;
use PhpSpec\ObjectBehavior;
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

use Behat\Behat\Context\Context;
use Behat\Behat\Tester\Exception\PendingException;
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

Para implementar este paso necesitamos añadir Products en `InMemoryProductRepository`, pero es un comportamiento que aún no tiene. Y, para eso, tenemos que poder acceder a la instancia que pasamos a `UpdatePricesFromUploadedFile`. Tenemos que cambiar eso en el constructor y recurriremos a phpspec para modelar el comportamiento de guardar Products en el repositorio.

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

Si ejecutamos behat vemos que esto empieza a ponerse interesante:

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
      Fatal error: Call to undefined method TalkingBit\BddExample\Persistence\InMemoryProductRepository::store() (Behat\Testwork\Call\Exception\FatalThrowableError)
    And I have a file named "prices_update.csv" with the new prices # FeatureContext::iHaveAFileNamedWithTheNewPrices()
    When I upload the file                                          # FeatureContext::iUploadTheFile()
    Then Changes are applied to the current prices                  # FeatureContext::changesAreAppliedToTheCurrentPrices()

  Scenario: Update fails because an invalid file                 # features/massiveUpdate.feature:12
    Given There are current prices in the system                 # FeatureContext::thereAreCurrentPricesInTheSystem()
      Fatal error: Call to undefined method TalkingBit\BddExample\Persistence\InMemoryProductRepository::store() (Behat\Testwork\Call\Exception\FatalThrowableError)
    And I have a file named "invalid_data.csv" with invalid data # FeatureContext::iHaveAFileNamedWithInvalidData()
    When I upload the file                                       # FeatureContext::iUploadTheFile()
    Then A message is shown explaining the problem               # FeatureContext::aMessageIsShownExplainingTheProblem()
    And Changes are not applied to the current prices            # FeatureContext::changesAreNotAppliedToTheCurrentPrices()

  Scenario: Update fails because a system error                     # features/massiveUpdate.feature:19
    Given There are current prices in the system                    # FeatureContext::thereAreCurrentPricesInTheSystem()
      Fatal error: Call to undefined method TalkingBit\BddExample\Persistence\InMemoryProductRepository::store() (Behat\Testwork\Call\Exception\FatalThrowableError)
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

Ahora podríamos escribir el código mínimo que haga pasar el escenario, aunque no tenga comportamiento, dejando para más tarde implementarlo. La otra opción, por supuesto, es hacerlo ahora con la ayuda de phpspec.

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

El lenguaje Gherkin nos permite definir ejemplos de colecciones de datos en forma de tablas y behat nos proporciona herramientas para utilizar esos ejemplos en el test. En realidad lo único que tenemos que hacer es añadir la tabla delimitando las columnas con el carácter pipe (|). La primera línea debería darnos los nombres de las columnas. Por lo tanto, cambiaremos el escenario para hacerlo así

```gherkin
  Scenario: Update uploading a csv file with new prices
    Given There are current prices in the system
    And I have a file named "prices_update.csv" with the new prices
    | product_id | price |
    | 101        | 17    |
    | 103        | 23    |
    When I upload the file
    Then Changes are applied to the current prices
```

Si ejecutamos ahora behat no observaremos ningún cambio ya que nada altera el modo en que se reconoce el paso. Ahora vamos a ver cómo recogemos los datos de la tabla en la definición del paso:

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

La cuestión es que podemos extraer la transformación necesaria a un método y definirlo como Transformación de modo que behat sabe que al recibir un parámetro debe pasarlo antes al método indicado.

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

Con este cambio el paso se ejecuta y vemos que también pasa el siguiente, que ya habíamos implementado. Así que ahora podemos retomar el problema de la falta de ejemplos en el repositorio de productos que, por lo demás, también nos ayudará a preparar el próximo paso.

### Cómo llenar un repositorio con ejemplos
    







## Implementaciones completas

**phpspec** nos ha permitido descubrir las interfaces de los colaboradores de `UpdatePricesFromUploadedFile` a partir de lo que éste necesita de ellos. Pero para poder usarlos tendremos que desarrollar una implementación.

Vayamos uno por uno:

### FilePath

```php
<?php

namespace TalkingBit\BddExample\VO;

interface FilePath
{
    public function path();
}
```

Hemos dicho que FilePath es un value object que se encarga de representar una ruta a un archivo existente en el sistema de archivos. Al tratarse de un Value Object no tiene mucho sentido mantener la interfaz y una clase concreta, puesto que va a tener una única implementación. Por tanto, convertiremos la interfaz en clase y la escribiremos con la ayuda de phpspec.

```php
<?php

namespace TalkingBit\BddExample\VO;

class FilePath
{
    public function path(): string 
    {
        
    }
}
```

Para empezar le diremos a `phpspec` que queremos describir la clase `FilePath`:

```
bin/phpspec describe 'TalkingBit\BddExample\VO\FilePath'
```

Lo que genera la Spec:

```php
<?php

namespace spec\TalkingBit\BddExample\VO;

use TalkingBit\BddExample\VO\FilePath;
use PhpSpec\ObjectBehavior;
use Prophecy\Argument;

class FilePathSpec extends ObjectBehavior
{
    function it_is_initializable()
    {
        $this->shouldHaveType(FilePath::class);
    }
}
```

Si la ejecutamos, como ya existe el archivo y puede cargar la clase se ejecutarán las Spec encontradas, con el resultado de que la clase FilePath se puede inicializar:

```

      TalkingBit\BddExample\UpdatePricesFromUploadedFile

  22  ✔ is initializable (275ms)
  27  ✔ should receieve a path to a file
  32  ✔ should fail if file is empty
  39  ✔ should update prices for the products in file

      TalkingBit\BddExample\VO\FilePath

  11  ✔ is initializable


2 specs
5 examples (5 passed)
302ms
```

Al ejecutar `phpspec` sin indicar una ruta o una Spec determinada se ejecutarán todas las que se encuentren bajo el directorio `spec`. Ahora bien, si queremos podemos especificar que se ejecute sólo aquella con la que estamos trabajando:

```
bin/phpspec run 'TalkingBit\BddExample\VO\FilePath'
```

Esto nos permite mantener el foco:

```

      TalkingBit\BddExample\VO\FilePath

  11  ✔ is initializable (85ms)


1 specs
1 examples (1 passed)
86ms
```

Hemos dicho que FilePath contendrá la ruta de un archivo existente, fallando si no existe. Vamos a empezar describiendo el *sad path*, es decir, que el archivo no existe y esperando una excepción.

Y eso, ¿por qué? Porque queremos un test que, fallando, nos obligue a implementar precisamente que `FilePath` compruebe si el archivo existe. Ya hemos visto cómo esperar excepciones, y aquí podemos ver cómo se esperan en el momento de la instanciación.

```php
<?php

namespace spec\TalkingBit\BddExample\VO;

use InvalidArgumentException;
use TalkingBit\BddExample\VO\FilePath;
use PhpSpec\ObjectBehavior;
use Prophecy\Argument;

class FilePathSpec extends ObjectBehavior
{
    function it_should_fail_with_non_existent_file()
    {
        $path = '/var/tmp/invalid_file.data';

        $this->beConstructedWith($path);
        $this->shouldThrow(InvalidArgumentException::class)
             ->duringInstantiation();
    }
}
```

Al ejecutarla nos propondrá crear un constructor para `FilePath`.

```

      TalkingBit\BddExample\VO\FilePath

  12  ! should fail with non existent file (118ms)
        method TalkingBit\BddExample\VO\FilePath::__construct not found.

----  broken examples

        TalkingBit/BddExample/VO/FilePath
  12  ! should fail with non existent file (118ms)
        method TalkingBit\BddExample\VO\FilePath::__construct not found.


1 specs
1 examples (1 broken)
120ms
                                                                                
  Do you want me to create `TalkingBit\BddExample\VO\FilePath::__construct()`   
  for you?                                                                      
                                                                         [Y/n] 
```

Aceptamos y comprobamos que el ejemplo falla porque no se lanza la excepción:

```
  

      TalkingBit\BddExample\VO\FilePath

  12  ✘ should fail with non existent file (85ms)
        expected to get exception / throwable, none got.

----  failed examples

        TalkingBit/BddExample/VO/FilePath
  12  ✘ should fail with non existent file (85ms)
        expected to get exception / throwable, none got.


1 specs
1 examples (1 failed)
86ms
```

Así que hacemos una implementación mínima para que el ejemplo se cumpla:


```php
<?php

namespace TalkingBit\BddExample\VO;

class FilePath
{
    public function __construct(string $path)
    {
        throw new \InvalidArgumentException(sprintf('%s should be an existent file', $path));
    }

    public function path(): string
    {

    }
}
```

Con éste código tenemos la Spec en verde, pero aún nos falta describir el comportamiento bueno. Vamos a ello:

```php
    public function it_should_initialize_with_path_to_existent_file(): void
    {
        $path = '/var/tmp/valid_file.data';

        file_put_contents($path, 'some data');

        $this->beConstructedWith($path);
        $this->path()->shouldBe($path);

        unlink($path);
    }
```

El ejemplo falla:

```

      TalkingBit\BddExample\VO\FilePath

  12  ✔ should fail with non existent file (182ms)
  21  ! should initialize with path to existent file
        exception [exc:InvalidArgumentException("/var/tmp/valid_file.data should be an existent file")] has been thrown.

----  broken examples

        TalkingBit/BddExample/VO/FilePath
  21  ! should initialize with path to existent file
        exception [exc:InvalidArgumentException("/var/tmp/valid_file.data should be an existent file")] has been thrown.


1 specs
2 examples (1 passed, 1 broken)
214ms
```

Lo que nos pide una implementación como la siguiente:

```php
<?php

namespace TalkingBit\BddExample\VO;

use InvalidArgumentException;

class FilePath
{
    /** @var string */
    private $path;

    public function __construct(string $path)
    {
        if (!file_exists($path)) {
            throw new InvalidArgumentException(sprintf('%s should be an existent file', $path));
        }
        $this->path = $path;
    }

    public function path(): string
    {
        return $this->path;
    }
}
```

Podemos ejecutar `phpspec` para ver que no hemos roto la especificación de `UpdatePricesFromUploadedFile` con el código que hemos introducido.

```
bin/phpspec run
```

Con esto podemos dar por terminada la implementación de `FilePath`, al menos por lo que respecta a lo que necesitamos.

### 
