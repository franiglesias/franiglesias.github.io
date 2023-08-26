---
layout: post
title: Tipos vs Value Objects
categories: articles
tags: design-patterns oop
---

Todos los lenguajes de programación nos proporcionan tipos de datos para representar la información en nuestros desarrollos. Sin embargo, no siempre son suficientes.

Al comenzar a estudiar un lenguaje casi podemos dar por hecho que nos encontraremos varios tipos nativos. Por lo general, damos por sentado que podremos contar con:

* Boolean, para representar estados binarios (verdadero/falso, presente/ausente...)
* Enteros y coma flotante, para representar información numérica.
* String, para representar información en forma de texto.
* Uno o más tipos para representar colecciones de otros tipos (array, hash).

Cada lenguaje varía en tanto en la forma de denominarlos como en aportar más opciones a esta colección. Así, por ejemplo, es frecuente encontrar el tipo `byte`, o distinciones del tipo `short integer` frente a `long`. Estos últimos ejemplos se refieren siempre a números enteros, y esta separación nos permite un uso más eficiente de la memoria.

Y también hay tipos que nos permiten combinar otros. Es el caso de `struct` o `record`, que suelen usarse para definir tipos compuestos por otros simples.

Por supuesto, es importante conocer el sistema de tipos nativo del lenguaje de programación, a los que solemos llamar primitivos. He encontrado varias definiciones de los mismos. Una muestra:

* son aquellos que se guardan en el stack de ejecución y no como una referencia en memoria.
* son aquellos que no son objetos, por lo que no tienen métodos ni propiedades (en Javascript)
* son los tipos de información más básicos.

En algunos lenguajes los tipos primitivos lo son en más de un sentido. Por ejemplo, un lenguaje como PHP que mezcla un paradigma procedural con un paradigma orientado a objetos, tiene tipos primitivos que no son objetos. Por su parte, en Ruby los tipos primitivos son objetos, porque todo en un Ruby es un objeto.

Básicamente, los tipos primitivos son tipos de datos proporcionados por el lenguaje que no podemos descomponer en otros más simples, o que no podríamos representar mediante otros tipos primitivos.


## Tipos y conceptos de dominio

Cuando estamos desarrollando un programa es fácil encontrarnos con algunas limitaciones del sistema de tipos a la hora de usarlos para representar los conceptos del dominio con el que trabajamos.

* **Tipos demasiado genéricos**. Por ejemplo, `integer` sirve para representar números enteros, pero ¿qué pasa, por ejemplo, si el concepto de dominio solo necesita números naturales? En general, muchos valores que tenemos que representar se encuentran circunscritos en un rango bien definido, con unas normas claras que definen sus valores adecuados.
* **Tipos combinados**. Como mencionábamos antes, muchas veces necesitamos combinar varios datos de distinto tipo para representar un concepto. Un ejemplo típico y tópico es un precio que precisa de un valor de coma flotante para representar la cantidad y otro, que suele ser un `string`, para representar la unidad monetaria.

Para subsanar estas limitaciones podemos recurrir a diversas técnicas.

En el caso de que un tipo sea demasiado genérico para nuestras necesidades, podemos controlar que los valores usados cumplen las restricciones de nuestro dominio usando reglas de validación.

En el segundo caso, podemos recurrir a estructuras del lenguaje que nos permitan combinar distintos tipos de datos. 

Si nuestro enfoque es orientado a objetos resulta bastante obvio lo que podemos hacer: definir nuestros propios tipos de datos como objetos y encapsular sus requisitos y comportamientos. A veces, a esto lo llamamos _Value Object_, pero permíteme decirte que no siempre es correcto llamarlos así.

De hecho, en OOP se recomienda que nunca utilicemos directamente un tipo de dato nativo del lenguaje, o incluso aportado por alguna libería o dependencia. Y esto, ¿por qué?

En primer lugar, es necesario que hagamos una distinción entre un tipo de dato y un concepto de dominio. Y en este caso cuando hablo de dominio me refiero a dominio en el sentido amplio del problema que estamos resolviendo, no de una _capa_ de un cierto modelo de arquitectura.

