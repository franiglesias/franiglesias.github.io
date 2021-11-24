---
layout: post 
title: Outside-in y Behavior Driven Development 4 
categories: articles 
tags: tdd php bdd
---

Vamos a trabajar con bugs.

1. [Introducción, herramientas y ejemplo](/outside-in-with-behat-phpspec/)
2. [Desarrollo del segundo escenario](/outside-in-with-behat-phpspec-2/)
3. [Desarrollo del tercer escenario](/outside-in-with-behat-phpspec-3/)
4. [Manejando bugs con BDD](/outside-in-with-behat-phpspec-4/)
5. [Añadiendo nuevas features](/outside-in-with-behat-phpspec-5/)
6. [Consideraciones sobre BDD](/outside-in-with-behat-phpspec-6/)


En el capítulo anterior completamos la _feature_ de añadir tareas a la lista. Esto no implica que el producto esté completamente terminado, pero ya tenemos algo que las usuarias pueden utilizar y, por tanto, pueden proporcionarnos _feedback_. Hemos aportado la diferencia entre no tener nada y tener una aplicación que me permita tomar nota de las tareas, aunque el resto del trabajo tenga que ser manual.

Es habitual que tengamos un cierto _roadmap_ de las prestaciones que queremos añadir a nuestra aplicación. Por ejemplo, es muy evidente la necesidad de poder marcar tareas completadas, poder modificar su descripción, eliminarlas, etc. Este _roadmap_ o _backlog_ consiste en una lista priorizada, pero tales prioridades pueden cambiar o verse alteradas por los resultados del _feedback_.

Así, por ejemplo, podríamos encontrarnos con que las usuarias se quejan de la aplicación permite introducir tareas con una descripción vacía.

## ¿Qué es un bug?

Este tipo de problema suele catalogarse como bug. Pero, ¿es realmente un bug? Cuando desarrollamos con enfoques outside-in o BDD, los bugs se corresponden más bien con ejemplos o escenarios que no han sido contemplados o descritos. No se trata de código con un comportamiento difícil de seguir o incluso impredecible. Podemos tratar estos bugs como si fuesen nuevos escenarios o nuevos ejemplos en las especificaciones.

Por supuesto, pueden existir bugs debidos a un algoritmo incorrecto, pero es habitual también que no tengamos un test que lo prevenga. El código no testeado es el lugar donde viven los bugs.

De hecho, existe una formulación similar para usar TDD en la resolución de bugs: escribe un test que falle, poniendo de manifiesto el error, y luego escribe el código que haga pasar el test y que resolverá el bug.

Así, nosotras podríamos asegurar que no se introducen tareas con descripción vacía describiendo un escenario a nuestra _ _ que describa cómo se tiene que comportar el sistema: devolviendo un error y no añadiendo nuevas tareas.

```gherkin
  Scenario: Adding task without description to non empty to-do list
    Given I have this tasks in my list
        | id | description             | done |
        | 1  | Write a test that fails | no   |
    When I add a task with empty description
    Then I get a bad request error
    Then I get an error message that says "Task description is too short or empty"
    Then The list contains:
        | id | description             | done |
        | 1  | Write a test that fails | no   |
```

Como se puede comprobar, esto introduce algunos pasos nuevos en el test BDD. Por ejemplo, este paso para enviar una tarea sin descripción:

```php
    /**
     * @When /^I add a task with empty description$/
     */
    public function iAddATaskWithEmptyDescription(): void
    {
        $payload = [
            'task' => ''
        ];
        $this->response = $this->apiPostWithPayload('/api/todo', $payload);
    }
```

Cuando ejecutamos la _feature_ este paso del escenario se completa, ya que no hacemos ninguna comprobación particular sobre él. De hecho estamos reutilizando algo de código, por lo que tenemos seguridad de que la llamada se hace correctamente.

En este punto no tenemos nada más que hacer, ya que el test no nos indica que tengamos que hacer algo.

Es en el siguiente paso cuando comprobamos lo que nos devuelve el endpoint. 

