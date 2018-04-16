---
layout: post
title: Uniones de tablas en SQL
categories: articles
tags: [bbdd, join]
---

Este es un artículo rescatado del olvido. Lo escribí en 2010, como forma de aprender el funcionamiento de las uniones de tablas en SQL.

Una de las claves para sacar partido a una base de datos es dominar las *queries* complejas que incluyen uniones de tablas. Pero no todas las uniones son iguales y, en consecuencia, no nos dan los mismos resultados.

Una buena manera de entenderlo es practicando, por lo que es recomendable que crees algunas tablas sencillas y lances las `queries` como forma de ver en vivo los resultados de cada tipo de **join** y así entender para qué casos te pueden servir. No hace falta que tengan muchos campos, ni muchos registros.

El motor de base de datos es MySQL.

## Preparando el entorno de prácticas

Un buen ejemplo puede ser una tabla de libros y una de autores, como las que siguen:

```sql
CREATE TABLE `books` (
  `id` int(11) NOT NULL auto_increment,
  `title` varchar(200) default NULL,
  `author_id` int(11) default NULL,
PRIMARY KEY (`id`)
)

CREATE TABLE `authors` (
  `id` int(11) NOT NULL auto_increment,
  `author` varchar(200) default NULL,
PRIMARY KEY (`id`)
)
```

Los datos para las tablas:

```sql
# Dump of table authors
# ------------------------------------------------------------

INSERT INTO `authors` (`id`,`author`) VALUES ('1','Cervantes');
INSERT INTO `authors` (`id`,`author`) VALUES ('2','García Márquez');
INSERT INTO `authors` (`id`,`author`) VALUES ('3','Saint-Exupery');


# Dump of table books
# ------------------------------------------------------------

INSERT INTO `books` (`id`,`title`,`author_id`) VALUES ('1','El quijote','1');
INSERT INTO `books` (`id`,`title`,`author_id`) VALUES ('2','100 años de soledad','2');
INSERT INTO `books` (`id`,`title`,`author_id`) VALUES ('3','El Principito','3');
```

## Producto cartesiano

Para entender cómo funcionan los JOIN tenemos que empezar repasando un concepto que muchos aprendimos en la Primaria (bueno, yo en la EGB): el producto cartesiano. Ya sabes: dados dos conjuntos A y B, su producto cartesiano es otro conjunto C (A × B) formado por todos los pares ordenados en los que el primer elemento del par pertenece a A y el segundo elemento del par pertenece a B.

Así, `JOIN` es básicamente el producto cartesiano de las tablas, es decir: una nueva tabla en que cada registro combina un registro de la primera tabla con cada uno de los registros de la segunda tabla.

La query

```sql
SELECT * FROM books JOIN authors
```

nos dará como resultado todas las posibles combinaciones de `books` y `authors` (en nuestro caso 9 registros). Algo así:

```
+----+---------------------+-----------+----+----------------+
| id | title               | author_id | id | author         |
+----+---------------------+-----------+----+----------------+
|  1 | El quijote          |         1 |  1 | Cervantes      | 
|  2 | 100 años de soledad |         2 |  1 | Cervantes      | 
|  3 | El Principito       |         3 |  1 | Cervantes      | 
|  1 | El quijote          |         1 |  2 | García Márquez | 
|  2 | 100 años de soledad |         2 |  2 | García Márquez | 
|  3 | El Principito       |         3 |  2 | García Márquez | 
|  1 | El quijote          |         1 |  3 | Saint-Exupery  | 
|  2 | 100 años de soledad |         2 |  3 | Saint-Exupery  | 
|  3 | El Principito       |         3 |  3 | Saint-Exupery  | 
+----+---------------------+-----------+----+----------------+
9 rows in set (0,03 sec)
```

Como puedes suponer, este resultado no es muy útil para este tipo de datos, aunque hay muchos casos en que si que lo puede ser.

Por ejemplo: en un campeonato deportivo como una liga de fútbol tendremos una tabla equipos, que recoge el nombre de todos los equipos participantes.

```
+----+------------+
| id | equipo     |
+----+------------+
|  1 | Barcelona  | 
|  2 | Madrid     | 
|  3 | Celta      | 
|  4 | Villarreal | 
+----+------------+
4 rows in set (0,02 sec)
```

