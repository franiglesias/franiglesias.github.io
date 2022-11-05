---
layout: post
title: Desarrollo iterativo e incremental
categories: articles
tags: good-practices
---

El desarrollo de software ágil va más allá de frameworks como Scrum. En realidad, no los necesita. La clave está en entender qué significa _ágil_.

Agilidad se refiere a la facilidad para cambiar de dirección y a la capacidad de entregar de forma constante. No tiene que ver con velocidad, aunque una vez que se establece un ritmo regular, esta métrica deja de tener importancia.

## Introducción

El principal problema que tiene que abordar un equipo de desarrollo de software es decidir que es lo que debería hacer a continuación.

No importa el tamaño o complejidad de un proyecto. Como reza el proverbio: hasta la caminata más larga empieza con un solo paso. Y después del primero, viene otro, y otro. Cada uno nos acerca un poco más al destino.

Una de las diferencias que tiene el desarrollo de software con respecto a otras ingenierías es que el software puede cambiarse en cualquier momento. Esto posibilita que no sea necesario completar el 100% de un proyecto para empezar a obtener valor del mismo. Además, al contrario que ocurre habitualmente en las ingenierías físicas, es posible cambiar de rumbo en cualquier momento para reaccionar a los cambios del entorno o a los errores.

### Waterfall

En las ingenierías clásicas hablamos de un flujo de trabajo _Waterfall_ en el que tenemos una serie de fases, cada una de las cuales debe completarse antes de pasar a la siguiente:

* Análisis de requisitos
* Diseño
* Implementación
* Pruebas
* Despliegue
* Mantenimiento

El principal problema que plantea este proceso es que si se producen cambios en la necesidad que dio lugar al proyecto puede acarrear una gran discrepancia entre el producto finalmente entregado y las necesidades del negocio en el momento de la entrega.

El ciclo de desarrollo waterfall puede durar meses, incluso años, en los cuales el producto no se puede usar y, en consecuencia, no es posible obtener feedback de sus resultados.

Esta metodología puede funcionar adecuadamente cuando se trata de construir un puente, por ejemplo. Los requisitos no suelen cambiar tan rápidamente como para que el puente no se pueda utilizar una vez construido. Aun así, no es infrecuente que ocurra, especialmente en lo que se refiere a cambios en el uso proyectado. Por ejemplo, puede haber variado el volumen de tráfico que lo use, por razones que no existían en el momento de su diseño.

En cualquier caso, el proceso de diseño y construcción de obras de ingeniería civil tiene varios puntos de no retorno que hacen que incorporar cambios sea realmente costoso y complejo, cuando no imposible.

Pero en software no existe esa limitación. No solo podemos cambiar de rumbo para responder a las necesidades de forma muy rápida, sino que, con las técnicas adecuadas, este movimiento puede resultar bastante fácil y seguro. Especialmente si trabajamos con una actitud abierta al cambio.

### Aceptar el cambio

¿Qué quiere decir esto? Quiere decir que en lugar de temer el cambio, lo integramos como una circunstancia más de la cotidianeidad del desarrollo. Simplemente, aceptamos que los requisitos y necesidades del negocio van a mutar más pronto que tarde y lo mejor es trabajar en previsión de que eso ocurra.

Pero no quiere decir que tengamos previstos todos los rumbos imaginables que pueda tomar el proyecto. Al contrario, se trata de trabajar de tal manera que sea fácil abordar cualquiera de ellos. Para lograrlo es primordial:

* Trabajar en lotes pequeños, de modo que incluso en el caso de tener que revertirlos la pérdida sea mínima.
* Realizar pequeñas y frecuentes entregas de valor, de modo que podamos obtener feedback muy rápidamente y adaptarnos a las necesidades cambiantes.
* Empezar por código simple, que no descuidado, suficiente para lograr desplegar pronto y que sea fácil de entender y cambiar. 
* Aplicar prácticas técnicas como TDD, refactoring, etc., que nos permitan hacer evolucionar el código con seguridad y confianza.

## Trabajo en lotes pequeños

Para desarrollar un proyecto tenemos que aprender a trabajar en lotes pequeños, para lo cual es necesario dividir los proyectos o historias de usuario en piezas con el tamaño adecuado. Tenemos dos enfoques principales: horizontal y vertical.

