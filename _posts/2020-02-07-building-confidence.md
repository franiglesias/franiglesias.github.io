---
layout: post
title: Construir confianza en el código, test a test
categories: articles
tags: testing, good-pratices
---

En general, cuando creamos software, confiamos en que haga aquello para lo cual lo hemos programado. Es un poco de perogrullo, pero es también evidente que necesitamos poder tener esa confianza.

Una forma de entender esta idea de la confianza en el software es pensar que el código es una representación del conocimiento del negocio. En este caso, una representación ejecutable que produce efectos en el mundo. En este sentido, la confianza se puede equiparar a la seguridad que tenemos de que se trata de una representación lo más exacta posible.

Es decir, el conocimiento del negocio se representa mediante un modelo de conceptos y procesos que se puede expresar mediante código. El código en producción, por tanto, representaría el estado actual de ese conocimiento que tenemos del negocio como equipo u organización.

Pero esto sólo es cierto durante un pequeño intervalo de tiempo. En el mismo momento en que empezamos a pensar en la siguiente historia de usuario, estamos modificando el conocimiento del negocio y, en consecuencia, el código de producción ha dejado de expresar con total fidelidad el modelo. Si queremos que el negocio se adapte rádpidamente a los cambios, tenemos que estar constantemente reevaluando nuestro modelo mental, transformándolo y expresándolo en código.

Así que en pocas palabras: **todo código en producción es legacy**.

## Todo código en producción es legacy

El código en producción es una instantánea del conocimiento de negocio en un momento dado. Puesto que trabajamos constantemente en nuevas historias y tareas, resulta que el código de producción queda desactualizado enseguida. Es **eventualmente inconsistente**: más tarde o más temprano dejará de ser consistente con el conocimiento de negocio.

Como mucho podemos aspirar a reducir el tiempo de inconsistencia y la magnitud de la misma. Días mejor que semanas y horas mejor que días.

Para reducir ese margen de inconsistencia podemos adoptar varias estrategias. Una de ellas es la de integración y despliegue continuos, de modo que siempre mantengamos la inconsistencia en unos límites manejables. Esto también nos debería llevar a realizar despliegues ASAP (tan pronto como sea posible, varios despliegues al día), en los que los cambios deberían ser pequeños y específicos, incluso fáciles de deshacer en caso de problemas. También define las estrategias de flujo de trabajo, usando por ejemplo ramas de vida corta en el gestor de versiones: lo suficiente para añadir los cambios necesarios y verificar su funcionamiento, o incluso el desarrollo sin ramas directamente a master.

Para poder aplicar estas estrategias de despliegue es necesario contar con tests que nos ayuden a asegurar que el código representa el conocimiento del dominio de la manera más exacta psoible.

De hecho, los tests son en sí mismos una **representación alternativa del conocimiento del dominio**. De otro modo no servirían para probar el código. Y, de hecho, los tests son código también. En otras palabras: los tests son una expresión en código del conocimiento del dominio que usamos para verificar que el código de producción expresa correctamente el conocimiento del dominio.

Y, como no podría ser de otra forma, los tests serán **eventualmente inconsistentes** con el conocimiento del dominio, porque no son sino otra instantánea de su estado en un momento dado.

Así que **los tests en master son legacy también**.

## Confiar en los tests

Si usamos los tests para poder confiar en el código de producción y visto lo visto, ¿podemos confiar en los propios tests? Y si es así, ¿cómo?

La primera cuestión que nos tenemos que plantear es si consideramos los tests realmente como una representación del conocimiento del dominio y, a continuación, si esa representación es completa.

Por desgracia, es habitual que los tests de nuestros proyectos nunca representen la totalidad del conocimiento de negocio, sino tan sólo una parte. La cobertura de código nos puede dar una métrica orientativa, aunque bastante distorsionada, con la que empezar a trabajar. Lo realmente significativo sería una métrica de la cantidad de comportamientos de negocio representados en los tests.

Por eso, un primer paso en los equipos que tienen pocos o ningún test en sus proyectos es intentar subir la métrica de cantidad de tests, aunque poniendo foco en el comportamiento, o sea los casos de uso testeados, y no tanto en el code coverage, que es muy fácil de trampear.

