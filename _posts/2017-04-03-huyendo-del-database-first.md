---
layout: post
title: Huyendo del database-first
categories: php, articles
tags: bbdd
---

Database-first: al principio puede parecer fácil y hasta lógico. Es como el reverso tenebroso de la Fuerza, pero con datos.

Muchas veces los frameworks MVC proponen una aproximación a partir de la base de datos para generar tus modelos y, partir de ahí, el resto de la aplicación.

Tiene lógica dentro de la versión dura del patrón MVC. El modelo no sería más que la fuente de la que se nutre la vista para mostrar información al consumidor. De hecho, en sistemas CQRS basados en proyecciones que generan tablas de base de datos específicas para dar soporte a las vistas me parece que sería una forma práctica de generar el View Model.

Pero… esto no es aplicable al conjunto de la aplicación. La base de datos es un elemento de infraestructura y, de hecho, las entidades del dominio no se deben concebir pensando en cómo van a persistirse porque la capa de dominio vive en su mundo feliz en el que no depende de nada más que del lenguaje.

Al contrario, es la capa de persistencia la que debe arreglárselas con lo que viene del dominio.

## Un problema cada vez

Al trabajar en un paradigma database-first o database-centric surgen varios problemas. El primero es la dependencia errónea que hace que crees primero las tablas de base de datos y luego los modelos a partir de ellas. Entonces el dominio está más pendiente de ajustarse a las necesidades de la base de datos que al revés y se genera una dependencia técnica. Una de las consecuencias es que cada vez que haces un cambio en uno de los dos extremos, tienes que hacer cambios en toda la cadena.

El otro problema tiene que ver con la mentalidad CRUD que las bases de datos tienden a condicionar. En algunos MVC los modelos ni siquiera necesitan código porque se limitan a las operaciones CRUD y estas vienen dadas en la clase base que extiendes para crear los modelos. Ni siquiera tienen propiedades aparte de las que necesitan para relacionarse con la base de datos.

La arquitectura limpia lo que propone es que las entidades viven en la capa de dominio, tienen las propiedades que necesitan y estas se definen utilizando Value Objects o primitivas según sea necesario, sin tener en cuenta cómo se van a guardar en la base de datos, si es que se van a guardar en una base de datos, ya que el mecanismo de persistencia podría ser cualquier otro.

Cuando una entidad tiene que ser persistida o, en general, utilizada por otra capa del sistema, su información debe pasarse a otro objeto que pueda mover la información de manera adecuada. Por lo general, estos son Data Transport Objects (DTO) que únicamente llevan datos y no comportamiento (no hacen nada con la información que transportan). En ese sentido, por ejemplo, las entidades de Doctrine (o de cualquier otro ORM) no son las Entidades del dominio, sino DTO y debe hacerse un mapeado de unas a otras.

Puedes imaginar los DTO como "interfaces de datos" que aíslan las capas entre sí. La capa de persistencia es la que tiene que ocuparse de entregar el objeto adecuado a quién se lo pida y persistir lo que se le entrega de la mejor manera posible.

Y esto me lleva a otra cosa que trataré en otro artículo: no todo tiene que persistirse en una base de datos.
