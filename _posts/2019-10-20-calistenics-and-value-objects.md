---
layout: post
title: Object Calisthenics para mejorar el diseño de las clases
categories: articles
tags: good-practices refactoring
---

En este artículo presentamos un ejercicio que puede servir para adquirir soltura a la hora de reconocer patrones que nos permitan organizar objetos complejos mediante value objects.

Un problema típico para una aplicación de *e-commerce* es el de requerir una **dirección de envío** y una **dirección de facturación** para cada pedido. Ambas son muy similares estructuralmente, pero diferentes en cuanto a significado. La dirección de envío es relevante para el sistema logístico y puede requerir un extra de instrucciones especiales, mientras que las de facturación es relevante en términos de legalidad fiscal.

Representar una dirección es un problema aparentemente simple pero en cuanto empiezas a escarbar un poco empiezan a salir todo tipo de inconveniencias. ¿Cuán complicada puede ser una dirección? Pues aparentemente mucho y eso ciñéndonos solo a direcciones postales españolas y sin considerar problemas de formato, simplemente intentando representarlas correctamente en nuestro dominio. 

Supongo que este formulario te sonará, tanto en versión digital como en papel:

```
Tipo de vía
Nombre de la vía
Número
Portal
Bloque
Escalera
Piso
Puerta
Código postal
Localidad
Provincia
```

*En algún caso he visto el campo extra: tipo de numeración, para indicar numeraciones de calles no estándar, como el punto kilométrico cuando la vivienda se encuentra en una carretera, pero con lo anterior creo que ya nos llega.*

Aparte, la dirección necesita contar con el nombre del destinatario y, en el caso de la de facturación, con el identificador fiscal. Es decir, el formulario tendría esta pinta para la dirección de entrega:

```
Nombre
Primer Apellido
Segundo Apellido
Teléfono de contacto
Tipo de vía
Nombre de la vía
Número
Portal
Bloque
Escalera
Piso
Puerta
Código postal
Localidad
Provincia
```

Y así para la dirección de facturación:

```
Nombre
Primer Apellido
Segundo Apellido
NIF
Tipo de vía
Nombre de la vía
Número
Portal
Bloque
Escalera
Piso
Puerta
Código postal
Localidad
Provincia
```

Quince campos para cada dirección. No está mal.

¿Hay formas de simplificar eso? Sí. Una sencilla es agrupar algunos campos de modo que su número se reduzca. Veamos por ejemplo, una versión reducida de la dirección de envío:

```
Nombre
Apellidos
Teléfono de contacto
Dirección
Código postal
Localidad
Provincia
```

Mucho mejor, ¿no? Al fin y al cabo, la dirección se puede expresar en un solo campo fácilmente y eso no supone ningún problema. ¿O sí?

¿Qué ocurre si el cliente solo pone el nombre de la calle y el número de portal, pero no indica el piso? ¿Y si en su edificio hay dos escaleras y no indica cuál? ¿Se entregará su paquete según lo previsto?

Estos problemas, y otros muchos similares, hacen que necesitemos que los clientes nos proporciones sus direcciones de una manera precisa y que no se olviden de ningún dato. Por eso, presentamos formularios con todos esos espacios para que el cliente sea consciente de todo lo que necesita decirnos para poder entregarle su pedido con el mínimo posible de demoras e inconvenientes. Así que en vez de lidiar con siete manejables campos nos toca hacerlo con quince por dirección, lo que hace un total de treinta campos sin contar el resto de los que necesita el pedido.

La siguiente restricción que quiero introducir viene de las [Object Calisthenics](https://williamdurand.fr/2013/06/03/object-calisthenics/). La Calistenia es un sistema de ejercicios destinados a [conseguir gracia y belleza en el movimiento](https://es.wikipedia.org/wiki/Calistenia). En nuestro caso son ejercicios que nos pueden servir para automatizar ciertas buenas prácticas. Su aplicación [contribuye a que el código se ajuste a mejores principios](https://keyvanakbary.com/object-calisthenics-mejora-tu-diseno-orientado-a-objetos/
), como SOLID, Demeter o DRY, y, como mínimo, nos obliga a reflexionar.

En este caso vamos a aplicar dos de las reglas:

* Envolver primitivas en objetos
* Sólo dos variables de instancia

– ¿Cómo?

* Envolver primitivas en objetos
* Sólo dos variables de instancia

– A ver, es que la primera me suena hasta razonable, pero… ¿dos variables de instancia? Estamos hablando de quince campos para especificar una dirección… ¿y quieres que use solo dos variables de instancia?

– Exactamente. Pero deja que me explique…

La primera regla, a poco que la pienses, tiene que ver con los *Value Objects*. Podemos representar valores usando tipos escalares (`string`, `int`, `float`, etc) y aunque es una práctica habitual tiene sus problemas. Los tipos escalares solo nos imponen algunas restricciones muy generales sobre los datos aceptables.

Pongamos por caso, el código postal. En España, el código postal es un número de cinco dígitos, lo que nos sugiere representarlo con un `int`. Pero, en realidad, normalmente es mejor representarlo con un tipo `string` porque aunque tiene forma numérica, no es un número.

