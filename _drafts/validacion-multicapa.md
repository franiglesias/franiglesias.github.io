Validación
==========
La regla de oro de la validación es que si no lo hemos generado nosotros, debemos desconfiar de cualquier dato que llegue a nuestro código, particularmente los que proporcionan los usuarios, sean seres humanos o consumidores de nuestras apis.

Esto se traduce en que esos datos deben someterse a una validación, es decir, a un proceso que se asegure que cumplen una serie de condiciones que nos permitan tratarlos con garantías de que no van a suponer un problema. Ejemplos de problemas que queremos evitar son:

* De seguridad: como que un usuario malicioso pretenda usar la entrada de datos para inyectar algún tipo de código ejecutable, pero también los que buscan utilizar datos no válidos que puedan romper nuestro sistema y dejarlo expuesto de algún modo.
* De computación: utilizar tipos de datos incorrectos que provoquen errores en el funcionamiento del programa.
* Consistencia: que los datos no entren en los límites de tolerancia en los algoritmos, provocando resultados sin sentido, inconsistentes, etc.

En el contexto de una arquitectura en capas, cabe preguntarse cuándo debe realizarse la validación.

Por ejemplo, podríamos posponer la validación hasta el momento en que vayamos a utilizar los datos.

Pongamos, por ejemplo, una aplicación de gestión académica. Ésta expone un endpoint en el que obtener las notas de un grupo de estudiantes, en una asignatura (course), en un trimestre determinado. Algo así como:

```
/course/12345/grades?group=A012&term=2
```

Para manejar este endpoint tenemos un controlador y vamos a dar por hecho de que se trata de una capa tonta que simplemente toma los parámetros y se los pasa a un Service o UseCase para obtener, a cambio, la respuesta y pasársela a la vista.

```php
function grades($courseId, Request $request)
{
	$studentsGroup = $request->get('group', '');
	$term = $request->get('term', 0);
	$response = $this->GetGradesUsecase->execute($courseId, $studentsGroup, $term);
	$this->set($response);
}
```

Como vemos aquí, el controlador no valida nada y se limita a pasar los datos recibidos al UseCase. Suponemos que es el UseCase quien hace la validación. Más o menos así.

```php
class GetGradesUseCase
{
	private $gradesRepository;
	
	public function __construct(Repository $gradesRepository)
	{
		$this->gradesRespository = $gradesRepository;
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

* De implementación: tanto del tipo básico de dato (string) como de su estructura (una letra y tres números). Según estas reglas, el código B301 sería válido, pero el X001 no.
* De dominio: con las reglas de implementación se pueden crear numerosos códigos de grupo, pero no todos son válidos en el dominio ya que no representarían grupos válidos. Según esta reglas el código B301 no puede ser válido (la letra no es ni P, ni I, ni L).

Así que, en realidad, tendría sentido hacer varias validaciones:

* Una validación que nos garantice que el dato está bien construido.
* Una validación que nos garantice que el dato es conforme a las reglas del dominio.

El punto es que esas validaciones podrían darse en lugares diferentes.

Sería responsabilidad del controlador pasar al UseCase un dato correctamente construido. Y sería responsabilidad del UseCase determinar si puede manejar el dato que le hemos pasado.

Vamos a ver cómo se podría implementar esto:

### Type Hinting

Podríamos empezar con un Type Hinting que defina qué tipos son aceptables para el UseCase:

```php
class GetGradesUseCase
{
	private $gradesRepository;
	
	public function __construct(Repository $gradesRepository)
	{
		$this->gradesRespository = $gradesRepository;
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

El type hinting sobre tipos escalares es claramente insuficiente para nuestro objetivo, así que ¿por qué no usar nuestros propios tipos?

### Usando Value Objects

Al fin y al cabo, los Value Objects representan conceptos importantes de nuestro dominio que nos interesan por su valor y no por su identidad (aunque, en este caso, dos de ellos son, de hecho, identidades).




