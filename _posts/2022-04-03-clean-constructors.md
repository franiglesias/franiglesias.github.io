---
layout: post 
title: Constructores limpios 
categories: articles 
tags: java good-practices 
---

Después de haber leído los dos volúmenes de [Elegant Objects](https://www.yegor256.com/elegant-objects.html), tengo un montón de ideas dando vueltas en la cabeza. Así que para darles salida he empezado a dedicar un rato a practicar algunas de las recomendaciones de la obra. O, al menos, intentarlo.

En general, diría que existe bastante acuerdo en que hacemos mal la Programación Orientada a Objetos y que se ha perdido mucho de su intención original.

O dicho de una forma más sencilla y directa: no hacemos programación orientada a objetos, sino que hacemos programación procedural disfrazada de objetos. Estamos demasiado pendientes de su estado y propiedades, cuando el objetivo de la OOP es justamente olvidarnos de eso.

Elegant Objects propone 23 recomendaciones para ayudar a recuperar esa forma de hacer OOP. Muchas de ellas ya las seguía y son relativamente comunes. Algunas otras me tienen un poco loco, porque no sé realmente cómo aplicarlas de manera práctica.

Una de estas recomendaciones es que no haya código en los constructores (_Keep constructors code-free_). Se traduce en la práctica en que los constructores solo contengan asignaciones. Si hay que hacer cálculos, es mejor hacerlos cuando el objeto sea usado, no cuando sea creado. Esto permite utilizar técnicas de caché y otras optimizaciones que no serían posibles si esos cálculos u operaciones se realizan en el constructor. 

Veamos un ejemplo:

```java
public class Coordinates {
    private final Longitude longitude;
    private final Latitude latitude;

    public Coordinates(Latitude latitude, Longitude longitude) {
        this.longitude = longitude;
        this.latitude = latitude;
    }
    //...
}
```

Bien, esto no tiene mal aspecto y suena razonable.

Otra cuestión que menciona el libro es que un objeto debería tener diversos constructores, ya que es posible que sus usuarios necesiten flexibilidad para crearlos. Por ejemplo, poder construir un objeto `Coordinates` con valores `int` (lo sé, deberían ser decimales, pero no es ese el tema de discusión).

```java
public class Coordinates {
    private final Longitude longitude;
    private final Latitude latitude;

    public Coordinates(int latitude, int longitude) {
        this(new Latitude(latitude), new Longitude(longitude));
    }

    public Coordinates(Latitude latitude, Longitude longitude) {
        this.longitude = longitude;
        this.latitude = latitude;
    }
    
    // Coordinates somePoint = new Coordinates(40, 34);
}
```

En este caso tendríamos un constructor **primario** y uno o varios **secundarios**. Los secundarios siempre deberían acabar llamando al primario, y su función es ofrecer flexibilidad para construir el objeto de diversas formas. Esto es: existe un constructor canónico, que se coloca de último por convención para que sea fácil de encontrar.

El punto polémico viene justo aquí. Si los constructores no tienen más que código de asignación, ¿cómo puedo tener la seguridad de que el objeto que se crea es válido? ¿No puedo lanzar excepciones en caso de que algo vaya mal?

En este ejemplo concreto se pasan unos objetos `Latitude` y `Longitude` al constructor primario, así que cabe esperar que sean objetos válidos. `Coordinates` no tendría por qué ocuparse de saber si `Latitude` o `Longitude` son válidos. OOP es también confianza en que los demás objetos saben hacer su trabajo.

Supongamos este código de `Latitude`:

```java
    public class Latitude {
        private final int latitude;

        public Latitude(int latitude) {
            this.latitude = latitude;
        }

        @Override
        public String toString() {
            return String.valueOf(latitude);
        }
    }
```

¿Cómo se garantiza que el valor de latitude está en el rango -90...90 si no introduzco algún código de validación?

Obviamente no lo puedo garantizar. En buena parte del libro, Bugayenko defiende que cuando se use el objeto ya se lanzarán excepciones en el caso de que un valor no sea válido. Pero a mí esto me parece un tanto contradictorio: si construyo un objeto y no me puedo fiar de él, ¿dónde queda la confianza hacia los objetos? ¿No se contamina el objeto con un montón de código de validación aquí y allá?

Como solución propone decoradores que se encarguen de validar los objetos decorados, liberando a estos de esa tarea, aunque, siendo sincero, no consigo entender cómo hacerlo y que no resulte realmente más complejo que los propios objetos.

Otra alternativa es usar objetos que encapsulen las reglas de validación. Esto me suena mejor, así que he estado jugando con algunas ideas. Esta es una primera aproximación, todavía incompleta y posiblemente errónea desde la perspectiva de Elegant Objects, para abordar el tema, pero creo que puede ser un punto de partida.

¿Qué te parece?

```java
package com.codurance.coordinates;

import java.security.InvalidParameterException;

public class Coordinates {
    private final Longitude longitude;
    private final Latitude latitude;

    public Coordinates(int latitude, int longitude) {
        this(new Latitude(latitude), new Longitude(longitude));
    }

    public Coordinates(Latitude latitude, Longitude longitude) {
        this.longitude = longitude;
        this.latitude = latitude;
    }

    @Override
    public String toString() {
        return "(" + longitude + ", " + latitude + ")";
    }

    private static class Longitude {
        private final int longitude;

        public Longitude(int longitude) {
            new Coordinates.InRange(longitude, -180, 180).check();
            this.longitude = longitude;
        }

        @Override
        public String toString() {
            return String.valueOf(longitude);
        }
    }

    private static class Latitude {
        private final int latitude;

        public Latitude(int latitude) {
            new Coordinates.InRange(latitude, -90, 90).check();
            this.latitude = latitude;
        }

        @Override
        public String toString() {
            return String.valueOf(latitude);
        }
    }

    private static class InRange {
        private final int value;
        private final int min;
        private final int max;

        public InRange(int value, int min, int max) {

            this.value = value;
            this.min = min;
            this.max = max;
        }

        public void check() {
            if (value < min || value > max) {
                throw new InvalidParameterException("Value out of bounds");
            }
        }
    }
}
```