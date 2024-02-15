---
layout: post
title: Opciones funcionales en Go y en PHP
categories: articles
tags: golang php
---

Las opciones funcionales son un patrón bastante habitual en Go... que se puede usar también en PHP.

Escribir la librería de snapshot testing Golden en Go ha sido y está siendo una forma muy interesante de aprender no solamente sobre el lenguaje como tal, sino sobre técnicas del paradigma funcional que posiblemente no me hubiese planteado en otro contexto.

Pero portar la misma librería a PHP también está resultando muy instructivo. Esto aprendiendo, y a veces re-aprendiendo, técnicas y características de PHP que me están sorprendiendo un poco. Una de las que me ha llamado la atención es utilizar el patrón de opciones funcionales que aprendí en Go, pero en PHP.

## Opciones funcionales, ¿qué es eso?

Las [opciones funcionales](https://blog.friendsofgo.tech/posts/functional-options-en-go/) son un patrón que nos ayuda a resolver el problema de pasar múltiples parámetros opcionales a un método o función. Es especialmente útil cuando queremos personalizar el comportamiento de un método o función desde el punto de vista de quien la llama, sobre todo cuando tiene un comportamiento por defecto.

En Golden es bastante fácil de ver que tenemos ese problema con `Verify`. Por defecto, `Verify` tiene un comportamiento definido que incluye:

* Guardar los snapshots en la carpeta `__snapshots`.
* Hacer pasar el test automáticamente la primera vez que se ejecuta.
* Guardar el snapshot con el nombre del test.
* Guardar el snapshot con la extensión `.snap`.
* No modificar el output aunque pueda tener datos no deterministas.

Sin embargo, nos interesa poder personalizar individualmente cada test en alguno de esos aspectos. Si tuviésemos que pasar un objeto de configuración para las posibles variantes de esos valores sería una tarea ímproba. Es preferible poder indicar qué aspecto concreto queremos modificar para el test y, para eso, lo mejor es pasar únicamente las opciones relevantes.

Por ejemplo, para guardar el snapshot en una carpeta distinta:

```go
golden.Verify(t, output, golden.Folder("__examples"))
```

O una combinación de opciones: para guardar el snapshot en una carpeta distinta, con un nombre particular y sin hacer pasar el test.

```go
golden.Verify(t, output, golden.Folder("__examples"), golden.Snapshot("my-snapshot"), golden.WaitApproval())
```

Estas opciones son, en realidad, funciones que, a su vez, devuelven otras funciones que actúan directamente sobre objetos dentro de `Verify`. Específicamente, sobre el objeto que nos proporciona la configuración, como se puede ver en el fragmento a continuación:

```go
func (g *Golden) Verify(t Failable, s any, options ...Option) {
	g.Lock()
	t.Helper()

	conf := g.global
	for _, option := range options {
		option(&conf)
	}

    // Code removed for clarity
}
```

El parámetro options nos proporciona un slice del tipo `Option`, que nos entrega una función que recibe objetos `Config`. Pero vamos a verlo mejor.

El tipo `Option` es este: una función que puede recibir un puntero a un objeto `Config`, de modo que pueda mutarlo. En Golden, devuelve una función de tipo `Option` para revertir el valor original si fuese el caso, pero como esto último no es estrictamente necesario, no voy a profundizar en ello.

```go
type Option func(g *Config) 
```

Para construir una opción funcional, lo que hacemos es crear una función que devuelva la función de tipo `Option` que haga algo que nos interese. En este caso `Snapshot` recibe un parámetro `name`, con el que podremos indicar el nombre del archivo de _snapshot_. Este parámetro lo usa una función anónima de tipo `Option` que es la que devolvemos y se ejecutará en el bucle `for` que vimos arriba. De este modo, el objeto `conf`, será modificado en función de las opciones que hayamos pasado.

```go
func Snapshot(name string) Option {
	return func(c *Config) {
		c.name = name
	}
}
```

La función `Snapshot` viene a ser una constructora de la función anónima que devuelve. De hecho, lo que recibe `Verify` no es la función `Snapshot`, sino la función anónima de tipo `Option`, que es la verdadera opción funcional. `Snapshot` nos permite añadir un poco de semántica y hacerlas reutilizables. Compara esto:

```go
golden.Verify(t, output, golden.Snapshot("my-snapshot"))
```

Con lo que sería tener que crear la función desde cero. En principio esto tendría el mismo efecto... si se pudiese hacer:

```go
snapshot := func(c *golden.Config) {
	c.name = "my-snapshot"
}

golden.Verify(t, output, snapshot)
```

No se puede hacer, porque estaríamos escribiendo la función en otro paquete y las propiedades de `Config` serían privadas desde donde estamos. `Config` tendría que tener _setters_, para permitir modificar sus propiedades. Aparte de eso, hay que tener en cuenta que nos estaría obligando a saber demasiado de la forma en que está implementada `Verify` y acceder

Y esto otro no funcionaría porque `MySnapshot` ya no es de tipo `Option` al introducir un parámetro extra en la firma.

```go
func MySnapshot(c *goldenConfig, name string) {
	c.name = name
}
```

En resumen: esta fórmula nos permite proporcionar un mecanismo para actuar sobre la configuración sin exponer sus detalles:

```go
func Snapshot(name string) Option {
	return func(c *Config) {
		c.name = name
	}
}
```

Si le añadimos la deconstrucción `options ...Options`:

```go
func (g *Golden) Verify(t Failable, s any, options ...Option) {
	g.Lock()
	t.Helper()

	conf := g.global
	for _, option := range options {
		option(&conf)
	}

    // Code removed for clarity
}
```

Lo que conseguimos es poder exponer la posibilidad de pasar un número indeterminado de opciones, o ninguna, para personalizar el comportamiento de la función o método invocados.

## Y ahora, en PHP

PHP no tiene un enfoque tan funcional como Go, pero resulta que tiene lo suficiente como para aplicar el mismo patrón. Creo que salvo la posibilidad de definir tipos que son funciones, todo lo demás es básicamente igual, con las lógicas salvedades:

```php
$this->verify($output, Folder("__folder"));
```

Aquí tenemos el ejemplo con la opción funcional `Folder`. Se devuelve una función que actúa sobre un objeto `Config` el cual, en este caso, exponer un `setter`: `setPrefix`. Como ocurría en la versión de Go, la función `Folder` actúa como una constructora de la opción funcional, cuyo objetivo es cambiar el valor de `$prefix` en `Config`.

```php
function Folder(string $prefix): \Closure
{
    return fn(Config $config) => $config->setPrefix($prefix);
}
```

El código de verify en PHP es bastante parecido al de Go. Se obtiene las opciones, que son `callables`, aunque igual podríamos restringirlo a `Closures`, y se ejecuta cada una de ellas, lo que da como resultado que la configuración ha sido sobreescrita para este test en particular.

```php
    public function verify($subject, callable ...$options): void
    {
        $this->init();
        
        $config = $this->config
        
        foreach ($options as $option) {
            $option($config);
        }

        // Code removed for clarity
    }
```

## Conclusiones

El patrón functional options no es exclusivo de Go, sino más genéricamente del paradigma funcional. Cualquier lenguaje que tenga funciones de primer orden puede aplicarlo. Esto es: si el lenguaje te permite pasar funciones como parámetros y devolverlas como retorno, entonces el patrón es aplicable.

Usar este patrón es muy interesante dado que permite exponer mecanismo para personalizar el comportamiento de una función, pero sin exponer sus interioridades. Además, valiéndonos de signaturas variádicas, podemos añadir fácilmente todo un vocabulario de opciones para ello.
