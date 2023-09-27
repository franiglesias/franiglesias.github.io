---
layout: post
title: Los tests mentirosos
categories: articles
tags: testing good-practices
---

Hacerse trampas al solitario para conseguir una _vanity metric_: la cobertura de tests.

Existen varias maneras de conseguir tener una cobertura de tests cercana al 100%. Por ejemplo, mediante TDD, ya que todo el código que añades responde a un test que, de alguna forma, reclama su existencia.

Otra forma bastante efectiva es utilizar una librería como [Approvals Test y test combinatorios](https://approvaltests.com), con lo que puedes conseguirlo también en un código que ya esté escrito.

Y también puedes escribir tests que mientan.

## Un ejemplo con reservas

Imaginémonos trabajando en un sistema para reservar habitaciones en hoteles. Por lo general, estos sistemas solicitan una serie de datos a las usuarias: las fechas de entrada y salida y el número de personas que se alojarán, distinguiendo personas adultas y niñas, ya que estas últimas suelen tener un precio reducido.

Con estos datos, el servicio de disponibilidad localiza todas las habitaciones capaces de responder a la solicitud: que estén libres en esas fechas y que tengan capacidad para permitir alojarse a todo el grupo. Para este ejercicio vamos a suponer que únicamente se quiere reservar una habitación.

El sistema entonces devuelve una lista con los tipos de habitaciones disponibles y el precio total de la estancia en cada una de ellas, de modo que la usuaria pueda escoger la que mejor le parezca. Por supuesto, lo normal es que se muestren los precios desglosados, extra por desayuno y algún otro servicio, etc. De nuevo, no lo vamos a considerar para este ejercicio para simplificar.

El código al que nos vamos a referir en este artículo, es justamente el que genera todas estas propuestas de precios a partir de las habitaciones disponibles. Lo puedes ver en [este repositorio de GitHub](https://github.com/franiglesias/talkingbit/tree/master/src/Hotel).

## Un test que miente como un bellaco

Considera el siguiente test:

```php
final class CalculatePriceProposalTest extends TestCase
{
    /** @test
     */
    public function shouldCalculateAllProposals(): void
    {
        $booking = new BookingRequest(
            'bookingId',
            'hotelId',
            '2024-09-18',
            '2024-09-22',
            random_int(1, 3),
            random_int(0, 2),
        );

        $availableRooms = new AvailableRooms();
        $availableRooms->addRoom('standard', 105.00);
        $availableRooms->addRoom('superior', 135.00);

        $bookingRepository = $this->createMock(BookingRepository::class);
        $availability = $this->createMock(Availability::class);

        $bookingRepository
            ->expects(self::atLeastOnce())
            ->method('byBookingId')
            ->willReturn($booking);
        $availability
            ->expects(self::atLeastOnce())
            ->method('byHotelIdAndDates')
            ->willReturn($availableRooms);

        $calculateProposal = new CalculatePriceProposal(
            $bookingRepository,
            $availability
        );

        $request = new CalculateProposalRequest('bookingId');
        $calculateProposal->forBooking($request);
    }
}
```

Parece razonable, ¿no? Pues con este test he conseguido una cobertura del 98% de líneas y 100% de archivos. Una maravilla. Puedo desplegar con toda la tranquilidad del mundo.

Pues no. Este test no me garantiza nada. Es más, puedo alterar datos y algoritmos críticos y el test no se enterará de nada.

## Los tests deben verificar comportamiento

Todo test debería verificar algún aspecto del comportamiento. Este ejemplo nos muestra un test que no lo hace.

Fíjate bien. Se supone que este test se encarga de verificar que se generan correctamente las propuestas de precios para una solicitud de reserva. El comportamiento esperado de este servicio o caso de uso es:

* Recuperar la solicitud de reserva
* Obtener las habitaciones disponibles en el hotel y en las fechas indicadas.
* Generar una propuesta por cada tipo de habitación disponible, calculando el precio final por la totalidad de la estancia.

Es decir, deberíamos saber si:

* Se generan tantas propuestas como tipos de habitaciones disponibles.
* Los precios han sido calculados para la totalidad de la estancia, teniendo en cuenta el número de noches, adultos y niños.

En ningún lugar del test se comprueba nada de esto. Se puede apreciar porque no tenemos ningún tipo de aserción o verificación sobre el output de la unidad bajo test.

Varias librerías de tests permiten que un test pase sin verificar de forma explícita una aserción. En PHPUnit, por defecto, debe haber alguna aserción, pero este ejemplo se ejecuta sin problemas gracias a los dos mocks que se han definido. Volveremos a este punto dentro de un momento.

Vamos a revisar todas las cosas que este test hace mal.

## Los tests deben poder fallar

Cuando decimos que un test debe poder fallar queremos indicar que cualquier cambio que afecte al comportamiento de la unidad bajo test debería hacerlo fallar. Por otro lado, si es un cambio en la implementación, entonces el test debería seguir pasando.

Puesto que tenemos mocks podemos sospechar que esto último podría no cumplirse, pero vamos a ver qué pasa si cambiamos código de forma arbitraria.

Esta propiedad de fallar en el caso de que se altere el comportamiento es el fundamento de los **tests de regresión**. Un test de regresión nos informa de que hemos introducido un cambio no deseado, lo que es necesario para garantizar que nuestra intervención no modifica el comportamiento general del sistema.

Esta clase contiene la lógica del cálculo de precio para una estancia según el número de noches y huéspedes, teniendo en cuenta un precio reducido para niños. Si hacemos un cambio en la forma en que se hace este cálculo, un test debería fallar.

```php
final class StandardRoom extends Room
{

    private float $price;

    public function __construct(float $price)
    {
        $this->price = $price;
    }


    public function price($nights, $adults, $children): float
    {
        $priceForAdults = $this->price * $nights * $adults;
        $priceForChildren = $this->price * 0.80 * $nights * $children;

        return $priceForAdults + $priceForChildren;
    }

    public function type(): string
    {
        return "standard";
    }
}
```

Hagamos un cambio un poco drástico, haciendo que el importe de la estancia siempre sea cero:

```php
final class StandardRoom extends Room
{

    // Code removed for clarity

    public function price($nights, $adults, $children): float
    {
        $priceForAdults = $this->price * $nights * $adults;
        $priceForChildren = $this->price * 0.80 * $nights * $children;

        return 0;
    }

    // Code removed for clarity
}
```

Como se podía esperar dado que el test no verifica comportamiento, este seguirá pasando sin ser capaz de informar del problema. En otras palabras: el test miente cuando no falla.

## Los dobles de test definen límites

Nuestra unidad bajo test, que podría ser perfectamente un _caso de uso_, utiliza dos colaboradores:

* `BookingRepository`: para recuperar los datos de la consulta. Por lo general, este tipo de componente tiene dependencia de una tecnología del mundo real (como podría ser una base de datos, un almacenamiento clave/valor, o incluso una cola de mensajes), por lo que preferimos doblarlo. Nuestro objetivo con este test es ver que generamos correctamente las propuestas de precios, no que la tecnología funciona como debe.
* `Availability`: que será un servicio que nos proporciona la lista de habitaciones disponibles para las condiciones requeridas. Este servicio posiblemente tendrá sus propias y complejas dependencias, como una base de datos que contenga las definiciones de los hoteles, con todos sus tipos de habitaciones, las reservas ya realizadas, etc. Todas estas dependencias permitirán realizar sus cálculos.

En último término, nuestro caso de uso utiliza a estos colaboradores para obtener la información que necesita, cruzarla y generar su respuesta.

El hecho de que estos colaboradores tengan sus propias dependencias técnicas nos indica que estamos ante una **frontera de arquitectura**, entre el dominio de la aplicación y los adaptadores de la tecnología.

Pero también podríamos hablar de una **frontera de responsabilidades**. El caso de uso no es responsable de gestionar cómo se obtienen los `BookingRequest` o `AvailableRooms`, únicamente los pide y su trabajo es realizar los cálculos necesarios para obtener las propuestas de precios a partir de las respuestas que ha obtenido.

`BookingRepository` podría estar implementado con Redis. Quizá nuestro diseño guarda los datos de la búsqueda temporalmente y emite un evento, de forma que un suscriptor del mismo lanza nuestro caso de uso. `Availability`, por su parte, coordina información que podría estar contenida en una base de datos relacional, de forma que sea fácil buscar por los criterios solicitados.

En este caso, tiene sentido utilizar algún tipo de doble de test o de implementación para test. Una implementación específica para test podría ser una buena idea y muchas veces es preferible, aunque dará algo más de trabajo. 

Sin embargo, usar una librería de dobles nos puede dar más flexibilidad a la hora de diseñar las interfaces de los adaptadores. Pero hay que saber elegir el tipo adecuado de doble.

En nuestro ejemplo se usan `mocks`. Los mocks tiene expectativas sobre cómo son usados, lo que implica, de hecho, una aserción. Si el código llama al doble de la forma esperada, se cuenta como una aserción cumplida. Esto es adecuado cuando justamente esperamos que el efecto de ejecutar el código sea que se produzca esa llamada, pero no es el caso.

Para el test que estamos analizando, la función de los dobles es simular que entregan los datos requeridos: la `BookingRequest` y la lista de habitaciones `AvailableRooms`. No queremos verificar que esos colaboradores han sido llamados, pues está implícito en que el caso de uso se ejecute correctamente.

El tipo de dobles que este test necesita es el _stub_, que simplemente devuelve la respuesta programada.

La forma en que están definidos los dobles como _mocks_ hace que el test haya quedado acoplado a la implementación. Si en algún momento decidimos que no es necesario hacer esas llamadas y aplicamos ese cambio, el test fallará, aunque el `output` sea correcto.

## Los tests deben ser reproducibles

Una característica fundamental de los tests es que han de ser reproducibles. Tienes que poder ejecutar un test miles de veces y obtener siempre el mismo resultado si el comportamiento del código bajo test no ha cambiado.

Y para que un test sea reproducible tienen que mantenerse las mismas condiciones o tener controladas aquellas que podrían cambiar.

Veamos un fragmento del test:

```php
final class CalculatePriceProposalTest extends TestCase
{
    /** @test
     */
    public function shouldCalculateAllProposals(): void
    {
        $booking = new BookingRequest(
            'bookingId',
            'hotelId',
            '2024-09-18',
            '2024-09-22',
            random_int(1, 3),
            random_int(0, 2),
        );
        
    // Code removed for clarity
    }
}
```


`BookingRequest` se construye con valores aleatorios. Aun partiendo del supuesto de que estos sean válidos para los parámetros correspondientes (número de personas adultas y número de niñas), aquí tenemos un problema. Problema que no se manifiesta porque el test no verifica el comportamiento.

El problema es muy simple: el número de huéspedes es un dato fundamental para el comportamiento de la unidad bajo test. Los precios generados son, indiscutiblemente, una función de ese valor. Si ese número varía, el precio será distinto. Por tanto, si cada vez que ejecutamos el test vamos a tener un valor de input diferente, obtendremos un valor de output diferente. Para que el test pase, no podemos verificar el comportamiento porque el input cambia cada vez, lo que va en contra de la naturaleza misma del test.

Un argumento a favor de inputs random es probar la resiliencia de una unidad de código o que es capaz de manejar todos los valores posibles. Sin embargo, esto es erróneo en este ejemplo. El `output` es determinista, lo que significa que dado el mismo `input`, deberíamos obtener el mismo `output` en cada ejecución del test.

Usar inputs random en un test determinista hace que el test no se pueda reproducir, porque no podemos anticipar el output que se generará.

Por otro lado, ¿qué ocurriría si fuese un test de un resultado no determinista? Este tipo de tests se puede resolver usando _property based testing_. En lugar de esperar valores específicos, lo que hacemos es esperar características de esos valores.

Por ejemplo, imagina que quieres generar localizadores de reservas. Por seguridad, no quieres que sean predecibles, como sería el caso de un valor auto-incremental, sino que quieres que sean aleatorios, pero a la vez, que puedan ser manejables para las usuarias y que no colisionen. Con frecuencia, un localizador es una secuencia de entre 5 y 7 letras y números, evitando aquellos que pueden confundirse (1, I, por ejemplo) generados al azar. Con estas características, disponemos de millones de localizadores, que son más que suficientes para identificar de manera unívoca las reservas de un hotel, con bajo riesgo de colisión. 

Para testear el generador lo que podemos mirar son propiedades del `output` generado, ya que el valor en sí es impredecible.

* Tiene el tamaño correcto
* No incluye caracteres que hayamos declarado prohibidos
* Comienza con una letra, no con un número
* Todas las letras son mayúsculas
* Cualquier otra propiedad que consideremos que debe cumplir

Así que, si bien es perfectamente posible crear tests cuando los outputs esperados no son predecibles, no es el caso de este ejemplo. De hecho, los outputs de este test han de ser perfectamente predecibles dadas unas condiciones conocidas.

Si lo que necesitas es comprobar que variando los _inputs_, cambia el _output_, lo que te hace falta son varios tests, cada uno de ellos testeando las distintas condiciones. En TDD a esto lo llamamos triangulación: un nuevo ejemplo provoca que esperemos un cambio en el `output`, lo que nos fuerza a introducir cambios en el código de producción que sea capaz de manejar el nuevo caso.

Cuando se trata de tests a posteriori lo que podemos hacer es ejecutar el mismo test con diferentes datos y valores esperados. Algunos frameworks de testing proporcionan proveedores de datos y, si no, es bastante fácil simularlo mediante un simple bucle que vaya leyéndolos de una colección.

## En resumen

Los tests deben verificar comportamientos del código que prueban. De otro modo, el hecho de que sea posible hacer pasar el test, e incluso que ejecute la totalidad del código, es completamente inútil.

Si el test no verifica el comportamiento, o bien está acoplado a la implementación, o bien no está haciendo nada que aporte valor.

Cuando es necesario usar dobles de test, debemos considerar cuidadosamente qué tipo de doble utilizar. Lo ideal es crear implementaciones adecuadas para testing, incluso para ese test específico. Pero si resulta más práctico emplear una librería de dobles, deberíamos considerar _stubs_ en lugar de _mocks_, reservando estos para verificar los _side effects_ que queremos que produzca nuestro código.

No debemos aleatorizar los datos de nuestros tests si los algoritmos que vamos a probar son deterministas. La única razón para hacerlo es que se trate de un requisito y probablemente necesitaremos usar un enfoque basado en propiedades para esos casos.

## Pero este test de algo servirá, ¿no?

Un argumento que podría darse a favor de la utilidad del test en su estado actual es que nos ayuda a verificar que el caso de uso realiza una coordinación correcta de los objetos de dominio, obteniendo `BookingRequest` y `Availability` como corresponde. El algoritmo de cálculo podría testearse directamente en `Room`. Especialmente, si hacemos alguna verificación extra, como:

```php
final class CalculatePriceProposalTest extends TestCase
{
    /** @test
     */
    public function shouldCalculateAllProposals(): void
    {
        // Code removed for clarity
        
        $request = new CalculateProposalRequest('bookingId');
        $proposals = $calculateProposal->forBooking($request);
        
        self::assertInstanceOf(Proposals::class, $proposals);
    }
}
```

Pero esto sigue siendo hacerse trampas al solitario. En un lenguaje, como PHP, con el que podemos tipar el retorno de `forBooking`, este test es totalmente innecesario. Ya sabemos que nos devuelve un objeto de esa clase porque el sistema de tipos se encarga de asegurarlo. El comportamiento que queremos verificar es que el objeto se ha generado como es debido.

¿Sigue siendo válido el argumento? Parcialmente. Este tipo de test es frecuente cuando hacemos TDD outside-in. Es un test que hacemos para diseñar el caso de uso y definir las interfaces que queremos que tengan sus colaboradores. De este modo nos ahorramos hacer desarrollo especulativo cuando toque implementarlos.

Pero lo adecuado es que una vez que cerremos el ciclo de aceptación, volvamos ahí y reemplacemos los dobles por implementaciones para test. De este modo, convertimos los tests que nos han servido para el diseño en test de regresión.

Aun así, lo apropiado sería siempre verificar el comportamiento, aunque este test solo se aplique a un caso de _happy path_. Podemos usar los test unitarios de `Room` para bombardear al objeto con toda clase de combinaciones de datos de entrada, incluyendo datos inválidos, y asegurar que su comportamiento es sólido. Y, por otro lado, verificar el comportamiento del caso de uso, ante sus propias circunstancias, como podrían ser no encontrar `BookingRequest` o no poder generar Proposals porque no hay disponibilidad de las habitaciones requeridas.

## Como debería haberse escrito este test

Para hacer que este test sea útil, necesitamos hacer tres cosas como mínimo:

* Verificar el comportamiento de la unidad bajo test.
* Reemplazar los datos aleatorios por otros definidos.
* Convertir los mocks en stubs.

Vamos por partes. En cuanto a los datos de entrada, podemos empezar con un caso muy habitual. Luego podremos ver como adaptar el ejemplo para examinar más combinaciones.

```php
$booking = new BookingRequest(
    'bookingId',
    'hotelId',
    '2024-09-18',
    '2024-09-22',
    2,
    1,
);
```

Reemplazar los mocks por stubs es fácil, tan solo necesitamos eliminar las expectativas. Al hacerlo reducimos el acoplamiento. Luego veremos como hacer lo mismo con _fakes_.

```php
$bookingRepository = $this->createStub(BookingRepository::class);
$availability = $this->createStub(Availability::class);

$bookingRepository
    ->method('byBookingId')
    ->willReturn($booking);
$availability
    ->method('byHotelIdAndDates')
    ->willReturn($availableRooms);
```

Verificar el comportamiento de la unidad require un poco más de esfuerzo. En este caso utilizo un patrón _Printer_, un objeto al que `Proposals` le pasa la información que quiere mostrar y que, en este caso, genera una versión JSON. También veremos otras forma de hacerlo con Approval Test.

```php
$request = new CalculateProposalRequest('bookingId');
$proposals = $calculateProposal->forBooking($request);
$showed = $proposals->print(new Array2JsonPrinter())->print();
$expected = <<<EOD
[{"room_type":"standard","stay_price":1176},{"room_type":"superior","stay_price":1485}]
EOD;

self::assertJsonStringEqualsJsonString($expected, $showed);
```

Este es el resultado:

```php
final class CalculatePriceProposalTest extends TestCase
{
    /** @test
     */
    public function shouldCalculateAllProposals(): void
    {
        $booking = new BookingRequest(
            'bookingId',
            'hotelId',
            '2024-09-18',
            '2024-09-22',
            2,
            1,
        );

        $availableRooms = new AvailableRooms();
        $availableRooms->addRoom('standard', 105.00);
        $availableRooms->addRoom('superior', 135.00);

        $bookingRepository = $this->createStub(BookingRepository::class);
        $availability = $this->createStub(Availability::class);

        $bookingRepository
            ->method('byBookingId')
            ->willReturn($booking);
        $availability
            ->method('byHotelIdAndDates')
            ->willReturn($availableRooms);

        $calculateProposal = new CalculatePriceProposal(
            $bookingRepository,
            $availability
        );

        $request = new CalculateProposalRequest('bookingId');
        $proposals = $calculateProposal->forBooking($request);
        $showed = $proposals->print(new Array2JsonPrinter())->print();
        $expected = <<<EOD
[{"room_type":"standard","stay_price":1176},{"room_type":"superior","stay_price":1485}]
EOD;

        self::assertJsonStringEqualsJsonString($expected, $showed);
    }
}
```

¿Qué ocurre si hacemos un cambio en el código? Como el que hicimos más arriba de hacer que una de las habitaciones devuelva 0 como precio. Pues en ese caso el test falla como es debido, indicándonos que el último cambio ha afectado al comportamiento.

Incluso si el cambio es mucho más sutil:

```php
public function price($nights, $adults, $children): float
{
    $priceForAdults = $this->price * $nights * $adults;
    $priceForChildren = $this->price * 0.80 * $nights * $children;

    $total = $priceForAdults + $priceForChildren;
    return $total * .99;
}
```

## Usemos nuestros propios dobles

Los cambios anteriores son suficientes para convertir un test mentiroso en otro mucho más fiable. De hecho, el mayor problema que tenemos ahora mismo es el tipo de dobles que tenemos, ya que acoplan el test a la implementación. Sin embargo, es muy fácil reemplazar estos dobles sintéticos por otros creados por nosotras.

Un doble no es más que una implementación de una interfaz que desarrollamos para su uso en tests. 

Podría ser una implementación completamente válida para usar en producción, en el sentido de que exponga el comportamiento requerido, aunque con sus limitaciones. El ejemplo tópico es el repositorio en memoria, que es muy fácil de programar, pero que no proporciona una persistencia indefinida, como sí lo haría un repositorio basado en una tecnología de bases de datos. A este tipo de dobles, que tienen comportamiento completo, los llamamos _fakes_.

Aunque esta forma de hacer dobles es útil en muchos casos, podemos adoptar otros enfoques. Podríamos desarrollar _stubs_ que sirvan a casos determinados. Por ejemplo, un servicio que siempre falle, arrojando una excepción o devolviendo un error. Esto nos permitiría probar el comportamiento de sus consumidores ante la situación de error. Del mismo modo, el fake podría actuar como un stub

La mayor ventaja de crear nuestros dobles es que gracias a ellos nuestros tests quedan completamente desacoplados de la implementación de la unidad bajo test. El test queda mucho más simple.

Aquí tenemos nuestros dobles para este test. `FixedBookingRepository` siempre devolverá el `BookingRequest` que le programemos:

```php
final class FixedBookingRepository implements BookingRepository
{
    private BookingRequest $booking;

    public function __construct(BookingRequest $booking)
    {
        $this->booking = $booking;
    }

    public function byBookingId(string $bookingId): BookingRequest
    {
        return $this->booking;

    }
}
```

```php
final class FixedAvailability implements Availability
{
    private AvailableRooms $availableRooms;

    public function __construct(AvailableRooms $availableRooms)
    {
        $this->availableRooms = $availableRooms;
    }


    public function byHotelIdAndDates(string $hotelId, string $checkin, string $checkout): AvailableRooms
    {
        return $this->availableRooms;
    }
}
```

El test ahora queda así, a falta de refactorizarlo para mejorar su legibilidad.

```php
final class BestCalculatePriceProposalTest extends TestCase
{
    /** @test
     */
    public function shouldCalculateAllProposals(): void
    {
        $booking = new BookingRequest(
            'bookingId',
            'hotelId',
            '2024-09-18',
            '2024-09-22',
            2,
            1,
        );
        $bookingRepository = new FixedBookingRepository($booking);

        $availableRooms = new AvailableRooms();
        $availableRooms->addRoom('standard', 105.00);
        $availableRooms->addRoom('superior', 135.00);
        $availability = new FixedAvailability($availableRooms);

        $calculateProposal = new CalculatePriceProposal(
            $bookingRepository,
            $availability
        );

        $request = new CalculateProposalRequest('bookingId');

        $proposals = $calculateProposal->forBooking($request);

        $showed = $proposals->print(new Array2JsonPrinter())->print();
        $expected = <<<EOD
[{"room_type":"standard","stay_price":1176},{"room_type":"superior","stay_price":1485}]
EOD;

        self::assertJsonStringEqualsJsonString($expected, $showed);
    }
}
```

Esta es la versión refactorizada, que simplifica la lectura del test:

```php
final class BestCalculatePriceProposalTest extends TestCase
{
    /** @test
     */
    public function shouldCalculateAllProposals(): void
    {
        $calculateProposal = $this->buildCalculateProposal();

        $request = new CalculateProposalRequest('bookingId');

        $proposals = $calculateProposal->forBooking($request);

        $this->verifyProposals($proposals);
    }

    private function buildCalculateProposal(): CalculatePriceProposal
    {
        $booking = new BookingRequest(
            'bookingId',
            'hotelId',
            '2024-09-18',
            '2024-09-22',
            2,
            1,
        );
        $bookingRepository = new FixedBookingRepository($booking);

        $availableRooms = new AvailableRooms();
        $availableRooms->addRoom('standard', 105.00);
        $availableRooms->addRoom('superior', 135.00);
        $availability = new FixedAvailability($availableRooms);

        return new CalculatePriceProposal(
            $bookingRepository,
            $availability
        );
    }

    public function verifyProposals(Proposals $proposals): void
    {
        $showed = $proposals->print(new Array2JsonPrinter())->print();
        $expected = <<<EOD
[{"room_type":"standard","stay_price":1176},{"room_type":"superior","stay_price":1485}]
EOD;

        self::assertJsonStringEqualsJsonString($expected, $showed);
    }
}
```

Si examinamos el índice de cobertura vemos que no cambia, ya que obtenemos un 100% de archivos y 98% de líneas cubiertas. Exactamente lo mismo que con el test inicial.

Pero hemos ganado inteligibilidad del test, bajo acoplamiento, y sensibilidad para fallar si cambia el comportamiento.


## Ejemplos múltiples

Como comentábamos más arriba, una razón que podría justificar usar valores aleatorios como inputs del test sería asegurarnos que todo funciona en el rango de valores aceptable. Pero esa misma naturaleza aleatoria provocaría que el test fuese imposible de verificar.

Una forma de solucionar esto es con tests combinatorios: proponemos valores significativos de cada parámetro relevante y generamos ejemplos combinándolos. Hacer esto a mano es muy tedioso, pero librerías como ApprovalTests nos proporcionan una herramienta para lograrlo. ApprovalTests está disponible en varios lenguajes. Instalarla en PHP es bastante sencillo:

```shell
composer require --dev approvals/approval-tests dev-Main
```

Para lograrlo hay que transformar un poco nuestro test. Este proceso lo hemos visto en un [artículo anterior](/approval_testing/), pero no está de más explicarlo de nuevo.

El principal cambio es que no necesitamos tener una respuesta esperada contra la que hacer una aserción, sino que la libraría generará un _snapshot_ tras la primera ejecución. Lo revisamos y lo _aprobamos_, cambiando su nombre de `received` a `approved`.

Este cambio temporal nos muestra la mecánica:

```php
public function verifyProposals(Proposals $proposals): void
{
    $showed = $proposals->print(new Array2JsonPrinter())->print();
    Approvals::verifyAsJson($showed);
}
```

Pero esto solo nos verifica un ejemplo. Si cambiamos los datos del input el test fallará. Lo mismo ocurrirá si cambiamos algún detalle del algoritmo de cálculo. En este sentido, el test es equivalente. Y, por supuesto, nos proporciona la misma cobertura.

Convertir el test en combinatorio requiere un poco más de esfuerzo.

A grandes rasgos, hay que transformar el test de tal forma que pueda ejecutar la unidad bajo test, pasándole los parámetros que quiero variar. Para que sea más fácil voy a deshacer el refactor anterior:

```php
final class MultipleCalculatePriceProposalTest extends TestCase
{
    /** @test
     */
    public function shouldCalculateAllProposals(): void
    {
        $booking = new BookingRequest(
            'bookingId',
            'hotelId',
            '2024-09-18',
            '2024-09-22',
            2,
            1,
        );
        $bookingRepository = new FixedBookingRepository($booking);

        $availableRooms = new AvailableRooms();
        $availableRooms->addRoom('standard', 105.00);
        $availableRooms->addRoom('superior', 135.00);
        $availability = new FixedAvailability($availableRooms);

        $calculateProposal = new CalculatePriceProposal(
            $bookingRepository,
            $availability
        );

        $request = new CalculateProposalRequest('bookingId');

        $proposals = $calculateProposal->forBooking($request);

        $showed = $proposals->print(new Array2JsonPrinter())->print();
        Approvals::verifyAsJson($showed);
    }
}
```

Mi objetivo es que se pueda ejecutar un test de un caso con una llamada a una función a la que le paso los parámetros que me interesa variar y que me devuelva el resultado. Hagámoslo paso a paso:

Primero, separo los parámetros que me interesan en variables:

```php
final class MultipleCalculatePriceProposalTest extends TestCase
{
    /** @test
     */
    public function shouldCalculateAllProposals(): void
    {
        $checkin = '2024-09-18';
        $checkout = '2024-09-22';
        $adults = 2;
        $children = 1;
        $standardPrice = 105.00;
        $superiorPrice = 135.00;

        $booking = new BookingRequest(
            'bookingId',
            'hotelId',
            $checkin,
            $checkout,
            $adults,
            $children,
        );
        $bookingRepository = new FixedBookingRepository($booking);

        $availableRooms = new AvailableRooms();
        $availableRooms->addRoom('standard', $standardPrice);
        $availableRooms->addRoom('superior', $superiorPrice);
        $availability = new FixedAvailability($availableRooms);

        $calculateProposal = new CalculatePriceProposal(
            $bookingRepository,
            $availability
        );

        $request = new CalculateProposalRequest('bookingId');

        $proposals = $calculateProposal->forBooking($request);

        $showed = $proposals->print(new Array2JsonPrinter())->print();
        Approvals::verifyAsJson($showed);
    }
}
```

El segundo paso será aislar todo el proceso en una función. Puede ser una función anónima o un método del propio test, lo que te dé más rabia. Yo haré lo segundo.

Nos sale un método que recibe seis parámetros. No es bonito, pero es un escenario con muchas variaciones.

```php
final class MultipleCalculatePriceProposalTest extends TestCase
{
    /** @test
     */
    public function shouldCalculateAllProposals(): void
    {
        $checkin = '2024-09-18';
        $checkout = '2024-09-22';
        $adults = 2;
        $children = 1;
        $standardPrice = 105.00;
        $superiorPrice = 135.00;

        $showed = $this->calculateProposals(
            $checkin,
            $checkout,
            $adults,
            $children,
            $standardPrice,
            $superiorPrice
        );
        Approvals::verifyAsJson($showed);
    }

    public function calculateProposals(string $checkin, string $checkout, int $adults, int $children, float $standardPrice, float $superiorPrice): string
    {
        $booking = new BookingRequest(
            'bookingId',
            'hotelId',
            $checkin,
            $checkout,
            $adults,
            $children,
        );
        $bookingRepository = new FixedBookingRepository($booking);

        $availableRooms = new AvailableRooms();
        $availableRooms->addRoom('standard', $standardPrice);
        $availableRooms->addRoom('superior', $superiorPrice);
        $availability = new FixedAvailability($availableRooms);

        $calculateProposal = new CalculatePriceProposal(
            $bookingRepository,
            $availability
        );

        $request = new CalculateProposalRequest('bookingId');

        $proposals = $calculateProposal->forBooking($request);

        return $proposals->print(new Array2JsonPrinter())->print();
    }
}
```

Con esto, estamos casi listas para generar combinaciones. Hacemos que nuestras variables sean arrays y llamamos al método `CombinationApprovals::verifyAllCombinations6` (en otros lenguajes no necesitas el número al final). En PHP este método acepta la función que debe ser llamada más los seis parámetros que le tenemos que pasar.

Lo que va a hacer `verifyAllCombinations` es generar todas las combinaciones posibles de valores y ejecutar la función con cada una de ellas. Con los resultados generará un archivo que debes revisar y aprobar.

```php
final class MultipleCalculatePriceProposalTest extends TestCase
{
    /** @test
     */
    public function shouldCalculateAllProposals(): void
    {
        $checkin = ['2024-09-18'];
        $checkout = ['2024-09-22'];
        $adults = [2];
        $children = [1];
        $standardPrice = [105.00];
        $superiorPrice = [135.00];
        
        CombinationApprovals::verifyAllCombinations6(
            [$this, 'calculateProposals'],
            $checkin,
            $checkout,
            $adults,
            $children,
            $standardPrice,
            $superiorPrice
        );
    }

    // Code removed for clarity
}
```

Lo interesante viene ahora. No tienes más que añadir los valores que quieres probar para cada parámetro. Por ejemplo:

```php
/** @test
 */
public function shouldCalculateAllProposals(): void
{
    $checkin = ['2024-09-18', '2024-09-19', '2024-09-20', '2024-09-21'];
    $checkout = ['2024-09-22'];
    $adults = [1, 2];
    $children = [0, 1, 2];
    $standardPrice = [80.45, 105.00, 120.47];
    $superiorPrice = [90.65, 135.00, 230.43];

    CombinationApprovals::verifyAllCombinations6(
        [$this, 'calculateProposals'],
        $checkin,
        $checkout,
        $adults,
        $children,
        $standardPrice,
        $superiorPrice
    );
}
```

Este ejemplo genera 216 combinaciones nada más y nada menos. En este caso, ya he procurado que los ejemplos sean viables. Por ejemplo, que no haya un checkin en fecha posterior a un checkout. O que por lo menos haya un adulto en la habitación. En cualquier caso, se podrían añadir controles para evitar testear combinaciones de valores incompatibles.

## ¿Cómo de válidos son estos tests?

Decimos que un test es válido si realmente verifica el comportamiento de la unidad de software. Ese comportamiento debe ser definido, preferiblemente por una persona experta en el dominio, que nos proporcione ejemplos que podamos expresar en forma de test.

El test con el que iniciábamos el artículo nos mostraba un caso de test no válido, ya que no verificaba ningún comportamiento.

Una vez que reescribimos el test para asegurar que sí verificamos comportamiento, el test comienza a ser válido... en la medida en que usemos ejemplos que tengan sentido en el dominio.

Los test combinatorios pueden ser igualmente válidos. Lo apropiado sería comprobar los snapshots generados manualmente, con la ayuda de una experta del dominio, para que nos diga si los casos y sus resultados lo son.

## Concluyendo

Es muy fácil generar cobertura con tests no válidos. La cobertura se consigue simplemente haciendo correr el código, independientemente de la validez del test en sí. Por eso, es igualmente muy fácil que la cobertura de tests no sea más que una vanity metric sin valor real.

Buscar la cobertura de tests nos dirige de cabeza a una trampa, ya que esta métrica no nos dice nada más que los tests ejercitan ciertas partes del código.

En este artículo hemos visto un ejemplo de un test que obtiene una gran cobertura, sin aportar ningún tipo de información sobre el comportamiento de la unidad bajo test. En otras palabras, hemos comenzado con un test inútil.

También hemos visto cómo transformar ese test en un test que verifica el comportamiento y que falla si en algún momento introducimos un cambio no deseado.

Y no solo eso. Utilizamos un test combinatorio para generar automáticamente numerosas variantes y así probar su fiabilidad.

Y nada más, el código de este artículo lo puedes ver [en el repositorio](https://github.com/franiglesias/talkingbit/tree/master/).
