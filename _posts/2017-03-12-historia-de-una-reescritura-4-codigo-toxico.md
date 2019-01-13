---
layout: post
title: Historia de una reescritura (4) el código tóxico
categories: articles
tags: legacy
---

A medida que la primera fase del proyecto avanza voy observando cosas en las que habrá que trabajar más a fondo.

La serie **Historia de una reescritura** está compuesta de los siguientes artículos

[Historia de una reescritura (1):](/historia-de-una-reescritura-1)  
[Historia de una reescritura (2): El problema con MVC](/historia-de-una-reescritura-2-el-problema-con-mvc)  
[Historia de una reescritura (3): Empezar con la vista](/historia-de-una-reescritura-3-empezar-con-la-vista)  
[Historia de una reescritura (4): El código tóxico](/historia-de-una-reescritura-4-codigo-toxico)  
[Historia de una reescritura (5): Tests](/historia-de-una-reescritura-5-tests)  
[Historia de una reescritura (6): Autoload sin namespaces](/historia-de-una-reescritura-6-autoload-sin-namespaces)

Una de las señales prácticas de que la separación de responsabilidades está bien hecha en una aplicación es que cuando trabajas en modificar o corregir alguna característica concreta tocas uno o, como mucho, dos archivos, y si tocas más, normalmente estarán muy cercanos entre sí en el árbol de carpetas.

Por eso, mientras estoy migrando plantillas .ctp a twig me siento contento cuando no me muevo de la carpeta "views" que contiene todas mis plantillas remozadas. Sin embargo, cuando tengo que ir a ver qué pasa en otras partes me echo a temblar: seguramente me voy a encontrar con <strong>código tóxico</strong>.

He intentado encontrar algo sobre este concepto en Internet, y lo más parecido ha sido [este artículo de Erik Dörnenburg](https://erik.doernenburg.com/2008/11/how-toxic-is-your-code/) en el que propone un método para medirlo.

¿Qué entiendo por <strong>código tóxico</strong>? Pues yo lo definiría como código que escribes para solucionar un problema, pero que acaba provocando más problemas y, generalmente, de una forma difícil de detectar. No se trata únicamente de que sea código mal escrito (podría estar incluso bastante bien escrito), sino que:


* Genera dependencias innecesarias y las oculta.
* Establece acoplamiento entre capas del software que deberían estar separadas.
* Enmascara complejidad que puede llevar asociada problemas de rendimiento o ser fuente de errores en otros lugares del código.


Los Helpers, colaboradores de la vista, son la principal residencia de mi código tóxico. Entre otras razones, porque escribí muchos generadores de código HTML que o bien eran innecesarios o bien realizan tareas simples de una manera muy complicada. En bastantes casos, puedo reemplazar esos Helpers con includes o macros de Twig y, además, de una forma bastante más sencilla.

PHP nació como un lenguaje capaz de incorporar información dinámica en páginas HTML, pero hay un contrasentido esencial cuando creas un generador PHP para construir bloques complejos de HTML y eso genera toxicidad.


## Cuando la toxicidad está en el framework

Por lo general, el código tóxico asume responsabilidades que no le corresponden con la excusa de facilitarte el trabajo y eliminaste la complejidad.

En ese sentido, muchos frameworks para desarrollo rápido basados en el principio de "convención sobre configuración" (como era CakePHP en su momento) promueven, quizá sin quererlo, el código tóxico. Esto ocurre porque necesitan mucho código sólo para lidiar con temas como las inflexiones con las que pueden localizar y cargar <em>automágicamente</em> las clases o la validación de las convenciones. También ocultan las complejidades de la instanciación de ciertos objetos lo que acaba limitando tus posibilidades de inyectar correctamente nuevas dependencias. En último término, estos frameworks acoplan "todo con todo" aunque pueda parecer que no.

Lo que era aceptable hace diez años en PHP porque no teníamos un soporte completo de programación orientada a objetos, nos mete en un berenjenal cuando intentamos renovar esa base de código para lograr una arquitectura limpia. Así que al tratar de actualizar aplicaciones basadas en estas prácticas, ahora nos encontramos con bastantes problemas.

El código tóxico va más allá de los "Code smells". Sería como un <em>smell</em> masivo. Por ejemplo, al revisar mis antiguos controladores veo que hay muchos problemas de lógica de negocio/dominio que no debería estar ahí (mala segregación de responsabilidades). Pero, si bien esos son "code smells", no son necesariamente tóxicos. La solución consiste simplemente en refactorizar para llevarlo todo a su sitio y listo.

No, la toxicidad trabaja en contra de tu aplicación disfrazada de código bueno que te ayuda. Es como un iceberg, tú sólo ves la punta en forma de una clase con dos ó tres métodos que resuelven un problema, mientras que bajo la superficie hay una masa ingente de problemas. Parece una sana encapsulación, pero en realidad esconde decenas de líneas de espagueti, dependencias ocultas y complejidad inextricable.

A veces, acabar con el código tóxico no resulta muy difícil. Por ejemplo, en el proceso de reescritura que estoy llevando a cabo, el hecho de cambiar un sistema de plantillas por otro, hace que las dependencias insanas se identifiquen por sí solas y al reescribir las partes en las que intervienen se convierten en innecesarias y se pueden eliminar del proyecto tranquilamente.

Sin embargo, otras veces esas dependencias están mucho más enraizadas y son más difíciles de erradicar. Los ayudantes para formularios, por ejemplo, pueden ser un buen ejemplo. Por ejemplo, husmean en la capa del modelo para generar los tipos de campos adecuados o se introducen en el controlador para generar tokens de seguridad y otras cuestiones. Al final, para extraerlos tienes que trabajar en un montón de lugares y segregar sus responsabilidades en las diferentes capas.

Y, precisamente, los formularios y otros ayudantes complejos son los que me esperan en la próxima etapa de mi proyecto de reescritura.

Espero salir vivo.
