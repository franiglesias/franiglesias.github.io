---
layout: post
title: Cruzando fronteras con Meaningful Objects
categories: articles
tags: software-design design-patterns
---

Una aplicación es un artefacto de software que permite a sus usuarios alcanzar ciertos objetivos.

La arquitectura de una aplicación puede adoptar distintas formas dependiendo de los patrones que hayamos decidido aplicar. En cualquier caso, existen algunos principios que son comunes:

* El modelo del negocio o dominio debe ser independiente de cualquier tecnología concreta.
* La aplicación es la encargada de definir cómo relacionarse con estas tecnologías.

Estos principios se plasman en distintos patrones de arquitectura, los cuales establecen estructuras de organización del código separadas por fronteras y reglas para mover la información a través de ellas.

En la Arquitectura Hexagonal, la Aplicación define Puertos a partir de las conversaciones que se inician desde el mundo exterior y, también, a partir de las conversaciones que inicia la aplicación para poder conseguir sus fines.

En las arquitecturas de capas, estar definen unos criterios de organización de código y una ley de dependencia, que define el sentido que deben tomar.

## Pasando datos a través de las fronteras

Una aplicación responde a la actividad de un consumidor (usuario o sistema) que expresa una intención interactuando con alguna interfaz (CLI, GUI, API...). La intención se expresa por el controlador concreto que media esa interacción, el cual invoca un Caso de Uso, un tipo de objeto que representa una intención determinada y que coordina el trabajo de diversos objetos del modelo de dominio para hacerla efectiva, ya sea devolviendo una respuesta, ya sea provocando un cambio en el estado del sistema.

Los datos brutos que el usuario aporta a través de la interfaz necesitan ser transformados. Un caso típico sería una llamada a un endpoint de una API. Esta llamada expresa una intención, como podría ser crear un nuevo recurso con los datos que se aporten. Por conveniencia, podemos imaginar que los datos se pasaran en forma de objeto JSON, aunque ese detalle es irrelevante para el propósito del artículo.

La primera transformación necesaria es la del objeto JSON en un objeto nativo del lenguaje que la aplicación sepa manejar. Con frecuencia, de esta tarea se encargará un framework o una librería. Esencialmente, lo que vamos a obtener es un DTO o, dependiendo del framework, un objeto Request que darán estructura a estos datos. Esta es nuestra primera transformación. Los datos serán expresados en tipos primitivos del lenguaje, acordes con lo que esperemos. Este objeto representará la petición realizada.

```
Raw Data -> Request DTO with primitive types
```

En este punto, seguramente introduciremos alguna acción de validación que nos asegure que este objeto se construye correctamente. No serán validaciones de negocio, sino validaciones que podríamos llamar _estructurales_, puesto que el controlador no conoce el negocio. Estas son algunas de las preguntas a las que debe responder la validación:

* ¿Están todos los datos que son necesarios?
* ¿Tienen la forma esperada?

En una aplicación moderna, lo más habitual sería construir un objeto comando o query a partir del input recibido. Este objeto suele tener la forma de un DTO, pero representa el Caso de Uso que queremos ejecutar. Es muy probable que estemos usando un _CommandBus_, o un _QueryBus_ en su caso, que se encargará de pasar el DTO al _Handler_ encargado de operar con esos datos. Este detalle también es irrelevante para el propósito del artículo, y también carece de importancia si se trata de un _Command_ o una _Query_.

```
Request DTO -> Command/Query DTO
```

Más importante es la forma de este DTO: ¿lleva los datos en forma de tipos primitivos o debería llevar _Value Objects_? Esta es una pregunta muy habitual y hasta ahora no he podido pensar en una respuesta que me convenza.

La primera opción es usar tipos primitivos. La principal ventaja es, por supuesto, la simplicidad. No hay más que copiar los datos del _RequestDTO_ al _Command_.

