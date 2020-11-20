---
layout: post
title: Las seis preguntas para comentar tu código
categories: articles
tags: good-practices refactoring
---
La **técnica de las seis preguntas** (ó 5 según la fuente) es una especie de framework que se utiliza en algunas disciplinas para determinar si una cierta fuente proporciona una información completa.

Vamos a utilizarla para valorar si deberíamos añadir comentarios a un código.

Es decir, para decidir si es conveniente o no comentar un código podríamos simplemente utilizar estas preguntas para ver si el código nos proporciona por sí mismo toda la información que necesitaríamos conocer. 

## When: cuándo se ha escrito ese código

¿Un comentario para añadir esta información? ¿En serio? Teniendo los sistemas de control de versiones este tipo de datos no sólo es redundante, sino que además es fácilmente falseable. Para conocer la vida de un código no hay nada mejor que revisar su historial de versiones que proporciona herramientas para eso.

## Who: quién ha escrito el código

Lo mismo que la anterior. Este tipo de información es recogida automáticamente por los sistemas de control de versiones con la mayor precisión posible.

Excepto que se esté dando una situación particular, como un código que nunca antes ha estado bajo control de versiones, por la razón que sea, y sería adecuado añadir información para conocer esta circunstancia. Claro que esto sería mejor documentarlo en un Readme.

## Where: dónde está el código

Hey, que está aquí mismo.

No, en serio. Una información posible sería mencionar el paquete del que forma parte el código, pero resulta que los propios lenguajes se encargan de fallar de un modo u otro si un componente se encuentra mal ubicado respecto al paquete al que pertenece. Es decir, si declaro que una clase pertenece a un namespace y la pongo en otro sitio, el interprete o compilador no la encontrará o nos indicará esa circunstancia.

Eso si no lo hace el IDE antes.

En resumen, existe toda una meta información sobre el código que, hoy por hoy, no necesitamos registrar en comentarios ya que tenemos herramientas que se encargan automáticamente de ellos, de forma mucho más completa y precisa de lo que podríamos hacer nosotros y sin necesidad de mantenerlo. 

Las siguientes preguntas son mucho más interesantes.

## What: qué hace el código o qué es esto

La pregunta What cuestiona el _naming_ en nuestro código.

Podemos plantear algo así: si tengo que explicar en un comentario qué es un determinado objeto del código (entendiendo aquí como objeto una variable, una función, una clase, un método, etc.) es posible que pueda mejorar su nombre.

Veamos un ejemplo:

```javascript
let s = b * h / 2

console.log(s)
```

¿Puedes decir qué hace este código y qué significan las variables?

Es bastante posible que no, aunque podría resultar familiar. Como autor del código **yo** sí sé que aquí estamos calculando el área de un triángulo.

Puesto que leyendo el código no podemos contestar con seguridad al **qué**, tendríamos que comentarlo:

```javascript
// s surface of a triangle
// b base of the triangle
// h height of the triangle
let s = b * h / 2

console.log(s)
```

Pero aparte de verbosa, esta forma de documentar el código no es la más óptima. Lo suyo sería que cada elemento de esa expresión tuviese un nombre significativo:

```javascript
let surface = base * height / 2

console.log(surface)
```

Esto está mejor, pero podríamos hacerlo más explícitamente:

```javascript
let triangle_surface = triangle_base * triangle_height / 2

console.log(triangle_surface)
```

Esto suena a objeto:

```javascript
let triangle = {
    base: 10,
    height: 15,

    surface: function () {
        return this.base * this.height / 2
    }
};

console.log(triangle.surface())
```

Todas estas expresiones devuelven el mismo resultado, que es como decir que representan el mismo conocimiento.  ¿Cuáles son sus diferencias y qué nos aporta cada una?

La versión documentada con comentarios tiene dos problemas principales:

```javascript
// s surface of a triangle
// b base of the triangle
// h height of the triangle
let s = b * h / 2

console.log(s)
```

* Requiere que mantengamos una sincronización entre comentarios y código. Si en algún momento cambiamos los nombres de variables tienen que reflejarse en los comentarios. De otro modo, se volverán comentarios _mentirosos_ y en el largo plazo pueden volverse inútiles.
* Es más costosa en términos de lectura pues para interpretar el código tenemos que alternar entre dos modos: el lenguaje natural de los comentarios y el lenguaje del código, y mantener más información en la memoria a corto plazo.