### División horizontal

En la división horizontal solemos partir un proyecto en función de sus componentes. Esto también es frecuente en la ingeniería física: los distintos componentes se construyen por separado siguiendo unas especificaciones que permitan la interoperabilidad cuando los ensamblamos. De este modo, distintos equipos pueden trabajar en paralelo, optimizando el tiempo de desarrollo. En gran parte, esto es necesario por la especialización de materiales y procesos.

En un proyecto de software, una vez diseñado el sistema, es tentador abordarlo dividiendo el proyecto en subproyectos destinados a desarrollar las distintas piezas que lo componen.

Este sistema de trabajo puede funcionar, pero tiene varias limitaciones y genera diversos problemas. El más importante, probablemente, es que no podemos probar el sistema hasta que todos los componentes están desarrollados y ensamblados. Y, por tanto, no dispongamos de feedback hasta ese momento.

Pero, es perfectamente posible utilizar otros enfoques. Como la división vertical.

### División vertical de historias de usuario

La división vertical se basa en focalizarse en el desarrollo de características (_features_) pro encima del de componentes, haciendo evolucionar el sistema añadiendo comportamientos hasta completar el proyecto. Obviamente, los componentes están ahí, pero empiezan siendo piezas muy simples con una funcionalidad básica que se va haciendo más sofisticada conforme añadimos prestaciones al sistema.

Una rebanada vertical es un fragmento de una historia de usuario que cumple las siguientes características:

* **Vertical**: atraviesa múltiples capas de arquitectura o elementos técnicos. Normalmente, una rebanada vertical contiene elementos de la interfaz de usuario, backend, persistencia, etc. El usuario puede percibir un cambio en las cosas que es posible hacer con el software.
* **Testable**: puedes verificar el comportamiento del sistema con tests. O mejor aún, puedes especificarlo con tests y desarrollarlo con TDD o BDD.
* **Aporta valor al usuario**: los usuarios obtienen algún valor del despliegue de la rebanada. El valor puede beneficiar solo casos de uso específicos, o grupos de usuarios. Tiene que proporcionar valor en cada rebanada.

## Recursos

### Historias de usuario

Una historia de usuario expresa un desea acerca del valor esperado de un sistema de software desde la perspectiva del usuario. Típicamente, escribimos una historia de usuarios usando esta plantilla:

Como [role] quire [hacer algo con el sistema] de modo que [obtenga un beneficio del mismo]

Esta declaración debería caben en una tarjeta (típicas tarjetas de 15 x 10 cm). 

El siguiente paso debería ser una conversación entre el equipo de desarrollo y el usuario o usuarios interesados en la historia, de manera que todos juntos puedan definir una manera de proporcionar valor al usuario. Como resultado de esta conversación, deberían definirse criterios de aceptación para que sea posible testar la implementación.

### Orientaciones INVEST para definir historias de usuario

* **Independiente**: puedes construirla y distribuirla aisladamente. Esto puede ser difícil de conseguir.
* **Negociable**: la historia expresa una necesidad y es el comienzo de de una conversación para obtener el contexto y decidir sobre los detalles de como implementarla.
* **Valiosa**: la historia proporciona valor al usuario una vez desplegada. La priorización de historias debería ser guiada por el valor de negocio, por lo que tendrías que conocerlo.
* **Estimable**: puedes estimar el coste de hacer la historia, así puedes decidir si merece la pena para el valor que aporta. Si no puedes estimarla, es posible que necesites rebanarla más. Aquí estimación no significa puntos de historia o tiempo.
* **Pequeña (Small)**: puede realizarse en una iteración o _sprint_. Esto depende de los equipos, una iteración puede durar horas o días.
* **Testable**: puedes verificar que la necesidad expresada en la historia es satisfecha por la implementación usando los criterios de aceptación. Mejor si se hace mediante tests de aceptación automáticos como los que proporciona BDD.

### Técnicas de rebanado

Cuando tienes que abordar una historia de usuario grande o un proyecto, puedes aplicar distintas técnicas para obtener un buen rebanado vertical que ayude al equipo a entregar valor en pequeños lotes de bajo riesgo.

