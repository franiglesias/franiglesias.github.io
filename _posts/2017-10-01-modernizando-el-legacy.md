---
layout: post
title: Modernizando el legacy
categories: articles
tags: legacy refactoring
---

Hace unos días trabajamos en una de esas historias que mola porque puedes reducir un poco de legacy code y refactorizar, contribuyendo a mejorar la calidad del código y su extensibilidad futura. 

El proceso que seguimos me pareció lo bastante interesante como para contarlo.

## Concretando la historia

Lo primero, por supuesto, es delimitar bien la historia y la demanda que se hace en ella, para lo cual pedimos a Negocio que nos resolviese algunas dudas. Por otro lado, examinamos el código donde tendríamos que incluir los cambios y analizar cuál sería la mejor manera de hacerlo. En nuestro caso, un objeto PHP debería controlar el contenido de una parte de una página.

Además, nos dimos cuenta de que una funcionalidad idéntica ya estaba implementada en otra parte de la aplicación. La cuestión, entonces, era ver cómo podríamos extraerla de dónde estaba implementada y hacerla reutilizable.

En nuestro caso teníamos una especie de "objeto Dios" (God Object), un hedor de código o smell consistente en un objeto que tiene demasiadas responsabilidades, entre ellas ocuparse de esa funcionalidad que nosotros queríamos generalizar. La parte buena es que estaba cubierta por tests.

## Trasladando funcionalidad vía TDD

Empezamos usando un enfoque TDD. Nuestro plan era diseñar una clase que asumiese la funcionalidad deseada, pero en lugar de simplemente copiar y pegar, preferimos proceder de una forma más rigurosa. Así que empezamos creando tests unitarios con el enfoque de cambios mínimos mientras íbamos trasladando el código de la "clase dios" a la nueva. El resultado fue una nueva clase que reproducía la funcionalidad, aunque también es cierto que algunos de los defectos de la implementación existente, sobre los que hablaré más adelante.

Con esto prácticamente hecho nos dimos cuenta de que podríamos refactorizar los tests. Este es un punto interesante. En el caso que nos ocupa, acabamos usando los dataProviders de PHPUnit para simplificar el código de los tests y probar una diversidad de casuísticas con tan sólo dos métodos de test.

El refactor de los tests es un punto importante del desarrollo. No creo que los tests deban ser inamovibles, sino que evolucionan con el desarrollo. El cambio en los tests no los invalida. Por una parte, el refactor de tests debe obedecer a la necesidad de que sean más legibles, concisos y eficientes, pero si el el desarrollo evoluciona y cambia, los tests tienen que cambiar porque son parte inseparable del desarrollo.

Una vez que conseguimos aislar nuestra funcionalidad, lo siguiente fue incorporarla al código para comprobar que funcionaba, cosa que así fue.

## Refactorizar lo hecho hasta ahora

Pero el trabajo no estaba terminado.

En este punto teníamos duplicada la funcionalidad deseada por lo que debíamos trabajar para eliminar esa duplicación. Pero, por otro lado, la calidad de la implementación era bastante baja. Nuestra nueva clase claramente violaba el principio abierto/cerrado. 

Para explicar esto tengo que contar un poco sobre qué hace esa clase y para hacerlo voy a poner un ejemplo de otro sector.

Supongamos una aplicación de información educativa, el tipo de plataforma online para colegios en los que las familias pueden consultar información y detalles sobre la marcha de sus hijos en los estudios. En la historia nos piden que cuando las familias acceden al sistema la primera pantalla que se encuentran ha de mostrar unos mensajes de notificación cuando se cumplan ciertas condiciones. Por ejemplo: si el estudiante ha faltado a clase, o si ha sacado alguna mala nota, etc. En caso de que no haya ninguna incidencia digna de mención, se mostraría un mensaje expresando que todo va marchando adecuadamente.

Como se puede ver, nuestro desarrollo se basa en determinar qué mensajes mostrar según las condiciones que se cumplen.

El problema que tenemos en este momento es que, aunque la funcionalidad está implementada, la forma de implementación no es buena. Todas las reglas que controlan qué mensajes se deben mostrar están dentro de la clase que acabamos de escribir lo que significa que cada vez que tengamos que añadir una nueva regla será necesario modificar la clase. Y el mecanismo que selecciona qué reglas aplicar está también en la misma clase.

## Aplicando patrones

Esta situación encaja claramente en el patrón de cadena de responsabilidad: se han de aplicar una serie de reglas, pero no sabemos a priori cuáles. Para ver más sobre este patrón <a href="https://talkingbit.wordpress.com/2016/12/05/cadena-de-responsabilidad/">tenemos un artículo aquí</a>

El paso siguiente es extraer las diferentes condiciones a clases que representarán las reglas y como queremos seguir con la metodología TDD, vamos creando tests que las verifican. Estas clases extienden una clase abstracta que proporciona la funcionalidad común necesaria para efectuar tanto el encadenamiento de nuevas reglas, como la delegación y respuesta por defecto.

Una vez que hemos construido la cadena de responsabilidad, podemos refactorizar nuestra clase para que la utilice, con lo que adelagaza una barbaridad y se queda sólo con las responsabilidades que le corresponden. Esto es: devolver los mensajes necesarios, delegando la decisión a la cadena de reglas que hemos definido.

Como tenemos tests desde el principio, podemos comprobar en cada paso del refactor que no rompemos nada. En la práctica decubrimos algún caso mal testeado que quedaba disimulado por defectos de la implementación inicial, lo que confirma que una buena arquitectura contribuye a reducir los errores poniéndolos al descubierto cuando ocurren.

## Refactorizando código legacy

Finalmente, podemos empezar a refactorizar parte de nuestro "God object" inicial, para lo cual vamos procediendo paso a paso y comprobando con los tests que no rompemos nada.

Por una parte se trata de introducir nuestro desarrollo en sustitución de la implementación existente, de modo que se ocupen las nuevas clases de realizar la tarea.

Eso hace que muchos métodos existentes dejen de ser usados y los eliminamos. Al ser métodos privados y comprobar mediante las herramientas del IDE que no son llamados desde ningún otro lugar los podemos eliminar con seguridad.

## Toques finales

En nuestro proceso de trabajo habitual pedimos revisiones del código a los compañeros y compañeras del equipo, de modo que le echan un vistazo y comentan cualquier detalle o mejora que consideran oportuno, o nos alertan de posibles problemas.

Este proceso de revisión es muy interesante porque muchas veces te hace pensar sobre detalles que no habías tenido en cuenta o incluso el tipo de cuestiones que dejas pasar precisamente porque estás demasiado enfocado en la tarea concreta.

Con esta contribución, por ejemplo, mejoramos el nombre de algunos métodos y controlamos algunas situaciones que, aunque inusuales, podrían generar errores al ejecutarse bajo ciertas condiciones.
