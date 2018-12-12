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

En principio, si tenemos composer y su autoloader no necesitamos más. No hace falta decir que nos hace falta tener activo un servidor de bases de datos y las credenciales necesarias.

## Obtener una conexión

Para empezar a trabajar necesitamos establecer la conexión con el servidor, por lo que nos harán falta credenciales y pasárselas a Doctrine DBAL. Algo así como esto:

```php
<?php
...
private function getConnection()
{
    if ($this->connection) {
        return $this->connection;
    }
    
    $cfg = Yaml::parse(file_get_contents(getcwd().'/config/config.yml'));
    $doctrine = $cfg['doctrine']['dbal'];
    $connectionParams = $doctrine['connections'][$doctrine['default_connection']];
    return DriverManager::getConnection($connectionParams, new Configuration());
}
```


Lo anterior es un método de una clase DBALClass que accede a la base de datos. Nuestra clase obtiene la conexión mediante el método getConnection que es el que queda recogido en el anterior Gist.

Lo primero es un LazyLoading, si ya tenemos la conexión no la volvemos a establecer.

La línea 9 utiliza el Yaml Component de Symfony para interpretar un archivo de configuración en el que describimos la conexión. El archivo viene siendo como sigue, la ruta concreta queda como ejercicio para el lector:

```yaml
doctrine:
  dbal:
    default_connection: default
    connections:
      default:
        url: 'driver://user:pwd@server/database?charset=utf8mb4'`
```

El componente Yaml se instala con composer:

```bash
composer require symphony/yaml
```

He usado una clave `default_connection` para definir el nombre de la conexión a usar por defecto si hubiese varias, cosa que podría ser necesaria para poder usar distintos servidores para diversos propósitos.

Debajo de la clave `connections` van cada una de las conexiones definidas. En el ejemplo, sólo he creado `default`. He puesto la configuración en formato UrlSchema, que es conciso y fácil de escribir. Se pueden poner claves para cada componente (consulta la documentación).

Las líneas 10 y 11 simplemente obtienen los datos de conexión del array leído del archivo `config.yml`.

La chicha ocurre en la línea 11, en la que `DriverManager` obtiene la conexión, pasándole el array con los datos de configuración y un objeto Configuration.

## Ya podemos trabajar

Ahora con una llamada a `getConnection` en nuestra clase ya podemos obtener una conexión a la base de datos y trabajar con ella. Podríamos enviar SQL directamente si así lo deseásemos:

```php
$this->getConnection()->exec($query);
```

En realidad, podemos hacer de todo con nuestras bases de datos, como crear o alterar el esquema, ejecutar SQL y lo que se te ocurra. En futuros artículos espero explicar algunas de estas tareas.

Para terminar, pongo un ejemplo en el que estoy trabajando de un comando de consola para actualizar la base de datos de la aplicación que estoy migrando. El comando añade columnas a varias tablas y mueve datos que estaban en otras.

En la línea 169 está comentado un comando para eliminar las tablas sobrantes.

```php
<?php
/**
 * Created by PhpStorm.
 * User: frankie
 * Date: 4/4/17
 * Time: 18:56
 */

namespace Mh13\Command;


use Doctrine\DBAL\Configuration;
use Doctrine\DBAL\DriverManager;
use Doctrine\DBAL\Schema\Comparator;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Yaml\Yaml;


class UpdateContentsTablesCommand extends Command
{


    private $connection;

    protected function configure()
    {
        $this->setName('mh13:update-contents')->setDescription('Update contents tables.')->setHelp(
            'This command updates contents tables to use without Translation'
        )
        ;
    }

