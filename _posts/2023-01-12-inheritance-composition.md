---
layout: post
title: Sobre herencia, composición y cosas de encapsulación
categories: [articles]
tags: [python, good-practices, oop]
---

Me apetecía volver a abordar algunos temas más teóricos sobre OOP y así romper un poco la monotemática de la serie de Dungeon. Aun así, tomaré algunos ejemplos del juego.

Recientemente, he visto algunos ejemplos de abuso de la herencia, lo que posiblemente ha activado algún resorte en mi cerebro para volver a retomar este tema. Vamos por el principio.

## Herencia en orientación a objetos

La _herencia_ es una propiedad de los lenguajes orientados a objetos gracias a la cual podemos crear nuevas clases a partir de otras, cambiando solo algunos aspectos de su comportamiento que nos interesan. El procedimiento para realizar la herencia se llama _extensión_. Cuando extendemos una clase, lo que hacemos introducir una nueva subclase que deriva de la base, sobreescribiendo algunos de sus métodos. 

De este modo, la subclase podrá atender con su propio código algunos mensajes. Pero si recibe mensajes que no pueda manejar por sí misma, los delegará a su clase base.

Técnicamente, no hay ninguna restricción para extender una clase añadiendo nuevos métodos o propiedades en las subclases. Esto lleva a pensar, erróneamente, que podemos usar el mecanismo de la herencia para reutilizar código, creando clases nuevas a partir de otras que tengan el comportamiento deseado. Sin embargo, esto es una fuente de grandes problemas porque genera un acoplamiento atroz, que no siempre es fácil de resolver.

Es más, se suele decir que la relación de herencia es la de mayor acoplamiento, puesto que las clases derivadas no podrían funcionar sin la clase base de ningún modo.

La herencia se regula mediante la aplicación del Principio de sustitución de Liskov. Este principio básicamente nos dice que los subtipos deben poder sustituir a sus tipos base en un programa sin que su funcionalidad se resienta ni haya que cambiar código para hacerlo. Expresado de una manera más formal, el principio establece que los subtipos no pueden:

* Reforzar las precondiciones: restringir los tipos de datos o los rangos de validez en las clases hijas con respecto a las clases base.
* Debilitar las post-condiciones: permitir devolver más tipos de datos en las clases hijas o en rangos más amplios. Por ejemplo, si la clase base devuelve un objeto, en la clase hija permitir que pueda devolver `null`.
* Alterar las invariantes de sus tipos base: por ejemplo, si la clase base tiene un límite de agregación, eliminar ese límite en las clases hijas.
* Modificar el estado interno de un objeto de una manera imposible para el tipo base.

Veamos un ejemplo. Muchos lenguajes incluyen una clase `String` para representar cadenas de caracteres. En un lenguaje sin tipos primitivos que sean objetos, como PHP, podrías crearlo tú misma. Una precondición sería que para ser válido el objeto debe inicializarse con una cadena de caracteres, aunque sea vacía, nunca con _null_.

Ahora imagina que quieres crear un value object para representar un nombre de usuario. llamémosle `Username`. Por supuesto, este nombre nunca debería estar vacío por lo que necesitas una condición más _fuerte_: la cadena debe contener al menos un carácter. 

Una idea en la que podrías pensar es en extender la clase `String` dado que algunas funcionalidades de `String` te interesan para que estén disponibles en `Username`.

```python
class Username(str):
    def __new__(cls, username):
        if len(username) == 0:
            raise ValueError
        return super().__new__(cls, username)
```

Ahora, por ejemplo, puedes representar este `Username` con todo mayúsculas:

```python
class TestUsername(TestCase):
    def test_can_uppercase(self):
        my_username = Username("talkingbit")
        self.assertEqual("TALKINGBIT", my_username.upper())
```

El problema es que no puedes emplear `Username` en lugar de `String`. ¿Por qué? Porque `Username` impone una precondición más fuerte o restrictiva que `String` y habrá casos en los que puedas querer objetos que contienen cadenas de caracteres vacías, algo que `Username` no permite, pero `String` sí.

Si ejecutas estos dos tests verás que el segundo no puede correr porque fallará al instanciar `Username`, demostrando que no podemos reemplazar un `string` con `Username`.

