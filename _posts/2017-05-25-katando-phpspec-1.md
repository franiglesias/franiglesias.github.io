---
layout: post
title: Katando phpSpec 1
categories: articles
tags: tdd bdd phpspec
---

Voy intentar explicar cómo empezar a hacer BDD/TDD con PHPSpec.

La serie **Katando PHPSpec** consta de los siguientes artículos:

[Katando PHPSpec (1)](/katando-phpspec-1.md)  
[Katando PHPSpec (2)](/katando-phpspec-2.md)  
[Katando PHPSpec (3)](/katando-phpspec-3.md)  
[Katando PHPSpec (4)](/katando-phpspec-4.md)

En esta primera parte, voy a tratar de hacer parte de una kata sacada de [http://osherove.com/tdd-kata-1/](http://osherove.com/tdd-kata-1/) y que nos va a permitir hacernos una idea de cómo trabajar con PHPSpec y la disciplina de TDD.

En la entradilla he puesto BDD/TDD (Behavior Driven Development/Test Driven Development). La verdad es que resulta un poco difícil matizar las diferencias entre un estilo y otro.

[Behavior Driven Development](https://es.wikipedia.org/wiki/Desarrollo_guiado_por_comportamiento) describe una variante de TDD que se centra más en la descripción del comportamiento de las unidades de software que en las afirmaciones sobre sus resultados. Esto nos permite hacer un planteamiento del desarrollo más ligado a los conceptos del dominio/negocio que a los aspectos puramente técnicos.

Pero, pongámonos manos al teclado.


## Preparar el entorno


A partir de aquí vamos a asumir que sabes usar [composer](https://getcomposer.org). Si no lo tienes instalado, ve a la página y [sigue las instrucciones](https://getcomposer.org/doc/00-intro.md#installation-linux-unix-osx), que no tienen pérdida. Lo mejor es instalarlo globalmente.

Ahora, en el lugar donde acostumbres a crear tus proyectos de trabajo, crea una carpeta para este ejercicio. Ponle el nombre que quieras (por ejemplo, kata-phpspec) y trabaja con tu IDE favorito. Si usas PHPStorm, es interesante saber que hay integraciones tanto de Composer como de PHPSpec (éstas son un poco limitadas todavía y no son tan potentes como las de PHPUnit). Para este ejercicio nos vale con un editor y el terminal.

Lo que nos hace falta preparar es un composer.json básico en esa carpeta que reclame como dependencia phpspec/phpspec y defina un autoloader para el namespace. Por ejemplo, algo así:

{% gist db50618bff4a7b5b26966baed91731d6 %}

Nota: como puedes ver hay un montón de valores genéricos en el composer.json, déjalos así o rellénalos como te parezca.

Los que nos importan son el require-dev, autoload y config. Ahora los explico:

**require-dev**: aquí pedimos la dependencia de phpspec/phpspec.

**autoload**: define un namespace kata que apunta a la raíz de la carpeta src. Aún no la hemos creado (la carpeta) pero ya lo haremos luego.

**config**: definimos una carpeta bin para que composer nos ponga un alias del ejecutable de phpspec. De este modo, podremos llamarlo con comodidad mediante bin/phpspec en su momento.

Con esto tenemos el entorno básico definido. Ahora nos toca generarlo.

Para ello abre una ventana de terminal, ve a la carpeta kata-phpspec  y teclea:

```bash
composer install
```

Si todo esta bien, composer realizará su trabajo. El resultado debería ser este:


* Se ha creado una carpeta **bin** que contiene un alias a **phpspec**.
* Se ha creado una carpeta **vendor** que contiene un montón de cosas, empezando por un autoload.php y varias carpetas más, con diversas librerías como phpspec, pero unas cuantas más.
* Se ha generado el **composer.lock**, una versión especial de la configuración de composer que "fija" las dependencias para poder reproducir el mismo entorno en otra máquina. Tampoco nos preocupa mucho esto.


Comprueba que todo ha ido bien tecleando

```bash
bin/phpspec
```

Esto debería dar una salida con la pantalla de ayuda de la utilidad.


## Vamos a empezar


Esta kata busca crear una calculadora un tanto particular. Buscando algún ejemplo me la encontré y me pareció que estaba bien para empezar. Es un problema relativamente sencillo con algún intríngulis interesante y que va planteando nuevas demandas cada vez. Creo que ilustra bien el proceso de TDD para alguien que comienza de cero y permite sacar algunos detalles de PHPspec sin llegar a desbordar.

La idea es generar una clase Calculator con un método add al que se le pasa un string que puede contener una serie de números. Add tiene que devolver un valor entero que sea la suma de los números pasados.

Pero vayamos por partes y veamos el primer requisito que nos piden:

<pre>1. Crear una calculadora con un método add(string $numbers)
    - El método puede aceptar 0, 1 ó 2 números y devolverá su suma (p.e. "3,7", "5").
    - Para una cadena vacía devolverá 0.</pre>

Aunque no está mencionado de forma explícita, la cadena usa como separador la coma, a tenor de los ejemplos.

Lo primero será crear una clase Calculat... ¡Error!

No, lo primero será crear un test mínimo que falle (primera ley de TDD) y que, en nuestro caso, será un test que instancie un objeto de la clase Calculator.

– ¿Y cómo se escribe un test en PHPspec?

Me alegro de que me hagas esa pregunta. Por el momento, vamos a dejar que PHPspec haga este trabajo. Sí, PHPspec puede hacer algunas cosas aburridas de TDD por nosotros.

En PHPspec creamos test para describir clases mediante ejemplos. Al conjunto de ejemplos que describe una clase se le llama Spec.

A fin de facilitarnos arrancar, podemos decirle a PHPspec que queremos describir la clase Calculator, que va a estar en el namespace kata. Esto se puede hacer así, en Terminal:

```bash
bin/phpspec describe kata/Calculator
```

Como salida de esta comando deberías tener algo así:

```bash
Specification for kata\Calculator created in /Users/miralba/Sites/taller-testing-i/franiglesias/spec/kata/CalculatorSpec.php
```

Y en el sistema de archivos te habrán aparecido una carpeta **spec**, con una subcarpeta **kata** y un archivo **CalculatorSpec.php** dentro de ella, así como una carpeta **src**, que es donde va a ir tu código.

Como puedes ver, PHPSpec nos ha ahorrado bastante trabajo. Vamos a ver qué ha hecho en CalculatorSpec.php, que contiene nuestro primer spec y test que fallará. Y fallará porque no existe siquiera la clase Calculator.

{% gist c5e3837711cf7ad6742364c49dbc40c8 %}

Lo primero que observamos (línea 9) es que se ha creado la clase CalculatorSpec que hereda de ObjectBehavior. Esta es la base de los tests de PHPSpec y nos ofrece algunas cosas muy interesantes. Si conoces PHPUnit, te diría que este es el equivalente de TestCase.

Veamos el primer test (línea 11 a 14).

En primer lugar, en PHPSpec a los tests se les llama **ejemplos** y se nombran comenzando con **it** (o **its**) y estilo **snake_case** (o underscore). Sobre este tema del estilo del nombre hay cierta discusión, pero funciona bien y es muy legible.

Cuando escribamos nuestros propios ejemplos, por tanto, debemos prefijarlos con it (o its) y escribirlos en snake_case.

El siguiente punto notable es la línea 13.

En PHPSpec **$this** se refiere a la clase que estamos probando. Es un proxy que nos da acceso a los métodos públicos de nuestra clase, a la vez que nos proporciona varias herramientas de test, que son los **matchers**. Los matchers nos permiten describir cosas que la clase o la respuesta de sus métodos deberían cumplir.

En este caso, la clase debería tener el tipo Calculator.

Otros matchers a este nivel serían, por ejemplo, **shouldImplement** o **shouldBeAnInstanceOf**, que deberían ser bastante autoexplicativos (debería implementar [una interface] y debería ser una instancia de [otra clase], respectivamente).

En fin. Ahora ya tenemos un primer test que aún no hemos ejecutado, así que vamos a lanzarlo ahora. Para ello, en el terminal, le decimos a phpspec que lo haga:

```bash
bin/phpspec run
```

Este comando buscará todos los test que haya en la carpeta spec y los ejecutará. Podemos ser más precisos usando:

```bash
bin/phpspec run spec/kata
```

Que ejecuta todos los tests en una carpeta. O bien:

```bash
bin/phpspec run spec/kata/CalculatorSpec.php
```

Que ejecuta únicamente el test que hay en el archivo indicado.

También se podría hacer usando el namespace, pero en ese caso hay que usar comillas.

```bash
bin/phpspec run 'kata\Calculator'
```

En cualquier caso, al ejecutarlo ocurrirá algo así:

[code language="bash"]
kata/Calculator
 11 - it is initializable
 class kata\Calculator does not exist.

100% 1
1 specs
1 example (1 broken)
87ms

Do you want me to create `kata\Calculator` for you?
 [Y/n]

[/code]

Bueno, en tu pantalla saldrá todo más bonito, con colores y eso.

PHPspec nos dice que ha ejecutado un ejemplo (o test) y que uno de ellos está roto (no pasa, vamos). La razón nos la dice un poco más arriba: la clase kata\Calculator no existe y, por tanto, falla el ejemplo "it is initializable".

Pero PHPSpec no se queda indiferente, y nos ofrece la opción de crear la clase por nosotros. Ya que se ofrece, le vamos a decir que sí, pulsando Y (retorno).

Como resultado, tenemos bajo src una nueva carpeta kata, con un archivo Calculator.php, que contiene (quién lo iba a decir) un esqueleto para la clase Calculator.

Además, PHPSpec ha vuelto a ejecutar la Spec, que ahora pasa, ahorrándonos el tener que hacerlo nosotros.


## Es hora de escribir nuestro primer ejemplo


Hemos completado con éxito nuestro primer ciclo de TDD y PHPSpec se ha ocupado de algunas labores de intendencia. Ahora tenemos que escribir otro test que nos guíe en el siguiente paso.

<pre>1. Crear una calculadora con un método add(string $numbers)
    - El método puede aceptar 0, 1 ó 2 números y devolverá su suma (p.e. "3,7", "5").
    - Para una cadena vacía devolverá 0.</pre>

Tenemos que crear el método add, que tiene que aceptar un string y devolver un número. El caso más "sencillo" es pasarle una cadena vacía y que devuelva 0.

Así que vamos a escribir un ejemplo para eso:

{% gist a1311000ecc6a7d80471bf4b9db92df6 %}

El ejemplo

<pre>it_has_an_add_method_that_accepts_string</pre>

define ese caso más sencillo.

En la línea 18 ocurre todo. Al llamar al método add con una cadena vacía, Calculator (recuerda, representado aquí por $this) debería devolver 0. ```bash
shouldReturn
``` es un matcher para el resultado devuelto por un método y nos sirve para indicar que tal método debería devolver tal valor. [Existen diversos matchers que puedes encontrar en la documentación](http://www.phpspec.net/en/stable/cookbook/matchers.html). Además, cada uno de ellos suele tener sinónimos para que puedas escribir los ejemplos de la manera más natural posible. Por ejemplo, podrías escribir **shouldBe** en lugar de **shouldReturn** y el efecto es el mismo.

Así que ejecutamos de nuevo phpspec, que debería fallar porque nos falta el método add.

```bash
​​​bin/phpspec run 'kata\Calculator'
```

Y efectivamente falla.

[code language="bash"]
kata/Calculator
 16 - it has an add method that accepts string
 method kata\Calculator::add not found.

50% 50% 2
1 specs
2 examples (1 passed, 1 broken)
37ms

 Do you want me to create `kata\Calculator::add()` for you?
 [Y/n]

[/code]

Pero como PHPSpec es así de amable, nos pide permiso para crear al método add, permiso que le damos encantados.

{% gist decee289fedd8a0b0ebde89ba5eef8fe %}

De acuerdo, no es que PHPSpec se haya matado creando el método, pero ya nos ha dado un mínimo para trabajar y nos recuerda que hay que escribir algo. De hecho, el ejemplo sigue fallando porque el método no devuelve nada más que null y debería devolver 0.

Así que subsanamos eso añadiendo una línea return 0;

{% gist ce869a61e14d87bc3c3d665953f8663c %}

Exacto: lo mínimo para que el ejemplo (test) pase. Y lo comprobamos:

```bash
bin/phpspec run 'kata\Calculator'
```

Y ahora resulta que todo es verde y estamos contentos.

Bueno, no del todo. Hay espacio para refactoring. PHPSpec ha puesto el feo nombre $argument1 al parámetro por donde se pasa la cadena a nuestro método. Vamos a cambiar esto por uno más descriptivo, como $inputString, o $input o lo que te resulte más significativo. El test debería seguir pasando.


## Recapitulando hasta ahora


Puedes tener la sensación de que hasta ahora no hemos hecho gran cosa. Sin embargo, la disciplina TDD consiste exactamente en este ciclo:


* Crear un test inicial mínimo que va a fallar
* Escribir el código mínimo que hace que ese test pase
* Si no pasa, hacer los cambios necesarios, pero sólo los necesarios, nada más, hasta conseguir que pasa.
* Si pasa, ver si si podemos hacer un refactoring para que el código sea más expresivo, limpio, claro…
* Crear un nuevo test para afrontar la siguiente fase.


Los test que vayamos pasando van a quedar ahí para asegurarnos de que cada nuevo código que añadamos no rompa la funcionalidad anterior. Es posible que llegue un momento en que "rompamos" con parte de ese trabajo porque vamos descubriendo cosas que nos llevan a diferentes diseños.

Por otra parte, hemos aprendido que PHPspec se ocupa de algunas cosillas de intendencia que resultan cómodas, librándonos de la rutina de crear archivos necesarios y evitando, de paso, algunos errores comunes (como meter algún fallo de mecanografía en los nombres de clases, etc.).


## Pongamos un poco de inteligencia aquí


Ahora mismo, nuestra calculadora es capaz de aceptar una cadena vacía y devolver 0, que es lo que nos pedían. Pero aún nos quedan requerimientos que cumplir.

Vamos a hacer que sea capaz de reconocer que le pasamos una cadena con un único número. El resultado, obviamente tendría que ser el mismo número. He aquí la Spec con el nuevo ejemplo añadido:

{% gist 075b00f41eac173b326eb4ba0da8dbed %}

Y ejecutamos phpspec.

```bash
bin/phpspec run 'kata\Calculator'
```

El test falla, porque add sigue devolviendo 0, así que vamos a corregir eso. La forma más sencilla de hacerlo, es simplemente devolviendo el mismo argumento, ¿no?

{% gist 8626e368449086f2c534ed002a2a1a7b %}

 

Bueno, puede que no. Veamos qué pasa al lanzar PHPSpec:

```bash
bin/phpspec run 'kata\Calculator'
```

```bash
kata/Calculator
 16 - it has an add method that accepts string
 expected [integer:0], but got "".

kata/Calculator
 21 - it can manage a string with one number
 expected [integer:5], but got "5".

33% 66% 3
1 specs
3 examples (1 passed, 2 failed)
25ms
```

No sólo falla nuestro último ejemplo, si no también el anterior.

Esto nos ilustra dos cosas:

La primera de ellas es que nuestra expectativa es que add debería devolver un número entero, no un string (aunque pueda evaluarse al mismo entero), además de que tenga el valor especificado.

La segunda es que el ejemplo/test que escribimos antes, al fallar nos indica una regresión: el cambio que hemos llevado a cabo en la lógica del método altera el resultado en un caso que ya estaba cubierto.

De este modo, debería quedarte clara parte de la potencia de la disciplina TDD: cada test que escribimos y pasamos nos proporciona una red de seguridad para el siguiente paso. Si rompo una funcionalidad que ya estaba presente, sé que la razón de haberse roto es el código que acabo de introducir.

Vamos a arreglarlo. En este caso, lo más sencillo puede ser convertir el valor retornado a int, con intval.

{% gist ad669a572093a73ae0dddb8e99e95f98 %}

Ejecuto el test (¿hace falta que repita cómo?) y veo que ahora vuelven a pasar los dos.

¡Genial!

Como ejercicio, puedes probar un par de valores más en el ejemplo it_can_manage_a_string_with_one_number, por ejemplo con números de varias cifras.


## Un pasito más…


El siguiente requisito que queremos cumplir es que la calculadora pueda manejar dos números y sumarlos. De momento, ya sabemos que se apaña bien con ninguno o con un único número. Esto es lo que nos garantizan los ejemplos/tests actuales.

En principio, vamos a usar como separador la coma, ya que es lo que hemos deducido de los ejemplos que nos hemos planteado al principio. Ahora nos toca crear un nuevo ejemplo en CalculatorSpec que contemple esa posibilidad. Algo así:

{% gist f37e7f3fa5d05d223f68dede2a2b5c6f %}

Si ejecutamos la Spec fallará puesto que nos devuelve como resultado 8 (al evaluar la cadena a entero), cuando debería ser 13, la suma de 8 + 5.

Como es lógico, tenemos que hacer algo para que la cadena de entrada sea descompuesta en la serie de números que la componen. Lo primero que se me ocurre es utilizar explode, ya que conocemos el carácter separador (la coma). El resultado será un array de números que será fácil de sumar.

Dicho y hecho:

{% gist 9154813b2828814dd3a6c323068d789d %}

Al ejecutar spec descubrimos que pasan todos los tests. De momento, vamos bien.

Y con esto, hemos cubierto la primera tanda de requisitos de la kata.

## Un descanso y lo que nos queda

De momento, vamos a parar aquí, pero te propongo alguna cosa para hacer o para pensar.

Puedes crear algunos ejemplos más para probar qué pasa con dos números de más cifras.

El input de usuario puede ser muy variado. Por ejemplo, podríamos tener espacios tras la coma, ¿altera eso los resultados?

Nuestro siguiente requisito (que dejaré para el próximo artículo) contempla la posibilidad de introducir un número indeterminado de números. Piensa un ejemplo para probar esto y reflexiona un momento sobre lo que ha ocurrido. ¿Qué información nos aporta ese nuevo ejemplo? ¿Qué consecuencias tiene eso en la práctica del TDD?

Para terminar. Espero que con esta entrega hayan quedado claras algunas cosas.

Aunque la metodología TDD nos parezca un poco engorrosa se trata más de una actitud y una disciplina que de un dogma. El hecho de que herramientas como PHPSpec nos ahorren algunas cuestiones de intendencia (creación básica de clases o métodos) alivia sus posibles aspectos negativos.

Sin embargo, es muy interesante percibir cómo el hecho de trabajar así nos ayuda a fijarnos metas de desarrollo muy específicas, a la vez que nos ayuda a consolidar los pasos que ya hemos dado, protegiéndonos con una batería de test que fallarán inmediatamente en caso de que los cambios que vayamos introduciendo alteren la funcionalidad ya conseguida.

En la práctica, estos pasos llevan muy poquito tiempo y evitarán errores futuros. En muchos casos, si no en la mayoría, las clases construidas así funcionarán sin problemas cuando las integres con otras o, en todo caso, serán problemas de la comunicación entre ellas, pero no en las clases en sí mismas.

En una [próxima entrega](https://talkingbit.wordpress.com/2017/05/25/katando-phpspec-2/), seguiré avanzando en esta kata y veremos cómo el diseño final va emergiendo a partir de los requisitos que nos vamos proponiendo afrontar.
