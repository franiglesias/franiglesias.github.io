---
layout: post
title: ¿Cuantos parámetros por función?
categories: articles
tags: good-practices refactoring typescript ruby
---

Menos es más. O más es menos.

La firma o signatura de una función (o método) debería tener la menor cantidad de parámetros posible, especialmente si
estos se pasan por posición.

## Un momento. ¿Qué es esto de pasar parámetros por posición?

La signatura o firma de una función viene definida por tres elementos:

* Su nombre
* La lista de parámetros
* El tipo que retorna la función

La lista de parámetros es una colección de datos de diverso tipo que pasamos a la función o método para que pueda realizar su trabajo. En muchos lenguajes el orden en el que pasamos los parámetros importa, pues tiene que ser exactamente el que se haya definido.

Veamos este ejemplo en TypeScript (_bienvenido a este blog, Typescript_).

```typescript
class PersonName {
    constructor(
        private name: string,
        private firstSurname: string,
        private secondSurname?: string) {

    }

    listName() {
        return this.surname() + ', ' + this.name
    }

    surname() {
        if (this.secondSurname == undefined) {
            return this.firstSurname;
        }
        return [this.firstSurname, this.secondSurname].join(' ');
    }
}
```

Como puedes ver, el constructor admite tres parámetros, uno de los cuales es opcional. Estos parámetros se pasan posicionalmente. Por tanto, importa el orden en que los escribes. Si te fijas en el tercer test verás que si te equivocas en el orden, pasan cosas que no quieres.

```typescript
describe('Example of big signature', () => {
    it('should allow optional second surname', () => {
        const myName = new PersonName("Fran", "Iglesias");
        expect(myName.listName()).toEqual("Iglesias, Fran")

    })
    
    it('should produce a list name starting with surname', () => {
        const myName = new PersonName("Fran", "Iglesias", "Gómez");
        expect(myName.listName()).toEqual("Iglesias Gómez, Fran")
    })

    it('parameter order matters', () => {
        const myName = new PersonName('Iglesias', 'Fran', 'Gómez');
        expect(myName.listName()).toEqual("Iglesias Gómez, Fran")
    })
})
```

Pues que no se monta correctamente el nombre para listas:

```
Error: expect(received).toEqual(expected) // deep equality

Expected: "Iglesias Gómez, Fran"
Received: "Fran Gómez, Iglesias"
```

En este caso, los tres parámetros son `strings`, lo que puede hacer que el problema pase desapercibido. En otros casos, no coincidirán los tipos y aparecerán errores.

La alternativa son los parámetros con nombre, que algunos lenguajes soportan de forma nativa. Es el caso de Ruby, lenguaje en el que los parámetros con nombre se definen como se puede ver en el ejemplo:

```ruby
class PersonName
    def initialize(name:, first_surname:, second_surname:nil)
        @name = name
        @first_surname = first_surname
        @second_surname = second_surname
    end

    def list_name
        [@first_surname,@second_surname].join(' ') + ', ' + @name
    end
end
```

Esta clase puede usarse así:

```ruby
PersonName.new(name:"Fran", first_surname:"Iglesias", second_surname:"Gómez").list_name
```

Y da igual el orden:

```ruby
PersonName.new( second_surname:"Gómez", name:"Fran", first_surname:"Iglesias").list_name
```

Por supuesto, Ruby no te obliga a usar parámetros por nombre y admite parámetros posicionales. En fin, cada lenguaje tiene sus propias reglas y costumbres al respecto.

## Pero, ¿por qué? ¿Qué importancia tiene?

La importancia de esto reside en que las funciones con parámetros posicionales son más difíciles de procesar cognitivamente que las que usan parámetros con nombre. Pero es que, además, generan más acoplamiento en el código.

Esto es así porque en el caso de las funciones con parámetros posicionales es necesario conocer más información que cuando los parámetros tienen nombre. Desde la óptica de Orientación a Objetos, el consumidor tiene que saber más detalles para enviar mensajes a otros objetos. Cuantos más detalles, mayor es el acoplamiento.

Podemos asumir que las funciones o métodos con cero o un parámetro suponen el mismo grado de acoplamiento en ambos modos. Pero empezaremos a ver las diferencias a partir de dos parámetros:

Así, si son posicionales, tenemos que saber qué parámetro es, cual es su tipo y qué posición ocupa. Serían 3 unidades de información por parámetro, 6 en total.

Si van por nombre, tenemos que recordar qué parámetro es y su tipo, pero la posición no nos importa para nada. En este caso, como mucho son 2 unidades de información por parámetro, 4 en total. Para 3 parámetros, la diferencia es de 9 unidades contra 6. Para cuatro parámetros 12 unidades contra 8.

