---
layout: post
title: Decoradores en Python
categories: articles
tags: python good-practices
---

El proyecto Dungeon me está sirviendo para aprender Python más a fondo, así que voy a dedicar algunos artículos a cuestiones específicas que me interesan más allá del proyecto en sí. En esta ocasión hablaré de los decoradores en Python.

En primer lugar, señalar que no hay que confundir los decoradores de Python con el patrón _decorator_, aunque ambos se basan en explotar la composición para cambiar el comportamiento de una función en tiempo de ejecución. 

La diferencia es que cuando marcamos con un _decorador_ una función en Python el comportamiento de esa función cambia para siempre, por así decir, porque siempre que la llamemos actuará el decorador. 

La utilidad de estos decoradores en Python es componer comportamientos sobre la base de una función, sin tener que alterar su código introduciendo elementos que le son ajenos. 

## Las bases

Los decoradores en Python son posibles porque las funciones son ciudadanas de primera clase: pueden pasarse como argumentos a otras funciones y también pueden devolverse como respuesta de otras funciones. Esto nos permite componer funciones simples para crear comportamientos más complejos.

Esto puede ser un poco difícil de visualizar, así que lo mejor sería ver un ejemplo. 

Imagina que tienes una función para imprimir cosas. Aquí la vamos a simular examinado lo que retorna.

```python
class DecoratorsTestCase(unittest.TestCase):
    def test_print_something(self):
        output = print_this("Example text, 1111-2222-3333-4444")
        self.assertEqual("Example text, 1111-2222-3333-4444", output)
```

```python
def print_this(input_text):
    return input_text
```

Ahora, imagina que se nos pide que oculte los números de tarjetas de crédito. Algo así:

```python
    def test_undisclosed_card_number(self):
        output = print_this("Example text, 1111-2222-3333-4444")
        self.assertEqual("Example text, ****-****-****-4444", output)
```

Una opción sería introducir el código necesario en la función `print_this`, pero tenemos claro que:

* No queremos tocar esa función con cosas que no son su responsabilidad (imprimir)
* Es seguro que habrá que aplicar más transformaciones similares

Otra opción es tener una función que haga esa transformación específica y usarla en conjunto con la original. Esa función podría ser así:

```python
def undisclosed_card_number(original):
    return re.sub("(\\d{4})-(\\d{4})-(\\d{4})-(\\d{4})", "****-****-****-\\4", original)
```

Y podemos componerlas así:

```python
class DecoratorsTestCase(unittest.TestCase):
    
    # Removed code
    
    def test_print_undisclosed_card_number(self):
        output = print_this(undisclosed_card_number("Example text, 1111-2222-3333-4444"))
        self.assertEqual("Example text, ****-****-****-4444", output)
```

Pero también lo podríamos hacer al revés:

```python
    def test_print_undisclosing_card_number(self):
        output = undisclosed_card_number(print_this("Example text, 1111-2222-3333-4444"))
        self.assertEqual("Example text, ****-****-****-4444", output)
```

La composición de funciones es básicamente el hecho de que el resultado de una función se pasa como parámetro de la otra.

Podemos componer más de dos funciones. Por ejemplo, imagina que queremos añadir etiquetas HTML al texto:

```python
    def test_enclose_in_html_tag(self):
        output = enclose_in_tag("p", "Example text")
        self.assertEqual("<p>Example text</p>", output)
```

Esta sería una función simple para conseguirlo:

```python
def enclose_in_tag(tag, content):
    return f"<{tag}>{content}</{tag}>".format()
```

Y aquí componemos las funciones para combinar sus comportamientos:

```python
    def test_enclose_in_html_tag_and_undisclose_card_number(self):
        output = enclose_in_tag("p", undisclosed_card_number(print_this("Example text, 1111-2222-3333-4444")))
        self.assertEqual("<p>Example text, ****-****-****-4444</p>", output)
```

Para verlo un poco más claro:

```python
    def test_enclose_in_html_tag_and_undisclose_card_number(self):
        output = enclose_in_tag("p",
                                undisclosed_card_number(
                                    print_this("Example text, 1111-2222-3333-4444")
                                    )
                                )
        self.assertEqual("<p>Example text, ****-****-****-4444</p>", output)
```

En este caso podríamos decir que las funciones `undisclosed_card_number` y `enclose_in_tag` decoran el resultado de `print_this`. Es decir, lo modifican sin que hayamos tenido que tocar el código de esta última.

Ahora bien, a nosotras nos gustaría poder aplicar estas transformaciones, o una combinación de ellas, a otras funciones similares a `print_this`. El único problema es que componer así las funciones es un poco incómodo.

