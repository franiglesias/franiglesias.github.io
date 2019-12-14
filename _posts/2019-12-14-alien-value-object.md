---
layout: post
title: Alien Value Object para traducir valores entre sistemas
categories: articles
tags: good-practices design-principles
---

*Alien Value Object* es una propuesta de patrón para convertir valores entre sistemas.

## ¿Cuántas dependencias son demasiadas dependencias? 

En las partes más antiguas del código en el que trabajo habitualmente hay algunas clases que tienen un montón de dependencias. Que esto ocurra normalmente es un *smell* que nos indica que la clase podría estar teniendo demasiadas responsabilidades y, por tanto, haciendo demasiadas cosas.

Hablemos un momento sobre esto. Decir que una clase hace demasiadas cosas puede ser algo que necesite un poco de análisis. Veamos un ejemplo:

Estoy haciendo un mini proyecto personal para refactorizar una clase que presenta el susodicho *smell*. La clase se encarga de construir un DTO para poder comunicar la información de un contrato al ERP. Así que, desde cierto punto de vista muy general, la clase sólo tiene una responsabilidad. 

Sin embargo, puede que las cosas sean un poco más complicadas.

Para poder hacer su trabajo, la clase necesita varios DTO a partir de ciertos objetos concretos, como son la información del suministro, la de facturación, la del contacto, la del contrato en sí y otros muchos detalles. Para ello, existen bloques de código, extraídos a métodos privados, que se encargan de generar ese DTO específico. 

Estos métodos privados no comparten código entre sí y, además, al fijarnos en las dependencias que tiene la clase, podemos ver que algunas de ellas son necesarias únicamente para convertir un tipo específico de todos los objetos que componen la información que deseamos enviar al ERP. O sea, cada dependencia trabaja sólo en uno de los métodos privados.

Esto es otro *smell*. Cuando introducimos una dependencia en una clase sólo para poder cumplir algún requisito de una de sus subtareas nos podría estar diciendo que esa subtarea tal vez necesite estar en su propia clase. Como hemos dicho, los métodos privados son independientes entre sí. Podría extraerlos limpiamente a su correspondiente clase, llevando consigo sus dependencias específicas.

Haciendo esto, obtendría una clase principal que se encargaría de orquestar a las otras para construir el DTO que se debe enviar al ERP. En este caso sigue teniendo bastantes dependencias, pero son mucho más cohesivas y justificadas, pues cada una de ellas se encargaría de una parte de la tarea principal.

## El drama de los Data Transformers

Pero queda más trabajo aún y de eso trata esta propuesta.

Algunas de las dependencias originales me resultan particularmente incómodas. Se trata de pequeños servicios que transforman tipos de datos específicos al formato requerido por el ERP. Por ejemplo, los tipos de cliente, que se representan con un *Value Object* en nuestro sistema, un *string* que describe el tipo, y que son representados en el ERP con un valor numérico.

Pongamos por ejemplo, que tenemos el siguiente caso, con Tipo de Cliente, con sus valores en nuestra App y en el ERP:

| App            | Erp |
|----------------|-----|
| Persona Física | 0   |
| Autónomo       | 1   |
| Empresa        | 2   |

El *Value Object*, en la App podría ser algo así, bastante simplificado:

```php
<?php
declare (strict_types=1);

namespace App\Domain\Client;

use InvalidArgumentException;

class ClientType
{
    private const PERSON = 'Persona Física';
    private const SELF_EMPLOYED = 'Autónomo';
    private const BUSINESS = 'Empresa';

    private const VALID_TYPES = [
        self::PERSON,
        self::SELF_EMPLOYED,
        self::BUSINESS,
    ];

    /** @var string */
    private $type;

    public function __construct(string $type)
    {
        if (!in_array($type, self::VALID_TYPES, true)) {
            throw new InvalidArgumentException('Invalid value for Client Type');
        }
        $this->type = $type;
    }

    public function type(): string
    {
        return $this->type;
    }
}
```


En resumidas cuentas, estos `Data Transformers` se presentan como servicios, e incluso algunos tienen interfaz como si en algún momento nos pudiese interesar intercambiar sus implementaciones (*spoiler*: no).

Por ejemplo, algo parecido a este servicio:

```php
<?php
declare (strict_types=1);

namespace App\Infrastructure\Erp\Client;

use App\Domain\Client\ClientType;
use InvalidArgumentException;

class ClientTypeErpDataTransformer
{
    public function transform(ClientType $clientType): string
    {
        switch ($clientType->type()) {
            case 'Persona Física':
                return '0';
            case 'Autónomo':
                return '1';
            case 'Empresa':
                return '2';
            default:
                throw new InvalidArgumentException('Unknown Client Type');
        }
    }
}
```

