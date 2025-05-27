---
layout: post
title: Object Calisthenics. Empaquetar primitivas en objetos
categories: articles
tags: good-practices refactoring
---

Una serie de restricciones que te ayudarán a escribir mejor código. La tercera entrega trata sobre empaquetar primitivas en objetos.

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
* [No usar getters/setters o propiedades públicas](/calisthenics-9)

El objetivo de esta serie de artículos es desarrollar cada una de las restricciones aplicada a un ejemplo de código y tratar de explicar cómo y por qué funciona.

## Encapsular todas las primitivas y strings

Los lenguajes de programación proporcionan tipos de datos básicos, llamados primitivos, con los que podemos representar los diversos conceptos que maneja un programa. Sin embargo, esta representación suele ser imperfecta.

Pensemos por ejemplo, en un precio. El precio se puede representar con un número, pero hay varias características de los números con los que representamos precios que son importantes: son valores positivos, tienen decimales con reglas específicas de redondeo, y suele ser importante conocer la unidad monetaria, entre otros detalles.

Estas características no las proveen los tipos numéricos primitivos habituales. Por esa razón, un tipo específico, que puede estar basado en uno primitivo, pero que encapsule esas reglas es mucho mejor solución. Basta con realizar una encapsulación básica para empezar a obtener beneficios, ya que eso oculta al resto del programa los detalles de implementación del tipo y nos permite que evolucione sin afectar al resto del código. A medida que introducimos comportamiento y validaciones en ese objeto, el programa se beneficia automáticamente.

### Encapsular tipos primitivos simples

Así que volvamos a nuestro ejemplo, en el que tenemos un montón de posibles casos. Para empezar, nos encontramos con los parámetros que se pasan a la función `statement`. Estos nos presentan algunos problemas particulares porque contienen colecciones de cosas, así que vamos a dejarlo para la próxima regla.

Lo primero que nos encontramos es `total_amount`, que representa el importe de la factura y que va acumulando parciales.

```python
import math


def statement(invoice, plays):
    total_amount = 0
    volume_credits = 0
    result = f'Statement for {invoice["customer"]}\n'

    def format_as_dollars(amount):
        return f"${amount:0,.2f}"

    def calculate_performance_amount(perf, play):
        if play['type'] == "tragedy":
            return calculate_amount_for_tragedy(perf)
        if play['type'] == "comedy":
            return calculate_amount_for_comedy(perf)

        raise ValueError(f'unknown type: {play["type"]}')

    def calculate_amount_for_comedy(perf):
        amount = 30000
        amount += extra_amount_for_high_audience_in_comedy(perf)
        amount += 300 * perf['audience']
        return amount

    def extra_amount_for_high_audience_in_comedy(perf):
        if perf['audience'] <= 20:
            return 0

        return 10000 + 500 * (perf['audience'] - 20)

    def calculate_amount_for_tragedy(perf):
        amount = 40000
        amount += extra_amount_for_high_audience_in_tragedy(perf)
        return amount

    def extra_amount_for_high_audience_in_tragedy(perf):
        if perf['audience'] <= 30:
            return 0

        return 1000 * (perf['audience'] - 30)

    def calculate_performance_credits(perf, play):
        # add volume credits
        credits = max(perf['audience'] - 30, 0)
        # add extra credit for every ten comedy attendees
        credits += extra_volume_credits_for_comedy(perf, play)
        return credits

    def extra_volume_credits_for_comedy(perf, play):
        if "comedy" != play["type"]:
            return 0

        return math.floor(perf['audience'] / 5)

    for perf in invoice['performances']:
        play = plays[perf['playID']]
        this_amount = calculate_performance_amount(perf, play)
        performance_credits = calculate_performance_credits(perf, play)
        line = f' {play["name"]}: {format_as_dollars(this_amount/100)} ({perf["audience"]} seats)\n'

        result += line
        total_amount += this_amount
        volume_credits += performance_credits

    result += f'Amount owed is {format_as_dollars(total_amount/100)}\n'
    result += f'You earned {volume_credits} credits\n'
    return result

```

`total_amount` representa una cantidad de dinero. En este ejemplo, la unidad monetaria resulta ser el centavo como se puede apreciar en la forma en que se usa la función `format_as_dollars`. Básicamente, necesitaremos dos comportamientos: poder acumular y obtener el importe acumulado hasta el momento. Este nuevo tipo se podría llamar `Amount`.

Para no tener los test rotos mucho tiempo voy a introducir el cambio en paralelo, añadiendo la nueva clase, pero sin introducir el cambio hasta el último momento. Por supuesto, puedo hacer esto con TDD.

```python
import unittest


class AmountTestCase(unittest.TestCase):
    def test_contains_amount(self):
        amount_of_300 = Amount(300)
        self.assertEqual(300, amount_of_300.current())


if __name__ == '__main__':
    unittest.main()
```

```python
class Amount:
    def __init__(self, initial_amount):
        self._amount = initial_amount

    def current(self):
        return self._amount
```

Ahora, añadiré un método para acumular importes. Aprovecharé para hacerlo inmutable.

```python
import unittest

from domain.amount import Amount


class AmountTestCase(unittest.TestCase):
    def test_contains_amount(self):
        amount_of_300 = Amount(300)
        self.assertEqual(300, amount_of_300.current())

    def test_can_accumulate_partial_amounts(self):
        amount_of_300 = Amount(300)
        amount_of_500 = amount_of_300.add(Amount(200))
        self.assertEqual(500, amount_of_500.current())


if __name__ == '__main__':
    unittest.main()
```

```python
class Amount:
    def __init__(self, initial_amount):
        self._amount = initial_amount

    def current(self):
        return self._amount

    def add(self, other):
        new_amount = self._amount + other.current()
        return Amount(new_amount)
```

Con esto tengo suficiente para empezar a usarlo. Para ello introduzco una variable `invoice_amount`.

