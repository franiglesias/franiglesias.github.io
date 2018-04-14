---
layout: post
title: Testeando lo impredecible
categories: articles
tags: [tdd, test-doubles]
---

¿Cómo testear lo que no podemos predecir? En muchos sentidos los tests se basan en que el comportamiento del código es predecible: si hacemos ciertas operaciones con ciertos datos podemos esperar ciertos resultados y no otros. Pero esto no siempre se cumple.

## Generando contraseñas para humanos

Hace algunos años, cuando trabajaba en un colegio, tenía que crear cuentas para los usuarios de varias aplicaciones. Una queja habitual era la dificultad de recordar e incluso transcribir las contraseñas y todo el mundo quería cambiarlas por alguna más fácil de memorizar. Y por una buena razón:

Para explicarla, desempolvo aquí alguno de mis libros de Psicología General, en concreto [el artículo clásico de George A. Miller sobre el mágico número siete](http://www.musanim.com/miller1956/).

Resumiendo mucho: nuestro cerebro puede procesar una media de siete unidades de información a la vez. Por ejemplo, es posible recordar 6 ó 7 letras al azar sin cometer errores. Si aumentamos el número de letras, el recuerdo empeora.

Ahora bien, si podemos agrupar esas letras en sílabas de modo que se mantenga el límite de 6 ó 7 unidades o *chunks* de información, podríamos llegar a recordar 21 letras suponiendo sílabas de tres letras. Y si esas letras pueden formar palabras, son más memorables todavía.

Por ejemplo, cuando memorizamos números de teléfono lo hacemos organizándolos en grupos de dos ó tres. De este modo, un número que tiene 9 dígitos, se reduce a 3 unidades de información, mucho más fácil de recordar.

Así que, volviendo al caso de las contraseñas, en lugar de tener que recordar una serie de 8 ó 9 símbolos al azar, lo ideal sería poder agruparlos en algún tipo de unidad de orden superior cuyo recuerdo sea más económico. 

Una palabra es muchísimo más fácil de recordar pues agrupa esos 8 o más caracteres es una única unidad, sin embargo la descartamos como contraseña porque tiene el problema de ser fácil de adivinar.

En cambio, podemos combinar letras para formar palabras que sin tener significado sean pronunciables (*bilitri, carbinacho…*), lo que permite a nuestro cerebro tratarlas como una unidad. Al no estar en un diccionario son más difíciles de adivinar que las palabras reales.

Así que en su día, investigué un poco y encontré algunos generadores de contraseñas legibles o pronunciables por humanos.

La idea básica es que en lugar de formar las contraseñas mezclando caracteres al azar, lo que hacemos es mezclar sílabas, creando palabras posibles en el idioma aunque no tengan ningún significado. De este modo las contraseñas mantienen un compromiso aceptable entre ser fáciles de recordar pero difíciles de adivinar.

Con esta idea en la cabeza escribí un generador de contraseñas legibles que me resultó bastante útil durante algunos años. Recientemente lo hemos rescatado, con algunas modificaciones, para introducirlo *de tapadillo* (ejem…) en un proyecto del trabajo en el que justamente necesitábamos proporcionar credenciales a un conjunto de usuarios.

El único problema es que, de vez en cuando, aparece alguna contraseña que recuerda vagamente a palabras malsonantes, pero qué le vamos a hacer.

En cualquier caso, nuestro **Readable Password Generator** plantea unos cuantos problemas interesantes y he pensado en reescribirlo usando TDD para aprender a resolverlos. 

Pero antes, un poco más de paliza teórica para situarnos.

## Determinismo y predictibilidad

Cuando un algoritmo ofrece unos resultados que podemos predecir a partir de los datos que le proporcionamos decimos que es **determinista**. Por ejemplo, si multiplicamos 15 * 3 el resultado será siempre 45. Como vimos en un artículo anterior, si al repetir el algoritmo con los mismos datos siempre obtenemos los mismos resultados, también decimos que es **idempotente**.

Hay operaciones, sin embargo, que no tienen el mismo resultado cada vez. Por ejemplo: si consultamos la hora del sistema la lectura será siempre diferente, asumiendo que la consulta se hace con la precisión necesaria. Por tanto, si un algoritmo depende de la hora del sistema no podríamos predecir su resultado a no ser que supiésemos exactamente el momento en que se consulta.

Una manera más formal de expresar esto mismo es decir que el algoritmo en cuestión depende del estado global, como puede ser el tiempo transcurrido en el mundo.

La hora del sistema no es aleatoria en sí misma, pero normalmente no podemos saber qué valor vamos a encontrar cuando la consultemos. Sí estaremos en condiciones de conocer algunas de sus características, por ejemplo que ese valor siempre será mayor que el que tenía al iniciarse nuestro algoritmo, pero poco más. 

Otro ejemplo es el siguiente. Si nuestro algoritmo necesita valores al azar necesitamos recurrir a un generador de números aleatorios, o al menos pseudoaleatorios. Un ordenador es una máquina determinista pero tenemos algoritmos capaces de generar valores que sin ser estrictamente aleatorios son suficientemente difíciles de predecir como para funcionar como tales.

Así que, cuando tenemos que escribir código que necesita tratar con el tiempo o el azar, ¿cómo podemos testearlo?

Para responder a esta pregunta, tendremos que recurrir al principio de única responsabilidad, descargando a nuestro generador de contraseñas de la tarea de obtener valores aleatorios.

Además, introduciremos una metodología de test basada en propiedades, [como la expuesta en esta charla de Pedro Santos](https://www.youtube.com/watch?v=gqM6DTzhD0M), que nos permita testear aquello que no podemos predecir, pero que podemos describir.

## A ver qué sale

El primer problema a la hora de testear un método que devuelve valores generados de forma aleatoria es justamente no tener ni idea de lo que va a salir.

Una posibilidad es centrarnos en propiedades que describan el resultado que esperamos, las cuales podríamos enunciar como *reglas de negocio* de nuestro generador de contraseñas.

Por ejemplo:

* La contraseña es de tipo `string`
* Tiene una longitud de al menos 6 caracteres (este límite es arbitrario)
* Es un string de al menos 6 símbolos al azar
* Es memorizable para humanos
* Debe incluir al menos un número
* Debe incluir al menos un símbolo no alfanumérico

Así que vayamos paso a paso:

```php
namespace Tests\TalkingBit\Readable;

use PHPUnit\Framework\TestCase;
use TalkingBit\Readable\PasswordGenerator;

class PasswordGeneratorTest extends TestCase
{

    public function testItGeneratesAStringPassword(): void
    {
        $generator = new PasswordGenerator();
        $password = $generator->generate();
        $this->assertInternalType('string', $password);
    }
}
```

Esto nos permite crear una primera implementación simple para poder empezar:

```php
class PasswordGenerator
{

    public function generate(): string
    {
        return "";
    }
}
```

El *return type* en `generate` hace que el test sea redundante porque nos obliga a devolver el tipo correcto sí o sí. Por tanto lo podremos eliminar aunque nos ha permitido escribir la primera implementación.

### Lo que hay en un nombre

Además de tener un tipo string, esperamos que tenga una longitud mínima. Este sería nuestro nuevo test:

```php
    public function testItGeneratesAStringWithAMinimumLengthOfSixCharacters()
    {
        $generator = new PasswordGenerator();
        $password = $generator->generate();
        $this->assertGreaterThanOrEqual(6, strlen($password));
    }
```

De nuevo, podemos hacer una implementación mínima e inflexible:

```php
namespace TalkingBit\Readable;

class PasswordGenerator
{

    public function generate(): string
    {
        return "abcdef";
    }
}
```

Esto nos sitúa en verde de nuevo. Podemos echar un vistazo a lo que tenemos para ver si es posible hacer algún refactor, antes de seguir avanzando.

En el código de producción de momento no tenemos nada reseñable, pero en el test tenemos un número mágico. La longitud mínima de la cadena está incrustada en el código y en el nombre del test. Ambas cosas son malas, Si en el futuro esta regla cambia tendremos que cambiar cosas en varios sitios. Es mejor hacerlo ahora.

Empecemos con el nombre del test, haciéndolo más genérico:

```php
    public function testItGeneratesAStringWithAMinimumLength()
    {
        $generator = new PasswordGenerator();
        $password = $generator->generate();
        $this->assertGreaterThanOrEqual(6, strlen($password));
    }
```

Eso está mejor, ahora el nombre del test no está ligado a una longitud concreta, sino a un concepto más abstracto de longitud mínima.

Y luego tendríamos que sustituir el número mágico por una constante o una variable para darle nombre y poder cambiarlo con facilidad llegado el caso. Esta regla debería residir en un único lugar, por lo que la opción más obvia es que esté en el propio generador de contraseñas. Como no se nos pide que sea configurable ni modificable puede ser una constante y la vamos a hacer pública para tener la opción de recurrir a ella en diferentes momentos.

```php
class PasswordGenerator
{
    public const MINIMUM_LENGTH = 6;

    public function generate(): string
    {
        return "abcdef";
    }
}
```
 
Y ahora podríamos cambiar el test conforme a lo anterior:

```php
    public function testItGeneratesAStringWithAMinimumLength()
    {
        $generator = new PasswordGenerator();
        $password = $generator->generate();
        $this->assertGreaterThanOrEqual(PasswordGenerator::MINIMUM_LENGTH, strlen($password));
    }
```

Por el momento no tenemos gran cosa ya que nuestra implementación realmente no hace nada, aunque sí cumpla las primeras especificaciones. El problema es que ninguna de ellas nos fuerza a implementar algo más.

### Introduciendo el azar

La siguiente especificación nos pide un `string` de al menos seis símbolos al azar. No nos especifica qué tipo de símbolos, aunque podemos hacer algunas suposiciones con cierto fundamento como usar números, letras y algunos otros símbolos.

#### ¿Qué es aleatorio?

Pero esta especificación es un poco difusa. En realidad cualquier cadena de caracteres sería válida dado que cualquier cadena puede haber sido generada al azar. Podemos suponer que se refiere a secuencias que no formen una palabra conocida pero, ¿cómo demonios podemos testear eso de una manera eficaz?

En realidad para hacerlo bien deberíamos realizar un análisis estadístico basado en el siguiente razonamiento:

Si tenemos un conjunto finito de n símbolos, la posibilidad de extraer uno cualquiera de ellos del conjunto es 1/n. Por tanto, si repetimos la extracción (con reposición) un gran número de veces (varios cientos, al menos), obtendremos una frecuencia para cada símbolo que será 1/n o un valor muy próximo. Cuanto mayor sea el número de veces que repetimos el experimento, más aproximado será el resultado.

#### Extrayendo la aleatoridad de nuestra clase

Ahora bien este test no sólo es poco práctico para nuestro caso, sino que además lo que realmente testea es un hipotético generador aleatorio de símbolos, el cual podría ser utilizado por nuestro generador de contraseñas. Este se encargará de pedir al generador aleatorio los símbolos que vaya necesitando y componer la contraseña con ellos.

De momento no vamos a crear el generador aleatorio, pero sí crearemos una interfaz para poder utilizar un test double suyo.

```php
namespace TalkingBit\Readable;

interface RandomGenerator
{
    public function generate();
}
```

En resumen, nuestro generador de contraseñas utilizará un generador aleatorio de símbolos que le pasaremos como dependencia.

Esto tiene una gran ventaja porque para el test podemos tener un doble del generador aleatorio que no sea aleatorio. De este modo, las contraseñas generadas serán predecibles y podemos testear su construcción.

Para empezar seguimos necesitando un test que nos fuerce a implementar algo en el código de producción.

Una primera idea que podemos experimentar es la siguiente: Podemos hacer que nuestro generador entregue una secuencia concreta de símbolos y testear que la contraseña devuelta reproduzca esa misma secuencia.

De este modo, probaremos que el generador de contraseñas utiliza al aleatorio.

```php
    public function testItGeneratesAPasswordUsingSymbolsPickedfromRandomGeneartor()
    {
        $randomProphecy = $this->prophesize(RandomGenerator::class);
        $randomProphecy->generate()->willReturn('1', '2', '3', '4', '5', '6');
        $generator = new PasswordGenerator($randomProphecy->reveal());
        
        $password = $generator->generate();
        
        $this->assertEquals('123456', $password);
    }

```

Como es obvio, el test no pasará y nos toca implementar algo:

```php
namespace TalkingBit\Readable;

class PasswordGenerator
{
    public const MINIMUM_LENGTH = 6;
    
    /** @var RandomGenerator */
    private $randomGenerator;

    public function __construct(RandomGenerator $randomGenerator)
    {
        $this->randomGenerator = $randomGenerator;
    }

    public function generate(): string
    {
        $password = '';
        for ($item = 0; $item < self::MINIMUM_LENGTH; $item++) {
            $password .= $this->randomGenerator->generate();
        }
        return $password;
    }
}
```

Esta implementación nos permite pasar el test y cumplir la especificación.

## Generando un password legible

El tema de la aleatoridad ha abierto la necesidad de crear un colaborador para nuestro generador de contraseñas: un generador aleatorio que nos entregue un valor cada vez que lo llamamos.

De momento hemos creado un doble para usarlo en el test y le hemos fijado la secuencia en la que entrega valores. De este modo, hemos podido testear que el generador de contraseñas lo utiliza y que lo llama las veces necesarias.

Lo bueno, además, es que hemos logrado el acoplamiento mínimo posible del test a la implementación pues no hemos fijado expectativas sobre la forma en que el colaborador es usado.

Así que nos movemos a la siguiente especificación y nos dice que la contraseña ha de ser memorizable. En este caso, asumimos que queremos una contraseña construida uniendo sílabas escogidas al azar.

Nuestra interfaz `RandomGenerator` entrega un `string` cada vez que llamamos al método `generate`. Así que podríamos crear una implementación que entregue una sílaba escogida al azar cada vez.

Obviamente, si queremos desarrollar esta implementación mediante TDD nos volvemos a topar con el problema del **testeo no determinista**. En el caso anterior lo hemos solucionado extrayendo la parte aleatoria, ¿podemos hacerlo ahora también?

### Otro nivel de indirección

Hemos dicho que la responsabilidad de obtener símbolos al azar debería estar fuera del generador de contraseñas. Ahora queremos crear una implementación concreta de ese generador aleatorio de símbolos que nos devuelva sílabas.

Y, de nuevo, podemos pensar en dos responsabilidades: la generación o gestión de los símbolos que vamos a utilizar y la generación de un valor aleatorio que nos permita elegir uno concreto.

Pero esta delegación no puede producirse indefinidamente. Separaremos la lógica en dos clases, una es el `RandomGenerator` que entrega un símbolo de tipo `string` (una letra, una sílaba, un número, un bloque cualquiera de símbolos, etc.), y la otra es un `RandomEngine` que entregará un valor entero aleatorio que nos permitirá elegir un símbolo al azar de entre todos los posibles en el `RandomGenerator` concreto.

Así que vamos con cada uno de ellos.

#### Un generador de sílabas

En español, una sílaba es un conjunto de letras que cumple las siguientes reglas:

* Tiene al menos una vocal
* Si tiene más vocales, han de formar un diptongo
* Puede comenzar, o no, con una consonante
* O por un grupo de consonantes del conjunto válido
* Puede terminar, o no, con una consonante del conjunto válido

Estas especificaciones son bastante claras, así que vamos a convertirlas en tests. El más básico de todos es el que toda sílaba tiene, al menos, una vocal.

```php
namespace Tests\TalkingBit\Readable;

use TalkingBit\Readable\RandomSyllableGenerator;
use PHPUnit\Framework\TestCase;

class RandomSyllableGeneratorTest extends TestCase
{

    public function testSyllableHasOneVocal()
    {
        $generator = new RandomSyllableGenerator();
        $syllable = $generator->generate();
        $this->assertRegExp('/[aeiou]/', $syllable);
    }
}
```

Comencemos por una implementación mínima para pasar el test:

```php
namespace TalkingBit\Readable;

class RandomSyllableGenerator implements RandomGenerator
{

    public function generate(): string
    {
        return 'a';
    }
}
```

El siguiente requisito es que si hay más de una vocal, deben formar diptongo:

Esto es algo más largo de expresar:

```php
   public function testWhenTwoVowelsTheyMustFormDiphthong()
    {
        $generator = new RandomSyllableGenerator();
        $syllable = $generator->generate();
        $this->assertRegExp('/ai|au|ei|eu|ia|ie|io|iu|oi|ou|ua|ue|ui|uo/', $syllable);
    }
}
```
Por tanto, empezamos a implementar y llegamos a esta primera solución preliminar, que consiste en escoger una entre varias opciones de cada tipo:

```php
namespace TalkingBit\Readable;

class RandomSyllableGenerator implements RandomGenerator
{
    private const VOWELS = ['a', 'e', 'i', 'o', 'u'];
    private const DIPHTHONGS = [
        'ai',
        'au',
        'ei',
        'eu',
        'ia',
        'ie',
        'iu',
        'oi',
        'ou',
        'ua',
        'ue',
        'ui',
        'uo'
    ];
    public function generate(): string
    {
        return self::DIPHTHONGS[1];
    }
}
```

Pero esta solución no es satisfactoria. Tal como queda reflejada ahora no estamos usando las vocales y, sin embargo, el test pasa igualmente.

Parece más prometedor introducir un nuevo concepto llamado grupo vocálico, que englobe vocales únicas y diptongos. Eso implica que unimos las dos primeras especificaciones en una:

* Una sílaba debe tener siempre una vocal o dos que formen un diptongo.

Existen 14 [diptongos en español](https://es.wikipedia.org/wiki/Diptongo#Tipos_de_diptongos_en_espa%C3%B1ol) y, junto a las cinco vocales, dan un total de 19 grupos vocálicos que vamos a admitir en nuestro generador, que numerados como *zero indexed* nos da los extremos 0 y 18. Hemos decidido excluir los triptongos, para no liarlo mucho.

```php
namespace TalkingBit\Readable;

class RandomSyllableGenerator implements RandomGenerator
{
    private const VOWEL_GROUP = [
        'a', 'e', 'i', 'o', 'u',
        'ai', 'au',
        'ei', 'eu',
        'ia', 'ie', 'io', 'iu',
        'oi', 'ou',
        'ua', 'ue', 'ui', 'uo'
    ];
    public function generate(): string
    {
        return self::VOWEL_GROUP[1];
    }
}
```

La nueva implementación hace fallar el segundo test y eso es una buena noticia porque nos obliga a pensar una implementación más general.

Nuestro problema ahora es que todavía estamos en una implementación inflexible en la que siempre elegimos el mismo grupo vocálico, así que tenemos que encontrar una forma de seleccionarlo. Para eso necesitamos introducir un **RandomEngine** que lo escoja al azar.

¡Ah! Pero estamos en test, necesitamos poder predeterminar qué elemento va a seleccionar nuestro **RandomEngine**. Así que vamos a crear un doble a partir de su interfaz.

```php
namespace TalkingBit\Readable;

interface RandomEngine
{
    public function pickIntegerBetween(int $min, int $max): int;
}
```

Ya tenemos esta interfaz, suficiente para generar nuestro test double.

Ahora modificaremos nuestros tests para forzar que RandomSyllableGenerator lo utilice. Empecemos por el que está fallando:

```php
    public function testWhenTwoVowelsTheyMustFormDiphthong()
    {
        $engineProphecy = $this->prophesize(RandomEngine::class);
        $engineProphecy->pickIntegerBetween(0, 18)->willReturn(18);
        $generator = new RandomSyllableGenerator($engineProphecy->reveal());
        $syllable = $generator->generate();
        $this->assertRegExp('/ai|au|ei|eu|ia|ie|io|iu|oi|ou|ua|ue|ui|uo/', $syllable);
    }
```

De momento, seguirá fallando porque no hemos implementado nada. Así que vamos a hacerlo pasar:

```php
namespace TalkingBit\Readable;

class RandomSyllableGenerator implements RandomGenerator
{
    private const VOWEL_GROUP = [
        'a', 'e', 'i', 'o', 'u',
        'ai', 'au',
        'ei', 'eu',
        'ia', 'ie', 'io', 'iu',
        'oi', 'ou',
        'ua', 'ue', 'ui', 'uo'
    ];
    
    /** @var RandomEngine */
    private $randomEngine;

    public function __construct(RandomEngine $randomEngine)
    {
        $this->randomEngine = $randomEngine;
    }

    public function generate(): string
    {
        $pick = $this->randomEngine->pickIntegerBetween(0, count(self::VOWEL_GROUP) - 1);

        return self::VOWEL_GROUP[$pick];
    }
}
```

El segundo test ahora pasa, pero la nueva implementación nos obliga a cambiar el primero, que quedaría así:

```php
    public function testSyllableHasOneVowel()
    {
        $engineProphecy = $this->prophesize(RandomEngine::class);
        $engineProphecy->pickIntegerBetween(0, 18)->willReturn(0);
        $generator = new RandomSyllableGenerator($engineProphecy->reveal());
        $syllable = $generator->generate();
        $this->assertRegExp('/[aeiou]/', $syllable);
    }
```

Con este cambio, hemos conseguido implementar el grupo vocálico obligatorio en cada sílaba, testeando tanto los casos en que se genera una vocal única como los que se genera un diptongo.

Y ahora que tenemos los tests en verde, es momento de refactorizar. Entre otras cosas porque nuestros tests no son buenos.

Veamos: nuestros tests se basan en dos especificaciones que ahora hemos resumido en una sola. Por lo tanto, debería bastarnos con un único test que compruebe si el grupo vocálico es válido ya que podemos asumir que el RandonEngine, que estamos doblando, siempre nos va a permitir escoger un grupo válido de las opciones disponibles.

Por tanto, unificamos los tests en uno sólo, y aprovechamos para dejar el código un poco más limpio:

```php
namespace Tests\TalkingBit\Readable;

use PHPUnit\Framework\TestCase;
use TalkingBit\Readable\RandomEngine;
use TalkingBit\Readable\RandomSyllableGenerator;

class RandomSyllableGeneratorTest extends TestCase
{

    const VOWEL_GROUP_PATTERN = '/[aeiou]|ai|au|ei|eu|ia|ie|io|iu|oi|ou|ua|ue|ui|uo/';

    public function testASyllableHasOneVowelGroup()
    {
        $engineProphecy = $this->prophesize(RandomEngine::class);
        $engineProphecy->pickIntegerBetween(0, 18)->willReturn(4);
        $generator = new RandomSyllableGenerator($engineProphecy->reveal());
        $this->assertValidVowelGroup($generator->generate());
    }
    
    public function assertValidVowelGroup(string $syllable): void
    {
        $this->assertRegExp(self::VOWEL_GROUP_PATTERN, $syllable);
    }
}
```

#### Programando el mock de RandomEngine

Nos queda un punto problemático: ¿qué valor debe retornar el mock de RandomEngine?

En el test hemos puesto que devuelva 4, por ningún motivo especial. Podemos asumir que un RandomEngine devolverá siempre valores entre los límites que le indicamos, así que 4 es un valor tan bueno como cualquier otro entre 0 y 18.

En realidad, lo que nos preocupa aquí es que RandomSyllableGenerator llame al RandomEngine con los valores correctos.

### Añadiendo consonantes al principio de la sílaba

En nuestras especificaciones tenemos que las sílabas pueden comenzar, o no, por un grupo consonántico. En realidad, ocurre algo parecido al grupo vocálico. Podemos simplemente asumir que los valores válidos son el conjunto de las consonantes y el conjunto de los grupos de consonantes (por ejemplo, *br-* o *tr-*) que son válidos en español.

En total, tenemos 33 opciones, a las que hay que sumar la posibilidad de que la sílaba no comience por consonante, lo que daría un total de 34 posibilidades.

En último término podemos seguir la misma estrategia que usamos con las vocales, con la salvedad de que no es obligatorio que la sílaba comience por consonante. Como siempre, necesitamos enunciarlo en forma de test.

En esta ocasión el salto será un poco más grande de lo habitual, de modo que aquí va todo el test case, bastante arreglado:

```php
namespace Tests\TalkingBit\Readable;

use PHPUnit\Framework\TestCase;
use TalkingBit\Readable\RandomEngine;
use TalkingBit\Readable\RandomSyllableGenerator;

class RandomSyllableGeneratorTest extends TestCase
{

    const VOWEL_GROUP_PATTERN = '[aeiou]|ai|au|ei|eu|ia|ie|io|iu|oi|ou|ua|ue|ui|uo';
    const CONSONANT_GROUP_PATTERN = '[^aeiou]|bl|br|ch|cl|cr|fl|fr|ll|pr|pl|tr';

    public function testASyllableHasOneVowelGroup()
    {
        $engineProphecy = $this->prophesize(RandomEngine::class);
        $engineProphecy->pickIntegerBetween(0, 18)->willReturn(4);
        $engineProphecy->pickIntegerBetween(0, 33)->willReturn(0);
        $generator = new RandomSyllableGenerator($engineProphecy->reveal());
        $this->assertValidVowelGroup($generator->generate());
    }

    public function testASyllableCanStartWithOneConsonantGroup()
    {
        $engineProphecy = $this->prophesize(RandomEngine::class);
        $engineProphecy->pickIntegerBetween(0, 18)->willReturn(0);
        $engineProphecy->pickIntegerBetween(0, 33)->willReturn(0);
        $generator = new RandomSyllableGenerator($engineProphecy->reveal());
        $this->assertStartsWithConsonantGroup($generator->generate());
    }

    public function assertValidVowelGroup(string $syllable): void
    {
        $this->assertRegExp(sprintf('/%s/', self::VOWEL_GROUP_PATTERN), $syllable);
    }

    private function assertStartsWithConsonantGroup(string $syllable): void
    {
        $pattern = sprintf('/^(%s)%s/', self::CONSONANT_GROUP_PATTERN, self::VOWEL_GROUP_PATTERN);
        $this->assertRegExp($pattern, $syllable);
    }
}

```
En cuanto a la implementación, la sílaba que no empieza consonante puede puede simularse incluyendo un "grupo vacío", aunque hay otras posibilidades bastante obvias.

```php
namespace TalkingBit\Readable;

class RandomSyllableGenerator implements RandomGenerator
{
    private const VOWEL_GROUP = [
        'a',
        'e',
        'i',
        'o',
        'u',
        'ai',
        'au',
        'ei',
        'eu',
        'ia',
        'ie',
        'io',
        'iu',
        'oi',
        'ou',
        'ua',
        'ue',
        'ui',
        'uo'
    ];

    private const CONSONANT_GROUP = [
        'b',
        'c',
        'd',
        'f',
        'g',
        'h',
        'j',
        'k',
        'l',
        'm',
        'n',
        'ñ',
        'p',
        'q',
        'r',
        's',
        't',
        'v',
        'w',
        'x',
        'y',
        'z',
        'bl',
        'br',
        'ch',
        'cl',
        'cr',
        'fl',
        'fr',
        'll',
        'pr',
        'pl',
        'tr',
        ''
    ];

    /** @var RandomEngine */
    private $randomEngine;

    public function __construct(RandomEngine $randomEngine)
    {
        $this->randomEngine = $randomEngine;
    }

    public function generate(): string
    {
        return $this->pickAConsonant() . $this->pickAVowel();
    }

    private function pickAVowel(): string
    {
        $pick = $this->randomEngine->pickIntegerBetween(0, count(self::VOWEL_GROUP) - 1);

        return self::VOWEL_GROUP[$pick];
    }
    
    private function pickAConsonant(): string
    {
        $pick = $this->randomEngine->pickIntegerBetween(0, count(self::CONSONANT_GROUP));

        return self::CONSONANT_GROUP[$pick];
    }
}
```

### Y ahora, sílabas terminadas en consonante

Para terminar la generación de sílabas, seguiremos un procedimiento parecido




[Este hilo de Stack Exchange](https://softwareengineering.stackexchange.com/questions/127975/unit-testing-methods-with-indeterminate-output)
