---
layout: post
title: Introducción a Behavior Driven Development en PHP (5)
published: true
categories: articles
tags: php bdd testing
---

En los capítulos anteriores (1, 2, 3 y 4) hemos puesto como ejemplo el desarrollo de un Use Case usando una metodología Behavior Driven Development. Aunque es un uso válido, normalmente los tests de aceptación que podríamos generar a partir de las Historias de Usuarios se realizan desde un punto de vista que podríamos considerar externo al software.

Esto es, normalmente el software será utilizado por usuarios directamente a través de una interfaz gráfica o consumiendo API, incluso puede que la propia interfaz gráfica sea una de las consumidoras del API. En último término, ambas formas de acceso invocarían un Use Case como el que ya hemos desarrollado.

Este tipo de tests se llaman End to End (De extremo a extremo) porque ejercitan el software desde el punto más externo (la interfaz gráfica, la API) y observan el resultado que devuelve al exterior.

Para construir un ejemplo completo he optado por preparar un nuevo proyecto sobre el que montar una aplicación web muy sencilla. Al principio había pensado en montarlos sobre un microframework como Slim o incluso Silex, pero finalmente he optado por probar también Symfony 4, y aprender algo más por el camino.

Para crear el proyecto de Symfony no hay más que seguir las instrucciones.

Sobre esa base he instalado behat, phpspec y phpunit, y he movido el contenido del proyecto de ejemplo anterior al nuevo, tanto los archivos de configuración que creamos en el capítulo 4, como los contenidos de src y la carpeta tests. Aparte, modifiqué el composer.json para recoger los cambios necesarios para que tanto behat, como phpspec funcionen correctamente.

Además, he aprovechado para organizar el código fuente en una arquitectura más ordenada.

Mi objetivo para este capítulo es mostrar cómo podemos generar un test de aceptación end-to-end que nos ayude a desarrollar una feature en web que, como tal vez recuerdes, se trata de actualizar masivamente precios de productos, utilizando un archivo csv con los nuevos datos.

Lo que veremos es:

* Cómo reutilizar una feature Gherkin para crear otros tests
* Montar y configurar el entorno de Behat para hacer tests de navegador
* Escribir los tests, y usarlos para desarrollar el código necesario

## Un Gherkin para dominarlos a todos

Una posibilidad interesante es que podemos utilizar la misma feature para generar varios Context con usos diferentes, tanto de tests de aceptación End-to-end como tests de integración. Brevemente, podemos:

* Generar contextos end to end para testear las versiones web y api de la misma funcionalidad, o incluso de comandos de consola si fuese el caso.
* Generar contextos, como el que ejemplificamos en las entregas anteriores, que nos permitan el testeo de *Use Cases* en la capa de aplicación.

Para eso, lo único que tenemos que hacer realmente es definir suites en el archivo **behat.yml**. Por ejemplo, esta sería la última versión que he preparado para esta serie:

```yaml
default:
  autoload:
    '': '%paths.base%/tests'
  suites:
    products:
      paths:
      - '%paths.base%/tests/Acceptance/Product/Features'
      contexts:
      - Acceptance\Product\Context\MassiveUpdateContext

    end_to_end:
      paths:
      - '%paths.base%/tests/Acceptance/Product/Features'
      contexts:
      - Acceptance\EndToEnd\Context\MassiveUpdateContext
```

Al ejecutar `bin/behat` podemos apuntar directamente a la suite que queramos ejecutar y generar automáticamente la plantilla para definir los métodos del Context que ya conocemos:

```bash
bin/behat --suite end_to_end --append-snippets
```

No voy a entrar en algunos detalles que ya tratamos en los capítulos anteriores. Con este comando se añaden las definiciones de los pasos en la versión adecuada de MassiveUpdateContext y ya estamos listos para trabajar.

## Empezando con Symfony 4

En este punto voy a empezar de cero con Symfony 4. Hasta ahora no había trabajado con esta versión del framework, así que no estoy muy seguro de lo que va a salir de aquí. Además, voy a hacerlo desarrollando test first, de tal modo que ahora mismo no hay ningún código de aplicación, salvo el UseCase que ya habíamos escrito en los capítulos anteriores.

En resumen, me propongo mostrar que es posible escribir una aplicación web mediante metodología BDD. 

De momento, he desactivado algunas cosas en **config/services.yml** ya que no quiero automagia en este momento.

```yaml
parameters:
    locale: 'en'

services:
    # default configuration for services in *this* file
    _defaults:
        autowire: false 
        autoconfigure: false
        public: false
```

Es posible levantar un servidor web suficiente para este experimento con:

```bash
php -S 127.0.0.1:8000 -t public
```

Aunque también se puede instalar una versión mejor:

```
composer require server --dev
```

Que se puede ejecutar con este comando

```
bin/console server:start
```

De modo que tenemos la página de bienvenida de Symfony en http://127.0.0.1:8000

## Preparando Behat para integrarse con Symfony y para navegar

Instalación de mink y behat2symfony extension

```
composer req behat/mink --dev
composer req behat/symfony2-extension --dev
composer req behat/mink-browserkit-driver --dev
composer req behat/mink-extension --dev
```

Esto nos instala algunas features de demo, pero como nosotros ya teníamos configurado behat.yml no funcionarán. Mi sugerencia es configurar una nueva suite y ver qué pasa con ella.



* http://www.inanzzz.com/index.php/post/7r80/testing-api-style-file-upload-with-behat-in-symfony
* http://www.inanzzz.com/index.php/post/8oyw/file-uploading-with-behat
* https://stefanoalletti.wordpress.com/2018/07/02/symfony-docker-behat-browserstack-testing-your-app-like-a-boss/
* https://symfonycasts.com/screencast/behat/install#bdd-functional-testing-and-planning-a-feature
* https://blog.rafalmuszynski.pl/how-to-configure-behat-with-symfony-4/
* 
