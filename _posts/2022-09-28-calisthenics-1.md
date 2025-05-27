---
layout: post
title: Object Calisthenics. Solo un nivel de indentación.
categories: articles
tags: good-practices refactoring
---

Una serie de restricciones que te ayudarán a escribir mejor código. Empezamos por la primera: un sólo nivel de indentación por método.

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

## Un solo nivel de indentación

Esta es bastante sencilla de entender, aunque puede que no tanto de aplicar. 

La indentación nos ayuda a organizar visualmente el código de modo que cuando un fragmento está, por así decir, contenido en otro se muestra más adentrado en el cuerpo del texto. En Python, la indentación es lo que define los bloques de código mientras que en otros lenguajes estos bloques se definen usando algún tipo de marcador como las llaves, palabras clave como "begin/end", etc.

El nivel de indentación está fuertemente asociado al nivel de abstracción. Con frecuencia, los bloques de código indentados suponen un cierto nivel de detalle que no se corresponde al nivel de abstracción del método que los contiene. La mezcla de niveles de abstracción hace que sea más difícil comprender el código debido a que tenemos que cambiar nuestro enfoque al entrar y salir de cada bloque.

Los bloques indentados aparecen en estructuras condiciones y en bucles. El problema de estos bloques surge cuando dentro de un bloque indentado aparece la necesidad de introducir una nueva condicional o bucle, resultando en una anidación que genera un nuevo nivel de indentación. Esto incrementa la mezcla de conceptos generales con detalles. Además, hace que tengamos que entrar y salir de distintas ramas del flujo de ejecución. En conjunto, el código así organizado se hace más difícil de leer, de comprender y de mantener en la cabeza.

