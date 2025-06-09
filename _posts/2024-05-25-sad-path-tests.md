---
layout: post
title: Testeando lo que puede ir mal
categories: articles
series: vsa
tags: testing php
---

Este artículo puede considerarse una continuación del [que publicamos sobre reemplazar mocks por implementaciones alternativas](/outside-in-inside-out/). La diferencia es que esta vez, necesitamos simular los problemas, en lugar de los éxitos.

Cuando se desarrolla usando TDD lo normal es tener una buena cobertura de tests, pero eso no siempre significa que tengamos una buena cobertura de los posibles flujos que puede seguir el código. Hay que tener en cuenta las veces en que algo puede fallar y es necesario incluir tests que reflejen esas situaciones y como deben reaccionar a ellas los distintos componentes del software.

Podríamos categorizar estas circunstancias adversas en dos grandes grupos:

* Las que son provocadas por los propios datos, cuando estos no se ajustan a las restricciones o reglas de negocio. Aquí incluiremos todo lo que tiene que ver con datos de entrada inválidos que nuestro software debería identificar.
* Las que ocurren de forma no previsible por limitaciones del sistema, como pueden ser errores de conectividad, caídas de servicios externos, mala configuración, sobrecarga, y otros problemas que no tienen que ver con el comportamiento del negocio.

En lo que respecta a escribir tests para cubrir estos casos, hay que tener en cuenta que para el primer grupo necesitaremos conjuntos de datos que puedan disparar los problemas, mientras que en el segundo grupo tendremos que simular circunstancias adversas en los componentes.

Por otro lado, en el desarrollo necesitamos tener presente que cada componente tiene su parte de responsabilidad en la gestión del manejo de los problemas. Cuando hacemos un test en el que esperamos que algo pueda fallar, lo que testeamos es la forma en el componente maneja los posibles errores y ahí tenemos que hacer una nueva distinción:

* Los errores que se producen en colaboradores.
* Los errores que produce la propia la unidad bajo test.

## Fail fast

_Fail fast_ es un principio de diseño que básicamente dice que un módulo que encuentra un problema debe comunicarlo cuanto antes al módulo que lo llamó en primer lugar, sin intentar gestionar el error.

La idea que subyace es que el módulo que ha hecho la llamada tendría el contexto necesario para decidir qué hacer con ese error. Puede delegarlo, a su vez, hacia arriba, o tal vez, pueda emprender alguna acción alternativa que permita seguir con la ejecución por otro camino.

Ahora bien, en el caso de delegar hacia arriba, o sea, de retransmitir el problema, el módulo inmediatamente superior al que ha fallado, tiene que _traducir_ el problema para que su módulo superior pueda entenderlo. Se puede ver un ejemplo bastante claro en este código:

```php
final class DBALRetrieveProposal implements RetrieveProposal
{
    private Connection $connection;

    public function __construct(Connection $connection)
    {
        $this->connection = $connection;
    }


    /**
     * @throws DBALException
     * @throws Exception
     */
    public function __invoke(string $id): Proposal
    {
        $builder = $this->connection->createQueryBuilder();

        $query = $builder->select(
            'id',
            'title',
            'description',
            'author',
            'email',
            'sponsored',
            'type',
            'location',
            'status',
            'received_at'
        )
            ->from('proposal')
            ->where('id = ?')
            ->setParameter(0, $id);

        $result = $query->executeQuery();

        $readProposal = $result->fetchAssociative();

        return new Proposal(
            $readProposal['id'],
            $readProposal['title'],
            $readProposal['description'],
            $readProposal['author'],
            $readProposal['email'],
            $readProposal['type'],
            $readProposal['sponsored'],
            $readProposal['location'],
            $readProposal['status'],
            new DateTimeImmutable($readProposal['received_at'])
        );
    }
}
```

El método `__invoke` puede fallar por tres tipos de razones:

* `DBALException` es una excepción disparada por algún fallo al ejecutar la query o al recuperar los datos. En este punto no nos aporta más resolución, pues es un tipo de excepción de la librería DBAL que es la base de la que descienden todas las que se pueden producir. En resumidas cuentas, nos dice que el error ha ocurrido en la interacción con la base de datos física.
* `Exception` es una excepción genérica, que se dispararía en caso de que `new DateTimeImmutable($readProposal['received_at'])` fallase. En este caso, el dato solo puede estar mal si se ha escrito mal o ha ocurrido un error en la lectura que haya podido afectar a su estructura. O, incluso que se haya escrito de una forma no autorizada, como que se haya modificado manualmente la base de datos.
* No existe lo que buscamos: `DBALException` representa una buena cantidad de problemas que podemos tener: desde que no se puede acceder a la base de datos, hasta la inexistencia de un esquema o una tabla. Sin embargo, ¿qué ocurre con la ausencia de los datos esperados?

El primer caso se puede simular introduciendo un doble de test que dispare una excepción del tipo `DBALException` o alguna de sus descendientes. En todo caso, sabemos que sea como sea, esa operación de lectura es inviable, así que en lo que respecta a testing posiblemente no necesitemos entrar en mucho detalle. Otra cosa sería en el área de observabilidad, en la que nos interesa incluir el detalle necesario para entender qué ha fallado y así poder tomar las medidas adecuadas. Esto nos permitiría identificar algunas situaciones que, tal vez, nos interese simular en tests.

Ahora bien, `DBALException` es un tipo de error que ocurriría al utilizar una tecnología determinada porque estamos hablando de un adaptador. Si implementásemos el mismo servicio usando `MongoDB` el tipo de excepción sería diferente. Eso es algo que el _Handler_ no tiene que saber. El _Handler_ tendría que lidiar con excepciones algo más abstractas, como podría ser `ReadingException` o algo similar. En todo caso, no hacen referencia a una tecnología concreta, sino a su abstracción. Se puede decir que la interfaz `RetrieveProposal` tendría que definir excepciones para reflejar estos casos.

```php
interface RetrieveProposal
{
    public function __invoke(string $id): Proposal;
}
```

En el segundo caso, hay dos consideraciones que hacer. La primera sería: ¿qué sentido tiene controlar esta excepción?. Me explico: este error no hace imposible la lectura de la base de datos, ya se ha realizado de hecho, pero nos muestra datos que son correctos. Como comentamos antes, o bien denota un fallo en la validación y consistencia de los datos que se han escrito escribir, o bien nos dice que los datos han cambiado desde su escritura. 

Finalmente, cuando no se encuentra el dato deseado, ¿se trata de una circunstancia inesperada? Esto puede depender del contexto de nuestro negocio o de la acción concreta que estemos tratando. En nuestro caso, por ejemplo, si no se encuentra una Propuesta dado su identificador es que el identificador es incorrecto, bien sea por error al introducir el dato, bien sea porque se está intentando atacar de algún modo el sistema probando identificadores. En ambos casos, en el contexto de nuestro dominio se trataría de un error que se puede representar con una excepción.

En otros contextos, la ausencia de un registro en la base de datos puede obedecer a una buena razón. Por ejemplo:

* Bases de datos o sistemas que tienen que sincronizarse: un registro que está en una BD puede no haberse dado de alta todavía en la segunda, pues es un proceso que ocurre de forma asíncrona.
* Un sistema dual en el que conviven datos legacy con otros más modernos. Puede que se use uno como fallback del otro, al menos temporalmente.
* Simplemente, en ese dominio o en ciertos casos de uso es aceptable no encontrar algo, lo que podría dar lugar a insertarlo en el almacenamiento.

## Añadiendo tests a ReadProposal

Vamos a aplicar algunas de estas ideas a la feature de leer las propuestas. Tenemos que simular que algo falle en `RetrieveProposal`, es decir, simular que se producen las excepciones que hemos mencionado antes. Aunque para eso tendremos que hacer algunos cambios en el adaptador.

En el test actual del _happy path_ usamos la técnica de _self-shunt_. Nada nos impide introducir un nuevo test usando la misma técnica, pero para ello tendríamos que crear un nuevo TestCase. No hay ningún problema con esto, aunque tengamos la costumbre de agrupar varios test en un mismo TestCase. Usar un mismo TestCase es algo que podemos hacer por comodidad y tal vez re-aprovechar datos y objetos, aunque puede incrementar la complejidad. En caso de duda, haz un nuevo TestCase.

Si queremos tener todos los tests en un mismo TestCase, el _self-shunt_ ya no nos sirve y tendríamos que optar por introducir diferentes stubs del servicio, bien usando clases anónimas, bien usando clases estándar.

Como hicimos en el artículo anterior, vamos a ver ejemplos de las distintas aproximaciones, para que puedas decidir la que mejor te vaya.

### Qué vamos a testear

Como hemos visto más arriba tenemos dos tipos de excepciones que se pueden producir, algunas propias de la librería DBAL y otras genéricas. Sin embargo, `RetrieveProposal` en tanto que interfaz no debería devolver excepciones de `DBAL`, sino que debería traducirlas a otro tipo de excepciones más genéricas, que tengan sentido para la feature.

Ahora mismo no tenemos un test del adaptador `DBALRetrieveProposal`, en parte debido a que es bastante trivial. Pero para introducir la gestión de las excepciones, nos puede venir bien tener alguno, para lo cual tendremos que hacer un _mock_ de la clase `Connection` de la librería, a fin de simular su comportamiento sin tener que recurrir a una base de datos real.

Podemos hacerlo así:

```php
<?php

declare (strict_types=1);

namespace App\Tests\ForSendProposals\ReadProposal;

use App\ForSendProposals\ReadProposal\DBALRetrieveProposal;
use App\ForSendProposals\ReadProposal\ReadingProposalException;
use Doctrine\DBAL\Exception;
use Doctrine\DBAL\Query\QueryBuilder;
use PHPUnit\Framework\TestCase;
use Doctrine\DBAL\Connection;

final class DBALRetrieveProposalTest extends TestCase
{
    /** @test */
    public function should_manage_DBALException(): void
    {
        $connection = $this->createMock(Connection::class);

        $dbalRetrieveProposal = new DBALRetrieveProposal($connection);

        $builder = $this->createMock(QueryBuilder::class);
        $builder->method('select')->willReturn($builder);
        $builder->method('from')->willReturn($builder);
        $builder->method('where')->willReturn($builder);
        $builder->method('setParameter')->willReturn($builder);
        
        $builder->method('executeQuery')->willThrowException(new Exception('some exception'));

        $connection->method('createQueryBuilder')->willReturn($builder);

        $this->expectException(ReadingProposalException::class);
        ($dbalRetrieveProposal)('01HYGW7NKM6JGGQ9NM2A4VY5SG');
    }
}
```

En este caso usamos la librería de dobles de PHPUnit como primera aproximación. Como se puede ver es bastante farragoso, pero quizá sea la forma más sencilla para este caso. Connection, QueryBuilder y Result son clases que tendríamos que extender para doblar, por lo que resulta mucho más farragoso.

En todo caso, lo interesante son estas dos líneas:

```php
$builder->method('executeQuery')->willThrowException(new Exception('some exception'));

$this->expectException(ReadingProposalException::class);
```

La primera simula la excepción que podría lanzar la librería `DBAL`, y la segunda la excepción que esperamos que lance el adaptador `DBALRetrieveProposal`, que es la que queremos que `ReadProposalHandler` entienda.

```php
final class DBALRetrieveProposal implements RetrieveProposal
{
    private Connection $connection;

    public function __construct(Connection $connection)
    {
        $this->connection = $connection;
    }


    /**
     * @throws DBALException
     * @throws Exception
     * @throws ReadingProposalException
     */
    public function __invoke(string $id): Proposal
    {
        $builder = $this->connection->createQueryBuilder();

        $query = $builder->select(
            'id',
            'title',
            'description',
            'author',
            'email',
            'sponsored',
            'type',
            'location',
            'status',
            'received_at'
        )
            ->from('proposal')
            ->where('id = ?')
            ->setParameter(0, $id);

        try {
            $result = $query->executeQuery();
        } catch (DBALException $e) {
            throw new ReadingProposalException('Query to DB Failed', 1, $e);
        }

        $readProposal = $result->fetchAssociative();

        return new Proposal(
            $readProposal['id'],
            $readProposal['title'],
            $readProposal['description'],
            $readProposal['author'],
            $readProposal['email'],
            $readProposal['type'],
            $readProposal['sponsored'],
            $readProposal['location'],
            $readProposal['status'],
            new DateTimeImmutable($readProposal['received_at'])
        );
    }
}
```

El siguiente código también puede lanzar una excepción del mismo tipo base, aunque la posible razón sería diferente. Esto podría justificar definir un segundo tipo de excepción. No lo voy a hacer en este ejemplo para no desviar mucho el tema, pero voy a escribir el código mostrando cómo tendría que hacerse y volveremos a ello más adelante.

```php
$readProposal = $result->fetchAssociative();
```

Al igual que antes, tenemos que hacer un test que simule la implementación forzando que se tire una excepción al invocar el método `fetchAssociative`.

```php
final class DBALRetrieveProposalTest extends TestCase
{
    /** @test */
    public function should_manage_DBALException(): void
    {
        // Code removed for clarity
    }

    /** @test */
    public function should_manage_DBALException_in_result(): void
    {
        $connection = $this->createMock(Connection::class);
        $dbalRetrieveProposal = new DBALRetrieveProposal($connection);

        $result = $this->createMock(Result::class);
        $result->method('fetchAssociative')->willThrowException(new Exception('some exception'));

        $builder = $this->createMock(QueryBuilder::class);
        $builder->method('select')->willReturn($builder);
        $builder->method('from')->willReturn($builder);
        $builder->method('where')->willReturn($builder);
        $builder->method('setParameter')->willReturn($builder);
        $builder->method('executeQuery')->willReturn($result);

        $connection->method('createQueryBuilder')->willReturn($builder);

        $this->expectException(ReadingProposalException::class);
        ($dbalRetrieveProposal)('01HYGW7NKM6JGGQ9NM2A4VY5SG');
    }
}
```

Solo tenemos que capturar y relanzar la excepción traducida:

```php
final class DBALRetrieveProposal implements RetrieveProposal
{
    private Connection $connection;

    public function __construct(Connection $connection)
    {
        $this->connection = $connection;
    }


    /**
     * @throws Exception
     * @throws ReadingProposalException
     */
    public function __invoke(string $id): Proposal
    {
        $builder = $this->connection->createQueryBuilder();

        $query = $builder->select(
            'id',
            'title',
            'description',
            'author',
            'email',
            'sponsored',
            'type',
            'location',
            'status',
            'received_at'
        )
            ->from('proposal')
            ->where('id = ?')
            ->setParameter(0, $id);

        try {
            $result = $query->executeQuery();
        } catch (DBALException $e) {
            throw new ReadingProposalException('Query to DB failed', 1, $e);
        }

        try {
            $readProposal = $result->fetchAssociative();
        } catch (DBALException $e) {
            // Change the exception type if you need more resolution here
            throw new ReadingProposalException('Failed extracting data from result',
                2, $e);
        }

        return new Proposal(
            $readProposal['id'],
            $readProposal['title'],
            $readProposal['description'],
            $readProposal['author'],
            $readProposal['email'],
            $readProposal['type'],
            $readProposal['sponsored'],
            $readProposal['location'],
            $readProposal['status'],
            new DateTimeImmutable($readProposal['received_at'])
        );
    }
}
```

Al separar las capturas de excepciones en distintos `try/catch` puedo tratarlos de forma diferente aunque el tipo que capturamos sea el mismo, mientras que el contexto en que se lanzan las excepciones es diferente.

```php
try {
    $readProposal = $result->fetchAssociative();
} catch (DBALException $e) {
    // Change the exception type if you need more resolution here
    throw new ReadingProposalException('Failed extracting data from result',
        2, $e);
}
```

### Forzando excepciones con datos erróneos

El siguiente código puede lanzar una excepción, que según la versión de PHP puede ser la `Exception` genérica o `DateMalformedStringException`.

```php
new DateTimeImmutable($readProposal['received_at'])
```

Para provocarla tenemos que simular que se puede obtener un resultado de la base de datos, pero que este tiene el campo `received_at` con un valor que no se puede traducir a una fecha.


```php
final class DBALRetrieveProposalTest extends TestCase
{
    /** @test */
    public function should_manage_DBALException(): void
    {
        // Code removed for clarity
    }

    /** @test */
    public function should_manage_DBALException_in_result(): void
    {
        // Code removed for clarity
    }

    /** @test */
    public function should_manage_Exception_in_result(): void
    {
        $connection = $this->createMock(Connection::class);
        $dbalRetrieveProposal = new DBALRetrieveProposal($connection);

        $rawProposal = [
            'id' => '01HYJ6FZ92VTV6RWG7JYBJK0KE',
            'title' => 'Proposal Title',
            'description' => 'Brief description of the content',
            'author' => 'Fran Iglesias',
            'email' => 'fran.iglesias@example.com',
            'type' => 'talk',
            'sponsored' => false,
            'location' => 'Vigo, Galicia',
            'status' => 'waiting',
            'received_at' => 'xxx',
        ];

        $result = $this->createMock(Result::class);
        $result->method('fetchAssociative')->willReturn($rawProposal);

        $builder = $this->createMock(QueryBuilder::class);
        $builder->method('select')->willReturn($builder);
        $builder->method('from')->willReturn($builder);
        $builder->method('where')->willReturn($builder);
        $builder->method('setParameter')->willReturn($builder);
        $builder->method('executeQuery')->willReturn($result);

        $connection->method('createQueryBuilder')->willReturn($builder);

        $this->expectException(ReadingProposalException::class);
        ($dbalRetrieveProposal)('01HYGW7NKM6JGGQ9NM2A4VY5SG');
    }
}
```

Las líneas clave en este caso son:

```php
'received_at' => 'xxx',

$this->expectException(ReadingProposalException::class);
```

La primera es una cadena no parseable como fecha, lo que hará fallar la creación del DTO Proposal con una excepción de tipo `DateMalformedStringException`, que tendríamos que traducir a `ReadingProposalException` u otra que hayamos definido para expresar la situación.

```php
final class DBALRetrieveProposal implements RetrieveProposal
{
    private Connection $connection;

    public function __construct(Connection $connection)
    {
        $this->connection = $connection;
    }

    /**
     * @throws ReadingProposalException
     */
    public function __invoke(string $id): Proposal
    {
        $builder = $this->connection->createQueryBuilder();

        $query = $builder->select(
            'id',
            'title',
            'description',
            'author',
            'email',
            'sponsored',
            'type',
            'location',
            'status',
            'received_at'
        )
            ->from('proposal')
            ->where('id = ?')
            ->setParameter(0, $id);

        try {
            $result = $query->executeQuery();
        } catch (DBALException $e) {
            throw new ReadingProposalException('Query to DB failed', 1, $e);
        }

        try {
            $readProposal = $result->fetchAssociative();
        } catch (DBALException $e) {
            // Change the exception type if you need more resolution here
            throw new ReadingProposalException('Failed extracting data from result',
                2, $e);
        }

        try {
            $proposal = new Proposal(
                $readProposal['id'],
                $readProposal['title'],
                $readProposal['description'],
                $readProposal['author'],
                $readProposal['email'],
                $readProposal['type'],
                $readProposal['sponsored'],
                $readProposal['location'],
                $readProposal['status'],
                new DateTimeImmutable($readProposal['received_at'])
            );
        } catch (DateMalformedStringException|Exception $e) {
            throw new ReadingProposalException('Data could be corrupted', 3,
                $e);
        }

        return $proposal;
    }
}
```

Con esto deberíamos tener cubiertos todos los casos en los que `DBALRetrieveProposal` podría fallar y lo abstraemos en un error que tiene sentido en el contexto de la feature, pero que no está asociado a la implementación que estemos usando.

En este ejemplo, hemos agrupado todos los errores bajo el tipo `ReadingProposalException`, pero si necesitas más granularidad no tienes más que introducir otros tipos y relanzarlos cuando sea adecuado. Una forma práctica es extendiendo la misma `ReadingProposalException`. 

### Aumentando los tests de `ReadProposalHandler`

Ahora que la interfaz puede lanzar excepciones, es cuando podemos introducir su tratamiento en el _Handler_.

```php
interface RetrieveProposal
{
    /**
     * @throws ReadingProposalException
     */
    public function __invoke(string $id): Proposal;
}
```

Este, de momento, no espera ningún error:

```php
class ReadProposalHandler
{
    private RetrieveProposal $retrieveProposal;

    public function __construct(RetrieveProposal $retrieveProposal)
    {
        $this->retrieveProposal = $retrieveProposal;
    }


    public function __invoke(ReadProposal $readProposal): ReadProposalResponse
    {
        $proposal = ($this->retrieveProposal)($readProposal->id);

        return new ReadProposalResponse(
            $proposal->id,
            $proposal->title,
            $proposal->description,
            $proposal->author,
            $proposal->email,
            $proposal->type,
            $proposal->sponsored,
            $proposal->location,
            $proposal->status,
            $proposal->receivedAt,
        );
    }
}
```

