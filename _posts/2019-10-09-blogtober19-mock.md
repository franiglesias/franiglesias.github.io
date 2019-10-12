---
layout: post
title: Mock (Blogtober2019)
categories: articles
tags: blogtober19
---

Mi compañera y manager en Holaluz [Mavi Jiménez](https://twitter.com/Linkita) va a hacer un dibujo cada día del mes sobre una palabra propuesta en twitter. Y aquí vamos a intentar escribir [un post por cada una de ellas](https://franiglesias.github.io/blogtober19-status/).

<blockquote class="twitter-tweet" data-conversation="none" data-theme="dark"><p lang="en" dir="ltr">9. Mock <a href="https://twitter.com/Monro93?ref_src=twsrc%5Etfw">@Monro93</a> <a href="https://twitter.com/hashtag/Inktober?src=hash&amp;ref_src=twsrc%5Etfw">#Inktober</a> <a href="https://twitter.com/hashtag/Inktober9?src=hash&amp;ref_src=twsrc%5Etfw">#Inktober9</a> <a href="https://twitter.com/hashtag/linkitober?src=hash&amp;ref_src=twsrc%5Etfw">#linkitober</a> <a href="https://t.co/u37LdRu7qJ">pic.twitter.com/u37LdRu7qJ</a></p>&mdash; Maybe (@Linkita) <a href="https://twitter.com/Linkita/status/1182395245767598083?ref_src=twsrc%5Etfw">October 10, 2019</a></blockquote> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>

## Mock

En este blog hablamos mucho de testing, así que los mocks aparecen habitualmente. En este caso, me gustaría hablar un poco de la palabra, no tanto del concepto, que ya hemos trabajado un montón de artículos, como [éste](https://franiglesias.github.io/test-doubles-1/) o [éste](https://franiglesias.github.io/testing-with-doubles-1/).

Me llama la atención que en una actividad como la nuestra y teniendo en cuenta la importancia que tienen aspectos como la forma en que nombramos los conceptos en el código, luego usamos mucha terminología de forma muy imprecisa y descuidada. Particularmente en testing, que es uno de los temas que me interesan más y quizá por eso le presto más atención.

Sin ir más lejos: los **Mocks**. Llamamos **Mock** a cualquier doble de test, cuando **mock** es un tipo específico. Ya sabéis: *dummies*, *stubs*, *spies*, *fakes* y *mocks*.

Pero los propios frameworks de testing contribuyen a ello, como **phpunit** con su `mockBuilder` o incluso el framework **Mockery**, pero también está **mockito** en Java. Supongo que *doubleBuilder*, *Doublery* o *Doublito* no suenan tan ingeniosos. 

En relación con esto, me preocupa que muchas veces a la hora de hacer tests la primera pregunta que suele aparecer tiene que ver con los **mocks**, lo que hay que `mockear` o doblar, cómo hacerlo, etc. Diría que antes incluso de saber qué es lo que se pretende testear. La primera pregunta debería ser: ¿qué comportamiento necesito verificar en este momento?

Por último, otra palabra que creo que está mal utilizada: test **funcionales** para referirse a tests de end to end o incluso de aceptación. Test funcionales son tests que verifican que una unidad o módulo de software hacen lo que se supone deben hacer, ya sea en el nivel unitario, de integración, end to end, de regresión, etc.

¡Programar es de letras!

