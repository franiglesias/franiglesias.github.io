---
layout: post
title: Data Clump
series: code-smells
categories: articles
tags: code-smells refactoring typescript
---

Aprovechando material que he preparado para un curso de Refactoring, voy a empezar una serie de artículos sobre code smells. El primero que vamos a tratar es el Data Clump.

## Definición

**Data Clump** (Grupo de Datos o Pegote de datos), es un code smells que se caracteriza porque el mismo grupo de campos de datos viaja junto por muchos lugares, lo que sugiere la necesidad de un Value Object y duplicación.

Esos campos que viajan siempre juntos pueden requerir validaciones, formateos, etc., y tendremos que repetirlos en muchos lugares. El problema de esto es la posibilidad de introducir inconsistencias o errores, además de la dificultad de mantenerlos.

Data Clump está relacionado con _Primitive Obsession_, o sea, el code smell consistente en representar conceptos con primitivos del lenguaje. En este caso, se trataría de conceptos que requieren combinar varios campos.

## Ejemplo

En esta serie haremos un ejercicio por cada _code smell_. Primero, mostraremos un ejemplo de código ilustrando el _smell_. Luego, propondremos un ejercicio que pondrá de relieve cómo el _code smell_, incrementa el coste del cambio de ese código.

Para **data clump** vamos a usar el siguiente ejemplo. Tenemos las clases Invoice y Shipping Label, las cuales utilizan básicamente los mismos campos de datos para representar a un cliente y su dirección postal, aunque su uso es un poco diferente en cada caso.

```typescript
export class Invoice {
  private readonly customerName: string;
  private readonly customerCity: string;
  private readonly customerStreet: string;
  private readonly customerZip: string;

  constructor(
    customerName: string,
    customerStreet: string,
    customerCity: string,
    customerZip: string,
  ) {
    this.customerZip = customerZip;
    this.customerStreet = customerStreet;
    this.customerCity = customerCity;
    this.customerName = customerName;
  }

  print(): string {
    return `Factura para: ${this.customerName}\n` +
      `Dirección: ${this.customerStreet}, ${this.customerCity}, ${this.customerZip}`
  }
}

export class ShippingLabel {
  private readonly customerName: string;
  private readonly customerStreet: string;
  private readonly customerCity: string;
  private readonly customerZip: string;

  constructor(
    customerName: string,
    customerStreet: string,
    customerCity: string,
    customerZip: string,
  ) {
    this.customerZip = customerZip;
    this.customerCity = customerCity;
    this.customerStreet = customerStreet;
    this.customerName = customerName;
  }

  print(): string {
    return `Enviar a: ${this.customerName}\n` + `${this.customerStreet}, ${this.customerCity}, ${this.customerZip}`
  }
}
```

Este código funciona bien. Los code smells no son _bugs_. Pero, como veremos a continuación, pueden abrir puertas a generar bugs en el futuro.

## Ejercicio

Queremos añadir país y provincia/estado y reglas de formateo internacional de la dirección.

## Problemas que encontrarás

Para resolver el ejercicio, necesitarás modificar constructores, impresores y cualquier lugar que pase estos campos juntos, multiplicando la superficie de cambio. Básicamente, necesitas duplicar toda la lógica y cambios que llegues a introducir, con el riesgo de dejar alguna inconsistencia.

## Testing y Solución

Vamos a introducir tests para caracterizar el comportamiento actual de las clases. Una vez hecho, tendremos que modificarlos para introducir los nuevos requisitos. Haremos algo muy sencillo.

```typescript
import { describe, expect, it } from 'vitest'
import { Invoice, ShippingLabel } from './data-clump'

describe('Data Clump Example', () => {
  it('should generate an Invoice', () => {
    const invoice = new Invoice('Jane Doe', '15, Foo Street', 'ToonTown', '12345')
    const expected = `Factura para: Jane Doe\nDirección: 15, Foo Street, ToonTown, 12345`

    expect(invoice.print()).toEqual(expected)
  })

  it('should generate a Shipping Label', () => {
    const invoice = new ShippingLabel('Jane Doe', '15, Foo Street', 'ToonTown', '12345')
    const expected = `Enviar a: Jane Doe\n15, Foo Street, ToonTown, 12345`

    expect(invoice.print()).toEqual(expected)
  })
})
```

