---
layout: post
title: Patrones de uso de dobles de test
categories: articles
tags: testing
---

En este artículo proponemos varios patrones prácticos para crear y utilizar test doubles.

## Usar o no usar dobles

### Usar las clases reales siempre que se pueda

El primer patrón de creación y uso de dobles de test es no usarlos. Es decir, en la medida de lo posible en los tests es preferible usar los objetos "reales" en lugar de doblarlos.

Sin embargo, hay muchas buenas razones para usar dobles. En situaciones de test nos interesa asegurar que el comportamiento que se ejecuta en la unidad bajo test es exactamente el que queremos verificar. Esto es, si probamos una unidad de software (ya sea una única clase aislada, ya sean varias coordinadas) queremos cerciorarnos de que solo esa unidad, o ese conjunto, sea la responsable del resultado que obtenemos y que ese resultado no está afectado por elementos externos.

Por otro lado, los objetos reales pueden perjudicar aspectos como la velocidad o fortaleza de los test, introduciendo variables no deseadas que, incluso sin afectar al resultado devuelto, pueden hacerlos demasiado lentos o provocar fallos por razones ajenas al comportamiento que queremos testear. Esto perjudica la utilidad del test y del ciclo de *feedback* que nos puede proporcionar.

De ahí los distintos niveles de test: unitarios, de integración y de aceptación, que definen el ámbito de los tests delimitando sus fronteras.

### Los dobles como fronteras

Los dobles están intrínsecamente ligados a las fronteras del nivel de test. De hecho, podríamos decir que las definen.

Por ejemplo, supongamos que deseamos testear un servicio que utiliza un repositorio para obtener entidades y realizar una operación con ellas, como calcular el importe de un carrito de la compra a partir de los productos que contiene. Este repositorio está implementado mediante un ORM y accede a una base de datos que reside en otra máquina.

**En el nivel unitario** los límites del test están en la unidad probada y normalmente la verificamos en aislamiento, por lo que sus colaboradores estarán en la frontera del ámbito del test y, por tanto, son candidatos a ser doblados. En nuestro ejemplo, la funcionalidad que aporta el servicio no es obtener los productos, sino realizar el cálculo del importe. 

Obtener los productos es tarea del repositorio, el cual se convierte en la frontera del test en este nivel. Lo que haya más allá no nos importa, nos basta con que nos devuelva una colección representativa de productos con datos suficientes para permitir el cálculo. También nos puede interesar simular que ese repositorio está inaccesible o que alguno de los productos que solicitamos no está en el repositorio, de modo que podamos verificar cómo reacciona nuestro servicio bajo test en distintas circunstancias.

Para poder controlar eso, normalmente tendremos que doblar el repositorio con una o varias implementaciones alternativas que nos procuren los escenarios deseados. 

**En el nivel de integración**, los límites del test vienen definidos por las unidades que trabajan juntas (integradas) en ese subsistema, por lo que otros subsistemas serían candidatos a ser doblados. En nuestro ejemplo, el repositorio es ahora parte del subsistema que estamos probando y reside dentro de sus fronteras. 

Ahora queremos verificar que el servicio utiliza el repositorio correctamente y se entiende con él. Sin embargo, la base de datos "física" y su contenido estaría fuera del ámbito del test y necesitaríamos reemplazarla con una base de datos local o en memoria que nos permita un acceso más rápido y con datos controlados, tanto para no afectar a datos de producción como para, de nuevo, garantizar que podemos probar los escenarios que necesitamos.

**En el nivel de aceptación**, las fronteras están en los sistemas externos que no están bajo nuestro control. De hecho, accederemos al subsistema concreto que va a ser ejercitado en el test a través de otros componentes de la aplicación (interface web, api, consola, etc.), pues en este nivel los límites del sistema, sus puntos de entrada y salida, son los mismos límites del test. De ahí que también hablemos de tests end-to-end o de extremo a extremo.

### Doblar lo que es costoso

Como hemos visto, una clase puede utilizar colaboradores que tienen condicionantes fuera de nuestro control o perjudiciales para elaborar tests rápidos y sólidos, como pueden ser: tener sus propias dependencias, tener un alto coste de ejecución, tener fallos no predecibles o que están sujetos a condiciones que no podemos controlar, como es el caso de sistemas de bases de datos, Apis o servicios web, sistemas remotos, adaptadores a microservicios, etc. 

