---
layout: post
title: Historia de una reescritura (5) tests
categories: articles
tags: legacy
---

Mientras el proceso de reescribir vistas avanza, vamos a darle vueltas a una cuestión importante.

La serie **Historia de una reescritura** está compuesta de los siguientes artículos

[Historia de una reescritura (1):](/historia-de-una-reescritura-1)  
[Historia de una reescritura (2): El problema con MVC](/historia-de-una-reescritura-2-el-problema-con-mvc)  
[Historia de una reescritura (3): Empezar con la vista](/historia-de-una-reescritura-3-empezar-con-la-vista)  
[Historia de una reescritura (4): El código tóxico](/historia-de-una-reescritura-4-codigo-toxico)  
[Historia de una reescritura (5): Tests](/historia-de-una-reescritura-5-tests)  
[Historia de una reescritura (6): Autoload sin namespaces](/historia-de-una-reescritura-6-autoload-sin-namespaces)

Si has [echado un vistazo al código de mh13](https://github.com/franiglesias/mh13), es posible que te hayas dado cuenta de que no hay tests. Ni uno.

Esto no quiere decir que el proyecto original no los tuviese. De hecho, los tiene. El problema es que están basados en la _test suite_ de CakePHP, la cual a su vez depende del [viejo SimpleTest](http://www.simpletest.org). Esto no tiene nada de malo en sí mismo, es solo que estos tests existentes no nos van a ayudar mucho y posiblemente no merezca la pena mantenerlos dentro del proyecto, aunque estarán a mano por si pudiesen ser útiles.

¿Por qué no van a ser útiles? Pues porque la mayoría de los tests existentes cubren la capa del modelo, y está va a sufrir una reescritura radical para transformarla en otra cosa. Lo que actualmente vive en la caja marcada con una "M" tiene que separarse en:

* Capa de Dominio, que contendrá lo que antes hubiésemos denominado como "reglas de negocio".
* Capa de Aplicación: que asumirá buena parte de las responsabilidades que ahora ejercen los controladores, cosa que hará mediante Use Cases o Comandos y Eventos.
* Capa de Infraestructura: que se quedará con la parte que tiene que ver con la interacción con la base de datos.

Obviamente, es difícil que los tests existentes resulten útiles, salvo en casos puntuales.

## ¿Qué testear?

No todos los componentes de un proyecto de desarrollo son igualmente testables, o bien, no todos merecen el esfuerzo necesario para crear los tests, y mucho menos si el equipo de desarrollo está formado por una sola persona. Así que es necesario priorizar e ir por partes:

**Vistas**: decididamente no se van a testear. En realidad, en esta fase del proyecto, lo único que estamos haciendo es reescribir el HTML de unas plantillas que ya están funcionando y hacen lo que se espera de ellas. El testing de las vistas llevaría una cantidad enorme de trabajo y el beneficio sería mínimo. En un futuro, cuando empecemos a integrar nuevas funcionalidades, sí sería un aspecto a considerar.

**Controladores**: la idea de los controladores es que sean lo más delgados posible, de modo que su código sea trivial y, por tanto, reducir al mínimo o a cero la necesidad de hacer tests específicos. ¿Es una forma de escaquearse? Yo diría que no. Los controladores deberían limitarse a lanzar comandos y queries que hablen con el dominio y pasar sus resultados a la vista, que ya se encargará de ponerlos bonitos si es necesario. En todo caso, podemos testear que realicen ese trabajo de coordinación, pero tampoco va a ser prioritario. En último término, la idea es que podamos eliminar el controlador y el front controller de CakePHP y reemplazarlo por otro (podría ser Symfony o podría ser otro).

A partir de aquí, comienza el dominio de los tests.

Es decir, dominio (entidades, agregados y sus relaciones) y aplicación (use cases, comandos, eventos) deben ser testados.

En el caso de una reescritura, nos pueden interesar los [Tests de caracterización](http://garoevans.com/blog/2014/06/14/testing-legacy-php-characterization-tests/). Los tests de caracterización son tests que describen el comportamiento actual de una unidad de software y se consideran una especie de red de seguridad. Ojo, no son una especificación, sino solo una referencia.

La idea es simple, preparas uno o varios tests a partir de los resultados que genera actualmente la unidad de software que vas a reescribir. Al decir unidad, puedo referirme a algo relativamente difuso o grande, que posiblemente acumule varias responsabilidades y, por tanto, que acabará troceado en varias partes, cada una de las cuales tendrá sus propios tests o habrá sido diseñada mediante BDD o TDD.

Mi objetivo es que tras la reescritura el test de caracterización siga pasando. Si es así, quiere decir que la reescritura mantiene la funcionalidad "global" que tenía inicialmente. Entonces, podré eliminar el test de caracterización.

Por ejemplo, como muchos de mis controladores ejercen responsabilidades que no les corresponden, un test de caracterización se basaría en describir esa funcionalidad que el controlador realiza aunque no le corresponde.

Mientras voy sacando funcionalidad a otras clases (por ejemplo, comandos), uso el test de caracterización para asegurarme de que la funcionalidad se mantiene en la nueva estructura de código, mientras que cada nueva clase queda cubierta por sus propios tests unitarios.

Una vez que el controlador ha quedado "limpio" puedo retirar el test. El funcionamiento queda garantizado por los tests que cubren las clases que hemos generado, bien en la capa de dominio, bien en la de la aplicación.

Ahora el problema es decidir a quién asignar las responsabilidades que los controladores no deberían tener. Hasta el próximo capítulo.
