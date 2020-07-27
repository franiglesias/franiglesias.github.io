---
layout: post
title: Acelerar Docker en Mac
categories: articles
tags: tools
---

Docker es prácticamente el medio estándar con el que preparar entornos para desarrollo en todo tipo de proyectos, especialmente para garantizar el mismo *setup* en un equipo de desarrolladores y condiciones equivalentes a las de producción.

Por desgracia, fuera del ecosistema Linux presenta algunos problemas prácticos. En Mac OS X en particular es muy lento ya que los contenedores no tienen acceso directo al sistema de archivos del ordenador y debe sincronizarse. Cuando estás escribiendo código esa lentitud no se percibe demasiado, pero a la hora de ejecutar cosas se nota bastante, especialmente en el caso de las suites de tests.

Y, como bien sabemos, tener tests lentos es un gran problema pues desalienta a la gente de desarrollo pues tiene que esperar mucho tiempo para obtener feedback.

Así pues: ¿es posible acelerar Docker sobre Mac? La respuesta es que sí, pero con un poco de ayuda.

## Tuneando la configuración de Docker

En general no se consiguen grandes mejoras con la configuración de Docker, aunque no hace daño subirle la RAM dedicada (por ejemplo de 2 a 4 GB, que es como la tengo en mi equipo) e incluso el número de CPU (2 en mi caso).

