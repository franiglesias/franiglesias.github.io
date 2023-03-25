---
layout: post
title: Desacoplarse del sistema
categories: articles
tags: golang testing good-practices refactoring
---

Es muy posible que estés trabajando en algún proyecto que necesite manejar fechas u horas, o incluso algo de aleatoridad. Todos los lenguajes incluyen alguna librería estándar para gestionar estos datos. O bien existen paquetes alternativos para responder a ciertas necesidades. Por ahí estamos bien servidas, pero hay un aspecto que con frecuencia pasamos por alto: trabajar con fechas, horas o números aleatorios nos acopla al sistema.

## ¿Y cuál es el problema?

A primera vista esto puede que no parezca problemático. Al fin y al cabo, es de lo más normal tener que lidiar con este tipo de datos y, bastantes veces, es hasta inocuo.

Pero, ¿qué pasa cuando un comportamiento relevante o una regla de negocio dependen de la hora o de la fecha? Pues pasa que nos topamos con lo impredecible. No es posible saber con antelación qué hora o fecha vamos a obtener al consultar el reloj del sistema, de un modo parecido a que no es posible predecir un número aleatorio. Y eso se pone de manifiesto de forma dramática en los tests.

Una acción típica es añadir una marca de tiempo a algún objeto, como puede ser un evento. Típicamente, obtenemos un timestamp del sistema y lo asignamos. Trabajo hecho.

A la hora de testear esto tampoco supone mucho problema. En muchos casos, nos bastaría con garantizar que el objeto tiene esa marca de tiempo no vacía. Si me apuras, podríamos hacer algo en la línea del property testing y asegurar que el timestamp asignado al objeto es igual o mayor a otro timestamp que hemos recogido justo antes de ejecutar la unidad bajo test.

El problema viene cuando el comportamiento depende del tiempo: "haz esto si han transcurrido más de un cierto número de días, horas o minutos." O "marca este objeto como caducado si su fecha de creación ha superado cierto límite".

Ahí entra en juego la impredictibilidad del tiempo. No podemos saber cuando se va a ejecutar un test, por lo que no podemos saber qué hora nos va a proporcionar el reloj del sistema. En consecuencia no podemos testear nada. A veces, podemos intentar realizar tests en estas condiciones, aunque es posible que pasen o fallen solo a partir de una fecha específica, o dependiendo de la hora a la que se ejecuten.

La mejor técnica para evitar esto es introducir nuestro propio reloj, encapsulando el reloj del sistema en un objeto que podamos reemplazar por un reloj personalizado de acuerdo a nuestras necesidades.

## Clock Service

Siempre que puedo introduzco un _Clock Service_ en los proyectos en los que trabajo. La idea es disponer de una abstracción de un proveedor de tiempo que, en producción, es implementado con el reloj del sistema, por el lenguaje o una librería de terceros, y con diferentes tipos de dobles en el entorno de test. La idea es que cuando necesitemos saber la hora siempre llamemos a esta abstracción.

Se trata de una aplicación de un patrón _Adapter_. Definimos una interfaz que nos resulte útil y la implementamos usando la librería estándar del lenguaje o aquella que más nos convenga. He aquí un ejemplo sencillo en Golang:

```go
package domain

import "time"

type ClockService interface {
	Now() time.Time
}
```

Para la aplicación en la que estoy trabajando de momento solo necesito obtener la hora actual del sistema. La implementación de producción sería algo así:

```go
package infrastructure

import "time"

type SystemClockService struct {
}

func NewSystemClockService() SystemClockService {
	return SystemClockService{}
}

func (s SystemClockService) Now() time.Time {
	return time.Now()
}
```

En este caso, utilizo el tipo nativo `time.Time` sin mayores problemas, aunque podría ir un poco más allá y definir un nuevo tipo para representar el tiempo conforme a las necesidades de mi aplicación. En cualquier caso, `ClockService` se inyecta a todos los objetos que necesiten obtener fechas u horas del sistema.

Una ventaja de usar `ClockService` es que puedo forzar algunas cosas y ganar un poco de paz de espíritu. Por ejemplo, podría hacer que todos mis timestamp fuesen _UTC_. De este modo siempre me garantizo una zona horaria coherente, a la vez que puedo adaptarme a las zonas horarias de las usuarias.

