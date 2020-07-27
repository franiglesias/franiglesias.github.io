---
layout: post
title: Desarrollo de una aplicación PHP/Symfony
categories: articles
tags: php good-practices ddd
---

Voy a intentar resumir en varios artículos cómo preparar e iniciar el desarrollo de una aplicación PHP con Symfony desde cero.

## El proyecto

El proyecto será un backend para una aplicación de gestión de tableros Kanban. He pensado en este proyecto porque es un dominio bastante genérico y conocido, por lo que los conceptos serán familiares para todas. Para simplificar, el tablero estará orientado a historias de usuario que se pueden dividir en subtareas.

La verdad es que podríamos complicar enormemente el proyecto, añadiendo un backlog y herramientas de todo tipo para crear una alternativa a Jira o Redmine. Pero vamos a hacerlo de una manera más modesta. Al fin y al cabo, los principios de arquitectura serían aplicables a un proyecto mucho más complejo. Con todo, en aquellos puntos en los que tenga sentido trataré de introducir aquellas ideas o indicaciones orientadas a resolver ese tipo de problemas.

Esencialmente queremos que en nuestra aplicación se pueda:

* Crear un Project y añadirle un Board
* Definir las Columns o Statuses de un Board
* Añadir User Stories a un Board
* Añadir Tasks a una User Story
* Cambiar el Status de una Task
* Cambiar el Status de una User Story en función de los Status de sus Tasks
* Obtener el Status de un Board

Ya entraremos en detalles en su momento. En este primer artículo nos vamos a centrar en la preparación de un entorno de desarrollo funcional. Seguramente es un entorno mejorable, ya que no estará optimizado para necesidades concretas, pero creo que es suficiente para empezar a trabajar con ciertas garantías.

Pondré el proyecto como template en github.

## Preparando el entorno de desarrollo

Actualmente, no concibo un proyecto PHP que no sea virtualizado. Esto es una cuestión de portabilidad y de unificación de entornos de desarrollo en un equipo. Puesto que la plataforma de virtualización más popular ahora mismo es docker, prepararé un entorno con los contenedores suficientes para levantar y ejecutar el proyecto. En otros lenguajes diría que esto es más fácil de gestionar sin necesidad de herramientas especiales de virtualización, pero hoy día en PHP es casi obligado.

