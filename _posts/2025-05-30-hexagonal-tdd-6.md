---
layout: post
title: TDD outside-in con arquitectura hexagonal (6) Añadiendo funcionalidad y resolviendo problemas
categories: articles
tags: software-design design-patterns typescript tdd hexagonal
---

En esta entrega vamos a intentar terminar las features de añadir y retirar cantidades de producto del inventario. Pero antes, debemos resolver algunos problemas que todavía no hemos afrontado.

Tenemos que resolver algunos problemas antes de seguir. El desarrollo no marcha mal, pero es conveniente abordar algunos problemas a los que no hemos necesitado prestar mucha atención hasta ahora. De este modo, el trabajo futuro será mucho más fácil. Y también será más fácil resolverlos ahora, que cuando tengamos más código y hayamos invertido más esfuerzo.

El primero de ellos es que aún no tenemos un generador de identidades como tal, puesto que nos proporciona siempre la misma. No solo no es válido para producción, también afecta a nuestros tests.

También, podemos observar que nuestros tests son dependientes a través de sus datos. No nos está causando problemas ahora mismo, pero nos va a perjudicar cuando intentemos escribir nuevos tests. Además, en los tests no está explícito el conjunto de datos que usaremos en el escenario. Ese conocimiento está oculto en el configurador. Sabemos que tenemos algunos productos determinados ya guardados y jugamos con ese conocimiento, pero es un conocimiento que tenemos que mantener en la cabeza.

## Generador de identidades

El generador de identidades debería darnos algún tipo de identificador diferente cada vez que lo llamamos. Hoy por hoy, solemos preferir identificadores no predecibles, como los UUID o los ULID, por razones de seguridad. En los tests es frecuente que necesitemos _saber_ qué identificador se está usando en un momento dato para que el test mismo pueda ser determinista, por eso necesitamos dobles de test para este tipo de generadores.

Nuestro proveedor de identidades actual es básicamente un _stub_:

```typescript
export class IdentityProvider implements ForGettingIdentities {
    generate() {
        return 'new-product-id'
    }
}
```

Vamos a transformar esto para reflejar correctamente lo que tenemos:

```typescript
export class IdentityProviderStub implements ForGettingIdentities {
    generate() {
        return 'new-product-id'
    }
}
```

Ahora, introduciremos un nuevo adaptador que sea configurable, de modo que le podamos pasar uno o más Id para usar en los tests:

```typescript
describe('ConfigurableIdentityProvider', () => {
    it('should return one configured identity', () => {
        const provider = new ConfigurableIdentityProvider('first-identity')
        expect(provider.generate()).toEqual('first-identity')
    })

    it('should return several configured identities', () => {
        const provider = new ConfigurableIdentityProvider('first-identity', 'second-identity', 'third-identity')
        expect(provider.generate()).toEqual('first-identity')
        expect(provider.generate()).toEqual('second-identity')
        expect(provider.generate()).toEqual('third-identity')
    })

    it('should fail when no more identities available', () => {
        const provider = new ConfigurableIdentityProvider('first-identity')
        expect(provider.generate()).toEqual('first-identity')
        expect(() => {provider.generate()}).toThrow(Error)
    })
})
```

Y esta es la implementación:

```typescript
export class ConfigurableIdentityProvider implements ForGettingIdentities {
    private identities: string[] = []

    constructor(...identities: string[]) {
        this.identities = identities
    }

    generate(): string {
        if (this.identities.length < 1) {
            throw new Error('No identities available to generate')
        }
        return this.identities.shift() || 'Invalid identity'
    }
}
```

Ahora podemos usarla en nuestros tests:

```typescript
export class InventoryConfigurator {
    private readonly storage: InMemoryProductStorage
    private readonly inventory: Inventory

    constructor(storage: InMemoryProductStorage, inventory: Inventory) {
        this.storage = storage
        this.inventory = inventory
    }

    static forTest(): InventoryConfigurator {
        const examples = new Map<string, Product>([
            ['existing-product-id', ProductExamples.existingProduct()],
            ['exhausted-product-id', ProductExamples.exhaustedProduct()],
        ])
        const inMemoryProductStorage = new InMemoryProductStorage(
            examples
        )
        let identityProvider = new ConfigurableIdentityProvider(
            'new-product-id'
        )
        const inventory = new Inventory(
            inMemoryProductStorage,
            identityProvider
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

    buildAddProductHandler() {
        return new AddProductHandler(this.inventory)
    }
}
```

Al introducir este cambio fallará este test:

```plaintext
FAIL  test/e2e/addProduct.test.ts > For Managing Products Port > When we try to register products without correct data > should fail if a valid quantity is not provided
AssertionError: expected Error: No identities available to generate to be an instance of InvalidProductQuantity
```

Que nos dice que en ese test necesitamos que se pueda obtener más de una identidad. Esto ya nos revela también el tipo de problemas que tenemos que resolver a continuación. Por el momento, lo podemos arreglar registrando dos o tres identidades más:

```typescript
let identityProvider = new ConfigurableIdentityProvider(
    'new-product-id', 
    'second-product-id', 
    'third-product-id'
)
```

## Los tests deberían ser independientes

Para garantizar que los tests independientes tendremos que usar varias tácticas. Entre otras cosas, necesitamos asegurar que cada escenario de test está bien definido, con sus propios ejemplos, y que los recursos que se puedan compartir quedan correctamente liberados una vez ejecutado el test.

### Definir los datos del escenario

Una de las primeras cosas que tenemos que hacer es definir los datos del escenario de forma que se los pasemos a `Configurator` en lugar de tenerlos _hard coded_ dentro. De este modo, tomamos control y sabemos exactamente qué datos de prueba estamos usando en cada test. De momento vamos a querer poder definir los productos existentes en la base de datos y los identificadores que se precise generar. Nos quedaría algo así:

```typescript
export class InventoryConfigurator {
    private readonly storage: InMemoryProductStorage
    private readonly inventory: Inventory

    constructor(storage: InMemoryProductStorage, inventory: Inventory) {
        this.storage = storage
        this.inventory = inventory
    }

    static forTest(fixtures: Map<string, any>): InventoryConfigurator {
        const inMemoryProductStorage = new InMemoryProductStorage(
            fixtures.get('products') || new Map<string, Product>()
        )
        let identityProvider = new ConfigurableIdentityProvider(
            ...fixtures.get('identities') || []
        )
        const inventory = new Inventory(
            inMemoryProductStorage,
            identityProvider
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

    buildAddProductHandler() {
        return new AddProductHandler(this.inventory)
    }
}
```

De este modo, podemos utilizar distintos ejemplos en distintos tests. Para el caso de uso de `AddProduct`, no necesitamos tener nada en la base de datos, tan solo cargar el `IdentityGenerator`:

```typescript
describe('For Managing Products Port', () => {
    let configurator: InventoryConfigurator
    beforeAll(async () => {
        const fixtures = new Map<string, any>([
            ['identities', ['new-product-id']]
        ])
        configurator = InventoryConfigurator.forTest(fixtures)
    })

    // Code removed for clarity
})
```

Y en el caso de uso de `GetCurrentStock`, no nos hace falta generar identidades, sino tener algunos ejemplos de productos que consultar. Gracias a este cambio, los identificadores que usamos en los distintos tests aparecen declarados de forma explícita en la preparación.

```typescript
describe('For Managing Products Port', () => {
    let configurator: InventoryConfigurator

    beforeAll(async () => {
        const fixtures = new Map<string, any>([
            ['products', new Map<string, Product>([
                ['existing-product-id', ProductExamples.existingProduct()],
                ['exhausted-product-id', ProductExamples.exhaustedProduct()],
            ])],
        ])
        configurator = InventoryConfigurator.forTest(fixtures)
    })
    
    // Code removed for clarity
})
```

Otro cambio que nos ayuda a aislar los tests es usar los hooks `beforeEach` en vez de `beforeAll`. 

## Los tests deberían ser baratos de escribir y leer

Una cosa que me resulta bastante molesta en los tests que tenemos es que hay varias estructuras que se repiten, aunque con distintos datos. Por ejemplo, el siguiente fragmento se repite cuatro veces. A la larga, es un montón de líneas que tenemos que escribir una y otra vez. 

```typescript
const query = new GetCurrentStock('exhausted-product-id')
const handler = configurator.buildGetCurrentStockHandler()
const result = handler.handle(query)
```

Podemos extraerlas a una función, lo que hace más simple escribir nuevos tests para el mismo comando o query.

```typescript
describe('For Managing Products Port', () => {
    let configurator: InventoryConfigurator

    beforeEach(async () => {
        const fixtures = new Map<string, any>([
            ['products', new Map<string, Product>([
                ['existing-product-id', ProductExamples.existingProduct()],
                ['exhausted-product-id', ProductExamples.exhaustedProduct()],
            ])],
        ])
        configurator = InventoryConfigurator.forTest(fixtures)
    })

    function executeGetCurrentStock(productId: string) {
        const query = new GetCurrentStock(productId)
        const handler = configurator.buildGetCurrentStockHandler()
        return handler.handle(query)
    }

    describe('When we ask the current stock of an existing product', () => {
        it('Should return a product stock object as response with available units', () => {
            const result = executeGetCurrentStock('existing-product-id')
            const stock = result.unwrap()
            expect(stock).toEqual({
                id: 'existing-product-id',
                name: 'existing-product-name',
                stock: 10
            })
        })
    })

    describe('When we ask the current stock of a non-existing product', () => {
        it('Should return an error', () => {
            const result = executeGetCurrentStock('non-existing-product-id')
            expect(() => {
                result.unwrap()
            }).toThrowError(Error)
            expect(result.error()).toBeInstanceOf(UnknownProduct)
        })
    })

    describe('When we ask the current stock of an exhausted product', () => {
        it('Should return an error', () => {
            const result = executeGetCurrentStock('exhausted-product-id')
            expect(() => {
                result.unwrap()
            }).toThrowError(Error)
            expect(result.error()).toBeInstanceOf(ExhaustedProduct)
        })
    })

    describe('When we ask with an invalid product id', () => {
        it('Should return an error', () => {
            const result = executeGetCurrentStock('')
            expect(() => {
                result.unwrap()
            }).toThrowError(Error)
            expect(result.error()).toBeInstanceOf(InvalidProductId)
        })
    })
})
```

Además de eso, puede ser buena idea eliminar la comprobación redundante de que el resultado no se puede extraer. No aporta nada para el test en curso.

```typescript
describe('For Managing Products Port', () => {
    let configurator: InventoryConfigurator

    beforeEach(async () => {
        const fixtures = new Map<string, any>([
            ['products', new Map<string, Product>([
                ['existing-product-id', ProductExamples.existingProduct()],
                ['exhausted-product-id', ProductExamples.exhaustedProduct()],
            ])],
        ])
        configurator = InventoryConfigurator.forTest(fixtures)
    })

    function executeGetCurrentStock(productId: string) {
        const query = new GetCurrentStock(productId)
        const handler = configurator.buildGetCurrentStockHandler()
        return handler.handle(query)
    }

    describe('When we ask the current stock of an existing product', () => {
        it('Should return a product stock object as response with available units', () => {
            const result = executeGetCurrentStock('existing-product-id')
            expect(result.unwrap()).toEqual({
                id: 'existing-product-id',
                name: 'existing-product-name',
                stock: 10
            })
        })
    })

    describe('When we ask the current stock of a non-existing product', () => {
        it('Should return an error', () => {
            const result = executeGetCurrentStock('non-existing-product-id')
            expect(result.error()).toBeInstanceOf(UnknownProduct)
        })
    })

    describe('When we ask the current stock of an exhausted product', () => {
        it('Should return an error', () => {
            const result = executeGetCurrentStock('exhausted-product-id')
            expect(result.error()).toBeInstanceOf(ExhaustedProduct)
        })
    })

    describe('When we ask with an invalid product id', () => {
        it('Should return an error', () => {
            const result = executeGetCurrentStock('')
            expect(result.error()).toBeInstanceOf(InvalidProductId)
        })
    })
})
```

