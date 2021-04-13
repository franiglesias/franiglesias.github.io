---
layout: post
title: Más allá de SOLID, principios básicos
categories: articles
tags: good-practices design-principles
---

Los principios de diseño de software no son recetas ni objetivos, son guías para la toma de decisiones y para la evaluación.

## Qué es buen código

Es muy complicado definir qué es buen código. Entran en juego toda una serie de factores, incluyendo preferencias personales o su ajuste a un contexto determinado. El buen código funciona, por supuesto, pero también esperamos que tenga algunas características más: que sea robusto, reutilizable, testeable, bien organizado, legible y sostenible.

¿Qué significa cada una de estas propiedades? ¿Son medibles o auditables? En la mayor parte de los casos podemos dar definiciones aproximadas que, por desgracia, pueden tener mucho que ver con preferencias personales. En cuanto a la medición de las mismas, es posible que solo podamos tomar medidas relativas, del tipo *más que ayer, pero menos que mañana*. Veamos:

**Robusto.** Diríamos que el código es robusto si está libre de defectos, si la tasa de fallos es reducida o nula, si es capaz de gestionar ciertas condiciones adversas, como la caída de redes o servicios de los que depende.

**Reutilizable.** El código es reutilizable si podemos usar la misma funcionalidad con distintos datos, incluso en otros contextos.

**Testeable.** Decimos que el código es testeable cuando podemos construir un test que verifique su comportamiento, con la seguridad de que el resultado del test es función de la ejecución del código probado y no está influenciado por factores externos.

**Bien organizado.** El código bien organizado nos permite localizar e identificar fácilmente una determinada sección que nos interesa examinar, incluso aunque no lo conozcamos bien.

**Legible.** El código legible es aquel que al leerlo nos comunica su intención.

**Sostenible.** Es sostenible aquel código que nos permite modificar o extender la funcionalidad sin provocar defectos y con el mínimo esfuerzo posible.

En conjunto, podemos decir que todas estas características son deseables para cualquier base de código. Sin embargo, es difícil afirmar en qué grado es suficiente haberlas desarrollado para considerarlo satisfactorio. Personalmente, diría que podemos aspirar a un código suficientemente bueno que siempre es mejorable, pero no existe el código perfecto.

En buena medida esto ocurre porque **el código es una expresión de un conocimiento compartido sobre el problema que intenta resolver o ayudar a resolver**, un conocimiento que siempre es incompleto y refinable. Además, es también el resultado de nuestra capacidad para expresar ese conocimiento en un lenguaje de programación, capacidad que siempre puede crecer como resultado de la experiencia y el aprendizaje.

Puede que sea más fácil definir lo que no es buen código. El mal código carece de las propiedades que hemos mencionando anteriormente:

* No hace lo que se espera que haga, o lo hace de forma manifiestamente incompleta o equivocada.
* Tiene múltiples fallos y problemas, no funciona si alguna condición externa es adversa.
* No es reutilizable.
* No está bien organizado. Encontrar algo en él es un esfuerzo enorme, que lleva a multitud de vías muertas o a descubrir que una misma idea es expresada en diferentes lugares, diseminada en múltiples sitios e incluso ausente.
* No es testeable. Hay que hacer un gran esfuerzo solo para poder empezar a hacer un test, incluyendo tener que transformar el código para hacerlo posible.
* No es legible. No es posible entender qué hace solo con leer el código, hay que buscar otras fuentes de información para hacerse una idea de lo que estaría ocurriendo, incluso aunque exista documentación o comentarios, porque ya han perdido la sincronía con el código.
* No es sostenible. Llevar a cabo una modificación es peligroso porque puede resultar incompleta o tener efectos en lugares insospechados.

## Principios de diseño para crear buen código

A lo largo de la breve historia de la disciplina se han ido desarrollando herramientas, metodologías, lenguajes y paradigmas de programación que, poco a poco, han ido destilando un conjunto de principios que tratan de establecer criterios que nos permitan distinguir entre buen y mal código.

Los principios no son leyes ni dogmas, son ante todo criterios con los que tomar o evaluar ciertas decisiones cuando expresamos un modelo mental en forma de código.

