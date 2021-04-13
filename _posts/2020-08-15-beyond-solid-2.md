---
layout: post
title: Más allá de SOLID, los cimientos
categories: articles
tags: design-principles good-practices
---

A veces, cuando se habla de principios de diseño de software parece que sólo existiesen estos cinco. Así que los repasaremos con un poco de contexto.

Los principios SOLID son cinco principios en el diseño orientado a objetos compilados por Robert C. Martin. Puedes encontrarlos [aquí](http://butunclebob.com/ArticleS.UncleBob.PrinciplesOfOod), con enlaces a los artículos originales.

Diría que su popularidad es debida tanto a su inclusión en libros como *Clean Code*, como del afortunado acrónimo con el que se nombra habitualmente el conjunto. Lo cierto es que componen un sistema coherente y mantienen una cierta interdependencia entre ellos. Seguirlos es una gran ayuda para lograr un código sostenible, fácil de entender y de extender, si bien es cierto que poner énfasis en uno de ellos puede perjudicar cumplir otros.

Con todo, yo echo de menos entre ellos el Principio de Mínimo Conocimiento, o Ley de Demeter. Pero de eso podremos hablar después.

## Principio de única responsabilidad (Single Responsibility Principle, SRP)

Este principio dice que las clases deberían tener una única razón para cambiar.

Se puede decir que es una aplicación o reformulación del principio de separación de intereses de Dijsktra. Con frecuencia se intenta explicar o resumir diciendo que las clases o los métodos de las clases deberían hacer una sola cosa, aunque ese es un enfoque erróneo. 

El SRP alude a las razones para cambiar el comportamiento de una clase o unidad de software desde el punto de vista de los usuarios de esa clase o unidad. Distintos usuarios podrían requerir en un momento dado distintos tipos de cambios, lo que sería una indicación de que la clase o método está manteniendo muchas responsabilidades. Además, estas responsabilidades pueden verse incluso en un nivel más global desde el punto de visto de los intereses de los *stake holders* del producto de software.

El SRP tiene más que ver con los propósitos del software que con sus aspectos técnicos. No se trata de las tareas discretas que conlleva cualquier función significativa para el dominio, lo que nos podría llevar a diseños muy atomizados con una gran complejidad al tratar de aislar cada una de esas operaciones en una unidad de software.

## Principio abierto/cerrado (Open Close Principle, OCP)

Este principio dice que una clase debe estar cerrada para modificación y abierta para extensión. Fue enunciado por Bertrand Meyer.

La programación orientada a objetos persigue la reutilización del código. No siempre es posible reutilizar el código directamente, porque las necesidades o las tecnologías subyacentes van cambiando, y nos vemos tentadas a modificar ese código para adaptarlo a la nueva situación.

El principio abierto/cerrado nos dice que debemos evitar eso y evitar tocar el código de las clases que ya está terminado y en producción. La razón es que si esas clases están siendo usadas por otras partes del software generamos un riesgo de que el cambio de comportamiento afecte a los resultados obtenidos en esos otros lugares. En otras palabras, generaremos problemas de compatibilidad hacia atrás o *backwards compatibility*, que darán lugar a defectos en el software.

En lugar de eso, usaríamos mecanismos de extensión, como la herencia o la composición, de modo que las clases existentes pueden seguir sirviendo a sus consumidores actuales, mientras que las nuevas clases aprovechan esa funcionalidad a la vez que añaden nueva.

Cuando creamos nuevas clases es importante tener en cuenta este principio para facilitar su extensión en un futuro.

## Principio de sustitución de Liskov (Liskov Substitution Principle, LSP)

En una jerarquía de clases, las clases base y las subclases deben poder intercambiarse sin tener que alterar el código que las utiliza. El enunciado original es de Barbara Liskov.

El principio no dice que tengan que hacer exactamente lo mismo, obviamente, sino que han de poder reemplazarse sin que el código que las usa necesite ser alterado.

El reverso de este principio es que no debemos extender clases mediante herencia por el hecho de aprovechar código de las clases base o por conseguir forzar que una clase sea una "hija de" para superar un *type hinting*. La herencia no consiste en que varias clases compartan funcionalidad, la herencia trata acerca de clases semánticamente equivalentes pero que tienen comportamientos más o menos especializados.

Otro de sus corolarios es que una clase que extienda de otra no puede modificar la interfaz pública respecto de su clase base añadiendo nuevos métodos. Eso es lo que provocará la violación del principio. Si tenemos la necesidad de hacerlo así, es muy posible que estemos necesitando una nueva familia de clases. De hecho, eso nos lleva al siguiente principio: el de Segregación de Interfaces.

## Principio de segregación de interfaces (Interface Segregation Principle, ISP)

El principio de segregación de interfaces puede definirse diciendo que una clase no debería verse obligada a depender de métodos o propiedades que no necesita. Expresado de otra forma: una interfaz sólo debería tener los métodos que sus consumidores necesitan, y ni uno más. 

Supongamos que tenemos una clase con ocho métodos públicos y algunos consumidores de la misma que sólo requieren dos de esos métodos. Si hacemos que dependan directamente de esa clase (de la totalidad de su interfaz pública) los obligamos a cargar con seis métodos que no necesitan. Ahora bien, si definimos una interfaz para esos dos métodos, y hacemos que sea implementada por la clase, la dependencia de los consumidores será a esa nueva interfaz.

Si la clase de la que hablamos sirve a otros consumidores que utilizan otros métodos, podrían definirse nuevas interfaces. La ganancia aquí es que los consumidores sólo dependen de aquellos métodos que usan, lo que nos permitirá cambiar esa dependencia con más facilidad cuando sea necesario.

## Principio de inversión de dependencia (Dependency Inversion Principle, DIP)

El principio de inversión de dependencia dice:

* Los módulos de alto nivel no deben depender de módulos de bajo nivel. Ambos deben depender de abstracciones.
* Las abstracciones no deben depender de detalles, son los detalles los que deben depender de abstracciones.

Las abstracciones definen conceptos que son estables en el tiempo, mientras que los detalles de implementación pueden cambiar con frecuencia. Una interfaz es una abstracción, pero una clase que la implemente de forma concreta es un detalle. Por tanto, cuando una clase necesita usar otra, debemos establecer la dependencia de una interfaz, o lo que es lo mismo, el *type hinting* indica una interfaz no una clase concreta. De ese modo, podremos cambiar la implementación (el detalle) cuando sea necesario sin tener que tocar la clase usuaria lo que, por cierto, contribuye a cumplir el principio abierto/cerrado.

## ¿Por qué SOLID?

Si utilizamos los principios SOLID para diseñar nuestro software orientado a objetos, podemos tener bastantes garantías de que cumplirá las características que mencionamos en el artículo anterior.

Aún así, pienso que tendríamos que añadir el Principio de Mínimo Conocimiento, o Ley de Démeter, para conseguirlo. 

El SRP nos dice que cada unidad de software debe tener una única razón para cambiar, debe ser responsable de un sólo interés (no se puede servir a dos amos).

El OCP nos dice que una clase no debería modificarse, sino extenderse para evitar romper el sistema.

El LSP nos dice que sólo deberíamos usar la herencia para especializar comportamientos en las jerarquías de clases, lo que nos indica cuando nos conviene usar este mecanismo y cuándo es preferible la composición. Esto nos ayuda con el OCP.

El ISP nos dice que las interfaces deben definirse por las necesidades de sus consumidores, lo que entronca con el SRP y nos impulsa a definir interfaces con pocos métodos.

El DIP nos dice que las dependencias deben hacerse sobre abstracciones, lo que nos facilita usar implementaciones alternativas, manteniendo el control sobre cómo deben interactuar.

En este esquema, el Principio de Mínimo Conocimiento nos ayuda a limitar el modo en que las distintas clases se relacionan, al forzar que lo hagan precisamente a través de sus interfaces, ignorando del todo su estructura interna.

En cierto modo, este principio se sobreentiende en SOLID, pero no está de más hacer explícito lo implícito.

Lástima que estropee el acrónimo.
