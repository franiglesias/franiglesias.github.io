---
layout: post
title: Seams en Golang
categories: articles
tags: testing golang
---

Introducir _seams_ o costuras es una de las herramientas que usamos para resolver algunos tests complicados. Un seam es un lugar del código en el que podemos hacer un cambio de comportamiento pero sin modificar el original. Habitualmente, aplicamos esta técnica cuando queremos que la unidad bajo test no haga uso de dependencias que son caras de utilizar en entorno de testing.

Normalmente, para obtener un _seam_ lo que necesitamos es aislar primero el fragmento de código cuyo comportamiento queremos cambiar. En lenguajes OOP es muy fácil extraer ese código a un método, que definiremos con visibilidad _protected_. Así podemos usarlo en clases que descienden de la clase original y, en consecuencia, nos permite sobreescribirlo en las clases derivadas.

Gracias a esto podemos tener un objeto instanciado de la clase original en producción, con todo su comportamiento y dependencias intactos, mientras que podemos instanciar un objeto de la clase derivada en el que hayamos modificado ese método _seam_ de acuerdo a las necesidades del test. 

Esta versión de la técnica de los _seams_ o costuras está basada en la herencia, pero dado que Golang no la tiene, ¿podríamos usarla igualmente?

Aunque Golang no dispone de herencia por diseño, es posible crear _seams_ aplicando otras propiedades del lenguaje. Este artículo es bastante deudor de algunas explicaciones en [este hilo de Stack Overflow](https://stackoverflow.com/questions/50544943/override-go-method-in-tests
)

## Creando seams en Golang, ejemplo sintético

Veamos un ejemplo muy simplificado, pero que creo que permitirá entenderlo bastante bien. Tenemos este código que genera un texto. La segunda línea solo debería verse en producción, representando lo que sería una llamada a un recurso como una base de datos, una API externa, u otro recurso que sea caro utilizar en test.

```go
type Production struct {
}

func (p *Production) DoSomething() string {
var result string

result = "The generated string starts here." + "\n"
result += "This text should only appear in production, but not in test." + "\n"
result += "The generated string ends here." + "\n"

return result
}
```

Este es el test que queremos hacer pasar:

```go
func TestHardDependencyExample(t *testing.T) {
	t.Run("Testing the production code", func(t *testing.T) {
		production := Production{}
		result := production.DoSomething()

		expected := `The generated string starts here.
-- This line is replaced in test environment --
The generated string ends here.
`
		assert.Equal(t, expected, result)
	})
}
```

Por lo general, es recomendable aislar ese trozo de código. Nos ayudará a saber qué es lo que queremos cambiar. Así que podemos extraerlo a un método. Lo llamaré `SeamMethod`, simplemente para identificarlo con facilidad en el ejemplo.

```go
type Production struct {
}

func (p Production) DoSomething() string {
	var result string

	result = "The generated string starts here." + "\n"
	result += p.SeamMethod() + "\n"
	result += "The generated string ends here." + "\n"

	return result
}

func (p Production) SeamMethod() string {
	return "This line is the original production code"
}
```

Como podemos ver el método hace lo que tenga que hacer y devuelve un `string`. Nosotras queremos que devuelva un string en el test, pero sin hacer nada que nos dificulte el testing. Sin embargo, no hay forma de hacer un override de un método en Golang. Afortunadamente, podemos simularlo, pero de una forma peculiar.

Vamos a usar funciones de primer orden, y necesitaremos varias cosas:

* Una función que se encargue de implementar el código que tenemos en `SeamMethod` para producción.
* Un campo de la struct cuyo tipo sea una función con la misma signatura. Esto nos debería permitir cambiar la función cuando lo deseemos.
* Una función alternativa que genere el comportamiento que queremos en el test.

Primer paso, crear la función que implementa el código original:

```go
type Production struct {
}

func (p Production) DoSomething() string {
    // Removed for brevity
}

func (p Production) SeamMethod() string {
	return ExecuteInProduction()
}

func ExecuteInProduction() string {
	return "This line is the original production code"
}
```

Ahora necesitamos un campo en `Production` que sea una función con la misma signatura que `SeamMethod`. En este caso, la función no recibe parámetros y devuelve un `string`. En otros casos, veremos que se pasan parámetros y se devuelven otros tipos.

```go
type Production struct {
	ExternalDependency func() string
}

func (p Production) DoSomething() string {
    // Removed for brevity
}

func (p Production) SeamMethod() string {
	return ExecuteInProduction()
}

func ExecuteInProduction() string {
	return "This line is the original production code"
}
```

A continuación, necesitamos cambiar un poco el modo en que está implementando `SeamMethod`, ya que no queremos llamar directamente a la función, sino a la función que guardaremos en el campo `ExternalDependency`.

```go
type Production struct {
	ExternalDependency func() string
}

func (p Production) DoSomething() string {
    // Removed for brevity
}

func (p Production) SeamMethod() string {
	return p.ExternalDependency()
}
``` 

