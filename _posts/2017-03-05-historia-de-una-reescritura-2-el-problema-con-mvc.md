---
layout: post
title: Historia de una reescritura (2) el problema con MVC
categories: articles
tags: legacy
---

Esta es la segunda parte del relato del proceso que estoy siguiendo para reescribir una aplicación "legacy".

La serie **Historia de una reescritura** está compuesta de los siguientes artículos

[Historia de una reescritura (1):](/historia-de-una-reescritura-1)  
[Historia de una reescritura (2): El problema con MVC](/historia-de-una-reescritura-2-el-problema-con-mvc)  
[Historia de una reescritura (3): Empezar con la vista](/historia-de-una-reescritura-3-empezar-con-la-vista)  
[Historia de una reescritura (4): El código tóxico](/historia-de-una-reescritura-4-codigo-toxico)  
[Historia de una reescritura (5): Tests](/historia-de-una-reescritura-5-tests)  
[Historia de una reescritura (6): Autoload sin namespaces](/historia-de-una-reescritura-6-autoload-sin-namespaces)

¿Por dónde empezar a atacar estar re-escritura?

CakePHP es un framework que sigue el patrón MVC, esto es: Modelo - Vista - Controlador. Es un patrón habitual en las aplicaciones web, y el propio Martin Fowler lo "bendice" en Patterns of Enterprise Application Architecture. Así que bien, o no.

Por una parte, el patrón propone una separación de responsabilidades bastante clara:

* El Modelo se ocupa de los datos.
* La Vista se ocupa de la presentación de la información al usuario.
* El Controlador coordina a la Vista y al Modelo para que cuando haya cambios en uno se reflejen en el otro.

Si bien Vista y Controlador tienen roles bastante bien definidos, ¿qué queremos decir cuando decimos que "el Modelo se ocupa de los datos"?. Pues muchas cosas, y nada.

El patrón MVC nació para las interfaces gráficas de usuario y ahí está el quid de la cuestión: el modelo sería una representación interna de la información que se presenta al usuario, y nada más. En las aplicaciones web debería ser exactamente igual.

Pero en los frameworks MVC normalmente el modelo se ocupa de muchas cosas, y en particular CakePHP en la versión utilizada en esta aplicación.

En concreto, los modelos se encargarían de las "reglas de negocio" (o dominio) y del almacenamiento de datos. Los modelos CakePHP siguen el patrón Active Record y, por tanto, no sólo saben comportarse conforme a sus roles en el dominio de la aplicación, sino que también saben persistirse y recargarse de la base de datos. Es decir, al menos dos responsabilidades y una dependencia de la capa de modelo de un elemento de infraestructura.

Es necesario separar estas responsabilidades, de modo que los modelos sólo se ocupen de la lógica de negocio (o de dominio), mientras que la persistencia forme parte de la infraestructura. El motivo es tanto la testabilidad (lo que nos ayuda a hacer la aplicación mantenible a medio y largo plazo) y la separación de responsabilidades, lo que nos permite evolucionar cada parte de la aplicación de forma independiente.

Los modelos, en lo que respecta al controlador y la vista, deberían ser simples DTO, lo que implica que el framework MVC esté fuera de la capa de dominio. Esta separación puede sonar muy extraña si sólo has trabajado desde el punto de vista del MVC.

¿Cómo hacer esta separación? Hay varias posibilidades. Personalmente no lo tengo muy definido todavía, pero lo que estoy considerando es:

Capa de dominio, los modelos de CakePHP pasarían a ser entidades de dominio, mientras que la persistencia pasaría a la capa de infraestructura. Una primera aproximación podría ser utilizar la propia infraestructura de persistencia de CakePHP (basada en Active Record) para montar un patrón Repositorio básico, y evolucionarlo a partir de ahí.

Capa de aplicación, basada en comandos, que actuarían entre los controladores y el dominio (también se pueden denominar UseCases).

De manera que pasaría del MVC a un esquema más similar a:

Dominio <- Comandos <- Controlador -> Vista
