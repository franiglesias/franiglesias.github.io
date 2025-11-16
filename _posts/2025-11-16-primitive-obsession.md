---
layout: post
title: Primitive Obsession
categories: articles
series: code-smells
tags: code-smells refactoring typescript
---

_Primitive Obsession_ es el último de los _bloaters_, una categoría de _code smells_ que se caracterizan por hacer que nuestro código sea grande y complejo, introduciendo muchas oportunidades para la aparición de bugs y comportamiento inconsistente.

## Definición

Caemos en _primitive obsession_ cuando los conceptos de dominio se modelan con primitivos, lo que obliga a esparcir reglas de validación, formato, y todo tipo de comportamiento, por todo el código. La consecuencia es que el código se vuelve difícil de seguir y mantener, con niveles de abstracción mezclados y código repetido por todas partes.

_Primitive Obsession_ y [_Data Clump_](/data-clump/) son muy similares y seguramente aparecerán juntos muchas veces, como es el caso del siguiente ejemplo. Por señalar una diferencia, _primitive obsession_ incide más en valores primitivos que intentan representar conceptos de dominio con validaciones más allá de las genéricas, mientras que _data clump_ apunta a conjuntos de valores que representan un concepto compuesto único.

## Ejemplo

```typescript
class Order {
  constructor(
    private customerName: string,
    private customerEmail: string,
    private address: string,
    private totalAmount: number,
    private currency: string,
  ) {
  }

  sendInvoice() {
    if (!this.customerEmail.includes('@')) {
      throw new Error('Email inválido')
    }
    if (this.totalAmount <= 0) {
      throw new Error('El monto debe ser mayor que cero')
    }
    console.log(`Factura enviada a ${this.customerEmail} por ${this.totalAmount} ${this.currency}`)
  }
}
```

## Ejercicio

Introduce soporte para diferentes monedas y para formatear la dirección en función del país.

## Problemas que encontrarás

Dado que los primitivos no nos permiten garantizar la integridad de sus valores, tendrás que introducir validaciones en muchos lugares, incluso de forma repetida. Algunos datos siempre viajan juntos (Data Clump), por lo que tienes que asegurarte de que permanecen juntos.

Para formatear de forma diferente basándote en algún dato arbitrario tendrás que introducir lógica de decisión en todos aquellos lugares que necesiten utilizar el formato.

## Solución

### Sin resolver el _code smell_

Veamos, por ejemplo, qué necesitaríamos hacer para introducir soporte para diferentes monedas. Por ejemplo, cuando usamos dólares es habitual que el símbolo se ponga antes del importe, mientras que con euros, al menos en España, la moneda se indica después:

```
$100.00
100.00 €
```

Así que tendríamos que añadir algo de código para gestionarlo:

```typescript
class Order {
    constructor(
        private customerName: string,
        private customerEmail: string,
        private address: string,
        private totalAmount: number,
        private currency: string,
    ) {
    }

    sendInvoice() {
        if (!this.customerEmail.includes('@')) {
            throw new Error('Email inválido')
        }
        if (this.totalAmount <= 0) {
            throw new Error('El monto debe ser mayor que cero')
        }
        
        let amountWithCurrency: string;
        if (this.currency == 'USD') {
            amountWithCurrency = `$${this.totalAmount}`
        } else if (this.currency == 'EUR') {
            amountWithCurrency = `${this.totalAmount} €`
        } else {
            throw new Error('Moneda no soportada')
        }

        console.log(`Factura enviada a ${this.customerEmail} por ${amountWithCurrency}`)
    }
}
```

Podríamos extraer esto a un método. Esto mejora un poco las cosas, pero tal como está hecho no es reutilizable.

```typescript
class Order {
    constructor(
        private customerName: string,
        private customerEmail: string,
        private address: string,
        private totalAmount: number,
        private currency: string,
    ) {
    }

    sendInvoice() {
        if (!this.customerEmail.includes('@')) {
            throw new Error('Email inválido')
        }
        if (this.totalAmount <= 0) {
            throw new Error('El monto debe ser mayor que cero')
        }
        console.log(`Factura enviada a ${this.customerEmail} por ${(this.formatAmount())}`)
    }

    private formatAmount() {
        if (this.currency == 'USD') {
            return `$${this.totalAmount}`
        } else if (this.currency == 'EUR') {
            return `${this.totalAmount} €`
        } else {
            throw new Error('Moneda no soportada')
        }
    }
}
```

Para lograr que el código sea reutilizable necesitamos algo de este estilo:

