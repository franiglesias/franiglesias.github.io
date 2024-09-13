---
layout: post
title: Evita el acoplamiento fuerte con configurable dependency
categories: articles
tags: software-design pulpoCon
---

Seguramente conozcas el Principio de Inversión de Dependencias. Sí, ese mismo: la D de SOLID. El que dice que todo debe depender de abstracciones. Pues no vamos a hablar de él como principio, sino de su aplicación práctica.

Eso de que todo tenga que depender de abstracciones está muy bien, pero no siempre resulta sencillo caer en la cuenta de la potencia que tiene esa idea para lograr un código fácil de mantener y reducir el riesgo en el proceso. Por eso, vamos a hablar de este principio como si fuese un patrón que, como sabrás, nos permite describir un problema conocido asociado a una solución probada.

## La inyección de dependencias

Con frecuencia, se asocia este principio con el patrón de Inyección de Dependencias que nos dice que para evitar acoplarnos a un objeto colaborador, en vez de instanciarlo dentro de el objeto que lo usa, se lo pasemos en la construcción o en el método en que lo necesita.

Como normal general, esto se ha de hacer cuando la dependencia no está bajo nuestro control. En este caso la dependencia:

* Es una librería de tercera parte (o vendor).
* Pertenece a otro módulo o contexto de nuestro proyecto.
* Vive en otra capa de nuestro módulo o contexto.

Pinta bien, pero no es suficiente. La inyección de dependencias reduce la fuerza del acoplamiento entre dos objetos que colaboran, poniendo en valor el uso de composición. Sigue existiendo un cierto nivel de acoplamiento y es aquí donde participa el principio de inversión de control (o inversión de dependencias).

## La inversión de control

El problema de la Inyección de Dependencia es que el objeto consumidor depende del tipo específico del colaborador que le pasamos. Si ese colaborador implementa una tecnología o una librería específica nos acoplaremos a ello en producción. Supongamos que se trata de una base de datos MySQL, para que sea más fácil seguir el hilo.

Pero ahora supongamos que en el entorno local no queremos usar esa misma tecnología, sino SQLite, que es rápida y cómoda para entorno local y testing. ¿Cómo demonios la podemos cambiar según el entorno?

Aquí es donde entra la inversión de dependencias y hace que la solución sea simple. En primer lugar abstraemos el concepto de Acceso a Base de Datos introduciendo una interfaz, definiendo los métodos que necesitamos. Ahora tenemos una abstracción que representa una forma de interrogar a una base de datos, pero no impone ninguna implementación o tecnología específica.

A continuación, haremos que nuestro servicio dependa de esa abstracción y crearemos implementaciones concretas de la misma basadas en las tecnologías deseadas.

Lo único que nos queda es tener un módulo de setup en el que la aplicación se monta con distintos componentes según el entorno de ejecución. Podremos tener tecnologías diferentes en cada uno.

## Configurable Dependency

Alistair Cockburn, padre de la Arquitectura Hexagonal, y su colaborador Juan Manuel Garrido propusieron el nombre Configurable Dependency para definir este patrón. Cockburn, en particular, estaba insatisfecho con los matices negativos de Inversión de Control e Inyección de Dependencias.

https://jmgarridopaz.github.io/content/confdep.html

Configurable Dependency es uno de los fundamentos de Ports and Adapters, pero es muy importante que recuerdes que este patrón puedes utilizarlo en cualquier circunstancia en la que necesites:

* No acoplarte a una librería de tercera parte
* No hablar directamente con un módulo o contexto ajeno al que estás trabajando
* No hablar directamente con otra capa de tu arquitectura

Ventajas

Si una librería o tecnología es actualizada nos basta con incorporar un nuevo adaptador y usarlo cuando estemos listas. Y podemos controlar su introducción mediante feature flags en caso de problemas.

¿Necesitamos cambiar un adaptador por algún motivo? En lugar de modificar el existente, crea una nueva versión a partir del actual y trabaja con la nueva. De este modo, revertirlo será muy fácil en caso de que se introduzcan problemas.

El testing es mucho más fácil. Puedes crear fácilmente fakes, que son implementaciones funcionales de una interfaz, o dobles. Los tests requerirán menos recursos y serán más rápidos, sino tocar ninguna tecnología o atacando servicios externos.


_Una versión reducida de este artículo se publicó en la revista de la PulpoCon24._
