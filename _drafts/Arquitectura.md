---
layout: post
title: Arquitectura
categories: articles
tags: php design-principles good-practices
---

Arquitectura es el análisis y diseño de la estructura, componentes y sus relaciones en un sistema de software.

## Capas

En Arquitectura se suele hablar de capas para referirse a agrupaciones de componentes relacionados por algún criterio general. El conjunto de capas y los criterios para asignar componentes a cada una de ellas entenderlo como un patrón arquitectónico.

Posiblemente te sonará Modelo Vista Controlador (MVC) como patrón de arquitectura que separa los componentes en tres capas:

* Modelo: que se refiere al espacio de representación del problema y los datos.
* Vista: que se refiere a la presentación de la información.
* Controlador: que se refiere a la coordinación entre la vista y el modelo.

Otro criterio tiene que ver con el nivel de abstracción de los componentes necesarios para la resolución de problema. En ese caso podemos establecer tres niveles o capas:

* Dominio
* Aplicación
* Infraestructura

Este patrón es el que, más o menos, proponen las llamadas Arquitecturas Limpias.

**Dominio** es la capa más abstracta y en algunas representaciones se sitúa como la capa más interna, núcleo o core, de la aplicación. En el dominio se representan los elementos del problema que la aplicación trata de resolver, ya sea la organización académica de una institución educativa, ya sea la venta online de productos agrícolas. El dominio es aquello de lo que trata nuestra empresa o proyecto.

Cuando se dice que el dominio no cambia o cambia poco nos estamos refiriendo a él como concepto general, ya que sus componentes están evolucionando constantemente a medida que las necesidades del negocio cambian. Lo que queremos decir es que una tienda online de moda vende ropa, zapatos, complementos y eso no cambia o cambia muy poco a poco.

**Aplicación** es la capa en la que se representan las intenciones que tienen y los beneficios que obtienen los agentes interesados en nuestra aplicación (en el sentido de programa). Dicho de otra manera: en esta capa se representa la interacción de esos interesados con los elementos que están en el dominio, de tal modo que es éste el que define los límites de esa interacción (reglas de dominio): lo que puede y no puede hacerse.

Por último, la capa de **infraestructura**. En esta capa se encuentran implementaciones concretas de soluciones tecnológicas a las necesidades de la aplicación. Por ejemplo, la aplicación podría necesitar persistencia de los datos, la cual puede lograrse mediante muchos sistemas diferentes como archivos de texto, bases de datos relacionales o no, o un medio de almacenamiento en la nube. Lo mismo podríamos decir del mecanismo de distribución, que podría ser una aplicación web, una aplicación nativa, una API, entre otras posibilidades.

También se suele decir que en la capa de infraestructura podríamos cambiar componentes concretos para utilizar otras tecnologías que los implementen. Como veremos después, los componentes de esta capa deberían poderse sustituir por otros equivalentes sin que las otras capas tuviesen que cambiar ni una línea de código (bueno, alguna de configuración sí que habría que cambiar).

La estructura lógica suele tener su manifestación física en la organización de las carpetas y archivos de nuestro proyecto, pero debemos recordar que esa disposición física no es la arquitectura.

## Ley de dependencia

Las capas se relacionan entre sí usando componentes de las otras capas. Deben hacerlo de una forma específica para tener una arquitectura sólida y sostenible, a la que llamamos ley de dependencia. Según esta ley, la dirección de la dependencia va de las capas menos abstractas a las más abstractas y nunca puede ir en sentido contrario. 

Esto quiere decir que la capa de dominio no depende de la de aplicación o de la de infraestructura. De hecho, la única dependencia que puede tener la capa de dominio es el propio lenguaje de programación. En otras palabras, la capa de dominio no utiliza nada de las otras capas.

La capa de aplicación tendrá dependencias de la capa de dominio, no en vano utiliza los elementos del dominio para lograr sus objetivos, pero no puede tener dependencias en elementos de infraestructura.

Finalmente, la capa de infraestructura tendrá dependencias en la capa de dominio y de aplicación.

Pero, en muchas ocasiones veremos que una capa necesita usar realmente elementos de una capa menos abstracta. En este caso aplicamos el Principio de Inversión de Dependencias de modo que las capas de orden superior defina mediante Interfaces cómo quieren usar los componentes de las capas de orden inferior. Esto permite a la capa de orden superior usar un componente sin tener ningún conocimiento de cómo está implementado, mientras que el componente utilizado debe adaptarse a lo especificado por la capa de nivel superior.

