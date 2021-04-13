---
layout: post
title: El drama de los objetos anémicos
categories: articles
tags: php design-principles good-practices
---

Pululan por nuestras bases de código como almas en pena, transportando datos de un lugar a otro. Sin embargo, podrían dar esplendor a nuestras aplicaciones si les damos un poco de atención.

En domain driven design se suele hablar del anti-patrón o *smell* del **modelo anémico**. Este anti-patrón ocurre cuando las entidades de dominio están diseñadas de tal modo que no son más que simples DTO, objetos que contienen estado, pero que no tienen apenas comportamiento de negocio, o simplemente no tienen ninguno en absoluto.

En esos casos, el comportamiento de negocio suele estar distribuido en diferentes tipos de objetos: servicios, managers, etc, los cuales se realizan su tarea preguntando a nuestras magras entidades sobre su estado y cambiándolo si es necesario.

Y esto no debería ser así. Luego veremos por qué.

Por otra parte, este tipo de situaciones no ocurre solo en el dominio. Podemos encontrar objetos anémicos en cualquier lugar de nuestro código y eso acaba generando una serie de problemas que a la larga acabarán manifestándose en forma de test frágiles, duplicación de conocimiento, responsabilidades disueltas y funcionamiento errático de la aplicación.

Pero empecemos por el principio.

## Objetos anémicos y cómo encontrarlos

Podríamos disponer todos los objetos de una aplicación en una escala que va desde aquellos que solo contienen estado hasta aquellos que solo contienen comportamiento.

En el primero de los extremos tenemos objetos como los DTOs, las Request y todo tipo de objetos-mensaje como los Eventos.

En el otro extremo tenemos objetos que no mantienen ningún tipo de estado y solo tienen comportamientos, algo que es característico de los Servicios o Use Cases.

Lejos de ser una dicotomía estricta, entre ambos extremos podríamos situar otros muchos objetos. Por ejemplo, las Entidades de dominio y los Value Objects mantienen estado y (deberían) realizar comportamientos.

Supongamos que estamos programando algún tipo de juego en el que se van ganando puntos al conseguir ciertos objetivos. La puntuación de la jugadora se modela con una clase Score que será un Value Object:

```php
class Score
{
    private $score;
    
    public function __construct()
    {
        $this->score = 0;
    }
    
    public function score(): int
    {
        return $this->score;
    }
    
    public function setScore(int $points): void
    {
        $this->score = $points;
    }
}
```

A primera vista todo parece en orden. Veámosla en funcionamiento:

```php
class IncreasePlayerScore
{
    public function execute(Player $player, Goal $goal)
    {
        $score = $player->score();
        
        $points = $goal->value();
        
        $currentScore = $score->score();
        $newScore = $currentScore + $points;
        $score->setScore($newScore);
    }
}
```

Really uggggly.

A lo mejor, podemos escribirlo de otra manera:

```php
class IncreasePlayerScore
{
    public function execute (Player $player, Goal $goal)
        {
            $player->score()->setScore($player->score()->score() + $goal->value());
        }
}
```

Algo huele a podrido en IncreasePlayerScore, pero ¿qué?

Los dos ejemplos de código funcionan, pero ambos lo consiguen de una forma alambicada y poco clara. Además, se presentan otros problemas.

Imagina que, aparte de conseguir logros, la jugadora obtiene puntos cada cierto tiempo porque en nuestro juego se reciben puntos por sobrevivir. Hummm:

```php
class IncreasePlayerScoreByTime
{
    public function execute(Player $player, PlayTime $playtime)
    {
        $player->score()->setScore($player->score()->score() + $playtime->bonus());
    }
}
```

¿Esto no es el mismo comportamiento? Se trata de incrementar la puntuación acumulada por nuestra jugadora en base a ciertos acontecimientos que suceden en el juego.

¿No puede pasar que también se pierdan puntos? Por supuesto, imaginemos que podemos recibir ataques que causan  un cierto daño y reducen nuestra puntuación:

```php
class DecreasePlayerScore
{
    public function execute(Player $player, Attack $attack)
    {
        $player->score()->setScore($player->score()->score() - $attack->damage());
        
        if($player->score()->score() < 0) {
            $player->die();
        } 
    }
}
```

Como puedes ver, empieza a definirse un patrón: nuestro Score es un objeto anémico (y puede que también nuestro Player, pero vayamos por partes). Veamos por qué:

### Apesta a Data Class

