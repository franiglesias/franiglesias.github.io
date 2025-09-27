---
layout: post
title: Como funciona un contenedor de inyección de dependencias
categories: articles
tags: software-design typescript
---

El contenedor de inyección de dependencias es un componente que nos ayuda a gestionar los árboles de objetos en una aplicación.

Como hemos hecho en alguna ocasión anterior, vamos a intentar explicar cómo funciona por dentro este componente. No es tan complicado como podría parecer.

## Conceptos básicos

El objetivo de un contenedor de inyección de dependencias es facilitarnos obtener instancias de objetos de una aplicación, montadas y listas para usar. Además, queremos que nos garantice que de ciertos objetos se genera y se usa una única instancia o _singleton_ en toda la aplicación. Por otro lado, en ocasiones querremos instancias distintas de ciertos componentes, dependiendo del contexto.

El contenedor necesitará que le indiquemos formas de identificar y generar una instancia de las dependencias necesarias, si queremos un _singleton_ o una instancia nueva cada vez. También necesitaremos una forma de obtener la instancia de la dependencia o métodos para verificar si tenemos alguna registrada. En cuanto al entorno de ejecución, una forma sencilla de abordarlo es usar un contenedor distinto para cada entorno, aunque requiera repetir algo de código.

Hagámoslo con TDD, ya que estamos. Para el ejemplo, usaré Typescript, porque es el lenguaje con el que estoy trabajando.

## Sentando las bases

Para empezar de forma sencilla, vamos a definir los básicos de la interfaz. Para registrar una dependencia necesitamos esta información:

* **Un nombre para identificarla**: el nombre será un string que debería ser único para cada entorno de ejecución y nos permitirá reclamarla cuando la necesitemos.
* **Una forma de construir una instancia o factoría**: lo más sencillo es pasar una función que tenga acceso al propio contenedor, así un componente puede construirse con dependencias que ya tengamos registradas.
* **Si queremos que sea singleton o nueva cada vez**: podría bastar un flag booleano, pero es mejor práctica tener métodos específicos para cada uno de los dos estados.

Voy a llamar a este contenedor `Dicky` (Dependency Injection Container: DIC). Además, Dicky, en inglés, se puede usar como sinónimo de debilucho, que nos viene bien para un container que no va a ser muy bueno, pero que será suficiente para entender cómo funciona.

De acuerdo a este último punto, voy a empezar por las dependencias transitorias (de las que obtenemos una instancia nueva cada vez), que son un poco más sencillas de implementar. Para ello, introduzco este test. De momento, no vamos a usar objetos para ir poco a poco.

```typescript
describe('Dicky', () => {
    it('should be able to register and recover a transient dependency', () => {
        const dicky = new Dicky()
        dicky.registerTransient('example', () => 'content')

        expect(dicky.resolve('example')).toBe('content')
    })
})
```

Vamos poniendo cosas en su lugar, y así tenemos un primer código que todavía no hace pasar el test.

```typescript
class Dicky {

    registerTransient(name: string, factory: () => string) {

    }

    resolve(name: string) {

    }
}
```

Para hacerlo pasar de la forma más rápida posible, podemos hacerlo así:

```typescript
class Dicky {

    registerTransient(name: string, factory: () => string) {

    }

    resolve(name: string) {
        return 'content'
    }
}
```

Por supuesto, queremos poder registrar varias dependencias con distintos nombres.

```typescript
describe('Dicky', () => {
    it('should be able to register and recover a transient dependency', () => {
        const dicky = new Dicky()
        dicky.registerTransient('example', () => 'content')

        expect(dicky.resolve('example')).toBe('content')
    })

    it('should be able to register different dependencies', () => {
        const dicky = new Dicky()
        dicky.registerTransient('other', () => 'extra content')

        expect(dicky.resolve('other')).toBe('extra content')

    })
})
```

Algo que podemos resolver como se verá a continuación. Lo que tenemos que hacer es guardar las _factorías_ que vamos registrando en un mapa para que sea fácil acceder a las que necesitemos. En `resolve` obtenemos la factoría deseada del mapa y la ejecutamos para que devuelva la instancia generada.

