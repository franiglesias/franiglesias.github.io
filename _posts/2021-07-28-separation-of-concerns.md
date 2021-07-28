---
layout: post
title: Principio de separación de intereses
categories: articles
tags: design-principles
---

[Edsger W. Dijkstra](https://es.wikipedia.org/wiki/Edsger_Dijkstra) (1930-2002) es todo un personaje en el campo de las ciencias de la computación, no solo por la cantidad y calidad de sus aportaciones, sino también por su particular carácter y algunas frases lapidarias.

Entre otras cosas, suyos son el algoritmo del camino más corto o algoritmo de Dijkstra, [la notación polaca inversa](https://es.wikipedia.org/wiki/Notación_polaca_inversa), [el sistema THE](https://es.wikipedia.org/wiki/THE), el algoritmo del banquero o el concepto de semáforo en sistemas multi-proceso. También cuenta en su haber con contribuciones a la idea de la [programación estructurada](https://es.wikipedia.org/wiki/Programación_estructurada), como su famoso [artículo sobre la sentencia GOTO](https://homepages.cwi.nl/~storm/teaching/reader/Dijkstra68.pdf).

La primera vez que leí algo sobre Dijkstra fue la [diatriba sobre el lenguaje BASIC](https://www.goodreads.com/quotes/79997-it-is-practically-impossible-to-teach-good-programming-to-students), el cual consideraba dañino. Lo que yo no sabía tampoco es que Alan Kay dijo que la arrogancia se mide en *nano-dijsktras*, así que podemos hacernos una idea.

También es responsable de introducir el principio de la separación de intereses, en su artículo de 1974 "[On the role of scientific thought](https://www.cs.utexas.edu/users/EWD/transcriptions/EWD04xx/EWD447.html)".

## El principio de la separación de intereses

Básicamente, el principio nos dice que los programas no deben escribirse como una única pieza que  resuelva el problema. En lugar de eso, debe organizarse en partes más pequeñas que se ocupan de tareas especializadas. O dicho de una forma más sencilla: diferentes partes del problema son tratadas por diferentes partes del programa.

Para ilustrarlo voy a usar un ejemplo exageradamente simplificado.

Consideremos este código en python:

```python
#!/usr/bin/env python3

# Separation of concerns principle
# Different parts of the program address different concerns

import sys


if __name__ == '__main__':
    print(sum(map(int, sys.argv[1:])))
```

Este programa simplemente suma los números que se le pasan como argumento:

```
./main.py 20 30 40
```

Da como resultado `90`.

No parece tener nada incorrecto, ¿verdad? De hecho, este tipo de código suele considerarse como especialmente interesante e inteligente.

Pero para los objetivos de este artículo, este código pone de manifiesto un problema. Obviamente es un ejemplo muy extremo, pero creo que nos servirá.

En primer lugar, cualquier programa básico tiene tres partes, y es la primera separación de intereses que vamos a considerar aquí: 

* conseguir la información necesaria
* procesarla para obtener un resultado
* mostrar el resultado

En nuestro programa la única línea que tiene el programa se ocupa de los tres intereses. Esto quiere decir que si necesitamos modificar algo en relación con cualquiera de los tres intereses principales, tendremos que alterar **todo** el programa.

Da igual si se trata de mejorar algo en la presentación de resultados, obtener los números a sumar de otra fuente o lo que sea. Cambiar un aspecto del software implica hacer cambios que afectan a otros.

Así que vamos a ver cómo separarlo. Nuestro objetivo es tener tres módulos, funciones en este caso, que se ocupen cada uno de un área de interés.

Empecemos por la obtención de los números para realizar el cálculo. Se trata de esta parte del one-liner:

```python
map(int, sys.argv[1:])
```

El resultado de este fragmento es un array de números para sumar. Para empezar extraeremos la expresión a una variable:

```python
if __name__ == '__main__':
    numbers_to_sum = map(int, sys.argv[1:])
    print(sum(numbers_to_sum))
```


El segundo interés es el cálculo en sí, que podemos extraer igualmente a una nueva variable:

```python
if __name__ == '__main__':
    numbers_to_sum = map(int, sys.argv[1:])
    sum_result = sum(numbers_to_sum)
    print(sum_result)
```

Finalmente, la salida de resultados queda aislada en la última línea.

En este momento, cada línea de main se ocupa de una cosa diferente, así que podríamos decir que ya tenemos separación de intereses. De todos modos, las líneas no son unidades de software como lo serían las funciones, así que vamos a extraerlas:

```python
def get_numbers_to_sum():
    return map(int, sys.argv[1:])


def sum_numbers():
    return sum(numbers_to_sum)


def show_result():
    print(sum_result)


if __name__ == '__main__':
    numbers_to_sum = get_numbers_to_sum()
    sum_result = sum_numbers()
    show_result()
```

Puedes decir que no hay mucha diferencia. Sin embargo, ahora cada interés está siendo atendido por un módulo diferente del programa. Partes diferentes del programa se ocupan de intereses diferentes, en un mismo nivel de abstracción del proceso completo. 

Veamos un momento `get_numbers_to_sum`. En esta función están gestionándose dos cosas diferentes: obtener los números de los argumentos pasados por línea de comandos y convertir el array de argumentos en un array de enteros que pueda ser sumado. Dos intereses, deberían estar siendo atendidos por partes diferentes del software.

Primero, separamos en líneas:

```python
def get_numbers_to_sum():
    arguments_to_consider = sys.argv[1:]
    return map(int, arguments_to_consider)
```

Y ahora podemos extraer a sus métodos. He aquí el programa completo:

```python
#!/usr/bin/env python3

# Separation of concerns principle
# Different parts of the program address different concerns

import sys


def get_numbers_to_sum():
    arguments_to_consider = get_arguments_from_cli()
    return convert_numbers_to_integers(arguments_to_consider)


def convert_numbers_to_integers(arguments_to_consider):
    return map(int, arguments_to_consider)


def get_arguments_from_cli():
    return sys.argv[1:]


def sum_numbers(numbers):
    return sum(numbers)


def show_result(result):
    print(result)


if __name__ == '__main__':
    numbers_to_sum = get_numbers_to_sum()
    sum_result = sum_numbers(numbers_to_sum)
    show_result(sum_result)
```

Cada interés está limpiamente separado en una función diferente.

Algunas cosas interesantes que pueden ocurrir ahora:

En caso de tener que modificar un aspecto del programa, no tenemos más que modificar la función que se ocupa de ello. Si queremos mejorar la salida de datos, por ejemplo, podemos hacer el cambio en un único lugar, sin afectar al resto:


```python
#!/usr/bin/env python3

# Separation of concerns principle
# Different parts of the program address different concerns

import sys


def get_numbers_to_sum():
    arguments_to_consider = get_arguments_from_cli()
    return convert_numbers_to_integers(arguments_to_consider)


def convert_numbers_to_integers(arguments_to_consider):
    return map(int, arguments_to_consider)


def get_arguments_from_cli():
    return sys.argv[1:]


def sum_numbers(numbers):
    return sum(numbers)


def show_result(result):
    print("El resultado es {r}".format(r=result))


if __name__ == '__main__':
    numbers_to_sum = get_numbers_to_sum()
    sum_result = sum_numbers(numbers_to_sum)
    show_result(sum_result)
```

Podríamos hacer cambios en el funcionamiento del programa simplemente introduciendo nuevas funciones y llamándolas en lugar de las actuales. Por ejemplo:

```python
#!/usr/bin/env python3

# Separation of concerns principle
# Different parts of the program address different concerns

import sys


def get_numbers_to_sum():
    arguments_to_consider = get_arguments_from_cli()
    return convert_numbers_to_integers(arguments_to_consider)


def convert_numbers_to_integers(arguments_to_consider):
    return map(int, arguments_to_consider)


def get_arguments_from_cli():
    return sys.argv[1:]


def sum_numbers(numbers):
    return sum(numbers)


def show_result(result):
    print("El resultado es {r}".format(r=result))


def show_naked_result(result):
    print(result)


if __name__ == '__main__':
    numbers_to_sum = get_numbers_to_sum()
    sum_result = sum_numbers(numbers_to_sum)
    show_naked_result(sum_result)
```

El siguiente ejemplo es un poco más elaborado. Ahora podemos pasar una opción al programa que nos permita elegir cómo se mostrará el resultado usando un método u otro (añadir la opción --naked antes de los sumandos). La clave es que al tener todo separado es bastante fácil introducir incluso estos cambios más complejos.

Nota: el ejemplo es muy mejorable, pero creo que puede servir.

```python
#!/usr/bin/env python3

# Separation of concerns principle
# Different parts of the program address different concerns

import sys


def get_numbers_to_sum():
    arguments_to_consider = get_arguments_from_cli()
    return convert_numbers_to_integers(arguments_to_consider)


def convert_numbers_to_integers(arguments_to_consider):
    return map(int, arguments_to_consider)


def get_arguments_from_cli():
    if sys.argv[1].isdigit():
        return sys.argv[1:]

    return sys.argv[2:]


def sum_numbers(numbers):
    return sum(numbers)


def show_result(result):
    print("El resultado es {r}".format(r=result))


def show_naked_result(result):
    print(result)


def get_result_mode():
    return sys.argv[1]


def show_result_according_mode(result):
    if get_result_mode() == '--naked':
        show_naked_result(result)
    else:
        show_result(result)


if __name__ == '__main__':
    numbers_to_sum = get_numbers_to_sum()
    sum_result = sum_numbers(numbers_to_sum)
    show_result_according_mode(sum_result)
```

Dejando aparte los defectos bastante visibles de este código, creo que queda claro cómo el hecho de separar partes del código conforme a los intereses a los que atiende mejora mucho sus propiedades de mantenibilidad y extensibilidad.

El principio de separación de intereses está en la base de otros muchos principios de diseño, entre ellos el Single Responsibility Principle y Tell, don't ask. Pero de esa relación nos ocuparemos más adelante.
