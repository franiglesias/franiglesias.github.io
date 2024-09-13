---
layout: post
title: Modelando el dominio. Un ejemplo con identidades
categories: articles
tags: design-principles design-patterns
---

Todos los modelos son erróneos, pero algunos son útiles.

## Hablemos de mapas

Tomemos por ejemplo, la representación de nuestro mundo en mapas. Los mapas son modelos del planeta Tierra que sirven a distintas funciones y objetivos.

Nuestro planeta tiene una forma cercana a la de una esfera, un poco achatada por los polos. Un globo terráqueo es un modelo de la Tierra y, como todo modelo, es erróneo. Podríamos incluso empezar diciendo que la diferencia de escala ya lo convierte en erróneo. Tenemos la representación plana de la superficie terrestre, por no hablar de los océanos. Pero el globo terráqueo es un modelo útil para muchos usos.

Lo mismo podemos decir de todos los tipos de mapas que podemos crear. Tenemos que convertir una esfera en una imagen en dos dimensiones. Para ello se pueden realizar distintos tipos de proyecciones cartográficas y en todas ellas se toman ciertos compromisos, a la vez que se mantienen ciertas equivalencias con la realidad. [Todas las proyecciones cartográficas son erróneas](https://es.wikipedia.org/wiki/Proyecci%C3%B3n_cartogr%C3%A1fica), porque no representan la realidad tal cual es, pero también son útiles, porque respetan ciertos aspectos de la realidad (ángulos, superficies, distancias...) de forma que nos sirven para conseguir ciertos propósitos.

Asumir que no podemos representar la realidad tal cual es puede parecer decepcionante, pero en realidad es una idea liberadora, ya que nos permite imaginar otras formas de representación que sirvan a un propósito.

Siguiendo con los mapas, podemos fijarnos en el ejemplo en el [mapa del metro de Londres](https://es.wikipedia.org/wiki/Mapa_del_Metro_de_Londres). Su diseñador, Harry Beck, se dio cuenta de que la exactitud geográfica del mapa no aportaba ninguna utilidad a las usuarias, por lo que redujo el mapa a un esquema en que se mostraban las estaciones, unidas por las líneas, señalando de forma especial aquellas que permitían intercambios. Las líneas podían ser verticales, horizontales o diagonales con un ángulo de 45º. Este mapa simplificado se hizo popular enseguida. El modelo era erróneo, pues no representaba las estaciones con exactitud geográfica, pero indudablemente es útil y ha sido adoptado por otros sistemas de transporte en todo el mundo.

## Modelar la realidad en un programa

Por lo general, llamamos dominio a la parte de la realidad que queremos representar en una aplicación de software. Es aquello de lo que trata. Nuestra representación es el modelo del dominio, el cual expresamos con un lenguaje de programación. Nuestro modelo no solo representa elementos estáticos, sino que incluye procesos y comportamiento.


Al modelar dominio podemos encontrarnos con la necesidad de aceptar un compromiso entre una representación ajustada de la realidad o una representación útil.

Ejemplo identidades. Es habitual que en un sistema tengamos que hacer convivir varias identidades para una misma entidad:

* Id actual y legacy
* Id interno y externo
* N-Múltiples identidades

Con frecuencia modelamos esto añadiendo n propiedades a la entidad. Lo que vamos a proponer es modelar el concepto identidad... que puede dar soporte a distintas implementaciones de la misma.

Esto nos permite, además encapsular reglas de negocio y comportamientos asociados con la identidad.

Ejemplos:

* El repositorio de entidades usa distintos soportes físicos dependiendo de si la identidad es actual o legacy.
* Podemos saber si una identidad externa está sincronizada con la interna. E incluso saber en qué dirección tendríamos que realizar la sincronización.


Otros takeaways

* Qué es un value object, vs objeto que no es value object pero que se comporta más o menos igual. O sea, que podemos usar los mismos principios para diseñar objetos que no son VO.
* Diferencia entre VO y tipo.
