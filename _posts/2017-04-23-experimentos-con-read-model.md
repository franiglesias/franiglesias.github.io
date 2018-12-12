---
layout: post
title: Experimentos con read-model
categories: articles
tags: design-patterns
---

En los últimos días he estado trabajando ya en módulos específicos de la aplicación. En concreto la parte del CMS por ser la más visible y conceptualmente bastante sencilla. Así puedo hacer algunos experimentos interesantes en la separación de responsabilidades entre capas.

En principio escribí una capa de dominio para el CMS con entidades y repositorios para artículos y blogs, mientras van surgiendo Value Objects aquí y allá (autores, contenido, etc). De momento, el dominio no es lo bastante complejo para que merezca mucho la pena y las entidades quedan un poco anémicas. Sin embargo, es interesante hacer la separación por lo que pueda venir más adelante al desarrollar la parte específica de creación y mantenimiento de artículos.

Los repositorios tuvieron una implementación provisional utilizando el Active Record de  CakePHP para tener un prototipo funcional del sistema y estudiar algunas ideas (la aplicación estaba escrita originalmente sobre CakePHP y ahora la estoy migrando a una arquitectura limpia con interfaz web basada en Silex).

Posteriormente comencé a implementar los repositorios usando Doctrine Dbal, en parte por aprender a usar la librería, en parte porque no me apetecía meterme con el ORM en este proyecto y también por librarme un poco de la sobrecarga de complejidad que pueda suponer a la larga.

Aquí empezaron a surgir algunas dificultades conceptuales.

## Entendiendo el diseño

Este CMS tiene algunas peculiaridades. Está estructurado en blogs, que son exactamente lo que estás pensando (simples colecciones de artículos), y que para la organización son canales en los que se publica información de interés generada por una determinada sección o departamento.

A la organización le interesa que algunos de esos blogs se presenten de forma agrupada y arbitraria, por lo que introduje el concepto de "Site" como colección arbitraria de blogs. En la versión anterior de la aplicación, los sites se definían en la base de datos y tenían su propia interfaz para CRUD. Ahora lo he reemplazado por un sencillo archivo de configuración en yaml que define cada Site como una lista de blogs.

Otro punto es que los artículos pueden tener distintos estados (borrador, revisión, publicación, cancelado, expirado) y tener tanto fecha de publicación como de expiración. De este modo, tenemos cierta capacidad automática de administración de artículos al poder programar cuando debe poder verse en la página y cuando no.

Cada artículo pertenece a un único blog, pero como un blog puede formar parte de varios Sites, es posible que un mismo artículo pueda aparecer en las portadas de distintos Sites.

Todo esto hace que seleccionar una colección de artículos tenga una cierta complejidad de base ya que hay que considerar si tiene el estado de publicación y si es visible en la fecha actual. Esto es un caso de uso ideal para aplicar el patrón Specification.

## Usando Specifications

La idea sería utilizar Specification para manejar estas peticiones al repositorio de artículos. Esto nos lleva a dos problemas.

El primero de ellos es que, si bien, el patrón specification es muy claro (encapsular las condiciones que deben cumplir las entidades que solicitamos al repositorio), la implementación es problemática, porque no es lo mismo crear una specification para una colección en memoria (un repositorio debe actuar con respecto al dominio como una colección en memoria) que para un dispositivo de persistencia concreto como una base de datos. Eso es harina de otro costal: no puedes plantearte cargar todos los artículos en memoria y luego recorrerlos con la especificación, ni siquiera en situaciones de baja demanda como la de este caso. Este fue un punto de bloqueo para mi y no encontraba referencias claras sobre el asunto.

La solución llevó a través de twitter, gracias a la respuesta de Keyvan Akbary a la pregunta que lancé:

https://twitter.com/keyvanakbary/status/849015360837779462

Keyvan es coautor del libro [DDD in PHP,](https://leanpub.com/ddd-in-php) junto con Carlos Buenosvinos y Christian Soronellas, y como ellos no son generosos, sino lo siguiente, la cosa quedó clara.

Voy a intentar explicarlo:

### Familia de specification por implementación

Además de una interfaz de repositorio debemos definir una interfaz para una factoría de specifications. Esta factoría ofrece métodos para crear los distintos tipos de specifications que necesitemos.

De este modo creamos implementaciones de las factorías de especificaciones que nos dan versiones específicas de la specification en cada sistema de persistencia, pero que son equivalentes semánticamente.

Las specification no implementan una interfaz genérica, si no que debemos definir interfaces para cada tipo de implementación. Por ejemplo, una interfaz de specification para Doctrine Dbal, como en mi caso, y otra para InMemory o lo que se tercie. De este modo, si algún día necesitas dar soporte a otro mecanismo de persistencia, lo que harás será crear una nueva familia de especificaciones y una factoría, del mismo que crearías una nueva implementación del repositorio.

### Repositorios y Read Model

El segundo problema surge cuando empiezo a escribir servicios de aplicación para pedir artículos desde la interfaz web. Cada petición supone un viaje de mapeado entre los resultados de la base de datos, que son arrays en este caso particular; los repositorios, que devuelve entidades de dominio, y un objeto DTO o un simple array para mover los datos de vuelta a la vista.

Es trabajo de más para una aplicación bastante simple, así que me planteo una forma de hacer un "cortocircuito" entre la interfaz web y la base de datos. La idea básica es similar a la Q en CQRS (salvando las muchas distancias, por supuesto): a la hora de mostrar artículos en la base de datos sólo estoy leyendo de la persistencia y realmente no tengo necesidad de pasar por el dominio.

Y es ahora cuando entran en juego los Read Model. En cierto sentido, son similares a los repositorios pero residen en la capa de aplicación (los he definido como interfaces) y se implementan en la infrastructura. La implementación puede usar exactamente las mismas especificaciones que los repositorios para recuperar información. La diferencia principal es que estos Read Model no devuelven entidades de dominio, sino objetos específicos para utilizar en la vista, los que simplifica el mapeado o directamente lo elimina. De hecho, pueden implementarse métodos diferentes para distintas necesidades de las vistas.

Aquí tienes un ejemplo de interfaz:

{% gist 962b9da7c3ba5b145e2f3771657b9c24 %}

Esta es la implementación para DBAL:

{% gist d81cee9f3e20f4932c74147b73666673 %}

Por simplificar he decidido hacer Read Models con varios métodos en lugar de varios Read Model específicos para cada vista, lo que los convierte en una especie de Read Only Repositories. Ya veremos si esto cambia en el futuro, pero queda la puerta abierta a, por ejemplo, tener un servidor de base de datos para escritura y una réplica para lecturas si la demanda subiese significativamente, o bien diferentes tablas para diferentes vistas generadas con proyecciones en un modelo dirigido por eventos.

### Finalmente: servicios

Para manejar los Read Model he creado unas clases Service bastante simples que los controllers utilizan para pedir datos y pasarlos a la vista. Los Services utilizan un una SpecificationFactory para obtener y usar especificaciones a partir de los parámetros de la petición con las que el Read Model obtiene los datos deseados.

Aquí, un ejemplo de servicio, en el que se puede ver un mapeado simple entre el array de resultados y el que espera la vista:

{% gist 45769d2d4269baeb2291b4f8391e23c7 %}

 

 

 

 