```python
class TestUsername(TestCase):
    def test_string_preconditions(self):
        string = ""
        self.assertEqual("", string.upper())

    def test_username_preconditions(self):
        username_string = Username("")
        self.assertEqual("", username_string.upper())
```

_Nota al margen_: De hecho, heredar de un tipo básico puede ser, como mínimo, _extraño_ en algunos lenguajes. Por ejemplo, en Python, `String` es inmutable por lo que en lugar de sobreescribir `__init__` tenemos que sobreescribir `__new__` para devolver una nueva instancia, algo que resulta poco obvio si no conoces a fondo estos detalles del lenguaje.

Aparte de esto, hay que considerar la cuestión de que `Username` se lleva consigo todos los métodos que tenga `String` y que pueden ser útiles o no. Es más, es posible que yo no quiera que la mayoría de los métodos de `String` estén disponibles en `Username`, para lo cual tendría que sobreescribirlos y anularlos de algún modo. Por ejemplo, para que arrojen una excepción.

```python
class Username(str):
    def __new__(cls, username):
        if len(username) == 0:
            raise ValueError
        return super().__new__(cls, username)

    def capitalize(self) -> str:
        raise NotImplementedError

```

Si hacemos pasar el mismo test a `string` y a `Username`, vemos que no se pueden intercambiar. Un test falla y el otro no.

```python
class TestUsername(TestCase):
    def test_string_capitalize(self): # Will fail
        username = "talkingbit"
        self.assertRaises(NotImplementedError, username.capitalize)
    def test_username_does_not_capitalize(self):
        username = Username("talkingbit")
        self.assertRaises(NotImplementedError, username.capitalize)
```

Como puedes ver, una buena forma de saber si una jerarquía de herencia está bien establecida es pasar los mismos tests de la clase base con las clases hijas.

En la práctica esto significa que solo deberíamos extender clases para especializar comportamientos en los subtipos.

## Composición

Entonces, ¿cómo resuelvo el problema de disponer de funcionalidad de `String` en `Username`. Pues mediante composición. De hecho, es lo que hacemos habitualmente, sin darnos cuenta, cuando hacemos algo así:

```python
class Username:
    def __init__(self, username):
        self.value = username
```

El parámetro `username` es un string de Python y si quisiéramos tener, por ejemplo, un método para mostrarlo en `uppercase`, podríamos simplemente delegar el mensaje en la propiedad `value` que es un objeto string que entiende el mensaje `upper`:

```python
class Username:
    def __init__(self, username):
        self.value = username

    def upper(self) -> str:
        return self.value.upper()
```

La composición es el procedimiento para construir un objeto usando otros y obtener los comportamientos deseados, de modo que el objeto compuesto delegue en sus colaboradores parte de su comportamiento.

Cuando lo hacemos así la interfaz del objeto compuesto puede evolucionar independientemente de la de sus objetos colaboradores. De este modo, `Username` puede tener el método `upper`, al igual que lo tiene `str`, pero no necesita tener ningún otro método de `str`. En realidad, ni siquiera necesita que ese método se llame `upper`, sino que podríamos usar una nomenclatura más acorde con el dominio de nuestra aplicación o módulo:

```python
class Username:
    def __init__(self, username):
        self.value = username

    def list_name(self) -> str:
        return self.value.upper()
```

En realidad, quizá la pregunta esté un poco mal planteada. La herencia nunca se debe interpretar como un mecanismo para obtener funcionalidad que está en otra clase. En ese sentido, la composición no es una alternativa a la herencia, sino la forma adecuada de que un objeto pueda implementar un comportamiento con la ayuda de otros.

## Un ejemplo que mezcla herencia y composición

En Dungeon tenemos dos objetos muy similares, que cumplen funciones parecidas:

* `Backpack`: que representa la colección de objetos que posee la jugadora.
* `Things`: que representa la colección de objetos que hay en una habitación.

Este es el código de ambas:

```python
class Backpack:
    def __init__(self):
        self._items = dict()

    def append(self, item):
        self._items[item.id()] = item

    def content(self):
        content = []
        for key, item in self._items.items():
            content.append(item.name().to_s())

        return ", ".join(content)

    def get(self, thing_name):
        thing_id = ThingId.normalized(thing_name)
        if thing_id in self._items.keys():
            return self._items.pop(thing_id)
```


