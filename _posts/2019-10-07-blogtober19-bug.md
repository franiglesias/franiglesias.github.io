---
layout: post
title: Bug (Blogtober2019)
categories: articles
tags: blogtober19
---

Mi compañera y manager en Holaluz [Mavi Jiménez](https://twitter.com/Linkita) va a hacer un dibujo cada día del mes sobre una palabra propuesta en twitter. Y aquí vamos a intentar escribir [un post por cada una de ellas](https://franiglesias.github.io/blogtober19-status/).

<blockquote class="twitter-tweet" data-conversation="none" data-theme="dark"><p lang="und" dir="ltr">7. Bug <a href="https://twitter.com/dei_biz?ref_src=twsrc%5Etfw">@dei_biz</a> <a href="https://twitter.com/hashtag/Inktober?src=hash&amp;ref_src=twsrc%5Etfw">#Inktober</a> <a href="https://twitter.com/hashtag/inktoberDay7?src=hash&amp;ref_src=twsrc%5Etfw">#inktoberDay7</a> <a href="https://twitter.com/hashtag/linkitober?src=hash&amp;ref_src=twsrc%5Etfw">#linkitober</a> <a href="https://t.co/XdeaSZpaR6">pic.twitter.com/XdeaSZpaR6</a></p>&mdash; Maybe (@Linkita) <a href="https://twitter.com/Linkita/status/1181326480191770625?ref_src=twsrc%5Etfw">October 7, 2019</a></blockquote> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>

## Bug

La primera idea que me viene a la cabeza sobre *bugs* es el famoso informe de [Grace Hooper](https://en.wikipedia.org/wiki/Grace_Hopper#Legacy) sobre la polilla que había atascado el relé 70 del panel F del Mark II. A partir de esta anécdota comenzó a utilizarse el término *bug* para referirse a errores en los sistemas y programas.

A raíz de esto, es interesante preguntarse a qué llamamos un bug y si sería posible llegar a escribir un programa que no los tenga.

### Qué es un bug

Normalmente hablamos de bugs como errores en tiempo de ejecución. Es decir, cuando el programa está funcionando y se encuentra con una situación que no puede manejar y que no puede ser detectada en tiempo de interpretación o compilación.

Algunos bugs pueden ser el resultado de una especificación insuficiente. Por ejemplo, supongamos que tienes un método que internamente realiza una división por un parámetro que recibe y en la discusión nadie te advierte de que podría ser cero en ciertos casos (o generar un cero).

Resultado: **bug**

En otros casos, a lo mejor tu método espera que otros componentes del software le pasen valores dentro de cierto rango y simplemente confía demasiado en que eso será siempre así. Un buen día, el otro componente falla y entrega valores fuera de ese rango.

Resultado: **bug**

O bien, lees de una API de terceros, que obviamente no está bajo tu control, y un día esa API bien por sus propios errores, bien por cambios, empieza a devolver valores que tu método no puede manejar.

Resultado: **bug**

Conclusión: un bug es normalmente el resultado de una condición imprevista y que nuestro código no puede manejar, provocando un error.

### ¿Es posible hacer código libre de bugs?

No, no podemos garantizar un código libre de bugs. Pero podemos hacer lo posible para minimizar su aparición. Para ello podemos aplicar varias estrategias:

* **Saneamiento**: limpiar los inputs al sistema para corregir algunos problemas esperables, como eliminar caracteres sobrantes, etc.
* **Validación**: asegurarnos de que los inputs al sistema cumplen ciertos requisitos y reaccionar correctamente si no lo hacen, devolviendo mensajes de error adecuados.
* **Testing**: poner a prueba las especificaciones de modo que los tests verifican el comportamiento deseado del software. Y, en este caso, son especialmente adecuados los tests unitarios, para garantizar que cada unidad de software es capaz de manejar sus inputs de forma adecuada y defenderse de los que no le son válidos.

### Sobre la validación

He visto algunas veces la discusión sobre dónde debe ponerse la validación. Hay dos posturas extremas:

* La validación debe hacerse siempre cuanto antes, en el momento en que tenemos el input.
* La validación debe hacerse al final, en la unidad que va a procesar ese input, el cual debe entrar intacto hasta dónde haga falta.

Mi postura es más o menos intermedia. Yo considero que hay varios tipos de validación:

* **Una validación sintáctica**: ¿Es este input como debería ser? Es decir, si tiene que ser un número, un string, etc. Podría ser un poco más rigurosa: es un número entero, es decimal, etc.
* **Una validación semántica o de negocio**: ¿Esos valores son válidos dentro de las reglas de negocio?

La validación sintáctica tiene sentido que se realice cuanto antes. Si puede ser, en el front, si no, en el momento en que se reciben los datos.

La validación semántica, por otro lado, es la que se realizaría dentro de la unidad que procesa ese input.

### Herramientas de validación

Dentro del código tenemos muchas herramientas que nos sirven para garantizar que solo usamos datos que podemos manejar:

* **Value objects**. La creación de [value objects a partir de escalares](https://franiglesias.github.io/everyday-refactor-4/) nos permite crear nuestros propios tipos y garantizar que solo llevan valores legales.
* **Cláusulas de guarda**. Nos sirven para definir las precondiciones que deben cumplir los datos antes de procesarlos. [Puedes hacerlas con simples if o con aserciones](https://franiglesias.github.io/guard-clauses-with-asserts/).



