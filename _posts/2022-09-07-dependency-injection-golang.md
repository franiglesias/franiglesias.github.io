---
layout: post
title: OOP e Inyección de dependencias en Go
categories: articles
tags: golang
---

Golang es un lenguaje multiparadigma. Puedes trabajar con orientación a objetos y, por tanto, aplicar patrones y principios de este paradigma. Pero a Golang le gusta hacerlo a su manera.

En realidad esta manera no es tan diferente de la de otros lenguajes como Java o PHP, salvando las distancias. La cuestión es que Golang no tiene el concepto de clase. En su lugar, nos ofrece el tipo `struct`, con el cual podemos crear nuestros propios tipos complejos.

## OOP básica en Golang

Veamos un ejemplo simple:

```go
type PersonName struct{
	name string
	surname string
}
```

Cuando queremos tener una variable de este tipo, lo hacemos así:

```go
myName := PersonName{
	name: "Fran",
	surname: "Iglesias",
}
```

Como puedes ver, asignamos directamente los valores de cada propiedad de `PersonName`. En Golang no existe el concepto nativo de constructor, pero es habitual introducir una función constructora, especialmente si queremos tener distintas formas de construirlo:

```go
myName := MakePersonName("Fran", "Iglesias")

func MakePersonName(name, surname string) PersonName {
    return PersonName{
        name: name,
        surname: surname,
    }
}
```

Orientación a Objetos consiste en la encapsulación de datos y procedimientos. Golang hace esto de una manera un tanto particular, usando métodos, una variedad especial de funciones que se pueden asociar a un tipo determinado. El tipo es el receptor o _receiver_.

```go
func (pn PersonName) list() string {
	return pn.surname + ", " + pn.name 
}

myName := MakePersonName("Fran", "Iglesias")

fmt.Println(myName.list())

//Output: Iglesias, Fran
```

Si vemos el conjunto, la estructura nos resultará familiar:

```go

type PersonName struct {
	name    string
	surname string
}

func MakePersonName(name, surname string) PersonName {
	return PersonName{
		name:    name,
		surname: surname,
	}
}

func (pn PersonName) list() string {
	return pn.surname + ", " + pn.name
}
```

En un lenguaje como Java, lo haríamos más o menos así:

```java
class PersonName {
    private String name;
    private String surname;

    public PersonName(String name, String surname) {
        this.name = name;
        this.surname = surname;
    }
    
    public String list() {
        return surname + ", " + name;
    }
}
```

Como se puede ver, en Golang es un poco más verboso, pero es fácil identificar las equivalencias.

Sobre la visibilidad de las _propiedades_ en Golang, ya sabemos que depende de si los nombres comienzan con mayúscula o no. Para hacer propiedades privadas tenemos que nombrarlas empezando en minúscula. Sin embargo, recuerda que serán visibles en el mismo paquete. Esto nos indica que _information hiding_ en Golang es un poco... _relativo_.

## Composición de objetos

El caso es que si estamos trabajando en algún proyecto un poquito complejo, en algún momento querremos hacer composición de objetos para conseguir comportamientos más complejos sin complicar nuestras unidades de código.

De hecho, en Golang no vamos a poder hacer herencia. El lenguaje no soporta ese concepto, lo cual me parece una buena cosa.

¿Y cómo podemos componer objetos? Me alegra que me haga esa pregunta.

La composición de objetos no parece evidente en Golang, pero en realidad es bastante parecida a lo que haríamos en cualquier lenguaje OOP. Veamos un caso de uso simple, como crear y persistir una entidad. Por ejemplo, registrar un nuevo producto en una tienda.

Básicamente, queremos instanciar un nuevo objeto de la clase Product y persistirlo en un repositorio.

```go
type RegisterProduct struct{
	factory ProductFactory
	repository ProductRepository
}
```

Como puedes ver el tipo `RegisterProduct` va a tener dos colaboradores y necesitará algún método. Por ejemplo, algo así:

```go
func (rp RegisterProduct) execute (name, category string) {
	product := rp.factory.make(name, category)
	rp.repository.Store(product)
}
```

Es decir, el tipo `RegisterProduct` contiene los colaboradores, que pueden estar indicados como otros structs o interfaces (más sobre eso luego). Estos colaboradores pueden usarse en los métodos a los que está asociado el tipo.

Normalmente, nos convendrá tener una función constructora:

```go
func MakeRegisterProduct(factory ProductFactory, repository ProductRepository) {
	return RegisterProduct{
		factory: factory,
		repository: repository,
    }
}
```

En conjunto nos podría quedar una cosa así:

```go
type RegisterProduct struct{
	factory ProductFactory
	repository ProductRepository
}

func MakeRegisterProduct(factory ProductFactory, repository ProductRepository) {
    return RegisterProduct{
        factory: factory,
        repository: repository,
    }
}

func (rp RegisterProduct) execute (name, category string) {
    product := rp.factory.make(name, category)
    rp.repository.Store(product)
}
```

## Inversión e Inyección de dependencias

Inversión e Inyección de dependencias son conceptos diferentes aunque relacionados.

La inversión de dependencias es un principio de diseño que nos dice que deberíamos depender de abstracciones y no de detalles. Una abstracción es habitualmente una interfaz pública que puede ser implementada por distintos objetos. Invertimos las dependencias para evitar acoplarnos a implementaciones específicas de un colaborador.

La inyección de dependencias, por su parte, es el hecho de instanciar los colaboradores de un objeto fuera de él y pasárselos en construcción o cuando los vaya a utilizar.

De este modo, la **inversión** de dependencias nos permite depender de interfaces, mientras que **inyectamos** las implementaciones concretas que nos interesan según el contexto. Por ejemplo, según estemos en un entorno de test o en producción.

La inyección de dependencias en Golang ha sido explicada hace un momento en el apartado sobre composición. Efectivamente, la inyección es la herramienta que usamos para hacer composición de objetos, controlando el nivel de acoplamiento.

Así que nos toca hablar de interfaces en Golang.

## Interfaces

Es posible definir interfaces en Golang. Básicamente, una interfaz es un tipo que declara una serie de métodos públicos, como en este ejemplo:

```go
type ProductRepository interface {
	Store(product Product)
	Retrieve(name string) Product
}
```

Una cosa característica de Golang es que no necesitas declarar que un tipo va a usar una interfaz. Sencillamente: si un tipo está asociado a los métodos declarados en una interfaz, es que implementa esa interfaz. Algo así:

```go
type MemoryProductRepository struct{
	products map[string]Product
}

func (pr *MemoryProductRepository) Store (product Product) {
    data := pr.Data
    data[product.Name()] = product
    pr.Data = data
}

func (pr *MemoryProductRepository) Retrieve(name string) {
	return pr.Data[name]
}
```

En este ejemplo, podemos ver que `MemoryProductRepository` está asociado a dos métodos que están definidos en la _interface_ `ProductRepository`, haciendo que `MemoryProductRepository` sea, efectivamente, un `ProductRepository`.

Esto nos abre la puerta de la inversión de dependencias. Podemos usar interfaces para tipar nuestras dependencias, como hemos hecho en nuestros ejemplos anteriores. Podemos pasar cualquier tipo que cumpla la interfaz de `ProductRepository`.

```go
type RegisterProduct struct{
	factory ProductFactory
	repository ProductRepository
}

func MakeRegisterProduct(factory ProductFactory, repository ProductRepository) {
	return RegisterProduct{
		factory: factory,
		repository: repository,
    }
}
```

Y, de este modo, tenemos inversión de dependencias en Golang.

