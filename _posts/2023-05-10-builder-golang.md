---
layout: post
title: Patrón Builder en Golang
categories: articles
tags: golang design-patterns
---


Ya he tratado anteriormente el [patrón Builder en PHP](/builder_pattern/). La mayor parte de las ideas generales siguen siendo válidas.

## El problema de construir objetos

Aunque todos los lenguajes ofrecen una forma canónica de obtener instancias de objetos, es frecuente encontrarse con circunstancias especiales en las que esa forma no resulta cómoda. Eso puede ocurrir por diversas razones, como la necesidad de adaptarnos a distintas fuentes de los datos necesarios, dependencias entre distintos parámetros de construcción, tener que decidir qué variante del tipo necesitamos instanciar, o simplemente que necesitamos muchos datos para montar el objeto.

Como estos problemas son comunes, se han identificado [distintos patrones creacionales](/object_creation/) que podemos aplicar. En esta ocasión me volveré a centrar en el patrón Builder, ya que me ha ayudado a resolver algunos problemas en un proyecto Golang. Así que, aunque [ya ha sido tratado en el blog](/builder_pattern/) voy a retomarlo en el contexto de este lenguaje.

## Construcciones complejas

El patrón Builder se aplica cuando queremos construir un objeto de un tipo, pero esa construcción resulta complicada por algún motivo.

Un caso habitual es el de aquellos objetos que necesitan instancias de otros objetos, dependiendo de algunos datos de entrada. Suele ponerse como imagen para comprenderlo el proceso de fabricación de un coche, que necesita un motor, carrocería, ruedas y un largo etcétera de partes. Muchas veces hay dependencias entre esas partes. Por ejemplo, si se solicita un coche con un motor de cierta potencia, podría necesitar unas ruedas de un tipo específico.

Otro caso sería el de aquellos objetos que necesitan mucha información para crearse. Dicho de otro modo, aquellos cuya constructora recibe gran cantidad de parámetros. A partir de cierta cantidad, es difícil recordar su orden o incluso su tipo. Es cierto que esto suele responder a un problema de diseño, pero en la práctica es frecuente encontrarnos en proyectos donde es complicado revertir estas decisiones. El patrón Builder nos ayuda a desarrollar una especie de lenguaje de creación de objetos con el que compaginar esa gran cantidad de parámetros y una forma sencilla de lidiar con ella.

## Creación de objetos en Golang

Antes de entrar a considerar los detalles de implementación de un Builder, vamos a dar un repaso rápido a la forma en la que creamos objetos en Golang.

En Golang representamos los objetos usando una `struct`. Cuando es sencilla, podemos inicializarla fácilmente accediendo directamente a sus propiedades. Podemos pensar en una `struct` como un DTO:

```go
type PersonName struct {
	name string
	surname string
}
```

Aquí un ejemplo:

```go
myName := PersonName{
    name:    "Fran",
    surname: "Iglesias",
}
```

Esta sería la forma canónica de instanciar objetos en Golang. De hecho, nos permite bastante flexibilidad. Por ejemplo, no inicializar ninguna de las propiedades, que adoptarán el valor cero que corresponde a su tipo:

```go
myName := PersonName{}
```

En este caso, tanto `myName.name` como `myName.surname` contendrán `""`. Los tipos numéricos tomarán el valor `0`, los booleanos `false`, los slices serán slices vacíos `[]`, los maps se inicializarán como maps vacíos, los punteros a `nil`, etc.

También podemos inicializar las propiedades en cualquier orden:

```go
otherName := PersonName{
    surname: "Iglesias",
    name:    "Fran",
}
```

O incluso inicializar unas sí y otras no:

```go
otherName := PersonName{
    surname: "Iglesias",
}
```

Esta flexibilidad no está exenta de problemas, entre los cuales señalaría los siguientes: 

La posibilidad de no inicializar todas o algunas de las propiedades podría ser algo no deseable para nuestro proyecto en particular, ya que nos obligaría a chequear constantemente si han sido inicializadas. 

Además, hay casos en que la inicialización por defecto en Golang puede ser ambigua: ¿Cómo podemos saber si un valor cero lo es por no haber sido inicializado o porque cero es un valor aceptable en nuestro dominio?

A estos problemas hay que añadir que si no exportamos explícitamente las propiedades serán inaccesibles fuera del paquete. Obviamente, podríamos exportarlas, pero es posible que eso no nos interese en un contexto dado (_information hiding_). 

Para estos casos, lo habitual es introducir una función constructora. Esta función nos permitirá garantizar que los objetos se construyen de forma consistente, mientras mantenemos ocultas las propiedades internas:

```go
func NewPersonName(name string, surname string) PersonName {
	return PersonName{name: name, surname: surname}
}

myName := NewPersonName("Fran", "Iglesias")
```

