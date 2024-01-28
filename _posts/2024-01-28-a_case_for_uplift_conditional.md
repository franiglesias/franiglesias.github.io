---
layout: post
title: Un caso de Uplift Conditional
categories: articles
tags: golang refactoring
---

El refactor _uplift conditional_ puede ayudarnos a estructurar mejor un código cuajado de condicionales.

El siguiente código pertenece a la librería Golden, una librería que estoy creando para snapshot testing en Go. La librería está a punto de salir en su primera versión estable, por lo que estoy haciendo las últimas pruebas para comprobar que funciona como debería. En una de estas pruebas me he dado cuenta de que falta una funcionalidad que, si bien no es crítica, es lo bastante importante como para que esté presente en esta v1.

## Contexto

Para explicar la funcionalidad hace falta un poco de contexto. En snapshot testing, se ejecuta el código bajo test una primera vez para capturar su output y guardarlo en un archivo. A esto lo llamamos snapshot y se utiliza como criterio para comparar con las siguientes ejecuciones del test. De este modo, nos aseguramos de que el comportamiento de la unidad bajo test no es alterado con los cambios que hagamos. Si el comportamiento ha cambiado y el output generado es diferente al snapshot, se genera un informe con las diferencias, parecido a un _diff_.

Esto es interesante para poner bajo test código que ya existe y está funcionando en producción, pero que aún no tiene tests.

Por otra parte, la librería ofrece un modo "approval". En esta modalidad, se genera un snapshot nuevo en cada ejecución del test y el test nunca pasa. Esto tiene el propósito de que el snapshot sea verificado y aprobado una vez que el output obtenido es el que queremos. Cuando se consigue, volvemos al modo normal y el snapshot queda fijado.

Pues bien, el problema que me encontré es que en el modo "approval", no se muestran las diferencias entre el output y el snapshot anterior. Esto es debido a que en el código original se regenera el snapshot con el propio output que se está testeando y, aunque se marca el test como fallido, el informe de diferencias no muestra ninguna porque, de hecho, no las hay. En el modo "approval", el output actual tiene que compararse con el snapshot anterior, no con el que se acaba de actualizar.

Este es el código original:

```go
	snapshotExists := g.snapshotExists(name)

    // approval mode works as if the snapshot doesn't exist, so we have to write it always
	if !snapshotExists || conf.approvalMode() {
		g.writeSnapshot(name, subject)
	}

	snapshot := g.readSnapshot(name)
	if snapshot != subject || conf.approvalMode() {
		t.Errorf(conf.header(), g.reportDiff(snapshot, subject))
	}
```

## Código problemático

Una vez identificado este problema, escribí algunos tests para demostrarlo y modifiqué el código para hacerlos pasar y así arreglar el problema. Y esta es la primera aproximación:

```go
	name := conf.snapshotPath(t)

	snapshotExists := g.snapshotExists(name)

	// In approval mode we need to keep the existing snapshot if exists
	// So we can report the differences

	var snapshot string

	if snapshotExists && conf.approvalMode() {
		snapshot = g.readSnapshot(name)
	}

	// approval mode works as if the snapshot doesn't exist, so we have to write it always
	if !snapshotExists || conf.approvalMode() {
		g.writeSnapshot(name, subject)
	}

	if !conf.approvalMode() {
		snapshot = g.readSnapshot(name)
	}

	if snapshot != subject || conf.approvalMode() {
		t.Errorf(conf.header(), g.reportDiff(snapshot, subject))
	}
```

Como se puede ver, el código es bastante feo y difícil de entender. Está cuajado de condicionales que básicamente examinan las mismas condiciones. De hecho, la condición `conf.approvalMode()` está presente en las cuatro estructuras condicionales.

Este es un caso en el que _uplift conditional_ (o _elevar la condicional_) puede ayudarnos a simplificar este flujo enmarañado y encontrar una solución más fácil de mantener de forma bastante segura. Además, como ya lo tengo cubierto con tests debería ser fácil de trabajar.

## Aislar el código que queremos tratar

Normalmente, lo primero que hago es aislar el código en un método privado. En este caso, es relativamente fácil, pero debo decir que en Go en particular extraer un método puede ser una pequeña pesadilla dependiendo de cómo estemos manejando los errores. En mi ejemplo, por suerte, no necesito manejar errores, pues los que puedan aparecer se gestionan en los métodos en donde se generen. Al tratarse de una librería de testing, me basta con enviarlos al log.

Extraigo el método. Como puede verse, recibe un montón de parámetros, pero no me voy a preocupar mucho de eso porque es temporal.