El primer cambio es introducir información de provincia (o estado) y país. Por lo tanto, modificaremos el test para utilizar los nuevos campos.

```typescript
describe('Data Clump Example With New Fields', () => {
    it('should generate an Invoice', () => {
        const invoice = new Invoice(
            'Jane Doe',
            '15, Foo Street',
            'ToonTown',
            '12345',
            'CA',
            'US'
        )
        const expected = `Factura para: Jane Doe\nDirección: 15, Foo Street, ToonTown, 12345, CA, US`

        expect(invoice.print()).toEqual(expected)
    })

    it('should generate a Shipping Label', () => {
        const invoice = new ShippingLabel(
            'Jane Doe',
            '15, Foo Street',
            'ToonTown',
            '12345',
            'CA',
            'US'
        )
        const expected = `Enviar a: Jane Doe\n15, Foo Street, ToonTown, 12345, CA, US`

        expect(invoice.print()).toEqual(expected)
    })
})
```

Como se puede apreciar en el nuevo test, hay que hacer un cambio en la firma del constructor de ambas clases, además del cambio del método `print`.

### Sin resolver el Data Clump

Si no resuelves el Data Clump, tendrás que hacer más o menos los mismos cambios en ambas clases. En este caso, sería algo así para dar soporte a los nuevos campos.

```typescript
export class Invoice {
    private readonly customerName: string
    private readonly customerCity: string
    private readonly customerStreet: string
    private readonly customerZip: string
    private readonly customerState: string
    private readonly customerCountry: string

    constructor(
        customerName: string,
        customerStreet: string,
        customerCity: string,
        customerZip: string,
        customerState: string,
        customerCountry: string,
    ) {
        this.customerZip = customerZip
        this.customerStreet = customerStreet
        this.customerCity = customerCity
        this.customerName = customerName
        this.customerState = customerState
        this.customerCountry = customerCountry
    }

    print(): string {
        return (
            `Factura para: ${this.customerName}\n` +
            `Dirección: ${this.customerStreet}, ${this.customerCity}, ${this.customerZip}, ${this.customerState}, ${this.customerCountry}`
        )
    }
}
```

```typescript
export class ShippingLabel {
    private readonly customerName: string
    private readonly customerStreet: string
    private readonly customerCity: string
    private readonly customerZip: string
    private readonly customerState: string
    private readonly customerCountry: string

    constructor(
        customerName: string,
        customerStreet: string,
        customerCity: string,
        customerZip: string,
        customerState: string,
        customerCountry: string,
    ) {
        this.customerZip = customerZip
        this.customerCity = customerCity
        this.customerStreet = customerStreet
        this.customerName = customerName
        this.customerState = customerState
        this.customerCountry = customerCountry
    }

    print(): string {
        return (
            `Enviar a: ${this.customerName}\n` +
            `${this.customerStreet}, ${this.customerCity}, ${this.customerZip}, ${this.customerState}, ${this.customerCountry}`
        )
    }
}
```

Pero es que además, tenemos que permitir que los formatos de la dirección se adapten a los diferentes países. Definámoslo con un test. Solo pongo el test para Invoice, pero para Shipping Label serían más o menos los mismos.

```typescript
describe('Data Clump Example With International Support', () => {
    it('should generate an Invoice for US', () => {
        const invoice = new Invoice(
            'Jane Doe',
            '15, Foo Street',
            'ToonTown',
            '12345',
            'CA',
            'US'
        )
        const expected = `Factura para: Jane Doe\nDirección: 15, Foo Street\nToonTown, CA 12345\nUSA`

        expect(invoice.print()).toEqual(expected)
    })

    it('should generate an Invoice for ES', () => {
        const invoice = new Invoice(
            'Pepa Pérez',
            'Calle Principal, 15',
            'Vetusta',
            '12345',
            'Asturias',
            'ES'
        )
        const expected = `Factura para: Pepa Pérez\nDirección: Calle Principal, 15\n12345 Vetusta (Asturias)\nEspaña`

        expect(invoice.print()).toEqual(expected)
    })
})
```

