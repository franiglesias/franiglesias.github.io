---
layout: post
title: Un doble para SplFileObject
categories: articles
tags: testing tips
---

La Standard PHP Library incluye unas cuantas clases que merece la pena conocer, entre ellas SplFileObject de la cual nos ocupamos en este artículo. Sin embargo, a veces tienen alguna sorpresa oculta.

Esta semana he estado trabajando en un comando para importar datos de un archivo CSV así que, en consonancia con la forma en que estamos tratando caos similares, he usado SplFileObject para acceder al contenido del archivo. SplFileObject es una clase de la librería estándar que ofrece tratar un archivo mediante una interfaz orientada a objetos.

En un momento dado para testear que la transformación de los datos brutos en algo que sea significativo para la aplicación sea correcta se hace necesaria hacer un stub de SplFileObject, de modo que devuelva una línea del archivo y se haga la transformación.

Así que empezamos de la manera más sencilla posible:

```php
$splFileObject = $this->createMock(SplFileObject::class);

$splFileObject
    ->method('valid')
    ->willReturn(true);
    
$renewalLine = $this->getRenewalLine();
$splFileObject
    ->method('fgetcsv')
    ->willReturn($renewalLine);
```

Este fragmento de código genera un doble SplFileObject y simula que está disponible una nueva línea de datos CSV.

Pero al ejecutar el test lanza este error:

```
LogicException : The parent constructor was not called: the object is in an invalid state 
```

Buscando la explicación de este error aparecen algunas pistas, que [indican que SplFileObject extiende de SplFileInfo](https://gist.github.com/everzet/4215537), la cual exige que se pase una ruta al archivo sí o sí. Puesto que al generar el doble se ignora por defecto el constructor, eso nunca llega a ocurrir y de ahí el fallo. Este ejemplo ilustra tanto los problemas de dependencia que puede generar la herencia como esas cosillas peculiares que aparecen a veces en los objetos de la SPL.

De todos modos, la solución es fácil. Tan solo hay que tomar el camino largo de creación de dobles:

```php
$splFileObject = $this->getMockBuilder(SplFileObject::class)
    ->enableOriginalConstructor()
    ->setConstructorArgs(['/dev/null'])
    ->getMock();
```

Hacemos que se ejecute el constructor original y le pasamos como argumento la ruta `/dev/null`, lo cual nos permite cumplir la condición para que se puede generar el doble, pero no se necesita manipular ningún archivo para ello.

