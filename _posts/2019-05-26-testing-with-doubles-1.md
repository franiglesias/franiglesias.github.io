---
layout: post
title: Guía para testear con dobles (1)
categories: articles
tags: testing
---

Se diría que uno de los puntos más problemáticos a la hora de testear sea, para muchas personas, el utilizar dobles: cuándo usarlos, cómo y un largo etcétera de preguntas. En este artículo voy a proponer una serie de consideraciones para testear con dobles y no sufrir.

## Los dobles se usan para tener bajo control el comportamiento de los colaboradores en una situación de test

La función de los dobles de test es tener bajo control el comportamiento de los colaboradores de modo que podamos eliminar su influencia sobre el comportamiento de la unidad bajo test o bien conocerla con exactitud y tenerlo en cuenta. 

Además, los dobles de test, nos ayudan a evitar dificultades derivadas de usar colaboradores que no controlamos o que introducen elementos indeseables como conexiones de red, sistemas de almacenamiento, servicios de terceros, etc.

Es decir, cuando hacemos un test de una unidad de software lo que queremos comprobar es que la respuesta o efecto de esa unidad se produce como resultado de que se ejecuta su código y solo su código. 

En esa situación no queremos testear lo que hacen los colaboradores, **sino que queremos decidir que harán o no en ese test concreto**.

## Se llaman dobles, no mocks, y los hay de varios tipos

Casi todo el mundo habla de mocks al referirse a los objetos que usamos para sustituir a los colaboradores de nuestra unidad bajo test. Sin embargo, llamarlos a todos mocks es un error. Cierto es que las librerías para fabricar dobles no ayudan en la terminología: desde `PHPUnit` que ofrece el método `createMock` o el `mockBuilder`, pasando por la conocida `mockery`.

Pero no, el nombre genérico es `test double`. Y es posible crear varios tipos de dobles:

* Dummies
* Stubs
* Spies
* Mocks
* Fakes

