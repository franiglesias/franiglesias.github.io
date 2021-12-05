---
layout: post 
title: Outside-in y Behavior Driven Development 5 
categories: articles 
tags: tdd php bdd
---

Nuevas iteraciones nos permiten introducir funcionalidad de la que carecía el producto.

1. [Introducción, herramientas y ejemplo](/outside-in-with-behat-phpspec/)
2. [Desarrollo del segundo escenario](/outside-in-with-behat-phpspec-2/)
3. [Desarrollo del tercer escenario](/outside-in-with-behat-phpspec-3/)
4. [Manejando bugs con BDD](/outside-in-with-behat-phpspec-4/)
5. [Añadiendo nuevas features](/outside-in-with-behat-phpspec-5/)
6. [Consideraciones sobre BDD](/outside-in-with-behat-phpspec-6/)
7. [Usar un cliente Http](/outside-in-with-behat-phpspec-7/)

Nuestra to-do list no permite marcar tareas cuando las completamos, así que vamos a trabajar para añadirla. 

Pero antes, ¿esto es un bug o qué? Es decir, hemos puesto en producción un software incompleto, ¿o no?

Pues depende. En la gestión tradicional de proyectos definimos todas las prestaciones que debe ofrecer el software antes incluso de empezar a programar. En ese sentido, se espera entregar el software completo.

Pero trabajando con una metodología iterativa e incremental intentamos entregar partes pequeñas del software que puedan ofrecer un valor significativo. De este modo, el software no está nunca completo, en el sentido tradicional, pero está aportando valor desde la primera entrega.

Por tanto, la falta de una prestación no se puede considerar un error, sino simplemente una iteración que todavía no se ha entregado.

Desde el punto de vista de gestión de proyectos tradicional esta afirmación puede generar miedo, pero tenemos que pensar que estas iteraciones pueden durar muy poco tiempo. 

Sin embargo, mi experiencia personal es que procediendo iterativamente, puedes completar un proyecto en menos tiempo del que lo harías con un _waterfall_ clásico, entregando todo al final.

La pregunta es, en todo caso: ¿Qué es la siguiente cosa más importante que necesita hacer este software sabiendo lo que sabemos ahora?

Pues para nuestro ejemplo, la siguiente cosa más importante que tendría que estar haciendo el software es permitir marcar una tarea como completada.

Por supuesto, el proceso es exactamente el mismo que hemos visto en los artículos anteriores:

* Describir la feature en lenguaje gherkin con diversos escenarios.
* Generar el test de aceptación (MarkCompletedContext) y definir cada paso.
* Ejecutar la feature y verla fallar.
* Especificar mediante ejemplos los componentes desde el más externo hacia el interior.
* Repetir hasta que la feature se ejecute por completo con éxito.

## Introduciendo una nueva feature

Para empezar, definimos la feature en el archivo**mark_task.feature**, con un escenario. Se supone que debería haber tareas en la lista, así que ponemos algunas:

```gherkin
Feature: Mark completed tasks
  As User
  I want to mark tasks as completed
  So that I can see my achievements

  Scenario: Mark an existing task
    Given I have this tasks in my list
      | id | description                  | done |
      | 1  | Write a test that fails      | no   |
      | 2  | Write code to make test pass | no   |
    When I mark task 1 as completed
    And I get my tasks
    Then I see a list containing:
      | id | description                  | done |
      | 1  | Write a test that fails      | yes  |
      | 2  | Write code to make test pass | no   |
```

El archivo de contextos será, inicialmente, este:

```php
<?php
declare (strict_types=1);

namespace Design\App\Contexts;

use Behat\Behat\Context\Context;

class MarkTaskContext implements Context
{
    /**
     * @When /^I mark task (\d+) as completed$/
     */
    public function iMarkTaskAsCompleted($arg1)
    {
        throw new PendingException();
    }
}
```

Es pequeñito, ¿verdad? Behat es capaz de reutilizar las definiciones que tenemos en otros archivos de contexto, así que realmente solo tendríamos que añadir el paso que nos falta. Pero para eso, tenemos que indicarle que lo use en **behat.yml**:

```yaml
default:
    autoload:
        '': '%paths.base%/design' # autoload for behat things
    suites:
        default:
            paths:
                - 'design/Features' # This is where you will put your *.feature files
            contexts:
                - Design\App\Contexts\AddTasksContext 
                - Design\App\Contexts\MarkTaskContext 
    extensions:
        FriendsOfBehat\SymfonyExtension: { }

```

Básicamente haremos un `PATCH` a `/api/todo/1`, con un payload que indica el estado esperado de `done`, que será `true`.

