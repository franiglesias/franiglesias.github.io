Como añadir autoload a un proyecto sin namespaces.

La serie **Historia de una reescritura** está compuesta de los siguientes artículos

[Historia de una reescritura (1):](historia-de-una-reescritura-1.md)  
[Historia de una reescritura (2): El problema con MVC](historia-de-una-reescritura-2-el-problema-con-mvc.md)  
[Historia de una reescritura (3): Empezar con la vista](historia-de-una-reescritura-3-empezar-con-la-vista.md)  
[Historia de una reescritura (4): El código tóxico](historia-de-una-reescritura-4-codigo-toxico.md)  
[Historia de una reescritura (5): Tests](historia-de-una-reescritura-5-tests.md)  
[Historia de una reescritura (6): Autoload sin namespaces](historia-de-una-reescritura-6-autoload-sin-namespaces.md)

CakePHP 1.3 tiene muchos problemas derivados de su antigüedad, como el hecho de no tener namespaces, carecer de un autoloader y otro muchos, como hacer un montón de llamadas estáticas a métodos que no lo son.

Aunque incluye una utilidad (App::import) para cargar las clases y un ClassRegistry, lo cierto es que si bien mejora un poco las cosas sobre un <code>require</code> o <code>require_once</code> a pelo, es bastante incómodo a la larga.

Una idea es aprovechar composer para tener un autoloader basado en un classmap, que no es más que un autoloader sencillo que registra todas las clases que desees y la ruta para incluirlas.

Aquí el ejemplo del que estoy usando:

{% gist f73fc32a4207e0bd6eaa1c68184700fa %}

En el caso de CakePHP hay que tener cuidado ya que el framework incluye unas cuantas clases fallback, con lo cual hay un buen número de ellas que se definen en varios archivos, uno de los cuales es tu versión y los otros son o bien plantillas o bien fallbacks, lo que provoca que Composer encuentre varios duplicados. Un ejemplo es AppController.

Como solución, Composer añade al mapa de las clases una de las clases que encuentra, por lo que bien podría pasar que seleccione justo alguna de las que no te interesa, lo que lleva a resultados más que inesperados.

La solución es tan sencilla como añadir a la clave 'exclude-from-classmap' las clases o rutas que necesites excluir.

A partir de ahí tendremos autoload para las clases en el espacio global. Si tenemos que compatibilizar con clases con namespace, no tenemos más que usar el FQCN global, o sea: <code>\MiClase</code>

 