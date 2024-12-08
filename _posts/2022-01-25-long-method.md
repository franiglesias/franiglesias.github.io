---
layout: post
title: Métodos largos
categories: articles
tags: design-principles refactoring
---

No hace mucho dejé caer en twitter que tener métodos de más de 10 líneas me parecía un smell. Por supuesto se levantó cierta polémica y hubo algunas respuestas a favor y en contra.

En este artículo intentaré explicar mi postura con detalle. Por supuesto, esto no es una prescripción. La longitud de diez líneas es un límite arbitrario que remite a la idea de que los métodos o funciones largas pueden ser problemáticos para la comprensión del código y su mantenimiento. Distintas personas sitúan este límite en una cifra diferente, que parece oscilar entre las 5 y las 200 líneas. Este gran abanico da una idea de lo controvertida que puede ser cualquier opinión al respecto.

## ¿Que número de líneas por método se recomienda?

Así, por ejemplo, en el libro [Five lines of code](https://www.manning.com/books/five-lines-of-code) Christian Clausen propone criterio de cinco líneas como máximo. [En este artículo, Jim Bird](https://dzone.com/articles/rule-30-–-when-method-class-or) sugiere una "regla de 30", tras comentar propuestas de varios autores como Steve McConnell, autor de [Code Complete](https://www.amazon.es/dp/0735619670/ref=cm_sw_em_r_mt_dp_503FNJAJM3WXFA5N1BEH), que, a su vez, cita estudios que ponen los límites entre 65 y 200 líneas.

Una regla práctica que se suele mencionar es de la cantidad de código que cabe en una pantalla. Sin embargo, hoy por hoy esto es bastante relativo gracias a las posibilidades de personalización de los editores o incluso de los monitores disponibles. Puedes hacer caber en una pantalla casi cualquier cantidad de código y que sea legible. En ese sentido, yo trabajo habitualmente con cuerpos de letra grandes (18 puntos) en monitores HD (1080 pixels en vertical), así que un punto para los métodos pequeños en mi _setup_ particular.

En resumen: no existe una opinión generalizada.

## ¿De qué hablamos en realidad?

La cuestión en juego no es ciertamente el número de líneas que contiene un método o función. Parafraseando a Gandalf: "un método no es ni largo ni corto, tiene exactamente el número de líneas que necesita". La cantidad de líneas de código en sí misma es una medida que no dice absolutamente nada. Como ocurre con cualquier otra métrica, necesita un contexto y un significado. Y este contexto al que me refiero es cuán fácil es comprender y mantener un método o función.

Lo cierto es que el número de líneas de código podría ser un buen predictor de la necesidad de partir un método largo mediante el uso del refactor _extract method_, junto con ciertas métricas de cohesión, [como señala este estudio](http://www.cs.rug.nl/~paris/papers/PROMISE15.pdf).

El motivo es que a medida que aumentan las líneas de código disminuye su cohesión. Además, es más probable que se estén mezclando niveles de abstracción. Pero, ¿qué queremos decir con esto?

### Cohesión

Empecemos por la cohesión. Una forma de entender la cohesión es el grado en que cada elemento que forma parte de una unidad, contribuye a su propósito. Podemos aplicarlo a los componentes de un módulo, pero también en las líneas que componen un método o función. De este modo, las funciones serán tanto más cohesivas cuando todas sus líneas contribuyen a su propósito y no es posible eliminar ninguna.

Se han propuesto [muchas medidas de cohesión](https://www.aivosto.com/project/help/pm-oo-cohesion.html) que con frecuencia se basan en la medida en que variables y otros elementos son compartidos, o no, por un grupo de líneas. Se puede extraer de aquí que cuantas más líneas tenga una función, más probable es que no incluyan las mismas variables o llamadas. Consecuentemente: cuanto mayor es la longitud de un código, más probable es que se esté ocupando de cosas distintas. Si bien, todas las líneas estarían contribuyendo al propósito de la función, lo habitual es que ciertos grupos estén atendiendo a distintas partes de ese propósito.

Todas las líneas contribuyen, pero es posible agruparlas entre sí basándose en su cohesión mutua.

### Niveles de abstracción

Esto nos lleva al problema de los llamados niveles de abstracción. Una forma de enfocarlo es precisamente a partir de la cohesión. Si podemos identificar grupos de líneas de código que son cohesivas entre sí, podríamos aislar la parte del propósito de la función a la que contribuyen. Esta parte puede ser un concepto, una parte del proceso, etc., que se podría aislar componiendo una unidad de significado de orden superior. Esta unidad sería una abstracción.

Cualquier función se escribe utilizando un lenguaje de programación. En sí misma, una función es una abstracción de un concepto que se expresa mediante el nombre de la función y se compone de líneas de código del lenguaje en cuestión. Las funciones nos permiten reutilizar el mismo bloque de código en diferentes partes del programa. Además, proporcionan un significado a ese bloque de código: nos dicen qué hace, qué significa en el contexto del programa. Al fin y al cabo, el número de símbolos que ofrece el lenguaje de programación es limitado. Es posible construir cualquier mensaje, pero este mensaje tiene distintos niveles de codificación.

Podemos tomar como ejemplo el lenguaje humano escrito. Las palabras se componen de letras. Por sí mismas, las letras no tienen un significado. Unidas forman palabras, las cuales sí tienen significado. Pero las palabras por sí solas no transmiten mensajes completos. Se combinan en forma de frases u oraciones, que sí tienen significado completo. Por otro lado, se pueden componer mensajes complejos combinando un número indefinido de oraciones. Este artículo contiene letras, palabras y oraciones, que expresan un mensaje complejo. El artículo mismo tiene un título que nos permite entender de qué trata y, por tanto, es una unidad de significado. De muy alto nivel, eso sí. Para entenderlo en su totalidad tenemos que leer las oraciones, que hilan un determinado discurso. De hecho, el artículo se divide en párrafos que son grupos de oraciones que contribuyen a explicar una idea.

Estos son los distintos niveles de significado del texto. Es necesario procesar todos, pero en la práctica trabajamos con las unidades de mayor nivel. No necesitamos ir letra por letra, de hecho no necesitamos proceder palabra por palabra. Como lectoras expertas leemos las frases, es decir, trabajamos con unidades de un cierto nivel de abstracción que aporta un significado completo.

## Cohesión vs. acoplamiento en métodos largos

Aquí tenemos un método de unas 77 líneas, extraído de un juego de ping-pong. En este fragmento ocurren varias cosas:

* Se preparan los diversos elementos del juego
* Se vinculan entre sí aquellos que lo necesitan
* Contiene el bucle del juego, dentro del cual:
  * Se gestionan los eventos
  * Se actualiza la pantalla
  * Se gestionan las reglas del juego (final de parciales y de la partida)
  
```python
    def run(self):
        ball = Ball(yellow, 10)
        all_sprites = Group()
        borders = Group()
        pads = Group()
        goals = Group()
        
        self.game.game_mode.bind_ball(ball)
        player_one = self.game.player_one()
        player_two = self.game.player_two()

        all_sprites.add(Net())
        all_sprites.add(ball)

        self.score_manager.register_players(player_one, player_two)

        borders.add(Border(0))
        borders.add(Border(590))
        border: Border
        for border in borders:
            border.bind_ball(ball)
            all_sprites.add(border)
        player_one.pad.borders = borders
        player_two.pad.borders = borders

        goals.add(player_one.goal)
        goals.add(player_two.goal)
        
        pads.add(player_one.pad)
        pads.add(player_two.pad)

        goal: Goal
        for goal in goals:
            goal.bind_ball(ball)
            all_sprites.add(goal)

        pad: Pad
        for pad in pads:
            pad.bind_ball(ball)
            all_sprites.add(pad)

        # Game loop
        clock = Clock()
        pygame.time.set_timer(COMPUTER_MOVES_EVENT, COMPUTER_MOVES_TIMER_MS)
        end_of_match = False

        while not end_of_match:
            end_of_set = False
            while not end_of_set:
                for event in pygame.event.get():
                    if event.type == pygame.QUIT:
                        end_of_match = True
                        break
                    player_one.handle(event)
                    player_two.handle(event)

                pygame.event.pump()
                all_sprites.update()

                # Game draw
                self.window.screen.fill(green)
                self.score_board.draw(self)
                all_sprites.draw(self.window.screen)

                # Screen update
                pygame.display.flip()

                if self.score_manager.end_of_set():
                    end_of_set = True
                    self.score_manager.end_set()
                    self.score_manager.new_set()

                    if self.score_manager.end_of_game():
                        end_of_match = True

                clock.tick(FPS)
        return ExitCode.success()
```

Se puede argumentar que no es demasiado confuso. Es decir, es un fragmento largo para mi estándar personal, pero resulta aceptable para muchas personas. Veamos qué hay dentro.

En la primera línea se define la variable `ball`, que se usa en numerosas partes de este bloque. Sin embargo, no aparece en el bloque bajo el comentario `Game loop`. En realidad esto ocurre con todas las variables definidas, excepto `player_one`, `player_two` y `all_sprites`.

La variable `all_sprites` es una colección de los sprites o elementos del juego que se muestran en la pantalla. En cada una de las partes del código hace una cosa distinta: en la primera parte recolecta todos los sprites que se generan y en la segunda los muestra.

Por otro lado, las variables que almacenan los jugadores tienen un proceso parecido: se crean y se configuran en la primera parte, mientras que se necesitan en la segunda para que gestionen los eventos que los controlan.

El resto de variables que se inicializan en el primer bloque no tienen referencias en el segundo.

Al margen de que estén separados por un comentario, está bastante claro que tenemos dos grandes bloques cohesivos, aunque no al 100%: un bloque de preparación de elementos del juego y el bucle del juego en sí. En resumidas cuentas: este método está haciendo, al menos, dos cosas.

La cohesión del método es relativamente baja, puesto que entre ambos bloques se comparten pocos elementos. El primer bloque prepara los elementos que necesita el segundo. De hecho, si separásemos los dos bloques podríamos aumentar al máximo la cohesión del método `run`, reduciéndolo a dos líneas que explican exactamente lo que pasa sin revelar los detalles.

```python
    def run(self):
        all_sprites, player_one, player_two = self.prepare_game()

        return self.game_loop(all_sprites, player_one, player_two)
```

En otras palabras, hemos revelado el primer nivel de abstracción, que consta de dos acciones: preparar los elementos del juego y ejecutar el bucle de juego.

El hecho de que el método `prepare_game` devuelva tres resultados resulta molesto porque no son cohesivos. Me explico: `player_one` y `player_two` se pueden agrupar claramente: son los contendientes de la partida, mientras que `all_sprites` es un constructo técnico que necesitamos para poder visualizar los elementos en pantalla. Se podría decir que `player_one` y `player_two` son elementos del dominio y que `all_sprites` es de infraestructura.

Esto empieza a oler a problemas de diseño. Se estarían mezclando responsabilidades del dominio del juego con responsabilidades de su presentación.

Esto estaría ocurriendo en `prepare_game`, por ejemplo. La cuestión es si podríamos separarlas. He aquí el método `prepare_game` tal y como ha quedado tras esta primera extracción:

```python
    def prepare_game(self):
        ball = Ball(yellow, 10)
        all_sprites = Group()
        borders = Group()
        pads = Group()
        goals = Group()
        self.game.game_mode.bind_ball(ball)
        player_one = self.game.player_one()
        player_two = self.game.player_two()
        all_sprites.add(Net())
        all_sprites.add(ball)
        self.score_manager.register_players(player_one, player_two)
        borders.add(Border(0))
        borders.add(Border(590))
        border: Border
        for border in borders:
            border.bind_ball(ball)
            all_sprites.add(border)
        player_one.pad.borders = borders
        player_two.pad.borders = borders
        goals.add(player_one.goal)
        goals.add(player_two.goal)
        pads.add(player_one.pad)
        pads.add(player_two.pad)
        goal: Goal
        for goal in goals:
            goal.bind_ball(ball)
            all_sprites.add(goal)
        pad: Pad
        for pad in pads:
            pad.bind_ball(ball)
            all_sprites.add(pad)
        return all_sprites, player_one, player_two
```

Lo primero que voy a intentar es agrupar lo más posible las líneas maximizando grupos cohesivos. Algo así:

```python
def prepare_game(self):
    ball = Ball(yellow, 10)
    self.game.game_mode.bind_ball(ball)
  
    player_one = self.game.player_one()
    player_two = self.game.player_two()
    self.score_manager.register_players(player_one, player_two)
  
    borders = Group()
    borders.add(Border(0))
    borders.add(Border(590))
    player_one.pad.borders = borders
    player_two.pad.borders = borders
  
    goals = Group()
    goals.add(player_one.goal)
    goals.add(player_two.goal)
  
    pads = Group()
    pads.add(player_one.pad)
    pads.add(player_two.pad)
  
    all_sprites = Group()
    all_sprites.add(Net())
    all_sprites.add(ball)
  
    border: Border
    for border in borders:
      border.bind_ball(ball)
      all_sprites.add(border)
  
    goal: Goal
    for goal in goals:
      goal.bind_ball(ball)
      all_sprites.add(goal)
  
    pad: Pad
    for pad in pads:
      pad.bind_ball(ball)
      all_sprites.add(pad)
  
    return all_sprites, player_one, player_two
```

En este primer intento puedo ver que más que cohesion, lo que hay es un alto acoplamiento. Así, por ejemplo, no puedo aislar el grupo de líneas que construyen la colección `all_sprites`, porque están entrelazadas con las líneas es las que se vincula `ball` con los objetos que tienen que interactuar con ella. Una posibilidad es usar `ball` y `all_sprites` como criterio de cohesión, aunque eso me lleve a más cantidad de código por el momento. Veamos un ejemplo:

```python
def prepare_game(self):
    ball = Ball(yellow, 10)
    self.game.game_mode.bind_ball(ball)

    player_one = self.game.player_one()
    player_two = self.game.player_two()
    self.score_manager.register_players(player_one, player_two)

    borders = Group()
    borders.add(Border(0))
    borders.add(Border(590))
    player_one.pad.borders = borders
    player_two.pad.borders = borders

    goals = Group()
    goals.add(player_one.goal)
    goals.add(player_two.goal)

    pads = Group()
    pads.add(player_one.pad)
    pads.add(player_two.pad)

    border: Border
    for border in borders:
        border.bind_ball(ball)

    goal: Goal
    for goal in goals:
        goal.bind_ball(ball)

    pad: Pad
    for pad in pads:
        pad.bind_ball(ball)

    all_sprites = Group()
    all_sprites.add(Net())
    all_sprites.add(ball)

    border: Border
    for border in borders:
        all_sprites.add(border)

    goal: Goal
    for goal in goals:
        all_sprites.add(goal)

    pad: Pad
    for pad in pads:
        all_sprites.add(pad)

    return all_sprites, player_one, player_two
```

El cambio es interesante y muestra la posibilidad de extraer un método para gestionar la colección de todos los sprites, aunque tendríamos que pasarle cuatro parámetros, que empieza a ser un poco excesivo. Sin embargo, podría funcionar. Desde luego, desde el punto de vista semántico, tiene sentido: un método para coleccionar todos los sprites del juego. Método que, por otra parte, no tiene dependencias de la clase que lo contiene, pudiendo definirse estático o extraerse como función. Incluso nos podría estar advirtiendo de la posible existencia de otro objeto.

```python
    def prepare_game(self):
        ball = Ball(yellow, 10)
        self.game.game_mode.bind_ball(ball)

        player_one = self.game.player_one()
        player_two = self.game.player_two()
        self.score_manager.register_players(player_one, player_two)

        borders = Group()
        borders.add(Border(0))
        borders.add(Border(590))
        player_one.pad.borders = borders
        player_two.pad.borders = borders

        goals = Group()
        goals.add(player_one.goal)
        goals.add(player_two.goal)

        pads = Group()
        pads.add(player_one.pad)
        pads.add(player_two.pad)

        border: Border
        for border in borders:
            border.bind_ball(ball)

        goal: Goal
        for goal in goals:
            goal.bind_ball(ball)

        pad: Pad
        for pad in pads:
            pad.bind_ball(ball)

        all_sprites = self.collect_sprites(ball, borders, goals, pads)

        return all_sprites, player_one, player_two

    def collect_sprites(self, ball, borders, goals, pads):
        all_sprites = Group()
        all_sprites.add(Net())
        all_sprites.add(ball)
        border: Border
        for border in borders:
            all_sprites.add(border)
        goal: Goal
        for goal in goals:
            all_sprites.add(goal)
        pad: Pad
        for pad in pads:
            all_sprites.add(pad)
        return all_sprites
```

Por desgracia, la parte de preparación de los elementos nos revela más problemas con el acoplamiento. Las características de python nos permiten acceder alegremente a propiedades de los objetos, lo que en este ejemplo concreto hace que algunos objetos inicialicen objetos que les pertenecen, pero que pueden ser gestionados por otros. Así, por ejemplo, cada Player tiene su Pad, pero los Pad interactúan con otros objetos fuera de Player. Por lo tanto, tendría sentido que estos objetos se creen de forma independiente y se inyecten en donde sea necesario.

En este caso, los problemas que tenemos para hacer cohesivo el código de este método revelan posibles defectos de diseño. Pero tenemos que entender cómo se construye `Player` y sus relaciones. Vemos que se mezclan cuestiones de reglas de juego con aspectos de la presentación:

```python
from field.goal import Goal
from game.pad import Pad
from game.score import Score


class Player:
    def __init__(self, name, side, engine, speed=1):
        self.name = name
        self.score = Score()
        self.engine = engine
        self.side = side
        self.pad = Pad(side, speed, self.engine)
        self.goal = Goal(side.goal(), self)

    def win_point(self):
        self.score.win_point()

    def handle(self, event):
        self.pad.handle(event)

    def points(self):
        return self.score.points()

    def partials(self):
        return self.score.partials()

    def new_set(self):
        self.score.new_set()

    def win_set(self):
        self.score.win_set()

    def sets(self):
        return self.score.sets()

    def beats(self, other):
        return self.points() > other.points()

```

Como podemos ver, `Player`, `Pad` y `Goal` están bastante acoplados. Para ser precisos, lo están a través de `side`, que es un parámetro requerido para configurarlos. Este código tiene muchos problemas de este tipo, porque no se está usando bien OOP y no se están respetando algunos de sus principios.

De hecho, si indagamos en el código, `Player` se obtiene a partir de `Game` que, a su vez, delega en `GameMode`, que actúa como una factoría de Player. Todo está muy mezclado en este código.

```python
from config import game_mode
from config import human_side
from game.game_mode import GameMode, TwoPlayers, OnePlayer
from game.side import Side, Right, Left


class Game(object):
    game_mode: GameMode

    def __init__(self):
        self.side_preference = Side.from_raw(human_side)
        self.game_mode = GameMode.from_raw(game_mode)

    def prefer_right(self):
        self.side_preference = Right()

    def prefer_left(self):
        self.side_preference = Left()

    def prefer_two_players(self):
        self.game_mode = TwoPlayers()

    def prefer_one_player(self):
        self.game_mode = OnePlayer()

    def player_one(self):
        return self.game_mode.player_one()

    def player_two(self):
        return self.game_mode.player_two()
```

Resolver los problemas que tiene el código de este juego de ping-pong va más allá de los objetivos de este artículo, pero creo que refleja bien que los métodos largos pueden ser consecuencia de otros problemas de diseño más profundos. En este caso, una de las razones por las que el método es demasiado largo es que hay decisiones de diseño en otras partes que nos obligan a escribir un método muy largo... porque no se puede hacer más corto.

El método puede parecer altamente cohesivo, como en este ejemplo, ya que algunas variables intervienen en casi todas las líneas o a lo largo de todo el cuerpo del método. Sin embargo, eso mismo podría estar revelando acoplamiento en lugar de cohesión. Por esa razón, los métodos largos se deberían considerar un _smell_ incluso aunque muestren una buena cohesión.