¿Qué tendría que pasar? Básicamente, lo que queremos es que al recibir una excepción `ReadingProposalException`, el _Handler_ lance otra que podríamos considerar más relacionada con el dominio, como `ProposalNotFound`.

En este punto, podríamos argumentar con razón que no todos los errores de la persistencia significan exactamente _Not Found_. Ya hemos visto que en algunos casos podríamos tener problemas técnicos que impidan la lectura. Como he dicho antes, no hay ningún problema con eso, ya que simplemente podríamos exponer excepciones con más granularidad, y sería cuestión de capturarlas específicamente.

En este ejercicio no voy a detallar tanto las excepciones, pero podemos plantear un nombre de excepción un poco más genérico: `ProposalNotAvailable`, que junto con el mensaje y la pila de excepciones previas, debería ser suficiente para una aplicación pequeña.

Por supuesto, el motivo de separar excepciones sería tratar de responder mejor en el endpoint, con códigos de estado HTTP más precisos, a saber:

* 400: si se detecta un error en la petición, como un ID mal construido.
* 404: si no se encuentra la Proposal con el ID.
* 500: si el error está en el lado del servidor.

Esto lo podemos solventar bien usando una familia de excepciones más extensa o bien aprovechando los códigos de error. La primera puede ser una solución más sólida. No la voy a usar de momento, pues podemos introducir el cambio más adelante. En todo caso, no es más que añadir un `catch` extra y definir nuevas excepciones.

Volviendo al tema principal, vamos a ver como podemos introducir este test mediante _self-shunt_. Como hemos dicho antes, para ello necesitamos añadir un nuevo `TestCase`, lo cual no es ningún problema. De hecho, puede ser buena idea acostumbrarnos a no agrupar tantos tests en una sola clase.

```php
final class UnavailableReadProposalHandlerTest extends TestCase implements RetrieveProposal
{
    private const string PROPOSAL_ID = '01HXE2R5JBCRKAA3K0BZ1TCXT2';
    private const string NOW = '2024-05-15 21:05';

    /** @test */
    public function should_retrieve_proposal_with_id(): void
    {
        $handler = new ReadProposalHandler($this);
        $command = new ReadProposal(self::PROPOSAL_ID);

        $this->expectException(ProposalNotAvailable::class);

        ($handler)($command);
    }

    public function __invoke(string $id): Proposal
    {
        throw new ReadingProposalException(
            'some exception',
            1,
            new \Exception('some DB exception')
        );
    }
}
```

Como se puede ver, el test implementa el método `__invoke` de la interfaz `RetrieveProposal`, lanzando una excepción `ReadingProposalException` que hemos simulado.

Tenemos que definir la excepción `ProposalNotAvailable`, que podría ser una excepción de dominio. Sí, incluso aunque no tenemos una capa de dominio como tal, la idea de tener conceptos que son internos a la aplicación sigue presente.

```php
class ReadProposalHandler
{
    private RetrieveProposal $retrieveProposal;

    public function __construct(RetrieveProposal $retrieveProposal)
    {
        $this->retrieveProposal = $retrieveProposal;
    }

    public function __invoke(ReadProposal $readProposal): ReadProposalResponse
    {
        try {
            $proposal = ($this->retrieveProposal)($readProposal->id);
        } catch (ReadingProposalException $e) {
            throw new ProposalNotAvailable('Could not find Proposal', $e->getCode(), $e);
        }

        return new ReadProposalResponse(
            $proposal->id,
            $proposal->title,
            $proposal->description,
            $proposal->author,
            $proposal->email,
            $proposal->type,
            $proposal->sponsored,
            $proposal->location,
            $proposal->status,
            $proposal->receivedAt,
        );
    }
}
```

La implementación es bien sencilla. El punto donde puede aparecer la excepción es la llamada:

```php
$proposal = ($this->retrieveProposal)($readProposal->id);
```

Y el tipo de excepción que podemos esperar ahí es `ReadingProposalException`. De momento, no tenemos más, pero si fuese necesario podríamos incluir más bloques `catch` con los que traducir el error que debería llegar al controlador.


### Matizando las excepciones

He ido aplazando el tema de aumentar los tipos de excepciones para plantear una pequeña discusión relacionada con _Vertical Slice Architecture_. Uno de los puntos de esta propuesta es evitar el exceso de complejidad. Sin embargo, llega un punto en que las cosas se complican porque, en cierto modo, no queda más remedio.

El tema de las excepciones es un buen ejemplo. Como hemos ido viendo, tenemos varios tipos de problemas que pueden ocurrir al intentar leer una propuesta:

* No se puede buscar la propuesta, porque el ID no tiene un formato que podamos reconocer.
* La propuesta no existe con el ID aportado, que para el contexto de nuestro ejemplo sería algo excepcional porque el ID lo genera la aplicación al recibirla.
* Hay un error con la conexión a la base de datos y no podemos acceder, ya sea por el estado de la red o por mala configuración.
* Podemos acceder, pero algo falla al leer la información.
* Hemos podido recuperar información, pero por algún motivo no hemos podido recuperar la propuesta.

Estos casos podrían representarse mediante varias excepciones, las cuales mapearían con distintos errores HTTP:

| Problema                            |     Excepción     | HTTP |
|:------------------------------------|:-----------------:|:----:|
| ID no válido                        | InvalidProposalID | 400  |
| No se encuentra                     | ProposalNotFound  | 404  |
| No se puede conectar                |  DatabaseFailed   | 500  |
| Problemas al leer información       |  DatabaseFailed   | 500  |
| Problemas al recuperar la propuesta |  DatabaseFailed   | 500  |

La primera excepción podría lanzarla el propio Handler al validar el dato pasado por el controlador en el comando. También se podría argumentar que sea una validación en el controlador, ya que se trata de un asunto de formato de un tipo de dato. En último término es un caso de `Bad Request`

La segunda excepción es un error posible: la información que se pide no existe. Como hemos dicho, en nuestro caso lo consideramos una excepción porque en el contexto de trabajo la propuesta _tiene_ que estar ahí. Un `Not Found`.

El resto de excepciones son `ServerError`. El problema es que puede no ser fácil identificar cada tipo en el adaptador, ya que la librería declara un tipo genérico del cual derivan todos los demás que puede lanzar... y son unos cuantos.  

En todo caso, de cara a las posibles usuarias de la aplicación, nos basta con tres tipos de errores: el de validación, el de no encontrada y el de fallo fatal del sistema. Por simplificar hemos decidido agrupar estos últimos en un `DatabaseFailed` y dejar la interpretación al contenido del mensaje y al código de error.

Esto implica que debemos ir añadiendo algunos archivos más a la carpeta de la feature `ReadProposal`, que ya tiene unos cuantos:

```text
src/ForSendProposals/ReadProposal
├── DBALRetrieveProposal.php
├── Proposal.php
├── ProposalNotAvailable.php
├── ReadProposal.php
├── ReadProposalController.php
├── ReadProposalHandler.php
├── ReadProposalResponse.php
├── ReadingProposalException.php
└── RetrieveProposal.php
```

