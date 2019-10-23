---
layout: post
title: Parameter (Blogtober2019)
categories: articles
tags: blogtober19
---

Mi compañera y manager en Holaluz [Mavi Jiménez](https://twitter.com/Linkita) va a hacer un dibujo cada día del mes sobre una palabra propuesta en twitter. Y aquí vamos a intentar escribir [un post por cada una de ellas](https://franiglesias.github.io/blogtober19-status/).


## Parameter

¿Cuántos parámetros debería tener la signatura de una función? Es una pregunta interesante porque una cosa es eso y otra la cantidad que realmente necesita. Puede que una función o método necesite veinte parámetros, pero creo que estaremos de acuerdo en que ese número es impracticable.

Así que tenemos que resolver un par de problemas:

* Cuántos parámetros como máximo consideramos aceptables on una función para que tenga una signatura manejable.
* Cómo salvamos la distancia entre una signatura manejable y proporcionar todos los parámetros necesarios.

### El mágico número siete

Ya he traído a colación anteriormente [este artículo de George A. Miller, fundamental en la psicología cognitiva](http://www2.psych.utoronto.ca/users/peterson/psy430s2001/Miller%20GA%20Magical%20Seven%20Psych%20Review%201955.pdf). En resumen, se trata de la idea de que nuestra memoria a corto plazo o memoria de trabajo tiene una capacidad limitada para mantener unidades de información simultáneamente mientras realizamos una tarea. Este límite rondaría los siete chuncks o elementos de información. Actualmente no se intenta determinar un valor preciso de esta capacidad, ya que varía según diversas circunstancias, pero la idea de base de que es una capacidad limitada nos ayuda a explicar, en primer lugar, porqué una signatura de una función con muchos parámetros dificulta nuestra comprensión.

También nos sirve para realizar una estimación, nada científica por otra parte, de la cantidad de parámetros máxima que debería tener un método o función. Repito, esto que voy a hacer no es científico, pero a lo mejor es útil.

Partimos del número siete, pero necesitaremos uno o dos chuncks para llevar cuenta de qué estamos haciendo y no olvidarnos por el camino. Esto nos deja unos cinco chuncks libres.

Gastamos otros dos en el el nombre del método o función y en saber qué es lo que hace. ¿Me sigues? Nos quedan tres chuncks libres, cuatro con suerte.

Conclusión: **tres** parámetros es el máximo recomendable para trabajar cómodamente, manteniendo la carga cognitiva bajo control.

### Soluciones para limitar el número de parámetros

**Value Objects**. Se trata de ver si algunos de esos parámetros se agrupan en una unidad conceptual que puede sernos útil no sólo en esa llamada, sino como concepto del dominio. Por ejemplo, si tenemos que pasar una cantidad que representa dinero y la unidad monetaria, es que en realidad necesitamos un VO Money.

```php
public function setPrice(float $priceAmount, string $priceMonetaryUnit);

//...

public function setPrice(Money $price)
```

**Parameter Object**. Si aún así nos quedan muchos parámetros, podemos crear un objeto que los agrupe todos bajo un nombre significativo. Es posible, incluso, que lo puedas reutilizar.

```php
public function setContactData($phoneNumber, $email, $address);

//...
$contactData = new ContactData($phoneNumber, $email, $address);

public function setContactData(ContactData $contactData);

public function updateContactData(ContactData $contactData);
```

**Reemplazar parámetros con métodos explícitos**. Un método que requiere muchos parámetros podría estar haciendo varias cosas diferentes que se pueden separar. Si es el caso, divide el método en esas partes y haz que reciba cada una sus propios parámetros.

```php
public function setClientData($name, $firstSurname, $secondSurname, $phoneNumber, $email, $address);

//...

public function setClientName($name, $firstSurname, $secondSurname);

public function setContactData($phoneNumber, $email, $address);
```

### Parámetros opcionales

Los parámetros opcionales tienen el inconveniente de que complican la signatura de los métodos. En algunos casos, puede ser buena idea ofrecer métodos alternativos, que ofrezcan una signatura más sencilla de entender, ocultando el método como privado.

```php
public function addEmail(Email $email, bool $allowMarketingNotifications = true);

// Change to private

private function addEmail(Email $email, bool $allowMarketingNotifications = true);

// Alternative explicit methods

public function addEmailAllowingMarketingNotifications(Email $email)
{
    $this->addEmail($email, true);
}

public function addEmailNotAllowingMarketingNotifications(Email $email);
{
    $this->addEmail($email, false);
}
```