Pues bien, un JOIN de la tabla consigo misma, nos permitirá obtener todos los partidos del campeonato. Eso sí, tendremos que recurrir a los alias para evitar un error de MySQL.

```sql
SELECT * FROM equipos AS Local JOIN equipos AS Visitante
```
```
+----+------------+----+------------+
| id | equipo     | id | equipo     |
+----+------------+----+------------+
|  1 | Barcelona  |  1 | Barcelona  | 
|  2 | Madrid     |  1 | Barcelona  | 
|  3 | Celta      |  1 | Barcelona  | 
|  4 | Villarreal |  1 | Barcelona  | 
|  1 | Barcelona  |  2 | Madrid     | 
|  2 | Madrid     |  2 | Madrid     | 
|  3 | Celta      |  2 | Madrid     | 
|  4 | Villarreal |  2 | Madrid     | 
|  1 | Barcelona  |  3 | Celta      | 
|  2 | Madrid     |  3 | Celta      | 
|  3 | Celta      |  3 | Celta      | 
|  4 | Villarreal |  3 | Celta      | 
|  1 | Barcelona  |  4 | Villarreal | 
|  2 | Madrid     |  4 | Villarreal | 
|  3 | Celta      |  4 | Villarreal | 
|  4 | Villarreal |  4 | Villarreal | 
+----+------------+----+------------+
16 rows in set (0,03 sec)
```

Con todo, esta *query* necesita alguna restricción para ser perfecta, pues nos empareja cada equipo consigo misma, así que podemos añadir condiciones para eliminar esas parejas del resultado.

```sql
SELECT * FROM equipos AS Local JOIN equipos AS Visitante WHERE Local.id != Visitante.id
```
```
+----+------------+----+------------+
| id | equipo     | id | equipo     |
+----+------------+----+------------+
|  2 | Madrid     |  1 | Barcelona  | 
|  3 | Celta      |  1 | Barcelona  | 
|  4 | Villarreal |  1 | Barcelona  | 
|  1 | Barcelona  |  2 | Madrid     | 
|  3 | Celta      |  2 | Madrid     | 
|  4 | Villarreal |  2 | Madrid     | 
|  1 | Barcelona  |  3 | Celta      | 
|  2 | Madrid     |  3 | Celta      | 
|  4 | Villarreal |  3 | Celta      | 
|  1 | Barcelona  |  4 | Villarreal | 
|  2 | Madrid     |  4 | Villarreal | 
|  3 | Celta      |  4 | Villarreal | 
+----+------------+----+------------+
12 rows in set (0,00 sec)
```

## Inner Join

Este tipo de `JOINS` que nos dan el producto cartesiano son del tipo `INNER` y los resultados que podemos obtener de ellas están siempre dentro de ese producto cartesiano.

Como decíamos antes, este tipo de resultados no es muy útil en algunos casos. Volviendo a nuestro ejemplo de libros y autores, la *query* nos empareja obras y autores de todas las maneras posibles, lo que no se corresponde con la realidad. Nuestro sistema tiene que tener más conocimiento del mundo y poder utilizarlo al hacer la combinación de tablas.

Nuestra tabla `books` cuenta con el campo `author_id`, la clave foránea que nos indica qué autor corresponde a cada libro. ¿Qué papel puede jugar en la combinación de tablas?

`JOIN` admite una cláusula `ON` para definir qué condiciones deben usarse para que dos registros se combinen. En nuestro ejemplo, el campo `books.author_id` debe coincidir con el campo `author.id` y lo expresamos así:

```sql
SELECT * FROM books INNER JOIN authors ON books.author_id = authors.id
```

```
+----+---------------------+-----------+----+----------------+
| id | title               | author_id | id | author         |
+----+---------------------+-----------+----+----------------+
|  1 | El quijote          |         1 |  1 | Cervantes      | 
|  2 | 100 años de soledad |         2 |  2 | García Márquez | 
|  3 | El Principito       |         3 |  3 | Saint-Exupery  | 
+----+---------------------+-----------+----+----------------+
3 rows in set (0,05 sec)
```

De este modo, la *query* nos devuelve los libros correctamente emparejados con sus autores.

Podemos añadir la cláusula `WHERE` para especificar condiciones que restrinjan la búsqueda de datos y esta puede usar campos de las tablas combinadas. Así, podemos buscar un libro por el nombre de su autor, a pesar de que este dato no está en la tabla `books`.

