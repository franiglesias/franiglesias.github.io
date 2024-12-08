---
layout: post
title: Mis problemas gestionando errores en Golang
categories: articles
tags: golang good-practices
---

El manejo de errores en Golang es uno de los puntos que más me cuesta de este lenguaje. Y, a juzgar por comentarios y artículos, es uno de los puntos que más le cuesta a casi todo el mundo. Y eso que es, aparentemente, sencillo.

Si hay un elemento característico de Golang es la idea de que una función o método en el que ocurre un error, debe devolver el error y este debe manejarse inmediatamente. Golang no hace uso de excepciones que cortan el flujo de ejecución, sino que obliga a tomar una decisión explícita sobre los errores. Incluso si esa decisión es ignorar el error.

## Gestión de errores, _fail fast mode_

Golang hace suyo el principio _Fail Fast_, que dice que un módulo que falla debe notificar el error al módulo llamante, el cual decidirá qué hacer con ese error. Las opciones son cuatro, hasta donde puedo imaginar y siempre teniendo en cuenta las circunstancias:

* **Ignorar el error**: simplemente no hacer nada si el error, por la razón que sea, es irrelevante. Por ejemplo, podría ser algún tipo de _warning_ que no necesita o no puede ser atendido por el código.
* **Reintentar la llamada**: ante ciertos errores, el módulo llamante podría reintentar la llamada. Puede que el error sea temporal y, por tanto, se puede reintentar la llamada transcurrido cierto tiempo para ver si se ha solucionado. También podría usarse algún tipo de recálculo de parámetros para repetir la llamada.
* **Fallback**: a veces, es posible tener una alternativa preparada en caso de error. Por ejemplo, devolver un valor por defecto o intentar una llamada alternativa.
* **Pasar el error al módulo superior**: si el módulo llamante no tiene suficiente contexto para decidir sobre el error, la alternativa es simplemente pasarlo al módulo que ha llamado a este. Habría dos posibilidades:
  * Pasar el error tal cual se ha recibido. Esto no siempre es una buena opción pues significa que el módulo superior que atienda el error tendría que saber mucho acerca de los detalles de implementación.
  * Pasar un nuevo error adecuado al nivel de abstracción del módulo que lo está gestionando, somo si fuese un error en el propio módulo. De esta manera, el módulo que finalmente maneje el error no tiene que conocer los detalles de implementación, sino el contrato que tiene con el módulo al que había llamado inicialmente.

En lenguajes que usan excepciones, lo habitual es utilizar la estructura `try/catch` en el módulo llamante para gestionar los errores emitidos por los módulos llamados. Es posible aplicar todas las tácticas indicadas antes y basta con no incluirlo para ignorar todos los errores y dejarlos subir por la pila de llamadas.

Como decíamos, en Golang hay que gestionar los errores de forma explícita, así que incluso ignorarlos es una decisión que se debe tomar de forma consciente en cada caso. Pero aunque esto en general es un buen patrón, introduce algunos efectos sobre la legibilidad, ya que genera ruido y resulta confuso para quienes nos aproximamos a Go desde otros lenguajes.

Pero antes de esto, nos conviene entender qué es un error en Golang.

## Errores en Golang

Básicamente, un error en Golang es un objeto que implementa la interfaz `error`.

```go
type error interface {
	Error() string
}
```

La librería estándar ofrece un paquete `errors` con una implementación propia, pero no tienes por qué usarla. Puedes crear tu propio tipo de errores. Lo mínimo que tienes que hacer es implementar un método `Error()` que devuelva un string. Esto te permite añadir más información relevante para tu problema específico, incluyendo todo el contexto que sea necesario. Es similar a implementar excepciones personalizadas en otros lenguajes. Hablaremos de esto más adelante.

### Emitiendo errores

Cuando se produce un error, se devuelve explícitamente en el _return_. Por convención, el error se devuelve como último elemento en caso de _return_ múltiple. El ejemplo que sigue es un poco infumable[^ejemplo], pero servirá para entenderlo bien:

[^ejemplo]; Igual debería cambiarlo, porque se usa en varios artículos que he consultado después.

```go
func intDivide(dividend, divisor int) (int, error) {
  if divisor == 0 {
    return 0, errors.New("Cannot divide by zero")
  }
  
  result := dividend / divisor
  
  return result, nil
}
```

Veamos. La signatura de la función nos dice que retornará dos valores: uno es un `int`, con el resultado, y otro es un `error`, para el caso de que algo salga mal.

