---
layout: post
title: El patrón Specification del dominio a la infraestructura (3)
published: true
categories: articles
tags: php design-patterns
---

En las entregas anteriores hemos hablado del patrón **Specification** y cómo implementarlo en las diversas capas de arquitectura con la ayuda de **Abstract Factory**. Ahora toca ver cómo combinar **Specification** mediante el patrón **Composite** para construir especificaciones complejas a partir de otras más simples.

La serie **Specification: del dominio a la infraestructura** está compuesta de los siguientes artículos

[Patrón Specification: del dominio a la infraestructura (1)](/patron-specification-del-dominio-a-la-infraestructura-1)  
[Patrón Specification: del dominio a la infraestructura (2)](/patron-specification-del-dominio-a-la-infraestructura-2)  
[Patrón Specification: del dominio a la infraestructura (3)](/patron-specification-del-dominio-a-la-infraestructura-3)

De entrada, no hay ninguna norma que limite la complejidad de las specification. Es decir, el criterio para satisfacerla puede ser tan simple o enrevesado como sea necesario.

Ahora bien, como ya sabemos, cuando más complejo sea el algoritmo más difícil será de mantener y más probable será que existan duplicaciones entre Specifications, las cuales, en caso de tener que modificar el código en un futuro, pueden llevarnos a errores o a resultados contradictorios si nos olvidamos de cambiar alguna.

Por ejemplo. En un CMS los artículos se pueden ver si están marcados para publicar y si la fecha en que se hace la petición está dentro del rango que va de la fecha de publicación a la fecha de expiración (si es que tiene una definida). Así que cuando un usuario solicita el artículo con el **id** o alias que sea, también es necesario comprobar si está disponible (flag de publicación y rango de fechas correcto). Lo mismo ocurre si lo que se pide es la lista de últimos artículos de un blog: los artículos devueltos deben estar disponibles.

En este ejemplo debería ser fácil ver que chequeamos una parte común, como que los artículos están disponibles, y una parte específica: que el artículo tiene el **id** o alias solicitado, o que los artículos pertenecen a un blog especificado.

En consecuencia, podríamos extraer la parte común a una especificación y las partes particulares a sendas especificaciones. Pero, ¿cómo combinarlas?

Pues usando el patrón Composite.

## Patrón Composite

Para entender bien el patrón Composite hay que hacer explícita una distinción que a veces pasamos por alto (yo el primero): clases y objetos no son la misma cosa.

* Una clase es una definición, describe cómo es y se comporta un tipo de objetos. Es una entidad abstracta.
* Un objeto es una instancia concreta de una clase y la que actúa efectivamente en el código.

En OOP tratamos con objetos, aunque necesitamos las clases para definir su comportamiento y propiedades. Son los objetos los que interactúan entre sí, los que colaboran y pueden, en su caso, combinarse. La base de los patrones de diseño no serían tanto las clases como los objetos y sus interfaces.

El patrón Composite es un patrón en el que combinamos objetos para que actúen como si fuesen uno. No se trata de combinar clases, pero tenemos que hacer que las clases nos permitan combinar los objetos entre sí para actuar como uno solo.

En consecuencia, el objeto compuesto y los objetos componentes deben cumplir la misma interfaz. Su comportamiento debe ser el resultado de algún tipo de combinación del comportamiento de los componentes. Hay muchos patrones que podrían considerarse una forma especializada de Composite.

En el caso de Specification, una _Composite Specification_ sigue siendo una Specification y el resultado de su método "isSatisfiedBy" o equivalente, es el resultado de combinar los resultados de las Specification componentes.

Queremos que las Specification se combinen mediante operadores lógicos (AND, OR, NOT). Volviendo al ejemplo del CMS mencionado más arriba, podríamos tener las Specification ArticleIsAvailable, ArticleHasId y ArticleBelongsToBlog, y combinarlas de estas formas:

* ArticleIsAvailable AND ArticleHasId.
* ArticleIsAvailable AND ArticleBelongsToBlog.

## El método general explicado

Para poder hacer Composite, tanto de Specification como de cualquier otro tipo de objetos, necesitamos una interfaz y, seguramente, una clase abstracta que proporcione alguna funcionalidad común.

