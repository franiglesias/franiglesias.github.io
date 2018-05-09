---
layout: post
title: Programar sin ifs
published: true
categories: articles
tags: php good-practices 
---
If/then es una de las estructuras de control básicas de la programación, pero su abuso puede multiplicar la complejidad de un algoritmo y su dificultad para mantenerlo. En este artículo exploraremos alguna estrategias para usar los if con cabeza.

Para explicar la idea central de este artículo voy a poner un ejemplo un poco extremo.

Imagina una persona vegana que va a un restaurante a comer. Entra, estudia la carta y hace el pedido. Al rato llegar el primer plato: alitas de pollo, así que no lo come (recuerda, es vegana). De segundo, entrecot de ternera, que también devuelve sin tocar. Finalmente, el postre, flan de huevo, es también un plato que una vegana estricta no puede comer. Paga la cuenta y se va.

¿Te parece un patrón razonable? La verdad es que no lo parece.

¿Dónde está el problema?

En una primera respuesta diríamos que. para ser una persona vegana, su comportamiento no tiene sentido y lo que hace es tirar el dinero, aunque al no comer ninguno de los platos seleccionados ha sido coherente con sus ideas.

Otra forma de verlo es decir que esta persona podría haber tomado sus decisiones sobre la comida mucho antes, teniendo en cuenta su preferencia vegana.

Así de haber escogido un restaurante vegano para empezar podría haber comido cualquier plato de la carta sin dudar. Incluso, de haber entrado en un restaurante no vegano, podría haber escogido platos aceptables.

Sin embargo es como si no tomase en cuenta su rasgo vegano hasta el último momento, al decidir se ese plato de comida es adecuado para comer o no.

## El tipo como antipatrón

En general, esta pauta de actuación la consideraríamos un antipatrón. Al menos, en el entorno social.

Sin embargo, cuando programamos es frecuente que caigamos en él:

```php
//...

$someObject = new Object();

if ($someObject->getType() === 'someType') {
    $someObject->doThis();
} else {
    $someObject->doThat();
}
//...
```

