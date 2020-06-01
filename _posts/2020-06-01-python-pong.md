---
layout: post
title: Pong en Python. Los prototipos como punto de partida de un proyecto de software
categories: articles
tags: python good-practices
---

Una mezcla de cosas me ha traído aquí. Este fin de semana he empezado un proyecto para recrear el juego Pong! en Python.

He visto en twitter que [Ron Jeffries está recreando el viejo arcade Astoroids](https://ronjeffries.com/articles/020-asteroids/asteroids-1/) y esa quizá haya sido el último toque que necesitaba para hacer mi propio experimento.

Empecé a programar sobre los 16 años en un ZX-Spectrum. Para quienes no hayáis vivido esa época, os contaré que los ordenadores asequibles (Spectrum, ZX-81, Commodore 64, VIC-20 y luego los MSX... Hubo muchos más, pero éstos eran los más populares) venían con un intérprete de Basic. Cada uno su propio dialecto por cierto. En fin, mi Spectrum tenía 16 KB de RAM (luego lo amplié a 48KB), un teclado de teclas de goma y un editor de líneas de texto limitadísimo a base de tokens. Pero en 1983 para mí el paraíso.

Yo no solía comprar juegos, lo que me gustaba era programar. Así que programé unos cuantos juegos entonces, entre otras cosas. Algunos los copiaba de revistas, otros los inventaba. En algún caso, hacía mi propia versión de los que me habían gustado. 

Una de las cosas buenas, pese al montón de limitaciones, era que realmente no necesitabas más de lo que la máquina te ofrecía. En algunos sentidos, programar como hobby es más difícil hoy, aunque ya volveré a eso. 

En cualquier caso, hace tiempo que tengo cierta nostalgia de aquella época. Supongo que, en parte, es propio de la edad y el deseo de recuperar las sensaciones de asombro y descubrimiento de entonces.

Por otro lado, aunque tengo un par de proyectos abiertos, como [el libro de TDD](https://github.com/franiglesias/tddbook) y seguir con [temas de DDD en el blog](https://franiglesias.github.io/tag/ddd/), me he decidido a procrastinar y he empezado con este proyecto más lúdido.

Con todo, después de haber elaborado un prototipo y tener ahora la cabeza llena de ideas de cómo hacerlo mejor, me ha parecido interesante recoger el proceso como reflexión sobre el desarrollo de proyectos de software a partir de prototipos.

## Pong

Bueno, Pong no es un RPG multijugador precisamente. Es un juego muy sencillo y encontrarás miles de versiones por ahí. Es uno de los primeros Arcade conocido mundialmente (Atari, 1972), [si es que no es el primero](https://es.wikipedia.org/wiki/Pong). En cualquier caso, es Historia de la informática, sin ninguna duda.

La idea es muy sencillita: es una especie de simulación muy sintética de un juego de tenis de mesa.

En este ejemplo lo voy a programar inicialmente para jugar contra el ordenador.

## Python

He escogido Python para desarrollarlo porque creo que es el entorno que mejor me proporciona las condiciones que buscaba. El lenguaje es muy accesible, y tengo ya cierta soltura con él, y los recursos que puedo necesitar para desarrollar el proyecto son también muy accesibles. Fundamentalmente necesitaré la librería pygame que proporciona lo básico que necesito para tener el entorno gráfico donde montar el juego.

Hasta cierto punto, diría que Python es lo más parecido hoy en día a aquellos ordenadores de los que disponíamos a finales de los 80. Con todo, las cosas son ahora algo más complicadas. Habitualmente, necesitas algún tipo de librería o framework para hacer una aplicación medianamente potente. En ese sentido, Python tiene la combinación adecuada de sofisticación técnica y sencillez de puesta en marcha que busco.

Aún así, me he encontrado algunos pequeños escollos a la hora de preparar todo lo necesario, en parte por haber estado jugando con instalaciones diversas del lenguaje en el ordenador. Mi máquina personal es un iMac con Mac OS Catalina, así que la forma más fácil de tener el entorno listo ha sido descargar el instalador nativo de Python y usar la versión 2 de Pygame.

## Prototipo

Como no tenía ni idea de cómo desarrollar un juego a estas alturas, he empezado con un prototipo a fin de hacerme a la idea de por dónde podrían ir los tiros. Al ser un campo desconocido para mi no sé dónde introducir metodologías como TDD y otras a las que estoy habituado. El prototipo, aparte de ser funcional, me ha permitido aprender a manejar lo básico de la librería pygame y a entender los conceptos que debería manejar el juego.

### El problema de Pong!

Los juegos no dejan de ser problemas de programación interesantes. En concreto, Pong! supone:

* Representar un campo de juego bidimensional
* Mover una pelota en ese campo
* La pelota debe rebotar al tocar los límites laterales del campo
* Cuando la pelota sale por el fondo del campo es un punto para el jugador del lado contrario
* Cuando la pelota choca contra las raquetas debe rebotar
* Los jugadores se representan mediante una raqueta que se puede controlar con el teclado
* Hay que detectar cuando uno de los jugadores gana
* Si hacemos que una raqueta la controle el ordenador debemos dotarlo de un cierto nivel de "inteligencia"
* ... Pero no demasiado, porque podría ser invencible
* Mostrar el marcador a medida que se logran puntos

En el prototipo decidí ir afrontando estos problemas uno por uno. Finalmente estuve trabajando en ratos sueltos durante dos días. Al final del primero tenía una versión funcional del juego. El segundo día lo que dediqué a reescribir el prototipo usando sprites, lo que me hubiera ahorrado todo el código para detectar las interacciones de la pelota con las palas y con los bordes de la pista.

### Para qué sirve un prototipo

En este caso, el prototipo ha servido para entender las necesidades básicas de este juego, los conceptos que hay que manejar y sus responsabilidades. También nos ha permitido identificar los *nice to have*, prestaciones que puede ser interesante tener, pero que no son requeridas en una primera iteración.

Para el juego, son necesarios y están presentes en el prototipo los siguientes conceptos:

* Un campo de juego, delimitado por bordes laterales y las metas, que son los bordes del fondo del campo de juego
* Las raquetas o palas que representan a los jugadores, una de las cuales puede moverse automáticamente
* Los jugadores, que llevan un registro de su puntuación
* La bola, la cual puede rebotar contra los bordes laterales y las palas, y otorga un punto al jugador que consigue hacerla pasar por la meta contraria
* Un marcador que muestra los puntos en tiempo real
* Las raquetas se controlan con el teclado

Tras realizar el prototipo, hemos visto que debería existir un concepto de *escena* o *pantalla*, al menos estas tres:

* Una bienvenida, en la que tal vez se podrían ajustar algunas preferencias (*nice to have*)
* El partido en sí
* Un final del juego, en la que mostrar el resultado y permitir volver al inicio o dejar el juego

La reglas serían:

El partido se inicia con el marcador en cero para cada jugador y termina cuando uno de ellos alcanza un determinado número de puntos. Se podría contemplar la obligación de ganar por al menos dos puntos.

Otros *nice to have*:

* Efectos de sonido
* Efectos visuales cuando la pelota rebota o entra por la meta  
* Poder hacer partidas de varios sets, como en el tenis de mesa.
* En cuanto a la mecánica del juego, el original permitía que la pelota fuese devuelta en distinto ángulo según el punto de contacto con la pala, lo que da más variedad y dificultad al juego.
* Diferentes niveles de habilidad cuando un jugador es controlado por el ordenador.

### Los prototipos son *sucios*, pero pueden ser tu MVP

Los prototipos no aspiran a hacer el mejor código posible, sino a proporcionarnos un boceto en el que plasmar nuestro modelo mental del problema y verificar nuestras primeras hipótesis.

[Aquí puedes ver el commit de la versión actual del prototipo](https://github.com/franiglesias/japong/commit/3de8e918055ce9871f939c1adffcd72f0105a7cb). En ella puede ver que no se han introducido ni los conceptos de *Scene* ni *Game*, por ejemplo. El archivo `main.py` contiene mucho código que no está bien organizado y que podría formar parte de los conceptos mencionados.

En parte estos prototipos son como *legacy code* creado a propósito. Nos sirven para resolver el problema de negocio porque funcionan, pero la calidad del código es pobre como para escalar o ser mantenibles en el tiempo.

Las opciones en este momento son dos:

* Usar el prototipo como Minimum Viable Product y refactorizarlo hacia una solución mejor. Esto podemos hacerlo si no es muy grande y si realmente proporciona la funcionalidad suficiente para esta primera iteración.
* Comenzar un proyecto nuevo utilizando las lecciones aprendidas e incluso parte del código si es lo bastante bueno.

Obviamente, si has puesto cierto cuidado en la creación del prototipo, es posible que puedas seguir por la primera opción, utilizándolo como MVP y refactorizando hacia una mejor calidad de código.

En otros casos, puede incluso que hayas escrito el prototipo en un lenguaje o framework que no será el del producto final. Esto no es mala estrategia. Escribir el prototipo en un lenguaje en el que tienes especial soltura, por sus características o el conocimiento que tengas de él, puede hacer que consigas muy rápidamente una versión funcional con la que probar las hipótesis, aunque luego tengas que empezar de cero el desarrollo para producción.

## Desarrollo del producto final

Mi plan a partir de ahora es intentar desarrollar una versión más completa del juego, y documentar cada paso que vaya dando.

Inicialmente, creo que lo haré a partir del prototipo existente. Ahora mismo creo que tal como está organizado el código, no debería tener problemas en hacer convivir elementos del producto final con el prototipo y diría que hay algunos objetos reaprovechables.

Así que, si te apetece, nos vemos por aquí en los próximos artículos.

## Referencias sobre la programación de juegos en Python

Estos artículos me han servido para empezar a montar el juego, algunos incluyen vídeo. No he puesto algunos que he consultado en busca de

* [Pygame](https://www.pygame.org/news)
* [Plantilla para juegos](http://programarcadegames.com/python_examples/f.php?lang=es&file=pygame_base_template.py)
* [Tutorial de programación de juegos con pygame](https://riptutorial.com/pygame/example/14697/a-simple--game-)
* [Introducción a los sprites](http://programarcadegames.com/index.php?lang=es&chapter=introduction_to_sprites)

