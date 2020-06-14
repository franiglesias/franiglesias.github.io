---
layout: post
title: Pong en Python. Desarrollo ágil
categories: articles
tags: python good-practices
---

Agile debería ser una forma de pensar, un *mindset*, no una metodología de gestión de proyectos.

El [Manifiesto agile](https://agilemanifesto.org) surgió para reivindicar un cambio en los modelos tradicionales de desarrollo de los proyectos de software. No voy a entrar en la discusión de "en qué se ha convertido *agile*". El objetivo de este artículo es intentar mostrar cómo introducir una forma de trabajar de buen/alto rendimiento en un proyecto, pero de una forma un poco más sistemática.

Hasta ahora, hemos trabajado en nuestro **Pong!** de varias formas:

En su primer momento se desarrolló como un prototipo, con intención exploratoria. Con este tipo de enfoque se pretende verificar una hipótesis de negocio, pero también una hipótesis técnica: ¿Es posible desarrollar un producto que responda a esta demanda? ¿Podemos tener rápidamente un Producto Mínimo Viable con el que empezar a obtener feedback de los usuarios potenciales?

En una segunda fase, lo afrontamos como actualización o modernización de un proyecto *legacy*. El prototipo no era sólo funcional, sino que la tecnología escogida nos parecía adecuada para usarla en el producto final, pero requería una actualización que le permitiese escalar y añadir nuevas funcionalidades con una velocidad razonable. Hemos dedicado varias iteraciones a mejorar algunos de esos aspectos. Por un lado, hemos conseguido no atascar el desarrollo, entregando mejoras en ciclos cortos. Pero por otro lado, la dirección es un poco caótica porque tendemos a centrarnos en mejoras técnicas que no suponen entrega de valor al usuario.

Así que, en este punto, me gustaría introducir algunas ideas sobre cómo compaginar avances en ambos aspectos del producto: acercarnos a la excelencia técnica mientras aportamos valor en cada iteración. Para esto siempre recomiendo el librito de Ron Jeffreys "The Nature of Software Development". Las ideas que veremos a continuación están extraídas de aquí, junto con algunas aportaciones de mi experiencia en un equipo de propósito con mentalidad ágil.

Hagamos una digresión...

## Cómo trabajar con alto rendimiento

### Qué opinan los usuarios de nuestro juego

En este punto una buena Product Owner, o Product Manager, con la ayuda de la Analista de Negocio, tendría datos sobre las opiniones de usuarios y *stakeholders*, en general: todas las personas interesadas de un modo u otro en el producto. Por ejemplo, en nuestro caso, una vez que hemos actualizado la mecánica del juego, podrían haber tenido las siguientes observaciones:

* Echan de menos la red, o una línea que separe el terreno de juego
* La mecánica del juego ha mejorado con los efectos, pero es demasiado fácil ganarle al ordenador, por lo que resulta aburrido a la larga
* No pueden jugar dos personas, estaría bien poder tener esa opción, incluso poder escoger el campo si es una sola jugadora
* Podría haber niveles de dificultad
* Juego de dobles
* El rebote de la pelota es feo, ¿se podría mejorar?
* Un sistema de puntuación parecido al del tenis de mesa real, con 3 ó 5 sets a 21 puntos con dos puntos de diferencia para el ganador
* Al lograr un tanto podría haber un efecto de sonido diferente
* Cuando se acaba el juego se sale de la aplicación, estaría bien poder volver a jugar

Son unas cuantas prestaciones nuevas para ser un juego bastante pequeño. Esta lista necesita algunos arreglos para que sea útil. Necesitamos convertir estas ideas y propuestas en **Historias de Usuario** que puedan ser valoradas y ejecutadas por el equipo de desarrollo.

### El backlog

En primer lugar, necesita una cierta uniformidad y especificidad en la redacción de cada ítem. Algunos ítems describen más un problema o limitación que una descripción de qué es lo que se desea tener. En otros casos se enuncia la prestación deseeada, pero no se detalla. Por último, en otras la descripción es razonablemente definida y específica. Esto es más o menos lo que queremos conseguir, que cada una de las peticiones sea lo bastante concreta y descriptiva.

He aquí la lista, reescrita. Esto es lo que llamaríamos un **Backlog de producto**. En el backlog se van anotando todas las necesidades que deberíamos atender a medida que surjan.

* Mostrar la línea divisoria del campo de juego
* El jugador manejado por el ordenador es más hábil para que sea más difícil ganarle
* Opcionalmente, Pueden jugar dos personas, controlando cada raqueta
* Al jugar contra el ordenador se puede escoger el lado de la mesa
* El nivel de dificultad del juego puede ser seleccionado
* Se puede jugar en modalidad dobles
* El efecto de rebote de la pelota es más realista
* La partida se puede configurar para 3 ó 5 sets a 21 puntos con dos puntos de diferencia para el ganador
* Efecto de sonido diferenciado cuando se hace un tanto
* Permitir jugar una nueva partida al acabar

### Determinar el valor y priorizar

En segundo lugar, necesita un orden. ¿Cuál de estas peticiones puede aportar más valor a las personas interesadas? En el caso de un juego, el valor podría medirse preguntando: ¿Cuál de estas prestaciones puede hacer que los jugadores pasen más tiempo en el juego? El valor de una prestación es variable. En un momento dado de la historia del proyecto, una prestación puede ser muy valiosa y dejar de serlo tanto en otro momento. Así que eso requiere una organización. La tarea de la figura de Product Owner es, precisamente, priorizar las peticiones según las necesidades del negocio.

Por otro lado, lo ideal es que las historias no tengan dependencias entre sí. Deberían poder realizarse en paralelo aunque esto no es lo deseable como veremos más adelante. Sin embargo, no siempre es posible y unas historias pueden ser necesarias para poder conseguir otras. En estos casos, la prioridad viene determinada por esa dependencia.

Lo que sigue es un ejemplo de **Backlog priorizado**. Aquí aparecen las mismas peticiones que antes, ordenadas en función de su importancia para negocio. En este caso, se ha usado como objetivo aumentar el interés en el juego, subiendo la dificultad y dando más opciones. Obviamente, este orden es discutible. Es tarea de Product Owner obtener información de todas las partes interesadas para definir qué es lo más prioritario en cada momento.

* El jugador manejado por el ordenador es más hábil para que sea más difícil ganarle
* Opcionalmente, Pueden jugar dos personas, controlando cada raqueta
* Permitir jugar una nueva partida al acabar
* Al jugar contra el ordenador se puede escoger el lado de la mesa
* La partida se puede configurar para 3 ó 5 sets a 21 puntos con dos puntos de diferencia para el ganador
* El nivel de dificultad del juego puede ser seleccionado
* Mostrar la línea divisoria del campo de juego
* El efecto de rebote de la pelota es más realista
* Efecto de sonido diferenciado cuando se hace un tanto
* Se puede jugar en modalidad dobles (se necesita más información)

### El coste del desarrollo

En tercer lugar, necesitamos saber el coste de conseguir estas prestaciones. Por eso es importante que estén bien definidas, de modo que podamos hacernos una idea de qué será necesario hacer para conseguirlas. Con frecuencia aquí se hace un proceso de estimación en base a una unidad de medida arbitraria llamada "puntos de historia". Claro que [Estimar es timar](https://medium.com/coding-stones/estimar-es-timar-example-mapping-e9dbad471ced).

Estimar el coste de realizar las tareas o historias de usuario no es fácil. En primer lugar no tenemos una forma general de valorar este coste: ¿horas de trabajo? ¿Cantidad de líneas de código? ¿Puntos de historia? [¿Alguien sabe qué representan los puntos de historia?](https://franiglesias.github.io/blogtober19-estimate/)

¿Para qué sirve saber esta estimación? Para dos cosas, fundamentalmente:

* Para ayudar a priorizar las historias. Cuando dos historias puede aportar un valor semejante, la Product Owner podría optar por priorizar la de menos coste, porque la relación entre valor y coste es más favorable, con lo que entrega valor antes, ganando tiempo para la historia de más coste. O bien puede hacer a la inversa, y priorizar la de más coste, de modo que aunque se tarde más en entregar el valor de esa historia, las siguientes lo irán haciendo rápidamente.
* Para predecir la entrega de valor al final de la iteración actual. La idea básica de estimar el coste de las historias es tratar de definir un compromiso de entrega viable al final de la iteración o sprint. De este modo, podemos coordinar acciones entre distintos equipos en una empresa, establecer objetivos globales y, en general, tener una idea de dónde estamos y dónde deberíamos estar.

Sin embargo, diría que no hay que obsesionarse por los detalles de la estimación. Cada equipo tiene que encontrar su forma de medir esto, del mismo modo que los equipos de negocio pueden determinar el valor que tiene para ellos cada historia.

Un ejemplo de forma de puntuar o valorar historias podría ser algo así (basado únicamente en mi experiencia personal):

* **1 punto.** Podemos tener esta historia en producción en una mañana o una tarde.
* **2 puntos.** Podemos tener esta historia en producción en un día de trabajo. Si empiezo hoy mañana a primera hora la puedo tener en producción.
* **3 puntos.** Podemos tener esta historia en producción en media semana laboral. Entre dos y tres días.
* **4 puntos.** Necesitaremos alrededor de una semana para ponerla en producción, pero podría ser más porque hay una incertidumbre alta sobre los detalles (técnicos y de negocio) por lo que necesitamos investigar, validar hipótesis, realizar algún refactor preparatorio, etc. 
* **5 puntos.** O bien la tarea es muy grande y puede requerir toda la iteración, o bien la incertidumbre es muy grande y requiere mucha investigación. Es muy posible que la historia necesite ser partida en otras más pequeñas o introducir historias de investigación que no generan valor por sí mismas, pero que nos capacitan para poder hacerlo.

Esta escala es bastante simular a la que hemos usado en equipos en los que he estado. Con el tiempo, hemos dejado de usar escalas y estimaciones explícitas. A partir de un cierto momento hemos comenzado a planificar las iteraciones comprometiéndonos a poner en producción una cierta cantidad de historias en el plazo de la iteración. Si nos hemos quedado cortos y nos sobra tiempo, vamos al **Backlog priorizado** en busca de nuevas historias.

### Momentos para valorar

En los equipos en los que he estado solíamos realizar un **Refinamiento del backlog** a mitad de cada sprint para preparar el siguiente. Básicamente consistía en que la **Product Owner** propone una serie de historias para encabezar el **Backlog priorizado** de tareas pendientes y el equipo analiza su coste técnico. Con eso se corrige la priorización.

Por otra parte, al inicio de cada iteración o sprint, se lleva a cabo una **Planificación**, en la que se asume el compromiso de realizar un cierto número de historias de ese **Backlog priorizado** ya *refinado*.

Estas reuniones no deberían alargarse más allá de una hora, porque no se trata de desarrollar la feature en detalle. Lo más importante en ellas es hacer preguntas sobre todos los puntos que no quedan claros y, con ello, disminuir la incertidumbre todo lo posible.

Aparte de esos momentos, lo ideal sería que todo el equipo estudio el **backlog** y deje anotaciones en las historias con dudas, pistas para trabajar y cualquier información que pueda contribuir a definirlas.

### ¿Y cómo introducir mejoras técnicas?

Personalmente no soy partidario de incluir historias técnicas en el Backlog si no contribuyen a la aportación de valor. En su lugar, mi enfoque se orienta a aprovechar las oportunidades de mejora que nos ofrezcan las historias. Fuera de eso, sí que es cierto que aprovecho los tiempos que sobran durante los *sprints* para tratar de introducir mejoras en áreas como testing, refactor de algunos puntos, etc, siempre que puedan ser bastante acotadas.

Esto es, al empezar a trabajar en una nueva historia examinamos el terreno y vamos introduciendo mejoras en el uso del lenguaje ubicuo, en la organización de código, detección de patrones, testing, etc, de forma que, paralelamente a la entrega de valor, mejoramos la calidad del código.

### ¿Cómo se reparte las historias el equipo?

La respuesta está aquí: [Deliveritis aguda](https://www.youtube.com/watch?v=vGCowJY5QCQ). En pocas palabras: todo el equipo trabaja en la primera historia, que sería la que aporta más valor, salvo que se estorben. En este caso, la parte del equipo que no puede participar en la primera, se pone con la segunda y así sucesivamente. 

Beneficios: mayor potencia de desarrollo en cada historia, difusión del conocimiento técnico y de negocio entre todo el equipo, reduciendo el *bus factor* (el conocimiento que pierde el equipo si uno de sus miembros desapareciese de repente, por ejemplo, atropellado por un autobús).

Dificultades: si las tareas de la historia son muy específicas de un perfil (por ejemplo, backend), puede que otros perfiles no puedan aportar tanto. Esto depende de que se puedan hacer *slices* transversales en las historias de usuario. Dicho de otra manera, depende que las tareas técnicas puedan abarcar todos los perfiles del equipo, algo que no siempre es posible.

.. y es hora de ir terminando con la digresión. Volvamos al Pong!

## Volvamos al Pong! de manera ágil

La primera historia, la que negocio considera la más prioritaria es:

* El jugador manejado por el ordenador es más hábil para que sea más difícil ganarle

En principio no tiene mucho coste. Se trata del método `Pad.follow(ball)`. Este método no tiene tests todavía, así que lo suyo sería caracterizarlo con un test y modificarlo. Por otro lado, sabemos que hay interés en que esto sea configurable, así que veremos qué podemos hacer para allanar el camino de esa futura historia refactorizando el método.

El mecanismo de torpeza o *clumsiness* consiste en obtener un valor aleatorio entre 0 y 10. Si resulta se mayor que cinco, el pad no se mueve. Eso nos indica cómo controlar la "habilidad" del jugador controlado por ordenador. Si el límite es muy alto, el pad se parará pocas veces y responderá casi todas las bolas. Si el límite es muy bajo, el pad llegará tarde casi siempre. 

Pues haciendo un stub de la función `random.randint` para que devuelva los valores extremos que nos interesa.

```python
    def follow(self, the_ball: pong.ball.Ball):
        if random.randint(0, 10) > 5:
            self.stop()
            return
        if the_ball.rect.y > self.rect.y:
            self.down()
        if the_ball.rect.y < self.rect.y:
            self.up()
```

El método se basa en calcular hacia dónde tiene que ir el pad, comparando su posición con la de la bola. Para que no lo haga de forma perfecta introducimos un factor aleatorio de "torpeza" que hace que no se mueva el pad. Podemos simplemente reducirlo. Pero, ¿cómo testeamos esto al haber un random?

```python

    @unittest.mock.patch('random.randint')
    def test_should_follow_ball(self, clumsy):
        clumsy.return_value = 1
        ball = pong.ball.Ball((100, 100, 100), 10)
        pad = pong.pad.Pad('left')

        ball.rect.y = 100
        pad.rect.y = 50

        pad.follow(ball)

        self.assertEqual(1, pad.dy)

    @unittest.mock.patch('random.randint')
    def test_should_not_follow_ball(self, clumsy):
        clumsy.return_value = 10
        ball = pong.ball.Ball((100, 100, 100), 10)
        pad = pong.pad.Pad('left')

        ball.rect.y = 100
        pad.rect.y = 50

        pad.follow(ball)

        self.assertEqual(0, pad.dy)

    @unittest.mock.patch('random.randint')
    def test_should_follow_ball_up(self, clumsy):
        clumsy.return_value = 1
        ball = pong.ball.Ball((100, 100, 100), 10)
        pad = pong.pad.Pad('left')

        ball.rect.y = 20
        pad.rect.y = 50

        pad.follow(ball)

        self.assertEqual(-1, pad.dy)
```

Lo que vamos a hacer entonces es convertir los números en propiedades del pad y modificar el valor de habilidad para que se más alta.

```python
    def follow(self, the_ball: pong.ball.Ball):

        if random.randint(self.min_ability, self.max_ability) > self.computer_ability:
            self.stop()
            return
        if the_ball.rect.y > self.rect.y:
            self.down()
        if the_ball.rect.y < self.rect.y:
            self.up()
```

```python
class Pad(pygame.sprite.Sprite):
    def __init__(self, side):
        super().__init__()

        self.max_ability = 10
        self.computer_ability = 7
        self.min_ability = 0

    #...
```

Y lo probamos, a ver qué tal se juega ahora. Hemos empezado con 7, pero ha hecho falta llegar a 10 para conseguir que el ordenador gane de forma consistente. Es posible que tengamos que cambiar un poco de enfoque. Por ejemplo, introduciendo otro parámetro que aumente la velocidad del pad. Probando varios valores de velocidad vemos que la habilidad aparente del ordenador mejora mucho, aunque nuestra rapidez también, lo que puede hacer un poco más difícil de controlar nuestra raqueta. Por otro lado, cuando la bola es lenta, el juego resulta más aburrido.

Esto apunta a que el problema de la dificultad del juego es un poco más complejo de lo que habíamos pensando inicialmente. Tenemos que darle unas vueltas. Entran en juego:

* Velocidad de la bola: cuanto más rápida más difícil para la jugadora humana
* Velocidad del jugador controlado por ordenador: cuanto más rápido, menos fallos tiene
* Continuidad del jugador controlado por el ordenador: cuando más continuo, menos fallos tiene
* Velocidad del pad de la jugadora humana: si es demasiado rápido es más difícil de controlar, aunque pueda llegar más fácilmente a todas las bolas, pero si es demasiado lenta resulta frustrante

En parte, la jugabilidad también depende de un factor "físico" que son los FPS del bucle del juego, aunque los mantendremos constantes. Sin embargo, al examinar esta posibilidad descubrimos que hay una forma mucho más elegante de manejar la *continuidad* del jugador computerizado. Se trata de generar regularmente un evento definido por nosotros y llamado `COMPUTER_MOVES` de modo que el pad controlado por el ordenador siga la bola. Cuanto más frecuentemente se lance el evento más preciso será el pad. Esta frecuencia se mide en el número de milisegundos que tienen que pasar para que se lance este evento. Con esto, podemos eliminar  algo de código en `Pad` y mejorar otros aspectos también.

Añadimos estas constantes en `config.py`:

```python
# CUSTOM GAME EVENTS

COMPUTER_MOVES_EVENT = pygame.constants.USEREVENT + 1
COMPUTER_MOVES_TIMER_MS = 10
```

Modificamos GameScene para darles soporte, justo antes de empezar el Game loop y en la parte de lectura de eventos. También quitamos la llamada que había justo antes de `all_sprites.update()` a `pad_right.follow(ball)`, que ahora es innecesaria.

```python
        # Game loop

        pygame.time.set_timer(pong.config.COMPUTER_MOVES_EVENT, pong.config.COMPUTER_MOVES_TIMER_MS)
        while not done:
            # Event
            for event in pygame.event.get():
                if event.type == pong.config.COMPUTER_MOVES_EVENT:
                    pad_right.follow(ball)
                if event.type == pygame.QUIT:
                    done = True
```

Con esto, podemos quitar la parte de `clumsyness` del método `follow`, porque ahora se encarga el sistema de eventos. Y con ello, el método sólo hace una cosa: seguir a la bola.

```python
    def follow(self, the_ball: pong.ball.Ball):
        if the_ball.rect.y > self.rect.y:
            self.down()
        if the_ball.rect.y < self.rect.y:
            self.up()

```


Por tanto, los tests tal cual están ya no nos sirven, y podemos simplificarlos. Ya que estamos, refactorizamos todo el test case para que sea más manejable:

```python
from unittest import TestCase

import pong.ball
import pong.pad


class TestPad(TestCase):
    def setUp(self) -> None:
        self.pad = pong.pad.Pad('left')
        self.ball = pong.ball.Ball((100, 100, 100), 10)
        self.pad.rect.y = 100

    def test_ball_hits_in_central_region_left_pad(self):
        self.__given_ball_hits_pad_at(40)
        self.__given_ball_has_speed_of(-2, 2)

        self.pad.hit(self.ball)

        self.assertSpeedEqual(1, 1)

    def test_ball_hits_in_upper_intermediate_region_left_pad(self):
        self.__given_ball_hits_pad_at(12)
        self.__given_ball_has_speed_of(-1, 1)

        self.pad.hit(self.ball)

        self.assertSpeedEqual(2, 2)

    def test_ball_hits_in_lower_intermediate_region_left_pad(self):
        self.__given_ball_hits_pad_at(62)
        self.__given_ball_has_speed_of(-1, 1)

        self.pad.hit(self.ball)

        self.assertEqual(2, self.ball.dx)
        self.assertEqual(2, self.ball.dy)

    def test_ball_hits_in_upper_top_region_left_pad(self):
        self.__given_ball_hits_pad_at(4)
        self.__given_ball_has_speed_of(-1, 1)

        self.pad.hit(self.ball)

        self.assertSpeedEqual(1, -2)

    def test_ball_hits_in_bottom_top_region_left_pad(self):
        self.__given_ball_hits_pad_at(70)
        self.__given_ball_has_speed_of(-1, 1)

        self.pad.hit(self.ball)

        self.assertSpeedEqual(1, 2)

    def test_should_follow_ball_down(self):
        self.ball.rect.y = 200

        self.pad.follow(self.ball)

        self.assertEqual(1, self.pad.dy)

    def test_should_follow_ball_up(self):
        self.ball.rect.y = 20

        self.pad.follow(self.ball)

        self.assertEqual(-1, self.pad.dy)

    def assertSpeedEqual(self, dx, dy):
        self.assertEqual(dx, self.ball.dx)
        self.assertEqual(dy, self.ball.dy)

    def __given_ball_hits_pad_at(self, height):
        self.ball.rect.y = self.pad.rect.y + height - self.ball.radius

    def __given_ball_has_speed_of(self, dx, dy):
        self.ball.dx = dx
        self.ball.dy = dy
```

Un beneficio extra de estos cambios es que ahora la raqueta del ordenador se mueve mucho más suavemente. Hemos logrado aumentar, al menos un poco, la dificultad y la jugabilidad, a la vez que hemos conseguido varias mejoras de calidad de software.

Ya que estamos, vamos a mover el archivo `pad.py` a un subpackage `game` y normalizar los nombres de los tests, para que sigan una única convención.

Con todos estos cambios, hacemos un [commit con el que damos por entregada esta primera historia de usuario](https://github.com/franiglesias/japong/commit/c9bbe94a3d66104f87a6de3e3e5e77b93bdd29dc).

## En resumen

En esta entrega comenzamos a introducir metodologías ágiles o de alto rendimiento. Organizamos las prestaciones que queremos añadir al juego como historias de usuario priorizadas.

También trabajamos en el desarrollo de la primera historia, aprovechando la ocasión para introducir mejoras técnicas, reorganizar y refactorizar algunos aspectos del código que tenemos que intervenir.


