---
layout: post
title: Representation pattern
categories: articles
tags: php design-patterns
---

O cómo resolver el problema de mover información entre las capas de una aplicación sin violar las leyes de dependencia ni exponer el dominio en infraestructura.

Hace cosa de tres años publiqué un artículo sobre el [Presenter pattern](/presenter-pattern/), una forma de intentar resolver este problema. Como era de esperar, hoy por hoy lo plantearía todo de una manera un distinta.

## Entendiendo el problema

La situación más común sería la siguiente: desde un punto de entrada a la aplicación (un controlador, un comando de consola u otro) se invoca un caso de uso que devuelve una respuesta.

El caso de uso normalmente sigue el patrón Command, posiblemente Command/Handler para poder usar un bus de mensajes, de modo que los parámetros van encapsulados en el Command y el Handler, si toca, devuelve una respuesta.

```php
    public function byId(Request $request): Response
    {
        try {
            $hotelId = $request->get('hotelId');
            $getHotelById = new GetHotelById($hotelId);

            $response = $this->dispatch($getHotelById);

            return new JsonResponse(
                ['hotel' => $response],
                Response::HTTP_OK
            );
        } catch (HotelNotFoundException $notFoundException) {
            return new JsonResponse(
                [
                    'error' => $notFoundException->getMessage()
                ],
                Response::HTTP_NOT_FOUND
            );
        } catch (Throwable $anyOtherException) {
            return new JsonResponse(
                [
                    'error' => $anyOtherException->getMessage()
                ], Response::HTTP_INTERNAL_SERVER_ERROR
            );
        }
    }
```


El problema surge cuando consideramos qué tipo de respuesta debería devolver el Handler, teniendo en cuenta que este debería ser agnóstico respecto a la instancia que haya realizado la petición. Por ejemplo:

* Un controlador de un endpoint de una API podría requerir una respuesta que luego será serializada como JSON, que es lo que ocurre en el ejemplo anterior.
* Otro controlador podría requerir la misma respuesta, pero solo con algunos campo, y luego serializarla.
* Un comando de consola podría querer usar ese mismo caso de uso pero para generar una versión en YAML, con todos los campos o una selección de ellos.
* O igualmente podría necesitar un CSV, porque tiene que haber de todo…

Es decir, el caso de uso está en la capa de aplicación y no podemos construirlo pensando en cómo va a ser usado desde la capa de infraestructura. De hecho, el caso de uso creará objetos de dominio a partir de los datos brutos y trabajará con ellos.

Pero tampoco queremos tener objetos de dominio en un controlador o en un comando de consola, a la vez que necesitamos que esta capa pueda decidir qué información quiere recibir y en qué forma.

## DTO

La naturaleza de un Data Transfer Object es mover información entre sistemas. Es decir, son objetos sin comportamiento cuya función es ser contenedores de datos que representarán objetos en el sistema. En ese sentido podrían servirnos desde arrays o hashes a objetos con solo propiedades públicas, y que son fácilmente serializables para transmitir vía red, por ejemplo.

```php
class HotelRepresentation
{
    public string $id;
    public string $name;
    public string $address;
    public string $coordinates;
    public int $roomCount;
    public array $rooms;
    public int $booked;
}
```

El DTO es un objeto del lenguaje en que está escrita la aplicación que representa el contrato de datos entre sistemas, datos que se representarían en el tipo más sencillo posible. Serán tipos básicos o escalares, en general, pero no habría ningún problema en hacer que todos fuesen `string`, excepto aquellos casos en que necesitemos `arrays`.

Extendiendo la idea, podríamos mover datos entre las capas de una aplicación usando DTO, pero esa es solo una parte del problema.

Me explico: Supongamos un endpoint que devuelve un payload JSON. El controlador recibe del caso de uso un DTO que contiene datos en tipos escalares (string, int, float...) y solo tiene que serializarlo, posiblemente con una herramienta estándar provista por el propio lenguaje. Esto no debería tener mayor complicación, es bastante trivial.

En nuestro ejemplo, basta pasar el DTO para crear una JsonReponse (Symfony):

```php
return new JsonResponse(
    ['hotel' => $response],
    Response::HTTP_OK
);
```

