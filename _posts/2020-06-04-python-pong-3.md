---
layout: post
title: Pong en Python. Reubicar el legacy y automatizar los tests
categories: articles
tags: python good-practices
---

En esta etapa, introducimos conceptos nuevos que nos forzarán a ir desmontando el legacy.

Al final, considerar el código de prototipo de como legacy está resultando un ejercicio interesante porque, sin pretenderlo realmente, he conseguido montar un proyecto que representa, a pequeña escala, el tipo de problemas que implica modernizar un código legacy mientras lo mantenemos en producción.

En la siguiente etapa del proceso quiero introducir los conceptos de *Window* y *Scene*, Los videojuegos de este tipo solían estructurarse en *pantallas*, con una de bienvenida, una de ajustes, uno o más niveles o fases de juego, etc. He dudado si llamarlas *Screen* o *Scene*, dado que *Screen* parece referirse más a la visualización entendida como ventana, para lo que puede funcionar también el término *Window*, mientras que *Scene* apunta más bien a la organización lógica o narrativa del juego.

Creo que para resaltar más la diferencia usaré *Window* para la ventana en la que se muestra el juego y *Scene* para sus distintas pantallas.

La cuestión interesante es que introducir estos conceptos significa empezar a sacar código de la función `ponggame()` que, recordemos, encapsula todo el legacy. En ella, viven, por así decir, dos de las Scenes que tiene el juego: la pantalla de juego y una pantalla de despedida. No existe todavía una pantalla de bienvenida. Además, por supuesto, se define la ventana de juego.

Nuestro objetivo es tener una estructura que más o menos sería así:

```
App
  +-- Window
         +-- WelcomeScene
         +-- GameScene
         |      +-- ...Game objects
         +-- GoodbyScene
```

Vamos primero a definir y extraer la ventana.

## Window

La función de la ventana será fundamentalmente definir la ventana *física* en la que se mostrará el juego y en la que se mostrarán las diferentes Scenes, que serán coordinadas por la ventana que las contiene.

Así que entre sus propiedades básicas estarán su anchura y altura, así como la colección de Scenes.

```python
import unittest

from pong.app.window import Window


class WindowTestCase(unittest.TestCase):
    def test_can_create(self):
        Window(800, 600)


if __name__ == '__main__':
    unittest.main()

```

Para generar este primer código:

```python
class Window(object):
    def __init__(self, width: int, height: int):
        self.width = width
        self.height = height

```

También nos interesa que Window tenga un título:

```python
import unittest

from pong.app.window import Window


class WindowTestCase(unittest.TestCase):
    def test_can_create(self):
        Window(800, 600, 'title')


if __name__ == '__main__':
    unittest.main()
```

Así que lo añadiremos:

```python
class Window(object):
    def __init__(self, width: int, height: int, title: str):
        self.width = width
        self.height = height
        self.title = title

```

Por otro lado, la ventana debería poder ejecutar el juego, así que vamos a introducir un método `run()`. De momento, tiene nos basta con que devuelva el código de error 0 para indicar que todo ha ido bien:

```python
import unittest

from pong.app.window import Window


class WindowTestCase(unittest.TestCase):
    def test_can_create(self):
        Window(800, 600, 'title')

    def test_should_run_fine(self):
        window = Window(800, 600, 'title')
        self.assertEqual(0, window.run())


if __name__ == '__main__':
    unittest.main()
```


```python
class Window(object):
    def __init__(self, width: int, height: int, title: str):
        self.width = width
        self.height = height
        self.title = title

    def run(self):
        return 0
```


Podemos eliminar el primer test porque es redundante:

```python
import unittest

from pong.app.window import Window


class WindowTestCase(unittest.TestCase):
    def test_should_run_fine(self):
        window = Window(800, 600, 'title')
        self.assertEqual(0, window.run())


if __name__ == '__main__':
    unittest.main()
```


Lo siguiente será ejecutar `ponggame()` invocando `Window.run()`. Nos pasará como con App, y el juego debería lanzarse y funcionar con normalidad en el nuevo entorno:

```python
import pong.ponggame


class Window(object):
    def __init__(self, width: int, height: int, title: str):
        self.width = width
        self.height = height
        self.title = title

    def run(self):
        pong.ponggame.ponggame()
        return 0

```

Si ejecutamos el test, comprobamos que todo funciona. Ahora vamos a empezar a hacer que Window integre `ponggame()`. Lo que nos interesa de forma inmediata es que Window controle la ventana del juego, que reside en la variable `screen` en `ponggame()`.

La variable `screen` guarda un objeto `Surface`, construido por la línea:

```python
screen = pygame.display.set_mode(size)
```

En este punto no tengo claro si sería responsabilidad de `Window` o de `ponggame()`, y en el futuro de cada `Scene`, generar y mantener este objeto `Surface`. De entrada, creo que tiraré por la primera opción y luego, ya veremos:

```
import pygame

import pong.ponggame


class Window(object):
    def __init__(self, width: int, height: int, title: str):
        self.width = width
        self.height = height
        self.title = title

    def run(self):
        size = (self.width, self.height)
        screen = pygame.display.set_mode(size)
        pygame.display.set_caption(self.title)

        pong.ponggame.ponggame(screen)
        return 0
```