La primera línea de la función verifica que no estemos intentando dividir por cero. En ese caso se devuelve un valor arbitrario y un error indicando que la operación no es posible. Para crear el objeto error, usamos la librería `errors`, la cual nos ofrece una función constructora con la instanciar un objeto error con un mensaje explicativo.

```go
errors.New("Cannot divide by zero")
```

En el caso de que no haya ningún problema, se devuelve el resultado calculado y `nil` para indicar que no hay ningún error.

La forma más correcta de lanzar los errores es hacerlo justamente cuando se producen. En cuanto detectamos la condición problemática, debemos hacer el _return_ con el error, explicando qué ha pasado. No creo que haya muchos casos de uso en los que tenga sentido mantener el error hasta un momento posterior.

Existe una alternativa que puede resultar un poco sorprendente, ya que forma parte del paquete `fmt` que, en principio, no parece tener mucho que ver. Pero, en último término, en Golang un error no es más que un `string` envuelto en un tipo específico. En este caso, usamos `fmt.Errorf()` que nos creará el error a partir de un string formateado. De este modo, puedes añadir fácilmente contexto al mensaje.

```go
func (z ZipArchive) locateFileInArchive(desiredFile string, reader *zip.Reader) (*zip.File, error) {
	for _, file := range reader.File {
		if file.Name == desiredFile {
			return file, nil
		}
	}

	return nil, fmt.Errorf("file %s not found in archive", desiredFile)
}
```

Por supuesto, en proyectos medianamente complejos querrás poder añadir contexto de una forma más estructurada. En ese caso lo mejor es definir tus propios tipos de error.

### Gestionando errores

Como hemos podido ver, lanzar errores no es especialmente difícil, así que veamos la gestión. De primeras, tampoco es que sea muy complicada. Dado que Golang nos obliga a hacer algo con lo que retornan las funciones, tenemos que tomar decisiones inmediatamente cuando se incluyen los errores.

Por ejemplo, supongamos que queremos ignorar cualquier error que pueda venir. Nos basta con nombrar la variable con el _underscore_ y listo. 

```go
relation, _ := intDivide(aNumber, anotherNumber)
```

No es una práctica recomendable, pero en ciertos contextos podría ser admisible. Por ejemplo, en testing. En este caso tenemos una función de ayuda que permite poblar un archivo con datos para tests. Aunque `file.Write(data)` podría fallar, en la situación de test podemos tener bastante seguridad de que eso no va a ocurrir, porque sabemos qué datos se van a escribir, así que ignorar el error no va a suponer un problema y simplifica tanto la escritura del test como su lectura. Pero esto en código de producción no deberíamos hacerlo, ya que nada nos garantizaría que la función se use con datos correctos.

```go
func populateFileWithExampleData(fs afero.Fs, pathToFile string, data [][]string) {
	file := CSVFile{
		Fs:   fs,
		Path: pathToFile,
	}

	_ = file.Write(data)
}
```

Pero normalmente no querremos esto, así que chequeamos si se ha devuelto algún error antes de proseguir.

```go
relation, err := intDivide(aNumber, anotherNumber)

if err != nil {
	// do something with the error
}
```

¿Qué podemos hacer para gestionar el error? Obviamente, todo depende del contexto y no hay una solución única. Como hemos visto más arriba tenemos diversas opciones y la más adecuada dependerá del caso concreto y de los requisitos que se hayan definido.

Veamos algunos patrones:

#### Pasar el error

Suponiendo que el error se "captura" en un módulo que ha sido llamado por otro de orden superior, una posibilidad es sencillamente retransmitir el error tal cual.

```go
relation, err := intDivide(aNumber, anotherNumber)

if err != nil {
	return 0, err
}
```

Hay dos consideraciones importantes que hace aquí: 

* **¿Qué devolver como resultado?** Se supone que el resultado que devuelva esta función será indeterminado porque no se ha podido calcular. Generalmente, no habrá un valor que tenga sentido en caso de error e, idealmente, no se intentará utilizar, sino que el error devuelto será capturado y el módulo superior actuará en consecuencia. En algunos casos se podrá devolver `nil`, cuando hayamos definido que el tipo de la respuesta sea un puntero. En otros casos, un valor como cero o un struct vacío serán adecuados.
* **¿Es buena práctica?** En general, no. En sistemas muy simples es posible que no tenga mucha importancia, pero en general cada nivel de abstracción debería darnos distintos tipos de errores, relevantes únicamente para el nivel de abstracción inmediatamente superior. De todo modo, los niveles superiores tendrían que estar al tanto de muchos detalles técnicos de las implementaciones.

Intentaré desarrollar esto último con más detalle.

El siguiente fragmento de código (está en WIP) intenta instanciar un `Reader` de archivos zip. El proceso tiene tres pasos, los cuales pueden apreciarse en el código:

* Obtener información del archivo en su sistema de archivos dado su _path_. Esto puede dar error si no se encuentra porque el path no apunta a un archivo.
* Abrir el archivo _físico_. Aquí puede haber un error si por algún motivo no es legible.
* Obtener el Reader, que puede fallar si el archivo no es un zip correctamente formado.

Veamos una primera versión:

```go
type ZipArchive struct {
    Fs   afero.Fs
    Path string
    Tmp  string
}

func (z ZipArchive) getZipReader() (*zip.Reader, error) {
	fileInfo, err := z.Fs.Stat(z.Path)
	if err != nil {
		return nil, err
	}
	
	file, err := z.Fs.OpenFile(z.Path, os.O_RDONLY, os.FileMode(0644))
	if err != nil {
        return nil, err
	}

	reader, err := zip.NewReader(file, fileInfo.Size())
	if err != nil {
		return nil, err
	}
	
	return reader, nil
}
```

Esta parece una buena solución, pero en realidad lo único que hacemos es retrasar la gestión del error y pasarle errores de bajo nivel a un módulo cuyo único interés es obtener un `Reader` de archivos _zip_, el cual puede venir o no a partir de un archivo en un sistema de archivos. En otras palabras, los detalles precisos de por qué no se pudo crear el `Reader` no interesan al consumidor de este método, solo le interesa que no se ha podido obtener una instancia.

De hecho, aquí podemos ver un posible consumidor y está claro que para él no tiene mayor interés saber el detalle de por qué ha fallado, sino que le bastaría con recibir un único tipo de error que indique que no tenemos un `Reader`.

```go
func (z ZipArchive) ExtractFile(desiredFile string) error {
	reader, err := z.getZipReader()

	if err != nil {
		// do something if we cannot get the Reader
	}

	// do things with the reader

	return nil
}
```

Esto nos lleva a la siguiente opción.

### Relanzar el error, adaptado al nivel de abstracción

Como hemos visto en el ejemplo anterior, pasar los errores recibidos de capas internas sin más no aporta realmente nada a los consumidores de mayor nivel de abstracción. Una alternativa a esto es lanzar nuevos errores en su lugar, pero que tengan sentido en el contexto. En este caso, por ejemplo, el error que interesa al consumidor sería algo así como "cannot get a zip reader".

La objeción que se puede poner a esto es: vale, pero igual nos interesa conocer la causa por la que no podemos obtener ese reader. ¿Hay alguna manera de mantener esa información, a la vez que lanzamos un error del nuevo tipo?

La hay. Podemos usar `errors.Wrap`.

```go
type ZipArchive struct {
    Fs   afero.Fs
    Path string
    Tmp  string
}

func (z ZipArchive) getZipReader() (*zip.Reader, error) {
	fileInfo, err := z.Fs.Stat(z.Path)
	if err != nil {
		return nil, errors.Wrap(err, "cannot get a zip Reader")
	}
	
	file, err := z.Fs.OpenFile(z.Path, os.O_RDONLY, os.FileMode(0644))
	if err != nil {
        return nil, errors.Wrap(err, "cannot get a zip Reader")
	}

	reader, err := zip.NewReader(file, fileInfo.Size())
	if err != nil {
		return nil, errors.Wrap(err, "cannot get a zip Reader")
	}
	
	return reader, nil
}
```

Esto nos permite anidar el error de "bajo nivel" emitiendo un error más abstracto que interesa al módulo consumidor, permitiéndonos anidar errores de tal forma que podemos tener contexto en todo momento del problema y su causa raíz. Por ejemplo, si ahora hiciésemos que el consumidor falle y exponga el error en pantalla...

```go
func (z ZipArchive) ExtractFile(desiredFile string) error {
	reader, err := z.getZipReader()

	if err != nil {
		log.Fatal(err.Error())
	}

    // ...

	return nil
}
```

Obtendríamos un mensaje similar a este, en el que se puede ver el error de más nivel y un texto que recoge los errores que lo han causado: 

```text
2022/09/12 18:05:37 cannot get zip.Reader: open /nonexistant.zip: file does not exist
```

De este modo, podemos encadenar errores. Por ejemplo, si añadimos una línea antes podemos ver cómo cambia el mensaje del log.

```go
	if err != nil {
		err := errors.Wrap(err, "cannot extract file")
		
		log.Fatal(err.Error())
	}
```

Ahora, el nuevo contexto se añade al principio:

```text
2022/09/12 18:22:19 cannot extract file: cannot get zip.Reader: open /nonexistant.zip: file does not exist
```

