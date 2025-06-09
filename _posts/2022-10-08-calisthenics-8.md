---
layout: post
series: calisthenics
title: No más de dos variables de instancia por clase
categories: articles
tags: good-practices refactoring
---

Una serie de restricciones que te ayudarán a escribir mejor código. Siguiendo con la tónica de mantener pequeños nuestros objetos, ahora solo tendremos dos propiedades como máximo.

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

## No más de dos variables de instancia por clase

Otra regla que se presta a mucha discusión es esta y puede ser considerada un auténtico _tour de force_, porque ¿qué entidad de negocio no necesita una buena cantidad de propiedades? ¿Y pretendes que únicamente sean dos?

De nuevo, una regla de calisthenics nos propone una restricción especialmente artificial que nos obliga a reflexionar sobre nuestro diseño y cómo podríamos mejorarlo. [Un artículo anterior de este blog](/calistenics-and-value-objects/) planteaba un ejercicio en el que se mostraba un ejemplo de cómo hacerlo en un tipo de datos bastante comunes en muchos negocios.

De hecho, en el ejemplo de las obras teatrales no tenemos más que un par de casos discutibles. Esto es debido en parte a lo reducido del problema, pero también porque hemos ido extrayendo todo el conocimiento a objetos pequeños.

### El caso de Performance

La clase Performance contiene tres propiedades o variables de instancia:

```python
class Performance:
    def __init__(self, audience, play):
        self._audience = audience
        self._play = play
        self._amount = None
```

Lo que nos encontramos en `Performance` es que las variables de instancia son, por decirlo así, irreconciliables. Representan cosas completamente diferentes. De hecho `_amount` tiene un significado puramente técnico, siendo una variable que usamos para poder realizar una optimización por lo que podríamos decir que Performance solo tiene dos propiedades: `_audience` y `_play`.

Precisamente, `Play` también tiene dos propiedades, aunque en este momento únicamente muestra una:

```python
class Play:
    def __init__(self, data):
        self._data = data

    def name(self):
        return self._data['name']

    def type(self):
        return self._data['type']
```

Esto es consecuencia de que simplemente hemos encapsulado una estructura de datos nativa, pero no significa que `Play` tenga una única propiedad. Sus dos propiedades se manifiestan en dos métodos _getter_, de los que tendremos que hablar en el siguiente artículo.

Vamos a refactorizar eso:

```python
class Play:
    def __init__(self, data):
        self._name = data['name']
        self._type = data['type']

    def name(self):
        return self._name

    def type(self):
        return self._type
```

Volvamos por un momento a `Performance`. Una consecuencia interesante de nuestro diseño es que el resto del programa no necesita saber de la existencia de `Play`, ya que todo el comportamiento de `statement` ocurre a través de `Performance`. Desde este punto de vista, `Play` sería irrelevante y podríamos haberla fusionado con `Performance`. De este modo, `Performance` podría tener este aspecto:

```python
class Performance:
    def __init__(self, audience, play_name, play_type):
        self._audience = audience
        self._title = play_name
        self._type = play_type
        self._amount = None
```

¿Recuerdas cuando `Performance` era demasiado grande porque se ocupaba de responsabilidades de `Play`? En aquel momento hubiésemos podido prescindir del objeto `Play` que entonces no era más que una simple _Data Class_  (un objeto que solo tiene datos pero no comportamiento) y podríamos haber fusionado sus propiedades con las de `Performance`.

Esencialmente, lo que quiero decir es que cuando una clase tiene muchas propiedades, es muy probable que esté tratando de ocuparse de demasiadas responsabilidades. Si agrupamos propiedades cohesivas y extraemos nuevas clases a partir de ellas, lo más seguro es que se llevarán consigo comportamientos de la clase contenedora.

Más pequeño y más simple.

### El caso de `Line`

Otra clase con más de dos propiedades es `Line`:

```python
class Line:
    def __init__(self, title, audience, amount):
        self.title = title
        self.audience = audience
        self.amount = amount
```

`Line` tiene tres propiedades por una buena razón, su tarea es algo así como representar un registro que tiene tres campos. Se trata de un ejemplo bastante claro de no poder reducir el número de variables por debajo del límite marcado.

Pero, ¿acaso `Line` no es la versión impresa de `Performance`? A lo mejor no necesitamos pasar las tres propiedades separadas, sino que `Performance` ya las agrupa. `Line` es como un decorador.

```python
class FormattedPerformance:
    def __init__(self, performance):
        self._performance = performance

    def formatted(self):
        return f' {self._performance.title()}: {FormattedAmount(self._performance.amount()).dollars()} ({self._performance.audience()} seats)\n'
```

Y la usaríamos así:

```python

def print_lines(self, invoice):
    for performance in invoice.performances():
        self.print_details(performance)

def print_details(self, performance):
    line = FormattedPerformance(performance)
    self.printer.print(line.formatted())

```

Este enfoque es interesante. Nos permite cumplir la regla de las dos variables de instancia reemplazando `Line` que tiene tres por `FormattedPerformance` que solo tiene una.

Pero todavía nos queda una regla que aplicar y va a poner en cuestión muchas de estas decisiones.

## Por qué funciona

Tanto esta como la regla anterior ponen énfasis en que las clases se ocupen de pocas cosas a la vez. Cuantas menos mejor. Para lograr eso nos fuerza a intentar cumplir con unos límites totalmente arbitrarios, que nos obligan a pensar en la cohesión de nuestro código.

La cohesión es el grado en que cada línea de código se relaciona con las demás dentro de su misma unidad (blqque, método, clase...). Cuando la cohesión es máxima, todas las líneas de código tienen que estar ahí, ninguna sobra. Para que esto ocurra, los bloques de código tienen que ser pequeños, minimizando la posibilidad de una parte del código realmente no esté contribuyendo a las responsabilidades de esa unidad.

Con las propiedades (o variables de instancia) ocurre lo mismo. Cuantas más haya en una clase, más probable es que exista una falta de cohesión. En algunos casos, el problema vendrá dado porque esas propiedades no corresponden realmente a esa clase. En otros casos, lo que ocurre es que algunas de esas propiedades son altamente cohesivas entre ellas, indicando que pueden agruparse en un objeto que represente un concepto al que contribuyen y que podemos extraer.

## El resultado

[Puedes consultar el proyecto en Github](https://github.com/franiglesias/theatrical-plays-kata) 

