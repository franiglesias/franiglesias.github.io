---
layout: post
title: Cláusulas de guarda con asserts
categories: articles
tags: tips good-practices
---

Las cláusulas de guarda nos permiten asegurar que se cumplen las condiciones necesarias para ejecutar un método.

En el código, las cláusulas de guarda son habitualmente estructuras if que lanzan una excepción si una cierta condición requerida no se cumple. La idea es despejar el terreno de casos no válidos para ejecutar el algoritmo contenido en el método solo con valores válidos.

Las cláusulas de guarda son un buen medio de forzar que se cumplen las reglas de negocio. Un buen lugar para ello son los constructores de las entidades, aunque es aplicable a cualquier método que tenga que verificar que los argumentos recibidos o ciertas condiciones se cumplen. Vamos a ver un ejemplo muy sencillo.

Supongamos que estamos modelando una entidad Book en una aplicación. Las reglas de negocio nos dicen que:

* Un libro tiene que tener título, que es un string no vacío.
* Un libro tiene que tener autor, que es una entidad Author.
* Un libro puede crearse con o sin contenido inicial.

Empecemos con el código más sencillo:

```php
<?php
declare (strict_types=1);

namespace App\Book;

class Book
{
    /** @var string $title */
    private $title;
    /** @var Author $author */
    private $author;
    /** @var string|null $content */
    private $content;

    /**
     * Book constructor.
     * @param string $title
     * @param Author $author
     * @param string $content
     */
    public function __construct($title, $author, $content = null)
    {
        $this->title = $title;
        $this->author = $author;
        $this->content = $content;
    }
}
```

Este código permite asegurar parte de las reglas de negocio, obligando a crear `Book` con `$title` y `$author`, mientras que `$content` es optativo.

Sin embargo, no fuerza que `$author` sea una entidad `Author`, ni que el título contenga algún valor.

Lo primero se puede forzar mediante un *type hint* que aplicamos a todos los parámetros, lo cual convierte en redundante el bloque PHPDOC:

```php
<?php
declare (strict_types=1);

namespace App\Book;

class Book
{
    /** @var string $title */
    private $title;
    /** @var Author $author */
    private $author;
    /** @var string|null $content */
    private $content;

    public function __construct(string $title, Author $author, ?string $content = null)
    {
        $this->title = $title;
        $this->author = $author;
        $this->content = $content;
    }
}
```

Se podría decir que el type hinting es una cláusula de guarda implícita y disponible a nivel de lenguaje, que nos permite asegurar al menos algunos requisitos técnicos básicos.

Esto nos deja que el título no esté vacío. Aunque definamos que `$title` es un `string`, el string vacío `''` sigue siendo un valor aceptable para el type hinting, por lo que necesitamos la cláusula de guarda.

Lo más habitual es hacer esto:

```php
<?php
declare (strict_types=1);

namespace App\Book;

class Book
{
    /** @var string $title */
    private $title;
    /** @var Author $author */
    private $author;
    /** @var string|null $content */
    private $content;

    public function __construct(string $title, Author $author, ?string $content = null)
    {
        if (empty($title)) {
            throw new \InvalidArgumentException('Title should have a value');
        }
        $this->title = $title;
        $this->author = $author;
        $this->content = $content;
    }
}
```

Ahora, supongamos que se añade una nueva regla de negocio:

* Un libro tiene que tener título, que es un string no vacío
* **El título tiene un mínimo de cinco caracteres.**
* Un libro tiene que tener autor, que es una entidad Author.
* Un libro puede crearse con o sin contenido inicial.

En ese caso podemos añadir lo siguiente:

```php
<?php
declare (strict_types=1);

namespace App\Book;

use InvalidArgumentException;

class Book
{
    protected const MINIMUM_TITLE_LENGTH = 5;
    /** @var string $title */
    private $title;
    /** @var Author $author */
    private $author;
    /** @var string|null $content */
    private $content;

    public function __construct(string $title, Author $author, ?string $content = null)
    {
        if (empty($title)) {
            throw new InvalidArgumentException('Title should have a value');
        }

        if (strlen($title) < self::MINIMUM_TITLE_LENGTH) {
            throw new InvalidArgumentException('Title should have 5 chars at least');
        }

        $this->title = $title;
        $this->author = $author;
        $this->content = $content;
    }
}
```

