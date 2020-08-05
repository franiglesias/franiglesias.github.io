---
layout: post
title: El anti-patrón repositorio
categories: articles
tags: ddd bbdd good-practices
---

La aplicación ciega de metodologías, principios de diseño o patrones, puede llevarnos a generar más problemas que soluciones. Tomemos por ejemplo, el patrón repositorio.

## El patrón repositorio

El concepto de repositorio en Domain Driven Design hace referencia al lugar donde el dominio puede guardar y recuperar entidades o agregados. En este artículo, utilizaré indistintamente el concepto de entidad y de agregado la mayor parte del tiempo.

Este repositorio, por definición, se comporta como una colección en memoria en el que podemos guardar una entidad y reclamarla más adelante gracias a que conocemos su identidad. En condiciones ideales, un repositorio tiene disponibilidad inmediata, capacidad de almacenamiento infinita y persistencia infinita.

Sí: en la práctica tenemos bastantes limitaciones dependiendo de los mecanismos concretos de persistencia. La idea de una colección en memoria no se sostiene desde el punto de vista de que las máquinas físicas en las que funciona el software se reiniciarán más de una vez, que la capacidad de memoria no es ilimitada y otras muchas circunstancias. En la práctica, usamos tecnologías concretas que crean la ilusión de que esas limitaciones no existen. 

Pero en la capa de dominio lo que usamos son modelos abstractos, por lo que desde el punto de vista de los procesos de dominio el repositorio no es más que una colección en la que guardar entidades creadas a las que podría querer acceder en algún momento.

Esta abstracción suele representarse con una Interface, lo que nos permite implementar repositorios usando tecnologías concretas para la persistencia. Así, estas tecnologías nos permitirían crear repositorios en memoria, usando ficheros en un sistema de archivos, usando bases de datos relacionales o usando bases de datos no sql, lo que mejor nos parezca.

Un repositorio tiene tres comportamientos posibles:

* **Almacenar entidades**: el repositorio nos tiene que permitir guardar una entidad ya creada de modo que podamos recuperarla íntegra en un futuro. Lo podemos representar con métodos llamados `store` o similar. Las entidades o agregados tienen que tener identidad cuando las guardamos, no queremos que sea el sistema de persistencia el que la asigne. Esto equivale a un método `append` en un objeto Collection.
* **Recuperar entidades por su identidad**: el repositorio nos tiene que permitir recuperar una entidad existente usando su identidad. Lo podemos representar con métodos llamados `retrieve` o `getById`. No usaríamos `find` porque no tenemos que "buscar" la entidad, si tenemos una identidad esta tendría que existir en el repositorio. Esto equivale a obtener un objeto de una colección dada su "key".
* **Recuperar entidades que cumplan una especificación**: el repositorio nos tiene que permitir recuperar una colección de entidades que cumplan una serie de condiciones formuladas como una especificación. Lo podemos representar mediante un método `findSatisfying". La especificación es un concepto que representa una regla de dominio que las entidades pueden cumplir o no. [Ya hemos hablado en otras ocasiones del patrón Specification](/the-way-to-ddd-2). Esto es similar al metodo `filter` de una colección.

Y hasta aquí el patrón repositorio.

## El problema con los repositorios

Por lo general abusamos de los repositorios. Esto nos lleva a un montón de problemas. Y este abuso se produce porque no tenemos en cuenta una regla fundamental:

> Los repositorios no son la puerta de acceso a la base de datos

No. Los repositorios no son la puerta de acceso a la base de datos. Al ignorar esta premisa intentamos exprimir los repositorios para que nos devuelvan cualquier colección de datos que necesitemos y que sabemos que está guardada en la base de datos.

Volvamos a la definición, y esta vez a la de Eric Evans, por si queda alguna duda:

"For each type of object that needs global access, create an object that can provide the illusion of an in-memory collection of all objects of that type. Set up access through a well-known global interface. Provide methods to add and remove objects, which will encapsulate the actual insertion of removal of data in the data store. Provide methods that select objects based on some criteria and return fully instantiated objects or collections of objects whose attribute values meet the criteria, thereby encapsulating the actual storage and query technology. Provide repositories only for aggregate roots that actually need direct access. Keep the client focused on the model, delegating all object storage and access to the Repositories."

De nuevo: para el dominio la forma o mecanismo en la que se mantiene la información es completamente indiferente, todo lo que considera es una colección en memoria (o una ilusión de una colección en memoria) en la que puede almacenar o recuperar entidades o agregados.

Ahora bien, en toda aplicación que pretenda ser útil y utilizable tenemos que considerar un montón de casos de uso que tienen sus peculiaridades.

### Lo que esconde una vista

Una situación habitual en cualquier aplicación es mostrar una vista que sea un listado de entidades o agregados disponibles en el sistema. Imagina un típico listado de clientes. El agregado Cliente, puede contener un pequeño universo de entidades, como Perfiles, Pedidos, Facturas y otros muchos. La petición a base de datos de un sólo cliente desencadenará numerosas peticiones a varias tablas cuyos resultados nos permitirán reconstruir el agregado. Ahora imagina eso mismo aplicado a cientos, miles o decenas de miles de clientes.

¿Quiere decir que para obtener los datos necesarios para generar un listado de clientes tengo que pedir al repositorio todas las entidades existentes y cargarlas en memoria? Incluso aunque aplique una especificación que limite su número, hacerlo así suena como una llamada al desastre en cuanto a consumo de recursos y memoria.

Típicamente, estos listados necesitan una cantidad reducida de información:

* Dos ó tres campos de la entidad cliente (su identidad, un nombre significativo, algún dato de categorización de primer nivel, etc.)
* Quizá algún dato agregado (número total de pedidos, facturas, etc.)
* Un número limitado de clientes por página mostrada, una consideración que, por otra parte, es totalmente indiferente para el dominio.
* Frecuentemente se necesita filtrar y ordenar el listado.

Es decir, es evidente que hay una desproporción entre los datos que se necesitan mostrar y los que obtendríamos haciendo una petición al repositorio. De hecho, pedir este listado a un repositorio no es sólo ineficiente, sino que no tiene el más mínimo sentido. El dominio no entiende de páginas, de filtros o de ordenación. Todo eso con problemas de la capa de presentación, por tanto, de la infraestructura.

Este tipo de listados son necesarios para muchas acciones que necesitan los usuarios del sistema. Imagina, por ejemplo, la vista de entregas por repartidor de una empresa de transportes. El caso de uso será algo así como "mostrar la lista de entregas para la ruta X". Muy posiblemente el meollo de ese caso de uso sea la optimización de las entregas en la ruta para minimizar el tiempo. El listado sólo es la visualización de ese resultado. Es posible que el número de entregas totales alcance varias decenas, mientras que cada página de la vista sólo muestre 15 ó 20 porque es la capacidad de la pantalla disponible.

Claramente tenemos dos problemas distintos: la selección de entregas y el cálculo de la ruta óptima para ese día, que es una cuestión del dominio, y la visualización de esa ruta que es una cuestión de la infraestructura.

### Representation Model

Una forma de enfocar este problema es utilizar el concepto de Representation Model. Como su nombre indica, sería una representación de
