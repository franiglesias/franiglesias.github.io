---
layout: post
title: Herramientas más allá del IDE para Mac OS X
categories: articles
tags: tools
---

Si trabajas con un buen IDE puede que te quedes con la sensación de que no necesitas nada más, pero todo ayuda.

Después de muchos años desarrollando acabas creando unos hábitos en torno a un conjunto de herramientas. La primera, por supuesto, es el IDE. En mi caso, como en el de muchísimos más, el elegido es PHPStorm, de JetBrains. La verdad es que es tan completo que prácticamente no necesitas otra cosa. Además de la gestión del proyecto, integración con diversos frameworks de aplicación y de testing y todo lo necesario para trabajar en PHP, tienes terminal, cliente HTTP, integración con gestores de versiones, bases de datos, etc. Puedes pasarte la jornada de trabajo sin salir del entorno.

Sin embargo, ya sea por comodidad o por tener herramientas más orientadas a ciertas tareas, muchas veces merece la pena tener aplicaciones especializadas a las que recurrir.

A continuación, comento brevemente las que yo estoy utilizando. No digo que sean las mejores de su campo, pero al menos en mi caso me sirven bien.

## Bases de datos

### SequelPro

Es una aplicación con la que puedes gestionar fácilmente bases de datos MySQL o compatibles tanto locales como remotas. Puedes manejar fácilmente las tablas, hacer búsquedas, etc. Cuenta también con una consola para probar tus queries.

Resulta mucho más ágil e intuitiva para trabajar que Workbench y otros clientes similares.

[Sequel Pro](https://www.sequelpro.com)

### MongoDB Compass

Compass te permite consultar tus bases de datos y colecciones MongoDB con un cliente gráfico bastante sencillo.

[Compass](https://www.mongodb.com/download-center?filter=enterprise#compass)

### NoSQL Booster

Recientemente, he empezado a probar NoSQL Booster, aunque no sé si realmente me gustará.

[NoSQL Booster](https://nosqlbooster.com/downloads)

## Editores de texto

Teniendo un IDE ¿para qué necesitas un editor de textos? Bueno, a veces es más cómodo para hacer un arreglo rápido en un archivo, o bien para trabajar de forma más ágil con ciertos formatos. Por ejemplo:

### Macdown

Si escribes habitualmente documentación o posts en Markdown, este pequeño y ligero editor, con una previsualización hermosa va muy bien.

[Macdown](https://macdown.uranusjr.com)

### TextWrangler

Es el hermano pequeño de BBEdit, uno de los editores de texto para programadores histórico del entorno Mac. Posiblemente el de más solera y uno de los mejores de todos los tiempos. Es útil para revisar de manera ágil archivos sin tener que abrir el IDE completo.

[Text Wrangler](https://www.barebones.com/products/textwrangler/)

## Desarrollo

### HTTP Client

Aunque PHPStorm integra un cliente de HTTP muy práctico, en alguna ocasión me ha venido bien contar con HTTP Client, una utilidad muy espartana con la que examinar interacciones HTTP problemáticas.

[HTTP Client](https://itunes.apple.com/es/app/http-client/id418138339?mt=12)

### Postman

Javier Esteban nos recuerda Postman como herramienta para desarrollar APIs, que incluye la capacidad de testearlas enrte otras muchas utilidades.

[Postman](https://app.getpostman.com/app/download/osx64)

## Gestión de versiones

### SourceTree

Félix Gómez comenta SourceTree para gestionar repositorios en proyectos complejos. La verdad es que si tocas el código con diversas herramientas a veces se agradece poder examinarlo en una aplicación dedicada como esta y no tener que tirar de CLI.

[Sourcetree](https://www.atlassian.com/software/sourcetree)

### Github desktop

El cliente de Github es ligero y va muy bien en bastantes casos en los que no quieres tener un IDE completo.

[Github desktop](https://desktop.github.com)

## CLI

### Homebrew

Es el gestor de paquetes con el que instalar utilidades y programas en línea de comandos. Simplifica mucho su mantenimiento. He visto que hay también una utilidad GUI, que puede ser interesante.

[Homebrew](https://brew.sh/es)
[CakeBrew](https://www.cakebrew.com)

### Oh my zsh

Se trata de una mejora para el terminal. Con ella, a través de plugins, dispones de una serie de mejoras de aspecto y de funcionalidad. El solo hecho de mostrarte la branch actual del repositorio de Git es suficiente excusa para instalarlo, junto con el coloreado en ls. De ahí en adelante todo son ventajas.

[Oh my zsh](https://github.com/robbyrussell/oh-my-zsh)

## Mejoras de Finder

### Flycut

Flycut te permite mantener un portapapeles histórico y persistente en Mac OS X. Es solo para texto, pero para programadores ya nos vale. Puedes tener los últimos 99 recortes a tu disposición. Hay aplicaciones que incluyen un portapapeles histórico, pero no entre aplicaciones.

[Flycut](https://itunes.apple.com/es/app/flycut-clipboard-manager/id442160987?mt=12)

### Plugins para quicklook

Quick Look es una característica del Finder de Mac OS X que permite abrir una vista preliminar de un archivo con solo tenerlo seleccionado y pulsar la barra de espacio. Es muy práctico cuando quieres encontrar algo entre un montón de archivos. Lo que no es muy conocido es el hecho de que es un sistema extensible mediante plugins, lo que le permite reconocer formatos de archivo y mostrarlos adecuadamente.

En el enlace puedes acceder a una colección de plugins interesantes para desarrolladores. Con ellos puedes echar un vistazo rápido a archivos de código con syntax highlight, markdown formateado y un montón de cosas interesantes más.

[Quick Look Plugins](https://github.com/sindresorhus/quick-look-plugins)

### The Unarchiver

Gestiona automáticamente en el Finder todo tipo de archivos comprimidos.

[The Unarchiver](https://theunarchiver.com)

### Jetbrains Toolbox

Si trabajas con los IDE de JetBrains (PHPStorm, PyCharm, IntelliJ, etc...) esta herramienta te permite tener en un solo punto la gestión completa de tu entorno: instalar o actualizar herramientas, acceder a los proyectos, ajustes por defecto, licencia, etc.

[Toolbox App](https://www.jetbrains.com/toolbox/app/)

## ¿Alguna más?

Estas son las herramientas que uso más habitualmente en mi trabajo. ¿Tienes algunas preferidas? Puedes dejarlas en los comentarios y las añadiré en esta lista. Gracias.