Una razón es que puede empezar con un 0 y esto nos daría problemas para mantenerlo si usamos un valor de tipo `int`. Sin embargo, no tiene una semántica numérica, por así decir. El código postal usa los dos primeros dígitos para representar la provincia (así que va de 00 a 52) y los otros tres para identificar el distrito postal, de modo que una localidad grande puede tener varios códigos postales y un mismo código postal puede aplicarse a varias poblaciones muy pequeñas. En último término, un código postal:

* Es un tipo string
* Tiene 5 caracteres
* Todos son numéricos
* Los dos primeros (empezando por la izquierda) representan un número entre 00 y 52.
* Los tres restantes, representan un número que va de 000 a un límite distinto según la provincia.

Ningún tipo escalar nos permite cumplir todas estas restricciones, por lo que es buena idea crear un *Value Object* `PostalCode` que nos permita validar el código conforme a estas reglas y así asegurarnos que solo podemos crear códigos postales válidos o, al menos, reducir al mínimo la posibilidad de introducirlos no válidos.

En otros casos ocurre que un concepto se representa con varios campos de información que siempre van juntos. Así, por ejemplo, un nombre de persona es el nombre de pila y dos apellidos, siendo así que constituyen una unidad. Los tres campos se representan mediante tipos `string` y la forma de indicar que van juntos es reuniéndolos en un *Value Object* `PersonName` que nos permita manejarlos como un todo.

– Pero habías hablado de dos variables de instancia, ¿cómo se come eso con un Value Object que necesitará tres?

La segunda regla dice que no usemos más de dos variables de instancia. Dos es un número totalmente arbitrario y, de hecho, es posible que no siempre podamos llegar a ese objetivo de una manera razonable o sostenible. La regla sería: minimizar la cantidad de variables de instancia, pero forzar un límete arbitrario nos obliga a no conformarnos y tratar de llegar al objetivo si es posible y tiene sentido. Recuerda: **Calistenia es un ejercicio** con el que automatizar una forma de escribir nuestro código.

Esto nos lleva de nuevo al recurso de los *Value Objects*. Como hemos visto hace un momento, algunos conceptos están representados con varios campos que siempre van juntos. Constituyen una unidad que se representa encapsulándolos en un único objeto.

En nuestro caso, tenemos 30 campos que modelan la dirección de envía y la dirección de facturación, así que empecemos a agruparlos:

```
Dirección de envío
    Nombre
    Primer Apellido
    Segundo Apellido
    Teléfono de contacto
    Tipo de vía
    Nombre de la vía
    Número
    Portal
    Bloque
    Escalera
    Piso
    Puerta
    Código postal
    Localidad
    Provincia
Dirección de facturación
    Nombre
    Primer Apellido
    Segundo Apellido
    NIF
    Tipo de vía
    Nombre de la vía
    Número
    Portal
    Bloque
    Escalera
    Piso
    Puerta
    Código postal
    Localidad
    Provincia
```


En el primer nivel ya tendríamos solo dos variables de instancia (dirección de envío y dirección de facturación), así que vamos bien. Ahora vamos a agrupar las otras variables según si cambian juntas como un todo o no:

```
Dirección de envío
    Destinatario
        Nombre
        Primer Apellido
        Segundo Apellido
        Teléfono de contacto
    Dirección Postal
        Tipo de vía
        Nombre de la vía
        Número
        Portal
        Bloque
        Escalera
        Piso
        Puerta
        Código postal
        Localidad
        Provincia
Dirección de facturación
    Titular
        Nombre
        Primer Apellido
        Segundo Apellido
        NIF
    Dirección Postal
        Tipo de vía
        Nombre de la vía
        Número
        Portal
        Bloque
        Escalera
        Piso
        Puerta
        Código postal
        Localidad
        Provincia
```

De nuevo, hemos conseguido reducir a dos las variables de instancia dentro de este nivel. Además, hemos identificado un tipo de dato que nos vale igualmente para ambos tipos de direcciones y que es la Dirección Postal.

Vamos a los siguientes niveles a ver qué descubrimos.

El Destinatario del envío puede representarse también con dos campos que, dentro de ese contexto, pueden cambiar de forma separada. Lo mismo ocurre en el caso del titular de la factura:

```
Dirección de envío
    Destinatario
        Nombre de Persona
            Nombre
            Primer Apellido
            Segundo Apellido
        Teléfono de contacto
    Dirección Postal
        Tipo de vía
        Nombre de la vía
        Número
        Portal
        Bloque
        Escalera
        Piso
        Puerta
        Código postal
        Localidad
        Provincia
Dirección de facturación
    Titular
        Nombre de Persona
            Nombre
            Primer Apellido
            Segundo Apellido
        NIF
    Dirección Postal
        Tipo de vía
        Nombre de la vía
        Número
        Portal
        Bloque
        Escalera
        Piso
        Puerta
        Código postal
        Localidad
        Provincia
```

Y, otra vez, hemos conseguido reducir a dos variables de instancia. Pero hay algo más, hemos conseguido una nueva regularidad ya que Nombre de Persona es un tipo de Value Object que podemos usar exactamente igual en ambos lados.

