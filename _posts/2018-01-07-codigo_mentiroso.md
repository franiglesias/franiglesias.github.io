---
layout: post
title: Código mentiroso
categories: articles
tags: design-principles refactoring php
---

En esencia, el código mentiroso es todo código que dice que hace algo, pero en realidad no lo hace, o hace algo diferente, o desvía nuestra atención de algo que deberíamos saber.

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

Veamos un ejemplo un poco menos exagerado que, sin ser una corrección del anterior, también tiene cierto peligro:

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

Ahora tenemos más coherencia entre lo privado y lo público, pero es posible que la interfaz pública siga siendo engañosa porque los conceptos no estarían representados con los nombres adecuados. Normalmente, utilizaríamos _Price_ para referirnos al precio unitario de un producto, y _Amount_ para referirnos al importe total. O sea, que estamos representando los conceptos con etiquetas lingüísticas equivocadas.

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

Ahora los conceptos están alineados en los ámbitos privado y público, lo que nos proporciona una buena base para trabajar: _Amount_ significa una cosa y siempre la misma cosa, lo mismo que _Price_. A esto es a lo que se refieren en DDD con lenguaje ubicuo: el lenguaje del dominio está presente en todas partes.

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

Llamar **mentiroso** al código con problemas de nombre es quizá un poco exagerado, pero hay pocas cosas tan molestas, e incluso peligrosas, en el trabajo como estudiar un código que dice que hace lo que no está haciendo en realidad y que te lleva a buscar cosas en el sitio que no es.

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

En el ámbito público este método devuelve información del objeto sobre el que se llama pero, a la vez, cambia su estado interno. Es decir, pedir la información tiene efectos colaterales sin que lo sepamos.

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

Si no respetamos esta separación el código se convierte en mentiroso: nos dice que no pasan cosas, cuando en realidad sí están pasando, o viceversa.

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
   public function test_a_car_accelerates()
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

Entonces el test pasa, pero no porque la velocidad sea cero, que lo es, sino porque **en ese único caso**, casualmente, ejecutar el comando deccelerate no altera la velocidad pues el coche ya está parado. Y para saber eso, necesitamos conocer el código por dentro.

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
    $this->assertEquals(0, $car->getSpeed());
}
```

Da igual si ya nos estamos moviendo:

```php
public function test_a_car_accelerates()
{
    $car = new Car();
    $car->accelerate();
    $car->accelerate();
    $this->assertEquals(2, $car->getSpeed());
}
```

### La pregunta hacendosa

Una query que produce side effects es código mentiroso porque cambia el estado del sistema mmientras nos informa sobre él. Intentaré poner un ejemplo:

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

Ahora, en producción, queremos hacer una de esas promociones en las que el descuento es distinto según el número de unidades: hasta 5 unidades hacermos un 10% y un 20% a partir de 6 en adelante. Así que para mostrar la tabla, hacemos algo así:

```php
$firstFiveUnitsDiscountedPrice = $product->getPriceWithDiscount(.10);
$sixOrMoreUnitsDiscountedPrice = $product->getPriceWithDiscount(.20);
```

Y nos sale así:

  | Unidades | % Dto | Precio con descuento |   
  |:--------:|:-----:|:--------------------:|  
  |   1-5    |   10  |          90          |  
  |   6 +    |   20  |          72          |  

Algo no cuadra: el precio con descuento para 6 ó más unidades debería ser 80. Estamos ofreciendo nuestro producto ocho euros por debajo del precio que queremos, lo que se traduce en un mínimo de 48 euros que dejamos de ingresar en cada venta de 6 unidades o más. Más que efectos colaterales, estos son **daños** colaterales.

Así que probemos con otro test:

```php
public function test_function_is_idempotent()
{
    $product = new Product(100);
    $this->assertEquals(90, $product->getPriceWithDiscount(.10));
    $this->assertEquals(90, $product->getPriceWithDiscount(.10));
}
```
WTF! ¡Este test falla! La función no es **idempotente**.

– Idem… ¿qué?

Idempotente. Se dice de una función que es **idempotente** cuando al ejecutarla con los mismos argumentos devuelve siempre los mismos resultados, da igual las veces que lo repitas.

Nuestro ejemplo no es idempotente, ya que si lo ejecutamos varias veces con el mismo argumento devuelve resultados diferentes cada vez. El caso es que debería serlo pues si tenemos un precio base y le aplicamos un descuento, el precio con descuento debería ser siempre el mismo. Eso nos indica que hay algo influyendo en esa función que no tendría que estar ahí.

En nuestro caso es fácil de ver mirando el código: la función cambia el estado interno de nuestro objeto Product al almacenar el precio descontado de nuevo en la propiedad price. La próxima vez que la apliquemos el precio de Product será otro.

El arreglo es también sencillo:

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
        $discountedPrice = $this->price - ($this->price * $discount);
        return $discountedPrice;
    }
}
```

