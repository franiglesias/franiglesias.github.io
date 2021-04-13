---
layout: post
title: Escribir código a prueba de futuro
categories: articles
tags: good-practices refactoring python
---

Estas ideas pueden aplicarse tanto al escribir código nuevo como ser usadas como guía para refactoring.

Como hemos señalado en ocasiones anteriores, es difícil definir lo que es buen código. Sin embargo, es más fácil describir lo que hace malo al código. Y una de las características de un código malo es que sea difícil de cambiar. O dicho de otro modo, un código que no pueda evolucionar fácilmente con los cambios del negocio.

Así que en este artículo veremos algunas tácticas para escribir código nuevo, o refactorizar código existente, de forma que sea más fácil de cambiar en el futuro.

Normalmente recomendamos no escribir código pensando en lo que pueda necesitarse más adelante, pero hay que distinguir entre añadir features que no sabemos si se necesitará algún día y escribir código pensando en que algún día será modificado.

Lo primero tiene que ver con el principio YAGNI (*No lo vas a necesitar*) y que básicamente nos dice que no añadamos código para introducir características en el software solo porque podemos o porque nos parece que pueden ser interesantes.

En cambio, lo segundo es una forma de escribir software de tal manera que llegado el momento sea fácil añadir esas nuevas características minimizando la dificultad y el riesgo de afectar o dañar las existentes.

En un entorno que siga una filosofía ágil de desarrollo, no solo cuenta la posibilidad de desarrollar MVP de features en corto espacio de tiempo, sino también la posibilidad de iterarlas incrementalmente, por lo cual necesitamos no solo velocidad para la primera entrega, sino asegurar que tendremos velocidad en las iteraciones. 

Por tanto, necesitamos escribir código que aporte valor cuanto antes, pero que nos ayuda a aportar valor rápidamente en el futuro. En ese sentido, es ir un poco más lentos al principio para poder ir más rápido en el largo plazo.

