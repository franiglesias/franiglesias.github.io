---
layout: post
title: Clean Validation
categories: articles
tags: design-principles php
---

La validación es el proceso mediante el cual nos aseguramos de que los datos introducidos al sistema cumplen ciertas condiciones necesarias para poder utilizarlos sin peligro, sin provocar errores, y con la posibilidad de proporcionar resultados, al mantenerse dentro de los límites de tolerancia de los algoritmos que los emplean.

La regla de oro de la validación dice que, cuando no lo hemos generado nosotros, debemos desconfiar de cualquier dato que llegue a nuestro código, particularmente si lo proporcionan los usuarios, sean seres humanos o consumidores de nuestras apis.

Esto se traduce en que esos datos deben someterse a una validación, es decir, a un proceso que se asegure que cumplen una serie de condiciones que nos permitan tratarlos con garantías de que no van a suponer un problema. Ejemplos de los problemas que queremos evitar son:

* De seguridad: como que un usuario malicioso pretenda usar la entrada de datos para inyectar algún tipo de código ejecutable, pero también los que buscan utilizar datos no válidos que puedan romper nuestro sistema y dejarlo expuesto de algún modo.
* De computación: utilizar tipos de datos incorrectos que provoquen errores en el funcionamiento del programa.
* De consistencia: que los datos no entren en los límites de tolerancia en los algoritmos, provocando resultados sin sentido, inconsistentes, etc.

Voy a poner un ejemplo algo chusco, pero creo que bastante claro. Supongamos que tengo un algoritmo que divide dos números entre sí, algo ciertamente complejo y al alcance sólo de un puñado de ninja developers:

```php
function divide($dividend, $divisor)
{
    return $dividend / $divisor;
} 
```

Como ya sabemos, si `$divisor` resulta ser `0` tenemos un problema porque va a saltar un Warning de PHP, así que nos interesa validarlo. El objetivo de la validación es que no se llegue a realizar la operación en caso de que `$divisor` sea 0 y, por tanto, poder reconducir el flujo para que el usuario tenga la oportunidad de introducir nuevos valores o que el programa haga alguna otra cosa al respecto sin romperse, como cuando Siri se queja de que intentes freír su núcleo computacional.

Ahora bien, ¿en dónde ponemos ese control?

Podría ser en la propia función o método:

```php
function divide($dividend, $divisor)
{
    if ($divisor === 0) {
        return null;
    }
    return $dividend / $divisor;
} 
```

Aunque para que la situación sea capturable lo haríamos así (hay otras formas de hacerlo, como un error handler):

```php
function divide($dividend, $divisor)
{
    if ($divisor === 0) {
        throw new \InvalidArgumentException('Can not divide by zero');
    }
    return $dividend / $divisor;
} 

try {
    $result = divide($dividend, $divisor);
} catch (\Exception $exception) {
    print 'Give me a number other than 0'
}
```

O controlarlo fuera, tirando o no una excepción:

```php
function divide($dividend, $divisor)
{
    return $dividend / $divisor;
} 

if ($divisor !== 0) {
    $result = divide($dividend, $divisor);
} else {
    print('Can not divide by zero');
}
```

Podríamos objetar que el ejemplo es demasiado sencillo como para ser significativo (¿quién demonios necesita un método para dividir dos números?), pero el meollo aquí es que validar consiste en asegurarnos de que a nuestro código no lleguen datos inapropiados, interceptándolos antes y decidiendo cómo actuar si los detectamos.

## Poniéndonos estrictos con los tipos

Examinemos el siguiente escenario, necesitamos asegurar que los datos que se nos pasan son de un tipo determinado:

```php
function doSomething($aString, $aNumber)
{
    if(!is_string($aString)) {
        throw new \InvalidArgumentException('$aString should be a string');
    }
    if (!is_int($aNumber)) {
        throw new \InvalidArgumentException('$aNumber should be an int');
    }
    
    // The real work happens here
}
```

Con PHP 7 validar de esta forma los tipos no tiene mucho sentido, al fin y al cabo, no tenemos más que hacer esto:

```php
function doSomething(string $aString, int $aNumber)
{
    // The real work happens here
}
```

En ambos casos se va a producir el mismo resultado: si uno de los argumentos se pasa con el tipo incorrecto, se lanzará una excepción.

Bueno… no siempre:

```php
function doSomething(string $aString, int $aNumber)
{
    return $aString . '-' . $aNumber;
}

echo doSomething('string', '12');

---> string-12
```

