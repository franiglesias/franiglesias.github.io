---
layout: post
title: Código mentiroso (2) más ejemplos
categories: articles
tags: design-principles refactoring php
---

Este artículo es una continuación del anterior sobre [Código mentiroso](/codigo_mentiroso), y en él tocaremos algunos problemas derivados del uso insuficiente de las posibilidades expresivas del lenguaje.

Más que código mentiroso, habría que hablar de código inexpresivo o ambiguo, que puede llevarnos a una interpretación errónea de sus intenciones, especialmente en situaciones de herencia en las que no quedaría bien claro qué comportamiento debe mantenerse común a la jerarquía de clases y qué comportamiento debe reimplementarse en las clases derivadas.

## Constantes cambiantes

Como su nombre indica, una constante es algo que no cambia, menos cuando lo hace.

Consideremos el siguiente código:

```php
abstract class Car
{
    protected const HAS_ABS = false;

    public function break() {
        if(!self::HAS_ABS) {
            echo 'Blocked. Crash!!!!';
            return;
        }
        echo 'Securely braking';
    }
}

class OldCar extends Car {
    protected const HAS_ABS = false;
}

class ModernCar extends Car {
    protected const HAS_ABS = true;
}

$car = new OldCar();
$car->break();
echo PHP_EOL;

$newCar = new ModernCar();
$newCar->break();
echo PHP_EOL;
```

¿Cuál es rel resultado? Pues "pa'bernos matao":

```php
Old car: Blocked. Crash!!!!
New car: Blocked. Crash!!!!
```

El primer problema viene por el mal uso de `self`, en lugar de `static`. Con `self`, el método `break` utiliza la constante definida en la misma clase abstracta pasando olímpicamente de la definida en sus hijas.

Esto se soluciona usando `static`, lo que activa el _late static binding_ y garantiza que se tire de la constante definida en la misma clase, obteniendo el resultado esperado:

```php
Old car: Blocked. Crash!!!!
New car: Securely braking
```

Pero, ¿y el atributo de visibilidad de la constante? Resulta que no sirve para nada, por muy `protected` que sea la constante, la clase hija no la ve, salvo que la usemos con `static`. Si en lugar de una constante hubiésemos definido una propiedad protegida este problema no se daría.

¿Qué tenemos entonces? Que el uso de la constante produce dos tipos de interferencia:

* **Semántica**: una constante es algo que no debe cambiar, ergo, si cambia no es constante.
* **Técnica**: el uso de las constantes de las clases hijas está condicionado por el modo en que las llamamos.

Solución: no uses constantes si necesitas que las clases hijas las sobreescriban.

Y si quieres que las propiedades sean inmutables en el ámbito de una clase e invisibles desde el exterior, hazlas privadas y no expongas ni _getters_ ni _setters_.

```php
abstract class Car
{
    protected $hasAbs = false;

    public function break() {
        if(!$this->hasAbs) {
            echo 'Blocked. Crash!!!!';
            return;
        }
        echo 'Securely braking';
    }
}

class OldCar extends Car {
    protected $hasAbs = false;
}


class ModernCar extends Car {
    protected $hasAbs = true;
}

$car = new OldCar();
echo 'Old car: ';
$car->break();
echo PHP_EOL;

$newCar = new ModernCar();
echo 'New car: ';
$newCar->break();
echo PHP_EOL;
```

## Sin decirte nada te lo digo todo

A lo mejor no es exactamente un caso de código mentiroso, pero el código insuficientemente expresivo puede generar confusión.

Una clase declarada como _abstracta_ es una clase que estamos obligados a extender, porque no se puede instanciar directamente. Puedes pensar en ella como si fuese una interfaz en la que es posible implementar algún comportamiento, así como declarar métodos que no sean públicos.

```php
abstract class Store
{
    public function getInventory(Criteria $criteria)
    {
        $this->getStocks();
        $this->filterData($criteria);
        $this->cleanResult();
    }

    protected function getStocks()
    {
    }

    protected function filterData(Criteria $criteria)
    {
    }

    protected function cleanResult()
    {
    }
}
```

