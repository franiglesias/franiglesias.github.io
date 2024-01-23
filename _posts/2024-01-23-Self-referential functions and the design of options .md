---
layout: mini-post
title: Self-referential functions and the design of options 
categories: articles
tags: tb-list golang
---

Me guardo este artículo de Rob Pike que explica como usar funciones autorreferenciales para pasar parámetros a funciones en Go. Ya, yo también me quedo un poco igual con este título, la verdad, pero resuelve un problema bastante interesante: diseñar signaturas de funciones que puedan recibir un número indeterminado de parámetros de una forma bastante limpia.


> I've tried most of the obvious ways: option structs, lots of methods, variant constructors, and more, and found them
all unsatisfactory. After a bunch of trial versions over the past year or so, and a lot of conversations with other
Gophers making suggestions, I've finally found one I like. You might like it too. Or you might not, but either way it
does show an interesting use of self-referential functions.

[Self-referential functions and the design of options ](https://commandcenter.blogspot.com/2014/01/self-referential-functions-and-design.html)
