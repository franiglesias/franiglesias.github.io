---
layout: post
title: Pong en Python. Separando el legacy en Scenes
categories: articles
tags: python good-practices
---

En este artículo vamos a empezar a transformar en profundidad la parte legacy.

## Scene

Un juego puede tener varias Scenes que ocurrirán secuencialmente en una ventana. Cada Scene gestiona una parte del juego, que puede ser más o menos pasiva, como una pantalla de bienvenida, o activa, como una fase de un juego. En juegos grandes puede existir una relativamente compleja red de escenas. En nuestro caso, es una secuencia lineal.

Si observamos el código de `ponggame()` podemos ver que hay dos bucles que esperan eventos y que nos definen las dos escenas que tenemos en este momento (juego y final). Nosotros añadiremos una pantalla de bienvenida, para que el juego no comience de forma inmediata.

Se puede decir que cada escena tiene al menos un loop de eventos, que gestiona las pulsaciones de teclas, uso de mandos, etc., así como las actualizaciones de los objetos, sus interacciones y la visualización. Nuestro objetivo en esta fase

Nuestro objetivo en esta fase será crear la clase base `Scene` y las tres subclases que vamos a necesitar, de forma que obtengamos una nueva versión del juego funcionando en este paradigma que, además, nos permitirá introducir ya unas pequeñas mejoras.

Así que, vamos con la definición inicial de `Scene`. Será un enfoque similar al seguido hasta ahora, comenzando por un test sencillo que me sirva para mover el código desde `ponggame()` a la Scene correspondiente y montar todas las piezas para el juego siga funcionando. La clave es que una vez que la estructura de Scenes esté montada y funcionando, será el momento de enfrentarnos al refactor del juego en sí. Empezamos con un test simple que nos fuerce a crear la clase:

```python
import unittest.mock


class SceneTestCase(unittest.TestCase):
    def test_should_initialize(self):
        Scene()


if __name__ == '__main__':
    unittest.main()
```

La creamos en el propio test y refactorizamos para llevarla a su propio archivo **pong.app.scene.py**:

```python
class Scene(object):
    pass
```

Por el momento, la idea es hacer que Scene sea poco más que un contenedor para cada parte del juego, así que tendrá un método `run` que será sobreescrito por las subclases y devolverá un código de terminación. Sin embargo tendrá que recibir el objeto en el que se va a dibujar el juego, que es instanciado por la ventana.

Un tema que habrá que tratar será la conexión entre las distintas Scenes para establecer la secuencia de pantallas. Lo ideal sería enlazarlas de algún modo en un patrón pipeline o similar. Sin embargo, dejaré eso para más adelante y simplemente las ejecutaremos en secuencia dentro de la ventana.

También haremos que `Scene` reciba a su ventana contenedora, de forma que pueda comunicarse con ella. Esto es un patrón habitual en las GUI orientadas a objetos.

```python
import unittest.mock

import pong.app.window
from pong.app.scene import Scene


class SceneTestCase(unittest.TestCase):
    def test_should_initialize(self):
        window = pong.app.window.Window(800,600,'Test')
        Scene(window)


if __name__ == '__main__':
    unittest.main()
```

Test que hacemos pasar con:

```python
from pong.app.window import Window


class Scene(object):
    def __init__(self, window: Window):
        self.window = window
```


Añadamos ahora el método `run`:

```python
import unittest.mock

import pong.app.window
from pong.app.scene import Scene


class SceneTestCase(unittest.TestCase):
    def test_should_run_fine(self):
        window = pong.app.window.Window(800, 600, 'Test')
        scene = Scene(window)
        self.assertEquals(0, scene.run())


if __name__ == '__main__':
    unittest.main()
```

Y con esto volvemos a verde:

```python
from pong.app.window import Window


class Scene(object):
    def __init__(self, window: Window):
        self.window = window

    def run(self):
        return 0
```

## Organizando el código en Scenes

