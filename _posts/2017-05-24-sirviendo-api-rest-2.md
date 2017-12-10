---
layout: post
title: Sirviendo API rest (2)
categories: articles
tags: api api-rest
---

En esta entrega, voy a empezar a mostrar algo de código de un controlador que maneja una API.

Esta serie sobre **API Rest** tiene los siguientes artículos:

[API-REST](/2017-05-09-api-rest.md)  
[Sirviendo API-REST 1](/2017-05-14-sirviendo-api-rest-1.md)  
[Sirviendo API-REST 2](/2017-05-24-sirviendo-api-rest-2.md)

Esta api devuelve una colección de artículos de un CMS para mostrar en las páginas índice de las diversas secciones de un sitio web. La idea era tener un único punto de entrada para obtener estas colecciones de artículos.

Este es el código:

{% gist c9378c6ee7155b3bbac9706f1bc1b3e3 %}

La mayor parte del trabajo la realiza ArticleService, que busca los artículos en la solución de persistencia, a partir de una ArticleRequest. ArticleRequest es un objeto que extrae los filtros de la URL de la petición y es utilizado por ArticleService para montar una Specification compuesta y aplicar ciertos criterios de ordenación.

En cualquier caso, lo que importa es que ArticleService devuelve un array con los artículos encontrados y ArticleController sólo tiene que dar la respuesta adecuada a la petición.

En el [artículo anterior](/sirviendo-api-rest-1) comentaba que se podían dar diferentes resultados y que deberíamos dar una respuesta adecuada.

## Happy path

El "happy path" sería que se encuentren artículos y se le pueda dar una respuesta satisfactoria al consumidor, que es lo que se hace en las líneas 54 a 63.

En resumidas cuentas, se calcula cuál es la página actual de resultados y cuántas son en total para esas condiciones y se devuelve una respuesta en formato JSON, con status 200 (HTTP_OK) y varias cabeceras, entre ellas, Link.

En este caso, uso la clase JsonResponse de Symfony HttpFoundation, aunque eso es indiferente. También utilizo las constantes de Response que representan los distintos códigos de estado HTTP, lo que permite que el código sea más expresivo.

Las cabeceras personalizadas **X-Max-Pages** y **X-Current-Page** podrían ayudar al consumidor a dar información al usuario sobre su situación en el listado global de artículos. No son preceptivas, sin embargo a mí me pareció útil enviar esta información. Al hacerlo en la cabecera evitamos contaminar el array JSON, que el cliente puede usar con la confianza de saber que sólo va a tener artículos.

La cabecera **Link** es una cabecera estándar y nos sirve para enviar enlaces relacionados. La idea de esta cabecera es que el cliente no tenga que calcular los enlaces que necesita para acceder a recursos relacionados. En este caso, las he puesto para dar al consumidor enlaces de paginación.

El método **computeLinks** se encarga de generar el array de cabeceras Link que vamos a publicar y que, en este caso, comprenden un enlace a la primera página del listado **(rel=first)**, a la siguiente **(rel=next)** y a la anterior **(rel=prev)**.

Al hacerlo así, el consumidor no tiene más que buscar los enlaces rel=* que necesite y usarlos tal cual. No tiene que hacer cálculos de páginas, ni de registro actual, ni nada.

## No encontramos nada

Aunque todo funcione bien, puede que la petición no devuelva contenidos porque no existen artículos que respondan a las condiciones realizadas.

Como vimos en el artículo anterior, ese tipo de situación la describe el error 204 (petición exitosa, en el sentido de que todo funciona, pero que no da resultado).

En ese caso, hay que devolver igualmente una respuesta, con el código adecuado. Yo he decidido utilizar el cuerpo de la respuesta para poder mandar un mensaje explicativo vía JSON. Pero, de nuevo, esto no es preceptivo, sino una recomendación que hacen algunos expertos desde un punto de vista pragmático. Otra opción sería enviar alguna cabecera X-Detailed-Message para enviar información más precisa y dejar el cuerpo del mensaje vacío.

Ese código está entre las líneas 47 y 52 y es posible que te chirríe el if. A mí también un poco.

Una opción es que ArticleService lance una excepción y capturarla. Para muchos es una mala opción porque no encontrar artículos no sería una situación excepcional (simplemente no hay artículos que cumplan las condiciones). Otra cosa sería que se hiciese una petición incomprensible, pero ese es otro tema. La cuestión es que, si bien, en este caso nos podría interesar que fuese así, en otros lugares en los que se utilice ArticleService podría no tener ningún sentido.

La otra opción es que en el condicional, en lugar de enviar la respuesta JSON, lanzásemos una excepción y la capturásemos en un bloque catch. Tampoco estoy seguro de que sea una buena idea (no se deberían usar excepciones como forma de controlar el flujo), aunque deja más limpio el Happy Path.

(Si tienes una opinión sobre esto, se agradece que lo dejes en los comentarios)

## Tenemos problemas

ArticleService puede lanzar algunas excepciones. Por ejemplo, si la conexión a la base de datos falla por algún motivo. Los bloques catch manejan estas situaciones, con un último bloque para capturar una excepción genérica e informar de lo que ha pasado.

Cada bloque genera una respuesta acorde con el problema encontrado.

## Una ruta para responder

Las rutas son dependientes del framework o router específico que vayamos a utilizar. En este caso estoy usando Silex como framework para la interfaz web.

He decidido que la ruta que sirve el api sea **/api/articles**, por tanto, en mi **index.php** aparece algo así:

{% gist e6ca0eab400154d8311016d9854473af %}

En este ejemplo, el controlador se declara como servicio, para que esté lo más desacoplado posible.

El **when** nos permite realizar una negociación muy básica de contenido, ya que Silex sólo responderá si el consumidor solicita _application/json_, lo que dificulta otros accesos al API.

## Limitaciones y resumen

Y con esto tenemos un controlador básico capaz de servir un API, resolviendo algunos de los problemas principales que se nos plantean.

En su estado actual, el controlador no puede atender peticiones desde otro dominio y tampoco hace nada por autentificar (en este caso es una API completamente pública que sólo ofrece información, así que tampoco tiene mucho sentido limitarla) y tiene otras limitaciones que intentaré ir subsanando en futuras entregas.
