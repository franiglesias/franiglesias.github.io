---
layout: post
title: Pong en Python. Mejorando la aplicación
categories: articles
tags: python good-practices
---

Ahora que ya hemos estructurado mejor la aplicación, estamos en condiciones de añadir nueva funcionalidad de manera más sencilla.

## Bienvenida

La carencia más llamativa de nuestro juego es una simple pantalla de bienvenida, la cual mejoraría la experiencia de uso de la aplicación. Ahora tenemos un coste relativamente bajo para añadirla: no tenemos más que crear una Scene similar a EndScene en la que se muestre la pantalla de inicio del juego.

Para hacer más bonita esta pantalla usaré una imagen libre de derechos y luego añadiré algunos textos. De momento empezaré con un test simple que me permita asegurar unos mínimos. La idea es que se muestre la pantalla y el juego comience al pulsar cualquier tecla.

```python
import unittest.mock

import pong.scenes.startscene
from pong.app.window import Window
from pong.tests import events


class StartSceneTestCase(unittest.TestCase):
    @unittest.mock.patch('pygame.event.get', return_value=[events.any_key_event])
    def test_should_run_fine(self, mock):
        window = pong.app.window.Window(800, 600, 'Test')
        scene = pong.scenes.startscene.StartScene(window)

        self.assertEqual(0, scene.run())


if __name__ == '__main__':
    unittest.main()
```

Tras un par de iteraciones tenemos esta clase:

```python
from pong.app.scene import Scene
from pong.app.window import Window


class StartScene(Scene):
    def __init__(self, window: Window):
        super().__init__(window)
```

Ahora vamos a implementar un método `run()` que simplemente tenga un bucle esperando a que se pulse una tecla cualquiera.

```python
import pygame

from pong.app.scene import Scene
from pong.app.window import Window


class StartScene(Scene):
    def __init__(self, window: Window):
        super().__init__(window)

    def run(self):
        pygame.init()
        done = False
        while not done:
            for event in pygame.event.get():
                if event.type == pygame.KEYDOWN:
                    done = True

        pygame.quit()

        return 0
```


Con esto ya podemos ver la ventana y el test sigue pasando. Ahora vamos a hacer que se muestre la imagen, la cual se puede encontrar en **pong/assets/pong.jpg**.

```python
import pygame

import pong.config
from pong.app.scene import Scene
from pong.app.window import Window


class StartScene(Scene):
    def __init__(self, window: Window):
        super().__init__(window)

    def run(self):
        pygame.init()
        image = pygame.image.load(pong.config.basepath + '/assets/pong.jpg')

        done = False
        while not done:
            for event in pygame.event.get():
                if event.type == pygame.KEYDOWN:
                    done = True

            self.window.screen.fill(pong.config.white)
            self.window.screen.blit(image, (0, 0))
            pygame.display.flip()

        pygame.quit()

        return 0
```

Al ejecutar el test podremos ver fugazmente la imagen en la ventana.

Con esto estaríamos en condiciones de añadir la escena al juego:

```python
import pygame

import pong.app.window
import pong.config
import pong.scenes.endscene
import pong.scenes.gamescene
import pong.scenes.startscene

pygame.init()
pygame.mixer.init()

playerHit = pygame.mixer.Sound(pong.config.basepath + '/sounds/player.wav')
sideHit = pygame.mixer.Sound(pong.config.basepath + '/sounds/side.wav')
point = pygame.mixer.Sound(pong.config.basepath + '/sounds/ohno.wav')


class App(object):
    def __init__(self):
        self.window = pong.app.window.Window(800, 600, 'Japong!')
        self.window.add_scene(pong.scenes.startscene.StartScene(self.window))
        self.window.add_scene(pong.scenes.gamescene.GameScene(self.window))
        self.window.add_scene(pong.scenes.endscene.EndScene(self.window))

    def run(self):
        return self.window.run()
```


Sin embargo, al intentar ejecutarlo nos encontramos varios problemas que están relacionados con la necesidad de inicializar pygame y el estado en que lo deja cada Scene. Esto nos obliga a revisar cada Scene y modificar el código para eliminar tanto `pygame.init()` como, sobre todo, `pygame.quit()` y centralizarlo en `App`. 

