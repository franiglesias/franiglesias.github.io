---
layout: post
title: Refactor cotidiano (4). Sustituye escalares por objetos
categories: articles
tags: good-practices refactoring
---

PHP viene de serie con un conjunto de tipos de datos básicos que denominamos escalares: bool, int, float, string…, que utilizamos para representar cosas y operar con ellas. La parte mala es que son tipos genéricos y, a veces, necesitaríamos algo con más significado.

Lo ideal sería poder crear nuestros propios tipos, aptos para el dominio en el que estemos trabajando e incluyendo sus propias restricciones y propiedades. Además, podrían encapsular las operaciones que les sean necesarias. ¿Te suena el concepto? Estamos hablando de **Value Object**.

Los Value Objects son objetos que representan algún concepto importante en el dominio. Ya hemos hablado un montón de veces de ellos en el blog, por lo que simplemente haré un resumen. Puedes encontrar más detalles y ejemplos en este [artículo de Dani Tomé](https://danitome24.github.io/2018-11-19/usando-value-objects-con-php).

En resumen, los Value Objects:

* Representan conceptos importantes o interesantes del dominio, entendido como el dominio de conocimiento que toca el código que estamos implementando o estudiando.
* Siempre son creados consistentes, de modo que si obtienes una instancia puedes tener la seguridad de que es válida. De otro modo, no se crean y se lanza una excepción.
* Los objetos nos interesan por su valor, no por su identidad, por lo que tienen que tener alguna forma de chequear esa igualdad.
* Son inmutables, o sea, su valor no puede cambiar durante su ciclo de vida. En caso de que tengan métodos *mutators*, éstos devolverán una nueva instancia de la clase con el valor modificado.
* Encapsulan comportamientos. Los buenos Value Objects atraen y encapsulan comportamientos que pueden ser utilizados por el resto del código.

Los Value Objects pueden ser muy genéricos y reutilizables, como Money, o muy específicos de un dominio.

## Refactorizar a Value Objects

Refactorizar a Value Objects puede ser una tarea de bastante calado ya que implica crear nuevas clases y utilizarlas en diversos puntos del código. Ahora bien, este proceso puede hacerse de forma bastante gradual. Ten en cuenta que:

* Los Value Objects no tienen dependencias, para crearlos solo necesitas tipos escalares u otros Value Objects.
* Los Value Objects se pueden instanciar allí donde los necesites, son *newables*.
* Normalmente tendrás métodos para convertir los Value Objects a escalares, de modo que puedas utilizar sus valores con código que no puedes modificar.

Los Value Objects aportan varias ventajas:

* Al encapsular su validación tendrás objetos con valores adecuados que puedes usar libremente sin necesidad de validar constantemente.
* Aportarán significado a tu código, siempre sabrás cuando una variable es un precio, un email, una edad, lo que necesites.
* Te permiten abstraerte de cuestiones como formato, precisión, etc.

### Propiedades múltiples para un solo concepto

Veamos un objeto típico de cualquier negocio: `Customer` que da lugar a varios ejemplos clásicos de Value Object. Normalmente un cliente siempre tiene un nombre, que suele ser una combinación de nombre de pila y uno o más apellidos. También tiene una dirección, que es una combinación de unos cuantos datos.

```php
class Customer
{
    private $id;
    private $name;
    private $firstSurname;
    private $lastSurname;
    private $street;
    private $streetNumber;
    private $floor;
    private $postalCode;
    private $city;
}
```

El constructor de nuestro `Customer` podría ser muy complicado, y eso que no hemos incluido todos los campos:

```php
class Customer
{
    private $id;
    private $name;
    private $firstSurname;
    private $lastSurname;
    private $street;
    private $streetNumber;
    private $floor;
    private $postalCode;
    private $city;

    public function __construct(
        string $id,
        string $name,
        string $firstSurname,
        ?string $lastSurname,
        string $street,
        string $streetNumber,
        string $floor,
        string $postalCode,
        string $city
    )
    {
        $this->id = $id;
        $this->name = $name;
        $this->firstSurname = $firstSurname;
        $this->lastSurname = $lastSurname;
        $this->street = $street;
        $this->streetNumber = $streetNumber;
        $this->floor = $floor;
        $this->postalCode = $postalCode;
        $this->city = $city;
    }

    public function fullName(): string 
    {
        $fullName = $this->name . ' ' . $this->firstSurname;
        
        if ($this->lastSurname) {
            $fullName .= ' ' . $this->lastSurname;
        }
        
        return $fullName;
    }

    public function address(): string 
    {
        $address = $this->street . ', ' . $this->streetNumber;
        
        if ($this->floor) {
            $address .= ' '. $this->floor;
        }
        
        $address .= $this->postalCode. '-'.$this->city;
        
        return $address;
    }
}
```

Solemos decir que las cosas que cambian juntas deben ir juntas, pero eso también implica que las cosas que no cambian juntas deberían estar separadas. En el constructor van todos los detalles mezclados y se hace muy difícil de manejar.

Yo no sé a ti pero a mí esto me pide un builder:

```php
class CustomerBuilder
{
    private $name;
    private $firstSurname;
    private $lastSurname;
    private $street;
    private $streetNumber;
    private $floor;
    private $postalCode;
    private $city;

    public function withName(string $name, string $firstSurname, ?string $lastSurname) : self
    {
        $this->name = $name;
        $this->firstSurname = $firstSurname;
        $this->lastSurname = $lastSurname;
        
        return $this;
    }

    public function withAddress(string $street, string $streetNumber, string $floor, string $postalCode, string $city): self
    {
        $this->street = $street;
        $this->streetNumber = $streetNumber;
        $this->floor = $floor;
        $this->postalCode = $postalCode;
        $this->city = $city;
        
        return $this;
    }

    public function build() : Customer
    {
        return new Customer(
            $this->id,
            $this->name,
            $this->firstSurname,
            $this->lastSurname,
            $this->street,
            $this->streetNumber,
            $this->floor,
            $this->postalCode,
            $this->city
        );
    }
}
```

Builder que podríamos usar así:

```php
$customerBuilder = new CustomerBuilder();

$customer = $customerBuilder
    ->withName('Fran', 'Iglesias', 'Gómez')
    ->withAddress('Piruleta St', '123', '4', '08030', 'Barcelona')
    ->build();
```

Gracias a usar el Builder podemos ver que hay, al menos, dos conceptos: el nombre del cliente y su dirección. De hecho, en la dirección tendríamos también dos conceptos: la localidad y las señas dentro de esa localidad.

Vamos por partes:

### Value Object simple

Normalmente manejamos mucha lógica en algo tan simple como un nombre. Veamos por ejemplo:

* En España usamos nombres con dos apellidos, pero en muchos otros países se suele usar un nombre con un único apellido.
* A veces necesitamos usar partes del nombre por separado ("Estimada Susana", "Sr Pérez"). Otras veces queremos combinarlo de diferentes formas, como podría ser poner el apellido primero, que es útil para listados.
* Y, ¿qué pasa si queremos introducir nueva información relacionada con el nombre? Por ejemplo, el tratamiento (Sr/Sra, Estimado/Estimada, etc).

El nombre del cliente se puede convertir fácilmente a un Value Object, lo que retirará cualquier lógica de la "gestión" del nombre de la clase `Customer`, contribuyendo al Single Responsibility Principle y proporcionándonos un comportamiento reutilizable.

Así que podemos crear un Value Object sencillo:

```php
class PersonName
{
    /** @var string */
    private $name;
    /** @var string */
    private $firstSurname;
    /** @var string */
    private $lastSurname;

    public function __construct(string $name, string $firstSurname, string $lastSurname)
    {
        $this->name = $name;
        $this->firstSurname = $firstSurname;
        $this->lastSurname = $lastSurname;
    }
}
```

La validación debe hacerse en el constructor, de modo que solo se puedan instanciar `PersonName` correctos. Supongamos que nuestras reglas son:

* Name y FirstSurname son obligatorios y no pueden ser un string vacío.
* LastSurname es opcional.

Al incluir la validación tendremos el siguiente código:

```php
class PersonName
{
    /** @var string */
    private $name;
    /** @var string */
    private $firstSurname;
    /** @var string */
    private $lastSurname;

    public function __construct(string $name, string $firstSurname, ?string $lastSurname = null)
    {
        if ($name === '' || $firstSurname === '') {
            throw new InvalidArgumentException('Name and First Surname are mandatory');
        }
        $this->name = $name;
        $this->firstSurname = $firstSurname;
        $this->lastSurname = $lastSurname;
    }
}
```

Más adelante volveremos sobre este objeto. Ahora vamos a definir varios Value Objects. De momento, solo me voy a concentrar en los constructores, sin añadir ningún comportamiento, ni siquiera el método `equals` ya que quiere centrarme en cómo movernos de usar escalares a estos objetos.

### Value Object Compuesto

Para crear el VO `Address` haremos algo parecido y crearemos una clase `Address` para representar las direcciones de los clientes.

Sin embargo, hemos dicho que podríamos crear un Value Object en torno al concepto de localidad o código postal, que incluiría el código postal y la ciudad. Obviamente esto dependerá de nuestro dominio. En algunos casos no nos hará falta esa granularidad porque simplemente queremos disponer de una dirección postal de nuestros clientes para enviar comunicaciones. Pero en otros casos puede ocurrir que nuestro negocio tenga aspectos que dependan de ese concepto, como un servicio cuya tarifa sea función de la ubicación.

```php
class Locality
{
    /** @var string */
    private $postalCode;
    /** @var string */
    private $locality;

    public function __construct(string $postalCode, string $locality)
    {
        $this->isValidPostalCode($postalCode);
        $this->isValidLocality($locality);
        
        $this->postalCode = $postalCode;
        $this->locality = $locality;
    }

    private function isValidPostalCode(string $postalCode) : void
    {
        if (\strlen($postalCode) !== 5 || (int) substr($postalCode, 0, 2) > 52) {
            throw new InvalidArgumentException('Invalid Postal Code');
        }
    }
    
    private function isValidLocality(string $locality) : void
    {
        if ($locality === '') {
            throw new InvalidArgumentException('Locality should have a value');
        }
    }

```

La verdad es que podríamos hilar más fino y declarar un VO `PostalCode`:

```php
class PostalCode
{
    /** @var string */
    private $postalCode;

    public function __construct(string $postalCode)
    {
        $this->isValidPostalCode($postalCode);

        $this->postalCode = $postalCode;
    }

    private function isValidPostalCode(string $postalCode) : void
    {
        if (\strlen($postalCode) !== 5 || (int) substr($postalCode, 0, 2) > 52) {
            throw new InvalidArgumentException('Invalid Postal Code');
        }
    }
}
```

De modo que `Locality` quedaría así:

```php
class Locality
{
    /** @var PostalCode */
    private $postalCode;
    /** @var string */
    private $locality;

    public function __construct(PostalCode $postalCode, string $locality)
    {
        $this->isValidLocality($locality);

        $this->postalCode = $postalCode;
        $this->locality = $locality;
    }
    
    private function isValidLocality(string $locality) : void
    {
        if ($locality === '') {
            throw new InvalidArgumentException('Locality should have a value');
        }
    }
}
```

En este caso, no consideramos que `PostalCode` sea una dependencia de `Locality`. Estamos hablando de tipos de datos por lo que estos objetos son *newables*, que es una forma de decir que se instancian a medida que se necesitan.

En fin. Volviendo a nuestro problema original de crear un objeto Address podríamos adoptar este enfoque:

```php
class Address
{
    /** @var string */
    private $street;
    /** @var string */
    private $streetNumber;
    /** @var string */
    private $floor;
    /** @var Locality */
    private $locality;

    public function __construct(string $street, string $streetNumber, ?string $floor, Locality $locality)
    {
        if ('' === $street || '' === $streetNumber) {
            throw new InvalidArgumentException('Address should include street and number');   
        } 
        $this->street = $street;
        $this->streetNumber = $streetNumber;
        $this->floor = $floor;
        $this->locality = $locality;
    }
}
```

Puesto que `Locality` es un VO no es necesario validarla. Además, aquí no necesitamos saber cómo se construye por lo que nos daría igual si hemos optado por un diseño u otro de la clase ya que la vamos a recibir construida y `Address` puede confiar en que funcionará como es debido. 

Siempre que un objeto requiere muchos parámetros en su construcción puede ser interesante plantearse si tenemos buenas razones para organizarlos en forma de Value Objects, aplicando el principio de covariación: si cambian juntos, deberían ir juntos. En este caso, `$street`, `$streetNumber` y `$floor` pueden ir juntos, en forma de `StreetAddress` porque entre los tres componen un concepto útil.

```php
class StreetAddress
{
    /** @var string */
    private $street;
    /** @var string */
    private $streetNumber;
    /** @var string */
    private $floor;

    public function __construct(string $street, string $streetNumber, ?string $floor)
    {
        if ('' === $street || '' === $streetNumber) {
            throw new InvalidArgumentException('Address should include street and number');
        }
        $this->street = $street;
        $this->streetNumber = $streetNumber;
        $this->floor = $floor;
    }
}
```

De este modo, Address se hace más simple y ni siquiera tiene que ocuparse de validar nada:

```php
class Address
{
    /** @var StreetAddress */
    private $streetAddress;
    /** @var Locality */
    private $locality;

    public function __construct(StreetAddress $streetAddress, Locality $locality)
    {
        $this->streetAddress = $streetAddress;
        $this->locality = $locality;
    }
}
```

En resumidas cuentas, a medida que reflexionamos sobre los conceptos del dominio podemos percibir la necesidad de trasladar esa reflexión al código de una forma más articulada y precisa. Pero como hemos señalado antes todo depende de las necesidades de nuestro dominio. Lo cierto es que, como veremos a lo largo del artículo, cuanto más articulado tengamos el domino, vamos a tener más capacidad de maniobra y muchísima más coherencia.

### Introduciendo los Value Objects

Volvamos a `Customer`. De momento, el hecho de introducir una serie de Value Objects no afecta para nada al código que tengamos, por lo que podríamos estar creando cada uno de los VO, haciendo *commits*, mezclando en master y desplegando sin afectar de ningún modo a la funcionalidad existente. Simplemente, hemos añadido clases a nuestra base de código y ahí están: esperando a ser utilizadas.

En este caso, tener a `CustomerBuilder` nos viene muy bien pues encapsula la compleja construcción de Customer, aislándola del resto del código. Podremos refactorizar `Customer` sin afectar a nadie. Empezaremos por el nombre:

```php
class Customer
{
    private $id;
    /** @var PersonName */
    private $personName;
    private $street;
    private $streetNumber;
    private $floor;
    private $postalCode;
    private $city;

    public function __construct(
        string $id,
        PersonName $personName,
        string $street,
        string $streetNumber,
        string $floor,
        string $postalCode,
        string $city
    ) {
        $this->id = $id;
        $this->personName = $personName;
        $this->street = $street;
        $this->streetNumber = $streetNumber;
        $this->floor = $floor;
        $this->postalCode = $postalCode;
        $this->city = $city;
    }

    public function fullName(): string
    {
        return $this->personName->fullName();
    }

    public function address(): string
    {
        $address = $this->street . ', ' . $this->streetNumber;

        if ($this->floor) {
            $address .= ' '. $this->floor;
        }

        $address .= $this->postalCode. '-'.$this->city;

        return $address;
    }
}
```

Como podemos ver, para empezar el constructor ya es más simple. Además, el método `fullName` puede delegarse al disponible en el objeto `PersonName`, que se puede ocupar cómodamente de cualquier variante o formato particular que necesitemos a lo largo de la aplicación.

```php
class PersonName
{
    /** @var string */
    private $name;
    /** @var string */
    private $firstSurname;
    /** @var string */
    private $lastSurname;

    public function __construct(string $name, string $firstSurname, ?string $lastSurname = null)
    {
        if ($name === '' || $firstSurname === '') {
            throw new InvalidArgumentException('Name and First Surname are mandatory');
        }
        $this->name = $name;
        $this->firstSurname = $firstSurname;
        $this->lastSurname = $lastSurname;
    }

    public function fullName(): string
    {
        $fullName = $this->name . ' ' . $this->firstSurname;
        
        if ($this->lastSurname) {
            $fullName .= ' ' . $this->lastSurname;
        }
        
        return $fullName;
    }
}
```

Es por esto que decimos que los Value Objects "atraen" comportamientos ya que cualquier cosa que las clases usuarias necesiten puede encapsularse en el propio VO. Si necesitásemos el nombre en un formato apto para listas podríamos hacer lo siguiente:

```php
class PersonName implements PersonNameInterface
{
    /** @var string */
    private $name;
    /** @var string */
    private $firstSurname;
    /** @var string */
    private $lastSurname;

    public function __construct(string $name, string $firstSurname, ?string $lastSurname = null)
    {
        if ($name === '' || $firstSurname === '') {
            throw new InvalidArgumentException('Name and First Surname are mandatory');
        }
        $this->name = $name;
        $this->firstSurname = $firstSurname;
        $this->lastSurname = $lastSurname;
    }

    public function fullName(): string
    {
        return $this->name .' ' . $this->surname();
    }

    public function listName(): string
    {
        return $this->surname() . ', ' . $this->name;
    }

    public function surname(): string
    {
        $surname = $this->firstSurname;

        if ($this->lastSurname) {
            $surname .= ' ' . $this->lastSurname;
        }

        return $surname;
    }

    public function treatment() : string
    {
        return $this->name();
    }
}
```

Como tenemos un Builder que encapsula la construcción de `Customer`, lo que hacemos es modificar esa construcción de acuerdo al nuevo diseño:

```php
class CustomerBuilder
{
    private $personName;
    private $street;
    private $streetNumber;
    private $floor;
    private $postalCode;
    private $city;

    public function withName(string $name, string $firstSurname, ?string $lastSurname) : self
    {
        $this->personName = new PersonName($name, $firstSurname, $lastSurname);
        
        return $this;
    }

    public function withAddress(string $street, string $streetNumber, string $floor, string $postalCode, string $city): self
    {
        $this->street = $street;
        $this->streetNumber = $streetNumber;
        $this->floor = $floor;
        $this->postalCode = $postalCode;
        $this->city = $city;
        
        return $this;
    }

    public function build() : Customer
    {
        return new Customer(
            $this->id,
            $this->personName,
            $this->street,
            $this->streetNumber,
            $this->floor,
            $this->postalCode,
            $this->city
        );
    }
}
```

Fíjate que he dejado el método `withName` tal y como estaba. De esta forma, no cambio la interfaz pública de `CustomerBuilder`, como tampoco cambia la de `Customer` salvo en el constructor, y el código que lo usa no se enterará del cambio. En otras palabras, el ejemplo anterior funcionará exactamente igual:

```php
$customerBuilder = new CustomerBuilder();

$customer = $customerBuilder
    ->withName('Fran', 'Iglesias', 'Gómez')
    ->withAddress('Piruleta St', '123', '4', '08030', 'Barcelona')
    ->build();
```

Por supuesto, haríamos lo mismo con el VO Address. Así queda Customer:

```php
class Customer
{
    private $id;
    /** @var PersonName */
    private $personName;
    /** @var Address */
    private $address;

    public function __construct(
        string $id,
        PersonName $personName,
        Address $address
    ) {
        $this->id = $id;
        $this->personName = $personName;
        $this->address = $address;
    }

    public function fullName(): string
    {
        return $this->personName->fullName();
    }

    public function address(): string
    {
        return $this->address->full();
    }
}
```

El método `full` en `Address` lo resuelvo mediante un *type casting* a string de sus componentes, que es una manera sencilla de disponer de su valor en un formato escalar estándar:

```php
class Address
{
    /** @var StreetAddress */
    private $streetAddress;
    /** @var Locality */
    private $locality;

    public function __construct(StreetAddress $streetAddress, Locality $locality)
    {
        $this->streetAddress = $streetAddress;
        $this->locality = $locality;
    }

    public function full(): string
    {
        return (string)$this->streetAddress . ' ' . (string)$this->locality();
    }
}
```

En este caso necesitaremos:

```php
class StreetAddress
{
    /** @var string */
    private $street;
    /** @var string */
    private $streetNumber;
    /** @var string */
    private $floor;

    public function __construct(string $street, string $streetNumber, ?string $floor)
    {
        if ('' === $street || '' === $streetNumber) {
            throw new InvalidArgumentException('Address should include street and number');
        }
        $this->street = $street;
        $this->streetNumber = $streetNumber;
        $this->floor = $floor;
    }

    public function __toString(): string 
    {
        $fullAddress = $this->street . ' ' . $this->streetNumber;
        
        if ($this->floor) {
            $fullAddress .= ', '. $this->floor;
        }
        
        return $fullAddress;
    }
}
```

Y también:

```php
class PostalCode
{
    /** @var string */
    private $postalCode;

    public function __construct(string $postalCode)
    {
        $this->isValidPostalCode($postalCode);

        $this->postalCode = $postalCode;
    }

    private function isValidPostalCode(string $postalCode) : void
    {
        if (\strlen($postalCode) !== 5 || (int) substr($postalCode, 0, 2) > 52) {
            throw new InvalidArgumentException('Invalid Postal Code');
        }
    }

    public function __toString(): string 
    {
        return $this->postalCode;
    }
}
```

Así como:

```php
class Locality
{
    /** @var PostalCode */
    private $postalCode;
    /** @var string */
    private $locality;

    public function __construct(PostalCode $postalCode, string $locality)
    {
        $this->isValidLocality($locality);

        $this->postalCode = $postalCode;
        $this->locality = $locality;
    }

    private function isValidLocality(string $locality) : void
    {
        if ($locality === '') {
            throw new InvalidArgumentException('Locality should have a value');
        }
    }

    public function __toString(): string 
    {
        return (string) $this->postalCode .'-'.$this->locality;
    }
}
```

Del mismo modo que antes, modificaremos `CustomerBuilder` para utilizar los nuevos objetos:

```php
class CustomerBuilder
{
    private $personName;
    private $address;

    public function withName(string $name, string $firstSurname, ?string $lastSurname) : self
    {
        $this->personName = new PersonName($name, $firstSurname, $lastSurname);
        
        return $this;
    }

    public function withAddress(string $street, string $streetNumber, string $floor, string $postalCode, string $city) : self
    {
        $locality = new Locality(new PostalCode($postalCode), $city);
        $streetAddress = new StreetAddress($street, $streetNumber, $floor);

        $this->address = new Address($streetAddress, $locality);
        
        return $this;
    }

    public function build() : Customer
    {
        return new Customer(
            $this->id,
            $this->personName,
            $this->address
        );
    }
}
```

Y ya está, hemos hecho este cambio sin tener que tocar en ningún lugar más del código. Obviamente, tener un Builder de Customer nos ha facilitado muchos las cosas, lo que nos dice que es bueno tener un único lugar de instanciación de los objetos.

### Beneficios

El beneficio más evidente es que las clases importantes del dominio como `Customer`, quedan mucho más compactas. Hemos podido reducir ocho propiedades a dos, que son conceptos relevantes dentro de `Customer`.

Por otro lado, todo lo que tiene que ver con ellos, `Customer` se lo delega. Dicho de otro modo, `Customer` no tiene que saber cómo se da formato a un nombre o a una dirección. Simplemente, cuando se lo piden entrega el nombre o la dirección formateados. Asimismo, cualquier otro objeto que usase `PersonName` o `Address`, lo hará de la misma manera.

Otra cosa interesante es que los cambios que necesitemos en el comportamiento de estas propiedades pueden aplicarse sin tocar el código de la clase, modificando los Value Objects, con lo cual el nuevo comportamiento se extenderá a todas las partes de la aplicación que lo utilicen.

## Introduciendo nuevas features a través de los Value Objects

Vamos a ver cómo la nueva situación en la que nos deja el refactor nos facilita la vida en el futuro. Imaginemos que tenemos que añadir una nueva feature en la aplicación.

Es importante tratar bien a los clientes, por lo que nos han pedido incluir una propiedad de género que permita personalizar el tratamiento que utilizamos en las comunicaciones.

¿A quién pertenecería esa propiedad en nuestro modelo? En el diseño inicial tendríamos que ponerla en `Customer`, pero ahora podríamos hacerlo en `PersonName`. Aún mejor: no toquemos nada, o casi nada, de lo que hay.

Supongamos que `Customer` tiene un método `treatment` al que recurrimos para montar emails o cartas:

```php
public function treatment(): string 
{
    return $this->personName->treatment();
}
```

Primero queremos un nuevo Value Object, que será Gender:

```php
class Gender
{
    /** @var string */
    private $gender;

    private const FEMALE = 'female';
    private const MALE = 'male';

    private const VALID_GENDERS = [
        self::FEMALE,
        self::MALE
    ];
    
    private const TREATMENTS = [
        self::FEMALE => 'Estimada',
        self::MALE => 'Estimado'
    ];

    public function __construct(string $gender)
    {
        if (!\in_array(strtolower($gender), self::VALID_GENDERS, true)) {
            throw new \InvalidArgumentException('Gender should be one of '.implode(', ', self::VALID_GENDERS));
        }

        $this->gender = strtolower($gender);
    }

    public function treatment(): string
    {
        return self::TREATMENTS[$this->gender];
    }
}
```

Este tipo de Value Object será un Enumerable. Representa conceptos que tienen un número limitado (numerable) de valores. PHP, de momento, no tiene una implementación propia como otros lenguajes, por lo que podemos simularla de este modo.

El siguiente paso es hacer que la clase PersonName implemente una interfaz PersonNameInterface:

```php
interface PersonNameInterface
{
    public function fullName() : string;

    public function listName() : string;

    public function surname() : string;
    
    public function treatment(): string;
}
```

Y hacemos que Customer la utilice. Es un cambio pequeño, que nos permitirá usar implementaciones alternativas:

```php
class Customer
{
    private $id;
    /** @var PersonNameInterface */
    private $personName;
    /** @var Address */
    private $address;

    public function __construct(
        string $id,
        PersonNameInterface $personName,
        Address $address
    ) {
        $this->id = $id;
        $this->personName = $personName;
        $this->address = $address;
    }

    public function fullName(): string
    {
        return $this->personName->fullName();
    }

    public function address(): string
    {
        return $this->address->full();
    }
    
    public function treatment(): string 
    {
        return $this->personName->treatment();
    }
}
```

Ahora, crearemos un tipo de `PersonName` que sepa algo acerca del género del nombre:

```php
class GenderMarkedPersonName implements PersonNameInterface
{
    /** @var Gender */
    private $gender;
    /** @var PersonName */
    private $personName;

    public function __construct(Gender $gender, PersonName $personName)
    {
        $this->gender = $gender;
        $this->personName = $personName;
    }

    public function fullName(): string
    {
        return $this->personName->fullName();
    }

    public function listName(): string
    {
        return $this->personName->listName();
    }

    public function surname(): string
    {
        return $this->personName->surname();
    }

    public function treatment() : string
    {
        return $this->gender->treatment().' '.$this->personName->treatment();
    }
}
```

Y ahora, el último cambio, en el Builder usaremos la nueva implementación:

```php
class CustomerBuilder
{
    private $personName;
    private $address;
    private $gender;

    public function withName(string $name, string $firstSurname, ?string $lastSurname) : self
    {
        $this->personName = new PersonName($name, $firstSurname, $lastSurname);

        return $this;
    }

    public function withAddress(string $street, string $streetNumber, string $floor, string $postalCode, string $city) : self
    {
        $locality = new Locality(new PostalCode($postalCode), $city);
        $streetAddress = new StreetAddress($street, $streetNumber, $floor);

        $this->address = new Address($streetAddress, $locality);

        return $this;
    }

    public function withGender(string $gender): self
    {
        $this->gender = new Gender($gender);

        return $this;
    }

    public function build() : Customer
    {
        $personName = new GenderMarkedPersonName($this->gender, $this->personName);

        return new Customer(
            $this->id,
            $personName,
            $this->address
        );
    }
}
```

Esta modificación ya tiene algo más de calado, pero sigue siendo razonablemente segura. Si te fijas, solo estamos modificando comportamientos del Builder y ahí podemos ser un poco menos estrictos. Teniendo muchísimo rigor, podríamos crear un decorador de `CustomerBuilder` que crease un `Customer` cuyo `PersonNameInterface` fuese un GenderMarkerPersonName, pero ya estaríamos entrando quizá en la sobre-ingeniería.

Fíjate que ahora `Customer` es capaz de usar el tratamiento adecuado para cada cliente y realmente no lo hemos tenido que tocar. De hecho, hemos añadido la `feature` añadiendo bastante código, pero con un mínimo riesgo de afectación al resto de la aplicación.

## Haciendo balance

Veamos algunos números. Empezamos con dos clases: `Customer` y `CustomerBuilder`. ¿Sabes cuántas tenemos ahora? Nada menos que nueve, además de una interfaz. La parte buena es que hemos afectado muy poco al código restante, tan solo en el último paso, cuando hemos tenido que introducir una nueva `feature`. Pero aquí ya no estamos hablando de refactor.

Sin embargo, nuestro dominio tiene ahora muchísima flexibilidad y capacidad de cambio. 

Sería bastante fácil, por ejemplo, dar soporte a los múltiples formatos de dirección postal que se usan en todo el mundo, de modo que nuestro negocio está mejor preparado para expandirse internacionalmente ya que solo tendríamos que introducir una interfaz y nuevos formatos a medida que los necesitemos, sin tener que cambiar el `core` del dominio. Puede sonar exagerado, pero estos pequeños detalles pueden ser un dolor de cabeza enorme si seguimos el modelo con el que empezamos. Algo tan pequeño puede ser la diferencia entre un código y un negocio que escale fácilmente o no.



