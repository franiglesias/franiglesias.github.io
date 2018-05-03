---
layout: post
title: Builder pattern
categories: articles
tags: php design-patterns
---

Estos últimos días he trabajado bastante con el patrón Builder, así que toca escribir algo sobre su utilidad para la creación de objetos complicados.

Veamos. En PHP podemos crear o instanciar objetos utilizando `new`, ¿verdad?:

```php
$objeto = new Class('Mi Objeto');
```

Por supuesto.

Sin embargo, un `new` pelado no será siempre la forma más conveniente. Hay muchas situaciones en que necesitamos un mayor control sobre el modo en que creamos los objetos. 

Por ejemplo, el tipo de objeto que necesitamos podría estar determinado por algún parámetro que se obtiene en tiempo de ejecución, por lo que no sabemos a priori qué clase instanciar y tenemos que escribir un poco de código que nos permita decidirlo:

```php
switch ($type) {
	case 'customer':
		$relation = new Customer($someData);
		break;
	case 'provider':
		$relation = new Provider($someData);
		break;
	default:
		throw new InvalidArgumentException('Unsupported type');
}
```

Obviamente, lo normal sería encapsular este código en una clase, lo que genera un patrón conocido como **Factory** (ya hablaremos de él en alguna ocasión). Algo más o menos como esto:

```php
interface Relation
{
    public function data(): array;
}

class Customer implements Relation
{
    /** @var array */
    private $data;

    public function __construct(array $data)
    {
        $this->data = $data;
    }
    public function data(): array
    {
        return $this->data;
    }
}

class Provider implements Relation
{
    /** @var array */
    private $data;

    public function __construct(array $data)
    {
        $this->data = $data;
    }
    public function data(): array
    {
        return $this->data;
    }
}

class RelationFactory
{
    public function create($type, array $someData) : Relation
    {
        switch ($type) {
            case 'customer':
                return new Customer($someData);
            case 'provider':
                return new Provider($someData);
            default:
                throw new InvalidArgumentException('Unsupported type');
        }
    }
}
```

De este modo, cuando necesitemos instanciar un objeto del tipo `Relation` lo haríamos así:

```php
$relationFactory = new RelationFactory();

//...

$relation = $relationFactory->create('customer', []);
```

En resumidas cuentas, la **Factoría** nos permite encapsular un algoritmo de creación de objetos que en último término ejecuta un `new`.

Pero nosotros estamos aquí para hablar de otro patrón creacional: el patrón Builder.

## El caso para el patrón builder

En general, los patrones creacionales se usan para poder encapsular algoritmos que terminan con la instanciación de un objeto a partir, muchas veces, de parámetros que no conocemos hasta el momento de la ejecución.

Como acabamos de ver, las factorías suelen permitirnos solicitar la creación de tipos de objetos en base a algún dato que les proporcionamos.

Pero ahora detengámonos en otro problema. Supongamos la siguiente clase `PostalAddress`, que define un Value Object:

```php
class PostalAddress {
    /** @var string */
    private $street;
    /** @var string */
    private $streetNumber;
    /** @var string */
    private $stairs;
    /** @var string */
    private $floor;
    /** @var string */
    private $door;
    /** @var string */
    private $postalCode;
    /** @var string */
    private $city;
    /** @var string */
    private $province;

    /**
     * PostalAddress constructor.
     * @param string $street
     * @param string $streetNumber
     * @param string $stairs
     * @param string $floor
     * @param string $door
     * @param string $postalCode
     * @param string $city
     * @param string $province
     */
    public function __construct(
        string $street,
        string $streetNumber,
        string $stairs,
        string $floor,
        string $door,
        string $postalCode,
        string $city,
        string $province
    ) {
        $this->street = $street;
        $this->streetNumber = $streetNumber;
        $this->stairs = $stairs;
        $this->floor = $floor;
        $this->door = $door;
        $this->postalCode = $postalCode;
        $this->city = $city;
        $this->province = $province;
    }

    /**
     * @return string
     */
    public function street(): string
    {
        return $this->street;
    }

    /**
     * @return string
     */
    public function streetNumber(): string
    {
        return $this->streetNumber;
    }

    /**
     * @return string
     */
    public function stairs(): string
    {
        return $this->stairs;
    }

    /**
     * @return string
     */
    public function floor(): string
    {
        return $this->floor;
    }

    /**
     * @return string
     */
    public function door(): string
    {
        return $this->door;
    }

    /**
     * @return string
     */
    public function postalCode(): string
    {
        return $this->postalCode;
    }

    /**
     * @return string
     */
    public function city(): string
    {
        return $this->city;
    }

    /**
     * @return string
     */
    public function province(): string
    {
        return $this->province;
    }

}
```

