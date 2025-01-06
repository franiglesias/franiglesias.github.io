---
layout: post
title: Refactorizar al patrón strategy
categories: articles
tags: software-design testing tdd design-patterns
---

En este artículo voy a usar diversas técnicas para refactorizar un código para usar el patrón _strategy_ y, así, hacer más fácil agregar nuevas funcionalidades a un código existente.

Se trata de una situación relativamente habitual. Nuestra aplicación tiene un algoritmo para realizar un determinado cálculo o proceso y, en algún momento, se nos pide tener varias alternativas, cuyo uso puede depender del tipo de producto, del tipo de cliente, del país en que se ejecuta, etc. El problema es que al no tener en cuenta que en algún momento podría darse esta necesidad, introducir la alternativa se convierte en un proceso tedioso y propenso a errores.

## El patrón _Strategy_

Este tipo de necesidades suele resolverse aplicando el patrón _Strategy_. Este patrón busca resolver el problema de cómo disponer de varios algoritmos que pueden ser intercambiados en tiempo de ejecución. La solución consiste en encapsular cada uno de esos algoritmos en una clase, haciendo que implementen una interfaz común. Un objeto factoría nos entregará el algoritmo deseado cuando se lo pidamos. El cliente, gracias a esto, podrá seleccionar el algoritmo deseado en tiempo de ejecución teniendo en cuenta las condiciones adecuadas.

## Nuestro ejemplo

