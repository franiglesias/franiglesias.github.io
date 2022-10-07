---
layout: post
title: Object Calisthenics. Mantener todas las entidades pequeñas
categories: articles
tags: good-practices refactoring
---

Una serie de restricciones que te ayudarán a escribir mejor código. En esta ocasión hablaremos de reducir el tamaño de todas las entidades.

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
* Mantener todas las entidades pequeñas
* No más de dos variables de instancia por clase
* No usar getters/setters o propiedades públicas

El objetivo de esta serie de artículos es desarrollar cada una de las restricciones aplicada a un ejemplo de código y tratar de explicar cómo y por qué funciona.

## Mantener todas las entidades pequeñas

Esta regla suele generar discusión porque vamos a poner un límite totalmente arbitrario al tamaño de las entidades de código. Esto se refiere a clases, al número de métodos, al cuerpo de funciones, al número de archivos en un paquete, etc. Por ejemplo, esta es una propuesta más o menos típica:

* 10 archivos por paquete o carpeta
* 50 líneas por clase
* 5 líneas por método o función
* 2 argumentos por método o función

Así que se trata de recorrer el código buscando áreas que superen estos límites.

El objetivo, como ocurre en todas las reglas de Calisthenics, es que tratar de forzar la aplicación de las reglas nos traiga como resultado un código mejor diseñado, más fácil de entender y de mantener. En el caso de esta, lo que buscamos obtener es un sistema de objetos pequeños muy simples.

Lo cierto es que después de todos los cambios resultado de aplicar las reglas anteriores, nos encontramos con relativamente pocos casos problemáticos. Pero alguno hay.

### Paquetes y sub-paquetes

Por ejemplo, el paquete domain, que contiene casi todo el código que hemos generado, no llega a 10 archivos. En parte es porque tenemos algunos archivos que contienen dos clases, algo que no está recomendado en todos los lenguajes. Puedes verlo como una forma de contribuir a esta regla, haciendo que el módulo de Python se pueda considerar como un sub-paquete y forzando que no contenga más de 10 clases o funciones.

En general, en el caso de encontrarnos con paquetes de más de 10 archivos, deberíamos plantearnos agruparlos por algún criterio en sub-paquetes cohesivos.

### Clases grandes

Tenemos una clase que tiene más de 50 líneas. `Performance` contiene gran parte de la lógica del programa pero, ¿podemos reducir su tamaño? O bien, ¿necesita realmente ser tan grande? Además, el método `amount` tiene unas 10 líneas, con lo cual también supera el límite de cinco que habíamos definido.

```python
class Performance:
    def __init__(self, audience, play):
        self._audience = audience
        self._play = play
        self._amount = None

    def audience(self):
        return self._audience

    def play(self):
        return self._play

    def title(self):
        return self._play.name()

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

    def credits(self):
        return Credits(max(self.audience() - 30, 0)). \
            add(self.extra_volume_credits_for_comedy())

    def extra_volume_credits_for_comedy(self):
        if "comedy" != self.play().type():
            return Credits(0)

        return Credits(math.floor(self.audience() / 5))

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

Parte del problema de `Performance` es que se ocupa de varias cosas. Gran parte de su lógica depende del tipo de obra representada, así que tiene que preguntarle a `Play` por su tipo y hacer cálculos basados en eso. Esto nos remite a la última regla que nos pide no exponer _getters_, _setters_ o propiedades públicas de los objetos que, a su vez, se basa en la aplicación del principio "Tell, don't ask". En pocas palabras: si tienes que preguntar un objeto por una información, para actuar con base en esa información, entonces haz que el objeto se encargue de hacerlo.

De hecho, si la lógica estuviese en `Play` podríamos reducir el tamaño de la clase `Performance`. Vamos a empezar por ahí.

Fundamentalmente, podemos mover algunos métodos de `Performance` a `Play`, así que simplemente los copio y los adapto. Cuando los tenga listos, podré reemplazarlos. Voy con los relacionados con el tipo _Comedy_. Un detalle importante es que ahora tenemos que pasar el argumento de audiencia para permitir el cálculo.

```python
class Play:
    def __init__(self, data):
        self._data = data

    def name(self):
        return self._data['name']

    def type(self):
        return self._data['type']

    def calculate_amount_for_comedy(self, audience):
        return Amount(30000) \
            .add(self.extra_amount_for_high_audience_in_comedy(audience)) \
            .add(Amount(300 * audience))

    def extra_amount_for_high_audience_in_comedy(self, audience):
        if audience <= 20:
            return Amount(0)

        return Amount(10000 + 500 * (audience - 20))
