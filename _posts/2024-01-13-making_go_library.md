---
layout: post
title: Haciendo un spike para crear una librería de Go
categories: articles
tags: golang good-practices
---

He iniciado un side project para hacer una librería de snapshot testing en Go.

Siempre se dice que no hay mejor forma de aprender un lenguaje que desarrollar un proyecto. La verdad es que yo no suelo tener facilidad para generar buenas ideas de proyectos, pero dado que tengo algunos problemas de trabajo que me gustaría resolver, he visto una oportunidad.

Existen varias librerías de snapshot testing en Go, como Approvals o Go Snap. Sin embargo, tengo algunos problemillas con Approvals, que es la que uso habitualmente. Por otro lado, en la comunidad Go hay temas que no parecen tener mucho recorrido, por lo que es frecuente encontrarse librerías semi-abandonadas y me cuesta decidirme a usarlas.

Por otro lado, pienso que con este proyecto puedo aprender algunas técnicas interesantes:

* Crear una librería que se pueda distribuir en Go.
* Manejo de variables globales para mantener estado.
* Uso de interfaces.

## Qué voy a desarrollar

Se trata de una librería para testing basado en snapshots. Esta modalidad de test tiene varios usos:

* Testear código que genera archivos u objetos complejos.
* Generar cobertura rápida de tests en código legacy o que no conocemos bien antes de empezar a refactorizarlo.
* Implementar approval testing, que se basa en revisar outputs complejos generados por una unidad de código y aprobarlos conforme a las reglas de negocio para usar esos mismos outputs como criterio de test.

En el snapshot testing, ejecutamos el test y guardamos una copia o snapshot del output de la unidad bajo test. En las siguientes ejecuciones del test, usaremos esa copia guardada como criterio para comparar contra el output actual del test. Si hemos introducido cambios en el código que no generan cambios en el comportamiento, lo que es un refactor, el test seguirá pasando. En cambio, si nuestros cambios alteran el comportamiento, el test dejará de pasar.

Dependiendo de nuestra intención (refactorizar o crear nuevas prestaciones), el resultado del test nos permitirá saber si nuestra intervención es la adecuada:

* En el caso de refactoring, nos interesa que los tests sigan pasando, lo que indica que no hemos alterado el comportamiento de la unidad de software.
* En el caso de nuevas prestaciones, podremos verificar mirando el snapshot si el nuevo comportamiento queda reflejado en el snapshot y lo podremos utilizar como criterio de ahora en adelante.

## Primer paso: spike

Mi primer paso fue iniciar un Spike. En muchos sitios el Spike se considera una especie de proceso de búsqueda de información para clarificar los requisitos de un trabajo o pensar posibles formas de llevarlo a cabo. Sin embargo, en Extreme Programming, un spike suele consistir en programar una posible solución al problema o pruebas de conceptos para identificar sus necesidades técnicas antes de abordar el desarrollo real.

De este modo, lo normal es que, una vez hemos entendido cómo hacerlo y el tipo de problemas a los que vamos a enfrentarnos, tiremos ese código y empecemos de cero, poniendo en juego nuestras mejores prácticas.

Por esto, el spike suele realizarse sin tests, creando pruebas de concepto para averiguar si una posible solución es viable y aprender cómo programarla. En esta parte adquirimos conocimiento técnico que será importante para implementar el producto definitivo.

No es una librería complicada. Básicamente, la librería tiene que recibir el output de la unidad bajo test, que puede ser de cualquier tipo, y, en caso de que no exista, generar un snapshot en un archivo. Si el snapshot existe, lo lee y compara con el output recibido. Si no coinciden, el test falla. Si coinciden, el test pasa.

Intentaré explicar algunos de los problemas que necesitaba resolver:

### Crear una librería que se pueda distribuir

Go está pensado para organizar el código en librerías y poder reutilizarlas en diferentes proyectos. De hecho, la instalación del lenguaje contempla una estructura en la carpeta `go` orientada a eso. En realidad, no hay que preparar muchas cosas, aparte de preparar el código como un _module_ de Go.

* El proyecto tiene un repositorio público (git)
* El nombre de la librería es el mismo nombre del proyecto
* En lugar de `main.go` tenemos un archivo con el nombre de la librería
* Tenemos un archivo `go.mod` para fijar las dependencias del código

### Gestión de estado de la librería

Para este proyecto es necesario mantener alguna configuración de forma más o menos global, de modo que pueda conservarse entre distintos tests. Necesitamos un singleton, aunque no lo veamos como tal, que mantenga la configuración y que pueda guardar algunos datos temporales.

Esto se puede resolver creando una variable global y exportable en el archivo principal de la librería, así como funciones que nos dan acceso a ella y nos permiten modificarla. Por ejemplo, para definir un nombre del snapshot, o escoger una forma de normalizar su contenido.

### Interacción con el sistema de archivos

El snapshot se guarda en el sistema de archivos. Sin embargo, a la hora de testear la propia librería sería interesante poder evitar su uso, a fin de inspeccionar detalles como si el snapshot se genera con el nombre adecuado en el lugar previsto.

En este caso, podemos abstraer el sistema de archivos mediante un sistema de archivos virtual, algo que podemos hacer mediante interfaces y adaptadores.

### Trabajo con múltiples tipos

Go es un lenguaje de tipado estricto, pero como es lógico, necesitamos poder hacer snapshots con cualquier tipo de datos. Para ello, he pensado dos recursos:

* Aceptar tipos `any`, es decir, las funciones de verificación podrán aceptar cualquier tipo definido en Go.
* Normalizar a un tipo de dato, para lo que creo que usaré `string`, lo que facilita tanto compararlos, como examinarlos.

### Normalización

