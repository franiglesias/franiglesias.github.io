---
layout: post
title: Normalización de bases de datos
categories: [articles]
tags: [bbdd, sql]
---

La normalización de las bases de datos es un proceso que persigue reducir la redundancia de datos y controlar las dependencias entre las entidades representadas en las tablas, de modo que estas puedan evolucionar fácilmente y se reduzcan los errores que generen inconsistencia de datos.

## Actualización

2026-09-27: Se han cambiado algunos ejemplos y la redacción a partir del apartado sobre la Forma Normal de Boyce-Codd, debido a que los ejemplos no eran adecuados y existían algunas incorrecciones técnicas.

El proceso de normalización consiste en verificar que las tablas cumplan una serie de condiciones llamadas "formas normales". Estas formas normales establecen unos criterios mediante los que determinamos si la tabla está normalizada o no y en qué grado.

Podríamos hablar de las formas normales de un modo similar a los principios SOLID de la programación orientada a objetos. Son criterios que nos ayudan a entender si una Entidad está bien diseñada y qué forma debería tener para serlo. La dificultad que presentan las formas normales es que son bastante difíciles de recordar, no solo por su formulación abstracta, sino porque su nombre no hace ninguna referencia a su contenido y resulta difícil vincularlas a criterios concretos.

Normalmente, cuando se dice que una tabla no cumple una determinada Forma Normal nos está indicando que parte de la información que contiene debería estar en otra tabla. De este modo, podemos comenzar el diseño de una base de datos a partir de una estructura básica y aplicar sucesivamente las formas normales para obtener el diseño definitivo. Algo así como un refactor de datos.

Por otro lado, aunque al diseñar entidades en Domain Driven Design no debemos depender de cuestiones relacionadas con la base de datos, que es un detalle de implementación, sí me parece que existe un paralelismo interesante en el proceso de normalización y en el diseño de esas entidades. Con todo, muchas veces aplicamos la normalización de forma más o menos intuitiva o en piloto automático, por lo que no está de más tener presentes las distintas formas normales.

En este artículo no trataremos todas las formas normales y llegaremos hasta la quinta. La sexta forma normal y sus variantes tratan con datos temporales y se escapa un poco de nuestro objetivo.

Empecemos, pues.

## Primera forma normal

La primera forma normal es la más básica de todas e implica cumplir cinco condiciones:

1. **Independencia del orden de las filas**. Esto quiere decir que en una tabla el orden en que se presentan las filas no cambia su significado. Por ejemplo, para representar la posición final de los participantes en una carrera utilizamos un campo *position* o *finish_time*, en lugar de hacer que el orden de las filas coincida con la posición de los participantes. Otra cosa diferente es que presentemos esos resultados ordenados en una aplicación, para lo que usamos el campo correspondiente.
2. **Independencia del orden de las columnas**. Se refiere a que el significado de las columnas no depende del orden en que están definidas en la tabla. El hecho de que una columna sea la primera o la tercera no indicaría nada, ni el hecho de que vayan juntas. Así, por ejemplo, los campos *first_surname* y *second_surname* podrían ir en ese orden o en otro cualquiera, aunque prefiramos tenerlos agrupados para interpretar la tabla más fácilmente.
3. **No hay filas duplicadas**. Que es lo mismo que decir que cada fila representa una instancia o sujeto diferente del tipo de entidad representada. En consecuencia, no puede haber dos filas que representen a un mismo sujeto o a una misma relación. La forma en que aseguramos esto es haciendo que la tabla contenga una clave primaria, formada por una o más columnas, que será única para cada fila.
4. **Cada intersección de fila y columna puede contener un y solo un valor del dominio aplicable**. En términos prácticos, significa que un campo de una fila no puede contener más de un valor. En algunas versiones, tampoco podría contener valores nulos, aunque esto es objeto de discusión. En cualquier caso, no pueden ser nulos los campos que formen parte de la clave primaria.
5. **Todas las columnas son regulares y no contienen información oculta**.

El punto 4 es el más visible de todos y se refiere al hecho de que la entidad pueda tener varios valores de un mismo atributo o conjunto de atributos. O, en términos de tablas, varios valores en la misma columna. 

Esta condición nos dice que una tabla no puede contener grupos repetidos de una o más columnas y tampoco puede condensarse esa información en una sola columna para guardar múltiples valores.

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
|  2 | j.r@example.com |
|  2 | jaime2123@example.com |

Ahora las tablas están en primera forma normal. A mí me recuerda al *Single Reponsibility Principle* en el sentido de que buscamos que cada tabla se ocupe de una sola entidad y de que cada columna se ocupe de un único atributo.

