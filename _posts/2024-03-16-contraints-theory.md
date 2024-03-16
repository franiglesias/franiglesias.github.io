---
layout: post
title: Teoría de constraints y mejora de equipos
categories: articles
tags: misc good-practices
---

La teoría de los limitadores (mi traducción de Theory of Constraints) puede utilizarse como un framework para analizar y mejorar la productividad de un equipo de desarrollo de software. 

Hace tiempo, utilizamos esta técnica para analizar y mejorar el trabajo en equipos de desarrollo en la empresa en la que estaba trabajando. A partir de esa experiencia, preparé un guion para ayudar a otros equipos a llevar a cabo el mismo análisis. Hace unos días me encontré con ese material y me pareció que podría ser interesante hacer un artículo sobre el tema.

Voy a traducir _constraint_ como **limitador**, para acentuar el aspecto de que son circunstancias que **limitan** la capacidad de un equipo para lograr sus objetivos. Pero podríamos usar sinónimos como restricciones, condicionantes, elementos bloqueantes, etc.

## Teoría de los limitadores (Theory of constraints)

La teoría de los limitadores (TOC) es un paradigma de gestión que considera que cuando un equipo no consigue más de sus metas es a causa de un número pequeño de condicionantes o limitadores. Estas limitaciones se pueden ordenar de acuerdo a cuanto obstaculizan la productividad del equipo. De esta forma, se pueden organizar las medidas que nos ayudan a remediarlas de forma que maximicemos su impacto.

Cuando un equipo observa que no consigue sus objetivos de _sprint_, que no termina tareas o no consigue culminar proyectos, lo más probable es que se deba principalmente a dos o tres condicionantes o limitadores. El modelo nos dice que si identificamos estos limitadores y los ordenamos por su capacidad de bloqueo, podremos tomar medidas que impacten de forma significativa mejorando la productividad. 

Siempre hay al menos un limitador, y la TOC usa un proceso de enfoque para identificarlo y reestructurar la organización en relación con ella. TOC adopta el dicho "una cadena es tan fuerte como su eslabón más débil". En otras palabras: la productividad de un equipo no puede crecer más allá de lo que permitan sus limitadores.

Los limitadores se llaman así porque imponen un límite a lo que podemos conseguir. Imagina un equipo de desarrollo que, por lo que sea, no utiliza un gestor de versiones. En ese caso, asegurar que todo el mundo trabaja sobre la última versión del código puede ser una tarea dantesca y, sobre todo, muy limitadora de la productividad. No puedo imaginar el coste de una metodología como esta. Seguramente tendrán otros problemas, pero la capacidad bloqueante de carecer de esta herramienta es brutal. Y el beneficio de introducirla, proporcional.

El efecto de cada limitador determina la ganancia de productividad que podemos conseguir, por lo que nos interesa identificar y combatir el limitador más bloqueante que tengamos. En el ejemplo anterior, me atrevería a decir que el 50% del tiempo se iría en la gestión de todos los problemas derivados de mantener coherentes las versiones de las distintas desarrolladoras y el producto desplegado.

Hablando de desplegar, en esta situación me imagino que el proceso será también lento y tortuoso. Pero en ese caso, puede que el tiempo empleado sea un 10%. Es decir, es un limitador más pequeño que, por otra parte, es dependiente del anterior. Juntos hacen que la productividad real del equipo sea solo de un 40% de la posible.

Incluso si fuesen independientes, atacando ese 10% de tiempo dedicado al despliegue, la mejora sería relativamente pequeña, porque el principal bloqueador es el otro problema. 

En consecuencia, es preferible dedicar el esfuerzo al limitador más grande: percibiremos una mejora mayor y puede, incluso, que facilitemos eliminar otros o al menos reducir sus efectos.

Pero bueno, existen infinidad de bloqueadores a la productividad y este análisis puede ayudarnos a detectarlos y ponerles solución.

## Objetivos

* Identificar un conjunto de posibles limitadores.
* Aislar el principal cuello de botella.
* Proponer ideas para evitarlo, corregirlo, mejorarlo o sortearlo.

## Beneficio esperado

Un conjunto de ideas accionables que puedan ayudar de forma efectiva a incrementar la productividad del equipo mediante la eliminación, reducción o control del elemento limitador.

En mi opinión este análisis puede aplicarse de dos formas:

* Para abordar un problema específico de un proyecto que no avanza o que no podemos garantizar que estará en plazo.
* Para abordar un problema de productividad de un equipo que no se limita a un proyecto concreto o de la organización en general.

## Duración

Para este análisis, y dependiendo del alcance, pueden hacerse dos o tres sesiones de entre 50 y 60 minutos. Si el ámbito es de un problema específico, una única sesión bien enfocada debería ser suficiente.

## Pasos

### Introducción

* Exponer brevemente la _Teoría de los Limitadores_ si las participantes no la conocen.
* Exponer los objetivos del proceso.
* Brainstorming durante unos pocos minutos de modo que cada miembro del equipo pueda añadir todos los bloqueadores o limitadores que percibe.
* Una vez finalizado el brainstorming se clarifican todas las propuestas según sea necesario.

Notas:

* Podemos usar el típico tablero con _post-it_, ya sea físico o virtual o una pizarra en la que cada participante pueda escribir. En todo caso, la capacidad de manipular las tarjetas, o _post-it_, viene bien para las siguientes fases del proceso. 
* Repasar las **categorías de limitadores** pueden ayudar a identificarlos (ver más adelante).

### Identificar relaciones y dependencias entre condicionantes

Si encuentras muchos bloqueos, es más que posible que estén relacionados entre sí de alguna forma. Por tanto:

* Agrupa limitadores que estén relacionados o que sean muy similares.
* Identifica el limitador principal de cada grupo.

El objetivo es quedarnos con los tres o cuatro más importantes por su efecto. Más allá de este número es muy posible que el efecto real sea casi inapreciable

### Identifica el limitador principal

Una vez que has identificado los limitadores tienes que ordenarlos del que sea más bloqueante al que menos. Formas de evaluar esto pueden ser:

* Cuantas más personas en el equipo lo identifiquen como bloqueo
* Cuantificarlo en tiempo o porcentaje de tiempo que nos supone en un período dado
* Si condiciona o influye en otros limitadores identificados

Obtendrás el mayor beneficio corrigiendo el primero y más limitante. Atacar los otros puede ayudar también, pero el efecto observable será menor.

### Propuesta de soluciones

El último punto del proceso es encontrar soluciones para eliminar o gestionar el limitador. Y estas implican distintos niveles. En el primer nivel y segundo nivel (Exprimir y Subordinar), intentamos lidiar con el problema de productividad inmediato, por ejemplo, un proyecto concreto que no está saliendo.

#### Exprime el limitador

En este nivel, lo que buscamos es atacar el limitador sin acudir a otros recursos y tratar de sacar adelante el trabajo actual más importante.

* Concentra tus recursos actuales en resolver el limitador. Por ejemplo, poniendo más personas a trabajar o ayudar en ello, sin superar el límite en que el número de personas se convierte en una molestia.
* Descarta o pospón otros proyectos que se estén desarrollando simultáneamente, haciendo menos cosas a la vez.

#### Subordina todo al limitador

Decide qué puedes hacer en otras áreas para reducir el coste e impacto de la limitación, asegura que los demás procesos puedan contribuir a reducir el cuello de botella.

* No atender demandas puntuales como bugs, o que se ocupen de ellas personas que no están trabajando en resolver el proyecto atascado.

#### Eleva

Haz cambios mayores en el sistema para eliminar o romper la limitación, asignando o redistribuyendo recursos personales, técnicos o de conocimiento.

Otras acciones podrían en este nivel podrían ser:

* Introducir una práctica o herramienta, como usar un sistema de control de versiones en el ejemplo que pusimos al principio. Pero también podría ser aprender e introducir una metodología, técnica, lenguaje de programación, framework...
* Suprimir una práctica bloqueante o transformarla para que deje de serlo. Por ejemplo, automatizar testing para no hacer testing manual.
* Redistribuir personas que puedan aportar más en determinadas áreas o roles según su capacitación. Por ejemplo, puede que te interese introducir un equipo dedicado a trabajar en la mejora de tu plataforma de software, para que los equipos de producto no estén invirtiendo tiempo en ello a costa de nuevas prestaciones.

Recuerda, a veces simplemente no puedes eliminar un limitador y tienes que aprender a vivir con él.

