---
layout: post
title: Polimorfismo y extensibilidad de objetos
categories: articles
author: [Fran Iglesias]
tags: design-principles
---

En Programación Orientada a Objetos el **polimorfismo** es una característica que nos permite enviar el mismo mensaje, desde el punto de vista sintáctico, a distintos objetos para que cada uno de ellos lo realice con un comportamiento específico.

En la práctica, eso significa que si disponemos de varios objetos que tienen un mismo método con la misma signatura podemos usar el mismo código para invocarlos, sin necesidad de preguntarles por su clase previamente.

El ejemplo clásico es el de un programa de dibujo en el que se manejan distintos tipos de formas. Cada forma se define mediante una clase con un método para dibujarla (por ejemplo, `draw`) que cada una ejecuta de distinta manera. Se recorre la lista de objetos activos y se va pidiendo a cada uno que se dibuje sin que tengamos que preocuparnos de saber de antemano de qué clase es.

Otro ejemplo: todos los empleados de una empresa son de la clase **Empleados**, pero pueden desempeñar distintos puestos, que definen responsabilidades, salarios, beneficios, etc. Cuando les pedimos que trabajen cada uno hace lo que le corresponde.

Algunos autores sobre Programación Orientada a Objetos dicen que cuando hacemos una llamada a un método de un objeto le enviamos un mensaje para que se ponga a ejecutar alguna tarea, de ahí nuestra primera definición. Al decir que es el mismo mensaje desde el punto de vista sintáctico queremos decir que es una llamada a métodos con el mismo nombre que cada objeto puede interpretar de manera más o menos diferente (punto de vista semántico).

Pongamos por ejemplo la gestión de una biblioteca. Supongamos que tenemos las clases `Book` y `Review` y que ambas definen el método `lend()` para indicar que son prestadas. Entonces es posible escribir un código similar a este:

```php
$objects = array(
    new Book('Programar en PHP', 'Pepe Pérez'),
    new Review('PHP monthly review', 'Springer', 'May 2014')
);
foreach($objects as $theObject) {
    $theObject->lend();
}
```

Sencillamente, tenemos una lista de objetos que quire retirar un lector. Vamos recorriendo la colección uno por uno invocando el método `lend`, y no tenemos que comprobar su tipo, simplemente les decimos que "sean prestados". Aunque los objetos son distintos ambos pueden responder al mismo mensaje.

Hasta cierto punto, para los programadores en PHP esto no debería resultar muy sorprendente, pero los programadores de otros lenguajes se removerían inquietos en sus asientos, así que hay que hacer un intermedio para hablar un momento acerca de los tipos de datos en los lenguajes.

## Tipado estricto vs tipado débil

El sistema de tipado de PHP permite que podamos reutilizar una misma variable para distintos tipos de datos. Es decir, comenzamos usando una variable de tipo `int`, pero posteriormente podríamos introducir un dato de tipo `string`. El intérprete se encarga de, sobre la marcha, decidir el tipo de dato que puede manejar y, si es necesario, lo convierte. PHP es lo que se conoce como un lenguaje de **tipado débil**.

Otros lenguajes tienen **tipado estricto**. Esto quiere decir que las variables deben declararse con su tipo para que el intérprete o compilador reserve el espacio de memoria adecuado. Además, una vez definida una variable, esta solo puede usarse para almacenar valores de ese tipo o que hayan sido explícitamente convertidos a ese tipo. De este modo, si intentas guardar un `string` en una variable `int`, saltará un error.

Por esa razón, el polimorfismo en los lenguajes de tipado estricto resulta especialmente llamativo, ya que con el tipado estricto no podríamos declarar una variable de tipo `Book` para empezar y luego asignarle un valor de tipo `Review` como se hace en el código anterior. El polimorfismo, por tanto, implica que el sistema de tipos se relaja.

Por otro lado, en los lenguajes de tipado estricto también deben declararse los tipos de los argumentos de las funciones y, consecuentemente, los tipos de los argumentos de los métodos. Esto es muy bueno, porque nos proporciona un primer medio de control de que los datos que se pasan son válidos. Si intentamos pasar un argumento de un tipo no indicado para la función el intérprete o compilador nos lanzará un error.

Precisamente, PHP ha incorporado esa característica, denominada *Type Hinting* en las llamadas a funciones y métodos, pero solo para objetos y, gracias a ello, podemos declarar el tipo de objeto que pasamos como argumento a una función o método. Su uso no es obligatorio, pero como beneficio directo tenemos esa primera línea de validación de datos que, más adelante, veremos como explotar a fondo.

Sin embargo, ¿cómo es posible que el tipado fuerte o, en su caso, el *type hinting* permitan el polimorfismo?

Pues a través de mecanismos que permiten que una clase pueda responder como si, de hecho, fuese de varios tipos simultáneamente. Estos mecanismos son la herencia y las interfaces.

