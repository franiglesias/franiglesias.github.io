---
layout: post
subtitle: Patrones de diseño
title: El patrón visitante
categories: articles
tags: php design-patterns
---

El patrón visitante es uno de los que más difícil me ha resultado entender y aplicar, así que voy a escribir sobre él para afianzar el concepto.

En esencia, el patrón Visitante sirve para resolver un problema como el siguiente:

Supongamos que tenemos algún tipo de colección o estructura de objetos y queremos generar informes sobre la misma, pero no queremos añadir ni en la colección ni en las clases lógica específica para el informe, entre otras razones, porque tendríamos que añadir métodos específicos para cada tipo de informe y porque, de hecho, podríamos no saber con antelación que informes vamos a necesitar. Es decir, la colección o agregado de datos no debería saber mucho del generador del informe.

Así que lo que querríamos es conseguir que la clase que genera el informe maneje la lógica del informe haciendo uso de los datos que proporciona la colección de objetos.

A primera vista podríamos pensar, si se trata de una colección simple, en recorrerla mediante un `foreach`, lo que sería un enfoque válido en estructuras de tipo lista o array. Pero esto no nos sirve si se trata de una estructura compleja de datos agregados, ya que la clase generadora del informe tendría que tener un conocimiento bastante íntimo del agregado.

Y aquí es donde entra el patrón Visitante.

## Elementos

El patrón visitante tiene dos elementos principales:

* El **visitante (Visitor)** que es la clase interesada en utilizar el agregado.
* El **anfitrión o visitado (Visitee)** que es el agregado.

El visitante tendría un método `visit` en el cual recibe una instancia del visitado y lo utiliza mediante sus métodos públicos. El punto clave es que necesitamos un método `visit` por cada tipo de objeto que el visitante deba manejar. En otros lenguajes, el polimorfismo permite tener métodos con el mismo nombre y que se distinguen por recibir distintos tipos de parámetros, pero en PHP necesitaremos escribir un método adecuado para cada clase que deba manejar el visitante.

Los anfitriones tendrían un método  `accept` cuya única función sería llamar al método `visit` del Visitante pasándole una referencia a sí mismo (`$this` en PHP). A este patrón de relación entre dos clases se le llama **double dispatch** porque un objeto llama a otro para que éste llame de nuevo al primero. De esta forma conseguimos que un objeto miembro **privado** de otro, pueda pasarse a un solicitante externo.

En ambos casos, puede ser interesante definir clases abstractas que implementen la funcionalidad común (por ejemplo, el método `accept`) y establezcan métodos abstractos para el resto de métodos que serán requeridos.

## Un ejemplo sencillo

Un sistema de gestión de comedor de un colegio genera una lista de alumnos asistentes para cada día. Se nos pide generar varios informes a partir de la lista, como por ejemplo, contar los alumnos que asisten por etapa educativa y turno.

Una vez realizada selección de alumnos para la fecha específica y la asignación de turnos, teniendo en cuenta las ausencias y demás circunstancias, obtenemos una lista con todos los asistentes. Esta lista la hemos modelado mediante una estructura Heap, que nos sirve para mantener la lista ordenada. La SPL de PHP nos proporciona la clase base `SPLMinHeap` que nos da una Heap ordenada de menor a mayor, y la extendemos para tener la clase `CantineList`, la cual mantiene una colección de objetos de la clase `CantineListUserRecord`. Cada uno de ellos contiene la información correspondiente a cada usuario. Los métodos públicos de esta clase nos permiten obtener los datos necesarios.

Nuestro generador de informes será `TurnStageCantineListReport`, y su tarea será contar los usuarios de comedor por turno y etapa educativa (necesita poder preguntar a `CantineListUserRecord` por su turno y etapa). Otro generador de informes, por ejemplo, podría preguntar a `CantineListUserRecord` sobre las alergias alimentarias del alumno, para elaborar una lista de los platos especiales que se deben preparar.

Así que vamos a aplicar el patrón **Visitor**.

`TurnStageCantineListReport` será el **Visitor**. Está interesado en los datos que maneja `CantineList`, lo que supone tener acceso a los datos de `CantineListUserRecord`. Esta última clase será la anfitriona o visitada (**Visitee**, usando la terminología del patrón).

`TurnStageCantineListReport` necesita un método visit, que será `visitRecord`. Si tuviese que manejar otras clases dentro del agregado, tendríamos que añadir los métodos `visitXXX` correspondientes.

Como señalamos más arriba, es posible que tengamos necesidad de más tipos de informes, por lo tanto, nos interesaría que tanto `CantineList` como `CantineListUserRecord` sean capaces de aceptar visitas de todos ellos, de modo que necesitamos una abstracción que represente a todos nuestros generadores de informes. En PHP podemos realizar esta abstracción con una clase abstracta o con una interfaz, pero ya que en el caso del Visitor es muy posible que alguno de los métodos `visit` sea compartido por varios Visitors, nos vamos a decantar por una clase abstracta, que será `CantineListReport`.

En nuestro ejemplo, como veremos en el código, `CantineList` acepta visitas de `CantineListReport`, y se encarga de "guiarlo" para que visite a los distintos `CantineListUserRecord` que contiene. En otras palabras: `CantineListReport` no conoce la estructura interna de `CantineList`, por lo que necesita que esa esta quién dirija la visita.

El método `visitRecord` es más específico, ya que debe recabar distintos datos según el tipo de informe, por lo que lo definiremos en las clases finales que extienden `CantineListReport`.

## Ejemplos de código

### Visitante

Aquí tenemos la clase abstracta base de nuestro Visitor `CantineListReporter`.

```php
namespace Milhojas\Domain\Cantine\CantineList;

use Milhojas\Domain\Cantine\CantineList\CantineListUserRecord;

abstract class CantineListReporter
{
    abstract public function visitRecord(CantineListUserRecord $cantineListUserRecord);
}
```

