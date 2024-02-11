---
layout: post
title: Poniendo un test bajo test en PHP
categories: articles
tags: php testing
---

Explorando cómo portar la librería Golden a PHP y aprendiendo algunas cosas curiosas.

Esto que aquí ves es un test que testea un test. Parece una tontería, pero para mí ha sido todo un descubrimiento.

```injectablephp
final class VerifyTest extends TestCase
{

    #[Test]
    /** @test */
    public function shouldNotPass(): void
    {
        $storage = new MemoryStorage();

        $testCase = new class("Example test") extends TestCase {
            use Golden;
        };
        $testCase->registerStorage($storage);

        $testCase->verify("This is the subject");
        $this->assertTrue($storage->exists("Example test"));

        $this->expectException(ExpectationFailedException::class);
        $testCase->Verify("This is another output");
    }
}
```

Retrocedamos un poco.

## De qué va esto

Hace poquito publiqué una librería de Snapshot testing para Go. En parte porque quería aprender sobre el tema y también porque en el trabajo nos viene bien. La que estábamos usando (Approvals) nos genera un poco de fricción con algunas cosas y no teníamos muchas opciones para solventarlo.

No es que escribir una librería para esto tenga una gran dificultad intrínseca, pero me resultó interesante como experiencia y me obligó a aprender algunos temas de Go que nunca había tocado.

Finalmente, hemos empezado a usarla recientemente, hasta el punto de que ya hemos migrado todos los tests que lo necesitaban. Lo que más nos ha convencido ha sido la predictibilidad de los snapshots, por un lado, y que expone una interfaz fácil de usar, pero con un montón de control de todos los detalles necesarios.

Y en vista del éxito, comencé a plantearme escribir una versión para PHP.

## Una librería para cada lenguaje

La librería Golden para Go está escrita basándose en muchas características y convenciones propias de Go. Y pensando en hacer la versión PHP, me parece importante hacerlo de una forma que resulte natural para PHP.

Así, por ejemplo, PHP es un lenguaje con una orientación a objetos más clásica que la de Go y esto nos permite hacer cosas de manera diferente. Ni mejor, ni peor: diferente.

### Primer spike: imitando la librería Golden

Así, mi primer spike fue probar con funciones. Por ejemplo, una función `Verify`. El problema que tiene crear una librería de testing como Golden es que tiene que colaborar e integrarse con otras como PHPUnit. De esta forma, contribuye al recuento de tests pasados y fallados.

La forma más sencilla que se me ha ocurrido para ello es pasar el propio TestCase que se está ejecutando:

```injectablephp
function Verify(TestCase $testCase, $subject): void
{
    // Code to generate snapshot if needed    
}
```

Esto nos permite hacer aserciones usando las facilidades del TestCase, de tal manera que los resultados se incorporan a las estadísticas y el control de la ejecución del test sigue en manos de PHPUnit.

```injectablephp
function Verify(TestCase $testCase, $subject): void
{
    // Code to generate snapshot if needed
    
    $this->assertEquals($snapshot, $subject);
}
```

Una cosa que tenía clara que quería hacer era abstraer la creación de los snapshots. Esto es, en lugar de cuajar el código de Verify con toda la creación y mantenimiento de archivos de snapshot, quería tenerlo separado en un objeto responsable. Pero, ¿cómo acceder a ese objeto dentro de la función? Pues, ejem..., haciéndolo global. 

```injectablephp
global $storage;
$storage = new Storage();

function Verify(TestCase $test,  $subject): void
{
    global $storage;
    if (!$storage->exists($test->name())) {
        $storage->keep($test->name(), $subject);
    }

    $snapshot = $storage->retrieve($test->name());
    TestCase::assertEquals($snapshot, $subject);
}
```

La alternativa sería pasarlo en cada invocación, pero hace que la firma de la función empiece a arrastrar muchas cosas y se hace inconveniente.