```python
import math

from domain.amount import Amount


def statement(invoice, plays):
    total_amount = 0
    invoice_amount = Amount(0)
    volume_credits = 0
    result = f'Statement for {invoice["customer"]}\n'

    # ...

    for perf in invoice['performances']:
        play = plays[perf['playID']]
        this_amount = calculate_performance_amount(perf, play)
        performance_credits = calculate_performance_credits(perf, play)
        line = f' {play["name"]}: {format_as_dollars(this_amount/100)} ({perf["audience"]} seats)\n'

        result += line
        total_amount += this_amount
        invoice_amount = invoice_amount.add(Amount(this_amount))
        volume_credits += performance_credits

    result += f'Amount owed is {format_as_dollars(total_amount/100)}\n'
    result += f'You earned {volume_credits} credits\n'
    return result

```

Y, finalmente, solo tendría que reemplazar la variable `total_amount` en la línea que imprime el importe final. La idea es que todos los cambios anteriores ya estén mezclados, de modo que este nuevo cambio ocurra en un único commit y se pueda revertir fácilmente en caso de que falle.

```python
import math

from domain.amount import Amount


def statement(invoice, plays):
    total_amount = 0
    invoice_amount = Amount(0)
    volume_credits = 0
    result = f'Statement for {invoice["customer"]}\n'

    # ...

    for perf in invoice['performances']:
        play = plays[perf['playID']]
        this_amount = calculate_performance_amount(perf, play)
        performance_credits = calculate_performance_credits(perf, play)
        line = f' {play["name"]}: {format_as_dollars(this_amount/100)} ({perf["audience"]} seats)\n'

        result += line
        total_amount += this_amount
        invoice_amount = invoice_amount.add(Amount(this_amount))
        volume_credits += performance_credits

    result += f'Amount owed is {format_as_dollars(invoice_amount.current()//100)}\n'
    result += f'You earned {volume_credits} credits\n'
    return result

```

De hecho, los tests de statement siguen pasando perfectamente, por lo que podemos quitar `total_amount` ya que ha dejado de usarse.

```python
import math

from domain.amount import Amount


def statement(invoice, plays):
    invoice_amount = Amount(0)
    volume_credits = 0
    result = f'Statement for {invoice["customer"]}\n'

    # ...

    for perf in invoice['performances']:
        play = plays[perf['playID']]
        this_amount = calculate_performance_amount(perf, play)
        performance_credits = calculate_performance_credits(perf, play)
        line = f' {play["name"]}: {format_as_dollars(this_amount/100)} ({perf["audience"]} seats)\n'

        result += line
        invoice_amount = invoice_amount.add(Amount(this_amount))
        volume_credits += performance_credits

    result += f'Amount owed is {format_as_dollars(invoice_amount.current()//100)}\n'
    result += f'You earned {volume_credits} credits\n'
    return result
```

Una cosa interesante es que `this_amount` también debería ser un `Amount`, así que tendría sentido examinar `calculate_performance_amount`, para que devuelva un tipo `Amount`. Eso nos lleva a una serie de cambios con una mecánica muy similar a la que hemos seguido. Introducimos el código nuevo en paralelo y lo consolidamos en un commit. Finalmente, usamos el nuevo cálculo en un único commit para que deshacerlo sea sencillo. Una vez que confirmamos que no se ha roto nada, eliminamos el código viejo.

En este caso, lo que voy a hacer es introducir un objeto Amount en las funciones que realizan el cálculo y, provisionalmente, dejaré que todavía no devuelvan el tipo `Amount`, sino el primitivo calculado con Amount. En una segunda fase adaptaré el código llamante para que espere el tipo `Amount`. He aquí un ejemplo:

```python
    def calculate_amount_for_comedy(perf):
        amount = 30000
        amount += extra_amount_for_high_audience_in_comedy(perf)
        amount += 300 * perf['audience']
        return amount
```

Primer paso es calcularlo en paralelo:

```python
    def calculate_amount_for_comedy(perf):
        base_amount = Amount(30000)
        amount_with_extra = base_amount.add(Amount(extra_amount_for_high_audience_in_comedy(perf)))
        comedy_amount = amount_with_extra.add(Amount(300 * perf['audience']))
        
        amount = 30000
        amount += extra_amount_for_high_audience_in_comedy(perf)
        amount += 300 * perf['audience']
        return amount
```

Una vez hecho un commit con esos cambios, utilizaré el nuevo cálculo, pero sin devolver todavía el objeto:

```python
    def calculate_amount_for_comedy(perf):
        base_amount = Amount(30000)
        amount_with_extra = base_amount.add(Amount(extra_amount_for_high_audience_in_comedy(perf)))
        comedy_amount = amount_with_extra.add(Amount(300 * perf['audience']))

        amount = 30000
        amount += extra_amount_for_high_audience_in_comedy(perf)
        amount += 300 * perf['audience']
        return comedy_amount.current()
```

Como los tests siguen pasando puedo consolidar el cambio y eliminar el código que ya no uso.

```python
    def calculate_amount_for_comedy(perf):
        base_amount = Amount(30000)
        amount_with_extra = base_amount.add(Amount(extra_amount_for_high_audience_in_comedy(perf)))
        comedy_amount = amount_with_extra.add(Amount(300 * perf['audience']))

        return comedy_amount.current()
```

Por supuesto, puedo evitar el uso de variables temporales:

```python
    def calculate_amount_for_comedy(perf):
        return Amount(30000)\
            .add(Amount(extra_amount_for_high_audience_in_comedy(perf)))\
            .add(Amount(300 * perf['audience']))\
            .current()
```

El mismo cambio se puede aplicar en muchos lugares. Usaremos el mismo procedimiento, aunque no lo voy a mostrar para no alargar el artículo innecesariamente. Así es como quedará, teniendo en cuenta que todavía estoy dejando que las funciones retornen el primitivo.

