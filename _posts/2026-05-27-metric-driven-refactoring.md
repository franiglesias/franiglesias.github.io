---
layout: post
title: Refactoring dirigido por métricas
categories: [ articles ]
tags: [ refactoring, good-practices ]
recommended: true
---

Lejos de ser una cuestión estética o academicista, el refactoring es una herramienta de control de costes del desarrollo de software. Incluso en tiempos de Inteligencia Artificial.

La calidad del software es medible, aunque sus métricas no siempre son fáciles de gestionar. Por lo general, decimos que la calidad está relacionada con la baja complejidad y la facilidad de cambio y mantenimiento, que implican a su vez una gran inteligibilidad. Un software fácil de cambiar, es un software que se puede adaptar rápidamente a las necesidades de negocios en transformación constante. Por tanto, cuanto más podamos hacer hoy por mejorar su calidad, mejores serán las condiciones que nos encontraremos en el futuro para trabajar con él.

Se podría argumentar que, con la extensión del uso de asistentes y agentes de código esta necesidad ya no existe. Total: cualquier LLM puede entender el código por enrevesado que esté. Sin embargo, el coste de uso del LLM será menor cuanto más mantenible sea el código con el que tiene que lidiar.

## Como medir la calidad del software

Esencialmente, a través de la medida de su complejidad, tanto estructural como cognitiva, cohesión y acoplamiento.

Tenemos dos formas principales: heurísticas y métricas.

### Heurísticas

Las heurísticas nos proporcionan una aproximación sencilla a la complejidad. En este contexto, una heurística es un método aproximativo de medición. Partiendo de signos que podemos identificar de forma sencilla, nos permite obtener, como mínimo, una indicación de que aquello que estamos examinando se ajusta o no a un criterio determinado. Aunque no
tengamos una medida precisa.

Tenemos dos familias de heurísticas bastante conocidas: las reglas de calistenia y los code smells.

Las [reglas de calistenia](/calisthenics-1/) son nueve reglas propuestas por Jeff Bay como ejercicio para mejorar el código orientado a objetos. Se pueden utilizar perfectamente como proxy de medidas de complejidad más precisas.

Los code smells describen patrones de código identificables que se relacionan con algún tipo de problema ligado a la complejidad, la cohesión o el acoplamiento. Igualmente, pueden actuar como proxy de una medición precisa.

Es decir, ambas familias de heurísticas nos proporcionan una forma sencilla de detectar áreas problemáticas de la calidad del software que escribimos.

Esto no quiere decir que sean medidas subjetivas. Decir que un código es elegante es una forma de describir un código bien hecho, pero es una descripción subjetiva. La elegancia es muy difícil de definir, aunque podamos percibirla. Sin embargo, estas heurísticas se basan en rasgos concretos e identificables del código.

Tomemos por ejemplo la regla de calistenia "un solo nivel de indentación por método" se puede identificar fácilmente. Basta con contar. El siguiente código tiene un único nivel de indentación:

```typescript
class MyClass {
    private aProperty: number

    doSomething(param) {
        if (param > 10) {
            return this.aProperty * param
        }

        return this.aProperty * param * 4
    }
}
```

Pero ya podemos ver dos en el siguiente, lo que nos dice que es más complejo que el anterior:

```typescript
class MyClass {
    private aProperty: number

    doSomething(param) {
        if (param > 10) {
            if (param > 20) {
                return this.aProperty * param / 3
            } else if (param > 15) {
                return this.aProperty * param / 2
            }
            return this.aProperty * param
        }

        return this.aProperty * param * 4
    }
}
```

El code smell "condicionales anidadas" es igualmente fácil de identificar en el código mostrado, pues se trata de otra forma de enunciar el mismo problema. De hecho, basta con mirar el margen izquierdo del código. El hecho de que tenga una forma de dientes de sierra nos está señalando el problema. Así que bastaría con un vistazo para identificar el riesgo
de tener alta complejidad.

La métrica a la que estas dos heurísticas sirven de _proxy_ es la Complejidad Ciclomática, de la que hablaremos seguidamente. Esta métrica cuantifica la complejidad de un código basándose en el conteo de posibles flujos de ejecución.

### Métricas

Frente a las heurísticas, las métricas nos proporcionan una cuantificación del rasgo o la característica en que estamos interesadas. Esta cuantificación, además, permite establecer umbrales para clasificar y nos permite comparar ejemplos de código entre sí, lo que nos habilita para priorizar esfuerzos.

De este modo, podemos definir umbrales para decidir si debemos intervenir o no en el código, clasificando los valores en distintas categorías. Por otro lado, podemos comparar partes del mismo software para decidir cuáles requieren de nuestra atención y priorizar las acciones que podamos planear.

## Complejidad Ciclomática

