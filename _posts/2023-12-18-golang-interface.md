---
layout: post
title: Interfaces en Go
categories: articles
tags: good-practices design-patterns golang
---

Las interfaces en Go pueden ser un poco desconcertantes cuando vienes de otros lenguajes, como Java o PHP, pero es una de las cosas que más me está gustando últimamente.

Las interfaces pueden entenderse como una especia de contrato que los objetos de una clase se comprometen a cumplir, siendo así que pueden recibir determinados mensajes y responderlos con su comportamiento particular.

En lenguajes como Java o PHP podemos definir interfaces. Cuando queremos que una clase las implemente, debe hacer una declaración **explícita**. De este modo, el sistema de tipos entenderá que esa clase es ella misma, pero también que actúa como cada una de las interfaces que implemente.

Así, el siguiente fragmento de código declara una clase `Mp3` que implementa una interfaz llamada `Media`. Esta interfaz puede ser implementada por otras clases, como se ve a continuación.

```java
public class Mp3 implements Media {
    // Code needed
}
```

```java
public class CDRom implements Media {
    // Code needed
}
```

En esencia, esto quiere decir que en ciertos contextos `Mp3` y `CDRom` podrán actuar con el rol de `Media` y de cara a sus consumidores o clientes será indiferente su tipo.

Vayamos ahora con Go. En Go también podemos declarar interfaces. Las interfaces definen un conjunto de métodos públicos, que deben implementar los objetos que quieran cumplirla.

```go
type Media interface {
	Play()
}
```

Esto no parece muy diferente de otros lenguajes, ¿verdad? Pues veamos ejemplos de implementaciones:

```go
type Mp3 struct {}

func (m Mp3) Play()  {
    // Do whatever mp3 needs to be played
}
```

```go
type CDRom struct {}

func (c CDRom) Play()  {
    // Do whatever CDRom needs to be played
}
```

Como habrás observado no hay ninguna mención a `Media` en estas implementaciones. En lo único que coinciden con la interfaz es en que ambas definen un método `Play`. Y es suficiente para que la estén implementando.

Esto es porque en Go las interfaces se satisfacen de forma implícita y estática. De este modo, cuando asociamos a una `struct` los métodos definidos en una interfaz, la `struct` satisfará esa interfaz. Esto aplica a todo el código, incluyendo librerías de terceras partes que puedas estar usando en tu proyecto.

Para que las interfaces hagan _match_ deben coincidir el tipo y número de parámetros y los tipos retornados. Así, por ejemplo:

```go
type ProductRepository interface {
	Retrieve(ctx context.Context, id ProductId) (Product, error)
}
```

Será implementada por:

```go
type SqlProductRepository struct {}

func (r SqlProductRepository) Retrieve(ctx context.Context, pid ProductId) (Product, error)  {
	// Implementation
}
```

El nombre de los parámetros es indiferente, pero tienen que coincidir los tipos exactamente.

Si bien es un concepto que provoca extrañeza en muchas personas que se acercan a Go por primera vez, tiene unas cuantas consecuencias interesantes y que, bien aprovechadas, pueden hacernos la vida más fácil. Para conseguirlo necesitamos "desaprender" la forma en que se usan las interfaces en otros lenguajes y entender como nos beneficia.

De hecho, es uno de los puntos que podrían llegar a conseguir que Go me guste como lenguaje. No pierdo la esperanza.

## Importación en bucle o dependencias cíclicas

El compilador de Go por diseño y en aras a ganar en velocidad de compilación no permite dependencias cíclicas. Se trata de uno de los problemas más habituales cuando empezamos a trabajar viniendo de otros lenguajes. Una dependencia cíclica es cuando estamos trabajando en un paquete y queremos importar algo de otro paquete que, a su vez, importa cosas del primero. Esto sería un ejemplo de dependencia cíclica:

```go
package origin

import "talkingbit.com/go-playground/destination"

type Origin struct{}

func (o Origin) distanceTo(d destination.Destination) {
	// Code for this
}
```

