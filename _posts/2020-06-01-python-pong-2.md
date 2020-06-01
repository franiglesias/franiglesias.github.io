---
layout: post
title: Pong en Python. Convivencia entre legacy y código nuevo
categories: articles
tags: python good-practices
---

En este primer paso quiero mover el código chusco del prototipo a un objeto App, que será el nuevo punto de entrada de la aplicación. De este modo, el código del prototipo es tratado como *legacy*, pero puede convivir con la aplicación *moderna* y no perdemos la funcionalidad mientras mejoramos el código.

La primera idea que quiero introducir es la de App como punto de entrada al juego. App se encargará de coordinar la ejecución de todo el programa y el juego, encapsulando todos los elementos que pueda necesitar. De este modo, no tendremos variables globales ya que, en el peor de los casos, serán propiedades de la aplicación.

Para empezar haré un test sencillo que verifique que si todo va bien, la aplicación devuelve un código de salida 0.

El archivo es **pong/tests/app-test.py**

```python
import unittest

from pong.app.app import App


class AppTestCase(unittest.TestCase):
    def test_app(self):
        App()

    def test_app_ran_fine(self):
        app = App()
        self.assertEqual(0, app.run())


if __name__ == '__main__':
    unittest.main()
```

La clase reside en **pong/app/app.py**, y como se puede ver, no hace nada interesante:

```python
class App():
    def run(self):
        return 0
```

En este momento, se me ocurre una idea para probar este enfoque *grosso modo* y es ejecutar el actual archivo main desde dentro del `App.run()`. De este modo, podría cambiar el `main.py` de forma que ya use App como punto de entrada a la aplicación y así poder hacer evolucionar el código desde el prototipo al producto final.

Para ello, encapsularé el código de `main.py` en una función, que llamaré `ponggame()`, que pueda llamar fácilmente desde `App.run()`.

Primero crearé la función con todo el código actual de main y me aseguraré de que siguen funcionando el juego sin novedad. Simplemente selecciono todo el código y con el IDE (PyCharm) extraigo una función. Al ejecutarlo, me salen algunos problemas con variables que deberían ser globales, así que las saco de la función para poder usarlas como hasta ahora en otros módulos. Como consecuencia también tengo que sacar un par de imports fuera de ahí e inicializar `pygame` y `pygame.mixer`.

Este es el nuevo **main.py**

```python
import os

import pygame

# Init game engine
pygame.init()
pygame.mixer.init()
playerHit = pygame.mixer.Sound(os.getcwd() + '/sounds/player.wav')
sideHit = pygame.mixer.Sound(os.getcwd() + '/sounds/side.wav')
point = pygame.mixer.Sound(os.getcwd() + '/sounds/ohno.wav')

scoreFont = pygame.font.Font(pygame.font.get_default_font(), 64)

FPS = 180


def ponggame():
    import pong.ball
    import pong.border
    import pong.config
    import pong.goal
    import pong.pad
    import pong.player
    import pong.scoreboard

    # Prepare the screen
    size = (800, 600)
    screen = pygame.display.set_mode(size)
    pygame.display.set_caption("Ja pong!")
    # Prepare sound effects

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

        clock.tick(FPS)
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
    quit()


if __name__ == '__main__':
    ponggame()
```

Como se puede apreciar, el código de `ponggame` es todavía confuso y hace muchas cosas. Nuestro siguiente paso es llevarnos pongame a otro módulo de forma que lo podamos usar fácilemente.

El archivo ponggame.py queda así:

```python
import pygame

from pong.main import FPS, scoreFont


def ponggame():
    import pong.ball
    import pong.border
    import pong.config
    import pong.goal
    import pong.pad
    import pong.player
    import pong.scoreboard

    # Prepare the screen
    size = (800, 600)
    screen = pygame.display.set_mode(size)
    pygame.display.set_caption("Ja pong!")
    # Prepare sound effects

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

        clock.tick(FPS)
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
    quit()
```

Y este es el nuevo **main.py**:

```python
import os

import pygame

import pong.ponggame

# Init game engine

pygame.init()
pygame.mixer.init()
playerHit = pygame.mixer.Sound(os.getcwd() + '/sounds/player.wav')
sideHit = pygame.mixer.Sound(os.getcwd() + '/sounds/side.wav')
point = pygame.mixer.Sound(os.getcwd() + '/sounds/ohno.wav')

scoreFont = pygame.font.Font(pygame.font.get_default_font(), 64)

FPS = 180

if __name__ == '__main__':
    pong.ponggame.ponggame()
```

Ahora verifico que todo sigue funcionando y es ahora cuando introduzco, al fin, la clase App. Primero hago que la clase llame a la función `ponggame()`:

```python
import pong


class App():
    def run(self):
        pong.ponggame.ponggame()

        return 0
```

Y luego uso `App` en `main`:

```python
import os
import sys

import pygame

import pong.app.app
import pong.ponggame

# Init game engine

pygame.init()
pygame.mixer.init()
playerHit = pygame.mixer.Sound(os.getcwd() + '/sounds/player.wav')
sideHit = pygame.mixer.Sound(os.getcwd() + '/sounds/side.wav')
point = pygame.mixer.Sound(os.getcwd() + '/sounds/ohno.wav')

scoreFont = pygame.font.Font(pygame.font.get_default_font(), 64)

FPS = 180

if __name__ == '__main__':
    app = pong.app.app.App()
    code = app.run()
    sys.exit(code)
```

Con esto conseguimos que el juego siga funcionando. No así los tests, así que vamos a ver cómo lo podemos arreglar.

Tenemos varios tipos de problemas, pero los principales se pueden ver en el listado anterior. Ahí podemos ver una serie de variables que son globales, pero que al definirse en `main.py` no estarán disponibles cuando ejecutemos el test. Por otro lado, para instanciar los sonidos dependemos de un path que cambiará en función de si ejecutamos el programa desde main o si lo ejecutamos en test.

Una primera aproximación es mover algunos de esos valores al archivo `config.py`, que siempre estará en la raíz del proyecto. Usando el refactor Move de PyCharm se actualiza correctamente en todas partes:

```python
import os

black = (0, 0, 0)
white = (255, 255, 255)
green = (36, 102, 38)
red = (255, 0, 0)
yellow = (247, 214, 25)

FPS = 180
```

Para este fragmento, lo que vamos a hacer es extraer una variable que represente el path actual y obtenerlo igualmente en el archivo `config.py`:

```python
playerHit = pygame.mixer.Sound(pong.config.basepath + '/sounds/player.wav')
sideHit = pygame.mixer.Sound(pong.config.basepath + '/sounds/side.wav')
point = pygame.mixer.Sound(pong.config.basepath + '/sounds/ohno.wav')
```

```python
import os

black = (0, 0, 0)
white = (255, 255, 255)
green = (36, 102, 38)
red = (255, 0, 0)
yellow = (247, 214, 25)

basepath = os.path.dirname(os.path.realpath(__file__))
FPS = 180
```

Nos queda `scoreFont`, que define una tipografía para mostrar diversos elementos de texto y que usamos en varios archivos. En principio, movemos su inicialización allí donde tengamos que usarla (`ponggame.py` y `scoreboard.py`) y luego nos ocuparemos de refinar esto para que sea todo más manejable. 

Con estos cambios, `app.py`, quedaría así:

```python
import pygame

import pong.config
import pong.ponggame

pygame.init()
pygame.mixer.init()

playerHit = pygame.mixer.Sound(pong.config.basepath + '/sounds/player.wav')
sideHit = pygame.mixer.Sound(pong.config.basepath + '/sounds/side.wav')
point = pygame.mixer.Sound(pong.config.basepath + '/sounds/ohno.wav')


class App():
    def run(self):
        pong.ponggame.ponggame()

        return 0
```

Vamos a repasar algunos archivos que nos dan problemas todavía. `ponggame.py` tiene un `quit()` en la última línea que ya no necesitaremos. Por lo demás sigue siendo un gran spaghetti, pero con lo que estamos haciendo lo tenemos bajo control. Fíjate que es uno de los lugares donde antes usábmos `scoreFont`:

```python
import pygame


def ponggame():
    import pong.ball
    import pong.border
    import pong.config
    import pong.goal
    import pong.pad
    import pong.player
    import pong.scoreboard

    # Prepare the screen
    size = (800, 600)
    screen = pygame.display.set_mode(size)
    pygame.display.set_caption("Ja pong!")
    # Prepare sound effects

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

El otro archivo que nos conviene mirar ahora es `scoreboard.py`, que tiene algunos problemas. Por una parte, usábamos scoreFont, así que hemos añadido su inicialización. De momento está así y no tiene muy buena pinta por la duplicación:

```python
import pygame

import pong.config


