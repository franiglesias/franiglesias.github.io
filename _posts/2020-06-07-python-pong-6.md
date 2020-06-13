---
layout: post
title: Pong en Python. Eliminando deuda técnica.
categories: articles
tags: python good-practices
---

Vamos a seguir mejorando el manejo de textos para tener más agilidad en el futuro.

Estamos dedicando bastante tiempo a un tema un poco menor, como es el renderizado de texto. Sin embargo, es algo que puede ocurrir en cualquier proyecto. En ocasiones tenemos que ir despacio, o sea detenernos en algún desarrollo que nos ayude a mejorar cómo hacemos cosas, para poder entregar más rápido valor en el futuro próximo.

Cuando el código existente nos ralentiza a la hora de entregar nuevas prestaciones porque requiere mucho trabajo, resulta difícil entender cómo funciona o manifiesta fragilidad ante los cambios, estamos ante un caso de **deuda técnica**. 

## No todo el *legacy* es *deuda técnica*

Como ya he dicho en entregas anteriores, me estoy planteando este desarrollo como un ejercicio de trabajo en proyectos legacy. Mi objetivo es que cada entrega, que en este contexto se materializa como un commit a master, mantenga como mínimo la funcionalidad existente a la vez que se mejora la calidad general del código y se añaden nuevas features. Dicho en otras palabras: los cambios no generan errores ni menoscaban el funcionamiento del juego, nos permiten avanzar en términos de robustez y mantenibilidad, y nos habilitan para añadir o mejorar la funcionalidad.

Si te has fijado en todos los artículos todavía no hemos modificado demasiadas cosas del legacy. Hemos podido embeberlo en una estructura de código más sólida, que nos ha permitido testear lo suficiente como para poder entregar con un mínimo de garantías. Hasta ahora el proceso ha sido bastante fluído. Es código poco estructurado y poco flexible, pero que proporciona la funcionalidad deseada. Es legacy, pero no podría considerarlo **deuda técnica**.

Sin embargo, hemos llegado a un aspecto que es aparentemente trivial como el de mostrar textos en nuestro juego. La cantidad de código que necesitamos para mostrar una línea de texto con las características deseadas es desproporcionadamente grande y la "incertidumbre" sobre el resultado también. Añadir un texto nuevo en el juego tiene un coste muy alto que hay que pagar cada vez que necesitamos hacerlo. Esto encaja con el concepto de deuda técnica.

## Liquidando la deuda

Por eso, en el artículo anterior empezamos a buscar una solución. Sin embargo, todavía tenemos margen para mejorarla. El primer paso, ha sido refactorizar y ampliar la capacidad de nuestro `TextRenderer` y mejorar un poco la interfaz del método `blit`:

```python
import pygame

import pong.config


class TextRenderer():
    def __init__(self, surface):
        self.surface = surface
        self.padding = 30

    def blit(self, text_to_render, font_size, horizontal, vertical):
        the_font = pygame.font.Font(pygame.font.get_default_font(), font_size)
        text = the_font.render(text_to_render, True, pong.config.white, pong.config.black)
        text.set_colorkey(pong.config.black)
        position = self.compute_position(text, horizontal, vertical)
        self.surface.blit(text, position)

    def compute_position(self, text, horizontal, vertical):
        x = 0
        y = 0
        if horizontal == 'left':
            x = self.padding
        if horizontal == 'center':
            x = self.surface.get_rect().width // 2 - text.get_rect().width // 2
        if horizontal == 'right':
            x = self.surface.get_rect().width - text.get_rect().width - self.padding
        if vertical == 'top':
            y = self.padding
        if vertical == 'middle':
            y = self.surface.get_rect().height // 2 - text.get_rect().height // 2
        if vertical == 'bottom':
            y = self.surface.get_rect().height - text.get_rect().height - self.padding
        return x, y
```

