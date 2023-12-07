---
layout: post
title: Refactoring para quienes no refactorizan 3
categories: articles
tags: good-practices ruby refactoring
---

En las entregas anteriores hemos mencionado varias veces la necesidad de mantener el tiempo de refactoring bajo control, evitando la tentación de llevarlo demasiado lejos.

Esta precaución es necesaria porque corremos el riesgo de dar al código una forma que no sea adecuada a su evolución futura. Esto es, aunque podamos tener unas expectativas razonables sobre la evolución de nuestro negocio, en realidad no sabemos que nos deparará el futuro. Tomar decisiones sobre la estructura del código que no estén apoyadas por una necesidad puede llevarnos a mayores costes cuando tengamos que desandar ese camino.

## Cuando un refactor llama a tu puerta

De todos modos, y teniendo esta advertencia en mente, muchas veces el propio código nos va a dar indicaciones de que necesita refactoring. Estas indicaciones suelen venir en forma de _code smells_, algunos de los cuales pueden gestionarse independientemente del significado del código. Más bien, esos smells apuntan a que la estructura de conocimiento está reflejada en el código, pero de una forma defectuosa.

Voy a intentar poner un ejemplo. Los siguientes métodos operan sobre un mismo objeto, el cual no es el objeto en el que están definidos.

```ruby
    def standard_deviation(consumptions)
        Math.sqrt(variance(consumptions))
    end

    def variance(consumptions)
        sum = consumptions.sum(0.0) { |element| (element - average(consumptions)) ** 2 }
        sum / (consumptions.size - 1)
    end

    def average(consumptions)
        consumptions.sum(0.0) / consumptions.size
    end
```

Dicho de otra forma. Los comportamientos representados por estos métodos en realidad pertenecen a un objeto consumptions que aún no tenemos, pero del cual el código nos está diciendo que, al menos, deberíamos considerar su existencia.

Este consumptions es actualmente un array que agrega los consumos de una oficina. O, en general, representa una colección de consumos que nos interesa para hacer un análisis. Tratarlo como un array es propio de un enfoque procedural de la programación, pero en orientación a objetos, consumption debería ser un objeto con sus propios comportamientos. En este caso: agregar los consumos y proporcionarnos ciertos índices estadísticos que nos interesan y que se obtienen a partir de sus datos.

La señal que nos indica que hay una posibilidad de refactoring es bastante visible:

* Hay un grupo de métodos de un objeto que no llaman a otros métodos del propio objeto, excepto a los que forman parte del mismo grupo. Por ejemplo, `standard_deviation` usa `variance`, el cual usa `average`, pero no usan otros métodos del objeto.
* Esos métodos tienen un parámetro en común, que es sobre el que trabajan. Todos trabajan sobre` consumptions`.

Ahora bien, si nos fijamos, `consumptions` solo guarda las lecturas de consumo. En el artículo anterior mencionamos que podría ser interesante guardar todo el objeto `Consumption`. En primer lugar, porque es un objeto y así mantenemos su integridad. En segundo lugar, nos aporta más información que podría llegar a ser útil en algún momento.

¿A dónde quiero llegar? Si hago este refactor ahora mismo, encapsulando el array `consumptions` en un objeto estoy tomando decisiones que pueden condicionar el desarrollo futuro del software. Ahora me parece muy claro que podría encapsular `consumptions` y beneficiarme de sus comportamientos. Pero ¿y si en el futuro lo que necesito es tener los objetos `Consumption`?

Suele ser preferible esperar a tener más contexto antes de proceder a un refactor, incluso aunque sea muy evidente. Por ejemplo, que tengamos una tarea que toca esa área.

## Una fuente de datos alternativa

Ahora que hemos cambiado la forma de agregar los datos por oficina, nos dicen que algunas oficinas podrían obtener la información en formato JSON. Hay que tener en cuenta que a partir de ahora se nos proporcionarán varios archivos con los datos, pero en los distintos formatos. De hecho, es perfectamente posible que sean varias decenas de archivos si cada oficina nos enviase uno diferente.

Así que tenemos que hacer estos cambios: 

* Poder procesar varios archivos
* Agrupar toda la información
* Tener un procesador extra para Json
* Elegir el procesador según el archivo

