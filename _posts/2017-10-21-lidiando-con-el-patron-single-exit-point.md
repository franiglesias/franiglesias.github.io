---
layout: post
title: Lidiando con el (anti)patrón single exit point
categories: articles
tags: legacy refactoring
---

Los patrones se convierten en anti-patrones si los llevamos más allá de sus límites de aplicabilidad.

## Un patrón de otra época

Cuando examinas código de cierta edad es fácil encontrarse un patrón llamado "single entry and exit point". Este patrón tiene sus raíces en los principios de la programación estructurada de Edsger Dijkstra y se puede enunciar más o menos así:

Una función (o método, o subrutina) ha de tener un único punto de entrada y un único punto de salida.

Para aprender sobre Dijkstra puedes visitar esta página:

https://www.computer.org/web/awards/goode-edsger-dijkstra

Dijkstra es conocido como fundador de la llamada "Programación estructurada", un paradigma de programación que se basa en la idea de que todo programa puede escribirse mediante tres estructuras básicas:

- Secuencia
- Decisión
- Iteración

https://es.wikipedia.org/wiki/Programación_estructurada

La programación estructurada surgió como reacción a estilos de programación desorganizados que movían libremente la ejecución de un punto a otro arbitrario del código mediante el uso de sentencias GOTO, aprovechando la posibilidad de saltar directamente a un punto dentro de una subrutina (algo posible en ensamblador, por ejemplo) o incluso retornar a un lugar distinto desde el cual la subrutina hubiese sido llamada (como en FORTRAN). Estamos hablando del año 1968:

https://www.cs.utexas.edu/users/EWD/transcriptions/EWD02xx/EWD215.html

https://softwareengineering.stackexchange.com/questions/118703/where-did-the-notion-of-one-return-only-come-from (Ver la primera respuesta)

En estos entornos la idea del "single entry/exit point" era un patrón claramente positivo que contribuía a la inteligibilidad y mantenibilidad del código.

Pero como ha ocurrido con otros patrones de programación, una vez que las circunstancias que les dieron sentido desaparecen, aplicarlos ciegamente puede llevarnos a efectos negativos, ya que no tienen sentido en los nuevos entornos.

Así, por ejemplo, los lenguajes modernos no suelen permitir las sentencias GOTO ni tampoco la posibilidad de entrar a una función o método en un punto arbitrario ni retorno a otro lugar que no sea a continuación del punto de llamada.

Sin embargo, la idea del single exit point siguió viva en ciertos estilos de programación en la forma de la regla de que solo debe haber un return en una función o método. Y eso nos lleva a un montón de malas prácticas y la necesidad de refactorizar código.

## Por qué mantener un único punto de salida

Ahora que hemos visto que hace mucho tiempo que no tiene sentido mantener este patrón, lo cierto es que es relativamente frecuente encontrárnoslo a la hora de revisar código antiguo, e incluso tiene algunos defensores:

https://www.tomdalling.com/blog/coding-tips/coding-tip-have-a-single-exit-point/

El ejemplo, como señalan algunos comentarios, tiene que ver con una situación muy específica como es la gestión de recursos y la asignación y liberación de manejadores, que podrían quedar abiertos de forma incorrecta si salimos prematuramente de la función que los emplea. Por ejemplo: abrir un archivo para buscar algo en él y retornar el resultado sin cerrarlo adecuadamente.

Tengo la sensación de que, por un lado, esta idea del único punto de salida es una simplificación de un principio más general que tiene que ver con el Single Responsibility Principle y con la necesidad de que las funciones y métodos devuelvan un único tipo de resultados, algo que se puede explicitar mediante el **return type**.

https://en.wikipedia.org/wiki/Return_type

Por ejemplo: un método de una clase que devuelve resultados de una búsqueda de usuarios debería devolver siempre un array o una colección vacía en caso de no encontrar nada, y no null o false, o bien una colección o array de un único usuario, si solo encuentra un resultado, y no un objeto usuario. 

Es algo que hay que vigilar de cerca en los lenguajes que no permiten especificar return type, como es el caso de las versiones de PHP anteriores a la 7 y, por lo tanto, podría ser recomendable reducir los puntos de salida para asegurarnos controlar correctamente lo que devolvemos.

