---
layout: post
title: Long Parameter List
categories: articles
series: code-smells
tags: code-smells refactoring typescript
---

Otro _smell_ de la familia de los _Bloaters_. _Long Parameter List_ ocurre cuando una función o método recibe más de tres ó cuatro parámetros.

## Definición

Una función o método recibe más de tres o cuatro parámetros. Un número alto de parámetros en la firma de una función sobrecarga nuestra memoria de trabajo, dificultando que podamos recordar con precisión cuáles son esos parámetros, su orden o su tipo.

A medida que una función requiere lograr más flexibilidad o contemplar nuevos casos, es posible que necesitemos pasarle más información, por lo que añadimos más parámetros. Sin embargo, al mismo tiempo, añadimos más oportunidades para los errores y dificultamos su mantenimiento en el futuro.

## Ejemplo

El siguiente generador de informes recibe numerosos parámetros, que tienen distintos significados y usos.

```typescript
class ReportGenerator {
  generateReport(
    title: string,
    startDate: Date,
    endDate: Date,
    includeCharts: boolean,
    includeSummary: boolean,
    authorName: string,
    authorEmail: string,
  ) {
    console.log(`Generando reporte: ${title}`)
    console.log(`Desde ${startDate.toDateString()} hasta ${endDate.toDateString()}`)
    console.log(`Autor: ${authorName} (${authorEmail})`)
    if (includeCharts) console.log('Incluyendo gráficos...')
    if (includeSummary) console.log('Incluyendo resumen...')
    console.log('Reporte generado exitosamente.')
  }
}

export function demoLongParameterList(): void {
  const gen = new ReportGenerator()
  gen.generateReport(
    'Ventas Q1',
    new Date('2025-01-01'),
    new Date('2025-03-31'),
    true,
    false,
    'Pat Smith',
    'pat@example.com',
  )
}
```

## Ejercicio

Supongamos que necesitamos añadir dos opciones más al reporte. Por ejemplo, locale para traducciones y un tamaño de página.

## Problemas que encontrarás

Añadir parámetros es fácil en el momento. El problema viene cuando tenemos que modificar tests o llamadas en diversos puntos del código.

## Solución

### Sin resolver el smell

Pues es tan simple como añadir los parámetros que nos piden y empezar a usarlos.

```typescript
class ReportGenerator {
  generateReport(
    title: string,
    startDate: Date,
    endDate: Date,
    includeCharts: boolean,
    includeSummary: boolean,
    authorName: string,
    authorEmail: string,
    locale: string,
    pageSize: string
  )
}
```

El problema es que, a estas alturas, ya tenemos nueve parámetros. Y, por otro lado, ¿qué pasa si este método se usa en numerosos lugares de nuestro código?

Una opción es añadir los nuevos parámetros como opcionales, con valores por defecto adecuados. Esto resuelve el problema en el corto plazo, pero no hace más que aumentar el coste de cambio futuro.

```typescript
export class ReportGenerator {
    generateReport(
        title: string,
        startDate: Date,
        endDate: Date,
        includeCharts: boolean,
        includeSummary: boolean,
        authorName: string,
        authorEmail: string,
        locale: string = 'es-ES',
        pageSize: string = 'A4',
    ) {
        console.log(`Generando reporte: ${title}`)
        console.log(`Desde ${startDate.toDateString()} hasta ${endDate.toDateString()}`)
        console.log(`Autor: ${authorName} (${authorEmail})`)
        if (includeCharts) console.log('Incluyendo gráficos...')
        if (includeSummary) console.log('Incluyendo resumen...')
        console.log('Reporte generado exitosamente.')
    }
}
```

### Resolviendo el smell

#### Testing

Empecemos haciendo un test de caracterización del código actual:

```typescript
import {describe, expect, it, vi} from "vitest";
import {ReportGenerator} from "./long-parameter-list";

function formatConsoleCalls(spy: ReturnType<typeof vi.spyOn>) {
  return spy.mock.calls.map((call) => call.join(' ')).join('\n')
}

describe('Long Parameter List', () => {
  it('Generates a report', () => {
    const logSpy = vi.spyOn(console, 'log')

    const gen = new ReportGenerator()
      gen.generateReport(
        'Ventas Q1',
        new Date('2025-01-01'),
        new Date('2025-03-31'),
        true,
        false,
        'Pat Smith',
        'pat@example.com',
      )

    let output = formatConsoleCalls(logSpy)
    expect(output).toMatchSnapshot()
  })
})
```