Este principio está en la base de la llamada [Arquitectura Hexagonal, o Ports and Adapters](http://alistair.cockburn.us/Hexagonal+architecture), aunque [llamarla arquitectura podría ser un poco exagerado](http://www.javiervelezreyes.com/ni-nueva-ni-arquitectura-ni-hexagonal/). La capa de dominio define un puerto (interfaz) y en la infraestructura se crea un adaptador que puede interactuar con ese puerto.

Por ejemplo, cuando la capa de aplicación guarda un objeto de dominio en un repositorio, sólo sabe que el repositorio es el lugar en el que puede guardar objetos de dominio y no debe haber ninguna diferencia entre el mecanismo concreto de persistencia que se vaya a utilizar, así como ninguna consideración o detalle de tal mecanismo debe influenciar en nada lo que ocurre en esta capa.

## ¿Qué va en cada capa?

### Dominio

**Entidades**. Posiblemente el elemento más característico del dominio sean las entidades. Las entidades representan elementos del problema que tienen identidad permanente durante todo su ciclo de vida. Esto quiere decir que pueden existir diversos objetos del mismo tipo que son diferente porque tienen distinta identidad.

En una escuela, los alumnos se representan con entidades y aunque todos sus valores fuesen iguales, dos alumnos serán distintos por el hecho de tener diferentes identidades. No son intercambiables.

Normalmente, modelamos la identidad mediante un identificador único (Id), aunque en el mundo real pueda resultar difícil definir el propio concepto de identidad.

**Value Objects**. Los Value Objects son conceptos o elementos del dominio que no tienen identidad, por lo que su igualdad se basa en sus valores.

La consecuencia de esto es que los Value Objects son intercambiables entre sí y reutilizables. Tampoco se puede decir que tengan un ciclo de vida.

**Agregados**. Los agregados son entidades compuestas por otras entidades y value objects formando unidades significativas.

**Reglas de dominio**. Las entidades de dominio representan elementos del mundo real que tienen comportamientos e interaccionan conforme a una seri de reglas. Estas reglas y comportamientos se representan en el código de diferentes maneras.

Por ejemplo, una regla general aplicable a cualquier dominio es que todas las entidades deben tener identidad, así que en el momento de su creación debe asignársele.

En dominios concretos, las entidades deberán crearse conforme a reglas específicos. 

Por ejemplo, los alumnos de un centro escolar deben matricularse con nombre, apellidos y fecha de nacimiento (entre otros muchos datos) y esa regla se representa haciendo que el objeto necesite ser creado con esos valores desde el principio, lo cual se hace definiendo un constructor (o, en su caso, [un sistema de construcción](/object_creation/)) que nos obligue a ello.

Otro ejemplo es que un alumno menor de edad debe ser representado por, al menos, una persona adulta, así que el sistema de construcción deberá obligarnos a aportar la información pertinente de un adulto. Opcionalmente, nos permitirá añadir información de otras personas.

**Especificaciones**. Podemos usar el patrón Specification para definir ciertas reglas de dominio para seleccionar o clasificar entidades.

**Servicios de dominio**. Cuando las reglas o comportamientos del domino no pueden representarse completamente en una entidad son necesarios los servicios de dominio.

**Eventos de dominio**. Los eventos de dominio nos indican cosas que han sucedido

### Capa de Aplicación

**Use cases**. Los Use Cases representan las acciones que los interesados en el software querrían realizar con él. Los Use Cases utilizan los objetos del dominio para ejecutar estas acciones de manera significativa para los usuarios del software.

**Servicios de Aplicación**. Los Use Cases fundamentalmente orquestan la interacción entre objetos del dominio para realizar su tarea. En ocasiones, esa interacción es compleja y conlleva varias responsabilidades, que se encapsulan en una diversidad de Servicios de Aplicación.

### Capa de Infraestructura

En la capa de infraestructura se disponen las implementaciones concretas.

### Dependencias externas

El término dependencia hace referencia al caso en que una determinada unidad de software utiliza otras unidades de software para realizar sus tareas.

Sin embargo, dentro de un proyecto de desarrollo tendríamos que hablar de diferentes tipos de dependencias:

* Por un lado, están las dependencias que se establecen entre objetos y sus colaboradores, en cuyo caso debemos respetar la ley de dependencia.
* Por otro lado, están las dependencias en formas de paquetes o bibliotecas de terceras partes (vendor) que nos proporcionan componentes de software que podemos utilizar. Y aquí hay que analizar los diferentes casos.

Así, por ejemplo, una cierta estructura de datos desarrollada por una tercera parte, como puede ser la ArrayCollection de Doctrine, puede utilizarse en la capa de dominio de nuestra aplicación sin ningún problema. Opcionalmente podríamos aplicar el patrón Adapter para invertir la dependencia, aunque en este caso puede ser sobre-ingeniería.

En otros casos, el paquete de tercero nos proporciona una implementación concreta de una funcionalidad que necesitamos a nivel de infraestructura, como puede ser acceso a un mecanismo de persistencia, a un sistema de colas, etc, etc. En tal situación, es obligatorio utilizar el patrón Adapter para no depender de ese mecanismo concreto. 

## Principio de covariación

Una de las preguntas que nos hacemos con frecuencia es ¿dónde va cada unidad de software en esta estructura? Es relativamente fácil situar los elementos en las grandes capas, pero ¿cómo organizarlos dentro de cada una de ellas? El principio de covariación nos puede ayudar a hacerlo.

Este principio podría enunciarse de una manera muy simple: las cosas que cambian juntas, deben estar juntas.
