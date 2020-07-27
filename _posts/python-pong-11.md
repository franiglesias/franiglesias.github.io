---
layout: post
title: Pong en Python. Ramas y bugs
categories: articles
tags: python good-practices
---


## El backlog

Tras el sprint anterior, nuestro backlog ha quedado así:

* BUG-2 La pantalla de salida es confusa y deberíamos quitarle contenido.
* US-5 Opcionalmente, Pueden jugar dos personas, controlando cada raqueta
* US-6 La partida se puede configurar para 3 ó 5 sets a 21 puntos con dos puntos de diferencia para el ganador
* US-7 El nivel de dificultad del juego puede ser seleccionado
* US-8 Mostrar la línea divisoria del campo de juego
* US-9 El efecto de rebote de la pelota es más realista
* US-10 Efecto de sonido diferenciado cuando se hace un tanto
* US-11 Se puede jugar en modalidad dobles (se necesita más información)

Nos encontramos con un gran contraste. De momento el BUG-2 está en primer lugar, pero pensamos que tiene una solución muy sencilla. La US-5, en cambio, es una historia que tiene varias cuestiones importantes.

Normalmente en mitad del sprint anterior habríamos realizado un refinamiento del backlog, para fijar las prioridades y analizar las historias pendientes.

## El refinamiento

El **refinamiento o _refinement_** es una reunión del equipo de desarrollo y la Product Owner en la que se discuten las historias que están en el backlog para los próximos sprints. Su objetivo es ayudar a priorizarlas mediante el análisis de su posible coste, además de ayudar a preparar el trabajo de desarrollo. Esto puede tener como resultado que una historia se reformula, se divide en historias más pequeñas o bien varias historias pequeñas se unifican para aportar más valor.

Al final del proceso, la Product Owner tiene más información para priorizar el backlog, y el equipo de desarrollo ha podido hacerse una idea de las implicaciones y desarrollos futuros. Esto último es una arma de doble filo porque no debería condicionar el trabajo de desarrollo actual en el sentido de "vamos a hacer cosas en previsión de lo que viene".

Lo ideal es adjuntar los comentarios y conclusiones a las historias para tenerlos presentes cuando por fin lleguen al sprint, de modo que podamos quitárnoslos de la cabeza en el momento actual.

La sesión no debería durar más de una hora.

En nuestro ejemplo, la historia BUG-2 sigue valorándose como muy sencilla y, teniendo fresco el trabajo realizado durante el sprint, tenemos muy claro cómo resolverla.

Por otro lado, la historia US-5 parece bastante más compleja de lo esperado. Al estar trabajando durante el sprint en otra historia que tocaba los mismos conceptos en el código (la historia que permitía al jugador escoger el lado de la pantalla), nos hemos dado cuenta de que podría interesarnos un refactor de esa parte para poder resolver mejor esta historia. 

Entre otras cosas, la historia consiste en que:

* Tenemos que permitir que el segundo jugador pueda controlar la pala con otras teclas. (Must have)
* Tenemos que permitir la opción del modo de juego (contra el ordenador, contra otra persona) (Must have)
* Sería interesante la posibilidad de permitir personalizar las teclas de control. (Nice to have)

Pero, ¿qué es esto del *Must have* y *Nice to Have*? Pues dentro de las posibles cosas que podríamos hacer para implementar una historia, podríamos agruparlas en varias categorías:

* **Must have o Must**: es un rasgo de la historia que debe estar presente para que podamos considerar la historia satisfecha.
* **Nice to have**: es un rasgo que aportaría valor de estar presente, pero que no es necesario para el objetivo de la historia. Si se tiene tiempo, se podría llegar a incluir.
* **Out of scope**: es algo que no vamos a tratar de implementar. Sabemos que se podría, sabemos que podría ser necesario o interesante en algún momento, pero no nos vamos a ocupar de ello en esta historia.

Esta clasificación es importante para evitar el riesgo de irse por las ramas en el desarrollo y mantener el foco en la entrega de valor.

La US-6 es una feature que puede implicar cambios en la estructura de objetos y la organización del código. Actualmente tenemos una control muy simple del funcionamiento de la partida: cuando una jugadora alcanza la puntuación máxima, la partida termina. La tarea requiere primero un refactor para mantener el comportamiento actual, pero con una estructura más flexible y luego la modificación para permitir varios sets y otras reglas de puntuación.