Curiosamente, esta clase abstracta no tiene ningún método abstracto, lo que indicaría que sobreescribir cualquiera de ellos es opcional, incluso el método `getInventory` que, por su parte, es el único que está implementado. Eso sugiere que su función sería la de orquestar el orden en que se ejecutan los otros tres métodos: un patrón _template_, sin ir más lejos.

En fin, para utilizar esta clase abstracta hay que extenderla y, suponemos, sobreescribir los métodos `getStocks`, `filterData` y `cleanResult` si fuese necesario. Pero claro, nada impide dejar de implementarlos y tampoco se impide reimplmentar `getInventory`.

¿No podría ser todo un poco más claro?


```php
abstract class Store
{
    final public function getInventory(Criteria $criteria)
    {
        $this->getStocks();
        $this->filterData($criteria);
        $this->cleanResult();
    }

    abstract protected function getStocks()
    
    abstract protected function filterData(Criteria $criteria)

    abstract protected function cleanResult()
}
```

En resumen, podemos declarar los métodos como `final` o como `abstract` para definir cómo deben interpretarse en las clases derivadas:

* **final** hace que el método no se pueda sobreescribir en las clases hijas, protegiendo el comportamiento que todas han de compartir. Si el comportamiento de este método puede o debe cambiar en las clases hijas, elimina el `final`, pero plantéate si `getInventory` no debería ser un método `abstract`.
* **abstract** obliga a los descendientes a implementar ese método.

## Excepciones mentirosas

Un mal uso de las excepciones también puede dar lugar a situaciones de código mentiroso. Al igual que en el apartado anterior, el problema estaría en que el código no exprese completamente las intenciones del autor original, causando dificultades para entenderlo y modificarlo.

### Café para todos

Las excepciones se utilizan para señalar situaciones problemáticas que necesitarían una atención especial. Cuando se detecta una de esas circunstancias se lanza una excepción que puede, o bien detener la ejecución, o bien ser capturada en un bloque `try/catch` para su tratamiento.

Ahora bien, examinemos estos dos ejemplos:

```php
if ($this->remoteServiceIsDown() {
	throw new \Exception('Remote service is down');
}

if ($this->incompleteData() {
	throw new \Exception('User data is incomplete');
}
```

En ambos lanzamos la misma excepción genérica, pero… ¿Necesitan ambas el mismo tratamiento?

En el primer caso, seguramente tendríamos que cancelar lo que el sistema estuviese haciendo y generar una pantalla de error que informe al usuario de que no se puede continuar y que, tal vez, pueda intentarlo de nuevo más tarde.

En el segundo caso bastaría con volver al formulario de entrada de datos señalando al usuario qué campos necesita cumplimentar pues son obligatorios.

Entonces, ¿cómo podríamos distinguir esas dos excepciones si se producen en el mismo proceso? Fíjate que lo único que las diferencia es el mensaje, que es un elemento muy volátil y puede cambiar con facilidad.