En esos casos, que además suelen ser difíciles de instanciar y necesitan configuración para funcionar, nos interesará doblar esos colaboradores para simular las diversas condiciones del servicio: que funciona correctamente, que esté caído, que responda con demasiada latencia o lentitud, etc.

En otros casos, los colaboradores estarán bajo nuestro control, no tendrán dependencias, serán rápidos, etc. En muchos casos se tratará de comportamientos de la propia clase bajo test extraídos para su reutilización. Entonces no sería necesario doblarlos.

Tampoco es necesario doblar aquellos objetos que utiliza nuestra unidad bajo test pero que podemos considerar como "objetos dato". Es decir, objetos que nos interesan más por representar o transportar entidades o valores que por su comportamiento. En este grupo entran entidades, value objects, DTOs y otros objetos similares.

Tomemos por ejemplo el patrón **Command** de dos componentes. Este patrón consta de dos elementos: el **Command**, que aporta la información para la ejecución, y el **CommandHandler**, que aporta el comportamiento. 

Si queremos testear el **CommandHandler**, no tenemos que doblar el **Command**. Sin embargo, seguramente tengamos que doblar las dependencias propias del CommandHandler.

Examinemos la situación:

```php
<?php
declare (strict_types=1);

namespace App\Application\Book;

class GetBooksByCategoryCommand
{
    /** @var string */
    private $category;

    public function __construct(string $category)
    {
        $this->category = $category;
    }

    public function category(): string
    {
        return $this->category;
    }
}
```

```php
<?php
declare (strict_types=1);

namespace App\Application\Book;

use App\Domain\Book\BookRepositoryInterface;

class GetBooksByCategoryCommandHandler
{
    /** @var BookRepositoryInterface */
    private $bookRepository;

    public function __construct(BookRepositoryInterface $bookRepository)
    {
        $this->bookRepository = $bookRepository;
    }

    public function execute(GetBooksByCategoryCommand $getBooksByCategoryCommand): array
    {
        return $this->bookRepository
            ->findByCategory($getBooksByCategoryCommand->category());
    }
}
```

En el test:

```php
<?php
declare (strict_types=1);

namespace Tests\App\Application\Book;

use App\Application\Book\GetBooksByCategoryCommandHandler;
use App\Application\Book\GetBooksByCategoryCommand;
use App\Domain\Book\BookRepositoryInterface;
use PHPUnit\Framework\TestCase;

class GetBooksByCategoryCommandHandlerTest extends TestCase
{

    public function testShouldReturnBooksByCategory(): void
    {
        $command = new GetBooksByCategoryCommand('category');

        $bookRepository = $this->createMock(BookRepositoryInterface::class);
        $bookRepository
            ->method('findByCategory')
            ->willReturn(['book1', 'book2']);
            
        $handler = new GetBooksByCategoryCommandHandler($bookRepository);

        $this->assertCount(2, $handler->execute($command));
    }
}
```

Pero también hay que tener en cuenta un factor pragmático. En ocasiones puede ser más complejo montar uno de estos objetos que generar su doble, especialmente si solo nos vamos a fijar en unos pocos de sus métodos o propiedades, o incluso si no vamos a hacer ningún uso de ellos, porque en la unidad probada el objeto simplemente se va despachando entre diversos colaboradores, algo bastante habitual en UseCases.

```php
<?php
declare (strict_types=1);

namespace App\Application\Book;

use App\Domain\Book\Book;
use App\Domain\Book\BookRepositoryInterface;

class PrintBookCommandHandler
{
    /** @var BookPrinterInterface */
    private $bookPrinter;
    /** @var BookRepositoryInterface */
    private $bookRepository;

    public function __construct(BookRepositoryInterface $bookRepository, BookPrinterInterface $bookPrinter)
    {
        $this->bookRepository = $bookRepository;
        $this->bookPrinter = $bookPrinter;
    }

    public function execute(PrintBookCommand $printBookCommand): string
    {
        $book = $this->bookRepository
            ->getById($printBookCommand->bookId());

        return $this->bookPrinter->print($book);
    }
}
```

