---
layout: post 
title: Outside-in y Behavior Driven Development 2 
categories: articles 
tags: tdd php bdd
---

El segundo escenario de nuestro proyecto de lista de tareas comienza donde dejamos el primero: la lista de tareas está vacía y vamos a añadir la primera de ellas.

1. [Introducción, herramientas y ejemplo](/outside-in-with-behat-phpspec/)
2. [Desarrollo del segundo escenario](/outside-in-with-behat-phpspec-2/)
3. [Desarrollo del tercer escenario](/outside-in-with-behat-phpspec-3/)
4. [Manejando bugs con BDD](/outside-in-with-behat-phpspec-4/)
5. [Añadiendo nuevas features](/outside-in-with-behat-phpspec-5/)
6. [Consideraciones sobre BDD](/outside-in-with-behat-phpspec-6/)


Como vimos en el anterior capítulo, el primero de los pasos ya se ha pasado porque es exactamente el mismo que el del escenario anterior. Esto podemos conseguirlo no solo usando la misma redacción, sino que gracias a las expresiones regulares podemos darle bastante flexibilidad al sistema. 

```
  Scenario: Adding task to empty to-do list                       # design/Features/add_tasks.feature:11
    Given I have no tasks in my list                              # Design\App\Contexts\AddTasksContext::iHaveNoTasksInMyList()
    Given I add a task with description "Write a test that fails" # Design\App\Contexts\AddTasksContext::iAddATaskWithDescription()
      TODO: write pending definition
    When I get my tasks                                           # Design\App\Contexts\AddTasksContext::iGetMyTasks()
    Then I see a list containing:                                 # Design\App\Contexts\AddTasksContext::iSeeAListContaining()
      | id | Description             | Done |
      | 1  | Write a test that fails | no   |

```

En todo caso, está claro que es necesario añadir un paso en el que se haga un POST a la API. Esta es la definición que tenemos ahora tal y como ha sido generada por Behat:

```php
    /**
     * @Given I add a task with description :arg1
     */
    public function iAddATaskWithDescription($arg1)
    {
        throw new PendingException();
    }
```

El intérprete de Gherkin ha sido lo bastante inteligente como para darse cuenta de que el texto entre comillas es un _argumento_ para pasar al test. Eso no permitiría, por ejemplo, usar la misma definición del paso para introducir varias tareas.

Lo primero que podemos hacer es cambiar el nombre del argumento, tanto en la anotación como en el parámetro, dejando claro su significado y añadiendo de paso _type hinting_.

```php
    /**
     * @Given I add a task with description :taskDescription
     */
    public function iAddATaskWithDescription(string $taskDescription): void
    {
        throw new PendingException();
    }
```

Lo suyo sería preparar un objeto Request, pasarlo al Kernel y obtener el objeto Response. En principio, al tratarse de un POST, deberíamos obtener en la respuesta el código de status 201 (CREATED) para verificar que la petición a la API se ha realizado correctamente. Algo así:

```php
    /**
     * @Given I add a task with description :taskDescription
     */
    public function iAddATaskWithDescription(string $taskDescription): void
    {
        $payload = [
            'task' => $taskDescription
        ];
        $request = Request::create(
            '/api/todo',
            'POST',
            [],
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode($payload, JSON_THROW_ON_ERROR)
        );

        $response = $this->kernel->handle($request);

        Assert::eq($response->getStatusCode(), Response::HTTP_CREATED);
    }
```

Como era de esperar, este paso falla porque no hay una ruta definida para este endpoint. Tenemos que seguir el mismo proceso de antes y solucionar cada problema paso a paso.

Definimos la ruta en **routes.yaml**

```yaml
api_get_tasks:
  path: /api/todo
  controller: App\Infrastructure\EntryPoint\Api\GetTasksController
  methods: ['GET']

api_add_task:
  path: /api/todo
  controller: App\Infrastructure\EntryPoint\Api\AddTaskController
  methods: ['POST']
```

Y volvemos a ejecutar el escenario para verlo fallar. Esta vez lo que ocurre es que aún no tenemos un controlador en el lugar esperado. Añadimos el mínimo código para solucionarlo.

```php
<?php
declare (strict_types=1);

namespace App\Infrastructure\EntryPoint\Api;

use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

class AddTaskController
{
}
```

Y, otra vez, lanzamos el escenario. Nos pedirá crear un método invoke, cosa que hacemos:

```php
<?php
declare (strict_types=1);

namespace App\Infrastructure\EntryPoint\Api;

use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

class AddTaskController
{
    public function __invoke()
    {
        throw new \RuntimeException('Implement __invoke() method.');
    }
}
```

Y seguimos tirando el test. El objetivo es conseguir que se lance la excepción que nos pide implementar el método. Cuando esto ocurre, es señal de que debemos cambiar de ámbito y comenzar con la especificación de AddTaskController.

Desde la terminal:

```
bin/phpspec describe 'App\Infrastructure\EntryPoint\Api\AddTaskController'
```

Esto generará una Spec básica con la que empezar a trabajar.

```php
<?php

namespace Spec\App\Infrastructure\EntryPoint\Api;

use App\Infrastructure\EntryPoint\Api\AddTaskController;
use PhpSpec\ObjectBehavior;
use Prophecy\Argument;

/**
 * @mixin AddTaskController
 */
class AddTaskControllerSpec extends ObjectBehavior
{
    public function it_is_initializable(): void
    {
        $this->shouldHaveType(AddTaskController::class);
    }
}
```

Básicamente lo que queremos en este punto es que el controlador:

* Obtenga la descripción de la tarea del contenido de la request.
* Invoque el caso de uso para añadir la tarea con esa descripción.
* Devuelva una respuesta 201 CREATED.

**phpspec** favorece una aproximación paso a paso de la especificación. Vamos a verlo.

Básicamente el controlador recibe un objeto Request y devuelve un objeto Response, específicamente un JsonResponse, con un código de estado 201:

```php
<?php

namespace Spec\App\Infrastructure\EntryPoint\Api;

use App\Infrastructure\EntryPoint\Api\AddTaskController;
use PhpSpec\ObjectBehavior;
use Symfony\Component\HttpFoundation\Request;

/**
 * @mixin AddTaskController
 */
class AddTaskControllerSpec extends ObjectBehavior
{
    public function it_is_initializable(): void
    {
        $this->shouldHaveType(AddTaskController::class);
    }

    public function it_returns_created_status(): void
    {
        $request = new Request();

        $response = $this->__invoke($request);

        $response->getStatusCode()->shouldBe(201);
    }
}
```

Al ejecutar la especificación con `bin/phpspec run`, nos pide implementar el método `__invoke`. De modo que empezamos con esta implementación obvia:

```php
<?php
declare (strict_types=1);

namespace App\Infrastructure\EntryPoint\Api;

use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;

class AddTaskController
{
    public function __invoke(Request $request): Response
    {
        return new JsonResponse(null, Response::HTTP_CREATED);
    }
}
```

En el siguiente paso tenemos que introducir el caso de uso. Para ello usaremos un patrón Command/Handler, por lo que deberíamos inyectar el objeto Handler en el controlador. O en su caso podría ser un CommandBus, aunque ahora mismo no sepamos siquiera cómo se va a implementar.

Un CommandBus básico es bastante fácil de implementar. Podríamos incorporarlo en este ejercicio. Aunque nos introduzca un nivel más de indirección, me parece interesante para demostrar que no importa lo compleja que nos parezca una _feature_ para usar estrategias como BDD o TDD en el desarrollo.

Así que tenemos que preparar otra especificación. En ella necesitaremos que el controlador reciba el colaborador CommandBus, de modo que podamos verificar que se le pasa el comando AddTask.

```php
<?php

namespace Spec\App\Infrastructure\EntryPoint\Api;

use App\Infrastructure\EntryPoint\Api\AddTaskController;
use PhpSpec\ObjectBehavior;
use Symfony\Component\HttpFoundation\Request;

/**
 * @mixin AddTaskController
 */
class AddTaskControllerSpec extends ObjectBehavior
{
    public function it_is_initializable(): void
    {
        $this->shouldHaveType(AddTaskController::class);
    }

    public function it_returns_created_status(): void
    {
        $request = new Request();

        $response = $this->__invoke($request);

        $response->getStatusCode()->shouldBe(201);
    }

    public function it_invokes_add_task_command_with_task_description(CommandBus $commandBus): void
    {
        $this->beConstructedWith($commandBus);

        $request = new Request(
            [],
            [],
            [],
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode('Write a test that fails.', JSON_THROW_ON_ERROR)
        );

        $response = $this->__invoke($request);

        $commandBus->execute(new AddTask('Write a test that fails.'))->shouldHaveBeenCalled();
    }
}
```

Esta sería la primera versión de la nueva especificación. Al ejecutarla falla porque no existe una clase o interfaz CommandBus, así que la creamos.