He aquí el contexto completo:

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

        Assert::eq(200, $response->getStatusCode());
    }
}
```

Ejecutamos la feature para ver si pasa. Puesto que no tenemos endpoint comenzarán aparecer errores que nos pedirán introducir una ruta y un controlador en el lugar adecuado. Este es más o menos el proceso.

**routes.yaml**

```yaml
api_get_tasks:
  path: /api/todo
  controller: App\Infrastructure\EntryPoint\Api\GetTasksController
  methods: ['GET']

api_add_task:
  path: /api/todo
  controller: App\Infrastructure\EntryPoint\Api\AddTaskController
  methods: ['POST']

api_mark_task:
  path: /api/todo/{taskId}
  controller: App\Infrastructure\EntryPoint\Api\MarkTaskController
  methods: ['PATCH']
```

Al ejecutar de nuevo, nos pedirá un controlador. Así que lo especificamos:

```
bin/phpspec describe 'App\Infrastructure\EntryPoint\Api\MarkTaskController'
```

Ejecutamos la especificación, lo que nos permitirá generar una primera versión del controlador:

```php
<?php
declare (strict_types = 1);

namespace App\Infrastructure\EntryPoint\Api;

final class MarkTaskController
{
}
```

La siguiente ejecución de la feature nos pedirá implementar un método `__invoke`, así que nos vamos a la especificación para diseñar nuestro controlador.

Básicamente, el controlador obtiene el identificador de la tarea y su estado de la request. Con esto instanciamos el comando correspondiente y lo pasamos al CommandBus. Si todo va bien, devolvemos una respuesta con el código de estado OK.

```php
<?php

namespace Spec\App\Infrastructure\EntryPoint\Api;

use App\Application\CommandBus;
use App\Infrastructure\EntryPoint\Api\MarkTaskController;
use PhpSpec\ObjectBehavior;
use Prophecy\Argument;
use Symfony\Component\HttpFoundation\Request;

/**
 * @mixin MarkTaskController
 */
class MarkTaskControllerSpec extends ObjectBehavior
{
    public function let(CommandBus $commandBus)
    {
        $this->beConstructedWith($commandBus);
    }

    public function it_is_initializable(): void
    {
        $this->shouldHaveType(MarkTaskController::class);
    }

    public function it_invokes_mark_task(CommandBus $commandBus): void
    {
        $request = new Request(
            [],
            [],
            [],
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode(['done' => true], JSON_THROW_ON_ERROR)
        );

        $response = $this->__invoke('1', $request);
        
        $response->getStatusCode()->shouldEqual(200);

        $command = new MarkTaskCompleted('1');
        $commandBus->execute($command)->shouldHaveBeenCalled();
    }
}
```

Al ejecutar la especificación con `bin/phpspec run` nos ofrecerá crear algunas cosas por nosotros: el constructor y el método `invoke`. Le decimos que sí, aunque finalizamos a mano:

```php
<?php
declare (strict_types = 1);

namespace App\Infrastructure\EntryPoint\Api;

use App\Application\CommandBus;
use Symfony\Component\HttpFoundation\Request;

final class MarkTaskController
{
    private CommandBus $commandBus;

    public function __construct(CommandBus $commandBus)
    {
        $this->commandBus = $commandBus;
    }

    public function __invoke(string $taskId, Request $request)
    {
        // TODO: write logic here
    }
}
```

Tendremos que introducir el comando `MarkTaskCompleted`, puesto que es bastante trivial lo hacemos completo:

```php
<?php
declare (strict_types=1);

namespace App\Application\MarkTaskCompleted;

class MarkTaskCompleted
{

    private string $taskId;

    public function __construct(string $taskId)
    {
        $this->taskId = $taskId;
    }

    public function taskId(): string
    {
        return $this->taskId;
    }
}
```

Y al ejecutar de nuevo la especificación vemos que falla porque la expectativa del ejemplo no se cumple: no se pasa ningún comando al CommandBus. Es hora de la implementación.

```php
<?php
declare (strict_types = 1);

namespace App\Infrastructure\EntryPoint\Api;

use App\Application\CommandBus;
use App\Application\MarkTaskCompleted\MarkTaskCompleted;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;

final class MarkTaskController
{
    private CommandBus $commandBus;

    public function __construct(CommandBus $commandBus)
    {
        $this->commandBus = $commandBus;
    }

