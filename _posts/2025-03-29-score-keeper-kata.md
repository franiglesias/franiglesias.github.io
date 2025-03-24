---
layout: post
title: Lecciones aprendidas del patrón observer
categories: articles
tags: software-design design-patterns typescript
---

En una de las últimas sesiones del Coding Dojo de CraftersVigo propusimos la kata ScoreKeeper, un ejercicio aparentemente trivial, pero al que añadimos la propuesta de usar el patrón _Observer_.

Los ejercicios de código son herramientas poderosas de aprendizaje. Al no tener las presiones de un proyecto real, podemos explorar soluciones que, de otra forma, podrían conllevar un nivel de riesgo poco aceptable. Por otro, lado, el hecho de que los problemas que buscamos solucionar en estos ejercicios sean bastante sencillos, nos dejan explorar los básicos de los patrones que queremos aprender. Gracias a esto, nos podemos preparar mejor para aplicarlos en situaciones más complejas.

Debo confesar que propuse la introducción del patrón _observer_ en este ejercicio sin un motivo especial. Me explico. El ejercicio consiste en programar un sistema de marcador para un partido de baloncesto, de tal modo que habrá un método para cada posible canasta de cada equipo: tiro libre (1 punto), canasta normal (2 puntos) y triple (3 puntos). En total, seis métodos. Además, un método extra para obtener el marcador actual con un formato concreto. Es un ejercicio muy sencillo, por lo ue me pareció adecuado añadirle algunos requisitos más para poder estirarlo y hacerlo más atractivo.

## El patrón _observer_

Supongo que la idea del patrón _observer_ me vino a la mente por esto último, ya que sería concebible aislar el sistema de marcador de lo que podríamos llamar lógica de negocio de la cuenta de puntos. El patrón _observer_ es una elección bastante obvia, porque justamente resuelve el problema de la comunicación entre dos partes de un sistema que no deberían conocerse entre sí. Por otro lado, es una buena introducción al tema de los eventos y la programación reactiva.

La programación orientada a objetos consiste fundamentalmente en **la colaboración entre objetos mediante el paso de mensajes**. Los objetos pueden saber a qué otros objetos dirigirse y de qué modo hacerlo para contribuir a una tarea, sin tener ni idea de cómo lo hacen.

En nuestro ejemplo, tendremos un _ScoreKeeper_ que sabe tomar nota de los puntos que se anotan en un partido de baloncesto y llevar la cuenta del resultado, y de un _ScoreDisplay_, que sabe mostrar el marcador en un formato concreto. A ninguno de ellos le interesa saber cómo trabaja el otro internamente, pero necesitan comunicarse. Pero, en nuestro caso, _ScoreDisplay_ tiene que saber cuando debe actualizarse el marcador, que obviamente es cuando se anota cada canasta y eso es algo que ocurre frecuentemente en un partido. Podríamos decir que _ScoreDisplay_ debe ser capaz de reaccionar a los cambios de _ScoreKeeper_.

Este tipo de comunicación puede hacerse de distintas formas. _ScoreDisplay_ podría consultar con cierta frecuencia a _ScoreKeeper_ para saber si ha habido cambios, algo que sería ineficiente y poco elegante. Otra opción sería que _ScoreKeeper_ notificase a _ScoreDisplay_ cada vez que se anota una canasta. Esta es la idea detrás del patrón _observer_.

La primera opción es lo que solemos llamar _pull_, porque _ScoreDisplay_ "tira" de _ScoreKeeper_ para obtener la información que necesita. La segunda opción es lo que llamamos _push_, porque _ScoreKeeper_ "empuja" la información a _ScoreDisplay_. 

Esta solución es mejor en nuestro caso por varias razones. En primer lugar, refleja mejor la realidad. _ScoreKeeper_ detecta un cambio en el entorno (se ha conseguido una canasta) e informa a _ScoreDisplay_ de lo que ha ocurrido y de los nuevos valores que tiene que mostrar, de forma que el público puede seguir en tiempo real y con todo detalle la evolución del partido. En segundo lugar, no requiere un sistema de _polling_, haciendo que _ScoreDisplay_ consulte repetidamente el estado de _ScoreKeeper_, lo que es poco eficiente debido a que habrá muchas ocasiones en las que aún no haya habido nuevos puntos. Y, en otros casos, entre consulta y consulta podrían haberse producido varios cambios, dejando _ScoreDisplay_ de estar actualizado y generando una inconsistencia eventual que haría difícil entender lo que pasa en el campo de juego.
 
