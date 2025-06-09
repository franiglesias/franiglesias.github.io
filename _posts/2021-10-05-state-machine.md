---
layout: post
title: El patrón State
series: design-patterns
categories: articles
tags: design-patterns good-practices
---

Cómo modelar propiedades de estado de una entidad y sus transformaciones.

Un problema bastante habitual que nos encontramos es el modelado de los estados por los que puede pasar una entidad. Hay multitud de ejemplos:

* Un post de un blog puede estar en borrador, pendiente de revisión, publicado, o caducado.
* Un contrato puede estar en espera de firma, firmado o expirado.
* Un usuario puede estar en espera de confirmación, activo, desactivado, etc.

La gestión de estados suele ser un punto crucial de la lógica de cualquier aplicación. Quizá el punto más crítico sea, sobre todo, aplicar las reglas de negocio que conciernen a las transformaciones permitidas o no permitidas entre estados y las condiciones que se deben cumplir. Para esto se puede utilizar una máquina de estados finitos.

Nos interesan tres conceptos principales:

* **Estados**: representan las diversas configuraciones que puede tener el sistema en un momento dado. Es un conjunto finito, habiendo un número determinado de estados en el sistema.
* **Transformaciones**: son las acciones que hacen cambiar al sistema de un estado a otro.
* **Guardas**: son las condiciones que se deben cumplir para que una transformación pase de uno a otro estado.

Para ilustrar el proceso, voy a empezar con un sistema muy sencillo: un interruptor.

## Caso de estudio: modelando un interruptor

Un interruptor solo tiene dos estados: _encendido_ (on) o _apagado_ (off), y se pueden aplicar dos transformaciones: _encender_ o _apagar_. Estas transformaciones funcionan así:

| estado inicial | transformación | estado final |
| :------------: | :------------: | :----------: |
| encendido | encender | encendido |
| encendido | apagar | apagado |
| apagado | encender | encendido |
| apagado | apagar | apagado |

Las transformaciones se aplican a todos los estados. En algunos casos producen un cambio y en otros no. En el ejemplo, aplicar la transformación `encender` cuando el estado es `encendido` no produce un cambio de estado. En sistemas más complejos puede haber transformaciones ilegales según el estado inicial, pero lo veremos en otro ejemplo.

Veamos una primera posible implementación como enumerable. En primer lugar, tenemos este test que describe el comportamiento del interruptor:

```php
<?php
declare (strict_types=1);

namespace App\Tests\StateMachine;

use App\StateMachine\LightSwitch;
use PHPUnit\Framework\TestCase;

class LightSwitchTest extends TestCase
{
    /** @test */
    public function shouldSwitchOn(): void
    {
        $switch = new LightSwitch();

        $switch = $switch->switchOn();

        self::assertTrue($switch->isOn());
    }

    /** @test */
    public function shouldSwitchOff(): void
    {
        $switch = new LightSwitch();

        $switch = $switch->switchOff();

        self::assertFalse($switch->isOn());
    }
}
```

Y aquí una implementación que refleja una forma más o menos habitual de lidiar con los estados de una entidad:

```php
<?php
declare (strict_types=1);

namespace App\StateMachine;

class LightSwitch
{

    private const ON = 'on';
    private const OFF = 'off';
    private string $state;

    public function __construct(?string $state = null)
    {
        $this->state = $state ?? self::ON;
    }

    public function switchOn(): self
    {
        if ($this->state === self::OFF) {
            return new self(self::ON);
        }

        return $this;
    }

    public function switchOff(): self
    {
        if ($this->state === self::ON) {
            return new self(self::OFF);
        }

        return $this;
    }

    public function isOn(): bool
    {
        return $this->state === self::ON;
    }
}
```

Podemos ver que la implementación recoge tanto los estados posibles como las transformaciones. Por supuesto los tests pasan. 

Las transformaciones nos muestran los problemas típicos de la gestión de estados. En cada transformación tenemos que verificar cuál es el estado actual y aplicar las reglas que corresponderían para decidir cuál es el nuevo estado que se devuelve.

Como un interruptor solo tiene dos estados y dos transformaciones, la implementación es relativamente sencilla. Sin embargo, implica cuatro posibles flujos de ejecución. Simplemente tienes que multiplicar el número de transiciones por el número de estados para hacerte una idea de cuán complicado puede llegar a ser desarrollar una máquina de estados.

Aparte de eso, ¿qué ocurriría si hay que dar soporte a un nuevo estado y, posiblemente, a una nueva transformación? Tenemos una violación del principio Abierto/Cerrado bastante grande: tenemos que tocar en todas y cada una de las transformaciones para poder implementar un nuevo estado.

Sin embargo, podemos usar otro enfoque: el patrón **State**.

Lo que propone el patrón **State** es modelar cada estado como un objeto. Cada objeto implementa las transformaciones, devolviendo una instancia del objeto que representa el estado tras la transformación. Obviamente, estos objetos implementarán una interfaz común cuyos métodos serán las transformaciones.

Vamos a ver una implementación alternativa de nuestro interruptor.

Necesitamos una interfaz:

```php
<?php
declare (strict_types=1);

namespace App\StateMachine;

interface LightSwitch
{
    public function switchOn(): LightSwitch;

    public function switchOff(): LightSwitch;

    public function isOn(): bool;
}
```

La interfaz expone las transformaciones y otros métodos que puedan ser necesarios para comunicarse con el objeto. A continuación, modelamos cada estado con una clase. En primer lugar, el estado encendido:

```php
<?php
declare (strict_types=1);

namespace App\StateMachine;

class OnLightSwitch implements LightSwitch
{
    public function switchOn(): LightSwitch
    {
        return $this;
    }

    public function switchOff(): LightSwitch
    {
        return new OffLightSwitch();
    }

    public function isOn(): bool
    {
        return true;
    }
}
```

Y el estado apagado:

```php
<?php
declare (strict_types=1);

namespace App\StateMachine;

class OffLightSwitch implements LightSwitch
{
    public function switchOn(): LightSwitch
    {
        return new OnLightSwitch();
    }

    public function switchOff(): LightSwitch
    {
        return $this;
    }

    public function isOn(): bool
    {
        return false;
    }
}
```

Nuestro test inicial cambia un poco, ya que tenemos que usar una de las clases concretas, pero sigue pasando. De hecho el test pasa con cualquiera de las dos clases concretas.

```php
<?php
declare (strict_types=1);

namespace App\Tests\StateMachine;

use App\StateMachine\OnLightSwitch;
use PHPUnit\Framework\TestCase;

class LightSwitchTest extends TestCase
{
    /** @test */
    public function shouldSwitchOn(): void
    {
        $switch = new OnLightSwitch();

        $switch = $switch->switchOn();

        self::assertTrue($switch->isOn());
    }

    /** @test */
    public function shouldSwitchOff(): void
    {
        $switch = new OnLightSwitch();

        $switch = $switch->switchOff();

        self::assertFalse($switch->isOn());
    }
}
```

Veamos las ventajas: Ahora las transformaciones no necesitan condicionales, lo cual las hace más simples y fáciles de testear. Esto:

```php
    public function switchOn(): self
    {
        if ($this->state === self::OFF) {
            return new self(self::ON);
        }

        return $this;
    }
```

Frente a esto:

```php
// OffLightSwitch
    public function switchOn(): LightSwitch
    {
        return new OnLightSwitch();
    }
```

Otro detalle es que los objetos podrían no necesitar estado en forma de propiedades internas.

Con este tipo de pequeños objetos de baja complejidad es muy fácil hacer tests y no es necesario hacer los tests combinatorios típicos de otras formas de implementación. Simplemente, nos aseguramos de que cada estado realiza la transformación correcta al nuevo estado. Consecuencia: tests más sencillos, comprensibles, comprehensivos y rápidos.

Si tenemos que incorporar un estado, tendríamos que añadir una nueva clase que lo represente e implementar sus transformaciones. Igualmente, tendríamos que cambiar aquellas transformaciones de otros estados que impliquen al nuevo.

El mayor inconveniente es si tenemos que añadir una transformación, ya que habría que añadir un método a todas las clases. Por esa razón, es buena idea usar una clase abstracta que proporcione funcionalidad común y por defecto a las clases hijas.

En el caso de nuestro interruptor, el comportamiento por defecto en una transformación sería devolver la instancia actual, por lo que podríamos tener una clase abstracta como esta:

```php
<?php
declare (strict_types=1);

namespace App\StateMachine;

abstract class BaseLightSwitch implements LightSwitch
{

    public function switchOn(): LightSwitch
    {
        return $this;
    }

    public function switchOff(): LightSwitch
    {
        return $this;
    }

    abstract public function isOn(): bool;
}
```

De este modo, las clases finales requieren algo menos de trabajo, pues no tendrías que implementar lógica de transformaciones que no sean _legales_ desde cada estado, o que, como en este caso, no producen ningún efecto.

```php
<?php
declare (strict_types=1);

namespace App\StateMachine;

final class OnLightSwitch extends BaseLightSwitch
{
    public function switchOff(): LightSwitch
    {
        return new OffLightSwitch();
    }

    public function isOn(): bool
    {
        return true;
    }
}
```

```php
<?php
declare (strict_types=1);

namespace App\StateMachine;

final class OffLightSwitch extends BaseLightSwitch
{
    public function switchOn(): LightSwitch
    {
        return new OnLightSwitch();
    }

    public function isOn(): bool
    {
        return false;
    }
}
```

