---
layout: post
title: Introducción a la Arquitectura Hexagonal
categories: articles
tags: design-patterns
---

Nunca hasta ahora me había atrevido a tocar el tema de la arquitectura hexagonal, pero después de bastantes lecturas, varias charlas y algunas conversaciones, voy a intentar explicarla con mis propias palabras.

## Qué es esto

La arquitectura hexagonal, o _puertos y adaptadores_, es un patrón estructural con el que buscamos que una aplicación sea independiente de tecnologías concretas. Esto permite que pueda ser testeada fácilmente, y también que se pueda interactuar con ella a través de diversas interfaces (API, aplicación web, línea de comandos) y que sea posible utilizar distintas tecnologías de persistencia, comunicaciones, etc.

[El patrón](https://alistair.cockburn.us/hexagonal-architecture/) fue propuesto inicialmente por [Alistair Cockburn](https://alistaircockburn.com) alrededor de 2005, como respuesta a estos tres problemas:

* La dificultad para testear sistemas usando tests automáticos debido a lógica dependiente de detalles de la interfaz gráfica o, en general, de tecnologías específicas como bases de datos.
* La imposibilidad o gran dificultad de convertir sistemas manejados por humanos en sistemas automatizados.
* La imposibilidad o gran dificultad de hacer que un programa pueda ser manejado por otro programa.

Actualmente, considero que las mejores fuentes de información son:

* [Hexagonal me](https://jmgarridopaz.github.io), por Juan Manuel Garrido de Paz. Juan Manuel colabora bastante estrechamente con Alistair y, probablemente, ha tenido un papel importante en que se hayan clarificado conceptos y definiciones del patrón que originalmente eran un poco vagos o confusos.
* [Valentina Cupać](https://www.youtube.com/watch?v=bKxkIjfTAnQ&list=PL1msPBH9ZGkhpANkreFA_teOnloVdLuCx) que tiene una serie de vídeos explicando Arquitectura Hexagonal que toman como referencia el material original.

¿Y por qué añadir ruido con un artículo más por mi parte? Pues como suelo hacer siempre: uso estos artículos para consolidar mi aprendizaje y creo que ya estoy listo para abordar este tema.

## Hacemos mal la arquitectura hexagonal

Es raro el equipo de desarrollo que no diga que está haciendo Arquitectura Hexagonal en sus proyectos. Es raro el equipo de desarrollo que la esté haciendo realmente.

La prueba de esto, en mi caso, es que en la inmensa mayoría de los proyectos en los que he estado era prácticamente imposible testear el sistema de forma completa y automatizada, fuera de algunos intentos parciales con Selenium y otras herramientas para hacer tests a través de la interfaz web, etc. Por no hablar de las dificultades impuestas por tecnologías como bases de datos, sistemas de mensajería, etc.

Por otro lado, la estructura de muchos de estos proyectos se articulaba en torno a las consabidas carpetas o capas: dominio, aplicación e infraestructura, las cuales no están prescritas por la definición de Arquitectura Hexagonal. Hay que decir que tampoco están prohibidas, pero en ningún caso existían los conceptos de ports o de adapters.

Quizá podíamos encontrarlos en la aplicación, a veces laxa, de la Ley de Dependencia de las arquitecturas limpias, según la cual las capas concretas (infraestructura) deben depender de las abstractas (dominio). Esto es correcto y, hasta cierto punto, es parecido a lo que propone Arquitectura Hexagonal al hablar de puertos y adaptadores. Pero, en cualquier caso, no es lo mismo.

Otra confusión frecuente, de la que ya he hablado en el blog, es la identificación entre Arquitectura Hexagonal y Domain Driven Design. En parte porque existe una visión reduccionista del Domain Driven Design como utilización de algunos patrones tácticos y la idea de que propone una arquitectura concreta con capas Dominio, Aplicación, Infraestructura y Ui. Algo que no es, tampoco, exactamente así.

Al fin y al cabo, DDD es más una forma de abordar la complejidad del desarrollo de sistemas de software empresariales que empieza por decidir qué es lo que la empresa debería estar desarrollando y lo que no, para seguir profundizando en cómo identificar los distintos dominios, la relación entre estos y, finalmente, la forma en la que implementar cada uno de ellos. En este nivel de implementación, la arquitectura hexagonal es una de las posibles formas de abordarla, pero hay otras.

En cualquier caso, no es incompatible aplicar el patrón _ports and adapters_ y combinarlo con propuestas de arquitecturas limpias, como veremos.

Pero sí. El panorama del uso de la Arquitectura Hexagonal no es precisamente alentador. Así mismo, la forma en que se explica y se divulga en algunos blogs y cursos, tampoco es precisamente correcta.

Así que vamos a intentar hacerlo un poco mejor y poner énfasis en algunos de los errores más comunes

## Application vs the World

En algún artículo anterior he mencionado que una aplicación contiene:

* Un modelo de la parte del mundo de la que se ocupa
* Una representación de las intenciones de las posibles usuarias
* Las tecnologías concretas necesarias para hacerla funcionar

El modelo del mundo es lo que solemos llamar dominio y contiene una representación de los **conceptos y procesos** propios del problema que estamos intentando resolver.

La representación de las intenciones de las usuarias define **casos de uso**, que se implementan haciendo interactuar los conceptos definidos en el modelo de dominio.

Finalmente, las tecnologías concretas implementan las acciones necesarias para llevar a cabo esas intenciones. Eso incluye desde aquellas que nos permiten interactuar con la aplicación, como podrían ser la línea de comandos, una interfaz web, o una interfaz gráfica nativa de una determinada plataforma o una API REST o cualquier otra forma de interaccionar con la aplicación; hasta aquellas que nos proporcionan persistencia de información, comunicaciones con otros servicios, interacción con dispositivos físicos, etc.

Para representar el modelo del mundo nos basta con un lenguaje de programación y esta sería la única dependencia técnica que nos exige esta representación. Independientemente de las cualidades de cada lenguaje para abordar diversos tipos de problemas o requerimientos. Igualmente, los casos de uso pueden describirse haciendo interaccionar estos conceptos usando el mismo lenguaje. En ese sentido, tenemos toda la libertad del mundo, dentro de los límites que imponga el lenguaje concreto, para expresar cualquier idea.

Pero en la práctica, para hacer funcionar una aplicación necesitamos utilizar tecnologías específicas. El software se ejecuta sobre un sistema de componentes, cada uno de los cuales define una forma de interactuar. Por ejemplo, una base de datos relacional nos permitirá usarla a través de un dialecto del lenguaje SQL, que será ligeramente distinto al de otros fabricantes. Un sistema externo puede permitirnos interactuar mediante una API REST para hacer consultas o comunicarle datos. También nuestra aplicación puede permitir comunicarse con ella exponiendo una API REST o una línea de comandos o lo que sea necesario. Por no hablar de elementos como los sistemas de archivos, ya sean locales, ya sean en la nube y un largo etcétera.

Históricamente, ha sido, y sigue siendo, muy frecuente que las aplicaciones se hayan desarrollado con algunas de estas tecnologías en mente quedando irremediablemente acopladas a las mismas, de tal forma que el modelo del mundo ha resultado contaminado por detalles de la tecnología de persistencia o de la interacción con el sistema.

¿Cuál es el problema? Pues que las aplicaciones tienen que evolucionar no solo para dar respuesta a nuevos casos de uso, sino a nuevas formas de utilización y distribución. Lo que hace unos años se desplegaba en forma de ejecutable para una plataforma específica, hoy se expone vía web y se implementa mediante servicios en la nube, a la vez que se interactúa con aplicaciones móviles y de escritorio, o se exponen API porque se quiere ofrecer como servicio.

La cuestión clave es que el modelo del mundo, o dominio, ha de ser el mismo aunque existan decenas de formas de implementarlo y no es ni económico, ni razonable, mantener decenas de versiones que deben estar sincronizadas.

Además, está el problema del testing. ¿Cómo pruebas una aplicación si cada test debe atravesar capas de tecnología que raramente pueden insertarse con comodidad en un test? Bien sea porque imponen una penalización al propio test en cuanto a velocidad de ejecución, bien porque entonces el test solo vale para esa implementación concreta.

En consecuencia, una buena arquitectura debería permitirnos combinar el mantener un modelo de dominio único, combinado con un número indefinido de implementaciones y la posibilidad de testear su modelo de dominio de forma completa y aislada, así como testear las diversas implementaciones de forma separada también.

## Arquitecturas limpias al rescate

Para solucionar estos problemas se han propuesto diversas arquitecturas de aplicación. Por lo general, todas adoptan un patrón similar:

* Una capa o sección para la representación del modelo del mundo o dominio
* Una capa o sección para la representación de los casos de uso
* Una capa o sección para las implementaciones basadas en tecnologías, típicamente llamada de infraestructura
* En algunos casos, una capa o sección de interfaz de usuario

Además de estas capas, se define una regla de dependencia, que indica, a grandes rasgos, que las dependencias deben apuntar hacia la capa de dominio. Esto quiere decir que, o bien las otras capas usan los objetos de la capa de dominio, o bien implementan las abstracciones definidas por la capa de dominio (interfaces).

Es muy típico que estas arquitecturas se representen mediante círculos concéntricos. Y esto, en cierto sentido, ha sido un problema como explicaré dentro de un momento.

![Diagrama mostrando la clásica representación en círculos concéntricos de una arquitectura limpia](/assets/images/ha/clean_architecture.png)

La capa de dominio se dibuja como el círculo más interior. Con esto se quiere conseguir dos cosas:

* Indicar que no tiene contacto con el mundo exterior, sino que son las otras capas las que vehiculan la comunicación, particularmente la capa de los casos de uso.
* Indicar la dirección de la regla de dependencia en el sentido de que todas las dependencias apuntan al centro de la circunferencia.

La capa de casos de uso se llama también capa de aplicación y rodea a la capa de dominio. De este modo, queda claro que toda interacción del mundo exterior se debe realizar a través de ella. No importa de donde venga. Los casos de uso de la capa de aplicación utilizan los objetos del dominio para realizar las tareas en las que las usuarias están interesadas.

Los problemas vienen con la capa de infraestructura y de UI. Lo cierto es que no tiene mucho sentido que se representen como capas que envuelven toda la aplicación. En el caso de la de UI podría serlo, al menos si consideramos que representa todos los elementos que conecten físicamente la aplicación con el resto del mundo. Pero la UI deja fuera elementos de infraestructura que no encajan en esa definición precisa, como pueden ser bases de datos y que se suelen considerar como parte de la propia aplicación.

Por otro lado, la infraestructura es un término que sí puede incluir perfectamente los elementos de UI. Por esa razón, suele ser más habitual  que sea la capa de infraestructura la que se represente como capa exterior, que está entre la de aplicación y el mundo. Pero eso no deja de ser una representación un tanto confusa. ¿Cuál es el problema? Pues que hay diversas tecnologías que ayudan a implementar la aplicación que incluyen sistemas de persistencia, comunicaciones, interacción, sistemas locales, etc. Algunos son accionados por actores externos (usuarias, tests, otros sistemas clientes) y otros son accionados por la aplicación que los usa como cliente. Este tipo de distinciones no suele hacerse en las representaciones habituales de la arquitectura.

Por otro lado, una forma típica de intentar poner orden en esta capa es organizarla a través de intereses comunes: persistencia, cliente de comunicaciones, api rest, mensajería, notificaciones, etc, etc. Muchas veces con excesivo énfasis en lo que podríamos considerar una categorización técnica.

## De repente... un hexágono

En muchos sentidos, la arquitectura hexagonal no representa una ruptura con las arquitecturas limpias, sino más bien un refinamiento que las hace más inteligibles y resuelve algunos de los problemas. Vamos por partes.

El nombre viene de representar la aplicación como un hexágono, no porque el patrón postule exactamente seis divisiones, sino porque es una forma poligonal simétrica que expone caras representando interacciones específicas con el mundo exterior. El hecho es que cada lado del polígono representa un puerto o forma de interacción entre el exterior y el interior de la aplicación. Una aplicación puede exponer cualquier número de puertos, por lo que un nombre más atinado quizá hubiese sido _Arquitectura Poligonal_. Y si no, _Ports and Adapters_, que es el nombre alternativo.

![Diagrama mostrando los elementos característicos de la arquitectura hexagonal que se describen en el texto](/assets/images/ha/hexagonal_architecture.png)

En la arquitectura hexagonal el modelo del mundo (los objetos y reglas de negocio) están separados del mundo físico. La diferencia es que la arquitectura hexagonal no hace distinción entre la capa de dominio y los casos de uso. Juntas conforman la aplicación o "interior" del hexágono. Como he visto citar a Juan Manuel alguna vez, la aplicación en AH equivale a la suma de Dominio y Aplicación en otros modelos.

La potencia de este patrón radica en que puedas construir una aplicación que representa tu dominio o negocio sin preocuparte de qué tecnologías específicas vas a necesitar, posponiendo las decisiones hasta el momento en que tienes el conocimiento suficiente para tomarlas. 

Esto implica que toda la funcionalidad de negocio de la aplicación está representada dentro del hexágono, mientras que fuera se encuentran todos los elementos necesarios para interaccionar con el mundo exterior. Y para ello, necesitamos hablar de los conceptos de Puerto y de Actor.

### Los actores

Los actores son elementos del mundo físico que interactúan con la aplicación pudiendo ser seres humanos, otros sistemas, soluciones tecnológicas, etc. Podemos clasificarlos en dos grupos:

* **Driver actors**: son aquellos que piden a la aplicación que haga algo, iniciando la interacción. Actores típicos son personas, pero también tests, y sistemas clientes de nuestra aplicación.
* **Driven actors**: son aquellos a quienes la aplicación les pide que hagan cosas, iniciando ella la interacción. Aquí podemos tener bases de datos, otros sistemas que proporcionen algún servicio a la aplicación, etc.

Estas interacciones responden a distintas finalidades, las cuales definen los puertos. Y esta es probablemente la aportación más distintiva y, probablemente peor entendida, de la arquitectura hexagonal. Un puerto no define simplemente un protocolo técnico que permita a los actores y a la aplicación comunicarse. Un puerto define una necesidad de comunicación y la forma de llevarla a cabo.

No siempre es posible tener claros cuáles van a ser todos los actores, particularmente los _driven_, ya que es algo que puede descubrirse una vez que empieza el desarrollo de la aplicación y es necesario introducir tecnologías concretas para lograr algunos objetivos.

### Los puertos

Imaginemos una aplicación de marketplace. Un actor típico será una persona, que quiere poder comprar ciertos productos, para lo que necesitará poder buscarlos y pagarlos. Pero hay otros posibles actores, con otras necesidades. Por ejemplo, vendedores que quieren poder ofrecer sus productos en el marketplace, por lo que necesitarán registrarlos y gestionar sus páginas.

A fin de poder proporcionar esas funcionalidades, la aplicación necesitará guardar el catálogo de productos en algún sistema de base de datos que permita realizar búsquedas, así como añadir productos a los vendedores. También necesitará, por ejemplo, preservar el contenido de los carros de compra de los compradores mientras dure su interacción, o incluso entre visitas. Por supuesto, necesitará permitir la posibilidad de pagar los productos comprados. O notificar a los almacenes y vendedores para solicitar el envío de mercancía.

Todas estas finalidades definen los puertos que, al igual que los actores podríamos clasificar en:

* **Driving** o **driver ports**: los puertos que utilizan los _driver actors_ para usar la aplicación.
* **Driven ports**: los puertos que usa la aplicación para comunicarse con los _driven actors_ y poder cumplimentar sus necesidades.

Dado que los puertos se definen por necesidades, una forma de ponerles nombre sería con la fórmula:

```
"para" + verbo + objetos de la acción.
```

En el caso de los _driver_:

* Para comprar productos
* Para registrar productos
* Para gestionar páginas

Y ejemplos de _driven ports_:

* Para actualizar el catálogo
* Para mantener el carro de la compra
* Para notificar pedidos
* Para pagar


Desde el punto de vista del código, los puertos se definen mediante constructos del lenguaje de programación.

Para los _driving/driver ports_ se definen interfaces de casos de uso que los adaptadores deben **usar**, junto con DTO que la aplicación entregará como respuesta a la acción de estos casos de uso. Lo cierto es que son interfaces que van a tener una única implementación, pero nos interesa hacerlo así para poder hacer dobles que nos permitan testear los adaptadores.

Para los driven ports se definen interfaces que los adaptadores deben **implementar**. Los driven adapters recibirán y, posiblemente, entregarán objetos de dominio, por lo que tendrán que poder extraer las representaciones de esos objetos que convengan a su implementación específica.

### Los adaptadores

Los adaptadores son implementaciones concretas de tecnologías para poder interactuar con los puertos de la aplicación. Obviamente, se clasificarán en dos tipos:

* **Driving adapters**, que **emplean** los driving ports para utilizar la aplicación.
* **Driven adapters**, que **implementan** los driven ports para que la aplicación pueda usar las soluciones tecnológicas que se hayan decidido.

Es muy importante señalar que puede haber más de un adaptador por puerto. Es más, como mínimo deberíamos tener dos: un adaptador de producción y un test que lo ejercite o, en el caso de los driven, una o varias implementaciones ligeras que podamos usar como dobles de test.

Ejemplos de adaptadores son:

* Controladores que exponen los endpoints de una API REST. Su responsabilidad es atender las request HTTP e invocar el caso de uso correspondiente, así como utilizar su respuesta para generar la respuesta HTTP del endpoint.
* Una interfaz web, cuyos controladores invocan los casos de uso.
* Comandos de CLI, que pueden ser ejecutados por una persona o automatizados mediante un cron o algún otro disparador.
* Repositorios para persistir y recuperar entidades de la aplicación utilizando diferentes tecnologías de bases de datos.
* Adaptadores para publicar mensajes mediante brokers.
* Adaptadores para notificar a usuarios por diversos medios, como email, slack, SMS, etc.
* Servicios de almacenamiento de archivos en la nube.
* Adaptadores para obtener la hora o la fecha.
* Adaptadores para guardar archivos localmente.

Todos estos adaptadores se ubican _fuera_ del hexágono.

## Y en el próximo capítulo...

En las próximas entregas hablaremos más detalladamente de cómo se traduce la arquitectura hexagonal en código:

* Diferentes organizaciones del código para representar la arquitectura
* ¿Se hacen "capas" en hexagonal o no?
* ¿Dónde acaba la aplicación y terminan los adapters?
* ¿Los puertos siempre son interfaces?
