---
layout: post
title: Refactor cotidiano (8). Dónde poner el conocimiento
categories: articles
tags: good-practices refactoring
---

En anteriores entregas hemos propuesto refactorizar código a Value Objects o aplicar principios como la *ley de Demeter* o *Tell, don't ask* para mover código a un lugar más adecuado. En este capítulo vamos a analizarlo desde un punto de vista más general.

Solemos decir que refactorizar tiene que ver con el **conocimiento** y el **significado**. Fundamentalmente, porque lo que hacemos es aportar significado al código con el objetivo de que éste represente de una manera fiel y dinámica el conocimiento cambiante que tenemos del negocio del que nos ocupamos.

En el código de una aplicación tenemos objetos que representan alguna de estas cosas del negocio:

* **Conceptos**, ya sea en forma de entidades o de value objects. Las entidades representan conceptos que nos interesan por su identidad y tienen un ciclo de vida. Los value objects representan conceptos que nos interesan por su valor.
* **Relaciones entre esos conceptos**, que suelen representarse en forma de agregados y que están definidas por las reglas de negocio.
* **Procesos** que hacen interactuar los conceptos conforme a reglas de negocio también.

Uno de los problemas que tenemos que resolver al escribir código y al refactorizarlo es dónde poner el conocimiento y, más exactamente, las reglas de negocio.

Si hay algo que caracteriza al *legacy* es que el conocimiento sobre las reglas de negocio suele estar disperso a lo largo y ancho del código, en los lugares más imprevisibles y representado de las formas más dispares. El efecto de refactorizar este código es, esperamos, llegar a trasladar ese conocimiento al lugar donde mejor nos puede servir.

## Principios básicos

