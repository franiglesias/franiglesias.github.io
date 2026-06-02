---
layout: post
title: La ética de las buenas prácticas (3)
categories: articles
author: [paula, fran]
tags: testing soft-skills ethics
---


## La ética de la calidad del software

Definir lo que es un buen o mal trabajo implica haber establecido un conjunto de criterios, un sistema de valores.

En buena parte esta definición tiene que ver con los efectos que produce un buen o mal trabajo, algo que puede ser cuantificable o no, pero que también depende de los efectos que produce.

Veamos algunos ejemplos:

### Código difícil de mantener

El código difícil de mantener puede implicar diferentes costes:

* Si en el futuro es necesario cambiarlo, requerirá más tiempo que si estuviese diseñado para la mantenibilidad. Este tiempo tiene un coste en horas de desarrollo que se puede cuantificar.
* Si ese código tiene fallos, puede ser difícil encontrarlos y subsanarlos. De nuevo, coste de horas de trabajo.

Este efecto, sin embargo, podría considerarse a parte de los presentados arriba, en el sentido de que no afecta tanto a las personas que utilizan este software, sino a quienes lo crean. Quizá no sea código mentiroso, quizá se trate de software funcional. Sin embargo, la falta de atención a un diseño mantenible, pueden llevar a esta situación que genera un sobrecoste y bastante frustración a la hora de trabajar con esta base de código.

### Software con errores

El software tiene errores.

* Los fallos del software generan problemas a los usuarios del mismo que pueden suponer desde pequeñas molestias a grandes pérdidas, que tienen costes cuantificables pero también intangibles que no podemos prever.
* Los fallos del software pueden generar desconfianza en los usuarios, que podrían decidir utilizar otro producto. Esto tiene un coste directo para nuestra empresa.

### Software mentiroso

El código no hace lo que se espera o no hace lo que dice que hace.

* El código oculta errores que suceden y que, en último término, provocan que el producto o servicio que se espera nunca llegue al usuario.
* El código realiza operaciones de forma oculta para registrar conocimiento sobre el usuario.
* El código se aprovecha de la actividad del usuario para obtener algún tipo de beneficio sin su consentimiento.

## Código mentiroso

Código mentiroso es el código que no hace lo que dice que hace. Y, como en todo, hay grados:

* El código mal escrito, que tiene errores o no funciona y, por tanto, no hace lo que dice.
* El código que no representa correctamente los conceptos, invariantes y procesos del dominio para el que pretende ser una herramienta.
* El código que, simplemente, no hace lo que se supone que debe hacer.
* El código que hace cosas de manera oculta, además de lo que dice que hace.
* El código que pretende, directamente, engañarnos.

Cabe destacar que en esta lista se intenta tan solo describir el concepto del código mentiroso, como contrapartida del código funcional presentado más arriba. Claramente, la intencionalidad de la persona que escribe el código es clave en cada uno de estos puntos, pero no entraremos ahora a evaluarla.




