---
layout: post
title: Katando phpSpec 2
categories: articles
tags: tdd bdd phpspec
---

Continuamos con la kata iniciada en el artículo anterior.

La serie **Katando PHPSpec** consta de los siguientes artículos:

[Katando PHPSpec (1)](/katando-phpspec-1.md)  
[Katando PHPSpec (2)](/katando-phpspec-2.md)  
[Katando PHPSpec (3)](/katando-phpspec-3.md)  
[Katando PHPSpec (4)](/katando-phpspec-4.md)

El siguiente requisito que vamos a implementar en nuestra Calculator es:

<pre>2. Haz que el método add pueda manejar un número desconocido de números.</pre>

Llegados a este punto espero que ya sepas lo que toca hacer: preparar un ejemplo que lo refleje y lanzar phpspec esperando que el ejemplo falle. Un ejemplo como el que puedes ver aquí:

{% gist 9ead41bb322dbfdb5cca53b0ef2a5aa0 %}

¡Pero este test no falla!

Esto tiene varias lecturas.

Una posibilidad es que ya tengamos cumplido el requisito con nuestro código anterior. Es decir: el algoritmo que habíamos creado para resolver los casos anteriores es suficientemente general como para resolver este nuevo caso sin tocar nada más. Es lo que sucede en este ejemplo: nuestra simple estrategia de dividir la cadena por el separador funciona para cualquier cantidad de números. No deja de ser una buena noticia.

Sin embargo, un test que no falla en el primer pase para un nuevo requisito no nos aporta mucha información y tenemos que detenernos a pensar si estamos haciendo algo mal.

¿Y si el test no fuese bueno? Podría ocurrir que escribamos un test que no sirve para evaluar la nueva condición. A lo mejor resulta que está probando algo que ya está probado por otros tests. En ese caso, deberíamos desecharlo y crear un nuevo test.

Si finalmente decidimos que el test sí prueba lo que queremos (en este caso que podemos pasar una cantidad indeterminada de números al método add) el test nos servirá como prueba de regresión en el caso de que el código que vayamos añadiendo introduzca problemas.

Por tanto, una vez que hayamos tomado una decisión al respecto de este último test y de lo que prueba, podremos seguir con nuestro trabajo de cubrir nuevas demandas.


## Nuevos requisitos


En esta iteración nos piden lo siguiente:

<pre>3. Haz que el método add pueda manejar retornos entre números en lugar de comas.
    - "1\n2,3" es correcto (== 6);
    - "1,\n" no es correcto</pre>

Ahora el método add tiene que ser capaz de entender que los números pueden estar separados por retornos de carro y por comas.

Además, también nos dice que no es correcto si la cadena termina con separadores en lugar de con números. Nos dice que no es correcto, pero no nos aclara mucho sobre qué debemos hacer, si lanzar una excepción o intentar "sanear" la entrada antes de procesarla. En este caso, vamos a lanzar una excepción, lo que nos permitirá aprender a chequear esto con PHPSpec y algunas posibilidades más.

Como los ejemplos son muy claros, vamos a utilizarlos tal cual, empezando por el primero. (Nota: paso la cadena entre comillas dobles para poder representar el cr más fácilmente).

{% gist af5e6dbf96ad773ee30c8ece29c17856 %}

Como era de esperar, nuestro ejemplo falla, al devolver 4 en lugar de 6. Por lo tanto, toca volver al código y modificarlo para conseguir superar esta prueba.

Se me ocurren un par de posibilidades:


* Una es reemplazar todos los retornos con comas y fragmentar la cadena como antes, reduciendo el problema a uno conocido.
* La otra es usar preg-split para fragmentar la cadena con una expresión regular que abarque los dos caracteres que usamos como separadores.


Tengo la impresión de que la primera de las opciones va a ser más sencilla, así que es la que utilizo.

{% gist dc2c00ad46d7aef5da75ae2045778216 %}

¡Bingo! La Spec pasa completa y ya tenemos 6 ejemplos para tres líneas de código.

Cierto, parece exagerado. Pero TDD es así. Los tests no son un suplemento al código de la aplicación, son "ciudadanos de primera" en tu proyecto. Ten en cuenta que Calculator, hasta ahora, cumple a la perfección con todos los requisitos que nos han ido poniendo.

Bueno, no todos. Nos queda uno por resolver. Volvemos a la Spec y creamos un ejemplo que lo cubra. La clase debería lanzar una excepción si la cadena de entrada termina con separadores. Te presento el método shouldThrow.