```typescript
export class Dicky {
    private dependencies: Map<string, () => string>

    constructor() {
        this.dependencies = new Map<string, () => string>()
    }

    registerTransient(name: string, factory: () => string) {
        this.dependencies.set(name, factory)
    }

    resolve(name: string) {
        const factory =  this.dependencies.get(name)
        return factory ? factory() : undefined
    }
}
```

## Lanzar errores si no se ha registrado una dependencia

Hay varios problemas que resolver, así que vamos por partes. En primer lugar, puede darse el caso de que una dependencia no haya sido definida, por lo que podemos hacer un test que describa esa situación. Esperamos que Dicky se queje con un error:

```typescript
describe('Dicky', () => {
    it('should be able to register and recover a transient dependency', () => {
        const dicky = new Dicky()
        dicky.registerTransient('example', () => 'content')

        expect(dicky.resolve('example')).toBe('content')
    })

    it('should be able to register different dependencies', () => {
        const dicky = new Dicky()
        dicky.registerTransient('other', () => 'extra content')

        expect(dicky.resolve('other')).toBe('extra content')
    })

    it('should fail if a dependency was not defined', () => {
        const dicky = new Dicky()

        expect(() => {dicky.resolve('dependency-not-defined')}).toThrow(DependencyNotDefined)
    })
})
```

Y escribimos el código necesario:

```typescript
export class DependencyNotDefined implements Error {
    message: string
    name: string

    constructor(name: string) {
        this.message = `Dependency ${name} not found`
        this.name = 'DependencyNotDefined'
    }
}

export class Dicky {
    private dependencies: Map<string, () => string>

    constructor() {
        this.dependencies = new Map<string, () => string>()
    }

    registerTransient(name: string, factory: () => string) {
        this.dependencies.set(name, factory)
    }

    resolve(name: string) {
        const factory =  this.dependencies.get(name)
        if (!factory) {
            throw new DependencyNotDefined(name)
        }
        return factory ? factory() : undefined
    }
}
```

Podríamos hacer un pequeño refactor aquí:

```typescript
export class Dicky {
    private dependencies: Map<string, () => string>

    constructor() {
        this.dependencies = new Map<string, () => string>()
    }

    registerTransient(name: string, factory: () => string) {
        this.dependencies.set(name, factory)
    }

    resolve(name: string) {
        const factory = this.obtainDependency(name)
        return factory()
    }

    private obtainDependency(name: string) {
        const factory = this.dependencies.get(name)
        if (!factory) {
            throw new DependencyNotDefined(name)
        }
        return factory
    }
}
```

## Definiendo lo que es una factoría

El siguiente problema que tendríamos que abordar es que, como es obvio, no queremos que el contenedor se limite a darnos instancias de strings, como se deduce de esta línea, sino que queremos poder definir factorías que nos devuelvan cualquier tipo.

```typescript
registerTransient(name: string, factory: () => string) {
    this.dependencies.set(name, factory)
}
```

Hagamos un test para eso:

```typescript
it('should register and resolve any type of dependency', () => {
    const dicky = new Dicky()
    dicky.registerTransient('example', () => new Example('content'))

    const resolved = dicky.resolve('example')
    expect(resolved).toBeInstanceOf(Example)
    expect(resolved.content()).toEqual('content')
})
```

Introduzco la clase `Example` para hacer pruebas.

```typescript
class Example {
    private readonly _content: string

    constructor(content: string) {
        this._content = content
    }

    content(): string {
        return this._content
    }
}
```

El test falla, básicamente porque considera que `resolved` es un `string` y no un objeto de tipo `Example`.

```plaintext
TypeError: resolved.content is not a function
```

Usando genéricos podemos hacer pasar el test:

```typescript
export class Dicky {
    private dependencies: Map<string, () => unknown>

    constructor() {
        this.dependencies = new Map<string, () => unknown>()
    }

    registerTransient<T>(name: string, factory: () => T) {
        this.dependencies.set(name, factory)
    }

    resolve<T>(name: string): T {
        const factory = this.obtainDependency(name)
        return factory() as T
    }

    private obtainDependency(name: string) {
        const factory = this.dependencies.get(name)
        if (!factory) {
            throw new DependencyNotDefined(name)
        }
        return factory
    }
}
```