Para Invoice, el código podría quedar inicialmente así:

```typescript
export class Invoice {
    private readonly customerName: string
    private readonly customerCity: string
    private readonly customerStreet: string
    private readonly customerZip: string
    private readonly customerState: string
    private readonly customerCountry: string

    constructor(
        customerName: string,
        customerStreet: string,
        customerCity: string,
        customerZip: string,
        customerState: string,
        customerCountry: string,
    ) {
        this.customerZip = customerZip
        this.customerStreet = customerStreet
        this.customerCity = customerCity
        this.customerName = customerName
        this.customerState = customerState
        this.customerCountry = customerCountry
    }

    print(): string {
        if (this.customerCountry === 'ES') {
            return (
                `Factura para: ${this.customerName}\n` +
                `Dirección: ${this.customerStreet}\n${this.customerZip} ${this.customerCity} (${this.customerState})\nEspaña`
            );
        }
        if (this.customerCountry === 'US') {
            return(
                `Factura para: ${this.customerName}\n` +
                `Dirección: ${this.customerStreet}\n${this.customerCity}, ${this.customerState} ${this.customerZip}\nUSA`)
        }
        return (
            `Factura para: ${this.customerName}\n` +
            `Dirección: ${this.customerStreet}, ${this.customerCity}, ${this.customerZip}, ${this.customerState}, ${this.customerCountry}`
        );
    }
}
```

Y tendríamos que hacer algo similar para Shipping Label o en cualquier otro lugar en el que se utilice el mismo conjunto de campos para representar la dirección.

### Resolviendo el Data Clump

Para resolver el ejercicio necesitamos solucionar primero el Data Clump. Recuerda: primero haz que el cambio sea fácil (lo que puede ser difícil), y luego haz el cambio fácil. Así que volvemos a la situación inicial.

```typescript
export class Invoice {
  private readonly customerName: string;
  private readonly customerCity: string;
  private readonly customerStreet: string;
  private readonly customerZip: string;

  constructor(
    customerName: string,
    customerStreet: string,
    customerCity: string,
    customerZip: string,
  ) {
    this.customerZip = customerZip;
    this.customerStreet = customerStreet;
    this.customerCity = customerCity;
    this.customerName = customerName;
  }

  print(): string {
    return `Factura para: ${this.customerName}\n` +
      `Dirección: ${this.customerStreet}, ${this.customerCity}, ${this.customerZip}`
  }
}

export class ShippingLabel {
  private readonly customerName: string;
  private readonly customerStreet: string;
  private readonly customerCity: string;
  private readonly customerZip: string;

  constructor(
    customerName: string,
    customerStreet: string,
    customerCity: string,
    customerZip: string,
  ) {
    this.customerZip = customerZip;
    this.customerCity = customerCity;
    this.customerStreet = customerStreet;
    this.customerName = customerName;
  }

  print(): string {
    return `Enviar a: ${this.customerName}\n` + `${this.customerStreet}, ${this.customerCity}, ${this.customerZip}`
  }
}
```

#### Introducir Value Object

En nuestro caso, lo primero es introducir un **Value Object**. Para nuestro ejercicio, y sin más contexto, el value object podría estar compuesto por todos los campos originales. Estos cuatro campos se refieren a dos conceptos diferentes: el nombre del cliente y la dirección. Dependiendo del contexto concreto podríamos mantenerlos juntos o separarlos. Para el ejemplo, agruparé solo los campos de dirección porque pienso que podría necesitar separar los conceptos de cliente y dirección.

