---
layout: post
title: Pong en Python. Agilidad y prioridades
categories: articles
tags: python good-practices
---

En este artículo voy a intentar simular el desarrollo durante un sprint.

## Planificación

Los sprints comienzan con una sesión de planificación. Esta sesión ya he dicho que no debería durar más de una hora porque su objetivo es definir el **compromiso de entrega** de las historias de usuario y, aunque se debatan unas líneas básicas de cómo abordar cada una de ellas, esa tarea corresponde más bien a la fase de **refinamiento del backlog** más que a la planificación.

En este momento lo que hacemos es ir al backlog priorizado, repasar las historias, ver cómo se dividen y confirmar su priorización. Por ejemplo, veamos el backlog priorizado de nuestro juego de Pong!.

* Opcionalmente, Pueden jugar dos personas, controlando cada raqueta
* Permitir jugar una nueva partida al acabar
* Al jugar contra el ordenador se puede escoger el lado de la mesa
* La partida se puede configurar para 3 ó 5 sets a 21 puntos con dos puntos de diferencia para el ganador
* El nivel de dificultad del juego puede ser seleccionado
* Mostrar la línea divisoria del campo de juego
* El efecto de rebote de la pelota es más realista
* Efecto de sonido diferenciado cuando se hace un tanto
* Se puede jugar en modalidad dobles (se necesita más información)

En caso de que una historia genere un nivel de incertidumbre muy alto que no haya podido resolverse antes, por el motivo que sea, puede dar lugar a un *spike*, o historia de investigación cuya resolución debe materializarse en nuevas historias añadidas al backlog.

### Cambio de prioridades respondiendo al feedback

En este punto, la Product Owner nos dice que después de nuestra última iteración nos han llegado algunas informaciones importantes:

* A las jugadoras les encanta que sea ahora mucho más difícil ganar al ordenador, pero les frustra que al terminar la partida no se pueda empezar de nuevo sin tener que volver a arrancar el juego.
* Se quejan de que ahora mover la pala propia resulta muy lento y que preferirían que fuese un poco más rápida.

He aquí el tipo de feedback que esta metodología nos permite obtener y estamos en el momento perfecto para pivotar y cambiar lo necesario en nuestro desarrollo.

Esto implica dos cosas:

* Se añade una historia nueva: que la pala controlada por la jugadora humana se mueva más rápidamente.
* Se cambia la prioridad de las historias.

Además, nos damos cuenta de que las historias de jugar dos jugadoras y poder elegir el lado de la mesa están técnicamente muy vinculadas por lo que se propone cambiar su orden.

El nuevo backlog quedaría así:

* Permitir jugar una nueva partida al acabar
* La pala de la jugadora humana se mueve más rápido
* Al jugar contra el ordenador se puede escoger el lado de la mesa
* Opcionalmente, Pueden jugar dos personas, controlando cada raqueta
* La partida se puede configurar para 3 ó 5 sets a 21 puntos con dos puntos de diferencia para el ganador
* El nivel de dificultad del juego puede ser seleccionado
* Mostrar la línea divisoria del campo de juego
* El efecto de rebote de la pelota es más realista
* Efecto de sonido diferenciado cuando se hace un tanto
* Se puede jugar en modalidad dobles (se necesita más información)

Esta es exactamente una de las grandes ventajas de usar un enfoque ágil. En una situación ideal, en el momento de planificar no estamos haciendo nada. El comienzo del sprint debería ser comenzar de cero. Esto nos permite no tener una preferencia por una historia en particular, sino sólo por la que es más importante o necesaria conseguir, medida en valor de negocio. Por eso, en la planificación podemos cambiar prioridades o incluso introducir historias nuevas si con eso vamos a añadir más valor.

### El compromiso de entrega

El resultado de la planificación de un sprint se puede definir como un **compromiso de entrega**. El sprint tiene una duración, que puede ser cualquiera que le convenga al equipo. Típicamente son dos semanas, pero puedes hacer sprints de una semana o de otras duración. Dos semanas es una buena forma de empezar. Pero si es un proyecto muy nuevo es recomendable tener sprints cortos para tener feedback antes. Agile trata de reducir la duración de los ciclos de feedback en los diferentes niveles.

