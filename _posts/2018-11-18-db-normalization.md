---
layout: post
title: Normalización de bases de datos
categories: articles
tags: bbdd sql
---

La normalización de las bases de datos es un proceso que persigue reducir la redundancia de datos y controlar las dependencias entre las entidades representadas en las tablas, de modo que éstas puedan evolucionar fácilmente y se reduzcan los errores que generen inconsistencia de datos.

El proceso de normalización consiste en verificar que las tablas cumplan una serie de condiciones llamadas "formas normales". Estas formas normales establecen unos criterios mediante los que determinamos si la tabla está normalizada o no y en qué grado.

Podríamos hablar de las formas normales de un modo similar a los principios SOLID de la programación orientada a objetos. La dificultad que presentan las formas normales es que son bastante difíciles de recordar, no solo por su formulación abstracta, sino porque su nombre no hace ninguna referencia a su contenido y resulta difícil vincularlas a criterios concretos.

Normalmente cuando se dice que una tabla no cumple una determinada Forma Normal nos está indicando que parte de la información que contiene debería estar en otra tabla. De este modo, podemos comenzar el diseño de una base de datos a partir de una estructura básica y aplicar sucesivamente las formas normales para obtener el diseño definitivo. Algo así como un refactor de datos.

Por otro lado, aunque al diseñar entidades en Domain Driven Design no debemos depender de cuestiones relacionadas con la base de datos, que es un detalle de implementación, sí me parece que existe un paralelismo interesante en el proceso de normalización y en el diseño de esas entidades. Con todo, muchas veces aplicamos la normalización de forma más o menos intuitiva o en piloto automático, por lo que no está de más tener presentas las distintas formas normales.

En este artículo no trataremos todas las formas normales y llegaremos hasta la quinta. La sexta forma normal y sus variantes tratan con datos temporales y se escapa un poco de nuestro objetivo.

Empecemos, pues.

## Primera forma normal

La primera forma normal es la más básica de todas e implica cumplir cinco condiciones:

1. **Independencia del orden de las filas**. Esto quiere decir que en una tabla el orden en que se presentan las filas no cambia su significado. Por ejemplo, para representar la posición final de los participantes en una carrera utilizamos un campo *position* o *finish_time*, en lugar de hacer que el orden de las filas coincida con la posición participantes. Otra cosa diferente es que presentemos esos resultados ordenados en una aplicación.
2. **Independencia del orden de las columnas**. Se refiere a que el significado de las columnas no depende del orden en que están definidas en la tabla. El hecho de que una columna sea la primera o la tercera no indicaría nada, ni el hecho de que vayan juntas. Así, por ejemplo, los campos *primer_apellido* y *segundo_apellido* podrían ir en ese orden o en otro cualquiera, aunque prefiramos tenerlos agrupados para interpretar la tabla más fácilmente.
3. **No hay filas duplicadas**. Que es lo mismo que decir que cada fila representa una instancia o sujeto diferente del tipo de entidad representada. En consecuencia, no puede haber dos filas que representen a un mismo sujeto o a una misma relación. La forma en que aseguramos esto es haciendo que la tabla contenga una clave primaria, formada por una o más columnas, que será única para cada fila.
4. **Cada intersección de fila y columna puede contener un y sólo un valor del dominio aplicable**. En términos prácticos, significa que un campo de una fila no puede contener más de un valor. En algunas versiones, tampoco podría contener valores nulos, aunque esto es objeto de discusión. En cualquier caso, no pueden ser nulos los campos que formen parte de la clave primaria.
5. **Todas las columnas son regulares y no contienen información oculta**.

El punto 4 es el más visible de todos y se refiere al hecho de que la entidad pueda tener varios valores de un mismo atributo o conjunto de atributos. O, en términos de tablas, varios valores en la misma columna. 

Este punto 4 nos dice que una tabla no puede contener grupos repetidos de una o más columnas y tampoco puede condensarse esa información en una sola columna para guardar múltiples valores.

