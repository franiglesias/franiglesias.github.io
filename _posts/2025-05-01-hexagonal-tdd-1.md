---
layout: post
title: TDD outside-in con arquitectura hexagonal
categories: articles
tags: software-design design-patterns typescript tdd hexagonal
---

A medida que profundizo en Arquitectura Hexagonal más me parece que es uno de los patrones arquitectónicos más útiles y versátiles. Es cierto que se suele hacer muy mal, pero si sigues el patrón tal como está definido tienes muchas garantías de llegar a construir una aplicación fácil para desarrollar y mantener.

Una de sus grandes ventajas es la testabilidad. De hecho, el patrón está diseñado, entre otras cosas, para que la aplicación se pueda poner fácilmente bajo test. Es algo que sus autores han incluído de forma explícita en su definición: los tests son actores que han de poder usar la aplicación a través de sus puertos.

Precisamente, la idea de los puertos también es muy útil como punto de partida para estructurar el código. Los puertos representan distintas conversaciones que el mundo exterior puede querer mantener con la aplicación (puertos primarios o drivers), o que esta necesita iniciar para cumplir sus propósitos (puertos secundarios o driven). 

Esta distinción en los tipos de puertos es también uno de los puntos fuertes del patrón.

Pero volviendo al tema de los tests, en este artículo me gustaría mostrar lo bien que podemos dirigir el desarrollo de una aplicación hexagonal mediante TDD. En este caso, usaremos metodología **Outside-In _clásica_** y la compararemos con la metodología **Outside-In _mockista_** (o London School), a fin de analizar sus semejanzas y diferencias, y las ventajas e inconvenientes de cada una.

Este el primer artículo de lo que espero sea una pequeña serie.