Con este ejemplo tan sencillo creo que pueden haber quedado claro las bases de la implementación de un patrón **State**. Sin embargo, vamos a ver a continuación un ejemplo más cercano a la realidad en el que manejamos más estados y transformaciones dentro de una entidad.

## Caso de estudio: los estados de publicación de un artículo

Voy a poner el caso de un sistema de publicación porque es algo bastante familiar y fácil de entender. Un sistema de edición suele permitir que los artículos se puedan escribir en un modo de borrador (_draft_) para que no se publiquen hasta que la autora lo considere terminado y lo publica (`published`). Además, es muy posible que para ciertos entornos, el artículo deba pasar una revisión editorial (_waiting_for_review_) antes de ser publicado. Por último, un artículo publicado puede retirarse por diversos motivos (_retired_) o marcarse como obsoleto (_deprecated_). 

La aplicación del patrón **State** es bastante obvia en esta situación. Un artículo puede pasar por varios estados en función de las acciones que realizamos sobre él.

El punto clave es que la entidad `Post` delegue en un objeto `PostState` esta gestión de estados. Hay que decir que podría ocurrir que una misma entidad tenga que gestionar distintas familias de estados. En este estudio nos centraremos en los estados relacionados con la publicación, pero podría haber otros. Por ejemplo, los artículos podrían tener un estado relacionado con el pago a las autoras. De este modo tendrían más sentido tener nombres como `PublishingStatus` o `PaymentStatus`.

Como hemos visto antes, el patrón **State** gestiona los cambios de estado provocados por determinadas transformaciones. Hay que tener presente que el estado que cambia es el del `Post` y las transformaciones que lo hacen cambiar deben formar parte de su interfaz. En nuestro caso estas transformaciones serían:

* `create`: instancia un nuevo `Post` con el contenido inicial y un estado inicial de `draft`.
* `sendToReview`: pone el estado `waitingReview`, para que esté disponible para la editora.
* `reject`: vuelve a poner el estado `draft`, si la editora considera que no está listo para publicar.
* `publish`: publica el Post, que pasa a tomar el estado `published`.
* `deprecate`: el Post se declara obsoleto, tomando el estado `deprecated`, de modo que se muestra con una advertencia indicando que la información podría no ser adecuada en el momento de la lectura.
* `retire`: retira el Post, que pasa a tomar el estado `retired`.

Algunas consideraciones: en un sistema editorial algunas de estas acciones solo pueden ser ejecutadas con los permisos correspondientes. Sin embargo, eso no será gestionado por el patrón **State**. Corresponde a otro nivel de la aplicación decidir quién tiene permisos para ejecutar cierta acción.

En cualquier caso, vamos a introducirnos a la implementación de `Post` usando un test y viendo cómo delegar toda la gestión a un objeto `PostState`. Pero empezaremos por una solución que no usa el patrón **State** de forma que podamos ver los problemas y cómo la introducción del patrón nos ayuda a resolverlos.

Testearemos la clase a través de sus transformaciones. Podríamos discutir si la creación de un `Post` es una transformación, pero en cualquier caso, implica la inicialización de un estado del mismo (`draft`).

```php
<?php
declare (strict_types=1);

namespace App\Tests\StateMachine;

use App\StateMachine;
use PHPUnit\Framework\TestCase;

class PostTest extends TestCase
{
    /** @test */
    public function shouldCreateANewPostWithDraftStatus(): void
    {
        $post = Post::create('Title', 'Body');

        self::assertEquals('draft', $post->status());
    }
}
```

Este código nos llevaría inicialmente a una implementación bastante simple:

```php
<?php
declare (strict_types=1);

namespace App\StateMachine;

class Post
{
    private string $title;
    private string $body;

    public function __construct(string $title, string $body)
    {
        $this->title = $title;
        $this->body = $body;
    }

    public static function create(string $title, string $body): self
    {
        return new self($title, $body);
    }

    public function status(): string
    {
        return 'draft';
    }
}
```

Para hacer evolucionar esta implementación necesitamos introducir una transformación que fuerce un cambio de estado. Por ejemplo, vamos a probar con `sendToReview`, que debería hacer cambiar el estado a `waitingReview`.

```php
<?php
declare (strict_types=1);

namespace App\Tests\StateMachine;

use App\StateMachine;
use App\StateMachine\Post;
use PHPUnit\Framework\TestCase;

class PostTest extends TestCase
{
    /** @test */
    public function shouldCreateANewPostWithDraftStatus(): void
    {
        $post = Post::create('Title', 'Body');

        self::assertEquals('draft', $post->status());
    }

    /** @test */
    public function shouldSendPostToReview(): void
    {
        $post = Post::create('Title', 'Body');
        $post->sendToReview();
        
        self::assertEquals('waitingReview', $post->status());
    }
}
```

Ahora el test falla. Sin embargo, la implementación actual requiere un refactor preparatorio para poder introducir el cambio. Normalmente para esto lo que hago es anular el test que falla, hago el refactor y cuando tengo el código listo, hago el cambio. Esto me lleva a la siguiente solución:

```php
<?php
declare (strict_types=1);

namespace App\StateMachine;

class Post
{
    private string $title;
    private string $body;
    private string $status;

    public function __construct(string $title, string $body)
    {
        $this->title = $title;
        $this->body = $body;
        $this->status = 'draft';
    }

    public static function create(string $title, string $body): self
    {
        return new self($title, $body);
    }

    public function status(): string
    {
        return $this->status;
    }

    public function sendToReview(): void
    {
        $this->status = 'waitingReview';
    }
}
```

Vamos a introducir ahora `publish`. La condición es que el estado del post sea `waitingReview`, mientras que la transformación de `draft` a `published` no está permitida. Necesitaremos dos nuevos tests para eso. 

Por ejemplo, supongamos que queremos publicar un `Post` recién creado que estará en estado `draft`. Esperamos que se lance una excepción porque esa transición no está permitida.

```php
<?php
declare (strict_types=1);

namespace App\Tests\StateMachine;

use App\StateMachine;
use App\StateMachine\Post;
use PHPUnit\Framework\TestCase;

class PostTest extends TestCase
{
    /** @test */
    public function shouldCreateANewPostWithDraftStatus(): void
    {
        $post = Post::create('Title', 'Body');

        self::assertEquals('draft', $post->status());
    }

    /** @test */
    public function shouldSendPostToReview(): void
    {
        $post = Post::create('Title', 'Body');
        $post->sendToReview();

        self::assertEquals('waitingReview', $post->status());
    }

    /** @test */
    public function shouldNotAllowPublishDraftPosts(): void
    {
        $post = Post::create('Title', 'Body');
        
        $this->expectException(InvalidPostTransformation::class);
        $post->publish();
    }
}
```

Esta es una implementación posible, introduciendo una excepción específica:

```php
<?php
declare (strict_types=1);

namespace App\StateMachine;

class Post
{
    private string $title;
    private string $body;
    private string $status;
    
    public function __construct(string $title, string $body)
    {
        $this->title = $title;
        $this->body = $body;
        $this->status = 'draft';
    }

    public static function create(string $title, string $body): self
    {
        return new self($title, $body);
    }

    public function status(): string
    {
        return $this->status;
    }

    public function sendToReview(): void
    {
        $this->status = 'waitingReview';
    }

    public function publish(): void
    {
        throw new InvalidPostTransformation();
    }
}
```

Ahora tenemos que dar soporte a la transformación de `waitingReview` a `published`, lo cual implica que el método `publish` tiene que considerar cuál es el estado actual de `Post`:

```php
<?php
declare (strict_types=1);

namespace App\Tests\StateMachine;

use App\StateMachine;
use App\StateMachine\InvalidPostTransformation;
use App\StateMachine\Post;
use PHPUnit\Framework\TestCase;

class PostTest extends TestCase
{
    /** @test */
    public function shouldCreateANewPostWithDraftStatus(): void
    {
        $post = Post::create('Title', 'Body');

        self::assertEquals('draft', $post->status());
    }

    /** @test */
    public function shouldSendPostToReview(): void
    {
        $post = Post::create('Title', 'Body');
        $post->sendToReview();

        self::assertEquals('waitingReview', $post->status());
    }

    /** @test */
    public function shouldNotAllowPublishDraftPosts(): void
    {
        $post = Post::create('Title', 'Body');

        $this->expectException(InvalidPostTransformation::class);
        $post->publish();
    }

    /** @test */
    public function shouldAllowPublishPostWaitingForReview(): void
    {
        $post = Post::create('Title', 'Body');
        $post->sendToReview();
        $post->publish();

        self::assertEquals('published', $post->status());
    }
}
```

Este test nos forzará a cambiar la implementación para tener en cuenta el estado actual del test a la hora de decidir qué hacer:

```php
<?php
declare (strict_types=1);

namespace App\StateMachine;

class Post
{
    private string $title;
    private string $body;
    private string $status;

    public function __construct(string $title, string $body)
    {
        $this->title = $title;
        $this->body = $body;
        $this->status = 'draft';
    }

    public static function create(string $title, string $body): self
    {
        return new self($title, $body);
    }

    public function status(): string
    {
        return $this->status;
    }

    public function sendToReview(): void
    {
        $this->status = 'waitingReview';
    }

    public function publish(): void
    {
        if ($this->status === 'draft') {
            throw new InvalidPostTransformation();
        }

        $this->status = 'published';
    }
}
```