Los dos últimos puntos encajan con un patrón _Strategy_: necesitamos poder escoger entre varios algoritmos en tiempo de ejecución (un lector de CSV y un lector de JSON). Para ello, tenemos que disponer de esos distintos algoritmos y un mecanismo que sepa cuál escoger en cada caso.

La cuestión ahora es hacer un refactoring del código actual hasta introducir este patrón para una sola estrategia, que es la que tenemos ahora. Comprobamos que todo el comportamiento actual se mantiene y una vez consolidados los cambios, introducimos la estrategia para otros formatos de archivo. Y, como veremos, este último paso esta vez será muy sencillo y tendrá poco riesgo.

¿Por qué proceder así? La idea de no mezclar las fases de refactoring e introducción de nuevas features busca reducir el riesgo de mezclar regresiones en el comportamiento actual y la introducción de nuevos bugs. 

El refactor preparatorio estaría protegido por los tests existentes, de modo que si provocamos una regresión la detectaremos y podremos corregirla, deshaciendo el cambio que la provocó o haciendo las modificaciones necesarias. Por otro lado, una vez consolidado el refactor, la introducción de código nuevo puede ser asegurada mediante TDD o, si no, con test posteriores. De este modo, las fuentes de posibles errores se mantienen separadas y son fáciles de identificar y corregir.

### Extrayendo un objeto colaborador

Así que vamos a empezar. En OOP preferimos objetos pequeños con responsabilidades bien definidas que trabajan colaborando. En el ejemplo que tenemos, tendría sentido un objeto encargado de leer los datos de los archivos. Ahora mismo, eso ocurre en el método:

```ruby
def obtain_consumptions(file_name)
    data = CSV.parse(File.read(file_name), headers: true, converters: :numeric)
    data.map do |row|
        Consumption.new(row["office"], row["year"], row["month"], row["consumption"])
    end
end
```

Fíjate que en el cuerpo del método no tenemos llamadas a otros métodos del objeto `ConsumptionAnalyser` lo que nos indicaría que tiene sentido extraerlo. Este refactor se llama `Extract class` y consiste básicamente en crear una clase nueva a la que se mueven los métodos deseados y usándolo donde la necesitemos.

Algunos IDE ofrecen una automatización de este refactor dependiendo del lenguaje. Pero esencialmente se hace asé:

* Creamos la nueva clase
* Copiamos y pegamos en ella los métodos escogidos
* Adaptamos lo que sea necesario
* Reemplazamos los métodos originales con llamadas a esta clase

La nueva clase se llamará CSVConsumptionsProvider.

```ruby
class CsvConsumptionsProvider
    
end
```

Ahora, copiamos y pegamos el método `obtain_consumptions`:

```ruby
class CsvConsumptionsProvider
    def obtain_consumptions(file_name)
        data = CSV.parse(File.read(file_name), headers: true, converters: :numeric)
        data.map do |row|
            Consumption.new(row["office"], row["year"], row["month"], row["consumption"])
        end
    end
end
```

Puede ser el momento de revisar el nombre del método y realizar otros ajustes que veamos necesarios. Por ejemplo:

```ruby
class CsvConsumptionsProvider
    def from_file(file_name)
        data = CSV.parse(File.read(file_name), headers: true, converters: :numeric)
        data.map do |row|
            Consumption.new(row["office"], row["year"], row["month"], row["consumption"])
        end
    end
end
```

El último paso será introducir este objeto como colaborador de `ConsumptionAnalyzer`. Antes de eso, nos aseguramos de que los tests están pasando.

```ruby
class ConsumptionAnalyzer
    def initialize(provider = CsvConsumptionsProvider.new)
        @provider = provider
    end

    CONSUMPTIONS_A_YEAR = 12

    def execute(file_name, deviation_factor = 1.4)
        normalized = @provider.from_file(file_name)
        offices = offices(normalized)
        outliers = outliers(deviation_factor, offices)

        puts outliers
        puts "Data sample #{normalized.size} rows"
        puts "Found #{outliers.size} outliers"
        puts "Found #{outliers.size / offices.size} per office"
    end

    # Code removed for clarity
    
end
```

Este cambio debería permitir que los tests pasen sin problema.

En este ejemplo, estamos haciendo que `provider` sea opcional, creando una instancia por defecto. En otros lenguajes, podemos hacer algo similar a lo que sigue:

```ruby
def initialize(provider = nil)
    if provider.nil?
        @provider = CsvConsumptionsProvider.new
    else
        @provider = provider
    end
end
```