    public function __invoke(string $taskId, Request $request): Response
    {
        $markTaskCompleted = new MarkTaskCompleted($taskId);

        $this->commandBus->execute($markTaskCompleted);

        return new JsonResponse(null, Response::HTTP_OK);
    }
}
```

Este código hace pasar la especificación aunque no necesita usar la Request para ello. Sin embargo, es previsible que en algún momento queramos poder marcar las tareas de nuevo como _no completadas_ o simplemente, queremos que el contrato del API sea más explícito.

Para forzar ese cambio necesitaríamos otro ejemplo en el que pasemos el estado `done` como `false` y, por tanto, no se envíe ese comando al CommandBus.

```php
    public function it_should_not_invoke_mark_task_completed(CommandBus $commandBus): void
    {
        $request = new Request(
            [],
            [],
            [],
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode(['done' => false], JSON_THROW_ON_ERROR)
        );

        $response = $this->__invoke('1', $request);

        $response->getStatusCode()->shouldEqual(200);

        $command = new MarkTaskCompleted('1');
        $commandBus->execute($command)->shouldNotHaveBeenCalled();
    }
```

De este modo, al ejecutar la especificación fallará, obligándonos a tener en cuenta la información que viene en el payload.

```php
<?php
declare (strict_types = 1);

namespace App\Infrastructure\EntryPoint\Api;

use App\Application\CommandBus;
use App\Application\MarkTaskCompleted\MarkTaskCompleted;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;

final class MarkTaskController
{
    private CommandBus $commandBus;

    public function __construct(CommandBus $commandBus)
    {
        $this->commandBus = $commandBus;
    }

    public function __invoke(string $taskId, Request $request): Response
    {
        $payload = json_decode($request->getContent(), true, 512, JSON_THROW_ON_ERROR);

        $done = $payload['done'];

        if ($done) {
            $markTaskCompleted = new MarkTaskCompleted($taskId);
            $this->commandBus->execute($markTaskCompleted);
        }

        return new JsonResponse(null, Response::HTTP_OK);
    }
}
```

Solo nos quedaría refactorizar un poco y el controlador estaría listo, lo que no quiere decir que hayamos terminado. Eso nos lo tiene que decir el test de la _feature_.

Y en este caso se produce un fallo. Debemos configurar el `CommandBus` para saber a quién enviar el comando `MarkTaskCompleted`. Esto nos obligará a introducir su handler `MarkTaskCompletedHandler`.

```
bin/phpspec describe 'App\Application\MarkTaskCompleted\MarkTaskCompletedHandler'
```

Esto generará la especificación y si la ejecutamos creará la clase por nosotras.

La configuración del CommandBus en services.yaml, quedaría así:

```yaml
    App\Infrastructure\CommandBus\HandlerLocator:
        calls:
          - registerHandler:
              - 'App\Application\AddTask\AddTask'
              - '@App\Application\AddTask\AddTaskHandler'
          - registerHandler:
              - 'App\Application\GetTasks\GetTasks'
              - '@App\Application\GetTasks\GetTasksHandler'
          - registerHandler:
              - 'App\Application\MarkTaskCompleted\MarkTaskCompleted'
              - '@App\Application\MarkTaskCompleted\MarkTaskCompletedHandler'
```

Y al ejecutar la _feature_ veremos que vaya porque no está definido el método `__invoke`. Especifiquémoslo. Este handler lo que tiene que hacer es obtener la Task correspondiente al id recibido, marcarla como completada y persistir el cambio. Para ello necesitará de TaskRepository.

```php
<?php

namespace Spec\App\Application\MarkTaskCompleted;

use App\Application\MarkTaskCompleted\MarkTaskCompleted;
use App\Application\MarkTaskCompleted\MarkTaskCompletedHandler;
use App\Domain\Task;
use App\Domain\TaskId;
use App\Domain\TaskRepository;
use PhpSpec\ObjectBehavior;
use Prophecy\Argument;
use Spec\App\Domain\TaskExamples;

/**
 * @mixin MarkTaskCompletedHandler
 */
class MarkTaskCompletedHandlerSpec extends ObjectBehavior
{
    public function let(TaskRepository $taskRepository): void
    {
        $this->beConstructedWith($taskRepository);    
    }
    
    public function it_is_initializable(): void
    {
        $this->shouldHaveType(MarkTaskCompletedHandler::class);
    }

    public function it_should_mark_task_completed(TaskRepository $taskRepository): void
    {
        $task = TaskExamples::withData('1', 'Some description');
        $taskRepository->retrieve(new TaskId('1'))->willReturn($task);
        
        $this->__invoke(new MarkTaskCompleted('1'));

        $taskRepository->store(Argument::that(function (Task $task) {
            return $task->isCompleted();
        }))->shouldHaveBeenCalled();
    }
}
```

La última línea de la especificación puede resultar  un poco rara, pero básicamente se asegura de que cuando se guarda `Task`, haya sido marcada como completada.

La implementación sería así:

```php
<?php
declare (strict_types = 1);