Y es ahora cuando podemos empezar a vislumbrar los problemas de esta forma de implementación. El principal es que cada transformación requerirá que tengamos en cuenta el valor actual de `status` para verificar si el cambio está permitido o no, introduciendo una serie de condicionales para actuar según su valor. Además, tendremos que actualizar otras transformaciones para verificar si el nuevo estado `published` las afecta. 

Esto no es otra cosa que un _smell_: le preguntamos a algo sobre su tipo para actuar de forma diferente. La respuesta es polimorfismo: que cada tipo sepa actuar como corresponda en cada caso.

Y ya que ahora estamos con los tests en verde, vamos a refactorizar a polimorfismo. Como hemos mencionado más arriba, se trata de que cada estado sea representado por una clase que implementa una determinada interfaz o, en su caso, extiende de una clase abstracta común. De momento, tenemos tres estados y para no romper nada los voy a ir introduciendo en paralelo. 

```php
<?php
declare (strict_types=1);

namespace App\StateMachine;

class Post
{
    private string $title;
    private string $body;
    private string $status;
    private PostState $postState;

    public function __construct(string $title, string $body)
    {
        $this->title = $title;
        $this->body = $body;
        $this->status = 'draft';
        $this->postState = PostState::create();
    }

    public static function create(string $title, string $body): self
    {
        return new self($title, $body);
    }

    public function status(): string
    {
        return $this->status;
    }

    public function sendToReview(): void
    {
        $this->status = 'waitingReview';
    }

    public function publish(): void
    {
        if ($this->status === 'draft') {
            throw new InvalidPostTransformation();
        }

        $this->status = 'published';
    }
}
```

Esto hará fallar los tests. No tengo más que introducir la clase abstracta `PostState` y `Draft`.

```php
<?php
declare (strict_types=1);

namespace App\StateMachine\PostState;

abstract class PostState
{
    public static function create(): PostState
    {
        return new Draft();
    }
}
```

De momento, no hace falta poner mucha lógica en estas clases.

```php
<?php
declare (strict_types=1);

namespace App\StateMachine\PostState;

final class Draft extends PostState
{

}
```

Habría que hacer lo mismo con el resto de estados. Nuestro objetivo es llegar a esto:

```php
<?php
declare (strict_types=1);

namespace App\StateMachine;

use App\StateMachine\PostState\PostState;
use App\StateMachine\PostState\Published;
use App\StateMachine\PostState\WaitingReview;

class Post
{
    private string $title;
    private string $body;
    private string $status;
    private PostState $postState;

    public function __construct(string $title, string $body)
    {
        $this->title = $title;
        $this->body = $body;
        $this->status = 'draft';
        $this->postState = PostState::create();
    }

    public static function create(string $title, string $body): self
    {
        return new self($title, $body);
    }

    public function status(): string
    {
        return $this->status;
    }

    public function sendToReview(): void
    {
        $this->status = 'waitingReview';
        $this->postState = new WaitingReview();
    }

    public function publish(): void
    {
        if ($this->status === 'draft') {
            throw new InvalidPostTransformation();
        }

        $this->status = 'published';
        $this->postState = new Published();
    }
}
```

Ahora tenemos el estado del post representado de dos formas mientras que los tests siguen pasando. Es momento de empezar a cambiar cosas. En lugar de asignar los nuevos estados directamente, vamos a hacer que sean resultado de las transiciones de los estados. Fíjate en el cambio que vamos a hacer en `sendToReview`.

```php
<?php
declare (strict_types=1);

namespace App\StateMachine;

use App\StateMachine\PostState\PostState;
use App\StateMachine\PostState\Published;
use App\StateMachine\PostState\WaitingReview;

class Post
{
    private string $title;
    private string $body;
    private string $status;
    private PostState $postState;

    public function __construct(string $title, string $body)
    {
        $this->title = $title;
        $this->body = $body;
        $this->status = 'draft';
        $this->postState = PostState::create();
    }

    public static function create(string $title, string $body): self
    {
        return new self($title, $body);
    }

    public function status(): string
    {
        return $this->status;
    }

    public function sendToReview(): void
    {
        $this->status = 'waitingReview';
        $this->postState = $this->postState->sendToReview();
    }

    public function publish(): void
    {
        if ($this->status === 'draft') {
            throw new InvalidPostTransformation();
        }

        $this->status = 'published';
        $this->postState = new Published();
    }
}
```

Esto hace que falle el test porque no existe el método. Podemos empezar poniéndolo en la clase base `PostState`, de esta manera:

```php
<?php
declare (strict_types=1);

namespace App\StateMachine\PostState;

abstract class PostState
{
    public static function create(): PostState
    {
        return new Draft();
    }

    abstract public function sendToReview(): PostState;
}
```

Esto hará fallar el test, el cual nos indicará que necesitamos implementar ese método en la clase `Draft`. La clase `Draft` implementa `sendToReview` simplemente devolviendo el estado `WaitingReview`.

```php
<?php
declare (strict_types=1);

namespace App\StateMachine\PostState;

final class Draft extends PostState
{

    public function sendToReview(): PostState
    {
        return new WaitingReview();
    }
}
```

Una vez introducimos esto, nos pedirá lo mismo en los demás estados "hijos", que tendrán distintos comportamientos. Por ejemplo, `WaitingReview` debería devolverse a sí mismo, mientras que `Published` no debería permitir ese cambio. Sin embargo, aún no tenemos tests para esto.

Una solución es definir un comportamiento por defecto en la clase base. Ya sea no hacer nada, que equivale a devolver la misma instancia, o bien prohibir la transición lanzando una excepción. Podemos hacer esto último.

```php
<?php
declare (strict_types=1);

namespace App\StateMachine\PostState;

use App\StateMachine\InvalidPostTransformation;

abstract class PostState
{
    public static function create(): PostState
    {
        return new Draft();
    }

    public function sendToReview(): PostState
    {
        throw new InvalidPostTransformation();
    }
}
```

Con este cambio todos los tests pasan, ya que, por el momento, no tenemos tests que cubran la transición para los estados `WaitingReview` y `Published`. Antes de hacer esos tests vamos a avanzar un poco hasta conseguir que el estado sea manejado completamente por `PostState`. Para ello nos vamos a la transición `publish`, que es muy interesante:

```php
<?php
declare (strict_types=1);

namespace App\StateMachine;

use App\StateMachine\PostState\PostState;
use App\StateMachine\PostState\Published;
use App\StateMachine\PostState\WaitingReview;

class Post
{
    private string $title;
    private string $body;
    private string $status;
    private PostState $postState;

    public function __construct(string $title, string $body)
    {
        $this->title = $title;
        $this->body = $body;
        $this->status = 'draft';
        $this->postState = PostState::create();
    }

    public static function create(string $title, string $body): self
    {
        return new self($title, $body);
    }

    public function status(): string
    {
        return $this->status;
    }

    public function sendToReview(): void
    {
        $this->status = 'waitingReview';
        $this->postState = $this->postState->sendToReview();
    }

    public function publish(): void
    {
        $this->postState = $this->postState->publish();

        if ($this->status === 'draft') {
            throw new InvalidPostTransformation();
        }

        $this->status = 'published';
    }
}
```

Este cambio hace fallar los tests porque no existe el método `publish` en `PostState`, por lo que vamos a introducirlo en la clase base como transición no permitida.

```php
<?php
declare (strict_types=1);

namespace App\StateMachine\PostState;

use App\StateMachine\InvalidPostTransformation;

abstract class PostState
{
    public static function create(): PostState
    {
        return new Draft();
    }

    public function sendToReview(): PostState
    {
        throw new InvalidPostTransformation();
    }

    public function publish(): PostState
    {
        throw new InvalidPostTransformation();
    }
}
```

Y esto es interesante porque finalmente hace pasar el test `shouldNotAllowPublishDraftPosts`. Si quitamos la condicional de `Post::publish`, veremos que esa transición está manejada por PostState.

```php
<?php
declare (strict_types=1);

namespace App\StateMachine;

use App\StateMachine\PostState\PostState;
use App\StateMachine\PostState\Published;
use App\StateMachine\PostState\WaitingReview;

class Post
{
    private string $title;
    private string $body;
    private string $status;
    private PostState $postState;

    public function __construct(string $title, string $body)
    {
        $this->title = $title;
        $this->body = $body;
        $this->status = 'draft';
        $this->postState = PostState::create();
    }

    public static function create(string $title, string $body): self
    {
        return new self($title, $body);
    }

    public function status(): string
    {
        return $this->status;
    }

    public function sendToReview(): void
    {
        $this->status = 'waitingReview';
        $this->postState = $this->postState->sendToReview();
    }

    public function publish(): void
    {
        $this->postState = $this->postState->publish();

        $this->status = 'published';
    }
}
```

Y para hacer que pasen todos los tests, lo que tenemos que hacer es implementar `publish` en `WaitingReview`.

```php
<?php
declare (strict_types=1);

namespace App\StateMachine\PostState;

class WaitingReview extends PostState
{

    public function publish(): PostState
    {
        return new Published();
    }
}
```

Finalmente, tenemos que hacer que cada objeto estado pueda ser representado por un string que será devuelto por el método `status()` de `Post`, lo que nos permitirá dejar de usar, por fin, la propiedad `$status`. 

