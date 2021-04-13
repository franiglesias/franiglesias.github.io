---
layout: post
title: La elección de los casos para testear
categories: articles
tags: php testing good-practices
---
Aprovechando que estoy preparando material para organizar formaciones en testing, dejo aquí este resumen de técnicas básicas para seleccionar casos para probar.

¿Qué casos y cuántos casos deberíamos testear? Cuando vamos a realizar un test se nos plantea el problema de la elección de los casos que vamos a probar. En algunos problemas, los casos serán limitados y sería posible y rentable probarlos todos. En otros, tenemos que probar diversos parámetros que varían de manera independiente en proporción geométrica. En otros problemas, el rango de casos posible es infinito.

Entonces, ¿cómo seleccionar los casos y asegurarnos de que cubrimos todos los necesarios?

Para ello podemos usar diferentes técnicas, más allá de nuestra intuición basada en la experiencia o en las especificaciones del dominio. Estas técnicas se agrupan en dos familias principales:

* **Tests de caja negra (black box)**: se basan en considerar la pieza de software que vamos a testear como una caja negra de la que desconocemos su funcionamiento. Sólo sabemos con qué datos podemos alimentarla y la respuesta que podemos obtener.
* **Tests de caja blanca (white box)**: en este caso tenemos acceso al código y, por tanto, podemos basarnos en su flujo para decidir los casos de tests.

### Tests de caja negra

#### Valores únicos

Si el número de casos es manejable podemos probar todos esos casos, más uno extra que represente los casos no válidos.

Supongamos un sistema de códigos de promoción que tiene los siguientes tres códigos. Queremos una función que devuelva el valor del código de promoción.

| Código | Valor |
|:------:|:-----:|
| COOL   |  10   |
| SUPER  |  30   |
| GREAT  |  20   |

¿Qué valores debemos probar? Pues los tres valores válidos o posibles del código y un valor que no sea válido. Además, en este caso, podríamos probar que no haya valor.

| Código | Valor |
|:------:|:-----:|
| COOL   |  10   |
| SUPER  |  30   |
| GREAT  |  20   |
| BUUUU  |  0    |
|        |  0    |

Cuando el número de casos crece, podemos recurrir a diversas técnicas:

#### Equivalence Class Partitioning (Partición en clases de equivalencia)

Supongamos que tenemos una función que puede aceptar, potencialmente, infinitos valores. Por supuesto, es imposible probarlos todos. 

Equivalence Class Partitioning es una estrategia de selección de casos que se basa en el hecho de que esos infinitos valores pueden agruparse según algún criterio. Todos los casos en un mismo grupo o clase son equivalentes entre sí a los efectos del test, de modo que nos basta escoger uno de cada clase para probar.

Algunos de estos criterios pueden venir definidos por las especificaciones o reglas de negocio. Veamos un ejemplo:

Supongamos una tienda online que haga descuentos en función de la cantidad de unidades adquirida. Para 10 ó más unidades, el descuento es del 10%; para 50 ó más unidades, el descuento es del 15%, y para 100 ó más unidades el descuento es del 20%.

Una función para calcular el descuento tendría que tomar valores de números de unidades y devolver un porcentaje. Esto se puede representar así gráficamente:

```
0    10                  50                      100
|----|----|----|----|----|----|----|----|----|----|----|----|----|----|----|
  0 ][         10%       ][          15%         ][           20%   
```

En el gráfico se puede ver fácilmente que todos los valores que sean menores que 10 no tendrán descuento (0%), los valores desde 10 a 49 tendrán un descuento del 10%, los valores del 50 al 99, del 15% y los valores del 100 en adelante, del 20%. Nos basta escoger un valor cualquier de esos intervalos para hacer el test:

| Intervalo | Valor a probar | Resultado |
|:---------:|:--------------:|:---------:|
|    0-9    |        5       |    0%     |
|   10-49   |       20       |   10%     | 
|   50-99   |       75       |   15%     |
|   100+    |      120       |   20%     |

#### Boundary Value Analysis (Análisis de valor de límite)