```python
import math

from domain.amount import Amount


def statement(invoice, plays):
    invoice_amount = Amount(0)
    volume_credits = 0
    result = f'Statement for {invoice["customer"]}\n'

    def format_as_dollars(amount):
        return f"${amount:0,.2f}"

    def calculate_performance_amount(perf, play):
        if play['type'] == "tragedy":
            return calculate_amount_for_tragedy(perf)
        if play['type'] == "comedy":
            return calculate_amount_for_comedy(perf)

        raise ValueError(f'unknown type: {play["type"]}')

    def calculate_amount_for_comedy(perf):
        return Amount(30000)\
            .add(Amount(extra_amount_for_high_audience_in_comedy(perf)))\
            .add(Amount(300 * perf['audience']))\
            .current()

    def extra_amount_for_high_audience_in_comedy(perf):
        if perf['audience'] <= 20:
            return Amount(0).current()

        return Amount(10000 + 500 * (perf['audience'] - 20)).current()

    def calculate_amount_for_tragedy(perf):
        return Amount(40000)\
            .add(Amount(extra_amount_for_high_audience_in_tragedy(perf)))\
            .current()


    def extra_amount_for_high_audience_in_tragedy(perf):
        if perf['audience'] <= 30:
            return Amount(0).current()

        return Amount(1000 * (perf['audience'] - 30)).current()

    def calculate_performance_credits(perf, play):
        credits = max(perf['audience'] - 30, 0)
        # add extra credit for every ten comedy attendees
        credits += extra_volume_credits_for_comedy(perf, play)
        return credits

    def extra_volume_credits_for_comedy(perf, play):
        if "comedy" != play["type"]:
            return 0

        return math.floor(perf['audience'] / 5)

    for perf in invoice['performances']:
        play = plays[perf['playID']]
        this_amount = calculate_performance_amount(perf, play)
        performance_credits = calculate_performance_credits(perf, play)
        line = f' {play["name"]}: {format_as_dollars(this_amount/100)} ({perf["audience"]} seats)\n'

        result += line
        invoice_amount = invoice_amount.add(Amount(this_amount))
        volume_credits += performance_credits

    result += f'Amount owed is {format_as_dollars(invoice_amount.current()//100)}\n'
    result += f'You earned {volume_credits} credits\n'
    return result
```

Ahora iré desde dentro hacia afuera cambiando el tipo retornado para dejar de usar el primitivo. Iré paso a paso, para asegurarme de que lo hago bien pasando los tests cada vez. Este es el primero:

```python
    def calculate_amount_for_comedy(perf):
        return Amount(30000)\
            .add(extra_amount_for_high_audience_in_comedy(perf))\
            .add(Amount(300 * perf['audience']))\
            .current()

    def extra_amount_for_high_audience_in_comedy(perf):
        if perf['audience'] <= 20:
            return Amount(0)

        return Amount(10000 + 500 * (perf['audience'] - 20))
```

Y sigo paso a paso hasta que los cambio todos. La idea es que solamente use `Amount::current` cuando sea necesario para imprimir la factura.

```python
import math

from domain.amount import Amount


def statement(invoice, plays):
    invoice_amount = Amount(0)
    volume_credits = 0
    result = f'Statement for {invoice["customer"]}\n'

    def format_as_dollars(amount):
        return f"${amount:0,.2f}"

    def calculate_performance_amount(perf, play):
        if play['type'] == "tragedy":
            return calculate_amount_for_tragedy(perf)
        if play['type'] == "comedy":
            return calculate_amount_for_comedy(perf)

        raise ValueError(f'unknown type: {play["type"]}')

    def calculate_amount_for_comedy(perf):
        return Amount(30000) \
            .add(extra_amount_for_high_audience_in_comedy(perf)) \
            .add(Amount(300 * perf['audience']))

    def extra_amount_for_high_audience_in_comedy(perf):
        if perf['audience'] <= 20:
            return Amount(0)

        return Amount(10000 + 500 * (perf['audience'] - 20))

    def calculate_amount_for_tragedy(perf):
        return Amount(40000) \
            .add(extra_amount_for_high_audience_in_tragedy(perf))

    def extra_amount_for_high_audience_in_tragedy(perf):
        if perf['audience'] <= 30:
            return Amount(0)

        return Amount(1000 * (perf['audience'] - 30))

    def calculate_performance_credits(perf, play):
        credits = max(perf['audience'] - 30, 0)
        # add extra credit for every ten comedy attendees
        credits += extra_volume_credits_for_comedy(perf, play)
        return credits

    def extra_volume_credits_for_comedy(perf, play):
        if "comedy" != play["type"]:
            return 0

        return math.floor(perf['audience'] / 5)

    for perf in invoice['performances']:
        play = plays[perf['playID']]
        this_amount = calculate_performance_amount(perf, play)
        performance_credits = calculate_performance_credits(perf, play)
        line = f' {play["name"]}: {format_as_dollars(this_amount.current() / 100)} ({perf["audience"]} seats)\n'

        result += line
        invoice_amount = invoice_amount.add(this_amount)
        volume_credits += performance_credits

    result += f'Amount owed is {format_as_dollars(invoice_amount.current() // 100)}\n'
    result += f'You earned {volume_credits} credits\n'
    return result
```

Como se puede ver, el código no ha cambiado demasiado y seguramente hay espacio para muchas mejoras, pero tenemos que proceder de manera sistemática. Así que vamos a buscar otro primitivo que podamos reemplazar.

`volume_credits` tiene un funcionamiento similar a `Amount`, pero significa una cosa distinta, así que vamos a introducir una clase `Credits`, que representará ese contexto. Y usaremos la misma aproximación: introducir la nueva clase, usarla en paralelo y, finalmente, sustituirla.

```python
import unittest

from domain.credits import Credits


class CreditsTestCase(unittest.TestCase):
    def test_contains_credits(self):
        self.assertEqual(100, Credits(100).current())  # add assertion here

    def test_accumulates_credits(self):
        initial_credits = Credits(100)
        extra = Credits(100)
        self.assertEqual(200, initial_credits.add(extra).current())


if __name__ == '__main__':
    unittest.main()
```

```python
class Credits:

    def __init__(self, initial_credits):
        self._credits = initial_credits

    def current(self):
        return self._credits

    def add(self, more_credits):
        return Credits(self._credits + more_credits.current())
```

Los cambios en el código los hacemos de la misma manera que antes. El resultado será más o menos este:


```python
import math

from domain.amount import Amount
from domain.credits import Credits


def statement(invoice, plays):
    invoice_amount = Amount(0)
    volume_credits = Credits(0)
    result = f'Statement for {invoice["customer"]}\n'

    # ...

    def calculate_performance_credits(perf, play):
        return Credits(max(perf['audience'] - 30, 0)).\
            add(extra_volume_credits_for_comedy(perf, play))


    def extra_volume_credits_for_comedy(perf, play):
        if "comedy" != play["type"]:
            return Credits(0)

        return Credits(math.floor(perf['audience'] / 5))

    for perf in invoice['performances']:
        play = plays[perf['playID']]
        this_amount = calculate_performance_amount(perf, play)
        performance_credits = calculate_performance_credits(perf, play)
        line = f' {play["name"]}: {format_as_dollars(this_amount.current() / 100)} ({perf["audience"]} seats)\n'

        result += line
        invoice_amount = invoice_amount.add(this_amount)
        volume_credits = volume_credits.add(performance_credits)

    result += f'Amount owed is {format_as_dollars(invoice_amount.current() // 100)}\n'
    result += f'You earned {volume_credits.current()} credits\n'
    return result

```

Nuestro siguiente candidato es `result`, que es un string que va acumulando las líneas que se imprimirán en la factura. De hecho, podríamos incorporar el concepto de `Printer` como objeto encargado de _imprimir_ las líneas que se le pasan, en lugar de un simple almacén de líneas para devolver al final. Queremos que funcione más o menos como indica este test:

```python
import unittest


class PrinterTestCase(unittest.TestCase):
    def test_can_print_lines(self):
        printer = Printer()

        printer.print("Line 1")
        printer.print("Line 2")

        expected = "Line 1Line 2"

        self.assertEqual(expected, printer.output())


if __name__ == '__main__':
    unittest.main()

```

De momento lo implementamos así, que es más o menos como está en el código original y será suficiente para lo que necesitamos:

```python
class Printer:
    def __init__(self):
        self._lines = ""

    def print(self, line):
        self._lines += line

    def output(self):
        return self._lines
```

Par integrarlo, procedemos del mismo modo que antes. Primero lo introducimos en paralelo y dejamos que el último cambio sea muy simple. El resultado, una vez eliminado el código anterior es este:

```python
import math

from domain.amount import Amount
from domain.credits import Credits
from domain.printer import Printer


def statement(invoice, plays):
    printer = Printer()
    invoice_amount = Amount(0)
    volume_credits = Credits(0)
    printer.print(f'Statement for {invoice["customer"]}\n')

    def format_as_dollars(amount):
        return f"${amount:0,.2f}"

    def calculate_performance_amount(perf, play):
        if play['type'] == "tragedy":
            return calculate_amount_for_tragedy(perf)
        if play['type'] == "comedy":
            return calculate_amount_for_comedy(perf)

        raise ValueError(f'unknown type: {play["type"]}')

    def calculate_amount_for_comedy(perf):
        return Amount(30000) \
            .add(extra_amount_for_high_audience_in_comedy(perf)) \
            .add(Amount(300 * perf['audience']))

    def extra_amount_for_high_audience_in_comedy(perf):
        if perf['audience'] <= 20:
            return Amount(0)

        return Amount(10000 + 500 * (perf['audience'] - 20))

    def calculate_amount_for_tragedy(perf):
        return Amount(40000) \
            .add(extra_amount_for_high_audience_in_tragedy(perf))

    def extra_amount_for_high_audience_in_tragedy(perf):
        if perf['audience'] <= 30:
            return Amount(0)

        return Amount(1000 * (perf['audience'] - 30))

    def calculate_performance_credits(perf, play):
        return Credits(max(perf['audience'] - 30, 0)). \
            add(extra_volume_credits_for_comedy(perf, play))

    def extra_volume_credits_for_comedy(perf, play):
        if "comedy" != play["type"]:
            return Credits(0)

        return Credits(math.floor(perf['audience'] / 5))

    for perf in invoice['performances']:
        play = plays[perf['playID']]
        this_amount = calculate_performance_amount(perf, play)
        performance_credits = calculate_performance_credits(perf, play)

        line = f' {play["name"]}: {format_as_dollars(this_amount.current() / 100)} ({perf["audience"]} seats)\n'
        printer.print(line)

        invoice_amount = invoice_amount.add(this_amount)
        volume_credits = volume_credits.add(performance_credits)

    printer.print(f'Amount owed is {format_as_dollars(invoice_amount.current() // 100)}\n')
    printer.print(f'You earned {volume_credits.current()} credits\n')

    return printer.output()

```

### Encapsular estructuras de datos nativas

Nos quedan varios objetos interesantes. En particular Play y Performance, que son centrales en este dominio. Veamos cómo los podemos tratar.

En principio, estos objetos están tratados como diccionarios (o hash, o array asociativo, según el lenguaje). La tentación es intentar crear desde cero un objeto que reproduzca esa estructura. Sin embargo, vamos a seguir un enfoque más simplista. Por el momento solo vamos a encapsular esos diccionarios y añadir métodos que nos permitan acceder recuperar los valores de sus claves.

Una vez hecho esto, que será el primer paso, podremos hacer evolucionar la estructura interna sin que el resto del código tenga que preocuparse de ello. La razón para hacerlo así es evitar mezclar distintos objetivos en una única acción de refactor.

Después de examinar el código pienso que voy a empezar por Performance. En el bucle de la función statement se recorren las distintas Performances que se van a facturar y se opera con sus datos. En principio, una performance tiene las siguientes propiedades:

* playID, que hace referencia a la obra representada
* audience, que representa la cantidad de pública asistente

Así que introduciré la clase `Performance`, que tendrá por el momento dos métodos públicos: `play_id` y `audience`. En esta ocasión no voy a hacer tests, ya que son métodos triviales y su comportamiento quedará cubierto por los tests que ya tenemos.

```python
class Performance:
    def __init__(self, perf):
        self._data = perf

    def audience(self):
        return self._data['audience']

    def play_id(self):
        return self._data['playID']
```

Sospecho lo que estás pensando, pero de momento lo único que quiero es estar seguro de que el cambio funcionará. Ten en cuenta que este ejemplo es muy sencillo. En situaciones en que las estructuras de datos sean más complejas, este paso previo sirve para explorar las responsabilidades del objeto sin preocuparnos de su estructura interna.

Ahora toca introducirlo. Será aquí:

```python
    for perf in invoice['performances']:
        performance = Performance(perf)
        play = plays[perf['playID']]
        this_amount = calculate_performance_amount(perf, play)
        performance_credits = calculate_performance_credits(perf, play)

        line = f' {play["name"]}: {format_as_dollars(this_amount.current() / 100)} ({perf["audience"]} seats)\n'
        printer.print(line)

        invoice_amount = invoice_amount.add(this_amount)
        volume_credits = volume_credits.add(performance_credits)
```

Es ahora cuando podemos empezar a usarlo. Primero, en este nivel de abstracción:

```python
    for perf in invoice['performances']:
        performance = Performance(perf)
        play = plays[performance.play_id()]
        this_amount = calculate_performance_amount(perf, play)
        performance_credits = calculate_performance_credits(perf, play)

        line = f' {play["name"]}: {format_as_dollars(this_amount.current() / 100)} ({performance.audience()} seats)\n'
        printer.print(line)

        invoice_amount = invoice_amount.add(this_amount)
        volume_credits = volume_credits.add(performance_credits)

    printer.print(f'Amount owed is {format_as_dollars(invoice_amount.current() // 100)}\n')
    printer.print(f'You earned {volume_credits.current()} credits\n')
```

Y ahora viene algo interesante. Tenemos un par de funciones a las que les pasamos las variables `perf` (que representa una `Performance`) y `play` para hacer cálculos con ellas:

```python
    def calculate_performance_amount(perf, play):
        if play['type'] == "tragedy":
            return calculate_amount_for_tragedy(perf)
        if play['type'] == "comedy":
            return calculate_amount_for_comedy(perf)

        raise ValueError(f'unknown type: {play["type"]}')
```

De hecho, podemos ver que esta función llama a otras que utilizan `perf` como único parámetro. Esto nos está indicando que este comportamiento es propio de `Performance`. Es decir, sería responsabilidad de `Performance` calcular el importe facturable. Básicamente me estoy refiriendo a estas funciones:

```python
    def calculate_amount_for_comedy(perf):
        return Amount(30000) \
            .add(extra_amount_for_high_audience_in_comedy(perf)) \
            .add(Amount(300 * perf['audience']))

    def extra_amount_for_high_audience_in_comedy(perf):
        if perf['audience'] <= 20:
            return Amount(0)

        return Amount(10000 + 500 * (perf['audience'] - 20))

    def calculate_amount_for_tragedy(perf):
        return Amount(40000) \
            .add(extra_amount_for_high_audience_in_tragedy(perf))

    def extra_amount_for_high_audience_in_tragedy(perf):
        if perf['audience'] <= 30:
            return Amount(0)

        return Amount(1000 * (perf['audience'] - 30))
```

¿Cómo voy a hacer este cambio? La verdad es que se me ocurren un par de maneras, aunque muy similares. El objetivo es copiar y adaptar el código que ahora está en funciones internas en `statement` para que sean métodos en `Performance`. La dificultad está en cómo hacer esto sin romper el test que tenemos.

Vamos con la primera forma. El primer paso es copiar el código de las funciones en `Performance` y adaptarlo de manera que no haya errores. Debería quedar más o menos así:

```python
from domain.amount import Amount


class Performance:
    def __init__(self, perf):
        self.data = perf

    def audience(self):
        return self.data['audience']

    def play_id(self):
        return self.data['playID']

    def calculate_amount_for_comedy(self):
        return Amount(30000) \
            .add(self.extra_amount_for_high_audience_in_comedy()) \
            .add(Amount(300 * self.audience()))

    def extra_amount_for_high_audience_in_comedy(self):
        if self.audience() <= 20:
            return Amount(0)

        return Amount(10000 + 500 * (self.audience() - 20))

    def calculate_amount_for_tragedy(self):
        return Amount(40000) \
            .add(self.extra_amount_for_high_audience_in_tragedy())

    def extra_amount_for_high_audience_in_tragedy(self):
        if self.audience() <= 30:
            return Amount(0)

        return Amount(1000 * (self.audience() - 30))
```

Ahora tenemos que pasar `performance` en vez de `perf` a la función en la línea:

```python
        this_amount = calculate_performance_amount(perf, play)
```

En estos casos, lo que suelo hacer es añadir un nuevo parámetro y luego reemplazar su uso, hasta que el viejo parámetro queda sin usar. Cuando verifico que todo funciona correctamente, elimino el viejo.

```python
    def calculate_performance_amount(perf, play, performance):
        if play['type'] == "tragedy":
            return calculate_amount_for_tragedy(perf)
        if play['type'] == "comedy":
            return calculate_amount_for_comedy(perf)

        raise ValueError(f'unknown type: {play["type"]}')
```

En este punto puedo hacer commit antes de realizar el cambio importante, que sería hacer que `performance` ejecute el cálculo:

```python
    def calculate_performance_amount(perf, play, performance):
    if play['type'] == "tragedy":
        return performance.calculate_amount_for_tragedy()
    if play['type'] == "comedy":
        return performance.calculate_amount_for_comedy()

    raise ValueError(f'unknown type: {play["type"]}')
```

He hecho el cambio y los tests siguen pasando, así que puedo eliminar el parámetro `perf` y también las funciones internas que ya no necesito.

```python
import math

from domain.amount import Amount
from domain.credits import Credits
from domain.performance import Performance
from domain.printer import Printer


def statement(invoice, plays):
    printer = Printer()
    invoice_amount = Amount(0)
    volume_credits = Credits(0)
    printer.print(f'Statement for {invoice["customer"]}\n')

    def format_as_dollars(amount):
        return f"${amount:0,.2f}"

    def calculate_performance_amount(play, performance):
        if play['type'] == "tragedy":
            return performance.calculate_amount_for_tragedy()
        if play['type'] == "comedy":
            return performance.calculate_amount_for_comedy()

        raise ValueError(f'unknown type: {play["type"]}')

    def calculate_performance_credits(perf, play):
        return Credits(max(perf['audience'] - 30, 0)). \
            add(extra_volume_credits_for_comedy(perf, play))

    def extra_volume_credits_for_comedy(perf, play):
        if "comedy" != play["type"]:
            return Credits(0)

        return Credits(math.floor(perf['audience'] / 5))

    for perf in invoice['performances']:
        performance = Performance(perf)
        play = plays[performance.play_id()]
        this_amount = calculate_performance_amount(play, performance)
        performance_credits = calculate_performance_credits(perf, play)

        line = f' {play["name"]}: {format_as_dollars(this_amount.current() / 100)} ({performance.audience()} seats)\n'
        printer.print(line)

        invoice_amount = invoice_amount.add(this_amount)
        volume_credits = volume_credits.add(performance_credits)

    printer.print(f'Amount owed is {format_as_dollars(invoice_amount.current() // 100)}\n')
    printer.print(f'You earned {volume_credits.current()} credits\n')

    return printer.output()
```