## Tipos de claves

Un aspecto importante de las bases de datos tiene que ver con la identidad de las filas. La identidad se representa mediante una **clave primaria** la cual se compone de una o más columnas, y debe ser única para cada fila. La clave primaria puede ser simple o compuesta.

Esta clave primaria no solo nos ayuda a identificar cada fila. Entre otras cosas nos proporcionará:

* Garantía de que cada fila es única.
* Una forma de relacionar las filas de una tabla con las filas de otras.

### Simple vs compuesta

**Clave simple** es aquella que está compuesta de una sola columna. Así, por ejemplo, en la tabla **people**, la clave primaria sería la columna **id**, ya que es única para cada fila:

**people**

| id | name | surname |
|---:|------|---------|
|  1 | Pepa | López   |
|  2 | Jaime | Rodríguez |

**Clave compuesta:** Como puedes suponer, la clave primaria compuesta es una clave formada por dos o más columnas. En la tabla **emails**, la clave primaria compuesta sería la columna **person_id** + **email**. La única manera de asegurar que cada fila es distinta es tener en cuenta ambas columnas.

**emails**

| person_id | email |
|---:|-------|
|  1 | pepa.lopez@example.com |
|  2 | j.r@example.com |
|  2 | jaime2123@example.com |

### Natural vs Subrogada

**Una clave natural** es aquella que se extrae de los datos de la tabla. En el caso de la tabla **people**, podríamos querer usar **name** y **surname** para crear una clave natural. Por desgracia, sabemos que esta clave no nos garantiza que cada fila es única. En su lugar necesitaríamos incluir otro dato como puede ser un DNI (que sería una clave natural en este contexto y garantiza unicidad), o bien podríamos usar una clave subrogada.

**Clave subrogada** es una columna artificial que se añade para garantizar la unicidad de las filas. Puede ser un entero autoincremental o un identificador único universal (UUID, ULID...). Normalmente, preferimos utilizar estas claves subrogadas, pues son más fáciles de manejar y no dependen de los datos reales de la tabla. En general, facilitan las operaciones de unión de tablas y relaciones, con un pequeño costo en eficiencia.

Las claves subrogadas son útiles cuando necesitamos garantizar la unicidad de las filas sin que estas tengan un significado real en el dominio. Otra ventaja es que facilitan cambios en los datos, modificar un nombre de usuario es trivial cuando no se usa como clave natural. Además, tienen un excelente soporte en herramientas ORM y librerías de persistencia.

## Segunda forma normal

Si el DDD te es familiar, estarás de acuerdo en que una Entidad se caracteriza por tener Identidad. En una base de datos, la identidad se representa mediante una **clave primaria** representada por una o más columnas no vacías y que nos asegura que cada fila de la tabla es única y distinta.

Diremos que una tabla está en **segunda forma normal** cuando ya está en **primera forma normal** y cada columna, que no forme parte de la clave, depende de la totalidad de la clave primaria. Si hay columnas que solo dependen de una parte de la clave primaria, en caso de que sea compuesta, quiere decir que tendrían que estar en otra tabla.

De hecho, las tablas que están en **primera forma normal** y cuya clave primaria sea una única columna están automáticamente en **segunda forma normal**, porque no hay forma de que exista un atributo que solo dependa de una parte de la clave.

Entonces, ¿qué significa que una columna depende de la totalidad de la clave primaria?

Una tabla representa una entidad, con sus atributos representados en cada una de las columnas. Una de esas columnas (o varias) es, por supuesto, la identidad. Las distintas filas representan distintos "ejemplares" de la entidad.

**people**

| id | name | surname |
|---:|------|---------|
|  1 | Pepa | López   |
|  2 | Jaime | Rodríguez |

En este ejemplo, la tabla **people** representa personas, cuyos atributos son *name* y *surname*, y su identidad se expresa mediante la columna/atributo *id*. Una persona puede modificar su nombre sin que cambie su identidad y es esta identidad la que nos garantiza que este sujeto concreto es el mismo en todo su ciclo de vida.

Las columnas *name* y *surname* dependen de la clave primaria *id*. Por supuesto, puede haber nombres de personas coincidentes, pero la clave primaria **id** sigue diferenciando a cada individuo:

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
| dairy  | 001 | greek yogurt | river st |
| bakery | 001 | bread | river st |
| bakery | 002 | donut | river st |

La tabla representa los productos de una empresa de alimentación que tiene varias tiendas en las que se venden los productos por especialidades.

