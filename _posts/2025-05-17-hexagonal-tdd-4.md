---
layout: post
title: TDD outside-in con arquitectura hexagonal 4
categories: articles
tags: software-design design-patterns typescript tdd hexagonal
---

Retomo en este artículo el repaso al desarrollo de una aplicación diseñada con Arquitectura Hexagonal y dirigida por tests.


<!-- TOC -->
  * [La tercera vía outside-in](#la-tercera-vía-outside-in)
  * [Walking Skeleton Mix](#walking-skeleton-mix)
  * [Empezando con un test](#empezando-con-un-test)
  * [Configurator](#configurator)
  * [Empezando a colocar la funcionalidad](#empezando-a-colocar-la-funcionalidad)
    * [De constante a variable, o algo así](#de-constante-a-variable-o-algo-así)
    * [Delegando](#delegando)
    * [Un nuevo salto](#un-nuevo-salto)
    * [Finalmente, guardamos el producto](#finalmente-guardamos-el-producto)
  * [Una tercera vía TDD outside-in, o no](#una-tercera-vía-tdd-outside-in-o-no)
<!-- TOC -->

## La tercera vía outside-in

¿Se puede hablar de que existe una tercera vía entre los enfoques clasicista y London School de TDD outside-in? La verdad es que no lo sé, pero en la práctica, ser demasiado puristas nos puede llevar a callejones de los que es difícil salir. Por eso, si bien conocer las prácticas, sus características y sus limitaciones es importantísimo, es responsabilidad nuestra decidir qué herramientas utilizar y cuándo saltarse las reglas.

Como he mencionado en los artículos anteriores de la serie, la vía clasicista me había llevado a peores decisiones en la descomposición en objetos, mientras que la vía londinense, al priorizar la descomposición sobre la implementación, me obligaba a tener en cuenta el diseño general de la arquitectura. Con la primera se trata de tener la funcionalidad o comportamiento establecido cuanto antes. Con la segunda, nos interesa que esa funcionalidad esté bien construida desde el principio, aunque pospongamos las decisiones de implementación.

También señalamos que una de las críticas que recibe London School es el uso de _mocks_ como herramientas para diseñar la comunicación o interfaz entre objetos. Introducimos estos _mocks_ en tanto no tenemos implementaciones concretas, lo que hace que se tengan muchas dudas acerca de la fragilidad de estos tests, pues estarían acoplados a la implementación. Personalmente, no es una cuestión que me quite el sueño, pues nada me impide optar por soluciones que minimicen ese potencial efecto negativo, ya sea usar dobles de test que sean implementaciones limitadas de las interfaces, o reemplazando los mocks por objetos _reales_ o fakes en el refactor posterior.

En parte, creo que la discusión, en último término, gira en torno a si usar librerías de _mocks_ o no usarlas, empleando implementaciones reducidas de las interfaces, que es más o menos lo que propone James Shore con sus Nullables.

## Walking Skeleton Mix

Alistair Cockburn sugiere usar la metáfora del Walking Skeleton para desarrollar aplicaciones en el libro de Hexagonal Architecture Explained. 

La idea de usar un Walking Skeleton es empezar disponiendo los elementos más importantes de la arquitectura con el comportamiento mínimo necesario para que funcionen. No para implementar la funcionalidad, sino para que el sistema pueda levantarse y dar una respuesta. Posteriormente, iremos colgando la funcionalidad requerida (el músculo) en ese esqueleto.

Si combinamos esto con una metodología TDD nos sale algo que podría estar a medio camino entre la aproximación clásica y la londinense, tomando un poco de cada una. Y esto es lo que voy a intentar explicar a continuación. En este caso, vamos a desarrollar la capacidad de añadir productos a nuestro almacén.

## Empezando con un test

Este es el borrador del test que estoy buscando. De entrada, este test me expone una serie de problemas, que comento después del código:

```typescript
describe('For Managing Products Port', () => {
    describe('When we add a product that is not in our database', () => {
        it('should store in the database so I can get its information', () => {
            const command = new AddProduct('ProductName', 100)
            const handler = new AddProductHandler()
            const result = handler.handle(command)
            const newProductId = result.unwrap()

            const query = new GetCurrentStock(newProductId)
            const handler = BuildGetCurrentStockHandler()
            const result = handler.handle(query)
            const stock = result.unwrap()
            expect(stock).toEqual({
                id: newProductId,
                name: 'ProductName',
                stock: 100
            })
        })
    })
})
```

Para verificar que el producto ha sido guardado, lo mejor que puedo hacer es interrogar al sistema para que me lo proporcione por sus propios medios. Por eso le lanzo la query GetCurrentStock, funcionalidad que ya tenemos implementada. Esto podríamos extraerlo para aligerar el test.

Por otro lado, tenemos la función `GetCurrentStockHandler`, que si recuerdas, era nuestro _proto-Configurator_. En todo caso, necesitaremos pasar la misma instancia del adaptador de base de datos a `AddProductHandler` para que el test funcione, pues se ha de escribir y leer en el mismo almacenamiento. Eso nos va a requerir desarrollar un poco más la capacidad del _Configurator_, para que se encargue de montar ambos _Handlers_ y todo lo que venga en el futuro.

Otro comentario que hay que hacer es que `AddProductHandler`, pese a ser un comando, va a devolver un objeto de respuesta que contendrá el `id` asignado al nuevo producto, o el error que se haya producido en caso de fallo.

Vamos a ello.

## Configurator

Empezaré preparando el configurador. Lo que tenemos es lo siguiente:

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

Esencialmente, necesito separar la instanciación de `InMemoryProductStorage`, de modo que pueda pasar la misma instancia a todos los objetos que la necesiten. Esto lo hago en dos pasos. En el primero, simplemente extraigo una variable:

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
    const inMemoryProductStorage = new InMemoryProductStorage(
        examples
    )
    return new GetCurrentStockHandler(
        new Inventory(
            inMemoryProductStorage
        )
    )
}
```

Bien mirado podríamos hacer lo mismo con `Inventory`, que es lo que realmente le pasamos a `GetCurrentStockHandler`. `Inventory` es un servicio al que le preguntamos sobre el `Stock` de productos, así que es posible que incorpore también la funcionalidad de guardarlos.

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
    const inMemoryProductStorage = new InMemoryProductStorage(
        examples
    )
    const inventory = new Inventory(
        inMemoryProductStorage
    )
    return new GetCurrentStockHandler(
        inventory
    )
}
```

En este punto, me interesa más tener un objeto `InventoryConfigurator` que una función, por lo que voy a introducirlo y moverle esta funcionalidad. Después de darle unas vueltas, consigo lo siguiente. Es como un contenedor de inyección de dependencias rudimentario, pero suficiente para lo que necesitamos en este momento.

```typescript
export class InventoryConfigurator {
    private readonly storage: InMemoryProductStorage
    private readonly inventory: Inventory

    constructor(storage: InMemoryProductStorage, inventory: Inventory) {
        this.storage = storage
        this.inventory = inventory
    }

    static forTest(): InventoryConfigurator {
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
        const inMemoryProductStorage = new InMemoryProductStorage(
            examples
        )
        const inventory = new Inventory(
            inMemoryProductStorage
        )
        return new InventoryConfigurator(
            inMemoryProductStorage,
            inventory
        )
    }

    buildGetCurrentStockHandler(): GetCurrentStockHandler {
        return new GetCurrentStockHandler(
            this.inventory
        )
    }
}
```

Y aquí tenemos un ejemplo de su uso en el test del artículo anterior:

```typescript
describe('For Managing Products Port', () => {
    let configurator: InventoryConfigurator

    beforeAll(async () => {
        configurator = InventoryConfigurator.forTest()
    })
    describe('When we ask the current stock of an existing product', () => {
        it('Should return a product stock object as response with available units', () => {
            const query = new GetCurrentStock('existing-product-id')
            const handler = configurator.buildGetCurrentStockHandler()
            const result = handler.handle(query)
            const stock = result.unwrap()
            expect(stock).toEqual({
                id: 'existing-product-id',
                name: 'existing-product-name',
                stock: 10
            })
        })
    })

    describe('When we ask the current stock of a non existing product', () => {
        it('Should return an error', () => {
            const query = new GetCurrentStock('non-existing-product-id')
            const handler = configurator.buildGetCurrentStockHandler()
            const result = handler.handle(query)
            expect(() => {
                result.unwrap()
            }).toThrowError(Error)
            expect(result.errorMessage()).toEqual('Product Id non-existing-product-id doesn\'t exist')
        })
    })

    describe('When we ask the current stock of an exhausted product', () => {
        it('Should return an error', () => {
            const query = new GetCurrentStock('exhausted-product-id')
            const handler = configurator.buildGetCurrentStockHandler()
            const result = handler.handle(query)
            expect(() => {
                result.unwrap()
            }).toThrowError(Error)
            expect(result.errorMessage()).toEqual('Product Id exhausted-product-id exhausted')
        })
    })

    describe('When we ask with an invalid product id', () => {
        it('Should return an error', () => {
            const query = new GetCurrentStock('')
            const handler = configurator.buildGetCurrentStockHandler()
            const result = handler.handle(query)
            expect(() => {
                result.unwrap()
            }).toThrowError(Error)
            expect(result.errorMessage()).toEqual('Invalid Product Id []')
        })
    })
})
```

Pero lo que queremos es añadir productos, así que volvamos al test inicial, actualizado con el configurador y separando el chequeo de que el producto ha sido añadido:

```typescript
describe('For Managing Products Port', () => {
    let configurator: InventoryConfigurator
    beforeAll(async () => {
        configurator = InventoryConfigurator.forTest()
    })

    function expectProductWasStored(newProductId: string, newProductName: string, newProductQuantity: number) {
        const query = new GetCurrentStock(newProductId)
        const handler = configurator.buildGetCurrentStockHandler()
        const result = handler.handle(query)
        const stock = result.unwrap()
        expect(stock).toEqual({
            id: newProductId,
            name: newProductName,
            stock: newProductQuantity
        })
    }

    describe('When we add a product that is not in our database', () => {
        it('should store in the database so I can get its information', () => {
            const command = new AddProduct('ProductName', 100)
            const handler = configurator.buildAddProductHandler()
            const result = handler.handle(command)
            const newProductId = result.unwrap()
            expectProductWasStored(newProductId, 'ProductName', 100)
        })
    })
})
```

Añadamos lo necesario para que el test pueda ejecutarse. Para ello, lo voy lanzando y añado cada cosa que me dice que falta. Primero el comando:

```typescript
export class AddProduct {
    public readonly productName: string
    public readonly initialQuantity: number

    constructor(productName: string, initialQuantity: number) {
        this.productName = productName
        this.initialQuantity = initialQuantity
    }
}
```

A continuación, añadimos un método al configurador para que nos instancie el handler:

```typescript
buildAddProductHandler() {
        return new AddProductHandler()
    }
```

Y ahora creamos el Handler:

```typescript
export class AddProductHandler {
    handle(command: AddProduct) {
        
    }
}
```

Vamos colocando todo en su sitio, de modo que la estructura queda así:

```plaintext
src
├── InventoryConfigurator.ts
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
            ├── addProduct
            │   ├── AddProduct.ts
            │   └── AddProductHandler.ts
            └── getCurrentStock
                ├── GetCurrentStock.test.ts
                ├── GetCurrentStock.ts
                ├── GetCurrentStockHandler.ts
                └── GetCurrentStockResponse.ts

9 directories, 18 files
```

Si ahora ejecutamos los tests, podemos ver que fallan de la siguiente forma:

```plaintext
TypeError: Cannot read properties of undefined (reading 'unwrap')
```

Esto es porque el test espera que se devuelva un objeto con la capacidad de responder al mensaje `unwrap` y devolvernos un string. El objeto será `AddProductResponse`, siguiendo el patrón `Result`.

```typescript
export class AddProductResponse {
    unwrap(): string {
        return 'new-product-id'
    }
}
```

```typescript
export class AddProductHandler {
    handle(command: AddProduct) {
        return new AddProductResponse()
    }
}
```

Y ejecutando el test, tenemos el siguiente error, que ya es el fallo que queremos que tenga el test, pues indica que todo está en su sitio, aunque todavía no esté funcionando. Esto es: `AddProduct` aún no guarda el producto, y como no los guarda `GetCurrentStock` no va a encontrarlo.

```plaintext
Error: Product Id new-product-id doesn't exist
```

Podríamos considerar que, en lo que respecta a `AddProduct`, lo que tenemos es un esqueleto andante de la funcionalidad, que nos garantiza que las piezas están ahí y est��n correctamente articuladas, aunque todavía tengamos que ponerles el músculo que las haga funcionar como queremos.

## Empezando a colocar la funcionalidad

De momento, voy a consolidar los cambios en un commit y vamos a empezar a pensar en cómo introducir el comportamiento usando esta metodología mixta.

Un problema que veo es que el test va a ser difícil de hacer pasar rápidamente porque vamos a ejecutar dos acciones. La intención del test es más o menos: "si introduzco un nuevo producto, tengo su información disponible para consultarla". Tiene sentido hacerlo así desde el punto de vista del Actor. 

Al ejecutar el comando podemos verificar que se ha completado y devuelve una respuesta. Podríamos testear que esta respuesta contiene el `id` del producto recién añadido. Este test sería útil, pero insuficiente. Es útil porque nos va a permitir poner en su lugar varios de los elementos necesarios, pero es insuficiente porque esta respuesta no nos garantiza que el producto ha sido registrado. Para eso es por lo que lanzamos una segunda acción con la que revisamos que ese producto se puede consultar en el sistema.

Una posibilidad es separar ambas partes del test, de esta forma:

```typescript
describe('When we add a product that is not in our database', () => {
    let result: AddProductResponse
    beforeAll(async () => {
        const command = new AddProduct('ProductName', 100)
        const handler = configurator.buildAddProductHandler()
        result = handler.handle(command)
    })
    
    it('should confirm the identifier of the added product', () => {
        expect(result.unwrap()).toEqual('new-product-id')
    })

    it('should store in the database so I can get its information', () => {
        const newProductId = result.unwrap()
        expectProductWasStored(newProductId, 'ProductName', 100)
    })
})
```

De hecho, la primera parte pasa y la segunda, no. Esto es interesante porque me va a permitir anular la parte que no pasa y usar la primera para introducir código que necesito para implementar la segunda. 

Me explico:

Hasta ahora tenemos un esqueleto andante de este elemento del puerto que devuelve una respuesta hardcoded. Ahora bien, está claro que hay varias responsabilidades: generar el `id`, construir la instancia del producto y guardarla en el almacenamiento. Devolver el `id` solo debería producirse si todo va bien.

El primer test verifica que en algún momento se genera un `id` y se llega a devolver. Como el test pasa, estamos en condiciones de refactorizar e introducir la solución y componentes que nos interesan. Una vez que tenemos esos componentes en su lugar, podremos implementar la parte de comportamiento nueva, dirigida por la segunda parte del test.

Así que para empezar, nos saltamos el segundo test para que no se ejecute.

```typescript
describe('When we add a product that is not in our database', () => {
    let result: AddProductResponse
    beforeAll(async () => {
        const command = new AddProduct('ProductName', 100)
        const handler = configurator.buildAddProductHandler()
        result = handler.handle(command)
    })
    it('should confirm the identifier of the added product', () => {

        expect(result.unwrap()).toEqual('new-product-id')
    })

    it.skip('should store in the database so I can get its information', () => {
        const newProductId = result.unwrap()
        expectProductWasStored(newProductId, 'ProductName', 100)
    })
})
```

Y empezamos a mover cosas.

### De constante a variable, o algo así

Tenemos la respuesta hardcoded en el objeto `AddProductResponse`.

```typescript
export class AddProductResponse {
    unwrap(): string {
        return 'new-product-id'
    }
}
```

Pues hagamos que la reciba:

```typescript
export class AddProductResponse {
    private readonly result:string

    constructor(result: string) {
        this.result = result
    }

    unwrap(): string {
        return this.result
    }
}
```

```typescript
export class AddProductHandler {
    handle(command: AddProduct) {
        return new AddProductResponse('new-product-id')
    }
}
```

El test sigue pasando. Y ya que lo hace, podemos hacer un commit con los cambios.

### Delegando

El proceso que vamos a seguir ahora es similar al que haríamos en London School, pero con la protección de un test que está pasando. Vamos a ir introduciendo los componentes que nos parece que deben asumir las distintas responsabilidades de este caso de uso.

Por ejemplo, pienso que lo mejor sería que el _Handler_ delegue en `Inventory` el alta del nuevo producto en aplicación del patrón GRASP _creator_. `Inventory` registra y agrega todos los productos, así que tiene sentido pasarle la información y que se encargue de llevarlo a cabo.

```typescript
export class AddProductHandler {
    private inventory: Inventory

    constructor(inventory: Inventory) {
        this.inventory = inventory
    }

    handle(command: AddProduct) {
        const newProductId = this.inventory.registerProduct(
            command.productName,
            command.initialQuantity
        )
        return new AddProductResponse(newProductId)
    }
}
```

Ahora nos toca introducir todo lo necesario para hacer pasar el test de nuevo. Por ejemplo, en el configurador:

```typescript
buildAddProductHandler() {
    return new AddProductHandler(this.inventory)
}
```

Y esto en `Inventory`. Como se puede ver, hemos movido la generación del `id` a este nuevo método `registerProduct`. De nuevo, aplicamos el concepto de esqueleto andante, introduciendo un comportamiento hardcoded, que nos ayuda a definir y colocar en su lugar los elementos que necesitamos poner en juego. 

```typescript
export class Inventory {
    private readonly storage: ForStoringProducts

    constructor(storage: ForStoringProducts) {
        this.storage = storage
    }

    stockById(productId: string): ProductStock {
        // Code removed for clarity
    }

    registerProduct(productName: string, initialQuantity: number): string {
        return 'new-product-id'
    }
}
```

El test pasa de nuevo y lo celebramos haciendo un nuevo _commit_.

### Un nuevo salto

¿Qué es `Inventory` en este punto? ¿Es un doble de test o es otra cosa? El método `registerProduct` se limita a devolver una respuesta, que es justo lo que queremos que haga, sin que `AddProductHandler`, que es donde se invoca, tenga ni idea de cuál es su implementación. `AddProductHandler` sabe que tiene que invocarlo para que se registre el producto y recibirá el id asignado al mismo a cambio.

Esto último va contra el principio Command Query Separation, pero es una pequeña concesión que hacemos ahora para facilitarnos la vida y no complicar el desarrollo.

Volviendo a la pregunta, yo no consideraría `Inventory` como un doble de test, si no como una implementación real que irá creciendo iterativamente a medida que los tests nos requieran enriquecer su comportamiento. Es decir. Ahora tenemos un test que no necesita más que recibir de vuelta un identificador de producto. Sin embargo, sabemos que la implementación completa requerirá no solamente generar infinitos identificadores, sino también que cada uno de ellos sea asignado a un producto registrado del cual podremos obtener detalles en el futuro.

Así que nos situamos en `Inventory.registerProduct` y decidimos qué elementos vamos a necesitar hacer interactuar aquí.

Por un lado, parece claro que generar un identificador nuevo debería ser responsabilidad de algún servicio dedicado. Por otro lado, registrar el producto y guardarlo será tarea de un _Storage_, que resulta de implementar el puerto `ForStoringProducts` y que, por cierto, ya tenemos.

```typescript
export class Inventory {
    private readonly storage: ForStoringProducts
    private readonly identityProvider: IdentityProvider

    constructor(storage: ForStoringProducts) {
        this.storage = storage
        this.identityProvider = new IdentityProvider()
    }

    stockById(productId: string): ProductStock {
        // Code removed for clarity
    }

    registerProduct(productName: string, initialQuantity: number): string {
        const newProductId = this.identityProvider.generate()

        this.storage.store(newProductId, {id: newProductId, name: productName, stock: initialQuantity})

        return newProductId
    }
}
```

Que completamos con lo siguiente para que el test siga pasando:

```typescript
export class IdentityProvider {
    generate() {
        return 'new-product-id'
    }
}
```

```typescript
export interface ForStoringProducts {
    getById(productId: string): Object | undefined

    store(productId: string, product: { id: string; name: string; stock: number }): void
}
```

```typescript
export class InMemoryProductStorage implements ForStoringProducts {
    private products: Map<string, Object>
    constructor(examples: Map<string, Object>) {
        this.products = examples
    }

    getById(productId: string): Object | undefined {
        return this.products.get(productId)
    }

    store(productId: string, product: { id: string; name: string; stock: number }): void {

    }
}
```

En este punto, `IdentityProvider` nos plantea la siguiente cuestión. Teniendo en cuenta que se trata de un generador no determinista, ¿deberíamos considerarlo como un actor secundario y establecer un puerto en la aplicación?

Por supuesto, podemos hacerlo.

```typescript
export interface ForGettingIdentities {
    generate(): string
}
```

Esto supone mover `IdentityProvider`:

```typescript
export class IdentityProvider implements ForGettingIdentities {
    generate() {
        return 'new-product-id'
    }
}
```

Y tendría mucho sentido inyectarlo en `Inventory`.

```typescript
export class Inventory {
    private readonly storage: ForStoringProducts
    private readonly identityProvider: ForGettingIdentities

    constructor(storage: ForStoringProducts, identityProvider: ForGettingIdentities) {
        this.storage = storage
        this.identityProvider = identityProvider
    }

    stockById(productId: string): ProductStock {
        // Code removed for clarity
    }

    registerProduct(productName: string, initialQuantity: number): string {
        // Code removed for clarity
    }
}
```

Esto nos obliga a hacer algunos cambios en varios lugares, como el `Configurator` y en algunos tests que ya teníamos. No los voy a mostrar aquí.

En todo caso, nos ha servido para mostrar cómo a veces descubrimos la necesidad de nuevos puertos secundarios, algo que comentamos en el primer artículo de la serie.

Y finalmente, tenemos todos los tests pasando, con lo cual es tiempo de hacer un nuevo commit y volver a activar el test que nos estábamos saltando.

### Finalmente, guardamos el producto

Al quitar el `skip` del test en que comprobamos que es posible recuperar el producto recién registrado, comprobamos que falla, como era de esperar, invitándonos a implementar esa funcionalidad.

Con el proceso anterior fuimos capaces de poner todos los elementos en su lugar, manteniendo el comportamiento de la aplicación hasta el momento. Lo que nos queda por hacer es relativamente sencillo:

```typescript
export class InMemoryProductStorage implements ForStoringProducts {
    private products: Map<string, Object>
    constructor(examples: Map<string, Object>) {
        this.products = examples
    }

    getById(productId: string): Object | undefined {
        return this.products.get(productId)
    }

    store(productId: string, product: { id: string; name: string; stock: number }): void {
        this.products.set(productId, product)
    }
}
```

Y con esto, el test pasa.

Hablando con propiedad, no hemos terminado del todo esta fase. Es cierto que hemos implementado el comportamiento requerido, pero hay varios detalles que tendremos que rematar. Por ejemplo, el generador de identidades actualmente no es muy útil, y necesitaríamos una versión determinista para usar en tests.

`InventoryConfigurator` también necesita cariño, para que sea una herramienta útil.

Por otro lado, hay varios detalles al respecto del uso de primitivos o la falta de uso de objetos en según qué lugares.

Además, también tendríamos que desarrollar el comportamiento del sistema ante problemas. ¿Qué pasa si no nos podemos comunicar con el Storage? ¿Qué pasa si el producto está mal especificado o con valores no válidos? Por supuesto, esto lo tenemos que describir en tests.

Sin embargo, pese a estas carencias, es interesante señalar que gracias a la metodología seguida y a la arquitectura, podremos ir mejorando estos aspectos mediante refactoring. Dicho sea de paso, tenemos una cobertura de tests del 100%.

De momento, esta es la estructura de archivos que tenemos en este punto:

```plaintext
src
├── InventoryConfigurator.ts
├── driven
│   ├── forGettingIdentities
│   │   └── IdentityProvider.ts
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
    │   ├── forGettingIdentities
    │   │   └── ForGettingIdentities.ts
    │   └── forStoringProducts
    │       └── ForStoringProducts.ts
    └── driving
        └── forManagingProducts
            ├── addProduct
            │   ├── AddProduct.ts
            │   ├── AddProductHandler.ts
            │   └── AddProductResponse.ts
            └── getCurrentStock
                ├── GetCurrentStock.test.ts
                ├── GetCurrentStock.ts
                ├── GetCurrentStockHandler.ts
                └── GetCurrentStockResponse.ts

11 directories, 21 files
```

Dejaremos las cosas pendientes para otro momento, ya que en este artículo quería centrarme en describir la metodología usada. Así que terminamos por ahora con algunas reflexiones.

Dejo el [código de este capítulo aquí](https://github.com/franiglesias/inventory/pull/3).

## Una tercera vía TDD outside-in, o no

En este artículo he mostrado una forma de hacer TDD outside-in que, de alguna manera, toma elementos entre la escuela clásica y la London School.

Esto es posible gracias a la aplicación de la idea del Walking Skeleton. Al hacerlo así, añadimos elementos de la arquitectura de la aplicación (estilo London), mientras que mantenemos los tests pasando (estilo clásico).

Personalmente, me ha parecido una forma pragmática de trabajar y que mantiene los elementos que me parecen más útiles de ambas escuelas. Por un lado, ayuda a posponer decisiones de implementación, a la vez que la red de seguridad proporcionada por los tests que pasan.

Por otro lado, la introducción de componentes con poco comportamiento, o con un comportamiento fijado, ayuda a gestionar la proliferación de dobles propia de la London School. De esta forma, los dobles que se usan acaban siendo actores para el entorno de tests (y creados con librerías si fuese necesario), mientras que los componentes internos simplemente van enriqueciendo su comportamiento a medida que nuevos tests nos obligan a seguir desarrollando. 


---

**Serie TDD outside-in con arquitectura hexagonal:**

- [TDD outside-in con arquitectura hexagonal (1)](/hexagonal-tdd-1/)
- [TDD outside-in con arquitectura hexagonal (2)](/hexagonal-tdd-2/)
- [TDD outside-in con arquitectura hexagonal (3)](/hexagonal-tdd-3/)
- [TDD outside-in con arquitectura hexagonal (4)](/hexagonal-tdd-4/)
- [TDD outside-in con arquitectura hexagonal (5)](/hexagonal-tdd-5/)