<!-- TOC -->
  * [TDD Outside-in](#tdd-outside-in)
    * [TDD outside-in clásica vs TDD outside-in London School](#tdd-outside-in-clásica-vs-tdd-outside-in-london-school)
    * [Críticas a TDD London School](#críticas-a-tdd-london-school)
  * [TDD outside-in y Arquitectura Hexagonal](#tdd-outside-in-y-arquitectura-hexagonal)
  * [Un ejemplo](#un-ejemplo)
  * [Solución Hexagonal](#solución-hexagonal)
    * [Definiendo puertos](#definiendo-puertos)
      * [Puertos primarios](#puertos-primarios)
      * [Puertos secundarios](#puertos-secundarios)
    * [Adaptadores](#adaptadores)
    * [Aplicación](#aplicación)
    * [Configurador](#configurador)
  * [Empezando a desarrollar](#empezando-a-desarrollar)
  * [Desarrollo en TDD outside-in clásica](#desarrollo-en-tdd-outside-in-clásica)
    * [El primer test](#el-primer-test)
    * [Segundo test](#segundo-test)
    * [Introduciendo el puerto Driven _forStoringProducts_](#introduciendo-el-puerto-driven-_forstoringproducts_)
      * [Puertos driven = interfaz requerida](#puertos-driven--interfaz-requerida)
    * [Encapsular primitivos](#encapsular-primitivos)
      * [Refactorizar para encapsular](#refactorizar-para-encapsular)
    * [Happy Path](#happy-path)
    * [El path _desolado_](#el-path-_desolado_)
    * [Refactor](#refactor)
    * [Rediseño](#rediseño)
  * [Reflexiones sobre Outside-in clásica](#reflexiones-sobre-outside-in-clásica)
<!-- TOC -->

## TDD Outside-in

_TDD Outside-in_ es un método de desarrollo en el que comenzamos a trabajar especificando una prestación concreta mediante un test y tomando la aplicación como una unidad. _TDD Outside-in_ es un enfoque muy similar a _Behavior Driven Development_. 

Este test puede considerarse como un test de aceptación, pues define una prestación en los términos de los consumidores interesados e interactúa con la aplicación desde sus puntos de entrada y salida. No es exactamente un test _end-to-end_ porque no ejercita las interfaces de usuario, como veremos a continuación.

En arquitectura hexagonal estos puntos de entrada y salida son los puertos de la aplicación. Esto tiene dos consecuencias importantes:

* Las interfaces de usuario (CLI, GUI, Web, API) se testean aparte, pues son adaptadores de los puertos y están fuera de la aplicación.
* Las tecnologías requeridas por la aplicación para funcionar, como bases de datos, servicios externos, dispositivos, etc., deben reemplazarse con dobles de test. Los adaptadores necesarios se testean también separadamente.

Esto no impide, por supuesto, preparar tests _end-to-end_, pero para el desarrollo podremos trabajar de forma separada.

### TDD outside-in clásica vs TDD outside-in London School

Por supuesto, ambas aproximaciones funcionan a partir de tests que especifican y describen las funcionalidades de la aplicación en el nivel global y siguen el ciclo _red, green, refactor_.

La principal diferencia entre ambas es el momento en que se realiza el diseño de la aplicación. Si bien, los dos enfoques tienen en cuenta un diseño general, los detalles se van definiendo paso a paso.

En _TDD clásica_, el diseño se introduce en la fase de refactor. Para ello, normalmente se comienza estableciendo la funcionalidad usando el patrón _Transaction Script_.

Una vez tengamos todos los tests que definen la funcionalidad en verde, se procede a refactorizar con el objetivo de separar las responsabilidades en los distintos componentes, introduciendo el diseño. Para ello, se pueden aplicar heurísticas como las reglas de calistenia, resolución de _code-smells_, etc.

En _TDD London School_ se procede de una forma diferente. No se intenta programar directamente la funcionalidad definida por el test exterior, sino que determinamos qué objetos deberían participar en implementarla y cómo se comunicarán entre ellos.

Una vez definido esto, cada uno de los componentes se va implementando usando ciclos de TDD unitaria clásica. En muchos casos, debido a que se trata de funcionalidades nuevas, no tendremos esos componentes o no serán capaces de atender los mensajes requeridos.

Por esa razón, se recurre a doblar los colaboradores si es necesario hasta que el test de aceptación nos pide crear implementaciones reales.

Como se puede deducir de esta explicación, el test inicial estará en rojo todo este tiempo, indicando que la funcionalidad no está terminada todavía.

Puedes encontrar [una comparación de ambos enfoques en esta serie de vídeos (de pago)](https://cleancoders.com/episode/comparativeDesign-episode-1). Y si quieres algo más breve (y gratis), [este vídeo del siempre recomendable David Farley](https://www.youtube.com/watch?v=_S5iUf0ANyQ)

### Críticas a TDD London School

La orientación _London School_ suele recibir muchas críticas por su uso extensivo de los dobles de test. No en vano se la suele llamar _mockista_, aunque creo que esto debería ser matizado.

En _London School_ se usan dobles de test para describir el paso de mensajes entre los objetos que intervienen en cada capa o componente que atraviesa una petición al sistema.

Por ejemplo, si estuviésemos escribiendo una API Rest usando esta variante tendríamos una primera capa que es el controlador. En nuestro caso, este controlador podría requerir un _Command Bus_ y un _Mapper_ que convierta la _payload_ entrante en el objeto _Command_ que vayamos a pasar al _Bus_. Debería sobrar decir que objetos como la _payload_ o el _Command_ no se doblan.

Para desarrollar el controlador, lo haríamos mediante tests unitarios y tendríamos que doblar el _Command Bus_ en forma de _Espía_, para poder verificar que ha recibido el _Command_ correcto. Esto suele ser necesario porque habitualmente implementaremos un _Command Bus_ mediante alguna libería CQRS, pero también porque no vamos a tener todavía el _Handler_ que reciba y ejecute el _Command_. 

En un buen diseño no usaríamos directamente librerías o componentes de terceras partes, sino que aplicando el patron Adapter habremos definido una interfaz e implementado un adaptador fino.

Con el _Mapper_ ocurre algo parecido: todavía _no sabemos_ cómo se va a comportar, por lo que inicialmente podría ser un _Stub_, devolviendo un objeto _Command_ precalculado, suficiente para que los tests unitarios pasen.

En cualquier caso, como resultado de este paso, habremos definido las interfaces de nuestros objetos _Command Bus_ y _Mapper_. Por tanto, una vez que hayamos completado el desarrollo del controlador, comenzaremos con el de estos componentes, también con tests unitarios en TDD.

Ahora bien, en muchos casos, los colaboradores que necesitamos en cada nivel no tienen dependencias fuertes, es decir, no se van a implementar usando tecnologías del mundo real, sino que podemos hacerlo con objetos puros del lenguaje. Esto nos permitiría no doblarlos e implementarlos al abrigo del test unitario del objeto que los utiliza. Este sería seguramente el caso del _Mapper_ que mencionamos antes.

O lo que es lo mismo, nada nos impide hacer tests unitarios sociales: [aquellos en los que la unidad no se identifica necesariamente con una única clase](https://codesai.com/posts/2025/03/mockist-tdd-unit-not-the-class).

Por otro lado, creo que una de las críticas que se hace a _London School_ deriva del hecho de que se considera que estos tests serán automáticamente tests de QA. Esto me parece una equivocación. En TDD, no todos los tests que usamos para desarrollar deben conservarse como test de regresión en QA.

TDD puede introducir muchos tests redundantes que no aportarían mucha información en caso de aparecer un error. O, tratándose de la London School, tests frágiles por usar test dobles que sean _mocks_ creados con librerías. Sin embargo, creo que hay buenas soluciones para eso:

Para empezar, no usar librerías de _mocks_, sino dobles implementados manualmente, como implementaciones alternativas. Con esto podemos hacer que los tests sean menos frágiles.

Introducir un segundo ciclo de trabajo _de dentro hacia afuera_ para reemplazar los _mocks_ que puedan introducir fragilidad.

Y aquí la Arquitectura Hexagonal tiene algo que decir.

## TDD outside-in y Arquitectura Hexagonal

Como acabamos de señalar hace un momento, el patrón de Arquitectura Hexagonal fue diseñado con el testing en mente. Requiere que la aplicación pueda ser manejada mediante tests y contempla que los adaptadores secundarios que hablen con tecnologías del mundo real sean reemplazados con dobles de test.

Es por eso que Arquitectura Hexagonal es un patrón que se adapta extraordinariamente bien para trabajar con metodologías TDD _outside-in_, y concretamente para el enfoque _London School_.

## Un ejemplo

Para ilustrar esto voy a usar un ejemplo que he diseñado recientemente: un sistema de inventario sencillo, con las siguientes funcionalidades:

* Los usuarios pueden añadir productos en cualquier cantidad y así incrementar el stock.
* Los usuarios pueden consumir productos en cualquier cantidad, con tal de que haya suficiente para satisfacer el pedido. En caso contrario, la aplicación lanzará un error.
* Se puede obtener el stock actual de cualquier producto existente. (Si no existe o no tiene existencias se lanzarán los errores correspondientes)
* Se puede obtener el historial de cambios cada uno de los productos.
* Se puede obtener el historial de cambios de todos los productos.
* Se puede obtener la lista de todos los productos con sus niveles de stock, indicando aquellos que están en riesgo de romper stock.
* Se puede obtener la lista de todos los productos próximos a agotarse (quedan menos de 3 unidades)

## Solución Hexagonal

Una aplicación construida en Arquitectura Hexagonal tiene los siguientes elementos principales:

* La aplicación en sí, que contiene la lógica de negocio implementada sin dependencias de ninguna tecnología. En otros modelos de arquitectura estaríamos hablando del dominio de la aplicación y de sus casos de uso.
* Los puertos, que pueden ser _driving_, o primarios, y _driven_, o secundarios. Los puertos _driving_ son los que permiten a los actores usar la aplicación, iniciando conversaciones con ella. Los puertos _driven_ son los que permiten a la aplicación hablar con tecnologías del mundo real para implementar funcionalidad: bases de datos, sistemas de archivos, servicios externos, y un largo etcétera.
* Adaptadores de distintas tecnologías para los diferentes puertos definidos.
* Un configurador, que es donde la aplicación monta sus dependencias y que es donde podemos hacer que se configure de forma distinta en diferentes entornos, como puede ser test y producción.

### Definiendo puertos

#### Puertos primarios

Normalmente, tendremos bastante claros los puertos primarios. Es decir, aquellos que usan los actores para interactuar con la aplicación. Estos puertos se definen a partir de las conversaciones que nos interesa poder mantener.

En nuestro ejemplo, hay dos tipos de conversaciones:

* Una se refiere a la gestión del stock: añadir y consumir productos y saber el nivel de stock de cada uno.
* Otra se refiere a poder analizar el histórico y obtener informes.

Estas conversaciones podrían provenir de actores diferentes. Por ejemplo, en el primer caso, los actores interesados podrían ser los dependientes de una tienda. En el segundo caso, los actores podrían ser analistas de negocio a fin de establecer previsiones y decidir compras.

Por lo general, si tenemos actores diferentes interesados en conversaciones diferentes, lo adecuado es definir puertos diferentes.

Pero pueden darse muchos contextos que nos obliguen a matizar esto. Para ciertas empresas puede que no haya necesidad de hacer esta distinción por tener un tamaño pequeño y una estructura simple. Para otras, más grandes y complejas, puede ser muy importante hacer esta separación.

Para nuestro ejemplo vamos a considerar dos puertos primarios:

* Para gestionar existencias
* Para obtener informes

Los puertos primarios se pueden definir mediante _Commands_ y _Queries_ que los adaptadores usarán para comunicarse con la aplicación.

#### Puertos secundarios

Los puertos secundarios son un poco más difíciles de prever. En algunos casos pueden estar claros desde el principio. Por ejemplo, casi todas las aplicaciones necesitan algún tipo de persistencia de datos, por lo que es casi seguro que necesitaremos una solución técnica para eso, lo que va a definir un puerto.

Pero puede ocurrir que no tengamos perfectamente definido como vamos a resolver algunas cuestiones o no las tengamos previstas. En ese caso, es posible que surja la necesidad una vez comenzado el desarrollo.

En nuestro ejemplo, parece claro que necesitaremos almacenar los datos de existencias, pero también un histórico de movimientos. Otros dos puertos, esta vez secundarios:

* Para almacenar los datos de existencias
* Para almacenar los cambios

Claro que podríamos tener más puertos. Por ejemplo, si optamos por utilizar un _Command Bus_ (o _Query Bus_), podríamos implementarlo mediante alguna librería existente. En este caso, necesitaremos un puerto secundario más:

* Para despachar comandos y queries

Y lo mismo, si queremos usar un sistema de eventos, que en este ejemplo es una posibilidad no desdeñable:

* Para despachar eventos

En general, los puertos secundarios se definen mediante interfaces, que serán implementadas por los adaptadores.

### Adaptadores

Para cada puerto definiremos uno o más adaptadores. En el caso de los puertos primarios, los adaptadores necesarios vendrán determinados por la forma en que queramos implementar la aplicación: línea de comandos, web UI, API, etc. 

Lo interesante es que para desarrollar la aplicación en sí no vamos a necesitar escribir estos adaptadores. Necesitaremos tests que interactúen con la aplicación.

En cuando a los puertos secundarios, necesitaremos adaptadores creados para ser usados en situación de test. De hecho, Los autores de Arquitectura Hexagonal los consideran actores driven más que adaptadores, ya que pueden hablar directamente con la aplicación.

Así que para nuestro ejemplo, si bien no nos haría falta llegar a escribir ningún adaptador primario real, sí es seguro que tendremos que escribir actores de test que actúen como:

* Adaptadores que almacenen los datos de existencia
* Adaptadores que almacenen el histórico de cambios a partir del cual generamos los informes 

Y, en su caso, buses de mensajes.

### Aplicación

La aplicación o _hexágono_ es donde reside la lógica del negocio. Equivaldría a la unión de las capas de dominio y aplicación de otros modelos de arquitectura.

La forma en que organicemos el código dentro del hexágono no está definida por el patrón, por lo que tenemos libertad total en ese aspecto. Podríamos tener una capa de casos de uso, formada por los handlers de cada comando o query, y una capa de dominio, con los objetos que representan el modelo. Podríamos estructurar el código basándonos en los puertos, aplicar ideas de Vertical Slicing Architecture, o cualquier organización que nos parezca significativa y adecuada.

### Configurador

El configurador nos permite montar la aplicación de la forma requerida por el entorno de ejecución. Para el entorno de test, esto implica usar los _fakes_, o dobles de test, de los puertos secundarios.

Así, por ejemplo, podríamos tener una base de datos en memoria para tests, pero otra basada en SQLite para desarrollo y pruebas en local, y, por último, una de producción en MySQL o Postgresql. El configurador se encargaría de montar la aplicación de acuerdo al entorno en que se ejecuta.

## Empezando a desarrollar

Retomemos aquí los requerimientos:

* Los usuarios pueden añadir productos en cualquier cantidad y así incrementar el stock.
* Los usuarios pueden consumir productos en cualquier cantidad, con tal de que haya suficiente para satisfacer el pedido. En caso contrario, la aplicación lanzará un error.
* Se puede obtener el stock actual de cualquier producto existente. (Si no existe o no tiene existencias se lanzarán los errores correspondientes)
* Se puede obtener el historial de cambios cada uno de los productos.
* Se puede obtener el historial de cambios de todos los productos.
* Se puede obtener la lista de todos los productos con sus niveles de stock, indicando aquellos que están en riesgo de romper stock.
* Se puede obtener la lista de todos los productos próximos a agotarse (quedan menos de 3 unidades)

Como hemos visto, hay dos grandes conversaciones que querríamos mantener con este sistema: la gestión del stock en sí y la analítica. Vamos a centrarnos ahora en la primera.

La primera prestación que se nos pide es poder añadir productos. Esto es un comando, que cambiará el estado de la aplicación, en último término añadiendo o modificando una fila en la base de datos. Este es un ejemplo habitual del tipo de dudas que nos pueden surgir al empezar un proyecto con TDD. ¿Cómo vamos a comprobar que se produce este cambio de estado?

Aquí tenemos varias opciones:

1. Mediante un _mock_, esperando que sea invocado el método `save` o `store` de un adaptador de la base de datos.
2. Mediante un _fake_ o un espía, comprobando que se haya guardado el objeto deseado.
3. Mediante una query a la aplicación, la cual depende de que el resultado del command haya sido correcto.

Los dos primeros métodos presuponen un conocimiento de la forma en que se haya implementado la aplicación, por tanto, hay un acoplamiento a la implementación que hará frágil el test.

El tercer método es el más desacoplado. En el puerto para gestionar stock, esperamos que una de las interacciones sea algo así como 'Dime el stock disponible de este producto', información que es actualizada por la interacción 'Añade esta cantidad de unidades del producto indicado'.

La consecuencia es que puede interesarnos implementar primero la conversación para obtener el stock disponible, de manera que ya dispongamos de esa capacidad en los siguientes tests.

Por supuesto, podríamos argumentar que no tenemos datos a los que preguntar. Sin embargo, no es un problema tener algunos datos precargados que nos permitan implementar la prestación. Entre los dobles de test, los stubs nos permiten hacer eso con un acoplamiento mínimo, ya que la existencia de datos no predetermina la implementación.

Así que podríamos empezar por aquí:

* Se puede obtener el stock actual de cualquier producto existente. (Si no existe o no tiene existencias se lanzarán los errores correspondientes)

## Desarrollo en TDD outside-in clásica

### El primer test

Vamos a empezar por este test (typescript con vitest). En este caso, es un test con el que definir los elementos principales y empezar a tomar decisiones de estructura de la aplicación.

El primer puerto con el que vamos a trabajar es "For Managing Products". Un buen caso para empezar es pedir información de un producto que ni siquiera existe. De hecho, es que no hay ningún producto.

El test comprueba que se lanza el error por tipo. No suelo hacer aserciones sobre los mensajes, pues son detalles de implementación, menos estables que el tipo.

```typescript
describe('For Managing Products Port', () => {
    describe('When we ask the current stock of a not existing product', () => {
        it('Should fail with Unknown Product Error', () => {
            const query = new GetCurrentStock('no-exists-product-id')
            const handler = new GetCurrentStockHandler()
            expect(() => handler.handle(query)).toThrow(UnknownProduct)
        })
    })
})
```

En principio, esto me permite incorporar varios objetos necesarios, particularmente los que definen el puerto. Yo tengo la costumbre de empezar poniendo las clases nuevas en el mismo archivo del test. Una vez que lo hago pasar, lo muevo a su lugar mediante herramientas del IDE. El test me sirve para asegurar que todo está en su sitio.

Este código hace pasar el test:

```typescript
class GetCurrentStock {
    public productId: string
    constructor(productId: string) {
        this.productId = productId
    }
}

class GetCurrentStockResponse {
}

class GetCurrentStockHandler {
    handle(query: GetCurrentStock):GetCurrentStockResponse {
        throw UnknownProduct.withId(query.productId);
    }
}

class UnknownProduct implements Error {
    message: string
    name: string

    constructor(name: string, message: string) {
        this.name = name
        this.message = message
    }

    static withId(productId: string) {
        return new UnknownProduct('UnknownProduct', `Product Id ${productId} doesn't exist`)
    }
}
```

Con el test pasando, voy a mover los objetos creados a sus ubicaciones. Este sería el resultado provisional, que consolido con un commit:

```plaintext
src
├── index.ts
└── inventory
    └── forManagingProducts
        ├── GetCurrentStock.ts
        ├── GetCurrentStockHandler.ts
        ├── GetCurrentStockResponse.ts
        └── UnknownProduct.ts

2 directories, 5 files
```

Algunas notas:

La carpeta `inventory` representa la aplicación, o hexágono, por tanto, los puertos se definen dentro usando la nomenclatura _for + doing something_. En el libro [Hexagonal Arquitecture Explained](https://amzn.eu/d/5J9unJz) se propone un nivel previo para especificar si se trata de puertos _driving_ o primarios, o puertos _driven_ o secundarios. Tengo algunas dudas con eso porque me parece que introduce un aspecto técnico en un nivel muy temprano de la estructura de carpetas. Quizá en un ejemplo reducido en el que tendremos pocos puertos no merece mucho la pena, pero es la recomendación.

La interacción `GetCurrentStock` tiene ya cuatro elementos. A medida que el puerto incorpore vocabulario para la conversación está claro que la carpeta se va a complicar. Dependiendo del estilo de código o las prácticas comunes del lenguaje, estos archivos podrían empaquetarse en una carpeta, o unificarse en un solo archivo si los estándares del lenguaje lo permiten o recomiendan. En este caso, lo voy a empaquetar en una carpeta:

```plaintext
src
├── index.ts
└── inventory
    └── forManagingProducts
        ├── UnknownProduct.ts
        └── getCurrentStock
            ├── GetCurrentStock.ts
            ├── GetCurrentStockHandler.ts
            └── GetCurrentStockResponse.ts

3 directories, 5 files
```

Por otro lado, la ubicación del error `UnknownProduct` me genera también algunas dudas. Por una parte, es cierto que podría formar parte del puerto dado que es un error que tendrá que gestionar el adaptador que lo implemente. Además, es un error que podría lanzar cualquiera de sus interacciones. Sin embargo, podríamos imaginar otras formas de trasladar el error fuera de la aplicación. Por ejemplo, usando el objeto `GetCurrentStockResponse` para que nos informe del éxito o fallo de la petición. Esto lleva a `UnknowProduct` fuera de los puertos.

Para lograr introducir este tipo de gestión de errores, tengo que cambiar el test:

```typescript
describe('For Managing Products Port', () => {
    describe('When we ask the current stock of a not existing product', () => {
        it('Should fail with Unknown Product Error', () => {
            const query = new GetCurrentStock('no-existing-product-id')
            const handler = new GetCurrentStockHandler()
            const response = handler.handle(query)
            expect(response.success()).toBeFalsy()
            expect(response.error()).toEqual('Product Id no-existing-product-id doesn\'t exist')
        })
    })
})
```

E introducir estos cambios:

```typescript
export class GetCurrentStockHandler {
    handle(query: GetCurrentStock): GetCurrentStockResponse {
        return new GetCurrentStockResponse()
    }
}
```

```typescript
export class GetCurrentStockResponse {
    success() {
        return false
    }

    error(): string {
        return 'Product Id no-existing-product-id doesn\'t exist'
    }
}
```

Finalmente, tengo que hacer algo de refactor para que esto se maneje de forma sencilla:

```typescript
export class GetCurrentStockHandler {
    handle(query: GetCurrentStock): GetCurrentStockResponse {
        return GetCurrentStockResponse.withError(`Product Id ${(query.productId)} doesn't exist`)
    }
}
```

```typescript
export class GetCurrentStockResponse {
    private result: unknown
    private errorMessage: string | undefined

    static withError(message: string) {
        return new GetCurrentStockResponse(undefined, message)
    }

    constructor(result: unknown, errorMessage: string) {
        this.result = result
        this.errorMessage = errorMessage
    }

    success() {
        return !this.errorMessage
    }

    error(): string {
        if (!this.errorMessage) {
            throw new Error('Response was successful')
        }
        return this.errorMessage
    }
}
```

Este salto me parece un poco grande para este momento, pero como tengo más o menos claro que me interesa este tipo de objeto lo voy a aceptar. La consecuencia es que _UnkownProduct_ queda sin finalidad y, al menos temporalmente, debería desaparecer. Incluso pensando en que podría volver en el futuro.

```plaintext
src
├── index.ts
└── inventory
    └── forManagingProducts
        └── getCurrentStock
            ├── GetCurrentStock.ts
            ├── GetCurrentStockHandler.ts
            └── GetCurrentStockResponse.ts

3 directories, 4 files
```

En este punto, consolido los cambios antes de pasar al siguiente test.

### Segundo test

El siguiente requisito de la aplicación me pide devolver un error si no hay stock del producto solicitado. Esto implica que el producto se dio de alta en algún momento y simplemente se han agotado las existencias. Por un lado, es cierto que devolver cero unidades en stock sería perfectamente válido, pero se puede entender también que es un hecho especialmente significativo, por lo que nos piden señalarlo de manera especial.

Este test describe la situación:

```typescript
describe('When we ask the current stock of a exhausted product', () => {
    it('Should fail with Broken Stock Error', () => {
        const query = new GetCurrentStock('no-stock-product-id')
        const handler = new GetCurrentStockHandler()
        const response = handler.handle(query)
        expect(response.success()).toBeFalsy()
        expect(response.error()).toEqual('Product Id no-stock-product-id exhausted')
    })
})
```

Por un lado, este test sugiere que en el sistema ya tiene que existir un producto que tenga un stock de cero unidades. Y en último término sugiere que hay alguna forma de almacenar productos e identificarlos mediante un ProductId.

Hay varias formas de proceder a partir de aquí. En algunos casos, podemos asumir que vamos a necesitar ciertos recursos e introducirlos antes de intentar hacer pasar este test. Para ello, anularíamos el test y refactorizaremos para introducir esos elementos.

Una alternativa es implementar la funcionalidad pedida por el test de la forma más rápida posible y refactorizar después. Veamos un ejemplo de esta aproximación:

```typescript
export class GetCurrentStockHandler {
    handle(query: GetCurrentStock): GetCurrentStockResponse {
        if (!this.hasStockOf(query.productId)) {
            return GetCurrentStockResponse.withError(`Product Id ${query.productId} exhausted`)
        }
        return GetCurrentStockResponse.withError(`Product Id ${query.productId} doesn't exist`)
    }

    private hasStockOf(productId: string) {
        return productId != 'no-stock-product-id'
    }
}
```

Ahora que tenemos el test pasando y el cambio consolidado, podríamos refactorizar introduciendo un `Map` en el que consultar los productos y sus stocks. El hecho de tener esa comprobación aislada en un método facilita hacer el cambio.

Este es un primer intento de refactor, pero va a fallar porque al intentar comprobar si hay stock del identificador 'no-existing-product-id', se va a obtener un producto `undefined` y se genera un error distinto del que espera el test.

```typescript
export class GetCurrentStockHandler {
    private products: Map<string, object> = new Map()

    constructor() {
        this.products = new Map()
        this.products.set('no-stock-product-id', {
            id: 'no-stock-product-id',
            name: 'No Stock Product',
            stock: 0,
        })
    }

    handle(query: GetCurrentStock): GetCurrentStockResponse {
        if (!this.hasStockOf(query.productId)) {
            return GetCurrentStockResponse.withError(`Product Id ${query.productId} exhausted`)
        }
        return GetCurrentStockResponse.withError(`Product Id ${query.productId} doesn't exist`)
    }

    private hasStockOf(productId: string) {
        const product = this.products.get(productId)
        return product.stock > 0
    }
}
```

Esto nos revela que quizá estamos enfocando mal el problema, así que vamos a volver atrás un poco. En este punto, el test pasa y conservamos la estructura `Map` en la que almacenamos la información por el momento.

```typescript
export class GetCurrentStockHandler {
    private products: Map<string, object> = new Map()

    constructor() {
        this.products = new Map()
        this.products.set('no-stock-product-id', {
            id: 'no-stock-product-id',
            name: 'No Stock Product',
            stock: 0,
        })
    }

    handle(query: GetCurrentStock): GetCurrentStockResponse {
        if (!this.hasStockOf(query.productId)) {
            return GetCurrentStockResponse.withError(`Product Id ${query.productId} exhausted`)
        }
        return GetCurrentStockResponse.withError(`Product Id ${query.productId} doesn't exist`)
    }

    private hasStockOf(productId: string) {
        return productId != 'no-stock-product-id'
    }
}
```

Aplano todo el código:

```typescript
export class GetCurrentStockHandler {
    private products: Map<string, object> = new Map()

    constructor() {
        this.products = new Map()
        this.products.set('no-stock-product-id', {
            id: 'no-stock-product-id',
            name: 'No Stock Product',
            stock: 0,
        })
    }

    handle(query: GetCurrentStock): GetCurrentStockResponse {
        if (!(query.productId != 'no-stock-product-id')) {
            return GetCurrentStockResponse.withError(`Product Id ${query.productId} exhausted`)
        }
        return GetCurrentStockResponse.withError(`Product Id ${query.productId} doesn't exist`)
    }
}
```

Y ahora cambio el código de tal forma que me aseguro de que el Identificador de Producto existe antes de nada. Con este cambio el test pasa, pero podemos observar varios problemas. Si bien Typescript permite que se ejecute este código, el Linter protesta bastante. En otros lenguajes seguramente no se podría llegar a ejecutar. 

```typescript
export class GetCurrentStockHandler {
    private products: Map<string, object> = new Map()

    constructor() {
        this.products = new Map()
        this.products.set('no-stock-product-id', {
            id: 'no-stock-product-id',
            name: 'No Stock Product',
            stock: 0,
        })
    }

    handle(query: GetCurrentStock): GetCurrentStockResponse {
        const product = this.products.get(query.productId)
        if (!product) {
            return GetCurrentStockResponse.withError(`Product Id ${query.productId} doesn't exist`)
        }

        if (product.stock == 0) {
            return GetCurrentStockResponse.withError(`Product Id ${query.productId} exhausted`)
        }
    }
}
```

Los dos problemas que tenemos son:

* Nada nos garantiza que `product` contenga un campo `stock`.
* No devolvemos nada en caso de que no haya error, y el método expone que devuelve un objeto `GetCurrentStockResponse`.

El segundo caso coincide con lo que nos pide el siguiente requisito, que es el _happy path_: devolver las unidades en stock de un producto. Realmente, como no hay ningún test que nos obligue a otra cosa, podríamos simplemente devolver la respuesta para el caso sin stock.

Y esto, de rebote nos resuelve el primer problema. O más bien, nos permite posponer el solucionar ambos.

```typescript
export class GetCurrentStockHandler {
    private products: Map<string, object> = new Map()

    constructor() {
        this.products = new Map()
        this.products.set('no-stock-product-id', {
            id: 'no-stock-product-id',
            name: 'No Stock Product',
            stock: 0,
        })
    }

    handle(query: GetCurrentStock): GetCurrentStockResponse {
        const product = this.products.get(query.productId)
        if (!product) {
            return GetCurrentStockResponse.withError(`Product Id ${query.productId} doesn't exist`)
        }

        return GetCurrentStockResponse.withError(`Product Id ${query.productId} exhausted`)
    }
}
```

Llegadas a este punto, podríamos intentar seguir avanzando o hacer un nuevo refactor. Aplicando las reglas de _Calistenia de Objetos_, tenemos varias posibilidades:

* La colección `this.products` expone su estructura de datos desnuda. Calistenia nos pide encapsular colecciones en objetos. Una recomendación general es encapsular siempre estas estructuras de datos, de forma que el código consumidor no sepa qué estructura concreta es. Eso permite no acoplarnos a ella, sino a un objeto especializado que ofrece una interfaz estable en caso de que decidamos que la estructura de datos subyacente debe cambiar.
* `Product` es ahora mismo un tipo primitivo, un objeto genérico del lenguaje y también debería estar encapsulado.

Empecemos con `this.products`. Lo mejor suele ser hacerlo en dos pasos. El primer paso es encapsular todas las llamadas a la colección a través de métodos privados. Esto nos permitirá entender cómo queremos usar esa colección:

```typescript
export class GetCurrentStockHandler {
    private products: Map<string, object> = new Map()

    constructor() {
        this.products = new Map()
        this.products.set('no-stock-product-id', {
            id: 'no-stock-product-id',
            name: 'No Stock Product',
            stock: 0,
        })
    }

    handle(query: GetCurrentStock): GetCurrentStockResponse {
        const product = this.getProductById(query.productId)
        if (!product) {
            return GetCurrentStockResponse.withError(`Product Id ${query.productId} doesn't exist`)
        }

        return GetCurrentStockResponse.withError(`Product Id ${query.productId} exhausted`)
    }

    private getProductById(productId: string) {
        return this.products.get(productId)
    }
}
```

En este caso únicamente tenemos un método. Ahora no tenemos más que crear una clase y mover toda la lógica relacionada, mediante un simple copiar, pegar y adaptar. En algunos lenguajes el IDE te puede ofrecer refactors automatizados de este proceso.

```typescript
class InMemoryProducts {
    private products: Map<string, object> = new Map()

    constructor() {
        this.products = new Map()
        this.products.set('no-stock-product-id', {
            id: 'no-stock-product-id',
            name: 'No Stock Product',
            stock: 0,
        })
    }

    public getProductById(productId: string) {
        return this.products.get(productId)
    }
}
```

Como podrás apreciar, prácticamente solo hemos tenido que copiar.

Ahora toca, introducir este código en el Handler en paralelo al código existente.

```typescript
export class GetCurrentStockHandler {
    private products: Map<string, object> = new Map()
    private productRepository: InMemoryProducts

    constructor() {
        this.products = new Map()
        this.products.set('no-stock-product-id', {
            id: 'no-stock-product-id',
            name: 'No Stock Product',
            stock: 0,
        })
        this.productRepository = new InMemoryProducts
    }

    handle(query: GetCurrentStock): GetCurrentStockResponse {
        const product = this.getProductById(query.productId)
        if (!product) {
            return GetCurrentStockResponse.withError(`Product Id ${query.productId} doesn't exist`)
        }

        return GetCurrentStockResponse.withError(`Product Id ${query.productId} exhausted`)
    }

    private getProductById(productId: string) {
        return this.products.get(productId)
    }
}
```

El último paso es reemplazar cada llamada a `this.products` por la llamada equivalente a `this.productRepository` y comprobar que todo funciona como es debido.

```typescript
export class GetCurrentStockHandler {
    private products: Map<string, object> = new Map()
    private productRepository: InMemoryProducts

    constructor() {
        this.products = new Map()
        this.products.set('no-stock-product-id', {
            id: 'no-stock-product-id',
            name: 'No Stock Product',
            stock: 0,
        })
        this.productRepository = new InMemoryProducts
    }

    handle(query: GetCurrentStock): GetCurrentStockResponse {
        const product = this.getProductById(query.productId)
        if (!product) {
            return GetCurrentStockResponse.withError(`Product Id ${query.productId} doesn't exist`)
        }

        return GetCurrentStockResponse.withError(`Product Id ${query.productId} exhausted`)
    }

    private getProductById(productId: string) {
        return this.productRepository.getProductById(productId)
    }
}
```

Y, una vez comprobado, podemos borrar el código que ha dejado de usarse.

```typescript
export class GetCurrentStockHandler {
    private productRepository: InMemoryProducts

    constructor() {
        this.productRepository = new InMemoryProducts
    }

    handle(query: GetCurrentStock): GetCurrentStockResponse {
        const product = this.getProductById(query.productId)
        if (!product) {
            return GetCurrentStockResponse.withError(`Product Id ${query.productId} doesn't exist`)
        }

        return GetCurrentStockResponse.withError(`Product Id ${query.productId} exhausted`)
    }

    private getProductById(productId: string) {
        return this.productRepository.getProductById(productId)
    }
}
```

Ahora deberíamos consolidar el cambio con un commit.

### Introduciendo el puerto Driven _forStoringProducts_

O `forRetrievingProducts`. 

Al principio considerábamos necesario un puerto secundario o driven para gestionar la persistencia de la información de productos. Este puerto es el que la aplicación usaría para hablar con una base de datos y resolver estas necesidades.

Arquitectura Hexagonal no prescribe una determinada granularidad de puertos. Nosotras podemos decidir qué es lo que más conviene a nuestra aplicación. 

Por ejemplo, podríamos tener un puerto para almacenar los datos de productos y un puerto para hacer consultas a esos datos. Esta sería la versión Hexagonal de CQRS, por decirlo así. Nada nos impide implementar esos puertos accediendo a la misma instancia de la base de datos, o hacerlo a una instancia de escritura y otra de lectura separadas. Todo dependerá de nuestras necesidades. Del mismo modo, podemos empezar con un modelo más simple de única instancia y cambiarlo cuando nuestras necesidades de escalado así lo exijan.

Una recomendación general de los autores de Arquitectura Hexagonal es tratar de no dotar de demasiada granularidad a los puertos, pues aumenta la complejidad. 

Yo lo voy a hacer aquí con doble finalidad didáctica:

Porque es una muestra de que es bastante habitual descubrir los puertos secundarios que necesitamos, más allá de lo que habíamos previsto inicialmente.

Y porque es un diseño que puede aportar ventajas y tiene sentido.

#### Puertos driven = interfaz requerida

Los puertos _driven_ requieren que los adaptadores implementen las interfaces definidas. A esto lo llamamos _interfaz requerida_ o _required interface_. Esto es complementario a los puertos _driving_ o primarios, que exponen interfaces que los adaptadores deben usar, lo que tiene el nombre de _interfaz proporcionada_ o _provided interface_. 

En nuestro ejemplo, `InMemoryProducts` es claramente adaptador, para tests, de un puerto que aún no hemos declarado pero que necesitamos. En este caso: `forRetrievingProducts`.

En lenguajes con interfaces explícitas, esto se define habitualmente así. Podemos extraer esta interfaz de `InMemoryProducts`.

```typescript
export interface ForRetrievingProducts {
    getProductById(productId: string): Object
}
```

Y ahora, lo suyo es mover `InMemoryProducts` a su lugar como Adapter de esta interfaz. Así que lo llevamos a una carpeta `driven/forRetrievingProducts`

```plaintext
src
├── driven
│   └── forRetrievingProducts
│       └── InMemoryProducts.ts
├── index.ts
└── inventory
    ├── forManagingProducts
    │   └── getCurrentStock
    │       ├── GetCurrentStock.ts
    │       ├── GetCurrentStockHandler.ts
    │       └── GetCurrentStockResponse.ts
    └── forRetrievingProducts
        └── ForRetrievingProducts.ts

6 directories, 6 files
```

Comprobamos que los tests pasan y guardamos los cambios.

En el futuro, podremos implementar un adaptador de este mismo puerto basado en otra tecnología.

### Encapsular primitivos

Una de las cuestiones que puede preocuparnos ahora es el abuso de tipos primitivos que estamos teniendo en el código. Si bien, esto es algo totalmente independiente de la aplicación del patrón Ports and Adapters, lo cierto es que cuanto antes lo ataquemos, mejor. Así nos evitamos tediosos refactors en el futuro.

Ahora bien, ¿qué objetos? Ahora mismo tenemos un sistema de inventario y la única necesidad que tenemos que satisfacer es proporcionar los datos de stock que tengamos guardados. Puede que no necesitemos una entidad `Product` completamente equipada, sino tan solo una representación suficiente de la misma para atender la funcionalidad solicitada.

Ahora mismo, el puerto devuelve un objeto genérico, que puede tener o no las propiedades deseadas. Por otro lado, se le pasa como Id un string, el cual podría contener un Identificador de producto no válido.

```typescript
export interface ForRetrievingProducts {
    getProductById(productId: string): Object | undefined
}
```

Nuestro objetivo podría ser algo así:

```typescript
export interface ForRetrievingProducts {
    getProductById(productId: ProductId): ProductStock | undefined
}
```

Toca refactor.

#### Refactorizar para encapsular

Dado que tenemos tests que pasan y que queremos hacer cambios de estructura, una buena forma de hacerlo es introducir cada cambio por separado, ver fallar los tests y modificar lo necesario hasta volver a tener los tests en verde. Por ejemplo:

```typescript
export interface ForRetrievingProducts {
    getProductById(productId: ProductId): Object | undefined
}
```

Esto genera una serie de cambios en cascada para subsanar errores y la introducción de la clase `ProductId`:

```typescript
export class ProductId {
    private readonly productId: string

    constructor(productId: string) {
        this.productId = productId
    }

    toString(): string {
        return this.productId
    }
}
```

```typescript
export class GetCurrentStockHandler {
    private productRepository: ForRetrievingProducts

    constructor() {
        this.productRepository = new InMemoryProducts
    }

    handle(query: GetCurrentStock): GetCurrentStockResponse {
        const productId = new ProductId(query.productId)
        const product = this.getProductById(productId)
        if (!product) {
            return GetCurrentStockResponse.withError(`Product Id ${query.productId} doesn't exist`)
        }

        return GetCurrentStockResponse.withError(`Product Id ${query.productId} exhausted`)
    }

    private getProductById(productId: ProductId) {
        return this.productRepository.getProductById(productId)
    }
}
```

```typescript
export class InMemoryProducts implements ForRetrievingProducts {
    private products: Map<string, object> = new Map()

    constructor() {
        this.products = new Map()
        this.products.set('no-stock-product-id', {
            id: 'no-stock-product-id',
            name: 'No Stock Product',
            stock: 0,
        })
    }

    getProductById(productId: ProductId) {
        return this.products.get(productId.toString())
    }
}
```

De momento, no tiene mucho sentido introducir `ProductStock`, no hay realmente nada en el código que lo requiera, así que vamos a esperar un poco. 

Tiempo de consolidar los cambios y atacar otros asuntos. Puede ser momento de introducir otros tests.

### Happy Path

Hasta ahora no habíamos añadido el _Happy Path_, es decir, el caso en el que todo va bien y se implementa la funcionalidad.

```typescript
describe('When we ask the current stock of a product', () => {
    it('Should success with product stock information', () => {
        const query = new GetCurrentStock('existing-product-id')
        const handler = new GetCurrentStockHandler()
        const response = handler.handle(query)
        expect(response.success()).toBeTruthy()
        expect(response.payload()).toEqual(
            {
                id: 'existing-product-id',
                name: 'existing-product-name',
                stock: 10
            }
        )
    })
})
```

El test fallará. Por un lado, no tenemos un ejemplar de Product en nuestro repositorio InMemory, pero tampoco tenemos código que lo gestione.

```typescript
export class InMemoryProducts implements ForRetrievingProducts {
    private products: Map<string, object> = new Map()

    constructor() {
        this.products = new Map()
        this.products.set('no-stock-product-id', {
            id: 'no-stock-product-id',
            name: 'No Stock Product',
            stock: 0,
        })
        this.products.set('existing-product-id', {
            id: 'existing-product-id',
            name: 'existing-product-name',
            stock: 10,
        })
    }

    getProductById(productId: ProductId) {
        return this.products.get(productId.toString())
    }
}
```

```typescript
export class GetCurrentStockHandler {
    private productRepository: ForRetrievingProducts

    constructor() {
        this.productRepository = new InMemoryProducts
    }

    handle(query: GetCurrentStock): GetCurrentStockResponse {
        const productId = new ProductId(query.productId)
        const product = this.getProductById(productId)
        if (!product) {
            return GetCurrentStockResponse.withError(`Product Id ${query.productId} doesn't exist`)
        }

        if (product.stock == 0) {
            return GetCurrentStockResponse.withError(`Product Id ${query.productId} exhausted`)
        }

        return GetCurrentStockResponse.withSuccess(product)
    }

    private getProductById(productId: ProductId) {
        return this.productRepository.getProductById(productId)
    }
}
```

```typescript
export class GetCurrentStockResponse {
    private result: Object
    private errorMessage: string | undefined

    static withError(message: string) {
        return new GetCurrentStockResponse({}, message)
    }

    static withSuccess(result: Object): GetCurrentStockResponse {
        return new GetCurrentStockResponse(result)
    }

    constructor(result: Object, errorMessage?: string) {
        this.result = result
        this.errorMessage = errorMessage
    }

    success() {
        return !this.errorMessage || this.errorMessage.length === 0
    }

    error(): string {
        if (!this.errorMessage) {
            throw new Error('Response was successful')
        }
        return this.errorMessage
    }

    payload(): Object {
        return this.result
    }
}
```

Con esto, hacemos pasar el test, pero tratándose de Typescript, hay algunas cosas que revisar y que otros lenguajes no nos permitirían. Como es el acceso a `product.stock` en este fragmento:

```typescript
if (product.stock == 0) {
    return GetCurrentStockResponse.withError(`Product Id ${query.productId} exhausted`)
}
```

Una opción es introducir un tipo `ProductStock`. Con este cambio, aseguramos que `product.stock` existe.

```typescript
type ProductStock = {
    id: ProductId
    name: string
    stock: number
}

export class GetCurrentStockHandler {
    private productRepository: ForRetrievingProducts

    constructor() {
        this.productRepository = new InMemoryProducts
    }

    handle(query: GetCurrentStock): GetCurrentStockResponse {
        const productId = new ProductId(query.productId)
        const product = this.getProductById(productId) as ProductStock | undefined
        if (!product) {
            return GetCurrentStockResponse.withError(`Product Id ${query.productId} doesn't exist`)
        }

        if (product.stock == 0) {
            return GetCurrentStockResponse.withError(`Product Id ${query.productId} exhausted`)
        }

        return GetCurrentStockResponse.withSuccess(product)
    }

    private getProductById(productId: ProductId) {
        return this.productRepository.getProductById(productId)
    }
}
```

### El path _desolado_

¿Qué ocurre si no se reciben los parámetros necesarios o no son válidos? 

Gojko Adzic, David Evans y Tom Roden, en el libro [Fifty Quick Ideas to Improve Your Tests](https://leanpub.com/50quickideas-tests) incluyen heurísticas emocionales para decidir qué tests necesitamos hacer. Una de ellas, aparte del _happy path_, es el _desolate path_: qué ocurre si los inputs están vacíos o incompletos. Lo cierto es que anteriormente hemos probado ya este path al hacer un test basado en que no encontraremos datos.

En algunos lenguajes, el tipado puede ser suficiente para asegurar parámetros con valores adecuados. Pero en otros, necesitamos medidas extras. En nuestro ejemplo, `productId` no debería ser una cadena vacía, pero una cadena vacía podría llegar hasta aquí, por lo que quizá debamos controlar eso. 

Así que hagamos un test que nos permita implementar esta validación. Este test no pasa, aunque la funcionalidad no está rota, ya que el `ProductId` vacío se interpreta como el de un producto que no existe. La verdad es que podríamos discutir si merece la pena controlar este caso, al menos en el contexto actual. Otra cosa es que podamos permitir usar `ProductId` vacíos en otras partes del código.

```typescript
describe('When we pass invalid parameters', () => {
    it('Should fail with Invalid Argument Error', () => {
        const query = new GetCurrentStock('')
        const handler = new GetCurrentStockHandler()
        const response = handler.handle(query)
        expect(response.success()).toBeFalsy()
        expect(response.error()).toEqual('Invalid Product Id')
    })
})
```

Esto se puede implementar así:

```typescript
export class GetCurrentStockHandler {
    private productRepository: ForRetrievingProducts

    constructor() {
        this.productRepository = new InMemoryProducts
    }

    handle(query: GetCurrentStock): GetCurrentStockResponse {
        if (query.productId.length == 0) {
            return GetCurrentStockResponse.withError('Invalid Product Id')
        }
        const productId = new ProductId(query.productId)
        const product = this.getProductById(productId) as ProductStock | undefined
        if (!product) {
            return GetCurrentStockResponse.withError(`Product Id ${query.productId} doesn't exist`)
        }

        if (product.stock == 0) {
            return GetCurrentStockResponse.withError(`Product Id ${query.productId} exhausted`)
        }

        return GetCurrentStockResponse.withResult(product)
    }

    private getProductById(productId: ProductId) {
        return this.productRepository.getProductById(productId)
    }
}
```

### Refactor

De momento el _handler_ es esencialmente un _Transaction Script_. Este patrón consiste en un código procedural y, desde un punto de vista de OOP, tiene mucho que tratar. 

Lo más llamativo es que tenemos demasiadas condicionales. Esto define cuatro caminos de ejecución posibles: el _happy path_ y tres que salen rápidamente del handler en caso de algún error. La existencia de condicionales no es un problema por sí misma, pero podríamos pensar en ella como en un _code smell_. Tenemos que fijarnos en cosas como si estamos mezclando niveles de abstracción, si el _handler_ esté manejando conocimiento al que no debería acceder, etc. 

Vamos por partes.

El siguiente fragmento implica que el _handler_ sabe algo sobre lo que supone tener un objeto `ProductId` consistente:

```typescript
if (query.productId.length == 0) {
    return GetCurrentStockResponse.withError('Invalid Product Id')
}
const productId = new ProductId(query.productId)
```

Esencialmente, lo que sería una regla de validación de `ProductId` se gestiona fuera del mismo. Esto supone que cada vez que tuviésemos que instanciar un objeto de esta clase, tendríamos que comprobar que lo construimos con un parámetro válido. Esta validación tiene que darse o bien en el constructor o bien en un Builder o Factory responsable de instanciar estos objetos.

Por lo general, estas validaciones deberían arrojar un error e impedir que se pueda instanciar el objeto. En Typescript, lo suyo es lanzar un error y capturarlo en un `try/catch`. Nuestra solución actual impide que se instancie, pero solo en este caso. Si queremos evitarlo en otras partes del código, tenemos que repetir este bloque. Por esa razón, necesitamos aislar la construcción.

Una práctica habitual, y que yo mismo he seguido hasta hace poco tiempo, es incluir validaciones en el constructor primario. Sin embargo, cada vez encuentro más razones para evitarlo. Hay casos de usos en los que no necesitaría la validación porque puedo confiar en que el dato provisto es correcto y necesito evitar que la validación falle, por ejemplo al leer de la base de datos. Lo que estoy empezando a hacer es crear constructores secundarios que hagan las validaciones y transformaciones pertinentes, y vaciar el constructor primario de cualquier lógica que no sea la asignación:

```typescript
describe('ProductId', () => {
    it('should not be instantiated empty', () => {
        expect(() => {ProductId.validFrom('')}).toThrowError(InvalidIdentifierError)
    })
})
```

```typescript
export class ProductId {
    private readonly productId: string

    constructor(productId: string) {
        this.productId = productId
    }

    toString(): string {
        return this.productId
    }

    static validFrom(s: string) {
        if (s.trim().length === 0) {
            throw new InvalidIdentifierError(`Product Id should not be empty`)
        }
        return new ProductId(s)
    }
}
```

Ahora, podríamos usarlo, pero requiere de algunos cambios:

```typescript
export class GetCurrentStockHandler {
    private productRepository: ForRetrievingProducts

    constructor() {
        this.productRepository = new InMemoryProducts
    }

    handle(query: GetCurrentStock): GetCurrentStockResponse {
        let productId: ProductId

        try {
            productId = ProductId.ensureValid(query.productId)
        } catch (e: unknown) {
            if (e instanceof InvalidIdentifierError) {
                return GetCurrentStockResponse.withError('Invalid Product Id')
            }
        }

        // @ts-ignore
        const product = this.getProductById(productId) as ProductStock | undefined
        if (!product) {
            return GetCurrentStockResponse.withError(`Product Id ${query.productId} doesn't exist`)
        }

        if (product.stock == 0) {
            return GetCurrentStockResponse.withError(`Product Id ${query.productId} exhausted`)
        }

        return GetCurrentStockResponse.withResult(product)
    }

    private getProductById(productId: ProductId) {
        return this.productRepository.getProductById(productId)
    }
}
```

Esto se ha puesto bastante peor, en mi opinión, y solamente estamos gestionando la validación de un objeto sencillo. Creo que el problema no viene tanto del mix entre excepciones y patrón Result para gestionar los errores, sino de un mal planteamiento del diseño en este punto. Así que vamos a dar un paso atrás.

### Rediseño

Esto es lo que teníamos:

```typescript
export class GetCurrentStockHandler {
    private productRepository: ForRetrievingProducts

    constructor() {
        this.productRepository = new InMemoryProducts
    }

    handle(query: GetCurrentStock): GetCurrentStockResponse {
        if (query.productId.length == 0) {
            return GetCurrentStockResponse.withError('Invalid Product Id')
        }
        const productId = new ProductId(query.productId)
        const product = this.getProductById(productId) as ProductStock | undefined
        if (!product) {
            return GetCurrentStockResponse.withError(`Product Id ${query.productId} doesn't exist`)
        }

        if (product.stock == 0) {
            return GetCurrentStockResponse.withError(`Product Id ${query.productId} exhausted`)
        }

        return GetCurrentStockResponse.withResult(product)
    }

    private getProductById(productId: ProductId) {
        return this.productRepository.getProductById(productId)
    }
}
```


¿Qué hace el Handler? Su trabajo es obtener la información de stock de un producto y devolverla. El problema es que en el código actual esto no está bien reflejado y hay niveles de abstracción mezclados. Después de darle unas vueltas, consigo esa organización que me convence más:

```typescript
export class GetCurrentStockHandler {
    private productRepository: ForRetrievingProducts

    constructor() {
        this.productRepository = new InMemoryProducts
    }

    handle(query: GetCurrentStock): GetCurrentStockResponse {
        try {
            const product = this.obtainProductStockInfo(query.productId)

            if (product.stock == 0) {
                return GetCurrentStockResponse.withError(`Product Id ${query.productId} exhausted`)
            }

            return GetCurrentStockResponse.withResult(product)
        } catch (e: unknown) {
            return GetCurrentStockResponse.withError((e as Error).message)
        }
    }

    private obtainProductStockInfo(rawProductId: string): ProductStock {
        const productId = ProductId.ensureValid(rawProductId)
        const product = this.getProductById(productId) as ProductStock | undefined
        if (!product) {
            throw new Error(`Product Id ${rawProductId} doesn't exist`)
        }
        return product
    }

    private getProductById(productId: ProductId) {
        return this.productRepository.getProductById(productId)
    }
}
```

Esto ya me gusta más porque el método `handle` ahora es bastante más claro. Lo que también veo es que este `if (product.stock == 0)` me molesta en este punto. Además, creo que el método `obtainProductStockInfo` podría perfectamente irse a otro objeto.

Para lo primero, tendría que hacer que `ProductStock` deje de ser un tipo para ser una clase y así exponer métodos.

```typescript
export class ProductStock {
    private readonly id: ProductId
    private readonly name: string
    private readonly stock: number

    constructor(id: ProductId, name: string, stock: number) {
        this.id = id
        this.name = name
        this.stock = stock
    }

    isExhausted(): boolean {
        return this.stock <= 0
    }

    print(): Object {
        return {
            id: this.id.toString(),
            name: this.name,
            stock: this.stock
        }
    }
}
```

Lo que nos lleva a:

```typescript
export class GetCurrentStockHandler {
    private productRepository: ForRetrievingProducts

    constructor() {
        this.productRepository = new InMemoryProducts
    }

    handle(query: GetCurrentStock): GetCurrentStockResponse {
        try {
            const product = this.obtainProductStockInfo(query.productId)

            if (product.isExhausted()) {
                return GetCurrentStockResponse.withError(`Product Id ${query.productId} exhausted`)
            }

            return GetCurrentStockResponse.withResult(product.print())
        } catch (e: unknown) {
            return GetCurrentStockResponse.withError((e as Error).message)
        }
    }

    private obtainProductStockInfo(rawProductId: string): ProductStock {
        const productId = ProductId.ensureValid(rawProductId)
        const product = this.getProductById(productId) as ProductStock | undefined
        if (!product) {
            throw new Error(`Product Id ${rawProductId} doesn't exist`)
        }
        return product
    }

    private getProductById(productId: ProductId) {
        const productData = this.productRepository.getProductById(productId)
        if (!productData) {
            throw new Error(`Product Id ${productId} doesn't exist`)
        }
        return new ProductStock(productId, productData.name, productData.stock)
    }
}
```

En cuanto a mover el método `obtainProductStockInfo`, puedo imaginar la existencia de un objeto `Inventory`, encargándose de la gestión y dejando al Handler solo con tareas de coordinación:

```typescript
class Inventory {
    private repository: ForRetrievingProducts

    constructor(repository: ForRetrievingProducts) {
        this.repository = repository
    }

    public obtainProductStockInfo(rawProductId: string): ProductStock {
        const productId = ProductId.ensureValid(rawProductId)
        const product = this.getProductById(productId) as ProductStock | undefined
        if (!product) {
            throw new Error(`Product Id ${rawProductId} doesn't exist`)
        }
        return product
    }

    private getProductById(productId: ProductId): ProductStock {
        const productData = this.repository.getProductById(productId)
        if (!productData) {
            throw new Error(`Product Id ${productId} doesn't exist`)
        }
        return new ProductStock(productId, productData.name, productData.stock)
    }
}
```

```typescript
export class GetCurrentStockHandler {
    private inventory: Inventory

    constructor() {
        this.inventory = new Inventory(new InMemoryProducts())
    }

    handle(query: GetCurrentStock): GetCurrentStockResponse {
        try {
            const product = this.inventory.obtainProductStockInfo(query.productId)

            if (product.isExhausted()) {
                return GetCurrentStockResponse.withError(`Product Id ${query.productId} exhausted`)
            }

            return GetCurrentStockResponse.withResult(product.print())
        } catch (e: unknown) {
            return GetCurrentStockResponse.withError((e as Error).message)
        }
    }
}
```

Este rediseño del Handler me gusta bastante más. Quedan algunos detalles más pequeños por arreglar, pero creo que ha llegado el momento de parar. Entre otras cosas, habría que inyectar `Inventory` en el handler.

Así es cómo ha quedado la aplicación:

```plaintext
src
├── driven
│   └── forRetrievingProducts
│       └── InMemoryProducts.ts
├── index.ts
└── inventory
    ├── Inventory.ts
    ├── ProductStock.ts
    ├── forManagingProducts
    │   └── getCurrentStock
    │       ├── GetCurrentStock.ts
    │       ├── GetCurrentStockHandler.ts
    │       └── GetCurrentStockResponse.ts
    ├── forRetrievingProducts
    │   └── ForRetrievingProducts.ts
    └── product
        ├── ProductId.test.ts
        └── ProductId.ts

7 directories, 10 files
```

Puedes ver [esta versión del código en el repositorio](https://github.com/franiglesias/inventory/pull/1).

## Reflexiones sobre Outside-in clásica

En este artículo he tratado de ceñirme a esta forma de desarrollo. Sin embargo, no es posible dejar de tener en mente un cierto diseño general del sistema que oriente los pasos de los sucesivos refactors. Tratándose de Arquitectura Hexagonal, lo cierto es hay unos elementos organizativos que hay que cumplir, y que ayudan a tomar decisiones sobre cómo estructurar el código.

Personalmente, tengo la impresión de que este enfoque me ha llevado con cierta facilidad por caminos indeseados. Al empezar por lo que viene siendo un _transaction script_, es fácil mezclar responsabilidades y niveles de abstracción, lo que dificulta el refactor. De hecho, aunque no siempre lo he reflejado en el texto, he tenido que deshacer cambios más de una vez.

En muchos aspectos, esta forma de desarrollo nos va a requerir buenas técnicas de gestión de código legacy y técnicas de refactor.

En el artículo siguiente, intentaré desarrollar lo mismo, pero usando una metodología más próxima a la London School, con Just-In-Time design y comparar. Obviamente, me voy a ver influido por lo que ya he trabajado aquí.