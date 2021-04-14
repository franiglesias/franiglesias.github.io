---
layout: post
title: Monolith (Blogtober2019)
categories: articles
tags: blogtober19
---

Mi compañera y manager en Holaluz [Mavi Jiménez](https://twitter.com/Linkita) va a hacer un dibujo cada día del mes sobre una palabra propuesta en twitter. Y aquí vamos a intentar escribir [un post por cada una de ellas](https://franiglesias.github.io/blogtober19-status/).


## Monolith

Al ver que la palabra del día es Monolito he pensado que tenía dos opciones: escribir sobre "El Monolito" de la película/novela *2001: A Space Odyssey* o hacerlo sobre "el monolito" como paradigma de organización del código.

*2001* es una de mis obras de ciencia ficción favoritas de todos los tiempos (la novela y la película). O quizá sea la número uno. Pero creo que mejor no voy a hablar de *ese* monolito.

Al hablar de una aplicación que está construida con base en un monolito lo que estamos diciendo es que todas las capacidades y servicios de la aplicación pertenecen a la misma base de código. Si quieres una definición bastante chusquera, pero pragmática: es una aplicación cuyo código está en un único repositorio.

Como otras cosas de nuestro sector, se habla mucho de los monolitos para ponerlos a caer de un burro porque lo que mola son los *microservicios*, cuya definición chusquera podría ser: es una aplicación cuyo código está repartido en distintos repositorios. 

La idea de los microservicios es interesante, pero yo tampoco diría que es nueva. Esencialmente se trata de que una aplicación se organice en componentes separados que se comunican a través de un sistema "agnóstico", como podrían ser un sistema de mensajería o una API REST. Esto es, en lugar de tener todos esos componentes en una misma base de código, escritos en el mismo lenguaje y comunicándose mediante llamadas estándar entre los objetos del lenguaje, cada uno de ellos podría estar escrito incluso en un lenguaje de programación diferente, más adecuado para su trabajo específico. Podrían también evolucionar o desplegarse de forma independiente, lo que contribuiría a optimizar los recursos de la organización.

Por otro lado, microservicios implicaría, de manera más o menos implícita, que cada uno de estos servicios estaría bajo la responsabilidad de un equipo de desarrollo, que se ocuparía de su creación, mantenimiento y evolución.

Claro que para conseguir que todo esto funcione hace falta un gran esfuerzo de diseño y coordinación. Al final, la conclusión es que [los microservicios introducen tanta dificultad en el diseño de un sistema](https://www.campusmvp.es/recursos/post/la-muerte-de-la-locura-de-los-microservicios-en-2018.aspx) que sospecho que en la mayor parte de los casos ni siquiera debería contemplarse como opción. 

De hecho, estamos en un [momento de reivindicación del monolito](https://www.youtube.com/watch?v=TucR8LC2PZg).

A ver. Si todavía tenemos problemas para estructurar bien una aplicación en sus capas y en empaquetar sus componentes minimizando o eliminando el acoplamiento entre ellos de forma que puedan llegar a ser separables, ¿a santo de qué podemos pensar en migrarla a microservicios? En teoría una aplicación diseñada en torno a una arquitectura limpia, con una separación clara de contextos y rigurosa en cuanto a la gestión de dependencias podría llegar a partirse en un sistema de microservicios.

Sin embargo, esta idea de que un monolito podría ser convertido en un sistema de microservicios es seguramente muy equivocada. Volviendo a las definiciones graciosas de antes: la separación en microservicios no es una simple partición del código y a correr, sino una decisión compleja que supone multitud de consideraciones tanto en lo que se refiere al código, como en los protocolos de comunicación y las necesidades de infraestructura. Los microservicios son una buena solución… para los problemas que los requieren, los demás podemos seguir usando monolitos y tan contentos.

Con todo, no hace tampoco falta llegar a los microservicios para hablar de partición de aplicaciones. Un caso común y que queda muy bien resuelto con una partición es la que hacemos cuando separamos frontend y backend y los comunicamos mediante API, lo que, entre otras cosas, nos habilita para ofrecer distintas puertas de entrada a la misma aplicación (web, mobile, etc.) manteniendo una fuente de verdad única para todas ellas y dándonos la flexibilidad para cambiarlas de forma independiente o introducir nuevas.

