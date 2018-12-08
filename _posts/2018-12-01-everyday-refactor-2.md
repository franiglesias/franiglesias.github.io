---
layout: post
title: Refactor cotidiano (2). Mejora los nombres
categories: articles
tags: good-practices refactoring
---

La segunda entrega de la guía del refactor cotidiano trata de los nombres y cómo mejorarlos.

Probablemente en ningún lugar como el código los nombres configuran la realidad. De hecho, escribir código implica establecer decenas de nombres cada día, para identificar conceptos y procesos. Una mala elección de nombre puede condicionar nuestra forma de ver un problema de negocio. Un nombre ambiguo puede llevarnos a entrar en un callejón sin salida, ahora o en un futuro no muy lejano. Un nombre bien escogido puede ahorrarnos tiempo, dinero y dificultades.

## Símbolos con nombres

Un trozo de código debería poder leerse como una especie de narrativa, en la cual cada palabra expresase de forma unívoca un significado. También de forma ubicua y coherente, es decir, el mismo símbolo debería representar el mismo concepto en todas partes del código.

## ¿Cuándo refactorizar nombres?

La regla de oro es muy sencilla: cada vez que al leer una línea de código tenemos que pararnos a pensar qué está diciendo probablemente deberíamos cambiar algún nombre.

Este es un ejemplo de un código con unos cuantos problemas de nombres, algunos evidentes y otros no tanto:

```php

class PriceCalculator {
    // Discount rate
    var $rate;
    
    public price(): float
    {
       //...
       $rate = $this->getRate($product);
       $tax = $this->taxRepository->byProduct($product);
        
       $amount = $product->basePrice();
       
       $amount = $this->calculate($amount, $rate, $tax);
       
       $amount = $amount - $this->calculateDiscount($amount);
       
       return $amount;
    }
    
    public discount(float $rate): void
    {
        $this->rate = $rate;
    }
    
    private function calculateDiscount(float $price): float
    {
        $discount = $price * $this->rate;
        
        return $discount;
    }
    
    private function calculate(int $amount, float $rate, float $tax): float
    {
        // some complex calculation
    }
}
```

Por supuesto, en este ejemplo hay algunos errores más aparte de los nombres. Pero hoy sólo nos ocuparemos de éstos. Vamos por partes.

### Nombres demasiado genéricos

Los nombres demasiado genéricos requieren el esfuerzo de interpretar a qué caso concreto se están aplicando. Además, en un plano más práctico, resulta difícil localizar una aparición concreta del mismo que tenga el significado deseado.

¿De dónde vienen los nombres demasiado genéricos? Normalmente vienen de estadios iniciales del código, en los que probablemente bastaba con ese término genérico para designar un concepto. Con el tiempo, ese concepto evoluciona y se ramifica a medida que el conocimiento de negocio avanza, pero el código puede que no lo haya hecho al mismo ritmo, con lo que llega un momento en que éste no es reflejo del conocimiento actual que tenemos del negocio.

Calculate… what? Exactamente, ¿qué estamos calculando aquí? El código no lo refleja. Podría ocurrir, por ejemplo, que `$rate` fuese algún tipo de comisión, `$tax` resulta bastante obvio y `$amount` parece claro que es algo así como el precio de tarifa de algún producto o servicio (sea lo que sea que vende esta empresa). Es muy posible que este método lo que haga es calcular el precio para el consumidor final del producto. ¿Por qué no declararlo de forma explícita?

```php
public price(): float
{
    //...
    $rate = $this->getRate($product);
    $tax = $this->taxRepository->byProduct($product);
    
    $amount = $product->basePrice();
   
    $amount = $this->calculateFinalConsumerPrice($amount, $rate, $tax);
   
    $amount = $amount - $this->calculateDiscount($amount);
    
    return $amount;
}

private function calculateFinalConsumerPrice(int $amount, float $rate, float $tax): float
{
    // some complex calculation
}
```

Ejecutamos el cambio y lo celebramos haciendo un *commit*.

Vayamos ahora con `$rate`. Hemos quedado en que representa el porcentaje de comisión que corresponde al comercial que ha realizado la venta. Podría pasar a llamarse `$commissionRate`, al igual que el método del cual la obtenemos.

