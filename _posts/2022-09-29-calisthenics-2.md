---
layout: post
title: Object Calisthenics. No usar la palabra clave ELSE
categories: articles
tags: good-practices refactoring
---

Una serie de restricciones que te ayudarán a escribir mejor código. En esta ocasión, evitaremos usar la clave `ELSE`.

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

## No usar la palabra clave ELSE

Una estructura condicional puede dar lugar a varias ramas en el flujo de ejecución de modo que si se cumple la condición se sigue un camino, y si no se cumple... pues se sigue otro. O simplemente no se sigue ninguno y se continúa con la siguiente instrucción. 

Pero, ¿qué problema hay con `else`? Al fin y al cabo, no indica otra cosa que seguir unas instrucciones específicas para el caso de que no se cumplan las condiciones requeridas en el `if`. Normalmente, el problema no es el hecho de usar `else` per se, sino el contexto en el que lo usamos o la organización de código que se genera usándolo. Se podría decir que utilizar `else` puede ser un _smell_, un síntoma de que algo podría estar mejor diseñado. Si nos obligamos a eliminarlo, podemos mejorar el código.

### Condicionales sencillas, aún más sencillas

Una estructura `if` tiene este aspecto:

```
// instrucciones previas

if (condicion) then
   // instrucciones si se cumple la condición

// instrucciones posteriores
```

Usamos `else` cuando queremos ejecutar ciertas instrucciones en caso de no cumplirse la condición, de forma alternativa.

```
// instrucciones previas

if (condicion) then
   // instrucciones si se cumple la condición
else
   // instrucciones alternativas si no se cumple

// instrucciones posteriores
```

Esta estructura ya podría introducir algo de ruido a la hora de leer el programa. Como vimos en el artículo anterior, nos interesa forzar un solo nivel de indentación como máximo para evitar la sobrecarga de seguir el código anidado. La introducción de `else` no añade un nivel de indentación extra, pero implica que tenemos que mantener en la cabeza dos flujos alternativos.

Esto se complica si tenemos que hacer seguimiento de variables que son inicializadas fuera de la estructura condicional, pero manipuladas en ella. También se complica la lectura si el tamaño de uno de los bloques es muy grande, ya que podría ofuscar el otro.

Por esa razón, se recomendaba aislar la estructura condicional en un método o función, de modo que el `if` fuese la primera línea y únicamente hubiese una condicional en ese método:

```
// instrucciones previas

// instrucciones cuyo resultado depende de una condición

// instrucciones posteriores
```

```
if (condicion) then
   // instrucciones si se cumple la condición
else
   // instrucciones alternativas si no se cumple
   
return
```

Al aislar de esta manera las condicionales, tanto la rama del `if` como la del `else` retornarán al punto de llamada, ya que no hay más instrucciones que seguir. De hecho, podríamos retornar desde ambas ramas. Es lo que conocemos como patrón `return early`,

```
if (condicion) then
   // instrucciones si se cumple la condición
   return
else
   // instrucciones alternativas si no se cumple
   return
```

Esto hace redundante la palabra clave `else`, ya que no es necesario asegurar que la condición del if no se cumple.

```
if (condicion) then
   // instrucciones si se cumple la condición
   return

// instrucciones alternativas si no se cumple
return
```
Retomando el ejemplo del artículo anterior, tenemos varias situaciones en las que se usa else que podríamos examinar. Recordemos el código:

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

Aquí tenemos un ejemplo:

```python
    def extra_amount_for_high_audience_in_comedy(perf):
        if perf['audience'] > 20:
            return 10000 + 500 * (perf['audience'] - 20)
        else:
            return 0
```

Este caso es bastante sencillo porque el else es redundante:

```python
    def extra_amount_for_high_audience_in_comedy(perf):
        if perf['audience'] > 20:
            return 10000 + 500 * (perf['audience'] - 20)
        
        return 0
```

Tenemos formas alternativas. Una de ellas consiste en usar el operador ternario, que funciona especialmente bien cuando queremos expresar un cálculo que se realiza de maneras diferentes.

```python
    def extra_amount_for_high_audience_in_comedy(perf):
        return 10000 + 500 * (perf['audience'] - 20) if perf['audience'] > 20 else 0
```

Otra forma de hacerlo es invertir la condición, dejando el caso residual como una cláusula de guarda. Es especialmente aplicable si se trata de verificar precondiciones de los parámetros que llegan al método o función. De esta forma, centras la atención en la rama más significativa.