Con la estructura `App -> Window -> Scene` hemos generado, por así decir, el esqueleto que va a sostener nuestro juego. Llega el momento de partir `ponggame()` y reubicarlo.

Podríamos hacer varios tipos de aproximaciones, aunque en último término acabaremos dividiendo la función en dos `Scenes` como hemos dicho anteriormente. Así que vamos a ello.

Extenderemos la clase `Scene`, mi plan inicial es llegar a lo siguiente:

```
Scene
   +-- GameScene
   +-- EndScene
```

### GameScene

Así que empezaremos por un test:

```python
import unittest

import pong.app.scene
import pong.app.window
import pong.scenes.gamescene


class GameSceneTestCase(unittest.TestCase):
    def test_should_instantiate(self):
        window = pong.app.window.Window(800, 600, 'Test')
        scene = pong.scenes.gamescene.GameScene(window)


if __name__ == '__main__':
    unittest.main()


```

Test que nos permite escribir este código para empezar:

```python
from pong.app.window import Window
from pong.app.scene import Scene


class GameScene(Scene):
    def __init__(self, window: Window):
        super().__init__(window)
```

El próximo test debería permitirnos introducir aquí el bucle principal del juego. Ya sabemos que para salir de este bucle necesitaremos simular la acción de cerrar la ventana:

```
import unittest.mock

import pong.scenes.gamescene
from pong.app.window import Window
from pong.tests import events


class GameSceneTestCase(unittest.TestCase):
    @unittest.mock.patch('pygame.event.get', return_value=[events.quit_event])
    def test_should_run_fine(self, mock):
        window = pong.app.window.Window(800, 600, 'Test')
        scene = pong.scenes.gamescene.GameScene(window)

        self.assertEqual(0, scene.run())


if __name__ == '__main__':
    unittest.main()
```


Este test pasa, aunque era previsible ya que `GameScene` extiende de `Scene` y si método `run` ya hacía pasar el test. Pero ahora no estamos haciendo TDD, sino que estamos usando el test como red de seguridad para los cambios que vamos a introducir. Exactamente vamos a mover parte del código de `ponggame()` a la clase bajo test:

```python
from pong.app.scene import Scene
from pong.app.window import Window


class GameScene(Scene):
    def __init__(self, window: Window):
        super().__init__(window)

    def run(self):
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
```

Este código tal cual está no va a funcionar. Necesitamos arreglar algunas cosas:

* Importar `pygame`, algo bien sencillo de arreglar.
* Ocuparnos de `surface`, que hasta hace un momento lo pasábamos como parámetro. Esto ya tiene más trabajo.

`Screen` se define en `Window`, así que vamos a tener que hacer unos cambios un poco más sustanciosos para que `window` pueda contener `screen` y así las diferentes `Scenes` puedan usarla con facilidad.

Fíjate que, de momento, no estoy borrando el códigp en `ponggame`, porque quiero mantener el juego corriendo en todo momento:

```python
import pygame

import pong.ponggame


class Window(object):
    def __init__(self, width: int, height: int, title: str):
        self.width = width
        self.height = height
        self.title = title
        size = (self.width, self.height)
        self.screen = pygame.display.set_mode(size)
        pygame.display.set_caption(self.title)

    def run(self):
        pong.ponggame.ponggame(self.screen)
        return 0

```

De este modo, el test de `Window` sigue pasando:

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

Y ahora, `GameScene` ya debería poder usar la pantalla sin problemas. Sin embargo al ejecutar su test nos dice que no devuelve nada, por lo que nos quedaría añadir una línea al final del método que devuelva 0.

```python
import pygame

from pong.app.scene import Scene
from pong.app.window import Window


class GameScene(Scene):
    def __init__(self, window: Window):
        super().__init__(window)

    def run(self):
        import pong.ball
        import pong.border
        import pong.config
        import pong.goal
        import pong.pad
        import pong.player
        import pong.scoreboard

        screen = self.window.screen
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

        return 0
```

