---
layout: post
title: Pong en Python. Nuevas features, nuevos tests
categories: articles
tags: python good-practices
---

Después de un tiempo con foco en otras tareas, llega el momento de introducir nuevas capacidades en el juego.

De momento nuestro juego es un poco aburrido ya que el movimiento de la pelota es siempre el mismo y la habilidad del oponente ordenador es bastante limitada. Para hacer el juego más interesante vamos a introducir variaciones en los goles a la pelota con la raqueta.

En el juego original la pelota rebota de forma un poco diferente en función de la parte de la pala con la que choca. En nuestro caso distinguiremos tres zonas, más o menos así:


```
   +--+  -> dy = -2, dx * -1
   |  |  -> dy * 2, dx * -2
   |  |  \ 
   |  |   -> dy * 1, dx * -1
   |  |  /
   |  |  -> dy * 2, dx * -2
   +--+  -> dy = 2, dx * -1
```

* La zona central hará rebotar la pelota con velocidad y ángulo estándar (50 % de la altura). Si la bola viene más rápido volverá a la velocidad estándar.
* En las zonas intermedias el rebote incrementará la velocidad al doble sobre la estándar con el mismo ángulo (15 % de la altura)
* En las zonas extremas aumentará la velocidad vertical con lo que aumentará el ángulo (10 % de la altura), además forzará el rebote hacia el extremo en el que golpea, lo que puede provocar un cambio de sentido de la bola.

Introducir estas modificaciones nos permitirá tener un motivo para tocar más código legacy, ponerlo bajo test y mejorar la calidad general de la aplicación. Así que vamos a ver cómo.

## Tests de caracterización

Los tests de caracterización nos permiten describir y asegurar el comportamiento existente de una unidad de software. De este modo podemos hacer refactors con mayor seguridad e introducir nueva funcionalidad sin romper la existente.

Al examinar el código vemos que la gestión se hace en el objeto `Ball`, por lo que vamos a preparar un escenario que nos permita testear. Como estamos usando la capacidad de `pygame` para detectar las colisiones nos vamos a centrar simplemente en ser capaces de detectar en qué zona de la pala se produce la colisión. Pero antes de nada, vamos a estudiar `Ball`:

```python
import random

import pygame

import pong
import pong.app.app
import pong.config


class Ball(pygame.sprite.Sprite):
    def __init__(self, color, radius):
        super().__init__()

        self.color = color
        self.radius = radius
        self.dx = 0
        self.dy = 0
        self.rx = 2
        self.ry = 2
        self.remaining = 0

        self.image = pygame.Surface((self.radius * 2, self.radius * 2))

        self.image.fill(pong.config.white)
        self.image.set_colorkey(pong.config.white)
        pygame.draw.ellipse(self.image, self.color, [0, 0, self.radius * self.rx, self.radius * self.ry])

        self.rect = self.image.get_rect()
        self.restart()

        self.borders = None
        self.pads = None

    def restart(self):
        self.rect.x = 400
        self.rect.y = 300

        self._set_random_direction()

    def _set_random_direction(self):
        direction = random.choice([(-1, -1), (1, -1), (1, 1), (-1, 1)])
        self.dx = direction[0]
        self.dy = direction[1]

    def update(self):
        self.rect.x += self.dx
        self.rect.y += self.dy

        border_collisions = pygame.sprite.spritecollide(self, self.borders, False)
        for _ in border_collisions:
            self.rect.y -= self.dy
            self._start_transformation_count_down()
            self._play_side_hit_sound()
            self.ry = 1.3
            self.dy *= -1

        pad_collisions = pygame.sprite.spritecollide(self, self.pads, False)
        for _ in pad_collisions:
            self.rect.x -= self.dx
            self._start_transformation_count_down()
            self._play_pad_hit_sound()
            self.rx = 1.3
            self.dx *= -1

        if self.remaining > 0:
            self.remaining -= 1
        else:
            self.rx = 2
            self.ry = 2

        self.image.fill(pong.config.white)
        self.image.set_colorkey(pong.config.white)

        width = self.radius * self.rx
        height = self.radius * self.ry

        y = self.radius - (height / 2)
        x = self.radius - (width / 2)
        pygame.draw.ellipse(self.image, self.color, [x, y, width, height])

    @staticmethod
    def _play_pad_hit_sound():
        pong.app.app.playerHit.play()

    @staticmethod
    def _play_side_hit_sound():
        pong.app.app.sideHit.play()

    def _start_transformation_count_down(self):
        self.remaining = pong.config.FPS / 16
```

