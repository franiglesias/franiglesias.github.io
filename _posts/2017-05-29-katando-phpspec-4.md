---
layout: post
title: Katando phpSpec 4
categories: articles
tags: tdd bdd
---

En las entregas anteriores de la serie he tratado de explicar cómo hacer TDD usando PHPSpec. En esta última, voy a mostrar cómo dar un "salto" en el desarrollo, usando los test existentes como protección.

La serie **Katando PHPSpec** consta de los siguientes artículos:

[Katando PHPSpec (1)](/katando-phpspec-1)  
[Katando PHPSpec (2)](/katando-phpspec-2)  
[Katando PHPSpec (3)](/katando-phpspec-3)  
[Katando PHPSpec (4)](/katando-phpspec-4)

Si recuerdas, esta era la última implementación de la clase **Calculator**. La pongo aquí para referencia:

```php
namespace kata;

class Calculator
{
    private $separator = ',';

    public function add($inputString)
    {
        $parts = [];
        if (preg_match('/(?:\/{2,2}([^\n]+)\n)/', $inputString)) {
            preg_match('/(?:\/{2,2}([^\n]+)\n)?(.*)$/', $inputString, $parts);
            if (!empty($parts[1])) {
                $this->separator = $parts[1];
            }
            $inputString = $parts[2];

        }
        $inputString = $this->normalizeInputString($inputString);

        $this->ensureThatInputIsValid($inputString);

        $numbers = $this->getTheNumbersAsArray($inputString);

        return $this->addAllNumbersAsInt($numbers);
    }

    /**
     * @param $inputString
     */
    protected function ensureThatInputIsValid($inputString): void
    {
        if (substr($inputString, -1, 1) == $this->separator) {
            throw new \InvalidArgumentException('Malformed string');
        }
    }

    /**
     * @param $inputString
     *
     * @return mixed
     */
    protected function normalizeInputString($inputString): string
    {
        $inputString = str_replace("\n", $this->separator, $inputString);

        return $inputString;
    }

    /**
     * @param $inputString
     *
     * @return array
     */
    protected function getTheNumbersAsArray($inputString): array
    {
        $numbers = explode($this->separator, $inputString);

        return $numbers;
    }

    /**
     * @param $numbers
     *
     * @return int
     */
    protected function addAllNumbersAsInt($numbers): int
    {
        return intval(array_sum($numbers));
    }
}
```

Quizá recuerdes que mi última modificación no me había dejado muy satisfecho, ya que había algunas duplicaciones con las *regexp*. Podríamos mover todo eso a un método, lo que encapsularía un poco las partes feas.

Por otra parte, si te fijas, la mayor parte del código de la clase se dedica a procesar la cadena de entrada para poder realizar el cálculo. En el fondo, esto es una violación del principio de Única Responsabilidad (la S en [SOLID](/principios-solid/)) ya que la clase Calculator tiene, al menos, dos razones para cambiar.

Si necesito cambiar el modo en que se realiza el cálculo tengo que modificar la clase `Calculator` (una razón para cambiar). Pero si necesito entender otros formatos de cadena de entrada también tengo que cambiar la clase `Calculator` (segunda razón para cambiar). Tener más de una razón para cambiar es lo que rompe el principio SOLID.

Así que vamos a hacer un gran cambio de diseño.

Lo que he pensado es que Calculator se limite a sumar los números que existan en la cadena de entrada. Para obtener los números, hará uso de un colaborador llamado `Parser`, que es quien se encargará de todo lo que tiene que ver con examinar la cadena y obtener los números que contiene.

Ya que estamos, vamos a hacer que `Parser` devuelva los números en forma de array de entero. Esto es lo que espera recibir `Calculator` a cambio de la cadena de entrada.

Entonces, ¿como construir el `Parser` con TDD y que todo funcione igual?

La verdad es que podemos hacerlo de varias formas.

Una de ellas consiste en desarrollar `Parser` desde cero con la ayuda de PHPSpec. Escribimos diversos ejemplos y desarrollamos la clase tal y como hemos visto en las entregas anteriores. Aquí tienes `ParserSpec`:

```php
namespace spec\kata;

use kata\Parser;
use PhpSpec\ObjectBehavior;
use Prophecy\Argument;

class ParserSpec extends ObjectBehavior
{
    function it_is_initializable()
    {
        $this->shouldHaveType(Parser::class);
    }

    public function it_can_parse_string_and_detect_new_separator()
    {
        $this->parse("//;\n");
        $this->getSeparator()->shouldBe(';');
    }

    public function it_can_detect_another_separator()
    {
        $this->parse("//:\n");
        $this->getSeparator()->shouldBe(':');
    }

    public function it_can_detect_the_numbers_at_the_end_of_string()
    {
        $this->parse("//;\n3;4");
        $this->getSeparator()->shouldBe(';');
        $this->getNumbers()->shouldBeLike([3,4]);
    }

    public function it_can_detect_more_numbers_at_the_end_of_string()
    {
        $this->parse("//,\n3,4,78,34");
        $this->getSeparator()->shouldBe(',');
        $this->getNumbers()->shouldBeLike([3,4,78,34]);
    }

    public function it_parses_string_without_separator_definition()
    {
        $this->parse('3,5,6');
        $this->getSeparator()->shouldBe(',');
        $this->getNumbers()->shouldBeLike([3,5,6]);
    }

    public function it_parses_string_using_cr_as_separator()
    {
        $this->parse("3\n5,6");
        $this->getSeparator()->shouldBe(',');
        $this->getNumbers()->shouldBeLike([3,5,6]);
    }
}
```

Puedes ver que he empezado con ejemplos para capturar la cadena inicial que define un nuevo separador. Al fin y al cabo, ese era el problema que me llevó a replantear el diseño inicial.

La clase Parse quedaría más o menos así:

```php
namespace kata;

class Parser
{
    private $separator = ',';
    private $numbers = [];


    /**
     * @param $command
     * @param $parts
     *
     * @return mixed
     */
    public function parse($command)
    {
        $parts = [];
        preg_match('/^(?:\/\/(.)\n)?(.+)?$/', $command, $parts);

        if (!empty($parts[1])) {
            $this->separator = $parts[1];
        }

        if (empty($parts[2])) {
            $parts[2] = $command;
        }

        $this->ensureThatInputIsValid($parts[2]);

        if (isset($parts[2])) {
            $numbers = str_replace("\n", $this->separator, $parts[2]);
            $this->numbers = explode($this->separator, $numbers);
        }

    }

    public function getNumbers() : array
    {
        return $this->numbers;
    }

    /**
     * @param $inputString
     */
    protected function ensureThatInputIsValid($inputString)
    {
        if (substr($inputString, -1, 1) == $this->separator) {
            throw new \InvalidArgumentException('Malformed string');
        }
    }
}
```

Reconozco que no es una belleza, pero de momento hemos logrado eliminar la lógica de parseo de `Calculator` y aislarla en la nueva `Parser`. En cualquier momento, podemos modificar `Parser` sin cambiar `Calculator`, toda vez que `Parser` devuelva un array de números.

Posteriormente, modificamos `Calculator` para hacer que use `Parser` y retocamos `CalculatorSpec` para comprobar que sigue pasando los tests.

Aquí tienes Calculator, que ha adelgazado un montón:

```php
namespace kata;

class Calculator
{
    /**
     * @var Parser
     */
    private $parser;

    public function __construct(Parser $parser)
    {
        $this->parser = $parser;
    }

    public function add($inputString)
    {
        $this->parser->parse($inputString);

        return intval(array_sum($this->parser->getNumbers()));
    }
}
```

Y aquí tienes, `CalculatorSpec`, cuyo único cambio explicaré a continuación:

```php
namespace spec\kata;

use kata\Calculator;
use kata\Parser;
use PhpSpec\ObjectBehavior;
use Prophecy\Argument;

class CalculatorSpec extends ObjectBehavior
{
    public function let()
    {
        $this->beConstructedWith(new Parser());
    }
    function it_is_initializable()
    {
        $this->shouldHaveType(Calculator::class);
    }

    public function it_has_an_add_method_that_accepts_string()
    {
        $this->add('')->shouldReturn(0);
    }

    public function it_can_manage_a_string_with_one_number()
    {
        $this->add('5')->shouldReturn(5);
        $this->add('123')->shouldReturn(123);
    }

    public function it_can_manage_a_string_with_two_numbers()
    {
        $this->add('8,5')->shouldReturn(13);
        $this->add('8,  5')->shouldReturn(13);
        $this->add('82,53')->shouldReturn(135);
    }

    public function it_can_manage_several_numbers()
    {
        $this->add('3,5,8,4')->shouldReturn(20);
    }

    public function it_can_manage_cr_as_separator()
    {
        $this->add("1\n2,3")->shouldReturn(6);
    }

    public function it_throws_exception_when_malformed()
    {
        $this->shouldThrow(\InvalidArgumentException::class)->during('add', ["1,\n"]);
    }

    public function it_allows_to_change_separator()
    {
        $this->add("//;\n1;2")->shouldBe(3);
    }
}
```