Como se puede apreciar, empieza a necesitar una cierta estructura, toda vez que algunos de los archivos se relacionan estrechamente entre sí. Mi punto es: incluso simplificando mucho, siempre nos vamos a encontrar con un cierto nivel de complejidad. Ya hemos visto que en PHP, para empaquetar recurrimos a los espacios de nombres, lo que se traduce en carpetas.

Así que antes de nada, vamos a empezar a organizar un poco el código, siguiendo el criterio usamos en `SendProposal`:

```text
src/ForSendProposals/ReadProposal
├── Proposal.php
├── ProposalNotAvailable.php
├── ReadProposal.php
├── ReadProposalController.php
├── ReadProposalHandler.php
├── ReadProposalResponse.php
└── RetrieveProposal
    ├── DBALRetrieveProposal.php
    ├── ReadingProposalException.php
    └── RetrieveProposal.php
```

De momento, no hay mucho más que rascar. En principio tenemos que introducir un par de excepciones nuevas: una que nos indique que no se han encontrado resultados en el nivel del adaptador y otra en el nivel del Handler que nos diga que no se ha encontrado la propuesta.

### Aumentando la granularidad de las excepciones del adaptador

En el adaptador vamos a asumir dos tipos de excepciones: la que indica un problema técnico que ha impedido leer los datos, y la que indica que no existe ese dato en base de datos.

Ahora mismo, todas las excepciones que puedan ocurrir están representadas por el tipo `ReadingProposalException` y para no añadir más archivos de los necesarios, vamos a usar esta para indicar problemas con la base de datos. Por ese lado, no tenemos que tocar más.

Lo que nos queda es simular que no se ha encontrado ninguna propuesta guardada y esperar que se lance una nueva excepción: `DataNotFound` que extiende de `ReadingProposalException`, que tiene que dejar de ser `final`, por cierto.

```php
final class DBALRetrieveProposalTest extends TestCase
{
    // Code removed for clarity
    
    /** @test */
    public function should_manage_no_result(): void
    {
        $connection = $this->createMock(Connection::class);
        $dbalRetrieveProposal = new DBALRetrieveProposal($connection);

        $result = $this->createMock(Result::class);
        $result->method('fetchAssociative')->willReturn(false);

        $builder = $this->createMock(QueryBuilder::class);
        $builder->method('select')->willReturn($builder);
        $builder->method('from')->willReturn($builder);
        $builder->method('where')->willReturn($builder);
        $builder->method('setParameter')->willReturn($builder);
        $builder->method('executeQuery')->willReturn($result);

        $connection->method('createQueryBuilder')->willReturn($builder);

        $this->expectException(DataNotFound::class);
        ($dbalRetrieveProposal)('01HYGW7NKM6JGGQ9NM2A4VY5SG');
    }
}
```

Y esta sería una posible implementación, ya que `fetchAssociative` devolverá `false` si no ha encontrado nada.

```php
final class DBALRetrieveProposal implements RetrieveProposal
{
    private Connection $connection;

    public function __construct(Connection $connection)
    {
        $this->connection = $connection;
    }


    /**
     * @throws ReadingProposalException
     */
    public function __invoke(string $id): Proposal
    {
        $builder = $this->connection->createQueryBuilder();

        $query = $builder->select(
            'id',
            'title',
            'description',
            'author',
            'email',
            'sponsored',
            'type',
            'location',
            'status',
            'received_at'
        )
            ->from('proposal')
            ->where('id = ?')
            ->setParameter(0, $id);

        try {
            $result = $query->executeQuery();
        } catch (DBALException $e) {
            throw new ReadingProposalException('Query to DB failed', 1, $e);
        }

        try {
            $readProposal = $result->fetchAssociative();
        } catch (DBALException $e) {
            // Change the exception type if you need more resolution here
            throw new ReadingProposalException('Failed extracting data from result',
                2, $e);
        }

        if (!$readProposal) {
            throw new DataNotFound("Proposal with id $id was not found");
        }

        try {
            $proposal = new Proposal(
                $readProposal['id'],
                $readProposal['title'],
                $readProposal['description'],
                $readProposal['author'],
                $readProposal['email'],
                $readProposal['type'],
                $readProposal['sponsored'],
                $readProposal['location'],
                $readProposal['status'],
                new DateTimeImmutable($readProposal['received_at'])
            );
        } catch (DateMalformedStringException|Exception $e) {
            throw new ReadingProposalException('Data could be corrupted', 3,
                $e);
        }

        return $proposal;
    }
}
```

Este cambio tendrá consecuencias en `ReadProposalHandler`, ya que ahora tenemos que gestionar una nueva excepción y relanzarla con otra nueva. Sin embargo, es interesante señalar que gracias a que respondemos a la excepción más genérica, no nos supondría un problema a la hora de desplegar, por ejemplo. En general, me parece buena idea tener siempre un _fall back_ en los `try/catch` que gestione la excepción más genérica posible, aparte de las específicas.

Tenemos que pasar al Handler a continuación, para dar soporte al nuevo tipo de excepción y retransmitir una más adecuada. Vamos a seguir la misma técnica y extender `ProposalNotAvailable` en `ProposalNotFound`. Con ayuda del siguiente test:


```php
final class NotFoundReadProposalHandlerTest extends TestCase implements RetrieveProposal
{
    private const string PROPOSAL_ID = '01HXE2R5JBCRKAA3K0BZ1TCXT2';

    /** @test */
    public function should_retrieve_proposal_with_id(): void
    {
        $handler = new ReadProposalHandler($this);
        $command = new ReadProposal(self::PROPOSAL_ID);

        $this->expectException(ProposalNotFound::class);

        ($handler)($command);
    }

    public function __invoke(string $id): Proposal
    {
        throw new DataNotFound(
            'some exception'
        );
    }
}
```

Test que podemos hacer pasar con lo siguiente:

```php
class ReadProposalHandler
{
    private RetrieveProposal $retrieveProposal;

    public function __construct(RetrieveProposal $retrieveProposal)
    {
        $this->retrieveProposal = $retrieveProposal;
    }


    public function __invoke(ReadProposal $readProposal): ReadProposalResponse
    {
        try {
            $proposal = ($this->retrieveProposal)($readProposal->id);
        } catch (DataNotFound $e) {
            throw new ProposalNotFound('Could not find Proposal', $e->getCode(), $e);
        } catch (ReadingProposalException $e) {
            throw new ProposalNotAvailable('Could not find Proposal', $e->getCode(), $e);
        }

        return new ReadProposalResponse(
            $proposal->id,
            $proposal->title,
            $proposal->description,
            $proposal->author,
            $proposal->email,
            $proposal->type,
            $proposal->sponsored,
            $proposal->location,
            $proposal->status,
            $proposal->receivedAt,
        );
    }
}
```

Y con esto habríamos mejorado la capacidad del Handler de entender y gestionar los errores que se pueden producir en la persistencia al recuperar un Proposal.

Algunas observaciones:

La técnica de _self-shunt_ nos ha permitido, en este caso, introducir unos tests muy sencillos, aunque podrían resultar un tanto _peculiares_ para algunas personas. Entre sus ventajas está que no nos fuerzan a introducir nuevos objetos, ni archivos. También que todo lo que necesitamos saber sobre el test está contenido en el propio tests. En su contra juega que resulta confuso que el propio test sea el doble de un colaborador de la unidad bajo tests.