Y aquí es donde acuden en nuestra ayuda los decoradores y es donde tenemos que empezar a hablar de pasar funciones como parámetros y devolver funciones.

Considera este test:

```python
class PythonDecoratorTestCase(unittest.TestCase):
    def test_undisclosed_card_number(self):
        output = write_this("Example text, 1111-2222-3333-4444")
        self.assertEqual("<p>Example text, ****-****-****-4444</p>", output)

```

Y esta función para hacerlo pasar:

```python
def write_this(input_text):
    return input_text
```

¡Sorpresa! El test no pasa. Por supuesto, la función no aplica ninguna transformación al texto original. Para hacer esas transformaciones vamos a usar decoradores de Python. Esos decoradores van a tener esta pinta:

```python
@redact_card_number
@html_tag("p")
def write_this(input_text):
    return input_text
```

Escribir decoradores es un poco especial. Un decorador de Python lo que hace es devolvernos una función nueva que reemplaza a la función decorada. Esta función es recibida como argumento por el decorador, por lo que podemos usarla dentro de la función que vamos a devolver.

Voy a intentar mostrar el proceso paso a paso. Primero, con el decorador `@redact_card_number`, que no recibe parámetros. Luego lo haremos con `@html_tag` que es un poco diferente.

## Creando un decorador de Python

Vamos a decorar esta función:

```python
def show_this(input_text):
    return input_text
```

Empezaremos por este test:

```python
class PythonSimpleDecoratorTestCase(unittest.TestCase):
    def test_undisclosed_card_number(self):
        output = show_this("Example text, 1111-2222-3333-4444")
        self.assertEqual("Example text, ****-****-****-4444", output)
```

Obviamente, el test fallará. Añado la decoración:

```python
@redact_card_number
def show_this(input_text):
    return input_text
```

Como todavía no existe, fallará con el mensaje:

```
NameError: name 'redact_card_number' is not defined
```

Así que definimos la función, aunque vacía:

```python
def redact_card_number():
    pass
```

Y esto genera un nuevo error:

```
TypeError: redact_card_number() takes 0 positional arguments but 1 was given
```

Esto es porque al decorador se le pasa la función a la que decora y ahora no la estamos aceptando. Pongamos un argumento con un nombre significativo:

```python
def redact_card_number(original_function):
    pass
```

El error ahora cambia a:

```
TypeError: 'NoneType' object is not callable
```

Esto es porque la función redact_card_number debería devolver algo, que además tiene que ser un callable (una función, vamos).

Podemos devolver la misma función que le pasamos...

```python
def redact_card_number(original_function):
    return original_function
```

La buena noticia es que ahora el test se ejecuta completamente, pero falla. Este fallo es debido a que la función que devuelve el decorador es la misma que le hemos pasado, que es como decir que no hace nada.

```
Expected :Example text, ****-****-****-4444
Actual   :Example text, 1111-2222-3333-4444
<Click to see difference>
```

Pero no podemos simplemente aplicar la transformación y devolver el resultado:


```python
def redact_card_number(original_function):
    return re.sub("(\\d{4})-(\\d{4})-(\\d{4})-(\\d{4})", "****-****-****-\\4", original_function)
```

Esto no tiene sentido y falla ya que le estamos pasando una función y no un valor a `re.sub`.

```
TypeError: expected string or bytes-like object
```

Pero es que, además, lo que retorna `re.sub` no es un callable. Aunque hagamos este apaño, devuelve un string.

```python
def redact_card_number(original_function):
    example_text = "Example text, 1111-2222-3333-4444"
    return re.sub("(\\d{4})-(\\d{4})-(\\d{4})-(\\d{4})", "****-****-****-\\4", example_text)
```

Que no es _callable_:

```
TypeError: 'str' object is not callable
```

Tenemos que definir una función dentro de `redact_card_number` y eso es lo que tenemos que devolver. Dentro de esa función podremos usar `original_function`.

```python
def redact_card_number(original_function):
    def apply_transformation():
        example_text = "Example text, 1111-2222-3333-4444"
        return re.sub("(\\d{4})-(\\d{4})-(\\d{4})-(\\d{4})", "****-****-****-\\4", original_function(example_text))
    return apply_transformation
```

Lo interesante es que ahora falla por esto:

```
TypeError: apply_transformation() takes 0 positional arguments but 1 was given
```

Se le está pasando un parámetro a `apply_transformation` que resulta ser el parámetro que le pasamos a `original_function`. La función que devolvemos debe tener la misma signatura que la función decorada:

```python
def redact_card_number(original_function):
    def apply_transformation(original_argument):
        result = original_function(original_argument)
        return re.sub("(\\d{4})-(\\d{4})-(\\d{4})-(\\d{4})", "****-****-****-\\4", result)
    return apply_transformation
```