* Hay limitadores impuestos por regulaciones legales o de seguridad que no puedes soslayar, sin embargo, puedes tomar medidas para reducir su impacto. Por ejemplo, no puedes acceder a la información en bases de datos de producción lo que hace imposible realizar directamente ciertos cambios o correcciones, lo que no deja de ser una mala práctica por sí misma. En su lugar tendrías que desarrollar herramientas internas con las que aplicar esas correcciones de manera segura y controlada.

#### Un ejemplo

Imagina que tu empresa ha organizado los equipos de desarrollo por especialidad (frontend, backend, sistemas, bases de datos...). Seguramente, habrá que hacer un esfuerzo extra para sacar adelante proyectos que requieren la coordinación entre ellos. Habrá tiempos de espera mientras un equipo desarrolla su parte y otros no pueden avanzar sin ella. Asímismo habrá problemas al juntar elementos para crear la solución final.

En este escenario, el problema de cuello de botella puede haber sido identificado por un equipo que ha observado que no puede avanzar mientras espera que otro equipo haga una entrega necesaria.

En este caso podríamos, entre otras cosas:

* **Exprimir**: avanzar en otras partes del proyecto, dando tiempo al otro equipo a entregar su parte. Esto nos permite sortear el cuello de botella.
* **Subordinar**: hacer que el equipo retrasado en la entrega se concentre en sacarla cuanto antes, y aportarle ayuda si es necesario.
* **Elevar**: el limitador, en último término, se resuelve cambiando la estructura organizativa, basándola en los proyectos y creando equipos multidisciplinares que tengan la capacidad de llevar su proyecto a término sin dependencias externas.

#### Repite

Siempre aparecerá un nuevo limitador. Nunca te des por satisfecha. 

Como hemos visto, lo normal sería haber identificado varios limitadores, así que una vez que hemos conseguido atacar uno y mejorar en ese aspecto, podríamos plantearnos atacar el siguiente. 

Pero también podrían descubrirse otros nuevos que estaban ocultos por el anterior.

## Plan

Una vez hemos identificado los limitadores y hemos definido posibles formas de abordarlos es el momento de ponerlos en práctica.

Lo ideal sería tener algún tipo de medida objetiva que nos permita identificar el avance. Las métricas DORA pueden servir para cuestiones generales de _delivery_, pero podríamos introducir otras en función de nuestros objetivos particulares:

* Reducción o eliminación de los cambios de _scope_ de un sprint
* Reducción del número de tareas no terminadas al final de una iteración
* Tiempo o número de reuniones de coordinación con otros equipos
* Aumento de las sesiones de pair-programming
* Reducción de peticiones de ayuda a otros equipos
* etc

## Categorías de limitadores

Esta taxonomía de limitadores puede ser útil para identificarlos. He añadido algunos ejemplos que ilustran cada una de ellas. A veces, cuando el equipo no tiene claro cómo identificar limitadores, es buena idea repasar estas categorías.

**Políticas**: los limitadores de este tipo son causadas por los procesos y políticas de la empresa u organización. Esto incluye regulaciones y líneas rojas que tengas que sortear. En el desarrollo de software, una restricción por política puede estar relacionada con requisitos de seguridad o conformidad. Las políticas son la forma de limitadores más común en cualquier industria.

Supongamos un equipo que trabaja en un dominio regulado y se impone la política de que todo nuevo código tiene que ser aprobado por dos revisoras. No puedes eliminar la política, pero puedes tomar medidas alternativas. Así, por ejemplo, las desarrolladoras podrían trabajar en pareja, de modo que una de ellas puede actuar como revisora. La segunda persona revisora puede participar _desde fuera_ en una revisión de código posterior junto con las autoras.

El hecho de que una persona de QA o una Manager tenga que aprobar todas las prestaciones que se incorporan al software suele generar un cuello de botella que parece difícil de sortear. En el primer caso, el tiempo de QA posiblemente estaría mejor empleado si este rol se ocupa de contribuir al desarrollo de la automatización de pruebas y a cualificar a las desarrolladoras para realizar más y mejores tests e introducir mejores prácticas. En el segundo caso, la Manager podría simplemente otorgar más confianza y responsabilidad al equipo y contribuir a definir mejor las expectativas y criterios de aceptación al principio del desarrollo. Y es que micro management y productividad suelen ir reñidas.

