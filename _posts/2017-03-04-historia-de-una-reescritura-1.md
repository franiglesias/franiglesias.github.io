---
layout: post
title: Historia de una reescritura (1)
categories: articles
tags: misc
---

Hace unos 15 años comencé a escribir mi primera aplicación seria en PHP. Esta aplicación fue creciendo y sufriendo diversos cambios y prestaciones. Ahora ha llegado el momento de replantearla.

La serie **Historia de una reescritura** está compuesta de los siguientes artículos

[Historia de una reescritura (1):](/historia-de-una-reescritura-1)  
[Historia de una reescritura (2): El problema con MVC](/historia-de-una-reescritura-2-el-problema-con-mvc)  
[Historia de una reescritura (3): Empezar con la vista](/historia-de-una-reescritura-3-empezar-con-la-vista)  
[Historia de una reescritura (4): El código tóxico](/historia-de-una-reescritura-4-codigo-toxico)  
[Historia de una reescritura (5): Tests](/historia-de-una-reescritura-5-tests)  
[Historia de una reescritura (6): Autoload sin namespaces](/historia-de-una-reescritura-6-autoload-sin-namespaces)

Cuando eres desarrollador autodidacta y el único miembro de un equipo de desarrollo que se encarga de preparar y gestionar servidores, programar el backend, optimizar el acceso a la base de datos, preparar el diseño gráfico y construir las páginas y plantillas, aprendes mucho, a veces de la manera dura, y a veces de la manera retorcida.

La manera dura es cuando, por ejemplo,  tu aplicación se cae porque el servidor de base de datos no puede atender sus peticiones y tienes que reconstruir todas las queries para reducir la cantidad de datos recuperados o para evitar aquellas que sean innecesarias, cachear los resultados y redefinir los índices para optimizar el tiempo y la cantidad de datos que se transfieren.

La manera retorcida es cuando experimentas técnicas o conceptos y estos te llevan a callejones sin salida o incluso a reventar la aplicación y te obligan a volver atrás y empezar de nuevo.

En fin, no creo que te esté contando nada que no sepas.

Mi aplicación empezó siendo un sistema de gestión de incidencias (un issue tracker) para un colegio que acababa de meterse en el mundillo de la calidad ISO-9000. Nos habían dado una aplicación de Access muy difícil de manejar y muy difícil de implementar en un entorno de múltiples usuarios. Por eso, se me ocurrió que podría ser buena idea plantearla como una aplicación web (en un momento en que era una idea relativamente nueva, por cierto).

La primera aplicación fue bastante bien, aunque yo trabajaba muy a ciegas y sin mucha sistemática.

Con el tiempo se pidieron nuevas prestaciones (un gestor de cartas circulares bilíngüe, el gestor de contenidos, gestión del comedor escolar, admisiones de nuevos alumnos, bolsa de trabajo y otros) y la aplicación fue creciendo. Esta vez, sobre el framework CakePHP 1.x.

Hoy diría que este proceso fue muy orgánico, como forma cool de decir que fue bastante desorganizado. Yo iba aprendiendo a base de escribir y, además, teniendo que ocuparme de otras tareas.

Cuando llegó el momento de actualizar a nuevas versiones de CakePHP (2 y 3) decidí no hacerlo, ya que o bien me pillaba en plena fase de añadir prestaciones o corregir problemas, o bien me pillaba en una fase en la que no podría dedicarle tiempo.

Pero, con el tiempo, pasaron dos cosas. Primero, la constatación de que cada vez era más difícil echarle mano al código salvo para algunas cosas sencillas y muy puntuales.

Después, mi propia madurez como programador, al encontrarme con los conceptos de [arquitecturas limpias](https://8thlight.com/blog/uncle-bob/2012/08/13/the-clean-architecture.html), [diseño dirigido por dominio](https://es.wikipedia.org/wiki/Diseño_guiado_por_el_dominio), [principios SOLID](http://butunclebob.com/ArticleS.UncleBob.PrinciplesOfOod), [patrones de diseño de software](https://www.google.es/url?sa=t&rct=j&q=&esrc=s&source=web&cd=3&cad=rja&uact=8&ved=0ahUKEwi63YmQ-rzSAhVJuBQKHdi9A_EQFgg2MAI&url=https%3A%2F%2Fsourcemaking.com%2Fdesign_patterns&usg=AFQjCNF8c3A6aKULZtU0aBMePB5kbDvyCA&sig2=sTF6IDiaRU2HFf-aDFuA8Q) y todo lo que constituye la base de la programación profesional. Decidí profundizar en esto a fondo, lo que me llevó a cambiar radicalmente mi forma de trabajar, empezando por mis herramientas.

Para empezar, dejé CakePHP en favor de Symfony, pero dejando el framework para la parte de infraestructura de la interfaz web, que es el lugar que corresponde a los framework MVC.

CakePHP venía con SimpleTest para los test unitarios, desde ese momento pasé a PHPUnit. Después descubrí [PHPSpec](http://www.phpspec.net/en/stable/) y [Behat](http://behat.org/en/latest/) y eso aceleró mi aprendizaje de una manera brutal. Ambos entornos te llevan a subir la calidad de tu código y diseños de forma exponencial.

Comencé a reescribir conceptos de la aplicación desde el punto de vista de DDD. También me interesé por ideas como la mensajería de aplicación (MessageBus y derivados) y por CQRS y EventSourcing.

También empecé a utilizar Git y, poco a poco, voy creando proyectos específicos en Github (como [messaging](https://github.com/franiglesias/messaging), [event sourcing](https://github.com/franiglesias/eventsourcing) y, últimamente, [image](https://github.com/franiglesias/image)).

Objetivamente esto puede ser demasiado para la aplicación que tengo entre manos (o no), pero también me di cuenta de que sería la única forma de, por un lado, mejorarla significativamente y, por otro, convertirme en un programador mejor y con más posibilidades de encontrar un nuevo trabajo.

Así que, en un momento dado, decidí que, definitivamente,  tenía que replantear la aplicación, pero no sabía muy bien por dónde empezar.

Por un lado, inicié un proyecto para reescribir el dominio y explorar ideas en ese sentido. Esto es lo que estoy haciendo en [milhojas](https://github.com/franiglesias/milhojas).

Pero, para una sola persona, comenzar de cero puede ser demasiado, por lo que me planteé de nuevo si podría aprovechar algo del código existente, especialmente en lo que se refiere a las vistas (un montón de páginas y plantillas). Después de darle varias vueltas, decidí que tal vez podría hacerlo, al menos en parte. Eso es lo que estoy intentando en [mh13](https://github.com/franiglesias/mh13).

Pero me gustaría explicar el proceso poco a poco, para lo cual voy a ir escribiendo varios artículos centrándome en temas específicos.

El primero de ellos tratará sobre los framework MVC y por qué deberían ser solo un detalle de infraestructura.
