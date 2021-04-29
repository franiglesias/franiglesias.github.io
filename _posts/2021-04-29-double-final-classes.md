---
layout: post
title: Dobles de tests y clases finales
categories: articles
tags: testing tdd
---

Las clases marcadas como `final` indican que no pueden ser extendidas. Eso añade un extra de dificultad en ciertos tests.

En general, [marcar las clases como finales es una buena práctica](https://matthiasnoback.nl/2018/09/final-classes-by-default-why/). Tanto es así, que una recomendación sería incluirlo en las plantillas y generadores de código de tu IDE. De este modo, tienes que decidir si necesitas quitarla y te ayudará a no usar la herencia cuando no es apropiada. Por defecto, [usa `final`](https://ocramius.github.io/blog/when-to-declare-classes-final/).

Pero si una clase tiene la marca `final` también significa que no se puede doblar en caso de que necesites pasarla como dependencia a una clase que estás testeando. Esto no es razón suficiente para dejar de marcar clases como finales, sino que debería servir como piedra de toque para reflexionar acerca de qué y cómo estamos testeando. Tampoco sería una buena idea usar [Bypass-finals](https://github.com/dg/bypass-finals), una librería que elimina la clave al vuelo, permitiendo doblar esas clases.

## Entonces, ¿cómo puedo usar clases finales como dobles?

### Newables

La primera pregunta que yo me haría es la siguiente: ¿se trata de una clase _newable_? 

Una clase _newable_ es una clase que se pueda instanciar en cualquier momento y no tiene dependencias que no sean _newables_. En esta categoría entran Value Objects, Entidades, DTO, Eventos y otros objetos-mensaje, así como servicios que no tengan dependencias externas.

Los _newables_ no necesitas doblarlos, puedes usarlos tal cual. Incluso en el nivel unitario.

### Injectables

Las clases _injectables_ son las que no podemos instanciar en cualquier momento y que, habitualmente, tienen dependencias externas, que se les pasan mediante inyección también cuando es necesario. También pueden ser dependencias de estado global o de servicios externos. Típicamente son las que definimos en el contendor de inyección de dependencias.

¿Qué podemos hacer con ellas? Si no tienen ninguna dependencia serían como _newables_, por lo que no deberías doblarlas.

En caso de tener dependencias, una opción que puedes considerar es tratar de doblar esas dependencias. Un repositorio que usa el `EntityManager` de Doctrine puede haber sido declarado como _final_, pero nada te impide instanciarlo y pasarle un doble del EntityManager. De este modo, doblas la dependencia externa y puedes seguir usando la clase final como colaboradora.

### Usa la interfaz

Si la clase en cuestión implementa una interfaz o extiende una clase abstracta, crea el doble usando estas, ya sea mediante una librería o implementando clases anónimas _ad hoc_ para el test.

Si la clase final no implementa una interfaz explícita, considera extraerla. No hace ningún daño y proporciona beneficios a futuro.

Si consideras que no tiene sentido extraer una interfaz, es posible que entonces tampoco tenga sentido tener la clase marcada como _final_. Como dice el artículo de Marco Pivetta, usar final no tiene sentido si no se cumplen dos condiciones:

* No hay una abstracción (interfaz) que la clase final implemente.
* Toda la API pública de la clase final es parte de la interfaz

Que básicamente se resumen en cumplir el principio de sustitución de Liskov (aplicado a extensión mediante herencia y las interfaces).

En ese caso, el de que usar _final_ no tenga sentido, es mejor que desmarques la clase.