No es que sea un objeto especialmente complicado, pero tiene nada más y nada menos que ocho parámetros. Es perfectamente posible instanciar uno de estos mediante `new`, pero es realmente incómodo hacerlo y muy fácil equivocarse en el orden en que deben añadirse los diferentes elementos.

También sabemos que algunos de los datos van asociados entre sí. Por ejemplo, la calle y el número de portal suelen ir juntos, o el código postal, la ciudad y la provincia. Por otro lado, puede haber direcciones con calle y sin número, pero no direcciones sin calle y con número.

Lo primero que nos pide el cuerpo es crear `setters` de forma que podamos construir el objeto de una manera más significativa. Pero si creamos `setters`, tenemos que eliminar parámetros del constructor, hasta el punto incluso de suprimirlos todos.

¡Ah! Pero eso nos lleva a problemas aún más gordos, inmediatamente estaríamos creando objetos inconsistentes de cuyo estado nunca podríamos tener seguridad y revelando su estructura.

La solución, como no podía ser menos, es un patrón. Y este patrón es Builder.

## Construyendo un builder para nuestro objeto

La idea del Builder es tener un objeto que se ocupe de construir objetos, valga la redundancia, que por uno u otro motivo son difíciles de montar, recopilando primero toda la información necesaria y devolviendo el objeto construido.

En nuestro ejemplo de `PostalAddress` nuestros problemas eran:

* Tenemos ocho parámetros, con lo que es fácil meter la pata, cambiar el orden, etc.
* Algunos parámetros tienden a estar juntos: por ejemplo, la calle y el número de portal.
* Algunos parámetros deben seguir ciertas reglas: la calle siempre tiene que estar presente, pero son posibles direcciones sin número de portal.
* Piso, puerta y escalera son opcionales, pero con frecuencia van asociados. Así, puerta no tiene sentido sin piso.
* Habitualmente, localidad, código postal y provincia van juntos y no debería faltar ninguno de ellos.

Aparte de eso:

* Algunos parámetros podrían obtenerse a partir de otros. Por ejemplo, a partir de la población, es posible obtener la provincia y el código postal también, si tenemos en cuenta la calle y el número de portal.

Por tanto, una clase `PostalAddressBuilder` debería encapsular estas reglas. Nos gustaría poder usarlo así:

```php
$builder = new PostalAddressBuilder();

$builder->withAddress($street, $number, $floor, $door);
$builder->atLocality($postalCode, $city, $province);

$address = $builder->build();
```

O así:

```php
$builder = new PostalAddressBuilder();

$builder->withApartmentAddress($street, $number, $stairs, $floor, $door);
$builder->atLocality($postalCode, $city, $province);

$address = $builder->build();
```

O así:

```php
$builder = new PostalAddressBuilder();

$builder->withHouseAddress($street, $number);
$builder->at($city);

$address = $builder->build();
```

Es decir, tendríamos diferentes interfaces más semánticas con las que construir nuestros objetos PostalAddress, incluso teniendo datos parciales de modo que el Builder sea capaz de obtenerlos, deducirlos o proporcionar valores por defecto adecuados.

## Un builder paso a paso

En principio, el builder se parece un poco al objeto que construye. Para empezar, tiene propiedades que mapeen las propiedades de aquel:

```php
class PostalAddressBuilder
{
    /** @var string */
    private $street;
    /** @var string */
    private $streetNumber;
    /** @var string */
    private $stairs;
    /** @var string */
    private $floor;
    /** @var string */
    private $door;
    /** @var string */
    private $postalCode;
    /** @var string */
    private $city;
    /** @var string */
    private $province;
}
```

`PostalAddressBuilder` podría iniciar o no en el constructor algunas de estas propiedades a  valores por defecto que puedan ser útiles.

Aparte de eso, puede tener dependencias. Imagina que tenemos un `PostalCodeService` en alguna parte, que nos proporcione información a partir de una localidad.

