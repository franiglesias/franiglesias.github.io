Hoy vamos a hacer un pequeño proyecto práctico de principio a fin. Se trata de un lector de CSV, útil para importar el contenido de archivos en ese formato.

El objetivo de este artículo es mostrar un desarrollo en TDD desde cero hasta completar las especificaciones. Y, de paso, crearemos algo que puede ser útil en multitud de ocasiones.

## Preparando el proyecto

Como IDE voy a usar PHPStorm.

Creamos la carpeta del proyecto y nos situamos dentro:

``` bash
mkdir csvrepo
cd csvrepo
```

Dentro del proyecto vamos a crear las carpetas `src` y `test`

```bash
mkdir src
mkdir tests
```

Iniciamos el proyecto mediante composer init y como primera dependencia requerimos `phpunit`.

```bash
composer init
# Fill in with the data needed
composer require --dev phpunit/phpunit
```

También queremos tener `behat`.

```bash
composer require --dev behat/behat
```

Por último, configuraremos los namespaces del proyecto en composer.json, que quedará más o menos así:

```json
{
  "name": "talkingbit/csv_repo",
  "description": "A simple CSV reader",
  "minimum-stability": "dev",
  "license": "MIT",
  "type": "library",
  "config": {
    "bin-dir": "bin"
  },
  "authors": [
    {
      "name": "Fran Iglesias",
      "email": "franiglesiad@mac.com"
    }
  ],
  "require-dev": {
    "phpunit/phpunit": "^7.4@dev",
    "behat/behat": "^3.5@dev"
  },
  "autoload": {
    "psr-4": {
      "TalkingBit\\CSVRepo\\": "src/"
    }
  },
  "autoload-dev": {
    "psr-4": {
      "Tests\\TalkingBit\\CSVRepo\\": "tests/"
    }
  }
}
```

También hemos añadido la clave config, con bin-dir, de este modo, los paquetes como `phpunit` y `behat` crearán un alias de su ejecutable en la carpeta bin, con lo que podremos ejecutarlos fácilmente con `bin/phpunit` y `bin/behat`.

Después de este cambio puedes hacer un `composer install` o un `composer dump-autoload`, para ponerte en marcha.

```bash
composer install
```

`phpunit` necesita un poco de configuración, así que vamos a prepararla ejecutando lo siguiente. Es un interactivo y normalmente nos servirán las respuestas por defecto.

```bash
bin/phpunit --generate-configuration
```

