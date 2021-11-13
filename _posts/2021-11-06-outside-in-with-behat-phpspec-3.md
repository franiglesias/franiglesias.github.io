---
layout: post 
title: Outside-in y Behavior Driven Development 3 
categories: articles 
tags: tdd php bdd
---

En esta entrega, veremos cómo completar el segundo y tercer escenario de nuestra feature.

1. [Introducción, herramientas y ejemplo](/outside-in-with-behat-phpspec/)
2. [Desarrollo del segundo escenario](/outside-in-with-behat-phpspec-2/)
3. [Desarrollo del tercer escenario](/outside-in-with-behat-phpspec-3/)
4. [Manejando bugs con BDD](/outside-in-with-behat-phpspec-4/)

Personalmente encuentro que una de las grandes ventajas de trabajar con metodologías TDD o BDD es que resulta bastante fácil parar tu trabajo y retomarlo en otro momento. No tienes más que ejecutar los tests y ver cuál es el siguiente que falla.

Además, si los pasos son pequeños, la carga cognitiva que necesitas para ponerte en situación es muy reducida y puedes alcanzar un bien nivel de productividad muy rápidamente.

Así que, es el momento de lanzar los test de la feature y ver dónde nos hemos quedado.

Y ese punto es el último paso del escenario, el que nos dice que tras añadir una tarea, el listado muestra la tarea añadida.

Este paso está escrito así:

```gherkin
  Scenario: Adding task to empty to-do list
    Given I have no tasks in my list
    Given I add a task with description "Write a test that fails"
    When I get my tasks
    Then I see a list containing:
      | id | Description | Done |
      |  1 | Write a test that fails | no |
```

Y se corresponde con esta definición:

```php
    /**
     * @Then I see a list containing:
     */
    public function iSeeAListContaining(TableNode $table)
    {
        throw new PendingException();
    }
```

El parámetro `$table` es un objeto de la clase `TableNode`, lo que nos proporciona una representación de la tabla de datos que hemos puesto en el escenario, permitiéndonos acceder a sus filas y columnas.

De este modo, podemos comparar con los datos recibidos como respuesta de la petición.

La petición al endpoint se hace en el paso anterior y tenemos la respuesta en `$this->response`. Sería el momento de extraerla y compararla con los datos en `TableNode`.

No hay una forma concreta de hacer esta comparación. Tendrás que aplicar alguna transformación a los datos para obtener objetos comparables.

Así, en nuestro ejemplo, esperamos que la respuesta una vez decodificada sea algo así como:

```php
$tasks = [
    [
        'id' => 1,
        'description' => 'Write a test that fails',
        'done' => 'no'
    ],
]
```

Podríamos generar un array para comparar a partir del objeto `$table`. TableNode tiene un método getHash, que produce un array asociativo o _hash map_ que nos iría perfecto si no fuese porque los nombres de las claves no coinciden exactamente.

La solución más práctica es, obviamente, cambiarlos.

```gherkin
  Scenario: Adding task to empty to-do list
    Given I have no tasks in my list
    Given I add a task with description "Write a test that fails"
    When I get my tasks
    Then I see a list containing:
      | id | description             | done |
      | 1  | Write a test that fails | no   |
```

La definición quedaría así:

```php
    /**
     * @Then I see a list containing:
     */
    public function iSeeAListContaining(TableNode $table)
    {
        $payload = json_decode($this->response->getContent(), true, 512, JSON_THROW_ON_ERROR);

        $expected = $table->getHash();

        Assert::eq($payload, $expected);
    }
```

Por supuesto, el paso fallará porque el endpoint todavía está devolviendo una lista vacía.

Para asegurarme de que el test es correcto, voy a hacer que el endpoint devuelva exactamente lo esperado.

```php
<?php
declare (strict_types=1);

namespace App\Infrastructure\EntryPoint\Api;

use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

class GetTasksController
{
    public function __invoke(): Response
    {
        $tasks = [
            [
                'id' => '1',
                'description' => 'Write a test that fails',
                'done' => 'no'
            ]
        ];

        return new JsonResponse($tasks, Response::HTTP_OK);
    }
}
```

