---
layout: post
title: Refactor cotidiano
categories: articles
tags: good-practices refactoring
---

Presentamos el primer curso/guía de The Talking Bit.

En The Talking Bit hemos [escrito bastante sobre refactor](/tag/refactoring/), principalmente porque nos parece que es una de las mejores cosas que podemos hacer con nuestro código, sea nuevo o legacy.

El refactor es una forma de mantenimiento del código que consiste en mejorar su expresividad a través de pequeños cambios que no alteran el comportamiento y que tampoco cambian sustancialmente la implementación.

Una reescritura, por el contrario, suele plantear un cambio brusco de implementación que podría incluso provocar algunos cambios en el comportamiento.

Por otro lado, el refactor puede hacerse de una manera contínua e iterativa, interviniendo en el código siempre que se tenga ocasión. Por ejemplo, porque estamos revisándolo a fin de corregir un error o añadir una nueva característica.

Durante el proceso de lectura y análisis podemos encontrarnos con fragmentos de código que no expresan bien un concepto del dominio, que no se entienden fácilmente o que interfieren en la compresión de ese código. Ese momento es ideal para realizar pequeños refactors seguros que, acumulados a lo largo del tiempo, van haciendo que el código evolucione hacia un mejor diseño. Pero sobre todo, hacen que el código refleje cada vez mejor el conocimiento que tenemos.

Como ya hemos mencionado en otras ocasiones, [el refactor trata principalmente sobre conocimiento y significado](/refactor-knowledge-meaning/). Es decir, trata sobre que el código exprese cosas y, concretamente, que exprese de la mejor forma posible nuestro conocimiento sobre el dominio en el que trabajamos y cómo estamos resolviendo los problemas que nos plantea.

Por esa razón, se nos ha ocurrido que podría ser buena idea iniciar una especie de curso o guía para aprender sobre cómo hacer "refactor cotidiano".

## Refactor cotidiano

La idea del refactor cotidiano es muy simple:

Se trata de realizar pequeños refactors seguros en nuestro código en cualquier momento que se nos presente la ocasión. Es lo que algunos autores denominan **refactor oportunista**.

Nuestra propuesta concreta es que hagas un refactor muy pequeño cada vez que lo veas necesario, de modo que, en una primera fase:

* sólo tocas un archivo.
* los cambios quedan recogidos en un único commit atómico, que contengan sólo los cambios debidos a ese refactor.

En una segunda fase:

* los cambios podrían a varios archivos, pero el ámbito es limitado.
* los cambios quedan recogidos en un único commit atómico.

En una tercera fase:

* los cambios podrían suponer introducción de nuevas clases.
* de nuevo, los cambios quedarían recogidos en un único commit.

## La guía

En The Talking Bit iremos publicando artículos sobre aspectos concretos que podrías refactorizar. La idea es explicar ámbitos en los que podrías intervenir en los tres niveles indicados en el apartado anterior.

En muchos casos los refactors propuestos, al menos en el primer nivel o fase no  necesitarían tests porque podrían ejecutarse mediante herramientas del IDE.

Con el tiempo, es posible que esos pequeños refactors acumulados día tras día, mejoren la forma y calidad de tu código y te despejen caminos para mejorar su expresividad y arquitectura.

Puedes empezar por este [primer artículo sobre los comentarios](/everyday-refactor-1/).

Así que, ¡happy refactoring!
