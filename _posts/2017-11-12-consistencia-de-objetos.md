---
layout: post
title: Consistencia de objetos
categories: articles
tags: oop design-principles
---

El último artículo me dejó con un poco de mal sabor de boca porque la solución propuesta al problema de tratar casos especiales en una colección de objetos que estábamos construyendo a partir de datos obtenidos de una API externa cojea en algún punto.

Lo bueno es que eso me da pie para tratar un asunto interesante como es el de la necesidad de construir objetos que sean consistentes y válidos, así como el de definir qué es lo que hace consistente a un objeto, lo que debería ser inmutable y lo que puede variar.


## Modelos anémicos y consistencia


En el ejemplo del artículo anterior, aunque en ningún momento se hace explícito, los objetos de nuestra colección encajan en lo que se ha dado en llamar el "modelo anémico", es decir, entidades que no tienen comportamiento, sino que se limitan a contener datos que se manejan a través de getters y setters. A veces, ni eso, pues tienen todas las propiedades públicas y, con frecuencia, carecen de constructores. En la práctica, estos objetos anémicos no son mucho mejores que los arrays asociativos, fuera del hecho de que podemos hacer type hinting.

Ese se desprende del hecho de que pudiésemos plantearnos modificar la información incorrecta de un objeto, en lugar de crear uno nuevo correcto en su lugar. Y eso es un problema.

Al no tener constructor y poder leer y escribir todas sus propiedades, nunca podemos tener la seguridad de que el estado del objeto es válido y consistente. ¿Y eso qué quiere decir?

Veamos un ejemplo.

Supongamos que nuestra aplicación sirve para comprobar las existencias y precios de productos en una serie de tiendas. Nos centraremos en las tiendas. ¿Cómo definimos esta entidad?

```php
class Store {
	// properties
}
```

Para nuestro ejemplo, vamos a imaginar que nos interesan los siguientes datos:


* Nombre de la tienda
* Dirección postal (calle, número, cp, localidad)
* Geolocalización (latitud, longitud)


En el enfoque del modelo anémico podríamos diseñar el objeto así:

```php
class Store {
	var $name;
	var $street;
	var $streetNumber;
	var $cp;
	var $location;
	var $latitude;
	var $longitude;
}
```

O bien así, que es lo mismo pero apenas un poco menos malo:

```php
class Store {
	private $name;
	private $street;
	private $streetNumber;
	private $cp;
	private $location;
	private $latitude;
	private $longitude;
	
	public function setName($name)
	{
		$this->name = $name;
	}
	
	public function getName()
	{
		return $this->name;
	}
	
	// Getters y setters para el resto de propiedades
}
```

Los puntos flacos de este diseño son... ¡todos!

Como las propiedades son públicas o los métodos de acceso lo son, podríamos cambiarlas en cualquier momento, o podría cambiarlas cualquier instancia de nuestra aplicación, de modo que nunca tendríamos la certeza de que el objeto contiene la información que debería contener o si, de hecho, está completamente construido.

La <strong>consistencia</strong> es precisamente la propiedad de los objetos que contienen la información necesaria y correcta para considerarlos completos y poder así utilizarlos en las operaciones en las que intervengan.

Por ejemplo, si uno de nuestros objetos Store careciese del dato de longitud no podríamos situarlo en un mapa, o si cambiamos el nombre luego no podríamos identificarlo correctamente a la hora de almacenarlo o mostrarlo al usuario.


## Value objects


Por otro lado, el objeto Store contiene propiedades que se pueden organizar en grupos cohesivos y que, de hecho, son conceptos que pueden representarse como objetos. Para expresarlo en código, Store no tendría siete propiedades, sino tres. Pero esto es sólo el comienzo.