```go
type UTCSystemClock struct {}

func (c UTCSystemClock) Now() time.Time {
	return time.Now().UTC()
}
```

Vamos a ver un ejemplo de uso. La siguiente es una implementación típica para tests. En la inmensa mayoría de casos, lo que voy a querer es asegurar que `ClockService` entrega una hora conocida durante el test, de modo este sea totalmente independiente del reloj del sistema. La siguiente implementación sería un _stub_ configurable, que nos permite tener un `ClockService` que siempre da la misma hora, la cual defino al construirlo.

```go
package test

import "time"

type FixedClock struct {
	time time.Time
}

func NewFixedClockAt(t time.Time) FixedClock {
	return FixedClock{time: t}
}

func (c FixedClock) Now() time.Time {
	return c.time
}
```

No tenemos más que inyectarlo en los objetos que lo necesiten para testearlos con toda seguridad.

Vamos a verlo aplicado a un caso realista: `GenerateKey` construye una clave con la que identificar los datos que vamos a guardar en un _Redis_. Esta clave se basa la hora del sistema, un valor aleatorio para el caso de que haya una coincidencia temporal y algunos datos extraídos de la payload que se quiere persistir.

El servicio `GenerateKey` recibe, por tanto, los colaboradores que cumplen las interfaces `ClockService` y `RandomGenerator` para que le proporcionen la marca de tiempo y el valor aleatorio.

```go
type GenerateKey struct {
	clock  ClockService
	random RandomGenerator
}

func NewGenerateKey(clock ClockService, random RandomGenerator) GenerateKey {
	return GenerateKey{
		clock, 
		random,
	}
}

func (k GenerateKey) FromPayload(payload string) string {
	date := k.clock.Now()
	random := k.random.Integer(0, 10000)

	fromPayload, _ := storageKeyFromPayload(payload, date, strconv.FormatInt(random, 10))
	return fromPayload
}
```

Aquí podemos ver un fragmento de test en el que configuramos el servicio `GenerateKey` con los dobles para test. Ambos proporcionan al servicio valores predeterminados que no van a cambiar, de forma que podemos testearlos fácilmente.

`want` representa la clave que esperamos generar. Como se puede ver, la construimos a partir de los datos que sabemos que están en la payload (no la muestro por razones obvias) y dos representaciones del timestamp proporcionado por `ClockService`.

```go
func TestStorageKeyGivenPayload(t *testing.T) {

	now := time.Now()
	datePath := now.Format("2006/01/02")
	timeStamp := now.Format("20060102150405")
	generateKey := domain.NewGenerateKey(test.NewFixedClockAt(now), test.NewFixedRandom("123"))

	t.Run("should generate key from payload", func(t *testing.T) {
        //...
		want := fmt.Sprintf(
	    	"/001/%s/uid1st_uid3rd_%s_1033485_2094d635a758213b14ea0a4f67719d4b_0123.json", 
			datePath,
			timeStamp,
        )
        got := generateKey.FromPayload(payload)

        assert.Equal(t, want, got)
	})
}
```

De este modo y gracias a haber abstraído el servicio de reloj, podemos testear fácilmente cualquier comportamiento que dependa de la hora del sistema. Lo mismo podemos decir del `RandomGenerator`, interfaz que definimos bajo las mismas premisas que `ClockService`.

## ¿Hay que usar siempre el `ClockService`?

Aunque sería lo ideal, no siempre es realmente necesario. Así, cuando no necesitamos realizar ninguna operación sobre el valor de un _timestamp_, podríamos acceder directamente al reloj del sistema, por conveniencia. Un uso típico sería cuando necesitamos que un objeto contenga una marca de tiempo como los habituales `createdAt` o `updatedAt`, los cuales no necesitamos siquiera testear explícitamente, ya que un test sobre ellos lo único que verifica es que el reloj del sistema funciona. Aparte de que, posiblemente, podríamos testearlos indirectamente.

Vamos a verlo en un ejemplo. En una aplicación de gestión de tareas podríamos tener un objeto `Task`:

```go
type Task struct {
	created     time.Time
	title       string
	description string
	done        bool
}
```