La parte complicada es cómo se obtiene ese DTO. Recordemos, el `Use Case` obtendrá posiblemente agregados, entidades de dominio o value objects y lo que queremos es una representación que no los incluya. Esto es equivalente a preguntarse: *¿cómo serializo un objeto de dominio?*. Y, en particular, cómo *obtener distintas representaciones*.

De hecho, nuestra respuesta en este artículo es la siguiente: no serializamos los objetos de dominio, sino que obtenemos una representación que luego podemos serializar de manera trivial.

Esta representación será un objeto del lenguaje. Puede ser un DTO puro, con propiedades públicas que solo se utilizará para cruzar esa frontera entre capas, o puede ser un objeto algo más rico que nos ofrezca otras posibilidades más.

## Entendiendo el problema

A decir verdad, el problema no está en usar DTO, sino en cómo se gestiona su creación y quién la dirige. En este punto necesitaremos hablar de Strategy y de Visitor y entender que un patrón de diseño no es un tipo de objeto un otro, sino un esquema de situación que nos permite entender y solucionar un problema.

Intentaré explicarlo por partes:

### El consumidor puede decidir cómo quiere recibir los datos

Desde el punto de visto de la instancia usuaria del caso de uso (por ejemplo, un controlador), lo que espera es obtener una cierta implementación de la respuesta. Para esta instancia usuaria, el caso de uso es una caja negra a la que pide datos.

Idealmente esta usuaria debería poder decir qué representación de los datos necesita. Pero, aparentemente, esto viola la ley de dependencia, que dice que la capa de aplicación (caso de uso) no puede depender de la de infraestructura (controlador). Aquí es donde entra el patrón *Strategy* que literalmente representa ese problema: que el consumidor de un servicio pueda decidir qué algoritmo ha de usar ese servicio.

Esto en la práctica significa que el objeto devuelto por el caso de uso no debería ser instanciado por él, limitándose a rellenarlo con datos.

¿Quién se encargaría de la instanciación entonces? Pues, o bien la usuaria, o bien una factoría a partir de la petición de la usuaria.

Es decir, entre los datos de la petición (el Command) se incluiría la estrategia que indica qué representación de los datos se solicita. 

```php
class GetHotelById
{
    private string $hotelId;
    private HotelRepresentation $representation;

    public function __construct(string $hotelId, HotelRepresentation $representation)
    {
        $this->hotelId = $hotelId;
        $this->representation = $representation;
    }

    public function hotelId(): string
    {
        return $this->hotelId;
    }

    public function representation(): HotelRepresentation
    {
        return $this->HotelRepresentation;
    }
}
```

El Handler se ocuparía de rellenar la representación a partir de las entidades, pero esto nos va a suponer un problema al que volveremos dentro de un rato.

```php
<?php
declare (strict_types=1);

namespace App\Application\GetHotelById;

use App\Domain\Hotel\HotelId;
use App\Domain\Hotel\HotelRepository;

class GetHotelByIdHandler
{
    private HotelRepository $hotelRepository;
    
    public function __construct(
        HotelRepository $hotelRepository
    ) {
        $this->hotelRepository = $hotelRepository;
    }

    public function __invoke(GetHotelById $getHotelById)
    {
        $hotelId = HotelId::fromRaw($getHotelById->hotelId());
        $hotel = $this->hotelRepository->retrieve($hotelId);

        return $hotel->representedAs($getHotelById->representation());
    }
}
```

### Las representaciones posibles son intercambiables

Para que las representaciones posibles sean intercambiables tienen que satisfacer una interfaz, sea esta implícita o explícita. Para el Handler la representación concreta tiene que ser indiferente, de modo que no tenga que saber el tipo específico.

Si la interfaz es explícita la podemos definir en la capa de dominio, de modo que invertimos la dependencia y las representaciones concretas se definen en la capa de infraestructura.

Esto se relaciona con el problema de poblar la representación. La interfaz nos debería proporcionar métodos para setear los valores necesarios. Aquí se nos presentan varias posibilidades.

**Un DTO con propiedades públicas** en PHP expone implícitamente una interfaz, aunque no sea muy rigurosa, pero implica que todas las representaciones posibles contienen esos mismos campos y el Handler *tiene que saber* qué campos son esos.

