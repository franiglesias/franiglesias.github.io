---
layout: post
title: De ddd a DDD paso a paso 2. Del repositorio al dominio.
categories: articles
tags: good-practices design-principles ddd
---

Un caso particular de conocimiento del dominio que suele estar fuera de sitio es el de los repositorios que lo implementan en Infraestructura. En este artículo veremos cómo poner cada cosa en su lugar.

## Mover reglas de negocio de los repositorios a dominio

Cuando un repositorio tiene un método que selecciona una colección de entidades o agregados es muy posible que estemos violando la separación de capas, ejerciendo reglas de negocio en una implementación de infraestructura. 

Posiblemente los repositorios sean uno de los componentes de la aplicación peor entendidos y por los que más fácilmente se rompe con DDD.

Vistos desde el dominio, los repositorios son colecciones en memoria de entidades o agregados. Sin embargo, en la práctica y con muchísima frecuencia usamos los repositorios como medio de acceso a la base de datos, cosa que no es correcta en DDD.

¿Y para que usamos estos accesos? Pues, aparte de obtener colecciones de entidades o de agregados, es habitual que los usemos para obtener agregaciones (no en el sentido de agregados de dominio, sino de resumen de datos, estadísticos básicos, etc.) y proyecciones de los datos almacenados, bien para proporcionar información a servicios, bien para mostrarlas en algún tipo de vista, entendiendo ésta en un sentido amplio: una parte de la interfaz gráfica, para un *report*, resultado para un *endpoint* de una API, etc. Este segundo tipo de uso no es propio de los repositorios y lo trataremos en otro lugar.

En DDD los repositorios se usan para:

* Persistir entidades o agregados
* Recuperar entidades o agregados conocida su identidad
* Recuperar colecciones de entidades que cumplan alguna condición

Para trabajar con un repositorio, que por definición se debe comportar como un almacén en memoria, no podemos presuponer que hay un sistema de base de datos detrás al que podemos interrogar en un lenguaje propio, como SQL, sino que necesitamos alguna abstracción que nos permita definir reglas de dominio, aunque luego las implementemos de la forma que corresponde al mecanismo de persistencia.

Para guardar o recuperar Entidades concretas no necesitamos mucha parafernalia.

Por su parte, los criterios para seleccionar entidades suelen representar reglas de negocio como, por ejemplo, podrían ser recibos impagados, alumnos que promocionan, tareas pendientes de ser evaluadas, y un largo etcétera. Son condiciones de negocio que implementamos examinando las entidades para ver si las cumplen.