```

Ahora puedo introducirlos en lugar de los existentes, que puedo eliminar a continuación, una vez que he comprobado que los tests siguen pasando igualmente.

```python
    def amount(self):
        if self._amount is not None:
            return self._amount

        if self.play().type() == "tragedy":
            tragedy = self.calculate_amount_for_tragedy()
            self._amount = tragedy
            return tragedy
        if self.play().type() == "comedy":
            comedy = self.play().calculate_amount_for_comedy(self.audience())
            self._amount = comedy
            return comedy

        raise ValueError(f'unknown type: {self.play().type()}')
```

Y pasará lo mismo con las obra de tipo _Tragedy_, moviendo los métodos relacionados y reemplazando las llamadas. Quedará así:

```python
class Play:
    def __init__(self, data):
        self._data = data

    def name(self):
        return self._data['name']

    def type(self):
        return self._data['type']

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
```

Y reduciremos el tamaño de `Performance` porque nos libramos de bastantes métodos.

```python
    def amount(self):
        if self._amount is not None:
            return self._amount

        if self.play().type() == "tragedy":
            tragedy = self.play().calculate_amount_for_tragedy(self.audience())
            self._amount = tragedy
            return tragedy
        if self.play().type() == "comedy":
            comedy = self.play().calculate_amount_for_comedy(self.audience())
            self._amount = comedy
            return comedy

        raise ValueError(f'unknown type: {self.play().type()}')
```

De hecho, todavía podemos quitar un poco más de código a `Performance` puesto que tenemos que hay un cálculo de créditos que depende de la obra:

```python
class Play:
    def __init__(self, data):
        self._data = data

    def name(self):
        return self._data['name']

    def type(self):
        return self._data['type']

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

```

Con lo que `Performance` se reduce hasta la mitad de líneas:

```python
class Performance:
    def __init__(self, audience, play):
        self._audience = audience
        self._play = play
        self._amount = None

    def audience(self):
        return self._audience

    def play(self):
        return self._play

    def title(self):
        return self._play.name()

    def credits(self):
        return Credits(max(self.audience() - 30, 0)). \
            add(self.play().extra_volume_credits_for_comedy(self.audience()))

    def amount(self):
        if self._amount is not None:
            return self._amount

        if self.play().type() == "tragedy":
            tragedy = self.play().calculate_amount_for_tragedy(self.audience())
            self._amount = tragedy
            return tragedy
        if self.play().type() == "comedy":
            comedy = self.play().calculate_amount_for_comedy(self.audience())
            self._amount = comedy
            return comedy

        raise ValueError(f'unknown type: {self.play().type()}')
```


Por supuesto puedes argumentar: pero si has movido el código de una clase a otra. Ahora `Play` es mucho más grande. Y es cierto, pero ahora contiene casi toda la lógica que le pertenece.

### Un método largo

Con todo, el método `amount` sigue teniendo más de cinco líneas. Hemos adelgazado la clase, pero no el método más grande. Podemos mover parte de este código a `Play`. Aquí tenemos un pequeño obstáculo pues implementamos la memoización de una forma que nos complica un poco. Pero podemos arreglarlo. El primer paso es separar la memoización del cálculo:

```python
    def amount(self):
        if self._amount is not None:
            return self._amount

        self._amount = self.calculate_amount()
        
        return self._amount

    def calculate_amount(self):
        if self.play().type() == "tragedy":
            return self.play().calculate_amount_for_tragedy(self.audience())
        if self.play().type() == "comedy":
            return self.play().calculate_amount_for_comedy(self.audience())

        raise ValueError(f'unknown type: {self.play().type()}')