Los ejemplos típicos son los datos de contacto de una persona, que puede tener varios teléfonos, emails o incluso direcciones postales (como cuando una tienda online nos permite definir varias direcciones de envío).

Para representarlo de manera sencilla utilizaré el ejemplo de una tabla de personas de las que queremos guardar varios emails.

**people**

| id | name | surname | email1 | email2 | email3 |
|---:|------|---------|--------|--------|--------|
|  1 | Pepa | López   | pepa.lopez@example.com | `null` | `null` |
|  2 | Jaime | Rodríguez   | j.r@example.com | jaime2123@example.com | `null` |

Como se puede ver en la tabla, reservamos tres columnas para el email, lo cual provoca que haya celdas vacías en algunas filas y, aunque no esté reflejado en el ejemplo, no contempla la posibilidad de que las personas puedan tener más de tres emails. Claramente, el sistema es poco eficiente.

En este caso decimos que la tabla no está en primera forma normal.

Una posible solución sería utilizar una única columna y agregar todos los valores en ella, separados por comas, por ejemplo:

**people**

| id | name | surname | email |
|---:|------|---------|-------|
|  1 | Pepa | López   | pepa.lopez@example.com |
|  2 | Jaime | Rodríguez | j.r@example.com, jaime2123@example.com |

Con este arreglo conseguimos evitar la existencia de celdas vacías en las tablas, pero nos encontramos nuevos problemas. Ahora será difícil buscar por el email o extraer un email concreto de una persona. De hecho, la tabla sigue sin estar en primera forma normal.

Lo que nos está diciendo la **primera forma normal** es que debemos extraer la información del email a otra tabla:

**people**

| id | name | surname |
|---:|------|---------|
|  1 | Pepa | López   |
|  2 | Jaime | Rodríguez |

**emails**

| person_id | email |
|---:|-------|
|  1 | pepa.lopez@example.com |
|  2 | jaime2123@example.com |
|  2 | jaime2123@example.com |

Ahora las tablas están en primera forma normal. A mí me recuerda al *Single Reponsibility Principle* en el sentido de buscamos que cada tabla se ocupe de una sola entidad y de que cada columna se ocupe de un único atributo.

## Segunda forma normal

Si el DDD te es familiar, estarás de acuerdo en que una Entidad se caracteriza por tener Identidad. En una base de datos, la identidad se representa mediante una **clave primaria** representada por una o más columnas no vacías y que nos asegura que cada fila de la tabla es distinta.

Diremos que una tabla está en **segunda forma normal** cuando ya está en **primera forma normal** y cada columna de la tabla depende de la clave primaria. Si hay columnas que sólo dependen de una parte de la clave primaria, en caso de que sea compuesta, quiere decir que tendrían que estar en otra tabla.

De hecho, las tablas que están en **primera forma normal** y cuya clave primaria sea una única columna están automáticamente en **segunda forma normal**, porque no hay forma de que exista un atributo que sólo dependa de parte de la clave.

Y esto, ¿qué significa? 

Para empezar: ¿qué significa que una columna depende de la clave primaria?

Veamos. Una tabla representa una entidad, con sus atributos representados en cada una de las columnas. Una de esas columnas (o varias) es, por supuesto, la identidad. Las distintas filas representan distintos "ejemplares" de la entidad.

**people**

| id | name | surname |
|---:|------|---------|
|  1 | Pepa | López   |
|  2 | Jaime | Rodríguez |

En este ejemplo, la tabla **people** representa personas, cuyos atributos son *name* y *surname*, y su identidad se expresa mediante la columna/atributo *id*. Una persona puede cambiar su nombre sin que cambie su identidad y es esta identidad la que nos garantiza que este sujeto concreto es el mismo en todo su ciclo de vida.

En este ejemplo, las columnas *name* y *surname* dependen de la clave primaria *id*. Por supuesto, puede haber nombres de personas coincidentes:

**people**

| id | name | surname |
|---:|------|---------|
|  1 | Pepa | López   |
|  2 | Jaime | Rodríguez |
|  3 | Pepa | López   |
|  4 | Jaime | Martínez |

En este ejemplo, las personas 1 y 3 son distintas, aunque tengan los mismos nombres, ya que su identidad es distinta.

Veamos ahora un ejemplo en el que la clave primaria está formada por más de una columna:

**products**

| section | product | name | store |
|---------|---------|------|------:|
| fruits | 001 | oranges | main st |
| fruits | 002 | apples | main st |
| dairy  | 001 | greek yoghourt | river st |
| bakery | 001 | bread | river st |
| bakery | 002 | donut | river st |

La tabla representa los productos de una empresa de alimentación que tiene varias tiendas en las que se venden los productos por especialidades.

En este ejemplo, la clave primaria está formada por las columnas *section* + *product*. El campo *name* depende de esa clave primaria por completo. En otras palabras: cada combinación de *section* + *product* define un producto que tiene su nombre correspondiente.

Sin embargo, el campo *store*, que representa la tienda en la que se vende cada familia de productos, sólo depende de una de las columnas de la clave (*section*). Esto genera una redundancia y un riesgo de generar inconsistencia de datos en caso de que haya que actualizar el campo *store* para alguna de las *sections*.

Pues bien, debido a eso, esta tabla no cumple la **segunda forma normal**. Para normalizar estos datos, de nuevo deberíamos separarlos en dos tablas:

**products**

| section | product | name | 
|---------|---------|------|
| fruits | 001 | oranges |
| fruits | 002 | apples |
| dairy  | 001 | greek yoghourt |
| bakery | 001 | bread |
| bakery | 002 | donut |

**sections_stores**

| section | store |
|---------|-------|
| fruits  | main st |
| dairy   | river st |
| bakery  | river st |

La segunda forma normal nos ayuda a mantener la cohesión de los datos en cada tabla, además de repartir correctamente la responsabilidad.

## Tercera forma normal

Se puede decir que cada forma normal surge a partir de las limitaciones de la forma normal anterior. Una tabla en **segunda forma normal** puede tener todavía cierta falta de cohesión, por lo que es necesario restringir un poco más la definición.

La **tercera forma normal** dice que cada columna está relacionada directamente con las columnas de la clave primaria y no a través de otro campo. Dicho de una manera más formal: no pueden existir relaciones transitivas entre campos y claves. Una relación transitiva es aquella que tiene la forma: A -> B, B -> C, A -> C (A y C se relacionan a través de B). Pues bien: no queremos esto en tablas normalizadas.

La idea es que los campos de la tabla que no formen parte de la clave, sean atributos dependientes de la clave y sólo de esta. Intentaré mostrar un ejemplo:

**employees**

| id | name | team_id | team_name |
|----|------|:--------:|-----------|
| 1  | Ebenizer Scrooge | 3 | Accounts |
| 2  | Michael Caine | 2 | Technology |
| 3  | Mary Shelley | 2 | Technology |
| 4  | Jane Austen | 1 | Sales |

Esta tabla está en **segunda forma normal**. Pero, si nos fijamos, veremos que las relación de *team_name* con la clave primaria *id* se produce a través del campo *team_id*, tratándose de una relación transitiva.

En este ejemplo se puede ver que el atributo *team_name* no depende la clave primaria *id*, sino del campo *team_id*. Si el nombre de los equipos cambiase, podríamos introducir incoherencias en caso de olvidarnos de modificar todos los casos. Por ejemplo, supongamos que el equipo *Technology* pasa a denominarse *Systems* y no lo actualizamos en todos los empleados:

**employees**

| id | name | team_id | team_name |
|----|------|:-------:|-----------|
| 1  | Ebenizer Scrooge | 3 | Accounts |
| 2  | Michael Caine | **2** | **Technology** |
| 3  | Mary Shelley | **2** | **Systems** |
| 4  | Jane Austen | 1 | Sales |