```typescript
class Order {
    // Code removed for clarity

    private formatAmount() {
        return formatAmount(this.totalAmount, this.currency)
    }
}

function formatAmount(amount: number, currency: string) {
    if (currency == 'USD') {
        return `$${amount}`
    } else if (currency == 'EUR') {
        return `${amount} €`
    } else {
        throw new Error('Moneda no soportada')
    }
}
```

Bien, ahora tenemos una solución que podemos reutilizar en muchos lugares, pero fíjate que esta función tiene que conocer todas las monedas que se pueden usar y las reglas para formatearlas. Esto hace que sea bastante incómoda de testear y mantener. A la larga, es propensa a errores.

Este refactor nos lleva a un punto un poco mejor, ya que con el map es bastante fácil dar soporte a otras monedas, pues solamente hay que añadir una entrada al mismo.

```typescript
class Order {
    // Code removed for clarity

    private formatAmount() {
        return formatAmount(this.totalAmount, this.currency)
    }
}

const currencyFormatters = new Map<string, (amount: number) => string>([
    ['USD', (amount) => `$${amount}`],
    ['EUR', (amount) => `${amount} €`],
])

function formatAmount(amount: number, currency: string) {
    const formatter = currencyFormatters.get(currency)
    if (!formatter) {
        throw new Error('Moneda no soportada')
    }
    return formatter(amount)
}
```

Aun así, tenemos algunos problemas. Por ejemplo, ¿qué ocurre si en vez de usar `USD` o `EUR` usamos `usd` o `eur`? O, ¿qué ocurre si en algún punto expresamos las monedas con símbolos diferentes, como `$` o `£`, pero que serían sinónimos. Es decir, el uso de un `string` para representar una moneda no garantiza que lo hagamos de forma consistente y tendríamos que introducir código defensivo en varios lugares para prevenir errores, en un cierto juego del gato y el ratón. O bien duplicar este código auxiliar en cada lugar en el que lo necesitemos.

```typescript
class Order {
// Code removed for clarity

    private formatAmount() {
        return formatAmount(this.totalAmount, this.currency)
    }
}

const currencyFormatters = new Map<string, (amount: number) => string>([
    ['USD', (amount) => `$${amount}`],
    ['$', (amount) => `$${amount}`],
    ['EUR', (amount) => `${amount} €`],
    ['€', (amount) => `${amount} €`],
])

function formatAmount(amount: number, currency: string) {
    const formatter = currencyFormatters.get(currency.toUpperCase())
    if (!formatter) {
        throw new Error('Moneda no soportada')
    }
    return formatter(amount)
}
```

En este caso hemos podido mantenerlo relativamente aislado, pero tenemos que introducir instrucciones para ocuparnos de cuestiones que van engordando nuestro código en temas no directamente relacionados con el dominio de la pieza en la que trabajamos.

Y exactamente lo mismo nos encontraremos para formatear direcciones, para validar el email, etc. Así que vayamos a ver cómo se resolvería este _code smell_ introduciendo Value Objects.

### Resolviendo el _code smell_

_Introduce Value Object_ es el refactor apropiado para _Primitive Obsession_. Consiste en encapsular los valores primitivos en objetos que representen conceptos del dominio. Si seguimos las reglas de Domain Driven Design, los value objects representan conceptos de dominio que nos interesan por su valor. Tienen varias propiedades:

* Inmutabilidad: sus propiedades se mantienen inalteradas durante su ciclo de vida. Las operaciones que las mutan siempre devuelven una nueva instancia.
* No tienen identidad: los value objects se diferencian entre sí por su valor, por lo que nos da igual la instancia específica.
* Comparación por valor: dos value objects son iguales si tienen el mismo valor de sus propiedades.
* Garantizan su consistencia: no se pueden instanciar con valores no válidos.
* Encapsulación: los value objects atraen el comportamiento relacionado con su valor.

Vamos a ver estas cómo algunas de estas propiedades nos benefician en comparación con modelar conceptos con primitivos. Por ejemplo, en el caso de la moneda.

* Inmutabilidad: al modelar la moneda (currency) con un string no podemos evitar que algún proceso pueda cambiarla.
* Consistencia: con un string podríamos tener diversas formas equivalentes de expresar una misma moneda (`USD`, `US$`, `dollars`, `$`, etc.) que tendríamos que controlar en cada uso. Un Value Object nos proporciona una representación consistente todo el tiempo.
* Encapsulación: al modelar con un string tendríamos que tratar explícitamente con el formato de la moneda en cada lugar donde se use. Con un value object podemos encapsular incluso distintos formatos para usar de forma consistente dependiendo del contexto.

Vamos a verlo en acción.

#### Email

