---
layout: post
title: Refactorizar trata sobre conocimiento y significado
categories: articles
tags: php good-practices legacy
---

Refactorizar es más que una tarea técnica. Refactorizar tiene valor de negocio porque su función principal es asegurar que el lenguaje y el conocimiento del negocio están reflejados en el código.

## Legacy es código sin tests

Esta cita de Michael Feathers puede parecer exagerada pero es una buena definición de lo que significa enfrentarse a código legacy. La inexistencia de tests refleja nuestro desconocimiento de cómo funciona ese código y es ese desconocimiento lo que está en la base de nuestros problemas con el legacy.

De vez en cuando, hemos podido decir o escuchar que no tenemos una idea clara de cómo funciona un código que está en producción, o incluso nos preguntamos cómo es posible que funcione, para empezar. Aunque trabaje con normalidad, son frecuentes los errores extraños y difíciles de depurar. Los tests, de haberlos, nos proporcionarían la información que el código no es capaz de comunicar o, al menos, nos permitirían proceder a un refactor que nos ayude a organizarlo mejor.

Pero, puesto que no siempre contamos con ellos, ¿es posible hacer refactor sin tests?

## Refactorizar sin tests

Es posible hacer refactor sin tests, al menos dentro de ciertos límites y como paso previo a comenzar a cubrir ese código con ellos.

Fundamentalmente, tenemos las herramientas de refactor automático que nos proporciona el IDE, las cuales, por lo general, nos proporcionan un cierto número de refactors seguros en el sentido de que no alterarán el comportamiento del código. Incluso no teniendo tests, podremos fiarnos de esos cambios.

Esa confianza se refuerza si tenemos en cuenta los límites de aplicación de ese refactor. Por ejemplo, si cambio el nombre de un método privado en una clase para que sea más descriptivo, puedo estar seguro de que ese cambio no va a afectar a otras partes del código. Lo mismo ocurre si extraigo métodos para modularizar otros métodos muy extensos.

Pero, ¿por qué refactorizar un código que funciona? ¿Qué valor aporta?

Refactorizamos principalmente para reflejar el conocimiento que tenemos del código.

Cuando estudiamos un código legacy, normalmente con el objetivo de corregir problemas o añadir alguna funcionalidad, vamos desarrollando nuestro conocimiento de cómo funciona. En ocasiones, podemos interpretar lo que el código hace leyéndolo. En otras, establecemos hipótesis sobre cómo creemos que funciona y tratamos de corroborar eso con los resultados que nos proporciona.

En ese momento podemos refactorizar para conseguir dos objetivos principales:

* Reflejar nuestro conocimiento creciente de cómo funciona el código, reescribiéndolo de una forma más inteligible.
* Poner el sistema en un estado testeable.

## Refactor como reflejo del conocimiento sobre el código

A medida que leemos código nos vamos haciendo una idea de cómo funciona y qué representa cada uno de los símbolos que nos encontramos en él. La cuestión es ¿dónde se guarda ese conocimiento? ¿Sólo en nuestra cabeza?

Refactorizar es el medio que tenemos para poner nuestro conocimiento sobre el código en el propio código.

Veamos un ejemplo sencillo. Supongamos el siguiente fragmento:

```php
$this->userRepository->save($user);
$message = new Message();
$message->setTo($user->email());
$this->mailer->send($message);
```

Por el contexto y haciendo pruebas seguramente lleguemos a la conclusión de que `$message` se refiere a un mensaje de confirmación de que el usuario ha sido creado en el sistema.

Así que podríamos perfectamente cambiar el nombre de la variable para reflejar eso que hemos aprendido:

```php
$this->userRepository->save($user);
$confirmationMessage = new Message();
$confirmationMessage->setTo($user->email());
$this->mailer->send($confirmationMessage);
```
O incluso, de una forma más específica:

```php
$this->userRepository->save($user);
$userWasCreatedMessage = new Message();
$userWasCreatedMessage->setTo($user->email());
$this->mailer->send($userWasCreatedMessage);
```

Este refactor (rename) no cambia la funcionalidad, pero hace que el código describa con mayor precisión lo que está pasando. Si en el código original era necesario hacer un esfuerzo para interpretar lo que estaba ocurriendo, en la versión refactorizada ese esfuerzo no es necesario, ya que el código es lo suficientemente explícito sobre ello.

Además, al haber recogido ese conocimiento en el propio código, en el futuro será más fácil intervenir sobre él, lo que ahorrará tiempo y esfuerzo.

## Refactors aplicados

### Cambiar nombres

Poner nombres a las cosas tiene una injusta [mala fama en el mundo de la programación](http://hilton.org.uk/blog/why-naming-things-is-hard).

Cambiar el nombre nos permite reflejar el conocimiento que tenemos del sistema en el propio código, eliminando ambigüedades, nombres demasiado genéricos, inadecuados o equívocos.

En el apartado anterior hemos mostrado un ejemplo de refactor por cambio de nombre. Aquí tenemos otro, en el que cambiamos un nombre demasiado genérico por otro que describe con precisión qué hacemos con el archivo.

```php
public function processFile($file);

// vs

public function extractProductInformationFromFile($file);
```

Hace décadas, cuando el coste de la memoria y almacenamiento eran elevadísimos teníamos que economizar con nombres de variable crípticos de una sola letra. Desde hace tiempo podemos, y debemos, permitirnos nombres expresivos para cualquier elemento de programación.

Supongamos un bucle `for`:

```php
for ($i = 0; $i <= $max, $i++) {
    fwrite($file, $lines[$i]);
}
```

¿Qué nos dice este código? Aparentemente nos habla de una colección de líneas en un array y que se escriben una por una en un fichero hasta alcanzar un máximo. ¿por qué no decirlo con todas las letras?

```php
for ($line = 0; $line <= $maxLines, $line++) {
    fwrite($file, $lines[$line]);
}
```

De nuevo, nombres más explícitos nos permiten una lectura más fácil y unívoca del código.

Un tercer ejemplo. Supongamos un algoritmo simple para emparejar rivales en una competición deportiva:

```php
foreach ($teams as $t1) {
    foreach ($teams as $t2) {
        if ($t1 === $t2) {
            continue;
        }
        $matches[] = [$t1, $t2];
    }
}
```

Aunque no es feo del todo, ¿no resulta mucho más fácil de leer lo siguiente?

```php
foreach ($teams as $local) {
    foreach ($teams as $visitor) {
        if ($local === $visitor) {
            continue;
        }
        $matches[] = [$local, $visitor];
    }
}
```

En resumen, cambiar nombres conlleva:

* Reflejar nuestro conocimiento del código
* Darle significado a elementos cuyo nombre hemos cambiado

### Extraer constantes

Cada vez que encontramos un número o un texto escrito en el código surge el problema de entender qué significa. Este problema es un *smell* llamado el número mágico.

Los números mágicos (o valores mágicos por ser más genéricos) son valores arbitrarios que se introducen en el código para representar algo que, normalmente, es invariable.

El problema es que su significado dista mucho de ser obvio y la elección de ese valor concreto puede ser un auténtico misterio cuando examinamos un código escrito por otra persona hace mucho tiempo. En general, se nos plantean dos preguntas:

* ¿Qué significa este valor?
* ¿Por qué se ha elegido?

Vamos con un ejemplo:

```php
$this->queryBuilder()->setMaxResults(25);
```

El `25` es aquí un número mágico que representa la cantidad máxima de registros que debe devolver la petición, lo cual es un concepto genérico. Concretando más, podría referirse al número de elementos por página de una API o de una vista.

```php
$this->queryBuilder()->setMaxResults(MAX_ITEMS_PER_VIEW);
```

Por otro lado, una vez que encontramos la respuesta a esta pregunta puede surgir otro problema: ¿se utilizan estos valores mágicos con coherencia en el resto del código? Es decir, si estos valores se utilizan en otros lugares del código con el mismo significado tenemos un problema de múltiples fuentes de verdad, que pueden divergir.

Al definir una constante para referirnos a ese valor mágico, podemos usarla coherentemente en multitud de lugares de nuestro código.

```php
echo sprintf('showing %s items', MAX_ITEMS_PER_VIEW);
```

En resumen, al extraer constantes a partir de valores mágicos damos significado a esos valores.

### Extraer variables

La motivación principal para extraer variables es simplificar expresiones, dividiéndolas en partes significativas y manejables.

Veamos un ejemplo sencillo, en el que de paso hacemos cambios de nombre:

```php
$amount = $price - ($price * $pct / 100);

// vs

$discount = $price * $discountPercent / 100;

$amount = $price - $discount;
```

Lo que hemos hecho ha sido extraer el paréntesis a una variable. Esto tiene varios beneficios:

* Nos permite hacer la expresión principal más significativa.
* Nos ayuda a identificar y evitar posibles problemas con la precedencia de operadores.

Obviamente se trata de un ejemplo muy sencillo, pero cuanto más compleja sea la expresión mayor es el beneficio de este tipo de refactor.

Otro ejemplo:

```php
$object->setNewValue($oldValue * 1.3 + $margin);

//vs

$newValue = $oldValue * COEFFICIENT + $margin;
$object->setNewValue($newValue);
```

Al extraer la expresión a la variable, ésta se ve mucho más clara y  el uso del método resulta más limpio.

### Extraer métodos

#### Aislar dependencias ocultas

Cuando estamos leyendo un código legacy y encontramos dependencias ocultas, extraerlas a un método es un buen primer paso para posteriormente sacarlas de la clase e inyectarlas:

```php
// ...
$date = new DateTime();
// ...

// vs

// ...
$date = $this->getCurrentDate();
// ...

public function getCurrentDate()
{
    return new DateTime();
}
```

Al extraerla a un método aislamos la dependencia y reducimos sus instanciaciones a una. Aunque no es la mejor de las técnicas, con esta estrategia podríamos crear una clase testeable por herencia, sobreescribiendo el método `getCurrentDate`. Pero es mejor avanzar un poco más.

Ahora podríamos reemplazarla fácilmente por una dependencia inyectada.

```php

class MyClass
{
    private $clockService;
    
    public function __construct(ClockService $clockService)
    {
        $this->clockService = $clockService;
    }
    
    public function getCurrentDate()
    {
        return $this->clockService->currentDate();
    }
}
```

#### Simplificar operaciones complejas en base a niveles de abstracción

Los métodos muy largos (entendiendo métodos largos como aquellos que tengan más de 20-25 líneas) normalmente podrían dividirse en bloques de instrucciones estrechamente relacionadas entre sí y separarse en métodos más pequeños con unidad semántica.

Con frecuencia, en el cuerpo de un método se mezclan cuestiones que están en distintos niveles de abstracción. Esta mezcla hace que el código resulte difícil de seguir ya que tenemos que ir adaptándonos constantemente a esos cambios de nivel.

Por ejemplo, en una línea obtenemos algo de un Repositorio y acto seguido tenemos diez líneas de operaciones para generar un cierto valor que necesitamos.

Así que una buena estrategia es ir agrupando las operaciones de más bajo nivel en métodos cuyo nombre explique lo que hace a un nivel superior. Y, si es necesario, hacer lo mismo con los métodos extraídos que lo puedan necesitar.

De esto modo, el cuerpo del método principal se puede leer con más facilidad, dándonos una idea general de lo que sucede, y ofreciéndonos la oportunidad de ir a los detalles en la medida en que necesitemos.

```php
public function doSomething()
{
   // more than 30 lines of code…
}

//vs

public function doSomething()
{
   $this->prepareThings();
   $this->getData();
   $this->processData();
   return $result;
}
```
Es como si el cuerpo del método principal fuese el índice de un libro, en el que se llama a los diferentes capítulos.

Un caso de aplicación puede ser este, en el que nos aseguramos de que un valor recibido sea válido:

```php
if (! in_array($value, self::VALID_TYPES)) {
    //...
    throw new InvalidArgumentException($errorMessage);
}
//...
```

Podemos extraer esa sección del código en su propio método:

```php

$this->failIfValueIsAnInvalidType($value);

//...

public function failIfValueIsAnInvalidType(string $value):void
{
    if (! in_array($value, self::VALID_TYPES)) {
        //...
        throw new InvalidArgumentException($errorMessage);
    }
}
```

#### Encapsular operaciones complejas y darles significado

Un caso particularmente útil de extraer método es aplicarlo a expresiones condicionales (no sólo complejas) cuyo significado no resulta evidente.

En el ejemplo anterior, podríamos hacer que la expresión condicional fuese más explícita:

```php
if (! in_array($value, self::VALID_TYPES)) {
    //...
    throw new InvalidArgumentException($errorMessage);
}
//...
```

De esta manera:

```php
if (! $this->isValidType($value)) {
    //...
    throw new InvalidArgumentException($errorMessage);
}
//...

public function isValidType(string $value): boolean
{
    return in_array($value, self::VALID_TYPES);
}
```

### Extraer interfaces

Extraemos interfaces para abstraer comportamientos, de modo que podamos reemplazar o cambiar las implementaciones que los realizan, dándoles significado.

Extraer interfaces nos permite desacoplarnos de implementaciones concretas de dependencias, bien sea porque queremos poder cambiarlas por otras, bien por mejorar la capacidad de testear nuestro sistema, etc.

Un ejemplo muy simplificado. Tenemos una clase MyClass que usa SomeService como dependencia.

```php
class MyClass
{
    private $service;
    
    public function __construct(SomeService $service)
    {
        $this->service = $service;
    }
    
    public function doThis(): Class
    {
        return $this->service->doSomething();
    }
}

class SomeService
{
   public function doSomething(): Class
   {
   //...
   }
}
```

A partir del modo que el que MyClass utiliza SomeService extraemos una interfaz:

```php

interface Service
{
   public function doSomething(): Class;
}

```

`SomeService` podría tener otros muchos métodos, pero a nosotros sólo nos interesa `doSomething`.

Ahora cambiamos `SomeService` para que implemente la interfaz que acaba de definir y hacemos que `MyClass` espere una dependencia de la interfaz `SomeService`.

```php
class SomeService implements Service
{
//...
}

class MyClass
{
    private $service;
    
    public function __construct(Service $service)
    {
        $this->service = $service;
    }
    //...
}
```

Ahora, `MyClass` y `SomeService` están desacopladas y ambas dependen únicamente de la interfaz `Service`.

Si lo deseo, puedo crear nuevas implementaciones de la misma interfaz:

```php
class BetterService implements Service
```

## Más allá del código bien escrito

En todos los ejemplos que hemos visto, el beneficio del refactor es reflejar mejor nuestro conocimiento del sistema y hacer que el código se explique a sí mismo.

El refactoring va más allá de ofrecernos un código mejor escrito, que es consecuencia del proceso. Fundamentalmente el refactor trata sobre conocimiento y significado.

Refactorizar hace que pongamos nuestro conocimiento del sistema en el código, asegurándonos de que los conceptos y operaciones están bien reflejados y que el lenguaje del dominio está presente en todos los niveles.

Por esa razón, el refactor es una tarea que también beneficia al negocio de una manera muy directa: cuanto mejor esté reflejado el lenguaje del negocio en el código, cuanto más conocimiento sea posible encontrar en el código, las mejoras, las correcciones y la adición de nuevas prestaciones será mucho más eficaz, rápida y segura.