No hemos probado a usar la versión Edge que ofrece un formato distinto de imagen (.raw) que [según algunos artículos podría ser más eficiente](https://medium.com/@TomKeur/how-get-better-disk-performance-in-docker-for-mac-2ba1244b5b70).

## Usando docker-sync

Una opción que sí ha demostrado mejorar, y mucho, la velocidad consiste en usar [docker-sync](https://docker-sync.readthedocs.io/en/latest/getting-started/installation.html). En concreto una suite con 650 tests que incluyen todo tipo de fixtures en base de datos, decenas de llamadas al API y otros recursos con bastante carga, pasó a ejecutarse en un 16%-18% del tiempo tras aplicar docker-sync (alrededor de 6 veces más rápido).

### Instalación

**Docker-sync** se instala como una gema de Ruby.

```bash
sudo gem install docker-sync
```

Es posible que tengas que instalar también **unison**:

```
brew install unison
brew install eugenmayer/dockersync/unox
```

### Configuración

Puedes empezar a usar `docker-sync` con una configuración bastante simple, aunque requiere algunos cambios en el docker-compose.yml de tu proyecto.

Por cierto, si usas docker en producción, tienes que asegurarte de separar el `docker-compose.yml` de producción y de desarrollo. Ten en cuenta también que con estos cambios en el `docker-compose.yml` no se podrá levantar el sistema de contenedores si no utilizas **docker-sync**. Puede ser buena idea guardar en el repositorio del proyecto una versión de `docker-compose.yml`, para usar Docker de forma estándar y otra para acelerarlo con docker-sync.

**docker-sync.yml**

En este archivo vamos a definir la sincronización. En este ejemplo sólo vamos a compartir la carpeta que contiene el código del proyecto. Esto se hace bajo la clave `syncs`:

```yaml
version: '2'
syncs:
  app-sync:
    src: '/srv/core'
```


* `app-sync` es el nombre con el que vamos a identificar la sincronización.
* `src` es para indicar la carpeta de nuestro ordenador que queremos sincronizar y que es en la que se encuentra el código. En nuestro caso `/srv/core`.

Cambios en **docker-compose.yml**

Ahora tenemos que decirle a docker cómo debe mapear el sistema de archivos del contenedor y el ordenador anfitrión.

Bajo la clave volumes añadimos la sincronización:

```yaml
volumes:
    # ...
    app-sync:
        external: true
```

De este modo, podremos definir el mapeo para el servicio que nos proporciona el intérprete de PHP. La línea que nos interesa es la 12, la última bajo la clave `volumes`. En ella se mapea la sincronización con la ruta del contenedor en la que queremos el código.

```yaml
services:
    core-fpm:
        build:
            context: /srv/core
            dockerfile: etc/docker/dev/fpm/Dockerfile
        container_name: core-fpm
        volumes:
            - ~/.ssh:/root/.ssh
            - ~/.aws:/root/.aws
            - ~/.ssh:/var/www/.ssh
            - ~/.aws:/var/www/.aws
            - app-sync:/var/www/core:nocopy
        working_dir: /var/www/core
        links:
            - core-pgsql
            - core-elasticsearch
            - core-redis
        environment:
            - PHP_IDE_CONFIG=serverName=Dev
            - XDEBUG_REMOTE_HOST=docker.for.mac.host.internal
            - SYMFONY_PHPUNIT_VERSION=8.4
        networks:
            - docker

```


### Funcionamiento

Para que **docker-sync** funcione tendrás que tener Docker arrancado. Como normalmente está corriendo, puede ser buena idea reiniciarlo y que los contenedores se levanten de cero.

Antes de levantar los contenedores con los que vayas a trabajar lanzamos **docker-sync**:

```bash
docker-sync start
```

Y esto debería ser lo único que tengas que hacer.

La primera vez, **docker-sync** preparará la sincronización por lo que puede tardar un rato en estar listo dependiendo de la cantidad de archivos que le toque sincronizar.

Una vez que aparezca el mensaje `success  Starting Docker-Sync in the background` ya estaría todo preparado para trabajar con normalidad.

Hay algunos detalles prácticos que hay que tener en cuenta para asegurarte de que los cambios que hagas en el código estarán sincronizados en el contenedor, en particular si utilizas PhpStorm. Este IDE tiene algunas peculiaridades a la hora de guardar archivos que pueden hacer que el contenedor no se sincronice exactamente cuando esperas, veamos cuáles son:

* PhpStorm tiene un modo de "escritura segura" que se basa en escribir los cambio de un archivo a un fichero temporal antes de guardarlos en el archivo que estás editando, lo que puede causar un pequeño retraso.
* Dependiendo de cómo lo tengas configurado, el guardado automático del archivo se producirá sólo cuando ocurran ciertos eventos, básicamente activar o desactivar la pestaña del editor. Es decir, si haces un cambio en un archivo y no haces nada más, el cambio no se guardará en el disco y, en consecuencia, no se sincronizará el contenedor.
* Opcionalmente podrías tener configurado el editor para guardar automáticamente los cambios después de un intervalo de tiempo.

El resultado es si ejecutas algo en ese momento es muy posible que no se haya sincronizado el contenedor y estés ejecutando código desactualizado. Así que lo más seguro es pulsar la combinación `cmd` + `S` para forzar el guardado del archivo y disparar la sincronización.

Estos ajustes se pueden cambiar en las preferencias Appearance & Behavior > System Settings > Synchronization.

### Obtener la máxima velocidad

En ciertos escenarios es posible conseguir una velocidad prácticamente nativa y es **apagando el daemon** de `docker-sync`.

Obviamente esto hará que los cambios de código no se reflejen en la sincronización, pero puede ser útil si, por ejemplo, quieres analizar code-coverage o, simplemente, ejecutar la suite de tests completa tras asegurarte de que el código está sincronizado.

Basta con:

```bash
docker-sync stop
```

Un ejemplo puede ser que hayas estado tocando una parte del código y ejecutando sólo una parte de los tests. Una vez que has terminado y quieres comprobar que no ha habido consecuencias en otros tests o efectos inesperados, podrías parar el `docker-sync` y ejecutar toda la suite.

Las ganancias de velocidad que he observado es que los tests llegan a ejecutarse hasta el doble de rápido.

### Integración con PhpStorm

Si tienes configuraciones para la ejecución de suites de tests en PhpStorm puedes adaptarlas fácilmente para asegurarte de que docker-sync se encuentra en el estado deseado. Por ejemplo querrías asegurarte de que estará sincronizando o justo lo contrario, que no sincronice para obtener la máxima velocidad.

Una forma de hacerlo es esta:

En el diálogo de PhpStorm de Run/Debug Configurations abrimos la pestaña **Before launch: External Tool** si no lo está ya.

Hacemos clic en el botón `+` para añadir una nueva configuración del menú desplegable. Escogeremos **Run External Tool**.

Se abrirá un diálogo en el que volveremos a pulsar el botón `+` a fin de añadir una nueva entrada. En el diálogo cubriremos los siguientes campos:

* Name: Docker Sync ON
* Bajo Tool Settings:
  * Program: docker-sync
  * Arguments: start
  * Working directory: $ProjectFileDir$

Este último parámetro pude introducirse mediante el botón **Insert Macro...** y seleccionándolo en la lista.

Nos aseguramos de que las demás casillas están desmarcadas para que no se abra la consola cuando se ejecuta.

Pulsamos **OK** para guardar los cambios y **OK** de nuevo para confirmar que queremos lanzar la herramienta antes de ejecutar los tests de esa configuración.

Hay un problema y es que si docker-sync ya está corriendo esta tarea fallará por lo que debemos pararlo antes. De esta forma simulamos un reinicio.

Haremos lo mismo para crear una External Tool que pare el daemon:

Hacemos clic en el botón `+` para añadir una nueva configuración del menú desplegable. Escogeremos **Run External Tool**.

Se abrirá un diálogo en el que volveremos a pulsar el botón `+` a fin de añadir una nueva entrada. En el diálogo cubriremos los siguientes campos:

* Name: Docker Sync OFF
* Bajo Tool Settings:
  * Program: docker-sync
  * Arguments: stop
  * Working directory: $ProjectFileDir$

Igual que antes, nos aseguramos de que las demás casillas están desmarcadas para que no se abra la consola cuando se ejecuta.

Pulsamos **OK** para guardar los cambios y, otra vez, **OK** para confirmar la tarea.

Finalmente usamos las flechas para ordenar las tareas y que se ejecuten en orden. Nos debería quedar algo así:

```
Before launch: External tool (2)
External tool 'External Tools/Docker Sync OFF'
External tool 'External Tools/Docker Sync ON'
```

Por cierto, una vez que defines una External Tool la puedes reutilizar en todas las configuraciones que necesites.

Un buena idea puede ser definir varias configuraciones para ejecutar los tests. Por ejemplo, una DEV que tenga docker-sync activado (como la del ejemplo anterior) y otra TEST que lo desactive para correr más rápidamente, que sólo tendría la versión OFF:

```
Before launch: External tool (2)
External tool 'External Tools/Docker Sync OFF'
```

### Posibles problemas y mejoras

**Sincronizaciones desactualizadas.** En algunos casos nos podemos encontrar con que las sincronizaciones no están actualizadas, reflejando un estado del código que no es el real. En ese caso, podemos limpiarlas:

```bash
docker-sync clean
```

Tras lo cual tendremos que arrancar el daemon de nuevo y esperar que se lleve a cabo la sincronización inicial:

```bash
docker-sync start
```

**Optimización.**  En principio es posible indicar directorios que no queremos sincronizar para optimizar al máximo el tiempo dedicado a la sincronización usando la clave `sync_excludes:`, lo que te permite eliminar directorios de cache, etc.