Respecto a la US-7, tenemos una cierta idea de los parámetros que podrían afectar al nivel de dificultad del juego, cuando se compite con el ordenador, como pueden ser la velocidad y precisión de la pala controlada por el software o la velocidad de la pala controlada por la persona, para que sea más fácil o más difícil manejarlas con exactitud.

En todo caso, la sesión termina con la revisión de esta historia y la prioridad se mantiene tal cual estaba ahora. El BUG-2 sigue siendo la primera historia y consideramos que tiene sentido seguir manteniendo la US-5 antes que la US-6 ya que las jugadoras demandan más esta posibilidad.

Posteriormente, cuando llegamos a la sesión de planificación, al principio del nuevo sprint, decidimos abordar las tres primeras historias del backlog priorizado:

* BUG-2 La pantalla de salida es confusa y deberíamos quitarle contenido.
* US-5 Opcionalmente, Pueden jugar dos personas, controlando cada raqueta
* US-6 La partida se puede configurar para 3 ó 5 sets a 21 puntos con dos puntos de diferencia para el ganador

De nuevo se mantiene la priorización. El BUG-2 no tiene mucho coste, pero mejoraría mucho la experiencia del juego. La historia US-5 aporta más valor, pero también tiene un coste bastante mayor. Si sólo atendemos a la cantidad de valor entregado lo suyo sería hacer primero la historia US-5, pero es la relación entre coste y valor lo que nos hace decantarnos por resolver primero el BUG-2.

Esta relación valor/coste es muy sencilla de calcular. Veámoslo en una tabla:

| US | Coste | Valor | V/C |
|:---|------:|------:|----:|
| BUG-2 | 1 | 2 | 2.00 |
| US-5  | 3 | 4 | 1.33 |

Otro beneficio, casi más psicológico, es que una historia pequeña nos permite hacer una entrega mucho antes, con lo que ganamos tiempo mientras los stakeholders y usuarios prueban la entrega y obtenemos feedback,

Así que, con la planificación terminada, arrancamos este sprint.

## BUG-2 La pantalla confusa

En realidad el problema es que en EndScene no borramos la pantalla de juego, con lo cual al poner los resultados se ve todo mezclado y sucio. Nos bastaría con borrar la pantalla. Este es el código actual:

```python
class EndScene(Scene):
    def __init__(self, window: Window):
        super().__init__(window)

    def run(self):
        self.window.score_board.winner(self)

        self.text_renderer.blit('Game finished', pong.config.style_end_title)
        self.text_renderer.blit('Press P to play again or any other key to exit', pong.config.style_prompt)

        pygame.display.flip()
```

Y añadiendo esta línea limpiamos la pantalla:

```python
class EndScene(Scene):
    def __init__(self, window: Window):
        super().__init__(window)

    def run(self):
        self.window.screen.fill(pong.config.green)
        
        self.window.score_board.winner(self)
        self.text_renderer.blit('Game finished', pong.config.style_end_title)
        self.text_renderer.blit('Press P to play again or any other key to exit', pong.config.style_prompt)
```

Esto ya mejora la claridad, pero como el fondo verde es el mismo que el campo de juego decidimos ponerlo negro para que se aprecie mejor el cambio de contexto:

```python
class EndScene(Scene):
    def __init__(self, window: Window):
        super().__init__(window)

    def run(self):
        self.window.screen.fill(pong.config.black)

        self.window.score_board.winner(self)
        self.text_renderer.blit('Game finished', pong.config.style_end_title)
        self.text_renderer.blit('Press P to play again or any other key to exit', pong.config.style_prompt)
```