```typescript
export class Address {
    private readonly street: string
    private readonly city: string
    private readonly zip: string


    constructor(street: string, city: string, zip: string) {
        this.street = street;
        this.city = city;
        this.zip = zip;
    }
}
```

Los value objects deberían atraer comportamiento, por lo que sería lógico que Address tuviese un método `print` para representarse.

```typescript
export class Address {
    private readonly street: string
    private readonly city: string
    private readonly zip: string


    constructor(street: string, city: string, zip: string) {
        this.street = street;
        this.city = city;
        this.zip = zip;
    }

    print(): string {
        return `${this.street}, ${this.city}, ${this.zip}`
    }
}
```

Básicamente, implementamos `print` con el comportamiento que queremos. Fíjate que no añado el prefijo "Dirección" porque quiero que sean los consumidores de `Address` quienes lo hagan en la medida en que lo necesiten.

Ahora, podemos modificar las clases para que utilicen `Address` en lugar de los campos originales. En lenguajes con sobrecarga es bastante fácil introducir un constructor alternativo que tome un `Address`, pero en Typescript lo haremos con un campo opcional para introducir el cambio de forma paralela. Este cambio permite que el primer test siga pasando, mientras que el comportamiento de `print` es delegado en `Address`.

```typescript
export class Invoice {
    private readonly customerName: string;
    private readonly customerCity: string;
    private readonly customerStreet: string;
    private readonly customerZip: string;
    private readonly address: Address;

    constructor(
        customerName: string,
        customerStreet: string,
        customerCity: string,
        customerZip: string,
        address?: Address | undefined,
    ) {
        this.customerZip = customerZip;
        this.customerStreet = customerStreet;
        this.customerCity = customerCity;
        this.customerName = customerName;
        if (!address) {
            this.address = new Address(customerStreet, customerCity, customerZip);
        } else {
            this.address = address;
        }
    }

    print(): string {
        return `Factura para: ${this.customerName}\n` +
            `Dirección: ${this.address.print()}`
    }
}
```

Una vez verificado que el test pasa y que estamos pasando `Address` en todos los casos en que instanciamos `Invoice`, podemos hacer el cambio completo y aplicar el mismo a `ShippingLabel`. Quedará así:

```typescript
describe('Data Clump Example', () => {
    it('should generate an Invoice', () => {
        const invoice = new Invoice(
            'Jane Doe',
            new Address('15, Foo Street', 'ToonTown', '12345')
        )
        const expected = `Factura para: Jane Doe\nDirección: 15, Foo Street, ToonTown, 12345`

        expect(invoice.print()).toEqual(expected)
    })

    it('should generate a Shipping Label', () => {
        const invoice = new ShippingLabel(
            'Jane Doe',
            new Address('15, Foo Street', 'ToonTown', '12345')
        )
        const expected = `Enviar a: Jane Doe\n15, Foo Street, ToonTown, 12345`

        expect(invoice.print()).toEqual(expected)
    })
})
```

```typescript
export class Invoice {
    private readonly customerName: string;
    private readonly address: Address;

    constructor(
        customerName: string,
        address: Address,
    ) {
        this.customerName = customerName;
        this.address = address;

    }

    print(): string {
        return `Factura para: ${this.customerName}\n` +
            `Dirección: ${this.address.print()}`
    }
}
```

```typescript
export class ShippingLabel {
    private readonly customerName: string;
    private readonly address: Address;

    constructor(
        customerName: string,
        address: Address,
    ) {
        this.customerName = customerName;
        this.address = address;
    }

    print(): string {
        return `Enviar a: ${this.customerName}\n` + `${this.address.print()}`
    }
}
```

```typescript
export class Address {
    private readonly street: string
    private readonly city: string
    private readonly zip: string


    constructor(street: string, city: string, zip: string) {
        this.street = street;
        this.city = city;
        this.zip = zip;
    }

    print(): string {
        return `${this.street}, ${this.city}, ${this.zip}`
    }
}
```

Ahora ya no tenemos el Data Clump. En su lugar disponemos de un Value Object `Address` que encapsula ese concepto.