```php
<?php
declare (strict_types=1);

namespace App\StateMachine;

use App\StateMachine\PostState\PostState;
use App\StateMachine\PostState\Published;
use App\StateMachine\PostState\WaitingReview;

class Post
{
    private string $title;
    private string $body;
    private PostState $postState;

    public function __construct(string $title, string $body)
    {
        $this->title = $title;
        $this->body = $body;
        $this->postState = PostState::create();
    }

    public static function create(string $title, string $body): self
    {
        return new self($title, $body);
    }

    public function status(): string
    {
        return $this->postState->toString();
    }

    public function sendToReview(): void
    {
        $this->postState = $this->postState->sendToReview();
    }

    public function publish(): void
    {
        $this->postState = $this->postState->publish();
    }
}
```

Ahora tendremos que implementar un método `toString` en cada estado. Por ejemplo:

```php
<?php
declare (strict_types=1);

namespace App\StateMachine\PostState;

final class Draft extends PostState
{

    public function sendToReview(): PostState
    {
        return new WaitingReview();
    }

    public function toString(): string
    {
        return 'draft';
    }
}
```

Con este último cambio volvemos a tener todos los tests pasando y `Post` delega completamente la gestión de su estado en `PostState`.  Lo interesante es que esto también va a cambiar la forma en la que programaremos.

Pensemos en los tests, por ejemplo. Ahora mismo lo interesante sería hacer tests sobre las transformaciones y verificar que permiten los cambios de estado correctos. Hasta ahora lo hemos estado haciendo sobre `Post`, lo que es un enfoque bastante correcto por otra parte. Sin embargo, es costoso: requiere que instanciemos un `Post`, lo pongamos en el estado adecuado y apliquemos la transformación. Esto se puede ver en este test:

```php
    /** @test */
    public function shouldAllowPublishPostWaitingForReview(): void
    {
        $post = Post::create('Title', 'Body');
        $post->sendToReview();
        $post->publish();

        self::assertEquals('published', $post->status());
    }
```

Se trata de un estupendo test de aceptación para `Post`, pero generar todos los tests posibles de transformaciones puede ser realmente tedioso. Peor aún, los tests dependen de que primero ejecutemos una cierta secuencia de acciones, para poner `Post` en el estado deseado. Aunque nuestro ejemplo es bastante simple, no deberíamos contar con la misma sencillez en todos los casos.

En su lugar, ahora podemos testear de forma unitaria los objetos que representan cada estado y garantizar que ejecutan sus transformaciones correctamente. Esto nos evitará tener que hacer una combinatoria comprehensiva y serán, de hecho, tests muy pequeños y muy rápidos.

Así, por ejemplo, podríamos testear el estado `Draft`.

```php
<?php
declare (strict_types=1);

namespace App\Tests\StateMachine\PostState;

use App\StateMachine\InvalidPostTransformation;
use App\StateMachine\PostState\Draft;
use App\StateMachine\PostState\WaitingReview;
use PHPUnit\Framework\TestCase;

class DraftTest extends TestCase
{
    /** @test */
    public function shouldAllowSendToReview(): void
    {
        $draft = new Draft();
        $waitingReview = $draft->sendToReview();

        self::assertInstanceOf(WaitingReview::class, $waitingReview);
    }

    /** @test */
    public function shouldNotAllowPublish(): void
    {
        $draft = new Draft();

        $this->expectException(InvalidPostTransformation::class);
        $draft->publish();
    }
}
```

Las transformaciones, ¿deberían devolver las clases finales o la clase base? Es una cuestión interesante. Por un lado, si hacemos que las tranformaciones devuelvan clases finales, nos evitamos tener que testear (el lenguaje lo hace por nosotras). Esto se resuelve en PHP 8 usando _union types_, de modo que si un método puede devolver distintos tipos podemos especificarlos todos. Por ejemplo `WaitingReview|Published` (si esto fuese posible en nuestro sistema).

Pero nuestro ejemplo está hecho sobre PHP 7.4, así que veamos cómo quedaría `Draft` de esta forma. Primero el test:

```php
<?php
declare (strict_types=1);

namespace App\Tests\StateMachine\PostState;

use App\StateMachine\InvalidPostTransformation;
use App\StateMachine\PostState\Draft;
use PHPUnit\Framework\TestCase;

class DraftTest extends TestCase
{
    /**
     * @test
     * @doesNotPerformAssertions
     */
    public function shouldAllowSendToReview(): void
    {
        $draft = new Draft();
        $draft->sendToReview();
    }

    /** @test */
    public function shouldNotAllowPublish(): void
    {
        $draft = new Draft();

        $this->expectException(InvalidPostTransformation::class);
        $draft->publish();
    }
}
```

Y éste es el código de producción.

```php
<?php
declare (strict_types=1);

namespace App\StateMachine\PostState;

final class Draft extends PostState
{

    public function sendToReview(): WaitingReview
    {
        return new WaitingReview();
    }

    public function toString(): string
    {
        return 'draft';
    }
}
```

Sin embargo, dejaremos las transformaciones que pueden dar lugar a distintos estados con base a ciertas condiciones para otro caso de estudio. Por ahora seguiremos con `Post` y algunas consecuencias de hacer que la gestión del estado sea delegada en `PostState` y cómo sacar ventaja de ello.

Vamos a introducir una nueva transformación: `deprecate`. Esta ocurre cuando un Post lleva un cierto tiempo publicado y queremos indicar que la información puede no ser válida ya, bien sea de forma automática, porque ha alcanzado una fecha límite o por una acción de una editora. Por ejemplo, imagina un artículo con ejemplos de PHP 7 que marcas como expirado porque en PHP 8 ya no es válido o se hace de otra forma.

Empezamos con un test en uno de los estados. Recuerda que tenemos que añadir la transformación en todos. La transformación `deprecate` solo puede aplicarse a `Post` con estado `Published` y es inválida para todos los demás. Por ejemplo, para `Draft`.

```php
<?php
declare (strict_types=1);

namespace App\Tests\StateMachine\PostState;

use App\StateMachine\InvalidPostTransformation;
use App\StateMachine\PostState\Draft;
use PHPUnit\Framework\TestCase;

class DraftTest extends TestCase
{
    /**
     * @test
     * @doesNotPerformAssertions
     */
    public function shouldAllowSendToReview(): void
    {
        $draft = new Draft();
        $draft->sendToReview();
    }

    /** @test */
    public function shouldNotAllowPublish(): void
    {
        $draft = new Draft();

        $this->expectException(InvalidPostTransformation::class);
        $draft->publish();
    }

    /** @test */
    public function shouldNotAllowExpire(): void
    {
        $draft = new Draft();

        $this->expectException(InvalidPostTransformation::class);
        $draft->deprecate();
    }
}
```

```php
<?php
declare (strict_types=1);

namespace App\StateMachine\PostState;

use App\StateMachine\InvalidPostTransformation;

final class Draft extends PostState
{

    public function sendToReview(): WaitingReview
    {
        return new WaitingReview();
    }

    public function toString(): string
    {
        return 'draft';
    }

    public function deprecate(): Deprecated
    {
        throw new InvalidPostTransformation();
    }
}
```

Por supuesto, `deprecate` tiene que estar en `PostState`, no solo en `Draft`. Así que lo movemos a la clase base, refactor que mantiene el test en verde y que añade el comportamiento por defecto para esta transición en cualquier estado.

```php
<?php
declare (strict_types=1);

namespace App\StateMachine\PostState;

use App\StateMachine\InvalidPostTransformation;

abstract class PostState
{
    public static function create(): PostState
    {
        return new Draft();
    }

    public function sendToReview(): PostState
    {
        throw new InvalidPostTransformation();
    }

    public function publish(): PostState
    {
        throw new InvalidPostTransformation();
    }

    public function deprecate(): Deprecated
    {
        throw new InvalidPostTransformation();
    }

    abstract public function toString(): string;
}
```

El único estado desde el que tiene sentido realizar esta transformación es `Published`.

```php
<?php
declare (strict_types=1);

namespace App\Tests\StateMachine\PostState;

use App\StateMachine\PostState\Published;
use PHPUnit\Framework\TestCase;

class PublishedTest extends TestCase
{

    /**
     * @test
     * @doesNotPerformAssertions
     */
    public function shouldAllowDeprecate(): void
    {
        $published = new Published();

        $published->deprecate();
    }
}
```

```php
<?php
declare (strict_types=1);

namespace App\StateMachine\PostState;

class Published extends PostState
{
    public function toString(): string
    {
        return 'published';
    }

    public function deprecate(): Deprecated
    {
        return new Deprecated();
    }
}
```

Ahora viene algo interesante. Hemos decidido que `Post` llevará algún tipo de anotación indicando el hecho de que la información se considera obsoleta. Para esto, suponemos que cada `Post` tiene una colección de `Asides` en la que se incluyen este tipo de información o meta-información.

```php
<?php
declare (strict_types=1);

namespace App\Tests\StateMachine;

use App\StateMachine;
use App\StateMachine\InvalidPostTransformation;
use App\StateMachine\Post;
use PHPUnit\Framework\TestCase;

class PostTest extends TestCase
{
    /** @test */
    public function shouldAddAsideWhenDeprecatingPost(): void
    {
        $post = Post::create('Title', 'Body');
        $post->sendToReview();
        $post->publish();
        $post->deprecate();
        
        self::assertCount(1, $post->asides());
    }
}
```

Esto lo podemos resolver con:

```php
<?php
declare (strict_types=1);

namespace App\StateMachine;

use App\StateMachine\PostState\PostState;
use App\StateMachine\PostState\Published;
use App\StateMachine\PostState\WaitingReview;

class Post
{
    private string $title;
    private string $body;
    private PostState $postState;
    private AsidesCollection $asides;

    public function __construct(string $title, string $body)
    {
        $this->title = $title;
        $this->body = $body;
        $this->postState = PostState::create();
        $this->asides = new AsidesCollection();
    }

    public static function create(string $title, string $body): self
    {
        return new self($title, $body);
    }

    public function status(): string
    {
        return $this->postState->toString();
    }

    public function sendToReview(): void
    {
        $this->postState = $this->postState->sendToReview();
    }

    public function publish(): void
    {
        $this->postState = $this->postState->publish();
    }

    public function deprecate(): void
    {
        $this->postState = $this->postState->deprecate();
        $this->asides->prepend('Deprecated content. Use at your own risk');
    }

    public function asides(): AsidesCollection
    {
        return $this->asides;
    }
}
```

La llamada a `PostState` actúa como una especie de cláusula de guarda: si la transformación de estado es válida, entonces modificamos `Post`. Esta sería la forma adecuada de combinar la gestión del estado con otras acciones relacionadas con la transformación en la entidad: primero nos aseguramos de que podemos cambiar el estado y solo entonces realizamos los cambios necesarios en la entidad. 

```php
    public function deprecate(): void
    {
        $this->postState = $this->postState->deprecate();
        $this->asides->prepend('Deprecated content. Use at your own risk');
    }
```

Nos quedan varias transformaciones y estados por implementar, pero esencialmente tendríamos que seguir el mismo proceso para cada uno de ellos. No las voy a incluir aquí para no alargar el artículo demasiado.

Sin embargo, antes de pasar al último caso de estudio vamos a tratar un par de cuestiones prácticas.

Como se ha indicado antes, no es necesario que los objetos-estado mantengan una propiedad que describa o represente ese estado y que el objeto _per se_ representa el valor de estado. Si es necesario, nos basta con tener un método que devuelva alguna representación que nos interese. Por ejemplo, una representación textual que podríamos usar en una respuesta de una API o para persistir la entidad.

Por otro lado, en algún momento necesitaremos poder crear objetos estados a partir de alguna representación. Por ejemplo, cuando reconstruimos en el repositorio una entidad persistida. Para ellos usaremos una factoría, que puede ser un método factoría en la clase base. A fin de asegurar que solo usamos representaciones válidas podemos hacer que esas representaciones sean constantes y centralizarlas en la clase base:

```php
<?php
declare (strict_types=1);

namespace App\StateMachine\PostState;

use App\StateMachine\InvalidPostTransformation;

abstract class PostState
{
    protected const DRAFT = 'draft';
    protected const PUBLISHED = 'published';
    protected const DEPRECATED = 'deprecated';
    protected const WAITING_REVIEW = 'waitingReview';

    public function fromString(string $postState): PostState
    {
        switch ($postState) {
            case self::DRAFT:
                return new Draft();
            case self::WAITING_REVIEW:
                return new WaitingReview();
            case self::PUBLISHED:
                return new Published();
            case self::DEPRECATED:
                return new Deprecated();
            default:
                throw new \InvalidArgumentException(sprintf('Invalid post state: %s', $postState));
        }
    }

    public static function create(): PostState
    {
        return new Draft();
    }

    public function sendToReview(): PostState
    {
        throw new InvalidPostTransformation();
    }

    public function publish(): PostState
    {
        throw new InvalidPostTransformation();
    }

    public function deprecate(): Deprecated
    {
        throw new InvalidPostTransformation();
    }

    abstract public function toString(): string;
}
```

Cada clase final puede usar igualmente la constante, lo que contribuye a mantener la consistencia:

```php
<?php
declare (strict_types=1);

namespace App\StateMachine\PostState;

class Published extends PostState
{

    public function deprecate(): Deprecated
    {
        return new Deprecated();
    }

    public function toString(): string
    {
        return self::PUBLISHED;
    }
}
```

## Caso de estudio: cuenta bancaria

Usaremos este ejemplo para ver introducir la cuestión de las guardas. Las guardas son las condiciones que deben considerarse para ver si una transformación es posible, o para decidir cuál es el estado destino de esa transformación. Como hemos hecho antes, empezaremos examinado una solución un poco más tosca que iremos mejorando.

Supongamos el caso de modelar una cuenta bancaria. Una vez iniciada, podemos añadir (_deposit_) y retirar (_withdraw_) dinero. Si bien podemos añadir dinero sin límite, no ocurre lo mismo con la retirada. La cuenta tiene que tener fondos suficientes para retirar dinero y no quedar en números rojos. El banco, sin embargo, puede permitir hasta un cierto límite de descubierto (la cantidad máxima de deuda) para permitir la retirada de fondos. Si la retirada supera ese límite, la transacción no se permite.

Así que la transformación `withdraw` puede terminar en dos estados distintos (_founded_ y _overdrawn_) o no estar permitida dependiendo del saldo resultante al final. ¿Cómo gestionamos eso?

Empecemos por un test. Supongamos una retirada de dinero posible.

```php
<?php
declare (strict_types=1);

namespace App\Tests\StateMachine\Account;

use App\StateMachine\Account\Account;
use PHPUnit\Framework\TestCase;

class AccountTest extends TestCase
{
    /** @test */
    public function shouldAllowWithdrawWithEnoughFunds(): void
    {
        $account = new Account(1000.0);
        $account->withdraw(100.0);

        self::assertEquals(900.0, $account->balance());
    }
}
```

Esto nos lleva a la siguiente implementación inicial, que será bastante tosca. De momento, nos basta con ver que funciona correctamente.

```php
<?php
declare (strict_types=1);

namespace App\StateMachine\Account;

use App\StateMachine\Account\AccountState\AccountState;
use App\StateMachine\Account\AccountState\Activated;
use App\StateMachine\Account\AccountState\Funded;

final class Account
{

    private array $movements;
    private AccountState $state;

    public function __construct(float $firstDeposit = 0.0)
    {
        $this->state = new Activated();
        $this->deposit($firstDeposit);
    }

    public function deposit(float $amount): void
    {
        $this->state = $this->state->deposit();
        $this->movements[] = $amount;
    }

    public function withdraw(float $withDraw): void
    {
        $this->state = $this->state->withdraw();
        $this->movements[] = -1 * $withDraw;
    }

    public function balance(): float
    {
        return array_sum($this->movements);
    }
}
```

Para gestionar el estado, tenemos una clase base `AccountState` y clases hijas que, de momento, no incorporan ninguna lógica.

```php
<?php
declare (strict_types=1);

namespace App\StateMachine\Account\AccountState;

abstract class AccountState
{
    public static function activate(): Activated
    {
        return new Activated();
    }

    public function withdraw(float $expectedBalance): AccountState
    {
        return $this;
    }

    public function deposit(float $expectedBalance): AccountState
    {
        return new Funded();
    }
}
```

Las clases finales son estas:

```php
<?php
declare (strict_types=1);

namespace App\StateMachine\Account\AccountState;

final class Activated extends AccountState
{

}
```

```php
<?php
declare (strict_types=1);

namespace App\StateMachine\Account\AccountState;

final class Funded extends AccountState
{

}
```

```php
<?php
declare (strict_types=1);

namespace App\StateMachine\Account\AccountState;

final class Overdrawn extends AccountState
{

}
```

De momento, estamos bien. Como únicamente añadimos dinero de momento nos basta con tener unos cambios de estado por defecto muy sencillos. Veamos que pasa cuando intentamos sacar más dinero del que queda en la cuenta. El límite de descubierto será 150.0.

```php
<?php
declare (strict_types=1);

namespace App\Tests\StateMachine\Account;

use App\StateMachine\Account\Account;
use PHPUnit\Framework\TestCase;

class AccountTest extends TestCase
{
    /** @test */
    public function shouldAllowWithdrawWithEnoughFunds(): void
    {
        $account = new Account(1000.0);
        $account->withdraw(100.0);

        self::assertEquals(900.0, $account->balance());
    }

    /** @test */
    public function shouldAllowWithdrawWithoutEnoughFundsButInsideAllowed(): void
    {
        $account = new Account(200.0);
        $account->withdraw(300.0);
        
        self::assertEquals(-100.0, $account->balance());
        self::assertEquals(new Overdrawn(), $account->status());
    }
}
```

En este test vamos verificamos el estado de la cuenta para ver cómo funciona el cambio de estado. Lo podemos implementar así:

```php
<?php
declare (strict_types=1);

namespace App\StateMachine\Account;

use App\StateMachine\Account\AccountState\AccountState;
use App\StateMachine\Account\AccountState\Activated;
use App\StateMachine\Account\AccountState\Funded;
use App\StateMachine\Account\AccountState\Overdrawn;

final class Account
{

    private array $movements;
    private AccountState $state;

    public function __construct(float $firstDeposit = 0.0)
    {
        $this->state = new Activated();
        $this->deposit($firstDeposit);
    }

    private function deposit(float $amount): void
    {
        $this->state = $this->state->deposit();
        $this->movements[] = $amount;
    }

    public function withdraw(float $withdrawal): void
    {
        $expectedBalance = $this->balance() - $withdrawal;

        if ($expectedBalance >= 0.0) {
            $this->state = $this->state->withdraw();
        } else {
            $this->state = new Overdrawn();
        }

        $this->movements[] = -1 * $withdrawal;
    }

    public function balance(): float
    {
        return array_sum($this->movements);
    }

    public function status(): AccountState
    {
        return $this->state;
    }
}
```

