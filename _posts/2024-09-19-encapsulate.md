---
layout: post
title: Encapsular primitivos y colecciones
categories: articles
tags: software-design pulpoCon
---

Los tipos nativos y estructuras de datos ofrecidos por los lenguajes suelen ser insuficientes para modelar los conceptos que nos interesan. Pero además, puesto que tratan de ser genéricos suelen ofrecernos más de lo que necesitamos.

## Conceptos simples

Consideremos, por ejemplo, el Email. Lo podríamos modelar con un tipo _String_. En muchos lenguajes, los objetos _String_ exponen una gran variedad de métodos para manipularlos. Pero en el caso de un email, posiblemente solo nos interesaría tener algún método para extraer su dominio, quizá el nombre de usuario... y poco más.

```typescript
const email = 'fran@example.com';

const parts = email.split('@');

const user = parts[0];
const domain = parts[1];
```

De hecho, sería prudente no permitir que se puedan usar más métodos para manipular el email, que es un dato que queremos mantener íntegro desde que lo validamos al entrar en el sistema.

Por otro lado, validar que el email al menos tiene la estructura correcta también requiere de un cierto esfuerzo. Por ejemplo, añadir una función de validación:

```typescript
function validateEmail(email: string) {
  const result = email
    .toLowerCase()
    .match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
    );
  if (result == null) {
    throw new Error('Invalid email');
  }
}
```

Y usarla siempre que vayamos a usar alguna variable que pueda ser un email. Pero hay que acordarse:

```typescript
const email = 'fran@example.com';

validateEmail(email);

const parts = email.split('@');

const user = parts[0];
const domain = parts[1];
```

Por eso, no es buena idea modelar un email, o cualquier otro concepto simple, mediante un objeto de tipo String. Pero tampoco es buena idea extender el tipo String mediante herencia para crear el tipo o clase Email. 

```typescript
class EmailString extends String {
  domain(): string {
    return this.split('@')[1];
  }

  user(): string {
    return this.split('@')[0];
  }
}
```

Podemos añadir una validación, por supuesto. Y como se fuerza cada vez que creamos una instancia, no necesitamos preocuparnos, ya que si tenemos un objeto `EmailString` sabremos que es un email.

```typescript
class EmailString extends String {
  constructor(email: string) {
    const result = email
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
      );
    if (result == null) {
      throw new Error('Invalid email');
    }
    super(email);
  }
  domain(): string {
    return this.split('@')[1];
  }

  user(): string {
    return this.split('@')[0];
  }
}
```

Sobre la validación en constructores hay debate, pero no vamos a entrar en ello ahora.

El problema que tenemos es que este diseño nos hace arrastrar todos los métodos de String en Email, que es justo lo que queremos evitar. Por no decir que nos vincula con absolutamente todos los demás tipos derivados, violando el principio de sustitución de Liskov. Ahí es nada. En este ejemplo parece bastante inofensivo, pero... ¿Para qué demonios querríamos saber la longitud en caracteres de un email fuera de lo que son cuestiones de presentación? Los métodos de String son utilidades generales para cualquier string, pero un Email no necesita esos comportamientos.

```typescript
email = new EmailString('fran@example.com');

const domain = email.domain();
const user = email.user();

const lenght = email.length;
```

La alternativa que nos queda es definir el tipo Email por composición. La propiedad que contiene su valor puede ser perfectamente de tipo String. Pero, al ser privada, sus métodos no son expuestos por Email, que ofrecerá una interfaz específica con todas las acciones que nuestro dominio requiera.

```typescript
class Email {
    private email: string;

    constructor(email: string) {
        this.email = email;
    }

    domain(): string {
        return this.email.split('@')[1];
    }

    user(): string {
        return this.email.split('@')[0];
    }
}
```

Podemos implementar validación:

```typescript
class Email {
  private email: string;

  constructor(email: string) {
    const result = email
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
      );
    if (result == null) {
      throw new Error('Invalid email');
    }
    this.email = email;
  }

  domain(): string {
    return this.email.split('@')[1];
  }

  user(): string {
    return this.email.split('@')[0];
  }
}
```

Otro beneficio es que de este modo tenemos manos libres para implementar Email como nos venga mejor, sin que el resto del código tenga que enterarse. Así, si una actualización del lenguaje nos proporciona una forma mejor, podemos utilizarla sin afectar al conjunto de la aplicación. También podemos refactorizar a un mejor diseño. Por ejemplo, extraigamos la validación a una función privada para mayor claridad:

```typescript
class Email {
  private email: string;

  constructor(email: string) {
    this.assertIsEmail(email);
    this.email = email;
  }

  domain(): string {
    return this.email.split('@')[1];
  }

  user(): string {
    return this.email.split('@')[0];
  }

  private assertIsEmail(email: string) {
    const result = email
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
      );
    if (result == null) {
      throw new Error('Invalid email');
    }
  }
}
```

## Conceptos complejos

Aquí incluimos cualquier concepto que requiera dos o más datos simples. Como normalmente no existen tipos primitivos para estos conceptos, usamos Structs o Clases para modelarlos. Lo bueno es que este tipo de objetos no pueden extenderse de otros.

```typescript
class FullName {
    private name: string;
    private surname: string;

    constructor(name: string, surname: string) {
        this.name = name;
        this.surname = surname;
    }
}
```

Aplicaríamos los mismos principios. La clase que definimos solo expone aquellos métodos que tengan relevancia para el dominio y se ocupa de mantener la necesaria consistencia e integridad de su estado.