En este ejemplo, la clave primaria está formada por las columnas *section* + *product*. El campo *name* depende de esa clave primaria por completo. En otras palabras: cada combinación de *section* + *product* define un producto que tiene su nombre correspondiente.

Sin embargo, el campo *store*, que representa la tienda en la que se vende cada familia de productos, solo depende de una de las columnas de la clave (*section*). Esto genera una redundancia y un riesgo de generar inconsistencia de datos en caso de que haya que actualizar el campo *store* para alguna de las secciones.

Pues bien, debido a eso, esta tabla no cumple la **segunda forma normal**. Para normalizar estos datos, de nuevo deberíamos separarlos en dos tablas:

**products**

| section | product | name | 
|---------|---------|------|
| fruits | 001 | oranges |
| fruits | 002 | apples |
| dairy  | 001 | greek yogurt |
| bakery | 001 | bread |
| bakery | 002 | donut |

La clave primaria está formada por las columnas *section* + *product*. El campo *name* depende de esa clave primaria por completo. En otras palabras: cada combinación de *section* + *product* define un producto que tiene su nombre correspondiente.

**sections_stores**

| section | store |
|---------|-------|
| fruits  | main st |
| dairy   | river st |
| bakery  | river st |

La segunda forma normal nos ayuda a mantener la cohesión de los datos en cada tabla, además de repartir correctamente la responsabilidad.

## Tercera forma normal

Se puede decir que cada forma normal surge a partir de las limitaciones de la forma normal anterior. Una tabla en **segunda forma normal** puede tener todavía cierta falta de cohesión, por lo que es necesario restringir un poco más la definición.

La **tercera forma normal** dictamina que cada columna está relacionada directamente con las columnas de la clave primaria y no a través de otro campo intermedio. Expresado de una manera más formal: no pueden existir dependencias transitivas entre atributos y claves. Una dependencia transitiva ocurre cuando un campo A determina un campo B,  un campo B determina otro C. Pues bien: no queremos que esto ocurra dentro de una tabla.

La meta es que los campos de la tabla que no formen parte de la clave, sean atributos dependientes de la clave y solo de esta. Intentaré mostrar un ejemplo:

**employees**

| id | name | team_id | team_name |
|----|------|:--------:|-----------|
| 1  | Ebenezer Scrooge | 3 | Accounts |
| 2  | Michael Caine | 2 | Technology |
| 3  | Mary Shelley | 2 | Technology |
| 4  | Jane Austen | 1 | Sales |

Esta tabla está en **segunda forma normal**. Pero, si nos fijamos, veremos que la relación de *team_name* con la clave primaria *id* se produce a través del campo *team_id*, tratándose de una relación transitiva.

En este ejemplo se puede ver que el atributo *team_name* no depende de la clave primaria *id*, sino del campo *team_id*. Si el nombre de los equipos cambiase, podríamos introducir incoherencias en caso de olvidarnos de modificar todos los casos. Por ejemplo, supongamos que el equipo *Technology* pasa a denominarse *Systems* y no lo actualizamos en todos los empleados:

**employees**

| id | name | team_id | team_name |
|----|------|:-------:|-----------|
| 1  | Ebenezer Scrooge | 3 | Accounts |
| 2  | Michael Caine | **2** | **Technology** |
| 3  | Mary Shelley | **2** | **Systems** |
| 4  | Jane Austen | 1 | Sales |

Para poner esta tabla de tercera forma normal necesitamos retirar las columnas que no dependen directamente de la clave primaria:

**employees**

| id | name | team_id |
|----|------|:-------:|
| 1  | Ebenezer Scrooge | 3 |
| 2  | Michael Caine | 2 |
| 3  | Mary Shelley | 2 |
| 4  | Jane Austen | 1 |

**teams**

| id | team_name |
|----|-----------|
| 1 | Sales |
| 2 | Technology |
| 3 | Accounts |

## Forma normal de Boyce-Codd

La **forma normal de Boyce-Codd** (FNBC) es una versión más exigente de la **tercera forma normal**. Para que una tabla esté en FNBC tiene que cumplir un requisito adicional: todo campo que determine el valor de otro campo debe ser, por sí mismo, una clave candidata de la tabla.

Es poco habitual que una tabla en **tercera forma normal** no cumpla la FNBC. Para que esto ocurra hace falta una situación muy concreta: que existan dos claves candidatas distintas que compartan alguna columna entre sí. Vamos a verlo con un ejemplo.

Imaginemos que los empleados participan en distintos proyectos, y que cada proyecto tiene asignado un coordinador. Un empleado puede participar en varios proyectos, pero cada coordinador se dedica en exclusiva a un único proyecto.