namespace App\Application\MarkTaskCompleted;

use App\Domain\TaskId;
use App\Domain\TaskRepository;

final class MarkTaskCompletedHandler
{
    private TaskRepository $taskRepository;

    public function __construct(TaskRepository $taskRepository)
    {
        $this->taskRepository = $taskRepository;
    }

    public function __invoke(MarkTaskCompleted $markTaskCompleted): void
    {
        $taskId = new TaskId($markTaskCompleted->taskId());
        $task = $this->taskRepository->retrieve($taskId);
        
        $task->markCompleted();
        
        $this->taskRepository->store($task);
    }
}
```

Y para que funcione todo el test necesitamos añadir algunas cosas en `Task`.

```php
<?php
declare (strict_types=1);

namespace App\Domain;

class Task
{

    private TaskId $id;
    private TaskDescription $description;
    private bool $done;

    public function __construct(TaskId $id, TaskDescription $description)
    {
        $this->id = $id;
        $this->description = $description;
    }

    public function id(): TaskId
    {
        return $this->id;
    }

    public function description(): TaskDescription
    {
        return $this->description;
    }

    public function markCompleted(): void
    {
        $this->done = true;
    }

    public function isCompleted(): bool
    {
        return $this->done;
    }
}
```

Así como en la interfaz `TaskRepository` y también lo mínimo en `MemoryTaskRepository` para que no falle el intérprete. En el siguiente ciclo tendríamos que especificarlo e implementarlo.

```php
<?php
declare (strict_types=1);

namespace App\Domain;

interface TaskRepository
{

    public function store(Task $task): void;

    public function nextId(): int;

    public function findAll();

    public function retrieve(TaskId $taskId): Task;
}
```

Con todos estos cambios el test pasa y podemos ejecutar la feature de nuevo. Esta fallará, pidiéndonos precisamente que implementemos el método `retrieve` del repositorio.

```php
<?php

namespace Spec\App\Infrastructure\Persistence;

use App\Domain\TaskId;
use App\Infrastructure\Persistence\TaskMemoryRepository;
use PhpSpec\ObjectBehavior;
use Spec\App\Domain\TaskExamples;

/**
 * @mixin TaskMemoryRepository
 */
class TaskMemoryRepositorySpec extends ObjectBehavior
{
    private const TASK_ID = '1';
    private const TASK_DESCRIPTION = 'Write a test that fails.';
    private const ANOTHER_TASK_ID = '2';
    private const ANOTHER_TASK_DESCRIPTION = 'Write code to make test pass';

    public function it_stores_tasks(): void
    {
        $task = TaskExamples::withData(self::TASK_ID, self::TASK_DESCRIPTION);

        $this->store($task);
        $this->nextId()->shouldBe(2);
    }

    public function it_retrieves_all_tasks(): void
    {
        $task = TaskExamples::withData(self::TASK_ID, self::TASK_DESCRIPTION);
        $anotherTask = TaskExamples::withData(self::ANOTHER_TASK_ID, self::ANOTHER_TASK_DESCRIPTION);

        $this->store($task);
        $this->store($anotherTask);
        $this->findAll()->shouldEqual([$task, $anotherTask]);
    }

    public function it_should_retrieve_existing_task_by_id(): void
    {
        $task = TaskExamples::withData(self::TASK_ID, self::TASK_DESCRIPTION);
        $anotherTask = TaskExamples::withData(self::ANOTHER_TASK_ID, self::ANOTHER_TASK_DESCRIPTION);

        $this->store($task);
        $this->store($anotherTask);
        $this->retrieve(new TaskId(self::TASK_ID))->shouldEqual($task);
    }
}
```

La implementación es sencilla en nuestro ejemplo:

```php
<?php
declare (strict_types=1);

namespace App\Infrastructure\Persistence;

use App\Domain\Task;
use App\Domain\TaskId;
use App\Domain\TaskRepository;

final class TaskMemoryRepository implements TaskRepository
{
    private array $tasks = [];

    public function store(Task $task): void
    {
        $this->tasks[$task->id()->toString()] = $task;
    }

    public function nextId(): int
    {
        $max = array_reduce(
            $this->tasks,
            static fn($max, $task) => max((int)$task->id()->toString(), $max),
            0
        );

        return $max + 1;
    }