Si te fijas, el mensaje prácticamente se puede leer así: "mo puedo extraer el archivo, porque no puedo obtener el `zip.Reader`, dado que al intentar abrir el archivo `nonexistant.zip`, no existe tal archivo."

Si necesitas más detalles técnicos, puedes usar esta variante en su lugar. El símbolo de formato `%+v` nos permite obtener el _stack trace_ completo.

```go
	if err != nil {
		log.Fatalf("cannot extract file %+v", err)
	}
```

Se mostrará algo parecido a lo siguiente:

```text
2022/09/14 11:12:40 cannot extract file open /nonexistant.zip: file does not exist
cannot get zip.Reader
allureTool/application/adapters/for_getting_data/zip_repository.ZipArchive.getZipReader
	/Users/fran/go/src/allureTool/application/adapters/for_getting_data/zip_repository/zip_archive.go:51
allureTool/application/adapters/for_getting_data/zip_repository.ZipArchive.ExtractFile
	/Users/fran/go/src/allureTool/application/adapters/for_getting_data/zip_repository/zip_archive.go:30
allureTool/application/adapters/for_getting_data/zip_repository.TestZipArchiveDoesNotExist
	/Users/fran/go/src/allureTool/application/adapters/for_getting_data/zip_repository/zip_archive_test.go:16
testing.tRunner
	/usr/local/go/src/testing/testing.go:1439
runtime.goexit
	/usr/local/go/src/runtime/asm_arm64.s:1259
cannot extract file
allureTool/application/adapters/for_getting_data/zip_repository.ZipArchive.ExtractFile
	/Users/fran/go/src/allureTool/application/adapters/for_getting_data/zip_repository/zip_archive.go:32
allureTool/application/adapters/for_getting_data/zip_repository.TestZipArchiveDoesNotExist
	/Users/fran/go/src/allureTool/application/adapters/for_getting_data/zip_repository/zip_archive_test.go:16
testing.tRunner
	/usr/local/go/src/testing/testing.go:1439
runtime.goexit
	/usr/local/go/src/runtime/asm_arm64.s:1259
```

## Errores en Go y legibilidad

Tener que gestionar los errores en todo momento genera problemas con la legibilidad. Ocurre porque, a veces, tenemos más líneas de código detectando y reaccionando a los errores que código efectivo dentro de un método. Creo que es uno de los aspectos más incómodos del lenguaje y de los que más me desconcierta.

Aquí tenemos un ejemplo del mismo proyecto:

```go
func (z ZipArchive) extractFileToTempDir(f *zip.File) error {
	filePath := filepath.Join(z.Tmp, f.Name)

	err := z.Fs.MkdirAll(filepath.Dir(filePath), os.ModePerm)
	if err != nil {
		return errors.Wrap(err, "cannot extract file from zip")
	}

	destinationFile, err := z.Fs.OpenFile(filePath, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, f.Mode())
	if err != nil {
		return errors.Wrap(err, "cannot extract file from zip")
	}

	fileInArchive, err := f.Open()
	if err != nil {
		return errors.Wrap(err, "cannot extract file from zip")
	}

	_, err = io.Copy(destinationFile, fileInArchive); 
	if err != nil {
		return errors.Wrap(err, "cannot extract file from zip")
	}

	destinationFile.Close()
	fileInArchive.Close()
	
	return nil
}
```

De nuevo, tenemos una función que puede fallar por diversos motivos de más bajo nivel. Tenemos cuatro errores que tener en cuenta (en realidad se puede producir también un error al cerrar los archivos, pero no lo hemos contemplado todavía). De este modo, prácticamente, por cada línea que ejecuta una acción, tenemos tres líneas de gestión del potencial error.

Esto hace que leer el código resulte un tanto difícil. Las líneas efectivas quedan semi-ocultas por las líneas que manejan los errores. Y no es algo fácil de refactorizar. Si intentases extraer un bloque de esta manera no ganarías gran cosa, puesto que tendrías que seguir gestionando el error devuelto.

```go
func (z ZipArchive) extractFileToTempDir(f *zip.File) error {
    filePath := filepath.Join(z.Tmp, f.Name)
    
    err := z.createNeededFolders(filePath)
    if err != nil {
		return return errors.Wrap(err, "cannot extract file from zip")
    }
    // ...
}

func (z ZipArchive) createNeededFolders(filePath string) (error) {
	return z.Fs.MkdirAll(filepath.Dir(filePath), os.ModePerm)}
```

Invertir las condicionales y anidarlas es una opción descartada desde el principio, pues complica aún más la legibilidad y mantenibilidad del código.

