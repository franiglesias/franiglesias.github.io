---
layout: post
title: De directory driven a DDD paso a paso
categories: articles
tags: good-practices design-principles ddd
---

Muchas bases de código que han sido creadas tratando de seguir la metodología DDD se quedan atascadas en ese falso DDD que solemos llamar "directory driven development", que es básicamente una aplicación de la Arquitectura Hexagonal. Esto es, utilizan la típica distribución de carpetas Domain, Application e Infrastructure, pero el código en ellas está mal organizado y mal distribuido porque en su día no se tenía una comprensión completa de lo que implica Domain Driven Design.

El resultado es que en lugar de la proverbial *Big Ball of Mud* ahora tenemos tres *Big Balls of Mud* que, en parte, es algo mejor pero no suficiente.

Así que en este artículo vamos a ver cómo montar un plan que nos permita evolucionar el código a una organización más próxima a DDD que nos facilite llegar a un diseño más sólido, con el que identificar mejor elementos complejos como agregados, módulos o *bounded contexts*.

El punto de partida de esta propuesta es la idea de que el código es una representación ejecutable del conocimiento que tenemos sobre el dominio o, también, una expresión del modelo del dominio que tiene el equipo. Por tanto, se trata de un **refactor orientado a tener un mejor conocimiento del dominio**, un modelo más articulado del mismo, lo que nos puede llevar a un punto en el que estemos en disposición de profundizar en la flexibilidad del diseño, los *bounded contexts* como representación de los subdominios y otras muchas mejoras.

Y estas son sus etapas:

En la capa de dominio

* Eliminar menciones técnicas en la capa de dominio y organizarla en torno a conceptos
* Identificar agregados y encapsular en el Aggregate Root
* Empujar comportamiento hacia el dominio
* Eliminar lógica de dominio de los repositorios

En la capa de Aplicación

* Eliminar menciones técnicas en la capa de aplicación
* Organizar la capa de aplicación en torno a use cases
* Mover servicios a la capa de dominio si representan reglas de negocio
* Haz que se lancen eventos anunciando cualquier cosa interesante que haya en el dominio
* Introduce un Command Bus si no lo tienes ya
* Introduce un Event Bus si no lo tienes ya
* Analiza los Use cases y deja en ellos solo el código que ejecuta su intent y mueve la lógica a subscribers

En la capa de infraestructura

* Organizar la capa de infraestructura en torno a conceptos

Siendo realistas, esto va a ser una gran cantidad de trabajo y es una locura intentar hacerlo de una tacada, incluso las fases sueltas. Lo más eficaz es aplicarlo de forma iterativa en cada tarea.

Es decir, en una tarea que tengamos, aplicamos la primera etapa en las clases de dominio que tengamos que tocar. Pero solo la primera. La próxima vez que "pasemos por ahí" aplicamos la siguiente etapa y así sucesivamente.

Intentar refactorizar a DDD como proyecto nunca funciona.

Por otro lado, no existe una receta mágica. Una forma perfecta de organizar un dominio válida para todos los casos. Olvídalo. El código debería reflejar el modelo mental que tenemos, como equipo o empresa, del dominio en el que estamos trabajando o, en todo caso, del subdominio específico que nosotros estamos modelando.

Esencialmente se trata de elaborar el mapa conceptual del dominio o subdominio y eso es un proceso evolutivo y conversacional. La conversación tiene lugar entre los expertos del dominio y el equipo de desarrollo, conversación de la que debe concretarse el lenguaje ubicuo, pero el código va a ser el resultado de expresar el modelo mental que el equipo de desarrollo se forme.  

## Eliminar menciones técnicas en la capa de dominio y organizarla en torno a conceptos

Muchas veces la carpeta de dominio tiene una forma como esta:

```
Domain
  + Academic
      +- Entity
      |   +- Student.php
      +   +- Teacher.php
      +- VO
      |   +- StudenId.php
      |   +- TeacherId.php
      |   +- Level.php
      |   +- Stage.php
      |   +- Subject.php
      +- Event
      |   +- StudentWasEnrolledInCourse.php
 ...         
```

Te haces a la idea, ¿no? La carpeta de dominio se organiza en base a *technicalities*. Tal vez el primer nivel intente establecer unos conceptos o módulos, pero luego vemos que toman el control aspectos puramente técnicos.

