---
layout: post
title: Pong en Python. Gestionar el backlog
categories: articles
tags: python good-practices
---

## Reflexionando sobre el backlog

Veamos nuestro *backlog*. La primera historia de usuario está refinada en tanto que hemos separado las tareas necesarias para completarla, sin entrar en detalles técnicos:

* US-6B. Permitir configurar el número de sets en la pantalla inicial
  * Mostrar texto indicando el modo de 3 ó 5 sets.
  * Permitir seleccionar el modo de juego pulsando las teclas 3 ó 5.
  * Mostrar la configuración seleccionada.
  * Aplicarla a la partida.
  * Al final de la partida mostrar el detalle de los puntos en cada set.
* US-7 El nivel de dificultad del juego puede ser seleccionado
* US-8 Mostrar la línea divisoria del campo de juego
* US-9 El efecto de rebote de la pelota es más realista
* US-10 Efecto de sonido diferenciado cuando se hace un tanto
* US-11 Se puede jugar en modalidad dobles (se necesita más información)

Durante la sesión de planificación se toman varias decisiones que afectan al backlog.

### Reaccionar a los cambios

Nuestro último despliegue ha funcionado muy bien, salvo un pequeño detalle que ha surgido. Pero a la vez, hemos visto que al introducir los sets se produce una situación incómoda. Se hace necesario que el final de un set se perciba con claridad, por lo que vamos a introducir una historia en la que tratar esto (US-13).

Es importante obtener feedback rápido de nuestras *stake holders* y usuarias. Es fácil que al diseñar una *feature* pasemos por alto algunos detalles que aportan mejoras significativas y que podemos añadir de manera incremental.

Por otro lado, es frecuente que al entregar algunas *features* se reorganicen las prioridades de otras que venían después. Esto es así porque el escenario ha cambiado y tanto usuarias como *stake holders* pueden reajustar sus expectativas y sus opiniones sobre el producto. Lo que antes no era muy importante, podría pasar a ser urgente.

### Suprimir lo que no vamos a hacer

La US-11 se pospone indefinidamente. No hay evidencia de que haya interés entre las usuarias por esta prestación, ni tampoco una estimación de que pueda aportar algún valor interesante al producto. Se retira del backlog.

Decir que no a las malas ideas es fácil. Decir que no a las buenas ideas es bastante más difícil. Pero siempre es importante saber decir a una *feature* cuando no nos la han pedido, cuando no sabemos si aportará valor o cuando no sabemos siquiera lo que implica.

Si en el futuro vuelve a surgir la necesidad no hay más que reincorporarla al backlog.

### Ajustar prioridades

Tras el despliegue la historia US-6B no resulta ser tan importante. Las reacciones de las usuarias a la posibilidad de jugar varios sets han sido muy buenas. Pero en muchos casos encuentran 3 sets más que suficientes para divertirse con el juego, incluso un solo set sería suficiente para disfrutar de un momento de desconexión.

Esto hace que bajemos la prioridad, además de añadir la opción de poder jugar partidos de un sólo set.

Con frecuencia nos encontramos que una *feature* se puede dividir en varias partes. Una de ellas producirá una aportación de valor del 80% (o al 80% de destinatarias) y es la que necesitamos entregar. El resto es aportado mediante mejoras incrementales que, una vez desplegada la parte principal, son vistas desde una nueva perspectiva.

### Atender a los bugs, pero reflexionar sobre ellos

Desde la última entrega hemos introducido un fallo. Para poder probar el juego, hemos fijado el número de puntos por set a 2 y hemos olvidado arreglarlo en producción, lo que no tiene nada que ver con los 21 puntos que se habían decidido en la historia US-6A, por lo tanto, se añade al backlog para resolver ASAP (BUG-3). Se comenta que podría ser más realista usar un limite más pequeño, como 11 puntos, debido a que algunas jugadoras más casuales dejan el juego si se hace muy largo.

Por tanto, se propone resolver el bug con este nuevo límite y se considera la posibilidad de permitir configurar este detalle, por lo que se añadirá una nueva historia (US-12) para permitir este ajuste. Inicialmente se ofrecerá la posibilidad de jugar a 5, 11 y 21 puntos.

### El valor de las historias pequeñas

Las usuarias han llamado la atención sobre el tema de la falta de línea divisoria en el campo, que no añade funcionalidad, pero parece que es un detalle importante en la experiencia del juego, así que se decide priorizar dato que su coste es muy bajo.

Las historias US-9 y US-10 son también relativamente sencillas de conseguir, particularmente US-10.

Tras haber resuelto las demandas más importantes de las usuarias, estas historias pequeñas han adquirido un nuevo valor.

### Historias de investigación

