---
layout: post
title: Sobre la expresividad del código
categories: articles
tags: php good-practices
---

Al hablar de código expresivo queremos decir no sólo que el código debería indicar con claridad su intención, también queremos que el código revele más cosas de sí mismo.

Aprender a escribir código que sea expresivo es algo que se consigue con la práctica, leyendo código de otros y dejando que otros lean nuestro código. La verdad es que aprender a escribir buen código es un proceso muy similar al de aprender a escribir bien. Y una de las metas es la de aprender a elegir mejores palabras y expresiones.

## Expresar propiedades de los objetos

En un [artículo anterior](https://franiglesias.github.io/consistencia-de-objetos/), ya comentamos formas de hacer que el código exprese ciertas propiedades de los objetos que introducimos en un programa.

Hagamos un repaso:

### Inmutabilidad

Los objetos que son inmutables son aquellos que no cambian a lo largo de su ciclo de vida y se pueden reutilizar.

Estos objetos no tienen **setters** ni **mutators**, por lo que inicializan todas su propiedades en el constructor.

```php

class CustomerId
{
	private $uuid;
	
	public function __construct(Uuid $uuid)
	{
		$this->uuid = $uuid;
	}
	
	public function getId(): Uuid
	{
		return $this->uuid;
	}
}

```

O si tienen **mutators**, éstos devuelven una nueva instancia del mismo tipo de objeto:

```php
class Money
{
	private $amount;
	private $currency;

	public function __construct(float $amount, string $currency)
	{
		$this->amount = $amount;
		$this->currency = $currency;
	}
	
	public function add($extraAmount): Money
	{
		$newAmount = $this->amount + $extraAmount;
		
		return new self($newAmount, $this->currency);
	}
}

```

### Mutabilidad

Por el contrario, los objetos cuyas propiedades pueden cambiar exponen métodos para hacerlo:

```php

class Customer
{
	// ...
	
	public function setNewAddress(Address $newAddress)
	{
		$this->address = $newAddress;
	}

}
```

### Obligatoriedad

Si una propiedad es obligatoria, se setea en el constructor:

```php

class User
{
	private $username;
	private $password;
	private $email;
	
	public function __construct(string $username, string $password, string $email)
	{
		$this->username = $username;
		$this->password = $password;
		$this->email = $email;
	}
}

```

### Opcionalidad

En cambio, si una propiedad es opcional se setea mediante un método:

```php

class User
{
	private $twitterHandle;
	
	// ...
	
	public function setTwitterHandle(string $handle)
	{
		$this->twitterHandle = $handle;
	}
}
```

### Covariación

Dos cosas que cambian juntas, han de ir juntas:


```php

class Address
{
	private $street:
	private $number;
	
	public function __construct(string $street, string $number)
	{
		$this->street = $street;
		$this->number = $number;
	}
}
```

## Naming

Dicen que una de las cosas más difíciles de la informática es poner nombres. No se si realmente es de lo más difícil, pero tengo la seguridad de que es algo de la mayor importancia y aprender a hacerlo bien es un proceso largo.

El lenguaje condiciona nuestro pensamiento. Los nombres que ponemos a los conceptos nos permiten hablar y argumentar sobre ellos. Si un nombre no representa correctamente la idea que quiere expresar, nos llevará a razonamientos erróneos o soluciones incompletas.

### Reducir la ambigüedad

En el lenguaje natural muchas palabras tienen diversos significados, que es como decir que representan diferentes conceptos. De ellas se dice que son palabras polisémicas. Para los hablantes no suelen representar un gran problema porque su significado viene determinado por el contexto, pero a la hora de programar dos conceptos no pueden ser designados con el mismo término sin meternos en problemas de diversos tipos.

Por ejemplo, en el entorno educativo la palabra curso tiene varios significados:

- Año escolar (curso 2017-1018)
- El alumnado de una cierta promoción (el curso de 2015)
- Nivel educativo (tercer curso de primaria)
- Un grupo de alumnos (el curso del profesor Pérez)
- Un programa formativo completo (un curso de márketing digital)

Si estamos desarrollando una aplicación para la gestión de un centro educativo tendremos que escoger un nombre diferente para cada uno de estos conceptos. En algunos casos existen buenos sinónimos, en otros hay que pensar un poco.

- Año escolar: SchoolYear
- Alumnado de una promoción: ClassOfYear
- Nivel educativo: Level
- Grupo de alumnos: StudentGroup
- Programa formativo: Course

En buena medida, cuando en DDD se habla del lenguaje ubicuo también se está hablando de esto. El vocabulario del dominio puede ser ambiguo y parte de la tarea de los desarrolladores es precisamente conversar con los expertos del dominio para construir un vocabulario compartido que se unívoco en sus significados.

### Variables y propiedades que expresan lo que contienen

Supongamos una clase Document que representa archivos en un sistema de archivos. Hay varias propiedades que nos podrían interesar, como su tamaño, su nombre y su ruta de almacenamiento. No parecen suponer ninguna dificultad, ¿verdad?

Pues la tienen.

Veamos por qué:

```php
class Document
{
	/** @var string */
	private $name;
	/** @var string */
	private $path;
	/** @var int */
	private $size;
	
	// Constructor and methods
	// ...
}
```

Si hablamos de las propiedades `name` y `path`, en los sistemas de archivos "tradicionales", normalmente podemos distinguir entre nombre de archivo (que, además, incluye la extensión) del path o ruta de carpetas bajo las que se encuentra.

Pero en muchos nuevos sistemas en la nube, como pueden ser Google Drive o Amazon S3 esa distinción ya no está tan clara. En estos sistemas, el identificador del archivo es la ruta completa más el nombre de archivo, porque el concepto carpeta no existe, aunque se simula para nuestra comodidad.

En cualquier caso, `path` presenta un segundo problema interesante ya que puede referirse tanto al path absoluto, desde la raíz del sistema de archivos, como al path relativo, desde un punto arbitrario del árbol de directorios.

¿Cómo nos puede ayudar el naming en este caso? Pues sencillamente siendo precisos con el dato que deseamos almacenar en esas variables o propiedades. Así, y siguiendo el ejemplo de la clase Document, las propiedades podrían renombrarse de este modo:

```php
class Document
{
	/** @var string */
	private $fileNameWithExtension;
	/** @var string */
	private $absolutePathToFolder;
	/** @var int */
	private $size;
	
	// Constructor and methods
	// ...
}
```

En cuanto a `size`, el problema que presenta es que un valor entero representa una cantidad, pero no nos dice nada acerca de la unidad en que se expresa esa cantidad.

En algunos casos merece la pena expresarlo con un Value Object, como por ejemplo:

```php
class DocumentSize
{
	/** @var int */
	private $size;
	/** @var string */
	private $unit;
	
	public function __construct(int $size, string $unit)
	{
		$this->size = $size;
		$this->unit = $unit;
	}
}
```

Pero si, por la razón que sea, no merece la pena crear el VO, podemos dar un nombre más explícito a nuestra variable o propiedad incluyendo la unidad:

```php
class Document
{
	/** @var string */
	private $fileNameWithExtension;
	/** @var string */
	private $absolutePathToFolder;
	/** @var int */
	private $sizeInBytes;
	
	// Constructor and methods
	// ...
}
```

### Métodos que explican lo que hacen

Por lo general, los métodos no deberían revelar detalles de implementación, pero eso no impide que puedan aporta alguna información que describa de forma más precisa su comportamiento.

Supongamos un Repositorio, por ejemplo de usuarios. En DDD un Repositorio es un lugar en el cual se pueden guardar objetos, para luego recuperarlos, ya sea individualmente a través de su Id, ya sea a través de una búsqueda en base a ciertos criterios.

Típicamente, un repositorio puede tener esta interfaz básica:

```php
interface UserRepository
{
	public function get(UserID $userId): User;
	public function put(User $user): void;
	public function findAll(UserSpecification $userSpecification): ?array;
}
```
Aunque los nombres `get` y `put` describen más o menos bien la acción que realizan, lo cierto es que nos nombres bastante incómodos, que se usan como parte de otros nombres y que pueden generar bastante confusión al trabajar.

Una mejora de esta interfaz es utilizar términos algo más precisos para los nombres de los métodos:

```php
interface UserRepository
{
	public function retrieve(UserID $userId): User;
	public function store(User $user): void;
	public function findAll(UserSpecification $userSpecification): ?array;
}
```
Pero ahora pensemos. ¿Qué ocurre si intento recuperar con `retrieve` un objeto que no existe?

Con PHP 7.1 y los return types nullables podemos expresar dos opciones:

Si no existe el objeto con ese Id, lanzar una excepción porque se intenta devolver `null` que es incompatible con el tipo de retorno.

```php
interface UserRepository
{
	public function retrieve(UserID $userId): User;
}
```

Si no existe el objeto con ese Id, devuelve `null`, ya que el tipo de retorno es `nullable`:

```php
interface UserRepository
{
	public function retrieve(UserID $userId): ?User;
}
```

Otra forma de expresarlo en versiones anteriores a la 7.1 es:

```php
interface UserRepository
{
	public function retrieveOrNull(UserID $userId);
}
```

```php
interface UserRepository
{
	public function retrieveOrFail(UserID $userId);
}
```

### Be expressive, my friend

Retomo un ejemplo anterior:

```php

class Customer
{
	// ...
	
	public function setNewAddress(Address $newAddress)
	{
		$this->address = $newAddress;
	}

}
```

¿Por qué no ser mucho más explícito acerca de la intención del método? En su formulación actual hay una cierta ambigüedad que nos permitiría interpretar legítimamente la intención del método tanto en la línea de 'cambiar la dirección' como en la de 'añadir una nueva dirección'. No cuesta nada eliminar esa ambigüedad:

```php

class Customer
{
	// ...
	
	public function changeAddress(Address $newAddress)
	{
		$this->address = $newAddress;
	}

}
```

Y, llegado, el caso de aceptar varias direcciones por cliente, habitual en muchas tiendas online, haríamos esto:

```php

class Customer
{
	// ...
	
	public function addAnotherShippingAddress(Address $newAddress)
	{
		$this->address = $newAddress;
	}

}
```

### Objetos que encapsulan reglas

En el ejemplo anterior, pasamos los criterios de búsqueda en forma de [patrón Specification](/patron-specification-del-dominio-a-la-infraestructura-1/). Las Specification encapsulan reglas para ver si el objeto que les pasamos las cumple.

De este modo podríamos tener una Specification como esta:

```php
class UserOlderThan
{
	private $age;
	
	private function __construct(int $age)
	{
		$this->age = $age;
	}
	
	public function isSatisfiedBy(User $user): bool
	{
		return $user->age() > $this->age:
 	}
}
```

A la que podemos añadir un *named constructor*:

```php
class UserOlderThan
{
	private $age;
	
	private function __construct(int $age)
	{
		$this->age = $age;
	}
	
	public static function years(int $age)
	{
		return new static($age);
	}
	
	public function isSatisfiedBy(User $user): bool
	{
		return $user->age() >= $this->age:
 	}
}
```

Para poder escribir un código como este:

```php
$userOlderThan18 = $usersRepository->findAll(UsersOlderThan::years(18));
```

o como éste:

```php
$canVote = UsersOlderThan::years(18);

if ($canVote->isSatisfiedBy($currentUser)) {
	echo 'Hey, you can vote!';
}
```
que expresan en un lenguaje casi natural lo que queremos decir.

### Objetos que encapsulan comportamientos

Servicios, Casos de Uso, Generadores, Validadores, Transformadores… hay muchos tipos de objetos que encapsulan comportamientos.

Sin embargo, a veces ofuscamos la naturaleza imperativa con un mal nombre.

Considera, por ejemplo, esta interfaz:

```php
interface PasswordGenerator
{
	public function generate();
}
```

Es bastante obvio que el comportamiento normal de un generador es generar algo, pero este naming quizá tenga demasiada redundancia. Una alternativa, que estoy aprendiendo gracias [al equipo en el que trabajo](https://twitter.com/HolaluzEng), es la siguiente:

```php
interface GeneratePassword
{
	public function execute();
}
```

Aunque yo no descartaría esta forma:

```php
interface GeneratePassword
{
	public function do();
}
```

Otro ejemplo, podría ser este:

```php
interface DocumentDtoTransformer
{
	public function transform(DocumentDto $fromDto): Document;
}
```

Que se podría reescribir como:

```php
interface TransformDocumentDto
{
	public function to(DocumentDto $fromDto): Document;
}
```

O más explícitamente, aunque el return type lo hace un poco redundante, la verdad es que no resulta muy molesto:

```php
interface TransformDocumentDto
{
	public function toDocument(DocumentDto $fromDto): Document;
}
```

Aunque, a decir verdad, no me convence del todo. ¿Qué tal alguna de estas variantes?

```php
interface TransformToDocument
{
	public function fromDocumentDto(DocumentDto $fromDto): Document;
}
```

```php
interface TransformToDocument
{
	public function from(DocumentDto $fromDto): Document;
}
```

A propósito, si usan un Contenedor de Dependencias deberías respetar el naming también ahí. De otro modo, el esfuerzo en bautizar clases se pierde.

## Naming y lenguaje

Tanto el *type hinting* como el *return type* ayudan bastante a hacer un mejor naming. Nos permiten desarrollar nombres más compactos si así lo deseamos y, además, fuerzan a que lo declarado en los nombres se cumpla.

El naming no debería contaminarse de elementos técnicos, pero es difícil no caer en la tentación.

Por ejemplo, personalmente no me gusta mucho la idea de incluir el sufijo `Interface` al definir una interfaz:

```php
interface UsersRepository
{
	public function store(User $user): void;
	public function retrieve(UserId $userId): User;
}
```

El razonamiento es que un servicio que utiliza ese Repositorio lo que espera es un Repositorio concreto que cumpla la interfaz, no la interfaz en sí. Algo así:

```php
class ValidateUser {
	private $users;
	
	public function __construct(UsersRepository $users)
	{
		$this->users = $users;
	}
	
	// ...
}
```

Repository, sin embargo, es un sufijo útil ya que, aunque designa un patrón técnico determinado, también es cierto que representa un concepto que pertenece al dominio, o al menos es necesario: un lugar donde se guarda y se puede obtener la información de los usuarios.

Esto queda, como mínimo, raro:

```php
interface Users
{
	public function store(User $user): void;
	public function retrieve(UserId $userId): User;
}
```

Por no hablar de lo ambiguo de esta implementación:

```php
class DoctrineUsers implements Users
{
	public function store(User $user): void;
	public function retrieve(UserId $userId): User;	
}
```

¿Estamos hablando de un repositorio de Users implementado en Doctrine o de un repositorio de usuarios de Doctrine?

En general, quitando casos como el de Repository o el de Factory, debería eliminarse de los nombres la referencia a patrones técnicos. La otra salvedad, son las implementaciones concretas, en las que es buena práctica hacer explícita la tecnología subyacente:

```php
class DoctrineUserRepository implements UserRepository
{
	public function store(User $user): void;
	public function retrieve(UserId $userId): User;	
}
```

```php
class InMemoryUserRepository implements UserRepository
{
	public function store(User $user): void;
	public function retrieve(UserId $userId): User;	
}
```

## Happy naming!

Seguramente podríamos escribir un libro entero dedicado a analizar cómo hacer un mejor naming en nuestro código.

Un código expresivo y que comunica bien lo que hace es fundamental para lograr un código mantenible en el largo plazo, cuando nuevos equipos de desarrollo (o nuestro yo del futuro) tenga que lidiar con él.
