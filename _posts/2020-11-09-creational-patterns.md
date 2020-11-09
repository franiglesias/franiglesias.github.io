---
layout: post
title: New no. Lo siguiente
categories: articles
tags: design-patterns
---

Artículo transcripción de la charla.

PHP, como todos los lenguajes orientados a objetos, tiene una forma canónica de instanciar objetos: la palabra clave `new`.

```php
new Money(35.4, “EUR”)
```

Cuando ejecutamos esta línea se invoca el método `__construct` en la clase, asignando al objeto una posición y espacio en la memoria:

```php
class Money
{

    private const PRECISION = 2;
    private string $amount;
    private string $currency;

    public function __construct($amount, string $currency)
    {
        $this->amount = $this->normalize($amount);
        $this->currency = $currency;
    }

    private function normalize($amount): string
    {
        return number_format((float)$amount, self::PRECISION);
    }
}
```

En versiones antiguas de PHP era posible usar como constructora una función con el mismo nombre que la clase, aunque es una práctica en desuso y, de hecho, deprecada.

`__construct` es un buen lugar para introducir toda la lógica necesaria para sanear, validar o transformar, los parámetros que necesitemos en la instanciación de objetos.

En el ejemplo, podemos ver cómo la función privada normalize es invocada desde `__construct` para asegurar que el valor de `$amount` se convierte en un `string` y tiene una precisión de dos decimales.

```php
  private function normalize($amount): string
    {
        return number_format((float)$amount, self::PRECISION);
    }
}
```

De este modo, no es necesario que el consumidor de Money sepa nada acerca de esa precisión interna que maneja la clase y que complicaría cualquier intento de instanciación.

Pero...

## Necesito varias formas diferentes de instanciar la misma clase

En muchas aplicaciones existe una diversidad de fuentes de entrada de datos que deberían dar lugar al mismo tipo de objetos. Por ejemplo, si manejo precios en una tienda online es posible que tenga proveedores que me indican sus precios con distintos formatos.

Por ejemplo, tal vez un API de un proveedor me presente los precios con un `string` de este tipo:

```php
$providerPrice = '35.49 EUR';
```

Esto me obliga a parsear el `string` para obtener `amount` y `currency` y así poder instanciar mi objeto Money.

```php
$providerPrice = '35.49 EUR';

[$amount, $currency] = explode(' ', $providerPrice);

$money = new Money($amount, $currency);
```

Por otro lado, podría ser que la mayor parte de las veces sólo esté usando una `currency` (por ejemplo, euros), lo que hace muy tedioso tener que estar pendiente de pasarla correctamente:

```php
const EUR = 'EUR';

$money = new Money(40.34, EUR);
```

En ese caso usaremos `Named Constructors`. Se trata de métodos estáticos que encapsulan distintas variantes de la lógica de instanciación de los objetos.

Así, por ejemplo, podríamos tener:

```php
$money = Money::fromProvider('35.49 EUR');
```

en lugar de:

```php
$providerPrice = '35.49 EUR';

[$amount, $currency] = explode(' ', $providerPrice);

$money = new Money($amount, $currency);
```

O también:

```php
$money = Money::eur(40.34);
```

En lugar de:

```php
$money = new Money(40.34, 'EUR');
```

Se trata, entonces, de tener una interfaz que exponga una variedad de métodos para crear objetos de ese tipo:

```php
interface MoneyInterface
{
    public static function fromProvider(string $money): Money;

    public static function withCurrency($amount, string $currency): Money;

    public static function eur($amount): Money;
}
```

Que se podría implementar así:

```php
class Money
{
    private const PRECISION = 2;
    private string $amount;
    private string $currency;

    private function __construct($amount, string $currency)
    {
        $this->amount = $this->normalize($amount);
        $this->currency = $currency;
    }

    public static function fromProvider(string $money): self
    {
        [$amount, $currency] = explode(' ', $money);

        return new self($amount, $currency);
    }

    public static function withCurrency($amount, string $currency): Money
    {
        return new self($amount, $currency);
    }
    
    public static function eur($amount): Money
    {
        return new self($amount, 'EUR');
    }
    
    private function normalize($price): string
    {
        return number_format((float)$price, self::PRECISION);
    }
}
```