```python
class Things:
    def __init__(self):
        self._things = dict()

    def put(self, a_thing):
        self._things[a_thing.id()] = a_thing

    def look(self):
        if len(self._things) > 0:
            response = "There are:\n"
            for thing in self._things.values():
                response += "* {}\n".format(thing.name().to_s())
        else:
            response = "There are no objects\n"
        return response

    def get(self, thing_name):
        thing_id = ThingId.normalized(thing_name)
        if thing_id in self._things.keys():
            return self._things.pop(thing_id)
        return None
```

Como se puede ver son muy parecidas en estructura y lógica. ¿Podrían ambas extender de una misma clase base (¿`ThingsBag`?) para poder reutilizar el código? ¿Se trata de un caso del _smell_ _Alternative Classes with Different Interfaces_?

Lo primero que hay que decir es que la duplicación de código, no implica duplicación de conocimiento. `Backpack` y `Things` son conceptos parecidos, con una mecánica similar, pero no representan lo mismo.

Por ejemplo, aunque no está todavía representado en el código, la idea es que `Backpack` tenga una capacidad limitada, mientras que no existe un límite para la cantidad de objetos que pueden caber en `Things`.

Sin embargo, tanto `Backpack` como `Things` hacen uso de una estructura de datos similar: un diccionario. Esto es, `Backpack` y `Things` implementan gran parte de su funcionalidad mediante la composición de un objeto `dict`. Internamente, son colecciones que tienen métodos para:

* Guardar items
* Recuperar items conociendo su identificador
* Obtener un inventario de los items contenidos

Lo que ocurre es que `dict` no es una estructura completamente adecuada para representar esta colección y necesitamos añadir algo de código para que se comporte de la forma deseada. Eso me lleva a pensar que debería haber algo entre `Backpack`/`Things` y `dict` que proporcione la funcionalidad de colección que necesitan. Podríamos llamarla `ThingsCollection`.

¿Podría esta `ThingsCollection` extender de `dict`?. Vamos a ver. Para extender de `dict`, `ThingsCollection` debería poder reemplazarla. Pero `ThingsCollection` solo puede guardar objetos `Thing`, lo cual es una precondición más restrictiva que la que tiene `dict`. Aparte necesitaríamos un método para obtener el inventario bastante específico. En consecuencia, no vamos a extender `dict`.

En su lugar haremos que `ThingsCollection` utilice `dict` internamente, actuando de objeto especialista en gestionar colecciones de objetos.

Para hacer el refactor lo primero que nos conviene hacer es tratar de igualar lo más posible `Backpack` y `Things`. Refactorizaremos el código para acentuar las semejanzas y aislar las diferencias.

Este es un primer paso. Como se puede ver, he cambiado algunos nombres de métodos. 

```python
class Backpack:
    def __init__(self):
        self._things = dict()

    def append(self, a_thing):
        self._things[a_thing.id()] = a_thing

    def inventory(self):
        content = []
        for key, item in self._things.items():
            content.append(item.name().to_s())

        return ", ".join(content)

    def get(self, thing_name):
        thing_id = ThingId.normalized(thing_name)
        if thing_id in self._things.keys():
            return self._things.pop(thing_id)
        return None
```

```python
class Things:
    def __init__(self):
        self._things = dict()

    def append(self, a_thing):
        self._things[a_thing.id()] = a_thing

    def inventory(self):
        if len(self._things) > 0:
            response = "There are:\n"
            for thing in self._things.values():
                response += "* {}\n".format(thing.name().to_s())
        else:
            response = "There are no objects\n"
        return response

    def get(self, thing_name):
        thing_id = ThingId.normalized(thing_name)
        if thing_id in self._things.keys():
            return self._things.pop(thing_id)
        return None
```

El método `inventory` usa distinto código para hacer casi lo mismo, así que vamos a ver si lo podemos igualar de alguna manera. Esencialmente, Inventory en `Things` es más _verboso_, mientras que en `Backpack` la iteración parece un poco más sencilla y elegante.

Vamos a comparar:

|                       | Backpack | Things               |
|-----------------------|----------|----------------------|
| Prefijo               | No       | There are:\n         |
| Formato item          | {}       | * {}                 |
| Union items           | ,        | No                   |
| Texto si no hay items | No       | There are no objects |

Podemos crear una función `inventory` parametrizable que nos sirva para ambos casos:

```python
class Backpack:
    def __init__(self):
        self._things = dict()

    def append(self, a_thing):
        self._things[a_thing.id()] = a_thing

    def inventory(self):
        return self._things_inventory(
            prefix="",
            item_format="{}",
            item_join=", ",
            empty=""
        )

    def _things_inventory(self, prefix, item_format, item_join, empty):
        if len(self._things) > 0:
            return prefix + self._item_listing(item_format, item_join)
        else:
            return empty

    def _item_listing(self, item_format: object, join_string: object) -> object:
        content = []
        for key, item in self._things.items():
            content.append(item_format.format(item.name().to_s()))
        return join_string.join(content)

    def get(self, thing_name):
        thing_id = ThingId.normalized(thing_name)
        if thing_id in self._things.keys():
            return self._things.pop(thing_id)
        return None
```

```python
class Things:
    def __init__(self):
        self._things = dict()

    def append(self, a_thing):
        self._things[a_thing.id()] = a_thing

    def inventory(self):
        return self._things_inventory(
            prefix="There are:\n",
            item_format="* {}",
            item_join="\n",
            empty="There are no objects\n"
        )

    def _things_inventory(self, prefix, item_format, item_join, empty):
        if len(self._things) > 0:
            return prefix + self._item_listing(item_format, item_join)
        else:
            return empty

    def _item_listing(self, item_format, join_string):
        content = []
        for key, item in self._things.items():
            content.append(item_format.format(item.name().to_s()))
        return join_string.join(content)

    def get(self, thing_name):
        thing_id = ThingId.normalized(thing_name)
        if thing_id in self._things.keys():
            return self._things.pop(thing_id)
        return None
```

Ahora podríamos extraer toda la funcionalidad común a una clase `ThingsCollection`, de modo que ni `Backpack` ni `Things` necesiten saber los detalles internos de cómo guardar o recuperar cosas. Simplemente, le preguntan al objeto colaborador que gestiona ese almacenamiento.

Pero antes, vamos a hacer una cosa. Vamos a ocultar a los métodos de `Backpack` y `Things` la estructura de datos que mantiene sus objetos mediante una técnica de auto encapsulación.

Vamos a verlo en `Backpack`. En lugar de manipular directamente `self._things`, lo hacemos a través de un método de tal manera que el método _público_ no sabe qué estructura de datos lo gestiona:

```python
class Backpack:
    def __init__(self):
        self._things = dict()

    def append(self, a_thing):
        self._store_thing(a_thing)

    def _store_thing(self, a_thing):
        self._things[a_thing.id()] = a_thing

    # Removed code

    def get(self, thing_name):
        return self._retrieve_thing(thing_name)

    def _retrieve_thing(self, thing_name):
        thing_id = ThingId.normalized(thing_name)
        if thing_id in self._things.keys():
            return self._things.pop(thing_id)
        return None
```

De este modo, es fácil identificar qué código queremos mover a otra clase. Y, de hecho, `Backpack` no se va a enterar del cambio.

Esta es la nueva clase:

```python
class ThingsCollection:
    def __init__(self):
        self._things = dict()

    def store(self, a_thing):
        self._things[a_thing.id()] = a_thing

    def retrieve(self, thing_name):
        thing_id = ThingId.normalized(thing_name)
        if thing_id in self._things.keys():
            return self._things.pop(thing_id)
        return None

    def inventory(self, prefix, item_format, item_join, empty):
        if len(self._things) > 0:
            return prefix + self._item_listing(item_format, item_join)
        else:
            return empty

    def _item_listing(self, item_format: object, join_string: object) -> object:
        content = []
        for key, item in self._things.items():
            content.append(item_format.format(item.name().to_s()))
        return join_string.join(content)
```

Ahora, empezamos a usarla:

```python
class Backpack:
    def __init__(self):
        self._collection = ThingsCollection()

    def append(self, a_thing):
        self._store_thing(a_thing)

    def _store_thing(self, a_thing):
        self._collection.store(a_thing)

    def inventory(self):
        return self._things_inventory(
            prefix="",
            item_format="{}",
            item_join=", ",
            empty=""
        )

    def _things_inventory(self, prefix, item_format, item_join, empty):
        return self._collection.inventory(prefix, item_format, item_join, empty)

    def get(self, thing_name):
        return self._retrieve_thing(thing_name)

    def _retrieve_thing(self, thing_name):
        return self._collection.retrieve(thing_name)
```