Otra política es la forma en que se han establecido los equipos de desarrollo. Ya hemos mencionado más arriba que los equipos por especialidad pueden suponer un cuello de botella a la hora de trabajar en proyectos que requieren capacitación multidisciplinar, ya que la distribución del trabajo es ineficiente y las necesidades de coordinación (en diseño, desarrollo y despliegue) consumen mucho tiempo. Por eso, las empresas orientadas a producto, suelen crear equipos multidisciplinares autónomos que puedan trabajar independientemente.

También es política la forma en que se distribuye el trabajo entre equipos, el tratamiento de los bugs, etc. A veces, el bloqueante puede ser incluso la ausencia de una política definida en un asunto, lo que nos obliga a improvisar cada vez que surge un problema.

**Equipamiento**: son los limitadores originados por equipo obsoleto, averiado o lento, o por falta de espacio. En desarrollo de software, puede ocurrir por tener ordenadores lentos o teclados estropeados. Puede ser por carecer de dispositivos o medios para realizar tests, etc. Podría ser incluso carecer un espacio silencioso para trabajar. Pero hay muchos más ejemplos.

Si los ordenadores de las desarrolladoras son lentos o de poca capacidad, la solución es bastante obvia. Para que eso no vuelva a ocurrir, se pueden definir unas especificaciones mínimas y actualizarlas regularmente. Otro ejemplo de limitador puede ser la obligación de utilizar un equipamiento estándar (teclados, ratones, monitores, etc.) en ver de permitir escoger estos elementos a cada persona, al menos dentro de un límite de presupuesto.  

Las aplicaciones de trabajo cooperativo (Slack, Zoom, Miro, Meet, etc.) para las que algunas empresas no adquieren licencias completas o suficientes imponen limitaciones de uso que pueden afectar negativamente a la productividad. Si los precios son un problema, es posible implementar soluciones autogestionadas, en algunos casos, o tratar de estandarizarse en una plataforma más económica. Pero tampoco hay que desdeñar el coste de aprendizaje de utilizar herramientas que no son habituales en la industria.

Un limitante que me he encontrado a veces tiene que ver con los entornos de desarrollo locales. No todos los equipos trabajan en entornos de desarrollo normalizados usando tecnologías como Docker, para eliminar el síndrome de "en mi local funciona". Cuando no disponemos de esta normalización, el comportamiento del software puede ser impredecible y, por tanto, nos obliga a usar mucho tiempo en descartar problemas debidos a las diferencias de entornos. Este y otros temas caben dentro de la llamada _Developer experience_ y requiere el desarrollo de prácticas y herramientas que garanticen un comportamiento uniforme y predecible de los entornos locales.

**Personas**: los limitadores personales son cuellos de botella causados el número o capacitaciones de las personas participantes en el proyecto. Bien por no tener la capacitación adecuada, o incluso debido a lo contrario. Aquí también aplica la llamada Ley de Brooks, que dice que añadir personas a un proyecto lo ralentiza.

Demasiadas personas en un mismo proyecto pueden ser un limitador de la productividad. La Ley de Brooks se explica porque añadir _manos_ a un equipo require un proceso de aprendizaje que en realidad retrasa al equipo hasta que las nuevas incorporaciones alcanzan el nivel de conocimiento requerido.

Por supuesto, demasiadas pocas personas para la carga de trabajo es otro limitador. Y en ese caso, la solución pasaría por reducir los lotes de trabajo a los que el equipo se compromete por iteración.

La multitarea de equipo también es un limitador de productividad. Si se trabaja a la vez en muchos proyectos poco relacionados, pueden pasar dos cosas:

* Las mismas personas trabajan siempre en los mismos proyectos, generando silos de conocimiento y _bus factor_. Si cierta persona no está por la razón que sea, no se puede trabajar en ese proyecto.
* Cuando una persona trabaja en un proyecto que no conoce, necesita tiempo para introducirse en él, lo que merma su productividad. Pero, a la vez, si otra persona del equipo le ayuda, deja de estar trabajando en otro proyecto.

Aquí, por ejemplo, se podría reorganizar el equipo para que varias personas trabajen juntas en el mismo proyecto, haciendo pair programming, y facilitando así la distribución del conocimiento y reducción del _bus factor_. Pero también requeriría reducir la cantidad de proyectos simultáneos que un equipo puede gestionar.