```python
import pygame

import pong.app.window
import pong.config
import pong.scenes.endscene
import pong.scenes.gamescene
import pong.scenes.startscene

pygame.init()
pygame.mixer.init()

playerHit = pygame.mixer.Sound(pong.config.basepath + '/sounds/player.wav')
sideHit = pygame.mixer.Sound(pong.config.basepath + '/sounds/side.wav')
point = pygame.mixer.Sound(pong.config.basepath + '/sounds/ohno.wav')


class App(object):
    def __init__(self):
        self.window = pong.app.window.Window(800, 600, 'Japong!')
        self.window.add_scene(pong.scenes.startscene.StartScene(self.window))
        self.window.add_scene(pong.scenes.gamescene.GameScene(self.window))
        self.window.add_scene(pong.scenes.endscene.EndScene(self.window))

    def run(self):
        code = self.window.run()
        
        pygame.quit()
        return code

```

Eso también nos lleva a revisar todos los tests para asegurarnos de que se ejecutan, lo que podrás comprobar en [los cambios de este commit](https://github.com/franiglesias/japong/commit/3b9e06093335c510eddccc010db7a3783182e928), que ya podríamos entregar.

## Mejorando el manejo de los textos

He dicho que quería añadir unos textos en la pantalla de bienvenida, además en el futuro queremos que permita hacer algunos ajustes mínimos, como la "habilidad" del oponente y quizá alguna personalización más. Con todo, poner textos en `pygame` no deja de ser un poco farragoso, como este ejemplo extraído de `EndScene`.

```python
        scoreFont = pygame.font.Font(pygame.font.get_default_font(), 64)
        text = scoreFont.render('Game finished', True, pong.config.yellow, pong.config.green)
        text_rect = text.get_rect()
        text_rect.center = (800 // 2, 600 // 2)
        self.window.screen.blit(text, text_rect)
```

Vamos a ver, por un lado si podemos hacer que el código sea más simple y, por otro, también más fácil de reutilizar allí donde lo necesitemos. Pero primero un poco de diseño.

El juego tendrá unos pocos usos del texto:

* Título de la aplicación
* Mensajes de utilidad, como "Press any key to continue"
* El marcador durante el juego
* El rótulo que indica qué jugadora ha ganado al final
* Otros usos aún no definidos, como podrían ser algunas instrucciones, etc.

La principal diferencia podría ser el tamaño de la tipografía, y en algún caso la tipografía específica. En lugar de tener que recordar los tamaños específicos los podemos definir en constantes, al igual que hicimos con los colores.

```python
text_prompt = 30
text_main_title = 60
text_score = 60
text_winner = 64
```


Para empezar, vamos a mostrar el texto "Press any key to play" en la pantalla de bienvenida. Luego extraremos todo para poder reutilizarlo fácilmente y, para terminar, refactorizaremos todos los usos de texto en el juego para normalizarlo.

Este es un primer paso.

```python
import pygame

import pong.config
from pong.app.scene import Scene
from pong.app.window import Window


class StartScene(Scene):
    def __init__(self, window: Window):
        super().__init__(window)

    def run(self):
        image = pygame.image.load(pong.config.basepath + '/assets/pong.jpg')

        done = False
        while not done:
            for event in pygame.event.get():
                if event.type == pygame.KEYDOWN:
                    done = True

            self.window.screen.fill(pong.config.white)

            self.window.screen.blit(image, (0, 0))
            self.show_text(self.window.screen, pong.config.text_prompt, 'Press any key to play')

            pygame.display.flip()

        return 0

    def show_text(self, surface, font_size, text_to_render):
        the_font = pygame.font.Font(pygame.font.get_default_font(), font_size)
        text = the_font.render(text_to_render, True, pong.config.white, pong.config.green)
        text.set_colorkey(pong.config.green)
        text_rect = text.get_rect()
        text_rect.center = (surface.get_rect().width // 2, surface.get_rect().height - 50)
        surface.blit(text, text_rect)

```

El problema que nos queda por resolver aquí es el posicionamiento ya que con esta función estaríamos pintando todos los textos en el mismo sitio. Vamos a permitir un par de parámetros más para permitir algo de flexibilidad:

```python
import pygame

import pong.config
from pong.app.scene import Scene
from pong.app.window import Window


class StartScene(Scene):
    def __init__(self, window: Window):
        super().__init__(window)

    def run(self):
        image = pygame.image.load(pong.config.basepath + '/assets/pong.jpg')

        done = False
        while not done:
            for event in pygame.event.get():
                if event.type == pygame.KEYDOWN:
                    done = True

            self.window.screen.fill(pong.config.white)

            self.window.screen.blit(image, (0, 0))
            self.blit_text(self.window.screen, pong.config.text_prompt, 'Press any key to play', 'center', 'bottom')

            pygame.display.flip()

        return 0

    def blit_text(self, surface, font_size, text_to_render, horizontal, vertical):
        the_font = pygame.font.Font(pygame.font.get_default_font(), font_size)
        text = the_font.render(text_to_render, True, pong.config.white, pong.config.black)
        text.set_colorkey(pong.config.black)
        x = 0
        y = 0
        if horizontal == 'center':
            x = surface.get_rect().width // 2 - text.get_rect().width // 2

        if vertical == 'bottom':
            y = surface.get_rect().height - 30 - text.get_rect().height

        surface.blit(text, (x, y))
```

El IDE, nos indica que el método podría definirse como estático, lo que indica que no tiene por qué pertenecer a la clase `StartScene` y, por tanto, podremos extraerlo con facilidad. De momento, creo que lo voy a extraer a una clase propia en la que me resulte fácil trabajar y pueda hacer algunas mejoras.

La voy a llamar TextRenderer en un alarde de originalidad y la pondré en un subpackage `utils`.

```python
import pygame

import pong.config


class TextRenderer():
    def blit(self, surface, font_size, text_to_render, horizontal, vertical):
        the_font = pygame.font.Font(pygame.font.get_default_font(), font_size)
        text = the_font.render(text_to_render, True, pong.config.white, pong.config.black)
        text.set_colorkey(pong.config.black)
        x = 0
        y = 0
        if horizontal == 'center':
            x = surface.get_rect().width // 2 - text.get_rect().width // 2

        if vertical == 'bottom':
            y = surface.get_rect().height - 30 - text.get_rect().height

        surface.blit(text, (x, y))
```

De momento he hecho el test manualmente. En una primera iteración así es como lo voy a usar en la `Scene`:

```python
import pygame

import pong.utils.textrenderer
import pong.config
from pong.app.scene import Scene
from pong.app.window import Window


class StartScene(Scene):
    def __init__(self, window: Window):
        super().__init__(window)

    def run(self):
        image = pygame.image.load(pong.config.basepath + '/assets/pong.jpg')

        done = False
        while not done:
            for event in pygame.event.get():
                if event.type == pygame.KEYDOWN:
                    done = True

            self.window.screen.fill(pong.config.white)

            text_renderer = pong.utils.textrenderer.TextRenderer()
            self.window.screen.blit(image, (0, 0))
            text_renderer.blit(self.window.screen, pong.config.text_prompt, 'Press any key to play', 'center', 'bottom')

            pygame.display.flip()

        return 0
```

Una cosa en la que me fijo es que normalmente la `Surface` en la que se muestra el texto será siempre la misma de la escena. Tiene sentido entonces pasársela en construcción a `TextRenderer`, de forma que es un parámetro menos cuando lo utilizamos. Eso, además, puede facilitarme su instanciación en las Scenes. De hecho, podría instanciarse en la constructora de `Scene`, con lo que estaría automáticamente disponible para cualquier otra que lo necesite.

Como de momento solo tengo un uso es fácil hacer el cambio:

```python
import pygame

import pong.config


class TextRenderer():
    def __init__(self, surface):
        self.surface = surface
        
    def blit(self, font_size, text_to_render, horizontal, vertical):
        the_font = pygame.font.Font(pygame.font.get_default_font(), font_size)
        text = the_font.render(text_to_render, True, pong.config.white, pong.config.black)
        text.set_colorkey(pong.config.black)
        x = 0
        y = 0
        if horizontal == 'center':
            x = self.surface.get_rect().width // 2 - text.get_rect().width // 2

        if vertical == 'bottom':
            y = self.surface.get_rect().height - 30 - text.get_rect().height

        self.surface.blit(text, (x, y))
```

Ahora muevo la instanciación a la constructora de `Scene`:

```
from pong.app.window import Window
from pong.utils.textrenderer import TextRenderer


class Scene(object):
    def __init__(self, window: Window):
        self.window = window
        self.text_renderer = TextRenderer(self.window.screen)

    def run(self):
        return 0

```

Y usarlo en una Scene es más fácil que nunca:

```python
import pygame

import pong.utils.textrenderer
import pong.config
from pong.app.scene import Scene
from pong.app.window import Window


class StartScene(Scene):
    def __init__(self, window: Window):
        super().__init__(window)

    def run(self):
        image = pygame.image.load(pong.config.basepath + '/assets/pong.jpg')

        done = False
        while not done:
            for event in pygame.event.get():
                if event.type == pygame.KEYDOWN:
                    done = True

            self.window.screen.fill(pong.config.white)

            self.window.screen.blit(image, (0, 0))
            self.text_renderer.blit(pong.config.text_prompt, 'Press any key to play', 'center', 'bottom')

            pygame.display.flip()

        return 0
```

Ahora, además, podemos hacer lo mismo en EndScene para el rótulo de final del juego:

```python
import pygame

import pong.config
from pong.app.scene import Scene
from pong.app.window import Window


class EndScene(Scene):
    def __init__(self, window: Window):
        super().__init__(window)

    def run(self):
        self.window.score_board.winner(self.window.screen)
        
        self.text_renderer.blit(pong.config.text_main_title, 'Game finished', 'center', 'middle')

        pygame.display.flip()
        done = False
        while not done:
            for event in pygame.event.get():
                if event.type == pygame.KEYDOWN:
                    done = True

        return 0
```

Aunque para que funcione, tenemos que añadir soporte al ajuste vertical "middle":

```python
import pygame

import pong.config


class TextRenderer():
    def __init__(self, surface):
        self.surface = surface

    def blit(self, font_size, text_to_render, horizontal, vertical):
        the_font = pygame.font.Font(pygame.font.get_default_font(), font_size)
        text = the_font.render(text_to_render, True, pong.config.white, pong.config.black)
        text.set_colorkey(pong.config.black)
        x = 0
        y = 0
        if horizontal == 'center':
            x = self.surface.get_rect().width // 2 - text.get_rect().width // 2

        if vertical == 'bottom':
            y = self.surface.get_rect().height - 30 - text.get_rect().height
        if vertical == 'middle':
            y = self.surface.get_rect().height // 2 - text.get_rect().height // 2

        self.surface.blit(text, (x, y))
```

Con esto, resulta barato añadir una indicación para salir del juego:

```python
import pygame

import pong.config
from pong.app.scene import Scene
from pong.app.window import Window


class EndScene(Scene):
    def __init__(self, window: Window):
        super().__init__(window)

    def run(self):
        self.window.score_board.winner(self.window.screen)

        self.text_renderer.blit(pong.config.text_main_title, 'Game finished', 'center', 'middle')
        self.text_renderer.blit(pong.config.text_prompt, 'Press any key to exit', 'center', 'bottom')

        pygame.display.flip()
        done = False
        while not done:
            for event in pygame.event.get():
                if event.type == pygame.KEYDOWN:
                    done = True

        return 0
```

Es cierto que esto no es el ideal. Deberíamos poder volver a iniciar una partida desde aquí o salir, pero ya es una mejora.

Por otro lado, al usar la nueva `TextRenderer` nos damos cuenta de que debería permitir indicar un color en el estilo del texto. Esta mejora nos sugiere que quizá haya una forma mejor de definir estilos de texto, pero eso lo dejaremos para el siguiente artículo.

Ahora toca hacer un [commit con los logros conseguidos](https://github.com/franiglesias/japong/commit/644bdcd2f149472d8d91f49587f24c36856d6750), que resultan ciertamente interesantes.