Este *smell* podría ser perfectamente [Lazy Class](https://sourcemaking.com/refactoring/smells/lazy-class): una clase con una funcionalidad mínima. Una forma de afrontarlo es añadir esa funcionalidad a la clase que la utiliza, pero si la queremos reutilizar, y es algo que nos interesa en este caso particular, tendremos que plantearnos otros enfoques.

La cuestión es que son objetos que no mantienen estado, pero tampoco tienen dependencias. ¿Se puede resolver esto de otra forma sin necesidad de añadir una entrada al Contenedor de Inyección de Dependencias? Se me ocurren varias:

Una de ellas sería incluir un método en el *Value Object* que nos proporcione directamente la representación para el ERP. 

```php
<?php
declare (strict_types=1);

namespace App\Domain\Client;

use InvalidArgumentException;

class ClientType
{
    private const PERSON = 'Persona Física';
    private const SELF_EMPLOYED = 'Autónomo';
    private const BUSINESS = 'Empresa';

    private const VALID_TYPES = [
        self::PERSON,
        self::SELF_EMPLOYED,
        self::BUSINESS,
    ];

    /** @var string */
    private $type;

    public function __construct(string $type)
    {
        if (!in_array($type, self::VALID_TYPES, true)) {
            throw new InvalidArgumentException('Invalid value for Client Type');
        }
        $this->type = $type;
    }

    public function type(): string
    {
        return $this->type;
    }

    public function asErpType(): string
    {
        switch ($this->type()) {
            case 'Persona Física':
                return '0';
            case 'Autónomo':
                return '1';
            case 'Empresa':
                return '2';
            default:
                throw new InvalidArgumentException('Unknown Client Type');
        }
    }
}
```

Esta es la solución que menos me convence ya que introduce un elemento ajeno al dominio como es el de la propia existencia del ERP.

La situación inversa, que sería tener métodos en el *Value Object* para instanciarlo a partir de representaciones del ERP es diferente, ya que se trataría de una factoría que nos da un objeto de dominio. He aquí el ejemplo con una factoría para instanciarlo con valores de la aplicación y otra para instanciarlo con valores del ERP:

```php
<?php
declare (strict_types=1);

namespace App\Domain\Client;

use InvalidArgumentException;

class ClientType
{
    private const PERSON = 'Persona Física';
    private const SELF_EMPLOYED = 'Autónomo';
    private const BUSINESS = 'Empresa';

    private const VALID_TYPES = [
        self::PERSON,
        self::SELF_EMPLOYED,
        self::BUSINESS,
    ];

    private const ERP_MAPPING = [
        '0' => self::PERSON,
        '1' => self::SELF_EMPLOYED,
        '2' => self::BUSINESS,
    ];
    
    /** @var string */
    private $type;

    private function __construct(string $type)
    {
        if (!in_array($type, self::VALID_TYPES, true)) {
            throw new InvalidArgumentException('Invalid value for Client Type');
        }
        $this->type = $type;
    }

    public static function fromString(string $type): self
    {
        return new self($type);   
    }
    
    public static function fromErpData(string $erpClientType): self 
    {
        return new self(self::ERP_MAPPING[$erpClientType]);
    }
    
    public function type(): string
    {
        return $this->type;
    }
}
```

La otra forma de hacerlo es mediante composición usando un patrón similar al decorador: un objeto traductor se instancia con el *Value Object* que queremos traducir y tenemos un método que extraer su representación. Es como si fuera un *Value Object* también, pero de otro sistema. Es un *Alien Value Object*.

```php
<?php
declare (strict_types=1);

namespace App\Infrastructure\Erp\Client;

use App\Domain\Client\ClientType;
use InvalidArgumentException;

class ErpClientType
{
    /** @var ClientType */
    private $clientType;

    public function __construct(ClientType $clientType)
    {
        $this->clientType = $clientType;
    }

    public function value(): string
    {
        switch ($this->clientType->type()) {
            case 'Persona Física':
                return '0';
            case 'Autónomo':
                return '1';
            case 'Empresa':
                return '2';
            default:
                throw new InvalidArgumentException('Unknown Client Type');
        }
    }
}
```

De esta manera, el servicio `Data Transformer` se convierte en un objeto *newable* y no es necesario inyectarlo, lo que reduce la complejidad general del código. 

```php
$clientType = $contract->clientType();
$erpClientType = new ErpClientType($clientType);

$erpDto->clientType = $erpClientType->value();
```

Incluso un poco más compacto:

```php
$erpClientType = new ErpClientType($contract->clientType());

$erpDto->clientType = $erpClientType->value();
```

Y no, no hay problemas con esto ya que se cumplen las siguientes condiciones:

* El *Alien Value Object* no tiene dependencias. Toma nuestro *Value Object* para inicializar su propio estado.
* El método de transformación no tiene *side effects*, lo que viene siendo una función pura.

Gracias a cumplirse esas condiciones, tampoco supone un problema para los tests unitarios. En realidad, todo son ventajas ya que al no tener que inyectarlos, simplificando la instanciación de la unidad bajo test y no es necesario doblarlos. Por otra parte, ellos mismos son muy fáciles de testear.

## Finalizando

Conceptualmente estos *Alien Value Objects* son una representación de un *Value Object* que será usada en un sistema externo. Las reglas de la traducción están encapsuladas en el *Alien* y son reutilizables allí donde se necesiten.

Como la traducción es una función pura, que además no tiene dependencias, no supone ningún problema que sea *newable*, lo que simplifica el código que lo deba utilizar, pues encapsula una pieza necesaria para realizar su comportamiento. Los *Aliens* pueden testearse fácilmente y no añaden ninguna complicación extra para el testeo de las clases que los utilizan.

**Cuándo no usar *Alien Value Objects*:** Si la función de traducción tiene dependencias entonces deberemos optar por *Data Tranformers* inyectables.
