---
layout: post
series: design-patterns
title: El patrón Specification del dominio a la infraestructura (2)
published: true
categories: articles
tags: php design-patterns
---

En esta entrega veremos como usar el patrón Abstract Factory para poder tener Specification adecuadas a diferentes capas e implementaciones.

{% include_relative parts/specification.md %}

Hace tiempo descubrí que tenía una vinculación curiosa con Martin Fowler. Resulta que el colegio para el que trabajaba mantiene intercambios de estudiantes con un colegio inglés del que Fowler es ex-alumno. En fin, una de esas curiosidades que sirve para hacer una introducción a un post.

Aparte de eso, he leído bastantes cosas suyas, como [PoEAA](https://martinfowler.com/books/eaa.html) y diversos artículos acerca de patrones de diseño y *refactoring*. Entre ellos, [este acerca de Specification (PDF) ](https://www.martinfowler.com/apsupp/spec.pdf)con Eric Evans. El caso es que no encontraba soluciones prácticas para usar el patrón sobre diferentes implementaciones.

En el artículo sobre Read Model de hace unos días, comenté que gracias a una respuesta en Twitter de [Keyvan Akbar](http://keyvanakbary.com), llegué a un [ejemplo concreto de cómo implementar Specification en diferentes capas e implementaciones](https://github.com/dddinphp/repository-examples). Y ahora voy a intentar explicarlo lo mejor que pueda.

## En resumen

* Las specification se instancian mediante factorías, las cuales tienen métodos que construyen y devuelven las specification que necesites. No las instancias mediante new para no depender de la implementación concreta.
* Necesitas implementaciones concretas de la factoría dependiendo de la infraestructura de persistencia. Exactamente igual que con los repositorios.
* Para poder intercambiar factorías, necesitas una interfaz común para las SpecificationFactories, lo que se llama una Abstract Factory. De este modo, utilizas la implementación de factoría que necesites allí donde estés, pues ella te proporcionará las Specification adecuadas.
* Y, por supuesto, necesitas las Specification.

## Factoría de Specification

En lugar de instanciar Specification con `new`, usaremos una factoría. La factoría tiene métodos que devuelven una instancia de los diversos tipos de Specification que definas.

Pero, como he señalado antes, para garantizar que cada Factoría concreta tiene métodos equivalentes necesitamos usar el patrón Abstract Factory, que fundamentalmente consiste en una interfaz. Algo así:

```php
namespace Mh13\plugins\contents\domain;


use Mh13\plugins\contents\application\service\article\ArticleRequest;


interface ArticleSpecificationFactory
{

    public function createFromCatalogRequest(ArticleRequest $catalogRequest);

    public function createPublishedArticleWithSlug(string $slug);

    public function createArticleIsAvailable();

    public function createArticleFromBlogs(array $blogs);

    public function createArticleWithSlug(string $slug);

    public function createArticleNotFromBlogs(array $excludedBlogs);

}
```

Las factorías concretas de Specification tienen que implementar esos métodos, lo que quiere decir que van a devolver Specifications adecuadas para la capa o infraestructura concreta.

He aquí un ejemplo algo más sencillo (aunque con una complicación de la que hablaré en la siguiente entrega, como son las Composite Specification):

```php
namespace Mh13\plugins\contents\infrastructure\persistence\dbal;


use Doctrine\DBAL\Connection;
use Mh13\plugins\contents\domain\BlogSpecificationFactory;
use Mh13\plugins\contents\infrastructure\persistence\dbal\specification\blog\ActiveBlogWithSlug;
use Mh13\plugins\contents\infrastructure\persistence\dbal\specification\blog\BlogIsActive;
use Mh13\plugins\contents\infrastructure\persistence\dbal\specification\blog\BlogWithSlug;


class DbalBlogSpecificationFactory implements BlogSpecificationFactory
{
    /**
     * @var \Doctrine\DBAL\Query\Expression\ExpressionBuilder
     */
    protected $expressionBuilder;

    public function __construct(Connection $connection)
    {
        $this->expressionBuilder = $connection->getExpressionBuilder();
    }

    public function createBlogWithSlug(string $slug)
    {
        $blogIsActive = new BlogIsActive($this->expressionBuilder);

        return $blogIsActive->and(new BlogWithSlug($this->expressionBuilder, $slug));
    }
}
```

En este ejemplo, podemos ver una factoría que genera Specification para DoctrineDBAL.

Y de eso voy a hablar a continuación.

## Specifications con Doctrine DBAL

Como vimos en el artículo anterior, crear specification concretas para la capa de dominio y repositorios *in memory* es realmente bastante fácil, ya que se trata fundamentalmente de encapsular las condiciones que debe cumplir el objeto pasado al método `isSatisfiedBy` (o equivalente), el cual devuelve un bool.

Pero las specification "estándar" no son muy útiles en la práctica si tenemos que hacer consultas a una base de datos. En ese caso, preferimos obtener las cláusulas `WHERE` de un SQL que nos devuelva el conjunto seleccionado de datos que necesitamos de una tacada (o en el peor de los casos una preselección más manejable que podamos filtrar).

En mi caso, la infraestructura de persistencia es MySQL con Doctrine DBal, así que vamos a ver cómo me las estoy apañando. De hecho creo que en los ejemplos se van a ver cosas que tendría que afinar, pero creo que se va a entender.

Para empezar, voy a considerar que lo que necesito de la Specification es el SQL de las cláusulas WHERE, y para indicar eso voy a llamar al método `getConditions`, algo más o menos así:

```php
namespace Mh13\plugins\contents\infrastructure\persistence\dbal\specification\blog;


use Mh13\plugins\contents\infrastructure\persistence\dbal\specification\CompositeDbalSpecification;


class BlogIsActive extends CompositeDbalSpecification
{

    public function getConditions()
    {
        return 'blog.active = 1';
    }
}
```

Es muy simple. Esta Specification me permitirá obtener la lista de blogs activos en el sistema.

Sin embargo, muchas Specification necesitarán algún tipo de parámetro o varios. Por ejemplo, si quiero poder localizar un blog por su nombre:

```php
namespace Mh13\plugins\contents\infrastructure\persistence\dbal\specification\blog;


use Doctrine\DBAL\Query\Expression\ExpressionBuilder;
use Mh13\plugins\contents\infrastructure\persistence\dbal\specification\CompositeDbalSpecification;


class BlogWithSlug extends CompositeDbalSpecification
{

    public function __construct(ExpressionBuilder $expressionBuilder, string $slug)
    {
        $this->setParameter('slug', $slug);

        parent::__construct($expressionBuilder);
    }

    public function getConditions()
    {
        return $this->expressionBuilder->eq('blog.slug', ':slug');

    }

}
```


El parámetro `$slug` es el nombre simplificado del blog y se pasa a la Specification en el constructor. Observa que también paso un ExpressionBuilder, que es una clase de Doctrine con la que montar expresiones para las Queries.

¿Por qué lo hago así? En este caso, me interesa por varias razones. En primer lugar, porque es un ejemplo de que podemos pasar a la Specification cualquier dependencia que necesite para desempeñar su función. En el ejemplo no sería realmente necesario, ya que la expresión es bien sencilla (`'blog.slug = :slug'`), pero hay algunas expresiones para las que ExpressionBuilder es mejor solución que hacerlas a mano.

De todos modos, BlogWithSlug desciende de una clase abstracta llamada CompositeDbalSpecification que sí necesita ExpressionBuilder para sus funciones. Pero no voy a meterme en eso ahora.

## Cositas específicas de Doctrine DBAL

Si tienes familiaridad con el QueryBuilder de Doctrine conocerás los parámetros posicionales y los parámetros con nombre. Se utilizan para evitar problemas de seguridad al crear las SQL con información procedente del usuario en queries y prevenir los ataques de SQL injection.

Una solución sería hacer la limpieza necesaria al construir la cláusula en la Specification, pero ya que QueryBuilder la va a hacer cuando se genere el SQL y se ejecute, parece más interesante delegarle un trabajo que hace muy bien.

Así que lo que se me ha ocurrido es que la Specification pueda recoger los parámetros y pasárselo a QueryBuilder cuando este los necesita. Por eso, he puesto unos métodos de utilidad en la clase abstracta de la que descienden las Specifications. Os presento a **CompositeDbalSpecification**:

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

    /**
     * @return mixed
     */
    public function getParameters()
    {
        return $this->parameters;
    }

    public function getTypes()
    {
        return $this->types;
    }

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

    protected function setParameter($key, $value, $type = null)
    {
        $this->parameters[$key] = $value;

        $this->types[$key] = $type;
    }
}
```

Fundamentalmente **CompositeDbalSpecification** nos proporciona soporte para, entre otras cosas, guardar y devolver la lista de parámetros y sus tipos.

Por cierto, es importante guardar los parámetros en el constructor por razones que explicaré en el próximo capítulo.

## Bien. ¿Y esto cómo se usa?

En este ejemplo voy a poner un Read Model, que viene siendo un repositorio solo para lectura, pero que funcionaría más o menos igual.

```php
namespace Mh13\plugins\contents\infrastructure\persistence\dbal;

use Doctrine\DBAL\Connection;
use Mh13\plugins\contents\application\readmodel\BlogReadModel;
use Mh13\plugins\contents\exceptions\InvalidBlog;


class DbalBlogReadModel implements BlogReadModel
{
    /**
     * @var Connection
     */
    private $connection;


    public function __construct(Connection $connection)
    {
        $this->connection = $connection;
    }

    public function getBlog($specification)
    {
        $builder = $this->connection->createQueryBuilder();
        $builder->select('blog.*')->from('blogs', 'blog')->where($specification->getConditions())->setParameters(
                $specification->getParameters(),
                $specification->getTypes()
            )
        ;
        $statement = $builder->execute();
        $blog = $statement->fetch();
        if (!$blog) {
            throw InvalidBlog::message('That blog does not exist.');
        }

        return $blog;
    }
}
```

A este código le falta una mano de lija, pero creo que la idea se ve clara.

La chicha está en las líneas 25 a 29. Construyo la Query con QueryBuilder y le paso las cláusulas de la Specification a través del método `where`. Si hay parámetros, los paso por `setParameter`. Luego no hay más que generar la Statement con `execute` y recoger los datos.

Ahora bien, ¿cómo uso el ReadModel y la DbalBlogSpecificationFactory? Me alegro de que me hagas esa pregunta.

En la capa de Application tengo un BlogService que ejemplifica exactamente eso:

```php
namespace Mh13\plugins\contents\application\service;


use Mh13\plugins\contents\application\readmodel\BlogReadModel;
use Mh13\plugins\contents\domain\BlogSpecificationFactory;


class BlogService
{
    /**
     * @var BlogReadModel
     */
    private $readmodel;
    /**
     * @var BlogSpecificationFactory
     */
    private $specificationFactory;

    public function __construct(BlogReadModel $readmodel, BlogSpecificationFactory $specificationFactory)
    {

        $this->readmodel = $readmodel;
        $this->specificationFactory = $specificationFactory;
    }

    public function getBlogWithSlug(string $slug)
    {
        $specification = $this->specificationFactory->createBlogWithSlug($slug);
        $blog = $this->readmodel->getBlog($specification);

        return $blog;
    }
}
```

Al construir BlogService (cosa que ocurre en el Contenedor de Inyección de Dependencias) le pasamos las implementaciones para DBal tanto del ReadModel (o de un repositorio) como de BlogSpecificationFactory. Pero podrían ser otras y no necesitaríamos cambiar BlogService para nada.

En mi caso concreto, BlogService es usando por varios controladores web.

En el [próximo capítulo](/patron-specification-del-dominio-a-la-infraestructura-3) hablaré de cómo usar el patrón Composite para crear Specification sencillas y combinarlas para hacer selecciones más complejas.

De momento, espero que este os pueda ser útil.
