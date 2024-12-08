---
layout: post
title: Guía para testear con dobles (2)
categories: articles
tags: testing
---

En esta continuación hablaremos de los *mocks* y los *spies*.

En la entrega anterior decíamos que *mocks* y *spies* son exactamente iguales a los *dummies* y *stubs* en lo que respecta al comportamiento. La diferencia estriba en que podemos verificar si *mocks* y *spies* han sido usados de tal o cual manera por la unidad bajo test.

## *Mocks* y *spies* acoplan el test a la implementación de la unidad bajo test

La principal característica de los *mocks* y los *spies* es llevar un registro del modo en que han sido utilizados. Esto es: qué llamadas han recibido, cuántas veces y con qué parámetros.

Esto parece muy útil, y lo es, pero es también muy comprometedor para la calidad del test. Los *mocks* y *spies* no se limitan a ser *dummies* o *stubs*, simulando comportamientos de los colaboradores, sino que esperan que la unidad bajo test tenga una implementación concreta.

### Mocks

Los mocks son *dummies* o *stubs* que esperan ser utilizados de cierta manera concreta. Esta expectativa equivale a una aserción y cuenta como tal en las estadísticas de la suite de test.

Veamos un *mock* de un *dummy*. Supongamos que tenemos un colaborador `Logger` y simplemente queremos verificar que nuestra clase bajo test hace log de una cierta condición:

```php
$this->logger
    ->expects($this->once())
    ->method('notice');
```

El código anterior establece una expectativa sobre cómo la clase bajo test va a utilizar a su colaborador `logger`. El método `expects` representa un concepto similar a una aserción, indicando que el test pasará si se llama una vez al método `notice` del objeto `logger`. 

El mock de un stub es similar:

```php
$this->feeCalculator
    ->expects($this->once())
    ->method('calculate')
    ->willReturn(self::STANDARD_FEE_FOR_TWO_HOURS);
```

En este caso, además de establecer la expectativa, el mock, que sigue siendo un stub, simula una respuesta específica.

Es posible, aunque no siempre merece la pena, definir los parámetros esperados en la llamada. Siguiendo con el ejemplo anterior, vamos a suponer que esperamos el método `calculate` sea llamado con el parámetro `2`, que se referiría a las horas de las que queremos obtener la cuota o precio.

```php
$this->feeCalculator
    ->expects($this->once())
    ->method('calculate')
    ->with(2)
    ->willReturn(self::EXPECTED_FEE_FOR_TWO_HOURS);
```

