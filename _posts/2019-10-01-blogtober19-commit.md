---
layout: post
title: Commit (Blogtober 2019)
categories: articles
tags: blogtober19
---

Mi compañera y manager en Holaluz [Mavi Jiménez](https://twitter.com/Linkita) va a hacer un dibujo cada día del mes sobre una palabra propuesta en twitter. Y aquí vamos a intentar escribir [un post por cada una de ellas](https://franiglesias.github.io/blogtober19-status/).

## Commit

<blockquote class="twitter-tweet" data-conversation="none" data-theme="dark"><p lang="en" dir="ltr">1. Commit <a href="https://twitter.com/viscat88?ref_src=twsrc%5Etfw">@viscat88</a> <a href="https://t.co/up6Jcx49tm">pic.twitter.com/up6Jcx49tm</a></p>&mdash; Maybe (@Linkita) <a href="https://twitter.com/Linkita/status/1179122564846821377?ref_src=twsrc%5Etfw">October 1, 2019</a></blockquote> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>

Un **commit** es ese conjunto de cambios de código que agrupamos en una unidad. Los commits marcan, o deberían marcar, hitos en el camino de un desarrollo. Digo deberían, porque… ¡cuántas veces habré hecho commits con un surtido de cambios inconexos, pero que necesitaba aplicar!.

Hay una de esas reglas no escritas que dice que un commit debería referirse a un concepto o a una característica de tu software, de tal manera que añadiendo o quitando ese commit puedas activarla o desactivarla. Se le suele llamar "commit atómico"

Siempre me propongo respetarla, pero raramente lo consigo.

Para mí, el arte del commit, tiene que ver con trabajar de manera ordenada en un aspecto concreto del software que estás desarrollando. A veces ese aspecto está muy acotado y sólo tocas unos pocos archivos estrechamente relacionados. En esos casos puedes percibir la cohesión entre ellos y el concepto de commit "atómico" cobra todo el sentido.

### Arreglando el último commit

A veces, una vez has hecho el commit te das cuenta de que te falta por añadir algunas cosas que tienen sentido en ese commit recién "commiteado". En esos casos viene bien `ammend`.

```bash
git add .
git commit --amend
```

O mejor, si el mensaje del commit estaba realmente bien escrito:

```bash
git add .
git commit --amend --no-edit
```

O si sólo quieres cambiar el mensaje:

```bash
git add .
git commit --amend -m "Nuevo mensaje"
```

### Arreglando más commits

El problema viene cuando pasan otros dos o tres commits, o más, y te das cuenta de que tienes uno o varios problemas:

* Un cambio en el que estás trabajando debería estar en un commit anterior que, por supuesto, no es el último.
* Has hecho varios commits que podrían agruparse en uno sólo. De hecho, podría ser que todos tus commits pudiesen empaquetarse en un único commit para ese pull request.

Para eso está `rebase` interactivo, la herramienta que te permite manipular tus commits a placer.

```bash
git rebase -i referencia
```

Siendo `referencia` el *hash* o identificador del commit a partir del cual quieres arreglar las cosas, o también referencias como `HEAD~n`, siendo `n` el número de commits que te interesa modificar. El hash del commit puedes obtener fácilmente haciendo un `git log --oneline`, por ejemplo.

```bash
git rebase -i HEAD~4
```

La herramienta te abrirá un editor de texto con la lista de commits afectados junto con instrucciones.

No voy a hacer un tutorial de rebase aquí, pero basta saber que puedes hacer estas cosas:

* Cambiar el orden en que se aplicarán los commits, de este modo podrás reunir commits relacionados y así aplicarles alguno de los siguientes comandos.
* **pick/drop** para usar o desechar, respectivamente, un commit concreto.
* **squash** mezcla un commit con el anterior y te permite editar el nombre del commit resultante
* **fixup** Lo mismo, pero sin cambiar el nombre, ideal para esas correcciones que has ido introduciendo a posteriori de un commit
* **edit** para hacer modificaciones de archivos en el commit.

### Así que...

No soy un super experto en `git`, de esos que pueden recombinar y trenzar commits de todas las formas imaginables, así que intentaré mantener algunas buenas prácticas en mis commits a partir de ahora:

Por un lado, tratar de mantener el foco en cada grupo de cambios, de manera que si necesito tocar algo que no encaja bien con ese grupo inicial, procurar no incluirlo en ese commit. En vez de eso, añadirlo en otro commit.

Hacer commits pequeños muy compactos mientras desarrollas puede ser una buena idea teniendo en cuenta usar el *rebase interactivo* antes de hacer `push` para ordenar la historia de tu desarrollo y dejar las cosas más claras.

En muchos casos, posiblemente sea buena idea unir en uno sólo todos los commits de un *pull request* antes de mezclarlo. De este modo, la historia del proyecto será mucho más clara y con menos información irrelevante.


[Las herramientas de Git: reescribiendo la historia](https://git-scm.com/book/es/v1/Las-herramientas-de-Git-Reescribiendo-la-historia)

