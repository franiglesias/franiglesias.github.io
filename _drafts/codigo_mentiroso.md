---
layout: post
title: Código mentiroso
categories: articles
tags: [solid, good-practices]
---

En esencia, el código mentiroso es todo código que dice que hace algo, pero en realidad no lo hace, o hace algo diferente o desvía nuestra atención de algo que deberíamos saber.

## El nombre equivocado

Una buena parte de los casos de código mentiroso que he creado yo mismo o que me he encontrado tiene que ver con que le ponemos un nombre inadecuado a una variable, método, función o clase.

Por ejemplo:

```php
public function getAmount()
{
    return $this->quantity;
}

public function getPrice()
{
    return $this->amount;
}
```

Este ejemplo puede parecer un poco exagerado, pero ilustra bien la idea: los conceptos no solo parecen estar mal representados, sino que encima son incoherentes entre la estructura interna del objeto y su interfaz pública.

_Amount_, en inglés, puede referirse tanto a cantidad (no una cantidad concreta) como al importe total de una cuenta, por lo que por una parte tenemos un uso correcto, o más o menos correcto, en tanto que nos devolvería la cantidad, y por otra tenemos un uso incorrecto, porque internamente llamamos _amount_ a otro concepto que es el precio.

Veamos un ejemplo un poco menos exagerado que no es una corrección del anterior pero que también tiene cierto peligro:

```php
public function getAmount()
{
    return $this->amount;
}

public function getPrice()
{
    return $this->amount * $this->quantity;
}
```

Ahora tenemos cierta coherencia entre lo privado y lo público, pero es posible que la interfaz pública siga siendo engañosa porque los conceptos no estarían representados con los nombres adecuados. Normalmente, utilizaríamos _Price_ para referirnos al precio unitario de un producto, y _Amount_ para referirnos al importe total. O sea, que estamos representando los conceptos con las etiquetas lingüísticas equivocadas.

Sería más correcto así:

```php
public function getAmount()
{
    return $this->price * $this->quantity;
}

public function getPrice()
{
    return $this->price;
}
```

Ahora los conceptos están alineados en los ámbitos privado y público, lo que nos proporciona una buena base para trabajar: _Amount_ significa una cosa y siempre la misma cosa, lo mismo que _Price_.

Por si todavía no estuviese claro, no hay nada de malo en eliminar la ambigüedad en la interfaz pública:

```php
public function getTotalAmount()
{
    return $this->price * $this->quantity;
}

public function getUnitaryPrice()
{
    return $this->price;
}
```
Y para mantener la coherencia:

```php
public function getTotalAmount()
{
    return $this->unitaryPrice * $this->quantity;
}

public function getUnitaryPrice()
{
    return $this->unitaryPrice;
}
```

Llamar **mentiroso** al código con problemas de nombre es quizá un poco exagerado, pero hay pocas cosas tan molestas en el trabajo como estudiar un código que dice que hace lo que no está haciendo en realidad y que te lleva a buscar cosas en el sitio que no es.

## Efectos colaterales

Veamos el siguiente ejemplo:

```php
public function getSomething()
{
    $this->state = 'new state';
    return $this->something;
}
```

¿Cómo te quedas?

En el ámbito público este método devuelve información del objeto sobre el que se llama pero, a la vez, cambia el estado interno del mismo. Es decir, pedir la información tiene efectos colaterales sin que lo sepamos.

En programación, decimos que una función tiene efectos colaterales (_side effects_) si produce algún cambio en el estado del sistema, o de una parte del sistema. Ojo: que los llamemos _side effects_ no quiere decir que sean efectos indeseados. En algunos contextos de uso son indeseados y en otros es justo lo que queremos que ocurra.

Me explico: en programación orientada a objetos, tenemos objetos a los que:

* les pedimos que hagan algo
* les pedimos información sobre algo

Esto lo podemos reescribir de esta manera: a los objetos podemos enviarles mensajes para que:

* cambien su estado (side effect)
* nos informen sobre su estado

Al primer tipo de métodos/mensajes los solemos llamar commands (comandos, órdenes), el otro tipo son queries (preguntas).

Es decir: los comandos producen side effects y las queries, no.

Existe un patrón de diseño llamado CQS (Command Query Separation, en el que se basa CQRS) que nos dice justamente que los Commands no deben devolver información, mientras que las Queries no deben producir side effects.

Si no respetamos esta separación el código se convierte en mentiroso: nos dice que no pasan cosas, cuando en realidad sí están pasando.

### El comando cotilla

Veamos un ejemplo:

```php
class Car
{
    private $speed;
    
    public function __construct()
    {
        $this->speed = 0;
    }
    
    public function accelerate() : int
    {
        if ($this->speed < 120) {
            $this->speed++;
        }
        return $this->speed;
    }
    
    public function deccelerate() : int
    {
        if ($this->speed > 0) {
            $this->speed--;
        }
        return $this->speed;
    }
}
```

¿Cómo podemos averiguar la velocidad actual de Car?

Si atendemos a su interfaz pública resulta que, aparentemente, no podemos preguntarle al coche por su velocidad actual.

O tal vez sí, porque lo que parecen ser Commands resulta que devuelven información:

```php
$car = new Car();

$speed = $car->accelerate();
```

Sin embargo, aparte del hecho extraño de que necesitemos ejecutar una orden para obtener la respuesta a una pregunta, resulta que la respuesta que obtenemos no es la correcta.

```php
public function test_a_new_car_does_not_move()
{
    $car = new Car();
    $this->assertEquals(0, $car->accelerate());
}
```
El test fallará.

La respuesta siempre será diferente de la velocidad en el momento en que preguntamos, porque cuando preguntamos la velocidad cambia. Es como el principio de indeterminación.

```php
   public function test_a_new_car_does_not_move()
   {
       $car = new Car();
       $car->accelerate();
       $car->accelerate();
       $this->assertEquals(2, $car->accelerate());
   }
```

Claro que podríamos tener mala leche y hacerlo de otra manera:

```php
public function test_a_new_car_does_not_move()
{
    $car = new Car();
    $this->assertEquals(0, $car->deccelerate());
}
```

Entonces el test pasa, pero no porque la velocidad sea cero, si no porque en ese único caso, ejecutar el comando deccelerate no altera la velocidad pues el coche está parado. Y para saber eso, necesitamos conocer el código por dentro.

Así que, para liarla más, el test también nos engaña ya que es un sutil caso de test acoplado a la implementación y, por tanto, un test frágil.

La solución de este problema aplicando CQS es sencilla:

```php
class Car
{
    private $speed;
    
    public function __construct()
    {
        $this->speed = 0;
    }
    
    public function getSpeed() : int
    {
        return $this->speed;
    }
    
    public function accelerate()
    {
        if ($this->speed < 120) {
            $this->speed++;
        }
    }
    
    public function deccelerate()
    {
        if ($this->speed > 0) {
            $this->speed--;
        }
    }
}
```

Ahora, si queremos saber la velocidad actual del coche, no tenemos más que preguntar:

```php
public function test_a_new_car_does_not_move()
{
    $car = new Car();
    $this->assertEquals(0, $car->speed());
}
```

Da igual si ya nos estamos moviendo:

```php
public function test_a_new_car_does_not_move()
{
    $car = new Car();
    $car->accelerate();
    $car->accelerate();
    $this->assertEquals(2, $car->getSpeed());
}
```

### La pregunta hacendosa

Una query que produce side effects es código mentiroso porque cambia el estado del sistema cuando nos informa sobre él. Intentaré poner un ejemplo:

```php
class Product
{
    private $price;

    public function __construct($price)
    {
        $this->price = $price;
    }

    public function getPriceWithDiscount(float $discount) : float
    {
        $this->price -= $this->price * $discount;
        return $this->price;
    }
}
```

Seguro que ya has visto el problema, pero hagamos un test:

```php
public function test_it_applies_a_discount()
{
    $product = new Product(100);
    $this->assertEquals(90, $product->getPriceWithDiscount(.10));
}
```

Resulta que el test pasa. De momento, vamos bien.

Ahora, en producción, queremos hacer una de esas promociones en las que el descuento cambia según el número de unidades: hasta 5 unidades hacermos un 10% y un 20% a partir de 6 en adelante. Así que para mostrar la tabla, hacemos algo así:

```php
$firstFiveUnitsDiscountedPrice = $product->getPriceWithDiscount(.10);
$sixOrMoreUnitsDiscountedPrice = $product->getPriceWithDiscount(.20);
```

Y nos sale así:

  | Unidades | % Dto | Precio con descuento |   
  |:--------:|:-----:|:--------------------:|  
  |   1-5    |   10  |          90          |  
  |   6 +    |   20  |          72          |  

Algo no cuadra: el precio con descuento para 6 ó más unidades debería ser 80. Estamos ofreciendo nuestro producto ocho euros por debajo del precio que queremos, lo que se traduce en un mínimo de 48 euros dejamos de ingresar en cada venta de 6 unidades o más. Más que efectos colaterales, estos son daños colaterales.