Por ejemplo, supongamos que necesitamos dos representaciones de un objeto de dominio Hotel, una de ellas contiene todos sus detalles, incluyendo las habitaciones, y otra solo la información básica y de ubicación.

```php
class HotelRepresentation
{
    public string $id;
    public string $name;
    public string $address;
    public string $coordinates;
    public int $roomCount;
    public array $rooms;
    public int $booked;
}

class HotelFullRepresentation
{
    public string $id;
    public string $name;
    public string $address;
    public string $coordinates;
    public int $roomCount;
    public array $rooms;
    public int $booked;
}
```

El problema, como se puede ver es que la interfaz implícita nos obliga a tener exactamente los mismos campos en todas las representaciones.

**La representación expone setters**. La interfaz expondría varios métodos *setters* para recibir los datos de los objetos de dominio. Nos plantea un poco los mismos problemas porque los setters desvelan la estructura.

Si en lugar de exponer directamente las propiedades usamos métodos *setter*, podemos evitar el problema anterior.

```php
interface HotelRepresentationInterface
{
    public function setId(string $id): void;

    public function setName(string $name): void;

    public function setAddress(string $address): void;

    public function setCoordinates(string $coordinates): void;

    public function setRoomCount(int $roomCount): void;

    public function setRooms(array $rooms): void;

    public function setBooked(int $booked): void;
}
```

Ahora, podemos hacer que en cada representación la estructura sea diferente:

```php
class HotelRepresentation implements HotelRepresentationInterface
{
    private string $id;
    private string $name;
    private string $address;
    private string $coordinates;

    public function setId(string $id): void
    {
        $this->id = $id;
    }

    public function setName(string $name): void
    {
        $this->name = $name;
    }

    public function setAddress(string $address): void
    {
        $this->address = $address;
    }

    public function setCoordinates(string $coordinates): void
    {
        $this->coordinates = $coordinates;
    }

    public function setRoomCount(int $roomCount): void
    {
    }

    public function setRooms(array $rooms): void
    {
    }

    public function setBooked(int $booked): void
    {
    }
}
```

Y aquí la representación completa:

```php
class HotelFullRepresentation implements HotelRepresentationInterface
{
    private string $id;
    private string $name;
    private string $address;
    private string $coordinates;
    private int $roomCount;
    private array $rooms;
    private int $booked;

    public function setId(string $id): void
    {
        $this->id = $id;
    }

    public function setName(string $name): void
    {
        $this->name = $name;
    }

    public function setAddress(string $address): void
    {
        $this->address = $address;
    }

    public function setCoordinates(string $coordinates): void
    {
        $this->coordinates = $coordinates;
    }

    public function setRoomCount(int $roomCount): void
    {
        $this->roomCount = $roomCount;
    }

    public function setRooms(array $rooms): void
    {
        $this->rooms = $rooms;
    }

    public function setBooked(int $booked): void
    {
        $this->booked = $booked;
    }
}
```

**La representación expone un único setter**. En este caso, la interfaz admite un objeto de dominio en el que está interesada particularmente y la asignación está encapsulada en este método. Este es más o menos el modelo que exponíamos en el artículo sobre el [Presenter pattern](/presenter-pattern/).

Veamos los problemas que supone cada una de las variantes.

### No condicionamos el diseño de los objetos de dominio

El problema radica en cómo obtenemos los datos de los objetos de dominio. Para crear una representación de los objetos de dominio estamos interesados en sus propiedades por lo que necesitaríamos *getters*.

Este sería un ejemplo de esa situación, la entidad `Hotel` estaría obligada a proporcionar acceso a todas sus propiedades:

```php
$representation->id = (string)$hotel->id();
$representation->name = $hotel->name();
$representation->address = (string)$hotel->address();
$representation->coordinates = (string)$hotel->coordinates();
$representation->roomCount = $hotel->totalRooms();
$representation->booked = $hotel->bookedRooms();
/** @var Room $room */
foreach ($hotel->rooms() as $room) {
    $roomDto = new RoomDto();
    $roomDto->id = (string)$room->id();
    $roomDto->beds = $room->beds();
    $roomDto->booked = $room->isBooked();

    $representation->rooms[] = $roomDto;
}
return $representation;
```

