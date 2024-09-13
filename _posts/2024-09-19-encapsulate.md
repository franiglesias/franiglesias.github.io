---
layout: post
title: Encapsular primitivos y colecciones
categories: articles
tags: software-design pulpoCon
---

Los tipos nativos y estructuras de datos ofrecidos por los lenguajes suelen ser insuficientes para modelar los conceptos que nos interesan. Pero además, puesto que tratan de ser genéricos suelen ofrecernos más de lo que necesitamos.

## Conceptos simples

Consideremos, por ejemplo, el Email. Lo podríamos modelar con un tipo String. En muchos lenguajes, los objetos String exponen una gran variedad de métodos para manipularlos. Pero en el caso de un email, posiblemente solo nos interesaría tener algún método para extraer su dominio, quizá el nombre de usuario... y poco más.

De hecho, sería prudente no permitir que se puedan usar más métodos para manipular el email, que es un dato que queremos mantener íntegro desde que lo validamos al entrar en el sistema.

Por eso, no es buena idea modelar un email, o cualquier otro concepto simple, mediante un objeto de tipo String. Pero tampoco es buena idea extender el tipo String mediante herencia para crear el tipo o clase Email. Eso nos hace arrastrar todos los métodos de String en Email, que es justo lo que queremos evitar. Por no decir, que nos vincula con absolutamente todos los demás tipos derivados, violando el principio de sustitución de Liskov. Ahí es nada.

La alternativa que nos queda es definir el tipo Email por composición. La propiedad que contiene su valor puede ser perfectamente de tipo String. Pero, al ser privada, sus métodos no son expuestos por Email, que ofrecerá una interfaz específica con todas las acciones que nuestro dominio requiera.

Otro beneficio es que de este modo tenemos manos libres para implementar Email como nos venga mejor, sin que el resto del código tenga que enterarse. Así, si una actualización del lenguaje nos proporciona una forma mejor, podemos utilizarla sin afectar al conjunto de la aplicación.

## Conceptos complejos

Aquí incluimos cualquier concepto que requiera dos o más datos simples. Como normalmente no existen tipos primitivos para estos conceptos, usamos Structs o Clases para modelarlos.

Aplicaríamos los mismos principios. La clase que definimos solo expone aquellos métodos que tengan relevancia para el dominio y se ocupa de mantener la necesaria consistencia e integridad de su estado.

## Colecciones

Esto nos lleva a las colecciones. Tanto si se trata de colecciones de conceptos, resultado de una selección, como un concepto que sea una colección por su propia naturaleza, como podrían ser los conceptos de una factura.

Los lenguajes suelen ofrecer algunas estructuras nativas para dar soporte a colecciones de datos, desde simples arrays a diccionarios, pilas o colas.

Pero, de nuevo, como estructuras genéricas que son nos proporcionan toda una retahíla de métodos que pueden no tener sentido en el dominio. 

La opción más adecuada es definir objetos Colección que no extiendan de una estructura de datos nativa, o de un tipo de Colección abstracto que hayas definido, sino que la usen por composición. Internamente, los implementas con la estructura de datos que más te convenga, pero el código que los consume no lo sabe.

Estas colecciones deberán exponer aquellos métodos que tengan sentido en el dominio o contexto en que se usan. Así, por ejemplo, un objeto LineasDeFactura podría darnos métodos para calcular totales, desglose de impuestos. Si existe una regla de negocio que impida modificar una factura emitida, no tendría que exponer métodos para añadir, borrar, modificar líneas. Y, en caso de que sí, podríamos hacer uso de inmutabilidad.

Sandi Metz llega a recomendar que si usamos una estructura de datos dentro de una clase, nunca accedamos a ella directamente, sino que proporcionemos métodos privados para obtener datos o comportamientos. Se trata de que la propia clase sea ignorante de la implementación.

Como señalamos más arriba, este enfoque te permite modificar la implementación a placer sin que el resto del código se resienta, a la vez que proteges la integridad del estado interno de la colección. Todo ello, ayuda a reducir riesgos y costes de desarrollo.

## DTO y otras hierbas

Los Data Transfer Objects son harina de otro costal. Aunque los modelemos con objetos, no representan conceptos ni tienen comportamiento. Definirlos mediante Structs o clases con campos públicos de solo lectura es una solución perfectamente válida, pues nos proporcionan algunas propiedades deseables.

Como recomendación general, también diría que los datos que porten deberían ser primitivos simples. Lo único que le pedimos a los DTO es llevar datos de un lugar a otro sin alterarlos y haciendo que sea lo más fácil posible utilizarlos. La validez y consistencia de esos datos depende de los objetos que los generen o de aquellos que los consuman. Y los DTO no tienen que mantener ninguna consistencia interna.

_Una versión reducida de este artículo se publicó en la revista de la PulpoCon24._
