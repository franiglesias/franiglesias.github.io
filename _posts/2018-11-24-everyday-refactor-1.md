---
layout: post
title: Refactor cotidiano (1). Fuera comentarios
categories: articles
tags: good-practices refactoring
---

La primera entrega de la guía del refactor cotidiano trata sobre los comentarios.

## Comentarios y documentación

Los lenguajes de programación incluyen la posibilidad de insertar comentarios en el código como forma de añadir documentación al mismo. Es decir: el objetivo de los comentarios es añadir conocimiento cerca del lugar en el que puede ser necesario.

Los comentarios en el código parecen una buena idea y, probablemente, lo eran en otros tiempos, cuando la necesidad de economizar recursos y las limitaciones de los lenguajes de programación no nos permitían escribir un código lo bastante expresivo como para ser capaz de documentarse a sí mismo.

En esta entrega, intentaremos explicar qué comentarios nos sobran y por qué, y cuales dejar.

### ¿Por qué deberías eliminar comentarios?

Las principales razones para borrar comentarios son:

**Suponen una dificultad añadida para leer el código**. En muchos aspectos, los comentarios suponen una narrativa paralela a la del código y nuestro cerebro tiende a enfocarse en una de las dos. Si nos enfocamos en la de los comentarios, no estamos leyendo el código. Si nos enfocamos en la del código: ¿para qué queremos comentarios?

**Los comentarios suponen una carga cognitiva**. Incluso leyéndolos con el rabillo del ojo, los comentarios pueden suponer una carga cognitiva si, de algún modo, discrepan con lo que el código dice. Esto puede interrumpir tu flujo de lectura hasta que consigues aclarar si ese comentario tiene algún valor o no.

**Pueden alargar innecesariamente un bloque de código**. Idealmente deberías poder leer un bloque de código en una pantalla. Los comentarios añaden líneas que podrían provocar que tengas que deslizar para ver todo el bloque. Son especialmente problemáticos los que están intercalados con las líneas de código.

**Pueden mentir**. Con el tiempo, si no se hace mantenimiento de los comentarios, éstos acaban siendo mentirosos. Esto ocurre porque los cambios en el código no siempre son reflejados con cambios en los comentarios por lo que llegará un momento en que unos y otro no tengan nada que ver.

## Refactor de comentarios

### Básico

Simplemente eliminamos los comentarios que no necesitamos. Es un refactor completamente seguro ya que no afecta de ningún modo al código.

### Reemplazar comentarios por mejores nombres

Eliminamos comentarios obvios, redundantes o innecesarios, cambiando el nombre de los símbolos que tratan de explicar.

**Cambiar nombres** es un refactor muy seguro, sobre todo con la ayuda de un buen IDE, que puede realizarlo automáticamente, y dentro de ámbitos seguros, como método o variables privadas.

### Reemplazar comentarios por nuevas implementaciones

En algunos casos podríamos plantearnos mejorar el diseño de una parte del código porque al reflexionar sobre la necesidad de mantener un comentario nos damos cuenta de que es posible expresar la misma idea en el código.

Este tipo de refactor no encaja en la idea de esta serie sobre refactor cotidiano, pero plantea el modo en que los pequeños refactors del día a día van despejando el camino para refactors e incluso reescrituras de mayor alcance.

### Comentarios redundantes

Los comentarios redundantes son aquellos que nos dicen lo que ya dice el código, por lo que podemos eliminarlos.

Por ejemplo:

```php
// Class to represent a Book
class Book
{
    //...
}
```

En serio, ¿qué nos aporta este comentario que no esté ya expresado?

```php
class Book
{
    //...
}
```

Los lenguajes tipados, que soportan *type hinting* y/o *return typing*, nos ahorran toneladas de comentarios.

```php
class Book
{
    /**
    * Creates a book with a title and an author
    *
    * @param string $title
    * @param Author $author
    * @returns Book
    */
    public static function create(string $title, Author $author): Book
    {
        //
    }
}
```

Los tipos de los parámetros y del objeto devuelto están explícitos en el código, por lo que es redundante que aparezcan como comentarios.

```php
class Book
{
    /**
    * Creates a book with a title and an author
    */
    public static function create(string $title, Author $author): Book
    {
        //
    }
}
```


**Excepciones**: este tipo de comentarios tiene su razón de ser cuando el lenguaje no es tipado o no tiene protección de tipos.

