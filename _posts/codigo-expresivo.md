# Sobre la expresividad del código

A veces hablamos de código expresivo. Con ello queremos decir no sólo que el código debería indicar con claridad su intención, también queremos que el código revele más cosas de sí mismo.

Aprender a escribir código que sea expresivo  es algo que se consigue con la práctica, leyendo código de otros y dejando que otros lean nuestro código. La verdad es que aprender a escribir código es un proceso muy similar al de aprender a escribir bien.

## Expresar propiedades de los objetos

En un [artículo anterior](https://franiglesias.github.io/consistencia-de-objetos/), ya hablamos de formas de hacer que el código exprese ciertas propiedades de los objetos que introducimos.

Hagamos un repaso:

### Inmutabilidad

Los objetos que son inmutables…

O bien no tienen setters ni mutators, inicializando todas su propiedades en el constructor

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

O si tienen mutators, devuelven una nueva instancia del mismo tipo de objeto:

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

### Eliminar la ambigüedad

En el lenguaje natural muchas palabras tienen diversos significados, que es como decir que representan diferentes conceptos. De ellas se dice que son palabras polisémicas. Para los hablantes no suelen representar un gran problema porque su significado viene determinado por el contexto, pero a la hora de programar dos conceptos no pueden ser designados con el mismo término sin meternos en problemas de diversos tipos.

Por ejemplo, en el entorno educativo la palabra curso tiene varios significados:

- Año escolar (curso 2017-1018)
- El alumnado de una cierta promoción (el curso de 2015)
- Nivel educativo (tercer curso de primaria)
- Un grupo de alumnos (el curso del profesor Pérez)
- Un programa formativo completo (un curso de márketing digital)

Si estamos desarrollando una aplicación para la gestión de un centro educativo tendremos que escoger un nombre diferente para cada uno de estos conceptos. En algunos casos existen buenos sinónimos, en otros hay que pensar un poco.

- Año escolar puede ser SchoolYear
- Alumnado de una promoción: ClassOfYear
- Nivel educativo: Level
- Grupo de alumnos: StudentGroup
- Programa formativo: Course