Una de las alternativas es la creación de dobles a partir de clases anónimas, algo que ya hicimos y que explotaremos a continuación al hacer los tests unitarios del controlador.

Por otro lado, para que _self-shunt_ sea viable, necesitamos que las interfaces sean pequeñas, con uno o dos métodos como mucho. Como normal general, las interfaces tienen que ser pequeñas y salvo casos muy justificados no deberían tener más de dos o tres métodos. Si tienes más que eso, tu clase está mal diseñada.

### Traducir las excepciones a respuestas HTTP

Por el momento, en el controlador todas las excepciones provocan un error 500 y no tenemos una forma adecuada de fallar. En realidad, no estamos gestionando errores, sino que el framework hace el trabajo por nosotras. Si una excepción llega hasta el controlador, el framework hace que la aplicación falle con un error fatal.

Por supuesto, tenemos que capturar las excepciones para poder ofrecer una respuesta controlada a la usuaria.

Por otro lado, para este ejemplo, vamos a poner la validación del input en este componente. La razón es que aquí esperamos un parámetro que debería tener una forma o tipo concreto (ULID). Esta validación, a mi juicio, no corresponde al dominio, sino que es un detalle de implementación. El controlador, por tanto, será responsable de no dejar pasar ID que no tengan la forma e ULID válidos. Que ya existan o no en el sistema es otra cuestión que ya hemos manejado.

Como nota al margen, tengo que decir que los frameworks de validación me dan una pereza enorme. Aparte, habitualmente se usan mal porque se intenta aplicarlos para validaciones semánticas o de dominio, cuando su uso debería limitarse a la validación sintáctica de inputs. Fin de la nota.

Tenemos dos tipos de problemas con los que lidiar:

* La validación del input, en este caso, el parámetro id.
* La gestión de las excepciones que vengan del Handler.

### Errores de validación

Los errores de validación deberían devolver errores con status 400 y una indicación fácil de interpretar de los problemas encontrados. Por ejemplo, un objeto JSON que señale los campos fallidos y el tipo de problema. Esto aplica particularmente a los mensajes POST, PUT y PATCH. 

En nuestro caso concreto es un poco distinto, dado que el ID es un parámetro pasado por URL. Quizá sería más correcto usar un 404 (Not found), pero, por otro lado, queremos distinguir entre el "No encontrado" y el "ni siquiera puedo empezar a buscar con esto", por lo que prefiero usar un 400.

Este test es fácil de hacer, pero necesitamos un Handler dummy, pues ni siquiera lo vamos a llegar a invocar. De todos modos, volvamos a echar un vistazo al test que ya tenemos:

```php
final class ReadProposalControllerTest extends TestCase
{
    public const string PROPOSAL_ID = '01HXMBMMXAG7S1ZFZH98HS3CHP';
    public const string NOW = '2024-05-15 12:34:56';

    /** @test */
    public function should_retrieve_proposal_by_id(): void
    {
        $handler = new ReadProposalHandler($this->buildRetrieveProposalDouble());
        $controller = new ReadProposalController($handler);

        $request = $this->buildRequest('/api/proposals/' . self::PROPOSAL_ID);
        $response = ($controller)(self::PROPOSAL_ID, $request);

        assertEquals(200, $response->getStatusCode());
        assertEquals($this->buildExpectedPayload(), $response->getContent());
    }

    private function buildRetrieveProposalDouble(): RetrieveProposal
    {
        return new class() implements RetrieveProposal {

            public function __invoke(string $id): Proposal
            {
                return new Proposal(
                    ReadProposalControllerTest::PROPOSAL_ID,
                    'Proposal Title',
                    'A description or abstract of the proposal',
                    'Fran Iglesias',
                    'fran.iglesias@example.com',
                    'talk',
                    true,
                    'Vigo, Galicia',
                    'waiting',
                    new \DateTimeImmutable(ReadProposalControllerTest::NOW),
                );
            }
        };
    }

    private function buildRequest(string $uri): Request
    {
        return Request::create(
            $uri,
            'GET',
            [],
            [],
            [],
            ['CONTENT-TYPE' => 'json/application'],
        );
    }

    private function buildExpectedPayload(): string|false
    {
        return json_encode(
            [
                'id' => self::PROPOSAL_ID,
                'title' => 'Proposal Title',
                'description' => 'A description or abstract of the proposal',
                'author' => 'Fran Iglesias',
                'email' => 'fran.iglesias@example.com',
                'type' => 'talk',
                'sponsored' => true,
                'location' => 'Vigo, Galicia',
                'status' => 'waiting',
                'receivedAt' => new \DateTimeImmutable(self::NOW),
            ]
        );
    }
}
```

En el artículo anterior decidimos no doblar el _Handler_, sino usar un doble de `StoreProposal`. En parte, por el hecho de no tener una interfaz declarada. Sin embargo, ahora me cuestiono esta decisión porque resulta mucho más complicada de gestionar para el caso de los _sad paths_. Así que vamos a ver una técnica alternativa, extendiendo la clase.

Introducimos un TestCase nuevo y vamos a crear un dummy para poder usarlo. Lanzamos una excepción para que quede claro que no debería llamarse. El test quedaría más o menos así:

```php
final class InvalidaIdReadProposalControllerTest extends TestCase
{
    public const string PROPOSAL_ID = '123456789';

    /** @test */
    public function should_fail_with_bad_request(): void
    {
        $handler = $this->buildDummyHandler();
        $controller = new ReadProposalController($handler);

        $request = $this->buildRequest('/api/proposals/' . self::PROPOSAL_ID);
        $response = ($controller)(self::PROPOSAL_ID, $request);

        assertEquals(400, $response->getStatusCode());
        assertEquals($this->buildExpectedPayload(), $response->getContent());
    }

    private function buildRequest(string $uri): Request
    {
        return Request::create(
            $uri,
            'GET',
            [],
            [],
            [],
            ['CONTENT-TYPE' => 'json/application'],
        );
    }

    private function buildExpectedPayload(): string|false
    {
        return json_encode(
            [
                'errors' => [
                    sprintf('Invalid Id: %s', self::PROPOSAL_ID)
                ]
            ]
        );
    }

    private function buildDummyHandler(): ReadProposalHandler
    {
        return new class() extends ReadProposalHandler {
            public function __construct()
            {
            }

            public function __invoke(ReadProposal $readProposal
            ): ReadProposalResponse {
                throw new RuntimeException('This method should not be called.');
            }
        };
    }
}
```

A este test podemos responder con este código, que mete bastante ruido, por cierto. Ya veremos como arreglarlo.

```php
final class ReadProposalController
{
    private ReadProposalHandler $handler;

    public function __construct(ReadProposalHandler $handler)
    {
        $this->handler = $handler;
    }

    public function __invoke(string $id, Request $request): Response
    {
        try {
            Ulid::fromString($id);
        } catch (InvalidUlidStringException $e) {
            $response = [
                'errors' => [
                    sprintf('Invalid Id: %s', $id)
                ],
            ];
            return new JsonResponse($response, Response::HTTP_BAD_REQUEST);
        }
        $query = new ReadProposal($id);
        $response = ($this->handler)($query);

        return new JsonResponse($response, Response::HTTP_OK);
    }
}
```