```php
class Address {
	private $street;
	private $streetNumber;
	private $cp;
	private $location;	
}

class Coordinates {
	private $latitude;
	private $longitude;
}

class Store {
	private $name;
	private $address;
	private $coordinates;
	
	public function setName(string $name)
	{
		$this->name = $name;
	}
	
	public function getName() : string
	{
		return $this->name;
	}
	
	public function setAddress(Address $address)
	{
		$this->address = $address;
	}
	
	public function getAddress() : Address
	{
		return $this->address;
	}
	
	public function setCoordinates(Coordinates $coordinates)
	{
		$this->coordinates = $coordinates;
	}
	
	public function getCoordinates() : Coordinates
	{
		return $this->coordinates;
	}
	
	// Getters y setters para el resto de propiedades
}
```

No he detallado mucho Address ni Coordinates, voy a centrarme en ellos ahora.

Tanto Address como Coordinates son Value Objects. Los Value Objects representan conceptos importantes del dominio que no tienen identidad. Decimos que dos Value Objects son iguales cuando sus valores son iguales: cuando representan lo mismo. Aunque Value Objects es un concepto que viene del Domain Driven Design, podemos utilizarlo aunque no sigamos este paradigma de diseño o incluso fuera de la capa de dominio: los Value Objects representan conceptos en los que no nos interesa su identidad, sino sus valores.

El ejemplo clásico es el dinero: todos los billetes de cinco euros son iguales porque representan un valor de cinco euros, por lo que no nos importa usar un billete concreto u otro. La identidad de un billete, sin embargo, puede importar en ciertos casos (por eso tienen número de serie), pero esa es otra historia.

Las coordenadas no tienen identidad, son valores que representan una posición geográfica y que pueden usarse para representar la posición de todo lo que se encuentre en ese punto de la tierra en un momento dado.

Las direcciones postales tampoco tienen identidad, aunque en otros contextos o dominios sí podrían tenerla. Una dirección postal representa una forma de identificar la ubicación de algo en una población.


### Datos completos


En ambos casos nuestros Value Objects agregan varios valores simples para componer unidades que tienen un significado. Las coordenadas son una pareja de números, mientras que las direcciones postales son el nombre de la calle, un número de finca, el código postal y la localidad. Todos esos datos son necesarios para que el objeto sea válido y consistente y, por tanto, son obligatorios.

La forma de expresar esta obligatoriedad en código es pasar los datos en el constructor del objeto:

```php
class Address {
	private $street;
	private $streetNumber;
	private $cp;
	private $location;
	
	public function __construct(string $street, integer $streetNumber, string $cp, string $location)
	{
		$this->street = $street;
		$this->streetNumber = $streetNumber;
		$this->cp = $cp;
		$this->location = $location;
	}
}

class Coordinates {
	private $latitude;
	private $longitude;
	
	public function __construct(float $latitude, float $longitude)
	{
		$this->latitude = $latitude;
		$this->longitude = $longitude;
	}
}
```


### Inmutabilidad


Pero además, esos datos no pueden cambiar. Una coordenada no cambia con el tiempo. La posición de una tienda sí podría cambir porque no es raro que una tienda se mude a una ubicación mejor y para expresar eso habría que cambiar las coordenadas. Pero no se cambian los valores del objeto coordenadas, sino que se debe cambiar el objeto entero.

A esta propiedad se le llama <strong>inmutabilidad</strong>. La inmutabilidad de un objeto se expresa en código eliminando los setters, de modo que no se pueda cambiar el valor de las propiedades.

Claro que podemos necesitar hacer cálculos y otras operaciones con nuestros Value Objects, pero no debemos modificar sus propiedades, sino crear nuevas instancias con los nuevos valores y devolver éstas. De este modo, mantenemos su inmutabilidad.

Supongamos que necesitamos ser capaces de "mover" coordenadas sumando o restando grados, para mantener la inmutabilidad deberíamos hacerlo así:

```php
class Coordinates {
	private $latitude;
	private $longitude;
	
	public function __construct(float $latitude, float $longitude)
	{
		$this->latitude = $latitude;
		$this->longitude = $longitude;
	}
	
	public function move(float $deltaLat, float $deltaLong) : Coordinates
	{
		$newLatitude = $this->latitude + $deltaLat;
		$newLongitude = $this->longitude + $deltaLong;
		return new self($newLatitude, $newLongitude);
	}
}
```

El método devuelve un nuevo objeto Coordinates con las nuevas coordenadas, mientras que el objeto original se mantiene inalterado.


### Igualdad basada en el valor


Hemos dicho antes que los Value Objects son inguales si representan los mismos valores, lo que es lo mismo que decir que tienen las propiedades iguales. Normalmente, necesitaremos crear un método específico para valorar si un objeto es igual a otro:

```php
class Coordinates {
	private $latitude;
	private $longitude;
	
	public function __construct(float $latitude, float $longitude)
	{
		$this->latitude = $latitude;
		$this->longitude = $longitude;
	}
	
	public function move(float $deltaLat, float $deltaLong) : Coordinates
	{
		$newLatitude = $this->latitude + $deltaLat;
		$newLongitude = $this->longitude + $deltaLong;
		return new self($newLatitude, $newLongitude);
	}
	
	public function equals(Coordinates $other)
	{
		return ($this->latitude === $other->latitude && $this->longitude === $other->longitude);
	}
}
```


### Consistencia y validez


Gracias a lo anterior, nuestros Value Objects ya son objetos muy sólidos, pero aún nos faltan cosas. De todos los objetos que es posible construir no nos sirven todos, tienen que ser válidos para el concepto que representan. Me explico: la clase Coordinates tiene y necesita dos propiedades latitude y longitude, algo ya representado en la existencia del constructor, pero esas propiedades no deben admitir cualquier valor de coma flotante, sino únicamente aquellos en el rango -90 a 90 para la latitud y en el rango -180 a 180 para la longitud.

Esta restricción termina por definir lo que es un par de coordenadas y para expresarlo en código necesitamos añadir algún tipo de control que se asegure de que el objeto se construirá si y sólo si se le pasan dos valores en ese rango.

Y la mejor forma de expresarlo es lanzando una excepción si alguno de los dos valores no lo cumple:

```php
class Coordinates {
	const MAX_ABS_VALID_LONGITUDE = 180;
	const MAX_ABS_VALID_LATITUDE = 90;
	private $latitude;
	private $longitude;
	
	public function __construct(float $latitude, float $longitude)
	{
		$this->ensureValidCoordinate($latitude, self::MAX_ABS_VALID_LATITUDE);
		$this->ensureValidLongitude($longitude, self::MAX_ABS_VALID_LONGITUDE);
		
		$this->latitude = $latitude;
		$this->longitude = $longitude;
	}
	
	public function move(float $deltaLat, float $deltaLong) : Coordinates
	{
		$newLatitude = $this->latitude + $deltaLat;
		$newLongitude = $this->longitude + $deltaLong;
		return new self($newLatitude, $newLongitude);
	}
	
	public function equals(Coordinates $other)
	{
		return ($this->latitude === $other->latitude && $this->longitude === $other->longitude);
	}
	
	private function ensureValidCoordinate(float $coordinate, float $max)
	{
		if (abs($coordinate) > $max) {
			throw new \InvalidArgumentException(sprintf('A coordinate should be a value between -%d and %d', $max));
		}
	}
}
```

En estos casos, suele ser buena idea usar autoencapsulación, mediante setters privados:

```php
class Coordinates {
	const MAX_ABS_VALID_LONGITUDE = 180;
	const MAX_ABS_VALID_LATITUDE = 90;
	private $latitude;
	private $longitude;
	
	public function __construct(float $latitude, float $longitude)
	{
		$this->setLatitude($latitude);
		$this->setLongitude($longitude);
	}
	
	public function move(float $deltaLat, float $deltaLong) : Coordinates
	{
		$newLatitude = $this->latitude + $deltaLat;
		$newLongitude = $this->longitude + $deltaLong;
		return new self($newLatitude, $newLongitude);
	}
	
	public function equals(Coordinates $other)
	{
		return ($this->latitude === $other->latitude && $this->longitude === $other->longitude);
	}

	private function setLatitude(float $latitude)
	{
		$this->ensureValidCoordinate($latitude, self::MAX_ABS_VALID_LATITUDE);
		$this->latitude = $latitude;
	}
	
	private function setLongitude(float $longitude)
	{
		$this->ensureValidCoordinate($longitude, self::MAX_ABS_VALID_LONGITUDE);
		$this->longitude = $longitude;
	}
	
	private function ensureValidCoordinate(float $coordinate)
	{
		if (abs($coordinate) > self::MAX_VALID_COORDINATE) {
			throw new \InvalidArgumentException('A coordinate should be a value between -90 and 90');
		}
	}
}
```

Con esta restricción resulta que es imposible crear un nuevo par de coordenadas que no sea válido, lo cual quiere decir que, en la práctica, un objeto que reciba como parámentro objeto de la clase Coordinates no tiene necsidad de validarlo, excepto en lo tocante a cuestiones del dominio. Con esto último quiero decir que todo lo que hemos hecho hasta ahora nos garantiza la consistencia y validez formal del objeto Coordinates, pero nuestro dominio o negocio podría tener otras restricciones más "semánticas" sobre estos objetos, pero tendrían que definirse en otra parte.

En el caso del objeto Address haremos algo parecido, de modo que podamos garantizar su consistencia formal, expresando reglas como:


* El nombre de la calle no puede estar vacío
* El número de la calle tiene que ser un entero mayor que cero
* El código postal no puede estar vacío y es un número de cinco cifras expresado como string (en España)
* La localidad no puede estar vacía


Obviamente se plantean otros problemas, como asegurarnos de que los nombres de las calles existen, que los códigos postales son válidos, etc.

La cuestión es que los Value Objects no pueden tener dependencias funcionales, así que para validar que los datos son "reales" tendríamos que usar servicios de validación o factorías de Value Objects que puedan ocuparse de construirlos con datos reales.

Lo que sí podemos hacer es que los Value Objects utilicen otros Value Objects, pero en esos casos no hablaríamos de una dependencia. Por ejemplo, en el caso de Address podriamos plantearnos agrupar las propiedades en dos Value Objects: uno que agrupe la calle y el número y otro que agrupe el código postal y la localidad. Pero como no me apetece extenderme en este punto, te lo dejo como ejercicio.


### Devolución de información


Una cosa que no hemos tratado todavía es que los Value Objects tienen que proporcionarnos alguna forma de acceder a sus datos o utilizarlos. La forma más sencilla es mediante getters públicos de toda la vida:

```php
class Coordinates {
	const MAX_ABS_VALID_LONGITUDE = 180;
	const MAX_ABS_VALID_LATITUDE = 90;
	private $latitude;
	private $longitude;
	
	public function __construct(float $latitude, float $longitude)
	{
		$this->setLatitude($latitude);
		$this->setLongitude($longitude);
	}
	
	public function move(float $deltaLat, float $deltaLong) : Coordinates
	{
		$newLatitude = $this->latitude + $deltaLat;
		$newLongitude = $this->longitude + $deltaLong;
		return new self($newLatitude, $newLongitude);
	}
	
	public function equals(Coordinates $other)
	{
		return ($this->latitude === $other->getLatitude() && $this->longitude === $other->getLongitude);
	}

	public function getLatitude()
	{
		return $this->latitude;
	}
	
	public function getLongitude()
	{
		return $this->longitude;
	}

	private function setLatitude(float $latitude)
	{
		$this->ensureValidCoordinate($latitude, self::MAX_ABS_VALID_LATITUDE);
		$this->latitude = $latitude;
	}
	
	private function setLongitude(float $longitude)
	{
		$this->ensureValidCoordinate($longitude, self::MAX_ABS_VALID_LONGITUDE);
		$this->longitude = $longitude;
	}
	
	private function ensureValidCoordinate(float $coordinate)
	{
		if (abs($coordinate) > self::MAX_VALID_COORDINATE) {
			throw new \InvalidArgumentException('A coordinate should be a value between -90 and 90');
		}
	}
}
```

