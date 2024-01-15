---
layout: post
title: Aislarse del sistema de archivos y una técnica de testing
categories: articles
tags: golang good-practices
---

Evitar depender directamente del sistema de archivos nos permite construir aplicaciones más fáciles de testear.

En el artículo anterior hablé sobre cómo hacer un _Spike_ nos permite explorar los problemas que podemos encontrar a la hora de implementar una funcionalidad en un proyecto. Un spike no es necesariamente un prototipo, sino más bien una prueba de concepto, o conjunto de ellas, en la que ponemos a prueba nuestras ideas y, de paso, exploramos sus posibilidades, pero también las dificultades que pueden presentar.

En mi caso, que pretende escribir una librería de snapshot testing, una de las conclusiones fue que necesitaría poder trabajar sobre algún tipo de abstracción o virtualización del sistema de archivos a fin de testear la funcionalidad de la propia librería. Específicamente, necesito verificar cosas como que se creen los snapshots con el nombre correcto, en el lugar adecuado, etc.

Hacer esto directamente sobre el sistema de archivos real tiene varios problemas, incluyendo una cierta penalización de rendimiento. Entre otras dificultades, está el mantenimiento de los archivos entre una ejecución y otra, etc.

Una posible solución a este problema es usar una librería de abstracción del sistema de archivos. Estas librerías nos suelen proporcionar una interface y diversas implementaciones. La condición es usar esta interface para todas nuestras operaciones con archivos. En producción usamos una implementación realizada con las librerías nativas de Go, mientras que en tests podemos usar otras implementaciones basadas en memoria, etc.

Esta es una buena solución, pero para un proyecto bien acotado puede que no haga falta. Gracias al spike realizado, he podido averiguar que necesito tres operaciones básicas con el sistema de archivos:

* Saber si un archivo existe
* Leer sus contenidos
* Crear uno nuevo con el contenido que le pase

¿Cómo lo he hecho? En realidad es muy sencillo. Basta con repasar el código de la implementación realizada en el spike y extraer los usos de llamadas al paquete o librería que queremos abstraer. A partir de ahí, podemos diseñar una interface basada en las funciones utilizadas, aunque debemos analizarlas previamente porque no queremos que contengan elementos que sean propios de una implementación determinada. Es decir: diseñaremos la interfaz conforme a las necesidades de su consumidora.

En este caso, el paquete `os`. Las llamadas eran las siguientes:

* `os.Stats`: usada para averiguar si un archivo o carpeta existen
* `os.MkDirAll`: para crear las carpetas de un path si no existen
* `os.WriteFile`: para escribir los archivos de snapshot
* `os.ReadFile`: para leerlos

De estos cuatro, `os.MkDirAll` no es relevante para la lógica de la librería, que no tiene que preocuparse de crear las carpetas. Si cuando se quiere escribir un archivo es necesario crearlas será cosa del componente que abstrae el sistema de archivos. Por tanto, no lo necesitamos en la interface.

Por otra parte, `os.Stats` solo se usa para saber si el archivo deseado existe y no necesitamos el objeto `os.FileInfo` que devuelve, así que podemos prescindir de él y devolver un `bool` indicando si se encuentra o no, junto con un error en caso de que haya habido otro problema.

Finalmente, no necesitamos saber nada acerca de permisos, que es algo propio del sistema de archivos físico. Lo que sea necesario lo gestionará la implementación basada en el paquete `os`.

Lo puedo expresar en forma de interface:

```go
type Vfs interface {
	Exists(name string) (bool, error)
	WriteFile(name string, data []byte) error
	ReadFile(name string) ([]byte, error)
}
```

Lo siguiente sería escribir dos implementaciones: una basada en el sistema de archivos real y otra que lo simule en memoria, pero que además me permita espiar los resultados.

He empezado con unos tests que describen la funcionalidad que queremos. No me entusiasman, sobre todo los dos primeros, pero dentro de un momento veremos cómo darle un giro.