### Captura de las excepciones del Handler

Sabemos que el Handler puede emitir dos excepciones: una para señalar que no se ha encontrado Proposal con el ID aportado y otra indicando que ha ocurrido un error que ha impedido completarla. Tendremos que crear un stub para cada situación.

Seguimos usando la técnica de hacerlo mediante clases anónimas, lo que nos evita multiplicar los archivos.

```php
final class NotFoundReadProposalControllerTest extends TestCase
{
    public const string PROPOSAL_ID = '01HXMBMMXAG7S1ZFZH98HS3CHP';
    public const string NOW = '2024-05-15 12:34:56';

    /** @test */
    public function should_fail_with_not_found(): void
    {
        $handler = $this->buildNotFoundHandler();
        $controller = new ReadProposalController($handler);

        $request = $this->buildRequest('/api/proposals/' . self::PROPOSAL_ID);
        $response = ($controller)(self::PROPOSAL_ID, $request);

        assertEquals(404, $response->getStatusCode());
        assertEquals($this->buildExpectedPayload(), $response->getContent());
    }

    private function buildRequest(string $uri): Request
    {
        return Request::create(
            $uri,
            'GET',
            [],
            [],
            [],
            ['CONTENT-TYPE' => 'json/application'],
        );
    }

    private function buildExpectedPayload(): string|false
    {
        return json_encode(
            [
                'errors' => [
                    'No proposal with Id',
                ]
            ]
        );
    }

    private function buildNotFoundHandler(): ReadProposalHandler
    {
        return new class() extends ReadProposalHandler {
            public function __construct()
            {
            }

            public function __invoke(ReadProposal $readProposal
            ): ReadProposalResponse {
                throw new ProposalNotFound('No proposal with Id');
            }
        };
    }
}
```

Y el código de producción cambia de esta manera. Sigue habiendo bastante ruido, pero voy a esperar al siguiente caso y reorganizar el código al final.

```php
final class ReadProposalController
{
    private ReadProposalHandler $handler;

    public function __construct(ReadProposalHandler $handler)
    {
        $this->handler = $handler;
    }

    public function __invoke(string $id, Request $request): Response
    {
        try {
            Ulid::fromString($id);
        } catch (InvalidUlidStringException $e) {
            $response = [
                'errors' => [
                    sprintf('Invalid Id: %s', $id)
                ],
            ];
            return new JsonResponse($response, Response::HTTP_BAD_REQUEST);
        }
        $query = new ReadProposal($id);

        try {
            $response = ($this->handler)($query);
        } catch (ProposalNotFound $e) {
            $response = [
                'errors' => [
                    $e->getMessage()
                ],
            ];
            return new JsonResponse($response, Response::HTTP_NOT_FOUND);

        }

        return new JsonResponse($response, Response::HTTP_OK);
    }
}
```

Nos quedaría este otro caso:

```php
final class NotAvailableReadProposalControllerTest extends TestCase
{
    public const string PROPOSAL_ID = '01HXMBMMXAG7S1ZFZH98HS3CHP';

    /** @test */
    public function should_fail_with_server_error(): void
    {
        $handler = $this->buildNotAvailableHandler();
        $controller = new ReadProposalController($handler);

        $request = $this->buildRequest('/api/proposals/' . self::PROPOSAL_ID);
        $response = ($controller)(self::PROPOSAL_ID, $request);

        assertEquals(500, $response->getStatusCode());
        assertEquals($this->buildExpectedPayload(), $response->getContent());
    }

    private function buildRequest(string $uri): Request
    {
        return Request::create(
            $uri,
            'GET',
            [],
            [],
            [],
            ['CONTENT-TYPE' => 'json/application'],
        );
    }

    private function buildExpectedPayload(): string|false
    {
        return json_encode(
            [
                'errors' => [
                    'Database failed',
                ]
            ]
        );
    }

    private function buildNotAvailableHandler(): ReadProposalHandler
    {
        return new class() extends ReadProposalHandler {
            public function __construct()
            {
            }

            public function __invoke(ReadProposal $readProposal
            ): ReadProposalResponse {
                throw new ProposalNotAvailable('Database failed');
            }
        };
    }
}
```

Y quedaría resuelto con:

```php
final class ReadProposalController
{
    private ReadProposalHandler $handler;

    public function __construct(ReadProposalHandler $handler)
    {
        $this->handler = $handler;
    }

    public function __invoke(string $id, Request $request): Response
    {
        try {
            Ulid::fromString($id);
        } catch (InvalidUlidStringException $e) {
            $response = [
                'errors' => [
                    sprintf('Invalid Id: %s', $id)
                ],
            ];
            return new JsonResponse($response, Response::HTTP_BAD_REQUEST);
        }
        $query = new ReadProposal($id);

        try {
            $response = ($this->handler)($query);
        } catch (ProposalNotFound $e) {
            $response = [
                'errors' => [
                    $e->getMessage()
                ],
            ];
            return new JsonResponse($response, Response::HTTP_NOT_FOUND);
        } catch (ProposalNotAvailable $e) {
            $response = [
                'errors' => [
                    $e->getMessage()
                ],
            ];
            return new JsonResponse($response,
                Response::HTTP_INTERNAL_SERVER_ERROR);
        }


        return new JsonResponse($response, Response::HTTP_OK);
    }
}
```

Todos los tests para ReadProposal pasan, pero el código se nos ha quedado un poco feo. Los bloques `try/catch` y la construcción de las respuestas hacen que se pierda de vista la lógica del controlador.

Una opción sería ocultar la preparación de la respuesta en un método del controlador, para no perdernos en el detalle. Al fin y al cabo, se repite la misma estructura tres veces. Esto mejora un poco las cosas.

```php
final class ReadProposalController
{
    private ReadProposalHandler $handler;

    public function __construct(ReadProposalHandler $handler)
    {
        $this->handler = $handler;
    }

    public function __invoke(string $id, Request $request): Response
    {
        try {
            Ulid::fromString($id);
        } catch (InvalidUlidStringException $e) {
            return $this->failureResponse(
                sprintf('Invalid Id: %s', $id),
                Response::HTTP_BAD_REQUEST
            );
        }
        
        $query = new ReadProposal($id);

        try {
            $response = ($this->handler)($query);
        } catch (ProposalNotFound $e) {
            return $this->failureResponse(
                $e->getMessage(),
                Response::HTTP_NOT_FOUND
            );
        } catch (ProposalNotAvailable $e) {
            return $this->failureResponse(
                $e->getMessage(),
                Response::HTTP_INTERNAL_SERVER_ERROR
            );
        }


        return new JsonResponse($response, Response::HTTP_OK);
    }

    private function failureResponse(string $message, int $status): JsonResponse
    {
        $response = [
            'errors' => [
                $message
            ],
        ];
        return new JsonResponse($response, $status);
    }
}
```

El bloque donde validamos que el ID tiene un formato correcto es ahora la principal distorsión. Se me ocurre reescribirlo de la siguiente forma, en la que el bloque de código se muestra de forma compacta.