Podríamos haberla definido como interface, pero queremos dejar abierta la posibilidad de que haya código compartido.

### Visitante concreto

```php
namespace Milhojas\Domain\Cantine\CantineList;

class TurnStageCantineListReporter extends CantineListReporter
{
    private $counters;
    private $totals;
    /**
     * Reset counters
     */
    public function __construct()
    {
        $this->counters = [];
        $this->totals = [];
    }

    /**
     * @param CantineListUserRecord $cantineListUserRecord
     */
    public function visitRecord(CantineListUserRecord $cantineListUserRecord)
    {
        $turn = $cantineListUserRecord->getTurnName();
        $stage = $cantineListUserRecord->getStageName();
        $this->initCounters($turn, $stage);
        ++$this->counters[$turn][$stage];
        ++$this->counters[$turn]['total'];
        ++$this->totals['all'];
        ++$this->totals[$stage];
    }

    /**
     * Get the counters
     * @return array
     */
    public function getReport()
    {
        return $this->counters;
    }

    /**
     * Get totals
     * @return array
     */
    public function getTotal()
    {
        return $this->totals;
    }

    /**
     * Starts the counters
     * @param mixed $turn
     * @param mixed $stage
     */
    private function initCounters($turn, $stage)
    {
        if (!isset($this->counters[$turn])) {
            $this->counters[$turn]['total'] = 0;
        }
        if (!isset($this->counters[$turn][$stage])) {
            $this->counters[$turn][$stage] = 0;
        }
        if (!isset($this->totals['all'])) {
            $this->totals['all'] = 0;
        }
        if (!isset($this->totals[$stage])) {
            $this->totals[$stage] = 0;
        }
    }
}
```

### El anfitrión

En realidad tenemos dos anfitriones. En primer lugar, CantineList, que es la que contiene los registros y debe guiar al visitante por ellos.

```php
namespace Milhojas\Domain\Cantine\CantineList;
use Milhojas\Domain\Cantine\CantineList\CantineListReporter;

/**
 * Represents the list of CantineUsers eating on a date, assigned to a Turn
 * The list is ordered by Turn and User List Name.
 */
class CantineList extends \SplMinHeap
{
    private $date;
    /**
     * @param \DateTimeInterface $date
     */
    public function __construct(\DateTimeInterface $date)
    {
        $this->date = $date;
    }

    /**
     * {@inheritdoc}
     */
    protected function compare($a, $b)
    {
        return -1 * $a->compare($b);
    }

    /**
     * @return \DateTime
     */
    public function getDate()
    {
        return $this->date;
    }

    /**
     * Accepts a CantineListReporter visitor to generate reports about the list itself
     *
     * @param CantineListReporter $cantineListReporter
     */
    public function accept(CantineListReporter $cantineListReporter)
    {
        foreach ($this as $record ) {
            $record->accept($cantineListReporter);
        }
    }
}
```

Y, finalmente, la clase visitada:

```php
namespace Milhojas\Domain\Cantine\CantineList;

use Milhojas\Library\Sortable\Sortable;
use Milhojas\Domain\Cantine\CantineList\CantineListReporter;
use Milhojas\Domain\Cantine\CantineUser;
use Milhojas\Domain\Cantine\Turn;
/**
 * A Data Transport Object to hold the representation of a Cantine User in a CantineList.
 */
class CantineListUserRecord implements Sortable
{
    private $date;
    private $turn;
    private $cantineUser;

    public function __construct($date, Turn $turn, CantineUser $cantineUser)
    {
        $this->date = $date;
        $this->turn = $turn;
        $this->cantineUser = $cantineUser;
    }

    public static function createFromUserTurnAndDate(CantineUser $cantineUser, Turn $turn, \DateTimeInterface $date)
    {
        $cantineListUserRecord = new CantineListUserRecord($date, $turn, $cantineUser);
        return $cantineListUserRecord;
    }

    /**
     * {@inheritdoc}
     */
    public function compare($object)
    {
        $compareTurns = $this->turn->compare($object->getTurn());
        if ($compareTurns != Sortable::EQUAL) {
            return $compareTurns;
        }

        return $this->cantineUser->compare($object->getUser());
    }

    public function getDate()
    {
        return $this->date;
    }

    public function getTurn()
    {
        return $this->turn;
    }


    public function getUser()
    {
        return $this->cantineUser;
    }

    public function getTurnName()
    {
        return $this->turn->getName();
    }

    public function getUserListName()
    {
        return $this->cantineUser->getListName();
    }

    public function getClassGroupName()
    {
        return $this->cantineUser->getClassGroupName();
    }

    public function getStageName()
    {
        return $this->cantineUser->getStageName();
    }

    public function getRemarks()
    {
        return $this->cantineUser->getRemarks();
    }

    public function accept(CantineListReporter $cantineListReporter)
    {
        $cantineListReporter->visitRecord($this);
    }
}
```

El método `accept` se limita a llamar al método `visitRecord` del Visitante y el objeto se pasa a sí mismo como argumento. De este modo, un objeto privado se convierte en accesible al visitante.

## Acoplamiento

El patrón **Visitor** implica aceptar un alto acoplamiento en los visitantes respecto a las clases anfitrionas, aunque es un coste asumible. Esto es debido a que **Visitor** necesita conocer algunas cosas de los objetos visitados, sus métodos públicos, pero también es cierto que normalmente los visitantes están específicamente interesados en unas clases muy concretas.

A cambio, tenemos la flexibilidad de crear tantos tipos de visitantes como necesitemos sin tener que alterar las clases anfitrionas. En nuestro ejemplo, podremos añadir nuevos informes extendiendo `CantineListReport`.
