---
layout: post
title: Aprendiendo go con TDD 1
categories: articles
tags: golang tdd
---

Pues nada, que me ha dado por aprender Golang y para ilustrar algunas de las ideas de este lenguaje he pensado en hacerlo mediante katas.

Empecemos por algo sencillo. Personalmente, hay dos ejercicios que me gusta usar para iniciación en TDD: son la Leap Year y FizzBuzz. La definición del problema no tiene ningún misterio y las reglas de negocio son muy simples. Tampoco requieren estructuras de datos complejas. Esto permite completar el challenge en una sesión breve y así ver el proceso completo.

Voy a empezar por Leap Year. Se trata de crear una función que nos diga si un año es bisiesto o no. Como sabemos hay cuatro reglas:

* Los años bisiestos son aquellos cuyo número es divisible por 4.
* Excepto que también sea divisible por 100, en cuyo caso es un año común especial.
* Excepto que también sea divisible por 400, en cuyo caso es un año bisiesto extraordinario.
* Por supuesto, si no es divisible por 4 se trata de un año común.

He realizado varias veces este ejercicio por lo que tengo bastante claro lo que quiero hacer:

* Primero me ocuparé de los años comunes, no divisibles por 4, como pueden ser 2001, 1995, 2021...
* Luego los años bisiestos normales, como pueden ser 1996 o 2020
* A continuación, los años comunes extraordinarios, divisibles por 100, como por ejemplo 1800 o 1900.
* Y finalizaré con los años bisiestos extraordinarios, como el 2000.

La razón de seguir este orden es que así consigo que mi función detecte el mayor número de casos posible cuando antes. En un siglo hay 76 años comunes y 24 bisiestos, más un bisiesto extra cada 4 siglos.

Así vayamos a Go.

## Let's go

La instalación estándar de Go es muy simple: se crea una carpeta go en tu disco duro, que contiene tres carpetas: bin, pkg y src. Nosotras trabajaremos en esta última que es en la que desarrollas tus proyectos. En las otras estarán disponibles las dependencias que vayas usando, así como binarios que en un momento dado necesites, etc.

Aunque para proyectos como katas la ubicación en tu disco duro no es especialmente importante, lo cierto es que si haces proyectos más ambiciosos es preferible que trabajes en la carpeta src.

Go viene de serie con su librería de testing, aunque puede que no sea lo que esperabas.

Así que vamos a ver un test sencillo. Este es mi archivo `leapyear/leapyear_test.go`. La ruta es desde la raíz del proyecto:

```
go-katas/
├── go-katas.iml
├── go.mod
└── leapyear
    └── leapyear_test.go

1 directory, 3 files
```

Por convención nombramos así el archivo de test. Veamos ahora su contenido:

```go
// leapyear/leapyear_test.go

package leapyear

import "testing"

func TestLeapYear(t *testing.T) {
	got := LeapYear(1995)

	if got != false {
		t.Logf("Expected false, got true")
		t.Fail()
	}
}
```

En Go usamos `package` para empaquetar o modularizar. Los archivos del mismo package están bajo la misma carpeta, por lo que en Go es habitual que los tests estén junto al código de producción.

La segunda línea hace el `import` de la librería de testing, cuyo nombre es agradablemente obvio.

El test, en sí, es una función. Su nombre debe empezar por `Test` y se le pasa un parámetro `t` que es algo así como un objeto que contiene lo que podamos necesitar para hacer nuestros tests.

En este caso simplemente esperamos implementar una función LeapYear que recibe un parámetro y devuelve una respuesta boolean. Es habitual usar siempre una variable llamada `got` para representar el valor obtenido y chequearlo luego.

## Variables y asignación

Fijémonos un momento en el operador de asignación.

```go
got := LeapYear(1995)
```

El operador `:=` asigna el valor retornado a la variable got, pero no solo eso, sino que inicializa la variable con el tipo inferido de la respuesta. Nosotras sabemos que será booleana, por lo que podríamos haber hecho esto, que sería declarar la variable con su tipo y luego asignarle el valor retornado.

```go
var got bool
got = LeapYear(1995)
```

O incluso esto:

```go
var got = LeapYear(1995)
```