Eric Evans propone el patrón [Specification](https://martinfowler.com/apsupp/spec.pdf) para encapsular las condiciones mediante las que se escogen loa agregados. También lo [hemos tratado anteriormente](/patron-specification-del-dominio-a-la-infraestructura-1/), aunque seguramente ese artículo necesite una revisión después de tanto tiempo.

La idea de **Specification** es separar los criterios de las selección del objeto que hace la selección:

> A valuable approach to these problems is to separate the statement of what kind of objects can be selected from the object that does the selection.

De este modo, una **Specification** encapsula las condiciones que debe cumplir un objeto para ser seleccionado. En la capa de Dominio el resultado de una **Specification** es un `boolean`: o bien el objeto cumple los criterios o bien no los cumple. La interfaz suele ser esta:

```php
interface StudentSpecification
{
    public function isSatisfiedBy(Object $candidate): bool;
}
```

Una implementación podría ser (muy simplificado todo, para que sea más claro):

```php
class IsEnrolledInPotionsClass implements StudentSpecification
{
    public function isSatisfiedBy(Student $candidate): bool
    {
        return $candidate->isEnrolledInClass('potions-class-id');
    }
}
```

Otra implementación posible es parametrizada:

```php
class IsEnrolledInClass implements StudentSpecification
{
    private ClassId $classId;
    
    public function __construct(ClassId $classId)
    {
        $this->classId = $classId;
    }
    
    public function isSatisfiedBy(Student $candidate): bool
    {
        return $candidate->isEnrolledInClass($this->classId);
    }
}
```

Para no complicar el ejemplo he puesto una condición sencilla, pero podría ser una combinación de condiciones. Incluso es fácil crear *Composite Specifications* que nos permitan combinar condiciones sencillas mediante operaciones lógicas (AND, OR, NOT), pero ahora no entraré en ese detalle.

El problema del patrón **Specification** es que tiene dos caras porque en la práctica tiene que resolver dos problemas distintos:

* **En la capa de dominio** una **Specification** puede usarse tanto para recorrer una colección de Entidades y filtrar aquellas que la satisfacen, como para validaciones o comprobaciones de todo tipo.

```php
    //...
    $isEnrolledInClass = new IsEnrolledInClass($classId);
    
    if (! $isEnrolledInClass->isSatisfiedBy($student)) {
        throw new StudentNotInClassException($student);
    }
```

```php
    //...
    $isEnrolledInClass = new IsEnrolledInClass($classId);
    
    $studentsCollection->filterBy($isEnrolledInclass);
```


* **En la capa de infraestructura**, sin embargo, es habitual que necesitemos que la Specification se traduzca a una cláusula WHERE o equivalente para la solución de persistencia específica. Esto es debido a que es inviable cargar en memoria todas las entidades o agregados para filtrarlos. Es mucho más eficiente hacer una query que devuelta los datos necesarios.

En el *Blue Book* Evans discute un par de soluciones:

En la más sencilla de ellas, la *Specification* contendría un método capaz de devolver la SQL que el repositorio debería usar para obtener los datos deseados. Algo más o menos como esto (en una implementación real, podríamos devolver un objeto Query de Doctrine DBAL o cualquier otra implementación que sea adecuada):

```php
class IsEnrolledInClass implements StudentSpecification
{
    private ClassId $classId;
    
    public function __construct(ClassId $classId)
    {
        $this->classId = $classId;
    }
    
    public function isSatisfiedBy(Student $candidate): bool
    {
        return $candidate->isEnrolledInClass($this->classId);
    }
    
    public function asSql(): string
    {
        return 'SELECT * 
        FROM students s 
        LEFT JOIN students_classses sc ON sc.student_id = s.id 
        WHERE sc.class_id = {$this->classId}';
    }
}
```

Esta *Specification* podría utilizarse así en el Repositorio (el ejemplo es una especie de pseudocódigo, no es una implementación real, pero debería darte la idea):

```php
class SQLStudentRepository implements StudentRepository
{
    // ...
    public function findSatisfying(StudentSpecification $specification)
    {
        $sql = $specification->asSql();
        
        $result = $this->execSql($sql);
        
        return $this->mapResultToAggregates($result);
    }
}
```

El inconveniente principal es que estamos introduciendo detalles de implementación en la capa de dominio. La *query* depende la implementación concreta del sistema de base de datos, que típicamente puede ser un RDBMS como Postgre o Mysql (lo que supone la posibilidad de que tengamos que lidiar con dialectos concretos de SQL), pero que puede ser cualquier paradigma de persistencia.

Para evitar eso, hay varias posibilidades.

Una de ellas es que la implementación del repositorio se encargue de mantener las distintas *queries* que sean necesarias, utilizando un **Double dispatch** para que sea la **Specification** la que controle cómo se usa. Es algo más o menos como sigue:

El repositorio contiene métodos para obtener los resultados deseados (aquí obvio todo el tema de mapeado y construcción de entidades para facilitar la comprensión):

```php
class SQLStudentRepository implements StudentRepository
{
    // ...
    public function findSatisfying(StudentSpecification $specification)
    {       
        return $specification->findSatisfyingFrom($this);
    }
    
    public function findStudentsInClass(ClassId $classId): string
    {
        $sql = $this->findStudentsInClassSQL();
        
        $result = $this->execSql($sql);
        
        return $this->mapResultToAggregates($result);
    }
    
    private function findStudentsInClassSQL(ClassId $classId): string
    {
        return 'SELECT * 
        FROM students s 
        LEFT JOIN students_classses sc ON sc.student_id = s.id 
        WHERE sc.class_id = {$this->classId}';
    }
}
```

Ahora es la **Specification** la que dice qué método del repositorio utilizar para obtener los datos:

```php
class IsEnrolledInClass implements StudentSpecification
{
    private ClassId $classId;
    
    public function __construct(ClassId $classId)
    {
        $this->classId = $classId;
    }
    
    public function isSatisfiedBy(Student $candidate): bool
    {
        return $candidate->isEnrolledInClass($this->classId);
    }
    
    public function selectSatisfyingFrom(StudentRepository $repository): StudentCollection
    {
        return $repository->findStudentsInClass($this->classId);
    }
}
```

Esto implica que los métodos como `findStudentsInClass` son públicos y están en la interface de `StudentRepository`, pero normalmente los usaremos siempre a través de la **Specification**.

El hecho de tener un método en el repositorio por **Specification** es el principal inconveniente de esta solución. Pero podríamos ir más lejos y aplicar a las **Specification** el **principio de inversión de dependencias** y tener implementaciones específicas de la interfaz en dominio.

Usando el mismo ejemplo, sería algo así:

```php
interface StudentSpecification
{
    public function isSatisfiedBy(Object $candidate): bool;
    
    public function selectSatisfying(): string;
}
```

Implementamos la interfaz para tener una clase abstracta que proporcione la funcionalidad de `isSatisfiedBy` al dominio:

```php
abstract IsEnrolledInClass implments StudentSpecification
{
    private ClassId $classId;
    
    public function __construct(ClassId $classId)
    {
        $this->classId = $classId;
    }
    
    public function isSatisfiedBy(Student $candidate): bool
    {
        return $candidate->isEnrolledInClass($this->classId);
    }
    
    abstract public function selectSatisfying(): string;
}
```

Las implementaciones concretas dependen del sistema de persistencia e implementarían sólo el método `selectSatisfying`:

```php
class SQLIsEnrolledInClass extends IsEnrolledInClass
{
    public function selectSatisfying(): string
    {
        return 'SELECT * 
        FROM students s 
        LEFT JOIN students_classses sc ON sc.student_id = s.id 
        WHERE sc.class_id = {$this->classId}';
    }
}
```

Para ser usada con el repositorio así:

```php
class SQLStudentRepository implements StudentRepository
{
    // ...
    public function findSatisfying(Specification $specification)
    {   
        $sql = $specification->selectSatisfying();
        
        $result = $this->execSql($sql);
        
        return $this->mapResultToAggregates($result);
    }
}
```

El resultado es que tenemos implementaciones específicas para el sistema de persistencia residiendo en la capa de infrastructura, con una abstracción de la regla en dominio.

## Como gestionar proyecciones de bases de datos

¿Qué quiere decir esto? Intentemos verlo con algún ejemplo.

Nuestra aplicación de gestión escolar ofrece la posibilidad de obtener listas de grupos de clases. La más sencilla de ellas muestra simplemente el nombre de la estudiante y su número de identificación en el grupo. Algo así:

```
1. Chang, Cho
2. Granger, Hermione
3. Lovegood, Luna
4. Malfoy, Draco
5. Potter, Harry
6. Weasley, Ronald
```

Usar un repositorio para extraer una colección de agregados `Student` parece un poco excesivo y poco práctico. Sería mucho más eficiente una *query* directa al sistema de persistencia que nos traiga directamente los datos necesarios.

¿Qué entendemos por proyección si no estamos hablando de *Event Sourcing*? En *Event Sourcing* hablamos de **proyección** al referirnos a instantáneas del estado del sistema en un momento dado y generadas para una necesidad determinada.

En nuestro caso, podríamos utilizar una variante de este concepto para referirnos a extracciones del estado del sistema que satisfacen una necesidad específica, como las que podría tener una API, una vista de la UI o un report.

Otra forma de referirse a un concepto similar son los *Read Models*. *Read Model* es un concepto de **CQRS** que se refiere a los objetos responsables de la lectura de datos del sistema de persistencia. Igualmente, los *Read Models* son específicos para las peticiones concretas que se realicen.

Ambos conceptos nos permiten resolver un tema que en DDD nunca queda del todo claro: ¿cómo generamos simples listados o reports sin tener que montar decenas de entidades o agregados? No hay muchas aplicaciones que no requieran en algún momento presentar algún tipo de vista (de nuevo, en sentido genérico, no sólo UI, sino también API y similares) en forma de lista con unas pocas propiedades de un agregado.

Aquí entraría este concepto de **proyección** o **read model** cuya característica principal es que nos proporciona colecciones de DTOs creados específicamente para la petición que recibe el sistema y que no necesita pasar por la capa de dominio realmente. Esto es así porque se trata más bien de necesidades de la aplicación que no afectan al estado del dominio ya que sólo son lecturas, ni implican realmente reglas del dominio, pues su manipulación se basa normalmente en la aplicación de simples filtros para afinar la selección de información. Con todo, nos ayudan a proporcionar acceso a los consumidores a los agregados individuales en los que estén interesados o la posibilidad de seleccionarlos para operar con ellos.

Tomando nuestro ejemplo de la lista, una posible implementación sería:

El DTO:

```php
class ClassListStudent
{
    public int $number;
    public string $listName;
}
```

Una posibilidad es considerar el servicio que obtiene los datos como un `ReadRepository` (repositorio de lecturas), pero hay que tener en cuenta que:

* No devuelve entidades o agregados por lo que no es un repositorio en el sentido en que lo consideraríamos en dominio
* Por tanto, **no tiene que implementar** la interfaz de un repositorio

Así que para dejarlo más claro, creo que prefiero optar por considerarlo como un servicio de aplicación y, en todo caso, definir su interfaz para invertir la dependencia con infraestructura:

```php
interface GetClassList
{
    public function forClass(ClassId $classId): array;    
}
```

Y esta sería una implementación muy simple:

```php
class SQLGetClassList implements GetClassList
{
    private Connection $connection;
    
    public function __construct(Connection $connection)
    {
        $this->connection = $connection;
    }
    public function forClass(ClassId $classId): array
    {
        $sql =  'SELECT s.number, s.last_name, s.first_name
        FROM students s 
        LEFT JOIN students_classses sc ON sc.student_id = s.id 
        WHERE sc.class_id = {$classId}';
        
        $result = $this->connection->executeSQL($sql);
        
        $list = array_map(static function ($row) {
            $listRow = new ClassListStudent();
            $listRow->number = $row['number'];
            $listRow->listName = $row['last_name'].' '.$row['first_name']
        }, $result);
        
        return $list;
    }
}
```
