---
layout: post
title: Arquitectura de una aplicación PHP
categories: articles
tags: php design-principles good-practices
---

Arquitectura es el análisis y diseño de la estructura, organización de los componentes y sus relaciones en un sistema de software.

## Capas

En Arquitectura se suele hablar de capas para referirse a grandes agrupaciones de componentes relacionados entre sí por algún criterio general. A esto lo llamamos un patrón arquitectónico.

Posiblemente te sonará Modelo Vista Controlador (MVC) como patrón de arquitectura que separa los componentes en tres capas:

* **Modelo**: que se refiere al espacio de representación del problema y sus datos, incluyendo su almacenamiento y acceso.
* **Vista**: que se refiere a la presentación de la información.
* **Controlador**: que se refiere a la coordinación entre la vista y el modelo.

Otro criterio tiene que ver con el nivel de abstracción de los componentes necesarios para la resolución de problema. En ese caso podemos establecer tres niveles o capas:

* **Dominio**: que se refiere a aquello de lo que trata la aplicación.
* **Aplicación**: que se refiere a los casos de uso que la aplicación resuelve.
* **Infraestructura**: que se refiere a las implementaciones concretas necesarias para que funcione la aplicación.

Este patrón es el que, más o menos, proponen las llamadas Arquitecturas Limpias.