Aunque la metodología anterior es perfectamente válida se nos plantea una duda: ¿cómo podemos tener la seguridad de se devuelve el resultado correcto en los valores límite de los intervalos?

Usando Equivalence Class Partitioning seleccionamos un valor cualquiera dentro de cada intervalo. En Boundary Value Analysis vamos a escoger dos valores, correspondientes a los extremos de cada intervalo, excepto en los intervalos que no están limitados en uno de los lados:

| Intervalo | Valor a probar | Resultado |
|:---------:|:--------------:|:---------:|
|    0-9    |        9       |    0%     |
|   10-49   |       10       |   10%     | 
|   10-49   |       49       |   10%     | 
|   50-99   |       50       |   15%     |
|   50-99   |       99       |   15%     |
|   100+    |      100       |   20%     |

Los dos valores escogidos para la prueba son válidos dentro de la definición de Equivalence Class Partitioning, con la particularidad de que al ser los extremos de los intervalos nos permiten chequear condiciones del tipo "igual o mayor".

#### Decision table (tabla de decisión)

En las estrategias anteriores partíamos de la base de trabajar con un único parámetro. Cuando son varios parámetros los casos para probar se generan combinando los posibles valores de cada uno de ellos en una tabla de decisiones.

Retomando un viejo ejemplo de este mismo blog, imaginemos una tienda online de impresión de camisetas en la que el precio depende del modelo de camiseta (Masculino o Femenino), la talla (Pequeña, Mediana y Grande) y el tamaño de la ilustración (Pequeña o Grande). En ese caso, el número de posibles casos es 2 * 3 * 2 = 12, suponiendo que no habrá casos inválidos.

Esta casuística se representa en una tabla, más o menos como ésta:

| Casos -> | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 |
|:------|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:--:|:--:|:--:|
| **Condiciones** |   |   |   |   |   |   |   |   |   |   |   |   |
| Modelo | M | M | M | M | M | M | W | W | W | W | W | W |
| Talla | S | S | M | M | L | L | S | S | M | M | L | L |
| Tamaño | B | S | B | S | B | S | B | S | B | S | B | S |
|Acciones(precios)| 25 | 20 | 35 | 30 | 45 | 40 | 25 | 20 | 35 | 30 | 45 | 40 |

Esta tabla nos permite generar todas las combinaciones de tal modo que cada columna representa un caso que debemos probar.

### Tests de caja blanca

#### Basic path

Basic path es un tipo de diseño de tests que presupone el conocimiento del algoritmo que estamos testeando, de tal modo que diseñamos los casos de tests en función de los caminos que sigue el flujo de ejecución del código. Por lo tanto, la cantidad de casos estará directamente relacionada con la complejidad ciclomática del mismo.

Por ejemplo, un código en el que no haya ninguna decisión, necesitaría un único caso de test. Si hay una decisión que crea dos caminos de ejecución, se necesitarán dos casos.

Normalmente, lo mejor es representar el diagrama de flujo del código para identificar fácilmente los diversos recorridos, identificando qué valores forzarán el paso por uno u otro.

#### Code coverage o Line Coverage

El índice de Code Coverage indica qué líneas de un código han sido ejecutadas o no por los tests. Normalmente se indica en porcentaje de líneas ejecutadas sobre líneas totales. Obviamente esta medida no nos dice nada acerca de la funcionalidad del código (si lo que hace es correcto o no) pero sí nos ayuda a detectar casos no testeados porque ciertas partes del código no se han llegado a ejecutar con las pruebas que tenemos. De este modo, obtenemos información sobre qué elementos tendrían que cubrir con nuevos tests.

#### Branch coverage

Aunque está estrechamente relacionado con el anterior, el branch coverage es un poco diferente. Su función es indicarnos si los posibles cursos de acción (o branches) de un código se han ejecutado.

Por ejemplo, una cláusula `if…then` que evalúa una condición tiene dos ramas, por tanto, ambas ramas deberían haberse ejecutado al menos una vez para asegurarnos de que han sido correctamente cubiertas. Si se evalúan dos condiciones, tendremos cuatro posibles combinaciones lógicas.
