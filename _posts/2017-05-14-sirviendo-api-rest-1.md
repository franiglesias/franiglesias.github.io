---
layout: post
title: Sirviendo API rest (1)
categories: articles
tags: api
---

Voy a hacer un ejemplo de controlador que responde a peticiones por [API Rest](/api-rest/) distribuido en varias entregas. Me voy a limitar a lo más básico y en futuros artículos iré añadiendo los elementos de seguridad, etc. En la primera parte, quiero centrarme en la parte de diseño.

Esta serie sobre **API Rest** tiene los siguientes artículos:

[API-REST](/api-rest)  
[Sirviendo API-REST 1](/sirviendo-api-rest-1)  
[Sirviendo API-REST 2](/sirviendo-api-rest-2)

En el fondo, y salvando las distancias, servir una API REST es poco más o menos que servir una página HTML.

Es decir, el controlador recibe la petición, toma de ella la información que necesite y recurre a algún tipo de Service que le proporcione los datos. Los empaqueta en el formato solicitado y los entrega.

Lo realmente importante es seguir las especificaciones de API REST tanto al definir las rutas, como al preparar la respuesta.

El ejemplo que voy a poner está basado en Silex, aunque eso no tiene mayor importancia. La verdad es que Silex resulta muy adecuado para trabajar con API REST, como veremos enseguida.

Para el ejemplo, vamos a suponer un CMS en el que componemos las páginas de índice de las distintas secciones haciendo solicitudes de artículos vía AJAX con unos parámetros de filtrado. Es una API completamente abierta que no necesita restricciones de seguridad, ya que los datos que va a mostrar son públicos y se va a consumir internamente. En ese sentido, es un ejemplo de uso para comunicar diferentes partes de la aplicación.

La verdad es que no voy a exponer todo el código implicado, pero creo que será suficiente para entender cómo funciona.


## Definiendo la API


Para este ejemplo me voy a limitar a una única API. La función de esta API es devolver una colección de artículos publicados en el CMS. Los artículos se ordenan por orden inverso de fecha (lo habitual en los blogs), con la salvedad de que podemos indicar un flag "sticky" para señalar que ciertos artículos especialmente marcados siempre deben aparecer al principio.

En principio, el consumidor será un módulo HTML/Javascript que hará la solicitud mediante AJAX.

* Puesto que la petición persigue obtener recursos, el verbo HTTP será GET.
* Los recursos que se solicitan son artículos del CMS, así que la ruta es `/articles`.
* Las condiciones para filtrar los artículos y seleccionar los deseados irán como parámetros de query. Estas condiciones son:
  * blogs: seleccionar artículos de los blogs indicados
  * excludeBlogs: no seleccionar artículos de los blogs indicados, suele ir con...
  * site: solo artículos del site indicado (es una colección de blogs)
  * home: solo artículos marcados como portada
  * featured: solo artículos marcados como destacados
  * page: página del listado de artículos
  * sticky: ordenar los artículos teniendo en cuenta los que van fijos al principio

Una petición típica podría tener esta forma:

`GET /articles?blogs=mi_blog&page=3`

Que significa, "dame los artículos que pertenecen al blog "Mi Blog" y que están en la página 3".

La ruta podría tener un algún prefijo tipo "/api" o similar para separar distintas familias de ruta, aunque no es preceptivo.


## Rutas


Todos los frameworks tienen su sistema para definir rutas. En Symfony puedes hacerlo en un archivo de configuración o puedes hacerlo con anotaciones. En Silex se hace de una forma particular que me gusta mucho. Este es un ejemplo:

{% gist 0da12821d16b74b1ad4dbd81281372e3 %}

No quiero entrar en detalles de Silex para no liar el artículo. Baste decir que el index.php normalmente crea una instancia de Application, la cual es tanto un contenedor de inyección de dependencias (extiende Pimple) y un router HTTP que nos permite asociar un verbo HTTP, una ruta y un callable que será el controlador.

Por eso decía que Silex va muy bien para crear API, y creo que es evidente el por qué.

En este caso, asociamos la URL `/articles` con el verbo GET y con el método feed de una clase ArticleController. Filtraremos los artículos pasando parámetros en la query, por lo que no especificamos ningún parámetro variable en la ruta.

Si fuese una petición de un artículo específico, la ruta podría ser /articles/{id}, con un parámetro variable id. No creo que haga falta decir que id sería la identidad del artículo. Silex lo pasa automáticamente a la función que vaya a manejar esta petición, como era de esperar.

