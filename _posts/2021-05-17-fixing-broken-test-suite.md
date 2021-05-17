---
layout: post
title: Arreglando una suite de tests rota
categories: articles
tags: testing good-practices
---

En este artículo intentaré contar como suelo "entrar" en un proyecto.

Hoy por hoy, es necesario tener una buena batería de tests de desarrollo que nos permitan tener una red de seguridad tanto para añadir nuevas prestaciones como para refactorizar el código.

En ocasiones me ha tocado entrar a trabajar en un proyecto existente y, con cierta frecuencia, me he encontrado con que los tests no están en muy buen estado. Echando la vista atrás, mi metodología es más o menos la que explico a continuación.

## ¿Hay tests?

Pues a veces no, así que hay que decir por dónde empezar y cómo. Esto lo dejaremos para otra ocasión.

## Que la suite de test funcione

El primer paso parece obvio y es hacer funcionar la suite de test. No sería la primera vez que no se puede ejecutar, bien sea porque en su día se abandonó por alguna circunstancia, bien porque empezó a fallar y se tiró para adelante igualmente. Así que cuando preguntas, nadie sabe decirte si actualmente funciona o no.

Cuando digo que no funciona, básicamente quiero decir que:

* No se pueden ejecutar los tests de ninguna manera.
* La suite se ejecuta, pero fallan todos o parte de los tests por algún tipo de error de configuración, recursos que faltan, servicios a los que no se puede acceder, etcétera.

Un caso que me he encontrado es que la suite no es ejecutable en local, pero sí en el entorno de integración continua. Esto puede ser debido a varias causas, por ejemplo:

* No hay un entorno virtualizado (docker, vagrant, etc.) que permita igualar el entorno de desarrollo local, así que solo se consigue hacer funcionar completa en según qué máquinas o según por quién.
* Algunas dependencias del entorno, como bases de datos, otros servicios, no se han include en el entorno virtualizado, lo que hace que la suite de tests sea muy lenta, requiera credenciales, etc., y al final se prefiere hacer Pull Request para ver si los tests pasan en CI.

En esta situación nuestro objetivo es hacer pasar la suite sin tocar la lógica de los tests, aunque posiblemente tendremos que arreglar aspectos del set up.

Así que el primer trabajo es entender por qué la suite no funciona y arreglarlo.

## Hacer la suite ejecutable en un ordenador aislado

Mi objetivo es que la suite se pueda ejecutar completa en un entorno local sin conexión a Internet. Esto suena un poco radical, pero explicaré cuáles son mis motivos.

Una suite de tests para desarrollo debería poder ejecutarse sin acceder a ningún tipo de servicio externo. Por ejemplo, una base de datos accesible en la red local a través de una VPN. Esa base de datos es, además de lenta, compartida, lo que significa que nunca tienes garantía de que las condiciones del test sean limpias.

Así que dependiendo del estado del entorno local los pasos serían:

* Virtualizar el entorno local.
* SI está virtualizado, pero hay dependencias que no lo están (p. ej., la base de datos), introducirla en el entorno, averiguar si tengo que incorporar algunas fixtures, etc.
* Algunos servicios externos pueden ser reemplazados por dobles o _fakes_. Por ejemplo, un sistema de colas con frecuencia se puede sustituir con un _stub_ porque la consumidora de los mensajes es otra aplicación.

Para investigar todo esto lo que hago es sacar una rama del repositorio del proyecto en la que voy haciendo pruebas y cambios para identificar los problemas y posibles soluciones. Hago rebase de la rama principal frecuentemente para estar lo más al día posible. 

Cuando consigo llegar a un punto en que me siento razonablemente satisfecho lo que suelo hacer es sacar una nueva rama desde la base a la que me traigo un grupo de cambios particular que considero que puedo mezclar sin riesgo, aunque de momento no se vayan a usar. Habitualmente son un par de archivos bastante inofensivos. Con esto limpio mi rama de trabajo. Poco a poco voy incorporando cambios hasta que puedo fusionar esta rama de forma que se pueda empezar a usar el nuevo entorno.

Si identifico tests que fallan por algún problema en su lógica, hago lo mismo. Es decir, introduzco esas correcciones para mezclar cuanto antes siempre que tenga cierta seguridad de que no van a provocar ningún efecto indeseado.

No puedo entrar en mucho detalle porque cada caso es un mundo, pero sí puedo decir que en una suite muy grande es frecuente que tres ó cuatro problemas expliquen un buen número de tests que fallan, por lo que se avanza relativamente rápido.