Sin embargo, en un buen diseño de la capa de dominio, los métodos de los objetos de dominio exponen comportamiento, no estructura. Y, por otro lado, no debemos añadir métodos en los objetos de dominio simplemente porque necesitamos *leer* las propiedades privadas.

O sea: queremos acceder a las propiedades privadas de un objeto sin exponerlas, una contradicción que nos puede ayudar a resolver una versión simple del patrón *Visitor*.

La idea es que el objeto de dominio exponga un método que acepte un objeto Representation. Al estar dentro de un método del objeto de dominio podemos acceder a sus propiedades o métodos privados y no necesitamos alterar la interfaz pública para ello, salvo por este método que podría llamarse `representedAs`.

Veamos el ejemplo:

```php
public function representedAs(HotelRepresentationInterface $representation)
{
    $representation->setId((string)$this->hotelId);
    $representation->setName($this->name);
    $representation->setAddress((string)$this->address);
    $representation->setCoordinates((string)$this->coordinates);
    $representation->setRoomCount($this->totalRooms());
    $representation->setBooked($this->bookedRooms());
    
    $rooms = array_map(
        static function (Room $room) {
            $roomRepresentation = new RoomRepresentation();
            $roomRepresentation->setId((string)$room->id());
            $roomRepresentation->setBeds($room->beds());
            $roomRepresentation->setIsBooked($room->isBooked());
        return $roomRepresentation;
    }, $this->rooms);
    
    $representation->setRooms($rooms);
    return $representation;
}
```

Con todo, seguimos teniendo el problema de decidir cómo vamos a setear los campos de la representación. Y en este sentido las versiones DTO con propiedades públicas o con setters son igualmente válidas, pero ya hemos visto que la ventaja de los setters es permitirnos tener representaciones con propiedades distintas que darán lugar a serializaciones distintas.

La tercera opción, un método que admita un objeto de dominio y pueble la representación, sigue teniendo el problema de que necesitaríamos acceso a las propiedades privadas del objeto de dominio.

## La entrega de la *carga*

El objeto representación podría tener que darnos acceso a su contenido, bien exponiendo sus propiedades o bien a través de métodos que nos proporcionen la representación serializada o lista para serializar, si no se trata de un DTO puro. Pero esta ya es una cuestión que depende más del consumidor, desde el punto de vista del domino la interfaz nos dice cómo poblar la representación y al dominio no le importa lo que se haga con esos datos.

En general, el objeto Representation se centra más en los datos que tiene que portar, dejando en manos de su consumidor cómo usarlos o transformarlos si es el caso. Sin embargo, no se tiene por qué descartar que la representación pueda entregar una versión particular. 

Pero esta capacidad no forma parte de su interfaz como Representation, que se limita a la obtención de los datos.

## Alternativas: mapeadores

Una alternativa son los mapeadores, que serían objetos mediadores capaces de extraer datos del objeto de dominio y generar una representación. Los mapeadores plantean los mismos problema que señalábamos antes y seguramente necesitaremos usar un patrón Visitor con el que dar acceso al mapeador a los datos del objeto de dominio sin exponer su estructura.

```php
class GetHotelByIdHandler
{
    private HotelRepository $hotelRepository;
    /**
     * @var HotelMapper
     */
    private HotelMapper $hotelMapper;

    public function __construct(
        HotelRepository $hotelRepository,
        HotelMapper $hotelMapper
    ) {
        $this->hotelRepository = $hotelRepository;
        $this->hotelMapper = $hotelMapper;
    }

    public function __invoke(GetHotelById $getHotelById)
    {
        $hotelId = HotelId::fromRaw($getHotelById->hotelId());
        $hotel = $this->hotelRepository->retrieve($hotelId);

        return $this->hotelMapper->toRepresentation($hotel);
    }
}
```

Otra opción es usar automapeadores que utilicen reflection para acceder a las propiedades privadas de los objetos de dominio. Personalmente es una opción que evito cada vez más. No solo la configuración se complica, sino que suelen ser librerías pesadas, que intentan abarcar una infinidad de casos posibles y pueden recurrir a un montón de automagia y configuración.