**employee_projects**

| employee | project | coordinator |
|----------|---------|-------------|
| Ebenezer Scrooge | Audit | Juana López |
| Ebenezer Scrooge | Ledger | Javier Pons |
| Michael Caine | Audit | Juana López |
| Mary Shelley | Research | Inma González |
| Jane Austen | Research | Inma González |
| Jane Austen | Sales Plan | Ángela Martínez |

En esta tabla hay dos claves candidatas. Por un lado, *(employee, project)* identifica cada fila de forma única, como cabría esperar. Pero, como cada coordinador está asignado a un solo proyecto, el par *(employee, coordinator)* también identifica cada fila de forma única: si sabemos quién es el empleado y quién su coordinador, el proyecto queda determinado sin ambigüedad.

Esto significa que existe una dependencia funcional *coordinator → project*: el coordinador, por sí solo, determina el proyecto. La tabla sigue estando en **tercera forma normal**, porque *coordinator* forma parte de una clave candidata (es un atributo clave, no uno cualquiera), y la 3FN solo prohíbe que un atributo no clave dependa de otro atributo no clave. Pero no está en **FNBC**, porque el requisito de esta forma normal es más estricto: exige que *todo* determinante sea una clave candidata completa, y *coordinator* por sí solo no lo es.

El problema práctico es el mismo tipo de anomalía que ya vimos: si el proyecto *Research* pasa a llamarse *Field Study*, hay que recordar actualizarlo en todas las filas donde aparezca Inma González como coordinadora, o la tabla quedará inconsistente.

La solución pasa, de nuevo, por separar la dependencia problemática en su propia tabla:

**coordinators**

| coordinator | project |
|-------------|---------|
| Juana López | Audit |
| Javier Pons | Ledger |
| Inma González | Research |
| Ángela Martínez | Sales Plan |

**employee_coordinators**

| employee | coordinator |
|----------|-------------|
| Ebenezer Scrooge | Juana López |
| Ebenezer Scrooge | Javier Pons |
| Michael Caine | Juana López |
| Mary Shelley | Inma González |
| Jane Austen | Inma González |
| Jane Austen | Ángela Martínez |

Ahora el nombre de cada proyecto se guarda en un único lugar, en `coordinators`, donde *coordinator* es clave y determina *project* sin conflicto: cambiar el nombre de un proyecto solo requiere modificar una fila.

## Cuarta forma normal

La cuarta forma normal nos permite lidiar con lo que solemos denominar **dependencias multivaluadas**. Una dependencia multivaluada aparece cuando, para un mismo valor de la clave, un atributo puede tomar varios valores de forma independiente de los valores que tome otro atributo. La definición es más o menos así: una tabla está en **cuarta forma normal** si está en **forma normal de Boyce-Codd** y, además, no contiene dos o más relaciones multivaluadas independientes entre sí.

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
| 3           | 1       |
| 4           | 1       |

Ahora imaginemos que, de forma completamente independiente de los equipos, cada empleado también participa en uno o varios idiomas de trabajo (por ejemplo, para atender a clientes internacionales), y que decidimos guardar ambos hechos en la misma tabla:

**employees_teams_languages**

| employee_id | team_id | language |
|:-----------:|:-------:|:---------|
| 3           | 2       | English  |
| 3           | 2       | Spanish  |
| 3           | 1       | English  |
| 3           | 1       | Spanish  |

Fíjate en el problema: Mary Shelley (empleado 3) pertenece a dos equipos y habla dos idiomas, pero como ambos hechos no tienen relación entre sí, la tabla se ve obligada a repetir todas las combinaciones posibles de equipo e idioma para no perder información. Esto es un **producto cartesiano** disfrazado de tabla: *team_id* y *language* no dependen el uno del otro, solo dependen ambos de *employee_id*, y sin embargo aparecen entrelazados como si formaran una sola relación. Añadir un tercer equipo o un tercer idioma obligaría a duplicar aún más filas solo para mantener la coherencia, aunque no exista ninguna dependencia funcional que lo justifique.

Esta tabla puede estar perfectamente en **forma normal de Boyce-Codd** (no hay ningún campo no clave, y la clave es *(employee_id, team_id, language)* al completo), pero seguimos teniendo redundancia e inconsistencias en potencia: si Mary Shelley deja de hablar inglés, hay que borrar dos filas en lugar de una, y un olvido nos dejaría datos contradictorios.

La solución es separar cada relación multivaluada en su propia tabla:

**employees_teams**

| employee_id | team_id |
|:-----------:|:-------:|
| 3           | 2       |
| 3           | 1       |