La mayor dificultad para refactorizar introduciendo Value Objects es que tenemos que cambiar firmas de métodos y funciones, pero podemos usar algunas técnicas sencillas para hacerlo sin muchos problemas. Vamos a empezar con el email.

```typescript
class Order {
    constructor(
        private customerName: string,
        private customerEmail: string,
        private address: string,
        private totalAmount: number,
        private currency: string,
    ) {
    }

    sendInvoice() {
        if (!this.customerEmail.includes('@')) {
            throw new Error('Email inválido')
        }
        if (this.totalAmount <= 0) {
            throw new Error('El monto debe ser mayor que cero')
        }
        console.log(`Factura enviada a ${this.customerEmail} por ${this.totalAmount} ${this.currency}`)
    }
}
```

Lo primero que nos conviene hacer es cambiar la sintaxis del constructor, pasando de parámetros propiedad a separar parámetros y propiedades.

```typescript
class Order {
    private customerName: string;
    private customerEmail: string;
    private address: string;
    private totalAmount: number;
    private currency: string;

    constructor(
        customerName: string,
        customerEmail: string,
        address: string,
        totalAmount: number,
        currency: string,
    ) {
        this.currency = currency;
        this.totalAmount = totalAmount;
        this.address = address;
        this.customerEmail = customerEmail;
        this.customerName = customerName;
    }

    sendInvoice() {
        if (!this.customerEmail.includes('@')) {
            throw new Error('Email inválido')
        }
        if (this.totalAmount <= 0) {
            throw new Error('El monto debe ser mayor que cero')
        }
        console.log(`Factura enviada a ${this.customerEmail} por ${this.totalAmount} ${this.currency}`)
    }
}

```

Por otro lado, introducimos un nuevo Value Object para representar el email, encapsulando los comportamientos de validación y formateo que podamos necesitar. Nos basta copiar el código de la clase Order relativo al Email.

```typescript
class Email {
    private readonly email: string;

    constructor(email: string) {
        if (!email.includes('@')) {
            throw new Error('Email inválido')
        }
        this.email = email;
    }

    toString() {
        return this.email;
    }
}
```

Hay algunos autores que señalan que no deberíamos tener validaciones en el constructor, ya que hay situaciones en las que no serían necesarias. No tengo una opinión fuerte sobre ello, pero una alternativa sería:

```typescript
class Email {
    private readonly email: string;

    private constructor(email: string) {

        this.email = email;
    }

    static valid(email: string): Email {
        if (!email.includes('@')) {
            throw new Error('Email inválido')
        }

        return new Email(email);
    }

    toString() {
        return this.email;
    }
}
```

A continuación, podemos usarlo en la clase Order. En ese caso lo voy a hacer en forma paralela. 

```typescript
class Order {
    private customerName: string;
    private customerEmail: string;
    private address: string;
    private totalAmount: number;
    private currency: string;

    constructor(
        customerName: string,
        customerEmail: string,
        address: string,
        totalAmount: number,
        currency: string,
    ) {
        this.currency = currency;
        this.totalAmount = totalAmount;
        this.address = address;
        this.customerEmail = customerEmail;
        this.customerName = customerName;
    }

    sendInvoice() {
        const email = Email.valid(this.customerEmail);
        if (!this.customerEmail.includes('@')) {
            throw new Error('Email inválido')
        }
        if (this.totalAmount <= 0) {
            throw new Error('El monto debe ser mayor que cero')
        }
        console.log(`Factura enviada a ${this.customerEmail} por ${this.totalAmount} ${this.currency}`)
    }
}
```

Fíjate que ahora si el email no es válido `Order` fallará igualmente, por lo que podemos quitar el if que valida la propiedad `customerEmail`.

```typescript
class Order {
    private customerName: string;
    private customerEmail: string;
    private address: string;
    private totalAmount: number;
    private currency: string;

    constructor(
        customerName: string,
        customerEmail: string,
        address: string,
        totalAmount: number,
        currency: string,
    ) {
        this.currency = currency;
        this.totalAmount = totalAmount;
        this.address = address;
        this.customerEmail = customerEmail;
        this.customerName = customerName;
    }

    sendInvoice() {
        const email = Email.valid(this.customerEmail);
        if (this.totalAmount <= 0) {
            throw new Error('El monto debe ser mayor que cero')
        }
        console.log(`Factura enviada a ${this.customerEmail} por ${this.totalAmount} ${this.currency}`)
    }
}
```

Y, de hecho, podemos pasar a usar `email` en su lugar:

```typescript
class Order {
    private customerName: string;
    private customerEmail: string;
    private address: string;
    private totalAmount: number;
    private currency: string;

    constructor(
        customerName: string,
        customerEmail: string,
        address: string,
        totalAmount: number,
        currency: string,
    ) {
        this.currency = currency;
        this.totalAmount = totalAmount;
        this.address = address;
        this.customerEmail = customerEmail;
        this.customerName = customerName;
    }

    sendInvoice() {
        const email = Email.valid(this.customerEmail);
        if (this.totalAmount <= 0) {
            throw new Error('El monto debe ser mayor que cero')
        }
        console.log(`Factura enviada a ${email.toString()} por ${this.totalAmount} ${this.currency}`)
    }
}
```

Una pregunta que te puedes estar haciendo ahora es por qué no estamos construyendo `Order` con una propiedad `customerEmail` de tipo `Email`, ya sea pasándosela directamente, ya sea intanciándola en construcción. Por ejemplo, así:

```typescript
class Order {
    private customerName: string;
    private customerEmail: string;
    private address: string;
    private totalAmount: number;
    private currency: string;
    private email: Email;

    constructor(
        customerName: string,
        customerEmail: string,
        address: string,
        totalAmount: number,
        currency: string,
    ) {
        this.currency = currency;
        this.totalAmount = totalAmount;
        this.address = address;
        this.customerEmail = customerEmail;
        this.customerName = customerName;
        this.email = Email.valid(customerEmail);
    }

    sendInvoice() {
        // Code removed for clarity
    }
}
```

Bien, la principal razón es que ahora la construcción de `Order` puede fallar cuando antes no lo hacía, cambiando el comportamiento esperado del constructor. Esto puede ser importante si tenemos que mantener compatibilidad con muchos usos existentes de la clase que contaban con un constructor que no hace validaciones y, por tanto, no esperan que falle y no toman tienen medidas protectoras.

#### Amount y Currency

`Amount` y `Currency` son dos conceptos que representan un valor monetario, aunque no exactamente de un `Money`. `Money` representa cualquier cantidad de dinero en una unidad monetaria dada, pero en nuestro ejemplo, `Amount` no puede ser cero ni negativo. Podríamos pensar en un `InvoiceAmount`, compuesto de `Amount` y `Currency` en su lugar, cada uno de ellos con su propio Value Object.

```typescript
class Amount {
    private readonly amount: number;

    private constructor(amount: number) {
        this.amount = amount;
    }

    static valid(amount: number): Amount {
        if (amount <= 0) {
            throw new Error('El monto debe ser mayor que cero')
        }

        return new Amount(amount);
    }

    format(currency: Currency) {
        return currency.format(this.amount)
    }
}

class Currency {
    private readonly currency: string

    private constructor(currency: string) {
        this.currency = currency;
    }

    static valid(currency: string): Currency {
        if (!['USD', 'EUR', 'GBP'].includes(currency)) {
            throw new Error('Currency not supported')
        }
        if (currency.length !== 3) {
            throw new Error('Currency must be 3 characters long')
        }
        return new Currency(currency.toUpperCase());
    }

    format(amount: number): string {
        return `${amount} ${this.currency}`
    }
}
```

Fíjate como aplicamos un patrón de _Double Dispatch_ para que ninguno de los Value Objects tenga que conocer las propiedades del otro.

El Value Object compuesto:

```typescript
class InvoiceAmount {
    private readonly amount: Amount;
    private readonly currency: Currency;

    private constructor(amount: Amount, currency: Currency) {
        this.amount = amount
        this.currency = currency
    }

    static valid(amount: number, currency: string): InvoiceAmount {
        return new InvoiceAmount(Amount.valid(amount), Currency.valid(currency))
    }

    toString(): string {
        return this.amount.format(this.currency)
    }
}
```

Ahora podemos usarlo en la clase Order:

```typescript
class Order {
    private customerName: string;
    private customerEmail: string;
    private address: string;
    private totalAmount: number;
    private currency: string;
    private email: Email;

    constructor(
        customerName: string,
        customerEmail: string,
        address: string,
        totalAmount: number,
        currency: string,
    ) {
        this.currency = currency;
        this.totalAmount = totalAmount;
        this.address = address;
        this.customerEmail = customerEmail;
        this.customerName = customerName;
        this.email = Email.valid(customerEmail);
    }

    sendInvoice() {
        const email = Email.valid(this.customerEmail);
        const invoiceAmount = InvoiceAmount.valid(this.totalAmount, this.currency);

        console.log(`Factura enviada a ${email.toString()} por ${invoiceAmount.toString()}`)
    }
}
```

Ahora que hemos refactorizado la forma en que se representa Currency podemos pensar en como dar soporte a distintas monedas y sus formatos. Podemos aplicar herencia y hacer de `valid` método factoría.

