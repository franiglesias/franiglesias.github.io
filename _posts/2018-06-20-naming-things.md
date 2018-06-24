---
layout: post
title: Cómo poner nombres
categories: articles
tags: php good-practices
---

¿Por qué razón poner nombres a las cosas se considera uno de los aspectos más difíciles de la programación?

[En esta pregunta de Quora](https://www.quora.com/Why-is-naming-things-hard-in-computer-science-and-how-can-it-can-be-made-easier) se proponen algunas ideas de por qué resulta difícil poner nombres. Los tipos de respuesta se podrían agrupar en:

* Tenemos que poner nombres constantemente.
* Los diseños evolucionan y cambian, introduciendo elementos nuevos.
* Necesitamos los nombres para representar los problemas y soluciones en las que trabajamos y poder hablar y razonar sobre ellas.

En el fondo es un poco paradójico. Al fin y al cabo, escribir un programa es hacer un modelo de la realidad, representando conceptos y relaciones que ya tienen nombre. Y justamente ese hecho ya es un buen punto de partida para nosotros.

## Al pan, pan, y al vino, vino

Puesto que las cosas que representamos tienen su propio nombre, lo más simple sería usar ese nombre para referirnos a ellas. No es una mala forma de comenzar.

El problema es que el nombre que tienen las cosas en el lenguaje humano raramente está libre de dificultades al trasladarlo a un programa. Las personas jugamos con varias ventajas que no existen en los lenguajes de programación.

Una de esas ventajas es nuestra capacidad para manejar la polisemia, la propiedad de algunas palabras de designar varios significados. En el lenguaje natural podemos utilizar una única palabra para referirnos a distintos conceptos dependiendo del contexto, algo que no podemos hacer en un programa de ordenador bajo riesgo de encontrarnos con conflictos.

Por tanto, necesitamos recurrir al diccionario de sinónimos, por un lado, y sobre todo a una conversación larga con los expertos de dominio para desarrollar un lenguaje compartido y con términos unívocos. Es posible establecer contextos aislados dentro de los cuales un término tiene un significado que puede ser diferente en otro contexto. De eso es lo que trata el Domain Driven Design: de lenguaje.

Aparte de eso, veamos algunas normas prácticas para nuestros nombres.

### Coherencia de uso

Los nombres deberían usarse coherentemente a lo largo de toda la aplicación. Es decir, no puede ser que unos sitios signifiquen una cosa y, en otros, otra.

También deberíamos usar las convenciones y recomendaciones que adoptemos de forma coherente.

Puede ser buena idea ir elaborando una especie de vocabulario base, particularmente de acciones comunes (del tipo get, save, etc...) para utilizar a la hora de crear nombres compuestos o de acciones equivalentes. Además, si estas acciones tiene su "opuesto", deberíamos emparejarlos siempre igual (store/retrieve, read/write, etc).

### Longitud

Hay que evitar los nombres de una sola letra y las abreviaturas. Los nombres deberían poder buscarse con facilidad con las utilidades de nuestros editores e IDE, tanto para trabajar normalmente como para cambiarlos si encontramos nombres mejores, y para eso necesitan una longitud mínima.

```php
for ($i = 0; $i < $t; $i++) {
    $r = $i * $i + $i - 3;
}

// vs

for ($counter = 0; $counter < $total; $counter++) {
    $result = $counter * $counter + $counter - 3;
}
```

Tampoco se recomienda utilizar abreviaturas, salvo Id y quizá alguna otra que esté muy bien establecida.

¿Y una longitud máxima? Hay algunas recomendaciones al respecto, como no utilizar más de veinte caracteres. O, puesto que los nombres largos suelen ser una combinación de varios, un límite sería de cuatro palabras como máximo.

Sin embargo, los buenos nombres deben ser exactamente tan largos como sea necesario, ni más, ni menos.

Lo ideal es poder nombrar las cosas con una sola palabra, añadiendo otras que doten de contexto a la primera y hagan más preciso su significado.

### Nombres diferentes

La regla de oro es una palabra para cada cosa, al menos dentro de un contexto bien delimitado. Sin embargo, también deberían evitarse nombres demasiado parecidos que puedan generar confusiones:

```php
$student = $students[1];

//vs

$student = $studentsGroup[0];
```

Cuando necesitemos manejar dos ejemplares de un mismo concepto, tenemos que buscar una forma de darles nombres que tengan un valor semántico y que nos permita diferenciarlos con facilidad. Por ejemplo:

```php
$address;
$address2;
$otherAddress;

// vs

$currentAddress;
$billingAddress;
$shippingAddress;
```

### Número

Usar el singular y el plural para indicar si la operación afecta a un elemento o a varios.

```php
$loggedUser = //...;

$allStudents = $studentsRepository->findAll();
```

Y si es posible usar un nombre colectivo, mejor que el nombre pluralizado o con algún sufijo técnico:

```php
$users;
$usersCollection;

// vs

$staff;
```

## Variables (o propiedades de objetos)

### Contenido y tipo

Dada su naturaleza dinámica, en PHP no es posible asignar tipos a variables. De hecho, podemos instanciar una variable con un tipo y cambiarlo luego al asignarle un valor de otro tipo:

```php
$variable = 'contenido';
$variable = 5;

echo $variable; //--> 5
```

No podemos evitar esto pero parece buena idea documentar cómo deberían comportarse las variables nombrándolas de forma que describamos:

* Su significado.
* El tipo de contenido que guardan. 

De este modo, aunque no podemos forzar su tipo, al menos sabremos cuál debería ser:

```php
$user = $this->usersRepository->getByEmailOrFail($email);
```

Las variables que hemos puesto en el código anterior nos dicen de una manera bastante clara qué tipo de contenido almacenan.

Sin embargo, siguen siendo un poco ambiguas en cuanto a su significado ya que son completamente genéricas.

Por ejemplo, esta línea podría estar siendo usada en el código de un sistema de atención al cliente por medio del cual un agente puede localizar al usuario que atiendo mediante su email. En ese caso podría tener sentido:

```php
$requestingCustomer = $this->usersRepository->getByEmailOrFail($customerEmail);
```

Esta sería otra situación diferente:

```php
$loggedUser = $this->usersRepository->getByEmailOrFail($email);
```

Fíjate que es exactamente el mismo código, pero tiene distinto significado en cada caso.

### Información extra

De momento nos hemos ocupado del contenido y del tipo de las variables, pero hay ocasiones en las que puede ser necesaria más información. En general, si sientes la necesidad de añadir un comentario para aclarar algo relativo a los valores de una variable es señal de que su nombre tiene todavía espacio para mejorar.

Pongamos por ejemplo una variable que contiene un número entero para indicar el tamaño de un archivo:

```php
$fileSize = $upload->size();
```

¿No echas algo de menos? ¿En qué unidad debería estar expresado este tamaño?

Dejando al margen consideraciones de si lo más correcto sería utilizar un value object para guardar tanto el valor del tamaño como la unidad, lo cierto es que la variable podría renombrarse para indicar la unidad que debmos usar:

```php
$fileSizeInBytes = $upload->size();
```

Este nombre nos quita todas las dudas. Incluso nos ayudaría en caso de depuración, ya que deja claro no sólo que la variable contiene el tamaño de un archivo dado, sino que también nos dice que debería estar expresado en bytes y si los valores nos hacen sospechar otra cosa nos estaría indicando que hay un problema.

Y, sobre el tema del Value Object, sigue siendo una buena idea utilizar nombres tan detallados:

```php
class FileSize
{
    /** @var int **/
    private $size;
    /** @var string **/
    private $unit;
    
    public function __construct(int $size, string $unit)
    {
        $this->size = $size;
        $this->unit = $unit;
    }
    
    public function inBytes()
    {
        return new self($this->size, 'B');
    }
    
    public function inKiloBytes()
    {
        return new self($sizeInKiloBytes, 'KB');
    }
}
```

Otro ejemplo nos sirve para ilustrar cómo eliminar la ambigüedad nos ayuda a reducir errores. En este caso nos fijaremos en las rutas del sistema de archivos: ¿deben acabar con el separador de directorios o no? ¿Ruta absoluta o relativa? Pues ante la duda, explícalo en el nombre:

```php
$pathToResources = 'path/to/resources/';
$pathToResources = 'path/to/resources';
$pathToResources = '/path/to/resources/';
$pathToResources = '/path/to/resources';

// vs

$relativePathToResourcesWithTrailingSlash = 'path/to/resources/';
```

## Constantes

En general, lo que hemos dicho para las variables puede aplicarse a las constantes. En resumen, el nombre:

* Describe el concepto representado
* Menciona el tipo de dato si es necesario
* Aclara información que pueda ser ambigua o que admite varias posibles opciones


## Métodos

El nombre de un método debería describir dos cosas:

* Su propósito.
* Sus consecuencias.

### Propósito

Supongamos un repositorio de estudiantes:

```php

interface StudentsRepository
{
}
```

El método para obtener un estudiando conociendo su Id (o cualquier otro dato) podría ser:

```php
interface StudentsRepository
{
    public function getById(StudentId $studentId): Student;
}
```

Este método nos dice que vamos a obtener (get) un objeto `Student` usando su Id como criterio para seleccionarlo.

Una denominación alternativa podría ser esta:

```php
interface StudentsRepository
{
    public function retrieveById(StudentId $studentId): Student;
}
```

En ambos casos el propósito está claro. El uso de uno u otro verbo puede ser una cuestión de gustos.

Gracias al sistema de tipado (*type hinting* y *return type*) no necesitamos explicitar mucho más. En una versión más antigua del lenguaje, hubiese sido buena idea escribir algo así:

```php
interface StudentsRepository
{
    public function retrieveStudentByStudentId($studentId);
}
```

### Consecuencias

Veamos ahora el tratamiento de las consecuencias. Queda bastante claro que nuestro método nos permite recuperar un objeto `Student` a partir de su Id. Es decir, la consecuencia de invocarlo es obtener un `Student`. Pero, ¿qué pasa si no existe uno con ese Id?

```php
interface StudentsRepository
{
    public function retrieveById(StudentId $studentId): Student;
}
```

No hay nada que nos lo indique explícitamente, pero por experiencia sabemos que podrían pasar al menos tres cosas:

* Se lanza una excepción.
* Se devuelve un null (pero el return type nos dice que eso no es posible)
* Se devuelve un null object Student (cosa que no tiene mucho sentido en este caso)

Por lo tanto, podemos deducir que el método lanzará una excepción en caso de no encontrar ningún objeto Student con ese Id. 

El razonamiento es el siguiente: si tenemos un Id (o algo que se le parece), o bien es de un Student que se encuentra en el repositorio, o bien es un Id mal formado o falso. Normalmente, estaremos intentando utilizar este método en situaciones en las que esperamos que exista un `Student` con ese Id, por lo que si hay ninguno tiene sentido pensar que se trata de una situación especial. De ahí la excepción.

Podríamos expresar eso en el propio nombre del método y ahorrar la carga que supone intentar confirmar nuestras sospechas:

```php
interface StudentsRepository
{
    public function retrieveByIdOrFail(StudentId $studentId): Student;
}
```

¿Por qué deberíamos especificar esto? 

Cualquier método podría lanzar excepciones aunque no sea de manera explícita. Por ejemplo, nuestro `StudentsRepository` podría tener algún problema de conexión con la base de datos que provocaría excepciones independientemente de que nosotros lancemos nuestra `StudentNotFoundException`.

La diferencia entre una excepción y otra es que el código consumidor de nuestro repositorio podría manejar la situación `StudentNotFoundException` dado que significa simplemente que no se encuentra ninguno con ese Id, algo que cabe esperar que ocurra y eso formaría parte de un modo u otro de las reglas del negocio.

Las otras excepciones que podrían ocurrir aquí no estarían previstas, por así decir. Son fallos en tiempo de ejecución que no podemos manejar ni recuperarnos de ellas.

Resulta recomendable indicar de manera explícita que nuestro método lanza algún tipo de excepción en caso de no poder devolver lo que se espera de él. A este respecto, es interesante conocer los conceptos Java de [checked y unckecked exceptions](https://www.geeksforgeeks.org/checked-vs-unchecked-exceptions-in-java/).

En cambio si el *return type* es nullable no hace falta indicarlo en el nombre:

```php
interface StudentsRepository
{
    public function retrieveById(StudentId $studentId): ?Student;
}
```

Ahora la signatura completa nos está diciendo que el método puede devolver un objeto Student o null, en el caso de que no exista ninguno. Por eso, no sería necesario añadir más explicaciones.

Eso sí, es muy discutible que este método pueda devolver un null.

### Setters y mutators

En general, los métodos *setters* y *mutators* cambian el estado de un objeto. Los *setters* inician un estado (o una parte de él) y los *mutators* lo cambian. Es relativamente fácil mezclar estos significados y usar *setters* para cambiar el estado de un objeto.

#### Por qué lo llaman fijar cuando quieren decir cambiar

Veamos un ejemplo. Supongamos un una clase `Book`. Lo normal sería que creásemos objetos `Book` con un título y, al menos, un autor, entre otros muchos datos. Por esa razón, los *setters* puros no tienen mucho sentido.

Es decir, lo siguiente no cuadra:

```php
class Book
{
    public function __construct(string $title, string $author)
    {
    }
    
    public function setTitle(string $title)
    {
    }
}
```

No cuadra porque el título de un libro se asigna cuando se crea el libro. No tiene sentido asignarlo de nuevo. El método parece decirnos que el libro se puede crear sin título.

Lo que puede tener sentido es "cambiar" el título porque ha habido un error en el registro original y se ha colado una falta de ortografía o incluso podría haberse introducido el título que no es. En todo caso, lo siguiente expresa mejor lo que ocurre:

```php
class Book
{
    public function __construct(string $title, string $author)
    {
    }
    
    public function changeTitle(string $title)
    {
    }
}
```

Incluso podríamos hacer obligatorio que se añada alguna información de porqué se ha cambiado el título, lo que internamente podría lanzar un evento o registrarlo en un historial.

```php
class Book
{
    public function __construct(string $title, string $author)
    {
    }
    
    public function changeTitleBecauseReason(string $title, string $reason)
    {
    }
}
```

#### Por qué lo llaman fijar cuando quieren decir añadir

Veamos ahora el caso de los autores. Muchos libros tienen varios autores por lo que sería correcto que al crear un objeto Book pasemos un array o una colección de autores. Por supuesto, puede ocurrir que no dispongamos de todos los autores en el momento de creación del objeto y que necesitemos añadir más luego.

En ese caso, ¿qué significa esto?:

```php
class Book
{
    public function __construct(string $title, string $author)
    {
    }
    
    public function setAuthor(string author)
    {
    }
}
```

Pues significa que el nombre del método nos desorienta:

* ¿Significa que el libro no tiene autor y se lo estamos indicando ahora?
* ¿Significa que estamos cambiando el autor del libro?
* ¿Significa que estamos añadiendo un nuevo autor?

Todo es cuestión de describir el comportamiento de forma completa, incluso muy completa:

```php
class Book
{
    public function __construct(string $title, string $author)
    {
    }
    
    public function addAnotherAuthor(string author)
    {
    }
}
```

#### Por qué lo llaman fijar cuando quieren decir otra cosa

En general, cualquier operación que implique un cambio de estado de nuestro objeto supone ajustar una o varias de sus propiedades. Pero esos ajustes forman parte de una operación con un cierto significado para el negocio.

Siguiendo con el ejemplo anterior, imaginemos que nuestra clase Book forma parte de un sistema de gestión de bibliotecas en el que, por supuesto, se incluye la opción de préstamo. Este proceso de préstamo podría implicar las siguientes acciones cuando se presta un libro:

* Fijar su estado de disponibilidad a no disponible.
* Añadir el usuario al que ha sido prestado.
* Calcular y registrar la feche límite en la que el libro ha de ser devuelto.

```php
$book->setAvailable(false);
$book->setUser($user);
$book->setReturnDate(strtotime('+ 2 weeks'));
```

En realidad este conjunto de acciones se pueden encapsular en una sola más significativa:

```php
$book->lendToUser($user);
```

```php
class Book
{
    public function __construct(string $title, string $author)
    {
    }
    
    public function lendToUser(User $user)
    {
        $this->available = false;
        $this->user = $user;
        $this->returnDate = strtotime('+ 2 weeks');
    }
}
```

Y esto, dejando aparte otras cuestiones, es un ejemplo de cómo se define una regla de negocio en una entidad: usando el lenguaje ubicuo.

## Para aprender más 

[Peter Hilton: How to name things: the hardest problem in programming](https://es.slideshare.net/pirhilton/how-to-name-things-the-hardest-problem-in-programming)

[Peter Hilton: Naming guidelines for professional programmers](https://es.slideshare.net/pirhilton/naming-guidelines-for-professional-programmers)