```php
final class ReadProposalController
{
    private ReadProposalHandler $handler;

    public function __construct(ReadProposalHandler $handler)
    {
        $this->handler = $handler;
    }

    public function __invoke(string $id, Request $request): Response
    {
        try {
            $this->validateId($id);
            $query = new ReadProposal($id);
            $response = ($this->handler)($query);
        } catch (InvalidUlidStringException $e) {
            return $this->failureResponse(
                sprintf('Invalid Id: %s', $id),
                Response::HTTP_BAD_REQUEST
            );
        } catch (ProposalNotFound $e) {
            return $this->failureResponse(
                $e->getMessage(),
                Response::HTTP_NOT_FOUND
            );
        } catch (ProposalNotAvailable $e) {
            return $this->failureResponse(
                $e->getMessage(),
                Response::HTTP_INTERNAL_SERVER_ERROR
            );
        }
        
        return new JsonResponse($response, Response::HTTP_OK);
    }

    private function failureResponse(string $message, int $status): JsonResponse
    {
        $response = [
            'errors' => [
                $message
            ],
        ];
        return new JsonResponse($response, $status);
    }

    private function validateId(string $id): void
    {
        Ulid::fromString($id);
    }
}
```

### Fancy refactor... o no

En condiciones normales, probablemente pararía aquí, subiría el código a producción y me movería a mi siguiente objetivo. Pero ya que estamos me gustaría explorar algunas ideas, a ver donde nos llevan.

Me sigue incomodando la forma en que se devuelven las respuestas de fallo. ¿Podríamos mejorar esto de alguna forma? ¿Qué tal introduciendo objetos muy simples?

Como este:

```php
class BadRequestResponse extends JsonResponse
{
    public function __construct(mixed $message)
    {
        $response = [
            'errors' => [
                $message
            ],
        ];
        parent::__construct($response, Response::HTTP_BAD_REQUEST);
    }
}
```

Esto deja el controlador con una lectura bastante más fácil:

```php
final class ReadProposalController
{
    private ReadProposalHandler $handler;

    public function __construct(ReadProposalHandler $handler)
    {
        $this->handler = $handler;
    }

    public function __invoke(string $id, Request $request): Response
    {
        try {
            $this->validateId($id);
            $query = new ReadProposal($id);
            $response = ($this->handler)($query);
        } catch (InvalidUlidStringException $e) {
            return new BadRequestResponse(sprintf('Invalid Id: %s', $id));
        } catch (ProposalNotFound $e) {
            return new NotFoundResponse($e->getMessage());
        } catch (ProposalNotAvailable $e) {
            return new ServerErrorResponse($e->getMessage());
        }

        return new JsonResponse($response, Response::HTTP_OK);
    }

    private function validateId(string $id): void
    {
        Ulid::fromString($id);
    }
}
```

Obviamente, al extender la clase `JsonResponse` de este modo me estoy acoplando al _framework_. Sin embargo, aquí estamos en un controlador, que está fuera de la aplicación y que, de hecho, está escrito con el _framework_.

¿Podíamos hacer reutilizables estas respuestas? Al fin y al cabo, podríamos necesitarlas en otros módulos. Es posible que sí, pero ya veremos si llega el caso.

### Refactor en los tests

No quiero terminar el artículo sin aplicar algún refactor en los tests. Para empezar los diversos tests del controlador repiten bastante código y contienen mucho código preparatorio. Quizá podríamos extraer eso a objetos, con el objetivo de ganar legibilidad, por un lado, y de facilitar cambios en el futuro si se diera el caso.

Aquí tenemos algunos de estos objetos:

```php
class RequestMother
{
    public static function get(string $uri): Request
    {
        return Request::create(
            $uri,
            'GET',
            [],
            [],
            [],
            ['CONTENT-TYPE' => 'json/application'],
        );
    }
}
```

```php
class ResponseMother
{
    public static function failedWithMessage(string $message): string
    {
        return json_encode(
            [
                'errors' => [
                    $message
                ]
            ]
        );
    }
}
```

Y el más potencialmente polémico:

```php
class ReadProposalHandlerMother
{
    public static function dummy(): ReadProposalHandler
    {
        return new class() extends ReadProposalHandler {
            public function __construct()
            {
            }

            public function __invoke(ReadProposal $readProposal
            ): ReadProposalResponse {
                throw new RuntimeException('This method should not be called.');
            }
        };
    }

    public static function notAvailable(): ReadProposalHandler
    {
        return new class() extends ReadProposalHandler {
            public function __construct()
            {
            }

            public function __invoke(ReadProposal $readProposal
            ): ReadProposalResponse {
                throw new ProposalNotAvailable('Database failed');
            }
        };
    }

    public static function notFound(): ReadProposalHandler
    {
        return new class() extends ReadProposalHandler {
            public function __construct()
            {
            }

            public function __invoke(ReadProposal $readProposal
            ): ReadProposalResponse {
                throw new ProposalNotFound('No proposal with Id');
            }
        };
    }
}
```

Esto nos permite refactorizar los tests para que queden como este:

```php
final class NotFoundReadProposalControllerTest extends TestCase
{
    public const string PROPOSAL_ID = '01HXMBMMXAG7S1ZFZH98HS3CHP';

    /** @test */
    public function should_fail_with_not_found(): void
    {
        $handler = ReadProposalHandlerMother::notFound();
        $controller = new ReadProposalController($handler);

        $request = RequestMother::get('/api/proposals/' . self::PROPOSAL_ID);
        $response = ($controller)(self::PROPOSAL_ID, $request);

        assertEquals(404, $response->getStatusCode());
        assertEquals(ResponseMOther::failedWithMessage('No proposal with Id'),
            $response->getContent());
    }
}
```

De paso, he reorganizado los archivos:

```text
├── DBALRetrieveProposalTest.php
├── Examples
│   ├── ReadProposalHandlerMother.php
│   ├── RequestMother.php
│   └── ResponseMother.php
├── ReadProposalController
│   ├── InvalidaIdReadProposalControllerTest.php
│   ├── NotAvailableReadProposalControllerTest.php
│   ├── NotFoundReadProposalControllerTest.php
│   └── ReadProposalControllerTest.php
└── ReadProposalHandler
    ├── NotFoundReadProposalHandlerTest.php
    ├── ReadProposalHandlerTest.php
    └── UnavailableReadProposalHandlerTest.php
```

## Conclusiones

En este artículo hemos visto como introducir tests para los flujos de error de `ReadProposal`. Para ellos hemos utilizado diversas técnicas con las que crear los dobles de tests necesarios para simular las condiciones adversas de la aplicación.

También hemos experimentado con algunos diseños del código orientados a facilitar la legibilidad y el mantenimiento del código en el futuro. Hemos primado clases pequeñas, muy especializadas.

Seguimos moviéndonos en el ámbito de Vertical Slice Architecture, de modo que nuestro trabajo en esta feature o caso de uso no está afectando a ninguna otra parte de la aplicación. Esto es un punto a favor. Gracias a esta separación tenemos más libertad para probar abordajes del problema o diseño del código, ya que el resto de la aplicación no nos limita, ni tenemos que prestar atención a posibles efectos en otras partes.
