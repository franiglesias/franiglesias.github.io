---
layout: post
title: La dualidad del testing
categories: articles
tags: good-practices testing
---

Para ser una disciplina dedicada a que el software se comporte correctamente, lo cierto es que cuando hablamos de testing usamos el lenguaje con muy poca precisión.

Y eso suele significar que el mapa conceptual del testing está desorganizado, con los conceptos poco articulados y vacíos importantes entre ellos.

Sin ir más lejos, la propia palabra testing en realidad designaría dos disciplinas. Complementarias y superpuestas, sí, pero diferentes.

## Separación de intereses

Por lo general asociamos testing con Control de Calidad (Quality Assurance o QA). Pero en realidad, tenemos dos usos de los tests que sirven a propósitos diferentes, en diferentes momentos del proceso de desarrollo y que son manejados por diferentes profesionales.

Por una parte tenemos el testing como definición de cuál debe ser el comportamiento del software. Es decir, el **test como especificación**. Y, como tal, es una herramienta de desarrollo.

Por otra parte está el **testing como control de calidad del software**, es decir, la forma en que verificamos que no tiene defectos y funciona correctamente. Eso incluye que la especificación se cumple, pero también se refiere cosas y a más formas de comprobarlas.

El testing como especificación y el testing como control de calidad, son dos cuestiones diferentes pero complementarias y que se solapan.

Por ejemplo. Cuando decimos que un programa, una clase o un método, debe tener cierto comportamiento, pensamos en que debe resolver ciertos casos de prueba según se ha especificado.

Esta especificación se puede definir en forma de test, que al ser escrito en un lenguaje de programación, constituye una definición formal y operativa de ese comportamiento. 

Una vez que tenemos el test, es posible escribir un programa que lo cumpla. Y si se cumple el test, estamos en condiciones de afirmar que se ha satisfecho la especificación y, en consecuencia, es que se ha implementado el comportamiento deseado.

Pero este test no garantiza que el software haya sido creado sin defectos ya que, o bien no se ha definido una especificación correcta o bien no se han tenido en cuenta una serie de circunstancias que podrían afectar durante su ejecución aunque la especificación se cumpla.

Por ejemplo, imagina un programa que calcula la factura del consumo de agua, introduciendo lecturas del contador. Pero imagina que no se ha tenido en cuenta la posibilidad de que se introduzcan valores negativos pues se supone los contadores no los van a proporcionar. Esto es, podría cumplir con la especificación y, sin embargo, tener defectos.

Estos defectos son los que se intentan controlar con los tests de QA, junto con el hecho de que el software cumpla las especificaciones.

Según esto, podríamos pensar que QA engloba de algún modo los tests de desarrollo, pero no es así. Es más bien una intersección que permite que los tests de desarrollo, o parte de ellos, se puedan usar como tests de QA. De hecho, un test de desarrollo se convierte automáticamente en un test de regresión, que es un test de QA, una vez que hemos establecido que se cumple por parte del software.

Si sigues una metodología TDD escribirás muchos tests que para QA sobran porque son redundantes. De hecho, en el proceso de desarrollo TDD los irías eliminando en las fases de refactor y al terminar.

Por otro lado, si sigues una metodología BDD (Behavior Driven Development) esta distinción puede ser aún más acusada, porque los tests BDD definen las *features* de un software desde una perspectiva de negocio, pero no se ocupan de sus detalles técnicos que deben ser cubiertos por otras pruebas.

Dicho de otra forma. En QA y en desarrollo utilizamos herramientas similares, los tests, pero con intereses diferentes y priorizando necesidades distintas:

* En desarrollo los tests son especificaciones del comportamiento del software, y nuestro objetivo es cumplirlas para, así, resolver un problema de negocio.
* En QA los tests actúan, además, como monitores de que el funcionamiento del software es correcto y está libre de defectos.



