---
layout: post
title: Escribir código a prueba de futuro 2
categories: articles
tags: good-practices refactoring python
---

Aprovechando el refactor del juego de Pong, vamos a ver más ejemplos de cómo orientarlo para mejorar su solidez y capacidad de cambio futuro.

Consideremos esta clase `ComputerControlEngine`, que desciende de `ControlEngine` y que contiene la lógica que mueve al jugador controlado por la máquina:

```python
class ComputerControlEngine(ControlEngine):
    def __init__(self, ball: Ball):
        super().__init__()
        self.ball = ball

    def follow(self):
        if self.ball.rect.y > self.pad.rect.y:
            self.pad.down()
        if self.ball.rect.y < self.pad.rect.y:
            self.pad.up()

    def handle(self, events):
        for event in events:
            if event.type == COMPUTER_MOVES_EVENT:
                self.follow()

```

Aquí está la clase abstracta de la que desciende:

```python
class ControlEngine(object, metaclass=ABCMeta):
    def __init__(self):
        self.pad = None

    def bind_pad(self, the_pad):
        self.pad = the_pad

    @abstractmethod
    def handle(self, events):
        pass
```

La primera idea que vamos a aplicar es la de acceder a las propiedades a través de mensajes o métodos. Con más razón porque la propiedad pad realmente pertenece a la clase abstracta y, aunque `ComputerControlEngine` tiene acceso a ella, no debemos olvidar que la herencia es la forma de acoplamiento más estrecha. Pero podemos aligerarlo.

Así que añadimos el método en `ControlEngine`

```python
class ControlEngine(object, metaclass=ABCMeta):
    def __init__(self):
        self.pad = None

    def bind_pad(self, the_pad):
        self.pad = the_pad

    @abstractmethod
    def handle(self, events):
        pass

    def pad(self):
        return self.pad
```

Y lo usamos:

```python
class ComputerControlEngine(ControlEngine):
    def __init__(self, ball: Ball):
        super().__init__()
        self.ball = ball

    def follow(self):
        if self.ball.rect.y > super().pad().rect.y:
            super().pad().down()
        if self.ball.rect.y < super().pad().rect.y:
            super().pad().up()

    def handle(self, events):
        for event in events:
            if event.type == COMPUTER_MOVES_EVENT:
                self.follow()

```

Aunque ya estaban ahí, ahora las llamadas encadenadas *gritan* los problemas que teníamos en esta clase aparentemente sencilla. Por una parte la dependencia de la super clase y, por otro, las dependencias transitivas o violaciones de la ley de Demeter.

Para tratarlas empezaremos aislándolas, [como aprendimos en un artículo anterior](/future-proof-code/):

```python
class ComputerControlEngine(ControlEngine):
    def __init__(self, ball: Ball):
        super().__init__()
        self.ball = ball

    def follow(self):
        if self.ball.rect.y > self._pad_position():
            self._move_pad_down()
        if self.ball.rect.y < self._pad_position():
            self._move_pad_up()

    def handle(self, events):
        for event in events:
            if event.type == COMPUTER_MOVES_EVENT:
                self.follow()
                
    def _pad_position(self):
        return super().pad().rect.y
    
    def _move_pad_up(self):
        super().pad().up()
    
    def _move_pad_down(self):
        super().pad().down()
```

Al separar así las dependencias podemos atacarlas mejor:

Aquí estamos accediendo a propiedades de pad que no deberíamos conocer:

```python
    def _pad_position(self):
        return super().pad().rect.y
```

Lo correcto sería que `Pad` nos pudiese decir cual es su posición, para empezar:

```python
    def _pad_position(self):
        return super().pad().vertical_position()
```

Todavía podemos ir un paso más allá, `ComputerControlEngine` no tiene poe qué saber que `ControlEngine` tiene un `Pad` ni cómo debe ser accionado, por lo que `ControlEngine` podría tener métodos que sean significativos para `ComputerControlEngine`.

```python
    def _pad_position(self):
        return super().pad_position()
```

Y lo mismo aplica a los métodos que accionan el `Pad`:

```python
    def _move_pad_up(self):
        super().move_pad_up()

    def _move_pad_down(self):
        super().move_pad_down()
```

De este modo, `ControlEngine` quedaría:

```python
class ControlEngine(object, metaclass=ABCMeta):
    def __init__(self):
        self.pad = None

    def bind_pad(self, the_pad):
        self.pad = the_pad

    @abstractmethod
    def handle(self, events):
        pass

    def _pad(self):
        return self.pad

    def pad_position(self):
        return self._pad().vertical_position()

    def move_pad_up(self):
        self._pad().up()

    def move_pad_down(self):
        self._pad().down()
```

Podemos hacer lo mismo con `Ball` y auto encapsular:

```python
    def follow(self):
        if self._ball_position() > self._pad_position():
            self._move_pad_down()
        if self._ball_position() < self._pad_position():
            self._move_pad_up()
            
    def _ball_position(self):
        return self.ball.rect.y
    
    # ...
```

De nuevo, ahora es fácil ver que `Ball` debería exponer algún método para acceder a su posición:

```python
    def _ball_position(self):
        return self.ball.vertical_position()
```

Y así queda la clase:

```python
class ComputerControlEngine(ControlEngine):
    def __init__(self, ball: Ball):
        super().__init__()
        self.ball = ball

    def follow(self):
        if self._ball_position() > self._pad_position():
            self._move_pad_down()
        if self._ball_position() < self._pad_position():
            self._move_pad_up()

    def _ball_position(self):
        return self.ball.vertical_position()

    def handle(self, events):
        for event in events:
            if event.type == COMPUTER_MOVES_EVENT:
                self.follow()

    def _pad_position(self):
        return super().pad_position()

    def _move_pad_up(self):
        super().move_pad_up()

    def _move_pad_down(self):
        super().move_pad_down()
```

¿Qué hemos obtenido?

En comparación con el código que teníamos al principio es cierto que tenemos más líneas de código, pero si leemos el método principal `follow` está todo mucho más claro. El código explica lo que hace en un lenguaje casi natural.

Por otro lado, la dependencia de la super clase está mucho más controlada. `ComputerControlEngine` delega en `ControlEngine` las acciones sobre `Pad`, centrándose solo en `Ball`, que le es propia.

## Refactor para toda la familia

`ControlEngine` tiene tiene otra clase descendiente, que es `KeyboardControlEngine`, y que es la que nos permite controlar al jugador con el teclado. ¿Puede beneficiarse de este refactor también? Vamos a verlo:

```python
class KeyboardControlEngine(ControlEngine):
    def __init__(self, keys):
        super().__init__()
        self.upKey = keys[0]
        self.downKey = keys[1]

    def handle(self, events):
        for event in events:
            if event.type == KEYUP:
                key_name = key.name(event.key)
                if key_name == self.upKey or key_name == self.downKey:
                    self.pad.stop()
            elif event.type == KEYDOWN:
                key_name = key.name(event.key)
                if key_name == self.upKey:
                    self.pad.up()
                elif key_name == self.downKey:
                    self.pad.down()

```

Hay varias cosas que podemos hacer. Por ejemplo, empezaremos a trasladar las acciones sobre `pad` a sus propios métodos:

```python
class KeyboardControlEngine(ControlEngine):
    def __init__(self, keys):
        super().__init__()
        self.upKey = keys[0]
        self.downKey = keys[1]

    def handle(self, events):
        for event in events:
            if event.type == KEYUP:
                key_name = key.name(event.key)
                if key_name == self.upKey or key_name == self.downKey:
                    self._stop_pad()
            elif event.type == KEYDOWN:
                key_name = key.name(event.key)
                if key_name == self.upKey:
                    self._move_pad_up()
                elif key_name == self.downKey:
                    self._move_pad_down()

    def _stop_pad(self):
        self.pad.stop()

    def _move_pad_down(self):
        self.pad.down()

    def _move_pad_up(self):
        self.pad.up()
```

Esto es muy parecido a lo que hicimos en `ComputerControlEngine`. De hecho, lo podemos refactorizar de la misma forma, trasladando toda la responsabilidad de accionar el `Pad` a `ControlEngine`.

```python
    def _stop_pad(self):
        super().stop_pad()

    def _move_pad_up(self):
        super().move_pad_up()

    def _move_pad_down(self):
        super().move_pad_down()
```

El hecho de que se repita código en este caso no nos tiene que preocupar.

Ahora nos fijaremos en el procesamiento de los eventos del teclado. Tenemos varias formas de enfocarlo. Antes de empezar, repasemos cómo está:

```python
    def handle(self, events):
        for event in events:
            if event.type == KEYUP:
                key_name = key.name(event.key)
                if key_name == self.upKey or key_name == self.downKey:
                    self._stop_pad()
            elif event.type == KEYDOWN:
                key_name = key.name(event.key)
                if key_name == self.upKey:
                    self._move_pad_up()
                elif key_name == self.downKey:
                    self._move_pad_down()
```

El problema más obvio es que consultamos las teclas pulsadas accediendo a propiedades para ver si ha sido la de mover hacia arriba o la de mover hacia abajo.

Por otro lado, la variable que contiene la tecla pulsada la hemos llamado key_name, que sin ser incorrecto es muy impreciso. Un nombre mejor sería `pressed_key`. Y en el caso del evento de haber dejado de pulsar una teclas, sería `released_key`.

```python
    def handle(self, events):
        for event in events:
            if event.type == KEYUP:
                released_key = key.name(event.key)
                if released_key == self.upKey or released_key == self.downKey:
                    self._stop_pad()
            elif event.type == KEYDOWN:
                pressed_key = key.name(event.key)
                if pressed_key == self.upKey:
                    self._move_pad_up()
                elif pressed_key == self.downKey:
                    self._move_pad_down()
```

Lo que nos importa es controlar que las teclas accionadas son las que se han definido como tecla para mover hacia arriba o para mover hacia abajo. Así que podríamos expresarlo encapsulando la condición en un método.

```python
class KeyboardControlEngine(ControlEngine):
    def __init__(self, keys):
        super().__init__()
        self.upKey = keys[0]
        self.downKey = keys[1]

    def handle(self, events):
        for event in events:
            if event.type == KEYUP:
                released_key = key.name(event.key)
                if released_key == self.upKey or released_key == self.downKey:
                    self._stop_pad()
            elif event.type == KEYDOWN:
                pressed_key = key.name(event.key)
                if self._up_key_was_pressed(pressed_key):
                    self._move_pad_up()
                elif self._down_key_was_pressed(pressed_key):
                    self._move_pad_down()
    # ...

    def _up_key_was_pressed(self, pressed_key):
        return pressed_key == self.upKey

    def _down_key_was_pressed(self, pressed_key):
        return pressed_key == self.downKey
```

Una cuestión interesante es que podríamos encapsular también la obtención de la tecla presionada:

```python
class KeyboardControlEngine(ControlEngine):
    def __init__(self, keys):
        super().__init__()
        self.upKey = keys[0]
        self.downKey = keys[1]

    def handle(self, events):
        for event in events:
            if event.type == KEYUP:
                released_key = self._get_key(event)
                if released_key == self.upKey or released_key == self.downKey:
                    self._stop_pad()
            elif event.type == KEYDOWN:
                pressed_key = self._get_key(event)
                if self._up_key_was_pressed(pressed_key):
                    self._move_pad_up()
                elif self._down_key_was_pressed(pressed_key):
                    self._move_pad_down()
    # ...

    def _get_key(self, event):
        return key.name(event.key)

    def _up_key_was_pressed(self, pressed_key):
        return pressed_key == self.upKey

    def _down_key_was_pressed(self, pressed_key):
        return pressed_key == self.downKey

```

Y tiene mucho sentido que en lugar de obtener la tecla presionada en el evento y pasársela a la función que verifica cual es, podemos encapsular ese paso también:

```
    def _up_key_was_pressed(self, event):
        return self._get_key(event) == self.upKey

    def _down_key_was_pressed(self, event):
        return self._get_key(event) == self.downKey

    @staticmethod
    def _get_key(event):
        return key.name(event.key)
```

Lo que deja esa parte del código más limpia:

```python
    def handle(self, events):
        for event in events:
            if event.type == KEYUP:
                released_key = self._get_key(event)
                if released_key == self.upKey or released_key == self.downKey:
                    self._stop_pad()
            elif event.type == KEYDOWN:
                if self._up_key_was_pressed(event):
                    self._move_pad_up()
                elif self._down_key_was_pressed(event):
                    self._move_pad_down()
```

Y podemos refactorizar el procesamiento del evento KEYUP de la misma manera:

```python
    def handle(self, events):
        for event in events:
            if event.type == KEYUP:
                if self._control_key_was_released(event):
                    self._stop_pad()
            elif event.type == KEYDOWN:
                if self._up_key_was_pressed(event):
                    self._move_pad_up()
                elif self._down_key_was_pressed(event):
                    self._move_pad_down()

    def _control_key_was_released(self, event):
        return self._get_key(event) == self.upKey or self._get_key(event) == self.downKey
        
    # ...
```

## Separar iteraciones de acciones

En el artículo anterior no incluí ejemplos de esta táctica, vamos a intentar hacerlo ahora.

El método `handle` asume que le podemos pasar un array de eventos y procesa cada uno. Así que simplemente podemos poner el cuerpo del bucle en un método:

```python
    def handle(self, events):
        for event in events:
            self._handle_keyboard_event(event)

    def _handle_keyboard_event(self, event):
        if event.type == KEYUP:
            if self._control_key_was_released(event):
                self._stop_pad()
        elif event.type == KEYDOWN:
            if self._up_key_was_pressed(event):
                self._move_pad_up()
            elif self._down_key_was_pressed(event):
                self._move_pad_down()
```

También podríamos aplicar un principio similar para aislar cada `pata` de las condicionales, lo que hará que sea más fáciles de entender:

```python
    def handle(self, events):
        for event in events:
            self._handle_keyboard_event(event)

    def _handle_keyboard_event(self, event):
        if event.type == KEYUP:
            self.__handle_released_keys(event)
        elif event.type == KEYDOWN:
            self._handle_pressed_keys(event)

    def _handle_pressed_keys(self, event):
        if self._up_key_was_pressed(event):
            self._move_pad_up()
        elif self._down_key_was_pressed(event):
            self._move_pad_down()

    def __handle_released_keys(self, event):
        if self._control_key_was_released(event):
            self._stop_pad()

    def _control_key_was_released(self, event):
        return self._get_key(event) == self.upKey or self._get_key(event) == self.downKey

```

Hemos separado toda la lógica en métodos con un nombre significativo. Podemos leer el método handle y entender qué hace y profundizar si lo necesitamos.

Lo único que nos queda es mejorar un poco el nombre y manejo de las propiedades `keyUp` y `keyDown`.

Y este es el resultado:

```python
from pygame import key, KEYDOWN, KEYUP

from pong.game.control.control_engine import ControlEngine


class KeyboardControlEngine(ControlEngine):
    def __init__(self, keys):
        super().__init__()
        self.keys = keys

    def handle(self, events):
        for event in events:
            self._handle_keyboard_event(event)

    def _handle_keyboard_event(self, event):
        if event.type == KEYUP:
            self.__handle_released_keys(event)
        elif event.type == KEYDOWN:
            self._handle_pressed_keys(event)

    def _handle_pressed_keys(self, event):
        if self._up_key_was_pressed(event):
            self._move_pad_up()
        elif self._down_key_was_pressed(event):
            self._move_pad_down()

    def __handle_released_keys(self, event):
        if self._control_key_was_released(event):
            self._stop_pad()

    def _control_key_was_released(self, event):
        return self._up_key_was_released(event) or self._down_key_was_released(event)

    def _down_key_was_released(self, event):
        return self._get_key(event) == self._down_key()

    def _up_key_was_released(self, event):
        return self._get_key(event) == self._up_key()

    def _stop_pad(self):
        super().stop_pad()

    def _move_pad_up(self):
        super().move_pad_up()

    def _move_pad_down(self):
        super().move_pad_down()

    def _up_key_was_pressed(self, event):
        return self._get_key(event) == self._up_key()

    def _down_key_was_pressed(self, event):
        return self._get_key(event) == self._down_key()

    def _up_key(self):
        return self.keys[0]

    def _down_key(self):
        return self.keys[1]

    @staticmethod
    def _get_key(event):
        return key.name(event.key)
```

## Repasando

Después de todo el trabajo de refactor nos encontramos con que el código de la clase se ha hecho más largo. En contrapartida los métodos son ahora mucho más cortos, la mayoría tiene solo una línea, y también más auto explicativos. 

Los niveles de abstracción están más definidos y tenemos menos cosas en las que pensar en cada uno de los niveles, con lo que el código se hace más fácil de seguir con la ayuda de las herramientas de navegación de código del IDE.

Un punto especialmente interesante es haber aligerado el acoplamiento de las clases hijas con respecto a su super clase. Esto es algo que se suele pasar por alto, pero que a la larga se agradece.