**employees_languages**

| employee_id | language |
|:-----------:|:---------|
| 3           | English  |
| 3           | Spanish  |

Ahora cada tabla representa un único hecho multivaluado. Añadir un nuevo idioma para Mary Shelley solo implica insertar una fila en `employees_languages`, sin tocar para nada su información de equipos, y sin necesidad de generar combinaciones que no aportan ningún significado adicional.

## Quinta forma normal

A medida que avanzamos en las formas normales ocurren dos cosas:

* Cada forma normal N supone que se cumplen todas las anteriores. Por ejemplo, una tabla no puede estar en **tercera forma normal** si no está en **primera y segunda formas normales**.
* Por otro lado, cada nueva forma normal responde a menos casos cada vez, ya que cada nueva forma surge de detectar redundancias de datos y riesgos de inconsistencias en la forma anterior.

La **quinta forma normal** requiere que las tablas estén en **cuarta forma normal**, como acabamos de ver. Es, con diferencia, la más restrictiva y la menos frecuente en la práctica.

La mejor forma de verla es imaginar una tabla en la que se relacionan tres o más entidades a través de sus claves primarias, con relaciones de tipo n-n entre ellas. ([Puedes ver un vídeo que lo explica bastante bien](https://youtu.be/7_-DifqVlBI)) Pero aquí hay que ir con cuidado: no basta con separar la tabla en todas las proyecciones posibles. Solo podemos hacerlo si se cumple una condición muy concreta, llamada **dependencia de unión**: que, siempre que existan las combinaciones parciales por separado, la combinación completa exista también necesariamente en los datos originales. Si esa condición no se cumple, al reunir las tablas mediante `JOIN` aparecerán combinaciones que nunca existieron — lo que se conoce como una *trampa de conexión*.

Imagina un servicio de búsqueda de talleres mecánicos en base a marca y tipo de servicio. Usaremos los nombres en lugar de los id para que sea algo más fácil de seguir:

**workshops_vendors_services**

| workshop | vendor  | service   |
|----------|---------|-----------|
| López    | Renault | Mechanics |
| López    | Renault | Painting  |
| López    | Seat    | Mechanics |
| Tuercas  | Renault | Painting  |

En esta tabla hay redundancia: *López* repite su nombre por cada combinación de marca y servicio que ofrece. Antes de descomponerla, comprobemos que se cumple la condición necesaria: que la unión de las tres proyecciones binarias reconstruya exactamente esta misma tabla, sin filas de más ni de menos.

**workshops_vendors**

| workshop | vendor  |
|----------|---------|
| López    | Renault |
| López    | Seat    |
| Tuercas  | Renault |

**workshops_services**

| workshop | service   |
|----------|-----------|
| López    | Mechanics |
| López    | Painting  |
| Tuercas  | Painting  |

**vendors_services**

| vendor  | service   |
|---------|-----------|
| Renault | Mechanics |
| Renault | Painting  |
| Seat    | Mechanics |

Comprobemos la unión de las tres tablas, combinación por combinación:

- *López-Renault-Mechanics*: está en las tres proyecciones → aparece en la unión, y en efecto estaba en la tabla original. ✓
- *López-Renault-Painting*: está en las tres → aparece, y estaba en el original. ✓
- *López-Seat-Mechanics*: está en las tres → aparece, y estaba en el original. ✓
- *Tuercas-Renault-Painting*: está en las tres → aparece, y estaba en el original. ✓
- *López-Seat-Painting*: `workshops_vendors` sí tiene López-Seat, y `workshops_services` sí tiene López-Painting, pero `vendors_services` **no** tiene Seat-Painting → no aparece en la unión. Correcto: esta combinación nunca existió.
- *Tuercas-Renault-Mechanics*: `vendors_services` sí tiene Renault-Mechanics, pero `workshops_services` **no** tiene Tuercas-Mechanics → no aparece en la unión. Correcto: tampoco existía.

La unión de las tres proyecciones reproduce exactamente las cuatro filas originales, ni una más ni una menos. Esto confirma que la dependencia de unión se cumple y que la descomposición es segura: no se pierde información ni se inventan combinaciones falsas.

De este modo tenemos las tablas en **quinta forma normal**, reduciendo lo máximo posible las redundancias. Para hacer consultas tendremos que unir las tablas — eso sí, sabiendo que, a diferencia de las formas normales anteriores, aquí la descomposición solo es válida porque hemos verificado esta condición concreta sobre estos datos, y no porque siempre se pueda aplicar el mismo procedimiento a cualquier relación de tres o más entidades.