En el código podemos ver que `$book` no se usa dentro del CommandHandler, por lo que no sería problema usar un doble en lugar de instanciar un objeto real:

```php
<?php
declare (strict_types=1);

namespace Tests\App\Application\Book;

use App\Application\Book\BookPrinterInterface;
use App\Application\Book\PrintBookCommand;
use App\Application\Book\PrintBookCommandHandler;
use App\Domain\Book\Book;
use App\Domain\Book\BookRepositoryInterface;
use PHPUnit\Framework\TestCase;

class PrintBookCommandHandlerTest extends TestCase
{

    public function testShouldPrintABook(): void
    {
        $book = $this->createMock(Book::class);

        $bookRepository = $this->createMock(BookRepositoryInterface::class);
        $bookRepository
            ->method('getById')
            ->willReturn($book);

        $bookPrinter = $this->createMock(BookPrinterInterface::class);
        $bookPrinter
            ->method('print')
            ->willReturn('path/to/file.pdf');

        $command = new PrintBookCommand('book-id');
        $handler = new PrintBookCommandHandler($bookRepository, $bookPrinter);

        $this->assertEquals('path/to/file.pdf', $handler->execute($command));
    }
}
```



Así que, en esos casos, podemos permitirnos doblar objetos en lugar de instanciarlos en beneficio de la velocidad de desarrollo y la expresividad del test. En Test Driven Development, usar dobles nos permite ir descubriendo las interfaces que necesitamos, utilizándolos como *placeholders* mientras no nos detenemos a desarrollar las clases colaboradores.

## Utilizar una librería de dobles

Existen diversas librerías con las que generar dobles para test que nos aportan algunas utilidades interesantes, así como una manera cómoda y rápida de obtener los que necesitamos en cada caso. **PHPUnit** integra una utilidad propia. También integra el framework **Prophecy**, que ofrece una alternativa interesante para generar dobles aunque está diseñada para trabajar mano a mano con **PHPSpec** en TDD y BDD.

Hay un oferta bastante amplia de otras librerías de dobles, pero nos centraremos en estas dos.

## Creación básica de dobles

En este apartado veremos patrones básicos de creación de dobles.

La manera más sencilla de crear un doble de test en **PHPUnit**, sería utilizar el método `createMock` de nuestro test case:

```php
$generateUserPassword = $this->createMock(GenerateUserPassword::class);
```

Si prefieres usar **prophesize**, el método es un poco más *verboso*:

```php
$generateUserPassword = $this->prophesize(GenerateUserPassword::class)->reveal();
```

La diferencia aquí es que `prophesize` devuelve un objeto Prophet que realmente es un builder que nos permite configurar el doble, el cual obtenemos con el método reveal, una vez configurado.

**PHPUnit** también nos permite crear un `builder` para personalizar al máximo lo que necesitamos de él, pero la verdad es que `createMock` nos servirá como atajo válido para la mayoría de los casos generando un doble que podremos usar sin más y al que le podremos configurar su comportamiento gracias a los métodos `expects` y `method`.

Esta diferencia supone un pequeño engorro a la hora de usar **Prophecy** frente al `MockBuilder` nativo de **PHPUnit** y es que te obliga a instanciar la unidad bajo test en cada test, en lugar de poder hacerlo una única vez en el `setup`, como veremos más adelante en detalle.

Finalmente, podemos crear dobles usando clases anónimos que extienden la clase que estamos doblando o implementan su interfaz.

```php
$generateUserPassword = new class() extends GenerateUserPassword {};
```

### Crea dobles a partir de interfaces, siempre que sea posible

Tenemos dos posibilidades dependiendo de que dispongamos o no de interfaces explícitas. Si hay una interfaz definida para el tipo de objeto que queremos doblar es preferible usarla:

```php
$generateUserPassword = $this->createMock(PasswordGeneratorInterface::class);
```

De este modo nos centramos en la interfaz que nos interesa. Si, por ejemplo, alguna de las implementaciones que podríamos doblar está cumpliendo otras interfaces (o simplemente está violando el principio de sustitución de Liskov) nos evitamos tener que cargarnos de métodos extra (en aplicación del principio de segregación de interfaces).

La otra opción, es crear el doble a partir de una implementación.