```php
class PostalAddressBuilder
{
    /** @var string */
    private $street;
    /** @var string */
    private $streetNumber;
    /** @var string */
    private $stairs;
    /** @var string */
    private $floor;
    /** @var string */
    private $door;
    /** @var string */
    private $postalCode;
    /** @var string */
    private $city;
    /** @var string */
    private $province;
    /** @var PostalCodeService */
    private $postalCodeService;

    public function __construct(PostalCodeService $postalCodeService)
    {
        $this->street = '';
        $this->streetNumber = '';
        $this->stairs = '';
        $this->floor = '';
        $this->door = '';
        $this->postalCode = '';
        $this->city = '';
        $this->province = '';
        $this->postalCodeService = $postalCodeService;
    }
}
```

Bien, la función principal de PostalAddressBuilder es proporcionarnos objetos `PostalAddress` correctamente montados, así que necesitamos que tenga un método (`build`) que nos lo haga. Obviamente, crearemos este objeto `PostalAddress` con los valores que tenga el builder, y con eso satisfacemos nuestro primer requisito:

```php
class PostalAddressBuilder
{
    /** @var string */
    private $street;
    /** @var string */
    private $streetNumber;
    /** @var string */
    private $stairs;
    /** @var string */
    private $floor;
    /** @var string */
    private $door;
    /** @var string */
    private $postalCode;
    /** @var string */
    private $city;
    /** @var string */
    private $province;
    /** @var PostalCodeService */
    private $postalCodeService;

    public function __construct(PostalCodeService $postalCodeService)
    {
        $this->street = '';
        $this->streetNumber = '';
        $this->stairs = '';
        $this->floor = '';
        $this->door = '';
        $this->postalCode = '';
        $this->city = '';
        $this->province = '';
        $this->postalCodeService = $postalCodeService;
    }

    public function build(): PostalAddress
    {
        return new PostalAddress(
            $this->street,
            $this->streetNumber,
            $this->stairs,
            $this->floor,
            $this->door,
            $this->postalCode,
            $this->city,
            $this->province
        );
    }
}
```

Obviamente el resultado de momento no es del todo satisfactorio, si lo invocamos, el método `build` nos devolverá un objeto `PostalAddress` con todos sus valores vacíos.

```php
$builder = new PostalAddressBuilder($postalCodeService);

$address = $builder->build();
```

Nos hacen falta métodos que nos permitan introducir esos valores. Por ejemplo y para empezar:

```php
class PostalAddressBuilder
{
    /** @var string */
    private $street;
    /** @var string */
    private $streetNumber;
    /** @var string */
    private $stairs;
    /** @var string */
    private $floor;
    /** @var string */
    private $door;
    /** @var string */
    private $postalCode;
    /** @var string */
    private $city;
    /** @var string */
    private $province;
    /** @var PostalCodeService */
    private $postalCodeService;

    public function __construct(PostalCodeService $postalCodeService)
    {
        $this->street = '';
        $this->streetNumber = '';
        $this->stairs = '';
        $this->floor = '';
        $this->door = '';
        $this->postalCode = '';
        $this->city = '';
        $this->province = '';
        $this->postalCodeService = $postalCodeService;
    }

    public function build(): PostalAddress
    {
        return new PostalAddress(
            $this->street,
            $this->streetNumber,
            $this->stairs,
            $this->floor,
            $this->door,
            $this->postalCode,
            $this->city,
            $this->province
        );
    }

    public function withAddress(
        string $street,
        ?string $streetNumber,
        ?string $floor,
        ?string $door = null
    ): void {
        $this->street = $street;
        $this->streetNumber = $streetNumber;
        $this->floor = $floor;
        $this->door = $door;
    }

    public function atLocality(
        string $postalCode,
        string $city,
        string $province
    ): void {
        $this->postalCode = $postalCode;
        $this->city = $city;
        $this->province = $province;
    }
}
```

Las signaturas de estos métodos nos revelan qué parámetros van juntos y cuáles son obligatorios o no.

Lo cierto es que podemos crear todos los métodos que nos parezcan útiles para definir un protocolo de construcción de este tipo de objetos que sea útil para nuestros casos de uso particulares.

Fíjate que si bien nuestro objeto `PostalAddress` no debe tener `setters` para poder ser inmutable, nuestro `PostalAddressBuilder`, por el contrario, no tiene más que un `getter` (`build`) que justamente devuelve el objeto construido y los demás métodos vienen siendo `setters` con cierto valor semántico.

Creo que viendo el código queda bastante claro cómo funcionan los métodos del Builder, por lo que no voy a incluir todas las implementaciones posibles. En todo caso, como orientación, dejo las siguientes pistas:

* Nada impide que pongamos un método para cada parámetro que necesite nuestro objeto, aunque, por lo general, los métodos deberían tener algún tipo de significado.
* Idealmente, el objeto debería tener algún tipo de autovalidación, aunque creo que también podría incluirse alguna en el builder, particularmente cuando necesitamos aportar varios parámetros que van juntos y que, de alguna manera, dependen unos de otros.

## Un builder inteligente

Los builder podrían tener dependencias de servicios que puedan hacerse cargo de alguna tarea. 

En nuestro ejemplo, nos vendría bien que PostalAddressBuilder pueda construir un objeto PostalAddress válido simplemente pasándole la localidad ya que, con este dato y la calle podría obtener tanto la provincia como el código postal, ahorrándonos que el usuario tenga que proporcionarlo e incluso evitando errores.

Así que voy a ejemplificar ese caso, añadiendo un método `at`:

```php
class PostalAddressBuilder
{
    /** @var string */
    private $street;
    /** @var string */
    private $streetNumber;
    /** @var string */
    private $stairs;
    /** @var string */
    private $floor;
    /** @var string */
    private $door;
    /** @var string */
    private $postalCode;
    /** @var string */
    private $city;
    /** @var string */
    private $province;
    /** @var PostalCodeService */
    private $postalCodeService;

    public function __construct(PostalCodeService $postalCodeService)
    {
        $this->street = '';
        $this->streetNumber = '';
        $this->stairs = '';
        $this->floor = '';
        $this->door = '';
        $this->postalCode = '';
        $this->city = '';
        $this->province = '';
        $this->postalCodeService = $postalCodeService;
    }

    public function build(): PostalAddress
    {
        return new PostalAddress(
            $this->street,
            $this->streetNumber,
            $this->stairs,
            $this->floor,
            $this->door,
            $this->postalCode,
            $this->city,
            $this->province
        );
    }

    public function withAddress(
        string $street,
        ?string $streetNumber,
        ?string $floor,
        ?string $door = null
    ): void {
        $this->street = $street;
        $this->streetNumber = $streetNumber;
        $this->floor = $floor;
        $this->door = $door;
    }

    public function atLocality(
        string $postalCode,
        string $city,
        string $province
    ): void {
        $this->postalCode = $postalCode;
        $this->city = $city;
        $this->province = $province;
    }

    public function at(string $city): void
    {
        try {
            $postalCodeRequest = new PostalCodeRequest($city, $this->street, $this->streetNumber);
            $response = $this->postalCodeService->find($postalCodeRequest);
            $this->atLocality(
                $response->postalCode,
                $response->city,
                $response->province
            );
        } catch (Exception $exception) {
            throw new CityNotFoundException(sprintf('City %s could not be found', $city));
        }
    }
}
```

Al método `at` le pasamos una localidad y se ocupa de buscar la información utilizando la dependencia `PostalCodeService`. De este modo, el objeto PostalAddress no tiene que cargar este tipo de dependencias que sólo necesitaría en el momento de la construcción.

## Fluent interface

Una adición interesante, aunque no obligatoria, para los builders es que ofrezcan una interfaz fluida.

La interfaz fluida consiste en que los métodos devuelven el propio objeto builder, de modo que podemos encadenar llamadas y montar una expresión bastante elegante que devuelve el objeto deseado:

```php
$builder = new PostalAddressBuilder();

$address = $builder
	->withHouseAddress($street, $number)
	->at($city)
	->build();
```

Esta expresión no sólo es más compacta, sino que expresa bien el flujo de creación del objeto y lo presenta de una manera unitaria.

Para ello, tenemos que hacer que nuestros métodos `setter` devuelvan la propia instancia del builder y cambiar el return type por self:

```php
class PostalAddressBuilder
{
    /** @var string */
    private $street;
    /** @var string */
    private $streetNumber;
    /** @var string */
    private $stairs;
    /** @var string */
    private $floor;
    /** @var string */
    private $door;
    /** @var string */
    private $postalCode;
    /** @var string */
    private $city;
    /** @var string */
    private $province;
    /** @var PostalCodeService */
    private $postalCodeService;

    public function __construct(PostalCodeService $postalCodeService)
    {
        $this->street = '';
        $this->streetNumber = '';
        $this->stairs = '';
        $this->floor = '';
        $this->door = '';
        $this->postalCode = '';
        $this->city = '';
        $this->province = '';
        $this->postalCodeService = $postalCodeService;
    }

    public function build(): PostalAddress
    {
        return new PostalAddress(
            $this->street,
            $this->streetNumber,
            $this->stairs,
            $this->floor,
            $this->door,
            $this->postalCode,
            $this->city,
            $this->province
        );
    }

    public function withAddress(
        string $street,
        ?string $streetNumber,
        ?string $floor,
        ?string $door = null
    ): self {
        $this->street = $street;
        $this->streetNumber = $streetNumber;
        $this->floor = $floor;
        $this->door = $door;
        
        return $this;
    }

    public function atLocality(
        string $postalCode,
        string $city,
        string $province
    ): self {
        $this->postalCode = $postalCode;
        $this->city = $city;
        $this->province = $province;

        return $this;
    }

    public function at(string $city): self
    {
        try {
            $postalCodeRequest = new PostalCodeRequest($city, $this->street, $this->streetNumber);
            $response = $this->postalCodeService->find($postalCodeRequest);
            return $this->atLocality(
                $response->postalCode,
                $response->city,
                $response->province
            );
        } catch (Exception $exception) {
            throw new CityNotFoundException(sprintf('City %s could not be found', $city));
        }
    }
}
```

## ¿Se puede construir?

Un elemento que nos faltaría es el siguiente: cuando invocamos el método build es posible que no tengamos toda la información necesaria, por lo que podríamos necesitar algo que compruebe y valide esta situación.

Una opción, quizá la mejor, es que PostalAddress incluya su propia validación para garantizar que, independientemente del método concreto de construcción, a través del builder o por construcción directa, siempre podamos tener objetos `PostalAddress` consistentes.

De este modo, el objeto lanzaría una excepción si no se puede construir como es debido. En ese caso, podemos capturarla y relanzarla.

El método quedaría así, más o menos:

```php
class PostalAddressBuilder
{
    /** @var string */
    private $street;
    /** @var string */
    private $streetNumber;
    /** @var string */
    private $stairs;
    /** @var string */
    private $floor;
    /** @var string */
    private $door;
    /** @var string */
    private $postalCode;
    /** @var string */
    private $city;
    /** @var string */
    private $province;
    /** @var PostalCodeService */
    private $postalCodeService;

    public function __construct(PostalCodeService $postalCodeService)
    {
        $this->street = '';
        $this->streetNumber = '';
        $this->stairs = '';
        $this->floor = '';
        $this->door = '';
        $this->postalCode = '';
        $this->city = '';
        $this->province = '';
        $this->postalCodeService = $postalCodeService;
    }

    public function build(): PostalAddress
    {
        try {
            return new PostalAddress(
                $this->street,
                $this->streetNumber,
                $this->stairs,
                $this->floor,
                $this->door,
                $this->postalCode,
                $this->city,
                $this->province
            );
        } catch (Exception $exception) {
            throw new InvalidArgumentException('It was impossible to create a PostalAddress', 1, $exception);
        }
    }

    public function withAddress(
        string $street,
        ?string $streetNumber,
        ?string $floor,
        ?string $door = null
    ): self {
        $this->street = $street;
        $this->streetNumber = $streetNumber;
        $this->floor = $floor;
        $this->door = $door;

        return $this;
    }

    public function atLocality(
        string $postalCode,
        string $city,
        string $province
    ): self {
        $this->postalCode = $postalCode;
        $this->city = $city;
        $this->province = $province;

        return $this;
    }

    public function at(string $city): self
    {
        try {
            $postalCodeRequest = new PostalCodeRequest($city, $this->street, $this->streetNumber);
            $response = $this->postalCodeService->find($postalCodeRequest);
            return $this->atLocality(
                $response->postalCode,
                $response->city,
                $response->province
            );
        } catch (Exception $exception) {
            throw new CityNotFoundException(sprintf('City %s could not be found', $city));
        }
    }
}
```

## Rematando

El patrón Builder nos permite construir objetos complejos definiendo una interfaz de construcción conveniente a la vez que protegemos su consistencia en el proceso.

Builder es un patrón que se utiliza en muchas situaciones, particularmente en la construcción de objetos Query, ya que nos permite definir un cierto lenguaje. Un buen ejemplo es el QueryBuilder de Doctrine.

También es un buen aliado para construir test doubles, algo de lo que hablaremos en otra ocasión.
