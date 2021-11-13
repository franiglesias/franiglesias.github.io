---
layout: post
title: Cadena de responsabilidad
categories: articles
tags: php design-patterns
---

El patrón Cadena de Responsabilidad (Chain of Responsibility) nos permite manejar una petición que puede ser atendida por varios objetos, sin saber a priori cuál de ellos lo hará.

----
Este patrón es uno de los clásicos del libro de [Gang of Four](https://www.amazon.es/Design-Patterns-Elements-Reusable-Object-Oriented-ebook/dp/B000SEIBB8).

La cadena de responsabilidad puede ejemplificarse de una manera muy sencilla:

>– Hola, ¿Puedes ayudarme con este asunto?  
– ¡Hum! Lo siento, yo no puedo, pero conozco a alguien que podría.  
– Gracias. Voy a ver.  
– Hola, ¿Puedes ayudarme con este asunto?  
– Sí, por supuesto. Esta es la respuesta.  
– Gracias.

El problema que la Cadena de Responsabilidad resuelve es el de que tenemos un conjunto de objetos que podrían atender una petición, pero no sabemos a priori cuál de ellos lo hará. Por lo tanto, lo que hacemos es probar con uno de los objetos, si este no lo puede manejar, se lo pedimos al siguiente, y así sucesivamente hasta que uno de ellos nos puede dar la respuesta.

Los elementos de este patrón son:

* El cliente, que hace la petición
* Los objetos candidatos que pueden responderla

Cada uno de los objetos candidatos, mantiene un puntero (o referencia) a otro objeto, de modo que el primero que recibe la petición puede: o bien responderla, o bien delegársela al siguiente.

Esta estructura es una lista enlazada (linked list) de tipo FIFO (First In - First Out).

Hay que contemplar la situación de que ninguno de los objetos pueda responderla, o dicho de otro modo, que el último de los objetos consultados no tenga respuesta y no pueda delegar.

Para hacer esto, todos los objetos deben cumplir con una interfaz y ofrecer algunas funcionalidades comunes:

* El método que responde al mensaje.
* Un método para establecer el siguiente objeto de la cadena.
* Un método para delegar la respuesta en el siguiente objeto de la cadena.
* Una respuesta por defecto en caso de que ningún objeto pueda procesar la petición.

Si los objetos van a ser de la misma clase o de una familia de clases, puede ser buena idea sustituir la interfaz por una clase abstracta que proporcione la funcionalidad común

Si los objetos no van a ser de la misma clase, entonces nos interesa definir una interfaz, implementando la funcionalidad común en cada clase o bien mediante traits.

## Ejemplo

El servicio de comedor de un colegio tiene que atender a un gran número de estudiantes, por lo que es necesario organizarlos en varios turnos. Los criterios para realizar la asignación de cada estudiante a su turno dependen de varios factores: curso que estudia, día de la semana o participación en actividades extra escolares. El turno se debe asignar cada día, porque hay muchos estudiantes que usan el servicio solo en determinados días. En resumen: no podemos saber con antelación qué regla se aplicará para cada estudiante concreto.

En este caso he optado por utilizar el patrón de Cadena de Responsabilidad para realizar la asignación de turnos de comedor. Para cada estudiante se recorre la cadena de reglas hasta que una de ellas le asigna el turno.


```php
<?php 

namespace Milhojas\Domain\Cantine; 

use Milhojas\Domain\Utils\Schedule\WeeklySchedule; 

/**  
 * Represents a rule for turn assignation in the CantineService
 * If rule is applicable and conditions are met, the User is assigned to a Turn.
 */

class Rule
{ 
/**
 * Weekly Schedule in which this rule can be applied.
 *
 * @var WeeklySchedule
 */ 
private $schedule; 

/**
 * The Cantine Turn that this rule will assign.
 *
 * @var Turn
 */
private $turn; 

/**
 * The rule to delegate is current instance can assign a user.
 *
 * @var Rule 
 */ 

private $next; 

public function __construct(Turn $turn, WeeklySchedule $schedule,    CantineGroup $group, $enrolled, $notEnrolled)
    { 
        $this->turn = $turn;
        $this->schedule = $schedule;
        $this->group = $group;
        $this->enrolled = $enrolled;
        $this->noEnrolled = $notEnrolled;
        $this->next = null;
    }

    /**
     * If the rule applies and all conditions are met the User is assigned to the Turn on date specified.
     *
     * @param CantineUser $User
     * @param \DateTime   $date
     *
     * @return bool true if uesr was assigned
     */
    public function assignsUserToTurn(CantineUser $User, \DateTime $date)
    {
        if (!$this->isApplicable($date, $User)) {
            return $this->delegate($User, $date);
        }

        $this->turn->appoint($User);

        return $this->turn;
    }

    /**
     * Evaluates if all conditions are met to assign user to the Turn.
     *
     * @param \DateTime   $date
     * @param CantineUser $User
     *
     * @return bool true if all conditions are met
     */
    public function isApplicable(\DateTime $date, CantineUser $User)
    {
        return $this->isApplicableOnThisDate($date)
            && $this->isApplicableToTheGroupOfTheUser($User);
    }
    /**
     * Chains the next rule that should try to assign the turn.
     *
     * @param Rule $delegateTo
     */
    public function chain(Rule $delegateTo)
    {
        if (!$this->next) {
            $this->next = $delegateTo;

            return;
        }
        $this->next->chain($delegateTo);
    }

    /**
     * Rule can be applied to the Group to which the User belongs.
     *
     * @param CantineUser $User [Description]
     *
     * @return bool
     */
    private function isApplicableToTheGroupOfTheUser(CantineUser $User)
    {
        return $User->belongsToGroup($this->group);
    }
    /**
     * Rule can be applied on this date given its schedule.
     *
     * @param \DateTime $date [Description]
     *
     * @return bool
     */
    private function isApplicableOnThisDate(\DateTime $date)
    {
        return $this->schedule->isScheduledDate($date);
    }

    private function delegate(CantineUser $User, \DateTime $date)
    {
        if (!$this->next) {
            return false;
        }

        return $this->next->assignsUserToTurn($User, $date);
    }
}
```

Las reglas se cargan a partir de un archivo de configuración. Veamos en detalle las partes interesantes:

## Mantener una referencia al siguiente elemento de la cadena

El método de `Rule` en el que estamos interesados es `assignsUserToTurn`, el cual es el que realiza la asignación de turno del usuario del comedor que se le pasa. Si la primera`Rule` que recibe el mensaje lo puede asignar, lo hace, y si no, lo delega a la siguiente de la cadena, hasta llegar a una que lo pueda asignar o hasta agotar todas las reglas.

### Rule::next

La propiedad next contiene la siguiente regla de la cadena o null si no hay ninguna definida. Puesto que PHP no guarda los objetos en la variable, sino una referencia, lo que contiene realmente next es una referencia al siguiente objeto en la cadena. En otros lenguajes, se guarda un puntero el objeto siguiente.

Otro nombre para esta propiedad puede ser successor.

### Rule::chain


```php
/**
 * Chains the next rule that should try to assign the turn.
 *
 * @param Rule $delegateTo
 */
public function chain(Rule $delegateTo)
{
    if (!$this->next) {
        $this->next = $delegateTo;

        return;
    }
    $this->next->chain($delegateTo);
}
```

Este método podría llamarse también `setNext` o `setSuccessor`. El nombre `chain` me ayuda a recordar que se trata de una cadena.

El objeto que se pasa debe ser del mismo tipo o implementar la misma interfaz. Tenemos que contemplar el caso de que el actual eslabón de la cadena ya tenga un "sucesor", en cuyo caso, le pasamos el nuevo eslabón para que sea su sucesor. Los demás eslabones irán pasándoselo hasta encontrar uno que no tenga sucesor, que será el que lo enlace.

## Delegar en el sucesor

### Rule::delegate

Como señalábamos al principio, la cadena de responsabilidad se basa en que cada eslabón de la misma puede delegar en otro el procesamiento del mensaje si no puede dar una respuesta por sí mismo.

```php
private function delegate(CantineUser $User, \DateTime $date)
{
    if (!$this->next) {
        return false;
    }

    return $this->next->assignsUserToTurn($User, $date);
}
```

En nuestro ejemplo, el método privado `delegate` se encarga de hacer esta delegación, devolviendo `false`, en caso de no tener sucesor (pero lo mismo podría lanzar una excepción, devolver `null` o lo que más nos convenga.)

No es necesario tener este método `delegate`. En mi caso, creo que hace más legible el método principal (`Rule::assignsUserToTurn`), encapsulando todo lo necesario para la delegación.

En resumidas cuentas, si el objeto no puede dar una respuesta a `assignsUserToTurn` porque la regla no es aplicable, entonces lo que hace es delegar la petición. Si no tiene nadie a quien delegar, entonces devuelve una respuesta por defecto.

## Algunas reglas prácticas

Una señal de que podemos querer aplicar una Cadena de Responsabilidad es aquella situación en la que tenemos que recorrer un array de objetos hasta encontrar uno que puede manejar o responder al mensaje que le pasamos.

Si tenemos que pasar necesariamente por todos, el array puede ser una solución suficiente, recorriéndola con un bucle `foreach` o bien con `array_map` o `array_walk`.

 

 

 