En cuanto a Symfony, lo importante de este artículo es ver cómo vamos a desacoplarnos en lo posible del framework. Con todas sus virtudes, no en vano es el framework de referencia en PHP, no deja de ser una librería de terceras partes y no está bajo nuestro control. La idea de desacoplarse de un framework no es porque vayamos a cambiarlo algún día, sino por la necesidad de no forjar dependencias en ideas y conceptos sobre los que no tenemos control. El lugar de Symfony en nuestra aplicación es la infraestructura, así que intentaremos llevar lo máximo posible del framework a esta capa. Algunas indicaciones pueden [encontrarse en la documentación](https://symfony.com/doc/current/configuration/override_dir_structure.html#override-the-public-directory).

Esta preparación será necesaria para poder empezar a trabajar a partir de tests. Escogeremos nuestra primera historia y la primera iteración se definirá mediante un test contra el primer endpoint que sea necesario, lo que nos obligará a crear todos los elementos necesarios.

### Virtualización básica con Docker

Personalmente, utilizo [phpdocker](https//phpdocker.io) generador de proyectos docker para mis desarrollos y experimentos PHP. La verdad es que mi experiencia con esta herramienta es muy positiva puesto que ten permite elegir lo que quieres instalar y en un par de minutos estás lista para empezar a trabajar sin apenas fricción. Para este proyecto, utilizaré Postgres para la base datos (aunque tardaremos en usarla) y Redis, por si en algún momento decido que necesito un sistema de cache. Con todo, son decisiones que podríamos posponer ya que sería fácil integrar nuevos contenedores de servicios en nuestro docker. Por defecto, phpdocker nos incluye Nginx como servidor web, aunque Symfony también nos proporciona su versión de servidor PHP para desarrollo.

Lo que sí incluyo siempre, son las extensiones BCMath y Xdebug. La primera me suele interesar para tratar floats con más seguridad y la segunda por razones obvias.

Más referencias por si quieres controlar mejor tu entorno dockerizado:

* https://medium.com/@ger86/como-integrar-docker-en-un-proyecto-basado-en-symfony-846a4ee0f329
* https://dev.to/martinpham/symfony-5-development-with-docker-4hj8
* https://knplabs.com/en/blog/how-to-dockerise-a-symfony-4-project

#### Opcional: instalar symfony cli

En el DockerFile de php-fpm añadimos esta línea para instalar la symfony cli, por si nos viene bien para las cositas de symfony:

```
# Install symfony cli
RUN curl -sS https://get.symfony.com/cli/installer | bash
```

Ahora levantamos los contenedores:

```
docker-compose up
```

Y verificamos que todo ha ido bien:

```
docker exec -it kanban-php-fpm mv /root/.symfony/bin/symfony /usr/local/bin/symfony
docker exec -it kanban-php-fpm symfony check:requirements
```

Alternativamente podemos entrar al contenedor con `docker exec -it kanban-php-fpm bash` y ejecutar ahí los comandos necesarios:

```
mv /root/.symfony/bin/symfony /usr/local/bin/symfony
symfony check:requirements
```


#### Crear el esqueleto de la aplicación

Para crear el esqueleto de la aplicación tenemos que hacer un pequeño truco. Tanto composer como symfony necesitan crear un nuevo directorio que estará vacío. Sin embargo, nosotras queremos crear la aplicación en un directorio que ya contiene los archivos necesarios para docker. Podemos hacer un truco sencillo:

Si no estamos dentro ya, abrimos `bash` en el contenedor:

```
docker exec -it kanban-php-fpm bash
```

Esto nos situará en el directorio `/application` del contenedor. Si hacemos un `ls -l` veremos el `docker-compose.yml` y la carpeta de `phpdockerio`.

Ejecutamos este comando:

```
composer create-project symfony/skeleton temp
```

temp será un directorio temporal para instalar nuestro esqueleto, ahora lo moveremos todo al directorio raíz del proyecto:

```
mv temp/* .
```

Y borramos el directorio temporal temp

```
rm -rf temp
```

Finalmente, volvemos a lanzar `composer install` a fin de comprobar que todo hay ido bien y regenerar algunas cosas que podrían tener dependencias en el sistema de archivos, como pueden ser las caches o el autoloader.

```
composer install
```

#### Ajustes del servidor web

Por defecto, phpdocker.io configura el servidor web para escuchar en el puerto 8080. El propósito de esto es evitar un conflicto con otro hipotético servidor http que ya esté escuchando en ese puerto. En nuestro caso podemos cambiarlo ya que no tenemos otro servidor en la máquina de desarrollo. Obviamente, si tenemos otros servidores lo suyo sería ponerlos a escuchar en distintos puertos a partir del 8080: 8080, 8081, etc.

De paso, añadiremos un par mejoras útiles. Los logs del servidor web están en el contenedor, pero podemos mapearlos a una carpeta del host (nuestra máquina local física) de modo que los tengamos fácilmente accesibles. Particularmente, soy muy partidario de mapearlos en la carpeta `var/log` de symfony.

En **docker-compose.yml**

```
    webserver:
      image: nginx:alpine
      container_name: kanban-webserver
      working_dir: /application
      volumes:
          - .:/application
          - ./phpdocker/nginx/nginx.conf:/etc/nginx/conf.d/default.conf
          - ./var/log/nginx:/var/log/nginx
      ports:
       - "80:80"
```

Y en **phpdocker/nginx/nginx.conf**

```
server {
    listen 80 default;

    client_max_body_size 508M;

    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;

    root /application/public;
    index index.php;

    if (!-e $request_filename) {
        rewrite ^.*$ /index.php last;
    }

    location ~ \.php$ {
        fastcgi_pass php-fpm:9000;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        fastcgi_param PHP_VALUE "error_log=/var/log/nginx/application_php_errors.log";
        fastcgi_buffers 16 16k;
        fastcgi_buffer_size 32k;
        include fastcgi_params;
    }
    
}
```

Para aplicar los cambios tendremos que reiniciar los contenedores.

```
docker-compose down
docker-compose up
```

Ahora, si vas a `http://localhost`, deberías ver la pantalla de bienvenida de Symfony. Y si curioseas en la carpeta `var/log` del proyecto podrás ver que se ha creado una subcarpeta para los logs de nginx.

#### Ajustes de PHP

Antes de empezar a trabajar tenemos algunos ajustes más que hacer. Nos interesa configurar el contenedor de php para poder usar el depurador con comodidad.

Por defecto, se nos habrá instalado un archivo `php-ini-overrides.ini` en el que podremos poner todos los ajustes de php que nos puedan interesar. De momento, nosotras queremos configurar `xdebug` para poder integrar el depurador con el IDE3

```
zend_extension = xdebug.so

xdebug.max_nesting_level = 512
xdebug.remote_autostart = on
xdebug.remote_enable = on
xdebug.remote_host = localhost
xdebug.remote_port = 9001
xdebug.var_display_max_data = 8192
xdebug.var_display_max_depth = 16
```

Dos apuntes sobre esto:

`xdebug.remote_port = 9001` es necesario porque nginx escucha al intérprete de PHP por el puerto 9000. En el IDE tendremos que asegurarnos de configurar el puerto correcto.

Por otro lado, es posible que tengamos que cambiar `xdebug.remote_host = localhost` por un dominio local.

Obviamente en el Dockerfile acabaremos teniendo en algún momento que añadir líneas con las que instalar otras dependencias de nuestro proyecto Una de las ventajas de usar docker es que no tendremos más que reconstruir los contenedores para realizar las modificaciones necesarias. Del mismo modo, aunque hayamos comenzado con una imagen "precocinada", nada nos impide tampoco cambiar esta configuración por otra más personalizada. Con todo, la que te presentamos aquí es más que suficiente para empezar.

#### Ajustes de Git

???

#### Personalizando symfony

La estructura de carpetas de symfony está bastante bien, pero nosotros queremos refinarla un poco más. Al fin y al cabo symfony es nuestra infraestructura y aunque tenemos que hacer algunas concesiones en cuanto a ubicaciones de elementos del framework, vamos a intentar que la carpeta `src` mantenga una estructura lo más limpia posible.

Por eso quitaremos de ahí la carpeta Controllers y la moveremos a `Infrastructure\EntryPoint\Controller`. Esta va a ser nuestra primera decisión . Para esto tendremos que modificar una entrada en services.yaml para que los Controllers sean autocargados desde esta carpeta.

Introducimos esta modificación en **config/services.yaml**

```yaml
    # controllers are imported separately to make sure services can be injected
    # as action arguments even if you don't extend any base controller class
    App\Infrastructure\EntryPoint\Controller\:
        resource: '../src/Infrastructure/EntryPoint/Controller'
        tags: ['controller.service_arguments']
```


