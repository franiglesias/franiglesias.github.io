---
layout: post 
title: Outside-in y Behavior Driven Development 7 
categories: articles 
tags: tdd php bdd
---

En esta entrega veremos cómo usar un cliente HTTP de forma que los tests de aceptación sean independientes del código de aplicación.

1. [Introducción, herramientas y ejemplo](/outside-in-with-behat-phpspec/)
2. [Desarrollo del segundo escenario](/outside-in-with-behat-phpspec-2/)
3. [Desarrollo del tercer escenario](/outside-in-with-behat-phpspec-3/)
4. [Manejando bugs con BDD](/outside-in-with-behat-phpspec-4/)
5. [Añadiendo nuevas features](/outside-in-with-behat-phpspec-5/)
6. [Consideraciones sobre BDD](/outside-in-with-behat-phpspec-6/)
7. [Usar un cliente Http](/outside-in-with-behat-phpspec-7/)

## Desacoplando los tests de la aplicación

En general es recomendable aislar los tests de **behat** de la aplicación de tal modo que solo uses los puntos de entrada y salida propios, como podrían ser los endpoints de la API o la ejecución de un comando de consola. Podrías incluso usar los mismos tests aunque en un momento dado la aplicación se reescribiese con otro framework o con otro lenguaje.  

Dado nuestra aplicación expone una API y suponemos que el front es una aplicación externa vamos a testear con un cliente HTTP real. Es habitual usar `crawlers` en Behat porque muchas veces queremos testear también front-end. Nosotros vamos a implementar un cliente HTTP con Guzzle. De todo modos, podríamos generar diferentes contextos a partir de los mismos tests Gherkin, de modo que podríamos hacer tests sobre el front-end, si fuese el caso.

Guzzle se instala con:

```
composer require --dev guzzlehttp/guzzle
```

En nuestro ejemplo podríamos ponerlo como requisito de desarrollo, ya que realmente no vamos a usarlo para implementar nada, pero hoy por hoy sería raro un proyecto que no requiera conectarse a una API externa, así que está bien requerirlo como dependencia general.

```
composer require guzzlehttp/guzzle
```

A fin de usarlo en nuestro proyecto actual tenemos que hacer algunos ajustes. 

Por una parte, estamos ejecutando el proyecto en contenedores docker, por lo que debemos tener en cuenta que **dentro del sistema de contenedores** la URL base es: `http://bdd-webserver` y sirve en el puerto 80. Si ejecutásemos los tests desde fuera de los contenedores la URL base es, en cambio, `http://localhost:8088`. Esto es una fuente de frustración bastante habitual, al menos para mí.

Por otra parte, actualmente estamos simulando las peticiones a la API enviando directamente `Request` al `Kernel` de **Symfony**, lo que nos devuelve un objeto `Response` propio del componente `HttpFoundation`. **Guzzle** nos devolvería la respuesta usando un objeto `Response` propio que implementa la `ResponseInterface` de PSR7. Esta interfaz y la de Symfony no son totalmente compatibles y esto supone un pequeño problema, pues hay que cambiar algunas cosas en los Context para que todo funcione.

Y, finalmente, tenemos otro gran problema: no tenemos persistencia. La simulación de las requests mediante el Kernel nos permite tener repositorios en memoria. En cambio, con un cliente real, el contenido se pierde entre request y request. Necesitamos tener algún almacenamiento menos volátil.

## Hagamos persistente la persistencia

Lo mejor será abordar este último problema en primer lugar. Modificar el mecanismo de persistencia será fácil, ya que tenemos la protección de los tests existentes.

En el proyecto existe una clase llamada `FileStorageEngine` que proporciona una solución de persistencia sencilla para este tipo de proyectos y que hemos usado en ejemplos en otros lugares. Por tanto, se trataría de desarrollar una implementación alternativa de `TaskRepository` que llamaremos `FileTaskRepository`. Lo describimos:

```
bin/phpspec describe 'App\Infrastructure\Persistence\FileTaskRepository'
```

Ejecutamos con `bin/phpspec run` y nos pedirá crear la clase.

A decir verdad, `FileTaskRepository` debería funcionar exactamente igual que `MemoryTaskRepository`. Sin embargo, tendrá una dependencia de `FileStorageEngine`. Sabemos que `FileStorageEngine` funciona correctamente, por lo que podríamos usar la dependencia real y simplificar bastante el setup del ejemplo. Sin embargo, para que el ejemplo se ejecute de la manera más limpia posible, vamos a usar un sistema de archivos virtual con `vfsStream`.

