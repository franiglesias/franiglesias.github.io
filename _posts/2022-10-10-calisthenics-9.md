---
layout: post
title: Object Calisthenics. No user getters, setters o propiedades públicas
categories: articles
tags: good-practices refactoring
---

Una serie de restricciones que te ayudarán a escribir mejor código. La última regla consiste en no usar getters, setters o propiedades públicas.

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

## No usar getters, setters o propiedades públicas

El objetivo de la regla es evitar que te bases en tu conocimiento del estado de los objetos de forma que acoples el resto del código a ese estado. En su lugar, los objetos solo deberían exponer comportamiento, minimizando la posibilidad de acoplarse a detalles de implementación. Por lo general, intentamos aplicar un principio llamado _Tell, don't ask_, de modo que en lugar de preguntar a un objeto sobre su estado (ask), le pedimos que haga cosas.

En nuestro ejemplo hay varios casos de estos. Vamos a verlos y plantear posibles soluciones.

### El caso de Invoice y StatementPrinter

En este código podemos ver que `StatementPrinter` le pregunta un montón de cosas a `Invoice`. Podríamos decir que el comportamiento de `Invoice` parece ser darle información sobre su estado a `StatementPrinter`.

```python
class StatementPrinter:
    def __init__(self, printer):
        self.printer = printer

    def print(self, invoice):
        self.printer.print(f'Statement for {invoice.customer()}\n')

        self.print_lines(invoice)

        self.printer.print(f'Amount owed is {FormattedAmount(invoice.amount()).dollars()}\n')
        self.printer.print(f'You earned {invoice.credits().current()} credits\n')

        return self.printer.output()

    def print_lines(self, invoice):
        for performance in invoice.performances():
            self.print_details(performance)

    def print_details(self, performance):
        self.printer.print(FormattedPerformance(performance).formatted())
```

De hecho, `StatementPrinter` sabe muchas cosas de `Invoice`. Por ejemplo, sabe que `Invoice` tiene `Customer`, `Amount`, `Credits` e incluso `Performances`. Literalmente, conoce su estructura interna.

Para intentar aligerar ese conocimiento voy a empezar a separar cosas. Haré un ejemplo paso a paso con `Customer`. Lo primero es extraer una variable `customer` para no usar directamente la invocación a `Invoice.customer()`. Lo que quiero es que haya un método en `StatementPrinter` que pueda imprimir la línea del cliente sin saber nada directamente de `Invoice`. 

```python
    def print(self, invoice):
        customer = invoice.customer()
        self.printer.print(f'Statement for {customer}\n')

        self.print_lines(invoice)

        self.printer.print(f'Amount owed is {FormattedAmount(invoice.amount()).dollars()}\n')
        self.printer.print(f'You earned {invoice.credits().current()} credits\n')

        return self.printer.output()
```

Ahora extraigo el método:

```python
    def print(self, invoice):
        customer = invoice.customer()
        self.fill_customer(customer)

        self.print_lines(invoice)

        self.printer.print(f'Amount owed is {FormattedAmount(invoice.amount()).dollars()}\n')
        self.printer.print(f'You earned {invoice.credits().current()} credits\n')

        return self.printer.output()

    def fill_customer(self, customer):
        self.printer.print(f'Statement for {customer}\n')
```

Y me deshago de la variable temporal:

```python
    def print(self, invoice):
        self.fill_customer(invoice.customer())

        self.print_lines(invoice)

        self.printer.print(f'Amount owed is {FormattedAmount(invoice.amount()).dollars()}\n')
        self.printer.print(f'You earned {invoice.credits().current()} credits\n')

        return self.printer.output()

    def fill_customer(self, customer):
        self.printer.print(f'Statement for {customer}\n')
```

Hago lo mismo con las demás datos:

```python
    def print(self, invoice):
        self.fill_customer(invoice.customer())

        self.print_lines(invoice)

        self.fill_amount(invoice.amount())
        self.fill_credits(invoice.credits())

        return self.printer.output()

    def fill_credits(self, credits):
        self.printer.print(f'You earned {credits.current()} credits\n')

    def fill_amount(self, amount):
        self.printer.print(f'Amount owed is {FormattedAmount(amount).dollars()}\n')

    def fill_customer(self, customer):
        self.printer.print(f'Statement for {customer}\n')
```