Nuestro problema es conseguir reducir la carga cognitiva de tener que usar siete parámetros en la función `generateReport` y, posiblemente, aumentarlos a nueve, o puede que incluso más en el futuro. En realidad el refactor básico es bastante fácil, pero lo que puede complicarlo es compatibilizar el cambio de firma con sus usos actuales. Por eso, vamos a usar técnicas que nos permitan una migración fácil, a la vez que introducimos el soporte para nuevas opciones.

En esta ocasión usaremos refactors como _Introduce Parameter Object_ o _Introduce Value Object_, aplicaremos el patrón _Builder_ con _Fluent Interface_ y para lograrlo usaremos algunas técnicas de cambio en paralelo.

#### Introduce Parameter Object

El refactor Introduce Parameter Object es tan sencillo como crear un tipo de objeto que agrupe todos los parámetros que necesitamos. Ahora bien: ¿hasta qué punto esto nos resuelve un problema o estamos moviendo el problema a otro lugar?

Definimos el tipo. En este caso, lo hacemos mediante una interfaz, que es una forma bastante idiomática de definir tipos en TypeScript.

```typescript
export interface GenerateReport {
    title: string
    startDate: Date
    endDate: Date
    includeCharts: boolean
    includeSummary: boolean
    authorName: string
    authorEmail: string
}
```

Y aquí lo instanciamos:

```typescript
const generateReport = {
    title: 'Ventas Q1',
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-03-31'),
    includeCharts: true,
    includeSummary: false,
    authorName: 'Pat Smith',
    authorEmail: 'pat@example.com'
} as GenerateReport
```

En principio, la ventaja aquí es que el objeto nos permite despreocuparnos del orden de los parámetros y que tenemos explícito su nombre, lo que facilita entender la información que tenemos que pasar. Nos quedaría incorporar la nueva firma y lo tendríamos listo. Esto puede ser suficiente para una gran mayoría de casos.

Déjame darle una vuelta más:

#### Agrupar parámetros

Si echamos un vistazo al código podemos ver que hay dos tipos de parámetros:

* Los que se usan para generar el reporte indicando contenido que debe mostrarse, como: `title`, `startDate`, `endDate`, `authorName`, `authorEmail`.
* Los que se usan para personalizar el reporte, como opciones que lo configuran, como: `includeCharts`, `includeSummary`.

En el código podemos ver que se usan incluso de distinta forma: los relacionados con el contenido acaban interpolándose, mientras que los de personalización se usan directamente.

```typescript
class ReportGenerator {
  generateReport(
    title: string,
    startDate: Date,
    endDate: Date,
    includeCharts: boolean,
    includeSummary: boolean,
    authorName: string,
    authorEmail: string,
  ) {
    console.log(`Generando reporte: ${title}`)
    console.log(`Desde ${startDate.toDateString()} hasta ${endDate.toDateString()}`)
    console.log(`Autor: ${authorName} (${authorEmail})`)
    if (includeCharts) console.log('Incluyendo gráficos...')
    if (includeSummary) console.log('Incluyendo resumen...')
    console.log('Reporte generado exitosamente.')
  }
}
```

Personalmente, me parece que los de configuración tiene sentido que se pasen en construcción, mientras que los de contenido se pasan en la llamada.

Pero es que, además, algunos de los parámetros están relacionados entre sí. Por ejemplo, `startDate` y `endDate` definen un rango de fechas, y los datos del autor `authorName` y `authorEmail` forman también una unidad.

#### Introduce Value Object

Como vimos al hablar de [Data Clump](/data-clump/) datos que viajan siempre juntos suelen formar parte de un mismo concepto, por lo que es frecuente que los podamos agrupar en un Value Object, lo cual nos ayudará tanto a reducir la carga cognitiva de la firma de la función, como a introducir el concepto en nuestra base de código.

```typescript
export class DateRange {
  private startDate: Date
  private endDate: Date

  constructor(
    startDate: Date,
    endDate: Date,
  ) {
    this.endDate = endDate;
    this.startDate = startDate;
  }
}

export class Author {
  private name: string;
  private email: string
  
  constructor(name: string, email: string) {
    this.name = name;
    this.email = email;
  }
}
```

#### Cambiar la firma de un método sin romper la compatibilidad

Cambiar la firma de un método manteniendo la compatibilidad hacia atrás se hace básicamente... no cambiando la firma del método. 

En su lugar, lo que haremos es introducir un nuevo método con la firma deseada y hacer que el viejo lo use. La idea es conservar la firma _deprecada_, que puede ser llamado desde distintas partes del código, a la vez que ofrecemos la nueva interfaz que podemos empezar a usar progresivamente, sin romper nada. 

Veamos como queda la firma de `generateReport` con los Value Objects. Introduciremos un nuevo método llamado simplemente `generate`, ya que el nombre del original es bastante redundante:

```typescript
export class ReportGenerator {
    generateReport(
        title: string,
        startDate: Date,
        endDate: Date,
        includeCharts: boolean,
        includeSummary: boolean,
        authorName: string,
        authorEmail: string,
    ) {
        console.log(`Generando reporte: ${title}`)
        console.log(`Desde ${startDate.toDateString()} hasta ${endDate.toDateString()}`)
        console.log(`Autor: ${authorName} (${authorEmail})`)
        if (includeCharts) console.log('Incluyendo gráficos...')
        if (includeSummary) console.log('Incluyendo resumen...')
        console.log('Reporte generado exitosamente.')
    }

    generate(title: string,  range: DateRange, author: Author, includeCharts: boolean, includeSummary: boolean) {
        // no-op
    }
}
```

Aquí tenemos el test modificado para usar el nuevo método. Como es de esperar, el nuevo test no pasará.

```typescript
describe('Long Parameter List', () => {
    it('Generates a report', () => {
        const logSpy = vi.spyOn(console, 'log')

        const gen = new ReportGenerator()
        gen.generateReport(
            'Ventas Q1',
            new Date('2025-01-01'),
            new Date('2025-03-31'),
            true,
            false,
            'Pat Smith',
            'pat@example.com',
        )

        let output = formatConsoleCalls(logSpy)
        expect(output).toMatchSnapshot()
    })

    it('Generates a report with Value Objects', () => {
        const logSpy = vi.spyOn(console, 'log')

        const range = new DateRange(
            new Date('2025-01-01'),
            new Date('2025-03-31')
        )

        const author = new Author(
            'Pat Smith',
            'pat@example.com',
        )

        const gen = new ReportGenerator()
        gen.generate(
            'Ventas Q1',
            range,
            author,
            true,
            false,
        )

        let output = formatConsoleCalls(logSpy)
        expect(output).toMatchSnapshot()
    })
})
```


Ahora, vamos a copiar el cuerpo de `generateReport` en `generate` y cambiaremos lo necesario para que pueda funcionar, ya que no es compatible con la firma actual. Esto require introducir algunos métodos en los Value Objects. Empezamos así:

```typescript
export class ReportGenerator {
    generateReport(
        title: string,
        startDate: Date,
        endDate: Date,
        includeCharts: boolean,
        includeSummary: boolean,
        authorName: string,
        authorEmail: string,
    ) {
        console.log(`Generando reporte: ${title}`)
        console.log(`Desde ${startDate.toDateString()} hasta ${endDate.toDateString()}`)
        console.log(`Autor: ${authorName} (${authorEmail})`)
        if (includeCharts) console.log('Incluyendo gráficos...')
        if (includeSummary) console.log('Incluyendo resumen...')
        console.log('Reporte generado exitosamente.')
    }

    generate(title: string,  range: DateRange, author: Author, includeCharts: boolean, includeSummary: boolean) { {
        console.log(`Generando reporte: ${title}`)
        console.log(`Desde ${startDate.toDateString()} hasta ${endDate.toDateString()}`)
        console.log(`Autor: ${authorName} (${authorEmail})`)
        if (includeCharts) console.log('Incluyendo gráficos...')
        if (includeSummary) console.log('Incluyendo resumen...')
        console.log('Reporte generado exitosamente.')
    }
}
```

Estos cambios en los Value Objects:

```typescript
export class DateRange {
    private startDate: Date
    private endDate: Date

    constructor(
        startDate: Date,
        endDate: Date,
    ) {
        this.startDate = startDate;
        this.endDate = endDate;
    }

    print(template: string): string {
        return template
            .replace('{{startDate}}', this.startDate.toDateString())
            .replace('{{endDate}}', this.endDate.toDateString());
    }
}

export class Author {
    private name: string;
    private email: string

    constructor(name: string, email: string) {
        this.name = name;
        this.email = email;
    }

    print(template: string): string {
        return template
            .replace('{{name}}', this.name)
            .replace('{{email}}', this.email);
    }
}
```

Y acabamos así:

```typescript
export class ReportGenerator {
    generateReport(
        title: string,
        startDate: Date,
        endDate: Date,
        includeCharts: boolean,
        includeSummary: boolean,
        authorName: string,
        authorEmail: string,
    ) {
        console.log(`Generando reporte: ${title}`)
        console.log(`Desde ${startDate.toDateString()} hasta ${endDate.toDateString()}`)
        console.log(`Autor: ${authorName} (${authorEmail})`)
        if (includeCharts) console.log('Incluyendo gráficos...')
        if (includeSummary) console.log('Incluyendo resumen...')
        console.log('Reporte generado exitosamente.')
    }

    generate(title: string,  range: DateRange, author: Author, includeCharts: boolean, includeSummary: boolean) {
        console.log(`Generando reporte: ${title}`)
        console.log(range.print(`Desde {{startDate}} hasta {{endDate}}`))
        console.log(author.print(`Autor: {{name}} ({{email}})`))
        if (includeCharts) console.log('Incluyendo gráficos...')
        if (includeSummary) console.log('Incluyendo resumen...')
        console.log('Reporte generado exitosamente.')
    }
}
```