Veamos ahora la primera modificación que se nos pide: introducir provincia y país. He aquí el test modificado:

```typescript
describe('Data Clump Example With New Fields', () => {
    it('should generate an Invoice', () => {
        const invoice = new Invoice(
            'Jane Doe',
            new Address(
                '15, Foo Street',
                'ToonTown',
                '12345',
                'CA',
                'US'
            )
        )
        const expected = `Factura para: Jane Doe\nDirección: 15, Foo Street, ToonTown, 12345, CA, US`

        expect(invoice.print()).toEqual(expected)
    })

    it('should generate a Shipping Label', () => {
        const invoice = new ShippingLabel(
            'Jane Doe',
            new Address(
                '15, Foo Street',
                'ToonTown',
                '12345',
                'CA',
                'US'
            )
        )
        const expected = `Enviar a: Jane Doe\n15, Foo Street, ToonTown, 12345, CA, US`

        expect(invoice.print()).toEqual(expected)
    })
})
```

Este es el cambio que tenemos que aplicar:

```typescript
export class Address {
    private readonly street: string
    private readonly city: string
    private readonly zip: string
    private readonly state: string
    private readonly country: string


    constructor(street: string, city: string, zip: string, state: string, country: string) {
        this.street = street;
        this.city = city;
        this.zip = zip;
        this.state = state;
        this.country = country;
    }

    print(): string {
        return `${this.street}, ${this.city}, ${this.zip}, ${this.state}, ${this.country}`
    }
}
```

Es decir, ahora solo tenemos que modificar el Value Object `Address` para que incluya los campos nuevos y modificar la forma en que `print` representa la dirección. De hecho, podríamos haber introducido una clase nueva y no modificar `Address`.

A destacar: el cambio solo se produce en la clase `Address` y no en las clases `Invoice` ni `ShippingLabel`, ni ningún otro usuario de `Address`. Es una aplicación del principio DRY (una sola fuente autoritativa de conocimiento).

#### Introducir polimorfismo

Para el segundo requisito, introduciremos polimorfismo en la clase `Address`. Con esto, podremos dar soporte internacional a las direcciones.

El polimorfismo es la posibilidad de enviar el mismo mensaje a objetos de distintos tipos, sin preocuparnos del tipo de objeto. En nuestro caso, queremos que `Address` sea capaz de representar direcciones en diferentes formatos, por lo que haremos subclases especializadas en cada formato. De este modo, todas serán `Address`, pero cada clase (`ESAddress`, `USAddress`...) ejecutará el `print` a su manera especial. Esto nos va a requerir tener también una factoría que nos entregue una instancia de la clase adecuada.

Para empezar, extendemos la visibilidad de las propiedades para que puedan ser accesibles por las clases derivadas. Esto no siempre tiene que ser así, pero en este caso los componentes de la dirección son comunes:

```typescript
export class Address {
    protected readonly street: string
    protected readonly city: string
    protected readonly zip: string
    protected readonly state: string
    protected readonly country: string


    constructor(street: string, city: string, zip: string, state: string, country: string) {
        this.street = street;
        this.city = city;
        this.zip = zip;
        this.state = state;
        this.country = country;
    }

    print(): string {
        return `${this.street}, ${this.city}, ${this.zip}, ${this.state}, ${this.country}`
    }
}
```

Aquí tenemos una clase derivada para España:

```typescript
export class ESAddress extends Address {
    print(): string {
        return `${this.street}\n${this.zip} ${this.city} (${this.state})\nEspaña`
    }
}
```

Y aquí una para USA:

```typescript
export class USAddress extends Address {
    print(): string {
        return `${this.street}\n${this.city}, ${this.state} ${this.zip}\nUSA`
    }
}
```

Como puedes ver, tendríamos que introducir una clase derivada por cada formato de dirección al que queramos dar soporte. Aparte, puede ser adecuado tener un formato por defecto que, en este caso, por simplicidad, nos va a dar `Address`.

