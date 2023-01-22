---
layout: post
title: Como mejorar tus tests
categories: articles
tags: python testing good-practices refactoring
---

En este artículo tomaré algunos ejemplos del proyecto Dungeon y explicaré cómo mejorar tests usando distintas técnicas y
patrones.

Básicamente, he ido visitando tests en el proyecto y escogiendo aquellos que presentaban algún tipo de smell o potencial
de mejora.

## Aumenta la expresividad escondiendo los detalles

Los tests nos tienen que servir para entender de qué trata nuestro software. Parto de la base de que el código de un
proyecto expresa un conocimiento y los tests contribuyen a expresando los _outcomes_ y también el cómo se maneja el
código. Es decir, los tests documentan el código de una manera viva, ejecutable y observable. Por eso, no basta con
tener tests, los tests tienen que ser significativos y expresivos.

Veamos este ejemplo. Este test verifica que podemos guardar un máximo de cosas en una mochila. Para expresarlo
ejecutamos cinco veces la acción de guardar algo. Pero, ¿por qué cinco? ¿Cómo sabemos eso? ¿Es configurable? ¿Qué pasa
si guardamos de más

```python
class BackpackTestCase(unittest.TestCase):
    def test_allows_maximum_of_elements(self):
        backpack = Backpack()
        backpack.keep(Thing.from_raw("1"))
        backpack.keep(Thing.from_raw("2"))
        backpack.keep(Thing.from_raw("3"))
        backpack.keep(Thing.from_raw("4"))
        backpack.keep(Thing.from_raw("5"))
        with self.assertRaises(IndexError):
            backpack.keep(Thing.from_raw("6"))
```

La expresividad de un test viene dada por su nombre, pero también por el modo en que describimos el escenario, la acción
y sus consecuencias: _given, when, then_. En este test, por ejemplo, dedicamos seis líneas a preparar el escenario, lo
que nos distrae de la acción y sus consecuencias. Aparte está la arbitrariedad del número de objetos que introducimos.
La regla de negocio sería algo así como: "no podemos guardar más cosas en una mochila llena". Necesitamos resaltar el
concepto de "mochila llena" y la imposibilidad de empacar más objetos.

Empecemos por el nombre:

```python
class BackpackTestCase(unittest.TestCase):
    def test_we_cannot_keep_more_things_in_a_full_backpack(self):
        backpack = Backpack()
        backpack.keep(Thing.from_raw("1"))
        backpack.keep(Thing.from_raw("2"))
        backpack.keep(Thing.from_raw("3"))
        backpack.keep(Thing.from_raw("4"))
        backpack.keep(Thing.from_raw("5"))
        with self.assertRaises(IndexError):
            backpack.keep(Thing.from_raw("6"))
```

Para representar el escenario "mochila llena" podemos utilizar dos técnicas, ya sea solo una de ellas o ambas a la vez:

* Extraer la preparación de un escenario (o parte de él) a un método del test
* Aplicar el patrón ObjectMother

La primera es aplicar el refactor _Extract Method_ de tal forma que la preparación quedará en una sola línea, ocultando
los detalles:

```python
class BackpackTestCase(unittest.TestCase):
    def test_we_cannot_keep_more_things_in_a_full_backpack(self):
        backpack = self.given_a_full_backpack()
        with self.assertRaises(IndexError):
            backpack.keep(Thing.from_raw("6"))

    def given_a_full_backpack(self):
        backpack = Backpack()
        backpack.keep(Thing.from_raw("1"))
        backpack.keep(Thing.from_raw("2"))
        backpack.keep(Thing.from_raw("3"))
        backpack.keep(Thing.from_raw("4"))
        backpack.keep(Thing.from_raw("5"))
        return backpack
```

Ahora el test describe mucho mejor la situación, utilizando _lenguaje de negocio_, a la vez que esconde los detalles de
qué significa tener una mochila llena. Podemos mejorar un poco el test haciendo un par de cambios. En primer lugar, que
el nombre de la cosa que vamos a guardar de más no haga referencia a una cantidad. Y, en segundo, hacer un simple bucle
para _llenar_ la mochila.

```python
class BackpackTestCase(unittest.TestCase):
    def test_we_cannot_keep_more_things_in_a_full_backpack(self):
        backpack = self.given_a_full_backpack()
        with self.assertRaises(IndexError):
            backpack.keep(Thing.from_raw("Some object"))

    def given_a_full_backpack(self):
        backpack = Backpack()
        for i in range(0, 5):
            backpack.keep(Thing.from_raw("Object {}".format(i + 1)))
        return backpack
```

Esto ya mejora bastante. Ahora, si miramos en detalle Backpack, vemos que podemos configurar la capacidad:

```python
class Backpack(Container):
    def __init__(self, capacity=5):
        self._capacity = capacity
        self._collection = ThingsCollection()
```

Con esta información podemos hacer que el test sea más sólido. Me explico: la mochila tiene una capacidad por defecto.
Si alguien cambiase ese valor, el test dejaría de pasar porque estamos acoplados a ese detalle. Ahora mismo, una mochila
llena tiene cinco objetos, pero en el test no sabemos de dónde viene esa cantidad. Hagámoslo explícito:

```python
class BackpackTestCase(unittest.TestCase):
    def test_we_cannot_keep_more_things_in_a_full_backpack(self):
        backpack = self.given_a_full_backpack()
        with self.assertRaises(IndexError):
            backpack.keep(Thing.from_raw("Some object"))

    def given_a_full_backpack(self):
        max_capacity = 5
        backpack = Backpack(capacity=max_capacity)
        for i in range(0, max_capacity):
            backpack.keep(Thing.from_raw("Object {}".format(i + 1)))
        return backpack
```