## Problemas de forzar un único punto de salida

Los problemas con este antipatrón surgen cuando un código tiene flujos alternativos debidos a que se cumplan o no ciertas condiciones. Es decir, el "happy path" se ejecutará si se cumplen ciertas condiciones.

En esos casos, forzar un único punto de salida nos obliga a introducir un if para comprobar si podemos entrar al happy path y saltar a la salida en caso contrario.

```php
function selectElement($criteria, $desirability)
{
	if (!empty($criteria)) {
		// do HappyPath
	}
	return;
}
```

El código anterior tiene una complejidad ciclomática de 2 y su visualización tiene un nivel de indentación extra. La cosa se pone peor cuando hay que devolver algún resultado, ya que, o bien inicializamos una variable para poder devolver algo fuera del happy path…

```php
function selectElement($criteria, $desirability)
{
	$result = null;
	if (!empty($criteria)) {
		// do HappyPath
	}
	return $result;
}
```

O bien controlamos que tenemos algún resultado para poder devolverlo:

```php
function selectElement($criteria, $desirability)
{
	if (!empty($criteria)) {
		// do HappyPath
		$result = ...;
	}
	if (isset($result)) {
		$result = null;
	}
	return $result;
}
```

El problema que comienza a vislumbrarse es que estamos introduciendo pasos y condiciones que no forman parte del algoritmo propio de esta función, sino que las necesitamos únicamente para gestionar su ejecución.

Obviamente, la cosa se complica si existen nuevas condiciones que cumplir antes de alcanzar los requisitos que nos permiten ejecutar el happy path.

```php
function selectElement($criteria, $desirability)
{
	if (!empty($criteria)) {
		if(is_string($criteria)) {
			// do HappyPath
			$result = ...;
		}
	}
	if (isset($result)) {
		$result = null;
	}
	return $result;
}
```

Es decir, el número de if anidados crece, incrementando por una parte la complejidad ciclomática del código y la dificultad de lectura al aumentar los niveles de indentación.

Otras situaciones nos obligan a introducir variables temporales en forma de flags que señalen que ciertos objetivos se han logrado:

```php
function selectElement($criteria, $desirability)
{
	$found = false;
	if (!empty($criteria)) {
		if(is_string($criteria)) {
			$elements = $this->getElements($criteria);
			foreach($elements as $element) {
				if (!$found && $this->isDesired($element, $desirability)) {
					$result = $element;
					$found = true;
				}
			}
		}
	}
	if (!$found) {
		$result = null;
	}
	return $result;
}
```

Seguramente estarás pensando que hoy por hoy nadie mínimamente competente escribiría un código como el que se muestra, pero la verdad es que si tienes que trabajar con legacy de cierta edad te lo vas a encontrar con bastante frecuencia.

No se trata de falta de competencia. Ocurre que, por un lado, lo que consideramos buenas prácticas ha ido cambiando con el tiempo, que se han interpretado mal ciertos principios de diseño o patrones de programación, y que se encuentran limitaciones en los lenguajes de programación en un momento dado. Por ejemplo: los déficits de PHP en versiones como la 4 o incluso la 5, especialmente en cuestiones como el manejo de errores y excepciones o la falta de type hinting o return type.

Este conjunto de circunstancias hace que el código que no haya sido actualizado desde hace varios años muestre problemas de este tipo.

## Refactoring de single exit point

A día de hoy, este patrón puede reescribirse usando algunas técnicas bien conocidas de refactoring, además de aplicar principios de programación estructurada.

Para ilustrarlo voy a imaginar la típica situación en la que se nos pide modificar alguna funcionalidad de una aplicación con código legacy.

En concreto, vamos a suponer que tras el análisis del problema hemos determinado que debemos tocar un método de una clase que selecciona un elemento realizando una preselección mediante unos criterios ($criteria) y luego valorando los resultados en busca del primero que cumpla ciertos otros ($desirability). Algo más o menos así:

```php
function selectElement($criteria, $desirability)
{
	$found = false;
	if (!empty($criteria) && !empty($desirability)) {
		if(is_string($criteria) && is_integer($desirability)) {
			$elements = $this->getElements($criteria);
			foreach($elements as $element) {
				if (!$found && $this->isDesired($element, $desirability)) {
					$result = $element;
					$found = true;
				}
			}
		}
	}
	if (!$found) {
		$result = null;
	}
	return $result;
}
```

Cuando nos encontrarnos códigos así escritos es buena idea refactorizar para entender. Es decir, reescribir el código para que sea más legible, poner de relieve posibles problemas y facilitar la introducción de nuevas funcionalidades o modificar las existentes.

Una primera aproximación es aclarar el terreno usando cláusulas de guarda para reducir el anidamiento de condicionales. Para esto hay que invertir las condiciones, lo que puede tener su miga si son complejas.

```php
function selectElement($criteria, $desirability)
{
	if (empty($criteria) || empty($desirability)) {
		return null;
	}

	if (!is_string($criteria) || !is_integer($desirability)) {
		return null;
	}

	$found = false;
	$elements = $this->getElements($criteria);
	
	foreach($elements as $element) {
		if (!$found && $this->isDesired($element, $desirability)) {
			$result = $element;
			$found = true;
		}
	}
	if (!$found) {
		$result = null;
	}
	return $result;
}
```

Si las condiciones son muy complejas, puede ser buena idea extraerlas a un método e invertir después, aunque sea temporalmente. De este modo, es más fácil entender lo que pasa, aunque no tengamos del todo claro cómo pasa. Voy a poner un ejemplo muy burdo, pero creo que se entiende lo que intento decir:

```php
function selectElement($criteria, $desirability)
{
	if (! bothArgumentsHaveValues($criteria, $desirability)) {
		return null;
	}

	$found = false;
	$elements = $this->getElements($criteria);
	
	foreach($elements as $element) {
		if (!$found && $this->isDesired($element, $desirability)) {
			$result = $element;
			$found = true;
		}
	}
	if (!$found) {
		$result = null;
	}
	return $result;
}

function bothArgumentsHaveValues($criteria, $desirability)
{
	return !empty($criteria) && !empty($desirability) 
		&& is_string($criteria) 
		&& is_integer($desirability);
}

```

Al aplicar este primer refactor conseguimos aumentar la legibilidad el código y aislar el algoritmo relevante que también necesita sus arreglillos. Pero aún podemos hacer algo más: ¿por qué tenemos que controlar que $criteria es un string o $desirability un integer, cuando el sistema de tipos lo puede hacer por nosotros?:

```php
function selectElement(string $criteria, integer $desirability)
{
	if (empty($criteria) || empty($desirability)) {
		return null;
	}

	$found = false;
	$elements = $this->getElements($criteria);
	foreach($elements as $element) {
		if (!$found && $this->isDesired($element, $desirability)) {
			$result = $element;
			$found = true;
		}
	}
	if (!$found) {
		$result = null;
	}
	return $result;
}
```

Por otro lado, si $criteria o $desirability no traen un valor adecuado para ser utilizados, ¿es correcto devolver null? Es muy posible que estemos hablando de una situación que no debería producirse, es decir, que es digna de que se lance una excepción:

```php
function selectElement(string $criteria, integer $desirability)
{
	if (empty($criteria) || empty($desirability)) {
		throw new \InvalidArgumentException('selectElement needs some values to work!');
	}

	$found = false;
	$elements = $this->getElements($criteria);
	foreach($elements as $element) {
		if (!$found && $this->isDesired($element, $desirability)) {
			$result = $element;
			$found = true;
		}
	}
	if (!$found) {
		$result = null;
	}
	return $result;
}
```

O incluso podemos considerar si el valor que tenemos que pasar tiene un significado propio en el dominio de la aplicación y debería definirse como un Value Object capaz de cuidar de su propia consistencia.