Para poner esta tabla de tercera forma normal necesitamos retirar las columnas que no dependen directamente de la clave primaria:

**employees**

| id | name | team_id |
|----|------|:-------:|
| 1  | Ebenizer Scrooge | 3 |
| 2  | Michael Caine | 2 |
| 3  | Mary Shelley | 2 |
| 4  | Jane Austen | 1 |

**teams**

| id | team_name |
|----|-----------|
| 1 | Sales |
| 2 | Techonology |
| 3 | Accounts |

## Forma normal de Boyce-Codd

La **forma normal de Boyce-Codd** es una versión más exigente de la **tercera forma normal**. Para que una tabla esté en **forma normal del Boyce-Codd**, tiene que cumplir el requisito extra de que todos los campos que no sean clave dependan únicamente de la clave.

En principio es bastante difícil que una tabla en **tercera forma normal** no cumpla la **forma normal de Boyce-Codd**, pero intentaré mostrar un ejemplo.

Retomemos el ejemplo anterior e imaginemos que cada empleado tiene un supervisor que pertenece al equipo, pudiendo haber varios supervisores en el mismo equipo.

**employees**

| id | name | team_id | supervisor |
|----|------|:-------:|:-----------|
| 1  | Ebenizer Scrooge | 3 | Juana López |
| 2  | Michael Caine | 2 | Inma González |
| 3  | Mary Shelley | 2 | Javier Pons |
| 4  | Jane Austen | 1 | Ángela Martínez |

En esta tabla, *supervisor* tiene dependencias tanto de *employee_id* como de *team_id*, pero no de ambas a la vez (juntas componen la clave primaria), por lo que no puede estar en la **forma normal de Boyce-Codd**. La solución podría ser esta:

**teams**

| id | team_name |
|----|-----------|
| 1 | Sales |
| 2 | Techonology |
| 3 | Accounts |

**employees**

| id | name | team_id |
|----|------|:-------:|
| 1  | Ebenizer Scrooge | 3 |
| 2  | Michael Caine | 2 |
| 3  | Mary Shelley | 2 |
| 4  | Jane Austen | 1 |

**employees_supervisor**

| employee_id | supervisor      |
|:-----------:|:----------------|
| 1           | Juana López     |
| 2           | Inma González   |
| 3           | Javier Pons     |
| 4           | Ángela Martínez |

## Cuarta forma normal

La cuarta forma normal nos permite lidiar con lo que solemos denominar relaciones **muchos a muchos** (n to n). La definición es más o menos así: una tabla en **cuarta forma normal** está en **tercera forma normal** y no puede contener varias relaciones independientes entre sí.

Partiendo de la solución anterior:

**employees**

| id | name             | team_id |
|----|------------------|:-------:|
| 1  | Ebenizer Scrooge | 3       |
| 2  | Michael Caine    | 2       |
| 3  | Mary Shelley     | 2       |
| 4  | Jane Austen      | 1       |

**teams**

| id | team_name   |
|----|-------------|
| 1  | Sales       |
| 2  | Techonology |
| 3  | Accounts    |

La tabla employees representa realmente dos relaciones que son independientes entre sí: *identidad -> nombre* e *identidad -> equipo*, por lo que deberían separarse.

¿Qué ocurre si un empleado puede formar parte de varios equipos? No podríamos añadir filas para contemplar eso, ya que romperíamos **la primera forma normal** por tener filas repetidas con la misma clave primaria:

**employees**

| id | name             | team_id |
|----|------------------|:-------:|
| 1  | Ebenizer Scrooge | 3       |
| 2  | Michael Caine    | 2       |
| 3  | Mary Shelley     | 2       |
| 4  | Jane Austen      | 1       |
| 3  | Mary Shelley     | 3       |
| 4  | Jane Austen      | 2       |