Ahora nuestro test es mucho más resistente al cambio y no depende de nuestro conocimiento interno de lo que estamos
testeando.

La segunda opción que planteábamos, usar el patrón _Object Mother_ es compatible con esto. _Object Mother_ resuelve el
problema de tener objetos ya configurados para la situación de
test. [Ya hemos hablado de ellos en otra ocasión](/object-mother/). Para mí tienen tres grandes ventajas:

* Se llevan buena parte del setup de los objetos fuera del test, quitando elementos distractores
* Nos permiten tener ejemplos prototípicos que podemos reutilizar cómodamente en todos los tests, proporcionando
  resultados coherentes
* Son muy fáciles de mantener

Veamos como usarlos en nuestro ejemplo. Aquí tienes el _BackpackMother_:

```python
class BackpackMother:
    @staticmethod
    def full():
        max_capacity = 5
        backpack = Backpack(capacity=max_capacity)
        for i in range(0, max_capacity):
            backpack.keep(Thing.from_raw("Object {}".format(i + 1)))
        return backpack
```

Frecuentemente, los métodos del _Object Mother_ serán estáticos. Si te fijas, vienen a ser una aplicación del patrón
_Builder_, con la diferencia de que en lugar de permitirnos crear cualquier configuración del objeto, nos proporciona
objetos listos para usar. Es posible crear _Object Mothers_ parametrizados si es que necesitemos controlar alguno de los
valores, pero en ese caso es recomendable limitarse a un parámetro que sea relevante para ciertos tests. Lo veremos en
otro ejemplo.

Y aquí lo usamos en el test. Como puedes ver el test es ahora sencillo y totalmente focalizado en la regla de negocio
que pone a prueba:

```python
class BackpackTestCase(unittest.TestCase):
    def test_we_cannot_keep_more_things_in_a_full_backpack(self):
        backpack = BackpackMother.full()
        with self.assertRaises(IndexError):
            backpack.keep(Thing.from_raw("Some object"))
```

Vamos a dar una vuelta de tuerca más a este test. El objeto `Thing` que usamos no tiene ninguna significación especial
para el test aparte de ser el objeto que estamos intentando guardar en una mochila llena. Por supuesto, podríamos
acentuar esto usando el patrón _Object Mother_ y crear un objeto genérico:

```python
class ThingMother:
    @staticmethod
    def random():
        return Thing.from_raw(''.join(random.choice(string.ascii_letters)))
```

Con lo cual, lo que nos queda es esto, que nos ayuda a eliminar cualquier necesidad de especificar detalles del objeto
_Thing_ que podrían llevarnos a duda o confusión.

```python
class BackpackTestCase(unittest.TestCase):
    def test_we_cannot_keep_more_things_in_a_full_backpack(self):
        backpack = BackpackMother.full()
        with self.assertRaises(IndexError):
            backpack.keep(ThingMother.random())
```

## Object Mother ampliados

Uno de los problemas de usar ejemplos prototípicos es que, a veces, nos interesa poder controlar o, al menos, conocer
valores específicos que varíen en torno a alguna dimensión. En el ejemplo anterior de la mochila, nos podría interesar
conocer el nombre de uno de los objetos guardados para poder testear como recuperarlo.

En el siguiente ejemplo vamos a ver este tipo de problemas. Además, veremos como usar la sección de `setUp` para las
acciones comunes de preparación del escenario.

```python
class CollectingThingsTestCase(unittest.TestCase):
    def setUp(self):
        self.observer = FakeObserver()
        self.player = Player()
        self.player.register(self.observer)

    @expect_event_containing(PlayerGotDescription, "description", "There are no objects")
    def test_player_collect_object_removes_from_room(self):
        dungeon = self.dungeon_with_object(Thing.from_raw("Food"))
        dungeon.register(self.observer)
        self.player.awake_in(dungeon)
        self.player.do(CollectCommand("food"))
        dungeon.look('objects')

    @expect_event(PlayerCollectedThing)
    def test_dungeon_raises_event(self):
        dungeon = self.dungeon_with_object(Thing.from_raw("Food"))
        dungeon.register(self.observer)
        self.player.awake_in(dungeon)
        self.player.do(CollectCommand("food"))

    @expect_event_containing(BackpackChanged, "content", "Food")
    def test_player_added_item_to_backpack(self):
        dungeon = self.dungeon_with_object(Thing.from_raw("Food"))
        dungeon.register(self.observer)
        self.player.awake_in(dungeon)
        self.player.do(CollectCommand("food"))

    def dungeon_with_object(self, thing=Thing.from_raw("Food")):
        builder = DungeonBuilder()
        builder.add('start')
        builder.put('start', thing)
        return builder.build()
```

El test sirve para probar que la jugadora puede recoger y coleccionar objetos que se encuentran en la mazmorra. Para
ello necesitamos preparar una mazmorra que contenga algún objeto, vincularla con la jugadora y hacer que esta coleccione
objetos mediante el comando `CollectCommand`. Las reglas de negocio que queremos probar son:

* Cuando una jugadora colecciona un objeto, este desaparece de la mazmorra
* El objeto se guarda en la mochila
* Se lanza un evento que comunica que la jugadora ha recogido el objeto

Como se puede ver, hay muchos elementos repetidos en el test, los nombres de los tests no son realmente consistentes y
resulta un poco difícil de seguir.

Lo primero que nos llama la atención es que construimos la misma mazmorra, en todos los tests del TestCase. Además, como
hemos visto en el ejemplo anterior, ese código estaría mejor en un `DungeonMother`. De hecho, si sigues la serie de
artículos sobre [Dungeon]() ya sabrás que ese `DungeonMother`(/tag/dungeon/) existe. Para los propósitos de este
ejemplo, nos basta con lo siguiente:

```python
class DungeonMother:
    @staticmethod
    def with_objects(*things) -> Dungeon:
        builder = DungeonBuilder()
        builder.add('start')
        for thing in things:
            builder.put('start', thing)
        return builder.build()
```

Este es un caso de `Mother` parametrizada. Nos permite generar ejemplos de mazmorras que contienen los objetos que
queremos. Como se puede ver, esta mazmorra solo tiene una celda, lo que es suficiente para los propósitos de este test.
Nos da igual su nombre, pero por convención empezamos en 'start' (esto es algo que hay que revisar, pero este no es el
artículo en el que vamos a hacerlo).

Así que podemos empezar por aquí:

```python
class CollectingThingsTestCase(unittest.TestCase):
    def setUp(self):
        self.observer = FakeObserver()
        self.player = Player()
        self.player.register(self.observer)

    @expect_event_containing(PlayerGotDescription, "description", "There are no objects")
    def test_player_collect_object_removes_from_room(self):
        dungeon = DungeonMother.with_objects(Thing.from_raw("Food"))
        dungeon.register(self.observer)
        self.player.awake_in(dungeon)
        self.player.do(CollectCommand("food"))
        dungeon.look('objects')

    @expect_event(PlayerCollectedThing)
    def test_dungeon_raises_event(self):
        dungeon = DungeonMother.with_objects(Thing.from_raw("Food"))
        dungeon.register(self.observer)
        self.player.awake_in(dungeon)
        self.player.do(CollectCommand("food"))

    @expect_event_containing(BackpackChanged, "content", "Food")
    def test_player_added_item_to_backpack(self):
        dungeon = DungeonMother.with_objects(Thing.from_raw("Food"))
        dungeon.register(self.observer)
        self.player.awake_in(dungeon)
        self.player.do(CollectCommand("food"))
```

Esto nos sugiere el siguiente paso, que sería mover la instanciación de dungeon a `setUp`. Pero es que, además, vemos
que las tres primeras líneas de cada test son exactamente las mismas y las podemos mover juntas.

```python
class CollectingThingsTestCase(unittest.TestCase):
    def setUp(self):
        self.observer = FakeObserver()
        self.dungeon = DungeonMother.with_objects(Thing.from_raw("Food"))
        self.player = Player()
        self.dungeon.register(self.observer)
        self.player.register(self.observer)
        self.player.awake_in(self.dungeon)

    @expect_event_containing(PlayerGotDescription, "description", "There are no objects")
    def test_player_collect_object_removes_from_room(self):
        self.player.do(CollectCommand("food"))
        self.dungeon.look('objects')

    @expect_event(PlayerCollectedThing)
    def test_dungeon_raises_event(self):
        self.player.do(CollectCommand("food"))

    @expect_event_containing(BackpackChanged, "content", "Food")
    def test_player_added_item_to_backpack(self):
        self.player.do(CollectCommand("food"))
```

Con el cambio, los tests se han reducido a lo esencial. En el artículo
sobre [decoradores en Python](/python-decorators/) justamente introdujimos estos decoradores en los tests para verificar
que se publican los eventos adecuados.

Todavía necesitamos resolver un pequeño problema, que es el nombre del objeto que usamos para este ejemplo. No hay nada
que nos obligue a que sea "food" o, para el caso, cualquier otro nombre. El problema es que es repetitivo y el hecho de
usarlo podría dar a entender erróneamente que el objeto tiene que ser de ese tipo especial.

La solución es llevarnos el nombre concreto a una constante. Al declararla como global al módulo que contiene el
TestCase podemos usarla libremente.

```python
OBJECT = "Food"


class CollectingThingsTestCase(unittest.TestCase):
    def setUp(self):
        self.observer = FakeObserver()
        self.dungeon = DungeonMother.with_objects(Thing.from_raw(OBJECT))
        self.dungeon.register(self.observer)
        self.player = Player()
        self.player.register(self.observer)
        self.player.awake_in(self.dungeon)

    @expect_event_containing(PlayerGotDescription, "description", "There are no objects")
    def test_player_collect_object_removes_from_room(self):
        self.player.do(CollectCommand(OBJECT))
        self.dungeon.look('objects')

    @expect_event(PlayerCollectedThing)
    def test_dungeon_raises_event(self):
        self.player.do(CollectCommand(OBJECT))

    @expect_event_containing(BackpackChanged, "content", OBJECT)
    def test_player_added_item_to_backpack(self):
        self.player.do(CollectCommand(OBJECT))
```

Todavía tenemos margen para mejorar esto. Si nos fijamos en el primer test:

```python
@expect_event_containing(PlayerGotDescription, "description", "There are no objects")
def test_player_collect_object_removes_from_room(self):
    self.player.do(CollectCommand(OBJECT))
    self.dungeon.look('objects')
```

La referencia a dungeon queda un poco fuera de lugar. Es el único test en el que ocurre y la verdad es que no la
necesitamos. Se podría decir que por _paralelismo_ queda mejor esto:

```python
@expect_event_containing(PlayerGotDescription, "description", "There are no objects")
def test_player_collect_object_removes_from_room(self):
    self.player.do(CollectCommand(OBJECT))
    self.player.do(LookCommand('objects'))
```

Y, en consecuencia, podemos limpiar un poco el `setUp`, además de reescribir los nombres de los tests.