```go
package destination

import "talkingbit.com/go-playground/origin"

type Destination struct{}

func (d Destination) distanceFrom(o origin.Origin) {
	// Code for this
}
```

Por ejemplo, un test como este:

```go
package origin

import (
	"talkingbit.com/go-playground/destination"
	"testing"
)

func TestOrigin(t *testing.T) {
	o := Origin{}
	d := destination.Destination{}
	o.distanceTo(d)
}
```

No se podrá ejecutar porque el package `destination` importa el objeto `origin.Origin`. Y este es el error que lanza al intentarlo:

```
package talkingbit.com/go-playground/origin
	imports talkingbit.com/go-playground/destination
	imports talkingbit.com/go-playground/origin: import cycle not allowed
```

Los ciclos de dependencias pueden considerarse un _smell_ de diseño, pero en otros lenguajes no hay nada que nos impida incurrir en ellos, a no ser que incluyamos algún analizador estático capaz de detectarlas. En general, Go es muy exigente con esto, lo que combinado con su forma de empaquetar puede hacernos sudar un poco hasta dar con la organización adecuada del código.

¿Podemos evitar este problema de alguna forma? Pues sí, recurriendo a interfaces.

Introducimos un paquete nuevo:

```go
package distance

type Starting interface {
	DistanceTo(d Ending)
}

type Ending interface {
	DistanceFrom(o Starting)
}
```

Y modificamos los anteriores de para cumplir las interfaces:

```go
package origin

import (
	"talkingbit.com/go-playground/distance"
)

type Origin struct{}

func (o Origin) DistanceTo(d distance.Ending) {
	// Code for this
}
```

```go
package destination

import "talkingbit.com/go-playground/distance"

type Destination struct{}

func (d Destination) DistanceFrom(s distance.Starting) {
	// Code for this
}
```

De este modo, tanto `origin` como `destination` dependen de `distance` y se evita el ciclo. Este test, ahora se puede ejecutar, ya que podemos usar `Destination` sin tratar de importar nada de `origin`.

```go
package origin

import (
	"talkingbit.com/go-playground/destination"
	"testing"
)

func TestOrigin(t *testing.T) {
	o := Origin{}
	d := destination.Destination{}
	o.DistanceTo(d)
}
```

En este caso, la solución es una aplicación del principio de inversión de dependencias. En lugar de hacer depender `structs` concretas entre sí, hacemos depender a ambas de una abstracción, que es la interfaz.

## Estrechar interfaces

Supongamos un caso en el que tienes una dependencia de una `struct` a la que se la han asociado 20 métodos. Incluso en el caso de que se haya definido una interfaz, con todos esos métodos. Claramente, no es un buen diseño, pero a veces nos encontramos con estas cosas y hay que lidiar con ellas en tanto no podemos afrontar un refactor que puede llegar a ser delicado y trabajoso.

En cambio, en Go abordar este problema puede ser agradablemente fácil. Y que yo diga que algo es agradable en Go es notable.

Supongamos un _Command Handler_ que depende de un repositorio aquejado de esta exuberancia de métodos:

```go
type Customer struct {}

func (c Customer) Notify()  {}


type CustomerRepository interface {
    ByCustomerId(id string) Customer
	WithPendingPayments() []Customer
	// Another bunch of methods
}


```

He aquí el _Handler_:

```go
type SendPaymentReminders struct {}

type SendPaymentRemindersHandler struct {
	repo CustomerRepository	
}

func NewSendPaymentRemindersHandler(repo CustomerRepository) *SendPaymentRemindersHandler {
	return &SendPaymentRemindersHandler{repo: repo}
}

func (s SendPaymentRemindersHandler) Handle(cmd SendPaymentReminders){
	customers := s.repo.WithPendingPayments()
	for _, c := range customers{
		c.Notify()
	}
}
```