```typescript
abstract class Currency {
    static valid(currency: string): Currency {
        if (currency === 'EUR') {
            return new Euro()
        }
        if (currency === 'GBP') {
            return new Gbp()
        }
        if (currency === 'USD') {
            return new Usd()
        }
        throw new Error('Currency not supported')
    }

    abstract format(amount: number): string
}

class Euro extends Currency {
    format(amount: number): string {
        return `${amount} €`
    }
}

class Gbp extends Currency {
    format(amount: number): string {
        return `£${amount}`
    }
}

class Usd extends Currency {
    format(amount: number): string {
        return `$${amount}`
    }
}
```

También podemos refactorizar un poco más hasta llegar a esta versión más extensible:

```typescript
abstract class Currency {
    static valid(currency: string): Currency {
        // Registry of supported currencies using a map for easy extensibility
        const registry = new Map<string, () => Currency>([
            ['EUR', () => new Euro()],
            ['GBP', () => new Gbp()],
            ['USD', () => new Usd()],
        ])

        const factory = registry.get(currency)
        if (!factory) {
            throw new Error('Currency not supported')
        }
        return factory()
    }

    abstract format(amount: number): string
}

class Euro extends Currency {
    format(amount: number): string {
        return `${amount} €`
    }
}

class Gbp extends Currency {
    format(amount: number): string {
        return `£${amount}`
    }
}

class Usd extends Currency {
    format(amount: number): string {
        return `$${amount}`
    }
}
```

Obviamente, podríamos añadir un método para usar el símbolo ISO 4217 de la moneda, etc.

#### Address

Como ya hemos visto al hablar de [Data Clump](/data-clump/) modelar direcciones con un Value Object es una buena idea, ya que nos permite gestionar cada elemento de la misma de forma independiente, lo que nos habilita para introducir fácilmente distintos formatos dependiendo de países, etc. En el artículo enlazado se proponía una posible solución para este caso concreto.

Una cuestión que podemos añadir aquí como ejercicio es la de como usar una dirección que ya tenemos en un string y convertirla en un _Value Object compuesto_. Básicamente, tendríamos que introducir un parser capaz de descomponer el string en los elementos que necesitamos. Creo que esto se escapa un poco del objetivo del artículo por lo que voy a poner una idea muy simple que puede servir como ilustración de la idea.

En cualquier caso, al movernos a _Value Object_ podríamos encapsular esas transformaciones en el código del objeto.

```typescript
class Address {
    private readonly street: string;
    private readonly city: string;
    private readonly zip: string;
    private readonly country: string;

    private constructor(street: string, city: string, zip: string, country: string) {
        this.street = street;
        this.city = city;
        this.zip = zip;
        this.country = country;
    }

    static parse(address: string): Address {
        const parts = address.split(', ');
        if (parts.length !== 4) {
            throw new Error('Invalid address format. Expected: street, city, zip, country');
        }
        const [street, city, zip, country] = parts;
        if (!street || !city || !zip || !country) {
            throw new Error('All address components are required');
        }
        return new Address(street, city, zip, country);
    }
}
```

Adicionalmente, la también podríamos extender `Address` para dar soporte a distintos tipos de direcciones según el país.

#### CustomerName

Para acabar, podemos introducir un Value Object para representar el nombre del cliente. Por lo general, los nombres de cliente suelen ser conceptos compuestos de, al menos, nombre y apellido, con algunas variaciones dependiendo del país de origen.

Aparte de eso, un nombre de cliente nunca debería estar vacío. De nuevo tenemos una propiedad que un string nunca puede cumplir, ya que un string vacío es perfectamente aceptable. Es justamente este tipo de cuestiones por las que deberíamos dejar de usar tipos primitivos para representar conceptos que requieran una mínima validación para poder ser consistentes con las reglas de negocio.

```typescript
class CustomerName {
    private readonly name: string
    private constructor(name: string) {
        this.name = name;
    }
    static valid(name: string): CustomerName {
        if (!name) {
            throw new Error('Customer name cannot be empty')
        }
        return new CustomerName(name)
    }
}
```

## Conclusiones

_Primitive Obsession_ es un _code smell_ muy común en el que es muy fácil caer. Tiene un refactor característico que es _Introduce Value Object_.

El problema de usar tipos primitivos es que no pueden representar por sí solos los conceptos de dominio que necesitamos. Incluso, en el caso más simple, como podría ser que una cadena de caracteres no puede estar vacía. Los tipos primitivos son completamente genéricos y aunque podemos usarlos para almacenar las propiedades de los conceptos, necesitamos encapsularlos en objetos para poder aplicar reglas de negocio.