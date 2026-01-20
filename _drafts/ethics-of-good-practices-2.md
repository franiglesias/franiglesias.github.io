---
layout: post
title: La ética de las buenas prácticas (2)
categories: articles
author: [paula, fran]
tags: testing soft-skills ethics
---

## ¿Qué hace tu código?

En un post anterior hablamos de la posibilidad de fundamentar una respuesta a esta pregunta aumentando la legibilidad del código. De esta manera, y siempre y cuando estemos lidiando con código determinista, podríamos en teoría discernir con claridad qué hace este software simplemente con leerlo.

Sin embargo, planteábamos también la existencia de una segunda vía para dar respuesta a la pregunta "qué hace tu código", y esta es **aumentando su credibilidad** mediante tests. Los tests nos permiten realizar afirmaciones objetivas y reproducibles sobre las capacidades de nuestro software. Además, los distintos niveles de tests nos habilitan para hacerlo en los diferentes niveles de la organización del código: desde las unidades de software a los tests de aceptación, que hablan el lenguaje del dominio y, por tanto, del usuario.

Si tenemos la voluntad de escribir código que sea honesto, las buenas prácticas y el testing son nuestras herramientas. ¿Cómo operan cada una de ellas?

## Credibilidad

Las buenas prácticas nos ayudan a escribir código que refleje lo mejor posible nuestros objetivos, intenciones y visión del problema. El código se convierte en un relato.

La honestidad que demuestra un código bien escrito necesita ser apoyada por pruebas que aporten credibilidad. Si de la lectura del código podemos extraer "lo que el código dice que hace", ahora debemos asegurar que "el código hace lo que dice".

Y para eso tenemos el testing.

Tendemos a ver el testing desde la perspectiva de la calidad del software, pero no desde el punto de vista de su credibilidad. Un test puede decirnos si el software bajo prueba funciona correctamente. Pero otra manera de verlo es decir que el test certifica o confirma lo que el código dice. Dicho en otros términos, los tests nos aseguran que el código es honesto.

Hace unos párrafos mencionábamos los distintos niveles de abstracción que tiene el código. De hecho, podemos hacer tests sobre estos distintos niveles que, en conjunto, nos proporcionan una visión de lo creíble que es lo que nuestro código dice.

Así, los tests unitarios nos hablan de la credibilidad de nuestras unidades de software. Podría decirse que demuestran si los conceptos que manejamos están correctamente representados.

Los tests de integración nos demostrarían que las relaciones entre los conceptos en nuestro modelo están adecuadamente descritas en nuestro código.

Finalmente, los tests de aceptación acreditan el funcionamiento del software como solución a un problema o necesidad que tienen las personas que lo usarán, y si proporciona las respuestas esperadas a sus demandas.

Otros tipos de tests no funcionales, como los de velocidad, carga, rendimiento, etc, contribuyen a esta credibilidad midiendo la eficiencia con la que el software da respuesta a esas necesidades que dice resolver. 

En conjunto, los distintos tipos de tests nos ayudan a cumplir los principios SMART:

* **Standard behavior**: los tests verifican que no hay cambios de comportamiento del software.
* **Manageability**: igualmente, el software tiene un comportamiento predecible y, por tanto, es posible aprender a utilizarlo.
* **Availability**: el software funciona y está disponible en un diversidad de condiciones.
* **Reliability**: el software no contiene fallos que alteren o falseen la respuesta recibida por la persona que lo utiliza.
* **Truthfulness**: el software no tiene un comportamiento oculto.

Los tests automáticos tienen una doble vertiente, tienen dos caras. Si bien nos ayudan a garantizar la veracidad del código, no podemos olvidar que son también, en sí mismos, código. Y por tanto, deberán seguir las mismas estrictas normas de desarrollo de código expresadas arriba. Deberían ser legibles en su narrativa, mantener un uso coherente y consistente de los nombres, que además deberá coincidir con el utilizado en el desarrollo bajo prueba. Deberán respetar patrones de diseño que los hagan mantenibles. Y deberán estar disponibles siempre que sea necesario.

En este sentido, la realidad de los tests alcanza una profundidad quizá todavía más compleja que la de su contrapartida el software bajo prueba, puesto que deben ser a la vez buen software, una herramienta de desarrollo más, y la clave de la credibilidad del software desarrollado.

De ahí que una de las fortalezas del diseño de software basado en tests sea que, una vez que somos capaces de aprender a escribir los tests que necesitamos, escribir la funcionalidad, es en realidad, una tarea más sencilla.

## Por qué testear

Testear el software que escribimos se suele fundamentar en razones técnicas pero, como estamos viendo, hay razones éticas por las que deberíamos asegurarnos de testear nuestro software.

Los motivos prácticos que se suelen esgrimir a favor del testeo son:

* **Evitar/prevenir errores**: al definir con precisión las expectativas sobre el software, los tests contribuyen a evitar errores.
* **Poder razonar sobre el código y su adecuación a la demanda**: los tests pueden verse como especificaciones sobre el comportamiento deseado del software, dicen cómo funciona y nos permite compararlo con cómo debería funcionar.
* **Demostración formal de cómo funciona el código y qué hace**: al estar escritos en un lenguaje de programación, los tests describen de manera formalizada cuál es el comportamiento del código.

Los motivos éticos

* Escribir la narrativa necesaria nos ayuda a entender y dar respuesta a la pregunta sobre qué hace el software que vamos a escribir.
* Entender esta narrativa, nos da la capacidad de preguntarnos si este software tiene carencias, o es en sí mismo ético o no como producto final.
* A día de hoy, el software ya no es tan sólo un reflejo, un modelo de la realidad. En muchos casos, es el software el que modela la realidad. Un claro ejemplo de esto es el sistema bancario. La realidad de nuestra situación económica depende de una base de código y su correspondiente base de datos. Como creadores de algunas de estas dimensiones, tenemos la obligación de garantizar que actúan como se espera.

## Referencias


* [Michael Stahl: Ethics in Software Testing](https://www.stickyminds.com/article/ethics-software-testing)
* [Bonnie Bailey: Do Software Testers Have Special Ethical Obligations?](https://www.techwell.com/techwell-insights/2013/05/do-software-testers-have-special-ethical-obligations)


