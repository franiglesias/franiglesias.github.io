---
layout: post
subtitle: TDD outside-in con arquitectura hexagonal (3) 
title: Comparativa práctica y conclusiones
categories: articles
tags: software-design design-patterns typescript tdd hexagonal
---

En esta entrega comparo mis impresiones sobre ambas escuelas de TDD outside-in.

<!-- TOC -->
  * [Clasicista vs London School ¿Es un enfoque mejor que otro?](#clasicista-vs-london-school-es-un-enfoque-mejor-que-otro)
  * [Diseño up-front](#diseño-up-front)
  * [Implementación](#implementación)
  * [Tests](#tests)
  * [Completar la tarea](#completar-la-tarea)
  * [I ❤️ London](#i--london)
<!-- TOC -->


## Clasicista vs London School ¿Es un enfoque mejor que otro?

Voy directo a lo que podría ser una conclusión tras haber comparado los pros y contras de ambas opciones, pero es que tengo clara la respuesta antes incluso de hacerlo. No hay un enfoque mejor o peor, siempre que los apliques con honestidad y buena metodología. Cada una de las aproximaciones conlleva una serie de compromisos a cambio de sus ventajas.

Así que lo que viene a continuación es un análisis en el que explico los porqués de mi preferencia personal: la escuela de Londres.

## Diseño up-front

El método clasicista tiene como ventaja posponer muchas decisiones de diseño de software, mientras que el método londinense se basa precisamente en empezar tomando algunas decisiones de diseño, aunque dentro de ámbitos bien definidos. Sin embargo, cuando hemos optado por una arquitectura de aplicación determinada, como es el caso de este ejercicio en el que optamos por usar Arquitectura Hexagonal, ya hemos tomado previamente muchas decisiones, que definen el tipo de componentes que vamos a introducir y sus relaciones. 

En mi opinión, esto limita la ventaja del método clasicista, a la vez que simplifica la fase de diseño en la metodología de Londres. 

Mi impresión personal durante el desarrollo de los ejemplos fue que con el método clasicista me perdí más veces de las deseables. Sin embargo, hay que matizar que para el desarrollo con el método alternativo ya contaba con todo el conocimiento generado por haber escrito antes la versión clásica.

Esto apunta a que el método clasicista puede ser ventajoso cuando la prestación que estamos desarrollando requiere un proceso  exploratorio porque no tenemos claro cómo vamos a implementarla.

En lo que se refiere a diseño, prefiero la metodología londinense porque normalmente ya estaré trabajando con una arquitectura definida y tendré bastante claros los elementos que debería hacer interactuar. En consecuencia, no me preocupa tanto su implementación como su interacción.

## Implementación

Así como en el método clasicista posponemos el diseño, en el método de Londres posponemos la implementación hasta el último momento posible. Esto es porque en esta escuela se prioriza definir qué objetos van a participar en un determinado punto y como van a interactuar, sin que nos preocupe, por el momento, cómo va a funcionar cada uno. Es cuando tenemos lo primero, que nos focalizamos en lo segundo.

En el modelo clasicista, lo habitual es empezar implementando un _transaction script_ que luego vamos refactorizando hasta alcanzar el diseño que mejor nos funciona. Esta ventaja también se diluye un poco cuando trabajamos en un proyecto que ya tendrá muchos componentes que reutilizaremos en nuestro código, haciendo que trabajemos más próximas al planteamiento de Londres de lo que podría parecer.

Así que ambas escuelas trabajan en lo que podríamos considerar una diferencia de fase.

Como comentaba en el apartado anterior, usar la metodología clasicista no me ha ido bien y me ha llevado a algunos caminos sin salida porque en algunas situaciones tomaba decisiones que luego serían cuestionadas por la introducción de nuevos casos. A veces, esto me llevaba a desandar caminos para volver a empezar, con refactors bastante grandes.

Este riesgo también está presente en la aproximación londinense, pero tengo la impresión de que es menos frecuente y que, al posponer los detalles de implementación, la sensación de haber perdido tiempo y trabajo es menor. 

## Tests

Uno de los argumentos que más he escuchado últimamente a favor del método clasicista, es que los tests exteriores te cubren también el comportamiento de los componentes del dominio. Si bien esto es correcto, tengo algunas reservas. Con _outside-in_ londinense he conseguido como _outcome_ una batería de tests que ejercita los componentes en distintos niveles, lo que me proporciona una buena resolución en el nivel micro de la aplicación.

En el ejemplo prácticamente hemos cubierto el desarrollo clasicista con test exteriores, mientras que en el enfoque londinense obtuvimos, además de esos, varios tests unitarios que seguramente nos ayudarán en el futuro a detectar bugs y asegurarnos de que partes específicas de la lógica de negocio funcionen bien, sin necesidad de tener que hacer tests bastante redundantes en el nivel exterior, por ejemplo para probar _edge cases_ que afectan a un solo componente.

## Completar la tarea

Una de las cosas que me fascina de la metodología de la escuela de Londres es que el test exterior me indica cuando finalizar el trabajo: una vez he conseguido poner el test en verde, es señal de que he terminado. Tengo que reconocer que seguir el doble ciclo me genera un estado mental muy relajado y productivo. 

Esto no lo encuentro en la metodología clasicista, cuyo final queda, por decirlo así, más abierto a un posible refactor o a la posibilidad de imaginar algún caso particular nuevo que cubrir.

En todo caso, en ambos casos es importante definir los requisitos de la tarea para acotar bien qué es lo que vamos a desarrollar y cuando deberíamos detenernos.

## I ❤️ London

En fin. Creo que mi preferencia personal está muy clara. Esto no significa que siempre sea estricto a la hora de aplicar la metodología. A veces, el tipo de proyecto o tarea me lleva por otros planteamientos.

Además, me siento solo en esta preferencia, ya que no es precisamente frecuente que sea compartida por otras desarrolladoras.

{% include_relative series/hexagonal-tdd.md %}