Un inconveniente de los mocks es que mezclan las tres fases del test: [mientras que la simulación del comportamiento forma parte del Given o Arrange, la expectativa es claramente parte del Then o Assert](https://adamwathan.me/2016/10/12/replacing-mocks-with-spies/) y, además, debes definir la expectativa antes de la fase When o Act, es decir, antes de ejecutar la unidad bajo test.

### Spies

Los *spies* son, igualmente, *dummies* o *stubs* que registran el modo en que nuestro código interactúa con ellos y los utiliza, de modo que pueden llevar la cuenta de qué métodos han sido llamados, cuántas veces y con qué parámetros.

La ventaja sobre los *mocks* es que con ellos podemos hacer aserciones de manera explícita en el test, es decir, una vez ejecutada la unidad bajo test le preguntamos al *spy* lo que nos interese controlar de su uso.

En algunas librerías de test doubles existen métodos para usar los dobles como *spies*, pero los mocks nativos de PHPUnit son un poco pejigueros y no está bien documentado el [método para conseguirlos](https://lyte.id.au/2014/03/01/spying-with-phpunit/).

El ejemplo anterior, podría convertirse en un spy de esta manera:

```php
$this->feeCalculator
    ->expects($feeCalculatorSpy = $this->any())
    ->method('calculate')
    ->with(2)
    ->willReturn(self::EXPECTED_FEE_FOR_TWO_HOURS);
    
//...

$this->assertEquals(1, $feeCalculatorSpy->getInvocations());  

```

### La fragilidad de los tests con *mocks* y *spies*

El mayor inconveniente o riesgo de abusar de los *mocks* y *spies* es que el test queda acoplado a la implementación, ya que no testea el comportamiento de la unidad de software, sino que en el código se hacen ciertas llamadas y de una cierta manera.

De este modo, si en el futuro cambiamos esas llamadas, puede ocurrir que el test falle aunque no estemos intentando cambiar el comportamiento de la unidad. En otras palabras: el test falla, pero el comportamiento de la unidad es correcto.

A esto lo llamamos fragilidad del test: el riesgo de que un test no pase por un motivo que no sea su comportamiento.

## Cómo limitar la fragilidad de los tests que usan *mocks* y *spies*

Los *test doubles* son una parte necesaria de los tests en el nivel unitario, ya que necesitamos que los colaboradores de la unidad bajo test no ejecuten su propia lógica para no contaminar el resultado.

En otros niveles de testing podemos necesitar dobles que nos permitan simular sistemas remotos o sistemas que no podemos controlar (servicios web, mailers, clouds, etc).

Es decir, normalmente no podremos dejar de usar dobles, pero sí podemos usarlos con criterio. En este artículo daré unas ideas para hacerlo en el nivel unitario. En una próxima entrega intentaré desarrollar el tema de los dobles en los niveles de integración y de aceptación.

### Definir qué necesito testear aplicando el principio Command Query Separation

El principio **Command Query Separation** fue enunciado por Bertrand Mayer y dice más o menos esto:

> Every method should be either a command that performs an action, either a query that returns data.

Esto es, cada método o función puede ser:

* un comando: ejecuta una acción y produce un efecto en el sistema
* una query: hace una pregunta al sistema y devuelve algo

Por tanto, para testear cualquier método o función lo primero que tenemos que saber es si se trata de un comando o una query.

#### Testear queries

Si es una *query*, el test se basa en verificar que la respuesta que devuelve coincide con la que esperamos. Por tanto, tendremos *asserts* que se ocupen de eso. Si la unidad bajo test usa colaboradores, éstos serán doblados mediante *dummies* o *stubs*, y en ningún caso usaremos *mocks* o *spies*.

Puedo imaginar la siguiente objeción: 

> Pero quiero asegurarme de que se llama a cierto método del colaborador.

Respuesta corta: no quieres eso.

La respuesta larga a esta objeción es doble:

* En primer lugar, deberías testear el comportamiento de la unidad bajo test, no la forma en que se implementa. A la larga, esto te da la libertad de cambiar esa implementación en el futuro sin que los tests se vean afectados salvo, quizá, la parte del Given si utilizas colaboradores distintos.
* En segundo lugar, las llamadas al colaborador están implícitas en la ejecución de la unidad bajo test. La respuesta que devuelve es el resultado de la ejecución del código y, si se hace la llamada, el colaborador devolverá la respuesta simulada y se obtendrá algo que es función de esa respuesta, entre otros factores.

Como regla práctica, en un test de una query **nunca** se usarían métodos como  `expects`, `shouldBeCalled` o similar.

Así testearíamos un servicio `CalculateFee` que utiliza un colaborador 'FeeCalculator':

```php
$this->feeCalculator
    ->method('calculate')
    ->willReturn(self::STANDARD_FEE_FOR_TWO_HOURS);
    
$fee = $this->calculateFee->forHours(2);

$this->assertEquals($fee, self::STANDARD_FEE_FOR_TWO_HOURS);
```

#### Testear commands

En el nivel unitario, testear *commands* nos obliga a usar *mocks*. La razón es que la acción ejecutada por la unidad bajo test tendrá un efecto en algún elemento del sistema que habremos de simular mediante un doble.

Un buen ejemplo sería una unidad que construye una entidad y la guarda en un repositorio. En el nivel unitario no podremos acceder al repositorio para ver si está la entidad recién creada y guardada (a no ser que usemos un repositorio real, pero hemos quedado que en este nivel no lo haremos), por lo que necesitamos comprobar eso de otra manera.

La más sencilla es asegurarnos de que el método `save` o equivalente del repositorio sea llamado con una entidad, incluso controlando que sea la entidad que esperamos que se haya creado.

```php
$user = User::createFromUsername('user@example.com');

$this->userRepository
    ->expects(self::once())
    ->method('save')
    ->with($user);
    
$this->createUser->withUsername('user@example.com');
```

La regla de oro aquí es que solo deberíamos establecer expectativas para verificar que se produce el efecto esperado por la ejecución de la unidad bajo test. Y cuantas menos expectativas mejor. De hecho, si la unidad bajo test produce dos o más efectos lo ideal sería tener un test para cada uno de ellos.
 
### Limitar la verificación de parámetros de las llamadas

Personalmente no soy muy partidario de especificar en los *mocks* los parámetros con los que llamo a los colaboradores. Introducen fragilidad en el test y suponen un trabajo extra importante y el resultado no siempre compensa.

Sin embargo, reconozco que hay bastantes casos en los que puede ser necesario. El ejemplo anterior podría ser uno de ellos, ya que el dato clave que me permite identificar que estoy creando el usuario deseado es el parámetro que recibe la unidad bajo test y que debería usarse para instanciar el objeto `User`.

```php
$user = User::createFromUsername('user@example.com');

$this->userRepository
    ->expects(self::once())
    ->method('save')
    ->with($user);
    
$this->createUser->withUsername('user@example.com');
```

Ahora bien, cuando se trata de casos de uso en los que un colaborador recibe parámetros las respuestas (simuladas) de otros colaboradores creo que no es útil ni buena práctica verificarlo, es el caso de los dobles de `CreateContract` y `ContractRepository`. Fíjate también que la única expectativa se hace sobre el hecho de que se guarda el contrato, siendo implícito que se haya creado con el producto correcto. Lo que nos importa de este test, realmente, es cómo la unidad que testeamos coordina a los colaboradores.

```php
$product = $this->createMock(Product::class);

$this->productRepository
    ->method('getById')
    ->with('product-id-01')
    ->willReturn($product);
    
$this->createContract
    ->method('withProduct')
    ->willReturn($contract);
    
$this->contractRepository
    ->expects(self::once())
    ->method('save');
```

#### Asumir que los colaboradores doblados tienen sus propios tests

El ámbito de un test es la unidad que testeamos, los colaboradores garantizan su comportamiento mediante sus propios tests, por lo que tenemos que asumir es el que esperamos. 

No necesitamos testearlo de nuevo.