Y ahora los test pasan y la función es idempotente.

## Cuestiones de visibilidad

Ya que hablamos de idempotencia… la idempotencia no es una propiedad que deban cumplir todas las funciones, ni mucho menos. 

Hay funciones que tienen que ser idempotentes porque necesitamos que devuelvan siempre el mismo resultado cuando les pasamos los mismos parámetros y el estado del sistema no ha cambiado. Dicho de otra forma: para resolver ciertos problemas necesitamos crear funciones idempotentes.

Otras funciones nos informan, precisamente, de los cambios del sistema y, por tanto, es deseable que nos den resultados distintos cada vez que las llamamos. Usamos continuamente funciones que no son idempotentes como, por ejemplo, `time()`, pero podríamos poner un montón de ejemplos.

Cada vez que ejecutamos `time()` nos devuelve un valor diferente porque nos está comunicando un valor que cambia constantemente.

Esto nos supone un problema cuando queremos hacer tests, pero no por la falta de idempotencia, sino por su **impredictibilidad**: no sabemos ni el día ni la hora en que se va a ejecutar el test, por lo tanto, no sabemos qué valor va a devolver `time()`.

Para poder testear un método de una clase que use `time()`, necesitamos realizar un diseño que nos permita mantener la impredictibilidad bajo control. Una estrategia es aislar la obtención de `time()` en un método privado de la clase, de modo que podamos sobreescribirlo en un futuro.

Veamos un ejemplo con esta clase `Post`. El estado de publicación se determina por la fecha de publicación (pubTime) en relación con la fecha actual.

```php
class Post
{
    private $pubTime;

    public function publish($pubTime = null)
    {
        if ($pubTime) {
            $this->pubTime = $pubTime;
            return;
        }
        $this->pubTime = $this->getCurrentTime();
    }

    public function isPublished()
    {
        if (!$this->pubTime) {
            return false;
        }
        return $this->pubTime <= $this->getCurrentTime();
    }

    private function getCurrentTime()
    {
        return time();
    }
}
```

En la clase `Post` se ha aislado la obtención de la hora actual en un método privado `getCurrentTime` y, como aplicamos DRY, pues lo utilizamos tanto tanto al asignar la fecha de publicación como para compararla.

El problema es que no podríamos testear esta clase tal cual está. Incluso pasando una fecha "cuidadosamente estudiada" para probar una publicación por adelantado, llegará un día en que la fecha del sistema adelantará a la fecha de publicación futura y el test fallaría.

```php
public function test_can_set_pubTime_in_advance_and_post_is_not_published()
{
    $post = new Post();
    $post->publish(strtotime('2038-12-31'));
    $this->assertFalse($post->isPublished());
}
```

Es decir, el test pasará, pero un día dejará de hacerlo.

Así que, para evitar estos problemas, es frecuente crear Testables que extienden la clase que queremos poner a prueba sobreescribiendo el método para devolver un valor conocido, lo que llamamos stub.

```php
class TestablePost extends Post
{
    private function getCurrentTime()
    {
        return strtotime('2017-12-06');
    }
}
```

De este modo, podemos comprobar el estado de un post en relación a la fecha preprogramada:

```php
public function test_can_set_pubTime_in_advance_and_post_is_not_published()
{
    $post = new TestablePost();
    $post->publish(strtotime('2018-01-06'));
    $this->assertFalse($post->isPublished());
}
```

Dado que, para nuestro TestablePost, hemos congelado el tiempo en el día 6 de diciembre de 2017, si fijamos la fecha de publicación de nuestro TestablePost al día de Reyes de 2018, se supone que no estará publicado y, por tanto, el test pasará. 

Pero imagina que estás haciendo el test justamente el día 6 de enero de 2018. Pues resulta que el test falla, nuestro TestablePost ha sido publicado: ¿habrán sido los Reyes Magos?.

No es magia, es una cuestión de visibilidad y de que la clase `TestablePost` nos está engañando.

Este test falla ahora porque el método `getCurrentTime` es privado y cuando lo llamamos desde métodos que están definidos en la clase `Post` (y no en `TestablePost`) se ejecuta el de la `Post`, no el de `TestablePost`. Por tanto, `getCurrentTime` devuelve la hora del sistema, no la que hemos preprogramado.

