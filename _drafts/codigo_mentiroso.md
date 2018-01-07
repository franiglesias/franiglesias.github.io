---
layout: post
title: Código mentiroso
categories: articles
tags: [solid, good-practices]
---

En esencia, el código mentiroso es todo código que dice que hace algo, pero en realidad no lo hace, o hace algo diferente o desvía nuestra atención de algo que deberíamos saber.

## El nombre equivocado

Una buena parte de los casos de código mentiroso que he creado yo mismo o que me he encontrado tiene que ver con que le ponemos un nombre inadecuado a una variable, método, función o clase.

Por ejemplo:

```php
public function getAmount()
{
    return $this->quantity;
}

public function getPrice()
{
    return $this->amount;
}
```

Este ejemplo puede parecer un poco exagerado, pero ilustra bien la idea: los conceptos no solo parecen estar mal representados, sino que encima son incoherentes entre la estructura interna del objeto y su interfaz pública.

_Amount_, en inglés, puede referirse tanto a cantidad (no una cantidad concreta) como al importe total de una cuenta, por lo que por una parte tenemos un uso correcto, o más o menos correcto, en tanto que nos devolvería la cantidad, y por otra tenemos un uso incorrecto, porque internamente llamamos _amount_ a otro concepto que es el precio.

Veamos un ejemplo un poco menos exagerado que no es una corrección del anterior pero que también tiene cierto peligro:

```php
public function getAmount()
{
    return $this->amount;
}

public function getPrice()
{
    return $this->amount * $this->quantity;
}
```

Ahora tenemos cierta coherencia entre lo privado y lo público, pero es posible que la interfaz pública siga siendo engañosa porque los conceptos no estarían representados con los nombres adecuados. Normalmente, utilizaríamos _Price_ para referirnos al precio unitario de un producto, y _Amount_ para referirnos al importe total. O sea, que estamos representando los conceptos con las etiquetas lingüísticas equivocadas.

Sería más correcto así:

```php
public function getAmount()
{
    return $this->price * $this->quantity;
}

public function getPrice()
{
    return $this->price;
}
```

Ahora los conceptos están alineados en los ámbitos privado y público, lo que nos proporciona una buena base para trabajar: _Amount_ significa una cosa y siempre la misma cosa, lo mismo que _Price_.

Por si todavía no estuviese claro, no hay nada de malo en eliminar la ambigüedad en la interfaz pública:

```php
public function getTotalAmount()
{
    return $this->price * $this->quantity;
}

public function getUnitaryPrice()
{
    return $this->price;
}
```
Y para mantener la coherencia:

```php
public function getTotalAmount()
{
    return $this->unitaryPrice * $this->quantity;
}

public function getUnitaryPrice()
{
    return $this->unitaryPrice;
}
```

Llamar **mentiroso** al código con problemas de nombre es quizá un poco exagerado, pero hay pocas cosas tan molestas en el trabajo como estudiar un código que dice que hace lo que no está haciendo en realidad.

## Efectos colaterales

