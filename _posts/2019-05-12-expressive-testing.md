---
layout: post
title: Testing expresivo
categories: articles
tags: php testing tdd bdd
---

Desde hace un tiempo estoy explorando una forma de organizar el código de mis tests, al menos de una parte de ellos. A falta de un nombre mejor he decidido llamar a esta organización **testing expresivo**.

Todo empezó por un twit que desgraciadamente olvidé guardar, pero al que no dejé de darle vueltas tras leerlo.

La idea es la siguiente: como bien sabemos, los tests se estructuran en tres partes principales:

* Given o Arrange: donde definimos el escenario y las condiciones de la prueba.
* When o Act: donde ejecutamos la unidad de software bajo test.
* Then o Assert: donde comparamos el resultado esperado con el que obtenemos.

Cuando escribimos un tests, normalmente usaremos esta estructura de manera implícita:

```php
public function testShouldAddAProduct(): void
{
    $product = $this->getProduct('product-1', 10);
    $cart = Cart::pickUp();

    $cart->addProductInQuantity($product, 1);
    
    $this->assertCount(1, $cart);
}
```

Si añadimos unos comentarios para marcarla nos podría quedar una cosa así:

```php
public function testShouldAddAProduct(): void
{
    // Given
    $product = $this->getProduct('product-1', 10);
    $cart = Cart::pickUp();

    // When
    $cart->addProductInQuantity($product, 1);
    
    // Then
    $this->assertCount(1, $cart);
}
```

Pero como ya sabréis de artículos anteriores de este blog, muchos comentarios pueden eliminarse si hacemos explícito en el código lo que este hace, algo que normalmente podemos conseguir extrayendo bloques de código a métodos privados.

```php
public function testShouldAddAProduct(): void
{
    $cart = $this->givenIPickedUpACart();

    $this->whenIAddAProductToTheCart($cart);
    
    $this->thenIShouldHaveAProductInTheCart($cart);
}

protected function givenIPickedUpACart(): Cart
{
    return Cart::pickUp();
}

protected function whenIAddAProductToTheCart(Cart $cart): void
{
    $product = $this->getProduct('product-1', 10);
    $cart->addProductInQuantity($product, 1);
}

protected function thenIShouldHaveAProductInTheCart(Cart $cart): void
{
    $this->assertCount(1, $cart);
}
```

Veamos ambos tests juntos:

```php
public function testShouldAddAProduct(): void
{
    $product = $this->getProduct('product-1', 10);
    $cart = Cart::pickUp();

    $cart->addProductInQuantity($product, 1);
    
    $this->assertCount(1, $cart);
}
```

vs.

```php
public function testShouldAddAProduct(): void
{
    $cart = $this->givenIPickedUpACart();

    $this->whenIAddAProductToTheCart($cart);
    
    $this->thenIShouldHaveAProductInTheCart($cart);
}
```

¿Qué te parece? En este ejemplo, el código del test original es bastante sencillo y bastante fácil de interpretar. Sin embargo, yo diría que su versión expresiva es imbatible en cuanto a legibilidad.

Tanto es así, que podrías enseñarle el código un una persona que no sea desarrolladora y entendería lo que se intenta probar con el test.

## Esto me suena de algo, ¿no?

Efectivamente. Esta forma de nombrar los métodos se parece muchísimo a la manera en que escribiríamos escenarios en lenguaje Gherkin al hacer BDD. ¿No debería estar usando las herramientas de BDD en su lugar?

Creo que no necesariamente. En este ejemplo he mostrado un test unitario, que no es algo propio de BDD. Aunque el ejemplo es muy simple, no es difícil imaginar casos en los que preparar el escenario del test se hace complicado, en especial cuando tenemos que hacer dobles y stubs de colaboradores del *subject under test*.

Por ejemplo, imagina lo que puede haber dentro de este test:

```php
public function testShouldFailWithBadRequestIfInvalidData(): void
{
    $this->givenSalesUserIsLoggedIn();
    $data = $this->givenInvalidRegistrationData();
    $response = $this->whenWeSubmitIt($data);
    $this->thenWeGetBadRequestWithValidationErrors($response);
}
```

Este test está en el nivel *End to End* de una API, así que por debajo prepara un entorno en el que se simula un usuario conectado al sistema, una llamada a un API con una muestra de datos (en este caso, incompletos o inválidos), así como las aserciones sobre la respuesta. Todo ese código técnico metido dentro del test haría éste muy difícil de leer y seguir.

En cambio, ocultando la complejidad técnica del test bajo métodos cuyo nombre explica lo que pasa a un nivel mayor de abstracción nos permite lograr un test razonablemente expresivo.

Hay algunas ventajas más ya que muchas veces estos métodos son fácilmente reutilizables, lo que nos permite crear una especie de lenguaje dentro del propio test, pero eso lo desarrollaré en otros artículos.