```php
public price(): float
{
    //...
    $commissionRate = $this->getCommissionRate($product);
    $tax = $this->taxRepository->byProduct($product);
    
    $amount = $product->basePrice();
   
    $amount = $this->calculateFinalConsumerPrice($amount, $commissionRate, $tax);

    $amount = $amount - $this->calculateDiscount($amount);

    return $amount;
}

private function calculateFinalConsumerPrice(int $amount, float $commissionRate, float $tax): float
{
    // some complex calculation
}
```

Además, esto era bastante necesario, porque resulta que la clase tiene otro `$rate`, que es una propiedad que, teniendo el mismo nombre, representa algo completamente distinto, como es un descuento. Tanto `$commissionRate` como `$rate` son ratios (proporciones o porcentajes), pero el hecho de que sean el mismo concepto matemático (ratio), no implica que sean el mismo concepto de negocio. Por supuesto, necesitamos mayor precisión también aquí:

```php
var $discountRate;

//...

public discount(float $discountRate): void
{
    $this->discountRate = $discountRate;
}
    
private function calculateDiscount(float $price): float
{
    $discount = $price * $this->discountRate;
    
    return $discount;
}
```

`$tax` puede mejorar también. Pero, ¿qué nos cuesta hacerlo explícito si queremos decir que se trata del IVA?

```php
public price(): float
{
    //...
    $commissionRate = $this->getCommissionRate($product);
    $vat = $this->taxRepository->byProduct($product);
    
    $amount = $product->basePrice();
   
    $amount = $this->calculateFinalConsumerPrice($amount, $commissionRate, $vat);

    $amount = $amount - $this->calculateDiscount($amount);

    return $amount;
}

private function calculateFinalConsumerPrice(
    int $amount, 
    float $commissionRate, 
    float $vat
): float {
    // some complex calculation
}
```

### Nombres reutilizados en el mismo scope

Nunca se deben reutilizar nombres en el mismo scope (dentro de una misma función o dentro de una misma clase) para representar cosas distintas porque nos lleva a confusión. Los lenguajes más estrictos son capaces de evitar que introduzcas valores de distinto tipo en una misma variable, otros no te dejarán reasignarla, pero existen muchos casos en que esa reasignación es posible, al menos si no cambia el tipo de dato.

En nuestro ejemplo, la variable `$amount` es asignada tres veces y utilizada varias con significados diferentes.

Voy a eliminar parte del código para que te puedas fijar en algo aparentemente inocente:

```php
public price(): float
{
    //...
    $amount = $product->basePrice();
   
    $amount = $this->calculateFinalConsumerPrice($amount, $commissionRate, $vat);
    
    //...
    
    return $amount;
}

private function calculateFinalConsumerPrice(
    int $amount, 
    float $commissionRate, 
    float $vat
): float {
    // some complex calculation
}
```

¿Lo has pillado? el método `calculateFinalConsumerPrice` espera que `$amount` sea un int, mientras que devuelve un float que se asigna de nuevo a `$amount`. ¿Qué está pasando aquí?

Pues, por ejemplo, podría estar pasando que el precio que contiene `$product`, esté expresado en céntimos por la razón que sea, mientras que el precio final se va a expresar en euros. De nuevo, el conflicto se puede resolver siendo explícitos sobre lo que la variable realmente contiene o el parámetro exige:

```php
public price(): float
{
    //...
    $amountInCents = $product->basePrice();
   
    $amountInEuros = $this->calculateFinalConsumerPrice($amountInCents, $commissionRate, $vat);
    
    //...
    
    return $amountInEuros;
}

private function calculateFinalConsumerPrice(
    int $amountInCents, 
    float $commissionRate, 
    float $vat
): float {
    // some complex calculation
}
```

Por otro lado, la secuencia de transformaciones que sufre `$amountInEuros` puede transmitir mensajes confusos. Por un lado, refleja que es un precio base que se transforma por diversas razones (comisiones, impuestos, descuentos), pero por otro lado podría tener diversos significados de negocio que en un momento dado necesitaríamos discriminar.