Si cambio la visibilidad del método en `TestablePost` no voy a cambiar este resultado. Tendría que cambiar la visibilidad en `Post` a `protected`, algo que no es precisamente una buena práctica.

Lo ideal sería que Post no tuviese que depender de `time()`, y esto se puede lograr de varias formas. 

Por ejemplo, utilizando una Specification para decidir si un Post está publicado o no. En buena medida, no es responsabilidad del Post saber cuándo le toca mostrarse como publicado, tan solo conocer su fecha de publicación. De este modo, es posible testear la Specification con Posts a medida que se publiquen en la fecha anterior o siguiente a la actual, así como testear Post sin tener que saber en qué día lo estamos haciendo.

En muchos casos, desarrollar la clase con la ayuda de TDD nos obliga a considerar estos problemas de diseño desde el primer momento y resolverlos antes de que se presenten siquiera.

## ¿Dos mentiras hacen una verdad? ¿O más bien una mentira más gorda?

Consideremos este código:

```php
public function getStudents(StudentCollection $students, Criteria $criteria)
{
    $results = $this->studentRepository->findAllBy($criteria);
    foreach($results as $student) {
        $students->add($student);
    }
}
```

¿Qué hace esta función? ¿Dónde están mis estudiantes?

El nombre getStudents sugiere bastante poderosamente que esa función sirve para obtener una lista de estudiantes, pero la verdad es que no devuelve nada. Entonces, ¿qué pasa?

Aprovechando que los objetos en PHP siempre se pasan por referencia, podemos pasarlos como parámetros de una función o método y, por tanto, los cambios que hagamos en ellos se mantendrán. Es decir, algo así como esto:

```php
//...

$students = new StudentsCollection();

$this->getStudents($students, $criteria);

$students->doSomething();
```

Veamos:

* Por el nombre del método, deducimos que es una query, pero no devuelve nada, así que es un command. Por tanto, miente.
* Sin embargo, el command obtiene una información, luego, es una query. Miente otra vez.

Aquí nada es lo que parece.

En realidad, el problema es que el sistema está mal diseñado.

Para empezar, `StudentRepository::findAllBy($criteria)` bien podría devolver directamente un objeto StudentCollection. Seguramente devuelve un array, lo que podría ser correcto (no lo es, pero eso es otra discusión).

Pero incluso en ese caso, ¿qué sentido tiene que `getStudents` no devuelva nada? Para eso tenemos dos opciones:

* Cambiemos el nombre del método por `populateStudentsCollection`.
* Encapsulemos toda la lógica relacionada con la colección dentro del método y devolvamos la colección explícitamente.

```php
public function getStudents(Criteria $criteria)
{
    $students = new StudentsCollection();
    $results = $this->studentRepository->findAllBy($criteria);
    foreach($results as $student) {
        $students->add($student);
    }
    return $students;
}
```

De modo que lo podamos usar de manera más limpia:

```php
//...
$students = $this->getStudents($criteria);
$students->doSomething();
```

Bastante mejor, ¿no crees?

Podría ocurrir que el motivo por el que las cosas se han hecho así sea que se quieren obtener estudiantes de diversas fuentes y lo que queremos es juntarlos en la misma colección. Algo así:

```php
//...

$students = new StudentsCollection();

$this->getStudents($students, $criteria);
$this->getStudents($students, $anotherCriteria);

$students->doSomething();
```

En este caso tenemos otras opciones y una de las más sencillas sería tener un método `merge` o `concat` en la clase StudentCollection, de modo que pudiésemos simplemente concatenar las colecciones de estudiantes encontradas, lo que nos permitiría obtenerlas de distintos repositorios o mezclando criterios (y podríamos tener Composites de criterios, así como otras soluciones).

## Código mentiroso y mal diseño

La conclusión de estos ejemplos es que normalmente podremos evitar el código mentiroso mediante un mejor diseño:

* asignando mejores nombres a los conceptos y siendo coherentes en su uso
* separarando commands de queries
* asegurándonos de testear la idempotencia de las funciones que necesiten esta propiedad
* aislando aquellas funciones que producen resultados no predecibles
* evitando los artificios para testear que pueden disimular estos problemas
* asignando correctamente las responsabilidades a las clases
* aplicando un enfoque OOP completo en nuestro diseño, evitando tipos como los array en la capa de dominio o de aplicación

El código que miente es un gran enemigo de la sostenibilidad, nos hace perder el tiempo explorando pistas falsas, nos lleva por caminos equivocados y, sobre todo, nos hace tener que recorrerlo línea por línea para saber qué es lo que realmente hace.

[Continuará](/codigo_mentiroso_2)