Con estos cambios, el test pasa y podemos empezar a vaciar el método `generateReport` de la clase `ReportGenerator`.

```typescript
export class ReportGenerator {
    generateReport(
        title: string,
        startDate: Date,
        endDate: Date,
        includeCharts: boolean,
        includeSummary: boolean,
        authorName: string,
        authorEmail: string,
    ) {
        const range = new DateRange(startDate, endDate)
        const author = new Author(authorName, authorEmail)
        return this.generate(title, range, author, includeCharts, includeSummary)
    }

    generate(title: string,  range: DateRange, author: Author, includeCharts: boolean, includeSummary: boolean) {
        console.log(`Generando reporte: ${title}`)
        console.log(range.print(`Desde {{startDate}} hasta {{endDate}}`))
        console.log(author.print(`Autor: {{name}} ({{email}})`))
        if (includeCharts) console.log('Incluyendo gráficos...')
        if (includeSummary) console.log('Incluyendo resumen...')
        console.log('Reporte generado exitosamente.')
    }
}
```

Todavía no deberíamos usar el método nuevo, porque su firma no es estable. Demos un paso más:

Antes señalamos que algunos de los parámetros que se pasan a `ReportGenerator` parecen tener más sentido como parámetros de configuración del generador y que podrían pasarse en construcción. Por supuesto, a falta de un contexto real, esto no deja de ser nada más que un recurso didáctico para introducir otra forma de pensar sobre el problema.

En este caso, tendríamos que introducir parámetros en la función constructora y guardarlos como propiedades privadas:

```typescript
export class ReportGenerator {
    private includeCharts: boolean;
    private includeSummary: boolean;

    constructor(includeCharts: boolean = true, includeSummary: boolean = false) {
        this.includeCharts = includeCharts;
        this.includeSummary = includeSummary;
    }

    // Code removed for clarity
}
```

Por supuesto, esto nos va a generar un problema con las instanciaciones actuales que tengamos, ya que ahora requerimos dos parámetros para construir el objeto. Al no tener sobrecarga de constructores en Typescript, lo que nos permitiría introducir uno alternativo, podríamos usar parámetros opcionales:

```typescript
export class ReportGenerator {
    private includeCharts: boolean;
    private includeSummary: boolean;

    constructor(includeCharts: boolean = true, includeSummary: boolean = false) {
        this.includeCharts = includeCharts;
        this.includeSummary = includeSummary;
    }
    
    // Code removed for clarity
}
```

Esto nos permite prescindir de ambos parámetros en la firma del nuevo método `generate`, pero debemos tenerlo en cuenta en `generateReport`, método que ahora podríamos deprecar:

```typescript
export class ReportGenerator {
    private includeCharts: boolean;
    private includeSummary: boolean;

    constructor(includeCharts: boolean = true, includeSummary: boolean = false) {
        this.includeCharts = includeCharts;
        this.includeSummary = includeSummary;
    }

    /** @deprecated Use ReportGenerator.generate instead */
    generateReport(
        title: string,
        startDate: Date,
        endDate: Date,
        includeCharts: boolean,
        includeSummary: boolean,
        authorName: string,
        authorEmail: string,
    ) {
        const range = new DateRange(startDate, endDate)
        const author = new Author(authorName, authorEmail)
        this.includeCharts = includeCharts
        this.includeSummary = includeSummary
        return this.generate(title, range, author)
    }

    generate(title: string, range: DateRange, author: Author) {
        console.log(`Generando reporte: ${title}`)
        console.log(range.print(`Desde {{startDate}} hasta {{endDate}}`))
        console.log(author.print(`Autor: {{name}} ({{email}})`))
        if (this.includeCharts) console.log('Incluyendo gráficos...')
        if (this.includeSummary) console.log('Incluyendo resumen...')
        console.log('Reporte generado exitosamente.')
    }
}
```

#### Preparándonos para el siguiente paso

Las dos nuevas propiedades que se quieren introducir son `locale` y `pageSize`. La primera hace más bien referencia al contenido, mientras que la segunda hace referencia al formato del informe. De nuevo, se trata de una decisión didáctica para explicar el problema.