Y lo mismo en `Things`:

```python
class Things:
    def __init__(self):
        self._collection = ThingsCollection()

    def append(self, a_thing):
        self._store_thing(a_thing)

    def _store_thing(self, a_thing):
        self._collection.store(a_thing)

    def inventory(self):
        return self._things_inventory(
            prefix="There are:\n",
            item_format="* {}",
            item_join="\n",
            empty="There are no objects\n"
        )

    def _things_inventory(self, prefix, item_format, item_join, empty):
        return self._collection.inventory(prefix, item_format, item_join, empty)

    def get(self, thing_name):
        return self._retrieve_thing(thing_name)

    def _retrieve_thing(self, thing_name):
        return self._collection.retrieve(thing_name)
```

El resultado es que tenemos dos clases separadas que representan conceptos distintos, pero que comparten una implementación común gracias a usar un mismo colaborador.

Ahora podemos permitir que cada una se ocupe de sus propias reglas de negocio. Por ejemplo, hemos dicho que Backpack solo admitirá cinco elementos como máximo:

```python
class BackpackTestCase(unittest.TestCase):
    def test_allows_maximum_of_elements(self):
        backpack = Backpack()
        backpack.append(Thing.from_raw("1"))
        backpack.append(Thing.from_raw("2"))
        backpack.append(Thing.from_raw("3"))
        backpack.append(Thing.from_raw("4"))
        backpack.append(Thing.from_raw("5"))
        with self.assertRaises(IndexError):
            backpack.append(Thing.from_raw("6"))
```

Para implementarlo podemos hacer algo así, añadiendo un método `count` a `ThingsCollection`. Es decir, `Backpack` se ocupa de mantener sus invariantes, mientras que `ThingsCollection` gestiona la tarea de mantener la colección.

```python
class Backpack:
    def __init__(self):
        self._collection = ThingsCollection()

    def append(self, a_thing):
        if self._is_full():
            raise IndexError
        self._store_thing(a_thing)

    # Removed code

    def _is_full(self):
        return self._collection.count() >= 5
```

Podemos mejorar este diseño aplicando agresivamente la auto-encapsulación y permitiendo que el límite de capacidad de la mochila sea configurable.

```python
class Backpack:
    def __init__(self, capacity=5):
        self._capacity = capacity
        self._collection = ThingsCollection()

    def append(self, a_thing):
        if self._is_full():
            raise IndexError
        self._store_thing(a_thing)

    def _is_full(self):
        return self._collection.count() >= self._max_capacity()

    def _max_capacity(self):
        return self._capacity

    def _store_thing(self, a_thing):
        self._collection.store(a_thing)

    def inventory(self):
        return self._things_inventory(
            prefix="",
            item_format="{}",
            item_join=", ",
            empty=""
        )

    def _things_inventory(self, prefix, item_format, item_join, empty):
        return self._collection.inventory(prefix, item_format, item_join, empty)

    def get(self, thing_name):
        return self._retrieve_thing(thing_name)

    def _retrieve_thing(self, thing_name):
        return self._collection.retrieve(thing_name)
```

Lo que podemos ver aquí es que los métodos públicos (append, inventory, get), que definen los mensajes a los que `Backpack` puede responder solo invocan directamente métodos privados de sí misma. Se puede decir que no saben que hay un colaborador (`ThingsCollection`) haciendo el trabajo. Esto nos da la libertad de cambiarlo si fuese necesario.

En cuanto a la capacidad de la mochila, ocurre un poco parecido. Tenemos un método que nos dice cuál es la capacidad de la mochila, pero los métodos que necesitan saberlo, no dependen directamente de esta propiedad. De nuevo, esto separa los algoritmos de sus dependencias y permite que cambien de manera independiente.

Por cierto, que incorporar esta regla hará que tengamos que cambiar un poco el código del juego para gestionar el error. No lo voy a mostrar en este artículo para no salirme del foco.

## Herencias sólidas

Las jerarquías de herencias deberían ser poco profundas. Idealmente de un solo nivel: una clase base y varias clases que deriven directamente de ella.