Y con un pequeño cambio en el propio test, el tipado de `resolved`, eliminamos alguna advertencia del linter:

```typescript
it('should register and resolve any type of dependency', () => {
    const dicky = new Dicky()
    dicky.registerTransient('example', () => new Example('content'))

    const resolved: Example = dicky.resolve('example')
    expect(resolved).toBeInstanceOf(Example)
    expect(resolved.content()).toEqual('content')
})
```

Podemos hacer algunas mejoras con un refactor. Voy a definir un tipo para las factorías:

```typescript
type factory<T> = () => T

export class Dicky {
    private dependencies: Map<string, factory<unknown>>

    constructor() {
        this.dependencies = new Map<string, factory<unknown>>()
    }

    registerTransient<T>(name: string, factory: factory<T>) {
        this.dependencies.set(name, factory)
    }

    resolve<T>(name: string): T {
        const factory: factory<T> = this.obtainDependency(name)
        return factory() as T
    }

    private obtainDependency<T>(name: string): factory<T> {
        const factory = this.dependencies.get(name)
        if (!factory) {
            throw new DependencyNotDefined(name)
        }
        return factory as factory<T>
    }
}
```

Tomo nota mental de que me falta definir el comportamiento cuando intentamos registrar con el mismo nombre una dependencia que ya esté registrada. No tiene mucho sentido definir una dependencia y sobrescribirla inmediatamente. Si se lanza un error, podemos prevenir bugs difíciles de descubrir. Por otro lado, me parece que falta un test que verifique que las dependencias _transient_ nos pueden dar distintas instancias cada vez. Añado estos tests y aprovecho para reorganizarlos un poco:

```typescript
describe('Dicky', () => {
    describe('When managing Transient Dependencies', () => {
        it('should be able to register and resolve', () => {
                const dicky = new Dicky()
                dicky.registerTransient('example', () => 'content')

                expect(dicky.resolve('example')).toBe('content')
            }
        )

        it('should be able to register different dependencies', () => {
            const dicky = new Dicky()
            dicky.registerTransient('other', () => 'extra content')

            expect(dicky.resolve('other')).toBe('extra content')
        })

        it('should fail if a dependency was not defined', () => {
            const dicky = new Dicky()

            expect(() => {
                dicky.resolve('dependency-not-defined')
            }).toThrow(DependencyNotDefined)
        })

        it('should register and resolve dependencies of any type', () => {
            const dicky = new Dicky()
            dicky.registerTransient('example', () => new Example('content'))

            const resolved: Example = dicky.resolve('example')
            expect(resolved).toBeInstanceOf(Example)
            expect(resolved.content()).toEqual('content')
        })

        it('should resolve to a different instance each time', () => {
            const dicky = new Dicky()
            dicky.registerTransient('example', () => new Example('content'))
            const resolved1: Example = dicky.resolve('example')
            const resolved2: Example = dicky.resolve('example')
            expect(resolved1).not.toBe(resolved2)
        })

        it('should fail when registering a dependency with the same name', () => {
            const dicky = new Dicky()
            dicky.registerTransient('example', () => 'content')

            expect(() => {dicky.registerTransient('example', () => 'other content')}).toThrow(DependencyNameInUse)
        })
    })
})
```

El código de `Dicky` en este punto está más o menos así:

```typescript
export class DependencyNotDefined implements Error {
    message: string
    name: string

    constructor(name: string) {
        this.message = `Dependency ${name} not found`
        this.name = 'DependencyNotDefined'
    }
}

export class DependencyNameInUse implements Error {
    message: string
    name: string

    constructor(name: string) {
        this.message = `Dependency name ${name} is already in use`
        this.name = 'DependencyNameInUse'
    }
}

type factory<T> = () => T

export class Dicky {
    private dependencies: Map<string, factory<unknown>>

    constructor() {
        this.dependencies = new Map<string, factory<unknown>>()
    }

    registerTransient<T>(name: string, factory: factory<T>) {
        if (this.dependencies.has(name)) {
            throw new DependencyNameInUse(name)
        }
        this.dependencies.set(name, factory)
    }

    resolve<T>(name: string): T {
        const factory: factory<T> = this.obtainDependency(name)
        return factory() as T
    }

    private obtainDependency<T>(name: string): factory<T> {
        const factory = this.dependencies.get(name)
        if (!factory) {
            throw new DependencyNotDefined(name)
        }
        return factory as factory<T>
    }
}
```

