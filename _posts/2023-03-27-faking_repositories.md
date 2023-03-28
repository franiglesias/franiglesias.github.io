---
layout: post
title: Dobles de repositorio para tests
categories: articles
tags: good-practices testing
---

Para testear casos de uso es frecuente que utilice dobles de repositorios u otros servicios de almacenamiento. Estos dobles guardan su contenido en memoria durante la ejecución del test y son realmente rápidos. Pero para poder hacer esto, es necesario tener un buen diseño.

La razón de no usar tecnologías reales de persistencia es, sobre todo, evitar el coste de preparación y, sobre todo, la penalización del rendimiento de la suite de tests. Por esa razón, aplicando el principio de inversión de dependencias es muy fácil disponer de distintas implementaciones para producción y para tests.

Una objeción que me suelen poner a esta forma de trabajar es que no testeo la persistencia como tal, es decir, no sé si mis objetos se van a guardar en la base de datos física. La respuesta es que distintos tipos de tests verifican distintas partes de la funcionalidad. De este modo, hay tests _end to end_ en los cuales sí utilizo recursos reales y cuya función es garantizar que la aplicación funciona correctamente como conjunto.

El gran problema de los tests _end to end_ es que son tremendamente costosos, por lo que solemos limitarlos a happy paths. En lugar de intentar cubrir todas las posibles circunstancias, nos centramos en los usos más comunes que garanticen la aplicación se comporta correctamente en su uso normal.

Para cubrir todas las circunstancias de funcionamiento, _edge cases_ y combinatorias de parámetros y resultados es preferible hacerlo con tests unitarios. Aquí hay que hacer una aclaración. Por tests unitarios me voy a referir a tests que evitan las dependencias de tecnologías concretas, independientemente de si su ámbito es una clase o un conjunto de ellas trabajando juntas.

Todo ello se relaciona con una buena arquitectura en la que la lógica de negocio, la que satisface las necesidades de las usuarias, está bien separada de la implementación concreta. Esta implementación es un detalle que debería poder cambiarse. Mucha gente objeta que nunca vas a cambiar de base de datos, por poner un ejemplo muy habitual. Pero la verdad es que siempre vas a cambiar de base de datos, porque en algún momento necesitarás cambiarla para hacer un test. Y si no es el _vendor_ de base de datos, es posible que cambien sus _drivers_, o que cambie su versión, tal vez introduciendo mejoras, o cambiando la forma de hacer ciertas cosas. Por esa razón, es necesario pensar en la tecnología como algo que puede cambiar y actuar en consecuencia.

La mejor forma de gestionar eso es usar la inversión de dependencias y hacer que nuestra aplicación dependa de abstracciones, usualmente interfaces, de modo que podamos crear diversos adaptadores. Podemos ver esto ilustrado en esta imagen:

![Diagrama mostrando un patrón port and adapters en el que un caso de uso depende de una interfaz implementada por dos adaptadores](/assets/images/faking_repositories/invert_dependencies.png)