A través de la **herencia** podemos derivar unas clases a partir de otras, de modo que las clases "hijas" también son del mismo tipo que sus clases padres y, de hecho, que todos sus ascendientes.

Las **interfaces** nos permiten que las clases "se comprometan" a cumplir ciertas condiciones asumiendo ser del tipo definido por la interfaz. Es habitual referirse a esto como un _contrato_. El cumplimiento del mismo es asegurado por el intérprete de PHP que lanza un error si la clase no implementa correctamente la interfaz.

En ambos casos nos queda garantizado que los objetos instanciados serán capaces de responder a ciertos métodos, que es lo que nos interesa desde el punto de vista del código cliente, aparte de respetar la integridad del sistema de tipado.

En el caso de la herencia, se consigue por el hecho de que las clases base ya ofrecen esos métodos incluso aunque no estén definidos en las clases hijas. En el caso de las interfaces, el contrato obliga a las clases a implementar esos métodos. El resultado es que el código cliente puede confiar en que cabe esperar ciertos comportamientos de los objetos que utiliza.

## Herencia

La herencia es un mecanismo para crear clases extendiendo otras clases base. La nueva clase hereda los métodos y propiedades de la clase base que extiende, así que ya cuenta con una funcionalidad de nacimiento.

Normalmente, utilizaremos la herencia para crear especializaciones de una clase más general. Es decir, no extendemos una clase para conseguir que la nueva contenga métodos de la clase extendida, sino que lo hacemos porque la nueva clase es semánticamente equivalente a la clase base, pero más específica o concreta. Por ejemplo, podemos tener una clase que gestiona la conexión genérica a una base de datos y extenderla con varias clases hijas para manejar drivers específicos (MySQL, SQLite, Postgre, MongoDB, etc.).

La nueva clase puede tener nuevos métodos y propiedades, o bien puede sobreescribir los existentes, según sea necesario. Como resultado tenemos una clase nueva, que además de por su propio tipo, puede ser identificada por el mismo que su "clase madre" aunque se comporte de manera diferente.

Retomamos la reflexión sobre el sistema de biblioteca. Resulta que ella no solo hay libros, sino revistas, discos, películas y otros medios disponibles para los usuarios. Podríamos crear clases para cada tipo, pero ¿cómo asegurarnos de que todas van a poder responder a los métodos necesarios?. Examinando la cuestión nos damos cuenta de que todas ellas podrían ser *hijas* de una clase más general, una *superclase*, que vamos a llamar `Media`. De esta manera los libros serían `Media`, así como las revistas, los discos o las películas.

La clase `Media` podría aportar algunos métodos y propiedades comunes, y cada clase descendiente realizar algunas cosas de manera un poco diferente. Por ejemplo, los libros se suelen identificar con autor y título, las revistas por título y número, las películas por título, etc.

Un ejemplo de otro ámbito es el de los vehículos. La clase de los vehículos engloba motocicletas, turismos, furgonetas, camiones, autobuses, etc. Existen ciertas propiedades comunes que pueden adoptar valores diferentes. Todos los vehículos tienen ruedas: algunos dos, otros cuatro, otros más. Todos tienen motor, que puede ser de diferentes cilindradas y potencias. Todos tienen un número de plazas además del conductor o tienen una capacidad de transporte de mercancía. Incluso dentro de cada subtipo de vehículo podríamos establecer más especializaciones, creando una jerarquía de clases cuya base es `Vehículo` y, de hecho, todas las subclases siguen siendo igualmente `Vehículos`. O lo que es lo mismo, cada clase es, a la vez, esa clase y todos sus ancestros hasta la clase base.

Con todo, las jerarquías de clases no deberían ser muy largas o profundas.

Por otro lado, las jerarquías de clases deberían cumplir el **principio de sustitución de Liskov**, que es uno de los principios SOLID, y que dice que las clases de una jerarquía deberían ser intercambiables.

## Interfaces

La herencia como forma de extender objetos tiene varios problemas y limitaciones. Al principio parece una prestación espectacular, pero intentar resolver todas las necesidades de polimorfismo con Herencia nos lleva a meternos en muchos líos.

Por ejemplo, podemos empezar a desear que una clase pueda heredar de varias otras simultáneamente. O también podríamos querer que una clase descienda de otra determinada solo para poder pasarla a un método y que supere el *type hinting*. Este uso de la herencia acaba violando varios de los principios SOLID, en especial el de Liskov y el de segregación de interfaces.

Para lograr eso respetando los principios SOLID tenemos las interfaces.

Las interfaces son declaraciones similares a las clases que solo contienen signaturas de métodos públicos, sin ningún código ni propiedades, aunque pueden definir constantes. Las clases que implementan la interfaz se comprometen a implementar esos métodos respetando la signatura definida. En otras palabras: es un contrato de obligado cumplimiento.