Nos hace falta una Factoría. Esto es, un objeto que nos entregue una instancia de la clase Address adecuada a partir del país. Podríamos hacer esto de varias formas.

**Usando un método factoría**: En `Address` podemos añadir un método estático al que pasamos los parámetros y nos devuelve una instancia de la subclase adecuada. Si el país no está soportado, devuelve una instancia de `Address`.

```typescript
export class Address {
    protected readonly street: string
    protected readonly city: string
    protected readonly zip: string
    protected readonly state: string
    protected readonly country: string


    constructor(street: string, city: string, zip: string, state: string, country: string) {
        this.street = street;
        this.city = city;
        this.zip = zip;
        this.state = state;
        this.country = country;
    }

    static create(street: string, city: string, zip: string, state: string, country: string): Address {
        switch (country) {
            case 'ES':
                return new ESAddress(street, city, zip, state, country)
            case 'US':
                return new USAddress(street, city, zip, state, country)
            default:
                return new Address(street, city, zip, state, country)
        }
    }

    print(): string {
        return `${this.street}, ${this.city}, ${this.zip}, ${this.state}, ${this.country}`
    }
}
```

Si bien estos métodos factoría pueden ser una buena solución tienden a dificultar conseguir mantener las clases cerradas a modificación, por lo que una buena opción es introducir un objeto factoría:

```typescript
export class AddressFactory {
    create(street: string, city: string, zip: string, state: string, country: string): Address {
        switch (country) {
            case 'ES':
                return new ESAddress(street, city, zip, state, country)
            case 'US':
                return new USAddress(street, city, zip, state, country)
            default:
                return new Address(street, city, zip, state, country)
        }
    }
}
```

Si me apuras, diría que podríamos combinar los dos patrones en uno, ya que `Address.create()` no deja de ser un _proxy_ a la Factoría, que puede ser más fácil de entender.

```typescript
export class Address {
    protected readonly street: string
    protected readonly city: string
    protected readonly zip: string
    protected readonly state: string
    protected readonly country: string


    constructor(street: string, city: string, zip: string, state: string, country: string) {
        this.street = street;
        this.city = city;
        this.zip = zip;
        this.state = state;
        this.country = country;
    }

    static create(street: string, city: string, zip: string, state: string, country: string): Address {
        return new AddressFactory().create(street, city, zip, state, country)
    }

    print(): string {
        return `${this.street}, ${this.city}, ${this.zip}, ${this.state}, ${this.country}`
    }
}
```

Ahora podemos usar la factoría para instanciar direcciones. En este test, usando tanto la factoría directamente, como a través del método factoría en `Address`.

```typescript
describe('Data Clump Example With International Support', () => {
    it('should generate an Invoice for US', () => {
        const invoice = new Invoice(
            'Jane Doe',
            new AddressFactory().create('15, Foo Street',
                'ToonTown',
                '12345',
                'CA',
                'US')
        )
        const expected = `Factura para: Jane Doe\nDirección: 15, Foo Street\nToonTown, CA 12345\nUSA`

        expect(invoice.print()).toEqual(expected)
    })

    it('should generate an Invoice for ES', () => {
        const invoice = new Invoice(
            'Pepa Pérez',
            Address.create('Calle Principal, 15',
                'Vetusta',
                '12345',
                'Asturias',
                'ES')
        )
        const expected = `Factura para: Pepa Pérez\nDirección: Calle Principal, 15\n12345 Vetusta (Asturias)\nEspaña`

        expect(invoice.print()).toEqual(expected)
    })
})
```

En cualquier caso, el conocimiento para fabricar objetos está en `AddressFactory`.

Es perfectamente posible evolucionar `AddressFactory` para cumplir mejor el principio Abierto/Cerrado, pero es un tema que se aleja del objetivo de este artículo. Sin embargo, en las factorías nos podemos permitir un poco más de flexibilidad.

## Conclusiones

El code smell Data Clump complica innecesariamente el mantenimiento de nuestras aplicaciones al mantener juntos ciertos valores que representan un concepto y obligarnos a repetir el mismo código en varios lugares diferentes, atentando contra el principio DRY.