Visto de esta manera, el programa no parece tan difícil de leer. Esto es gracias a que tiene un cierto ritmo en el que una línea va seguida del tratamiento del error. Sin embargo, siempre es relativamente fácil complicar las cosas. O al menos, hacerlos más confusas.

Supongamos que introducimos `defer`. En Golang podemos hacer que algo se ejecute cuando la función que la contiene ha terminado. De este modo, nos aseguramos de realizar ciertas operaciones independientemente del resultado de la misma. En particular es ideal para cerrar archivos y operaciones similares. Por supuesto, durante la ejecución diferida puede ocurrir un error, así que hay que preverlo. Típicamente, estos casos se manejan con funciones anónimas. Pero esto no hace más que añadir un fragmento de código que no es relevante en ese punto concreto.

```go
func (z ZipArchive) extractFileToTempDir(f *zip.File) error {
    //...

	destinationFile, err := z.Fs.OpenFile(filePath, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, f.Mode())
	defer func(destinationFile afero.File) {
		err := destinationFile.Close()
		if err != nil {
			log.Fatal(err.Error())
		}
	}(destinationFile)
	
	if err != nil {
		return errors.Wrap(err, "cannot extract file from zip")
	}

	// ...
	
	return nil
}
```

Por supuesto, una solución sería no utilizar `defer`, lo que ayuda bastante en cuanto a legibilidad.

```go
func (z ZipArchive) extractFileToTempDir(f *zip.File) error {
	// ...
	
	destinationFile, err := z.Fs.OpenFile(filePath, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, f.Mode())
	
	if err != nil {
		return errors.Wrap(err, "cannot extract file from zip")
	}

	// ...

	err = destinationFile.Close()
	if err != nil {
		log.Fatal(err.Error())
	}

	return nil
}
```

Pero, por supuesto, usar `defer` puede ser importante en diversos casos de uso. Una solución es llevarse ese código a una función no anónima, lo que proporcionaría un compromiso razonable entre legibilidad y conveniencia:

```go
func (z ZipArchive) extractFileToTempDir(f *zip.File) error {
	// ...
	
	destinationFile, err := z.Fs.OpenFile(filePath, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, f.Mode())
	defer closeFile(destinationFile)
	
	if err != nil {
		return errors.Wrap(err, "cannot extract file from zip")
	}

	// ...
	
	return nil
}

func closeFile(destinationFile afero.File) {
	err := destinationFile.Close()
	if err != nil {
		log.Fatal(err.Error())
	}
}
```

## Hasta aquí, lo más básico

En este artículo he expuesto algunos de los aspectos más básicos de la gestión de errores con Golang. Sin embargo, quedan bastantes cosas que tratar en más detalle.

La forma en que Golang trata los errores funciona muy bien en ciertos contextos. Teniendo en cuenta que un uso bastante frecuente del lenguaje tiene que ver con _tooling_ de infraestructura, trabajar teniendo en cuenta los errores desde el primer minuto es claramente una buena práctica. De hecho, si bien en muchos lenguajes trabajamos partiendo de un _happy path_ y tratando de cubrir los errores a posteriori, es posible que en Golang sea mejor práctica trabajar a gestionando los errores hasta llegar al _happy path_.


## Fuentes y lecturas complementarias

* [Go's error handling: good and bad](https://www.openmymind.net/Golangs-Error-Handling-Good-And-Bad/)
* [Go by example: Errors](https://gobyexample.com/errors)
* [Error handling in Go](https://medium.com/gett-engineering/error-handling-in-go-53b8a7112d04)
* [Error handling and Go](https://go.dev/blog/error-handling-and-go)
* [Error handling in Upspin](https://commandcenter.blogspot.com/2017/12/error-handling-in-upspin.html)
* [Golang error handling series](https://dev.to/wspowell/series/19707)
* [How to do better error handling with Golang](https://golang.ch/better-error-handling-with-golang/)
* [Effective error handling in Golang](https://earthly.dev/blog/golang-errors/)
* [Wrapping errors the right way](https://errnil.substack.com/p/wrapping-errors-the-right-way)
* [Go error best practices](https://levelup.gitconnected.com/go-error-best-practice-f0864c5c2385)
* [Handling errors only once and logging them with full context in Golang](https://www.orsolabs.com/post/go-errors-and-logs/)
* [Top 6 Golang logging best practices](https://blog.boot.dev/golang/golang-logging-best-practices/)
* [The Go error printing catastrophe](https://dr-knz.net/go-error-printing-catastrophe.html)
* [Why Go's Error Handling is Awesome](https://rauljordan.com/why-go-error-handling-is-awesome/)
