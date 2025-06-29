---
layout: post
title: El configurador y la aplicación
series: outside-in-ha
categories: articles
tags: software-design design-patterns typescript tdd hexagonal
---

El patrón de Arquitectura Hexagonal no determina nada acerca de como implementar el configurador, más allá de ser el lugar donde la aplicación se cose y se prepara para funcionar.

El configurador es el quinto elemento del patrón, junto con la aplicación, los actores, los puertos y los adaptadores. Al igual que ocurre con esos otros elementos, no se prescriben muchas cosas acerca de cómo implementarlo. Esto deja libertad para elegir el tipo de solución que más nos convenga en cada caso. Como es de suponer, el configurador debería ser sensible al entorno de ejecución, permitiendo construir la aplicación con las dependencias adecuadas. Siguiendo las prácticas habituales, leerá esta información de archivos .env para poder tomar decisiones.

En la medida en que montar el árbol de dependencias puede hacerse complicado, es interesante considerar el uso de un contenedor de inyección de dependencias que nos ayude a gestionarlo. Este tipo de necesidades probablemente nos llevará a utilizar librerías o frameworks, a poco que nuestra aplicación tenga una cierta envergadura.

Pero, por otro lado, hay algo que aún no tenemos y es algún adaptador primario que permita interactuar con la aplicación a un actor humano. De hecho, sí que tenemos un configurador, pero está espacialmente adaptado a su uso en el entorno de test. Los tests, en Arquitectura Hexagonal, son actores primarios. Sin embargo, un actor humano necesita algún tipo de adaptador con el que traducir sus acciones en un lenguaje que el puerto pueda entender. 

## Un poco de front-end

En este caso, voy a recurrir a un agente de IA para que me ayude a preparar una _Single Page Application_ con React, que me servirá para interactuar con `Inventory`. No voy a entrar en detalles porque el desarrollo _front-end_ no es mi campo. El caso es que _Junie_, el agente de IntelliJ, se las arregló para montar una interfaz bastante resultona, aunque me llevó su tiempo ajustar todos los detalles necesarios para hacerla funcionar y disponerlo todo a mi gusto. Y que me permitiese depurar. En otro artículo abordaré el proceso de desarrollar un adaptador primario siguiendo TDD.

![Interfaz web para el Inventory System](/assets/images/tddha/spa.png)

Una vez conseguido, voy a fijarme en este detalle de `App.tsx`, que es donde la SPA se monta y requiere el configurador.

```tsx
// Creamos una instancia del configurador para la aplicación web
const createAppConfigurator = () => {
    // Crear un almacenamiento en memoria vacío
    const storage = new InMemoryProductStorage(new Map());
    // Crear un proveedor de identidades
    const identityProvider = new ConfigurableIdentityProvider(
        'pr-001',
        'pr-002',
        'pr-003',
        'pr-004',
        'pr-005',
        'pr-006',
        'pr-007',
        'pr-008',
        'pr-009',
        'pr-010',
        'pr-011',
    );
    // Crear la instancia del inventario
    const inventory = new Inventory(storage, identityProvider);
    // Crear y devolver el configurador
    return new InventoryConfigurator(storage, inventory);
};

const App: React.FC = () => {
    const configurator = createAppConfigurator();

    return (
        <div className="app-container">
            {/*Code removed for clarity*/}
        </div>
    );
};

export default App;

```

Como se puede ver, tenemos que usar el proveedor de identidades configurable porque no tenemos uno de producción, que nos de _id_ adecuados e _infinitos_. Por otro lado, vemos que Junie necesita saber muchas cosas para instanciar el configurador. No debería saber todas estas cosas, sino únicamente pedir una instancia del configurador adecuada.

Y, ¿cómo usa la SPA a la aplicación? Aquí podemos ver un ejemplo en el que la `addProduct` instancia un comando `AddProduct` y le pide al configurador el `AddProductHandler` ya listo para usar.

```tsx
// Componente proveedor que encapsula la funcionalidad del inventario
export const InventoryProvider: React.FC<InventoryProviderProps> = ({ children, configurator }) => {
    // Estados para las operaciones
    const [addProductState, setAddProductState] = useState<OperationState>({ loading: false, error: null });
    const [getCurrentStockState, setGetCurrentStockState] = useState<OperationState>({ loading: false, error: null });
    const [restockProductState, setRestockProductState] = useState<OperationState>({ loading: false, error: null });
    const [consumeProductState, setConsumeProductState] = useState<OperationState>({ loading: false, error: null });

    // Método para añadir un producto
    const addProduct = useCallback(
        async (productName: string, initialQuantity: number): Promise<Result<string>> => {
            setAddProductState({ loading: true, error: null });
            try {
                const command = new AddProduct(productName, initialQuantity);
                const handler = configurator.buildAddProductHandler();
                const result = handler.handle(command);
                setAddProductState({ loading: false, error: null });

                // Dispatch productAdded event if the operation was successful
                if (result.successful()) {
                    const productId = result.unwrap();
                    window.dispatchEvent(new CustomEvent('productAdded', {
                        detail: { productId }
                    }));
                }

                return result;
            } catch (error) {
                const err = error instanceof Error ? error : new Error(String(error));
                setAddProductState({ loading: false, error: err });
                throw err;
            }
        },
        [configurator]
    );

    // Code removed for clarity
```