Así que aquí van una serie de prácticas que pueden hacer tu código más **a prueba de futuro**. Una buena parte de ella están tomadas del libro de [Sandi Metz, *Practical Object-Oriented Design*](https://www.poodr.com).

## Haz el código dependiente del comportamiento, no de los datos

Básicamente consiste en acceder a las propiedades de una clase a través de métodos incluso dentro de la propia clase. Esta técnica también se conoce como *auto-encapsulación* o *self-encapsulation*.

En resumidas cuentas es practicar el principio de *information hiding* hasta sus últimas consecuencias.

La programación orientada a objetos se basa realmente en la comunicación. Cuando un objeto *habla* con otros (incluido él mismo) le envía mensajes para que realice ciertos comportamientos. 

Lo que unos objetos pueden conocer de otros es su comportamiento, entendido como los mensajes que cada objeto puede recibir.

En cambio, lo que los objetos no pueden, ni deben, conocer de los demás son sus propiedades (*information hiding*). Si necesitamos que un objeto nos proporcione una información, le tenemos que enviar un mensaje para que ejecute el comportamiento de entregárnosla, no tenemos que saber cómo la guarda o la representa.

Aplicando el mismo principio dentro de una clase, lo que hacemos es independizarla de la forma en que se representa la información. Esto nos proporciona algunas ventajas:

* Podemos cambiar la estructura de datos libremente con tal de mantener la interfaz pública de la clase, que es como decir que mantenemos su comportamiento.
* Sólo un método de la clase necesita saber cómo acceder a una determinada propiedad, por lo que si ese acceso tiene que modificarse, el cambio se realiza en un único lugar.

Puedes ver un ejemplo en esta clase `ScoreManager` (python), extraída del proyecto de [Pong en Python](https://github.com/franiglesias/japong):

```python
import math


class ScoreManager(object):

    def __init__(self, player_one, player_two, match) -> None:
        if player_one.is_at_left():
            self._set_players(player_one, player_two)
        else:
            self._set_players(player_two, player_one)
        self.match = match

    def _set_players(self, left, right):
        self.left = left
        self.right = right

    def left_player(self):
        return self.left

    def right_player(self):
        return self.right

    def end_of_game(self):
        return self._best() >= self._sets_to_win_game()

    def end_of_set(self):
        return self._points_difference() >= 2 and self._winner_points() >= self._points_to_win_set()

    def winner(self):
        if self.left_player().beats(self.right_player()):
            return self.left_player()

        return self.right_player()

    def _points_to_win_set(self):
        return self.match[1]

    def _sets_to_win_game(self):
        return math.ceil(self.match[0] / 2)

    def _best(self):
        return max(self.left_player().sets(), self.right_player().sets())

    def _winner_points(self):
        return max(self.left_player().points(), self.right_player().points())

    def _points_difference(self):
        return abs(self.left_player().points() - self.right_player().points())

    def points(self):
        return self.left_player().points(), self.right_player().points()

    def partials(self):
        return self.left_player().partials(), self.right_player().partials()

    def sets(self):
        return self.left_player().sets(), self.right_player().sets()

    def end_set(self):
        if self.left_player().beats(self.right_player()):
            self.left_player().win_set()
        else:
            self.right_player().win_set()

    def new_set(self):
        self.left_player().new_set()
        self.right_player().new_set()
```

El acceso a las propiedades `left` y `right`, que representan los jugadores según el lado del campo en que se encuentran, se hace a través de los métodos `left_player` y `right_player`. Lo que nos interesa es saber qué jugador ocupa cada posición, independientemente de la forma en que se haya representado.

De hecho, podríamos plantearnos cambiar esa representación ya que ahora la clase no depende de ello. Por ejemplo, en lugar de tener dos propiedades, podríamos hacerlo solo en una:

```python
class ScoreManager(object):

    def __init__(self, player_one, player_two, match) -> None:
        if player_one.is_at_left():
            self._set_players(player_one, player_two)
        else:
            self._set_players(player_two, player_one)
        self.match = match

    def _set_players(self, left, right):
        self.players = (left, right)

    def left_player(self):
        return self.players[0]

    def right_player(self):
        return self.players[1]
    
    # ...
```

Como se puede ver, los únicos cambios que hemos tenido que hacer han ocurrido solo en los métodos `_set_players`, `left_player` y `right_player`, y no ha sido necesario tocar nada de los demás.

Otro aspecto de la cuestión es la lógica de asignación de los jugadores a su posición. Tendría sentido encapsularla, de forma que ahora la constructora describe mejor lo que pasa. 

```python
class ScoreManager(object):

    def __init__(self, player_one, player_two, match) -> None:
        self._set_players(player_one, player_two)
        self.match = match

    def _set_players(self, one, two):
        if one.is_at_left():
            self.players = (one, two)
        else:
            self.players = (two, one)
    
    # ...
```

## Oculta las estructuras de datos

Es otra versión del consejo anterior. Cuando una propiedad de un objeto es una estructura de datos (un array, un diccionario, etc.) los métodos que la usen no tienen que saber cuál es esa estructura. Es decir, aunque des acceso a la misma a través de un método, los otros métodos consumidores tendrían que tener conocimientos acerca de la estructura.

En lugar de eso, expón métodos que permitan acceder a la información relevante de una manera significativa, de tal modo que no sea necesario saber cómo está organizada la información, sino cómo obtenerla.

Mejor aún, convierte o encapsula esa estructura en un objeto y dótalo de comportamiento.

En el `ScoreManager` también se pueden ver ejemplos.

El refactor que hicimos en el apartado anterior sobre la forma en que se guarda la información de los jugadores es un caso. La clase no depende de la estructura de datos utilizada, solo unos métodos muy específicos tienen el conocimiento requerido. Eso nos ha permitido hacer el cambio de usar dos propiedades a solo una.

Por otro lado, tenemos la propiedad `match`, que define las reglas de la puntuación. En el código se puede ver que hemos aplicado la regla anterior y solo dos métodos saben cómo obtener la información que contiene:

```python
import math


class ScoreManager(object):

    def __init__(self, player_one, player_two, match) -> None:
        self._set_players(player_one, player_two)
        self.match = match

    # ...

    def _points_to_win_set(self):
        return self.match[1]

    def _sets_to_win_game(self):
        return math.ceil(self.match[0] / 2)
        
    # ...
```

Este punto está bastante bien resuelto ya que los métodos son semánticos y la clase no depende de saber cuál es la estructura de datos que, al estar representada mediante una tupla (o array) no es especialmente auto explicativa.

## Extrae responsabilidades a nuevas clases

Si has estado individualizando aspectos de la funcionalidad de una clase en métodos privados es posible que descubras que algunos de esos aspectos son responsabilidades que no corresponden propiamente a la clase y pueden extraerse a colaboradores, moverse a clases más abstractas o tal vez a traits.

Pero lo que nos está diciendo esto es que hemos aislado una responsabilidad que a lo mejor no incumbe a `ScoreManager`: saber cuales son las reglas del partido y que son a cuántos sets se ha de jugar y puntos que hay que ganar en el set.

Gracias a que hemos llegado a aislar esta estructura de datos podemos cambiarla con mucha libertad. Por ejemplo, introduciendo un nuevo objeto que se encargue de mantener esa responsabilidad.

```python
import math


class Match(object):
    def __init__(self, match):
        self.sets = match[0]
        self.points_by_set = match[1]

    def points_to_win_set(self):
        return self.points_by_set

    def sets_to_win_game(self):
        return math.ceil(self.sets / 2)
```

Con lo cual, la clase `ScoreManager` ahora quedaría así:

```python
from game.scoring.match import Match


class ScoreManager(object):

    def __init__(self, player_one, player_two, match) -> None:
        self._set_players(player_one, player_two)
        self.match = Match(match)
        
    # ...

    def _points_to_win_set(self):
        return self.match.points_to_win_set()

    def _sets_to_win_game(self):
        return self.match.sets_to_win_game()

    # ...
```

Fíjate que mantenemos los métodos de la clase `ScoreManager`, de forma que los usos de la dependencia siguen quedando aislados. Esto tiene que ver con el siguiente punto.

## Inyecta dependencias y mantenlas aisladas

Si ha extraído responsabilidades a otras clases, lo suyo es inyectarlas como colaboradores en la construcción de las clases usuarias.

Si por alguna razón esto no es posible, aísla la instanciación de estos colaboradores en métodos. 

Hazlo igualmente para las llamadas a esos mismos colaboradores. Esto es llevar la ley de Demeter un paso más allá y podría resumirse en que tu clase no solo no debe hablar con extraños, sino que incluso debe reducir al mínimo su interacción con sus propios colaboradores.

El efecto beneficioso de esto es que si el colaborador cambia su interfaz en algún momento, o incluso si cambia el colaborador, tendrás un solo lugar que tocar en sus clases usuarias.

Sigamos con el ejemplo anterior.

```python
from game.scoring.match import Match


class ScoreManager(object):

    def __init__(self, player_one, player_two, match) -> None:
        self._set_players(player_one, player_two)
        self.match = Match(match)
        
    # ...

    def _points_to_win_set(self):
        return self.match.points_to_win_set()

    def _sets_to_win_game(self):
        return self.match.sets_to_win_game()

    # ...
```

La dependencia no está inyectada ni aislada. En este caso solo se instancia en la constructora, lo que tampoco está del todo mal. Pero si necesitásemos instanciarla en varios lugares lo mejor sería extraerlo a su propio método:

```python
from game.scoring.match import Match


class ScoreManager(object):

    def __init__(self, player_one, player_two, match) -> None:
        self._set_players(player_one, player_two)
        self._set_match(match)

    def _set_match(self, match):
        self.match = Match(match)
        
    # ...

    def _points_to_win_set(self):
        return self.match.points_to_win_set()

    def _sets_to_win_game(self):
        return self.match.sets_to_win_game()

    # ...
```

Si, por la razón que sea, no podemos tocar la instanciación de `ScoreManager` e inyectar Match, este podría ser un compromiso aceptable.

Lo ideal, por supuesto, es la inyección de la dependencia.

## Separa la iteración de la acción

Cuando tienes un bucle, extrae el bloque a un método privado en la clase. Obtienes la posibilidad de que ese fragmento de código sea reutilizable y además el bloque principal se hace más legible.

Por no hablar de la posibilidad de que sea un caso de aplicación de *Tell, don't ask* y puedas mover ese código a la clase de objetos que son iterados.

## Separa y extrae expresiones complejas

Con frecuencia trabajamos con cálculos y expresiones de cierta complejidad. Y también con frecuencia estas expresiones mezclan y ocultan conceptos que quizá no hayamos todavía descubierto en el dominio. Su extracción nos permite hacer más comprensibles las expresiones complejas, a la vez que nos muestra posible conceptos del dominio que estamos pasando por alto y que podrían requerir una representación más explícita en forma de clase.

En `ScoreManager` hemos extraído ya bastantes expresiones para hacerlas significativas, pero todavía hay margen para mejorar. Consideremos el método `end_of_game`:

```python
    def end_of_game(self):
        return self._best() >= self._sets_to_win_game()
```

Hemos separado el cálculo de los sets necesarios para ganar y cuál es número de sets que ganado el jugador que mejor va para decidir si se ha terminado el partido supuesto que haya conseguido el mínimo de sets necesario.

Sin embargo el nombre `_best` no parece muy apropiado, ¿verdad? La extracción del cálculo a un método es útil, pero tiene que completarse con una buena elección del nombre. Esta podría ser una solución:

```python
    def end_of_game(self):
        return self._sets_won_by_best_player() >= self._sets_to_win_game()
```

Echemos un ojo ahora a `end_of_set`:

```python
    def end_of_set(self):
        return self._points_difference() >= 2 and self._winner_points() >= self._points_to_win_set()
```

En este caso es una expresión condicional compleja. Ya habíamos extraído algunas partes, pero todavía resulta un poco difícil de leer. Tienen que pasar dos cosas para que termine un set:

* El jugador que va ganando ha conseguido el mínimo de puntos necesario para ganar el set.
* La diferencia con el otro jugador ha de ser igual o mayor que dos.

¿Por qué no expresarlo así?

```python
    def end_of_set(self):
        return self._minimum_score_reached() and self._minimum_difference_reached()

    def _minimum_score_reached(self):
        return self._winner_points() >= self._points_to_win_set()

    def _minimum_difference_reached(self):
        return self._points_difference() >= 2
```


## Protégete de los argumentos posicionales

Muchos métodos reciben parámetros y esto genera un cierto nivel de acoplamiento pues la clase consumidora tiene que saber qué parámetros ha de pasar y, en muchos casos, en qué orden.

Si el número de parámetros es pequeño esta circunstancia es bastante manejable, pero en cuanto una función tiene más de dos argumentos las cosas se complican bastante, sobre todo si alguno de ellos es opcional.

Algunos lenguajes permiten los argumentos con nombre, lo cual te permite olvidarte de su orden. En python ni siquiera tienes que definirlo, tan solo usar como *key* el nombre del argumento:

```python
self.window.score_manager = ScoreManager(
    player_one=player_one, 
    player_two=player_two, 
    match=(3, POINTS_TO_WIN))
```

Esto nos permite hacer cosas como cambiar el orden en que se pasan los parámetros:

```python
self.window.score_manager = ScoreManager(
    match=(3, POINTS_TO_WIN),
    player_one=player_one,
    player_two=player_two
)
```

En python puedes usar indistintamente argumentos posicionales y argumentos con nombre.

En cualquier caso, el uso de argumentos con nombre reduce la carga cognitiva y aligera el acoplamiento con la forma concreta de usar una función o instanciar un objeto.

En otros lenguajes, como PHP, esta característica no está presente lo que dificulta un poco más gestionarlo.

El enfoque más prometedor sería el refactor Parameter Object, es decir, en lugar de pasar largas listas de parámetros se reemplazarían por DTO. Idealmente serían DTO con propiedades públicas, lo que nos evitaría el engorro de crear getters y setters, al coste de menor seguridad de tipos en PHP anteriores a 7.4. A partir de PHP 7.4 disponemos de propiedades tipadas, lo que resuelve el problema de una forma bastante cómoda.

## Usa métodos factoría (o builders o factorías)

En la medida en que instanciar objetos se pueda hacer complicado es conveniente encapsular las diferentes lógicas de construcción, para ello disponemos de una variedad de [patrones creacionales](/creational_patterns_talk/).

Los métodos factoría y named constructors, nos ayudan aportando significado a distintas modalidades de instanciación.

Por su parte, Builders y Factories nos pueden proporcionar mecanismos de instanciación más flexibles y, sobre todo, puntos únicos donde realizarla lo que reduce el efecto y el coste de posibles cambios.

Algunas reglas prácticas al respecto serían:

* Si se requiere cierta preparación para poder instanciar un objeto es posible que debas encapsular esa lógica en la constructora. Por ejemplo, si tienes que procesar un cierto input para obtener los argumentos de la constructora.
* Si esa lógica alcanza cierto nivel de complejidad, seguramente necesitas un objeto tipo Builder que se ocupe de gestionarla y tenerlo accesible en un solo lugar.
* Si necesitas poder construir un mismo tipo de objeto de distintas formas, probablemente te vendrá bien introducir *named constructors*. Esto ocurre cuanto tienes distintos formatos de la información necesaria para la instanciación.

## Para terminar

Respetar el principio YAGNI (No lo vas a necesitar) que nos impulsa a no añadir features al software si nadie las ha pedido, no debería ser un obstáculo para preparar ese mismo código para el futuro.

Este esfuerzo de escribir un software a prueba de futuro puede considerarse como una buena inversión. Al preparar así el código, las nuevas features serán más fáciles de añadir cuando sea necesario, aumentando así nuestra velocidad de entrega.