Veamos. `SendPaymentRemindersHandler` tan solo tiene interés en el método `WithPendingPayments` del repositorio. Todos los demás métodos le son indiferentes. En principio esto no es ningún problema hasta que tenemos que hacer cosas como crear un doble para test, o introducir una nueva implementación de `CustomerRepository` de la que puede que solo nos interese este método y un par de ellos más. En ambos casos, tendríamos que ocuparnos de un montón de métodos que no nos interesan para nada. Arrastraríamos muchos de ellos dejándolos vacíos.

Entonces es cuando viene a nuestra mente el **principio de Segregación de Interfaces**, que dice más o menos: diseña interfaces estrechas (pocos métodos) basadas en las necesidades de sus consumidores.

Entonces, `SendPaymentRemindersHandler` es un consumidor de `CustomerRepository`, pero en realidad solamente consume el método `WithPendingPayments`. Por tanto, podemos definir una interfaz que solo tenga este método:

```go
type PendingPaymentsRepository interface {
	WithPendingPayments() []Customer
}
```

Ahora, haremos que `SendPaymentRemindersHandler` dependa de esta interfaz:

```go
type SendPaymentReminders struct {}

type SendPaymentRemindersHandler struct {
	repo PendingPaymentsRepository	
}

func NewSendPaymentRemindersHandler(repo PendingPaymentsRepository) *SendPaymentRemindersHandler {
	return &SendPaymentRemindersHandler{repo: repo}
}

func (s SendPaymentRemindersHandler) Handle(cmd SendPaymentReminders){
	customers := s.repo.WithPendingPayments()
	for _, c := range customers{
		c.Notify()
	}
}
```

¿Y qué es lo que ocurre? La implementación que tengas actualmente de `CustomerRepository` también implementa la interfaz `PendingPaymentsRepository`, por lo que esto no supone ningún problema en producción. Sin embargo, podrás crear fácilmente un doble de test u otra implementación alternativa que puedas necesitar, ya que únicamente tienes que escribir un método. No te tienes que preocupar de todos los demás que necesitarías.

Así, si en un futuro ocurre que los clientes con pagos pendientes se registran en otra instancia de base de datos, que puede basarse incluso en una tecnología diferente, no tienes más que hacer un adaptador que implemente esta interfaz que has definido a partir de las necesidades del _Handler_. 

En realidad, no hay tanta diferencia entre Go y otros lenguajes en este aspecto, pero el hecho de que los implementadores no tengan que declarar la interfaz me ha dado la impresión de que resulta más barato aplicar este principio en Go.

## Relajar las dependencias de terceras partes

Aprovechando esta característica, podrías relajar las dependencias de librerías de terceras partes. 

Defines una interfaz a partir del método o métodos que te interesan y, en lugar de usar directamente la librería, haces que tu código dependa de la interfaz que acabas de definir. Esto ya te proporciona cierta libertad con respecto a la dependencia. Este método puede ser bastante engorroso en muchos casos, especialmente debido a que los tipos de datos podrían estar definidos por la propia librería.

En caso de tener que cambiar la librería o actualizarla y a fin de aflojar al máximo la dependencia, no tendrías más que introducir un adaptador que implemente la interfaz que has definido en tu código. En este caso, puedes tener más libertad para definir la interfaz. Esto contribuye a resolver el problema de los tipos de datos, ya que puedes hacer que la interfaz se base en tus propios tipos y que el adaptador haga la conversión.

Sin embargo, hay que tener en cuenta que en Go se promueve el uso de librerías, por lo que es conveniente valorar en qué momentos te conviene abstraerte de ellas. En relación con ello, hay que tomar en consideración la posibilidad de que la librería deje de mantenerse al día en un futuro, por lo que si no tienes mucha confianza, puede ser mejor crear tu propio adaptador.

## Dobles de test

En un punto anterior he mencionado el uso de interfaces estrechas para depender solo de los métodos que un consumidor necesite realmente.

Esto hace que crear los dobles de test necesarios sea mucho más sencillo y menos trabajoso, dado que ya no tienes que ocuparte de todos los otros métodos que, de todas formas, no ibas a utilizar. Esto es válido ya sea que uses una librería como `mock` o crees tus propias implementaciones de dobles.