* [SPIDR](https://ascendle.com/ideas/spidr-an-alternative-method-for-splitting-user-stories/)
* [Seven Proven Strategies for Story Slicing](https://medium.com/agilegreat/story-slicing-216af738ef4c)
* [The Humanizing Work Guide to Splitting User Stories](https://www.humanizingwork.com/the-humanizing-work-guide-to-splitting-user-stories/)
* [Why Most People Split Workflows Wrong](https://www.humanizingwork.com/why-most-people-split-workflows-wrong/)

**Spike**: un spike es un experimento que hacemos para aprender algo acerca del problema. Un spike debe responder preguntas concretas y nada más que esas preguntas. Podemos rebanar las historias usando los resultados de ese spike.

**Paths**: Identifica los diferentes paths o flujos de la historia de usuario (happy, sad, etc.). Identifica variaciones en esos flujos (métodos de pago, filtros, etc.). Rebana basándote en los flujos que hayas identificado. Ejemplo:

```text
Como usuario quiero comprar y pagar por productos

Como usuario quiero comprar un producto pagando con Stripe
Como usuario quiero comprar varios productos pagando con Stripe
Como usuario quiero comprar un producto pagando con Paypal
Como usuario quiero comprar varios productos pagando con Paypal
Como usuario quiero comprar varios productos y escoger el método de pago
```

Con frecuencia el primer flujo es más complejo que los otros porque tenemos que diseñar e introducir componentes que no teníamos. Al mismo tiempo, el resto de flujos será más fácil de implementar gracias a eso. Para ello conviene diseñar sistemas simples que sean fáciles de extender o cambiar en el futuro.

Aparte, si alguno de los flujos nos parece muy amplio, siempre podremos aplicar otras estrategias para rebanarlo.

**Interface** Identifica las diversas interfaces que tiene que ofrecer el software (CLI, web, mobile, desktop, etc.). Identifica variaciones en ellas (mobiles iOs, Android; desktop: mac, windows, linux; web: chrome, safari, edge...). Rebana basándote en las variaciones que has identificado. Puedes usar diferentes criterios, como número de usuarios, ingresos esperables, facilidad de desarrollo...

Ejemplo: una situación típica es tener una aplicación web y aplicaciones móviles. Podríamos empezar desarrollando la versión web para móviles porque esperamos que la mayor parte de usuarios accedan a al app usando sus teléfonos y porque es más fácil empezar el desarrollo por web mobile y escalarlo luego a la pantalla de desktop. Y la versión mobile de una web es utilizable en desktop, cosa que puede no ocurrir a la inversa.

**Datos y parámetros** Identifica los distintos tipos de datos o parámetros que necesitas gestionar. Identifica si es posible expresarlos en formatos comunes.

Ejemplo: las fechas se pueden introducir como campos de texto, que son fáciles de implementar, de modo que podemos proporcionar valor antes. Usaremos un date picker en una iteración futura. El primer método es propenso a errores por parte del usuario, pero le permite trabajar antes y proporcionarnos feedback.

**Reglas de negocio**. Identifica y aísla las reglas de negocio que se aplican a la historia. Crea una historia por regla. Agrupa aquellas que estén muy relacionadas y puedan implementarse en la misma rebanada.


## El valor del rebanado vertical

Para entender el valor de un rebanado vertical fino podemos usar estas pseudo-gráficas.

Con una sola entrega de un proyecto o historia de usuario compleja nos encontramos con que:

* El cliente tiene que esperar por obtener algún valor
* El ciclo de feedback es muy largo: no empezamos a obtener feedback hasta que entregamos
* Es tarde para reaccionar a cambios o problemas: al entregar el proyecto finalizado no hemos podido incorporar cambios que hayan surgido en el interín.
* Es difícil recular: si la dirección del desarrollo ha sido incorrecta por alguna razón, volver atrás y reconducirlo puede ser complicado y costoso.

![](/assets/images/iterative/iterative.001.png)

Podemos mejorar las cosas haciendo rebanadas gruesas. Esto introduce puntos de cambio y ciclos de feedback más cortos, dado que el cliente recibe valor antes y puede probar el producto y darnos sus opiniones.

Aún así, el tamaño de las rebanadas puede ser mejorable.

![](/assets/images/iterative/iterative.002.png)

Con rebanadas muy finas, el cliente recibe el valor muy pronto. Posiblemente a diario o incluso varias veces al día. El ciclo de feedback es muy corto, lo que permite reaccionar fácilmente a cambios o problemas encontrados.

Al ser entregas pequeñas, son fáciles de deshacer.

![](/assets/images/iterative/iterative.003.png)

## El proceso

Cada paso debe tener UI, input y output, y ser visiblemente diferente respecto del anterior. Debemos entregar valor en cada iteración. Es cierto que, al principio, nuestras primeras iteraciones podrían tener un valor muy limitado porque necesitamos atender a temas técnicos a fin de poder entregar valor de negocio. Por ejemplo:

* Preparar un proyecto
* Preparar la infraestructura suficiente para poder desplegarlo
* Disponer una pipeline básica de integración continua
* Disponer una pipeline básica de despliegue

### Por qué tan pequeño

Las rebanadas verticales muy fina pueden implementarse en muy poco tiempo. Esto nos habilita para ponerlas cuanto antes en producción y empezar a obtener feedback también cuanto antes. Puede que en cuestión de horas.

De esta forma podemos reacciones más rápidamente a cualquier cambio o detectar problemas antes de que se hagan demasiado grandes. Podemos incluso revertir los cambios si los problemas son realmente grandes, y no habremos perdido mucho.

Y lo más importante, estamos proporcionando algún valor a nuestros usuarios tan pronto como ha sido posible.

Por otro lado, una vez que hayamos adquirido práctica rebanando historias, eliminaremos la necesidad de estimaciones. Esto es porque a partir de cierto punto llegaremos a definir rebanadas lo bastante pequeñas como para desplegar de forma regular y predecible. De este modo, llegaremos a saber que podemos entregar un cierto número de rebanadas en una semana, por ejemplo.,

### Hitos posibles en el desarrollo

**Walking skeleton**. El esqueleto andante sirve para tener los componentes principales de la aplicación definidos y enlazados, aunque aún no tenga funcionalidad real. Puede ser algo tan simple como tener un "Hello, World" que nos permite saber que la aplicación está disponible, que se puede usar y que puede proporcionar un cierto output. En el mundo real, este tipo de aproximación nos sirve para reducir riesgos, establecer el proyecto, crear los entornos de desarrollo, las _pipelines_, etc.

**Hardcoding**. El siguiente paso puede ser dar soporte a un único caso de uso, con los valores necesarios incorporados en el propio código. Aunque la aplicación sea inflexible y solo atiendas a un grupo muy específico de usuarios este hito nos permitirá entender los flujos de usuarios y puede que incluso nos permita abrir el servicio para pruebas con usuarios reales.

**Requisitos legales**. A la hora de priorizar, cumplir requisitos legales debería ir antes que algunas reglas de negocio. Por ejemplo, maneja los impuestos antes que los descuentos y promociones. Lo primero hará que una factura sea legal y válida y la puedas cobrar.

**UI**. Comienza con controles simples y suficientes, como inputs de texto, aunque no sean los más adecuados y hazlos evolucionar una vez que sabes que el proceso funciona. El ejemplo más típico es la introducción de fechas. Es mejor empezar al principio con un cuadro de texto, que puedes implementar enseguida, que un _date-picker_, que requiere más tiempo de desarrollo. Además, una vez que los usuarios comienzan a trabajar con la aplicación podrías obtener información interesante para decidir el tipo o las características que debe tener el _date-picker_.

## Hacia la entrega continua

Para lograr una capacidad predecible y regular de entrega de valor tendrás que adoptar el enfoque de rebanado vertical de proyectos e historias de usuario.

Con este enfoque podrás lograr ciclos de feedback más cortos de tus clientes, que te permitirán reaccionar con menos coste a las nuevas demandas. Además, la información te permitirá decidir los próximos pasos de manera más acertada.

Los proyectos se construyen en capas de funcionalidad, empezando con elementos muy básicos, e introduciendo prestaciones más sofisticadas de una forma sostenible y progresiva. 
