# La ética de las buenas prácticas


La ética es la rama de la filosofía que se ocupa del "buen vivir". Pero no en el sentido hedonista que podrías imaginar a primera vista, sino en el sentido de la manera correcta de vivir.

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

Creemos que todas las personas que nos dedicamos al desarrollo de software estaríamos de acuerdo en que estos puntos son exigibles a cualquier aplicación, incluso sin hablar explícitamente de ética.

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

Pensemos, por ejemplo, en un software de ayuda al diagnostico médico o de monitorización de enfermos. ¿Cuáles podrían ser las consecuencias en el caso de que falle o no detecte alguna condición importante? Aquí no estamos hablando de una molestia, un retraso o un perjuicio económico, estamos hablando de la salud o incluso la vida de una persona.

En este tipo de software garantizar su correcto funcionamiento, así como sus límites, se convierte en algo crucial. Incluso sería necesario auditar sus algoritmos en busca de posibles sesgos a favor o en contra de ciertas condiciones.

Por ejemplo, Joy Buolamwini ha analizado [los problemas que tienen algunos algoritmos de reconocimiento facial al tratar con personas de piel oscura](https://hackernoon.com/algorithms-arent-racist-your-skin-is-just-too-dark-4ed31a7304b8), destacando cómo las ideas previas pueden condicionar tanto las elecciones tecnológicas (sensores capaces de recoger la información necesaria con independencia del tono de piel dentro de similares condiciones de luz) como la selección de las muestras con las que se entrena a estos sistemas.

Es decir, si entrenamos un sistema de reconocimiento con ejemplos de personas de piel blanca y rasgos caucásicos, desarrollará un sesgo a favor de este tipo de rostros, teniendo problemas para reconocer los que tienen otro tono de piel o rasgos.

Otro tema tiene que ver con el software creado intencionadamente para comportarse de manera no ética o ilegal, Los ejemplos más evidentes proceden del campo del llamado "malware": virus, troyanos, sniffers y todo un abanico de herramientas diseñadas para causar algún tipo de daño.

Surgen muchísimas cuestiones en torno a la ética en el desarrollo de software, pero en este trabajo nos centraremos en el aspecto ético de las buenas prácticas en general, y del testing en particular. Y para ello abordaremos un aspecto del código que es obvio y, sin embargo, es terriblemente complejo: su propósito.

## ¿Qué hace tu código?

¿Te has preguntado alguna vez qué hace el código en el que trabajas? Parece una pregunta con una respuesta evidente. Sin embargo, no es así.

Esa respuesta puede darse en diferentes niveles:

Globalmente, una aplicación tiene un propósito amplio, que a veces puede describirse brevemente. Por ejemplo: usando esta aplicación podrás comprar comida desde tu ordenador. Es una sencilla descripción que apela a conocimientos que ya tenemos para hacernos una idea de cómo funcionaría y qué obtendríamos interactuando con ella.

Sin embargo, para que eso ocurra tienen que darse una serie de procesos y movimientos de información. Sin entrar en muchos detalles, diríamos que la aplicación permite a un usuario elegir productos de un catálogo, y pagar por ellos usando una tarjeta de crédito. Para ello, la información de los productos se recopila y almacena, y se actualizan sus precios y disponibilidad según los movimientos de almacén y ventas. También se almacena y gestiona la información de proveedores y agentes, por no hablar la información de los compradores y su actividad en la tienda en línea, que se registra para poder elaborar un perfil de consumo y realizar ofertas personalizadas, además de la recoger la información necesaria para efectuar la compra y gestionar los pedidos, entregas, reclamaciones y otros muchos detalles.

Si bajamos a un nivel más técnico hablaríamos de tecnologías subyacentes para implementar cada una de las funciones y podríamos extendernos durante decenas de páginas.

La verdad es que no es tan fácil decir qué es lo que hace nuestro código.

La persona que utiliza nuestro programa ejecuta un acto de fe, de confianza ciega en que sabemos lo que estamos haciendo y en que las expectativas que tiene sobre lo que el software ejecuta se cumplirán, sin mayores inconvenientes ni riesgos.

¿Cómo podemos entonces asegurar que el código hace lo que decimos que hace?

Fundamentalmente a través de dos vías:

* **Aumentando su legibilidad**: aunque sea una tarea ímproba leer el código de una aplicación para entender lo que hace, lo cierto es que un código escrito con la legibilidad en mente facilita, además de su mantenimiento, su auditoría. De este modo, se podrían examinar secciones de código para que personas externas puedan hacerse una idea de cómo funciona. Aquí es donde intervienen las buenas prácticas de programación.

* **Aumentando su credibilidad** mediante tests. Los tests nos permiten realizar afirmaciones objetivas y reproducibles sobre las capacidades de nuestro software. Además, los distintos niveles de tests nos habilitan para hacerlo en los diferentes niveles de la organización del código: desde las unidades de software a los tests de aceptación, que hablan el lenguaje del dominio y, por tanto, del usuario.

Si tenemos la voluntad de escribir código que sea honesto, las buenas prácticas y el testing son nuestras herramientas. ¿Cómo operan cada una de ellas?

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

### Principios de diseño

Los principios de diseño nos proporcionan criterios para evaluar y tomar decisiones sobre cómo escribimos el código, Los principios de diseño se orientan a al creación de un código inteligible y sostenible, por lo que contribuyen a generar un código honesto.

### Patrones de diseño

Los patrones de diseño nos proporcionan dos elementos principales.

Por una parte, constituyen un vocabulario con el que identificar, describir y resolver problemas de programación que, en esencia, son problemas de cómo describimos las cosas.

Por otro lado, son soluciones eficaces y probadas siempre que se apliquen a los problemas correctas, con lo cual contribuyen a que el software ofrezca la mejor respuesta posible.

## Credibilidad

Las buenas prácticas nos ayudan a escribir código que refleje lo mejor posible nuestros objetivos, intenciones y visión del problema. El código se convierte en un relato.

La honestidad que demuestra un código bien escrito necesita ser apoyada por pruebas que aporte credibilidad. Si de la lectura del código podemos extraer "lo que el código dice que hace", ahora debemos asegurar que "el código hace lo que dice".

Y para eso tenemos el testing.

Tendemos a ver el testing desde la perspectiva de la calidad del software, pero no desde el punto de vista de su credibilidad. Un test puede decirnos si el software bajo prueba funciona correctamente. Pero otra manera de verlo es decir que el test certifica o confirma lo que el código dice.

Hace unos párrafos mencionábamos los distintos niveles de abstracción que tiene el código. De hecho, podemos hacer tests sobre estos distintos niveles que, en conjunto, nos proporcionan una visión de lo creíble que es lo que nuestro código dice.

Así, los tests unitarios nos hablan de la credibilidad de nuestras unidades de software. Podría decirse que demuestran si los conceptos que manejamos están correctamente representados.

Los tests de integración nos demostrarían que las relaciones entre los conceptos en nuestro modelo están adecuadamente descritas en nuestro código.

Finalmente, los tests de aceptación acreditan el funcionamiento del software como solución a un problema o necesidad que tienen las personas que lo usarán.

Otros tipos de tests no funcionales, como los de velocidad, carga, rendimiento, etc, contribuyen a esta credibilidad midiendo la eficiencia con la que el software da respuesta a esas necesidades que dice resolver.


## Referencias


* [Scott Altman: Ethical Issues in software testing](https://es.slideshare.net/ScottAllman2/ethical-issues-in-software-testing-v4)
* [Michael Stahl: Ethics in Software Testing](https://www.stickyminds.com/article/ethics-software-testing)
* [Bonnie Bailey: Do Software Testers Have Special Ethical Obligations?](https://www.techwell.com/techwell-insights/2013/05/do-software-testers-have-special-ethical-obligations)
* [Rick Scott: The case for Ethics in Software Ethics](https://www.stickyminds.com/article/case-ethics-software-testing)
* [Joe Edelman: Is anything worth maximiizing](https://medium.com/what-to-build/is-anything-worth-maximizing-d11e648eb56f)


# Más ideas para explorar

## Código mentiroso

Código mentiroso es el código que no hace lo que dice que hace. Y, como en todo, hay grados:

* El código mal escrito, que tiene errores o no funciona y, por tanto, no hace lo que dice.
* El código que no representa correctamente los conceptos, invariantes y procesos del dominio para el que pretende ser una herramienta.
* El código que, simplemente, no hace lo que se supone que debe hacer.
* El código que hace cosas de manera oculta, además de lo que dice que hace.
* El código que pretende, directamente, engañarnos.


## ¿Cuál es el coste de realizar un mal trabajo?

Definir lo que es un buen o mal trabajo implica haber establecido un conjunto de criterios, un sistema de valores.

En buena parte esta definición tiene que ver con los efectos que produce un buen o mal trabajo, algo que puede ser o no cuantificable, pero que también depende de los efectos que produce.

Veamos algunos ejemplos:

### Código difícil de mantener

El código difícil de mantener puede implicar diferentes costes:

* Si en el futuro es necesario cambiarlo, requerirá más tiempo que si estuviese diseñado para la mantenibilidad. Este tiempo tiene un coste en horas de desarrollo que se puede cuantificar.
* Si ese código tiene fallos, puede ser difícil encontrarlos y subsanarlos. De nuevo, coste de horas de trabajo.

### Software con errores

El software tiene errores.

* Los fallos del software generan problemas a los usuarios del mismo que pueden suponer desde pequeñas molestias a grandes pérdidas, que tienen costes cuantificables pero también intangibles que no podemos prever.
* Los fallos del software pueden generar desconfianza en los usuarios, que podrían decidir utilizar otro producto. Esto tiene un coste directo para nuestra empresa.

### Software mentiroso

El código no hace lo que se espera o no hace lo que dice que hace.

* El código oculta errores que suceden y que, en último término, provocan que el producto o servicio que se espera nunca llegue al usuario.
* El código realiza operaciones de forma oculta para registrar conocimiento sobre el usuario.
* El código se aprovecha de la actividad del usuario para obtener algún tipo de beneficio sin su consentimiento.


 

## Por qué testear

Los motivos prácticos

* Evitar/prevenir errores
* Poder razonar sobre el código y su adecuación a la demanda
* Demostración formal de cómo funciona el código y qué hace

Los motivos éticos



