---
layout: post
title: BDD. Tendiendo puentes entre negocio y desarrollo
published: true
categories: articles
tags: php bdd testing
---

Vamos a cambiar un poco de enfoque antes de continuar con otros aspectos y ejemplos técnicos del Desarrollo Guiado por Comportamiento. Nos queremos ocupar del BDD como herramienta de comunicación.

## Behavior Driven Development para el desarrollo ágil

[Dan North cuenta en este artículo](https://dannorth.net/introducing-bdd/) el proceso mediante el que llegó a concebir la idea de Behavior Driven Development y es una historia interesante.

Pero para contarla hay que remontarse al concepto de Desarrollo Ágil de Software, tal y como se recoge en el [Manifiesto Ágil](http://agilemanifesto.org/iso/es/manifesto.html). Tradicionalmente, los proyectos de desarrollo de software se construían con el llamado [modelo de cascada o waterfall](https://openclassrooms.com/en/courses/4309151-gestiona-tu-proyecto-de-desarrollo/4538221-en-que-consiste-el-modelo-en-cascada), heredado de la ingeniería, en el que un proyecto pasaba por orden las siguientes fases:

* toma de requisitos
* especificación y diseño
* implementación
* pruebas
* mantenimiento

El problema de este modelo en el ámbito del desarrollo de software es que los requisitos suelen cambiar mucho más rápidamente de lo que el equipo es capaz de avanzar en el proyecto, esos cambios generan rediseños, los cuales obligan a postergar y prolongar la fase de implementación, etc. Al final, con frecuencia, los productos se entregan tarde, con mucho esfuerzo y, probablemente, sobrecostes, resultando poco o nada útiles en la práctica pues las circunstancias han cambiado y el software ya no sirve para lo que se había planeado.

Esta constatación fue la que [llevó a que en febrero de 2011](http://agilemanifesto.org/history.html) un grupo de 17 programadores se reuniesen para hablar de formas en las que afrontar esta problemática. El resultado fue un conjunto de valores y principios que constituye el llamado Manifiesto Ágil. 

El Manifiesto Ágil se basa en cuatro valores:

* Individuos e interacciones por encima de procesos y herramientas
* Software funcional por encima de documentación extensiva
* Colaboración con el cliente por encima de negociación de contratos
* Responder al cambio por encima seguir un plan

En general, el desarrollo ágil propone un modelo de trabajo iterativo e incremental: el proyecto se divide en pequeñas unidades completas que aportan valor al cliente y que se entregan en tiempos cortos. De este modo se consigue que las necesidades de diseño previo sean menores, a la vez que se obtiene feedback muy pronto y es posible adaptarse a los cambios en los requerimientos de forma rápida y sin incurrir en sobrecostes.

En cierto modo, cada iteración se lleva a cabo siguiendo un modelo waterfall, pero como las entregas al final del ciclo (lo que solemos llamar un *sprint*) son pequeñas se se obtienen beneficios en todas las fases porque cada etapa es mucho menos compleja que el proyecto total, el feedback se obtiene más rápidamente y es posible responder a los cambios de requisitos y a los fallos de diseño con celeridad y bajo coste.

Por resumir, la metodología de desarrollo ágil tiene como objetivo obtener feedback de calidad cuanto antes y para eso prioriza la comunicación por encima de otros elementos.

## La comunicación en el desarrollo de software


