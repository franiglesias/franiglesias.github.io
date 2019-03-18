---
layout: post
title: Refactor cotidiano (7). Extraer un servicio
categories: articles
tags: good-practices refactoring
---

No existe el código perfecto, pero siempre estamos a tiempo de mejorarlo.

No siempre creamos nuestro software siguiendo los mejores principios de diseño. Y si tenemos que trabajar en una base de código legacy estos suelen brillar por su ausencia. Sin embargo, por su propia naturaleza, el software se puede cambiar. No está escrito en piedra. Podemos refactorizar y usar los principios de diseño como criterio.

Los principios de diseño nos permiten evaluar la situación de un código al proporcionarnos un criterio de calidad.

Por ejemplo, Single Responsibility Principle nos dice que una unidad de software debería hacer una sola cosa (tener una única razón para cambiar), así que si vemos que el código con el trabajamos hace claramente más de una, ya sabemos que deberíamos tratar de separar esas responsabilidades en diferentes unidades.