La clase Coordinates puede quedar bien resuelta de esta manera, pero si vemos que tenemos que hacer cálculos con los datos que nos devuelve, entonces debemos plantearnos, o bien escribir métodos que nos devuelvan los datos procesados, o bien escribir decoradores que nos permitan obtener los datos en distintas formatos según el consumidor.

Por ejemplo, hemos asumido que Coordinates representa las coordenadoas en grados decimales, pero es muy posible que queramos la expresión de los mismos en formato sexagesimal. Un primer impulso sería introducir métodos capaces de realizar esta transformación, pero debemos valorar antes algunas cuestiones, como si ese formato lo vamos a necesitar sólo para cuestiones de presentación o si va a tener más usos.

Personalmente creo que puede ser mejor idea utilizar un objeto conversor al que le pasamos un Coordinates y lo convierte al sistema sexagesimal:

```php
class CoordinatesConverter
{
	public function toDMS(Coordinates $coordinates)
	{
		// ....
	}
}
```


## Entidades


Ahora que hemos identificado nuestros Value Objects podemos usarlos para construir la entidad Store.

Sin embargo, ¿qué es una entidad? Una entidad representa un concepto del dominio que tiene identidad y, por lo tanto, se compara con otros a través de esa identidad, no de sus propiedades. En nuestro ejemplo, Store tiene identidad. La identidad permanece inmutable durante la vida del objeto, aunque sus propiedades cambien.

Y aquí se presenta nuestro primer problema. La propiedad más parecida a la identidad que tenemos es su nombre. Sin embargo, un nombre puede cambiar sin que cambie la identidad del objeto representado, por tanto, necsitaríamos introducir una nueva propiedad que nos asegure que la identidad de cada Store permanece en todo su ciclo de vida.

Por convención, llamamos a esa propiedad id. Tanto el id como el nombre podrían ser también Value Objects. De hecho, deberían serlo, así podemos garantizar su auto-consistencia formal.

Por ejemplo, para el id:


* Debe tener un valor no nulo y único.