Aplicamos la misma técnica para el otro test, lo que también me permite deshacerme de un `beforeEach` que me resultaba bastante confuso:

```typescript
describe('For Managing Products Port', () => {
    let configurator: InventoryConfigurator
    beforeEach(async () => {
        const fixtures = new Map<string, any>([
            ['identities', ['new-product-id', 'second-product-id']]
        ])
        configurator = InventoryConfigurator.forTest(fixtures)
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

    function executeAddProduct(productName: string | undefined, initialQuantity: number) {
        const command = new AddProduct(productName!, initialQuantity)
        const handler = configurator.buildAddProductHandler()
        return handler.handle(command)
    }

    describe('When we add a product that is not in our database', () => {
        it('should confirm the identifier of the added product', () => {
            const result = executeAddProduct('ProductName', 100)
            expect(result.unwrap()).toEqual('new-product-id')
        })

        it('should store in the database, so I can get its information', () => {
            const result = executeAddProduct('ProductName', 100)
            expectProductWasStored((result.unwrap())!, 'ProductName', 100)
        })
    })

    describe('When we try to register products without correct data', () => {
        it('should fail if a valid name is not provided', async () => {
            const result = executeAddProduct(undefined, 100)
            expect(result.error()).toBeInstanceOf(InvalidProductName)
        })

        it('should fail if a valid quantity is not provided', async () => {
            const result = executeAddProduct('The Product', 0)
            expect(result.error()).toBeInstanceOf(InvalidProductQuantity)
        })
    })
}
```

## Un paso más

En realidad, podríamos dar un paso más en la simplificación de la interacción del test con el puerto. La siguiente clase abstrae el funcionamiento del puerto. Esto nos permite reutilizar algo de código.

```typescript
export class ForManagingProductsTest {
    private configurator: InventoryConfigurator

    constructor(fixtures: Map<string, any>) {
        this.configurator = InventoryConfigurator.forTest(fixtures)
    }

    AddProduct(productName: string | undefined, initialQuantity: number): Result<string> {
        const command = new AddProduct(productName!, initialQuantity)
        const handler = this.configurator.buildAddProductHandler()
        return handler.handle(command)
    }

    GetCurrentStock(productId: string): Result<object> {
        const query = new GetCurrentStock(productId)
        const handler = this.configurator.buildGetCurrentStockHandler()
        return handler.handle(query)
    }
}
```

Así es como quedan los tests ahora:

```typescript
describe('For Managing Products Port', () => {
    let forManagingProducts: ForManagingProductsTest

    beforeEach(async () => {
        const fixtures = new Map<string, any>([
            ['identities', ['new-product-id', 'second-product-id']]
        ])
        forManagingProducts = new ForManagingProductsTest(fixtures)
    })

    describe('When we add a product that is not in our database', () => {
        it('should confirm the identifier of the added product', () => {
            const result = forManagingProducts.AddProduct('ProductName', 100)
            expect(result.unwrap()).toEqual('new-product-id')
        })

        it('should store in the database, so I can get its information', () => {
            const result = forManagingProducts.AddProduct('ProductName', 100)
            const currentStock = forManagingProducts.GetCurrentStock((result.unwrap())!)
            expect(currentStock.unwrap()).toEqual({
                id: (result.unwrap())!,
                name: 'ProductName',
                stock: 100
            })
        })
    })

    describe('When we try to register products without correct data', () => {
        it('should fail if a valid name is not provided', async () => {
            const result = forManagingProducts.AddProduct(undefined, 100)
            expect(result.error()).toBeInstanceOf(InvalidProductName)
        })

        it('should fail if a valid quantity is not provided', async () => {
            const result = forManagingProducts.AddProduct('The Product', 0)
            expect(result.error()).toBeInstanceOf(InvalidProductQuantity)
        })
    })
})
```

```typescript
import {beforeEach, describe, expect, it} from 'vitest'
import {InvalidProductId} from '../../src/inventory/InvalidProductId'
import {ExhaustedProduct} from '../../src/inventory/ExhaustedProduct'
import {UnknownProduct} from '../../src/inventory/UnknownProduct'
import {Product} from '../../src/inventory/Product'
import {ProductExamples} from '../../src/inventory/ProductExamples'
import {ForManagingProductsTest} from './forManagingProductsTest'


describe('For Managing Products Port', () => {
    let forManagingProducts: ForManagingProductsTest

    beforeEach(async () => {
        const fixtures = new Map<string, any>([
            ['products', new Map<string, Product>([
                ['existing-product-id', ProductExamples.existingProduct()],
                ['exhausted-product-id', ProductExamples.exhaustedProduct()],
            ])],
        ])
        forManagingProducts = new ForManagingProductsTest(fixtures)
    })

    describe('When we ask the current stock of an existing product', () => {
        it('Should return a product stock object as response with available units', () => {
            const result = forManagingProducts.GetCurrentStock('existing-product-id')
            expect(result.unwrap()).toEqual({
                id: 'existing-product-id',
                name: 'existing-product-name',
                stock: 10
            })
        })
    })

    describe('When we ask the current stock of a non-existing product', () => {
        it('Should return an error', () => {
            const result = forManagingProducts.GetCurrentStock('non-existing-product-id')
            expect(result.error()).toBeInstanceOf(UnknownProduct)
        })
    })

    describe('When we ask the current stock of an exhausted product', () => {
        it('Should return an error', () => {
            const result = forManagingProducts.GetCurrentStock('exhausted-product-id')
            expect(result.error()).toBeInstanceOf(ExhaustedProduct)
        })
    })

    describe('When we ask with an invalid product id', () => {
        it('Should return an error', () => {
            const result = forManagingProducts.GetCurrentStock('')
            expect(result.error()).toBeInstanceOf(InvalidProductId)
        })
    })
})
```

## Bug: No permite añadir el mismo producto dos veces

