---
layout: post
title: Commits, tags y branches en git
categories: articles
tags: tools
---

Trabajar de forma individual hace que, a veces, descuides aspectos del flujo de trabajo que son cruciales en equipos. Uno de estos aspectos es la gestión de versiones y la ramificación de proyectos.

Hasta hace un tiempo llevaba la gestión de versiones con SVN, pero al empezar a desarrollar el proyecto [milhojas](https://github.com/franiglesias/milhojas), decidí hacerlo con Git, que al fin y al cabo se ha convertido prácticamente en el estándar.

La forma en que Git gestiona los proyectos es bastante diferente al modo en que trabaja SVN. Mientras que éste último se centra en los cambios, Git guarda "instantáneas" del repositorio en cada momento. Esto se traduce en una gestión más fácil de las versiones y de las ramificaciones, procesos que en SVN eran muy incómodos y confusos.

## Commits

Cada conjunto de cambios que envías es un Commit. Como tal, un commit es un pequeño hito que tendrá distinta significación en cada caso. A veces sólo será una corrección de "coding style", otras una característica completa, otras el añadido de un test o una corrección de un error.

Cada vez que envías un cambio al repositorio de Git se genera una instantánea del estado actual del repositorio. O si lo quieres expresar de otra forma, un commit genera una nueva versión. Sin embargo, esta nueva versión puede carecer de un significado particular o interesante para el proyecto de cara al cliente o usuario.

Los commits van, por defecto, al master del proyecto, que sería por así decir el camino o tronco principal de desarrollo.

## Etiquetado o tagging

En un momento dado, cuando has decidido que el proyecto ha alcanzado un hito significativo como podría ser la primera versión lista para publicación, el añadido de una característica o la eliminación de un error crítico, puedes etiquetarlo.

Una etiqueta o tag nos sirve para referenciar un punto concreto del desarrollo del proyecto. Es algo parecido a lo que sería el marcapáginas de un libro.

Lo interesante es que si sigues enviando commits después de haber puesto la etiqueta, el estado del proyecto en esa etiqueta no cambia. Así que puedes seguir desarrollando después de la etiqueta sin afectar a ésta.

Composer, hablando de PHP, utiliza las etiquetas para determinar cual es la versión de un paquete que debe instalar.

A lo largo del desarrollo tendremos un master con diversas tags que nos indican hitos o versiones específicas.

### Versiones semánticas

Al etiquetar es importante tener en cuenta el significado de las versiones. El "[Semantic versioning](http://semver.org)" o creación de versiones con significado establece un patrón para etiquetar las versiones, de manera que sea sencillo predecir qué va a pasar con cada actualización.

En versiones semánticas el número de versión tiene tres partes, representadas por números naturales:
<p style="text-align:center;">Major version . Minor version . Patch version</p>

**Major version**: implica cambios en el API que rompen la compatibilidad con versiones anteriores. En la práctica, indica que incorporar la nueva versión a un proyecto que usa tu software supone que hay que realizar cambios en ese proyecto.

**Minor version**: añades funcionalidades que no rompen la compatibilidad con versiones anteriores. Es decir, la nueva versión puede utilizarse o incorporarse a otro proyecto sin cambiar nada, aunque sí podría modificarse para utilizar las nuevas características.

**Patch version**: indica una corrección de errores. No altera el API ni añade funcionalidades.

## Ramificación o branching

La ramificación es un proceso diferente al etiquetado.

Puesto que tenemos un tronco básico puede ser bastante arriesgado o complicado intentar introducir algún elemento nuevo o experimentar una solución y después de un tiempo tener que deshacerlo ya que, mientras tanto, tal vez hayamos trabajado en otras partes del proyecto corrigiendo errores o haciendo ajustes.

Al intentar revertir los cambios de alguna modificación que nos haya resultado infructuosa estaríamos también revirtiendo otros cambios que desearíamos mantener.

Por eso, una buena forma de aislar conjuntos de modificaciones para que el tronco permanezca en un estado más manejable es crear ramas o branches.

Como indica su nombre, la ramificación es crear una rama en el desarrollo de tu proyecto. Los motivos para hacer esto son varios:

* Corregir un problema o refactorizar
* Hacer un experimento
* Dirigir un desarrollo hacia un nuevo enfoque

La razón por la que ramificar es para evitar cambios indeseados en el código base y evitar afectar al trabajo de otros mientras lo hacemos.

Al crear una rama, lo que hacemos es crear un nuevo camino de desarrollo paralelo al principal. En un equipo de desarrollo podría haber una persona encargada de corregir los fallos que van siendo notificados por los usuarios, mientras que otros miembros del equipo estarían más ocupados en desarrollar nuevas prestaciones.

Para cada solución de error o para cada nueva característica se podría crear una rama. Entonces se trabaja en cada rama y cuando el desarrollo para esa situación concreta esté terminado se hace una operación llamada Pull Request al master para fusionar (merge) los cambios. Git analiza el Pull Request (PR) y nos indica si la fusión se puede realizar sin problemas o va a haber conflictos que debamos solucionar primero.

De este modo, el master se mantiene limpio y en caso de que alguna de las ramas nos lleve a un camino indeseado simplemente se puede eliminar o revertir en su propio camino, sin afectar a otros objetivos.

La idea de los Pull Request es que haya un responsable de revisarlos y aceptarlos, para garantizar que las propuestas de cambios no generen problemas en otras partes. Puede ser difícil, según el proyecto, trabajar en ramas completamente aisladas. Por ejemplo, podría se que trabajases en una nueva característica pero, al mismo tiempo, hubiese alguien corrigiendo algún error en los mismos archivos, pero en otra rama o en el master.

 
