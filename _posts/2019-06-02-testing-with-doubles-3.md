---
layout: post
title: Guía para testear con dobles (3)
categories: articles
tags: testing
---

En esta entrada vamos a hablar de dobles que no son dobles: los `fakes`.

## Fakes

No hemos hablado todavía de los *fakes*. Los fakes son un tipo de doble que sustituye a unidades que intervienen en el test y que por sus características introducen efectos indeseados como lentitud, dependencia de servicios de terceros, etc.

Los fakes, de hecho, son objetos que ofrecen el mismo comportamiento, o uno equivalente, que aquellos a los que reemplazan, pero evitando los costes extras de latencia, tiempo de ejecución o errores debidos a condiciones del sistema. Son, dicho en otras palabras, implementaciones alternativas de sus interfaces, creadas para usar en un entorno de test.

En entregas anteriores hemos dicho que los dobles no deberían contener lógica para generar las respuestas simuladas. En el caso de los fakes esta regla no se cumple. De hecho, quizá no deberíamos considerarlos como test doubles, sino como implementaciones a medida para situaciones de test.

Los fakes juegan un papel importante en los tests de integración y en los tests *end to end*, porque nos permiten crear entornos realistas, pero que a la vez están aislados de servicios remotos o que tengan alto coste en rendimiento o capacidad. 

### `Fake` como implementación alternativa

Uno de los ejemplos clásicos es el de los repositorios en memoria. Los repositorios, que se encargan de la persistencia de las entidades, son lentos por naturaleza y costosos para realizar tests. Sin embargo, si tenemos una implementación que guarde los datos en memoria, la velocidad de ejecución del test aumentará muchísimo.

El problema, obviamente, es que tener buenos fakes implica implementar varias veces una misma interfaz y hacer que pasen exactamente los mismos tests. Por otro lado, en algunos casos, la complejidad del comportamiento que necesitamos puede ser excesiva, aunque esa circunstancia podría estar revelando problemas y debilidades en nuestro diseño.

Así, por ejemplo, es relativamente fácil implementar los comportamientos de persistir y recuperar un objeto, pero las cosas se complican cuando necesitamos hacer búsquedas en función de diversos criterios.

El ejemplo a continuación es un motor de almacenamiento en memoria muy simple (e inacabado, por cierto) que nos serviría para construir implementaciones en memoria de repositorios con algunos métodos básicos.

```php
<?php

namespace Milhojas\Infrastructure\Persistence\Storage\Adapter;

use Milhojas\Infrastructure\Persistence\Storage\Storage;

class MemoryStorage implements Storage
{
    private $collection;

    public function __construct()
    {
        $this->collection = new \SplObjectStorage();
    }

    public function store($object)
    {
        $this->collection->attach($object);
    }
    
    public function findAll()
    {
        return $this->collection;
    }
    
    public function findBy($specification)
    {
        return $this->collection;
    }
}
```


### El `fake` como suplantador de comportamiento

Cuando decimos que los *fakes* ofrecen el mismo comportamiento que los objetos a los que sustituyen, puede ser más correcto decir que suplantan ese comportamiento con otra versión que, de cara al consumidor del *fake* es indistinguible.

Supongamos, por ejemplo, que vamos a testear un proceso en el que se envían emails. Idealmente, habremos definido una interfaz de un Mailer y creado algún adaptador para que no tener una dependencia directa de una librería específica como puede ser Swift Mailer. 

Es decir, en producción estamos enviando mensajes de correo electrónico, pero en los entornos de tests no queremos que lleguen a enviarse. Existen varias formas de evitarlo, como puede ser configurar el mailer para que en el entorno de test no envíe realmente los correos, o los envíe a una dirección que tenemos *ad hoc*, o incluso usar algún servicio intermediario que retenga los mensajes enviados.

La otra opción es crear un `FakeMailer` que implemente la interfaz `Mailer` de tal manera que los correos nunca se llegan a enviar. El comportamiento no es el mismo, pero desde el punto de vista del proceso que utiliza el `Mailer`, no hay ninguna diferencia: una vez que le entrega el mensaje la responsabilidad es del Mailer.

## Un ejemplo de Fake

Una forma de comunicarse entre distintas aplicaciones es a través de colas. Las colas son relativamente fáciles de usar pues normalmente basta con poder poner mensajes o recoger el primero disponible. Nosotros utilizamos habitualmente el servicio de colas de Amazon Web Services pero es bastante obvio que en entorno de test no nos interesa enviar mensajes a una cola real, incluso aunque sea una cola específicamente para pruebas.

Por eso necesitamos suplantar el comportamiento de nuestras colas, cosa que podemos hacer con un *fake* similar al que muestro a continuación. En este caso, el *fake*, recoge el mensaje y lo guarda en un archivo temporal en el sistema de archivos, de modo que podríamos hacer tests de tipo *end to end* en los que un proceso pone mensajes en una cola para que los consuma otro, 

```php
<?php
class SQSCommunicationFake implements QueueCommunicationInterface
{
    private const TMP_DIR = '/var/tmp/';

    public function put(
        string $queueName,
        string $message,
        array $extra = []
    ): void {
        $queuePath = $this->getQueuePath($queueName);
        if ($this->couldNotCreateDirectory($queuePath)) {
            throw new \RuntimeException(sprintf('Directory "%s" was not created', $queuePath));
        }
        file_put_contents(
            $queuePath . md5($message) . '.msg',
            serialize($message)
        );
    }

    public function get(
        string $queueName,
        array $extra = []
    ): ?string {
        $queuePath = $this->getQueuePath($queueName);
        $file = $queuePath . md5($message) . '.msg';
        $message = file_get_contents($file);
        unlink($file);
        return unserialize($message);
    }

    public function clean(string $queueName): void
    {
        array_map('unlink', glob($this->getQueuePath($queueName) . '/*'));
    }

    public function cleanAll($dir = self::TMP_DIR): void
    {
        $objects = scandir($dir);
        foreach ($objects as $object) {
            if ($object === '.' || $object === '..' || $object === '.gitkeep') {
                continue;
            }

            if (filetype($dir . $object) === 'dir') {
                $this->cleanAll($dir . $object . '/');
            } else {
                unlink($dir . $object);
            }
        }
        if ($dir !== self::TMP_DIR) {
            rmdir($dir);
        }
        reset($objects);
    }

    public function countMessagesIn(string $queueName): int
    {
        return count(glob($this->getQueuePath($queueName) . '/*'));
    }

    private function getQueuePath(string $queueName): string
    {
        return self::TMP_DIR . $queueName . '/';
    }

    private function couldNotCreateDirectory(string $queuePath): bool
    {
        return ! file_exists($queuePath) && ! mkdir($queuePath) && ! is_dir($queuePath);
    }
}
```