El primer problema en este punto es que todos los cambios se producen en el método update, así que vamos a aislar el código que nos interesa en un método de forma que podamos testearlo. Además, necesitamos poder aislar el pad implicado en la colisión para acceder a su posición y poder determinar en qué parte es golpeado por la bola.

Lo primero es dar nombre al objeto que colisiona con la bola (voy a copiar solo el código implicado para que sea más fácil de seguir):

```python
        pad_collisions = pygame.sprite.spritecollide(self, self.pads, False)
        for pad in pad_collisions:
            self.rect.x -= self.dx
            self._start_transformation_count_down()
            self._play_pad_hit_sound()
            self.rx = 1.3
            self.dx *= -1
```

Las siguientes líneas se ocupan de gestionar el efecto, bastante tosco, de elasticidad de la bola. Ya nos ocuparemos de eso en algún momento. Nos interesa la línea:

```python
            self.dx *= -1
```

Que contiene el comportamiento básico del rebote de la pelota con el pad: cambiar de sentido en el eje x. Nosotros vamos a hacer que este comportamiento sea algo más complejo, así que lo vamos a extraer a un método que voy a llamar `bounce_with_pad`. Este método recibe un pad, aunque ahora no vamos a hacer nada con él.

```python
    def bounce_with_pad(self, pad):
        self.dx *= -1
```

Este método es fácil de testear y le podemos pasar un pad, que no es otra cosa que un objeto Sprite. `Ball.dx` y `Ball.dy` representan la velocidad de la bola (el número de pixels que se mueven en cada tick) y será las propiedades que chequearemos. No queremos usar dobles aquí, así que instanciaremos los objetos sin más.

```python
from unittest import TestCase

import pong.ball
import pong.pad


class TestBall(TestCase):
    def test_bounce_with_pad(self):
        ball = pong.ball.Ball((100,100,100), 10)
        previous_dx = ball.dx

        pad = pong.pad.Pad('left')
        ball.bounce_with_pad(pad)
        
        self.assertEqual(-previous_dx, ball.dx)
```

Con este test caracterizamos la funcionalidad básica. Sin embargo, tiene un problema. La bola se instancia con valores aleatorios de `dx` y `dy`, así que vamos a introducir un cambio que nos garantice que tenemos control sobre su estado inicial. Tan simple como esto:

```python
from unittest import TestCase

import pong.ball
import pong.pad


class TestBall(TestCase):
    def test_bounce_with_pad(self):
        ball = pong.ball.Ball((100,100,100), 10)
        ball.dx = 1
        ball.dy = 1

        pad = pong.pad.Pad('left')
        ball.bounce_with_pad(pad)
        
        self.assertEqual(-1, ball.dx)
```

De esta forma el test es mucho más sólido. Podemos comprobar que el juego se ejecuta con normalidad antes de proseguir.

## Añadiendo las nuevas features

Vamos a introducir las nuevas capacidades de rebote de la bola. La cuestión que nos interesa ahora es poder determinar en qué parte del pad es golpeada la bola. La parte central mantiene el comportamiento actual por lo que podríamos tratar sólamente los casos de golpear en las zonas que lo modifican. Sin embargo, hay un problema: al golpear en la zona central tiene que "resetearse" por así decir la velocidad en ambos ejes. Es decir, tendría que cumplirse este test:

```python
from unittest import TestCase

import pong.ball
import pong.pad


class TestBall(TestCase):
    def test_bounce_with_pad(self):
        ball = pong.ball.Ball((100,100,100), 10)
        ball.dx = 1
        ball.dy = 1

        pad = pong.pad.Pad('left')
        ball.bounce_with_pad(pad)
        
        self.assertEqual(-1, ball.dx)

    def test_bounce_in_central_pad_region_resets_speed_and_changes_horiz_direction(self):
        ball = pong.ball.Ball((100, 100, 100), 10)
        ball.dx = 2
        ball.dy = 2

        pad = pong.pad.Pad('left')
        ball.bounce_with_pad(pad)

        self.assertEqual(-1, ball.dx)
        self.assertEqual(1, ball.dy)
```

Este cambio es aparentemente sencillo, pero tiene sus problemas. El principal es que la velocidad de la bola es una magnitud vectorial, por lo que tiene un módulo y un sentido. Sin entrar en los detalles matemáticos, diríamos que nuestro problema es que estamos representando dos conceptos con una única variable, lo que genera esta dificultad ya que tenemos que poder gestionar cada concepto de forma independiente.

En realidad, la velocidad de la bola la podríamos representar mediante una tupla formada por el desplazamiento horizontal y el vertical. 

```
speed = (dx, dy)
```

Pero ambos desplazamientos incluyen dos conceptos: cantidad de desplazamiento y sentido. Algo como esto:

```
speed = ((horizontal_delta, sign), (vertical_delta, sign))
```

La verdad es que hay un montón de opciones para representar esta información. Ya veremos cuál nos encaja mejor.

Esto es un ejemplo de un modelado defectuoso. Inicialmente el problema no fue analizado en detalle y requiere que rediseñemos la solución. Sin embargo tenemos un test que falla ahora mismo, por lo que no deberíamos refactorizar sin tener los tests pasando. Tenemos dos opciones:

* Anular el test y refactorizar hacia la nueva solución. El principal inconveniente es que quizá ese primer test sea insuficiente para asegurarnos de que el refactor es adecuado.
* Dejar el test y hacer un cambio de código que lo haga pasar aunque sea una solución muy tosca. Luego hacemos el refactor con dos tests que nos proporcionan mayor seguridad.

De momento, vamos a optar por esta solución, que podría ser suficiente:

```python
    def bounce_with_pad(self, pad):
        self.dx = 1 * -(self.dx // abs(self.dx))
        self.dy = 1 * (self.dy // abs(self.dy))
```

Añadiré algunos tests más para asegurar que el algoritmo es lo bastante útil, y de paso lo refactorizo un poco:

```python
from unittest import TestCase

import pong.ball
import pong.pad


class TestBall(TestCase):

    def setUp(self) -> None:
        super().setUp()
        self.ball = pong.ball.Ball((100, 100, 100), 10)
        self.pad = pong.pad.Pad('left')

    def test_bounce_with_pad(self):
        self.ball.dx = 1
        self.ball.dy = 1

        self.ball.bounce_with_pad(self.pad)

        self.assertEqual(-1, self.ball.dx)

    def test_bounce_in_central_pad_region_resets_speed_and_changes_right_to_left(self):
        self.ball.dx = 2
        self.ball.dy = 2

        self.ball.bounce_with_pad(self.pad)

        self.assertEqual(-1, self.ball.dx)
        self.assertEqual(1, self.ball.dy)

    def test_bounce_in_central_pad_region_resets_speed_and_changes_left_to_right(self):
        self.ball.dx = -2
        self.ball.dy = -2

        self.ball.bounce_with_pad(self.pad)

        self.assertEqual(1, self.ball.dx)
        self.assertEqual(-1, self.ball.dy)
```

Estos tests también nos confirman los defectos del modelado, ya que usamos dos propiedades de la bola, cuando posiblemente podríamos estar usando una tupla, visto que es relativamente fácil manejar el rebote con la nueva versión de la función.