## Preparándonos para las dependencias singleton

He visto que en algún framework a las dependencias _singleton_ también se las denomina _compartidas_. Esto quizá tenga que ver con la mala fama de ciertas implementaciones del patrón _Singleton_. El problema no está tanto en el patrón, sino en la naturaleza estática de la implementación clásica.

En muchos casos nos interesa tener una única instancia de un componente. Por ejemplo, cuando este componente posee un conocimiento que puede ser necesario en varias partes de nuestra aplicación. Si estás siguiendo la serie de TDD outside-in, te puedes imaginar que `InMemoryProductStorage` es uno de esos casos. Sin embargo, no lo usamos de forma estática, sino que es una instancia de un objeto que consumen otros objetos que necesitan almacenar o buscar productos.

Así que vamos a ver cómo implementar dependencias _singleton_. La primera cosa que pienso hacer es un refactor porque quiero tratar las dependencias como objetos. En último término, tenemos un caso de polimorfismo. Empezaré creando una clase:

```typescript
class Transient<T> {
    private readonly factory: factory<T>

    constructor(factory: factory<T>) {
        this.factory = factory
    }

    resolve(): unknown {
        return this.factory()
    }
}
```

Y así podemos usarla:

```typescript
export class Dicky {
    private dependencies: Map<string, Transient<unknown>>

    constructor() {
        this.dependencies = new Map<string, Transient<unknown>>()
    }

    registerTransient<T>(name: string, factory: factory<T>) {
        if (this.dependencies.has(name)) {
            throw new DependencyNameInUse(name)
        }
        const transient = new Transient(factory)
        this.dependencies.set(name, transient)
    }

    resolve<T>(name: string): T {
        const factory: Transient<T> = this.obtainDependency(name)
        return factory.resolve() as T
    }

    private obtainDependency<T>(name: string): Transient<T> {
        const dependency = this.dependencies.get(name)
        if (!dependency) {
            throw new DependencyNotDefined(name)
        }
        return dependency as Transient<T>
    }
}
```

De aquí podemos extraer una interfaz:

```typescript
interface Dependency<T> {
    resolve(): T
}
```

Y usarla:

```typescript
export class Dicky {
    private dependencies: Map<string, Dependency<unknown>>

    constructor() {
        this.dependencies = new Map<string, Dependency<unknown>>()
    }

    registerTransient<T>(name: string, factory: factory<T>) {
        if (this.dependencies.has(name)) {
            throw new DependencyNameInUse(name)
        }
        const transient = new Transient(factory)
        this.dependencies.set(name, transient)
    }

    resolve<T>(name: string): T {
        const factory: Dependency<T> = this.obtainDependency(name)
        return factory.resolve() as T
    }

    private obtainDependency<T>(name: string): Dependency<T> {
        const dependency = this.dependencies.get(name)
        if (!dependency) {
            throw new DependencyNotDefined(name)
        }
        return dependency as Dependency<T>
    }
}
```

## Dependencias _singleton_

La principal característica de las dependencias _singleton_ es que siempre se nos entrega la misma instancia. El siguiente test define justo esto:

```typescript
describe('When managing Singleton Dependencies', () => {

    it('should resolve to the same instance each time', () => {
        const dicky = new Dicky()
        dicky.registerSingleton('example', () => new Example('content'))
        const resolved1: Example = dicky.resolve('example')
        const resolved2: Example = dicky.resolve('example')
        expect(resolved1).toBe(resolved2)
    })
})
```

Para no alargar mucho el artículo voy a omitir los otros tests que me permiten introducir el método `registerSingleton`. 

```typescript
registerSingleton<T>(name: string, factory: factory<T>) {
    if (this.dependencies.has(name)) {
        throw new DependencyNameInUse(name)
    }
    const singleton = new Singleton(factory)
    this.dependencies.set(name, singleton)
}
```

