---
layout: post
title: De directory driven a DDD paso a paso 2
categories: articles
tags: good-practices design-principles ddd
---

Directory driven development es lo que suele salir cuando intentas hacer DDD sin entender bien la parte estratégica. En el artículo anterior nos quedamos en el tema de los agregados. En este, vamos a empezar a hablar de cómo se mueve el código al dominio.

## Empujar el conocimiento hacia el dominio

La idea de mover conocimiento a dominio consiste básicamente en darle comportamiento rico a los componentes del dominoi: value objects, entidades, agregados y servicios. Para ello haremos refactorizaciones pequeñas con ese objetivo.

Contamos con dos herramientas de las que ya [hemos hablado con anterioridad en el blog](/everyday-refactor-6/):

* Ley de demeter 
* Tell, don't ask

### Ley de demeter

Un método de una clase sólo debe hablar con los objetos que conoce:

* La propia clase, de la que puede usar todos sus métodos.
* Objetos que son propiedades de esa clase.
* Objetos creados en el mismo método que los usa.
* Objetos pasados como parámetros a ese método.

Es relativamente sencillo detectar los casos de violaciones de esta ley. Basta fijarse en la existencia de cadenas de llamadas en las que se intenta acceder a métodos de un objeto que está dentro de otro, incluso a varios niveles de profundidad.

Las violaciones de la ley de Demeter pueden disimularse fácilmente, pero siguen siendo violaciones. Es decir, utilizar un agregado para obtener un objeto contenido en él y usar éste es básicamente una violación soterrada de la ley de Demeter.

Ahora bien, la solución no siempre es sencilla. Al menos existen dos posibilidades:

La primera es que tenga sentido encapsular la cadena de llamadas dentro de un método del objeto raíz. En este caso estaríamos hablando de un agregado o de una entidad candidata a ser un agregado.


La segunda posibilidad, por supuesto, es que no tenga sentido encapsular esa llamada en ese objeto raíz, sino que la necesidad de utilizar el encadenamiento venga de querer tener un acceso "fácil" al objeto que sí queremos usar. Y si se da este supuesto seguramente nos tengamos que replantear cómo estamos haciendo las cosas.


En resumen, aplicar la Ley de Demeter en el código mejora la encapsulación, facilita el testing y además ayuda a descubrir los agregados.


### Tell, don't ask

El principio Tell, don't ask, consiste en que cualquier operación que use y cambie el estado de un objeto debe realizarse como llamada a un método de ese objeto, pasándole los parámetros extra que pueda necesitar.

En ocasiones encontramos ejemplos de código en los que la lógica nos pide preguntar (ask) por el estado de un objeto, operar con él y, finalmente, cambiar el estado del objeto con el resultado de la operación.


Aplicar Tell, don't ask nos ayuda a construir un modelo rico de entidades, value objects y agregados, con comportamientos complejos que representan reglas de dominio.


En algunos casos puede ocurrir que la dificultad para aplicar este principio nos esté sugiriendo la necesidad de crear servicios de dominio que gestionen interacciones entre entidades para implementar comportamientos que no encajan conceptualmente en una sola de ellas.

