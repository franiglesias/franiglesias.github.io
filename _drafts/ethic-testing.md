---
layout: post
title: La ética de las buenas prácticas (1)
categories: articles
authors: [Paula Julve, Fran Iglesias]
tags: testing soft-skills ethics
---

La ética es la rama de la filosofía que se ocupa del "buen vivir". Pero no en el sentido hedonista que podrías imaginar a por la expresión, sino en el sentido de la manera correcta de vivir.

Esto es, dado que las personas estamos dotadas de libre albedrío: ¿qué criterios debemos seguir cuando decidimos qué comportamientos adoptar? ¿De dónde salen esos criterios? ¿Cómo se aplican?

## Ética y programación

Ninguna actividad humana puede ser ajena a su consideración desde un punto de vista ético. Y eso incluye, por supuesto, el desarrollo de software, tanto más si tenemos en cuenta su presencia en casi todos los aspectos de nuestra vida.

[El software no es un agente neutral](https://lemire.me/blog/2016/04/29/is-software-a-neutral-agent/), pues el código puede expresar ideas de sus diseñadores acerca de cómo debería funcionar un algoritmo determinado y qué resultados obtendrán las personas que lo utilicen. Pero si esto se aplica al software más o menos determinista, en el que podríamos predecir el resultado a través del análisis del código y juzgar su parcialidad o sesgos, imagina las implicaciones para los algoritmos comprendidos dentro del ámbito de la Inteligencia Artificial y el Machine Learning. Incluso hay quien propone la [creación de agencias oficiales que los supervisen](https://poseidon01.ssrn.com/delivery.php?ID=544017099074095117027117107028070011027055029016031058025073017064120028095093096074110122119106047059058116072123126120080030102009075041077096104024120106068024006031016046086011126113004112114127127104029106108121019120098088088006127113007101084105&EXT=pdf).

La verdad es que no hace falta irse tan lejos para empezar a reflexionar sobre la ética del desarrollo de software.

Cuando ofrecemos un servicio a través de un programa de ordenador generamos ciertas expectativas en la persona que lo utiliza. Entre otras, podríamos pensar en:

* El programa hace aquello que se supone que debe hacer.
* El programa proporciona su servicio de una manera comprensible y controlable.
* El programa no tiene fallos que den lugar a resultados erróneos.
* El programa no tiene fallos que impidan obtener el servicio que proporciona.
* El programa no hace cosas que no deseo que haga, particularmente sin que lo sepa o lo autorice.

Creemos que todas las personas que nos dedicamos al desarrollo de software estaríamos de acuerdo en que estos puntos son exigibles a cualquier aplicación, incluso sin hablar explícitamente de ética. Más aún, creemos que incluso las personas que no se dedican directamente al desarrollo de software, pero que sí son usuarias del mismo, podrían también aceptar esta lista como una serie de pautas que ese software debería respetar para que pueda decirse que funciona correctamente.

Podríamos considerar la lista anterior como un conjunto de criterios que definen un software funcional. ¿De dónde han salido?

En cierta medida esa lista es una construcción comunitaria. No está explícitamente codificada en ningún reglamento o en un contrato, pero existe el acuerdo de que el software debería comportarse así. Podríamos decir que esta lista refleja una **moral**.

La moral es la construcción social de la respuesta a la pregunta de qué es lo correcto, un proceso que se desarrolla en la interacción de las personas a lo largo del tiempo. La misma pregunta a la que trata de responder la ética.

Mientras que la moral se construye en los grupos sociales, la ética trata de llegar a definirse a través de la razón, aspirando a ser universal, es decir, a definir valores que puedan ser compartidos por cualquier persona.

Podríamos decir que escribir software que funcione es un deber moral.

## Más allá de que funcione el código

En la lista de criterios de más arriba nos centramos en cuestiones que afectan a cómo funciona el software. Podríamos ver esta lista como una forma de evaluar la funcionalidad técnica del software, pero en el fondo es una evaluación ética: ¿es honesto este software o, por el contrario, miente?

Podemos aplicar estas consideraciones a cualquier software, pero parecen más evidentes todavía para aquellos programas que tienen o pueden tener un impacto en la vida de las personas.

Por ejemplo, el funcionamiento incorrecto de un supermercado online puede tener consecuencias tanto para la empresa como para los usuarios, pero muy probablemente estas consecuencias no sean inabordables o irreversibles, más allá de molestias y quizá pérdidas económicas para alguna de las partes. En realidad las consecuencias podrían ser bastante graves, pero ahora querríamos centrarnos en otro aspecto de la cuestión.

Existen diversos ejemplos de software que afectan a cuestiones críticas de la vida de las personas, o cuyo mal funcionamiento podría tener consecuencias graves e irreversibles.

Pensemos, por ejemplo, en un software de ayuda al diagnóstico médico o de monitorización de enfermos. ¿Cuáles podrían ser las consecuencias en el caso de que falle o no detecte alguna condición importante? Aquí no estamos hablando de una molestia, un retraso o un perjuicio económico, estamos hablando de la salud o incluso la vida de una persona.

En este tipo de software garantizar su correcto funcionamiento, así como sus límites, se convierte en algo crucial. Incluso sería necesario auditar sus algoritmos en busca de posibles sesgos a favor o en contra de ciertas condiciones.

Por ejemplo, Joy Buolamwini ha analizado [los problemas que tienen algunos algoritmos de reconocimiento facial al tratar con personas de piel oscura](https://hackernoon.com/algorithms-arent-racist-your-skin-is-just-too-dark-4ed31a7304b8), destacando cómo las ideas previas pueden condicionar tanto las elecciones tecnológicas (sensores capaces de recoger la información necesaria con independencia del tono de piel dentro de similares condiciones de luz) como la selección de las muestras con las que se entrena a estos sistemas.

Es decir, si entrenamos un sistema de reconocimiento con ejemplos de personas de piel blanca y rasgos caucásicos, desarrollará un sesgo a favor de este tipo de rostros, teniendo problemas para reconocer los que tienen otro tono de piel o rasgos.

No estamos entrando a discutir software creado intencionadamente para comportarse de manera no ética o ilegal: "malware", virus, troyanos, sniffers y todo un abanico de herramientas diseñadas para causar algún tipo de daño. Entendemos que en este caso, ya se ha traspasado la barrera de la ética, y  no lo consideramos software plenamente funcional en el sentido de que se comporta de manera oculta al usuario, que no está obteniendo lo que espera de él.


## Software desde el punto de vista del usuario ##

Como desarrolladores pocas veces pensamos de igual a igual en los usuarios del código que escribimos. La idea de estos usuarios como seres completamente al margen de nuestro desarrollo y destructores en potencia del mismo está mucho más extendida de lo que nos gustaría admitir aquí. Sin embargo, hay varios puntos sobre los que queremos reflexionar.

* **No existe software sin usuarios.** El software sin usuarios está destinado a la muerte y al olvido. Los usuarios son la razón de la propia existencia de cualquiera de estas herramientas.
* **Todos somos usuarios.** A día de hoy, vivimos rodeados de software. Desde nuestros ordenadores y teléfonos móviles hasta nuestros coches, lavadoras, nuestro sistema bancario, las máquinas de diagnóstico médico, y un largo etcétera. Pocas cosas más complejas que un columpio quedan a día de hoy libres de algún tipo de software. Y nadie en nuestra sociedad puede ya vivir por completo al margen de él.
* **Como desarrolladores, no confiamos en nuestros usuarios. Como usuarios, no tenemos elección.** Por más desconfiados que queramos ser como usuarios, no podemos sino confiar en los semáforos para regular el tráfico de la ciudad. Confiar en el software de la máquina de rayos X que utiliza un profesional médico para determinar nuestro tratamiento. Confiar en que el software del banco que utilicemos no nos cargará dos veces un recibo o perderá nuestros ingresos. No podemos elegir no confiar, porque sencillamente, necesitamos utilizar estos servicios, y no hay ninguna otra alternativa real.

Dentro de este marco, surge la posibilidad de rediseñar la idea que tenemos de los principios de desarrollo de buen software, de nuevo, no ya desde el punto de vista de la desarrolladora, sino de la usuaria del mismo. Así, hemos establecido estos cinco principios:

* **S**tandard behavior
* **M**anageability
* **A**vailability
* **R**eliability
* **T**ruthfulness

* **Standard behavior** Como usuarios, esperamos que nuestro softare se comporte de la misma manera a lo largo del tiempo. No se trata de que todo el software que se escribe se comporte de alguna manera específica, sino de que cada pieza de software con la que interactuamos, mantenga siempre un comportamiento igual o suficientemente similar como para ser reconocible y predecible. Necesitamos poder confiar en que el software que utilizamos se comportará hoy igual que lo hizo ayer.
* **Manageability** Como usuarios, necesitamos ser capaces de manejar el software con el que interactuamos. Aquí hay toda una gama de niveles, desde el software que debe ser más o menos obvio de manera intuiva para nosotros para poder funcionar, como sería el caso de la mayor parte de aplicaciones de móvil, hasta software altamente complejo que requiere un aprendizaje especializado, donde englobaríamos actividades como el uso de maquinaria de diagnóstico médico. El camino puede ser diferente, pero el objetivo es común. La persona usuaria de ese software tiene que poder manejarlo de manera totalmente independiente a las personas desarrolladoras del mismo.
* **Availability** Este concepto engloba también una situación bastante amplia, pero la idea es que como usuarios, necesitamos poder obtener en todo momento el servicio que se supone que el software ofrece. Esto va desde la garantía de que el software está operativo (que las máquinas arranquen el programa debidamente, que no tenga bugs que impidan su funcionamiento, que los servidores estén disponibles), hasta problemas tan complejos como accesibilidad para personas con discapacidad (páginas web con soporte para personas ciegas), o sesgos que como en el caso de Joy, le impiden obtener el servicio de reconocimiento facial por una clara carencia en el algoritmo utilizado.
* **Reliability** Como usuarios, de nuevo, necesitamos poder confiar en que nuestro software hará lo que dice que hace. Si compramos un billete de avión a través de una página web, esperamos que la reserva se registre correctamente y el cobro se realice también de la misma manera. Esperamos que el sistema de frenado electrónico de nuestros coches funcione cuando lo necesitamos. Esperamos que un algoritmo de reconocimiento facial, reconozca nuestro rostro y nos permita interactuar. La falta de fiabilidad del código puede generar todo tipo de consecuencias, desde las más inocuas hasta las más graves, desde no reservar una entrada de cine en la sesión adecuada, a un fallo en un diagnóstico médico con todas las consecuencias que eso pudiera acarrear, o un fallo en el sistema de dirección de un automóvil.
* **Truthfulness** Como usuarios, esperamos que el software que utilizamos no nos mienta. Así de sencillo. Esperamos no estar utilizando malware, claro. Pero también esperamos que grandes empresas como Google, Facebook o Amazon respeten el uso de la información que consiguen de nosotros al utilizar sus servicios. Esperamos que fabricantes como Volkswagen no nos esté engañando con el rendimiento de sus motores. Esperamos que el software haga lo que dice que hace.

Y volviendo a nuestra piel de desarrolladores, pero manteniendo en mente que somos también usuarios, queremos instar a todxs los desarrolladorxs de software a que mantengan los principios que han venido utilizando hasta ahora (SOLID, DRY, etc), a la vez que introducimos esta nueva idea de escribir código **SMART**.

## ¿Qué hace tu código?

¿Te has preguntado alguna vez qué hace el código en el que trabajas? Parece una pregunta con una respuesta evidente. Sin embargo, no es así.

Esa respuesta puede darse en diferentes niveles:

Globalmente, una aplicación tiene un propósito amplio, que a veces puede describirse brevemente. Por ejemplo: usando esta aplicación podrás comprar comida desde tu ordenador. Es una sencilla descripción que apela a conocimientos que ya tenemos para hacernos una idea de cómo funcionaría y qué obtendríamos interactuando con ella.

Sin embargo, para que eso ocurra tienen que darse una serie de procesos y movimientos de información. Sin entrar en muchos detalles, diríamos que la aplicación permite a un usuario elegir productos de un catálogo, y pagar por ellos usando una tarjeta de crédito. Para ello, la información de los productos se recopila y almacena, y se actualizan sus precios y disponibilidad según los movimientos de almacén y ventas. También se almacena y gestiona la información de proveedores y agentes, por no hablar de la información de los compradores y su actividad en la tienda en línea, que se registra para poder elaborar un perfil de consumo y realizar ofertas personalizadas, además de la recoger la información necesaria para efectuar la compra y gestionar los pedidos, entregas, reclamaciones y otros muchos detalles.

Si bajamos a un nivel más técnico hablaríamos de tecnologías subyacentes para implementar cada una de las funciones y podríamos extendernos durante decenas de páginas.

La verdad es que no es tan fácil decir qué es lo que hace nuestro código.

La persona que utiliza nuestro programa ejecuta un acto de fe, de confianza ciega en que sabemos lo que estamos haciendo y en que las expectativas que tiene sobre lo que el software ejecuta se cumplirán, sin mayores inconvenientes ni riesgos.

¿Cómo podemos entonces asegurar que el código hace lo que decimos que hace?

Fundamentalmente hay dos vías que nos lo permiten. La primera consiste en **aumentar la legibilidad del código**.Aunque sea una tarea ímproba leer el código de una aplicación para entender lo que hace, lo cierto es que un código escrito con la legibilidad en mente facilita, además de su mantenimiento, su auditoría. De este modo, se podrían examinar secciones de código para que personas externas puedan hacerse una idea de cómo funciona. Aquí es donde intervienen las buenas prácticas de programación.


## Legibilidad

Teóricamente el código se puede leer y deducir qué es lo que hace interpretándolo.

Para que eso sea posible, el código debe representar el problema que resuelve, los conceptos y operaciones implicados en los diferentes niveles de abstracción.

Volviendo a la idea de la honestidad del código, la forma que tendríamos de evaluarla sería leyéndolo. Escribir código honesto implica adoptar una serie de prácticas.

Los compiladores e intérpretes pueden entender y hacer funcionar los códigos más enrevesados e ilegibles. De hecho, esta estrategia ha sido usada para ocultar el funcionamiento del mismo a miradas curiosas. Precisamente por esa capacidad podemos decidir escribir un código que se pueda leer por personas ya sean éstas otras programadoras que han de trabajar con él, ya sea auditoras que deban certificar qué es lo que el código hace.

Y, para empezar, deberíamos llamar a las cosas por su nombre.

### Naming

Es un hecho conocido que una de las cosas consideradas más difíciles en programación es [poner nombres](https://geekytheory.com/las-9-cosas-mas-dificiles-que-tienen-que-hacer-los-desarrolladores/).

Los nombres representan conceptos y los usamos para razonar y comunicarnos acerca de esos conceptos. Poner y usar los nombres adecuados es un primer caso para que el código sea, no sólo comprensible, sino también fiel reflejo del problema que trata de resolver.

En ese sentido, los nombres siempre deberían ser:

* **Unívocos**: el mismo concepto se representa siempre con el mismo nombre. Una misma denominación no debe tener varios significados en ningún caso.
* **Ubicuos**: los nombres definidos en el dominio de la aplicación están presentes en todos los niveles del código: nombres de clases, variables, métodos, funciones.
* **Precisos**: los nombres deberían describir con precisión los conceptos, intenciones o efectos.

Nombres imprecisos o inconsistentes pueden llevar a la introducción posterior de errores en el código, al perderse el sentido semántico de lo que nuestro software debería estar haciendo. Una base de código crece más rápido de lo que cualquier desarolladora puede mantener en mente en un momento dado. En cada instante, trabajamos sólo en una pequeña parte, una faceta del todo, y es fácil olvidar qué función cumple con respecto al resto del código. Un uso inconsistente de la nomenclatura podría inducirnos a error en cuanto a la función que cumple la pequeña parte en la que estamos trabajando.

### Principios de diseño

Los principios de diseño nos proporcionan criterios para evaluar y tomar decisiones sobre cómo escribimos el código, Los principios de diseño se orientan a la creación de un código inteligible y sostenible, por lo que contribuyen a generar un código honesto.

### Patrones de diseño

Los patrones de diseño nos proporcionan dos elementos principales.

Por una parte, constituyen un vocabulario con el que identificar, describir y resolver problemas de programación que, en esencia, son problemas de cómo describimos las cosas.

Por otro lado, son soluciones eficaces y probadas siempre que se apliquen a los problemas correctas, con lo cual contribuyen a que el software ofrezca la mejor respuesta posible.


No debemos olvidar que rara vez una sola persona escribe una pieza completa de software. Lo más habitual es que varias personas participen en la creación de este software (y quizá también en su auditoría) a lo largo de un período de tiempo relativamente largo. Mantener  patrones consistentes y una buena nomenclatura facilita la legibilidad posterior, y por tanto, el trabajo de cada persona que tenga que ayudar a construir sobre esas bases previas. De la misma manera, como desarrolladores de software, lo mejor que podemos esperar al zambullirnos en un proyecto es que todo el desarrollo anterior se haya llevado a cabo con esta idea en mente, facilitando así nuestra tarea.


## Continuará... ##
Más adelante exploraremos la segunda vía para dar respuesta a la pregunta "qué hace tu código", la credibilidad del mismo. Stay tuned!

## Referencias

* [Scott Altman: Ethical Issues in software testing](https://es.slideshare.net/ScottAllman2/ethical-issues-in-software-testing-v4)
* [Rick Scott: The case for Ethics in Software Ethics](https://www.stickyminds.com/article/case-ethics-software-testing)
* [Joe Edelman: Is anything worth maximizing](https://medium.com/what-to-build/is-anything-worth-maximizing-d11e648eb56f)
