---
layout: post
title: Presenter pattern
categories: articles
tags: oop design-patterns
---

Existen una serie de patrones de diseño de sóftware básicos, pero nada nos impide crear nuevos patrones a partir de alguno de los clásicos, con el fin de adaptarlos a situaciones más específicas. Sencillamente, son patrones menos generales.


El patrón Presenter un ejemplo de ello. Estos días hemos estado dicutiendo sobre ellos en el trabajo y, aunque todavía no hemos llegado a un acuerdo completo, he podido sacar varias ideas.

## Definición

El patrón Presenter se usaría cuando queremos pasar objetos o información entre dos objetos que están en distintas capas (aplicación e infrastructura) y queremos que el consumidor pueda decidir sobre la forma en que se le presenta esa información. Para ello, al hacer la petición, pasa un Presenter que encapsula la lógica que transforma la información al formato que al consumidor le interesa.

Fundamentalmente un Presenter es un DataTransformer, y es cómo se le denomina en el Libro Rojo de DDD. Los DataTransformers simplemente son objetos que traducen estructuras de datos, pudiendo hacerlo en dos direcciones o en una sola. Los presenters sólo harían la conversión en una dirección.

Por otra parte, este patrón sería, a su vez, una aplicación del patrón Strategy, que consiste en encapsular algoritmos para que puedan ser intercambiables.

## El problema que resuelve

El problema que Presenter intenta resolver es el siguiente:

Cuando se ejecuta un usecase o un query que devuelve una respuesta, la capa de infraestructura que lo solicita no conoce (ni puede, ni debe) nada acerca de los objetos de dominio.

Dependiendo de la tarea la capa de infraestructura puede querer toda o parte de la información que devuelve el usecase, adicionalmente, en un formato determinado. Podría ser un array o una serialización json, xml o cualquier otra estructura o forma que le interese al consumidor del UseCase.

Usando el patrón Presenter la capa de infraestructura puede controlar la forma en que el UseCase devuelve la información sin conocer nada acerca de objetos de dominio. Además, de este modo, tanto el UseCase como el Presenter son reutilizables en solicitudes diferentes sobre los mismos objetos de dominio. Por ejemplo, en algunos casos sólo necesitamos el id de la Entidad, en otros casos, queremos el id, el nombre y otro dato, etc.

Hay que decir también que este patrón es utilizable sin objetos de dominio, es decir, Presenter encapsula la lógica que traduce la información que obtiene al formato que el consumidor necesita.

## Estructura de un Presenter

Un Presenter encapsula una determinada transformación de un objeto de dominio a una representación arbitraria y específica de su datos.

Como Presenter es un objeto "frontera", la capa de Aplicación define una interfaz y se implementa en Infraestructura, lo cual es un patrón de Interfaz Separada.

La interfaz puede ser genérica:

```php
interface Presenter {
    // @param the object to present
    // @return void
    public function write($object);
    public function read() mixed ;
}
```

O bien, podemos definir una interfaz específica para ciertos objetos de dominio y forzar el type hinting. Personalmente pienso que puede ser una buena idea siempre que no acoplemos la interface al UseCase o Query.

```php
interface UserPresenter {
    public function write(User $object);
    public function read();
}
```

El método `write` toma el objeto y lo utiliza para obtener la representación deseada, la cual puede almacenar en una propiedad privada, que es devuelta con el método `read`.

Ejemplo de implementación:

```php
class UserIdAndNamePresenter implements UserPresenter {
    private $data;

    public function write(User $user) {
        $this->data = [
            'id' => $user->getId(),
            'name' => $user->getName()
        ];
    }

    public function read() {
        return $this->data;
    }
}
```

Esta terminología no acaba de convencerme, pero es la que usa el código en el que he visto este patrón. Personalmente me parece más expresiva:

```php
interface Presenter {
    public function setData($object);
    public function convert();
}
```

Pero es un poco "mentirosa":

```php
class UserIdAndNamePresenter implements UserPresenter {
    private $data;

    public function setData(User $user) {
        $this->data = [
            'id' => $user->getId(),
            'name' => $user->getName()
        ];
    }

    public function convert() {
        return $this->data;
    }
}
```

O incluso, podríamos implementarlo de una forma aún más escueta y stateless.

```php
interface Presenter {
    public function convert($object);
}

class UserIdAndNamePresenter implements Presenter {
    public function convert($user) {
        return [
            'id' => $user->getId(),
            'name' => $user->getName()
        ];
    }
}
```

### Dependencias

Los Presenters podrían usar dependencias para poder realizar ciertas transformaciones específicas las cuales se pasarían en el constructor. Este es un ejemplo, un tanto forzado, pero se debería poder captar la idea:

```php
class UserIdAndNamePresenter implements UserPresenter {
    private $specialSerializer;
    private $data;

    public function __construct($specialSerializer) {
        $this->specialSerializer = $specialSerializer;
    }

    public function write(User $user) {
        $userArray = [
            'id' => $user->getId(),
            'name' => $user->getName()
        ];
        $this->data = $this->specialSerializer->serialize($userArray);
    }

    public function read() {
        return $this->data;
    }
}
```

