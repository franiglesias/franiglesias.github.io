---
layout: post
title: Aprendiendo Go con TDD 2
categories: articles
tags: golang tdd
---

Vamos con la segunda entrega de este diario de aprendizaje de Golang con TDD.

En la entrega anterior hemos visto los elementos básicos de testing en Go, así como algunas características de este lenguaje. No hemos entrado en muchas profundidades.

Hay que tener en cuenta que la serie consiste en ir descubriendo detalles del lenguaje a medida que voy realizando ejercicios de código. Sin embargo, no voy a hacer un curso sistemático sino más bien un descubrimiento casual a medida que el ejercicio lo demanda.

Para esta entrega, he elegido String Calculator, dado que ha aparecido en algunas conversaciones que he estado teniendo y la tengo fresca. Así que vamos a ello.

El ejercicio consiste en programar una calculadora con una función `Add`, a la que le podemos pasar 0, 1 o 2 números separados por coma en forma de string y que deberá devolver su suma. Este ejercicio fue creado originalmente por Roy Osgrove para ser realizado en Java, así que vamos a ver qué sale en Golang, donde no tenemos objetos... al menos no de esa manera.

## Sumar dos números

Para el primer requisito debemos desarrollar los siguientes comportamientos:

* Si se pasa una cadena vacía, el resultado es cero.
* Si se pasa un único número, el resultado es el mismo número.
* Si se pasan dos números, el resultado es su suma.

Está todo bastante claro. La opción obvia es empezar por el primer ejemplo.

Este es mi planteamiento inicial hasta conseguir un test que falla porque no devuelve la respuesta esperada. He decidido usar el nombre `CalculatorAdd`, aparte de eso, nada especial.

```go
func TestStringCalculator(t *testing.T) {
	t.Run("Defaults to 0", func(t *testing.T) {
		got := CalculatorAdd("")

		if got != 0 {
			t.Errorf("Expected %#v, got: %#v", 0, got)
		}
	})
}

func CalculatorAdd(input string) int {
	return -1
}
```

El primer paso sería este, incluyendo un pequeño refactor en el test:

```go
func TestStringCalculator(t *testing.T) {
	t.Run("Defaults to 0", func(t *testing.T) {
		got := CalculatorAdd("")

		want := 0

		if got != want {
			t.Errorf("Expected %#v, got: %#v", want, got)
		}
	})
}

func CalculatorAdd(input string) int {
	return 0
}
```

No habiendo más que hacer, paso al siguiente ejemplo:

```go
func TestStringCalculator(t *testing.T) {
	t.Run("Defaults to 0", func(t *testing.T) {
		got := CalculatorAdd("")

		want := 0

		if got != want {
			t.Errorf("Expected %#v, got: %#v", want, got)
		}
	})

	t.Run("Only one number returns the number", func(t *testing.T) {
		got := CalculatorAdd("4")

		want := 4

		if got != want {
			t.Errorf("Expected %#v, got: %#v", want, got)
		}
	})
}
```

De momento podemos trabajar con una implementación tonta. Y tan tonta:

```go
func CalculatorAdd(input string) int {
	if input == "" {
		return 0
	}

	return 4
}
```

A continuación, fuerzo la implementación obvia añadiendo un nuevo ejemplo.

```go
func TestStringCalculator(t *testing.T) {
	t.Run("Defaults to 0", func(t *testing.T) {
		got := CalculatorAdd("")

		want := 0

		if got != want {
			t.Errorf("Expected %#v, got: %#v", want, got)
		}
	})

	t.Run("Only one number returns the number", func(t *testing.T) {
		got := CalculatorAdd("4")

		want := 4

		if got != want {
			t.Errorf("Expected %#v, got: %#v", want, got)
		}
	})

	t.Run("Only one number returns the number", func(t *testing.T) {
		got := CalculatorAdd("10")

		want := 10

		if got != want {
			t.Errorf("Expected %#v, got: %#v", want, got)
		}
	})
}
```

El código de producción sería este:

```go
func CalculatorAdd(input string) int {
	if input == "" {
		return 0
	}

	result, _ := strconv.Atoi(input)
	return result
}
```

Aquí tenemos varias cosas que nos pueden resultar interesantes.

La primera es cómo convertir un `string` en `int`, para lo cual tenemos que utilizar la librería `strconv`. Esta proporciona varias funciones. La más simple es esta: `Atoi` y es suficiente para nuestro ejercicio.

El otro detalle es que la función `Atoi` devuelve tanto la respuesta como un error si ha ocurrido. Nosotras hemos decidido ignorarlo explícitamente, por eso no la asignamos a ninguna variable. En Go es habitual devolver errores, por lo que es algo que normalmente deberíamos tener en cuenta. Sin embargo, de momento no vamos a ocuparnos de eso.

De todos modos, he aquí otra opción que podrías usar, para manejar el error, enviándolo a stdError.

```go
func CalculatorAdd(input string) int {
	if input == "" {
		return 0
	}

	result, err := strconv.Atoi(input)
	if err != nil {
		log.Println(err.Error())
	}
	return result
}
```

En ambos casos, el test pasa. El problema que tenemos ahora es que escribir tests de esta forma es bastante incómodo. Podríamos usar un framework de testing, pero un poco de refactor puede ser suficiente para nuestro ejercicio. He aquí una versión más compacta.

```go
func TestStringCalculator(t *testing.T) {
    t.Run("Defaults to 0", func(t *testing.T) {
        expectedToBe(t, 0, CalculatorAdd(""))
    })
    
    t.Run("Only one number returns the number", func(t *testing.T) {
       expectedToBe(t, 4, CalculatorAdd("4"))
	   expectedToBe(t, 10, CalculatorAdd("10"))
    })
}
    
func expectedToBe(t *testing.T, want int, got int) {
    if got != want {
        t.Errorf("Expected %#v, got: %#v", want, got)
    }
}
```

Esto tiene un poco pinta de Table Test:

```go
func TestStringCalculator(t *testing.T) {
	t.Run("Defaults to 0", func(t *testing.T) {
		expectedToBe(t, 0, CalculatorAdd(""))
	})

	t.Run("Only one number returns the number", func(t *testing.T) {
		tests := []struct {
			name  string
			input string
			want  int
		}{
			{name: "4", input: "4", want: 4},
			{name: "10", input: "10", want: 10},
		}

		for _, test := range tests {
			t.Run(test.name, func(t *testing.T) {
				expectedToBe(t, test.want, CalculatorAdd(test.input))
			})
		}
	})
}
```

Personalmente, me gusta tener separados los distintos comportamientos. Así que para implementar la suma de dos números, voy a crear un nuevo test, pero usando directamente la estructura de table test.

```go
func TestStringCalculator(t *testing.T) {
	t.Run("Defaults to 0", func(t *testing.T) {
		expectedToBe(t, 0, CalculatorAdd(""))
	})

	t.Run("Only one number returns the number", func(t *testing.T) {
		tests := []struct {
			name  string
			input string
			want  int
		}{
			{name: "4", input: "4", want: 4},
			{name: "10", input: "10", want: 10},
		}

		for _, test := range tests {
			t.Run(test.name, func(t *testing.T) {
				expectedToBe(t, test.want, CalculatorAdd(test.input))
			})
		}
	})

	t.Run("Two numbers calculates the sum", func(t *testing.T) {
		tests := []struct {
			name  string
			input string
			want  int
		}{
			{name: "2 + 3", input: "2,3", want: 5},
		}

		for _, test := range tests {
			t.Run(test.name, func(t *testing.T) {
				expectedToBe(t, test.want, CalculatorAdd(test.input))
			})
		}
	})
}
```