Esto hará fallar el escenario de la lista vacía, que antes pasaba, pero el segundo escenario pasa completo, lo que nos permite comprobar que el test es adecuado antes de continuar.

Por supuesto, tenemos que implementar el controlador `GetTasksController`. Así que nos vamos al ciclo de Specification.

## Controller con QueryBus

Ya tenemos una Specification para `GetTasksController`, pero solo modela un caso. Ahora necesitamos introducir el caso en el que existen tareas en el repositorio. Para ello, enviamos un mensaje Query. Si no hay tareas devolverá una colección vacía, mientras que si las hay, debería devolver una colección conteniendo esas tareas.

En cuanto a la representación de esas tareas, el controlador se podría encargar de escoger qué representación necesita. Frecuentemente lo que hacemos es que el Use Case devuelva objetos de dominio, pero pienso que es mejor práctica que el Use Case devuelva representaciones de los objetos de dominio, a las cuales solemos denominar View Models.

El principal problema de las View Models es que es el controlador quien escoge la representación que necesita, pero a veces un mismo caso de uso puede utilizarse para generar distintos View Models. 

Esto se puede hacer aplicando el patrón `Strategy`, de modo que el controlador le indica al caso de uso qué representación espera pasándole un Mapper o Data Transformer que el caso de uso aplicará a la colección obtenida. Este Data Transformer obtendrá un Dto a partir de la entidad Task.

En la práctica, nuestro controlador necesitará el QueryBus como colaborador, así como el DataTransformer adecuado, que pasará al caso de uso GetTasks. La respuesta obtenida se devuelve como JSON.

El QueryBus y el CommandBus son casi idénticos. La diferencia es que el QueryBus devuelve respuestas, mientras que el CommandBus no.
 
Toda esta discusión de diseño queda reflejada en una Specification:

```php
<?php

namespace Spec\App\Infrastructure\EntryPoint\Api;

use App\Application\GetTasks\GetTasks;
use App\Application\GetTasks\TaskDataTransformer;
use App\Application\QueryBus;
use App\Infrastructure\EntryPoint\Api\GetTasksController;
use PhpSpec\ObjectBehavior;

/**
 * @mixin GetTasksController
 */
class GetTasksControllerSpec extends ObjectBehavior
{
    public function let(QueryBus $queryBus, TaskDataTransformer $dataTransformer): void
    {
        $this->beConstructedWith($queryBus, $dataTransformer);
    }

    public function it_should_respond_with_OK(): void
    {
        $response = $this->__invoke();

        $response->getStatusCode()->shouldBe(200);
    }

    public function it_should_return_empty_collection_when_no_tasks(
        QueryBus $queryBus,
        TaskDataTransformer $dataTransformer
    ): void {
        $getTasksUseCase = new GetTasks($dataTransformer->getWrappedObject());
        $taskCollection = [
            [
                'id' => '1',
                'description' => 'Write a test that fails',
                'done' => 'no'
            ]
        ];
        $queryBus->execute($getTasksUseCase)->willReturn($taskCollection);

        $response = $this->__invoke();

        $queryBus->execute($getTasksUseCase)->shouldHaveBeenCalled();
        $response->getContent()->shouldEqual(json_encode($taskCollection, JSON_THROW_ON_ERROR));
    }
}
```

Un detalle es que inyectamos el `TaskDataTransformer` al controlador en construcción. En aplicaciones más complejas, posiblemente inyectaríamos una factoría.

Y otro detalle, es que para montar GetTasks debemos pasar el objeto contenido en el doble, de otro modo, fallará.

Hacer pasar la Specification requiere crear algunas interfaces. El resultado en este punto es:

```php
<?php
declare (strict_types=1);

namespace App\Infrastructure\EntryPoint\Api;

use App\Application\GetTasks\GetTasks;
use App\Application\GetTasks\TaskDataTransformer;
use App\Application\QueryBus;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

class GetTasksController
{
    private QueryBus $queryBus;
    private TaskDataTransformer $taskDataTransformer;

    public function __construct(QueryBus $queryBus, TaskDataTransformer $taskDataTransformer)
    {
        $this->queryBus = $queryBus;
        $this->taskDataTransformer = $taskDataTransformer;
    }

    public function __invoke(): Response
    {
        $getTasks = new GetTasks($this->taskDataTransformer);

        $tasks = $this->queryBus->execute($getTasks);

        return new JsonResponse($tasks, Response::HTTP_OK);
    }
}
```