```php
<?php
declare (strict_types=1);

namespace App\Application;

interface CommandBus
{

}
```

Una vez añadida la interfaz, ejecutamos la especificación otra vez. Al fallar, nos invitará a crear la constructora de AddTaskController, y este es el resultado:

```php
<?php
declare (strict_types=1);

namespace App\Infrastructure\EntryPoint\Api;

use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;

class AddTaskController
{
    public function __construct($argument1)
    {
        // TODO: write logic here
    }

    public function __invoke(Request $request): Response
    {
        return new JsonResponse(null, Response::HTTP_CREATED);
    }
}
```

Si volvemos a ejecutar, veremos que avanza un poco y falla porque la clase AddTask no está definida.

Además, vemos que las otras especificaciones se quejan de que el controlador ahora require que se inyecte un argumento en el constructor, por lo que debemos cambiar la forma en que se construye la especificación. Necesitamos el método `let` para que se instancie correctamente el _subject under specification_:

```php
<?php

namespace Spec\App\Infrastructure\EntryPoint\Api;

use App\Application\CommandBus;
use App\Infrastructure\EntryPoint\Api\AddTaskController;
use PhpSpec\ObjectBehavior;
use Symfony\Component\HttpFoundation\Request;

/**
 * @mixin AddTaskController
 */
class AddTaskControllerSpec extends ObjectBehavior
{
    public function let(CommandBus $commandBus): void
    {
        $this->beConstructedWith($commandBus);
    }

    public function it_is_initializable(): void
    {
        $this->shouldHaveType(AddTaskController::class);
    }

    public function it_returns_created_status(): void
    {
        $request = new Request();

        $response = $this->__invoke($request);

        $response->getStatusCode()->shouldBe(201);
    }

    public function it_invokes_add_task_command_with_task_description(CommandBus $commandBus): void
    {
        $request = new Request(
            [],
            [],
            [],
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode(['task' => 'Write a test that fails.'], JSON_THROW_ON_ERROR)
        );

        $this->__invoke($request);

        $commandBus->execute(new AddTask('Write a test that fails.'))->shouldHaveBeenCalled();
    }
}
```

Con esto ya solo falla la especificación en la que queremos trabajar. En primer lugar tenemos que introducir `AddTask`.

```php
<?php
declare (strict_types=1);

namespace App\Application\AddTask;

class AddTask
{

    private string $taskDescription;

    public function __construct(string $taskDescription)
    {
        $this->taskDescription = $taskDescription;
    }
}
```

Y probamos de nuevo, con lo que phpspec nos pregunta si queremos introducir el método execute en CommandBus, dado que no existe todavía. Por supuesto que sí queremos.

```php
<?php
declare (strict_types=1);

namespace App\Application;

interface CommandBus
{

    public function execute($argument1);
}
```

Al decir que sí, se añade el método y se vuelve a ejecutar la especificación, que ahora falla porque no se está pasando ningún objeto AddTask al CommandBus.

Implementamos eso, a la vez que adecentamos un poco el código generado:

```php
<?php
declare (strict_types=1);

namespace App\Infrastructure\EntryPoint\Api;

use App\Application\AddTask\AddTask;
use App\Application\CommandBus;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;

class AddTaskController
{
    private CommandBus $commandBus;

    public function __construct(CommandBus $commandBus)
    {
        $this->commandBus = $commandBus;
    }

    public function __invoke(Request $request): Response
    {
        $this->commandBus->execute(new AddTask('Write a test that fails.'));

        return new JsonResponse(null, Response::HTTP_CREATED);
    }
}
```

Como puedes ver, no estoy extrayendo la descripción de la tarea de la request, pero esta implementación básica me sirve para establecer el comportamiento y ahora no tendría más que hacer un refactor. Recuerda que en TDD lo que nos interesa es ponernos en verde cuanto antes.

Esto es lo que vemos al ejecutar la especificación: que se cumple y, por tanto, el comportamiento está definido... para esta descripción de tarea. **phpspec** no nos permite usar _data providers_ para ejecutar el ejemplo con distintos valores, aunque existe una extensión para eso. Podemos proceder de varias formas:

* Añadir un nuevo ejemplo que sería básicamente el mismo, pero con otra descripción de la tarea, lo que nos forzará a hacer algún cambio que haga pasar los dos ejemplos.
* Esperar a que un escenario de la feature ponga de manifiesto la necesidad de generalizar la implementación al añadir más tareas usando el endpoint, obligándonos a completarla.

