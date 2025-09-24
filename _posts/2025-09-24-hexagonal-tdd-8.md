---
layout: post
title: El configurador y la aplicación revisados
series: outside-in-ha
categories: articles
tags: software-design design-patterns typescript tdd hexagonal
---

Una vuelta al tema del configurador después de hablar sobre Arquitectura Hexagonal _siguiendo el libro_ en la
PulpoCon25.

Efectivamente, este año hemos estado en la PulpoCon25 explicando el patrón de Arquitectura Hexagonal, tratando de seguir
el libro con el objetivo de conocerlo en su formulación original, bastante olvidada y de la que se cumplen más de 20
años.

Para este taller preparé una nueva versión de Inventory a fin de ilustrar como es el proceso de desarrollo de software
con Arquitectura Hexagonal, y como podría aplicarse a otros modelos de arquitectura, como la más conocida de tres capas
con ley de dependencia, que a veces llamamos _arquitectura limpia_ (y también muy erróneamente arquitectura hexagonal).

Durante las dos sesiones de talleres surgieron comentarios interesantes, tanto sobre el patrón como sobre el ejemplo
propuesto.

Parte de esos comentarios tienen que ver con el quinto elemento: el configurador y distintas formas de montar la
aplicación.

Puedes ver el código al que me refiero en su [repositorio](https://github.com/franiglesias/api-inventory)

Más específicamente, el código problemático es este:

```typescript
export function createInventoryRouter(forDispatching: MessageBusAdapter) {
    const router = express.Router()

    const forUpdatingStock = new ForUpdatingStockApiAdapter(forDispatching)
    router.post('/products/:sku/add', forUpdatingStock.postAddUnits.bind(forUpdatingStock))
    router.post('/products/:sku/remove', forUpdatingStock.postRemoveUnits.bind(forUpdatingStock))

    const forRegisteringProducts = new ForRegisterProductsApiAdapter(forDispatching)
    router.post('/products', forRegisteringProducts.postProducts.bind(forRegisteringProducts))

    const forGettingProducts = new ForGettingProductsApiAdapter(forDispatching)
    router.get('/products', forGettingProducts.getProducts.bind(forGettingProducts))

    const forCheckingHealth = new ForCheckingHealthApiAdapter(forDispatching)
    router.get('/health', forCheckingHealth.getHealth.bind(forCheckingHealth))

    router.get('/', (_request, response) => response.status(200).send('Hello World'))

    return router
}
```

Y, ¿cuál sería el problema?

Básicamente que estamos inicializando adaptadores primarios, pasándoles directamente adaptadores secundarios, para
montar la aplicación. Ciertamente, es un poco raro, dado que estamos haciendo que el lado primario dependa del lado
secundario de forma directa.

De hecho, ahora mismo caigo en la cuenta de un error de tipado, aunque no impide a la aplicación funcionar.

```typescript
export function createInventoryRouter(forDispatching: MessageBusAdapter)
```

Debería ser:

```typescript
export function createInventoryRouter(forDispatching: ForDispatchinMessages): Router
```

Solucionado esto, hablemos del problema de fondo. ¿Es una solución correcta? ¿Cuáles son las alternativas?

La objeción principal sería que la interfaz requerida por el puerto secundario no tendría que ser conocida por el puerto
primario.

Pero, por otra parte, podríamos considerar que forma parte de la interfaz _provista_ por el puerto primario. Es decir:
el puerto primario se define por un comando o query que se publica mediante un sistema de despacho de mensajes.

Personalmente, creo que es una solución válida en el contexto de una aplicación sencilla como esta.

Sin embargo, es cierto que podríamos hacerlo mejor. Básicamente, encapsulando algunas operaciones en un objeto que
represente la Aplicación como tal, o incluso varios objetos que representen los distintos puertos primarios.

Veamos a donde nos lleva esto.

## Un objeto Aplicación

Dado que el problema es tener dependencias que no queremos que sean directas, lo adecuado es introducir un patrón
Mediator.

Este mediador será un objeto que represente la aplicación, exponiendo un método que pueda ser usado por los adaptadores
primarios para hablar con ella.

```typescript
export class InventoryApplication {
    private readonly forDispatchingMessages: ForDispatchingMessages;

    constructor(forDispatchingMessages: ForDispatchingMessages) {
        this.forDispatchingMessages = forDispatchingMessages;
    }

    execute(message: Message): unknown {
        return this.forDispatchingMessages.dispatch(message);
    }
}
```

Ahora tenemos que hacer un cambio un poco más grande, ya que necesitamos pasar la instancia de la aplicación a los
adaptadores primarios. He aquí un ejemplo:

```typescript
export class ForCheckingHealthApiAdapter {
    private application: InventoryApplication

    constructor(forDispatching: InventoryApplication) {
        this.application = forDispatching
    }

    public async getHealth(
        req: Request<{}, any, any, ParsedQs, Record<string, any>>,
        response: Response<any, Record<string, any>, number>,
    ): Promise<void> {
        const getHealth = new GetHealth()
        if (await this.application.execute(getHealth)) {
            response.status(200).json({
                status: 'ok',
            })
            return
        }
        response.status(500).json({
            error: 'Internal Server Error. App is not working.',
            code: '500',
        })
    }
}
```

En resumidas cuentas, ahora los adaptadores primarios interactúan con la Aplicación, sin saber nada de ella, salvo los
comandos que le tienen que pasar.

El punto de entrada queda de esta manera, cambiando las funciones `build*` para que reflejen correctamente lo que está
pasando.

```typescript
const forDispatchingMessages = buildMessageBus()
const inventoryApplication = new InventoryApplication(forDispatchingMessages);
const inventoryRouter = createInventoryRouter(inventoryApplication)

const app = createApp(inventoryRouter)

startServer(app, PORT)

export {app}
```

## Un código más acorde con AH y OOP

El resultado es un código más acorde con el principio de Arquitectura Hexagonal, pero también con Orientación a Objetos. 

`InventoryApplication` se construye inyectándole los adaptadores secundarios, ya sea directamente (ForDispatchingMessages) como indirectamente, ya que el bus de mensajes registra los adaptadores secundarios ya montados.

Por otro lado, los adaptadores primarios, que usan la interfaz proporcionada que, en este caso, son los distintos comandos y queries definidos y reciben la instancia de `InventoryApplication` y así poder _hablar_ con ella.