## Evaluar la confianza de una suite de tests

Si hacemos un cambio en el código de producción y no tocamos los tests, estos sólo deberían fallar en caso de hayamos modificado el comportamiento. Por ejemplo, imagina una respuesta de un API en la que hayamos quitado un campo. Tendría que haber al menos un test que falle alertando de ese cambio. 

Obviamente lo suyo sería añadir o modificar tests, preferiblemente antes de introducir el cambio, para definir el nuevo comportamiento del código.

Si no introducimos cambios de comportamiento, la suite de tests debería ejecutarse sin problemas.

Si podemos predecir lo que va a pasar con la suite de tests en función de las modificaciones que hayamos introducido en el código de producción entonces podemos afirmar que tenemos una suite de tests fiable.

## Signos de una suite de test poco fiable

**Los cambios en una parte del código rompen tests no relacionados.** Nos estaría hablando de acoplamientos, probablemente de datos, entre tests.

**La suite es lenta.** Los tests lentos retrasan los ciclos de feedback y dificultan el desarrollo. Si a eso le unimos otros problemas, como la necesidad de pasar la suite entera ante la posibilidad de que fallen tests en lugares inesperados, nos encontramos con un entorno en el que el testing es demasiado costoso.

**Hacer un refactor implica cambiar tests.** Si al llevar a cabo un refactor, cambiar la implementación sin alterar el comportamiento, nos encontramos que varios tests dejan de pasar es muy posible que tengamos tests excesivamente acoplados al código de producción. Al contrario que el código de producción, en el que nos interesa evitar la repetición de conocimiento y es preferible reutilizar código y datos en la medida de lo posible, los tests deberían estar aislados de los demás tests. Eso implica que usen sus propios datos y sus propias configuraciones de dobles.

Si tenemos que cambiar tests es que no estamos haciendo un refactor.

**La suite de test no se ejecuta completa en una máquina desconectada de la red.** Nos indica que existen tests que hacen llamadas remotas (servicios externos, API de terceras partes). Cuando fallan, tenemos que discriminar si es debido a cambios en el código, o a las condiciones de esos servicios externos. Por tanto, los tests no nos permiten asegurar que fallan por las razones que deberían.


## Mejorar la confianza test a test

**Evitar llamadas costosas fuera del sistema,** que realizan peticiones a través de la red, reemplazando esos servicios por dobles o implementaciones fake en memoria. Es relativamente fácil implementar repositorios, colas de mensajes, sistema de almacenamiento, en memoria, aunque para eso deberás prestar atención al principio de inversión de dependencias, de modo que sea fácil reemplazar las implementaciones concretas para la situación de test. Eso contribuye a tener una mejor arquitectura, código más mantenible y flexible.

**Minimun viable dataset** para fixtures. Si se hacen tests contra base de datos, reducir la cantidad de fixtures. ¿Cuántos ejemplos necesitamos para probar suficientemente una funcionalidad? En muchos casos, nos basta con uno o dos.

**Evitar mimetizar comportamiento de dominio en dobles**. Los dobles sólo deberían hacer lo que sea específicamente necesario para ese test específico. No un Test Case, sino un test.

**Enfocar el test en comportamientos**, no intentar testear todos y cada uno de los métodos de todas y cada una de las clases, como pueden ser setters y getters, reduciendo la cantidad de tests. De hecho deberías tener pocos métodos en las clases.

**Aplicar el principio Command Query Separation en los tests**, lo hemos repetido muchas veces en el blog: un método sólo puede ser un command, provocando un efecto en el sistema, o una query, consultando y devolviendo una información del sistema.

Para testear un command simplemente miramos que se haya producido el efecto esperado. Si se ha de hacer sobre un mock, ese será el único que tenga una expectativa sobre la llamada o el efecto que testeamos.

Para testear una query miramos si nos devuelve lo esperado. No hacemos aserciones o expectativas sobre nada más.

**Reducir las expectativas de los dobles** sólo a los efectos del comportamiento de la unidad testeada.