Los diferentes tipos de output se deberían normalizar para conseguir una versión comparable, sometiéndolos a un proceso que elimine algunas diferencias triviales, como podrían ser espacios o retornos en el final de los archivos. 

En principio, la forma más sencilla que se me ha ocurrido es serializarlos como JSON y hacer una limpieza básica del resultado con funciones de Trim. En muchos casos, generar JSON es bastante trivial en Go: los tipos básicos implementan serialización JSON. Los objetos definidos por las aplicaciones pueden serializarse implementando las interfaces `JsonMarshal` y `JsonUnmarshal`.

Aparte de eso, para otros casos puede ser necesario permitir introducir normalizaciones personalizadas por test, por lo que necesitamos incluir un mecanismo que le de soporte. 

En realidad la normalización no es más que una función de transformación que convierte el output de la unidad bajo test en una serialización que se puede guardar fácilmente en un archivo, recuperar y comparar con otro output igualmente normalizado.

### Mostrar las diferencias

Existen varias librerías en Go para mostrar diferencias entre archivos que he explorado durante el spike. Una cosa que está clara es la necesidad y viabilidad de permitir usar reporters personalizados para mostrarlas cuando falla el test.

## Diseño del API de la librería

Otro aspecto interesante de la realización de un Spike es desarrollar el diseño de la API de la librería.

Nuestra librería se va a llamar `golden`, en honor a la técnica Golden Master. Y nos gustaría poder usarla más o menos así:

```go
func TestSomething(t *testing.T) {
    output := SubjectUnderTest(parameter)

    golden.Verify(t, output)
}
```
El código anterior debería hacer lo siguiente:

* Verificar si existe un snapshot para este test, con el path `__snapshots/TestSomething.snap` en el directorio donde se encuentra el test.
* Si no existe, generarlo con el contenido de output normalizado. Y dar el test por pasado.
* Si existe el snapshot, cargarlo.
* Compararlo con el output recibido. Si son iguales, da el test por pasado.
* Si son distintos, hace fallar el test y muestra las diferencias.

Una funcionalidad que me gustaría tener es la capacidad de poner un nombre al snapshot. Algo que se podría conseguir así:

```go
func TestSomething(t *testing.T) {
    output := SubjectUnderTest(parameter)

    golden.UseSnapshot("my_snapshot").Verify(t, output)
}
```

Este código hace lo mismo que el anterior, salvo que el path resultante sería `__snapshots/my_snapshot.snap`.

También, personalizar la carpeta donde se guardan los snapshots, algo que en ocasiones me podría interesar para separar distintos tipos.

```go
func TestSomething(t *testing.T) {
    output := SubjectUnderTest(parameter)

    golden.InFolder("__other").Verify(t, output)
}
```

En este caso, el path en el que se genera el snapshot sería: `__other/TestSomething.snap`

Como se puede ver, tengo preferencia por un tipo de interfaz fluída, similar a la del patrón Builder. El propósito es indicar una unidad de acción.

Para conseguir esto en Go, el archivo `golden.go` exporta una variable que llamamos G.

```go
// golden.go

var G = NewGolden(...)
```

El tipo de esta variable es:

```go
type Golden struct{
	//...
}
```

Al que se asocian métodos como `InFolder`, `UseSnapshot`, `Verify`... y otros.

```go
func (g Golden) Verify(t *testing.T, subject any) {
	//...
}

```

A su vez, `golden.go` expone funciones que envuelven llamadas a sus métodos homónimos en G:

```go
func Verify(t *testing.T, subject any) {
	G.Verify(t, subject)
}
```

De este modo, se consigue que desde el punto de vista del consumidor, no sea necesario inicializar un objeto o distinguir si está usando una función.

Por ejemplo, aquí se está invocando la función `Verify`, que como hemos visto invoca `G.Verify`.

```go
func TestSomething(t *testing.T) {
    output := SubjectUnderTest(parameter)

    golden.Verify(t, output)
}
```

En el caso de las funciones de configuración se devuelve la variable global:

```go
func (g Golden) InFolder(folder string) Golden {
	g.folder = folder
	return g
}

func InFolder(folder string) Golden {
    return G.InFolder(folder)
}
```

Lo que permite escribir código como este. En este caso, `InFolder` ejecuta la función, mientras que `Verify` se invoca sobre el objeto contenido en la variable global G. El efecto obtenido es que tenemos una especie de lenguaje de generación de snapshots. O si lo prefieres: un domain specific language para snapshot testing.

```go
func TestSomething(t *testing.T) {
    output := SubjectUnderTest(parameter)

    golden.InFolder("__other").Verify(t, output)
}
```

## Funcionalidades que espero implementar

* Snapshot testing básico: se genera un snapshot que se aprueba automáticamente, de modo que la primera ejecución del test sea exitosa
* Personalización la carpeta de snapshots
* Personalización del nombre de cada snapshot
* Usar normalizadores personalizados
* Usar reporters personalizados de diferencias
* Gestionar valores no deterministas en el output
* Approval testing: en lugar de aceptar automáticamente un snapshot se deja fallando el test hasta aprobar el output generado
* Golden Master o test combinatorio: permitir generar múltiples tests combinando todos los valores posibles para cada parámetro requerido por la unidad bajo test

## Conclusiones

Hacer un spike de código antes de abordar un desarrollo puede ser una práctica muy buena para entender los problemas que nos vamos a encontrar y poner en práctica distintas soluciones. De este modo, podemos tener una idea clara de cómo proceder, qué vamos a necesitar, etc.

Un spike puede tomar la forma de un prototipo, ser una prueba de concepto, o simplemente algo de código para probar una hipótesis de lo que pensamos que es necesario hacer.

Una vez que hemos logrado el conocimiento que buscábamos, tiramos el spike y empezamos el desarrollo.