    public function findAll(): array
    {
        return array_values($this->tasks);
    }

    public function retrieve(TaskId $taskId): Task
    {
        return $this->tasks[$taskId->toString()];
    }
}
```

Con esto la especificación de `TaskRepository` pasa y podemos lanzar de nuevo la _feature_, que fallará esta vez en el último paso, al esperar que una de las tareas aparezca completada.

Realmente el único lugar donde habría que intervenir es en el `DataTransformer`, ya que el comportamiento de `Task` ha sido definido gracias a una especificación anterior y lo único que ocurre es que la representación aún no contempla el caso de que la tarea esté completada.

```php
<?php

namespace Spec\App\Infrastructure\DataTransformer;

use App\Infrastructure\DataTransformer\TaskToArrayDataTransformer;
use PhpSpec\ObjectBehavior;
use Spec\App\Application\GetTasks\TaskRepresentationExamples;
use Spec\App\Domain\TaskExamples;

/**
 * @mixin TaskToArrayDataTransformer
 */
class TaskToArrayDataTransformerSpec extends ObjectBehavior
{
    private const ID = '1';
    private const DESCRIPTION = 'Write a test that fails';

    public function it_is_initializable(): void
    {
        $this->shouldHaveType(TaskToArrayDataTransformer::class);
    }

    public function it_transforms_task_in_array_representation(): void
    {
        $task = TaskExamples::withData(self::ID, self::DESCRIPTION);

        $this->transform($task)->shouldEqual(
            TaskRepresentationExamples::arrayFromData(self::ID, self::DESCRIPTION)
        );
    }

    public function it_should_transform_completed_tasks(): void
    {
        $task = TaskExamples::completed();

        $this->transform($task)->shouldEqual(
            TaskRepresentationExamples::completed()
        );
    }
}
```

No lo he mencionado antes, pero ejecutando `bin/phpspec run -v` obtenemos más información de por qué falla la especificación, pues de otro modo se ocultan los detalles. No nos ha hecho realmente falta hasta ahora, pero en este ejemplo en concreto nos viene bien.

He añadido estos ejemplos:

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

    public static function completed(): Task
    {
        $task = self::withData('1', 'Task Description');
        $task->markCompleted();

        return $task;
    }
}
```

Y:

```php
<?php
declare (strict_types=1);

namespace Spec\App\Application\GetTasks;

class TaskRepresentationExamples
{

    public static function arrayFromData(string $id, string $description): array
    {
        return [
            'id' => $id,
            'description' => $description,
            'done' => 'no'
        ];
    }

    public static function completed(): array
    {
        return [
            'id' => '1',
            'description' => 'Task Description',
            'done' => 'yes'
        ];
    }
}
```

Los ejemplos `TaskExamples::completed` y `TaskRepresentationExamples::completed` están, por decirlo así, acoplados. El objetivo es tener un lenguaje común en los ejemplos, que nos permita usar los correctos sin tener que saber los detalles.

Por último, en `Task` teníamos que haber inicializado la propiedad `done`.

```php
<?php
declare (strict_types=1);

namespace App\Domain;

class Task
{

    private TaskId $id;
    private TaskDescription $description;
    private bool $done;

    public function __construct(TaskId $id, TaskDescription $description)
    {
        $this->id = $id;
        $this->description = $description;
        $this->done = false;
    }

    public function id(): TaskId
    {
        return $this->id;
    }

    public function description(): TaskDescription
    {
        return $this->description;
    }

    public function markCompleted(): void
    {
        $this->done = true;
    }

    public function isCompleted(): bool
    {
        return $this->done;
    }
}
```

Finalmente, esta es la implementación del DataTransformer:

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
            'done' => $task->isCompleted() ? 'yes' : 'no'
        ];
    }
}
```

Ejecutamos la feature para comprobar que está completa. Y para más seguridad, ejecutamos todas las features de la aplicación. Todo pasa correctamente.

## Final de la quinta entrega

En este capítulo hemos visto cómo añadir una feature nueva en nuestra aplicación. Como se habrá podido observar, la metodología es exactamente la misma y se puede resumir en:

* Definir la feature en lenguaje Gherkin
* Generar el archivo *Context que será nuestro test de aceptación
* Ejecutar el test de aceptación, corrigiendo los errores que nos indique y especificando con un test unitario (o con especificación por ejemplos) cada componente que sea necesario.

En el próximo capítulo me gustaría desarrollar algunas ideas y consideraciones acerca del proceso de desarrollo con metodología y herramientas de Behavior Driven Development.
