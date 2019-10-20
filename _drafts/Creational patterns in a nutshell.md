# Creational patterns in a nutshell

## How should I instantiate new objects?

### It is simple, `__construct` has few parameters

Use the `new` keyword.

```php
$money = new Money(2.95, new Currency('EUR'));

$email = new EmailAddress('user@example.com');
```

### I want several simple ways to instantiate

Use named constructors with expressive names.

```php
$money = Money::fromAmountAndCurrency(2.95, 'EUR');

$price = Money::EUR(2.95);

$price = Money::CENTS(295);

$validatedStatus = Status::fromString('validated');
```

You should make `__construct` private and, in some cases, provide a generic method.

### I need subclasses and I only know which at runtime, but instantiation is still simple.

Use **factory methods**. 

They decide the class they need to instantiate.

```php

$newUser = User::create('user@example.com', 'secret-password', 'admin');

abstract class User implements UserInterface
{
    private $username;
    private $password;
    
    private __construct(string $username, string $password)
    {
        $this->username = $username;
        $this->password = $password;
    }
    
    public static function create(string $username, string $password, string $type): UserInterface
    {
        switch $type {
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


### The object has complex construct conditions, with some optional and/or dependent parameters

Use a **Builder**. 

A Builder could have dependencies, and should receive data needed to instantiate the object via setters.

Also, Builders are a valid use case for fluent interfaces.

```php


```

### Object type is only known at runtime and/or instantiation logic is complex, maybe with dependencies to retrieve data from specific sources, perform checkings, etc.

Use a **Factory**. 

A factory encapsulates creational logic in an object. This logic could take the form any of the aforementioned patterns.

```php

```