He aquí que este código hace pasar el test, pero es bastante evidente que es una solución insatisfactoria. Veamos:

En primer lugar, calculamos el balance que quedaría de aplicar la retirada de fondos, que es lo que necesitamos saber para decidir en qué estado quedaría la cuenta. No realizamos la retirada hasta saber que podemos hacerla. Esto tiene bastante sentido.

El segundo paso es decir el estado resultante de la operación, que no cambiará si el saldo resultante es positivo. Por contra, si queda un saldo negativo el estado cambia. Tiene poco sentido tener esta lógica fuera del objeto de estado. Tal como está es un caso de mala asignación de responsabilidad.

Por tanto, vamos a mover la lógica al método `withdraw`. En principio, la clase que tendría que gestionar esto es `Funded`, que representa a una cuenta con fondos.

```php
<?php
declare (strict_types=1);

namespace App\StateMachine\Account\AccountState;

final class Funded extends AccountState
{
    public function withdraw(float $balance): AccountState
    {
        if ($balance >= 0.0) {
            return $this;
        }

        return new Overdrawn();
    }
}
```

Por supuesto, esto implica que `AccountState::withdraw` tendrá que incluir el parámetro `$balance`.

Necesitaremos un nuevo test para definir el comportamiento cuando la retirada de fondos supera el límite de descubierto. Esto es, el balance al final de la operación es menor al límite de -150.0 que hemos imaginado para nuestro ejemplo. Nosotras vamos a hacer que la operación no esté permitida, arrojando una excepción.

```php
<?php
declare (strict_types=1);

namespace App\Tests\StateMachine\Account;

use App\StateMachine\Account\Account;
use App\StateMachine\Account\AccountState\Funded;
use App\StateMachine\Account\AccountState\Overdrawn;
use PHPUnit\Framework\TestCase;

class AccountTest extends TestCase
{
    /** @test */
    public function shouldNotAllowWithdrawOverTheLimit(): void
    {
        $account = new Account(200.0);
        
        try {
            $account->withdraw(400.0);
        } catch (OverdrawnNotAllowed $overdrawnNotAllowed) {
            self::assertEquals(200.0, $account->balance());
            self::assertEquals(new Funded(), $account->status());
        }
    }
}
```

En este test en lugar de esperar una excepción, lo que hacemos es capturarla para así poder verificar que no se ha hecho ningún cargo en la cuenta que altere su balance, así como que su estado sigue siendo el inicial. La lógica para gestionar esto reside en el método `withdraw`.

```php
<?php
declare (strict_types=1);

namespace App\StateMachine\Account\AccountState;

final class Funded extends AccountState
{
    public function withdraw(float $expectedBalance): AccountState
    {
        if ($expectedBalance >= 0.0) {
            return $this;
        }

        if ($expectedBalance < -150.0) {
            throw new OverdrawnNotAllowed();
        }

        return new Overdrawn();
    }
}
```

Con este añadido el comportamiento queda establecido. Sin embargo quedan varias cosas por considerar. ¿Qué pasa si se hacen más cargos en una cuenta en descubierto? Podríamos suponer para este ejercicio que sigue las mismas normas: mientras no supere el límite, no hay problema. Pero dado que el estado Overdrawn no implementa nada en withdraw, posiblemente esto no se va a cumplir. Necesitamos otro test.

```php
<?php
declare (strict_types=1);

namespace App\Tests\StateMachine\Account;

use App\StateMachine\Account\Account;
use App\StateMachine\Account\AccountState\Funded;
use App\StateMachine\Account\AccountState\Overdrawn;
use App\StateMachine\Account\AccountState\OverdrawnNotAllowed;
use PHPUnit\Framework\TestCase;

class AccountTest extends TestCase
{
    /** @test */
    public function shouldAllowWithdrawWithoutEnoughFundsInOverdrawnAccountNotExceedingLimit(): void
    {
        $account = new Account(200.0);
        $account->withdraw(250.0);
        $account->withdraw(50.0);
        
        self::assertEquals(-100.0, $account->balance());
        self::assertEquals(new Overdrawn(), $account->status());
    }
}
```

Por desgracia, este test pasa, lo que indica que no es concluyente. Es posible retirar fondos porque no hay nada que lo impida en `Overdrwan::withdraw`, que al no implementar nada delega en la clase base, la cual simplemente devuelve el mismo estado. 

Una solución sería hacer que `AccountState::withdraw` arroje una excepción. Esto haría fallar el test y, para el tipo de dominio de que se trata, es preferible prohibir esta operación por defecto para tener que implementar el comportamiento específico. Es decir, es similar al principio de seguridad que promueve prohibir todo por defecto y asignar permisos según se vayan necesitando. Esto garantiza que operaciones potencialmente perjudiciales no se puedan realizar.

Nosotros optaremos por la primera solución. De esta forma el test falla:

```php
<?php
declare (strict_types=1);

namespace App\StateMachine\Account\AccountState;

abstract class AccountState
{
    public static function activate(): Activated
    {
        return new Activated();
    }

    public function withdraw(float $expectedBalance): AccountState
    {
        throw new OverdrawnNotAllowed();
    }

    public function deposit(): Funded
    {
        return new Funded();
    }
}
```

Lo que nos obliga a implementar `withdraw` en `Overdrawn`.

```php
<?php
declare (strict_types=1);

namespace App\StateMachine\Account\AccountState;

final class Overdrawn extends AccountState
{
    public function withdraw(float $expectedBalance): AccountState
    {
        return new self();
    }
}
```

Bueno, la implementación es sorprendentemente tonta, pero esto es porque todavía no tenemos un test que nos haya forzado a otra cosa. Escribámoslo:

```php
<?php
declare (strict_types=1);

namespace App\Tests\StateMachine\Account;

use App\StateMachine\Account\Account;
use App\StateMachine\Account\AccountState\Funded;
use App\StateMachine\Account\AccountState\Overdrawn;
use App\StateMachine\Account\AccountState\OverdrawnNotAllowed;
use PHPUnit\Framework\TestCase;

class AccountTest extends TestCase
{
   
    /** @test */
    public function shouldNotAllowWithdrawOverTheLimitOnOverdrawnAccounts(): void
    {
        $account = new Account(200.0);
        $account->withdraw(250.0);

        try {
            $account->withdraw(400.0);
        } catch (OverdrawnNotAllowed $overdrawnNotAllowed) {
            self::assertEquals(-50.0, $account->balance());
            self::assertEquals(new Overdrawn(), $account->status());
        }
    }
}
```

Este test fallará diciendo que no se han ejecutado aserciones, ya que no se captura ninguna excepción y no se ejecuta el bloque `catch`. Por tanto, el test está fallando y tenemos que hacer que falle la operación si se supera el límite.

Y aquí lo tenemos.

```php
<?php
declare (strict_types=1);

namespace App\StateMachine\Account\AccountState;

final class Overdrawn extends AccountState
{
    public function withdraw(float $expectedBalance): AccountState
    {
        if ($expectedBalance < -150.0) {
            throw new OverdrawnNotAllowed();
        }
        
        return new self();
    }
}
```

Sin embargo, aún nos queda un asunto. ¿Qué pasa si una cuenta que está en descubierto recibe fondos que no son suficientes para ponerse en números positivos? Ahora mismo, cada vez que hacemos un ingreso el estado de la cuenta pasa a ser `Funded`, pero esto podría no ser cierto. Veamos un test que lo prueba:

```php
<?php
declare (strict_types=1);

namespace App\Tests\StateMachine\Account;

use App\StateMachine\Account\Account;
use App\StateMachine\Account\AccountState\Funded;
use App\StateMachine\Account\AccountState\Overdrawn;
use App\StateMachine\Account\AccountState\OverdrawnNotAllowed;
use PHPUnit\Framework\TestCase;

class AccountTest extends TestCase
{
    /** @test */
    public function shouldKeepOverdrawnAccountWhenDepositIsNotEnough(): void
    {
        $account = new Account(200.0);
        $account->withdraw(340.0);
        $account->deposit(100.0);

        self::assertEquals(-40.0, $account->balance());
        self::assertEquals(new Overdrawn(), $account->status());
    }
}
```

El test falla al comparar el estado, así que veamos cómo implementarlo. Necesitamos un par de cambios:

```php
<?php
declare (strict_types=1);

namespace App\StateMachine\Account\AccountState;

final class Overdrawn extends AccountState
{
    public function withdraw(float $expectedBalance): AccountState
    {
        if ($expectedBalance < -150.0) {
            throw new OverdrawnNotAllowed();
        }

        return new self();
    }

    public function deposit(): AccountState
    {
        return $this;
    }
}
```

Que nos fuerza a cambiar cosas en `AccountState`.

```php
<?php
declare (strict_types=1);

namespace App\StateMachine\Account\AccountState;

abstract class AccountState
{
    public static function activate(): Activated
    {
        return new Activated();
    }

    public function withdraw(float $expectedBalance): AccountState
    {
        throw new OverdrawnNotAllowed();
    }

    public function deposit(): AccountState
    {
        return new Funded();
    }
}
```

Pero esto genera un nuevo problema: ¿Y si el depósito es suficiente para volver a poner la cuenta en estado `Funded`? Este test nos demuestra que ahora mismo no estamos poniendo el estado correcto.