De forma resumida, un compromiso de entrega es una lista de las historias de usuario que el equipo de desarrollo considera que puede terminar y entregar al final del sprint.

En este punto hay que matizar porque dependiendo del tipo de producto y modo de distribución hay formas diferentes de entregar. Podríamos decir que hay dos tipos de entregas principalmente:

* **Entrega continua**. Encaja especialmente con las aplicaciones web: a medida que se completan las historias de usuario se entregan y se ponen en producción.
* **Entrega discreta (release)**. Por ejemplo, en aplicaciones móviles y de escritorio que requieren un proceso de compilación y distribución. La puesta en producción de las historias se hace al final del sprint.

En nuestro ejemplo, entendemos que cada `commit` es una entrega a producción, así que estaríamos más en la línea de la entrega continua. Y nuestro compromiso para este sprint será:

* Permitir jugar una nueva partida al acabar
* La pala de la jugadora humana se mueve más rápido
* Al jugar contra el ordenador se puede escoger el lado de la mesa

### Definition of done

Por otra parte, ¿qué significa que una historia esté completada? Si quieres ser verdaderamente ágil una historia terminada (done) es **una feature que está en producción y que al menos un usuario del software puede utilizar**. Estar en PR, mezclada en master o cualquier otro estado, es sólo un paso previo.

Si no la puedes desplegar por razones de negocio, por ejemplo porque es una feature que no debería aparecer antes de cierta fecha, entonces tal vez necesites algún tipo de feature toggle o herramienta similar para poder desplegar y activar o desactivar las features a voluntad.

Pero si combinas las ideas de *compromiso de entrega* y *definition of done* lo que obtienes es que la empresa puede decir que al final del sprint el software ya sabe hacer tal o cual cosa, ya contiene tal o cual feature. De este modo, tenemos una estimación adecuada del estado de las cosas en un momento dado: sabremos qué podemos publicitar, qué cosas tiene que saber el servicio de atención al cliente, en qué estado estamos para desarrollar nuevas features o productos, etc. Es decir, podemos hacer el desarrollo **predecible**.

### Abrimos el sprint

Cuando abrimos el sprint tenemos que decidir cómo organizamos el equipo. Como hemos dicho en el artículo anterior lo adecuado es ponernos siempre todo el equipo con la primera historia.

Desde el punto de vista técnico podríamos pensar que la última historia de nuestro sprint es más importante porque es más complicada. Echando un vistazo podemos imaginar que tanto la primera como la segunda historias son muy fáciles de hacer, mientras que la tercera es la que más dificultades parece tener a primera vista.

Pero el caso es que las dos primeras historias van a aportar muchísimo valor porque las jugadoras están deseando tenerlas, de tal forma que, como usuarias, la tercera historia les preocupa mucho menos. Y para nosotras, además, este tipo de situaciones es ideal ya que podemos tener mucho impacto con poco esfuerzo, lo que nos permite aprovechar estas tareas para introducir algunas mejoras técnicas en esos apartados a través de pequeños refactors. 

Además, al haber entregado valor con esas historias generamos confianza, ganamos tiempo y liberamos presión para afrontar tareas más complicadas pero de menos valor a priori.

Por otro lado, si somos demasiada gente para la primera historia, parte del equipo puede irse a la segunda. Una posible división es por especialización, pero idealmente las historias deberían ser transversales para el equipo. Uno de los objetivos que debemos tener en cuenta es la posibilidad de que el conocimiento se redistribuya entre todo el equipo.

Al abordar cada historia la consideraremos de forma única, sin pensar mucho en lo que pueda venir después. Preparar el terreno para las futuras historias forma parte de escribir software con buenas prácticas. Dicho de otro modo: si aplicas buenas prácticas, en el futuro será más fácil y rápido desarrollar las nuevas historias.

## Primera historia: Permitir jugar una nueva partida al acabar

Así que vamos con nuestra primera historia y vemos que tiene básicamente las siguientes tareas:

* Mostrar un mensaje en la pantalla final que indique una tecla para pulsar y que se empiece a jugar de nuevo.
* Detectar que se pulsa esa tecla y saltar la ejecución a la pantalla de bienvenida.
* Permitir salir del juego pulsando cualquier otra tecla (quizá se puede cambiar el mensaje actual).

Esta división de tareas se puede haber hecho durante el Refinamiento del backlog, durante la Planificación, en sesiones específicas de análisis de historias por el equipo de desarrollo o, como en este caso, en el momento de abordarla.

La tarea que requiere más esfuerzo y más cambios en el código es la segunda, ya que implica modificar el flujo del juego en el nivel de `App` o `Window`. La tercera tarea en realidad es el comportamiento actual y sólo queremos excluir una tecla.

La tecla que nos permitirá volver a jugar podría ser "P" por "Play again".

Obviamente otra opción sería disponer de un menú, o bien dee una interfaz manejable con ratón, pero de momento es algo que no se ha considerado desde negocio ni desde el diseño de producto, sino para un futuro no determinado.

Así que vamos a lo nuestro.

### Empezando por lo más fácil

Una vez dentro de la historia, escoger la tarea para empezar ya es una cuestión de entender las posibles dependencias.

En este caso, una forma de cumplir la primera y la tercera es simplemente cambiar el mensaje que se muestra para indicar que se pulse la tecla P para jugar de nuevo y cualquier otra para salir. Así que nos vamos a `EndScene` y hacemos el cambio.

```python
import pygame

import pong.config
from pong.app.scene import Scene
from pong.app.window import Window


class EndScene(Scene):
    def __init__(self, window: Window):
        super().__init__(window)

    def run(self):
        self.window.score_board.winner(self)

        self.text_renderer.blit('Game finished', pong.config.style_end_title)
        self.text_renderer.blit('Press P to play again or any other key to exit', pong.config.style_prompt)

        pygame.display.flip()
        done = False
        while not done:
            for event in pygame.event.get():
                if event.type == pygame.KEYDOWN:
                    done = True

        return 0
```

Cuanto menos código escribimos mejor. Revisamos que queda bien. No hacemos commit en este caso porque el mensaje no correspondería con el comportamiento.

### Escuchar la pulsación de la letra P

Si analizamos el código, parece que la mejor manera de comunicar que queremos jugar otra vez es detectar la pulsación de la tecla P y salir de la Scene con un código distinto de 0. Típicamente se ponen números negativos en caso de error, por lo que tiene sentido devolver un código positivo, que podría ser cualquier número.

Por otro lado, en Window tenemos lo siguiente:

```python
import pygame


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
            error = scene.run()
            if error != 0:
                return error
        return 0

    def add_scene(self, scene):
        self.scenes.append(scene)
```

Ahora mismo, el método `run` ejecuta las Scenes en secuencia y cualquier valor que no sea 0 es considerado error y se sale del juego. Necesitamos cambiar esto para que nos de la oportunidad de volver a empezar o salir si queremos. Es decir, tendría sentido modificar el código para que sólo salga prematuramente con un código de error negativo y se el código de salida corresponde con el de "volver a jugar", se reinicie el juego desde el principio.

O sea, esta tarea en realidad contiene otras dos. Una para poder capturar la pulsación de la tecla P y otra para gestionar la ejecución del juego. Además, tendríamos que hacer primero este cambio para que la ejecución del juego no se rompa. Por tanto, haremos las subtareas de esta manera:

* Modificar `Window.run` Dar soporte a un código de respuesta que indique que se quiere volver a jugar.
* Capturar la pulsación de la tecla P en `EndScene`.

Para desarrollar esta parte vamos primero a los tests. Lo primero que observamos es que hay un test que verifica el comportamiento de error cuando el código es negativo. Así que nos viene bien para hacer un refactor:

```python
    def test_should_exit_with_error(self):
        window = Window(800, 600, 'Test')
        error_scene = Scene(window)
        with unittest.mock.patch.object(error_scene, 'run', wraps=error_scene.run, return_value=-1) as spy:
            window.add_scene(error_scene)
            self.assertEqual(-1, window.run())
```