```python
OBJECT = "Food"


class CollectingThingsTestCase(unittest.TestCase):
    def setUp(self):
        self.observer = FakeObserver()
        dungeon = DungeonMother.with_objects(Thing.from_raw(OBJECT))
        dungeon.register(self.observer)
        self.player = Player()
        self.player.register(self.observer)
        self.player.awake_in(dungeon)

    @expect_event_containing(PlayerGotDescription, "description", "There are no objects")
    def test_collecting_thing_removes_it_from_room(self):
        self.player.do(CollectCommand(OBJECT))
        self.player.do(LookCommand('objects'))

    @expect_event_containing(BackpackChanged, "content", OBJECT)
    def test_collecting_thing_keeps_it_into_backpack(self):
        self.player.do(CollectCommand(OBJECT))

    @expect_event(PlayerCollectedThing)
    def test_collecting_thing_is_notified(self):
        self.player.do(CollectCommand(OBJECT))
```

Lo que hemos hecho con este test, al igual que con el anterior, es esconder y reducir el ruido derivado de la
preparación del escenario y centrar la información proporcionada por el test en las acciones y sus consecuencias.

## Sobre la organización de código y los Object Mother

En los últimos tiempos me he encontrado con varios autores que proponen que los objetos para test vivan cerca de sus
versiones de producción. Algunos lenguajes permiten, por ejemplo, clases embebidas que pueden funcionar muy bien para
este propósito. En otros, sin embargo, puede parecer extraño, pues es típico mantener separado el código de producción y
el de test.

Confieso que no tengo una opinión muy fuerte al respecto, ya que veo buenas razones a favor y en contra. Como hemos
señalado, un Object Mother es básicamente un patrón Builder limitado. Nos bastaría con añadir algunos métodos factoría
en la misma clase. O bien, en una factoría para que nos entregase estos ejemplos limitados. De este modo, también nos
ahorramos introducir una nueva clase, y tendríamos en un solo lugar todo lo relacionado con la instanciación de cada
tipo de objeto.

La mayor objeción a esto sería que estos métodos de creación no se van a utilizar en producción, por lo que tendría más
sentido tenerlos en el área de tests.

En cualquier caso, la decisión puede verse influenciada por el lenguaje y sus convenciones. Por ejemplo, en Python la
idea de módulo (un archivo que puede contener una o más funciones o clases) invita a tener en el mismo módulo
definiciones que están estrechamente relacionadas, como podrían ser una clase y sus builders. Lo mismo podríamos decir
de los paquetes, en cuyo caso podríamos tener una separación por archivos, la cual es casi obligatoria en algunos
lenguajes.

En el proyecto Dungeon tengo separados tanto los objetos Mother como los test Doubles, así que como ejercicio voy a
moverlos con sus homónimos de producción.