Para resolver esos problemas, lo mejor es trasladar la información de los comentarios al propio código, lo que nos lleva a la siguiente opción:

```javascript
let triangle_surface = triangle_base * triangle_height / 2

console.log(triangle_surface)
```

Al nombrar de forma descriptiva las variables y otros constructos del código nos evitamos tener que explicar qué son o qué función tienen.

Con todo, en el ejemplo queda patente todas las variables se refieren a una entidad, en este caso, un triángulo, cosa que podríamos modelar usando un objeto:

```javascript
let triangle = {
    base: 10,
    height: 15,

    surface: function () {
        return this.base * this.height / 2
    }
};

console.log(triangle.surface())
```

Lo que nos revela esto es justamente que buscar un código expresivo nos puede llevar incluso a plantearnos mejores soluciones de diseño, que no hubiésemos considerado si nos limitamos a añadir un comentario explicando qué es cada cosa.

## How: cómo hace el código lo que hace

Describir lo que hace el código es, literalmente, duplicación del conocimiento.

```javascript
let triangle = {
    base: 10,
    height: 15,

    // Computes triangle surface using the b * h / 2 classic formula
    surface: function () {
        return this.base * this.height / 2
    }
};

console.log(triangle.surface())
```

Dicho en otras palabras, si tenemos una función o un método cuyo nombre nos comunica su intención, el cuerpo de esa función es básicamente el cómo lo hace, expresado mediante código. Y esto es especialmente cierto si hemos sido capaces de responder al _What_, o sea, de si hemos bautizado nuestros componentes con buenos nombres.

Pero,  ¿qué ocurre con algoritmos más complejos, que pueden tener distintas etapas? En ese caso, es posible que, al menos aparentemente, tenga sentido añadir comentarios para explicar cómo funciona el código.

### Algoritmos conocidos

Veamos un ejemplo. La siguiente clase calcula la distancia lineal aproximada entre dos coordenadas geográficas utilizando un método llamado Haversine Algorithm o Fórmula del Semiverseno. El nombre de la clase nos indica qué es y qué hace, pero no nos dice nada acerca del cómo.

```php
class HaversineDistanceCalculator implements DistanceCalculator
{

    private const EARTH_RADIUS_KM = 6371;

    public function between(Coordinates $start, Coordinates $destination): float
    {
        $deltaLat = deg2rad($destination->latitude() - $start->latitude());
        $deltaLon = deg2rad($destination->longitude() - $start->longitude());

        $a = (sin($deltaLat / 2) ** 2)
            + cos($start->latitudeAsRad()) *
            cos($destination->latitudeAsRad())
            * (sin($deltaLon / 2) ** 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return round(self::EARTH_RADIUS_KM * $c, 0);
    }
}
``` 

Explicar cada paso o elemento del algoritmo en el propio código puede ser bastante complicado y no aportar demasiado. Lo mismo ocurre con cualquier algoritmo bien establecido y diría que lo más recomendable en este caso es incluir un enlace a una buena explicación del mismo o a la fuente concreta que hemos usado como referencia para implementarlo. Por ejemplo, así:

```php
/**
 * HaversineDistanceCalculator.
 * 
 * 
 * Reference and testing:
 * 
 * @link https://www.movable-type.co.uk/scripts/latlong.html
 */
class HaversineDistanceCalculator implements DistanceCalculator
{
    // ...
}
``` 

### Procesos complejos

Cuando tenemos un método o función que realiza un proceso complejo es frecuente que detectemos varias partes o etapas, las cuales delimitaríamos con comentarios

Consideremos el método `execute` de este comando de consola de symfony:

```php
class ComputeBestRouteCommand extends Command
{

    protected static $defaultName = 'route:solve';

    private CalculateItineraryCommandHandler $calculateItineraryCommandHandler;

    public function __construct(
        CalculateItineraryCommandHandler $calculateItineraryCommandHandler
    ) { ... }

    protected function configure(): void { ... }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        // Get starting city from user input or use default 
        $startingFrom = $input->getArgument('starting-from');

        if (empty($startingFrom)) {
            $startingFrom = 'Beijing';
        }

        // Compute best itinerary
        $calculateItinerary = new CalculateItinerary($startingFrom);
        $itinerary = ($this->calculateItineraryCommandHandler)($calculateItinerary);

        // Output name list to stdout
        $names = array_map(
            static function (City $city) {
                return $city->name();
            },
            $itinerary->toArray()
        );

        $output->writeln($names);

        return Command::SUCCESS;
    }
}
```