En el primer caso, esta representación puede ser mucho más descriptiva de lo que realmente pasa:

```php
public price(): float
{
    //...
    $commissionRate = $this->getCommissionRate($product);
    $vat = $this->taxRepository->byProduct($product);
    
    $amountInCents = $product->basePrice();
   
    $amountInEuros = $this->calculateFinalConsumerPrice($amountInCents, $commissionRate, $vat);

    $amountInEuros -= $this->calculateDiscount($amountInEuros);

    return $amountInEuros;
}
```

Por ejemplo, podríamos necesitar discriminar el precio antes y después de impuestos. O el total de la comisión que se lleva el comercial, porque se han convertido en cuestiones importantes del negocio:

```php
public price(): float
{
    //...
    $commissionRate = $this->getCommissionRate($product);
    $vat = $this->taxRepository->byProduct($product);
    
    $amountInCentsBeforeTaxes = $product->basePrice();
    
    $commission = $this->calculateCommission($amountInCentsBeforeTaxes, $commissionRate);
   
    $amountInEuros = $this->calculateFinalConsumerPrice($amountInCentsBeforeTaxes, $commissionRate, $vat);

    $amountInEuros -= $this->calculateDiscount($amountInEuros);

    return $amountInEuros;
}
```

El refactor va aclarando por una parte conceptos de negocio, pero también nos permite descubrir que tenemos problemas más profundos en el código.

Por ejemplo, que nos vendría bien utilizar un **ValueObject** para representar el precio, como `Money`, incluso aunque al final devolvamos un float para que el refactor no nos obligue a cambiar la interfaz pública:

```php
public price(): float
{
    //...
    $commissionRate = $this->getCommissionRate($product);
    $vat = $this->taxRepository->byProduct($product);
    
    $amountBeforeTaxes = Money::fromCents($product->basePrice(), 'EUR');
       
    $amount = $amountBeforeTaxes
        ->addRate($commissionRate)
        ->addRate($vat);
        
    $discountedAmount = $amount->substractRate($this->discountRate());

    return $discountedAmount->amount();
}
```

### Tipo de palabra inadecuada

Los símbolos que, de algún modo, contradicen el concepto que representan son más difíciles de procesar, generalmente porque provocan una expectativa que no se cumple y, por tanto, debemos reevaluar lo que estamos leyendo.

Así, una acción debería representarse siempre mediante un verbo.

Y un concepto, siempre mediante un sustantivo.

A su vez, nunca nos sobran los adjetivos para precisar el significado del sustantivo, por lo que los nombres compuestos nos ayudan a representar con mayor precisión las cosas.

Volvamos al ejemplo. `PriceCalculator` parece un buen nombre. Es un sustantivo, por lo que parece un actor que hace algo. Veámosla como interface:

```php
interface PriceCalculator {
    public price(Product $product): float;
    public discount(float $rate): float;
}
```

Obviamente, este refactor es un poco más arriesgado. Vamos a tocar una interfaz pública, pero también es verdad que con los IDE modernos este tipo de cambios es razonablemente seguro.

Vamos por la más evidente. El método `discount` en realidad nos sirve para asignar un descuento aplicable a la siguiente operación `price`. Estamos usando un sustantivo para indicar una acción. La opción más inmediata:

```php
interface PriceCalculator {
    public price(Product $product): float;
    public setDiscount(float $rate): float;
}
```

Está mejor, pero también podemos ser más fieles al lenguaje de negocio. De hecho, 'set' tiene un significado demasiado genérico y no dice realmente nada:

```php
interface PriceCalculator {
    public price(Product $product): float;
    public applyDiscount(float $rate): float;
}
```

En cambio, `applyDiscount` es una clara acción de negocio y no deja muchas dudas en cuanto al significado. Pero todavía podríamos aportar un poco más de precisión, aunque el nombre del parámetro es `$rate`, nunca se sabe cómo se va a utilizar:

```php
interface PriceCalculator {
    public price(Product $product): float;
    public applyDiscountRate(float $rate): float;
}
```

Ahora, sí.

