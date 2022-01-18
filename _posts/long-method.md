---
layout: post
title: Métodos largos: cohesión, abstracción y mantenibilidad
categories: articles
tags: design-principles refactoring
---

No hace mucho dejé caer en twitter que tener métodos de más de 10 líneas me parecía un smell. Por supuesto se levantó cierta polémica y hubo algunas respuestas a favor y en contra.

En este artículo intentaré explicar mi postura con detalle. Por supuesto, esto no es una prescripción. La longitud de diez líneas es un límite arbitrario que remite a la idea de que los métodos o funciones largas pueden ser problemáticos para la comprensión del código y su mantenimiento. Distintas personas sitúan este límite en una cifra diferente, que parece oscilar entre las 5 y las 200 líneas. Este gran abanico da una idea de lo controvertida que puede ser cualquier opinión al respecto.

## ¿Que número de líneas por método se recomienda?

Así, por ejemplo, el libro [Five lines of code](https://www.manning.com/books/five-lines-of-code) Christian Clausen propone criterio de cinco líneas como máximo. [En este artículo, Jim Bird](https://dzone.com/articles/rule-30-–-when-method-class-or) sugiere una "regla de 30", tras comentar propuestas de varios autores como Steve McConnell, autor de [Code Complete]( https://www.amazon.es/dp/0735619670/ref=cm_sw_em_r_mt_dp_503FNJAJM3WXFA5N1BEH), que, a su vez, cita estudios que ponen los límites entre 65 y 200 líneas.

Una regla práctica que se suele citar es de la cantidad de código que cabe en una pantalla. Sin embargo, hoy por hoy esto es bastante relativo gracias a las posibilidades de personalización de los editores o incluso de los monitores disponibles. Puedes hacer caber en una pantalla casi cualquier cantidad de código y que sea legible. En ese sentido, yo trabajo habitualmente con cuerpos de letra grandes (18 puntos) en monitores HD (1080 pixels en vertical), así que un punto para los métodos pequeños.

En resumen: no existe una opinión generalizada.

## ¿De qué hablamos en realidad?

La cuestión en juego no es ciertamente el número de líneas que contiene un método o función. Parafraseando a Gandalf: "un método no es ni largo ni corto, tiene exactamente el tamaño que necesita". La cantidad de líneas de código en sí misma, es una medida que no dice absolutamente nada. Como ocurre con cualquier otra métrica, necesita un contexto y un significado. Y este contexto al que me refiero es cuán fácil es comprender y mantener un método o función.

Lo cierto es que el número de líneas de código podría ser un buen predictor de la necesidad de partir un método largo mediante el uso del refactor _extract method_, como señala este estudio, [junto con ciertas métricas de cohesión](http://www.cs.rug.nl/~paris/papers/PROMISE15.pdf).

El motivo es que a medida que aumentan las líneas de código disminuye su cohesión. Además, es más probable que se estén mezclando niveles de abstracción. Pero, ¿qué queremos decir con esto?

### Cohesión

Empecemos por la cohesión. Una forma de entender la cohesión es el grado en que cada elemento que forma parte de una unidad, contribuye a su propósito. Podemos aplicarlo a los componentes de un módulo, pero también en las líneas que componen un método o función. De este modo, las funciones serán tanto más cohesivas cuando todas sus líneas contribuyen a su propósito y no es posible eliminar ninguna.

Se han propuesto [muchas medidas de cohesión](https://www.aivosto.com/project/help/pm-oo-cohesion.html) que con frecuencia se basan en la medida en que variables y otros elementos son compartidos o no por un grupo de líneas. Se puede extraer de aquí que cuantas más líneas tenga una función, más probable es que no incluyan las mismas variables o llamadas. Básicamente, cuanto mayor es la longitud de un código, más probable es que se esté ocupando de cosas distintas. Si bien, todas las líneas estarían contribuyendo al propósito de la función, es frecuente que ciertos grupos estén atendiendo a distintas partes de ese propósito.

Todas las líneas contribuyen, pero muchas veces es posible agruparlas entre sí basándose en que su cohesión mutua.

### Niveles de abstracción

Esto nos lleva al problema de los llamados niveles de abstracción. Una forma de enfocarlo es precisamente a partir de la cohesión. Si podemos identificar grupos de líneas de código que son cohesivas entre sí, podríamos aislar la parte del propósito de la función a la que contribuyen. Esta parte puede ser un concepto, una parte del proceso, etc., que se podría aislar componiendo una unidad de significado de orden superior. Esta unidad sería una abstracción.

Cualquier función se escribe utilizando un lenguaje de programación. En sí misma, una función es una abstracción de un concepto que se expresa mediante el nombre de la función y se compone de líneas de código del lenguaje en cuestión. Las funciones nos permiten reutilizar el mismo bloque de código en diferentes partes del programa. Además, proporcionan un significado a ese bloque de código: nos dicen qué hace, qué significa en el contexto del programa. Al fin y al cabo, el número de símbolos que ofrece el lenguaje de programación es limitado. Es posible construir cualquier mensaje, pero este mensaje tiene distintos niveles de codificación.

Podemos tomar como ejemplo el lenguaje humano escrito. Las palabras se componen de letras. Por sí mismas, las letras no tienen un significado. Unidas, forman palabras, las cuales sí tienen significado. Pero las palabras por sí solas no transmiten mensajes completos. Se combinan en forma de frases u oraciones, que sí tienen significado completo. Por otro lado, se pueden componer mensajes complejos combinando un número indefinido de oraciones. Este artículo contiene letras, palabras y oraciones. El artículo mismo tiene un título que nos permite entender de qué trata y, por tanto, es una unidad de significado. De muy alto nivel, eso sí. Para entenderlo en su totalidad tenemos que leer las oraciones, que hilan un determinado discurso. De hecho, el artículo se divide en párrafos que son grupos de oraciones que contribuyen a explicar una idea.

Estos son los distintos niveles de significado del texto. Es necesario procesar todos, pero en la práctica trabajamos con las unidades de mayor nivel. No necesitamos ir letra por letra, de hecho no necesitamos proceder palabra por palabra. Como lectoras expertas leemos las frases, es decir, trabajamos con unidades de un cierto nivel de abstracción que aporta un significado completo.

## Cohesión y extracción de métodos








