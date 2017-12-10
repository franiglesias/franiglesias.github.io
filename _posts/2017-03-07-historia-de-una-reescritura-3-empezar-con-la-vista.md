---
layout: post
title: Historia de una reescritura (3): empezar con la vista
categories: articles
tags: misc
---


Cuando analizas tu código antiguo es casi como analizar el código de otro desarrollador. En realidad es un poco peor, porque sabes que tú eres el responsable de esa masa de lodo. Esta es la tercera entrega de una <a href="https://talkingbit.wordpress.com/2017/03/05/historia-de-una-reescritura-2-el-problema-con-mvc/">serie sobre mi proyecto para abordar una aplicación legacy</a>.

----
La serie **Historia de una reescritura** está compuesta de 5 artículos

[Historia de una reescritura (1):](historia-de-una-reescritura-1.md)  
[Historia de una reescritura (2): El problema con MVC](historia-de-una-reescritura-2-el-problema-con-mvc.md)  
[Historia de una reescritura (3): Empezar con la vista](historia-de-una-reescritura-3-empezar-con-la-vista.md)  
[Historia de una reescritura (4): El código tóxico](historia-de-una-reescritura-4-codigo-toxico.md)  
[Historia de una reescritura (5): Tests](historia-de-una-reescritura-5-tests.md)  

----
Hay decisiones que tienen sentido tomadas en perspectiva. Por ejemplo, basarse en un framework MVC como CakePHP 1.* era muy razonable en su momento, debido a su orientación práctica, las limitaciones inherentes a la versión 4 de PHP, el boom que estaban experimentando los frameworks MVC (Symfony, CodeIgniter, el componente MVC de Zend, etc) o la proyección aparente que iba a tener el proyecto.

Sin embargo, un par de años después la comunidad alrededor de CakePHP se rompió en dos  y el futuro del proyecto se mantuvo dudoso un tiempo. Pero eso no se podría predecir salvo que tuvieses mucha experiencia en ese campo.

Otras decisiones son mucho más difíciles de explicar. Malas decisiones en cuestiones como la organización de código, diseño, etc, derivan de la falta de experiencia y de fundamentos teóricos. Mi código comenzó a cambiar cuando aprendí sobre los patrones de diseño de software, y sobre una verdadera separación de responsabilidades más allá del MVC, pero hasta entonces había algunas cosas buenas a las que había llegado por intuición junto a otras bastante lamentables.

Una de las lamentables fue la organización del código de las vistas.

En CakePHP las vistas se generan mediante plantillas HTML con código PHP incrustado. Nada malo en principio. Partiendo de la base de que PHP fue diseñado originalmente como un lenguaje "de plantillas", lo cierto es que tiene todo el sentido del mundo.

Hay tres tipos de plantillas:

* **Layouts**: por lo general, los layouts son plantillas contenedoras, que mantienen elementos comunes de las páginas y en las que se inserta el código específico de una vista o acción del controlador.
* **Views**: las views son las vistas concretas de cada acción del controlador. La idea es que se inserten en un Layout para componer la página entera.
* **Elements**: los elementos son fragmentos de HTML que se pueden reutilizar e incluir dentro de una view o de un layout.

De nuevo, sobre el papel, no hay problema. Pero hay más colaboradores en el tema de las plantillas: los Helpers, y eso lo lía todo.

Los Helpers son clases PHP cuya misión es ayudarnos en la generación del código de las vistas. Por una parte, hay Helpers que actúan como filtros para obtener los formatos de visualización adecuada de la información. Otros Helpers generan código complejo, como el FormHelper o el HtmlHelper y otros. Como desarrollador, puedes crear tus propios Helpers, lo que añade más elementos al lío.

Por hacer corta, una historia larga, yo mismo provoqué varios problemas con los Helpers.

* Por un lado, el abuso de los mismos al utilizarlos para generar código HTML o Javascript relativamente simple, que habría podido escribirse de forma nativa o como alguno de los tipos de plantillas mencionadas más arriba.
* Por otro, la creación de Helpers para resolver problemas que se podrían gestionar adecuadamente con las herramientas básicas de las plantillas, o que realmente no eran problemas.
* La desorganización del código responsable de las vistas, distribuido en una multitud de carpetas, clases y bibliotecas, hasta el punto de que hay clases, plantillas y elementos que probablemente ya no se usan o duplicaciones de código en muchos lugares.

