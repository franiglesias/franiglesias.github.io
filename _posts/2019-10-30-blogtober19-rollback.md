---
layout: post
title: Rollback (Blogtober2019)
categories: articles
tags: blogtober19
---

Mi compañera y manager en Holaluz [Mavi Jiménez](https://twitter.com/Linkita) va a hacer un dibujo cada día del mes sobre una palabra propuesta en twitter. Y aquí vamos a intentar escribir [un post por cada una de ellas](https://franiglesias.github.io/blogtober19-status/).


## Rollback

Estamos llegando al final y la última palabra de la lista es Rollback.

Rollback es hacer retornar un sistema al estado anterior a un acontecimiento determinado, como si no hubiese pasado nada. Tenemos estrategias para el rollback en bases de datos, en despliegues y en un montón de cosas más. Es una operación tan necesaria que existe un patrón de diseño para programarlo: [Memento](https://refactoring.guru/design-patterns/memento)

La verdad es que no voy a hablar del patrón porque no he experimentado con él todavía, aunque en alguna ocasión he tenido que ocuparme de dejar las cosas como estaban en caso de error. No es algo que ocurra demasiadas veces, pero siempre es un tema que me ha interesado.

La estrategia que se usa en memento básicamente consiste en hacer una especia de instantánea del estado que me interesa conservar de forma que sea posible restaurarlo en caso de necesidad. Como digo, no es un patrón que haya probado, pero espero hacerlo pronto porque me interesa mucho.

Por alguna razón esto me lleva a pensar en un par de cuestiones a las que no había prestado atención antes. No sé si están del todo relacionadas, pero creo que sí están vinculadas a un aspecto que me está interesando mucho últimamente: la resiliencia.

La idea de resiliencia, en este caso, aplica a que un sistema o, para mis intereses inmediatos, un objeto pueda resistir ciertos malos usos o problemas. Para ello, estoy pensando en dos conceptos:

**Inmutabilidad**: las operaciones de cambio dan lugar a un objeto nuevo, manteniendo el anterior, de modo que en caso de problemas podría volver a usar esa versión antigua.

**Idempotencia**: una llamada a un objeto con los mismos parámetros produce el mismo efecto por muchas veces que se repita y si el efecto ya se había producido el objeto actúa como si no hubiese pasado nada en vez de fallar. Por ejemplo, si queremos cambiar su estado y nos encontramos con que ya estaba en el estado deseado. En este caso habría que prestar atención a posibles efectos asociados (como publicar eventos).

Son temas que me gustaría tratar en el futuro.

En fin, que al final el rollback, se ha convertido en backlog.


