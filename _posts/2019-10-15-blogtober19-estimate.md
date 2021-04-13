---
layout: post
title: Estimation (Blogtober2019)
categories: articles
tags: blogtober19
---

Mi compañera y manager en Holaluz [Mavi Jiménez](https://twitter.com/Linkita) va a hacer un dibujo cada día del mes sobre una palabra propuesta en twitter. Y aquí vamos a intentar escribir [un post por cada una de ellas](https://franiglesias.github.io/blogtober19-status/).

<blockquote class="twitter-tweet" data-conversation="none" data-theme="dark"><p lang="fr" dir="ltr">15. Estimation <a href="https://twitter.com/talkingbit1?ref_src=twsrc%5Etfw">@talkingbit1</a> <a href="https://twitter.com/hashtag/Inktober?src=hash&amp;ref_src=twsrc%5Etfw">#Inktober</a> <a href="https://twitter.com/hashtag/linkitober?src=hash&amp;ref_src=twsrc%5Etfw">#linkitober</a> <a href="https://t.co/9YFDF4iihz">pic.twitter.com/9YFDF4iihz</a></p>&mdash; Maybe (@Linkita) <a href="https://twitter.com/Linkita/status/1184207617570299905?ref_src=twsrc%5Etfw">October 15, 2019</a></blockquote> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>

## Estimation

Estimar es una de las cosas que más me cuesta a la hora de planificar o refinar historias de usuario. Tengo entendido que no soy la única persona en el sector a la que le pasa esto, porque hay bastantes [artículos](https://medium.com/serious-scrum/estimation-103de626551e), [charlas](https://youtu.be/jIoM7eTI4Io) e incluso [libros](https://www.amazon.es/dp/0131479415/ref=cm_sw_em_r_mt_dp_U_uOFPDbSAG963E) sobre el tema.

En fin. Hacer una estimación sobre cuál es el esfuerzo que nos costará llevar a cabo una tarea implica tener en cuenta unos cuantos factores.

Para empezar, depende de lo bien definida que esté la tarea. Si lo está es más fácil hacer una estimación porque tienes la mayor parte de la información necesaria para tener una idea de lo que requerirá.

Otro elemento importante es cuán a fondo conoces el código existente que está implicado. Eso ayuda a reducir la incertidumbre si tienes claro dónde habrá que tocar o qué puedes aprovechar para introducir una nueva funcionalidad.

Estos dos factores nos indicarán cuánto tiempo de la tarea será dedicado a modelar, a hacer experimentos o a recolectar más información.

Luego hay aspectos del sprint, como si estará todo el equipo o no, si la tarea requerirá distintos perfiles, si se puede dividir en tareas que pueden avanzar en paralelo, etc.

Nosotros solemos estimar por puntos, que es una unidad de medida aproximada. Además, la escala es logarítmica. Esto es: 4 puntos no es el doble de 2 puntos sino mucho más. No es que tengamos una guía de cómo estimar, pero según mi experiencia en estos últimos meses, la cosa va más o menos así:

**1 punto** es una historia que podríamos tener lista y desplegada en dos ó tres horas. No tiene incertidumbre en el sentido de que se sabe exactamente qué hay que hacer. A veces, lleva más tiempo hacer el *pull request*, la *review* y el despliegue que escribir el código necesario.

**2 puntos**, es una historia que podría estar lista y desplegada en un día de trabajo. No tendría incertidumbre, pero ya implica que hay que tocar en varios sitios, tal vez introducir alguna nueva clase o servicio, etc. 

**3 puntos**, sería una historia que podría requerir fácilmente un par de días. Quizá incluso algo más. Supone tocar bastante código. Posiblemente requiera alguna sesión de pizarra para definir conceptos o, al menos, una pequeña reunión para coordinarnos.

**4 puntos**. Una historia de 4 puntos indica que, o bien requerirá mucho trabajo, o bien tiene un nivel de incertidumbre bastante alto y necesitaremos dedicar un buen rato a modelar y tomar decisiones, además del tiempo de trabajo en el código. Es posible que en este tipo de historias tengamos un cuidado extra al testear o al hacer pruebas.

**5 puntos**. No solemos hacer historias de cinco puntos. Cuando ocurre esto, consideramos que la historia no está bien definida y que seguramente habrá que partirla en otras más manejables. Quizá si observamos que no tiene incertidumbre, aunque sí mucho trabajo, la aceptaríamos como historia de 5 puntos.

¿Funcionan estas estimaciones? A veces sí, a veces no, pero tanto en sentido positivo como negativo. Muchas veces nos encontramos que todas las piezas necesarias de una historia de 3 ó 4 puntos están ahí y solo tenemos que usarlas y la ventilamos en nada. Otras veces, una historia pequeñita abre un "melón" interesante en el que encontramos demasiadas cosas que no nos gustan. Por otro lado, está el tema de las revisiones de código y los despliegues, en los que pueden aparecer cuestiones imprevistas y retrasarnos más de lo esperado.

¿Cuántos puntos nos comprometemos a realizar por sprint? Es variable. En los últimos tiempos solemos fijar uno o dos *sprint goals* que orienten nuestra selección de historias, de modo que mantengamos el foco en uno o dos temas como mucho. Eso contribuye a que logremos porcentajes de logro bastante altos y que tengamos márgenes para arreglar bugs y atender algunos problemas que surgen en el día a día.

Nuestra retrospectiva suele consistir en analizar no tanto el resultado del sprint, sino el cómo lo hemos vivido. Extraemos cosas que podemos mejorar o que podemos potenciar porque han ido bien. En realidad, a medio sprint, solemos hacer una valoración de cómo estamos y qué probabilidades vemos de lograr el compromiso.

Pero, esto es nuestra receta y, como digo, no es algo que tengamos pensado. Ahora mismo, estamos funcionando así y nos va bien. El secreto está en dos puntos fuertes, que todas las personas del equipo, tanto *developers* como *product owner*, estamos muy alineados y que el nivel de compromiso y profesionalidad es muy alto.

Estoy muy feliz de trabajar en este equipo. Es todo un privilegio.