Estos comentarios nos sirven para que sea más fácil entender el código. Ahora bien, tenemos otra forma de hacerlo: extraer esos bloques de código a sus propios métodos. De esta manera, el método principal explica el proceso a grandes rasgos y cada método extraído se ocupa únicamente de su parte.

```php
class ComputeBestRouteCommand extends Command
{

    protected static $defaultName = 'route:solve';

    private CalculateItineraryCommandHandler $calculateItineraryCommandHandler;

    public function __construct(
        CalculateItineraryCommandHandler $calculateItineraryCommandHandler
    ) { ... }

    protected function configure(): void { ... }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $startingFrom = $this->obtainStartingCity($input);
        $itinerary = $this->computeBestItinerary($startingFrom);
        $this->outputCitiesList($itinerary, $output);

        return Command::SUCCESS;
    }

    private function obtainStartingCity(InputInterface $input)
    {
        $startingFrom = $input->getArgument('starting-from');

        if (empty($startingFrom)) {
            $startingFrom = 'Beijing';
        }

        return $startingFrom;
    }

    private function computeBestItinerary(?string $startingFrom): \App\Domain\Itinerary
    {
        $calculateItinerary = new CalculateItinerary($startingFrom);

        return ($this->calculateItineraryCommandHandler)($calculateItinerary);
    }

    protected function outputCitiesList(\App\Domain\Itinerary $itinerary, OutputInterface $output): void
    {
        $names = array_map(
            static function (City $city) {
                return $city->name();
            },
            $itinerary->toArray()
        );

        $output->writeln($names);
    }
}
```

Y ahora no hacen falta comentarios, sino que el código es mucho más fácil de mantener.

## Why: por qué hace el código lo que hace

Y llegamos a la última pregunta, ¿Por qué?

El por qué de un cierto algoritmo, decisión o implementación es posiblemente la única información que realmente tendría sentido documentar con comentarios ya que ese la única realmente inaccessible y que no podemos expresar mediante código.

Es decir, en último término podemos esforzarnos por conseguir que el código describa las entidades que maneja y que la implementación revele correctamente las intenciones. Esto es: podemos llegar responder al qué y al cómo escribiendo un código expresivo, aunque no siempre lo consigamos.

Sin embargo, el por qué de una cierta decisión no se puede expresar con código de ninguna forma. En algunos casos será bastante evidente, fácil de inferir o incluso trivial.

En cambio, habrá casos en los que sea necesaria una explicación ya que puede existir un requisito legal que afecte ala información o al proceso, o puede haber una motivación técnica que no podemos descubrir en base al código, una norma de negocio que se debe satisfacer o la razón que sea.

Si volvemos al ejemplo del algoritmo Haversine, seguramente será más importante explicar por qué hemos elegido este algoritmo frente a otros que podrían darnos resultados más precisos:

```php
/**
 * HaversineDistanceCalculator.
 *
 * Haversine provides pretty accurate distances between cities regardless
 * mode of transportation.
 *
 * Reference and testing:
 *
 * @link https://www.movable-type.co.uk/scripts/latlong.html
 */

class HaversineDistanceCalculator implements DistanceCalculator
```

## En resumen

Un código con buenos nombres y bien organizado puede ser lo bastante expresivo como para no necesitar comentarios. De hecho, la mayor parte de la información que necesitamos puede ser proporcionada por el mismo código, evitando el problema de la sincronización y el uso de dos modos de lenguaje diferentes.

Incluso se podría afirmar que la existencia de ciertos tipos de comentarios en el código indica carencias en esa capacidad expresiva, que se podrían subsanar mediante un refactor adecuado.

Sin embargo, hay una pregunta que el código no puede responder por sí mismo: ¿por qué precisamente ese código? 

Los comentarios explicando el por qué de ciertas decisiones son necesarios.
