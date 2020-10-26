---
layout: post
title: DDD, el lenguaje ubicuo
categories: articles
tags: good-practices design-principles ddd
---

Creo que una de las cosas que provocan que se *haga bola* la parte estratégica del DDD tiene que ver con que se trata de una metodología muy orgánica. Es difícil incluso definir un principio y un final del proceso. De hecho, diría que el DDD bien entendido no termina nunca mientras el negocio evoluciona.

Con frecuencia se *despacha* el DDD con la aplicación de los llamados patrones tácticos, es decir, todo lo que tiene que ver con la implementación del modelo en código. Sin embargo, esto puede llevarnos a lo que se suele llamar *Directory Driven Development*, como si el diseño consistiera en poco más que aplicar arquitectura hexagonal y ya. Y lo mismo se puede decir de otros patrones útiles en torno al DDD, como CQRS, event-driven o incluso Microservicios. DDD no ofrece recetas.

Sin embargo DDD es, ante todo, una conversación. 

Comienza con una conversación entre desarrolladores y expertos de dominio acerca de la naturaleza y estructura del dominio, cuyo primer objetivo es delimitar cuál es el problema cuya solución vamos a construir. En esta conversación se van clarificando, separando y organizando los subdominios (de los que hablamos en el artículo anterior), a la vez que construyendo un modelo que los representa. La conversación sigue cuando pasamos del espacio del problema (los subdominios) al espacio de la solución (los contextos acotados), y continúa a medida que avanzamos en el desarrollo del modelo, primero, y la implementación, después. Y en todas estas fases tienen lugar toda suerte de conversaciones, ya sea entre los desarrolladores y los expertos de dominio, o entre desarrolladores de distintos bounded contexts, y todos las personas implicadas en el proyecto.

Y para que esta conversación pueda tener lugar es necesario que se vehicule en un lenguaje que no sólo es compartido por todas las implicadas, sino que está presente en todos los niveles de la misma: desde la discusión sobre el dominio hasta su representación en forma de código: en el nombre de los objetos, los servicios, las variables o los tests.

## ¿Documentar el lenguaje ubicuo?

El lenguaje ubicuo se construye a partir del lenguaje que emplean los expertos del dominio. Este lenguaje se compone de términos que designan los conceptos, los procesos y los eventos.

Así que lo primero que nos puede venir a la mente es comenzar recopilando un glosario de estos términos y así documentar el lenguaje para que esté al alcance de todos. Este documento puede crearse a partir de las diversas conversaciones de forma que todos los participantes contribuyan.

Sin embargo, al escribir código nos esforzamos porque sea autodocumentado hasta donde sea posible, porque somos conscientes de que, con el tiempo, la documentación y el código terminarán divergiendo hasta hacerse irreconciliables la una con el otro. Y el caso es que ese mismo riesgo es el que corre la creación de un glosario del lenguaje ubicuo: que con el tiempo el diccionario se estanque mientras el lenguaje crece y evoluciona.

Sabemos que mantener la documentación actualizada a largo plazo es un problema con una solución complicada, porque en un momento dado deja de mantenerse pese a las buenas intenciones iniciales. 

