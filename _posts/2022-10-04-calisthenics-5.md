---
layout: post
series: calisthenics
title: Un punto por línea
categories: articles
tags: good-practices refactoring
---

Una serie de restricciones que te ayudarán a escribir mejor código. En este artículo veremos como aplicar la regla de un solo punto por línea.

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

## Un punto por línea

Esta regla nos pide no encadenar llamadas a objetos proporcionados por otros objetos, de tal forma que solo tengamos un punto (una flecha en PHP) en cada línea de código. Puede parecer fácil de aplicar, pero vamos a poder identificar varias situaciones en las que la regla no es relevante, así como diferentes soluciones cuando sí lo es.

### Las interfaces fluidas son correctas

Las interfaces fluidas no se ven afectadas por esta regla. Las interfaces fluidas devuelven el mismo objeto al que se pasa el mensaje, por lo que podemos seguir enviándole mensajes sin límite, lo que parece una oportunidad de aplicar la regla. Pero no lo es. En todo caso, es cierto que poner un punto por línea mejora mucha la legibilidad. El objetivo, y ventaja,  de la interfaz fluida es poder enviar varios mensajes a un mismo objeto en un orden dado y que, además, se pueda entender como una operación unitaria.

En nuestro código, hacemos algo así con Amount, aunque cada vez se devuelva una instancia distinta es semánticamente el mismo objeto:

```python
    def calculate_amount_for_comedy(self):
        return Amount(30000) \
            .add(self.extra_amount_for_high_audience_in_comedy()) \
            .add(Amount(300 * self.audience()))
```

### Filtración de propiedades

Fijémonos ahora en esta línea:

```python
line = f' {performance.play().name()}: {format_as_dollars(performance.amount().current() / 100)} ({performance.audience()} seats)\n'
```

Para saber el título de la actuación, tenemos que pedirle a `Performance` la obra y obtener su título. De este modo, se revela un detalle de implementación de `Performance` que el resto del código no tiene por qué conocer. El comportamiento que se quiere de `Performance` es que sea capaz de decirnos el título de la obra que se representa, da igual si lo tiene guardado o le pregunta a `Play` o tiene alguna otra forma de obtenerlo o construirlo.

Por eso, una forma más adecuada sería:

```python
line = f' {performance.title()}: {format_as_dollars(performance.amount().current() / 100)} ({performance.audience()} seats)\n'
```

De tal forma que ahora el mundo exterior no tiene ningún detalle sobre cómo hace Performance para proporcionar el título de la obra representada:

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
```

De este modo, el resto del código reduce su acoplamiento de `Performance` y esta puede modificar la forma en que obtiene el título sin afectar a sus consumidores.

Con todo, en este caso concreto podría haber otras soluciones, pero no voy a tratarlas en este momento, ya que me estoy limitando a aplicar la reglas de Calisthenics. Pero, en cualquier caso, creo que se ve muy bien cómo aplicar una regla va desvelando mejores soluciones, pero también problemas de diseño más profundos que requieren soluciones más elaboradas. Es decir: intentar aplicar la regla nos lleva a pensar más a fondo en ciertas decisiones de diseño.

En este caso, la solución es aceptable porque tiene sentido que `Performance` tenga como una de sus responsabilidades saber el nombre de la obra representada.

### Más filtración de conocimiento

Veamos este fragmento:

```python
performance.amount().current()
```

Aquí tenemos un problema aparentemente similar. El método `Performance.amount()` nos devuelve un objeto y `statement` invoca un método en ese objeto devuelto. ¿Podemos aplicar la misma solución que antes?

Aparentemente sí, añadiendo a `Performance` un método que nos proporcione ese valor, algo así como:

```python
class Performance:
    def __init__(self, audience, play):
        self._audience = audience
        self._play = play
        self._amount = None

# ...

    def amount_value(self):
        return self.amount().current()

# ...
```

Si lo pensamos un poco a fondo, veremos que no es nada correcto. Y eso es porque, de hecho, el método `Amount.current()` no debería existir, ya que en realidad expone una propiedad del objeto `Amount`. El método existe porque necesitamos obtener el primitivo contenido en el objeto. En otras palabras: intentar aplicar esta regla va más allá de simplemente encapsular el código en un nuevo método. Debería hacernos reflexionar sobre el diseño.

Una mejor solución es delegar y pasar el objeto a alguien que sepa comunicarse con él, Con todo, todavía presenta problemas, pero los tendremos que examinar en otro momento:

```python
    def format_as_dollars(amount):
        return f"${amount:0,.2f}"

    def format_line(title, audience, amount):
        return f' {title}: {format_as_dollars(amount.current() / 100)} ({audience} seats)\n'

    for performance in inv.performances():
        line = format_line(performance.title(), performance.audience(), performance.amount())
        printer.print(line)
        invoice_amount = invoice_amount.add(performance.amount())
        volume_credits = volume_credits.add(performance.credits())
```

### Un caso muy sutil

¿Notas algo problemático aquí?

```python
    for performance in inv.performances():
        printer.print(formatted_line(performance.title(), performance.audience(), performance.amount()))
        invoice_amount = invoice_amount.add(performance.amount())
        volume_credits = volume_credits.add(performance.credits())