```php
    /**
     * @Then /^I get a bad request error$/
     */
    public function iGetABadRequestError(): void
    {
        Assert::eq($this->response->getStatusCode(), 400);
    }
```

Este paso sí que falla. 

```
Expected a value equal to 400. Got: 201
```

Para averiguar dónde tenemos que intervenir podemos ir examinando cada paso del procesamiento de la request. El primero es el controlador, que es justamente responsable de devolver el código de estado de la llamada. Por tanto, es en el controlador donde debemos gestionarlo.

La pregunta aquí sería si validar la descripción de la tarea en el controlador o dejar eso para una capa más interna. De esta última forma el controlador tendría que gestionar la excepción lanzada desde la capa de dominio. Para este ejercicio lo haremos así.

Añadimos este ejemplo en **AddTaskControllerSpec**, simulando que la ejecución del caso de uso ha fallado con una excepción.

```
    public function it_fails_with_bad_request_when_task_description_is_empty(CommandBus $commandBus): void
    {
        $commandBus->execute(new AddTask(''))->willThrow(InvalidTaskDescription::class);
        
        $response = $this->__invoke($this->requestWithPayload(''));

        $response->getStatusCode()->shouldBe(400);
    }
```

El ejemplo no pasa por lo que debemos implementar algo en el controlador. Necesitaremos añadir la nueva excepción también.

```php
<?php
declare (strict_types=1);

namespace App\Domain;

class InvalidTaskDescription extends \DomainException
{
    
}
```

Y cambiamos así el controlador:

```php
<?php
declare (strict_types=1);

namespace App\Infrastructure\EntryPoint\Api;

use App\Application\AddTask\AddTask;
use App\Application\CommandBus;
use App\Domain\InvalidTaskDescription;
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

        try {
            $this->commandBus->execute(new AddTask($payload['task']));
        } catch (InvalidTaskDescription $invalidTaskDescription) {
            return new JsonResponse($invalidTaskDescription->getMessage(), 400);
        }

        return new JsonResponse(null, Response::HTTP_CREATED);
    }
}
```

Al ejecutar el escenario ocurre esto:

```
Expected a value equal to 400. Got: 201
```

Como era de esperar, sigue fallando ya que no hay ningún código que provoque la excepción. Tenemos que avanzar un nivel más y llegar al caso de uso.

```php
<?php
declare (strict_types=1);

namespace App\Application\AddTask;

use App\Domain\Task;
use App\Domain\TaskDescription;
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
        $task = $this->buildTask($addTask);

        $this->taskRepository->store($task);
    }

    public function buildTask(AddTask $addTask): Task
    {
        $id = $this->taskIdentityProvider->nextId();

        $description = new TaskDescription($addTask->description());

        return new Task($id, $description);
    }
}
```

Si observamos el caso de uso, podemos ver que aquí realmente no tenemos nada que hacer. La regla de negocio debería forzarla la constructora de `TaskDescription`, impidiendo que se puedan instanciar objetos con descripción vacía. Por otra parte, el caso de uso no tiene que manejar la excepción, sino que simplemente la deja llegar al controlador.

Así que vamos a desarrollar eso especificando `TaskDescription`.

```
bin/phpspec describe 'App\Domain\TaskDescription'
```

```php
<?php

namespace Spec\App\Domain;

use App\Domain\TaskDescription;
use PhpSpec\ObjectBehavior;
use Prophecy\Argument;

/**
 * @mixin TaskDescription
 */
class TaskDescriptionSpec extends ObjectBehavior
{
    public function it_is_initializable(): void
    {
        $this->shouldHaveType(TaskDescription::class);
    }
}
```

La especificación fallará porque necesitamos instanciar `TaskDescription` con algún valor, por lo que tenemos que hacer algunos cambios. Esto ocurre porque en su momento no especificamos la clase desde cero y la introdujimos con la protección de los otros tests. 

