---
layout: post
title: Encapsular colecciones
categories: articles
tags: design-patterns oop
---

Se podría decir que esta es la segunda parte del [artículo anterior](/types_vs_value_objects/), porque vamos a seguir hablando de nunca usar tipos nativos de un lenguaje para definir conceptos de nuestros dominios.

## Golang y los maps

Vamos a empezar con un ejemplo. El lenguaje Golang tiene un pequeño inconveniente que ejemplifica muy bien la necesidad y ventajas de encapsular colecciones en objetos. 

Golang tiene la estructura de datos nativa `map`, que en otros lenguajes llamamos _hash_, _diccionario_(Python) o _array asociativo_ (PHP). Básicamente, nos sirve para guardar una colección de datos identificados por una clave.


```go
```

Hasta aquí todo bien. El problema puede venir si necesitamos que el `map` esté ordenado por sus claves, ya que Golang no garantiza que el orden de iteración de las claves sea el mismo que el de inserción. Si yo quiero iterar los elementos de un map, cada vez podría ocurrir en un orden diferente, pues utiliza una ordenación pseudoaleatoria. Es más, históricamente esta implementación ha ido cambiando y podría volver cambiar en el futuro, por lo que cualquier programa que dependa de algún modo de la misma, está condenado a tener problemas[^1].

[^1]: De hecho, la definición de un map es la de una colección no ordenada, pero en otros lenguajes el comportamiento de este tipo de estructura es que el orden de inserción se mantiene en las iteraciones. Por esa razón, cuando empezamos con Golang este comportamiento se nos hace extraño.

Es un ejemplo perfecto de todos los problemas que acarrea usar directamente los tipos del lenguaje: no solo nos tenemos que adaptar a sus características, sino que incluso podríamos vernos afectadas por cambios de comportamiento.

¿Y cuál es la solución a este problema? Pues encapsular la estructura de datos nativa en objetos. En este caso, es habitual guardar una especie de índice de claves en un array, que sí conserva el orden de inserción, y utilizarlo cuando necesitamos obtener los elementos por tal orden.

```go

```

Por otra parte, esta encapsulación nos permitirá exponer únicamente aquellos comportamientos que tengan sentido para el dominio, lo cual es especialmente interesante si necesitan utilizarse en distintos lugares.

Pero, ¿cómo nos ayuda esto a evitar los problemas de usar la estructura nativa? ¿Acaso los problemas no siguen estando ahí aunque los ocultes detrás de una estructura propia?

La palabra clave es precisamente "ocultar". Lo que buscamos no es desarrollar desde cero nuestra propia implementación de la estructura de datos, sino evitar que el resto del programa tenga que interactuar directamente con la nativa. En su lugar, lo que exponemos es una interfaz estable, lo que nos facilitará cambiar su implementación sin que el resto del código se vea afectado.

En el ejemplo de Golang que hemos puesto, el tipo `map` seguirá sin conservar el orden de inserción, pero el resto del código no está consumiéndolo directamente, sino que depende de la interfaz del objeto que lo encapsula.