Y así el test pasa. La función que realmente se ejecuta es `apply_transformation`, la cual, en este ejemplo, ejecuta la función original para transformar su output.

Podemos aplicar el mismo decorador a cualquier función similar a `show_this`.

Así que para hacer un decorador básico:

* Creamos una función con el nombre del decorador que recibe la función original como argumento.
* Esta función devuelve otra función que tiene la misma signatura que la función original y recibe sus mismos argumentos.
* Dentro de esta función podemos usar la original para manipular tanto su input como su output.

## Creando un decorador de Python con parámetros

Muchas veces nos interesará poder pasar parámetros a los decoradores. Es el caso de `@html_tag("p")`, ya que lógicamente nos gustaría poder indicar una etiqueta HTML para ese fragmento de texto.

El proceso de escritura de un decorador con parámetros no es muy diferente del anterior. Simplemente, se añade una capa más de funciones para recibir los argumentos del decorador. Vamos a verlos:

Empecemos con un test.

```python
class PythonSimpleDecoratorTestCase(unittest.TestCase):
    def test_undisclosed_card_number(self):
        output = show_this("Example text, 1111-2222-3333-4444")
        self.assertEqual("Example text, ****-****-****-4444", output)

    def test_enclose_in_html_tag(self):
        output = show_this("Example text")
        self.assertEqual("<p>Example text</p>", output)
```

Y aquí indicamos que queremos decorar la función:

```python
@html_tag("p")
def show_this(input_text):
    return input_text
```

Empezamos con el error esperado de no tener definido `html_tag`.

```python
NameError: name 'html_tag' is not defined
```

Así que empezaos por añadir esta función:

```python
def html_tag():
    pass
```

Como hemos visto antes, el error ahora es que la función `html_tag` recibe un argumento, cuando no está esperando ninguno. La pregunta es: ¿qué argumento recibirá: la función original o el argumento del decorador?

Es fácil averiguarlo de esta forma:

```python
def html_tag(argument):
    return argument
```

Si `argument` es la función original, el test podrá ejecutarse aunque falle. Si `argument` es el argumento que hemos pasado al decorador, lanzará un error de tipo ya que no es _callable_.

Y esto es lo que obtenemos:

```
TypeError: 'str' object is not callable
```

Conclusión: lo primero que recibimos es el argumento del decorador que, en nuestro caso, es la tag que queremos usar. Tenemos que definir una función decorador que recibirá la función original y es lo que queremos devolver.

```python
def html_tag(tag):
    def decorate(original_function):
        pass
    return decorate
```

Esto nos da un error:

```
TypeError: 'NoneType' object is not callable
```

La función `decorate` devuelve None de forma implícita y debería devolver un _callable_ que será la función que reemplaza a `original_function` y que debe tener la misma signatura:

```python
def html_tag(tag):
    def decorate(original_function):
        def apply_transformation(original_argument):
            pass
        return apply_transformation
    return decorate
```

Estamos cerca, el test se ejecuta pero falla ya que no devolvemos nada:

```
Expected :<p>Example text</p>
Actual   :None
```

Solo nos queda añadir un poco de lógica:

```python
def html_tag(tag):
    def decorate(original_function):
        def apply_transformation(original_argument):
            original = original_function(original_argument)
            return f"<{tag}>{original}</{tag}>".format(tag=tag, original=original_argument)
        return apply_transformation
    return decorate
```

Como puedes ver, hay dos diferencias con respecto a los decoradores sin argumentos:

* La función decoradora recibe los argumentos que se le pasan.
* Hay que añadir una función intermedia que es la que recibe la función original.

## Usos de los decoradores

Los decoradores en Python pueden usarse para muchas cosas interesantes. Recuerda que tienen que devolver una función que pueda responder por la original.

Pero respetando eso, puedes hacer cosas antes y después de ejecutar la función original.

Esto nos permite conseguir ejecutar código extra cuando llamamos a la función decorada modificando sus entradas o salidas, o no.

Así, por ejemplo, podríamos escribir en un log, verificar que un usuario está autenticado o tiene permisos, hacer cache de un resultado y un largo etcétera de ideas.

Aquí tienes un ejemplo:

```python
def log_activity(original_function):
    def execute_with_log(original_argument):
        print("begin {}".format(original_function.__name__))
        result = original_function(original_argument)
        print("> end {}".format(original_function.__name__))
        return result
    return execute_with_log
```


## Un ejemplo completo

Para ilustrar el uso de los decoradores mostramos aquí este uso en tests para reutilizar código entre múltiples tests y test cases basados en esperar que se produzcan eventos.