En cualquier caso, introduzco la clase `Singleton` que, para empezar, será una simple copia de `Transient`.

```typescript
class Singleton<T> implements Dependency<T> {
    private readonly factory: factory<T>

    constructor(factory: factory<T>) {
        this.factory = factory
    }

    resolve(): T {
        return this.factory()
    }
}
```

El cambio es relativamente sencillo. No tenemos más que guardarnos la primera instancia que se genere. Si tenemos una instancia la devolvemos y, si no es así, la generamos:


```typescript
class Singleton<T> implements Dependency<T> {
    private readonly factory: factory<T>
    private instance: T | undefined

    constructor(factory: factory<T>) {
        this.factory = factory
    }

    resolve(): T {
        if (!this.instance) {
            this.instance = this.factory()
        }
        return this.instance
    }
}
```

Con esto hacemos pasar todos los tests. Un poco de refactoring y ya tenemos nuestro contenedor de dependencias básico:

```typescript
export class Dicky {
    private dependencies: Map<string, Dependency<unknown>>

    constructor() {
        this.dependencies = new Map<string, Dependency<unknown>>()
    }

    registerTransient<T>(name: string, factory: factory<T>) {
        this.registerDependency(name, new Transient(factory))
    }

    registerSingleton<T>(name: string, factory: factory<T>) {
        this.registerDependency(name, new Singleton(factory))
    }
    
    private registerDependency<T>(name: string, dependency: Dependency<T>) {
        if (this.dependencies.has(name)) {
            throw new DependencyNameInUse(name)
        }
        this.dependencies.set(name, dependency)
    }

    resolve<T>(name: string): T {
        const factory: Dependency<T> = this.obtainDependency(name)
        return factory.resolve() as T
    }

    private obtainDependency<T>(name: string): Dependency<T> {
        const dependency = this.dependencies.get(name)
        if (!dependency) {
            throw new DependencyNotDefined(name)
        }
        return dependency as Dependency<T>
    }
}
```

Y aquí las clases que representan cada uno de los tipos de dependencia:

```typescript
class Transient<T> implements Dependency<T> {
    private readonly factory: factory<T>

    constructor(factory: factory<T>) {
        this.factory = factory
    }

    resolve(): T {
        return this.factory()
    }
}

class Singleton<T> implements Dependency<T> {
    private readonly factory: factory<T>
    private instance: T | undefined

    constructor(factory: factory<T>) {
        this.factory = factory
    }

    resolve(): T {
        if (!this.instance) {
            this.instance = this.factory()
        }
        return this.instance
    }
}
```

## Dependiendo de otras dependencias

La funcionalidad más importante que nos quedaría por implementar es la posibilidad de usar dependencias ya registradas en nuestras factorías. Esto es relevante para que el contendor sea realmente útil.

Hagamos un test que describa esta prestación.

```typescript
describe('When using the container', () => {
    it('should allow referring to registered dependencies', () => {
        const dicky = new Dicky()
        dicky.registerSingleton('collaborator', () => new CollaboratorExample())
        dicky.registerSingleton('service', () => new ServiceExample(dicky.resolve('collaborator')))
        const service: ServiceExample = dicky.resolve('service')
        expect(service.doMyThing()).toEqual('1')
    })
})
```

Este test pasa, indicando que la prestación está soportada. En Typescript esto es posible porque nos lo permite el scope, pero esto no es posible en otros lenguajes en los que tendríamos que pasar el contenedor de forma explícita.

Si cambiamos la forma de escribir el test lo podemos ver un poco más claro. La función factoría necesita que le pasemos la instancia del contenedor.

```typescript
describe('When using the container', () => {
    function serviceFactory(dicky: Dicky) {
        return () => new ServiceExample(dicky.resolve('collaborator'))
    }

    it('should allow referring to registered dependencies', () => {
        const dicky = new Dicky()
        dicky.registerSingleton('collaborator', () => new CollaboratorExample())
        dicky.registerSingleton('service', serviceFactory(dicky))
        const service: ServiceExample = dicky.resolve('service')
        expect(service.doMyThing()).toEqual('1')
    })
})
```

