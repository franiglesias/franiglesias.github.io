---
layout: post
title: Escribir código a prueba de futuro
categories: articles
tags: good-practices refactor
---

Estas ideas pueden aplicarse tanto al escribir código nuevo como ser usadas como guía para refactoring.

Como hemos señalado en ocasiones anteriores, es difícil definir lo que es buen código. Sin embargo, es más fácil describir lo que hace malo al código. Y una de las características de un código malo es que sea difícil de cambiar. O dicho de otro modo, un código que no pueda evolucionar fácilmente con los cambios del negocio.

Así que en este artículo veremos algunas tácticas para escribir código nuevo, o refactorizar código existente, de forma que sea más fácil de cambiar en el futuro.

Normalmente recomendamos no escribir código pensando en lo que pueda necesitarse más adelante, pero hay que distinguir entre añadir features que no sabemos si se necesitará algún día y escribir código pensando en que algún día será modificado.

Lo primero tiene que ver con el principio YAGNI (*No lo vas a necesitar*) y que básicamente nos dice que no añadamos código para introducir características en el software sólo porque podemos o porque nos parece que pueden ser interesantes.

En cambio, lo segundo es una forma de escribir software de tal manera que llegado el momento sea fácil añadir esas nuevas características minimizando la dificultad y el riesgo de afectar o dañar las existentes.

En un entorno que siga una filosofía ágil de desarrollo, no sólo cuenta la posibilidad de desarrollar MVP de features en corto espacio de tiempo, sino también la posibilidad de iterarlas incrementalmente, por lo cual necesitamos no sólo velocidad para la primera entrega, sino asegurar que tendremos velocidad en las iteraciones. 

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

Puedes ver un ejemplo en esta clase `ScoreManager` (python):

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

El acceso a las propiedades `left` y `right`, que representan los jugadores según el lado del campo en que se encuentran, se hace a través de los métodos `left_player` y `right_player`.

A nosotras nos interesa saber qué jugador está en cada posición

## Oculta las estructuras de datos

Es otra versión del consejo anterior. Cuando una propiedad de un objeto es una estructura de datos (un array, un diccionario, etc.) los métodos que la usen no tienen que saber cuál es esa estructura. Es decir, aunque des acceso a la misma a través de un método, los otros métodos consumidores tendrían que tener conocimientos acerca de la estructura.

En lugar de eso, expón métodos que permitan acceder a la información relevante de una manera significativa, de tal modo que no sea necesario saber cómo está organizada la información, sino cómo obtenerla.

Mejor aún, convierte o encapsula esa estructura en un objeto y dótalo de comportamiento.

## Separa la iteración de la acción

Cuando tienes un bucle, extrae el bloque a un método privado en la clase. Obtienes la posibilidad de que ese fragmento de código sea reutilizable y además el bloque principal se hace más legible.

Por no hablar de la posibilidad de que sea un caso de aplicación de *Tell, don't ask* y puedas mover ese código a la clase de objetos que son iterados.

## Separa y extrae expresiones complejas

Con frecuencia trabajamos con cálculos y expresiones de cierta complejidad. Y también con frecuencia estas expresiones mezclan y ocultan conceptos que quizá no hayamos todavía descubierto en el dominio. Su extracción nos permite hacer más comprensibles las expresiones complejas, a la vez que nos muestra posible conceptos del dominio que estamos pasando por alto y que podrían requerir una representación más explícita en forma de clase.

## Extrae responsabilidades a nuevas clases

Si has estado individualizando aspectos de la funcionalidad de una clase en métodos privados es posible que descubras que algunos de esos aspectos son responsabilidades que no corresponden propiamente a la clase y pueden extraerse a colaboradores, moverse a clases más abstractas o tal vez a traits.

## Inyecta dependencias. Si no es posible, aíslalas

Si ha extraído responsabilidades a otras clases, lo suyo es inyectarlas como colaboradores en la construcción de las clases usuarias.

Si por alguna razón esto no es posible, aísla la instanciación de estos colaboradores en métodos. 

Hazlo igualmente para llamadas a métodos en colaboradores. Esto es llevar la ley de Demeter un paso más allá y podría resumirse en que tu clase no sólo no debe hablar con extraños, sino que incluso debe reducir al mínimo su interacción con sus propios colaboradores.

El efecto beneficioso de esto es que si el colaborador cambia su interfaz en algún momento, tendrás un sólo lugar de cambio en sus clases usuarias.

## Protégete de los argumentos posicionales

Muchos métodos reciben parámetros y esto genera un cierto nivel de acoplamiento pues la clase consumidora tiene que saber qué parámetros ha de pasar y, en muchos casos, en qué orden.

Si el número de parámetros es pequeño esta circunstancia es bastante manejable, pero en cuanto una función tiene más de dos argumentos las cosas se complican bastante, sobre todo si alguno de ellos es opcional.

Algunos lenguajes permiten los argumentos con nombre, lo cual te permite olvidarte de su orden. En otros lenguajes, como PHP, esta característica no está presente lo que dificulta un poco más gestionarlo.

El enfoque más prometedor sería el refactor Parameter Object, es decir, en lugar de pasar largas listas de parámetros se reemplazarían por DTO. Idealmente serían DTO con propiedades públicas, lo que nos evitaría el engorro de crear getters y setters, al coste de menor seguridad de tipos en PHP anterior a 7.4. A partir de PHP 7.4 diponemos de propiedades tipadas.

## Usa métodos factoría (o builders o factorías)

En la medida en que instanciar objetos se pueda hacer complicado es conveniente encapsular las diferentes lógicas de construcción. 

Los métodos factoría (named constructors, en este caso) no ayudan aportando significado a distintas modalidades de instanciación.

Por su parte, Builders y Factories nos pueden proporcionar mecanismos de instanciación más flexibles y, sobre todo, puntos únicos donde realizarla lo que reduce el efecto y el coste de posibles cambios.