Una posible constructora sería esta:

```go
func MinimalTask(title, description string) Task {
	return Task{
		created:     time.Now(),
		title:       title,
		description: description,
		done:        false,
	}
}
```

En principio, no tiene nada de malo. Especialmente en Go, ya que la función constructora no es más que una función independiente que devuelve instancias de un tipo pobladas con los datos que nos interesen.

Sí puede ser buena práctica que los objetos no instancien ellos mismos sus objetos de tiempo, sino que se los inyectemos. Esto nos permitiría refactorizar fácilmente al uso de un `ClockService` si llegase la ocasión. Esto en Go es bastante natural porque no existe el concepto de _constructor_ de un objeto, sino que es opcional el usar una función constructora, que es bastante parecida al tipo de constructor estático o secundario que usamos en otros lenguajes. 

En el siguiente ejemplo, la constructora recibe un objeto `time.Time` ya instanciado. Esta sería una mejor práctica.

```go
func NewTask(created time.Time, title, description string) Task {
	return Task{
		created:     created,
		title:       title,
		description: description,
		done:        false,
	}
}
```

Una consecuencia es que, de este modo, sí podríamos testear que la asignación de tiempo se hace correctamente, ya que al inyectarlo podemos fijarlo y tenerlo controlado. Este ejemplo es muy trivial y normalmente no lo testearía, pero creo que refleja bien lo que quiero decir.

```go
func TestTask(t *testing.T) {
	t.Run("create", func(t *testing.T) {
		created := time.Now()
		task := NewTask(created, "Title", "Description")
		assert.Equal(t, created, task.created)
	})
}
```

Otra forma de hacerlo es pasar el `ClockService`:

```go
func NewTaskWithService(clock ClockService, title, description string) Task {
	return Task{
		created:     clock.Now(),
		title:       title,
		description: description,
		done:        false,
	}
}
```

Aquí tenemos el test:

```go
func TestTask(t *testing.T) {
	// removed code

	t.Run("create with clock service", func(t *testing.T) {
		created := time.Now()
		clock := ClockFixedAt{time: created}
		task := NewTaskWithService(clock, "Title", "Description")
		assert.Equal(t, created, task.created)
	})
}
```

La ventaja de usar `ClockService` sería garantizar que la marca de tiempo proporcionada cumpla todas las especificaciones que pudiésemos tener definidas. Por ejemplo, antes mencionábamos un posible `UTCSystemClock` que nos daría siempre horas en la zona horaria UTC, lo cual puede ser crítico para aplicaciones que se desplieguen en diferentes zonas horarias. Eso es algo que no podríamos garantizar de hacerlo directamente.

Las tres constructoras nos permiten crear el mismo objeto. La primera, y más simple, no nos permite testear el objeto que acabo de instanciar.

## Constructora primaria

En Go, la forma `canónica` de construir un objeto es muy directa:

```go
task := Task{
		created:     time.Time(),
		title:       "Title",
		description: "Description",
		done:        false,
	}
```

Pero suele ser sano disponer de, al menos, una función constructora, la cual se encargará de hacer cumplir las pre-condiciones e invariantes que sean necesarias. En nuestro ejemplo, la constructora primaria podría ser:

```go
func NewTask(created time.Time, title, description string) Task {
	return Task{
		created:     created,
		title:       title,
		description: description,
		done:        false,
	}
}
```

Lo normal es que necesitemos una función constructora para preparar los valores que vamos a asignar al objeto o `struct` y asegurar que cumplen las pre-condiciones necesarias.

¿Y por qué la llamo _primaria_? Porque define la forma básica en que debo construir una nueva `Task`. Y, de hecho, podría hacer que las otras constructoras, que serían _constructoras secundarias_, la utilicen de esta manera:

```go
func MinimalTask(title, description string) Task {
	return NewTask(
		time.Now(),
		title,
		description
    )
}
```

O así:

```go
func NewTaskWithService(clock ClockService, title, description string) Task {
	return NewTask(
		clock.Now(),
		title,
		description,
    )
}
```

De este modo, garantizamos que cualquier pre-condición o invariante definida en la constructora primaria sea respetada.

## Usar `ClockService` sí o sí