Podemos hacerlo de otra forma haciendo que la función factoría tenga que aceptar como parámetro el contenedor de inyección de dependencias.

```typescript
describe('When using the container', () => {
    it('should allow referring to registered dependencies', () => {
        const dicky = new Dicky()
        dicky.registerSingleton('collaborator', () => new CollaboratorExample())
        dicky.registerSingleton('service', (dic: Dicky) => new ServiceExample(dic.resolve('collaborator')))
        const service: ServiceExample = dicky.resolve('service')
        expect(service.doMyThing()).toEqual('1')
    })
})
```

Esto requiere algunos cambios. Primero en el tipo `factory`:

```typescript
type factory<T> = (dic: Dicky) => T
```

Los objetos `Dependency` tienen que poder recibir y usar la instancia actual del contenedor:

```typescript
class Transient<T> implements Dependency<T> {
    private readonly factory: factory<T>
    private readonly dic: Dicky

    constructor(factory: factory<T>, dic: Dicky) {
        this.factory = factory
        this.dic = dic
    }

    resolve(): T {
        return this.factory(this.dic)
    }
}

class Singleton<T> implements Dependency<T> {
    private readonly factory: factory<T>
    private instance: T | undefined
    private readonly dic: Dicky

    constructor(factory: factory<T>, dic: Dicky) {
        this.factory = factory
        this.dic = dic
    }

    resolve(): T {
        if (!this.instance) {
            this.instance = this.factory(this.dic)
        }
        return this.instance
    }
}
```

El contenedor se pasa al registrar la dependencia:

```typescript
export class Dicky {
    private dependencies: Map<string, Dependency<unknown>>

    constructor() {
        this.dependencies = new Map<string, Dependency<unknown>>()
    }

    registerTransient<T>(name: string, factory: factory<T>) {
        this.registerDependency(name, new Transient(factory, this))
    }

    registerSingleton<T>(name: string, factory: factory<T>) {
        this.registerDependency(name, new Singleton(factory, this))
    }
    
    // Code removed for clarity
}
```

Y ahora ya podemos definir funciones factoría sin tener que pasar el contenedor, que ya se inyecta automáticamente.

```typescript
describe('When using the container', () => {
    function serviceFactory() {
        return (dic: Dicky) => new ServiceExample(dic.resolve('collaborator'))
    }

    it('should allow referring to registered dependencies', () => {
        const dicky = new Dicky()
        dicky.registerSingleton('collaborator', () => new CollaboratorExample())
        dicky.registerSingleton('service', serviceFactory())
        const service: ServiceExample = dicky.resolve('service')
        expect(service.doMyThing()).toEqual('1')
    })
})
```

## Toques finales

Las clases `Transient` y `Singleton` comparten mucho código. Creo que podemos hacerlas descender de una clase base `Dependency` en lugar de implementar una interfaz. La única variación de comportamiento que tienen es la forma en que obtienen la instancia. Lo que hacemos aquí es aplicar un patrón _Template_ para que la lógica común sea implementada por la clase base y únicamente el detalle de instanciar la dependencia sea realizado por cada subclase a su manera.

```typescript
abstract class Dependency<T> {
    protected readonly factory: factory<T>
    protected readonly dic: Dicky

    constructor(factory: factory<T>, dic: Dicky) {
        this.factory = factory
        this.dic = dic
    }

    resolve(): T {
        return this.getInstance()
    }

    protected abstract getInstance(): T
}

class Transient<T> extends Dependency<T> {
    protected getInstance() {
        return this.factory(this.dic)
    }

}

class Singleton<T> extends Dependency<T> {
    private instance: T | undefined

    protected getInstance(): T {
        if (!this.instance) {
            this.instance = this.factory(this.dic)
        }
        return this.instance
    }
}
```

## Conclusiones

Un contenedor de inyección de dependencias es algo bastante sencillo. Se trata básicamente de una colección de funciones constructoras que tienen la posibilidad de referirse al propio contenedor para resolver las dependencias que ellas mismas puedan necesitar. Por otro lado, el contenedor es capaz de gestionar y mantener instancias únicas para servicios compartidos.
