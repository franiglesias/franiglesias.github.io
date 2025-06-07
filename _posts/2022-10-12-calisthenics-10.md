---
layout: post
subtitle: Object Calisthenics
title: Comentarios finales
categories: articles
tags: good-practices refactoring
---

En este artículo reviso algunas cuestiones que se han planteado y exploro algunas líneas de desarrollo que quedaban pendientes.

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

## Aplicar object calisthenics, ¿mejora el diseño?

Sí, aplicando las reglas de _object calisthenics_ el diseño del código mejora incluso aunque no comencemos a introducir patrones de diseño. En otras palabras, _calisthenics_ te ayuda incluso si no tienes mucha experiencia en diseño de software.

En líneas generales, reducir el tamaño de los bloques de código y aplanar las estructuras indentadas ayuda a tener bloques y métodos más cohesivos centrados en torno a una responsabilidad.

Encapsular primitivos y estructuras de datos nativas abre la puerta a  asignar mejor las responsabilidades y mover comportamientos a los objetos a los que corresponden.

## ¿Hay un orden adecuado para aplicar las reglas?

No. Las reglas se aplican según lo necesitamos o nos parece más evidente que se pueden aplicar. Muchas veces, aplicar una regla genera situaciones que se abordan aplicando otra. Así que en realidad, lo que hacemos es observar fragmentos de código que violan una u otra regla y los arreglamos lo mejor posible.

El proceso es, por tanto, iterativo. Empiezas aplicando una regla cuya utilidad ves clara y vas haciendo pequeños commits con los cambios que ves que mejoran tu código. En algún momento, descubrirás oportunidades para aplicar otras y así sucesivamente.

## ¿Por dónde empezar?

Empieza aplicando la regla que te resulte más fácil o cuyos casos sean más evidentes. Por ejemplo, no usar abreviaturas es fácil de aplicar en casi cualquier código. Aplanar estructuras condicionales suele ser muy evidente y el refactor _extraer método_ es sencillo de aplicar en un IDE moderno.

Encapsular tipos primitivos y estructuras de datos no es difícil, pero ya supone un trabajo extra porque tenemos que asegurar que en todos sus usos podemos hacer la sustitución. Sin embargo, una vez introducido un concepto como objeto, mover comportamiento viene de forma casi natural.

Eliminar la palabra clave ELSE puede ser complicado si no aislamos las estructuras condicionales previamente, para lo cual es bueno haber aplicado antes la regla de unh solo nivel de indentación.

No usar getter o setters puede ser muy sencillo en algunos casos, pero no es evidente como hacerlo en otros. En uno de los ejemplos de estos artículos, introdujimos el patrón Visitor para hacerlo, pero no es uno de los más sencillos de aplicar precisamente.

## ¿Debo aplicar las reglas exhaustivamente en todo el código?

No. Céntrate sobre todo en la lógica de dominio, que es la que más te interesa que sea fácil de entender y de mantener en el futuro. Las mejoras del código en esta área son más prioritarias, porque los objetos tienen mayor significación. En las partes de implementación de infraestructura, los beneficios pueden no ser tan importantes, lo que no debería justificar un diseño chapucero.

Usa tu buen juicio. Céntrate en el código que sea importante.

## Más consideraciones y ejemplos sobre algunas reglas

### Más sobre encapsular primitivas

Me he dejado algunos valores primitivos sin encapsular. El criterio de prioridad para encapsular primitivas sería algo así como: Encapsula primitivos en objetos cuando:

* El primitivo representa un concepto relevante del dominio o negocio de la aplicación
* El primitivo tiene reglas validación o comportamiento asociado que no es soportado por el propio tipo, lo que básicamente indica que el concepto es importante para el dominio

Por ejemplo, tras aplicar la última regla a `Play` y extender en dos subclases, quedó de manifiesto que el cálculo de importe extra en relación con la audiencia era un comportamiento asociado al concepto de Audiencia. De hecho, el IDE señala esos métodos como candidatos a ser métodos estáticos. Por ejemplo, en `Tragedy` es así:

```python
class Tragedy(Play):
    # ...

    def extra_amount_for_high_audience(self, audience):
        if audience <= 30:
            return Amount(0)

        return Amount(1000 * (audience - 30))

    #...
```

Y en `Comedy`, así:

```python
class Comedy(Play):
    # ...

    def extra_amount_for_high_audience(self, audience):
        if audience <= 20:
            return Amount(0)

        return Amount(10000 + 500 * (audience - 20))

    # ...
```

Como se puede ver ninguno de los dos métodos depende de la clase que los contiene. Es cierto que podríamos extraer sus valores como propiedades de su clase. Sin embargo, fíjate que todo el cálculo se refiere solo al concepto de `Audience`. Hay un límite por encima del cual se genera un `Amount` extra. Si no se supera el límite `Amount` es cero.

Si igualamos la estructura de los métodos para que se parezcan lo más posible, quedaría una cosa así. Para `Tragedy`:

```python
    def extra_amount_for_high_audience(self, audience):
        if audience <= 30:
            return Amount(0)

        return Amount(0 + 1000 * (audience - 30))
```