De este modo podemos cambiar que aborte el programa sólo si salimos de una escena con un código de salida negativo:

```python
import pygame


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
            error = scene.run()
            if error < 0:
                return error
        return 0

    def add_scene(self, scene):
        self.scenes.append(scene)
```

Ahora, escribimos un tests que simule que tenemos una Scene que puede devolver un código positivo, que en este caso será el `1` y que sirve para indicar que queremos jugar de nuevo.

```python
    def test_should_allow_play_again(self):
        window = Window(800, 600, 'Test')
        play_again_scene = Scene(window)
        with unittest.mock.patch.object(play_again_scene, 'run', wraps=play_again_scene.run, side_effect=[1, 0]) as spy:
            window.add_scene(play_again_scene)
            self.assertEqual(0, window.run())
```

Este test nos permite que al llamar a `play_again_scene` dos veces cada una nos devuelva una respuesta diferente.

Sin embargo, el test pasa. Esto es porque una vez superado el bucle siempre vamos a devolver 0, que es lo que esperamos. Así que vamos a cambiar primero para que run devuelve el valor del error.

```python
import pygame


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
        error = 0
        for scene in self.scenes:
            error = scene.run()
            if error < 0:
                return error
        return error

    def add_scene(self, scene):
        self.scenes.append(scene)
```

Ahora el test no pasa, que es lo que necesitamos para forzar que `run` tenga que atender al código 1 y repetir toda el juego desde el principio, de modo que en la siguiente ejecución el mock fuerce el código 0 y el juego pueda acabar.

```python
import pygame


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
        error = 0
        for scene in self.scenes:
            error = scene.run()
            if error < 0:
                return error
        if error == 1:
            return self.run()
        return error

    def add_scene(self, scene):
        self.scenes.append(scene)
```

Con este cambio, el juego se puede repetir. Todavía no hay ninguna escena que pueda devolver un código de error `1`, pero podemos asegurarnos de que se puede seguir jugando como hasta ahora.

Este es un pequeño refactor que quizá aclara un poco el bucle de juego. Hacemos que en caso de error se fuerce la salida del bucle, hacemos algunos cambios de naming e resolvemos algunos números mágicos.

```python
import pygame


class Window(object):
    def __init__(self, width: int, height: int, title: str):
        self.width = width
        self.height = height
        self.title = title
        size = (self.width, self.height)
        self.screen = pygame.display.set_mode(size)
        pygame.display.set_caption(self.title)

        self.score_board = None
        self.PLAY_AGAIN = 1

        self.scenes = []

    def run(self):
        exit_code = 0
        for scene in self.scenes:
            exit_code = scene.run()
            if self.is_error(exit_code):
                break
        if exit_code == self.PLAY_AGAIN:
            return self.run()
        return exit_code

    def add_scene(self, scene):
        self.scenes.append(scene)

    @staticmethod
    def is_error(exit_code):
        return exit_code < 0
```

Ya sólo nos falta añadir soporte para salir con la tecla `P` de `EndScene`. Así que vamos a su test y añadimos este:

```python
    @unittest.mock.patch("pong.scoreboard.ScoreBoard")
    @unittest.mock.patch('pygame.event.get', return_value=[events.p_key_event])
    def test_should_ask_play_againg_when_pressing_p(self, score_board_mock, mock):
        window = pong.app.window.Window(800, 600, 'Test')
        window.score_board = score_board_mock
        scene = pong.scenes.endscene.EndScene(window)

        pygame.init()
        self.assertEqual(window.PLAY_AGAIN, scene.run())
        pygame.quit()
```

Previamente hemos añadido el evento correspondiente a la P en events.py:

```python
import pygame

quit_event = pygame.event.Event(pygame.QUIT)
any_key_event = pygame.event.Event(pygame.KEYDOWN, unicode="a", key=pygame.K_a, mod=pygame.KMOD_NONE)
p_key_event = pygame.event.Event(pygame.KEYDOWN, unicode="p", key=pygame.K_p, mod=pygame.KMOD_NONE)
```

