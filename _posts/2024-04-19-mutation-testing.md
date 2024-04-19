---
layout: post
title: Mutation Testing
categories: articles
tags: testing
---


Mutation testing es una técnica que sirve para analizar la capacidad de una suite de tests para reaccionar ante cambios no deseados del comportamiento del sistema. 

## Como funciona mutation testing

A grandes rasgos, _mutation testing_ consiste en modificar de una forma deliberada, específica y localizada el código de una aplicación y ejecutar la suite de tests a continuación para comprobar si es sensible al cambio introducido y falla algún test.

A esa versión alterada la llamamos _mutante_. Es muy importante entender que se aplica un cambio en una sola línea de todo el código cada vez. Esto es así porque queremos evitar que dos mutaciones que tengan un efecto opuesto se lleguen a anular mutuamente.

Si consideramos este código:

```php
function incrementScore(int $score): int {
    if ($score > 10) {
        $score = $score + 2;
    } else {
        $score = $score + 1;
    }
    return $score;
}
```
Podríamos aplicar varias mutaciones. Por ejemplo, cambiar en la condición el operador de comparación `>` por '>='.

```php
function incrementScore(int $score): int {
    if ($score >= 10) {
        $score = $score + 2;
    } else {
        $score = $score + 1;
    }
    return $score;
}
```

En el código original si `$score` es `10` el flujo va por la rama `else`. Por tanto, al salir de la condicional, `$score` debería contener `11`. Si aplicamos la mutación, `$score` contendrá `12`.

En el mejor escenario nuestra suite de tests contendrá al menos uno capaz de fallar al esperar precisamente que si `$score` es `10` aumentará a `11`, detectando el cambio aplicado, pues devolverá `12`.

```php
assertEquals(11, incrementScore(10));
```

En la terminología de _mutation testing_, hemos matado (_Killed_) un mutante, con lo que la suite de tests es sólida para esa situación en particular. Si por error, accidente o un mal entendimiento de las reglas de negocio, cambiásemos esa condicional, tendremos tests que nos protegen.

El problema viene si tras aplicar la mutación ningún test ha fallado. En ese caso decimos que el mutante ha sobrevivido (_Survived_) o bien que no está cubierto (_Uncovered_). Como señalamos antes, si no hay tests que ejerciten la parte de código de nuestro interés es imposible detectar los cambios. Por otro lado, puede haber tests ejercitando esa parte de código, pero al no testear los casos adecuados no detectaríamos la mutación.

Por ejemplo, estos dos tests no reaccionarían antes esta mutación y eso que entre ambos se ejecuta todo el código:

```php
assertEquals(9, incrementScore(8));
assertEquals(17, incrementScore(15));
```

Como puedes imaginar, realizar este proceso manualmente es inviable, por lo que necesitamos recurrir a algún sistema que automatice la localización de elementos mutables en el código, la introducción de cambios y la ejecución de la suite de test completa tras cada uno de ellos. 

Las librerías de _mutation testing_, como _infection_ (PHP), automatizan el proceso de aplicar una serie de mutaciones a nuestro código y analizan los resultados obtenidos. Estos resultados pueden resumirse en una métrica llamada MSI (_Mutation Score Indicator_). Aquí tenemos un ejemplo:

```
6311 mutations were generated:
    3018 mutants were killed
       0 mutants were configured to be ignored
     837 mutants were not covered by tests
    2407 covered mutants were not detected
      47 errors were encountered
       0 syntax errors were encountered
       2 time outs were encountered
       0 mutants required more time than configured

Metrics:
         Mutation Score Indicator (MSI): 48%
         Mutation Code Coverage: 86%
         Covered Code MSI: 56%
```

En este informe resumen en el que podemos ver que el índice MSI es del 48% lo que indica que la suite de test actual mata o detecta menos de la mitad de los mutantes aplicados. Si vamos al detalle, vemos que 837 mutaciones no tenían cobertura de tests indicando que hay una parte del código que nunca es ejercitada. Por otro lado, 2407 mutaciones no fueron detectadas por los tests que las ejercitaron. En total 3244 mutaciones no fueron detectadas por nuestra suite de test.

Junto a este resumen, se puede generar un informe en formato HTML que nos permite explorar las mutaciones aplicadas a cada línea de código mediante el cual podemos hacernos una idea más precisa de cómo intervenir.

Piensa que por cada mutación que no es detectada por nuestros tests, hay una oportunidad para que aparezca un bug en producción.

## ¿Qué mutaciones se aplican? ¿Son todas necesarias?

