---
layout: post
title: Manejar excepciones
categories: [articles]
tags: [php, good-practices]
---

Las excepciones son elementos del lenguaje que nos permiten indicar situaciones que rompen el flujo normal de un programa. Cuando se lanza una excepción, ésta asciende la pila de llamadas del lenguaje hasta encontrar algún punto en que sea gestionada. Si no lo encuentra, el flujo del programa se detiene y se muestra un error.

En cierto modo, podemos ver las excepciones como eventos o mensajes que se publican a la espera de que exista algún oyente interesado que pueda ocuparse del mismo. Sin embargo, no deben usarse como forma genérica de comunicación interna de una aplicación, sino únicamente en la gestión de situaciones extraordinarias.

Pongamos por ejemplo el caso de una aplicación que depende de una API remota. Si detectamos que la API no está disponible en un momento dado eso es una situación extraordinaria y sería buena idea lanzar una excepción que indique esa circunstancia particular que, de todos modos, va a impedir que nuestro programa funcione. Por otro lado, nuestro código debería estar pendiente de si esa excepción concreta es lanzada para tomar las medidas adecuadas, ya sea avisar a los usuarios de que la operación no se puede realizar, ya sea para buscar algún tipo de alternativa, etc.

El lenguaje, por su parte, utiliza este mecanismo para comunicar buena parte de los errores genéricos que pueden ocurrir en un código determinado. Algunos de esos errores son *lógicos*, como por ejemplo llamar a un método que no existe o pasar un argumento de un tipo no válido, mientras que otros son *en tiempo de ejecución*, y no se detectan hasta que ocurren, como cuando una función devuelve un tipo de valor no esperado.

Normalmente esos errores lógicos se pueden detectar analizando el código y requieren una reparación del mismo para evitarlos. Por su parte, los errores en tiempo de ejecución no se pueden prever y pueden requerir técnicas defensivas.

## Una familia excepcional

En PHP todas las excepciones derivan de la clase base `Exception`, la cual a su vez implementa la interfaz `Throwable` (que nosotros no podemos usar directamente). La Biblioteca Estándar de PHP (SPL) propone un árbol de clases con dos ramas principales:

* **LogicException**, que agrupa las excepciones que representan errores en la lógica del programa y que, a su vez, se extiende en:  
  * **BadFunctionCallException**: cuando se llama a una función que no existe o con los argumentos incorrectos.
      * **BadMethodCallException**: lo mismo pero al llamar al método de un objeto.
  * **DomainException**: un valor no está dentro de los valores que son propios de un cierto dominio. Por ejemplo, una latitud de 465 grados.
  * **InvalidArgumentException**: el argumento pasado a una función no es del tipo adecuado.
  * **LengthException**: el tamaño de algo no es adecuado.
  * **OutOfRangeException**: se solicita un índice ilegal, como por ejemplo el índice 100 en un array de 70 elementos. 
* **RuntimeException**, que agrupa las excepciones que representan los errores detectados en tiempo de ejecución. En muchos casos el significado del error es el mismo que en LogicException, pero cuando es detectado en tiempo de ejecución.
  * **OutOfBoundsException**: Equivale a DomainException.
  * **OverflowException**: representa el error de agregar un elemento a un contenedor que ya está lleno.
  * **RangeException**: es la versión en tiempo de ejecución de la `DomainException`.
  * **UnderflowException**: el ejemplo típico es intentar quitar algo de un contenedor que ya está vacío.
  * **UnexpectedValueException**: un valor retornado por una operación no es del tipo esperado.

Cuando queremos indicar una situación problemática en nuestro código, lo suyo sería lanzar una excepción, aunque decidir qué excepción concreta lanzar tiene algo de arbitrario. Lo ideal sería escoger una de éstas que acabamos de mostrar o crear tipos propios de excepciones extendiendo la clase que más nos encaje semánticamente.

En muchos sentidos, la estructura de las `LogicException` y las `RuntimeException` es paralela y en un lenguaje interpretado como PHP es una distinción un poco forzada. El criterio para tirar por una rama o por otra sería si queremos enfatizar que hay que hacer un cambio en el código para que no se produzca el error, o bien si el acento lo ponemos en que el problema se genera durante la ejecución y tenemos que tomar medidas que lidien con circunstancias que no podemos predecir si ocurrirán.

## La excepción es el mensaje

En último términos las excepciones son mensajes que pueden indicar una diversidad de circunstancias lo suficientemente adversas para nuestro código como para interrumpirlo.

En tanto que mensajes, en el sentido de programación orientada a objetos, es importante que las excepciones aporten un valor semántico por lo que es buena práctica definir excepciones personalizadas cuando representan situaciones importantes en el dominio de nuestra aplicación.

