---
layout: post
title: Automatizando el contenedor de dependencias de Symfony con tags y CompilerPass
categories: articles
tags: tips
---

No es frecuente que escriba este tipo de artículos, pero seguro que me viene bien para el futuro.

En el proyecto en que estoy trabajando últimamente necesito que un servicio se inicialice con un conjunto de objetos. Se trata de un mapeador para traducir eventos entre distintos buses y al construirlo se le pasa una serie de mapeadores específicos. Esta lista de mapeadores se incrementa cada vez que introducimos un nuevo evento que debe ser traducido.

Esto se puede definir fácilmente a mano en el contenedor de inyección de dependencias de Symfony, añadiendo el nuevo mapeador cuando hace falta entre los argumentos de la definición del servicio. Igualmente, es propenso a errores, pues es fácil olvidar que tienes que registrarlo.

Por resumir: el problema es:

* Tenemos un servicio que necesita que se le pase una colección de servicios colaboradores, los cuales suelen ser del mismo tipo (misma interfaz).
* Esta colección puede cambiar a lo largo de la historia del proyecto, añadiendo o eliminando servicios colaboradores.

Este tipo de situaciones es común y es preferible automatizarla. Las ventajas son obvias:

* No necesitas tocar archivos de configuración.
* No te olvidas, el sistema lo hace por ti.
* Tampoco te olvidas si alguna vez eliminas alguno de esos componentes, ya que tendrías que quitarlo de la configuración.
* Mola mucho.

Pues bien, para hacerlo necesitamos básicamente dos cosas:

* Etiquetas para marcar los servicios colaboradores (tags).
* Añadir un pase del compilador para recopilarlos y pasarlos a nuestro servicio principal.

Vamos por partes.

## Etiquetar los servicios colaboradores

Probablemente has visto definiciones de servicios en el `services.yaml` de Symfony que contienen etiquetas. Las etiquetas permiten al contenedor de inyección de dependencias coleccionar los servicios etiquetados para poder hacer algo con ellos en conjunto. Por ejemplo, pasárselos a otro servicio que los necesita.

Ahora bien, definir y etiquetar servicios puede ser bastante tedioso. Sin embargo, es posible automatizar esto mediante una configuración en `services.yaml`. La condición es que todos esos servicios implementen la misma interfaz.

Solo tienes que incluir este código en el archivo de configuración, asociando el FQCN de la interfaz con la etiqueta que quieres usar.

```yaml
services:
  #...
    _instanceof:
        App\Namespace\To\CollaboratorInterface:
            tags: [your.tag.here]
```

De este modo, el contenedor podrá proporcionarte un array con todos los servicios que implementen la interfaz `App\Namespace\To\CollaboratorInterface`.

¿Y esto dónde es útil? Pues en un pase del compilador.

## Una pasada de compilador

Ahora que tenemos los colaboradores agrupados tenemos que entregárselos a nuestro servicio principal, que llamaremos `MainService`.

Para este ejemplo, vamos a suponer que tiene un método `addCollaborator`, cuyo nombre debería darte una pista sobre qué hace: simplemente pasa un colaborador al servicio principal para registrarlo y que pueda usarse.

Una CompilerPass se define implementando la interfaz `CompilerPassInterface`, que básicamente nos obliga a implementar un método `process` que recibe un `ContainerBuilder`. 

Aquí tienes un ejemplo, que explicaré a continuación.

```php
final class CollaboratorCompilerPass implements CompilerPassInterface
{
    /**
     * {@inheritDoc}
     */
    public function process(ContainerBuilder $container): void
    {
        if (!$container->has(MainService::class)) {
            return;
        }

        $definition = $container->getDefinition($this->actualServiceId($container));

        $taggedServices = $container->findTaggedServiceIds('your.tag.here');

        foreach ($taggedServices as $id => $tags) {
            $definition->addMethodCall('addCollaborator', [new Reference($id)]);
        }
    }

    private function actualServiceId(ContainerBuilder $container): string
    {
        if ($container->hasAlias(MainService::class)) {
            $alias = $container->getAlias(MainService::class);

            return (string) $alias;
        }

        return MainService::class;
    }
}
```

Vamos a verlo en detalle:

```php
        if (!$container->has(MainService::class)) {
            return;
        }
```

Es una guarda para evitar hacer el pase si el servicio principal ni siquiera está definido. De este modo, incluso aunque lo eliminases no se rompería nada.

```php
        $definition = $container->getDefinition($this->actualServiceId($container));
```

Aquí obtenemos la definición de `MainService`. Normalmente lo haríamos así:

```php
        $definition = $container->getDefinition(MainService::class);
```

Pero puede haber un problema. En ocasiones tenemos un alias del servicio. Esto es frecuente cuando definimos una interfaz para representar el servicio, pero luego tenemos una o más implementaciones concretas. En esa situación nos encontraríamos con el siguiente problema: el contenedor sabe que tenemos un servicio `MainService`, pero no es capaz de encontrar su definición porque la que existe es la del alias.

Así que para este caso concreto he introducido un método `actualServiceId` cuya función es averiguar cuál es el nombre de servicio que debe buscar:

```php
    private function actualServiceId(ContainerBuilder $container): string
    {
        if ($container->hasAlias(MainService::class)) {
            $alias = $container->getAlias(MainService::class);

            return (string) $alias;
        }

        return MainService::class;
    }
```

Como puedes ver, simplemente busca si existe un alias del servicio y en caso positivo esa es la definición sobre la que queremos operar.

Los siguientes pasos son bastante claros:

```php
        $taggedServices = $container->findTaggedServiceIds('your.tag.here');
```

Aquí obtenemos todos los servicios que tengan la etiqueta 'your.tag.here'. Esta etiqueta la podemos haber asignado manualmente o de forma automática, como hemos visto en el apartado anterior.

Ahora solo tenemos que recorrer la lista y pasar cada una de ellas al servicio principal, añadiendo una llamada al método `addCollaborator` y pasándole la referencia al servicio.

```php
        foreach ($taggedServices as $id => $tags) {
            $definition->addMethodCall('addCollaborator', [new Reference($id)]);
        }
```

Y ya casi está.

## Añadir al Kernel

Lo último que tenemos que hacer es añadir la `CompilerPass` que hemos creado en `Kernel.php`. Solo tienes que sobreescribir el método `build` si es que no existe ya (no hace falta que llames al parent, ya que está vacío):

```php
    protected function build(ContainerBuilder $container): void
    {
        $container->addCompilerPass(new CollaboratorCompilerPass());
    }
```

Con todo esto, tu servicio se construirá con sus servicios colaboradores de forma automática. 