Una clase puede implementar varias interfaces, lo que respondería a esa necesidad de la herencia múltiple. Y, por otra parte, dos o más clases pueden implementar la misma interfaz aunque no tengan ninguna otra relación semántica entre ellas.

Por ejemplo, podríamos tener una interfaz para clases que puedan escribir en un log.

```php
interface Loggable {
     public function log($message);
     public function write();
}

class Emailer implements Loggable
{
    private $messages;
    public function log($message)
    {
         $this->messages[] = $message;
    }

    public function write()
    {
        foreach ($this->messages as $message) {
            // Write message to email.log file
        }
        $this->messages = array();
    }
}

class DataBase implements Loggable
{

    private $messages;

    public function log($message)
    {
        $this->messages[] = $message;
    }

    public function write()
    {
        foreach ($this->messages as $message) {
            // Write message to database.log file
        }
        $this->messages = array();
    }

}

class Logger
{
    private $objects;

    public function register(Loggable $object)
    {
        $this->objects[] = $object;
    }

    public function write()
    {
        foreach ($this->objects as $object) {
            $object->write();
        }
    }
}
```

Todas las clases que quieran ser `Loggable` deberán implementar un método `log` que espera un parámetro `$message` y un método `write` que escribirá los mensajes existentes en un archivo. El archivo de log concreto en que se escribe es cosa de cada clase, pero al definirlo así las clases están obligados a implementar los métodos cada una según sus necesidades. A la vez, podemos ver que no hay otra vinculación entre las clases, que pueden evolucionar de forma completamente independiente.

Es más, en unos casos el objeto podría escribir el mensaje a un archivo, otro objeto podría enviar un email y otro objeto escribir en una base de datos. Sencillamente, la interfaz declara que los objetos de tipo `Loggable` deben poder tomar nota de un mensaje (método `log`) y deben poder "escribirlo" posteriormente de acuerdo a sus propios propósitos o necesidades (método `write`).

Para indicar que una clase implementa una interfaz la declaramos asi:

```php
class Example implements Interface {}

class Emailer implements Loggable {}
```

Si se implementan varias interfaces ser haría de la siguiente manera. Por ejemplo, para que la clase `Emailer` implemente dos hipotéticas interfaces `Loggable` y `Service`:

```php
class Emailer implements Loggable, Service
{
}
```

Por otra parte, en el código de ejemplo tenemos una clase `Logger` que puede registrar objetos de tipo `Loggable` y que se encargará de actualizar los logs en una sola pasada. Para ello, sabe que los objetos registrados tendrán un método `write()` para escribir sus mensajes, sin preocuparse para nada de cuántos mensajes o de qué archivo concreto debe ser modificado. De este modo, podemos registrar tantos objetos `Loggable` como nuestra aplicación necesite.

Puesto que `Logger` no tiene que preocuparse de la manera concreta en que los objetos `Loggable` registrados realizan el método `write` resulta que en una única llamada podemos tener escrituras en diferentes archivos de logs, a la vez que otros envían un email a un administrador y otros lo registran en una tabla de una base de datos.

En el ejemplo se puede ver que hay una duplicación de código entre las clases que implementan `Loggable` (es casi el mismo código) y eso podría hacernos plantear la pregunta: ¿y no podemos hacer lo mismo con herencia?. Sí y no. Bien, si estas clases se utilizasen en un proyecto real no sería difícil darse cuenta de que tienen poco que ver una con la otra: una de ellas sería una clase para enviar emails y la otra para conectarse a una base de datos. Seguramente nos interesa que ambas tengan la capacidad de escribir logs para poder hacer un seguimiento de su actividad y detectar fallos, pero eso no es motivo para que ambas hereden de una superclase `Loggable`. Por eso usamos interfaces, aunque supongan escribir el código aparentemente común.

Las últimas versiones de PHP dan soporte a **traits**, que son una forma de reutilizar código entre diferentes clases. Un **trait** nos permite definir métodos y propiedades que luego podríamos utilizar en diferentes clases. Sin embargo, no debemos confundir eso con la idea de las interfaces. El hecho de que dos clases, como en el ejemplo, tengan algún método idéntico nos permitiría utilizar un trait para no duplicar código (el método `log` es un claro candidato en el ejemplo), pero ambas siguen teniendo que implementar la misma interfaz para beneficiarnos del polimorfismo.

Los _traits_ pueden ser útiles para aportar funcionalidad similar a clases no relacionadas, particularmente si no tiene una relación con el comportamiento de la clase. Me explico: en DDD nos suele interesar que las entidades y los agregados puedan registrar eventos que luego son recolectados para enviarlos a través de un event dispatcher. Un _trait_ nos permitiría incorporar la funcionalidad necesaria para gestionar los eventos sin necesidad de "contaminar" la clase con los detalles técnicos. 