La función `NewPersonName` obliga a que haya que pasar los dos parámetros necesarios para construir el nombre y evita que tengamos que publicar las propiedades de la `struct`.

Podemos usar varias funciones constructoras para responder a diversos tipos de forma de inicialización. Por ejemplo, podríamos usar una función constructora específica para aquellos casos en los que recibimos el nombre en un solo `string`, que tenemos que parsear previamente:

```go
func NewPersonNameFromRaw(s string) (PersonName, error) {
	name, surname, ok := strings.Cut(s, " ")
	if !ok {
		return PersonName{}, errors.New("invalid data")
	}
	return NewPersonName(name, surname), nil
}
```

Fíjate que en este caso he usado la función constructora `NewPersonName` para garantizar que construyo `PersonName` de forma correcta. Además, esta constructora valida el input, y en caso de que no pueda obtener un nombre y apellido, devuelve un error.

Por tanto, con funciones constructoras podemos definir formas específicas de construir nuestros objetos, evitando el acceso directo a sus propiedades y protegiendo precondiciones e invariantes.

El problema con las funciones constructoras es que los argumentos de las funciones en Go son posicionales. Los argumentos posicionales asignan los parámetros en función del orden en que se pasan. Esto tiene dos consecuencias principales:

* Como programadoras, resulta difícil recordar el orden y tipo de todos los parámetros. Tener tres o más argumentos en una función incrementa la dificultad y la probabilidad de errores, que pueden pasar desapercibidos si confundimos parámetros del mismo tipo, por ejemplo.
* Aumenta el acoplamiento, ya que el código que llama a la función, constructora en este caso, tiene que saber más cosas acerca de la misma.

## Simular parámetros con nombre

Muchos lenguajes nos permiten pasar los parámetros indicando el argumento que los tiene que recibir. Esta característica se llama _named parameters_, pero no existe en Golang. Los _named parameters_ resuelven el problema de asociar correctamente un parámetro que pasamos con el argumento que debe recibirlo. Si el número de parámetros es alto sigue presente el problema de recordarlos todos, pero es cierto que reducen el riesgo de cometer errores.