Existe un [catálogo de mutaciones](https://infection.github.io/guide/mutators.html) y es posible configurar `infection` para aplicar solo un subconjunto. Es difícil dar una recomendación al respecto, ya que cada proyecto puede tener problemas más o menos acusados dependiendo de muchas razones, incluyendo el tipo de dominio, el paradigma de programación, estilos, etc.

Como regla general, creo que si te interesa realizar el análisis de mutation test en un proyecto, lo mejor es empezar aplicando las mutaciones estándar. Ten presente que el proceso puede llevar mucho tiempo y consumir muchos recursos.

Una vez ejecutado, utiliza los informes generados para entender los problemas y decide qué partes del código consideras más críticas para intervenir en ellas. Diría que el código relativo al dominio y reglas de negocio es la que más riesgo supone y donde podemos obtener beneficios más rápidamente.

## Elevar el MSI

Para elevar el MSI la respuesta obvia es incluir nuevos tests que capturen las mutaciones. Sin embargo, también tenemos una respuesta más sutil: refactorizar de tal modo que sea más difícil introducir mutaciones.

### Mutantes no cubiertos por tests

Cuando el código no está cubierto por tests se podrá aplicar cualquier mutación y no será detectada. Tenemos que añadir tests que ejerciten el código no cubierto. Como es obvio esto reducirá el número de mutantes no cubierto, aunque puede aumentar el número de mutantes no detectados si los tests no fuesen suficientes.

En todo caso, lo interesante es conseguir aumentar el total de mutantes detectados. Se puede obtener una mejora bastante rápida del MSI atacando esta carencia, ya que al introducir al menos un test se detectarán como mínimo una de las mutaciones.

### Mutantes no detectados

Esto puede ser más o menos fácil de conseguir y requiere entender bien qué es y cómo se aplica el concepto de mutación, así como entender bien qué se está testeando en cada caso. Si vamos al ejemplo anterior:

```php
function incrementScore(int $score): int {
    if ($score > 10) {
        $score = $score + 2;
    } else {
        $score = $score + 1;
    }
    return $score;
}
```

Es relativamente fácil ver que deberíamos tener al menos tres tests:

* `$score > 10 (11 -> 13)`: prueba el flujo si la condición se cumple.
* `$score = 10 (10 -> 11)`: prueba el flujo en el valor crítico de la comparación. Este test anula la mutación `> -> >=` porque fija un comportamiento para la igualdad.
* `$score < 10 (9 -> 10)`: prueba el flujo si la condición no se cumple.


```php
assertEquals(9, incrementScore(8));
assertEquals(11, incrementScore(10));
assertEquals(17, incrementScore(15));
```

Si el mutante no es detectado, es porque no tenemos el test `$score = 10 (10 -> 11)`. Es decir, el valor crítico de esta condicional debería ser cubierto explícitamente por un test.

```php
assertEquals(11, incrementScore(10));
```

Con los tres tests anteriores nos protegemos de las mutaciones que alteran la comparación. Eso incluiría otras mutaciones como invertir la condicional.

Una forma de abordar la eliminación de mutaciones es introducir manualmente la mutación en el código de producción y añadir un test que falle, pero que no falle con el código original.

## ¿Es posible prevenir las mutaciones desde el propio código?

Podríamos considerar las mutaciones como puntos posibles aparición de defecto al escribir el código. Dicho de otra forma: si es posible aplicar una mutación, es que es posible introducir, conscientemente o no, un error. Por ejemplo, una mala interpretación de una regla de negocio podría hacernos cambiar una condicional de `>` a `>=`. Si tenemos tests que prevengan esa mutación, nos alertarán del cambio y nos dará la oportunidad de reconsiderarlo.

Ahora bien, hay casos en los que podemos actuar desde el propio código, evitando que ciertas mutaciones puedan producirse.

Por ejemplo, las mutaciones `PublicVisibility` y `ProtectedVisibility` cambian la visibilidad de los métodos a una más restrictiva. Si las mutaciones no son detectadas por los tests, significa que la visibilidad está mal ajustada y que la API de esos objetos está exponiendo más métodos de los necesarios. Es ese caso, es mucho mejor reajustar la visibilidad de modo tal que solo se expongan los métodos necesarios y dejes todos los demás en privado, y reservar la marca de protegidos a los métodos que quieres accesibles a una jerarquía de clases.

¿Es posible escribir código de forma que no se pueda mutar? En general, aplicar principios de diseño de software y patrones puede llevarnos a un código que permite menos espacio para las mutaciones.

Por ejemplo, el refactor a polimorfismo puede reducir muchas estructuras condicionales a una sola, que reside en una factoría. Esto evitará que se puedan aplicar varias mutaciones, y además simplifica la escritura de los tests.

Otro ejemplo puede ser eliminar las estructuras `if/else` o aplanar condicionales anidadas. Igualmente, el efecto es que se reducen los puntos en los que pueden introducirse mutaciones y también sus efectos en cascada.

## Anti patrones de tests que afectan al MSI

Al analizar una suite con mutation testing y tratar de intervenir en ella para mejorar los índices nos podemos encontrar con varios anti-patrones que afectan directamente a nuestra capacidad de intervenir en el MSI y mejorarlo.

Como normal general, cuando más simple y directo sea un test, no solo será más fácil de escribir, sino que será más fácil prevenir mutaciones específicas.

### Valores aleatorios en los inputs

Los valores aleatorios en los inputs son un arma de doble filo. Sobre el papel, puede parecer que nos garantizan que en el largo plazo se cubren todos los casos necesarios. Pero, por otro lado, hacen que sea imposible determinar qué flujo de ejecución sigue un test en concreto. Siguiendo con el ejemplo anterior, si los valores de `$score` son aleatorios, el valor crítico `10` solo se probará algunas veces, dependiendo del rango de valores que hayamos permitido. Por tanto, la mutación a veces se detectará, a veces no, y tendremos resultados de MSI distintos cada vez.

Debemos asegurarnos de que controlamos los valores de los tests, y reemplazar los valores aleatorios por valores escogidos mediante técnicas como [equivalence class partitioning, boundary value analysis o decision table](https://franiglesias.github.io/how-to-select-test-cases/).

**¿Cómo afecta al MSI?** Los tests pueden ejecutar o no los fragmentos de código mutado, por lo cual, no sabemos si una mutación específica se detectará en una ejecución concreta del análisis. El análisis nos dará distintas métricas en distintas ejecuciones. Pero es que además puede que nos oculte mutaciones significativas y no llegamos a verlas.

### Expectativas calculadas

Los tests en los que calculamos las expectativas en lugar de poner ejemplos son engañosos. En algunos casos, estos tests se hacen así bien porque el output es complejo, bien porque no controlamos los valores de entrada como ocurre cuando los valores son aleatorios. Al introducir lógica en el propio test, no podemos diferenciar fácilmente entre el efecto provocado por el código, que es lo que estamos intentando observar, y el efecto provocado por la lógica de cálculo de la expectativa.

En consecuencia, deberíamos usar ejemplos de valores esperados en lugar de calcularlos.

**¿Cómo afecta al MSI?** La lógica del test puede enmascarar el comportamiento de la unidad bajo test.

### Tests tautológicos

En algunos casos, los valores de expectativa se calculan con la misma lógica o muy similar a la que el test pretende analizar. Esto es básicamente un test tautológico: la lógica del test se prueba a sí misma. En algunos casos estos tests se pueden suprimir porque prueban lógica irrelevante, como cuando se chequea que un constructor ha asignado bien las propiedades de un objeto.

De nuevo, usar ejemplos de valores esperados es una de las soluciones para este problema, ya que así evitamos tener esa lógica.

**¿Cómo afecta al MSI?** La discrepancia entre ambas lógicas introducida por la mutación (la de producción y la que genera la expectativa en el test) debería manifestarse con el fallo del test. Sin embargo, esto hace difícil mantener el test y puede enmascarar algunas mutaciones.

### Tests sobre estado

Es frecuente hacer tests que verifican el estado de un objeto, sin embargo, en OOP este tipo de test no es adecuado. En general, los tests deberían verificar únicamente comportamiento. El comportamiento se manifiesta en forma de respuestas que nos devuelve el objeto, o bien de efectos que se producen en algún punto del sistema.

Una posible solución es asegurarse de que merece la pena mantener ese test. Por ejemplo, es el caso de los tests que prueban constructores. En realidad estos no tienen ningún valor. Los constructores deberían limitarse solo a asignar el estado inicial de los objetos y nosotros deberíamos estar probando comportamiento. Si el objeto estuviese mal construído, se tendría que manifestar en otro test que verifique un comportamiento esperado a partir de un estado inicial conocido. Si se trata de un DTO, el test debería verificar un flujo de ejecución que implique ese DTO en lugar de controlar sus valores.

**¿Cómo afecta al MSI?** Los tests sobre estado podrían verse afectados por cambios que sean irrelevantes para los comportamientos de un objeto. Esto hace que nos afecten más mutaciones de las que nos interesan.

## Conclusiones

_Mutation testing_ es una herramienta más de la que podemos valernos para analizar la calidad de nuestros tests. Usarla puede ser útil cuando tenemos mucha cobertura de tests, pero observamos alguno de estos síntomas:

* Tenemos bastantes bugs en producción que podrían haberse detectado en un test
* Cuando hacemos cambios arbitrarios en algún punto del código, pero ningún test falla

Si no tenemos mucha cobertura de tests, _Mutation testing_ no nos va a dar información útil, así que habrá que priorizar introducir tests hasta alcanzar una cobertura alta (75% o mejor).

Por otro lado, si desarrollas usando TDD es bastante posible que _Mutation testing_ tampoco te aporte mucho valor, dado que TDD suele ayudar a escribir un buen número de tests, evitando esas zonas oscuras que _Mutation testing_ puede iluminar.

Por otro lado, el coste del análisis es bastante alto, incluso para pequeñas muestras de archivos, por lo que no parece práctico ejecutarlo con mucha frecuencia.