De momento, hemos resuelto el _smell_ para el caso concreto de la firma de `generateReport`, pasando de 7 a 3 parámetros, pero no hemos resuelto el problema general. Si tenemos que añadir más parámetros al método, nos pondremos de nuevo en el límite o volveremos a superarlo.

Lo mismo ocurre para el constructor. Tenemos que mantener parámetros opcionales para asegurar compatibilidad hacia atrás. Y si tener tres o más en una firma ya es complicado de leer, cuando son opcionales la cosa se pone peor.

En estos casos nos viene bien utilizar el patrón `Builder`. Este patrón nos permite tener un constructor complejo, a la vez que exponemos una interfaz fácil de usar para generar instancias del objeto deseado.

```typescript
export class ReportGeneratorBuilder {
    private includeCharts: boolean = false
    private includeSummary: boolean = false

    withCharts(): ReportGeneratorBuilder {
        this.includeCharts = true;
        return this;
    }

    withSummary(): ReportGeneratorBuilder {
        this.includeSummary = true;
        return this;
    }

    build(): ReportGenerator {
        return new ReportGenerator(this.includeCharts, this.includeSummary);
    }
}
```

Usaremos el `Builder` cuando necesitemos tener una instancia de `ReportGenerator`. En este ejemplo, estamos usando opciones por defecto. Dentro de un momento veremos como requerir que ciertos valores se definan de forma obligatoria. Fíjate como usando la interfaz fluída obtenemos una construcción muy expresiva:

```typescript
it('Generates a report with Value Objects', () => {
    const logSpy = vi.spyOn(console, 'log')

    const range = new DateRange(
        new Date('2025-01-01'),
        new Date('2025-03-31')
    )

    const author = new Author(
        'Pat Smith',
        'pat@example.com',
    )

    const builder = new ReportGeneratorBuilder()
    const gen = builder
        .withCharts()
        .build()

    gen.generate(
        'Ventas Q1',
        range,
        author,
    )

    let output = formatConsoleCalls(logSpy)
    expect(output).toMatchSnapshot()
})
```

Es más, podemos crear todo un vocabulario:

```typescript
export class ReportGeneratorBuilder {
    private includeCharts: boolean = false
    private includeSummary: boolean = false

    withCharts(): ReportGeneratorBuilder {
        this.includeCharts = true
        return this
    }

    withoutCharts(): ReportGeneratorBuilder {
        this.includeCharts = false
        return this
    }

    withSummary(): ReportGeneratorBuilder {
        this.includeSummary = true
        return this
    }

    withoutSummary(): ReportGeneratorBuilder {
        this.includeSummary = false
        return this
    }

    build(): ReportGenerator {
        return new ReportGenerator(this.includeCharts, this.includeSummary)
    }
}
```

El patrón _Builder_ nos permite ocultar los detalles de construcción del objeto al resto de la aplicación. Así, si queremos que la configuración del reporte sea más escalable, podemos cambiarla sin afectar a la interfaz.

Supongamos que aplicamos _Introduce Parameter Object_ para construir `ReportGenerator`.

```typescript
interface ReportConfiguration {
    includeCharts: boolean
    includeSummary: boolean
}
```

Cambiamos la clase:

```typescript
export class ReportGenerator {
    private configuration: ReportConfiguration

    constructor(configuration: ReportConfiguration = {includeCharts: false, includeSummary: false}) {
        this.configuration = configuration
    }

    generateReport(
        title: string,
        startDate: Date,
        endDate: Date,
        includeCharts: boolean,
        includeSummary: boolean,
        authorName: string,
        authorEmail: string,
    ) {
        const range = new DateRange(startDate, endDate)
        const author = new Author(authorName, authorEmail)
        this.configuration = {
            includeCharts: includeCharts,
            includeSummary: includeSummary,
        }
        return this.generate(title, range, author)
    }

    generate(title: string, range: DateRange, author: Author) {
        console.log(`Generando reporte: ${title}`)
        console.log(range.print(`Desde {{startDate}} hasta {{endDate}}`))
        console.log(author.print(`Autor: {{name}} ({{email}})`))
        if (this.configuration.includeCharts) console.log('Incluyendo gráficos...')
        if (this.configuration.includeSummary) console.log('Incluyendo resumen...')
        console.log('Reporte generado exitosamente.')
    }
}
```

Y el Builder:

```typescript
export class ReportGeneratorBuilder {
    private includeCharts: boolean = false
    private includeSummary: boolean = false

    withCharts(): ReportGeneratorBuilder {
        this.includeCharts = true
        return this
    }

    withoutCharts(): ReportGeneratorBuilder {
        this.includeCharts = false
        return this
    }

    withSummary(): ReportGeneratorBuilder {
        this.includeSummary = true
        return this
    }

    withoutSummary(): ReportGeneratorBuilder {
        this.includeSummary = false
        return this
    }

    build(): ReportGenerator {
        const configuration = {
            includeCharts: this.includeCharts,
            includeSummary: this.includeSummary,
        }
        return new ReportGenerator(configuration)
    }
}
```

