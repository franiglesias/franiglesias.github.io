---
layout: post
title: Experimentos en Machine Learning
categories: articles
tags: ml python
---

Hace tiempo que tenía ganas de experimentar un poco con Inteligencia Artificial. 

## IA no es un campo de estudios nuevos

La Inteligencia Artificial un tema con el que tomé contacto por primera vez en la carrera de Psicología, en la que, aparte de estudiar las relaciones entre el desarrollo de la informática y su aportación a la psicología científica, como la metáfora del ordenador y el modelado de procesos mentales mediante programas; también se discutía sobre la llamada Inteligencia Artificial "dura", es decir: la posibilidad de desarrollar sistemas informáticos capaces de resolver distintos tipos de problemas que requieren del ejercicio de la inteligencia.

Los [primeros pasos de la Inteligencia Artificial](https://en.wikipedia.org/wiki/History_of_artificial_intelligence#The_birth_of_artificial_intelligence_1952–1956) se dieron en la década de los 50, con las aportaciones desde diferentes ángulos de Wiener (Cibernética), Shannon (teoría de la información) y Turing (teoría de la computación).

Desde entonces hasta hoy, contra lo que pueda parecer, diría que no ha habido grandes avances en el panorama general, aunque es evidente que se han desarrollado un montón de algoritmos y herramientas. Sin embargo, la mayoría de los problemas teóricos siguen sobre la mesa. Desde el más básico (¿son inteligentes los algoritmos inteligentes?), hasta los dilemas éticos que genera su aplicación y que estamos discutiendo desde los tiempos de [Weizenbaum](https://en.wikipedia.org/wiki/Joseph_Weizenbaum).

## Usando machine learning para resolver un problema práctico

En cualquier caso, este artículo no es más que un ejercicio práctico que estoy haciendo de una aplicación que utiliza un algoritmo de machine learning para resolver un problema bastante cotidiano: formar grupos de estudiantes que puedan funcionar bien en una clase.

Mi mujer es profesora y de tanto en tanto tiene que formar equipos de tres ó cuatro estudiantes para que trabajen juntos durante un tiempo. Esto es complicado porque no basta con ponerlos al azar. Se busca que la combinación pueda funcionar sin conflictos y que el grupo sea razonablemente productivo. Para hacer esto, básicamente se recurre a la experiencia previa, a lo que sabemos sobre cómo funcionan los estudiantes en la clase, cómo se relacionan entre ellos y cómo han funcionado en equipos anteriores.

La idea de la aplicación es básicamente intentar predecir si un determinado equipo puede, potencialmente, funcionar bien en base a si sus componentes podrían trabajar bien juntos.

Para ello me basé [en este artículo](https://stovepipe.systems/post/machine-learning-naive-bayes) que explica cómo implementar un algoritmo clasificador llamado [Clasificador Bayesiano Ingenuo](https://es.wikipedia.org/wiki/Clasificador_bayesiano_ingenuo).

En resumidas cuentas lo que se hace es entrenar al clasificador con un conjunto de datos relevantes para que pueda calcular la probabilidad de que un determinado suceso se pueda clasificar en una categoría. El entrenamiento consiste en pasar al clasificador un suceso y su categoría. Por ejemplo, si se trata de clasificar frases como positivas o negativas, le pasaríamos un buen número de ejemplos como: "Este artículo es interesante" es "positiva", mientras que "El artículo es basura" sería negativa.

Con esta información, el clasificador ya tiene una base para calcular la probabilidad de que una palabra aparezca en una frase con sentido positivo o negativo. Si le pasamos una nueva frase para clasificar, lo que hará será calcular la probabilidad combinada de que ese conjunto de palabras formen una frase positiva o negativa, calculando el producto de las probabilidad de que cada palabra tenga ese carácter y escogiendo la que tenga mayor probabilidad.

Este tipo de clasificador, por tanto, tiene un funcionamiento puramente estadístico. Simplemente

Volviendo a nuestro caso, la idea es poder clasificar cada grupo en "viable" o "no viable" en base a información previa. Para ello, entrenamos al clasificador dándole parejas de estudiantes indicando si son "viables" o no. Con esta información, el clasificador calcula la probabilidad que tiene cada estudiante de formar parte de un equipo viable. En nuestro caso, elaboramos todas las posibles parejas y las usamos para entrenar el clasificador.

Para valorar cada equipo, le pedimos al clasificador que nos diga si sería viable o no.

Hay muchas objeciones que podríamos hacer a este sistema, pero los clasificadores bayesianos se han usado con éxito para detectar spam o analizar textos, y han funcionado sorprendentemente bien pese a lo simple del algoritmo.

Por otro lado, está el tema del uso de los datos y los posibles sesgos en el entrenamiento. Aunque realmente son los mismos que tenemos cuando intentamos hacer la agrupación a mano y, los que haya, quedarán reflejados en el conjunto de datos de entrenamiento que proporcionemos al sistema.




## Referencias

* [Machine learging, naive bayes](https://stovepipe.systems/post/machine-learning-naive-bayes)