El patrón _observer_ es un precursor de lo que consideramos un sistema de eventos. Pese a que hay muchas diferencias, los aspectos similares son suficientes para permitirnos entender como funcionan los eventos en un sistema de software. Y, además, no deja de ser útil, per se, para solucionar diversos problemas de comunicación entre objetos.

## Los elementos del patrón _observer_

Básicamente, el patrón _observer_ consta de los siguientes elementos:

* El elemento observado o _subject_, que es el objeto cuyos cambios queremos que sean notificados a otros objetos.
* Los observadores u _observers_, que son objetos que quieren ser notificados de los cambios del _subject_. Puede haber varios observadores, que realicen distintas acciones en respuesta a lo que ocurre en el _subject_, o que estén interesados en eventos distintos, repartiéndose distintas responsabilidades entre los distintos observadores.
* Un método de registro, que permite a los observadores suscribirse al _subject_ para recibir notificaciones. Es la forma en que podemos inyectar al observador en el _subject_. El método de registro está en el _subject_, permitiendo a los observadores comunicarle su interés en recibir notificaciones.
* El método de notificación, que debe tener el _subject_ llama para informar a los observadores de los cambios que se han producido. Es el método que hace el _push_ de la información a los observadores. Este método, o métodos, es invocado por el _subject_ en el momento en que se produce un cambio en su estado interno.

En general, la implementación es muy sencilla. En el _subject_, definimos una lista de observadores y un método para registrarlos. Cada vez que queremos difundir alguna notificación, recorremos la lista de observadores y les enviamos el mensaje de notificación.

En los observadores, solo tenemos que crear el método o métodos que son notificados, que deben poder recibir la información publicada por el observador y hacer lo que sea que deseen hacer con ella.

## Veamos un ejemplo

La versión simple de la kata nos pide escribir un `ScoreKeeper` con métodos para introducir los puntos por cada canasta y mostrar el resultado formateado, así que vamos a empezar desde ese punto. Para introducir un poco de lenguaje de dominio he llamado al equipo A, local, y al B, visitante. Es muy simple en realidad:

```typescript
class ScoreKeeper {
    private local = 0
    private visitor = 0

    getScore(): string {
        const l = this.local.toString().padStart(3, "0")
        const v = this.visitor.toString().padStart(3, "0")
        return `${l}:${v}`
    }

    scoreTeamA1() {
        this.local = this.local + 1
    }

    scoreTeamA2() {
        this.local = this.local + 2
    }

    scoreTeamA3() {
        this.local = this.local + 3
    }

    scoreTeamB1() {
        this.visitor = this.visitor + 1
    }

    scoreTeamB2() {
        this.visitor = this.visitor + 2
    }

    scoreTeamB3() {
        this.visitor = this.visitor + 3
    }
}
```

Los tests que he usado para generar este código son:

```typescript
describe("ScoreKeeper", () => {
    it("should display the initial score", () => {
        const scoreKeeper = new ScoreKeeper()
        expect(scoreKeeper.getScore()).toBe("000:000")
    })

    it("should display the score after team A scores 1 point", () => {
        const scoreKeeper = new ScoreKeeper()
        scoreKeeper.scoreTeamA1()
        expect(scoreKeeper.getScore()).toBe("001:000")
    })

    it("should display the score after team A scores 2 points", () => {
        const scoreKeeper = new ScoreKeeper()
        scoreKeeper.scoreTeamA2()
        expect(scoreKeeper.getScore()).toBe("002:000")
    })

    it("should display the score after team A scores 3 points", () => {
        const scoreKeeper = new ScoreKeeper()
        scoreKeeper.scoreTeamA3()
        expect(scoreKeeper.getScore()).toBe("003:000")
    })

    it("should display the score after team B scores 1 point", () => {
        const scoreKeeper = new ScoreKeeper()
        scoreKeeper.scoreTeamB1()
        expect(scoreKeeper.getScore()).toBe("000:001")
    })

    it("should display the score after team B scores 2 points", () => {
        const scoreKeeper = new ScoreKeeper()
        scoreKeeper.scoreTeamB2()
        expect(scoreKeeper.getScore()).toBe("000:002")
    })

    it("should display the score after team B scores 3 points", () => {
        const scoreKeeper = new ScoreKeeper()
        scoreKeeper.scoreTeamB3()
        expect(scoreKeeper.getScore()).toBe("000:003")
    })

    it("should display the score after several plays", () => {
        const scoreKeeper = new ScoreKeeper()
        scoreKeeper.scoreTeamA1()
        scoreKeeper.scoreTeamB1()
        scoreKeeper.scoreTeamA2()
        scoreKeeper.scoreTeamB2()
        scoreKeeper.scoreTeamA3()
        scoreKeeper.scoreTeamB3()
        expect(scoreKeeper.getScore()).toBe("006:006")
    })
})
```