Cuando hablamos del lenguaje ubicuo hablamos de lo que debe incluir, pero no hablamos de lo que no debería incluir, y esta taxonomía de elementos técnicos no debe estar presente en él.

Un problema que puede surgir es intentar organizar prematuramente cosas como los módulos o los agregados. Es mejor ir paso a paso.

Así, el primer paso es intentar estructurar todo en conceptos que, en principio, serán concretos y de este jaez:

```
Domain
  + Academic
      +- Student
      |   +- Student.php
      |   +- StudentId.php
      |   +- StudentRepository.php
      |   +- StudentWasEnrolledInCourse.php
      +- Teacher
      |   +- Teacher.php
      |   +- TeacherId.php
      |   +- TeacherRepository.php
      +- Course
      |   +- Level.php
      |   +- Stage.php
      |   +- Subject.php
 ...
```

Posibles excepciones: puesto que seguramente cada concepto esté involucrado en una buena cantidad de eventos podría ser adecuado tener una carpeta para los eventos. Sin embargo, es posible que también podamos estructurar las carpetas a partir de Servicios, es decir, clases que ejecutan comportamientos que no se pueden atribuir claramente a una entidad o agregado. Algo así:

```
Domain
  + Academic
      +- Student
      |   +- Student.php
      |   +- StudentId.php
      |   +- StudentRepository.php
      |   +- EnrollStudentInCourse
      |   |   +- EnrollStudentInCourse.php
      |   |   +- StudentWasEnrolledInCourse.php
      +- Teacher
      |   +- Teacher.php
      |   +- TeacherId.php
      |   +- TeacherRepository.php
      +- Course
      |   +- Level.php
      |   +- Stage.php
      |   +- Subject.php
      |   +- AssessSubject
      |   |   +- AssessSubject.php
      |   |   +- StudentWasAssessedInSubject.php
      |   +- AssessmentPeriod.php
 ...
```

O así, si lo prefieres:


```
Domain
  + Academic
      +- Student
      |   +- Student.php
      |   +- StudentId.php
      |   +- StudentRepository.php
      +- Teacher
      |   +- Teacher.php
      |   +- TeacherId.php
      |   +- TeacherRepository.php
      +- Course
      |   +- Level.php
      |   +- Stage.php
      |   +- Subject.php
      |   +- AssessmentPeriod.php
      +- EnrollStudentInCourse
      |   +- EnrollStudentInCourse.php
      |   +- StudentWasEnrolledInCourse.php
      +- AssessSubject
      |   +- AssessSubject.php
      |   +- StudentWasAssessedInSubject.php
 ...
```

Como puede apreciarse la impresión de orden aumenta mucho. Cognitivamente hablando, la nueva estructura revela un mayor sentido, ya que las clases más estrechamente relacionadas van juntas. En la práctica, a la hora de hacer cambios, la carga es menor porque posiblemente tendremos que tocar archivos que están en la misma carpeta, sin necesidad de buscar en varias.

Otra ventaja a largo plazo es que nos facilita partir el dominio si en algún momento vemos esa necesidad por el desarrollo de nuestra comprensión del negocio, por ejemplo para detectar módulos o incluso bounded contexts.

Por otra parte, es muy posible que en tu carpeta de dominio no tengas todavía servicios, algo que ya solucionaremos en fases posteriores.

## Identificar agregados y encapsular en el Aggregate Root

Los conceptos de Entidad y Value Object suelen estar bastante claros. Por contra, los agregados pueden ser un poco más complejos de identificar.

Un agregado es una forma de agrupar dentro de un límite de consistencia un conjunto de entidades, y value objects, que mantienen entre ellas una invariante. Dicho así suena muy pedante, así que vamos a intentar explicarlo.

### Límites de consistencia

La idea de consistencia posiblemente ya la tienes. Cuando instancias un objeto procuras que sea consistente, o sea, que contenga toda la información que necesita para crearse y que esta tenga sentido conforme a las reglas de negocio. Por ejemplo, un email ha de ser un email válido, o una persona ha de tener nombre y al menos un apellido.

Cuando son varias las entidades participando debe darse una consistencia entre ellas.

Por ejemplo, en una aplicación para organizar viajes, un viaje tiene que tener diversas etapas, como mínimo origen y destino y puede tener cero o más etapas intermedias. Esto se puede representar así:

```php

class Journey
{
    public function __construct(Place $origin, Place $destination)
    {
    //...
    }
    
    public function addStage(Place $stage)
    {
    //...
    }
}
```

Siendo Journey la raíz del agregado, es la que define los límites en que debe mantenerse una consistencia con las otras entidades participantes.

### Invariantes

Si piensas en el concepto de Validación ya tienes una idea aproximada de lo que sería una invariante. En cierto sentido es una validación que se aplica a la relación entre entidades.

En el ejemplo anterior las invariantes son:

* El viaje ha de tener origen y destino (no se puede crear un viaje sin las dos)
* El viaje puede tener cero o más etapas intermedias (se pueden añadir opcionalmente)

Imagina que para los efectos de esta aplicación una regla de negocio es que solo pueden hacerse un total de 5 etapas en un viaje. Ahora las invariantes son:

* El viaje ha de tener origen y destino.
* El viaje puede tener entre 0 y 3 etapas intermedias.

En código sería algo así:

```php
class Journey
{
    public function __construct(Place $origin, Place $destination)
    {
        $this->stages->append($origin);
        $this->stages->append($destination);
    }
    
    public function addStage(Place $stage)
    {
        if ($this->stages->count() >= 5) {
            throw new AddingStageException('Only 5 stages allowed');
        }
        
        $this->stages->appendAfterOrigin($stage);
    }
}
```


### Ejemplo

Una buena parte de los elementos del DDD pueden ser vistos como límites de consistencia, en los que las reglas de negocio e invariantes deben protegerse a distinta escala, por así decir:

* Value objects y Entidades
* Agregados
* Bounded Context

Así que veamos un ejemplo para explicarlo bien.

Supongamos que nuestro sistema de gestión escolar tiene en un concepto que representa las tareas de aprendizaje que se asignan a cada estudiante y que hemos decidido representar con una entity llamada Task. Para poder llevar un seguimiento, estas tareas tienen un estado, que representaremos mediante un Value Object llamado TaskStatus.

El estado de Task cambia en respuesta a ciertas acciones:

* **Task::assign.** Cuando se asigna la tarea a un estudiante, se inicia su estado al valor `to do`. 
* **Task::start.**. Cuando el estudiante comienza a trabajar en ella, el estado cambia a `wip`.
* **Task::deliver.** Una vez que la considera lista, el estado pasa a `review`.
* **Task::assess.** Cuando es calificada el nuevo estado será `assessed`.
* **Task::return.** Opcionalmente, el profesor puede devolver la tarea con comentarios para que el estudiante la corrija o la mejore. En ese caso, vuelve al estado `wip`.

Cualquier otro cambio de estado no es válido.

Así que tenemos unas transiciones (**start**, **deliver**, **assess** y **return**) que cambian los estados de Task (**assign**, realmente es como un constructor, así que no la vamos a considerar una transición).

Al modelar parece claro que TaskStatus es un ValueObject que "vive" dentro de Task:

```php
class Task
{
    /** @var TaskStatus */
    private $status;
    /** @var StudentId
    private $student;
    
    private function __construct(Student $student)
    {
        $this->status = TaskStatus::toDo();
        $this->student = $student->id();
    }
    
    public static function assign(Student $student): self
    {
        $task = new self($student)
        
        return $task;
    }
}
```

Y también parece claro que Task tiene que ocuparse de mantener su estado. Por ejemplo:

```php
class Task
{
    // ...
    
    public function deliver(): void
    {
        if (!$this->status->isWip()) {
            throw new InvalidTaskTransition('You cannot deliver a task not in wip status');
        }
        $this->status = TaskStatus::review();
    }
}
```

Es decir, una tarea puede entregarse si estaba en estado WIP, pero no en otro estado. **El límite de consistencia es la entidad Task**, de modo que otras entidades y servicios que no sean Task pueden confiar en que el status de Task será siempre consistente hagan lo que hagan con ella. La invariante que mantienen entre Task y TaskStatus es justamente esa. Y viéndolo desde fuera esta solución parece muy correcta, ya que la entidad se encarga de proteger sus invariantes.

