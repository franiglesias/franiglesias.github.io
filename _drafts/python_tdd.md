---
layout: post
title: TDD en python
categories: articles
tags: testing python
---

He comenzado un pequeño *pet project* en el que necesito poder generar y validar NIFs y CIFs para hacer pruebas de otras aplicaciones. Con tal motivo he decidido crear un paquete con las herramientas que necesito y quizá publicarlo.

Al grano: en este artículo construiré un Value Object Cif que en España es el Código de Identificación Fiscal para empresas. Tiene una validación basada en el [algoritmo de Luhn](https://es.wikipedia.org/wiki/Algoritmo_de_Luhn), sobre el cual existe una kata, por cierto.

En cualquier caso, las reglas de negocio de la validación del Cif son las siguientes:



Lo primero, como siempre es empezar por un test que falle. En ocasiones anteriores he utilizado un tamaño muy pequeño de *baby steps*, pero esta vez daré pasos un poquito más grandes.

La primera regla del Cif es que tiene nueve caracteres, así que el primer test verificará que se lanza una excepción si en caso de que el tamaño de la cadena de caracteres es inadecuado.

Para hacer un TestCase importamos el módulo `unittest` y creamos el `CifTestCase` extendiendo la clase `unitest.TestCase`. En Python las clases se definen así:

```python
# tests/cif_test_case.py
import unittest


class CifTestCase(unittest.TestCase):
    def test_it_rejects_invalid_length(self):
        with self.assertRaises(InvalidCifException):  Cif('0123456789A')


if __name__ == '__main__':
    unittest.main()
```

Nuestro subject under test será un objeto de la clase `Cif`, que aún no está creada, y queremos verificar que si se instancia con una cadena mal formada se lanza una excepción `InvalidCifException`. Obviamente al ejecutar el test nos va a pedir que los creemos, por lo que vamos a añadir ya las línea de importación de modo que el IDE nos ayude a generarlo en el lugar correcto.

Para eso utilizo la forma alternativa de importación en la que se indica el paquete.módulo del cual queremos traernos una clase determinada. En este caso, el paquete se va a llamar `spnif`.

```python
# tests/cif_test_case.py
import unittest

from spnif.exception import InvalidCifException
from spnif.cif import Cif

class CifTestCase(unittest.TestCase):
    def test_it_rejects_invalid_length(self):
        with self.assertRaises(InvalidCifException):  Cif('0123456789A')


if __name__ == '__main__':
    unittest.main()
```

Si ejecutamos el test ahora fallará para decir que no tenemos definida la excepción, así que la creamos en el módulo `exception` (que es el archivo `exception.py` situado en la raíz del proyecto).

En Python un módulo es un archivo que puede contener una o más funciones o clases. Al contrario de lo que ocurre en otros lenguajes, como en PHP, no hay una convención fuerte sobre la necesidad de tener una función o clase por archivo, sino que queda un poco al criterio del desarrollador. En el caso de PHP esta convención sirve para simplificar la gestión de los espacios de nombres y la carga de clases.

Sin embargo, en Python, la concisión del código muchas veces nos facilita tener varias funciones en el mismo módulo sin complicar excesivamente su gestión. Por eso, en el módulo `exception` tengo varias excepciones que va a usar mi paquete.

```python
# exception.py
class InvalidNifException(BaseException):
    pass


class InvalidCifException(BaseException):
    pass
```

Una vez añadido el módulo, si ejecuto el test reclamará la creación de la clase `Cif`, por lo que añadimos el siguiente código en el archivo `cif.py`.

```python
# cif.py
import spnif.exception


class Cif:
    def __init__(self, cif):
        raise spnif.exception.InvalidCifException
```

El código es el mínimo para que el test pase, lo que supone lanzar la excepción incondicionalmente.

De nuevo, lanzamos el test y nos ponemos en verde, por lo que estamos en disposición de atacar la siguiente regla de negocio del Cif.