```php
<?php

namespace App\Application;

interface QueryBus
{

    public function execute($query);
}
```

```php
<?php
declare (strict_types=1);

namespace App\Application\GetTasks;

interface TaskDataTransformer
{

}
```

En cuanto a la respuesta, tal como lo hemos diseñado el controlador solo tiene que devolver la respuesta que reciba, así que vamos a cambiar un poco el ejemplo para reflejarlo mejor:

```php
    public function it_should_return_empty_collection_when_no_tasks(
        QueryBus $queryBus,
        TaskDataTransformer $dataTransformer
    ): void {
        $getTasksUseCase = new GetTasks($dataTransformer);
        $taskCollection = [
            [
                'id' => '1',
                'description' => 'Write a test that fails',
                'done' => 'no'
            ]
        ];
        $queryBus->execute($getTasksUseCase)->willReturn($taskCollection);

        $response = $this->__invoke();

        $queryBus->execute($getTasksUseCase)->shouldHaveBeenCalled();
        $response->getContent()->shouldEqual(json_encode($taskCollection, JSON_THROW_ON_ERROR));
    }
```

En esta nueva forma, la Specification pasa igualmente. Con esto debería ser suficiente para cerrar esta fase y volver a ejecutar el escenario.

Al hacerlo, veremos que el framework se queja, dado que el QueryBus es una interfaz y no hay implementación. Resolvemos esto temporalmente introduciendo una implementación vacía que sea suficiente para eliminar los errores que aparezcan hasta que solo quede el fallo propio del test. Va a ocurrir lo mismo con TaskDataTransformer.

```php
<?php
declare (strict_types=1);

namespace App\Infrastructure\QueryBus;

use App\Application\QueryBus;

final class TodoListQueryBus implements QueryBus
{

    public function execute($query)
    {
        throw new \RuntimeException('Implement execute() method.');
    }
}
```

```php
<?php
declare (strict_types=1);

namespace App\Infrastructure\DataTransformer;

use App\Application\GetTasks\TaskDataTransformer;

final class TaskToArrayDataTransformer implements TaskDataTransformer
{

}
```

Una alternativa a esto es comenzar con implementaciones concretas y extraer luego la interfaz.

Una vez que hacemos que el escenario se ejecute y falle, lo que nos toca es empezar a describir el componente que nos pide, que será el QueryBus.

El proceso para desarrollar el QueryBus será muy parecido al que seguimos con el CommandBus en el capítulo anterior, por lo que no voy a repetir aquí todo el proceso en detalle.

La Specification sería como sigue. Básicamente es averiguar qué Handler maneja la Query, pasársela y devolver la respuesta.

```php
<?php

namespace Spec\App\Infrastructure\QueryBus;

use App\Application\GetTasks\GetTasks;
use App\Application\GetTasks\GetTasksHandler;
use App\Application\GetTasks\TaskDataTransformer;
use App\Infrastructure\CommandBus\HandlerLocator;
use App\Infrastructure\QueryBus\TodoListQueryBus;
use PhpSpec\ObjectBehavior;

/**
 * @mixin TodoListQueryBus
 */
class TodoListQueryBusSpec extends ObjectBehavior
{
    public function it_handles_command_to_handler(
        HandlerLocator $handlerLocator,
        GetTasksHandler $getTasksHandler,
        TaskDataTransformer $taskDataTransformer
    ): void {
        $handlerLocator->getHandlerFor(GetTasks::class)->willReturn($getTasksHandler);
        $getTasksQuery = new GetTasks($taskDataTransformer->getWrappedObject());

        $getTasksHandler->__invoke($getTasksQuery)->willReturn(['tasks collection']);
        $this->beConstructedWith($handlerLocator);

        $this->execute($getTasksQuery)->shouldEqual(['tasks collection']);

        $getTasksHandler->__invoke($getTasksQuery)->shouldHaveBeenCalled();
    }
}
```

El código que la hace pasar es este:

```php
<?php
declare (strict_types=1);

namespace App\Infrastructure\QueryBus;

use App\Application\QueryBus;
use App\Infrastructure\CommandBus\HandlerLocator;

final class TodoListQueryBus implements QueryBus
{

    private HandlerLocator $handlerLocator;

    public function __construct(HandlerLocator $handlerLocator)
    {
        $this->handlerLocator = $handlerLocator;
    }

    public function execute($query)
    {
        $handler = $this->handlerLocator->getHandlerFor(get_class($query));

        return ($handler)($query);
    }
}
```

```php
<?php
declare (strict_types=1);

namespace App\Application\GetTasks;

class GetTasksHandler
{
    public function __invoke(GetTasks $getTasks): array
    {
        throw new \RuntimeException('Implement __invoke() method.');
    }
}
```

Una vez que hemos hecho pasar la Specification, volvemos a ejecutar el escenario. Fallará porque no hemos registrado GetTasks y su Handler en **services.yaml**. Esto se podría automatizar como vimos en [un artículo anterior](/automating-symfony-dic).

```
    App\Infrastructure\CommandBus\HandlerLocator:
        calls:
            - registerHandler:
                - 'App\Application\AddTask\AddTask'
                - '@App\Application\AddTask\AddTaskHandler'
            - registerHandler:
                - 'App\Application\GetTasks\GetTasks'
                - '@App\Application\GetTasks\GetTasksHandler'
```

Seguidamente fallará porque no está implementado el método `__invoke` de `GetTasksHandler`, que es la señal que necesitamos para pasar la fase de especificación.

El trabajo de `GetTasksHandler` es obtener las tareas de `TaskRepository` y transformarlas mediante `TaskDataTransformer` para construir la respuesta.

```php
<?php

namespace Spec\App\Application\GetTasks;

use App\Application\GetTasks\GetTasks;
use App\Application\GetTasks\GetTasksHandler;
use App\Application\GetTasks\TaskDataTransformer;
use App\Domain\Task;
use App\Domain\TaskDescription;
use App\Domain\TaskId;
use App\Domain\TaskRepository;
use PhpSpec\ObjectBehavior;

/**
 * @mixin GetTasksHandler
 */
class GetTasksHandlerSpec extends ObjectBehavior
{
    public function it_should_get_tasks(TaskRepository $taskRepository, TaskDataTransformer $taskDataTransformer): void
    {
        $task = new Task(
            new TaskId('1'),
            new TaskDescription('Write a test that fails')
        );

        $taskRepository->findAll()->willReturn(
            [
                $task
            ]
        );

        $transformedTask = [
            'id' => 1,
            'description' => 'Write a test that fails',
            'done' => 'no'
        ];

        $taskDataTransformer->transform($task)->willReturn($transformedTask);

        $this->beConstructedWith($taskRepository);

        $getTasks = new GetTasks($taskDataTransformer->getWrappedObject());

        $this->__invoke($getTasks)->shouldEqual(
            [
                $transformedTask
            ]
        );
    }
}

```

Esta Specification es un poco fea porque al usar dobles simulamos todas las interacciones y la del `TaskDataTransformer` resulta especialmente ofensiva, puesto que tanto la entrada como la salida son simuladas.

En este caso particular podríamos usar una instancia real de un `TaskDataTransformer`, pero nos plantea dos cuestiones:

* La especificación por ejemplos no busca hacer un test, sino diseñar las interacciones. De hecho no tenemos una implementación concreta de ningún `TaskDataTransformer`.
* Si la implementación de `TaskDataTransformer` tiene dependencias tendríamos que doblar estas y eso se sale del ámbito de la especificación. `GetTaskHandler` solo habla con `TaskDataTransformer` y debería darnos igual qué colaboradores necesita.

En otras palabras, lo que estamos haciendo es diseñar qué objetos necesitamos que interactúen en cada componente y qué diálogo deben mantener. A la vez, posponemos las decisiones de implementación concreta para un momento posterior.

La primera aproximación es esta:

```php
<?php
declare (strict_types=1);

namespace App\Application\GetTasks;

use App\Domain\TaskRepository;

class GetTasksHandler
{
    private TaskRepository $taskRepository;

    public function __construct(
        TaskRepository $taskRepository
    ) {
        $this->taskRepository = $taskRepository;
    }

    public function __invoke(GetTasks $getTasks): array
    {
        $tasks = $this->taskRepository->findAll();

        $taskList = [];

        foreach ($tasks as $task) {
            $taskList[] = $getTasks->transformer()->transform($task);
        }

        return $taskList;
    }
}
```

Por lo general, suelo usar `foreach` como primera versión para entender la lógica de este tipo de bucles. Luego suelo refactorizar, una vez que tengo claro el tipo de función de array que me viene bien:

```php
<?php
declare (strict_types=1);

namespace App\Application\GetTasks;

use App\Domain\Task;
use App\Domain\TaskRepository;

class GetTasksHandler
{
    private TaskRepository $taskRepository;

    public function __construct(
        TaskRepository $taskRepository
    ) {
        $this->taskRepository = $taskRepository;
    }

    public function __invoke(GetTasks $getTasks): array
    {
        $tasks = $this->taskRepository->findAll();

        $transformer = $getTasks->transformer();

        return array_map(static fn(Task $task) => $transformer->transform($task), $tasks);
    }
}
```

Hasta ahora no habíamos necesitado implementar el comando `GetTasks`. Es una de las ventajas de este enfoque: no implementar nada hasta que realmente lo necesitas y tienes información suficiente para entender lo que quieres hacer.

```php
<?php
declare (strict_types=1);

namespace App\Application\GetTasks;

final class GetTasks
{

    private TaskDataTransformer $taskDataTransformer;

    public function __construct(TaskDataTransformer $taskDataTransformer)
    {
        $this->taskDataTransformer = $taskDataTransformer;
    }

    public function transformer(): TaskDataTransformer
    {
        return $this->taskDataTransformer;
    }
}
```

Finalizado un ciclo de especificación, pasamos de nuevo al escenario. Todavía nos queda implementar parte del TaskRepository y, por supuesto, el TaskDataTransformer.

Lo primero que necesitamos hacer es una implementación vacía o inicial del método transform en TaskToArrayDataTransformer a fin de que se pueda ejecutar el escenario. Como siempre, nos interesa que falle por una razón particular: que alguno de los componentes requiera su implementación.

```php
<?php
declare (strict_types=1);

namespace App\Infrastructure\DataTransformer;

use App\Application\GetTasks\TaskDataTransformer;

final class TaskToArrayDataTransformer implements TaskDataTransformer
{

    public function transform($argument1)
    {
        throw new \RuntimeException('Implement transform() method.');
    }
}
```

Una vez arreglado, el fallo es que `TaskRepository` nos pide implementar el método `findAll`. Toca volver a la Specification.

De momento, propongo esta:

```php
<?php

namespace Spec\App\Infrastructure\Persistence;

use App\Domain\Task;
use App\Domain\TaskDescription;
use App\Domain\TaskId;
use App\Infrastructure\Persistence\TaskMemoryRepository;
use PhpSpec\ObjectBehavior;

/**
 * @mixin TaskMemoryRepository
 */
class TaskMemoryRepositorySpec extends ObjectBehavior
{
    public function it_stores_tasks(): void
    {
        $task = new Task(
            new TaskId('1'),
            new TaskDescription('Write a test that fails')
        );
        $this->store($task);
        $this->nextId()->shouldBe(2);
    }

    public function it_retrieves_all_tasks(): void
    {
        $task = new Task(
            new TaskId('1'),
            new TaskDescription('Write a test that fails')
        );
        $task2 = new Task(
            new TaskId('2'),
            new TaskDescription('Write code to make test pass')
        );
        $this->store($task);
        $this->store($task2);
        $this->findAll()->shouldEqual([$task, $task2]);
    }
}
```

Y no debería ser difícil hacerlo funcionar:

```php
<?php
declare (strict_types=1);

namespace App\Infrastructure\Persistence;

use App\Domain\Task;
use App\Domain\TaskRepository;

final class TaskMemoryRepository implements TaskRepository
{
    private array $tasks = [];

    public function store(Task $task): void
    {
        $this->tasks[(string)$task->id()] = $task;
    }

    public function nextId(): int
    {
        $max = array_reduce(
            $this->tasks,
            static fn($max, $task) => max((int)(string)$task->id(), $max),
            0
        );

        return $max + 1;
    }

    public function findAll(): array
    {
        return array_values($this->tasks);
    }
}
```