Pero hacer eso significaría tener que alterar todo el código relativo a la velocidad de la bola y los rebotes en las bandas. Por esa razón, tendríamos que hacer un test que nos asegure el comportamiento de la bola al rebotar contra las bandas, de modo que lo podamos cambiar fácilmente en el futuro. Del mismo modo que antes, nos interesa asilar este comportamiento específico en un método para poder testearlo.

```python
    #...
        border_collisions = pygame.sprite.spritecollide(self, self.borders, False)
        for _ in border_collisions:
            self.rect.y -= self.dy
            self._start_transformation_count_down()
            self._play_side_hit_sound()
            self.ry = 1.3
            self.bounce_with_border()
    #...

    def bounce_with_border(self):
        self.dy *= -1
```

En este caso no nos hace falta pasar el borde ya que, al menos de momento, no se require ningún cambio de comportamiento en el que pueda influir. Simplemente se cambia el signo de la velocidad vertical.

El test puede ser este:

```python
    def test_bounce_with_border_top(self):
        self.ball.dx = 1
        self.ball.dy = -1

        self.ball.bounce_with_border()

        self.assertEqual(1, self.ball.dy)
        self.assertEqual(1, self.ball.dx)

    def test_bounce_with_border_bottom(self):
        self.ball.dx = 1
        self.ball.dy = 1

        self.ball.bounce_with_border()

        self.assertEqual(-1, self.ball.dy)
        self.assertEqual(1, self.ball.dx)
```

Finalmente, el test de Ball, con algunos otros arreglos quedaría así, cubriendo básicamente todo lo necesario.

```python
from unittest import TestCase

import pong.ball
import pong.pad


class TestBall(TestCase):

    def setUp(self) -> None:
        super().setUp()
        self.ball = pong.ball.Ball((100, 100, 100), 10)
        self.pad = pong.pad.Pad('left')

    def test_bounce_with_right_pad(self):
        self.ball.dx = 1
        self.ball.dy = 1

        self.ball.bounce_with_pad(self.pad)

        self.assertEqual(-1, self.ball.dx)
        self.assertEqual(1, self.ball.dy)

    def test_bounce_with_left_pad(self):
        self.ball.dx = -1
        self.ball.dy = 1

        self.ball.bounce_with_pad(self.pad)

        self.assertEqual(1, self.ball.dx)
        self.assertEqual(1, self.ball.dy)


    def test_bounce_in_central_right_pad_region_resets_speed(self):
        self.ball.dx = 2
        self.ball.dy = 2

        self.ball.bounce_with_pad(self.pad)

        self.assertEqual(-1, self.ball.dx)
        self.assertEqual(1, self.ball.dy)

    def test_bounce_in_central_left_pad_region_resets_speed(self):
        self.ball.dx = -2
        self.ball.dy = -2

        self.ball.bounce_with_pad(self.pad)

        self.assertEqual(1, self.ball.dx)
        self.assertEqual(-1, self.ball.dy)

    def test_bounce_with_border_top(self):
        self.ball.dx = 1
        self.ball.dy = -1

        self.ball.bounce_with_border()

        self.assertEqual(1, self.ball.dy)
        self.assertEqual(1, self.ball.dx)

    def test_bounce_with_border_bottom(self):
        self.ball.dx = 1
        self.ball.dy = 1

        self.ball.bounce_with_border()

        self.assertEqual(-1, self.ball.dy)
        self.assertEqual(1, self.ball.dx)
```