Ahora eliminamos esa inicialización de `ponggame()` y le pasamos screen como parámtero.

```python
import pygame
import pygame.surface


def ponggame(screen: pygame.surface.Surface):
    import pong.ball
    import pong.border
    import pong.config
    import pong.goal
    import pong.pad
    import pong.player
    import pong.scoreboard

    # game loop control
    done = False
    # screen updates
    clock = pygame.time.Clock()
    ball = pong.ball.Ball(pong.config.yellow, 10)
    pad_left = pong.pad.Pad('left')
    pad_right = pong.pad.Pad('right')
    pads = pygame.sprite.Group()
    pads.add(pad_left)
    pads.add(pad_right)
    border_top = pong.border.Border(0)
    border_bottom = pong.border.Border(590)
    player1 = pong.player.Player('left')
    player2 = pong.player.Player('computer')
    score_board = pong.scoreboard.ScoreBoard(player1, player2)
    goal_left = pong.goal.Goal(0, player2)
    goal_right = pong.goal.Goal(790, player1)
    # Prepare sprites
    all_sprites = pygame.sprite.Group()
    all_sprites.add(ball)
    all_sprites.add(border_top)
    all_sprites.add(border_bottom)
    all_sprites.add(goal_left)
    all_sprites.add(goal_right)
    all_sprites.add(pad_left)
    all_sprites.add(pad_right)
    borders = pygame.sprite.Group()
    borders.add(border_top)
    borders.add(border_bottom)
    ball.borders = borders
    pad_left.borders = borders
    pad_right.borders = borders
    ball.pads = pads
    goals = pygame.sprite.Group()
    goals.add(goal_left)
    goals.add(goal_right)
    # Game loop
    while not done:
        # Event
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                done = True

        # Game logic
        pygame.event.pump()
        key = pygame.key.get_pressed()
        if key[pygame.K_w]:
            pad_left.up()
        elif key[pygame.K_s]:
            pad_left.down()
        else:
            pad_left.stop()

        pad_right.follow(ball)

        all_sprites.update()

        # Manage collisions
        goal_collisions = pygame.sprite.spritecollide(ball, goals, False)
        for goal in goal_collisions:
            goal.hit()
            goal.player.point()
            ball.restart()

        # Game draw
        screen.fill(pong.config.green)
        score_board.draw(screen)
        all_sprites.draw(screen)

        # Screen update
        pygame.display.flip()

        if score_board.stop():
            done = True

        clock.tick(pong.config.FPS)

    scoreFont = pygame.font.Font(pygame.font.get_default_font(), 64)
    text = scoreFont.render('Game finished', True, pong.config.yellow, pong.config.green)
    score_board.winner(screen)
    text_rect = text.get_rect()
    text_rect.center = (800 // 2, 600 // 2)
    screen.blit(text, text_rect)
    pygame.display.flip()
    done = False
    while not done:
        for event in pygame.event.get():
            if event.type == pygame.KEYDOWN:
                done = True
    pygame.quit()
```

A continuación, integraremos Window en App, de forma que podamos iniciar el juego desde main, como teníamos hasta ahora:

```python
import pygame

import pong.app.window
import pong.config
import pong.ponggame

pygame.init()
pygame.mixer.init()

playerHit = pygame.mixer.Sound(pong.config.basepath + '/sounds/player.wav')
sideHit = pygame.mixer.Sound(pong.config.basepath + '/sounds/side.wav')
point = pygame.mixer.Sound(pong.config.basepath + '/sounds/ohno.wav')


class App():
    def __init__(self):
        self.window = pong.app.window.Window(800, 600, 'Japong!')

    def run(self):
        return self.window.run()
```

Por cierto, que en el test de App, también podríamos eliminar el primero por redundante:

```python
import unittest

from pong.app.app import App


class AppTestCase(unittest.TestCase):
    def test_app_ran_fine(self):
        app = App()
        self.assertEqual(0, app.run())


if __name__ == '__main__':
    unittest.main()
```

En cualquier caso, ahora si ejecutamos cualquiera de los dos tests (App y Window) o lanzamos el juego desde main, vemos que funciona todo correctamente.