En estos casos, es conveniente que `__construct` sea privada para indicar que existen esa variedad de métodos de construcción.

Fíjate que, en último término, siempre se va a ejecutar la constructora canónica, en la que estarán todas las validaciones comunes. Los `named constructors` simplemente encapsulan variantes de la forma de llegar a la instanciación en distintas circunstancias.

Pero…

## Necesito instanciar subtipos en tiempo de ejecución

Es posible que debamos instanciar un objeto de una familia de objetos (bien por herencia, bien porque implementa una interfaz) pero sin saber a priori qué subtipo concreto.

Para este problema usamos los `Factory Methods`. Un `factory method` es un método de una clase que crea instancias de objetos decidiendo en base a algún criterio qué objeto debe crear.

Por ejemplo, esta clase abstracta `User` tiene un método para crear objetos `UserInterface` en función del rol del usuario que se creará:

```php
abstract class User implements UserInterface
{
    private $username;
    private $password;

    private function __construct(string $username, string $password)
    {
        $this->username = $username;
        $this->password = $password;
    }

    public static function create(string $username, string $password, string $role): UserInterface
    {
        switch ($role) {
            case 'admin':
                return new AdminUser($username, $password);
            case 'sales':
                return new SalesUser($username, $password);
            default:
                return new Customer($username, $password);
        }
    }
}
```

De este modo, cuando se añade un usuario al sistema lo podemos hacer así:

```php
$newUser = User::create(
        'user@example.com',
        'secret-password',
        'admin'
);
```

### Diversión con Factory Methods

Los `factory methods` nos pueden ayudar en un refactor que usa los subtipos para modelar el diferente comportamiento de los objetos en función de si tienen un determinado atributo.

Es decir, en lugar de mirar una cierta propiedad (habitualmente una propiedad con el significado de tipo o clase), lo que hacemos es instanciar un objeto del tipo, con un comportamiento específico.

Por ejemplo, este Carro de la compra de una tienda online, cuando se hace el Checkout se bloquea para no permitir cambios. En lugar de tener una propiedad `locked` y consultarla para ver si algo se puede hacer en el caso de que el carro esté bloqueado, lo que se hace es generar un Carro Bloqueado que ya implementa ese comportamiento y se asegura de que no se pueden hacer ciertas cosas:

```php
class Cart
{
    private CartId $id;
    protected array $items;

    private function __construct(CartId $id)
    {
        $this->id = $id;
        $this->items = [];
    }

    public static function pickUp(CartId $cartId): Cart
    {
        return new self($cartId);
    }
    
    public function lock(): LockedCart
    {
        return LockedCart::fromCart($this);
    }
}
```

En `Cart`, el método `lock`, bloquea el carro:

```php
$cart = Cart::pickUp(CartId::fromString('cart-id'));
$cart->addItem(ProductExample::withSku('product-01'), 10);

$cart = $cart->lock();
```

`LockedCart` es un tipo de `Cart`:

```php
class LockedCart extends Cart
{
    public static function fromCart(Cart $cart): LockedCart
    {
        $locked = new self($cart->id());
        $locked->items = $cart->items;

        return $locked;
    }

    public static function pickUp(CartId $cartId): Cart
    {
        throw new CartIsLocked('You cannot pick up this cart again');
    }

    public function addItem(Product $product, int $quantity): void
    {
        throw new CartIsLocked('You cannot add items to this cart');
    }

    public function removeItem(ProductSku $productSku): void
    {
        throw new CartIsLocked('You cannot remove items from this cart');
    }

    public function changeQuantity(ProductSku $productSku, int $delta): void
    {
        throw new CartIsLocked('You cannot modify item quantity in this cart');
    }

    public function removeAllItems(ProductStoreManager $productStoreManager): void
    {
        throw new CartIsLocked('You cannot remove items from this cart');
    }
}
```

Los métodos que modificaría el carro arrojan una excepción, lo que impide manipular su contenido.

