Validación vs invariantes
=========================

Este ladrillo que viene a continuación iba a titularse Validación Multicapa, pero después de leer unos cuantos artículos sobre el lugar de la validación en DDD, los engranajes comenzaron a moverse en mi cabeza y, aunque la idea original no iba desencaminada del todo, la estructura general tiene ahora más sentido.

La validación es el proceso mediante el cual nos aseguramos de que los datos introducidos al sistema cumplen ciertas condiciones necesarias para que puedan ser utilizados sin peligro, sin provocar errores, y proporcionen resultados, manteniéndose dentro de los límites de tolerancia de los algoritmos que los emplean.

Voy a poner un ejemplo algo chusco, pero creo que bastante claro. Supongamos que tengo un algoritmo que divide dos números entre sí, algo ciertamente complejo y al alcance sólo de un puñado de ninja developers:

```php
function divide($dividend, $divisor)
{
    return $dividend / $divisor;
} 
```

Como ya sabemos, si `$divisor` resulta ser `0` tenemos un problema porque va a saltar un Warning de PHP, así que nos interesa validarlo. El objetivo de la validación es que no se llegue a realizar la operación en caso de que $divisor sea 0 y, por tanto, poder reconducir el flujo para que el usuario tenga la oportunidad de introducir nuevos valores o que el programa haga alguna otra cosa al respecto, sin romperse.

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

Aunque podría ser así, para que el problema sea capturable (hay otras formas de hacerlo):

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

Obviamente la decisión de cómo tratar esto depende de cada situación particular.

## Primera línea de defensa: ponernos estrictos con los tipos

Examinemos el siguiente escenario:

```php
function divide(float $dividend, float $divisor)
{
    return $dividend / $divisor;
}

$dividend = 100;
$divisor = 'samarkanda';

$result = divide($dividend, $divisor);
print ('Result: '.$result);
```

Si el input procedente del exterior 



## Planteamiento inicial

Mi reflexión sobre este tema arranca al ver un ejemplo de código en el que los parámetros que recibe el endpoint de un API no se validan hasta que son utilizados dentro de un CommandHandler. Para verlo más en detalle:

* El controlador tras el endpoint recibe los parámetos
* Construye un objeto Command, que no es más que un DTO con propiedades públicas, sin ningún tipo de comportamiento (más sobre esto más adelante, porque para mí un Command es más que un DTO)
* El CommandHandler recibe los datos, extrayéndolos del Command, los valida y los sanea antes de utilizarlos

Aunque esto es correcto, observo cosas que no me gustan:

Yo llamaría a esto _validación tardía_ e implica que datos externos al sistema viajan a través de él sin ser controlados has el último momento, cuando ya se van a utilizar.

Lo malo es que entonces puede ser tarde para el feedback.

El principal problema que le veo a este forma de validación es que si en un futuro el Command se pasa a un CommandBus y si, además, éste se ejecuta en asíncrono (por ejemplo, porque se pasa a una cola), entonces el feedback de la validación nunca podrá llegar al consumidor de ese endpoint puesto que cuando se produzca la validación ya habrá sido necesario darle una respuesta, que sólo podrá ser del tipo "hemos cursado tu petición".

No hace falta imaginarse tanto. En realidad, conceptualmente podemos ver que el consumidor del endpoint sólo interacciona con el controlador y éste sólo puede informar con certeza de que la petición se ha realizado a la capa de aplicación y sólo puede esperar a que la capa de aplicación le devuelva algún resultado. Si esta devolución se produce de forma inmediata, perfecto, pero si no es así, la petición puede haber sido cursada, pero no podemos garantizar que se vaya a ejecutar.

Por ese motivo, lo correcto sería validar los datos en el controlador para poder montar el Command y pasarlo al Handler o al CommandBus, devolviendo una respuesta BadRequest (si es un API) o informando al usuario de los errores en la entrada de datos.



La regla de oro de la validación dice que, cuando no lo hemos generado nosotros, debemos desconfiar de cualquier dato que llegue a nuestro código, particularmente si lo proporcionan los usuarios, sean seres humanos o consumidores de nuestras apis.

