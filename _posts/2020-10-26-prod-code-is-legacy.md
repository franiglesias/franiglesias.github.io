---
layout: post
title: Mi código en producción ya es legacy
categories: articles
tags: misc
---

Artículo que [versiona la charla](/peum-conf-2020).

Todo código es *legacy*. Esto no es malo, sino una cuestión de cuán *legacy* es o le dejamos ser.

## Cómo desarrollamos

Hay dos fuerzas principales que mueven el desarrollo de software.

Por una parte, está lo que sabemos acerca del dominio de nuestras aplicaciones. Es decir, del problema al que nuestro software pretende contribuir con una solución.

Por otra, está nuestra capacidad de expresar ese conocimiento en forma de código, lo que incluye nuestra experiencia en el lenguaje, nuestra capacidad para poner nombres, encontrar patrones y detectar defectos, reales y potenciales.

## ¿Qué es el software?

El software es una representación ejecutable del conocimiento del dominio que proporciona valor a sus consumidoras o usuarias, creando features o funcionalidades que satisfacen necesidades de esas mismas usuarias.

Estas pueden proporcionar un feedback, ya sea intencionado o deducido del modo en que utilizan el software, que a su vez cambia el conocimiento que tenemos del problema y, por lo tanto, cambia el dominio.

Este ciclo de feedback es lo que provoca que siempre exista un desfase entre el código y el conocimiento del dominio que hace posible ese código.

En resumidas cuentas, todo el código en producción es legacy eventualmente.

## ¿Y que hay de los tests?

Los tests son otra representación del dominio, que está orientada a describir el comportamiento esperado del software. Como tal representación en código es, del mismo modo, eventualmente inconsistente con el conocimiento del dominio.

Así, el código de producción representa la estructura del conocimiento del dominio (conceptos, procesos y reglas de negocio), y el código de producción representa el comportamiento esperado o deseado del software a partir de la observación de sus *outcomes*.

## Legacy

Podemos definir el *legacy* como el desfase existente entre el conocimiento de dominio y su representación en código.

O bien, decir que tenemos *legacy* cuando el código ha dejado de representar el conocimiento actual del dominio.

El dominio es un área del conocimiento que está en constante cambio, expansión y ramificación. Nuestro conocimiento sólo puede aspirar a mantenerse razonablemente dentro de sus límites y también en constante expansión y ramificación. El código va por detrás, como hemos visto, pero también creciendo. El ideal del código es mantener una representación completa de ese conocimiento.

En una situación de legacy, el código se encuentra desfasado con respecto al conocimiento. De hecho, puede que esté apuntando a áreas fuera del conocimiento actual del negocio, de tal modo que debemos preguntarnos: ¿a quién está sirviendo este código?

En realidad, la situación de legacy tiene que plantearnos un montón de preguntas:

* ¿A qué clientes estamos sirviendo con este código?
* ¿A dónde va a parar el feedback que genera el uso de este código o su falta de uso?
* ¿Por qué no hay o no ha habido transferencia entre el conocimiento de negocio y el software?
* ¿De dónde viene el conocimiento de negocio?
* ¿Dónde se está aplicando?

Son preguntas que no atañen sólo al software, sino que cuestionan la forma en que la propia organización gestiona su conocimiento y cómo integra su software dentro de su operativa.

## El esqueleto de un framework

Una de las problemáticas habituales en los códigos que consideramos legacy es la presencia de un framework. No me entiendas mal, para desarrollar software de producto de una manera medianamente rápida y segura, necesitamos partir de una serie de elementos básicos que los frameworks nos puede proporcionar. Pero, un framework no es sólo código, sino una serie de decisiones que pueden condicionar la capacidad de nuestro software para expresar nuestro modelo mental del negocio en el que nos encontramos.

Así, los típicos frameworks MVC suelen proponer una estructura de carpetas muy "técnica" que no dice mucho acerca de cómo se estructura nuestro negocio. Más allá de eso, pueden haber optado por decisiones técnicas que complican su evolución, como la apuesta generalizada de estos frameworks por patrones como Active Record, o el propio MVC.

El beneficio de la velocidad para poner en marcha un proyecto puede no verse compensado por las dificultades a la hora de escalar ese mismo software cuando las necesidades del negocio aumentan.

En cambio, una arquitectura limpia, que estructure el software por capas y con reglas claras de dependencia, nos permite mayor libertad en todos los ámbitos y, sobre todo, mantener el control de la representación del conocimiento.

Así, el conocimiento de negocio puede reflejarse en una capa de dominio rica, estructurada en torno a los conceptos, procesos y reglas de negocio.,

La necesidades de las usuarias quedarían recogidas en una capa de aplicación estructurada en tornos a los casos de uso.

Y, finalmente, toda la tecnología necesaria para la implementación quedaría en una capa de infraestructura, supeditada a las necesidades de la capa de dominio y organizada de forma significativa, en la que, por cierto, cabría un framework MVC destinada al que es su espacio natural en la UI.

## Refactor

En este planteamiento, el objetivo del refactor es mejorar la representación del conocimiento (refactor for insight, en palabras de Eric Evans). Básicamente con refactors que hagan que el código exprese intenciones y moviendo lógica de negocio hacia el dominio.

## Reflexión final

Pensar que todo el código es legacy es una idea liberadora. Nos ayuda a pensar que no necesitamos saberlo todo desde el principio. Del mismo modo en que el conocimiento evoluciona el software debe cambiar para adaptarse.

En realidad, ni siquiera es una idea nueva, toda la base del desarrollo ágil gira en torno a la premisa de que el software es, ni más y menos, una concreción de lo que podemos saber del negocio en un momento dado y de que la mejor forma de desarrollarlo es ponerlo a funcionar, obtener feedback y actuar en consecuencia con ese feedback.