La aplicación sigue funcionando correctamente, así que sería el momento de [hacer un commit](https://github.com/franiglesias/japong/commit/b64ed51e4f96b42e50c603034f355145daf938cf) antes de añadir la nueva funcionalidad.

## Identificar el punto de choque

Obviamente para poder hacer que la bola rebote de forma diferenciada tenemos que saber en qué región de la raqueta ha tocado. La mejor forma de hacer esto es pasar el objeto Ball al objeto Pad y que éste nos diga qué región o incluso que calcule el rebote adecuado. Vamos a verlo con un test.

Empezaremos por el rebote en la zona central:

```python
from unittest import TestCase

import pong.ball
import pong.pad


class TestPad(TestCase):
    def test_ball_hits_in_central_region_left_pad(self):
        ball = pong.ball.Ball((100, 100, 100), 10)
        pad = pong.pad.Pad('left')

        ball.dx = -2
        ball.dy = 2

        pad.hit(ball)

        self.assertEqual(1, ball.dx)
        self.assertEqual(1, ball.dy)
```


El test te resultará familiar porque es básicamente el mismo que hemos hecho para la bola. Hemos añadido el método `hit` que recibe un objeto `Ball` para averiguar dónde golpea y llamando al método que ejecuta el rebote adecuado en `Ball`.

Este test nos servirá básicamente para hacer que `Pad` utilice a `Ball` ya que el comportamiento por defecto es justamente el que esperamos en el test.

Y este es el código en `Pad` que lo hace pasar:

```
    def hit(self, ball):
        ball.bounce_with_pad(self)
```

Con esto, me doy cuenta de dos cosas:

* En el método update de Ball puedo usar pad.hit() en lugar de self.bounce_with_pad()
* No tengo que pasar el pad a este método

Arreglo el test de Ball

```python
from unittest import TestCase

import pong.ball
import pong.pad


class TestBall(TestCase):

    def setUp(self) -> None:
        super().setUp()
        self.ball = pong.ball.Ball((100, 100, 100), 10)

    def test_bounce_with_right_pad(self):
        self.ball.dx = 1
        self.ball.dy = 1

        self.ball.bounce_with_pad()

        self.assertEqual(-1, self.ball.dx)
        self.assertEqual(1, self.ball.dy)

    def test_bounce_with_left_pad(self):
        self.ball.dx = -1
        self.ball.dy = 1

        self.ball.bounce_with_pad()

        self.assertEqual(1, self.ball.dx)
        self.assertEqual(1, self.ball.dy)

    def test_bounce_in_central_right_pad_region_resets_speed(self):
        self.ball.dx = 2
        self.ball.dy = 2

        self.ball.bounce_with_pad()

        self.assertEqual(-1, self.ball.dx)
        self.assertEqual(1, self.ball.dy)

    def test_bounce_in_central_left_pad_region_resets_speed(self):
        self.ball.dx = -2
        self.ball.dy = -2

        self.ball.bounce_with_pad()

        self.assertEqual(1, self.ball.dx)
        self.assertEqual(-1, self.ball.dy)

    def test_bounce_with_border_top(self):
        self.ball.dx = 1
        self.ball.dy = -1

        self.ball.bounce_with_border()

        self.assertEqual(1, self.ball.dy)
        self.assertEqual(1, self.ball.dx)

    def test_bounce_with_border_bottom(self):
        self.ball.dx = 1
        self.ball.dy = 1

        self.ball.bounce_with_border()

        self.assertEqual(-1, self.ball.dy)
        self.assertEqual(1, self.ball.dx)

```

Y cambio esa parte del método update:

```python
        pad_collisions = pygame.sprite.spritecollide(self, self.pads, False)
        for pad in pad_collisions:
            self.rect.x -= self.dx
            self._start_transformation_count_down()
            self._play_pad_hit_sound()
            self.rx = 1.3
            pad.hit(self)
```

Ok. Ahora vamos a programar que la bola golpea en la región intermedia superior. Recordemos el gráfico añadiendo las medidas

```
   +--+  ->   0% ->  10% => dy = -2, dx * -1
   |  |  ->  10% ->  25% => dy * 2, dx * -2
   |  |  \ 
   |  |   -> 25% ->  75% => dy * 1, dx * -1
   |  |  /
   |  |  ->  75% ->  90% => dy * 2, dx * -2
   +--+  ->  90% -> 100% => dy = 2, dx * -1
```

Los porcentajes indican entre qué píxeles de la raqueta tendría que tocar la bola para determinar la zona. Lo he puesto en porcentajes para que en el futuro el tamaño del pad sea configurable. En cualquier caso, sabiendo que este método se va a ejecutar solo cuando la raqueta y la bola colisionan, realmente solo tenemos que prestar atención a la coordenada `y`. Ahora bien, tenemos que estar pendientes de que la altura de la bola respecto al pad debe medirse por su centro.

Añadimos un test en el test case de Pad:

```python
    def test_ball_hits_in_upper_intermediate_region_left_pad(self):
        ball = pong.ball.Ball((100, 100, 100), 10)
        pad = pong.pad.Pad('left')

        ball_center_y = 112  # [7,21]

        pad.rect.y = 100
        ball.rect.y = ball_center_y - ball.radius

        ball.dx = -1
        ball.dy = 1

        pad.hit(ball)

        self.assertEqual(2, ball.dx)
        self.assertEqual(2, ball.dy)
```


La idea del test es simular que la bola y el pad están situados de modo que, en caso de colisión, ésta se produciría en la zona que nos interesa que sería entra los pixels 7 y 21 del pad.

Implementemos esto:

```python
    def hit(self, ball):
        ball_y_position_respect_pad = ball.rect.y + ball.radius - self.rect.y
        
        if 7 <= ball_y_position_respect_pad < 21:
            ball.bounce_middle_pad()
        else:
            ball.bounce_with_pad()
```

Esto supone añadir un método a Ball, que sería:

```python
    def bounce_middle_pad(self):
        self.dx = 2 * -(self.dx // abs(self.dx))
        self.dy = 2 * (self.dy // abs(self.dy))
```

Al tirar el TestCase el nuevo test pasará, pero el anterior fallará. Esto es porque no estamos controlando la posición relativa de los objetos, así que añadimos eso y el TestCase quedará así:

```python
from unittest import TestCase

import pong.ball
import pong.pad


class TestPad(TestCase):
    def test_ball_hits_in_central_region_left_pad(self):
        ball = pong.ball.Ball((100, 100, 100), 10)
        pad = pong.pad.Pad('left')

        ball_center_y = 140  # [18,57]

        pad.rect.y = 100
        ball.rect.y = ball_center_y - ball.radius

        ball.dx = -2
        ball.dy = 2

        pad.hit(ball)

        self.assertEqual(1, ball.dx)
        self.assertEqual(1, ball.dy)

    def test_ball_hits_in_upper_intermediate_region_left_pad(self):
        ball = pong.ball.Ball((100, 100, 100), 10)
        pad = pong.pad.Pad('left')

        ball_center_y = 112  # [7,21]

        pad.rect.y = 100
        ball.rect.y = ball_center_y - ball.radius

        ball.dx = -1
        ball.dy = 1

        pad.hit(ball)

        self.assertEqual(2, ball.dx)
        self.assertEqual(2, ball.dy)
```

Ahora los dos tests pasan. Vamos a probar a ver si conseguimos ver el efecto en el juego y efectivamente podemos ver cómo al golpear la bola con la parte adecuada de la raqueta se produce el aumento de velocidad.

Queremos aplicar lo mismo a la zona intermedia inferior. Así que añadimos un test:

```python
    def test_ball_hits_in_lower_intermediate_region_left_pad(self):
        ball = pong.ball.Ball((100, 100, 100), 10)
        pad = pong.pad.Pad('left')

        ball_center_y = 162  # [57,68]

        pad.rect.y = 100
        ball.rect.y = ball_center_y - ball.radius

        ball.dx = -1
        ball.dy = 1

        pad.hit(ball)

        self.assertEqual(2, ball.dx)
        self.assertEqual(2, ball.dy)
```

Estos tests necesitan mejoras, pero nos están sirviendo para entender el problema y resolverlo. Hacemos una implementación sencilla:

```python
    def hit(self, ball):
        ball_y_position_respect_pad = ball.rect.y + ball.radius - self.rect.y

        if 7 <= ball_y_position_respect_pad < 18 or 57 < ball_y_position_respect_pad <= 68:
            ball.bounce_middle_pad()
        else:
            ball.bounce_with_pad()

```

El test pasa sin problemas y es de esperar que en el juego ahora podamos lanzar la bola a mayor velocidad. Nos queda implementar el efecto de las esquinas. En este caso hay una variante. Si damos con el extremo de la pala, se produce un "efecto" y la bola, además de un ángulo diferente, sale hacia el lado de la pala con el que le damos.

Vamos a hacerlo para la esquina superior. Primero, el test:

```python
    def test_ball_hits_in_upper_top_region_left_pad(self):
        ball = pong.ball.Ball((100, 100, 100), 10)
        pad = pong.pad.Pad('left')

        ball_center_y = 104  # [0, 7]

        pad.rect.y = 100
        ball.rect.y = ball_center_y - ball.radius

        ball.dx = -1
        ball.dy = 1

        pad.hit(ball)

        self.assertEqual(1, ball.dx)
        self.assertEqual(-2, ball.dy)
```

Y ahora la implementación, en `Pad`:

```python
    def hit(self, ball):
        ball_y_position_respect_pad = ball.rect.y + ball.radius - self.rect.y

        if ball_y_position_respect_pad < 7:
            ball.bounce_with_pad_top()
        elif 7 <= ball_y_position_respect_pad < 18 or 57 < ball_y_position_respect_pad <= 68:
            ball.bounce_middle_pad()
        else:
            ball.bounce_with_pad()
```

y en `Ball`:

```python
    def bounce_with_pad_top(self):
        self.dx = 1 * -(self.dx // abs(self.dx))
        self.dy = -2
```

De nuevo, los tests pasan y si probamos el juego podemos observar cómo ahora la raqueta nos permite varios tipos de efectos.

Así que nos queda implementar el último efecto:

```python
    def test_ball_hits_in_bottom_top_region_left_pad(self):
        ball = pong.ball.Ball((100, 100, 100), 10)
        pad = pong.pad.Pad('left')

        ball_center_y = 170  # [68, 75]

        pad.rect.y = 100
        ball.rect.y = ball_center_y - ball.radius

        ball.dx = -1
        ball.dy = 1

        pad.hit(ball)

        self.assertEqual(1, ball.dx)
        self.assertEqual(2, ball.dy)
```

Esto nos lleva a la implementación completa, pero no final, en `Pad`:

```python
    def hit(self, ball):
        ball_y_position_respect_pad = ball.rect.y + ball.radius - self.rect.y

        if ball_y_position_respect_pad < 7:
            ball.bounce_with_pad_top()
        elif ball_y_position_respect_pad > 68:
            ball.bounce_with_pad_bottom()
        elif 7 <= ball_y_position_respect_pad < 18 or 57 < ball_y_position_respect_pad <= 68:
            ball.bounce_middle_pad()
        else:
            ball.bounce_with_pad()
```

Y en `Ball`:

```python
    def bounce_with_pad_bottom(self):
        self.dx = 1 * -(self.dx // abs(self.dx))
        self.dy = 2
```

Los tests vuelven a pasar y ahora el juego ya dispone de efectos. Podría ser [buen momento de hacer un commit](https://github.com/franiglesias/japong/commit/3845ec2c869181fcd9fbfb1169cce729c5a6f3cd) y celebrarlo luego con un refactor de todo el código que hemos añadido.

Por supuesto, no podemos evitar probar el juego un par de veces. Ahora es más entretenido, pero el ordenador necesita mejorar un poco su habilidad porque ahora resulta demasiado lento. Esto lo dejaremos para la próxima entrega.

## Oportunidades de refactor

Ahora que hemos entregado nueva funcionalidad, que además está cubierta por tests, sería momento de refactorizar. Hemos trabajado haciendo algunos experimentos, por lo que el código no ha quedado todo lo limpio que debería. Vamos a ver las oportunidades más evidentes.

La más llamativa en este momento es el método `hit` en `Pad`. El problema es que tiene varios números mágicos, que definen las diferentes zonas de la raqueta. Me gustaría conseguir dos cosas:

* Que sean fáciles de cambiar, para poder ajustarlas en función del feedback que puedan dar las jugadoras. Puede que las zonas no estén bien repartidas ahora.
* Que si el tamaño del pad cambia, el tamaño de las zonas cambie proporcionalmente.

Para ello, lo que voy a hacer es mover esos valores a métodos "Privados". Primero devolverán el valor definido actualmente y luego lo cambiaré para que vaya en proporción al tamaño de la pala.

```python
    def hit(self, ball):
        ball_y_position_respect_pad = ball.rect.y + ball.radius - self.rect.y

        if ball_y_position_respect_pad < self.__top_region_limit():
            ball.bounce_with_pad_top()
        elif ball_y_position_respect_pad > self.__bottom_region_limit():
            ball.bounce_with_pad_bottom()
        elif self.__top_region_limit() <= ball_y_position_respect_pad < self.__upper_middle_limit() or self.__bottom_middle_limit() < ball_y_position_respect_pad <= self.__bottom_region_limit():
            ball.bounce_middle_pad()
        else:
            ball.bounce_with_pad()

    def __bottom_middle_limit(self):
        return 57

    def __upper_middle_limit(self):
        return 18

    def __bottom_region_limit(self):
        return 68

    def __top_region_limit(self):
        return 7
```

Me he asegurado de que los tests siguen pasando. Sin embargo el código no queda precisamente bien con esta disposición: De todos modos primero introduciré el cambio para que las zonas sean proporcionales al tamaño del pad y luego me ocuparé de la legibilidad.

De momento, este es el aspecto de `Pad`:

```python
import random

import pygame

import pong.ball
import pong.config


class Pad(pygame.sprite.Sprite):
    def __init__(self, side):
        super().__init__()

        self.top_region_pct = 10
        self.middle_region_pct = 15

        self.width = 25
        self.height = 75

        self.dy = 0

        self.image = pygame.Surface((self.width, self.height))
        self.image.fill(pong.config.white)

        self.rect = self.image.get_rect()

        if side == 'left':
            self.margin = 25
        else:
            self.margin = 775 - self.width

        self.rect.y = 300
        self.rect.x = self.margin
        self.borders = None

    def up(self):
        self.dy = -1

    def down(self):
        self.dy = 1

    def stop(self):
        self.dy = 0

    def update(self):
        self.rect.y += self.dy

        border_collisions = pygame.sprite.spritecollide(self, self.borders, False)
        for _ in border_collisions:
            self.rect.y -= self.dy
            self.stop()

    def follow(self, the_ball: pong.ball.Ball):
        if random.randint(0, 10) > 5:
            self.stop()
            return
        if the_ball.rect.y > self.rect.y:
            self.down()
        if the_ball.rect.y < self.rect.y:
            self.up()

    def hit(self, ball):
        ball_center_y = ball.rect.y + ball.radius - self.rect.y

        if ball_center_y < self.__top_region_limit():
            ball.bounce_with_pad_top()
        elif ball_center_y > self.__bottom_region_limit():
            ball.bounce_with_pad_bottom()
        elif self.__top_region_limit() <= ball_center_y < self.__upper_middle_limit():
            ball.bounce_middle_pad()
        elif self.__bottom_middle_limit() < ball_center_y <= self.__bottom_region_limit():
            ball.bounce_middle_pad()
        else:
            ball.bounce_with_pad()

    def __top_region_limit(self):
        return self.top_region_pct * self.height // 100

    def __upper_middle_limit(self):
        return (self.middle_region_pct + self.top_region_pct) * self.height // 100

    def __bottom_middle_limit(self):
        return ((100 - self.top_region_pct - self.middle_region_pct) * self.height) // 100

    def __bottom_region_limit(self):
        return ((100 - self.top_region_pct) * self.height) // 100
```

Y hacemos un [nuevo commit con este cambio](https://github.com/franiglesias/japong/commit/39212b652fb8fa54dc3659bc59ffb5916fa128fe).