```sql
SELECT * FROM books INNER JOIN authors ON books.author_id = authors.id WHERE authors.author = 'Cervantes'
```
```
+----+------------+-----------+----+-----------+
| id | title      | author_id | id | author    |
+----+------------+-----------+----+-----------+
|  1 | El quijote |         1 |  1 | Cervantes | 
+----+------------+-----------+----+-----------+
1 row in set (0,00 sec)
```

Cuando combinamos `ON` y `WHERE` nos puede surgir la duda de si sería mejor poner las condiciones en `ON` o en `WHERE`.

La regla práctica sería poner en `ON` las condiciones para decidir que registros deben emparejarse y en `WHERE` las condiciones para filtrar o restringir el resultado. La base de datos primero genera la tabla temporal y luego hace el filtrado.

## Left join

Puede ocurrir que tengamos datos en una tabla que no tengan un registro asociado en la otra. Por ejemplo, añadimos un nuevo libro a nuestra tabla books pero no sabemos su autor (o es anónimo).

Ahora si pedimos una lista de todos los libros registrados con sus autores con la *query* anterior veremos que no aparecen los libros que no tengan autor. ¡Vaya! En muchos casos este comportamiento no nos interesa, querríamos tener toda la lista de libros aunque no sepamos el autor.

Para eso utilizamos `LEFT JOIN`.

Este tipo de combinación toma todos los registros válidos de la primera tabla (o tabla izquierda/left) y los combina con los registros de la otra tabla (derecha). Si no hay ningún registro que se pueda combinar lo hace con uno nuevo cuyos campos están todos en `NULL`.

En nuestros datos actuales tenemos tres libros y conocemos a sus autores correspondientes, así que al pedir la información a la base de datos nos devolverá este resultado:

```sql
SELECT * FROM books LEFT JOIN authors ON books.author_id = authors.id
```
```
+----+---------------------+-----------+------+----------------+
| id | title               | author_id | id   | author         |
+----+---------------------+-----------+------+----------------+
|  1 | El quijote          |         1 |    1 | Cervantes      | 
|  2 | 100 años de soledad |         2 |    2 | García Márquez | 
|  3 | El Principito       |         3 |    3 | Saint-Exupery  | 
+----+---------------------+-----------+------+----------------+
3 rows in set (0,00 sec)
```

Ahora introduciremos un nuevo libro del cual no conocemos el autor

```sql
INSERT INTO books (title) values ('Lazarillo de Tormes');
```

y repetimos la misma petición anterior. Este es el resultado:

```
+----+---------------------+-----------+------+----------------+
| id | title               | author_id | id   | author         |
+----+---------------------+-----------+------+----------------+
|  1 | El quijote          |         1 |    1 | Cervantes      | 
|  2 | 100 años de soledad |         2 |    2 | García Márquez | 
|  3 | El Principito       |         3 |    3 | Saint-Exupery  | 
|  4 | Lazarillo de Tormes |      NULL | NULL | NULL           | 
+----+---------------------+-----------+------+----------------+
4 rows in set (0,00 sec)
```

La base de datos no encuentra un registro en `authors` que pueda emparejar con "Lazarillo de Tormes", pero al utilizar un `LEFT JOIN` también nos devuelve este libro, aunque deja los campos de `authors` sin definir. Para nosotros es útil porque de este modo podemos saber qué libros tenemos con independencia de si tenemos los datos de autor o no. La misma petición con un `INNER JOIN` nos dará el siguiente resultado:

```sql
SELECT * FROM books INNER JOIN authors ON books.author_id = authors.id;
```
```
+----+---------------------+-----------+----+----------------+
| id | title               | author_id | id | author         |
+----+---------------------+-----------+----+----------------+
|  1 | El quijote          |         1 |  1 | Cervantes      | 
|  2 | 100 años de soledad |         2 |  2 | García Márquez | 
|  3 | El Principito       |         3 |  3 | Saint-Exupery  | 
+----+---------------------+-----------+----+----------------+
3 rows in set (0,00 sec)
```

Ves la diferencia, ¿verdad? Con el `INNER JOIN` sólo se devuelven resultados "dentro" del producto cartesiano (o dicho de otro modo, se devuelven pares de registros de ambas tablas). Se toman los registros de la tabla "izquierda" y se combinan con el registro correspondiente de la tabla "derecha" que cumpla las condiciones del `ON` y si no existe se ignora esa fila.

