# La ética de las buenas prácticas (pt. II)


## ¿Qué hace tu código?

En un post anterior hablamos de la posibilidad de fundamentar una respuesta a esta pregunta aumentando la legibilidad del código. De esta manera, y siempre y cuando estemos lidiando con código determinista, podríamos en teoría discernir con claridad qué hace este software simplemente con leerlo.

Sin embargo, planteábamos también la existencia de una segunda vía para dar respuesta a la pregunta "qué hace tu código", y esta es **aumentando su credibilidad** mediante tests. Los tests nos permiten realizar afirmaciones objetivas y reproducibles sobre las capacidades de nuestro software. Además, los distintos niveles de tests nos habilitan para hacerlo en los diferentes niveles de la organización del código: desde las unidades de software a los tests de aceptación, que hablan el lenguaje del dominio y, por tanto, del usuario.

Si tenemos la voluntad de escribir código que sea honesto, las buenas prácticas y el testing son nuestras herramientas. ¿Cómo operan cada una de ellas?

## Credibilidad

Las buenas prácticas nos ayudan a escribir código que refleje lo mejor posible nuestros objetivos, intenciones y visión del problema. El código se convierte en un relato.

La honestidad que demuestra un código bien escrito necesita ser apoyada por pruebas que aporten credibilidad. Si de la lectura del código podemos extraer "lo que el código dice que hace", ahora debemos asegurar que "el código hace lo que dice".

Y para eso tenemos el testing.

Tendemos a ver el testing desde la perspectiva de la calidad del software, pero no desde el punto de vista de su credibilidad. Un test puede decirnos si el software bajo prueba funciona correctamente. Pero otra manera de verlo es decir que el test certifica o confirma lo que el código dice.

Hace unos párrafos mencionábamos los distintos niveles de abstracción que tiene el código. De hecho, podemos hacer tests sobre estos distintos niveles que, en conjunto, nos proporcionan una visión de lo creíble que es lo que nuestro código dice.

Así, los tests unitarios nos hablan de la credibilidad de nuestras unidades de software. Podría decirse que demuestran si los conceptos que manejamos están correctamente representados.

Los tests de integración nos demostrarían que las relaciones entre los conceptos en nuestro modelo están adecuadamente descritas en nuestro código.

Finalmente, los tests de aceptación acreditan el funcionamiento del software como solución a un problema o necesidad que tienen las personas que lo usarán.

Otros tipos de tests no funcionales, como los de velocidad, carga, rendimiento, etc, contribuyen a esta credibilidad midiendo la eficiencia con la que el software da respuesta a esas necesidades que dice resolver.

Los tests automáticos tienen una doble vertiente, tienen dos caras. Si bien nos ayudan a garantizar la veracidad del código, no podemos olvidar que son también, en sí mismos, código. Y por tanto, deberán seguir las mismas estrictas normas de desarrollo de código expresadas arriba. Deberían ser legibles en su narrativa, mantener un uso coherente y consistente de los nombres, que además deberá coincidir con el utilizado en el desarrollo bajo prueba. Deberán respetar patrones de diseño que los hagan mantenibles. Y deberán estar disponibles siempre que sea necesario.

En este sentido, la realidad de los tests alcanza una profundidad quizá todavía más compleja que la de su contrapartida el software bajo prueba, puesto que deben ser a la vez buen software, una herramienta de desarrollo más, y la clave de la credibilidad del software desarrollado.

De ahí que una de las fortalezas del diseño de software basado en tests sea que, una vez que somos capaces de aprender a escribir los tests que necesitamos, escribir la funcionalidad, es en realidad, una tarea más sencilla.

## Referencias


* [Michael Stahl: Ethics in Software Testing](https://www.stickyminds.com/article/ethics-software-testing)
* [Bonnie Bailey: Do Software Testers Have Special Ethical Obligations?](https://www.techwell.com/techwell-insights/2013/05/do-software-testers-have-special-ethical-obligations)


# Más ideas para explorar

## Código mentiroso

Código mentiroso es el código que no hace lo que dice que hace. Y, como en todo, hay grados:

* El código mal escrito, que tiene errores o no funciona y, por tanto, no hace lo que dice.
* El código que no representa correctamente los conceptos, invariantes y procesos del dominio para el que pretende ser una herramienta.
* El código que, simplemente, no hace lo que se supone que debe hacer.
* El código que hace cosas de manera oculta, además de lo que dice que hace.
* El código que pretende, directamente, engañarnos.

Cabe destacar que en esta lista se intenta tan solo describir el concepto del código mentiroso, como contrapartida del código funcional presentado más arriba. Claramente, la intencionalidad de la persona que escribe el código es clave en cada uno de estos puntos, pero no entraremos ahora a evaluarla.

## ¿Cuál es el coste de realizar un mal trabajo?

Definir lo que es un buen o mal trabajo implica haber establecido un conjunto de criterios, un sistema de valores.

En buena parte esta definición tiene que ver con los efectos que produce un buen o mal trabajo, algo que puede ser cuantificable o no, pero que también depende de los efectos que produce.

Veamos algunos ejemplos:

### Código difícil de mantener

El código difícil de mantener puede implicar diferentes costes:

* Si en el futuro es necesario cambiarlo, requerirá más tiempo que si estuviese diseñado para la mantenibilidad. Este tiempo tiene un coste en horas de desarrollo que se puede cuantificar.
* Si ese código tiene fallos, puede ser difícil encontrarlos y subsanarlos. De nuevo, coste de horas de trabajo.

Este efecto, sin embargo, podría considerarse a parte de los presentados arriba, en el sentido de que no afecta tanto a las personas que utilizan este software, sino a quienes lo crean. Quizá no sea código mentiroso, quizá se trate de software funcional. Sin embargo, la falta de atención a un diseño mantenible, pueden llevar a esta situación que genera un sobrecoste y bastante frustración a la hora de trabajar con esta base de código.

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
* Escribir la narrativa necesaria nos ayuda a entender y dar respuesta a la pregunta sobre qué hace el software que vamos a escribir.
* Entender esta narrativa, nos da la capacidad de preguntarnos si este software tiene carencias, o es en sí mismo ético o no como producto final.
* A día de hoy, el software ya no es tan sólo un reflejo, un modelo de la realidad. En muchos casos, es el software el que modela la realidad. Un claro ejemplo de esto es el sistema bancario. La realidad de nuestra situación económica depende de una base de código y su correspondiente base de datos. Como creadores de algunas de estas dimensiones, tenemos la obligación de garantizar que actúan como se espera.
