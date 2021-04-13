---
layout: post
title: Coverage (Blogtober2019)
categories: articles
tags: blogtober19
---

Mi compañera y manager en Holaluz [Mavi Jiménez](https://twitter.com/Linkita) va a hacer un dibujo cada día del mes sobre una palabra propuesta en twitter. Y aquí vamos a intentar escribir [un post por cada una de ellas](https://franiglesias.github.io/blogtober19-status/).


## Coverage

Podría ventilar la palabra del día con [lo que ya había escrito hace tiempo en este artículo](https://franiglesias.github.io/code-coverage-para-mejores-tests/), pero nunca está demás recordar que los números, si los retuerces bien, dicen todo lo que necesitas y más.

Siempre es bueno tener métricas, pero las métricas sin contexto no sirven de mucho. El code coverage de los tests por sí mismo es una información poco útil. 

Por un lado, es una de las métricas más falseable que nos podamos echar a la cara, pues basta con aplicar unos pocos trucos de dudoso gusto y menor ética para conseguir coberturas elevadas sin esfuerzo: unos cuantos `assertTrue(true)` y listo.

Tampoco hace falta llegar a este extremo. Tan solo testeando los casos seguros por unidad nos servirán para conseguir una cobertura alta sin demasiado esfuerzo.

En ambos casos, la métrica no dice nada sobre la situación del testing en esa base de código.

Como desarrolladores, el testing es un ejercicio de responsabilidad y también de honestidad. Responsabilidad para poder hablar sobre el comportamiento del código con pruebas que otros pueden ejecutar y verificar. Y honestidad por asegurarnos de que esas pruebas, valga la redundancia, ponen a prueba, e incluso en apuros, el software que escribimos.