La US-7 es otra historia que no acaba de encontrar su definición. No está claro a qué nos referimos con nivel de dificultad. Ahora mismo, la dificultad del juego recae en la dificultad de controlar la pala de la jugadora humana ya que no se puede detener. Las usuarias consideran que, por un lado, aumenta el interés del juego, pero por otro a veces resulta muy frustrante porque el control puede resultar algo impredecible. Los otros factores de dificultad serían el de la velocidad de la bola y la del contrincante. Parece claro que el problema con esta historia está en la dificultad de entender qué se quiere desarrollar y no tanto el cómo. 

Por ese motivo, la historia se convierte en una tarea de investigación. Con ella queremos aclarar este concepto y cómo materializarlo en el juego. El objetivo es introducir una o más historias de usuario que lo concreten.

¿Cuándo introducir historias de investigación? Siempre que nos encontremos en una situación en la que el valor que puede aportar una historia de usuario no está claro o no se entiende cómo se relaciona con el producto actual. Las historias de investigación están justamente para que el equipo pueda dedicar un tiempo a establecer hipótesis, recabar datos y hacer experimentos para validar las ideas.

El objetivo es decidir si la petición es realizable y, en su caso, definir nuevas historias de usuario para realizar la implementación.

### El nuevo backlog

Así que el backlog va a quedar así:

* BUG-3 Por defecto, el número de puntos por set será 11 por defecto
  * Cambiar el archivo config.py con el valor correcto
* US-8 Mostrar la línea divisoria del campo de juego
  * Dibujar la línea divisoria del campo con el mismo grosor y color que las de los límites.
* US-10 Efecto de sonido diferenciado cuando se hace un tanto
  * Cuando se marca un tanto, generar un sonido distinto al del rebote de la bola 
* US-7 El nivel de dificultad del juego puede ser seleccionado (investigación)
  * Definir el concepto de dificultad del juego y qué parámetros intervienen
  * Definir una o más historias para introducirlo
* US-13 Marcar el final de los sets
* US-6B Permitir configurar el número de sets en la pantalla inicial
  * Mostrar texto indicando el modo de 1, 3 ó 5 sets.
  * Permitir seleccionar el modo de juego.
  * Mostrar la configuración seleccionada.
  * Aplicarla a la partida.
  * Al final de la partida mostrar el detalle de los puntos en cada set.
* US-12 La usuaria puede configurar el número de puntos por set del juego
  * Mostrar texto con las opciones de 5, 11 y 21 puntos
  * Permitir seleccionar la configuración deseada
  * Mostrar la seleccionada en cada momento
  * Aplicarla a la partida
* US-9 El efecto de rebote de la pelota es más realista
* ~~US-11 Se puede jugar en modalidad dobles (se necesita más información)~~

Como se puede ver, el nuevo backlog está encabezado por historias relativamente pequeñas, pero que ahora mismo aportarían mucho valor. Técnicamente no deberían tener complicación, por lo que pueden generar buenas oportunidades para hacer mejoras técnicas.

Nuestro compromiso de sprint sería el siguiente, con la posibilidad de abordar las siguientes historias si nos sobra tiempo.

* BUG-3 Por defecto, el número de puntos por set será 11 por defecto
  * Cambiar el archivo config.py con el valor correcto
* US-8 Mostrar la línea divisoria del campo de juego
  * Dibujar la línea divisoria del campo con el mismo grosor y color que las de los límites.
* US-10 Efecto de sonido diferenciado cuando se hace un tanto
  * Cuando se marca un tanto, generar un sonido distinto al del rebote de la bola 
* US-7 El nivel de dificultad del juego puede ser seleccionado (investigación)
  * Definir el concepto de dificultad del juego y qué parámetros intervienen
  * Definir una o más historias para introducirlo

Así que vamos a ello:

## Desarrollo del sprint

### BUG-3 Por defecto, el número de puntos por set será 11 por defecto

Con frecuencia un bug tras un despliegue tiene fácil solución. En este caso, es cambiar un archivo de configuración (**config.py**) y listo.

```python
# GAME PARAMS

POINTS_TO_WIN = 11
FPS = 180
```