Se puede ver que hay un método `named constructor` en `LockedCart` para facilitar la creación del carro a partir de uno existente.

Pero...

## Necesito poder duplicar un objeto sin saber su clase exacta

En ocasiones una forma de construir objetos es a partir de otro que ya existe debido a que nos interesa mantener toda o la mayor parte de su información pero en un objeto nuevo.

PHP nos ofrece la función `clone`, pero esto realmente duplica el objeto con todas sus propiedades y no siempre querremos esto. Por ejemplo, no nos interesa que use la misma identidad o la misma fecha de creación.

Para eso existe el patrón `Prototype`. La idea es implementar un método `clone` (que es esencialmente un factory method) con el que duplicamos el objeto.

Supongamos que nuestra tienda online nos permite duplicar un carro anterior para poder comprar los mismos productos:

```php
class Cart
{
    public function clone(CartId $newId): Cart
    {
        $newCart = new self($newId);
        $newCart->items = $this->items;

        return $newCart;
    }

    //…
}
```

En este método `clone` podemos incluir los cambios que necesitemos para mantener la coherencia de los datos.

Pero…

## La construcción de un tipo de objeto es compleja con parámetros opcionales o dependientes entre sí

En ese caso necesitarás un `Builder`.

Un builder es un tipo de objeto que sabe construir objetos de un cierto tipo, encapsulando lógicas de construcción complejas o que necesitan nutrirse de múltiples fuentes de datos.

Por ejemplo, este Builder utiliza varios servicios para obtener la información que necesita y crear un objeto de tipo `Project`.

```php
class ProjectBuilder
{
    public function __construct(
        ProjectRepositoryInterface $projectRepository,
        PanelFactory $panelFactory,
        SalesConditionsCalculator $salesConditionsCalculator
    )
    {
        $this->projectRepository = $projectRepository;
        $this->panelFactory = $panelFactory;
        $this->salesConditionsCalculator = $salesConditionsCalculator;
    }

    public function build(SupplyPoint $supplyPoint, Estate $estate): Project
    {
        $panel = $this->panelFactory->getPanel('normal');
        $salesConditions = $this->salesConditionsCalculator($estate->isDetached());
        $projectId = $this->projectRepository->nextIdentity();

        return Project::build($estate, $panel, $salesConditions, $projectId, $supplyPoint);
    }
}
```

Los Builders nos permiten resolver varios problemas de las construcciones complejas. Como hemos visto en el ejemplo anterior, uno de ellos es la obtención de información y otros objetos de diversas fuentes.

Otros problemas que nos ayuda a gestionar un Builder son la obligatoriedad vs opcionalidad de algunos parámetros y la covarianza entre ellos, es decir, aquellos que siempre van juntos:

```php
class PostalAddress {
    
    private string $street;
    private string $streetNumber;
    private ?string $stairs;
    private ?string $floor;
    private ?string $door;
    private string $postalCode;
    private string $city;
    private string $province;

    public function __construct(
        string $street,
        string $streetNumber,
        ?string $stairs,
        ?string $floor,
        ?string $door,
        string $postalCode,
        string $city,
        string $province
    ) {
        $this->street = $street;
        $this->streetNumber = $streetNumber;
        $this->stairs = $stairs;
        $this->floor = $floor;
        $this->door = $door;
        $this->postalCode = $postalCode;
        $this->city = $city;
        $this->province = $province;
    }
}
```

Este objeto `PostalAddress` puede construirse con un Builder que nos permite cosas como estas:

```php
$builder = new PostalAddressBuilder();

$builder->atLocality($postalCode, $city, $province);
$builder->withApartmentAddress($street, $number, $stairs, $floor, $door);

$address = $builder->build();

```

El método `atLocality` nos ayuda a mantener juntos los parámetros `$postalCode`, `$city` y `$province` que siempre van juntos.

De hecho, sería posible usar un Builder para pasar sólo el parámetro `$city` y usar un servicio que nos localice el código postal y la provincia consultando un API, por ejemplo.