¿Y qué decir de `price`? De nuevo, es un sustantivo que representa una acción, por lo que podríamos cambiarlo.

Pero antes… Volvamos un momento a la clase. ¿PriceCalculator es un actor o una acción? A veces tendemos a ver los objetos como representaciones de objetos del "mundo real". Sin embargo, podemos representar acciones y otros conceptos con objetos en el código. Esta forma de verlo puede cambiar por completo nuestra manera de hacer las cosas.

Supongamos entonces, que consideramos que PriceCalculator no es una "cosa", sino una "acción":

```php
interface CalculatePrice {
    public price(Product $product): float;
    public applyDiscountRate(float $rate): float;
}
```

Tal y como está ahora, expresar ciertas cosas resulta extraño:

```php
$calculatePrice = new CalculatePrice();

$calculatePrice->applyDiscountRate($rate);
$calculatePrice->price($product);
```

Pero podemos imaginarlo de otra forma mucho más fluída:

```php
$calculatePrice = new CalculatePrice();

$calculatePrice->applyingDiscountRate($rate);
$calculatePrice->finalForProduct($product);
```

Lo que nos deja con esta interfaz:

```php
interface CalculatePrice {
    public finalForProduct(Product $product): float;
    public applyingDiscountRate(float $rate): float;
}
```

### Números mágicos

En este caso no se trata estrictamente de refactorizar nombres, sino de bautizar elementos que están presentes en nuestro código en forma de valores abstractos que tienen un valor de negocio que no ha sido hecho explícito.

Poniéndoles un nombre, lo hacemos. Antes:

```php
$vatAmount = $amountBeforeTaxes * .21;
```

Después:

```php
$vatAmount = $amountBeforeTaxes * self::VAT_RATE;
```

Convertir estos valores en constantes con nombre hace que su significado de negocio esté presente, sin tener que preocuparse de interpretarlo. Además, esto los hace reutilizables a lo largo de todo el código, lo que añade un plus de coherencia.

Así que, cada vez que encuentres uno de estos valores, hazte un favor y reemplázalo por una constante. Por ejemplo, los naturalmente ilegibles patrones de expresiones regulares:

```php
$isValidNif = preg_match('/^[0-9XYZ]\d{7}[^\dUIOÑ]$/', $nif);

// vs

$isValidNif = preg_match(Nif::VALID_NIF_PATTERN, $nif);
```

O los patrones de formato para todo tipo de mensajes:

```php
$mensaje = sprintf('¿Enviar un mensaje a %s en la dirección %s?', $user->username(), $user->email());

$mensaje = sprintf(self::CONFIRM_SEND_EMAIL_MESSAGE, $user->username(), $user->email());
```

## Nombres técnicos

Personalmente me gustan poco los nombres técnicos formando parte de los nombres de variables, clases, interfaces, etc. De hecho, creo que en muchas ocasiones condicionan tanto el *naming*, que favorecen la creación de malos nombres.

Ya he hablado del problema de entender que los objetos en programación tienen que ser representaciones de objetos del mundo real. Esa forma de pensar nos lleva a ver todos los objetos como actores que hacen algo, cuando muchas veces son acciones.

En ocasiones, es verdad que tenemos que representar ciertas operaciones técnicas, que no todo va a ser negocio, pero eso no quiere decir que no hagamos las cosas de una manera elegante. Por ejemplo:

```php
interface BookTranformer
{
    public function transformToJson(Book $book): string;
    public function transformFromJson(string $bookDto): Book;
}

// vs

interface TransformBook
{
    public function toJson(Book $book): string;
    public function fromJson(string $bookDto): Book;
}
```

En cambio, en el dominio me choca ver cosas como:

```
class BookWasPrintedEvent implements DomainEvent
{
}

// vs

class BookWasPrinted implements DomainEvent
{
}
```

Ya que el uso del verbo en pasado debería ser suficiente para entender de un vistazo que está hablando de un event (un mensaje que indica que algo ha ocurrido).

Es cierto que incluir algunos *apellidos técnicos* a nuestros nombres puede ayudarnos a localizar cosas en el IDE. Pero hay que recordar que no programamos para un IDE.