Con esto, damos por arreglado el BUG-2 y [hacemos commit de los cambios](https://github.com/franiglesias/japong/commit/97c771bc85e33db9db5fe0137a63a3f57ca2f17c).


## US-5 Dos jugadoras

Para abordar estar tarea hemos decidido que primero haremos un refactor. En este momento el objeto `Pad` tiene métodos `update` y `follow` que representan distintos sistemas de control. Por otro lado, la responsabilidad de gestionarlos y decidir qué objeto debe responder se encuentra ahora en `GameScene`. 

Por tanto, vamos a tratar de mover esa responsabilidad a `Pad`, que lo que hará será recibir los eventos del juegos (teclas pulsadas) y actuar si es necesario. De este modo, `GameScene` se limitará a pasar eventos a los objetos en el juego y éstos se encargarán de reaccionar si les corresponde. Es un patrón de cadena de responsabilidad.

Por otra parte, los `Pads` delegarán este proceso de los eventos en un `ControlEngine` dependiendo de si se trata de un `Pad` controlado por una persona o controlado por el ordenador. De este modo, la interfaz de Pad no tendrá distintos métodos `update` o `follow`, sino un único método `update`, que es el que requiere `pygame`.

Finalmente, será necesario ofrecer la posibilidad de jugar contra el ordenador o contra otra persona. Con todos estos cambios, de hecho, se podrían crear partidas ordenador contra ordenador.

Así que vamos ello, porque hay unas cuantas cosas que considerar.

Empecemos por los `Pad`. Deberían poder recibir eventos y modificar su posición en consecuencia. De esa modificación se encargaría un `ControlEngine`, que podría ser `KeyboardControlEngine` y `ComputerControlEngine`. Esto nos plantea varias cosas:

La más inmediata es que para poder seguir la pelota, el `ComputerControlEngine` tiene que estar asociado a ésta, mientras que `KeyboardControlEngine` puede ignorarla y, en su lugar, debe saber qué teclas son aquellas a las que debe escuchar.

El método con el que tenemos que trabajar es `update`, el cual debería recibir los eventos que se recojan en el loop de eventos. Esto quiere decir que tendremos que hacer que update reciba los eventos y los pase al ControlEngine, el cual los procesará y modificará la posición de las palas como corresponda.

Como primer paso, voy a extraer la funcionalidad que se encuentra en `follow` a un objeto `ComputerControlEngine` usando el test de `Pad`, para estar seguro de que mantengo el comportamiento.

```python
    def follow(self, the_ball: pong.ball.Ball):
        control_engine = ComputerControlEngine(the_ball)
        control_engine.move(self)
```

El nuevo ComputerControlEngine quedaría así:

```python
import pong.ball


class ComputerControlEngine(object):
    def __init__(self, the_ball: pong.ball):
        self.ball = the_ball

    def follow(self, pad):
        if self.ball.rect.y > pad.rect.y:
            pad.down()
        if self.ball.rect.y < pad.rect.y:
            pad.up()
```

De momento, esto no cambia nada en cuanto al funcionamiento, pero ya me va indicando algunas líneas de trabajo. El método `follow` no va a ser usado directamente por Pad, sino que Pad le pasará a su ControlEngine un evento y ControlEngine decidirá si lo puede manejar, invocando el método follow, o no.

Esto me lleva a darme cuenta de que no puedo pasar el pad asociado en el método `follow`, así que voy a pasar el `pad` también en la construcción.

```python
import pong.ball
import pong.game.pad


class ComputerControlEngine(object):
    def __init__(self, the_ball: pong.ball, the_pad: pong.game.pad.Pad):
        self.ball = the_ball
        self.pad = the_pad

    def move(self):
        if self.ball.rect.y > self.pad.rect.y:
            self.pad.down()
        if self.ball.rect.y < self.pad.rect.y:
            self.pad.up()
```

Y el método `follow` en `Pad`:

```python
    def follow(self, the_ball: pong.ball.Ball):
        control_engine = ComputerControlEngine(the_ball, self)
        control_engine.move()
```

Esto no es definitivo todavía, pero hemos empezado a mover cosas y a entender cómo se deberían relacionar los distintos objetos.

Ahora nos falta un método en ComputerControlEngine que reciba eventos y los gestione. Este método, que llamaremos `handle` formará parte de la interfaz. Para desarrollarlo, crearemos un test de ComputerControlEngine.

```python
from unittest import TestCase

import pygame

import pong.ball
import pong.config
import pong.game.control.computer_control_engine
import pong.game.pad
import pong.tests.events


class TestComputerControlEngine(TestCase):

    def setUp(self) -> None:
        self.pad = pong.game.pad.Pad('left')
        self.ball = pong.ball.Ball((100, 100, 100), 10)
        self.pad.rect.y = 100

    def test_invalid_event_does_not_move_pad(self):
        engine = pong.game.control.computer_control_engine.ComputerControlEngine(self.ball, self.pad)
        self.ball.rect.y = 200

        engine.handle([pong.tests.events.any_key_event])
        self.assertEqual(0, self.pad.dy)

    def test_valid_event_does_not_move_pad(self):
        engine = pong.game.control.computer_control_engine.ComputerControlEngine(self.ball, self.pad)
        self.ball.rect.y = 200
        event_move = pygame.event.Event(pong.config.COMPUTER_MOVES_EVENT)
        engine.handle([event_move])
        self.assertEqual(1, self.pad.dy)

    def test_mixed_events_are_handled_or_not(self):
        engine = pong.game.control.computer_control_engine.ComputerControlEngine(self.ball, self.pad)
        self.ball.rect.y = 200
        events = [
            pygame.event.Event(pong.config.COMPUTER_MOVES_EVENT),
            pong.tests.events.any_key_event
        ]
        engine.handle(events)
        self.assertEqual(1, self.pad.dy)
```

Los tests pasan con este código:

```python
import pong.ball
import pong.game.pad
import pong.config


class ComputerControlEngine(object):
    def __init__(self, the_ball: pong.ball, the_pad: pong.game.pad.Pad):
        self.ball = the_ball
        self.pad = the_pad

    def follow(self):
        if self.ball.rect.y > self.pad.rect.y:
            self.pad.down()
        if self.ball.rect.y < self.pad.rect.y:
            self.pad.up()

    def handle(self, events):
        for event in events:
            if event.type == pong.config.COMPUTER_MOVES_EVENT:
                self.follow()

```

A partir de aquí extraemos una superclase, `ControlEngine`.

```python
from abc import ABCMeta, abstractmethod


class ControlEngine(object, metaclass=ABCMeta):
    def __init__(self, the_pad):
        self.pad = the_pad

    @abstractmethod
    def handle(self, events):
        pass

```

A partir de la cual podremos desarrollar nuestro `KeyboardControlEngine`, el cual tendrá que saber a qué pulsación de teclas debe responder. Después de darle unas cuantas vueltas, hemos usado este test:

```python
from unittest import TestCase

import pygame

import pong
import pong.game.control.keyboard_control_engine
import pong.game.pad
import pong.tests.events


class TestKeyboardControlEngine(TestCase):

    def setUp(self) -> None:
        self.pad = pong.game.pad.Pad('left')
        self.pad.rect.y = 100
        self.engine = pong.game.control.keyboard_control_engine.KeyboardControlEngine(self.pad, ('u', 'd'))

    def test_should_ignore_some_keys(self):
        self.engine.handle([pong.tests.events.r_key_event])

        self.assertEqual(0, self.pad.dy)

    def test_press_up_key_should_move_pad_up(self):
        up_key_event = pong.tests.events.u_key_event
        self.engine.handle([up_key_event])

        self.assertEqual(-1, self.pad.dy)

    def test_press_down_key_should_move_pad_down(self):
        down_key_event = pong.tests.events.d_key_event
        self.engine.handle([down_key_event])

        self.assertEqual(1, self.pad.dy)
        
    def test_last_key_sould_prevail(self):
        events = [
            pong.tests.events.r_key_event,
            pong.tests.events.d_key_event,
            pong.tests.events.u_key_event
        ]

        self.engine.handle(events)
        self.assertEqual(-1, self.pad.dy)

```

Con el que hemos podido desarrollar el siguiente código:

```python
import pygame

import pong.game.control.control_engine


class KeyboardControlEngine(pong.game.control.control_engine.ControlEngine):
    def __init__(self, the_pad, keys):
        super().__init__(the_pad)
        self.upKey = keys[0]
        self.downKey = keys[1]

    def handle(self, events):
        for event in events:
            if event.type == pygame.KEYDOWN:
                key_name = pygame.key.name(event.key)
                if key_name == self.upKey:
                    self.pad.up()
                elif key_name == self.downKey:
                    self.pad.down()
                else:
                    self.pad.stop()
        pass
```

Ahora necesitamos hacer que los pads usen sus correspondientes motores de control, para lo cual deberían poder recibir eventos y pasárselos. Esto es, al construir los pads deberíamos asociarlos con su correspondiente motor. Sin embargo, necesitaríamos pasar un `Pad` al `ControlEngine`, que no tendremos en el momento de inicializar, así que tendremos que cambiar el modo en que se asocian, añadiendo un método `bind_pad` a `ControlEngine`.

Esto nos lleva a encadenar una serie de cambios que afectan a varias clases. Como sería muy largo poner todo el código intentaré mostrar algunos de los cambios más interesantes.

Aparte, hemos aprovechado para "pagar" deuda técnica. Con los cambios que hemos ido realizado en las iteraciones anteriores, muchas cuestiones han empezado a estar más claras, con lo que estamos en mejor disposición para realizar algunos refactors, mejorar cuestiones de estilo de código, en especial las importaciones, y refactorizar masivamente. Esta entrega tendrá muchos cambios.