Los objetos que cumplen la misma interfaz anuncian que tienen el mismo comportamiento. Nuestro composite debe ser capaz de cumplir la interfaz de nuestros objetos básicos.

Por otro lado, nuestro composite tomará como argumentos del constructor un número de objetos "combinables". Puesto que tanto los _composites_ como los objetos básicos cumplen la misma interfaz, podremos componer composites para lograr toda la complejidad que necesitemos.

## Composite Specification en el dominio

Asumiendo que las Specification en el dominio tienen un método `isSatisfiedBy` que devuelve bool, y que queremos que se puedan combinar con operadores lógicos, un enfoque sería el siguiente.

Supongamos que tenemos una interfaz genérica Specification, con un método isSatisfiedBy que devuelve `bool`. Podemos crear una clase `AndSpecification` que represente dos Specification combinadas usando el operador AND.

```php
interface Specification {
    public function isSatisfiedBy($article) : bool;
}

class ArticleIsAvailable implements Specification {

    public function isSatisfiedBy($article): bool
    {
        return $article->isMarkedAsPublished() and $article->isVisibleAtCurrentDate();
    }
}

class ArticleHasId implements  Specification {

    private $id;

    public function __construct($id)
    {

        $this->id = $id;
    }
    public function isSatisfiedBy($article): bool
    {
        return $article->getId() = $this->id;
    }
}

class AndSpecification implements Specification {

    /**
     * @var Specification
     */
    private $left;
    /**
     * @var Specification
     */
    private $right;

    public function __construct(Specification $left, Specification $right)
    {
        $this->left = $left;
        $this->right = $right;
    }
    public function isSatisfiedBy($article): bool
    {
        return $this->left->isSatisfiedBy($article) && $this->right->isSatisfiedBy($article);
    }
}

// Usage example

$compositeSpecification = new AndSpecification(new ArticleIsAvailable(), new ArticleHasId('article-id'));
```

En la última línea del ejemplo anterior podemos ver cómo crear una Specification combinada.

Podemos hacer lo mismo para la una ORSpecification, la única diferencia será el operador lógico con el que combinamos los resultados de las Specification que pasamos en la construcción:

```php
<?php


class OrSpecification implements Specification {

    /**
     * @var Specification
     */
    private $left;
    /**
     * @var Specification
     */
    private $right;

    public function __construct(Specification $left, Specification $right)
    {
        $this->left = $left;
        $this->right = $right;
    }
    public function isSatisfiedBy($article): bool
    {
        return $this->left->isSatisfiedBy($article) || $this->right->isSatisfiedBy($article);
    }
}

// Usage example

$compositeSpecification = new OrSpecification(new ArticleIsAvailable(), new ArticleHasId('article-id'));
```

Como hemos señalado antes, podríamos pasar estas especificaciones combinadas para combinarlas a su vez, creando así objetos Specification muy complejos a partir de otros más simples.

### Añadiendo Factory Method

Aunque podemos usar AndSpecification y OrSpecification para crear CompositeSpecification de forma bastante sencilla, podemos obviar la necesidad de usarlas explícitamente añadiendo un par de Factory Method en una clase base de Specification. De esta manera conseguimos una interfaz más expresiva.

Veamos el ejemplo aumentado, lo interesante está en las líneas 7 a 17:

```php
interface Specification {
    public function isSatisfiedBy($article) : bool;
}

abstract class ComposableSpecification implements Specification {
    public function and(Specification $right)
    {
        return new AndSpecification($this, $right);
    }

    public function or(Specification $left)
    {
        return new OrSpecification($this, $left);
    }
}

class ArticleIsAvailable extends ComposableSpecification {
    public function isSatisfiedBy($article): bool
    {
        return $article->isMarkedAsPublished() and $article->isVisibleAtCurrentDate();
    }
}

class ArticleHasId extends ComposableSpecification {
    private $id;
    public function __construct($id)
    {
        $this->id = $id;
    }
    public function isSatisfiedBy($article): bool
    {
        return $article->getId() = $this->id;
    }
}

class AndSpecification extends ComposableSpecification {
    /**
     * @var Specification
     */
    private $left;
    /**
     * @var Specification
     */
    private $right;
    public function __construct(Specification $left, Specification $right)
    {
        $this->left = $left;
        $this->right = $right;
    }
    public function isSatisfiedBy($article): bool
    {
        return $this->left->isSatisfiedBy($article) && $this->right->isSatisfiedBy($article);
    }
}

class OrSpecification extends ComposableSpecification {

    /**
     * @var Specification
     */
    private $left;
    /**
     * @var Specification
     */
    private $right;

    public function __construct(Specification $left, Specification $right)
    {
        $this->left = $left;
        $this->right = $right;
    }
    public function isSatisfiedBy($article): bool
    {
        return $this->left->isSatisfiedBy($article) || $this->right->isSatisfiedBy($article);
    }
}


$articleSpecification = new ArticleHasId('article-id');
$articleSpecification = $articleSpecification->and(new ArticleIsAvailable());
```

