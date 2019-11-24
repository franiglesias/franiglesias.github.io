---
layout: post
title: DDD, identificando el dominio y los subdominios
categories: articles
tags: good-practices design-principles ddd
---

Domain Driven Design no puede tomarse como una guía con instrucciones para ir de un punto a otro siguiendo una ruta determinada. Es más bien, un conjunto de estrategias, métodos y tácticas para orientarse en un territorio desconocido y moverse hacia un objetivo deseado que, para mayor dificultad, es móvil.

Parte de la complejidad que el DDD nos ayuda abordar reside en que tanto el dominio como el conocimiento que tenemos de él es algo cambiante: las necesidades del negocio evolucionan, la precisión y la resolución con las que definimos los conceptos cambian, aprendemos a distinguir y descubrir nuevos matices y ramificaciones. Por simple que pueda parecer un dominio o un subdominio en una primera aproximación, a medida que aumenta nuestra comprensión, aumenta también nuestra capacidad de descubrir nuevas posibilidades, nuevas ramas. Y como no vivimos aislados en el mundo, el entorno hace que el negocio tenga que evolucionar, generando nuevas necesidades y requiriendo nuevas respuestas.

## DDD estratégico

En el artículo anterior introdujimos algunos de los elementos principales y característicos del Domain Driven Design. Buena parte de ellos forman parte de los llamados **patrones estratégicos**. Con cierta frecuencia se incide más en los **patrones tácticos**, que serían la concreción de aquellos en el código.

Pero, ¿qué son exactamente los **patrones estratégicos** y por qué son importantes?

Se podría decir que los patrones estratégicos son herramientas para pensar sobre el dominio y ayudarnos a construir el modelo rico y expresivo que lo representa. Básicamente:

* Conocer y aprender sobre el dominio
* Desarrollar un lenguaje ubicuo para poder hablar sobre él
* Identificar el core domain
* Identificar los diversos subdominios, de soporte y genéricos
* Caracterizar conceptos, procesos y eventos
* Definir lo contextos acotados a partir de los subdominios
* Crear el **context map** para representar las relaciones entre contextos

Nada de esto es código. Fundamentalmente se trata de definir un problema y construir un modelo que lo represente. Ese modelo será el que luego se exprese en forma de código utilizando los **patrones tácticos**.

Por cierto, en el artículo anterior mencioné **Entidades**, **Value Objects** y **Servicios**, que en principio forman parte de los patrones tácticos, no de los estratégicos. Sin embargo, diría que es útil tenerlos en cuenta a la hora de lidiar con los estratégicos, en particular para delimitar los **bounded contexts**.

## Definición del dominio

Una de las cosas que me gustan especialmente del DDD es la capacidad de su proceso para generar beneficios a la organización más allá de dirigir la construcción de su sistema de software. Es el hecho de ayudar a clarificar los propios objetivos y prioridades, los conceptos y los procesos.

Esto surge de la necesidad de explicarlos al equipo de desarrollo, respondiendo a preguntas y discutiendo los matices y los detalles.

Así que diría que un primer valor que puede obtenerse de aplicar Domain Driven Design es responder a la pregunta: ¿entiende la organización cuál es su core domain y es capaz de priorizar sus necesidades articulando sus dominios de soporte y sus dominios genéricos?

### Separando los subdominios genéricos

Sorprendentemente, o no, hay muchas empresas que no tienen bien definida la respuesta a esta pregunta. En particular, en el ámbito de nuestro ejemplo, siempre me ha sorprendido lo difuso que los colegios pueden llegar a tener su core domain y subdominios y, consecuentemente, el modo en que los gestionan.

Cuando, por la razón que sea, las cosas no están claras puede ser buena idea despejar el terreno identificando los subdominios genéricos que, como hemos dicho, son aquellos que podemos encontrar en cualquier organización y que podrían externalizarse o están, de hecho, externalizados, como sería el caso de nuestro hipotético colegio:

* Contabilidad
* Facturación
* Nóminas
* RRHH
* Fiscal
* Legal
* Otros

En este punto conviene volver a recordar que las circunstancias de cada empresa son diferentes y es perfectamente posible que un dominio que normalmente consideraríamos genérico puede ser de soporte en algunas de ellas, y viceversa. La pregunta es si alguno de esos subdominios funciona de una forma particular para nuestra organización o no.

Un tema interesante es que estos subdominios genéricos necesitarán datos procedentes de los subdominio de soporte o del core domain. Esto es algo que se concretará más adelante.

### Identificando los subdominios de soporte

Una vez que hemos identificado los subdominios genéricos sería el momento de enfocarnos en los de soporte: aquellas cosas que son necesarias para desarrollar el core domain y son específicos de nuestra organización, pero que no forman parte del core.

Por tanto, es hora de presentar nuestro colegio.

