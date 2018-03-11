---
layout: post
title: TDD no es sólo testear antes de escribir código
categories: articles
tags: [tdd, baby-steps]
---

Ya han pasado más de siete meses desde que llegué a Barcelona, acabo de cumplir mis dos primeras semanas en una [nueva empresa](https://www.holaluz.com) y estoy muy contento en [mi nuevo equipo](https://twitter.com/holaluzeng?lang=es), con quienes ya he empezado a aprender un montón de cosas y, de paso, desoxidarme un poco.

Precisamente en los pocos días que llevo trabajando aquí han empezado a surgir cosas interesantes con el código y me gustaría contar algunas. Hoy le toca el turno a un problema interesante de TDD que no sé muy bien cómo explicar.

## Un problema sencillo, pero con *intríngulis*

El problema concreto era desarrollar un pequeño servicio capaz de clasificar documentos. Recibe el path de un archivo y unos metadatos y, a partir de esa información, decide dónde debe guardarse el documento, devolviendo una nueva ruta al lugar de donde se almacenará de forma definitiva.

La verdad es que parece más difícil de lo que es. Como veremos, el servicio simplemente entrega un string compuesto a partir de elementos extraídos de la información aportada. Inmediatamente nos damos cuenta de que simplemente hay que obtener los fragmentos necesarios, concatenarlos y devolver el resultado.

Voy a intentar ilustrar esto con un ejemplo similar pero de otro ámbito.

Supongamos un centro de enseñanza en el que queremos desarrollar una aplicación que permita al alumnado enviar documentos subiéndolos en una web preparada al efecto. La cuestión es que esos documentos se guarden automáticamente en un sistema de archivos con una estructura determinada. Aunque este sistema podría servir para muchas tareas, voy "simplificar":

- Los documentos relacionados con trabajos escolares se guardan en una ubicación específica por curso escolar, etapa, nivel educativo, tutoría, asignatura y alumno.
- Además, el nombre de archivo se cambiará para refleje un identificador de la tarea y una marca de tiempo.

Es decir, que si alumno con número de matrícula 5433, matrículado en 5º C de Primaria sube el próximo lunes (12-03-2018) el archivo deberes-de-mates.pdf, éste deberá situarse en la ruta:

2017-2018/primaria/5/5C/matematicas/5433/2018-03-12-deberes.pdf

Aunque no forma parte de la tarea concreta que vamos a realizar, se supone que la información necesaria se obtiene a través del formulario de la web, de la identificación del usuario conectado, de datos almacenados en el repositorio de alumnos, y otros se obtienen en el momento.

Así, por ejemplo, el número de matrícula (que sería el ID del alumno) se obtiene de su login. Este dato nos permite obtener la entidad Student del repositorio correspondiente, a la que podemos interrogar sobre su curso, tutoría y etapa.

Por supuesto, la fecha se obtiene del sistema y, con ella, se puede elaborar el fragmento de curso escolar.

La solución es bastante obvia, pero no adelantemos acontecimientos...

## Un problema de TDD

La pregunta es: ¿cómo resolvemos este desarrollo utilizando TDD y que los tests sean útiles?

Me explico.

La [interfaz](https://dirae.es/palabras/interficie) de este tipo de servicios contiene un único método que devuelve el string que necesitamos. 

En una metodología de **tests a posteriori** podríamos simplemente testear el *happy path* y *santas pascuas*, además de algunas situaciones problemáticas como que no se encuentre el estudiante con ese ID o similares.

Incluso con una metodología **test antes que el código** podríamos plantear lo mismo (y pensar que estamos haciendo TDD).

Pero veámoslo en forma de código:



En un [artículo anterior](https://franiglesias.github.io/luhn-kata-python/) hice una versión de la Luhn Code Kata, que me vino muy bien precisamente para abordar un 