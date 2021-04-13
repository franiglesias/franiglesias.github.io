---
layout: post
title: El falso dilema. Calidad versus velocidad
categories: articles
tags: misc good-practices
---

De vez en cuando me encuentro con artículos o comentarios que mencionan la idea de que, a veces, tenemos que aparcar las buenas prácticas al programar en aras a cumplir un plazo de entrega o salir a producción.

La primera víctima suelen ser los tests, ya que no hay tiempo para hacerlos. En parte, porque ese código está muy acoplado y dificulta la creación de los tests que lo verifiquen.

La segunda víctima suele ser la capacidad de extensión futura del código, porque con frecuencia se introducen dependencias ocultas, se tira por el camino fácil de aprovechar características del framework, o dejamos que el acoplamiento se haga demasiado estrecho.

Otra víctima suele ser la expresividad. Si no hay tiempo para nada, menos aún para buscar buenos nombres o para extraer métodos o variables que simplifiquen la comprensión. Las condicionales se introducen para tratar cualquier caso raro que vaya apareciendo y si hace falta introducir niveles de indentación se hace también.

Y también sufre la confianza: desplegamos ese código con los dedos cruzados.

## Cuando rapidez es lentitud

El problema es que, por contra-intuitivo que parezca, reducir las buenas prácticas no acelera el desarrollo. De hecho, puede ralentizarlo.

Pensemos, por ejemplo, en la falta de tests. Estos, si se hacen a posteriori, nos pueden ayudar a prevenir defectos y a asegurar que el código cumple los requisitos y que se proporciona la funcionalidad. Además, teniendo tests que garanticen el comportamiento, podríamos refactorizar a un mejor diseño con seguridad.

Sin embargo, si no tenemos tests es más probable que aparezcan defectos y, peor aún, que estos puedan llegar a producción. Por otro lado, al no tener tests, cualquier cambio que tengamos que hacer, incluso para corregir los defectos que vayamos encontrando, será más difícil de aplicar, generando más oportunidades de que se produzcan nuevos defectos. El resultado es que dedicamos más tiempo a depuración y arreglo de errores, incluso después de la puesta en producción.

Si el código es difícil de extender, cuando necesitemos incorporar nueva funcionalidad, será necesario modificar el código existente, lo que puede generar problemas en distintos lugares. Por ejemplo, si retocamos el comportamiento de una clase, puede que afectemos a otra sección que dependa de ella. Este tipo de defectos suele ser difícil de depurar y de arreglar. De nuevo, más tiempo.

Obviamente, si el código es, en general, difícil de leer y de entender, será complicado intervenir en él. Hará falta un proceso de refactor para poder realizar los cambios necesarios y, en muchos casos, será necesario incluso reescribir secciones.

## Qué es calidad de código

En algún artículo anterior mencioné que, si bien es difícil definir lo que es buen código, resulta bastante fácil identificar el mal código. O no. A veces depende del contexto.

Voy a poner un ejemplo muy extremo. Supongamos que nos piden escribir un código de un MVP para sumar 2 y 2. ¿Cuál de estas opciones es mejor?

¿Esta?

```ruby
def add
  2 + 2
end

puts(add)
```

¿Esta?

```ruby
def add(a)
  a + a
end

puts(add 2)
```

¿O esta?

```ruby
def add(a, b)
  a + b
end

puts(add 2 2)
```

Aparentemente es mejor opción la tercera, puesto que es más general, ¿no? Pues puede que sí y puede que no.

Las tres opciones nos permiten sumar 2 y 2. La segunda nos permite indicar el número que querríamos sumar dos veces. La tercera nos permite sumar cualquier par de números. Parece la mejor. Sin embargo, oculta un problema.

La siguiente feature nos dice que los *stakeholders* no querían realmente sumar números, sino obtener el doble de cualquier número. Aparte de tener que cambiar el nombre de la función para representar el cambio del concepto del dominio vemos que la primera opción no nos sirve por inflexible, mientras que la tercera opción no nos sirve porque hicimos una generalización prematura que nos llevó a escoger la abstracción equivocada.

Descartada la primera opción por demasiado específica, la segunda solo necesita cambiar el nombre y el comportamiento se mantiene.

```ruby
def double(a)
  a + a
end

puts(double 7)
```

De hecho, esta segunda opción hubiera podido surgir de forma natural como refactor de la primera:

```ruby
def double
  2 + 2
end

puts(double)
```

Extraemos el parámetro y le ponemos un valor por defecto, por lo que los consumidores no tendrían que cambiar:

```ruby
def double(a = 2)
  a + a
end

puts(double)
```

Por su parte la tercera opción requiere, además, que prescindamos de un parámetro y modifiquemos el comportamiento:

```ruby
def double(a, b)
  a + b
end

puts(double 7 7)
```

Modificamos el comportamiento, sin cambiar la signatura para no romper la dependencia en los consumidores

```ruby
def double(a, b)
  a + a
end

puts(double 7 7)
```

Eliminamos la dependencia del parámetro, de modo que tendríamos que cambiar a todos los consumidores.

```ruby
def double(a)
  a + a
end

puts(double 7)
```

La segunda opción ha resultado la mejor opción. La primera, no siendo buena, es menos costosa de adaptar que la tercera a los nuevos requisitos. Y la tercera, es la más problemática y costosa de las tres.

Ahora imagínate lo mismo para una *feature* más realista y, por tanto, más compleja.

La calidad del código es algo que hay que valorar en contexto. Hay código que es objetivamente malo. Copio de un [artículo anterior](/beyond-solid/). El código de mala calidad:

* No hace lo que se espera que haga, o lo hace de forma manifiestamente incompleta o equivocada.
* Tiene múltiples fallos y problemas, no funciona si alguna condición externa es adversa.
* No es reutilizable.
* No está bien organizado. Encontrar algo en él es un esfuerzo enorme, que lleva a multitud de vías muertas o a descubrir que una misma idea es expresada en diferentes lugares, diseminada en múltiples sitios e incluso ausente.
* No es testeable. Hay que hacer un gran esfuerzo solo para poder empezar a hacer un test, incluyendo tener que transformar el código para hacerlo posible.
* No es legible. No es posible entender qué hace solo con leer el código, hay que buscar otras fuentes de información para hacerse una idea de lo que estaría ocurriendo, incluso aunque exista documentación o comentarios, porque ya han perdido la sincronía con el código.
* No es sostenible. Llevar a cabo una modificación es peligroso porque puede resultar incompleta o tener efectos en lugares insospechados.
 
Pero luego hay código que *parece bueno*, y sin embargo tiene efectos perjudiciales como acabamos de ver.

## Un problema evitable

Este problema ocurre con cierta frecuencia en muchos proyectos en los que se desarrollan generalizaciones *por si acaso*, o porque es *obvio* que en algún momento nos las pedirán. Sin embargo, es un tipo de problemas que se puede prevenir precisamente con buenas prácticas ágiles.

Por ejemplo, usando TDD es muy posible que nos hubiésemos decantado por la primera de las opciones, ya que no tendríamos más ejemplos que nos forzasen a mover el desarrollo. Es posible que, al tener un primer test pasando nos planteásemos una generalización capaz de llevarnos al ejemplo:

```ruby
def double(a = 2)
  a + a
end
```

De tal modo, que al trabajar en la siguiente iteración, realmente no necesitaríamos hacer nada. Puede que, en todo caso, optimizar o mejorar la implementación para hacerla más coherente:

```ruby
def double(a = 2)
  a * 2
end
```

Y si no hubiésemos hecho el *refactor*, podríamos haberlo hecho antes de implementar la nueva *feature*, protegidas como estábamos por los tests.

Otras buenas prácticas, como respetar el principio YAGNI (no lo vas a necesitar), nos evitarían intentar generalizar demasiado antes de tener más información.

## La lentitud veloz

Este ejemplo pone de relieve la paradoja de que usando buenas prácticas realmente vamos más rápido. Las buenas prácticas nos ayudan, entre otras cosas, a delimitar correctamente hasta dónde tenemos que llegar. Y como beneficio extra, probablemente no tendremos que deshacer camino cuando cambie el negocio.

También resulta paradójico que el código malo sea bastante complicado en realidad. Nos parece que necesitamos todo el tiempo disponible para escribirlo porque, de hecho, utilizamos todo el tiempo disponible. De lo que se deduce que "no quedaría" espacio para buenas prácticas. 

En realidad no es lentitud ni rapidez. No se puede hablar de una velocidad de desarrollo que puedas alcanzar por un simple esfuerzo de voluntad, ya que poder desarrollar una cierta *feature* depende de varios factores, como son la información proporcionada, nuestro conocimiento y el estado del código en el que la vamos a introducir.

Parte de lo que nos lleva a esto es pensar que nuestro trabajo es escribir código, cuando en realidad nuestro trabajo consiste en resolver un problema, eventualmente escribiendo código.
