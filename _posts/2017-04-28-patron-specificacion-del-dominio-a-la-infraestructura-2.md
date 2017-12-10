---
layout: post
title: El patrón Specification del dominio a la infraestructura (2)
categories: articles
tags: oop design-pattern specification
---

En esta entrega veremos como usar el patrón Abstract Factory para poder tener Specification adecuadas a diferentes capas e implementaciones.

La serie **Specification: del dominio a la infraestructura** está compuesta de los siguientes artículos

[Patrón Specification: del dominio a la infraestructura (1)](/patron-specification-del-dominio-a-la-infraestructura-1)  
[Patrón Specification: del dominio a la infraestructura (2)](/patron-specificacion-del-dominio-a-la-infraestructura-2)  
[Patrón Specification: del dominio a la infraestructura (3)](/patron-specification-del-dominio-a-la-infraestructura-3)

Hace tiempo descubrí que tenía una vinculación curiosa con Martin Fowler. Resulta que el colegio para el que trabajaba mantiene intercambios de estudiantes con un colegio inglés del que Fowler es ex-alumno. En fin, una de esas curiosidades que sirve para hacer una introducción a un post.

Aparte de eso, he leído bastantes cosas suyas, como [PoEAA](https://martinfowler.com/books/eaa.html) y diversos artículos acerca de patrones de diseño y refactoring. Entre ellos, [este acerca de Specification (PDF) ](https://www.martinfowler.com/apsupp/spec.pdf)con Eric Evans. El caso es que no encontraba soluciones prácticas para usar el patrón sobre diferentes implementaciones.

En el artículo sobre Read Model de hace unos días, comenté que gracias a una respuesta en Twitter de [Keyvan Akbar](http://keyvanakbary.com), llegué a un [ejemplo concreto de cómo implementar Specification en diferentes capas e implementaciones](https://github.com/dddinphp/repository-examples). Y ahora voy a intentar explicarlo lo mejor que pueda.

## En resumen

* Las specification se instancian mediante factorías, las cuales tienen métodos que construyen y devuelven las specification que necesites. No las instancias mediante new para no depender de la implementación concreta.
* Necesitas implementaciones concretas de la factoría dependiendo de la infraestructura de persistencia. Exactamente igual que con los repositorios.
* Para poder intercambiar factorías, necesitas una interfaz común para las SpecificationFactories, lo que se llama una Abstract Factory. De este modo, utilizas la implementación de factoría que necesites allí donde estés, pues ella te proporcionará las Specification adecuadas.
* Y, por supuesto, necesitas las Specification.

## Factoría de Specification

En lugar de instanciar Specification con new, usaremos una factoría. La factoría tiene métodos que devuelven una instancia de los diversos tipos de Specification que definas.

Pero, como he señalado antes, para garantizar que cada Factoría concreta tiene métodos equivalentes necesitamos usar el patrón Abstract Factory, que fundamentalmente consiste en una interfaz. Algo así:

{% gist c1988a494d786fc26233d97061c42b98 %}

Las factorías concretas de Specification tienen que implementar esos métodos, lo que quiere decir que van a devolver Specifications adecuadas para la capa o infraestructura concreta.

He aquí un ejemplo algo más sencillo (aunque con una complicación de la que hablaré en la siguiente entrega, como son las Composite Specification):

{% gist 4d87f9b10bad4ea81190ed95d2752ca1 %}

En este ejemplo, podemos ver una factoría que genera Specification para DoctrineDBAL.

Y de eso voy a hablar a continuación.

## Specifications con Doctrine DBAL

Como vimos en el artículo anterior, crear specification concretas para la capa de dominio y repositorios in memory es realmente bastante fácil, ya que se trata fundamentalmente de encapsular las condiciones que debe cumplir el objeto pasado al método <code>isSatisfiedBy</code> (o equivalente), el cual devuelve un bool.

Pero las specification "estándar" no son muy útiles en la práctica si tenemos que hacer consultas a una base de datos. En ese caso, preferimos obtener las cláusulas WHERE de un SQL que nos devuelva el conjunto seleccionado de datos que necesitamos de una tacada (o en el peor de los casos una preselección más manejable que podamos filtrar).

En mi caso, la infraestructura de persistencia es MySQL con Doctrine DBal, así que vamos a ver cómo me las estoy apañando. De hecho creo que en los ejemplos se van a ver cosas que tendría que afinar, pero creo que se va a entender.

Para empezar, voy a considerar que lo que necesito de la Specification es el SQL de las cláusulas WHERE, y para indicar eso voy a llamar al método <code>getConditions</code>, algo más o menos así:

{% gist 8fc8d6da3cf377b1fbf0805bca475065 %}

Es muy simple. Esta Specification me permitirá obtener la lista de blogs activos en el sistema.

Sin embargo, muchas Specification necesitarán algún tipo de parámetro o varios. Por ejemplo, si quiero poder localizar un blog por su nombre:

{% gist 9ae81df9c65149b9a0c15e95de69dd89 %}

El parámetro <code>$slug</code> es el nombre simplificado del blog y se pasa a la Specification en el constructor. Observa que también paso un ExpressionBuilder, que es una clase de Doctrine con la que montar expresiones para las Queries.

¿Por qué lo hago así? En este caso, me interesa por varias razones. En primer lugar, porque es un ejemplo de que podemos pasar a la Specification cualquier dependencia que necesite para desempeñar su función. En el ejemplo no sería realmente necesario ya que la expresión es bien sencilla (<code>'blog.slug = :slug'</code>), pero hay algunas expresiones para las que ExpressionBuilder es mejor solución que hacerlas a mano.

De todos modos, BlogWithSlug desciende de una clase abstracta llamada CompositeDbalSpecification que sí necesita ExpressionBuilder para sus funciones. Pero no voy a meterme en eso ahora.

## Cositas específicas de Doctrine DBAL

Si tienes familiaridad con el QueryBuilder de Doctrine conocerás los parámetros posicionales y los parámetros con nombre. Se utilizan para evitar problemas de seguridad al crear las SQL con información procedente del usuario en queries y prevenir los ataques de SQL injection.

Una solución sería hacer la limpieza necesaria al construir la cláusula en la Specification, pero ya que QueryBuilder la va a hacer cuando se genere el SQL y se ejecute, parece más interesante delegarle un trabajo que hace muy bien.

Así que lo que se me ha ocurrido es que la Specification pueda recoger los parámetros y pasárselo a QueryBuilder cuando éste los necesita. Por eso, he puesto unos métodos de utilidad en la clase abstracta de la que descienden las Specifications. Os presento a **CompositeDbalSpecification**:

{% gist d44ff2ce46bb65a455aeedd6e09a288e %}

Fundamentalmente **CompositeDbalSpecification** nos proporciona soporte para, entre otras cosas, guardar y devolver la lista de parámetros y sus tipos.

Por cierto, es importante guardar las parámetros en el constructor por razones que explicaré en el próximo capítulo.

## Bien. ¿Y esto cómo se usa?

En este ejemplo voy a poner un Read Model, que viene siendo un repositorio sólo para lectura, pero que funcionaría más o menos igual.

{% gist f5e9214720c6cb318e1df894747da32b %}

A este código le falta una mano de lija, pero creo que la idea se ve clara.

La chicha está en las líneas 25 a 29. Construyo la Query con QueryBuilder y le paso las cláusulas de la Specification a través del método <code>where</code>. Si hay parámetros, los paso por <code>setParameter</code>. Luego no hay más que generar la Statement con <code>execute</code> y recoger los datos.

Ahora bien, ¿cómo uso el ReadModel y la DbalBlogSpecificationFactory? Me alegro de que me hagas esa pregunta.

En la capa de Application tengo un BlogService que ejemplifica exactamente eso:

{% gist 160d4c1b1e686367e0e553058811b1ad %}

Al construir BlogService (cosa que ocurre en el Contenedor de Inyección de Dependencias) le pasamos las implementaciones para DBal tanto del ReadModel (o de un repositorio) como de BlogSpecificationFactory. Pero podrían ser otras y no necesitaríamos cambiar BlogService para nada.

En mi caso concreto, BlogService es usando por varios controladores web.

En el próximo capítulo hablaré de cómo usar el patrón Composite para crear Specification sencillas y combinarlas para hacer selecciones más complejas.

De momento, espero que este artículo os pueda ser útil.