Sin embargo, esto nos introduce otros problemas. Uno de los inconvenientes de usar tipos primitivos es que no nos garantizan la validez de los datos recibidos. Así, por ejemplo, si tenemos un tipo de dato que es un _string_ que no debe estar vacío, el tipo _String_ nos permitirá cadenas vacías, que son perfectamente legales para un _String_. En consecuencia, tenemos que validar tanto en el _Controlador_ como en el _Handler_ que ese dato no es una cadena vacía antes de poder usarlo en este último, porque el _Handler_ no sabe quién le está haciendo la petición y no sabe si ha ejecutado la validación correspondiente.

La otra opción es crear el DTO comando con _Value Objects_. Esto nos permitiría garantizar que el dato recibido cumple no solo las validaciones estructurales, sino que también respeta las reglas de negocio que le incumben. Aparentemente, esta es la mejor solución. Digo aparentemente puesto que tengo algunas dudas al respecto.

La primera duda es que tengamos tanto conocimiento del dominio en una capa de infraestructura o de UI. Si bien es cierto que es el dominio quien define las interfaces que permiten interactuar con él, no tengo claro que sea necesario exponerlo todo.

Relacionado con esto, la naturaleza de muchos _Value Objects_ hace que su mera existencia fuera de las entidades o agregados sea bastante cuestionable. Por ejemplo, _CustomerName_, _StudentName_, _TeacherName_, _TenantName_... serán _Value Objects_ diferentes, pero representan una variante del concepto de _Nombre de Persona_, que es común a infinidad de dominios y cuyo comportamiento en todos ellos es idéntico. _PersonName_ sería una especie de _Value Object_ genérico... ¿O es otra cosa diferente? ¿Tiene algún significado en el dominio aparte de ser una forma no concluyente de identificar a una persona?

Otros ejemplos de _Value Objects_ que son genéricos pueden ser _Identity_, _Uuid_, _Money_ o _Coordinates_ (_Longitude_, _Latitude_) y es fácil encontrar muchos ejemplos en bases de código de _Value Objects_ que no encajan en ninguno de los de conceptos propios del dominio, pero que necesitamos y que no es infrecuente que acaben viviendo en una carpeta _Shared_.

## Meaningful Types

Investigando sobre esta problemática me topé con la expresión _Meaningful Types_. Aunque no representan un patrón específico en ninguna corriente de diseño de software, podrían aportar una solución intermedia.

Los _Meaningful Types_ serían un tipo de objeto similar en todo a los _Value Objects_, excepto en un detalle: no representan un concepto específico del dominio de la aplicación:

* Autovalidados
* Inmutables
* No tienen identidad
* Igualdad por valor
* Atraen comportamiento (pero no de negocio)

El último punto es clave: tienen comportamiento que no es específico de nuestro dominio, porque no representan un concepto del mismo.

Pensemos en un Precio. Un precio tiene sentido cuando lo representamos con una cantidad y una unidad monetaria. Esa es exactamente la definición de _Money_. Pero un precio, muchas veces, es algo más. Por ejemplo, puede incluir impuestos y expresarse de diversas formas. Típicamente, en productos de consumo el precio es una cantidad, una unidad monetaria y un porcentaje de IVA que se aplicará al precio final. Esto permite varias expresiones del precio en nuestra aplicación: desglosado en una factura, incluyendo impuestos en una tienda online para consumidores privados, o con el precio base en otra tienda destinada a consumidores empresariales.

Esto nos indica algunas cosas:

* _Money_ no es un concepto propio de nuestro dominio. Es un concepto genérico, útil en cualquier dominio y que no se comporta de manera diferente en uno u otro.
* _Money_ es un componente del concepto Price (precio), que si bien es bastante genérico, en nuestro dominio se realiza de una forma específica que _Money_ no puede capturar o expresar de forma completa.

Del mismo modo en que hacemos una distinción entre distintos tipos de dominios en DDD, los _Value Objects_ parecen tener una clasificación similar:

* **Core Domain**: el dominio principal de la empresa. El que la hace ser lo que es.
* **Dominios de soporte**: dominios que siendo comunes a otras empresas, contribuyen al core domain de una manera particular.
* **Dominios genéricos**: dominios presentes en todas las empresas y en las que funcionan de forma similar.

