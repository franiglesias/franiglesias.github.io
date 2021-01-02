---
layout: post
title: Practical Object Oriented Design. Sandi Metz.
categories: articles
tags: books design-principles ruby
---

Desde que leí este libro no he parado de buscar charlas, libros y otros artículos de la autora. No me había encontrado con una mejor explicación de la orientación a objetos que esta.

Antes de nada, advertir que aunque el libro utiliza Ruby para desarrollar el ejemplo de código, es recomendable y perfectamente accesible uses el lenguaje que uses. 

De hecho, cada día me convenzo más de que Ruby es ideal para explicar todo lo que tiene que ver con orientación a objetos. Es fácil de leer, muy expresivo y muy conciso. Personalmente, lo encuentro muy agradable de usar y creo que me gustaría llegar a trabajar en un proyecto Ruby algún día.

Volviendo al libro, su objetivo es enseñar el diseño orientado a objetos de una forma progresiva a partir de un ejemplo que inicialmente es muy sencillo. Para ello, tras un capítulo de introducción a la orientación a objetos, presenta el reto de escribir una primera clase que tenga una única responsabilidad.

Los problemas que escoge Sandi Metz como ilustración parecen simples, pero se las arregla para sacar a la luz con ellos toda la serie de sutiles problemas de diseño que tendremos que afrontar en cualquier proyecto de trabajo. Estos problemas estructuran los capítulos del libro, que introducen los conceptos y las soluciones de diseño.

Así, el capítulo 3, habla de las dependencias y el acoplamiento. El 4, sobre el diseño de interfaces. En el 5 se explica cómo manejar con confianza los tipos en lenguajes sin tipado estricto. Los capítulos 6, 7 y 8, hablan de herencia, roles y composición, respectivamente. Y el capítulo 9, trata sobre el testing. A lo largo de todo el libro se presentan principios de diseño, en el contexto del problema que ayudan a resolver.

Entre las ideas que más me han llamado la atención están algunas que comenzaba a intuir pero que, por alguna razón, no conseguía concretar o fundamentar. Por ejemplo: Metz propone diseños con muchos objetos pequeños colaborando, encapsulando las variantes de comportamiento hasta conseguir eliminar estructuras condicionales. Esto es algo que no he podido hacer de forma completa y para lo que aún encuentro resistencia también. En cualquier caso, es una motivación para seguir en esta línea.

Otra idea interesantísima es la forma en la que define, e incluso cuantifica, la relación de dependencia entre clases. Cuando una clase utiliza a otra tiene que conocer su nombre, el nombre del método que invocará en ella y los parámetros que tiene que pasarle. Esto nos da una medida de su grado de acoplamiento y el libro nos explica los pasos para reducirlo al mínimo.

Uno de los mejores aprendizajes que he extraído de este libro tiene que ver con el *refactoring*. En cada capítulo, el programa que se va escribiendo aborda una nueva problemática y para solucionarla, la autora procede en pasos minúsculos sin romper el comportamiento de las clases. Cada uno de estos pasos se podría mezclar y desplegar en producción sin generar ningún problema.

Junto con [99 bottles of OOP](https://sandimetz.com/99bottles) de la misma autora, [Practical Object Oriented Design](https://www.poodr.com) es un libro que está influyendo muchísimo en la forma en la que escribo software. Y, por supuesto, es una lectura obligada si quieres mejorar tus conocimientos y habilidades en diseño orientado a objetos.


