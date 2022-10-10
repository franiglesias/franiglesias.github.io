---
layout: post
title: Object Calisthenics. No usar abreviaturas
categories: articles
tags: good-practices refactoring
---

Una serie de restricciones que te ayudarán a escribir mejor código. Hoy toca hablar de no usar abreviaturas.

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

## No usar abreviaturas

Este artículo debería ser bastante breve, ya que no hay muchos casos en nuestro ejercicio de ejemplo. No obstante, forzaremos algunos ejemplos para ver los problemas del uso de abreviaturas.

La regla nos pide no usar abreviaturas para nombrar variables, objetos o funciones. El objetivo, por supuesto, es que el código sea lo más autoexplicativo posible. Si nos encontramos una abreviatura puede ocurrir que no conozcamos la referencia, puede que sea ambigua y no pueda entender bien el significado ni siquiera por el contexto, o puede ser simplemente confusa.

### Abreviatura por conflicto de nombres

Aquí tenemos un ejemplo de uso de una abreviatura. En este caso para no generar un conflicto de nombres entre el parámetro que pasa los datos y la variable que contiene el objeto `Invoice`. Este tipo de atajos vienen de no tomar suficiente tiempo para pensar un nombre adecuado.

```python
def statement(invoice, plays):
    printer = Printer()
    invoice_amount = Amount(0)
    volume_credits = Credits(0)
    inv = Invoice(invoice, plays)

    printer.print(f'Statement for {inv.customer()}\n')
```

La pregunta es, ¿quién de los dos tiene el derecho a llamarse propiamente `invoice`? A medida que hemos ido aplicando reglas e introduciendo objetos, también necesitamos cambiar nombres. Al principio, `invoice` designaba una estructura de datos que representaba una factura. Sin embargo, al introducir el objeto `Invoice`, el parámetro pasa a ser un simple transporte de datos.

Por esa razón, realmente tiene más sentido hacer algunos cambios en los nombres. Esta es una posible solución:

```python
def statement(invoice_data, plays):
    printer = Printer()
    invoice_amount = Amount(0)
    volume_credits = Credits(0)
    invoice = Invoice(invoice_data, plays)

    printer.print(f'Statement for {invoice.customer()}\n')
```

### Lo que nos dice un nombre

La abreviatura `inv` puede ser confusa si no tenemos contexto. Por ejemplo, es habitual que signifique `inverso`, así que siempre es preferible poner nombres completos, significativos e inequívocos. Es preferible pasarse por nombre largo que por nombre corto.

En `Performance` tenemos el método `extra_amount_for_high_audience_in_comedy`, cuyo nombre es extremadamente largo. Sin embargo, es inequívoco y dice exactamente lo que hace. A veces, el contexto nos puede proporcionar suficientes pistas. Este método es llamado desde `calculate_amount_for_comedy`, por lo que podríamos considerar acortarlo a `extra_for_high_audience`. Pero existe otro método 
de nombre similar en la misma clase: `extra_amount_for_high_audience_in_tragedy`. Así que para diferenciarlos deberíamos mantener la referencia al tipo de obra.

Por supuesto, en realidad estos nombres nos están insistiendo en la necesidad de abordar el polimorfismo de `Play`, pero es algo que vamos a dejar para otro artículo más adelante. La lección aquí es que reflexionar sobre los nombres nos ayudará a alcanzar un mejor diseño.

En cualquier caso, si un nombre resulta incómodo por ser demasiado largo, siempre tienes la oportunidad de refactorizar.

### Abreviaturas aceptables

Algunas abreviaturas son de uso común. Por ejemplo, `vat` por `value added tax`.

### Convenciones problemáticas

Existen algunas convenciones que usan nombres abreviados o especialmente cortos. Un ejemplo son los bucles, en los que se suelen usar nombres de variables como `i`, `j` o `k`. En su lugar es recomendable usar alternativas: `index`, `position`, `counter`, son mucho más explícitas y más difíciles de confundir.

```python
    for i in range(0, 3):
        print(i)
```

Frente a:

```python
    for counter in range(0, 3):
        print(counter)
```

En general, usar variables de una sola letra es confuso. ¿Qué es `p`? Incluso teniendo el contexto, una variable de una única letra nos obliga a pensar dos veces.

```python
    for p in invoice.performances():
        printer.print(formatted_line(p.title(), p.audience(), p.amount()))
        invoice_amount = invoice_amount.add(p.amount())
        volume_credits = volume_credits.add(p.credits())
```

Además, es poco práctico. Si tienes que hacer una búsqueda de texto para encontrar la variable puede ser una odisea. Dentro del archivo nos salva que para tareas de refactor los IDE suelen usar el árbol sintáctico, pero si la búsqueda es de texto normal... ¡Buena suerte!

Esto ocurre también con nombres cortos, pero demasiado genéricos, como `get`, `add`, etc., que son comunes a infinidad de librerías.

## Por qué funciona

No usar abreviaturas nos fuerza a pensar nombres significativos, lo que ayuda a que el código se explique mejor por sí mismo. Esto permite que sea más fácil incorporar más personas a los proyectos y hacerlo más mantenible en el largo plazo. Puede que con el tiempo nos olvidemos de lo que significaban las abreviaturas, por lo que usar nombres completos será una ventaja.