```go
package golden_test

import (
	"errors"
	"github.com/stretchr/testify/assert"
	"golden"
	"testing"
)

func TestMemFs(t *testing.T) {
	memFs := golden.NewMemFs()

	t.Run("should write file", func(t *testing.T) {
		filePath := "file.snap"
		err := memFs.WriteFile(filePath, []byte("some content"))
		assert.NoError(t, err)
		exists, err := memFs.Exists(filePath)
		assert.NoError(t, err)
		assert.True(t, exists)
	})

	t.Run("should allow full paths", func(t *testing.T) {
		filePath := "__snapshots/file.snap"
		err := memFs.WriteFile(filePath, []byte("some content"))
		assert.NoError(t, err)
		exists, err := memFs.Exists(filePath)
		assert.NoError(t, err)
		assert.True(t, exists)
	})

	t.Run("should read existing files", func(t *testing.T) {
		filePath := "file_to_read.snap"
		err := memFs.WriteFile(filePath, []byte("The content we wanted."))
		assert.NoError(t, err)
		content, err := memFs.ReadFile(filePath)
		assert.NoError(t, err)
		assert.Equal(t, "The content we wanted.", string(content))
	})

	t.Run("should return error if not found", func(t *testing.T) {
		filePath := "no_existent.snap"
		_, err := memFs.ReadFile(filePath)
		assert.Error(t, err)
		assert.True(t, errors.Is(err, golden.SnapshotNotFound))
	})
}
```

Este es el código:

```go
package golden

type MemFs struct {
	files map[string][]byte
}

func NewMemFs() *MemFs {
	return &MemFs{
		files: make(map[string][]byte),
	}
}

func (fs *MemFs) Exists(name string) (bool, error) {
	_, ok := fs.files[name]
	if ok {
		return true, nil
	}
	return false, nil
}

func (fs *MemFs) WriteFile(name string, data []byte) error {
	fs.files[name] = data
	return nil
}

func (fs *MemFs) ReadFile(name string) ([]byte, error) {
	content, ok := fs.files[name]
	if ok {
		return content, nil
	}
	return []byte{}, SnapshotNotFound
}
```

Nos falta una forma de hacer espiar a `MemFs`. Por ejemplo, no me gusta el test:

```go
	t.Run("should write file", func(t *testing.T) {
		filePath := "file.snap"
		err := memFs.WriteFile(filePath, []byte("some content"))
		assert.NoError(t, err)
		exists, err := memFs.Exists(filePath)
		assert.NoError(t, err)
		assert.True(t, exists)
	})
```

Y preferiría _espiar_ que se ha creado la entrada correcta en el mapa `files`.

Para ello, estoy considerando esta forma de hacerlo. La siguiente función va en el mismo paquete que `MemFS`, por tanto, puede acceder a sus propiedades. Por ejemplo, esta función verifica que se ha guardado el contenido bajo el path deseado.

```go
func AssertContentWasStored(t *testing.T, fs *MemFs, path string, expected []byte)  {
	content, ok := fs.files[path]
	assert.True(t, ok)
	assert.Equal(t, expected, content)
}
```

De este modo, puedo reescribir el test de una forma mucho más sencilla y más expresiva, me parece, de lo que queremos examinar. Por otro lado, no necesitamos exponer nada que no queramos en la implementación de `MemFS`, ni le añadimos código que solo se usa en situación de test.

```go
	t.Run("should write file", func(t *testing.T) {
		filePath := "file.snap"
		content := []byte("some content")
		err := memFs.WriteFile(filePath, content)
		assert.NoError(t, err)
		golden.AssertContentWasStored(t, memFs, filePath, content)
	})
```

Estas funciones creo que donde mejor están es junto al código de la unidad. Alternativamente se podrían poner en un archivo `helpers.go` dentro del mismo paquete.