Si la jerarquía es profunda y muy ramificada introduce mucha complejidad y, probablemente, revela algún problema de diseño. Por ejemplo, cuando hay varios ejes de especialización la jerarquía crece de forma combinatoria. Eso podría ser un indicador de que necesitamos composición también.

Por otro lado, el objetivo de una jerarquía de herencia es representar especializaciones del comportamiento del concepto general.

Veamos, por ejemplo, el caso de `Command` en Dungeon.

La clase base `Command` proporciona una estructura abstracta del comportamiento de un command en el juego: simplemente se asegura de que el receiver tiene un método adecuado al comando y lo ejecuta, pasándole el argumento pertinente:

```python
class Command:

    def __init__(self, argument):
        self._argument = argument

    def do(self, receiver):
        if hasattr(receiver, self.name()):
            getattr(receiver, self.name())(self.argument())

    def name(self):
        return ""

    def cost(self):
        return EnergyUnit(1)

    def argument(self):
        if hasattr(self, "_argument"):
            return self._argument

        return ""
```

El método `do` es un _template method_. Define un algoritmo cuyos detalles se encarga de rellenar cada subclase, implementando los métodos `name()` y `argument()`. Por ejemplo:

```python
class GetCommand(Command):
    def __init__(self, argument):
        super().__init__(argument)

    def name(self):
        return "get"
```

`GetCommand` no necesita implementar su propia versión de `do`, pero especializa su comportamiento a través del método `name`. Cuando llama a `GetCommand.do(receiver)`, lo que se hace es buscar el método `get` en el `receiver` y ejecutarlo.

Este es una forma ideal de desarrollar una jerarquía de herencia. La parte común del comportamiento está en la clase base, mientras que cada sub clase lo especializa.

En algunas jerarquías, las sub clases posiblemente redefinirán más el comportamiento especializado. Esto es correcto en tanto no cambiemos las reglas que mencionábamos arriba sobre precondiciones, postcondiciones e invariantes.

## La relación _es-una_

Desde un punto de vista semántico, la herencia es una forma de modelar relaciones del tipo _es una_. En estas relaciones las clases derivadas son del mismo tipo que la clase base y pueden intercambiarse.

En el ejemplo que acabamos de ver hace un momento, todos los objetos **Command** son intercambiables. Todos ellos _son_ **Command**.

Por otro lado, es posible establecer otras modalidades de relaciones _es una_. En este caso no basada en la identidad de tipo o en la intercambiabilidad de tipo y subtipo, sino en lo que podríamos denominar identidad por rol. En este caso diríamos que dos clases son equivalentes porque pueden ejercer el mismo rol, independientemente de su origen.

En algunos lenguajes esto se define mediante interfaces explícitas. En otros, mediante _duck-typing_. Esto es, objetos que pueden responder a los mismos mensajes.

Un ejemplo de esto podrían ser los objetos que cumplen el rol definido por `Boundary`. En Python podemos simular una interfaz explícita simplemente definiendo una clase base que no implementa ningún método.

```python
class Boundary:
    def go(self):
        pass

    def look(self):
        pass

    def description(self):
        pass
```

Podemos ser un poco más exigentes:

```python
class Boundary:
    def go(self):
        raise NotImplementedError

    def look(self):
        raise NotImplementedError

    def description(self):
        raise NotImplementedError
```

Soy consciente de que hay otras formas de hacer esto en Python, como ABC (Abstract Base Class), pero creo que es más fácil verlo así.

`Wall`, `Door`, `Exit` y el decorador `Locked` son `Boundary` en tanto que desempeñan ese rol. Son intercambiables, en el sentido de que responden a los mismos mensajes, cada uno a su manera.

## Arreglando una jerarquía incorrecta

A continuación me gustaría mostrar un ejemplo de mal uso de la herencia. 

```
Boundary
    +--Wall
    +--Door
         +--Exit
         +--Locked (decorator)
```

La razón por la que `Exit` y `Locked` descienden de `Door` es para usar los métodos que les permiten publicar eventos. Justamente, esta es una mala razón para heredar de otra clase. La relación _es-una_ ya está establecida por el hecho de _implementar_ la interfaz o rol de `Boundary`.

El objetivo, inicialmente es este:

```
Boundary
    +--Wall
    +--Door
    +--Exit
    +--Locked (decorator)
```

