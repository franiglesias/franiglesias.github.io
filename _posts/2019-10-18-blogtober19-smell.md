---
layout: post
title: Smell (Blogtober2019)
categories: articles
tags: blogtober19
---

Mi compañera y manager en Holaluz [Mavi Jiménez](https://twitter.com/Linkita) va a hacer un dibujo cada día del mes sobre una palabra propuesta en twitter. Y aquí vamos a intentar escribir [un post por cada una de ellas](https://franiglesias.github.io/blogtober19-status/).



## Smell

Los *code smells* son una serie de heurísticos que nos sirven para detectar problemas en la calidad del código. Esto es, no indican cosas que funcionan mal, sino las que presentan problemas en el diseño con consecuencias en la legibilidad, la sostenibilidad y, en general, las que indican que nuestro código no está limpio. Martin Fowler [dice que el término lo introdujo Kent Beck](https://martinfowler.com/bliki/CodeSmell.html) cuando estaba escribiendo la primera edición de [Refactoring](https://www.amazon.es/dp/0201485672/ref=cm_sw_em_r_mt_dp_U_npDQDbX8AJ1GY). La [segunda es esta](https://www.amazon.es/dp/0134757599/ref=cm_sw_em_r_mt_dp_U_zoDQDb040EWH5).

Un [catálogo bastante bueno de smells es éste de SourceMaking](https://sourcemaking.com/refactoring/smells), que los agrupa en las siguientes categorías:

* **Bloaters**: cualquier unidad de código desmesuradamente grande.
* **Object-Orientation Abusers**: cuando se aplican mal los principios de orientación a objetos.
* **Change Preventers**: los que observas cuando para conseguir un cambio acabas teniéndolo que hacer en muchas partes.
* **Dispensables**: todo lo que sobra, cosas que si las quitas todos viviremos mejor.
* **Couplers**: aquello que contribuye a acoplar clases entre sí.

Aprender a identificar *smells* es una buena herramienta para detectar las áreas del código que necesitan algún arreglo. Literalmente es como ciertos malos olores: si los percibimos nos damos cuenta de que algo malo paso. Otra cosa es resolver el problema de base.

Vamos a ver algunas ideas generales por tipos de *smell*.

## Bloaters

En general, los **bloaters** son fáciles de identificar porque cuando tienes que enfrentarte con ellos son un dolor. Desde el punto de vista de la memoria de trabajo, te cuesta mucho leer método largos, manejar listas de más de 3 ó 4 parámetros y, en general, cualquier cosa que la satura por sobrecargar la capacidad de manejar tanta información a la vez.

Si tenemos un método con más de 10 líneas de código, tenemos un *Long method smell*. Cuantas más líneas de código tenga un método más difícil es de entender, es más posible que esté haciendo demasiadas cosas y es más posible que esté mezclando niveles de abstracción. La forma de atacarlo es romper el método en métodos más pequeños, con buenos nombres, que encapsulen niveles de abstracción. No hay ningún problema en que sean métodos de una sola línea si de este modo el método principal es más legible.

## Object Orientation Abusers

Los *smells* por **Object Orientation Abusers** resultan más sutiles y difíciles, por tanto, de detectar. Por un lado, requieren tener una cierta soltura con la orientación a objetos y, por otro, se camuflan fácilmente como prácticas correctas.

Pongamos que tenemos dos clases que tienen un método que hace las mismas cosas pero con distinto nombre. Es posible que podamos unificar los nombres, dándoles una interfaz común y, tal vez, extraer la funcionalidad a una clase abstracta de la que deriven extiendan ambas y así evitar la duplicación. En el fondo, es una violación del principio DRY, pero los diferentes nombres de los métodos nos pueden llevar a no verlo a la primera.

## Change Preventers

Estos *smells* se detectan porque hacen difícil lo fácil. Cuando necesitas cambiar algo, acabas descubriendo que tienes que hacer cambios en muchos sitios más. Esto puede ocurrir por varias razones, como que exista la misma funcionalidad en varias clases o que esté repartida en varias. Como indica su nombre, hacen difíciles, lentos e incluso peligrosos los cambios, porque siempre te quedará la duda de si te has acordado de todo. De nuevo, es una violación del principio DRY.

Es el caso de *Shotgun Surgery*, en el que si haces un cambio en una clase tienes que aplicar cambios en otras. Esto ocurre bien porque no habías detectado la parte común, para extraerla a otra clase y usarla mediante composición o incluso herencia, bien porque no has abstraído bien la funcionalidad que realmente podrías unificar en una sola clase.

## Dispensables

Cuando algo se podría quitar del código sin que afecte a nada tienes un caso de *Dispensable*. Esto puede ocurrir cuando nos hemos pasado de frenada anticipando funcionalidades que nunca se necesitan, o bien cuando dejamos de utilizar métodos o clases porque ya no son necesarias. Muchos IDE nos pueden ayudar a detectar este tipo de problemas ya que, precisamente porque no se usan, es fácil olvidarse de que están ahí. Sin embargo, una vez que te los encuentras te pueden causar un pequeño quebradero de cabeza hasta que puedes determinar si tienen o no utilidad.

Un caso curioso es *Lazy Class*. Tienes una clase que, en principio, tiene funcionalidad y tiene todo su sentido. Sin embargo, empiezas a refactorizarla y cuando te das cuenta, resulta que no la necesitas para nada.

En general, diría que es un *smell* que se puede prevenir usando buenos nombres para clases y métodos, así como evitando escribir más funcionalidad de la que necesitamos en el momento (principio YAGNI: *You ain't gonna need it*).

## Couplers

Los **couplers** son *smells* que se pueden descubrir muy bien en tests unitarios con dobles ya que complican enormemente cualquier test. Uno de los más fáciles de detectar es *Message Chains*, en el que un objeto, llama a otro que está dentro de otro que, a su vez, están dentro de otro. Una violación de la Ley de Demeter de libro: `$object->collaboratorA->collaboratorB->doSomething()`. Es un problema porque hace que la clase que usa $object tenga que saber mucho sobre las otras que participan.

A veces el acoplamiento se produce justo por lo contrario. Encapsulamos esa funcionalidad dentro de una clase que acaba siendo nada más que una concha vacía que delega en otras. Es un patrón que en ciertos contextos es válido (por ejemplo, **Adapter** o **Façade**).

En fin. Podríamos hablar largo y tendido sobre *smells* y cómo tratarlos, pero entonces nos daría para un libro por lo menos.

En cualquier caso, una última recomendación. Muchos *smells* lo son también por grado y es relativamente fácil resolver uno… generando otro.


 