Pero el test, y todos los posibles consumidores, quedan exactamente igual:

```typescript
it('Generates a report with Value Objects', () => {
    const logSpy = vi.spyOn(console, 'log')

    const range = new DateRange(new Date('2025-01-01'), new Date('2025-03-31'))

    const author = new Author('Pat Smith', 'pat@example.com')

    const builder = new ReportGeneratorBuilder()
    const gen = builder.withCharts().build()

    gen.generate('Ventas Q1', range, author)

    let output = formatConsoleCalls(logSpy)
    expect(output).toMatchSnapshot()
})
```

#### Introduzcamos nuevos parámetros para construir ReportGenerator

En realidad, ahora es bastante fácil, no tenemos más que introducir un parámetro nuevo en el objeto de configuración:

```typescript
interface ReportConfiguration {
    includeCharts: boolean
    includeSummary: boolean
    pageSize: string
}
```

Y en el _Builder_ podemos añadir incluso validaciones para asegurar que el parámetro se define de forma explícita:

```typescript
export class ReportGeneratorBuilder {
    private includeCharts: boolean = false
    private includeSummary: boolean = false
    private pageSize?: string

    withCharts(): ReportGeneratorBuilder {
        this.includeCharts = true
        return this
    }

    withoutCharts(): ReportGeneratorBuilder {
        this.includeCharts = false
        return this
    }

    withSummary(): ReportGeneratorBuilder {
        this.includeSummary = true
        return this
    }

    withoutSummary(): ReportGeneratorBuilder {
        this.includeSummary = false
        return this
    }

    withPageSize(pageSize: string): ReportGeneratorBuilder {
        this.pageSize = pageSize
        return this
    }

    build(): ReportGenerator {
        if (!this.pageSize) {
            throw new Error('PageSize is required. Use withPageSize(\'A4\').')
        }
        const configuration = {
            includeCharts: this.includeCharts,
            includeSummary: this.includeSummary,
            pageSize: this.pageSize
        }
        return new ReportGenerator(configuration)
    }
}
```

Usar el parámetro significa que los tests actuales necesitan cambiar, pues se supone que este nuevo parámetro puede cambiar el comportamiento de `ReportGenerator`. Si nos interesa mantener el método deprecado `generateReport` seguramente querremos mantener el test y el viejo comportamiento. Por tanto, el método `generate` que, en último término es el que está siendo ejecutado, debería proporcionarnos alguna protección que asegure cierta protección.

Por ejemplo, ahora mismo si instanciamos directamente `ReportGenerator` (sin pasar por el Builder) y ejecutamos `generateReport`, el `pageSize` por defecto es 'A4'. Esto sería el comportamiento actual del sistema. Aunque no hemos mencionado nada de esto, podría ser perfectamente que 'A4' fuese el valor _hardcoded_ de la implementación deprecada. Así que, en lo tocante al test no tendría ningún efecto.

Podemos hacer esto explícito en el código, aunque sea temporalmente:

```typescript
export class ReportGenerator {
    private configuration: ReportConfiguration

    constructor(configuration: ReportConfiguration = {includeCharts: false, includeSummary: false, pageSize: 'A4'}) {
        this.configuration = configuration
    }

    // Code removed for clarity

    generate(title: string, range: DateRange, author: Author) {
        if (this.configuration.pageSize !== 'A4') {
            console.log(`Ajustando página a ${this.configuration.pageSize}...`)
        }
        console.log(`Generando reporte: ${title}`);
        console.log(range.print(`Desde {{startDate}} hasta {{endDate}}`))
        console.log(author.print(`Autor: {{name}} ({{email}})`))
        if (this.configuration.includeCharts) console.log('Incluyendo gráficos...')
        if (this.configuration.includeSummary) console.log('Incluyendo resumen...')
        console.log('Reporte generado exitosamente.')
    }
}
```

Y podríamos introducir un nuevo test para verificar pageSize:

```typescript
  it('Generates a report with custom page Size', () => {
    const logSpy = vi.spyOn(console, 'log')

    const range = new DateRange(new Date('2025-01-01'), new Date('2025-03-31'))
    const author = new Author('Pat Smith', 'pat@example.com')
    const builder = new ReportGeneratorBuilder()
    const gen = builder.withCharts().withPageSize('A5').build()

    gen.generate('Ventas Q1', range, author)

    let output = formatConsoleCalls(logSpy)
    expect(output).toMatchSnapshot()
  })
```

