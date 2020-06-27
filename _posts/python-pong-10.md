---
layout: post
title: Pong en Python. Ramas y bugs
categories: articles
tags: python good-practices
---

Las cosas no siempre salen como se planean, ¿cómo reaccionar en un entorno ágile?

## Bugs

Después de entregar nuestra última *feature* hemos descubierto que se ha generado un bug. Por algún motivo el evento QUIT que usamos para abortar el juego haciendo clic en el botón de cerrar la ventana o pulsando la combinación de teclas equivalente y salir antes de que termine acaba provocando la salida prematura del programa. Es decir, se detiene en la pantalla de despedida durante el tiempo de *delay*, que es de un segundo, y sale inmediatamente sin permitir que la jugadora pueda decidir si quiere salir o volver a jugar.

Por otro lado, además, ha habido algunas quejas sobre esta última pantalla. Al mostrarse todavía la imagen del campo, resulta bastante confusa y poco clara. Esto se ha descubierto precisamente porque ahora hay una pantalla en la que detenerse y decidir.

Así que tenemos dos bugs:

* Al salir del juego cerrando la ventana, se acaba saliendo de la aplicación.
* La pantalla de salida es confusa y deberíamos quitarle contenido.

La cuestión es: ¿estos bugs deben entrar en el sprint o no?

Cuando aparecen bugs es necesario hacer una evaluación de su gravedad y su urgencia. Algunos deberán entrar inmediatamente al *sprint*, incluso con la máxima prioridad. Otros quedarán como historias del backlog, aunque se pongan en lugares altos.

En nuestro ejemplo, el sprint había quedado así tras la última entrega:

* US-3 La pala de la jugadora humana se mueve más rápido
* US-4 Al jugar contra el ordenador se puede escoger el lado de la mesa

Así que ahora tenemos dos bugs:

* BUG-1 Al salir del juego cerrando la ventana, se acaba saliendo de la aplicación.
* BUG-2 La pantalla de salida es confusa y deberíamos quitarle contenido.

La valoración es. El BUG-1 nos resulta más urgente y lo introducimos en el `sprint`, pero no pensamos que sea necesario alterar las prioridades. Por su parte, añadimos el BUG-2 al Backlog priorizado, para tratarlo cuanto antes tras terminar el `sprint` actual. Como resultado, este es nuestro sprint:

* US-3 La pala de la jugadora humana se mueve más rápido
* US-4 Al jugar contra el ordenador se puede escoger el lado de la mesa
* BUG-1 Al salir del juego cerrando la ventana, se acaba saliendo de la aplicación.

Y así queda el backlog ahora:

* BUG-2 La pantalla de salida es confusa y deberíamos quitarle contenido.
* US-5 Opcionalmente, Pueden jugar dos personas, controlando cada raqueta
* US-6 La partida se puede configurar para 3 ó 5 sets a 21 puntos con dos puntos de diferencia para el ganador
* US-7 El nivel de dificultad del juego puede ser seleccionado
* US-8 Mostrar la línea divisoria del campo de juego
* US-9 El efecto de rebote de la pelota es más realista
* US-10 Efecto de sonido diferenciado cuando se hace un tanto
* US-11 Se puede jugar en modalidad dobles (se necesita más información)

(He aprovechado para numerar la historias y que sea más fácil identificarlas, esto es algo que las herramientas tipo JIRA y similares automatizan por nosotros.)

## Flujo de trabajo y ramas

El otro tema que trataremos en este artículo es el flujo de trabajo y despliegue. Hasta ahora hemos estado haciendo *commits* atómicos y *push* a la rama principal. Esto no es una mala práctica dado que nos permite reducir al máximo el tiempo para llegar a producción. Sin embargo, hay muchas situaciones y proyectos en los que esto no se puede hacer sin más. Para ello se definen [flujos de trabajo](https://www.atlassian.com/es/git/tutorials/comparing-workflows). No hay un flujo de trabajo ideal y cada equipo debe buscar el suyo.

Algunos principios que se pueden aplicar:

* Una única rama base, que es la que se despliega a producción.
* Resolver los conflictos de mezcla en local.
* Integrar los cambios en un sólo *commit* atómico, aunque hayamos usado varios para el desarrollo.

En general, el [Trunk based development](https://trunkbaseddevelopment.com) encaja mucho mejor con la metodología ágil, evita problemas a la hora de las mezclas y permite tener un estado limpio de la línea troncal del software. Para ello tienen que integrarse con un sistema de chequeo pre-integración que verifique que el software cumple con los requisitos establecidos, como pasar los tests, chequeos de estilo, calidad, etc.

Los commits directos a la línea principal o troncal funcionan bien para desarrolladoras únicas o equipos muy pequeños, pero en equipos más grandes, o cuando varios equipos trabajan en el mismo proyecto, es preferible usar una estrategia de ramas de vida corta. 

Una rama de vida corta no es más que una rama que se extrae del tronco para desarrollar una feature concreta o una parte de ella. Podría ser una historia de usuario, si no es muy grande, o una subtarea dentro de la historia. La vida corta se refiere a que esa rama debería integrarse al tronco en un par de días como mucho. En `git` disponemos de la herramienta `rebase`, que nos permite traernos el estado actual de la rama principal, resolver los posible conflictos y añadir nuestros *commits* al final. Esto nos facilitará alargar la vida de la rama si es necesario al permitirnos resolver los conflictos.

Con `git` el proceso es más o menos el siguiente. Nos situamos inicialmente en master local:

```
# Actualizamos la rama principal

git pull --all

# Creamos una rama nueva en ese punto de la historia

git checkout -b US-3_human_pad_moves_faster

# Trabajamos en la rama y vamos haciendo commits

git add .
git commit -m "Added things..."

# Si hay cambios en la rama principal, los podemos traer, resolviendo los conflictos que pueda haber

git pull --rebase origin master

# Trabajamos en la rama y vamos haciendo nuevos commits

git add .
git commit -m "Added things..."

# Para finalizar volvemos a hacer rebase

git pull --rebase origin master

# Opcionalmente, reorganizamos los commits de la rama (N es el número de commits que vamos a manipular)

git rebase --interactive HEAD~N

# Una forma alternativa es indicar a partir de qué commit lo haremos (commit-sha es el primer commit del grupo que queremos reorganizar)

git rebase --interactive commit-sha

# Publicamos los cambios de la rama

git push -u origin US-3_human_pad_moves_faster
```

Si trabajas con GitHub tienes la opción de crear aquí el *pull request*. Por otro lado, [en este enlace tienes más información sobre la reagrupación de commits](https://www.internalpointers.com/post/squash-commits-into-one-git).

