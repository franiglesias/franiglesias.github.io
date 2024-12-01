---
layout: post
title: La paradoja de las colecciones
categories: articles
tags: software-design php refactoring
---

Las reglas de Object Calisthenics nos piden encapsular todas las estructuras de datos que representan alguna colección
en objetos. Pero, en contra de lo que nos sugiere el nombre, estos objetos no tienen por qué ser en sí mismos
colecciones. De hecho, no es especialmente recomendable que lo sean.

_Nota 1:_ Este capítulo es un adelanto de la segunda edición del libro "La guía del refactor cotidiano")

_Nota 2:_ Según compruebo en la lista de posts, se acaban de cumplir 8 años del blog, que empecé a finales de noviembre de 2016. La de cosas que han pasado desde entonces. ¡Gracias por seguir ahí!

## Abstraer las estructuras de datos

Creo que fue leyendo el libro de Sandi Metz, "Practical Object-Oriented Design in Ruby", que me llamó la atención la idea de ocultar las estructuras de datos incluso dentro de la misma clase. Es decir, si una clase tiene un atributo que es un _array_, no deberíamos acceder a su contenido directamente desde dentro de la clase, sino que deberíamos hacerlo a través de métodos.

```php
class Order
{
    private $items = [];

    public function addItem(Item $item): void
    {
        $this->items[] = $item;
    }
    
    public function total(): float
    {
        $total = 0;
        foreach ($this->items as $item) {
            $total += $item->price();
        }
        return $total;
    }
    
    private function item($position int): float
    {
        return $this->items[$position];
    }
   
}
```

Esta idea es contra-intuitiva, porque nos parece lógico acceder directamente a los atributos de una clase desde dentro de ella. Pero, si lo pensamos bien, hacerlo tiene algunos problemas:

* Para usar la estructura de datos tenemos que saber cosas sobre ella, como que es un array. Pero podría ser un diccionario, una lista enlazada, un conjunto, etc. Si accedemos a la estructura de datos directamente, estamos acoplando el código que la usa a la estructura de datos concreta. Es un caso de _Inappropriate Intimacy_.
* Si cambiamos la estructura de datos, tenemos que cambiar el código que la usa, lo que puede suponer un caso de _Shotgun Surgery_, un _smell_ que sucede cuando tenemos que aplicar un mismo cambio en muchos lugares.

Podemos evitar ambos problemas encapsulando la estructura de datos en métodos. De esta forma, si cambiamos la estructura de datos, solo tenemos que cambiar los métodos que la encapsulan, y no el código que la usa. Y lo mejor, es que el objeto envoltorio puede ser cualquier cosa, no tiene por qué ser una colección. Nos basta con que responda a los mensajes que necesitemos. Fíjate como el método `averagePrice()` no tiene ni idea de la estructura subyacente.

```php
class Items
{
    private $items = [];

    public function addItem(Item $item): void
    {
        $this->items[] = $item;
    }
    
    public function averagePrice(): float
    {
        return $this->total() / $this->count();
    }
    
    public function total(): float
    {
        $total = 0;
        foreach ($this->items() as $item) {
            $total += $item->price();
        }
        return $total;
    }
    
    private function item($position int): float
    {
        return $this->items[$position];
    }
    
    private function items(): array
    {
        return $this->items;
    }
    
    private function count(): int
    {
        return count($this->items);
    }
}
```

Tanto es así que sus los consumidores de `Items` no tienen ni por qué saber que se trata de una colección. Es tan solo un objeto al que podemos enviarle el mensaje `total()` y nos devolverá el total de los elementos que contiene.

```php
class Order
{
    private Items $items;

    public function __construct(Items $items)
    {
        $this->items = $items;
    }
    
    public function total(): float
    {
        return $this->items->total();
    }
}   
```

Además del beneficio de darnos libertad para cambiar la estructura primitiva de datos sin afectar a los otros objetos consumidores, también podemos encapsular comportamiento en ese objeto.

Es el caso del cálculo del total de los elementos de la colección, que hemos movido a la clase `Items`. Esto ejemplifica que, en muchos casos, la clase consumidora de `Items` no necesita acceder a sus elementos individualmente, porque solo está interesada en agregaciones de sus datos, por lo que no necesita ser una colección. Esto simplifica el desarrollo de `Order`, permitiéndonos pensar en un nivel de abstracción más alto y despreocuparnos de muchos detalles. Un buen ejemplo de _Tell, don't ask_, un principio de diseño que desarrollaremos en un capítulo posterior.

## Por qué las colecciones no tienen que ser colecciones

Los lenguajes de programación ofrecen diversas estructuras de datos con las que representar colecciones de elementos, tales como arrays, listas, diccionarios, conjuntos, colas, pilas, etc. Cada una de estas estructuras es adecuada para distintas finalidades, y cada una tiene sus propias propiedades y comportamientos. Por ejemplo, una pila es una estructura en la que el último elemento que ha entrado es el primero en salir, mientras que en una cola es el primero en entrar el primero en salir. Un array, típicamente nos permite acceder a sus elementos por su posición, mientras que en un diccionario podemos acceder a ellos por una clave.

