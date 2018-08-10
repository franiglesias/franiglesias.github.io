El control de calidad de software es una disciplina muy amplia y, hasta ahora, en este blog nos hemos ocupado principalmente del test unitario, que es uno de los muchos niveles o tipos de tests que podemos utilizar.

Así que, en esa ocasión, me gustaría echar una mirada más general, para situar las cosas en contexto.

## Taxonomía de tests

Los tests de software se pueden agrupar en dos grandes categorías globales:

* Tests funcionales
* Tests no funcionales

### Tests funcionales

Los tests funcionales se refieren a los tests que prueban que el software hace aquello para lo que ha sido diseñado. Esto es, por ejemplo, una aplicación para gestionar la venta de productos de segunda mano permite a sus usuarios comprar y vender artículos de segunda mano y todo lo que eso conlleva, como dar de alta productos con sus precios, descripciones y fotos, contactar con vendedores y compradores, gestionar pagos, etc.

Esto se puede probar a varios niveles, a saber:

* **Tests unitarios**: probando las unidades básicas en que está organizado el software funcionando de manera aislada.
* **Tests de integración**: probando conjuntos de unidades básicas que están relacionadas entre sí, para comprobar que sus relaciones funcionan correctament.
* **Tests de aceptación**: probando los puntos de entrada y salida del software para comprobar que su comportamiento es el definido por los stakeholders (quienes están interesados en su uso)

Estos tres niveles componen la llamada "pirámide de tests" que comentaremos posteriormente.

Además de los anteriores, entre los tests funcionales también consideramos:

* **Tests de regresión**: son tests que pueden detectar las consecuencias de los cambios que hayamos podido realizar en el software que nos llevan a un comportamiento no deseado. Se puede decir que todos los tipos de tests son tests de regresión en tanto que una vez que hayan pasado correctamente fallarán si se realizan cambios en el software que alteren el comportamiento esperado.
* **Tests de caracterización**: son tests que se escriben cuando el software no tiene otros tests y normalmente se crean ejecutando el software bajo unas condiciones determinadas y observando el resultado que arroja. Ese test se utiliza como red de seguridad para realizar cambios y también mejores tests.

### Tests no funcionales

Los tests no funcionales se refieren a cómo funciona el software. Al margen de que ofrezca una funcionalidad, es necesario que el software ofrezca una fiabilidad, capacidad de respuesta, etc, algo que es transversal a todo tipo de aplicaciones y que se puede medir de diversas maneras. Estos tests prueban cosas como:

* **Velocidad**: Nos dice si el software devuelve resultados en el tiempo deseado.
* **Carga**: Nos dice si puede soportar un volumen de trabajo determinado, lo cual puede tener diversas medidas: conexiones simultáneas, volumen de datos que puede procesar de una sola vez, etc.
* **Recuperación**: Nos dice si un sistema es capaz de recuperarse correctamente en caso de fallo.
* **Tolerancia a fallos**: Nos dice si el sistema reacciona correctamente si se producen fallos en otros sistemas de los que depende.

## La pirámide de tests funcionales

La pirámide de tests funcionales es un heurístico para decidir la cantidad de tests de cada nivel que realizamos.

La idea es algo más o menos así:

* Test unitarios: están en la base de la pirámide y deberíamos tener muchos
* Test de integración: están en la parte media de la pirámide y deberíamos tener menos
* Test de aceptación: están en lo alto de la pirámide y deberían ser pocos

O dicho de otra forma:

Dada una feature de nuestro software tendríamos:

* Unos pocos tests de aceptación que cubran los escenarios definidos por los stakeholders.
* Un número mayor de tests de integración que aseguren que los componentes del sistema funcionan correctamente en interacción y que saben reaccionar a los fallos de los demás.
* Un gran número de tests unitarios que nos aseguren que las unidades de software hacen lo que se espera de ellas y son capaces de manejar las distintas condiciones de entrada, así como reaccionar correctamente en caso de entradas no válidas.

Pero, ¿por qué?

### Muchos tests unitarios

Los tests unitarios, al centrarse en una sola unidad de software en aislamiento, deberían ser:

* **Fáciles de escribir**: una unidad de software debería tener que manejar relativamente pocas casuísticas y reaccionar ante problemas de una forma sencilla, normalmente lanzando excepciones.
* **Rápidos**: en caso de haber dependencias estas estarían dobladas por objetos más sencillos y menos costosos, permitiendo que la ejecución de los tests sea muy rápida.
* **Replicables**: podemos repetir los tests cuantas veces sea necesario, obteniendo los mismos resultados si el comportamiento de la unidad de software no ha sido alterado.

Estas condiciones nos permiten hacer cosas como:

* Ejecutar los tests cada vez que hagamos un cambio en el software, lo que nos proporciona feedback inmediato en caso de cualquier alteración del comportamiento.
* Puesto que los tests prueban una unidad concreta de software en un escenario específico, si fallan obtenemos un diagnóstico inmediato del problema y dónde se ha producido.

Por estas razones, lo lógico es tener muchos tests unitarios que puedan ejecutarse rápidamente muchas veces al día, en el momento de enviar commits, en el momento de desplegar, etc.

¿Más es mejor? Como en tantos aspectos de la vida, más no es necesariamente mejor, pero nos interesa que entre todos los tests de una unidad de software se cubran todas las casuísticas relevantes, de modo que cuando uno de ellos falla podamos saber qué cambio concreto hemos realizado que ha provocado el problema.