```php
<?php

namespace Spec\App\Domain;

use App\Domain\TaskDescription;
use PhpSpec\ObjectBehavior;

/**
 * @mixin TaskDescription
 */
class TaskDescriptionSpec extends ObjectBehavior
{
    public function let(): void
    {
        $this->beConstructedWith('Some description');
    }

    public function it_is_initializable(): void
    {
        $this->shouldHaveType(TaskDescription::class);
    }
}
```

La feature dice que la descripción no debería estar vacía y no indica ningún requisito más, así que añadimos el siguiente ejemplo a la especificación:

```php
    public function it_should_not_be_empty(): void
    {
        $this->beConstructedWith('');
        $this->shouldThrow(InvalidTaskDescription::class)->duringInstantiation();
    }
```

Y la podemos hacer pasar con:

```php
<?php
declare (strict_types=1);

namespace App\Domain;

class TaskDescription
{

    private string $description;

    public function __construct(string $description)
    {
        if ($description === '') {
            throw new InvalidTaskDescription();
        }

        $this->description = $description;
    }

    public function toString(): string
    {
        return $this->description;
    }
}
```

Una vez que estamos de nuevo en verde, volvemos a ejecutar la feature, con el resultado de que hemos avanzado un paso del escenario. El siguiente paso requiere que devolvamos un mensaje de error en el payload de la respuesta, bajo la clave `message`. 

```php
    /**
     * @Then /^I get an error message that says "([^"]*)"$/
     */
    public function iGetAnErrorMessageThatSays($expectedMessage): void
    {
        $payload = json_decode($this->response->getContent(), true, 512, JSON_THROW_ON_ERROR);

        $errorMessage = $payload['message'];
        Assert::eq($errorMessage, $expectedMessage);
    }
```

En `AddTaskControllerSpec` añadimos otro ejemplo:

```php
    public function it_notifies_error_when_task_description_is_empty(CommandBus $commandBus): void
    {
        $commandBus->execute(new AddTask(''))->willThrow(InvalidTaskDescription::class);

        $response = $this->__invoke($this->requestWithPayload(''));

        $payload = ['message' => 'Task description is too short or empty'];
        $response->getContent()->shouldBe(json_encode($payload, JSON_THROW_ON_ERROR));
    }

```

Y una posible implementación sería:

```php
<?php
declare (strict_types=1);

namespace App\Infrastructure\EntryPoint\Api;

use App\Application\AddTask\AddTask;
use App\Application\CommandBus;
use App\Domain\InvalidTaskDescription;
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

        try {
            $this->commandBus->execute(new AddTask($payload['task']));
        } catch (InvalidTaskDescription $invalidTaskDescription) {
            $response = [
                'message' => 'Task description is too short or empty'
            ];
            return new JsonResponse($response, 400);
        }

        return new JsonResponse(null, Response::HTTP_CREATED);
    }
}
```

Con esto, la especificación pasa y también avanza el escenario. Solo nos queda un paso, que hemos definido así:

```php
    /**
     * @Then /^The list contains:$/
     */
    public function theListContains(TableNode $table)
    {
        $this->response = $this->apiGet('/api/todo');
        $payload = $this->obtainPayloadFromResponse();

        $expected = $table->getHash();

        Assert::eq($payload, $expected);
    }
```

Pero este paso no necesita implementar nada, por lo que el _bug_ queda solucionado.

## Fin de la tercera entrega

Si estamos desarrollando con metodologías TDD o BDD es habitual que un bug no resulte se más que un comportamiento específico que no se ha implementado. Nuestra forma de abordarlo se basa en añadir nuevos escenarios y ejemplos que describan el comportamiento esperado para los casos en los que aparece el error.

La dinámica de trabajo es exactamente la misma. Empezamos definiendo un escenario que falle, poniendo de manifiesto el bug y procedemos de fuera hacia adentro. En cada nivel, especificamos el comportamiento esperado del componente y lo vemos fallar. La implementación que haga pasar las especificaciones contribuirá a subsanar el problema, hasta conseguir que el escenario pase completamente.