Que genera este resultado:

```
Ajustando página a A5...
Generando reporte: Ventas Q1
Desde Wed Jan 01 2025 hasta Mon Mar 31 2025
Autor: Pat Smith (pat@example.com)
Incluyendo gráficos...
Reporte generado exitosamente.
```

Por supuesto, cuando podamos dejar de dar soporte a `generateReport`, podríamos eliminar este tratamiento especial.

#### Parameter Object al rescate

En nuestro caso, queremos pasar el nuevo parámetro locale al método `generate` para poder generar informes en diferentes idiomas.

Como hemos visto, añadir un nuevo parámetro a la firma del método es una promesa de problemas en el futuro, por lo que debemos tomar medidas preventivas. Una vez que hemos agotado la capacidad de los _Value Objects_ para reducir la complejidad de la firma pasaremos a introducir _Parameter Objects_. Estos son básicamente DTOs en el sentido de que agrupan parámetros dispares para poder pasarlos  en una operación.

Como hicimos antes con `ReportConfiguration`, podemos crear un `ReportContent`:

```typescript
export interface ReportContent {
    title: string
    range: DateRange
    author: Author
}
```

Para introducir su uso de forma progresiva, empezaremos pasándolo como parámetro opcional. Si el lenguaje admite sobrecarga de métodos, no tienes más que crear un método con la nueva firma.

```typescript
generate(title: string, range: DateRange, author: Author, content?: ReportContent) {
    if (this.configuration.pageSize !== 'A4') {
        console.log(`Ajustando página a ${this.configuration.pageSize}...`)
    }
    console.log(`Generando reporte: ${title}`);
    console.log(range.print(`Desde {{startDate}} hasta {{endDate}}`))
    console.log(author.print(`Autor: {{name}} ({{email}})`))
    if (this.configuration.includeCharts) console.log('Incluyendo gráficos...')
    if (this.configuration.includeSummary) console.log('Incluyendo resumen...')
    console.log('Reporte generado exitosamente.')
}
```

Esto respeta los usos existentes y permite que puedas empezar a usarlo en el futuro. Aquí tenemos un ejemplo de cómo gestionar `title`: usaremos el de `content`, si existe, o el que se pasa por `title` si no existe.

```typescript
generate(title: string, range: DateRange, author: Author, content?: ReportContent) {
    if (this.configuration.pageSize !== 'A4') {
        console.log(`Ajustando página a ${this.configuration.pageSize}...`)
    }
    console.log(`Generando reporte: ${content?.title ?? title}`);
    console.log(range.print(`Desde {{startDate}} hasta {{endDate}}`))
    console.log(author.print(`Autor: {{name}} ({{email}})`))
    if (this.configuration.includeCharts) console.log('Incluyendo gráficos...')
    if (this.configuration.includeSummary) console.log('Incluyendo resumen...')
    console.log('Reporte generado exitosamente.')
}
```

Pero podemos hacerlo de una forma más sólida:

```typescript
generate(title: string, range: DateRange, author: Author, content?: ReportContent) {
    if (!content) {
        content = {
            title: title,
            range: range,
            author: author
        }
    }
    if (this.configuration.pageSize !== 'A4') {
        console.log(`Ajustando página a ${this.configuration.pageSize}...`);
    }
    console.log(`Generando reporte: ${content.title}`);
    console.log(content.range.print(`Desde {{startDate}} hasta {{endDate}}`))
    console.log(content.author.print(`Autor: {{name}} ({{email}})`))
    if (this.configuration.includeCharts) console.log('Incluyendo gráficos...')
    if (this.configuration.includeSummary) console.log('Incluyendo resumen...')
    console.log('Reporte generado exitosamente.')
}
```

Un nuevo test para verificar el comportamiento de `generate` con `content`:

```typescript
it('Generates a report using ReportContent object', () => {
    const logSpy = vi.spyOn(console, 'log')

    const range = new DateRange(new Date('2025-01-01'), new Date('2025-03-31'))
    const author = new Author('Pat Smith', 'pat@example.com')
    const builder = new ReportGeneratorBuilder()
    const content = {
        title: 'Updated Report',
        author: new Author('Jane Doe', 'jane@example.com'),
        range: new DateRange(new Date('2025-04-01'), new Date('2025-06-31')),
    }
    const gen = builder.withCharts().withPageSize('A5').build()

    gen.generate('Ventas Q1', range, author, content)

    let output = formatConsoleCalls(logSpy)
    expect(output).toMatchSnapshot()
})
```

Que genera este snapshot, donde podemos ver que se usan los datos pasados en `content`:

```
Ajustando página a A5...
Generando reporte: Updated Report
Desde Tue Apr 01 2025 hasta Tue Jul 01 2025
Autor: Jane Doe (jane@example.com)
Incluyendo gráficos...
Reporte generado exitosamente.
```

Ahora, extraeremos el cuerpo del método a otro método con la nueva signatura:

```typescript
generate(title: string, range: DateRange, author: Author, content?: ReportContent) {
    if (!content) {
        content = {
            title: title,
            range: range,
            author: author
        }
    }
    this.generateWithContent(content);
}

generateWithContent(content: ReportContent) {
    if (this.configuration.pageSize !== 'A4') {
        console.log(`Ajustando página a ${this.configuration.pageSize}...`);
    }
    console.log(`Generando reporte: ${content.title}`);
    console.log(content.range.print(`Desde {{startDate}} hasta {{endDate}}`))
    console.log(content.author.print(`Autor: {{name}} ({{email}})`))
    if (this.configuration.includeCharts) console.log('Incluyendo gráficos...')
    if (this.configuration.includeSummary) console.log('Incluyendo resumen...')
    console.log('Reporte generado exitosamente.')
}
```

De nuevo tenemos dos métodos alternativos, uno deprecable y otro para usar a partir de ahora y para ir refactorizando los usos existentes. Demos algunos retoques y cambiemos el test:

```typescript
it('Generates a report using ReportContent object', () => {
    const logSpy = vi.spyOn(console, 'log')

    const builder = new ReportGeneratorBuilder()
    const content = {
        title: 'Updated Report',
        author: new Author('Jane Doe', 'jane@example.com'),
        range: new DateRange(new Date('2025-04-01'), new Date('2025-06-31')),
    }
    const gen = builder.withCharts().withPageSize('A5').build()

    gen.generateWithContent(content)

    let output = formatConsoleCalls(logSpy)
    expect(output).toMatchSnapshot()
})
```

```typescript
export class ReportGenerator {
    private configuration: ReportConfiguration

    constructor(configuration: ReportConfiguration = {includeCharts: false, includeSummary: false, pageSize: 'A4'}) {
        this.configuration = configuration
    }

    generateReport(
        title: string,
        startDate: Date,
        endDate: Date,
        includeCharts: boolean,
        includeSummary: boolean,
        authorName: string,
        authorEmail: string,
    ) {
        const range = new DateRange(startDate, endDate)
        const author = new Author(authorName, authorEmail)
        this.configuration = {
            includeCharts: includeCharts,
            includeSummary: includeSummary,
            pageSize: this.configuration.pageSize,
        }
        return this.generate(title, range, author)
    }

    generate(title: string, range: DateRange, author: Author, content?: ReportContent) {
        if (!content) {
            content = {
                title: title,
                range: range,
                author: author
            }
        }
        this.generateWithContent(content);
    }

    generateWithContent(content: ReportContent) {
        if (this.configuration.pageSize !== 'A4') {
            console.log(`Ajustando página a ${this.configuration.pageSize}...`);
        }
        console.log(`Generando reporte: ${content.title}`);
        console.log(content.range.print(`Desde {{startDate}} hasta {{endDate}}`))
        console.log(content.author.print(`Autor: {{name}} ({{email}})`))
        if (this.configuration.includeCharts) console.log('Incluyendo gráficos...')
        if (this.configuration.includeSummary) console.log('Incluyendo resumen...')
        console.log('Reporte generado exitosamente.')
    }
}
```

Para introducir nuevos parámetros no tenemos más que añadir campos al `ReportContent`, parámetros que inicialmente pueden ser opcionales.

```typescript
export interface ReportContent {
    title: string
    range: DateRange
    author: Author
    locale?: string
}
```

## Conclusiones

_Long Parameter List_ es otro de esos _smells_ en el que vamos cayendo poco a poco hasta que la gestión de nuestro código se complica demasiado. Podemos atacarlo con varios refactors:

* _Introduce Value Object_ para agrupar parámetros que tienen una relación tal que podríamos considerar un _Data Clump_ y, por tanto, que podrían estar representando un concepto.
* _Introduce Parameter Object_ cuando los parámetros ya no tienen esa relación estrecha y necesitamos mantener una firma estable y fácil de gestionar aunque requiera varios parámetros.
* El patrón _Builder_ aplica a la firma de las funciones constructoras, permitiéndonos incluir un lenguaje de construcción expresivo y ocultar los detalles de esa construcción compleja. Incluso aunque finalmente la resolvamos con un _Parameter Object_.

En último término, estos objetos que introducimos nos protegen de futuros cambios de las firmas de los métodos cuando consideramos que son inestables o propensas a cambiar con facilidad.