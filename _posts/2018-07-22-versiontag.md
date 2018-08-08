---
layout: post
title: Automatiza tags de version semántica con git
categories: articles
tags: tools
---

Acabo de desarrollar una pequeña herramienta puede ayudarte a automatizar la creación de tags de versión semántica con git.

Os presento **versiontag** una utilidad de línea de comandos para automatizar el versionado semántico en git.

[Puedes verla y descargarla en el repo de github](https://github.com/franiglesias/versiontag), donde encontrarás también toda la documentación necesaria y, por supuesto, la última versión.

**versiontag** busca la última tag de versión que tengas en el proyecto 

He estado trabajando a ratos en esta pequeña herramienta para automatizar el versionado semántico en repositorios de git. Reconozco que prácticamente ha sido un "stackoverflow driven development" porque aunque no es mi primer script complejo en bash, lo cierto es que es algo que trabajo esporádicamente y de una vez para otra se me olvidan las cosas.

En cualquier caso es un *pet project* divertido e incluso útil. Lo he escrito en ratos sueltos y estoy seguro de que tiene mucho margen de mejora (por supuesto, puedes hacer forks, pull request, etc, etc.)

Por lo demás, su uso no tiene mayor misterio. Cuando todo está listo para hacer la tag, no tienes más que invocar **versiontag** indicando qué nivel de versión quieres actualizar y ya está. Te mostrará la versión actual, la nueva y te pedirá confirmación para añadirla y para hacer el push al remoto.

He aquí un ejemplo del desarrollo del propio **versiontag**, en el que puedes ver todos los detalles:

```
➜  versiontag git:(master) ./versiontag patch 'Add License'
Current version : v1.0.1
New tag         : v1.0.2
Do you agree? ([y]es or [N]o): y

Executing git tag -a v1.0.2 -m Add License (patch version) ...


Tag v1.0.2 was created in local repository.

Push it:

    git push origin v1.0.2

Delete tag:

    git tag -d v1.0.2

Do you want to push this tag right now? ([y]es or [N]o): y

Executing git push origin v1.0.2 ...

Counting objects: 1, done.
Writing objects: 100% (1/1), 179 bytes | 179.00 KiB/s, done.
Total 1 (delta 0), reused 0 (delta 0)
To https://github.com/franiglesias/versiontag
 * [new tag]         v1.0.2 -> v1.0.2
```