```

Gracias a este cambio, además resulta que reducimos el tamaño del método `amount`, y el nuevo método también cumple la limitación a un máximo de cinco líneas. De hecho, ahora `amount` se encarga básicamente de la memoización y `Play` del cálculo. Más interesante aún es que se ha reducido el acoplamiento. `Play` no sabe nada de `Performance`, pero lo mejor es que esta no sabe nada de `Play`. Es decir: únicamente sabe que le puede pedir `amount` y `credits`, pero no tiene que saber cómo se hace el cálculo.

Este nuevo método es que queremos trasladar a `Play`, que sigue estando dentro del límite de tamaño.

```python
class Play:
    def __init__(self, data):
        self._data = data

    def name(self):
        return self._data['name']

    def type(self):
        return self._data['type']

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

Por supuesto, ahora queda más claro que nunca que `Play` necesita especializarse en dos clases `Tragedy` y `Comedy`. Pero no vamos a abordar ese cambio ahora, sino cuando la última regla nos lo pida.

### Solo dos argumentos

La función statement tiene varios problemas relacionados con esta regla. Claramente, tiene más de cinco líneas en el cuerpo, incluso sin contar las _inner functions_. Además, una de estas funciones recibe más de dos parámetros. Vamos a ver algunas soluciones. Aquí está:

```python
    def formatted_line(title, audience, amount):
        return f' {title}: {format_as_dollars(amount.current() / 100)} ({audience} seats)\n'
```

Recuerda que extrajimos esta función porque necesitábamos que alguien pudiese manejar `Amount` debido a la regla de no más de n punto por línea. Esto nos impediría usar la solución más inmediata que sería pasar el objeto `Performance`. Pero de hacerlo así volveríamos a romper la regla anterior. Por supuesto, hay más problemas ahí, pero de momento consideremos otras opciones.

Cuando una función recibe muchos parámetros una posibilidad es introducir un `Objeto parámetro`. Los contructores de los objetos no están limitados por esta regla, así que podríamos introducir algo como esto:

```python
class Line:
    def __init__(self, title, audience, amount):
        self.title = title
        self.audience = audience
        self.amount = amount.current()
```

Y cambiar la función `formatted_line` para usarlo:

```python
    def formatted(line):
        return f' {line.title}: {format_as_dollars(line.amount / 100)} ({line.audience} seats)\n'
```

Y se podría usar así:

```python
    printer.print(f'Statement for {invoice.customer()}\n')
    for performance in invoice.performances():
        printer.print(formatted(Line(performance.title(), performance.audience(), performance.amount())))
    printer.print(f'Amount owed is {format_as_dollars(invoice.amount().current() // 100)}\n')
    printer.print(f'You earned {invoice.credits().current()} credits\n')
```

Pero es que, además, ahora tendría todo el sentido mover esa función a `Line`.

```python
class Line:
    def __init__(self, title, audience, amount):
        self.title = title
        self.audience = audience
        self.amount = amount.current()

    def amount_as_dollars(self):
        return f"${self.amount/100:0,.2f}"

    def formatted(self):
        return f' {self.title}: {self.amount_as_dollars()} ({self.audience} seats)\n'
```

Este cambio genera algún problema porque duplicamos el código que da formato a `Amount` introduciendo el riesgo de que ocurran divergencias. Una forma de resolverlo podría ser introducir un patrón decorador:

```python
class FormattedAmount:
    def __init__(self, amount):
        self.amount = amount

    def dollars(self):
        return f"${self.amount.current() / 100:0,.2f}"
```

De modo que se pueda usar cuando sea necesario, haciendo un par de pequeños cambios:

```python
class Line:
    def __init__(self, title, audience, amount):
        self.title = title
        self.audience = audience
        self.amount = amount

    def formatted(self):
        return f' {self.title}: {FormattedAmount(self.amount).dollars()} ({self.audience} seats)\n'
```