```php
<?php
declare (strict_types=1);

namespace App\Tests\StateMachine\Account;

use App\StateMachine\Account\Account;
use App\StateMachine\Account\AccountState\Funded;
use App\StateMachine\Account\AccountState\Overdrawn;
use App\StateMachine\Account\AccountState\OverdrawnNotAllowed;
use PHPUnit\Framework\TestCase;

class AccountTest extends TestCase
{
    /** @test */
    public function shouldTransformToFundedIfDepositIsBigEnough(): void
    {
        $account = new Account(200.0);
        $account->withdraw(340.0);
        $account->deposit(200.0);

        self::assertEquals(60.0, $account->balance());
        self::assertEquals(new Funded(), $account->status());
    }
}
```

Solucionarlo requiere varios cambios. En primer lugar, en `Overdrawn`, necesitamos saber el balance final de aplicar el depósito:

```php

<?php
declare (strict_types=1);

namespace App\StateMachine\Account\AccountState;

final class Overdrawn extends AccountState
{
    public function withdraw(float $expectedBalance): AccountState
    {
        if ($expectedBalance < -150.0) {
            throw new OverdrawnNotAllowed();
        }

        return new self();
    }

    public function deposit(float $expectedBalance): AccountState
    {
        if ($expectedBalance >= 0.0) {
            return new Funded();
        }
        return $this;
    }
}
```

Esto, require cambios tanto en `AccountState` como en `Account`:

```php
<?php
declare (strict_types=1);

namespace App\StateMachine\Account\AccountState;

abstract class AccountState
{
    public static function activate(): Activated
    {
        return new Activated();
    }

    public function withdraw(float $expectedBalance): AccountState
    {
        throw new OverdrawnNotAllowed();
    }

    public function deposit(float $expectedBalance): AccountState
    {
        return new Funded();
    }
}
```

```php
<?php
declare (strict_types=1);

namespace App\StateMachine\Account;

use App\StateMachine\Account\AccountState\AccountState;
use App\StateMachine\Account\AccountState\Activated;
use App\StateMachine\Account\AccountState\Funded;
use App\StateMachine\Account\AccountState\Overdrawn;

final class Account
{

    private array $movements;
    private AccountState $state;

    public function __construct(float $firstDeposit = 0.0)
    {
        $this->movements = [];
        $this->state = new Activated();
        $this->deposit($firstDeposit);
    }

    public function deposit(float $amount): void
    {
        $expectedBalance = $this->balance() + $amount;

        $this->state = $this->state->deposit($expectedBalance);
        $this->movements[] = $amount;
    }

    public function withdraw(float $withdrawal): void
    {
        $expectedBalance = $this->balance() - $withdrawal;

        $this->state = $this->state->withdraw($expectedBalance);

        $this->movements[] = -1 * $withdrawal;
    }

    public function balance(): float
    {
        return array_sum($this->movements);
    }

    public function status(): AccountState
    {
        return $this->state;
    }
}
```

En este punto ya tenemos establecido el comportamiento básico de `Account` y la gestión de su estado. Sin embargo, es posible que hayas observado varias limitaciones y problemas de la misma. Intentaré anticiparme y proponer algunas soluciones.

Posiblemente la más obvia sea que el límite de descubierto no tiene una ubicación muy aceptable. Es de esperar, por otra parte, que sea algo que se asigna a cada cuenta en particular según algún criterio de negocio. Es decir, cada Account debería saber cuál es su límite de descubierto. Eso implica que la interfaz de `AccountState` tiene que cambiar para poder pasarle el límite de la cuenta.

Los tests de `Account` deberían servirnos para hacer este refactor. Normalmente, mi primera aproximación es permitir el nuevo parámetro de forma opcional, de este modo empiezo a cambiar la interfaz sin romper nada. Podríamos darle un valor por defecto y así poder usarlo.

He aquí el cambio en `AccountState` y las clases finales.

```php
<?php
declare (strict_types=1);

namespace App\StateMachine\Account\AccountState;

abstract class AccountState
{
    public static function activate(): Activated
    {
        return new Activated();
    }

    public function withdraw(float $expectedBalance, ?float $overdrawnLimit = null): AccountState
    {
        throw new OverdrawnNotAllowed();
    }

    public function deposit(float $expectedBalance): AccountState
    {
        return new Funded();
    }
}

```

```php
<?php
declare (strict_types=1);

namespace App\StateMachine\Account\AccountState;

final class Funded extends AccountState
{
    public function withdraw(float $expectedBalance, ?float $overdrawnLimit = 150.0): AccountState
    {
        if ($expectedBalance >= 0.0) {
            return $this;
        }

        if ($expectedBalance < -$overdrawnLimit) {
            throw new OverdrawnNotAllowed();
        }

        return new Overdrawn();
    }
}
```

```php
<?php
declare (strict_types=1);

namespace App\StateMachine\Account\AccountState;

final class Overdrawn extends AccountState
{
    public function withdraw(float $expectedBalance, ?float $overdrawnLimit = 150.0): AccountState
    {
        if ($expectedBalance < -$overdrawnLimit) {
            throw new OverdrawnNotAllowed();
        }

        return new self();
    }

    public function deposit(float $expectedBalance): AccountState
    {
        if ($expectedBalance >= 0.0) {
            return new Funded();
        }
        return $this;
    }
}
```

Con estos cambios, todos los tests siguen pasando. Dos detalles destacables:

* El parámetro se pasa en valor absoluto y se aplica el signo cuando se va a utilizar para un uso más consistente. Esto se puede forzar convirtiéndolo en un ValueObject que nos lo garantize.
* La opcionalidad del parámetro es temporal, pero ahora podemos añadir una propiedad a `Account` que podemos pasar a los objetos de estado.

```php
<?php
declare (strict_types=1);

namespace App\StateMachine\Account;

use App\StateMachine\Account\AccountState\AccountState;
use App\StateMachine\Account\AccountState\Activated;
use App\StateMachine\Account\AccountState\Funded;
use App\StateMachine\Account\AccountState\Overdrawn;

class Account
{

    private array $movements;
    private AccountState $state;
    private float $overdrawnLimit;

    public function __construct(float $firstDeposit = 0.0, float $overdrawnLimit = 150.0)
    {
        $this->movements = [];
        $this->state = new Activated();
        $this->overdrawnLimit = $overdrawnLimit;

        $this->deposit($firstDeposit);
    }

    public function deposit(float $amount): void
    {
        $expectedBalance = $this->balance() + $amount;

        $this->state = $this->state->deposit($expectedBalance);
        $this->movements[] = $amount;
    }

    public function withdraw(float $withdrawal): void
    {
        $expectedBalance = $this->balance() - $withdrawal;

        $this->state = $this->state->withdraw($expectedBalance, $this->overdrawnLimit);

        $this->movements[] = -1 * $withdrawal;
    }

    public function balance(): float
    {
        return array_sum($this->movements);
    }

    public function status(): AccountState
    {
        return $this->state;
    }
}
```

Una vez que tenemos esto, podemos eliminar la opcionalidad del parámetro en los métodos en los que se usa. Lo dejamos opcional para instanciar `Account`.

Por otra parte, ya que estamos. ¿No debería ocuparse `AccountState` de hacer los cálculos necesarios en lugar de `Account`? No tengo una respuesta clara para esto, pero podríamos experimentar alguna aproximación. Básicamente consistiría en pasar a `AccountState` el balance actual de la cuenta, más el montante de la operación y que sea `AccountState` (para ser exactos, el objeto estado actual) quien utilice estos datos para hacer el cálculo de cuál sería el balance tras aplicar la operación.

Un problema es que tenemos que cambiar de nuevo la interfaz, a no ser que el lenguaje nos permita sobrecarga de métodos. Incluso sería factible pasar la instancia de `Account` y que el objeto estado extraiga la información necesaria. En este caso tendríamos que exponer un método para acceder a la propiedad `Account::overdrawnLimit`. Este método tiene la ventaja de que la lista de parámetros final es la más reducida posible. 

La técnica para el cambio de interfaz es básicamente la misma que hemos usado antes. Primero introducimos los nuevos parámetros como opcionales al final de la signatura, sin asignarles valores por defecto. Voy a poner solo el ejemplo de la clase base `AccountState`, pero en las demás sería lo mismo. Este paso no debe romper los tests si se hace correctamente.

```php
<?php
declare (strict_types=1);

namespace App\StateMachine\Account\AccountState;

use App\StateMachine\Account\Account;

abstract class AccountState
{
    public static function activate(): Activated
    {
        return new Activated();
    }

    public function withdraw(
        float $expectedBalance,
        float $overdrawnLimit,
        ?Account $account = null,
        ?float $withdrawal = null
    ): AccountState {
        throw new OverdrawnNotAllowed();
    }

    public function deposit(float $expectedBalance): AccountState
    {
        return new Funded();
    }
}
```

El siguiente paso es pasar los parámetros aunque sin llegar a usarlos, algo que realmente solo tenemos que hacer una vez. Después de esto podemos hacerlos obligatorios en la interfaz.

```php
<?php
declare (strict_types=1);

namespace App\StateMachine\Account;

use App\StateMachine\Account\AccountState\AccountState;
use App\StateMachine\Account\AccountState\Activated;

class Account
{

    private array $movements;
    private AccountState $state;
    private float $overdrawnLimit;

    public function __construct(float $firstDeposit = 0.0, float $overdrawnLimit = 150.0)
    {
        $this->movements = [];
        $this->state = new Activated();
        $this->overdrawnLimit = $overdrawnLimit;

        $this->deposit($firstDeposit);
    }

    public function deposit(float $amount): void
    {
        $expectedBalance = $this->balance() + $amount;

        $this->state = $this->state->deposit($expectedBalance);
        $this->movements[] = $amount;
    }

    public function withdraw(float $withdrawal): void
    {
        $expectedBalance = $this->balance() - $withdrawal;

        $this->state = $this->state->withdraw(
            $expectedBalance,
            $this->overdrawnLimit,
            $this,
            $withdrawal
        );

        $this->movements[] = -1 * $withdrawal;
    }

    public function balance(): float
    {
        return array_sum($this->movements);
    }

    public function status(): AccountState
    {
        return $this->state;
    }
}

```

