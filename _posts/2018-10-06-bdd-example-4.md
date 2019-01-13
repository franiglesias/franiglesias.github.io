---
layout: post
title: Introducción a Behavior Driven Development en PHP (4)
published: true
categories: articles
tags: php bdd testing
---

Ya llevamos tres capítulos de esta serie sobre BBD en PHP. En el [primer artículo de la serie](/bdd-example-1) dimos una visión general de BDD y Behat. [En el segundo](/example-2) y [el tercero](/bbd-example-3) revisamos el proceso de desarrollo de una Feature desde la historia de usuario hasta tener un código funcional usando la metodología y herramientas BDD.

Y en este cuarto capítulo vamos a refinar unos cuantos puntos para mejorar los tests de aceptación y su gestión.

Antes de nada, [en este repositorio de github](https://github.com/franiglesias/csvrepo) está todo el código desarrollado para esta serie de artículos.

## ¿Quién vigila a los vigilantes?

Una cuestión importante a considerar tiene que ver con la validez de nuestros tests, en el sentido de si están probando aquello que dicen.

Los test de aceptación realizados con Gherkin + Behat pueden resultar bastante fáciles de falsear ya que para que un paso se ejecute con éxito y se refleje así en el escenario basta con que no arroje ninguna excepción.

Una forma de enfocarlo es hacer aserciones sobre las pre-condiciones en los pasos **Given**, es decir, no sólo realizar la definición del paso, sino verificar con una o varias aserciones que se cumplen las condiciones. Esta precaución aumentará la solidez de nuestros tests de aceptación a costa de un poco más de trabajo.

Veamos un ejemplo. He aquí el paso **Given** mediante el cual ponemos productos en el repositorio:

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

Podemos "certificar" que los datos están en el repositorio:

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

        foreach ($productTable as $productRow) {
            $storedProduct = $this->productRepository->getById($productRow['id']);
            Assert::assertEquals($productRow['price'], $storedProduct->price());
        }
    }
```

Además, resulta que este código es prácticamente el mismo que usamos en el paso **Then**, así que podríamos extraerlo:

```php
//...
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

        $this->assertTheseProductsAreInTheRepository($productTable);
    }

//...
    /**
     * @Then Changes are applied to the current prices
     */
    public function changesAreAppliedToTheCurrentPrices(TableNode $productTable)
    {
        $this->assertTheseProductsAreInTheRepository($productTable);
    }
//...

    /**
     * @Then Changes are not applied to the current prices
     */
    public function changesAreNotAppliedToTheCurrentPrices(TableNode $productTable)
    {
        $this->assertTheseProductsAreInTheRepository($productTable);
    }
//...

    private function assertTheseProductsAreInTheRepository(TableNode $productTable): void
    {
        foreach ($productTable as $productRow) {
            $storedProduct = $this->productRepository->getById($productRow['id']);
            Assert::assertEquals($productRow['price'], $storedProduct->price());
        }
    }
```

Otros pasos que podemos certificar:

```php
    /**
     * @Given I have a file named :pathToFile with the new prices
     */
    public function iHaveAFileNamedWithTheNewPrices(FilePath $pathToFile, TableNode $table)
    {
        $this->pathToFile = $pathToFile;
        $this->createCsvFileWithDataFromTable($this->pathToFile->path(), $table);

        Assert::assertFileExists($pathToFile->path());
    }
    
     /**
     * @Given I have a file named :pathToFile with invalid data
     */
    public function iHaveAFileNamedWithInvalidData(FilePath $pathToFile, TableNode $table)
    {
        $this->pathToFile = $pathToFile;
        $this->createCsvFileWithDataFromTable($this->pathToFile->path(), $table);

        Assert::assertFileExists($pathToFile->path());
    }
    
    /**
     * @Given There is an error in the system
     */
    public function thereIsAnErrorInTheSystem()
    {
        $path = $this->pathToFile->path();
        unlink($this->pathToFile->path());

        Assert::assertFileNotExists($path);
    }