A estas cantidades hay que sumar al menos un punto más, que corresponde al nombre de método o función, y si devuelve uno o más valores de retorno.

La carga cognitiva de las funciones podría calcularse más o menos del mismo modo. El problema es que, si bien al intérprete o compilador del lenguaje le da igual el número de parámetros, a nuestro cerebro no solo le cuesta más recordar y procesar una función con muchos parámetros, sino que a partir de cierto punto no puede hacerlo solo con la memoria de trabajo. Existe una limitación en la cantidad de unidades de información que podemos mantener simultáneamente en nuestra memoria de trabajo. Si bien es cierto que esas unidades de información pueden tener un tamaño variable, es la cantidad de ellas que podemos manejar a la vez la que tiene un límite. Ese límite rondaría los siete elementos, aunque depende de muchos factores.

Por esa razón, las funciones o métodos con más de tres parámetros son especialmente difíciles de gestionar para nosotras, ya que superan ampliamente el número de unidades de información. Hasta dos parámetros nos sentimos cómoda. Las de tres se pueden considerar aceptables. De cuatro y en adelante, lo más seguro es que tengamos que consultar documentación de referencia. Y el efecto es más acusado cuando los parámetros son posicionales, que serían aún más costosos.

## Cómo reducir el número de parámetros

Para mejorar el código que usa funciones con muchos parámetros podríamos aplicar varias acciones que veremos a continuación.

Por cierto, en todos los casos voy a mostrar una variante del refactor llamado `Wrap method`. Esencialmente, consiste en crear una nueva función con la nueva firma, pero que llama a la que ya existía. De este modo, si la anterior tiene consumidores estos no se verán afectados y no hay que cambiar nada. En cambio, podemos empezar a usar la nueva versión inmediatamente e ir migrando las demás llamadas a medida que sea posible o que tenga sentido.

### Dar nombre a los parámetros

Empecemos con este ejemplo, que es bastante simple:

```typescript
function rectangle_area(x: number, y: number, xx: number, yy: number) {
    const width = xx - x
    const height = yy - y
    return width * height
}

describe('Rectangle calculations', () => {
    it ('should calculate area', () => {
        const area = rectangle_area(3, 4, 10, 15);
        expect(area).toEqual(77)
    })
})
```

En este caso, puede que pasar variables con el nombre de los parámetros en vez de los valores nos ayuda a explicar mejor lo que estamos haciendo. Pero, a la vez, añade ruido.

```typescript
function rectangle_area(x: number, y: number, xx: number, yy: number) {
    const width = xx - x
    const height = yy - y
    return width * height
}

describe('Rectangle calculations', () => {
    it ('should calculate area', () => {
        let x = 3
        let y = 4
        let xx = 10
        let yy = 15
        const area = rectangle_area(x, y, xx, yy);
        expect(area).toEqual(77)
    })
})
```

En los lenguajes en los que sea posible, merece la pena utilizar parámetros con nombre. Esto reduce la carga cognitiva y aligera un poco el acoplamiento. No es la solución ideal, pero es mejor que nada.

```ruby
def rectangle_area(x:, y:, xx:, yy:)
    width = xx - x
    height = yy - y
    return width * height
end

describe 'Rectangle area' do
    it 'should calculate area' do
        area = rectangle_area(x:3, y:4, xx:10, yy:15)
    end
end
```

Una alternativa podría ser introducir una especie de Request Object, que sería un DTO y que agrupe todos los parámetros. Entonces la función recibiría este objeto como único parámetro y podrías acceder por nombre a sus propiedades. 

```typescript
function rectangle_area(x: number, y: number, xx: number, yy: number) {
    const width = xx-x
    const height = yy - y
    return width * height
}

function calculate_area(rectangle: { xx: number; yy: number; x: number; y: number }) {
    return rectangle_area(rectangle.x, rectangle.y, rectangle.xx, rectangle.yy)
}

describe('Rectangle calculations', () => {
    it ('should calculate area using object', () => {
        const rectangle = {
            x: 3,
            y: 4,
            xx: 10,
            yy: 15,
        }
        const area = calculate_area(rectangle);
        expect(area).toEqual(77)
    })
})
```

Puede que no sea la mejor idea, puesto que lo que te estoy diciendo es agrupar parámetros cuyo único punto en común es ser necesarios para invocar una función. Sin embargo, bien usado, tiene algunas ventajas prácticas. La firma de la función tiene un único parámetro, lo cual me ha resultado útil al refactorizar, pues de este modo puedo jugar con los datos que paso a través de este objeto. En cualquier caso, normalmente lo uso en métodos privados por lo que su alcance es limitado.