El tercer paso consiste en realizar los cálculos necesarios con los nuevos parámetros, ignorando los que estábamos pasando antes. De paso añadimos el método `overdrawnLimit`, para poder acceder a esa propiedad.

```php
<?php
declare (strict_types=1);

namespace App\StateMachine\Account\AccountState;

use App\StateMachine\Account\Account;

final class Funded extends AccountState
{
    public function withdraw(
        float $expectedBalance,
        float $overdrawnLimit,
        Account $account,
        float $withdrawal
    ): AccountState {
        $expectedBalance = $account->balance() - $withdrawal;

        if ($expectedBalance >= 0.0) {
            return $this;
        }

        if ($expectedBalance < -$account->overdrawnLimit()) {
            throw new OverdrawnNotAllowed();
        }

        return new Overdrawn();
    }
}
```

```php
<?php
declare (strict_types=1);

namespace App\StateMachine\Account\AccountState;

use App\StateMachine\Account\Account;

final class Overdrawn extends AccountState
{
    public function withdraw(
        float $expectedBalance,
        float $overdrawnLimit,
        Account $account,
        float $withdrawal
    ): AccountState {
        $expectedBalance = $account->balance() - $withdrawal;

        if ($expectedBalance < -$account->overdrawnLimit()) {
            throw new OverdrawnNotAllowed();
        }

        return new self();
    }

    public function deposit(float $expectedBalance): AccountState
    {
        if ($expectedBalance >= 0.0) {
            return new Funded();
        }

        return $this;
    }
}
```

Tengo algunas reservas con esta implementación porque veo algo de _structure leaking_ en esta solución y hay cosas que podría hacer `Account` en lugar de preguntarle. Pero esto será más fácil de refactorizar cuando terminemos esta parte.

Una vez completado el paso anterior, eliminamos los parámetros no usados. Esto se puede hacer de forma automatizada en PHPStorm (Refactor -> ChangeSignature, que nos permitirá cambiarlo en la clase base y en las hijas de una sola vez).

```php
<?php
declare (strict_types=1);

namespace App\StateMachine\Account\AccountState;

use App\StateMachine\Account\Account;

final class Funded extends AccountState
{
    public function withdraw(
        Account $account,
        float $withdrawal
    ): AccountState {
        $expectedBalance = $account->balance() - $withdrawal;

        if ($expectedBalance >= 0.0) {
            return $this;
        }

        if ($expectedBalance < -$account->overdrawnLimit()) {
            throw new OverdrawnNotAllowed();
        }

        return new Overdrawn();
    }
}
```

```php
<?php
declare (strict_types=1);

namespace App\StateMachine\Account\AccountState;

use App\StateMachine\Account\Account;

final class Overdrawn extends AccountState
{
    public function withdraw(
        Account $account,
        float $withdrawal
    ): AccountState {
        $expectedBalance = $account->balance() - $withdrawal;

        if ($expectedBalance < -$account->overdrawnLimit()) {
            throw new OverdrawnNotAllowed();
        }

        return new self();
    }

    public function deposit(float $expectedBalance): AccountState
    {
        if ($expectedBalance >= 0.0) {
            return new Funded();
        }

        return $this;
    }
}
```

Y también eliminamos la línea en `Account` que hacía este cálculo.

```php
<?php
declare (strict_types=1);

namespace App\StateMachine\Account;

use App\StateMachine\Account\AccountState\AccountState;
use App\StateMachine\Account\AccountState\Activated;

class Account
{

    private array $movements;
    private AccountState $state;
    private float $overdrawnLimit;

    public function __construct(float $firstDeposit = 0.0, float $overdrawnLimit = 150.0)
    {
        $this->movements = [];
        $this->state = new Activated();
        $this->overdrawnLimit = $overdrawnLimit;

        $this->deposit($firstDeposit);
    }

    public function deposit(float $amount): void
    {
        $expectedBalance = $this->balance() + $amount;

        $this->state = $this->state->deposit($expectedBalance);
        $this->movements[] = $amount;
    }

    public function withdraw(float $withdrawal): void
    {
        $this->state = $this->state->withdraw(
            $this,
            $withdrawal
        );

        $this->movements[] = -1 * $withdrawal;
    }

    public function balance(): float
    {
        return array_sum($this->movements);
    }

    public function status(): AccountState
    {
        return $this->state;
    }

    public function overdrawnLimit(): float
    {
        return $this->overdrawnLimit;
    }
}
```

Para `deposit` haríamos exactamente lo mismo.

Una última vuelta de tuerca es el problema que señalábamos de _structure leaking_. La cuestión es que preguntamos información a `Account` para averiguar si el resultado de la retirada de fondos sería positivo, dejaría la cuenta en descubierto o estaría por encima del límite. Ahora que tenemos `Account` en los objetos de estado, podemos pensar en cómo queremos usarla.

Para empezar, podríamos preguntarle a Account si una retirada de fondos supera el límite.

```php
<?php
declare (strict_types=1);

namespace App\StateMachine\Account\AccountState;

use App\StateMachine\Account\Account;

final class Funded extends AccountState
{
    public function withdraw(
        Account $account,
        float $withdrawal
    ): AccountState {
        $expectedBalance = $account->balance() - $withdrawal;

        if ($expectedBalance >= 0.0) {
            return $this;
        }

        if ($account->isWithdrawalOverLimit($withdrawal)) {
            throw new OverdrawnNotAllowed();
        }

        return new Overdrawn();
    }
}
```

Este sería el cambio en `Account`:

```php
<?php
declare (strict_types=1);

namespace App\StateMachine\Account;

use App\StateMachine\Account\AccountState\AccountState;
use App\StateMachine\Account\AccountState\Activated;

class Account
{

    private array $movements;
    private AccountState $state;
    private float $overdrawnLimit;

    public function __construct(float $firstDeposit = 0.0, float $overdrawnLimit = 150.0)
    {
        $this->movements = [];
        $this->state = new Activated();
        $this->overdrawnLimit = $overdrawnLimit;

        $this->deposit($firstDeposit);
    }

    public function deposit(float $amount): void
    {
        $expectedBalance = $this->balance() + $amount;

        $this->state = $this->state->deposit($expectedBalance);
        $this->movements[] = $amount;
    }

    public function withdraw(float $withdrawal): void
    {
        $this->state = $this->state->withdraw(
            $this,
            $withdrawal
        );

        $this->movements[] = -1 * $withdrawal;
    }

    public function balance(): float
    {
        return array_sum($this->movements);
    }

    public function status(): AccountState
    {
        return $this->state;
    }
    
    public function isWithdrawalOverLimit(float $withdrawal): bool
    {
        $expectedBalance = $this->balance() - $withdrawal;

        return $expectedBalance < -$this->overdrawnLimit;
    }

    public function hasEnoughFundsForWithdrawal(float $withdrawal): bool
    {
        $expectedBalance = $this->balance() - $withdrawal;
        
        return $expectedBalance >= 0.0;
    }
}
```

Esto nos permite saber si las retiradas de dinero cuentan o no con fondos suficientes, sin necesitar saber cuál es el saldo o cuál es el límite de la cuenta: discreción absoluta.

```php
<?php
declare (strict_types=1);

namespace App\StateMachine\Account\AccountState;

use App\StateMachine\Account\Account;

final class Funded extends AccountState
{
    public function withdraw(
        Account $account,
        float $withdrawal
    ): AccountState {
        if ($account->hasEnoughFundsForWithdrawal($withdrawal)) {
            return $this;
        }

        if ($account->isWithdrawalOverLimit($withdrawal)) {
            throw new OverdrawnNotAllowed();
        }

        return new Overdrawn();
    }
}
```

```php
<?php
declare (strict_types=1);

namespace App\StateMachine\Account\AccountState;

use App\StateMachine\Account\Account;

final class Overdrawn extends AccountState
{
    public function withdraw(
        Account $account,
        float $withdrawal
    ): AccountState {
        if ($account->isWithdrawalOverLimit($withdrawal)) {
            throw new OverdrawnNotAllowed();
        }

        return new self();
    }

    public function deposit(float $expectedBalance): AccountState
    {
        if ($expectedBalance >= 0.0) {
            return new Funded();
        }

        return $this;
    }
}
```

Para no alargar más el artículo no voy a desarrollar los cambios de `deposit`, pero seguirían la misma línea.

En este último ejemplo, he mantenido únicamente el test de `Account`. Esto me ha permitido refactorizar intensamente los objetos de estado, dado que su diseño era conducido por ese único test, que actuaría como una especie de test de aceptación. Con todo, de cara a QA, lo recomendable sería escribir los test unitarios de cada estado.

## Fin

Espero que este artículo sobre el patrón State te haya sido útil. Es posible implementarlo de diversas maneras, así que no considero que estas sean las mejores o las únicas. En mi caso he usado alguna de ellas o sus variantes en los proyectos en los que he trabajado.