El *smell* [Data Class](https://refactoring.guru/smells/data-class) podría ser de aplicación aquí. Simplemente, ocurre que nuestra clase no tiene comportamientos, solo lleva datos, y para cambiar su estado tenemos que acceder al mismo, y volverlo a ajustar con un setter.

Lo podemos saber porque el código que usa el objeto primero pregunta por el estado y luego lo cambia.

Esto va en contra del principio de diseño "tell, don't ask" que, en esencia, dice que un objeto es el responsable de mantener su propio estado. 

### No respeta la Ley de Demeter

La ley de Demeter dice que un objeto solo debería hablar con otros objetos que conozca. Nuestros diversos objetos IncreasePlayerScore* solo conocen a Player y a otro objeto que indica la circunstancia que provoca la variación de puntos, pero realmente no conocen a Score y, por tanto, no deberían hablar con él.

Esto se manifiesta especialmente en los ejemplos en los que utilizamos cadenas de mensajes:

```php
$player->score()->score()
```

El método `Player->score()` devuelve un objeto Score, pero el código cliente no lo puede saber.

### El conocimiento se repite

Como se puede ver en los ejemplos anteriores, todos los servicios que modifican la puntuación repiten esa lógica. Aquí tenemos tres repeticiones, pero podría haber unas cuantas más fácilmente. Estas repeticiones generan los consabidos problemas de sostenibilidad del código: 

* Si la lógica precisa algún tipo de cambio en el futuro, son muchos puntos en donde hay que tocar y se nos puede pasar alguno por alto.
* Si ocurre algún error, tenemos que examinar un montón de lugares para encontrar la cause.

### Problemas de testeo

La lógica así montada presenta complicaciones para el testing. Para poder testear cada uno de los servicios nos vemos obligados a montar un objeto Player que nos devuelva el Objeto score, con unos valores determinados.  

En último término estos tests son tremendamente frágiles, complicados de montar y realmente no nos aportan información. Puedes encontrar una buena explicación de este problema en [este artículo de Samuele Lilli](https://labs.madisoft.it/about-testing-entity-state-changes-in-PHPSpec/).

## Quién tiene la responsabilidad

En el fondo tenemos un problema de asignación de responsabilidad. ¿Qué objeto debería ocuparse de mantener el estado de Score? ¡Pues el propio Score! Veamos cómo:

```php
class Score
{
    private $score;
    
    public function __construct()
    {
        $this->score = 0;
    }
    
    public function increase(int $points): void
    {
        $newScore = $this->score + $points;
        $this->setScore($newScore);
    }
    
    public function decrease(int $points): void
    {
        $newScore = $this->score - $points;
        $this->setScore($newScore);
    }
    
    public function score(): int
    {
        return $this->score;
    }
    
    private function setScore(int $points): void
    {
        $this->score = $points;
    }
}
```

Ahora Score encapsula los dos comportamientos básicos que puede tener: incrementarse y decrementarse. De este modo, arreglamos ya algunos problemas pues ahora podemos decirle a Score que cambie su estado, sin tener que preguntárselo antes. De hecho, hemos ocultado `setScore` para que nadie pueda fijar el estado de Score directamente.

```php
class IncreasePlayerScore
{
    public function execute(Player $player, Goal $goal)
    {
        $player->score()->increase($goal->value());
    }
}

class IncreasePlayerScoreByTime
{
    public function execute (Player $player, PlayTime $playtime)
    {
        $player->score()->increase($playtime->bonus());
    }
}

class DecreasePlayerScore
{
    public function execute(Player $player, Attack $attack)
    {
        $player->score()->decrease($attack->damage());
        
        if($player->score()->score() < 0) {
            $player->die();
        } 
    }
}
```

Ahora Score no es una Data Class, tiene comportamiento y es la única fuente de verdad sobre cómo se incrementa o disminuye su estado.

## Testing mejorado

Ahora podemos testear mucho mejor.  El comportamiento de la clase Score es fácil de testear unitariamente:

```php
class ScoreTest extends TestCase
{
    public function testShouldIncrease(): void
    {
        $score = new Score();
        $score->increase(100);
        $this->assertEquals(100, $score->score());
    }
    
    public function testShouldDecrease(): void
    {
        $score = new Score();
        $score->increase(100);
        $score->decrease(50);
        $this->assertEquals(50, $score->score());
    }
    
    //...
}

```

Y además es fácil de doblar para hacer los tests de los servicios.

Pero aún quedan más cosas.

## Cumpliendo la Ley de Demeter

Vayamos con Player, no sabemos mucho de esta clase pero en lo que respecta a Score, que es una propiedad de Player, podemos ver fácilmente que tenemos un problema de anemia por aquí: para modificar el score de un objeto Player tenemos que preguntarle primero y modificarlo a partir de la respuesta.

Esto nos fuerza a saltarnos la ley de Demeter en los servicios, haciendo una cadena de mensajes y eso que ahora ha mejorado bastante:

```php
class IncreasePlayerScore
{
    public function execute(Player $player, Goal $goal)
    {
        $player->score()->increase($goal->value());
    }
}
```

El caso es que Player debería ser responsable de los cambios de su Score y también debería ser capaz de informarnos de ese aspecto de su estado:

```php
class Player
{
    private $score;
    
    public function increaseScore(int $points): void
    {
        $this->score->increase($points);
    }
    
    public function decreaseScore(int $points): void
    {
        $this->score->decrease($points);
    }
    
    public function score(): int
    {
        return $this->score->score();
    }
}
```

Y esto mejora mucho las cosas:

```php
class IncreasePlayerScore
{
    public function execute(Player $player, Goal $goal)
    {
        $player->increaseScore($goal->value());
    }
}

class IncreasePlayerScoreByTime
{
    public function execute(Player $player, PlayTime $playtime)
    {
        $player->increaseScore($playtime->bonus());
    }
}

class DecreasePlayerScore
{
    public function execute(Player $player, Attack $attack)
    {
        $player->decreaseScore($attack->damage());
        
        if($player->score() < 0) {
            $player->die();
        } 
    }
}
```

Pero aún pueden ser mejores.

## Encapsulando las reglas

En las últimas líneas del ejemplo tenemos otra muestra de anemia: preguntamos al objeto por su estado para hacer algo con él. ¿Por qué ha de ser responsable el servicio que decrementa la puntuación? Se trata de un conocimiento que pertenece a Player.

```php
class Player
{
    private $score;
    
    public function increaseScore(int $points): void
    {
        $this->score->increase($points);
    }
    
    public function decreaseScore(int $points): void
    {
        $this->score->decrease($points);
        if($this->score() < 0) {
            $this->die();
        }        
    }
    
    public function score(): int
    {
        return $this->score->score();
    }
    
    public function isLive(): boolean
    {
        return $this->score() > 0;
    }
    
    public function die(): void
    {
       //...
    }
}
```

Así que ahora tenemos:

```php
class IncreasePlayerScore
{
    public function execute(Player $player, Goal $goal)
    {
        $player->increaseScore($goal->value());
    }
}

class IncreasePlayerScoreByTime
{
    public function execute(Player $player, PlayTime $playtime)
    {
        $player->increaseScore($playtime->bonus());
    }
}
class DecreasePlayerScore
{
    public function execute(Player $player, Attack $attack)
    {
        $player->decreaseScore($attack->damage());
    }
}
```

Como resultado:

* Todo el conocimiento y comportamiento relacionado con Player y Score está en esas clases, de modo que son la fuente de verdad sobre ellas mismas.
* Esas clases son fáciles de testear.
* Los servicios se limitan a orquestar la interacción con otros objetos y, en la mayoría de casos, acaban convirtiéndose en triviales en lo que respecta al comportamiento de negocio.

## Vida extra

Al mover comportamientos y responsabilidades fuera de los servicios nos encontramos con que estos se hacen más livianos (en cuanto a código) y más fáciles de leer y mantener.

Eso también nos facilita ver algunos *smells* más sutiles y posibilidades de mejorar el código que antes nos podrían haber pasado desapercibidos.

Por ejemplo, hay servicios literalmente duplicados, y es fácil argumentar que los tres servicios hacen exactamente lo mismo. 

Las clases Goal, PlayTime y Attack tienen un mismo efecto sobre Player y éste es que modifican su Score. Podrían implementar una misma interfaz, ¿no?

```php

interface AffectScoreInterface
{
    public function points(): int;
}
```

Para no liar el artículo voy a hacer que las clases implementen la interfaz usando sus métodos actuales. Se podría hacer lo mismo, y sería más SOLID, usando el patrón Adapter para no violar el principio Abierto/Cerrado.

```php
class Goal implements AffectScoreInterface
{
    public function points(): int
    {
        return $this->value();
    }
}

class PlayTime implements AffectScoreInterface
{
    public function points(): int
    {
        return $this->bonus();
    }
}

class Attack implements AffectScoreInterface
{
    public function points(): int
    {
        return -1 * $this->damage();
    }
}
```

Ahora podemos sustituir tres servicios por uno solo:

```php
class ChangePlayerScore
{
    public function execute(Player $player, AffectScoreInterface $scoreChanger)
    {
        $player->increaseScore($scoreChanger->points());
    }
}
```

Podríamos incluso eliminar los métodos `Player::decreaseScore` (aunque habría que mover parte de su funcionalidad al método `increaseScore`) y `Score::decrease`, y renombrar `Player::increaseScore` de modo que refleje mejor la intención, como `Player::changeScore`. Esto nos dejaría el servicio así:

```php
class ChangePlayerScore
{
    public function execute(Player $player, AffectScoreInterface $scoreChanger)
    {
        $player->changeScore($scoreChanger->points());
    }
}
```

Además, al haber generalizado a una interfaz ahora es muy fácil y económico añadir nuevos elementos al juego que afecten a la puntuación del jugador. Simplemente bastaría con añadir un nueva clase que implemente la interfaz `AffectScoreInterface` y ya está. Con el código original tendríamos que añadir la clase y un servicio, fijándonos además en si el efecto es incrementar o decrementar el marcador.

## Conclusiones: la anemia es mal síntoma

En resumen: a medida que los objetos desarrollan comportamientos más ricos y encapsulan mejor sus responsabilidades el código se hace más fácil de mantener, más testeable y más flexible para desarrollar nuevas implementaciones y más rápido en el futuro.







