---
layout: post
title: Void (Blogtober2019)
categories: articles
tags: blogtober19
---

Mi compañera y manager en Holaluz [Mavi Jiménez](https://twitter.com/Linkita) va a hacer un dibujo cada día del mes sobre una palabra propuesta en twitter. Y aquí vamos a intentar escribir [un post por cada una de ellas](https://franiglesias.github.io/blogtober19-status/).


## Void

Hablemos del vacío y de los *return types*.

Del mismo que modo que los *type hints* en las signaturas de las funciones y métodos nos permiten asegurar que pasamos parámetros de un tipo determinado, actuando como una especie de pre-condición, el *return type* nos permite asegurar que los métodos responden con algo predecible, constituyendo una especie de validación parcial de la respuesta que devuelve el método.

Vamos a verlo poco a poco.

Si no indicamos nada, podemos devolver cualquier tipo de dato o nada.

```php
public function doSomething()
{
}
```

Esta es la peor de las posibilidades ya que no podemos fiarnos de lo que devuelve. De hecho, nos permite hacer cosas feas como éstas:

```php
public function doSomething()
{
    if (!$condition) {
        return null;
    }
    
    if ($result < $limit) {
        return 34;
    }
    
    return new Thing($result);
}
```

Es decir, como no podemos saber qué tipo de dato nos va a devolver la función, tendríamos que validar esa respuesta. Por esta razón, hay voces en contra de los `return` múltiples en una función, ya que si no se hace ningún control puede darse ese caso.

Para arreglar esto, podemos definir un *return type*:

```php
public function doSomething(): Thing
{
}
```

De este modo, si la función intenta devolver un tipo incompatible con `Thing`, se lanzará un error. Gracias a eso, sabemos que espera y no tenemos que validar. Como beneficio extra, nos facilita tener múltiples puntos de retorno. Por ejemplo (fíjate que uno de los puntos fallará):


```php
public function doSomething(): Thing
{
    if (!$condition) {
        return null;
    }
    
    if ($result < $limit) {
        return new Thing($limit);
    }
    
    return new Thing($result);
}
```


Como decía, uno de los puntos fallará. Si intentamos devolver `null` con un *return type*, no podremos hacerlo.

Tenemos ~~dos~~ tres formas de resolver esta situación:

Si, por el motivo que sea, podemos permitir que la respuesta sea un `null` no tenemos más que marcar el *return type* como *nullable*:

```php
public function doSomething(): ?Thing
{
    if (!$condition) {
        return null;
    }
    
    if ($result < $limit) {
        return new Thing($limit);
    }
    
    return new Thing($result);
}
```

La segunda posibilidad es fallar y lanzar una excepción. Con esto, seguimos teniendo un *return type* estricto y en muchos aspectos es mucho más explícito acerca de lo que ocurre.

```php
public function doSomething(): Thing
{
    if (!$condition) {
        throw new Exception('Something bad happened');
    }
    
    if ($result < $limit) {
        return new Thing($limit);
    }
    
    return new Thing($result);
}
```

En algunos casos, podemos usar el patrón `NullObject`:

```php
public function doSomething(): Thing
{
    if (!$condition) {
        return new NullThing();
    }
    
    if ($result < $limit) {
        return new Thing($limit);
    }
    
    return new Thing($result);
}
```

Este patrón es útil cuando nos interesa poder manejar esa respuesta aunque realmente no tenga contenido.

Pero, ¿qué pasa con `void`?

Pues `void` indica que queremos que el método devuelva exactamente **nada**.

```php
public function doSomething(): void
{
}
```

El método fallará si intentamos devolver algo, incluso `null`.