Como ya hemos dicho, si no vamos a hacer cálculos o a tomar decisiones basadas en esa marca de tiempo, recurrir al reloj del sistema directamente no es especialmente perjudicial. Sin embargo, en el caso de que eso llegue a cambiar, la reescritura puede ser considerable, por lo que posiblemente merece la pena, como norma general, pasar los valores en lugar de instanciarlos, usando constructores o pasando el servicio de reloj al constructor.

En cambio, cuando hago cálculos o tomo decisiones basadas en la fecha u hora puedo ver las ventajas de usar un servicio de reloj.

Supongamos que quiero tener un método que me diga el estado de una tarea no completada basándose en el tiempo que ha trascurrido desde su creación. Algo como esto:

* Si se ha creado el mismo día: starting
* Si tiene menos de tres días: in progress
* Si tiene entre 3 y 5 días: delayed
* Si tiene más de 5 días: blocked
* Si done es true: finished

Para testear que el método devuelve los valores correctos, tenemos que poder controlar como mínimo la fecha de creación. Y mejor aún si podemos controlar tanto la de creación como la de revisión.

```go
func TestTask(t *testing.T) {
    // Removed code
	
	t.Run("status starting if created same day", func(t *testing.T) {
		created := time.Now()
		createdClock := ClockFixedAt{time: created}
		checkClock := ClockFixedAt{time: created}

		task := NewTaskWithService(createdClock, "Example", "This task is starting")

		assert.Equal(t, "starting", task.Status(checkClock))
	})
}
```

Aquí el código de producción:

```go
func (t Task) Status(clock ClockService) string {
	check := clock.Now()
	if check.Sub(t.created).Hours()/24 == 0 {
		return "starting"
	}
	return ""
}
```

Un nuevo test, para el siguiente estado:

```go
	t.Run("status in progress if less than 3 days old", func(t *testing.T) {
		created := time.Now()
		createdClock := ClockFixedAt{time: created}
		checkClock := ClockFixedAt{time: created.Add(time.Hour * 48)}

		task := NewTaskWithService(createdClock, "Example", "This task is in progress")

		assert.Equal(t, "in progress", task.Status(checkClock))
	})
```

Y su implementación:

```go
func (t Task) Status(clock ClockService) string {
	check := clock.Now()
	elapsedDays := check.Sub(t.created).Hours() / 24
	if elapsedDays == 0 {
		return "starting"
	}
	if elapsedDays < 3 {
		return "in progress"
	}
	return ""
}
```

Parece bastante obvio cómo habría que seguir con esta implementación. Podríamos haber pasado tiempos directamente, en vez del servicio, y hubiese funcionado igual, pero lo que me interesa señalar es que el uso de `ClockService`, nos permite realizar tests con toda facilidad y probar cualquier condición.

Esta es la versión final de los tests:

```go
func TestStatusDependsOnTheDays(t *testing.T) {
	tests := []struct {
		name string
		days int
		want string
	}{
		{name: "Same day", days: 0, want: "starting"},
		{name: "Less than 3 days", days: 2, want: "in progress"},
		{name: "More than 3 and less than 5 days", days: 4, want: "delayed"},
		{name: "More than 5 days", days: 6, want: "blocked"},
	}
	created := time.Now()
	createdClock := ClockFixedAt{time: created}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			checkClock := ClockFixedAt{time: created.AddDate(0, 0, test.days)}
			task := NewTaskWithService(createdClock, "Example", "This task is in progress")
			assert.Equal(t, test.want, task.Status(checkClock))
		})
	}
}
```

Y el código de producción:

```go
func (t Task) Status(clock ClockFixedAt) string {
	elapsedDays := clock.Now().Sub(t.created).Hours() / 24
	if elapsedDays == 0 {
		return "starting"
	}
	if elapsedDays < 3 {
		return "in progress"
	}
	if elapsedDays < 5 {
		return "delayed"
	}
	return "blocked"
}
```

Un argumento a favor de pasar `ClockService` sería que la regla de negocio fuese que `Status` _siempre_ se debe calcular con respecto a la fecha actual, que es lo que proporciona `ClockService.Now()`, de tal modo que no sea posible falsear eso pasando otra fecha.