Así que podríamos hablar de:

* **Core Value Objects**: que representan conceptos propios de nuestro dominio y que no podríamos trasladar a otra empresa del mismo negocio.
* **Supporting Value Objects**: que representan conceptos comunes, pero que podemos usar de manera particular, aunque podrían ser reconocibles para otras empresas del mismo negocio.
* **Generic Value Objects**: que representan conceptos comunes a cualquier dominio y que no tienen un comportamiento relevante para el mismo y que, por lo mismo, cualquier empresa podría utilizar sin ninguna transformación.

Particularmente, estos _Generic Value Objects_ encajarían con la idea de _Meaningful Types_. Frente a los tipos primitivos, que no aportan nada al significado del concepto, los tipos significativos o _Meaningful Types_, contribuyen a representar conceptos del dominio, sin serlo por sí mismos, sino como elementos con los que componer aquellos.

Veámoslo en la práctica. Un sistema de gestión de contenidos podría tener una entidad _Post_, con _Title_ y _Content_, entre otras propiedades. _Title_ es claramente un tipo _String_, pero la regla de negocio nos dice que no puede existir un _Title_ vacío, al menos ha de contener un número de caracteres que no sean espacios. Esto significa que _String_ no aporta las suficientes restricciones, aunque en último término, nuestro _Title_ utilizará un _String_ como forma de representación de su valor. Además, es perfectamente posible que _Title_ no necesite ninguno de los comportamientos que expone _String_.

Lo cierto es que habrá otros conceptos en nuestro sistema que también tengan requisitos semejantes, como podrían ser nombres para categorías, etiquetas, etc. Una solución podría ser tener un tipo un poco más avanzado que el _String_, que incluya las restricciones necesarias. Por ejemplo, _NotEmptyString_, que sería la composición de un _String_ que solo se puede crear si cumple la restricción de contener al menos un carácter que no sea un espacio.

Sin embargo, _NotEmptyString_ no puede considerarse como un value object porque no representa un concepto propio del dominio del gestor de contenidos. Uno de esos conceptos es _Title_, siendo _NotEmptyString_ una buena representación del valor que contiene _Title_. Eso no impide que _Title_ pueda tener otras propiedades o comportamientos no ofrecidos o soportados por _NotEmptyString_.

Otro ejemplo podría ser Identity. Es muy habitual que utilicemos alguno de los diferentes tipos de identificadores únicos universales, como el UUID o el ULID, lo que nos ayuda a evitar conflictos internos. No hay nada en la inmensa mayoría de negocios que nos obligue a utilizar un formato u otro, pero lo normal es que usemos alguno de ellos como forma de representar la identidad de cualquiera de nuestras entidades: Usuarios, Productos, Servicios, Facturas...

En otras palabras, podríamos usar un mismo tipo _Identity_, que puede implementarse con el formato que más nos convenga, para todas nuestras necesidades de identidad. De hecho, no suele haber ningún comportamiento de negocio asociado a esta identidad _per se_. Podríamos usar este tipo _Identity_ para implementar identificadores específicos para cada una de nuestras identidades: ProductId, CustomerId, etc., etc.

Tomando esto como base, podríamos plantearnos que al instanciar los DTO Command y Query, podríamos hacerlo con estos _Generic Value Object_ o _Meaningful Types_:

```
Request DTO -> Command/Query DTO with Generic Value Objects
```

De este modo, garantizamos que a los casos de uso llegan objetos que son utilizables para instanciar nuestras entidades y value objects, ya dentro de la capa de dominio.

```
Command/Query DTO -> Value Objects, Entities
```

## Conclusiones

En este artículo exploro una solución al problema del paso de datos entre distintas capas de una aplicación. Para ello propongo el concepto de _Generic Value Object_ o _Meaningful Type_, una categoría de objetos que no pertenecen a un dominio de negocio en particular siendo utilizables en todos, pero que aportan reglas de validación y comportamientos básicos que nos permitirán componer nuestros objetos de negocio específicos. 