Un buen motivo para definir nuevos tipos de excepciones es el de que podemos capturarlas de forma específica en los bloques `try…catch`, como veremos dentro de un momento, permitiéndonos actuar de manera adecuada a los distintos tipos de problemas.

En todo caso, lo importante es que la excepción describa el problema lo mejor posible.

Por otro lado, la constructora de la clase `Exception` nos permite definir:

* Un mensaje descriptivo de lo ocurrido, destinado normalmente a mostrarse como información al usuario final y que creo que no debería usarse para obtener información sobre el problema acaecido.
* Un código numérico de error, que nos permitiría matizar el problema descrito por la excepción.
* Una excepción anterior, en caso de que estemos relanzando excepciones.

## Falla específicamente y captura genéricamente

### Fallar lanzando excepciones

Cuando una parte de nuestro código debe gestionar una situación potencialmente problemática, puede detectar condiciones que señalan ese problema y lanzar una excepción si se cumplen.

Por ejemplo, si estamos manejando coordenadas y uno de los valores que recibimos está fuera del rango -180…180 tendríamos un caso de `DomainException` (o `OutOfBoundsException`), por lo que cualquier operación posterior no tendría ningún sentido. Así que podemos hacer, por ejemplo, una cláusula de guarda que lo detecte y lance una excepción:

```php
if (abs($longitude) > 180) {
	throw new OutOfBoundsException('Bad value for Longitude');
}
```

### Fallar específicamente

Lo ideal, en mi opinión, es fallar de la manera más descriptiva y precisa que se pueda, de modo que sea posible actuar ante tipos de errores concretos si lo deseamos, cosa que es posible hacer disponiendo de bloques de captura específicos para ese tipo de excepción.

Para ello puede ser útil recurrir a excepciones creadas a medida, derivadas de otras estándar o, como poco, de las excepciones base. Pero esto es algo que depende fundamentalmente de nuestras necesidades.

Imagínate, por ejemplo, que para tu aplicación es importante tener mucho control sobre datos de geolocalización. En ese caso, podría ser interesante tener excepciones como esta:

```php
class InvalidCoordinatesException extends OutOfBoundsException;
```

De modo que puedas hacer algo así:

```php
if (abs($longitude) > 180) {
	throw new InvalidCoordinatesException('Out of range value of '.$longitude.' deg');
}
```

### Capturar

Para evitar que las excepciones puedan llegar hasta el usuario y romper nuestra aplicación necesitamos algún tipo de gestión de excepciones y para eso tenemos los bloques `try…catch`.

Los bloques `try…catch` separan el *happy path* (el flujo del programa en caso de que no haya ningún problema) del manejo de las situaciones problemáticas. El ejemplo más básico es el siguiente:

```php
try {
	// This is the happy path
} catch (Exception $exception) {
	// Catches all exceptions
	// Do something with $exception
	// Hey, at least log it
}
```

Si durante la ejecución del bloque `try` se produce una excepción, se detiene el flujo y se salta al bloque `catch`. A este bloque se le pasa la excepción como parámetro, de la cual se puede extraer información si es el caso y hacer algo adecuado, como podría ser añadir una entrada en el *log* de errores, redirigir a una página particular, o incluso volver a lanzar la misma excepción u otra para que las siguiente capa de la aplicación la pueda recibir.

El código después de esta estructura solo se ejecuta si no ha habido excepción, aunque haya sido capturada.

Podemos capturar excepciones concretas simplemente añadiendo bloques `catch`, pero tenemos que hacerlo de manera que las excepciones más concretas se capturen antes que las más genéricas.

```php
try {
	// This is the happy path
} catch (InvalidArgumentException $exception) {
	// Do something with this exception
} catch (Exception $exception) {
	// Catches all other exceptions
	// Do something with this exception
}
```

En caso de que necesitemos que un código se ejecute siempre, haya habido o no excepción, lo incluimos en un bloque `finally`. Esto nos permite operaciones como cerrar archivos, registrar información, o cualquier otra cosa necesaria para dejar el sistema en el mejor estado posible.

```php
try {
	// This is the happy path
} catch (Exception $exception) {
	// Catches all exceptions
	// Do something with this exception
} finally {
	// This is executed always, even after a exception
	// or even after an exception was re-thrown
}
```

### Capturar genéricamente

También en mi opinión, la mejor estrategia es empezar capturando siempre de la forma más genérica posible, incluso aunque tengamos excepciones muy específicas:

```php
try {
	// This is the happy path
} catch (Exception $exception) {
	// Catches all exceptions
}
```
Si necesitamos procesar un tipo de excepción particular de una forma especial no tenemos más que añadir un nuevo bloque `catch` más específico.

```php
try {
	// This is the happy path
} catch (InvalidCoordinatesException $exception) {
	// Do something with this exception
} catch (Exception $exception) {
	// Catches all other exceptions
	// Do something with this exception
}
```