Es el momento de avanzar un poco más. Pero antes hacemos un [commit con estos cambios](https://github.com/franiglesias/japong/commit/aebe471ddd930342274e3f5c2933d246309ad969).

## Automatizando nuestro test

Hablemos un momento de estos tests. Aunque es casi un test manual (no obtenemos un output que podamos verificar programáticamente y se ejecuta el código) nos sirve como una especie de tests de caracterización, a pesar de que tengamos que intervenir em algún momento simplemente para poder salir del juego. Cuando introdujimos `App` y empezamos a mover el código, resultó necesario hacer este para asegurarnos de que las piezas que movíamos siguiesen funcionado. Ahora ya sabemos en `ponggame()` puede ejecutarse sin problemas independientemente del punto de llamada. Así que la pregunta sería: ¿podemos automatizar ya los tests para que se ejecuten sin necesidad de intervenir?

El caso es que sí. Básicamente lo que necesitamos es una mínima interacción y la podemos simular con ayuda de un doble.

El juego comienza y una vez entramos en el bucle de eventos, esperamos por uno de tipo QUIT para salir del juego. Este evento representa que hemos hecho clic en el botón de cerrar la ventana o que hemos pulsado la combinación de teclas equivalente.

Una vez hemos salido del bucle y mostrado el resultado final, entramos en otro bucle en el que se espera que pulsemos cualquier tecla para salir del programa.

Lo idea sería poder simular estos eventos, para lo cual hacemos un doble de `pygame.event.get()`, de forma que podemos programar qué eventos queremos que se produzcan en nuestra ejecución simulada. Aquí el test de window.

```python
import unittest
import unittest.mock

import pygame
import pygame.event

from pong.app.window import Window


class WindowTestCase(unittest.TestCase):
    quit_event = pygame.event.Event(pygame.QUIT)
    any_key_event = pygame.event.Event(pygame.KEYDOWN, unicode="a", key=pygame.K_a, mod=pygame.KMOD_NONE)

    @unittest.mock.patch('pygame.event.get', return_value=[quit_event, any_key_event])
    def test_should_run_fine(self, mock):
        window = Window(800, 600, 'title')
        self.assertEqual(0, window.run())


if __name__ == '__main__':
    unittest.main()

```

La chicha está en estas líneas en las que definimos los dos eventos que nos interesan. El `any_key_event` lo podríamos haber definido con cualquier otra tecla, por supuesto, pero como no vamos a verificar qué tecla concreta ha sido pulsada la "a" nos vale tan bien como cualquier otra. [Puedes encontrar información sobre los eventos posibles en la documentación de pygame](https://www.pygame.org/docs/ref/event.html).

```python
    quit_event = pygame.event.Event(pygame.QUIT)
    any_key_event = pygame.event.Event(pygame.KEYDOWN, unicode="a", key=pygame.K_a, mod=pygame.KMOD_NONE)
```

En esta otra línea hacemos el doble:

```python
    @unittest.mock.patch('pygame.event.get', return_value=[quit_event, any_key_event])
```

En este caso, forzamos que `pygame.event.get()` devuelva la lista con los eventos que nos interesan en el orden en que los queremos, ya que `get` tiene que devolver un iterable. En todo lo demás, `pygame` seguirá funcionando igualmente.

El último detalle interesante es que al decorar el test debemos definir un parámetro aunque no lo vayamos a usar en este caso.

```python
    @unittest.mock.patch('pygame.event.get', return_value=[quit_event, any_key_event])
    def test_should_run_fine(self, mock):
```

Ahora, si ejecutamos el test de Window, veremos que el juego se abre y se cierra solo. Nuestro test está automatizado. podemos hacer lo mismo en el test de App y usaremos la misma estrategia de aquí en adelante.

```python
import unittest.mock

import pygame

from pong.app.app import App


class AppTestCase(unittest.TestCase):
    quit_event = pygame.event.Event(pygame.QUIT)
    any_key_event = pygame.event.Event(pygame.KEYDOWN, unicode="a", key=pygame.K_a, mod=pygame.KMOD_NONE)

    @unittest.mock.patch('pygame.event.get', return_value=[quit_event, any_key_event])
    def test_app_ran_fine(self, mock):
        app = App()
        self.assertEqual(0, app.run())


if __name__ == '__main__':
    unittest.main()
```

Finalmente, para evitar la duplicación en la creación de los eventos, creamos el módulo `pong.tests.events` en donde definiremos todos los eventos que queramos simular. En el futuro, los tenemos ahí para utilizarlos en otros tests y, además, podremos añadir otros como las teclas de control del juego y demás que nos serán útiles cuando lleguemos a esa parte.

```python
import pygame

quit_event = pygame.event.Event(pygame.QUIT)
any_key_event = pygame.event.Event(pygame.KEYDOWN, unicode="a", key=pygame.K_a, mod=pygame.KMOD_NONE)
```

Los tests ahora quedan un poco más limpios:

```
import unittest.mock

from pong.app.app import App
from pong.tests import events


class AppTestCase(unittest.TestCase):
    @unittest.mock.patch('pygame.event.get', return_value=[events.quit_event, events.any_key_event])
    def test_app_ran_fine(self, mock):
        app = App()
        self.assertEqual(0, app.run())


if __name__ == '__main__':
    unittest.main()
```

```python
import unittest.mock

from pong.app.window import Window
from pong.tests import events


class WindowTestCase(unittest.TestCase):
    @unittest.mock.patch('pygame.event.get', return_value=[events.quit_event, events.any_key_event])
    def test_should_run_fine(self, mock):
        window = Window(800, 600, 'title')
        self.assertEqual(0, window.run())


if __name__ == '__main__':
    unittest.main()
```

Para terminar esta parte, [conservamos los cambios y hacemos commit](https://github.com/franiglesias/japong/commit/b80ef567d40095159e51e9657749a3693ec6e408).
