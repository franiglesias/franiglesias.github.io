---
layout: post
title: Refactor para quienes no refactorizan 2
categories: articles
tags: good-practices refactoring ruby
---

Segunda entrega de esta serie de introducción al refactoring, si es que no refactorizas. O si quieres impulsar esta práctica en tu equipo.

En la entrada anterior he intentado caracterizar el refactoring como una práctica técnica, deliberada, sistemática y metódica. En esta entrega me gustaría hablar de la oportunidad de la misma.

También en la entrada anterior he mencionado que en muchos equipos se habla de refactoring como una tarea específica para escribir desde otras bases un proyecto o parte de él, ya sea porque no se ha tocado en mucho tiempo, ya porque se es consciente de que su diseño no es bueno o por la razón que sea.

Para ello se intenta conseguir momentos o espacios, paralizando a veces el desarrollo de nuevas prestaciones. En parte porque a lo mejor el deterioro del código es tan grande que resulta carísimo en esfuerzo, tiempo y riesgo, añadir esas prestaciones.

Pero hemos dicho también que no podemos considerar refactoring esa forma de trabajar. Llámalo reescritura, rediseño o como quieres. Si implica, por así decir, parar el ritmo de entrega de valor, no es refactoring. Es otra cosa. Y no te digo que no sea necesaria, pero es otra cosa.

Decíamos que el refactoring consiste en realizar cambios pequeños e inocuos en un código a fin de mejorar su diseño. Por supuesto, podrías utilizar las técnicas de refactoring para abordar esos trabajos de reescritura de proyectos. O, dicho de otra forma, podrías abordarlo como refactoring, realizando cambios pequeños a medida que los necesitas sin romper el comportamiento actual. Pero eso es otra historia.

Hablemos de cuando se debería hacer realmente el refactoring.

## El refactoring oportunista

Se puede hacer refactoring cuando estamos estudiando un código y observamos algo que nos hace enarcar una ceja, leer varias veces un trozo de código o necesitar un tiempo para interpretar qué está pasando ahí. Idealmente, deberíamos poder leer un código y entender qué está haciendo y cómo lo está haciendo.

El refactoring oportunista ocurre cuando nos encontramos con un fragmento de código que muestra claramente un smell y corregirlo nos puede ayudar a que el código esté en mejor estado. Pero, como veremos, es importante resistir la tentación de seguir profundizando en la madriguera del conejo.

El contexto habitual es estar leyendo código por la razón que sea. Imagina el refactor como una nota que añades en el margen para ayudarte en la lectura, sobre todo en la lectura futura. Pero no estás buscando cosas que arreglar en el código. Simplemente te lo encuentras.

Lo malo es que, a veces, encuentras cosas graves.

### Un ejemplo con números mágicos

Veamos esta línea:

```ruby
next if consumptions.size < 12
```

Esta línea significa que vamos a la siguiente fila si el array de `consumptions` tiene menos de `12` elementos. Pero, ¿por qué `12`? Vale: 12 consumos por oficina en un año. De nuevo, tenemos un ejemplo del _code smell_ _número mágico_. Una solución es darle un nombre:

```ruby
# This goes outside of the class
CONSUMPTIONS_A_YEAR = 12

next if consumptions.size < CONSUMPTIONS_A_YEAR
```

Por desgracia, esta línea nos indica la existencia de otros problemas más graves:

* ¿Qué pasa si una oficina tiene menos de 12 consumos en un año porque abrió sus puertas en el segundo o tercer trimestre?
* ¿Y si el archivo de datos está desordenado?

Pero eso lo trataremos más adelante. Quizá lo más interesante es que al hacer el código más legible es también más fácil identificar aquellos casos en que el código no refleja bien el conocimiento del negocio.

## Un ejemplo con condiciones complejas

Otro ejemplo es esta línea:

```ruby
next unless (consumption - average).abs > standard_deviation * deviation_factor
```

La línea se lee: pasar al siguiente consumo _a menos que_ se cumpla la condición `(consumption - average).abs > standard_deviation * deviation_factor`, en cuyo caso seguimos en el bloque. Ahora bien, para entender la condición puede que tengas que pensar un ratito en qué significa.

La condición establece que si la diferencia de ese consumo con la media es mayor que la desviación típica multiplicada por un cierto factor entonces debemos considerar ese consumo como un _outlier_.

Las expresiones condicionales complejas no se suelen catalogar como _code smells_, pero teniendo en cuenta que introducen una dificultad para seguir el flujo o relato del código, suele ser recomendable esconder es complejidad bajo un nombre descriptivo. Para eso, podríamos extraer toda la expresión condicional a un método de la clase.

```ruby
next unless consumption_is_outlier(average, consumption, deviation_factor, standard_deviation)
```

Claro que esta solución no es mucho mejor. Un método con cuatro parámetros es también un _smell_, especialmente si son parámetros posicionales. Un cambio de orden, puede generar un error muy difícil de depurar.

Podemos probar con un refactor un poco más sencillo: introducir variable para reducir la complejidad de la expresión. El lado izquierdo representa la diferencia de consumo con la media:

```ruby
(consumption - average).abs
```
Mientras que el lado derecho representa el límite para considerar esa diferencia como demasiado grande:

```ruby
standard_deviation * deviation_factor
```

Podríamos hacer esto:

```ruby
difference = (consumption - average).abs
boundary = standard_deviation * deviation_factor

next unless difference > boundary
```

Ahora la expresión condicional es mucho más clara y la línea se puede leer como: pasar al siguiente a menos que la diferencia sea mayor que el límite.

Podría ser más correcto formalmente mover estos cálculos a métodos, ya que nos ahorramos las variables temporales, pero entonces volvemos a tener problemas. Fíjate lo que pasa con `difference`:

```ruby
next unless difference(average, consumption) > standard_deviation * deviation_factor
```

Humm... es como un sí, pero no, ¿verdad? No ganamos mucho. Es preferible pagar el precio de tener un par de variables temporales.

La lección es que, si bien podemos lograr pequeños triunfos a base de estos pequeños refactors oportunistas es importante no dejarse llevar por el entusiasmo e intentar refactorizarlo todo. Momentos adecuados no nos van a faltar, como veremos a continuación.

### Aislar lo que está mejor aislado

Consideremos ahora esta línea:

```ruby
data = CSV.parse(File.read(file_name), headers: true, converters: :numeric)
```

Cada vez que pasamos por ella se nos enciende una pequeña alarma: seguramente algún día nos pedirán leer archivos XML, o Json, o algún otro formato. Está claro que aquí necesitaremos aplicar un patrón _Strategy_ y tener diversos adaptadores, así como devolver los datos leídos en una estructura que no sea dependiente del soporte del que se ha leído.

Resiste el deseo de meterte en ese refactor hasta el fondo. ¿Qué ocurriría si nunca se da el caso de tener que leer otros formatos de archivo? Pues que habríamos perdido el tiempo programando cosas que no vamos a necesitar.

Sin embargo, hay un punto de razón en esa alarma. La variable `data` es de un tipo específico de una librería de Ruby para leer archivos CSV. Y el hecho de que la lectura del archivo esté plantada ahí, en el cuerpo del método principal resulta como poco molesto.

Pero podemos aplicar un refactor tan sencillo como _Extract method_ para dejar las cosas un poquito mejor de lo que estaban:

```ruby
class ConsumptionAnalyzer
  def initialize

  end

  CONSUMPTIONS_A_YEAR = 12

  def execute(file_name, deviation_factor = 1.4) 
    data = obtain_readings(file_name)
    # Code removed for clarity  
  end

  def obtain_readings(file_name)
    CSV.parse(File.read(file_name), headers: true, converters: :numeric)
  end

  # Code removed for clarity
end
```

Esto ya nos quita de delante el detalle de como obtenemos las lecturas. Tener esto separado nos facilitará hacer cambios en el futuro. 

Otro cambio interesante sería introducir nuestros propios tipos para los datos leídos, de modo que seamos independientes del uso de una u otra librería. Pero la magnitud del cambio es demasiado grande para un refactor oportunista.

De nuevo, no nos conviene comprometer más esfuerzo en profundizar en los cambios.

### Recomendaciones sobre el refactor oportunista

Es muy importante tener la disciplina de decir que no al refactor cuando nos aleja del objetivo que estábamos persiguiendo en primer lugar. 

El refactor oportunista se aplica cuando estamos leyendo código y encontramos pequeños escollos para entender lo que hace. El tipo de arreglos que podemos aplicar en ese momento tiene que ser muy limitado. Lo suficiente para resolver esa dificultad puntual que nos hacía difícil entender un fragmento en particular. Nada más.

## El refactor preparatorio

El siguiente momento del refactor también requiere disciplina. El refactor preparatorio se da en el contexto de una intervención en el código para añadir o modificar funcionalidades o para corregir errores.

Una vez que tenemos claro qué debe hacerse, la intervención tendría tres partes separadas:

* Refactor preparatorio
* La intervención que añade, modifica o corrige
* Refactor posterior

Voy a intentar explicarlo.

Cuando vamos a intervenir en el código puede ocurrir que nos demos cuenta de que para introducir el cambio deseado sería deseable que el código existente tuviese otro diseño. Esto es, con un diseño mejor, el cambio podría ser trivial, o podría consistir en añadir código en vez de modificar lo que hay, etc.

Por tanto, deberíamos ocuparnos primero de refactorizar el código actual para tener ese mejor diseño que hemos podido visualizar. Dicho de otra manera: rediseñamos el código actual manteniendo el comportamiento que tiene ahora. Eso es el refactor preparatorio.

Una vez hecho eso, aplicamos el cambio que deseábamos originalmente, que ahora será mucho más fácil y seguro.

El refactor preparatorio puede ser trabajoso. Durante el tiempo de refactor no hacemos nada por añadir la funcionalidad nueva o corregir el bug que teníamos o cualesquiera que fuese el objetivo de la intervención. Todo nuestro foco es mejorar la situación del código. Por eso, no debería sorprendernos que nos ocupe bastante tiempo y esfuerzo. Pero como podríamos estar protegidas por tests el riesgo es reducido.

No es nuestro caso, por cierto, así que igual deberíamos añadir un paso previo. Si no tenemos tests que protejan ese aspecto concreto, lo primero sería introducirlos de la mejor manera posible.

## El refactor posterior

Una vez que hemos realizado la intervención deseada en el código puede ocurrir que veamos nuevas oportunidades de refactorizar a fin de facilitar nuevas intervenciones en el futuro.

Pero como hemos dicho otras veces, no se trata de imaginar todos los futuros posibles y empezar a programar cosas por si acaso algún día se usan. Se trata de asegurar que el código que dejamos se entiende bien y, en su caso, es fácil de cambiar cuando sea necesario.

## Veamos algunos ejemplos

Teniendo claro que el refactor forma parte de la rutina de desarrollo, lo interesante es que sean las necesidades del negocio nos guíen a la hora de decidir qué y cuando refactorizar. Así que vamos a ver algunos ejemplos de trabajo realista con el código de nuestro analizador y de qué manera usamos los distintos momentos de refactoring.

## Analizar correctamente cada oficina