También modifico el método `print_lines` para mantener el paralelismo:

```python
class StatementPrinter:
    def __init__(self, printer):
        self.printer = printer

    def print(self, invoice):
        self.fill_customer(invoice.customer())
        self.fill_lines(invoice.performances())
        self.fill_amount(invoice.amount())
        self.fill_credits(invoice.credits())

        return self.printer.output()

    def fill_credits(self, credits):
        self.printer.print(f'You earned {credits.current()} credits\n')

    def fill_amount(self, amount):
        self.printer.print(f'Amount owed is {FormattedAmount(amount).dollars()}\n')

    def fill_customer(self, customer):
        self.printer.print(f'Statement for {customer}\n')

    def fill_lines(self, performances):
        for performance in performances:
            self.print_details(performance)

    def print_details(self, performance):
        self.printer.print(FormattedPerformance(performance).formatted())
```

Es cierto que seguimos haciendo llamadas de tipo _getter_ a `Invoice`, pero esto nos prepara para los siguientes pasos. Queremos no preguntarle cosas a `Invoice`. En su lugar, `Invoice` podría darle a `StatementPrinter` la información, sin desvelar sus detalles. Para ello usaremos un patrón _Visitor_.

Así que en lugar de preguntarle a `Invoice` por su información, esta rellena los datos que `StatementPrinter` necesita.

```python
    def print(self, invoice):
        invoice.fill(self)
        
        return self.printer.output()
```

De esta manera:

```python
    def fill(self, statement_printer):
        statement_printer.fill_customer(self.customer())
        statement_printer.fill_lines(self.performances())
        statement_printer.fill_amount(self.amount())
        statement_printer.fill_credits(self.credits())
```

Este cambio aún está incompleto porque todavía `StatementPrinter` sigue preguntando a `Performance`. 

```python
    def fill_lines(self, performances):
        for performance in performances:
            self.print_details(performance)

    def print_details(self, performance):
        self.printer.print(FormattedPerformance(performance).formatted())
```

En parte tendríamos que deshacer lo que hicimos al aplicar reglas anteriores porque no queremos que `StatementPrinter` sepa ningún detalle. Así que vamos a reintroducir un método que imprima una línea de detalles de la performance:

```python
    def fill_line(self, title, amount, audience):
        self.printer.print(f' {title}: {FormattedAmount(amount).dollars()} ({audience} seats)\n')
```

De este modo, `Invoice` puede controlar el modo que se rellena `StatementPrinter`, que ya no necesita saber ni siquiera cuantas líneas necesitará imprimir, pues de eso se encargará `Invoice`.

```python
    def fill(self, statement_printer):
        statement_printer.fill_customer(self.customer())
        for performance in self.performances():
            statement_printer.fill_line(performance.title(), performance.amount(), performance.audience())
        statement_printer.fill_amount(self.amount())
        statement_printer.fill_credits(self.credits())
```

Así es como queda `StatementPrinter`:

```python
class StatementPrinter:
    def __init__(self, printer):
        self.printer = printer

    def print(self, invoice):
        invoice.fill(self)

        return self.printer.output()

    def fill_credits(self, credits):
        self.printer.print(f'You earned {credits.current()} credits\n')

    def fill_amount(self, amount):
        self.printer.print(f'Amount owed is {FormattedAmount(amount).dollars()}\n')

    def fill_customer(self, customer):
        self.printer.print(f'Statement for {customer}\n')

    def fill_line(self, title, amount, audience):
        self.printer.print(f' {title}: {FormattedAmount(amount).dollars()} ({audience} seats)\n')


class FormattedAmount:
    def __init__(self, amount):
        self.amount = amount

    def dollars(self):
        return f"${self.amount.current() / 100:0,.2f}"
```

Y así queda `Invoice`:

```python
class Invoice:
    def __init__(self, data, plays):
        self._data = data
        self._customer = data['customer']
        self._performances = Performances(data['performances'], Plays(plays))

    def customer(self):
        return self._customer

    def performances(self):
        return self._performances

    def amount(self):
        amount = Amount(0)
        for performance in self.performances():
            amount = amount.add(performance.amount())

        return amount

    def credits(self):
        volume_credits = Credits(0)
        for performance in self.performances():
            volume_credits = volume_credits.add(performance.credits())

        return volume_credits

    def fill(self, statement_printer):
        statement_printer.fill_customer(self.customer())
        for performance in self.performances():
            statement_printer.fill_line(performance.title(), performance.amount(), performance.audience())
        statement_printer.fill_amount(self.amount())
        statement_printer.fill_credits(self.credits())
```

Algunos comentarios sobre lo que acabamos de hacer:

* Ahora tenemos que los métodos de `Invoice` solo son llamados por `Invoice`, así que los podríamos marcar como privados. En Python podemos hacer esto prefijando sus nombres.
* Una pregunta legítima que podemos hacer es si `Invoice` ahora sabe demasiado de `StatementPrinter` dato que hay cuatro métodos que tiene que conocer para poder usarlo. 
* 
* Para este caso específico podemos plantear esta solución. Al fin y al cabo, lo que hacemos con `StatementPrinter` es rellenar una plantilla. Podríamos tener entonces un método `fill` más genérico en el que indicamos que plantilla queremos rellenar. Algo similar a lo que se muestra a continuación. `Invoice` solo tiene que conocer un método:

```python
    def fill(self, statement_printer):
        statement_printer.fill('customer', self.customer())
        for performance in self.performances():
            statement_printer.fill('line', performance.title(), performance.amount(), performance.audience())
        statement_printer.fill('amount', self.amount())
        statement_printer.fill('credits', self.credits())
```

Y `StatementPrinter` ya no tiene que exponer detalles tampoco:

```python
    def fill(self, template, *args):
        getattr(self, 'fill_' + template)(*args)
```

¿Y qué pasa con `Performance`? Sigue exponiendo _getters_. Así que podríamos hacer algo similar:

```python
    def fill(self, statement_printer):
        statement_printer.fill('line', self.title(), self.amount(), self.audience())
```

Y ahora `Invoice` no tiene más que decirle a `Performance` que rellene su parte:

```python
    def fill(self, statement_printer):
        statement_printer.fill('customer', self.customer())
        for performance in self.performances():
            performance.fill(statement_printer)
        statement_printer.fill('amount', self.amount())
        statement_printer.fill('credits', self.credits())
```

A continuación, lo suyo sería hacer privados todos estos _getters_ o incluso eliminarlos.

El patrón de relación que nos ha quedado entre `Invoice` y `StatementPrinter` se llama _Double Dispatch_, pero podemos simplificar un poco las cosas de esta manera. `StatementPrinter` ya no sabe nada de `Invoice`:

```python
class StatementPrinter:
    def __init__(self, printer):
        self.printer = printer

    def print(self):
        return self.printer.output()

    def fill(self, template, *args):
        getattr(self, '_fill_' + template)(*args)

# ...
```

Y la función `statement` queda así, _and I think it's beautiful_:

```python
from domain.invoice import Invoice
from domain.statement_printer import StatementPrinter
from infrastructure.console_printer import ConsolePrinter


def statement(invoice_data, plays):
    statement_printer = StatementPrinter(ConsolePrinter())

    invoice = Invoice(invoice_data, plays)
    invoice.fill(statement_printer)

    return statement_printer.print()
```


### El caso especial de `Play`

El problema con Play está aquí:

```python
    def credits(self, audience):
        if "comedy" != self.type():
            return Credits(0)

        return Credits(math.floor(audience / 5))

    def amount(self, audience):
        if self.type() == "tragedy":
            return self.calculate_amount_for_tragedy(audience)
        if self.type() == "comedy":
            return self.calculate_amount_for_comedy(audience)

        raise ValueError(f'unknown type: {self.type()}')
```