**Principio de abstracción**. Benjamin Pierce formuló el principio de abstracción en su libro [*Types and programming languages*](https://www.amazon.es/Types-Programming-Languages-MIT-Press/dp/0262162091/ref=sr_1_1?adgrpid=56467442856&hvadid=275405870353&hvdev=c&hvlocphy=1005434&hvnetw=g&hvpos=1t1&hvqmt=e&hvrand=14620334178548921835&hvtargid=kwd-298006847943&keywords=types+and+programming+languages&qid=1555607597&s=gateway&sr=8-1):

>Each significant piece of functionality in a program should be implemented in just one place in the source code. Where similar functions are carried out by distinct pieces of code, it is generally beneficial to combine them into one by abstracting out the varying parts.

**DRY**. Por su parte, Andy Hunt y David Thomas, en [*The Pragmatic Programmer*](https://www.amazon.es/s?k=the+pragmatic+programmer&adgrpid=55802357883&hvadid=275519489680&hvdev=c&hvlocphy=1005434&hvnetw=g&hvpos=1t1&hvqmt=e&hvrand=18337966056430542312&hvtargid=kwd-302199567278&tag=hydes-21&ref=pd_sl_63qujbqsqo_e), presentan una versión de este mismo principio que posiblemente te sonará más: **Don't Repeat Yourself:**

>Every piece of knowledge must have a single, unambiguous, authoritative representation within a system.

En esencia, la idea que nos interesa recalcar es que cada regla de negocio estará representada en un único lugar y esa representación será la de referencia para todo el código.

Los principios que hemos enunciado se centran en el carácter único de la representación, pero no nos dicen dónde debe residir la misma. Lo cierto es que es un tema complejo, pues es algo que puede admitir varias interpretaciones y puede depender del estado de nuestro conocimiento actual del negocio.

## Buscando dónde guardar el conocimiento

### En los objetos a los que pertenece

El principio *Tell, don't ask* nos proporciona una primera pista: el conocimiento que afecta sólo a un objeto debería estar en el propio objeto. Esto es, en lugar de obtener información de un objeto para operar con ella y tomar una decisión sobre ese objeto, le pedimos que lo haga él mismo y nos entregue el resultado si es preciso.

En ese sentido, los *Value Objects*, de los que hemos hablado tantas veces, son lugares ideales para encapsular conocimiento. Veamos un ejemplo:

Supongamos que en nuestro negocio estamos interesados en ofrecer ciertos productos o ventajas a usuarios cuya cuenta de correo pertenezca a ciertos dominios. Por tanto, el correo electrónico es un concepto importante del negocio y lo representamos mediante un Value Object:

```php
<?php
declare(strict_types=1);

namespace App\Domain;

use InvalidArgumentException;

class Email
{
    /** @var string */
    private $email;

    public function __construct(string $email)
    {
        if (! filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new InvalidArgumentException(sprintf('%s is not valid email.', $email));
        }

        $this->email = $email;
    }

    public function value(): string
    {
        return $this->email;
    }

    public function __toString(): string
    {
        return $this->value();
    }
}
```

En un determinado servicio verificamos que el dominio del correo electrónico del usuario se encuentra dentro de la lista de dominios beneficiados de este tratamiento especial.

```php
<?php
declare(strict_types=1);

namespace App\Domain;

class OfferPromotion
{
    public function applyTo(Order $order)
    {
        [, $domain] = explode('@', $order->customerEmail());

        if (in_array($domain, $this->getPromotionDomains->execute(), true)) {
            $order->applyPromotion($this);
        }
    }
}
```

El problema aquí es que el servicio tiene que ocuparse de obtener el dominio de la dirección de correo, cosa que no tendría que ser de su incumbencia. Pero la clase Email nos está pidiendo a gritos convertirse en la experta de calcular la parte del dominio del correo:

```php
<?php
declare(strict_types=1);

namespace App\Domain;

use InvalidArgumentException;

class Email
{
    /** @var string */
    private $email;

    public function __construct(string $email)
    {
        if (! filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new InvalidArgumentException(sprintf('%s is not valid email.', $email));
        }

        $this->email = $email;
    }

    public function value(): string
    {
        return $this->email;
    }

    public function __toString(): string
    {
        return $this->value();
    }

    public function domain(): string
    {
        [, $domain] = explode('@', $this->email);

        return $domain;
    }
}
```

Lo que hace más expresivo nuestro servicio:

```php
<?php
declare(strict_types=1);

namespace App\Domain;

class OfferPromotion
{
    public function applyTo(Order $order)
    {
        $email = $order->customer()->email();

        if (in_array($email->domain(), $this->getPromotionDomains->execute(), true)) {
            $order->applyPromotion($this);
        }
    }
}
```

### Reglas de negocio como Specification

El ejemplo anterior es una primera aproximación a cómo mover el conocimiento. En este caso no se trata tanto de la regla de negocio como de un requisito para poder implementarla.

Podríamos decir que la regla de negocio implica distintos conocimientos. En términos de negocio nuestro ejemplo se enunciaría como "todos los clientes cuyo dominio de correo esté incluido en la lista tienen derecho a tal ventaja cuando realicen tal acción". Técnicamente implica saber sobre usuarios y sus emails, y saber extraer su dominio de correo para saber si está incluido en tal lista.

Desde el punto de vista del negocio la regla relaciona clientes, seleccionados por una característica, con una ventaja que les vamos a otorgar.

Ese conocimiento se puede encapsular en una **Specification**, que no es más que un objeto que puede decidir si otro objeto cumple una serie de condiciones.

```php
<?php
declare(strict_types=1);

namespace App\Domain;

class HasDomainEligibleForPromotion
{
    public $domains = [
        'example.com',
        'example.org'
    ];
    
    public function isSatisfiedBy(Customer $customer): bool
    {
        if (in_array($customer->email(), $this->domains, true)) {
            return true;
        }
        
        return false;
    }
}
```

Ahora el conocimiento de la regla de negocio se encuentra en un sólo lugar y lo puedes reutilizar allí donde lo necesites[^fn-spec]

[^fn-spec]: Una objeción que se puede poner a este código es que instanciamos la Specification. Normalmente lo mejor sería inyectar en el servicio una factoría de Specification para pedirle las que necesitemos y que sea la factoría la que gestione sus posibles dependencias.

```php
<?php
declare(strict_types=1);

namespace App\Domain;

class OfferPromotion
{
    public function applyTo(Order $order)
    {
        $eligibleForPromotion = new HasDomainEligibleForPromotion();
        
        if ($eligibleForPromotion->isSatisfiedBy($order->customer())) {
            $order->applyPromotion($this);
        }
    }
}
```

No sólo eso, sino que incluso nos permite escribir mejor el servicio al expresar las relaciones correctas: en este caso la regla de negocio se basa en una propiedad de los clientes y no de los pedidos, aunque luego se aplique el resultado a los pedidos o al cálculo de su importe.

Sobre el patrón Specification puedes encontrar [más información en este artículo](https://franiglesias.github.io/patron-specification-del-dominio-a-la-infraestructura-1/)