De hecho, este antipatrón [tiene un refactor](https://refactoring.guru/replace-type-code-with-class) y [otro](https://refactoring.guru/replace-type-code-with-subclasses)

Veamos el problema.

Es frecuente que un concepto tenga tipos. Siguiendo con el ejemplo inicial, as personas podrían clasificarse en varios grupos con respecto a la dieta: omnívoras, vegetarianas, veganas y otros en base a las diversas alergias alimentarias que puedan padecer.

Inicialmente, podríamos modelar esto con un campo, suponiendo que Diet es definido como un Value Object:

```php
class Person
{
    /** @var Diet **/
    private $diet;
    
    public function __construct(..., Diet $diet)
    {
        //...
        $this->diet = $diet;
        //...
    }

    public function diet(): Diet
    {
        return $this->diet;
    }
}
```

Por supuesto, es una manera de modelarlo.

Ahora, imaginemos que algún comportamiento de `Person` tiene alguna relación con su `diet`, por ejemplo, `eat`.

Podemos tratarlo así, como hicimos antes:

```php
// ...

$someFood = 'vegetables';

if (($person->diet() === new Diet('vegan') || $person->diet() === new Diet('veggie')) && $someFood === 'vegetables') {
    $person->eat($someFood);
} else {
    //...
}
```

Cada nuevo tipo de dieta y alimentos supone introducir nuevas combinaciones de condiciones y si ahora resulta complicado de leer, te puedes imaginar lo que sería este código aplicado, por ejemplo, a una aplicación de gestión de comidas en un colegio o en un hospital. La complejidad ciclomática se dispara porque acabará habiendo decenas de ramas en el árbol de decisión.

En realidad, podríamos hacerlo de otra forma:

```php
// ...

class Person
{
	//...
	
    public function eat(string $food)
    {
        if (($this->diet() === new Diet('vegan') || $this->diet() === new Diet('veggie'))
            && $food !== 'vegetables') {
            throw new InvalidFood('vegetables');
        } else {
            //...
        }
    }
	//...
}

$someFood = 'vegetables';
$person->eat($someFood);
```

Hemos movido la toma de decisiones a la clase `Person`, lo que hace el código principal más legible y eso es bueno. También nos ayuda un poco a introducir excepciones, lo que también es bueno.

Pero seguimos teniendo el mismo problema de complejidad y la raíz del mismo es que aplazamos hasta el último momento una decisión basada en una propiedad del objeto que se establece desde su creación.

Lo que ocurre es que esta propiedad define tipos de `Person`, al menos en relación con la interfaz relativa a `eat`, y cada uno de esos tipos tiene un comportamiento diferente (en este caso qué alimentos puede comer o no).

## Cuando los tipos son subclases

Una forma de expresar esto en código es mediante herencia.

Por ejemplo:

```php
class Vegan extends Person
{
    public function eat($food)
    {
        if ($food !== 'vegatables') {
            throw new InvalidFood('Vegans only eat vegetables.');
        }
        parent::eat($food);
    }
}

class Celiac extends Person
{
    public function eat($food)
    {
        if ($food->has('gluten')) {
            throw new InvalidFood('Celiacs can't eat foot containing gluten.');
        }
        parent::eat($food);
    }
}
```

Esto es, eliminamos la propiedad que define el tipo y creamos subclases de la clase base para representar todas sus variantes de comportamiento.

De este modo, la complejidad de las decisiones se reduce ya que cada subclase lidia con sus propios criterios al respecto de la comida.

Sin embargo, esta solución nos plantea el problema de instanciar el objeto concreto, algo que podemos resolver mediante una factoría o incluso un método factoría:

```php

class Person
{
    static public function createFromDiet(Diet $diet, /** extra data **/): Person
    {
        if ($diet === new Diet('vegan')) {
            return new Vegan(/** extra data **/);
        }
        if ($diet === new Diet('celiac')) {
            return new Celiac(/** extra data **/);
        }
        // ...
    }
}
```

De manera que podríamos usarlo así:

```php
    $person = Person::createFromDiet($diet, /** extra data **/);
    $person->eat($someFood);
```

## La belleza de la composición

Cuando el concepto con el que estamos trabajando tiene un sólo eje de clasificación en tipos la extensión en subclases mediante herencia puede ser una buena solución, aunque tiene inconvenientes. Por ejemplo, la violación del principio de Segregación de Dependencias. Al hacer subclases sólo porque necesitamos sobreescribir uno ó dos métodos también nos llevamos todo el resto de comportamiento que posiblemente sea irrelevante en el rasgo concreto de comportamiento que estamos atacando.

Además, podría ocurrir que haya más dimensiones en las que clasificar nuestro concepto, lo que supondría complicar mucho nuestra familia de clases.

Así que planteémoslo de otra manera.

Para empezar, delimitamos con una interfaz la dimensión sobre la que vamos a clasificar nuestro concepto base:

```php

interface CanEat
{
    public function eat($food);
}
```

Esta interfaz será implementada tanto por nuestra clase base como por [los decoradores](https://franiglesias.github.io/patron-decorador/) con los que vamos a modelar los diferentes tipos.

```php

class Person implements CanEat
{
    //...
    public function eat($food)
    {
        //...
    }
}

class Vegan implements CanEat
{
    private $person;
    
    public function __construct(Person $person)
    {
        $this->person = $person;
    }
    
    public function eat($food)
    {
        if ($food !== 'vegatables') {
            throw new InvalidFood('Vegans only eat vegetables.');
        }
        $this->person->eat($food);
    }
}

class Celiac implements CanEat
{
    private $person;
    
    public function __construct(Person $person)
    {
        $this->person = $person;
    }
    
    public function eat($food)
    {
        if ($food->has('gluten')) {
            throw new InvalidFood('Celiacs can't eat foot containing gluten.');
        }
        $this->person->eat($food);
    }
}
```


¿Y qué hay de su creación?

```php

class Person implements CanEat
{
    static public function createFromDiet(Diet $diet, /** extra data **/): CanEat
    {
        $person = new static(/** extra data**/);
        
        if ($diet === new Diet('vegan')) {
            return new Vegan($person);
        }
        if ($diet === new Diet('celiac')) {
            return new Celiac($person);
        }
        // ...
    }
}
```

Como resultado, tenemos un objeto que implementa la interfaz CanEat.

```php
    $personWithDiet = Person::createFromDiet($diet, /** extra data **/);
    $personWithDiet->eat($someFood);
```

Según nuestras necesidades podríamos hacer que los decoradores implementasen la totalidad de la interfaz de Person, o combinar decoradores según distintas interfaces.

## Es posible programar sin if

Bueno, realmente no es posible programar sin if. Todos los programas útiles conllevan algún tipo de toma de decisión, pero cuando se trata de programación orientada a objetos, lo ideal es que esas decisiones vayan implícitas en la naturaleza de cada objeto.

Al hacerlo así, reducimos la complejidad del código, a la vez que se vuelve más fácil de mantener, más extensible y más fácilmente testeable.
