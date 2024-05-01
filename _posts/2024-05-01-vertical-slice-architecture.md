---
layout: post
title: Vertical Slice Architecture
categories: articles
tags: design-patterns
---

En este artículo plasmo mis primeras reflexiones acerca de _Vertical Slice Architecture_. No trato de hacer una descripción de la propuesta como tal, que tampoco es que esté muy definida que digamos.

Hace algún tiempo que empecé a interesarme un poco por el concepto de _Vertical Slice Architecture_ (o _Feature Architecture_), pero una pregunta que me hicieron recientemente me ha motivado para investigar más en profundidad. La cuestión es; ¿hay profundidad que investigar?

La principal referencia sobre el tema es de Jimmy Bogard, en este artículo titulado precisamente [Vertical Slice Architecture](https://www.jimmybogard.com/vertical-slice-architecture/). [También lo puedes encontrar en forma de charla](https://www.youtube.com/watch?v=SUiWfhAhgQw).

Por desgracia, no consigo localizar recursos que desarrollen el planteamiento. Entre lo mejor, está este vídeo de Code Opinion [Vertical Slice Architecture Myths You Need To Know!](https://www.youtube.com/watch?v=TfMArQnepco) y su [correspondiente artículo](https://codeopinion.com/vertical-slice-architecture-myths-you-need-to-know/) que me parece muy clarificador. Por lo demás, Vertical Slice parece ser especialmente popular en el ecosistema `.Net`, que es donde surge y está quizá más acoplado de lo que me esperaba a este _framework_.

En español, tenemos esta charla de Josep Bocanegra que puede servir como introducción: [Troceando la cebolla](https://www.youtube.com/watch?v=uGNVfafyE64).

## Pero, ¿qué es Vertical Slice Architecture (VSA)?

### En ocasiones, veo capas

Nos hemos acostumbrado a arquitecturas en capas al estilo de Clean Architecture. Tanto es así que incluso vemos capas en patrones arquitectónicos que no las prescriben, como [Arquitectura Hexagonal](/no-hexagonall/).

Las arquitecturas en capas se basan en agrupar los componentes en un nivel alto de abstracción, basándose en algún principio de organización y estableciendo unas reglas de relación entre esas capas.

En Clean Architecture, por ejemplo, se definen capas bien conocidas:

* **Dominio**: en la que están representados los conceptos, reglas y procesos de negocio.
* **Aplicación**: en la que están los casos de uso, que representan las prestaciones o features del sistema, que se implementan haciendo interactuar los elementos del dominio.
* **Infraestructura**: en la que reside el código que lidia con los detalles de implementación de las tecnologías del mundo real que permiten a la aplicación funcionar.
* **UI**: en la que reside la implementación de la interfaz de usuario que comunica la aplicación con el mundo exterior. En algunos modelos, la UI forma parte de la Infraestructura, aunque hay quien la separa porque es especialmente dependiente de _frameworks_.

La regla que relaciona las capas es la llamada "ley de dependencia", que se resume en que las dependencias apuntan siempre hacia la capa de Dominio.

Por su parte, Arquitectura Hexagonal, o _Ports & Adapters_, es una propuesta de un patrón estructural que organiza la aplicación en dos grandes áreas:

* **Aplicación**: donde residen los conceptos, procesos de negocio y casos de uso y que define los _puertos_. Los puertos representan las conversaciones que los actores primarios pueden establecer con la aplicación, o las que la aplicación puede establecer con actores secundarios.
* **Adaptadores**: implementaciones que usan los puertos para hacer posible esas conversaciones.

La regla en este caso es que los puertos pueden ser o bien implementados o bien usados por los adaptadores para hablar con la aplicación. 

No sería correcto hablar de capas aquí, pero nada impide que organices la aplicación internamente en capas si te resulten útiles siempre que tengas claro que el patrón no las prescribe. Pero, del mismo modo, podrías adoptar una organización tipo VSA.

Muchísima gente confunde Arquitectura Hexagonal con arquitectura de capas, o incluso la definen así en cursos, vídeos, tutoriales y artículos. Y, lo mismo se puede decir de DDD, que muchísima gente considera una arquitectura (spoiler: no lo es).

En cualquier caso, estas capas no dejan de ser cuestiones técnicas y el hecho de que se reflejen materialmente en la forma en que organizamos el código puede convertirse en un problema. Especialmente, porque los archivos relacionados con una prestación están repartidos por diversos lugares, lo que hace complicado entender el proyecto en conjunto, entender una prestación específica o intentar extraerla.

### La crítica a las capas

> The problem is this approach/architecture is really only appropriate in a minority of the typical requests in a system. Additionally, I tend to see these architectures mock-heavy, with rigid rules around dependency management. In practice, I've found these rules rarely useful, and you start to get many abstractions around concepts that really shouldn't be abstracted (Controller MUST talk to a Service that MUST use a Repository).

[Vertical Slice Architecture, by Jimmy Bogard](https://www.jimmybogard.com/vertical-slice-architecture/)

Voy a intentar dar mi visión de la crítica a las arquitecturas de capas. 

A grandes rasgos, una aplicación se podría dividir en dos tipos de interacciones:

* Las que producen algún tipo de cambio o efecto en el sistema.
* Las que obtienen una respuesta del sistema.

En el primer caso, uno de nuestros intereses es la protección de invariantes y asegurar la consistencia de los cambios o efectos. Para ello, debemos establecer reglas y límites. Esto implica un trabajo de modelado en el que descubrimos y describimos conceptos, y representamos reglas de comportamiento que se deben cumplir. En último término esto nos lleva a la creación de modelos de dominio que sean útiles para conseguir los objetivos de consistencia.

> All models are wrong; some are useful.

[George Box, 1976](https://en.wikipedia.org/wiki/All_models_are_wrong)

En el segundo caso, no solemos necesitar la complejidad anterior. Básicamente, nos llega con asegurar que obtenemos los datos deseados para componer la respuesta solicitada. Si asumimos que la parte de escritura ha hecho bien su trabajo, la parte de lectura puede limitarse a obtener la información y darle una cierta forma. Para ello, no necesitamos modelos complejos, sino tan solo objetos de transporte de datos, fuertemente acoplados a la representación que haya sido persistida y a la representación que se nos pide devolver.

Lo que se propone desde la perspectiva de la VSA es no buscar y aplicar ese gran modelo de dominio a toda la aplicación, y en su lugar, partir del desarrollo de las features individuales antes de intentar generalizar prematuramente. Como escuché una vez a Rolando Caldas, de CraftersVigo, en una conversación al hablar de desarrollo _outside-in_:

> No modelamos el dominio: lo descubrimos.
 
Y es posible que VSA sea una forma de hacerlo.

La propuesta sería comenzar un patrón muy simple: _transaction script_, que básicamente consiste en obtener una entrada de datos, realizar algún proceso con ellos y devolver una respuesta o persistir un cambio en el sistema. El patrón se llama _Vertical_ por algo, y es que atraviesa las capas clásicas y cada prestación o _slice_ contendría el equivalente de las distintas capas.

Esquemáticamente, lo podemos representar así:

```
Input -> Handler -> Output
```

O también así:

```
Request -> Handler -> Response
```

Estos tres objetos constituirían la implementación de la _feature_. Se trataría de tres objetos únicos, no reutilizables, diseñados según las necesidades expresadas por la _feature_. VSA propugna evitar la reutilización de código en la medida de lo posible. Aunque esto hay que matizarlo mucho, como veremos.

* **Request** representa la intención del consumidor de la aplicación.
* **Handler** implementa la forma de cumplirla.
* **Response** contiene la información necesaria para proporcionar al consumidor.

¿Te resulta familiar? Posiblemente, pero hablaremos de eso dentro de un rato.

### ¿Features como nano aplicaciones?

Podríamos considerar cada feature como una _nano_ aplicación en la que introduciremos solo los elementos que sean necesarios para conseguir implementarla. Y nada más. De ese modo, una feature está muy especializada en un aspecto concreto del dominio del sistema completo.

Las grandes ventajas serían:

* **Fácil de testear**: cada feature hace solo una cosa, no interfiere con las otras. Ya veremos algunas matizaciones a esto.
* **Fácil de mantener**: pocos elementos y muy concretos que no tienen que afectar a otras prestaciones.
* Podemos decidir la **mejor aproximación técnica** para cada prestación.
* **No necesitamos abstracciones complejas**.

¿Significa esto que no podemos reutilizar elementos entre prestaciones? No. En un momento dado veremos que podemos abstraer algunos conceptos.

Entre las dudas más comunes está la de si se pueden hacer las mismas validaciones, etc. O si las _features_ tienen que estar completamente aisladas entre sí y no compartir nada. O si no puede existir ninguna abstracción.

La respuesta es que, por supuesto que las prestaciones pueden compartir cosas y que pueden existir abstracciones. Pero no _a priori_, sino _a posteriori_. Es decir, los elementos compartidos nacen de identificar _smells_ en el código y refactorizar. En estos momentos donde identificas duplicación y la extraes según sea necesario. Y aquí entra en juego un requisito técnico para poder plantearte hacer VSA: hay que saber refactorizar bien. Pero no ese refactorizar de "vamos a escribir esto desde cero", sino el saber refactorizar el diseño de un código sin afectar a su comportamiento.

Este refactor es el que nos permite evolucionar el código desde un diseño muy simplista a otro más sofisticado, con componentes que puedan ser lo bastante abstractos como para ser compartidos por varias features... al menos dentro de un cierto contexto. Y este es un punto que me llama la atención, en el momento en que la aplicación comienza a pedirnos ciertas abstracciones, ¿acaso no nos tendríamos que mover a otro estilo de arquitectura?

### Acoplamiento vs cohesión

El objetivo explícito de VSA es minimizar el acoplamiento entre features y maximizar su cohesión interna. Ojo, que el enunciado original habla de maximizar el acoplamiento interno, algo que no estoy seguro de si es exactamente lo mismo. Profundicemos en esta idea.

El acoplamiento mide el grado en que un componente necesita saber cosas de otro. Dos componentes no están acoplados si no saben nada el uno del otro, pero esto implica que no interactúan de ninguna manera.

Para que dos componentes puedan funcionar juntos necesitan tener un cierto grado de acoplamiento. Y para controlarlo disponemos de diversas técnicas.

Por supuesto, para que una feature provea valor, es necesario que varios componentes interactúen, ya que también juega el Principio de Separación de Intereses y no podemos hacer que un objeto se ocupe de todo. Entonces, podríamos decir que todos los participantes tienen que estar acoplados. Pero una cosa es tener un acoplamiento innecesario y otra, muy distinta, es colaborar a una misma finalidad. Cuando es así, hablamos de cohesión.

La cohesión es el grado en que dos o más elementos contribuyen a una funcionalidad. La cohesión es máxima cuando todos los elementos contribuyen a una misma y única funcionalidad. Pero yo creo que no debemos confundir cohesión y acoplamiento. Podemos conseguir alta cohesión manteniendo un acoplamiento relajado.

La razón por la que la VSA _pide_ evitar usar elementos comunes entre features es justamente reducir el acoplamiento. Sin embargo, _no obliga_ a hacerlo así. Hay muchos contextos en que necesitaremos DRY: tener fuentes únicas de verdad.

### ¿De qué trata la aplicación?

El enfoque de VSA me recuerda mucho al desarrollo dirigido por _Casos de Uso_. Y, ¿qué es un caso de uso? Un Caso de Uso es la representación de una funcionalidad o _feature_ de la aplicación que representa la intención del consumidor de la misma, cómo se interactúa con ella, y cómo se implementa.

El caso de uso viene definido por:

* Una **Request** que representa la petición del consumidor.
* Una **Response** que representa lo que debe obtener el consumidor como resultado de su petición.
* Un **Handler** que describe el proceso necesario para cumplimentar la petición y entregar la respuesta.

Request y Handler se implementan habitualmente con un patrón `Command/CommandHandler`... o `Query/QueryHandler`.

Básicamente, este esquema define lo que es una _Feature_ en VSA. ¿Cuál es la diferencia? Un Caso de Uso en una aplicación organizada en capas es, de hecho, una rebanada de funcionalidad que atraviesa todas las capas. Se trata exactamente de la misma definición de _feature_ que nos propone Jimmy Bogard. Una cuestión que me planteo al revisar esta semejanza es que seguramente estamos mezclando el concepto de capa lógica y el de la carpeta física en la que disponemos el código.

> So what does the architecture of your application scream? When you look at the top level directory structure, and the source files in the highest level package; do they scream: Health Care System, or Accounting System, or Inventory Management System? Or do they scream: Rails, or Spring/Hibernate, or ASP?

[Robert C. Martin: Screaming Architecture](https://blog.cleancoder.com/uncle-bob/2011/09/30/Screaming-Architecture.html)

Aunque la cita hace una referencia a _Frameworks_, ¿no podría aplicarse también al modo en que aplicamos algunos estilos de arquitectura? Esto es: ¿qué nos cuenta ver este primer nivel de carpetas sobre nuestra aplicación?

```
Domain
Application
Infrastructure
UI
```

Pues la verdad es que no gran cosa: este primer nivel puede aplicarse a cualquier aplicación que podamos concebir.

En cambio, ¿qué nos contaría este primer nivel?

```
SendProposal
EditSentProposal
ReviewProposal
ApproveProposal
RejectProposal
...
```

O incluso:

```
Proposal
    Send
    EditSent
Review
    Approve
    Reject
Speakers
    Edit
Schedule
    AssignProposalToSlot
    DefineTrack
```

Pues prácticamente nos revela de qué trata la aplicación sin tener que profundizar más.

### Está lleno de features

Ahora bien, tener multitud de _Features_ en forma de paquetes individuales en el primer nivel de la estructura tampoco parece la mejor forma de organizar la aplicación. 

En algún momento sentiremos la necesidad de agruparlas en bloques significativos, que mantengan una alta cohesión y que sigan contando la historia de la aplicación. Posiblemente, también habremos identificado generalizaciones que tienen sentido en el contexto de esa agrupación. Estos grupos de _features_ podrían considerarse Módulos, y deberían cumplir entre ellos el mismo aislamiento que se promueve para aquellas. O bien podemos considerar estos Módulos como las Features propiamente dichas.

Este es el enfoque más habitual en las propuestas que he visto publicadas: considerar las features como grupos de acciones relacionadas semánticamente. Esto nos lleva a la organización que indicábamos antes:

```
Proposal
    Send
    EditSent
Review
    Approve
    Reject
Speakers
    Edit
Schedule
    AssignProposalToSlot
    DefineTrack
```

Y aquí tengo un _pero_. El hecho de agrupar por conceptos ¿no resulta igualmente un poco artificial? Al fin y al cabo, las features de una aplicación son fundamentalmente intenciones o deseos, que se concretan en acciones. Imagina ahora esta organización:

```
ForSendingProposals
    Send
    EditSent
ForReviewingProposals
    Approve
    Reject
ForManagingSpeakers
    Edit
ForManagingSchedules
    AssignProposalToSlot
    DefineTrack
```

Que es ni más ni menos que la propuesta de nombres que hace la Arquitectura Hexagonal. ¿Cómo te quedas?

### ¿Qué hay de los aspectos transversales?

Las descripciones de VSA que he podido ver me dejan con muchas preguntas, las cuales suelen tener que ver con la comunicación entre las distintas _features_ o _slices_ y lo que podríamos llamar prestaciones transversales: autenticación, autorización, logging, monitorización, etc. No se trata tanto del problema de extraer generalizaciones que puedan conformar modelos de dominio ricos, como del modo en que se resuelven asuntos de bastante calado.

Uno de estos asuntos es la persistencia. Por lo general, cualquier aplicación útil requiere alguna forma de persistencia. Esto ha llevado muchas veces a ponerla demasiado en el centro del desarrollo y, por lo general, los modelos de arquitecturas limpias la etiquetan como un detalle de implementación del que el dominio debería ser ignorante.

En VSA, sin embargo, no parece existir esta preocupación por la "ignorancia de persistencia", y diría que en parte es porque VSA surge en la comunidad de _.Net_, como mencionaba al principio. Y digo esto porque en algunos artículos se mencionan de forma explícita librerías propias de este entorno, incluyendo Entity Framework, MediatR, EntityMapper, LinQ, etc. En el caso de Entity Framework [este artículo de Issac Ojeda](https://dev.to/isaacojeda/vertical-slice-architecture-36ng) argumenta que ya es un repositorio y proporciona la necesaria _persistence ignorance_, aunque debo decir que no me ha convencido.

En cualquier caso, el problema que quería plantear aquí es el de como acceden las diferentes features a la persistencia. Por un lado, puede parecer que cada feature tiene que tener su propia persistencia, por decirlo así, y eso resulta, como mínimo, contradictorio con la simplicidad de desarrollo que propugna esta corriente. Si me preguntas, diría que no querría introducir tecnologías concretas en los handlers, sino que la abstraería en forma de servicios específicos por _feature_ (patrón adaptador: interface + implementación).

Esto tiene varias ventajas. Por ejemplo, puedo usar diferentes aproximaciones para las lecturas y las escrituras, utilizar réplicas para la lectura, generar proyecciones, introducir caches, o tunear la performance, todo de forma transparente para los handlers. Y esto no impediría empezar de forma sencilla con una sola base de datos, por ejemplo.

Algo parecido ocurre con todas las prestaciones transversales, como la autenticación y autorización. Tienen que poder usarse desde todas las otras prestaciones (otra cosa es la administración de usuarios y permisos desde un backoffice). Claro que en muchos casos podemos recurrir a patrones como los buses de mensajes que mediante _middlewares_ nos permitirían separar todos estos asuntos y tratarlos separadamente. Pero bueno, estos son detalles de implementación.

## Algunas primeras conclusiones

Por no alargar más el artículo, dejó aquí algunas de las ideas principales.

No hay una regla que nos obligue a utilizar una determinada propuesta de arquitectura de software. Si vamos a eso, las propuestas como _Clean Architecture_, _Onion Architecture_, _Ports and Adapters_ o _Vertical Slice Architecture_, no dejan de ser _frameworks_, marcos de trabajo que nos proporcionan criterios para tomar decisiones sobre cómo organizar el código de una aplicación.

Escoger la organización de código adecuada a nuestro proyecto es el tipo de habilidad que debemos desarrollar a través de la experiencia y la reflexión. De hecho, puedes crear tu propia arquitectura siempre que establezcas unas reglas claras y que las apliques consistentemente.

Tengo sentimientos encontrados con respecto a _Vertical Slice Architecture_. Por un lado, sintonizo con la idea de organizar las aplicaciones en torno a sus prestaciones, algo que el énfasis en usar arquitecturas de capas parece que ha dejado de lado. Sin embargo, no es nada nuevo. En 1992, Ivar Jacobson ya publicaba su libro clásico [Object-Oriented Software Engineering: A Use Case Driven Approach](Object-Oriented Software Engineering: A Use Case Driven Approach).

Por otro lado, el concepto de _feature_ tampoco es que esté muy bien definido: ¿Es un caso de uso específico? ¿Es un conjunto de casos de uso relacionados con un concepto de negocio? En este sentido, la idea de los puertos como conversaciones, tomada de la Arquitectura Hexagonal, me parece mucho más útil e incluso más coherente con la VSA que muchas de las propuestas y ejemplos que he consultado.

El aspecto que más me gusta de VSA no es tanto la idea de empezar a trabajar desde las _features_ o casos de uso, sino de hacerlo con el menor número de elementos posibles y con la mayor independencia entre casos de uso, dejando para el refactor la evolución del sistema con abstracciones o elementos compartidos, evitando un diseño extensivo _up-front_. ¿Nos suena de algo? A mí, personalmente, me suena a dos cosas: desarrollo ágil y Behavior Driven Development.

Efectivamente, unos de los elementos de construcción del BDD es precisamente la idea de _Feature_, que se diseña a partir de imaginar escenarios que debemos resolver con el código mínimo imprescindible.

Y, ¿a dónde me lleva eso?

_Vertical Slice Architecture_ es una propuesta interesante, pero no la veo como una arquitectura, sino como una metodología que puedo combinar perfectamente con otras metodologías de desarrollo, y que puedo combinar con otros modelos de arquitectura.

Mi plan era intentar construir una aplicación basándome en ideas de VSA, así que vamos a intentarlo en próximos artículos.