```
composer require --dev mikey179/vfsstream
```

Esto nos permitirá no tener que usar un archivo real en el proyecto, sino que `vfsStream` simulará el sistema de archivos.

```php
<?php

namespace Spec\App\Infrastructure\Persistence;

use App\Infrastructure\Persistence\FileTaskRepository;
use App\Lib\FileStorageEngine;
use org\bovigo\vfs\vfsStream;
use PhpSpec\ObjectBehavior;
use Prophecy\Argument;

/**
 * @mixin FileTaskRepository
 */
class FileTaskRepositorySpec extends ObjectBehavior
{
	public function let(): void
	{
		vfsStream::setup('root', null, ['storage.data']);
		$storageFile = vfsStream::url('root/storage.data');
		$fileEngine = new FileStorageEngine($storageFile);

		$this->beConstructedWith($fileEngine);
	}
    public function it_is_initializable(): void
    {
        $this->shouldHaveType(FileTaskRepository::class);
    }
}
```

Al ejecutar esta especificación nos pedirá generar el método `__construct`. Con algunos arreglos, el código quedaría así:

```php
<?php
declare (strict_types = 1);

namespace App\Infrastructure\Persistence;

use App\Domain\Task;
use App\Domain\TaskId;
use App\Domain\TaskRepository;
use App\Lib\FileStorageEngine;

final class FileTaskRepository implements TaskRepository
{
	private FileStorageEngine $fileStorageEngine;

	public function __construct(FileStorageEngine $fileStorageEngine)
    {
		$this->fileStorageEngine = $fileStorageEngine;
	}

	public function store(Task $task): void
	{
		throw new \RuntimeException('Implement store() method.');
	}

	public function nextId(): int
	{
		throw new \RuntimeException('Implement nextId() method.');
	}

	public function findAll()
	{
		throw new \RuntimeException('Implement findAll() method.');
	}

	public function retrieve(TaskId $taskId): Task
	{
		throw new \RuntimeException('Implement retrieve() method.');
	}
}
```

Ahora, podemos ir añadiendo ejemplos, que serán los mismos que los de la implementación `MemoryTaskRepository`. Sin embargo, en algún caso tenemos que hacer cambios debido a que los objetos `Task` se reconstruyen y no son las mismas instancias, pero tienen los mismos valores. Fíjate en el uso de `shouldBeLike` en vez de `shouldEqual`, así como el uso de los 'id' en la respuesta esperada, algo que no teníamos en la versión Memory, por lo que aprovecho para corregir esta también.

```php
<?php

namespace Spec\App\Infrastructure\Persistence;

use App\Domain\Task;
use App\Domain\TaskId;
use App\Infrastructure\Persistence\FileTaskRepository;
use App\Lib\FileStorageEngine;
use org\bovigo\vfs\vfsStream;
use PhpSpec\ObjectBehavior;
use Spec\App\Domain\TaskExamples;

/**
 * @mixin FileTaskRepository
 */
class FileTaskRepositorySpec extends ObjectBehavior
{
	private const TASK_ID                  = '1';
	private const TASK_DESCRIPTION         = 'Write a test that fails.';
	private const ANOTHER_TASK_ID          = '2';
	private const ANOTHER_TASK_DESCRIPTION = 'Write code to make test pass';

	public function let(): void
	{
		vfsStream::setup('root', null, ['storage.data']);
		$storageFile = vfsStream::url('root/storage.data');
		$fileEngine  = new FileStorageEngine($storageFile);

		$this->beConstructedWith($fileEngine);
	}

	public function it_is_initializable(): void
	{
		$this->shouldHaveType(FileTaskRepository::class);
	}

	public function it_stores_tasks(): void
	{
		$task = TaskExamples::withData(self::TASK_ID, self::TASK_DESCRIPTION);

		$this->store($task);
		$this->nextId()->shouldBe(2);
	}

	public function it_retrieves_all_tasks(): void
	{
		$task        = TaskExamples::withData(self::TASK_ID, self::TASK_DESCRIPTION);
		$anotherTask = TaskExamples::withData(self::ANOTHER_TASK_ID, self::ANOTHER_TASK_DESCRIPTION);

		$this->store($task);
		$this->store($anotherTask);
		$this->findAll()->shouldBeLike(['1' => $task, '2' => $anotherTask]);
	}

	public function it_should_retrieve_existing_task_by_id(): void
	{
		$task = TaskExamples::withData(self::TASK_ID, self::TASK_DESCRIPTION);
		$anotherTask = TaskExamples::withData(self::ANOTHER_TASK_ID, self::ANOTHER_TASK_DESCRIPTION);

		$this->store($task);
		$this->store($anotherTask);
		$this->retrieve(new TaskId(self::TASK_ID))->shouldBeLike($task);
	}
}
```