```

Con esto, nuestras precondiciones están aseguradas y el test de aceptación ofrece más garantías de ser válido.

**¿Se podría hacer test first?** Una forma de plantear este refuerzo de la validez de los escenarios sería introducir las aserciones antes de implementar las definiciones. De este modo nos veríamos obligados a escribirlas para hacer pasar los test, una especie de desarrollo de tests dirigido por tests.

## Refactorizar FeatureContext

En el apartado anterior hemos aplicado algún refactor aprovechando que los tests de la feature están en verde. En principio, es posible refactorizar más cosas:

La primera sería organizar los métodos para que estén juntas las definiciones de los pasos **Given**, **When** y **Then**, de modo que sea más fácil ubicarlas, aquí tienes el bloque ordenado:

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

        $this->assertTheseProductsAreInTheRepository($productTable);
    }

    /**
     * @Given I have a file named :pathToFile with the new prices
     */
    public function iHaveAFileNamedWithTheNewPrices(FilePath $pathToFile, TableNode $table)
    {
        $this->pathToFile = $pathToFile;
        $this->createCsvFileWithDataFromTable($this->pathToFile->path(), $table);

        Assert::assertFileExists($pathToFile->path());
    }

    /**
     * @Given I have a file named :pathToFile with invalid data
     */
    public function iHaveAFileNamedWithInvalidData(FilePath $pathToFile, TableNode $table)
    {
        $this->pathToFile = $pathToFile;
        $this->createCsvFileWithDataFromTable($this->pathToFile->path(), $table);

        Assert::assertFileExists($pathToFile->path());
    }

    /**
     * @Given There is an error in the system
     */
    public function thereIsAnErrorInTheSystem()
    {
        $path = $this->pathToFile->path();
        unlink($this->pathToFile->path());

        Assert::assertFileNotExists($path);
    }

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

    /**
     * @Then A message is shown explaining the problem
     */
    public function aMessageIsShownExplainingTheProblem(PyStringNode $expectedMessage)
    {
        $message = $this->lastException->getMessage();
        Assert::assertEquals($expectedMessage->getRaw(), $message);
    }

    /**
     * @Then Changes are applied to the current prices
     */
    public function changesAreAppliedToTheCurrentPrices(TableNode $productTable)
    {
        $this->assertTheseProductsAreInTheRepository($productTable);
    }

    /**
     * @Then Changes are not applied to the current prices
     */
    public function changesAreNotAppliedToTheCurrentPrices(TableNode $productTable)
    {
        $this->assertTheseProductsAreInTheRepository($productTable);
    }
```

Con los métodos bien ordenados es bastante fácil ver que hay definiciones idénticas para algunos pasos y que sería posible definir expresiones regulares que permitan capturar los distintos mensajes.

Por ejemplo, los dos últimos pasos Then son idénticos y el cambio es muy simple. Ahora tenemos un método menos y el test sigue pasando.

```php
    /**
     * @Then /Changes are (not )?applied to the current prices/
     */
    public function changesAreAppliedOrNotToTheCurrentPrices(TableNode $productTable)
    {
        $this->assertTheseProductsAreInTheRepository($productTable);
    }
```

Este otro cambio es un poco más peliagudo, pero se puede hacer igualmente:

```php
    /**
     * @Given I have a file named :pathToFile with the new prices
     */
    public function iHaveAFileNamedWithTheNewPrices(FilePath $pathToFile, TableNode $table)
    {
        $this->pathToFile = $pathToFile;
        $this->createCsvFileWithDataFromTable($this->pathToFile->path(), $table);

        Assert::assertFileExists($pathToFile->path());
    }

    /**
     * @Given I have a file named :pathToFile with invalid data
     */
    public function iHaveAFileNamedWithInvalidData(FilePath $pathToFile, TableNode $table)
    {
        $this->pathToFile = $pathToFile;
        $this->createCsvFileWithDataFromTable($this->pathToFile->path(), $table);

        Assert::assertFileExists($pathToFile->path());
    }
```

