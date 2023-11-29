---
layout: post
title: Refactoring para quienes no refactorizan
categories: articles
tags: good-practices refactoring ruby
---

Me he dado cuenta de que no había escrito nunca un artículo sobre _refactoring_ dirigido a personas que no saben lo que es, o que no lo entienden correctamente.

_Refactoring_ es una práctica de ingeniería de software que consiste en modificar un código de tal forma que no se altera lo que hace. El objetivo es conseguir que ese código tenga un mejor diseño, que se entienda mejor cómo funciona y que sea más barato modificar su comportamiento o añadir funcionalidades en el futuro.

Como no se modifica el comportamiento, el refactoring puede desplegarse a producción, incluso aunque se trate de un cambio muy pequeño. Estos cambios pequeños, a medida que se van acumulando, consiguen transformar una base de código con defectos de diseño en otra más fácil de comprender, mantener y modificar.

El beneficio buscado con el refactoring es económico, no es una supuesta mejora estética y subjetiva del código. El refactoring persigue que la evolución futura de un código sea lo más barata posible:

* Manteniendo mínimo el riesgo asociado al cambio al introducir cambios frecuentes, pequeños e inocuos y así reducir o minimizar la necesidad de introducir grandes cambios de código en producción cuando llega el momento de añadir, modificar o corregir funcionalidad.
* Habilitando puntos de cambio en el código que nos permitan añadir funcionalidad o modificar la existente con el mínimo esfuerzo y tiempo posible.
* Reflejando nuestro conocimiento de negocio en el código de la manera más actualizada y fiel, lo que facilita el _on boarding_ de nuevas desarrolladoras, la introducción de nuevas prestaciones e incluso cambios grandes en la arquitectura.

La idea básica es que un esfuerzo de refactoring pequeño, pero constante, puede facilitarnos grandes cambios en el futuro. Es como cuando tenemos un jardín: si trabajamos unos minutos todos los días en él no nos encontraremos teniendo que hacer grandes esfuerzos para limpiarlo cuando pasado el tiempo vemos que se ha convertido en una jungla. A su vez, el tenerlo ordenado y limpio, nos facilitará introducir plantas nuevas o hacer reformas de su diseño.

## Entendiendo el _refactoring_

Cuando escribimos un código por primera vez, especialmente si tenemos poca experiencia, lo más seguro es que no consigamos hacerlo de la mejor forma posible. Aunque funcione correctamente, puede que resulte difícil entender cómo hace lo que hace, o que si necesitamos hacer alguna modificación nos cueste mucho trabajo. Puede que incluso, al principio cualquier cambio genere errores inesperados.

El _refactoring_ es la práctica en la que aplicamos diversas técnicas para conseguir ese cambio a mejor del código, sin que deje de hacer lo que estaba haciendo hasta ahora, evitando errores que hagan que el programa deje de funcionar o genere resultados incorrectos. El _refactoring_ consiste en realizar pequeños cambios inocuos de tal forma que el programa siempre pueda funcionar, incluso poniendo estos cambios uno a uno en producción.

No es fácil encontrar una analogía de la práctica de refactoring en otras disciplinas. En ingeniería es habitual crear modelos o prototipos para validar hipótesis de diseño, pero también para refinar detalles. Sin embargo, esto no se hace con el producto final. En el software, en cambio, refactorizamos sobre un código que, de hecho, está en producción.

La mejor analogía que me viene a la mente es la de la escritura. Las escritoras revisan constantemente el texto para encontrar formas mejores de organizarlo, utilizar un vocabulario que exprese mejor la idea, mueven palabras, frases o párrafos para estructurar mejor el discurso y, en general, manipulan el texto hasta lograr que cumpla el fin deseado: informar, conmover, divertir, denunciar, movilizar, entretener...

Personalmente, el _refactoring_ es un proceso que me resulta muy familiar, pues mucho antes de profundizar en el desarrollo de software, tenía experiencia en la escritura. Por tanto, la idea de revisar el código de forma contínua a fin de lograr que expresase una idea de la mejor manera me resultaba natural y casi automática. En mi cabeza no existía la posibilidad de escribir el código correcto a la primera, sino que la versión inicial siempre sería una especie de boceto o borrador que iría puliendo a medida que aumentaba mi entendimiento de la tarea.

Con el tiempo descubrí el libro fundacional de M. Fowler, _Refactoring_, que me ayudó a entender lo que estaba haciendo como una práctica intencional y metódica. Hasta entonces, podría decirse que mi proceso de refactoring era intuitivo. En la primera edición del libro, de hecho, hay algunas colaboraciones de otros autores que reflejan también la novedad que suponía abordar esta práctica de manera sistemática en el momento de su publicación. Aún hoy, que ya tenemos una segunda edición y decenas de recursos de otras muchas autoras, el _refactoring_ no es una práctica de la industria tan implantada, sistemática y metódica como debiera.

## El refactoring como práctica consciente y metódica

El refactoring no es solo el hecho de modificar partes del código con la finalidad de mejorar su diseño. Es necesario subrayar que se trata de una práctica intencional, consciente y metódica.

