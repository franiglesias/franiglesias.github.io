---
layout: post
title: DDD no es lo que te han contado
categories: articles
tags: good-practices design-principles ddd
---

Acabo de leerme, por fin, **El Libro** sobre *Domain Driven Design* de Eric Evans. Después de mucho tiempo leyendo de segunda mano sobre el tema, mi conclusión es: DDD no es exactamente lo que nos han contado.

Por alguna razón las referencias que había escuchado sobre el libro eran bastante negativas. Y es una pena porque he ido posponiendo su lectura más de lo debido, aunque también es verdad que he priorizado otros que tenía más accesibles. Pero, en resumen: el libro me ha gustado mucho y el contenido me ha ayudado a darle sentido a muchas cosas.

En parte puedo entender la visión "negativa" del libro, ya que no es un libro técnico al uso.

Empecemos por ahí, El *Blue Book del DDD* no es un libro que te proporcione recetas sobre cómo implementar cosas, sino que trata principalmente acerca de **cómo pensar y cómo conversar acerca dominio**, el espacio del problema, y cómo iniciar y desarrollar el diseño del modelo como espacio de solución. Con todo, es un libro eminentemente práctico que ofrece una sistemática de análisis y de diseño, estructurada en temas para los cuales ofrece una completo abanico de estrategias y patrones de actuación.

Como reza el subtítulo, Domain Driven Design trata sobre *cómo afrontar la complejidad en el corazón del software*. 

A lo largo del libro encontrarás muy poco código, apenas unos ejemplos para ilustrar algún punto, pero sí muchos diagramas para ver cómo se plantean los modelos para los distintos casos y cómo pueden evolucionar ante los cambios del dominio. También una buena muestra de conversaciones y mucho contexto para entender los ejemplos que ilustran los distintos temas.

Porque el DDD trata principalmente de eso: de **conversaciones, contextos y modelos** para entender el problema del dominio y poder desarrollar una solución.

Sin embargo, es frecuente que se hable de DDD asociado a tecnologías o implementaciones concretas: microservicios, CQRS, Event Sourcing o Arquitectura Hexagonal, como si uno implicase las otras. También es frecuente que se insista en los patrones tácticos, los que tienen que ver con la implementación, y no los estratégicos, los que tienen que ver con el diseño, que es de lo que trata el *Blue Book*.

