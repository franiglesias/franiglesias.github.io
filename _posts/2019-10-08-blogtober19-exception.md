---
layout: post
title: Exception (Blogtober2019)
categories: articles
tags: blogtober19
---

Mi compañera y manager en Holaluz [Mavi Jiménez](https://twitter.com/Linkita) va a hacer un dibujo cada día del mes sobre una palabra propuesta en twitter. Y aquí vamos a intentar escribir [un post por cada una de ellas](https://franiglesias.github.io/blogtober19-status/).

<blockquote class="twitter-tweet" data-conversation="none" data-theme="dark"><p lang="en" dir="ltr">8. Exception <a href="https://twitter.com/polrb?ref_src=twsrc%5Etfw">@polrb</a> <a href="https://twitter.com/hashtag/Inktober2019?src=hash&amp;ref_src=twsrc%5Etfw">#Inktober2019</a> <a href="https://twitter.com/hashtag/Inktoberday8?src=hash&amp;ref_src=twsrc%5Etfw">#Inktoberday8</a> <a href="https://twitter.com/hashtag/linktober?src=hash&amp;ref_src=twsrc%5Etfw">#linktober</a> <a href="https://t.co/IAbZbs4Bqr">pic.twitter.com/IAbZbs4Bqr</a></p>&mdash; Maybe (@Linkita) <a href="https://twitter.com/Linkita/status/1182042635340570629?ref_src=twsrc%5Etfw">October 9, 2019</a></blockquote> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>

## Exception

Las excepciones son mensajes que un programa dirige al sistema anunciando que algo malo acaba de ocurrir, algo que no se puede o no se sabe manejar y que es mejor pararlo todo.

Son una herramienta muy útil para gestionar las situaciones problemáticas, pero conviene usarlas con sentido. Así que, hoy presentamos algunas buenas prácticas para usar excepciones.

### Exception significa que ha pasado algo malo

Las excepciones indican que ha pasado algo malo, así que no las uses para indicar que ha pasado algo que sería perfectamente normal. Por ejemplo:

**Bien**

```php
$book = $this->bookRepository->getById($bookId);
if (null === $book) {
    throw BookNotFoundException('No tenemos ese libro');
}
```

Si alguien puede usar un Id de un libro es que o bien lo ha obtenido "legalmente" o bien está probando Ids al azar. 

En el primer caso, si es un Id legal y no existe el libro con ese Id, es que ha habido un problema: no es correcto que exista una identidad de un libro que ya no estamos gestionando (otro usuario pudo haberlo quitado, por ejemplo).

En el segundo caso, pues es casi lo mismo. No es "normal" que se puedan estar usando Ids de libros que no gestionamos.

**Mal**

```php
$books = $this->bookRepository->findAllBy($criteria);
if (empty($books)) {
    throw BookNotFoundException('No tenemos libros con esos criterios');
}
```

En este caso, es perfectamente esperable que no se encuentren libros cumpliendo los criterios. Por tanto, no tiene sentido marcar esta situación como excepcional o problemática. Simplemente se devuelve una colección o array vacía y ya será la capa de presentación la que decida si debe mostrar algún mensaje o no.

### Falla específicamente

Gracias a los bloques `try/catch` es fácil gestionar las excepciones. El *happy path* va en a parte del `try` y, si algo falla, se gestiona mediante el `catch`.

```php
try {
    $bookdId = Uuid::fromString($request->get('bookId'));
    $book = $this->getBook->byId($bookId);
    return new OKResponse($book);
} catch (BookNotFoundException) {
    return new NotFoundResponse($bookId);
}
```

Una manera de gestionar esto que da buenos resultados es usar excepciones personalizadas en lugar de las genéricas de la SPL. En los ejemplos hemos utilizado BookNotFoundException, una excepción personalizada que podemos extender de OutOfBoundsException.

**Bien**

```php
class BookNotFoundException extends OutOfBoundsException
{
}

$book = $this->bookRepository->getById($bookId);
if (null === $book) {
    throw BookNotFoundException('No tenemos ese libro');
}
```

**Mal**

```php
$book = $this->bookRepository->getById($bookId);
if (null === $book) {
    throw OutOfBoundsException('No tenemos ese libro');
}
```

### Captura genéricamente (y luego refina)

A la hora de capturar, sin embargo, es mejor empezar con un `catch` lo más genérico posible e ir anteponiendo `catch` más específicos a medida que necesitemos refinar las respuetas:

**Mal**

```php
try {
    $bookdId = Uuid::fromString($request->get('bookId'));
    $book = $this->getBook->byId($bookId);
    return new OKResponse($book);
} catch (BookNotFoundException) {
    return new NotFoundResponse($bookId);
}
```

En ese caso solo capturamos uno de los muchos posibles errores que se podrían producir, generando bugs.

**Bien**

```php
try {
    $bookdId = Uuid::fromString($request->get('bookId'));
    $book = $this->getBook->byId($bookId);
    return new OKResponse($book);
} catch (Throwable $exception) {
    return new NotFoundResponse($bookId);
}
```

Ahora, estamos capturando cualquier cosa mala que pueda pasar, de modo que siempre devolveremos una respuesta con la que el sistema se pueda recuperar (por ejemplo, en una API esto estaría devolviendo un error 500)

**Mejor**

```php
try {
    $bookdId = Uuid::fromString($request->get('bookId'));
    $book = $this->getBook->byId($bookId);
    return new OKResponse($book);
} catch (BookNotFoundException) {
    return new NotFoundResponse($bookId);
} catch (Throwable $exception) {
    return new ServerErrorResponse();
}
```

Capturamos la excepción específica y la tratamos con la respuesta adecuada (siguiendo el ejemplo dla API, ahora sería un 404), mientras que seguimos manteniendo bajo control los demás errores.

### Cada cada una excepción

Si capturas una excepción que viene de infrastructura en la capa de aplicación, anídala en una excepción de la capa de aplicación y relánzala.

**Mal**

```php
class GetBook
{
    function byId(BookId $bookId)
    {
        $book = $this->bookRepository->byId($bookId);
        
        return $book;
    }
}
```

Este código deja "subir" las excepciones de infrastructura, que podrían incluir excepciones relacionadas con el ORM o la librería de acceso a base de datos.

**Bien**

```php
class GetBook
{
    function byId(BookId $bookId): Book
    {
        try {
            $book = $this->bookRepository->byId($bookId);
        
            return $book;
        } catch (Throwable $exception){
            throw new BookNotFoundException('Ese libro no existe', $exception->getCode(), $exception);
        }
    }
}
```

Capturamos la excepción que viene de las capaz inferiores y lanzamos una excepción que tiene sentido en el contexto del Dominio. Si quieres tener más granularidad para gestionar las excepciones, como por ejemplo para diferenciar entre aquellas que indicarían que no se encuentra el libro y aquellas que indicarían un problema en la base de datos, aplica el principio anterior:


**Mejor**

```php
class GetBook
{
    function byId(BookId $bookId): Book
    {
        try {
            $book = $this->bookRepository->byId($bookId);
        
            return $book;
        } catch (ORMException | BookNotFound $exception){
            throw new BookNotFoundException('Ese libro no existe', $exception->getCode(), $exception);
        } catch (Throwable $exception){
            throw new FatalBookRepositoryException('No se puede acceder a la BD', $exception->getCode(), $exception);
        }
    }
```


### No testees sobre mensajes de las excepciones

El significado de las excepciones debe ir en la excepción misma. El mensaje es un añadido que ayudará al usuario o al desarrollador a entender que está pasando o a obtener una información concreta. Los mensajes pueden cambiar con facilidad sin cambiar el comportamiento de la unidad de software y no queremos que un test deje de pasar por algo que no cambiar el comportamiento. Por otro lado, los mensajes en las excepciones, como los comentarios, corren el riesgo de volverse mentirosos con el tiempo.

Cuando testes por excepciones haz aserciones sobre la excepción y no sobre el mensaje.

**Mal**

```php
public function testShouldFail(): void
{
    $this->expectsExceptionMessage('blah, blah');
    
    ...
}
```

**Bien**

```php
public function testShouldFail(): void
{
    $this->expectsException(BookNotFoundException::class);
    
    ...
}
```