```python
def statement(invoice_data, plays):
    invoice = Invoice(invoice_data, plays)

    printer = Printer()
    printer.print(f'Statement for {invoice.customer()}\n')

    for performance in invoice.performances():
        line = Line(performance.title(), performance.audience(), performance.amount())
        printer.print(line.formatted())

    printer.print(f'Amount owed is {FormattedAmount(invoice.amount()).dollars()}\n')
    printer.print(f'You earned {invoice.credits().current()} credits\n')

    return printer.output()
```

### Más oportunidades de acortar métodos

La función `statement` sigue siendo demasiado larga. Por supuesto, en ocasiones nos encontraremos con que es muy difícil o imposible hacer un método más pequeño por lo que se trata de no obsesionarse. Recordemos que estamos haciendo un ejercicio para entrenar nuestra capacidad de descubrir oportunidades para aplicar las reglas. ¿Tenemos algún punto más que podamos reducir?

Parte del problema con `statement` es que es una función y tiene un par de líneas de inicialización de objetos. Además, al ser una función nos complica la extracción de bloques de código. Por ejemplo, el bucle que procesa las `Performance` podría extraerse para mantener un único nivel de abstracción. Quizá podríamos introducir el concepto de `StatementPrinter` para llevarnos toda esa lógica de ahí y tener más libertad para manipularla.

```python
class StatementPrinter:
    def __init__(self, printer):
        self.printer = printer

    def print(self, invoice):
        self.printer.print(f'Statement for {invoice.customer()}\n')

        for performance in invoice.performances():
            line = Line(performance.title(), performance.audience(), performance.amount())
            self.printer.print(line.formatted())

        self.printer.print(f'Amount owed is {FormattedAmount(invoice.amount()).dollars()}\n')
        self.printer.print(f'You earned {invoice.credits().current()} credits\n')

        return self.printer.output()
```

De este modo, `statement` simplemente actúa como una especie de _caso de uso_:

```python
def statement(invoice_data, plays):
    invoice = Invoice(invoice_data, plays)

    statement_printer = StatementPrinter(Printer())

    return statement_printer.print(invoice)
```

Esto nos da algunas opciones. Por ejemplo:

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
        line = Line(performance.title(), performance.audience(), performance.amount())
        self.printer.print(line.formatted())

```

Una cuestión es que `Printer` ahora se refiere a un mecanismo concreto de impresión, así que es mejor cambiarlo de nombre y ubicación. Por otro lado, `StatementPrinter`, `Line` o `FormattedAmount` son objetos que hemos introducido aunque aún no hemos ubicado correctamente.

```python
from domain.invoice import Invoice
from domain.statement_printer import StatementPrinter
from infrastructure.console_printer import ConsolePrinter


def statement(invoice_data, plays):
    invoice = Invoice(invoice_data, plays)

    statement_printer = StatementPrinter(ConsolePrinter())

    return statement_printer.print(invoice)
```

## Por qué funciona

La razón de que esta regla funcione es que al querer reducir el número de líneas que contiene una clase o un método nos obliga a buscar líneas de código muy relacionadas entre sí, o sea que mantengan alta cohesión, y que puedan moverse juntas a un nuevo método o incluso a otra clase. A un nuevo método si contribuyen a la misma responsabilidad de la clase, y a otra clase si representan una responsabilidad ajena.

Cuando separamos un gran bloque de código de una clase en métodos más pequeños altamente cohesivos es fácil identificar responsabilidades, de modo que podemos analizar si realmente corresponden a la clase o deberían irse a otro lugar. Estos métodos y clases más pequeños son más fáciles de testear porque tienden a hacer una sola cosa. También son más fáciles de mantener por su pequeño tamaño, ya que podemos entender de un vistazo su propósito y si algo va mal con ellos.

Por supuesto, no siempre es posible forzar un método a tener un determinado tamaño, incluso cuando tiene una responsabilidad bien definida y sus líneas tienen mucha cohesión. En cualquier caso, siempre es buena idea intentar analizar los métodos largos en busca de oportunidades de hacerlos más pequeños.

## El resultado

[Puedes consultar el proyecto en Github](https://github.com/franiglesias/theatrical-plays-kata) 
