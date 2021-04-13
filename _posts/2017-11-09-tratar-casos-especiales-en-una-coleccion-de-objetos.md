---
layout: post
title: Tratar casos especiales en una colección de objetos
categories: articles
tags: legacy refactoring
---

A veces tenemos que hacer cosas específicamente con algunos objetos de una colección. En este artículo planteo una forma de encarar este problema.

Hace unos días tuve que examinar un código que consume la API de uno de nuestros proveedores para construir un array de objetos a partir de los resultados. En algunos de esos objetos había que aplicar un tratamiento específico, ya fuera por razones comerciales o para corregir algunos errores en la fuente de datos.

Como no se trataba de un asunto directamente relacionado con la tarea concreta en la que estábamos trabajando lo dejé pasar, pero no paré de darle vueltas en la cabeza a posibles formas de lidiar con esos casos especiales sin llenar un bloque de código de condicionales _ad-hoc_, rompiendo varios principios de diseño en el camino. Como es más fácil verlo que explicarlo, voy a poner un ejemplo que simula la situación que acabo de describir:

```php
class APIReader 
{
    private $objects;

    function getObjects()
    {
        $response = $this->getData();
        $objects = $this->parse($response);
        foreach ($objects as $object) {
            $object->doSomething();
        
            if ($object->getId() === 'ob012') {
                $object->setData('new data for ob012');
            }
        
            if ($object->getPrice() === '123' && $object->isImportant()) {
                $object->prioritize();
            }
        
            // More changes to specific objects
        }
    
        return $objects;
    }
}
```

Lo que me molesta de este código es lo siguiente:

Por cada objeto que necesite un tratamiento particular introducimos un condicional y un bloque con las operaciones necesarias. Esto es una violación del principio DRY, aunque a primera vista no lo parezca, ya que la estructura es la misma para cada objeto. Es decir, _apesta_ por duplicación.

Todo este tratamiento alarga el método _ad infinitum_ con código que no corresponde realmente a su misión principal, que es obtener los objetos, lo cual nos lleva a un posible problema de mal reparto de responsabilidades.

Y, por fin, nos encontramos con una violación del principio abierto/cerrado, ya que si tuviésemos que introducir un tratamiento específico para un objeto más vamos a tener que modificar el método getObjects de esta clase. Sería mucho mejor que pudiésemos introducir las instrucciones especiales sin tener que tocar el código existente, especialmente si pueden estar sujetas a variaciones frecuentes o incluso configurables externamente.

Además, cada objeto tiene que pasar por todas las condicionales. Con dos ó tres casos esta forma de proceder puede ser aceptable, pero imagínate que las casuísticas comenzasen a crecer y tuviésemos decenas o centenares de ellas.

## Primer paso: aislar el problema

Por lo general es buena idea extraer a un método el bloque de código que queremos refactorizar. De esta manera los cambios son más manejables. Si, más adelante, vemos que es posible reintegrar el código será fácil hacerlo.

Así que vamos a mover el tratamiento de los casos especiales a su propio método, sin hacer nada más de momento.

```php
class APIReader 
{
	private $objects;

	function getObjects()
	{
		$response = $this->getData();
		$objects = $this->parse($response);
		foreach ($objects as $object) {
			$object->doSomething();
			$this->applySpecialTreatment($object);
		}
	
		return $objects;
	}

	private function applySpecialTreatment($object)
	{
		if ($object->getId() === 'ob012') {
			$object->setData('new data for ob012');
		}
	
		if ($object->getPrice() === '123' && $object->isImportant()) {
			$object->prioritize();
		}
	
		// More changes to specific objects
	}
}
```

## Segundo paso: entender el problema

La extracción del método hace que el código en getObjects sea más conciso y expresivo. Por otra parte, el nuevo método nos permite centrarnos en el problema que queremos solucionar.

Al observar el método applySpectialTreatment confirmamos que no es más que una serie de condicionales que nos permiten hacer algo específico con los objetos que las cumplen. ¿Qué opciones tenemos para refactorizarlo?

No es buena idea pensar en mover la lógica a los propios objetos porque al final tendríamos que hacer una subclase por cada objeto concreto, lo que va contra la razón de ser de la Programación Orientada a Objetos.

Otra posibilidad sería mover la lógica y la responsabilidad a un nuevo objeto encargado de hacer este tratamiento especial. Este objeto puede pasarse como dependencia a APIReader para que éste le delegue la tarea. Más o menos así:

```php
class SpecialTreatment
{
	function apply($object)
	{
		if ($object->getId() === 'ob012') {
			$object->setData('new data for ob012');
		}
	
		if ($object->getPrice() === '123' && $object->isImportant()) {
			$object->prioritize();
		}
	
		// More changes to specific objects
	}
}

class APIReader 
{
	private $objects;
	private $SpecialTreatment;

	public function __construct(SpecialTreatment $specialTreatment)
	{
		$this->SpecialTreatment = $specialTreatment;
	}

	function getObjects()
	{
		$response = $this->getData();
		$objects = $this->parse($response);
		foreach ($objects as $object) {
			$object->doSomething();
			$this->SpecialTreatment->apply($object);
		}
	
		return $objects;
	}
}
```

## Tercer paso: desarrollo de la solución

Con el cambio anterior hemos separado la responsabilidad del tratamiento especial en una clase dedicada, de modo que APIReader queda liberado de esa tarea.

Nos queda pendiente desarrollar una solución que respete mejor el principio abierto/cerrado, que era uno de nuestros objetivos. Ahora mismo el código reside en otro lugar, lo que está bien, pero para añadir nuevas reglas necesitamos modificar el método apply que hemos creado en la clase SpecialTreatment.

He dejado para este momento el análisis de la estructura de condición->acción que se repite dentro del método apply. El hecho de que haya una repetición de código, aunque no sea literal, es un smell y nos debe llevar a plantearnos si es posible eliminarla.

Una posible solución es encapsular esas condiciones y acciones en clases a las que se puedan pasar nuestros objetos para ser evaluados y modificados. Por ejemplo:

```php
interface SpecialRule
{
	public function apply(Object $object);
}

class ModifyObjectWithId implements SpecialRule
{
	private $id;
	private $newData;

	public function __construct($id, $newData)
	{
		$this->id = $id;
		$this->newData = $newData;
	}

	public function apply($Object object)
	{
		if($object->getId() === $this->id) {
			$object->setData($this->newData);
		}
	}
}

class PrioritizeImportantObjectWithPrice implements SpecialRule
{
	private $price;

	public function __construct($price)
	{
		$this->price = $price;
	}

	public function apply(Object $object)
	{
		if($object->getPrice() === $this->price && $object->isImportant()) {
			$object->prioritize();
		}
	}
}

class SpecialTreatment
{
	function apply(Object $object)
	{
		$rule = new ModifyObjectWithId('ob012', 'new data for ob012');
		$rule->apply($object);
	
		$rule2 = new PrioritizeImportantObjectWithPrice('123');
		$rule2->apply($object);
	
		// More changes to specific objects
	}
}
```

Este cambio mejora un poco las cosas ya que las nuevas clases nos permiten reutilizar las reglas al ser parametrizables, pero no deja de ser bastante incómodo de aplicar y, si bien las clases son bastante explícitas en cuanto a cómo seleccionan los objetos y qué hacen con ellos, su uso no soluciona nuestro problema con Abierto/cerrado.

Para eso, tendríamos que poder pasar las reglas a SpecialTreatment de modo que no tengamos que instanciarlas dentro.

```php
class SpecialTreatment
{
	private $rules;
	
	public function __construct(array $rules)
	{
		$this->rules = $rules;
	}
	
	function apply(Object $object)
	{
		array_walk($this->rules, function($rule) use ($object) {
			$rule->apply($object);
		});
	}
}

$specialTreatment = new SpecialTreatment([
	new ModifyObjectWithId('ob012', 'new data for ob012'),
	new PrioritizeImportantObjectWithPrice('123')
]);
```

Esto empieza a tener mejor pinta. Ahora podríamos usar un DIC (Contenedor de inyección de dependencias) para montar todas las clases necesarias. No sería incluso muy difícil montar un sistema basado en un archivo yml o similar para poder configurar las reglas necesarias sin tener que tocar el código.

Aunque está mejor, todavía queda espacio para más mejoras. El problema que tenemos es que a pesar de haber declarado una interfaz para nuestras reglas especiales (SpecialRule), esto no nos proporciona ningún beneficio especial ya que construimos el objeto SpecialTreatment pasándole un array de reglas. Aunque no está mal chirría un poco.

Tenemos que introducir algún tipo de control:

```php
class SpecialTreatment
{
	private $rules;
	
	public function __construct(array $rules)
	{
		foreach ($rules as $rule) {
			$this->addRule($rule);
		}
	}
	
	private function addRule(SpecialRule $rule)
	{
		$this->rules[] = $rule;
	}
	
	function apply(Object $object)
	{
		array_walk($this->rules, function($rule) use ($object) {
			$rule->apply($object);
		});
	}
}

$specialTreatment = new SpecialTreatment([
	new ModifyObjectWithId('ob012', 'new data for ob012'),
	new PrioritizeImportantObjectWithPrice('123')
]);
```

Esto aún es mejorable. Tenemos un patrón que podría proporcionarnos una solución más elegante y es la Cadena de Responsabilidad. En pocas palabras: vamos a sutituir un array por una lista ligada que, a su vez, es un Composite de SpecialRule. Es decir, un número variable de SpecialRules actúan como si fuera una sola.

Para construir nuestra Cadena de Responsabilidad, convertimos la interfaz SpecialRule en clase abstracta, de modo que pueda proporcionar el comportamiento básico de la Cadena. Podemos construir la cadena fuera de SpecialTreatment, que deja de tener la responsabilidade de montarla.

Cambiamos un poco nuestras SpecialRules para adaptarnos al nuevo concepto y este es el resultado.

```php
abstract class SpecialRule
{
	private $next;
	
	abstract protected function execute(Object $object);
	
	public function apply(Object $object)
	{
		$this->execute($object);
		if($this->next) {
			return $this->next->run($object);
		}
	}
	
	public function chain(SpecialRule $rule)
	{
		if ($this->next) {
			return $this->next->chain($rule);
		}
		$this->next = $rule;
	}
}

class ModifyObjectWithId extends SpecialRule
{
	private $id;
	private $newData;

	public function __construct($id, $newData)
	{
		$this->id = $id;
		$this->newData = $newData;
	}

	protected function execute($Object object)
	{
		if($object->getId() === $this->id) {
			$object->setData($this->newData);
		}
	}
}

class PrioritizeImportantObjectWithPrice extends SpecialRule
{
	private $price;

	public function __construct($price)
	{
		$this->price = $price;
	}

	protected function execute(Object $object)
	{
		if($object->getPrice() === $this->price && $object->isImportant()) {
			$object->prioritize();
		}
	}
}

class SpecialTreatment
{
	private $rules;
	
	public function __construct(SpecialRule $rules)
	{
		$this->rules = $rules;
	}
	
	function apply(Object $object)
	{
		$this->rules->run($object);
	}
}

class APIReader 
{
	private $objects;
	private $SpecialTreatment;

	public function __construct(SpecialTreatment $specialTreatment)
	{
		$this->SpecialTreatment = $specialTreatment;
	}

	function getObjects()
	{
		$response = $this->getData();
		$objects = $this->parse($response);
		foreach ($objects as $object) {
			$object->doSomething();
			$this->SpecialTreatment->apply($object);
		}
	
		return $objects;
	}
}

$ruleChain = new ModifyObjectWithId('ob012', 'new data for ob012');
$ruleChain->chain(new PrioritizeImportantObjectWithPrice('123'));

$specialTreatment = new SpecialTreatment($ruleChain);

$reader = new APIReader($specialTreatment);

```

## Reflexiones post-refactor

Puede dar la impresión de que este es mucho trabajo para esta tarea, sin embargo, este tipo de refactorings suele merecer la pena. En cuanto tuviésemos 3 ó 4 casos especiales que tratar el código inicial comenzaría a ponerse bastante difícil de manejar.

Con el refactoring hemos conseguido varias cosas. La primera de ellas es que ahora es muchísimo más fácil y seguro añadir o cambiar las reglas para los casos especiales. Y como son independientes de cualquier otra parte del código, nada nos impide configurarlas de la manera que mejor nos convenga, con tal de garantizarnos que aquello que pasamos a SpecialTreatment es un SpecialRule válido que puede estar combinando decenas de reglas.

Una observación de la que me he dado cuenta al terminar este artículo es la posibilidad de trasladar el código al momento de creación de los objetos, aunque tengo mis dudas, dado las modificaciones del estado no siempre tendrían que estar asociadas a la creación. En cualquier caso, es una alternativa que habría que valorar, incluso considerando la posibilidad de plantearlo en ambos momentos: en la creación para los objetos que se pudiesen crear con datos erróneos, a fin de corregirlos antes de crearlos, y la modificación posterior.

