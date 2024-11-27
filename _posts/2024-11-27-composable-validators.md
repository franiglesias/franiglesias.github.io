---
layout: post
title: Validadores componibles
categories: articles
tags: software-design php typescript
---

Llevo unos días dando vueltas en la cabeza a una idea que me parece interesante: la de los validadores componibles. Es un poco experimento, un poco juego, aunque no creo que sea algo nuevo en realidad.

## Un experimento que no funciona

En este caso, es una mezcla de patrones y enfoques. El origen está en una ocurrencia que tuve durante la reescritura que estoy haciendo del libro "La guía del Refactor Cotidiano". En el capítulo sobre encapsular primitivos se me ocurrió que se podrían describir las reglas de validación mediante objetos.

```php
class NotEmptyString
{
    private string $value;
    
    public function constructor($value)
    {
        if (empty($value)) {
            throw new InvalidArgumentException('The value cannot be empty');
        }
        $this->value = $value;
    }
}
```

De forma que se pueden usar como tipos básicos para instanciar Value Objects:

```php
class Name
{
    private NotEmptyString $value;
    
    public function constructor(string $value)
    {
        $this->value = new NotEmptyString($value);
    }
}
```

Pero esto en realidad no es muy útil, ya que no se pueden componer varias reglas de validación. Por ejemplo, supongamos que queremos que el nombre tenga una longitud máxima de 3 caracteres. Podríamos hacer algo así:

```php
class MaxLengthString
{
    private string $value;
    
    public function constructor($value, $maxLenght)
    {
        if (strlen($value) > $maxLenght) {
            throw new InvalidArgumentException('The value cannot be longer than ' . $maxLenght);
        }
        $this->value = $value;
    }
}
``` 

Pero no podemos usarlo junto con `NotEmptyString` en `Name`, porque `NotEmptyString` no aceptará `MaxLengthString` como argumento, ya que espera un string.

```php
class Name
{
    private NotEmptyString $value;
    
    public function constructor(string $value)
    {
        $this->value = new NotEmptyString(new MaxLengthString($value, 3));
        
    }
}
```

Por supuesto, una forma de solucionarlo podría ser haciendo un _type cast_. Pero esto no pinta nada bien:

```php
class Name
{
    private NotEmptyString $value;
    
    public function constructor(string $value)
    {
        $this->value = new NotEmptyString((string)(new MaxLengthString($value, 3)));
    }
}
```

La otra posibilidad es que no usemos los validadores como tipos, sino como lo que son: validadores. En el fondo, esto:

```php
(string)(new MaxLengthString($value, 3))
```

Se podría escribir así:

```php
class MaxLengthString
{
    public static function validate($value, $maxLenght)
    {
        if (strlen($value) > $maxLenght) {
            throw new InvalidArgumentException('The value cannot be longer than ' . $maxLenght);
        }
        return $value;
    }
}
```

Y usarse así:

```php
MaxLengthString::validate($value, 3)
```

Pero, para qué vamos a hacer un objeto, si podemos tener una función:

```php
maxLengthString($value, 3)
```

## Un poco de reflexión

Pero volvamos un momento atrás. El problema de fondo es que la clase `Name` tiene una propiedad `value` que hemos definido como un `NotEmptyString` y esto nos condiciona a la hora de definir reglas de validación con otros objetos. En realidad, lo que queremos es que `Name` tenga un valor que cumpla con una serie de reglas de validación, pero no queremos que `Name` se quede atado a eso.

Sin embargo, si la propiedad `value` de Name es un string, lo que podemos es hacer que los validadores acepten y devuelvan strings. De esta forma, es sencillo componerlos. Aquí tenemos los validadores de antes, pero ahora como funciones:

```php
function notEmptyString(string $value): string
{
    if (empty($value)) {
        throw new InvalidArgumentException('The value cannot be empty');
    }
    return $value;
}
```

```php
function maxLengthString(string $value, int $maxLength): string
{
    if (strlen($value) > $maxLength) {
        throw new InvalidArgumentException('The value cannot be longer than ' . $maxLength);
    }
    return $value;
}
```

Y aquí los usamos:

```php
class Name
{
    private string $value;
    
    public function constructor(string $value)
    {
        $this->value = notEmptyString(maxLengthString($value, 3));
    }
}
```

Y para verlo mejor:

```php
class Name
{
    private string $value;
    
    public function constructor(string $value)
    {
        $this->value = notEmptyString(
                            maxLengthString($value, 3)
                      );
    }
}
```

## Otro ejemplo

Me he montado un pequeño side project para aprender Typescript y he empezado a aplicar esta misma idea. Vamos a ver un par de ejemplos. En este caso, he añadido un parámetro extra para poder indicar un mensaje de error personalizado.

El primero, el de que la cadena no sea vacía:

```typescript
export function NotEmptyString(value: string, error: string): string {
  if (!value) {
    throw new Error(error);
  }
  return value;
}
```

Este es un poco más sofisticado. Verifica que un valor se encuentre en un conjunto de valores válidos:

```typescript
export function OneOf<T>(value: T, validValues: T[], errorMessage: string): T {
  validValues.map((validValue) => {
    if (typeof validValue !== typeof value) {
      throw new Error(`${value} not the same type as ${validValue}`);
    }
  });

  if (!validValues.includes(value)) {
    throw new Error(
      `${errorMessage}: ${value} not in ${validValues.toString()}`,
    );
  }

  return value;
}
```

Aquí tenemos un ejemplo de uso:

```typescript
import { NotEmptyString } from './validators/NotEmptyString';

export class ProposalTitle {
  private readonly title: string;

  constructor(title: string) {
    this.title = NotEmptyString(title, 'Title must not be empty');
  }

  public toString() {
    return this.title;
  }
}
```

Y aquí otro en el que se pueden ver los validadores compuestos. La composición hace que falle primero el validador más interno, que es NotEmptyString, en el ejemplo. Si se supera esa validación, el valor se pasa a OneOf, que verifica que el valor esté en el conjunto de valores válidos.

```typescript
import { OneOf } from './validators/OneOf';
import { NotEmptyString } from './validators/NotEmptyString';

export class ProposalStatus {
  private readonly value: string;

  constructor(value: string) {
    // Example of composable validators. Maybe we don't need them to be objects
    this.value = OneOf(
      NotEmptyString(value, 'Status cannot be empty'),
      ['draft', 'submitted', 'accepted', 'rejected'],
      'Invalid proposal status',
    );
  }
}
```

Aquí tienes un test con varios ejemplos:

```typescript
import { OneOf } from './OneOf';
import { NotEmptyString } from './NotEmptyString';

describe('OneOf', () => {
  it('should accept valid values', () => {
    const validValues = [1, 2, 3];
    expect(OneOf(1, validValues, 'Invalid value')).toBe(1);
    expect(OneOf(2, validValues, 'Invalid value')).toBe(2);
    expect(OneOf(3, validValues, 'Invalid value')).toBe(3);
  });

  it('should fail if value is not in valid ones', () => {
    expect(() => OneOf(4, [1, 2, 3], 'Invalid value')).toThrow(
      'Invalid value',
    );
  });

  it('should fail if value is in different case', () => {
    expect(() => OneOf('A', ['a', 'b', 'c'], 'Invalid value')).toThrow(
      'Invalid value',
    );
  });

  it('should not mix value types', () => {
    expect(() => OneOf('a', ['a', 23, 'c'], 'Invalid value')).toThrow(
      'not the same type',
    );
  });

  it('should compose with others', () => {
    expect(
      OneOf(
        NotEmptyString('active', 'Empty string'),
        ['active', 'inactive'],
        'Invalid value',
      ),
    ).toBe('active');
  });

  it('should fail inside validator first', () => {
    expect(() => {
      OneOf(
        NotEmptyString('', 'Empty string'),
        ['active', 'inactive'],
        'Invalid value',
      );
    }).toThrow('Empty string');
  });

  it('should fail outside validator last', () => {
    expect(() => {
      OneOf(
        NotEmptyString('no valid status', 'Empty string'),
        ['active', 'inactive'],
        'Invalid status',
      );
    }).toThrow('Invalid status');
  });
});
```

## Resumiendo

Una de las cosas que me gusta de esta idea es que hace bastante legible el tipo de reglas que debe cumplirse en una validación. Es sencillo crear cualquier regla que se pueda necesitar y fácil componerlas. Es cierto que, en ocasiones, el hecho de que haya parámetros extra puede hacer el código verboso y quizá no tan legible como me gustaría.

Pero es un punto de partida.