Nota: es cierto que una condición incluye a la otra, pero lo que me interesa es simplemente ver qué podemos hacer cuando tenemos varias cláusulas.

Estas cláusulas de guarda puede llegar a hacerse bastante complejas de leer, tenemos varias formas de mejorar esto y una de ellas es mediante Assert. Sí, las mismas asserts que harías en un test. Aunque puede usar algunas librerías como:

* [WebMozart Assert](https://github.com/webmozart/assert)
* [Beberlei Assert](https://github.com/beberlei/assert)

En este ejemplo utilizaré las de PHPUnit.

Las Asserts encapsulan la verificación de condiciones en una expresión que suele ser simple y fácil de leer, reforzando además la idea de que son pre-condiciones de obligado cumplimiento:

```php
<?php
declare (strict_types=1);

namespace App\Book;

use InvalidArgumentException;
use PHPUnit\Framework\Assert;

class Book
{
    protected const MINIMUM_TITLE_LENGTH = 5;
    /** @var string $title */
    private $title;
    /** @var Author $author */
    private $author;
    /** @var string|null $content */
    private $content;

    public function __construct(string $title, Author $author, ?string $content = null)
    {
        Assert::assertNotEmpty($title, 'Title should have a value');
        Assert::assertGreaterThanOrEqual(
            self::MINIMUM_TITLE_LENGTH,
            strlen($title),
            sprintf('Title should have %s chars at least', self::MINIMUM_TITLE_LENGTH)
        );
        
        $this->title = $title;
        $this->author = $author;
        $this->content = $content;
    }
}
```

Un conjunto de Asserts referidos al mismo parámetro o relacionados entre sí de algún modo, puede encapsularse en un método privado:

```php
<?php
declare (strict_types=1);

namespace App\Book;

use InvalidArgumentException;
use PHPUnit\Framework\Assert;

class Book
{
    protected const MINIMUM_TITLE_LENGTH = 5;
    /** @var string $title */
    private $title;
    /** @var Author $author */
    private $author;
    /** @var string|null $content */
    private $content;

    public function __construct(string $title, Author $author, ?string $content = null)
    {
        $this->assertValidTitle($title);

        $this->title = $title;
        $this->author = $author;
        $this->content = $content;
    }

    private function assertValidTitle(string $title): void
    {
        Assert::assertNotEmpty($title, 'Title should have a value');
        Assert::assertGreaterThanOrEqual(
            self::MINIMUM_TITLE_LENGTH,
            strlen($title),
            sprintf('Title should have %s chars at least', self::MINIMUM_TITLE_LENGTH)
        );
    }
}
```

Aquí tienes el ejemplo usando WebMozart\Assert:

```php
<?php
declare (strict_types=1);

namespace App\Book;

use Webmozart\Assert\Assert;

class Book
{
    protected const MINIMUM_TITLE_LENGTH = 5;
    /** @var string $title */
    private $title;
    /** @var Author $author */
    private $author;
    /** @var string|null $content */
    private $content;

    public function __construct(string $title, Author $author, ?string $content = null)
    {
        $this->assertValidTitle($title);

        $this->title = $title;
        $this->author = $author;
        $this->content = $content;
    }

    private function assertValidTitle(string $title): void
    {
        Assert::notEmpty($title, 'Title should have a value');
        Assert::minLength(
            $title,
            self::MINIMUM_TITLE_LENGTH,
            sprintf('Title should have %s chars at least', self::MINIMUM_TITLE_LENGTH)
        );
    }
}
```

Por cierto, puedes testear que fallen estas aserciones esperando que se lance la excepción `ExpectationFailedException`:

```php
<?php
declare (strict_types=1);

namespace Tests\App\Book;

use App\Book\Author;
use App\Book\Book;
use PHPUnit\Framework\ExpectationFailedException;
use PHPUnit\Framework\TestCase;

class BookTest extends TestCase
{
    public function testShouldFailIfEmptyTitle(): void
    {
        $this->expectException(ExpectationFailedException::class);
        Book::createWithoutContent('', new Author());
    }
}
```