[Paul Rayner proporciona algunas pistas en este artículo](http://thepaulrayner.com/blog/2013/05/07/succeeding-with-ddd-documentation/) acerca de cómo tener éxito documentando el proceso de diseño. Además de reconocer el problema, señala algunas cosas interesantes:

Es más importante y productivo documentar como proceso continuo que generar documentación como fin en sí misma. Es decir, documentar mientras se desarrolla, no documentar cuando está el producto terminado.

La documentación debe ser confiable, fácil de cambiar y accesible. En otras palabras: hay que eliminar cualquier dificultad u obstáculo que nos pueda desanimar a la hora de contribuir a esa documentación. El formato concreto es indiferente, ya sea en forma de diagramas hechos a mano, con UML más o menos simplificado, una wiki o documentos markdown en un repositorio.

## Aprendiendo a expresarse en el lenguaje ubicuo

Establecer un lenguaje ubicuo no es un simple proceso de capturar los términos que utilizan los expertos de dominio. En cuanto intentas compilar un lenguaje no formal descubres una increíble cantidad de trampas, sobreentendidos, ambigÜedades, polisemias y sinonimias que pueden desafiar la capacidad sistematizadora de cualquiera.

Además, el lenguaje ubicuo tiene *dialectos*. Cada subdominio, cada contexto, puede tener su propia versión un término, que da nombre a un concepto ligeramente distinto porque en cada uno de ellos nos interesa un aspecto particular.

Intentaremos ver esto acudiendo a ejemplos en nuestro proyecto DDD para un colegio.

### Arrancando

Supongamos que nos centramos en el sub dominio académico, en el core domain (o al menos uno de sus dominio de soporte más cercanos). Una forma de empezar puede ser centrarnos en algún evento relevante del dominio. Por ejemplo, un nuevo estudiante se matricula en el colegio. Podemos imaginar una conversación así con la persona responsable de la Secretaría del centro:

– Hablemos entonces del alta de un **alumno** en el centro.

– De acuerdo. A ese proceso lo llamamos **proceso de matrícula** o **hacer la matricula**.

– Entiendo que se recogen los datos del **alumno**, sus **padres**, el **curso** en el que va a empezar, etc.

– Sí, cada nuevo **estudiante** aporta sus datos personales. Como es menor, debe ser **representado por un adulto**. Normalmente serán los **padres**, pero también hay familias monoparentales o chicos en situación de acogida, con un **tutor o tutora** legal, etc.

– Vale. O sea que cada nuevo **estudiante tiene al menos un representante adulto**. ¿Podrían ser más de dos?

– No es habitual, pero realmente tampoco hay nada que lo impida.

Paremos aquí por un momento. Ya han salido varios conceptos y términos:

* Matricula y proceso de matricula.
* Estudiante, también llamado Alumno.
* Representante adulto, típicamente la madre o el padre, pero también un tutor legal.
* Una regla de negocio: todo alumno tiene al menos un representante adulto.

Estamos al principio del proceso por lo que la información va a llegar de forma casi explosiva. Y esa explosión también nos trae los primeros problemas lingüísticos.

* Tenemos dos etiquetas para un mismo concepto: ¿es importante que haya una distinción? ¿Nos está indicando eso algo acerca del dominio?. Es necesario aclararlo.
* El tema del representante adulto: no se le nombra así pero intuimos que podría haber algún concepto pugnando por salir.

– Vale. Me gustaría profundizar más en esto. Pero antes querría aclarar una cosa: hemos usado la palabra Estudiante y Alumno. ¿Significan lo mismo? ¿Cuál deberíamos usar?

– La verdad es que no hay ninguna diferencia. Habitualmente en los niveles en que trabajamos hablamos de Alumnos, no de Estudiantes.

– De acuerdo, entonces. Volviendo al tema de los padres… Estaba pensando que también se matricularán hermanos, ¿cómo afecta eso a la gestión, las comunicaciones y demás?

– En la medida de lo posible evitamos duplicar comunicaciones generales en el caso de que haya hermanos, sobre todo cuando son en papel, aunque eso ocurre cada vez menos. Pero es verdad que la información de contacto es la misma: domicilio, teléfonos para avisos, etc. Además, las **familias** prefieren poder acceder a la información de sus hijos de manera unificada.

Otra parada. Ha surgido el concepto **Familia** que puede ayudar a clarificar el tema de la participación de adultos en el proceso, vamos a tirar un poco de ese hilo:

– ¿Hay alguna consecuencia más del hecho de que haya hermanos en el colegio aparte de lo que se refiere a la comunicación con las familias?

– Aparte de esto, la única cosa relevante ocurre antes de la matrícula, ya que tener hermanos matriculados en el mismo centro da puntos en la solicitud. Pero una vez matriculados la única consecuencia es en este aspecto de la relación con las familias.

– Ya veo. Entonces, ¿podríamos definir **Familia** como el conjunto de alumnos y sus adultos responsables, por así decir?

– Sí, ciertamente.

– Y que esto tiene importancia en cuanto a la relación con el colegio, la comunicación y el acceso a la información, pero no tiene otros efectos, ¿es correcto?

– Sí, con lo que más tiene que ver con el ámbito de la Secretaría.

Bien. Este último tramo de la conversación nos ha permitido situar las cosas mejor. Hemos hecho salir un concepto que el propio experto de dominio no había expresado inicialmente y que nos permite unificar un asunto que podría salirse fácilmente de control.

Además, nos han señalado unos límites del subdominio de la "Secretaría educativa": gestión del alumnado y relación con las familias. Pero aún nos falta mucha información, hay un tema que no hemos tratado aún:

– Bien. Hemos dicho que un Alumno se matricula para un **curso**, como 4º de Primaria o 3º de ESO.

– Sí, correcto.

– ¿Cuándo lo hace?

– En principio la matrícula se hace los primeros días del **curso escolar**, aunque antes se ha hecho una reserva, si ya era Alumno del centro, o una asignación de plaza cuando es nuevo. 

– Vale, pero eso… ¿afecta al proceso en sí?

– Realmente no. Es otro proceso.

– De acuerdo. ¿Cómo se sabe que el alumno se matricula en el curso que le corresponde?

– Bueno. En principio los alumnos se matriculan en un curso en función de su edad, salvo que hayan tenido que repetir alguno o se les haya adelantado en el caso de tener altas capacidades. Esa información consta en su expediente.

– Entiendo que eso está regulado por Ley.

– Sí. Por ejemplo, los alumnos que cumplen 6 años en el año en que comienza el curso escolar se matriculan en Primero de Primaria, los de 7 en Segundo, y así sucesivamente.

Aquí nos surge una situación interesante: un mismo término que estaría refiriéndose a conceptos distintos: **curso**. Tenemos que aclarar esto, lo que nos traerá un giro inesperado:

– Estamos hablando de **curso** y **curso escolar**. Entiendo que son conceptos distintos, ¿no?

– Sí, por un lado hablamos de **curso** como **nivel educativo** en que está matriculado un Alumno y, por otro, el curso escolar es el año escolar, que va del 1 de septiembre de un año hasta el 30 de agosto del siguiente.

– ¿Podríamos usar **año escolar** en lugar de curso escolar para evitar la ambigüedad?

– Sí, aunque es muy habitual usar la otra forma.

– Ya, comprendo. Por otra parte, he observado que el colegio tiene tres grupos por curso, ¿afecta eso al proceso de matrícula?

– En principio, no. Obviamente cada alumno acaba siendo asignado a uno de los tres cursos, pero eso ya es una cuestión de organización pedagógica que se hace una vez matriculado.

– Un momento. Me ha parecido entender que se refería a los tres grupos de un curso como cursos, ¿es eso correcto?

– Hum. Es verdad. Ahora que sale el tema es verdad que muchas veces llamamos curso al grupo. Es habitual que una tutora diga "mi curso" refiriéndose a su grupo de tutoría, o que alguien diga "el curso de 3º B", por ejemplo.

Tenemos tres significados para una misma palabra y en un mismo contexto, por tanto, tenemos un problema. Para resolverlo, tenemos que ver si es posible utilizar sinónimos que tengan sentido para el dominio:

* Curso escolar: Año escolar
* Curso: Nivel educativo
* Curso: Cada agrupación de alumnos matriculados en el mismo nivel educativo.

Después de aclarar los puntos anteriores, seguimos avanzando en la conversación.

– Una vez que el alumno se ha matriculado, ¿cómo se le identifica dentro del sistema?

– Se le asigna un número de matrícula aunque realmente sólo se usa para algunos trámites ya que normalmente identificamos al alumno por su nombre y apellidos o, dentro de un año escolar, por su nivel, grupo y número de clase, que viene dado por su posición en la lista por orden alfabético del apellido.

– De acuerdo. Sin embargo, necesitaremos un identificador único. Entiendo que cabe la posibilidad de que haya alguna coincidencia de nombres y apellidos de vez en cuando.

– Sí, podría pasar, aunque es raro que ocurra dentro del mismo nivel y grupo.

– Ya. Sin embargo, el número de matrícula podría ser suficiente y así el sistema podría ser compatible con los registros que existan ahora.

– De acuerdo.

– Entiendo que es un número que se incrementa con cada matrícula. ¿es necesario ocupar todos los números o pueden quedar huecos de números no usados?

– En principio no hay problema en dejar números sin usar.

Aquí surge otra regla de negocio: cada alumno tiene un identificador único para su vida escolar, pero también se menciona que tiene otros identificadores, como el número de clase que lo identifica dentro de un grupo de alumnos concreto durante un año escolar e, incluso, junto la identificación de su grupo, lo identifica dentro del centro durante ese mismo año escolar. En otras palabras, nos están mencionando distintos contextos.

Se nos aclara que estos identificadores no se usan en el día a día realmente, pero no hay duda de que son necesarios para otorgar identidad a cada alumno individual en el sistema.

– Y con esto, entonces, quedaría terminado el proceso de matrícula.

– Básicamente sí. 

De momento, la conversación termina aquí.

## Recopilar la información recogida

El *setup* ideal para estas conversaciones sería contar con una pizarra blanca o similar en la que poder ir anotando conceptos y dibujando esquemas de forma que todos los participantes puedan aportar. Los acuerdos de significado a los que vamos llegando se registran en forma de documentos que los transcriban, fotos de la pizarra en los momentos en que llegamos a un acuerdo, esquemas que se hayan dibujado, etc.

No es necesario seguir un protocolo formal, sino recoger la información generada de la forma más fidedigna, pero también la más práctica y más a mano para los participantes. Si alguien sabe de UML puede crear diseños simplificados de los conceptos identificados y sus relaciones. Algunos procesos podrán representarse en diagramas de flujo, otros podrían quedar bien resueltos con simples esquemas de cajas y flechas.

También es recomendable incorporar a las notas formularios impresos y plantillas que puedan estar utilizándose para el mismo proceso en la actualidad. Estos documentos nos proporcionan un punto de partida para entender la estructura de los datos que se solicitan o cómo se registran. Podemos hablar sobre cuáles se utilizan realmente, cuáles acaban ignorándose, etc.

Otra forma de iniciar y mantener esta conversación es a través del [Event Storming](https://techbeacon.com/devops/introduction-event-storming-easy-way-achieve-domain-driven-design). Es una técnica en la que se parte de los eventos o sucesos interesantes que suceden en el dominio, buscando todos los conceptos, comandos, servicios, etc, relacionados con lo que se llega a identificar agregados y contextos acotados. 

Incluso la metodología Behavior Driven Design nos facilita una forma de hablar sobre el dominio y registrar el lenguaje ubicuo en forma de una documentación dinámica, pero esto quizá nos acerca demasiado a la implementación.

En todo caso, será el tema de otro artículo.

## Más información

Un par de artículos más sobre lenguaje ubicuo:

https://blog.carbonfive.com/2016/10/04/ubiquitous-language-the-joy-of-naming/

https://arne-mertz.de/2017/07/ubiquitous-language/


## Postdata

Curiosamente, justo estaba empezando a escribir este artículo cuando me encontré con este retweet, que me viene muy al pelo:

<blockquote class="twitter-tweet" data-theme="dark"><p lang="en" dir="ltr">Happy not to be the only angry kid in the block saying this over and over again. <a href="https://t.co/aFpFRDE7i8">https://t.co/aFpFRDE7i8</a></p>&mdash; Nil (@niluspc) <a href="https://twitter.com/niluspc/status/1196039702211637249?ref_src=twsrc%5Etfw">November 17, 2019</a></blockquote> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>

Esto me recordó que Eric Evans se define a sí mismo como un *Domain Linguist* y su consultora se llama [Domain Language](http://domainlanguage.com). Algo querrá decir, ¿no?

Es más, el Blue Book apenas incluye ejemplos de código o menciones muy explícitas. Se podría decir que es un libro que **trata acerca de cómo conversar productivamente acerca del dominio**.