Es intencional y consciente porque debería formar parte de la rutina de trabajo. Refactorizamos para preparar el código cuando necesitamos introducir algún cambio. Antes de intentar siquiera añadir una modificación a un algoritmo, reorganizamos el código para que la forma de introducir esa modificación esa sencilla. Es un poco como cuando una cocinera corta y prepara todos los ingredientes antes de empezar a elaborar un plato. Al tener a mano todo lo necesario, el proceso de cocinado resulta sencillo y la cocinera puede centrarse en controlar los tiempos, punto de cocción y sazonado. Si tuviese que picar una verdura mientras se sofríe la cebolla, es posible que esta se pase y que el resultado sepa a quemado.

La práctica es metódica porque no se refactoriza de cualquier manera. Existen técnicas y mecánicas específicas para refactorizar. De hecho, algunas están lo bastante bien definidas como para que se puedan automatizar. De este modo, los mejores entornos de desarrollo nos permiten ejecutar estas transformaciones de manera automática, lo que garantiza que se realizan sin errores y sin afectar al funcionamiento del código transformado.

También es metódica porque el refactoring se puede aplicar a patrones que podemos encontrar en el código a los que llamamos _code smells_. Los _code smells_ son ciertos síntomas que indican defectos de diseño de software que, aunque no perjudican la funcionalidad del código, sí que dificultan su comprensión y su mantenimiento. Muchos de estos _smells_ se pueden resolver aplicando técnicas de refactoring específicas. 

## Lo que no es refactoring

Un cambio que modifica el comportamiento del código no es refactoring. Los cambios del refactoring se refieren a la estructura y el diseño del código, no a lo que hace. Por tanto, en un código razonablemente cubierto de tests, los cambios de refactoring no tienen efectos visibles. Nadie debería percibir que se ha realizado algún tipo de modificación.

Un cambio de grandes dimensiones en el código que afecta a numerosos archivos tampoco es refactoring. A ese tipo de cambios prefiero llamarlos reescrituras. Aunque mantengan el comportamiento, desde el punto de vista de los tests o de las usuarias de la aplicación, las reescrituras suelen ser un intento de volver a escribir el mismo software partiendo de distintos principios o intentando plasmar un nuevo diseño. Este tipo de cambios requieren tiempo y, si no se hacen aplicando las tácticas adecuadas, pueden introducir mucho riesgo, bloquear el desarrollo de nuevas prestaciones, etc.

De hecho, el refactoring puede conducir al mismo rediseño, pero en lugar de hacer un gran salto de fe, transforma el código aplicando pasos tan pequeños que no suponen riesgo.

En general, se podría decir que no es refactor si:

* Cambiamos comportamiento
* El cambio hace que fallen los tests
* Se tiene que planificar
* Obstaculiza el desarrollo
* Los cambios afectan a más de dos o tres archivos

## Hagamos un ejemplo

Creo que lo mejor es verlo con un ejemplo. Voy a intentar ponerme en la piel de una persona que está empezando a aprender a programar. Tal vez alguien que acaba de empezar en la industria a la que le encargan su primera tarea.

## Ejercicio y primera iteración

Imaginemos que trabajamos para una compañía que tiene cientos de sucursales repartidas por todo el mundo y quiere optimizar su consumo de energía. En una primera fase se va a estudiar si hay consumos anormales dentro de cada una de esas oficinas, lo que podría indicar instalaciones defectuosas, mal uso, etc. El objetivo es detectar las que podrían requerir una atención urgente.

El criterio para clasificar un consumo com anormal es que se encuentra más de una desviación estándar por encima o por debajo de la media de consumo de ese local. Como el estudio está en sus primeros pasos, no se descarta modificar este criterio en el futuro, ni que se apliquen otros análisis a los mismos datos.

Para ello se recoge una muestra de datos en un archivo csv. Nuestro trabajo es procesar ese archivo y extraer una lista indicando todas las oficinas que presentan problemas, indicando sus consumos anómalos y el grado de desviación expresado como el número de desviaciones estándar.

Para preparar el artículo he añadido un generador aleatorio que nos permite generar archivos con datos aleatorios para un número dado de oficinas y años. Para cada oficina genera valores de consumo en tres rangos diferentes.

Aquí tenemos un ejemplo de los datos, para una única oficina durante un año.

```
office,year,month,consumption
1,2023,1,268199
1,2023,2,99242
1,2023,3,245126
1,2023,4,88012
1,2023,5,394065
1,2023,6,579409
1,2023,7,909539
1,2023,8,891502
1,2023,9,550299
1,2023,10,423113
1,2023,11,326505
1,2023,12,172286
```

En fin. La solución parece relativamente sencilla. Se trataría de leer un archivo CSV y obtener los datos, extraer los datos de cada oficina, calcular su media, su desviación típica, realizar las comparaciones adecuadas e ir guardando todos los hallazgos sospechosos.

Así que empezamos por crear este código, que consigue realizar la tarea requerida:

```ruby
# frozen_string_literal: true
require "csv"

Outlier = Struct.new(:office, :consumption, :deviation)

class ConsumptionAnalyzer
  def initialize

  end

  def execute(file_name)

    data = CSV.parse(File.read(file_name), headers: true, converters: :numeric)
    consumptions = []
    outliers = []
    data.each do |row|
      consumptions.append(row["consumption"])

      next if consumptions.size < 12

      average = consumptions.sum(0.0) / consumptions.size
      sum = consumptions.sum(0.0) { |element| (element - average)**2 }
      variance = sum / (consumptions.size - 1)
      standard_deviation = Math.sqrt(variance)

      consumptions.each do |consumption|
        next unless (consumption - average).abs > standard_deviation

        outlier = Outlier.new
        outlier.office = row["office"]
        outlier.consumption = consumption
        outlier.deviation = (consumption - average) / standard_deviation

        outliers.append(outlier)
      end

      consumptions = []
    end
    puts outliers
    puts "Data sample #{data.size} rows"
    puts "Found #{outliers.size} outliers"
    puts "Found #{outliers.size / 300} per office"
  end
end

a = ConsumptionAnalyzer.new
a.execute("sample.csv")
```