## Uso

Un Presenter se usa en la capa de infraestructura, por ejemplo, en un controller y se pasa al UseCase o Query para comunicarle que queremos que los datos devueltos tengan cierta estructura o formato.

El UseCase devuelve un objeto Response que básicamente es un DTO que contiene un método getData, el cual es el que devuelve los datos transformados. Response podría tener métodos para devolver códigos de estado o mensajes de error. Además, podríamos especializar Response para tener métodos más específicos (por ejemplo, `getID()`, etc...)

```php
// Controller

class ExampleController {

    public getUserNameAction ($id) {
        $request = new UserByIdRequest($id);
        $presenter = new UserIdAndNamePresenter();

        $useCase = new GetUserUseCase();

        $response = $useCase->execute($request, $presenter);

        $user = $response->getData();
        ...
    }
}

// UseCase

class GetUserUseCase {

    private $UserRepository;

    public function __construct(UserRepository $userRepository) {
        $this->UserRepository = $userRepository;
    }

    public function execute(UserByIdRequest $request, Presenter $presenter) {
        $user = $this->userRepository->getOneById($request->getId());
        return new Response($presenter->write($user));
    }
}

// Response

class Response {

    private $data;

    public function __construct($responseData) {
        $this->data = $responseData;
    }

    public function getData() {
        return $this->data;
    }
}
```

La tarea del UseCase es obtener el dato requerido del repositorio, utilizando la información que se pasa mediante Request. El UseCase no sabe nada acerca de cómo quiere la información el Controller (o quien quiera que sea el solicitante), pero usa el Presenter para devolverlo empaquetado en el objeto Response.

Esta sería la versión stateless, que no tiene muchas diferencias:

```php
// Controller

class ExampleController {

    public getUserNameAction ($id) {
        $request = new UserByIdRequest($id);
        $presenter = new UserIdAndNamePresenter();

        $useCase = new GetUserUseCase();

        $response = $useCase->execute($request, $presenter);

        $user = $response->getData();
        ...
    }
}

// UseCase

class GetUserUseCase {

    private $UserRepository;

    public function __construct(UserRepository $userRepository) {
        $this->UserRepository = $userRepository;
    }

    public function execute(UserByIdRequest $request, Presenter $presenter) {
        $user = $this->userRepository->getOneById($request->getId());
        return new Response($presenter->convert($user));
    }
}

// Response

class Response {

    private $data;

    public function __construct($responseData) {
        $this->data = $responseData;
    }

    public function getData() {
        return $this->data;
    }
}
```

## Alternativas

En algunos ejemplos de código real hay algunas discrepancias en la forma en que el Presenter se relaciona con el objeto de dominio. Usando el patrón en modalidad "con estado", podríamos plantearlo de dos maneras.

La forma _estricta_ (estricta en tanto que el objeto de domino *nunca* abandona la capa de aplicación) sólo usa el objeto de domino para obtener la información y realizar la transformación, que se realiza en el mismo método `write` que registra el objeto de dominio en el Presenter, de modo que éste sólo contiene la información en el formato final y se limita a devolverla con el método `read()`. Es la forma que hemos utilizado en los ejemplos anteriores, como:

```php
class UserIdAndNamePresenter implements UserPresenter {
    private $data;

    public function write(User $user) {
        $this->data = [
            'id' => $user->getId(),
            'name' => $user->getName()
        ];
    }

    public function read() {
        return $this->data;
    }
}
```

En la forma _laxa_ el Presenter encapsula el objeto de dominio, y es el método `read()` el que realiza la transformación, con lo cual el objeto viaja encapsulado a la capa de infraestructura. Quedaría algo así:

```php
class UserIdAndNamePresenter implements UserPresenter {
    private $user;

    public function write(User $user) {
        $this->user = $user;
    }

    public function read() {
        return [
            'id' => $this->user->getId(),
            'name' => $this->user->getName()
        ];
    }
}
```

La verdad es que no consigo encontrar un criterio claro para decidir entre una forma u otra, ya que de cara al Consumer, no hay ninguna diferencia.

He hecho unas pruebas de consumo de memoria y parece que gana la forma 'laxa' debido a que si pasamos el objeto encapsulado en el Presenter, este simplemente lleva una referencia al objeto (al menos desde hace algún tiempo en PHP los objetos se pasan siempre por referencia), mientras que si copiamos a otra variables la información es necesario adjudicarle memoria. Sin embargo, me pregunto si habrá situaciones en las que sea necesario hilar tan fino.

## Concluyendo

El patrón Presenter, que es una especilización de Strategy, puede ser útil para que la capa de infraestructura pueda usar de una forma más flexible los UseCase (o Queries) de la capa de Aplicación, al permitirle indicar cómo quiere que se le devuelve la información que solicita.

De este modo, la capa de Aplicación se despreocupa por completo de preparar los datos que se le piden, ya que delega esa tarea en el Presenter.