Empiezo haciendo implementación _fake_:

```go
func CalculatorAdd(input string) int {
	if input == "" {
		return 0
	}

	if input == "2,3" {
		return 5
	}

	result, err := strconv.Atoi(input)
	if err != nil {
		log.Println(err.Error())
	}
	return result
}
```

Como los tests pasan me planteo si no puedo hacer algo con la conversión de string a int, que es muy verbosa. Podría ocultar su verbosidad en una función porque además es previsible que la necesite reutilizar.

```go
func CalculatorAdd(input string) int {
	if input == "" {
		return 0
	}

	if input == "2,3" {
		return 5
	}

	return strToInt(input)
}

func strToInt(input string) int {
	result, err := strconv.Atoi(input)
	if err != nil {
		log.Println(err.Error())
	}
	return result
}
```

Ahora, introduciré algún test nuevo. Solo pongo el nuevo test para centrarnos en él:

```go
	t.Run("Two numbers calculates the sum", func(t *testing.T) {
		tests := []struct {
			name  string
			input string
			want  int
		}{
			{name: "2 + 3", input: "2,3", want: 5},
			{name: "7 + 15", input: "7,15", want: 22},
		}

		for _, test := range tests {
			t.Run(test.name, func(t *testing.T) {
				expectedToBe(t, test.want, CalculatorAdd(test.input))
			})
		}
	})
```

Este test busca forzarme a introducir una solución al problema de sumar los dos números. Es un tipo de triangulación:

```go
func CalculatorAdd(input string) int {
	if input == "" {
		return 0
	}

	if input == "2,3" {
		return 5
	}

	if input == "7,15" {
		return 22
	}

	return strToInt(input)
}
```

Debería tener tres ejemplos, pero en este caso nos bastaría con dos, ya que es bastante obvio. El resultado debería ser la suma de los números que se pasan en el parámetro `input`.

```go
func CalculatorAdd(input string) int {
	if input == "" {
		return 0
	}

	if input == "2,3" {
		return 2 + 3
	}

	if input == "7,15" {
		return 7 + 15
	}

	return strToInt(input)
}
```

Aunque para ser más precisas, sería algo así:

```go
func CalculatorAdd(input string) int {
	if input == "" {
		return 0
	}

	if input == "2,3" {
		return strToInt("2") + strToInt("3")
	}

	if input == "7,15" {
		return strToInt("7") + strToInt("15")
	}

	return strToInt(input)
}
```

Fíjate que en todo momento los tests están pasando. Lo que necesito ahora es una forma de partir `input` para extraer los números que debo sumar. Resulta que la librería estándar me proporciona una solución:

```go
func CalculatorAdd(input string) int {
	if input == "" {
		return 0
	}

	if input == "2,3" {
		first, second, found := strings.Cut(input, ",")
		if found {
			return strToInt(first) + strToInt(second)
		}
	}

	if input == "7,15" {
		return strToInt("7") + strToInt("15")
	}

	return strToInt(input)
}
```

El paquete `strings`, incluye una función `Cut`, que me permite partir un `string` en dos trozos. Devuelve ambos trozos y un flag `found`, con el que saber si ha tenido éxito o no. En nuestro ejemplo, `found` será `true` si `input` contiene dos números y `false` si únicamente contiene uno. 

De este modo, podemos hacer lo siguiente:

```go
func CalculatorAdd(input string) int {
	if input == "" {
		return 0
	}

	first, second, found := strings.Cut(input, ",")
	if found {
		return strToInt(first) + strToInt(second)
	}
	
	return strToInt(input)
}
```

Un efecto de que la llamada a funciones retorne errores o flags para indicar si ha habido éxito o no es que normalmente tendremos que asignar los resultados a una o más variables, y verificar que podemos continuar. En principio, no podemos pasar el resultado de una función como parámetro de otra... ¿o sí?

En realidad sí podríamos, siempre que la signatura de la otra función coincida con lo que devuelve la primera. Como en este ejemplo que no recomiendo, únicamente lo incluyo como demostración de que es posible hacerlo:

```go
func CalculatorAdd(input string) int {
	if input == "" {
		return 0
	}

	i, done := sum(strings.Cut(input, ","))
	if done {
		return i
	}

	return strToInt(input)
}

func sum(first string, second string, found bool) (int, bool) {
	if found {
		return strToInt(first) + strToInt(second), true
	}
	return 0, false
}
```

Podríamos añadir algunos tests más para verificarlo, pero el primer requisito está completo.

Hemos podido aprender que Golang es un lenguaje bastante sobrio que proporciona utilidades mediante paquetes. Ciertamente, la librería estándar incluye la mayor parte de cosas que puedas necesitar. Por ejemplo, en este paquete hemos requerido funcionalidad de `strconv` y `string`.

Por otro lado, constatar que Go te fuerza a tener gestionar los errores y no te deja esconderlos fácilmente bajo la alfombra.

## Sumar cualquier cantidad de números

El siguiente requisito nos pide poder sumar cualquier cantidad arbitraria de números lo que conlleva generalizar nuestra solución actual. Empezamos con un test suficiente para cuestionar la implementación actual:

```go
	t.Run("Support arbitrary quantity of numbers", func(t *testing.T) {
		tests := []struct {
			name  string
			input string
			want  int
		}{
			{name: "2 + 3 + 10", input: "2,3,10", want: 15},
		}

		for _, test := range tests {
			t.Run(test.name, func(t *testing.T) {
				expectedToBe(t, test.want, CalculatorAdd(test.input))
			})
		}
	})
```

El problema es que `Cut` separa la cadena en la primera coma y deja todas las demás en la variable `second`. Resulta que `second` es una cadena que podríamos usar como input, pues es una colección de números concatenados con comas, por lo que tenemos una solución realmente fácil usando recursión:

```go
func CalculatorAdd(input string) int {
	if input == "" {
		return 0
	}

	first, second, found := strings.Cut(input, ",")
	if found {
		return strToInt(first) + CalculatorAdd(second)
	}

	return strToInt(input)
}
```

Añadimos el test que viene en el ejemplo como test de aceptación para ver si nuestra solución es lo bastante general, que lo es.

```go
	t.Run("Support arbitrary quantity of numbers", func(t *testing.T) {
		tests := []struct {
			name  string
			input string
			want  int
		}{
			{name: "2+3+10", input: "2,3,10", want: 15},
			{name: "1+2+3+4+5+6+7+8+9", input: "1,2,3,4,5,6,7,8,9", want: 45},
		}

		for _, test := range tests {
			t.Run(test.name, func(t *testing.T) {
				expectedToBe(t, test.want, CalculatorAdd(test.input))
			})
		}
	})
```

Algo que podríamos hacer en este momento en refactorizar los tests para hacerlos más compactos, ya que representan el mismo comportamiento.

```go
func TestStringCalculator(t *testing.T) {
	t.Run("Defaults to 0", func(t *testing.T) {
		expectedToBe(t, 0, CalculatorAdd(""))
	})

	t.Run("Only one number returns the number", func(t *testing.T) {
		tests := []struct {
			name  string
			input string
			want  int
		}{
			{name: "4", input: "4", want: 4},
			{name: "10", input: "10", want: 10},
		}

		for _, test := range tests {
			t.Run(test.name, func(t *testing.T) {
				expectedToBe(t, test.want, CalculatorAdd(test.input))
			})
		}
	})

	t.Run("Support arbitrary quantity of numbers", func(t *testing.T) {
		tests := []struct {
			name  string
			input string
			want  int
		}{
			{name: "2+3", input: "2,3", want: 5},
			{name: "7+15", input: "7,15", want: 22},
			{name: "2+3+10", input: "2,3,10", want: 15},
			{name: "1+2+3+4+5+6+7+8+9", input: "1,2,3,4,5,6,7,8,9", want: 45},
		}

		for _, test := range tests {
			t.Run(test.name, func(t *testing.T) {
				expectedToBe(t, test.want, CalculatorAdd(test.input))
			})
		}
	})
}
```