```injectablephp
function Verify(TestCase $test, Storage $storage, $subject): void
{
    if (!$storage->exists($test->name())) {
        $storage->keep($test->name(), $subject);
    }

    $snapshot = $storage->retrieve($test->name());
    TestCase::assertEquals($snapshot, $subject);
}
```

El testing también tiene sus complicaciones. Vamos por partes:

```injectablephp
final class VerifyTest extends TestCase
{
    #[Test]
    /** @test */
    public function shouldPass(): void
    {
        Verify($this, "This is the subject");

        try {
            Verify($this, "This is another output");
        } catch (ExpectationFailedException $exception) {
            return;
        }

        $this->fail("Verify should fail");
    }

}
```

El uso de la función es muy similar al de la original en Go:

```injectablephp
Verify($this, "This is the subject");
```

Aquí la tienes para comparar.

```go
golden.Verify(t, "This is the subject")
```

En Go, pasar `t` es una especie de estándar, ya que `t` nos da acceso a una serie de métodos útiles para testing. Por ejemplo, en Golden se usa para saber el nombre del test en ejecución, para decirle a Go que `Verify` es un `helper` (una función que colabora en el testing) y para provocar el fallo del test (cuando el snapshot y el subject no coinciden).

Pero en PHP pasar el TestCase ($this) no se siente natural. No es incorrecto y puede tener su sentido, pero en este caso resulta extraño. Sería más natural algo como `$this->Verify("This is the subject")`. Pero ya volveremos a eso.

La forma en que está escrito el test es un poco rara. El primer uso de Verify intenta probar que el test pasa cuando se verifica por primera vez un output y se genera el snapshot, ya que asumimos que ese output es correcto.


```injectablephp
final class VerifyTest extends TestCase
{
    #[Test]
    /** @test */
    public function shouldPass(): void
    {
        Verify($this, "This is the subject");

        try {
            Verify($this, "This is another output");
        } catch (ExpectationFailedException $exception) {
            return;
        }

        $this->fail("Verify should fail");
    }

}
```

Pero no hay nada que lo demuestre. Faltaría añadir una línea que compruebe el outcome, verificando que se ha creado el snapshot en `$storage`.

```injectablephp
final class VerifyTest extends TestCase
{
    #[Test]
    /** @test */
    public function shouldPass(): void
    {
        Verify($this, "This is the subject");
        $this->assertTrue($storage->exists("Example test"));
        
        try {
            Verify($this, "This is another output");
        } catch (ExpectationFailedException $exception) {
            return;
        }

        $this->fail("Verify should fail");
    }

}
```

Realmente, este test ahora debería partirse en dos:

```injectablephp
final class VerifyTest extends TestCase
{
    #[Test]
    /** @test */
    public function shouldPass(): void
    {
        Verify($this, "This is the subject");
        $this->assertTrue($storage->exists("Example test"));
    }
    
    #[Test]
    /** @test */
    public function shouldNotPass(): void
    {
        Verify($this, "This is the subject");
        
        try {
            Verify($this, "This is another output");
        } catch (ExpectationFailedException $exception) {
            return;
        }

        $this->fail("Verify should fail");
    }
}
```

El segundo test (`shouldNotPass`) simula que hacemos una segunda ejecución del test y el output ha cambiado, por lo que `Verify` debería fallar.

Pero esto produce una situación contradictoria: para que este test pase, el propio test tiene que fallar. Así que nos vemos en la obligación de introducir esta segunda llamada e Verify en un try/catch y esperar que se lance la excepción `ExpectationFailedException`, lo que indicaría el comportamiento deseado. Y si eso no se produce, forzar el fallo del test.

Es un test muy alambicado y extrañamente realizado. Todo funciona como es debido y me permite construir mi `Storage`, pero no me convence.

Y en este punto decidí que el enfoque no era el adecuado.

## Segundo Spike: Traits

Los Traits no son santo de mi devoción. Pero como toda herramienta pueden tener sus usos. Y en este caso, me parece que funciona bastante mejor para mis propósitos.