### Preparándose para el patrón Strategy

Extraer funcionalidad a objetos colaboradores es una buena forma de darle estructura al código. Pero nuestro analizador todavía depende que la fuente de datos sea CSV.

Como no queremos depender directamente de una tecnología o formato específico, necesitamos introducir un _Mediador_. Un _Mediador_ es un objeto que se introduce para romper la dependencia directa entre dos objetos. De este modo, uno puede evolucionar sin saber nada del otro. Ambos quedarán acoplados al mediador, pero es una dependencia más ligera.

Nuestro mediador representa la idea abstracta de un proveedor de consumos.

```ruby
class ConsumptionProvider
    def from_file(file_name)
    end
end
```

Y en su primera implementación, simplemente hace uso del `CSVConsumptionProvider`.

```ruby
class ConsumptionsProvider
    def initialize(provider = CsvConsumptionsProvider.new)
        @provider = provider
    end
    def from_file(file_name)
        @provider.from_file(file_name)
    end
end
```

Por supuesto, tenemos que cambiar la dependencia en `ConsumptionAnalyzer`:

```ruby
class ConsumptionAnalyzer
    def initialize(provider = ConsumptionsProvider.new)
        @provider = provider
    end
    
    # Code removed for clarity
end
```

Todos estos cambios no alteran el comportamiento y los tests siguen pasando. Estamos casi terminando el refactor. El beneficio que hemos conseguido es que ahora, `ConsumptionAnalyzer` no tiene ni idea de que está leyendo datos de un archivo CSV, no hay ninguna referencia que haga pensar en ello.

### Csv como Strategy

El siguiente paso sucede en `ConsumptionsProvider` y consiste en dejar de usar incondicionalmente `CsvConsumptionsProvider`. De momento, sabemos que el criterio para escoger un Provider concreto es el tipo de archivo, que podemos determinar por la extensión de su nombre. Eso es lo que vamos a introducir ahora:

```ruby
class ConsumptionsProvider
    def initialize(provider = CsvConsumptionsProvider.new)
        @provider = provider
    end
    def from_file(file_name)
        extension = File.extname(file_name)
        if extension == ".csv"
            return @provider.from_file(file_name)
        end
        raise NotImplementedError.new , "#{extension} file support not implemented"
    end
end
```

Esto puede parecer innecesario en este punto, ya que solo tenemos un tipo de proveedor. Sin embargo, creo que se puede entender por donde vamos. Este refactor nos ha dejado en una situación en la que introducir otro proveedor simplemente requeriría escribir una clase nueva y modificar la condición para que el programa lo reconozca.

Vamos a arreglar un poquito el código dado que sigue muy condicionado por tener una sola estrategia. Por ejemplo, así:

```ruby
class ConsumptionsProvider
    def initialize

    end
    def from_file(file_name)
        extension = File.extname(file_name)
        if extension == ".csv"
            provider = CsvConsumptionsProvider.new
            return provider.from_file(file_name)
        end
        raise NotImplementedError.new , "#{extension} file support not implemented"
    end
end
```

Esto nos permitirá crear un nuevo `JsonConsumptionsProvider`, por ejemplo, e incluirlo así:

```ruby
class ConsumptionsProvider
    def initialize

    end
    def from_file(file_name)
        extension = File.extname(file_name)
        if extension == ".csv"
            provider = CsvConsumptionsProvider.new
            return provider.from_file(file_name)
        end
        if extension == ".json"
            provider = JsonConsumptionsProvider.new
            return provider.from_file(file_name)
        end
        raise NotImplementedError.new , "#{extension} file support not implemented"
    end
end
```

Pero no nos adelantemos. Primero necesitamos tener un proveedor y antes de eso hay que prepararse para otro comportamiento.

### Agregar todos los resultados

Uno de los requisitos que nos piden es agregar todos los resultados, lo que significa que nos pasarán una lista de archivos de los que obtener datos y debemos proporcionar una salida única.

Así que tenemos que dar soporte a poder indicar varios archivos en `ConsumptionAnalyzer.execute` y en `ConsumptionsProvider.from_file`. Además, en este último, tenemos que obtener los datos y agregarlos antes de entregarlos.

Vamos por partes. Una forma fácil de permitir varios archivos en `ConsumptionsProvider.from_file` es cambiar el parámetro `file_name` con splat operator. De ese modo, podemos pasarle una lista de nombres de archivo y se comportará como un array.