Es posible que para garantizar la unicidad del id necesitemos algún tipo de servicio que compruebe que un determinado Id no haya sido utilizado, o bien un generador de id únicos, como el paquete [Ramsey\UUid](https://github.com/ramsey/uuid) u otro de nuestra preferencia.

Y para el nombre:


* Debe ser un string de, al menos, 5 caracteres.


```php
class StoreId
{
	private $id;
	
	public function __construct(string $id)
	{
		$this->setId($id);
	}
	
	private function setId(string $id)
	{
		$this->isValidId($id);
		$this->id = $id;
	}
	
	public function getId()
	{
		return $this->id;
	}
	
	private function isValidId(string $id)
	{
		if (empty($id)) {
			throw new \InvalidArgumentException('Is should contain a value.');
		}
	}
}

class StoreName
{
	private $name;
	
	public function __construct(string $name)
	{
		$this->setName($name);
	}
	
	private function setName(string $name)
	{
		$this->isValidName($name);
		$this->name = $name;
	}
	
	private function isValidName(string $name)
	{
		if (strlen($name) < 5) {
			throw new \InvalidArgumentException('Name should have at least 5 characters');
		}
	}
	
	public function getName()
	{
		return $this->name;
	}
}
```

Para construir nuestra Store de forma consistente aplicamos las mismas ideas que utilizamos al hablar de los Value Objects. Fundamentalmente, pasar los valores obligatorios en construcción:

```php
class Store
{
	private $id;
	private $address;
	private $coordinates;
	private $name;
	
	public function __construct(
		StoreId $id, 
		StoreName $name, 
		Address $address, 
		Coordinates $coordinates
		)
	{
		$this->id = $id;
		$this->name = $name;
		$this->address = $address;
		$this->coordinates = $coordinates;
	}
}
```

Fíjate que gracias al hecho de que los Value Objects que pasamos son consistentes desde su creación, no necesitamos validarlos, excepto para asegurarnos de que cumplen alguna regla del negocio.

Hace un rato mencionamos que cabía la posibilidad de que algunas de estas propiedades pudiesen cambiar, pero ¿en qué circunstancias? ¿Bastaría con tener setters para introducir los nuevos valores? ¿O quizá podamos hacerlo de una manera más significativa?

Por ejemplo, la tienda puede cambiar de nombre por algún motivo. En ese caso, nos basta sustituir el StoreName por otro:

```php
class Store
{
	private $id;
	private $address;
	private $coordinates;
	private $name;
	
	public function __construct(
		StoreId $id, 
		StoreName $name, 
		Address $address, 
		Coordinates $coordinates
		)
	{
		$this->id = $id;
		$this->name = $name;
		$this->address = $address;
		$this->coordinates = $coordiantes;
	}
	
	public function changeName(StoreName $name)
	{
		$this->name = $name;
	}
}
```

¿Y qué hay de la dirección? Si cambia la dirección postal, también cambiará la localización geográfica, por lo que debemos forzar que ese cambio se produzca de forma simultánea. Lo expresamos en código mediante un método que pide los dos nuevos valores, de este modo, no se puede cambiar uno sin cambair el otro:

```php
class Store
{
	private $id;
	private $address;
	private $coordinates;
	private $name;
	
	public function __construct(
		StoreId $id, 
		StoreName $name, 
		Address $address, 
		Coordinates $coordinates
		)
	{
		$this->id = $id;
		$this->name = $name;
		$this->address = $address;
		$this->coordinates = $coordiantes;
	}
	
	public function changeName(StoreName $newName)
	{
		$this->name = $newName;
	}
	
	public function move(Address $newAddress, Coordinates $newCoordinates)
	{
		$this->address = $newAddress;
		$this->coordinates = $newCoordinates;
	}
}
```


## Para finalizar


Los objetos deberían ser capaces de cuidar de su consistencia interna, de modo que otros objetos que los utilicen puedan confiar en ellos y no tengan que ocuparse de validarlos, excepto en lo tocante a reglas específicas del dominio o de la responsabilidad del objeto que los consume. De este modo, si un objeto se ha podido instanciar podemos asumir con seguridad que lo podemos utilizar.

En ocasiones podríamos tener que utilizar servicios de validación o factorías que proporcionen datos adecuados a los objetos que se van a crear, particularmente, si tuviésemos que depender de fuentes de datos externas.

Dentro del dominio distinguimos entre Value Objects, que representan conceptos que no tienen idendidad, y Entidades, que representan conceptos con identidad. En ambos casos nos interesa seguir ciertas pautas en su diseño:


* La construcción tiene que garantizar que se genera un objeto consistente y lanzar una excepción si no es posible crearlo, por tanto, el constructor requerirá todos los datos necesarios y realizará todas las validaciones que sean relevantes.
* Idealmente todos las propiedades deberían expresarse con Value Objects en luegar de tipos escalares, de este modo pueden encapsular su auto-validación.
* Las propiedades inmutables se representan con visibilidad privada y sin métodos setter públicos que las puedan alterar.
* Las propiedades mutables pueden tener métodos públicos que expresen semánticamente acciones que expresen el cambio que se produce.
* Siempre que el cambio de una propiedad implique el cambio de otras, se expresa mediante un método que pide los nuevos datos para todas las propiedades que deben cambiar o bien que ejecuta los cálculos necesarios para cambiar las propiedades implicadas.
