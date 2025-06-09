---
layout: post
series: design-patterns
title: El patrón Specification del dominio a la infraestructura (1)
published: true
categories: articles
tags: php design-patterns
---

El patrón specification es sumamente útil, pero implementarlo tiene su intríngulis. Este artículo tiene tres partes:

{% include_relative parts/specification.md %}

## Definiendo

El patrón Specification nos permite encapsular reglas de negocio, ya sean estas sencillas o complejas, de manera que sean reutilizables y fáciles de cambiar.

En el dominio, una Specification recibe una Entidad como parámetro y nos dice si satisface o no las condiciones que encapsula.

Lo que llamamos **Reglas de negocio** o de dominio en general no son más que una serie de condiciones que ciertas Entidades deben cumplir. Por lo general, condición nos remite a chequeos con IF/THEN, pero sabemos que mal manejados pueden ser un gran problema, especialmente si, además, pueden cambiar.

## El viaje desde If a Specification

Para ver cómo llegamos de los "if" a las Specification pongamos el típico ejemplo de una tienda on line.

En nuestra tienda los pedidos por encima de 100 € tienen derecho a gastos de envío gratis. Una primera forma de hacer esto, en algún tipo de Domain Service que calcule los gastos de envío, podría ser:

```php
if ($order->getAmount() > 100) {
    $order->setShippingFee(0);
}
```

Un espanto. Pero dejemos aparte ahora consideraciones sobre Value Objects (Money), Modelos anémicos (¡Encapsulación!) y demás. Ahora mismo me quiero centrar en otras cosas.

Supongamos que, en la siguiente revisión, nos dicen de Marketing que van a lanzar una opción "Cliente Premium" por la que los clientes que lo sean no pagan gastos de envío.

Pues entonces tenemos que ir al Domain Service y cambiar alguna línea:

```php
if ($order->getAmount() > 100 
    || $order->getClient()->isPremiun() ) {
    $order->setShippingFee(0);
}
```

Bueno, en el ejemplo he violado Demeter y eso, pero lo importante es que he violado el principio Abierto/Cerrado, al modificar el Service.

Veamos. Un refactoring típico de esta situación sería encapsular en un método del Service, o incluso de la entidad Order, las condiciones por las que los gastos de envío saldrían gratis. Algo parecido a esto:

```php
if ($order->isEligibleForFreeShipping() ) {
    $order->setShippingFee(0);
}
```

En fin. No digo que sea hermoso, pero ilustra la idea de encapsular tanto para hacer más inteligible el código como para centralizar los cambios en un único lugar. Sin embargo, no deja de tener el mismo problema: si surge una nueva condición para los gastos de envío gratis, tengo que modificar una clase. Violación Abierto/Cerrado al canto.

Y ahí es donde entra el patrón Specification.

**Specification** es una encapsulación, pero en lugar de residir en un método de alguna de las clases implicadas, es un objeto, al que le podemos preguntar si otro objeto que le pasamos cumple las condiciones encapsuladas.

```php
class EligibleForFreeShipping() {

   public function isSatisfiedBy(Order $order): bool {
       return $order->getAmount() > 100 
              || $order->getClient()->getIsPremium();
   }
}
```

El patrón Specification típico tiene un único método **isSatisfiedBy** que devuelve un valor bool, al que se le pasa un objeto de la clase que queremos evaluar. En el constructor podemos inyectar las dependencias necesarias.

Su uso sería algo así en el Domain Service ese que calculaba los gastos de envío:

```php
$eligibleForFreeShipping = new EligibleForFreeShipping();
// ...
// pasamos de algún modo la specification al service, o a este le pasamos una factoría, que es lo que voy a ejemplificar aquí...

$eligibleForFreeShipping = $this->orderSpecificationFactory->createFreeShipping();
if ($eligibleForFreeShipping->isSatisfiedBy($order) ) {
    $order->setShippingFee(0);
}
```

Puedes usar la specification en cualquier lugar donde la precises. Y lo más interesante: si las reglas del negocio cambian, en lugar de reescribir la specification puedes escribir una nueva con las nuevas reglas y pasársela al servicio que la utilice en lugar de la primera.