Para eso, nos viene bien extraer el procesamiento de cada archivo individual en un método. Es decir. Ahora estamos así:

```ruby
class ConsumptionsProvider
    def initialize

    end
    def from_file(file_name)
        extension = File.extname(file_name)
        if extension == ".csv"
            provider = CsvConsumptionsProvider.new
            return provider.from_file(file_name)
        end
        raise NotImplementedError.new , "#{extension} file support not implemented"
    end
end
```

Y nos preparamos haciendo esto:

```ruby
class ConsumptionsProvider
    def initialize

    end
    def from_file(file_name)
        read_file(file_name)
    end

    def read_file(file_name)
        extension = File.extname(file_name)
        if extension == ".csv"
            provider = CsvConsumptionsProvider.new
            return provider.from_file(file_name)
        end
        raise NotImplementedError.new, "#{extension} file support not implemented"
    end
end
```

Este cambio, que es un _Extract method_, no afecta al comportamiento actual. Ahora vamos con `from_file`.

```ruby
class ConsumptionsProvider

    def from_file(*file_names)
        data = []
        file_names.each do |file_name|
            data = read_file(file_name)
        end
        data
    end

    # Code removed for clarity
end
```

Ahora, `from_file` acepta cualquier número de parámetros y los empaqueta como un array. Sencillamente, recorremos el array de nombres de archivo y vamos leyendo cada uno. Este cambio es temporal, porque aún no hemos cambiado el Analizador para dar soporte a múltiples archivos.

En este ejemplo de código hemos asumido que solo se va a pasar un archivo, pero lo más adecuado sería hacer lo siguiente: Añadir cada conjunto de datos que leemos al array que vamos a devolver.

```ruby
class ConsumptionsProvider
    def from_file(*file_names)
        data = []
        file_names.each do |file_name|
            data.push(*read_file(file_name))
        end
        data
    end

    # Code removed for clarity
end
```

Cambiar el método `execute` de `ConsumptionAnalyzer` va a ser un poco más complicado. En este caso, el operador _splat_ requiere que cambiemos la signatura del método, puesto que este operador solo puede usarse en el último parámetro. Por esa razón, tendríamos que invertir el orden de los parámetros.

En lenguajes como Ruby este refactor puede no estar automatizado, debido a su naturaleza dinámica. En Java, nos bastaría con hacer sobrecarga del método, añadiendo otra signatura. En otros lenguajes, con el refactor automatizado no hay mucho de qué preocuparse.

Sin embargo, podemos hacer el refactor paso a paso. Dependiendo de los usos que tengamos actualmente del método puede ser más o menos complicado. De hecho, puede haber diferentes formas de hacerlo.

Lo primero que hacemos es verificar los usos que tenemos ahora. Básicamente son dos. En ambos casos pasamos los dos parámetros, incluyendo deviation_factor que es opcional. Podríamos eliminar la opcionalidad, ya que no estamos haciendo uso de ella.

```ruby
def execute(file_name, deviation_factor)
    # Code removed for clarity
end
```

Lo siguiente sería introducir un parámetro extra a través del cual podamos pasar los nombres de archivo. El operador `splat` hace que el parámetro actual como si fuese opcional, permitiéndonos no pasar nada en su lugar. De este modo, se respeta el uso que estamos haciendo actualmente.

```ruby
def execute(file_name, deviation_factor, *files)
    # Code removed for clarity
end
```

A continuación, voy a hacer un cambio temporal que nos prepare el camino para dejar de usar el primer parámetro. En caso de que no pasemos nada en `files`, se usa lo que venga en `file_name` y se pasa como un array deconstruido. 

```ruby
def execute(file_name, deviation_factor, *files)
    files.append(file_name) if files.size == 0
    normalized = @provider.from_file(*files)

    # Code removed for clarity
end
```

Ahora podríamos ir sustituyendo los usos de este método para que pasen los nombres de archivo por `files`, en lugar de por `file_name`. En nuestro ejemplo son dos usos, por lo que es algo que podemos hacer de inmediato. Gracias al último cambio, sabemos que estamos usando los archivos pasados a través de `files`.

```ruby
a = ConsumptionAnalyzer.new
a.execute('../sample.csv', deviation, '../sample.csv')
```

El otro uso es el test:

```ruby
RSpec.describe 'Consumer Analyzer' do
    context "Default behaviour" do
        it "should generate report" do
            a = ConsumptionAnalyzer.new
            result = capture_stdout {a.execute('sample.csv', 1.4, 'sample.csv')}
            expect(result).to match_snapshot('default_snapshot')
        end
    end
end
```

Finalmente, una vez comprobado que todo funciona correctamente, eliminamos el uso del parámetro `file_name`.

```ruby
a = ConsumptionAnalyzer.new
a.execute(deviation, '../sample.csv')
```
```ruby
RSpec.describe 'Consumer Analyzer' do
    context "Default behaviour" do
        it "should generate report" do
            a = ConsumptionAnalyzer.new
            result = capture_stdout {a.execute(1.4, 'sample.csv')}
            expect(result).to match_snapshot('default_snapshot')
        end
    end
end
```
```ruby
    def execute(deviation_factor, *files)
        normalized = @provider.from_file(*files)

        # Code removed for clarity
    end
```

Ten en cuenta que todos estos pasos los hemos dado sin que en ningún momento los tests dejasen de funcionar. En un ejemplo tan pequeño como este, podríamos haberlo completado sin tanta ceremonia, pero en un proyecto medianamente grande, proceder paso a paso te garantiza que el refactor sea seguro, dando pequeños pasos que no tienen efectos negativos.

### Crear una nueva estrategia

Para esta serie de artículos preparé un generador de datos aleatorios que ahora tendré que modificar para que guarde los archivos en json. Con esto, puedo generar un ejemplo sencillo. Me da igual el contenido porque solo necesito que se puedan leer los datos.

```ruby
[
  {
    "office": 1,
    "year": 2023,
    "month": 1,
    "consumption": 8379097
  },
  {
    "office": 1,
    "year": 2023,
    "month": 2,
    "consumption": 9539936
  },
  {
    "office": 1,
    "year": 2023,
    "month": 3,
    "consumption": 2025802
  },
  {
    "office": 1,
    "year": 2023,
    "month": 4,
    "consumption": 1398801
  },
  {
    "office": 1,
    "year": 2023,
    "month": 5,
    "consumption": 6572861
  },
  {
    "office": 1,
    "year": 2023,
    "month": 6,
    "consumption": 7942753
  },
  {
    "office": 1,
    "year": 2023,
    "month": 7,
    "consumption": 2569213
  },
  {
    "office": 1,
    "year": 2023,
    "month": 8,
    "consumption": 4575579
  },
  {
    "office": 1,
    "year": 2023,
    "month": 9,
    "consumption": 5742751
  },
  {
    "office": 1,
    "year": 2023,
    "month": 10,
    "consumption": 6769903
  },
  {
    "office": 1,
    "year": 2023,
    "month": 11,
    "consumption": 6564423
  },
  {
    "office": 1,
    "year": 2023,
    "month": 12,
    "consumption": 2062790
  }
]
```