```python
    def extra_amount_for_high_audience_in_comedy(perf):
        if perf['audience'] <= 20:
            return 0
        
        return 10000 + 500 * (perf['audience'] - 20)
```

Cualquiera de las tres técnicas te permite suprimir el `else`. La más adecuada dependerá del aspecto que necesites acentuar. Para este ejemplo podrían funcionar las tres bastante bien y resulta difícil decidirse por una de ellas. Quizá en este caso optaría por la condicional invertida.

De este modo, las tres funciones que contienen condicionales simples quedarían así:

```python
    def extra_amount_for_high_audience_in_comedy(perf):
        if perf['audience'] <= 20:
            return 0

        return 10000 + 500 * (perf['audience'] - 20)

    def extra_amount_for_high_audience_in_tragedy(perf):
        if perf['audience'] <= 30:
            return 0

        return 1000 * (perf['audience'] - 30)

    def extra_volume_credits_for_comedy(perf, play):
        if "comedy" != play["type"]:
            return 0

        return math.floor(perf['audience'] / 5)
```

### Condicionales complejas

Tenemos otro ejemplo interesante aquí:

```python
    def calculate_performance_amount(perf, play):
        if play['type'] == "tragedy":
            amount = calculate_amount_for_tragedy(perf)
        elif play['type'] == "comedy":
            amount = calculate_amount_for_comedy(perf)
        else:
            raise ValueError(f'unknown type: {play["type"]}')
        return amount
```

Se trata de una serie de condicionales encadenadas a través de la clave `else` o `else if`. La estructura condicional maneja un cierto número de condiciones de tal manera, que si no se cumple la inicial, tenemos que verificar si se cumplen otras y actuar en consecuencia.

Esta estructura encadenada se entiende mejor usando `switch`, lo que esconde el `else`, aunque realmente no lo elimina. Sin embargo, Python no tiene `switch` por lo que no incluyo el ejemplo.

De nuevo, podremos usar _return early_ para simplificar la estructura. Primero introducimos el `return`.

```python
    def calculate_performance_amount(perf, play):
        if play['type'] == "tragedy":
            return calculate_amount_for_tragedy(perf)
        elif play['type'] == "comedy":
            return calculate_amount_for_comedy(perf)
        else:
            raise ValueError(f'unknown type: {play["type"]}')
```

Y a continuación, eliminamos los `else`:

```python
    def calculate_performance_amount(perf, play):
        if play['type'] == "tragedy":
            return calculate_amount_for_tragedy(perf)
        if play['type'] == "comedy":
            return calculate_amount_for_comedy(perf)
        
        raise ValueError(f'unknown type: {play["type"]}')
```

## Por qué funciona

Eliminar `else` nos obliga a pensar bien nuestras estructuras condicionales. Una estructura condicional siempre hace al menos dos cosas: decidir si se cumple la condición, hacer algo si es así. En el caso de else, hay que añadir una tercera cosa: la acción alternativa.

De hecho, en orientación a objetos, la mera presencia de una estructura condicional puede significar un problema de diseño. Esto ocurre, por ejemplo, cuando la condicional verifica alguna propiedad de un objeto (o de algún concepto del programa que potencialmente pueda ser un objeto). En ese caso, se pone de manifiesto la necesidad de polimorfismo. Nuestro último refactor elo deja muy claro.

Cuando se toma una decisión basada en el tipo de un concepto, debería abordarse mediante polimorfismo.

```python
    def calculate_performance_amount(perf, play):
        if play['type'] == "tragedy":
            return calculate_amount_for_tragedy(perf)
        if play['type'] == "comedy":
            return calculate_amount_for_comedy(perf)
        
        raise ValueError(f'unknown type: {play["type"]}')
```

Sin embargo, cuando la decisión se basa en un valor, podríamos recurrir a otros enfoques

```python
    def extra_amount_for_high_audience_in_tragedy(perf):
        if perf['audience'] <= 30:
            return 0

        return 1000 * (perf['audience'] - 30)
```

De todos modos, la introducción de la orientación a objetos vendrá de la mano de las siguientes reglas, que consisten en empaquetar todas nuestras primitivas y colecciones en objetos. Es decir, representar los conceptos usando objetos.

## El resultado

Después de eliminar la palabra clave `else`, el código queda así:

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

Parece muy claro que conceptos como obra (play) y actuación (performance) están pugnando por salir. Y alguno más. Lo veremos en el artículo siguiente.