## Refactor de nombres

En general, gracias a las capacidades de refactor de los IDE o incluso del Buscar/Reemplazar en proyectos, realizar refactors de nombres bastante seguro.

**Variables locales en métodos y funciones**. Cambiarlas no supone ningún problema, pues no afectan a nada que ocurra fuera de su ámbito.

**Propiedades y métodos privados en clases**. Tampoco suponen ningún problema al no afectar a nada externo a la clase.

**Interfaces públicas**. Aunque es más delicado, los IDE modernos deberían ayudarnos a realizarlos sin mayores problemas. La mayor dificultad me la he encontrado al cambiar nombres de clases, puesto que el IDE aunque localiza y cambia correctamente sus usos, no siempre identifica objetos relacionados, como los tests.

## El coste de un mal nombre

Imaginemos un sistema de gestión de bibliotecas que, inicialmente, se creó para gestionar libros. Simplificando muchísimo, aquí tenemos un concepto clave del negocio:

```php
class Book
{
    private $id;
    private $title;
    private $author;
    private $editor;
    private $year;
    private $city;
}
```

Con el tiempo la biblioteca pasó a gestionar revistas. Las revistas tienen número, pero tal vez en su momento se pensó que no sería necesario desarrollar una especialización:

```php
class Book
{
    private $id;
    private $title;
    private $author;
    private $editor;
    private $year;
    private $city;
    private $issue;
}
```

Y aquí comienza un desastre que sólo se detecta mucho tiempo después y que puede suponer una sangría, quizá lenta pero constante, de tiempo, recursos y, en último término, dinero para los equipos y empresas.

La modificación de la clase `Book` hizo que ésta pasara a representar dos conceptos distintos, pero quizá se consideró que era una ambigüedad manejable: un compromiso aceptable.

Claro que la biblioteca siguió evolucionando y con el avance tecnológico comenzó a introducir nuevos tipos de objetos, como CD, DVD, libros electrónicos, y un largo etcétera. En este punto, el conocimiento que maneja negocio y su representación en el código se han alejado tanto que el código se ha convertido en una pesadilla: ¿cómo sabemos se Book se refiere a un libro físico, a uno electrónico, a una película en DVD, a un juego en CD? Sólo lo podemos saber examinando el contenido de cada objeto Book. Es decir: el código nos está obligando a pararnos a pensar para entenderlo. Necesitamos refactorizar y reescribir.

Es cierto que, dejando aparte el contenido, todos los objetos culturales conservados en una biblioteca comparten ese carácter de objeto cultural o soporte de contenidos. `CulturalObject` parece un nombre demasiado forzado, pero `Media` resulta bastante manejable:

```php
class Media
{
    private $id;
    private $signature;
    private $registeredSince;
    private $status;
}
```

De `Media` que representaría a los soportes de contenidos archivados en la biblioteca y que contendría propiedades como un número de registro (el id), la signatura topográfica (que nos comunica su ubicación física) y otros detalles relacionados con la actividad de archivo, préstamo, etcétera.

Pero esa clase tendría especializaciones que representan tipos de medios específicos, con sus propiedades y comportamientos propios.

```php
class Book extends Media
{
}

class Review extends Media
{
}

class ElectronicBook extends Media
{
}

class Movie extends Media
{
} 
```

Podríamos desarrollar más el conocimiento de negocio en el código, añadiendo interfaces. Por ejemplo, la gestión del préstamo:

```php
interface Lendable
{
    public function lend(User $user): void;
    public function return(DateTimeInterface $date): void;
}
```

Pero el resumen es que que el hecho de no haber ido reflejando la evolución del conocimiento del negocio en el código nos lleva a tener un sobrecoste en forma de:

* El tiempo y recursos necesarios para actualizar el desarrollo a través de reescrituras.
* El tiempo y recursos necesarios para mantener el software cuando surgen problemas derivados de la mala representación del conocimiento.
* Las pérdidas por no ingresos debidos a la dificultad del software de adaptarse a las necesidades cambiantes del negocio.

Por esto, preocúpate por poner buenos nombres y mantenerlos al día. Va en ello tu salario.