Hemos trabajado mucho para simplificar los tests y hacerlos más fáciles de escribir y leer. Ahora queremos avanzar en el progreso del producto, por lo que vamos a añadir prestaciones y capacidades nuevas.

Lo primero que vamos a hacer es corregir un defecto. Ahora mismo la aplicación permite ejecutar `AddProduct` tantas veces como queramos, introduciendo productos en almacén que tienen el mismo nombre. Esto puede dar lugar a resultados engañosos, asi que queremos asegurar que no se puede hacer. La aplicación lo comprobará y lanzará un error.

Esto lo vamos a definir mediante un test exterior. Gracias al trabajo anterior, este test no solo es fácil de escribir, sino que es fácil de entender. De momento, vamos a poner el segundo test en `skip`. Este test, por cierto, pasa porque la segunda inserción del producto lo añade con un nuevo id y el que se controla es el de la primera, que es el único identificador que se debería conservar.

```typescript
describe('When we try to register a product that already exists', () => {
    it('should fail', () => {
        forManagingProducts.AddProduct('ProductName', 100)
        const result = forManagingProducts.AddProduct('ProductName', 200)
        expect(result.error()).toBeInstanceOf(ProductWithSameNameAlreadyExists)
    })

    it.skip('should not change the stock of the existing product', () => {
        forManagingProducts.AddProduct('ProductName', 100)
        forManagingProducts.AddProduct('ProductName', 200)
        const currentStock = forManagingProducts.GetCurrentStock('new-product-id')
        expect(currentStock.unwrap()).toEqual({
            id: 'new-product-id',
            name: 'ProductName',
            stock: 100
        })
    })
})
```

Añadimos la nueva clase de error:

```typescript
export class ProductWithSameNameAlreadyExists implements Error {
    message: string
    name: string

    constructor(productName: string) {
        this.name = 'PRODUCT_WITH_SAME_NAME_ALREADY_EXISTS'
        this.message = `Product name ${productName} is already in use.`
    }
}
```

Básicamente, vamos a tener que modificar la forma en que registramos nuevos productos. 

```typescript
export class Inventory {
    private readonly storage: ForStoringProducts
    private readonly identityProvider: ForGettingIdentities

    constructor(storage: ForStoringProducts, identityProvider: ForGettingIdentities) {
        this.storage = storage
        this.identityProvider = identityProvider
    }

    stockById(productId: string): ProductRepresentation<any> {
        // Code removed for clarity
    }

    registerProduct(productName: string, initialQuantity: number): string {
        const newProductId = this.identityProvider.generate()
        const productToAdd = Product.register(newProductId, productName, initialQuantity)

        this.storage.store(newProductId, productToAdd)

        return newProductId
    }
}
```
Para ello tenemos que poder buscar productos por su nombre, o al menos, chequear si alguno de los productos ya almacenados tiene ese nombre, lo que requerirá que `ForStoringProducts` permita hacerlo:

```typescript
export interface ForStoringProducts {
    getById(productId: string): Product | undefined

    store(productId: string, product: Product): void

    hasProductWithName(productName: string): boolean
}
```

```typescript
registerProduct(productName: string, initialQuantity: number): string {
    if (this.storage.hasProductWithName(productName)) {
        throw new ProductWithSameNameAlreadyExists(productName)
    }
    const newProductId = this.identityProvider.generate()
    const productToAdd = Product.register(newProductId, productName, initialQuantity)

    this.storage.store(newProductId, productToAdd)

    return newProductId
}
```

Y, por tanto, debemos implementarlo en `InMemoryProductStorage` y en los stubs que tengamos.

```typescript
export class InMemoryProductStorage implements ForStoringProducts {
    private products: Map<string, Product>

    constructor(examples: Map<string, Product>) {
        this.products = examples
    }

    hasProductWithName(productName: string): boolean {
        return Array.from(this.products.values()).some(product =>
            product.isCalled(productName)
        );
    }

    getById(productId: string): Product | undefined {
        return this.products.get(productId)
    }

    store(productId: string, product: Product): void {
        this.products.set(productId, product)
    }
}
```

Con este cambio, el test pasa y también podemos quitar el `skip` del segundo test. Este test también pasará, confirmando que los resultados son consistentes, aunque es un test relativamente frágil. Ya veremos como fortalecerlo.

## Tell, don't ask

Quizá te haya llamado la atención este método:

```typescript
export class Product {

    private readonly id: string
    private readonly name: string
    private readonly stock: number

    private constructor(id: string, name: string, stock: number) {
        this.id = id
        this.name = name
        this.stock = stock
    }

    // Code removed for clarity

    isCalled(productName: string): boolean {
        return productName == this.name
    }
}
```

En lugar de un _getter_, que parece lo más obvio, lo que hacemos es preguntarle al objeto si se llama así. Esto no solo es una forma de librarse de un getter, sino también de permitirnos enriquecer su comportamiento sin afectar a los consumidores. Por eso aplicamos el principio _Tell, don't ask_.

Por ejemplo, podríamos evitar los problemas de los diferentes casos:

```typescript
export class Product {

    private readonly id: string
    private readonly name: string
    private readonly stock: number

    private constructor(id: string, name: string, stock: number) {
        this.id = id
        this.name = name
        this.stock = stock
    }

    // Code removed for clarity

    isCalled(productName: string): boolean {
        return productName.toLowerCase() == this.name.toLowerCase()
    }
}
```

O incluso, podríamos llegar a controlar sinónimos:

```typescript
export class Product {

    private readonly id: string
    private readonly name: string
    private readonly stock: number
    private readonly names: string[] = []

    private constructor(id: string, name: string, stock: number) {
        this.id = id
        this.name = name
        this.stock = stock
        this.names = [name.toLowerCase()]
    }

    // Code removed for clarity

    isCalled(productName: string): boolean {
        return this.names.includes(productName.toLowerCase())
    }
}
```