Los Traits permiten una especie de herencia transversal, añadiendo rasgos de comportamiento a una clase. Mi opinión personal es que están bien para añadir soporte a comportamiento técnico a una clase sin contaminar su significado dentro de un dominio. Por ejemplo, yo añado el soporte a eventos en objetos de dominio mediante un Trait, de modo que no tengo que hacer descender todas las Entidades o Agregados de una clase abstracta.

Pero estoy divagando. En este caso lo que me planteo es: ¿qué tal sería usar las funciones de la librería Golden como Traits que se puedan añadir un TestCase? 

En lo que respecta a la API permite un lenguaje mucho más natural, sin tener que añadir parámetros, lo que deja espacio para las opciones que tendremos que admitir en el futuro:

```injectablephp
$this->verify("This is the subject")
```

Y puesto que el `Trait` tiene acceso al `TestCase` a través de `$this` se cumple el requisito de colaborar con PHPUnit.

En lo que se refiere a testing, me encuentro también con muchas ventajas. La principal es que se separa el test de la librería de la simulación de hacer un test con la librería:

```injectablephp
final class VerifyTest extends TestCase
{
    protected Storage $storage;
    
    protected function setUp(): void
    {
        $this->storage = new MemoryStorage();
    }

    #[Test] 
    /** @test */
    public function shouldPass(): void
    {
        $testCase = new class("Example test") extends TestCase {
            use Golden;
        };
        $testCase->registerStorage($this->storage);

        $testCase->verify("This is the subject");
        $this->assertTrue($this->storage->exists("Example test"));
    }
}
```

Esto es algo que se aprecia especialmente en el test del caso en el que el output actual es distinto del snapshot. Ahora el test comprueba que `$this->verify` falla, que es lo que queremos que pase: 


```injectablephp
final class VerifyTest extends TestCase
{
    #[Test]
    /** @test */
    public function shouldNotPass(): void
    {
        $testCase = new class("Example test") extends TestCase {
            use Golden;
        };
        $testCase->registerStorage($this->storage);

        $testCase->verify("This is the subject");

        $this->expectException(ExpectationFailedException::class);
        $testCase->verify("This is another output");
    }
}
```

El recurso al Trait también tiene sus problemas. ¿Cómo iniciamos el Storage? Los Traits pueden tener función constructora, pero interfiere con la constructora de la clase en la que se usan. Y en este caso, no es algo que nos convenga.

Una cosa que no he mencionado es que, en condiciones normales, Storage no es más que una capa de abstracción sobre las acciones de escribir y leer archivos. Pero en el desarrollo de PHPGolden quiero poder no usar el sistema de archivos, sino una implementación en memoria que sea fácil de inspeccionar y que tenga poco mantenimiento.

Así que necesito poder:

* Iniciar una implementación por defecto, que será la que escriba y lea snapshots en el sistema de archivos real.
* Reemplazar esa implementación por una en memoria para los tests de desarrollo de PHPGolden.
* Y no usar constructores en el trait.

Esta es mi primera solución, siendo `Storage` una interface. De momento, solo estoy usando la implementación `MemoryStorage`, pero en el futuro `init` instanciará la implementación basada en el sistema de archivos.

```injectablephp
trait Golden
{
    private Storage $storage;

    private function init(): void
    {
        $this->registerStorage(new MemoryStorage());
    }

    public function registerStorage(Storage $storage): void
    {
        $this->storage = $storage;
    }


    public function verify($subject): void
    {
        if (!isset($this->storage)) {
            $this->init();
        }

        if (!$this->storage->exists($this->name())) {
            $this->storage->keep($this->name(), $subject);
        }

        $snapshot = $this->storage->retrieve($this->name());
        $this->assertEquals($snapshot, $subject);
    }
}
```

## Conclusiones

Seguramente la versión final de PHPGolden usará la implementación basada en `Trait` pero me ha parecido interesante reflejar el proceso de investigación.

Portar una librería de un lenguaje a otro es algo más que traducir código. Implica reflexionar sobre la forma más natural y cómoda en cada lenguaje. Lo que funciona bien en uno, no es necesariamente aplicable al otro.