No es ninguna maravilla, pero hace su trabajo. Aunque no teniendo tests, puede ser difícil de asegurar.

Así que cuando nos dan un archivo con algo más de 18.000 filas, que serían 300 oficinas durante 5 años, encuentra alrededor de 6.790 consumos problemáticos. Esto son cuatro o cinco lecturas sospechosas por oficina y año.

## Segunda iteración, criterios algo más laxos

Nuestro pequeño programa funciona y hace su trabajo. Ahora bien, a la vista de los resultados, parece que una sola desviación típica para marcar un consumo como sospechoso pueda darnos muchos falsos positivos, por lo que nos piden cambiar el cálculo de forma que detecte desviaciones con un factor de 1.4 o mayores.

Parece un cambio fácil. Solo hay que tocar esta línea:

```ruby
next unless (consumption - average).abs > standard_deviation
```

Y cambiarla por:

```ruby
next unless (consumption - average).abs > standard_deviation * 1.4
```

Este es el resultado, el cual resulta más manejable. Así que nuestra responsable de proyecto está contenta, aunque comenta que sería interesante poder modificar ese valor a medida que se van tomando medidas de ahorro en las oficinas y se puede empezar a ser más exigente. "Bueno", pensamos, "no es más que cambiar un valor en el código".

```
Data sample 18000 rows
Found 2310 outliers
Found 7 per office
```

Lo que acabamos de hacer no ha sido un refactor. Hemos hecho un cambio de funcionalidad, para lo cual hemos tenido que cambiar el código del programa. Esto viola el principio de diseño de software conocido como Open/Closed: abierto para extensión y cerrado para modificación.

Lo que nos dice este principio es que para hacer este cambio de funcionalidad que acabamos de realizar, sería preferible no tener que modificar el programa.

## El primer refactor

Tener que modificar el código para hacer que el comportamiento del software cambie siempre es un problema.

Supongamos que este programa de ahorro de energía se va a aplicar por áreas geográficas o países. Cada dirección regional necesita personalizar el programa debido a diferentes razones. Por ejemplo, en países con climas más extremos es posible que haya mayores consumos por calefacción en invierno, así que requerirán un sistema un poco menos sensible con sus datos que otros.

Así que si tenemos, por ejemplo cinco direcciones regionales necesitaremos cinco versiones diferentes del programa. Y eso únicamente teniendo en cuenta este pequeño aspecto. Y si fuese una aplicación web única para todos, tendrían que pedirnos que la cambiásemos para cada uso. No parece una solución ni útil ni escalable. 

Lo ideal sería que cada dirección regional usase el mismo programa, pero con diferente configuración. La configuración es una de las formas en que un código puede estar abierto a extensión sin tener que modificarlo, ya que puede hacerse independiente del código del programa.

El problema que tenemos en este caso es que esta parte del algoritmo incluye un parámetro que está fijado en el propio código aunque, por su naturaleza, tiene sentido que su valor cambie. No es incorrecto en sí mismo, pues el código funciona, pero introduce una dificultad si necesitamos ajustarlo a otro valor.

```ruby
next unless (consumption - average).abs > standard_deviation * 1.4
```

Esto es lo que llamamos un _code smell_: un aspecto del código que no es incorrecto _per se_, pero revela un problema subyacente que puede manifestarse cuando necesitamos cambiar el comportamiento de la unidad de código en que se encuentra. 

El _smell_ o síntoma es el hecho de que aparezca un número arbitrario en el código. Este en concreto tiene un nombre: _número mágico_ o _magic number_. El problema inmediato es que es fácil perder la pista de su significado. Nosotras tenemos fresco lo que significa, pues acabamos de escribir el programa. Pero si otra persona tiene que ocuparse de ese cambio, puede encontrarse con dificultades para averiguar qué pinta ahí ese número.

Eliminar este _code smell_ implica un cambio en el código que debe hacerse sin afectar a la funcionalidad actual. Por ejemplo, si ahora mismo el código detecta consumos inusuales mayores de 1.4 desviaciones estándar, una vez que hagamos el cambio, el programa debería detectar exactamente las mismas.

Para eliminar el _smell_ tenemos varias soluciones que esencialmente consisten en darle un nombre a ese valor de forma que siempre podamos saber qué representa. Así que disponemos de tres posibles refactors que podríamos aplicar:

* **Introducir una constante**: que aplicaremos cuando sepamos que ese valor no va a cambiar, al menos no en un futuro previsible. Tenemos ejemplos de constantes matemáticas y físicas, como PI, pero en nuestro negocio podrían existir otros valores constantes. No es nuestro caso porque los requisitos que nos piden es que se pueda cambiar.
* **Introducir una variable**: que aplicaremos cuando ese valor puede cambiar y pueda proceder de una función usada en el ámbito de nuestra pieza de código. Aunque sabemos que el valor del que estamos hablando es variable, también sabemos que lo queremos cambiar desde fuera del propio código.
* **Introducir un parámetro**: que será la solución cuando queremos que el valor venga de fuera de nuestra pieza de código, por lo que su lugar lógico es convertirse en un parámetro en la signatura de nuestra función o método.