Estos principios interactúan en un sistema. En muchas ocasiones, enfatizar la aplicación de uno de ellos puede dar lugar a tener que relajar la aplicación de otro. No son, por tanto, recetas que se puedan seguir ciegamente. Son más bien estrategias para razonar sobre aquello que queremos conseguir con el código teniendo en cuenta el contexto en que se van a aplicar.

De hecho, unos principios derivan de otros. En algunos casos tienen aplicabilidad en un contexto o paradigma de programación. En otros casos, ni siquiera son principios que hayan nacido en el campo del desarrollo de software.

Intentaré presentar algunos de estos principios, bastante conocidos seguramente, en tres artículos. En el primero, trataremos sobre un pequeño conjunto de principios básicos. En el segundo hablaremos sobre los conocidísimos principio SOLID. Por último, en el tercero, un grupo de principios que he denominado "los consejos pragmáticos".

## Principios básicos

### Separación de intereses (separation of concerns)

Se atribuye a Edsger Dijkstra y dice simplemente: diferentes partes de un programa se ocupan de diferentes intereses.

Es uno de los principios más fundamentales del desarrollo de software y nos ayuda a estructurar y organizar el software, separando sus componentes en función del tipo de intereses o necesidades de los que se ocupa. Hay partes dedicadas al acceso a bases de datos, a la presentación, al modelo de dominio, a servicios de la aplicación, a comunicarse con otros sistemas, etc.

Se puede decir que todas las arquitecturas basadas en capas, los patrones arquitectónicos e incluso el Domain Driven Design se asientan en este principio, aplicado a distintos niveles de abstracción y en combinación con otros. De hecho, está en el origen algunos otros que veremos más adelante.

En resumen, este principio nos ayuda a separar partes del código de una manera significativa, yendo juntas aquellas que atienen a los mismos intereses, lo cual es un punto de partida para una buena organización.

Un corolario de este principio es que si determinamos que una unidad de software sirve a dos o más intereses, deberíamos partirla y separarla en tantos trozos como necesidades sirve.

### Principio de abstracción

Enunciado por Benjamin Pierce, dice que cada parte significativa de funcionalidad de un programa debe implementarse en un solo lugar del código fuente.

Conocemos una versión más "pragmática" en forma del principio DRY, del que hablaremos en la tercera entrega. Pero en general, este principio lo que nos dice es que toda funcionalidad significativa debería existir en un único lugar accesible al resto del programa, evitando repetir el código que la ejecuta. 

Este principio nos ayuda a tener criterios para modularizar código y para favorecer su sostenibilidad y su capacidad de ser reutilizado.

En cuando a la modularidad, una funcionalidad que debe reutilizarse tiene que existir en forma única en un módulo que sea utilizable desde las partes del programa que lo precise. Desde el punto de vista de este consumidor, esa funcionalidad está abstracta en una función o clase, por lo que no necesita preocuparse de los detalles de su implementación.

La sostenibilidad se ve favorecida porque si necesitamos cambiar esa funcionalidad solo existirá un punto en el que debamos intervenir, sin riesgo de que haya distintas partes del código que puedan quedar sin actualizar.

### Separación comando pregunta (command query separation o CQS)

Este principio fue enunciado por Bertrand Meyer y establece que cada método o función debe ser o bien un **comando**, que provoca un cambio en el sistema ejecutando una acción, o bien una **pregunta** (o query). que obtiene una información del sistema sin modificarlo.

El meollo de este principio es que una función no debería provocar un cambio en el estado del sistema e informar a la vez de su estado. Un ejemplo en el que se puede ver fácilmente cuál es el tipo de riesgo que supone no cumplir este principio es imaginar un sistema de aceleración y frenado de vehículos. Imagina que la función `frenar` devuelve también la velocidad: ¿de qué velocidad estamos hablando: de la que teníamos antes de aplicar la acción de frenar o de la resultante? Y si quiero saber cuál es la velocidad actual, ¿tengo que acelerar o frenar el vehículo para obtener una respuesta?

Por este tipo de problemas es necesario separar la realización de cambios en el sistema, de la obtención de información acerca de esos cambios.

