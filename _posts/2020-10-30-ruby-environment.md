---
layout: post
title: Entorno de desarrollo sencillo para Ruby
categories: articles
tags: ruby
---

Hace un tiempo que estoy estudiando algo de Ruby y estoy tratando de encontrar o preparar un entorno de desarrollo sencillo para practicar.

Creo que ya lo habrás notado porque en algunas entradas anteriores he estado poniendo ejemplos en Ruby. La verdad es que en un lenguaje muy agradable con el que trabajar y tengo la impresión de que es especialmente interesante para mejorar en el área de orientación a objetos.

En ese sentido, tengo que recomendar muy insistentemente el libro de Sandi Metz, [Practical Object-Oriented Design](https://www.amazon.es/dp/0134456475/ref=cm_sw_em_r_mt_dp_xD-LFbGC7Z45Q?_encoding=UTF8&psc=1), no solo si tienes interés en Ruby, sino como un gran manual de programación orientada a objetos desde un modelo de tipado dinámico.

## Cómo es Ruby

Ruby es un lenguaje orientado a objetos, diseñado para ser agradable y natural. 

Creo que lo consigue bastante bien y, en cualquier caso, viniendo de trabajar habitualmente con PHP, tratando de mantener una cierta disciplina de tipado estricto y paradigmas de OOP estilo Java, es un cambio que se agradece.

Entre otras características, y comparando sobre todo con PHP:

En Ruby todo es un objeto, incluso los tipos primitivos. Así que puedes escribir cosas como estas.

```ruby
3.times do
   "Hello, world!"
end
```

Todos los objetos del lenguaje son modificables. Puedes añadir métodos a la clase `Numeric`, si crees que tiene sentido para tu aplicación. Por ejemplo, añadimos el método `divisible_by?` para ver si un número se puede dividir por otro. El nombre terminado en ? es una convención para indicar que la respuesta es boolean.

```ruby
class Numeric
  def divisible_by?(divisor)
    (self % divisor).zero?
  end
end

if 15.divisible_by? 3
  '15 divisible by 3'
end
```

Otra característica llamativa son los [bloques](https://www.rubyguides.com/2016/02/ruby-procs-and-lambdas/#Understanding_Ruby_Blocks), que podemos entender como funciones anónimas o closures. En el primer ejemplo de arriba tenemos un bloque.

```ruby
3.times do
   "Hello, world!"
end
```

Un bloque puede esperar parámetros. En este ejemplo examinamos los divisores de 20 y los vamos añadiendo en un array:

```ruby
    response = []
    20.times do |number|
      if number > 0 and 20.divisible_by? number
        response.push"20 is divisible by #{number}"
      end
    end
    response
```

Existen algunas construcciones realmente interesantes, por ejemplo, el `if` del ejemplo anterior podría escribirse así:

```ruby
response.push "20 is divisible by #{number}" if number > 0 and 20.divisible_by? number
```

Es decir, "añade la línea al array si se cumple la condición".

También existe la condicional `unless`, cuando quieres que algo se haga excepto si se cumple la condición. Por ejemplo, esta línea asigna un pasajero a un coche excepto si no se ha definido todavía la propiedad `@car`. Por cierto, `@` indica que la variable `car` es una propiedad de la clase en la que se define.

```ruby
@car.allocate passenger unless car.nil?
```

Esto es interesante porque es una forma bastante común al expresarse en lenguaje natural (*haz esto si pasa eso otro*, o *añade esto a menos que pase tal cosa*) a la vez que resulta conciso y evita introducir un nivel de indentación en el código.

Por cierto, las propiedades son privadas por defecto en Ruby y tienes que declarar métodos para acceder a ellas, cosa que puedes hacer de forma explícita o declarando *attribute accesors*. Aquí, por ejemplo, se declara una clase `Group`, con las propiedades `@id` y `@people` a las cuales queremos poder acceder mediante los métodos `id` y `people`, respectivamente.

```ruby
class Group
  attr_reader :id, :people

  def initialize(id, people)
    @id = id
    @people = people
  end
end
```

Esta característica nos ayuda a forzar el *information hiding* propio de OOP, pues nos obliga a pensar a qué propiedades necesitaríamos exponer y de qué forma, promoviendo el uso de métodos semánticos, por un lado, y evitándonos escribir *accesors* explícitos. 

Ruby usa herencia simple, al igual que PHP, pero también incorpora la idea de *mixin* a través de módulos, lo que permite añadir comportamiento a un objeto simplemente incluyendo el módulo deseado. En PHP tendríamos los traits, así como en otros lenguajes existe un concepto semejante.

Ah, y además Ruby también es un lenguaje multi-hilo.

## Entorno dockerizado

Preparar un entorno dockerizado para trabajar con Ruby no debería ser particularmente difícil, aunque como ocurre con otros lenguajes, da la impresión de que no es un *set up* tan generalizado como en PHP. Por una parte, la gestión de la instalación del lenguaje, sus versiones y dependencias, es relativamente sencilla en comparación con PHP.

Aparte de eso, trabajar en Ruby suele estar muy ligado a su framework *Ruby on Rails*, así que la mayor parte de información que encuentras se refiere a éste. Tanto es así, que frecuentemente se identifica al lenguaje con el framework. Sin embargo, hay otras formas de desarrollar con Ruby y no estoy especialmente interesado en Rails por el momento.

Así, ante mi posible interés de escribir algún tipo de aplicación web prefiero un framework más específico como es [Sinatra](http://sinatrarb.com/documentation.html), con el que puedo tener un MVC suficientemente potente para aplicaciones web tradicionales o exponer una API. Sinatra instala el servidor web Rack, lo que cubre este apartado también y de una forma sencilla.

En cualquier caso, usar Rails o Sinatra o cualquier otra dependencia es algo que se gestiona mediante la instalación de Gemas (o paquetes), de modo que realmente lo único que necesitamos es preparar un `Dockerfile` bastante minimalista basado en una imagen específica de Ruby. 

### Puntos de partida

Para empezar a crear este entorno he partido de los siguientes artículos.

* [How to painlessly set up your Ruby on Rails dev environment with Docker](https://www.freecodecamp.org/news/painless-rails-development-environment-setup-with-docker/)
* [How To Install And Get Started With Sinatra On Your System Or VPS](https://www.digitalocean.com/community/tutorials/how-to-install-and-get-started-with-sinatra-on-your-system-or-vps)

La idea es montar una entorno que me sirva de base tanto para proyecto web como utilidades de línea de comando y, en general, para explorar ideas y también para escribir ejemplos para los artículos del blog o libros.

No es recomendable usar la versión `latest`, o no especificar ninguna, porque podrías encontrarte con conflictos. Esto no impide actualizar, pero te ayuda a hacerlo de manera coherente y evitando problemas inesperados.

En este sentido, son útiles [estas recomendaciones de Florin Lipan](https://lipanski.com/posts/dockerfile-ruby-best-practices).

Y aquí tenemos una primera aproximación a un **Dockerfile** bastante funcional. He añadido algo de documentación para explicar cada uno de los pasos.

```docker
# We use an official ruby image based on alpine as starting point.

FROM ruby:2.7.2-alpine

# Set or change some environment variables in order to make it easy configure docker to particular use cases
# Apply https://bundler.io/guides/bundler_docker_guide.html

ENV PORT=3000 \
    APP_DIR="/home/app" \
    GEM_HOME="/usr/local/bundle" \
    PATH=$GEM_HOME/bin:$GEM_HOME/gems/bin:$PATH \
    USERNAME="rubycon"

# Install system dependencies needed to build and install gems

RUN apk add nodejs && apk add --virtual build-dependencies build-base gcc wget git
RUN gem install bundler

# Set the app directory and expose desired port

WORKDIR $APP_DIR
EXPOSE $PORT

# Create a user in the container and ensure that it is the owner of files

RUN adduser -D $USERNAME && chown -R $USERNAME $GEM_HOME

# Copy project files to the container ensuring that user will be the owner

COPY --chown=$USERNAME . $APP_DIR/

# Set the created user as current user in container

USER $USERNAME

# Execute this script when the container is up, and jump into the shell

ENTRYPOINT [ "./entrypoint.sh", "/bin/sh" ]
```

El **docker-compose.yml** quedaría inicialmente así:

```yaml
version: "3.7"

services:
  rubycon:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: rubycon
    ports:
      - "3000:3000"
    volumes:
      - ./:/home/app
```

*(super original el nombre del proyecto, ¿eh?)*

Y al que le añadimos el siguiente **entrypoint.sh**:

```sh
#!/bin/sh

# Use this script to run anything you need in the container

# Apply https://bundler.io/guides/bundler_docker_guide.html

unset BUNDLE_PATH
unset BUNDLE_BIN

# This is be kind and ensure that docker container is up and runnig
echo 'Welcome to Ruby!'

# Init a ruby project with bundler if no Gemfile
if [ ! -f Gemfile ]; then
    bundle init
fi

# Install project dependencies
bundle install

# Execute the extra commands passed in the ENTRYPOINT step of the dockerfile
exec "$@"
```

### Uso

Para construir la imagen, levantar el contenedor y entrar al shell, todo de una sola vez, podemos usar:

```sh
docker-compose run --service-ports rubycon
```

Es decir: este comando monta nuestra imagen, levanta el contenedor exponiendo el puerto 3000 y ejecuta el shell. De este modo, podemos empezar a trabajar dentro del entorno virtual.

Si no hay un archivo Gemfile se creará uno mediante `bundle init` y, en todos los casos, se actualizará la instalación.

Esta configuración es útil como punto de partida para un proyecto, pero puede necesitar modificaciones si quieres tener un entorno de desarrollo web, ya sea con Rails o con otro framework. Por ejemplo, para arrancar automáticamente el servidor y este tipo de detalles.

### Añadir dependencias a un proyecto

Esta plantilla no instala nada más que `bundler`. Si queremos instalar una determinada dependencia para el proyecto:

```sh
bundle add gem-name
```

Por ejemplo, para una aplicación web, podríamos querer usar Sinatra:

```sh
bundle add sinatra sinatra-contrib rack
```

## Repositorio

He puesto un [repositorio público](https://github.com/franiglesias/rubycon) que puedes utilizar como plantilla. Si tienes ideas para mejorarlo serán muy bienvenidas.