Como decimos, en Golang esta característica no existe, pero se puede simular fácilmente introduciendo el patrón _Parameter Object_. La idea es crear una `struct` que represente el conjunto de parámetros que necesitamos pasar a la función. [Puedes ver un ejemplo en este artículo](https://askgolang.com/named-parameters-in-golang/).

Para el objetivo de este artículo, que trata sobre la creación de objetos, el patrón _Parameter Object_ se aplicaría a la función o funciones constructoras. El problema es que, en ocasiones queda "raro":

```go
type PersonNameInit struct {
	Name string
	Surname string
}

func NewPersonName(data PersonNameInit) PersonName{
	return PersonName{
		name:    data.Name,
		surname: data.Surname,
	}
}
```

En general, este patrón nos permite tener las ventajas de la inicialización directa, como la flexibilidad y la fácil asociación de parámetros y argumentos. Pero sigue siendo inconveniente cuando tenemos objetos que necesitan una gran cantidad de datos.

## Patrón Builder en Golang

Para construir un Builder básicamente necesitamos:

* Métodos para pasarle los datos necesarios al _Builder_
* Una forma de guardar en el builder esos parámetros que le pasamos
* Uno o más métodos que construyan el objeto deseado con los parámetros recolectados
* El _Builder_ puede recibir colaboradores en construcción

En parte el _Builder_ entronca con el _Parameter Object_, ya que en última instancia tiene que guardar todos esos parámetros que necesitamos para construir el objeto. Pero además el _Builder_ se responsabiliza del montaje final del objeto.

Por otro lado, en lugar de asignar los valores directamente a las propiedades del _Builder_, preferimos utilizar métodos que nos aporten una semántica, creando un lenguaje de construcción que resulta fácil de entender. 

Así, es habitual usar el formato `with + Parametro`, indicando que queremos construir el objeto deseado con ese parámetro específico.

Por otra parte, dos o más parámetros están estrechamente asociados, un método del Builder puede obligarnos a pasarlos juntos. El ejemplo típico es el de nombre de calle y número.

## Formas de construir un Builder en Golang

Para que sea más sencillo entender el código voy a seguir con el mismo ejemplo simple.

### Struct con todos los campos que podamos necesitar

Empezamos con una struct en la que podamos guardar temporalmente los campos que necesitamos:

```go
type PersonNameBuilder struct {
	name string
	surname string
}
```

A continuación, un método `Build` que es el que se encarga de la construcción del objeto que queremos, con los datos disponibles:

```go
func (b *PersonNameBuilder) Build() PersonName {
	return PersonName{
		name:    b.name,
		surname: b.surname,
	}
}
```

Para pasar los datos, introducimos los métodos que necesitemos:

```go
func (b *PersonNameBuilder) WithName(name string)  {
	b.name = name
}

func (b *PersonNameBuilder) WithSurname(surname string)  {
	b.surname = surname
}
```

Y podemos usarlo de esta forma:

```go
func main() {
	builder := PersonNameBuilder{}
	builder.WithName("Fran")
	builder.WithSurname("Iglesias")
	
	person := builder.Build()
	fmt.Printf("%v", person)
}
```

**Interfaz fluida.** Los _Builders_ suelen ser buenos casos de uso para aplicar la técnica de interfaz fluida. Básicamente, tenemos que hacer que los métodos devuelvan el propio Builder.

```go
type PersonNameBuilder struct {
	name    string
	surname string
}

func (b *PersonNameBuilder) Build() PersonName {
	return PersonName{
		name:    b.name,
		surname: b.surname,
	}
}

func (b *PersonNameBuilder) WithName(name string) *PersonNameBuilder{
	b.name = name
	return b
}

func (b *PersonNameBuilder) WithSurname(surname string) *PersonNameBuilder{
	b.surname = surname
	return b
}
```

Así podemos usarlo, ganando en legibilidad, ya que la expresión que construye el objeto forma un bloque unitario:

```go
func main() {
	builder := PersonNameBuilder{}
	person := builder.
		WithName("Fran").
		WithSurname("Iglesias").
		Build()
	fmt.Printf("%v", person)
}
```

### Struct usando un campo temporal

Las `structs` en Go no presentan ninguna limitación en su forma de uso, ya que exponen todos sus campos y es posible acceder a ellos libremente, al menos dentro del mismo paquete.

En el siguiente ejemplo, usaremos una `struct` del mismo tipo que la que queremos crear para ahorrarnos añadir campos al _Builder_:

```go
type PersonNameBuilder struct {
	tmp PersonName
}

func (b *PersonNameBuilder) Build() PersonName {
	return PersonName{
		name:    b.tmp.name,
		surname: b.tmp.surname,
	}
}

func (b *PersonNameBuilder) WithName(name string) *PersonNameBuilder {
	b.tmp.name = name
	return b
}

func (b *PersonNameBuilder) WithSurname(surname string) *PersonNameBuilder {
	b.tmp.surname = surname
	return b
}
```

Y lo podemos usar exactamente igual:

```go
func main() {
	builder := PersonNameBuilder{}
	person := builder.
		WithName("Fran").
		WithSurname("Iglesias").
		Build()
	fmt.Printf("%v", person)
}
```

### Struct usando embedded

También tenemos la opción de usar embedded. Embedded proporciona una forma de composición de tipos de tal manera, que el tipo "contenedor" puede acceder a las propiedades y métodos del embebido.

```go
type PersonNameBuilder struct {
	PersonName
}

func (b *PersonNameBuilder) Build() PersonName {
	return PersonName{
		name:    b.name,
		surname: b.surname,
	}
}

func (b *PersonNameBuilder) WithName(name string) *PersonNameBuilder {
	b.name = name
	return b
}

func (b *PersonNameBuilder) WithSurname(surname string) *PersonNameBuilder {
	b.surname = surname
	return b
}
```

Comparado con la modalidad anterior, resulta un poquito más limpio, ya que podemos usar las propiedades directamente. 

Por supuesto, esto no afecta al modo en que lo podemos usar.

```go
func main() {
	builder := PersonNameBuilder{}
	person := builder.
		WithName("Fran").
		WithSurname("Iglesias").
		Build()
	fmt.Printf("%v", person)
}
```

## El patron _Builder_ al rescate

En este artículo hemos visto ejemplos muy simples de un patrón _Builder_, pero puedes aplicarlo a casos de uso complejos, en los que una _struct_ debe componerse con campos que contienen _slices_, _maps_ u otras _structs_.

Por otro lado, es un patrón muy útil en testing, ya que te permite inicializar fácilmente structs complejas poniendo el acento en campos que te interesan especialmente. Podrías, tener un método `BuildForTest` capaz de rellenar el resto de campos con valores por defecto adecuados.

Por ejemplo, aquí puedes ver como en caso de que los datos temporales estén vacíos, se rellenan de una forma adecuada para el test.

```go
func (b *PersonNameBuilder) BuildForTest() PersonName {
	personName := PersonName{
		name:    b.name,
		surname: b.surname,
	}
	if b.name == "" {
		personName.name = "Nombre"
	}
	if b.surname == "" {
		personName.surname = "Apellido"
	}

	return personName
}
```

Gracias a eso, podemos hacer tests en los que nos fijemos solo en una parte del objeto, en la confianza de que tendrá valores consistentes:

```go
func TestPersonNameExample(t *testing.T) {
	builder := PersonNameBuilder{}
	person := builder.
		WithName("Fran").
		BuildForTest()
	if person.name != "Fran" {
		t.Fail()
	}
}
```
