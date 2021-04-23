---
layout: post
title: Tests y excepciones
categories: articles
tags: testing good-practices
---

Habitualmente no usamos las excepciones en los tests. Como mucho, esperamos que la unidad bajo prueba lance una excepción y ahí se queda todo:

```php
    public function testShouldFailWithMalformedEmail(): void
    {
        $this->expectException(InvalidArgumentException::class);
        new Email('@example.com');
    }
```

Tanto es así que en caso de que se lance la excepción y, por lo tanto, el test pase, no se verifica ninguna aserción más que pudiera estar presente. Es decir:


```php
    public function testShouldFailWithMalformedEmail(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $email = new Email('@example.com');
        
        // This part of the test is never executed
        
        $this->assertEquals('@example.com', $email->email());
    }
```

De hecho, en este ejemplo que acabo de poner, no tendría ningún sentido que se ejecutase (el objeto Email nunca llega a instanciarse), pero se entiende lo que quiero decir.

El problema es que, a veces, nos interesaría que el test pudiese seguir corriendo y verificar el estado de ciertas cosas tras una excepción.

Recientemente me he encontrado con un par de casos, como son verificar el estado de una entidad tras una excepción y el testeo de un validador.

## `try...catch` en el test al rescate

He visto que en Java es bastante común usar la estructura `try...catch` para testear que se lanzan excepciones, cosa que no había visto anteriormente en código PHP. El caso es que es una buena idea, especialmente cuando necesitamos testear cosas más allá del lanzamiento de la excepción y queremos comprobar otros efectos.

## Verificar que un cambio no se ha producido tras una excepción

En este ejemplo se puede ver cómo estamos testando que un contrato no cambia su estado cuando intentamos validarlo contra un ERP (un servicio que nos ofrece otra aplicación). 

El proceso está encapsulado en un objeto `ContractValidator` que en este test se ha configurado mediante un *stub* que simula que se lanza una excepción `ContractCannotBeValidatedException` para indicar que el contrato no se ha podido validar. El objetivo del test es verificar que al fallar el proceso contra el ERP remoto, el estado del contrato no ha cambiado.

Este es el test que teníamos hasta ahora, en el que hacíamos un doble del contrato para poder verificar que se llamaba al método que cambia el estado de validación:

```php
    public function testShouldFailIfContractCannotBeValidatedAtErp(): void
    {
        $contract = $this->givenAContractToValidate();

        $this->contractValidator
            ->method('validate')
            ->willThrowException(new ContractCannotBeValidatedException());

        $contract->expects(self::never())
            ->method('acceptValidationByErp');

        $this->contractRepository
            ->expects(self::never())
            ->method('save');

        $this->eventDispatcher->expects(self::never())
            ->method('publishEvents');

        $this->expectException(ContractCannotBeValidatedException::class);
            $validateContractRequest = new ValidateContractRequest(Uuid::uuid4()->toString());
            $this->validateContract->execute($validateContractRequest);
    }

```

Sin embargo, este test era bastante insatisfactorio. Para empezar, teníamos doblada la entidad, lo que es una mala práctica en general. Por otro lado, hay demasiadas expectativas sobre los dobles por lo que el test estaría fuertemente acoplado a la implementación. Todo esto es debido a que una vez que el test captura la excepción no se ejecutarían nuevos asserts.

El código de producción realiza varias operaciones, entre ellas llamar al servicio `ContractValidator`, aquí doblado con un *stub*, y ajustar a continuación detalles del Contrato relacionados. Si `ContractValidator` falla, arrojando una excepción, `ValidateContract` relanza la excepción y no hace nada más. Lo que más nos importa es que el Contrato no ha sido marcado como "validado por el ERP".

Para mejorar el test usamos una estructura `try...catch` en el propio test, con lo que podemos capturar la excepción y ejecutar aserciones sobre el estado de Contract. Además, en lugar de un doble, hemos cambiado el método `givenAContractToValidate`, para que devuelva una entidad real. Esto nos permite prescindir de todos los mocks y sus expectativas, ya que ahora el test sí verifica un cambio observable. Incluso documenta mejor el uso de este _use case_:

```php
    public function testShouldFailIfContractCannotBeValidatedAtErp(): void
    {
        $contract = $this->givenAContractToValidate();

        $this->contractValidator
            ->method('validate')
            ->willThrowException(new ContractCannotBeValidatedException());

        try {
            $validateContractRequest = new ValidateContractRequest(Uuid::uuid4()->toString());
            $this->validateContract->execute($validateContractRequest);
        } catch (ContractCannotBeValidatedException $exception) {
            $this->assertFalse($contract->validationIsAcceptedByErp());
        }
    }
```


## Test de validadores

Otro caso en el que la estrategia de usar el `try...catch` dentro de un test funciona bastante bien tiene que ver con la validación de datos. En este caso, a partir de los datos recibidos en un endpoint de una API, necesitamos crear un objeto válido y, en caso de que alguno de los datos no lo sea, devolver una lista con los errores encontrados.

Una de las estrategias que nos planteamos fue lanzar una excepción en caso de detectar errores y hacer que contuviese un payload con la lista de errores recopilada y sus causas.

El problema es que no hay forma de testear eso si simplemente esperamos que se lance la excepción. En realidad, ni siquiera la podemos obtener. Pero al hacer `try...catch` y capturarla cuando se lanza, accedemos a la instancia y podemos examinar su payload sin problema. Este es el ejemplo;

```php
    /** @dataProvider invalidDataInFieldsProvider */
    public function testShouldFailWithInvalidValueInField(string $field, string $invalidValue): void
    {
        $httpRequest = $this->getRequestWithField($field, $invalidValue);

        try {
            $this->createValidClientModificationRequest->execute($httpRequest, 'creator@example.com');
        } catch (InvalidClientModificationRequestException $exception) {
            $this->assertCount(1, $exception->getErrors());
            $this->assertArrayHasKey($field, $exception->getErrors());
        }
    }
```

En este caso usamos un _data provider_ para pasar el campo en el que estamos interesados y el ejemplo de valor no válido que llevaría. En `getRequestWithField` construimos un objeto Request (de la HttpFoundation de Symfony, en este caso) que simula los datos recibidos en el endpoint. Por defecto, se crearía una petición válida y luego le sobreescribimos los campos que queremos hacer inválidos.

Al ejecutar el test capturamos la excepción, nos aseguramos de que solo hay una entrada de error y que contiene el campo que hemos pasado como no válido.