Para crear este provider, haré un test leyendo de este archivo que se llama `example.json`. Lo más correcto sería utilizar una librería como [FakeFS](https://github.com/fakefs/fakefs), que nos permite trabajar en un sistema de archivos virtual, o aplicar alguna otra idea que nos evitase tener que tocar el sistema de archivos. Pero puesto que añade una complejidad que va más allá de los objetivos de estos artículos, prefiero usar el método más sencillo.

En principio sería un poco absurdo testear esto a base de conseguir leer el archivo, obtener el output en forma de array de `Consumption` y verificar que cada uno de los objetos se ha creado bien. Así que básicamente, lo que quiero es comprobar que se leen todos los registros del archivo y que se pueblan correctamente.

Este debería servir para probar el primer punto.

```ruby
RSpec.describe JsonConsumptionProvider do
    it "should read all records in file" do
        provider = JsonConsumptionProvider.new
        consumptions = provider.from_file("example.json")
        expect(consumptions.size).to eq(12)
    end
end
```

Hagamos una implementación fake, solo para probar que el test funciona:

```ruby
class JsonConsumptionProvider
    def from_file(filename)
        Array.new(12, Consumption.new)
    end
end
```

Ahora que tenemos una línea base de comportamiento, vamos introduciendo cambios. Primero queremos leer los datos del archivo. Si podemos abrir el archivo en modo de lectura, ya tenemos un paso.

```ruby
class JsonConsumptionProvider
    def from_file(filename)
        f = File.new(filename, "r")
        Array.new(12, Consumption.new)
    end
end
```

Ahora, obtengamos los datos. Hasta aquí todo parece funcionar y data debería contener un array de hashes:

```ruby
class JsonConsumptionProvider
    def from_file(filename)
        f = File.new(filename, "r")
        raw = f.read
        data = JSON.parse(raw)
        f.close
        Array.new(12, Consumption.new)
    end
end
```

Vamos a ver si son 12:

```ruby
class JsonConsumptionProvider
    def from_file(filename)
        f = File.new(filename, "r")
        raw = f.read
        data = JSON.parse(raw)
        f.close
        Array.new(data.size, Consumption.new)
    end
end
```

Resulta que sí. La primera parte parece conseguida. Nuestro provider es capaz de leer datos del archivo y, aparentemente, logra leer los 12 registros. Introducimos tests para ver si los lee correctamente:

```ruby
RSpec.describe JsonConsumptionProvider do
    it "should read all records in file" do
        provider = JsonConsumptionProvider.new
        consumptions = provider.from_file("example.json")
        expect(consumptions.size).to eq(12)
    end

    it "should read data in first record" do
        provider = JsonConsumptionProvider.new
        consumptions = provider.from_file("example.json")
        expected = Consumption.new
        expected.office = 1
        expected.year = 2023
        expected.month = 1
        expected.consumption = 8379097

        expect(consumptions[0]).to eq(expected)
    end
end
```

Como es de esperar, este test no va a pasar. Los datos los hemos copiado del archivo, porque el comportamiento que esperamos es que se generen los objetos `Consumption` con esos mismos datos.

Lo hacemos pasar con este código:

```ruby
class JsonConsumptionProvider
    def from_file(filename)
        f = File.new(filename, "r")
        raw = f.read
        data = JSON.parse(raw)
        f.close

        consumptions = []

        data.each do |h|
            c = Consumption.new
            c.office = h["office"]
            c.year = h["year"]
            c.month = h["month"]
            c.consumption = h["consumption"]
            consumptions.append(c)
        end
        consumptions
    end
end
```

Este código es lo bastante general como para convertir correctamente todos los registros leídos. Podemos introducir otro test, pero no va a aportarnos información nueva:

```ruby
RSpec.describe JsonConsumptionProvider do
    it "should read all records in file" do
        provider = JsonConsumptionProvider.new
        consumptions = provider.from_file("example.json")
        expect(consumptions.size).to eq(12)
    end

    it "should read data in first record" do
        provider = JsonConsumptionProvider.new
        consumptions = provider.from_file("example.json")
        expected = Consumption.new
        expected.office = 1
        expected.year = 2023
        expected.month = 1
        expected.consumption = 8379097

        expect(consumptions[0]).to eq(expected)
    end

    it "should read data in last record" do
        provider = JsonConsumptionProvider.new
        consumptions = provider.from_file("example.json")
        expected = Consumption.new
        expected.office = 1
        expected.year = 2023
        expected.month = 12
        expected.consumption = 2062790

        expect(consumptions[11]).to eq(expected)
    end
end
```

Con esto, ya tenemos un nuevo proveedor. Y sabemos que funciona correctamente.

### Juntarlo todo

Ya casi estamos listas para unir todas las piezas. Todo el trabajo que nos quedaría lo podemos hacer aquí:

```ruby
class ConsumptionsProvider
    # Code removed for clarity

    def read_file(file_name)
        extension = File.extname(file_name)
        if extension == ".csv"
            provider = CsvConsumptionsProvider.new
            return provider.from_file(file_name)
        end
        raise NotImplementedError.new, "#{extension} file support not implemented"
    end
end
```

A primera vista, una opción posible es reproducir la estructura if para introducir el proveedor JSON.

```ruby
def read_file(file_name)
    extension = File.extname(file_name)
    if extension == ".csv"
        provider = CsvConsumptionsProvider.new
        return provider.from_file(file_name)
    end
    if extension == ".json"
        provider = JsonConsumptionsProvider.new
        return provider.from_file(file_name)
    end
    raise NotImplementedError.new, "#{extension} file support not implemented"
end
```

Esto debería funcionar. De hecho, el snapshot test original sigue pasando. Lo adecuado sería introducir un nuevo test para verificar que todo funciona. En este caso, generaría un nuevo archivo de ejemplo en formato json.

Este es el nuevo test, donde se puede ver como paso los dos nombres de archivo con el diferente formato de datos. Por cierto, que me ha servido para corregir algunos errores de nombres por todo el código.

```ruby
RSpec.describe 'Consumer Analyzer' do
    # Code removed for clarity

    context "Two sources" do
        it "should generate mixed report" do
            a = ConsumptionAnalyzer.new
            result = capture_stdout {a.execute( 1.4, 'sample.csv', 'sample_2.json')}
            expect(result).to match_snapshot('two_sources')
        end
    end
end
```

Dado que sabemos que el proveedor de Json lee correctamente los datos, por el test unitario, y que el análisis también funciona correctamente, por el primer test de _snapshot_, podemos confiar en que el comportamiento es correcto y este test nos vale.

Ya hemos desarrollado la funcionalidad deseada y, si te das cuenta, hemos pasado más trabajo refactorizando que implementando las nuevas capacidades. Podrías pensar que es un desperdicio pero ten en cuenta que:

* El refactor nos ha garantizado que añadir la nueva funcionalidad no iba a perjudicar el comportamiento existente
* El trabajo de crear el nuevo proveedor de datos ha sido muy sencillo
* En el futuro, será igualmente sencillo añadir soporte para nuevos formatos de archivo

Pero es que incluso puede ser más sencillo si hacemos un poco de refactor a posteriori.

### Rematando el trabajo con otro refactoring

Echemos un vistazo:

```ruby
class ConsumptionsProvider
    def initialize

    end
    def from_file(*file_names)
        data = []
        file_names.each do |file_name|
            data.push(*read_file(file_name))
        end
        data
    end

    def read_file(file_name)
        extension = File.extname(file_name)
        if extension == ".csv"
            provider = CsvConsumptionsProvider.new
            return provider.from_file(file_name)
        end
        if extension == ".json"
            provider = JsonConsumptionsProvider.new
            return provider.from_file(file_name)
        end
        raise NotImplementedError.new, "#{extension} file support not implemented"
    end
end
```

Si quisiera añadir soporte para un nuevo tipo de archivo, por ejemplo, un XML, tengo que crear una clase `Provider` y modificar `ConsumptionsProvider`. Cierto que esta modificación está bastante controlada, pero imagina no tener que tocarla para nada. Veamos otra forma de organizar este código.

Empecemos por hacer un cambio en la forma en que tratamos el provider.

```ruby
def read_file(file_name)
    extension = File.extname(file_name)
    provider = nil
    if extension == ".csv"
        provider = CsvConsumptionsProvider.new
        return provider.from_file(file_name)
    end
    if extension == ".json"
        provider = JsonConsumptionsProvider.new
        return provider.from_file(file_name)
    end
    if provider.nil?
        raise NotImplementedError.new, "#{extension} file support not implemented"
    end
end
```

Ahora, podemos mover el return, que es igual en todas las ramas fuera de la estructura condicional.

```ruby
def read_file(file_name)
    extension = File.extname(file_name)
    provider = nil
    if extension == ".csv"
        provider = CsvConsumptionsProvider.new
    end
    if extension == ".json"
        provider = JsonConsumptionsProvider.new
    end
    if provider.nil?
        raise NotImplementedError.new, "#{extension} file support not implemented"
    end
    provider.from_file(file_name)
end
```

Al fin y al cabo, el método `read_file` hace dos cosas:

* Decidir qué proveedor utilizar.
* Ejecutar el proveedor.

Así que separemos ambas responsabilidades.

```ruby
def read_file(file_name)
    provider = select_provider(file_name)
    provider.from_file(file_name)
end

def select_provider(file_name)
    extension = File.extname(file_name)
    provider = nil
    if extension == ".csv"
        provider = CsvConsumptionsProvider.new
    end
    if extension == ".json"
        provider = JsonConsumptionsProvider.new
    end
    if provider.nil?
        raise NotImplementedError.new, "#{extension} file support not implemented"
    end
    provider
end
```

El método `select_provider` es básicamente una factoría, la cual podríamos extraer a otro objeto. Ya hemos visto el refactor _Extract class_, por lo que te voy a mostrar el resultado:

```ruby
class ProviderFactory
    def make_provider(file_name)
        extension = File.extname(file_name)
        provider = nil
        if extension == ".csv"
            provider = CsvConsumptionsProvider.new
        end
        if extension == ".json"
            provider = JsonConsumptionsProvider.new
        end
        if provider.nil?
            raise NotImplementedError.new, "#{extension} file support not implemented"
        end
        provider
    end
end
```

Y aquí su uso:

```ruby
class ConsumptionsProvider
    def initialize(factory = ProviderFactory.new)
        @factory = factory
    end
    def from_file(*file_names)
        data = []
        file_names.each do |file_name|
            data.push(*read_file(file_name))
        end
        data
    end

    def read_file(file_name)
        provider = select_provider(file_name)
        provider.from_file(file_name)
    end

    def select_provider(file_name)
        @factory.make_provider(file_name)
    end
end
```

Los objetos factoría están, por decirlo así, en las fronteras del dominio, así que la vida allí es un poco más salvaje. Por ejemplo, es más tolerable modificar la factoría que modificar `ConsumptionsProvider`.

Podemos replantear un poco el código de `ProviderFactory`:

```ruby
class ProviderFactory
    def initialize
        @providers = {
          ".csv": CsvConsumptionsProvider.new,
          ".json": JsonConsumptionsProvider.new,
        }
    end

    def make_provider(file_name)
        extension = File.extname(file_name).to_sym
        unless @providers.key? extension
            raise NotImplementedError.new, "#{extension} file support not implemented"
        end
        @providers[extension]
    end
end
```

Este cambio mantiene el mismo comportamiento del programa y simplifica enormemente su mantenimiento, ya que basta con añadir una entrada al diccionario de `@providers`.

Una posible mejora sería añadir un método `register(extension, provider)`, que nos permitiría añadir nuevos proveedores sin tocar esta clase, manteniendo, o no, el soporte por defecto a los actuales `.json` y `.csv`. O un poco de meta-programación para añadirlos automáticamente.

```ruby
class ProviderFactory
    def initialize
        @providers = {
          ".csv": CsvConsumptionsProvider.new,
          ".json": JsonConsumptionsProvider.new,
        }
    end
    
    def register(extension, provider)
        @providers[extension] = provider
    end

    def make_provider(file_name)
        extension = File.extname(file_name).to_sym
        unless @providers.key? extension
            raise NotImplementedError.new, "#{extension} file support not implemented"
        end
        @providers[extension]
    end
end
```

Se podría utilizar así:

```ruby
factory = ProviderFactory.new
factory.register(".csv", CsvConsumptionsProvider.new)
factory.register(".json", JsonConsumptionsProvider.new)

provider = ConsumptionsProvider.new(factory)

a = ConsumptionAnalyzer.new(provider)
a.execute(deviation, '../sample.csv')
```

Para resumir, con este refactor dejamos todo preparado para que en el futuro, añadir un nuevo tipo de fuente de datos requiera solo añadir código.

## Conclusiones

Al principio del artículo señalábamos una línea de refactor que resultó irrelevante para la feature que nos habían pedido desarrollar. Empezar a trabajar en esa línea hubiera supuesto una pérdida de tiempo, sin aportar valor.

La tentación de refactorizar un código que sabemos que no está muy bien diseñado es muy fuerte. Sin embargo, en equipos de trabajo orientados a producto, el foco debe estar puesto en las mejoras y corrección de errores.

Por tanto, el refactor debería estar supeditado a estas necesidades. No solo para priorizar la entrega de valor, sino para que el refactor contribuya a ella de manera efectiva.

Un refactor aplicado sin contexto puede llevarnos por un camino indeseable, que haga más cara la entrega de valor porque hemos aplicado criterios a ese refactor que no se han visto confirmados por la evolución del negocio.

Por su parte, son los cambios en nuestro conocimiento del negocio los que deberían guiar el refactor. Si el conocimiento que adquirimos nos apunta en una dirección, el refactor debería seguirla.

Por otro lado, las acciones de refactor pueden suponer una buena parte del tiempo de desarrollo, pero asumiendo que tenemos el código protegido por tests, debería ser un tiempo de trabajo seguro que nos facilite introducir la nueva funcionalidad.

El refactor a posteriori, por su parte, es una inversión para el futuro, ya que puede ahorrarnos tiempo cuando tengamos que tocar de nuevo en esa área.

[Puedes ver el código de ejemplo en este repositorio](https://github.com/franiglesias/ruby-dojo).