Todo ha ido bien y al lanzar el test vemos que se muestra la pantalla de juego y salimos con normalidad. [Es el momento de hacer otro commit](https://github.com/franiglesias/japong/commit/96e93bc9c0abf9ebb176db6b2a09ba7dcaef12ae).

### EndScene

Para añadir `EndScene` voy a seguir la misma metodología hasta llegar al momento de mover el código y ver qué problemas nos puede generar. Así que voy a saltar directamente a ese punto. Primero el test:

```python
import unittest.mock

import pong.scenes.endscene
from pong.app.window import Window
from pong.tests import events

class EndSceneTestCase(unittest.TestCase):
    @unittest.mock.patch('pygame.event.get', return_value=[events.any_key_event])
    def test_should_run_fine(self, mock):
        window = pong.app.window.Window(800, 600, 'Test')
        scene = pong.scenes.endscene.EndScene(window)

        self.assertEqual(0, scene.run())


if __name__ == '__main__':
    unittest.main()

```

Y luego el código de la función trasladado sin más:

```python
import pygame

from pong.app.scene import Scene
from pong.app.window import Window


class EndScene(Scene):
    def __init__(self, window: Window):
        super().__init__(window)

    def run(self):
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

        return 0
```

Tendremos que atacar varios problemas, para ello ejecutamos el test.

El primero es `pygame.error: font not initialized`. Este se produce porque en el ámbito del test no se ha inicializado `pygame` o `pygame.font`.

De momento, lo haremos aquí mismo:

```python
import pygame

from pong.app.scene import Scene
from pong.app.window import Window


class EndScene(Scene):
    def __init__(self, window: Window):
        super().__init__(window)

    def run(self):
        pygame.font.init()
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

        return 0
```

Lo siguiente es un error de importación: `NameError: name 'pong' is not defined`, el cual tiene una solución fácil:

```python
import pygame

import pong.config
from pong.app.scene import Scene
from pong.app.window import Window


class EndScene(Scene):
    def __init__(self, window: Window):
        super().__init__(window)

    def run(self):
        pygame.font.init()
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

        return 0
```

El siguiente problema es un poco más complicado: `NameError: name 'score_board' is not defined`. El problema es que `score_board` se define en `GameScene`, así que tenemos que llevarla a otro lugar. En este momento, lo más fácil es ubicarla en `Window`. Puede que no sea el mejor sitio, pero es una solución que nos servirá para salir del paso y ayudarnos a entender el problema de cómo organizar los distintos elementos del juego. Fíjate que ahora vamos a tener que modificar `GameScene` para poder arreglar el problema de `EndScene`. Así que vayamos con cuidado. Por suerte, tenemos el test de `GameScene` y de `Window`, con lo que sabremos si nuestros cambios son seguros o no.

`score_board` se inicia en este fragmento de `GameScene`:

```python
        player1 = pong.player.Player('left')
        player2 = pong.player.Player('computer')
        score_board = pong.scoreboard.ScoreBoard(player1, player2)
        goal_left = pong.goal.Goal(0, player2)
        goal_right = pong.goal.Goal(790, player1)
```

Llevarnos la inicialización de `score_board` a `Window` en este momento supone abrir muchos melones. Lo cierto es que `GameScene` está haciendo demasiadas cosas, como por ejemplo inicializar todos los objetos del juego.

En este punto nosotros queremos entregar cuanto antes. Si ahora intentamos arreglar el código seguramente las ramificaciones nos llevarán a un punto en que tendremos que solucionar muchos problemas antes de tener un código entregable. Por tanto, vamos a buscar una solución más rápida que siempre será mejor que lo que tenemos ahora, sin dejar de entregar valor manteniendo el juego funcionando.

En este sentido, una primera aproximación sería llevar `score_board` a `Window`, aunque se inicialice, de momento, en `GameScene`.

Añadimos la propiedad a `Window`, asegurándonos de que no se rompe su test:

```python
import pygame

import pong.ponggame


class Window(object):
    def __init__(self, width: int, height: int, title: str):
        self.width = width
        self.height = height
        self.title = title
        size = (self.width, self.height)
        self.screen = pygame.display.set_mode(size)
        pygame.display.set_caption(self.title)

        self.score_board = None

    def run(self):
        pong.ponggame.ponggame(self.screen)
        return 0
```

Y ahora la usamos en `GameScence`, y comprobamos también que el test pasa:

```python
import pygame

from pong.app.scene import Scene
from pong.app.window import Window


class GameScene(Scene):
    def __init__(self, window: Window):
        super().__init__(window)

    def run(self):
        import pong.ball
        import pong.border
        import pong.config
        import pong.goal
        import pong.pad
        import pong.player
        import pong.scoreboard

        screen = self.window.screen
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
        self.window.score_board = pong.scoreboard.ScoreBoard(player1, player2)
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
            self.window.score_board.draw(screen)
            all_sprites.draw(screen)

            # Screen update
            pygame.display.flip()

            if self.window.score_board.stop():
                done = True

            clock.tick(pong.config.FPS)

        return 0
```

Por último, modificamos `EndScene`:

```python
import pygame

import pong.config
from pong.app.scene import Scene
from pong.app.window import Window


class EndScene(Scene):
    def __init__(self, window: Window):
        super().__init__(window)

    def run(self):
        pygame.font.init()
        scoreFont = pygame.font.Font(pygame.font.get_default_font(), 64)
        text = scoreFont.render('Game finished', True, pong.config.yellow, pong.config.green)
        self.window.score_board.winner(screen)
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

        return 0
```

Vamos bien, el error ha cambiado, pero tenemos un nuevo problema: `AttributeError: 'NoneType' object has no attribute 'winner'`. Es bastante obvio, necesitamos usar un doble puesto que en el entorno del test, Window nunca tendrá nada en score_board.

```python
import unittest.mock

import pong.scenes.endscene
from pong.app.window import Window
from pong.tests import events

class EndSceneTestCase(unittest.TestCase):
    @unittest.mock.patch("pong.scoreboard.ScoreBoard")
    @unittest.mock.patch('pygame.event.get', return_value=[events.any_key_event])
    def test_should_run_fine(self, score_board_mock, mock):
        window = pong.app.window.Window(800, 600, 'Test')
        window.score_board = score_board_mock
        scene = pong.scenes.endscene.EndScene(window)

        self.assertEqual(0, scene.run())


if __name__ == '__main__':
    unittest.main()
```

Con este cambio, seguimos avanzando por el camino adecuado. El error ha vuelto a cambiar, ahora es más familiar: `NameError: name 'screen' is not defined`. Para este ya sabemos la solución, que es utilizar `self.window.screen` en lugar de `screen`.

```python
import pygame

import pong.config
from pong.app.scene import Scene
from pong.app.window import Window


class EndScene(Scene):
    def __init__(self, window: Window):
        super().__init__(window)

    def run(self):
        pygame.font.init()
        scoreFont = pygame.font.Font(pygame.font.get_default_font(), 64)
        text = scoreFont.render('Game finished', True, pong.config.yellow, pong.config.green)
        self.window.score_board.winner(self.window.screen)
        text_rect = text.get_rect()
        text_rect.center = (800 // 2, 600 // 2)
        self.window.screen.blit(text, text_rect)
        pygame.display.flip()
        done = False
        while not done:
            for event in pygame.event.get():
                if event.type == pygame.KEYDOWN:
                    done = True

        pygame.quit()

        return 0
```

De hecho, con este último cambio, el test de `EndScene` ya pasa. Verificamos que todos los test pasan y [hacemos un nuevo commit](https://github.com/franiglesias/japong/commit/3a0cb031a30fdf67c1d116da0a0bc1b15bab4494).

## Unamos todas las piezas

De momento vamos bastante bien pero, aunque tenemos las Scenes, no las hemos incorporado realmente al código del juego. Esto es lo que haremos ahora para terminar este parte del trabajo. En principio había pensado en que sea `Window` la que contenga la colección de `Scenes`, por lo que añadiremos una propiedad y un método que permita coleccionarlas. Al tener una `Scene` genérica es relativamente fácil hacer un test para tener la funcionalidad básica:

```python
import unittest.mock

from pong.app.window import Window
from pong.app.scene import Scene
from pong.tests import events


class WindowTestCase(unittest.TestCase):
    @unittest.mock.patch('pygame.event.get', return_value=[events.quit_event, events.any_key_event])
    def test_should_run_fine(self, mock):
        window = Window(800, 600, 'title')
        self.assertEqual(0, window.run())

    def test_should_add_scenes(self):
        window = Window(800, 600, 'Test')
        window.add_scene(Scene(window))
        self.assertEqual(1, window.scenes)


if __name__ == '__main__':
    unittest.main()
```

La implementación no debería ser complicada:

```python
import pygame

import pong.ponggame


class Window(object):
    def __init__(self, width: int, height: int, title: str):
        self.width = width
        self.height = height
        self.title = title
        size = (self.width, self.height)
        self.screen = pygame.display.set_mode(size)
        pygame.display.set_caption(self.title)

        self.score_board = None

        self.scenes = []

    def run(self):
        pong.ponggame.ponggame(self.screen)
        return 0

    def add_scene(self, scene):
        self.scenes.append(scene)
```

El siguiente paso consiste en que Win``dow ejecute sus scenes. Haremos un pequeño *spy* que nos asegure que llamamos al método `run` en las `Scenes` que añadamos.

```python
import unittest.mock

from pong.app.window import Window
from pong.app.scene import Scene
from pong.tests import events


class WindowTestCase(unittest.TestCase):
    @unittest.mock.patch('pygame.event.get', return_value=[events.quit_event, events.any_key_event])
    def test_should_run_fine(self, mock):
        window = Window(800, 600, 'title')
        self.assertEqual(0, window.run())

    def test_should_add_scenes(self):
        window = Window(800, 600, 'Test')
        window.add_scene(Scene(window))
        self.assertEqual(1, len(window.scenes))

    def test_should_run_scenes(self):
        window = Window(800, 600, 'Test')
        scene = Scene(window)
        with unittest.mock.patch.object(scene, 'run', wraps=scene.run) as spy:
            window.add_scene(scene)
            window.run()
            spy.assert_called()


if __name__ == '__main__':
    unittest.main()
```

En principio, lo haremos así:

```python
import pygame

import pong.ponggame


class Window(object):
    def __init__(self, width: int, height: int, title: str):
        self.width = width
        self.height = height
        self.title = title
        size = (self.width, self.height)
        self.screen = pygame.display.set_mode(size)
        pygame.display.set_caption(self.title)

        self.score_board = None

        self.scenes = []

    def run(self):
        for scene in self.scenes:
            scene.run()
        return 0

    def add_scene(self, scene):
        self.scenes.append(scene)
```

¿Qué pasa si unas de las `Scenes` termina con un error? Lo suyo sería abortar la ejecución y salir con el error. Podríamos probarlo con un test que espera que la `Scene` que le pasamos lance un error:

```python
import unittest.mock

from pong.app.window import Window
from pong.app.scene import Scene
from pong.tests import events


class WindowTestCase(unittest.TestCase):
    @unittest.mock.patch('pygame.event.get', return_value=[events.quit_event, events.any_key_event])
    def test_should_run_fine(self, mock):
        window = Window(800, 600, 'title')
        self.assertEqual(0, window.run())

    def test_should_add_scenes(self):
        window = Window(800, 600, 'Test')
        window.add_scene(Scene(window))
        self.assertEqual(1, len(window.scenes))

    def test_should_run_scenes(self):
        window = Window(800, 600, 'Test')
        scene = Scene(window)
        with unittest.mock.patch.object(scene, 'run', wraps=scene.run) as spy:
            window.add_scene(scene)
            window.run()
            spy.assert_called()

    def test_should_exit_with_error(self):
        window = Window(800, 600, 'Test')
        scene = Scene(window)
        with unittest.mock.patch.object(scene, 'run', wraps=scene.run, return_value=-1) as spy:
            window.add_scene(scene)
            self.assertEqual(-1, window.run())


if __name__ == '__main__':
    unittest.main()
```

El test falla exactamente como queríamos, así que implementamos una posible solución:

```python
import unittest.mock

from pong.app.window import Window
from pong.app.scene import Scene
from pong.tests import events


class WindowTestCase(unittest.TestCase):
    @unittest.mock.patch('pygame.event.get', return_value=[events.quit_event, events.any_key_event])
    def test_should_run_fine(self, mock):
        window = Window(800, 600, 'title')
        self.assertEqual(0, window.run())

    def test_should_add_scenes(self):
        window = Window(800, 600, 'Test')
        window.add_scene(Scene(window))
        self.assertEqual(1, len(window.scenes))

    def test_should_run_scenes(self):
        window = Window(800, 600, 'Test')
        scene = Scene(window)
        with unittest.mock.patch.object(scene, 'run', wraps=scene.run) as spy:
            window.add_scene(scene)
            window.run()
            spy.assert_called()

    def test_should_exit_with_error(self):
        window = Window(800, 600, 'Test')
        error_scene = Scene(window)
        with unittest.mock.patch.object(error_scene, 'run', wraps=error_scene.run, return_value=-1) as spy:
            window.add_scene(error_scene)
            self.assertEqual(-1, window.run())


if __name__ == '__main__':
    unittest.main()
```

En principio, podríamos hacer algunos tests más para verificar que todo va bien con varias `Scenes`, pero a estas alturas un vistazo al código es suficiente para poder pensar que debería funcionar sin problemas.

Donde sí tenemos problemas ahora es en el test de `App` y al intentar ejecutar el juego dado que ya no llamamos a `ponggame()` en ningún momento. El test de `App` pasa y al ejecutar el programa se abre una ventana pero no hace nada. Tenemos que crear nuestras escenas. Vamos a `App`:

```python
import pygame

import pong.app.window
import pong.config
import pong.ponggame
import pong.scenes.gamescene
import pong.scenes.endscene

pygame.init()
pygame.mixer.init()

playerHit = pygame.mixer.Sound(pong.config.basepath + '/sounds/player.wav')
sideHit = pygame.mixer.Sound(pong.config.basepath + '/sounds/side.wav')
point = pygame.mixer.Sound(pong.config.basepath + '/sounds/ohno.wav')


class App(object):
    def __init__(self):
        self.window = pong.app.window.Window(800, 600, 'Japong!')
        self.window.add_scene(pong.scenes.gamescene.GameScene(self.window))
        self.window.add_scene(pong.scenes.endscene.EndScene(self.window))

    def run(self):
        return self.window.run()
```

Y con esto ya tenemos el juego otra vez funcionando, todos los tests pasan. Podemos deshacernos de **ponggame.py** y con todo lo que hemos logrado [entregamos un nuevo commit](https://github.com/franiglesias/japong/commit/f1463af936d34ccd7bc7ad4bb159c0949644857d).

Con esto ya estamos en situación de hacer mejoras en la calidad del código e incluso hacer mejoras en la funcionalidad. Lo importante de estas tres últimos artículos es que hemos movido un código escrito como prototipo a un código con mejor arquitectura sin haber dejado de hacer entregas y sin romper la funcionalidad existente. Todavía es muy mejorable, pero ya estamos mucho mejor preparadas para avanzar.
