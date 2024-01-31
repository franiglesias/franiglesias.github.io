---
layout: mini-post
title: Golden, librería de snapshot testing en Go
categories: articles
tags: tb-list golang testing
---

**Golden** es una librería de _snapshot testing_ que he creado para Go. Después de unas semanas de trabajo, ya está declarada estable y he publicado la versión v1.0.0.

En parte, como ejercicio de aprendizaje. En parte, porque no me acaban de encajar otras librerías disponibles.

_Snapshot testing_ es una técnica bastante usada en desarrollo frontend que consiste en guardar el output de nuestro código y usarlo como criterio para ejecutar futuros tests. De este modo, creamos un test de regresión que nos asegure que mantenemos el comportamiento actual de una unidad de software.

En backend, el _snapshot testing_ no es tan usado, pero hay muchos casos de uso para esta técnica: objetos complejos, generación de archivos de todo tipo (JSON, CSV, XML, etc.) para los que es costoso desarrollar un test basado en aserciones.

Además, esta técnica es muy potente usada con código legacy o, en general, con código que no tiene tests. Nos permite obtener una buena cobertura rápidamente, antes de intervenir en un código.

**Golden**, además de _snapshot testing_, nos permite trabajar con _approval testing_. En esta modalidad, lo que hacemos es mantener el test fallando a propósito hasta que el snapshot que se ha generado sea revisado por nosotras o por una experta del dominio que nos pueda decir si el output es correcto o no. Cuando nos satisface, "aprobamos" el snapshot y lo usamos como criterio en los tests futuros.

_Approval testing_ es una técnica adecuada cuando estamos escribiendo código nuevo que genera objetos complejos o documentos.

Finalmente, **Golden** ofrece la posibilidad de realizar los tests combinatorios de la técnica _Golden Master_. Esta técnica consiste en bombardear el código a base de llamadas con distintas combinaciones de sus parámetros, de tal modo que lo forcemos a recorrer todos sus posibles flujos de ejecución. 

Para ello, no tenemos más que indicarle a **Golden** listas de valores para cada parámetro de entrada de la unidad bajo test y generará todas las combinaciones posibles. Esta técnica puede ayudarnos a obtener una cobertura completa de un código existente sin tener que preocuparnos de entenderlo en profundidad. Una vez que hemos generado el "golden master" y estamos protegidas por el test, podemos empezar a aplicar técnicas de refactor para mejorar su diseño.

[Golden: librería de snapshot testing en Go](https://github.com/franiglesias/golden)
