---
layout: post
title: Evita el acoplamiento fuerte con configurable dependency
series: design-patterns
categories: articles
tags: software-design pulpoCon
---

Seguramente conozcas el Principio de Inversión de Dependencias. Sí, ese mismo: la D de SOLID. El que dice que todo debe depender de abstracciones. Pues no vamos a hablar de él como principio, sino de su aplicación práctica.

Eso de que todo tenga que depender de abstracciones está muy bien, pero no siempre resulta sencillo caer en la cuenta de la potencia que tiene esa idea para lograr un código fácil de mantener y reducir el riesgo en el proceso. Por eso, vamos a hablar de este principio como si fuese un patrón que, como sabrás, nos permite describir un problema conocido asociado a una solución probada.

_Nota: en una versión anterior del artículo utilicé erróneamente el término "inversión de control", cuando lo correcto sería "inversión de dependencias". Millón de gracias a Manu Rivero por señalarlo. Inversión de control se refiere a la parte que inicia una interacción_

## Empecemos mal a propósito

Veamos un ejemplo. Supongamos que tienes un servicio que te proporciona geolocalización por IP, de modo que puedas averiguar desde donde se conectan tus usuarias. Esto puede tener utilidad estadística, pero también funcional si necesitas ajustarte a una legislación local o algo similar. Así que tienes algo como esto, que hace una llamada a una API:

```typescript
class Location {
    ip: string,
    country_code: string,
    country_name: string,
    city: string,
    latitude: string,
    longitude: string,
}

class IpLocation {
    location(ip: string): Location {
        // whatever it takes to get the information
        return new Location()
    }
}
```

En aquellos casos de uso en los que necesitas valerte de información de localización, haces algo así:

```typescript
class GetAvailablePromotionsHandler {
    constructor() {}
    
    handle(command: GetAvailablePromotions) {
        const ipLocationService = new IpLocation();
        const location = ipLocationService.location(command.ip);
        // whatever it takes to get the information
    }
}
```

A estas alturas debería chocarte que inicialicemos la dependencia dentro del objeto que la consume, pero queremos destacar todos los problemas que genera:


* Si le tengo que pasar configuración, tengo que hacerlo en cada caso de uso o servicio que lo necesite.
* Usamos una instancia distinta de IpLocation cada vez.
* Si quiero cambiar por otro proveedor de la API, tengo que cambiarlo en todos los sitios en que se use.

## La inyección de dependencias

Con frecuencia, se asocia este principio con el patrón de Inyección de Dependencias que nos dice que para evitar acoplarnos a un objeto colaborador, en vez de instanciarlo dentro del objeto que lo usa, se lo pasemos en la construcción o en el método en que lo necesita.

Como normal general, esto se ha de hacer cuando la dependencia no está bajo nuestro control. En este caso la dependencia:

* Es una librería de tercera parte (o vendor).
* Pertenece a otro módulo o contexto de nuestro proyecto.
* Vive en otra capa de nuestro módulo o contexto.

Pinta bien, pero no es suficiente. La inyección de dependencias reduce la fuerza del acoplamiento entre dos objetos que colaboran, poniendo en valor el uso de composición. Sigue existiendo un cierto nivel de acoplamiento y es aquí donde participa el principio de inversión de dependencias.

Si aplicamos la inyección de dependencias al ejemplo anterior, podemos evitar buena parte de los problemas. Es relativamente sencillo. 

```typescript
class GetAvailablePromotionsHandler {
    constructor() {}
    
    handle(GetAvailablePromotions command) {
        const ipLocationService = new IpLocation();
        const location = ipLocationService.location(command.ip);
        // whatever it takes to get the information
    }
}
```

La inyección la podemos hacer por constructor o por método. Inyección por método sería algo así:

```typescript
class GetAvailablePromotionsHandler {
    constructor() {}
    
    handle(command: GetAvailablePromotions, ipLocationService: IpLocation) {
        const location = ipLocationService.location(command.ip);
        // whatever it takes to get the information
    }
}
```

En muchos casos es ventajoso hacerla por construcción, especialmente para los patrones Command que invocamos a través de un Bus de Comandos. En ese caso, la dependencia se convierte en un Colaborador y se pasa a través de la función constructora.

```typescript
class GetAvailablePromotionsHandler {
    ipLicationService: IpLocation;
    
    constructor(ipLocationService: IpLocation) {
        this.ipLocationService = ipLocationService; 
    }
    
    handle(command: GetAvailablePromotions) {
        const location = this.ipLocationService.location(command.ip);
        // whatever it takes to get the information
    }
}
```