En principio, es tan simple como copiar en las clases hijas los métodos relacionados con la publicación de eventos. Aquí tenemos tanto `Exit` como `Locked`. Todavía extienden de Door, pero no delegan.

```python
class Exit(Door):
    def __init__(self):
        self._subject = Subject()

    def go(self):
        self._notify_observers(PlayerExited())

    def description(self):
        return "There is a door"

    def register(self, observer):
        self._subject.register(observer)

    def _notify_observers(self, event):
        self._subject.notify_observers(event)


class Locked(Door):
    def __init__(self, door, secret):
        self._door = door
        self._secret = secret
        self._is_locked = True
        self._subject = Subject()

    def go(self):
        if self._is_locked:
            self._notify_observers(DoorWasLocked())
        else:
            self._door.go()

    def description(self):
        template = "{} (locked)" if self._is_locked else "{} (unlocked)"
        return template.format(self._door.description())

    def unlock_with(self, key):
        self._is_locked = not key.match(self._secret)
        what_happened = DoorWasLocked() if self._is_locked else DoorWasUnlocked()
        self._notify_observers(what_happened)

    def register(self, observer):
        super().register(observer)
        self._door.register(observer)

    def _notify_observers(self, event):
        self._subject.notify_observers(event)
```

Y ahora ya pueden extender directamente de `Boundary`. Hay un pequeño cambio en el `register()` de `Locked`, que ahora tiene que registrar el _observer_.

```python
class Exit(Boundary):
    # Removed code

    def register(self, observer):
        self._subject.register(observer)

    def _notify_observers(self, event):
        self._subject.notify_observers(event)


class Locked(Boundary):
    # Removed code

    def register(self, observer):
        self._subject.register(observer)
        self._door.register(observer)

    def _notify_observers(self, event):
        self._subject.notify_observers(event)
```

Esto está mejor, pero ahora tenemos un montón de código repetido en muchos lugares. Se puede ver en el fragmento de código anterior. Todos los objetos capaces de notificar eventos tiene que implementar los mismos métodos, pero no lo tenemos explicitado.

En cualquier caso, es claramente un rol. Todos estos objetos tienen un rol de `Observed` o `CanBeObserved`. Y, como veremos, tenemos un rol recíproco de `Observer`. Voy a quedarme con `CanBeObserved` por su significado y porque es visualmente más distinguible de `Observer`.

Hay dos cuestiones interesantes. En el rol de `CanBeObserved` el método `_notify_observers` hace siempre lo mismo. Le decimos qué evento notificar y se lo pasa a los observers que se hayan definido para este objeto particular. Es decir, hay una funcionalidad común que podría ser implementada por una clase base.

El método `register` puede ser un poco diferente. Algunos de los `CanBeObserved` a veces tienen que gestionar el `register` de alguno de sus colaboradores.

¿Cómo refactorizar todo esto? Python nos permite herencia múltiple y podríamos usarla para implementar este diseño. En otros lenguajes podríamos usar múltiples interfaces, con lo que una misma clase puede tener métodos que implementan cada una de ellas, de modo que se exponen con un rol u otro a distintos consumidores.

En cuanto a compartir código, existen diversos mecanismos según los lenguajes. PHP, por ejemplo, permite usar los Traits, como forma de compartir funcionalidad de manera transversal. En Python, como he mencionado, podríamos hacerlo a través de la herencia múltiple.

Mi primera idea sería heredar de `Subject`. Ahora mismo usamos `Subject` como colaborador en la mayor parte de implementaciones de estos métodos. Esto hace que el código se repita mucho. Pese a esa inconveniencia es una solución correcta.

Pero en este caso, extender de `Subject` parece buena idea, ya que elimina la mayor parte de código repetitivo, a la vez que nos deja sobreescribir métodos cuando es necesario. Por otro lado, podemos cambiar el nombre de Subject por `CanBeObserved`.

```python
class CanBeObserved:
    def __init__(self):
        self._observers = []

    def register(self, observer):
        if observer in self._observers:
            return

        self._observers.append(observer)

    def notify_observers(self, event):
        for observer in self._observers:
            observer.notify(event)
```

Este cambio deja los tests pasando, asi que vamos a por el siguiente paso. 

Hay un tema que tenemos que tener en cuenta y es que nuestros objetos ahora invocan el método protegido `_notify_observers`, así que voy a añadir un alias:

```python
class CanBeObserved:
    def __init__(self):
        self._observers = []

    def register(self, observer):
        if observer in self._observers:
            return

        self._observers.append(observer)

    def notify_observers(self, event):
        for observer in self._observers:
            observer.notify(event)

    def _notify_observers(self, event):
        return self.notify_observers(event)
```

Y, con esto, podemos empezar a migrar progresivamente todos nuestros objetos a `CanBeObserved`. Por ejemplo:

```python
class Wall(Boundary, CanBeObserved):
    def __init__(self):
        super().__init__()

    def go(self):
        self._notify_observers(PlayerHitWall())

    def look(self):
        self._notify_observers(PlayerGotDescription(self.description()))

    def description(self):
        return "There is a wall"
```

Y así procedemos con todos los casos. Veamos los especiales, como `Locked`:

```python
class Locked(Boundary, CanBeObserved):
    def __init__(self, door, secret):
        self._door = door
        self._secret = secret
        self._is_locked = True
        super().__init__()

    def go(self):
        if self._is_locked:
            self._notify_observers(DoorWasLocked())
        else:
            self._door.go()

    def description(self):
        template = "{} (locked)" if self._is_locked else "{} (unlocked)"
        return template.format(self._door.description())

    def unlock_with(self, key):
        self._is_locked = not key.match(self._secret)
        what_happened = DoorWasLocked() if self._is_locked else DoorWasUnlocked()
        self._notify_observers(what_happened)

    def register(self, observer):
        super().register(observer)
        self._door.register(observer)
```

Hago lo mismo con todos las clases que pueden ser observadas. Realizo el cambio, ejecuto los tests para confirmar que todo ha ido bien y, si es necesario, aplico alguna corrección.

## Descubriendo roles

Como ya hemos visto antes, que haya objetos que pueden ser observados implica la existencia de objetos observadores. Para cumplir su rol deben poder responder al mensaje `notify`.

```python
class Observer:
    def notify(self, event):
        pass
```

Gracias al duck typing realmente no necesitábamos hacer esto. Sin embargo, con el cambio, el código ahora expresa mucho mejor lo que podemos esperar de los distintos objetos. Por ejemplo:

```python
class Player(CanBeObserved, Observer):
    def __init__(self, starting_energy=EnergyUnit(100)):

class Game(Observer):
    def __init__(self, obtain_input, printer):

```

Esto nos servirá para utilizar los _type hints_ más adelante. Ahora, por ejemplo, podríamos forzar a que el método register sollo admita `Observers`.

```python
class CanBeObserved:
    def __init__(self):
        self._observers = []

    def register(self, observer: Observer):
        if observer in self._observers:
            return
        self._observers.append(observer)
```

Otro rol que podemos identificar y que, además, está relacionado con los que hemos introducido, es el de `Event`. En este caso, está implementado como clase base y una jerarquía de un solo nivel:

```python
class Event:
    def name(self):
        return self.__class__.__name__

    def of_type(self, cls):
        return isinstance(self, cls)
```

Igualmente, podemos introducir type hints para dejarlo bien explicitado en el código. Esto me lleva a pensar que tendría sentido llevar esta clase base al mismo módulo, que quedaría así:

```python
class Event:
    def name(self):
        return self.__class__.__name__

    def of_type(self, cls):
        return isinstance(self, cls)


class Observer:
    def notify(self, event: Event):
        pass


class CanBeObserved:
    def __init__(self):
        self._observers = []

    def register(self, observer: Observer):
        if observer in self._observers:
            return
        self._observers.append(observer)

    def notify_observers(self, event: Event):
        for observer in self._observers:
            observer.notify(event)

    def _notify_observers(self, event: Event):
        return self.notify_observers(event)
```

## Para terminar

En este artículo he tratado de profundizar un poco en cuestiones de la herencia en orientación a objetos en tanto sirve para modelar la relación _es-una_, así como resolver algunos de sus problemas.

También hemos tocado el tema de la composición como primera opción cuando lo que queremos es el comportamiento.

Finalmente, hemos hablado de los roles, definidos como interfaces explícitas y que son la alternativa a la herencia cuando queremos tener objetos que pueden desempeñar el mismo rol aunque no tengan una relación de herencia.