## Soporte a nuevos separadores

El siguiente requisito cambia nuestro foco a los separadores. Nos pide admitir el código de salto de línea como un separador válido. Comenzaré con un test más sencillo que el propuesto (Add("1\n2,3") // 6) en el que se combinan ambos, de modo que solo gestione un separador cada vez.

```go
	t.Run("Support newline separator", func(t *testing.T) {
		tests := []struct {
			name  string
			input string
			want  int
		}{
			{name: "2+3", input: "2\n3", want: 5},
		}

		for _, test := range tests {
			t.Run(test.name, func(t *testing.T) {
				expectedToBe(t, test.want, CalculatorAdd(test.input))
			})
		}
	})
```

Como es de esperar, el test falla dado que al no encontrar un separador soportado, no se puede partir la cadena en números y el resultado tampoco es un número válido.

Una forma sencilla de abordar este problema es reemplazar el carácter `\n` con una coma. De este modo, reducimos el problema a uno conocido que ya tiene solución:

```go
func CalculatorAdd(input string) int {
	if input == "" {
		return 0
	}

	input = strings.ReplaceAll(input, "\n", ",")

	first, second, found := strings.Cut(input, ",")
	if found {
		return strToInt(first) + CalculatorAdd(second)
	}

	return strToInt(input)
}
```

Por supuesto, esta solución funciona. Otra alternativa sería hacer el split con una expresión regular, pero esta solución es mucho más económica y no require imports extra. Y es lo bastante general como para soportar más ejemplos:

```go
t.Run("Support newline separator", func(t *testing.T) {
		tests := []struct {
			name  string
			input string
			want  int
		}{
			{name: "2+3", input: "2\n3", want: 5},
			{name: "1+2+3", input: "1\n2,3", want: 6},
		}

		for _, test := range tests {
			t.Run(test.name, func(t *testing.T) {
				expectedToBe(t, test.want, CalculatorAdd(test.input))
			})
		}
	})
```

## Separadores opcionales

El próximo requisito nos pide dar soporte a separadores opcionales, definidos en la misma cadena mediante un formato particular: `“//<separator>\n<numbers>”`. De nuevo, voy a empezar con el test más pequeño que pueda para centrarme en capturar el bloque inicial, que es opcional.

```go
	t.Run("Support custom separators", func(t *testing.T) {
		tests := []struct {
			name  string
			input string
			want  int
		}{
			{name: "5+1", input: "//;\n5;1", want: 6},
		}

		for _, test := range tests {
			t.Run(test.name, func(t *testing.T) {
				expectedToBe(t, test.want, CalculatorAdd(test.input))
			})
		}
	})
```

Este es el test más pequeño que he podido hacer fallar. Mi intención era un test que solo incluyese un número pero ese test no falla. En cualquier caso lo que necesito hacer es:

* separar la cadena de "configuración" de la cadena de números.
* identificar el separador opcional
* normalizar la cadena de números para poder realizar la parte de cálculo

Esto pone de manifiesto que tenemos varias responsabilidades, quizá fuese conveniente refactorizar un poco antes de continuar, por lo que anula el test por el momento. En el primer paso, separo la responsabilidad de calcular en una función diferente.

```go
func CalculatorAdd(input string) int {
	if input == "" {
		return 0
	}

	input = strings.ReplaceAll(input, "\n", ",")

	return calculate(input)
}

func calculate(input string) int {
	first, second, found := strings.Cut(input, ",")
	if found {
		return strToInt(first) + calculate(second)
	}

	return strToInt(input)
}
```

El siguiente paso hace explícita la normalización de separadores. La lógica es que quiero detectar un nuevo separador en el bloque opcional y tratarlo como cualquier otro.

```go
func CalculatorAdd(input string) int {
	if input == "" {
		return 0
	}

	input = supportSeparator(input, "\n")

	return calculate(input)
}

func supportSeparator(input string, separator string) string {
	input = strings.ReplaceAll(input, separator, ",")
	return input
}

func calculate(input string) int {
	first, second, found := strings.Cut(input, ",")
	if found {
		return strToInt(first) + calculate(second)
	}

	return strToInt(input)
}
```

Aparte de eso, voy a hacer explícitos los cambios de la cadena a medida que es procesada:

```go
func CalculatorAdd(input string) int {
	if input == "" {
		return 0
	}

	normalizedInput := supportSeparator(input, "\n")

	return calculate(normalizedInput)
}
```

Ahora es cuando vuelvo a activar el test y trato de implementar una posible solución. Esta es una primera aproximación bastante simple:

```go
func CalculatorAdd(input string) int {
	if input == "" {
		return 0
	}

	if strings.HasPrefix(input, "//") {
		options, numbers, found := strings.Cut(input, "\n")
		if found {
			separator := string(options[2])
			normalizedInput := supportSeparator(numbers, separator)
			return calculate(normalizedInput)
		}
	}

	normalizedInput := supportSeparator(input, "\n")

	return calculate(normalizedInput)
}
```

Esta solución funciona. Introduzco algunos ejemplos más en el test para ver si es una solución suficientemente general, cambiando el separador y mezclando con los soportados por defecto.

```go
	t.Run("Support custom separators", func(t *testing.T) {
		tests := []struct {
			name  string
			input string
			want  int
		}{
			{name: "5+1", input: "//;\n5;1", want: 6},
			{name: "8+12+4", input: "//;\n8;12;4", want: 24},
			{name: "8+12+4", input: "//#\n8,12#4", want: 24},
		}

		for _, test := range tests {
			t.Run(test.name, func(t *testing.T) {
				expectedToBe(t, test.want, CalculatorAdd(test.input))
			})
		}
	})
```

De hecho, hay un caso que no he comprobado, que es usar el carácter "\n" como separador.

```go
	t.Run("Support custom separators", func(t *testing.T) {
		tests := []struct {
			name  string
			input string
			want  int
		}{
			{name: "5+1", input: "//;\n5;1", want: 6},
			{name: "8+12+4", input: "//;\n8;12;4", want: 24},
			{name: "8+12+4", input: "//#\n8,12#4", want: 24},
			{name: "8+12+4", input: "//#\n8\n12#4", want: 24},
		}

		for _, test := range tests {
			t.Run(test.name, func(t *testing.T) {
				expectedToBe(t, test.want, CalculatorAdd(test.input))
			})
		}
	})
```

Este test falla. Lo hace porque solo le damos soporte en caso de que no estemos personalizando el separador. Podemos resolver esto haciendo que se normalize el carácter "\n" dentro de la condición.

```go
func CalculatorAdd(input string) int {
	if input == "" {
		return 0
	}

	if strings.HasPrefix(input, "//") {
		options, numbers, found := strings.Cut(input, "\n")
		if found {
			separator := string(options[2])
			normalizedInput := supportSeparator(numbers, "\n")
			normalizedInput = supportSeparator(normalizedInput, separator)
			return calculate(normalizedInput)
		}
	}

	normalizedInput := supportSeparator(input, "\n")

	return calculate(normalizedInput)
}
```

Ahora que pasan todos los tests creo que es un buen momento para refactorizar. Como hemos visto, el código identifica dos posibles flujos de ejecución (con y sin separador personalizado), pero en ambos flujos hay pasos que se repiten y en el futuro tendría que estar pendiente de ello para no obtener resultados diferentes según vaya por uno u otro.

Esta versión es un poco mejor:

```go
func CalculatorAdd(input string) int {
	if input == "" {
		return 0
	}

	if strings.HasPrefix(input, "//") {
		options, numbers, found := strings.Cut(input, "\n")
		if found {
			separator := string(options[2])
			input = supportSeparator(numbers, separator)
		}
	}

	normalizedInput := supportSeparator(input, "\n")

	return calculate(normalizedInput)
}
```

Y extraemos el bloque bajo la condicional a una función:

```go
func CalculatorAdd(input string) int {
	if input == "" {
		return 0
	}

	if strings.HasPrefix(input, "//") {
		input = manageCustomSeparator(input)
	}

	normalizedInput := supportSeparator(input, "\n")

	return calculate(normalizedInput)
}

func manageCustomSeparator(input string) string {
	options, numbers, found := strings.Cut(input, "\n")
	if !found {
		return input
	}
	separator := string(options[2])
	
	return supportSeparator(numbers, separator)
}
```

## No permitir números negativos

El siquiente requisito consiste en no permitir números negativos y devolver un error en caso de encontrar algunos. Además, hay que indicar cuáles son esos números no válidos. Empezamos con un ejemplo que contiene solo un número negativo para establecer el comportamiento básico de una forma sencilla.

Devolver un error introduce un cambio en la interfaz, ya que ahora la función debe devolver dos valores: respuesta y error si hay. En principio es tan fácil como hacer esto:

```go
func CalculatorAdd(input string) (int, error) {
	if input == "" {
		return 0, nil
	}

	if strings.HasPrefix(input, "//") {
		input = manageCustomSeparator(input)
	}

	normalizedInput := supportSeparator(input, "\n")

	return calculate(normalizedInput), nil
}
```

Sin embargo, los tests se romperán al no gestionar el error devuelto. Una forma de abordarlo es ignorar ese error de forma explícita, como en este caso:

```go
t.Run("Defaults to 0", func(t *testing.T) {
    sum, _ := CalculatorAdd("")
    expectedToBe(t, 0, sum)
})
```

El test es peculiar en el sentido de que nos fijamos si se emiten errores. Además, uso `t.Fatalf` para forzar que el test se detenga en caso de que no se devuelva error. De otro modo, la siguiente comprobación producirá un error no relacionado.

```go
	t.Run("Disallow negatives", func(t *testing.T) {
		tests := []struct {
			name  string
			input string
			want  string
		}{
			{name: "-1", input: "-1", want: "negatives not allowed: -1"},
		}

		for _, test := range tests {
			t.Run(test.name, func(t *testing.T) {
				_, err = CalculatorAdd(test.input)
				if err == nil {
					t.Fatalf("Error expected, but not thrown")
				}
				
				if err.Error() != test.want {
					t.Errorf("Expected error message %s, got %s", test.want, err.Error())
				}
			})
		}
	})
```

¿Cómo implementamos esto? Podríamos empezar por una implementación fake. El lugar adecuado sería la función `calculate`, porque es la primera parte del código que sabe qué números está usando y puede averiguar si son negativos o no, y además podría recopilarlos para preparar el mensaje de error. Pero eso requiere algunos cambios grandes, como que `calculate` tiene que ser capaz de devolver un error.

Así que, comento el test para anularlo temporalmente y hago estos cambios primero:

```go
func CalculatorAdd(input string) (int, error) {
	if input == "" {
		return 0, nil
	}

	if strings.HasPrefix(input, "//") {
		input = manageCustomSeparator(input)
	}

	normalizedInput := supportSeparator(input, "\n")

	return calculate(normalizedInput)
}

func calculate(input string) (int, error) {
	first, second, found := strings.Cut(input, ",")
	if found {
		result, _ := calculate(second)
		return strToInt(first) + result, nil
	}

	return strToInt(input), nil
}
```

Los tests pasan, aunque igual la implementación resultante no es la mejor e introduce algunas dudas. En cualquier caso, volvemos a activar el test y nuestra implementación fake queda así, suficiente para que el test pase y nos ofrezca una primera indicación de cómo podríamos resolverla:

```go
func calculate(input string) (int, error) {
	first, second, found := strings.Cut(input, ",")
	if found {
		result, _ := calculate(second)
		return strToInt(first) + result, nil
	}

	if input == "-1" {
		return 0, errors.New("negatives not allowed: -1")
	}

	return strToInt(input), nil
}
```

En este caso el test con un solo número negativo fuerza que no entremos en la condicional. Haremos un segundo test para entrar en ella:

```go
	t.Run("Disallow negatives", func(t *testing.T) {
		tests := []struct {
			name  string
			input string
			want  string
		}{
			{name: "-1", input: "-1", want: "negatives not allowed: -1"},
			{name: "2+-1", input: "2,-1", want: "negatives not allowed: -1"},
		}

		for _, test := range tests {
			t.Run(test.name, func(t *testing.T) {
				_, err := CalculatorAdd(test.input)
				if err == nil {
					t.Fatalf("Error expected, but not thrown")
				}

				if err.Error() != test.want {
					t.Errorf("Expected error message %s, got %s", test.want, err.Error())
				}
			})
		}
	})
```

Esto nos obliga a ser capaces arrastrar el posible error.

```go
func calculate(input string) (int, error) {
	first, second, found := strings.Cut(input, ",")
	if found {
		sumRestOfNumbers, err := calculate(second)
		current := strToInt(first)

		if current == -1 {
			return 0, errors.New("negatives not allowed: -1")
		}

		return current + sumRestOfNumbers, err
	}

	current := strToInt(input)

	if current == -1 {
		return 0, errors.New("negatives not allowed: -1")
	}

	return current, nil
}
```

De nuevo estamos en una situación en la que hay código duplicado. Sin embargo, de momento quizá no nos interesa ocuparnos de esto antes de tener una forma más general. Necesitamos introducir algunos tests para triangular y generalizar el código. Por ejemplo, un test que introduzca un ejemplo de número negativo que no sea -1.


```go
	t.Run("Disallow negatives", func(t *testing.T) {
		tests := []struct {
			name  string
			input string
			want  string
		}{
			{name: "-1", input: "-1", want: "negatives not allowed: -1"},
			{name: "-1", input: "2,-1", want: "negatives not allowed: -1"},
			{name: "2+3+-5", input: "2,3,-5", want: "negatives not allowed: -5"},
		}

		for _, test := range tests {
			t.Run(test.name, func(t *testing.T) {
				_, err := CalculatorAdd(test.input)
				if err == nil {
					t.Fatalf("Error expected, but not thrown")
				}

				if err.Error() != test.want {
					t.Errorf("Expected error message %s, got %s", test.want, err.Error())
				}
			})
		}
	}
```

El código de producción que da soporte a esto podría ser así:

```go
func calculate(input string) (int, error) {
	first, second, found := strings.Cut(input, ",")
	if found {
		sumRestOfNumbers, err := calculate(second)
		current := strToInt(first)

		if current < 0 {
			return 0, fmt.Errorf("negatives not allowed: %d", current)
		}

		return current + sumRestOfNumbers, err
	}

	current := strToInt(input)

	if current < 0 {
		return 0, fmt.Errorf("negatives not allowed: %d", current)
	}

	return current, nil
}
```

Introduzco aquí un pequeño refactor para dar soporte a poder interceptar y hacer algo con el error que se arrastra en las diversas recursiones:

```go
func calculate(input string) (int, error) {
	first, second, found := strings.Cut(input, ",")
	if found {
		sumRestOfNumbers, err := calculate(second)
		current := strToInt(first)

		if current < 0 {
            if err != nil {
                return current + sumRestOfNumbers, err
            }

			return 0, fmt.Errorf("negatives not allowed: %d", current)
		}


		return current + sumRestOfNumbers, nil
	}

	current := strToInt(input)

	if current < 0 {
		if err != nil {
            return 0, err
        }
		
		return 0, fmt.Errorf("negatives not allowed: %d", current)
	}

	return current, nil
}
```

Esto me prepara un poco para el siguiente test, en el que incluyo más de un número negativo. Tengo que añadirlos todos en el mensaje de error.

```go
	t.Run("Disallow negatives", func(t *testing.T) {
		tests := []struct {
			name  string
			input string
			want  string
		}{
			{name: "-1", input: "-1", want: "negatives not allowed: -1"},
			{name: "-1", input: "2,-1", want: "negatives not allowed: -1"},
			{name: "2+3+-5", input: "2,3,-5", want: "negatives not allowed: -5"},
			{name: "-3+-5", input: "-3,-5", want: "negatives not allowed: -3,-5"},
		}

		for _, test := range tests {
			t.Run(test.name, func(t *testing.T) {
				_, err := CalculatorAdd(test.input)
				if err == nil {
					t.Fatalf("Error expected, but not thrown")
				}

				if err.Error() != test.want {
					t.Errorf("Expected error message %s, got %s", test.want, err.Error())
				}
			})
		}
	})
```

Y esta versión no pasa los tests porque devuelve la lista en orden inverso debido a la forma en que se hace la recursión. Por no hablar de algunos otros problemas. 

```go

func calculate(input string) (int, error) {
	first, second, found := strings.Cut(input, ",")
	if found {
		sumRestOfNumbers, err := calculate(second)
		current := strToInt(first)

		if current < 0 {
			if err != nil {
				return current + sumRestOfNumbers, errors.New(err.Error() + "," + strconv.Itoa(current))
			}

			return 0, fmt.Errorf("negatives not allowed: %d", current)
		}

		return current + sumRestOfNumbers, err
	}

	current := strToInt(input)

	if current < 0 {
		return 0, fmt.Errorf("negatives not allowed: %d", current)
	}

	return current, nil
}
```

Por tanto, anulo el último test y trataré de refactorizar esta solución para que encontrar un camino más prometedor. De hecho, los tests vuelven a pasar. Hay varias cosas que podría hacer aquí. Voy a intentar explicarlas.

Una posibilidad es coleccionar los números negativos que aparezcan. Para eso, tendría que poder llamar a `calculate` con esa colección y solo lanzar el error al final, pero eso rompería la interfaz actual, al tener que añadir un parámetro nuevo. En su lugar, voy a extraer el cuerpo de la función a una nueva, de modo que tenga libertad para cambiar lo que necesito y alterar la llamada recursiva sin afectar a la interfaz que exponemos con `calculate`.

Esto. El comportamiento de `calculate` no cambia, pero ahora puedo trabajar sin afectar al resto del código. 

```go
func calculate(input string) (int, error) {
	return performCalculation(input)
}

func performCalculation(input string) (int, error) {
	first, second, found := strings.Cut(input, ",")
	if found {
		sumRestOfNumbers, err := calculate(second)
		current := strToInt(first)

		if current < 0 {
			if err != nil {
				return current + sumRestOfNumbers, errors.New(err.Error() + "," + strconv.Itoa(current))
			}

			return 0, fmt.Errorf("negatives not allowed: %d", current)
		}

		return current + sumRestOfNumbers, err
	}

	current := strToInt(input)

	if current < 0 {
		return 0, fmt.Errorf("negatives not allowed: %d", current)
	}

	return current, nil
}
```

Lo que quiero conseguir es que `performCalculation` vaya arrastrando la colección de números negativos. De este modo, simplemente los recolecto. Si finalmente hay algún número negativo, `calculate` construye el error y lo lanza. Para hacer eso, primero voy a preparar algunas cosas:

```go
func calculate(input string) (int, error) {
	calculation, err := performCalculation(input)
	return calculation, err
}
```

Ahora necesito hacer un cambio más grande, pues necesito que performCalculation devuelva la colección de negativos y si contiene alguno `calculate` devolverá el error.

```go
func calculate(input string) (int, error) {
	calculation, _, negs := performCalculation(input, []int{})
	if len(negs) > 0 {
        var strs []string
        for _, neg := range negs {
            strs = append(strs, strconv.Itoa(neg))
        }
        listOfNegatives := strings.Join(strs, ",")
		return calculation, fmt.Errorf("negatives not allowed: %s", listOfNegatives)
	}
	return calculation, nil
}

func performCalculation(input string, negs []int) (int, error, []int) {
	first, second, found := strings.Cut(input, ",")
	if found {
		sumRestOfNumbers, _, negs := performCalculation(second, negs)
		current := strToInt(first)

		if current < 0 {
            negs = append([]int{current}, negs...)
		}

		return current + sumRestOfNumbers, nil, negs
	}

	current := strToInt(input)

	if current < 0 {
        negs = append([]int{current}, negs...)
	}

	return current, nil, negs
}
```

Volvemos a introducir el test y este pasa y vemos que los números negativos ahora están en el orden correcto. Veamos un par de detalles llamativos, antes de seguir:

Esta línea nos permite simular un `prepend`, o sea, añadir un elemento al inicio de un slice. No es la solución más eficiente, pero soluciona la papeleta. Básicamente, convertimos en slice el elemento añadido y desestructuramos el slice para hacer append de cada uno de sus elementos.

```go
negs = append([]int{current}, negs...)
```

Este bloque sirve para convertir el slice de enteros en slice de strings y juntarlos.

```go
var strs []string
for _, neg := range negs {
    strs = append(strs, strconv.Itoa(neg))
}
listOfNegatives := strings.Join(strs, ",")
```

Mantengo el ejemplo en este artículo porque es una situación frecuente. Pero, existe un posible refactor que es coleccionar esos elementos ya como `strings`, ahorrándonos el paso de conversión. 

```go
func calculate(input string) (int, error) {
	calculation, _, negs := performCalculation(input, []string{})
	if len(negs) > 0 {
		listOfNegatives := strings.Join(negs, ",")
		return calculation, fmt.Errorf("negatives not allowed: %s", listOfNegatives)
	}
	return calculation, nil
}

func performCalculation(input string, negs []string) (int, error, []string) {
	first, second, found := strings.Cut(input, ",")
	if found {
		sumRestOfNumbers, _, negs := performCalculation(second, negs)
		current := strToInt(first)

		if current < 0 {
			negs = append([]string{first}, negs...)
		}

		return current + sumRestOfNumbers, nil, negs
	}

	current := strToInt(input)

	if current < 0 {
		negs = append([]string{input}, negs...)
	}

	return current, nil, negs
}
```

En este punto ya no necesitamos que la función `performCalculation` siga devolviendo error, puesto que devolvemos siempre `nil`.

```go
func calculate(input string) (int, error) {
    calculation, negs := performCalculation(input, []string{})
    if len(negs) > 0 {
        listOfNegatives := strings.Join(negs, ",")
        return calculation, fmt.Errorf("negatives not allowed: %s", listOfNegatives)
    }
    return calculation, nil
}

func performCalculation(input string, negs []string) (int, []string) {
	first, second, found := strings.Cut(input, ",")
	if found {
		sumRestOfNumbers, negs := performCalculation(second, negs)

		current := strToInt(first)
		if current < 0 {
			negs = append([]string{first}, negs...)
		}

		return current + sumRestOfNumbers, negs
	}

	current := strToInt(input)
	if current < 0 {
		negs = append([]string{input}, negs...)
	}

	return current, negs
}
```

En este método nos queda una estructura con bastante duplicación y cierta mezcla de niveles de abstracción y detalle. Vamos a reducirla un poco:

```go
func performCalculation(input string, negs []string) (int, []string) {
	first, second, found := strings.Cut(input, ",")
	if found {
		sumRestOfNumbers, negs := performCalculation(second, negs)

		current, negs := prepend(first, negs)

		return current + sumRestOfNumbers, negs
	}

	current, negs := prepend(input, negs)
	
	return current, negs
}

func prepend(first string, negs []string) (int, []string) {
	current := strToInt(first)
	if current < 0 {
		negs = append([]string{first}, negs...)
	}
	return current, negs
}
```

Ahora invierto las condicionales para poner la rama corta al principio:

```go
func performCalculation(input string, negs []string) (int, []string) {
	first, second, found := strings.Cut(input, ",")
	if !found {
		current, negs := prepend(input, negs)

		return current, negs
	}
	sumRestOfNumbers, negatives := performCalculation(second, negs)
	current, negatives := prepend(first, negatives)
	return current + sumRestOfNumbers, negatives
}
```

De hecho, puede ser más corta, ya que prepend devu

```go
func performCalculation(input string, negs []string) (int, []string) {
	first, second, found := strings.Cut(input, ",")
	if !found {
		return prepend(input, negs)
	}
	
	sumRestOfNumbers, negatives := performCalculation(second, negs)
	current, negatives := prepend(first, negatives)
	return current + sumRestOfNumbers, negatives
}
```

Creo que no hay mucho más que podamos hacer por aquí.

## Ignorar los números mayores que 1000

Este nuevo requisito es similar al anterior en cuanto a que tenemos que verificar que los números cumplen una cierta condición para ser usados. La diferencia es que en lugar de generar un error simplemente los ignoramos. Como corresponde, empezamos describiendo el comportamiento deseado con un test.

Para hacer el test lo más simple posible, empiezo con un único número mayor que 1000, así que el resultado una vez excluido debería ser cero.

```go
	t.Run("Ignore greater than 1000", func(t *testing.T) {
		tests := []struct {
			name  string
			input string
			want  int
		}{
			{name: "Only greater than 1000", input: "1001", want: 0},
		}

		for _, test := range tests {
			t.Run(test.name, func(t *testing.T) {
				result, _ := CalculatorAdd(test.input)

				if result != test.want {
					expectedToBe(t, test.want, result)
				}
			})
		}
	})
```

Parece fácil implementar una solución, pero...

```go
func performCalculation(input string, negs []string) (int, []string) {
	first, second, found := strings.Cut(input, ",")
	if !found {
		current, negatives := prepend(input, negs)
		if current > 1000 {
			return 0, negatives
		}
		return current, negatives
	}

	sumRestOfNumbers, negatives := performCalculation(second, negs)
	current, negatives := prepend(first, negatives)
	
	return current + sumRestOfNumbers, negatives
}
```

Algo me dice que un refactor nos vendría bien. Intentemos otro ejemplo:

```go
	t.Run("Ignore greater than 1000", func(t *testing.T) {
		tests := []struct {
			name  string
			input string
			want  int
		}{
			{name: "Only greater than 1000", input: "1001", want: 0},
			{name: "Only greater than 1000", input: "1001,45", want: 45},
		}

		for _, test := range tests {
			t.Run(test.name, func(t *testing.T) {
				result, _ := CalculatorAdd(test.input)

				if result != test.want {
					expectedToBe(t, test.want, result)
				}
			})
		}
	})
```

Esto require añadir una línea parecida.

```go
func performCalculation(input string, negs []string) (int, []string) {
	first, second, found := strings.Cut(input, ",")
	if !found {
		current, negatives := prepend(input, negs)
		if current > 1000 {
			return 0, negatives
		}
		return current, negatives
	}

	sumRestOfNumbers, negatives := performCalculation(second, negs)
	current, negatives := prepend(first, negatives)

	if current > 1000 {
		return sumRestOfNumbers, negatives
	}

	return current + sumRestOfNumbers, negatives
}
```

¿Se aprecia el problema? El diseño del código ahora mismo hace que cada vez que tengamos que dar soporte a una nueva regla sobre los números válidos tengamos que repetirla en varios lugares. Esto ocurre porque estamos manteniendo varias responsabilidades en `performCalculation`, que se está encargando tanto del cálculo como de la validación de los números.

Pero siempre estamos a tiempo de hacer un refactor porque los tests están pasando. Tendría sentido reorganizar el código para ocuparse del saneamiento y validación de la lista de números y del cálculo de la suma. La cuestión es cómo hacerlo sin romper los tests o, en caso de hacerlo, que sea el menor tiempo posible.

La técnica que voy a usar consiste en introducir un cambio en paralelo. Voy a ir añadiendo el código necesario, pero sin eliminar el existente, de modo que los tests seguirán pasando hasta que pueda reemplazar el código anterior.

Mi planteamiento es sanear y validar los datos de entrada antes de llamar a `calculate`. De este modo, una vez que saneamiento y validación estén implementados, podré quitar esa lógica y toda la relacionada de `performCalculation`.
Sin embargo, hay una diferencia grande. En el nuevo diseño es importante hacer el split de la cadena de entrada como array de enteros antes de sanearla y calcular la suma. Así que voy a introducir "la maniobra Penélope": hacer y deshacer.

```go
func CalculatorAdd(input string) (int, error) {
	if input == "" {
		return 0, nil
	}

	if strings.HasPrefix(input, "//") {
		input = manageCustomSeparator(input)
	}

	normalizedInput := supportSeparator(input, "\n")

	numbers := strings.Split(normalizedInput, ",")

	normalizedInput = strings.Join(numbers, ",")

	return calculate(normalizedInput)
}
```

La idea debería estar clara: descomponemos el string de entrada y lo volvemos a montar para pasarlo a `calculate` sin romper su interfaz. En el medio introduciremos el saneamiento y la validación. Pero antes quizá sea mejor convertir entre el array de `string` y el de `enteros`.

Primer paso, lo aislamos en sus propias funciones. Los tipos todavía no son lo que deseamos, pero eso lo cambiaremos en el siguiente paso.

```go
func CalculatorAdd(input string) (int, error) {
	if input == "" {
		return 0, nil
	}

	if strings.HasPrefix(input, "//") {
		input = manageCustomSeparator(input)
	}

	normalizedInput := supportSeparator(input, "\n")

	numbers := toIntegers(normalizedInput)

	normalizedInput = fromIntegers(numbers)

	return calculate(normalizedInput)
}

func fromIntegers(numbers []string) string {
	normalizedInput := strings.Join(numbers, ",")
	return normalizedInput
}

func toIntegers(normalizedInput string) []string {
	numbers := strings.Split(normalizedInput, ",")
	return numbers
}
```

He aquí el cambio con conversión:

```go
func CalculatorAdd(input string) (int, error) {
	if input == "" {
		return 0, nil
	}

	if strings.HasPrefix(input, "//") {
		input = manageCustomSeparator(input)
	}

	normalizedInput := supportSeparator(input, "\n")

	numbers := toIntegers(normalizedInput)

	normalizedInput = fromIntegers(numbers)

	return calculate(normalizedInput)
}

func fromIntegers(integers []int) string {
	numbers := []string{}
	for _, number := range integers {
		numbers = append(numbers, strconv.Itoa(number))
	}

	normalizedInput := strings.Join(numbers, ",")

	return normalizedInput
}

func toIntegers(normalizedInput string) []int {
	numbers := strings.Split(normalizedInput, ",")
	integers := []int{}
	for _, number := range numbers {
		integers = append(integers, strToInt(number))
	}

	return integers
}
```

Así que ahora tenemos `numbers` como array de enters. Podríamos sanearlo, que para nuestro ejercicio consiste en ignorar los números mayores que 1000:

```go
func CalculatorAdd(input string) (int, error) {
	if input == "" {
		return 0, nil
	}

	if strings.HasPrefix(input, "//") {
		input = manageCustomSeparator(input)
	}

	normalizedInput := supportSeparator(input, "\n")

	numbers := toIntegers(normalizedInput)

	sanitized := []int{}
	for _, number := range numbers {
		if number > 1000 {
			continue
		}
		sanitized = append(sanitized, number)
	}

	normalizedInput = fromIntegers(sanitized)

	return calculate(normalizedInput)
}
```

Los tests siguen pasando. Ahora voy a quitar la lógica de saneamiento que tengo que `performCalculation` y ver si los tests siguen pasando.

```go
func performCalculation(input string, negs []string) (int, []string) {
	first, second, found := strings.Cut(input, ",")
	if !found {
		current, negatives := prepend(input, negs)
		return current, negatives
	}

	sumRestOfNumbers, negatives := performCalculation(second, negs)
	current, negatives := prepend(first, negatives)

	return current + sumRestOfNumbers, negatives
}
```

Y así es. Los test pasan y el código de saneamiento introducido funciona como esperaba. Lo voy a extraer a una función para mantener los niveles de abstracción.

```go
func CalculatorAdd(input string) (int, error) {
	if input == "" {
		return 0, nil
	}

	if strings.HasPrefix(input, "//") {
		input = manageCustomSeparator(input)
	}

	normalizedInput := supportSeparator(input, "\n")

	numbers := toIntegers(normalizedInput)

	sanitized := sanitize(numbers)

	normalizedInput = fromIntegers(sanitized)

	return calculate(normalizedInput)
}

func sanitize(numbers []int) []int {
	sanitized := []int{}
	for _, number := range numbers {
		if number > 1000 {
			continue
		}
		sanitized = append(sanitized, number)
	}
	return sanitized
}
```

Vamos ahora con la validación. En este caso debemos fallar si uno o más de los números proporcionados es negativo e indicar en el mensaje de error todas las entradas no válidas. Esa lógica la tenemos en `calculate` y `performCalculation`. Vamos a ver cómo moverla aplicando la misma idea. La validación la pondré antes que el saneamiento, ya que no merece la pena hacerlo si la lista que no es válida. 

```go
func CalculatorAdd(input string) (int, error) {
	if input == "" {
		return 0, nil
	}

	if strings.HasPrefix(input, "//") {
		input = manageCustomSeparator(input)
	}

	normalizedInput := supportSeparator(input, "\n")

	numbers := toIntegers(normalizedInput)

	err := validate(numbers)
	if err != nil {
		return 0, err
	}

	sanitized := sanitize(numbers)

	normalizedInput = fromIntegers(sanitized)

	return calculate(normalizedInput)
}

func validate(numbers []int) error {
	negatives := []string{}

	for _, number := range numbers {
		if number < 0 {
			negatives = append(negatives, strconv.Itoa(number))
		}
	}

	if len(negatives) > 0 {
		listOfNegatives := strings.Join(negatives, ",")
		return fmt.Errorf("negatives not allowed: %s", listOfNegatives)
	}
	return nil
}
```

Los tests pasan al añadir este código. Ahora probamos quitando el código de validación de `calculate`.

```go
func calculate(input string) (int, error) {
	calculation, _ := performCalculation(input, []string{})

	return calculation, nil
}
```

Esto nos muestra que `performCalculation` ya no encuentra negativos en el input que recibe. Por tanto, podemos trabajar en eliminar sus referencias. En realidad, puede ser mejor enfoque crear una implementación alternativa a `calculate`, ya que tenemos la lista de enteros saneada y lista para usar. Añadimos el cálculo y lo devolvemos en lugar de `calculate`.

```go
func CalculatorAdd(input string) (int, error) {
	if input == "" {
		return 0, nil
	}

	if strings.HasPrefix(input, "//") {
		input = manageCustomSeparator(input)
	}

	normalizedInput := supportSeparator(input, "\n")

	numbers := toIntegers(normalizedInput)

	err := validate(numbers)
	if err != nil {
		return 0, err
	}

	sanitized := sanitize(numbers)
	
	result := 0
	for _, number := range sanitized {
		result = result + number
	}
	

	normalizedInput = fromIntegers(sanitized)

	_, _ = calculate(normalizedInput)
	
	return result, nil
}
```

Y con esto siguen pasando los tests. Ahora podemos eliminar estas llamadas y las funciones que ya no se usan. De paso, extraemos la suma a su propia función:

```go
func CalculatorAdd(input string) (int, error) {
	if input == "" {
		return 0, nil
	}

	if strings.HasPrefix(input, "//") {
		input = manageCustomSeparator(input)
	}

	normalizedInput := supportSeparator(input, "\n")

	numbers := toIntegers(normalizedInput)

	err := validate(numbers)
	if err != nil {
		return 0, err
	}

	sanitized := sanitize(numbers)

	return sum(sanitized), nil
}

func sum(sanitized []int) int {
	result := 0
	for _, number := range sanitized {
		result += number
	}
	return result
}

func validate(numbers []int) error {
	negatives := []string{}

	for _, number := range numbers {
		if number < 0 {
			negatives = append(negatives, strconv.Itoa(number))
		}
	}

	if len(negatives) > 0 {
		listOfNegatives := strings.Join(negatives, ",")
		return fmt.Errorf("negatives not allowed: %s", listOfNegatives)
	}
	return nil
}

func sanitize(numbers []int) []int {
	sanitized := []int{}
	for _, number := range numbers {
		if number > 1000 {
			continue
		}
		sanitized = append(sanitized, number)
	}
	return sanitized
}

func toIntegers(normalizedInput string) []int {
	numbers := strings.Split(normalizedInput, ",")
	integers := []int{}
	for _, number := range numbers {
		integers = append(integers, strToInt(number))
	}

	return integers
}

func manageCustomSeparator(input string) string {
	options, numbers, found := strings.Cut(input, "\n")
	if !found {
		return input
	}
	separator := string(options[2])

	return supportSeparator(numbers, separator)
}

func supportSeparator(input string, separator string) string {
	replaces := strings.ReplaceAll(input, separator, ",")
	return replaces
}

func strToInt(input string) int {
	result, err := strconv.Atoi(input)
	if err != nil {
		log.Println(err.Error())
	}
	return result
}
```

## Separadores de cualquier longitud

Este requisito supone introducir nuevas reglas para identificar el separador personalizado. En este caso, que tenga cualquier longitud y que venga entre corchetes.

Empecemos con un test:

```go
	t.Run("Complex custom separator", func(t *testing.T) {
		tests := []struct {
			name  string
			input string
			want  int
		}{
			{name: "Larger than one character", input: "//[***]\\n1***2***3", want: 6},
		}

		for _, test := range tests {
			t.Run(test.name, func(t *testing.T) {
				result, _ := CalculatorAdd(test.input)

				if result != test.want {
					expectedToBe(t, test.want, result)
				}
			})
		}
	})
```

El test falla, indicando que esta característica no está soportada. Así que vamos a ver donde podemos tocar, que es aquí:

```go
func manageCustomSeparator(input string) string {
	options, numbers, found := strings.Cut(input, "\n")
	if !found {
		return input
	}
	separator := string(options[2])

	return supportSeparator(numbers, separator)
}
```

De momento, lo único que hacemos es tomar el carácter que aparece en la posición 2 de las opciones, lo que limita el separador a un único carácter. Sin embargo, quizá podamos ver las cosas desde otro punto de vista. Actualmente, cuando normalizamos los separadores lo que hacemos es convertir todos en comas.

¿Y si simplemente reemplazamos todo lo que no sean números (o guiones) por comas? No importaría el separador, ni su longitud. Y todo sería más simple.

Esto lo hacemos mejor en la función principal mediante expresión regular, reemplazando todas las apariciones por comas:

```go
func CalculatorAdd(input string) (int, error) {
	if input == "" {
		return 0, nil
	}

	if strings.HasPrefix(input, "//") {
		input = manageCustomSeparator(input)

		expression, _ := regexp.Compile("[^\\d-]+")
		input = expression.ReplaceAllString(input, ",")
	}

	normalizedInput := supportSeparator(input, "\n")

	numbers := toIntegers(normalizedInput)

	err := validate(numbers)
	if err != nil {
		return 0, err
	}

	sanitized := sanitize(numbers)

	return sum(sanitized), nil
}
```

Esto hace que podamos eliminar parte del código de `manageCustomSeparator`, ya que solo nos interesa que elimine la parte de opciones y nos deje únicamente la lista de números. Por tanto, voy a quitar lo que no necesito.

```go
func manageCustomSeparator(input string) string {
	_, numbers, found := strings.Cut(input, "\n")
	if !found {
		return input
	}
	return numbers
}
```

Además, podría eliminar la necesidad de usar `supportSeparator`, dado que simplemente tengo que normalizar el string input.

```go
func CalculatorAdd(input string) (int, error) {
	if input == "" {
		return 0, nil
	}

	if strings.HasPrefix(input, "//") {
		input = manageCustomSeparator(input)
	}

	expression, _ := regexp.Compile("[^\\d-]+")
	normalizedInput := expression.ReplaceAllString(input, ",")

	numbers := toIntegers(normalizedInput)

	err := validate(numbers)
	if err != nil {
		return 0, err
	}

	sanitized := sanitize(numbers)

	return sum(sanitized), nil
}
```

Pensándolo bien, puedo mover toda la lógica de normalización a una función.

```go
func CalculatorAdd(input string) (int, error) {
	if input == "" {
		return 0, nil
	}

	normalizedInput := normalize(input)
	numbers := toIntegers(normalizedInput)

	err := validate(numbers)
	if err != nil {
		return 0, err
	}

	sanitized := sanitize(numbers)

	return sum(sanitized), nil
}

func normalize(input string) string {
	if strings.HasPrefix(input, "//") {
		input = manageCustomSeparator(input)
	}

	expression, _ := regexp.Compile("[^\\d-]+")
	return expression.ReplaceAllString(input, ",")
}
```

Una cosa que estoy logrando es que casi todas las funciones son pequeñas y con un propósito claro.

## Separadores múltiples de un único carácter

Tenemos un nuevo requisito, así que introduzco un test. Creo que el test pasará.

```go
	t.Run("Complex custom separator", func(t *testing.T) {
		tests := []struct {
			name  string
			input string
			want  int
		}{
			{name: "Larger than one character", input: "//[***]\\n1***2***3", want: 6},
			{name: "Multiple one character", input: "//[*][%]\\n1*2%3", want: 6},
		}

		for _, test := range tests {
			t.Run(test.name, func(t *testing.T) {
				result, _ := CalculatorAdd(test.input)

				if result != test.want {
					expectedToBe(t, test.want, result)
				}
			})
		}
	})
```

Y es que pasa, efectivamente. En realidad, no necesitamos preocuparnos nada de los separadores porque al no necesitarlos para nada, podemos eliminarlos y listo.

Como el test ha pasado sin cambios, realmente no tenemos que hacer nada. Vayamos con el último requisito:

## Separadores múltiples de diferentes longitudes

Mi apuesta es que no será necesario implementar nada. Pero la mejor forma de saberlo es introducir un test:

```go
	t.Run("Complex custom separator", func(t *testing.T) {
		tests := []struct {
			name  string
			input string
			want  int
		}{
			{name: "Larger than one character", input: "//[***]\\n1***2***3", want: 6},
			{name: "Multiple one character", input: "//[*][%]\\n1*2%3", want: 6},
			{name: "Multiple separators of different lengths", input: "//[foo][bar]\n1foo2bar3", want: 6},
		}

		for _, test := range tests {
			t.Run(test.name, func(t *testing.T) {
				result, _ := CalculatorAdd(test.input)

				if result != test.want {
					expectedToBe(t, test.want, result)
				}
			})
		}
	})
}
```

Y el test pasa, como esperábamos.

## Conclusiones

Este es el código completo. Quizá se podría refactorizar un poco:

```go
package string_calculator

import (
	"fmt"
	"log"
	"regexp"
	"strconv"
	"strings"
)

func CalculatorAdd(input string) (int, error) {
	if input == "" {
		return 0, nil
	}

	normalizedInput := normalize(input)
	numbers := toIntegers(normalizedInput)

	err := validate(numbers)
	if err != nil {
		return 0, err
	}

	sanitized := sanitize(numbers)

	return sum(sanitized), nil
}

func normalize(input string) string {
	if strings.HasPrefix(input, "//") {
		input = manageCustomSeparator(input)
	}

	expression, _ := regexp.Compile("[^\\d-]+")
	return expression.ReplaceAllString(input, ",")
}

func sum(sanitized []int) int {
	result := 0
	for _, number := range sanitized {
		result += number
	}
	return result
}

func validate(numbers []int) error {
	negatives := []string{}

	for _, number := range numbers {
		if number < 0 {
			negatives = append(negatives, strconv.Itoa(number))
		}
	}

	if len(negatives) > 0 {
		listOfNegatives := strings.Join(negatives, ",")
		return fmt.Errorf("negatives not allowed: %s", listOfNegatives)
	}
	return nil
}

func sanitize(numbers []int) []int {
	sanitized := []int{}
	for _, number := range numbers {
		if number > 1000 {
			continue
		}
		sanitized = append(sanitized, number)
	}
	return sanitized
}

func toIntegers(normalizedInput string) []int {
	numbers := strings.Split(normalizedInput, ",")
	integers := []int{}
	for _, number := range numbers {
		integers = append(integers, strToInt(number))
	}

	return integers
}

func manageCustomSeparator(input string) string {
	_, numbers, found := strings.Cut(input, "\n")
	if !found {
		return input
	}
	return numbers
}

func strToInt(input string) int {
	result, err := strconv.Atoi(input)
	if err != nil {
		log.Println(err.Error())
	}
	return result
}
```

Lo más interesante de este ejercicio ha sido introducir técnicas de trabajo con strings, slices y también expresiones regulares en Go.

Una cosa que puede llamar la atención es que Go no incluye algunas características del estilo funcional que están presentes en otros lenguajes, como `map`, `filter` o `reduce`. La verdad es que son fáciles de implementar y podría ser un buen ejercicio refactorizar este código para incluirlas. Es algo que quizá haga en el futuro.