Ante un caso de uso concreto deberíamos utilizar la estructura que mejor se ajuste a nuestras necesidades. Esto no siempre está claro desde el principio, por lo que a veces necesitamos cambiar esta estructura. Por otro lado, cada estructura nos presenta una serie de comportamientos y forma de interactuar con ella, que no tienen la semántica adecuada a nuestro caso de uso, ni vamos a utilizar todos ellos. Esto conlleva un grado de acoplamiento entre la estructura de datos y el código que la usa, que puede ser problemático, pero que podemos evitar encapsulando la colección en un objeto con una interfaz más adecuada.

Vamos a entenderlo mejor con un ejemplo. Supongamos una aplicación de seguimiento de tareas. Podríamos tener una clase `Task`, como esta:

```php
class Task
{
    private $status;
    private $startDate;
    private $doneDate;

    public function __construct($status, $startDate, $doneDate = null)
    {
        $this->status = $status;
        $this->startDate = $startDate;
        $this->doneDate = $doneDate;
    }

    public function status()
    {
        return $this->status;
    }

    public function start()
    {
        $this->status = 'in progress';
        $this->startDate = new DateTime();
    }

    public function started()
    {
        return $this->startDate;
    }
    
    public function finish()
    {
        $this->status = 'done';
        $this->doneDate = new DateTime();
    }
}
```

Ahora, imaginemos este servicio que gestiona la colección de tareas, en este caso para decirnos las tareas que están pendientes de terminar:

```php
class TaskService
{
    private $tasks;

    public function __construct(array $tasks)
    {
        $this->tasks = $tasks;
    }

    public function getPendingTasks(): array
    {
        $pendingTasks = [];
        foreach ($this->tasks as $task) {
            if ($task->status() === 'in progress') {
                $pendingTasks[] = $task;
            }
        }
        return $pendingTasks;
    }
}
```

¿Eres capaz de ver el problema? Tal como está programado, `TaskService` tiene que saber muchas cosas acerca de la estructura de datos que representa la colección de tareas: que es un array, que tiene que recorrerlo entero, etc. De hecho, tiene que saber cosas de `Task`, y ese es otro problema de acoplamiento. Si cambiamos la estructura de datos, o la forma de acceder a los elementos, o la forma de filtrarlos, tendríamos que cambiar `TaskService`, lo que sería un caso de _Shotgun Surgery_.

Podríamos cambiar la implementación para adoptar un método más funcional, usando `array_filter`, encapsulando la lógica de filtrado en una función anónima. El resultado es un código más conciso. Pero, aun así, `TaskService` sigue teniendo el mismo acoplamiento y se ve obligado a aportarle comportamiento a la estructura de datos.

```php
class TaskService
{
    private array $tasks;

    public function __construct(array $tasks)
    {
        $this->tasks = $tasks;
    }

    public function getPendingTasks(): array
    {
        return array_filter($this->tasks, function ($task) {
            return $task->status() === 'in progress';
        });
    }
}
```

Nosotras lo que queremos es que `TaskService` sepa lo mínimo necesario. Así, lo único que debería saber `TaskService` sobre `$tasks` es que es un objeto al que le puede preguntar por las tareas pendientes. No debería saber que es un array, ni la forma en que se filtran las tareas pendientes. De hecho, no debería saber ni siquiera que es una colección. Solo debería saber que es un objeto que responde a un mensaje `pendingTasks()` con otra colección que solo incluye las tareas en progreso.

```php
class TaskCollection
{
    private array $tasks;

    public function __construct(array $tasks)
    {
        $this->tasks = $tasks;
    }

    public function pendingTasks(): TaskCollection
    {
        $inProgress = array_filter($this->tasks, function ($task) {
            return $task->status() === 'in progress';
        });
        
        return new TaskCollection($inProgress) ;
    }
}
```

Ahora, `TaskService` solo tiene que saber que `TaskCollection` tiene un método `pendingTasks()`. Si cambiásemos la estructura de datos subyacente por un hash, o cambiamos la forma de filtrar las tareas pendientes, o cualquier otra cosa, `TaskService` seguiría funcionando igualmente. El resultado es que TaskService se simplifica hasta el punto de tener una lógica trivial. La complejidad de la lógica de filtrado se ha trasladado a `TaskCollection`, que es donde debería estar.

```php
class TaskService
{
    private TaskCollection $tasks;

    public function __construct(TaskCollection $tasks)
    {
        $this->tasks = $tasks;
    }

    public function pendingTasks(): TaskCollection
    {
        return $this->tasks->pendingTasks();
    }
}
```

Como puedes ver `TaskCollection` representa una colección, pero en sí misma no es una colección. En lugar de exponer comportamientos genéricos de una colección, lo que nos presenta son métodos adecuados al dominio de la aplicación. En este caso, `pendingTasks()`, que es un concepto importante en una aplicación de gestión de tareas. A esto nos referíamos al principio cuando decíamos que las colecciones no tienen por qué ser colecciones, aunque se implementen usando estructuras de datos de colección.

## Resumen

Encapsular colecciones en objetos nos permite ocultar los detalles de implementación y las estructuras de datos, exponiendo solo comportamientos que sean importantes para los consumidores de esos objetos. Esto nos da libertad para cambiar la estructura de datos sin afectar a los objetos consumidores, y nos permite encapsular comportamiento en esos objetos, simplificando el desarrollo y reduciendo la fuerza del acoplamiento.

