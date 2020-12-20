---
layout: post
title: Refactoring second edition. Martin Fowler.
categories: articles
tags: books refactoring
---

Habrán pasado unos tres años desde que leí la primera edición de Refactoring. Esta actualización de 2019 ha rejuvenecido el material original, sin perder una pizca de utilidad.

El libro está estructurado entre dos grandes bloques, una parte introductoria sobre refactoring, smells y testing y el catálogo de refactors propiamente dicho. La primera parte se puede leer de forma bastante lineal, mientras que el catálogo es un material de referencia en el que puedes ir hojeando o consultar cuando necesites ejecutar algún refactor concreto.

Cuando salió la primera edición la idea de refactor era relativamente novedosa, pot lo que se incluían algunos capítulos que ya no están presentes, incluyendo dos sobre la aceptación de la idea entre los programadores y las primeras herramientas para refactor automático que hoy damos por supuestas. La estructura del catálogo también ha variado un poco. En conjunto, la nueva versión del libro es más atractiva a priori y la impresión general tras leerlo es que es más ágil y agradable para leer.

Por otro lado, uno de los elementos que más llama la atención es que todos los ejemplos de código están en Javascript y no son puramente orientados a objetos, lo que consigue introducir la idea de que el refactor es aplicable a cualquier tipo de código en cualquier lenguaje, por si no quedaba lo suficientemente claro.

Personalmente, el capítulo que más me interesa en este momento es el segundo: "Principles in Refactoring" que ayuda no sólo a definir qué es realmente Refactoring, sino también en qué momentos y cómo hacerlo. Buena parte de este capítulo es el núcleo de [esta charla](https://youtu.be/vqEg37e4Mkw).

Por detrás, y a muy poca distancia, estaría el capítulo sobre los *smells*, escrito con Kent Beck, en el que se explican qué tipo de problemas podemos encontrar en el código y qué refactors aplicar para solucionarlos.

Con estos dos capítulos y el catálogo tenemos una caja de herramientas con la que enfrentarnos al código y mantenerlo en forma.

## Introduciendo el refactoring en tu trabajo 

El caso es que a día de hoy el concepto de refactor está bastante tergiversado. *Refactoring* es la acción y el efecto de aplicar pequeños cambios en un código con el objetivo de mejorar su estructura sin cambiar su comportamiento. Sin embargo, con frecuencia escuchamos hablar de refactor como el rediseño de módulos completos de código.

Aunque los objetivos sean los mismos en el largo plazo, mejorar la estructura y sostenibilidad del código, hay grandes diferencias entre el *refactoring* y esta reescritura/rediseño. 

El *refactoring* es un proceso que se realiza todo el tiempo y busca mejorar el estado de un código en el que estamos trabajando en base a pequeñas transformaciones a medida que vamos entendiendo mejor el código y somos capaces de expresarlo en el código mismo. Estos pequeños pasos suelen tener un ámbito bastante acotado, a una función, a una clase y tal vez sus consumidoras y, ocasionalmente, introduce nuevos componentes. Además, el *refactoring* no rompe el comportamiento del código reflejado en los tests, aunque ocasionalmente tendremos que retocar estos.

El rediseño es un proceso que altera sustancialmente y de una sola vez un módulo de código y requiere reescribir también los tests.

Se pueden detectar algunos smells en relación al *refactoring*. Es decir: no es *refactoring*:

* Cuando se pospone cualquier mínima intervención en el código a la espera del momento *oportuno* o porque no *tenemos tiempo*.
* Cuando se pide que existan tareas de *refactoring* en un sprint, o la existencia de sprints de *refactoring*.
* Cuando se pide *permiso* a negocio para refactorizar.

Con respecto a negocio, el refactoring es una pequeña inversión de tiempo para ganar velocidad a medio y largo plazo. En primer lugar, un código enrevesado hace que sea difícil mejorar o añadir *features*, así que invertir en refactoring va en beneficio del negocio, del mismo modo que invertimos en research para entender mejor a nuestros clientes.

Por esa razón, no tiene sentido pedir *permiso* para hacer refactoring (bien entendido). De hecho, necesitamos hacer *refactoring* para poner el código en disposición de aceptar una nueva feature, o de corregir un bug, e incluso para prepararlo de cara a futuras mejoras de arquitectura. Si haces estimaciones, simplemente considera que la estimación incluye una parte de refactoring y posiblemente una parte de testing.

Para ello, esta segunda edición de *Refactoring* es una herramienta muy valiosa y práctica.