Esto se traduce en que esos datos deben someterse a una validación, es decir, a un proceso que se asegure que cumplen una serie de condiciones que nos permitan tratarlos con garantías de que no van a suponer un problema. Ejemplos de problemas que queremos evitar son:

* De seguridad: como que un usuario malicioso pretenda usar la entrada de datos para inyectar algún tipo de código ejecutable, pero también los que buscan utilizar datos no válidos que puedan romper nuestro sistema y dejarlo expuesto de algún modo.
* De computación: utilizar tipos de datos incorrectos que provoquen errores en el funcionamiento del programa.
* Consistencia: que los datos no entren en los límites de tolerancia en los algoritmos, provocando resultados sin sentido, inconsistentes, etc.

En el contexto de una arquitectura en capas, cabe preguntarse cuándo debe realizarse la validación.

Por ejemplo, podríamos posponer la validación hasta el momento en que vayamos a utilizar los datos.

Supongamos una aplicación de gestión académica. Ésta expone un endpoint en el que obtener las notas de un grupo de estudiantes, en una asignatura (course), en un trimestre determinado. Algo así como:

```
/course/12345/grades?group=A012&term=2
```

Para manejar este endpoint tenemos un controlador y vamos a dar por hecho de que se trata de una capa tonta que simplemente toma los parámetros y se los pasa a un UseCase para obtener, la respuesta y pasársela a la vista.

```php
function grades($courseId, Request $request)
{
	$studentsGroup = $request->get('group', '');
	$term = $request->get('term', 0);
	$response = $this->GetGradesUsecase->execute($courseId, $studentsGroup, $term);
	$this->setView($response);
}
```

Como vemos aquí, el controlador no valida nada y se limita a pasar los datos recibidos al UseCase. Suponemos que es el UseCase quien hace la validación. Más o menos así.

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

### Problemas

El primer problema que encuentro en este planteamiento es que hay una dependencia de la capa de aplicación (el UseCase) respecto de la capa de infraestructura (el controlador). Tenemos que invertir esa dependencia en el sentido de que debe ser el controlador quien se adapte a las restricciones que ponga la capa de aplicación.

¿Dónde está esa dependencia? Pues en el hecho de que el UseCase acepta cualquier cosa que le pasa el controlador, sin definir un contrato, como le correspondería por su posición de capa más próxima al dominio. Ahora mismo, el UseCase solo declara que quiere que le pasen tres parámetros y que ya se ocupará de ver si le valen o no.

Por otro lado, pensemos en el principio de Única Responsabilidad (SRP): además de hacer lo que le toca, el UseCase tiene que validar los datos que recibe antes de poder utilizarlos. Y lo tiene que hacer no sólo por razones del dominio, sino por razones de implementación.

Me explico:

Tomemos, por ejemplo, el parámetro `group`. En el ejemplo vemos que es un string alfanumérico (A012) cuya estructura habría sido definida por los expertos del dominio. Por ejemplo, las reglas serían:

* El código consta de 4 caracteres alfanuméricos
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

Podríamos empezar con un Type Hinting que defina qué tipos son aceptables para el UseCase:

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

Pero está claro que el type hinting sobre escalares es insuficiente. Es cierto que nos ayuda un poco, pero tiene que haber formas de hacerlo mejor.

### Usando Value Objects

Al fin y al cabo, los Value Objects representan conceptos importantes de nuestro dominio que nos interesan por su valor y no por su identidad (aunque, en este caso, dos de ellos son, de hecho, identidades) y en algún momento los datos recibidos serán la base a partir de la cual se generarán. 

Sin embargo, ¿deberían salir los Value Objects a la capa de infraestructura? 

La respuesta más general es que no. La capa de infraestructura no debería saber nada del dominio, aparte de cómo comunicarse con la capa de aplicación, por lo que no tiene mucho sentido usar Value Objects en ella, salvo, quizá, algunos muy genéricos (como Money) que pueden ser compartidos por muchos dominios.

Pero en la capa de aplicación sí que podríamos tener Value Objects ya que la función de ésta es coordinar los elementos del dominio para realizar las operaciones que se solicitan.