Otra forma de considerar el problema es situarnos dentro de la entidad Task (que bien podría ser un agregado en un cierto contexto) y ver cuáles son los límites de consistencia de TaskStatus. Es cierto que Task se ocupa de mantener su status, pero eso no quiere decir el concepto que representa TaskStatus tenga que ser pasivo. Antes bien, tiene mucho sentido que sea el responsable de mantener sus invariantes en lo que respecta a esos cambios de estado. El ejemplo anterior, planteado de esta manera quedaría:

```php

class TaskStatus
{
    public function deliver(): self
    {
        if (!$this->isWip()) {
            throw new InvalidTaskStatusTransition('You cannot deliver a task not in wip status');
        }
        return TaskStatus::review();
    }
}

class Task
{
    // ...
    
    public function deliver(): void
    {
        $this->status = $this->status->deliver();
    }
}
```

Ahora TaskStatus se encarga de mantener sus invariantes como concepto, encargándose de gestionar las transiciones y liberando a Task de conocer los detalles. De este modo Task puede confiar en TaskStatus, mientras se ocupa de mantener todas las otras invariantes que le conciernan.

**TaskStatus define su propio límite de consistencia**, colaborando para que Task defina el suyo.

### Volviendo a los agregados

En código, un agregado es una entidad que contiene otras entidades y value objects. Las entidades contenidas en el agregado, a excepción de la entidad raíz, se caracterizan porque no tienen "vida" fuera del mismo, de tal modo que todo acceso ha de pasar por él.

Veámoslo con un ejemplo. Supongamos que en nuestro modelo tenemos la entidad Assessment para modelar las calificaciones que recibe un Student en las diversas actividades educativas. Pues bien, Assessment no tiene una existencia independiente de Student (no se pone una nota a "nadie", para entendernos, siempre se le pone a una estudiante), Por tanto, Assessment es una entidad agregada en Student, que es la raíz del agregado en ese contexto.

La implicación de esto es que Student tiene que tener métodos para añadir Assessments, por ejemplo, pero encargándose también de instanciarlos. Esquemáticamente podría ser algo así:

```php
class Student
{
    /** AssessmentsCollection */
    private $assessments;
    
    //...
    
    public function assess(DateTime $date, Subject $subject, Calification $calification) {
        $assessment = new Assessmemt($date, $subject, $calification);
        $this->assessment->append($assessment);
        
        $this->raise(new StudentWasAssessed($this->id, $assessment));
    }
    
    //...
}
```

Es decir: el `new` no se hace fuera de Student, sino dentro.

La razón de esto es que el agregado tiene la función de proteger las invariantes y aplicar las reglas de negocio necesarias porque estamos trabajando dentro de los límites de consistencia del agregado.

Pero, por otro lado, Las operaciones sobre un agregado deberán estar dentro de sus límites transaccionales.

Una implicación es que no se tienen repositorios para estas entidades agregadas y que su persistencia debe gestionarla el agregado. Este es lo que se quiere decir cuando se afirma que los repositorios guardan y recuperan agregados. Por tanto, los repositorios tienen que "saber" como montar un agregado con todas sus entidades.

### Límites transaccionales

Del mismo modo que los agregados (pero también las entidades y los value objects) definen límites de consistencia. Los agregados definen límites transaccionales, esto es: los cambios en un agregado se persisten en una transacción, de modo que si falla la persistencia de alguno de los elementos, falla la persistencia del agregado. Y todo eso para garantizar que se mantienen las invariantes.

Veámoslo con algunos ejemplos sencillos a partir del típico agregado Order con sus correspondientes Lines:

* Si fallase la persistencia de una sola Line, pero se mantuviesen las demás, el cliente no recibiría todos los productos que desea.
* ¿Y si fallasen todas las Lines? Nos podrían quedar Orders sin contenido.
* O tal vez, un pedido que se pasa a cobro sin entregar nada...

Y, de momento, basta por hoy, En un próximo artículo intentaremos seguir con agregados y con la lógica de los repositorios.

## Algo para leer

* [Como elegir aggregate roots](http://blog.koalite.com/2015/03/como-elegir-aggregate-roots/)
* [The aggregate](https://lostechies.com/gabrielschenker/2015/05/25/ddd-the-aggregate/)
* [How to Design & Persist Aggregates](https://khalilstemmler.com/articles/typescript-domain-driven-design/aggregate-design-persistence/)


