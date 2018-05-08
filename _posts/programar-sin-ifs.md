Para explicar la idea central de este artículo voy a poner un ejemplo un poco extremo.

Imagina una persona vegana que va a un restaurante a comer. Entra, estudia la carta y hace el pedido. Al rato llegar el primer plato: alitas de pollo, así que no lo come (recuerda, es vegana). De segundo, entrecot de ternera, que también devuelve sin tocar. Finalmente, el postre, flan de huevo, es también un plato que una vegana estricta no puede comer. Paga la cuenta y se va.

¿Te parece un patrón razonable? La verdad es que no lo parece.

¿Dónde está el problema?

En una primera respuesta diríamos que. para ser una persona vegana, su comportamiento no tiene sentido y lo que hace es tirar el dinero, aunque al no comer ninguno de los platos seleccionados ha sido coherente con sus ideas.

Otra forma de verlo es decir que esta persona podría haber tomado sus decisiones sobre la comida mucho antes, teniendo en cuenta su preferencia vegana.

Así de haber escogido un restaurante vegano para empezar podría haber comido cualquier plato de la carta sin dudar. Incluso, de haber entrado en un restaurante no vegano, podría haber escogido platos aceptables.

Sin embargo es como si no tomase en cuenta su rasgo vegano hasta el último momento, al decidir se ese plato de comida es adecuado para comer o no.

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
	private $diet;
	
	public function diet(): Diet
	{
		return $this->diet;
	}
}
```

Por supuesto, es una manera de modelarlo.

Ahora, imaginemos que algún comportamiento de Person tiene alguna relación con su `diet`, por ejemplo, `eat`.

Podemos tratarlo así, como hicimos antes:

```php
// ...

if ($person->diet() === new Diet('vegan')) {
	$person->eat('vegetables');
} elseif ($person->diet() === new Diet('veggie')) {
	$person->eat('vegetables');
} else {
	//...
}
```

No hay mucha encapsulación aquí, ¿verdad? En realidad, podríamos hacerlo de otra forma:

```php
// ...

class Person
{
	//...
	
	public function eat()
	{
		if ($this->diet() === new Diet('vegan')) {
			$food = 'vegetables';
       } elseif ($this->diet() === new Diet('veggie')) {
	      $food = 'vegetables';
	    } else {
			//...
	    }
	}
	//...
}

$person->eat();

```

Lo cierto es que sólo hemos movido las decisiones 