**Eliminar lógica en los dobles**, particularmente si trata de mimetizar comportamiento de negocio. Siempre intentar el test primero con los dobles de menos conocimiento y comportamiento (dummies), luego los que tengan comportamiento fijo (stubs) y luego los que mantengan algún tipo de conocimiento (spies, mocks).

**Verificar específicamente el comportamiento deseado en un test**, de modo que cambio en otras partes del código relacionadas no le afecten. Un ejemplo es testear respuestas de API, en lugar de comparar toda la respuesta con un archivo json (que puede tener muchos campos y ser muy grande) es preferible decodificarlo y hacer una aserción sobre el campo o campos específicos que deberían haber sido afectados. De otra manera, si añades un simple campo, tendrás que cambiar todos y cada uno de los tests de ese API. Lo mismo cuando se testea sobre repuestas que devuelven objetos o entidades complejos, haz la aserción sobre métodos o propiedades específicas que sean afectadas por el método bajo test.

**Desacopla los tests del código** en todos los sentidos. Elimina expectativas en mocks para no acoplar el test a la implementación, no sigas la estructura del código de producción para organizar los tests: usa su propia organización. [Lee acerca de la contravarianza de los tests](https://www.google.com/url?sa=t&rct=j&q=&esrc=s&source=web&cd=2&cad=rja&uact=8&ved=2ahUKEwiAyZLJl8DnAhWS4YUKHXJzCS8QFjABegQIAhAB&url=https%3A%2F%2Fblog.cleancoder.com%2Funcle-bob%2F2017%2F10%2F03%2FTestContravariance.html&usg=AOvVaw3A7xoGDLThX-kcoZZ5hbbh)

**Acentúa la estructura Given When Then (Arrange Action Assert)** extrayendo esas etapas a métodos privados llamados por el test. Eso incluso te permitiría reutilizarlos en muchos casos.

**Evita technicalities en los nombres de tests**, usa el nombre del test para describir comportamiento, por ejemplo:

* testShouldCreateAClient
* testShouldFailWhenNameIsTooShort
* testShouldFailSilentlyIfCannotGenerateCommission

Evita nombres como testGivenAWhenBThenC (eso es la estructura) o testMethod (no testeamos métodos, sino comportamientos). Cuida el naming, como en todo el resto del código (¿He dicho ya que los tests son código?).

**Aisla los tests** Evita compartir fixtures y dobles entre tests. Huye de los tests dependientes, que son aquellos tests que se ejecutan con los resultados de otro. Evita también cualquier llamada fuera de los límites del sistema. Los tests han de poder ejecutarse en cualquier orden, en máquinas conectadas o no a la red y sin que haya que hacer ningún preparativo especial. Por tanto:

* Cada test debería tener sus propias fixtures o conjunto de datos propio.
* Cada test debería tener sus propios dobles.
* Usa el patrón ObjectMother para tener un lugar centralizado en el que conseguir objetos preparados para usar en tests que puedan ser de uso común (típicamente ValueObjects que sean complejos de montar).
* Usa el patrón Builder cuando necesites tener una forma sencilla de generar objetos para test con valores razonables por defecto, pero que te proporcione la flexibilidad necesaria.

**Usa objetos reales cuando sea posible** Siempre que puedas, utiliza objetos reales en los tests. Evita doblar objetos de datos y servicios que no tengan dependencias.

**Los ORM son el mal para los tests** Si no diseñas tu sistema con cuidado, los ORM se convierten en una pesadilla para los test. Recuerda que usar bases de datos relacionales es cómodo, pero introduce una gestión de los datos en paralelo a la que hace tu código. El resultado es que normalmente complicará la generación de fixtures debido la necesidad de usar muchos datos para montar casi cualquier objeto debido a los requisitos de integridad referencial. Puede generar efectos colaterales inesperados, sobre todo si intentas guardar datos en un test. En general, provoca acoplamiento y dependencia de datos y hace muy complicado hacer fakes de repositorios.

## Además

El código debería ser fácil de testear. Lo ideal es desarrollar usando Test Driven Development ya que al tener primero los tests, todo el código queda automáticamente testeado. Si no, escribe código teniendo en mente que lo vas a testear, así que utiliza buenas prácticas y patrones. En resumen: haz felices a tus tests.