`Play` tiene que preguntarse "¿qué tipo de obra soy?", para decidir como realizar el cálculo que le piden. Esto es muy similar a una violación del principio _Tell, don't ask_, ya que tiene que consultar una propiedad para poder escoger el algoritmo adecuado.

Los objetos tienen propiedades por algo. Normalmente, la razón de ser de esas propiedades es ser capaces de regular el comportamiento del objeto. Las propiedades tienen un papel similar al de los coeficientes de una ecuación y operan junto con los parámetros que se pasan a los métodos para calcular un resultado. 

Sin embargo, propiedades que modelan el _tipo_ de un objeto son harina de otro costal. Aportan el criterio para decidir qué algoritmo utilizar al realizar el cálculo. Pero si un objeto es de un _tipo_, esto debería reflejarse en el código por su _clase_. Cuando un objeto de una clase tiene _tipo_, y ese tipo determina la forma en que efectúa su comportamiento, lo que ocurre es que la clase debería tener variantes especializadas basadas en su tipo, ejecutando su comportamiento en su forma particular.

En nuestro ejemplo, está muy claro que hay dos tipos de obras: comedias y tragedias. Ambos tipos son obras teatrales, pero para los efectos de nuestro ejemplo, calculan sus importes y sus créditos de forma diferente.

¿Cómo podemos refactorizar `Play` para extraer las dos subclases? Vamos a ver un procedimiento bastante mecánico. En primer lugar duplicamos `Play` para crear la clase `Tragedy`, que extenderá de la misma `Play`:

```python
class Tragedy(Play):
    def __init__(self, data):
        self._name = data['name']
        self._type = data['type']

    def name(self):
        return self._name

    def type(self):
        return self._type

    def calculate_amount_for_comedy(self, audience):
        return Amount(30000) \
            .add(self.extra_amount_for_high_audience_in_comedy(audience)) \
            .add(Amount(300 * audience))

    def extra_amount_for_high_audience_in_comedy(self, audience):
        if audience <= 20:
            return Amount(0)

        return Amount(10000 + 500 * (audience - 20))

    def calculate_amount_for_tragedy(self, audience):
        return Amount(40000) \
            .add(self.extra_amount_for_high_audience_in_tragedy(audience))

    def extra_amount_for_high_audience_in_tragedy(self, audience):
        if audience <= 30:
            return Amount(0)

        return Amount(1000 * (audience - 30))

    def credits(self, audience):
        if "comedy" != self.type():
            return Credits(0)

        return Credits(math.floor(audience / 5))

    def amount(self, audience):
        if self.type() == "tragedy":
            return self.calculate_amount_for_tragedy(audience)
        if self.type() == "comedy":
            return self.calculate_amount_for_comedy(audience)

        raise ValueError(f'unknown type: {self.type()}')
```

El siguiente paso es reemplazar todas las condicionales sobre `self.type()` por `True`. En nuestro ejemplo, solo tenemos un caso en el método `amount`:

```python
    def amount(self, audience):
        if True:
            return self.calculate_amount_for_tragedy(audience)
        if self.type() == "comedy":
            return self.calculate_amount_for_comedy(audience)

        raise ValueError(f'unknown type: {self.type()}')
```

Probablemente, el IDE habrá empezado a señalar que la condicional es redundante porque ahora siempre se cumple. En mi caso está señalando que el resto del código del método no se ejecutará nunca. Así que podemos borrarlo:

```python
    def amount(self, audience):
        if True:
            return self.calculate_amount_for_tragedy(audience)
```

De hecho, nos sobra la condición:

```python
    def amount(self, audience):
        return self.calculate_amount_for_tragedy(audience)
```

Al hacer esto, dejamos de llamar a varios métodos, los que ejecutaríamos si el tipo fuese _comedy_. También los borramos porque no se llaman en más sitios. Nos va quedando esto:

```python
class Tragedy(Play):
    def __init__(self, data):
        self._name = data['name']
        self._type = data['type']

    def name(self):
        return self._name

    def type(self):
        return self._type

    def calculate_amount_for_tragedy(self, audience):
        return Amount(40000) \
            .add(self.extra_amount_for_high_audience_in_tragedy(audience))

    def extra_amount_for_high_audience_in_tragedy(self, audience):
        if audience <= 30:
            return Amount(0)

        return Amount(1000 * (audience - 30))

    def credits(self, audience):
        if "comedy" != self.type():
            return Credits(0)

        return Credits(math.floor(audience / 5))

    def amount(self, audience):
        return self.calculate_amount_for_tragedy(audience)
```

El siguiente paso es cambiar todas las condicionales que buscan tipos que no sean "tragedy" para reemplazarlas por `False`. En `Tragedy` ya no se da ese caso. Sin embargo, en `credits` tenemos una condición inversa que en el contexto de `Tragedy` equivale a comprobar si el tipo es _tragedy_. Así que en realidad, la condición siempre se cumplirá: 

```python
    def credits(self, audience):
        if True:
            return Credits(0)

        return Credits(math.floor(audience / 5))
```

Todo el código fuera de la condición no se ejecuta y lo borramos, por lo que el resultante será:

```python
    def credits(self, audience):
        return Credits(0)
```

El método `amount` llama sin más a otro método, así que podríamos integrar este último, así como eliminar referencias superfluas en el nombre del método que nos dice el importe extra. `Tragedy` quedará así y podremos eliminar también la propiedad `type` y todo lo relacionado con ella:

```python
class Tragedy(Play):
    def __init__(self, data):
        self._name = data['name']

    def name(self):
        return self._name

    def extra_amount_for_high_audience(self, audience):
        if audience <= 30:
            return Amount(0)

        return Amount(1000 * (audience - 30))

    def credits(self, audience):
        return Credits(0)

    def amount(self, audience):
        return Amount(40000).add(self.extra_amount_for_high_audience(audience))
```

Aplicamos el mismo tratamiento a `Comedy`. Empezamos duplicando `Play` y reemplazando todas las condicionales que verifican el tipo de tal modo que aquellas que chequean que el tipo es _comedy_ sean siempre `True` y las que no siempre `False`:

```python
class Comedy(Play):
    def __init__(self, data):
        self._name = data['name']
        self._type = data['type']

    def name(self):
        return self._name

    def type(self):
        return self._type

    def calculate_amount_for_comedy(self, audience):
        return Amount(30000) \
            .add(self.extra_amount_for_high_audience_in_comedy(audience)) \
            .add(Amount(300 * audience))

    def extra_amount_for_high_audience_in_comedy(self, audience):
        if audience <= 20:
            return Amount(0)

        return Amount(10000 + 500 * (audience - 20))

    def calculate_amount_for_tragedy(self, audience):
        return Amount(40000) \
            .add(self.extra_amount_for_high_audience_in_tragedy(audience))

    def extra_amount_for_high_audience_in_tragedy(self, audience):
        if audience <= 30:
            return Amount(0)

        return Amount(1000 * (audience - 30))

    def credits(self, audience):
        if False:
            return Credits(0)

        return Credits(math.floor(audience / 5))

    def amount(self, audience):
        if False:
            return self.calculate_amount_for_tragedy(audience)
        if True:
            return self.calculate_amount_for_comedy(audience)

        raise ValueError(f'unknown type: {self.type()}')
```

A continuación, eliminaríamos todo el código muerto y que no se ejecuta porque ya no será llamado nunca.

```python
class Comedy(Play):
    def __init__(self, data):
        self._name = data['name']

    def name(self):
        return self._name

    def calculate_amount_for_comedy(self, audience):
        return Amount(30000) \
            .add(self.extra_amount_for_high_audience_in_comedy(audience)) \
            .add(Amount(300 * audience))

    def extra_amount_for_high_audience_in_comedy(self, audience):
        if audience <= 20:
            return Amount(0)

        return Amount(10000 + 500 * (audience - 20))

    def credits(self, audience):
        return Credits(math.floor(audience / 5))

    def amount(self, audience):
            return self.calculate_amount_for_comedy(audience)
```