Si la ruta es llamada con otro verbo, Silex la entenderá como una ruta desconocida, a no ser que la definamos explícitamente, como podría ser PUT /articles para crear un artículo nuevo.


## Controlador


En principio, el controlador que maneje las peticiones a la API debe devolver una respuesta HTTP con el contenido solicitado y las cabeceras adecuadas, así como el código que mejor describa el resultado de la petición.

Silex utiliza la clase Response de la HttpFoundation de Symfony, lo que nos proporciona una herramienta muy conveniente. Por otra parte, Silex nos simplifica bastante ese proceso.

Al margen de la implementación concreta lo que nos interesa ahora es ver lo que tenemos que considerar en la respuesta.

Lo primero, obviamente, es que el controlador debe obtener la información solicitada. Esto puede hacerse a través de algún tipo de Application Service, Commands, o lo que hagas habitualmente.

Una vez que obtiene (o no) un resultado, debe devolverlo y debe acompañarlo de información sobre la respuesta para que el consumidor pueda actuar en consecuencia. Así que antes de ver código de controlador, vamos a ver cómo diseñar la respuesta.


## Códigos de estado


Además del 200, que significa que todo ha ido bien, que se han encontrado los recursos solicitados y que eso mismo es lo que se envía de vuelta al consumidor, tenemos un montón de situaciones posibles que requieren una descripción más allá del "algo ha ido mal".


### La respuesta exitosa básica


En el mejor de los casos obtendremos un resultado, lo empaquetamos en el formato adecuado (tendremos que examinar el valor de la cabecera Accept) y lo enviamos como contenido de la respuesta. Como todo ha ido bien, el código de respuesta debe ser 200 (algo que suelen ajustar por defecto los componentes como Response). También deberíamos ajustar la cabecera Content-Type para que refleje el formato de respuesta.

Por ejemplo, en Silex podemos usar `$app->json()` para devolver sin más este tipo de peticiones exitosas en JSON.


### Las respuestas que no son exitosas


La cuestión es lidiar con algunas situaciones problemáticas. En este punto, es necesario tener a mano los [códigos de estado de HTTP](https://es.wikipedia.org/wiki/Anexo:Códigos_de_estado_HTTP).

A continuación, voy a exponer algunas situaciones más o menos típicas y algunos códigos de error básicos que se podrían utilizar. Para más matización de los problemas consulta la referencia para encontrar el que mejor se ajuste a la situación que necesitas describir. No he incluido las relacionadas con autorización de uso de la API o del contenido, que quedan para otra ocasión.


#### La petición que no tiene resultado


En ocasiones puede ocurrir que la petición sea correcta y no devuelva ningún resultado porque no lo hay. Es decir, al pedírselo al Application Service el controlador obtiene una respuesta vacía.

En ese caso, aunque la interacción HTTP es "exitosa" en el sentido de que el servidor puede dar una respuesta (aunque sea vacía), el consumidor dla API debería recibir algún tipo de feedback que indique lo sucedido. Para ello es adecuado devolver un código 204.

Un tema que podría discutirse es si debe devolverse o no un contenido más informativo que el resultado vacío. Los más pragmáticos sugieren retornar más información.


#### La petición que falla porque no está bien hecha


Si el consumidor dla API utiliza campos de filtrado incorrectos, la API no devolverá resultados y debería comunicar un error significativo, que bien puede ser de la familia 400 - Bad Request. Esto debería permitir al consumidor corregir la petición (es como una especie de error de sintaxis).

En otros casos, el consumidor puede solicitar un recurso inexistente. Por ejemplo, pide un artículo cuyo id no existe. En ese caso, el código de respuesta podría ser 404.

En general, usamos errores 400 si la falta está del lado del cliente.


#### La petición que falla porque el servidor "peta"


Un error del servidor puede dar lugar a una respuesta vacía, pero debemos dejar claro al consumidor dla API que el fallo está en nuestra infraestructura y que la petición en sí es correcta. El código de error puede ser 500. Dentro de esta familia de códigos, los hay para infinidad de situaciones.

En resumen, hay que hacer una lista de posibles situaciones que le interesen a nuestro consumidor y detectarlas en el controlador para decidir el código de respuesta que vamos a devolver.

Sin embargo, también es necesario decidir cómo le vamos a devolver el contenido de la respuesta, para ello tendremos que hablar de las cabeceras HTTP, de la negociación de contenido y las consecuencias que puede tener en la respuesta. Por ejemplo, podríamos tener los datos, pero no poder entregarlos al consumidor en el formato que este desea.

Y eso es lo que veremos en el próximo artículo.
