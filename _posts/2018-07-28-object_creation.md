---
layout: post
title: Patrones de creación de objetos
categories: articles
tags: php
---

Cada vez que necesitamos instanciar objetos en una aplicación tenemos que resolver un pequeño problema.

## El buen y viejo `new`

Toda la instanciación de objetos en PHP se realiza mediante la invocación de `new` y el tipo de objeto que deseamos obtener:

```php
$object = new MyClass();
```

A partir de este momento la variable `$object` puede utilizarse como un objeto de ese tipo (`MyClass`) y podemos pedirle que realice sus comportamientos propios o pasarlo como parámetro a otros objetos que lo precisen. Por ejemplo:

```php
$line = new InvoiceLine();

$invoice = new Invoice();
$invoice->addLine($line);

$payment = new Payment($invoice);
```

En el momento de creación de un objeto podemos pasarle una cantidad variable de parámetros necesarios para su construcción.

Algunos objetos se inician sin necesidad de parámetros:

```php
$builder = new Builder();
```

Mientras que otros pueden necesitar unos cuantos:

```php
$customer = new Customer($name, $surname, $email);
```

Y en algunos casos necesitaremos muchos parámetros, pero muchos:

```php
$student = new Student(
    $id,
    $name,
    $surname,
    $mail,
    $parent1,
    $parent2,
    $birthday,
    $street,
    $street_number,
    $location,
    //...
);
```

Da igual. En todos los casos invocaremos el método constructor con `new`.

## El método `__construct`

En PHP el método `__construct` es invocado automáticamente cuando hacemos `new`.

Lo que ocurre entonces es que se crea la instancia del objeto usando la definición de la clase como "plantilla". Por lo demás, el método `__construct` es un método más en el que disponemos de la referencia a la instancia recién creada en el símbolo `$this`.

Podemos recibir cualquier número de parámetros en esta función que, normalmente, asignaremos a sus propiedades ya sea directamente, ya sea superando alguna verificación o transformación.