Hay perfiles que pueden suponer un cuello de botella, incluso siendo excepcionalmente competentes. Por ejemplo, una desarrolladora que emprende modificaciones significativas en el código sin contar con el resto del equipo. Esto puede introducir fricciones cuando mezcla los cambios y obliga al sus compañeras a empezar de cero con nuevos frameworks, librarías o conceptos, forzándolas a utilizar tiempo en este aprendizaje y no en sus propias tareas. 

**Paradigma**: un limitador de paradigma es el causado por creencias. Por ejemplo, la creencia de que las líneas de código proporcionan una buena métrica por productividad, cuando lo opuesto suele ser cierto.

Una metodología mal implementada puede ser un gran limitador. Por ejemplo, muchos equipos de desarrollo que dicen hacer _scrum_, aplican las reglas del proceso de una manera _sui generis_, lo que acaba provocando problemas de productividad. El framework fue desarrollado con unos objetivos y si no cumplimos sus especificaciones tampoco podemos esperar resultados. Así que, si la metodología o paradigma del equipo se percibe como bloqueante, es necesario examinarlo y modificarla.

A medio camino entre metodología y personas estaría el tratamiento del trabajo no planificado. En un _scrum_ estricto, por ejemplo, el trabajo no planificado en forma de peticiones que llegan del otras partes de la organización durante un sprint no se debe realizar, sino que pasa a la lista de espera que es el _backlog_. Así que si detecta el trabajo no planificado como un limitador, hay que tomar medidas para controlarlo.

Pero incluso sin seguir una metodología scrum, el trabajo no planificado es algo que milita la productividad. Se hace necesario entonces definir qué hacer con él. A veces, es un tema de personas. Es frecuente que en el equipo exista alguna desarrolladora que, por las razones que sea, se siente obligada a responder a estas peticiones, lo que suele implicar que también existe una persona externa que sabe explotar esta característica. Así que puede ser necesario trabajar el aprender a decir no. Nadie dijo que mejorar la productividad de un equipo fuera fácil.

**Mercado**: un limitador de mercado ocurre al distribuir el software a los consumidores, si estás introduciendo más de lo que se necesita, porque estás invirtiendo tiempo en crear cosas que los consumidores no quieren o no necesitan y, por tanto, no utilizan.

Esto ocurre cuando se hacen desarrollos _por si acaso_ o haciendo suposiciones que no están validadas por los expertos del dominio como hipótesis plausibles, o que no están apoyadas por datos, ya sean de uso, de análisis de la competencia, etc. 

Es perfectamente válido hacer experimentos y lanzar al mercado prestaciones para ver qué acogida tienen. Pero lo correcto sería que estas prestaciones fuesen definidas a partir de una hipótesis de negocio que tenga sentido. Por ejemplo, puede que la competencia haya empezado a hacerlo y queremos comprobar que funciona en nuestro caso. O puede que sea algo que haya tenido éxito en otro mercado.

También podría haber un elemento no funcional. A lo mejor nos empeñamos en mejorar la performance de un sistema cuando no hay datos que lo justifiquen, e invertimos tiempo y recursos que se detraen del desarrollo de nuevas prestaciones que nuestras clientas sí necesitan.

## Leer más

Aquí tienes una selección de artículos que he usado como referencia o en los cuales pueden encontrar otros puntos de vista.

* [How the Theory of Constraints can help you manage bottleneck in your software delivery process](https://medium.com/slido-dev-blog/what-is-the-theory-of-constraints-and-why-i-should-bother-2727381217d8)
* [The Theory Of Constraints In Agile](https://www.leadingagile.com/2018/03/the-theory-of-constraints-in-agile/#:~:text=The%20constraint%20in%20Agile%2C%20or,in%20poor%20quality%20hinders%20sales)
* [Solve the Theory of Constraints in Software Development](https://spin.atomicobject.com/theory-constraints-software/)
* [Harnessing Efficiency: The Theory of Constraints in Software Development
  ](https://www.eferro.net/2023/11/harnessing-efficiency-theory-of.html)
* [Theory of Constraints Applied to Software Development](https://ascendle.com/ideas/theory-of-constraints-applied-to-software-development/)
* [The Theory of Constraints in software development](https://mikecarruego.medium.com/the-theory-of-constraints-in-software-development-7e37cb0911db)
