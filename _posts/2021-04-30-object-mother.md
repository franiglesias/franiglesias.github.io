---
layout: post
title: Ejemplos para tus tests con Object Mother
categories: articles
tags: testing tdd
---

El patrón Object Mother nos ayuda a tener ejemplos de entidades y value objects coherentes en toda la suite.

Parece que este patrón fue inventado en [ThoughtWorks](https://martinfowler.com/bliki/ObjectMother.html) y aunque el nombre que le han dado no me emociona mucho, lo uso siempre que tengo oportunidad.

## ¿Qué problema resuelve?

El problema que resuelve es la necesidad de generar ejemplos para tests que sean consistentes y significativos. En una buena suite de tests tienes que crear decenas de ejemplos. 

Crear estos ejemplos es bastante tedioso y repetitivo. Además, no siempre es fácil entender qué tiene de especial un ejemplo que hayamos elegido. En algunos casos, el ejemplo concreto nos da un poco igual, en otros, queremos controlar alguna de sus características.

Por otro lado, al tener que crear ejemplos similares en muchos tests es fácil que no tengan consistencia.

El patrón Object Mother nos proporciona una forma de obtener ejemplos de manera sistemática y significativa.

## ¿Cómo se hace?

Un Object Mother se parece a una factoría y expone métodos que nos devuelven objetos completamente montados. Estos métodos aportan significado a nuestros ejemplos, de tal modo que podemos pedirle objetos que cumplan ciertas características.

Veamos un ejemplo con una entidad Customer. Nos vamos a centrar en una propiedad _edad_.

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

Nuestro Object Mother se llama `CustomerExamples` y expone varios métodos cuyo nombre describe las características del objeto `Customer` que vamos a obtener.

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

Los métodos se definen estáticos para poder traernos fácilmente los ejemplos. En ese sentido, el Object Mother es más una colección de funciones que construyen objetos. No hay ninguna norma que nos oblique a hacerlo así, pero resulta cómoda:

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

El método `dummy` nos indica que es un objeto del que nos dan igual sus propiedades concretas. Un típico uso podría ser el de un objeto que se obtiene de un repositorio, se hace o no algún procesamiento y se envía a otro servicio.

Por su parte, el método `random` generará un objeto variando cada vez una propiedad de manera aleatoria, lo que nos puede servir para escribir tests que nos demuestren que cierto comportamiento es independientes de esa variación.

Los métodos `underAge` y `adult`, nos proporcionan ejemplos con una característica específica que nos interesa controlar. Es ideal para las particiones de clase equivalente. En lugar de ofrecer un ejemplo específico, podrías incluso aleatorizarlo dentro los límites de esa categoría:

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
        return new Customer('Kid', 'Customer', random_int(8, 17));
    }

    public static function adult(): Customer
    {
        return new Customer('Adult', 'Customer', random_int(18, 80));
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

Otro beneficio es que es bastante fácil discutir acerca de ejemplos concretos. Están identificados y podemos referirnos a ellos de una manera completa (CustomerUnderAge) y los usamos en distintos tests.

Además, siempre podemos añadir nuevos ejemplos fácilmente. Esto es, si los ejemplos existentes no nos convencen por la razón que sea, podemos añadir otros específicos para las necesidades de un test concreto o un conjunto de ellos. Si aparecen nuevas categorías de esa entidad concreta, podemos añadir nuevos ejemplos.

## Uso avanzado

### Parametrización

En el caso de nuestro `CustomerExamples` tenemos métodos que devuelven siempre el mismo ejemplo, o uno aleatorizado equivalente. A veces necesitamos tener el control de una variable específica y nos vendría bien parametrizar la creación de los ejemplos.

Sin embargo, es preferible limitar la flexibilidad a las necesidades del test, es decir, no queremos crear una factoría genérica, lo que nos volvería a traer los problemas por los que originalmente introdujimos el patrón Object Mother. 

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

$hugeOrder = OrderExamples::withProductos(1000);
```

### Reutilizar código en la factoría de ejemplos

Nuestro OrderExamples puede reutilizar su código:

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

Nada nos impide tampoco usar un Object Mother que nos proporcione ejemplos polimórficos. Imaginemos que hemos decidido modelar los distintos tipos de Consumer, con subclases. En ese caso, puede tener mucho sentido que un mismo `CustomerExamples` nos devuelva los tipos de objetos adecuados.

```php
class UnderAgeCustomer extends Customer
{
    
}

class AdultCustomer extends Customer
{
    
}
```

Con lo que CustomerExamples podría quedar así:

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

    public static function byAge(string $name, string $surname, int $age): Customer
    {
        if ($age < 18) {
            return new UnderAgeCustomer($name, $surname, $age);
        }
        
        return new AdultCustomer($name, $surname, $age);
    }
}
```

Lo que simplificaría la creación de ejemplos. En este caso, CustomerExamples se volvería casi innecesario. Pero el mundo real siempre es más complicado.

```php
class CustomerExamples
{
    public static function dummy(): Customer
    {
        return Customer::byAge('Dummy', 'Customer', 45);
    }
    
    public static function random(): Customer
    {
        return Customer::byAge('Random', 'Customer', random_int(10, 90));
    }

    public static function underAge(): Customer
    {
        return Customer::byAge('Kid', 'Customer', random_int(8, 17));
    }

    public static function adult(): Customer
    {
        return Customer::byAge('Adult', 'Customer', random_int(18, 80));
    }
}
```

## En resumen

Object Mother es un patrón que puede traer mucho orden y claridad a tus tests, proporcionando un único punto de generación de ejemplos que, además, aportan el beneficio de tener valor semántico, permitiéndonos discutir sobre ellos, y poder utilizarlos en toda la suite de una forma coherente.
