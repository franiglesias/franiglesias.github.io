---
layout: post
title: No extiendas de AggregateRoot
categories: articles
tags: software-design
---

Extender de AggregateRoot contamina el dominio, es mentiroso e incumple SOLID, ¿cómo te quedas?

## ¿A qué me estoy refiriendo?

En muchísimas bases de código podemos ver algo como esto:

```typescript
class Whatever extends AggregateRoot 
{
    
}
```

El motivo de hacer esto es que la entidad `Whatever` sería la raíz del agregado en un contexto dado del dominio y, como tal, tiene unas ciertas características. Básicamente, que puede producir eventos. De este modo, AggregateRoot suele tener una interfaz similar a esta:

```typescript
interface AggregateRoot {
    public record(event:Event): void;
    public getEvents(): []; 
}
```

Todo esto suena bastante lógico, ¿verdad? En _Domain Driven Design_ hablamos de agregados. Lo normal es que tengamos un agregado por contexto y que este produzca eventos, los cuales obtenemos y pasamos a un bus de eventos que se encarga de publicarlos.

Pues todo mal.

## Extender de `AggregateRoot` contamina el dominio

_Aggregate Root_ no es un concepto que exista en ningún dominio. Es un constructo técnico propio de una determinada escuela de diseño de software: _Domain Driven Design_. Es posible que estés aplicando patrones tácticos de DDD en tu software, que no es mala cosa _per se_, puesto que se trata de patrones generales de Orientación a Objetos. Sin embargo, siendo sinceras, lo más probable es que no estés haciendo DDD, ya que no has trabajado nunca la parte estratégica.

## `AggregateRoot` es mentiroso

De hecho, el constructo de _Aggregate Root_ se usa en DDD para referirse a la entidad que define los límites de transaccionalidad del agregado que estemos considerando. Dicho en otras palabras: el _Aggregate Root_ se encarga de coordinar que todos los componentes del agregado se persistan como un todo, en una única transacción. No tiene nada que ver con eventos. 

De hecho, una entidad podría producir eventos sin ser _Aggregate Root_, pero nos lleva a algo que podríamos representar así:

```typescript
class NotAnAggregateRoot extends AggregateRoot {
    
}
```

Lo anterior pone de relieve que algo no está bien: estamos forzando a una entidad a ser _AggregateRoot_ cuando ni lo es ni se espera que lo sea, simplemente porque necesitamos que produzca eventos y asumimos que solo el _Aggregate Root_ proporciona ese detalle.

## `AggregateRoot` incumple SOLID

Como suele ocurrir cuando extendemos de clases genéricas con la intención de aprovechar una funcionalidad estamos incumpliendo el Principio de Sustitución de Liskov o subtipado semántico. Este principio nos dice que las subclases han de ser semánticamente equivalentes a las clases de las que descienden, lo que se traduce en que serán especializaciones de aquella. En la práctica, una clase derivada no puede añadir métodos a la interfaz pública, cosa del todo incompatible con lo que esperamos de una entidad o agregado en dominio, que definirán sus propios comportamientos.

Este tipo de clases genéricas actúan como una suerte de librerías de terceras partes. Las tenemos porque nos aportan una funcionalidad cuyo código queremos reutilizar. Sin embargo, reutilizar una funcionalidad a través de la herencia introduce un acoplamiento fuerte y dependencias entre todas las clases derivadas.

Y como normalmente solo esperamos tener un Agregado por contexto, estaremos acoplando todos los contextos entre sí.

## Soluciones

Tenemos mecanismos alternativos para lograr lo mismo de una forma mejor.

La raíz del problema es que queremos reflejar que una Entidad, sin tener en cuenta si es el _Aggregate Root_ en ese contexto, puede producir eventos de dominio y, por tanto, podemos interrogarla acerca de los eventos que haya podido producir.

La mejor manera de expresar eso es mediante una interfaz.

```typescript
interface ProducesEvents {
    public getEvents(): [];
}
```

Me dirás que la interfaz no trae consigo la funcionalidad y tendría que implementarla en cada Entidad. Para eso me basta tener un objeto `EventBag` o `EventRecorder`. En esencia, no es más que una clase que encapsula un array de eventos, exponiendo métodos para registrarlos y para obtenerlos cuando los necesitemos publicar:

```typescript
class EventBag implements ProducesEvents {
    public record(event:Event): void;
    public getEvents():[];
}
```

Diría que `implements ProducesEvents` no sería del todo necesario en este caso, ya que `EventBag` expone su propia interfaz. Pero podríamos hacer incluso algo así, si queremos ponernos estupendas:

```typescript
interface RecordsEvents {
    public record(event:Event): void;
}
```

De modo que:

```typescript
class EventBag implements RecordsEvents, ProducesEvents {
    public record(event:Event): void;
    public getEvents():[];
}
```

Pero, vamos, nos valdría con esto:

```typescript
class EventBag {
    public record(event:Event): void;
    public getEvents():[];
}
```

Como `EventBag` es un objeto `newable` lo podemos inicializar en cualquier momento, no es una dependencia que debamos inyectar. Nos quedaría algo así:

```typescript
class SomeEntity implements ProducesEvents {
    private eventBag:EventBag;
    
    constructor (){
        this.eventBag = new EventBag();
        this.eventBag.record(new SomeEntityWasCreated());
    }
    
    public getEvents():[] {
        return this.eventBag().getEvents();
    }
}
```

El código es una simplificación, pero debería ser suficiente para entender el uso de la composición en lugar de la herencia para resolver este problema.

Soy consciente de que algunas personas estáis pensando en cosas como _¿y qué pasa si rehidrato mis agregados con reflection y nunca ejecuto su constructor?_. Pues nada: es cuestión de investigar un poco y hacer uso de un patrón tipo _lazy loading_ o, mejor aún: separar tus entidades de dominio del modelo de persistencia, que podrías construir con DTOs y que se líen ellos con las peculiaridades de tu ORM. 

## Conclusiones

Nos hemos acostumbrado a aplicar ciertas prácticas de forma acrítica, sin reflexionar mucho sobre lo que implican para nuestro código. A la larga, nuestras bases de código se hacen difíciles de mantener y evolucionar en el tiempo debido a que no hemos sido cuidadosas en algunas decisiones iniciales.

Esto es especialmente notorio en lo tocante a metodologías como DDD, de las que se toman elementos sueltos sin entender realmente la teoría detrás y aplicando ciertos patrones de forma descontextualizada. En ese sentido, un repaso a las bases de Orientación a Objetos nunca viene mal.

En este artículo hemos visto un ejemplo con el abuso de Aggregate Root y cómo, además, podemos utilizar técnicas bien conocidas, como la composición, y resolver el problema de una forma más limpia.