En fin. Ahora que tenemos un adaptador para humanos, vamos a centrarnos en construir un configurador adecuado. No sin antes, preparar nuestro proveedor de identidades de producción. Para el ejercicio nos basta con el adaptador `InMemoryProductStorage`, que funcionará siempre que no refresquemos la página. En un próximo artículo veremos como escribir un adaptador un poco más persistente.

## ForGettingIdentities, pero de verdad

Hasta ahora, hemos ido creando adaptadores en función de nuestras necesidades de desarrollo del hexágono en ujn proceso más o menos orgánico. Ahora vamos a ver cómo sería desarrollar un adaptador a partir del puerto, que proporciona una interfaz requerida específica.

He aquí la interfaz, que no tiene mayores misterios.

```typescript
export interface ForGettingIdentities {
    generate(): string
}
```

La generación de identificadores toca elementos del mundo real: cuando no es un generador aleatorio o pseudoaleatorio, es un identificador generado por un actor como una base de datos, etc., por lo que necesitamos un puerto que nos permita conversar con tal actor. Como se puede ver, la interfaz es mínima, lo que permite un uso muy flexible de esta capacidad. La función del puerto no es proveernos exclusivamente de Identificadores de Producto, que podrían ser considerados como propios del dominio. En cambio, su propósito es hacer posible que obtengamos identificadores generados mediante alguna tecnología concreta que ya usaremos como nos parezca adecuado en el interior del hexágono.

Por supuesto, desarrollar con tests cualquier adaptador que toque tecnología del mundo real o, como es el caso, que no tenga un resultado determinista presenta dificultades. Analicemos este caso.