Llamémosle *Colegio Piruleta*. Se trata de un centro privado con más de 1200 alumnos desde Educación Infantil al Bachillerato. Aparte de la enseñanza reglada correspondiente a esas etapas, el centro ofrece servicios de comedor, actividades extraescolares, transporte escolar, servicio de guardería, biblioteca... Por otra parte, el *Colegio Piruleta* lleva un tiempo experimentando la introducción de plataformas de enseñanza online investigando el desarrollo de un nuevo modelo de docencia y aprendizaje que le permita distinguirse de la competencia.

El colegio desea disponer de sus propias herramientas para gestionar estos servicios. En unos casos por la dificultad de encontrar soluciones de terceras partes que se ajusten a sus necesidades En otros casos porque consideran algunos de ellos como parte de su core domain y se sienten incómodos utilizando soluciones externas.

Esta breve introducción debería darnos algunas pistas:

Servicios como comedor, transporte, guardería, extraescolares, etc. podrían ser genéricos del sector pero lo normal sería considerarlos como de soporte, debido a que:

* Ofrecerlos ayuda a captar alumnado, ofreciendo soluciones a las familias para los obstáculos prácticos que podrían desanimarlos a escoger este colegio.
* Contribuyen a la financiación.
* Pueden aprovecharse para reforzar la propuesta de valor que es específica del colegio: su proyecto educativo.

Esto es: no forman parte del core domain pero ayudan de una manera específica a que este pueda desarrollarse. Requieren herramientas específicas: aplicaciones con las que gestionar los servicios de manera eficaz, permitiendo comunicarse con los subdominios genéricos, de forma que estos puedan adquirir los datos que necesitarán. Por ejemplo, los necesarios para realizar la facturación mensual.

Cada vez nos vamos acercando más al core domain.

### El core domain

Como hemos dicho, el core domain es el que hace única la organización. En el caso de un colegio es su proyecto académico y educativo que se concreta en aspectos metodológicos, de priorización de contenidos, de modo de relación con el alumnado, etc. Aunque podríamos decir que hay elementos que son comunes a cualquier colegio, tenemos que fijarnos en lo que es característico y único.

Por un lado tenemos un aspecto casi administrativo que sería la Secretaría académica, que se ocupa de la matriculación de los alumnos y los diversos procedimientos burocráticos que implica su vida escolar. Tiene un rol que es claramente de soporte y, como veremos más adelante, maneja prácticamente las mismas entidades y valores que el core domain.

Un segundo elemento sería la gestión docente que está estrechamente relacionada con el anterior: todo lo que tiene que ver con la evaluación del aprendizaje, organización de cursos, agrupaciones de alumnos, currículum, asistencia, etc. La pregunta es: ¿Se encuentra dentro del core domain o podemos considerarlo también un subdominio de soporte? La respuesta definitiva nos la tendrían que dar los expertos de dominio.

El tercer elemento es la plataforma de aprendizaje que el colegio quiere construir y utilizar. Este es el que más claramente podríamos identificar como core domain porque afecta directamente al modo en que el colegio quiere desarrollar su actividad principal. Tiene que reflejar el tipo de interacciones de aprendizaje que el centro quiere promover, las metodologías, la forma en que participan e interaccionan los alumnos, la manera de disponer los contenidos, etc.

## Recapitulación

Es importante identificar correctamente los subdominios y el core domain. 

Los subdominios genéricos suelen ser comunes a cualquier tipo de organización, al menos dentro del mismo sector, y pueden ser externalizados o resueltos mediante soluciones de terceras partes con una mínima personalización.

Los subdominios de soporte, aún siendo comunes o habituales en otras organizaciones del mismo sector, aparte de ayudar en la consecución de los objetivos del core domain, lo hacen de una manera particular, en sintonía con ese core domain. Tienen que estar bajo nuestro control, aunque puedan externalizarse algunas partes específicas.

Finalmente, el core domain es aquello que hace única a nuestra organización, por lo que requiere de la mayor parte de nuestra atención y esfuerzo tanto de modelado como de implementación.

## Para profundizar

Aparte del libro de Eric Evans, he encontrado estos artículos interesantes acerca de la determinación de los subdominios y de los bounded contexts, los cuales trataremos en próximos artículos.

* https://vaadin.com/tutorials/ddd/strategic_domain_driven_design
* http://gorodinski.com/blog/2013/03/11/the-two-sides-of-domain-driven-design/
* http://blog.sapiensworks.com/post/2012/04/17/DDD-The-Bounded-Context-Explained.aspx
* https://codeburst.io/ddd-strategic-patterns-how-to-define-bounded-contexts-2dc70927976e
* https://medium.com/@naveennegi/thoughts-on-domain-driven-design-in-functional-languages-83c43ec518d






