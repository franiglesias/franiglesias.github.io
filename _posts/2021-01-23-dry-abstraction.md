---
layout: post
title: De abstracciones y duplicaciones
categories: articles
tags: design-principles good-practices
---

De vez en cuando encuentro algunos debates sobre el tema de que es mejor una duplicación que una mala abstracción. [Como esta en twitter, por ejemplo](https://twitter.com/c0rvid0/status/1350826080639324161).

![Veo a gente diciendo "duplicar es más barato que una mala abstracción" y mira... MIRA... Pa empezar, una mala abstracción no existe. O es una abstracción o es un truño. A lo mejor es que no sabéis abstraer y aquí tenemos el problema.](/assets/images/twitter-abstractions.png)

Se trata de un tema interesante que revela la tensión entre principios de diseño aparentemente opuestos y los compromisos a los que llegamos entre ellos para crear una solución de software. Pero también revela una cierta falta de profundidad a la hora de interpretar y aplicar los distintos principios que orientan el diseño de software.

En este caso concreto, el debate se suele centrar en el equilibro entre el principio DRY (*Don't repeat yourself*) y evitar el smell de *Premature abstraction*, que en algunos casos tiene que ver con el principio YAGNI (*you aren't gonna need it*).

Pero, ¿es *premature abstraction* realmente un exceso en la aplicación del principio DRY? ¿O será más bien un problema de no entender realmente el principio DRY y lo que son las abstracciones?

## Qué queremos decir con DRY

Este artículo [The cost of premature abstraction](https://medium.com/@thisdotmedia/the-cost-of-premature-abstraction-b5d71ffd6400) parece asumir que DRY se refiere a la duplicación de código. 

Veamos un ejemplo que yo mismo he perpetrado recientemente. Los siguientes dos métodos forman parte de un comando de consola para realizar una sincronización masiva de información:

```php
private function retrieveData(int $offset, int $limit): StatementInterface
{
	$sql  = $this->sql($offset, $limit);
	$stmt = $this->connection->prepare($sql, [
		PDO::ATTR_CURSOR => PDO::CURSOR_FWDONLY,
	]);

	Assert::isInstanceOf($stmt, StatementInterface::class, 'Data could not be retrieved.');

	$stmt->execute();

	return $stmt;
}

private function totalRecordsToProcess(): int
{
	$sql       = 'select count(*) from address';
	$stmt = $this->connection->prepare($sql);

	Assert::isInstanceOf($stmt, StatementInterface::class, 'Data could not be retrieved.');

	$stmt->execute();

	return (int)$stmt->fetchColumn(0);
}
```

Se puede ver la duplicación de código muy claramente, ¿verdad? La estructura es prácticamente idéntica en ambos casos. A primera vista parece un caso que pide a gritos la aplicación de DRY para obtener algo así:

```php
private function retrieveData(int $offset, int $limit): StatementInterface
{
	$sql     = $this->sql($offset, $limit);
	$options = [
		PDO::ATTR_CURSOR => PDO::CURSOR_FWDONLY,
	];

	return $this->executeSqlStatement($sql, $options);
}

private function totalRecordsToProcess(): int
{
	$sql     = 'select count(*) from address';
	$options = [];
	$stmt    = $this->executeSqlStatement($sql, $options);

	return (int)$stmt->fetchColumn(0);
}

private function executeSqlStatement(string $sql, array $options): StatementInterface
{
	$stmt = $this->connection->prepare($sql, $options);

	Assert::isInstanceOf($stmt, StatementInterface::class, 'Data could not be retrieved.');

	$stmt->execute();

	return $stmt;
}
```

La respuesta es que no. Esto no tiene que ver con DRY ni realmente con abstracciones. Diría que ni siquiera es una práctica particularmente recomendable. Veamos por qué.

**No, no es DRY**. El principio DRY se refiere a conocimiento, no a código. DRY viene a decir que sólo debería hacer una fuente de verdad sobre cualquier conocimiento en un programa. En este ejemplo, lo que tenemos son dos "unidades de conocimiento", representadas cada una por un método: una para saber cuántos registros se deben procesar y otra para obtener los que son. En último término, como se puede ver, no podemos dejar de mantener esas dos unidades de conocimiento, señal de que se refieren a dos cosas distintas.

**No, no es una abstracción**. Tampoco es que hayamos descubierto una abstracción. De hecho, como puedes ver en el ejemplo refactorizado, no podemos eliminar esas dos unidades de conocimiento. Lo que hemos extraído no es más que el conocimiento de ejecutar una una petición en SQL, que por otra parte ya estaba abstraído en  Connection y Statement, y devolver la respuesta.

**Puede que ni siquiera sea buena práctica**. Podríamos estar incluso ante un caso de *sobre-ingeniería*. En cierto modo hemos aplicado un patrón Facade, proporcionando una interfaz sencilla a un proceso relativamente más complicado. Esto puede ser buena idea si el código va a ser reutilizado en muchos lugares, pero no es el caso.

En resumen: lo único que hemos hecho es eliminar cierta duplicación del código que no era realmente necesaria, menos aún en el contexto del caso real.

## Abstracciones y dónde encontrarlas

Hablar de abstracciones puede ser bastante complejo. En realidad, en software se podría decir que todo es una abstracción, empezando por los propios lenguajes de programación, así que vamos a intentar reducir un poco el campo para no tener que escribir un tratado en varios tomos.

Las abstracciones parten de la observación de propiedades y comportamientos comunes en distintos objetos. Por ejemplo, podemos ver que las personas tienen propiedades comunes, como pueden ser la estatura o el peso, caminar erguidas, tener una cabeza y otras muchas, aunque sus valores sean distintos. Una cuestión interesante es que muchas de estas propiedades son compartidas por otros tipos de objetos.

Un conjunto de propiedades que están presentes en todos los integrantes de un grupo de objetos nos permite inducir una idea o concepto abstracto.

Cuando modelamos un sistema de software con el que resolver un problema una de las cosas que hacemos es intentar encontrar abstracciones. En muchos casos esas abstracciones son fáciles de plantear porque responden a conceptos bien establecidos en el dominio del problema y nuestro trabajo es expresarlos en código.

En otros, puede ocurrir que esos conceptos no sean lo bastante abstractos para resolver el problema con eficacia mediante un sistema de software. O también puede ser que en un principio las abstracciones sean suficientes, pero que en la evolución del dominio, emerjan nuevas necesidades que nos obliguen a revisar los conceptos iniciales.

Para ello podemos utilizar algunos heurísticos.

* Identificar propiedades y comportamientos que son comunes a distintos objetos.
* Identificar grupos de propiedades y comportamientos que cambian juntas.

Ambos heurísticos nos indican que ciertos objetos pueden ser ejemplos de un concepto general.

Por otro lado, las propiedades relevantes para considerar una abstracción serán distintas según el contexto. Dicho de otro modo, en distintos contextos, los mismos objetos pueden generar abstracciones diferentes.

## ¿Por qué podríamos estar identificando abstracciones no adecuadas?

Una razón es que tengamos prejuicios. Es decir, en lugar de atender a los datos y requisitos que tenemos, tratamos de ajustar el dominio a una idea preconcebida.

Otra posible razón es que no entendemos bien el dominio, lo que hará que nuestras abstracciones puedan resultar insuficientemente generales, o por el contrario, lo sean en exceso, cuando no directamente equivocadas.

En cualquier caso, para lograr buenas abstracciones, que es como decir, para modelar lo mejor posible un dominio, tenemos que saber de ese dominio. En DDD diríamos que tenemos que insistir en la parte de *knowledge crunching* para desarrollar un buen modelo mental.

Por otra parte, en los enfoques de diseño desarrollados a partir de detalles técnicos, como puede ser el enfoque database-first, los desarrollos muy acoplados a los frameworks o incluso la aplicación de ciertos modelos de arquitectura, es muy fácil caer en abstracciones erróneas ya que los requisitos técnicos van a condicionar nuestro modelado.

## ¿Podemos identificar abstracciones en el código?

Sí. De hecho, metodologías como TDD favorecen la identificación de abstracciones emergentes en el código. Los tests en TDD ponen a prueba el código contra ejemplos, cada vez más específicos, que provocan la necesidad de generalizar el código y para ello es necesario descubrir abstracciones relevantes.

El primer heurístico que tenemos en funcionamiento es la duplicación. Por lo general, la duplicación es una primera pista, aunque no definitiva, para identificar una abstracción potencial. Pero como señalábamos al principio del artículo, puede que nos encontremos ante un simple caso de una construcción de código duplicada que no representa realmente una abstracción. O en todo caso, que representa una abstracción puramente técnica.

Esto es. Puede que identifiquemos regularidades en una estructura, pero eso no quiere decir que sea el indicio de una abstracción relevante para el dominio o el contexto en el que estamos desarrollando una cierta unidad de software.

La otra pista es la covariación que, a su vez, tiene que ver con la cohesión. Es decir, las cosas que acostumbran a cambiar juntas van juntas y tienden a formar parte de un todo. Este es otro de los indicios de una abstracción emergente. En algunos casos, puede representar un comportamiento, en otros, puede representar un concepto que dará lugar a una entidad o un value object en el código.

Complementariamente, las cosas que no cambian junto con otras podrían estar dándonos pistas de nuevas abstracciones. El reverso de la cohesión, es que aquellas cosas que no cambian posiblemente no pertenezcan al mismo concepto que las que cambian juntas y, por tanto, deberían estar en otra parte. En algunos casos, esa otra parte podría llegar a constituir una abstracción... o no.

Si no se trata de conceptos relevantes en el dominio, es preferible dejarlos hasta que nueva información nos proporcione un contexto diferente.

Por otro lado, si se trata de constructos puramente técnicos, tenemos que valorar si es más útil intentar generalizarlos o asumir una cierta cantidad manejable de duplicación en el código.