Ahora que la gente de negocio ha estado probando el script se han dado cuenta de algunos problemas. El análisis se está haciendo por oficina y año y ellos quieren que se haga por la totalidad de consumos de una oficina a lo largo de su historia. Es más: una oficina podría no tener doce lecturas de consumo por año. 

Esto es lo mismo que detectamos al hacer el primer refactor oportunista, pero ahora está claro cómo se hace la colección de datos en el programa y cómo se debería estar haciendo. Podemos ver la diferencia y entender por qué se está haciendo mal, lo que es el primer paso para arreglarlo.

La cuestión es que la situación actual del código no es muy adecuada para resolver el problema. En el mismo bucle coleccionamos las lecturas que vamos a analizar y con cada una de estas colecciones realizamos el análisis:

```ruby
class ConsumptionAnalyzer
  def initialize

  end

  CONSUMPTIONS_A_YEAR = 12

  def execute(file_name, deviation_factor = 1.4)

    data = obtain_readings(file_name)
    consumptions = []
    outliers = []
    data.each do |row|
      consumptions.append(row["consumption"])

      next if consumptions.size < CONSUMPTIONS_A_YEAR

      average = average(consumptions)
      standard_deviation = standard_deviation(consumptions)

      consumptions.each do |consumption|
        difference = (consumption - average).abs
        boundary = standard_deviation * deviation_factor

        next unless difference > boundary

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

  # Code removed for clarity
end
```

Nos convendría separar ambas responsabilidades: por una parte, recorrer los datos brutos para extraer las colecciones de lecturas, y luego recorrer esas colecciones y hacer el análisis de cada una. Este sería el **refactor preparatorio**. Una vez hecha esta separación, podríamos centrarnos en la forma en que se coleccionan los datos de cada oficina.

El problema es que realmente no es posible hacer este refactor de manera automática o probada. Para tejer una red de seguridad necesitamos introducir algún test. Ciertamente, va a suponer un coste grande, pero eso que nos ahorramos en el futuro.

### Poniendo el código bajo test

Tenemos dos dificultades para poner el código bajo test. La primera es el hecho de que leemos un CSV directamente del sistema de archivos. No es lo más complicado, ya que afortunadamente podemos especificar su nombre. Gracias a eso, podríamos preparar uno a medida para el test que queremos hacer.

La segunda dificultad es el conseguir el _output_. Ahora mismo lo estamos enviando a la consola o `stdout`. En Ruby es posible hacer un apaño que nos permite capturar el output a `stdout` y así poder verificarlo. Podemos usar esta función invocando el código del cual queremos capturar el output.

```ruby
def capture_stdout
  original = $stdout
  foo = StringIO.new
  $stdout = foo
  yield
  $stdout.string
ensure
  $stdout = original
end
```

Quedaría algo así:

```ruby
a = ConsumptionAnalyzer.new
result = capture_stdout {a.execute('../test.csv', 1.4)}
```

Y luego podríamos verificar el resultado contra un ejemplo creado a mano. O generado por la propia aplicación. Bienvenidas al test de caracterización.

Los tests de caracterización son tests que en lugar de verificar el output de una función o de un programa contra un criterio que hayamos definido previamente, generamos un output ejecutando el código. Ese output o snapshot será el criterio contra el que verificaremos en el test.

Es decir: tomamos una muestra de lo que hace el código en su estado actual y usamos eso como criterio para asegurar que el refactoring que hagamos provoca cambios en él.

Obviamente, una vez que empecemos a introducir nuevos comportamientos o modificarlo, tendremos que actualizar el snapshot o desecharlo en cuanto podamos usar otro tipo de tests.

