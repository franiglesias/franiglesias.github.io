---
layout: post
title: Katando phpSpec 3
categories: articles
tags: tdd bdd phpspec
---

En esta tercera entrega, vamos a examinar cómo los nuevos requisitos nos pueden llevar a refactorizar una solución existente y discutiremos lo que define la sobreingeniería.

La serie **Katando PHPSpec** consta de los siguientes artículos:

[Katando PHPSpec (1)](/katando-phpspec-1.md)  
[Katando PHPSpec (2)](/katando-phpspec-2.md)  
[Katando PHPSpec (3)](/katando-phpspec-3.md)  
[Katando PHPSpec (4)](/katando-phpspec-4.md)

En el [capítulo anterior](/katando-phpspec-2/) implementamos los primeros tres requisitos de la kata. Al final del mismo mencionamos varias oportunidades de refactoring, puesto que podíamos ver algunos puntos potencialmente apestosos del código.

Creo que no es posible dar una receta que nos señale en qué momentos podemos o debemos refactorizar una solución, es algo que vamos descubriendo con la experiencia y también con las necesidades que vamos teniendo en cada momento.

Lo que no suele ser buena idea es refactorizar o añadir funcionalidad pensando en que "podríamos necesitarlo" en el futuro. A eso se le llama principio "YAGNI" (You ain't gonna need it, no lo vamos a necesitar). La filosofía tras este principio es que no trabajes sobre supuestos de los que tienes seguridad, si no sólo a partir de los requisitos específicos que tengas en cada momento. Es un modo de mantener el foco y no desperdigarse.

Otra cosa diferente es que descubramos oportunidades de refactoring porque podemos hacer el código más legible, expresivo, extensible o desacoplado, o bien porque detectamos "smells".

En nuestro ejemplo nos encontramos ante una encrucijada a pequeña escala. Aunque sea un caso muy sencillo, lo cierto es que nos plantea el mismo tipo de dilemas que tendríamos en una situación más relevante, por lo que puede ser un buen campo de pruebas.

La encrucijada es la siguiente:

De momento, mientras no tenemos que cumplir más requisitos, nuestro código funciona, superando las pruebas que le hemos puesto. Por consiguiente, no hay razón para seguir tocándolo. No sabemos qué nos van a pedir a continuación, así que no tiene mucho sentido hacer suposiciones y tratar de evolucionar el código para dar soporte a esas demandas que aún desconocemos.

Pero por otro lado, tenemos un par de inicios de smell en forma de duplicación y valores hardcoded. Atacar esos problemas, que ahora mismo no son importantes, nos va a facilitar dos cosas: que en el futuro el código sea más fácil de entender y que, llegado el caso, sea más fácil de mantener y modificar.

Así que tenemos dos fuerzas contrapuestas: una que nos impulsa a dejar las cosas como están y otra que nos llevaría a seguir puliendo el código hasta no ver más puntos posibles de mejora.

## ¿Hacia dónde moverse?

**Refactoring**: siempre es buen momento para hacer refactoring. Es decir, reescribir el código con el objetivo de lograr que sea más explícito, expresivo, desacoplado, extensible o mantenible. Por lo tanto, si vemos oportunidades de hacerlo, es mejor hacer refactoring "precoz": lo que ahora nos parece claro, puede dejar de parecerlo dentro de unos días.

Lo que no es conveniente de ningún modo es intentar anticiparnos a demandas desconocidas.

## Basta de disgresiones

En el capítulo anterior nos quedamos en un punto en el que empezaban a asomar algunos <em>smells</em> de código, así que puede ser conveniente revisarlos antes de pasar a implementar los nuevos requisitos que nos van a pedir.

Consideremos nuestro separador: la coma. Como puedes ver, aparece repetida hasta en tres ocasiones. Además, es un valor arbitrario hardcoded, ¿quién nos asegura de que dentro de dos semanas nos acordaremos de su significado? Y, si en el futuro tengo que cambiar el separador, ¿tendría que cambiar la clase y violar el principio abierto/cerrado?

Una solución sería convertirlo en una variable, en una constante de clase, o en una propiedad, añadiendo incluso un método para poder definirla o pasarlo en el constructor. Pero, ¿qué es mejor?

Pues depende, pero como no podemos adivinar el futuro podría darnos un poco igual una solución que otra. Todas nos permiten reducir el smell de duplicación al establecer el valor en un sólo punto, así como el smell de hardcoding al darle un nombre significativo. Con cualquiera de las opciones atacamos este problema específico que tenemos ahora.

Pero si en la próxima ronda de requisitos necesitamos hacerlo, y mientras no demos por terminado el desarrollo, podemos cambiarlo de nuevo.

Como tenemos ya unos cuantos tests estamos protegidos para hacer ese cambio en cualquier momento. Recuerda: el refactor no modifica el comportamiento. De momento, voy a poner el separador como una variable de clase o propiedad.

{% gist b0a6d045807b05345567579db4daf23a %}

Otro posible punto de refactoring es la normalización de separadores que hacemos en la primera línea del método. En la entrega anterior vimos que una buena razón para extraer un fragmento de código a un método era justamente ser más explícitos acerca de qué está haciendo y no tener que llevar a cabo una ejecución mental del código para entender su finalidad.

A decir verdad, podríamos seguir extrayendo métodos en cada línea de código a fin de lograr que cada una fuese autoexplicativa, separando cada una de las fases del procesamiento. Así tendríamos un método para descomponer el $inputString en números y otro para obtener el resultado de su suma.

Lo voy a hacer para ilustrar ese punto. Vuelvo a decir, puede que en este ejemplo podamos verlo como un caso de "sobreingeniería", pero en un proyecto más complejo sería la opción más oportuna.

De nuevo, como no modificamos el comportamiento, los test nos mantienen protegidos de cualquier consecuencia indeseada del cambio. La clase nos quedaría así:

{% gist 9f34c7280b08d536700cf30431111025 %}

 

## Nuevos requisitos

El nuevo requisito que nos piden es la posibilidad de definir un separador alternativo pasándolo en la misma cadena.
<pre>4. Haz que el método pueda usar separadores diferentes.
    - La primera línea tiene la forma "//#\n" donde # es el nuevo separador
    - "//;\n1;2" sería válido
    - Esta línea es opcional</pre>
Nuestro refactor anterior nos facilita implementar esta nueva demanda, lo que es una buena ilustración de los beneficios del refactoring temprano. Aunque en este ejemplo sea casi trivial, hay muchas situaciones en las que agradeceremos que el trabajo ya esté hecho, tanto si retomamos código nuestro como si el código viene de otras manos.

En cualquier caso, necesitamos un nuevo test que describa un ejemplo de lo que nos piden:

{% gist a2f66ceb4545cd3e718c0d6596a14f1d %}

Y, como era de esperar, el test falla. Es hora de implementar.

Puesto que la línea que define el nuevo separador es opcional, los tests existentes nos valen y el nuevo código tiene que pasarlos también. ¿Y si no fuese opcional? Pues entonces los test no nos servirían. En realidad, tendríamos que replantearnos bastante la arquitectura de la solución, ya hablaremos de eso más adelante.

El patrón que debemos localizar está bien definido, así que podemos localizarlo mediante regexp y grupos de captura. Una buena estrategia podría ser romper la cadena de entrada en sus dos componentes: la parte (opcional) que define el nuevo separador y la parte que lleva los números con los que se va a operar. Si obtenemos un separador actualizamos la propiedad correspondiente, que ahora es fácil gracias a nuestro refactoring anterior.

Veamos una implementación que no me acaba de gustar, pero que parece funcionar:

{% gist a2ca8d7f844e455678bf2044ce560dfe %}

Nuestros tests pasan. ¿Estamos contentos?

No. Todavía podemos refactorizar la solución. Al fin y al cabo, las regexp serán potentes, pero legibles, lo que se dice legibles, no son y encima tenemos una duplicación fea de narices al usar dos patrones casi iguales, el primero para detectar que el $inputString contiene un cambio de separador y el otro para obtener los elementos que nos interesan. Sin embargo, en términos de pasar los test, funciona, y eso es un punto importante.

## Recapitulemos

A la espera de encontrar una mejor solución para nuestro problema actual podemos refactorizar a fin de extraer el código que acabamos de añadir en sus propios métodos. De este modo, la clase será mucho más legible y, seguramente, será más fácil aún arreglar el desaguisado que acabamos de cometer.

Pero eso lo dejamos para más adelante.

 

 