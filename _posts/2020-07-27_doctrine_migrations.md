---
layout: post
title: Añadir una migración Doctrine en un proyecto
categories: articles
tags: php bbdd tools
---

Cuando llega el momento de aplicar cambios a la base de datos siempre me preocupo un poco. Como nuestro ORM y acceso a la base de datos es mediante Doctrine en Symfony utilizamos las migraciones de Doctrine para cualquier actualización del esquema.

Es una operación que tiene ciertos riesgos y después de un tiempo de práctica encuentro que seguir un pequeño protocolo ayuda a reducirlo. Este protocolo es más o menos el que sigue:

## Primer paso: Comprobar si tenemos migraciones pendientes de ejecutar

Durante el desarrollo es posible que no hayas actualizado el entorno local de base de datos en un cierto tiempo porque no lo has necesitado. En un proyecto en el que se hacen merges continuos a master es fácil perder la pista de cuándo ha habido una migración, así que el primer paso es revisar el estado actual:

```bash
bin/console doctrine:migrations:status
```

Si el resultado es que hay migraciones sin aplicar, lo suyo es lanzarlas:

```bash
bin/console doctrine:migrations:migrate
```

Si aparecen fallos es el momento de revisar. Es posible que tu entorno local tenga datos incoherentes que hagan fallar las migraciones. Antes de desesperarse mucho, revisa eso.

## Segundo paso: Generar el diff

Una vez que tenemos todas las migraciones aplicadas podemos tener la seguridad de que cualquier cosa que salga en el diff será producto de la situación actual de la base de datos local. 

Por tanto, una vez que estemos conformes con la actualización de la configuración del ORM, podremos ejecutar el diff.

```bash
bin/console doctrine:migrations:diff
```

Una vez hecho, revisamos el archivo resultante y eliminamos cualquier cosa que no tenga que ver con nuestra modificación en particular. 

Esto es importante para no introducir regresiones. En teoría no tendríamos que tener nada extraño, pero no es raro que hayamos olvidado deshacer alguna migración de otra rama que aún no está en master o cualquier experimento manual que hayamos hecho en la bd local.

## Tercer paso: Checks

Estos checks consisten en hacer un `migrate` y un `down` de la migración. La idea es asegurarnos en lo posible que no tienen efectos indeseados:

```bash
bin/console doctrine:migrations:migrate
```

Como resultado tendremos un mensaje parecido a este:

```
Migrating up to NUEVA_VERSION from VERSION_ANTERIOR
```

Copia el último número que te servirá para forzar el `down`:

```bash
bin/console doctrine:migrations:migrate VERSION_ANTERIOR
```

Si todo va bien, habrás verificado que las migraciones son aplicables.

Sin embargo, hay un punto que también deberías comprobar y es asegurarte de que puedes ejecutar la migración en un entorno de producción. Particularmente si cambias cosas como que un campo sea *nullable* o no y antes era al contrario, ya que al cambiar el esquema los datos existentes podrían no ser coherentes.

Para eso, es necesario tener una muestra de datos similares a las que tienes en producción ya que podrías encontrarte con que en tu entorno local tengas casos "perfectos" y la migración no fallaría.

Es posible que necesites, o bien corregir los datos existentes previamente, por ejemplo reemplazando `null` por el nuevo valor por defecto, o manteniendo las condiciones menos restrictivas para poder hacer el arreglo a posteriori. O quizá protegiendo estar restricciones por código.

## Finalizar: down

Para evitar problemas futuros es buena idea hacer un `down` de la migración una vez que has terminado la tarea y tienes el _pull request_ listo para desplegar. 
 
Es muy posible que mientras no se revisa, se mezclan los cambios a master y se sube a producción te metas ya en la siguiente historia y realmente sería mejor que el estado del esquema de la base de datos sea el mismo de master. No sería la primera vez que una historia adelanta a otra en el despliegue y es mejor tener una idea correcta del estado del sistema.

## Entorno de test

En el entorno de test local es preferible no usar migraciones y reconstruir el esquema.

```bash
bin/console doctrine:schema:drop --env=test --force
bin/console doctrine:schema:update --env=test --force
```

De este modo, se levanta un esquema de base de datos limpio cada vez.