```php
$generateUserPassword = $this->createMock(GenerateSecureUserPassword::class);
```

Generando así los dobles no encontraremos grandes diferencias prácticas, por no decir ninguna, pero siempre que usamos interfaces garantizamos bajo acoplamiento lo que siempre es una ventaja de cara al futuro.

### Creación con clases anónimas

De forma alternativa podríamos crear un doble instanciando una clase anónima. Es un método muy eficiente, aunque puede resultar trabajoso si las interfaces son complejas o si no disponemos de ellas. En esta modalidad, queda mucho más claro el beneficio que aportan las interfaces explícitas, incluso aunque solo tengamos una implementación de producción.

En primer lugar, vamos a suponer que tenemos una interfaz:

```php
interface PasswordGeneratorInterface
{
    public function generate(): string;
}
```

En ese caso, podemos instanciar el doble así:

```php
$passwordGenerator = new class() extends PasswordGeneratorInterface {
    
    public function generate(): string
    {
        return 'super-secret-password';
    }
};
```

Ahora, imaginemos que no tenemos una interfaz explícita, sino que contamos solo con una implementación.

```php
class CalculateFee 
{
    private $productRepository;
    private $priceRepository;
    
    public function __construct(
        ProductRepositoryInterface $productRepository,
        PriceRepositoryInterface $priceRepository
    ) {
        $this->productRepository = $productRepository;
        $this-priceRepository = $priceRepository;
    }
    
    public function forProduct(Product $product): int
    {
        // long and complex code for calculation
        
        return $fee;
    }
}
```

La mejor solución sería extraer una interfaz y hacer que el doble la implemente, lo que nos libera de muchos problemas. También debes hacer que los consumidores dependan de la interfaz para que todo funcione.

```php
interface CalculateFeeInterface
{
    public function forProduct(Product $product): int;
}
```

Con esto no tenemos más que:

```php
$calculateFee = new class() implements CalculateFeeInterface {
    public function forProduct(Product $product)
    {
        return 100;
    }
};
```

Lo anterior viene siendo la aplicación de la estructura *ports and adapters* también a los elementos que usamos en los tests.

Ahora bien, si por alguna razón no queremos o no podemos extraer la interfaz explícita, quizá porque estamos doblando una dependencia de terceros o por la razón que sea, crear el doble es posible, aunque un poco más costoso.

Imaginemos que tenemos que hacerlo con el mismo ejemplo de antes. En este caso, lo que haremos será extender la clase:

```php
$calculateFee = new class() extends CalculateFee {
    
    public function __construct()
    {
    }
    
    public function forProduct(Product $product): int
    {
        return 100;
    }
}
```

Vamos a fijarnos en varios detalles que, además, nos ayudarán a entender cómo funcionan los dobles de test:

El primer detalle es que tenemos que sobreescribir el constructor para evitar las dependencias que pueda tener la clase `CalculateFee`. En el ámbito del test, el doble ha de ser un cascarón vacío, sin comportamiento y sin dependencias innecesarias. De este modo, instanciar un doble tiene que ser sencillo e inmediato.

El segundo detalle es que sobreescribimos los métodos en los que estamos interesados en el test para que no puedan realizar su comportamiento estándar. De nuevo la idea del cascarón vacío. 

Para asegurar la intercambiabilidad, necesitamos reproducir la signatura de los métodos. Eso es algo a lo que estaríamos obligados en caso de usar una interfaz explícita, pero al hacerlo extendiendo una implementación deberíamos respetarlo aunque el lenguaje pueda permitirnos no hacerlo.

El *return type* nos obliga a devolver un valor y simplemente devolvemos un valor cualquiera compatible.

## Crear dummies

Los *dummies* son dobles que no tienen comportamiento. Por definición, sus métodos devolverán `null`. Se suele decir que se utilizan para poder cumplir una interfaz.

Crearemos un `dummy` cuando necesitemos un doble de un colaborador de nuestra clase del cual no nos interesa que llegue a realizar su comportamiento en un determinado test.

Para hacerlo nos basta con utilizar el método `createMock` de nuestro test case:

```php
$generateUserPassword = $this->createMock(GenerateUserPassword::class);
```

Con **prophecy**:

```php
$generateUserPassword = $this->prophesize(GenerateUserPassword::class)->reveal();
```

De forma alternativa podríamos crear un dummy mediante una clase anónima, extendiendo el colaborador y sobreescribiendo sus métodos para evitar que se ejecuten (cuando no tenemos interfaz explícita):

```php
$generateUserPassword = new class() extends GenerateUserPassword {
    public function __construct()
    {
        // Overriden construct
    }
    
    public function generate(): string
    {
        return null;
    }
}
```

Lo más llamativo de este ejemplo es que el método `generate`, que debería devolver un string por *return type* lanzará una excepción en caso de que lleguemos a utilizarlo, cosa que no es nuestra intención en este momento.

Veamos ahora algunos patrones de uso:

### Instanciación de la unidad bajo test

Cuando necesitamos simplemente instanciar la unidad bajo test tenemos que pasarle los colaboradores adecuados los cuales, normalmente, no se utilizarán en el constructor más que para ser asignados a variables de clase.

En el ejemplo a continuación podemos ver como en el método setUp creamos dummies de los colaboradores, los cuales convertimos en stubs en el test al configurarles comportamientos.

```php
<?php
declare (strict_types=1);

namespace Tests\App\Application\Book;

use App\Application\Book\BookPrinterInterface;
use App\Application\Book\PrintBookCommand;
use App\Application\Book\PrintBookCommandHandler;
use App\Domain\Book\Book;
use App\Domain\Book\BookRepositoryInterface;
use PHPUnit\Framework\TestCase;

class PrintBookCommandHandlerTest extends TestCase
{
    private $handler;
    private $bookRepository;
    private $bookPrinter;

    protected function setUp(): void
    {
        $this->bookPrinter = $this->createMock(BookPrinterInterface::class);
        $this->bookRepository = $this->createMock(BookRepositoryInterface::class);
        $this->handler = new PrintBookCommandHandler($this->bookRepository, $this->bookPrinter);
    }

    public function testShouldPrintABook(): void
    {
        $book = $this->createMock(Book::class);

        $this->bookRepository
            ->method('getById')
            ->willReturn($book);

        $this->bookPrinter
            ->method('print')
            ->willReturn('path/to/file.pdf');

        $command = new PrintBookCommand('book-id');

        $this->assertEquals('path/to/file.pdf', $this->handler->execute($command));
    }
}
```

Cuando testeamos servicios, usecases y otros objetos que no tienen estadoes una buena idea instanciarlos en el setup, de modo que nos evitemos repetir el proceso en cada test. Dentro de cada test configuramos el comportamiento que nos interesa para ese escenario concreto, lo que nos permite un test menos farragoso y más claro.

Esto es algo que podemos hacer fácilmente con el `mockBuilder` de **PHPUnit**.

Con **prophesize** tenemos que usar otro enfoque un poco más incómodo, teniendo que instanciar la unidad bajo test en cada test.

```php
<?php
declare (strict_types=1);

namespace Tests\App\Application\Book;

use App\Application\Book\BookPrinterInterface;
use App\Application\Book\PrintBookCommand;
use App\Application\Book\PrintBookCommandHandler;
use App\Domain\Book\Book;
use App\Domain\Book\BookRepositoryInterface;
use PHPUnit\Framework\TestCase;

class PrintBookCommandHandlerTest extends TestCase
{
    private $bookRepository;
    private $bookPrinter;

    protected function setUp(): void
    {
        $this->bookPrinter = $this->prophesize(BookPrinterInterface::class);
        $this->bookRepository = $this->prophesize(BookRepositoryInterface::class);
    }

    public function testShouldPrintABookWithProphecy(): void
    {
        $book = $this->prophesize(Book::class)->reveal();

        $this->bookRepository
            ->getById('book-id')
            ->willReturn($book);

        $this->bookPrinter
            ->print($book)
            ->willReturn('path/to/file.pdf');

        $command = new PrintBookCommand('book-id');
        $handler = new PrintBookCommandHandler(
            $this->bookRepository->reveal(),
            $this->bookPrinter->reveal()
        );

        $this->assertEquals('path/to/file.pdf', $handler->execute($command));
    }
}
```

### Instancias de parámetros

