# La ética de las buenas prácticas


La ética es la rama de la filosofía que se ocupa del "buen vivir". Pero no en el sentido hedonista que podrías imaginar a primera vista, sino en el sentido de lo que es correcto.

Esto es, dado que las personas estamos dotadas de libre albedrío: ¿qué criterios debemos seguir cuando decidimos qué comportamientos adoptar? ¿De dónde salen esos criterios? ¿Cómo se aplican?

## Ética y programación

Ninguna actividad humana puede ser ajena a su consideración desde un punto de vista ético. Y eso incluye, por supuesto, el desarrollo de software, tanto más si tenemos en cuenta su presencia en casi todos los aspectos de nuestra vida.

[El software no es un agente neutral](https://lemire.me/blog/2016/04/29/is-software-a-neutral-agent/), pues el código puede expresar ideas de sus diseñadores acerca de cómo debería funcionar un algoritmo determinado y qué resultados obtendrán las personas que lo utilicen. Pero si esto se aplica al software más o menos determinista, en el que podríamos predecir el resultado a través del análisis del código y juzgar su parcialidad o sesgos, imagina las implicaciones para los algoritmos comprendidos dentro del ámbito de la Inteligencia Artificial y el Machine Learning. Incluso hay quien propone la [creación de organismos que supervisen los algoritmos](https://poseidon01.ssrn.com/delivery.php?ID=544017099074095117027117107028070011027055029016031058025073017064120028095093096074110122119106047059058116072123126120080030102009075041077096104024120106068024006031016046086011126113004112114127127104029106108121019120098088088006127113007101084105&EXT=pdf).

La verdad es que no hace falta irse tan lejos para empezar a reflexionar sobre la ética del desarrollo de software.

Cuando ofrecemos un servicio a través de un programa de ordenador generamos ciertas expectativas en la persona que lo utiliza. Entre otras, podríamos pensar en:

* El programa hace aquello que se supone que debe hacer.
* El programa proporciona su servicio de una manera comprensible y controlable.
* El programa no tiene fallos que den lugar a resultados erróneos.
* El programa no tiene fallos que impidan obtener el servicio que proporciona.
* El programa no hace cosas que no deseo que haga, particularmente sin que lo sepa o lo autorice.

Creo que todas las personas que nos dedicamos al desarrollo de software estaríamos de acuerdo en que estos puntos son exigibles a cualquier aplicación, incluso sin hablar explícitamente de ética.

Podríamos considerar la lista anterior como un conjunto de criterios que definen un software funcional. ¿De dónde han salido?

En cierta medida esa lista es una construcción comunitaria. No está explícitamente codificada en ningún reglamento o en un contrato, pero existe el acuerdo de que el software debería comportarse así. Podríamos decir que esta lista refleja una **moral**.

La moral es la construcción social de la respuesta a la pregunta de qué es lo correcto, un proceso que se desarrolla en la interacción de las personas a lo largo del tiempo. La misma pregunta a la que trata de responder la ética.

Mientras que la moral se construye en los grupos sociales, la ética trata de llegar a definirse a través de la razón, aspirando a ser universal, es decir, a definir valores que puedan ser compartidos por cualquier persona.

## Más allá de que funcione el código

En la lista de criterios de más arriba nos centramos en cuestiones que afectan a cómo funciona el software. Podríamos ver esta lista como una forma de evaluar la funcionalidad del software, pero en el fondo es una evaluación ética: ¿es honesto este software o miente?

Podemos aplicar estas consideraciones a cualquier software, pero parecen más evidentes todavía para aquellos programas que tienen o pueden tener un impacto en la vida de las personas.

Por ejemplo, el funcionamiento incorrecto de un supermercado online puede tener consecuencias tanto para la empresa como para los usuarios, pero muy probablemente estas consecuencias no sean inabordables o irreversibles, más allá de molestias y quizá pérdidas económicas para alguna de las partes. En realidad las consecuencias podrían ser bastante graves, pero ahora querría centrarme en otro aspecto de la cuestión.

Existen diversos ejemplos de software que afectan a cuestiones críticas de la vida de las personas, o cuyo mal funcionamiento podría tener consecuencias graves e irreversibles.

Pensemos, por ejemplo, en un software de ayuda al diagnostico médico o de monitorización de enfermos. ¿Cuáles podrían ser las consecuencias en el caso de que falle o no detecte alguna condición importante? Aquí no estamos hablando de una molestia, un retraso o un perjuicio económico, estamos hablando de la salud o incluso la vida de una persona.

En este tipo de software garantizar su correcto funcionamiento, así como sus límites, se convierte en algo crucial. Incluso sería necesario auditar sus algoritmo en busca de posibles sesgos.

Por ejemplo, Joy Buolamwini ha analizado [los problemas que tienen algunos algoritmos de reconocimiento facial al tratar con personas de piel oscura](https://hackernoon.com/algorithms-arent-racist-your-skin-is-just-too-dark-4ed31a7304b8), destacando cómo las ideas previas pueden condicionar tanto las elecciones tecnológicas (sensores capaces de recoger la información necesaria con independencia del tono de piel) como la selección de las muestras con las que se entrena a estos sistemas.

## Referencias


* [Scott Altman: Ethical Issues in software testing](https://es.slideshare.net/ScottAllman2/ethical-issues-in-software-testing-v4)
* [Michael Stahl: Ethics in Software Testing](https://www.stickyminds.com/article/ethics-software-testing)
* [Bonnie Bailey: Do Software Testers Have Special Ethical Obligations?](https://www.techwell.com/techwell-insights/2013/05/do-software-testers-have-special-ethical-obligations)
* [Rick Scott: The case for Ethics in Software Ethics](https://www.stickyminds.com/article/case-ethics-software-testing)
* [Joe Edelman: Is anything worth maximiizing](https://medium.com/what-to-build/is-anything-worth-maximizing-d11e648eb56f)


# Más ideas para explorar


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