Voy a hacer un refactor del test para que sea más fácil introducir los cambios necesarios. Se trata de tener un único punto para inicializar `ScoreKeeper`, y un único lugar para hacer la aserción sobre el resultado. De este modo, puesto que nos tocará cambiar la estructura del código, solo tendremos que tocar esos dos lugares en el test.

```typescript
describe("ScoreKeeper", () => {
    let scoreKeeper = new ScoreKeeper()

    function startScoreKeeper() {
        scoreKeeper = new ScoreKeeper()
    }

    function expectResultToBe(expectedResult: string) {
        expect(scoreKeeper.getScore()).toBe(expectedResult)
    }

    it("should display the initial score", () => {
        startScoreKeeper()
        expectResultToBe("000:000")
    })

    it("should display the score after team A scores 1 point", () => {
        startScoreKeeper()
        scoreKeeper.scoreTeamA1()
        expectResultToBe("001:000")
    })

    it("should display the score after team A scores 2 points", () => {
        startScoreKeeper()
        scoreKeeper.scoreTeamA2()
        expectResultToBe("002:000")
    })

    it("should display the score after team A scores 3 points", () => {
        startScoreKeeper()
        scoreKeeper.scoreTeamA3()
        expectResultToBe("003:000")
    })

    it("should display the score after team B scores 1 point", () => {
        startScoreKeeper()
        scoreKeeper.scoreTeamB1()
        expectResultToBe("000:001")
    })

    it("should display the score after team B scores 2 points", () => {
        startScoreKeeper()
        scoreKeeper.scoreTeamB2()
        expectResultToBe("000:002")
    })

    it("should display the score after team B scores 3 points", () => {
        startScoreKeeper()
        scoreKeeper.scoreTeamB3()
        expectResultToBe("000:003")
    })

    it("should display the score after several plays", () => {
        startScoreKeeper()
        scoreKeeper.scoreTeamA1()
        scoreKeeper.scoreTeamB1()
        scoreKeeper.scoreTeamA2()
        scoreKeeper.scoreTeamB2()
        scoreKeeper.scoreTeamA3()
        scoreKeeper.scoreTeamB3()
        expectResultToBe("006:006")
    })
})
```

## Definiendo el ScoreDisplay

Lo primero que se me ocurre para introducir el objeto `ScoreDisplay` es extraer una clase basada en el mismo código de `ScoreKeeper`. Básicamente, copiando su código. Algo así:

```typescript
export class ScoreDisplay {
    private local = 0
    private visitor = 0

    show(): string {
        const l = this.local.toString().padStart(3, "0")
        const v = this.visitor.toString().padStart(3, "0")
        return `${l}:${v}`
    }
}
```

Una característica de un _observer_ es tener un método mediante el cual ser notificado de un evento que ocurra en el objeto observado o _subject_. Aquí podríamos proceder de varias formas. En el caso más sencillo el _observer_ solo está interesado en un evento del _subject_ y, por tanto, cualquier método capaz de recibir la información adecuada sería válido. Pero, ¿cuántos eventos podrían ser interesantes en el _subject_? Pues básicamente uno: un equipo anota una canasta y, en consecuencia, el marcador cambia.

Ahora bien, podríamos considerar que por cada equipo y tipo de canasta debería notificarse un evento. Es como decir, tantos como métodos tiene `ScoreKeeper`. Sin embargo, es claro que podríamos representar el evento como "el equipo X ha anotado una canasta que vale n puntos". Algo así:

```typescript
export class TeamScored {
    public readonly team: string
    public readonly points: number // 1,2,3
    
    constructor(team, points) {
        this.team = team
        this.points = points
    }
}
```

¿Y qué pasa con el cambio del marcador? Si a `ScoreDisplay` le notificamos de cada jugada, tendríamos que duplicar en esa clase la lógica de cálculo del acumulado de puntos. Esto no tiene mucho sentido, ya que `ScoreKeeper` tiene esa responsabilidad. `ScoreDisplay`, por su parte, solo sería responsable de mostrar el marcador actual. Tendría más sentido un evento `ScoreChanged`:

```typescript
export class ScoreChanged {
    public readonly local: number
    public readonly visitor: number
    
    constructor(local, visitor) {
        this.local = local
        this.visitor = visitor
    }
}
```

He representado estos eventos como objetos, lo cual es una representación perfectamente válida y con la que probablemente estés familiarizada. Sin embargo, la notificación podría producirse, al menos en un sistema tan pequeño como este, de una forma más simple: haciendo que el observador tenga un método específico en el que ser notificado:

```typescript
export class ScoreDisplay {
    private local = 0
    private visitor = 0

    show(): string {
        const l = this.local.toString().padStart(3, "0")
        const v = this.visitor.toString().padStart(3, "0")
        return `${l}:${v}`
    }
    
    notifyChangedScore(local: number, visitor: number) {
        this.local = local
        this.visitor = visitor
    }
}
```

O incluso:

```typescript
export class ScoreDisplay {
    private local = 0
    private visitor = 0

    show(): string {
        const l = this.local.toString().padStart(3, "0")
        const v = this.visitor.toString().padStart(3, "0")
        return `${l}:${v}`
    }
    
    notify(local: number, visitor: number) {
        this.local = local
        this.visitor = visitor
    }
}
```

Teniendo en cuenta lo limitado del dominio del problema cualquiera de las anteriores sería una solución perfectamente válida.

Si optamos por eventos como objetos, podríamos hacer:

```typescript
export class ScoreDisplay {
    private local = 0
    private visitor = 0

    show(): string {
        const l = this.local.toString().padStart(3, "0")
        const v = this.visitor.toString().padStart(3, "0")
        return `${l}:${v}`
    }

    notify(scoreChanged: ScoreChanged) {
        this.local = scoreChanged.local
        this.visitor = scoreChanged.visitor
    }
}
```

De hecho, en un lenguaje con sobrecarga de métodos, esta última es una solución muy elegante, ya que podemos introducir tantos métodos `notify` como eventos soporte el observador. Otra ventaja de esta solución es que es más compacta en términos de signatura del método, que solo recibe un parámetro, el cual debe saber como desempaquetar.

### Objetos en todas partes

Esto último me lleva a una reflexión. Volvamos a esta propuesta:

```typescript
export class ScoreDisplay {
    private local = 0
    private visitor = 0

    show(): string {
        const l = this.local.toString().padStart(3, "0")
        const v = this.visitor.toString().padStart(3, "0")
        return `${l}:${v}`
    }
    
    notifyChangedScore(local: number, visitor: number) {
        this.local = local
        this.visitor = visitor
    }
}
```

El marcador, o el estado actual del marcador, es un concepto del dominio que se representa mediante un par de números: los tanteos del equipo local y del visitante, respectivamente. Esto no está reflejado así en el código, pues tenemos dos variables numéricas haciéndolo. Un caso de _data clamp_: valores que van siempre juntos y que probablemente representan un concepto subyacente.

```typescript
class Score {
    private readonly local: number
    private readonly visitor: number
    
    constructor(local: number, visitor: number) {
        this.local = local;
        this.visitor = visitor;
    }
}
```

Una cosa que nos gustaría poder hacer con `Score` es tener una representación configurable, tal y como se refleja en este test.

```typescript
const simpleFormatter: (sc: number) => string = (sc: number) => {
    return sc.toString()
}

describe("Score", () => {
    it("should display the initial score using a formatter", () => {
        expect(new Score(0, 0).format(simpleFormatter)).toBe("0:0")
        expect(new Score(1, 0).format(simpleFormatter)).toBe("1:0")
        expect(new Score(0, 15).format(simpleFormatter)).toBe("0:15")
    })
})
```