El código original con el que vamos a trabajar es una solución de la kata Theatrical Plays. El ejercicio se puede encontrar en [este repositorio](https://github.com/emilybache/Theatrical-Players-Refactoring-Kata). El punto de partida del artículo es la solución a la que llegamos en la serie de vídeos de [Refactor con Calisthenics](https://www.youtube.com/playlist?list=PLYT8quZ2BEnbKznU9jxeswl8IEEeMSJFL).

El ejemplo consiste en un pequeño programa para generar facturas por representaciones teatrales. Este programa recibe una lista de las obras representadas y su audiencia, calcula los importes y genera una factura en formato de texto sin formato.

El nuevo requerimiento es poder generar las facturas en formato HTML, además del texto sin formato. Eso permitirá enviar las facturas por correo electrónico, por ejemplo, o convertirlas en un PDF descargable. Así que se nos pide habilitar una forma de dar soporte a ambos formatos simultáneamente, de modo que podamos escoger uno de ellos en función del contexto.

Vamos a fijarnos en los dos archivos del código que están implicados:

```php
class StatementPrinter
{

    public function print(Invoice $invoice, PlaysCatalog $catalog): string
    {
        $statement = new Statement();
        $invoice->fill($statement, $catalog);
        return $statement->print();
    }

}
```

```php
final class Statement implements Fillable
{

    private array $values = [];

    private NumberFormatter $formatter;

    public function __construct()
    {
        $this->formatter = new NumberFormatter('en_US', NumberFormatter::CURRENCY);
    }


    public function fill(string $field, $value): void
    {
        if ($field === 'customer') {
            $this->values['customer'] = $value;
        } elseif ($field === 'amount') {
            $this->values['amount'] = $value->format($this->formatter, 'USD');;
        } elseif ($field === 'credits') {
            $this->values['credits'] = (string)$value;
        } elseif ($field === 'line') {
            $line = [
                'name' => $value['play'],
                'amount' => $value['amount']->format($this->formatter, 'USD'),
                'audience' => $value['audience'],
            ];
            $this->values['lines'][] = $line;
        }
    }

    public function print(): string
    {
        $statement = "Statement for {$this->values['customer']}\n";

        foreach ($this->values['lines'] as $line) {
            $partial = "  {$line['name']}: {$line['amount']} ";
            $partial .= "({$line['audience']} seats)\n";
            $statement .= $partial;
        }

        $statement .= "Amount owed is {$this->values['amount']}\n";
        $statement .= "You earned {$this->values['credits']} credits";

        return $statement;
    }
}
```

La clase `StatementPrinter` ser encarga de coordinar la impresión de la factura, pero básicamente es `Statement` la que hace todo el trabajo, copiándose los datos de `Invoice`, gracias a implementar la interfaz `Fillable`, y generando el texto de la factura con el método `print`.

La idea sería que podamos usar `StatementPrinter` más o menos así, indicándole el formato que deseamos obtener:

```php
$printer = new StatementPrinter();
$htmlStatement = $printer->print($invoice, $plays, 'html');
$plainTextStatement = $printer->print($invoice, $plays, 'text');
```

Internamente, `StatementPrinter` debería poder delegar a un tipo concreto de `Statement` especializado en cada formato. Por ejemplo, `HtmlStatement` y `PlainTextStatement`. Sin embargo, ahora mismo, `Statement` ya es una clase concreta que no puede ser especializada. Tendríamos que cambiar eso. Además, el método `fill` de `Statement` podría ser común a todas las especializaciones, ya que todas tienen que imprimir los mismos datos, cambiando el formato. Esto sugiere que podríamos usar herencia, lo que permite compartir esa parte de la funcionalidad y tener especializaciones para cada formato.

En resumidas cuentas, para introducir HtmlStatement vamos a tener que hacer una serie de cambios preparatorios en el código, a fin de adaptarlo al patrón _Strategy_.

## Refactor preparatorio

Cuando queremos introducir una nueva funcionalidad podemos encontrarnos distintas situaciones. En el mejor de los casos, esa nueva funcionalidad se puede introducir simplemente añadiendo código, sin tener que transformar el ya existente, o modificándolo de una manera trivial. En el peor de los casos, tenemos que modificarlo para acomodar la nueva _feature_. Estos cambios suponen un riesgo porque pueden introducir errores en el código ya existente. Por eso, es importante minimizar el impacto de esos cambios.

La mejor forma de conseguir esto es mediante refactor preparatorio. El refactor preparatorio no es más que transformar el código existente, protegido por sus tests actuales, de manera que adopte la forma que deseamos, pero sin tratar de introducir todavía la nueva funcionalidad. 

En nuestro ejemplo, nos hemos dado cuenta de que la situación ideal sería aplicar el patrón _Strategy_, de forma que se pueda seleccionar en tiempo de ejecución si la factura se imprime en HTML o en texto sin formato. Nuestro refactor preparatorio consistirá en introducir el patrón Strategy en el código aunque de momento solo usaremos una estrategia, la que ya tenemos.

Una vez conseguido esto, con la aplicación funcionando como siempre, introducir la variante HTML será mucho más sencillo, casi trivial, y sin perjudicar a los usuarios actuales de la aplicación.

### Paso 1: Introducir PlainTextStatement

La estrategia de impresión actual es texto sin formato, pero tenemos que hacerlo explícito. Actualmente, tenemos la clase `Statement` como una clase concreta que la implementa. Lo único que vamos a hacer en este paso es cambiarle el nombre a `PlainTextStatement` de manera que queda claro que es una estrategia concreta de impresión.

Se trata de un refactor automático, al menos en IntelliJ IDEA, que nos permite cambiar el nombre de la clase y de su archivo en un solo paso y modificar todas sus referencias en el código.

```php
final class PlainTextStatement implements Fillable
{

    private array $values = [];

    private NumberFormatter $formatter;

    public function __construct()
    {
        $this->formatter = new NumberFormatter('en_US', NumberFormatter::CURRENCY);
    }


    public function fill(string $field, $value): void
    {
        if ($field === 'customer') {
            $this->values['customer'] = $value;
        } elseif ($field === 'amount') {
            $this->values['amount'] = $value->format($this->formatter, 'USD');;
        } elseif ($field === 'credits') {
            $this->values['credits'] = (string)$value;
        } elseif ($field === 'line') {
            $line = [
                'name' => $value['play'],
                'amount' => $value['amount']->format($this->formatter, 'USD'),
                'audience' => $value['audience'],
            ];
            $this->values['lines'][] = $line;
        }
    }

    public function print(): string
    {
        $statement = "Statement for {$this->values['customer']}\n";

        foreach ($this->values['lines'] as $line) {
            $partial = "  {$line['name']}: {$line['amount']} ";
            $partial .= "({$line['audience']} seats)\n";
            $statement .= $partial;
        }

        $statement .= "Amount owed is {$this->values['amount']}\n";
        $statement .= "You earned {$this->values['credits']} credits";

        return $statement;
    }
}
```

### Paso 2: Introducir la interfaz o clase abstracta Statement

Para poder aplicar el patrón _Strategy_ necesitamos una interfaz o clase abstracta que implementen todas las estrategias concretas. Ahora mismo, `PlainTextStatement` implementa la interfaz `Fillable`, pero este rol indica que puede ser rellenada de datos, no nos dice nada del rol de impresión, que es el que nos interesa.

Podríamos crear una interfaz `Printable`, con un método `print` que implementen todas las estrategias concretas, pero en este caso vamos a optar por una clase abstracta `Statement` que implemente `Fillable` y que sea extendida por las estrategias concretas. La clase abstracta puede funcionar como una interfaz, pero nos permite añadir funcionalidad compartida por todas las estrategias concretas.

Para ellos, vamos a copiar el código de `PlainTextStatement` a `Statement` y a convertir `Statement` en una clase abstracta. Moveremos el método `fill` a la clase base y el método `print` como abstracto, de manera que las estrategias concretas tengan que implementarlo. 

```php
abstract class Statement
{

    protected array $values = [];

    protected NumberFormatter $formatter;

    public function __construct()
    {
        $this->formatter = new NumberFormatter('en_US', NumberFormatter::CURRENCY);
    }


    public function fill(string $field, $value): void
    {
        if ($field === 'customer') {
            $this->values['customer'] = $value;
        } elseif ($field === 'amount') {
            $this->values['amount'] = $value->format($this->formatter, 'USD');;
        } elseif ($field === 'credits') {
            $this->values['credits'] = (string)$value;
        } elseif ($field === 'line') {
            $line = [
                'name' => $value['play'],
                'amount' => $value['amount']->format($this->formatter, 'USD'),
                'audience' => $value['audience'],
            ];
            $this->values['lines'][] = $line;
        }
    }

    abstract public function print(): string;
}
```

Y así quedaría `PlainTextStatement`:

```php
inal class PlainTextStatement extends Statement implements Fillable
{
    public function __construct()
    {
        parent::__construct();
    }

    public function fill(string $field, $value): void
    {
        parent::fill($field, $value);
    }
    
    public function print(): string
    {
        $statement = "Statement for {$this->values['customer']}\n";

        foreach ($this->values['lines'] as $line) {
            $partial = "  {$line['name']}: {$line['amount']} ";
            $partial .= "({$line['audience']} seats)\n";
            $statement .= $partial;
        }

        $statement .= "Amount owed is {$this->values['amount']}\n";
        $statement .= "You earned {$this->values['credits']} credits";

        return $statement;
    }
}
```

Con este cambio, los tests siguen pasando y ya tenemos una parte de las piezas que necesitamos.

### Paso 3: Modificar `StatementPrinter` para permitir la selección de la estrategia

A continuación vamos a aplicar cambios en StatementPrinter para que funcione como si pudiese escoger entre varias estrategias. Como queremos hacerlo en tiempo de ejecución, vamos a introducir un parámetro en el método `print` que nos permita seleccionar la estrategia concreta, es decir, el formato que queremos usar.

Obviamente, todavía no tenemos más que una estrategia, pero podemos preparar el terreno. Partimos de aquí:

```php
class StatementPrinter
{

    public function print(Invoice $invoice, PlaysCatalog $catalog): string
    {
        $statement = new PlainTextStatement();
        $invoice->fill($statement, $catalog);
        return $statement->print();
    }
}
```

Y lo modificamos para que reciba un parámetro adicional, que al ser opcional no afecta ni a los tests ni al comportamiento actual de la aplicación:

```php
class StatementPrinter
{

    public function print(Invoice $invoice, PlaysCatalog $catalog, string $format = 'text'): string
    {
        $statement = new PlainTextStatement();
        $invoice->fill($statement, $catalog);
        return $statement->print();
    }
}
```

Ahora usaremos el parámetro `format` para seleccionar la estrategia concreta que queremos usar. Lo mejor en estos casos, es aislar la instanciación de la estrategia concreta en un método aparte, para que sea más fácil cambiarla en el futuro.

```php
class StatementPrinter
{

    public function print(Invoice $invoice, PlaysCatalog $catalog, string $format = 'text'): string
    {
        $statement = $this->chooseStatementFormat($format);
        $invoice->fill($statement, $catalog);
        return $statement->print();
    }

    public function chooseStatementFormat(string $format): Statement
    {
        $statement = new PlainTextStatement();
        return $statement;
    }
}
```

Hasta podemos avanzar un poquito. Este cambio no altera para nada el comportamiento actual.

```php
class StatementPrinter
{

    public function print(Invoice $invoice, PlaysCatalog $catalog, string $format = 'text'): string
    {
        $statement = $this->chooseStatementFormat($format);
        $invoice->fill($statement, $catalog);
        return $statement->print();
    }

    public function chooseStatementFormat(string $format): Statement
    {
        if ($format === 'text') {
            return new PlainTextStatement();
        }
        
        return new PlainTextStatement();
    }
}
```

De hecho, podríamos cambiar los tests para usar el nuevo parámetro:

```php
final class GoldenStatementPrinterTest extends TestCase
{
    use Golden;

    #[Test]
    public function shouldPrintEmptyStatement(): void
    {
        $printer = new StatementPrinter();

        $performances = new PerformanceList([]);
        $invoice = new Invoice("Smith Ltd.", $performances);
        $plays = new PlaysCatalog([]);

        $statement = $printer->print($invoice, $plays, 'text');

        $this->verify($statement);
    }

    #[Test]
    public function shouldPrintCompleteStatement(): void
    {
        $printer = new StatementPrinter();

        $plays = [
            "hamlet" => new Tragedy("Hamlet"),
            "as-you-like" => new Comedy("As you like"),
        ];

        $performances = [
            new Performance("hamlet", 25),
            new Performance("hamlet", 30),
            new Performance("hamlet", 35),
            new Performance("as-you-like", 15),
            new Performance("as-you-like", 20),
            new Performance("as-you-like", 25),
        ];


        $invoice = new Invoice("Smith Ltd.", new PerformanceList($performances));

        $statement = $printer->print($invoice, new PlaysCatalog($plays), 'text');

        $this->verify($statement);
    }
}
```

Y con esto, terminaría el refactor. Hemos preparado el terreno para introducir la nueva funcionalidad, que será añadir la estrategia HTML. Hemos minimizado el impacto de los cambios y hemos mantenido la aplicación funcionando como siempre.

## Introduciendo la nueva estrategia

El refactor preparatorio nos ha dejado listo todo lo necesario para introducir la variante de imprimir HTML. Ahora tenemos que programar la nueva estrategia `HtmlStatement`, que extienda de `Statement` y que implemente el método `print` de manera que genere el texto en formato HTML.

Como ahora vamos a introducir nueva funcionalidad necesitaremos tests. Por desgracia, testear la generación de documentos HTML es bastante incómodo, al menos mediante tests de aserciones. En lugar de eso, vamos a usar un par de variantes basadas en _snapshot testing_. Hace tiempo creé una librería para PHP llamada Golden, que es la que vamos a usar. Golden nos permite mucha flexibilidad a la hora de preparar tests basados en _snapshots_, como puede ser snapshot testing, approval testing, o Golden Master testing.

Tenemos un _TestCase_ de `PlainTextStatement` que nos puede servir de guía. Contiene dos tests. El primero de ellos verifica que se puede imprimir una factura vacía y el segundo que se puede imprimir una factura completa. Es justamente el último ejemplo de código mostrado en el apartado anterior.

### Paso 1: Crear el test de `HtmlStatement` para la factura vacía

En el primer ejemplo voy a generar la factura como si estuviera vacía, sin representaciones teatrales. La idea es verificar que podemos imprimir una estructura básica de la factura, con los detalles globales. El objetivo de este test es introducir `HtmlStatement` y una funcionalidad mínima. Para este test, voy a usar la siguiente aproximación:

* Preparar a mano un ejemplo de la factura en HTML
* Ejecutar el test y añadir código hasta lograr que pase por completo.

Como ya tengo una versión en texto sin formato, puedo copiarla y modificarla para que sea HTML. Esto es lo que quiero conseguir en este momento:

```html
<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Invoice</title>
    </head>
    <body>
    <h1>Invoice for Smith Ltd.</h1>
    <p>Amount owed is <strong>$0.00</strong></p>
    <p>You earned 0 credits</p>
    </body>
</html>
```

Voy a guardar este texto en un archivo llamado `empty-invoice.html` en la carpeta `tests/__snapshots/HtmlStatementTest`. A continuación, voy a crear un test que verifique que la factura vacía se imprime correctamente en HTML. Aquí está. Como podemos ver, el único cambio relevante, aparte del nombre del test, es el formato que se pasa al método `print`.

```php
final class HtmlStatementPrinterTest extends TestCase
{
    use Golden;

    #[Test]
    public function shouldPrintEmptyStatement(): void
    {
        $printer = new StatementPrinter();

        $performances = new PerformanceList([]);
        $invoice = new Invoice("Smith Ltd.", $performances);
        $plays = new PlaysCatalog([]);

        $statement = $printer->print($invoice, $plays, 'html');

        $this->verify($statement, extension('.html'), snapshot('empty-invoice'));
    }
}
```

Decía que Golden es muy flexible a la hora de permitirnos usar distintas técnicas. Una de las facilidades que nos permite es especificar exactamente el archivo que queremos usar como comparación. En este caso, `empty-invoice.html` es el archivo contra el que se comparará la factura generada. 

Por el momento, el test falla porque el código siempre usa `PlainTextStatement`, por lo que el output producido es texto sin formato:

```
Statement for Smith Ltd.
Amount owed is $0.00
You earned 0 credits
```

### Paso 2: Introducir `HtmlStatement`

Ahora vamos a introducir la nueva estrategia `HtmlStatement`. La idea es que `HtmlStatement` extienda de `Statement` y que implemente el método `print` de manera que genere el texto en formato HTML. También tenemos que asegurarnos que es la usada cuando se pasa 'html' como formato. Y eso es lo que voy a hacer primero, provocando que el test falle, pero porque no tenemos `HtmlStatement` todavía.

```php
class StatementPrinter
{

    public function print(Invoice $invoice, PlaysCatalog $catalog, string $format = 'text'): string
    {
        $statement = $this->chooseStatementFormat($format);
        $invoice->fill($statement, $catalog);
        return $statement->print();
    }

    public function chooseStatementFormat(string $format): Statement
    {
        if ($format === 'text') {
            return new PlainTextStatement();
        }
        if ($format === 'html') {
            return new HtmlStatement();
        }

        return new PlainTextStatement();
    }
}
```

Así que ahora podemos introducir una implementación básica de `HtmlStatement`:

```php
class HtmlStatement extends Statement implements Fillable
{
    public function fill(string $field, $value): void
    {
        parent::fill($field, $value); // TODO: Change the autogenerated stub
    }

    public function print(): string
    {
        return "";
    }
}
```

Con esta implementación, el test falla porque se genera un documento vacío. Pero ya tenemos un contenedor en el que empezar a implementar cosas. Por ejemplo:

```php
class HtmlStatement extends Statement implements Fillable
{
    public function fill(string $field, $value): void
    {
        parent::fill($field, $value); // TODO: Change the autogenerated stub
    }

    public function print(): string
    {
        $html = <<<EOF
<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Invoice</title>
    </head>
    <body>
    </body>
</html>
EOF;

        return $html;
    }
}
```

El test sigue sin pasar, así que vamos a ir añadiendo elementos poco a poco, como el título:

```php
class HtmlStatement extends Statement implements Fillable
{
    public function fill(string $field, $value): void
    {
        parent::fill($field, $value); // TODO: Change the autogenerated stub
    }

    public function print(): string
    {
        $html = <<<EOF
<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Invoice</title>
    </head>
    <body>
    <h1>Invoice for {$this->values['customer']}</h1>
    </body>
</html>
EOF;

        return $html;
    }
}
```

Y así sucesivamente, hasta que el test pase. En este caso, el test pasa cuando el código de `HtmlStatement` es el siguiente:

```php
class HtmlStatement extends Statement implements Fillable
{
    public function fill(string $field, $value): void
    {
        parent::fill($field, $value); // TODO: Change the autogenerated stub
    }

    public function print(): string
    {
        $html = <<<EOF
<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Invoice</title>
    </head>
    <body>
    <h1>Invoice for {$this->values['customer']}</h1>
    <p>Amount owed is <strong>{$this->values['amount']}</strong></p>
    <p>You earned {$this->values['credits']} credits</p>
    </body>
</html>

EOF;

        return $html;
    }
}
```

Esta sería la forma más estrictamente _test-driven_ de hacerlo con _Golden_: definimos un archivo de referencia y le indicamos al test que lo use para comparar lo que generamos. No tenemos más que ir añadiendo código hasta completar el output.

## Completando la funcionalidad

Para añadir la siguiente parte de funcionalidad, que sería el detalle de las representaciones, vamos a usar otra aproximación apoyándonos en la modalidad de Approval Testing. En este caso, lo que hacemos es ejecutar el test y dejar que este genere un snapshot con el output producido. A continuación, lo revisamos y lo aprobamos si es correcto. Si no es correcto, seguimos añadiendo código hasta completarlo.

Esta forma de hacerlo no es tan estrictamente _test-driven_ como la anterior, pero es útil cuando no tenemos bien definido el output esperado, quizá porque estamos en una fase exploratoria. En esencia, consiste en proceder de una manera iterativa.

De hecho, vamos a empezar donde lo habíamos dejado con el test anterior: una factura vacía. El nuevo test, que ya incluye datos de las representaciones es como sigue:

```php
final class HtmlStatementPrinterTest extends TestCase
{
    use Golden;

    #[Test]
    public function shouldPrintEmptyStatement(): void
    {
        // Code removed for clarity
    }

    #[Test]
    public function shouldPrintCompleteStatement(): void
    {
        $printer = new StatementPrinter();

        $plays = [
            "hamlet" => new Tragedy("Hamlet"),
            "as-you-like" => new Comedy("As you like"),
        ];

        $performances = [
            new Performance("hamlet", 25),
            new Performance("hamlet", 30),
            new Performance("hamlet", 35),
            new Performance("as-you-like", 15),
            new Performance("as-you-like", 20),
            new Performance("as-you-like", 25),
        ];


        $invoice = new Invoice("Smith Ltd.", new PerformanceList($performances));

        $statement = $printer->print($invoice, new PlaysCatalog($plays), 'html');

        $this->verify($statement, waitApproval(), extension('.html'), snapshot('complete-invoice'));
    }
}
```

La principal diferencia, además de que en este ejemplo tenemos datos de las obras, es que el método `verify` recibe un nuevo parámetro, `waitApproval()`. Este indica a Golden que debe esperar a que el usuario apruebe el snapshot generado. El test fallará porque todavía no hemos definido el output de referencia, vamos a dejar que sea el test quien lo genere. Cuando sea el deseado, podremos aprobarlo.

Este es el output que genera el test en este momento. Como se puede ver es más o menos el mismo del otro test, pero con los importes y créditos calculados. Esta parte está correcta, pero como es incompleta, aún no la vamos a aprobar.

```
<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Invoice</title>
    </head>
    <body>
    <h1>Invoice for Smith Ltd.</h1>
    <p>Amount owed is <strong>$2,455.00</strong></p>
    <p>You earned 17 credits</p>
    </body>
</html>
```

### Paso 1: Reservar espacio para la lista de representaciones

Nuestro primer paso a continuación es reservar espacio en el documento HTML para la lista de representaciones. La idea es añadir un elemento `table` con una fila por cada representación. Cada fila tendrá tres celdas: el nombre de la obra, el importe y el número de asistentes. Sin embargo, si no hay representaciones, no queremos mostrar la tabla. Así que, para _reservar_ el hueco, vamos a modificar el código para permitir insertar un elemento, que inicialmente estará vacío. De este modo, el test anterior seguirá pasando.

```php
class HtmlStatement extends Statement implements Fillable
{
    public function fill(string $field, $value): void
    {
        parent::fill($field, $value); // TODO: Change the autogenerated stub
    }

    public function print(): string
    {
        $details = '';
        $html = <<<EOF
<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Invoice</title>
    </head>
    <body>
    <h1>Invoice for {$this->values['customer']}</h1>
    {$details}<p>Amount owed is <strong>{$this->values['amount']}</strong></p>
    <p>You earned {$this->values['credits']} credits</p>
    </body>
</html>

EOF;

        return $html;
    }
}
```

Como se puede apreciar, el cambio es bastante sutil. La variable $details contendrá la tabla generada con las representaciones. Al ejecutar ambos tests vemos que no se altera el output, que es justamente lo que queríamos.

### Paso 2: Si hay representaciones mostrar la tabla

Ahora vamos a añadir el código necesario para mostrar la tabla con las representaciones. Pero lo haremos de forma progresiva. Simplemente, pondremos una tabla vacía en caso de que haya datos que mostrar. Una vez estemos conformes con eso, pasaremos a rellenarla con los datos.

```php
class HtmlStatement extends Statement implements Fillable
{
    public function fill(string $field, $value): void
    {
        parent::fill($field, $value); // TODO: Change the autogenerated stub
    }

    public function print(): string
    {
        if (!$this->values['lines']) {
            $details = '';
        } else {
            $details = "<table>\n    </table>\n    ";
        }
        
        $html = <<<EOF
<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Invoice</title>
    </head>
    <body>
    <h1>Invoice for {$this->values['customer']}</h1>
    {$details}<p>Amount owed is <strong>{$this->values['amount']}</strong></p>
    <p>You earned {$this->values['credits']} credits</p>
    </body>
</html>

EOF;

        return $html;
    }
}
```

Lo siguiente sería añadir las columnas de la tabla, pero parece prudente hacer un pequeño refactor antes, de modo que la generación de la tabla sea más fácil de manipular.

```php
class HtmlStatement extends Statement implements Fillable
{
    public function fill(string $field, $value): void
    {
        parent::fill($field, $value); // TODO: Change the autogenerated stub
    }

    public function print(): string
    {
        if (!$this->values['lines']) {
            $details = '';
        } else {
            $details = $this->details();
        }

        $html = <<<EOF
<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Invoice</title>
    </head>
    <body>
    <h1>Invoice for {$this->values['customer']}</h1>
    {$details}<p>Amount owed is <strong>{$this->values['amount']}</strong></p>
    <p>You earned {$this->values['credits']} credits</p>
    </body>
</html>

EOF;

        return $html;
    }

    private function details(): string
    {
        $details = "<table>\n    ";
        $details .= "<tr><th>Play</th><th>Seats</th><th>Amount</th></tr>\n    ";
        $details .= "</table>\n    ";

        return $details;
    }
}
```

Ahora, será fácil introducir cada fila:

```php
class HtmlStatement extends Statement implements Fillable
{
    public function fill(string $field, $value): void
    {
        parent::fill($field, $value); // TODO: Change the autogenerated stub
    }

    public function print(): string
    {
        if (!$this->values['lines']) {
            $details = '';
        } else {
            $details = $this->details();
        }

        $html = <<<EOF
<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Invoice</title>
    </head>
    <body>
    <h1>Invoice for {$this->values['customer']}</h1>
    {$details}<p>Amount owed is <strong>{$this->values['amount']}</strong></p>
    <p>You earned {$this->values['credits']} credits</p>
    </body>
</html>

EOF;

        return $html;
    }

    private function details(): string
    {
        $details = "<table>\n    ";
        $details .= "<tr><th>Play</th><th>Seats</th><th>Amount</th></tr>\n    ";
        foreach ($this->values['lines'] as $line) {
            $details .= "<tr><td>{$line['name']}</td><td>{$line['audience']}</td><td>{$line['amount']}</td></tr>\n    ";
        }
        $details .= "</table>\n    ";

        return $details;
    }
}
```

En este punto, ya generamos el siguiente HTML, que es el que queremos:

```html
<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Invoice</title>
    </head>
    <body>
    <h1>Invoice for Smith Ltd.</h1>
    <table>
    <tr><th>Play</th><th>Seats</th><th>Amount</th></tr>
    <tr><td>Hamlet</td><td>25</td><td>$400.00</td></tr>
    <tr><td>Hamlet</td><td>30</td><td>$400.00</td></tr>
    <tr><td>Hamlet</td><td>35</td><td>$450.00</td></tr>
    <tr><td>As you like</td><td>15</td><td>$345.00</td></tr>
    <tr><td>As you like</td><td>20</td><td>$360.00</td></tr>
    <tr><td>As you like</td><td>25</td><td>$500.00</td></tr>
    </table>
    <p>Amount owed is <strong>$2,455.00</strong></p>
    <p>You earned 17 credits</p>
    </body>
</html>
```

Por lo que marcamos el test como aprobado, sencillamente eliminando el parámetro _waitApproval()_, no sin antes verificar que la factura se ve correctamente renderizada y con los elementos requeridos.

```php
final class HtmlStatementPrinterTest extends TestCase
{
    use Golden;

    #[Test]
    public function shouldPrintEmptyStatement(): void
    {
        $printer = new StatementPrinter();

        $performances = new PerformanceList([]);
        $invoice = new Invoice("Smith Ltd.", $performances);
        $plays = new PlaysCatalog([]);

        $statement = $printer->print($invoice, $plays, 'html');

        $this->verify($statement, extension('.html'), snapshot('empty-invoice'));
    }

    #[Test]
    public function shouldPrintCompleteStatement(): void
    {
        $printer = new StatementPrinter();

        $plays = [
            "hamlet" => new Tragedy("Hamlet"),
            "as-you-like" => new Comedy("As you like"),
        ];

        $performances = [
            new Performance("hamlet", 25),
            new Performance("hamlet", 30),
            new Performance("hamlet", 35),
            new Performance("as-you-like", 15),
            new Performance("as-you-like", 20),
            new Performance("as-you-like", 25),
        ];


        $invoice = new Invoice("Smith Ltd.", new PerformanceList($performances));

        $statement = $printer->print($invoice, new PlaysCatalog($plays), 'html');

        $this->verify($statement, extension('.html'), snapshot('complete-invoice'));
    }
}
```

## Refactor posterior

Hemos visto la importancia de realizar un refactor preparatorio a fin de acondicionar el código existente antes de introducir una nueva feature. Gracias a esa preparación, añadir la funcionalidad nueva ha sido mucho más sencillo y menos arriesgado. En todo momento, hemos podido mantener los tests existentes pasando, evitando introducir bugs o comportamientos inesperados.

Esta es una forma de proceder con orden y seguridad en el desarrollo de prestaciones en un software.

Ahora bien, una vez introducida la nueva funcionalidad, es necesario dar un repaso al trabajo realizado. Tenemos que valorar si el código que hemos añadido sigue siendo mantenible, o si nos permitiría añadir nueva funcionalidad relacionada de una manera fácil. ¿Han cambiado las relaciones entre clases de alguna manera que no habíamos previsto? ¿Hemos introducido duplicidades? ¿Es posible que hayan comenzado a dibujarse nuevas abstracciones que antes no podíamos ver? ¿Puede ser que hayamos introducido algún _code smell_?

### Reorganización de archivos

En nuestro ejercicio hemos añadido varios archivos nuevos. La estructura hasta ahora era plana, pero eso dificulta entender donde está cada cosa:

```
src
├── Amount.php
├── Comedy.php
├── Credits.php
├── Fillable.php
├── History.php
├── HtmlStatement.php
├── Invoice.php
├── Performance.php
├── PerformanceList.php
├── PlainTextStatement.php
├── Play.php
├── PlaysCatalog.php
├── Statement.php
├── StatementPrinter.php
└── Tragedy.php
```

Nos conviene agrupar los archivos por algún criterio, haciendo más fácil entender sus relaciones. Aquí tenemos un ejemplo de por dónde podríamos empezar.

```
src
├── Amount.php
├── Credits.php
├── Fillable.php
├── Invoice.php
├── Performance.php
├── PerformanceList.php
├── Play
│   ├── Comedy.php
│   ├── History.php
│   ├── Play.php
│   └── Tragedy.php
├── PlaysCatalog.php
├── Statement
│   ├── HtmlStatement.php
│   ├── PlainTextStatement.php
│   └── Statement.php
└── StatementPrinter.php
```

### Abrir a extensión

El cambio que hemos realizado en este ejercicio tenía el objetivo de permitir diversas formas de representar la factura. Aunque todavía no nos han pedido más, una pregunta que podríamos hacernos es si en el futuro sería fácil añadir una nueva modalidad.

Si examinamos `StatementPrinter`, podemos darnos cuenta de que aún está cerrada para modificación. En caso de querer añadir una nueva estrategia, tendríamos que modificar el método `chooseStatementFormat`. Podríamos hacerlo mejor, incorporando un patrón Factoría.

```php
class StatementPrinter
{

    public function print(Invoice $invoice, PlaysCatalog $catalog, string $format = 'text'): string
    {
        $statement = $this->chooseStatementFormat($format);
        $invoice->fill($statement, $catalog);
        return $statement->print();
    }

    public function chooseStatementFormat(string $format): Statement
    {
        if ($format === 'text') {
            return new PlainTextStatement();
        }
        if ($format === 'html') {
            return new HtmlStatement();
        }

        return new PlainTextStatement();
    }
}
```

Podría quedar algo así:

```php
class StatementPrinter
{

    private StatementFactory $statementFactory;

    public function __construct()
    {
        $this->statementFactory = new StatementFactory();
    }

    public function print(Invoice $invoice, PlaysCatalog $catalog, string $format = 'text'): string
    {
        $statement = $this->chooseStatementFormat($format);
        $invoice->fill($statement, $catalog);
        return $statement->print();
    }

    public function chooseStatementFormat(string $format): Statement
    {
        return $this->statementFactory->chooseStatementFormat($format);
    }
}
```

Como anécdota, este refactor lo he podido hacer de forma automática con el refactor _Extract Class_ de IntelliJ IDEA. Simplemente, he seleccionado el método `chooseStatementFormat` y lo he movido a la nueva clase `StatementFactory`. El IDE se ha encargado de todo.

```php
class StatementFactory
{

    public function chooseStatementFormat(string $format): Statement
    {
        if ($format === 'text') {
            return new PlainTextStatement();
        }
        if ($format === 'html') {
            return new HtmlStatement();
        }

        return new PlainTextStatement();
    }
}
```

Por supuesto, podríamos argumentar que me he limitado a mover la selección de la estrategia a la factoría y que esta sigue teniendo que ser modificada en caso de querer usar nuevas estrategias en el futuro. Sin embargo, lo importante es que hemos sacado la responsabilidad de `StatementPrinter`, que ahora es ignorante de las estrategias concretas. Además, al no tener que tocar esta clase, nos evitamos introducir _bugs_ de forma accidental.

De todas formas, si quieres ver una forma de hacer que la propia factoría se abra a extensión, puedes ver un ejemplo [en este vídeo](https://youtu.be/Zz5_IP1iDcM?si=w6ydxapextu_chnL).

## Conclusiones

En este ejercicio hemos visto cómo introducir una nueva funcionalidad en un código existente de una manera segura y ordenada. Hemos aplicado un refactor preparatorio para acondicionar el código antes de introducir la nueva feature. Hemos usado tests basados en _snapshots_ para guiar el desarrollo de la nueva funcionalidad y hemos aplicado un refactor posterior para mejorar la estructura del código.

Por supuesto, podríamos seguir buscando puntos de mejora en el código para hacerlo más mantenible y extensible en el futuro. Sin embargo, aparte de que para este ejemplo me parece suficiente, en cada caso tenemos que valorar el equilibrio entre entregar la funcionalidad deseada y seguir introduciendo mejoras. Hay que tener en cuenta que, en la mayoría de los casos, no sabemos hacia donde puede evolucionar el software, por lo que no vale la pena invertir en facilitar cambios que quizá nunca lleguen.