Lo que voy a hacer es añadir un nuevo ejemplo, pero antes, un pequeño refactor para que sea menos costoso:

```php
<?php

namespace Spec\App\Infrastructure\EntryPoint\Api;

use App\Application\AddTask\AddTask;
use App\Application\CommandBus;
use App\Infrastructure\EntryPoint\Api\AddTaskController;
use PhpSpec\ObjectBehavior;
use Symfony\Component\HttpFoundation\Request;

/**
 * @mixin AddTaskController
 */
class AddTaskControllerSpec extends ObjectBehavior
{
    public function let(CommandBus $commandBus): void
    {
        $this->beConstructedWith($commandBus);
    }

    public function it_is_initializable(): void
    {
        $this->shouldHaveType(AddTaskController::class);
    }

    public function it_returns_created_status(): void
    {
        $request = new Request();

        $response = $this->__invoke($request);

        $response->getStatusCode()->shouldBe(201);
    }

    public function it_invokes_add_task_command_with_task_description(CommandBus $commandBus): void
    {
        $this->__invoke($this->requestWithPayload('Write a test that fails.'));

        $commandBus->execute(new AddTask('Write a test that fails.'))->shouldHaveBeenCalled();
    }

    private function requestWithPayload(string $taskDescription): Request
    {
        return new Request(
            [],
            [],
            [],
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode(['task' => $taskDescription], JSON_THROW_ON_ERROR)
        );
    }
}
```

Con lo que ahora solo tengo que añadir un nuevo caso:

```php
    public function it_invokes_add_task_command_with_another_task_description(CommandBus $commandBus): void
    {
        $this->__invoke($this->requestWithPayload('Write code to make test pass.'));

        $commandBus->execute(new AddTask('Write code to make test pass.'))->shouldHaveBeenCalled();
    }
```

Y ejecutar la especificación para verla fallar. Y falla porque siempre se lanza el mismo comando con el mismo argumento. Por tanto, hora de cambiar la lógica en el controlador:

```php
<?php
declare (strict_types=1);

namespace App\Infrastructure\EntryPoint\Api;

use App\Application\AddTask\AddTask;
use App\Application\CommandBus;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;

class AddTaskController
{
    private CommandBus $commandBus;

    public function __construct(CommandBus $commandBus)
    {
        $this->commandBus = $commandBus;
    }

    public function __invoke(Request $request): Response
    {
        $payload = json_decode($request->getContent(), true, 512, JSON_THROW_ON_ERROR);

        $this->commandBus->execute(new AddTask($payload['task']));

        return new JsonResponse(null, Response::HTTP_CREATED);
    }
}
```

Al ejecutar la especificación fallará el ejemplo `it_returns_created_status` dado que la request que le pasamos no contiene payload. No tenemos más que cambiarla por la que estamos usando en los últimos ejemplos:

```php
    public function it_returns_created_status(): void
    {
        $response = $this->__invoke($this->requestWithPayload('Write a test that fails.'));

        $response->getStatusCode()->shouldBe(201);
    }
```

Este cambio hace pasar toda la especificación, por lo que podríamos volver a ejecutar los escenarios y ver qué ocurre. 

Es normal encontrarse con esta situación al proceder en pasos tan pequeños y no introducir todo lo que necesitamos de una vez. En ocasiones tenemos el diseño básico muy claro y podemos expresarlo desde el principio. Otras veces, estamos en modo de exploración o queremos proceder en pasos realmente pequeños. Por tanto, tendremos que refactorizar las especificaciones tanto como veamos necesario para facilitar los cambios o la introducción de nuevos ejemplos.

En cualquier caso, para nuestros objetivos nos llega con lo que hemos conseguido hasta ahora. Así que volveremos a ejecutar los escenarios con behat.

En esta ocasión el fallo es:

```
Controller "App\Infrastructure\EntryPoint\Api\AddTaskController" cannot be fetched from the container because it is private.
```

Este es un tema de configuración de Symfony, así que no hay más que arreglar la definición de los controladores en services.yaml y asegurarnos de que todo está correcto.

```yaml
    App\Infrastructure\EntryPoint\Api\:
        resource: '../src/Infrastructure/EntryPoint/Api'
        tags: ['controller.service_arguments']
```

Una vez arreglado esto lanzamos de nuevo los tests y aparece el siguiente error:

``` 
  Cannot autowire service "App\Infrastructure\EntryPoint\Api\AddTaskController": argument "$commandBus" of method "__construct()" references interface "App\Application\CommandBus" but no such service exists. Did you create a class that implements this interface? 
```