Además, si usas interfaces para relajar las dependencias de terceros, como se explica en el punto anterior, podrás hacer dobles de aquellas.

Para ello, necesitas introducir la interfaz que necesita el consumidor y cambiar la dependencia de este a la interfaz reducida. Luego, no tienes más que preparar el doble. Veamos un ejemplo partiendo del caso anterior. Te recuerdo la situación de partida. Primero, el repositorio o servicio con numerosos métodos. O al menos con más de los que necesita nuestro consumidor.

```go
type Customer struct {}

func (c Customer) Notify()  {}


type CustomerRepository interface {
    ByCustomerId(id string) Customer
	WithPendingPayments() []Customer
	// Another bunch of methods
}


```

He aquí el Handler que consume el repositorio:

```go
type SendPaymentReminders struct {}

type SendPaymentRemindersHandler struct {
	repo CustomerRepository	
}

func NewSendPaymentRemindersHandler(repo CustomerRepository) *SendPaymentRemindersHandler {
	return &SendPaymentRemindersHandler{repo: repo}
}

func (s SendPaymentRemindersHandler) Handle(cmd SendPaymentReminders){
	customers := s.repo.WithPendingPayments()
	for _, c := range customers{
		c.Notify()
	}
}
```

Como recordarás, realmente solo depende de un método, por lo que nos basta una interfaz que lo contenga:

```go
type PendingPaymentsRepository interface {
	WithPendingPayments() []Customer
}
```

El `CustomerRepository` que tengamos en producción también implementa `PendingPaymentsRepository`, asi que por esa parte no tendríamos que hacer nada más.

Ahora podemos definir un doble. Aquí lo hacemos mediante la librería Mock:

```go
type MockedPendingPayments struct {
	mock.Mock
}

func (m MockedPendingPayments) WithPendingPayments() []Customer {
	args := m.Called()
	return args.Get(0).([]Customer)
}
```

O bien creando nuestra implementación específica para un test:

```go
type FakePendingPayments struct {
	Stubbed []Customer
}

func NewFakePendingPayments() FakePendingPayments {
	return FakePendingPayments{
		Stubbed: make([]Customer, 0),
	}
	
}

func (f FakePendingPayments) WithPendingPayments() []Customer {
	return f.Stubbed
}
```

En el ejemplo anterior, se devuelve un array vacío de `Customer`, pero nos bastaría con hacer algo como lo siguiente, ya que hemos dejado en público `Stubbed`, con lo que fácilmente le podemos programar una respuesta al _stub_.

```go
func TestPendingPayments (t testing.T) {
	repo := NewFakePendingPayments()
	repo.Stubbed = []Customer{
		// Example of Customer,
		// Another example of Customer,
	}
	// The remaining of the test
}
```

Es importante no introducir ninguna lógica sofisticada en los dobles para no contaminar el test. Es preferible tener incluso varios dobles adaptados a las necesidades de cada test, pero que tengan una lógica trivial como la que acabamos de ver: básicamente entregar unos resultados conocidos adecuados para el test que estamos escribiendo.

## Interfaces vacías, ¿para qué?

Aunque puedes definirlas, en Go las interfaces vacías no sirven para nada. Esto evita una mala práctica, que es la de utilizar _interfaces de marcación_: las que se usan para forzar una clase a tener un tipo por lo que sea y poder preguntar a los objetos por este tipo.

```go
type Empty interface {}
```

En Go ninguna struct podrá implementar la interfaz `Empty`.

## Conclusiones

Las interfaces en Go no son tan diferentes de las de otros lenguajes como podría parecer a primera vista.

El hecho de que se satisfagan de forma implícita pone más peso en definirlas a partir de las necesidades de los consumidores, en lugar del énfasis que otros lenguajes ponen en que sean las implementaciones quienes declaren su uso.

En ese sentido, Go contribuye a un código más acorde con los principios SOLID al favorecer la inversión de dependencias y la segregación de interfaces. Y como no soporta herencia, hace innecesario el principio de sustitución.