En el blog, hay un [artículo detallado sobre los diferentes test doubles](https://franiglesias.github.io/test-doubles-1/), pero haremos un repaso y trataremos algunas objeciones habituales sobre los mismos.

En esta entrega me centraré en los *dummies* y los *stubs*. Dejaré los spies,  los mocks y los fakes para otro artículo, pero todo lo que se dice aquí es aplicable a ellos. Lo peculiar de los *mocks* y los *spies* es que guardan información de como han sido utilizados. Pero en cuanto al comportamiento que simulan funcionan exactamente igual que los *dummies* y los *stubs*.

### Dummies

Los dummies son dobles que no tienen comportamiento. Esto quiere decir que todos sus métodos (públicos) devuelven `null`. En algún lugar se sugiere que deberían devolver una excepción para el caso de que la unidad bajo test utilice esos métodos. Sin embargo, que el dummy lance una excepción, aunque sea para protestar por el uso, no deja de ser un comportamiento, que además es exclusivamente técnico, y no me parece una buena práctica.

Nos interesa que los dummies devuelvan `null`. Eso quiere decir que no tienen comportamiento y, por lo tanto, no pueden influir en la respuesta o efecto de la unidad bajo test. Cuando la unidad bajo test u otro colaborador necesiten utilizar la respuesta de estos dummies protestarán por haber recibido un `null` en vez del tipo de valor esperado.

Se podría objetar que en algunos casos devolver `null` sería un comportamiento adecuado de un colaborador, o al menos un comportamiento posible, por lo que el resultado de un posible test podría ser confuso. 

En este caso, si esta situación te supone realmente un problema puede que debas reconsiderar si es adecuado para tu caso de uso que se pueda usar ese dato como `null` y si no sería mejor lanzar una excepción en su lugar. 

Los dummies normalmente se utilizan para poder construir el objeto que vamos a testear. Normalmente en construcción no necesitaremos ejecutar ninguno de sus métodos, simplemente asignarlos a los miembros adecuados de la clase bajo test. A continuación, tienes un ejemplo de un `setUp` en el que se instancia un objeto de la clase que vamos a testear y se le pasan varios colaboradores *dummies*:

```php
protected function setUp()
{
    $this->finishRegister = $this->createMock(FinishRegister::class);
    $this->cancelContract = $this->createMock(CancelContract::class);
    $this->guessDocumentType = $this->createMock(GuessDocumentType::class);
    $this->contractRepository = $this->createMock(ContractRepositoryInterface::class);

    $this->createValidRegister = new CreateValidRegister(
        $this->finishRegister,
        $this->cancelContract,
        $this->guessDocumentType,
        $this->contractRepository
    );
}
```

Un dummy también podría ser un argumento que pasamos a la unidad bajo test:

```php
$contract = $this->createMock(Contract::class);

$response = $sendContract->send($customer, $contract);

$this->assertEquals(Response::OK, $response);
```

### Stubs

Los *stubs* son dobles de test que tienen un comportamiento prefijado que siempre será el mismo. Dicho de otra manera: los métodos de un *stub* devuelven una respuesta preprogramada y **no calculada**. Se podría decir que un *dummie* es un *stub* que devuelve `null`, aunque a veces sí queremos simular que un objeto devuelve `null` como respuesta válida.

Es decir, los *stubs* simulan comportamientos posibles de un colaborador de nuestra unidad bajo test. Estos comportamientos pueden ser:

* Lanza una excepción, simulando que ha ocurrido algo malo.
* Devuelve algún tipo de respuesta válida, simulando que todo ha ido bien y el colaborador puede entregar su respuesta.

Esto nos permite crear un test de nuestra unidad bajo test que verifique su comportamiento cuando el colaborador falla, lanzando una excepción (si debe relanzarla, si debe devolver una respuesta especificada, etc), y también cuando el colaborador devuelve una respuesta válida. Además, en este caso, podría devolver diversos tipos de respuestas válidas.

Pero es importante insistir en que la respuesta del *stub* no puede ni debe ser calculada porque introduciría un factor de indeterminación en el test.

### *Stub* de una respuesta válida

Veamos aquí un ejemplo de un *stub* de un objeto, el cual hemos iniciado como *dummy* en el `setUp` que he mostrado más arriba:

```php
/** @var Contract | MockObject $contract */
$contract = $this->createMock(Contract::class);
$this->contractRepository
    ->method('byId')
    ->willReturn($contract);
```


En este caso, hacemos un *stub* del método `byId` del colaborador `ContractRepository` de modo que devuelve un objeto `Contract` (en este caso un dummy).

Con esto podemos verificar el comportamiento de nuestra unidad bajo test cuando `ContractRepository` le devuelve el contrato solicitado mediante su `id`.

### *Stub* de que se produce una excepción

Si queremos testear que la unidad bajo test reacciona de forma correcta en el caso de que no se encuentre el contrato, simularemos que se lanza una excepción:

```php
$this->contractRepository
    ->method('byId')
    ->willThrowException(new ContractNotFoundException());
```

### *Stub* de "ida y vuelta"

¿Y qué ocurre si el colaborador tiene que recibir datos de la unidad bajo test y devolverlos transformados? ¿No deberíamos tener algún modo de hacer que el stub devuelva una respuesta adecuada al dato recibido?

La respuesta a esta pregunta es un **no** rotundo.

Eso implicaría añadir alguna lógica en el *doble* y, como decíamos antes, se introduciría una indeterminación en el resultado del test: ¿cómo podemos asegurar que esa lógica para decidir la respuesta del doble no está afectando al comportamiento que queremos testear?

Además, eso introduce un acoplamiento del test a algo que está completamente fuera del código.

Entonces, ¿qué es lo que testeamos en ese caso? Pues en ese caso, estaríamos testeando la manera en que la unidad bajo test orquesta o coordina a sus colaboradores, y el comportamiento del colaborador estaría verificado por sus propios tests.

Supongamos que estamos programando un juego en el que el jugador puede utilizar objetos que aumentan su fuerza. Por tanto, la lógica del método obtiene un dato del propio jugador, lo pasa a un colaborador (el objeto que aumenta la fuerza) y este lo devuelve transformado. Algo así:


```php
public function useObject(StrengthImprover $strengthImprover)
{
    $this->strength = $strengthImprover->use($this->strength);
}
```


En el test:

```php
$player = new Player();

$strengthImprover = $this->createMock(StrengthImprover);
$strengthImprover
    ->method('use')
    ->willReturn(10);

$player->useObject($strengthImprover);

$this->assertEquals(10, $player->strength());
```

Nos da exactamente igual la fuerza que tenga el jugador o la que reciba. Lo que testeamos aquí es (a) que se usa el objeto y (b) que el valor que devuelve es asignado a la propiedad adecuada. Si el objeto multiplicaba o añadía fuerza, es algo que estará en sus propios tests.