```php
class Criteria
{
	private $criteria;
	
	public function __construct(string $criteria) {
		if (empty($criteria)) {
			throw new \InvalidArgumentException('Criteria needs a value to work!');
		}
		$this->criteria = $criteria;
	}
	
	public function getCriteria() {
		return this->criteria;
	}
}

class Desirability
{
	private $desirability;
	
	public function __construct(integer $desirability) {
		if (empty($desirability)) {
			throw new \InvalidArgumentException('Desirability needs a value to work!');
		}
		$this->desirability = $desirability;
	}
	
	public function getDesirability() {
		return this->desirability;
	}
}

function selectElement(Criteria $criteria, Desirability $desirability)
{
	$found = false;
	
	$elements = $this->getElements($criteria);
	
	foreach($elements as $element) {
		if (!$found && $this->isDesired($element, $desirability)) {
			$result = $element;
			$found = true;
		}
	}
	if (!$found) {
		$result = null;
	}
	return $result;
}
```

En este último ejemplo hemos podido eliminar toda la gestión de la validez de los parámetros fuera del método y el método solo hace una cosa, pero todavía quedan unas cuantas cosillas que podemos arreglar.

Por una parte, podemos ver que el algoritmo no está muy bien escrito. Se utiliza un bucle foreach y se recorre todo el array. En realidad podemos forzar la salida del bucle al encontrar el elemento deseado, ahorrándonos de paso unas cuantas condicionales:

```php
function selectElement(Criteria $criteria, Desirability $desirability)
{
	$elements = $this->getElements($criteria);
	
	foreach($elements as $element) {
		if ($this->isDesired($element, $desirability)) {
			return $element;
		}
	}
	return null;
}
```

Una vez resuelto el paso anterior podemos leer el algoritmo con comodidad y comprobar que es bastante evidente lo que hace. En este momento ya podríamos tocar la funcionalidad para arreglarla conforme a las nuevas necesidades. Aunque antes podemos observar que algunas responsabilidades podrían estar mal repartidas.

Tiene toda la pinta de que Element pueda encargarse él mismo de comprobar si es "deseable", aunque eso puede depender de muchos factores. Sin embargo, es algo que conviene detenerse un rato a considerar porque la legibilidad todavía puede aumentar. Y si no es así, es muy posible que el control de la "deseabilidad" de ese objeto no corresponda tampoco a la clase en la que está el método, sino a algún tipo de servicio.

```php
function selectElement(Criteria $criteria, Desirability $desirability)
{
	$elements = $this->getElements($criteria);
	
	foreach($elements as $element) {
		if ($element->isDesired($desirability)) {
			return $element;
		}
	}
	return null;
}
```

Una cuestión que queda pendiente es qué retornar en caso de que el método no encuentre resultados. Primero debemos decidir si el hecho de que no se encuentren los resultados es extraordinario y requiere ser tratado como una excepción. Si no, podemos usar un patrón Null Object, que nos permite aplicar un return type:

```php
class NullElement extends Element
{
	public function execute()
	{
		// do nothing
	}
}

function selectElement(Criteria $criteria, Desirability $desirability) : Element
{
	$elements = $this->getElements($criteria);
	
	foreach($elements as $element) {
		if ($element->isDesired($desirability)) {
			return $element;
		}
	}
	return new NullElement;
}
```

El uso de Null Objects merecería un artículo completo porque tiene chicha para un buen debate, pero en muchos casos es una buena solución.

Llegados a este punto tenemos el código en una situación muy buena. Aunque parece posible aplicar algunas nuevas refactorizaciones, tenemos que valorar si realmente vale la pena ir más allá. En nuestro ejemplo, hemos llegado al punto en que el código no solo se ha vuelto mucho más legible, sino que hemos podido distribuir mejor las diferentes responsabilidades y ahora es fácil determinar dónde debenmos tocar para añadir las modificaciones que nos pedían inicialmente.

## En resumen

El patrón **single exit point** no aplica en la mayoría de los lenguajes actuales y la interpretación que se ha hecho del mismo no resulta útil para escribir un código legible y mantenible.

Mucho código antiguo mostrará este patrón debido a las limitaciones de los lenguajes o a las prácticas en boga en el momento de escribirlo. Actualmente, los propios lenguajes nos proporcionan herramientas para controlar algunas de las situaciones por las que forzar el single exit point complica innecesariamente el código. Refactorizando conseguiremos un código mucho menos complejo que incluso podría respetar el viejo principio enunciado por Dijkstra.