## ¿Y qué hay de `RandomGenerator`?

Del mismo modo que nos interesa un `ClockService`, un generador de números aleatorios también puede ser útil en algún momento. Para ello aplica siempre el mismo principio, se trata de aplicar un patrón Adapter o Adaptador con el que abstraer el generador aleatorio que vayamos a utilizar, sea el del sistema o una librería criptográficamente segura.

```go
package domain

type RandomGenerator interface {
	Integer(from int, to int) int64
}
```

Aquí tenemos una implementación muy simple. Fíjate como aprovechamos para iniciar la semilla y ganar algo de aleatoriedad.

```go
package infrastructure

import (
	"math/rand"
	"time"
)

type SystemRandomService struct {
}

func NewSystemRandomService() SystemRandomService {
	rand.Seed(time.Now().UnixNano())
	return SystemRandomService{}
}

func (s SystemRandomService) Integer(from int, to int) int64 {
	num := rand.Intn(to-from+1) + from
	return int64(num)
}
```

Y aquí una aún más simple para usar en tests, que nos permite disponer de un _stub_ programable.

```go
package test

import "strconv"

type FixedRandom struct {
	random any
}

func NewFixedRandom(random any) FixedRandom {
	return FixedRandom{
		random: random,
	}
}

func (f FixedRandom) Integer(_ int, _ int) int64 {
	i, _ := strconv.ParseInt(f.random.(string), 10, 64)
	return i
}
```

## Algunas recomendaciones prácticas

### Úsalo

La primera recomendación, por supuesto, es que empieces a utilizar un `ClockService` en tus proyectos para obtener fechas y horas. Lo mismo si necesitas un generador de números aleatorios.

Incluso en aquellos casos en los que estés considerando librerías de terceras partes, aplica el patrón adaptador. Esto te quitará muchas preocupaciones. Te dará la oportunidad de retrasar decisiones porque es muy fácil introducir nuevos adaptadores a medida que pruebas diferentes librerías que respondan a necesidades cambiantes de tu proyecto.

### Aplica Segregación de Interfaces

En cuanto a las interfaces en sí, no introduzcas muchos métodos. En primer lugar, es muy posible que solo necesites uno o dos. Por esa razón no introduzcas métodos si no te hacen falta ahora mismo. Recuerda el principio YAGNI: lo más probable es que no lo vas a necesitar. 

Por otra parte, si tu interfaz tiene muchos métodos, se convertirá en un problema a la hora de hacer dobles para tests, porque tendrás que arrastrar todos los métodos que no te interesan en el test. Eso es algo que no queremos. 

En general, procura que las interfaces tengan muy pocos métodos, a la medida de sus consumidores, siguiendo el principio de Segregación de Interfaces. Así, por ejemplo, un `ClockService` que nos proporcione la hora del sistema suele ser más que suficiente. 

Por tentador que sea, no acumules en él otras funciones que puedas necesitar como obtener los días transcurridos desde una fecha, etc. Para eso, crea otros servicios que utilicen tu ClockService como proveedor de la hora del sistema.

Es decir, este tipo de patrones no se deben usar como librerías. No son librerías, sino mediadores que te permiten desacoplarte de los detalles de infraestructura.

### Donde colocarlos: la maldición de Shared

Las interfaces como `ClockService` deberían situarse en la capa de Dominio. Si necesitas más estructura, colócala dentro de una carpeta `Time`, que empaquetaría los servicios relacionados con el tiempo que sean genéricos.

No uses una carpeta `Shared` o `Common`. Con el tiempo, estas carpetas se convierten en un cajón desastre en el que se acumulan todas las cosas para las que no te has parado a pensar donde deberían situarse.

Las implementaciones, por su parte, irán en la capa de infraestructura. Recuerda que el reloj del sistema no deja de ser una tecnología concreta que no controlas.

## Finalizando

Define interfaces para abstraer todo tipo de dependencias globales como el tiempo o el azar. 

Utiliza el patrón Adaptador para tener las implementaciones que necesites, ya sea usando la librería estándar del lenguaje u otra de tercera parte.

Aprovecha este patrón para crear dobles de test, que te permitirán testear comportamientos dependientes del tiempo o del azar.