Ahora tendremos que modificar la forma en que se construye `Production`, tanto en producción como test, para que use la función deseada. Esta podría ser una función constructora en producción:

```go
func NewProduction() Production {
    return Production{
        ExternalDependency: ExecuteInProduction,
    }
}
```

Pero en test, podríamos hacerlo así:

```go
func NewProductionForTest() Production {
    return Production{
        ExternalDependency: func() string {
            return "-- This line is replaced in test environment --"
        },
    }
}
```

Y ahora, en el test, podemos usar la función constructora para test:

```go
func TestHardDependencyExample(t *testing.T) {
	t.Run("Testing the production code", func(t *testing.T) {
		production := NewProductionForTest()

		expected := `The generated string starts here.
-- This line is replaced in test environment --
The generated string ends here.
`
		assert.Equal(t, expected, production.DoSomething())
	})
}
```

Y con esto, hemos conseguido aislar el código que queríamos cambiar, y hemos podido cambiarlo en test sin modificar el código original. Eso sí, hemos tenido que refactorizar ese código para que se adapte a la nueva forma de trabajar.

## Un ejemplo sencillo pero realista

A continuación, voy a introducir un ejemplo más realista, adaptado de un test que he tenido que hacer recientemente. No hay mucha diferencia con el ejemplo anterior, de todos modos.

El problema por el cual necesito introducir un seam es porque el test verifica ciertos comportamientos que dependen de la hora a la que ocurre algo. Más exactamente, de si han pasado más de un cierto número de horas desde que ocurrió algo.

Es muy frecuente que este tipo de cálculos se hagan consultando directamente el reloj del sistema. Esto nos genera una dependencia de estado global y nos acopla a la librería que nos da acceso al reloj del sistema. En consecuencia, no podemos testear ese tipo de comportamientos de forma sencilla. 

Lo ideal sería inyectar un servicio de reloj en construcción, que encapsule la librería de tiempo, permitiéndonos reemplazarlo en test por un servicio de reloj trucado para dar una hora conocida. Pero no siempre es posible hacer esto, especialmente si el código que queremos testear no está preparado para ello. De hecho, puede que la razón para hacer esto sea precisamente poder llegar a hacer ese refactor, para lo que necesitamos tests que nos protejan.

Por eso, vamos a intentarlo con un seam.

Veamos un escenario de ejemplo. En este caso, el servicio `RetrieveData` tiene un método `GetByKeyGivenFirstVisit` que recibe una clave y una fecha. Si la fecha es anterior a 24 horas antes de la hora actual, se usa `EarlyService` para recuperar los datos que estarían guardados en un almacén tipo Redis. Si la hora es posterior, se usa `LateService` que los recupera de un archivo, ya que expiran del almacenamiento temporal en ese plazo.

```go
type EarlyService struct {
	
}

func (e EarlyService) GetDataByKey(key string) string {
	return fmt.Sprintf("Retrieve data from temp store using key %s", key)
}

type  LateService struct {
	
}

func (s LateService) GetFromFile(name string) string {
	return fmt.Sprintf("Retrieve data from file %s", name)
}
	

type RetrieveData struct {
	early EarlyService
	late LateService
}

func NewRetrieveData(early EarlyService, late LateService) RetrieveData {
    return RetrieveData{
        early: early,
        late: late,
    }
}



func (r RetrieveData) GetByKeyGivenFirstVisit(key string, firstVisit time.Time) string {
	now := time.Now()
	if now.Sub(firstVisit) < time.Hour * 3 {
		return r.early.GetDataByKey(key)
	} else {
		return r.late.GetFromFile(key)
	}
}
```

Por una parte, vemos que las dependencias están bien inyectadas, pero al depender del reloj del sistema tenemos un problema, ya que no podemos controlar la hora a la que se ejecuta el test. Sin embargo, el código que queremos testear no está preparado para recibir un servicio de reloj inyectado. Y como no tenemos tests, queremos empezar por uno.

El siguiente test me lo ha sugerido Copilot. Es correcto, pero en mi opinión tiene un defecto: lo que hace es asumir que el código bajo test obtiene la hora del sistema usando la librería time, y crea el parámetro first visit a medida para el test. Esto hace que test esté acoplado al código.

```go
func TestRetrieveData(t *testing.T) {
	t.Run("Visit too old is retrieved from file", func(t *testing.T) {

		retrieveData := RetrieveData{
			early: EarlyService{},
			late:  LateService{},
		}

		result := retrieveData.GetByKeyGivenFirstVisit("key", time.Now().Add(-time.Hour*24*2))

		assert.Equal(t, "Retrieve data from file key", result)
	})
}
```

Así que en su lugar, vamos a introducir la técnica del seam.

En primer lugar, aislamos los usos de `time`, de forma que podamos entender qué es lo que necesitamos.

```go
func (r RetrieveData) GetByKeyGivenFirstVisit(key string, firstVisit time.Time) string {
	now := time.Now()
	if now.Sub(firstVisit) < time.Hour*24 {
		return r.early.GetDataByKey(key)
	} else {
		return r.late.GetFromFile(key)
	}
}
```