Devolvemos `array_values` porque el hecho de usar el _id_ como _key_ es interno a la implementación y los usuarios de TaskRepository no tienen por qué saberlo.

Este ciclo ha ido muy rápido y hemos conseguido dos cosas:

* El escenario anterior, que habíamos hecho fallar a cambiar la implementación inicial, vuelve a pasar.
* Se nos pide implementar `TaskToArrayDataTransformer::transform` ya que `GetTasksHandler` lo usa si hay al menos una tarea guardada en el repositorio.

Estamos a un paso de completar el escenario.

```
bin/phpspec describe 'App\Infrastructure\DataTransformer\TaskToArrayDataTransformer'
```

El `DataTransformer` espera recibir un objeto `Task` y devuelve una representación en forma de `array`.

```php
<?php

namespace Spec\App\Infrastructure\DataTransformer;

use App\Domain\Task;
use App\Domain\TaskDescription;
use App\Domain\TaskId;
use App\Infrastructure\DataTransformer\TaskToArrayDataTransformer;
use PhpSpec\ObjectBehavior;

/**
 * @mixin TaskToArrayDataTransformer
 */
class TaskToArrayDataTransformerSpec extends ObjectBehavior
{
    public function it_is_initializable(): void
    {
        $this->shouldHaveType(TaskToArrayDataTransformer::class);
    }

    public function it_transforms_task_in_array_representation(): void
    {
        $task = new Task(
            new TaskId('1'),
            new TaskDescription('Write a test that fails')
        );

        $this->transform($task)->shouldEqual(
            [
                'id' => '1',
                'description' => 'Write a test that fails',
                'done' => 'no'
            ]
        );
    }
}
```

El código que hace pasar la especificación es este, añadiendo algunos métodos en `Task`, `TaskId` y `TaskDescription`:

```php
<?php
declare (strict_types=1);

namespace App\Infrastructure\DataTransformer;

use App\Application\GetTasks\TaskDataTransformer;
use App\Domain\Task;

final class TaskToArrayDataTransformer implements TaskDataTransformer
{

    public function transform(Task $task): array
    {
        return [
            'id' => $task->id()->toString(),
            'description' => $task->description()->toString(),
            'done' => 'no'
        ];
    }
}
```

Y con esto, el segundo escenario pasa completamente.

## Consideraciones antes de pasar al tercer escenario

Hasta ahora hemos estado trabajando en pasos bastante pequeños, pese a lo cual hemos avanzado mucho. De hecho, es posible que el tercer escenario pase sin tener que tocar prácticamente nada.

Por otro lado, podría ser conveniente hacer algo de refactor del código creado hasta ahora, incluyendo los tests. Nos interesa, por un lado, asegurar que nuestro código está en buen estado, es comprensible y fácil de intervenir. Por otro, nos vendría bien que futuros tests sean fáciles de crear y mantener.

Por ejemplo, en `AddTasksContext` seguramente necesitemos poder hacer nuevas peticiones a la API e interpretar sus respuestas, podríamos extraer todo eso a métodos de utilidad que nos ahorrarán trabajo en el futuro (_make the change easy, then make the easy change_). Algo así:

```php
<?php
declare (strict_types=1);

namespace Design\App\Contexts;

use Behat\Behat\Context\Context;
use Behat\Behat\Tester\Exception\PendingException;
use Behat\Gherkin\Node\TableNode;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\KernelInterface;
use Webmozart\Assert\Assert;

class AddTasksContext implements Context
{
    private KernelInterface $kernel;
    private Response $response;

    public function __construct(KernelInterface $kernel)
    {
        $this->kernel = $kernel;
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
        $payload = [
            'task' => $taskDescription
        ];
        $response = $this->apiPostWithPayload('/api/todo', $payload);

        Assert::eq($response->getStatusCode(), Response::HTTP_CREATED);
    }

    /**
     * @Then I see a list containing:
     */
    public function iSeeAListContaining(TableNode $table)
    {
        $payload = $this->obtainPayloadFromResponse();

        $expected = $table->getHash();

        Assert::eq($payload, $expected);
    }

    /**
     * @Given I have tasks in my list
     */
    public function iHaveTasksInMyList()
    {
        throw new PendingException();
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

En las Specifications se usan varias veces ejemplos de Task. Aunque no representan gran complicación, pueden resultar incómodos para leer y entender el test. En estos casos, es recomendable utilizar el patrón `ObjectMother`, para generar ejemplos. De paso, movemos algunos valores a constantes para que quede más claro qué significan y cómo se usan. Veamos algunos casos.

Personalmente, prefiero usar el nombre `ObjectExamples` para este tipo de patrón:

```php
<?php
declare (strict_types=1);