Sin embargo, todavía tenemos algunas carencias: no podemos cambiar el color del texto y hemos perdido cierta flexibilidad para usarlo. Lo que quiero conseguir es poder usarlo así:

```python
    text_renderer.blit('Text to show', style)
```


Siendo `style` un diccionario en el que pasar todas las características del texto, no sólo el tamaño como ahora, con la idea de definir los que sean necesarios en **config.py**, garantizando coherencia y predictibilidad en su uso.

Vamos a usar el siguiente enfoque.

Cambiamos el nombre del método `blit` y sus usos a `old_blit`. Como todavía no lo estamos usando en muchos lugares es un cambio con poco coste:

```python
    def old_blit(self, text_to_render, font_size, horizontal, vertical):
        the_font = pygame.font.Font(pygame.font.get_default_font(), font_size)
        text = the_font.render(text_to_render, True, pong.config.white, pong.config.black)
        text.set_colorkey(pong.config.black)
        position = self.compute_position(text, horizontal, vertical)
        self.surface.blit(text, position)

```

Creamos un método `blit` que utilice la nueva signatura, y que llama al método `old_blit`:

```python
    def blit(self, text_to_render, style):
        self.old_blit(text_to_render, style['font_size'], style['horizontal'], style['vertical'])
```

Ahora podemos definir los estilos que necesitemos en **config.py**:

```python
# TEXT STYLES

style_prompt = {'font_size': 30, 'horizontal': 'center', 'vertical': 'bottom', 'color': white, 'background': 'transparent'}
style_main_title = {'font_size': 60, 'horizontal': 'center', 'vertical': 'middle', 'color': white, 'background': 'transparent'}
```

Por el momento estos son suficientes, ya definiremos más a medida que los necesitemos.

Ahora mismo podríamos desplegar este código sin afectar a la funcionalidad actual. Además podríamos empezar a usar el nuevo método simultáneamente con la versión antigua.

Por ejemplo, en `EndScene` el texto "Game Finished" debería tener color amarillo, una cosa que hemos perdido en el último cambio. Para hacerlo volver, tenemos que dar soporte a la propiedad `color` de `style`. Vamos a ello.

Vamos a necesitar un estilo nuevo, que llamaremos `txt_end_title`:

```python
# TEXT STYLES

style_prompt = {'font_size': 30, 'horizontal': 'center', 'vertical': 'bottom', 'color': white, 'background': 'transparent'}
style_main_title = {'font_size': 60, 'horizontal': 'center', 'vertical': 'middle', 'color': white, 'background': 'transparent'}
style_end_title = {'font_size': 60, 'horizontal': 'center', 'vertical': 'middle', 'color': yellow, 'background': 'transparent'}
```

Ahora cambiamos la `EndScene` para usar el método nuevo, con su estilo:

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

        self.text_renderer.blit('Game finished', pong.config.style_end_title)
        self.text_renderer.old_blit('Press any key to exit', pong.config.text_prompt, 'center', 'bottom')

        pygame.display.flip()
        done = False
        while not done:
            for event in pygame.event.get():
                if event.type == pygame.KEYDOWN:
                    done = True

        return 0
```


Y nos aseguramos de que sigue funcionando. Obviamente el color del texto seguirá siendo blanco, pero esto nos garantiza una línea de base.

Mi siguiente paso será reimplementar `blit`, para lo cual copio el código del `old_blit` y lo modifico para usar las claves del diccionario, entre ellas la de 'color':

```python
import pygame

import pong.config