En consecuencia, normalmente de los comandos no obtenemos respuestas. En su lugar nos preocupa solo saber que se han ejecutado y, en todo caso, si ha habido algo que ha impedido completar esa ejecución. De ahí que sea la práctica habitual que un comando no retorne nada (void) pero puede lanzar excepciones de modo que su emisor pueda saber que ha fallado. Una alternativa más avanzada es que, como resultado de la ejecución, se dispare un evento que notifica a la aplicación el cambio que se acaba de producir, permitiendo que otras partes de la misma actúen en consecuencia. 

Por otro lado, aplicando este principio, tendremos la seguridad de que las *queries* no producen cambios (*side effects*) en el estado del sistema, por lo que devuelven información correcta acerca del mismo. El concepto de *función pura* tiene que ver con este principio también.

El principio CQS está en la base de los sistemas de mensajería de aplicaciones (commands, queries y events) y también en el patrón *Command Query Responsibility Segregation* (CQRS) que tiene su aplicación en sistema que requieren un alto rendimiento.

La aplicación del principio CQS favorece la testeablidad del software y contribuye a su robustez.

### Principio del mínimo conocimiento (Ley de Demeter o *No hables con extraños*)

Ian Holland es el promotor de este principio definido como práctica recomendada en un proyecto denominado [Demeter](https://www2.ccs.neu.edu/research/demeter/), del cual tomó su nombre más popular. Su nombre formal tiene que ver con el enunciado del principio, que dice, más o menos, que una unidad de software solo puede hablar con aquellas otras unidades que conozca.

¿Cuales son estas otras unidades que una unidad de software puede conocer? Pues las siguientes:

* Aquellas instanciadas dentro de la propia unidad de software considerada.
* Aquellas que se pasan como parámetros a la unidad considerada.

En el caso de orientación a objetos, asumiendo que la unidad es un método de una clase

* La propia clase en la que se define el método.
* Los métodos y atributos de la clase.

Una consecuencia de este principio es que una unidad de software no debe tener conocimiento de la estructura interna de esas otras unidades con las que puede hablar. No puede usarlas para acceder a propiedades internas de estas colaboradoras, sino que solo puede relacionarse con ellas a través de su interfaz pública.

La aplicación de este principio ayuda mucho a la testeabilidad, sobre todo cuando en el nivel unitario utilizamos dobles de tests. Además, aligera el acoplamiento eliminando dependencias ocultas o transitivas (cuando desde la unidad A, usamos una unidad B porque contiene una tercera unidad C que es la que realmente queremos usar), y favorece la cohesión.

### Cohesión vs Acoplamiento

Una de las primeras definiciones de estas propiedades es de Larry Constantine. Las propiedades de Cohesión y Acoplamiento nos ayudan a definir módulos de software.

La **cohesión** se refiere al grado en que los elementos de un módulo van juntos. Nos interesa que la cohesión dentro de un módulo sea alta. Una forma práctica de verlo es pensar que "las cosas que cambian juntas deben ir juntas", lo que se conoce a veces como *principio de covarianza*. Las cosas que no cambian juntas deberían estar separadas.

Para aumentar la cohesión tenemos que reunir en un mismo módulo las unidades de software que tienden a presentarse juntas, a ser usadas juntas y a cambiar juntas. Además, podemos incrementarla aún más sacando de un módulo aquellas unidades que no tienen este tipo de relación con las demás.

Este principio está en la base del empaquetado de software y, por tanto, en la organización del código y su inteligibilidad.

El **acoplamiento** se refiere al grado de interdependencia entre módulos distintos. Nos interesa que el acoplamiento entre módulos sea lo más bajo posible. El acoplamiento será cero cuando un módulo no utilice a otro, por lo que siempre tendremos un cierto grado de acoplamiento. Ahora bien, este acoplamiento puede ser ligero y controlado por nosotras, algo que se puede conseguir aplicando otros principios, como puede ser el de inversión de dependencias.

El bajo acoplamiento ayuda en la robustez y la testeabilidad. 

En conjunto, la relación entre cohesión y acoplamiento son claves en la organización del software y la posibilidad de reutilización de los distintos módulos.