El resultado es este repositorio:

```php
<?php
declare (strict_types = 1);

namespace App\Infrastructure\Persistence;

use App\Domain\Task;
use App\Domain\TaskId;
use App\Domain\TaskRepository;
use App\Lib\FileStorageEngine;

final class FileTaskRepository implements TaskRepository
{
	private FileStorageEngine $fileStorageEngine;

	public function __construct(FileStorageEngine $fileStorageEngine)
	{
		$this->fileStorageEngine = $fileStorageEngine;
	}

	public function store(Task $task): void
	{
		$tasks = $this->findAll();
		$tasks[$task->id()->toString()] = $task;
		$this->fileStorageEngine->persistObjects($tasks);
	}

	public function nextId(): int
	{
		return count($this->findAll()) + 1;
	}

	public function findAll(): array
	{
		return $this->fileStorageEngine->loadObjects();
	}

	public function retrieve(TaskId $taskId): Task
	{
		$tasks = $this->findAll();

		return $tasks[$taskId->toString()];
	}
}
```

Hay que hacer algunos cambios en los archivos `*Context`. Esto es porque necesitamos restaurar este repositorio cada vez que ejecutamos los contextos. En Behat disponemos de _hooks_ en forma de anotaciones `@Before*` y `@After*` para poner este tipo de cosas en el lugar adecuado. Limpiar la base de datos antes de ejecutar cada escenario parece la mejor solución. Puedes tener varios métodos con la misma anotación. Es muy importante recordar que estos métodos deberían tener visibilidad pública para que **behat** los vea.

```php
	/**
	 * @BeforeScenario
	 */
	public function resetDatabase(BeforeScenarioScope $scope): void
	{
		$file = new FileStorageEngine(__DIR__ . '/../../var/repository.data');
		$file->reset();
	}
```

Por otro lado, hay que definir el nuevo repositorio en services.yaml.

```yaml
    App\Domain\TaskRepository:
        class: App\Infrastructure\Persistence\FileTaskRepository
        arguments:
            - '@App\Lib\FileStorageEngine'
```

En conjunto, todos estos cambios hacen que las features y especificaciones pasen.

Puedes preguntarte: ¿por qué no hemos hecho antes? ¿Es realmente útil empezar con un repositorio en memoria y luego tener que implementar otro mecanismo? En mi opinión, hay tres ventajas por hacerlo así:

* **Feedback rápido**: implementar un almacenamiento en memoria es muy sencillo, incluso trivial en algunos lenguajes. En pocos minutos el sistema te está diciendo si funciona o no.
* **Reutilizable**: aunque en el medio o largo plazo vayas a reemplazarlo por otra implementación, el repositorio en memoria sigue siendo muy útil para usarlo como doble en tests de los casos de uso. Es superrápido y no tiene dependencias.
* No te comprometes prematuramente con un mecanismo de persistencia: al usar esta estrategia estamos posponiendo decisiones sobre detalles de implementación que pueden condicionar el desarrollo. De esta manera, podemos aprender mucho sobre lo que realmente necesitamos de la persistencia lo que nos ayudará a escoger la mejor solución. Por ejemplo, es muy posible que para esta aplicación nos baste con la solución que acabamos de implementar si es para uso personal. También podría ser válida una base de datos NoSql como MongoDB si queremos gestionar más cantidad de datos. Ahora, imagina que desde el principio hubiésemos optado por un ORM y una base de datos relacional como Postgres. Posiblemente habríamos estado introduciendo complejidad innecesaria.

## Testear con un cliente HTTP

El segundo problema que queremos abordar es el del cliente HTTP. Como hemos visto estamos simulando peticiones y respuestas mediante las herramientas proporcionadas por el framework **symfony**. De este modo, el test y la aplicación estarían acoplados. Esto puede no ser un problema, sino un compromiso aceptable. Sin embargo, hay varios detalles que nos resultan incómodos. Vamos a ver cómo solucionarlos.

Típicamente usamos **Guzzle** como motor para crear clientes especializados mediante composición, así que podríamos usar este mismo patrón y crear un ApiClient que nos permita modelar las interacciones con la aplicación de modo que sea fácilmente reutilizable.