Con `LEFT JOIN` se podría decir que se toman todos los registros de la tabla izquierda relevantes (que cumplan las condiciones de `WHERE` si está presente) y se combinan con el registro correspondiente de la tabla "derecha" tanto si existe, como si no, un registro en ella que cumpla las condiciones de `ON`.

## Right join

Si entendiste bien el significado de `LEFT JOIN` seguro que eres capaz de deducir lo que significa `RIGHT JOIN`. Exacto: en este caso se parte de los registros de la tabla "derecha" y se busca si hay algún registro en la tabla "izquierda" que cumpla las condiciones en ON. En caso de no encontrarlo se ponen sus campos a NULL.

Para poder verlo en acción necesitamos añadir un `author` a nuestra tabla, que no tenga libros.

```sql
INSERT authors (author) values ('Quevedo')
```

A continuación ejecutamos una petición con `RIGHT JOIN`:

```sql
SELECT * FROM books RIGHT JOIN authors ON books.author_id = authors.id;
```

El resultado es:

```
+------+---------------------+-----------+----+----------------+
| id   | title               | author_id | id | author         |
+------+---------------------+-----------+----+----------------+
|    1 | El quijote          |         1 |  1 | Cervantes      | 
|    2 | 100 años de soledad |         2 |  2 | García Márquez | 
|    3 | El Principito       |         3 |  3 | Saint-Exupery  | 
| NULL | NULL                |      NULL |  4 | Quevedo        | 
+------+---------------------+-----------+----+----------------+
4 rows in set (0,00 sec)
```

Como era de esperar, el registro correspondiente al `author` "Quevedo" aparece recogido con los campos de la tabla books puestos a `NULL`.

## Relaciones muchos a muchos

Este tipo de relaciones requiere una tabla intermedia (`join table`) que nos permita asociar las parejas de registros. Las tablas izquierda y derecha se relacionan de uno a muchos con la `join table`. Por lo tanto tendremos que "unir" la tabla izquierda con la `join table` y ésta con la tabla derecha.

### Etiquetar libros

Vamos a seguir con nuestro ejemplo y vamos a añadir una tabla `tags` a nuestro sistema para poder etiquetar cada libro con diversas palabras descriptoras. Por ejemplo, así:

```sql
CREATE TABLE `tags` (
  `id` int(11) NOT NULL auto_increment,
  `tag` varchar(200) default NULL,
  PRIMARY KEY  (`id`)
)
```

Y vamos a introducir algunos valores, para que la tabla quede así:

```
+----+-----------------------+
| id | tag                   |
+----+-----------------------+
|  1 | Novela                | 
|  2 | Lit. Castellana       | 
|  3 | Lit. Hispanoamericana | 
|  4 | Lit. Francesa         | 
|  5 | Poesia                | 
+----+-----------------------+
5 rows in set (0,00 sec)
```

A continaución creamos la `join table`:

```sql
CREATE TABLE `books_tags` (
  `books_id` int(11) not null,
  `tags_id` int(11) not null);
```

Y la poblamos para relacionar nuestros libros con sus `tags` correspondientes, nos quedaría algo así:

```
+----------+---------+
| books_id | tags_id |
+----------+---------+
|        1 |       1 | 
|        2 |       1 | 
|        3 |       1 | 
|        4 |       1 | 
|        1 |       2 | 
|        4 |       2 | 
|        2 |       3 | 
|        3 |       4 | 
+----------+---------+
8 rows in set (0,00 sec)
```

Ahora podemos empezar a trabajar combinando las tablas. En realidad es muy simple: definimos una cláusula `JOIN` con cada una de las tablas que queremos unir. Por ejemplo:

```sql
SELECT * FROM books JOIN books_tags JOIN tags;
```

Esta *query* específicamente se puede abreviar usando ',' en vez de JOIN:

```sql
SELECT * FROM books, books_tags, tags;
```

La petición anterior nos devolverá el producto cartesiano de las tres tablas (nada menos que 160 filas). Ya que las tablas están relacionadas, podemos usar las sentencias `ON` sobre los campos de clave primaria y clave foránea:

```sql
SELECT title, tag 
FROM books 
    JOIN books_tags ON books.id = books_tags.books_id 
    JOIN tags ON books_tags.tags_id = tags.id;
```