{% gist 0198c33d5ab02156a933b19fe8d551fb %}

Para controlar que Calculator lanza una excepción usamos el método shouldThrow., al cual hay que pasarle el tipo de excepción que esperamos recibir (en nuestro caso InvalidArgumentException, pero puede ser cualquiera). Además hay que indicarle el método en que esperamos que se lance la excepción y los argumentos que le pasamos, que irán expresados en forma de array. Es un poco extraño la manera de invocar esto, pero no tiene mayor problema. Sí que te aviso de que un error frecuente es el de no pasar los argumentos en un array.

Al ejecutar la Spec veremos que no pasa, ya que no se lanza ninguna excepción. Tenemos que implementar eso.

Lo que yo he pensado es aprovechar lo que ya he programado, convertir los retornos en comas, y controlar si el último carácter de la cadena es una coma. Y en ese caso, lanzar la excepción. Para ello podemos hacerlo con regex o con funciones de cadena, lo que más te guste.

Después de hacer un par de pruebas, me ha salido algo más o menos así:

{% gist dd677d52de021fa4d57d25711df84a9d %}

¡Ahora sí que cumplimos todos los requisitos! Hemos pasado 7 tests para ello.


## Refactoring


Llegados a este punto es buen momento para ver si podemos mejorar un poco la arquitectura de la solución.

Los condicionales siempre plantean puntos interesantes para iniciar refactorings. Podrías argumentar que para una clase y un método tan triviales no es necesario, pero nunca estaría de más pensar en formas de hacer nuestro código más legible y mantenible.

En este caso la condición de comprobar el último carácter no es obvia a primera vista. Tengo que ejecutarla mentalmente para saber qué está haciendo y por qué. Además, si el resultado es true, lanza una excepción, lo que es un camino de salida forzada del flujo normal del método, más que un camino alternativo.

Suena mucho a "cláusula de guarda", ¿no te parece?

Podríamos moverla a un método con un nombre más explícito y descriptivo.

{% gist d8c26cda159058c64550ea9fd6cdcbf1 %}

Ejecutamos la Spec para asegurarnos de que no hemos roto nada.

Es posible que esto sea un poco de "sobreingeniería" para una clase tan pequeña, pero el resultado es interesante. El código es ahora más descriptivo (aunque la primera línea, en la que normalizamos los separadores, podría merecer también su propio método, puedes hacerlo como ejercicio) y el método se lee mejor.

Si en el futuro necesitamos verificar más condiciones para dar el input como válido tenemos un lugar para hacerlo sin ensuciar el método principal. Por otro lado, si necesitásemos validar el input en otras partes de la clase tendríamos la capacidad de reutilizarlo sin más.

El balance entre avanzar cubriendo nuevos requisitos y refactorizar pronto es algo que tienes que valorar en cada caso. Refactorizar pronto puede ayudar a que, en el futuro, sea más fácil añadir código para las nuevas prestaciones que se nos pidan. En otros casos, a lo mejor simplemente no lo vas a necesitar.

Siempre tienes la opción del [refactoring oportunista](https://martinfowler.com/bliki/OpportunisticRefactoring.html), o sea, que cada vez que revisas el código y ves una oportunidad de refactorizar la aproveches. Al contar con la Spec tendrás una red de seguridad que te permitirá probar el cambio sin estropear nada de lo que ha funciona.


## Recapitulando


En esta segunda entrega de la serie hemos visto varias cosas:


* El problema de los test que no fallan cuando, a lo mejor, deberían y lo que eso quiere decir.
* Cómo verificar que se lanzan excepciones.
* Cómo utilizar una Spec para hacer refactoring cuando nuestra solución comienza a tener cierta cantidad de código.


En la próxima entrega vamos a enfrentarnos a un nuevo requisito que nos permita cambiar el separador que usamos en la expresión. Eso nos va a hacer plantearnos algunas de las cosas que hemos hecho hasta ahora.

En concreto, vamos a descubrir algunos "malos olores" en el código que tenemos escrito. Es posible que ya te hayas dado cuenta. Si no, echa un vistazo de nuevo. Podrás encontrar algún caso de duplicación y valores "hardcoded". Es una buena oportunidad para reflexionar sobre lo que apuntábamos al final del apartado anterior: ¿merece la pena refactorizar para facilitar los cambios futuros o nos basta con dejar las cosas como están?

 

 