Y rematamos integrando y cambiando nombres:

```python
class Comedy(Play):
    def __init__(self, data):
        self._name = data['name']

    def name(self):
        return self._name

    def extra_amount_for_high_audience(self, audience):
        if audience <= 20:
            return Amount(0)

        return Amount(10000 + 500 * (audience - 20))

    def credits(self, audience):
        return Credits(math.floor(audience / 5))

    def amount(self, audience):
        return Amount(30000) \
            .add(self.extra_amount_for_high_audience(audience)) \
            .add(Amount(300 * audience))
```

Ahora vamos a ver como utilizar las nuevas clases especializadas. El lugar en el que se instancian objetos Play es aquí:

```python
class Plays:
    def __init__(self, data):
        self._data = data

    def get_by_id(self, play_id):
        return Play(self._data[play_id])
```

Una forma sencilla sería introducir un método factoría en Play que nos entregue la subclase adecuada:

```python
class Play:
    # ...

    @staticmethod
    def create(data):
        if data['type'] == "tragedy":
            return Tragedy(data)
        if data['type'] == "comedy":
            return Comedy(data)

        raise ValueError(f'unknown type: {data["type"]}')

    # ...
```

Y usarla:

```python
class Plays:
    def __init__(self, data):
        self._data = data

    def get_by_id(self, play_id):
        return Play.create(self._data[play_id])
```

Ahora, no queda más que eliminar todos los métodos y propiedades innecesarias en `Play`:

```python
class Play:
    @staticmethod
    def create(data):
        if data['type'] == "tragedy":
            return Tragedy(data)
        if data['type'] == "comedy":
            return Comedy(data)

        raise ValueError(f'unknown type: {data["type"]}')

    def credits(self, audience):
        pass

    def amount(self, audience):
        pass
```

El método factoría `create` decide qué subtipo concreto de `Play` se usará. Si en el futuro necesitamos dar soporte a más tipos no tenemos más que añadir una nueva clase y una nueva condición. 

## Por qué funciona

Esta regla suele ser más difícil de aceptar o entender si vienes de un estilo de programación procedural en el que conocer y controlar el estado lo es todo. Pero en programación orientada a objetos, cada objeto es responsable de su propio estado y de como implementa sus comportamientos. Por tanto, lo más importante es saber quién debe encargarse de qué, en lugar de tratar de obtener su estado y operar con él.

Cada objeto debe operar con su estado y comunicarse con otros objetos cuando necesite algo, o cuando quiera enviarles algo.

Al preguntar por una propiedad de otro objeto estamos acoplándonos a ese objeto, porque sabemos qué propiedad nos interesa y cómo obtenerla. Si usamos ese dato para un cálculo, es muy posible que ese objeto al que le preguntamos deba ejecutar ese cálculo. Por supuesto, puede ocurrir que el cálculo requiera alguna información del objeto que llama. Pero en ese caso la puede pasar como parámetro.

La regla de no usar _getters_, _setters_ o propiedades públicas, nos fuerza a pensar en los objetos como cajas negras a las que podemos pedirles que hagan cosas. En pocas palabras, la regla nos dice que no debemos acceder al estado interno los objetos del sistema. Si necesitamos algo de ellos, tenemos que poder pedirles que lo hagan, aportando información si es necesario. Algunos lenguajes como Ruby fuerzan que todas las propiedades de un objeto sean privadas por defecto, aunque es fácil introducir _getters_ o _setters_.

El hecho de no poder acceder al estado de los objetos es beneficioso para evitar el acoplamiento. Nos permite cambiar las implementaciones de los objetos de forma transparente al resto del sistema.

## El resultado

[Puedes consultar el proyecto en Github](https://github.com/franiglesias/theatrical-plays-kata) 

## ¿Fin? No todavía

Con esta entrega finaliza esta serie de artículos sobre la aplicación de las reglas de Object Calisthenics. Sin embargo, próximamente habrá un artículo de resumen y continuación con algunas conclusiones y lecciones aprendidas de este experimento.

{% include_relative series/calisthenics.md %}