Es decir, unimos la tabla `books` con la `books_tags` cuando coinciden `books.id` y `books_tags.books_id` y ésta a su vez con la tabla `tags`, cuando coinciden `books_tags.tags.id` y `tags.id`.

El resultado lo he restringido a los campos `title` y `tag` para que se vea más claro:

```
+---------------------+-----------------------+
| title               | tag                   |
+---------------------+-----------------------+
| El quijote          | Novela                | 
| El quijote          | Lit. Castellana       | 
| 100 años de soledad | Novela                | 
| 100 años de soledad | Lit. Hispanoamericana | 
| El Principito       | Novela                | 
| El Principito       | Lit. Francesa         | 
| Lazarillo de Tormes | Novela                | 
| Lazarillo de Tormes | Lit. Castellana       | 
+---------------------+-----------------------+
8 rows in set (0,00 sec)
```

¿Podríamos meter a los autores en esta petición? Vamos a verlo (añado también el campo `author` y una cláusula para ordenar los registros a fin de apreciar mejor los resultados):

```sql
SELECT title, author, tag 
FROM books 
    JOIN authors ON books.author_id = authors.id 
    JOIN books_tags ON books.id = books_tags.books_id 
    JOIN tags ON books_tags.tags_id = tags.id 
ORDER BY title;
```

```
+---------------------+----------------+-----------------------+
| title               | author         | tag                   |
+---------------------+----------------+-----------------------+
| 100 años de soledad | García Márquez | Lit. Hispanoamericana | 
| 100 años de soledad | García Márquez | Novela                | 
| El Principito       | Saint-Exupery  | Novela                | 
| El Principito       | Saint-Exupery  | Lit. Francesa         | 
| El quijote          | Cervantes      | Novela                | 
| El quijote          | Cervantes      | Lit. Castellana       | 
+---------------------+----------------+-----------------------+
6 rows in set (0,00 sec)
```

Por supuesto, puedes usar los `LEFT JOIN` y `RIGHT JOIN` según tus necesidades, por ejemplo, para obtener el listado completo de libros y sus etiquetas:

```sql
SELECT title, author, tag 
FROM books 
    LEFT JOIN authors ON books.author_id = authors.id 
    JOIN books_tags ON books.id = books_tags.books_id 
    JOIN tags ON books_tags.tags_id = tags.id 
ORDER BY title;
```

En qué medida debes usar `left` o `right` depende de si necesitas obtener todos los registros posibles de las tablas izquierda o derecha, o sólo aquellos que tienen datos en ambas tablas.

Ahora veamos cómo podemos buscar libros que correspondan a una etiqueta. Empezamos por la combinación de tablas y luego no tenemos más que indicar en `WHERE` qué etiquetas queremos seleccionar:

```sql
SELECT title, author, tag 
FROM books 
    LEFT JOIN authors ON books.author_id = authors.id 
    JOIN books_tags ON books.id = books_tags.books_id 
    JOIN tags ON books_tags.tags_id = tags.id 
WHERE tags.tag = 'Novela'
ORDER BY title;
```

```
+---------------------+----------------+--------+
| title               | author         | tag    |
+---------------------+----------------+--------+
| 100 años de soledad | García Márquez | Novela | 
| El Principito       | Saint-Exupery  | Novela | 
| El quijote          | Cervantes      | Novela | 
| Lazarillo de Tormes | NULL           | Novela | 
+---------------------+----------------+--------+
4 rows in set (0,00 sec)
```

También puede ser otra etiqueta, claro. Por ejemplo, qué libros tenemos de literatura castellana:

```sql
SELECT title, author, tag 
FROM books 
    LEFT JOIN authors ON books.author_id = authors.id 
    JOIN books_tags ON books.id = books_tags.books_id 
    JOIN tags ON books_tags.tags_id = tags.id 
WHERE tags.tag = 'Lit. Castellana'
ORDER BY title;
```

Que nos dará este resultado:

```
+---------------------+-----------+-----------------+
| title               | author    | tag             |
+---------------------+-----------+-----------------+
| El quijote          | Cervantes | Lit. Castellana | 
| Lazarillo de Tormes | NULL      | Lit. Castellana | 
+---------------------+-----------+-----------------+
2 rows in set (0,00 sec)
```

Como puedes ver, aparte del pequeño lío que supone especificar las combinaciones de tablas a través de múltiples `join` el trabajo es bastante sencillo.