¿Empieza a tener mejor pinta? Parece que sí. Hacemos lo mismo con `calculate_performance_credits`. No voy a poner todo el detalle del proceso, pero es la misma idea: mover el código a `Performance`, adaptándolo y cambiando los usos de las funciones internas por llamadas al objeto. Finalmente, eliminar el código que no necesitamos.

Así es como queda `Performance`:

```python
import math

from domain.amount import Amount
from domain.credits import Credits


class Performance:
    def __init__(self, perf):
        self.data = perf

    def audience(self):
        return self.data['audience']

    def play_id(self):
        return self.data['playID']

    def calculate_amount_for_comedy(self):
        return Amount(30000) \
            .add(self.extra_amount_for_high_audience_in_comedy()) \
            .add(Amount(300 * self.audience()))

    def extra_amount_for_high_audience_in_comedy(self):
        if self.audience() <= 20:
            return Amount(0)

        return Amount(10000 + 500 * (self.audience() - 20))

    def calculate_amount_for_tragedy(self):
        return Amount(40000) \
            .add(self.extra_amount_for_high_audience_in_tragedy())

    def extra_amount_for_high_audience_in_tragedy(self):
        if self.audience() <= 30:
            return Amount(0)

        return Amount(1000 * (self.audience() - 30))

    def calculate_performance_credits(self, play):
        return Credits(max(self.audience() - 30, 0)). \
            add(self.extra_volume_credits_for_comedy(play))

    def extra_volume_credits_for_comedy(self, play):
        if "comedy" != play["type"]:
            return Credits(0)

        return Credits(math.floor(self.audience() / 5))
```

Y ahora reemplazamos las llamadas a las funciones por `Performance`:

```python
from domain.amount import Amount
from domain.credits import Credits
from domain.performance import Performance
from domain.printer import Printer


def statement(invoice, plays):
    printer = Printer()
    invoice_amount = Amount(0)
    volume_credits = Credits(0)
    printer.print(f'Statement for {invoice["customer"]}\n')

    def format_as_dollars(amount):
        return f"${amount:0,.2f}"

    def calculate_performance_amount(play, performance):
        if play['type'] == "tragedy":
            return performance.calculate_amount_for_tragedy()
        if play['type'] == "comedy":
            return performance.calculate_amount_for_comedy()

        raise ValueError(f'unknown type: {play["type"]}')

    for perf in invoice['performances']:
        performance = Performance(perf)
        play = plays[performance.play_id()]
        this_amount = calculate_performance_amount(play, performance)
        performance_credits = performance.calculate_performance_credits(play)

        line = f' {play["name"]}: {format_as_dollars(this_amount.current() / 100)} ({performance.audience()} seats)\n'
        printer.print(line)

        invoice_amount = invoice_amount.add(this_amount)
        volume_credits = volume_credits.add(performance_credits)

    printer.print(f'Amount owed is {format_as_dollars(invoice_amount.current() // 100)}\n')
    printer.print(f'You earned {volume_credits.current()} credits\n')

    return printer.output()
```

El panorama se ha ido despejando al introducir objetos que han _atraído_ comportamiento y eso que aún nos queda por traer a colación el objeto `Play`.

Pero ahora nos fijamos en estas líneas. Hay una falta de _simetría_ que ralla un poco:

```python
        this_amount = calculate_performance_amount(play, performance)
        performance_credits = performance.calculate_performance_credits(play)
```

Está claro que `calculate_performance_amount` es un comportamiento de `Performance`, es hora de llevarlo a su lugar. Hacemos exactamente lo mismo. Copiar y adaptar. Luego reemplazar.

```python
import math

from domain.amount import Amount
from domain.credits import Credits


class Performance:
    def __init__(self, perf):
        self.data = perf

    def audience(self):
        return self.data['audience']

    def play_id(self):
        return self.data['playID']

    def calculate_amount_for_comedy(self):
        return Amount(30000) \
            .add(self.extra_amount_for_high_audience_in_comedy()) \
            .add(Amount(300 * self.audience()))

    def extra_amount_for_high_audience_in_comedy(self):
        if self.audience() <= 20:
            return Amount(0)

        return Amount(10000 + 500 * (self.audience() - 20))

    def calculate_amount_for_tragedy(self):
        return Amount(40000) \
            .add(self.extra_amount_for_high_audience_in_tragedy())

    def extra_amount_for_high_audience_in_tragedy(self):
        if self.audience() <= 30:
            return Amount(0)

        return Amount(1000 * (self.audience() - 30))

    def calculate_performance_credits(self, play):
        return Credits(max(self.audience() - 30, 0)). \
            add(self.extra_volume_credits_for_comedy(play))

    def extra_volume_credits_for_comedy(self, play):
        if "comedy" != play["type"]:
            return Credits(0)

        return Credits(math.floor(self.audience() / 5))

    def calculate_performance_amount(self, play):
        if play['type'] == "tragedy":
            return self.calculate_amount_for_tragedy()
        if play['type'] == "comedy":
            return self.calculate_amount_for_comedy()

        raise ValueError(f'unknown type: {play["type"]}')
```

Un detalle que quiero destacar de Performance es el uso de la auto-encapsulación. Esto consiste en no acceder directamente a las propiedades de una clase, sino a través de métodos que podrían ser privados. De este modo, el resto del código de la clase no tiene que saber nada acerca de su estructura y me da libertad para cambiarla en cualquier momento, como veremos más adelante.

