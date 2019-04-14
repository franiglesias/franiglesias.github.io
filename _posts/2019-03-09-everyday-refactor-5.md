---
layout: post
title: Refactor cotidiano (5). Refactoriza a Enumerables
categories: articles
tags: good-practices refactoring
---

Los **enumerables** son tipos de datos que cuentan con un número finito de valores posibles.

Supongamos el típico problema de representar los estados de alguna entidad o proceso. Habitualmente usamos un *string* o un número para ello. La primera opción ayuda a que el valor sea legible por humanos, mientras que la representación numérica puede ser más compacta aunque más difícil de entender.

En cualquier caso, el número de estados es limitado y lo podemos contar. El problema es garantizar la consistencia de los valores que utilicemos para representarlos, incluso entre distintos sistemas.

Y aquí es dónde pueden ayudarnos los **Enumerables**.

Los **Enumerables** se modelan como **Value Objects**. Esto quiere decir que un objeto representa un valor y se encarga de mantener su consistencia, disfrutando de todas [las ventajas que señalamos en el capítulo anterior](https://franiglesias.github.io/everyday-refactor-4/).

En la práctica, además, podemos hacer que los **Enumerables** nos permitan una representación semántica en el código, aunque internamente transporten valores abstractos, como códigos numéricos, necesarios para la persistencia en base de datos, por ejemplo.

## De escalar a enumerable

Empecemos con un caso más o menos típico. Tenemos una entidad con una propiedad que puede tener dos valores, como 'activo' y 'cancelado'. Inicialmente la modelamos con un *string*, que es como se va a guardar en base de datos, y confiamos en que lo sabremos manejar sin mayores problemas en el código. ¿Qué podría salir mal?

Para empezar, cuando tenemos una variable o propiedad de tipo *string*, tenemos infinitos valores potenciales de esa variable o propiedad y tan sólo queremos usar dos de ellos. Así que, cuando necesitemos usarlo, tendremos que asegurarnos de que sólo consideraremos esos dos *strings* concretos. En otras palabras: tendremos que validarlos cada vez.

Habitualmente también haremos alguna normalización, como poner el *string* en minúsculas o mayúsculas, para simplificar el proceso de comparación y asegurarnos una representación coherente.

Pero esto debería hacerse cada vez que vamos a utilizar esta variable o propiedad, o al menos, siempre que sepamos que su origen no es confiable, como el input de usuario o una petición a la API o cualquier fuente de datos que no esté en un estado conocido.

En lugar de esto, deberíamos usar un **Value Object**, como vimos en el capítulo anterior. Realmente, lo único que hace un poco especiales a los **Enumerables** es el hecho de que el número de valores posibles es limitado lo que nos permite usar algunas técnicas interesantes.

Nuestra primera iteración es simple, definimos una clase `Status` que contiene un valor *string*.

```php
<?php
declare(strict_types=1);

namespace App\Domain;

class Status
{
    /** @var string */
    private $status;

    public function __construct(string $status)
    {
        $this->status = $status;
    }

}
```

Personalmente, me gusta añadir un método `__toString` a los VO para poder hacer el *type cast* si lo necesito.

```php
<?php
declare(strict_types=1);

namespace App\Domain;

class Status
{
    /** @var string */
    private $status;

    public function __construct(string $status)
    {
        $this->status = $status;
    }

    public function __toString(): string 
    {
        return $this->status;
    }

}
```

Tenemos que definir cuales son los valores aceptables para este VO, lo cual podemos hacer mediante constantes de clase. Definiremos una para cada valor válido y una extra que será un simple array que los agrupa, lo que nos facilitará la validación.

```php
<?php
declare(strict_types=1);

namespace App\Domain;

class Status
{
    public const ACTIVE = 'activo';
    public const CANCELLED = 'cancelado';

    private const VALID_VALUES = [
        self::CANCELLED,
        self::ACTIVE
    ];
    
    /** @var string */
    private $status;

    public function __construct(string $status)
    {
        $this->status = $status;
    }

    public function __toString(): string
    {
        return $this->status;
    }
}
```

En el ejemplo he puesto los valores aceptados en español y los nombres de las constantes en inglés, que es como haremos referencia a ellos en el código por cuestiones de lenguaje de dominio. Esta diferencia podría darse cuando, por ejemplo, necesitamos interactuar con un sistema *legacy* en el que esos valores están representados en español y sería más costoso cambiarlo que adaptarnos. 

En cualquier caso, lo que importa es que vamos a tener una representación en código de esa propiedad y los valores concretos son detalles de implementación que en unos casos podremos elegir y en otros no.

Por otro lado, está el tema de las constantes públicas. Es una cuestión de conveniencia ya que nos puede permitir acceder a los valores estándar en momentos en los que no podemos usar objetos mediante llamada estática.

Nuestro siguiente paso debería ser implementar la validación que nos garantice que podemos instanciar sólo valores correctos.

```php
<?php
declare(strict_types=1);

namespace App\Domain;

use InvalidArgumentException;

class Status
{
    public const ACTIVE = 'activo';
    public const CANCELLED = 'cancelado';

    private const VALID_VALUES = [
        self::CANCELLED,
        self::ACTIVE
    ];

    /** @var string */
    private $status;

    public function __construct(string $status)
    {
        if (! in_array($status, self::VALID_VALUES, true)) {
            throw new InvalidArgumentException(sprintf('%s is an invalid value for status', $status));
        }
        $this->status = $status;
    }

    public function __toString(): string
    {
        return $this->status;
    }
}
```

Como se puede ver, es muy sencillo ya que simplemente comprobamos si el valor aportado está en la lista de valores admitidos. Pero, como es un *string*, podríamos tener algún problema en caso de que nos pasen el dato con alguna mayúscula. En estos casos, no está de más, realizar una normalización básica. Tampoco se trata de arreglar el input externo, pero sí de prevenir alguno de los errores habituales.

```php
<?php
declare(strict_types=1);

namespace App\Domain;

use InvalidArgumentException;

class Status
{
    public const ACTIVE = 'activo';
    public const CANCELLED = 'cancelado';

    private const VALID_VALUES = [
        self::CANCELLED,
        self::ACTIVE
    ];

    /** @var string */
    private $status;

    public function __construct(string $status)
    {
        $status = mb_convert_case($status, MB_CASE_LOWER);
        
        if (! in_array($status, self::VALID_VALUES, true)) {
            throw new InvalidArgumentException(sprintf('%s is an invalid value for status', $status));
        }
        
        $this->status = $status;
    }

    public function __toString(): string
    {
        return $this->status;
    }
}
```

Para terminar con lo básico, necesitamos un método para comprobar la igualdad, así como un método para obtener su valor escalar si fuese preciso.

```php
<?php
declare(strict_types=1);

namespace App\Domain;

use InvalidArgumentException;

class Status
{
    public const ACTIVE = 'activo';
    public const CANCELLED = 'cancelado';

    private const VALID_VALUES = [
        self::CANCELLED,
        self::ACTIVE
    ];

    /** @var string */
    private $status;

    public function __construct(string $status)
    {
        $status = mb_convert_case($status, MB_CASE_LOWER);

        if (! in_array($status, self::VALID_VALUES, true)) {
            throw new InvalidArgumentException(sprintf('%s is an invalid value for status', $status));
        }
        $this->status = $status;
    }

    public function value(): string 
    {
        return $this->status;
    }
    
    public function equals(Status $anotherStatus): bool
    {
        return $this->status === $anotherStatus->status;
    }

    public function __toString(): string
    {
        return $this->value();
    }

}
```

Y, con esto, ya tenemos un Enumerable.

## Bonus points

Hay algunas cosas interesantes que podemos hacer con los **enumerables**, a fin de que resulten más cómodos y útiles.

Por ejemplo, podemos querer tener *named constructors* que hagan más explícita la forma de creación.

```php
public static function fromString(string $status): Status
{
    return new self($status);
}
```

Puesto que son pocos valores, podríamos permitirnos tener *named constructors* para crear directamente instancias con un valor determinado:

```php
<?php
declare(strict_types=1);

namespace App\Domain;

use InvalidArgumentException;
use phpDocumentor\Reflection\Types\Self_;

class Status
{
    public const ACTIVE = 'activo';
    public const CANCELLED = 'cancelado';

    private const VALID_VALUES = [
        self::CANCELLED,
        self::ACTIVE
    ];


    /** @var string */
    private $status;

    private function __construct(string $status)
    {
        $status = mb_convert_case($status, MB_CASE_LOWER);

        if (! in_array($status, self::VALID_VALUES, true)) {
            throw new InvalidArgumentException(sprintf('%s is an invalid value for status', $status));
        }
        $this->status = $status;
    }

    public static function fromString(string $status): Status
    {
        return new self($status);
    }

    public static function active(): Status
    {
        return new self(self::ACTIVE);
    }

    public static function cancelled(): Status
    {
        return new self(self::CANCELLED);
    }

    public function value(): string
    {
        return $this->status;
    }

    public function equals(Status $anotherStatus): bool
    {
        return $this->status === $anotherStatus->status;
    }

    public function __toString(): string
    {
        return $this->value();
    }

}
```

Con esto, podemos hacer privado el constructor standard, usando así la clase:

```
$initialStatus = Status::active();

$newStatus = Status::cancelled(); 
```

## Enumerables y cambios de estado

Supongamos que una cierta propiedad de una entidad se puede modelar con un enumerable de n elementos con la característica de que sólo puede cambiar en una cierta secuencia. 

Con frecuencia nos encontramos que esta gestión de estados la realiza la entidad. Sin embargo, podemos delegar en el enumerable buena parte de este comportamiento.

A veces esta secuencia es lineal, indicando que la entidad pasa, a lo largo de su ciclo de vida, por los diferentes estados en un orden prefijado. Por ejemplo, un contrato puede pasar por los estados *pre-signed*, *signed*, *extended* and *finalized*, pero siempre lo hará en ese orden, por lo que es necesario comprobar que no es posible asignar a un contrato un estado nuevo que sea "incompatible" con el actual.

Otras veces, el orden de la secuencia puede variar, pero sólo se puede pasar de unos estados determinados a otros. Por ejemplo, un post de un blog, puede pasar de *draft* a *ready to review*, pero no directamente a *published*, mientras que desde *ready to review* puede volver a *draft*, si el revisor no lo encuentra adecuado, o avanzar a *published* si está listo para ver la luz.

Como hemos dicho, este tipo de reglas de negocio pueden encapsularse en el propio enumerable simplificando así el código de la entidad. Hay muchas formas de hacer esto y en casos complejos necesitaremos hacer uso de otros patrones.

Veamos el ejemplo lineal. Supongamos un `ContractStatus` que admite tres estados que se suceden en una única secuencia. Podemos tener un método en el Enumerable para avanzar un paso el estado:

```php
<?php
declare(strict_types=1);

namespace App\Domain;

use DomainException;

class ContractStatus
{
    public const PRESIGNED = 'presigned';
    public const SIGNED = 'signed';
    public const FINALIZED = 'finalized';

    private const VALID_STATUSES = [
        self::PRESIGNED,
        self::SIGNED,
        self::FINALIZED
    ];
    /** @var string */
    private $status;

    public function __construct(string $status)
    {
        $status = mb_convert_case($status, MB_CASE_LOWER);
        if (! in_array($status, self::VALID_STATUSES, true)) {
            throw new \InvalidArgumentException(sprintf('%s status not valid', $status));
        }
        $this->status = $status;
    }

    public function status(): string
    {
        return $this->status;
    }

    public function forward(): ContractStatus
    {
        switch ($this->status) {
            case self::PRESIGNED:
                return new self(self::SIGNED);
            case self::SIGNED:
                return new self(self::FINALIZED);
        }

        throw new DomainException(
            sprintf('Can not forward from %s status', $this->status())
        );
    }
}
```

Este ejemplo nos permite hacer avanzar el estado de un objeto contrato de este modo. Recuerda que al ser un Value Object el método nos devuelve una nueva instancia de `ContractStatus`.

```
try {
    $this->contractStatus = $this->contractStatus->forward();
} catch (DomainException $exception) {
    // Do the right thing to manage exception
}
```

Otra situación interesante se produce cuando necesitamos reasignar el estado del contrato de forma directa. Por ejemplo, debido a errores o tal vez por necesidades de sincronización entre distintos sistemas. En esos caso, podríamos tener (o no) reglas de negocio que permitan ciertas cambios y prohiban otros.

Para nuestro ejemplo vamos a imaginar que un contrato puede volver atrás un paso (de *signed* a *pre-signed* y de *finalized* a *signed*) o avanzar un paso, como en el método `forward`.

Esta implementación es bastante tosca, pero creo que representa con claridad la intención. El método `changeTo` nos permite pasarle un nuevo `ContractStatus` y nos lo devuelve si el cambio es válido o bien lanza una excepción.

```php
<?php
declare(strict_types=1);

namespace App\Domain;

use DomainException;

class ContractStatus
{
    public const PRESIGNED = 'presigned';
    public const SIGNED = 'signed';
    public const FINALIZED = 'finalized';

    private const VALID_STATUSES = [
        self::PRESIGNED,
        self::SIGNED,
        self::FINALIZED
    ];
    /** @var string */
    private $status;

    public function __construct(string $status)
    {
        $status = mb_convert_case($status, MB_CASE_LOWER);
        if (! in_array($status, self::VALID_STATUSES, true)) {
            throw new \InvalidArgumentException(sprintf('%s status not valid', $status));
        }
        $this->status = $status;
    }

    public function status(): string
    {
        return $this->status;
    }

    public function forward(): ContractStatus
    {
        switch ($this->status) {
            case self::PRESIGNED:
                return new self(self::SIGNED);
            case self::SIGNED:
                return new self(self::FINALIZED);
        }

        throw new DomainException(
            sprintf('Can not forward from %s status', $this->status())
        );
    }

    public function changeTo(ContractStatus $newContractStatus): ContractStatus
    {
    
        switch ($this->status) {
            case self::PRESIGNED:
                if ($newContractStatus->status() !== self::SIGNED) {
                    $this->failWhenChangeIsNotAllowed($newContractStatus);
                }
                break;
            case self::FINALIZED:
                if ($newContractStatus->status() !== self::SIGNED) {
                    $this->failWhenChangeIsNotAllowed($newContractStatus);
                }
                break;
            default:
                if ($newContractStatus->status() === self::SIGNED) {
                    $this->failWhenChangeIsNotAllowed($newContractStatus);
                }
        }

        return $newContractStatus;
    }

    private function failWhenChangeIsNotAllowed(ContractStatus $newContractStatus): void
    {
        throw new DomainException(
            sprintf(
                'Change form %s to %s is not allowed',
                (string)$this,
                (string)$newContractStatus
            )
        );
    }
}

```

En esencia, el método `changeTo` valida que el estado se pueda cambiar teniendo en cuenta el estado actual. La idea de fondo es aplicar el principio `Tell, don't ask`, de modo que no le preguntemos al contrato por su estado, ni a `ContractStatus` por su valor, si no que le decimos que cambie a un nuevo estado si es posible. En caso de fallo, ya tomaremos nosotros las medidas necesarias.

```php
try {
    $this->contractStatus = $this->contractStatus->changeTo();
} catch (DomainException $exception) {
    // Do the right thing to manage exception
}
```


## Enumerables como traductores

¿Y qué ocurre si tenemos que interactuar con distintos sistemas que representan el mismo significado con distintos valores? Podría ocurrir que uno de los sistemas lo hiciese con enteros de modo que necesitamos alguna traducción.

Un enfoque pragmático, cuando las combinaciones de valores/versiones son reducidas, sería incorporar esa capacidad al propio Enumerable, mediante un named constructor específico y un método para obtener esa versión del valor.

```php
<?php
declare(strict_types=1);

namespace App\Domain;

use InvalidArgumentException;

class Status
{
    public const ACTIVE = 'activo';
    public const CANCELLED = 'cancelado';

    private const VALID_VALUES = [
        self::CANCELLED,
        self::ACTIVE
    ];

    private const LEGACY_MAP = [
        101 => self::CANCELLED,
        200 => self::ACTIVE
    ];

    /** @var string */
    private $status;

    public function __construct(string $status)
    {
        $status = mb_convert_case($status, MB_CASE_LOWER);

        if (! in_array($status, self::VALID_VALUES, true)) {
            throw new InvalidArgumentException(sprintf('%s is an invalid value for status', $status));
        }
        $this->status = $status;
    }

    public static function fromString(string $status): Status
    {
        return new self($status);
    }

    public static function fromLegacy(int $status): Status
    {
        return new self(self::LEGACY_MAP[$status]);
    }

    public function toLegacy(): int
    {
        return array_flip(self::LEGACY_MAP)[$this->status];
    }

    public function value(): string
    {
        return $this->status;
    }

    public function equals(Status $anotherStatus): bool
    {
        return $this->status === $anotherStatus->status;
    }

    public function __toString(): string
    {
        return $this->value();
    }
}
```

### Añadiendo rigor al enumerable

Aunque la solución que acabamos de ver resulta práctica en ciertos casos, lo cierto es que no es precisamente rigurosa al mezclar responsabilidades.

Nos hace falta algún tipo de traductor:

```php
<?php
declare(strict_types=1);

namespace App\Domain;

class LegacyStatusTransformer
{
    private const LEGACY_MAP = [
        '101' => Status::CANCELLED,
        '200' => Status::ACTIVE
    ];

    public function fromLegacy(string $status): Status
    {
        return new Status(self::LEGACY_MAP[$status]);
    }


    public function toLegacy(Status $status): string
    {
        return (string)array_flip(self::LEGACY_MAP)[$status->value()];
    }
}
```

