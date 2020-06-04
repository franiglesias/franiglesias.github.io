---
layout: post
title: Pong en Python. Separando el legacy en Scenes
categories: articles
tags: python good-practices
---

En este artículo vamos a empezar a transformar en profundidad la parte legacy.

## Scene

Un juego puede tener varias Scenes en una venta. Cada Scene gestiona una parte del juego, que puede ser más o menos pasiva, como una pantalla de bienvenida, o activa, como una fase de un juego. En juegos grandes puede existir una relativamente compleja red de escenas. En nuestro caso, es una secuencia lineal.

Si observamos el código de `ponggame()` podemos ver que hay dos bucles que esperan eventos y que nos definen las dos escenas que tenemos en este momento (juego y final). Nosotros añadiremos una pantalla de bienvenida, para que el juego no comience de forma inmediata.

Se puede decir que cada escena tiene al menos un loop de eventos, que gestiona las pulsaciones de teclas, uso de mandos, etc., así como las actualizaciones de los objetos, sus interacciones y la visualización. Nuestro objetivo en esta fase

Nuestro objetivo en esta fase será crear la clase base Scene y las tres subclases que vamos a necesitar, de forma que obtengamos una nueva versión del juego funcionando en este paradigma que, además, nos permitirá introducir ya unas pequeñas mejoras.

Así que, vamos con la definición inicial de `Scene`. Será un enfoque similar al seguido hasta ahora, comenzando por un test sencillo que me sirva para mover el código desde `ponggame()` a la Scene correspondiente y montar todas las piezas para el juego siga funcionando. La clave es que una vez que la estructura de Scenes esté montada y funcionando, será el momento de enfrentarnos al refactor del juego en sí.



