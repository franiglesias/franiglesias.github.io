---
layout: post
title: Katando phpSpec 4
categories: articles
tags: tdd bdd phpspec
---

En las entregas anteriores de la serie he tratado de explicar cómo hacer TDD usando PHPSpec. En esta última, voy a mostrar cómo dar un "salto" en el desarrollo, usando los test existentes como protección.

La serie **Katando PHPSpec** consta de los siguientes artículos:

[Katando PHPSpec (1)](/katando-phpspec-1)  
[Katando PHPSpec (2)](/katando-phpspec-2)  
[Katando PHPSpec (3)](/katando-phpspec-3)  
[Katando PHPSpec (4)](/katando-phpspec-4)

Si recuerdas, esta era la última implementación de la clase **Calculator**. La pongo aquí para referencia:

{% gist a2ca8d7f844e455678bf2044ce560dfe %}

Quizá recuerdes que mi última modificación no me había dejado muy satisfecho, ya que había algunas duplicaciones con las regexp. Podríamos mover todo eso a un método, lo que encapsularía un poco las partes feas.

Por otra parte, si te fijas, la mayor parte del código de la clase se dedica a procesar la cadena de entrada para poder realizar el cálculo. En el fondo, esto es una violación del principio de Única Responsabilidad (la S en [SOLID](/principios-solid/)) ya que la clase Calculator tiene, al menos, dos razones para cambiar.

Si necesito cambiar el modo en que se realiza el cálculo tengo que modificar la clase Calculator (una razón para cambiar). Pero si necesito entender otros formatos de cadena de entrada también tengo que cambiar la clase Calculator (segunda razón para cambiar). Tener más de una razón para cambiar es lo que rompe el principio SOLID.

Así que vamos a hacer un gran cambio de diseño.

Lo que he pensado es que Calculator se limite a sumar los números que existan en la cadena de entrada. Para obtener los números, hará uso de un colaborador llamado Parser, que es quien se encargará de todo lo que tiene que ver con examinar la cadena y obtener los números que contiene.

Ya que estamos, vamos a hacer que Parser devuelva los números en forma de array de entero. Esto es lo que espera recibir Calculator a cambio de la cadena de entrada.

Entonces, ¿como construir el Parser con TDD y que todo funcione igual?

La verdad es que podemos hacerlo de varias formas.

Una de ellas consiste en desarrollar Parser desde cero con la ayuda de PHPSpec. Escribimos diversos ejemplos y desarrollamos la clase tal y como hemos visto en las entregas anteriores. Aquí tienes ParserSpec:

{% gist f5580afcc358f5db3eb3c062f6b46176 %}

Puedes ver que he empezado con ejemplos para capturar la cadena inicial que define un nuevo separador. Al fin y al cabo, ese era el problema que me llevó a replantear el diseño  inicial.

La clase Parse quedaría más o menos así:

{% gist 2c3112b9667d5a2b7723da8677c9d793 %}

Reconozco que no es una belleza, pero de momento hemos logrado eliminar la lógica de "parseo" de Calculator y aislarla en la nueva Parser. En cualquier momento, podemos modificar Parser sin cambiar Calculator, toda vez que Parser devuelva un array de números.

Posteriormente, modificamos Calculator para hacer que use Parser y retocamos CalculatorSpec para comprobar que sigue pasando los tests.

Aquí tienes Calculator, que ha adelgazado un montón:

{% gist 16d4d522fbc2a1917bfeca6d1647c6e6 %}

Y aquí tienes, CalculatorSpec, cuyo único cambio explicaré a continuación:

{% gist 99ebe26538a7e2314287615721bf7c61 %}

Primero, explico lo que ha cambiado en la Spec:

El método <code>let</code> en PHPSpec es similar al <code>setUp</code> de PHPUnit. Se ejecuta siempre antes de cada ejemplo y nos sirve para preparar cosas. Por ejemplo, para "construir" nuestra clase bajo test y pasarle dependencias en el constructor. En este caso, le pasamos Parser mediante el método <code>beConstructedWith</code>  que equivale a llamar al constructor, y así  ver si Calculator sigue pasando todos los tests, cosa que ocurre.

– ¡Un momento! ¡Te has dejado el aislamiento encima del piano!

– Efectivamente, acabo de pasar un colaborador "real" en un test y no un doble.

– ¿Eso no es una herejía merecedora de la hoguera?

– Depende.

Se supone que los tests unitarios sirven para probar las unidades de software en aislamiento. Generalmente eso se interpreta de tal modo que al hacer un test de una clase que utiliza colaboradores (o sea, que tiene dependencias) no se le pasan las dependencias reales, sino "[test dobles](https://talkingbit.wordpress.com/2017/05/19/del-ojimetro-al-tdd/)".

Con todo, conviene no ser demasiado dogmático. A veces utilizar las dependencias reales tiene mucho menos coste que usar dobles. Incluso, en algunos casos podríamos argumentar que la "unidad de software" es, realmente, el conjunto de la clase con sus dependencias.

En este caso, si pasamos un doble de Parser (que sería un Stub) la Spec quedaría más o menos así:

{% gist e666393661cdf882a4880a8493583f3e %}

Y esta Spec resulta bastante problemática por varias razones. pero la principal es que está acoplada a la implementación. Además, lo único que se testea es algo que ya sabemos que funciona bien, la función array_sum.

En todos los casos tenemos que comprobar que llamamos a los métodos <code>parse</code> y <code>getNumbers</code> de Parser, lo cual es un problema. Si cambiamos el modo de usar Parse, los tests de Calculator van a fallar no porque den un resultado distinto, sino precisamente porque ha cambiado la forma de usar el colaborador. A esto lo denominamos como test "frágil" y normalmente es un indicador que de tenemos un mal diseño (algo que no excluyo en este ejemplo, que conste).

O quizá simplemente nos dice que hemos escogido una mala manera de hacer los test. Si en lugar de usar los dobles hubiésemos usando la dependencia, ni siquiera tendríamos que crear nuevos tests.

En resumidas cuentas, usar los dobles, en este caso, nos sale más caro.

Por supuesto, esto no es una normal general y hay infinidad de situaciones en las que el testing con dobles es mucho más recomendable e incluso necesario. Precisamente, estoy pensando en escribir un artículo sobre el tema de los dobles en PHPSpec y cómo usarlos para crear diseños desacoplados dependientes de abstracciones.

Pero para cerrar esta serie quería resaltar algo. El dogmatismo en TDD (y en cualquier otra práctica) nos puede llevar a una situación paralizante.