Veamos un ejemplo no orientado a objetos, tomado de la kata [Theatrical Players](https://github.com/emilybache/Theatrical-Players-Refactoring-Kata) de Emily Bache:

```python
import math


def statement(invoice, plays):
    total_amount = 0
    volume_credits = 0
    result = f'Statement for {invoice["customer"]}\n'

    def format_as_dollars(amount):
        return f"${amount:0,.2f}"

    for perf in invoice['performances']:
        play = plays[perf['playID']]
        if play['type'] == "tragedy":
            this_amount = 40000
            if perf['audience'] > 30:
                this_amount += 1000 * (perf['audience'] - 30)
        elif play['type'] == "comedy":
            this_amount = 30000
            if perf['audience'] > 20:
                this_amount += 10000 + 500 * (perf['audience'] - 20)

            this_amount += 300 * perf['audience']

        else:
            raise ValueError(f'unknown type: {play["type"]}')

        # add volume credits
        volume_credits += max(perf['audience'] - 30, 0)
        # add extra credit for every ten comedy attendees
        if "comedy" == play["type"]:
            volume_credits += math.floor(perf['audience'] / 5)
        # print line for this order
        result += f' {play["name"]}: {format_as_dollars(this_amount/100)} ({perf["audience"]} seats)\n'
        total_amount += this_amount

    result += f'Amount owed is {format_as_dollars(total_amount/100)}\n'
    result += f'You earned {volume_credits} credits\n'
    return result
```

En el ejemplo, se puede ver como el bucle `for` introduce un nivel de indentación en el código. Pero dentro de él podemos ver dos estructuras condicionales que añaden hasta dos nuevos niveles.

Para reducir a un solo nivel de indentación el código de un método lo más habitual es extraer la estructura anidada a un método privado, de manera que en su lugar quede una única línea con esa llamada. 

Es este ejemplo, la función `statement` calcula el importe de una factura sobre varias actuaciones de una compañía de teatro. Para ello recorre la lista de actuaciones, calculando el importe de cada actuación basándose en características de la obra y de la audiencia y sumándolo todo. La primera estructura condicional contiene los detalles del cálculo del importe de cada actuación.

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
            amount = 40000
            if perf['audience'] > 30:
                amount += 1000 * (perf['audience'] - 30)
        elif play['type'] == "comedy":
            amount = 30000
            if perf['audience'] > 20:
                amount += 10000 + 500 * (perf['audience'] - 20)

            amount += 300 * perf['audience']

        else:
            raise ValueError(f'unknown type: {play["type"]}')
        return amount

    for perf in invoice['performances']:
        play = plays[perf['playID']]
        this_amount = calculate_performance_amount(perf, play)

        # add volume credits
        volume_credits += max(perf['audience'] - 30, 0)
        # add extra credit for every ten comedy attendees
        if "comedy" == play["type"]:
            volume_credits += math.floor(perf['audience'] / 5)
        # print line for this order
        result += f' {play["name"]}: {format_as_dollars(this_amount/100)} ({perf["audience"]} seats)\n'
        total_amount += this_amount

    result += f'Amount owed is {format_as_dollars(total_amount/100)}\n'
    result += f'You earned {volume_credits} credits\n'
    return result
```

Si los niveles de anidación son varios podemos empezar por el primero y luego nos vamos moviendo más hacia adentro. Esto choca con la recomendación de empezar a refactorizar por la rama más profunda, pero en este caso parece mejor despejar cada nivel de abstracción desde fuera hacia adentro. Además, el refactor automático de extraer método es lo bastante seguro como para poder hacerlo sin tests.

En nuestro ejemplo, el nuevo método contiene más de un nivel de indentación, pero volveremos a esto más adelante. Vamos a seguir aplanando la función `statement`.

Algunas dificultades que nos podemos encontrar tienen que ver con el uso de variables que se inicializan fuera de la estructura condicional, pero que se modifican en ella. Un paso previo recomendable es agrupar el código relacionado, por ejemplo, las líneas en las que se mencionan las mismas variables deberían ir juntas. De este modo, cuando vayamos a extraer la estructura condicional seremos más conscientes de esas dependencias.

La segunda estructura condicional hace lo que parece ser un cálculo de créditos o puntos para futuros espectáculos (`volume_credits`) y también podemos extraerlo. Como podemos ver, la condicional modifica el valor de una variable que se inicializaba fuera. Por tanto, incluimos todo en la extracción, teniendo en cuenta que `volume_credits` es una variable acumulativa:

```python
        # add volume credits
        volume_credits += max(perf['audience'] - 30, 0)
        # add extra credit for every ten comedy attendees
        if "comedy" == play["type"]:
            volume_credits += math.floor(perf['audience'] / 5)
        # print line for this order
```

Nos quedaría así:

```python
import math


def statement(invoice, plays):
    total_amount = 0
    volume_credits = 0
    result = f'Statement for {invoice["customer"]}\n'

    def format_as_dollars(amount):
        return f"${amount:0,.2f}"

    for perf in invoice['performances']:
        play = plays[perf['playID']]
        this_amount = calculate_amount(perf, play)
        volume_credits += calculate_this_volume_credits(perf, play)
        # print line for this order
        result += f' {play["name"]}: {format_as_dollars(this_amount/100)} ({perf["audience"]} seats)\n'
        total_amount += this_amount

    result += f'Amount owed is {format_as_dollars(total_amount/100)}\n'
    result += f'You earned {volume_credits} credits\n'
    return result


def calculate_this_volume_credits(perf, play):
    # add volume credits
    volume_credits = max(perf['audience'] - 30, 0)
    # add extra credit for every ten comedy attendees
    if "comedy" == play["type"]:
        volume_credits += math.floor(perf['audience'] / 5)
    return volume_credits


def calculate_amount(perf, play):
    if play['type'] == "tragedy":
        this_amount = 40000
        if perf['audience'] > 30:
            this_amount += 1000 * (perf['audience'] - 30)
    elif play['type'] == "comedy":
        this_amount = 30000
        if perf['audience'] > 20:
            this_amount += 10000 + 500 * (perf['audience'] - 20)

        this_amount += 300 * perf['audience']

    else:
        raise ValueError(f'unknown type: {play["type"]}')
    return this_amount
```

Un truco simple cuando usas refactor automático es examinar los parámetros que necesita el nuevo método, ya que el análisis que hace la herramienta de refactor identificará todos los necesarios. Esto nos ayuda a descubrir variables temporales que tal vez sean innecesarias o que deberían estar únicamente en el método extraído. Especialmente en el caso de se tenga que devolver su valor.

En este caso, tenemos que separar el cálculo parcial del total. Esta es la secuencia de pasos que he seguido para hacerlo manteniendo los tests en verde en todos los pasos:

En primer lugar, voy a introducir una variable `performance_credits` que contendrá el cálculo parcial:

```python
        # add volume credits
        performance_credits = max(perf['audience'] - 30, 0)
        volume_credits += performance_credits
        # add extra credit for every ten comedy attendees
        if "comedy" == play["type"]:
            volume_credits += math.floor(perf['audience'] / 5)
```
`volumen_credits` solo debería actualizarse cuando se haya completado el cálculo parcial, así que lo muevo al final del fragmento:

```python
        # add volume credits
        performance_credits = max(perf['audience'] - 30, 0)
        # add extra credit for every ten comedy attendees
        if "comedy" == play["type"]:
            volume_credits += math.floor(perf['audience'] / 5)
        volume_credits += performance_credits
```
En la condicional, actualizo `performance_credits` en lugar de `volume_credits`:

```python
        # add volume credits
        performance_credits = max(perf['audience'] - 30, 0)
        # add extra credit for every ten comedy attendees
        if "comedy" == play["type"]:
            performance_credits += math.floor(perf['audience'] / 5)
        volume_credits += performance_credits
```
Ahora ya puedo extraer el cálculo limpiamente:

```python
        performance_credits = calculate_performance_credits(perf, play)
        volume_credits += performance_credits
```

Si te fijas en la parte principal del cuerpo de la función `statement` verás que es mucho más claro y es fácil entender lo que ocurre en un nivel general. Basta con moverse a la función adecuada para poder acceder a los detalles de cada cálculo.

Queda más o menos así, una vez ordenadas las líneas:

```python
    for perf in invoice['performances']:
        play = plays[perf['playID']]
        this_amount = calculate_performance_amount(perf, play)
        performance_credits = calculate_performance_credits(perf, play)

        volume_credits += performance_credits
        # print line for this order
        result += f' {play["name"]}: {format_as_dollars(this_amount/100)} ({perf["audience"]} seats)\n'
        total_amount += this_amount
```

Podría argumentarse que para poder extraer las estructuras condicionales y aplanar la indentación tengo que hacer algunos refactors de más. Pero precisamente ese es uno de los beneficios de intentar forzar la regla. Tengo que mejorar la organización del código para tener las condiciones adecuadas que me permitan aplicar la regla de un solo nivel de indentación.

Volvamos ahora a los niveles extra de indentación que aún no hemos tratado. Se han movido todos a la función `calculate_amount`:

```python
def calculate_performance_amount(perf, play):
    if play['type'] == "tragedy":
        this_amount = 40000
        if perf['audience'] > 30:
            this_amount += 1000 * (perf['audience'] - 30)
    elif play['type'] == "comedy":
        this_amount = 30000
        if perf['audience'] > 20:
            this_amount += 10000 + 500 * (perf['audience'] - 20)

        this_amount += 300 * perf['audience']

    else:
        raise ValueError(f'unknown type: {play["type"]}')
    return this_amount
```

Lo más fácil es mover las _patas_ de las condicionales a sus propios métodos, como se puede ver a continuación.

```python
    def calculate_performance_amount(perf, play):
    if play['type'] == "tragedy":
        amount = calculate_amount_for_tragedy(perf)
    elif play['type'] == "comedy":
        amount = calculate_amount_for_comedy(perf)

    else:
        raise ValueError(f'unknown type: {play["type"]}')
    return amount

def calculate_amount_for_comedy(perf):
    amount = 30000
    if perf['audience'] > 20:
        amount += 10000 + 500 * (perf['audience'] - 20)
    amount += 300 * perf['audience']
    return amount

def calculate_amount_for_tragedy(perf):
    amount = 40000
    if perf['audience'] > 30:
        amount += 1000 * (perf['audience'] - 30)
    return amount
```

Al fijarnos en el resultado, podemos observar varias cosas. Una de ellas es que el código de `calculate_amount` sugiere aplicar el patrón _early return_, que clarifica más aún el cuerpo del método, así como suprimir la palabra clave `ELSE`, tema que trataríamos en la siguiente regla. También nos abre la puerta a usar una estructura `switch/case`. Pero si profundizamos, también sugiere fuertemente la posibilidad de introducir orientación a objetos para beneficiarnos del polimorfismo. No lo vamos a hacer en esta ocasión, porque el objetivo del artículo es centrarnos en una regla cada vez.

Este es el resultado hasta el momento. En cada función tenemos un solo nivel de indentación. No es el refactor definitivo, pero ha mejorado sustancialmente la organización y legibilidad del código.

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
            amount = calculate_amount_for_tragedy(perf)
        elif play['type'] == "comedy":
            amount = calculate_amount_for_comedy(perf)

        else:
            raise ValueError(f'unknown type: {play["type"]}')
        return amount

    def calculate_amount_for_comedy(perf):
        amount = 30000
        if perf['audience'] > 20:
            amount += 10000 + 500 * (perf['audience'] - 20)
        amount += 300 * perf['audience']
        return amount

    def calculate_amount_for_tragedy(perf):
        amount = 40000
        if perf['audience'] > 30:
            amount += 1000 * (perf['audience'] - 30)
        return amount

    def calculate_performance_credits(perf, play):
        # add volume credits
        credits = max(perf['audience'] - 30, 0)
        # add extra credit for every ten comedy attendees
        if "comedy" == play["type"]:
            credits += math.floor(perf['audience'] / 5)
        return credits

    for perf in invoice['performances']:
        play = plays[perf['playID']]
        this_amount = calculate_performance_amount(perf, play)
        performance_credits = calculate_performance_credits(perf, play)

        volume_credits += performance_credits
        # print line for this order
        result += f' {play["name"]}: {format_as_dollars(this_amount/100)} ({perf["audience"]} seats)\n'
        total_amount += this_amount

    result += f'Amount owed is {format_as_dollars(total_amount/100)}\n'
    result += f'You earned {volume_credits} credits\n'
    return result

```

A poco que profundicemos en este ejemplo podemos sentir que está pidiendo a gritos aplicar orientación a objetos, pero precisamente eso es algo que podemos empezar a vislumbrar después de haber aplicado esta simple regla.

### Por qué funciona

Esta regla funciona porque nos ayuda a conseguir que cada método desarrolle su trabajo en un único nivel de abstracción, a la vez que separamos distintas responsabilidades. De este modo, puedes leer cada método y entender qué pasa, sin necesidad de distraerte con detalles que no son relevantes en ese momento. Si necesitas conocer cómo se implementa alguna de las fases no tienes más que revisar el método que se ocupa de ello. 

Al separar el comportamiento de ese objeto en pasos implementados por métodos específicos será más fácil también identificar el papel de los colaboradores del objeto, si los hay, así como su aislamiento. De este modo, podremos detectar y solucionar más fácilmente posibles problemas de acoplamiento. A su vez, esta extracción a métodos privados puede ser el primer paso para identificar diferentes responsabilidades en una clase que podrían extraerse a nuevas clases.

Dado que son métodos privados no estamos afectando a la interfaz pública.

### Más allá

#### Separar iterador de iteración

Una forma de abordar los bucles es separar el iterador (el bucle) de la iteración (el cuerpo del bucle). Es decir, en lugar de tener un bloque de código, extraemos la totalidad del bloque a un método privado. De este modo, el cuerpo del bucle contendría una sola línea. Una de las ventajas de proceder así es que puede ayudarnos a identificar código que realmente pertenece a la clase del objeto que está siendo procesado en la iteración.

Aplicar esta separación en este ejemplo puede ser un poco complicado, dado que en el bucle for vamos acumulando ni más ni menos que tres variables: `total_amount`, `volume_credits` y `result`. 

```python
    for perf in invoice['performances']:
        play = plays[perf['playID']]
        this_amount = calculate_performance_amount(perf, play)
        performance_credits = calculate_performance_credits(perf, play)

        volume_credits += performance_credits
        # print line for this order
        result += f' {play["name"]}: {format_as_dollars(this_amount/100)} ({perf["audience"]} seats)\n'
        total_amount += this_amount
```

Vamos a ver si podemos hacer algo al respecto. Lo primero sería extraer una variable para almancenar la línea que estamos calculando en cada iteración:

```python
    for perf in invoice['performances']:
        play = plays[perf['playID']]
        this_amount = calculate_performance_amount(perf, play)
        performance_credits = calculate_performance_credits(perf, play)

        volume_credits += performance_credits
        # print line for this order
        line = f' {play["name"]}: {format_as_dollars(this_amount/100)} ({perf["audience"]} seats)\n'
        result += line
        total_amount += this_amount
```

Y ahora reunimos las variables acumuladoras:

```python
    for perf in invoice['performances']:
        play = plays[perf['playID']]
        this_amount = calculate_performance_amount(perf, play)
        performance_credits = calculate_performance_credits(perf, play)
        line = f' {play["name"]}: {format_as_dollars(this_amount/100)} ({perf["audience"]} seats)\n'

        result += line
        total_amount += this_amount
        volume_credits += performance_credits
```

Ahora podríamos intentar extraer la parte del cálculo a una nueva función. Sin embargo, en Python las _inner functions_ no son visibles desde dentro de otras _inner functions_, así que tendríamos que pasarlas junto con los parámetros necesarios por lo que este paso no es muy viable. De nuevo, el refactor nos va mostrando que lo más efectivo sería introducir orientación a objetos para este caso.

#### Sólo un `if` por método

En el libro [Five lines of code](https://www.manning.com/books/five-lines-of-code), Christian Clausen propone llevar esta restricción un poco más allá. Además de que cada método tenga un único nivel de indentación, sugiere que solo haya una estructura condicional en cada método y que `if` debería ser siempre la primera línea.

Vamos a ver algunos ejemplos en este código y cómo se podrían abordar.

En el primero, podemos ver que hay un extra si la audiencia supera un cierto umbral. En caso contrario, no se incrementa.

```python
    def calculate_amount_for_comedy(perf):
        amount = 30000
        if perf['audience'] > 20:
            amount += 10000 + 500 * (perf['audience'] - 20)
        amount += 300 * perf['audience']
        return amount
```

Podríamos hacer una modificación temporal para verlo más claro:

```python
    def calculate_amount_for_comedy(perf):
        amount = 30000
        if perf['audience'] > 20:
            extra_for_high_audience = 10000 + 500 * (perf['audience'] - 20)
        else:
            extra_for_high_audience = 0
        amount += extra_for_high_audience
        amount += 300 * perf['audience']
        return amount
```

Ahora podemos extraer el bloque condicional:

```python
    def calculate_amount_for_comedy(perf):
        amount = 30000
        extra_for_high_audience = extra_amount_for_high_audience_in_comdey(perf)
        amount += extra_for_high_audience
        amount += 300 * perf['audience']
        return amount

    def extra_amount_for_high_audience_in_comedy(perf):
        if perf['audience'] > 20:
            extra_for_high_audience = 10000 + 500 * (perf['audience'] - 20)
        else:
            extra_for_high_audience = 0
        return extra_for_high_audience
```

Esto hace que la condición quede como primera línea en `extra_amount_for_high_audience_in_comedy`, que es lo que buscábamos. Ahora limpiamos un poco el código para que quede menos redundante, removiendo variables temporales innecesarias.

```python
    def calculate_amount_for_comedy(perf):
        amount = 30000
        amount += extra_amount_for_high_audience_in_comedy(perf)
        amount += 300 * perf['audience']
        return amount

    def extra_amount_for_high_audience_in_comedy(perf):
        if perf['audience'] > 20:
            return 10000 + 500 * (perf['audience'] - 20)
        else:
            return 0
```

Podemos aplicar un tratamiento similar para otros tipos de obras. El resultado sería este:

```python
    def calculate_amount_for_tragedy(perf):
        amount = 40000
        amount += extra_amount_for_high_audience_in_tragedy(perf)
        return amount

    def extra_amount_for_high_audience_in_tragedy(perf):
        if perf['audience'] > 30:
            return 1000 * (perf['audience'] - 30)
        else:
            return 0
```

Y lo mismo en el cálculo de créditos:

```python
    def calculate_performance_credits(perf, play):
        # add volume credits
        credits = max(perf['audience'] - 30, 0)
        # add extra credit for every ten comedy attendees
        if "comedy" == play["type"]:
            credits += math.floor(perf['audience'] / 5)
        return credits
```

Que quedaría así:

```python
    def calculate_performance_credits(perf, play):
        # add volume credits
        credits = max(perf['audience'] - 30, 0)
        # add extra credit for every ten comedy attendees
        credits += extra_volume_credits_for_comedy(perf, play)
        return credits

    def extra_volume_credits_for_comedy(perf, play):
        if "comedy" == play["type"]:
            return math.floor(perf['audience'] / 5)
        else:
            return 0
```

## El resultado

Y este es el resultado final después de aplicar la regla de un solo nivel de indentación y las reglas extra:

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
            amount = calculate_amount_for_tragedy(perf)
        elif play['type'] == "comedy":
            amount = calculate_amount_for_comedy(perf)
        else:
            raise ValueError(f'unknown type: {play["type"]}')
        return amount

    def calculate_amount_for_comedy(perf):
        amount = 30000
        amount += extra_amount_for_high_audience_in_comedy(perf)
        amount += 300 * perf['audience']
        return amount

    def extra_amount_for_high_audience_in_comedy(perf):
        if perf['audience'] > 20:
            return 10000 + 500 * (perf['audience'] - 20)
        else:
            return 0

    def calculate_amount_for_tragedy(perf):
        amount = 40000
        amount += extra_amount_for_high_audience_in_tragedy(perf)
        return amount

    def extra_amount_for_high_audience_in_tragedy(perf):
        if perf['audience'] > 30:
            return 1000 * (perf['audience'] - 30)
        else:
            return 0

    def calculate_performance_credits(perf, play):
        # add volume credits
        credits = max(perf['audience'] - 30, 0)
        # add extra credit for every ten comedy attendees
        credits += extra_volume_credits_for_comedy(perf, play)
        return credits

    def extra_volume_credits_for_comedy(perf, play):
        if "comedy" == play["type"]:
            return math.floor(perf['audience'] / 5)
        else:
            return 0

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

Como puedes comprobar, se han introducido muchos `else`, lo que nos llevará a aplicar una nueva regla. Pero eso será en otra entrega.

{% include_relative series/calisthenics.md %}
