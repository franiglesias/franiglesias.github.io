---
layout: post
title: La guía definitiva de los dobles de test 2
categories: articles
tags: testing tdd typescript
---

Vamos por la segunda parte de este artículo en la que seguimos explicando como usar dobles de test.

En esta ocasión vamos a analizar un caso un poco más complejo de dependencia totalmente acoplada y luego nos centraremos en los dobles que simulan errores.

Aquí tienes el índice del artículo, por si prefieres saltar directamente a alguno de los puntos:

<!-- TOC -->
  * [El caso de la dependencia acoplada](#el-caso-de-la-dependencia-acoplada)
    * [Seams: una solución temporal](#seams-una-solución-temporal)
    * [Inversión de dependencias al rescate](#inversión-de-dependencias-al-rescate)
  * [Dobles de test que simulan fallos](#dobles-de-test-que-simulan-fallos)
    * [Base de datos innacesible](#base-de-datos-innacesible)
  * [Lógica justificada en un doble de test](#lógica-justificada-en-un-doble-de-test)
    * [Valores distintos en cada llamada](#valores-distintos-en-cada-llamada)
    * [Stubs que fallan unas veces y otras no](#stubs-que-fallan-unas-veces-y-otras-no)
    * [Más sobre reintentos](#más-sobre-reintentos)
  * [Conclusiones](#conclusiones)
<!-- TOC -->

Puedes encontrar el [código en este repositorio: birthday-service-kata](https://github.com/franiglesias/birthday-service-kata).

## El caso de la dependencia acoplada

El grado máximo de acoplamiento de un objeto con otro ocurre cuando uno de los objetos tiene que saber instanciar otro, conocimiento que debe añadirse al de saber como usarlo. Es el caso que tenemos aquí, `BirthdayService` está completamente acoplado a `DiscountCodeGenerator`.

```typescript
export class BirthdayService {
    private readonly customerRepository: Customers
    private readonly emailSender: ProductionEmailSender
    private readonly logger: Logger

    constructor(
        customerRepository: Customers,
        emailSender: ProductionEmailSender,
        logger: Logger,
    ) {
        this.customerRepository = customerRepository
        this.emailSender = emailSender
        this.logger = logger
    }

    greetCustomersWithBirthday(today: Date) {
        const customers = this.customerRepository.findWithBirthday(today)
        customers.forEach((customer) => {
            const discountCode = new DiscountCodeGenerator().generate()
            const template =
                'Happy birthday, {name}! Here is your discount code: {discount}'.replace(
                    '{discount}',
                    discountCode.getCode(),
                )
            customer.sendEmail(template, this.emailSender)
            this.logger.log('INFO', customer.fillWithEmail('Email sent to {email}'))
        })
    }
}
```
 
`DiscountCodeGenerator` produce un resultado no determinista. Es decir, no podemos saber con antelación qué nos va a devolver. Eso incrementa la dificultad para hacer un test. Por el momento, la hemos superado usando un test basado en propiedades en el que, en lugar de esperar un resultado concreto, esperamos un resultado que cumple unas características que hemos podido describir con una expresión regular:

```typescript
it('should send a well formed message with the discount code to the right customer', () => {
    const emailSender = new MessageContentSpyEmailSender()
    const service = new BirthdayService(
        new CustomersWithBirthdayToday([
            new Customer('Jane Doe', 'jane@example.com', new Date('2005-02-14')),
        ]),
        emailSender,
        new DummyLogger(),
    )

    service.greetCustomersWithBirthday(new Date())

    expect(emailSender.lastMessageContent()).toMatch(
        /Happy birthday, Jane Doe! Here is your discount code: [A-z0-9]{6}/,
    )
    expect(emailSender.lastMessageRecipient()).toBe('jane@example.com')
})
```

Con esto, hacemos pasar el test y no tenemos necesidad de nada más. Podríamos decir que el test cubre a `DiscountCodeGenerator` y ya sería suficiente. 

Pero este enfoque me parece equivocado por una razón que voy a tratar de explicar, y que se traduce en que tenemos que hacer el test así porque `BirthdayService` está acoplado a este `DiscountCodeGenerator` específico y, por tanto, el test también lo está.

Es más, si `DiscountCodeGenerator` cambiase por el motivo que sea y el código generado tuviese una forma distinta el test fallaría por una razón totalmente ajena a la naturaleza del test. Es cierto que `BirthdayService` es responsable de componer el mensaje, pero claramente no es responsable de generar el código. De hecho, su responsabilidad con respecto al código es únicamente incluirlo en la notificación, tenga la forma que tenga.

En consecuencia, este test es frágil. Va a romper por una razón que no tiene que ver con su intención y está poniendo bajo test algo que no es de su incumbencia.

Pero, además, en el ejercicio no se aprecian otros problemas de una dependencia dura: consumo de tiempo y recursos, complejidad de instanciación, side-effects que pueda acarrear, etc. Imagina el efecto en el test si la ejecución de este componente consumiese varios segundos.

### Seams: una solución temporal

Un abordaje habitual de este tipo de test es introducir un _Seam_ para controlar el comportamiento de la dependencia. Nuestro objetivo es eliminar del test el efecto de la dependencia real (`DiscountCodeGenerator`). Puede ser una buena aproximación inicial para entender mejor qué es lo que pasa en el código y asegurarnos que tenemos controlada la dependencia.

Un _Seam_ es un punto en el que podemos hacer cambios en el código sin afectar al resto de la unidad. En la práctica de nuestro ejercicio se traduce en aislar el uso de la dependencia en un método que luego podamos sobreescribir.

```typescript
export class BirthdayService {
    private readonly customerRepository: Customers
    private readonly emailSender: ProductionEmailSender
    private readonly logger: Logger

    constructor(
        customerRepository: Customers,
        emailSender: ProductionEmailSender,
        logger: Logger,
    ) {
        this.customerRepository = customerRepository
        this.emailSender = emailSender
        this.logger = logger
    }

    greetCustomersWithBirthday(today: Date) {
        const customers = this.customerRepository.findWithBirthday(today)
        customers.forEach((customer) => {
            const discountCode = this.getDiscountCode()
            const template =
                'Happy birthday, {name}! Here is your discount code: {discount}'.replace(
                    '{discount}',
                    discountCode.getCode(),
                )
            customer.sendEmail(template, this.emailSender)
            this.logger.log('INFO', customer.fillWithEmail('Email sent to {email}'))
        })
    }

    protected getDiscountCode(): DiscountCode {
        return new DiscountCodeGenerator().generate()
    }
}
```

En este caso no hay más usos de `DiscountCodeGenerator` por lo que podemos pasar al siguiente paso. Extendemos `BirthdayService` creando una clase derivada `TestableBirthdayService` en la cual sobreescribimos el método `getDiscountCode` de forma que devuelva un valor conocido. Es como hacer un _Stub_.

```typescript
class TestableBirthdayService extends BirthdayService {

    protected getDiscountCode(): DiscountCode {
        return new DiscountCode('FP1BRI');
    }
}
```

Y ahora podemos reemplazarlo en el test y cambiar la aserción. De esta forma, el test me está diciendo que `BirthdayService` inserta el código generado por `getDiscountCode` en la notificación, sin importarle como lo genera.

```typescript
it('should send a well formed message with the discount code to the right customer', () => {
    const emailSender = new MessageContentSpyEmailSender()
    const service = new TestableBirthdayService(
        new CustomersWithBirthdayToday([
            new Customer('Jane Doe', 'jane@example.com', new Date('2005-02-14')),
        ]),
        emailSender,
        new DummyLogger(),
    )

    service.greetCustomersWithBirthday(new Date())

    expect(emailSender.lastMessageContent()).toBe(
        'Happy birthday, Jane Doe! Here is your discount code: FP1BRI',
    )
    expect(emailSender.lastMessageRecipient()).toBe('jane@example.com')
})
```

### Inversión de dependencias al rescate

Por supuesto, el objetivo debería llegar a ser invertir, extraer e inyectar, la dependencia. En nuestro ejemplo esto supone un cierto coste y riesgo porque hay que alterar la signatura del constructor y podríamos tener varios usos del mismo. Afortunadamente, disponemos de varias posibilidades, algunas dependiendo del lenguaje: sobrecarga de constructores, parámetros opcionales, etc.

En el lado positivo, hay que decir que haber optado por empezar con un Seam puede ser una buena idea. Es una forma de unificar los usos de la dependencia de forma inocua, lo que facilita el trabajo a continuación. En realidad, los pasos son bastante sencillos: se trata de promover la dependencia para convertirla en un colaborador e inicializarla en el constructor:

```typescript
export class BirthdayService {
    private readonly customerRepository: Customers
    private readonly emailSender: ProductionEmailSender
    private readonly logger: Logger
    private readonly discountCodeGenerator: DiscountCodeGenerator

    constructor(
        customerRepository: Customers,
        emailSender: ProductionEmailSender,
        logger: Logger,
    ) {
        this.customerRepository = customerRepository
        this.emailSender = emailSender
        this.logger = logger
        this.discountCodeGenerator = new DiscountCodeGenerator()
    }

    greetCustomersWithBirthday(today: Date): void {
        const customers = this.customerRepository.findWithBirthday(today)
        customers.forEach((customer) => {
            const discountCode = this.getDiscountCode()
            const template =
                'Happy birthday, {name}! Here is your discount code: {discount}'.replace(
                    '{discount}',
                    discountCode.getCode(),
                )
            customer.sendEmail(template, this.emailSender)
            this.logger.log('INFO', customer.fillWithEmail('Email sent to {email}'))
        })
    }

    protected getDiscountCode(): DiscountCode {
        return this.discountCodeGenerator.generate()
    }
}
```

Esto no cambia nada en el comportamiento, pero nos pone en una mejor disposición. Es el momento de introducir una interfaz, como abstracción del rol de _generador de códigos_.

```typescript
export interface CodeGenerator {
    generate(): DiscountCode
}
```

Y también de usarla:

```typescript
export class BirthdayService {
    private readonly customerRepository: Customers
    private readonly emailSender: ProductionEmailSender
    private readonly logger: Logger
    private readonly discountCodeGenerator: CodeGenerator

    constructor(
        customerRepository: Customers,
        emailSender: ProductionEmailSender,
        logger: Logger,
    ) {
        this.customerRepository = customerRepository
        this.emailSender = emailSender
        this.logger = logger
        this.discountCodeGenerator = new DiscountCodeGenerator()
    }

    // Removed for clarity
}
```

Ya estamos cerca de inyectarla. En Typescript nos bastaría con hacerlo así:

```typescript
export class BirthdayService {
    private readonly customerRepository: Customers
    private readonly emailSender: ProductionEmailSender
    private readonly logger: Logger
    private readonly discountCodeGenerator: CodeGenerator

    constructor(
        customerRepository: Customers,
        emailSender: ProductionEmailSender,
        logger: Logger,
        discountCodeGenerator: CodeGenerator = undefined
    ) {
        this.customerRepository = customerRepository
        this.emailSender = emailSender
        this.logger = logger
        this.discountCodeGenerator = discountCodeGenerator ?? new DiscountCodeGenerator()
    }

    // Removed for clarity
}
```

O también así:

```typescript
export class BirthdayService {
    private readonly customerRepository: Customers
    private readonly emailSender: ProductionEmailSender
    private readonly logger: Logger
    private readonly discountCodeGenerator: CodeGenerator

    constructor(
        customerRepository: Customers,
        emailSender: ProductionEmailSender,
        logger: Logger,
        discountCodeGenerator: CodeGenerator = new DiscountCodeGenerator()
    ) {
        this.customerRepository = customerRepository
        this.emailSender = emailSender
        this.logger = logger
        this.discountCodeGenerator = discountCodeGenerator
    }

    // Removed for clarity
}
```

En ambos casos, mantenemos la compatibilidad con el código existente (los tests siguen pasando) y añadimos la posibilidad de inyectar la dependencia. En el caso del test, podemos introducir un doble:

```typescript
class CodeGeneratorStub implements CodeGenerator {
    generate(): DiscountCode {
        return new DiscountCode('FP1BRI')
    }
}
```

Y utilizarlo en lugar del servicio real en el test:

```typescript
it('should send a well formed message with the discount code to the right customer', () => {
    const emailSender = new MessageContentSpyEmailSender()
    const service = new BirthdayService(
        new CustomersWithBirthdayToday([
            new Customer('Jane Doe', 'jane@example.com', new Date('2005-02-14')),
        ]),
        emailSender,
        new DummyLogger(),
        new CodeGeneratorStub(),
    )

    service.greetCustomersWithBirthday(new Date())

    expect(emailSender.lastMessageContent()).toBe(
        'Happy birthday, Jane Doe! Here is your discount code: FP1BRI',
    )
    expect(emailSender.lastMessageRecipient()).toBe('jane@example.com')
})
```

Y con esto, hemos inver†ido la dependencia y desacoplado `BirthdayService` de sus colaboradores, abriendo la puerta a unos tests mucho más sólidos.

## Dobles de test que simulan fallos

En los tests no tenemos cubierta la posibilidad de que nuestro servicio falle por problemas en los colaboradores. Por ejemplo, BirthdayService será sensible a que falle la conexión de `Customers` a la base de datos física, pero también que falle `EmailSender` o, en su caso, `CodeGenerator`. De hecho, esa posibilidad de fallo es uno de los motivos por los que tenemos que introducir dobles de test: por la posibilidad no reproducible de que el colaborador falle y por la dificultad de provocar un fallo del colaborador.

Pero con un doble de test es fácil conseguir ambas cosas: un colaborador que no falle o un colaborador que falle de una forma determinada, que es de lo que nos vamos a ocupar a continuación.

Como no tenemos ninguna gestión de errores en nuestro código de ejemplo podemos suponer que vamos a trabajar en TDD para añadirla. 

### Base de datos innacesible

Supongamos que hemos averiguado que necesitamos gestionar un error de tipo `DatabaseUnavailable` cuando, por el motivo que sea, falla nuestra implementación en producción de `Customers`. Para simplificar, vamos a suponer que el comportamiento de `BirthdayService` en esa situación debe ser hacer un log informando del fallo y terminar con normalidad.

Como es de esperar, necesitaremos un _Stub_ de `Customers` que tire un error `DatabaseUnavailable`, y un espía que nos diga qué mensaje se ha puesto en el log.

```typescript
it('should log and stop when database is unavailable', () => {
    const emailSender = new MessageCountingEmailSender()
    const logger = new LoggerMessageSpy()
    const service = new BirthdayService(
        new UnavailableCustomers(),
        emailSender,
        logger,
        new CodeGeneratorStub(),
    )

    service.greetCustomersWithBirthday(new Date())

    expect(logger.lastMessage()).toBe('Customer database is not available')
    expect(logger.lastLevel()).toBe('ERROR')
    expect(emailSender.countOfSentEmails()).toBe(0)
})
```

He aquí el Stub que falla de Customers. Es una implementación que lo único que hace es fallar de una manera determinada:

```typescript
class UnavailableCustomers implements Customers {
    findWithBirthday(today: Date): Customer[] {
        throw new DatabaseUnavailable('Customer database is not available')
    }
}
```

Específicamente, con este error:

```typescript
class DatabaseUnavailable implements Error {
  name: string
  message: string

  constructor(message: string) {
    this.message = message
  }
}
```

Por su parte, para espiar el mensaje que recibirá el logger tenemos:

```typescript
class LoggerMessageSpy implements Logger{
    private message: string
    private level: string

    log(level: string, message: string): void {
        this.message = message
        this.level = level
    }

    lastMessage() {
        return this.message
    }

    lastLevel() {
        return this.level
    }
}
```

Como es de esperar el test fallará, puesto que todavía no hemos implementado nada en el servicio.

```
Customer database is not available
```

El código que necesitamos sirve para capturar el error y reaccionar de la forma que queremos:

```typescript
export class BirthdayService {
    private readonly customerRepository: Customers
    private readonly emailSender: ProductionEmailSender
    private readonly logger: Logger
    private readonly discountCodeGenerator: CodeGenerator

    constructor(
        customerRepository: Customers,
        emailSender: ProductionEmailSender,
        logger: Logger,
        discountCodeGenerator: CodeGenerator = new DiscountCodeGenerator()
    ) {
        this.customerRepository = customerRepository
        this.emailSender = emailSender
        this.logger = logger
        this.discountCodeGenerator = discountCodeGenerator
    }

    greetCustomersWithBirthday(today: Date): void {
        let customers: Customer[]
        try {
            customers = this.customerRepository.findWithBirthday(today)
        } catch (e) {
            this.logger.log('ERROR', e.message)
            return
        }

        customers.forEach((customer) => {
            const discountCode = this.getDiscountCode()
            const template =
                'Happy birthday, {name}! Here is your discount code: {discount}'.replace(
                    '{discount}',
                    discountCode.getCode(),
                )
            customer.sendEmail(template, this.emailSender)
            this.logger.log('INFO', customer.fillWithEmail('Email sent to {email}'))
        })
    }

    protected getDiscountCode(): DiscountCode {
        return this.discountCodeGenerator.generate()
    }
}
```

Por supuesto, podemos hacerlo de una forma un poco más limpia:

```typescript
export class BirthdayService {
    private readonly customerRepository: Customers
    private readonly emailSender: ProductionEmailSender
    private readonly logger: Logger
    private readonly discountCodeGenerator: CodeGenerator

    constructor(
        customerRepository: Customers,
        emailSender: ProductionEmailSender,
        logger: Logger,
        discountCodeGenerator: CodeGenerator = new DiscountCodeGenerator(),
    ) {
        this.customerRepository = customerRepository
        this.emailSender = emailSender
        this.logger = logger
        this.discountCodeGenerator = discountCodeGenerator
    }

    greetCustomersWithBirthday(today: Date): void {
        const customers: Customer[] = this.getCustomersWithBirthday(today)
        customers.forEach((customer) => {
            const discountCode = this.getDiscountCode()
            const template =
                'Happy birthday, {name}! Here is your discount code: {discount}'.replace(
                    '{discount}',
                    discountCode.getCode(),
                )
            customer.sendEmail(template, this.emailSender)
            this.logger.log('INFO', customer.fillWithEmail('Email sent to {email}'))
        })
    }

    private getCustomersWithBirthday(today: Date): Customer[] {
        let customers: Customer[] = []
        try {
            customers = this.customerRepository.findWithBirthday(today)
        } catch (e) {
            this.logger.log('ERROR', e.message)
        }
        return customers
    }

    protected getDiscountCode(): DiscountCode {
        return this.discountCodeGenerator.generate()
    }
}
```

## Lógica justificada en un doble de test

Hasta ahora hemos escrito dobles de test con una lógica muy sencilla. Lo más complicado ha sido ir tomando nota de los parámetros recibidos o ir contando las invocaciones a un método. Sin embargo, hay ocasiones en las que necesitamos simular un comportamiento un poco más elaborado. Algunos ejemplos:

* _Stubs_ que pueden ser llamados repetidas veces y queremos, o necesitamos, que cada vez nos devuelvan algo distinto.
* _Stubs_ que fallan unas veces y otras funcionan bien.
* Cuando nos interesa testear que la unidad bajo test reintenta una operación.

En principio, las librerías de dobles podrían facilitarnos esto, pero en realidad no es tan complicado programarlo para las necesidades de nuestro test.

Ahora bien, a veces es simplemente cuestión de pensarlo detenidamente, por lo que en cada ejemplo a continuación voy a intentar explicar por qué es muy probable que no necesites ese esfuerzo.

### Valores distintos en cada llamada

Primero, analicemos este test:

```typescript
it('should send a well formed message with the discount code to the right customer', () => {
    const emailSender = new MessageContentSpyEmailSender()
    const service = new BirthdayService(
        new CustomersWithBirthdayToday([
            new Customer('Jane Doe', 'jane@example.com', new Date('2005-02-14')),
        ]),
        emailSender,
        new DummyLogger(),
        new CodeGeneratorStub(),
    )

    service.greetCustomersWithBirthday(new Date())

    expect(emailSender.lastMessageContent()).toBe(
        'Happy birthday, Jane Doe! Here is your discount code: FP1BRI',
    )
    expect(emailSender.lastMessageRecipient()).toBe('jane@example.com')
})
```

Una objeción que me han puesto a veces es que deberíamos hacer un test con varios ejemplos de `Customer`, para verificar que efectivamente se itera la lista y que se envía el mensaje correcto a los distintos clientes. Si te digo la verdad, no tengo clara la necesidad de hacer este test, pero tiene sentido. ¿De cuántos clientes debería ser la muestra? Puesto a ejercer de abogado del diablo, nada me garantiza que al llegar a un cierto número de clientes, el bucle deje de iterar o algo. 

En fin, bromas aparte, supongamos que con dos clientes ya tenemos suficiente. Un posible abordaje sería introducir un nuevo espía que en lugar del último mensaje, sea capaz de decirme el mensaje enviado en una iteración determinada.

```typescript
it('should send a well formed message with the discount code to the right customer', () => {
    const emailSender = new MessageContentByIterationEmailSender()
    const service = new BirthdayService(
        new CustomersWithBirthdayToday([
            new Customer('John Doe', 'john@example.com', new Date('1990-02-14')),
            new Customer('Jane Doe', 'jane@example.com', new Date('2005-02-14')),
        ]),
        emailSender,
        new DummyLogger(),
        new CodeGeneratorStub(),
    )

    service.greetCustomersWithBirthday(new Date())

    expect(emailSender.messageContent(0)).toBe(
        'Happy birthday, John Doe! Here is your discount code: FP1BRI',
    )
    expect(emailSender.messageContent(1)).toBe(
        'Happy birthday, Jane Doe! Here is your discount code: FP1BRI',
    )
})
```

Es fácil ver que hay un problema con este espía, ya que está acoplado al orden en que introducimos los clientes. Se me ocurre una forma mejor: pedirle el mensaje que hemos enviado a cada dirección de email. De este modo, da igual el orden en que hayamos metido los datos e incluso da igual la cantidad de clientes que usemos en el test. Es más, con esto verificamos no solo el contenido sino que lo enviamos a la dirección correcta:

```typescript
class MessageContentByAddressEmailSender implements EmailSender {
    private messages: Record<string, string> = {}
    send(email: string, message: string): void {
        this.messages[email] = message
    }
    messageContent(email: string): string {
        return this.messages[email]
    }
}
```

El test es el siguiente:

```typescript
it('should send a well formed message with the discount code to the right customer', () => {
    const emailSender = new MessageContentByAddressEmailSender()
    const service = new BirthdayService(
        new CustomersWithBirthdayToday([
            new Customer('John Doe', 'john@example.com', new Date('1990-02-14')),
            new Customer('Jane Doe', 'jane@example.com', new Date('2005-02-14')),
        ]),
        emailSender,
        new DummyLogger(),
        new CodeGeneratorStub(),
    )

    service.greetCustomersWithBirthday(new Date())

    expect(emailSender.messageContent('john@example.com')).toBe(
        'Happy birthday, John Doe! Here is your discount code: FP1BRI',
    )
    expect(emailSender.messageContent('jane@example.com')).toBe(
        'Happy birthday, Jane Doe! Here is your discount code: FP1BRI',
    )
})
```

Puedes añadir más clientes, o cambiar su orden, y el test seguirá funcionando perfectamente. Sin embargo, casi puedo escuchar la pregunta: Pero, ¿qué pasa con el código de descuento? ¿No debería ser distinto cada vez?

Bien, pues no tenemos más que introducir un nuevo _Stub_ que pueda darnos diferentes códigos de descuento que tengamos controlados. Este que mostramos nos devolverá cada código que le hayamos pasado en el constructor en el mismo orden.

```typescript
class MultipleCodeGeneratorStub implements CodeGenerator {
    private codes: string[]

    constructor(...codes: string[]) {
        this.codes = codes
    }

    generate(): DiscountCode {
        return new DiscountCode(this.codes.shift())
    }
}
```

Lo que nos hace posible escribir este test:

```typescript
it('should send a well formed message with the discount code to the right customer', () => {
    const emailSender = new MessageContentByAddressEmailSender()
    const service = new BirthdayService(
        new CustomersWithBirthdayToday([
            new Customer('John Doe', 'john@example.com', new Date('1990-02-14')),
            new Customer('Jane Doe', 'jane@example.com', new Date('2005-02-14')),
        ]),
        emailSender,
        new DummyLogger(),
        new MultipleCodeGeneratorStub('FP1BRI', 'FP20ZI'),
    )

    service.greetCustomersWithBirthday(new Date())

    expect(emailSender.messageContent('john@example.com')).toBe(
        'Happy birthday, John Doe! Here is your discount code: FP1BRI',
    )
    expect(emailSender.messageContent('jane@example.com')).toBe(
        'Happy birthday, Jane Doe! Here is your discount code: FP20ZI',
    )
})
```

Ahora bien, tenemos algunos problemas. Como no hay relación entre el código de descuento y el cliente, ahora el test estará acoplado al orden en que pasamos los códigos de ejemplo, así que perdemos la capacidad de ordenar los clientes de otra forma. Y, por otro lado, el doble de test funcionará mientras haya códigos, por lo que el número de clientes de ejemplo debe ser igual al número de códigos.

Puedes pensar que estos problemas no son especialmente importantes o que puedes convivir con ellos.

Sin embargo, te planteo de nuevo la reflexión que hicimos más arriba. En este test no estamos verificando que se genera un código correcto, solo verificamos que se incluye el código obtenido en el mensaje que enviamos al cliente. Nos da igual el código mientras se pueda expresar como un `string` e incluir en la plantilla del mensaje. En consecuencia, para este test realmente no nos importa que el doble de `CodeGenerator` devuelva siempre el mismo código. Este test, por tanto, sería suficiente, y además es mucho más flexible:

```typescript
it('should send a well formed message with the discount code to the right customer', () => {
    const emailSender = new MessageContentByAddressEmailSender()
    const service = new BirthdayService(
        new CustomersWithBirthdayToday([
            new Customer('John Doe', 'john@example.com', new Date('1990-02-14')),
            new Customer('Jane Doe', 'jane@example.com', new Date('2005-02-14')),
        ]),
        emailSender,
        new DummyLogger(),
        new CodeGeneratorStub(),
    )

    service.greetCustomersWithBirthday(new Date())

    expect(emailSender.messageContent('john@example.com')).toBe(
        'Happy birthday, John Doe! Here is your discount code: FP1BRI',
    )
    expect(emailSender.messageContent('jane@example.com')).toBe(
        'Happy birthday, Jane Doe! Here is your discount code: FP1BRI',
    )
})
```

En todo caso, tendrías que testear específicamente `DiscountCodeGenerator` para verificar que siempre saca un código distinto.




### Stubs que fallan unas veces y otras no

Este caso de uso es un poco más _tricky_, pero aceptemos que nos interesa comprobar que nuestra unidad bajo test es capaz de hacer reintentos y lograr sus objetivos si tiene la oportunidad. O dicho de otra forma, que si su colaborador falla en una primera ocasión, es capaz de probar de nuevo y conseguir su objetivo.

Nuestro ejemplo de enviar un email cuadra muy bien con nuestro objetivo, ya que no es descabellado pensar que un sistema de envío de emails al enviar muchos mensajes seguidos pueda dejar de aceptar nuevos intentos durante unos segundos. En cualquier caso, es un mecanismo habitual.

Así que vamos a necesitar un doble de `EmailSender` que, por ejemplo, falle la primera vez que se llame, pero que funcione al segundo intento. De este modo vamos a poder probar que `BirthdayService` sabe reaccionar a esa situación. Ahora bien, no quiero mezclar una cosa con otra, así que voy a hacerlo mediante un decorador que será el que falle y delegará en otro doble la cuenta de mensajes.

En construcción se pueden especificar las veces que queremos que falle el doble antes de simular que permite el envío:

```typescript
class FailingEmailSender implements EmailSender {
    private emailSender: EmailSender
    private timesFailing: number
    constructor(emailSender: EmailSender, timesFailing: number) {
        this.emailSender = emailSender
        this.timesFailing = timesFailing
    }

    send(email: string, message: string): void {
        if (this.timesFailing > 0) {
            this.timesFailing--
            throw new Error('Email sending failed')
        }
        this.emailSender.send(email, message)
    }
}
```

Y este será el test, en el que hacemos que el `EmailSender` falle una vez antes de permitir enviar emails.

```typescript
it('should retry to send email if EmailSender fails', () => {
    const emailSender = new MessageCountingEmailSender()
    const timesToFailBeforeAcceptingMessage = 1
    const failingEmailSender = new FailingEmailSender(emailSender, timesToFailBeforeAcceptingMessage)
    const service = new BirthdayService(
        new CustomersWithBirthdayToday([
            new Customer('John Doe', 'john@example.com', new Date('1990-02-14')),
        ]),
        failingEmailSender,
        new DummyLogger(),
    )

    service.greetCustomersWithBirthday(new Date())

    expect(emailSender.countOfSentEmails()).toBe(1)
})
```

Y aquí tenemos un código que hace pasar el test. Por cierto, que si quieres verificar que BirthdayService lo va a intentar tres veces antes de darse por vencido puedes cambiar el valor de `timesToFailBeforeAcceptingMessage`. Spoiler: el test no pasará si pones que `EmailSender` falle tres veces, que es el número de reintentos que hemos decidido permitir.

```typescript
export class BirthdayService {
    private readonly customerRepository: Customers
    private readonly emailSender: ProductionEmailSender
    private readonly logger: Logger
    private readonly discountCodeGenerator: CodeGenerator

    constructor(
        customerRepository: Customers,
        emailSender: ProductionEmailSender,
        logger: Logger,
        discountCodeGenerator: CodeGenerator = new DiscountCodeGenerator(),
    ) {
        this.customerRepository = customerRepository
        this.emailSender = emailSender
        this.logger = logger
        this.discountCodeGenerator = discountCodeGenerator
    }

    greetCustomersWithBirthday(today: Date): void {
        const customers: Customer[] = this.getCustomersWithBirthday(today)
        customers.forEach((customer) => {
            const discountCode = this.getDiscountCode()
            const template =
                'Happy birthday, {name}! Here is your discount code: {discount}'.replace(
                    '{discount}',
                    discountCode.getCode(),
                )
            let retries = 3
            while (retries > 0) {
                try {
                    customer.sendEmail(template, this.emailSender)
                    break
                } catch (e) {
                    this.logger.log('ERROR', e.message)
                    retries--
                }
            }
            this.logger.log('INFO', customer.fillWithEmail('Email sent to {email}'))
        })
    }

    private getCustomersWithBirthday(today: Date): Customer[] {
        let customers: Customer[] = []
        try {
            customers = this.customerRepository.findWithBirthday(today)
        } catch (e) {
            this.logger.log('ERROR', e.message)
        }
        return customers
    }

    protected getDiscountCode(): DiscountCode {
        return this.discountCodeGenerator.generate()
    }
}
```

De nuevo, nos conviene hacer un poco de refactor para dejar el método público más legible.

```typescript
export class BirthdayService {
    private readonly customerRepository: Customers
    private readonly emailSender: ProductionEmailSender
    private readonly logger: Logger
    private readonly discountCodeGenerator: CodeGenerator

    constructor(
        customerRepository: Customers,
        emailSender: ProductionEmailSender,
        logger: Logger,
        discountCodeGenerator: CodeGenerator = new DiscountCodeGenerator(),
    ) {
        this.customerRepository = customerRepository
        this.emailSender = emailSender
        this.logger = logger
        this.discountCodeGenerator = discountCodeGenerator
    }

    greetCustomersWithBirthday(today: Date): void {
        const customers: Customer[] = this.getCustomersWithBirthday(today)
        customers.forEach((customer) => {
            const discountCode = this.getDiscountCode()
            const template =
                'Happy birthday, {name}! Here is your discount code: {discount}'.replace(
                    '{discount}',
                    discountCode.getCode(),
                )
            this.sendMessage(customer, template)
            this.logger.log('INFO', customer.fillWithEmail('Email sent to {email}'))
        })
    }

    private getCustomersWithBirthday(today: Date): Customer[] {
        let customers: Customer[] = []
        try {
            customers = this.customerRepository.findWithBirthday(today)
        } catch (e) {
            this.logger.log('ERROR', e.message)
        }
        return customers
    }

    protected getDiscountCode(): DiscountCode {
        return this.discountCodeGenerator.generate()
    }

    private sendMessage(customer: Customer, template: string): void {
        let retries = 3
        while (retries > 0) {
            try {
                customer.sendEmail(template, this.emailSender)
                break
            } catch (e) {
                this.logger.log('ERROR', e.message)
                retries--
            }
        }
    }
}
```

Seguramente podríamos haber hecho un _Spy_ con toda la funcionalidad, pero me parece que el decorador nos ha permitido no solo aprovechar el espía existente, sino ser un poco más rigurosas con la separación de responsabilidades.

### Más sobre reintentos

¿Cómo probamos que `BirthdayService` es capaz de dejar de enviar un mensaje si el servicio falla en todos los intentos? A primera vista podría tener sentido usar un test similar al anterior, junto con un espía que nos diga el mensaje que hemos puesto en el `Logger`. No lo he mencionado explícitamente, pero nuestro servicio procura no romperse si no puede mandar un email y registra el fallo para que podamos hacer algo posteriormente.

Si nos fijamos en el código veremos que se hace un log con cada intento de envío fallido de un mensaje. Eso supone que si un mensaje no se puede enviar aparecerá logado tres veces. Necesitamos un espía de logs que pueda contarlo, tal vez incluso teniendo en cuenta el email al que se ha tratado de enviar el mensaje.

```typescript
class CountingLogger implements Logger {
    private entries: string[] = []

    log(level: string, message: string): void {
        this.entries.push(message)
    }

    countOfEntriesFor(address: string): number {
        const entriesForAddress = this.entries.filter((entry) =>
            entry.includes(address),
        )
        return entriesForAddress.length
    }
}
```
Por otro lado, si el peso de verificar los reintentos recae en el log, resulta que `EmailSender` puede ser mucho más simple. Sencillamente: puede fallar siempre.

```typescript
class AlwaysFailingEmailSender implements EmailSender {
    send(email: string, message: string): void {
        throw new Error('Email sending failed')
    }
}
```

El test queda así:

```typescript
it('should retry to 3 times before failing to send', () => {
    const emailSender = new AlwaysFailingEmailSender()
    const logger = new CountingLogger()

    const service = new BirthdayService(
        new CustomersWithBirthdayToday([
            new Customer('John Doe', 'john@example.com', new Date('1990-02-14')),
        ]),
        emailSender,
        logger,
    )

    service.greetCustomersWithBirthday(new Date())

    expect(logger.countOfEntriesFor('john@example.com')).toBe(3)
})
```

Pero si lo ejecutamos falla. Nos salen cuatro entradas, ¿qué está pasando? Pues que si nos fijamos en este fragmento, estamos _logando_ como enviados todos los mensajes, incluso los fallidos:

```typescript
greetCustomersWithBirthday(today: Date): void {
    const customers: Customer[] = this.getCustomersWithBirthday(today)
    customers.forEach((customer) => {
        const discountCode = this.getDiscountCode()
        const template =
            'Happy birthday, {name}! Here is your discount code: {discount}'.replace(
                '{discount}',
                discountCode.getCode(),
            )
        this.sendMessage(customer, template)
        this.logger.log('INFO', customer.fillWithEmail('Email sent to {email}'))
    })
}
```

Es cuestión de cambiar la línea del logger a un lugar más apropiado. Así queda finalmente `BirthdayService`.

```typescript
export class BirthdayService {
    private readonly customerRepository: Customers
    private readonly emailSender: ProductionEmailSender
    private readonly logger: Logger
    private readonly discountCodeGenerator: CodeGenerator

    constructor(
        customerRepository: Customers,
        emailSender: ProductionEmailSender,
        logger: Logger,
        discountCodeGenerator: CodeGenerator = new DiscountCodeGenerator(),
    ) {
        this.customerRepository = customerRepository
        this.emailSender = emailSender
        this.logger = logger
        this.discountCodeGenerator = discountCodeGenerator
    }

    greetCustomersWithBirthday(today: Date): void {
        const customers: Customer[] = this.getCustomersWithBirthday(today)
        customers.forEach((customer) => {
            const discountCode = this.getDiscountCode()
            const template =
                'Happy birthday, {name}! Here is your discount code: {discount}'.replace(
                    '{discount}',
                    discountCode.getCode(),
                )
            this.sendMessage(customer, template)
        })
    }

    private getCustomersWithBirthday(today: Date): Customer[] {
        let customers: Customer[] = []
        try {
            customers = this.customerRepository.findWithBirthday(today)
        } catch (e) {
            this.logger.log('ERROR', e.message)
        }
        return customers
    }

    protected getDiscountCode(): DiscountCode {
        return this.discountCodeGenerator.generate()
    }

    private sendMessage(customer: Customer, template: string): void {
        let retries = 3
        while (retries > 0) {
            try {
                customer.sendEmail(template, this.emailSender)
                this.logger.log('INFO', customer.fillWithEmail('Email sent to {email}'))
                break
            } catch (e) {
                this.logger.log(
                    'ERROR',
                    customer.fillWithEmail(`${e.message} when sending to {email}`),
                )
                retries--
            }
        }
    }
}
```

## Conclusiones

Seguramente se podrían analizar más casos de tests en los que podríamos usar distintos tipos de dobles, pero creo que tenemos una muestra bastante representativa en este artículo. El ejercicio en sí buscaba forzar algunas situaciones típicas de testing, que pueden darse tanto con el test a posteriori como en situaciones de TDD.

Si hago recuento de todos los dobles de test que he introducido en el ejercicio me salen 12. Puede que esta cifra te parezca exagerada, pero si lo examinas con calma, verás que cada uno de ellos es extremadamente sencillo y enfocado en su tarea. Además, hemos minimizado el acoplamiento entre tests.

Por otro lado, para introducir dobles hemos tenido que aplicar varios principios de diseño. En especial, el de Inversión de Dependencias. También nos hemos beneficiado, aunque no lo he mencionado explícitamente, de la Segregación de Interfaces. En este ejemplo, todas las interfaces son muy sencillas, con un único método, lo que abarata enormemente la creación de dobles de test.

En ningún momento hemos usado librerías de mocks. De hecho, no hemos usado ningún _Mock_. En todos aquellos casos en los que necesitábamos saber cómo se habían comunicado la unidad bajo test y su colaborador, hemos ido muy bien servidas por un espía. Además, y gracias a eso, las aserciones o expectativas han quedado bien reflejadas en el propio test.