Así, diría que es más popular y conocido el *Red Book*, [Implementing Domain Driven Design](https://www.amazon.es/Implementing-Domain-Driven-Design-Vaughn-Vernon/dp/0321834577), el libro de Vaughn Vernon. Entiendo que es porque es el que explica el cómo hacer, o sea, el que trata de los patrones tácticos. El libro de recetas, por decirlo así. Yo no me he leído el *Red Book* entero, sino que de momento lo he estado usando como referencia para temas específicos, pero mucha gente se ha leído este y no el de Evans y creo que es un error.

Además, posteriormente el mismo Vaughn Vernon publicó el *Green Book*, [Domain Driven Design Distilled](https://www.amazon.es/Domain-Driven-Design-Distilled-Vaughn-Vernon/dp/0134434420) que hay quien considera como un buen libro de introducción al DDD. En este discrepo por completo. El *Distilled* es un buen índice para el *Red Book*, pero no aprenderás Domain Driven Design con él.

Posiblemente sea mejor introducción [Domain-Driven Design Reference: Definitions and Pattern Summaries](https://www.amazon.es/Domain-Driven-Design-Reference-Definitions-Summaries/dp/1457501198/) de Evans, de cuya existencia me acabo de enterar porque soy así de espabilado.

La insistencia en los patrones tácticos tiene su aspecto positivo. No dejan de ser buenas prácticas, pero no son exclusivas de DDD, ni mucho menos. De hecho, una de las confusiones más típicas del DDD es con la Arquitectura Hexagonal. Lo que se suele conocer humorísticamente como "directory driven development".

## DDD y Arquitectura Hexagonal

La Arquitectura Hexagonal y, en general, las arquitecturas limpias son perfectamente compatibles con Domain Driven Design. Esto es así por dos razones:

* La separación en capas, con el dominio en el centro.
* Las reglas de dependencia, con todas las dependencias apuntando hacia adentro, de modo que dominio no tiene dependencias.

Pero **no hay nada que diga que la Arquitectura Hexagonal ES la arquitectura propia de una aplicación DDD**. De hecho, la Arquitectura Hexagonal es una aplicación del principio de Inversión de Dependencias y sus prácticas asociadas, más que una arquitectura.

En cualquier caso, estructuramos el código en torno a tres carpetas/capas: dominio, aplicación e infraestructura. Pero esto por sí solo no es DDD.

La razón de que esto funcione es que el DDD pide que el modelo de dominio esté representado en código mediante objetos puros del lenguaje, completamente aislados de cualquier detalle técnico como la persistencia. Es decir los llamados *building blocks* (las entidades, los value objects, los domain events o los servicios) no pueden diseñarse pensando en cómo van a ser persistidos o comunicados en una API, por poner un ejemplo, sino que deben diseñarse como si siempre estuviesen viviendo en memoria.

Pero, como resulta bastante evidente, necesitamos un mecanismo de persistencia de las entidades y agregados, aunque solo sea por pura necesidad técnica.

## DDD y Bases de Datos

El concepto que se encarga de la persistencia en DDD es el de Repositorio, un lugar en el que guardar u obtener entidades (voy a hablar de entidades y agregados indistintamente). Desde el punto de vista del dominio un repositorio es un simple almacenamiento en memoria con el cual puedo:

* Guardar entidades
* Obtener entidades conociendo su identidad
* Obtener subconjuntos de entidades que cumplan una especificación

En un mundo ideal, la interfaz de un Repositorio solo tiene tres métodos:

* store
* retrieve(id)
* findSatisfying(specification)

Para poder hacer el repositorio independiente de implementación aplicamos el principio de inversión de dependencias y en la capa de dominio tenemos una RepositoryInterface, de modo que no nos acoplamos a la tecnología concreta de persistencia. 

Esto sigue siendo una buena práctica en términos generales que no es exclusiva del DDD. Lo que sí es propio es el concepto de repositorio como un simple almacén en memoria de entidades y que no puede contener ninguna regla o invariante de negocio. La idea de que un repositorio tenga métodos que son, de hecho, reglas de negocio es una mala práctica.

En este sentido el patrón Specification, definido por [Fowler y Evans](http://www.martinfowler.com/apsupp/spec.pdf), es el camino a seguir.

### DDD y noSQL

Siempre **desde el punto de vista del dominio**, las bases de datos noSQL serían las que mejor encajan en el concepto de Repositorio. Al fin y al cabo, es relativamente fácil serializar una entidad, por compleja que sea, para persistirla como documento y recuperarla a partir de una clave.

Sí, hay un montón de objeciones técnicas y válidas a esta afirmación: rendimiento, estabilidad, problemas para la gestión de relaciones y un largo etcétera. 

### DDD y ORM

En cambio, los ORM, desde el mismo punto de vista, son poco adecuados. Las entidades en el contexto del ORM no son entidades DDD. [Matthias Noback recomienda olvidarse del ORM cuando estemos diseñando entidades](https://matthiasnoback.nl/2018/06/doctrine-orm-and-ddd-aggregates/) porque el funcionamiento del ORM va a interferir con su adecuado diseño. En su lugar, lo que recomienda es simplificar, incluso usando variables privadas en las entidades únicamente con la finalidad de su almacenamiento en la BD e incluso reconstruyendo objetos al vuelo a partir de primitivas.

Todo para mantener Entidades DDD ricas y evitar los modelos anémicos característicos de los enfoques Database-first.

## DDD y CQRS

[Command Query Responsibility Segregation](https://martinfowler.com/bliki/CQRS.html) es otro de esos patrones que se asocia habitualmente con DDD. En parte porque también se relaciona estrechamente con *Event Sourcing*, cosa que tiene sentido.

Simplificando mucho CQRS consiste en la aplicación *extrema* del CQS (Command Query Segregation) a los modelos de datos. 

CQS dice que una función o método ha de ser un comando, que provoca un efecto en el sistema sin obtener información del mismo, o una query, que recupera información de un sistema sin provocar ningún efecto en él.

En la interfaz de repositorio de la que hablamos más arriba, se asume que solo existe un objeto repositorio que gestiona tanto la lectura como la escritura, aunque cada método tiene su propia responsabilidad.

Sin embargo, CQRS separa las operaciones de lectura y escritura en modelos diferentes. De modo que pueden implementarse incluso con tecnologías distintas. Su "reverso tenebroso" es la consistencia: ¿cómo mantenemos consistente la información que se escribe con la que se lee? 

Para esto se introduce la noción de *consistencia eventual* que, explicado muy básicamente, significa que la información acabará por ser consistente en algún momento próximo, cuando el proceso que actualiza los modelos de lectura haya podido realizar todos los cambios recogidos por el modelo de escritura.

Una de las estrategias para lograr esto es justamente mediante eventos que indiquen los cambios, de modo que los modelos de lectura se actualizan como respuesta a esos eventos.

Pero, CQRS es fundamentalmente un patrón de implementación de una solución de persistencia que puede funcionar bien para entornos que requieren un alto rendimiento, y que añade una complejidad excesiva para una gran mayoría de aplicaciones. De nuevo, no hay nada en DDD que implique que CQRS sea un patrón propio, aunque una aplicación diseñada con metodología DDD puede implementar una solución de persistencia CQRS.

## Event Sourcing y DDD

*Event sourcing* es un enfoque que también se asocia frecuentemente a CQRS y a DDD. Debe ser porque en DDD hablamos de los Eventos de Dominio y un evento es un evento es un evento…. Sí, tiene sentido esta asociación, pero Event Sourcing no es para todo el mundo y tampoco es un patrón que derive del enfoque DDD. Sencillamente, lo que ocurre es que encaja bien.

La idea del *Event Sourcing* es la siguiente: En un sistema de software tradicional el estado del sistema, o concretamente el estado de una entidad, como podría ser el expediente académico de un alumno, nos habla de su estado en el momento de la consulta, pero no nos dice nada de cómo se ha llegado hasta él, o si ha habido algún tipo de cambio en un período de tiempo. Tradicionalmente, si nos interesa guardar la historia, como en este caso, se guarda explícitamente. Por eso el expediente académico guarda registros de todos los cursos por los que ha pasado el alumno.

Ahora bien, ¿qué pasa si en vez de "actualizar" el estado cada vez que hay un cambio, recogemos todos los eventos que cambian ese mismo estado? Pues pasa que podemos tener *Event Sourcing*.

Si tenemos la historia de eventos, podemos recorrerla, rebobinarla, volver a empezar desde cero y obtener el estado del sistema en un momento dado. Si es necesario, podemos recoger "instantáneas" de ese estado en momentos determinados de la historia. En lugar de tener bases de datos almacenando en tablas la información de cada entidad, podemos tener un almacén de eventos y generar proyecciones específicos de cada vista que deseemos ofrecer en nuestra aplicación, ya sea visual, API o la que sea.

Sería muy prolijo hablar de la cantidad de cosas que se pueden hacer con Event Sourcing, pero imagina poder rebobinar tu sistema a una fecha determinada o que cambies lo que cambies en el software tus datos se pueden adaptar automágicamente porque, en realidad, nunca los guardas en el sentido tradicional.

Pero de nuevo, no hay nada en DDD que diga que *Event Sourcing* es un patrón preferido o especialmente adecuado. Es una opción tecnológica más a tu disposición para implementar tu aplicación. La salvedad es que el concepto de los Domain Events hace que *Event Sourcing* encaje fácilmente.

## Microservicios y DDD

Si ha habido un término estrella en los últimos tiempos ha sido el de Microservicios que, ni es nuevo, ni está implícito, ni es particularmente adecuado para DDD.

De nuevo, Microservicios es una forma de implementar una solución tecnológica que, en este caso, consiste en crear aplicaciones (servicios) muy especializadas, comunicándose a través de protocolos estandarizados (típicamente API REST), con los que componer el sistema de software.

Los microservicios han estado de moda en los últimos años. Al principio, como el paradigma al que todo el mundo parecía querer apuntarse. Sin embargo, las dificultades en su implementación han llevado a que últimamente esté de moda hablar de cómo los microservicios no han funcionado en muchísimas ocasiones.

Parte de la asociación de DDD con microservicios puede venir como posible implementación para *bounded contexts* y el *context map*. En mi opinión es una de esas relaciones bastante traídas por los pelos, lo que posiblemente explique gran parte de las problemáticas encontradas en la implementación de proyectos basados en microservicios.

Más bien pienso que los microservicios podrían surgir de forma natural al identificar módulos muy especializados y extraíbles en un monolito, pero a través de un proceso iterativo y evolutivo.

## Para terminar

No es DDD si el énfasis está en la implementación y los patrones tácticos. Esa es solo una parte de todo lo que DDD supone. La palabra clave en DDD es la última D: Design.

DDD trata de conversaciones, conceptos y modelos. En definitiva, trata de diseño.