Ya que realmente es la misma operación. Sin embargo, usar regexp es siempre un poco más complicado. En primer lugar tenemos que capturar el nombre de archivo y aceptar cualquier texto en la última parte del paso.

```php
    /**
     * @Given /I have a file named "([^"]+)" with (.*)/
     */
    public function iHaveAFileNamedWithInvalidData(FilePath $pathToFile, TableNode $table)
    {
        $this->pathToFile = $pathToFile;
        $this->createCsvFileWithDataFromTable($this->pathToFile->path(), $table);

        Assert::assertFileExists($pathToFile->path());
    }
```

Pero además, tenemos que adaptar el transformer para usar la misma regex que captura el nombre del archivo:

```php
    /** @Transform /([^"]+)/ */
    public function getFilePath(string $pathToFile): FilePath
    {
        $fullPathToFile = '/var/tmp/' . $pathToFile;
        touch($fullPathToFile);

        return new FilePath($fullPathToFile);
    }
```

Ciertamente esto empieza a parecer un poco mágico, pero funciona my bien.

**¿Merece la pena hacer este refactor?** Reutilizar las definiciones con distintos pasos puede ser bastante buena idea de cara al mantenimiento a largo plazo de la feature y del test de aceptación. Los tests también son código y necesitan mantenimiento. Reducir la duplicación innecesario es siempre buena idea.


## Refinar las implementaciones con TDD

El desarrollo que hemos llevado a cabo funciona como queda demostrado por la ejecución de la feature, pero la verdad es que en los capítulos anteriores no hemos lanzado la suite completa de Specs. Puede ser un buen momento hacerlo ahora.

```
bin/phpspec run
```

Esto arroja una pequeña sorpresa:

```

      TalkingBit\BddExample\FileReader\CSVFileReader

  11  ✔ is initializable (192ms)
  16  ✔ should read a file with one line (216ms)
  30  ✔ should read csv files with headers and data

      TalkingBit\BddExample\Persistence\InMemoryProductRepository

  11  ✔ is initializable
  16  ✔ should store products
  23  ✔ should retrieve a product specified by its id

      TalkingBit\BddExample\Product

  11  ! is initializable
        exception [err:ArgumentCountError("Too few arguments to function TalkingBit\BddExample\Product::__construct(), 0 passed and exactly 3 expected")] has been thrown.

      TalkingBit\BddExample\UpdatePricesFromUploadedFile

  21  ✔ is initializable
  26  ✔ should receieve a path to a file
  31  ✔ should fail if file is empty
  38  ✔ should update prices for the products in file
  58  ✔ should fail if file has not the right structure
  73  ✔ should fail if file does not exist

      TalkingBit\BddExample\VO\FilePath

  10  ✔ is initializable
  19  ✔ should fail if there is not file in the path

----  broken examples

        TalkingBit/BddExample/Product
  11  ! is initializable
        exception [err:ArgumentCountError("Too few arguments to function TalkingBit\BddExample\Product::__construct(), 0 passed and exactly 3 expected")] has been thrown.


5 specs
15 examples (14 passed, 1 broken)
515ms
```

Resulta que nos queda algún ejemplo que no pasa. La explicación es que hemos desarrollado algunos de los actores a partir del test de aceptación, sin recurrir a la especificación. Esto tiene sus pros y sus contras, pero es importante tener en cuenta que, de todos modos, estamos cubiertos por el test de aceptación. La parte negativa es que este tipo de tests nos proporciona poca resolución, y eso nos limitará en el futuro para investigar los problemas que puedan aparecer.

Por tanto, nuestro siguiente paso sería arreglar las Specs que no estén pasando.

```php
<?php

namespace spec\TalkingBit\BddExample;

use TalkingBit\BddExample\Product;
use PhpSpec\ObjectBehavior;
use Prophecy\Argument;

class ProductSpec extends ObjectBehavior
{
    function it_is_initializable()
    {
        $this->beConstructedWith(101, 'Product 1', 10.25);
        $this->shouldHaveType(Product::class);
    }
}
```

