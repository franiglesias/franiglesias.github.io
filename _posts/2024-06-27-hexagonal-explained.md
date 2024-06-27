---
layout: post
title: Hexagonal Architecture Explained
categories: articles
tags: hexagonal books software-design
---

¡Por fin! 

La publicación de este libro ha sido una gran alegría por varios motivos. Uno de ellos [es personal](/farewell_juan_manuel/), como te habrás podido imaginar si sigues este blog. El otro motivo es que por fin tenemos una guía de referencia autorizada del patrón.

El patrón _ports & adapters_, más conocido por Arquitectura Hexagonal, fue desarrollado por Alistair Cockburn en un proceso que, empezando ya en los años 90, culminaría en 2003 cuando publicó el primer artículo sobre "Hexagonal Architecture" en la _Wiki Wiki Web_ de Ward Cunningham y, ya más formalmente, con el nombre "Ports and Adapters" en 2005, usando el formato de patrones de diseño introducido por _The Gang of Four_ en su libro seminal.

En 2017 Juan Manuel Garrido descubrió el patrón y se volcó en estudiarlo en profundidad, contactando con Alistair Cockburn para consultarle dudas, pedirle aclarar conceptos poco definidos, profundizar en el diseño del patrón y hacer sus aportaciones. Juan desarrolló sus ideas en la web [Hexagonal Me](https://jmgarridopaz.github.io/). Gracias a esta colaboración incansable, no solo se mejoró y afinó la definición del patrón, sino que tenemos este libro en las manos.

## El libro

[Hexagonal Architecture Explained](https://www.amazon.es/Hexagonal-Architecture-Explained-Alistair-Cockburn/dp/173751978X) es un libro relativamente corto (200 páginas), aunque con mucho contenido. En pocas palabras, recopila todo el material generado por sus autores durante estos años.

En el primer capítulo se ofrece una introducción al patrón muy breve, para pasar a una definición más detallada en el capítulo dos. Estoy seguro de que esta definición sorprenderá a más de una persona, tanto por lo que incluye como por lo que no aparece ni mencionado.

El capítulo tres se dedica a mostrar varios ejemplos de problemas abordados usando el patrón, con código. Los dos primeros son relativamente sencillos y el tercero es un completo caso realista: Blue Zone, que trata sobre gestión de una zona de aparcamiento limitado.

El capítulo cuatro se plantea como un capítulo de preguntas frecuentes acerca del _qué_ y del _cómo_ de diversos temas, como lo que es un puerto, los límites de la aplicación y otros muchos. Una vez que entiendes los elementos principales del patrón, este capítulo debería ayudarte a resolver prácticamente todas las dudas que puedas encontrar al implementarlo.

En el capítulo cinco es también una recopilación de preguntas frecuentes, pero esta vez se enfoca en conceptos que pueden relacionarse con arquitectura hexagonal, como DDD o CQRS, o las arquitecturas de capas. Este capítulo resuelve confusiones más teóricas, relacionadas con interpretaciones de AH con respecto a otros modelos de diseño de software o a otros patrones habituales.

El capítulo seis es una recopilación y revisión de los artículos originales, incluyendo una historia detallada del desarrollo del patrón.

El capítulo siete es una casi repetición del capítulo uno. Donde este era introducción, ahora es un resumen. Casi el mismo contenido pero una estructura un poco diferente.

En conjunto se trata de un trabajo muy completo y detallado. Puedes considerarlo como la referencia obligada tanto en el aspecto teórico como práctico, ya que ofrece una guía de implementación bastante completa.

Yo lo he comprado en papel, pero creo que puede ser mejor opción la versión digital. Por cierto, ¿eres capaz de descubrir el sutil error del ejemplo de la página 11? Yo necesité la ayuda de uno de los autores para encontrarlo. Es sutil, no rompe la aplicación, pero es un error con respecto al patrón.

## ¿Es Arquitectura Hexagonal "LA ARQUITECTURA DEFINITIVA"?

Por supuesto que no. _Ports & Adapters_ es una propuesta de diseño de aplicaciones entre otras muchas y es nuestra tarea conocerlas para tomar decisiones sobre su idoneidad para aplicarla a nuestro problema específico.

Podríamos englobarla dentro de una familia de "Arquitecturas limpias" en tanto y cuanto establece unos principios organizativos dirigidos a separar la representación del negocio y aislarla de las tecnologías concretas con las que se implementa, así como organizar las dependencias de una manera coherente.

En comparación con otros modelos, mi opinión personal es que ayuda a resolver mejor el problema de la modularización. Al definir los puertos, en particular los primarios, como conversaciones de los actores con la aplicación, basados en sus necesidades, nos aporta una visión significativa del desarrollo y lo orienta a la resolución del problema de negocio. Esta estructura no la proporcionan las arquitecturas en capas, las cuales suelen plantear bastantes problemas en torno a qué eje de modularización escoger.

La propuesta de Vertical Slicing Architecture plantea una posible solución a la modularización, pero su organización puede resultar bastante más compleja de lo deseado a poco que el sistema crezca. Esto es debido a que su unidad de desarrollo es la _feature_ o caso de uso, que acaba agrupando pero sin definir un criterio claro. Frecuentemente, esto se hace por la entidad u objeto de negocio al que hacen referencia un conjunto de _features_. Sin embargo, esto no deja de ser un criterio bastante técnico y descontextualizado: una misma entidad puede participar en distintas necesidades de negocio que no tienen una relación significativa entre ellas.

En este sentido, Arquitectura Hexagonal proporciona ese criterio de agrupación en el sentido de que un puerto puede englobar varios casos de uso (o _features_ en terminología de VSA) que forman parte de la conversación de una necesidad de negocio. Así, por ejemplo, un puerto _hexagonal_ en una aplicación de gestión académica podría ser _For Managing Students_, con el que se enrolarían estudiantes y se asignarían a sus cursos y grupos, y otro _For Grading Students_, para ponerles las calificaciones, cada uno con sus propios casos de uso.

En cualquier caso, es sorprendente la forma en que se ha popularizado el término y, si vamos a ello, no hay proyecto de software que no esté usando su particular versión de Arquitectura Hexagonal. El único problema es que en la inmensa mayoría de los casos es una versión terriblemente distorsionada. Tanto que es irreconocible. Y muchas veces, lleva a la conclusión de que el patrón _no funciona_.

Este hecho ha sido tanto un motivo de sorpresa para los autores como una indicación de la necesidad de clarificar el patrón y publicar este libro. No me resisto a citar a Alistair Cockburn, cuando dice:

> I'm noticing a whole lot of "when we do it wrong, it doesn't work. So: it doesn't work." for many "it"s. 
> Drives me a little bonkers, because I never know really how to reply.
> "Yep, when you do it wrong, it quite likely doesn't work. I hope you one day get to see how nicely

[Alistair Cockburn](https://x.com/TotherAlistair/status/1806081310584168712)

## Estamos haciendo (y enseñando) mal la Arquitectura Hexagonal

Así que tenemos Arquitectura Hexagonal desde hace más de 20 años y, sorprendentemente (o no), la usamos mal. Y la enseñamos peor.

Mientras escribo esto, he realizado una búsqueda en Google Web de la expresión. Estos son los primeros artículos en español que me han salido:

**[¿Qué Es La Arquitectura Hexagonal? Definición Y Ejemplos](https://apiumhub.com/es/tech-blog-barcelona/arquitectura-hexagonal/)** Es una introducción no demasiado precisa, aunque tampoco del todo incorrecta, pero que no entra en mucho detalle. Sin embargo, remite a un [ejemplo](https://apiumhub.com/es/tech-blog-barcelona/aplicando-arquitectura-hexagonal-proyecto-symfony/) que comete el error de aplicar el nombre de Arquitectura Hexagonal a lo que es una arquitectura de capas con ley de dependencia (Clean Architecture).

**[Arquitectura Hexagonal](https://medium.com/@edusalguero/arquitectura-hexagonal-59834bb44b7f)** Ilustra el concepto usando hexágonos concéntricos, a modo de capas. _Grosso modo_ la idea es correcta, pero las capas no son características, sino de Clean Architecture y la definición de los puertos está muy centrada en el aspecto técnico, cuando en el patrón original un puerto se define por la conversación entre el mundo exterior y la aplicación.

**[Qué es la arquitectura hexagonal, ventajas y desventajas](https://blog.hubspot.es/website/que-es-arquitectura-hexagonal)** Otro artículo que distorsiona bastante las ideas. Habla de puertos de entrada y puertos de salida, cosa que es incorrecta. En AH los puertos pueden ser Primarios o Secundarios. En el primer caso, es un actor el que inicia la conversación con la aplicación: típicamente un consumidor de la aplicación. En el segundo, es la aplicación quien entabla una conversación con el actor, siendo el ejemplo habitual una base de datos. Después de eso, clasifica los adaptadores de la misma forma. Y, para rematarlo, describe Clean Arquitecture, pero en vez de forma circular, lo representa mediante hexágonos.

**[¿Qué es arquitectura hexagonal en programación? ](https://thepower.education/blog/que-es-arquitectura-hexagonal-en-programacion)** Hace una interpretación algo peculiar del patrón, basada en una representación visual, pero en la segunda parte parece romper con ese planteamiento y presenta algo muy parecido al artículo anterior.

**[Arquitectura hexagonal: introducción y estructura](https://wata.es/es/arquitectura-hexagonal-introduccion-y-estructura/)** A este artículo le pasa algo parecido al anterior. Empieza relativamente bien y acaba deslizándose hacia una arquitectura de capas.

Por supuesto, hay muchos vídeos sobre el tema, como este:

[Aprende Arquitectura Hexagonal en 10 minutos](https://www.youtube.com/watch?v=eNFAJbWCSww) Debería titularse _Aprende Clean Architecture en 10 minutos_ porque lo único hexagonal es el dibujo de las capas en los primeros minutos. El vídeo describe el esquema clásico de la _Screaming Architecture_ de Robert C. Martin, con una aproximación un tanto particular de la modularización usando una versión también bastante particular de _Vertical Slicing_.

## ¿Y cual es el problema?

Para muchas personas, esto no es un problema. Es "la versión de x del patrón", que cada quien lo interpreta como mejor sabe.

Sin embargo, es un problema grave. Si existe un término y cada persona tiene una definición de este término, no podemos comunicarnos acerca de ese tema. Por poner un ejemplo: si vas a una entrevista de trabajo y tienes que hablar de Arquitectura Hexagonal, ¿qué versión expones? ¿La original o la distorsionada? ¿Y si expones la original y el entrevistador piensa que la correcta es decir que es una arquitectura de capas?

Esto es algo que veo frecuentemente en el sector: infinidad de versiones propias y distorsionadas de un montón de conceptos, que deberían tener un significado compartido.

## ¿Y qué hay de los artículos de The Talking Bit?

Pues, ni tan mal. Claro que tiene un poco de trampa: tuve ayuda.

En realidad tardé bastante en escribir sobre Arquitectura Hexagonal. Entre otras cosas porque siempre me desconcertó mucho la diferencia que había entre el patrón descrito en el artículo original y las implementaciones que llamábamos _hexagonal_ en los proyectos en los que trabajaba, o en los artículos divulgativos que leía.

Hasta que un día conocí a Juan Manuel, posiblemente cuando yo aún estaba en Twitter, y me remitió a su propio material y me habló de su relación con Alistair Cockburn y su interés personal por AH. Tuvimos muchas conversaciones en las que me iba explicando detalles y dudas, y finalmente conseguí hacer el clic necesario. Fue entonces cuando me decidí a explicarlo en español lo más fielmente posible.

Y, por lo visto, lo he conseguido bastante bien. Hay un par de detalles que posiblemente modificaré en un futuro próximo sobre la forma de los puertos primarios, pero nada importante.

## En resumen

Con el libro _Hexagonal Architecture Explained_ tenemos una referencia completa de este patrón estructural que puede ayudarnos a simplificar nuestra vida como desarrolladoras.

Si realmente tienes interés en entenderlo y, posiblemente, usarlo en tus proyectos, el libro es la mejor fuente disponible y agrega, además, las pocas referencias originales que podrías encontrar on-line.

Eso sí, lo más seguro es que te vuele un poco la cabeza, si estás convencida de que estás aplicándolo ya.