Y para `Comedy`:

```python
    def extra_amount_for_high_audience(self, audience):
        if audience <= 20:
            return Amount(0)

        return Amount(10000 + 500 * (audience - 20))
```

Podríamos introducir una clase `Audience` que nos calcule el `Amount` extra, pasándole los parámetros necesarios:

```python
class Audience:
    def __init__(self, audience):
        self.audience = audience

    def amount(self, threshold, minimum, coeficient):
        if self.audience <= threshold:
            return Amount(0)

        return Amount(minimum + coeficient * (self.audience - threshold))
```

Y podemos usarlo:

```python
class Tragedy(Play):
    def __init__(self, data):
        self._name = data['name']

    def name(self):
        return self._name

    def extra_amount_for_high_audience(self, audience):
        return Audience(audience).amount(30, 0, 1000)
    
    def credits(self, audience):
        return Credits(0)

    def amount(self, audience):
        return Amount(40000).add(self.extra_amount_for_high_audience(audience))
```

O más simplificado:

```python
class Tragedy(Play):
    def __init__(self, data):
        self._name = data['name']

    def name(self):
        return self._name

    def credits(self, audience):
        return Credits(0)

    def amount(self, audience):
        return Amount(40000).add(Audience(audience).amount(30, 0, 1000))
```

Ahora tendría sentido introducir las propiedades de Tragedy que representan los parámetros:

```python
class Tragedy(Play):
    def __init__(self, data):
        self._name = data['name']
        self.threshold = 30
        self.minimum_amount = 0
        self.coefficient = 1000

    def name(self):
        return self._name

    def credits(self, audience):
        return Credits(0)

    def amount(self, audience):
        return Amount(40000).add(Audience(audience).amount(self.threshold, self.minimum_amount, self.coefficient))
```

Nos quedaría código relacionado con `Audience` y la posibilidad de instanciar el objeto desde el principio. Personalmente, cuando se trata de refactors suele empezar a introducirlo lo más adentro y voy "sacando" el objeto un paso cada vez. Así, por ejemplo, en el caso de `credits`, la lógica tiene que ver con Audience, pero no está tan claro como aplicar la relación.

### Más sobre límites de tamaño: parámetros y propiedades

Introducir `Audience` ha generado un problema, ya que la función para calcular el extra requiere tres parámetros y además hemos introducido tres propiedades más en las clases `Play`, ni más ni menos. En este caso, puede ser de aplicación el patrón `Parameter Object` para agruparlos. Sería algo así como `ExtraAmountData`:

```python
class ExtraAmountData:
    def __init__(self, threshold, minimum_amount, coefficient):
        self._threshold = threshold
        self._minimum_amount = minimum_amount
        self._coefficient = coefficient

    def threshold(self):
        return self._threshold

    def minimum_amount(self):
        return self._minimum_amount

    def coefficient(self):
        return self._coefficient
```

Esto se tendría que aplicar más o menos así. En Audience:

```python
    def extra_amount(self, extra_amount_data):
        if self.audience <= extra_amount_data.threshold():
            return Amount(0)

        return Amount(extra_amount_data.minimum_amount() + extra_amount_data.coeficient() * (
                    self.audience - extra_amount_data.threshold()))
```

Pero esto, sin embargo, no pinta bien. `Audience` no debería ser la responsable de calcular el extra, sino que es un dato necesario para hacerlo. Tendría más sentido que otro objeto dirija el cálculo sin exponer todos sus datos. Se podría considerar una especie de calculadora del importe extra basada en la audiencia, con coeficientes definidos por cada tipo de obra. Así que vamos a cambiar el concepto por completo.

```python
class ExtraAmountByAudience:
    def __init__(self, threshold, minimum_amount, coefficient):
        self._threshold = threshold
        self._minimum_amount = minimum_amount
        self._coefficient = coefficient

    def amount(self, audience):
        if audience <= self._threshold:
            return Amount(0)
        return Amount(self._minimum_amount + self._coefficient * (audience - self._threshold))
```

Y esto se usaría así:

```python
class Tragedy(Play):
    def __init__(self, data):
        self._name = data['name']

    def name(self):
        return self._name

    def credits(self, audience):
        return Credits(0)

    def amount(self, audience):
        return Amount(40000).add(ExtraAmountByAudience(30, 0, 1000).amount(audience))
```

Los tres parámetros de ExtraAmountByAudience son bastante crípticos. Una posible solución es usar un patrón builder:

```python

class ExtraAmountByAudience:
    def __init__(self):
        self._threshold = 0
        self._minimum_amount = 0
        self._coefficient = 1

    def when_audience_greater_than(self, threshold):
        self._threshold = threshold
        return self

    def minimum_amount_of(self, minimum_amount):
        self._minimum_amount = minimum_amount
        return self

    def and_coefficient(self, coefficient):
        self._coefficient = coefficient
        return self
```

Con lo cual, podemos hacer una construcción más expresiva:

```python
class Comedy(Play):
    def __init__(self, data):
        self._name = data['name']

    def name(self):
        return self._name

    def credits(self, audience):
        return Credits(math.floor(audience / 5))

    def amount(self, audience):
        calculator = ExtraAmountByAudience().
            when_audience_greater_than(20).
            minimum_amount_of(10000).
            and_coefficient(500)

        return Amount(30000)
            .add(calculator.amount(audience))
            .add(Amount(300 * audience))

```

¿Sobre-ingeniería?

## Comentarios de lectores

El objetivo de los artículos no era tanto llegar a un diseño de código `final`, como a mostrar que aplicando las reglas de Calisthenics es posible mejorar el diseño del software a través de dos caminos. El más simple consiste en aplicar las reglas tal cual. El segundo consiste en avanzar a partir de ese punto, descubriendo oportunidades para aplicar patrones de refactoring más avanzados. 

Algunos lectores habéis comentado áreas en las que se podría mejorar el código.

### Acoplamiento temporal al imprimir la factura

[josemi](/calisthenics-9/#comment-6009753237) hace un par de sugerencias interesantes. Por ejemplo, señala un caso de acoplamiento temporal dado que `StatementPrinter` no controla el orden en que se imprimen los elementos del `Statement`. Esto es debido a que no hay una separación entre la obtención de los datos y su impresión. El método `fill` obtiene el dato e imprime la línea. De ese modo, el control lo tiene `Invoice`, así que bastaría cambiar el orden de las llamadas en `Invoice` para _romper_ la impresión del Statement.

Esta es una primera aproximación muy basta, pero suficiente para hacernos a la idea y que elimina el acoplamiento temporal: 

```python
class StatementPrinter:
    def __init__(self, printer):
        self._printer = printer
        self._customer = None
        self._amount = None
        self._credits = None
        self._lines = []

    def print(self):
        self._printer.print(f'Statement for {self._customer}\n')
        for line in self._lines:
            self._printer.print(f' {line["title"]}: {FormattedAmount(line["amount"]).dollars()} ({line["audience"]} seats)\n')

        self._printer.print(f'Amount owed is {FormattedAmount(self._amount).dollars()}\n')
        self._printer.print(f'You earned {self._credits.current()} credits\n')

        return self._printer.output()

    def fill(self, template, *args):
        getattr(self, '_fill_' + template)(*args)

    def _fill_credits(self, credits):
        self._credits = credits

    def _fill_amount(self, amount):
        self._amount = amount

    def _fill_customer(self, customer):
        self._customer = customer

    def _fill_line(self, title, amount, audience):
        self._lines.append({"title": title, "amount": amount, "audience": audience})
```

Ahora podría cambiar el orden de las líneas en Invoice, sin afectar al resultado:

```python
    def fill(self, statement_printer):
        for performance in self._performances:
            performance.fill(statement_printer)
        statement_printer.fill('credits', self._credits())
        statement_printer.fill('amount', self._amount())
        statement_printer.fill('customer', self._customer)
```

### Más sobre colecciones de primera clase

Otra sugerencia de [josemi](/calisthenics-9/#comment-6009753237) es que la clase `Performances`, que contiene la colección de actuaciones se encargue también de controlar el orden en que se envían las líneas a `StatementPrinter`, en lugar de `Invoice`. Me parece una propuesta interesante. Sería una aplicación del principio _Tell, don't ask_. `Invoice` le pide a `Performances` que realice la coordinación y cálculos que ahora mismo se hacen en `Invoice`, que quedaría así:

```python
from domain.performance import Performances
from domain.play import Plays


class Invoice:
    def __init__(self, data, plays):
        self._data = data
        self._customer = data['customer']
        self._performances = Performances(data['performances'], Plays(plays))

    def _amount(self):
        return self._performances.amount()

    def _credits(self):
        return self._performances.credits()

    def fill(self, statement_printer):
        statement_printer.fill('credits', self._credits())
        statement_printer.fill('amount', self._amount())
        statement_printer.fill('customer', self._customer)
        self._performances.fill(statement_printer)
```

Mientras que Performances podría quedar así, una vez eliminado el código para hacerla iterable que ya no es necesario:

```python
class Performances:
    def __init__(self, data, plays):
        self._data = data
        self._plays = plays

    def amount(self):
        amount = Amount(0)
        for data in self._data:
            performance = self._performance(data)
            amount = amount.add(performance.amount())

        return amount

    def _performance(self, data):
        return Performance(data['audience'], self._plays.get_by_id(data['playID']))

    def credits(self):
        volume_credits = Credits(0)
        for data in self._data:
            performance = self._performance(data)
            volume_credits = volume_credits.add(performance.credits())

        return volume_credits

    def fill(self, statement_printer):
        for data in self._data:
            performance = self._performance(data)
            performance.fill(statement_printer)

```

## El resultado

[Puedes consultar el proyecto en Github](https://github.com/franiglesias/theatrical-plays-kata) 

## ¿Fin? 

Esta vez, sí. Lo cierto es que probablemente todavía podríamos introducir mejoras en el código. Hay algunas clases que no me convencen del todo, como `ExtraAmountByAudience` o `StatementPrinter`. Seguramente esconden aún problemas en el diseño que no he sido capaz de ver.

{% include_relative series/calisthenics.md %}