[Puedes verlo en este commit en el repositorio.](https://github.com/franiglesias/dungeon/commit/a168b37c6bf76b59119b7530cc4b6e661188d1ca)

Con esto veo dos ventajas potenciales:

* La carpeta de tests queda más limpia, conteniendo solamente los tests.
* Tener la definición de las clases cerca, permite usarlas de referencia

## De tests de TDD a test de QA

La mayoría de los tests del proyecto comenzaron siendo tests de TDD. Una vez que hemos alcanzado el objetivo de
desarrollo, los tests de TDD pueden llegar a convertirse en tests de QA, sirviendo como tests de regresión. Muchas veces
nos valen tal cual, pero merece la pena darles un repaso.

Veamos este ejemplo en el que pretendíamos desarrollar el método _get_safe_ y _exchange_ en _Dungeon_ con el que la
jugadora puede coger los objetos que haya en la celda actual de la mazmorra.

```python
class DungeonAsContainerTestCase(unittest.TestCase):
    def test_we_can_grab_object_from_dungeon(self):
        thing = Thing.from_raw("Food")
        dungeon = self.dungeon_with_object(thing)

        got_thing = dungeon.get_safe("Food")
        self.assertEqual(thing, got_thing)

    def test_cannot_grab_non_existing_object(self):
        thing = Thing.from_raw("Food")
        dungeon = self.dungeon_with_object(thing)
        with self.assertRaises(IndexError):
            dungeon.get_safe("OtherThing")

    def test_we_can_exchange_object_from_dungeon(self):
        thing = Thing.from_raw("Food")
        to_keep = Thing.from_raw("Sword")
        dungeon = self.dungeon_with_object(thing)

        got_thing = dungeon.exchange(to_keep, "Food")
        self.assertEqual(thing, got_thing)

    def test_cannot_exchange_with_not_existing_object(self):
        thing = Thing.from_raw("Food")
        to_keep = Thing.from_raw("Sword")
        dungeon = self.dungeon_with_object(thing)

        with self.assertRaises(IndexError):
            dungeon.exchange(to_keep, "Another")

    def dungeon_with_object(self, thing=Thing.from_raw("Food")):
        builder = DungeonBuilder()
        builder.add('start')
        builder.put('start', thing)
        return builder.build()
```

Como test de QA, este test pretende probar las dos acciones (coger un objeto e intercambiar un objeto por otro). El
escenario común es una mazmorra con una celda que contiene un objeto. Queremos verificar que se puede coger ese objeto,
intercambiarlo con otro que proporcionamos y que no podemos hacer nada si el objeto reclamado no existe.

El primer problema que encontramos es, de nuevo, la preparación del escenario, que repetimos en todos los tests y además
no estamos usando un _DungeonMother_ que nos vendría muy bien. Necesitamos tener referencia del nombre de los objetos
para probar algunos de los métodos, así que podemos refactorizar el test para que se vea así:

```python
UNAVAILABLE_OBJECT = "OtherThing"
OBJECT_IN_CELL = "Food"


class DungeonAsContainerTestCase(unittest.TestCase):
    def setUp(self):
        self.thing = Thing.from_raw(OBJECT_IN_CELL)
        self.dungeon = DungeonMother.with_objects(self.thing)

    def test_we_can_grab_object_from_dungeon(self):
        got_thing = self.dungeon.get_safe(OBJECT_IN_CELL)
        self.assertEqual(self.thing, got_thing)

    def test_cannot_grab_non_existing_object(self):
        with self.assertRaises(IndexError):
            self.dungeon.get_safe(UNAVAILABLE_OBJECT)

    def test_we_can_exchange_object_from_dungeon(self):
        to_keep = ThingMother.random()
        got_thing = self.dungeon.exchange(to_keep, OBJECT_IN_CELL)
        self.assertEqual(self.thing, got_thing)

    def test_cannot_exchange_with_not_existing_object(self):
        to_keep = ThingMother.random()
        with self.assertRaises(IndexError):
            self.dungeon.exchange(to_keep, UNAVAILABLE_OBJECT)
```

Como hemos hecho antes, la preparación común del escenario está en un solo lugar y fuera de los tests individuales, que
ahora se centran en la acción y sus consecuencias.

Aquí tenemos varios elementos que distorsionan un poco la lectura. Uno de ellos es que el test tiene una propiedad (
self.thing) para mantener el objeto que ponemos inicialmente en la mazmorra, el objeto que queremos coger o
intercambiar. Obviamente, si queremos mantener la referencia a la misma instancia no nos queda más remedio que hacer
esto, pero el test queda un poco extraño.

Una solución es ocultar el hecho de que tenemos esa propiedad en el test. Para ello, podemos introducir un método que
encapsule la aserción, de tal modo que ocultamos la propiedad y, además, hacemos el test más expresivo. He usado la
notación camelCase intencionadamente.

```python
class DungeonAsContainerTestCase(unittest.TestCase):
    def setUp(self):
        self.thing = Thing.from_raw(OBJECT_IN_CELL)
        self.dungeon = DungeonMother.with_objects(self.thing)

    def test_we_can_grab_object_from_dungeon(self):
        got_thing = self.dungeon.get_safe(OBJECT_IN_CELL)
        self.assertGotTheThingFromCell(got_thing)

    def assertGotTheThingFromCell(self, got_thing):
        self.assertEqual(self.thing, got_thing)

    # Removed code
```

Podemos aprovechar también para deshacernos de variables temporales.

```python
class DungeonAsContainerTestCase(unittest.TestCase):
    def setUp(self):
        self.thing = Thing.from_raw(OBJECT_IN_CELL)
        self.dungeon = DungeonMother.with_objects(self.thing)

    def test_we_can_grab_object_from_dungeon(self):
        self.assertGotTheThingFromCell(self.dungeon.get_safe(OBJECT_IN_CELL))

    def test_cannot_grab_non_existing_object(self):
        with self.assertRaises(IndexError):
            self.dungeon.get_safe(UNAVAILABLE_OBJECT)

    def test_we_can_exchange_object_from_dungeon(self):
        to_keep = ThingMother.random()
        self.assertGotTheThingFromCell(self.dungeon.exchange(to_keep, OBJECT_IN_CELL))

    def test_cannot_exchange_with_not_existing_object(self):
        to_keep = ThingMother.random()
        with self.assertRaises(IndexError):
            self.dungeon.exchange(to_keep, UNAVAILABLE_OBJECT)

    def assertGotTheThingFromCell(self, got_thing):
        self.assertEqual(self.thing, got_thing)
```

El otro elemento un poco distorsionador es `ThingMother` y aquí entra una de las posibles ventajas de que los métodos
factoría que tenemos en el _object mother_ estén en la propia clase. Veamos la diferencia:

```python
def test_we_can_exchange_object_from_dungeon(self):
    to_keep = ThingMother.random()
    self.assertGotTheThingFromCell(self.dungeon.exchange(to_keep, OBJECT_IN_CELL))
```

Frente a:

```python
def test_we_can_exchange_object_from_dungeon(self):
    to_keep = Thing.random()
    self.assertGotTheThingFromCell(self.dungeon.exchange(to_keep, OBJECT_IN_CELL))
```

Es una pequeña diferencia, pero interesante, ¿verdad?

También podemos eliminar las variables temporales que nos quedan.

```python
UNAVAILABLE_OBJECT = "OtherThing"
OBJECT_IN_CELL = "Food"


class DungeonAsContainerTestCase(unittest.TestCase):
    def setUp(self):
        self.thing = Thing.from_raw(OBJECT_IN_CELL)
        self.dungeon = DungeonMother.with_objects(self.thing)

    def test_we_can_grab_object_from_dungeon(self):
        self.assertGotTheThingFromCell(self.dungeon.get_safe(OBJECT_IN_CELL))

    def test_cannot_grab_non_existing_object(self):
        with self.assertRaises(IndexError):
            self.dungeon.get_safe(UNAVAILABLE_OBJECT)

    def test_we_can_exchange_object_from_dungeon(self):
        self.assertGotTheThingFromCell(self.dungeon.exchange(Thing.random(), OBJECT_IN_CELL))

    def test_cannot_exchange_with_not_existing_object(self):
        with self.assertRaises(IndexError):
            self.dungeon.exchange(Thing.random(), UNAVAILABLE_OBJECT)

    def assertGotTheThingFromCell(self, got_thing):
        self.assertEqual(self.thing, got_thing)
```

## Test smells y test refactors

Hemos podido observar varios patrones inadecuados en los ejemplos anteriores. Vamos a verlos de una forma un poco más
sistemática en este otro ejemplo:

```python
class MyThing(Thing):
    def apply_on(self, some_object):
        some_object.register_call()
        return self


class MyKey(Key):
    def apply_on(self, door):
        door.register_call()
        return self


class HandTestCase(unittest.TestCase):
    def setUp(self) -> None:
        self.calls = 0

    def test_empty_hand_can_get_object_from_backpack(self):
        backpack = Backpack()
        something = Thing.from_raw("Something")
        backpack.keep(something)
        hand = EmptyHand()
        full_hand = hand.get_from(backpack, "Something")
        self.assertEqual(something, full_hand.holds())

    def test_full_hand_exchanges_object_from_backpack(self):
        backpack = Backpack()
        first = Thing.from_raw("First")
        second = Thing.from_raw("Second")
        backpack.keep(first)
        backpack.keep(second)

        hand = EmptyHand()
        full_hand = hand.get_from(backpack, "Second")
        full_hand = full_hand.get_from(backpack, "First")
        self.assertEqual(first, full_hand.holds())
        self.assertEqual(second, backpack.get("Second"))

    def test_full_hand_keeps_same_object_getting_not_existing_one(self):
        backpack = Backpack()
        first = Thing.from_raw("First")
        backpack.keep(first)

        hand = EmptyHand()
        full_hand = hand.get_from(backpack, "First")
        with self.assertRaises(ObjectNotFound):
            full_hand.get_from(backpack, "Another")

    def test_empty_hand_keeps_being_empty_getting_not_existing_object(self):
        backpack = Backpack()
        hand = EmptyHand()
        with self.assertRaises(ObjectNotFound):
            hand.get_from(backpack, "Another")

    def test_empty_hand_cannot_use_thing(self):
        hand = EmptyHand()
        with self.assertRaises(ObjectNotFound):
            hand.use_thing_with("Food", self)

    def test_cannot_use_a_thing_that_is_not_in_your_hand(self):
        hand = FullHand(Thing.from_raw("Sword"))
        with self.assertRaises(DoNotHaveThatObject):
            hand.use_thing_with("Food", self)

    def test_can_use_the_thing_in_hand(self):
        hand = FullHand(MyThing.from_raw("Something"))
        hand.use_thing_with("Something", self)
        self.assertEqual(1, self.calls)

    def test_cannot_open_when_not_holding_key(self):
        hand = FullHand(MyThing.from_raw("Something"))
        with self.assertRaises(ObjectIsNotKey):
            hand.open_with_key(self)

    def test_can_open_with_a_key(self):
        hand = FullHand(MyKey.from_raw("Something", "secret"))
        hand.open_with_key(self)
        self.assertEqual(1, self.calls)

    def register_call(self):
        self.calls += 1
```

### Test case largo

El _test case_ parece largo, ¿verdad? Lo es. Este problema deriva del hecho de la costumbre que tenemos de organizar los
tests en torno a la clase que queremos probar y no en torno a los comportamientos. El TestCase trata de probar objetos
de la clase `Hand`. En realidad, este test está probando tres áreas de comportamiento de `Hand`: la interacción
con `Backpack`, la capacidad de usar un objeto y la capacidad de usar una llave para abrir puertas.

Diremos que el _test case_ tiene baja cohesión, puesto que no todos los tests contribuyen a verificar el mismo
comportamiento. Podemos notar, por ejemplo, que no todos los tests usan el mismo set-up, y se refieren a escenarios
distintos.

El consejo, en este caso sería separar el _test case_ en tres, cada uno de ellos focalizado en un comportamiento
específico.

```python
class HandUsingBackpackTestCase(unittest.TestCase):
    def setUp(self) -> None:
        self.calls = 0

    def test_empty_hand_can_get_object_from_backpack(self):
        backpack = Backpack()
        something = Thing.from_raw("Something")
        backpack.keep(something)
        hand = EmptyHand()
        full_hand = hand.get_from(backpack, "Something")
        self.assertEqual(something, full_hand.holds())

    def test_full_hand_exchanges_object_from_backpack(self):
        backpack = Backpack()
        first = Thing.from_raw("First")
        second = Thing.from_raw("Second")
        backpack.keep(first)
        backpack.keep(second)

        hand = EmptyHand()
        full_hand = hand.get_from(backpack, "Second")
        full_hand = full_hand.get_from(backpack, "First")
        self.assertEqual(first, full_hand.holds())
        self.assertEqual(second, backpack.get("Second"))

    def test_full_hand_keeps_same_object_getting_not_existing_one(self):
        backpack = Backpack()
        first = Thing.from_raw("First")
        backpack.keep(first)

        hand = EmptyHand()
        full_hand = hand.get_from(backpack, "First")
        with self.assertRaises(ObjectNotFound):
            full_hand.get_from(backpack, "Another")

    def test_empty_hand_keeps_being_empty_getting_not_existing_object(self):
        backpack = Backpack()
        hand = EmptyHand()
        with self.assertRaises(ObjectNotFound):
            hand.get_from(backpack, "Another")

    def register_call(self):
        self.calls += 1
```

```python
class HandUsingThingsTestCase(unittest.TestCase):
    def setUp(self) -> None:
        self.calls = 0

    def test_empty_hand_cannot_use_thing(self):
        hand = EmptyHand()
        with self.assertRaises(ObjectNotFound):
            hand.use_thing_with("Food", self)

    def test_cannot_use_a_thing_that_is_not_in_your_hand(self):
        hand = FullHand(Thing.from_raw("Sword"))
        with self.assertRaises(DoNotHaveThatObject):
            hand.use_thing_with("Food", self)

    def test_can_use_the_thing_in_hand(self):
        hand = FullHand(MyThing.from_raw("Something"))
        hand.use_thing_with("Something", self)
        self.assertEqual(1, self.calls)

    def register_call(self):
        self.calls += 1
```

```python
class HandOpeningDoorsTestCase(unittest.TestCase):
    def setUp(self) -> None:
        self.calls = 0

    def test_cannot_open_when_not_holding_key(self):
        hand = FullHand(MyThing.from_raw("Something"))
        with self.assertRaises(ObjectIsNotKey):
            hand.open_with_key(self)

    def test_can_open_with_a_key(self):
        hand = FullHand(MyKey.from_raw("Something", "secret"))
        hand.open_with_key(self)
        self.assertEqual(1, self.calls)

    def register_call(self):
        self.calls += 1
```

En general, cuando un `TestCase` es largo nos conviene darle una vuelta para ver si es posible organizarlo mejor separando los distintos comportamientos que se verifican en el test. Es posible que si desarrollas usando TDD te encuentres con este tipo de tests, en parte por comodidad, pero si quieres convertirlos en tests de regresión que sean útiles, es buena idea reorganizarlos de este modo.

### Set up repetitivo

El set up repetitivo aparece cuando la parte de preparación se repite en cada test, en vez de tener las partes comunes en el método de `setUp`. Esto dificulta la lectura del test porque _ahoga_ u _oculta_ tanto la acción como las consecuencias. De hecho, la cohesión de los tests es baja porque buena parte de las líneas se dedican a preparación.

En este ejemplo, todos los tests de `HandUsingBackpackTestCase` requieren una mochila conteniendo una cierta cantidad de objetos o ninguna. En este caso, tenemos una buena oportunidad de usar el patrón _Object Mother_ para esconder los detalles de preparación. A continuación, tenemos un test que necesita una mochila conteniendo algo, para comprobar que ese mismo algo acaba en nuestra mano.

```python
def test_empty_hand_can_get_object_from_backpack(self):
    backpack = Backpack()
    something = Thing.from_raw("Something")
    backpack.keep(something)
    hand = EmptyHand()
    full_hand = hand.get_from(backpack, "Something")
    self.assertEqual(something, full_hand.holds())
```

Una primera aproximación es la siguiente:

```python
def test_empty_hand_can_get_object_from_backpack(self):
    something = Thing.from_raw("Something")
    backpack = BackpackMother.containing(something)
    hand = EmptyHand()
    full_hand = hand.get_from(backpack, "Something")
    self.assertEqual(something, full_hand.holds())
```
```python
class BackpackMother:
    
  # Removed code

    @staticmethod
    def containing(*things):
        backpack = Backpack()
        for thing in things:
            backpack.keep(thing)
        return backpack
```

Esta versión nos permite ignorar el nombre de la cosa guardada:

```python
def test_empty_hand_can_get_object_from_backpack(self):
    something = Thing.from_raw("Something")
    backpack = BackpackMother.containing(something)
    hand = EmptyHand()
    full_hand = hand.get_from(backpack, something.name().to_s())
    self.assertEqual(something, full_hand.holds())
```

Y eso nos permite:

```python
def test_empty_hand_can_get_object_from_backpack(self):
    something = Thing.random()
    backpack = BackpackMother.containing(something)
    hand = EmptyHand()
    full_hand = hand.get_from(backpack, something.name().to_s())
    self.assertEqual(something, full_hand.holds())
```

El gran problema es la forma de obtener el nombre de la cosa en forma de string. Pero quizá es algo que podamos resolver en algún momento posterior. Lo interesante es que esto hace el test más sólido al desacoplarlo un destalle específico de los objetos usados en el test.

Otra cosa que creo que puede mejorar es lo que se refiere a obtener la mano. Querría tener algo así:

```python
def test_empty_hand_can_get_object_from_backpack(self):
    something = Thing.random()
    backpack = BackpackMother.containing(something)
    hand = Hand.empty()
    full_hand = hand.get_from(backpack, something.name().to_s())
    self.assertEqual(something, full_hand.holds())
```

Para ello, introduzco un método factoría en la clase base `Hand`:

```python
class Hand:
    def __init__(self):
        pass

    # Removed code

    @staticmethod
    def empty():
        return EmptyHand()
```

Los demás tests pueden beneficiarse de los cambios que hemos introducido, aunque todavía no estoy satisfecho con el resultado.

```python
class HandUsingBackpackTestCase(unittest.TestCase):
    def setUp(self) -> None:
        self.calls = 0

    def test_empty_hand_can_get_object_from_backpack(self):
        something = Thing.random()
        backpack = BackpackMother.containing(something)
        hand = Hand.empty()
        full_hand = hand.get_from(backpack, something.name().to_s())
        self.assertEqual(something, full_hand.holds())

    def test_full_hand_exchanges_object_from_backpack(self):
        first = Thing.random()
        second = Thing.random()
        backpack = BackpackMother.containing(first, second)
        hand = Hand.empty()
        full_hand = hand.get_from(backpack, second.name().to_s())
        full_hand = full_hand.get_from(backpack, first.name().to_s())
        self.assertEqual(first, full_hand.holds())
        self.assertEqual(second, backpack.get(second.name().to_s()))

    def test_full_hand_keeps_same_object_getting_not_existing_one(self):
        first = Thing.random()
        backpack = BackpackMother.containing(first)
        hand = Hand.empty()
        full_hand = hand.get_from(backpack, first.name().to_s())
        with self.assertRaises(ObjectNotFound):
            full_hand.get_from(backpack, "Another")

    def test_empty_hand_keeps_being_empty_getting_not_existing_object(self):
        backpack = Backpack.empty()
        hand = Hand.empty()
        with self.assertRaises(ObjectNotFound):
            hand.get_from(backpack, "Another")

    def register_call(self):
        self.calls += 1
```

¿Qué es lo que todavía me molesta de estos tests? En primer lugar, aunque hemos mejorado un poco la preparación de los escenarios, aún sigue habiendo mucho código de preparación que distrae del contenido de los tests.

Otro problema es que vemos poco _lenguaje de negocio_.

### Ausencia de lenguaje de negocio

Un problema muy habitual en los tests es el de usar las aserciones para tratar de comunicar los efectos de una acción en lugar de lenguaje de negocio. Hemos visto un ejemplo anterior en el que introducíamos un método cuyo nombre estaba redactado en términos de negocio. Las aserciones que incluyen los _frameworks_ o librerías de testing emplean un lenguaje genérico que, aunque puede funcionar para muchas situaciones, nunca va a conseguir capturar con exactitud lo que ocurre en el dominio de nuestra aplicación.

Repasemos el primer test:

```python
def test_empty_hand_can_get_object_from_backpack(self):
    something = Thing.random()
    backpack = BackpackMother.containing(something)
    hand = Hand.empty()
    full_hand = hand.get_from(backpack, something.name().to_s())
    self.assertEqual(something, full_hand.holds())
```

¿Qué significa `assertEqual`? En nuestro ejemplo lo que queremos comprobar hemos "sacado" un objeto de la mochila. Queremos algo de este estilo:

* Si tenemos una mochila que contiene el objeto "x"
* Cuando lo cogemos
* Lo tendremos en la mano

Esto expresado en lenguaje Gherkin sería algo así:

* Given we have a backpack containing "x"
* When we get "x" from the backpack
* We can see it in our hand

Para usar este lenguaje no necesitamos Behave (en Python) o un port de Cucumber para nuestro lenguaje de programación. Basta con reimplementar los tests. A decir verdad esto los complica un poco, pero es una técnica que funciona bien para tests de integración.

Personalmente, me gusta hacer estos test de tal forma que los "datos" en los que estoy interesado son visibles en el test, mientras que los pasos son implementados internamente. Veamos una nueva versión de este test:

```python
class HandUsingBackpackTestCase(unittest.TestCase):
    def setUp(self) -> None:
        self.calls = 0

    def test_empty_hand_can_get_object_from_backpack(self):
        self.given_players_backpack_contains(Thing.random())
        self.when_player_gets_it_from_backpack()
        self.then_player_has_it_the_hand()

    def given_players_backpack_contains(self, something):
        self.thing = something
        self.backpack = BackpackMother.containing(something)

    def when_player_gets_it_from_backpack(self):
        self.hand = Hand.empty().get_from(self.backpack, self.thing.name().to_s())

    def then_player_has_it_the_hand(self):
        self.assertEqual(self.thing, self.hand.holds())

    # Removed code
```

En la medida de lo posible, intentamos reutilizar los pasos, aunque es frecuente no poder hacerlo.

```python
class HandUsingBackpackTestCase(unittest.TestCase):
    def setUp(self) -> None:
        self.hand = None
        self.backpack = None

    def test_empty_hand_can_get_object_from_backpack(self):
        self.given_players_backpack_contains(Thing.random())
        self.when_player_gets_it_from_backpack()
        self.then_player_has_it_the_hand()

    def test_full_hand_exchanges_object_from_backpack(self):
        self.given_players_backpack_contains(Thing.random())
        self.given_player_holds(Thing.random())
        self.when_player_gets_it_from_backpack()
        self.then_player_has_it_the_hand()
        self.and_the_other_object_is_in_the_backpack()

    def test_full_hand_keeps_same_object_trying_to_get_not_existing_one(self):
        self.given_players_backpack_contains(Thing.random())
        self.given_player_holds(Thing.random())
        self.when_player_tries_to_get_an_object_not_in_backpack()
        self.then_player_keeps_original_object_in_the_hand()

    def test_empty_hand_keeps_being_empty_getting_not_existing_object(self):
        self.given_players_backpack_is_empty()
        self.when_player_tries_to_get_an_object_not_in_backpack()
        self.then_player_has_nothing_in_her_hand()

    def given_players_backpack_contains(self, *something):
        self.things = something
        self.backpack = BackpackMother.containing(*something)

    def given_players_backpack_is_empty(self):
        self.things = []
        self.backpack = Backpack.empty()

    def given_player_holds(self, other_thing):
        self.other_thing = other_thing
        self.hand = FullHand(other_thing)

    def when_player_gets_it_from_backpack(self):
        if self.hand is None:
            self.hand = Hand.empty()
        self.hand = self.hand.get_from(self.backpack, self.things[0].name().to_s())

    def when_player_tries_to_get_an_object_not_in_backpack(self):
        if self.hand is None:
            self.hand = Hand.empty()
        try:
            self.hand = self.hand.get_from(self.backpack, "another")
        except ObjectNotFound:
            pass

    def then_player_has_it_the_hand(self):
        self.assertEqual(self.things[0], self.hand.holds())

    def then_player_has_nothing_in_her_hand(self):
        self.assertEqual(None, self.hand.holds())

    def then_player_keeps_original_object_in_the_hand(self):
        self.assertEqual(self.other_thing, self.hand.holds())

    def and_the_other_object_is_in_the_backpack(self):
        self.assertEqual(self.other_thing, self.backpack.get(self.other_thing.name().to_s()))
```

Ahora el test tiene dos partes bien diferenciadas: una describe el comportamiento en lenguaje de negocio. Posiblemente es mejorable, pero es bastante fácil de entender. La otra parte es la definición de cada uno de los pasos, código necesario para que ocurra lo que queremos en cada escenario del test.

## Finalizando

En este artículo he tratado de mostrar cómo refactorizar tests con diversas técnicas para mejorar su expresividad, separando los procedimientos de preparación y las acciones y consecuencias que estamos probando.