Esto generará un archivo de configuración por defecto `phpunit.xml` ([más información en este artículo](https://franiglesias.github.io/code-coverage-para-mejores-tests/)). Normalmente hago un pequeño cambio para poder tener medida de cobertura en cualquier código y no tener que pedir explícitamente en cada test, poniendo el parámetro `forceCoversAnnotation` a `false`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<phpunit xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:noNamespaceSchemaLocation="https://schema.phpunit.de/7.4/phpunit.xsd"
         bootstrap="vendor/autoload.php"
         forceCoversAnnotation="false"
         beStrictAboutCoversAnnotation="true"
         beStrictAboutOutputDuringTests="true"
         beStrictAboutTodoAnnotatedTests="true"
         verbose="true">
    <testsuites>
        <testsuite name="default">
            <directory suffix="Test.php">tests</directory>
        </testsuite>
    </testsuites>

    <filter>
        <whitelist processUncoveredFilesFromWhitelist="true">
            <directory suffix=".php">src</directory>
        </whitelist>
    </filter>
</phpunit>
```

Por último, iniciaremos `behat`, para que prepare la estructura de directorios que necesita, aunque podemos configurarla a nuestro gusto.

```bash
bin/behat --init
```

Y ahora añadimos el control de versiones:

```bash
git init
```

Y con esto, podemos empezar.

## El plan

El objetivo es desarrollar un pequeño lector de archivos CSV. De vez en cuando es algo con lo que tenemos que lidiar: importar grandes cantidades de datos de un archivo csv generado desde una hoja de cálculo para realizar algún tipo de análisis o para incorporarlos a nuestras bases de datos.

Lo que quiero es obtener un DTO en forma de array asociativo que luego pueda convertir fácilmente para utilizar en mis aplicaciones.

Además de eso, quiero poder decidir qué campos voy a utilizar

Por otro lado, me gustaría poder hacer algo con los nombres de los campos. Si no están presentes, quiero poder definir un mapeo entre los índices y los nombres de campo que quiero utilizar. También quiero poder mapear los nombres de campos que vengan en el CSV a nombres que sean significativos para mi dominio.

Así que mi CSVRepository tiene que poder:

* Leer los datos de un fichero CSV con distintos delimitadores
* Mapear los nombres de campos a los que a mi me interesen. Por defecto usará los que vengan definidos.
* Si el CSV no tiene una primera línea de nombres de campos, poder mapear los índices a los nombres de campo que yo desee.
* Escoger los campos que quiero importar.
* Si no hay datos, no importará nada.

Debería fallar con excepciones si:

* No existe el archivo que deseo importar.
* Hay algún problema para importar los datos.

### El formato csv

CSV es un formato de almacenamiento de datos en archivos de texto en el que se utilizan algunos caracteres como delimitadores. [Puedes ver aquí la especificación](https://tools.ietf.org/html/rfc4180), aunque existen muchas variantes. Lo más habitual es:

* Normalmente el retorno de carro y/o fin de línea se usa para limitar registros. El último registro puede no llevarlo, pero es buena idea que lo lleve.
* Los campos dentro de un registro se delimitan con comas (,)
* Aparte, los campos de texto pueden ir delimitados con comillas dobles para garantizar su integridad y también para poder usar los caracteres delimitadores como coma o el propio retorno de carro.
* La primera línea puede ser opcionalmente una lista de los nombres de los campos.

Con todo, la especificación tiene variantes. Muchas veces se usa el punto y como como carácter delimitador de campos, y la cabecera es opcional. Por eso, normalmente tendremos que poder configurar nuestro lector para adaptarnos al formato específico del archivo que vayamos a leer.

### Algunos datos de ejemplo

Veamos algunos ejemplos:

```csv
id,username,screen_name,role
1,franiglesias@mac.com,Fran Iglesias,admin
2,sarah@example.com,Sarah Connor,editor
2,benjamin@example.com,Ben Franklin,User
```

Aquí unos datos de altura y peso para calcular el [índice de masa corporal](https://www.texasheart.org/heart-health/heart-information-center/topics/calculadora-del-indice-de-masa-corporal-imc/). En este caso, sin cabecera.

```csv
1.76;80
1.65;57
1.89;77
1.92;83
```

Y aquí tenemos un ejemplo que he sacado de [Barcelona Open Data](http://opendata-ajuntament.barcelona.cat/data/es/dataset/est-padro-sexe): sobre la población por barrios y sexo de la ciudad de Barcelona. Estas son las primeras líneas:

```csv
"Any","Codi_Districte","Nom_Districte","Codi_Barri","Nom_Barri","Sexe","Nombre"
2018,1,"Ciutat Vella",1,"el Raval","Home",25609
2018,1,"Ciutat Vella",2,"el Barri Gòtic","Home",9133
2018,1,"Ciutat Vella",3,"la Barceloneta","Home",7404
2018,1,"Ciutat Vella",4,"Sant Pere, Santa Caterina i la Ribera","Home",11268
2018,1,"Ciutat Vella",1,"el Raval","Dona",21996
2018,1,"Ciutat Vella",2,"el Barri Gòtic","Dona",7902
2018,1,"Ciutat Vella",3,"la Barceloneta","Dona",7489
2018,1,"Ciutat Vella",4,"Sant Pere, Santa Caterina i la Ribera","Dona",11337
```