Las vistas de mi aplicación empezaron a comportarse como una especie de enfermedad creciendo sin control y ocupándose de cosas que no debían. No podía comenzar la reescritura de la aplicación sin tomar medidas sobre eso y, finalmente, pensé que podría ser buena idea cambiar la tecnología subyacente. Era hora de recurrir a Twig.

Twig es el lenguaje de plantillas de SensioLabs y el recomendado para Symfony. Al principio pensé que iba a ser un mundo integrarlo en un proyecto antiguo de CakePHP pero resultó que no.

Después de intentarlo con un <a href="https://github.com/yappabe/cakephp-twig-view">plugin al efecto que no conseguí hacer funcionar</a>, la forma de integrarlo no sólo fue sencilla, sino que no interfería apenas en el funcionamiento general de la aplicación, es más, con un mínimo de cuidado en realidad no se rompe nada.

## Manos a la obra

Para empezar a trabajar, hice un duplicado del estado de la aplicación en la máquina de desarrollo (incluyendo base de datos, archivos de imágenes y demás). A continuación, me aseguré de que podía hacerla funcionar en el servidor web local para desarrollo. Fundamentalmente se trataba de configurar la aplicación para trabajar en esa máquina concreta (en realidad desarrollo en dos ordenadores, por lo que de paso estoy reorganizando cosas para poder mover el proyecto con facilidad).

Una vez conseguido esto, instalé Composer para el proyecto, de modo que pudiese ir añadiendo dependencias (como Twig) de forma sencilla, pero también phpspec y phpunit para cuando tocase, o cualquier otra que llegase a ser necesaria. Posteriormente, creé un <a href="https://github.com/franiglesias/mh13">repositorio en GitHub</a>.

Una vez instalado Twig no tuve más que añadirlo como <a href="http://mh13/app_controller.php">member al AppController</a>, del cual descienden todos los controladores, y crear un Loader apuntando a la carpeta base que contiene las plantillas (en mi caso la carpeta view global del proyecto) y un Environment. No necesitas más para empezar.

En realidad, estoy pudiendo reproducir (y, de paso, mejorar) todo lo que podía hacer con el sistema de plantillas de CakePHP.

En cada acción que voy a reconstruir hago lo siguiente:

Duplico el archivo .ctp que contiene la plantilla, le cambio el nombre a .twig y lo muevo a su ubicación definitiva en la carpeta views global del proyecto.

Reemplazo las llamadas incrustadas a PHP por su equivalente en comentarios de Twig, de modo que tengo el código viejo como guía en la plantilla sin que afecte a su funcionamiento. Una cosa que me viene muy bien es la imposibilidad de ejecutar PHP en la plantilla Twig, con lo que me aseguro de que el código Legacy de cada vista deja de ser llamado.

Este es el RegExp que me permite hacer ese cambio.

```php
Find: <\?php([\s\S]*?)\?>

Replace: {#$1#}
```

Reescribo el código PHP como código Twig o HTML con Twig.

En muchas de las plantillas, hay llamadas a helpers o se incluyen elements, por lo que duplico y vuelo a escribir como twig aquellos que vaya siendo necesario.

## Equivalencias de CakePHP en Twig

Veamos cómo he ido sustituyendo los diferentes tipos de componentes del sistema de plantillas:

* **Layouts**: se reemplazan con plantillas twig básicas, que normalmente contienen el esqueleto HTML de la página y bloques que serán sustituidos por el contenido de las vistas de cada acción.
* **Vistas**: se reemplazan con plantillas twig que extenderán de los layouts, por lo tanto deben incorporar su código dentro de los bloques necesarios.
* **Elements**: en este caso, los reemplazamos con includes, que es el concepto equivalente, aunque a veces podemos usar macros de twig.
* **Helpers**: los helpers tienen varios sustitutos, porque en realidad responden a varios conceptos:
	* Algunos de ellos pueden sustituirse por el código HTML/Twig porque simplemente son ayudas para generar las etiquetas HTML.
	* Otros tienen una función parecida a la de los elements, por lo que pueden reemplazarse por includes.
	* En varios casos, el mejor sustituto de un helper es una macro. Las macros están siendo interesantes para utilizar diversos casos:
        * Estructuras genéricas complejas en HTML. Por ejemplo, para montar los típicos widget de columna lateral que tienen un título y un contenido. En Symfony hay muchos ejemplos de ello.
        * Estructuras que pueden escogerse en tiempo de ejecución en función de preferencias o algún tipo de test. Por ejemplo, la parte de gestión de contenidos permite que el sistema elija cabeceras con imagen o sin ella, entre diversos tipos de listas de artículos o incluso en la forma de presentar las fotografías por artículo. En algunos de estos casos, un archivo de macros con las diversas variantes, permite tener el material más organizado y hacerlo más coherente.
	* Y, por último, hay helpers que pueden resolverse mediante filtros y funciones de twig, ya sean de las incorporadas, ya sea creando las nuestras propias. Por ejemplo, en mi caso, he adaptado un helper para hacer diversos chequeos en el cuerpo de los artículos de modo que pueda detectar enlaces a youtube o extraer una entradilla del texto.




## El caso RequestAction

Muchas clases CakePHP tienen un método requestAction que nos sirve para llamar a un controlador desde cualquier punto del código. Este método tuvo cierta polémica en su momento porque se consideraba que penalizaba mucho el rendimiento, aunque posteriormente hubo benchmarkings que prácticamente decían lo contrario si se usaba una buena estrategia de cache, incluida con el propio framework.

Sin embargo, con requestAction era muy fácil construir módulos especializados con los que construir páginas complejas.

La solución que he encontrado para reemplazar requestAction en twig es muy simple: AJAX. Usando jQuery, un simple $().load(url) me basta para recargar un módulo. Por ejemplo:

```javascript
$('#mh-main-header').load('/uploads/image_collections/collection/home');
```

El código del controlador tiene que recibir algunos cambios para gestionar la nueva forma de ser llamado que debe generar una plantilla twig.

Esto no sólo funciona muy bien, sino que abre la puerta a un nuevo estilo de módulos que podrían actualizarse dinámicamente, aunque eso quedará para una fase más adelante.

## Beneficios obtenidos

Aunque todavía estoy en proceso, los beneficios están empezando a manifestarse.

El primero y más importante es que cada nueva plantilla convertida es un paso en el proceso de deshacerse de la "deuda técnica". Uno de los aspectos beneficiosos de cambiar la tecnología básica es que la nueva (Twig) no tiene ninguna dependencia dentro del código actual de la aplicación, por lo tanto, en el momento en que todas las plantillas estén convertidas podemos deshacernos sin ningún problema de todos los elementos "tóxicos" de la aplicación.

Por otro lado, aunque aún es pronto para asegurarlo con certeza, el rendimiento parece haber mejorado de manera significativa.

Finalmente, la reunificación del código relacionado con la vista en un sólo punto permite un mejor modularización del proyecto en el ámbito del desarrollo. La gestión de assets, css y javascript también se ha centralizado en otro punto y automatizado usando Gulp. Estamos utilizando como base el framework Foundation 6 y las hojas de estilos las escribimos en SASS. Nuestro <a href="https://github.com/franiglesias/mh13/blob/master/frontend/gulpfile.js">gulpfile</a> se encarga de mantener al día todo lo necesario.

## Próximos pasos

En realidad, el trabajo no ha hecho más que empezar.

El proceso de reescritura de la vista tiene varias fases. En un primera, la idea es convertir todo el código a Twig, afinando lo más posible.

Sin embargo, al menos habrá una segunda pasada a medida que vaya viendo qué elementos pueden necesitar una re-elaboración. Por ejemplo, dónde viene mejor usar macros, dónde plantillas para incluir, qué layouts son prescindibles, etc.

Entremedias, una vez que el código de vistas deje de depender de otros componentes del proyecto, eliminaré éstos y pasaré a centrarme en la evolución del código hacia una arquitectura limpia.

Pero de eso hablaré en otro capítulo. Antes, me gustaría hablar del código tóxico.