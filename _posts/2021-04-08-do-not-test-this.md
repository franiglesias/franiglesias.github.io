---
layout: post
title: No hagas estos tests
categories: articles
tags: testing tdd
---

O al menos, no de esta manera.

## Objetos mensaje

Eventos, Comandos y Queries, son objetos que nos interesan por su significado y que llevan datos para sus respectivos _handlers_. En ocasiones me han planteado: ¿no hay que testear esto?

Quiero decir:

```php
class PostWasCreated
{
    private string $title;
    private string $body;
    
    public function __construct(string $title, string $body)
    {
        $this->title = $title;
        $this->body = $body;
    }
    
    public function title(): string
    {
        return $this->title;
    }
    
    public function body(): string
    {
        return $this->body;
    }
}
```

– ¿No hay que testear que se construye bien?

```php
class PostWasCreatedTest extends TestCase
{
    public function testShouldCreateEvent(): void
    {
        $event = new PostWasCreated('Title', 'Body');
        
        self::assertTrue('Title', $event->title());
        self::assertTrue('Body', $event->body());
    }
}
```

– Pues no. Tanto si es en una situación de TDD, como si en QA, este test es una pérdida de tiempo.

– Pero imagínate que te lías y asignas el valor de body a title y viceversa.

– Es que no lo tienes que testear así.

En primer lugar, buscamos testear comportamientos. Asignar los parámetros pasados a las propiedades no es un comportamiento en sí mismo.

– ¿Pero no testeas que se crean objetos consistentes? Si hasta tienes una kata basada en eso en este mismo blog.

– Por supuesto, pero lo que verificamos es que construimos objetos que cumplen reglas de negocio y mantienen invariantes. De nuevo: la inicialización de propiedades no es un comportamiento. 

– ¿Entonces?

– La forma adecuada de testear esto es testeando su _handler_.

Imaginemos algún servicio de reservas que notifica a la usuaria por correo electrónico que la reserva ha sido realizada correctamente. Esto se hace porque al realizar la reserva, se lanza un evento `BookingWasCreated`, que contiene los datos básicos de la misma.

Uno de los suscriptores o listeners de este evento es `SendConfirmationMessage` que compone un mensaje y lo envía a través de un `Mailer`, aquí representado con un doble.

El razonamiento es el siguiente: si el evento está bien construido, el mensaje se construirá como se espera. Si el test falla porque el mensaje resultante es, por ejemplo, "Booked from 15/5/2021 to 15:35 @ 16:20", está claro que en alguna parte se han cruzado los datos.

```php
class SendConfirmationMessageTest extends TestCase
{
    public function testShouldNotify(): void
    {
        $event = new BookingWasCreated(
            'fran@example.com', 
            '15/5/2021', 
            '15:35', 
            '16:20'
        );
        
        $message = new Message('Booked from 15:35 to 16:20 @ 15/5/2021');
        $message->to('fran@example.com');
        
        $mailer = $this->createMock(Mailer::class);
        $mailer
            ->expect(self::once())
            ->method('send')
            ->with($message);
            
        $sendConfirmationMessage = new SendConfirmationMessage($mailer);
        
        $sendConfirmationMessage->handle($event);  
    }
}
```

Todo esto aplica igualmente a DTO y otros objetos parámetros que solo llevan datos y no tienen comportamientos.