El mayor inconveniente que vamos a tener es que la `Response` de `HttpFoundation` de **Symfony** no es completamente compatible con la `ResponseInterface` de [PSR7](https://www.php-fig.org/psr/psr-7/) que es la que usa **Guzzle**. En cualquier caso, incluso aunque esto no nos preocupe, es preferible depender bien de ese estándar o bien de nuestra propia interfaz. En realidad no necesitamos una interfaz tan prolija por lo que vamos a empezar con un objeto `ApiResponse` a medida, que nos proporcione la información que necesitamos en un formato que nos convenga.

```php
<?php

declare(strict_types=1);

namespace Design\App\Contexts;


final class ApiResponse
{

	private int $statusCode;
	private array $payload;

	public function __construct(int $statusCode, string $body)
	{
		$this->statusCode = $statusCode;
		$this->payload    = json_decode($body, true, 512, JSON_THROW_ON_ERROR);
	}

	public function statusCode(): int
	{
		return $this->statusCode;
	}

	public function payload(): array
	{
		return $this->payload;
	}
}
```

Ahora tenemos que ir reemplazando los usos de Symfony Response poco a poco, comprobando que los tests siguen pasando. En el primer paso simplemente añado su instanciación en paralelo, sin usarla todavía.

```php
<?php
declare (strict_types=1);

namespace Design\App\Contexts;

use Behat\Behat\Context\Context;
use Behat\Gherkin\Node\TableNode;
use PHPUnit\Framework\Assert as PHPUnitAssert;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\KernelInterface;
use Webmozart\Assert\Assert;

class AddTasksContext implements Context
{
	private KernelInterface $kernel;
	private Response $response;
	private ApiResponse $apiResponse;

	public function __construct(KernelInterface $kernel)
	{
		$this->kernel = $kernel;
		if (file_exists(__DIR__ . '/../../repository.data')) {
			unlink(__DIR__ . '/../../repository.data');
		}
	}

	/**
	 * @Given I have no tasks in my list
	 */
	public function iHaveNoTasksInMyList(): void
	{
		/** Empty for the moment */
	}

	/**
	 * @When I get my tasks
	 */
	public function iGetMyTasks(): void
	{
		$this->response = $this->apiGet('/api/todo');
		$this->apiResponse = new ApiResponse(
			$this->response->getStatusCode(),
			$this->response->getContent()
		);

		Assert::eq(Response::HTTP_OK, $this->response->getStatusCode());
	}

	/**
	 * @Then I see an empty list
	 */
	public function iSeeAnEmptyList(): void
	{
		$payload = $this->obtainPayloadFromResponse();

		Assert::isEmpty($payload);
	}

	/**
	 * @Given I add a task with description :taskDescription
	 */
	public function iAddATaskWithDescription(string $taskDescription): void
	{
		$this->addTaskToList($taskDescription);
	}

	/**
	 * @Then I see a list containing:
	 */
	public function iSeeAListContaining(TableNode $table): void
	{
		$payload = $this->obtainPayloadFromResponse();

		$expected = $table->getHash();

		PHPUnitAssert::assertEqualsCanonicalizing($expected, $payload);
	}

	/**
	 * @Given /^I have this tasks in my list$/
	 */
	public function iHaveThisTasksInMyList(TableNode $table): void
	{
		$rows = $table->getColumnsHash();
		foreach ($rows as $row) {
			$this->addTaskToList($row['description']);
		}
	}


	/**
	 * @When /^I add a task with empty description$/
	 */
	public function iAddATaskWithEmptyDescription(): void
	{
		$payload        = [
			'task' => '',
		];
		$this->response = $this->apiPostWithPayload('/api/todo', $payload);
		$this->apiResponse = new ApiResponse(
			$this->response->getStatusCode(),
			$this->response->getContent()
		);
	}

	/**
	 * @Then /^I get a bad request error$/
	 */
	public function iGetABadRequestError(): void
	{
		Assert::eq($this->response->getStatusCode(), 400);
	}


	/**
	 * @Then /^I get an error message that says "([^"]*)"$/
	 */
	public function iGetAnErrorMessageThatSays($expectedMessage): void
	{
		$payload = json_decode($this->response->getContent(), true, 512, JSON_THROW_ON_ERROR);

		$errorMessage = $payload['message'];
		Assert::eq($errorMessage, $expectedMessage);
	}

	/**
	 * @Then /^The list contains:$/
	 */
	public function theListContains(TableNode $table): void
	{
		$this->response = $this->apiGet('/api/todo');
		$payload        = $this->obtainPayloadFromResponse();
		$this->apiResponse = new ApiResponse(
			$this->response->getStatusCode(),
			$this->response->getContent()
		);
		$expected = $table->getHash();

		PHPUnitAssert::assertEqualsCanonicalizing($expected, $payload);
	}

	public function addTaskToList($description): void
	{
		$payload  = [
			'task' => $description,
		];
		$response = $this->apiPostWithPayload('/api/todo', $payload);
		$apiResponse = new ApiResponse(
			$response->getStatusCode(),
			$response->getContent()
		);
		Assert::eq($response->getStatusCode(), Response::HTTP_CREATED);
	}

	private function apiGet(string $uri): Response
	{
		$request = Request::create(
			$uri,
			'GET'
		);

		return $this->kernel->handle($request);
	}

	private function apiPostWithPayload(string $uri, array $payload): Response
	{
		$request = Request::create(
			$uri,
			'POST',
			[],
			[],
			[],
			['CONTENT_TYPE' => 'application/json'],
			json_encode($payload, JSON_THROW_ON_ERROR)
		);

		return $this->kernel->handle($request);
	}

	private function obtainPayloadFromResponse()
	{
		return json_decode($this->response->getContent(), true, 512, JSON_THROW_ON_ERROR);
	}
}
```

En el segundo paso voy a empezar a usar `ApiResponse`. Por ejemplo:

```php
	private function obtainPayloadFromResponse()
	{
		return $this->apiResponse->payload();
	}
```

```php
	public function addTaskToList($description): void
	{
		$payload  = [
			'task' => $description,
		];
		$response = $this->apiPostWithPayload('/api/todo', $payload);
		$apiResponse = new ApiResponse(
			$response->getStatusCode(),
			$response->getContent()
		);
		Assert::eq($apiResponse->statusCode(), Response::HTTP_CREATED);
	}
```

```php
	/**
	 * @When I get my tasks
	 */
	public function iGetMyTasks(): void
	{
		$this->response = $this->apiGet('/api/todo');
		$this->apiResponse = new ApiResponse(
			$this->response->getStatusCode(),
			$this->response->getContent()
		);

		Assert::eq(Response::HTTP_OK, $this->apiResponse->statusCode());
	}
```

Una vez reemplazados todos los usos es hora de que los métodos que encapsulan las llamadas a la API devuelvan `ApiResponse` en vez de `Response`.

```php
	private function apiGet(string $uri): ApiResponse
	{
		$request = Request::create(
			$uri,
			'GET'
		);

		$response = $this->kernel->handle($request);

		return new ApiResponse(
			$response->getStatusCode(),
			$response->getContent()
		);
	}


	private function apiPostWithPayload(string $uri, array $payload): ApiResponse
	{
		$request = Request::create(
			$uri,
			'POST',
			[],
			[],
			[],
			['CONTENT_TYPE' => 'application/json'],
			json_encode($payload, JSON_THROW_ON_ERROR)
		);

		$response = $this->kernel->handle($request);

		return new ApiResponse(
			$response->getStatusCode(),
			$response->getContent()
		);
	}
```

Esto nos obligará a deshacer algunos de los cambios anteriores, pero es un proceso algo más seguro. Al ejecutar los tests podremos ver si hay otros lugares en los que necesitamos hacer cambios. Nos quedará algo así:

```php
<?php
declare (strict_types=1);

namespace Design\App\Contexts;

use Behat\Behat\Context\Context;
use Behat\Gherkin\Node\TableNode;
use PHPUnit\Framework\Assert as PHPUnitAssert;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\KernelInterface;
use Webmozart\Assert\Assert;

class AddTasksContext implements Context
{
	private KernelInterface $kernel;
	private ApiResponse $apiResponse;

	public function __construct(KernelInterface $kernel)
	{
		$this->kernel = $kernel;
		if (file_exists(__DIR__ . '/../../repository.data')) {
			unlink(__DIR__ . '/../../repository.data');
		}
	}

	/**
	 * @Given I have no tasks in my list
	 */
	public function iHaveNoTasksInMyList(): void
	{
		/** Empty for the moment */
	}

	/**
	 * @When I get my tasks
	 */
	public function iGetMyTasks(): void
	{
		$this->apiResponse = $this->apiGet('/api/todo');

		Assert::eq(Response::HTTP_OK, $this->apiResponse->statusCode());
	}

	/**
	 * @Then I see an empty list
	 */
	public function iSeeAnEmptyList(): void
	{
		$payload = $this->obtainPayloadFromResponse();

		Assert::isEmpty($payload);
	}

	/**
	 * @Given I add a task with description :taskDescription
	 */
	public function iAddATaskWithDescription(string $taskDescription): void
	{
		$this->addTaskToList($taskDescription);
	}

	/**
	 * @Then I see a list containing:
	 */
	public function iSeeAListContaining(TableNode $table): void
	{
		$payload = $this->obtainPayloadFromResponse();

		$expected = $table->getHash();

		PHPUnitAssert::assertEqualsCanonicalizing($expected, $payload);
	}

	/**
	 * @Given /^I have this tasks in my list$/
	 */
	public function iHaveThisTasksInMyList(TableNode $table): void
	{
		$rows = $table->getColumnsHash();
		foreach ($rows as $row) {
			$this->addTaskToList($row['description']);
		}
	}


	/**
	 * @When /^I add a task with empty description$/
	 */
	public function iAddATaskWithEmptyDescription(): void
	{
		$payload           = [
			'task' => '',
		];
		$this->apiResponse = $this->apiPostWithPayload('/api/todo', $payload);
	}

	/**
	 * @Then /^I get a bad request error$/
	 */
	public function iGetABadRequestError(): void
	{
		Assert::eq($this->apiResponse->statusCode(), 400);
	}


	/**
	 * @Then /^I get an error message that says "([^"]*)"$/
	 */
	public function iGetAnErrorMessageThatSays($expectedMessage): void
	{
		$payload = $this->apiResponse->payload();

		$errorMessage = $payload['message'];
		Assert::eq($errorMessage, $expectedMessage);
	}

	/**
	 * @Then /^The list contains:$/
	 */
	public function theListContains(TableNode $table): void
	{
		$this->apiResponse = $this->apiGet('/api/todo');
		$payload           = $this->obtainPayloadFromResponse();

		$expected = $table->getHash();

		PHPUnitAssert::assertEqualsCanonicalizing($expected, $payload);
	}

	public function addTaskToList($description): void
	{
		$payload     = [
			'task' => $description,
		];
		$apiResponse = $this->apiPostWithPayload('/api/todo', $payload);

		Assert::eq($apiResponse->statusCode(), Response::HTTP_CREATED);
	}

	private function apiGet(string $uri): ApiResponse
	{
		$request = Request::create(
			$uri,
			'GET'
		);

		$response = $this->kernel->handle($request);

		return new ApiResponse(
			$response->getStatusCode(),
			$response->getContent()
		);
	}

	private function apiPostWithPayload(string $uri, array $payload): ApiResponse
	{
		$request = Request::create(
			$uri,
			'POST',
			[],
			[],
			[],
			['CONTENT_TYPE' => 'application/json'],
			json_encode($payload, JSON_THROW_ON_ERROR)
		);

		$response = $this->kernel->handle($request);

		return new ApiResponse(
			$response->getStatusCode(),
			$response->getContent()
		);
	}

	private function obtainPayloadFromResponse()
	{
		return $this->apiResponse->payload();
	}
}
```

Y así nos quedaría `MarkTaskContext`:

```php
<?php
declare (strict_types=1);

namespace Design\App\Contexts;

use Behat\Behat\Context\Context;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\KernelInterface;
use Webmozart\Assert\Assert;

class MarkTaskContext implements Context
{
    private $kernel;

    public function __construct(KernelInterface $kernel)
    {
        $this->kernel = $kernel;
		if (file_exists(__DIR__ . '/../../repository.data')) {
			unlink(__DIR__ . '/../../repository.data');
		}
    }

    /**
     * @When /^I mark task (\d+) as completed$/
     */
    public function iMarkTaskAsCompleted(string $taskId): void
    {
        $request = Request::create(
            '/api/todo/'.$taskId,
            'PATCH',
            [],
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode(['done' => true], JSON_THROW_ON_ERROR)
        );

        $response = $this->kernel->handle($request);
		
		$apiResponse = new ApiResponse(
			$response->getStatusCode(),
			$response->getContent()
		);

        Assert::eq(200, $apiResponse->statusCode());
    }
}
```

Vamos a empezar a crear el cliente. Para ello, aplicamos el refactor _Extract Class_ y empezamos creando una interfaz sin métodos:

```php
<?php

declare(strict_types=1);

namespace Design\App\Contexts;

interface ApiClient
{

}
```
Y una primera implementación:

```php
<?php

declare(strict_types=1);

namespace Design\App\Contexts;


use Symfony\Component\HttpKernel\KernelInterface;

final class SymfonyApiClient implements ApiClient
{

	private KernelInterface $kernel;

	public function __construct(KernelInterface $kernel)
	{
		$this->kernel = $kernel;
	}
}
```

A continuación copiamos los métodos `apiGet` y `apiPostWithPayload`, cambiando su visibilidad.

```php
<?php

declare(strict_types=1);

namespace Design\App\Contexts;


use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\KernelInterface;

final class SymfonyApiClient implements ApiClient
{

	private KernelInterface $kernel;

	public function __construct(KernelInterface $kernel)
	{
		$this->kernel = $kernel;
	}

	public function apiGet(string $uri): ApiResponse
	{
		$request = Request::create(
			$uri,
			'GET'
		);

		$response = $this->kernel->handle($request);

		return new ApiResponse(
			$response->getStatusCode(),
			$response->getContent()
		);
	}

	public function apiPostWithPayload(string $uri, array $payload): ApiResponse
	{
		$request = Request::create(
			$uri,
			'POST',
			[],
			[],
			[],
			['CONTENT_TYPE' => 'application/json'],
			json_encode($payload, JSON_THROW_ON_ERROR)
		);

		$response = $this->kernel->handle($request);

		return new ApiResponse(
			$response->getStatusCode(),
			$response->getContent()
		);
	}
}
```

Y añadimos sus signaturas a la interfaz.

```php
<?php

declare(strict_types=1);

namespace Design\App\Contexts;

use Symfony\Component\HttpFoundation\Request;

interface ApiClient
{

	public function apiGet(string $uri): ApiResponse;

	public function apiPostWithPayload(string $uri, array $payload): ApiResponse;
}
```

Finalmente, reemplazamos el cuerpo de los métodos en `AddTasksContext`.

```php
<?php
declare (strict_types=1);

namespace Design\App\Contexts;

use Behat\Behat\Context\Context;
use Behat\Gherkin\Node\TableNode;
use PHPUnit\Framework\Assert as PHPUnitAssert;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\KernelInterface;
use Webmozart\Assert\Assert;

class AddTasksContext implements Context
{
	private KernelInterface $kernel;
	private ApiResponse $apiResponse;

	public function __construct(KernelInterface $kernel)
	{
		$this->kernel = $kernel;
		if (file_exists(__DIR__ . '/../../repository.data')) {
			unlink(__DIR__ . '/../../repository.data');
		}
		$this->apiClient = new SymfonyApiClient($kernel);
	}

	/**
	 * @Given I have no tasks in my list
	 */
	public function iHaveNoTasksInMyList(): void
	{
		/** Empty for the moment */
	}

	/**
	 * @When I get my tasks
	 */
	public function iGetMyTasks(): void
	{
		$this->apiResponse = $this->apiGet('/api/todo');

		Assert::eq(Response::HTTP_OK, $this->apiResponse->statusCode());
	}

	/**
	 * @Then I see an empty list
	 */
	public function iSeeAnEmptyList(): void
	{
		$payload = $this->obtainPayloadFromResponse();

		Assert::isEmpty($payload);
	}

	/**
	 * @Given I add a task with description :taskDescription
	 */
	public function iAddATaskWithDescription(string $taskDescription): void
	{
		$this->addTaskToList($taskDescription);
	}

	/**
	 * @Then I see a list containing:
	 */
	public function iSeeAListContaining(TableNode $table): void
	{
		$payload = $this->obtainPayloadFromResponse();

		$expected = $table->getHash();

		PHPUnitAssert::assertEqualsCanonicalizing($expected, $payload);
	}

	/**
	 * @Given /^I have this tasks in my list$/
	 */
	public function iHaveThisTasksInMyList(TableNode $table): void
	{
		$rows = $table->getColumnsHash();
		foreach ($rows as $row) {
			$this->addTaskToList($row['description']);
		}
	}


	/**
	 * @When /^I add a task with empty description$/
	 */
	public function iAddATaskWithEmptyDescription(): void
	{
		$payload           = [
			'task' => '',
		];
		$this->apiResponse = $this->apiPostWithPayload('/api/todo', $payload);
	}

	/**
	 * @Then /^I get a bad request error$/
	 */
	public function iGetABadRequestError(): void
	{
		Assert::eq($this->apiResponse->statusCode(), 400);
	}


	/**
	 * @Then /^I get an error message that says "([^"]*)"$/
	 */
	public function iGetAnErrorMessageThatSays($expectedMessage): void
	{
		$payload = $this->apiResponse->payload();

		$errorMessage = $payload['message'];
		Assert::eq($errorMessage, $expectedMessage);
	}

	/**
	 * @Then /^The list contains:$/
	 */
	public function theListContains(TableNode $table): void
	{
		$this->apiResponse = $this->apiGet('/api/todo');
		$payload           = $this->obtainPayloadFromResponse();

		$expected = $table->getHash();

		PHPUnitAssert::assertEqualsCanonicalizing($expected, $payload);
	}

	public function addTaskToList($description): void
	{
		$payload     = [
			'task' => $description,
		];
		$apiResponse = $this->apiPostWithPayload('/api/todo', $payload);

		Assert::eq($apiResponse->statusCode(), Response::HTTP_CREATED);
	}

	private function apiGet(string $uri): ApiResponse
	{
		return $this->apiClient->apiGet($uri);
	}

	private function apiPostWithPayload(string $uri, array $payload): ApiResponse
	{
		return $this->apiClient->apiPostWithPayload($uri, $payload);
	}

	private function obtainPayloadFromResponse()
	{
		return $this->apiResponse->payload();
	}
}
```

Tenemos que hacer algo parecido en `MarkTaskContext`, que nos quedará así:

```php
<?php
declare (strict_types=1);

namespace Design\App\Contexts;

use Behat\Behat\Context\Context;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\KernelInterface;
use Webmozart\Assert\Assert;
use const true;

class MarkTaskContext implements Context
{
    private $kernel;

    public function __construct(KernelInterface $kernel)
    {
        $this->kernel = $kernel;
		if (file_exists(__DIR__ . '/../../repository.data')) {
			unlink(__DIR__ . '/../../repository.data');
		}
		$this->apiClient = new SymfonyApiClient($kernel);
    }

    /**
     * @When /^I mark task (\d+) as completed$/
     */
    public function iMarkTaskAsCompleted(string $taskId): void
    {
		$apiResponse = $this->apiPatchWithPayload($taskId, ['done' => true]);

		Assert::eq(200, $apiResponse->statusCode());
    }

	private function apiPatchWithPayload(string $taskId, array $payload): ApiResponse
	{
		return $this->apiClient->apiPatchWithPayload('/api/todo'.$taskId, $payload);
	}
}
```

Ahora lo tenemos fácil para añadir una nueva implementación de `ApiClient` que use `Guzzle`, ya que hemos introducido una interfaz que nos permite reemplazar el cliente.

```php
<?php

declare(strict_types=1);

namespace Design\App\Contexts;


use GuzzleHttp\Client;

final class GuzzleApiClient implements ApiClient
{
	private string $baseUrl;

	public function __construct(string $baseUrl)
	{
		$this->client  = new Client;
		$this->baseUrl = $baseUrl;
	}

	public function apiGet(string $uri): ApiResponse
	{
		$response = $this->client->get($this->baseUrl . DIRECTORY_SEPARATOR . $uri);

		return new ApiResponse(
			$response->getStatusCode(),
			$response->getBody()->getContents()
		);
	}

	public function apiPostWithPayload(string $uri, array $payload): ApiResponse
	{
		$response = $this->client->post(
			$this->baseUrl . DIRECTORY_SEPARATOR . $uri,
			['json' => $payload]
		);

		return new ApiResponse(
			$response->getStatusCode(),
			$response->getBody()->getContents()
		);
	}

	public function apiPatchWithPayload(string $uri, array $payload): ApiResponse
	{
		$response = $this->client->patch(
			$this->baseUrl . DIRECTORY_SEPARATOR . $uri,
			['json' => $payload]
		);

		return new ApiResponse(
			$response->getStatusCode(),
			$response->getBody()->getContents()
		);
	}
}
```

Y, finalmente, usarlo en el Context es tan simple como instanciarlo:

```php
	public function __construct()
	{
		$this->apiClient = new GuzzleApiClient('http://bdd-webserver');
	}
```

De hecho, ya podemos dejar de usar el Kernel de Symfony y ordenar un poco nuestros Contexts, así como corregir pequeños defectos aquí y allá.

En cualquier caso, puedes [examinar con detalle todo el proyecto en el repositorio](https://github.com/franiglesias/bdd-example).