**Dominio** es la capa más abstracta y en algunas representaciones [se sitúa como la capa más interna](https://jeffreypalermo.com/2008/07/the-onion-architecture-part-1/), núcleo o core, de la aplicación. En el dominio se representan los elementos del problema que la aplicación trata de resolver, ya sea la organización académica de una institución educativa, ya sea la venta online de productos agrícolas o cualquier otro negocio. El dominio es aquello de lo que trata nuestra empresa o proyecto.

Cuando se dice que el dominio no cambia o cambia poco nos estamos refiriendo a él como concepto general, ya que sus componentes están evolucionando constantemente a medida que las necesidades del negocio cambian. Lo que queremos decir es que una tienda online de moda vende ropa, zapatos y complementos. Si deja de hacer eso y se dedica a la banca online es que ha cambiado el negocio y, por tanto, el dominio. 

**Aplicación** es la capa en la que se representan las intenciones que tienen los agentes interesados en nuestra aplicación (en tanto que sistema de software) y los beneficios que obtienen de la misma. Dicho de otra manera: en esta capa se representa la interacción de esos interesados con los elementos que están en el dominio, de tal modo que es éste el que define los límites de esa interacción en forma de reglas de dominio: lo que es posible y lo que no.

Por ejemplo, es un sistema de banca no podrías retirar dinero de una cajero si no tienes fondos en tu cuenta o si has superado el limite de disposición de tu tarjeta.

Por último, la capa de **infraestructura**. En esta capa se encuentran implementaciones concretas de soluciones tecnológicas a las necesidades de la aplicación. Por ejemplo, la aplicación podría necesitar persistencia de los datos, la cual puede lograrse mediante muchos sistemas diferentes como archivos de texto, bases de datos, relacionales o no, o un medio de almacenamiento en la nube. Lo mismo podríamos decir del mecanismo de distribución, que podría ser una aplicación web, una aplicación nativa, una API, entre otras posibilidades.

En la capa de infraestructura podríamos cambiar componentes concretos para utilizar otras tecnologías que los implementen y que, en un momento dado, sean más convenientes o eficaces. Como veremos después, los componentes de esta capa deberían poderse sustituir por otros equivalentes sin que las otras capas tuviesen que cambiar ni una línea de código (en la práctica sí que habría que cambiar detalles de configuración).

## Manifestación física de la arquitectura

La estructura lógica suele tener su manifestación física en la organización de las carpetas y archivos de nuestro proyecto, pero hay que recordar que esta disposición no es la arquitectura, sino una consecuencia de ella.

Así, inicialmente un proyecto de software podría organizarse en estas carpetas:

```
project
   /config
   /src
   /tests
   /vendor
```

Las carpetas que se corresponden con las capas de nuestra arquitectura irían dentro de la carpeta `src`:

```
project
   /config
   /src
       /domain
       /application
       /infrastructure
   /tests
   /vendor
```

Igualmente, puede ser buena práctica mimetizar la estructura de `src` en la carpeta `tests`.

```
project
   /config
   /src
       /domain
       /application
       /infrastructure
   /tests
       /domain
       /application
       /infrastructure
   /vendor
```

En este punto me gustaría hacer un inciso porque me he encontrado a veces con la discusión de si la infraestructura se testea o no. Mi opinión es que hay que distinguir entre:

* La infrastructura como componentes de terceras partes que no poseemos, que se suelen alojar en la carpeta de vendor y, por tanto, no testeamos.
* El código que desarrollamos nosotros para adaptar esos componentes de terceros y utilizarlos en nuestra aplicación para responder a nuestras propias interfaces. Este código sí debemos testearlo, para lo cual haremos dobles de aquellos componentes.

Otro inciso tiene que ver con la carpeta tests. Los diversos niveles de la pirámide de tests deberían estar representados también en ella:

```
project
   /config
   /src
       /domain
       /application
       /infrastructure
   /tests
       /acceptance
       /integration
           /application
       /unit
           /domain
           /application
           /infrastructure
   /vendor
```

Dejaré la discusión sobre la carpeta de tests para un artículo futuro, porque tiene su miga pero desvía nuestro foco del objetivo de este artículo.

## Ley de dependencia

Las capas se relacionan entre sí usando componentes de las otras lo que establece una relación de dependencia entre ellas. Decimos esto porque un elemento no funcionará si no dispone de otro del cual depende.

Estas dependencias deben establecerse de una manera específica para tener una arquitectura sólida y sostenible. A esa manera la llamamos **ley de dependencia**. Según esta ley, la dirección de la dependencia va de las capas menos abstractas a las más abstractas y nunca puede ir en sentido contrario. 

La razón es simple. La capa más abstracta es la de dominio, que representa el problema que resuelve la aplicación y que es aquello que la hace única e irremplazable. Si depende de una tecnología concreta que no está bajo nuestro control y ésta falla o desaparece algún día nos veríamos en una situación crítica. Esta es la gran aportación del Domain Driven Design: el núcleo de nuestra aplicación y lo que guíe su desarrollo es el negocio o dominio del que se ocupa, mientras que las tecnologías concretas que sean necesarias para hacerla funcionar son detalles de implementación que no deberían condicionar en modo alguno la forma en que resolvemos nuestro problema.

Tanto es así que la capa de dominio debería poder servir sin ningún cambio para una aplicación web, una de escritorio, una móvil, para acceder mediante API o cualquier otro mecanismo que se nos ocurra.

Esto quiere decir que la capa de dominio no puede depender de la de aplicación o de la de infraestructura. De hecho, la única dependencia que puede tener la capa de dominio es el propio lenguaje de programación. En otras palabras, la capa de dominio no utiliza nada de las otras capas.

La capa de aplicación tendrá dependencias de la capa de dominio, pues utiliza los elementos del dominio para lograr sus objetivos, pero no puede tener dependencias en elementos de infraestructura.

Finalmente, la capa de infraestructura tendrá dependencias en la capa de dominio y de aplicación que normalmente serán en forma de interfaces, en aplicación del principio de inversión de dependencias.

Las capas de orden superior definen mediante Interfaces cómo quieren usar los componentes de las capas de orden inferior. Esto permite a la capa de orden superior usar un componente sin tener ningún conocimiento de cómo está implementado, mientras que el componente utilizado debe adaptarse a lo especificado por la capa de nivel superior.

Este principio está en la base de la llamada [Arquitectura Hexagonal, o Ports and Adapters](http://alistair.cockburn.us/Hexagonal+architecture), aunque [llamarla arquitectura podría ser un poco exagerado](http://www.javiervelezreyes.com/ni-nueva-ni-arquitectura-ni-hexagonal/). La capa de dominio define un puerto (interfaz) y en la infraestructura se crea un adaptador que puede interactuar con ese puerto.

Por ejemplo, cuando la capa de aplicación guarda un objeto de dominio en un repositorio, solo sabe que el repositorio es el lugar en el que puede guardar objetos de dominio y no debe haber ninguna diferencia debida al mecanismo concreto de persistencia que se vaya a utilizar, así como ninguna consideración o detalle de tal mecanismo debe influenciar en nada lo que ocurre en esta capa.

## ¿Qué va en cada capa?

### Dominio

**Entidades**. Posiblemente el elemento más característico del dominio sean las entidades. Las entidades representan elementos del problema que tienen identidad permanente durante todo su ciclo de vida. Esto quiere decir que pueden existir diversos objetos del mismo tipo que son diferentes porque tienen distinta identidad.

En una escuela, los alumnos se representan con entidades y aunque todos sus valores fuesen iguales, dos alumnos serán distintos por el hecho de tener diferentes identidades. No son intercambiables.

```php
class Student
{
    public function __construct(
        Id $id, 
        PersonName $name, 
        Person $parent, 
        DateTimeInterface $birthDate
    ) {
    ...
    }
}
```

Normalmente, modelamos la identidad mediante un identificador único (Id). En el mundo real es difícil definir el propio concepto de identidad, pero la podemos representar con un atributo que haga única a cada instancia de una Entidad.

```php

$mikeStudent = new Student(
    new Id(101),
    new PersonName('Mike', 'Stevens'),
    new Person(new PersonName('Ananías', 'Malcovich')),
    new DateTimeImmutable('2001-07-12')
);

$erikaStudent = new Student(
    new Id(149),
    new PersonName('Erika', 'Smith'),
    new Person(new PersonName('Ananías', 'Malcovich')),
    new DateTimeImmutable('2013-03-05')
);
```

**Value Objects**. Los Value Objects representan conceptos relevantes del dominio que no tienen identidad y nos interesan por su valor, por lo que su igualdad se basa en éste. Una consecuencia de ello es que los Value Objects son intercambiables entre sí y reutilizables. No se puede decir que tengan un ciclo de vida.

Siguiendo con nuestro ejemplo escolar, las calificaciones se pueden modelar como Value Objects:

```php
class Calification
{
    private $value;
    
    public function __construct(int $value)
}
```

**Agregados**. Los agregados son entidades compuestas por otras entidades y value objects formando unidades significativas.

**Reglas de dominio**. Las entidades de dominio representan elementos del mundo real que tienen comportamientos e interaccionan conforme a una serie de reglas. Estas reglas y comportamientos se representan en el código de diferentes maneras.

Por ejemplo, una regla general aplicable a cualquier dominio es que todas las entidades deben tener identidad, así que en el momento de su creación debe asignársele.

En dominios concretos, las entidades deberán crearse conforme a reglas específicos. 

Por ejemplo, los alumnos de un centro escolar deben matricularse con nombre, apellidos y fecha de nacimiento (entre otros muchos datos) y esa regla se representa haciendo que el objeto necesite ser creado con esos valores desde el principio, lo cual se hace definiendo un constructor (o, en su caso, [un sistema de construcción](/object_creation/)) que nos obligue a ello.

```php
class Student
{
    public function __construct(
        Id $id, 
        PersonName $name, 
        Person $parent, 
        DateTimeInterface $birthDate
    ) {
    ...
    }
}
```

Otro ejemplo es que un alumno menor de edad debe ser representado por, al menos, una persona adulta, así que el sistema de construcción deberá obligarnos a aportar la información pertinente de un adulto. Opcionalmente, nos permitirá añadir información de otras personas.

**Especificaciones**. Podemos usar el patrón Specification para definir ciertas reglas de dominio con las que seleccionar o clasificar entidades, verificando que cumplen ciertas condiciones.

**Servicios de dominio**. Cuando las reglas o comportamientos del domino no pueden representarse completamente en una entidad, o cuando no podemos asignar la responsabilidad a una de las entidades, son necesarios los servicios de dominio. Los servicios de dominio coordinan el comportamiento de dos o más entidades para realizar una tarea.

**Eventos de dominio**. Los eventos de dominio son mensajes nos indican cosas que han sucedido en el dominio y que pueden ser interesantes para otras partes de la aplicación.

### Capa de Aplicación

**Use cases**. Los Use Cases representan las acciones que los interesados en el software querrían realizar con él. Los Use Cases utilizan los objetos del dominio para ejecutar estas acciones de manera significativa para los usuarios del software.

**Servicios de Aplicación**. Los Use Cases fundamentalmente orquestan la interacción entre objetos del dominio para realizar su tarea. En ocasiones, esa interacción es compleja y conlleva varias responsabilidades, que se encapsulan en una diversidad de Servicios de Aplicación. De este modo, el Use Case actúa como orquestador de los distintos servicios.

**Objetos de transporte de datos**. En este grupo incluyo diversos tipos de objetos que nos permiten mover información entre diversas capas o sistemas. Aquí encontramos, por ejemplo:

* **DTOs**, que son objetos sencillos con los que podemos comunicarnos con sistemas externos o dependencias de terceras partes, permitiéndonos representar nuestros objetos de una forma que éstos pueden entender y también manejar lo que nos entregan.
* **Requests**, son objetos inmutables que utilizamos para encapsular los parámetros con los que llamamos a los Use Cases y Servicios.

**Eventos de aplicación**. Al igual que los eventos de dominio, son mensajes que representan cosas interesantes que han pasado en el nivel de la aplicación.

**Bus de mensajes**, el bus de mensajes es el que se encarga de enviar los eventos y, en su caso, las peticiones o requests a los objetos que pueden gestionarlos. El uso de un bus de mensajes nos permite actúar de forma desacoplada cuando ocurre algo (evento) que interesa a muchas otras partes de la aplicación.

### Capa de Infraestructura

En la capa de infraestructura se disponen las implementaciones concretas de las interfaces que hemos definido en las otras capas.

Principalmente se tratará de adaptadores que hagan esa implementación mediante el uso de los componentes de terceras partes.

Ya hemos comentado el ejemplo del repositorio que se define en el dominio y es implementado en la infraestructura. De hecho, diferentes servicios de la aplicación podrían utilizar distintas implementaciones del mismo repositorio. Por ejemplo, un servicio para recuperar una entidad cuyos datos están en una base de datos podría utilizar un repositorio implementado mediante algún ORM (por ejemplo, Doctrine), mientras que otro servicio podría acceder a la misma base de datos mediante DBAL para ejecutar una operación en la que se modifican miles de registros.

```
class DoctrineStudentRepository implements StudentRepository
{
    private $entityManager;
    
    public function __construct(EntityManager $entityManager)
    {
        $this->entityManager = $entityManager;
    }
    
    //...
}


class DBalStudentRepository implements StudentRepository
{
    private $queryBuilder;
    
    public function __construct(QueryBuilder $queryBuilder)
    {
        $this->queryBuilder = $queryBuilder;
    }
    
    //...
}
```


### Dependencias externas

El término dependencia hace referencia al caso en que una determinada unidad de software utiliza otras unidades de software para realizar sus tareas.

Sin embargo, dentro de un proyecto de desarrollo tendríamos que hablar de diferentes tipos de dependencias:

* Por un lado, están las **dependencias que se establecen entre objetos y sus colaboradores**, en cuyo caso debemos respetar la ley de dependencia.
* Por otro lado, están las **dependencias en formas de paquetes o bibliotecas de terceras partes** (vendors) que nos proporcionan componentes de software que podemos utilizar. Y aquí hay que analizar los diferentes casos.

Así, por ejemplo, una cierta estructura de datos desarrollada por una tercera parte, como puede ser la ArrayCollection de Doctrine, puede utilizarse en la capa de dominio de nuestra aplicación sin ningún problema. Opcionalmente podríamos aplicar el patrón Adapter para invertir la dependencia, aunque en este caso puede ser sobre-ingeniería.

En otros casos, el paquete de tercero nos proporciona una implementación concreta de una funcionalidad que necesitamos a nivel de infraestructura, como puede ser acceso a un mecanismo de persistencia, a un sistema de colas, etc, etc. En tal situación, es obligatorio utilizar el patrón Adapter para no depender de ese mecanismo concreto.

Como vimos al principio del artículo, las dependencias externas están fuera de la carpeta `src` y se ubican en una carpeta `vendor`. En PHP gestionamos habitualmente estas dependencias mediante [composer](https://getcomposer.org).

```
project
   /config
   /src
   /tests
   /vendor
```

## Cómo se organizan las carpetas

Es bastante habitual ver que las distintas carpetas se organizan mediante categorías técnicas, más o menos así:

```
project
   /config
   /src
       /domain
           /entity
           /valueobject
           /event
           /repository
       /application
           /dto
           /request
           /usecase
           /service
       /infrastructure
   /tests
   /vendor
```

Sin embargo, cada vez me convenzo más de que es una mala organización. Me explico con un ejemplo:

```
project
   /config
   /src
       /domain
           /entity
               Student
               Teacher
               Course
               Task
           /valueobject
               Level
               Stage
               Assessment
           /event
               StudentWasAssignedToCourse
               TaskWasCalificatedForStudent
               StudentWasPromoted
               StudentWasRegistered
               TeacherWasAssignedToClass
           /repository
               StudentRepository
               TeacherRepository
               TaskReposotory
               CalificationRespository
           /service
               AssignTaskToStudent
       /application
           /dto
           /request
           /usecase
           /service
       /infrastructure
   /tests
   /vendor
```

Los elementos técnicos se cuelan en el dominio y no debería ser así. El dominio debería organizarse de un modo que tenga sentido para el dominio, de modo que incluso una persona no desarrolladora pueda gestionar esta organización. Algo más en esta línea:

```
project
   /config
   /src
       /domain
           /Assessment
               Assessment
               AssessTaskForStudent
               /event
                   TaskWasAssessedForStudent
           /Student
               Student
               StudentRepository
               /event
                    StudentWasPromoted
                    StudentWasRegistered
           /Teacher
               Teacher
               TeacherRepository
               /event
                    TeacherWasAssignedToClass
           /Course
               Course
               CourseRepository
               Level
               Stage
           /Task
               AssignTaskToStudent
               Task
               TaskRespository
       /application
           /dto
           /request
           /usecase
           /service
       /infrastructure
   /tests
   /vendor
```

Para lo cual aplicamos el principio de Covariación:


### Principio de covariación

Una de las preguntas que nos hacemos con frecuencia es ¿dónde va cada unidad de software en esta estructura? Es relativamente fácil situar los elementos en las grandes capas, pero ¿cómo organizarlos dentro de cada una de ellas? El principio de covariación nos puede ayudar a hacerlo.

Este principio podría enunciarse de una manera muy simple: las cosas que cambian juntas deben estar juntas.

Por eso, en nuestro ejemplo, hemos puesto los diversos elementos agrupados en aspectos concretos del dominio que están estrechamente relacionados. Podemos considerarlos subdominios de la aplicación o, en terminología DDD, podríamos estar hablando de Contextos Acotados (bounded contexts).

Dentro de estos subdominios podemos realizar agrupaciones para que todo sea más manejable. Una carpeta eventos puede tener sentido ya que evento es tanto un término de dominio, en cuanto a que representa algo que sucede en el dominio, como técnico en tanto que un evento es un objeto que contiene información sobre algo que ha pasado y cuándo ha sucedido.

### Organización de la carpeta de aplicación

El mismo principio de covariación es aplicable aquí. En un primer nivel parece buena idea aplicar la misma organización en subdominios:

```
project
   /config
   /src
       /domain
           /Assessment
           /Student
           /Teacher
           /Course
           /Task
       /application
           /Assessment
           /Student
           /Teacher
           /Course
           /Task
       /infrastructure
   /tests
   /vendor
```

Y dentro de ellos, articularlo todo en base a los Use Cases, que es como decir, en base a las intenciones de los interesados en la funcionalidad de la aplicación.

```
project
   /config
   /src
       /domain
           /Assessment
           /Student
           /Teacher
           /Course
           /Task
       /application
           /Assessment
               /AssessATask
                   AssessATask
                   AssessATaskRequest
                   TaskDto
                   GetTaskRequest
                   GetTaskService
           /Student
               /RegisterNewStudent
                   RegisterNewStudent
                   RegisterNewStudentRequest
               /GetStudentsInCourse
                   GetStudentsInCourse
                   GetStudentsInCourseRequest
           /Teacher
           /Course
           /Task
       /infrastructure
   /tests
   /vendor
```

### Organización de la carpeta de infraestructura

La carpeta de infraestructura se organiza a partir de criterios técnicos, algo así como:

```
project
   /config
   /src
       /domain
       /application
       /infrastructure
           /Messaging
               /MessageBus
           /Delivery
               /Web
               /Api
           /Persistence
               /Doctrine
               /Dbal
   /tests
   /vendor
```

La ramificación posterior podemos hacerla también aplicando el principio de covariación, lo que seguramente hará que organicemos los archivos creando carpetas que representen aquellas partes del dominio que están se están implementando con la ayuda de esos componentes.

## Para terminar

En resumen, la arquitectura de una aplicación puede articularse mediante diversos criterios y principios. En este artículo hemos explorado los niveles de abstracción, la ley de dependencia y el principio de covariación, para diseñar una arquitectura sostenible, así como su reflejo en la estructura de carpetas del proyecto.