Pero, ojo: no hay que crear abstracciones solo porque podemos y queremos _aprovechar_ funcionalidad en la clase madre. Algo como:

```typescript
abstract class FullName {
    private name: string;
    private surname: string;

    constructor(name: string, surname: string) {
        this.name = name;
        this.surname = surname;
    }
}

class CompanyName extends FullName {
    
} 
```

`CompanyName` no puede extender de `FullName` porque no constituye una especialización. Y además, se le obliga a arrastrar cosas de `FullName` que no requiere.

El razonamiento de base en este tipo de jerarquías es que ambos serían nombres y, salvo la construcción, posiblemente necesiten el mismo tipo de funcionalidades. Pero la abstracción en este caso es incorrecta. Si históricamente `FullName` hubiese sido introducido antes que `CompanyName` lo suyo sería extraer una abstracción. Por ejemplo, una interfaz:

```typescript
interface EntityName {
    full(): string;
    list(): string;
}
```
Y cada una de las clases la implementaría a su modo particular:

```typescript
class FullName implements EntityName{
    private name: string;
    private surname: string;

    constructor(name: string, surname: string) {
        this.name = name;
        this.surname = surname;
    }

    full(): string {
        return this.name + ' ' + this.surname;
    }

    list(): string {
        return this.surname + ' ' + this.name;
    }
}
```

```typescript
class CompanyName implements EntityName{
    private name: string;

    constructor(name: string) {
        this.name = name;
    }

    full(): string {
        return this.name;
    }

    list(): string {
        return this.name;
    }
}
```

## Colecciones

Esto nos lleva a las colecciones. Tanto si se trata de colecciones de conceptos, resultado de una selección, como un concepto que sea una colección por su propia naturaleza, como podrían ser los conceptos de una factura.

Los lenguajes suelen ofrecer algunas estructuras nativas para dar soporte a colecciones de datos, desde simples arrays a diccionarios, pilas o colas.

Pero, de nuevo, como estructuras genéricas que son nos proporcionan toda una retahíla de métodos que pueden no tener sentido en el dominio. `listOfEmails` expone todos los métodos característicos de un _array_.

```typescript
const listOfEmails = [
  new EmailString('pepa@example.com'),
  new EmailString('fran@example.com'),
  new EmailString('pulpo@example.com'),
];
```

Como ya hemos visto, el problema es que eso permite manipular la colección de formas que seguramente no tienen sentido en el dominio. Podría ser un grupo de emails autorizados que debe recibir ciertas notificaciones, o que están autorizados a realizar ciertas operaciones, etc. Probablemente, no nos interesa que se pueda manipular. En cambio, a lo mejor sí necesitamos verificar que la lista incluye un cierto email.

La opción más adecuada es definir objetos Colección que no extiendan de una estructura de datos nativa, o de un tipo de Colección abstracto que hayas definido, sino que la usen por composición. Internamente, los implementas con la estructura de datos que más te convenga, pero el código que los consume no lo sabe.

```typescript
const notifyTo = new MembersToNotify(['pepa@example.com', 'fran@example.com', 'pulpo@example.com']);

if (notifyTo.includes('pulpo@example.com')) {
    console.log('User must be notified');
}
```

```typescript
const notifyTo = new MembersToNotify(['pepa@example.com', 'fran@example.com', 'pulpo@example.com']);

if (notifyTo.includes('pulpo@example.com')) {
    console.log('User must be notified');
}
```

La implementación interna nos da igual, puede ser un array u otro tipo de estructura.

Estas colecciones deberán exponer aquellos métodos que tengan sentido en el dominio o contexto en que se usan. Así, por ejemplo, un objeto LineasDeFactura podría darnos métodos para calcular totales, desglose de impuestos. Si existe una regla de negocio que impida modificar una factura emitida, no tendría que exponer métodos para añadir, borrar, modificar líneas. Y, en caso de que sí, podríamos hacer uso de inmutabilidad.

```typescript
class InvoiceLines {
    private lines: InvoiceLine[];
    
    totalAmount(): float {}
    totalTaxes(): float {}
    totalAmountBeforeTaxes() float {}
}
```

Sandi Metz llega a recomendar que si usamos una estructura de datos dentro de una clase, nunca accedamos a ella directamente, sino que proporcionemos métodos privados para obtener datos o comportamientos. Se trata de que la propia clase sea ignorante de la implementación.

```typescript
class InvoiceLines {
    private lines: InvoiceLine[];

    private getLine(pos: integer): InvoiceLine {
        return this.lines[pos];
    }
}
```

Como señalamos más arriba, este enfoque te permite modificar la implementación a placer sin que el resto del código se resienta, a la vez que proteges la integridad del estado interno de la colección. Todo ello, ayuda a reducir riesgos y costes de desarrollo.

## DTO y otras hierbas

Los Data Transfer Objects son harina de otro costal. Aunque los modelemos con objetos, no representan conceptos ni tienen comportamiento. Definirlos mediante Structs o clases con campos públicos de solo lectura es una solución perfectamente válida, pues nos proporcionan algunas propiedades deseables.

Como recomendación general, también diría que los datos que porten deberían ser primitivos simples. Lo único que le pedimos a los DTO es llevar datos de un lugar a otro sin alterarlos y haciendo que sea lo más fácil posible utilizarlos. La validez y consistencia de esos datos depende de los objetos que los generen o de aquellos que los consuman. Y los DTO no tienen que mantener ninguna consistencia interna.

_Una versión reducida de este artículo se publicó en la revista de la PulpoCon24._
