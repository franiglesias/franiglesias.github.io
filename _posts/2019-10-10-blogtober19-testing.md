---
layout: post
title: Testing (Blogtober2019)
categories: articles
tags: blogtober19
---

Mi compañera y manager en Holaluz [Mavi Jiménez](https://twitter.com/Linkita) va a hacer un dibujo cada día del mes sobre una palabra propuesta en twitter. Y aquí vamos a intentar escribir [un post por cada una de ellas](https://franiglesias.github.io/blogtober19-status/).

<blockquote class="twitter-tweet" data-conversation="none"><p lang="en" dir="ltr">10. Testing <a href="https://twitter.com/vgaltes?ref_src=twsrc%5Etfw">@vgaltes</a> <a href="https://twitter.com/hashtag/inktober?src=hash&amp;ref_src=twsrc%5Etfw">#inktober</a> <a href="https://twitter.com/hashtag/inktober10?src=hash&amp;ref_src=twsrc%5Etfw">#inktober10</a> <a href="https://twitter.com/hashtag/linkitober?src=hash&amp;ref_src=twsrc%5Etfw">#linkitober</a> <a href="https://t.co/ITxhSUybaX">pic.twitter.com/ITxhSUybaX</a></p>&mdash; Maybe (@Linkita) <a href="https://twitter.com/Linkita/status/1182725159997923329?ref_src=twsrc%5Etfw">October 11, 2019</a></blockquote> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>

## Testing

Como ya sabes, uno de los temas principales de este blog es el testing, así que resulta un poco complicado encontrar un enfoque distinto que aporte sentido a un artículo para este _blogtober_ que no sea repetitivo.

Una de las cuestiones que me preocupa últimamente sobre testing es que tenemos bastante confusión sobre de qué se trata el testing, no lo hacemos muy bien y lo hacemos a desgana.

En este [artículo](https://franiglesias.github.io/test-duality/) caía en la cuenta de que hablamos de testing para referirnos a dos cosas que son muy parecidas y, sin embargo, muy diferentes: el testing como herramienta de control de calidad, y el testing como herramienta de desarrollo.

Uno de los problemas de la mala fama del testing entre los developers (no me digáis que no) creo que viene de no ser consciente de esa dualidad. En la práctica mezclamos ambas cosas, lo que nos deja una cierta sensación de que se trata de una pérdida de tiempo. Vemos el testing como una tarea extra que no nos aporta realmente nada.

Creo que como developers tendríamos que centrarnos en el aspecto del testing como herramienta de desarrollo para poder apreciar su valor. Eso, normalmente, implica acercarse a otro gran incomprendido: Test Driven Development. TDD no es una herramienta de QA, es una herramienta de desarrollo. Lo mismo que su versión "extrema", el Behavior Driven Development, que puede considerarse incluso como una herramienta básica para el Domain Driven Design.

Deberíamos ver los tests como especificaciones formalizadas del comportamiento del software que desarrollamos y utilizarlos para guiar el proceso de desarrollo. Estos tests nos permiten explorar implementaciones y hacerlas evolucionar con la seguridad de contar con un sistema que nos indica en cada momento si estamos creando la funcionalidad deseada.