El problema de usar solo excepciones genéricas es que si en algún momento necesitamos actuar de manera diferente según el problema detectado es muy posible que la excepción no pueda proporcionarnos información suficiente.

Si la propia excepción ya nos dice qué ha pasado, por su tipo, solo tendríamos que explorar algunos de sus datos para tomar las medidas adecuadas.

Y **nunca, nunca**, deberíamos tener bloques `catch` que no hagan nada, silenciando las excepciones. Como mínimo, si nos interesa que no rompan el flujo del programa, deberíamos crear una entrada en el *log*, para el caso de que se detecte algún problema y eso nos pueda proporcionar alguna pista en el análisis posterior.

## Relanzar excepciones

En ocasiones puede ser necesario capturar una excepción para volver a lanzarla. Esto es especialmente conveniente cuando la excepción traspasa una frontera entre las capas de una aplicación.

Por ejemplo, podemos tener en la capa de infraestructura un adaptador de base de datos que, en un momento dado, lanza una excepción porque no puede conectarse con el servidor.

Si esta excepción llega al repositorio implementado con la ayuda de dicho adaptador, es preferible relanzar una nueva excepción acorde con la capa del repositorio, Por ejemplo, así:

```php

// Repository.php

try {
	// Save data
} catch(MySQLConnectionException $exception) {
	throw new PersistenceException('Data could not be stored', 100, $exception);
}
```
En este ejemplo, el repositorio maneja excepciones que proceden del adaptador de base datos, pero debe lanzar excepciones que sean significativas para la capa de dominio. En este sentido, al dominio puede interesarse saber que ha habido un problema con la persistencia, pero no tiene que saber nada de la implementación concreta de esa persistencia.

Las excepciones admiten un tercer parámetro que sirve para incluir la excepción capturada previamente, de modo que su información pueda utilizarse.

## Excepciones expresivas

### Mantén los tipos de excepciones bajo control

Crear nuevos tipos de excepciones que nos sirvan para describir mejor los errores que se han producido es una buena práctica, aunque tampoco conviene multiplicar la cantidad de las mismas.  Por lo general, hay que plantear "familias" de excepciones que describan un tipo de problema.

Al igual que ocurre con otros conceptos, realmente su diseño debería ir dirigido por sus consumidores. Si lo vemos desde el punto de vista del código en el que ocurre el problema, podemos tender a querer una excepción por cada tipo de error.

Por ejemplo, si estamos diseñando una aplicación que tenga que ver con la geolocalización las coordenadas serán conceptos importantes, así que tiene sentido una excepción llamada `InvalidCoordinatesException` para describir diversas situaciones en las que un par de coordenadas se trata de definir con valores no válidos.

Sin embargo, sería muy discutible tener unas excepciones como `InvalidLongitudeException` o `InvalidLatitudeException`, ya que superpoblarían el espacio de nombres y, por otro lado, no tiene mucho sentido cuando hablamos de **pares** de coordenadas.

### Payload de excepciones

En el caso de crear excepciones personalizadas se recomienda que éstas puedan llevar información extra sobre las circunstancias del error, que luego podría extraerse mediante simples *getters*. Algo así:

```php
class InvalidCoordinatesException extends InvalidArgumentException
{
	private $longitude;
	private $latitude;
	
	public function __construct($longitude, $latitude)
	{
		$this->longitude = $longitude;
		$this->latitude = $latitude;
		
		parent::__construct(sprintf('Coordinates (%s, %s) are invalid.', $longitude, $latitude));
	}
	
	public function getLatitude()
	{
		return $this->latitude;
	}
	
	public function getLongitude()
	{
		return $this->longitude;
	}
}

```
Aunque estrictamente hablando se viola el principio de sustitución de Liskov, hay que tener en cuenta que la excepción sería capturada en un bloque que espera específicamente ese tipo concreto de excepción mediante *type hinting*.

### Named constructors en excepciones

Una técnica que puede mejorar la expresividad de las excepciones es utilizar métodos factoría (*named constructors*) de modo que la construcción de estas nuevas excepciones no solo sea más expresiva sino incluso más coherente. El ejemplo anterior se podría reescribir así:

```php
class InvalidCoordinatesException extends \InvalidArgumentException
{
    private $longitude;
    private $latitude;

    private function __construct($longitude, $latitude)
    {
        $this->longitude = $longitude;
        $this->latitude = $latitude;

        parent::__construct(sprintf('Coordinates (%s, %s) are invalid.', $longitude, $latitude));
    }

    public static function for($longitude, $latitude) : self
    {
        return new static($longitude, $latitude);
    }

    public function getLatitude()
    {
        return $this->latitude;
    }

    public function getLongitude()
    {
        return $this->longitude;
    }
}
```

De modo que podríamos usarlo, por ejemplo, así (no me digas que no es una belleza):

```php
throw InvalidCoordinatesException::for(229, 123);
```