Elimina comentarios redundantes poniendo mejores nombres:

```php
class Book
{
    /**
    * Creates a book with a title and an author
    */
    public static function create(string $title, Author $author): Book
    {
        //
    }
}
```

Con un nombre expresivo ya no necesitamos comentario:

```php
class Book
{
    public static function withTitleAndAuthor(string $title, Author $author): Book
    {
        //
    }
}
```

Y podemos usar el objeto así, lo cual documenta perfectamente lo que está pasando:

```php
$newBook = Book::withTitleAndAuthor($title, $author);
```

**Más excepciones**: si lo que estamos desarrollando es una librería que pueda utilizarse en múltiples proyectos, incluso que no sean nuestros, los comentarios que describen lo que hace el código pueden ser necesarios.

### Comentarios mentirosos

Los comentarios mentirosos son aquellos que dicen algo distinto que el código. Deben desaparecer.

¿De dónde vienen los comentarios mentirosos? No, no los han escrito psicópatas para amargarte la vida. Simplemente ha ocurrido que los comentarios se han quedado olvidados, sin mantenimiento, mientras que el código ha evolucionado. Por eso, cuando los lees hoy es posible que digan cosas que ya no valen para nada.

Este hecho debería bastar para que no añadas nuevos comentarios sin una buena razón. Tendemos a ignorar los comentarios triviales, de modo que cuando cambiamos el código nos despreocupamos de mantenerlos actualizados y acaban siendo mentirosos. Así que procuraremos dejar sólo aquellos comentarios que nos importen realmente.

Si ya nos hemos librado de los comentarios redundantes, deberíamos contar sólo con los que pueden aportar alguna información útil, así que nos toca examinarlos para asegurarnos de que no sean mentirosos. Y serán mentirosos si no nos cuentan lo mismo que cuenta el código.

Puede parecer un poco absurdo, pero al fin y al cabo los comentarios simplemente están ahí y nos les prestamos mucha atención, salvo que sea la primera vez que nos movemos por cierto fragmento de código y tratamos de aprovechar cualquier información que nos parezca útil. Es entonces cuando descubrimos comentarios que pueden oscilar entre lo simplemente desactualizado y lo esperpéntico.

Así que, fuera con ellos. Algunos ejemplos:

**To-dos olvidados**. Las anotaciones **To do** seguramente hace meses que han dejado de tener sentido. Mienten en tanto que no tenemos ninguna referencia que les aporte significado. 

¿De qué otro tipo de servicio estábamos hablando aquí hace tres meses? ¿Será que ya lo hemos cambiado?

```php
// @todo we should use another kind of service here

$service = new Service();
$service->execute();
```

**Comentarios olvidados**. En algunos casos puede ocurrir que simplemente nos hayamos dejado comentarios olvidados. Por ejemplo, podríamos haber usado comentarios para definir las líneas básicas de un algoritmo y ahí se habrían quedado. Todo ello también tiene que desaparecer:

```php
public function calculateFee(Request $dataToCalculate)
{
    // Normalize amounts to same currency
    
    // ... code here
    
    // Perform initial calculation
    
    // ... more code here
    
    // Apply transormation
    
    // .., more code here
}

```

**Comentarios para estructurar código**. Claro que puede que el algoritmo sea lo bastante complejo como para que necesitemos describir sus diferentes partes. En este caso, lo que hacemos es extraer esas partes a métodos privados con nombres descriptivos, en lugar de usar comenntarios:

```php
public function calculateFee(Request $dataToCalculate)
{
    $this->normalizeAmountsToTheSameCurrency($dataToCalculate);
    $initialCalculation = $this->performInitialCalculation($dataToCalculate);
    $transformedResponse = $this->applyTransformation($initialCalculation);
}

```

De este modo el código está estructurado y documentado.

**Comentarios sobre valores válidos**. Consideremos este código:

```php
// Valid values: started, paused, running, terminated
public function updateStatus(string $newStatus): void
{
    $this->checkValidStatus($newStatus);
    $this->status = $newStatus;
}
```

El comentario delimita los valores aceptables para un parámetro, pero no fuerza ninguno de ellos. Eso tenemos que hacerlo mediante una cláusula de guarda. ¿Hay una forma mejor de hacerlo?

Por supuesto: crear un enumerable.