class TextRenderer():
    def __init__(self, surface):
        self.surface = surface
        self.padding = 30

    def blit(self, text_to_render, style):
        the_font = pygame.font.Font(pygame.font.get_default_font(), style['font_size'])
        text = the_font.render(text_to_render, True, style['color'], pong.config.black)
        text.set_colorkey(pong.config.black)
        position = self.compute_position(text, style['horizontal'], style['vertical'])
        self.surface.blit(text, position)

    def old_blit(self, text_to_render, font_size, horizontal, vertical):
        the_font = pygame.font.Font(pygame.font.get_default_font(), font_size)
        text = the_font.render(text_to_render, True, pong.config.white, pong.config.black)
        text.set_colorkey(pong.config.black)
        position = self.compute_position(text, horizontal, vertical)
        self.surface.blit(text, position)

    def compute_position(self, text, horizontal, vertical):
        x = 0
        y = 0
        if horizontal == 'left':
            x = self.padding
        if horizontal == 'center':
            x = self.surface.get_rect().width // 2 - text.get_rect().width // 2
        if horizontal == 'right':
            x = self.surface.get_rect().width - text.get_rect().width - self.padding
        if vertical == 'top':
            y = self.padding
        if vertical == 'middle':
            y = self.surface.get_rect().height // 2 - text.get_rect().height // 2
        if vertical == 'bottom':
            y = self.surface.get_rect().height - text.get_rect().height - self.padding
        return x, y

```

Nos quedaría dar soporte al pseudo-color 'transparent'. Como se puede ver en el código, para hacer transparente el color de fondo se debe usar `text.set_colorkey(pong.config.black)`, lo que provoca que se use ese color como canal alfa. En el código actual se usa el negro como color de fondo. Yo voy a definir un color 'chroma' para tratar esos casos (por ahora es negro, pero podría cambiar en algún momento si obtenemos mejores resultados con otro color):

```python
chroma = (0, 0, 0)
```

Y en este código damos soporte al fondo transparente:

```python
    def blit(self, text_to_render, style):
        the_font = pygame.font.Font(pygame.font.get_default_font(), style['font_size'])
        transparent = style['background'] == 'transparent'

        if transparent:
            background = pong.config.chroma
        else:
            background = style['background']

        text = the_font.render(text_to_render, transparent, style['color'], background)
        if transparent:
            text.set_colorkey(background)

        position = self.compute_position(text, style['horizontal'], style['vertical'])
        self.surface.blit(text, position)
```

Con esto estamos en condiciones de utilizar el nuevo método `blit` y deshacernos del viejo.

Nos queda un lugar en el que se muestran textos que es en `ScoreBoard`. Cuando tiene que mostrar el marcador, `ScoreBoard` recibe una `Surface`, pero podemos hacer que reciba una `Scene`, de este modo puede usar el `TextRenderer`:

```python
import pygame

import pong.config
from pong.config import POINTS_TO_WIN


class ScoreBoard:
    def __init__(self, player1, player2):
        self.player1 = player1
        self.player2 = player2
        self.target = POINTS_TO_WIN

    def draw(self, scene):
        board = " {0} : {1} ".format(self.player1.score, self.player2.score)
        scene.text_renderer.blit(board, pong.config.style_score)

    def stop(self):
        return self.player1.score == self.target or self.player2.score == self.target

    def winner(self, scene):
        if self.player1.score > self.player2.score:
            winner = self.player1
        else:
            winner = self.player2
        board = " {0} WON! ({1}-{2}) ".format(winner.name, self.player1.score, self.player2.score)
        scene.text_renderer.blit(board, pong.config.style_score)
```

En cuanto a calidad de código esto todavía no es satisfactorio, pero ahora el conocimiento sobre cómo  dibujar texto en el juego ya está en un solo lugar.

Revisamos que todos los tests pasen y que la aplicación funciona correctamente para [hacer un nuevo commit](https://github.com/franiglesias/japong/commit/92080ca510ce6477605f7cfcbc14bb536d5998e2). En esta sesión hemos conseguido atajar una buena parte de deuda técnica y mejorar nuestra capacidad de entrega en el futuro.

Lo que vendrá en las próximas sesiones es introducir nuevas features en nuestro juego que hasta ahora no estaban y que nos empujarán hacia nuevas mejoras de código.