Este último refactor tiene el objetivo de que podamos usar nuestro código de esta manera:

```ruby
a = ConsumptionAnalyzer.new
a.execute("sample.csv", 1.4)
```

Por lo general, todos los refactorings tienen una mecánica específica. En algunos casos está lo bastante definida como para que se pueda automatizar. Así, muchos IDE nos proporcionan estos automatismos, de modo que simplemente tenemos que indicar el trozo de código que queremos cambiar y el editor hará el resto.

_Introducir parámetro_ es uno de esos refactoring que está automatizado. Sin embargo, es muy sencillo de hacer. Añadimos el parámetro en la signatura del método `execute` y le ponemos un valor por defecto para asegurar que podemos usar el software exactamente igual que antes.

```ruby
# frozen_string_literal: true
require "csv"

Outlier = Struct.new(:office, :consumption, :deviation)

class ConsumptionAnalyzer
  def initialize

  end

  def execute(file_name, deviation_factor = 1.4)

    # Removed for clarity
    
    data.each do |row|
      # Removed for clarity

      consumptions.each do |consumption|
        next unless (consumption - average).abs > standard_deviation * deviation_factor

        # Removed for clarity
      end

      consumptions = []
    end
    puts outliers
    puts "Data sample #{data.size} rows"
    puts "Found #{outliers.size} outliers"
    puts "Found #{outliers.size / 300} per office"
  end
end
```

Es decir, así:

```ruby
a = ConsumptionAnalyzer.new
a.execute("sample.csv")
```

Una vez que comprobamos que la nueva versión funciona igual, podemos empezar a explotarla pasándole un parámetro. Para nuestro ejemplo, hemos creado una utilidad de línea de comandos a la que le podemos pasar el parámetro:

```ruby
#!/usr/bin/env ruby
# frozen_string_literal: true

require_relative '../lib/energy/consumption_analyzer'

deviation = ARGV[0].to_f
deviation = 1.4 if deviation.zero?

a = ConsumptionAnalyzer.new
a.execute('../sample.csv', deviation)
```

## Algunas reflexiones sobre este primer refactor

En realidad si nuestro código funcionase bien y no hubiese ninguna necesidad de cambiarlo, no estaríamos hablando de _refactoring_. Simplemente, el programa seguiría ahí, prestando su servicio, sin necesidad de tocarlo. Pero aunque eso es algo relativamente frecuente, también lo es que cuando introducimos un software, especialmente al principio, descubrimos limitaciones o posibilidades que nos impulsan a cambiarlo.

Por supuesto, lo ideal sería que fuese barato cambiar el código, entendiendo como barato que:

* El tiempo y esfuerzo necesario para realizar el cambio sea el mínimo posible.
* El riesgo de introducir defecto sea el mínimo posible, preferentemente cero.

Lo que acabamos de ver es que la existencia de _code smells_ contribuye a incrementar el tiempo y el riesgo requerido para el cambio. Los motivos serían:

* El code smell en sí dificulta la comprensión del código y, por tanto, hace que tardemos más en entender donde y cómo tenemos que aplicar el cambio necesario.
* El estado del código dificulta introducir la nueva funcionalidad porque la estructura actual no contempla la posibilidad de una forma diferente de hacer las cosas.
* Manipular el código implica la posibilidad de alterar su comportamiento que puede introducir errores o resultados no deseados.

Como hemos podido ver, antes de poder aplicar el cambio deseado, hemos tenido que resolver el _code smell_. Una vez reparado el código, introducir el cambio fue fácil.

Una vez hecho esto, lo primero que podría venirnos a la mente es algo así como: entonces podría ser buena idea identificar los _code smells_ que haya en el código y arreglarlos. De este modo, en el futuro nos encontraremos con menos problemas para hacer cambios en el sistema.

A esta propuesta no le falta razón, pero tiene algunos inconvenientes. Para empezar, muchas veces no vamos a tener tiempo de hacer eso. El negocio se mueve y es más importante introducir nuevas funcionalidades o mejoras y arreglar errores. Perfectamente, puede ocurrir que identifiquemos code smells en áreas del código que no son importantes para el negocio, ya que funcionan como es debido y no se han necesitado cambios.

Por este motivo, es mucho más práctico limitar esto a las áreas del código que tenemos que tocar por necesidades del negocio. De hecho, es lo que ha ocurrido hace un momento. Nos han pedido que se pueda cambiar un cierto parámetro que originalmente estaba fijado por el código. Tuvimos que deshacer eso para ofrecer esa posibilidad. En este caso, la solución del _code smell_, el refactoring, coincidió prácticamente con la solución del problema.

Hay muchas posibles necesidades que pueden surgir en este pequeño proyecto que nos darían oportunidades para refactorizar todo el código. En algunos casos con más coste y en otro con menos. Así, se me ocurren:

* Los datos podrían ser proporcionados en otros formatos: XML, Json
* De hecho, ahora vienen en forma de archivos, pero en otros casos podrían obtenerse consultando una API, etc.
* Quizá nos pidan entregar los resultados en un CSV o similar que se pueda abrir en una hoja de cálculo
* O quizá nos pidan incluir más datos en el reporte
* O incluso cambiar completamente el algoritmo, basándose en otra medida

Todos estos cambios podrían llegar a ser solicitados. Pero tampoco podemos obsesionarnos con imaginar todos los futuros posibles y anticiparlos. Como mucho, podemos asumir que llegarán cambios.

Por esa misma razón, es preferible actuar de una manera reactiva: refactorizar cuando surge la necesidad o cuando tenemos la oportunidad.

## Donde nacen los _code smells_

Como hemos dicho más arriba, los _code smells_ son ciertos patrones del código que señalan la presencia de defectos de diseño, dificultando el cambio del software a la hora de arreglar errores o modificar las funcionalidades. En sí mismos no son errores ni provocan un mal funcionamiento del código.

Pero el hecho de que aparezcan en nuestro código sería un indicador de un diseño inadecuado para el programa que tenemos entre manos y este puede venir motivado por varias causas. 

Existen dos fuerzas que mueven el desarrollo de software: nuestro conocimiento del dominio o negocio que nos dice qué es lo que tenemos que programar, y nuestro conocimiento técnico, que nos dice cómo tenemos que implementarlo.

Nuestras carencias en cada una de ellas son las dos principales fuentes de problemas.

### La deuda técnica

La deuda técnica sería provocada por nuestra falta de conocimiento del dominio o negocio en un momento dado. Esta falta de conocimiento no sería causada por desidia o desinterés, sino por la incertidumbre. Cuando ponemos un software en producción, puede que no tengamos una idea clara de como va a responder sus usuarias potenciales, puede que no conozcamos lo bastante de sus necesidades o de las soluciones que realmente necesitan. 

Podríamos haber supuesto que ciertos parámetros se mantendrán constantes, o partir de ciertas hipótesis sobre cómo las usuarias interactuarán con el software. Podríamos asumir que ciertos aspectos del negocio cambian lentamente o, al contrario, que lo hacen con mucha frecuencia. Y así, un largo etcétera de aspectos de los que no sabemos mucho.

Por tanto, podemos empezar a desplegar el software con el objetivo de descubrir precisamente eso que no conocemos. En consecuencia el código reflejará una serie de asunciones por nuestra parte que podrían revelarse incorrectas o incompletas.

A esa diferencia entre el conocimiento real del negocio y lo que está reflejado en el código es a lo que llamamos _deuda técnica_. Cuando asumimos esa diferencia y ponemos código en producción de forma consciente, también asumimos que en algún momento tendremos que _pagar_ esa deuda, cosa que haremos refactorizando para poder introducir tanto el nuevo conocimiento que hemos desarrollado sobre el negocio como las nuevas funcionalidades.

Con todo, la deuda técnica no es la principal causa de smells, ya que la deuda técnica bien manejada implica reconocer en el propio código la posibilidad de cambios en el futuro y preparar el código para que no sea muy costoso aplicarlos llegado el momento.

### El mal diseño

La otra fuerza que mueve el desarrollo de software es nuestra pericia técnica. Es decir, nuestra capacidad para escribir un software que refleje el conocimiento del negocio de la mejor manera posible. 

Si no tenemos mucha experiencia o ideas claras en el diseño de software y los principios que lo guían, lo más probable es que nuestro código presente muchos _code smells_. Cuando tenemos experiencia, podemos prevenir algunos de los más groseros. A veces, la experiencia nos sirve para tolerar algunos defectos de diseño basándonos principios de conveniencia, como sería el caso de asumir deuda técnica: aceptar el compromiso de tener que refactorizar esto en el futuro, mientras no tengo conocimiento suficiente para hacerlo mejor.

Sin embargo, una programadora novel o una con experiencia, pero con bajo interés en el diseño de software, introducirá muchos smells que, a la larga, dificultarán el progreso de ese software. Las prisas por salir a producción, o unas prácticas técnicas descuidadas, también nos llevarán a introducir muchos code smells.

La consecuencia es que se crearán diseños inflexibles, acoplados a tecnologías específicas, con el código mal organizado, etc, que incrementarán el coste del desarrollo.

Y esta situación empeora si carecemos de tests.

## La carencia de tests

La falta de tests perjudica nuestras posibilidades de refactorizar código. Los tests nos proporcionarían la red de seguridad necesaria para hacer cambios sabiendo que en caso de alterar el comportamiento del programa, algún test dejaría de pasar y nos indicaría donde estamos introduciendo problemas.

Además, la falta de test favorece problemas de diseño. Para poder testear nuestro programa necesitamos una forma fácil de hacer el setup necesario para ejecutarlo. Si el código es fácil de poner bajo test, normalmente es indicativo de que tiene un diseño razonablemente bueno. Lo que no quiere decir que no sea mejorable.

Pero si no tenemos tests, es muy posible que haya muchos aspectos que habremos pasado por alto.

En nuestro ejemplo, para poder poner el código bajo test tendríamos que forzar un poco las cosas. Por un lado, generar un archivo de datos de ejemplo que contenga una muestra adecuada de lo que podemos esperar. Pero, además, tal como lo hemos escrito es complicado capturar el output del programa, ya que se lanza directamente a la consola. Aunque es posible hacerlo en Ruby, que es el lenguaje que hemos estado usando, implica un trabajo extra.