Se suele decir que los dummies se crean para poder cumplir una interfaz de la unidad bajo test. Es decir, para tener un objeto que podamos pasar como parámetro al método testeado respetando el type hinting, aunque no tengamos que llamarlo directamente.

En muchos use cases las entidades y valores pasados como parámetros no son usados nunca directamente por el código bajo test, sino que este código coordina la actuación de los colaboradores pasándole estas entidades o valores tal cual. Por eso, en este tipo de situaciones un dummy es el objeto adecuado.

En este test, que ya hemos visto más arriba, `Book` se utiliza como *dummy*:

```php
public function testShouldPrintABook(): void
{
    $book = $this->createMock(Book::class);

    $this->bookRepository
        ->method('getById')
        ->willReturn($book);

    $this->bookPrinter
        ->method('print')
        ->willReturn('path/to/file.pdf');

    $command = new PrintBookCommand('book-id');

    $this->assertEquals('path/to/file.pdf', $this->handler->execute($command));
}
```

## Crear Stubs

Los *stubs* son dobles que tienen un comportamiento fijo, devolviendo una respuesta predeterminada cada vez que se les llama. Los *stubs* se usan para simular de forma controlada el comportamiento de los colaboradores de un objeto.

La idea es generar distintos escenarios a los que la unidad bajo test debe poder reaccionar y verificar, por tanto, que lo maneja de la forma correcta. 

### Stubs optimistas

Algunos de estos comportamientos son **optimistas**, es decir, el doble simula que la respuesta del colaborador es de un tipo esperable y manejable por la unidad bajo test. En el ejemplo anterior, tanto `$bookPrinter` como `$bookRepostory` son configurados como stubs simplemente indicando qué deben devolver cuando son llamados algunos de sus métodos:

```php
$this->bookRepository->method('getById')->willReturn($book);

$this->bookPrinter
    ->method('print')
    ->willReturn('path/to/file.pdf');
```

El mismo patrón con **prophecy** queda así (recuerda que debes llamar a reveal para obtener el doble que tienes que pasar como dependencia):

```php
$this->bookRepository
    ->getById(Argument::any())
    ->willReturn($book);

$this->bookPrinter
    ->print(Argument::any())
    ->willReturn('path/to/file.pdf');
```

Podemos ver que un aspecto ventajoso de prophecy es que llamas al mismo método que pretendes `stubbear`, siendo en este aspecto más fácil de escribir y leer.

Con una clase anónima también podemos crear *stubs* usando varios patrones. Este sería quizá el más sencillo:

```php
$bookPrinter = new class () implements BookPrinterInterface {
    public function print(Book $book): string
    {
        return 'path/to/file.pdf';
    }
}
```

En ocasiones nos puede convenir poder configurar de algún modo el stub para poder reutilizarlo sin estar condicionados por una respuesta prefijada única o simplemente porque la respuesta puede tener cierta complejidad y preferimos prepararla fuera. Esto lo podemos hacer pasando las respuestas deseadas mediante el constructor:

```php
$bookRepository = new class($book) implements BookRepositoryInterface {

    private $book;

    public function __construct(Book $book)
    {
        $this->book = $book;
    }
    
    public function getById(string $id): Book
    {
        return $this->book;
    }
}
```

A medida que aumentan las posibles respuestas a configurar o la cantidad de lógica que tendríamos que introducir en estos dobles generados mediante clases anónimas, se ve más clara la conveniencia de utilizar librerías de dobles, que nos puede ahorrar bastante esfuerzo.

### Llamadas múltiples a un colaborador

Normalmente los dobles serán *idempotentes*, es decir, siempre que sean llamados devolverán exactamente la misma respuesta. Por tanto, si no especificamos otra cosa, cuando el mismo método de un doble recibe llamadas repetidas del código bajo test, realizará el mismo comportamiento.



### Respuesta del colaborador en función de los parámetros

En ocasiones es casi inevitable llegar a una situación en la que tenemos que disponer de una mínima lógica en el colaborador doblado que devuelva una respuesta según el parámetro recibido.



### Testear un cálculo interno con stubs

