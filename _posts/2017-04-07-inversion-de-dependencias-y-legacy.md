---
layout: post
title: Inversión de dependencias y legacy
categories: articles
tags: coding dependency-inversion legacy
---

He aquí una estrategias sencilla para reescribir una clase legacy de manera ordenada, aplicando el principio de Inversión de Dependencia.

Supongamos que tienes una clase en tu Legacy que proporciona un servicio determinado. Al fin y al cabo, el código Legacy "funciona", aunque a veces no sepas ni cómo es posible que todavía funcione, pero esa es otra historia. Voy a llamarla **LegacyService**.

Ahora supongamos que quieres hacer uso de la funcionalidad de **LegacyService** en alguna otra parte de tu código. La voy a llamar **Consumer**.

La primera tentación puede ser usarla directamente y pasar **LegacyService** como dependencia a Consumer. ¡MAL!

## Define una interfaz

Lo primero es definir una interfaz conforme a las necesidades de Consumer y que esté en consonancia con los requisitos y principios que rijan tu nuevo diseño. Da igual si la interfaz pública de **LegacyService** encaja en ello o no porque no la queremos usar directamente y que nos condicione cosas en el futuro.

A lo mejor la nueva interfaz coincide con la de **LegacyService** o no se parece en nada. No importa. Lo que queremos es depender de abstracciones ([Principio de Inversión de Dependencia](https://talkingbit.wordpress.com/2016/11/29/los-principios-solid/)) y **LegacyService** en nuestro nuevo código no es más que una implementación concreta de una funcionalidad que vamos a expresar mediante una interfaz. Supongamos que a esa interfaz la llamamos **ServiceNewInterface**.

Ahora debes hacer que **Consumer** tome como dependencia un objeto que implemente **ServiceNewInterface**. Ahora **Consumer** depende de una abstracción y no de una implementación específica.

Una nueva tentación: reescribir la clase para implemente **ServiceNewInterface**. ¡MAL! Aunque tengamos acceso al código deberíamos tratarlo como una biblioteca y no tocarlo. Pero, ¿cómo modificar una clase sin tocarla?

## Escribe un Adaptador (Adapter)

Una adaptador es una clase que nos sirve para que un objeto cumpla una interfaz diferente a la que tiene. No tenemos que tocar la clase original para nada.

Lo que hacemos primero es crear una nueva clase (la llamaré **ServiceAdapter**) que deberá implementar la interfaz definida, **ServiceNewInterface.** Usa un enfoque TDD o BDD para tener tests.

**ServiceAdapter** tomará **LegacyService** como dependencia (mediante constructor injection, es decir, la pasamos en el constructor) y lo utilizará para implementar los métodos exigidos por la interfaz **ServiceNewInterface**. Para ello habrá que transformar los argumentos que se les pasan para que puedan ser usados por **LegacyService** y transformar el resultado generado si fuese necesario.

Al construir **Consumer**, bien sea directamente, bien en un contenedor de inyección de dependencias, le pasamos el objeto **ServiceAdapter** que cumple **ServiceNewInterface**. Con esto **LegacyService** sigue haciendo su función sin contaminar el código nuevo y, sobre todo, sin depender de esa clase concreta.

## ¿Algo más?

Con lo anterior ya has dado un paso de gigante. Tanto **Consumer** como **ServiceAdapter** son estables en aislamiento. **ServiceAdapter** tiene la dependencia de **LegacyService**, pero ya no es una situación crítica, ya que estás en disposición de construir nuevos Services que implementen **ServiceNewInterface** y puedan sustituir a **LegacyService**, o bien, puedes reescribir **LegacyService**.

Ahora quedan varias opciones.

### Crea otros Services que implementen ServiceNewInterface

Ahora puedes simplemente escribir desde cero nuevos Services implementando la interfaz ServiceNewInterface, ya sea desde cero, ya sea como adaptadores de otras bibliotecas o código que te sirva para la misma tarea.

### Refactoring de LegacyService

Otra opción, si piensas que merece la pena, es reescribir **LegacyService**.

Lo cierto es que ahora puedes testear la funcionalidad de **LegacyService** a través de su **ServiceAdapter** y reescribirla a partir de ahí. Con esta red de seguridad puedes comenzar con un refactoring que te ayude a limpiar el código de smells, dependencias innecesarias, etc.

### Refactoring de ServiceAdapter

Otra opción es refactorizar **ServiceAdapter** para que no dependa de **LegacyService** moviendo el código de **LegacyService** a **ServiceAdapter**. Sería una extracción. Ahora tienes la protección necesaria para hacerlo sin romper nada.

Supongamos el típico caso de que la funcionalidad usada de **LegacyService** es sólo una parte de la misma porque la clase tiene varias responsabilidades y tú solo tienes interés en una de ellas.

Se trataría entonces de mover el código de **LegacyService** a la clase **ServiceAdapter**, asegurándote de que no se rompen los tests de esta última clase. Una vez que hayas trasladado la funcionalidad necesaria, puedes prescindir de **LegacyService** y el resto del código no se habrá enterado de nada.