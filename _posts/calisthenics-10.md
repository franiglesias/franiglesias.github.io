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
* [No usar getters/setters o propiedades públicas](/2022-10-10-calisthenics-9)

El objetivo de esta serie de artículos es desarrollar cada una de las restricciones aplicada a un ejemplo de código y tratar de explicar cómo y por qué funciona.

## Aplicar object calisthenics, ¿mejora el diseño?

Sí, aplicando las reglas de object calisthenics el diseño del código mejora incluso aunque no comencemos ya a introducir patrones.

En líneas generales, reducir el tamaño de los bloques de código y aplanar las estructuras indentadas ayuda a tener bloques de código más cohesivos centrados en torno a una responsabilidad.

Encapsular primitivos y estructuras de datos nativas contribuye a asignar mejor las responsabilidades y mover comportamientos a los objetos a los que corresponden.

## ¿Hay un orden adecuado para aplicar las reglas?

No. Las reglas se aplican según lo necesitamos o nos parece más evidente que se pueden aplicar. Muchas veces, aplicar una regla genera situaciones que se abordan aplicando otra. Así que en realidad, lo que hacemos es observar fragmentos de código que violan una u otra regla y los arreglamos lo mejor posible.

El proceso es, por tanto, iterativo.

## ¿Por dónde empezar?

Empieza aplicando la regla que te resulte más fácil o cuyos casos sean más evidentes. Por ejemplo, no usar abreviaturas es fácil de aplicar en casi cualquier código. Aplanar estructuras condicionales suele ser muy evidente y con el refactor extraer método suele ser sencillo de aplicar en un IDE moderno.

Encapsular tipos primitivos y estructuras de datos no es difícil, pero ya supone un trabajo extra porque tenemos que asegurar que en todos sus usos podemos hacer la sustitución. Sin embargo, una vez introducido un concepto como objeto, mover comportamiento viene de forma casi natural.

Eliminar la palabra clave ELSE puede ser complicado si no aislamos las estructuras condicionales previamente, para lo cual es bueno haber aplicado antes la regla de unh solo nivel de indentación.

No usar getter o setters puede ser muy sencillo en algunos casos, pero no es evidente como hacerlo en otros. En uno de los ejemplos de estos artículos, introdujimos el patrón Visitor para hacerlo, pero no es uno de los más sencillos de aplicar precisamente.

## ¿Debo aplicar las reglas exhaustivamente en todo el código?

No. Céntrate sobre todo en la lógica de dominio, que es la que más te interesa que sea fácil de entender y de mantener en el futuro. Las mejoras del código en esta área son más prioritarias, porque los objetos tienen mayor significación. En las partes de implementación de infraestructura, los beneficios no son tan importantes, lo que no debería justificar un diseño chapucero.

## Más consideraciones y ejemplos sobre algunas reglas

### Más sobre encapsular primitivas

Me he dejado algunos valores primitivos sin encapsular. El criterio de prioridad para encapsular primitivas sería algo así como: Encapsula primitivos en objetos cuando:

* El primitivo representa un concepto relevante del dominio o negocio de la aplicación
* El primitivo tiene reglas validación o comportamiento asociado que no es soportado por el propio tipo, lo que básicamente indica que el concepto es importante para el dominio

Por ejemplo, tras aplicar la última regla a Play y extender en dos subclases, quedó de manifiesto que el cálculo de importe extra en relación con la audiencia era un comportamiento asociado al concepto de Audiencia. De hecho, el IDE señala esos métodos como candidatos a ser métodos estáticos. Por ejemplo, en `Tragedy` es así:

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

Podríamos introducir una clase `Audience` que nos calcule al Amount extra, pasándole los parámetros necesarios:

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

## El resultado

[Puedes consultar el proyecto en Github](https://github.com/franiglesias/theatrical-plays-kata) 

## ¿Fin? Esta vez, sí.


