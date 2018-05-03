---
layout: post
title: Empezando con Doctrine DBAL
categories: articles
tags: bbdd
---

Cuando hablamos de Doctrine casi siempre pensamos en su ORM. Sin embargo, su capa de acceso a la base de datos es una gran herramienta poco conocida, de la que hay poca información aparte de la documentación oficial.


## Instalación

La instalación en un proyecto es bien sencilla:

```bash
composer require doctrine/dbal
```

En principio, si tenemos composer y su autoloader no necesitamos más. No hace falta decir que nos hace falta tener activo un servidor de bases de datos y las credenciales necesarias.

## Obtener una conexión

Para empezar a trabajar necesitamos establecer la conexión con el servidor, por lo que nos harán falta credenciales y pasárselas a Doctrine DBAL. Algo así como esto:

{% gist 9a51d85232f928724a5b923b32d0c41e %}

Lo anterior es un método de una clase DBALClass que accede a la base de datos. Nuestra clase obtiene la conexión mediante el método getConnection que es el que queda recogido en el anterior Gist.

Lo primero es un LazyLoading, si ya tenemos la conexión no la volvemos a establecer.

La línea 9 utiliza el Yaml Component de Symfony para interpretar un archivo de configuración en el que describimos la conexión. El archivo viene siendo como sigue, la ruta concreta queda como ejercicio para el lector:

{% gist 5da0243b1d5e4f11d883a7e30d3b77f8 %}

El componente Yaml se instala con composer:

```bash
composer require symphony/yaml
```

He usado una clave <code>default_connection</code> para definir el nombre de la conexión a usar por defecto si hubiese varias, cosa que podría ser necesaria para poder usar distintos servidores para diversos propósitos.

Debajo de la clave <code>connections</code> van cada una de las conexiones definidas. En el ejemplo, sólo he creado <code>default</code>. He puesto la configuración en formato UrlSchema, que es conciso y fácil de escribir. Se pueden poner claves para cada componente (consulta la documentación).

Las líneas 10 y 11 simplemente obtienen los datos de conexión del array leído del archivo <code>config.yml</code>.

La chicha ocurre en la línea 11, en la que <code>DriverManager</code> obtiene la conexión, pasándole el array con los datos de configuración y un objeto Configuration.

## Ya podemos trabajar

Ahora con una llamada a <code>getConnection</code> en nuestra clase ya podemos obtener una conexión a la base de datos y trabajar con ella. Podríamos enviar SQL directamente si así lo deseásemos:

```php
<pre>$this->getConnection()->exec($query);</pre>
```

En realidad, podemos hacer de todo con nuestras bases de datos, como crear o alterar el esquema, ejecutar SQL y lo que se te ocurra. En futuros artículos espero explicar algunas de estas tareas.

Para terminar, pongo un ejemplo en el que estoy trabajando de un comando de consola para actualizar la base de datos de la aplicación que estoy migrando. El comando añade columnas a varias tablas y mueve datos que estaban en otras.

En la línea 169 está comentado un comando para eliminar las tablas sobrantes.

{% gist 8c8c2b8550f6dde7932546e167a09d93 %}