A no ser que declares strict_types, lo que probablemente saltaría las costuras de cienes y cienes de aplicaciones:

```php
declare(strict_types=1);

function doSomething(string $aString, int $aNumber)
{
    return $aString . '-' . $aNumber;
}

echo doSomething('string', '12');

---> Fatal Error: Type Error
```

En resumidas cuentas, esto nos indica que podemos confiar ciertas partes de la validación al propio lenguaje utilizando el type hinting, sobre todo si lo hacemos estricto (aunque sospecho que no sería lo habitual).

La principal ventaja es que podemos eliminar de nuestro código unas cuantas líneas que no tienen que ver con la lógica del método o función, y esto mola mucho porque podemos centrarnos en los tests que verdaderamente hacen válidos los datos. Ten en cuenta que en los lenguajes con tipado estricto este debate anterior ni siquiera se considera.

En último término, lo que estamos haciendo es estableciendo un contrato o interfaz (aunque no la declaremos explícitamente como interface), sobre cómo se usa esa función o método, contrato que el consumidor del mismo tendría que respetar y, por tanto, es posible que necesite realizar sus propias validaciones. En cierto modo, trasladamos el problema, o parte de él, a una capa más alejada del dominio.

## Validación y capas

En realidad, mi interés sobre este tema para hacer un artículo viene de ver un ejemplo de código en el que los parámetros que recibe el endpoint de un API no se validan hasta que son utilizados dentro de un UseCase.

Yo llamaría a esto _validación tardía_ e implica que datos externos al sistema viajan a través de él sin ser controlados has el último momento, cuando ya se van a utilizar. Lo malo es que entonces puede ser tarde para el feedback y la lógica del UseCase se contamina de cuestiones que no tendría por qué tratar.

Un UseCase puede entenderse como un ejemplo de patrón Command. El UseCase representa un caso de uso de nuestra aplicación, por algo se llama UseCase, pero el patrón subyacente es el Command clásico. Los UseCase residen en la capa de Aplicación y su función es coordinar al dominio para realizar una tarea significativa.

En fin, veámoslo en código, un poco más detalladamente.

Supongamos una aplicación de gestión académica. Ésta expone un endpoint en el que obtener las notas de un grupo de estudiantes, en una asignatura (course), en un trimestre determinado. Algo así como:

```
/course/12345/grades?group=A012&term=2
```

Para manejar este endpoint tenemos un controlador y vamos a dar por hecho de que se trata de una capa tonta que simplemente toma los parámetros y se los pasa a un UseCase para obtener la respuesta y pasársela a la vista.

```php
function grades($courseId, Request $request)
{
	$studentsGroup = $request->get('group', '');
	$term = $request->get('term', 0);
	$response = $this->GetGradesUsecase->execute($courseId, $studentsGroup, $term);
	$this->setView($response->getData());
}
```

Como vemos aquí, el controlador no valida nada y se limita a pasar los datos recibidos al UseCase, así que suponemos que es éste quien hace la validación. Más o menos así:

```php
class GetGradesUseCase
{
	private $gradesRepository;
	
	public function __construct(Repository $gradesRepository)
	{
		$this->gradesRepository = $gradesRepository;
	}
	
	public function execute($courseId, $studentsGroup, $term)
	{
		$this->validateCourseIdOrThrowException($courseId);
		$this->validateStudentsGroupOrThrowException($studentsGroup);
		$this->validateTermOrThrowException($term);
		// Get data from repository
	}
}
```

(Es cierto que este UseCase no es un buen ejemplo de patrón Command, pero quería ir paso a paso, empezando por un controlador completamente tonto.)

### Problemas

El primer problema que encuentro en este planteamiento es que hay un acoplamiento de la capa de aplicación (el UseCase) respecto de la capa de infraestructura (el controlador). Es un poco sutil, pero lo podemos detectar en el hecho de que una capa que no debería tener contacto con el mundo exterior "sabe" que debe desconfiar de los parámetros que recibe, pues no ha definido un contrato como le correspondería por su posición de capa más próxima al dominio. Ahora mismo, el UseCase solo declara que quiere que le pasen tres parámetros y que ya se ocupará de ver si le valen o no.

Tenemos que invertir esa dependencia en el sentido de que debe ser el controlador quien se adapte a las restricciones que ponga la capa de aplicación. En una arquitectura limpia la dirección de las dependencias es de fuera hacia adentro.