En resumen: el hecho de no haber tenido el testing en mente, y ya no estoy hablando de TDD, ha favorecido un mal diseño. O bien, debido al mal diseño, el código es difícil de poner bajo test. Y como no tenemos tests, introducir cambios conlleva un riesgo.

¿Qué podemos hacer entonces?

## Refactor seguro y refactor probado

Poner un código bajo tests cuando no ha sido diseñado para ello es costoso y puede tener riesgos. El programa con el que estamos trabajando tiene ese problema. No es fácil ponerlo bajo test tal y como ha sido diseñado. El código no tiene estructura y está completamente incorporado en un solo método de un objeto, por lo que tampoco podemos poner bajo tests partes del mismo.

En estos casos podemos optar por _refactors seguros_ o _probados_. ¿En qué consisten? Los refactors seguros o probados son aquellos que podemos aplicar con la confianza de que no se alterará el comportamiento de la pieza de software ni se introducirán errores, bien porque son automáticos, bien porque está probado que no introducen riesgo. Tenemos dos formas principales:

* Refactor automático proporcionado por una herramienta de nuestro editor o entorno de desarrollo. Ya los hemos comentado anteriormente, la automatización nos proporciona la seguridad de que el refactor se aplicará de forma consistente.
* Seguir una receta bien conocida. Con frecuencia, muchos refactorings de ese tipo están automatizados, pero cuando no es así, seguir los pasos de la receta paso a paso, garantiza que el refactor se realiza correctamente y no introduce errores.

Por otro lado, a fin de minimizar los riesgos lo mejor es seguir este procedimiento general y asumiendo que tenemos el código bajo control de versiones:

* Hacer un _commit_ del estado actual del código antes de iniciar el refactor, para poder revertir los cambios fácilmente en caso de problemas. 
* Ejecutar el refactor, ya sea automático o siguiendo la receta.
* Comprobar que no se han introducido errores. Si es así, revertir los cambios y volver a empezar.
* Si todo ha ido bien, consolidar el cambio, haciendo un nuevo _commit_.

Si el refactor lo hacemos por pasos, deberíamos hacer un commit por cada paso que hagamos siempre que no introduzca errores. En principio, las recetas de refactor probados no dejan nunca el código en estado inestable. Por esa razón, si introducimos un error, podemos deshacer ese cambio fácilmente y volver a un punto estable.

## Mejorando nuestro código con refactors probados

Como hemos dicho, nuestro código reside en un único método de la clase `ConsumptionAnalyzer` de tal modo que es muy difícil de testear y modificar en su caso. ¿Podríamos convertirlo en un código más manejable al cual pudiésemos añadir tests, aunque sean parciales?

La respuesta es que sí. Disponemos de varios refactors que podríamos aplicar en este código y mejorar la situación. Pero antes de eso, me gustaría que nos fijásemos en algunos aspectos de la forma que tiene el código. A ver si los descubres:

```ruby
# frozen_string_literal: true
require "csv"

Outlier = Struct.new(:office, :consumption, :deviation)

class ConsumptionAnalyzer
  def initialize

  end

  def execute(file_name, deviation_factor = 1.4)

    data = CSV.parse(File.read(file_name), headers: true, converters: :numeric)
    consumptions = []
    outliers = []
    data.each do |row|
      consumptions.append(row["consumption"])

      next if consumptions.size < 12

      average = consumptions.sum(0.0) / consumptions.size
      sum = consumptions.sum(0.0) { |element| (element - average)**2 }
      variance = sum / (consumptions.size - 1)
      standard_deviation = Math.sqrt(variance)

      consumptions.each do |consumption|
        next unless (consumption - average).abs > standard_deviation * deviation_factor

        outlier = Outlier.new
        outlier.office = row["office"]
        outlier.consumption = consumption
        outlier.deviation = (consumption - average) / standard_deviation

        outliers.append(outlier)
      end

      consumptions = []
    end
    puts outliers
    puts "Data sample #{data.size} rows"
    puts "Found #{outliers.size} outliers"
    puts "Found #{outliers.size / 300} per office"
  end
end

```

Lo primero es que tiene muchas líneas, creo que 29. Puede parecer que no es mucho, pero en mi opinión 29 líneas pueden ser demasiadas para un método. Esto es otro _code smell_ llamado muy apropiadamente _long method_. No existe un límite objetivo de líneas para un método, pero cuando hay muchas, debería llevarnos a preguntarnos cosas como:

* ¿Contribuyen todas las líneas al objetivo del método?
* ¿Podríamos hacer grupos de líneas que colaboran en realizar una tarea?
* ¿Se ocupa el código de hacer varias cosas diferentes?

De hecho, hay otro rasgo que he visto definido a veces como `code smell`: las líneas en blanco para separar bloques de código que aparentemente se ocupan de cosas distintas. Nosotras podríamos usarlas como herramienta, como veremos a continuación.

Así que todo apunta a que el método está encargándose de varios trabajos o responsabilidades:

* Obtener los datos de un archivo físico en formato CSV
* Coleccionar los datos de una oficina
* Calcular los índices estadísticos de media y desviación típica para...
* Decidir si un consumo es excesivamente alto o bajo