En cambio, podemos utilizar las excepciones de la [SPL](http://php.net/manual/es/spl.exceptions.php) o definir otras propias de nuestra aplicación de modo que podamos ser más explícitos sobre lo que está ocurriendo y poder actuar en consecuencia:

```php
if ($this->remoteServiceIsDown() {
	throw new \RemoteServiceException('Remote service is down');
}

if ($this->incompleteData() {
	throw new \ValidationException('User data is incomplete');
}
```

De este modo, en el bloque `try… catch` podemos manejar las excepciones esperadas de manera explícita. Eso sí, siempre debería haber un `catch` de la `Exception` genérica para capturar cualquier excepción imprevista que pueda haber llegado hasta este punto y, como mínimo, registrarla en un log o relanzarla si debe ser tratada en otro lugar.

```php
try {
	// Do the happy path
} catch (\ValidationException $e) {
	// Reload form page
} catch (\Exception $e) {
	// A very bad thing happended
	// Alert the user and stop the app
}
```
En este ejemplo, la excepción `RemoteServerException` es tratada implícitamente en el segundo `catch`.

La regla de oro podría ser:

* **Lanza** excepciones específicas y explícitas.
* **Captura** excepciones genéricas y añade bloques `catch` específicos, a medida que necesites tratar ciertas excepciones de manera especial.

### Excepciones perdidas como lágrimas en la lluvia

Si conoces los diseños _Event-Driven_, puedes pensar que las excepciones son similares a los eventos: mensajes informativos a los que ciertas partes del sistema atienden para poder actuar en consecuencia.

Sin embargo, la importante diferencia semántica es que las excepciones se limitan a advertir de problemas.

Por eso se dice que las excepciones no se deben utilizar para controlar el flujo. Es decir, las excepciones no son señales que podamos lanzar entre partes del sistema para que ciertas cosas se pongan en marcha y otras se detengan. Para eso, deberás montar un sistema de mensajería de aplicación basado en eventos. 

La gestión de excepciones busca solventar de algún modo cualquier situación problemática. En algunos casos deteniendo la aplicación y, en otros, repitiendo acciones o solicitando nueva información.

Pero claro, ocuparse de lo que va mal da trabajo y, a veces, una excepción puede ser molesta:

```php
try {
	// Do the happy path
} catch (\Exception $e) {
}
```

Efectivamente, un bloque `try/catch` que captura cualquier `Exception` y no hace nada con ella. Ni tan siquiera registrala en el log.

Esto quiere decir que pueden haber pasado cantidad de cosas entre malas y malísimas y no te has enterado de ninguna de ellas. Las motivaciones para hacer esto podrían ir desde un "en este momento no quiero que me molesten con problemas" al "escondamos la porquería debajo de la alfombra".

Como dijimos antes, como mínimo registra la excepción aunque no hagas nada con ella o relánzala para que pueda ser capturada en otro momento.

## Múltiples fuentes de verdad

En general, estamos de acuerdo en que la duplicación es un buen heurístico para comenzar a generalizar algoritmos y refactorizar código. Sin embargo, a veces olvidamos que la información también puede provocarnos más de un problema si está duplicada.

Puede haber razones muy justificadas para esta duplicación, ya sea de la información en sí, ya sea de su estructura. Por ejemplo:

* La configuración de una aplicación mantiene la misma estructura en los distintos entornos (desarrollo, testing, producción), aunque con contenidos distintos (por ejemplo, el `parameters.yml` de Symfony). El problema es estar seguros de que accedemos a la versión correcta desde cada entorno.
* Cierta información que se guarda en soportes lentos podría cachearse para tener un acceso más rápido. Obviamente es necesario que haya momentos en que se sincronice. Aquí el problema es saber a qué versión estamos accediendo y ser coherentes por si no está sincronizada.

Pero lo que está muy claro que es necesario que haya un único punto de acceso a esa información de modo que se utilice la versión correcta o que se sincroniza cuando debe. De ese modo, de cara a quien la consume, la información solo tendrá una fuente de verdad.

Sin embargo, otros casos de esta problemática son más cotidianos y pequeños, aunque sus efectos pueden ser bastante importantes.

Supongamos que la ruta del archivo de configuración de una aplicación está definida en múltiples sitios del código (una docena o más), además de que hay que tener en cuenta el entorno y, tal vez, alguna otra variante.

Ahora supongamos que hemos decidido cambiarla. Habría que buscar todas sus ocurrencias y podríamos encontrarnos, incluso, con que en algunos puntos no está *hardcoded*, sino que la ruta es calculada, con lo cual no tenemos forma de buscarla, salvo que sepamos dónde se necesita creando muchas oportunidades de dejar alguna copia olvidada.

En resumidas cuentas: las múltiples fuentes de verdad mal gestionadas pueden provocar que tengamos información que es falsa en el contexto concreto desde el que acudimos a ellas.

## PHP, ¿un lenguaje mentiroso?

Gracias a PHP 7 tenemos muchas menos excusas para permitir que nuestro código sea mentiroso, pero los riesgos en que nos pone el lenguaje son altos: el tipado flexible, la mutabilidad y otras características nos obligan a programar con rigor y hacer explícitas muchas cosas que, en otros lenguajes, vienen de serie.

Pero es importante estar pendientes de estas cosas. El problema con el código mentiroso es que miente a cualquiera, empezando por nosotros mismos, contribuyendo a que sea difícil de entender y de mantener.