Esta métrica fue introducida por Thomas J. McCabe en 1976, en el artículo [A Complexity Measure](http://www.literateprogramming.com/mccabe.pdf)[^1]. Se trata de analizar el bloque de código como un grafo de control y contar sus aristas, nodos y componentes conectados. Es posible hacer una simplicación de la fórmula, que queda reducida a:

```
Cyclomatic Complexity = Number of conditonals + 1
```

[^1]: IEEE Transactions On Software Engineering, Vol. Se-2, No.4, December 1976

Por tanto, el método `doSomething` tendría una complejidad de 4: 3 condicionales + 1.

```typescript
class MyClass {
    private aProperty: number

    doSomething(param) {
        if (param > 10) {
            if (param > 20) {
                return this.aProperty * param / 3
            } else if (param > 15) {
                return this.aProperty * param / 2
            }
            return this.aProperty * param
        }

        return this.aProperty * param * 4
    }
}
```

### Pero, ¿qué nos indica la complejidad ciclomática?

Como te podrás imaginar, la complejidad ciclomática nos dice como de complejo es el flujo de control de un código. Cuanto más complejo, más esfuerzo tendremos que invertir para entenderlo, pero también para cambiarlo. El grado de complejidad se puede evaluar con esta tabla:

| Complejidad Ciclomática | Complejidad |
|-------------------------|-------------|
| 1-10                    | Baja        |
| 11-20                   | Media       |
| 21-50                   | Alta        |
| 50 o más                | Muy alta    |

En nuestro caso, la complejidad se mantiene todavía baja, pues no deja de ser un ejemplo bastante sencillo. Sin embargo, teniendo en cuenta la cantidad de líneas, podría justificarse intervenir en él.

Otro aspecto muy importante es que la complejidad ciclomática nos proporciona una cota mínima del número de tests que deberíamos escribir para cubrir todos los flujos. Decimos que es una cota mínima porque podríamos necesitar más tests para blindarnos ante mutaciones.

### Podemos reducir la complejidad basándonos en la métrica

Por supuesto. Precisamente al tener una métrica podemos comparar distintas versiones del mismo código y decidir la que nos conviene usar.

Pero vamos a empezar aplicando la heurística para reducir los niveles de indentación a 1.

```typescript
class MyClass {
    private aProperty: number

    doSomething(param) {
        if (param <= 10) {
            return this.aProperty * param * 4
        }
        if (param > 20) {
            return this.aProperty * param / 3
        }
        if (param > 15) {
            return this.aProperty * param / 2
        }
        return this.aProperty * param
    }
}
```

Esto mantiene la misma complejidad de 4 (3 condicionales + 1 retornos), lo que revela una limitación del índice de la que hablaremos luego. Pero nos ayuda al poner de manifiesto ciertos rasgos del código. En último término, nos dice que cada rama aplica un factor multiplicador diferente: 4, 1/3, 1/2 y 1.

```typescript
class MyClass {
    private aProperty: number

    doSomething(param) {
        let factor = 1
        if (param <= 10) {
            factor = 4
        }
        if (param > 20) {
            factor = 1 / 3
        }
        if (param > 15) {
            factor = 1 / 2
        }
        return this.aProperty * param * factor
    }
}
```

La complejidad ciclomática sigue siendo 4. No es mucho avance, pero pone de manifiesto una cierta incoherencia. Una de las condicionales usa el operador `<=`, mientras que las otras dos usan el operador `>`. ¿Qué pasa si intentamos hacer más similares todas las estructuras?

```typescript
class MyClass {
    private aProperty: number

    doSomething(param) {
        let factor = 4
        if (param > 20) {
            factor = 1 / 3
        }
        if (param > 15) {
            factor = 1 / 2
        }
        if (param > 10) {
            factor = 1
        }
        return this.aProperty * param * factor
    }
}
```

Mantenemos la complejidad en 4, ya que no hemos cambiado nada en el aspecto estructural. Pero ahora podemos ver un patrón y optar por otra aproximación distinta. Aquí tenemos una versión cuya complejidad ciclomática es 1.

```typescript
class MyClass {
    private aProperty: number
    private readonly MULTIPLIERS = [
        { threshold: 20, factor: 1/3 },
        { threshold: 15, factor: 1/2 },
        { threshold: 10, factor: 1   },
    ]

    doSomething(param: number): number {
        const { factor } = this.MULTIPLIERS.find(({ threshold }) => param > threshold)
        ?? { factor: 4 }
        return this.aProperty * param * factor
    }
}
```

Podríamos decir que:

* Las heurísticas nos permiten detectar áreas que necesitan refactoring
* Las métricas nos permiten cuantificar esa necesidad y priorizarla

Por otro lado, el refactoring no siempre va a suponer una mejora de la métrica, pero puede hacer que la complejidad medida sea más manejable. Los ejemplos intermedios nos dieron la misma complejidad, pero mejoró nuestra capacidad para manejar el código gracias a reducir la llamada Complejidad Cognitiva.

## Complejidad Cognitiva

Como acabamos de ver, la Complejidad Ciclomática no es sensible a la anidación de condicionales, por lo que obtenemos el mismo resultado ya sean estructuras anidades ya sean aplanadas a un solo nivel de indentación.

Las estructuras anidadas son más costosas de mantener y cambiar porque requieren mayor esfuerzo cognitivo. Cada vez que llegamos a una nueva rama tenemos que tomar nota del lugar a donde volver antes de tomar la rama. Si, una vez dentro, nos encontramos con una nueva bifurcación, debemos añadir un nuevo punto de regreso a nuestra "pila de memoria". Cuantos más elementos tengamos que mantener en la pila, porque estamos entrando en niveles profundos de anidación, más apuramos la capacidad de nuestra memoria de trabajo. En consecuencia, un bloque de condicionales anidadas supone un esfuerzo extra para comprenderlo.

Sin embargo, en la estructura aplanada, la pila siempre va a mantener un único elemento. El esfuerzo cognitivo no solo es menor, sino que se mantiene constante mientras procesamos el bloque de código.

Esto es lo que intenta capturar la métrica de la [Complejidad Cognitiva](https://www.sonarsource.com/resources/cognitive-complexity/), introducida por Ann Campbell en 2018[^2].

[^2]: Campbell, A. (2018). Cognitive Complexity: A new way of measuring understandability. SonarSource.

La métrica aplica tres reglas:

1. Penalización base (+1) por cada estructura que rompe el flujo lineal:
   * if, else if, else
   * Bucles: for, while, do while
   * switch
   * catch
   * Operadores lógicos encadenados (&&, \|\|)
   * Recursión
2. Penalización por anidamiento (+n) siendo n es el nivel de anidamiento en el que aparece la estructura. Cada nivel adicional suma un punto extra.
3. Sin penalización para estructuras que no añaden dificultad de lectura real, como else después de un return (que en la práctica no se ejecuta secuencialmente).

En nuestro ejemplo anterior, la complejidad cognitiva es 5.

```typescript
class MyClass {
    private aProperty: number

    doSomething(param) {
        if (param > 10) {
            if (param > 20) {
                return this.aProperty * param / 3
            } else if (param > 15) {
                return this.aProperty * param / 2
            }
            return this.aProperty * param
        }

        return this.aProperty * param * 4
    }
}
```

Veamos:

```
La condición param > 10: + 1, no tiene anidamiento        : +1
La condición param > 20: + 1, un otro 1 por anidamiento   : +2
La condición param > 15: + 1, un otro 1 por anidamiento   : +2
---------------------------------------------------------------
Total de Complejidad Cognitiva                            : +5
```

Sin embargo, el primer refactor que aplicamos para aplanar la estructura:


```typescript
class MyClass {
    private aProperty: number

    doSomething(param) {
        if (param <= 10) {
            return this.aProperty * param * 4
        }
        if (param > 20) {
            return this.aProperty * param / 3
        }
        if (param > 15) {
            return this.aProperty * param / 2
        }
        return this.aProperty * param
    }
}
```

Tiene una complejidad cognitiva de 3:

```
La condición param > 10: + 1, no tiene anidamiento        : +1
La condición param > 20: + 1, no tiene anidamiento        : +1
La condición param > 15: + 1, no tiene anidamiento        : +1
---------------------------------------------------------------
Total de Complejidad Cognitiva                            : +3
```

Lo que indicaría que es un refactor capaz de reducir la complejidad cognitiva y, por tanto, tiene sentido aplicarlo.

Ahora bien, estas dos métricas de complejidad nos hablan de la estructura de control del código, pero ese es solo un aspecto de su dificultad para su comprensión y su mantenimiento. Así, un código con una complejidad ciclomática o cognitiva bajas puede ser difícil de entender y mantener. Para medirlo necesitamos otro tipo de enfoque.

## Métricas de Halstead

Estas métricas fueron introducidas por Maurice H. Halstead en 1977[^3]. En lugar de fijarse en el flujo de control del código, Halstead se centró en la cantidad de símbolos que aparecen en el mismo, como una forma de valorar su dificultad de mantenimiento.

[^3]: Halstead, M.H. (1977). Elements of Software Science. Elsevier North-Holland. ISBN: 0-444-00205-3.

En ese sentido, sus métricas son complementarias a las de complejidad. De esta forma, podemos caracterizar código que tiene una baja complejidad de control, pero que resulta difícil de mantener.

Las métricas de Halstead son las siguientes.

* Básicas:
  * n1: Número de operadores distintos
  * n2: Número de operandos distintos
  * N1: Total de apariciones de operadores
  * N2: Total de apariciones de operandos
* Derivadas:
  * Vocabulario (Símbolos únicos usados): n = n1 + n2
  * Longitud (Tamaño total): N = N1 + N2
  * Volumen (Bits necesarios para representar el programa): V = N × log₂(n)
  * DificultadD (Propensión a errores al escribirlo o leerlo) = (n1/2) × (N2/n2)
  * Esfuerzo (Esfuerzo mental necesario para implementarlo): E = D × V
  * Tiempo (Tiempo estimado de implementación): T = E / 18[^4] (segundos)
  * Bugs estimados(Errores esperados en el código) B = V / 3000[^4]

[^4]: Los valores 18 y 3000 son parámetros empíricos obtenidos experimentalmente.

### Ejemplo de cálculo

Vamos a verlas aplicadas al ejemplo del artículo para que te hagas una idea de como se calculan:

```typescript
class MyClass {
    private aProperty: number

    doSomething(param) {
        if (param > 10) {
            if (param > 20) {
                return this.aProperty * param / 3
            } else if (param > 15) {
                return this.aProperty * param / 2
            }
            return this.aProperty * param
        }

        return this.aProperty * param * 4
    }
}
```

| Operador | Apariciones |
|----------|:-----------:|
| `if`     |      3      |
| `else`   |      1      |
| `return` |      4      |
| `>`      |      3      |
| `*`      |      4      |
| `/`      |      2      |
| `.`      |      4      |
| `()`     |      1      |
| `{}`     |      4      |

**n1 = 9** operadores distintos, **N1 = 26** apariciones totales

| Operando    | Apariciones |
|-------------|:-----------:|
| `param`     |      7      |
| `this`      |      4      |
| `aProperty` |      4      |
| `10`        |      1      |
| `20`        |      1      |
| `15`        |      1      |
| `3`         |      1      |
| `2`         |      1      |
| `4`         |      1      |

**n2 = 9** operandos distintos, **N2 = 21** apariciones totales

| Métrica        | Fórmula            |  Resultado  |
|----------------|--------------------|:-----------:|
| Vocabulario    | n = 9 + 9          |   **18**    |
| Longitud       | N = 26 + 21        |   **47**    |
| Volumen        | V = 47 × log₂(18)  |  **196,3**  |
| Dificultad     | D = (9/2) × (21/9) |  **10,5**   |
| Esfuerzo       | E = 10,5 × 196,3   |  **2.061**  |
| Tiempo         | T = 2.061 / 18     | **114 seg** |
| Bugs estimados | B = 196,3 / 3000   |  **0,065**  |

Halstead no definió umbrales ni una clasificación del código basada en estas métricas. Por tanto, no podemos decir una función es compleja o muy compleja. Las métricas nos sirven de forma relativa. Podemos medir un código antes y después de un refactor para saber si merece la pena el esfuerzo, o podemos comparar implementaciones entre sí.

Otros autores han sugerido umbrales, pero no son estándares. Del trabajo de Halstead sí que se podrían derivar un par de valores interesantes:

* V < 20: función probablemente demasiado simple, puede que trivial.
* V > 1000: función probablemente demasiado compleja para entenderse como unidad, seguramente se beneficiará de un refactor.
* B: es una estimación estadística basada en estudios empíricos.

Como indicábamos antes, las métricas de Halstead son independientes de las métricas de complejidad, por lo que una unidad de código con muy baja complejidad ciclomática podría tener unas métricas de Halstead muy altas, o viceversa. El ejemplo que hemos estado usando en el artículo es un caso de complejidad alta (para la cantidad de código), pero que es bastante sencillo para estas otras métricas.

Un ejemplo del caso contrario sería un código que tenga este aspecto. Contiene muchos operadores y operandos, pero su complejidad ciclomática es la mínima: 1. Como podemos ver, es difícil de entender y mantener.

```typescript
function processData(a: number, b: number, c: number, d: number): number {
    const x = (a * b) + (c / d)
    const y = (a - c) * (b + d)
    const z = (x * y) - (a / b) + (c * d)
    const w = (z / x) + (y - a) * (b / c)
    return ((x + y) * (z - w)) / (a * b * c * d)
}
```

Estas son las métricas de esta función, fíjate como el Volumen (V) es bastante alto siendo una función de 5 líneas sin condicionales.

| Métrica        | Valor |
|----------------|-------|
| n1             | 9     |
| n2             | 9     |
| N1             | 26    |
| N2             | 34    |
| Vocabulary (n) | 18    |
| Length (N)     | 60    |
| Volume (V)     | ~250  |


¿Recuerdas el refactor que nos permitió reducir a 1 la complejidad del ejemplo original?

```typescript
class MyClass {
    private aProperty: number
    private readonly MULTIPLIERS = [
        { threshold: 20, factor: 1/3 },
        { threshold: 15, factor: 1/2 },
        { threshold: 10, factor: 1   },
    ]

    doSomething(param: number): number {
        const { factor } = this.MULTIPLIERS.find(({ threshold }) => param > threshold)
        ?? { factor: 4 }
        return this.aProperty * param * factor
    }
}
```

Calculemos sus métricas Halstead:

La cuenta de operadores:

| Operador | Apariciones |
|----------|:-----------:|
| `const`  |      1      |
| `=`      |      1      |
| `{}`     |      2      |
| `.`      |      2      |
| `()`     |      2      |
| `=>`     |      1      |
| `>`      |      1      |
| `??`     |      1      |
| `return` |      1      |
| `*`      |      2      |

**n1 = 10** operadores distintos, **N1 = 14** apariciones totales

La cuenta de operandos:

| Operando      | Apariciones |
|---------------|:-----------:|
| `factor`      |      3      |
| `this`        |      2      |
| `MULTIPLIERS` |      1      |
| `find`        |      1      |
| `threshold`   |      2      |
| `param`       |      2      |
| `4`           |      1      |
| `aProperty`   |      1      |


**n2 = 8** operandos distintos, **N2 = 13** apariciones totales

Las métricas derivadas:

| Métrica        | Fórmula             |  Resultado   |
|----------------|---------------------|:------------:|
| Vocabulario    | n = 10 + 8          |    **18**    |
| Longitud       | N = 14 + 13         |    **27**    |
| Volumen        | V = 27 × log₂(18)   |  **112,8**   |
| Dificultad     | D = (10/2) × (13/8) |   **8,1**    |
| Esfuerzo       | E = 8,1 × 112,8     |  **913,7**   |
| Tiempo         | T = 913,7 / 18      | **50,8 seg** |
| Bugs estimados | B = 112,8 / 3000    |  **0,038**   |

Y aquí comparamos las métricas de la versión original con la nueva. Fíjate que el refactor no solo ha mejorado las métricas de complejidad, sino que también ha logrado una mejora sustancial en estos índices, convirtiéndolo en un refactor particularmente bien fundamentado.

| Métrica        | Original | Refactor (tabla) |  Δ   |
|----------------|:--------:|:----------------:|:----:|
| Volumen (V)    |  196,3   |      112,8       | −42% |
| Dificultad (D) |   10,5   |       8,1        | −23% |
| Esfuerzo (E)   |  2.061   |      913,7       | −56% |
| Tiempo (seg)   |   114    |       50,8       | −56% |
| Bugs estimados |  0,065   |      0,038       | −42% |

## Métricas de tamaño

Si contamos las líneas de código, podemos obtener estas tres medidas:

* LOC físico: líneas totales incluyendo comentarios y líneas en blanco.
* LOC lógico: sentencias ejecutables únicamente.
* CLOC: solo líneas de comentarios.

Las métricas de tamaño nos pueden ayudar a poner otras métricas en contexto. Así, una unidad de código pequeña (LOC lógico bajo) probablemente no tenga una complejidad muy alta en valor absoluto, pero la perspectiva cambia si ponemos en relación esa complejidad con el número de líneas.

En cualquier caso, un número muy alto de líneas de código suele ser indicativo de que se están asumiendo muchas responsabilidades y, seguramente, niveles de abstracción. Esa unidad de código está intentando hacer muchas cosas. 

En consecuencia, deberíamos plantearnos un refactor dividiendo la unidad en partes más pequeñas y cohesivas. Por ejemplo, si se trata de un método largo, una posibilidad sería juntar grupos de líneas que sean cohesivas entre sí y extraerlas juntas a método con un nombre descriptivo.

De este modo repartimos la métrica de LOC en varios métodos con LOC manejables.

## Métricas orientadas a objetos

Estas métricas nacen de la crítica a las anteriores, consideradas demasiado procedimentales por Chidamber & Kemerer[^5]. Según estos autores, serían necesarias métricas específicas capaces de capturar elementos como herencia, encapsulación, polimorfismo y paso de mensajes.

[^5]: Chidamber, S. R., & Kemerer, C. F. (1994). A metrics suite for object oriented design. IEEE Transactions on Software Engineering, 20(6), 476–493.

Las seis métricas, denominadas a veces como métricas CK por las iniciales de sus autores, son:

* WMC (Weighted Methods per Class): suma de la complejidad ciclomática de los métodos de una clase. Si es alto es que probablemente la clase hace demasiadas cosas.
* DIT (Depth of Inheritance Tree): Profundidad en la jerarquía de herencia. Si es alto la herencia es excesiva.
* NOC (Number of Children): Números de clases directas de una clase base. Si es alto, indica que la abstracción es demasiado genérica.
* CBO (Coupling Between Objects): Clases de las que depende esta clase. Si es alto indica un acoplamiento excesivo
* RFC (Response For a Class): Métodos que pueden ejecutarse ante un mensaje. Si es alto, indicaría un comportamiento impredecible
* LCOM (Lack of Cohesion in Methods): Cuánto comparten estado los métodos de una clase. Si es alto, la clase es candidata a dividirse

Vamos a verlas con un poco más de detalle, aplicándolas al caso de este OrderService, creado a propósito para mostrar problemas:

```typescript
class OrderService {
    private db: Database
    private emailClient: EmailClient
    private paymentGateway: PaymentGateway
    private inventoryService: InventoryService
    private logger: Logger
    private cache: Cache

    // RFC: cada método público encadena llamadas a dependencias externas
    // CBO: depende de 6 clases distintas

    processOrder(order: Order, user: User): boolean {
        // WMC sube: lógica compleja en cada método
        if (!order || !user) return false
        if (order.items.length === 0) return false

        const cached = this.cache.get(order.id)
        if (cached) return cached

        const payment = this.paymentGateway.charge(user.card, order.total)
        if (!payment.success) {
            this.logger.error('Payment failed', order.id)
            this.emailClient.send(user.email, 'payment-failed')
            return false
        }

        for (const item of order.items) {
            this.inventoryService.decrement(item.id, item.quantity)
        }

        this.db.save(order)
        this.emailClient.send(user.email, 'order-confirmed')
        this.logger.info('Order processed', order.id)
        this.cache.set(order.id, true)
        return true
    }

    cancelOrder(orderId: string, user: User): boolean {
        // LCOM: opera sobre db, emailClient, logger, cache
        // pero no sobre paymentGateway ni inventoryService
        const order = this.db.find(orderId)
        if (!order) return false
        if (order.userId !== user.id) return false

        this.db.delete(orderId)
        this.cache.invalidate(orderId)
        this.emailClient.send(user.email, 'order-cancelled')
        this.logger.info('Order cancelled', orderId)
        return true
    }

    refundOrder(orderId: string, user: User): boolean {
        // LCOM: opera sobre paymentGateway, emailClient, logger
        // pero no sobre inventoryService ni cache
        const order = this.db.find(orderId)
        if (!order) return false

        const refund = this.paymentGateway.refund(user.card, order.total)
        if (!refund.success) {
            this.logger.error('Refund failed', orderId)
            return false
        }

        this.emailClient.send(user.email, 'order-refunded')
        this.logger.info('Order refunded', orderId)
        return true
    }
}
```

### WMC — Weighted Methods per Class

Se define como suma de las complejidades ciclomáticas de todos los métodos de una clase. Si se asume CC = 1 para todos los métodos, WMC equivale simplemente al número de métodos.
   
Fórmula: WMC = Σ CC(mᵢ)

El WMC alto (>50) nos dice que la clase tiene mucha lógica, probablemente viola el principio de responsabilidad única. También predice el tiempo de desarrollo y mantenimiento: a más WMC, más tiempo cuesta entender y modificar la clase. Un valor entre 20 y 50 indica que deberíamos echarle un vistazo.

```
processOrder : CC = 6  (4 if + 1 for + 1 base)
cancelOrder  : CC = 3  (2 if + 1 base)
refundOrder  : CC = 3  (2 if + 1 base)
─────────────────────────────────────
WMC = 12
```

Se trata de un valor reducido, pero es fácil ver que una clase con muchos métodos lo haría escalar rápidamente.

### DIT — Depth of Inheritance Tree
   
Es la longitud del camino más largo desde la clase hasta la raíz de la jerarquía de herencia. Si es alto, nos está diciendo que la clase hereda comportamiento de muchos ancestros, lo que dificulta predecir su comportamiento completo.

En cambio, si es bajo puede indicar que no se está aprovechando la reutilización por herencia. El punto óptimo estaría entre 2 y 5.

### NOC — Number of Children
   
Es el número de subclases directas de una clase. Si es muy alto, nos señala que la abstracción es muy general y se reutiliza mucho, lo que puede ser bueno (reutilización) o malo (la clase base es demasiado genérica y frágil).

NOC bajo con DIT alto es señal de una jerarquía larga, pero estrecha (sobre-ingeniería). En general, buscamos jerarquías cortas (DIT bajo) y relativamente anchas (NOC medio).

### CBO — Coupling Between Object Classes

Cuenta el número de clases a las que está acoplada esta clase, es decir, clases que usa o de las que depende (excluyendo la herencia).

Si el CBO es alto (>14, pero hay que verlo en el conjunto del proyecto), nos dice que la clase es difícil de reutilizar en otro contexto y frágil ante cambios en sus dependencias.

Cuando CBO es bajo, tenemos una clase más independiente y testeable.

Es la métrica más directamente relacionada con el principio de inversión de dependencias.

En nuestro ejemplo, las dependencias de `OrderService` son: 

* `Database`
* `EmailClient`
* `PaymentGateway`
* `InventoryService`
* `Logger`
* `Cache`

**CBO = 6**

Esto nos da un CBO de 6, que para una clase pequeña es bastante alto. Un cambio en la interfaz de alguna de las dependencias nos obligará a tocar `OrderService`. Es decir: tenemos hasta seis posibles razones de cambio solo por las dependencias.

### RFC — Response For a Class

El número de métodos que pueden ejecutarse en respuesta a un mensaje recibido por un objeto de la clase. Incluye los métodos propios de la clase más todos los métodos externos que estos invocan directamente.

Fórmula: RFC = \|RS\|, donde RS es el conjunto de respuesta (métodos propios + métodos llamados). 

Si RFC es alto, sería señal de que el comportamiento de la clase es difícil de predecir y testear, porque una sola llamada puede desencadenar una cadena larga de ejecución. Es especialmente útil para estimar el esfuerzo de testing: a más RFC, más casos de prueba necesarios.

Vamos a aplicarla al caso de `OrderService`.

* Métodos propios: processOrder, cancelOrder, refundOrder (total: 3)
* Métodos externos invocados: cache.get, paymentGateway.charge, logger.error, emailClient.send, inventoryService.decrement, db.save, cache.set, db.find, db.delete, cache.invalidate, paymentGateway.refund (total: 11)

**RFC = 3 + 11 = 14**

Cualquier test de `processOrder` puede desencadenar hasta 8 llamadas externas, lo que dificulta enormemente escribir tests que no hagan uso de dobles.

### LCOM — Lack of Cohesion in Methods
   
Definición: número de pares de métodos que no comparten ninguna variable de instancia, menos el número de pares que sí comparten al menos una. Si el resultado es negativo, se toma como 0.

Fórmula: LCOM = max(0, \|P\| - \|Q\|)

Siendo:

* P: pares de métodos sin variables de instancia en común
* Q: pares de métodos con al menos una variable de instancia en común

Un LCOM alto, nos dice que los métodos de la clase operan sobre datos distintos y no están relacionados entre sí. La clase es candidata a dividirse en dos o más.

Si el LCOM es 0, sería un caso de cohesión perfecta, todos los métodos trabajan sobre los mismos datos.

LCOM es la métrica más criticada de las seis porque la fórmula original tiene anomalías al poder dar valores negativos, por lo que necesita la corrección `max(0,...)`. Existen variantes posteriores que corrigen estos problemas.

Para nuestro ejemplo, veamos una tabla de las variables de instancia usadas (que en este caso coinciden con las dependencias)

|                  | db | emailClient | paymentGateway | inventoryService | logger | cache | 
|------------------|:--:|:-----------:|:--------------:|:----------------:|:------:|:-----:|
| processOrder     | ✓  |      ✓      |       ✓        |        ✓         |   ✓    |   ✓   |
| cancelOrder      | ✓  |      ✓      |       —        |        —         |   ✓    |   ✓   | 
| refundOrder      | ✓  |      ✓      |       ✓        |        —         |   ✓    |   —   |
| methods per attr | 3  |      3      |       2        |        1         |   3    |   2   |

Pares de métodos:

* processOrder / cancelOrder: comparten db, emailClient, logger, cache → Q
* processOrder / refundOrder: comparten db, emailClient, paymentGateway, logger → Q
* cancelOrder / refundOrder: comparten db, emailClient, logger → Q

Como todos los pares de métodos comparten al menos una variable:
* P = 0
* Q = 3

**LCOM = max(0, 0 - 3) = 0**

Esto nos dice que la clase es bastante cohesiva, pero también expone las limitaciones de la métrica.

#### LCOM3, alternativa a LCOM

Brian Henderson-Sellers propuso en 1996 una nueva versión de LCOM que se conoce como LCOM-HS (o también LCOM3)[^8][^9]. Esta nueva métrica se propone superar las limitaciones de LCOM y obtener un resultado más preciso e interpretable, comparable entre clases y con un buen fundamento matemático. 

[^8]: Henderson-Sellers, B.; Constantine, L.; Graham, I. Coupling and Cohesion (Towards a Valid Metrics Suite for Object-Oriented Analysis and Design). Object-Oriented Systems, vol. 3(3), pp.143–158, 1996.

[^9]: Henderson-Sellers, B. Object-Oriented Metrics: Measures of Complexity. Prentice Hall, 1996.

La fórmula original de LCOM-HS es la siguiente:

```
LCOM_HS = (m - avg_methods_per_attribute) / (m - 1)
```

Esto nos daría un valor entre 0 y 1, siendo 0 alta cohesión (bueno) y 1 baja cohesión (indicativo de que la clase se podría dividir)

Aplicada a nuestro ejemplo:

La clase tiene 6 atributos (o variables de instancia) y 3 métodos.

En la tabla de arriba tenemos la cantidad de métodos que usa cada uno de los atributos. La suma es 3+3+2+1+3+2=14, y la media es 14/6 ≈ 2.333.

* a = 6
* m = 3
* avg_methods_per_attribute = 2.333

Por tanto, la métrica es:

```
LCOM_HS = (3 - 14/6) / (3 - 1) = (3 - 2.333) / 2 = 0.333
```

Esto indica una cohesión bastante buena, pero hay que tener en cuenta que algunos atributos no se usan en todos los métodos (es el caso de `inventoryService`) y esto podría darnos una indicación para promover algún tipo de separación de la clase.


## Índice de mantenibilidad (MI)

Esta métrica agrega otras para producir un valor único que permita caracterizar la dificultad de mantener un código. Fue propuesta por Paul Oman y Jack Hagemeister en 1992[^6] (revisada en 1994[^7]) obtenida empíricamente del análisis de diversos proyectos de software, cuya mantenibilidad fue evaluada por expertos. 

[^6]: Oman, P., & Hagemeister, J. (1992). Metrics for assessing a software system's maintainability. Proceedings of the International Conference on Software Maintenance (ICSM), 337–344. IEEE.

[^7]: Oman, P., & Hagemeister, J. (1994). Construction and testing of polynomials predicting software maintainability. Journal of Systems and Software, 26(3), 251–266.

Precisamente por eso, es bastante controvertida. Se alega que mezcla métricas no comparables (como Complejidad Ciclomática y Volumen de Halstead), así como que está basada en sistemas C y FORTRAN por lo que su aplicabilidad a lenguajes modernos sería cuestionable.

La fórmula original de MI es la siguiente:

MI = 171 - 5.2 × ln(V) - 0.23 × CC - 16.2 × ln(LOC)

Siendo:

* V: volumen de Halstead
* CC: complejidad ciclomática de McCabe
* LOC: son las líneas de código lógicas

Las constantes de la fórmula han sido derivadas de forma empírica.

Microsoft ha incluido una variante del Índice de Mantenibilidad en Visual Studio 2019, que normaliza los valores en el rango de 0 a 100, lo que hace más fácil interpretarlos:

MI_VS = max(0, (171 - 5.2 × ln(V) - 0.23 × CC - 16.2 × ln(LOC)) × 100 / 171)

La clasificación es:

* 20–100: Mantenible (Verde)
* 10–19: Mantenibilidad moderada (Amarillo)
* 0–9: Difícil de mantener (Rojo)

## Una visión panorámica

Las métricas para medir la complejidad, calidad o mantenibilidad del código nos proporcionan visiones parciales, por lo que necesitamos combinar diversas medidas para obtener una visión más completa y tomar decisiones de refactoring basadas en ellas.

La siguiente tabla recoge un resumen de todas las métricas que hemos examinado en el artículo, con una indicación de qué mide cada una y qué tipo de refactoring podríamos abordar en caso de obtener un valor desfavorable. 

| Métrica                       | Qué mide                             |     Nivel     | Señal de refactor                            | Umbral orientativo |
|-------------------------------|--------------------------------------|:-------------:|----------------------------------------------|:------------------:|
| **Complejidad Ciclomática**   | Caminos de ejecución independientes  |    Función    | Extraer métodos, simplificar lógica          |        > 10        |
| **Complejidad Cognitiva**     | Esfuerzo mental de lectura           |    Función    | Reducir anidamiento, aplanar estructura      |        > 15        |
| **Volumen (Halstead)**        | Cantidad de información del programa |    Función    | Simplificar expresiones, renombrar           |       > 1000       |
| **Dificultad (Halstead)**     | Propensión a errores                 |    Función    | Reducir variedad de operadores y operandos   |        > 10        |
| **Esfuerzo (Halstead)**       | Carga mental de implementación       |    Función    | Comparativo entre versiones                  |         —          |
| **Bugs estimados (Halstead)** | Errores esperados estadísticamente   |    Función    | Comparativo entre versiones                  |         —          |
| **LOC**                       | Tamaño físico                        | Función/Clase | Extraer métodos o clases                     |  > 200 (función)   |
| **WMC**                       | Lógica total de la clase             |     Clase     | Dividir clase, mover responsabilidades       |        > 50        |
| **DIT**                       | Profundidad de herencia              |   Jerarquía   | Aplanar herencia, preferir composición       |        > 5         |
| **NOC**                       | Amplitud de herencia                 |   Jerarquía   | Revisar abstracción de clase base            |        > 10        |
| **CBO**                       | Acoplamiento con otras clases        |     Clase     | Reducir dependencias, introducir interfaces  |        > 14        |
| **RFC**                       | Alcance de ejecución ante un mensaje |     Clase     | Reducir responsabilidades, extraer servicios |        > 50        |
| **LCOM**                      | Cohesión interna de la clase         |     Clase     | Dividir clase                                |        > 5         |
| **LCOM-HS**                   | Cohesión interna de la clase         |     Clase     | Dividir clase                                |     tiende a 1     |
| **MI**                        | Mantenibilidad agregada              |    Módulo     | Priorizar qué refactorizar primero           |     < 20 (VS)      |

## Herramientas

He recopilado esta tabla resumen con herramientas con las que obtener y analizar estas métricas para algunos lenguajes habituales.

| Herramienta   | TS | PHP | Java | Go | C# | Nivel        |
|---------------|----|-----|------|----|----|--------------|
| SonarQube     | ✓  | ✓   | ✓    | ✓  | ✓  | Enterprise   |
| ESLint        | ✓  | –   | –    | –  | –  | Ligero       |
| PhpMetrics    | –  | ✓   | –    | –  | –  | OO PHP       |
| CK            | –  | –   | ✓    | –  | –  | Académico    |
| PMD           | –  | –   | ✓    | –  | –  | Java clásico |
| golangci-lint | –  | –   | –    | ✓  | –  | Go estándar  |
| NDepend       | –  | –   | –    | –  | ✓  | Muy profundo |
| VS Metrics    | –  | –   | –    | –  | ✓  | Integrado    |

SonarQube es un habitual de nuestros _pipelines_ de integración continua, pero a veces querríamos tener la herramienta más a mano, para que nos ayude a tomar decisiones de refactoring cuando estamos abordando problemas de mantenibilidad. Cierto es que SonarQube se puede integrar en algunos IDE, con lo que tienes su información en el propio código.

### LLM en tu ayuda

Aparte de lo anterior, a veces nos vendría bien no solo tener la métrica, sino una evaluación del problema con el que estemos trabajando más allá de las indicaciones genéricas. Y para eso, la utilización de un asistente de código puede ser una gran alternativa.

En mi caso, he preparado una _skill_ para Claude que utiliza una batería de métricas para proponer tres refactors de alto impacto en el código que le pido analizar. Tras hacer el análisis y mostrar las métricas obtenidas, sugiere tres acciones valorando su impacto en la complejidad y mantenibilidad. Con las métricas y ese diagnóstico puedo analizar si me interesa aplicar ese refactor y justificar la inversión de tiempo y esfuerzo.

He utilizado al propio Claude para desarrollar la skill. Para ello, le proporcioné un guion que se puede resumir así:

* Esta skill tiene como objetivo utilizar métricas estándares de la industria para proponer refactors aplicables a una unidad de código.
* Se analizará la unidad de código indicada
* Las métricas utilizadas serán:
  * Complejidad cognitiva (más sensible que la complejidad ciclomática)
  * Métricas de Halsted (complementa la métrica de complejidad)
  * Índice de Mantenibilidad (puede actuar como _canary test_ para señalar unidades potencialmente problemáticas)
  * Métricas CK orientadas a objetos (para analizar las relaciones de la unidad examinada con el resto del código)
* Se quiere un resumen de estas métricas y una valoración fundamentada brevemente
* El resultado de la skill serán tres propuestas de refactor ordenadas de mayor a menor impacto, explicadas
* No incluyas refactors que no tengan un impacto significativo
* No escribas nada de código, yo te indicaré qué refactors aplicar
* Si la unidad de código no cuenta con suficientes tests, indícalo y haz una propuesta

## Concluyendo

Como se puede desprender del artículo, las heurísticas y las métricas de complejidad del software resultan muy útiles para tomar decisiones sobre refactoring encaminado a mejorar su estructura y mantenibilidad de cara al futuro.

Un código fácil de entender y mantener es crucial para poder introducir cambios, nuevas prestaciones e incluso para corregir errores de forma rápida y eficaz. No debemos olvidar que, en la mayoría de los casos, el desarrollo de software es un coste de la empresa y debemos aprender a mantener ese coste bajo control.

Las heurísticas, como las _reglas de calistenia_ o los _code smells_, nos señalan los puntos donde nuestro código puede tener oportunidades de mejora, actuando muchas veces como _proxies_ de las métricas. Pero son las métricas las que nos permiten cuantificarlo y, por tanto, comparar y priorizar la necesidad de intervenir en el código.

El refactoring dirigido por métricas se convierte así en una práctica de ingeniería de software fundamentada en evidencias.


