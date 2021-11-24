---
layout: post 
title: Outside-in y Behavior Driven Development 6 
categories: articles 
tags: tdd php bdd
---

Consideraciones sobre el desarrollo con Behavior Driven Development

1. [Introducción, herramientas y ejemplo](/outside-in-with-behat-phpspec/)
2. [Desarrollo del segundo escenario](/outside-in-with-behat-phpspec-2/)
3. [Desarrollo del tercer escenario](/outside-in-with-behat-phpspec-3/)
4. [Manejando bugs con BDD](/outside-in-with-behat-phpspec-4/)
5. [Añadiendo nuevas features](/outside-in-with-behat-phpspec-5/)
6. [Consideraciones sobre BDD](/outside-in-with-behat-phpspec-6/)

## Outside-in TDD vs BDD

Outside-in TDD y BDD se superponen, aunque no es exactamente lo mismo. Empecemos con las semejanzas.

Ambas aproximaciones comienzan definiendo el comportamiento de un sistema mediante un test de aceptación. Este test de aceptación ejecuta el sistema usando sus propios puntos de entrada. Este test fallará, como es de esperar, porque no tenemos el comportamiento testeado en el sistema.

Para incorporarlo vamos desarrollando los diferentes componentes usando tests unitarios hasta lograr que el comportamiento se cumpla tal y como es definido en el test.

Aquí ya podríamos tener una diferencia. Outside-in TDD especifica una direccionalidad del desarrollo de los componentes, en BDD diría que esto no es obligatorio. Sin embargo, si aplicas esta direccionalidad las ventajas son muy evidente.

¿Qué entiendo aquí por direccionalidad? Pues básicamente me estoy refiriendo a que en Outside-in TDD seguimos un orden al desarrollar componentes que va desde el más externo, como puede ser un controlador, al más interno, que será posiblemente un servicio o una entidad de dominio. En cada uno de los pasos se aplicaría "suficiente diseño" del componente, posponiendo las decisiones sobre los componentes más internos.

En BDD no hay nada que nos fuerce a seguir esta direccionalidad. Podríamos diseñar todo el sistema y empezar a implementar desde la capa de Dominio hacia fuera. Pero, del mismo modo, no hay nada que nos impida usar el enfoque Outside-in con BDD, que es lo que hemos hecho en esta serie.

Por otro lado, tenemos las herramientas. Puedes hacer Outside-in usando un único framework de test (**PHPUnit** o el que prefieras para tu lenguaje en particular). En cambio, para hacer BDD necesitarás un port de Cucumber (**Behat** en PHP, casi cada lenguaje tiene el suyo), de modo que puedas escribir los tests de aceptación como _features_ en _gherkin_. 

Aquí es donde nos encontramos con la mayor diferencia y, a la vez, con la mayor ventaja para BDD. 

Los _tests-feature_ de BDD aportan muchos beneficios al desarrollo. Veamos:

* Podemos escribir estos tests con ayuda de los expertos del negocio. Aprender a usar _gherkin_ es realmente fácil, ya que no es más que aplicar una cierta estructura al lenguaje natural.
* Al ser fáciles de escribir se favorece prestar atención a los diversos escenarios, tanto los _happy paths_ como los _sad paths_. Nosotros no lo hemos hecho en el ejemplo para no alargar el proyecto.
* Los diversos escenarios que constituyen las features suelen proporcionar un slicing adecuado para definir entregables que aporten valor. Simplemente, tienes que escoger el siguiente escenario más importante no implementado aún.

Implementar las definiciones de los pasos resulta también bastante más sencillo que escribir un test de aceptación completo en un framework como PHPUnit. Cada paso delimita una acción muy específica que, además, es reutilizable.

En esta serie hemos usado **phpspec** como framework para los ciclos de desarrollo en TDD. Existen frameworks equivalentes en otros lenguajes. Si bien no es necesario usar esta herramienta específica, la sensación general es de que el desarrollo se hace mucho más ágil y los tests necesitan menos preparación.

Esto es debido a que **phpspec** ha sido diseñado con una opinión muy marcada acerca de cómo desarrollar y favorece ciertas prácticas sobre otras. La utilidad brilla en TDD, pero es algo más incómoda para tests de QA orientados a regresión. No estoy diciendo que no deba usarse, [sino que no está pensada para eso](https://inviqa.com/blog/my-top-ten-favourite-phpspec-limitations). Su peculiar sintaxis, en la que `$this` es el _Subject Under Specification_ enfatiza esto.

Por supuesto, puedes usar PHPUnit para los tests unitarios, especialmente si es una herramienta con la que tienes más familiaridad. Pero, comparativamente, los tests requieren más trabajo y más setup. La mayor ventaja es que resulta fácil convertir un test de TDD en un test de regresión.

En el ejemplo de la serie he separado las especificaciones en una carpeta diferente a la de test. Mi objetivo era justamente enfatizar la diferencia entre los ejemplos para guiar el diseño o desarrollo y los tests de regresión.

Tras la experiencia de esta serie de artículos y los capítulos del libro sobre Outside-in TDD ([reflejados en estos vídeos](https://youtube.com/playlist?list=PLYT8quZ2BEnb8qo8y9gUXjowYeMbIIVRe)) y si tuviese que definir mi flujo de trabajo ideal combinaría ambos enfoques: BDD con una orientación Outside-in:

* Definir los tests de aceptación como features en _gherkin_.
* Escoger el primer escenario para entregar.
* Implementar las definiciones de los pasos con **behat**.
* Desarrollar siguiendo la metodología outside-in con **phpspec** hasta completar el escenario.
* Escoger el siguiente escenario...

En cuanto a los tests de regresión los escribiría en **phpunit**, poniendo foco sobre todo en los casos de uso y, en general, en dominio.
