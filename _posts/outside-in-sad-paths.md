---
layout: post
title: Outside in y tests de lo que puede fallar
categories: articles
tags: testing tdd design-patterns
---

Tengo que confesar que estos artículos en los que intento volcar mi proceso de pensamiento cuando desarrollo son muy duros de escribir. 

Es difícil determinar el nivel de detalle al que debes bajar para que el artículo sea interesante y aporte información, sin resultar un aburrimiento total. En general, lo más interesante es el razonamiento tras cada decisión. El código es lo fácil y, en último término, es lo que menos importancia tiene.

Además, la mente va mucho más rápido de lo que soy capaz de escribir. Tanto, que algunas veces más que razonar sobre lo que voy a hacer, tengo que razonar sobre lo que he hecho, porque con frecuencia me doy cuenta de que aplico ciertas ideas casi de forma intuitiva. Pero, ciertamente, poner en palabras ese proceso mental es difícil e incluso exasperante.

## Vertical Slice Architecture y tests

En los dos artículos anteriores me he centrado mucho en las técnicas para crear dobles de test para reducir el acoplamiento entre tests e implementaciones en el código. Es una digresión sobre el proyecto de aplicar Vertical Slice Architecture y podrías decir que me estoy alejando mucho del propósito de la serie.

Lo cierto es que estos artículos son una demostración práctica de las ventajas e inconvenientes de aplicar el enfoque VSA.

En el lado positivo hay que conceder la libertad que supone tener un ámbito de trabajo muy limitado, sin dependencias entre áreas distintas aunque próximas del código. Esto nos permite, por ejemplo, introducir objetos muy especializados que, en consecuencia, son muy pequeños, fáciles de definir, testear y, también, fáciles de doblar.

Es como si dividieses el desarrollo en múltiples pequeñas aplicaciones superespecializadas, sin necesidad de elaborar complejos modelos del negocio.

Esta forma de abordar el desarrollo puede resultar muy extraño para algunas personas que sienten que un sistema de software necesita tener una representación muy completa del dominio y que esta debe ser la misma para toda la aplicación. O dicho con un ejemplo: si esto modelando un sistema de envío de propuestas de charlas para una conferencia, la entidad Proposal debe ser la misma para todo el sistema.

Sin embargo, lo que VSA nos dice es: ¿para qué necesitas eso? Usa lo mínimo que necesites para cada feature o caso de suo. Y, en parte, no le falta razón porque, siendo honestas, mucho del software que estamos escribiendo en este momento sufre de un exceso de complejidad debido a nuestro intento de usar grandes modelos generales con arquitecturas complejas para tareas que se pueden resolver sin muchos problemas usando _transaction script_ y poco más porque básicamente consisten en mover datos de un lugar a otro.

¿Y qué hay de lo negativo de la VSA? Como el proyecto de _Call for Papers_ es muy sencillo, al menos de momento, no están aflorando demasiados problemas. Pero los que empiezan a aparecer tienen cierta importancia.

Si bien es cierto que cada feature o caso de uso es muy sencillo, a poco que queramos tener un código mantenible y fácilmente testeable tenemos que introducir bastantes objetos, y esto lleva a problemas de organización. Están mezcladas tecnologías del mundo real con lógica de la aplicación y las reglas de negocio quizá no queden adecuadamente expresadas como resultado.

Así que, por un lado, encuentro valor en la separación por casos de uso y la idea de minimizar la complejidad de los diseños, pero me preocupa un poco la estructura interna de esos casos de uso. VSA aboga por aumentar el acoplamiento _dentro_ de los mismos, pero no sé hasta qué punto podemos admitir que ese acoplamiento nos obligue a acoplarnos con tecnologías concretas.

Con todo, los modelos complejos en forma de entidades y agregados tienen más valor en el momento de la escritura. Su responsabilidad es garantizar que las invariantes y reglas de negocio se mantienen y que los datos que el sistema va a manejar se guardan de forma consistente. Si esto ocurre así, las lecturas deberían ser bastante triviales. Esto es: no tengo que vigilar que se mantengan las invariantes si he guardado correctamente los datos. Gracias a eso, podemos utilizar modelos mucho más simples en los casos de uso de lectura, básicamente queries a vistas limitadas de la base de datos.

## Más outside-in

En el artículo anterior sobre tests de los _sad paths_ o casos en los que algo falla, procedimos desde dentro hacia afuera, lo que tiene tanto ventajas como inconvenientes. Una ventaja ha sido centrarnos en tests unitarios y no emplear tiempo en los tests Gherkin, que luego son más lentos de ejecutar. Un inconveniente es precisamente que no se reflejan las circunstancias problemáticas en lo que tendrían que ser tests de aceptación.

