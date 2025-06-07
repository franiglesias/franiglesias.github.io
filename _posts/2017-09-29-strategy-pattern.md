---
layout: post
title: Strategy pattern
subtitle: Patrones de diseño
categories: articles
tags: php design-patterns
---

El patrón Strategy (estrategia) se basa en encapsular una familia de algoritmos de modo que sean intercambiables.

Algo que resulta bastante confuso de los patrones, cuando estás empezando a estudiarlos, es el enorme parecido que existe entre unos y otros. Esto es debido a que prácticamente todos ellos se basan en algún tipo de composición de objetos y las diferencias pueden estar en la intención o ciertos matices.

Es el caso del patrón Strategy, que recuerda mucho a otros patrones como Adapter. Pero hay diferencias.


## El problema

El problema que intentamos resolver usando Strategy es el siguiente:

Supongamos una clase que expone alguna funcionalidad que puede ser consumida por otra. Sin embargo, resulta que tenemos varias posibilidades diferentes para ejecutar esa funcionalidad. Es decir que tenemos un conjunto de algoritmos para implementarla y queremos que sea el consumidor quien escoja el que prefiere usar.

Un primer acercamiento sería crear distintos métodos en la clase que ofrece el servicio que ejecutan cada uno la funcionalidad basándose en un algoritmo distinto.

Este acercamiento nos lleva a varios problemas:

En primer lugar, si con el tiempo necesitamos nuevos algoritmos tendríamos que modificar nuestra clase servicio, lo que va contra el principio Abierto/Cerrado.

Por otro lado, también se va en contra de la Segregación de Interfaces ya que la clase Servicio expone varios métodos y los consumidores solo están interesados en uno de ellos. En consecuencia, para el cliente puede ser problemático usar el método deseado de la clase, sobre todo si debe hacer la selección basándose en algún tipo de computación.

Ejemplo:

```php
class Service {
    public function getXML() {
    }

    public function getJSON() {
    }

    public function getString() {
    }
}

class Client {
    public function doSomething($format) {
        $service = new Service();

        switch($format) {
            case 'XML':
                return $service->getXML();
            case 'JSON':
                return $service->getJson();
            case 'String':
                return $service->getString();
        }
    }
}
```


## Solución con Strategy pattern

El acercamiento con el patrón Strategy es bastante más elegante y extensible.

Primero extraemos la lógica de los algoritmos a un conjunto de objetos que implementan la misma interfaz, eliminando todos esos métodos de la clase Service (los métodos concretos variarán en cada caso).

```php
interface Strategy {
    public function execute($data);
}

class ConvertToXML implements Strategy {
    ...
}

class ConvertToJSON implements Strategy {
    ...
}

class ConvertToString implements Strategy {
    ...
}
```

Seguidamente hacemos que Service pueda utilizar estos algoritmos para realizar la tarea con un solo método

```php
class Service {

    public function getDataUsing(Strategy $strategy) {
        $data = ....;
        return $this->strategy->execute($data);
    }

}
```

Entonces el cliente, solo tiene que instanciar u obtener un objeto Strategy y pasarlo al Service. En este caso usamos una factoría de Estrategias que se encarga de darnos la deseada.

```php
class Client
{
    private $strategyFactory;

    public function __construct(StrategyFactory $factory) {
        $this->strategyFactory = $factory;
    }

    public function doSomething($format) {
        $service = new Service();
        $strategy = $this->strategyFactory->get($format);
        return $service->getDataUsing($strategy);
    }
}

Class StrategyFactory
{
    public function getStrategy($format) {
        switch($format) {
            case 'XML':
                return new ConvertToXML();
            case 'JSON':
                return new ConvertToJSON();
            case 'String':
                return new ConvertToString();
        }
    }
}
```


## Diferencias con otros patrones

El patrón Strategy puede sonar bastante parecido al patrón Adapter. La diferencia es que el patrón Adapter lo que busca es adaptar la funcionalidad de una clase a una interfaz deseada. Strategy, por su parte, es una forma de dar control a los consumidores sobre el comportamiento concreto que utiliza un servicio.