```go
func (g *Golden) manageSnapshot(t Failable, name string, conf Config, subject string) {
	snapshotExists := g.snapshotExists(name)

	// In approval mode we need to keep the existing snapshot if exists
	// So we can report the differences

	var snapshot string

	if snapshotExists && conf.approvalMode() {
		snapshot = g.readSnapshot(name)
	}

	// approval mode works as if the snapshot doesn't exist, so we have to write it always
	if !snapshotExists || conf.approvalMode() {
		g.writeSnapshot(name, subject)
	}

	if !conf.approvalMode() {
		snapshot = g.readSnapshot(name)
	}

	if snapshot != subject || conf.approvalMode() {
		t.Errorf(conf.header(), g.reportDiff(snapshot, subject))
	}
}
```

Si comparamos el original con el nuevo código podemos ver que todo gira en torno a cuando debe leerse el snapshot. En modo "approval" (cuando `conf.approvalMode()` es `true`) debe leerse antes de sobreescribirlo. Y, si no, después.

## Elevando la condicional

Precisamente es la condición `conf.approvalMode()` la que debería "elevar" puesto que tengo que consultarla a cada paso. El hecho es que indica un "modo" de ejecución y el código debería evolucionar para reflejar eso. La técnica uplift condition parte de esa idea, de que el código seguirá un flujo u otro en función de la condición que elevamos, por lo que el siguiente paso es poner el código en ejecución bajo ambas ramas de la condición:

```go
	if conf.approvalMode() {
		g.manageSnapshot(t, name, conf, subject)
	} else {
		g.manageSnapshot(t, name, conf, subject)
	}
```

Y, a continuación, deshacemos la extracción del método en ambas ramas.


```go
	if conf.approvalMode() {
		snapshotExists := g.snapshotExists(name)

		var snapshot string

		if snapshotExists && conf.approvalMode() {
			snapshot = g.readSnapshot(name)
		}

		if !snapshotExists || conf.approvalMode() {
			g.writeSnapshot(name, subject)
		}

		if !conf.approvalMode() {
			snapshot = g.readSnapshot(name)
		}

		if snapshot != subject || conf.approvalMode() {
			t.Errorf(conf.header(), g.reportDiff(snapshot, subject))
		}
	} else {
		snapshotExists := g.snapshotExists(name)

		var snapshot string

		if snapshotExists && conf.approvalMode() {
			snapshot = g.readSnapshot(name)
		}
		
		if !snapshotExists || conf.approvalMode() {
			g.writeSnapshot(name, subject)
		}

		if !conf.approvalMode() {
			snapshot = g.readSnapshot(name)
		}

		if snapshot != subject || conf.approvalMode() {
			t.Errorf(conf.header(), g.reportDiff(snapshot, subject))
		}
	}
```

Esto da un poco de miedo, puesto que ahora las cosas están más complejas que antes. Pero como veremos, arreglarlo es realmente sencillo y no tenemos casi que pensar. Podemos usar varias técnicas.

## Eliminar el código innecesario

**Ejecutar todos los tests con cobertura**. Esto nos mostrará en el IDE línes que no se ejecutan, las cuales podemos eliminar.

Es el caso de estas líneas, que nunca se ejecutan. Esto es porque la condición que requieren nunca se cumple en la rama en la que se encuentran, pues contradice la condición elevada.

```go
	if conf.approvalMode() {
        // Removed code

		if !conf.approvalMode() {
			snapshot = g.readSnapshot(name)
		}

        // Removed code
	} else {
        // Removed code

		if snapshotExists && conf.approvalMode() {
			snapshot = g.readSnapshot(name)
		}

        // Removed code
	}
```

Esto nos lleva a la siguiente técnica, útil si no podemos o no queremos usar la cobertura de líneas como indicador.

**Reemplazar la condición elevada por su resultado**. Dentro de cada una de las ramas de la condicional, reemplazamos cada uso de la condición elevada por su resultado.

A continuación vemos el códio habiendo hecho esta sustitución. Como se puede ver, algunas condiciones se pueden eliminar y otras simplificar.

```go
	if conf.approvalMode() {
		snapshotExists := g.snapshotExists(name)
		
		var snapshot string

		if snapshotExists && true {
			snapshot = g.readSnapshot(name)
		}

		if !snapshotExists || true {
			g.writeSnapshot(name, subject)
		}

		if false{
			snapshot = g.readSnapshot(name)
		}

		if snapshot != subject || true {
			t.Errorf(conf.header(), g.reportDiff(snapshot, subject))
		}
	} else {
		snapshotExists := g.snapshotExists(name)

		var snapshot string

		if snapshotExists && false {
			snapshot = g.readSnapshot(name)
		}

		if !snapshotExists || false {
			g.writeSnapshot(name, subject)
		}

		if true {
			snapshot = g.readSnapshot(name)
		}

		if snapshot != subject || false {
			t.Errorf(conf.header(), g.reportDiff(snapshot, subject))
		}
	}
```

Una vez simplificado:

```go
	if conf.approvalMode() {
		snapshotExists := g.snapshotExists(name)

		var snapshot string
		if snapshotExists {
			snapshot = g.readSnapshot(name)
		}

		g.writeSnapshot(name, subject)

		t.Errorf(conf.header(), g.reportDiff(snapshot, subject))
	} else {
		snapshotExists := g.snapshotExists(name)

		if !snapshotExists {
			g.writeSnapshot(name, subject)
		}

		var snapshot string
		snapshot = g.readSnapshot(name)

		if snapshot != subject {
			t.Errorf(conf.header(), g.reportDiff(snapshot, subject))
		}
	}
```

Fíjate que ahora el código expresa ambos flujos, approval y estándar. En el primero siempre se actualiza el snapshot y el test falla, mientras que en segundo solo se escribe el snapshot si no existe y el test falla cuando se encuentran diferencias.

En mi opinión, el siguiente paso sería separar ambas patas en métodos diferentes.

```go
	if conf.approvalMode() {
		g.approvalFlow(t, name, subject, conf)
	} else {
		g.verifyFlow(t, name, subject, conf)
	}
```

```go
func (g *Golden) approvalFlow(t Failable, name string, subject string, conf Config) {
	snapshotExists := g.snapshotExists(name)
	var snapshot string
	if snapshotExists {
		snapshot = g.readSnapshot(name)
	}

	g.writeSnapshot(name, subject)

	t.Errorf(conf.header(), g.reportDiff(snapshot, subject))
}

func (g *Golden) verifyFlow(t Failable, name string, subject string, conf Config) {
	snapshotExists := g.snapshotExists(name)
	if !snapshotExists {
		g.writeSnapshot(name, subject)
	}

	snapshot := g.readSnapshot(name)

	if snapshot != subject {
		t.Errorf(conf.header(), g.reportDiff(snapshot, subject))
	}
}
```

## Ajustes finales

Algunos refactors que podríamos aplicar aquí son los siguientes.

Eliminar la variable temporal `snapshotExists`, que resulta innecesaria dado que el método del que se obtiene es lo bastante explicativo.

```go
func (g *Golden) approvalFlow(t Failable, name string, subject string, conf Config) {
	var snapshot string
	if g.snapshotExists(name) {
		snapshot = g.readSnapshot(name)
	}

	g.writeSnapshot(name, subject)

	t.Errorf(conf.header(), g.reportDiff(snapshot, subject))
}

func (g *Golden) verifyFlow(t Failable, name string, subject string, conf Config) {
	if !g.snapshotExists(name) {
		g.writeSnapshot(name, subject)
	}

	snapshot := g.readSnapshot(name)

	if snapshot != subject {
		t.Errorf(conf.header(), g.reportDiff(snapshot, subject))
	}
}
```

En el método `approvalFlow` el nombre de la variable `snapshot` resulta puede provocar confusión, sobre todo porque el snapshot se escribe a continuación y además no interviene en este flujo. Mi idea es cambiarle el nombre y el orden de las líneas, de este modo enfatizamos el hecho de que obtenemos el contenido del snapshot anterior y eso es lo que usamos para comparar.  

```go
func (g *Golden) approvalFlow(t Failable, name string, subject string, conf Config) {
	var previous string
	if g.snapshotExists(name) {
		previous = g.readSnapshot(name)
	}
    
	g.writeSnapshot(name, subject)

    t.Errorf(conf.header(), g.reportDiff(previous, subject))
}
```

Alternativamente, debería poder cambiar el orden para que el snapshot de esta ejecución se escriba al finalizar el test. Lo que dejaría las cosas aún más claras. En principio, el método `t.Errorf` no detiene la ejecución del test, aunque lo marca como fallado.

```go
func (g *Golden) approvalFlow(t Failable, name string, subject string, conf Config) {
	var previous string
	if g.snapshotExists(name) {
		previous = g.readSnapshot(name)
	}

	t.Errorf(conf.header(), g.reportDiff(previous, subject))

	g.writeSnapshot(name, subject)
}
```

## Conclusiones

Muchas personas podríais preguntaros, ¿para qué seguir este proceso si desde el principio estaba claro a dónde queríamos llegar?

Dominar distintas técnicas de manipulación sistemática del código es importante para asegurar que nuestros cambios son seguros, incluso en aquellos casos en los que no disfrutamos de la protección de tests. Al proceder de esta forma pasamos el código de un estado A, a otro B, sin tener que pensar en el comportamiento o la funcionalidad. Es más, cada cambio resulta incluso obvio y necesario.

El resultado final es que los dos flujos posibles están separados. Si tengo que modificar alguno, hay un solo lugar en el que hacerlo. Puedo usar nombres más adecuados en cada contexto y el proceso se entiende mejor.