La función `__construct` es el punto adecuado para asegurarnos de que [el objeto está bien construido](https://matthiasnoback.nl/2018/07/objects-should-be-constructed-in-one-go/). Ya hemos hablado en otras ocasiones de lo que significa esto, pero para resumir podemos decir que un objeto bien construido:

* Tiene asignadas todas la propiedades que necesita obligatoriamente para funcionar.
* Los valores de estas propiedades son correctos dentro de su dominio.

Por ejemplo, un objeto que represente un email:

```php
class Email
{
    private $email;
    
    public function __construct(string $email)
    {
        if (! filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new InvalidArgumentException(
                sprintf('%s is not valid email', $email);
            );
        }
        $this->email = $email;
    }
}
```

Garantizar que un objeto está bien construido nos permite despreocuparnos de él cuando lo tengamos que usar. 

Por ejemplo, si necesitamos un email en un momento dado podríamos utilizar un string, pero al usarlo debemos comprobar que es, efectivamente, un email y así cada vez que sea necesario.

Sin embargo, si utilizamos un objeto Email que ha sido validado en el momento de su creación, lo cierto es que el objeto no puede tener otra cosa que un email válido, por lo cual lo podemos utilizar sin más preocupación.

### Una solución para muchos casos

El hecho de que tengamos un único sistema para instanciar los objetos y, considerando que queremos instanciar objetos válidos, hace que en muchas ocasiones nos encontremos ciertas dificultades a la hora de manejar casos particulares.

Esos casos particulares se pueden agrupar en varias categorías. O dicho de otro modo, esas situaciones encajan en una serie de patrones, que llamamos patrones creacionales, y que tienen soluciones bien probadas y realmente útiles.

## Poder crear un objeto de diferentes formas: named constructors

Nuestro primer problema es bastante obvio. A veces sería útil poder tener varios tipos de constructor porque la información necesaria para instanciar nuestros objetos tiene distintas formas.

Inicialmente podríamos preparar esa información para adaptarla a nuestro constructor pero eso tiene algunos inconvenientes:

* Tenemos que añadir esa preparación, lo que añade ruido al código.
* Repetirlo en varios puntos del código.

Nuestra opción es hacer que el propio objeto se encargue de preparar las cosas necesarias para instanciarse, es decir, las encapsularemos en un método de la propia clase, el cual realizará la transformación y la instanciación y devolverá el nuevo objeto.

Para ello usaremos un método estático. Un método estático "pertenece" a la clase, aunque no al objeto porque, de hecho, al ejecutar el método estático no existe ninguna instancia del objeto.

Veamos un ejemplo que ya he usado otras veces: coordenadas. En esta ocasión voy a obviar las validaciones y otros controles para centrarme en el punto que intento mostrar.

En primer lugar, esta es la construcción estándar de este tipo de objeto:

```php
class Coordinates
{
    private $longitude;
    private $latitude;
    
    public function __construct(float $longitude, float $latitude)
    {
        $this->longitude = $longitude;
        $this->latitude = $latitude;
    }
}
```

Supongamos ahora que obtenemos información de coordenadas en forma de array de dos elementos ya que proviene de una cierta API a la que estamos recurriendo para obtener la información y nos la proporciona de esa forma.

```php
$coordinatesFromAPI = [45.23, -12.43];
```

Podríamos hacer lo siguiente:

```
$coordinatesFromAPI = [45.23, -12.43];

$coordinates = new Coordinates($coordinatesFromAPI[0], $coordinatesFromAPI[1]);
```

Esto no está mal y en este caso tan sencillo realmente no es tan feo, pero veamos ahora con un named constructor:

```php
class Coordinates
{
    private $longitude;
    private $latitude;
    
    private function __construct(float $longitude, float $latitude)
    {
        $this->longitude = $longitude;
        $this->latitude = $latitude;
    }
    
    public static function fromAPIArray(array $coordinates): Coordinates
    {
        return new self($coordinates[0], $coordinates[1]);
    }
}
```

Ahora lo escribiríamos así:

```
$coordinatesFromAPI = [45.23, -12.43];

$coordinates = Coordinates::fromAPIArray($coordinatesFromAPI);
```

De este modo la lógica de creación del objeto a partir de una forma de obtención de los datos es gestionada por el código de la propia clase y no necesitamos saber cómo se tiene que preparar la información, tan sólo pasársela.

Cuando usamos named constructors es frecuente hacer privado el constructor para obligar a usar estos métodos. No es obligatorio, aunque se considera una buena práctica. En caso de que usar el método constructor estándar tenga sentido, siempre podremos crear un named constructor que lo reemplace.

```php
class Coordinates
{
    private $longitude;
    private $latitude;
    
    private function __construct(float $longitude, float $latitude)
    {
        $this->longitude = $longitude;
        $this->latitude = $latitude;
    }
    
    public static function fromCoordinates(float $longitude, float $latitude): Coordinates
    {
        return new self($longitude, $latitude);
    }
    
    public static function fromAPIArray(array $coordinates): Coordinates
    {
        return new self($coordinates[0], $coordinates[1]);
    }
}
```


## Poder instanciar una subclase de una jerarquía sin saber cuál a priori: factory method

Con frecuencia tendremos una jerarquía de classes, sobre todo un conjunto de clases hermanas, y puede que hasta el momento de instanciar el objeto, en tiempo de ejecución, no sepamos cuál vamos a querer.

Muy probablemente eso lo sabremos por alguna circunstancia en el momento de la instanciación, algo que se podría indicar por uno o varios parámetros, y decidir entonces qué objeto instanciar.

Imagina un sistema de planes de pago de un servicio con los típicos tramos Free, Family y Pro. Podría representarse más o menos así:

```php
abstract class PaymentPlan
{
}

class FreePaymentPlan extends PaymentPlan
{
}

class FamilyPaymentPlan extends PaymentPlan
{
}

class ProPaymentPlan extends PaymentPlan
{
}
```


Nuestro primer acercamiento, tras obtener la respuesta del usuario, sería utilizar una estructura if o switch para decidir qué subclase instanciar.

```php
switch ($userSelection) {
    case 'free':
        $plan = new FreePaymentPlan();
        break;
    case 'family':
        $plan = new FamilyPaymentPlan();
        break;
    case 'pro';
        $plan = new ProPayment();
        break;
    default:
}
```

La alternativa es tener un factory method (método factoría) que encapsule esa lógica. Al igual que el named constructor, se trataría de un método estático, pero hay varias diferencias:

* Normalmente estará en una clase base o abstracta.
* No devuelve una instancia de sí mismo, sino de la subclase solicitada.

```php
abstract class PaymentPlan
{
    public static function create($userSelection): PaymentPlan
    {
         switch ($userSelection) {
            case 'free':
                return new FreePaymentPlan();
                break;
            case 'family':
                return new FamilyPaymentPlan();
                break;
            case 'pro';
                return new ProPayment();
                break;
            default:
        }   
    }
}
```

De este modo, cada vez que necesitemos instanciar un objeto PaymentPlan no tenemos más que hacer algo así:

```php
$plan = PaymentPlan::create($userSelection);
```

## Objetos que son difíciles de construir: builder

Cuando una función o método requiere más de tres parámetros comienza a convertirse en una pequeña pesadilla que empeora a medida que aumenta el número de parámetros, especialmente si sus valores pueden ser semejantes entre sí o repetitivos.

Una primera aproximación es trata de crear Parameter objects o value objects siempre que sea posible y aliviar así el trabajo del constructor.

Sin embargo, a veces la dificultad viene determinada no sólo por la cantidad de parámetros, sino por las relaciones que pueden existir entre ellos.

Por ejemplo, podemos tener parámetros que dependen unos de otros en alguna forma, o bien parámetros que pueden introducirse en número variable y queremos tener control sobre ello (y no simplemente pasarlos en forma de array o colección), así como otras posibilidades.

En último término esto significa que hay una lógica necesaria para gestionar esa complejidad.

Y para ello, usaremos un Builder.

Un Builder es un objeto que va a encapsular las reglas de creación de otro objeto. El Builder nos ofrece una interfaz de construcción más amigable, resolviendo algunas complicaciones, a la vez que nos garantiza la consistencia del objeto creado.

Hemos hablado de [builders en otras ocasiones](/builder_pattern), pero no está de más retomar y desarrollar algunos puntos:

El Builder puede tener, o no, su propio constructor por si necesita alguna dependencia para llevar a cabo su trabajo, aunque es frecuente que no necesite nada. El builder no debe construirse con información necesaria para instanciar un objeto concreto, sino que los parámetros necesarios se pasan al builder mediante setters.

```php
$builder = new ComplexObjectBuilder();

$builder->forCustomer($customer);
$builder->bySeller($seller);
$builder->addProduct($product1);
$builder->addProduct($product2);

$complexObject = $builder->build();
```

Los parámetros que necesita el constructor de nuestro objeto se mapean a propiedades del builder y podemos asignarles valores por defecto si nos es útil.

```php
class ComplexObjectBuilder
{
    private $customer;
    private $seller;
    private $products;
    
    public function __construct()
    {
        $this->products = [];
    }
    
    public function forCustomer(Customer $customer)
    {
        $this->customer = $customer;
    }
    
    public function bySeller(Seller $seller)
    {
        $this->seller = $seller;
    }
    
    public function addProduct(Product $product)
    {
        array_push($this->product, $product);
    }
}

```

Los builder llevan un método (generalmente build) que se encarga de instanciar el objeto deseado y que puede incluir todo tipo de controles que aseguren que los parámetros son válidos, sin perjuicio de que el constructor incluya las validaciones necesarias.

```php
class ComplexObjectBuilder
{
    private $customer;
    private $seller;
    private $products;
    
    public function __construct()
    {
        $this->products = [];
    }
    
    public function forCustomer(Customer $customer)
    {
        $this->customer = $customer;
    }
    
    public function bySeller(Seller $seller)
    {
        $this->seller = $seller;
    }
    
    public function addProduct(Product $product)
    {
        array_push($this->products, $product);
    }
    
    public function build()
    {
        $object = new ComplexObject(
            $this->customer,
            $this->seller,
            $this->products
        );
        
        return $object;
    }
}
```

Una ventaja del builder es que podemos llamar métodos que añaden parámetros opcionales para construir objetos con mayor personalización y tener constructores más sencillos de paso.

```php
class ComplexObjectBuilder
{
    private $customer;
    private $seller;
    private $products;
    private $discount;
    
    public function __construct()
    {
        $this->products = [];
    }
    
    public function forCustomer(Customer $customer)
    {
        $this->customer = $customer;
    }
    
    public function bySeller(Seller $seller)
    {
        $this->seller = $seller;
    }
    
    public function addProduct(Product $product)
    {
        array_push($this->products, $product);
    }
    
    public function withSpecialDiscount(Discount $discount)
    {
        $this->discount = $discount;
    }
    
    public function build()
    {
        $object = new ComplexObject(
            $this->customer,
            $this->seller,
            $this->products
        );
        
        if ($this->discount) {
            $object->withDiscount($this->discount);
        }
        
        return $object;
    }
}
```

Con frecuencia, los setters del builder ofrecen una interfaz fluida, lo cual facilita su manejo y nos permite hacer la construcción en un solo paso.

```php
class ComplexObjectBuilder
{
    private $customer;
    private $seller;
    private $products;
    private $discount;
    
    public function __construct()
    {
        $this->products = [];
    }
    
    public function forCustomer(Customer $customer): self
    {
        $this->customer = $customer;
        
        return $this;
    }
    
    public function bySeller(Seller $seller): self
    {
        $this->seller = $seller;
        
        return $this;
    }
    
    public function addProduct(Product $product): self
    {
        array_push($this->products, $product);
        
        return $this;
    }
    
    public function withSpecialDiscount(Discount $discount): self
    {
        $this->discount = $discount;
        
        return $this;
    }
    
    public function build()
    {
        $object = new ComplexObject(
            $this->customer,
            $this->seller,
            $this->products
        );
        
        if ($this->discount) {
            $object->withDiscount($this->discount);
        }
        
        return $object;
    }
}
```

Como este ejemplo:

```php
$complexObject = (new ComplexObjectBuilder())
    ->forCustomer($customer)
    ->bySeller($seller)
    ->addProduct($product1)
    ->addProduct($product2)
    ->withSpecialDiscount($discount)
    ->build()
;
```

De esta manera la construcción del objeto queda bastante contenida y legible.

## Familias de objetos listos para usar: factory

Named constructors y Builders encapsulan la creación de objetos individuales. En el primer caso, permitiéndonos diversas formas de construir un objeto. En el segundo, moviendo la lógica de construcción fuera de la clase cuando aquella es particularmente compleja.

Por otra parte, Factory method nos permite instanciar objetos de un tipo que no sabemos con antelación. Si la lógica de creación de estos diversos tipos es complicada o incluso si el abanico de tipos de objetos es relativamente amplio, es preferible tener un objeto que se encargue de esta tarea. Este objeto es una factoría.

La factoría expone métodos que devuelven los objetos que queremos. Podemos diseñarlos de dos formas básicas:

Métodos que devuelven objetos de un tipo especificado como parámetro.

```php
class UserFactory
{
    public function create(string $userType, $other, $parameters, $needed): User
    {
    }
}
```

Métodos que devuelven tipos específicos de objetos y que podemos configurar pasándoles parámetros.

```php
class UserFactory
{
    public function createAdmin(): Admin
    {
    }
    
    public function createAuthor(): Student
    {
    }
    
    public function createEditor(): Teacher
    {
    }
}
```