En otras palabras. Si usamos el getter `Product.getName()` y tenemos que cambiar el modo en que hacemos la comparación de nombre, nos veremos obligados a cambiar todos los usos. Al mover la responsabilidad de _reconocerse por su nombre_ a `Product`, el resto de la aplicación no necesita saber cómo lo hace, sino únicamente que sabe hacerlo. Cada mejora o cambio que hagamos va a ser transparente para el resto de la aplicación y solo se aplicará en un lugar.

## Aumentar el stock

Es hora de añadir la capacidad de incrementar y disminuir el stock de productos. Para estas acciones utilizaremos el ID del producto y la cantidad que se añade o se retira. El ID es la opción más razonable, pues permite definir con precisión el producto que queremos modificar.

Como corresponde, empezaremos con un test que defina el comportamiento:

```typescript
describe('For managing products', () => {
    describe('When restocking a product that we have registered', () => {
        let forManagingProducts: ForManagingProductsTest
        beforeEach(async () => {
            const fixtures = new Map<string, any>([
                ['products', new Map<string, Product>([
                    ['existing-product-id', ProductExamples.existingProduct()],
                    ['exhausted-product-id', ProductExamples.exhaustedProduct()],
                ])],
                ['identities', ['product-id']]
            ])
            forManagingProducts = new ForManagingProductsTest(fixtures)

        })
        it('Should increase the stock of the product', async () => {
            const result = forManagingProducts.RestockProduct('existing-product-id', 5)
            expect(result.successful()).toBe(true)
            const currentStock = forManagingProducts.GetCurrentStock('existing-product-id')
            expect(currentStock.unwrap()).toEqual({
                id: 'existing-product-id',
                name: 'existing-product-name',
                stock: 15 // 10 initial stock + 5 restocked
            })
        })
    })
})
```

Debemos implementar el método `RestockProduct` e introducir el comando y handler que vamos a necesitar. `ForManagingProductTest` actúa como un _controller_ en el sentido de los patrones GRASP, mapeando la intención del test con los componentes que deben activarse.

```typescript
export class RestockProduct {
    public readonly productId: string;
    public readonly quantity: number;

    constructor(productId: string, quantity: number) {
        this.productId = productId;
        this.quantity = quantity;
    }
}
```

```typescript
export class RestockProductHandler {
    constructor(inventory: Inventory) {

    }

    handle(command: RestockProduct): Result<null> {
        return new FailedResult(new Error('Not implemented'))
    }
}
```

```typescript
export class ForManagingProductsTest {
    private configurator: InventoryConfigurator

    constructor(fixtures: Map<string, any>) {
        this.configurator = InventoryConfigurator.forTest(fixtures)
    }

    // Code removed for clarity

    RestockProduct(existingProductId: string, number: number): Result<void> {
        const command = new RestockProduct(existingProductId, number)
        const handler = this.configurator.buildRestockProductHandler()
        return handler.handle(command)
    }
}
```

Esto es suficiente para que el test falle dado que devolvemos una respuesta de error incondicionalmente. Nos sirve para confirmar que tenemos todos los elementos necesarios en su lugar. De hecho, si suprimimos la línea `expect(result.successful()).toBe(true)` podemos ver que el test falla porque se recupera el producto deseado sin que se haya cambiado el stock.

Así que es momento de implementar. En principio, creo que podemos seguir una estructura similar a la que hemos usado en otros _Handlers_: un bloque _try/catch_ en el que delegamos el trabajo en `Inventory`.

```typescript
export class RestockProductHandler {
    private inventory: Inventory;

    constructor(inventory: Inventory) {
        this.inventory = inventory;
    }

    handle(command: RestockProduct): Result<null> {
        try {
            this.inventory.restockProduct(command.productId, command.quantity);
            return new SuccessResult(null);
        } catch (err: unknown) {
            return new FailedResult(err as Error);
        }
    }
}
```

El test, obviamente, seguirá fallando. Sin embargo, al usar el patrón `Result` se oculta algo de información que me interesaría tener. Así que hago este cambio:

```typescript
describe('For managing products', () => {
    describe('When restocking a product that we have registered', () => {

        // Code removed for clarity
        
        it('Should increase the stock of the product', async () => {
            const result = forManagingProducts.RestockProduct('existing-product-id', 5)
            expect(result.unwrap()).toBeNull()
            const currentStock = forManagingProducts.GetCurrentStock('existing-product-id')
            expect(currentStock.unwrap()).toEqual({
                id: 'existing-product-id',
                name: 'existing-product-name',
                stock: 15 // 10 initial stock + 5 restocked
            })
        })
    })
})
```

En lugar de esperar que la respuesta haya sido _successful_, intento obtener el resultado del comando, que es `null` en este caso. De este modo, si en realidad el resultado ha sido _failure_ se tirará el error que tengamos guardado en el resultado, que es justo lo que quiero poder saber en este momento. Ahora ya sé qué tengo que hacer a continuación.

```plaintext
Error: This result has an error. this.inventory.restockProduct is not a function
```

Y no es otra cosa que implementar la acción en `Inventory`:

```typescript
export class Inventory {
    private readonly storage: ForStoringProducts
    private readonly identityProvider: ForGettingIdentities

    constructor(storage: ForStoringProducts, identityProvider: ForGettingIdentities) {
        this.storage = storage
        this.identityProvider = identityProvider
    }

    // Code removed for clarity

    restockProduct(productId: string, quantity: number): void {
        const product = this.storage.getById(productId)
        if (!product) {
            throw new UnknownProduct(productId)
        }

        const updatedProduct = product.restock(quantity)

        this.storage.store(productId, updatedProduct)
    }
}
```

Como se puede deducir de la línea `const updatedProduct = product.restock(quantity)` voy a usar inmutabilidad para actualizar el producto. El test fallará indicando:

```plaintext
Error: This result has an error. product.restock is not a function
```

Y la solución es bastante simple:

```typescript
export class Product {

    private readonly id: string
    private readonly name: string
    private readonly stock: number

    private constructor(id: string, name: string, stock: number) {
        this.id = id
        this.name = name
        this.stock = stock
    }

    // Code removed for clarity
    
    restock(quantity: number): Product {
        return new Product(this.id, this.name, this.stock + quantity)
    }
}
```