La solución es introducir Value Objects, que encapsulan los conceptos que representan y sus comportamientos propios, garantizando una única representación autoritativa en el código. Esto facilita el mantenimiento.

Una objeción que puede que tengas es si introducir varias clases nuevas no aumenta la complejidad. Si bien es cierto que introducir varias clases puede hacer parecer que el sistema se vuelve más complejo, lo cierto es que la complejidad disminuye en la medida en las nuevas clases cumplan el principio KISS (Keep it simply stupid).

Veamos un ejemplo sin resolver el data clump. `print` tiene una complejidad ciclomática de 3 y crecería con cada nuevo tipo de dirección a la que tengamos que dar soporte.

```typescript
export class Invoice {
    private readonly customerName: string
    private readonly customerCity: string
    private readonly customerStreet: string
    private readonly customerZip: string
    private readonly customerState: string
    private readonly customerCountry: string

    constructor(
        customerName: string,
        customerStreet: string,
        customerCity: string,
        customerZip: string,
        customerState: string,
        customerCountry: string,
    ) {
        this.customerZip = customerZip
        this.customerStreet = customerStreet
        this.customerCity = customerCity
        this.customerName = customerName
        this.customerState = customerState
        this.customerCountry = customerCountry
    }

    print(): string {
        if (this.customerCountry === 'ES') {
            return (
                `Factura para: ${this.customerName}\n` +
                `Dirección: ${this.customerStreet}\n${this.customerZip} ${this.customerCity} (${this.customerState})\nEspaña`
            );
        }
        if (this.customerCountry === 'US') {
            return(
                `Factura para: ${this.customerName}\n` +
                `Dirección: ${this.customerStreet}\n${this.customerCity}, ${this.customerState} ${this.customerZip}\nUSA`)
        }
        return (
            `Factura para: ${this.customerName}\n` +
            `Dirección: ${this.customerStreet}, ${this.customerCity}, ${this.customerZip}, ${this.customerState}, ${this.customerCountry}`
        );
    }
}
```

Pero usando polimorfismo, la complejidad ciclomática del método `print` se reduce a 1.

```typescript
export class ESAddress extends Address {
    print(): string {
        return `${this.street}\n${this.zip} ${this.city} (${this.state})\nEspaña`
    }
}
```

Se puede argumentar que `AddressFactory` tiene efectivamente una complejidad de 3 y crecería si tenemos que añadir un nuevo tipo:

```typescript
export class AddressFactory {
    create(street: string, city: string, zip: string, state: string, country: string): Address {
        switch (country) {
            case 'ES':
                return new ESAddress(street, city, zip, state, country)
            case 'US':
                return new USAddress(street, city, zip, state, country)
            default:
                return new Address(street, city, zip, state, country)
        }
    }
}
```

Sin embargo, podríamos refactorizarla para que la complejidad disminuya a 1, incluso añadiendo nuevas clases, gracias a user un mapa que nos relaciona el país con la constructora del tipo de dirección adecuado.

```typescript
export class AddressFactory {
    private static readonly addressMap: { [key: string]: new (street: string, city: string, zip: string, state: string, country: string) => Address } = {
        'ES': ESAddress,
        'US': USAddress,
    };

    static create(
        street: string,
        city: string,
        zip: string,
        state: string,
        country: string
    ): Address {
        const AddressClass = this.addressMap[country] || Address;
        return new AddressClass(street, city, zip, state, country);
    }
}
```

Ahora bien, independientemente de usar una u otra factoría, la dificultad de dar soporte a otros formatos de dirección, corregir posibles errores, o introducir nuevos campos, es muy baja con la solución de Value Objects: solo tenemos que añadir una clase nueva y mapearla en la factoría.

Así que, cuando veas que estás manteniendo grupos de datos juntos en distintas partes del código, es muy probable que tengas un _data clump_ y que puedas resolverlo con Value Objects. 