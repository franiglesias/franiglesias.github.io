---
layout: post
title: Refactor cotidiano (5). Refactoriza a Enumerables
categories: articles
tags: good-practices refactoring
---

Los **enumerables** son tipos de datos que cuentan con un número finito de valores posibles.

Supongamos el típico problema de representar los estados de alguna entidad o proceso. Habitualmente usamos un string o un número para ello. La primera opción ayuda a que el valor sea legible por humanos, mientras que la representación numérica puede ser más compacta aunque más difícil de entender.

En cualquier caso, el número de estados es limitado y lo podemos contar. El problema es garantizar la consistencia de los valores que utilicemos para representarlos, incluso entre distintos sistemas.

Y aquí es dónde pueden ayudarnos los Enumerables.

Los Enumerables se modelan como Value Objects. Esto quiere decir que un objeto representa un valor y se encarga de mantener su consistencia, disfrutando de todas las ventajas que señalamos en el capítulo anterior.

En la práctica, además, podemos hacer que los Enumerables nos permitan una representación semántica en el código, aunque internamente transporten valores abstractos, como códigos numéricos, necesarios para la persistencia en base de datos, por ejemplo.

## De bool a enumerable

Empecemos con un caso más o menos típico. Tenemos una entidad con una propiedad que es binaria, así que inicialmente la modelamos como `bool`. Esto es manejable mientras la entidad sólo tenga esa propiedad. Es el tipo de propiedades que llamamos flags.

```php

```

Claro que, con el tiempo, se van necesitando otras propiedades para refinar el comportamiento de la entidad, y algunas de ellas también son binarias. En un momento dado, la cosa empieza a ponerse difícil de seguir:

```php

```

¿Cómo podemos mejorar esto? Pues una posibilidad es pasar esas propiedades a Enumerables, encapsulando su valor binario en un objeto.

(Active)

```php

```

Beneficio extra: si necesitamos cambiar el rango de valores. Sólo es añadir los nuevos que necesitemos.
