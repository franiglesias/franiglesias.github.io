---
layout: post
title: Los principios SOLID
categories: articles
tags: oop solid
---

Los principios SOLID son cinco principios en el diseño orientado a objetos compilados por Robert C. Martin.

Se trata de cinco principios que nos proporcionan una guía para crear código que sea reutilizable y se pueda mantener con facilidad. Como tales principios, nos aportan unos criterios con los que evaluar nuestras decisiones de diseño y una guía para avanzar en el trabajo. El código que los respeta es más fácil de reutilizar y mantener que el código que los ignora. Obviamente, no tienen una forma completa de implementarse y, en cada caso, pueden tener una interpretación algo diferente. No son recetas concretas para aplicar ciegamente, sino que requieren de nosotros una reflexión profunda sobre el código que estamos escribiendo.

Los cinco principios son:

* Principio de única responsabilidad (Single Responsibility Principle)
* Principio abierto/cerrado (Open/Closed Principle)
* Principio de sustitución de Liskov (Liskov Substitution Principle)
* Principio de segragación de interfaces (Interface Segregation Principle)
* Principio de inversión de dependencias (Dependency Inversion Principle)

Si eres un desarrollador único o todo-en-uno en tu empresa o proyecto puedes pensar "para qué necesito que mi código sea mantenible o reutilizable si voy a ser yo quién se ocupe de él en el futuro y quién lleva ocupandose durante estos años y que nadie más va a verlo". La respuesta es sencilla: dentro de unos pocos meses vas a ser un programador distinto del que eres ahora. Cuando después de varias semanas trabajando en una parte de tu código te dirijas a otra parte a hacer una modificación tal vez acabes preguntándote qué estúpida razón te llevó a escribir esa función o a crear esa clase y no tendrás respuesta. Sólo por tu salud mental y laboral deberías escribir un código limpio, legible y mantenible. Seguramente tendrás por ahí secciones completas de código que no te atreves a tocar porque no sabes qué puede pasar si lo haces, o partes que se duplican en varios sitios, sabes que tienes código que apesta y que no te atreverías a enseñar. También por eso, por celo profesional, deberías aplicar los principios SOLID.

Los principios SOLID están muy relacionados entre sí, por lo que suele ocurrir que al intentar cumplir uno de ellos estás contribuyendo a cumplir otros.

Vamos a examinarlos en detalle.

## Principio de única responsabilidad

Este principio dice que las clases deberían tener una única razón para cambiar.

Otra forma de decirlo es que las clases deberían hacer una sola cosa. El problema de esta definición, aparentemente más clara, es que puede estrechar demasiado tu visión: no se trata de que las clases tengan sólo un método o algo por el estilo.

En cualquier organización hay secciones o departamentos. Cada uno de ellos puede tener necesidades diferentes con respecto a un asunto. En un colegio, por ejemplo, el profesorado se preocupa de las calificaciones y asistencia de los alumnos, mientras que la administración le interesa saber qué servicios consume el alumno y por cuales debe facturarle, al servicio de comedor o cantina le interesa saber si el alumno va a comer ese día o no, y al servicio de transporte le interesa saber dónde vive. Al diseñar una aplicación para gestionar un colegio nos encontraremos con estas visiones y peticiones desde los distintos servicios.

Si más de un agente puede solicitar cambios en una de nuestras clases, eso es que la clase tiene muchas razones para cambiar y, por lo tanto, mantiene muchas responsabilidades. En consecuencia, será necesario repartir esas responsabilidades entre clases.

## Principio abierto/cerrado

Este principio dice que una clase debe estar cerrada para modificación y abierta para extensión.

La programación orientada a objetos persigue la reutilización del código. No siempre es posible reutilizar el código directamente, porque las necesidades o las tecnologías subyacentes van cambiando, y nos vemos tentados a modificar ese código para adaptarlo a la nueva situación.

El principio abierto/cerrado nos dice que debemos evitar justamente eso y no tocar el código de las clases que ya está terminado. La razón es que si esas clases están siendo usadas en otra parte (del mismo proyecto o de otros) estaremos alterando su comportamiento y provocando efectos indeseados. En lugar de eso, usaríamos mecanismos de extensión, como la herencia o la composición, para utilizar esas clases a la vez que modificamos su comportamiento.

Cuando creamos nuevas clases es importante tener en cuenta este principio para facilitar su extensión en un futuro.

## Principio de sustitución de Liskov

En una jerarquía de clases, las clases base y las subclases deben poder intercambiarse sin tener que alterar el código que las utiliza.

Esto no quiere decir que tengan que hacer exactamente lo mismo, sino que han de poder reemplazarse.

El reverso de este principio es que no debemos extender clases mediante herencia por el hecho de aprovechar código de las clases bases o por conseguir forzar que una clase sea una "hija de" y superar un <em>type hinting</em> si no existe una relación que justifique la herencia (ser clases con el mismo tipo de comportamiento, pero que lo realizan de manera diferente). En ese caso, es preferible basar el polimorfismo en una interfaz (ver el Principio de segregación de interfaces).

## Principio de segregación de interfaces

El principio de segregación de interfaces puede definirse diciendo que una clase no debería verse obligada a depender de métodos o propiedades que no necesita.

Supongamos una clase que debe extender otra clase base. En realidad, nuestra clase sólo está interesada en dos métodos de la clase base, mientras que el resto de métodos no los necesita para nada. Si extendemos la clase base mediante herencia arrastramos un montón de métodos que nuestra clase no debería tener.

Otra forma de verlo es decir que las interfaces se han de definir a partir de las necesidades de la clase cliente.

## Principio de inversión de dependencia

[La inversión de dependencias no es sólo lo que tú piensas](http://blog.koalite.com/2015/04/la-inversion-de-dependencias-no-es-solo-lo-que-tu-piensas/)

El principio de inversión de dependencia dice que:

* Los módulos de alto nivel no deben depender de módulos de bajo nivel. Ambos deben depender de abstracciones.
* Las abstracciones no deben depender de detalles, son los detalles los que deben depender de abstracciones.

Las abstracciones definen conceptos que son estables en el tiempo, mientras que los detalles de implementación pueden cambiar con frecuencia. Una interfaz es una abstracción, pero una clase que la implemente de forma concreta es un detalle. Por tanto, cuando una clase necesita usar otra, debemos establecer la dependencia de una interfaz, o lo que es lo mismo, el type hinting indica una interfaz no una clase concreta. De ese modo, podremos cambiar la implementación (el detalle) cuando sea necesario sin tener que tocar la clase usuaria lo que, por cierto, contribuye a cumplir el principio abierto/cerrado.