    protected function execute(InputInterface $input, OutputInterface $output)
    {
        $output->writeln('Preparing DBAL connection.');
        $this->connection = $this->getConnection();
        $output->writeln('Connection is ready');
        $this->migrateTable(
            'channels',
            'i18n',
            'Channel',
            [
                'title' => ['type' => 'string', 'options' => ['notnull' => false]],
                'description' => ['type' => 'text', 'options' => ['notnull' => false]],
                'tagline' => ['type' => 'string', 'options' => ['notnull' => false]],
                'slug' => ['type' => 'string', 'options' => ['notnull' => false]],
            ]
        );
        $this->migrateTable(
            'items',
            'item_i18ns',
            'Item',
            [
                'title' => ['type' => 'string', 'options' => ['notnull' => false]],
                'content' => ['type' => 'text', 'options' => ['notnull' => false]],
                'slug' => ['type' => 'string', 'options' => ['notnull' => false]],
            ]
        );
        $this->migrateTable(
            'static_pages',
            'static_i18ns',
            'StaticPage',
            [
                'title' => ['type' => 'string', 'options' => ['notnull' => false]],
                'content' => ['type' => 'text', 'options' => ['notnull' => false]],
                'slug' => ['type' => 'string', 'options' => ['notnull' => false]],
            ]
        );
        $this->migrateTable(
            'sites',
            'i18n',
            'Site',
            [
                'title' => ['type' => 'string', 'options' => ['notnull' => false]],
                'description' => ['type' => 'text', 'options' => ['notnull' => false]],
            ]
        );
    }

    private function getConnection()
    {
        if ($this->connection) {
            return $this->connection;
        }

        $cfg = Yaml::parse(file_get_contents(getcwd().'/config/config.yml'));
        $doctrine = $cfg['doctrine']['dbal'];
        $connectionParams = $doctrine['connections'][$doctrine['default_connection']];

        return DriverManager::getConnection($connectionParams, new Configuration());
    }

    private function migrateTable($table, $source, $model, array $fields)
    {
        if ($this->tableExists($table)) {
            $this->addColumnsToTable(
                $table,
                $fields
            );
            $this->listColumns($table);
        } else {
            $output->writeln('Table posts does not exists');
        }

        $this->copyTranslatedFieldsBackToTable($table, $source, $model, array_keys($fields));
    }

    private function tableExists($table)
    {
        $sm = $this->getSchemaManager();

        return $sm->tablesExist([$table]);
    }

    private function getSchemaManager()
    {
        $connection = $this->getConnection();

        return $connection->getSchemaManager();
    }

    private function addColumnsToTable($table, $columns)
    {
        $sm = $this->getSchemaManager();
        $current = $sm->createSchema();
        $new = clone $current;
        $theTable = $new->getTable($table);
        foreach ($columns as $name => $type) {
            $theTable->addColumn($name, $type['type'], $type['options']);
        }
        $comparator = new Comparator();
        $schemaDiff = $comparator->compare($current, $new);
        $myPlatform = $this->getConnection()->getDatabasePlatform();
        $queries = $schemaDiff->toSaveSql($myPlatform);
        foreach ($queries as $query) {
            $this->getConnection()->exec($query);
        }
    }

    private function listColumns($table)
    {
        $sm = $this->getSchemaManager();
        $columns = $sm->listTableColumns($table);
        foreach ($columns as $column) {
            echo $column->getName().': '.$column->getType()."\n";
        }
    }

    private function copyTranslatedFieldsBackToTable($table, $intTable, $model, $fields)
    {
        foreach ($fields as $field) {
            $sql = sprintf(
                'update %1$s left join %2$s on %2$s.model = \'%4$s\' and %2$s.foreign_key = %1$s.id set %1$s.%3$s = %2$s.content where %2$s.field = \'%3$s\'',
                $table,
                $intTable,
                $field,
                $model
            );
            $deleteSql = sprintf(
                'delete from %2$s where %2$s.model = \'%4$s\'',
                $table,
                $intTable,
                $field,
                $model
            );
            $this->getConnection()->exec($sql);
            //$this->getConnection()->exec($deleteSql);
        }
    }
}
```
