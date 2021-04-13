---
layout: post
title: Deprecated (Blogtober2019)
categories: articles
tags: blogtober19
---

Mi compañera y manager en Holaluz [Mavi Jiménez](https://twitter.com/Linkita) va a hacer un dibujo cada día del mes sobre una palabra propuesta en twitter. Y aquí vamos a intentar escribir [un post por cada una de ellas](https://franiglesias.github.io/blogtober19-status/).


## Deprecated

Los [significados de la palabra *deprecated*](https://www.linguee.com/english-spanish/translation/deprecated.html) oscilan entre los esperados desfasado u obsoleto y los algo más *cargados* menospreciado, desacreditado o despreciado.

Me viene bien esto, porque en parte me ayuda a prepararme para la próxima palabra, que será `legacy`.

El uso habitual de *deprecated* es el de marcar algo como obsoleto, ya sea una función, una clase, un endpoint de una API, etc, aunque aún no se retire del código, con el objeto de dejar de usarlo de manera ordenada y recurrir a las alternativas disponibles. De este modo se evitan roturas de servicio.

Claro que, a veces, también ocurre que el proceso de *deprecation* no funciona como es debido. Por ejemplo, que una unidad *deprecated* nunca llega a borrarse del código, generando un bloque de código muerto que acaba distrayéndonos mientras buscamos información que nos confirme que efectivamente no se utiliza para nada.

Esto puede pasar en parte por no tener una política clara de *deprecations* y un proceso asociado, pero también por una mala organización del código, en la que las piezas relacionadas se encuentran en lugares muy diferentes. Por ejemplo, cuando se estructura en base a criterios técnicos, lo que provoca que se pierda la cohesión entre elementos que cambian juntos, pero que se encuentran físicamente separados, facilitando que nos dejemos algunos por el camino.

El resultado es que la base de código se convierte en un campo embarrado con zonas seguras y otras zonas que resultan ser un charco de lodo. Con suerte, no es más que un simple charco, pero tenemos que dedicar tiempo a asegurarnos de que no se trata de un pozo.
