---
layout: post
subtitle: TDD outside-in con arquitectura hexagonal (2) 
title: London School, doble ciclo y comparativa
categories: articles
series: outside-in-ha
tags: software-design design-patterns typescript tdd hexagonal
---

[En el artículo anterior](/hexagonal-tdd-1/), vimos cómo aplicar TDD clásica a un caso de uso simple utilizando la
arquitectura hexagonal. En este artículo, vamos a aplicar TDD London School.

<!-- TOC -->
  * [TDD London School. Las primeras diferencias](#tdd-london-school-las-primeras-diferencias)
  * [Primer test](#primer-test)
  * [Moviéndonos hacia adentro](#moviéndonos-hacia-adentro)
  * [Una vez en verde, volvemos al ciclo externo](#una-vez-en-verde-volvemos-al-ciclo-externo)
  * [Y, otra vez, adentro](#y-otra-vez-adentro)
  * [Definiendo puertos secundarios](#definiendo-puertos-secundarios)
  * [Regresar al ciclo exterior](#regresar-al-ciclo-exterior)
  * [_Happy path_ finalizado, o casi](#_happy-path_-finalizado-o-casi)
  * [Turno de los _unhappy paths_](#turno-de-los-_unhappy-paths_)
    * [El producto no existe](#el-producto-no-existe)
    * [Algunos pensamientos hasta ahora](#algunos-pensamientos-hasta-ahora)
    * [El producto sin existencias](#el-producto-sin-existencias)
    * [Datos no válidos](#datos-no-válidos)
  * [Reflexiones sobre _Outside-in London School_](#reflexiones-sobre-_outside-in-london-school_)
<!-- TOC -->

## TDD London School. Las primeras diferencias

La primera diferencia práctica es que en TDD London School el primer test puede venirnos mejor si es un ejemplo de
_Happy Path_. Creo que esto se debe a que en este enfoque diseñamos antes de implementar la funcionalidad de forma
efectiva. Así, el _Happy Path_ nos va a requerir la presencia de todos los componentes que podamos necesitar, al menos
inicialmente.

En el enfoque clásico, preferimos empezar con casos que requieran cambios de código lo más pequeños posible antes de
tener que tomar decisiones de diseño. De este modo, atacar esos casos particulares es una buena forma de posponer
decisiones de más calado.

En muchas situaciones en las que he aplicado la metodología londinense mi primer test atacaba una API, que en
arquitectura hexagonal se expone mediante un adaptador de un puerto. Pero en esta ocasión voy a hablar directamente con
el puerto, lo que introduce alguna particularidad en el proceso. Básicamente, tengo que tener en cuenta algo que no
he considerado en el artículo anterior: el _configurador_.

## Primer test

El configurador es donde se construye la aplicación para que pueda funcionar y, en este caso, voy a decidir pronto qué
componentes necesitaré. Por ello me vendrá bien tener un lugar único en el que se monte todo lo necesario y así no tener
que toquetear mucho el test. Así que voy a empezar por algo como lo siguiente:

```typescript
function BuildGetCurrentStockHandler(): GetCurrentStockHandler {
    return new GetCurrentStockHandler()
}

describe('For Managing Products Port', () => {
    describe('When we ask the current stock of an existing product', () => {
        it('Should return a product stock object as response with available units', () => {
            const query = new GetCurrentStock('existing-product-id')
            const handler = BuildGetCurrentStockHandler()
            const result = handler.handle(query)
            const stock = result.unwrap()
            expect(stock).toEqual({
                id: 'existing-product-id',
                name: 'existing-product-name',
                stock: 10
            })
        })
    })
})
```

Este es el test de aceptación que definirá el bucle externo de TDD y que estará en rojo en tanto no hayamos completado
la funcionalidad. Cada fallo de este test debería ser capaz de decirnos qué es necesario hacer a continuación.

La función `BuildGetCurrentStockHandler` va a ser nuestro configurador por el momento, al menos en el contexto de este test

Al ejecutar el test nos dirá:

```plaintext
ReferenceError: GetCurrentStock is not defined
```

Lo que nos indica que lo primero que necesitamos es tener un objeto `GetCurrentStock`. En cada paso deberíamos añadir el
código mínimo necesario para que el test cambie de error, señalando otra acción que debamos realizar.

```typescript
class GetCurrentStock {
    constructor(productId: string) {

    }

}
```

Esto es suficiente por el momento. Al ejecutar el test otra vez tendremos el error esperado:

```plaintext
ReferenceError: GetCurrentStockHandler is not defined
```

Así que podemos crear `GetCurrentStockHandler` en su lugar adecuado, lanzando un error 'GetCurrentStockHandler.execute method not implemented.':

```typescript
export class GetCurrentStockHandler {
    handle(query: GetCurrentStock) {
        throw new Error('GetCurrentStockHandler.execute method not implemented.')
    }
}
```

Si ahora ejecutamos el test veremos que el error es `GetCurrentStockHandler.execute method not implemented.`. Al lanzar este error incondicionalmente, podemos saber de manera inequívoca que el método `handle` ha sido invocado y el test nos pide implementarlo.

## Moviéndonos hacia adentro

En este punto es cuando abandonamos el _ciclo exterior de aceptación_ y nos centramos en desarrollar `GetCurrentStockHandler`
mediante TDD clásica, aunque con matices. Para ello, necesitamos introducir otro test, que también se basa en ejecutar
`GetCurrentStockHandler`, pero desde otro punto de vista.

En el test de aceptación las dependencias serían reales o implementaciones adecuadas para test. Por ejemplo, un almacenamiento en memoria, o un SQLite para una base de datos.

En el test clásico, de tipo unitario, usaremos dobles de test (principalmente, _stubs_ y _espías_) cuando tengamos una dependencia que toca tecnología real. Como estamos en _arquitectura hexagonal_, esas dependencias serán adaptadores secundarios.

Así que inicialmente vamos a tener un test muy similar, pero que se construye de forma diferente. De entrada no usaremos el configurador que empezamos a escribir antes.

```typescript
describe('GetCurrentStockHandler', () => {
    describe('When we ask the current stock of an existing product', () => {
        it('Should return a product stock object as response with available units', () => {
            const query = new GetCurrentStock('existing-product-id')
            const handler = new GetCurrentStockHandler()
            const result = handler.handle(query)
            const stock = result.unwrap()
            expect(stock).toEqual({
                id: 'existing-product-id',
                name: 'existing-product-name',
                stock: 10
            })
        })
    })
})
```

Para implementar el código, partimos de que queremos tener unos ciertos elementos trabajando en este nivel. Algo así:

```typescript
export class GetCurrentStockHandler {
    private readonly inventory: Inventory

    constructor(inventory: Inventory) {
        this.inventory = inventory
    }

    handle(query: GetCurrentStock) {
        const productStock = this.inventory.stockById(query.productId)
        return GetCurrentStockResponse.withResult(productStock.print())
    }
}
```

Esto nos requiere crear varios objetos.

`Inventory`, que es un servicio al que le podemos preguntar sobre el estado de un producto y que tendrá sus propias
dependencias (que aún no hemos decidido). Nos devolverá un objeto `ProductStock`, que puede producir una representación
de su estado a través del método `print()`.

El resultado lo devolveremos encapsulado en un objeto `GetCurrentStockResponse`, que sería un patrón `Result`. Así que
tenemos que ir creando cosas hasta que el test falle de la manera que esperamos.

```typescript
export class ProductStock {
    private readonly productId: string
    private readonly productName: string
    private readonly quantity: number

    constructor(productId: string, productName: string, quantity: number) {
        this.productId = productId
        this.productName = productName
        this.quantity = quantity
    }

    print() {
        return {
            id: this.productId,
            name: this.productName,
            stock: this.quantity,
        }
    }
}
```

```typescript
import {GetCurrentStockHandler} from './GetCurrentStockHandler'

export class GetCurrentStockResponse {
    private readonly productStock: {} | null
    private readonly error: string | null

    constructor(productStock: {}, error: string | null) {
        this.productStock = productStock
        this.error = error
    }

    static withResult(result: {}) {
        return new GetCurrentStockResponse(result, null)
    }

    unwrap() {
        return this.productStock
    }
}
```

Ahora veamos `Inventory`. De momento nos valdría con que fuese un _stub_, lo que sirve para hacer pasar el test
unitario:

```typescript
export class Inventory {
    stockById(productId: string): ProductStock {
        return new ProductStock(
            'existing-product-id',
            'existing-product-name',
            10
        )
    }
}
```

Pero tal como está hecho, hace que pase el test de aceptación... y eso no nos interesa mucho. `Inventory` no debería
estar implementado en este momento.

```typescript
export class Inventory {
    stockById(productId: string): ProductStock {
        throw new Error('Inventory not implemented')
    }
}
```

Y en este test, lo que necesitamos es un doble, ya que aún no sabemos cómo implementarlo o qué dependencias va a tener,
que las tendrá.

Una solución es hacer un _Stub_ de `Inventory`. Para eso podríamos extraer la interfaz, pero para este caso, nos puede
valer hacerlo mediante herencia. Si no lo hacemos extrayendo la interfaz es porque este servicio no va a tener distintas
implementaciones intercambiables, pero nada nos lo impide.

```typescript
class InventoryStub extends Inventory {
    stockById(productId: string): ProductStock {
        return new ProductStock(
            'existing-product-id',
            'existing-product-name',
            10
        )
    }
}

describe('GetCurrentStockHandler', () => {
    describe('When we ask the current stock of an existing product', () => {
        it('Should return a product stock object as response with available units', () => {
            const query = new GetCurrentStock('existing-product-id')
            const handler = new GetCurrentStockHandler(new InventoryStub())
            const result = handler.handle(query)
            const stock = result.unwrap()
            expect(stock).toEqual({
                id: 'existing-product-id',
                name: 'existing-product-name',
                stock: 10
            })
        })
    })
})
```

## Una vez en verde, volvemos al ciclo externo

Lo importante es que ahora el test unitario no falla, mientras que el test de aceptación sigue haciéndolo, pero esta vez
porque `Inventory` no está participando.

```plaintext
TypeError: Cannot read properties of undefined (reading 'stockById')
    at GetCurrentStockHandler.handle
```

Esto pasa porque todavía no estamos construyendo debidamente `GetCurrentStockHandler`:

```typescript
function BuildGetCurrentStockHandler(): GetCurrentStockHandler {
    return new GetCurrentStockHandler()
}
```

Que debería ser:

```typescript
function BuildGetCurrentStockHandler(): GetCurrentStockHandler {
    return new GetCurrentStockHandler(new Inventory())
}
```

De modo que, ahora el test falla porque `Inventory` aún no está implementado.

```typescript
Error: Inventory Not implemented
```

## Y, otra vez, adentro

Y eso nos lleva a un nuevo ciclo de TDD clásica:

```typescript
describe('Inventory', () => {
    it('should return a ProductStock providing and id', () => {
        const inventory = new Inventory()
        let expected = new ProductStock(
            'existing-product-id',
            'existing-product-name',
            10
        )
        expect(inventory.stockById('existing-product-id')).toEqual(expected)
    })
})
```

Mi objetivo es hacer pasar el test con este código:

```typescript
export class Inventory {
    private readonly storage: ForStoringProducts

    constructor(storage: ForStoringProducts) {
        this.storage = storage
    }

    stockById(productId: string): ProductStock {
        const pId = ProductId.validatedFrom(productId)
        const productData = this.storage.getById(pId)

        return new ProductStock(
            productData.id,
            productData.name,
            productData.units,
        )
    }
}
```

## Definiendo puertos secundarios

Para empezar, tenemos que definir un puerto secundario. `Inventory.storage` va a tocar una tecnología real, por tanto,
`Inventory` hablará con ella a través de un puerto, que en nuestro ejemplo va a ser `ForStoringProducts`.

```typescript
export interface ForStoringProducts {
    getById(productId: string): Object | undefined
}
```

En el test necesitaremos un doble de esta interfaz, que será un _stub_:

```typescript
class ProductStorageStub implements ForStoringProducts {
    constructor() {
    }

    getById(productId: string): Object {
        return {
            id: 'existing-product-id',
            name: 'existing-product-name',
            stock: 10,
        }
    }
}

describe('Inventory', () => {
    it('should return a ProductStock providing and id', () => {
        const inventory = new Inventory(new ProductStorageStub())
        let expected = new ProductStock(
            'existing-product-id',
            'existing-product-name',
            10
        )
        expect(inventory.stockById('existing-product-id')).toEqual(expected)
    })
})
```

También tenemos `ProductId`, porque esperamos tener que validarlo en algún momento, aunque ahora el test no nos lo pide.

```typescript
export class ProductId {
    private readonly productId: string

    constructor(productId: string) {
        this.productId = productId
    }

    toString() {
        return this.productId
    }

    static validatedFrom(productId: string): ProductId {
        return new ProductId(productId)
    }
}
```

## Regresar al ciclo exterior

Todo este código nos permite hacer pasar el test de `Inventory`, pero ¿qué pasa con el test exterior?. Al ejecutarlo
nuevamente, fallará porque `Inventory` no se puede montar, ya que ahora requiere inyectarle un adaptador del puerto
`ForStoringProducts`. Este adaptador, por su parte, tiene que ser adecuado para usarse en este nivel de test. En este
caso, me parece ideal tener una implementación en memoria que sea funcional y permita guardar y recuperar objetos. Pero,
para empezar, hagamos esto:

```typescript
export class InMemoryProductStorage implements ForStoringProducts {
    getById(productId: string): Object | undefined {
        throw Error(`Implement InMemoryProductStorage.getById`)
    }
}
```

El test queda así, con su _configurador_ actualizado:

```typescript
function BuildGetCurrentStockHandler(): GetCurrentStockHandler {
    return new GetCurrentStockHandler(new Inventory(new InMemoryProductStorage()))
}

describe('For Managing Products Port', () => {
    describe('When we ask the current stock of an existing product', () => {
        it('Should return a product stock object as response with available units', () => {
            const query = new GetCurrentStock('existing-product-id')
            const handler = BuildGetCurrentStockHandler()
            const result = handler.handle(query)
            const stock = result.unwrap()
            expect(stock).toEqual({
                id: 'existing-product-id',
                name: 'existing-product-name',
                stock: 10
            })
        })
    })
})
```

Ahora, ejecutamos el test de nuevo y fallará con el error:

```plaintext
Error: Implement InMemoryProductStorage.getById
```

Que es la señal que necesitamos para irnos al ciclo unitario. Así que empezamos con algo sencillo:

```typescript
describe('InMemoryProductStorage', () => {
    it('should return undefined if object doesn\'t exist', () => {
        const storage = new InMemoryProductStorage()
        expect(storage.getById('ramdom-product-id')).toBeUndefined()
    })
})
```

```typescript
export class InMemoryProductStorage implements ForStoringProducts {
    getById(productId: string): Object | undefined {

    }
}
```

Mi plan para este adaptador, o más bien actor porque puede hablar directamente con el puerto, es pasarle una colección
de objetos en construcción de forma que pueda definir escenarios apropiados en cada caso:

```typescript
describe('InMemoryProductStorage', () => {
    it('should return undefined if object doesn\'t exist', () => {
        const storage = new InMemoryProductStorage(new Map<string, Object>())
        expect(storage.getById('ramdom-product-id')).toBeUndefined()
    })

    it('should return objects stored', () => {
        const examples = new Map<string, Object>([
            ['pr-0001', {id: 'pr-0001', name: 'First product', stock: 100}],
        ])
        const storage = new InMemoryProductStorage(examples)
        expect(storage.getById('pr-0001')).toEqual(
            {id: 'pr-0001', name: 'First product', stock: 100}
        )
    })
})
```

Esto es bastante sencillo de pasar:

```typescript
export class InMemoryProductStorage implements ForStoringProducts {
    private products: Map<string, Object>

    constructor(examples: Map<string, Object>) {
        this.products = examples
    }

    getById(productId: string): Object | undefined {
        return this.products.get(productId)
    }
}
```

Hay un _temilla_ con los tipos de los objetos genéricos que se guardan aquí, pero no quiero meterme ahora en esa discusión
para no desviarnos del tema principal, que es el ciclo de desarrollo.

De hecho, tengo que volver al test exterior, que se quejará. Por un lado, tengo que poblar el `Storage` con algunos
ejemplos, ya que si intento ejecutarlo así, fallará porque no hay nada guardado.

```typescript
function BuildGetCurrentStockHandler(): GetCurrentStockHandler {
    const examples = new Map<string, Object>([
        ['existing-product-id', {
            id: 'existing-product-id',
            name: 'existing-product-name',
            stock: 10
        }]
    ])
    return new GetCurrentStockHandler(
        new Inventory(
            new InMemoryProductStorage(
                examples
            )
        )
    )
}

describe('For Managing Products Port', () => {
    describe('When we ask the current stock of an existing product', () => {
        it('Should return a product stock object as response with available units', () => {
            const query = new GetCurrentStock('existing-product-id')
            const handler = BuildGetCurrentStockHandler()
            const result = handler.handle(query)
            const stock = result.unwrap()
            expect(stock).toEqual({
                id: 'existing-product-id',
                name: 'existing-product-name',
                stock: 10
            })
        })
    })
})
```

Y, finalmente, este test pasa, indicándonos que la funcionalidad está implementada.

## _Happy path_ finalizado, o casi

Esta es la estructura:

```plaintext
src
├── driven
│   └── forStoringProducts
│       └── InMemoryProductStorage.ts
├── index.ts
└── inventory
    ├── Inventory.ts
    ├── ProductId.ts
    ├── ProductStock.ts
    ├── forManagingProducts
    │   ├── GetCurrentStock.ts
    │   ├── GetCurrentStockHandler.ts
    │   └── GetCurrentStockResponse.ts
    └── forStoringProducts
        └── ForStoringProducts.ts

5 directories, 9 files
```

Pero también tenemos más tests:

```plaintext
test
├── GetCurrentStock.test.ts
├── InMemoryProductStorage.test.ts
├── Inventory.test.ts
└── index.test.ts

0 directories, 4 files
```

Hay un poco de desorden todavía y algunas decisiones que no están cerradas del todo. En lo que toca a estructura de
carpetas voy a aplicar dos cambios:

* Poner los tests cerca del código que testean
* Agrupar los puertos en carpetas `driven` y `driving`, así como empaquetar los archivos por prestación.

Vamos a ver cómo queda:

```plaintext
src
├── driven
│   └── forStoringProducts
│       ├── InMemoryProductStorage.test.ts
│       └── InMemoryProductStorage.ts
├── index.ts
└── inventory
    ├── Inventory.test.ts
    ├── Inventory.ts
    ├── ProductId.ts
    ├── ProductStock.ts
    ├── driven
    │   └── forStoringProducts
    │       └── ForStoringProducts.ts
    └── driving
        └── forManagingProducts
            └── getCurrentStock
                ├── GetCurrentStock.test.ts
                ├── GetCurrentStock.ts
                ├── GetCurrentStockHandler.ts
                └── GetCurrentStockResponse.ts

8 directories, 12 files
```

Y aquí la carpeta de tests:

```plaintext
test
└── e2e
    └── getProductStock.test.ts

1 directory, 1 file
```

Ahora la carpeta test se va a dedicar a los tests _desde fuera_, que manejan la aplicación como un todo, que agruparé
como tests `e2e`. Podría, en el futuro, haber una carpeta `integration`, en la que podría ejecutar tests desde
adaptadores primarios. Los tests que podríamos considerar _unitarios_, los pongo cerca del código.

## Turno de los _unhappy paths_

Por supuesto tenemos que ocuparnos de los flujos de ejecución fallidos. En el artículo anterior, los implementamos primero, porque en la aproximación clásica nos favorece al evitar tomar decisiones de diseño tempranas.

La ventaja en el caso de London es que ahora es relativamente fácil introducir los cambios necesarios. Obviamente, con un test.

La pregunta ahora puede ser: ¿qué test? ¿Debemos seguir con el doble ciclo? Siendo purista, tiene sentido hacerlo, aunque en la práctica creo que se puede tener cierta flexibilidad. Vamos a verlo con un primer ejemplo.

### El producto no existe

Vamos a introducir el caso de que el producto no existe. El test exterior podría ser este. No necesitamos añadir otros productos al storage, como es lógico:

```typescript
describe('For Managing Products Port', () => {
    describe('When we ask the current stock of an existing product', () => {
        // Removed for clarity
    })

    describe('When we ask the current stock of a non existing product', () => {
        it('Should return an error', () => {
            const query = new GetCurrentStock('no-existing-product-id')
            const handler = BuildGetCurrentStockHandler()
            const result = handler.handle(query)
            expect(() => {result.unwrap()}).toThrowError()
            expect(result.errorMessage()).toEqual('Product Id no-existing-product-id doesn\'t exist')
        })
    })
})
```

Al ejecutar el test, el error es el siguiente. Aquí podemos ver 

```plaintext
TypeError: Cannot read properties of undefined (reading 'id')
at Inventory.stockById (/Users/frankie/Documents/Katas/inventory/src/inventory/Inventory.ts:17:25)
at GetCurrentStockHandler.handle (/Users/frankie/Documents/Katas/inventory/src/inventory/driving/forManagingProducts/getCurrentStock/GetCurrentStockHandler.ts:13:45)
at /Users/frankie/Documents/Katas/inventory/test/e2e/getProductStock.test.ts:44:36
```

Error que básicamente nos dice que `Inventory.stockById` no encuentra nada que devolver y, por tanto, `GetCurrentStockHandler` recibe `undefined` y no puede gestionar eso.

`Inventory` no tiene código que gestione la posibilidad de que `this.storage.getById` devuelva `undefined`. Debería chequear eso y lanzar una excepción, ya que declara que siempre devolverá un `ProductStock`.

```typescript
export class Inventory {
    private readonly storage: ForStoringProducts

    constructor(storage: ForStoringProducts) {
        this.storage = storage
    }

    stockById(productId: string): ProductStock {
        const pId = ProductId.validatedFrom(productId)
        const productData = this.storage.getById(productId.toString())

        return new ProductStock(
            productData.id,
            productData.name,
            productData.stock,
        )
    }
}
```

Así que, por un lado, tenemos un test que ejercita el caso de uso, revelando un problema en un lugar preciso del código. Esto nos viene a indicar que lo apropiado sería modificar `Inventory` para tirar una excepción si no encuentra el producto pedido. Algo que podemos hacer con TDD clásica en el nivel unitario:

```typescript
class ProductStorageStub implements ForStoringProducts {
    constructor() {
    }

    getById(_: string): Object | undefined {
        return {
            id: 'existing-product-id',
            name: 'existing-product-name',
            stock: 10,
        }
    }
}

class ProductStorageNoProductStub implements ForStoringProducts {
    constructor() {}

    getById(_: string): Object | undefined {
        return undefined
    }
}

describe('Inventory', () => {
    it('should return a ProductStock providing and id', () => {
        const inventory = new Inventory(new ProductStorageStub())
        let expected = new ProductStock(
            'existing-product-id',
            'existing-product-name',
            10
        )
        expect(inventory.stockById('existing-product-id')).toEqual(expected)
    })

    it('should throw Error if no product found', () => {
        const inventory = new Inventory(new ProductStorageNoProductStub())
        expect(() => {
            inventory.stockById('no-existing-product-id')
        }).toThrowError(UnknownProduct)
    })
})
```

Como se puede ver, utilizo dos _stubs_, uno para cada caso. El código que hace pasar el test es el siguiente:

```typescript
export class Inventory {
    private readonly storage: ForStoringProducts

    constructor(storage: ForStoringProducts) {
        this.storage = storage
    }

    stockById(productId: string): ProductStock {
        const pId = ProductId.validatedFrom(productId)
        const productData = this.storage.getById(productId.toString())

        if (!productData) {
            throw new UnknownProduct(productId)
        }

        return new ProductStock(
            productData.id,
            productData.name,
            productData.stock,
        )
    }
}
```

Y aquí la definición del error:

```typescript
export class UnknownProduct implements Error {
    message: string
    name: string


    constructor(productId: string) {
        this.name = 'UnknownProduct'
        this.message = `Product Id ${productId} doesn't exist`
    }
}
```

Y con este test pasando, volvemos al exterior.

Con los cambios que hemos realizado, al ejecutar el test exterior, vemos que ahora tenemos otro mensaje de error diferente:

```plaintext
Product Id non-existing-product-id doesn't exist
```

Como estamos tirando una excepción, esta llega hasta el test dado que no hay ningún código que la intercepte. Esto me sugiere que la deberíamos capturar en el Handler y devolver la respuesta correspondiente. Para eso, un nuevo test unitario, que siendo muy parecido al test exterior, es sutilmente distinto:

```typescript
class InventoryStub extends Inventory {
    // Code removed for clarity
}

class InventoryUnknownProductStub extends Inventory {
    constructor() {
        super({} as ForStoringProducts)
    }

    stockById(productId: string): ProductStock {
        throw new UnknownProduct(productId)
    }
}

describe('GetCurrentStockHandler', () => {
    describe('When we ask the current stock of an existing product', () => {
        it('Should return a product stock object as response with available units', () => {
            // Code removed for clarity
        })
    })

    describe('When we ask the current stock of a non existing product', () => {
        it('Should return an error', () => {
            const query = new GetCurrentStock('no-existing-product-id')
            const handler = new GetCurrentStockHandler(new InventoryUnknownProductStub())
            const result = handler.handle(query)
            expect(() => {result.unwrap()}).toThrowError()
            expect(result.errorMessage()).toEqual('Product Id no-existing-product-id doesn\'t exist')
        })
    })
})
```

De nuevo, uso _stubs_ específicos para cada caso, a fin de mantenerlos simples y fáciles de entender.

Para hacer pasar el test, introduzco el siguiente código:

```typescript
export class GetCurrentStockResponse {
    private readonly productStock: {} | null
    private readonly error: string | null

    constructor(productStock: {} | null, error: string | null) {
        this.productStock = productStock
        this.error = error
    }

    static withError(message: string) {
        return new GetCurrentStockResponse(null, message)
    }

    static withResult(result: {}) {
        return new GetCurrentStockResponse(result, null)
    }

    unwrap() {
        if (this.error && !this.productStock) {
           throw new Error(this.error)
        }
        return this.productStock
    }

    errorMessage(): string {
        return this.error!
    }
}
```

Y esto en el Handler:

```typescript
export class GetCurrentStockHandler {
    private readonly inventory: Inventory

    constructor(inventory: Inventory) {
        this.inventory = inventory
    }

    handle(query: GetCurrentStock) {
        try {
            const productStock = this.inventory.stockById(query.productId)
            return GetCurrentStockResponse.withResult(productStock.print())
        } catch (e: unknown) {
            if (e instanceof UnknownProduct) {
                return GetCurrentStockResponse.withError((e as UnknownProduct).message)
            }
        }
    }
}
```

De paso que estoy aquí, me doy cuenta de que me vendría bien _tipar_ lo que devuelve el método `handle`. Al hacerlo, el linter protesta un poco porque hay un flujo en el que no se devuelve nada. Lo podemos forzar añadiendo soporte a un error genérico, lo que, por otra parte, sirve para capturar cualquier error que pueda venir.

```typescript
export class GetCurrentStockHandler {
    private readonly inventory: Inventory

    constructor(inventory: Inventory) {
        this.inventory = inventory
    }

    handle(query: GetCurrentStock): GetCurrentStockResponse {
        try {
            const productStock = this.inventory.stockById(query.productId)
            return GetCurrentStockResponse.withResult(productStock.print())
        } catch (e: unknown) {
            if (e instanceof UnknownProduct) {
                return GetCurrentStockResponse.withError((e as UnknownProduct).message)
            }
            return GetCurrentStockResponse.withError((e as Error).message)
        }
    }
}
```

Es hora de preguntarse si el test exterior ya vuelve a pasar. Efectivamente, lo hace.

### Algunos pensamientos hasta ahora

Al principio de este apartado me estaba preguntando si los tests se sentirían redundantes. Sin embargo, me he dado cuenta de algunos detalles interesantes:

* El test exterior ha ido señalando en qué lugares intervenir y qué era necesario hacer.
* Cada test unitario tenía un objetivo muy preciso.
* Escribir el código requerido resultaba también muy sencillo.

Una cosa que también me vino a la mente es que esta metodología es ideal para capturar bugs. Necesitas tener todos los tests, pero una vez que escribas el test exterior, los mensajes de error te irán señalando el camino.

### El producto sin existencias

Otro caso que genera un error es el del producto sin existencias. En un contexto real seguramente podríamos debatir si este es un caso de error, pero este ejercicio lo incluye para ilustrar diferentes situaciones.

Por supuesto, empezamos agregando el test exterior.

```typescript
describe('For Managing Products Port', () => {
    describe('When we ask the current stock of an existing product', () => {
        it('Should return a product stock object as response with available units', () => {
            // Code removed for clarity
        })
    })

    describe('When we ask the current stock of a non existing product', () => {
        it('Should return an error', () => {
            // Code removed for clarity
        })
    })

    describe('When we ask the current stock of an exhausted product', () => {
        it('Should return an error', () => {
            const query = new GetCurrentStock('exhausted-product-id')
            const handler = BuildGetCurrentStockHandler()
            const result = handler.handle(query)
            expect(() => {result.unwrap()}).toThrowError(Error)
            expect(result.errorMessage()).toEqual('Product Id exhausted-product-id exhausted')
        })
    })
})
```

Para pasar este test, necesitamos añadir un ejemplo de producto en el almacén:

```typescript
function BuildGetCurrentStockHandler(): GetCurrentStockHandler {
    const examples = new Map<string, Object>([
        ['existing-product-id', {
            id: 'existing-product-id',
            name: 'existing-product-name',
            stock: 10
        }],
        ['exhausted-product-id', {
            id: 'exhausted-product-id',
            name: 'exhausted-product-name',
            stock: 0
        }]
    ])
    return new GetCurrentStockHandler(
        new Inventory(
            new InMemoryProductStorage(
                examples
            )
        )
    )
}
```

El mensaje del test es:

```plaintext
AssertionError: expected function to throw an error, but it didn't
```

Que básicamente nos indica que el producto se ha encontrado, pero como esperamos un error, el test tiene que fallar.

En este caso tenemos que ir al Handler, ya que Inventory es quien devuelve o no productos, por lo que para decidir si está agotado tenemos que preguntarle al propio producto. Por tanto, vamos a un test unitario de `GetCurrentStockHandler`, en el que introducimos un nuevo stub de `Inventory`.

```typescript
class InventoryExhaustedProductStub extends Inventory {
    constructor() {
        super({} as ForStoringProducts)
    }

    stockById(productId: string): ProductStock {
        return new ProductStock(
            'existing-product-id',
            'existing-product-name',
            0
        )
    }
}

describe('GetCurrentStockHandler', () => {
    describe('When we ask the current stock of an existing product', () => {
        it('Should return a product stock object as response with available units', () => {
            // Code removed for clarity
        })
    })

    describe('When we ask the current stock of a non existing product', () => {
        it('Should return an error', () => {
            // Code removed for clarity
        })
    })

    describe('When we ask the current stock of an exhausted product', () => {
        it('Should return an error', () => {
            const query = new GetCurrentStock('exhausted-product-id')
            const handler = new GetCurrentStockHandler(new InventoryExhaustedProductStub())
            const result = handler.handle(query)
            expect(() => {result.unwrap()}).toThrowError()
            expect(result.errorMessage()).toEqual('Product Id exhausted-product-id exhausted')
        })
    })
})
```

El test falla porque espera que se lance un error al intentar obtener el resultado.

```typescript
export class GetCurrentStockHandler {
    private readonly inventory: Inventory

    constructor(inventory: Inventory) {
        this.inventory = inventory
    }

    handle(query: GetCurrentStock): GetCurrentStockResponse {
        try {
            const productStock = this.inventory.stockById(query.productId)

            if (productStock.isExhausted()) {
                return GetCurrentStockResponse.withError(`Product Id ${query.productId} exhausted`)
            }

            return GetCurrentStockResponse.withResult(productStock.print())
        } catch (e: unknown) {
            if (e instanceof UnknownProduct) {
                return GetCurrentStockResponse.withError((e as UnknownProduct).message)
            }
            return GetCurrentStockResponse.withError((e as Error).message)
        }
    }
}
```

Y necesitamos introducir el método `isExhausted`:

```typescript
export class ProductStock {
    private readonly productId: string
    private readonly productName: string
    private readonly quantity: number

    constructor(productId: string, productName: string, quantity: number) {
        this.productId = productId
        this.productName = productName
        this.quantity = quantity
    }

    isExhausted() {
        return this.quantity === 0
    }

    print() {
        return {
            id: this.productId,
            name: this.productName,
            stock: this.quantity,
        }
    }
}
```

Con este código pasa el test, y también pasa el test exterior.

### Datos no válidos

En el primer artículo tocamos el tema del identificador no válido de producto, es un caso que también podríamos tratar ahora. En parte es un ejemplo de producto que no existe, pero lo mejor es introducir un test:

```typescript
describe('For Managing Products Port', () => {
    describe('When we ask the current stock of an existing product', () => {
        it('Should return a product stock object as response with available units', () => {
            // Code removed for clarity
        })
    })

    describe('When we ask the current stock of a non existing product', () => {
        it('Should return an error', () => {
            // Code removed for clarity
        })
    })

    describe('When we ask the current stock of an exhausted product', () => {
        it('Should return an error', () => {
            // Code removed for clarity
        })
    })

    describe('When we ask with an invalid product id', () => {
        it('Should return an error', () => {
            const query = new GetCurrentStock('')
            const handler = BuildGetCurrentStockHandler()
            const result = handler.handle(query)
            expect(() => {result.unwrap()}).toThrowError(Error)
            expect(result.errorMessage()).toEqual('Invalid Product Id []')
        })
    })
})
```

En este caso, tendremos este error:

```plaintext
AssertionError: expected 'Product Id  doesn\'t exist' to deeply equal 'Invalid Product Id []'
Expected :Invalid Product Id []
Actual   :Product Id  doesn't exist
```

El lugar adecuado para poner el control es en `ProductId.validatedFrom()` y lanzar el error ahí. Esto lo podemos hacer con el test unitario:

```typescript
export class InvalidProductId implements Error {
    name: string;
    message: string;

    constructor(productId: string) {
        this.name = productId;
        this.message = `Invalid Product Id [${productId}]`
    }
}
```

Que se puede hacer pasar con este código:

```typescript
export class InvalidProductId implements Error {
    name: string;
    message: string;

    constructor(productId: string) {
        this.name = productId;
        this.message = `Invalid Product Id [${productId}]`
    }
}
```
```typescript
import {InvalidProductId} from './InvalidProductId'

export class ProductId {
    private readonly productId: string

    constructor(productId: string) {
        this.productId = productId
    }

    static validatedFrom(productId: string): ProductId {
        if (productId.length === 0) {
            throw new InvalidProductId(productId)
        }
        return new ProductId(productId)
    }
    
    toString() {
        return this.productId
    }
}
```

Y el test exterior también pasa, con lo que terminamos nuestro trabajo. Esta es la estructura que resultante:

```plaintext
src
├── driven
│   └── forStoringProducts
│       ├── InMemoryProductStorage.test.ts
│       └── InMemoryProductStorage.ts
├── index.ts
└── inventory
    ├── InvalidProductId.ts
    ├── Inventory.test.ts
    ├── Inventory.ts
    ├── ProductId.test.ts
    ├── ProductId.ts
    ├── ProductStock.ts
    ├── UnknownProduct.ts
    ├── driven
    │   └── forStoringProducts
    │       └── ForStoringProducts.ts
    └── driving
        └── forManagingProducts
            └── getCurrentStock
                ├── GetCurrentStock.test.ts
                ├── GetCurrentStock.ts
                ├── GetCurrentStockHandler.ts
                └── GetCurrentStockResponse.ts

8 directories, 15 files
```

Puedes ver [el código aquí](https://github.com/franiglesias/inventory/pull/2). En este artículo he sido menos cuidadoso y no lo tengo detallado por commits.

## Reflexiones sobre _Outside-in London School_

Fricciones al inicio. Con frecuencia mi proceso de desarrollo con _Outside-in London School_ empieza más afuera de lo que he ejemplificado en este artículo. En términos de Arquitectura Hexagonal estaría escribiendo un test que ejercita un adaptador primario (API Rest, CLI...), así como adaptadores secundarios. Pero tratando de ser más fieles al patrón, el
test tendría que hablar directamente con el puerto primario y contar con adaptadores secundarios adecuados para reemplazar tecnologías reales.

En ese caso, se puede generar un poco de confusión. El test de aceptación, que ejercita la prestación completa, requiere adaptadores secundarios que sean realistas, implementando el puerto de forma completa. Por otro lado, los test unitarios necesitan dobles de test como _stubs_ y espías, cuando necesitamos implementaciones de esos adaptadores.

En el artículo hemos podido ver un caso un poco ambigüo: el Caso de Uso, que es quien efectúa la interacción con el puerto primario desde el interior de la aplicación se testea como "puerto" en el test externo de aceptación, y se testea también unitariamente para diseñarlo.

Diseño antes, el necesario. Esta escuela de TDD presupone un cierto nivel de diseño previo. A decir verdad, en cualquier aplicación que ya exista o bien en cualquier aplicación que intente seguir un cierto patrón de arquitectura, ya hay unas decisiones de diseño tomadas. En nuestro caso, es seguir el patrón de Arquitectura Hexagonal, por lo que ya sabemos o prevemos que vamos a necesitar ciertos elementos, y organizarlos de cierta manera. Son los detalles específicos de cada prestación lo que iremos descubriendo o definiendo durante el desarrollo.

Así que cuando empezamos a escribir código, ya vemos que tendremos que escribir bastantes elementos, aunque los dejemos vacíos de implementación a la espera de que los distintos tests nos pidan completarlos.

Empezar a testear por el _Happy Path_ se siente natural en este enfoque, ya que nos permite poner en su lugar la mayor parte de los elementos que esperamos necesitar, sin perjuicio de que nuevos tests nos hagan modificar el diseño inicial.

Algo que destacaría es que una vez establecida la estructura general, añadir casos particulares para el tratamiento de errores resulta muy sencillo. Y, como he indicado antes, se adecúa muy bien a la resolución de bugs. Podemos reproducir el bug reportado usando el test exterior, y no tenemos más que seguir las pistas que nos señala para localizar en dónde tendríamos que intervenir.