Un concepto es una idea abstracta que podemos implementar de diferentes formas en un programa. Volviendo al ejemplo del precio, podríamos representarlo con un valor de tipo `float` y otro de tipo `string`, representando la unidad monetaria, o con un objeto que encapsule ambos, o con un `struct`, o con un `diccionario` o un `array`.

```php
$priceAmount = 1234.45;
$priceCurrency = 'EUR';
```

```php
$price = [
   'amount' => 1234.45,
   'currency' => 'EUR',
];
```

```go
type Price struct {
	Amount float32,
	Currency string,
}
```

Elegir una u otra representación tiene consecuencias. El código consumidor quedará acoplado a esa representación. ¿Qué ocurre si queremos cambiarla? Pues que el código consumidor tendrá que cambiar.

La mejor forma de evitar eso es encapsular la representación en un objeto, exponiendo una interfaz. Al fin y al cabo, un concepto es una abstracción y, como tal, tiende a permanecer estable en cuanto a los comportamientos que exhibe.

```php
class Price 
{
    private float $amount;
    private string $currency;
    
    public function __construct(float $amount, string $currency) {
        $this->amount = $amount;
        $this->currency = $currency;
    }
}

$priceOfProduct = new Price(1235.56, "EUR");
```

Así, por ejemplo, de un precio podríamos esperar que nos permita aplicar descuentos o incrementos, calcular importes (otro concepto) u obtener una representación visual. Algo así:

```
Price
Price.withDiscount
Price.withTax
Price.print
```

Desde el punto de vista del código consumidor no importa el modo en que se representa internamente el estado de un objeto `Price`. Son detalles de implementación en los que no está interesado. Confía en que los objetos `Price` saben hacer su trabajo.

Cuando optamos por encapsular primitivos en objetos lo que logramos es minimizar el acoplamiento de un concepto a una implementación. El objeto actúa como una frontera que permite tanto al código consumidor como a la implementación del concepto evolucionar de forma separada.

## ¿Podemos crear un sistema de tipos como base de nuestros Value Objects?

En lenguajes como PHP es tentador crear un sistema de tipos basado en objetos, ya que los tipos primitivos no lo son. Hacerlo así aporta varias ventajas, como pueden ser asegurar que el comportamiento de esos tipos es consistente.

Los números de coma flotante suelen exponer ese tipo de problemas de inconsistencia. Si en nuestro dominio tenemos que manejar un cierto nivel de precisión nos podemos encontrar con que los cálculos muestran diferencias dependiendo del entorno concreto de ejecución.

Una posible solución es crear nuestra propia implementación. Frecuentemente, a base de tener una representación interna del valor como entero junto con un indicador de precisión. Visto desde el exterior el objeto acepta y devuelve números de coma flotante y hace el cálculo al vuelo.

Otra solución es acudir a librerías que atajan el problema. Pero incluso en ese caso, es buena idea ocultar esa implementación en nuestros propios objetos para desacoplarnos de ella.

Ahora bien, lo que no debemos hacer nunca es extender estos tipos base para crear _Value Objects_. Primero veremos por qué y después la mejor manera de implementarlos.

### Conceptos de dominio vs tipos de datos

En primer lugar, recordemos la distinción entre tipos de datos y conceptos de dominio. 

Los tipos de datos son proporcionados por el lenguaje como medio para representar y manipular ciertos tipos de información. Por supuesto, podemos utilizarlos como bloques de construcción de los conceptos de nuestro dominio. Pero por sí mismos no pueden representar ningún concepto.

Un concepto de dominio es la abstracción de un elemento de la realidad que nos interesa para modelar la solución de un determinado problema. Este concepto se expresa en código utilizando los recursos que el lenguaje ofrece, incluyendo distintos tipos de datos. Esta representación puede ser una Entidad (algo que nos interesa por su identidad) o un Value Object (algo que nos interesa por su valor).

Veamos un ejemplo. ¿Podríamos decir que la siguiente expresión representa un concepto de algún dominio?

```php
$price = 1234.45;
```