Como puedes ver, no me interesa exponer la estructura interna de `Score` mediante _getters_. Pero defino un comportamiento que me permite formatearlo pasándole una estrategia en forma de función. Esto es una especie de patrón _visitor_ mezclado con _strategy_, pero implementado de forma funcional.

De esta forma, podemos tener un `ScoreDisplay` como este:

```typescript
describe("ScoreDisplay", () => {
    it("should start at 0-0", () => {
        const scoreDisplay = new ScoreDisplay()
        expect(scoreDisplay.show()).toBe("000:000")
    })
})
```

```typescript
export class ScoreDisplay {
    private score: Score = new Score(0, 0)

    show(): string {
        return this.score.format((sc: number) => sc.toString().padStart(3, "0"))
    }
}
```

Claramente, `ScoreDisplay` solo puede indicar marcadores de 0 a 0, pues no expone ninguna forma de ajustar los valores. Para nuestro ejercicio solo necesitamos que pueda comunicársele el `Score` que queremos mostrar. Precisamente, lo que necesitamos para implementar el patrón _observer_.

## La notificación

Hemos visto antes que podríamos `ScoreKeeper` podría utilizar formas diversas de mensajes para notificar a `ScoreDisplay`. Como hemos visto, también, ScoreKeeper puede comunicar dos cosas: que se ha logrado una canasta y el estado de la puntuación en un momento dado. `ScoreDisplay` solo tiene interés en este último. Este mensaje podría ser así:

```typescript
describe("ScoreDisplay", () => {
    it("should start at 0-0", () => {
        const scoreDisplay = new ScoreDisplay()
        expect(scoreDisplay.show()).toBe("000:000")
    })

    it("should show the notified score", () => {
        const scoreDisplay = new ScoreDisplay()
        scoreDisplay.notifyScore(new Score(15, 24))
        expect(scoreDisplay.show()).toBe("015:024")
    })
})
```

Y tiene una implementación bastante trivial:

```typescript
export class ScoreDisplay {
    private score: Score = new Score(0, 0)

    show(): string {
        return this.score.format((sc: number) => sc.toString().padStart(3, "0"))
    }

    notifyScore(updatedScore: Score) {
        this.score = updatedScore
    }
}
```

Ahora, tenemos una forma de decirle a ScoreDisplay cuáles son los valores que debe mostrar.

## El registro

Para que `ScoreKeeper` pueda notificar a `ScoreDisplay`, o a cualquier otro observador, tiene que exponer algún método que permita a un objeto registrarse como observador. En algunos casos, si hay un único evento al que registrarse bastaría un método en el que el objeto se registre sin más. Si hay más de un evento, es preciso permitir indicar a cuál de ellos se registra el objeto observador. En este caso, una forma típica podría ser esta, en la que se usa un simple string para indicar el nombre del evento.

```typescript
describe('ScoreKeeper', () => {
    it('should allow register to score_change event', () => {
        const scoreKeeper = new ScoreKeeper()
        const scoreDisplay = new ScoreDisplay()

        scoreKeeper.register('score_change', scoreDisplay)

        scoreKeeper.scoreTeamA1()
        expect(scoreDisplay.show()).toBe("001:000")

        scoreKeeper.scoreTeamA2()
        expect(scoreDisplay.show()).toBe("003:000")
    })
})
```

Implementar el registro se puede hacer de una forma relativamente sencilla:

```typescript
export class ScoreKeeper {
    private local = 0
    private visitor = 0
    private observers: Record<string, object[]> = {}
    
    register(event: string, observer: object) {
        if (!this.observers[event]) {
            this.observers[event] = []
        }
        this.observers[event].push(observer)
    }
}
```

El test que hemos mostrado antes no pasará hasta que implementemos la notificación, cosa que podríamos hacer de esta forma:

```typescript
export class ScoreKeeper {
    private local = 0
    private visitor = 0
    private observers: Record<string, object[]> = {}

    register(event: string, observer: object) {
        if (!this.observers[event]) {
            this.observers[event] = []
        }
        this.observers[event].push(observer)
    }

    private notifyScoreChanged() {
        if (!this.observers.score_change) {
            return
        }
        for (const observer of this.observers.score_change) {
            observer.notifyScore(new Score(this.local, this.visitor))
        }
    }

    getScore(): string {
        const l = this.local.toString().padStart(3, "0")
        const v = this.visitor.toString().padStart(3, "0")
        return `${l}:${v}`
    }

    scoreTeamA1() {
        this.local = this.local + 1
        this.notifyScoreChanged()
    }

    scoreTeamA2() {
        this.local = this.local + 2
        this.notifyScoreChanged()
    }

    scoreTeamA3() {
        this.local = this.local + 3
        this.notifyScoreChanged()
    }

    scoreTeamB1() {
        this.visitor = this.visitor + 1
        this.notifyScoreChanged()
    }

    scoreTeamB2() {
        this.visitor = this.visitor + 2
        this.notifyScoreChanged()
    }

    scoreTeamB3() {
        this.visitor = this.visitor + 3
        this.notifyScoreChanged()
    }
}
```

Con esto, hemos implementado de forma tosca el patrón _observer_. Me imagino que algunas personas estáis pensando que se trata de un código un poco feo, cuando menos, debido a las repeticiones. El caso es que el ejercicio original pedía exponer estos métodos. En cualquier caso, el bloque de registro/notificación es bastante claro: tenemos un método que registra observadores para un evento y otro método que recorre la lista de observadores notificando a cada uno de ellos del evento en que están interesados.

```typescript
export class ScoreKeeper {
    private local = 0
    private visitor = 0
    private observers: Record<string, object[]> = {}

    register(event: string, observer: object) {
        if (!this.observers[event]) {
            this.observers[event] = []
        }
        this.observers[event].push(observer)
    }

    private notifyScoreChanged() {
        if (!this.observers.score_change) {
            return
        }
        for (const observer of this.observers.score_change) {
            observer.notifyScore(new Score(this.local, this.visitor))
        }
    }
}
```

## Problemas

Un problema que podemos observar es el que vemos a continuación. No hay forma de garantizar que un observador registrado sea capaz de atender el mensaje `notifyScore`.

```typescript
for (const observer of this.observers.score_change) {
    observer.notifyScore(new Score(this.local, this.visitor))
}
```

Al tratarse de un lenguaje dinámico, Typescript nos deja hacer este tipo de cosas. Esto no es necesariamente un problema. Si pasamos como observador del evento un objeto que no pueda responder a `notifyScore` lo sabremos cuando ocurra. Sin embargo, solemos preferir evitarlo antes de que ocurra. En lenguajes como Ruby, podríamos preguntarle al objeto al registrarlo si es capaz de atender a `notifyScore`. Alternativamente, podemos definir interfaces y hacer un poco más riguroso el registro:

```typescript
export class ScoreKeeper {
    private local = 0
    private visitor = 0
    private observers: Record<string, object[]> = {}

    register(event: string, observer: object) {
        switch (event) {
            case "score_change":
                this.registerScoreObserver(observer as ScoreObserver)
                break
        }
    }

    private registerScoreObserver(observer: ScoreObserver) {
        if (!this.observers.score_change) {
            this.observers.score_change = []
        }

        this.observers.score_change.push(observer)
    }

    private notifyScoreChanged() {
        if (!this.observers.score_change) {
            return
        }

        let observer: ScoreObserver
        for (observer of this.observers.score_change as ScoreObserver[]) {
            observer.notifyScore(new Score(this.local, this.visitor))
        }
    }
}
```

Otro detalle interesante es que ahora `register` no gestiona directamente la colección de _observers_ y así no sabe la estructura de datos que se usa.

## Usando el patrón _observer_

Podemos cambiar los tests de ScoreKeeper para usar el observer a pleno rendimiento:

```typescript
describe("ScoreKeeper", () => {
    let scoreKeeper: ScoreKeeper
    let scoreDisplay: ScoreDisplay

    function startScoreKeeper() {
        scoreKeeper = new ScoreKeeper()
        scoreDisplay = new ScoreDisplay()
        scoreKeeper.register("score_change", scoreDisplay)
    }

    function expectResultToBe(expectedResult: string) {
        expect(scoreDisplay.show()).toBe(expectedResult)
    }

    it("should display the initial score", () => {
        startScoreKeeper()
        expectResultToBe("000:000")
    })

    it("should display the score after team A scores 1 point", () => {
        startScoreKeeper()
        scoreKeeper.scoreTeamA1()
        expectResultToBe("001:000")
    })

    it("should display the score after team A scores 2 points", () => {
        startScoreKeeper()
        scoreKeeper.scoreTeamA2()
        expectResultToBe("002:000")
    })

    it("should display the score after team A scores 3 points", () => {
        startScoreKeeper()
        scoreKeeper.scoreTeamA3()
        expectResultToBe("003:000")
    })

    it("should display the score after team B scores 1 point", () => {
        startScoreKeeper()
        scoreKeeper.scoreTeamB1()
        expectResultToBe("000:001")
    })

    it("should display the score after team B scores 2 points", () => {
        startScoreKeeper()
        scoreKeeper.scoreTeamB2()
        expectResultToBe("000:002")
    })

    it("should display the score after team B scores 3 points", () => {
        startScoreKeeper()
        scoreKeeper.scoreTeamB3()
        expectResultToBe("000:003")
    })

    it("should display the score after several plays", () => {
        startScoreKeeper()
        scoreKeeper.scoreTeamA1()
        scoreKeeper.scoreTeamB1()
        scoreKeeper.scoreTeamA2()
        scoreKeeper.scoreTeamB2()
        scoreKeeper.scoreTeamA3()
        scoreKeeper.scoreTeamB3()
        expectResultToBe("006:006")
    })

    it("should allow register to score_change event", () => {
        startScoreKeeper()

        scoreKeeper.scoreTeamA1()
        expectResultToBe("001:000")

        scoreKeeper.scoreTeamA2()
        expectResultToBe("003:000")
    })
})
```

Con lo cual, podemos deshacernos del método _getScore_.

```typescript
export class ScoreKeeper {
    private local = 0
    private visitor = 0
    private observers: Record<string, object[]> = {}

    register(event: string, observer: ScoreObserver) {
        switch (event) {
            case "score_change":
                this.registerScoreObserver(observer as ScoreObserver)
                break
        }
    }

    private registerScoreObserver(observer: ScoreObserver) {
        if (!this.observers.score_change) {
            this.observers.score_change = []
        }

        this.observers.score_change.push(observer)
    }

    private notifyScoreChanged() {
        if (!this.observers.score_change) {
            return
        }

        let observer: ScoreObserver
        for (observer of this.observers.score_change as ScoreObserver[]) {
            observer.notifyScore(new Score(this.local, this.visitor))
        }
    }
    scoreTeamA1() {
        this.local = this.local + 1
        this.notifyScoreChanged()
    }

    scoreTeamA2() {
        this.local = this.local + 2
        this.notifyScoreChanged()
    }

    scoreTeamA3() {
        this.local = this.local + 3
        this.notifyScoreChanged()
    }

    scoreTeamB1() {
        this.visitor = this.visitor + 1
        this.notifyScoreChanged()
    }

    scoreTeamB2() {
        this.visitor = this.visitor + 2
        this.notifyScoreChanged()
    }

    scoreTeamB3() {
        this.visitor = this.visitor + 3
        this.notifyScoreChanged()
    }
}
```

Un problema de este código es que resulta muy repetitivo. Es cierto que la interfaz es obligatoria, pero nada nos impide tener una implementación subyacente más general. Este cambio simplifica el mantenimiento. El método `registerBasket`, no solamente unifica la forma de calcular el marcador, sino que es el único punto desde el que se lanza la notificación de eventos.