Esto resuelve algunos problemas. Por ejemplo, puedo usar una única instancia, con lo que la configuración de IpLocation solo se hace una vez. Esto no nos impide usar distintas instancias si fuese necesario, por ejemplo, porque necesitamos configuraciones distintas por alguna razón.

Lo que no nos permite hacer la inyección de dependencias _per se_ es cambiar fácilmente a otro proveedor de API, porque seguimos dependiendo de una clase concreta. 

## La inversión de dependencias

El problema de la Inyección de Dependencia es que el objeto consumidor sigue dependiendo del tipo específico del colaborador que le pasamos. Si ese colaborador implementa una tecnología o una librería específica nos acoplaremos a ello en producción. Supongamos que se trata de una base de datos MySQL, para que sea más fácil seguir el hilo.

Pero ahora supongamos que en el entorno local no queremos usar esa misma tecnología, sino SQLite, que es rápida y cómoda para entorno local y testing. ¿Cómo demonios la podemos cambiar según el entorno?

Aquí es donde entra la **inversión de dependencias** y hace que la solución sea simple. Hasta ahora es la dependencia colaboradora la que define cómo ha de ser usada, manteniendo un nivel de acoplamiento indeseable. La inversión de dependencias nos permite definir esas reglas de uso.

En primer lugar, abstraemos el concepto de Acceso a Base de Datos introduciendo una interfaz, definiendo los métodos que necesitamos. Ahora tenemos una abstracción que representa una forma de interrogar a una base de datos, pero no impone ninguna implementación o tecnología específica.

A continuación, haremos que nuestro servicio dependa de esa abstracción y crearemos implementaciones concretas de la misma basadas en las tecnologías deseadas.

Lo único que nos queda es tener un módulo de setup en el que la aplicación se monta con distintos componentes según el entorno de ejecución. Podremos tener tecnologías diferentes en cada uno.

La inversión de dependencias consiste en introducir una abstracción que nosotras controlamos y depender de ella en lugar de una implementación concreta. Representamos estas abstracciones con interfaces:

```typescript
interface IpGeoLocation {
    location(ip: string): Location;
}
```
 
Ahora tenemos que cambiar los consumidores para que dependan de la interface:

```typescript
class GetAvailablePromotionsHandler {
    ipLicationService: Geolocation;
    
    constructor(ipLocationService: Geolocation) {
        this.ipLocationService = ipLocationService; 
    }
    
    handle(command: GetAvailablePromotions) {
        const location = this.ipLocationService.location(command.ip);
        // whatever it takes to get the information
    }
}
```

Y, por supuesto, hacer que nuestros colaboradores sean implementaciones de la misma:

```typescript
class IpLocation implements IpGeoLocation {
    location(ip: string): Location {
        // whatever it takes to get the information
        return new Location()
    }
}
```

Ahora, si necesitamos cualquier otra implementación, no tenemos más que escribirla:

```typescript
class GoogleIpLocation implements IpGeoLocation {
    location(ip: string): Location {
        // whatever it takes to get the information using Google services
        return new Location()
    }
}
```

## Configurable Dependency

Alistair Cockburn, padre de la Arquitectura Hexagonal, y su colaborador Juan Manuel Garrido propusieron el nombre Configurable Dependency para definir este patrón. Cockburn, en particular, estaba insatisfecho con los matices negativos de Inversión e Inyección de Dependencias.

https://jmgarridopaz.github.io/content/confdep.html

Configurable Dependency es uno de los fundamentos de Ports and Adapters, pero es muy importante que recuerdes que este patrón puedes utilizarlo en cualquier circunstancia en la que necesites:

* No acoplarte a una librería de tercera parte
* No hablar directamente con un módulo o contexto ajeno al que estás trabajando
* No hablar directamente con otra capa de tu arquitectura

## Ventajas

Si una librería o tecnología es actualizada nos basta con incorporar un nuevo adaptador y usarlo cuando estemos listas. Y podemos controlar su introducción mediante feature flags en caso de problemas.

¿Necesitamos cambiar un adaptador por algún motivo? En lugar de modificar el existente, crea una nueva versión a partir del actual y trabaja con la nueva. De este modo, revertirlo será muy fácil en caso de que se introduzcan problemas.

El testing es mucho más fácil. Puedes crear fácilmente fakes, que son implementaciones funcionales de una interfaz, o dobles. Los tests requerirán menos recursos y serán más rápidos, sino tocar ninguna tecnología o atacando servicios externos.


_Una versión reducida de este artículo se publicó en la revista de la PulpoCon24._