Imagina una situación bastante típica: el mismo UseCase se utiliza con datos de un formulario al que se accede desde una web y en un API Rest: ¿tendríamos que considerar en el UseCase que los datos recibidos necesitasen una validación particular por la forma en que nos llegan? Creo que la respuesta es no: el UseCase tendría que establecer un contrato que garantice que los datos van a llegar en ciertas condiciones.

Por otro lado, pensemos en el principio de Única Responsabilidad (SRP): además de hacer lo que le toca, el UseCase tiene que validar los datos que recibe antes de poder utilizarlos. Y lo tiene que hacer por dos tipos de razones: por reglas del dominio, y por motivos de implementación.

Me explico:

Tomemos, por ejemplo, el parámetro `group`. En el ejemplo vemos que es un string alfanumérico (A012) cuya estructura habría sido definida por los expertos del dominio. Por ejemplo, las reglas serían:

* El código consta de 4 caracteres
* El primer carácter es una de estas tres letras: P, I y L, que representan diferentes modalidades de asistencia (Presencial, Intensiva y En línea).
* Los siguientes caracteres son numéricos y representan el orden de creación del grupo.

Estas reglas reflejan dos tipos de restricciones:

* De implementación: tanto del tipo básico de dato (string) como de su estructura (una letra y tres números). Según estas reglas, el código B301 sería válido, pero el XM01 no.
* De dominio: con las reglas de implementación se pueden crear numerosos códigos de grupo, pero no todos son válidos en el dominio ya que no representarían grupos válidos. Según esta reglas el código B301 no puede ser válido (la letra no es ni P, ni I, ni L).

Así que, en realidad, tendría sentido hacer varias validaciones:

* Una validación que nos garantice que el dato está bien construido.
* Una validación que nos garantice que el dato es conforme a las reglas del dominio.

El punto es que esas validaciones podrían darse en lugares diferentes.

Sería responsabilidad del controlador pasar al UseCase un dato correctamente construido. Y sería responsabilidad del UseCase determinar si puede manejar el dato que le hemos pasado.

Vamos a ver cómo se podría implementar esto:

### Usando *Type Hinting*

Una de las reglas de la validación es que debería ocurrir cerca de donde se usan los datos validados y, en consecuencia, la unidad de software que los utiliza se encarga de validarlos.

Pero, como señalamos en la primera parte del artículo, podemos delegar en el sistema de tipado nuestra primera línea de defensa:

```php
class GetGradesUseCase
{
	private $gradesRepository;
	
	public function __construct(Repository $gradesRepository)
	{
		$this->gradesRepository = $gradesRepository;
	}
	
	public function execute(string $courseId, string $studentsGroup, int $term)
	{
		$this->validateCourseIdOrThrowException($courseId);
		$this->validateStudentsGroupOrThrowException($studentsGroup);
		$this->validateTermOrThrowException($term);
		// Get data from repository
	}
}
```

Ahora bien, ¿podríamos hacer esto mejor?

### Usando un Parameter Object

El UseCase espera tres parámetros lo que, sin ser un número exagerado, empieza a ser incómodo. Habrá UseCases que no esperen parámetros en absoluto y otros que trabajen con media docena o más.

Hay varias razones por las que es buena idea refactorizar las listas de varios parámetros por un Parameter Object que encapsule todos los necesarios para realizar una operación: es fácil de mantener, nos permite hacer type hinting específico del UseCase, es más fácil gestionar cuando hay muchos parámetros y, llegado el caso, nos da pie a modernizar la arquitectura si adoptamos Command Buses.

En este caso, la pareja formada por el Parameter Object y el UseCase se convierte en un patrón Command/Command Handler. El Parameter Object/Command es el mensaje y encapsula los datos necesarios. El Command Handler/UseCase recibe ese Command, extrae sus datos e invoca los objetos de dominio que deben realizar la tarea.

Evidentemente, la complejidad asociada con el número de parámetros, se traslada del UseCase al objeto Command, pero en realidad es mucho más fácil gestionarla aquí.

Veamos un ejemplo:

```php
class GetGradesCommand
{
    private $courseId;
    private $studentsGroup;
    private $term;

    public function __construct(string $courseId, string $studentsGroup, int $term)
    {
        $this->courseId = $courseId;
        $this->studentsGroup = $studentsGroup;
        $this->term = $term;
    }

    public function getCourseId()
    {
        return $this->courseId;
    }

    public function getStudentsGroup()
    {
        return $this->studentsGroup;
    }

    public function getTerm()
    {
        return $this->term;
    }
}
```
En este caso, nuestro UseCase, al que voy a cambiar de nombre por claridad, tendría que quedar así:

```php
class GetGradesCommandHandler
{
	private $gradesRepository;
	
	public function __construct(Repository $gradesRepository)
	{
		$this->gradesRepository = $gradesRepository;
	}
	
	public function execute(GetGradesCommand $request)
	{
		$courseId = new CourseId($request->getCourseId());
		$studentsGroup = new StudentsGroup($request->getStudentsGroup());
		$termId = new Term($request->getTerm());
		
		// Domain related validation

		// Get data from repository
	}
}
```

Y nuestro controlador, más o menos así:

```php
function grades($courseId, Request $request)
{
	$studentsGroup = $request->get('group', '');
	$term = $request->get('term', 0);
	$command = new GetGraderCommand($courseId, $studentsGroup, $term);
	$response = $this->GetGradesCommandHandler->execute($command);
	$this->setView($response->getData());
}
```

(Nueva nota: esto puede desacoplarse aún más usando un Command Bus, pero entonces el artículo iría más de Command Buses que validación.)

¿Es el objeto Request un DTO? Es decir, ¿es simplemente un objeto tonto con el que pasar datos a través de propiedades públicas o puede ser algo más?

Lo cierto es que un objeto Request puede, y mi opinión es que **debe**, ser más que un simple DTO.

Para ello, los datos se pasarían en construcción con type hinting, para garantizar que el Command se construye como es debido y es consistente en el sentido de que el Handler podrá utilizar esos datos preocupándose sólo de validarlos para las necesidades específicas de su tarea.

Por otro lado, en caso de que este objeto Command lo necesitase, podría admitir parámetros opcionales, lo que quedaría expresado en forma de setters.

## Saneamiento

Con todo, aún nos quedaría tratar otro tema relacionado con la validación, como sería el saneamiento (Sanitize) de los datos. Es decir: para no tener que ser tremendamente estrictos con la validación de los datos, podríamos ocuparnos de limpiarlos y normalizarlos. Retomando el ejemplo del código anterior, podríamos aceptar "p - 001  " eliminando espacios espacios y guiones y pasando el string a mayúsculas, lo que nos daría un nuevo string "P001" que cumple las especificaciones de formato.

De nuevo, se nos plantea el problema de dónde realizar esta operación. ¿Lo dejamos para el último momento o podemos hacerlo antes de llegar al Handler?

Al igual que ocurre con la validación, pienso que es posible realizar diversos saneamientos en distintas capas de la arquitectura, si cada una de las capas fuerza las reglas que ha de cumplir la capa adyacente.

En este sentido, cuestiones como escape de caracteres especiales, eliminación de espacios al principio y final de los strings y otros saneamientos generales suelen estar incorporados de forma nativa en los frameworks, de modo que no tenemos que lidiar con esos problemas de entrada, lo que apoyaría la idea principal de este artículo: hagamos las validaciones y saneamientos genéricos cuanto antes y apliquemos las reglas que correspondan a cada capa.

## En resumen

En pocas palabras, el punto de este artículo sería proponer que la validación puede ser un proceso multicapa y, hasta cierto punto, redundante. En lugar de acumular toda las operaciones de validación en un solo lugar, cada capa de la arquitectura establecería las reglas de paso de los datos, de modo que las capas más externas sean las que tengan que cumplir las restricciones.

## Algunas referencias

* [Validation in Domain Driven Design](http://gorodinski.com/blog/2012/05/19/validation-in-domain-driven-design-ddd/)
* [Ddd Domain Validation, Actually Action Validation](http://www.codemozzer.me/domain,validation,action,composable,messages/2015/09/26/domain_validation.html)
* [Domain-Driven Design (DDD) With F# - Validation](http://gorodinski.com/blog/2013/04/23/domain-driven-design-with-fsharp-validation/)
* [At the Boundaries, Applications are Not Object-Oriented](http://blog.ploeh.dk/2011/05/31/AttheBoundaries,ApplicationsareNotObject-Oriented/)
* [Validation and DDD](http://enterprisecraftsmanship.com/2016/09/13/validation-and-ddd/)
* [C# code contracts vs input validation](http://enterprisecraftsmanship.com/2015/02/14/code-contracts-vs-input-validation/)
