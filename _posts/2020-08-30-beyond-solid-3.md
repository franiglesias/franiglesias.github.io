---
layout: post
title: Más allá de SOLID, los consejos prácticos
categories: articles
tags: design-principles good-practices
---

Los principios SOLID están sobrevalorados y otras perlas de sabiduría práctica.

Los principios SOLID constituyen un buen sistema de principios, son muy coherentes, pero incompletos en mi opinión. En realidad, creo que faltan dos para tener un juego de criterios realmente potentes.

De uno ya hemos hablado: La ley de Demeter, o Principio de Mínimo Conocimiento. El otro es *Tell, don't ask*, que completa los **7 principios capitales del desarrollo de software orientado a objetos**.

## Tell, don't ask

No conozco otra formulación de este principio que suene un poco más formal. Lo enunciaron los *pragmáticos* Andy Hunt y Dave Thomas y dice más o menos esto:

*No deberías tomar decisiones basadas en el estado de un objeto al que llamas que resulten en el cambio de estado de ese objeto.*

Este principio tienen que ver con la encapsulación y la ocultación de información de OOP (*information hiding*). La mejor forma de explicarlo es con un ejemplo simple: Supongamos que tenemos un objeto `Score` para llevar la puntuación en un juego. Cuando la jugadora logra puntos, hay que incrementar `Score`. Esto puede hacerse así:

```php
$points = $this->player->score->points();
$this->player->score->setPoints($points + $newPoints);
```

Bien, estamos violando la Ley de Demeter, ¿no?. Resolvamos eso primero:

```php
// Player...

public function points() {
    return $this->score->points();
}

public function setPoints(int $points) {
    $this->score->setPoints($points);
}

//...

$points = $this->player->points();
$this->player->setPoints($points + $newPoints);
```

Hemos hecho que desde fuera de `Player` no tengamos que saber nada acerca de cómo se guardan internamente los puntos o lo que sea. Pero ahora sí tenemos una violación de *Tell, don't ask*. Básicamente estamos preguntando por un estado para cambiarlo.

Aplicando *Tell, don't ask*, la cosa debería ser algo más o menos así;

```php
$this->player->winPoints($newPoints);
```

Y ya.

Por dentro podría ser así, aunque desde fuera nos da igual la implementación:

```php
// Player...

public function winPoints(int $points) {
    $currentPoints = $this->score->points();
    $this->score->setPoints($currentPoints + $points);
}
```

Pero podemos hacerlo aún mejor, aplicando el mismo principio, lo que mueve las responsabilidades a donde realmente corresponden:

```php
// Player...

public function winPoints(int $points) {
    $this->score->incrementBy($points);
}
```

*Tell, don't ask* junto a la *Ley de Demeter* son dos poderosas herramientas para ayudar a poner las responsabilidades en los objetos correctos. 

De hecho, son una gran ayuda para empezar a modernizar un *legacy*. Típicamente nos vamos a encontrar este tipo de objetos anémicos que podremos alimentar adecuadamente de comportamientos significativos moviéndolos a los objetos adecuados.

Por eso, suelo pensar que los principios SOLID están sobrevalorados: están incompletos sin estos dos.

## Otras perlas de sabiduría

### Keep it simple stupid

Sin coma. Es un consejo de Kelly Jonhson que afirma que la mayoría de los sistemas funcionan mejor si se mantienen simples y sencillos. Es decir, sencillos en el sentido de estúpidos o lo más "tontos" posible.

Una formulación típica es la de "Keep it simple, stupid", que parece más graciosa, pero que es muy poco útil ya que no define la simplicidad.

La idea de la simpleza aquí es que el sistema necesite la menor cantidad de conocimiento posible, evitando suposiciones sobre lo que entregan o esperan recibir otros sistemas y reduciendo la complejidad de las soluciones. Es decir, nuestro sistema debería ser lo más estúpido, mecánico y predecible que podamos, lo que redundará en que será confiable, fácil de mantener y facil de testear. 

### Ley de Gall

En relación con el consejo anterior, John Gall dijo que un sistema complejo que funciona ha evolucionado sin excepción de un sistema más simple que funcionaba. Siempre tienes que empezar con un sistema simple que funcione.

Esta es la base del desarrollo iterativo: Preguntarse: ¿cuál es la forma más simple posible de conseguir esto? Y trabajar a partir de ahí.

### Falla rápido

Este consejo se atribuye a Jim Gray y dice que la responsabilidad de un módulo que falla rápido es detectar errores y dejar el módulo que está el siguiente nivel más alto decida qué hacer.

En la práctica, este consejo nos dice que un módulo que está al final en una cadena de llamadas debería detectar cuanto antes un error y enviarlo al módulo que lo ha llamado. Es éste quien debe responsabilizarse de dar una respuesta adecuada a ese error o pasarlo al siguiente módulo de mayor nivel. El módulo de bajo nivel no tiene que tener el conocimiento necesario para gestionar el error.

Fallar pronto se traduce en el uso de tácticas como cláusulas de guarda, lanzamiento de excepciones, y similares.

### DRY, Don't Repeat Yourself

Hunt y Thomas reformularon el Principio de Abstracción de Pierce, de una forma bastante interesante: *Cada fragmento de conocimiento debe tener una representación única, no ambigua y autoritativa dentro de un sistema*.

Este principio no se refiere a código. En realidad en un sistema el código se puede repetir muchas veces. El principio se refiere al conocimiento representado en el código. Complementa esto con los "7 principios capitales" y tendrás la clave para desarrollar software realmente valioso, mantenible y duradero.

### YAGNI, You ain't gonna need it

Ron Jeffries aconseja no añadir funcionalidad hasta que no la vayas a necesitar. Es tan simple, y tan difícil, como desarrollar solo aquello que necesitas para que las cosas funcionen y no pensar en lo que podría necesitarse en un futuro.

Lo que no quita que desarrolles con flexibilidad y capacidad de adaptación a los cambios del futuro. Se refiere a que no insertes funcionalidad en un sistema simplemente porque puedes y a lo mejor un día la podrías querer llegar a usar.

### Peor es mejor

Richard P. Gabriel afirmó que la calidad no necesariamente se incrementa con la funcionalidad. En muchos casos, el problema de intentar incorporar más funcionalidad a un sistema no lo hace mejor y es muy posible que para lograr esa incorporación de forma no justificada por las necesidades de las usuarias se tenga que disminuir su calidad general aumentando los puntos de posible rotura.

Si combinas este consejo con el anterior, lo que tienes es una herramienta para decidir cuando tiene sentido incorporar una funcionalidad a un software, algo que debería estar guiado fundamentalmente por la necesidades de sus consumidores y no por decisiones tomadas fuera de contexto, simplemente porque podemos o porque mola.