```python
from domain.amount import Amount
from domain.credits import Credits
from domain.performance import Performance
from domain.printer import Printer


def statement(invoice, plays):
    printer = Printer()
    invoice_amount = Amount(0)
    volume_credits = Credits(0)
    printer.print(f'Statement for {invoice["customer"]}\n')

    def format_as_dollars(amount):
        return f"${amount:0,.2f}"

    for perf in invoice['performances']:
        performance = Performance(perf)
        play = plays[performance.play_id()]
        this_amount = performance.calculate_performance_amount(play)
        performance_credits = performance.calculate_performance_credits(play)

        line = f' {play["name"]}: {format_as_dollars(this_amount.current() / 100)} ({performance.audience()} seats)\n'
        printer.print(line)

        invoice_amount = invoice_amount.add(this_amount)
        volume_credits = volume_credits.add(performance_credits)

    printer.print(f'Amount owed is {format_as_dollars(invoice_amount.current() // 100)}\n')
    printer.print(f'You earned {volume_credits.current()} credits\n')

    return printer.output()
```

Mejoremos un poco el nombre de las cosas:

```python
from domain.amount import Amount
from domain.credits import Credits
from domain.performance import Performance
from domain.printer import Printer


def statement(invoice, plays):
    printer = Printer()
    invoice_amount = Amount(0)
    volume_credits = Credits(0)
    printer.print(f'Statement for {invoice["customer"]}\n')

    def format_as_dollars(amount):
        return f"${amount:0,.2f}"

    for perf in invoice['performances']:
        performance = Performance(perf)
        play = plays[performance.play_id()]
        this_amount = performance.amount(play)
        performance_credits = performance.credits(play)

        line = f' {play["name"]}: {format_as_dollars(this_amount.current() / 100)} ({performance.audience()} seats)\n'
        printer.print(line)

        invoice_amount = invoice_amount.add(this_amount)
        volume_credits = volume_credits.add(performance_credits)

    printer.print(f'Amount owed is {format_as_dollars(invoice_amount.current() // 100)}\n')
    printer.print(f'You earned {volume_credits.current()} credits\n')

    return printer.output()
```

Nos queda introducir un objeto para representar una obra, que será `Play`. Por supuesto, hay una relación estrecha entre `Performance` y `Play` pero, de momento, no nos vamos a ocupar de eso. Simplemente queremos introducir el concepto y luego, ya veremos a dónde nos lleva.

Lo primero que hago es revisar qué cosas necesitamos de Play:

* `name`, para crear líneas de concepto en la factura.
* `type`, para saber qué tipo de obra es, ya que implica precios diferentes.

Esencialmente, hacemos lo mismo que con `Performance`. Empezamos simplemente encapsulando la estructura de datos de la manera más simple posible:

```python
class Play:
    def __init__(self, data):
        self._data = data

    def name(self):
        return self._data['name']

    def type(self):
        return self._data['type']
```

Como primer paso, reemplazamos la representación actual por el objeto. `Play` se usa sobre todo en `Performance`, pero hay un uso en `statement` que, de momento, necesitamos tener en cuenta:

```python
from domain.amount import Amount
from domain.credits import Credits
from domain.performance import Performance
from domain.play import Play
from domain.printer import Printer


def statement(invoice, plays):
    printer = Printer()
    invoice_amount = Amount(0)
    volume_credits = Credits(0)
    printer.print(f'Statement for {invoice["customer"]}\n')

    def format_as_dollars(amount):
        return f"${amount:0,.2f}"

    for perf in invoice['performances']:
        performance = Performance(perf)
        play = Play(plays[performance.play_id()])
        this_amount = performance.amount(play)
        performance_credits = performance.credits(play)

        line = f' {play.name()}: {format_as_dollars(this_amount.current() / 100)} ({performance.audience()} seats)\n'
        printer.print(line)

        invoice_amount = invoice_amount.add(this_amount)
        volume_credits = volume_credits.add(performance_credits)

    printer.print(f'Amount owed is {format_as_dollars(invoice_amount.current() // 100)}\n')
    printer.print(f'You earned {volume_credits.current()} credits\n')

    return printer.output()
```

```python
import math

from domain.amount import Amount
from domain.credits import Credits


class Performance:
    def __init__(self, perf):
        self.data = perf

    def audience(self):
        return self.data['audience']

    def play_id(self):
        return self.data['playID']

    def calculate_amount_for_comedy(self):
        return Amount(30000) \
            .add(self.extra_amount_for_high_audience_in_comedy()) \
            .add(Amount(300 * self.audience()))

    def extra_amount_for_high_audience_in_comedy(self):
        if self.audience() <= 20:
            return Amount(0)

        return Amount(10000 + 500 * (self.audience() - 20))

    def calculate_amount_for_tragedy(self):
        return Amount(40000) \
            .add(self.extra_amount_for_high_audience_in_tragedy())

    def extra_amount_for_high_audience_in_tragedy(self):
        if self.audience() <= 30:
            return Amount(0)

        return Amount(1000 * (self.audience() - 30))

    def credits(self, play):
        return Credits(max(self.audience() - 30, 0)). \
            add(self.extra_volume_credits_for_comedy(play))

    def extra_volume_credits_for_comedy(self, play):
        if "comedy" != play.type():
            return Credits(0)

        return Credits(math.floor(self.audience() / 5))

    def amount(self, play):
        if play.type() == "tragedy":
            return self.calculate_amount_for_tragedy()
        if play.type() == "comedy":
            return self.calculate_amount_for_comedy()

        raise ValueError(f'unknown type: {play.type()}')
```

Esta es únicamente un primer paso. Dentro de un momento, veremos algunas ideas para proseguir con el refactor basándonos en las oportunidades que nos proporciona haber introducido objetos.

## Por qué funciona

La regla de encapsular todos los primitivos en objetos funciona porque, de entrada, nos ayuda a separar responsabilidades entre los diversos conceptos que participan en el programa. Además, contribuye a ocultar algunos detalles de implementación, haciendo más fácil entender qué está pasando.

Los objetos nos permiten encapsular reglas de negocio y aislar los detalles de implementación entre las distintas partes del código. Esto ayuda, además, en que esas mismas partes puedan evolucionar de forma independiente, sin afectar al funcionamiento del conjunto del programa. Ninguna parte del programa necesita saber, por ejemplo, los detalles estructurales de Performance o Play. Simplemente, les pasan mensajes para que proporcionen la información solicitada. La forma en que se calcula no es importante para el objeto que envía el mensaje, pero igualmente la obtiene.