```

Pues es un caso muy sutil de violación de esta regla. `statement` recibe objetos `Performance` que no tendría que conocer. Es una situación similar a la que acabamos de describir en el apartado anterior.

Podríamos abordarla así, pero los problemas son evidentes.

```python
def process_performance(performance, invoice_amount, volume_credits, printer):
    printer.print(formatted_line(performance.title(), performance.audience(), performance.amount()))
    invoice_amount = invoice_amount.add(performance.amount())
    volume_credits = volume_credits.add(performance.credits())
    return invoice_amount, volume_credits

for performance in invoice.performances():
    invoice_amount, volume_credits = process_performance(performance, invoice_amount, volume_credits, printer)
```

Tenemos que pasar variables que serán retornadas, aparte del objeto `Performance`. Y para completarlo, el nuevo método devuelve dos valores.

Hay varias razones por las que está pasando esto. Por un lado, el hecho de `Invoice` sea, por el momento, un objeto muy anémico, ya que debería ser responsable de calcular tanto el importe total como los créditos. Por otra parte, en el bucle están pasando varias cosas: se calculan los importes parciales, se van acumulando los dos totales y además se envían las líneas para imprimir.

Nos conviene separar las responsabilidades. Primer paso:

```python
    for performance in invoice.performances():
        invoice_amount = invoice_amount.add(performance.amount())

    for performance in invoice.performances():
        volume_credits = volume_credits.add(performance.credits())

    for performance in invoice.performances():
        printer.print(formatted_line(performance.title(), performance.audience(), performance.amount()))
```

Segundo paso. Pongamos juntas las cosas relacionadas:

```python
    invoice_amount = Amount(0)
    for performance in invoice.performances():
        invoice_amount = invoice_amount.add(performance.amount())

    volume_credits = Credits(0)
    for performance in invoice.performances():
        volume_credits = volume_credits.add(performance.credits())

    printer.print(f'Statement for {invoice.customer()}\n')
    for performance in invoice.performances():
        printer.print(formatted_line(performance.title(), performance.audience(), performance.amount()))
    printer.print(f'Amount owed is {format_as_dollars(invoice_amount.current() // 100)}\n')
    printer.print(f'You earned {volume_credits.current()} credits\n')
```

Se debería ver claro que esta lógica pertenece a `Invoice` y la podríamos pasar sin mucha dificultad.

```python
from domain.amount import Amount
from domain.credits import Credits
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

    def amount(self):
        invoice_amount = Amount(0)
        for performance in self.performances():
            invoice_amount = invoice_amount.add(performance.amount())

        return invoice_amount

    def credits(self):
        volume_credits = Credits(0)
        for performance in self.performances():
            volume_credits = volume_credits.add(performance.credits())

        return volume_credits
```

Y así quedaría `statement`, después de limpiar un poco el código.

```python
from domain.invoice import Invoice
from domain.printer import Printer


def statement(invoice_data, plays):
    def formatted_line(title, audience, amount):
        return f' {title}: {format_as_dollars(amount.current() / 100)} ({audience} seats)\n'

    def format_as_dollars(amount):
        return f"${amount:0,.2f}"

    printer = Printer()

    invoice = Invoice(invoice_data, plays)

    printer.print(f'Statement for {invoice.customer()}\n')
    for performance in invoice.performances():
        printer.print(formatted_line(performance.title(), performance.audience(), performance.amount()))
    printer.print(f'Amount owed is {format_as_dollars(invoice.amount().current() // 100)}\n')
    printer.print(f'You earned {invoice.credits().current()} credits\n')

    return printer.output()
```

## Por qué funciona

Esta es una regla que nos remite al Principio de Mínimo Conocimiento o Ley de Demeter y su objetivo es evitar acoplarnos a detalles internos de otros objetos. Nos fuerza a considerar los objetos como cajas negras con las que nos podemos comunicar, pero no saber cómo funcionan por dentro.

Cuando un objeto usa otro lo hace a través de su interfaz pública. La interfaz pública define los mensajes que un objeto puede recibir y las respuestas que puede devolver. Este es el máximo de conocimiento que un objeto debería tener sobre otro para minimizar el acoplamiento. Todo conocimiento a mayores incrementa el acoplamiento. Ese conocimiento incluye saber cómo comunicarse con objetos que son devueltos. La acción del consumidor debería limitarse a pasar ese objeto para que sea empleado en otro sitio.

En general, que haya puntos del código en que aplicar esta regla nos revela errores de diseño. Le estamos pidiendo a objetos comportamientos que no les corresponden, usando un conocimiento íntimo de su estructura.

## El resultado

Por un lado, esta regla nos ayuda a mover responsabilidades a su lugar adecuado. Pero también suele destapar problemas que requieren reconsiderar nuestro diseño. No basta con introducir un método para ocultar una llamada encadenada.

Por eso, el resultado en este momento resulta un poco insatisfactorio. Tendremos que esperar a las reglas restantes para alcanzar mejores soluciones.

```python
from domain.invoice import Invoice
from domain.printer import Printer


def statement(invoice_data, plays):
    def formatted_line(title, audience, amount):
        return f' {title}: {format_as_dollars(amount.current() / 100)} ({audience} seats)\n'

    def format_as_dollars(amount):
        return f"${amount:0,.2f}"

    printer = Printer()

    invoice = Invoice(invoice_data, plays)

    printer.print(f'Statement for {invoice.customer()}\n')
    for performance in invoice.performances():
        printer.print(formatted_line(performance.title(), performance.audience(), performance.amount()))
    printer.print(f'Amount owed is {format_as_dollars(invoice.amount().current() // 100)}\n')
    printer.print(f'You earned {invoice.credits().current()} credits\n')

    return printer.output()
```