En el ejemplo anterior, he simulado que hemos inyectado en el Service una factoría de Specification de modo que le podamos pedir Specifications del tipo deseado. De este modo, solo tendríamos que reescribir el método **createFreeShipping** de la factoría para que devuelva las nuevas.

¿A que mola?

## Specification como filtro

Como decía, podemos usar las specification en muchos lugares. Uno de los más obvios e interesantes es en los Repositorios. Esto nos llevará a un problema, del que me ocuparé más tarde y que es el origen de este artículo. Pero vayamos por partes.

En DDD los repositorios son vistos por el dominio como colecciones en memoria, independientemente de la implementación concreta. Para el dominio son simplemente el lugar en el que buscar o almacenar entidades. A veces, se usan para obtener una entidad bien identificada (por su id). Otras veces, se usan para obtener una colección de entidades que cumplan ciertas condiciones.

¿He dicho condiciones? Pues eso es algo en lo que las Specifications son especialistas.

Si el repositorio en cuestión está implementado en memoria, podemos usar las Specification como filtros.

¿Conoces la función **array_filter**? Esta función recibe un Callable que retorna true o false para seleccionar que elementos del array se toman y cuáles se dejan, respectivamente. Pues podemos usar las Specification con Repositorios en memoria de una forma parecida y ciertamente podríamos utilizar la Specification como callable de array_filter.

Al fin y al cabo, solemos implementar estos repositorios usando un array de objetos (o un SPLObjectStorage...). No tenemos más que recorrerlo y quedarnos con los objetos que cumplen la Specification. Algo más o menos así en una implementación un poco sucia:

```php
interface OrderRepository {
   public function findAllSatisfying($specification);
}

class InMemoryRepository {
   private $orders;
   public function findAllSatisfying($specification) {
       $filtered = [];
       foreach ($this->orders as $order) {
            if ($specification->isSatisfiedBy($order)) {
                $filtered[] = $order;
            }
       }
       return $filtered;
   } 
}
```

Creo que queda bastante claro, ¿no?

Gracias al uso de Specification, además, los Repositorios no tienen que tener un método por cada tipo de petición que necesitemos. Si alguien de Negocio nos viene con nuevas ideas, tan solo tendríamos que crear nuevas Specification para satisfacer la petición.

Ahora bien, seguro que estás pensando lo siguiente:

– ¡Pero _pringao_! Si tengo 800.000 registros en la base de datos, ¿cómo #@]]# quieres que cargue todo en memoria y vaya mirando uno por uno si cumplen la especificación?</blockquote>

Este es uno de los problemas que tenemos que solucionar en la implementación del patrón dependiendo de nuestra infraestructura y que a mí me traía de cabeza hasta hace poco.

¿La solución? Para la solución tendremos que introducir el patrón Abstract Factory, y para un ejemplo completo tendrás que esperar a la próxima entrega. Pero te lo explico a grandes rasgos:

La idea es que las implementaciones de Specification para infraestructura específica son diferentes. Por ejemplo, para una base de datos SQL típica, las condiciones se expresan como cláusulas WHERE. Por lo tanto, las implementaciones para SQL de Specification no devuelven un bool, sino las cláusulas WHERE que van a filtrar nuestra query. De este modo, no tenemos que cargar toda una tabla en memoria, sino que hacemos la petición de los datos requeridos.

Para instanciar Specification usaremos factorías en cada tipo de infraestructura. Por ejemplo, tendremos una factoría de specification para SQL, otras para Redis, otra para InMemory, etc.

Pero también necesitamos una abstracción, a fin de no hacernos dependientes de la implementación concreta y poder cambiarla donde sea necesario. Ahí es donde entra Abstract Factory.

Abstract Factory es un patrón que consiste en crear una interfaz para una factoría y diversas implementaciones concretas de la misma. Cada implementación devuelve objetos propios de ese tipo de infraestructura, peo el código depende de la interfaz, que es abstracta. Esto nos garantiza que siempre habrá un método que devuelva tal o cual tipo de Specification para la infraestructura concreta que estemos implementando.

Para ver un ejemplo real tendrás que esperar un poco. Nos vemos en la próxima entrega.
