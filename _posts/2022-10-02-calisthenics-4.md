---
layout: post
title: Object Calisthenics. Colecciones de primera clase
categories: articles
tags: good-practices refactoring
---

Una serie de restricciones que te ayudarán a escribir mejor código. En esta ocasión hablaremos de poner las colecciones en primera clase.

## Qué es object calisthenics

La [calistenia es una disciplina de entrenamiento físico](https://www.calistenia.net/que-es/) que se basa en trabajar con el propio peso buscando desarrollar tanto fuerza como armonía y precisión en el movimiento.

En el campo del software, Jeff Bay introdujo una idea similar en un artículo de la publicación _The ThoughtWorks Anthology: Essays on Software Technology and Innovation_ en 2008. Su propuesta consistía en nueve restricciones al escribir código que tendrán el efecto de mejorar su estructura y diseño.

Estas restricciones están pensadas para forzar ciertos buenos hábitos al escribir código orientado a objetos, contribuyendo a desarrollar un código de mejor calidad y a identificar los elementos que hacen bueno el diseño de un código. Por otro lado, es importante tener en cuenta que la mayoría de ellas tienen sentido en el paradigma de orientación a objetos por lo que podrían no ser aplicables a otros paradigmas. Aun así, creo que se pueden aprovechar algunas.

La lista de restricciones es la siguiente:

* [Un solo nivel de indentación por método](/calisthenics-1)
* [No usar la palabra clave ELSE](/calisthenics-2)
* [Encapsular todas las primitivas y strings](/calisthenics-3)
* [Colecciones de primera clase](/calisthenics-4)
* [Un punto por línea](/calisthenics-5)
* [No usar abreviaturas](/calisthenics-6)
* [Mantener todas las entidades pequeñas](/calisthenics-7)
* [No más de dos variables de instancia por clase](/calisthenics-8)
* No usar getters/setters o propiedades públicas

El objetivo de esta serie de artículos es desarrollar cada una de las restricciones aplicada a un ejemplo de código y tratar de explicar cómo y por qué funciona.

## Colecciones de primera clase

La traducción literal a español no refleja muy bien lo que implica esta regla, pero es bastante sencilla. Se trata de encapsular en un objeto toda estructura de datos que represente una colección de tal manera que la única propiedad de este objeto sea esa misma estructura, con los métodos que necesitemos para tener acceso a los datos. Y en el fondo no es más que una extensión de la regla anterior. Unificadas ambas, podríamos decir que cualquier estructura de datos nativa del lenguaje debería ser encapsulada, da igual lo simple (primitivos) o compleja que sea (colecciones).

El motivo es aislarte de la estructura de datos de tal forma que el resto del programa no esté acoplado a la misma. Esto nos permite cambiar la estructura sin tener que tocar el resto del código cuando tengamos alguna razón para ello.

En el ejemplo que estamos usando en esta serie tenemos un par de buenos casos: `plays` y `performances`, dentro de `invoice`.

## Colección con acceso por clave

Este es el caso de `plays`. Accedemos a un elemento de esta colección dada una clave, que en este caso es el ID de la obra. La responsabilidad de `plays` en este sistema es actuar como una especie de catálogo en el que consultar las obras que la compañía puede representar. Simplemente, necesitamos un método `get_by_id`, que nos devuelva la obra solicitada.

```python
class Plays:
    def __init__(self, data):
        self._data = data

    def get_by_id(self, play_id):
        return Play(self._data[play_id])
```

Únicamente tenemos un uso y es fácil reemplazarlo:

```python
# ...
    for perf in invoice['performances']:
        performance = Performance(perf, Plays(plays))
        this_amount = performance.amount()
        performance_credits = performance.credits()

# ...
```

```python
import math

from domain.amount import Amount
from domain.credits import Credits


class Performance:
    def __init__(self, perf, plays):
        self._audience = perf['audience']
        self._play_id = perf['playID']
        self._play = plays.get_by_id(self._play_id)

# ...
```

Fíjate que no se trata de refactorizar la estructura en sí y cambiarla por otra que pueda ser más eficiente o apropiada. Se trata simplemente de no usar directamente ninguna estructura nativa, como si fuese una dependencia de terceros a la que no queremos acoplarnos.

Recuerda también aplicar YAGNI (no lo vas a necesitar), e introduce solo los métodos que tu código necesite para funcionar.

### Colección iterable

La única diferencia significativa entre el caso anterior y este, en el que vamos a encapsular la colección de performances, es que queremos poder iterar los elementos de esta colección, ya sea mediante un bucle `for` como el que tenemos en el ejemplo, ya sea mediante otro enfoque.

En python podemos hacer iterable una clase definiendo el método `__iter__` para que devuelva una clase iteradora, la cual debe contener el método `__next__`:

```python

class Performances:
    def __init__(self, data, plays):
        self._data = data
        self._plays = plays

    def __iter__(self):
        return PerformancesIterator(self)

    def by_index(self, index):
        return Performance(self._data[index], self._plays)

    def size(self):
        return len(self._data)


class PerformancesIterator:
    def __init__(self, performances):
        self._performances = performances
        self._current = 0

    def __next__(self):
        if self._current >= self._performances.size():
            raise StopIteration

        result = self._performances.by_index(self._current)
        self._current += 1
        return result
```

En el cuerpo de `statement` hacemos de esta manera:

```python
from domain.amount import Amount
from domain.credits import Credits
from domain.performance import Performances
from domain.play import Plays
from domain.printer import Printer


def statement(invoice, plays):
    printer = Printer()
    invoice_amount = Amount(0)
    volume_credits = Credits(0)
    performances = Performances(invoice['performances'], Plays(plays))

    printer.print(f'Statement for {invoice["customer"]}\n')

    def format_as_dollars(amount):
        return f"${amount:0,.2f}"

    for performance in performances:
        this_amount = performance.amount()
        performance_credits = performance.credits()

        line = f' {performance.play().name()}: {format_as_dollars(this_amount.current() / 100)} ({performance.audience()} seats)\n'
        printer.print(line)

        invoice_amount = invoice_amount.add(this_amount)
        volume_credits = volume_credits.add(performance_credits)

    printer.print(f'Amount owed is {format_as_dollars(invoice_amount.current() // 100)}\n')
    printer.print(f'You earned {volume_credits.current()} credits\n')

    return printer.output()
```

Este cambio ha sido un poco más elaborado y ha conllevado algunas modificaciones interesantes. Por ejemplo, la instanciación de `Performance` ocurre dentro de `Performances`, así que `statement` ya no necesita conocer cómo se construye un objeto `Performance`.Luego profundizaré en algunas consecuencias de esto.

Como he mencionado antes, lo único que hemos hecho ha sido mover la estructura de datos original (un diccionario) dentro de una nueva clase. De esta forma, el código de statement, no conoce los detalles de implementación de `Performances` (o de `Plays`) pero sigue pudiendo acceder a la información que necesita. En el futuro podríamos cambiar esto sin necesidad de afectar a `statement`, lo que es una ventaja importante.

Por eso, aunque ahora mismo el código dentro de `Performances` nos parezca menos que bueno, podremos cambiarlo en cualquier momento sin miedo de romper cosas en múltiples lugares. Los cambios ocurrirán únicamente en un sitio (dentro de `Performance`), maximizando la mantenibilidad y manteniendo localizados los errores potenciales.

## Por qué funciona

Al igual que ocurre con la regla anterior, encapsular colecciones nos permite desacoplarnos de la estructura nativa de datos. Esto es una gran ventaja porque nos aporta libertad a la hora de cambiar esta estructura y la gestión de los datos en ella.

Además, este tipo de cambios suele generar algunas ventajas más. Las estructuras nativas están diseñadas para cubrir numerosos casos de uso, por lo que son genéricas y pueden incluir numerosos métodos que no vamos a necesitar o que introducen confusión a la hora de utilizarlos. Al encapsular en una clase, podemos definir cómo queremos que el resto del programa interactúe con ella de forma inequívoca, usando incluso un lenguaje apropiado a nuestro dominio.

Por otro lado, estos procesos de encapsulación ayudan a descubrir y modelar mejor relaciones entre conceptos, sugiriendo dónde deben ir las distintas responsabilidades.

## Más allá

A medida que aplicamos las reglas de Object Calisthenics el código no solo va tomando mejor forma, sino que también desvela áreas que pueden mejorar.

Esto ocurre porque, en general, las reglas nos fuerzan a organizar mejor el código. No arreglan los problemas, pero contribuyen a despejar el paisaje de una forma parecida a lo que ocurre cuando, por ejemplo, organizamos las piezas de un puzzle por colores o texturas antes de empezar. Se podría decir, que gracias a esta manera de trabajar conseguimos dividir un problema grande en partes manejables.

Así, por ejemplo, tras el último cambio podemos ver que `invoice` es la última estructura de datos nativa que nos queda por arreglar. Pero también vemos que podríamos mejorar cosas en la forma en que instanciamos `Performance`.

### Encapsular estructuras de datos

Como he mencionado más arriba, tanto la regla de hoy "Encapsular colecciones" como la del pasado artículo "Encapsular primitivos" son dos caras de una misma moneda" encapsular cualquier estructura de datos nativa. Esto es, cualquier concepto que aparece en nuestro dominio debería ser representado por un objeto que se puede implementar usando la estructura de datos que más nos convenga, pero sin que el resto del código tenga que saber qué estructura en concreto estamos usando.

En este ejercicio he dejado `invoice` para el final para analizarlo con calma. En principio, un objeto `Invoice` nos debería proporcionar el nombre del cliente (para imprimir la factura) y la lista de actuaciones.

```python
class Invoice:
    def __init__(self, data):
        self._data = data

    def customer(self):
        return self._data['customer']

    def performances(self):
        return self._data['performances']
```

Y reemplazarlo sus usos en el código resultaría trivial:

```python
def statement(invoice, plays):
    printer = Printer()
    invoice_amount = Amount(0)
    volume_credits = Credits(0)
    inv = Invoice(invoice)

    performances = Performances(inv.performances(), Plays(plays))

    printer.print(f'Statement for {inv.customer()}\n')

    # ...
```

De entrada, es fácil ver que `Invoice` nos pide más responsabilidades. Por ejemplo, la instanciación de `Performances` debería ocurrir en `Invoice`. Podríamos hacerlo así:

```python
from domain.performance import Performances
from domain.play import Plays


class Invoice:
    def __init__(self, data, plays):
        self._data = data
        self._customer = data['customer']
        self._performances = Performances(data['performances'], Plays(plays))

    def customer(self):
        return self._customer

    def performances(self):
        return self._performances
```

Y usarlo de esta manera:

```python
from domain.amount import Amount
from domain.credits import Credits
from domain.invoice import Invoice
from domain.printer import Printer


def statement(invoice, plays):
    printer = Printer()
    invoice_amount = Amount(0)
    volume_credits = Credits(0)
    inv = Invoice(invoice, plays)

    printer.print(f'Statement for {inv.customer()}\n')

    def format_as_dollars(amount):
        return f"${amount:0,.2f}"

    for performance in inv.performances():
        this_amount = performance.amount()
        performance_credits = performance.credits()

        line = f' {performance.play().name()}: {format_as_dollars(this_amount.current() / 100)} ({performance.audience()} seats)\n'
        printer.print(line)

        invoice_amount = invoice_amount.add(this_amount)
        volume_credits = volume_credits.add(performance_credits)

    printer.print(f'Amount owed is {format_as_dollars(invoice_amount.current() // 100)}\n')
    printer.print(f'You earned {volume_credits.current()} credits\n')

    return printer.output()
```

Ahora está claro que la lógica para calcular `invoice_amount` y `volume_credits` está reclamando fuertemente formar parte de `Invoice`, cosa que tiene su complicación dada la forma en que se _imprime_ la factura. Ya llegaremos a esto, pero ahora se ve claramente que hay dos responsabilidades diferentes: el cálculo de las líneas y totales de la factura y la impresión de las mismas. Nuestro problema es que ahora aparecen entrelazadas.

¿Hay algo que podamos hacer aquí? Una posibilidad es eliminar variables temporales, lo que reduce bastante el ruido, aclarando algunas cosas, pero _ensuciando_ otras.

```python
from domain.amount import Amount
from domain.credits import Credits
from domain.invoice import Invoice
from domain.printer import Printer


def statement(invoice, plays):
    printer = Printer()
    invoice_amount = Amount(0)
    volume_credits = Credits(0)
    inv = Invoice(invoice, plays)

    printer.print(f'Statement for {inv.customer()}\n')

    def format_as_dollars(amount):
        return f"${amount:0,.2f}"

    for performance in inv.performances():
        line = f' {performance.play().name()}: {format_as_dollars(performance.amount().current() / 100)} ({performance.audience()} seats)\n'
        printer.print(line)

        invoice_amount = invoice_amount.add(performance.amount())
        volume_credits = volume_credits.add(performance.credits())

    printer.print(f'Amount owed is {format_as_dollars(invoice_amount.current() // 100)}\n')
    printer.print(f'You earned {volume_credits.current()} credits\n')

    return printer.output()
```

### Evolución interna de los objetos

Hemos dicho que al encapsular estructuras de datos en objetos, la evolución interna de estos se hace de forma transparente para el resto del código. Esto nos permite hacer cambios sin romper funcionalidades, especialmente si estamos protegidas por tests.

Vamos a ver unos ejemplos.

Tras la transformación anterior, alguien podría argumentar que llamamos dos veces a `performance.amount()`, lo que podría tener consecuencias en, ejem, performance.

```python
    # ...
    for performance in inv.performances():
        line = f' {performance.play().name()}: {format_as_dollars(performance.amount().current() / 100)} ({performance.audience()} seats)\n'
        printer.print(line)

        invoice_amount = invoice_amount.add(performance.amount())
        volume_credits = volume_credits.add(performance.credits())

    # ...
```

Si esto te supone mucho problema, un patrón _memoization_ podría ayudar. Básicamente, se trata de mantener una _cache_ del cálculo, de la cual el código que llaman no tiene que saber ni que existe. Por ejemplo, esta implementación bastante ingenua:

```python
import math

from domain.amount import Amount
from domain.credits import Credits


class Performance:
    def __init__(self, perf, plays):
        self._audience = perf['audience']
        self._play_id = perf['playID']
        self._play = plays.get_by_id(self._play_id)
        self._amount = None

    # ...

    def amount(self):
        if self._amount is not None:
            return self._amount

        if self.play().type() == "tragedy":
            tragedy = self.calculate_amount_for_tragedy()
            self._amount = tragedy
            return tragedy
        if self.play().type() == "comedy":
            comedy = self.calculate_amount_for_comedy()
            self._amount = comedy
            return comedy

        raise ValueError(f'unknown type: {self.play().type()}')
```

Alternativamente, podrías [utilizar esta clase memoize de Graham Jenson](https://maori.geek.nz/python-decorator-to-memoize-instance-methods-ad4f6a05f1dc), con lo que te bastaría decorar el método `amount` con un `@memoize`.

Como puedes ver, al tener objetos con responsabilidades bien definidas y un contrato claro con sus usuarios, introducir mejoras es muchísimo más fácil y seguro.

Otro asunto interesante es que cuando instanciamos `Performance`, seguimos pasando la colección completas de obras. Pero no tenemos por qué hacerlo así, ya que ahora es más fácil montar `Performance` con la obra (`Play`) que le corresponde. Este es el código que tenemos ahora:

```python
class Performances:
    def __init__(self, data, plays):
        self._data = data
        self._plays = plays

    def __iter__(self):
        return PerformancesIterator(self)

    def by_index(self, index):
        return Performance(self._data[index], self._plays)

    def size(self):
        return len(self._data)
```

Y este el cambio que proponemos:

```python
class Performances:
    def __init__(self, data, plays):
        self._data = data
        self._plays = plays

    def __iter__(self):
        return PerformancesIterator(self)

    def by_index(self, index):
        return Performance(self._data[index], self._plays.get_by_id(self._data[index]['playID']))

    def size(self):
        return len(self._data)
```

Mientras que `Performance` podría quedar así:

```python
class Performance:
    def __init__(self, perf, play):
        self._audience = perf['audience']
        self._play = play
        self._amount = None

    # ...
```

Pero entonces resulta que podemos tener un constructor mucho más natural:

```python
class Performance:
    def __init__(self, audience, play):
        self._audience = audience
        self._play = play
        self._amount = None
```

Y usarlo de esta otra forma:

```python
    def by_index(self, index):
        play = self._data[index]
        return Performance(play['audience'], self._plays.get_by_id(play['playID']))
```

## Resultado

Object Calisthenics nos está ayudando a despejar el diseño del código, identificando objetos y repartiendo responsabilidades. Gracias a ello tenemos un código que, aunque es más grande, está organizado en objetos cada vez más especializados en sus tareas, de modo que la comprensión del sistema es mejor, a la vez que se hace más mantenible y, como acabamos de ver, incluso más optimizable.