Y ya podemos hacer el [commit](https://github.com/franiglesias/japong/commit/1f47ab3c43c9e5f20bda8fb43c97f2af4a52985c).


### US-8 Mostrar la línea divisoria del campo de juego

Otra historia pequeña, pero agradecida. Basta dibujar una línea más en el juego. Lo interesante de esta historia es que nos podría permitir introducir algunas mejoras técnicas.

```python
# Game draw
self.window.screen.fill(pong.config.green)
self.window.score_board.draw(self)
self.all_sprites.draw(self.window.screen)
```

Pero lo primero, es cumplir con la historia y luego vendrán los arreglos.

El objeto Goal es un sprite que se visualiza como una línea vertical en la pantalla, por lo que vamos a usarlo como punto de partida.

La primera aproximación es:

```python
import pygame

import pong.app
import pong.config


class Net(pygame.sprite.Sprite):

    def __init__(self):
        super().__init__()

        self.image = pygame.Surface((10, 580))
        self.image.fill(pong.config.white)

        self.rect = self.image.get_rect()
        self.rect.y = 10
        self.rect.x = 395

    def update(self):
        self.image.fill(pong.config.white)
```

Y la añadimos a los sprites para que se dibuje cuando sea necesario:

```python
        net = pong.net.Net()
        self.all_sprites.add(net)
        self.all_sprites.add(player_one.goal)
        self.all_sprites.add(player_two.goal)
```

Al ejecutar el juego vemos que visualmente el juego mejora muchísimo. Hay un pequeño defecto porque el marcador tenía unos separadores que ahora son ocultados por la propia línea, pero dependiendo de los puntos pueden verse. Así que los vamos a quitar en `ScoreBoard`.

Por otro lado, se sugiere la posibilidad de usar un color un poco diferente al blanco para mostrar la red. Esto nos lleva a pensar en desarrollar un par de funciones que nos permitan alterar los colores fácilmente a partir de un color base.

Los colores se definen con una tupla de 3 elementos, la idea es poder oscurecerlos o aclararlos indicando un tanto por ciento de cambio. Lo resolvemos con estas funciones:

```python

def inc_byte(byte, pct):
    if byte == 0:
        return (pct * 255) / 100

    byte += byte * pct / 100
    if byte > 255:
        byte = 255
    return byte


def dec_byte(byte, pct):
    byte -= byte * pct / 100

    if byte < 0:
        byte = 0
    return byte


def darken(color, pct):
    return dec_byte(color[0], pct), dec_byte(color[1], pct), dec_byte(color[2], pct)


def lighten(color, pct):
    return inc_byte(color[0], pct), inc_byte(color[1], pct), inc_byte(color[2], pct)

```

Esto nos permite mejorar el efecto visual que se produce cuando se marca un tanto haciéndolo progresivo:

```python
import pygame
from pygame.sprite import Sprite
from pygame import Surface
from pong.config import white
from pong.config import red
from pong.config import lighten
import pong.app
import pong.config

GOAL_HIGHLIGHT_IN_SECONDS = 1.5


class Goal(Sprite):

    def __init__(self, x, player):
        super().__init__()

        self.image = Surface((10, 580))
        self.image.fill(white)

        self.rect = self.image.get_rect()
        self.rect.y = 10
        self.rect.x = x

        self.remaining = 0
        self.color = white
        self.player = player

    def hit(self):
        pong.app.app.sideHit.play()
        self.color = red
        self.image.fill(self.color)

        self.remaining = pong.config.FPS * GOAL_HIGHLIGHT_IN_SECONDS

    def update(self):
        if self.remaining > 0:
            self.remaining -= 1
            self.color = lighten(self.color, 2)
        self.image.fill(self.color)

```

Nos queda un detalle: resulta que la bola para *por debajo* de la red. Tenemos que poner el *sprite* de la red en otro sitio y asegurarnos que se coloca antes que la bola.

```python
        self.all_sprites.add(pong.net.Net())
        self.all_sprites.add(self.ball)
```

Por último, vamos a reorganizar un poco algunos archivos, de modo que los que tienen que ver con el dibujo del campo de juego estén juntos.

Agrupamos todos los cambios [en un commit](https://github.com/franiglesias/japong/commit/2bd10d201355191f0cf800f0bf31ab8bdc4ef781). Como era de esperar, el sprint marcha más suave y nos proporciona tiempo para realizar algunas mejoras técnicas.

### US-10 Efecto de sonido diferenciado cuando se hace un tanto

Idealmente esta historia nos debería permitir mejorar un poco el modo en que generamos un efecto de sonido.

Lo primero que vamos a hacer, es mover los archivos de sonido a una carpeta dentro de `assets`, asegurándonos de que siguen estando accesibles. De paso, cambiamos también alguno de los sonidos por otros más realistas.

```python
pygame.init()
pygame.mixer.init()

playerHit = pygame.mixer.Sound(pong.config.basepath + '/assets/sounds/pad-hit.ogg')
sideHit = pygame.mixer.Sound(pong.config.basepath + '/assets/sounds/table-hit.ogg')
point = pygame.mixer.Sound(pong.config.basepath + '/assets/sounds/point.ogg')
``` 

Este código está ubicado en **app.py**, lo que no parece ser un buen sitio. Al menos no tiene mucho sentido. La invocación tampoco es que sea precisamente elegante:

```python
    @staticmethod
    def _play_pad_hit_sound():
        pong.app.app.playerHit.play()
```

En cualquier caso, aún nos falta además que se ejecute el sonido correcto al conseguir un punto. Vamos a implementar eso primero. Básicamente se trata de un pequeño cambio aquí:

```python
    def hit(self):
        pong.app.app.point.play()
        self.color = red
        self.image.fill(self.color)

        self.remaining = pong.config.FPS * GOAL_HIGHLIGHT_IN_SECONDS
```

La historia está conseguida. Como nos ha llevado poco tiempo, vamos a arreglar un poco esto.

Este tema está un poco mal repartido. En algunos casos es `ball` la que gestiona tanto las colisiones como la emisión de un sonido. En otros casos es el objeto colisionado el que lo hace. Y, por otro lado, la configuración está en **app.py**, pero no es responsabilidad de ningún objeto.

Así que podríamos, por un lado, empezar teniendo un objeto encargado de los efectos de sonido y luego nos ocuparemos de la mejor forma de invocarlo.

```python
import pygame

from pong.config import basepath


class SoundPlayer(object):
    def __init__(self) -> None:
        pygame.init()
        pygame.mixer.init()
        self.base = basepath + '/assets/sounds/'
        self.effects = {
            'pad-hit': 'pad-hit.ogg',
            'table-hit': 'table-hit.ogg',
            'point': 'point.ogg'
        }

    def play(self, effect):
        sound = pygame.mixer.Sound(self.base + self.effects[effect])
        sound.play()
```


El cual podemos invocar así:

```python
    @staticmethod
    def _play_pad_hit_sound():
        player = SoundPlayer()
        player.play('pad-hit')
```


Es un punto de partida. De momento, limpiamos el código innecesario que había en **app.py** y mejoramos la importación.

```python
import pygame

from pong.app.window import Window
from pong.scenes.endscene import EndScene
from pong.scenes.gamescene import GameScene
from pong.scenes.startscene import StartScene


class App(object):
    def __init__(self):
        self.window = Window(800, 600, 'Japong!')
        self.window.add_scene(StartScene(self.window))
        self.window.add_scene(GameScene(self.window))
        self.window.add_scene(EndScene(self.window))

    def run(self):
        pygame.init()
        code = self.window.run()

        pygame.quit()
        return code

```

Por el momento, voy a mover los sonidos a los objetos con los que la bola puede chocar. Esto podría tener más sentido porque así cada objeto es dueño de su propia reacción. `Ball` sólo les dice que ha chocado con ellos.

En **ball.py**

```python
        border_collisions = spritecollide(self, self.borders, False)
        border: Border
        for border in border_collisions:
            self.rect.y -= self.dy
            self._start_transformation_count_down()
            self.ry = 1.3
            self.bounce_with_border()
            border.hit()
```

Mientras que `Border`:

```python
import pygame

from pong.config import white
from pong.utils.soundplayer import SoundPlayer


class Border(pygame.sprite.Sprite):
    def __init__(self, y):
        super().__init__()

        self.image = pygame.Surface((800, 10))
        self.image.fill(white)

        self.rect = self.image.get_rect()
        self.rect.y = y
        self.rect.x = 0

    @staticmethod
    def hit():
        player = SoundPlayer()
        player.play('table-hit')
```

Una vez resuelto esto, aprovechamos el commit para reorganizar mejor los archivos y arreglar algunos detalles aquí y allá. Por un lado, hemos empaquetado algunos archivos en mejores lugares, dejando la raíz del paquete más despejada. En el lado negativo, sin embargo, vemos que el archivo `config.py` se está convirtiendo en un cajón de sastre.

Por el momento, vamos a hacer el [commit para entregar la historia](https://github.com/franiglesias/japong/commit/32bcad622933a819d7a9298d0ffc9df61d7526e8).

### US-7 El nivel de dificultad del juego puede ser seleccionado

Una historia de investigación es una historia que no va a generar valor por sí misma, sino que nos ayuda a ponernos en condiciones para conseguirlo.

En ocasiones una *feature* puede ser muy compleja. O puede que no veamos una forma clara de desarrollarla en código. O incluso puede que tengamos muchas maneras de llevarla a cabo. Es decir: tenemos una gran incertidumbre para abordar la *feature* aunque esta pueda estar razonablemente clara para negocio.

Plantear historias de investigación tiene varios beneficios. Por un lado, es una manera de dar valor al propio proceso de investigación y a abrazar la duda y la incertidumbre como parte del proceso de desarrollo.

Es cierto que, en muchos casos, esta investigación forma parte del trabajo normal de las historias de usuario. Por eso no deberían plantearse con mucho frecuencia, reservando este formato para cuestiones que generen un alto nivel de incertidumbre o que requieran un extra de información que nos puedan proporcionar desde negocio, clientes, o *stake holders*.

Finalmente, el objetivo debería ser definir las tareas técnicas o incluso nuevas historias de usuario que concreten cómo se va a materializar la *feature*.

En nuestro ejemplo, hemos decidido que no tenemos claro qué variables controlan el nivel de dificultad del juego, por lo que vamos a investigar