Lo interesante está en la línea 7: introducimos la clase abstracta base ComposableSpecification que añade los métodos `and()` y `or()` que son métodos factoría para crear Composite Specification del tipo AndSpecification y OrSpecification, respectivamente.

El beneficio es un código más explícito, como se puede ver en las líneas finales.

## Bajando a la infraestructura


En la [entrega anterior](/patron-specification-del-dominio-a-la-infraestructura-2/) puse ejemplos de Specification para la capa de infraestructura.
En líneas generales, la composición de especificaciones en esta capa funciona exactamente igual. Obviamente hay diferencias. En este caso, la especificación combinada es el resultado de combinar las cláusulas WHERE de cada una de las especificaciones que se combinan.

En el siguiente ejemplo, uso el `ExpressionBuilder` de Doctrine para hacerlo (tal como se veía en el otro artículo). Aunque seguramente en la práctica llegue a prescindir de él, me pareció interesante añadir esta complicación para mostrar que el patrón es muy flexible. Veamos como se define el Composite AndSpecification (OrSpecification es similar):

```php
namespace Mh13\plugins\contents\infrastructure\persistence\dbal\specification;


use Doctrine\DBAL\Query\Expression\ExpressionBuilder;


class AndSpecification extends CompositeDbalSpecification
{
    protected $left;
    protected $right;

    public function __construct(
        ExpressionBuilder $expressionBuilder,
        CompositeDbalSpecification $left,
        CompositeDbalSpecification $right
    ) {
        $this->left = $left;
        $this->right = $right;
        $this->addParameters($left);
        $this->addParameters($right);
        parent::__construct($expressionBuilder);
    }

    public function getConditions()
    {
        return $this->expressionBuilder->andX($this->left->getConditions(), $this->right->getConditions());
    }
}
```

(Nota: el uso del método `addParameters` en el constructor es irrelevante para este tema, simplemente es un medio de poder introducir parámetros en la query).

Esta es la definición de la clase base:

```php
namespace Mh13\plugins\contents\infrastructure\persistence\dbal\specification;


use Doctrine\DBAL\Query\Expression\ExpressionBuilder;


abstract class CompositeDbalSpecification implements DbalSpecification
{
    /**
     * @var ExpressionBuilder
     */
    protected $expressionBuilder;
    protected $parameters = [];
    protected $types = [];

    public function __construct(ExpressionBuilder $expressionBuilder)
    {
        $this->expressionBuilder = $expressionBuilder;
    }

    abstract public function getConditions();

    public function and (CompositeDbalSpecification $specification)
    {
        return new AndSpecification($this->expressionBuilder, $this, $specification);
    }

    public function or (CompositeDbalSpecification $specification)
    {
        return new OrSpecification($this->expressionBuilder, $this, $specification);
    }

    protected function addParameters(CompositeDbalSpecification $specification)
    {
        $types = $specification->getTypes();
        foreach ($specification->getParameters() as $key => $value) {
            $this->setParameter($key, $value, $types[$key]);

        }
    }

    public function getTypes()
    {
        return $this->types;
    }

    /**
     * @return mixed
     */
    public function getParameters()
    {
        return $this->parameters;
    }

    protected function setParameter($key, $value, $type = null)
    {
        $this->parameters[$key] = $value;

        $this->types[$key] = $type;
    }
}
```

Y, con esto, termino esta serie sobre **Specification** y sus implementaciones en distintas capas de la aplicación.