Primero, explico lo que ha cambiado en la Spec:

El método `let` en PHPSpec es similar al `setUp` de PHPUnit. Se ejecuta siempre antes de cada ejemplo y nos sirve para preparar cosas. Por ejemplo, para construir nuestra clase bajo test y pasarle dependencias en el constructor. En este caso, le pasamos Parser mediante el método `beConstructedWith` que equivale a llamar al constructor, y así ver si `Calculator` sigue pasando todos los tests, cosa que ocurre.

– ¡Un momento! ¡Te has dejado el aislamiento encima del piano!

– Efectivamente, acabo de pasar un colaborador "real" en un test y no un doble.

– ¿Eso no es una herejía merecedora de la hoguera?

– Depende.

Se supone que los tests unitarios sirven para probar las unidades de software en aislamiento. Generalmente eso se interpreta de tal modo que al hacer un test de una clase que utiliza colaboradores (o sea, que tiene dependencias) no se le pasan las dependencias reales, sino "[test dobles](https://talkingbit.wordpress.com/2017/05/19/del-ojimetro-al-tdd/)".

Con todo, conviene no ser demasiado dogmático. A veces utilizar las dependencias reales tiene mucho menos coste que usar dobles. Incluso, en algunos casos podríamos argumentar que la "unidad de software" es, realmente, el conjunto de la clase con sus dependencias.

En este caso, si pasamos un doble de `Parser` (que sería un *Stub*) la Spec quedaría más o menos así:

```php
namespace spec\kata;

use kata\Calculator;
use kata\Parser;
use PhpSpec\ObjectBehavior;
use Prophecy\Argument;

class CalculatorSpec extends ObjectBehavior
{
    public function let(Parser $parser)
    {
        $this->beConstructedWith($parser);
    }
    function it_is_initializable()
    {
        $this->shouldHaveType(Calculator::class);
    }

    public function it_has_an_add_method_that_accepts_string(Parser $parser)
    {
        $parser->parse('')->shouldBeCalled();
        $parser->getNumbers()->willReturn([]);
        $this->add('')->shouldReturn(0);
    }

    public function it_can_manage_a_string_with_one_number(Parser $parser)
    {
        $parser->parse('5')->shouldBeCalled();
        $parser->getNumbers()->willReturn([5]);
        $this->add('5')->shouldReturn(5);
    }

    public function it_can_manage_a_string_with_two_numbers(Parser $parser)
    {
        $parser->parse('8,5')->shouldBeCalled();
        $parser->getNumbers()->willReturn([8, 5]);
        $this->add('8,5')->shouldReturn(13);
    }

    public function it_can_manage_several_numbers(Parser $parser)
    {
        $parser->parse('3,5,8,4')->shouldBeCalled();
        $parser->getNumbers()->willReturn([3, 5, 8, 4]);
        $this->add('3,5,8,4')->shouldReturn(20);
    }
}
```

Y esta Spec resulta bastante problemática por varias razones. pero la principal es que está acoplada a la implementación. Además, lo único que se testea es algo que ya sabemos que funciona bien, la función `array_sum`.

En todos los casos tenemos que comprobar que llamamos a los métodos `parse` y `getNumbers` de Parser, lo cual es un problema. Si cambiamos el modo de usar Parse, los tests de Calculator van a fallar no porque den un resultado distinto, sino precisamente porque ha cambiado la forma de usar el colaborador. A esto lo denominamos como test "frágil" y normalmente es un indicador que de tenemos un mal diseño (algo que no excluyo en este ejemplo, que conste).

O quizá simplemente nos dice que hemos escogido una mala manera de hacer los test. Si en lugar de usar los dobles hubiésemos usando la dependencia, ni siquiera tendríamos que crear nuevos tests.

En resumidas cuentas, usar los dobles, en este caso, nos sale más caro.

Por supuesto, esto no es una normal general y hay infinidad de situaciones en las que el testing con dobles es mucho más recomendable e incluso necesario. Precisamente, estoy pensando en escribir un artículo sobre el tema de los dobles en PHPSpec y cómo usarlos para crear diseños desacoplados dependientes de abstracciones.

Pero para cerrar esta serie quería resaltar algo. El dogmatismo en TDD (y en cualquier otra práctica) nos puede llevar a una situación paralizante.
