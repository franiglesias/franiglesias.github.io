---
layout: post
title: Métodos largos: cohesión, abstracción y mantenibilidad
categories: articles
tags: design-principles refactoring
---

No hace mucho dejé caer en twitter que tener métodos de más de 10 líneas me parecía un smell. Por supuesto se levantó cierta polémica y hubo algunas respuestas a favor y en contra.

En este artículo intentaré explicar mi postura con detalle. Por supuesto, esto no es una prescripción. La longitud de diez líneas es un límite arbitrario que remite a la idea de que los métodos o funciones largas pueden ser problemáticos para la comprensión del código y su mantenimiento. Distintas personas sitúan este límite en una cifra diferente, que parece oscilar entre las 5 y las 200 líneas. Este gran abanico da una idea de lo controvertida que puede ser cualquier opinión al respecto.

Así, por ejemplo, el libro [Five lines of code](https://www.manning.com/books/five-lines-of-code) Christian Clausen propone criterio de cinco líneas como máximo. [En este artículo de Jim Bird](https://dzone.com/articles/rule-30-–-when-method-class-or) sugiere una "regla de 30", tras comentar propuestas de varios autores como Steve McConnell, autor de [Code Complete]( https://www.amazon.es/dp/0735619670/ref=cm_sw_em_r_mt_dp_503FNJAJM3WXFA5N1BEH), que, a su vez, cita estudios que ponen los límites entre 65 y 200 líneas.

Una regla práctica que se suele citar es de la cantidad de código que cabe en una pantalla. Sin embargo, hoy por hoy esto es bastante relativo gracias a las posibilidades de personalización de los editores o incluso de los monitores disponibles. Puedes hacer caber en una pantalla casi cualquier cantidad de código y que sea legible. En ese sentido, yo trabajo habitualmente con cuerpos de letra grandes (18 puntos) en monitores HD (1080 pixels en vertical), así que un punto para los métodos pequeños.