Así que para `SendProposal` vamos a volver a la disciplina de outside-in y empezar por los tests más externos. `SendProposal` es un caso de uso de escritura y es donde tendrían que garantizarse las reglas de negocio e invariantes y donde más sentido tendría usar un modelo más complejo... si es que fuese necesario.

En cuanto a la escritura de tests de aceptación, hay que considerar qué casos vamos a cubrir. Intentaré explicarme con un ejemplo simple.

Desde el punto de vista del negocio podríamos expresar el siguiente requisito: solo se aceptan propuestas completamente cumplimentadas. ¿Quiere decir que tendríamos que testear todos las posibles combinaciones de campos no cubiertos para la aceptación? Pienso que no, podría bastarnos con un test en el que todos los campos estén vacíos y verificar que se informa del error y se devuelve información suficiente. Esto es porque desde el punto de vista de la posible consumidora de esta aplicación tiene valor que en caso de no rellenar correctamente la propuesta se reciba un mensaje informando de la circunstancia y de la forma de corregir el problema. Sin embargo, no es tan importante el detalle minucioso.

Lo mismo ocurriría en caso de error atribuible al sistema. Aunque en ese caso, el mensaje debería indicar que se puede intentar de nuevo, con los mismos datos.

Sin embargo, es posible que tengamos que testear unitariamente el error en cada campo, con el fin de obtener la resolución adecuada y garantizar que se cumplen las reglas de negocio propias de cada uno de los datos que necesitamos. Por otro lado, ¿esta validación es solo sintáctica o también semántica? 

En el primer caso, podría tener razón de ser que ocurra solo en el controlador, evitando invocar el caso de uso si la request no cumple los requisitos. Pero en el segundo caso, es una validación de negocio y debería ocurrir en otra parte, por ejemplo, cuando instanciamos el objeto Proposal.

Y aquí es donde seguir o no VSA puede influir en la decisión. Si la validación que ocurre en controlador es la misma que la que podría ocurrir en el Handler podríamos omitir esta última, pues ya sabemos implícitamente que la regla de negocio ha sido forzada por el controlador. Esto sería posible porque no vamos a compartir el objeto Proposal de esta feature con ninguna otra... O no. ¿Acaso no podríamos invocar el caso de uso desde otra interfaz, como un comando en la consola? ¿Y si en caso de error del sistema tuviésemos algún tipo de _waiting room_ para rescatar request que son correctas, pero que no se pueden guardar por problemas con la base de datos, que son relanzadas por algún worker o consumer?

Es decir: ¿seguimos el mantra de VSA de evitar reutilizar código? ¿Podemos plantear tener diversos puntos de entrada a una misma feature? ¿Cómo organizamos el código en ese caso?

Me estoy yendo un poco por las ramas, pero estas preguntas van surgiendo a medida que intento decidir qué necesito hacer a continuación. Son problemas del futuro, si es que ese futuro llega.

Así que volvamos a los tests de aceptación.

## Features, escenarios y bugs

No es fácil desarrollar una feature o historia de usuario de forma completa, en parte porque puede ser difícil definir esa completitud. Una de las cosas que asumimos por defecto es que todo irá bien. Pero la realidad es que pueden darse muchos problemas que acaban catalogados como bugs.

Tal como está ahora `SendProposal` no se produce ninguna validación, así que es posible introducir Propuestas en el sistema que están incompletas. O también es posible que algo falle y no se pueda guardar. Este problema no se manifestará hasta que vayamos a leer las propuestas existentes, así que posiblemente se reportarán bugs si el sistema está en producción.

Pero, obviamente, sabemos que esas prestaciones están ausentes. No es que algo funcione mal, es que simplemente no se ha desarrollado la parte de la aplicación que se ocupa de evitar esos problemas. Pero, ¿Es esto una feature?

En lenguaje de BDD no es una feature, sino un escenario. Es decir: la feature es la capacidad de enviar propuestas a una conferencia y pueden darse diversos escenarios. Por supuesto, el escenario de que todo el proceso ha ido bien y la propuesta ha sido registrada correctamente. Pero también el escenario de que algo ha fallado y, o bien la autora tiene que repetir el intento, o bien el sistema no funciona. Y. en ambos casos, hay que definir el comportamiento.

Cuando el comportamiento en un escenario no está definido no podemos hablar propiamente de bugs, sino de un desarrollo pendiente. Sin embargo, cuando el comportamiento esperado está definido es cuando podemos decir que el sistema no funciona como se espera y entonces sí tenemos un bug.

Pero bueno, como sabemos "todo lo que no funciona es un bug".

Toda esta introducción para decir que nuestro siguiente paso es definir un escenario que represente una situación adversa. Y como señalamos hace un buen rato, vamos a empezar por aquella situación en la que los datos se envían vacíos o incorrectos y esperamos un mensaje de error adecuado.