Para nuestra implementación quiero usar identificadores únicos cortos, que van a ser generados con la librería [Short Unique Id](https://github.com/simplyhexagonal/short-unique-id). La implementación es trivial, pero desarrollarlo con TDD tiene su miga tanto por la impredictibilidad, como por el hecho de que sea trivial:

```typescript
describe('ShortUniqueIdProvider', () => {
    const generator = new ShortUniqueIdProvider();
    const idLength = 8

    describe('Identifier', () => {
        it('should have a fixed length', () => {
            const id = generator.generate();
            expect(id.length).toEqual(idLength);
        });
    })
})
```

Esto se puede hacer pasar así, lo que no es gran cosa, pero establece el comportamiento.

```typescript
export class ShortUniqueIdProvider implements ForGettingIdentities {
    generate(): string {
        return "01234567"
    }
}
```

Ahora, podríamos introducir la librería. Basta pasar como opción que queremos una longitud de 8 caracteres para que el test pase.

```typescript
export class ShortUniqueIdProvider implements ForGettingIdentities {
    generate(): string {
        const generator = new ShortUniqueId({length: 8})
        return generator.rnd()
    }
}
```

Pero esta es básicamente la naturaleza del patrón adapter: hacer que se cumpla una interfaz requerida por un componente que no la expone.

Aquí tienes una muestra de los id que produce:

```plaintext
799k1g0n
eh1cT5yg
CvDBQMCF
7cZr4xwT
WPvCjPjo
gz9wWFUg
6RYqKgFl
j3yx2FLQ
```

### Los puertos no responden a conceptos del dominio

Vamos a darle una vuelta de tuerca. Supongamos que nos piden que los Id de producto sean secuenciales, que tengan la estructura "prd-00000" y con una longitud fija de nueve caracteres, incluyendo el guion. Todo ello para que sean relativamente fáciles de aprender para los humanos. Es una fórmula un poco _old school_, pero sigue siendo práctica en algunos contextos. Lo que nos importa aquí, es que introduce unas reglas de negocio, que son implementadas con la ayuda de un actor secundario. 

Esto nos lleva a una discusión interesante. Esta cita de Juan Manuel Garrido en el libro _Hexagonal Architecture Explained_ nos da la clave.

> But Hexagonal Architecture has nothing to do with DDD. Hexagonal Architecture is simply a pattern that says: Put a driven port interface of any "real world thing" (driven actor) that the hexagon needs to talk to.

Para generar estos nuevos identificadores, el hexágono _necesita hablar con una cosa del mundo real_, como es una librería que genere identificadores secuenciales, pero todos los demás requisitos son reglas de negocio. Para implementar la obtención de identificadores de producto tenemos que combinar elementos dentro del hexágono con elementos fuera de él. Lo único que queremos que ocurra fuera del hexágono es la generación de una secuencia de números.

```typescript
describe('SequentialIdProvider', () => {
    const generator = new SequentialIdProvider();

    describe('Identifier', () => {
        it('should generate a sequence', () => {
            expect(generator.generate()).toEqual('1');
            expect(generator.generate()).toEqual('2');
            expect(generator.generate()).toEqual('3');
            expect(generator.generate()).toEqual('4');
            expect(generator.generate()).toEqual('5');
            expect(generator.generate()).toEqual('6');
        });
    })
})
```

Esta implementación trabaja solo en memoria, aunque es suficiente para nuestro ejemplo. Siempre se podría mantener el estado de la secuencia en un archivo o un almacenamiento temporal tipo Redis para retomarla entre sesiones. Cuestión aparte serían las colisiones, huecos, etc., pero no es el tema a discutir ahora. 

```typescript
export class SequentialIdProvider implements ForGettingIdentities {
    private counter: number = 0
    generate(): string {
        this.counter ++
        return this.counter.toString()
    }
}
```

El único uso de `ForGettingIdentities` en la app es en `Inventory`, así que tenemos que cambiar algunas cosas...

```typescript
export class Inventory {
    private readonly storage: ForStoringProducts
    private readonly identityProvider: ForGettingIdentities

    constructor(storage: ForStoringProducts, identityProvider: ForGettingIdentities) {
        this.storage = storage
        this.identityProvider = identityProvider
    }

    // Code removed for clarity

    registerProduct(productName: string, initialQuantity: number): string {
        if (this.storage.hasProductWithName(productName)) {
            throw new ProductWithSameNameAlreadyExists(productName)
        }
        const newProductId = this.identityProvider.generate()
        const productToAdd = Product.register(newProductId, productName, initialQuantity)

        this.storage.store(newProductId, productToAdd)

        return newProductId
    }

    // Code removed for clarity
}
```

Necesitaríamos algo así para empezar: la composición del ID se hace dentro del hexágono, pero su elemento no determinista se obtiene a través de un puerto. Por supuesto, lo suyo sería extraerlo fuera de `Inventory`.

```typescript
export class Inventory {
    private readonly storage: ForStoringProducts
    private readonly identityProvider: ForGettingIdentities

    constructor(storage: ForStoringProducts, identityProvider: ForGettingIdentities) {
        this.storage = storage
        this.identityProvider = identityProvider
    }

    // Code removed for clarity

    registerProduct(productName: string, initialQuantity: number): string {
        if (this.storage.hasProductWithName(productName)) {
            throw new ProductWithSameNameAlreadyExists(productName)
        }
        const newProductId = this.newProductId()
        const productToAdd = Product.register(newProductId, productName, initialQuantity)

        this.storage.store(newProductId, productToAdd)

        return newProductId
    }

    private newProductId(): string {
        const identifier = this.identityProvider.generate()
        return `prd-${identifier.padStart(5, '0')}`
    }

    // Code removed for clarity
}
```

Ahora mismo, esto hace fallar varios tests, aunque no tantos como se podría pensar. La razón es que estamos usando identificadores que no cumplen esta regla que acabamos de introducir y que, por supuesto, no hemos definido todavía en ningún sitio. Podrías estar preguntándote qué sentido tiene hacerlo de esta forma, y si de todos modos no podría el adaptador ocuparse de generar los identificadores completamente formados.

Por supuesto, la razón es que el adaptador no sabe nada del interior de la aplicación y no es responsable de que su cumplan reglas del dominio, aunque pueda contribuir a implementarlas. Estas reglas deberían verificarse, en todo caso, en los tests de la aplicación, no en tests de adaptadores.

Te propongo una vuelta de tuerca más: imagina que el identificador ha de construirse con las primeras tres letras del nombre del producto en lugar del genérico "prd". Ese conocimiento solo existe en la aplicación. Es cierto que se le podría pasar una especie de plantilla al adaptador para que nos monte el formato deseado, pero supone añadir responsabilidades y complejidad a un elemento que no lo necesita.

```typescript
export class Inventory {
    private readonly storage: ForStoringProducts
    private readonly identityProvider: ForGettingIdentities

    constructor(storage: ForStoringProducts, identityProvider: ForGettingIdentities) {
        this.storage = storage
        this.identityProvider = identityProvider
    }

    // Code removed for clarity

    registerProduct(productName: string, initialQuantity: number): string {
        if (this.storage.hasProductWithName(productName)) {
            throw new ProductWithSameNameAlreadyExists(productName)
        }
        const newProductId = this.newProductId(productName)
        const productToAdd = Product.register(newProductId, productName, initialQuantity)

        this.storage.store(newProductId, productToAdd)

        return newProductId
    }

    private newProductId(productName: string): string {
        const identifier = this.identityProvider.generate()
        return `${productName.substring(0, 3).toLowerCase()}-${identifier.padStart(5, '0')}`
    }

    // Code removed for clarity
}
```

Para arreglar los tests que hemos roto, tenemos que cambiar los ejemplos. Por suerte, son pocos los casos:


```typescript
describe('For Managing Products Port', () => {
    let forManagingProducts: ForManagingProductsTest

    beforeEach(async () => {
        const fixtures = new Map<string, any>([
            ['identities', ['1', '2']]
        ])
        forManagingProducts = new ForManagingProductsTest(fixtures)
    })

    describe('When we add a product that is not in our database', () => {
        it('should confirm the identifier of the added product', () => {
            const result = forManagingProducts.AddProduct('ProductName', 100)
            expect(result.unwrap()).toEqual('pro-00001')
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

    describe('When we try to register a product that already exists', () => {
        it('should fail', () => {
            forManagingProducts.AddProduct('ProductName', 100)
            const result = forManagingProducts.AddProduct('ProductName', 200)
            expect(result.error()).toBeInstanceOf(ProductWithSameNameAlreadyExists)
        })

        it('should not change the stock of the existing product', () => {
            forManagingProducts.AddProduct('ProductName', 100)
            forManagingProducts.AddProduct('ProductName', 200)
            const currentStock = forManagingProducts.GetCurrentStock('pro-00001')
            expect(currentStock.unwrap()).toEqual({
                id: 'pro-00001',
                name: 'ProductName',
                stock: 100
            })
        })
    })
})
```

Ahora que pasan los tests, podemos plantearnos mover esa lógica a otro lugar. 

```typescript
describe('ProductIdentity', () => {
    it('Should generate id in the required format', () => {
        const generator = new ConfigurableIdentityProvider(
            '3'
        )
        const identity = new ProductIdentity(generator)
        expect(identity.generateFor('New Product')).toEqual('new-00003')
    })
})
```

```typescript
export class ProductIdentity {
    private generator: ForGettingIdentities

    constructor(generator: ForGettingIdentities) {
        this.generator = generator
    }

    generateFor(productName: string): string {
        const identifier = this.generator.generate()
        return `${productName.substring(0, 3).toLowerCase()}-${identifier.padStart(5, '0')}`
    }
}
```

Y así queda `Inventory` [^1]:

[^1]: Por cierto, que me he cargado el `ProductId`, que no hacía nada y lo he cambiado por una simple cláusula de guarda.

```typescript
export class Inventory {
    private readonly storage: ForStoringProducts
    private identity: ProductIdentity

    constructor(storage: ForStoringProducts, identity: ProductIdentity) {
        this.storage = storage
        this.identity = identity
    }

    // Code removed for clarity

    registerProduct(productName: string, initialQuantity: number): string {
        if (this.storage.hasProductWithName(productName)) {
            throw new ProductWithSameNameAlreadyExists(productName)
        }
        const newProductId = this.identity.generateFor(productName)
        const productToAdd = Product.register(newProductId, productName, initialQuantity)

        this.storage.store(newProductId, productToAdd)

        return newProductId
    }

    // Code removed for clarity
}
```

## Volvamos al configurador

Cuando usamos el configurador, este va a necesitar saber en qué entorno estamos trabajando a fin de decidir qué dependencias va a montar. Una forma de hacerlo es a través de variables de entorno y disponerlas en un archivo .env. Para nuestro ejemplo, voy a tener dos entornos: TEST y LOCAL, pero podrías añadir tantos como necesites (PROD, STAGING...).

Hay varios enfoques que podríamos adoptar aquí. Yo me voy a decantar porque configurator pueda acceder a esas variables de entorno y decidir qué hacer:

```typescript
export class InventoryConfigurator {
    private readonly storage: InMemoryProductStorage
    private readonly inventory: Inventory

    constructor(storage: InMemoryProductStorage, inventory: Inventory) {
        this.storage = storage
        this.inventory = inventory
    }

    static run(): InventoryConfigurator {
        const environment = process.env.APP_ENV || 'test'
        switch (environment) {
            case 'test':
                return this.forTest(new Map())
            case 'local':
                return this.forLocal()
        }
        return this.forTest(new Map())
    }

    static forTest(fixtures: Map<string, any>): InventoryConfigurator {
        // Code removed for clarity
    }

    // Code removed for clarity
}
```

El problema que tenemos aquí es que esta nueva disposición no nos permite pasar al entorno las _fixtures_ para test. Esto podría arreglarse simplemente inyectándolas a la instancia, o pasándolas de forma opcional en `run`. Con este segundo método también nos aseguramos de que no se usan en otros entornos. De momento, podemos seguir usando `forTest`. Además de eso, añado una función para obtener el environment con varios controles:

```typescript
export class InventoryConfigurator {
    private readonly storage: InMemoryProductStorage
    private readonly inventory: Inventory

    constructor(storage: InMemoryProductStorage, inventory: Inventory) {
        this.storage = storage
        this.inventory = inventory
    }
    
    static run(fixtures?: Map<string, any>): InventoryConfigurator {
        const environment: string = this.getEnvironment()
        switch (environment) {
            case 'local':
                return this.forLocal()
            case 'test':
            default:
                return this.forTest(fixtures || new Map())
        }
    }

    static forTest(fixtures: Map<string, any>): InventoryConfigurator {
        const inMemoryProductStorage = new InMemoryProductStorage(
            fixtures.get('products') || new Map<string, Product>()
        )
        const identityProvider = new ConfigurableIdentityProvider(
            ...fixtures.get('identities') || []
        )
        const productIdentity = new ProductIdentity(identityProvider)
        const inventory = new Inventory(inMemoryProductStorage, productIdentity)
        return new InventoryConfigurator(
            inMemoryProductStorage,
            inventory
        )
    }

    static forLocal(): InventoryConfigurator {
        const inMemoryProductStorage = new InMemoryProductStorage(
            new Map<string, Product>()
        )
        const identityProvider = new SequentialIdProvider()
        const productIdentity = new ProductIdentity(identityProvider)
        const inventory = new Inventory(inMemoryProductStorage, productIdentity)
        return new InventoryConfigurator(
            inMemoryProductStorage,
            inventory
        )
    }

    private static getEnvironment(): string {
        if (!process.env) {
            throw new Error('Variables de entorno no disponibles');
        }

        const env = process.env.APP_ENV || process.env.REACT_APP_ENV;

        if (!env) {
            console.warn('Variable de entorno no definida, usando "test" por defecto');
            return 'test';
        }

        const validEnvs = ['test', 'local', 'production'];
        if (!validEnvs.includes(env)) {
            console.warn(`Ambiente "${env}" no reconocido, usando "test" por defecto`);
            return 'test';
        }

        return env;
    }

    // Code removed for clarity      
}
```

Hasta cierto punto `InventoryConfigurator` es básicamente una especie de contenedor de inyección de dependencias y _resource locator_, que los adaptadores primarios pueden usar para hablar con la aplicación. Además de eso, también se encarga de obtener el _environment_. Lo cierto es que hace muchas cosas, muchos de sus métodos son estáticos, y quizá podríamos descomponerlo.

## Descomposición de Inventory Configurator

La descomposición se refiere al proceso mediante el cual identificamos responsabilidades de un objeto y las distribuimos en otros objetos especializados que trabajan coordinadamente.

`InventoryConfigurator` está haciendo varias cosas:

* Identifica el entorno de ejecución (_local_, _test_ o _production_).
* Instancia y combina las dependencias, dependiendo del entorno de ejecución.
* Expone métodos para que los adaptadores obtengan los handlers que constituyen el puerto.

Soy consciente de que existen frameworks y librerías para muchas de estas necesidades, pero no puedo evitar la oportunidad de refactorizar un poco la solución actual y extraer componentes.

### Detección del entorno

Aquí tenemos `Environment`, una pieza que determina el entorno de ejecución actual, según esté definido en una variable de entorno `APP_ENV` o `REACT_APP_ENV`. No hay mucho especial que decir, simplemente hemos movido el código que había en `InventoryConfigurator`. Obtiene la variable de entorno, si es que está definida, la valida contra una lista de entornos permitidos y la pone a disposición de `InventoryConfigurator`.

```typescript
export class Environment {
    current(): string {
        if (!process.env) {
            throw new Error('Variables de entorno no disponibles')
        }

        const env = process.env.REACT_APP_ENV || process.env.APP_ENV

        if (!env) {
            console.warn('Variable de entorno no definida, usando "test" por defecto')
            return 'test'
        }

        const validEnvs = ['test', 'local', 'production']
        if (!validEnvs.includes(env)) {
            console.warn(`Ambiente "${env}" no reconocido, usando "test" por defecto`)
            return 'test'
        }

        return env
    }
}
```

Suficiente para nuestro ejercicio.

```typescript
export class InventoryConfigurator {
    private readonly inventory: Inventory

    constructor(inventory: Inventory) {
        this.inventory = inventory
    }

    static run(fixtures?: Map<string, any>): InventoryConfigurator {
        const environment: string = new Environment().current()
        switch (environment) {
            case 'local':
                return this.forLocal()
            case 'test':
            default:
                return this.forTest(fixtures || new Map())
        }
    }
    
    // Code removed for clarity
}
```

### Gestión de dependencias

Ya hemos presentado a [Dicky](/dependency-injection-container/), un contenedor de inyección de dependencias muy sencillo. Como está bastante explicado en el artículo enlazado, no me voy a extender mucho.

He aquí un ejemplo de su uso:

```typescript
export class InventoryConfigurator {
    private readonly dic: Dicky

    constructor(dic: Dicky) {
        this.dic = dic
    }
    static run(fixtures?: Map<string, any>): InventoryConfigurator {
        const environment: string = new Environment().current()
        switch (environment) {
            case 'local':
                return this.forLocal()
            case 'test':
            default:
                return this.forTest(fixtures || new Map())
        }
    }

    static forTest(fixtures: Map<string, any>): InventoryConfigurator {
        const dic = new Dicky()
        dic.registerSingleton('storage', () => {
            return new InMemoryProductStorage(
                fixtures.get('products') || new Map<string, Product>()
            )
        })
        dic.registerSingleton('identity', (dic: Dicky) => {
            return new ConfigurableIdentityProvider(
                ...fixtures.get('identities') || []
            )
        })
        dic.registerSingleton('productIdentity', (dic: Dicky) => {
            return new ProductIdentity(dic.resolve('identity'))
        })
        dic.registerSingleton('inventory', (dic: Dicky) => {
            return new Inventory(dic.resolve('storage'), dic.resolve('productIdentity'))
        })
        return new InventoryConfigurator(dic)
    }

    static forLocal(): InventoryConfigurator {
        const dic = new Dicky()
        dic.registerSingleton('storage', () => {
            return new InMemoryProductStorage(
                new Map<string, Product>()
            )
        })
        dic.registerSingleton('identity', (dic: Dicky) => {
            return new SequentialIdProvider()
        })
        dic.registerSingleton('productIdentity', (dic: Dicky) => {
            return new ProductIdentity(dic.resolve('identity'))
        })
        dic.registerSingleton('inventory', (dic: Dicky) => {
            return new Inventory(dic.resolve('storage'), dic.resolve('productIdentity'))
        })
        return new InventoryConfigurator(dic)
    }

    buildGetCurrentStockHandler(): GetCurrentStockHandler {
        return new GetCurrentStockHandler(
            this.dic.resolve('inventory')
        )
    }

    buildAddProductHandler() {
        return new AddProductHandler(this.dic.resolve('inventory'))
    }

    buildRestockProductHandler() {
        return new RestockProductHandler(this.dic.resolve('inventory'))
    }

    buildConsumeProductHandler() {
        return new ConsumeProductHandler(this.dic.resolve('inventory'))
    }
}
```

### Dar acceso al puerto para los adaptadores

`InventoryConfigurator` expone varios métodos para que los adaptadores obtengan los Handlers a los que enviar los mensajes. ¿No sería mejor exponer un _MessageBus_ y entregarlo a los adaptadores? Ya hemos mostrado anteriormente como funciona un [command bus](/command_bus_1/), así que solo necesitamos uno para Typescript.

La ventaja de un bus de mensajes es que los adaptadores solo necesitan conocer los objetos comando o queries.

Escribir uno sencillo no es tarea difícil, así que nos podemos a ello. Esto debería ser suficiente:

```typescript
export class MessageBus {
    private handlers: Map<string, Handler<any>> = new Map()

    registerHandler(message: any, handler: Handler<any>) {
        const key = message.name
        this.handlers.set(key, handler)
    }

    dispatch(message: any): any | void {
        const handler = this.resolveHandlerFor(message)

        return handler.handle(message)
    }

    private resolveHandlerFor(command: any): Handler<any> {
        const handler = this.handlers.get(command.constructor.name)

        if (!handler) {
            throw new NoHandlerForCommandError(command.name)
        }

        return handler
    }
}
```

Con una sencilla interfaz para los `Handlers`, que nos asegure una forma de interactuar con ellos.

```typescript
export interface Handler<C> {
    handle(message: C): any | void
}
```

Ahora podemos modificar InventoryConfigurator para sacar partido tanto al contenedor de inyección de dependencias como al bus de mensajes:

```typescript
export class InventoryConfigurator {
    private readonly dic: Dicky

    constructor(dic: Dicky) {
        this.dic = dic
    }

    static run(fixtures?: Map<string, any>): InventoryConfigurator {
        const environment: string = new Environment().current()
        switch (environment) {
            case 'local':
                return this.forLocal()
            case 'test':
            default:
                return this.forTest(fixtures || new Map())
        }
    }

    static forTest(fixtures: Map<string, any>): InventoryConfigurator {
        const dic = new Dicky()
        dic.registerSingleton('storage', () => {
            return new InMemoryProductStorage(
                fixtures.get('products') || new Map<string, Product>()
            )
        })
        dic.registerSingleton('identity', (dic: Dicky) => {
            return new ConfigurableIdentityProvider(
                ...fixtures.get('identities') || []
            )
        })
        dic.registerSingleton('productIdentity', (dic: Dicky) => {
            return new ProductIdentity(dic.resolve('identity'))
        })
        dic.registerSingleton(Inventory.name, (dic: Dicky) => {
            return new Inventory(dic.resolve('storage'), dic.resolve('productIdentity'))
        })
        dic.registerSingleton(AddProductHandler.name, (dic: Dicky) => {
            return new AddProductHandler(dic.resolve(Inventory.name))
        })
        dic.registerSingleton(RestockProductHandler.name, (dic: Dicky) => {
            return new RestockProductHandler(dic.resolve(Inventory.name))
        })
        dic.registerSingleton(ConsumeProductHandler.name, (dic: Dicky) => {
            return new ConsumeProductHandler(dic.resolve(Inventory.name))
        })
        dic.registerSingleton(GetCurrentStockHandler.name, (dic: Dicky) => {
            return new GetCurrentStockHandler(dic.resolve(Inventory.name))
        })
        dic.registerSingleton(MessageBus.name, (dic: Dicky) => {
            const bus = new MessageBus()
            bus.registerHandler(AddProduct, dic.resolve(AddProductHandler.name))
            bus.registerHandler(RestockProduct, dic.resolve(RestockProductHandler.name))
            bus.registerHandler(ConsumeProduct, dic.resolve(ConsumeProductHandler.name))
            bus.registerHandler(GetCurrentStock, dic.resolve(GetCurrentStockHandler.name))
            return bus
        })
        return new InventoryConfigurator(dic)
    }

    static forLocal(): InventoryConfigurator {
        const dic = new Dicky()
        dic.registerSingleton('storage', () => {
            return new InMemoryProductStorage(
                new Map<string, Product>()
            )
        })
        dic.registerSingleton('identity', (dic: Dicky) => {
            return new SequentialIdProvider()
        })
        dic.registerSingleton('productIdentity', (dic: Dicky) => {
            return new ProductIdentity(dic.resolve('identity'))
        })
        dic.registerSingleton(Inventory.name, (dic: Dicky) => {
            return new Inventory(dic.resolve('storage'), dic.resolve('productIdentity'))
        })
        dic.registerSingleton(AddProductHandler.name, (dic: Dicky) => {
            return new AddProductHandler(dic.resolve(Inventory.name))
        })
        dic.registerSingleton(RestockProductHandler.name, (dic: Dicky) => {
            return new RestockProductHandler(dic.resolve(Inventory.name))
        })
        dic.registerSingleton(ConsumeProductHandler.name, (dic: Dicky) => {
            return new ConsumeProductHandler(dic.resolve(Inventory.name))
        })
        dic.registerSingleton(GetCurrentStockHandler.name, (dic: Dicky) => {
            return new GetCurrentStockHandler(dic.resolve(Inventory.name))
        })
        dic.registerSingleton(MessageBus.name, (dic: Dicky) => {
            const bus = new MessageBus()
            bus.registerHandler(AddProduct, dic.resolve(AddProductHandler.name))
            bus.registerHandler(RestockProduct, dic.resolve(RestockProductHandler.name))
            bus.registerHandler(ConsumeProduct, dic.resolve(ConsumeProductHandler.name))
            bus.registerHandler(GetCurrentStock, dic.resolve(GetCurrentStockHandler.name))
            return bus
        })
        return new InventoryConfigurator(dic)
    }

    getMessageBus(): MessageBus {
        return this.dic.resolve(MessageBus.name)
    }
}
```

Así es como lo podemos usar a partir de ahora. Por ejemplo, en este test:

```typescript
export class ForManagingProductsTest {
    private configurator: InventoryConfigurator

    constructor(fixtures: Map<string, any>) {
        this.configurator = InventoryConfigurator.forTest(fixtures)
    }

    AddProduct(productName: string | undefined, initialQuantity: number): Result<string> {
        const command = new AddProduct(productName!, initialQuantity)
        const bus = this.configurator.getMessageBus()
        return bus.dispatch(command)
    }

    GetCurrentStock(productId: string): Result<object> {
        const query = new GetCurrentStock(productId)
        const bus = this.configurator.getMessageBus()
        return bus.dispatch(query)
    }

    RestockProduct(existingProductId: string | undefined, number: number | undefined): Result<void> {
        const command = new RestockProduct(existingProductId!, number!)
        const bus = this.configurator.getMessageBus()
        return bus.dispatch(command)
    }

    ConsumeProduct(existingProductId: string | undefined, number: number | undefined): Result<void> {
        const command = new ConsumeProduct(existingProductId!, number!)
        const bus = this.configurator.getMessageBus()
        return bus.dispatch(command)
    }
}
```

Y este es un fragmento de código de la parte front-end:

```typescript
const command = new AddProduct(productName, initialQuantity);
const bus = configurator.getMessageBus();
const result = bus.dispatch(command);
setAddProductState({ loading: false, error: null });
```

Como se puede apreciar, los adaptadores tienen que conocer mucho menos acerca del puerto. Basta con que sepan acerca de los comandos y el bus. Este ya se encarga de enviar el comando o la query al handler adecuado. 

### Toques finales

El principal problema que le veo ahora al configurador es que se repite mucho código dado que las dependencias son casi todas las mismas para todos los entornos. Hay varias soluciones que podríamos aplicar. Entre las que se me ocurren:

**Convertir las funciones de factoría en funciones con nombre**, de modo que se pueden reutilizar entre entornos. Por ejemplo:

```typescript
function configuredMessageBus(dic: Dicky) {
    const bus = new MessageBus()
    bus.registerHandler(AddProduct, dic.resolve(AddProductHandler.name))
    bus.registerHandler(RestockProduct, dic.resolve(RestockProductHandler.name))
    bus.registerHandler(ConsumeProduct, dic.resolve(ConsumeProductHandler.name))
    bus.registerHandler(GetCurrentStock, dic.resolve(GetCurrentStockHandler.name))
    return bus
}
```

Lo que nos permite una definición más sencilla que podemos reutilizar:

```typescript
dic.registerSingleton(MessageBus.name, configuredMessageBus)
```

Esta solución no funciona bien para aquellos casos en los que es necesario disponer de algún parámetro extra no disponible, aunque quizá podríamos hacer algún apaño. Por ejemplo, en este caso necesitamos las _fixtures_ para poder configurar el storage en el entorno de test.

```typescript
dic.registerSingleton('storage', () => {
    return new InMemoryProductStorage(
        fixtures.get('products') || new Map<string, Product>()
    )
})
```

Podemos registrarlas como una dependencia, incluso podemos separarlas.

```typescript
if (fixtures) {
    dic.registerSingleton('productFixtures', () => fixtures.get('products'))
    dic.registerSingleton('identityFixtures', () => fixtures.get('identities'))
}
```

Y usarlas:

```typescript
dic.registerSingleton('ForStoringProducts', (dic: Dicky) => {
    const fixtures = dic.resolve('productFixtures') as Map<string, any>
    return new InMemoryProductStorage(
        fixtures || new Map<string, Product>()
    )
})
```

Y, de esta forma, podemos extraerlo a una función con nombre, lo que nos permite quitar mucho ruido de la configuración del contenedor y, por otra parte, introducir la gestión de casos indeseados, como que no haya fixtures definidas o cualquier otra circunstancia.


```typescript
function storageWithFixtures(dic: Dicky) {
    const fixtures = dic.resolve('productFixtures') as Map<string, any>
    return new InMemoryProductStorage(
        fixtures || new Map<string, Product>()
    )
}
```

Por supuesto, podemos usar este recurso para pasar otros datos a las dependencias.

**Unificar la configuración del contenedor**, pasándolo el entorno y definiendo condicionalmente las dependencias.

En el ejemplo a continuación, combinamos la solución anterior con esta:

```typescript
function configureContainer(env: string, fixtures?: Map<string, any>) {
    const dic = new Dicky()

    if (fixtures) {
        dic.registerSingleton('productFixtures', () => fixtures.get('products'))
        dic.registerSingleton('identityFixtures', () => fixtures.get('identities'))
    }

    if (env === 'test') {
        dic.registerSingleton('ForStoringProducts', storageWithFixtures)
        dic.registerSingleton('ForGettingIdentities', identityProviderWithFixtures)
    } else {
        dic.registerSingleton('ForStoringProducts', (dic: Dicky) => {
            return new InMemoryProductStorage(new Map<string, Product>())
        })
        dic.registerSingleton('ForGettingIdentities', (dic: Dicky) => {
            return new SequentialIdProvider()
        })
    }

    dic.registerSingleton('productIdentity', (dic: Dicky) => {
        return new ProductIdentity(dic.resolve('ForGettingIdentities'))
    })
    dic.registerSingleton(Inventory.name, (dic: Dicky) => {
        return new Inventory(dic.resolve('ForStoringProducts'), dic.resolve('productIdentity'))
    })
    dic.registerSingleton(AddProductHandler.name, (dic: Dicky) => {
        return new AddProductHandler(dic.resolve(Inventory.name))
    })
    dic.registerSingleton(RestockProductHandler.name, (dic: Dicky) => {
        return new RestockProductHandler(dic.resolve(Inventory.name))
    })
    dic.registerSingleton(ConsumeProductHandler.name, (dic: Dicky) => {
        return new ConsumeProductHandler(dic.resolve(Inventory.name))
    })
    dic.registerSingleton(GetCurrentStockHandler.name, (dic: Dicky) => {
        return new GetCurrentStockHandler(dic.resolve(Inventory.name))
    })
    dic.registerSingleton(MessageBus.name, configuredMessageBus)
    return dic
}
```

De este modo, el configurador queda mucho más simple:

```typescript
export class InventoryConfigurator {
    private readonly dic: Dicky

    constructor(dic: Dicky) {
        this.dic = dic
    }

    static run(fixtures?: Map<string, any>): InventoryConfigurator {
        const environment: string = new Environment().current()
        const dic = configureContainer(environment, fixtures)
        return new InventoryConfigurator(dic)
    }

    static forTest(fixtures: Map<string, any>): InventoryConfigurator {
        return this.run(fixtures)
    }

    getMessageBus(): MessageBus {
        return this.dic.resolve(MessageBus.name)
    }
}
```

## Conclusiones

En esta entrega hemos hablando del _quinto elemento_ de la Arquitectura Hexagonal, el Configurador. Este componente nos permite coser la aplicación para que se pueda usar en un entorno de trabajo real.

En el artículo hemos presentado varias formas de abordarlo, introduciendo elementos como un Contenedor de Inyección de Dependencias o un Bus de mensajes. Es importante señalar que estas son patrones tácticos con los que desarrollar el configurador, pero no son imprescindibles ni forman parte del patrón como tal.

El contenedor de inyección de dependencias puede complicar innecesariamente aplicaciones sencillas, por lo que es una opción que hay que usar con cierta precaución.

Por otro lado, el Bus de Mensajes sí que puede ser una buena adición, pues reduce el acoplamiento de los adaptadores a los puertos, sin que perdamos un apice de testabilidad.