La primera opción es aislar la llamada a `time.Now()` en un método `GetCurrentTime()`, con la ventaja de que podemos reutilizarla en caso de que hubiese otras llamadas en el mismo fragmento de código.

```go
func (r RetrieveData) GetByKeyGivenFirstVisit(key string, firstVisit time.Time) string {
	now := CurrentTime()
	if now.Sub(firstVisit) < time.Hour*24 {
		return r.early.GetDataByKey(key)
	} else {
		return r.late.GetFromFile(key)
	}
}

func CurrentTime() time.Time {
	return time.Now()
}
```

Podemos ver que la función CurrentTime no recibe parámetros y devuelve un objeto _time.Time_. Con esto, podemos introducir un campo en RetrieveData que sea una función con la misma signatura.

```go
type RetrieveData struct {
	early EarlyService
	late  LateService
	ObtainCurrentTime func() time.Time
}
```

Necesitaremos una función constructora para producción, o modificar la que ya se esté usando de tal forma que no se alteren sus usos actuales. Dejo `ObtainCurrentTime` público para poder cambiarlo a voluntad en test usando otra función customizada. 

```go
func NewRetrieveData(early EarlyService, late LateService) RetrieveData {
	return RetrieveData{
		early: early,
		late: late,
		ObtainCurrentTime: CurrentTime,
	}
}
```

Por supuesto, a partir de ahora usaremos la función que esté en `ObtainCurrentTime`:

```go
type RetrieveData struct {
	early             EarlyService
	late              LateService
	ObtainCurrentTime func() time.Time
}

func (r RetrieveData) GetByKeyGivenFirstVisit(key string, firstVisit time.Time) string {
	now := r.ObtainCurrentTime()
	if now.Sub(firstVisit) < time.Hour*24 {
		return r.early.GetDataByKey(key)
	} else {
		return r.late.GetFromFile(key)
	}
}

func CurrentTime() time.Time {
	return time.Now()
}

```

A partir de este momento, `RetrieveData` tiene un _seam_ que puedo utilizar para cambiar el comportamiento en test. Esta constructora alternativa me permite pasar una función para reemplazar la que se usa en producción.

```go
func NewTestableRetrieveData(early EarlyService, late LateService, currTime func()time.Time) RetrieveData {
	return RetrieveData{
		early: early,
		late:  late,
		ObtainCurrentTime: currTime,
	}
}
```

En el test puedo definir ambas fechas de manera independiente, controlando en todo momento la relación entre ellas sin hacer asunciones sobre cómo funciona el código testado.

```go
func TestRetrieveData(t *testing.T) {
	t.Run("Visit too old is retrieved from file", func(t *testing.T) {

		now := time.Date(2023, 10, 20, 10, 0, 0, 0, time.UTC)
		first := time.Date(2023, 10, 19, 10, 0, 0, 0, time.UTC)

		retrieveData := NewTestableRetrieveData(
			EarlyService{},
			LateService{},
			func() time.Time {
				return now
			},
		)

		result := retrieveData.GetByKeyGivenFirstVisit("key", first)

		assert.Equal(t, "Retrieve data from file key", result)
	})
}
```

Aquí otra versión del test, en la que `RetrieveData` siempre toma como hora actual las 10:00 de un día arbitrario. 

```go
func TestRetrieveData(t *testing.T) {
	now := time.Date(2023, 10, 20, 10, 0, 0, 0, time.UTC)
	retrieveData := NewTestableRetrieveData(
		EarlyService{},
		LateService{},
		func() time.Time {
			return now
		},
	)

	t.Run("Visit too old is retrieved from file", func(t *testing.T) {
		olderThan24hours := time.Date(2023, 10, 19, 10, 0, 0, 0, time.UTC)
		result := retrieveData.GetByKeyGivenFirstVisit("key", olderThan24hours)
		assert.Equal(t, "Retrieve data from file key", result)
	})

	t.Run("Recent visit is retrieved from key-value storage", func(t *testing.T) {
		sameDay := time.Date(2023, 10, 20, 9, 0, 0, 0, time.UTC)
		result := retrieveData.GetByKeyGivenFirstVisit("key", sameDay)
		assert.Equal(t, "Retrieve data from temp store using key key", result)
	})
}
```

## Conclusiones

Crear _seams_ en Golang es perfectamente posible, aunque el planteamiento es un poco distinto al de otros lenguajes orientados a objetos en los que podríamos usar herencia y sobreescribir el método que hace de _seam_.

Golang nos requiere aislar la funcionalidad que deseamos suplantar en una función que podremos reemplazar.

Esto, en realidad, no es muy diferente a inyectar otro objeto como dependencia. En algunos casos, una función será una solución perfectamente adecuada para nuestro problema. En otros casos, es posible que la funcionalidad que necesitamos en producción tenga también sus propias dependencias y sea preferible modelarla como un objeto.