A medida que hemos ido introduciendo objetos, hemos podido reducir el tamaño de la función `statement` y que su código sea mucho más expresivo. Por supuesto, es mejorable, pero ahora no están mezclados la mayor parte de detalles. En conjunto, hay mucha más cantidad de código, pero es mucho más legible y fácil de mantener.

Esto ocurre porque los objetos funcionan como _atractores_ de comportamiento. Una vez que descubrimos un objeto que participa en el programa, resulta fácil asignarle responsabilidades y extraerlas del código inicial. Por otro lado, los objetos nos ayudan a garantizar que los datos que encapsulan cumplen las reglas de dominio requeridas. No necesitamos verificarlo constantemente.

## Más allá

### Agregación de objetos

Al introducir objetos se va clarificando el escenario del programa y las relaciones entre los distintos conceptos. En nuestro ejercicio, por ejemplo, se aprecia muy bien que `Play` es un elemento de `Performance` y, salvo por conocer el nombre de la obra para poder imprimir la factura, la función `statement` no necesita saber ni que existe.

Así que podemos transformar `Performance` para usar `Play`. Sin embargo, antes nos vendría bien cambiar el modo en que Performance guarda su información. Es ahora cuando se pueden apreciar los beneficios de la auto-encapsulación. Sólo tengo que cambiar unas pocas líneas:

```python
class Performance:
    def __init__(self, perf):
        self._audience = perf['audience']
        self._play_id = perf['playID']

    def audience(self):
        return self._audience

    def play_id(self):
        return self._play_id

    # ...
```

De esta forma, es más fácil añadir una nueva propiedad:

```python
class Performance:
    def __init__(self, perf, plays):
        self._audience = perf['audience']
        self._play_id = perf['playID']
        self._play = Play(plays[perf['playID']])
        
    def audience(self):
        return self._audience

    def play_id(self):
        return self._play_id

    def play(self):
        return self._play
```

Y dar soporte al cambio en la instanciación, así como en el único uso directo que hace `statement` de `Play`.

```python
    for perf in invoice['performances']:
        performance = Performance(perf, plays)
        play = Play(plays[performance.play_id()])
        this_amount = performance.amount(play)
        performance_credits = performance.credits(play)

        line = f' {performance.play().name()}: {format_as_dollars(this_amount.current() / 100)} ({performance.audience()} seats)\n'
        printer.print(line)

        invoice_amount = invoice_amount.add(this_amount)
        volume_credits = volume_credits.add(performance_credits)
```

Nos queda eliminar el paso de `Play` a los métodos `amount` y `credits`. Pero será bastante fácil:

```python
import math

from domain.amount import Amount
from domain.credits import Credits
from domain.play import Play


class Performance:
    def __init__(self, perf, plays):
        self._audience = perf['audience']
        self._play_id = perf['playID']
        self._play = Play(plays[perf['playID']])

    def audience(self):
        return self._audience

    def play_id(self):
        return self._play_id

    def play(self):
        return self._play

    def calculate_amount_for_comedy(self):
        return Amount(30000) \
            .add(self.extra_amount_for_high_audience_in_comedy()) \
            .add(Amount(300 * self.audience()))

    def extra_amount_for_high_audience_in_comedy(self):
        if self.audience() <= 20:
            return Amount(0)

        return Amount(10000 + 500 * (self.audience() - 20))

    def calculate_amount_for_tragedy(self):
        return Amount(40000) \
            .add(self.extra_amount_for_high_audience_in_tragedy())

    def extra_amount_for_high_audience_in_tragedy(self):
        if self.audience() <= 30:
            return Amount(0)

        return Amount(1000 * (self.audience() - 30))

    def credits(self, play):
        return Credits(max(self.audience() - 30, 0)). \
            add(self.extra_volume_credits_for_comedy(self.play()))

    def extra_volume_credits_for_comedy(self, play):
        if "comedy" != self.play().type():
            return Credits(0)

        return Credits(math.floor(self.audience() / 5))

    def amount(self):
        if self.play().type() == "tragedy":
            return self.calculate_amount_for_tragedy()
        if self.play().type() == "comedy":
            return self.calculate_amount_for_comedy()

        raise ValueError(f'unknown type: {self.play().type()}')
```

Y tras eso, eliminar el parámetro innecesario:

```python
from domain.amount import Amount
from domain.credits import Credits
from domain.performance import Performance
from domain.printer import Printer


def statement(invoice, plays):
    printer = Printer()
    invoice_amount = Amount(0)
    volume_credits = Credits(0)
    printer.print(f'Statement for {invoice["customer"]}\n')

    def format_as_dollars(amount):
        return f"${amount:0,.2f}"

    for perf in invoice['performances']:
        performance = Performance(perf, plays)
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

Sí, lo sé. Se pueden ver algunas cosillas cuestionables todavía. Vamos a seguir permitiendo que sean las reglas de Calisthenics las que nos guíen en el proceso y veremos si se arreglan o no.

## El resultado

El código ha evolucionado muchísimo tras aplicar la regla de encapsular primitivos en objetos. Sin embargo, todavía nos quedan algunos por atacar. Particularmente `invoice` y `plays`, pero los dejaremos para la próxima regla que nos pide hacer Colecciones de primera clase, lo que significa encapsular cada colección es su propia clase.

Si observamos el código desde el punto de vista de refactoring está claro que aún nos queda mucho trabajo por hacer y algunos _smells_ son evidentes y no están siendo tratados. Esto tienen un motivo en el contexto de estos artículos y no es otro que queremos ver si aplicar las reglas de forma sistemática nos conduce eventualmente a un mejor diseño. Hasta ahora creo que puede decirse que sí, con algunas salvedades, pero también es cierto que estamos aplicando cada regla una por una. En otras circunstancias estaríamos usando las reglas allí donde se viesen aplicables sin importar el orden.

En cualquier caso, en este momento podemos observar algunos efectos positivos, ya que las responsabilidades se han ido distribuyendo en objetos y funciones.

{% include_relative series/calisthenics.md %}