Los métodos del Builder pueden ser semánticos. Por ejemplo, si sabemos que tenemos que instanciar una dirección para una casa unifamiliar podríamos usar:

```php
$builder = new PostalAddressBuilder();

$builder->withHouseAddress($street, $number);
$builder->atLocality($postalCode, $city, $province);

$address = $builder->build();
```

Y esto para un piso:

```php
$builder = new PostalAddressBuilder();

$builder->withApartmentAddress($street, $number, $stairs, $floor, $door);
$builder->atLocality($postalCode, $city, $province);

$apartmentAddress = $builder->build();
```

También podríamos separar la parte obligatoria de la optativa:

```php
$builder = new PostalAddressBuilder();

$builder->withStreetAddress($street, $number);
$builder->withApartment($stairs, $floor, $door);

$builder->atLocality($postalCode, $city, $province);

$apartmentAddress = $builder->build();
```

La interfaz fluida es adecuada en los Builders. De hecho, diría que es hasta recomendable porque ayuda a mantener las expresiones compactas:

```php
$builder = new PostalAddressBuilder();

$address = $builder
     ->withAddress($street, $number, $floor, $door)
     ->atLocality($postalCode, $city, $province)
     ->build();
```

Pero…

## La decisión de qué objeto construir se toma en tiempo de ejecución

Al igual que ocurría con los `factory methods`, hay situaciones en que se combina la complejidad de construir un objeto con la necesidad de posponer su construcción hasta el mismo momento en que lo vamos a utilizar.

Para eso tenemos las *Factories*.

Las `factories` son objetos que saben construir familias de objetos y simplemente les indicamos qué objeto queremos que construya en cada caso:

```php
class ClassifyStrategyFactory
{
    private const TEMPORAL_PATH = 'temporal';
    private const FINAL_PATH = 'final';

   private $distributorUserRepository;

    public function __construct(
        DistributorUserRepositoryInterface $distributorUserRepository
    ) {
        $this->distributorUserRepository = $distributorUserRepository;
    }

    public function createStrategy(string $strategy): DocumentStrategyInterface
    {
        switch ($strategy) {
            case self::TEMPORAL_PATH:
                return new ClassifyTemporalDocument();
           case self::FINAL_PATH:
                return new ClassifyFinalDocument($this->distributorUserRepository);
           default:
                throw new InvalidArgumentException('Invalid strategy');
       }
    }
}
```

O también pueden hacerlo a partir de condiciones que se dan en el momento, como esta factoría que nos proporciona la calculadora de tarifas adecuada al producto que le pasamos:

```php
final class CalculatorFactory
{
    public function forProduct(
        Product $product,
        array $consumptions,
        array $powers,
        ?array $currentPower = null
    ): ProductFeeCalculatorInterface {
        if ($product->isFlatPostPayment()) {
            return new FlatPostPaymentFeeCalculator(
                $product,
                $consumptions,
                $powers,
                $currentPower
            );
        }

        if ($product->isFlatTariff()) {
            return new FlatTariffFeeCalculator($product, $consumptions, $powers);
        }

        if ($product->isClassicProduct()) {
            return new ClassicFeeCalculator($product, $consumptions, $powers);
        }

        throw new RuntimeException('Unable to choose a fee calculator.');
    }
}
```

Y que podemos utilizar así:

```php
$calculator = $this->calculatorFactory->forProduct(
    $product,
    $consumptions,
    $powers,
    $currentPower
);

$fee = $calculator->calculate();
```

## new no, lo siguiente

En este artículo hemos visto distintos patrones de construcción de objetos que resuelven diferentes problemas que se nos presentan al desarrollar aplicaciones.

Uno de los beneficios de usar estos patrones es que el conocimiento necesario para instanciar objetos está contenido en un sólo lugar, lo que nos proporciona cierta seguridad a la hora de introducir cambios o incluso nuevas variedades de objetos.

Por otro lado, nada nos impide mezclar estos patrones. Aunque tengamos Builders o Factories, el hecho de que las clases contengan Factory Methods o Named Constructors nos ayuda a simplificar su uso y mantener un diseño DRY.