En los dos ejemplos anteriores no se establece una expectativa sobre el argumento exacto que se pasará a éstos métodos. Sin embargo, es posible especificarlo y asegurarnos así de que los colaboradores son llamados con los parámetros deseados, lo que es útil cuando esos parámetros han sido calculados en el código de la unidad bajo test y queremos asegurarnos de que se han generado correctamente:

Con **mock builder**:

```php
$this->bookRepository
    ->method('getById')
    ->with('book-id')
    ->willReturn($book);

$this->bookPrinter
    ->method('print')
    ->with($book)
    ->willReturn('path/to/file.pdf');
```

Con **prophecy**:

```php
$this->bookRepository
    ->getById('book-id')
    ->willReturn($book);

$this->bookPrinter
    ->print($book)
    ->willReturn('path/to/file.pdf');
```

### Stubs pesimistas: el colaborador lanza una excepción

Otros comportamientos son **pesimistas** simulando condiciones como excepciones o diversos tipos de fallos o incluso respuestas inconsistentes de los colaboradores:

```php
$this->bookRepository
    ->method('getById')
    ->willThrowException(new BookNotFound());
```

Con **prophecy**:

```php
$this->bookRepository
    ->getById(Argument::any())
    ->willThrowException(new BookNotFound());
```

Con una clase anónima no tenemos más que hacer que el *stub* lance una excepción incondicional:

```php
$bookRepository = new class($book) implements BookRepositoryInterface {

    public function getById(string $id): Book
    {
        throw new BookNotFound(sprintf('Book not found with id %s', $id));
    }
}
```

## Mocks: Verificar que un colaborador ha sido llamado

Cuando queremos verificar que un colaborador ha sido llamado por nuestro código bajo test tenemos la tentación de crear un *mock* o un *spy*, es decir, un doble que registra el modo en que ha sido utilizado.

Para testear esto de manera explícita podemos hacerlo mediante este patrón en **PHPUnit**:

```php
$this->bookRepository
    ->expects(self::once())
    ->method('save')
    ->with($book);
```

**self::once()** representa que se espera que sea llamado una vez y existen `constraints` para otras necesidades que puedes consultar en la documentación.

En **prophecy**, se puede expresar de esta forma:

```php
$this->bookRepository
    ->save($book)
    ->shouldBeCalled()
    ->willReturn($book);
```

Sin embargo, no deberías abusar de estas expectativas. Establécelas tan solo cuando una llamada a un colaborador sea el efecto que esperamos que provoque el código.

Por ejemplo, en este test no hay ninguna necesidad de esperar las llamadas ya que está implícito que el resultado devuelto por el `handler` se obtiene porque esas llamadas se ejecutan realmente:

```php
    public function testShouldPrintABook(): void
    {
        $book = $this->createMock(Book::class);

        $this->bookRepository
            ->expects(self::once())
            ->method('getById')
            ->willReturn($book);

        $this->bookPrinter
            ->expects(self::once())
            ->method('print')
            ->willReturn('path/to/file.pdf');

        $command = new PrintBookCommand('book-id');

        $this->assertEquals('path/to/file.pdf', $this->handler->execute($command));
    }
```

La peor consecuencia de hacer este tipo de test es que acabas testeando la implementación de la unidad bajo test, no su comportamiento, y el test fallará cuando quieras refactorizarlo.

Si la unidad bajo test no devuelve una respuesta tendremos que fijar una expectativa sobre los efectos que esperamos que cause su ejecución:

```php
    public function testShouldSendMessage(): void
    {
        $book = $this->createMock(Book::class);

        $this->bookRepository
            ->method('getById')
            ->willReturn($book);

        $this->bookSender
            ->expects(self::once())
            ->method('send');

        $command = new SendBookCommand('book-id');

        $this->handler->execute($command;
    }
```

## Crear el doble de una clase que no existe

Si haces Test Driven Development es frecuente encontrarte con que a medida que desarrollas vas descubriendo la necesidad de disponer de colaboradores para la unidad concreta en la que estás trabajando pero, a la vez, no tienes una idea clara de cual debería ser su interfaz, pero tampoco quieres apartar el foco de la parte que estás escribiendo.

Así puedes crear un doble sin tener que salir del test:

```php
$this->getMockBuilder('CollaboratorClass')
    ->setMethods(array('foo'))
    ->getMock();
```

Por ejemplo:

```php
public function testNativeShouldReturnAListOfBooks(): void
{
    $repository = $this->getMockBuilder('BookRepository')
        ->setMethods(array('findByCategory'))
        ->getMock();
    $repository
        ->method('findByCategory')
        ->willReturn(['book1', 'book2']);

    $getBooksByCategory = new GetBooksByCategory($repository);
    $result = $getBooksByCategory->execute('category');

    $this->assertCount(2, $result);
}
```

Esta técnica, sin embargo, no es posible con Prophecy, que necesita que exista la interfaz o la clase que deseas doblar.

## Crear el doble de una clase que requiere constructor

Este caso lo comenté en [un artículo anterior](/splfileobject-double) acerca de los problemas para doblar el SplFileObject.

```php
$splFileObject = $this->getMockBuilder(SplFileObject::class)
    ->enableOriginalConstructor()
    ->setConstructorArgs(['/dev/null'])
    ->getMock();

$splFileObject->method('fgetcsv')->willReturn(['book1', 'book2']);
```

En Prophecy, se procede de la forma habitual en este framework:

```php
$splFileObjectProphet = $this->prophesize(SplFileObject::class);
$splFileObjectProphet->fgetcsv('category')->willReturn(['book1', 'book2']);

$splFileObject = $splFileObjectProphet->reveal();
```

## Testeando con dependencias no inyectadas

A veces nos podemos encontrar con la siguiente situación, relativamente frecuente en algunos frameworks o en bases de código que utilizan mucho la herencia: queremos testear una clase que extiende de otra, la cual instancia en su interior una dependencia en lugar de serle inyectada.

El problema viene cuando esa dependencia necesita ser doblada, como en este ejemplo en el que tenemos un cliente que hace llamadas a una API.

El primer paso sería intentar aislar la instanciación de la dependencia en un método de la clase en la que corresponda. No siempre tendremos acceso a ella para modificarla o no siempre será posible aislarla limpiamente.

En **PHPUnit** puedes hacer algo que suena contraintuitivo, doblando la clase bajo test pero diciendo que doble el método que instancia la dependencia. En este caso, la librería Guzzle proporciona un `MockHandler` para poder simular llamadas fácilmente.

```php
class ClientRepositoryTest extends TestCase
{
    private const CLIENT_REFEREES_RESPONSE = '[...]';

    public function testGetClientReferees()
    {
        $clientRepository = $this
            ->getMockBuilder(ClientRepository::class)
            ->disableOriginalConstructor()
            ->setMethods(['client'])
            ->getMock();

        $clientRepository
            ->method('client')
            ->willReturn($this->getGuzzleMock(
                \Illuminate\Http\Response::HTTP_OK,
                self::CLIENT_REFEREES_RESPONSE)
            );

        //...
    }

    private function getGuzzleMock(int $httpResponseCode, string $jsonResponse): Client
    {
        $mockHandler = new MockHandler([new Response($httpResponseCode, [], $jsonResponse)]);

        $handler = HandlerStack::create($mockHandler);

        return new Client(['handler' => $handler]);
    }
}
```

Con clases anónimas, puedes hacer algo como esto. Se trata de extender la clase bajo test y sobreescribir el método que instancia la dependencia.

```php
use GuzzleHttp\Client;
use PHPUnit\Framework\TestCase;

class ClientRepositoryTest extends TestCase
{
    public function getClientRepository($response)
    {
        
        $client = $this->createMock(Client::class);
        $client->method('get')->willReturn($response);

        $clientRepository = new class($client) extends ClientRepository {
            
            protected $clientDouble;
            
            public function __construct(Client $client)
            {
                $this->clientDouble = $client;
            }

            protected function client(?string $bearer = null): Client
            {
                return $this->clientDouble;
            }

        };
        
        return $clientRepository;
    }
}

```

**Prophecy** está diseñado de modo que prohibe específicamente este tipo de arreglos para favorecer que siempre se inyecten las dependencias. Por eso, no siempre resulta fácil utilizarlo cuando trabajamos con legacy o código basado en ciertos frameworks.

## Puede que continúe

En este artículo hemos mostrado varios patrones que pueden ser útiles cuando necesitas dobles en un test. No descarto añadir algunos más en el futuro.