Vamos a forzar un poco aquí. El nombre de una persona puede estar formado por dos campos: nombre de pila y apellidos, de modo que podemos encapsular estos en un nuevo tipo de objeto Apellidos. Normalmente nos puede interesar tener campos separados para los dos apellidos debido a la existencia de apellidos compuestos y no siempre quedaría claro cuál es el punto de corte si viniesen en un único campo.

```
Dirección de envío
    Destinatario
        Nombre de Persona
            Nombre
            Apellidos
                Primer Apellido
                Segundo Apellido
        Teléfono de contacto
    Dirección Postal
        Tipo de vía
        Nombre de la vía
        Número
        Portal
        Bloque
        Escalera
        Piso
        Puerta
        Código postal
        Localidad
        Provincia
Dirección de facturación
    Titular
        Nombre de Persona
            Nombre
            Apellidos
                Primer Apellido
                Segundo Apellido
        NIF
    Dirección Postal
        Tipo de vía
        Nombre de la vía
        Número
        Portal
        Bloque
        Escalera
        Piso
        Puerta
        Código postal
        Localidad
        Provincia
```

Lo hemos logrado de nuevo, dos variables en un objeto.

Vayamos a la Dirección Postal. Una forma de agrupar los campos tiene que ver con el aspecto de la dirección al que se refieren. Una parte indica la ubicación dentro de la localidad, mientras que la otra nos indica la localidad. Podríamos organizar esos campos así, lo que nos dejaría dos variables en el nivel de la Dirección Postal:

```
Dirección de envío
    Destinatario
        Nombre de Persona
            Nombre
            Apellidos
                Primer Apellido
                Segundo Apellido
        Teléfono de contacto
    Dirección Postal
        Dirección
            Tipo de vía
            Nombre de la vía
            Número
            Portal
            Bloque
            Escalera
            Piso
            Puerta
        Localidad
            Código postal
            Localidad
            Provincia
Dirección de facturación
    Titular
        Nombre de Persona
            Nombre
            Apellidos
                Primer Apellido
                Segundo Apellido
        NIF
    Dirección Postal
        Dirección
            Tipo de vía
            Nombre de la vía
            Número
            Portal
            Bloque
            Escalera
            Piso
            Puerta
        Localidad
            Código postal
            Localidad
            Provincia
```

Ahora, tenemos unos cuantos campos en Dirección y podríamos intentar hacer grupos con ellos. Por ejemplo, Tipo de vía y Nombre de la vía, se refieren a un único concepto. Número. Portal y bloque, indican el acceso dentro de la finca (no se me ocurre como denominar este concepto de otra forma). Y escalera, piso y puerta, indican la vivienda del cliente dentro de un portal concreto de la finca.

```
Dirección de envío
    Destinatario
        Nombre de Persona
            Nombre
            Apellidos
                Primer Apellido
                Segundo Apellido
        Teléfono de contacto
    Dirección Postal
        Dirección
            Via
                Tipo de vía
                Nombre de la vía
            Número
            Acceso
                Portal
                Bloque
            Vivienda
                Escalera
                Piso
                Puerta
        Localidad
            Código postal
            Localidad
            Provincia
Dirección de facturación
    Titular
        Nombre de Persona
            Nombre
            Apellidos
                Primer Apellido
                Segundo Apellido
        NIF
    Dirección Postal
        Dirección
            Via
                Tipo de vía
                Nombre de la vía
            Número
            Acceso
                Portal
                Bloque
            Vivienda
                Escalera
                Piso
                Puerta
        Localidad
            Código postal
            Localidad
            Provincia
```

Todavía podríamos hacer algo más. Vía y número forman una unidad que nos permite identificar la finca en la que se encuentra la dirección. Mientras que los otros dos, acceso y vivienda nos indican la ubicación dentro de la finca. Empieza a ser complicado encontrar nombres para estos conceptos:

```
Dirección de envío
    Destinatario
        Nombre de Persona
            Nombre
            Apellidos
                Primer Apellido
                Segundo Apellido
        Teléfono de contacto
    Dirección Postal
        Dirección
            Finca
                Via
                    Tipo de vía
                    Nombre de la vía
                Número
            Ubicación
                Acceso
                    Portal
                    Bloque
                Vivienda
                    Escalera
                    Piso
                    Puerta
        Localidad
            Código postal
            Localidad
            Provincia
Dirección de facturación
    Titular
        Nombre de Persona
            Nombre
            Apellidos
                Primer Apellido
                Segundo Apellido
        NIF
    Dirección Postal
        Dirección
            Finca
                Via
                    Tipo de vía
                    Nombre de la vía
                Número
            Ubicación
                Acceso
                    Portal
                    Bloque
                Vivienda
                    Escalera
                    Piso
                    Puerta
        Localidad
            Código postal
            Localidad
            Provincia
```

Hemos forzado mucho las cosas, pero casi hemos conseguido hacer que cada objeto contenga tan solo dos atributos. Podríamos seguir, pero lo voy a dejar aquí en parte para que hagas el ejercicio de intentar dar este último paso.