Existen diversas librerías en todos los lenguajes para hacer tests de snapshot. [Approval tests](https://approvaltests.com/) nos proporciona varias, pero puedes encontrar alternativas fácilmente, aunque varía el grado de soporte. En este caso voy a probar [rspec-snapshot](https://github.com/levinmr/rspec-snapshot), de Mike Levin, que debería ser suficiente para nuestro propósito. Una vez instalada en el proyecto, el test queda así:

```ruby
# frozen_string_literal: true

require 'rspec'
require "rspec/snapshot"


require_relative '../lib/energy/consumption_analyzer'

RSpec.describe 'Consumer Analyzer' do
    context "Default behaviour" do
        it "should generate report" do
            a = ConsumptionAnalyzer.new
            result = capture_stdout {a.execute('sample.csv', 1.4)}
            expect(result).to match_snapshot('default_snapshot')
        end
    end
end

def capture_stdout
    original = $stdout
    foo = StringIO.new
    $stdout = foo
    yield
    $stdout.string
ensure
    $stdout = original
end
```

Se generará un archivo llamado `default_snapshot.snap`, que captura el output generado. Para controlar que todo está bien, introduzco un cambio tonto en el código, como es sumar una cantidad arbitraria a los consumos, y compruebo que el test falla.

```ruby
outlier = Outlier.new
outlier.office = row["office"]
outlier.consumption = consumption + 123123
outlier.deviation = (consumption - average) / standard_deviation
```

En este caso, nos basta con este test. Pero es habitual que tengamos que hacer test combinatorios. Los test combinatorios nos permiten _bombardear_ la unidad bajo test con cientos de ejemplos, combinando los parámetros que tenemos que pasarle. En ese sentido, la librería ApprovalTests, nos aporta una forma fácil de conseguirlo. [Puedes leer más sobre eso en este otro artículo](/approval_testing/).

Elimino ese cambio y ya estamos listas para empezar a trabajar.

### Cambio paralelo al rescate

De momento, vamos a seguir coleccionando los datos con el mismo criterio, pero con el código mejor organizado. Después, cambiaremos el criterio.

Para evitar que algo se rompa por el camino, vamos a usar una estrategia de cambio paralelo. Consiste en introducir código nuevo que no se usará hasta que tengamos la certeza de que funciona. En ese momento, dejamos de usar la forma antigua y pasamos a la nueva.

Mi primer paso va a ser coleccionar los consumos en un nuevo array. Lo que haré será guardarme todos los array `consumptions` que vaya generando.

```ruby
  def execute(file_name, deviation_factor = 1.4)

    data = obtain_readings(file_name)
    consumptions = []
    outliers = []
    offices = []
    data.each do |row|
      consumptions.append(row["consumption"])
      
      next if consumptions.size < CONSUMPTIONS_A_YEAR
      offices.append(consumptions)
      
      # Code removed for clarity
    end
    puts outliers
    puts "Data sample #{data.size} rows"
    puts "Found #{outliers.size} outliers"
    puts "Found #{outliers.size / 300} per office"
  end
```

Al final debería tener un array de offices con todos esos consumptions que he obtenido. Este cambio no debería afectar al test. 

Ahora, voy a introducir un nuevo bucle que recorra el array de `offices`, aunque sin hacer nada, por el momento. Esto debería permitirme mover el código marcado, separando la parte de agrupar los consumos por oficina, que es la que queremos llegar a corregir, de la parte de hacer el análisis.

```ruby
class ConsumptionAnalyzer
  CONSUMPTIONS_A_YEAR = 12

  def execute(file_name, deviation_factor = 1.4)

    data = obtain_readings(file_name)
    consumptions = []
    outliers = []
    offices = []
    data.each do |row|
      consumptions.append(row["consumption"])

      next if consumptions.size < CONSUMPTIONS_A_YEAR
      offices.append(consumptions)
      
      # Code to move 
      average = average(consumptions)
      standard_deviation = standard_deviation(consumptions)

      consumptions.each do |consumption|
        difference = (consumption - average).abs
        boundary = standard_deviation * deviation_factor

        next unless difference > boundary

        outlier = Outlier.new
        outlier.office = row["office"]
        outlier.consumption = consumption
        outlier.deviation = (consumption - average) / standard_deviation

        outliers.append(outlier)
      end
      # End of code to move

      consumptions = []
    end
    
    offices.each do | consumptions|
      
    end
    
    puts outliers
    puts "Data sample #{data.size} rows"
    puts "Found #{outliers.size} outliers"
    puts "Found #{outliers.size / 300} per office"
  end

  # Code removed for clarity
end
```

Tras cada uno de estos movimientos ejecuto el test para asegurarme de que no cambio el comportamiento.

Ahora muevo el código de un bucle a otro.

```ruby
class ConsumptionAnalyzer
  CONSUMPTIONS_A_YEAR = 12

  def execute(file_name, deviation_factor = 1.4)

    data = obtain_readings(file_name)
    consumptions = []
    outliers = []
    offices = []
    data.each do |row|
      consumptions.append(row["consumption"])

      next if consumptions.size < CONSUMPTIONS_A_YEAR
      offices.append(consumptions)
      
      consumptions = []
    end
    
    offices.each do | consumptions|
        # Code to move 
        average = average(consumptions)
        standard_deviation = standard_deviation(consumptions)

        consumptions.each do |consumption|
            difference = (consumption - average).abs
            boundary = standard_deviation * deviation_factor

            next unless difference > boundary

            outlier = Outlier.new
            outlier.office = row["office"]
            outlier.consumption = consumption
            outlier.deviation = (consumption - average) / standard_deviation

            outliers.append(outlier)
        end
        # End of code to move     
    end
    
    puts outliers
    puts "Data sample #{data.size} rows"
    puts "Found #{outliers.size} outliers"
    puts "Found #{outliers.size / 300} per office"
  end

  # Code removed for clarity
end
```

Tengo un problema. En esta línea hago referencia a una variable interna al bucle anterior. Necesito arreglar esto antes.

```ruby
outlier.office = row["office"]
```

Así que deshago el cambio para ver primero como dejar de depender de ese dato y poder mover el bloque.

Esta forma de proceder tiene un nombre: método mi-ka-do. Brevemente explicado, consiste en:

* Introducir un cambio que deseamos en nuestro código y ejecutarlo o ejecutar sus tests.
* Tomar nota del error que salga.
* Deshacer el cambio y asegurarnos de que todo vuelve a funcionar como antes.
* Modificar el código para prevenir que salga el error anterior, pero sin alterar el comportamiento actual.
* Introducir de nuevo el cambio que queríamos.
* Si todo va bien, hemos terminado.
* Si aparece otro error, deshacemos el cambio y volvemos a realizar el proceso.

Me doy cuenta de que podría solventar el problema si en vez de un array utilizo un hash o diccionario, guardando los identificadores de la oficina como claves. Luego solo tendría que cambiar el segundo bucle para que tenga en cuenta la clave.

```ruby
class ConsumptionAnalyzer
  CONSUMPTIONS_A_YEAR = 12

  def execute(file_name, deviation_factor = 1.4)

    data = obtain_readings(file_name)
    consumptions = []
    outliers = []
    offices = {}
    data.each do |row|
      consumptions.append(row["consumption"])

      next if consumptions.size < CONSUMPTIONS_A_YEAR

      office_id = row["office"]
      offices[office_id] = consumptions

      # Code to move 
      
      average = average(consumptions)
      standard_deviation = standard_deviation(consumptions)

      consumptions.each do |consumption|
        difference = (consumption - average).abs
        boundary = standard_deviation * deviation_factor

        next unless difference > boundary

        outlier = Outlier.new
        outlier.office = office_id
        outlier.consumption = consumption
        outlier.deviation = (consumption - average) / standard_deviation

        outliers.append(outlier)
      end
      
      # End of code to move     
      consumptions = []
    end
    
    offices.each do | office_id, consumptions|

    end
    
    puts outliers
    puts "Data sample #{data.size} rows"
    puts "Found #{outliers.size} outliers"
    puts "Found #{outliers.size / 300} per office"
  end

  # Code removed for clarity
end
```

Una vez hecha esta modificación, intentamos el cambio de nuevo. Pero falla. La intención del cambio es correcta, pero dado que limitamos los conjuntos de consumos a los de un año (12 consumos), los datos se van machacando y el resultado es incorrecto.

La clave del hash o diccionario tendría que contemplar esto, asi que la cambiamos para que nos proporcione la resolución necesaria:

```ruby
class ConsumptionAnalyzer


  CONSUMPTIONS_A_YEAR = 12

  def execute(file_name, deviation_factor = 1.4)

    data = obtain_readings(file_name)
    consumptions = []
    outliers = []
    offices = {}
    data.each do |row|
      consumptions.append(row["consumption"])

      next if consumptions.size < CONSUMPTIONS_A_YEAR

      office_id = "#{row["office"]}-#{row["year"]}"
      offices[office_id] = consumptions

      # Code to move 
      
      average = average(consumptions)
      standard_deviation = standard_deviation(consumptions)

      consumptions.each do |consumption|
        difference = (consumption - average).abs
        boundary = standard_deviation * deviation_factor

        next unless difference > boundary

        outlier = Outlier.new
        outlier.office = office_id.split('-')[0].to_i
        outlier.consumption = consumption
        outlier.deviation = (consumption - average) / standard_deviation

        outliers.append(outlier)
      end
      # End of code to move
      consumptions = []
    end
    
    offices.each do | office_id, consumptions|

    end
    
    puts outliers
    puts "Data sample #{data.size} rows"
    puts "Found #{outliers.size} outliers"
    puts "Found #{outliers.size / 300} per office"
  end
  # Code removed for clarity
end
```

Aquí se genera el id

```ruby
office_id = "#{row["office"]}-#{row["year"]}"
```

Y aquí se recupera el id "real" de la oficina 

```ruby
outlier.office = office_id.split('-')[0].to_i
```

Aplicamos el cambio y movemos el bloque al otro bucle. Esta vez, los tests pasan, confirmando que el cambio no altera el comportamiento actual. Y, además, durante el proceso hemos podido aprender algo sobre la solución de nuestro problema.

```ruby
class ConsumptionAnalyzer


  CONSUMPTIONS_A_YEAR = 12

  def execute(file_name, deviation_factor = 1.4)

    data = obtain_readings(file_name)
    consumptions = []
    outliers = []
    offices = {}
    data.each do |row|
      consumptions.append(row["consumption"])

      next if consumptions.size < CONSUMPTIONS_A_YEAR

      office_id = "#{row["office"]}-#{row["year"]}"
      offices[office_id] = consumptions
      
      consumptions = []
    end
    
    offices.each do | office_id, consumptions|
        # Code to move 

        average = average(consumptions)
        standard_deviation = standard_deviation(consumptions)

        consumptions.each do |consumption|
            difference = (consumption - average).abs
            boundary = standard_deviation * deviation_factor

            next unless difference > boundary

            outlier = Outlier.new
            outlier.office = office_id.split('-')[0].to_i
            outlier.consumption = consumption
            outlier.deviation = (consumption - average) / standard_deviation

            outliers.append(outlier)
        end
        # End of code to move
    end
    
    puts outliers
    puts "Data sample #{data.size} rows"
    puts "Found #{outliers.size} outliers"
    puts "Found #{outliers.size / 300} per office"
  end
  # Code removed for clarity
end
```

Ahora sería el momento adecuado de terminar este refactor con otro que nos ayude a limpiar un poco el código y separar los intereses de cada parte, aislando lo que queremos corregir. El paso lógico a continuación es separar las distintas fases del proceso en métodos con un nombre significativo. Ahora el método `execute` describe bastante mejor lo que hace, y tenemos separadas las distintas partes o fases del proceso. Esto suena a un refactor _Split phase_, que consiste básicamente en identificar y separar las fases de un proceso.

De hecho, parece que nos pide hacer algo con toda la zona de generar el _output_, aunque solo fuese por mantener la simetría.

```ruby
class ConsumptionAnalyzer
    def initialize

    end

    CONSUMPTIONS_A_YEAR = 12

    def execute(file_name, deviation_factor = 1.4)
        data = obtain_readings(file_name)
        offices = offices(data)
        outliers = outliers(deviation_factor, offices)
        puts outliers
        puts "Data sample #{data.size} rows"
        puts "Found #{outliers.size} outliers"
        puts "Found #{outliers.size / 300} per office"
    end

    def outliers(deviation_factor, offices)
        outliers = []
        offices.each do |office_id, consumptions|
            average = average(consumptions)
            standard_deviation = standard_deviation(consumptions)

            consumptions.each do |consumption|
                difference = (consumption - average).abs
                boundary = standard_deviation * deviation_factor

                next unless difference > boundary

                outlier = Outlier.new
                outlier.office = office_id.split('-')[0].to_i
                outlier.consumption = consumption
                outlier.deviation = (consumption - average) / standard_deviation

                outliers.append(outlier)
            end
        end
        outliers
    end

    def offices(data)
        offices = {}
        consumptions = []
        data.each do |row|
            consumptions.append(row["consumption"])

            next if consumptions.size < CONSUMPTIONS_A_YEAR

            office_id = "#{row["office"]}-#{row["year"]}"
            offices[office_id] = consumptions
            consumptions = []
        end
        offices
    end

    # Removed code for clarity
end
```

### Todavía nos queda un refactor

Pero debemos centrarnos en la tarea que veníamos a realizar: lo que queremos es recopilar los datos por oficinas. Por un lado, tenemos la ventaja de haber aislado esa fase del proceso. 

Pero, por otro, todavía arrastramos las consecuencias de que `data` es un objeto muy acoplado al tipo de archivo CSV que estamos usando como fuente de datos. La consecuencia es que el método `offices` está también acoplado a ese formato concreto de archivo. En realidad, `offices` siempre va a estar acoplado al tipo de datos que produzca `obtain_readings`, que es de donde viene `data`. A este tipo de acoplamiento se le llama _Connascence_ y hace referencia al grado en que dos componentes del sistema comparten un conocimiento que obligaría a uno de ellos a cambiar si el otro lo hace. 

El problema es que el tipo de dato (CSV::Table y CSV::Row) está definido por una dependencia externa a nuestro código (la librería CSV). Si el tipo de datos es definido por nosotras, ese acoplamiento es menos grave. Se trataría de un principio similar al de Inversión de Dependencias.

Sería preferible que `offices` recibiera los datos con una estructura diferente así que antes de empezar a cambiar su comportamiento, sería importante refactorizar para que `obtain_readings` produzca esa estructura y `offices` la consuma.

¿Cómo hacer este refactoring sin tener problemas? Creo que lo primero sería definir la estructura de datos básica que queremos obtener. Esta estructura puede basarse en la que tenemos en el archivo CSV, pero podría ser diferente si nos va mejor o pensamos que no necesitamos todos los datos. Si en el futuro añadimos otras fuentes de datos ya las adaptaremos.

```ruby
Consumption = Struct.new(:office, :year, :date, :consumption)
```

El segundo paso será normalizar los datos obtenidos del archivo CSV, recorriendo el array y generando uno nuevo con los datos convertidos. Para eso, introducimos un método con el que obtenemos un array con los datos de consumo normalizados a una estructura de datos definida por nosotras.

```ruby
def normalize(data)
    data.map do |row|
        Consumption.new(row["office"], row["year"], row["month"], row["consumption"])
    end
end
```

Aquí podrían plantearse cuestiones de performance, pero sería un momento prematuro para la optimización. Es mejor perder un poco ahora, conseguir un código mejor organizado y buscar luego las optimizaciones.

Finalmente, tendremos que pasarle los datos con la nueva estructura a `offices`, que es la parte interesada. Ya que este caso es bastante trivial podemos usar el método mi-ka-do: hacemos el cambio y si todo va bien, ya nos vale. En caso de ocurrir un error, deshacemos y lo volvemos a intentar. Y todo ha ido bien a la primera:

```ruby
class ConsumptionAnalyzer
    CONSUMPTIONS_A_YEAR = 12

    def execute(file_name, deviation_factor = 1.4)
        data = obtain_readings(file_name)
        normalized = normalize(data)
        offices = offices(normalized)
        outliers = outliers(deviation_factor, offices)
        
        puts outliers
        puts "Data sample #{data.size} rows"
        puts "Found #{outliers.size} outliers"
        puts "Found #{outliers.size / 300} per office"
    end

    def normalize(data)
        data.map do |row|
            Consumption.new(row["office"], row["year"], row["month"], row["consumption"])
        end
    end

    # Code removed for clarity

    def offices(data)
        offices = {}
        consumptions = []
        data.each do |row|
            consumptions.append(row.consumption)

            next if consumptions.size < CONSUMPTIONS_A_YEAR

            office_id = "#{row.office}-#{row.year}"
            offices[office_id] = consumptions
            consumptions = []
        end
        offices
    end

    # Code removed for clarity
end
```

### Por fin, introducir la funcionalidad nueva

Consolidamos el cambio con un nuevo commit y ahora es cuando podemos empezar a trabajar en los cambios que nos han pedido, que se pueden resumir en cambiar la forma en que recolectamos los datos de las oficinas, y no separarlas por años.

Esto nos va a plantear un par de problemas. Tenemos el test de caracterización, el cual habíamos decidido introducir para protegernos durante el refactor y no cambiar el comportamiento de forma accidental.

Ahora queremos lo contrario, o sea, cambiar el comportamiento. Es más que posible que el resultado del análisis sea diferente cuando hagamos los cambios, por lo que tendríamos que verificar que el cambio funciona bien de otra forma. Y el test tal como está actualmente ya no nos serviría. Por una parte, podríamos prescindir de él. Por otra, podemos dejarlo en espera hasta realizar el cambio de algoritmo y generar el snapshot del nuevo comportamiento. 

Pero para desarrollar este nuevo comportamiento, nos vendría bien hacer test unitarios que verifiquen que la selección de oficinas es correcta. Lo bueno, es que los refactors que hemos hecho nos han llevado a una situación en la que esto es posible, ya que hemos aislado ese proceso en un método de la clase cuyo input es fácil de manipular porque no es más que un array de objetos que hemos definido nosotras.

Hay un problemilla. Este método debería ser privado y, por tanto, no deberíamos testearlo directamente. Sin embargo, venimos de una situación mucho peor así que es preferible ignorar esto de momento, avanzar en la funcionalidad y ver si en el futuro podemos llegar a un mejor diseño.

Empecemos con los tests. Para empezar, voy a verificar que si solo tengo datos de una oficina, incluso de distintos años o meses, se agrupan todos.

```ruby
RSpec.describe ConsumptionAnalyzer do
    it "should aggregate same office data" do
        data = [
          Consumption.new(1, 2021, 1, 123456),
          Consumption.new(1, 2023, 1, 134143),
          Consumption.new(1, 2023, 2, 542543),
          Consumption.new(1, 2021, 2, 123454),
          Consumption.new(1, 2021, 3, 123345),
          Consumption.new(1, 2022, 5, 534542),
          Consumption.new(1, 2022, 6, 534542),
          Consumption.new(1, 2022, 7, 534542),
          Consumption.new(1, 2022, 8, 534542),
          Consumption.new(1, 2022, 9, 534542),
          Consumption.new(1, 2022, 10, 534542),
          Consumption.new(1, 2022, 11, 534542),
        ]

        analyzer = ConsumptionAnalyzer.new

        offices = analyzer.offices(data)

        expect(offices.size).to eq(1)
    end
end
```

Este test no sirve de mucho porque pasa tal cual con el código actual. Así que vamos a hacer un test que sí debería fallar. La opción más fácil es poner menos de 12 consumos. Ahora mismo, la recolección se hace literalmente por docenas, pero en la especificación de la tarea, nos debería haber quedado claro que se quiere permitir que el número de datos de cada oficina no tenga que coincidir con el número de meses del año.

Así que, si tenemos una muestra de 3 ó 4 ejemplos ya nos valdría para provocar el fallo del test. De hecho, con un solo ejemplo nos llegaría para empezar:

```ruby
RSpec.describe ConsumptionAnalyzer do
    it "should aggregate same office data" do
        data = [
          Consumption.new(1, 2021, 1, 123456),
        ]

        analyzer = ConsumptionAnalyzer.new

        offices = analyzer.offices(data)

        expect(offices.size).to eq(1)
    end
end
```

El test falla diciendo que no se ha recopilado nada en offices.

Hagamos un cambio un poco drástico:

```ruby
def offices(data)
    offices = {}
    consumptions = []
    data.each do |row|
        consumptions.append(row.consumption)
        office_id = "#{row.office}-#{row.year}"
        offices[office_id] = consumptions
        consumptions = []
    end
    offices
end
```

Con este cambio, el test pasará. Claro que ahora el resultado tiene pinta de que puede ser un poco caos. Pero vamos paso a paso.

Ahora que me fijo en el código, me interesa cambiar la clave `office_id`, que debería ser solo el número de oficina contenido en `Consumpion.office`. Hagamos otro test para verificarlo:

```ruby
RSpec.describe ConsumptionAnalyzer do
    it "should aggregate same office data" do
        data = [
          Consumption.new(1, 2021, 1, 123456),
        ]

        analyzer = ConsumptionAnalyzer.new
        offices = analyzer.offices(data)
        expect(offices.size).to eq(1)
    end

    it "should identify office by its number" do
        data = [
          Consumption.new(1, 2021, 1, 123456),
        ]

        analyzer = ConsumptionAnalyzer.new
        offices = analyzer.offices(data)
        expect(offices.key? "1").to be_truthy
    end
end
```

Y este es el cambio que necesitamos para que el test pase:

```ruby
def offices(data)
    offices = {}
    consumptions = []
    data.each do |row|
        consumptions.append(row.consumption)
        office_id = "#{row.office}"
        offices[office_id] = consumptions
        consumptions = []
    end
    offices
end
```

Vamos a ver ahora como discriminar entre oficinas. O si el sistema es capaz de discriminar entre ellas. Si tenemos datos de varias oficinas, deberíamos tener eso en el resultado, podemos empezar por tan solo dos. De paso, nos aseguramos de tener ambas claves.

```ruby
RSpec.describe ConsumptionAnalyzer do
    
    # Code removed for clarity
    
    it "should separate data from different offices" do
        data = [
          Consumption.new(1, 2021, 1, 123456),
          Consumption.new(2, 2022, 4, 154325),
        ]

        analyzer = ConsumptionAnalyzer.new
        offices = analyzer.offices(data)
        expect(offices.size).to eq(2)
        expect(offices.key? "1").to be_truthy
        expect(offices.key? "2").to be_truthy
    end
end
```

Ahora necesitaríamos saber que se añaden todas las lecturas de la misma oficina:

```ruby
RSpec.describe ConsumptionAnalyzer do

    # Code removed for clarity

    it "should aggregate all data of an office" do
        data = [
          Consumption.new(1, 2021, 1, 123456),
          Consumption.new(2, 2022, 4, 154325),
          Consumption.new(1, 2021, 3, 173412),
          Consumption.new(1, 2021, 7, 109324),
        ]

        analyzer = ConsumptionAnalyzer.new
        offices = analyzer.offices(data)
        expect(offices["1"].size).to eq(3)
        expect(offices["1"][0]).to be(123456)
        expect(offices["1"][1]).to be(173412)
        expect(offices["1"][2]).to be(109324)
    end
end
```

Este test no pasa. Nos dice que falla porque la oficina "1" solo tiene una entrada y nosotros esperamos 3.

Si estudiamos el código, vemos que el problema puede ser que estamos acumulando consumos en el array consumptions, que es vaciado cada vez en el bucle.

```ruby
def offices(data)
    offices = {}
    consumptions = []
    data.each do |row|
        consumptions.append(row.consumption)
        office_id = "#{row.office}"
        offices[office_id] = consumptions
        consumptions = []
    end
    offices
end
```

En su lugar, deberíamos coleccionar esos datos directamente.

```ruby
def offices(data)
    offices = {}
    data.each do |row|
        office_id = "#{row.office}"
        offices[office_id].append(row.consumption)
    end
    offices
end
```

Pero esto tiene otro problema:

```
     NoMethodError:
       undefined method `append' for nil:NilClass
```

Necesitamos inicializar un array si la clave no existe todavía en el hash de oficinas.

```ruby
def offices(data)
    offices = {}
    data.each do |row|
        office_id = "#{row.office}"
        if !offices.key? office_id
            offices[office_id] = []
        end
        offices[office_id].append(row.consumption)
    end
    offices
end
```

Y ahora el test pasa. En principio, con esto debería ser suficiente para tener lista la funcionalidad. Sin embargo, hay dos detalles que revisar.

El primero es que hay un cambio que podría afectar a la función `outliers`. Es otro caso de _connascence_: ambas funciones tienen que saber como se _forma_ una clave. Si lo cambiamos en una, tenemos que cambiarlo en la otra. Voy a hacer el cambio sin más, porque es trivial.

```ruby
outlier.office = office_id.split('-')[0].to_i
```

Pasaría a ser:

```ruby
outlier.office = office_id
```

Da la casualidad de que funciona igualmente sin cambios. Pero no deberíamos fiarnos de las casualidades y, menos aún, dejar código que puede llevar a confusión. 

El otro detalle es una preferencia personal: Ahora solo guardamos el valor del consumo, pero ¿por qué no guardar el objeto entero? Sería una idea interesante, pero implica un montón de cambios en `outliers`. Esta idea podría ser el objetivo de refactor posterior, pero puede que sea demasiado ambiciosa para este momento.

Nos queda regenerar el test de caracterización. Si lo tiramos vemos que da resultados distintos. Al acumular todas las medidas de cada oficina en una sola colección los índices estadísticos cambian y se detectan _outliers_ diferentes.

Aprovecho para hacer un pequeño cambio en el resumen:

```ruby
puts outliers
puts "Data sample #{data.size} rows"
puts "Found #{outliers.size} outliers"
puts "Found #{outliers.size / offices.size} per office"
```

El test de caracterización se puede regenerar simplemente borrando el snapshot existente. Al volver a ejecutar el test, se creará con los nuevos resultados.

```
Data sample 18000 rows
Found 3051 outliers
Found 10 per office
```

### Refactor posterior y entrega

Ahora podemos realizar arreglos que dejen el código en mejor estado.

En Ruby existe la estructura `unless`, que nos permite invertir ciertas condicionales y dejarlas más legibles:

```ruby
def offices(data)
    offices = {}
    data.each do |row|
        office_id = "#{row.office}"
        unless offices.key? office_id
            offices[office_id] = []
        end
        offices[office_id].append(row.consumption)
    end
    offices
end
```

O incluso usarlas como modificadores:

```ruby
def offices(data)
    offices = {}
    data.each do |row|
        office_id = "#{row.office}"
        offices[office_id] = [] unless offices.key? office_id
        offices[office_id].append(row.consumption)
    end
    offices
end
```

Los métodos `obtain_readings` y `normalize` están fuertemente acoplados. Tanto es así que sería mejor unificarlos:

```ruby
def obtain_readings(file_name)
    CSV.parse(File.read(file_name), headers: true, converters: :numeric)
end

def normalize(data)
    data.map do |row|
        Consumption.new(row["office"], row["year"], row["month"], row["consumption"])
    end
end
```

En principio, puede parecer que se podría simplemente encapsular ambas en un único método, pero resulta que usamos `data` un poco más abajo para reportar el tamaño de la muestra de datos:

```ruby
def execute(file_name, deviation_factor = 1.4)
    data = obtain_readings(file_name)
    normalized = normalize(data)
    offices = offices(normalized)
    outliers = outliers(deviation_factor, offices)

    puts outliers
    puts "Data sample #{data.size} rows"
    puts "Found #{outliers.size} outliers"
    puts "Found #{outliers.size / offices.size} per office"
end
```

Sin embargo, eso podría obtener de `normalized`, que tiene el mismo número de filas. Una vez arreglado eso, la extracción del método queda así:

```ruby
def execute(file_name, deviation_factor = 1.4)
    normalized = obtain_consumptions(file_name)
    offices = offices(normalized)
    outliers = outliers(deviation_factor, offices)

    puts outliers
    puts "Data sample #{normalized.size} rows"
    puts "Found #{outliers.size} outliers"
    puts "Found #{outliers.size / offices.size} per office"
end

def obtain_consumptions(file_name)
    data = obtain_readings(file_name)
    normalize(data)
end
```

Lo que ocurre es que tanto `obtain_readings` como `normalize` son métodos que tengo mayor interés en tener aislados. Así que pienso que sería una buena idea aplicar el refactoring _Inline function_ que, básicamente consiste en reemplazar una llamada a una función por el cuerpo de esa función. Justo lo contrario de _Extract function_:

```ruby
def obtain_consumptions(file_name)
    data = CSV.parse(File.read(file_name), headers: true, converters: :numeric)
    data.map do |row|
        Consumption.new(row["office"], row["year"], row["month"], row["consumption"])
    end
end
```

Esto nos facilitará dos cosas en el futuro: optimizar la lectura del archivo y dar soporte a otros tipos de archivos o proveedores de datos.

## Fin, por ahora

Aunque veo algunas posibilidades de refactoring más, voy a dejar el artículo en este punto. Mi objetivo era mostrar cómo se integra el refactoring en el trabajo del día a día, cuando estamos creando un producto o servicio basado en software y queremos priorizar la entrega de nuevas funcionalidades, pero también la mejora de la calidad del código y el testing.

Nos vendría bien empezar a estructurar el código en archivos, etc. Pero de momento, no hemos tenido esa necesidad.

Mi plan es hacer algunas entregas más en las que, basándonos en posibles peticiones de negocio para iterar el producto, seguiremos añadiendo funcionalidad y refactorizando para que hacerlo sea más fácil y seguro cada vez.