Estas tres expresiones son equivalentes. Diría que la más usada comúnmente es la primera. 

Eso sí, Go no te dejará compilar si nunca llegas a usar una variable declarada. Es decir, esto no funcionará:

```go
package leapyear

import "testing"

func TestLeapYear(t *testing.T) {
	var got bool
	if LeapYear(1995) != false {
		t.Logf("Expected false, got true")
		t.Fail()
	}
}
```

Pero volvamos al test. Lo copio aquí de nuevo:

```go
func TestLeapYear(t *testing.T) {
	got := LeapYear(1995)

	if got != false {
        t.Fail()
        t.Logf("Expected false, got true")
	}
}
```

## Cómo escribir tests en Go

En la librería estándar de testing no hay _asserts_, así que normalmente construiremos un test chequeando `got` contra un valor esperado. Si no coinciden, lo indicamos y hacemos fallar el test. Hay varias formas de hacer esto, por lo que volveré más adelante a mostrar estas alternativas. Por el momento, te puedo decir que usamos las funciones asociadas a `t` para reaccionar.

`t.Fail` nos permite marcar que el test falla. Si no marcas el test se dará como que pasa.

`t.LogF` nos sirve para emitir un error a `stderr`, usando una cadena de formato (en el ejemplo no es necesario).

Vamos a comenzar la implementación de la función `LeapYear`. El nombre empieza en mayúscula. Esto es importante porque en Go esta mayúscula inicial indica que la función es exportable y accesible desde fuera del package. En otras palabras, es una forma de declarar que algo es público.

Empezaré añadiendo una implementación en el mismo archivo de test.

```go
package leapyear

import "testing"

func TestLeapYear(t *testing.T) {
	got := LeapYear(1995)

	if got != false {
		t.Logf("Expected false, got true")
		t.Fail()
	}
}

func LeapYear(year int) bool {
	return true
}
```

Hay algunas cosas que nos llamarán la atención. Go es un lenguaje con tipado estricto por lo que si declaramos un tipo de retorno, tenemos que tener un `return` que devuelva un booleano. En este caso devuelvo `true` porque quiero que el test falle por la razón correcta. Hasta ahora fallaba porque no teníamos la función. Ahora falla así:

```
=== RUN   TestLeapYear
    leapyear_test.go:9: Expected false, got true
--- FAIL: TestLeapYear (0.00s)

FAIL
```

Aprovecharé este momento para introducir otras forma de lidiar con el caso de que el test falle. Aquí tenemos otra manera de indicar que el test falla:

```
func TestLeapYear(t *testing.T) {
	got := LeapYear(1995)

	if got != false {
		t.Errorf("Expected false, got true")
	}
}
```

El resultado es similar a la versión anterior, pero esta vez no tienes que marcar el test como que falla. `t.Errorf` lo hace por ti.

Una cosa a tener en cuenta es que se ejecutará todo el código hasta el final del test, así que si haces varias comprobaciones se ejecutarán todas, tanto si pasan como si no. Pero si una no pasa, el test se dará como fallido.

Sin embargo, habrá situaciones en las que prefieras que el test se detenga si falla en un caso específico. Para ello puedes usar estas dos variantes:

```go
func TestLeapYear(t *testing.T) {
	got := LeapYear(1995)

	if got != false {
		t.Logf("Expected false, got true")
		t.FailNow()
	}
}
```

O bien:

```go
func TestLeapYear(t *testing.T) {
	got := LeapYear(1995)

	if got != false {
		t.Fatalf("Expected false, got true")
	}
}
```

En este punto vamos a hacer pasar el test retornando `false` en nuestra función LeapYear, con lo cual resolvemos el caso de los años comunes.


```go
func LeapYear(year int) bool {
	return false
}
```

Y ya que ahora el test pasa, podemos refactorizar moviendo la función a su propio archivo `leapyear.go`.

```
.
├── go-katas.iml
├── go.mod
└── leapyear
    ├── leapyear.go
    └── leapyear_test.go

1 directory, 4 files
```

Vamos a ver ahora otra forma de escribir nuestros tests. El parámetro `t` puede también ejecutar un test dándole un nombre, lo que nos permite ser más expresivas:

```go
func TestLeapYear(t *testing.T) {
	t.Run("Common years", func(t *testing.T) {
		got := LeapYear(1995)

		if got != false {
			t.Errorf("Expected false, got true")
		}
	})
}
```

No parece una gran diferencia, pero cuando ejecutamos el test:

```
=== RUN   TestLeapYear
=== RUN   TestLeapYear/Common_years
--- PASS: TestLeapYear (0.00s)
    --- PASS: TestLeapYear/Common_years (0.00s)
PASS
ok  	go-katas/leapyear	0.425s
```

Vemos que aparece el nombre que le hemos dado a ese ejemplo concreto. Esto nos permite agrupar tests relacionados dentro de una sola función de test y mantener una buena documentación.

Añadamos un segundo test para tratar el caso de los años bisiestos normales:

```go
func TestLeapYear(t *testing.T) {
	t.Run("Common years", func(t *testing.T) {
		got := LeapYear(1995)

		if got != false {
			t.Errorf("Expected false, got true")
		}
	})
	t.Run("Leap years", func(t *testing.T) {
		got := LeapYear(2020)

		if got != true {
			t.Errorf("Expected true, got false")
		}
	})
}
```

El nuevo test fallará, por supuesto. 

```
=== RUN   TestLeapYear
=== RUN   TestLeapYear/Common_years
=== RUN   TestLeapYear/Leap_years
    leapyear_test.go:17: Expected true, got false
--- FAIL: TestLeapYear (0.00s)
    --- PASS: TestLeapYear/Common_years (0.00s)
    --- FAIL: TestLeapYear/Leap_years (0.00s)
FAIL
FAIL	go-katas/leapyear	0.328s
FAIL
```

Para hacerlo pasar introduciré una condición para que diga que 2020 es bisiesto:

```go
package leapyear

func LeapYear(year int) bool {
	if year == 2020 {
		return true
	}
	return false
}
```

## Presentando los _table tests_

Esto fue fácil, pero está claro que el algoritmo no es lo bastante listo. Necesito hacer más tests que me fuercen a evolucionarlo. Pero esta vez, en lugar de repetir todo el test completo, introduciré un Table Test, que es una forma de hacer tests en Go con la que podemos escribir tests parametrizados de una forma bastante económica.

Así que refactorizo el test y veremos que el paso intermedio tenía bastante sentido:

```go
func TestLeapYear(t *testing.T) {
	tests := []struct {
		name string
		year int
		want bool
	}{
		{name: "Common year", year: 1995, want: false},
		{name: "Leap year", year: 2020, want: true},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			got := LeapYear(test.year)

			if got != test.want {
				t.Errorf("Expected %#v, got %#v", test.want, got)
			}
		})
	}
}
```

Hay unos cuantos cambios aquí y se introducen algunos conceptos nuevos. Intentaré explicarlos paso a paso.

Lo primero que llama la atención es esto:

```go
tests := []struct {
		name string
		year int
		want bool
	}{
		{name: "Common year", year: 1995, want: false},
		{name: "Leap year", year: 2020, want: true},
	}
```

## Tipos compuestos con struct

Aquí definimos un array de `struct`. `Struct` es un tipo genérico de estructura de datos que contiene un conjunto de parejas clave/valor. En otros lenguajes llamaríamos a esto un diccionario o un hashmap. Tiene cierta similitud a un DTO, pero mejor no liarnos con esas comparaciones.

En este caso, la `struct` es anónima. Como veremos en otro momento, las structs nos permiten definir tipos, pero en este caso únicamente la usaremos en este test.

El primer bloque define los campos o claves de la `struct`, que para nuestro ejemplo serán el nombre del test, el año que vamos a probar y el valor contra el que queremos probar el resultado. Como es obvio, cada test que hagamos tendrá una estructura diferente, aunque lo normal será contar con un campo `name` y un campo `want`. Estos nombres son una convención habitual.

```go
struct {
		name string
		year int
		want bool
	}
```

En el segundo bloque tenemos el array de instancias de la `struct` que asignamos a la variable `tests`.

```go
{
    {name: "Common year", year: 1995, want: false},
    {name: "Leap year", year: 2020, want: true},
}
```