Así que esta sería otra forma de intentar resolver el problema anterior:

**employees**

| id | name             |
|----|------------------|
| 1  | Ebenizer Scrooge |
| 2  | Michael Caine    |
| 3  | Mary Shelley     |
| 4  | Jane Austen      |

**teams**

| id | team_name  |
|----|------------|
| 1  | Sales      |
| 2  | Technology |
| 3  | Accounts   |

**employees_teams**

| employee_id | team_id |
|:-----------:|:-------:|
| 1           | 3       |
| 2           | 2       |
| 3           | 2       |
| 4           | 1       |
| **3**       | **1**   |

## Quinta forma normal

A medida que avanzamos en la formas normales ocurren dos cosas:

* Cada forma normal N supone que se cumplen todas las anteriores. Por ejemplo, una tabla no puede estar en **tercera forma normal** si no está en **primera forma normal**.
* Por otro lado, cada nueva forma normal responde a menos casos cada vez, ya que cada nueva forma surge de detectar redundancias de datos y riesgos de inconsistencias en la forma anterior.

La **quinta forma normal** requiere que las tablas estén en **cuarta forma normal**, como acabamos de ver.

La mejor forma de verla es imaginar una tabla en la que se relacionan tres o más entidades a través de sus claves primarias. Si estas relaciones son del tipo n-n, habrá muchas combinaciones y grandes posibilidades de que exista redundancia de datos. ([Puedes ver un vídeo que lo explica bastante bien](https://youtu.be/7_-DifqVlBI))

Imagina un servicio de búsqueda de talleres mecánicos en base a tipo de servicio, marca y aseguradora. Usaremos los nombres en lugar de los id para que sea algo más fácil de seguir:

**workshops_vendors_assurances_services**

| workshop | vendor | service | assurance |
|----------|--------|---------|-----------|
| López    | Renault | Mechanics | Generalli |
| López    | Seat | Mechanics | Generalli |
| López    | Volvo | Mechanics | Generalli |
| López    | Volvo | Mechanics | Axa |
| López    | Seat | Mechanics | Axa |
| Tuercas  | Renault | Painting | Generalli |
| Tuercas  | Volvo | Painting | Mutua M |
| Tuercas  | Volkswagen | Electronic | Mutua M |
| Tuercas  | Renault | Electronic | Axa |

En esta tabla se puede apreciar mucha redundancia. Cada vez que añadamos un taller tendremos que añadir un montón de filas para cubrir las diferente combinaciones de marcas, servicios y aseguradoras.

La quinta forma normal pide que estas relaciones se separen, haciendo proyecciones de sus columnas:

**workshops_vendors**

| workshop | vendor | 
|----------|--------|
| López    | Renault |
| López    | Volvo |
| López    | Seat |
| Tuercas  | Volvo |
| Tuercas  | Volkswagen |
| Tuercas  | Renault |

**workshops_services**

| workshop | service | 
|----------|---------|
| López    | Mechanics |
| Tuercas  | Painting |
| Tuercas  | Electronic |

**workshops_assurances**

| workshop | assurance |
|----------|-----------|
| López    | Generalli |
| López    | Axa |
| Tuercas  | Generalli |
| Tuercas  | Mutua M |
| Tuercas  | Axa |

**assurances_services**

| service | assurance |
|---------|-----------|
| Mechanics | Generalli |
| Mechanics | Axa |
| Painting | Generalli |
| Painting | Mutua M |
| Electronic | Mutua M |
| Electronic | Axa |

**vendors_assurances**

| vendor | assurance |
|--------|-----------|
| Renault | Generalli |
| Renault | Axa |
| Seat | Generalli |
| Seat | Axa |
| Volvo | Generalli |
| Volvo | Axa |
| Volvo | Mutua M |
| Volkswagen | Mutua M |

De este modo tenemos las tablas en **quinta forma normal**, reduciendo lo máximo posible las redundancias. Para hacer consultas tendremos que unir las tablas.