El test falla, así que procedemos a implementarlo, pero no conseguimos resultados. Por algún motivo con nuestro enfoque actual no podemos llegar a saber qué tecla se ha pulsado. Después de consultar en la documentación de **pygame** y [en otras páginas](http://www.poketcode.com/en/pygame/keyboard/index.html), decidimos cambiar el método de obtención de los eventos y usamos `wait` en lugar del recorrer los eventos en `get`.

```python
import unittest.mock

import pygame

import pong.scenes.endscene
from pong.app.window import Window
from pong.tests import events


class EndSceneTestCase(unittest.TestCase):
    @unittest.mock.patch("pong.scoreboard.ScoreBoard")
    @unittest.mock.patch('pygame.event.wait', return_value=events.any_key_event)
    def test_should_run_fine(self, score_board_mock, mock):
        window = pong.app.window.Window(800, 600, 'Test')
        window.score_board = score_board_mock
        scene = pong.scenes.endscene.EndScene(window)

        pygame.init()
        self.assertEqual(0, scene.run())
        pygame.quit()

    @unittest.mock.patch("pong.scoreboard.ScoreBoard")
    @unittest.mock.patch('pygame.event.wait', return_value=events.p_key_event)
    def test_should_ask_play_againg_when_pressing_p(self, score_board_mock, mock):
        window = pong.app.window.Window(800, 600, 'Test')
        window.score_board = score_board_mock
        scene = pong.scenes.endscene.EndScene(window)

        pygame.init()
        self.assertEqual(window.PLAY_AGAIN, scene.run())
        pygame.quit()


if __name__ == '__main__':
    unittest.main()
```

Esta implementación nos permite pasar el test, pero es un poco sucia.

```python
import pygame

import pong.config
from pong.app.scene import Scene
from pong.app.window import Window


class EndScene(Scene):
    def __init__(self, window: Window):
        super().__init__(window)

    def run(self):
        self.window.score_board.winner(self)

        self.text_renderer.blit('Game finished', pong.config.style_end_title)
        self.text_renderer.blit('Press P to play again or any other key to exit', pong.config.style_prompt)

        pygame.display.flip()
        done = False
        while not done:
            event = pygame.event.wait()

            if event.type in (pygame.KEYDOWN, pygame.KEYUP):
                key_name = pygame.key.name(event.key)
                if key_name == "p":
                    return 1
                done = True

        return 0
```

Así que hacemos un refactor para dejarla más legible:

```python
import pygame

import pong.config
from pong.app.scene import Scene
from pong.app.window import Window


class EndScene(Scene):
    def __init__(self, window: Window):
        super().__init__(window)

    def run(self):
        self.window.score_board.winner(self)

        self.text_renderer.blit('Game finished', pong.config.style_end_title)
        self.text_renderer.blit('Press P to play again or any other key to exit', pong.config.style_prompt)

        pygame.display.flip()
        done = False
        exit_code = 0
        while not done:
            event = pygame.event.wait()

            if event.type in (pygame.KEYDOWN, pygame.KEYUP):
                key_name = pygame.key.name(event.key)
                if key_name == "p":
                    exit_code = self.window.PLAY_AGAIN
                done = True

        return exit_code
``` 

Con este refactor hecho, probamos el juego y vemos que por una parte funciona bien, pero por otra tenemos algunos problemas molestos. Por un lado, si hemos forzado la salida cerrando la ventana, algo que está soportado en la escena principal o bien mantenemos una tecla pulsada al acabar el juego, salimos sin parar en la pantalla de despedida. Por tanto, necesitamos alguna manera de poder detener eso, cancelar los eventos que pueda haber pendientes en la cola y esperar la acción de la jugadora.

Por el momento, la solución que se nos ocurre es borrar la cola de eventos y tener un pequeño delay:

```python
import pygame

import pong.config
from pong.app.scene import Scene
from pong.app.window import Window


class EndScene(Scene):
    def __init__(self, window: Window):
        super().__init__(window)

    def run(self):
        self.window.score_board.winner(self)

        self.text_renderer.blit('Game finished', pong.config.style_end_title)
        self.text_renderer.blit('Press P to play again or any other key to exit', pong.config.style_prompt)

        pygame.display.flip()
        done = False
        exit_code = 0

        pygame.event.clear()
        pygame.time.delay(1000)

        while not done:
            event = pygame.event.wait()
            if event.type in (pygame.KEYDOWN, pygame.KEYUP):
                key_name = pygame.key.name(event.key)
                if key_name == "p":
                    exit_code = self.window.PLAY_AGAIN
                done = True

        return exit_code
```

A fin de que los tests no tengan tiempo de espera, hacemos un doble del método delay:

```python
import unittest.mock

import pygame

import pong.scenes.endscene
from pong.app.window import Window
from pong.tests import events


class EndSceneTestCase(unittest.TestCase):
    @unittest.mock.patch("pong.scoreboard.ScoreBoard")
    @unittest.mock.patch('pygame.event.wait', return_value=events.any_key_event)
    @unittest.mock.patch('pygame.time.delay')
    def test_should_run_fine(self, score_board_mock, mock, time_mock):
        window = pong.app.window.Window(800, 600, 'Test')
        window.score_board = score_board_mock
        scene = pong.scenes.endscene.EndScene(window)

        pygame.init()
        self.assertEqual(0, scene.run())
        pygame.quit()

    @unittest.mock.patch("pong.scoreboard.ScoreBoard")
    @unittest.mock.patch('pygame.event.wait', return_value=events.p_key_event)
    @unittest.mock.patch('pygame.time.delay')
    def test_should_ask_play_againg_when_pressing_p(self, score_board_mock, mock, time_mock):
        window = pong.app.window.Window(800, 600, 'Test')
        window.score_board = score_board_mock
        scene = pong.scenes.endscene.EndScene(window)

        pygame.init()
        self.assertEqual(window.PLAY_AGAIN, scene.run())
        pygame.quit()


if __name__ == '__main__':
    unittest.main()
```

Y con esto, verificamos que pasan todos los tests y probamos el juego. Descubrimos que algunos tests necesitan un retoque para seguir pasando porque hemos cambiado el modo en que procesamos los eventos en las distintas escenas.

```python
import unittest.mock

from pong.app.app import App
from pong.tests import events


class AppTestCase(unittest.TestCase):
    @unittest.mock.patch('pygame.event.get', return_value=[events.any_key_event, events.quit_event])
    @unittest.mock.patch('pygame.event.wait', return_value=events.any_key_event)
    @unittest.mock.patch('pygame.time.delay')
    def test_app_ran_fine(self, get_mock, wait_mock, time_mock):
        app = App()
        self.assertEqual(0, app.run())


if __name__ == '__main__':
    unittest.main()
```

Una vez que todos los tests pasan sin intervención y vemos que la pantalla de despedida es accionable, ya tenemos suficiente para entregar la historia. Es verdad que este último cambio en la forma de procesar los eventos nos hace pensar si podría ser mejor utilizar esta estrategia `event.wait` en lugar de `event.get` para normalizar la forma en que se accede a los eventos.

En un entorno de entrega continua creo que haría `commit` de la feature y haría un pequeño *spike* de código al completar el sprint, si me sobra tiempo, para saber si el cambio es viable. Al haber entregado ya la historia los usuarios pueden beneficiarse de ella y empezar a proporcionar feedback. 

También podría hacer el *spike* en este momento si valoro que todavía estoy dentro de la estimación de la historia, es decir, que me haya llevado menos tiempo del previsto. Pero esto es algo que creo que haría sólo si veo que me queda un tiempo "muerto" al final del día y prefiero dejar el abordaje de la próxima historia para el día siguiente, en que puedo cambiar más fácilmente de foco.

Pero como normal general, tenemos que priorizar las historias del sprint y dejar estas mejoras técnicas para el final o para una historia que nos proporcione la oportunidad de tocar ese punto que nos gustaría arreglar. Si es realmente importante, acabaremos volviendo sobre él.

En todo caso, es el momento de [hacer `commit` y entregar la `feature`](https://github.com/franiglesias/japong/commit/745344660ee6c62de2d0ec32f5cb1648bdc7c529), poniéndola en **Done** en el `backlog`.