namespace Spec\App\Domain;

use App\Domain\Task;
use App\Domain\TaskDescription;
use App\Domain\TaskId;

class TaskExamples
{

    public static function withData(string $id, string $description): Task
    {
        return new Task(
            new TaskId($id),
            new TaskDescription($description)
        );
    }
}
```

Aquí una Specification refactorizada. Otros detalles son eliminar el test inicial de que puede ser inicializada y separar la construcción del Subject Under Specification:

```php
<?php

namespace Spec\App\Application\AddTask;

use App\Application\AddTask\AddTask;
use App\Application\AddTask\AddTaskHandler;
use App\Domain\TaskId;
use App\Domain\TaskIdentityProvider;
use App\Domain\TaskRepository;
use PhpSpec\ObjectBehavior;
use Spec\App\Domain\TaskExamples;

/**
 * @mixin AddTaskHandler
 */
class AddTaskHandlerSpec extends ObjectBehavior
{
    private const TASK_ID = '1';
    private const TASK_DESCRIPTION = 'Write a test that fails.';

    public function let(
        TaskIdentityProvider $identityProvider,
        TaskRepository $taskRepository
    ): void {
        $this->beConstructedWith($identityProvider, $taskRepository);
    }

    public function it_adds_new_task(
        TaskIdentityProvider $identityProvider,
        TaskRepository $taskRepository
    ): void {
        $identityProvider->nextId()->willReturn(new TaskId(self::TASK_ID));

        $this->__invoke(new AddTask(self::TASK_DESCRIPTION));

        $task = TaskExamples::withData(self::TASK_ID, self::TASK_DESCRIPTION);
        $taskRepository->store($task)->shouldHaveBeenCalled();
    }
}
```

La Specification ahora es más compacta, oculta algunos de los detalles de implementación, y además permite entender mejor la relación entre los datos de entrada y el resultado.

Refactorizo el resto de Specifications con criterios similares y reviso algunos otros archivos. No voy a poner aquí todo el código, pero [lo podéis consultar en este repositorio en GitHub](https://github.com/franiglesias/bdd-example).

Normalmente haría todos estos refactors a medida que avanzo pasos, pero lo he separado para no quitar el foco del proceso de diseño y desarrollo.

## Tercer escenario

El tercer escenario queda definido así:

```gherkin
  Scenario: Adding task to non empty to-do list
    Given I have tasks in my list
    Given I add a task with description "Write code to make test pass"
    When I get my tasks
    Then I see a list containing:
      | id | description                  | done |
      | 1  | Write a test that fails      | no   |
      | 2  | Write code to make test pass | no   |
```

Un problema de esta definición es que no se especifica cuál es el contenido actual de la lista del primer paso. Sería bueno hacerlo explícito.

```gherkin
  Scenario: Adding task to non empty to-do list
    Given I have this tasks in my list
      | id | description             | done |
      | 1  | Write a test that fails | no   |
    Given I add a task with description "Write code to make test pass"
    When I get my tasks
    Then I see a list containing:
      | id | description                  | done |
      | 1  | Write a test that fails      | no   |
      | 2  | Write code to make test pass | no   |
```

El cambio de nombre hace que behat nos pide definir el nuevo paso, que quedaría así (en **AddTasksContext.php**).

```php
    /**
     * @Given /^I have this tasks in my list$/
     */
    public function iHaveThisTasksInMyList(TableNode $table)
    {
        throw new PendingException();
    }