En este `TestCase` de **Dungeon**, verificamos que se lanzan distintos eventos. El problema es que necesitamos hacer un setup y una verificación similar en todos los tests.

```python
class PlayerAsSubjectTestCase(unittest.TestCase):
    def test_can_register_an_observer_and_notify(self):
        fake_observer = FakeObserver()

        player = Player(EnergyUnit(100))
        player.register(fake_observer)

        player.do(TestCommand(EnergyUnit(50)))

        self.assertTrue(fake_observer.is_aware_of("player_energy_changed"))

    def test_notifies_player_sent_command_event(self):
        fake_observer = FakeObserver()

        player = Player(EnergyUnit(100))
        player.register(fake_observer)

        player.do(TestCommand(EnergyUnit(50)))

        self.assertTrue(fake_observer.is_aware_of("player_sent_command"))

    def test_notifies_player_died_event_when_energy_is_0(self):
        fake_observer = FakeObserver()

        player = Player(EnergyUnit(100))
        player.register(fake_observer)

        player.do(TestCommand(EnergyUnit(100)))

        self.assertTrue(fake_observer.is_aware_of("player_died"))

    def test_notifies_player_awake(self):
        fake_observer = FakeObserver()

        player = Player(EnergyUnit(100))
        player.register(fake_observer)

        player.awake_in(Dungeon(Rooms()))

        self.assertTrue(fake_observer.is_aware_of("player_awake"))
```

Compara esa versión, con esta otra en la que usamos un decorador al que indicamos qué evento estamos esperando:

```python
class PlayerAsSubjectTestCase(unittest.TestCase):
    def setUp(self):
        self.player = Player()
        self.observer = FakeObserver()
        self.player.register(self.observer)

    @expect_event("player_energy_changed")
    def test_can_register_an_observer_and_notify(self):
        self.player.do(FakeCommand(EnergyUnit(50)))

    @expect_event("player_sent_command")
    def test_notifies_player_sent_command_event(self):
        self.player.do(FakeCommand(EnergyUnit(50)))

    @expect_event("player_died")
    def test_notifies_player_died_event_when_energy_is_0(self):
        self.player.do(FakeCommand(EnergyUnit(100)))

    @expect_event("player_awake")
    def test_notifies_player_awake(self):
        self.player.awake_in(Dungeon(Rooms()))
```

Como se puede ver el ahorro de líneas es considerable y el TestCase resulta bastante más explicativo. Esto se ha logrado creando el decorador `expect_event`. Al tratarse de un decorador que recibe parámetros es un poco más complicado que un decorador sin parámetros.

La función `expect_event` es la cara visible decorador y recibe un parámetro, que es el nombre del evento que queremos comprobar. Dentro tenemos la función `assert_event` que es la que recibe la función que queremos decorar. Aquí la hemos llamado `test` porque representa uno de los tests que forman parte del `TestCase`.

Básicamente, lo que ocurre en un decorador es que se recibe una función y se devuelve otra función, típicamente una función que hace uso de la función decorada, añadiendo código antes y después, con lo que puede modificar los parámetros recibidos o la respuesta que se devuelve.

En este ejemplo, la función que vamos a devolver es `test_with_assertion`, la cual ejecuta la función decorada original y, a continuación, ejecuta la aserción de que el observer de test haya recibido un evento del tipo esperado. Observa que el parámetro de `test_with_assertion` es `self`, que hace referencia al `TestCase`.

Finalmente, devolvemos la función `assert_event`, resultado de haber compuesto la original.


```python
def expect_event(event):
    def assert_event(test):
        def test_with_assertion(self):
            test(self)
            self.assertTrue(self.observer.is_aware_of(event))

        return test_with_assertion
    return assert_event
```

Como resultado lo que ocurre es que se ejecuta la función test original y _automágicamente_, se verifica que el observer ha escuchado el evento deseado.

Este decorador se puede aplicar a cualquier método de test del proyecto, no solo a los de este _TestCase_ concreto. De este modo, además de ahorrarnos escribir muchas líneas de código, garantizamos un comportamiento uniforme de todos los tests en lo que se aplique y si mejoramos de algún modo esta verificación, la mejora se extenderá a todos usos.

## Más sobre decoradores

En este artículo no he cubierto las clases decoradoras, con las que podemos crear decoradores definiendo clases en lugar de funciones.

Tampoco hago mención de [functools](https://docs.python.org/3/library/functools.html), una librería que nos puede ayudar con la creación de decoradores al ofrecer utilidades parar trabajar con _higher-order functions_ o funciones de orden superior, que reciben o retornan otras funciones.
