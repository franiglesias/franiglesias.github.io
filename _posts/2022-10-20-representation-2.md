---
layout: post
title: Generar representaciones de un objeto sin exponer getters
categories: articles
tags: good-practices oop php
---

El problema: como obtener representaciones de un objeto, como DTO, serializaciones, etc., sin exponer _getters_ que únicamente se usarían para esa tarea.

Anteriormente, he considerado un par de aproximaciones como el [Presenter pattern](/presenter-pattern/) o el [Representation Pattern](/representation-pattern/), pero ninguna de las dos llegó a convencerme 100%. Sin embargo, la idea del Representation pattern estaba más o menos en el buen camino.

Ha sido tras leer el capítulo [Printers instead of getters](https://www.yegor256.com/2016/04/05/printers-instead-of-getters.html) del libro _Elegant Objects_ de Yegor Bugayenko, que las piezas han empezado a encajar. El libro de Bugayenko me provoca una mezcla de sensaciones. Expone un montón de ideas interesantes y que me han ayudado a cuestionar y mejorar la forma en que programo en orientación a objetos. Sin embargo, a veces pienso que no se explica lo suficientemente bien o los ejemplos son demasiado simples o mal escogidos como para facilitar la comprensión de sus propuestas. O simplemente puede que nuestra manera de trabajar la OOP tenga poco que ver con la original.

## El problema

La cuestión que quiero tratar en este artículo es cómo obtener representaciones de un objeto, como pueden ser DTO, serializaciones, etc., sin exponer la estructura interna del objeto, respetando el principio de _information hiding_.

La solución típica del problema de la representación pasa por... exponer la estructura del objeto. Bien sea a través de getters, bien sea usando reflection en herramientas de mapeo o serialización.

El problema común que tienen estas estrategias es que toman el objeto como un contenedor pasivo de información, de tal manera que para utilizarlas hay que olvidarse por completo de la orientación a objetos.

Así pues, ¿cómo obtener representaciones de objetos de una forma más compatible con OOP?

## Dar el control al objeto

¿Qué objeto es el más capacitado para generar una representación de sí mismo? Pues el _information expert_ sobre sí mismo, que es el propio objeto. Por tanto, el comportamiento de producir una representación debería ser del objeto en cuestión.

Por supuesto, hay algunos problemas. Muchos consumidores probablemente pedirán diferentes representaciones del objeto. Algunos querrán obtener DTO y además diferentes. Otros preferirán una representación serializada, que puede ser JSON, XML u otro formato. ¿Esto quiere decir que el objeto tiene que exponer métodos y tener el conocimiento para generar cada una de las posibles representaciones necesarias?

No, porque esto significaría el acoplamiento del objeto con sus potenciales consumidores. Incluso limitándonos a una selección de representaciones, tendríamos que introducir un montón de código destinado únicamente a estas tareas.

¿Y qué hacemos cuando queremos romper el acoplamiento directo entre objetos? Necesitamos introducir un _mediador_. El mediador permite limitar el acoplamiento de tal modo que el objeto solo tendrá que conocer al mediador, y no tiene necesidad de saber _quién_ está al otro lado.

El mediador, en nuestro caso, se ocupará de obtener la información necesaria para generar la representación deseada.

Todavía tenemos que resolver varios problemas. Veamos:

* ¿Cómo vamos a hacer que el mediador reciba los datos que necesita sin exponer la estructura del objeto?
* ¿Cómo resolvemos el problema de generar distintos tipos de representación?

La respuesta a la primera pregunta es el patrón _Visitor_, que nos permite dar control al objeto para pasar sus datos al representador.

La respuesta a la segunda pregunta es el patrón _Strategy_, que nos permite tener variaciones del algoritmo que genera la representación, seleccionadas por su consumidor.

Y la forma de hacerlo posible es aplicando el principio de Segregación de Interfaces, porque necesitaremos que nuestros generadores de representaciones implementen varias interfaces.

## Reconociendo el problema

Vamos a verlo con un ejemplo muy simple. Imaginemos esta clase PersonName, que representa el nombre de una persona.

```php
final class PersonName
{

    private string $name;
    private string $surname;

    public function __construct(string $name, string $surname)
    {
        $this->name = $name;
        $this->surname = $surname;
    }
}
```

Una de las posibles representaciones que querríamos tener es el _list name_, o sea, primero el apellido y luego el nombre, que es la forma habitual de mostrar listados ordenados.

La forma sencilla podría ser esta:

```php
class PersonNameTest extends TestCase
{
    /** @test */
    public function shouldBeRepresentedAsListName(): void
    {
        $name = new PersonName("Fran", "Iglesias Gómez");
        
        $this->assertEquals("Iglesias Gómez, Fran", $name->listName());
    }
}
```

Que se implementa así y solo expone el comportamiento de generar una representación, pero no expone los datos.

```php
final class PersonName
{

    private string $name;
    private string $surname;

    public function __construct(string $name, string $surname)
    {
        $this->name = $name;
        $this->surname = $surname;
    }

    public function listName(): string
    {
        return sprintf("%s, %s", $this->surname, $this->name);
    }
}
```

Ahora, si queremos la representación del _full name_ o nombre completo, añadiríamos un método más:

```php
<?php

namespace App\Tests;

use App\PersonName;
use PHPUnit\Framework\TestCase;

class PersonNameTest extends TestCase
{
    /** @test */
    public function shouldBeRepresentedAsFullName(): void
    {
        $name = new PersonName("Fran", "Iglesias Gómez");

        $this->assertEquals("Fran Iglesias Gómez", $name->fullName());
    }
}
```

Y la clase quedaría así:

```php
<?php

declare (strict_types=1);

namespace App;


final class PersonName
{

    private string $name;
    private string $surname;

    public function __construct(string $name, string $surname)
    {
        $this->name = $name;
        $this->surname = $surname;
    }

    public function listName(): string
    {
        return sprintf('%2$s, %1$s', $this->name, $this->surname);
    }

    public function fullName(): string
    {
        return sprintf('%1$s %2$s', $this->name, $this->surname);
    }
}
```

No exponemos los datos internos, pero tenemos un problema, ya que la clase `PersonName` tiene que saber acerca de sus posibles representaciones. Estamos añadiendo comportamientos que atañen a la responsabilidad de representar el objeto en distintos contextos y tendremos que añadir más métodos si tuviésemos que crear nuevas representaciones.

Por ejemplo, el DNI español incluye una representación del nombre que es algo así:

```php
<?php

namespace App\Tests;

use App\PersonName;
use PHPUnit\Framework\TestCase;

class PersonNameTest extends TestCase
{
    /** @test */
    public function shouldBeRepresentedAsDNI(): void
    {
        $name = new PersonName("Francisco José", "Iglesias Gómez");

        $this->assertEquals("IGLESIAS<GOMEZ<<FRANCISCO<JOSE", $name->dni());
    }
}
```

Y que podríamos implementar de esta manera:

```php
<?php

declare (strict_types=1);

namespace App;


final class PersonName
{

    private string $name;
    private string $surname;

    public function __construct(string $name, string $surname)
    {
        $this->name    = $name;
        $this->surname = $surname;
    }

    public function listName(): string
    {
        return sprintf('%2$s, %1$s', $this->name, $this->surname);
    }

    public function fullName(): string
    {
        return sprintf('%1$s %2$s', $this->name, $this->surname);
    }

    public function dni(): string
    {
        $fullName = mb_strtoupper(str_replace(' ', '<', sprintf('%2$s<<%1$s', $this->name, $this->surname)));

        return sprintf("%-'<31s", $fullName);
    }
}
```
 
Es decir, la clase `PersonName` tiene que contener un montón de código y exponer una gran cantidad de métodos para cumplir las necesidades de otros consumidores, que probablemente estarán en la capa de infraestructura y que tendrán diferentes razones para cambiar.

## El patrón Visitor

El patrón _Visitor_ se usa cuando un objeto, que llamaremos visitante (o visitor) necesita información de otro, que será el visitado, sin que se exponga la estructura interna.

Básicamente, el objeto visitado expone un método en el que puede recibir un visitante. El visitante, por su parte, expone métodos para el que visitado pueda inyectarle la información necesaria.

Vamos a introducir el patrón `Visitor` para resolver nuestro problema. Antes de nada una advertencia: este método puede verse excesivo para este caso concreto. Pero, precisamente porque el ejemplo es muy sencillo, será más fácil de entender.

Como estoy haciendo TDD y ahora estoy en fase de refactor, lo primero que voy a hacer es modificar los tests para que se centren más en el comportamiento y sea más fácil cambiar la implementación. También verifico que todos los tests siguen pasando.

```php
class PersonNameRepresentationTest extends TestCase
{
    /** @test */
    public function shouldBeRepresentedAsListName(): void
    {
        $this->assertListName(
            new PersonName("Fran", "Iglesias Gómez"),
            "Iglesias Gómez, Fran"
        );
    }

    /** @test */
    public function shouldBeRepresentedAsFullName(): void
    {
        $this->assertFullName(
            new PersonName("Fran", "Iglesias Gómez"),
            "Fran Iglesias Gómez"
        );
    }

    /** @test */
    public function shouldBeRepresentedAsDNI(): void
    {
        $this->assertDniName(
            new PersonName("Francisco José", "Iglesias Gómez"),
            "IGLESIAS<GÓMEZ<<FRANCISCO<JOSÉ"
        );
    }

    public function assertListName(PersonName $name, string $expected): void
    {
        $listName = $name->listName();
        $this->assertEquals($expected, $listName);
    }

    public function assertFullName(PersonName $name, string $expected): void
    {
        $fullName = $name->fullName();
        $this->assertEquals($expected, $fullName);
    }

    public function assertDniName(PersonName $name, string $expected): void
    {
        $dniName = $name->dni();
        $this->assertEquals($expected, $dniName);
    }
}
```

Voy a empezar creando un _Visitor_ que reproduzca toda la lógica de representación de `PersonName`. A falta de un nombre mejor, lo voy a llamar `PersonNamePrinter`.

```php
final class PersonNamePrinter
{
    private string $name;
    private string $surname;

    public function setName(string $name): void
    {
        $this->name = $name;
    }

    public function setSurname(string $surname): void
    {
        $this->surname = $surname;
    }
    
    public function listName(): string
    {
        return sprintf('%2$s, %1$s', $this->name, $this->surname);
    }

    public function fullName(): string
    {
        return sprintf('%1$s %2$s', $this->name, $this->surname);
    }

    public function dni(): string
    {
        $fullName = mb_strtoupper(str_replace(' ', '<', sprintf('%2$s<<%1$s', $this->name, $this->surname)));

        return sprintf("%-'<31s", $fullName);
    }
}
```

Sí, se parece mucho a PersonName, pero solo es una coincidencia. Ya veremos que al final será diferente.

Ahora, voy a introducir un cambio que me permita inyectar `PersonNamePrinter` para obtener los datos necesarios. No muestro los métodos `listName`, `fullName` y `dni` para no meter ruido, pero aún no los he eliminado.

```php
final class PersonName
{

    private string $name;
    private string $surname;

    public function __construct(string $name, string $surname)
    {
        $this->name    = $name;
        $this->surname = $surname;
    }

    public function fill(PersonNamePrinter $printer): PersonNamePrinter
    {
        $printer->setName($this->name);
        $printer->setSurname($this->surname);

        return $printer;
    }

    // Code removed for clarity
}
```

Ahora, cambio la implementación en los distintos tests. Este es el caso de `listName`. El test sigue pasando, demostrando que preservamos el comportamiento deseado:

```php
<?php

namespace App\Tests;

use App\PersonName;
use App\PersonNamePrinter;
use PHPUnit\Framework\TestCase;

class PersonNameRepresentationTest extends TestCase
{
    /** @test */
    public function shouldBeRepresentedAsListName(): void
    {
        $this->assertListName(
            new PersonName("Fran", "Iglesias Gómez"),
            "Iglesias Gómez, Fran"
        );
    }

    // Code removed for clarity

    public function assertListName(PersonName $name, string $expected): void
    {
        $printer = $name->fill(new PersonNamePrinter());
        $listName = $printer->listName();
        $this->assertEquals($expected, $listName);
    }

    // Code removed for clarity
}
```

Los demás tests se modifican igualmente y el TestCase queda así:

```php
<?php

namespace App\Tests;

use App\PersonName;
use App\PersonNamePrinter;
use PHPUnit\Framework\TestCase;

class PersonNameRepresentationTest extends TestCase
{
    /** @test */
    public function shouldBeRepresentedAsListName(): void
    {
        $this->assertListName(
            new PersonName("Fran", "Iglesias Gómez"),
            "Iglesias Gómez, Fran"
        );
    }

    /** @test */
    public function shouldBeRepresentedAsFullName(): void
    {
        $this->assertFullName(
            new PersonName("Fran", "Iglesias Gómez"),
            "Fran Iglesias Gómez"
        );
    }

    /** @test */
    public function shouldBeRepresentedAsDNI(): void
    {
        $this->assertDniName(
            new PersonName("Francisco José", "Iglesias Gómez"),
            "IGLESIAS<GÓMEZ<<FRANCISCO<JOSÉ"
        );
    }

    public function assertListName(PersonName $name, string $expected): void
    {
        $printer = $name->fill(new PersonNamePrinter());
        $listName = $printer->listName();
        $this->assertEquals($expected, $listName);
    }

    public function assertFullName(PersonName $name, string $expected): void
    {
        $printer = $name->fill(new PersonNamePrinter());
        $fullName = $printer->fullName();
        $this->assertEquals($expected, $fullName);
    }

    public function assertDniName(PersonName $name, string $expected): void
    {
        $printer = $name->fill(new PersonNamePrinter());
        $dniName = $printer->dni();
        $this->assertEquals($expected, $dniName);
    }
}
```

Por supuesto, pasan todos los tests, así que puedo quitar unos cuantos métodos a `PersonName`:

```php
<?php

declare (strict_types=1);

namespace App;


final class PersonName
{

    private string $name;
    private string $surname;

    public function __construct(string $name, string $surname)
    {
        $this->name    = $name;
        $this->surname = $surname;
    }

    public function fill(PersonNamePrinter $printer): PersonNamePrinter
    {
        $printer->setName($this->name);
        $printer->setSurname($this->surname);

        return $printer;
    }
}
```

Y esto es un sencillo patrón _Visitor_: el objeto `PersonName` tiene el control de la información que le pasa a `PersonNamePrinter`, que es el _Visitor_, y no tiene que exponer nada de su estructura interna. Además, `PersonNamePrinter` puede utilizarse en otros contextos porque sabe nada de que sea `PersonName` quien le proporciona la información.

Aun así, sigue habiendo un problema. `PersonName` y `PersonNamePrinter` saben demasiado uno del otro. ¿Por qué? Porque en realidad, `PersonNamePrinter` está exponiendo su estructura interna con los _setters_ y, en consecuencia, se genera un acoplamiento. En cierto modo, `PersonNamePrinter` está dirigiendo a `PersonName` porque le indica que espera ciertos datos.

¿Cómo hacer que `PersonName` sea quien dirige? Pues buscando una manera en que pueda comunicar a su _Visitor_ algo así como: "Yo te paso estos datos que considero que son adecuados para que hagas mi representación, tú ya te las arreglas".

Y el objeto _Visitor_ recibe esos datos y los revisa para ver si alguno le sirve para lo que tiene que hacer. No sabe mucho sobre ellos, pero puede haber un cierto acuerdo.

Por ejemplo, un acuerdo en la forma de pasar estos datos. Podría ser una etiqueta que los identifique y su valor. Por ejemplo, algo como esto:

```php
<?php

declare (strict_types=1);

namespace App;


final class PersonNamePrinter
{
    private string $name;
    private string $surname;

    // Code removed for clarity

    public function fill(string $field, string $value): void
    {
        if ($field === 'name') {
            $this->name = $value;
        }

        if ($field === 'surname') {
            $this->surname = $value;
        }
    }
    
    // Code removed for clarity
}
```

De este modo, solo `PersonName` sabe qué datos se pasan a `PersonNamePrinter`. `PersonNamePrinter`, por su parte, buscará obtener ciertos datos del input que se le proporcionen y puede que estén o no. Pero ya será cuestión suya si tiene información incompleta.

Hagamos el cambio en `PersonName` para ver si todo sigue funcionando como es debido.

```php
final class PersonName
{

    private string $name;
    private string $surname;

    public function __construct(string $name, string $surname)
    {
        $this->name    = $name;
        $this->surname = $surname;
    }

    public function fill(PersonNamePrinter $printer): PersonNamePrinter
    {
        $printer->fill('name', $this->name);
        $printer->fill('surname', $this->surname);

        return $printer;
    }
}
```

Con este cambio, los tests pasan y hemos logrado nuestros primeros objetivos:

* `PersonName` controla la información que se puede representar
* `PersonName` no expone su estructura interna

Ahora podemos centrarnos en otros problemas.

## Variaciones protegidas

El primer problema evidente es que `PersonName` está acoplado a un detalle de implementación como es `PersonNamePrinter`, así que deberíamos aflojar este acoplamiento mediante una _interface_.

Una buena _interface_ se define por las necesidades de sus consumidores, así que en lugar de pensar que podemos usar `PersonNamePrinter` como base nos fijaremos en qué necesita saber `PersonName`. Y esto es bastante poquito: que puede pasarle información mediante pares _etiqueta-valor_.

Ponerle nombre a esta _interface_ tiene su miga. Por un lado, podría hacer referencia al hecho de que es una representación. Pero por otro, la _interface_ se centrará en la parte del _rellenado_ de datos. ¿Qué tal `Fillable`?

```php
<?php

declare (strict_types=1);

namespace App;

interface Fillable
{
    public function fill(string $field, string $value): void;
}
```

Y podemos hacer el cambio en `PersonName` sin mayor problema, dado que basta con que el objeto que se pasa la implemente.

```php
final class PersonName
{

    private string $name;
    private string $surname;

    public function __construct(string $name, string $surname)
    {
        $this->name    = $name;
        $this->surname = $surname;
    }

    public function fill(Fillable $printer): Fillable
    {
        $printer->fill('name', $this->name);
        $printer->fill('surname', $this->surname);

        return $printer;
    }
}
```

¿Es esta la mejor forma posible de que un objeto de dominio alimente a un objeto que va a generar una representación? Posiblemente, para casos como este sea más que suficiente. El problema llega con objetos que tengan una estructura compleja, como pueden ser los agregados. Piensa en una factura, que contiene sus propios datos, líneas de conceptos, totales, y datos de clientes. En ese caso, la raíz del agregado será la encargada de coordinar la representación, delegando a sus miembros cuando sea necesario. Analizaremos esos problemas en otra entrega, para no desviarnos ahora.

Ya tenemos una _interface_ que aligera al máximo el acoplamiento entre los objetos de dominio y los representadores. Cierto: tener una `interface` nos habilita tener varias implementaciones intercambiables lo que nos permite resolver el siguiente problema, que no es otro que tener un _objeto dios_.

`PersonNamePrinter` se encarga de todas las representaciones que hemos definido sobre `PersonName`. Esto tiene varias consecuencias negativas:

* Sus consumidores probablemente solo querrán usar una de las representaciones, por lo que arrastrarán métodos que no necesitan. Esto es una violación del principio de _segregación de interfaces_.
* Si se necesita una nueva representación es necesario modificar la clase, lo que va en contra del principio _abierto para extensión y cerrado para modificación_.
* Diferentes consumidores pueden estar interesados en diferentes interfaces. Por ejemplo, un repositorio implementado con un ORM podría querer representaciones que fueran entidades del ORM, en forma de DTO. Mientras tanto, un controlador querría una serialización JSON para devolver como payload en una API. Básicamente, esto es el principio de responsabilidad única, ya que cada posible consumidor tiene diferentes motivos para pedir cambios.

Así que vamos a romper en pedacitos `PersonNamePrinter`.

La condición que nos interesa mantener es que las clases que salgan de esta fragmentación implementen la _interface_ `Fillable`. Y ahora me dirás... ¿No tendríamos que añadir métodos a `Fillable` para eso? O al menos ¿no deberíamos crear una nueva interfaz para representar que estos objetos generan representaciones o algo?

La respuesta es no.

Recordemos: las _interfaces_ se definen por las necesidades de sus consumidores. El único "consumidor" que tenemos es `PersonName` y ya hemos definido una _interface_. Por lo que respecta a `PersonName`, los `Fillables` pueden exponer otros métodos de los que obtener la representación que generan y ser cada uno diferente. En nuestro ejemplo, da la casualidad de que todos generan un tipo `string`, pero eso no tiene por qué cumplirse.

Así que vamos al lío.

Seguimos teniendo nuestro test y está pasando, así que podemos empezar a mover código. Veamos el caso del _list name_. Podemos crear una clase `ListNamePrinter`.

```php
final class ListNamePrinter implements Fillable
{
    private string $name;
    private string $surname;

    public function fill(string $field, string $value): void
    {
        if ($field === 'name') {
            $this->name = $value;
        }

        if ($field === 'surname') {
            $this->surname = $value;
        }
    }

    public function print(): string
    {
        return sprintf('%2$s, %1$s', $this->name, $this->surname);
    }
}
```

Y reemplazamos `PersonNamePrinter` en el test para comprobar que el cambio no afecta al comportamiento:

```php
<?php

namespace App\Tests;

use App\ListNamePrinter;
use App\PersonName;
use App\PersonNamePrinter;
use PHPUnit\Framework\TestCase;

class PersonNameRepresentationTest extends TestCase
{
    /** @test */
    public function shouldBeRepresentedAsListName(): void
    {
        $this->assertListName(
            new PersonName("Fran", "Iglesias Gómez"),
            "Iglesias Gómez, Fran"
        );
    }

    // Code removed for clarity
    
    public function assertListName(PersonName $name, string $expected): void
    {
        $printer = $name->fill(new ListNamePrinter());
        $listName = $printer->print();
        $this->assertEquals($expected, $listName);
    }

    // Code removed for clarity
}
```

Hacemos lo mismo para los otros dos métodos, extraemos una clase por cada método. Aquí están las dos que nos faltan:

```php
final class FullNamePrinter implements Fillable
{
    private string $name;
    private string $surname;

    public function fill(string $field, string $value): void
    {
        if ($field === 'name') {
            $this->name = $value;
        }

        if ($field === 'surname') {
            $this->surname = $value;
        }
    }

    public function print(): string
    {
        return sprintf('%1$s %2$s', $this->name, $this->surname);
    }
}
```

```php
final class OCRDniPrinter implements Fillable
{
    private string $name;
    private string $surname;

    public function fill(string $field, string $value): void
    {
        if ($field === 'name') {
            $this->name = $value;
        }

        if ($field === 'surname') {
            $this->surname = $value;
        }
    }


    public function ocr(): string
    {
        $fullName = mb_strtoupper(str_replace(' ', '<', sprintf('%2$s<<%1$s', $this->name, $this->surname)));

        return sprintf("%-'<31s", $fullName);
    }
}
```

De este modo, el test case quedaría así:

```php
class PersonNameRepresentationTest extends TestCase
{
    /** @test */
    public function shouldBeRepresentedAsListName(): void
    {
        $this->assertListName(
            new PersonName("Fran", "Iglesias Gómez"),
            "Iglesias Gómez, Fran"
        );
    }

    /** @test */
    public function shouldBeRepresentedAsFullName(): void
    {
        $this->assertFullName(
            new PersonName("Fran", "Iglesias Gómez"),
            "Fran Iglesias Gómez"
        );
    }

    /** @test */
    public function shouldBeRepresentedAsDNI(): void
    {
        $this->assertDniName(
            new PersonName("Francisco José", "Iglesias Gómez"),
            "IGLESIAS<GÓMEZ<<FRANCISCO<JOSÉ"
        );
    }

    public function assertListName(PersonName $name, string $expected): void
    {
        $printer  = $name->fill(new ListNamePrinter());
        $listName = $printer->print();
        $this->assertEquals($expected, $listName);
    }

    public function assertFullName(PersonName $name, string $expected): void
    {
        $printer  = $name->fill(new FullNamePrinter());
        $fullName = $printer->print();
        $this->assertEquals($expected, $fullName);
    }

    public function assertDniName(PersonName $name, string $expected): void
    {
        $printer = $name->fill(new OCRDniPrinter());
        $dniName = $printer->ocr();
        $this->assertEquals($expected, $dniName);
    }
}
```

Y como `PersonNamePrinter` ya no es necesario, lo podemos eliminar.

Vamos ahora con la discusión.

### Código repetido ¿No podríamos extraer una clase abstracta?

No. Este es un gran ejemplo de duplicación de código que no indica una abstracción. Es cierto que en las tres clases el método `fill` es exactamente igual y la estructura de datos interna es exactamente la misma. La única razón para extraer la clase abstracta sería compartir código y es una mala idea. De hecho, compartirían el código que implementa la interfaz `Fillable`.

Es mala idea porque entonces las tres clases quedarían acopladas a la clase base, impidiendo su evolución separada. La cuestión es que es muy posible que las tres clases sean usadas desde distintos lugares de la aplicación que no tienen nada que ver entre sí. Por tanto, hacerlas descender de una misma clase abstracta crearía acoplamientos horizontales entre módulos distintos.

Es posible, también, que nos interese que la estructura interna sea diferente porque es más adecuada para los fines de esa representación concreta o para su implementación.

### ¿Y no deberían implementar una _interface_ para poder intercambiarlos?

No hay necesidad. De hecho, puede ser un problema para los lenguajes con tipado estricto, ya que, como hemos mencionado antes, podrías querer representaciones de distintos tipos.

Esto no impide que haya situaciones en las que te interese que algunos de estos objetos implementen una misma interfaz, definida por sus consumidores. Pero no nos obliga a que todas las representaciones la implementen. Normalmente, verás que cada representación tiene solo un consumidor por lo que no tendrá mucho sentido crear una _interface_. Sería YAGNI y generará más problemas que soluciones.

### En resumen

Hemos solucionado los problemas que se mencionaban al principio:

* Segregación de interfaces: cada representación expone dos interfaces pequeñas: una explícita (`Fillable`) para poder recibir los datos necesarios, la otra, implícita, la define su consumidor para poder obtener la representación.
* Responsabilidad única: cada representación expone una sola forma de representar la información.
* Abierto/Cerrado: podemos añadir nuevas representaciones si otros consumidores las requieren.

## Open for extension

Es muy fácil añadir nuevas representaciones. Supongamos que necesitamos mapear nuestro objeto a un DTO para guardarlo en una base de datos.

```php
class PersonNameRepresentationTest extends TestCase
{
    // Code removed for clarity

    /** @test */
    public function shouldBeRepresentedAsDTO(): void
    {
        $this->assertDto(
            new PersonName("Fran", "Iglesias Gómez"),
            new DBPersonName("Fran", "Iglesias Gómez")
        );
    }


    // Code removed for clarity

    public function assertDto(PersonName $name, DBPersonName $expected): void
    {
        $printer = $name->fill(new MapToORMEntity());
        $dniName = $printer->dto();
        $this->assertEquals($expected, $dniName);
    }
}
```
Aquí tenemos el DTO.

```php
final class DBPersonName
{
    public function __construct(private string $name, private string $surname) {}

    public function name(): string
    {
        return $this->name;
    }

    public function surname(): string
    {
        return $this->surname;
    }
}
```

Y este es el generador de la representación.

```php
final class MapToORMEntity implements Fillable
{
    private string $name;
    private string $surname;

    public function fill(string $field, string $value): void
    {
        if ($field === 'name') {
            $this->name = $value;
        }

        if ($field === 'surname') {
            $this->surname = $value;
        }
    }

    public function dto(): DBPersonName
    {
        return new DBPersonName($this->name, $this->surname);
    }
}
```

Puedes usar la misma metodología para crear serializaciones y cualquier otra representación que necesites.

## Fin de la primera parte: qué nos falta y cómo seguir

La representación de objetos de dominio sin exponer sus propiedades internas es un tema que genera bastante inquietud.

Por una parte, tendemos a adoptar un enfoque procedural, tratando de acceder a esas propiedades internas de una forma u otra, violando el principio de _ocultación de información_ característico de la orientación a objetos. 

Por otro lado, nos suele molestar la buena cantidad de trabajo rutinario que suele implicar este tipo de representaciones y también tendemos a buscar soluciones que sirvan para todos los casos.

Sin embargo, para ser fieles a la orientación a objetos tenemos que ceder a los propios objetos el control de sus representaciones.

Supongo que a estas alturas estarás pensando en "uuuh, sobre ingeniería". Sin embargo, creo que no hay sobre ingeniería en esta solución, y sí muchas ventajas:

* Tenemos muchas clases (es verdad).
* Son clases muy pequeñitas y especializadas, fáciles de testear y reutilizables.
* El objeto de dominio no expone nada interno.
* El objeto de dominio tiene una mínima lógica relacionada con la representación y controla qué información comparte y cuál no.
* Podemos generar cuantas representaciones necesitemos sin tocar nada del código que ya está en producción.

La cuestión que nos queda por revisar es cómo aplicar estos patrones en el caso de objetos agregados. Lo dejaremos para más adelante.

[En este repositorio tienes los ejemplos de código](https://github.com/franiglesias/representation-pattern)