```

Ejecutamos la feature para asegurarnos de que todo va bien antes de ponernos a implementar el ejemplo. Una vez que comprobamos que la definición está pendiente, la implementamos así:

```php
    /**
     * @Given /^I have this tasks in my list$/
     */
    public function iHaveThisTasksInMyList(TableNode $table)
    {
        $rows = $table->getColumnsHash();
        $payload = [
            'task' => $rows[0]['description']
        ];
        $response = $this->apiPostWithPayload('/api/todo', $payload);

        Assert::eq($response->getStatusCode(), 201);
    }
```

Y toda la feature se pone en verde. Como habíamos señalado antes, era probable que ocurriese esto. Por otra parte, los demás pasos de este escenario los habíamos reutilizado, por lo que no necesitamos implementar ninguno más.

Ahora tocaría limpiar un poco **AddTasksContext**, pues que hay algún paso que ya no se usa.

Además, se podría refactorizar este último paso para dar soporte a tablas más largas. Simplemente, tenemos que hacer un POST a la API con cada fila de la tabla:

```php
    /**
     * @Given /^I have this tasks in my list$/
     */
    public function iHaveThisTasksInMyList(TableNode $table)
    {
        $rows = $table->getColumnsHash();
        foreach ($rows as $row) {
            $this->addTaskToList($row['description']);
        }
    }

    public function addTaskToList($description): void
    {
        $payload = [
            'task' => $description
        ];
        $response = $this->apiPostWithPayload('/api/todo', $payload);
        Assert::eq($response->getStatusCode(), 201);
    }
```

Finalmente, el Context queda así:

```php
<?php
declare (strict_types=1);

namespace Design\App\Contexts;

use Behat\Behat\Context\Context;
use Behat\Behat\Tester\Exception\PendingException;
use Behat\Gherkin\Node\TableNode;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\KernelInterface;
use Webmozart\Assert\Assert;

class AddTasksContext implements Context
{
    private KernelInterface $kernel;
    private Response $response;

    public function __construct(KernelInterface $kernel)
    {
        $this->kernel = $kernel;
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
    public function iSeeAListContaining(TableNode $table)
    {
        $payload = $this->obtainPayloadFromResponse();

        $expected = $table->getHash();

        Assert::eq($payload, $expected);
    }

    /**
     * @Given /^I have this tasks in my list$/
     */
    public function iHaveThisTasksInMyList(TableNode $table)
    {
        $rows = $table->getColumnsHash();
        foreach ($rows as $row) {
            $this->addTaskToList($row['description']);
        }
    }

    public function addTaskToList($description): void
    {
        $payload = [
            'task' => $description
        ];
        $response = $this->apiPostWithPayload('/api/todo', $payload);
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

## Fin de la tercera entrega

En este capítulo hemos seguido trabajando en el desarrollo de nuestra aplicación con el mismo esquema de trabajo:

* Ejecutamos la feature y la vemos fallar.
* Si es el caso, implementamos la definición correspondiente al paso actual en el archivo *Context.
* Corregimos los fallos de configuración hasta que el test nos reclame implementar un componente.
* Diseñamos el componente mediante ejemplos (specifications o tests unitarios según la herramienta que usemos).
* Una vez que la especificación pasa volvemos a ejecutar la feature y vemos si falla.
* Si falla, atendemos a los mensajes de error y los vamos subsanando.
* Si pasan todos los escenarios, la feature está completa.

¿Hacia dónde nos movemos ahora?

En los siguientes capítulos de la serie, me gustaría profundizar en varios aspectos:

* Añadir nuevas prestaciones al sistema. Por ejemplo, necesitamos poder marcar tareas como realizadas. Igualmente, podríamos querer poder eliminar tareas o modificarlas.
* Corregir "bugs". En su implementación actual, nuestra lista de tareas permite algunas cosas que las usuarias considerarían bugs. Por ejemplo, no se controla que la descripción de la tarea está vacía. Esto nos lleva a una consideración interesante: los bugs como prestaciones no implementadas todavía.
* Ahora mismo estamos usando directamente la integración de Behat con Symfony. Sin embargo, puede ser interesante usar un cliente HTTP real en su lugar. Veremos cómo hacerlo.

Recuerda que puedes ver [el repositorio del proyecto](https://github.com/franiglesias/bdd-example).