En cualquier caso, una vez que volvemos a tener todos los tests en verde, es interesante ver si podemos refactorizar algo, tanto el código de producción como las especificaciones.

## ¿Necesitamos implementar algo más?

Una de las ideas más subyacentes en los enfoques metodológicos de TDD y BDD es el principio YAGNI (No lo vas a necesitar) que dice que no deberíamos desarrollar features en previsión de que algún día sea necesarias. Es decir, se trata de programar única y exclusivamente lo necesario para lo que se nos pide, lo cual, en este caso está expresado en forma de tests.

Por eso decimos que en BDD y TDD escribimos el código necesario para pasar los tests y ni una línea más.

Si examinas el código que hemos escrito verás que es bastante minimalista y es posible que puedas detectar lugares donde refactorizar o mejorar el código. En ese sentido, es interesante usar herramientas para tu IDE como Php inspections (https://plugins.jetbrains.com/plugin/7622-php-inspections-ea-extended-), las cuales pueden proporcionarte algunas pistas útiles.

Al trabajar como lo hemos hecho, todos los elementos están bastante desacoplados, son ligeros y las responsabilidades están bien repartidas. Es decir, no sólo hemos escrito un código que hace lo que se desea que haga, sino que además es un código de buena calidad, preparado para seguir creciendo en el futuro, y protegido por tests.

## Personalizar la organización de los tests

Hasta ahora no había querido entrar en la organización de los tests para no desviar nuestra atención de lo más importante, que es cómo construir una Historia de Usuario mediante una Feature con Scenarios.

Obviamente, un proyecto medianamente grande tendrá un montón de Features y tests y querremos tenerlos ordenados de una forma significativa.

Ahora sólo vamos a entrar en cómo configurar `behat`, y también `phpspec`, para organizar los tests de la forma que más nos interese. Existen muchas opciones de configuración, así como la posibilidad de etiquetas las features y ejecutarlas selectivamente. Eso es algo de lo que hablaremos en otro momento.

Vamos a suponer que queremos tener todos nuestros tests bajo una única carpeta `tests`, bajo la cual tendremos los tests de `acceptance`, `integration` y `unit`. Algo así:

```
tests
├── Acceptance
├── Integration
└── Unit

```

Por otro lado, queremos organizar nuestra carpeta de acceptance test en base a dominios o contextos acotados. He aquí una posible estructura para aplicar a nuestro ejemplo:

```
tests
├── Acceptance
│   └── Product
│       ├── Context
│       └── Features
├── Integration
└── Unit

```

### Moviendo las *features*

Así que comencemos con `behat`. Lo primero es crear archivo `behat.yml` en la raíz del proyecto, con este contenido:

```yaml
default:
```

Esto es lo que se llama un perfil (o profile). Siempre debe existir un perfil `default`, aunque puedes definir todos los que quieras según tus objetivos. Pero todos los que definas heredarán de `default` y podrán sobre-escribir aquellos aspectos que les sean propios.

Dentro de un perfil se pueden definir varias suites o conjuntos de tests. Vamos a imaginar que nosotros queremos una suite que sea `use_cases` en la que testeamos nuestra feature a través de los Use Cases.

Vamos a empezar moviendo nuestras *features* a una carpeta particular, para lo que definimos la siguiente suite en **behat.yml**:

```yaml
default:
  suites:
    product:
       paths:
        - '%paths.base%/tests/Acceptance/Product/Features'
```

Bajo `paths` ponemos un array de *paths* a carpetas en las que `behat` debe buscar los archivos `*.feature`.

Una vez que tenemos esto, movemos el archivo `features/massiveUpdate.feature` a su nuevo destino en `tests/Acceptance/Product/Features/massiveUpdate.feature`, Podremos añadir nuevas features de Product en la misma carpeta.

Ahora vamos a mover y cambiar el nombre de FeatureContext.php para mantener la coherencia.

Modificaremos **behat.yml** para indicar el archivo o archivos de test que se corresponden con esta suite. Para eso también tenemos que ayudar al autoloader de `behat`:

```yaml
default:
  autoload:
    '': '%paths.base%/tests'
  suites:
    product:
      paths:
      - '%paths.base%/tests/Acceptance/Product/Features'
      contexts:
      - Acceptance\Product\Context\MassiveUpdateContext
```

También hemos aprovechado para cambiar el nombre de la clase y moverla a su ubicación definitiva. En la clase, por cierto, añadimos el *namespace* y nos aseguramos de que todo lo necesario esté correctamente importado.

```php
<?php

namespace Acceptance\Product\Context;

use Behat\Behat\Context\Context;
use Behat\Gherkin\Node\PyStringNode;
use Behat\Gherkin\Node\TableNode;
use PHPUnit\Framework\Assert;
use TalkingBit\BddExample\FileReader\CSVFileReader;
use TalkingBit\BddExample\Persistence\InMemoryProductRepository;
use TalkingBit\BddExample\Product;
use TalkingBit\BddExample\ProductRepository;
use TalkingBit\BddExample\UpdatePricesFromUploadedFile;
use TalkingBit\BddExample\VO\FilePath;
use Throwable;
//...
```

Una vez que hemos movido la clase, podemos borrar la carpeta features original y lanzar `behat` para comprobar que los tests siguen pasando.

Si conoces el formato **YAML** seguramente no se te ha escapado que definimos las features y contexts en la suite como un array. Esto quiere decir que es posible tener en una suite varias *features* y varios *contexts*. Cuando ejecutas `behat` para generar las definiciones de los pasos puede resultar un poquito lioso al principio ya que tienes la opción de enviar dichas definiciones a cualquier de los *contexts*. En cualquier caso, basta con cortar y pegar para mover definiciones entre contextos.

### BDD on steroids: test de la feature en diferentes capas

Una cosa interesante que nos permite esta forma de configuración es la posibilidad de utilizar la misma *feature* en Gherkin para escribir distintos tests de aceptación. En el ejemplo de esta serie de artículos hemos estado haciendo el test al nivel del UseCase, algo que lo caracterizaría más bien como un test de integración. Pero jugando con los perfiles y las suites es posible generar nuevos tests que podrían ser de tipo end-to-end y probar el mismo comportamiento llamando a un API o navegando la página que da acceso a esa característica.

Por ejemplo, modificando el archivo **behat.yml**:

```yaml
default:
  autoload:
    '': '%paths.base%/tests'
  suites:
    products:
      paths:
      - '%paths.base%/tests/Acceptance/Product/Features'
      contexts:
      - Acceptance\Product\Context\MassiveUpdateContext

    end_to_end:
      paths:
      - '%paths.base%/tests/Acceptance/Product/Features'
      contexts:
      - Acceptance\EndToEnd\Context\MassiveUpdateContext
```

y ejecutando `bin/behat --init`, se generará la clase context necesaria:

```
+d tests/Acceptance/EndToEnd/Context - place your context classes here
+f tests/Acceptance/EndToEnd/Context/MassiveUpdateContext.php - place your definitions, transformations and hooks here
```

Y podemos ejecutar la suite especificándola mediante el parámetro `--suite`:

```
bin\behat --suite end_to_end
```

Lo que nos dará como resultado que el test indica que hay que definir los pasos pendientes, que son todos y que podemos hacer que se añadan a `MassiveUpdateContext` mediante el flag `--append-snippets`

```
bin\behat --suite end_to_end --append-snippets
```

De este modo, podemos hacer tests de aceptación en dos niveles diferentes, o en tantos como consideremos necesario, a partir de una única historia de usuario. En un futuro no muy lejano exploraremos cómo testear tanto web como api desde aquí.

### Moviendo las *Specs*

Toca el turno a las especificaciones de `phpspec`. Mi mayor duda en este momento es cómo considerarlas en el contexto de un proyecto. Por un lado, no dejan de ser tests unitarios y tendría sentido ponerlas directamente bajo la carpeta `tests/Unit`. Sin embargo, hay equipos que podrían preferir mantener separados estos tests de los realizados con `phpunit`.

Por un lado, sintonizo con esta última idea: usar `phpspec` para el diseño y `phpunit` para tests unitarios más orientados al control de calidad, ya que `phpspec` fuerza algunas limitaciones como la de no poder usar *Data Providers* o las dificultades que puede tener para testear código *legacy* o, en general, código existente con defectos de diseño.

En cualquier caso, la diferencia para configurarlo sería nada más que un nombre de carpeta.

Ya habíamos creado un archivo de configuración de `phpspec`, con el nombre de phpspec.yml, por lo que vamos a ver cómo ampliarlo. Empezamos definiendo test suites, para lo que recomendaría usar el mismo nombre que las definidas para `behat`:

```php
formatter.name: pretty

suites:
  product:
    spec_prefix: Spec
    src_path: '%paths.config%/src'
    spec_path: '%paths.config%/tests'
```

Para hacer funcionar la configuración, moveremos la actual carpeta `specs` dentro de `tests` y le cambiaremos el nombre a Spec. Debería quedar algo así:

```
tests
├── Acceptance
│   └── Product
│       ├── Context
│       └── Features
├── Spec
│   └── TalkingBit
│       └── BddExample
│           ├── FileReader
│           ├── Persistence
│           └── VO
└── Unit
```

### Personalizar el código generado por `phpspec`

`phpspec` es capaz de ayudarnos con los pasos más tediosos de la generación de código, para lo que utiliza un sistema de plantillas que se pueden personalizar guardando archivos con extensión **.tpl** en una carpeta `.phpspec` en la raíz del proyecto. Por ejemplo:

**class.tpl** En esta plantilla hago que se genere la clase con strict_types

```php
<?php
declare (strict_types = 1);%namespace_block%

class %name%
{
}

```

**specification.tpl**

```php
<?php

namespace %namespace%;

use %subject%;
use PhpSpec\ObjectBehavior;
use Prophecy\Argument;

class %name% extends ObjectBehavior
{
    public function it_is_initializable(): void
    {
        $this->shouldHaveType(%subject_class%::class);
    }
}

```

Puedes sobreescribir cualquier plantilla de estas para adaptarla a tus preferencias de estilo de código:

* class.template
* interface.template
* interface_method_signature.template
* method.template
* named_constructor_create_object.template
* named_constructor_exception.template
* private-constructor.template
* returnconstant.template
* specification.template

Puedes ver las originales en la carpeta buscando en el `vendor/phpspec` de tu proyecto `src/PhpSpec/CodeGenerator/Generator/templates`.

Una cosa que no podemos hacer es cambiar la convención de nombres de de ejemplos de `phpspec` que usa *snake_case* en lugar de la recomendación PSR de usar *camelCase*, y [y aquí puedes leer una discusión bastante profunda sobre las razones](https://github.com/phpspec/phpspec/issues/608).

Se trata de una herramienta con [opiniones muy marcadas acerca de cómo programar y cómo hacer TDD](https://inviqa.com/blog/my-top-ten-favourite-phpspec-limitations). Me gustaría hablar de eso más a fondo en un futuro artículo, aunque te puedo adelantar que ha sido clave en mi aprendizaje personal sobre TDD.

## Y ahora… ¿qué?

En estos cuatro primeros capítulos hemos explorado las bases del BDD con las herramientas `behat` y `phpspec`, con lo que ya estaríamos listos para empezar a aplicar este enfoque en nuestros proyectos.

Ahora querríamos seguir esta serie de artículos con dos enfoques: uno más teórico que nos sirva para desarrollar la idea del Behavior Driven Development y su aplicación en la interacción con negocio y otro más aplicado, orientado a la realización de distintos tipos de tests usando las herramientas disponibles.