```php
class Status
{
    private const STARTED = 'started';
    private const PAUSED = 'paused';
    private const RUNNING = 'running';
    private const TERMINATED = 'terminated';
    
    private $value;
    
    private function __construct(string $status)
    {
        $this->checkValidStatus($status);
        $this->status = $status;    
    }
    
    public static function fromString(string $status): Status
    {
        return new self($status);
    }
    
    public static function started(): Status
    {
        return new self(self::STARTED);
    }
    
    //...
}
```

Lo que permite eliminar el comentario, a la vez que tener una implementación más limpia y coherente:

```php
public function updateStatus(Status $newStatus): void
{
    $this->status = $newStatus;
}
```

### Código comentado

En alguna parte he escuchado o leído algo así como "código comentado: código borrado". El código comentado debería desaparecer. Lo más seguro es que ya nadie se acuerde de por qué estaba ese código ahí, para empezar, y por qué sigue aunque sea escondido en un comentario.

Si es necesario recuperarlo (spoiler: no lo será) siempre nos queda el control de versiones.

**Excepciones**: dentro de un límite temporal estricto, puede ser una manera de explorar los efectos de suprimir un fragmento de código o desactivar una característica en tanto no se pueda tomar una decisión firme sobre ella. Pero debería desaparecer enseguida, antes de integrarse en el master.

## Comentarios que podríamos conservar… o no

### Comentarios que explican decisiones

Los buenos comentarios deberían explicar por qué tomamos alguna decisión que no podemos expresar mediante el propio código y que, por su naturaleza, podríamos considerar como independientes de la implementación concreta que el código realiza. Es decir, no deberíamos escribir comentarios que expliquen cómo es el código (algo que ya podemos ver), sino que explique por qué es así.

Lo normal es que estos comentarios sean pocos pero relevantes, lo cual los pone en una buena situación para realizar un mantenimiento activo de los mismos.

Obviamente corremos el riesgo de que los comentarios se hagan obsoletos si olvidamos actualizarlos cuando sea necesario. Por eso la importancia de que no estén "acoplados" a la implementación en código.

Un ejemplo de comentario relevante podría ser éste:

```php

// We apply taxes to conform the procedure stated in law RD 2018/09
public function applyTaxes(Money $totalAmountBeforeTaxes): Money
{
    //... some code here
}
```

Este comentario es completamente independiente del código e indica una información importante que no podríamos expresar con él. Si en un momento dado cambia la legislación y debemos aplicar otra normativa, podemos cambiar el comentario.

Aunque, a decir verdad, podríamos llegar a expresarlo en código. A grandes rasgos:

```php

interface Taxes
{
    public function apply(Money $amountBeforeTaxes): Money;
}

class RD201809Taxes implements Taxes
{
    public function apply(Money $amountBeforeTaxes): Money
    {
        // ... some code here
    }
}


class RD201821Taxes implements Taxes
{
    public function apply(Money $amountBeforeTaxes): Money
    {
        // ... some code here
    }
}
```


## Dudas razonables

### Comentarios para el IDE

En aquellos lenguajes en los que el análisis estático por parte del IDE no pueda interpretar algunas cosas, añadir comentarios en forma de anotaciones puede suponer una ayuda para el IDE. En algunos casos, gracias a eso el IDE nos avisa de problemas potenciales antes de integrar los cambios.

No debería ser una práctica común, pero es un compromiso aceptable. Por ejemplo, en PHP solemos indicar el tipo de las propiedades de los objetos y otras variables con comentarios, ya que el lenguaje no permite (todavía) hacerlo en código. Sin embargo, dentro de unas pocas versiones será posible eliminarlos:

```php
class Status
{
    /** string **/
    private $value;
}
```

Algún día, podremos hacer esto

```php
class Status
{
    private string $value;
}
```

## Resumen del capítulo

Los comentarios en el código tienen una utilidad limitada y, con frecuencia, se vuelven mentirosos y no resultan de ayuda para comprender lo que nuestro código hace, pudiendo incluso llevarnos a confusión si les hacemos caso.

Podrían ser directamente eliminados o reemplazados si utilizamos mejores nombres para los símbolos (variables, constantes, clases, métodos, funciones…). En algunos casos, plantearnos eliminar comentarios puede llevarnos a reflexionar sobre nuevas formas de implementar algo.

Por otro lado, los comentarios que sí pueden permanecer suelen referirse a aspectos que no podemos expresar fácilmente con código, como puede ser explicar los motivos para hacer algo de una forma concreta.
