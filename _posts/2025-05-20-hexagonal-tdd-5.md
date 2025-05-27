---
layout: post
title: TDD outside-in con arquitectura hexagonal 5
categories: articles
tags: software-design design-patterns typescript tdd hexagonal
---

En esta ocasión, vamos a centrarnos en los sad-paths, validación y gestión de errores.

<!-- TOC -->
  * [Creación de productos válidos](#creación-de-productos-válidos)
  * [¿Dónde viven las validaciones?](#dónde-viven-las-validaciones)
    * [Validaciones estructurales en el puerto](#validaciones-estructurales-en-el-puerto)
    * [Validaciones de negocio](#validaciones-de-negocio)
  * [Detalles que necesitan un arreglo](#detalles-que-necesitan-un-arreglo)
    * [Puertos bien definidos](#puertos-bien-definidos)
    * [El problema de los dobles de tests con London School](#el-problema-de-los-dobles-de-tests-con-london-school)
    * [Como queda la estructura](#como-queda-la-estructura)
    * [Gestión de ejemplos en los tests](#gestión-de-ejemplos-en-los-tests)
    * [El caso del patrón Result](#el-caso-del-patrón-result)
    * [La representación de Product](#la-representación-de-product)
  * [Conclusiones](#conclusiones)
<!-- TOC -->

## Creación de productos válidos

Vamos a establecer unas reglas de negocio sencillas para definir lo que es un producto válido:

* Ha de tener un nombre (y una cadena vacía no es un nombre), y este nombre ha de ser único.
* Si el nombre ya existe, el producto no se crea, si no que se actualizan las existencias del producto con ese nombre.
* La cantidad inicial no puede ser menor que 1.

Dado que estamos llevando este desarrollo aplicando una metodología outside-in, tiene sentido que hagamos tests de estas reglas desde fuera de la aplicación. Hacerlo así no impone una forma concreta de implementación, con tal que el puerto implicado nos devuelva los errores adecuados en caso necesario. Es importante señalar esto porque, si bien nos da libertad a la hora de diseñar la aplicación, puede que nos deje zonas en donde se puede producir inconsistencia.

De hecho, no tenemos un objeto `Product` como tal, así que ahora tendríamos que garantizar la consistencia de otra forma. O bien introducir el concepto `Product` para que esos objetos puedan hacerse cargo de ello.

Es más, hasta ahora no nos hemos preocupado mucho de estos aspectos y puede ser un buen momento hacerlo ahora.

Así que empezamos con un test que ejercita toda la interacción. Esta vez solo necesitamos recoger el error:

```typescript
describe('When we try to register products without correct data', () => {
    it ('should fail if a valid name is not provided', async () => {
        const command = new AddProduct(undefined, 100)
        const handler = configurator.buildAddProductHandler()
        const result = handler.handle(command)
        expect(result.error()).toBeInstanceOf(InvalidProductName)
    })
})
```

Añadimos todos los elementos necesarios para que el test pueda ejecutarse:

```typescript
export class AddProductResponse {
    private readonly result:string

    constructor(result: string) {
        this.result = result
    }

    unwrap(): string {
        return this.result
    }

    error() {
        
    }
}
```

```typescript
class InvalidProductName implements Error {
    name: string;
    message: string;

    constructor(productName: string) {
        this.name = 'INVALID_PRODUCT_NAME';
        this.message = `[${productName}] is not a valid name`
    }
}
```

Y finalmente obtenemos este mensaje de error del test:

```plaintext
AssertionError: expected undefined to be an instance of InvalidProductName
```

Que nos indica que `result.error()` no está devolviendo nada.

La forma más rápida de hacerlo pasar es:

```typescript
export class AddProductResponse {
    private readonly result:string

    constructor(result: string) {
        this.result = result
    }

    unwrap(): string {
        return this.result
    }

    error() {
        return new InvalidProductName('')
    }
}
```

Como hicimos en la entrega anterior, ahora que tenemos el test pasando, podríamos ir buscando el lugar adecuado para lanzar este error. En primer lugar, refactorizaré `AddProductResponse`:

```typescript
export class AddProductResponse {
    private readonly result?:string
    private readonly failure?:Error = new InvalidProductName('')

    constructor(result?: string, error?:Error) {
        this.result = result
        this.failure = error
    }

    static success(result: string): AddProductResponse {
        return new AddProductResponse(result)
    }

    static failure(failure: Error): AddProductResponse {
        return new AddProductResponse(undefined, failure)
    }

    unwrap(): string | undefined{
        if (!this.result) {
            return undefined
        }
        return this.result
    }

    error(): Error | undefined {
        return this.failure
    }
}
```

Y ahora cambio como se usa:

```typescript
export class AddProductHandler {
    private inventory: Inventory

    constructor(inventory: Inventory) {
        this.inventory = inventory
    }

    handle(command: AddProduct) {
        const newProductId = this.inventory.registerProduct(command.productName, command.initialQuantity)
        return AddProductResponse.success(newProductId)
    }
}
```

Hay una nota importante que hacer aquí. En artículos anteriores introdujimos un objeto semejante, pero una interfaz diferente. Esto es un _code smell_ que vamos a tener que solucionar cuanto antes

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

Pero, antes de eso, vamos a seguir avanzando en la validación.

Podemos empezar situándola en el propio `AddProductHandler`:

```typescript
export class AddProductHandler {
    private inventory: Inventory

    constructor(inventory: Inventory) {
        this.inventory = inventory
    }

    handle(command: AddProduct) {
        if (command.productName.length < 1) {
            return AddProductResponse.failure(new InvalidProductName(command.productName))
        }
        const newProductId = this.inventory.registerProduct(command.productName, command.initialQuantity)
        return AddProductResponse.success(newProductId)
    }
}
```

Esto hace pasar el test, así que el comportamiento estaría establecido y podremos hacer un commit con lo que llevamos hasta ahora, que hemos tocado bastantes cosas.

## ¿Dónde viven las validaciones?

Esta es una discusión recurrente. La validación de las entradas de datos al sistema responder a distintas finalidades, por lo que debería ocurrir en distintos lugares. Y esto implica que el mismo dato puede pasar por distintas fases de validación.

Ahora bien, ¿cómo se gestiona en Arquitectura Hexagonal?

En este ejercicio estamos desarrollando la aplicación (el interior del hexágono, por decirlo así) desde sus puertos. Por definición, cada puerto puede ser utilizado por un número indeterminado de actores, mediante adaptadores de los que la aplicación no tiene que saber nada.

Por tanto, la propia aplicación tiene que validar de algún modo los datos que recibe. No puede confiar ciegamente en que el input sea válido.

Así, los adaptadores deberían realizar sus propias validaciones a fin de satisfacer los requisitos del puerto. Este tipo de validación lo podríamos considerar fundamentalmente estructural: los datos son de los tipos esperados, no están vacíos si son obligatorios, y sus valores se encuentran dentro de ciertos rangos. Esta misma validación debería hacerse en el puerto que, en nuestro caso, es el conjunto _comando o query_ y su correspondiente _handler_.

Por otro lado, tendríamos un tipo de validaciones que podemos considerar semánticas o de negocio. Un cierto dato puede ser estructuralmente correcto al ser de un tipo determinado con un valor no vacío, y ser aceptado por el puerto, pero no cumplir una cierta regla de negocio. Este tipo de reglas ya corresponden a objetos dentro de la aplicación.

En el ejemplo de reglas que hemos puesto al principio, el producto para ser válido:

* Ha de tener un nombre (y una cadena vacía no es un nombre). Estructuralmente, ha de ser un tipo string, no vacío. El valor concreto que tenga no nos preocupa.
* Si el nombre existe, lo que se hace es actualizar el stock del producto, aunque ese es un caso de uso que aún no estamos manejando en la aplicación. Sin embargo, es una decisión que solo podemos tomar allí donde tengamos acceso a todos los productos.
* La cantidad inicial no puede ser menor que 1. Ha de ser un tipo numérico, específicamente un entero con un valor mayor o igual a 1. Estructuralmente, esperamos un tipo number (en _typescript_), pero solo usamos un subconjunto de sus posibles valores.

### Validaciones estructurales en el puerto

Que el nombre del producto deba ser un string no vacío es una regla de negocio que podríamos verificar en varios lugares. En cualquier caso, podríamos reflexionar de la siguiente forma:

Si el input ni siquiera es un string, no tiene sentido avanzar más en el proceso. En muchos lenguajes, `AddProduct` podría forzar el nombre del producto tenga que ser del tipo `string`, lo que impediría que el adaptador pudiese instanciar el comando. Esto no es posible en _Typescript_, que en runtime puede saltarse el tipado, por lo que debemos asegurarlo de forma explícita. 

Es decir, aunque tengo:

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

Puedo llegar a ejecutar algo como lo que sigue, si ignoro las quejas del linter:

```typescript
const command = new AddProduct(23123, 100)
const handler = configurator.buildAddProductHandler()
const result = handler.handle(command)
```

Que tal `string` contenga al menos un carácter válido es algo que tendríamos que evaluar en el Handler, una vez dentro del sistema. Así que vamos a ello:

```typescript
export class AddProductHandler {
    private inventory: Inventory

    constructor(inventory: Inventory) {
        this.inventory = inventory
    }

    handle(command: AddProduct) {
        if (typeof command.productName != 'string') {
            return AddProductResponse.failure(new InvalidProductName(command.productName))
        }
        if (command.productName.length < 1) {
            return AddProductResponse.failure(new InvalidProductName(command.productName))
        }
        const newProductId = this.inventory.registerProduct(command.productName, command.initialQuantity)
        return AddProductResponse.success(newProductId)
    }
}
```

Con este cambio el test sigue pasando y no se cuelan valores que no sean strings.

La segunda validación que tenemos ahí, que la cadena no esté vacía y forme un nombre válido pienso que tiene sentido más _adentro_, cuando se instancia el producto de forma efectiva. Pero en este caso, el error se podría indicar en forma de excepción.

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
        if (productName.length === 0) {
            throw new InvalidProductName(
                productName,
            )
        }
        const newProductId = this.identityProvider.generate()

        this.storage.store(newProductId, {id: newProductId, name: productName, stock: initialQuantity})

        return newProductId
    }
}
```

Excepción que podríamos capturar en el handler:

```typescript
export class AddProductHandler {
    private inventory: Inventory

    constructor(inventory: Inventory) {
        this.inventory = inventory
    }

    handle(command: AddProduct) {
        if (typeof command.productName != 'string') {
            return AddProductResponse.failure(new InvalidProductName(command.productName))
        }
        try {
            const newProductId = this.inventory.registerProduct(command.productName, command.initialQuantity)
            return AddProductResponse.success(newProductId)
        } catch (err : unknown) {
            return AddProductResponse.failure(err as Error)
        }
    }
}
```

Esta disposición del código no me gusta mucho. Se me ocurre este refactor en el que el método `assertValid` asegura los tipos del comando `AddProduct`:

```typescript
export class AddProductHandler {
    private inventory: Inventory

    constructor(inventory: Inventory) {
        this.inventory = inventory
    }

    handle(command: AddProduct):AddProductResponse {
        try {
            this.assertValid(command)
            const newProductId = this.inventory.registerProduct(command.productName, command.initialQuantity)
            return AddProductResponse.success(newProductId)
        } catch (err: unknown) {
            return AddProductResponse.failure(err as Error)
        }
    }

    private assertValid(command: AddProduct) {
        if (typeof command.productName != 'string') {
            throw new InvalidProductName(command.productName)
        }
    }
}
```

Nos queda introducir la validación de que la cantidad inicial no puede ser cero, y tenemos que hacer algo parecido: asegurar que el comando se construye con un número y luego verificar que ese número es mayor que cero. Este es el resultado:

```typescript
export class AddProductHandler {
    private inventory: Inventory

    constructor(inventory: Inventory) {
        this.inventory = inventory
    }

    handle(command: AddProduct):AddProductResponse {
        try {
            this.assertValid(command)
            const newProductId = this.inventory.registerProduct(command.productName, command.initialQuantity)
            return AddProductResponse.success(newProductId)
        } catch (err: unknown) {
            return AddProductResponse.failure(err as Error)
        }
    }

    private assertValid(command: AddProduct) {
        if (typeof command.productName != 'string') {
            throw new InvalidProductName(command.productName)
        }
        if (typeof command.initialQuantity != 'number') {
            throw new InvalidProductQuantity(command.initialQuantity)
        }
    }
}
```

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
        if (productName.length === 0) {
            throw new InvalidProductName(
                productName,
            )
        }

        if (initialQuantity < 1) {
            throw new InvalidProductQuantity(initialQuantity)
        }

        const newProductId = this.identityProvider.generate()

        this.storage.store(newProductId, {id: newProductId, name: productName, stock: initialQuantity})

        return newProductId
    }
}
```

### Validaciones de negocio

En Arquitectura Hexagonal la aplicación, a la que a veces llamamos "el hexágono" o "dentro" (inside), no se organiza en capas, por lo que no tenemos una capa de dominio con ese nombre. Si nos va bien organizar el código así, podemos hacerlo. Pero cualquier organización que tenga sentido para nuestro desarrollo puede ser válida.

A fin de entendernos, vamos a ver una equivalencia aproximada entre las estructuras de otras arquitecturas:

|  DDD inspired  | Onion/Clan simplified  |       Hexagonal       |
|:--------------:|:----------------------:|:---------------------:|
|     Domain     |         Domain         |        Inside         |
|  Application   |      Application       | Inside/Driven,Driving |
| Infrastructure |     Infrastructure     |    Outside/Driven     |
|       UI       |     Infrastructure     |    Outside/Driving    |

De este modo, las validaciones de negocio que situaríamos en la capa de Dominio, en Hexagonal simplemente ocurren "dentro". En muchos casos, el lugar adecuado para validar los valores con los que se instancian los objetos sería allí donde se construyen.

Ahora mismo no tenemos una clase `Product`, pero podríamos introducirla, de modo que podamos crear objetos `Product` que sigan las reglas del negocio que hemos diseñado. 

Entonces, tendría sentido hacer algo para mover este código en `Inventory` y ponerlo en un constructor de `Product`:

```typescript
registerProduct(productName: string, initialQuantity: number): string {
    if (productName.length === 0) {
        throw new InvalidProductName(
            productName,
        )
    }

    if (initialQuantity < 1) {
        throw new InvalidProductQuantity(initialQuantity)
    }

    const newProductId = this.identityProvider.generate()

    this.storage.store(newProductId, {id: newProductId, name: productName, stock: initialQuantity})

    return newProductId
}
```

La lógica de validación la podríamos llevar a `Product`:

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

    static register(newProductId: string, productName: string, initialQuantity: number): Product {
        if (productName.length === 0) {
            throw new InvalidProductName(
                productName,
            )
        }

        if (initialQuantity < 1) {
            throw new InvalidProductQuantity(initialQuantity)
        }
        return new Product(newProductId, productName, initialQuantity)
    }

    toStore() {
        return {id: this.id, name: this.name, stock: this.stock}
    }
}
```

Y así quedaría el método `registerProduct`.

```typescript
registerProduct(productName: string, initialQuantity: number): string {
    const newProductId = this.identityProvider.generate()
    const productToAdd = Product.register(newProductId, productName, initialQuantity)

    this.storage.store(newProductId, productToAdd.toStore())

    return newProductId
}
```

Y con esto, la validación de negocio queda en el lugar donde parece que tiene más sentido.

## Detalles que necesitan un arreglo

En los artículos anteriores he dejado algunas cosas sin rematar, tanto por no interrumpir la explicación del proceso de desarrollo, como por dejar que los problemas aflorasen más tarde y así entender sus consecuencias, cómo abordarlas y cómo prevenirlas.

### Puertos bien definidos

Algo que me molesta ahora es que el `Storage` recibe un objeto genérico para guardar. Personalmente, soy partidario de no mezclar los objetos del modelo de dominio con asuntos que corresponden a la persistencia y a sus tecnologías concretas.

La cuestión es que el puerto `ForStoringProducts` está condicionado por el hecho de que solo tenemos una implementación, por lo que podemos pasarle cualquier cosa. En una situación realista tendríamos que modificar la firma de la interfaz dependiendo de la tecnología concreta, lo que va en contra de la propia definición de Arquitectura Hexagonal.

En su lugar, por ese puerto deberíamos pasar solo objetos `Product` y que sea el adaptador el que tenga que tomar las decisiones técnicas que le correspondan.

Por tanto, vamos a cambiar esto, lo que seguramente afectará al modo en que hemos definido `GetCurrentStock`. Esto me viene bien como forma de mostrar qué problemas aparecen cuando no lo cuidamos desde el principio.

```typescript
export interface ForStoringProducts {
    getById(productId: string): Product | undefined

    store(productId: string, product: Product): void
}
```

Sorprendentemente, este cambio no hace fallar los tests. Pero esto es _typescript_, así que tendremos que tocar varias cosas que, en otros lenguajes, no están permitidas.

```typescript
export class Inventory {
    private readonly storage: ForStoringProducts
    private readonly identityProvider: ForGettingIdentities

    constructor(storage: ForStoringProducts, identityProvider: ForGettingIdentities) {
        this.storage = storage
        this.identityProvider = identityProvider
    }

    stockById(productId: string): ProductStock {
        const pId = ProductId.validatedFrom(productId)
        const productData: Product | undefined = this.storage.getById(productId.toString())

        if (!productData) {
            throw new UnknownProduct(productId)
        }

        return new ProductStock(
            productData.id,
            productData.name,
            productData.stock,
        )
    }

    registerProduct(productName: string, initialQuantity: number): string {
        const newProductId = this.identityProvider.generate()
        const productToAdd = Product.register(newProductId, productName, initialQuantity)

        this.storage.store(newProductId, productToAdd)

        return newProductId
    }
}
```

`Product` y `ProductStock` representan la misma entidad de negocio (el producto), pero no son lo mismo. `Product` sería una entidad en DDD, mientras que `ProductStock` es más bien un _Read Model_, un objeto simple cuya forma responde a las necesidades de un consumidor de la aplicación.

Así que vamos a hacer un cambio bastante grande sobre lo que teníamos. Por ejemplo, movemos la lógica en `GetCurrentStockHandler` que controlaba que el producto tuviese existencias a `Inventory`.

```typescript
export class Inventory {
    private readonly storage: ForStoringProducts
    private readonly identityProvider: ForGettingIdentities

    constructor(storage: ForStoringProducts, identityProvider: ForGettingIdentities) {
        this.storage = storage
        this.identityProvider = identityProvider
    }

    stockById(productId: string): ProductStock {
        const pId = ProductId.validatedFrom(productId)
        const product: Product | undefined = this.storage.getById(productId.toString())

        if (!product) {
            throw new UnknownProduct(productId)
        }

        if (product.isExhausted()) {
            throw new ExhaustedProduct(productId)
        }

        return new ProductStock(
            product.id,
            product.name,
            product.stock,
        )
    }

    registerProduct(productName: string, initialQuantity: number): string {
        const newProductId = this.identityProvider.generate()
        const productToAdd = Product.register(newProductId, productName, initialQuantity)

        this.storage.store(newProductId, productToAdd)

        return newProductId
    }
}
```

Este cambio en la definición del puerto afecta a `InMemoryProductStorage`

### El problema de los dobles de tests con London School

Esto hará fallar este test porque `InventoryExhaustedProductStub` ya no refleja correctamente el diseño de la aplicación.

```typescript
describe('GetCurrentStockHandler', () => {
    describe('When we ask the current stock of an exhausted product', () => {
        it('Should return an error', () => {
            const query = new GetCurrentStock('exhausted-product-id')
            const handler = new GetCurrentStockHandler(new InventoryExhaustedProductStub())
            const result = handler.handle(query)
            expect(() => {result.unwrap()}).toThrowError()
            expect(result.errorMessage()).toEqual('Product Id exhausted-product-id exhausted')
        })
    })
}
```

Esto es debido a que `Inventory` no debería haber sido doblado en este test, ya que él mismo es un objeto puro del interior de la aplicación. Son colaboradores suyos los que resultan ser implementaciones de un puerto driven y, por tanto, pueden necesitar ser reemplazados por implementaciones personalizadas para tests.

Esta es una de las razones por las que si aplicamos la metodología London School deberíamos decidir cuidadosamente qué componentes necesitan ser introducidos como dobles. Esto en Arquitectura Hexagonal se puede responder fácilmente: si implementa un puerto driven o secundario es casi seguro que vamos a necesitar un doble.

Por tanto, para hacer pasar el test lo que necesitamos es usar un `Inventory` configurado con dependencias adecuadas para este test. También necesitaremos una función constructora para `Product` que no valide nada, que será útil cuando necesitemos reconstruirlo al recuperarlo del almacenamiento.

```typescript
class ForStoringProductsStub implements ForStoringProducts {
    private readonly productToReturn?: Product
    constructor(shouldReturn?: Product) {
        this.productToReturn = shouldReturn
    }
    getById(productId: string): Product | undefined {
        return this.productToReturn
    }

    store(productId: string, product: Product): void {
        throw new Error('Should not be called in this test.')
    }
}
class ForGettingIdentitiesDummy implements ForGettingIdentities {
    generate(): string {
        throw new Error('Should not be called in this test.')
    }
}

describe('GetCurrentStockHandler', () => {
    describe('When we ask the current stock of an existing product', () => {
        it('Should return a product stock object as response with available units', () => {
            const query = new GetCurrentStock('existing-product-id')
            const aProduct = Product.register('existing-product-id', 'existing-product-name', 10)

            const handler = new GetCurrentStockHandler(new Inventory(new ForStoringProductsStub(aProduct), new ForGettingIdentitiesDummy()))
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
            const handler = new GetCurrentStockHandler(new Inventory(new ForStoringProductsStub(), new ForGettingIdentitiesDummy()))
            const result = handler.handle(query)
            expect(() => {result.unwrap()}).toThrowError()
            expect(result.errorMessage()).toEqual('Product Id non-existing-product-id doesn\'t exist')
        })
    })

    describe('When we ask the current stock of an exhausted product', () => {
        it('Should return an error', () => {
            const query = new GetCurrentStock('exhausted-product-id')
            const aProduct = Product.rebuild('exhausted-product-id', 'exhausted-product-name', 0)
            const handler = new GetCurrentStockHandler(new Inventory(new ForStoringProductsStub(aProduct), new ForGettingIdentitiesDummy()))
            const result = handler.handle(query)
            expect(() => {result.unwrap()}).toThrowError()
            expect(result.errorMessage()).toEqual('Product Id exhausted-product-id exhausted')
        })
    })
})
```

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

    static register(newProductId: string, productName: string, initialQuantity: number): Product {
        if (productName.length === 0) {
            throw new InvalidProductName(
                productName,
            )
        }

        if (initialQuantity < 1) {
            throw new InvalidProductQuantity(initialQuantity)
        }
        return new Product(newProductId, productName, initialQuantity)
    }

    static rebuild(productId: string, productName: string, stock: number) {
        return new Product(productId, productName, stock)
    }

    isExhausted(): boolean {
        return this.stock === 0
    }
}
```

Otro test en el que hemos tenido que arreglar los dobles es este. La razón ahora es diferente, ya que hemos cambiado la firma de `ForStoringProducts`:

```typescript
class ProductStorageStub implements ForStoringProducts {
    constructor() {
    }

    store(productId: string, product: Product): void {
        throw new Error('Method not implemented.')
    }

    getById(_: string): Product | undefined {
        return Product.rebuild(
            'existing-product-id',
            'existing-product-name',
            10,
        )
    }
}

class ProductStorageNoProductStub implements ForStoringProducts {
    constructor() {
    }

    store(productId: string, product: Product): void {
        throw new Error('Method not implemented.')
    }

    getById(_: string): Product | undefined {
        return undefined
    }
}

class IdentityProviderDummy implements ForGettingIdentities {
    generate(): string {
        return ''
    }
}

describe('Inventory', () => {
    it('should return a ProductStock providing and id', () => {
        const inventory = new Inventory(new ProductStorageStub(), new IdentityProviderDummy())
        let expected = new ProductStock(
            'existing-product-id',
            'existing-product-name',
            10
        )
        expect(inventory.stockById('existing-product-id')).toEqual(expected)
    })

    it('should throw Error if no product found', () => {
        const inventory = new Inventory(new ProductStorageNoProductStub(), new IdentityProviderDummy())
        expect(() => {
            inventory.stockById('no-existing-product-id')
        }).toThrowError(UnknownProduct)
    })
})
```

Este cambio también nos introduce una reflexión interesante. La posibilidad de reutilizar dobles entre distintos tests. Y es que en este ejemplo, podríamos perfectamente usar el mismo Stub que definimos para el test anterior ya que es un doble cuya función es devolvernos el `Product` que le hayamos definido o undefined, cuando no queremos que lo haga.

Todo esto ayuda a simplificar nuestro código y su mantenimiento. Y los problemas que nos estamos encontrando nos ayudan a entender el riego que introduce London School si no escogemos con cuidado los dobles.

```typescript
export class ForStoringProductsOneProductStub implements ForStoringProducts {
    private readonly productToReturn?: Product

    constructor(shouldReturn?: Product) {
        this.productToReturn = shouldReturn
    }

    getById(productId: string): Product | undefined {
        return this.productToReturn
    }

    store(productId: string, product: Product): void {
        throw new Error('Should not be called in this test.')
    }
}
```

Suele decirse que debemos doblar (mockear) roles, no clases. En Arquitectura Hexagonal lo que doblamos son los puertos. Es un criterio que no hemos seguido en los artículos anteriores y ahora hemos tenido que corregirlo.

### Como queda la estructura

Tras los múltiples arreglos que ha habido que aplicar, aquí tenemos la estructura provisional

```plaintext
src
├── InventoryConfigurator.ts
├── driven
│   ├── forGettingIdentities
│   │   ├── ForGettingIdentitiesDummy.ts
│   │   └── IdentityProvider.ts
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
    ├── Product.ts
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

11 directories, 27 files
```

Como puntos a destacar, la carpeta `inventory`, que sería el "interior" de la aplicación empieza a estar bastante poblada. Vamos a necesitar introducir algunos criterios de organización que faciliten gestionarla.

Hay lenguajes en los que la recomendación es un archivo por clase, pero en aquellos que no lo prohíben expresamente, puede ser interesante explorar la opción de tener varias clases en un mismo archivo.

### Gestión de ejemplos en los tests

Por otro lado, no estaría mal centralizar nuestros ejemplos de `Product` para test con un patrón _Object Mother_. Este patrón es un builder muy especializado que proporciona instancias prototípicas de las clases que nos interesan. Esto ayuda a tener coherencia entre los distintos tests que usan ejemplos del mismo tipo.

En nuestro ejercicio podríamos tener productos con existencias y productos agotados, que tienen comportamientos diferentes y característicos en el contexto de nuestro problema.

```typescript
export class ProductExamples {
    static existingProduct(): Product {
        return Product.rebuild(
            'existing-product-id',
            'existing-product-name',
            10
        )
    }

    static exhaustedProduct(): Product {
        return Product.rebuild(
            'exhausted-product-id',
            'exhausted-product-name',
            0
        )
    }
}
```

### El caso del patrón Result

En el caso de los objetos `*Response` como hemos señalado antes estábamos creando clases y objetos similares que respondían a un patrón _Result_. El patrón _Result_ nos proporciona una forma de gestionar errores que permite gestionar el flujo de ejecución y no recurrir a las excepciones, salvo cuando estas tienen sentido.

En el caso concreto de Arquitectura Hexagonal, ofrece la ventaja de proveer una interfaz en los puertos Driving muy consistente. Estoy preparando un artículo bastante detallado para publicar en el blog en un futuro próximo en el que explico el patrón.

Pero, de momento, he aquí la implementación que he pensado para nuestro ejercicio:

```typescript
export interface Result<T> {
    successful(): boolean

    failure(): boolean

    unwrap(): T

    error(): Error
}

export class SuccessResult<T> implements Result<T> {
    private readonly result: T

    constructor(result: T) {
        this.result = result
    }

    failure(): boolean {
        return false
    }

    successful(): boolean {
        return true
    }

    error(): Error {
        throw new Error('This result has been successful')
    }

    unwrap(): T {
        return this.result
    }
}

export class FailedResult<T> implements Result<T> {
    private readonly fail: Error


    constructor(fail: Error) {
        this.fail = fail
    }

    failure(): boolean {
        return true
    }

    successful(): boolean {
        return false
    }

    unwrap(): T {
        throw new Error('This result has an error.', {cause: this.fail})
    }

    error(): Error {
        return this.fail
    }
}
```

Fíjate como la usamos en `AddProductHandler`:

```typescript
export class AddProductHandler {
    private inventory: Inventory

    constructor(inventory: Inventory) {
        this.inventory = inventory
    }

    handle(command: AddProduct): Result<string> {
        try {
            this.assertValid(command)
            const newProductId = this.inventory.registerProduct(command.productName, command.initialQuantity)
            return new SuccessResult<string>(newProductId)
        } catch (err: unknown) {
            return new FailedResult<string>(err as Error)
        }
    }

    private assertValid(command: AddProduct) {
        if (typeof command.productName != 'string') {
            throw new InvalidProductName(command.productName)
        }
        if (typeof command.initialQuantity != 'number') {
            throw new InvalidProductQuantity(command.initialQuantity)
        }
    }
}
```


Esto nos permite ahorrar un par de clases `*Response`. Además, ahora podemos testear los errores por su tipo, lo que hace que este tipo de tests sea menos frágil al no depender de un detalles como el mensaje de error.

```typescript
describe('GetCurrentStockHandler', () => {
    describe('When we ask the current stock of an existing product', () => {
        it('Should return a product stock object as response with available units', () => {
            const query = new GetCurrentStock('existing-product-id')
            const aProduct = ProductExamples.existingProduct()

            const handler = new GetCurrentStockHandler(new Inventory(new ForStoringProductsOneProductStub(aProduct), new ForGettingIdentitiesDummy()))
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
            const handler = new GetCurrentStockHandler(new Inventory(new ForStoringProductsOneProductStub(), new ForGettingIdentitiesDummy()))
            const result = handler.handle(query)
            expect(() => {
                result.unwrap()
            }).toThrowError()
            expect(result.error()).toBeInstanceOf(UnknownProduct)
        })
    })

    describe('When we ask the current stock of an exhausted product', () => {
        it('Should return an error', () => {
            const query = new GetCurrentStock('exhausted-product-id')
            const aProduct = ProductExamples.exhaustedProduct()
            const handler = new GetCurrentStockHandler(new Inventory(new ForStoringProductsOneProductStub(aProduct), new ForGettingIdentitiesDummy()))
            const result = handler.handle(query)
            expect(() => {
                result.unwrap()
            }).toThrowError()
            expect(result.error()).toBeInstanceOf(ExhaustedProduct)
        })
    })
})
```

La estructura del código queda como sigue:

```plaintext
src
├── InventoryConfigurator.ts
├── driven
│   ├── forGettingIdentities
│   │   ├── ForGettingIdentitiesDummy.ts
│   │   └── IdentityProvider.ts
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
    ├── Product.ts
    ├── ProductExamples.ts
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
        ├── Result.ts
        └── forManagingProducts
            ├── addProduct
            │   ├── AddProduct.ts
            │   └── AddProductHandler.ts
            └── getCurrentStock
                ├── GetCurrentStock.test.ts
                ├── GetCurrentStock.ts
                └── GetCurrentStockHandler.ts

11 directories, 27 files
```

He puesto `Result.ts` dentro de la carpeta driving porque, al menos de momento, la estamos usando como elemento de la interfaz provista por los puertos. Si fuéramos a usarla en otras partes, tendríamos que ponerlo en algún lugar más general.

### La representación de Product

Otro tema que tenemos que solucionar es la forma en que la información del Producto es representada en la respuesta que se devuelve por el puerto _ForManagingProducts_. Los objetos Product no deberían salir de la aplicación y lo más lógico sería que hacia afuera se pasen representaciones de la información adecuadas para el tipo de necesidad que tienen los actores interesados.

En este sentido, puede ayudarlos en patrón _Representation_ que [hemos usado otras veces en el blog](/representation-pattern/). En este patrón, el objeto que queremos representar puede recibir a otro objeto que será poblado con sus datos. Para ello expone una interfaz que le permite recibir datos de tal forma que el objeto representado no expone sus propiedades, sino que pasa valores etiquetados con una clave que el objeto destinatario puede usar como le parezca.

Esta es la interfaz que usaremos:

```typescript
export interface ProductRepresentation<T> {
    fill(key: string, value: unknown): void

    print(): T
}
```

Aquí un ejemplo de representación en la que especificamos el tipo de salida. El uso del genérico no nos condiciona, aunque nos permite controlar mejor qué es lo que mostramos.

```typescript
export class ProductStockRepresentation implements ProductRepresentation<ProductStock> {
    id: string | undefined
    name: string | undefined
    stock: number | undefined

    fill(key: string, value: unknown) {
        if (Object.prototype.hasOwnProperty.call(this, key)) {
            (this as any)[key] = value
        }
    }

    print(): ProductStock {
        return {
            id: this.id,
            name: this.name,
            stock: this.stock
        } as ProductStock
    }
}
```

Y este es el tipo que exponemos:

```typescript
export type ProductStock = {
    id: string
    name: string
    stock: number
}
```

`Product` genera ahora sus representaciones de esta forma:

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

    static register(newProductId: string, productName: string, initialQuantity: number): Product {
        // Code removed for clarity
    }

    static rebuild(productId: string, productName: string, stock: number) {
        // Code removed for clarity
    }

    isExhausted(): boolean {
        // Code removed for clarity
    }

    representAs(representation: ProductRepresentation<any>): ProductRepresentation<any> {
        representation.fill('id', this.id)
        representation.fill('name', this.name)
        representation.fill('stock', this.stock)

        return representation
    }
}
```

Así la usamos:

```typescript
export class Inventory {
    private readonly storage: ForStoringProducts
    private readonly identityProvider: ForGettingIdentities

    constructor(storage: ForStoringProducts, identityProvider: ForGettingIdentities) {
        this.storage = storage
        this.identityProvider = identityProvider
    }

    stockById(productId: string): ProductRepresentation<any> {
        const pId = ProductId.validatedFrom(productId)
        const product: Product | undefined = this.storage.getById(productId.toString())

        if (!product) {
            throw new UnknownProduct(productId)
        }

        if (product.isExhausted()) {
            throw new ExhaustedProduct(productId)
        }

        return product.representAs(new ProductStockRepresentation())
    }

    registerProduct(productName: string, initialQuantity: number): string {
        // Code removed for clarity
    }
}
```

Para ver la flexibilidad que ofrece este patrón, aquí tienes un ejemplo con otra representación mucho más simple:

```typescript
export class ProductNameRepresentation implements ProductRepresentation<string> {
    name: string | undefined

    fill(key: string, value: unknown) {
        if (Object.prototype.hasOwnProperty.call(this, key)) {
            (this as any)[key] = value
        }
    }

    print(): string {
        return this.name!
    }
}
```

## Conclusiones

Al principio, el hecho de que haya habido defectos e inconsistencias en el código de los artículos me molestaba un poco. Sin embargo, creo que esta entrega muestra que puede haber sido algo beneficioso.

Para empezar, porque refleja algo muy normal en cualquier proceso de desarrollo. Al principio no se toman siempre las mejores decisiones, o no se mantiene una coherencia completa. Hay muchas cuestiones que se resuelven de manera tentativa, a la espera de saber mejor qué es lo que vamos a necesitar o lo que se nos va a pedir en un momento dado. Por eso, procedemos en ciclos de feedback cortos.

Para eso necesitamos reducir en lo posible el coste del cambio. Si nuestras metodologías y diseños nos permiten posponer decisiones y cambiar de curso de manera poco dolorosa, estaremos en condiciones de aplicar cambios significativos en el código, con un coste asequible.

Así, por ejemplo, salvo en lo que se refiere al cambio al patrón _Result_ genérico que hemos hecho al final, nuestros tests _e2e_ han resultado ser bastante resilientes. Hemos podido cambiar bastantes cosas dentro del código sin afectar al comportamiento de manera grave.

Esto no ha ocurrido con los test interiores, generados al usar el modelo London School. Tales tests se rompieron por una mala elección de los dobles introducidos, lo cual nos lleva a una recomendación práctica muy sencilla: **en Arquitectura Hexagonal solo debemos hacer dobles de los puertos**. Si es un objeto que vive en el interior del hexágono no se dobla, aunque puede que tenga dependencias que sí.

{% include_relative series/hexagonal-tdd.md %}