Una nota sobre Golang es que en el caso de que la función requiera contexto, no lo incluyas con los demás parámetros. Mantenlo siempre separado.

### Agrupar parámetros: _parameter object_

Lo que nos interesa es reducir el número de parámetros y para ello nos vendría bien agruparlos en unidades significativas. De hecho, esto reduce la carga cognitiva y es lo que hacemos las personas, agrupando información para recordarla mejor.

En este ejemplo, la firma de la función que calcula el área de un rectángulo, puede reescribirse para esperar objetos que son pares de coordenadas. No solo reducimos la complejidad de la firma, sino que es mucho más semántica ahora. 

```typescript
import fn = jest.fn;

function rectangle_area(x: number, y: number, xx: number, yy: number) {
    const width = xx-x
    const height = yy - y
    return width * height
}

interface Coordinates {
    x: number
    y: number
}

function calculate_area_from_coords(upperLeft: Coordinates, bottomRight: Coordinates):number {
    return rectangle_area(upperLeft.x, upperLeft.y, bottomRight.x, bottomRight.y)
}

describe('Rectangle calculations', () => {
    it('should calculate area with value objects', () =>{
        let upperLeft = {x: 3, y: 4};
        let bottomRight = {x: 10, y: 15};
        
        const area = calculate_area_from_coords(upperLeft, bottomRight);
        expect(area).toEqual(77)
    })
})
```

Es frecuente que cuando tenemos que manejar muchas variables algunas de ellas siempre vayan juntas por alguna razón. Esto es un code smell llamado _Data Clump_ y la solución es introducir un objeto o struct que las agrupe. El ejemplo que acabamos de ver es un caso claro: un par de coordenadas siempre va a ir junto.

### Whole object

A veces obtenemos datos de un objeto para pasarlos a una función. Si son uno o dos, puede ser aceptable, pero cuando son más nos está hablando de un problema de diseño. En esos casos, es preferible pasar el objeto y que sea la función la que hable con él directamente.

O a lo mejor es un caso de violación de _Tell, don't ask_ y lo adecuado sería que el objeto realice el cálculo por sí mismo.

```typescript
class Rectangle {
    upperLeft: Coordinates
    bottomRight: Coordinates

    constructor(upperLeft: Coordinates, bottomRight: Coordinates) {
        this.upperLeft = upperLeft;
        this.bottomRight = bottomRight;
    }

    static fromRaw(x: number, y: number, xx: number, yy: number) {
        const ul = {x: x, y: y};
        const br = {x: xx, y: yy}
        return new Rectangle(ul, br)
    }

    area() {
        const width = this.bottomRight.x - this.upperLeft.x;
        const height = this.bottomRight.y - this.upperLeft.y;
        return width * height
    }
}

describe('Rectangle calculations', () => {
    it('should calculate area as object', () => {
        let upperLeft = {x: 3, y: 4};
        let bottomRight = {x: 10, y: 15};

        const rect = new Rectangle(upperLeft, bottomRight);
        expect(rect.area()).toEqual(77)
    });
})
```

## Patrón builder

El patrón builder puede ser útil cuando el problema de exceso de parámetros ocurre en el constructor. Los constructores con muchos parámetros pueden estar revelando problemas de diseño grandes, pero puede haber situaciones que los justifiquen. En esos casos, me gusta introducir un patrón builder. Hay un par de artículos en el blog, [este en PHP](/builder_pattern/) y [este en Golang](/builder-golang/).

Siguiendo con el mismo ejemplo:

```typescript
class RectangleBuilder {
    upperLeft: Coordinates
    bottomRight: Coordinates

    fromUpperLeft(x, y) {
        this.upperLeft = {x: x, y: y}
    }

    toBottomRight(x, y) {
        this.bottomRight = {x: x, y: y}
    }
    build() {
        return new Rectangle(this.upperLeft, this.bottomRight)
    }
}
```

Y se usaría así. Como se puede ver, este uso nos permite ignorar los detalles de construcción del rectángulo y nos proporciona una interfaz más fácil de entender. El builder se encarga de los detalles de _intendencia_, para entregarnos objetos listos para usar.

```typescript
describe('Rectangle calculations', () => {
    it('should calculate area using builder', () => {
        let rectangleBuilder = new RectangleBuilder()
        rectangleBuilder.fromUpperLeft(3, 4)
        rectangleBuilder.toBottomRight(10, 15)

        const rect = rectangleBuilder.build();
        expect(rect.area()).toEqual(77)
    });
})
```

## Conclusiones

En este artículo hemos visto algunas formas de abordar el problema de funciones con muchos parámetros, considerando también las razones que las hacen problemáticas y por qué es recomendable refactorizarlas.

