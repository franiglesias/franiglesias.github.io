---
layout: post
title: El patrón Object Mother
categories: articles
tags: testing tdd
---

El patrón Object Mother nos ayuda a tener ejemplos de objetos en toda la suite de test.

Este artículo es una puesta al día y enriquecimiento de una [versión anterior](/object-mother/).

El patrón fue inventado en [ThoughtWorks](https://martinfowler.com/bliki/ObjectMother.html) y aunque el nombre que le han dado no me emociona mucho, lo uso siempre que tengo oportunidad. A veces, los llamo _Object Examples_ en su lugar, que es menos _catchy_, pero más preciso, así que no ganará popularidad.

> Object Mother is just a catchy name for such a factory. The name was coined on a Thoughtworks project at the turn of the century, and it's catchy enough to have stuck.

Existe un artículo desarrollando el concepto: _ObjectMother. Easing Test Object Creation in XP_ de Peter Schuh y Stephanie Punke, que puedes [descargar aquí](https://www.yumpu.com/en/document/view/36565144/objectmother-easing-test-object-creation-in-xp-agile-alliance) (requiere crear una cuenta).

## ¿Qué problema resuelve?

El problema que resuelve _Object Mother_ es la necesidad de generar ejemplos de objetos para tests que sean consistentes y significativos, particularmente objetos de dominio, entidades y agregados. Pero creo que se puede usar un patrón similar para otros objetos de test, como podrían ser dobles de servicios. Sin embargo, dejaremos esta posibilidad de lado en este trabajo.  

En una buena suite de tests tienes que crear decenas de ejemplos. Algo que resulta bastante tedioso y repetitivo. Además, no siempre es fácil entender qué tiene de especial un ejemplo que hayamos elegido para un test determinado. Hay situaciones en las que el ejemplo concreto nos da un poco igual, pero en otras, queremos controlar alguna de sus características.

Por otro lado, al tener que crear ejemplos similares en muchos tests es fácil que no tengan consistencia entre ellos.

## Pero, ¿qué es un ejemplo?

Es muy importante señalar que los _Object Mother_ son factorías de ejemplos prototípicos. Ejemplos que podríamos usar en las discusiones de negocio y que podríamos incluso bautizar informalmente. Casos como: "María" puede ser una clienta de larga duración que habría acumulado más de 100 puntos en el programa de afiliación, mientras que "Fernando" es un cliente que acaba de darse de alta, por lo que no tiene puntos.

Es decir, son objetos de negocio que ejemplifican ciertos casos que nos resultan significativos.

Aparte de eso, pueden admitir un cierto grado de personalización. Por ejemplo, en un test "María" podría consumir la mitad de sus puntos. Y "Fernando", por su parte, podría haber alcanzado el primer hito que le reporte puntos, en otro.

Lo que no son los _Object Mothers_ son _factorías_ o _builders_ que nos permitan crear cualquier objeto de negocio del tipo requerido. Para eso ya están los patrones correspondientes. Pueden usar internamente estos patrones, los cuales tienen su propia utilidad más allá del test.

## ¿Cómo se hace?

Un _Object Mother_ se parece a una factoría y expone métodos que nos devuelven objetos completamente montados. Estos métodos aportan significado a nuestros ejemplos, de tal modo que podemos pedirle objetos que cumplan ciertas características.

Veamos un ejemplo con una entidad `Customer`. Nos vamos a centrar en una propiedad _edad_ porque estamos trabajando en alguna prestación que depende de que el cliente sea mayor de edad o no. Por ejemplo, para permitirle acceder a ciertas gamas de productos, o para permitirle realizar pagos.

```php
class Customer
{
    private string $name;
    private string $surname;
    private int $age;

    public function __construct(string $name, string $surname, int $age)
    {
        $this->name = $name;
        $this->surname = $surname;
        $this->age = $age;
    }
}
```

Nuestro _Object Mother_ se llama `CustomerExamples` y expone varios métodos cuyo nombre describe las características del objeto `Customer` que vamos a obtener.

```php
class CustomerExamples
{
    public static function dummy(): Customer
    {
        return new Customer('Dummy', 'Customer', 45);
    }

    /**
     * @throws \Exception
     */
    public static function random(): Customer
    {
        return new Customer('Random', 'Customer', random_int(10, 90));
    }

    public static function underAge(): Customer
    {
        return new Customer('Kid', 'Customer', 12);
    }

    public static function adult(): Customer
    {
        return new Customer('Adult', 'Customer', 35);
    }
}
```

Los métodos se definen estáticos para poder traernos fácilmente los ejemplos. En ese sentido, el _Object Mother_ es más una colección de funciones que construyen objetos. No hay ninguna norma que nos oblique a hacerlo así, pero resulta cómoda:

```php
class CustomerTest extends TestCase
{
    /** @test */
    public function shouldShowExamplesOfCustomers(): void
    {
        $underAge = CustomerExamples::underAge();

        $adult = CustomerExamples::adult();

        // use in the test
    }
}
```

El método `dummy` nos indica que es un objeto del que nos dan igual sus propiedades concretas. Un típico uso podría ser el de un objeto que se obtiene de un repositorio, se hace o no algún procesamiento y se envía a otro servicio. Este nombre

Por su parte, el método `random` generará un objeto variando cada vez una propiedad de manera aleatoria, lo que nos puede servir para escribir tests que nos demuestren que cierto comportamiento es independiente de esa variación. Hay que tener prudencia al usar valores completamente aleatorios, pues dependiendo del test podríamos obtener resultados impredecibles. En particular si estos tests verifican algo relacionado con el estado del objeto.

Así, por ejemplo, si lo que estamos testeando es una representación JSON o HTML de ese objeto, no debemos usar valores aleatorios porque será muy difícil crear un test.

Los métodos `underAge` y `adult`, nos proporcionan ejemplos con una característica específica que nos interesa controlar. Es ideal para las particiones de clase equivalente. 

En el artículo anterior, mencionaba la posibilidad de usar valores aleatorios para esos métodos, pero me retracto completamente de eso por varias razones:

* Favorece tests no deterministas en situaciones deterministas. Si tienes tests que se basan en una representación del estado interno de estos objetos nunca deberían ser datos aleatorios, ya que complicará el test e incluso podría volverlo tautológico.
* Complica la mayoría de los tests, salvo que estés testeando por propiedades. Si quieres testear un generador de contraseñas, por ejemplo, te interesará más asegurar que se cumplen las restricciones que el valor exacto: longitud, incluye cierto tipo de caracteres, etc.
* No aporta ningún beneficio. Un argumento que he escuchado en ocasiones es que de este modo, con el tiempo, se llegarían a testear muchos valores y podrían aparecer _edge cases_ en los que no se había pensado. Para eso tenemos técnicas como la _partición en clases de equivalencia_ o el _análisis de límites_, entre otras, que nos permiten seleccionar valores adecuados para los tests.

## Organización

Un error que he cometido frecuentemente es crear un único _Object Mother_ para una clase de objetos. Mirando hacia atrás veo que es una mala práctica, ya que hace especialmente complicado y costoso el mantenimiento.

Es mucho mejor crear _Object Mother_ especializados. Veamos el ejemplo anterior dividido en dos _Mothers_. El primero de ellos nos proporciona ejemplos simples.

```php
class GeneralCustomerExamples
{
    public static function dummy(): Customer
    {
        return new Customer('Dummy', 'Customer', 45);
    }

    /**
     * @throws \Exception
     */
    public static function random(): Customer
    {
        return new Customer('Random', 'Customer', random_int(10, 90));
    }
}
```

El segundo nos proporciona ejemplos basados en la edad.

```php
class CustomerByAgeExamples
{
    public static function underAge(): Customer
    {
        return new Customer('Kid', 'Customer', 12);
    }

    public static function adult(): Customer
    {
        return new Customer('Adult', 'Customer', 35);
    }
}
```

## Beneficios

Aparte del hecho de proporcionarnos un lugar único en el que obtener ejemplos para tests, conseguimos algunos beneficios extra:

Por ejemplo, si la instanciación de los objetos cambiase con el tiempo, tendríamos un lugar único en el que realizar los cambios necesarios. Al fin y al cabo, no deja de ser una factoría.

Los métodos semánticos nos permiten asociar ejemplos de diversos objetos entre sí en los tests de manera significativa para nosotras, creando conjuntos coherentes de condiciones. 

Por ejemplo, imagina que tenemos unos servicios que son específicos para distintas categorías de clientes y queremos comprobar que acepta o rechaza los clientes correctos:

```php
class CustomerTest extends TestCase
{
    /** @test */
    public function shouldShowExamplesOfCustomers(): void
    {
        $underAgeCustomer = CustomerExamples::underAge();

        $adultCustomer = CustomerExamples::adult();

        // use in the test
        
        $serviceForUnderAge = ServiceExamples::underAge();
        
        self::assertTrue($serviceForUnderAge->accepts($underAgeCustomer));
        self::assertTrue($serviceForUnderAge->accepts($adultCustomer));
    }
}
```

Otro beneficio es que es bastante fácil discutir acerca de ejemplos concretos. Están identificados y podemos referirnos a ellos de una manera completa (Customer Under Age) y los podemos usar en distintos tests. Incluso si con el tiempo hemos bautizado a nuestros objetos prototípicos con nombres como "Federico" o "Carmen".

Además, siempre podemos añadir nuevos ejemplos fácilmente. Esto es, si los ejemplos existentes no nos convencen por la razón que sea, podemos añadir otros específicos para las necesidades de un test concreto o un conjunto de ellos. Si aparecen nuevas categorías de esa entidad concreta, podemos añadir nuevos ejemplos.

En el lado negativo, podemos plantearnos hasta qué punto estos proveedores de ejemplos acoplan unos tests con otros, de modo que cambios en uno afecten a múltiples tests. Esto podría considerarse incluso una ventaja en el sentido de que reduce el esfuerzo en caso de cambios en los objetos y el efecto que causarían en el sistema.

Las posibles consecuencias negativas vendrían más un problema de abuso de los propios ejemplos que del patrón en sí. En ese sentido, si un nuevo test requiere cambios en un ejemplo, lo más adecuado sería crear uno nuevo para ese escenario.

## Uso avanzado

### Parametrización

En el caso de nuestro `CustomerExamples` tenemos métodos que devuelven siempre el mismo ejemplo, o uno aleatorizado equivalente. A veces necesitamos tener el control de una variable específica y nos vendría bien parametrizar la creación de los ejemplos.

Sin embargo, es preferible limitar la flexibilidad a las necesidades del test, es decir, no queremos crear una factoría genérica, lo que nos volvería a traer los problemas por los que originalmente introdujimos el patrón _Object Mother_. 

### Ejemplos que usan ejemplos

Dentro del ámbito de los tests tampoco hay limitaciones para usar estos generadores de ejemplos. Supongamos un típico caso de `Products` y `Orders`:

```php
class Product
{
    private string $id;
    private string $name;

    public function __construct(string $id, string $name)
    {
        $this->id = $id;
        $this->name = $name;
    }
}

class Order
{
    private string $id;
    private array $products;

    public function __construct(string $id)
    {
        $this->id = $id;
    }

    public function addProduct(Product $product)
    {
        $this->products[] = $product;
    }
}
```

Podemos generar ejemplos de `Order` que contengan algunos productos:

```php

class ProductExamples
{
    public static function dummy(): Product
    {
        return new Product(uniqid('', true), 'Dummy Product');
    }
}

class OrderExamples
{
    public static function dummy(): Order
    {
        $order = new Order(uniqid('', true));
        $order->addProduct(ProductExamples::dummy());
        $order->addProduct(ProductExamples::dummy());
        $order->addProduct(ProductExamples::dummy());
        
        return $order;
    }
}
```

O incluso parametrizarlo, si nos interesase hacer algún test en función de la cantidad de productos en `Order`:

```php
class OrderExamples
{
    public static function withProducts(int $quantity): Order
    {
        $order = new Order(uniqid('', true));
        for ($i = 0; $i < $quantity; $i++) {
            $order->addProduct(ProductExamples::dummy());
        }

        return $order;
    }
}
```

De este modo podríamos usarlo así:

```php
$emptyOrder = OrderExamples::withProducts(0);

$hugeOrder = OrderExamples::withProducts(1000);
```

### Reutilizar código en la factoría de ejemplos

Nuestro `OrderExamples` puede reutilizar su código:

```php
class OrderExamples
{
    public static function emptyOrder(): Order
    {
        return new Order(uniqid('', true));
    }
    
    public static function dummy(): Order
    {
        return self::withProducts(3);
    }

    public static function withProducts(int $quantity): Order
    {
        $order = self::emptyOrder();

        for ($i = 0; $i < $quantity; $i++) {
            $order->addProduct(ProductExamples::dummy());
        }

        return $order;
    }
}
```

### Polimorfismo

Nada nos impide tampoco usar un _Object Mother_ que nos proporcione ejemplos polimórficos. Imaginemos que hemos decidido modelar los distintos tipos de `Consumer` con subclases. En ese caso, puede tener mucho sentido que un mismo `CustomerExamples` nos devuelva los tipos de objetos adecuados.

```php
class UnderAgeCustomer extends Customer
{
    
}

class AdultCustomer extends Customer
{
    
}
```

Con lo que `CustomerExamples` podría quedar así:

```php
class CustomerExamples
{
    public static function dummy(): Customer
    {
        return new Customer('Dummy', 'Customer', 45);
    }

    /**
     * @throws \Exception
     */
    public static function random(): Customer
    {
        return new Customer('Random', 'Customer', random_int(10, 90));
    }

    public static function underAge(): Customer
    {
        return new UnderAgeCustomer('Kid', 'Customer', random_int(8, 17));
    }

    public static function adult(): Customer
    {
        return new AdultCustomer('Adult', 'Customer', random_int(18, 80));
    }
}
```

Claro que lo suyo sería tener un método factoría en `Customer` que se encargue de crear la instancia correcta...

```php
class Customer
{
    private string $name;
    private string $surname;
    private int $age;

    private function __construct(string $name, string $surname, int $age)
    {
        $this->name = $name;
        $this->surname = $surname;
        $this->age = $age;
    }

    public static function enroll(string $name, string $surname, int $age): Customer
    {
        if ($age < 18) {
            return new UnderAgeCustomer($name, $surname, $age);
        }
        
        return new AdultCustomer($name, $surname, $age);
    }
}
```

Lo que simplificaría la creación de ejemplos. En este caso, `CustomerExamples` se volvería casi innecesario. Pero el mundo real siempre es más complicado.

```php
class CustomerExamples
{
    public static function dummy(): Customer
    {
        return Customer::enroll('Dummy', 'Customer', 45);
    }
    
    public static function random(): Customer
    {
        return Customer::enroll('Random', 'Customer', random_int(10, 90));
    }

    public static function underAge(): Customer
    {
        return Customer::enroll('Kid', 'Customer', random_int(8, 17));
    }

    public static function adult(): Customer
    {
        return Customer::enroll('Adult', 'Customer', random_int(18, 80));
    }
}
```

## ObjectMother y Builders

Hablemos de combinatoria. Un problema que podríamos encontrar fácilmente es el de aquellos casos en que los ejemplos no son tan simples. Cuando tenemos que combinar varios parámetros para generar ejemplos, como se hace en la metodología de _tablas de decisión_, los _Object Mothers_ presentan dificultades. En esos casos, podemos usar elementos de los patrones _Builder_ y _Protoype_.

El patrón Builder sirve para construir un objeto complejo desde cero, en particular cuando las reglas de negocio para construirlo son complejas y requiere crear otros objetos o pasar muchos datos.

Si combinamos el patrón _Builder_ con _Prototype_ lo que hacemos es o bien partir de un objeto ya fabricado al que hacemos modificaciones, o bien un pseudo-builder que contenga valores por defecto.

Veremos ejemplos de ello en un artículo futuro.

## En resumen

Object Mother es un patrón que puede traer mucho orden y claridad a tus tests, proporcionando un único punto de generación de ejemplos que, además, aportan el beneficio de tener valor semántico, permitiéndonos discutir sobre ellos, y poder utilizarlos en toda la suite de una forma coherente.