Cada elemento del array es una _instancia_ del tipo de struct que hemos definido en la que a cada clave se le asigna un valor. Con esto definimos los distintos tests que queremos ejecutar.

Finalmente, recorremos el array usando los valores para ejecutar cada ejemplo.

```go
for _, test := range tests {
    t.Run(test.name, func(t *testing.T) {
        got := LeapYear(test.year)

        if got != test.want {
            t.Errorf("Expected %#v, got %#v", test.want, got)
        }
    })
}
```

## El bucle for en Go

Esto nos lleva a introducir el bucle `for` en Go que, de hecho, es el único tipo de bucle de que disponemos, así como algunos detalles idiomáticos de Go que pueden resultarte novedosos. Empecemos:

Go permite retorno múltiple.

```go
for _, test := range tests
```

`range test` recorre los elementos del array test. Esta construcción es similar a un `foreach` o `each` en otros lenguajes. Además, devuelve dos valores en cada iteración: el índice de la iteración y el valor. Por eso tenemos dos variables a la izquierda de la asignación.

Sin embargo, uno de los nombres de variables es el signo _underscore_ `_` y significa que vamos a ignorar explícitamente ese valor, de modo que el compilador no se queje si no lo usamos en el código, como es el caso. Recuerda que en Go si declaras algo tienes que utilizarlo.

El bloque dentro del bucle es lo mismo que teníamos antes para ejecutar el test, excepto que usamos los valores que vienen en el struct asignado a la variable `test`.

```go
t.Run(test.name, func(t *testing.T) {
    got := LeapYear(test.year)

    if got != test.want {
        t.Errorf("Expected %#v, got %#v", test.want, got)
    }
})
```

En la cadena de formato destacaría el símbolo `%#v` que nos permite mostrar el parámetro correspondiente con la visualización por defecto para su tipo sin tener que preocuparse del tipo concreto. En este caso, los valores booleanos se representarán con `true` y `false`.

Con este refactor es muy fácil añadir nuevos ejemplos con poco esfuerzo. Tan solo es una línea:

```go
package leapyear

import "testing"

func TestLeapYear(t *testing.T) {
	tests := []struct {
		name string
		year int
		want bool
	}{
		{name: "Common year", year: 1995, want: false},
		{name: "Leap year 2020", year: 2020, want: true},
		{name: "Leap year 1996", year: 1996, want: true},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			got := LeapYear(test.year)

			if got != test.want {
				t.Errorf("Expected %#v, got %#v", test.want, got)
			}
		})
	}
}
```

El nuevo ejemplo cuestiona nuestra implementación actual. Podemos resolverlo así:

```go
package leapyear

func LeapYear(year int) bool {
	if year % 4 == 0 {
		return true
	}
	return false
}
```

Para este ejemplo usaré pasos relativamente grandes a fin de no alargar mucho el post. Pero antes de continuar quizá podamos hacer un refactor:

```go
package leapyear

func LeapYear(year int) bool {
	return year%4 == 0
}
```
Sigamos avanzando para implementar la totalidad del comportamiento de la función, para lo cual introducimos un nuevo test:

```go
func TestLeapYear(t *testing.T) {
	tests := []struct {
		name string
		year int
		want bool
	}{
		{name: "Common year", year: 1995, want: false},
		{name: "Leap year 2020", year: 2020, want: true},
		{name: "Leap year 1996", year: 1996, want: true},
		{name: "Extra common year", year: 1900, want: false},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			got := LeapYear(test.year)

			if got != test.want {
				t.Errorf("Expected %#v, got %#v", test.want, got)
			}
		})
	}
}
```

No debería suponer mucha dificultad hacerlo pasar:

```go
func LeapYear(year int) bool {
	if year%100 == 0 {
		return false
	}
	return year%4 == 0
}
```

Es bastante obvio que el concepto ser divisible es importante en este pequeño dominio, así que podemos hacerlo explícito con un refactor:

```go
func LeapYear(year int) bool {
	if divisibleBy(year, 100) {
		return false
	}
	return divisibleBy(year, 4)
}

func divisibleBy(number, divisor int) bool {
	return number%divisor == 0
}

```

Finalmente, el caso de años bisiestos extraordinarios:

```go
func TestLeapYear(t *testing.T) {
	tests := []struct {
		name string
		year int
		want bool
	}{
		{name: "Common year", year: 1995, want: false},
		{name: "Leap year 2020", year: 2020, want: true},
		{name: "Leap year 1996", year: 1996, want: true},
		{name: "Extra common year", year: 1900, want: false},
		{name: "Extra leap year", year: 2000, want: true},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			got := LeapYear(test.year)

			if got != test.want {
				t.Errorf("Expected %#v, got %#v", test.want, got)
			}
		})
	}
}
```

Que se resuelve así:

```go
func LeapYear(year int) bool {
	if divisibleBy(year, 400) {
		return true
	}

	if divisibleBy(year, 100) {
		return false
	}
	return divisibleBy(year, 4)
}

func divisibleBy(number, divisor int) bool {
	return number%divisor == 0
}
```

Con lo que el comportamiento queda completamente definido.

## Un poquito más de Go

Aprovechemos para introducir algunas características más del lenguaje. Nos fijamos ahora en la función `divisibleBy`.

```go
func divisibleBy(number, divisor int) bool
```

Podemos ver que es posible aplicar el mismo tipo a varios parámetros en su firma con tal de que vayan contiguos.

Pero vayamos ahora a un aspecto más intrigante. Si lo pensamos, vemos que la función LeapYear solo tiene sentido en el ámbito de los números enteros que representan años y, específicamente en el calendario gregoriano. Cabe preguntarse si no estaría bien disponer de un tipo `Year`.

El caso es que es muy fácil de introducir. Básicamente, un Year es un entero:

```go
type Year int
```

Veamos ahora cómo usarlo en nuestro código. En el test definimos que la _key_ `year` en la struct sea de tipo `Year`.

```go
func TestLeapYear(t *testing.T) {
	tests := []struct {
		name string
		year Year
		want bool
	}{
		{name: "Common year", year: 1995, want: false},
		{name: "Leap year 2020", year: 2020, want: true},
		{name: "Leap year 1996", year: 1996, want: true},
		{name: "Extra common year", year: 1900, want: false},
		{name: "Extra leap year", year: 2000, want: true},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			got := LeapYear(test.year)

			if got != test.want {
				t.Errorf("Expected %#v, got %#v", test.want, got)
			}
		})
	}
}
```

En el código de producción, hacemos que la función `LeapYear` acepte `Year` en vez de `int`. Como nos parece que tiene sentido que `divisibleBy` reciba un parámetro `int`, tenemos que hacer un casting a `int`, como se puede ver a continuación.

```go
package leapyear

type Year int

func LeapYear(year Year) bool {
	if divisibleBy(int(year), 400) {
		return true
	}

	if divisibleBy(int(year), 100) {
		return false
	}
	return divisibleBy(int(year), 4)
}

func divisibleBy(number, divisor int) bool {
	return number%divisor == 0
}
```

Pero no queda ahí la cosa. En Go es posible definir funciones y asociarlas a ciertos tipos de datos. A estas funciones les llamamos `methods`. Es similar a los métodos en orientación a objetos, pero a la vez es muy diferente. Veamos:

```go
func (y Year) isLeap() bool {
	if divisibleBy(int(y), 400) {
		return true
	}

	if divisibleBy(int(y), 100) {
		return false
	}
	return divisibleBy(int(y), 4)
}
```

El parámetro que recibe `func` es el _receiver_. ¿Cuáles son la ventaja de hacerlo así? 

La que estamos viendo ahora es principalmente semántica. La función isLeap tiene sentido semántico cuando se aplica a números que representan años. Nosotros hacemos esto explícito mediante la definición de un tipo y asociando la función a ese tipo.

Aparte, ahora podemos usar la función de esta manera, vamos a verlo en el test:

```go
for _, test := range tests {
    t.Run(test.name, func(t *testing.T) {
        got := test.year.isLeap()

        if got != test.want {
            t.Errorf("Expected %#v, got %#v", test.want, got)
        }
    })
}
```

Esta notación recuerda a la programación orientada a objetos. Volveremos sobre este tema a menudo.

La otra ventaja tiene que ver con el uso de interfaces, aunque lo veremos en alguna otra entrega (si es que llegamos a ella, claro).