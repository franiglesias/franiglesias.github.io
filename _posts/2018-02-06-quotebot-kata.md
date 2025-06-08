---
layout: post
title: Practica el refactoring con la Quotebot Kata
categories: articles
tags: legacy refactoring testing
---

Hace unos días subí al repositorio una versión para PHP de la [Quotebot Kata](https://github.com/franiglesias/legacy-testing-kata), un ejercicio propuesto por Cyrille Martraire en el que se presenta un código que inicialmente es imposible de testear (y prácticamente de ejecutar en tu local).

Conocí la kata en este [meetup de Barcelona Softwate Craftmanship](https://www.meetup.com/es-ES/Barcelona-Software-Craftsmanship/events/245882537/) conducido por Manuel Rivero.

En este artículo me gustaría comentar algunas cosillas sobre el tema de la kata y los enfoques para resolverla, así como lo que podemos aprender para el trabajo diario.

Para empezar, diría que es un ejercicio bastante realista.

## Refactor sin tests

Inicialmente, ni siquiera podemos intentar testear el código. Está diseñado de tal modo que reproduce una típica situación de código que funciona en un entorno, que bien podría ser producción, pero no en otro. Eso es porque depende de un elemento externo, en este caso una variable de entorno.

Por otra parte, el acoplamiento de las dependencias es total. En conjunto, el código no se puede testear en su estado actual: ¿te suena? Es lo que ocurre en muchas bases de código legacy.

La solución pasa por utilizar técnicas de refactor seguras. ¿Qué se define como "técnica de refactor segura"? Pues, en general, aquellas que están automatizadas por tu IDE o alguna otra herramienta de refactor automático. PHPStorm te proporciona unos cuantos refactors automáticos, una lista que resulta minúscula en comparación a los que ofrece IntelliJ para Java, y también se pueden conseguir en Atom.

Si no usas uno de estos IDE tampoco es que haya mucho problema. Un refactor bastante sencillo de hacer es ExtractMethod:

* Escribe un método privado vacío que represente la operación que quieres aislar.
* Selecciona el bloque de código que realiza esa operación.
* Copia y pega el bloque como implementación del método privado que creaste al principio.
* Ajusta los parámetros y el valor de retorno del método.
* Sustituye el bloque de código por una llamada al método recién creado.

Dicho así, suena más complicado de lo que parece, pero es realmente sencillo.

En cualquier caso, se trata de conseguir dos cosas en primer lugar:

* Que el código se pueda ejecutar, evitando las excepciones que lanza inicialmente.
* Controlar las dependencias para poder hacer tests

## Tests de caracterización

Una vez que hemos conseguido eliminar las limitaciones anteriores, es posible comenzar a desarrollar tests de caracterización que describan el comportamiento del código y nos sirvan de colchón para empezar a refactorizar. Aquí nos encontramos con varios problemas:

### Tests doubles

Necesitaremos generar algunos dobles. Ten en cuenta que hay dependencias de servicios estáticos y otras pijaditas por el estilo.

¿Cómo extraemos estas dependencias?

Eso sí, ten en cuenta que para este ejemplo lo que está en la carpeta **lib** estaría en **vendor** en un proyecto real, por lo que realmente no podríamos tocarlo de ningún modo.

Mi opinión es que Adapter puede ser nuestro amigo aquí.

### Tests no deterministas

Para terminar de liarla, algunas dependencias son no deterministas. Es decir, dependemos de algunas cosas de las cuales no podemos garantizar un valor en el momento de realizar el test.

Y en este caso se trata de un elemento tan básico que solemos tomarlo del propio lenguaje tal cual, sin pensarlo demasiado. Quizá necesitemos crear un servicio, de modo que podamos mockearlo con facilidad.

## Una kata para aplicar en la vida real

Apostaría algo a que si has tenido o tienes que lidiar con legacy te has encontrado con todos estos problemas, y unos cuantos más.

Por eso, me parece que es un ejercicio muy bueno para practicar estrategias con las que afrontar tareas de refactoring en código legacy que tengamos en producción.