Un refactor seguro que podemos hacer es el conocido como _extraer método_. Consiste en: 

* Agrupar todas las líneas que se ocupan de algún asunto en particular.
* Identificar las variables o parámetros de los que depende ese bloque de líneas.
* Identificar el resultado que esas líneas generan y que es usado por el resto del código a continuación.
* Crear un nuevo método vacío cuyo nombre refleje la tarea que hacen esas líneas.
* Copiar el grupo de líneas en el cuerpo del método recién creado.
* Añadir en la signatura del método los parámetros necesarios.
* Hacer que el método devuelva el resultado procesado por las líneas si procede.
* Finalmente, reemplazamos el bloque de líneas por una llamada al método que acabamos de introducir.

Dicho así suena un poco complicado, sin embargo, es un refactor que suele estar automátizado.

Vamos a verlo paso a paso con algunos ejemplos.

### Obtención de los índices estadísticos

Estas cuatro líneas hacen dos cosas diferentes: la primera calcula la media de los consumos y las otras tres, calculan la desviación típica.

```ruby
class ConsumptionAnalyzer
  def execute(file_name, deviation_factor = 1.4)

    # Code removed for clarity
    
    data.each do |row|
      # Code removed for clarity

      average = consumptions.sum(0.0) / consumptions.size
      sum = consumptions.sum(0.0) { |element| (element - average)**2 }
      variance = sum / (consumptions.size - 1)
      standard_deviation = Math.sqrt(variance)
      
      # Code removed for clarity
      end
  end
end
```
Separémoslas:

```ruby
class ConsumptionAnalyzer
  def execute(file_name, deviation_factor = 1.4)

    # Code removed for clarity
    
    data.each do |row|
      # Code removed for clarity

      average = consumptions.sum(0.0) / consumptions.size
      
      sum = consumptions.sum(0.0) { |element| (element - average)**2 }
      variance = sum / (consumptions.size - 1)
      standard_deviation = Math.sqrt(variance)
      
      # Code removed for clarity
      end
  end
end
```

La línea que calcula la media hace uso de dos datos que provienen del array `consumptions`. Así que depende completamente de este array. Podríamos extraer esta línea a un método lo que ocultaría los detalles del cálculo en este nivel, pero también nos permitiría hacer un test para verificar que el cálculo se hace correctamente.

* El parámetro para ese método sería un array como el de consumptions.
* El método debería devolver el valor calculado de la media aritmética.
* Al método podríamos llamarlo simplemente `average`.

Creamos el método vacío:

```ruby
class ConsumptionAnalyzer
  
  # Code removed for clarity
  
  def average(consumptions)
    
  end
end
```


Copiamos y pegamos las líneas implicadas. Nota: en Ruby no hace falta poner el return explícito cuando lo que se va a devolver es el último cálculo.

```ruby
class ConsumptionAnalyzer

  # Code removed for clarity

  def average(consumptions)
    consumptions.sum(0.0) / consumptions.size
  end
end
```

Finalmente, reemplazamos el bloque con la llamada:

```ruby
class ConsumptionAnalyzer
  def execute(file_name, deviation_factor = 1.4)
    
    # Code removed for clarity
    
    data.each do |row|
      # Code removed for clarity
      
      average = average(consumptions)

      # Code removed for clarity
    end
    # Code removed for clarity
  end

  def average(consumptions)
    consumptions.sum(0.0) / consumptions.size
  end
end
```


El otro bloque tiene varias características interesantes. Las variables `sum` y `variance` no se usan fuera de ese bloque. Son variables temporales. ¿Y sabes una cosa? Eso también puede ser un _code smell_ y es un buen ejemplo de que son síntomas, no problemas en sí mismos. De hecho, la razón de tener variables temporales es que es más fácil entender lo que está pasando.

`sum` no es la suma de los consumos del array, sino la suma de los mínimos cuadrados de las diferencias de cada consumo con la media, lo que nos va a proporcionar un nuevo índice estadístico denominado _varianza_. De hecho, acto seguido usamos el valor de `sum` para calcular `variance`, la cual nos proporciona la desviación estándar. En otras palabras, estas líneas colaboran entre sí para calcular la desviación estándar de los datos, pero con nadie más en el código. 

La presencia de estas variables temporales que solo se usan para almacenar durante un momento cálculos parciales nos indica que tendría sentido aislar esas líneas en un método ocupado de calcular la desviación típica.

```ruby
class ConsumptionAnalyzer
  def execute(file_name, deviation_factor = 1.4)

    # Code removed for clarity
    data.each do |row|
      # Code removed for clarity
      
      average = average(consumptions)

      sum = consumptions.sum(0.0) { |element| (element - average)**2 }
      variance = sum / (consumptions.size - 1)
      standard_deviation = Math.sqrt(variance)

      # Code removed for clarity
    end
    # Code removed for clarity
  end

  def average(consumptions)
    consumptions.sum(0.0) / consumptions.size
  end
end

```

Un elemento que nos llama la atención es que también se usa la media, recién calculada en la línea anterior. Parece lógico pasar la media ya calculada para calcular la desviación típica. Pero igual no es tan buena idea. Me explico: el cálculo solo tiene sentido si se hace sobre los mismos datos. Si pasamos el dato de la media calculada sería posible calcular una media con otros datos y la desviación típica con otros.