class ScoreBoard:
    def __init__(self, player1, player2):
        self.player1 = player1
        self.player2 = player2
        self.target = 5

    def draw(self, in_screen):
        board = " {0} : {1} ".format(self.player1.score, self.player2.score)
        scoreFont = pygame.font.Font(pygame.font.get_default_font(), 64)
        score_text = scoreFont.render(board, True, pong.config.black, pong.config.white)
        score_text_rect = score_text.get_rect()
        score_text_rect.center = (800 // 2, 40)
        in_screen.blit(score_text, score_text_rect)

    def stop(self):
        return self.player1.score == self.target or self.player2.score == self.target

    def winner(self, in_screen):
        if self.player1.score > self.player2.score:
            winner = self.player1
        else:
            winner = self.player2
        scoreFont = pygame.font.Font(pygame.font.get_default_font(), 64)
        board = " {0} WON! ({1}-{2}) ".format(winner.name, self.player1.score, self.player2.score)
        score_text = scoreFont.render(board, True, pong.config.black, pong.config.white)
        score_text_rect = score_text.get_rect()
        score_text_rect.center = (800 // 2, 40)
        in_screen.blit(score_text, score_text_rect)

```

Sin embargo, antes de nada nos vamos a asegurar de que el juego se ejecuta tanto desde **main**, como desde **test**. Un vez comprobado esto y arreglando los flecos que hayan podido quedar estaremos en disposición de seguir trabajando.

Un hecho curioso, pero no inesperado, es que el juego se ejecuta realmente al lanzar los tests de App. No es la situación ideal, pero en este momento es útil porque nos ha permitido resolver algunos problemas con variables globales y el tema del path para cargar los archivos de efectos de sonido. Así que, de momento, lo vamos a mantener así hasta que podamos implementar una estrategia de test mejor, por ejemplo con dobles.

Así que ahora vamos a volver a `scoreboard.py` y resolver sus problemas más evidentes.

Lo más interesante en primera instancia es la duplicación del código que renderiza textos, así que no hay más que extraerlo, lo que deja algunas cosas en mejor estado:

```python
import pygame

import pong.config


class ScoreBoard:
    def __init__(self, player1, player2):
        self.player1 = player1
        self.player2 = player2
        self.target = 5

    def draw(self, in_screen):
        board = " {0} : {1} ".format(self.player1.score, self.player2.score)
        self._render_board(board, in_screen)

    def stop(self):
        return self.player1.score == self.target or self.player2.score == self.target

    def winner(self, in_screen):
        if self.player1.score > self.player2.score:
            winner = self.player1
        else:
            winner = self.player2
        board = " {0} WON! ({1}-{2}) ".format(winner.name, self.player1.score, self.player2.score)
        self._render_board(board, in_screen)

    def _render_board(self, board, in_screen):
        scoreFont = pygame.font.Font(pygame.font.get_default_font(), 64)
        score_text = scoreFont.render(board, True, pong.config.black, pong.config.white)
        score_text_rect = score_text.get_rect()
        score_text_rect.center = (800 // 2, 40)
        in_screen.blit(score_text, score_text_rect)

```

Tener el código mejor ordenado nos muestra un par de defectos. Por ejemplo, en el constructor tenemos la propiedad `target`, que define los puntos para que acabe la partida y que aquí está puesto en `5` para que en las pruebas no duren mucho. Tiene todo el sentido mover lo a `config.py`, como preferencia del juego, así como darle un nombre más significativo.

```python
import pygame

import pong.config
from pong.config import POINTS_TO_WIN


class ScoreBoard:
    def __init__(self, player1, player2):
        self.player1 = player1
        self.player2 = player2
        self.target = POINTS_TO_WIN

    def draw(self, in_screen):
        board = " {0} : {1} ".format(self.player1.score, self.player2.score)
        self._render_board(board, in_screen)

    def stop(self):
        return self.player1.score == self.target or self.player2.score == self.target

    def winner(self, in_screen):
        if self.player1.score > self.player2.score:
            winner = self.player1
        else:
            winner = self.player2
        board = " {0} WON! ({1}-{2}) ".format(winner.name, self.player1.score, self.player2.score)
        self._render_board(board, in_screen)

    def _render_board(self, board, in_screen):
        scoreFont = pygame.font.Font(pygame.font.get_default_font(), 64)
        score_text = scoreFont.render(board, True, pong.config.black, pong.config.white)
        score_text_rect = score_text.get_rect()
        score_text_rect.center = (800 // 2, 40)
        in_screen.blit(score_text, score_text_rect)

```

Hay una situación curiosa, que todavía no vamos a arreglar, y es que si salimos del juego antes de que uno de los jugadores haya llegado a los puntos necesarios, el marcador no gestiona la situación de empate. Lo anotamos para volver en otro momento.

Por último, damos un repaso a todos los módulos para ver si hay algún detalle que podamos arreglar en este momento para dejar el código un poco mejor.

Y [este el commit](https://github.com/franiglesias/japong/commit/11e0c166fb2d5b89d9ea8652d6f07d405be75e60) en el que introducimos todos los cambios de esta entrega del artículo.

En la próxima iteración intentaré introducir el concepto Escena o Pantalla.