En parte sí, pero porque nosotros sabemos que con la variable `$price` queremos representar un precio. El programa en sí no lo sabe, ni lo puede saber. Imagina qué pasa si en lugar de llamar `$price` a la variable, la hubiésemos llamado de otra forma:

```php
$bilitri = 1234.45;
```

El nombre es absurdo, por supuesto, pero quiero ilustrar un argumento: leyendo el código solo podemos saber que es un valor de tipo `float`. A primera vista es imposible saber si es un precio, o una distancia, o un importe, o el peso de una mercancía.

Ahora, plantémoslo de forma diferente:

```php
$bilitri = new Price(1235.56, "EUR");
```

Independientemente del nombre que tenga la variable (obviamente, debería ser descriptivo), leyendo el código podemos saber que está representando un concepto.

### Liskov

Pero vayamos al problema de por qué no debemos extender Value Object de tipos primitivos, o incluso de tipos base que hayamos definido. Y la razón no es otra que el _principio de sustitución de Liskov_.

El meollo de este principio es que en una jerarquía de tipos, los subtipos deben poder sustituir a los tipos base. Pero no solo de una manera, digamos, estructural, sino comportamental.

Supongamos que queremos representar el concepto Distancia. Dejando aparte el hecho de que debemos tener en cuenta la unidad de medida, la cantidad de distancia se puede representar mediante un tipo _float_. Imaginemos que disponemos de un tipo base `Float`. El siguiente código _parece_ razonable, ya que nos permite acceder a los comportamientos de `Float`, por ejemplo, para hacer cálculos.

```php
class Distance extends Float
{
}
```

La pregunta que tenemos que hacernos es: ¿podríamos usar el tipo `Distance` en lugar de `Float`?. La respuesta es que no. `Distance` no puede ser negativo dado que no hay distancias negativas. Sin embargo, un número de coma flotante puede ser negativo.

La clave es que una distancia **no es** un número de coma flotante, sino un concepto que puede ser representado con un número de coma flotante, y esto es algo completamente distinto. Veámoslo en código:

```php
class Distance
{
    private Float $amount;
    
    public function __construct(Float $amount) {
        if ($amount->isLowerThan(0)) {
            throw new InvalidArgumentException('Distance cannot be negative');
        }
        $this->amount = $amount;
    }
}
```

En este caso tenemos una composición de objetos en la que el concepto distancia está claramente representado por los objetos de clase `Distance`, y cuya propiedad de cantidad se modela con un objeto de tipo `Float`. Gracias a este diseño tenemos que:

* `Distance` tiene sus propias reglas de validación.
* Podemos implementar operaciones usando el comportamiento de `Float`.
* `Distance` puede evolucionar de forma totalmente independiente de `Float`. Por ejemplo, admitiendo una propiedad para representar la unidad de medida.
* `Distance` no expone comportamientos heredados de Float que no le son aplicables.

### Familias demasiado extensas

Otro de los inconvenientes derivados de extender tus _Value Objects_ a partir de tipos básicos es que acoplas todo con todo. Haces que conceptos totalmente dispares queden vinculados entre sí.

Esto introduce numerosos problemas. Para empezar esta forma de trabajar hace que sea más difícil comprender y razonar sobre el código. Los objetos tendrán comportamientos heredados de la clase base que no les corresponden y que, en algunos casos, podrían estar ahí para servir a otros objetos que no tienen semánticamente nada que ver.

Además, introduce complicaciones a la hora de hacer evolucionar las implementaciones de los conceptos, especialmente si necesitamos extraer a uno de ellos de la jerarquía. Por no hablar, de la complejidad que supone intentar modularizar el código en esas condiciones.

## En resumen

Usar _Value Objects_ para representar conceptos de un dominio es una gran idea. Pero es muy importante tener en cuenta que deben ser implementados sin dependencias fuertes de objetos genéricos o primitivos, como ocurre cuando los derivamos de estos.

En su lugar, usa los tipos primitivos para implementar las propiedades de los _Value Objects_ usando composición. De este modo, aflojas el acoplamiento al máximo, especialmente si usas interfaces en vez de implementaciones concretas.

El resultado será un diseño más flexible, expresivo y resiliente al cambio.