Si este bloque solo tuviese el array de datos sería capaz de calcular la media por sus propios medios, bien haciendo el cálculo directamente, bien invocando el método `average` que acabamos de introducir y que espera que le pasemos un array de datos.

Podríamos reescribir ese fragmento así:

```ruby
class ConsumptionAnalyzer
  def execute(file_name, deviation_factor = 1.4)

    # Code removed for clarity
    data.each do |row|
      # Code removed for clarity
      
      average = average(consumptions)

      sum = consumptions.sum(0.0) { |element| (element - average(consumptions) )**2 }
      variance = sum / (consumptions.size - 1)
      standard_deviation = Math.sqrt(variance)

      # Code removed for clarity
    end
    # Code removed for clarity
  end

  def average(consumptions)
    consumptions.sum(0.0) / consumptions.size
  end
end
```

Por cierto, esto es otro refactoring que tiene el nombre de _inline variable_ y que, como hemos visto, es muy fácil de hacer. Basta con reemplazar el uso de una variable con el contenido de esa variable o, como en este caso, la expresión cuyo resultado se le asigna.

Es posible que alguien enarque una ceja pensando, ¿por qué hacer el cálculo dos veces si ya lo tenemos hecho? ¿No es perjudicial para el consumo de recursos? Podría ser, aunque también podríamos aplicar otras soluciones. Sin embargo, en este caso preferimos hacer independientes entre sí ambos cálculos. Esta discusión nos llevaría a hablar de acoplamiento, pero es un tema en el que ahora mismo prefiero no entrar.

Ahora que hemos aislado las líneas de código, vemos que:

* Necesitarán recibir `consumptions`.
* Devolverán la desviación estándar.
* El método se llamará `standard_deviation`.

```ruby
class ConsumptionAnalyzer
  def execute(file_name, deviation_factor = 1.4)

    # Code removed for clarity
    data.each do |row|
      # Code removed for clarity
      
      average = average(consumptions)

      sum = consumptions.sum(0.0) { |element| (element - average(consumptions) )**2 }
      variance = sum / (consumptions.size - 1)
      standard_deviation = Math.sqrt(variance)

      # Code removed for clarity
    end
    # Code removed for clarity
  end

  def average(consumptions)
    consumptions.sum(0.0) / consumptions.size
  end
  
  def standard_deviation(consumptions)
    
  end
end
```

Copiamos y pegamos el cuerpo:

```ruby
class ConsumptionAnalyzer
  def execute(file_name, deviation_factor = 1.4)

    # Code removed for clarity
    data.each do |row|
      # Code removed for clarity
      
      average = average(consumptions)

      sum = consumptions.sum(0.0) { |element| (element - average(consumptions) )**2 }
      variance = sum / (consumptions.size - 1)
      standard_deviation = Math.sqrt(variance)

      # Code removed for clarity
    end
    # Code removed for clarity
  end

  def average(consumptions)
    consumptions.sum(0.0) / consumptions.size
  end
  
  def standard_deviation(consumptions)
    sum = consumptions.sum(0.0) { |element| (element - average(consumptions) )**2 }
    variance = sum / (consumptions.size - 1)
    standard_deviation = Math.sqrt(variance)   
  end
end
```

Reemplazamos el bloque copiado con la llamada. Ahora las variables temporales están limitadas a un contexto por lo que dejan de preocuparnos como _smell_.

```ruby
class ConsumptionAnalyzer
  def execute(file_name, deviation_factor = 1.4)

    # Code removed for clarity
    data.each do |row|
      # Code removed for clarity
      
      average = average(consumptions)
      standard_deviation = standard_deviation(consumptions)

      # Code removed for clarity
    end
    # Code removed for clarity
  end

  def average(consumptions)
    consumptions.sum(0.0) / consumptions.size
  end
  
  def standard_deviation(consumptions)
    sum = consumptions.sum(0.0) { |element| (element - average(consumptions) )**2 }
    variance = sum / (consumptions.size - 1)
    Math.sqrt(variance)   
  end
end
```

Con todo, podríamos seguir aplicando el refactor _inline variable_ si nos parece que tiene sentido.

```ruby
  def standard_deviation(consumptions)
    Math.sqrt(variance(consumptions))
  end

  def variance(consumptions)
    sum = consumptions.sum(0.0) { |element| (element - average(consumptions))**2 }
    sum / (consumptions.size - 1)
  end
```

He dejado todos los métodos públicos, pues de este modo los podría poner bajo test de forma separada.

Por otra parte, el resultado de estos cambios con respecto al diseño es el aumento de la cohesión del código. Los métodos que hemos introducido agrupan líneas que colaboran en una tarea.

Ahora bien, si seguimos por aquí tenemos el peligro de caer en una espiral de refactoring que no nos lleve a ninguna parte. El diseño del software debe reflejar la comprensión del problema que resuelve. Si hacemos refactoring sin tener esto en cuenta, podemos perjudicar ese aspecto, moviendo el código hacia un diseño que no coincide con nuestro modelo mental.

Por eso, es preferible usar estar técnicas solo cuando necesitamos intervenir en el código para añadir o modificar funcionalidades del producto, o cuando necesitamos corregir errores.

En fin, pienso que como artículo introductorio ya está quedando un poco largo, así que voy a parar aquí y continuaremos hablando sobre la oportunidad del refactor en un nuevo artículo. 