Esto es debido a que no tenemos una implementación concreta de `CommandBus`, sino tan solo una interfaz, por lo que **Symfony** no sabe qué clase inyectarle al controlador.

Así que introducimos una implementación vacía. Esto debería ser suficiente:

```php
<?php
declare (strict_types=1);

namespace App\Infrastructure\CommandBus;

use App\Application\CommandBus;

class TodoListCommandBus implements CommandBus
{

    public function execute($argument1)
    {
        throw new \RuntimeException('Implement execute() method.');
    }
}
```

Y lo es. El siguiente error que nos señala el test es que implementemos el método execute del `TodoListCommandBus`, prueba de que el controlador está intentando pasarle el comando `AddTask`. Es el momento de pasar a diseñar nuestro `CommandBus`.

## Diseñando un CommandBus

A estas alturas imagino que estás pensando en introducir [Symfony Messenger](https://symfony.com/doc/current/messenger.html) o [Tactician](https://tactician.thephpleague.com), que son dos muy buenas opciones. Pero para este ejercicio vamos a introducir nuestra propia implementación. Nada nos impedirá añadir otra más sofisticada posteriormente, pero para lo que necesitamos en este momento será suficiente.

Retomando el hilo del desarrollo, nos toca especificar el comportamiento de `TodoListCommandBus`.

Un CommandBus es una aplicación del patrón Mediator. Nos permite que una clase se comunique con otra enviándole mensajes sin tener que saber exactamente cuál es. En nuestro caso, queremos que el comando AddTask sea despachado a un Handler (AddTaskHandler) desde el controlador.

Podríamos hacerlo directamente, como hemos mostrado en otros ejemplos de este blog o el libro [Aprende Test Driven Development](https://leanpub.com/tddcourse), pero utilizar un CommandBus tiene muchas ventajas. Entre otras, podemos hacer cosas como logging, envolver en transacciones, y un largo etcétera, sin contaminar el código relativo al dominio.

Empecemos con la especificación:

```
bin/phpspec describe 'App\Infrastructure\CommandBus\TodoListCommandBus'
```

El principal problema que tenemos aquí es cómo puede saber el CommandBus qué Handler es el destinatario de cada comando. Esto es algo que se puede establecer de muchas formas. Por ejemplo, registrando Command y Handler, usando algún tipo de convención, etc.  

Em cualquier caso, obtener el handler que corresponde a un comando es el tipo de tarea que el `CommandBus` podría delegar a un colaborador, sin preocuparse del cómo hacerlo. Es un nivel de indirección extra, por supuesto.

```php
<?php

namespace Spec\App\Infrastructure\CommandBus;

use App\Application\AddTask\AddTask;
use App\Infrastructure\CommandBus\TodoListCommandBus;
use PhpSpec\ObjectBehavior;
use Prophecy\Argument;

/**
 * @mixin TodoListCommandBus
 */
class TodoListCommandBusSpec extends ObjectBehavior
{
    public function it_handles_command_to_handler(HandlerLocator $handlerLocator, AddTaskHandler $addTaskHandler): void
    {
        $taskDescription = 'Task description';

        $handlerLocator->getHandlerFor(AddTask::class)->willReturn($addTaskHandler);

        $this->beConstructedWith($handlerLocator);

        $this->execute(new AddTask($taskDescription));

        $addTaskHandler->__invoke(new AddTask($taskDescription))->shouldHaveBeenCalled();
    }
}
```

El problema de desarrollar un CommandBus es superinteresante y merecería toda una serie de artículos, pero no nos vamos a extender con ello.

Para hacer pasar la especificación introducimos esto:

```php
<?php
declare (strict_types=1);

namespace App\Application;

class AddTaskHandler
{
    public function __invoke()
    {
        throw new \RuntimeException('Implement __invoke() method.');
    }
}
```

```php
<?php
declare (strict_types=1);

namespace App\Infrastructure\CommandBus;

use App\Application\AddTaskHandler;

class HandlerLocator
{
    public function getHandlerFor($command): object
    {
        throw new \RuntimeException('Implement getHandlerFor() method.');
    }
}
```

```php
<?php
declare (strict_types=1);

namespace App\Infrastructure\CommandBus;

use App\Application\CommandBus;

class TodoListCommandBus implements CommandBus
{

    private HandlerLocator $handlerLocator;

    public function __construct(HandlerLocator $handlerLocator)
    {
        $this->handlerLocator = $handlerLocator;
    }

    public function execute($command): void
    {
        $handler = $this->handlerLocator->getHandlerFor(get_class( $command));

        ($handler)($command);
    }
}
```

Si bien este código hace pasar la especificación, el escenario sigue sin completarse todavía y nos solicita implementar el método `getHandlerFor`. Esto requiere una nueva especificación.

```
bin/phpspec describe 'App\Infrastructure\CommandBus\HandlerLocator'
```

Y nuestro ejemplo será el siguiente, para hacer que el comando `AddTask` sea gestionado por `AddTaskHandler`.

```
<?php

namespace Spec\App\Infrastructure\CommandBus;

use App\Application\AddTask\AddTask;
use App\Application\AddTaskHandler;
use App\Infrastructure\CommandBus\HandlerLocator;
use PhpSpec\ObjectBehavior;
use Prophecy\Argument;

/**
 * @mixin HandlerLocator
 */
class HandlerLocatorSpec extends ObjectBehavior
{
    public function it_associates_add_task_with_handler(): void
    {
        $handler = $this->getHandlerFor(AddTask::class);

        $handler->shouldHaveType(AddTaskHandler::class);
    }
}
```

Y para ello escribimos la menor cantidad de código suficiente:

```php
<?php
declare (strict_types=1);

namespace App\Infrastructure\CommandBus;

use App\Application\AddTaskHandler;

class HandlerLocator
{
    public function getHandlerFor($command): object
    {
        return new AddTaskHandler();
    }
}
```

Por supuesto, esto no es lo bastante genérico, pero nos basta para hacer avanzar el escenario, que es lo que nos importa ahora. Estamos posponiendo decisiones sobre los detalles, pero estamos diseñando la arquitectura general de la solución.

Al ejecutar el escenario ya nos pide el implementar el método __invoke de AddTaskHandler.

¿Qué tendría que hacer AddTaskHandler? En principio:

* Instanciar una tarea (Task), asignándole un identificador y poniéndole como descripción la que se recibe a través del comando AddTask.
* Hacerla persistir en un repositorio

El identificador de la tarea tendrá que venir de algún sitio, por lo que necesitaremos algún tipo de proveedor de identidades. En otras ocasiones he usado el propio repositorio como proveedor, pero esta vez lo haré de una forma diferente.

En cualquier caso, necesitamos una especificación para eso.

```
bin/phpspec describe 'App\Application\AddTaskHandler'
```

Tenemos que introducir dos colaboradores: `TaskIdentityProvider` y `TaskRepository`.

```php
<?php

namespace Spec\App\Application;

use App\Application\AddTask\AddTask;
use App\Application\AddTaskHandler;
use App\Domain\TaskIdentityProvider;
use App\Domain\TaskRepository;
use PhpSpec\ObjectBehavior;
use Prophecy\Argument;

/**
 * @mixin AddTaskHandler
 */
class AddTaskHandlerSpec extends ObjectBehavior
{
    public function it_adds_new_task(TaskIdentityProvider $identityProvider, TaskRepository $taskRepository): void
    {
        $this->beConstructedWith($identityProvider, $taskRepository);

        $identityProvider->nextId()->willReturn(new TaskId(1));

        $this->__invoke(new AddTask('Write a test that fails.'));

        $taskRepository->store(new Task(new TaskId(1), new TaskDescription('Write a test that fails.')))->shouldHaveBeenCalled();
    }
}
```

Como ves, la especificación reproduce nuestro diseño. La ejecutaremos para implementar `AddTaskHandler`. Por el momento, definiremos los colaboradores como interfaces.

Esto nos va a llevar a una situación interesante: Una vez que hayamos introducido las interfaces y creado el constructor de `AddTaskHandler`, nos encontraremos con que algo falla en `HandlerLocator`. Obviamente no puede instanciar `AddTaskHandler` porque no tiene los colaboradores que necesita y que acabamos de definir. Para que quede claro, están fallando especificaciones anteriores que usan `HandlerLocator`.

Para solucionar esto tendremos que volver a especificaciones anteriores y resolver el problema.

```php
<?php

namespace Spec\App\Infrastructure\CommandBus;

use App\Application\AddTask\AddTask;
use App\Application\AddTaskHandler;
use App\Infrastructure\CommandBus\HandlerLocator;
use PhpSpec\ObjectBehavior;
use Prophecy\Argument;

/**
 * @mixin HandlerLocator
 */
class HandlerLocatorSpec extends ObjectBehavior
{
    public function it_associates_add_task_with_handler(): void
    {
        $handler = $this->getHandlerFor(AddTask::class);

        $handler->shouldHaveType(AddTaskHandler::class);
    }
}
```

Obviamente, nuestra primera implementación era extremadamente sencilla. Sin embargo, HandlerLocator no debería ser responsable de instanciar los handlers. Lo ideal sería registrarlos ya instanciados asociándolos al comando correspondiente.

Cambiemos la especificación para reflejar esta idea:

```php
<?php

namespace Spec\App\Infrastructure\CommandBus;

use App\Application\AddTask\AddTask;
use App\Application\AddTaskHandler;
use App\Infrastructure\CommandBus\HandlerLocator;
use PhpSpec\ObjectBehavior;
use Prophecy\Argument;

/**
 * @mixin HandlerLocator
 */
class HandlerLocatorSpec extends ObjectBehavior
{
    public function let(AddTaskHandler $addTaskHandler): void
    {
        $this->beConstructedWith();
        $this->registerHandler(AddTask::class, $addTaskHandler);
    }

    public function it_associates_add_task_with_handler(): void
    {
        $handler = $this->getHandlerFor(AddTask::class);

        $handler->shouldHaveType(AddTaskHandler::class);
    }
}
```

Y empecemos con esta posible implementación:

```php
<?php
declare (strict_types=1);

namespace App\Infrastructure\CommandBus;

use App\Application\AddTaskHandler;
use App\Domain\TaskIdentityProvider;
use App\Domain\TaskRepository;

class HandlerLocator
{
    private array $handlers = [];

    public function getHandlerFor($command): object
    {
        return $this->handlers[$command];
    }

    public function registerHandler(string $commandFQCN, object $handler): void
    {
        $this->handlers[$commandFQCN] = $handler;
    }
}
```

Esto resuelve, de momento, nuestro problema y podemos dedicarnos a trabajar sobre `AddTaskHandler` de nuevo.

Como podemos ver en la especificación, estamos introduciendo varios objetos de dominio, de los cuales necesitaremos crear sus clases para poder ejecutarla completamente.

```php
<?php
declare (strict_types=1);

namespace App\Domain;

class TaskId
{

    private string $id;

    public function __construct(string $id)
    {
        $this->id = $id;
    }
}
```

```php
<?php
declare (strict_types=1);

namespace App\Domain;

class TaskDescription
{

    private string $description;

    public function __construct(string $description)
    {
        $this->description = $description;
    }
}
```

```php
<?php
declare (strict_types=1);

namespace App\Domain;

class Task
{

    private TaskId $id;
    private TaskDescription $description;

    public function __construct(TaskId $id, TaskDescription $description)
    {
        $this->id = $id;
        $this->description = $description;
    }
}
```
```php
<?php
declare (strict_types=1);

namespace App\Domain;

interface TaskRepository
{

    public function store(Task $task): void;
}
```

Finalmente, una vez obtenemos el error esperado (la excepción que nos pide implementar el método __invoke), podemos añadir el código necesario:

```php
<?php
declare (strict_types=1);

namespace App\Application;

use App\Application\AddTask\AddTask;
use App\Domain\Task;
use App\Domain\TaskDescription;
use App\Domain\TaskId;
use App\Domain\TaskIdentityProvider;
use App\Domain\TaskRepository;

class AddTaskHandler
{
    private TaskIdentityProvider $taskIdentityProvider;
    private TaskRepository $taskRepository;

    public function __construct(TaskIdentityProvider $taskIdentityProvider, TaskRepository $taskRepository)
    {
        $this->taskIdentityProvider = $taskIdentityProvider;
        $this->taskRepository = $taskRepository;
    }

    public function __invoke(AddTask $addTask): void
    {
        $id = $this->taskIdentityProvider->nextId();

        $description = new TaskDescription($addTask->description());

        $task = new Task($id, $description);

        $this->taskRepository->store($task);
    }
}
```

Si ejecutamos el escenario ahora veremos que el error que arroja es:

```
Notice: Undefined index: App\Application\AddTask\AddTask in /application/src/Infrastructure/CommandBus/HandlerLocator.php line 16
```

Esto quiere decir que necesitamos registrar el Handler en HandlerLocator en algún lugar de la configuración del contenedor de inyección de dependencias.

**services.yaml**

```yaml

# ...

    App\Infrastructure\CommandBus\HandlerLocator:
        calls:
            - registerHandler:
                  - 'App\Application\AddTask\AddTask'
                  - '@App\Application\AddTaskHandler'



```

Una vez resuelto esto, se nos plantean dos nuevos problemas, ya que no hay implementaciones concretas de `TaskIdentityProvider` ni de `TaskRepository`.

Según nuestros escenarios, los `TaskId` son números enteros (secuenciales), así que vamos a introducir `SequenceTaskIdentityProvider`.

```
bin/phpspec describe 'App\Infrastructure\TaskIdentity\SequenceTaskIdentityProvider'
```

Y para mantener coherencia con el contenido del repositorio basamos esa secuencia en información proporcionada por el propio repositorio.

```php
<?php

namespace Spec\App\Infrastructure\TaskIdentity;

use App\Domain\TaskId;
use App\Domain\TaskRepository;
use App\Infrastructure\TaskIdentity\SequenceTaskIdentityProvider;
use PhpSpec\ObjectBehavior;

/**
 * @mixin SequenceTaskIdentityProvider
 */
class SequenceTaskIdentityProviderSpec extends ObjectBehavior
{
    public function it_provides_an_identity(TaskRepository $taskRepository)
    {
        $taskRepository->nextId()->willReturn(1);
        $this->beConstructedWith($taskRepository);

        $this->nextId()->shouldBeLike(new TaskId('1'));
    }
}
```

`shouldBeLike` es un matcher que nos permite comparar los objetos por su valor, en lugar de `shouldBe` que requiere que se trate del mismo objeto.

Al ejecutar la especificación nos pedirá generar varias clases y métodos (decimos que sí). Finalmente, la implementación queda como sigue:

```php
<?php
declare (strict_types = 1);

namespace App\Infrastructure\TaskIdentity;

use App\Domain\TaskId;
use App\Domain\TaskIdentityProvider;
use App\Domain\TaskRepository;

final class SequenceTaskIdentityProvider implements TaskIdentityProvider
{
    private TaskRepository $taskRepository;

    public function __construct(TaskRepository $taskRepository)
    {
        $this->taskRepository = $taskRepository;
    }

    public function nextId(): TaskId
    {
        $id = (string)$this->taskRepository->nextId();

        return new TaskId($id);
    }
}
```

Ya estamos casi al final, pero todavía necesitamos un repositorio:

```
bin/phpspec describe 'App\Infrastructure\Persistence\TaskMemoryRepository'
```

Aprovechando que también necesitamos implementar el método `nextId`...

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
}
```

Para los propósitos de la especificación y del escenario, realmente no necesitamos mucho más que esto:

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
}
```

Sí, el doble _type cast_ es un poco feo, pero el caso es que funciona. Y con esto también logramos completar el paso correspondiente en el escenario.

Y el siguiente también, aunque realmente no está obteniendo el resultado deseado. Pero eso lo veremos en el siguiente capítulo.

## Fin de la segunda entrega

En esta segunda entrega nos hemos metido un buen atracón de código solo para desarrollar en parte el segundo de los escenarios. Obviamente, esto es debido al hecho de que no existía prácticamente código de producción. El tercer escenario no nos llevará tanto trabajo.

Quizá lo más interesante de esta parte sea el haber jugado con un desarrollo en _baby steps_, a veces no tan pequeños, que nos permitían ir avanzando con relativa rapidez, posponiendo decisiones sobre los detalles de implementación, a la vez que trabajábamos en el diseño. De hecho, esto es lo que tenemos ahora, aunque posiblemente necesite algo de refactorización.

```
src
├── Application
│   ├── AddTask
│   │   └── AddTask.php
│   ├── AddTaskHandler.php
│   └── CommandBus.php
├── Domain
│   ├── Task.php
│   ├── TaskDescription.php
│   ├── TaskId.php
│   ├── TaskIdentityProvider.php
│   └── TaskRepository.php
├── Infrastructure
│   ├── CommandBus
│   │   ├── HandlerLocator.php
│   │   └── TodoListCommandBus.php
│   ├── EntryPoint
│   │   └── Api
│   │       ├── AddTaskController.php
│   │       └── GetTasksController.php
│   ├── Persistence
│   │   └── TaskMemoryRepository.php
│   └── TaskIdentity
│       └── SequenceTaskIdentityProvider.php
├── Kernel.php
└── Lib
    └── FileStorageEngine.php
```

Esto lo dejaremos como ejercicio antes de la próxima entrega, en la que veremos cómo terminar el segundo escenario y cómo completar los cambios que necesitaremos para el tercero.