Una parte del trabajo consiste también en automatizar las soluciones. Por ejemplo, puede pasar que al principio tenga que reconstruir la base de datos manualmente y poblarla con alguna fixtures, hasta que puedo automatizarlo. En parte, prefiero dejar esto para el final, cuando tengo una idea clara de lo que realmente necesito incluir.

## Conseguir que se pueda ejecutar la métrica de cobertura

Como sabéis no soy nada fan de la métrica de cobertura, excepto en una situación: cuando estoy intentando diagnosticar el estado de los tests de un proyecto. Así por ejemplo, una cobertura global por debajo del 50% me indica que la confianza en el código es baja. Otras señales son el hecho de tener que probar manualmente los cambios o que haya errores que no se detecten en tests, sino que aparecen únicamente al desplegar en producción.

Si el número de tests es razonablemente alto y la cobertura es baja, me está diciendo que solo se testea parcialmente, o que hay muchísimo código no usado o en el que no se está trabajando.

Identificar estas partes del código que no están cubiertas por tests, puede ser una forma tanto de ayudar a localizar código que puede eliminarse, como para identificar áreas que tienen problemas de ownership o en las que, por la razón que sea, no se testea aunque se debería.

En cualquier caso, es información valiosa. Cada problema tiene una aproximación distinta y un abanico de soluciones diferente.

## Refinamiento del entorno local

La falta de servicios virtualizados locales no es la única causa de problemas en los tests. Una vez que estas dependencias se han resuelto y la suite se puede ejecutar completa, es muy posible que empiecen a aparecer inconsistencias de todo tipo.

Muchas de estas inconsistencias se relacionan con problemas en la configuración de detalles del entorno, lo que incluye valores por defecto u opciones de configuración de las que no hemos controlado su valor. Por ejemplo, en una ocasión descubrí que el php.ini del entorno virtualizado no definía una zona horaria por defecto, con lo cual algunos tests pasaban solo si se ejecutaban individualmente, y fallaban al ejecutarse con el resto de la suite. Este tipo de fallos indica dependencias entre tests. La explicación de este misterioso comportamiento era que unos tests modificaban la zona horaria asumiendo una zona por defecto que realmente no era la esperada. El siguiente test se encontraba con este parámetro en un estado indeterminado.

Estrictamente hablando, esto es una dependencia de estado global: los tests dependen del estado del entorno en que se ejecutan y si no está definido de manera explícita el comportamiento será indeterminado.

Otra fuente de dependencia global entre los tests es el uso de una base de datos real. En general, nos obliga a tomar medidas anti-polución de los datos. Para esto es habitual tratar de ejecutar tests o test cases en una transacción y hacer un rollback al finalizar. Pero hay que tener mucho cuidado de asegurarnos de que las transacciones incompletas se gestionan bien, puesto que un test que falle dejando la transacción sin cerrar de algún modo (ya sea rollback o commit), hará fallar el siguiente test cuando intente iniciar una nueva transacción.

Cada test debería poder ejecutarse de forma completamente aislada. Una forma de analizar esto es permitir que los tests se ejecuten en su propio proceso (algunos test runner te darán esta opción). Esto puede hacer que te caiga el alma a los pies, pero es una buena forma de encontrar algunos defectos de la suite que podrían pasar desapercibidos.

## Los últimos tests que fallan

A medida que vamos resolviendo problemas los tests que quedan fallando lo hace por causas cada vez más extrañas o difíciles de diagnosticar. En general, siempre será algo que tenga que ver con algún detalle de configuración del entorno en el que no se nos ocurre pensar o que es difícil de identificar.

Si tenemos un entorno en el que sí se ejecutan, lo más adecuado sería reproducirlo en cada detalle. Por ejemplo, copiando archivos de configuración, dockerfiles, etc.

## Sanando la suite de tests

Una vez que logramos que todos los tests se puedan ejecutar en local es hora de empezar a investigar si podemos mejorarlos. Seguramente encontraremos una buena cantidad de smells y malas prácticas.

En este punto, lo ideal es lanzarla para obtener el informe de cobertura. Muchos IDE nos permiten tener una indicación visual de las líneas que son ejecutadas y de las que no. Con esta información podemos identificar código no usado que podríamos llegar a borrar pronto.

Por otro lado, la intervención para mejorar la calidad de los tests debería empezar en aquellas áreas en las que estemos trabajando.

