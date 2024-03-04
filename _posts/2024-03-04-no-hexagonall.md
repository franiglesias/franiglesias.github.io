---
layout: micro-post
title: No, Domain-Application-Infrastructure no es arquitectura hexagonal
categories: articles
tags: tb-list design-patterns
---

No pasa un día en que no me encuentre con un post, un vídeo o un comentario en alguna red en la que alguien diga algo así como: "en mi equipo estamos haciendo arquitectura hexagonal y tenemos la capa de dominio, la de aplicación y la de infraestructura".

Pues no. No estáis haciendo arquitectura hexagonal. Eso que mencionas es una arquitectura de tres capas que recoge conceptos comunes de las arquitecturas limpias:

* El dominio está aislado del mundo real y define abstracciones para no depender de tecnologías concretas.
* Los casos de usos coordinan los elementos del dominio para ejecutar las finalidades de la aplicación y viven en una capa que puede tener ese nombre.
* Los detalles de implementación de las abstracciones del dominio viven en una capa de infraestructura.
* Las dependencias siempre apuntan al dominio, que es como decir, que todo depende del dominio y el dominio no depende de nada más.

¡Ojo!, no estoy diciendo que eso esté mal. De hecho, si lo estás haciendo así, en realidad está muy bien. Es solo que eso no se llama arquitectura hexagonal. Si hablas de arquitectura hexagonal háblame de puertos y háblame de adaptadores. Pero no de capas, aunque puedes organizar tu aplicación en capas si así te viene bien.

Y no es por ser pejiguero. Pero usar la terminología con precisión es un deber profesional. De otro modo, no podemos comunicarnos eficazmente.

> Es raro el equipo de desarrollo que no diga que está haciendo Arquitectura Hexagonal en sus proyectos. Es raro el equipo de desarrollo que la esté haciendo realmente.

[No, Domain-Application-Infrastructure no es arquitectura hexagonal](https://franiglesias.github.io/hexagonal/)