Con esto queda implementada la prestación de incrementar el stock de producto. Nuestro trabajo ahora es cubrir los casos en los que se pueden generar problemas. En primer lugar, los relacionados con no cumplir el contrato del puerto que, como hemos visto anteriormente, en Typescript no lo podemos garantizar solo mediante el tipado. En segundo lugar, problemas con las reglas del negocio, como podría ser que no podemos incrementar un producto con un número negativo. 

```typescript
describe('When we try to restock products without correct data', () => {
    it('should fail if a valid id is not provided', async () => {
        const result = forManagingProducts.RestockProduct(undefined, 100)
        expect(result.error()).toBeInstanceOf(InvalidProductId)
    })
})
```

Este test se puede hacer pasar de manera similar a como hicimos con `AddProductHandler`.

```typescript
export class RestockProductHandler {
    private inventory: Inventory

    constructor(inventory: Inventory) {
        this.inventory = inventory
    }

    handle(command: RestockProduct): Result<null> {
        try {
            this.assertCommand(command)
            this.inventory.restockProduct(command.productId, command.quantity)
            return new SuccessResult(null)
        } catch (err: unknown) {
            return new FailedResult(err as Error)
        }
    }

    private assertCommand(command: RestockProduct) {
        if (typeof command.productId != 'string') {
            throw new InvalidProductId(command.productId)
        }
    }
}
```

Y, lo mismo, con el caso de que se nos cuele un valor que no sea numérico para la cantidad.

```typescript
describe('When we try to restock products without correct data', () => {
    it('should fail if a valid id is not provided', async () => {
        const result = forManagingProducts.RestockProduct(undefined, 100)
        expect(result.error()).toBeInstanceOf(InvalidProductId)
    })

    it('should fail if a valid quantity is not provided', async () => {
        const result = forManagingProducts.RestockProduct('existing-product-id', undefined)
        expect(result.error()).toBeInstanceOf(InvalidProductQuantity)
    })
})
```

```typescript
export class RestockProductHandler {
    private inventory: Inventory

    constructor(inventory: Inventory) {
        this.inventory = inventory
    }

    handle(command: RestockProduct): Result<null> {
        try {
            this.assertCommand(command)
            this.inventory.restockProduct(command.productId, command.quantity)
            return new SuccessResult(null)
        } catch (err: unknown) {
            return new FailedResult(err as Error)
        }
    }

    private assertCommand(command: RestockProduct) {
        if (typeof command.productId != 'string') {
            throw new InvalidProductId(command.productId)
        }

        if (typeof command.quantity != 'number') {
            throw new InvalidProductQuantity(command.quantity)
        }
    }
}
```

Sin embargo, nos queda un caso más. No queremos que se pueda pasar una cantidad cero o negativa para la reposición. Se trata de algo que, de ocurrir, podría falsear los datos.

```typescript
describe('When we try to restock products without correct data', () => {
    // Code removed for clarity

    it('should fail if a negative or zero quantity is provided', async () => {
        const result = forManagingProducts.RestockProduct('existing-product-id', -10)
        expect(result.error()).toBeInstanceOf(InvalidProductQuantity)
    })
})
```

Este control ya debe suceder más adentro, cuando se quiere hacer el restock. Tiene sentido hacerlo en `Product`

```typescript
export class Product {

    private readonly id: string
    private readonly name: string
    private readonly stock: number

    // Code removed for clarity

    restock(quantity: number): Product {
        if (quantity < 0) {
            throw new InvalidProductQuantity(quantity)
        }
        return new Product(this.id, this.name, this.stock + quantity)
    }
}
```

Pero tenemos que tener cuidado de comprobar todos los casos, particularmente los que son un límite. Como te puedes imaginar lo he hecho incompleto a propósito y necesitamos un test que verifique el caso límite.

```typescript
describe('When we try to restock products without correct data', () => {
    // Code removed for clarity

    it('should fail if a zero quantity is provided', async () => {
        const result = forManagingProducts.RestockProduct('existing-product-id', 0)
        expect(result.error()).toBeInstanceOf(InvalidProductQuantity)
    })
})
```

```typescript
export class Product {

    private readonly id: string
    private readonly name: string
    private readonly stock: number

    // Code removed for clarity

    restock(quantity: number): Product {
        if (quantity < 1) {
            throw new InvalidProductQuantity(quantity)
        }
        return new Product(this.id, this.name, this.stock + quantity)
    }
}
```

Como puedes ver, para este desarrollo nos hemos movido en la línea más clasicista. En general, tengo la impresión de que para incorporar o modificar prestaciones que usan componentes ya existentes, el método clásico puede ser más fácil de aplicar, siempre que asumamos que tendremos cierta pérdida de _triangulación_ en los tests.

¿Qué quiero decir? En líneas generales, si detectamos un defecto de software a través del test exterior puede ser difícil encontrar el punto real de fallo en la cadena de llamadas entre componentes. Para eso nos ayudan los tests unitarios, que nos indicarían con más precisión el componente concreto en el que se localiza el problema. Intentaré ilustrar esto a continuación, introduciendo la capacidad de descontar stock.

## Consumir stock

La acción de consumir o retirar stock requiere más o menos las mismas piezas que la de reponer, por lo que es el ejemplo ideal para comparar metodologías. La principal diferencia es que debemos prestar atención a una nueva regla: no podemos consumir más cantidad de un producto de la que está disponible. En ese caso, debería saltar un error. 

Y un test es lo que necesitamos ahora:

```typescript
describe('For managing products', () => {
    let forManagingProducts: ForManagingProductsTest

    beforeEach(async () => {
        const fixtures = new Map<string, any>([
            ['products', new Map<string, Product>([
                ['existing-product-id', ProductExamples.existingProduct()],
                ['exhausted-product-id', ProductExamples.exhaustedProduct()],
            ])],
            ['identities', ['product-id']]
        ])
        forManagingProducts = new ForManagingProductsTest(fixtures)

    })

    describe('When consuming a product that we have registered', () => {
        it('Should decrease the stock of the product', async () => {
            const result = forManagingProducts.ConsumeProduct('existing-product-id', 5)
            expect(result.successful()).toBe(true)
            const currentStock = forManagingProducts.GetCurrentStock('existing-product-id')
            expect(currentStock.unwrap()).toEqual({
                id: 'existing-product-id',
                name: 'existing-product-name',
                stock: 5 // 10 initial stock - 5 consumed
            })
        })
    })
})
```

A continuación, nos toca añadir todo lo necesario para el test se pueda, al menos, ejecutar.

```typescript
export class ForManagingProductsTest {
    private configurator: InventoryConfigurator

    constructor(fixtures: Map<string, any>) {
        this.configurator = InventoryConfigurator.forTest(fixtures)
    }

    // Code removed for clarity

    ConsumeProduct(existingProductId: string | undefined, number: number | undefined): Result<void> {
        const command = new ConsumeProduct(existingProductId!, number!)
        const handler = this.configurator.buildConsumeProductHandler()
        return handler.handle(command)
    }
}
```

```typescript
export class InventoryConfigurator {
    private readonly storage: InMemoryProductStorage
    private readonly inventory: Inventory

    constructor(storage: InMemoryProductStorage, inventory: Inventory) {
        this.storage = storage
        this.inventory = inventory
    }

    // Code removed for clarity
    
    buildConsumeProductHandler() {
        return new ConsumeProductHandler(this.inventory)
    }
}
```

Y, finalmente:

```typescript
export class ConsumeProduct {
    public readonly productId: string;
    public readonly quantity: number;

    constructor(productId: string, quantity: number) {
        this.productId = productId;
        this.quantity = quantity;
    }
}
```

```typescript
import {Inventory} from '../../../Inventory'
import {Result} from '../../Result'
import {ConsumeProduct} from './ConsumeProduct'

export class ConsumeProductHandler {
    private inventory: Inventory

    constructor(inventory: Inventory) {
        this.inventory = inventory
    }

    handle(command: ConsumeProduct): Result<null> {
        throw new Error('ConsumeProductHandle.handle Method not implemented.')
    }
}
```

Hasta que finalmente obtenemos el error esperado:

```plaintext
Error: ConsumeProductHandle.handle Method not implemented.
```

En este punto, debemos movernos al ciclo de test internos, en este caso, de `ConsumeProductHandler`. Ya hemos aprendido que únicamente debemos doblar puertos, todos los demás componentes que podamos necesitar los usaremos nativamente. Este test verifica que el resultado sea exitoso y que el producto consumido se haya actualizado correctamente. Para verificar esto último lo que haré será agotar el producto retirando todas las existencias. Esto es porque ya dispongo del método `Product.isExhausted()`, con lo que no necesito buscar una forma de comprobar las unidades disponibles de producto.

```typescript
describe('ConsumeProductHandler', () => {
    let handler: ConsumeProductHandler
    let forStoringProducts: ForStoringProducts

    beforeEach(() => {
        forStoringProducts = new InMemoryProductStorage(new Map<string, Product>([
            ['existing-product-id', ProductExamples.existingProduct()],
        ]))
        let inventory: Inventory
        inventory = new Inventory(forStoringProducts, new ForGettingIdentitiesDummy())
        handler = new ConsumeProductHandler(inventory)
    })

    describe('When we consume all stock of a product', () => {
        it('should success', () => {
            const result = handler.handle(new ConsumeProduct('existing-product-id', 10))
            expect(result.successful()).toBe(true)
        })

        it('should exhaust the product', () => {
            handler.handle(new ConsumeProduct('existing-product-id', 10))
            const consumedProduct = forStoringProducts.getById('existing-product-id')
            expect(consumedProduct?.isExhausted()).toEqual(true)
        })
    })
})
```

Para hacer pasar el test tenemos que empezar por aquí:

```typescript
export class ConsumeProductHandler {
    private inventory: Inventory

    constructor(inventory: Inventory) {
        this.inventory = inventory
    }

    handle(command: ConsumeProduct): Result<null> {
        this.inventory.consumeProduct(command.productId, command.quantity)

        return new SuccessResult(null)
    }
}
```

Al ejecutar el test, el mensaje es:

```plaintext
TypeError: this.inventory.consumeProduct is not a function
```

Por lo que añadimos el método `consumeProduct`. Nos basta añadirlo para que la primera parte del test pase, pero tirando el error que se muestra, la indicación es mucho más clara.

```typescript
export class Inventory {
    private readonly storage: ForStoringProducts
    private readonly identityProvider: ForGettingIdentities

    constructor(storage: ForStoringProducts, identityProvider: ForGettingIdentities) {
        this.storage = storage
        this.identityProvider = identityProvider
    }

    // Code removed for clarity

    consumeProduct(productId: string, quantity: number): void {
        throw new Error('consumeProduct Method not implemented.')
    }
}
```

Lo apropiado ahora es moverse un poco más adentro y escribir un test para construir `Inventory.consumeProduct`. Luego aprovecharé para refactorizar este test:

```typescript
describe('Inventory', () => {
    
    // Code removed for clarity
    
    it('should consume product in quantity', () => {
        const aProduct = ProductExamples.existingProduct()
        const productStorage = new InMemoryProductStorage(
            new Map<string,  Product>([['existing-product-id', aProduct]])
        )
        const inventory = new Inventory(productStorage, new ForGettingIdentitiesDummy())

        inventory.consumeProduct('existing-product-id', 10)
        const updatedProduct = productStorage.getById('existing-product-id')
        expect(updatedProduct?.isExhausted()).toBe(true)
    })
})
```

Fallará porque no hay nada implementado, así que vamos a ello:

```typescript
export class Inventory {
    private readonly storage: ForStoringProducts
    private readonly identityProvider: ForGettingIdentities

    constructor(storage: ForStoringProducts, identityProvider: ForGettingIdentities) {
        this.storage = storage
        this.identityProvider = identityProvider
    }

    // Code removed for clarity

    consumeProduct(productId: string, quantity: number): void {
        const product = this.storage.getById(productId)

        const updatedProduct = product.consume(quantity)

        this.storage.store(productId, updatedProduct)
    }
}
```

Ahora fallará el test de `Product`, porque no existe el método `consume`. Así que, como ya hemos hecho varias veces, vamos a añadir el test correspondiente:

```typescript
describe('Product', () => {
    it('should be able to consume units of product', () => {
        const product = Product.register('product-01', 'Test Product', 10);
        const updated = product.consume(5);
        expect(updated.isExhausted()).toBe(false);
    })

    it('should be able to consume all units of product', () => {
        const product = Product.register('product-01', 'Test Product', 10);
        const updated = product.consume(10);
        expect(updated.isExhausted()).toBe(true);
    })

    it('should not allow to consume more than available', () => {
        const product = Product.register('product-01', 'Test Product', 10);
        expect(() => product.consume(11)).toThrow(InvalidProductQuantity)
    })

    it('should not allow to consume negative quantities', () => {
        const product = ProductExamples.existingProduct()
        expect(() => product.consume(-5)).toThrow(InvalidProductQuantity)
    })

    it('should not allow to consume zero quantities', () => {
        const product = ProductExamples.existingProduct()
        expect(() => product.consume(0)).toThrow(InvalidProductQuantity)
    })
})
```

Y la implementación:

```typescript
export class Product {
    private readonly id: string
    private readonly name: string
    private readonly stock: number

    private constructor(id: string, name: string, stock: number) {
        this.id = id
        this.name = name
        this.stock = stock
    }

    // Code removed for clarity
    
    consume(quantity: number): Product {
        if (quantity < 1) {
            throw new InvalidProductQuantity(quantity)
        }

        const updatedQuantity = this.stock - quantity

        if (updatedQuantity < 0) {
            throw new InvalidProductQuantity(quantity)
        }

        return new Product(this.id, this.name, updatedQuantity)
    }
}
```

Con esto van a pasar ya todos los tests y tenemos nuestro puerto para gestionar productos terminado, al menos en lo que hemos definido hasta ahora.

Llegadas a este punto, se me ocurren algunos refactors y varios temas que quizá podamos tratar en capítulos siguientes.

## Conclusiones

En esta entrega hemos vuelto a comparar las metodologías clasicista y London School, pero en el contexto de desarrollos en los que contamos con componentes ya existentes en los cuales tenemos que introducir alguna modificación.

De nuevo, podemos apreciar las diferencias más importantes: la metodología clasicista nos permite mover el desarrollo con un único test exterior, mientras que la London School nos requiere entender qué componente se ocupa de qué responsabilidades y nos pide introducir tests unitarios allí donde se van a introducir los cambios.

¿Cuál es la ventaja de tener tests e2e y unitarios? Fundamentalmente, es la capacidad de resolución. Imaginemos el siguiente cambio:

```typescript
export class Product {
    private readonly id: string
    private readonly name: string
    private readonly stock: number

    private constructor(id: string, name: string, stock: number) {
        this.id = id
        this.name = name
        this.stock = stock
    }

    // Code removed for clarity
    
    consume(quantity: number): Product {
        if (quantity < 0) { // Someone wrongly change the 1 to 0
            throw new InvalidProductQuantity(quantity)
        }

        const updatedQuantity = this.stock - quantity

        if (updatedQuantity < 0) {
            throw new InvalidProductQuantity(quantity)
        }

        return new Product(this.id, this.name, updatedQuantity)
    }
}
```

Esta pequeña transformación hace fallar dos tests: uno, el exterior, nos dice que una prestación (ConsumeProduct) está funcionando mal. El otro test, el unitario, nos dice donde tiene su origen el problema.

La aplicación sigue creciendo, es hora de empezar a preocuparse por la paquetización dentro del hexágono, conceptos emergentes, ideas que no hemos desarrollado todavía y otras cuestiones.

```plaintext
src
├── InventoryConfigurator.ts
├── driven
│   ├── forGettingIdentities
│   │   ├── ConfigurableIdentityProvider.test.ts
│   │   ├── ConfigurableIdentityProvider.ts
│   │   ├── ForGettingIdentitiesDummy.ts
│   │   └── IdentityProviderStub.ts
│   └── forStoringProducts
│       ├── ForStoringProductsOneProductStub.ts
│       ├── InMemoryProductStorage.test.ts
│       └── InMemoryProductStorage.ts
├── index.ts
└── inventory
    ├── ExhaustedProduct.ts
    ├── InvalidProductId.ts
    ├── InvalidProductName.ts
    ├── InvalidProductQuantity.ts
    ├── Inventory.test.ts
    ├── Inventory.ts
    ├── Product.test.ts
    ├── Product.ts
    ├── ProductExamples.ts
    ├── ProductId.test.ts
    ├── ProductId.ts
    ├── ProductRepresentation.ts
    ├── ProductStock.ts
    ├── ProductStockRepresentation.ts
    ├── ProductWithSameNameAlreadyExists.ts
    ├── UnknownProduct.ts
    ├── driven
    │   ├── forGettingIdentities
    │   │   └── ForGettingIdentities.ts
    │   └── forStoringProducts
    │       └── ForStoringProducts.ts
    └── driving
        ├── Result.ts
        └── forManagingProducts
            ├── addProduct
            │   ├── AddProduct.ts
            │   └── AddProductHandler.ts
            ├── consumeProduct
            │   ├── ConsumeProduct.ts
            │   ├── ConsumeProductHandler.test.ts
            │   └── ConsumeProductHandler.ts
            ├── getCurrentStock
            │   ├── GetCurrentStock.test.ts
            │   ├── GetCurrentStock.ts
            │   └── GetCurrentStockHandler.ts
            └── restockProduct
                ├── RestockProduct.ts
                └── RestockProductHandler.ts

13 directories, 38 files
```
 
{% include_relative series/hexagonal-tdd.md %}