Los Value Objects tienen comportamiento, normalmente destinado a proteger sus propias invariantes, y eso incluye su validación implícita. Por ejemplo, CourseId sólo nos permite crear Id para cursos que sean formalmente correctos:

```php
class CourseId {

    private $courseId;

    public function __construct(string $courseId)
    {
        $this->isValidCourseIdOrDie($courseId);
        $this->courseId = $courseId;
    }

    public function getCourseId() : string
    {
        return $this->courseId;
    }

    private function isValidCourseIdOrDie($courseId)
    {
        if (!preg_match('/^[PIL]\d{3,3}$/', $courseId)) {
            throw new InvalidArgumentException($courseId.' is an invalid Id');
        }
    }
}
```
Esto nos permite reescribir el UseCase de una manera un poco distinta, ya que la validación del Value Object descarga al UseCase de esa responsabilidad. Y lo más interesante, es que siempre que construyamos un objeto de estos, siempre será válido.

```php
class GetGradesUseCase
{
	private $gradesRepository;
	
	public function __construct(Repository $gradesRepository)
	{
		$this->gradesRepository = $gradesRepository;
	}
	
	public function execute(string $id, string $group, int $term)
	{
		$courseId = new CourseId($id);
		$studentsGroup = new StudentsGroup($group);
		$termId = new Term($term);
		
		// Domain related validation
		
		// Get data from repository
	}
}
```

Si es necesario, en el UseCase podríamos realizar otras validaciones relacionadas con el dominio.

### Usando un objeto Request

El UseCase espera tres parámetros lo que, sin ser un número exagerado, empieza a ser incómodo. Habrá UseCases que no esperen parámetros en absoluto y otros que trabajen con media docena o más.

Hay varias razones por las que es buena idea refactorizar las listas de varios parámetros por un Parameter Object que encapsule todos los necesarios para realizar una operación: es fácil de mantener, nos permite hacer type hinting específico del UseCase, es más fácil gestionar cuando hay muchos parámetros y, llegado el caso, nos da pie a modernizar la arquitectura si adoptamos Command Buses.

Evidentemente, la complejidad asociada con el número de parámetros, se traslada del UseCase al objeto Request, pero en realidad es mucho más fácil gestionarla aquí.

Veamos un ejemplo:

```php
class GetGradesRequest
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


En este caso, nuestro UseCase tendría que quedar así:

```php
class GetGradesUseCase
{
	private $gradesRepository;
	
	public function __construct(Repository $gradesRepository)
	{
		$this->gradesRepository = $gradesRepository;
	}
	
	public function execute(GetGradesRequest $request)
	{
		$courseId = new CourseId($request->getCourseId());
		$studentsGroup = new StudentsGroup($request->getStudentsGroup());
		$termId = new Term($request->getTerm());
		
		// Domain related validation

		// Get data from repository
	}
}
```

¿Es el objeto Request un DTO? Es decir, ¿es simplemente un objeto tonto con el que pasar datos o puede ser algo más?

Lo cierto es que un objeto Request puede ser más que un simple DTO.

Para empezar, podemos hacerlo inmutable, de modo que sólo tenga getters públicos, garantizando de este modo que mantiene la integridad de los datos.

Podemos hacer que valide los parámetros que recibe en construcción, 

* [Validation in Domain Driven Design](http://gorodinski.com/blog/2012/05/19/validation-in-domain-driven-design-ddd/)
* [Ddd Domain Validation, Actually Action Validation](http://www.codemozzer.me/domain,validation,action,composable,messages/2015/09/26/domain_validation.html)
* [Domain-Driven Design (DDD) With F# - Validation](http://gorodinski.com/blog/2013/04/23/domain-driven-design-with-fsharp-validation/)
* [At the Boundaries, Applications are Not Object-Oriented](http://blog.ploeh.dk/2011/05/31/AttheBoundaries,ApplicationsareNotObject-Oriented/)
* [Validation and DDD](http://enterprisecraftsmanship.com/2016/09/13/validation-and-ddd/)
* [C# code contracts vs input validation](http://enterprisecraftsmanship.com/2015/02/14/code-contracts-vs-input-validation/)