```typescript
export class ScoreKeeper {
    private local = 0
    private visitor = 0
    private observers: Record<string, object[]> = {}

    register(event: string, observer: ScoreObserver) {
        switch (event) {
            case "score_change":
                this.registerScoreObserver(observer as ScoreObserver)
                break
        }
    }

    private registerScoreObserver(observer: ScoreObserver) {
        if (!this.observers.score_change) {
            this.observers.score_change = []
        }

        this.observers.score_change.push(observer)
    }

    private notifyScoreChanged() {
        if (!this.observers.score_change) {
            return
        }

        let observer: ScoreObserver
        for (observer of this.observers.score_change as ScoreObserver[]) {
            observer.notifyScore(new Score(this.local, this.visitor))
        }
    }

    private registerBasket(team: string, points: number) {
        switch (team) {
            case "local":
                this.local = this.local + points
                break
            case "visitor":
                this.visitor = this.visitor + points
                break
        }
        this.notifyScoreChanged()
    }

    scoreTeamA1() {
        this.registerBasket("local", 1)
    }

    scoreTeamA2() {
        this.registerBasket("local", 2)
    }

    scoreTeamA3() {
        this.registerBasket("local", 3)
    }

    scoreTeamB1() {
        this.registerBasket("visitor", 1)
    }

    scoreTeamB2() {
        this.registerBasket("visitor", 2)
    }

    scoreTeamB3() {
        this.registerBasket("visitor", 3)
    }
}
```

## Limitaciones del patrón _observer_

_Observer_ es un patrón adecuado cuando el observado y el observador se encuentran en el mismo contexto, pues incluye un cierto grado de acoplamiento: el observador sabe qué objeto quiere observar y el observado sabe qué objetos deben ser notificados. La interfaz por la que se comunican no implica un conocimiento sobre el estado o estructura interna del observador, ni tampoco sobre qué va a hacer el observador, lo que puede proporcionar el desacoplamiento suficiente para algunas situaciones.

Voy a intentar ilustrarlo con un ejemplo. Imagina un caso de uso que añade productos a un carro de la compra. Puede ocurrir que exista alguna diferencia entre los productos que se quieren añadir y los que efectivamente se añaden. Esto podría obedecer a ciertas reglas de negocio, como podría ser el crédito del que dispone la cliente o la disponibilidad de los productos. El problema viene si necesitamos hacer algo con respecto a los productos que realmente han sido añadidos, como podría ser reservarlos en el almacén para asegurar que cuando se complete la compra están disponibles. Como es lógico, no queremos reservar productos que no se van a poder comprar.

El problema que tenemos es que aunque sabemos la lista de productos que se quieren poner en el carrito no sabemos cuáles se han añadido de verdad. Tendríamos que preguntarle al carrito qué productos han sido estos y tener una forma de diferenciar los que se acaban de incluir de los que ya estaban de una acción anterior.

Es aquí donde el patrón _Observer_ ofrece una ventaja sobre otras aproximaciones. El carrito (que es el observado) podría notificar a uno o varios observadores (por ejemplo el servicio que reserva los productos) cada vez que incluye un producto. Otra notificación podría servir para comunicar productos que han sido rechazados. Esta comunicación es síncrona: la acción del observador ocurre cuando ocurre la acción del observado.

Ahora bien, esto podría resolverse mediante el uso de un patrón pub/sub con un bus de eventos. El bus de eventos puede implementarse síncrono o asíncrono, aunque como norma general debe ser tratado siempre como si fuese asíncrono. La ventaja del bus de eventos es que desacopla emisor y receptor del evento, de tal modo que el emisor ni siquiera sabe si hay alguien escuchando esos eventos. Sin embargo, lo que por lo general es un beneficio puede generar una inseguridad muy grande, ya que no podemos responder a la pregunta de si está garantizado que una cierta acción ocurrirá en respuesta a nuestros eventos.

Volviendo a nuestro ejemplo: con un bus de eventos, no tendríamos la seguridad de que el servicio de reserva de productos existe o escucha los eventos, por lo que no podríamos saber si un producto ha sido reservado efectivamente. Un _observer_ sí nos puede dar esa garantía.

Esto es, en un caso de uso tienen que pasar ciertas cosas obligatoriamente para que se cumpla y, mediante la publicación de eventos, permitimos que puedan ocurrir otras consecuencias asociadas a esa acción. Para conseguir la primera parte, el patrón _observer_ puede ser una herramienta útil, mientras que la publicación de eventos podemos asociar acciones colaterales al caso de uso que puedan estar fuera de los límites transaccionales.

## Conclusiones

En este artículo hemos presentado el patrón _Observer_, que resuelve el problema de actualizar un objeto cuando otro cambia por alguna razón, sin que ninguno de ellos tenga que exponer su estructura o estado interno.


