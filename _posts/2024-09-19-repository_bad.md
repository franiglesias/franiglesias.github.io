---
layout: post
title: A donde vamos, no necesitamos repositorios
subtitle: Patrones de diseño
categories: articles
tags: software-design design-patterns pulpoCon
---

La aplicación ciega de metodologías, principios de diseño o patrones, puede llevarnos a generar más problemas que soluciones. Tomemos por ejemplo, el patrón repositorio.

## El patrón repositorio

El concepto de repositorio en Domain Driven Design hace referencia al lugar donde el dominio puede persistir y recuperar entidades o agregados.

Este repositorio, por definición, se comporta como una colección en memoria en el que podemos guardar una entidad y reclamarla más adelante gracias a que conocemos su identidad.

En un mundo perfecto, el repositorio tiene disponibilidad inmediata, capacidad de almacenamiento infinita y persistencia infinita. Para simular eso necesitamos una base de datos física, pues no existe la memoria ilimitada ni eterna.

El patrón repositorio se implementa como [Dependencia Configurable](/configurable_dependency/). Se modela como una abstracción en el dominio en forma de interfaz y se implementan adaptadores que usan las tecnologías específicas.

```typescript
interface OrdersRepository {}
```

Ahora bien, desde el punto de vista del dominio el Repositorio se comporta como una colección en la que encontrar las entidades cuando las necesita. Los comportamientos que esperamos del repositorio son:

* Recuperar entidades por su identidad: retrieve.
* Guardar entidades creadas o modificadas: store.
* Seleccionar entidades que cumplan una especificación: findSatisfying. Una especificación encapsula un cierto conjunto de condiciones que debe cumplir una entidad para ser seleccionada.

Algo similar a esto:

```typescript
interface OrdersRepository {
    retrieve(orderId: Id): Order;
    store(order: Order): void;
    findSatisfying(specification: OrderSpecification): Orders
}
```

Y hasta aquí el patrón repositorio.

## El problema con los repositorios

Por lo general abusamos de los repositorios, lo que lleva a un montón de problemas. Y este abuso se produce porque no tenemos en cuenta la regla fundamental:

> Los repositorios no son la puerta de acceso a la base de datos.

Cuando diseñes un repositorio debes concebirlo como una colección. Nunca como una tabla o conjunto de tablas en la base de datos.

Y mucho menos como un lugar para delegar lógica de negocio en la base de datos o alimentar vistas.

De hecho, es trivial implementar un repositorio en memoria usando estructuras de datos simples provistas por el lenguaje, y es un buen primer paso para empezar a trabajar, especialmente si desarrollas con TDD.

## Pero, ¿y mis vistas de listado y detalle?

Desde el punto de vista del modelo de datos, el patrón es útil para garantizar la consistencia de la escritura. Esa es su responsabilidad, especialmente si es un repositorio de agregados, donde debe coordinar la información de distintas tablas para que se puedan reconstruir los modelos de dominio.

Recuerda que un agregado define el límite de transaccionalidad de un conjunto de entidades, de las cuales una de ellas actúa como raíz y es responsable de mantener sus invariantes.

En algunos casos de uso, será necesario recuperar entidades o agregados para realizar operaciones de negocio con ellos y, generalmente, volver a guardarlos.

Sin embargo, una gran parte de casos de uso no necesita recuperar las entidades o agregados completos porque no van a realizar acciones de negocio. Es el caso de las vistas o endpoints de listados, detalle, y un largo etcétera. Resumiendo: prácticamente todo lo que responde a un GET.

En esos casos, recurriremos a Read o View Models. ¿Y esto qué es? Son servicios que acceden a la persistencia para obtener los datos que necesita una vista específica. El ViewModel como tal es básicamente un DTO que porta los datos requeridos por la vista específica a la que sirve. El Servicio lanza una query a la persistencia para obtener los datos, que requieren muy poco procesamiento extra.

Imagina una vista que sea un listado de pedidos bajo alguna condición, por ejemplo, pendientes de completar para envío. Esta vista muestra el identificador, el cliente y la fecha de pedido, permitiendo acceder a la vista de detalle. `customerId` está ahí para permitirnos enlazar a una vista de los pedidos pendientes del cliente.

```typescript
class PendingOrder {
    orderId: string,
    customer: string,
    customerId: string,
    createdAt: string,
}
```

```typescript
class GetPendingOrders {
    sort: { field: string, dir: string },
}

class GetPendingOrdersHandler {
    handle(command: GetPendingOrders): PendingOrder[] {
        //
    }
}

class GetPendingOrdersReadModel {
    all(sort): PendingOrder[];
}
```

`GetPendingOrdersReadModel` básicamente lanza una query contra el sistema de persistencia que hayamos implementado para obtener exclusivamente los datos de la vista.

Entre otras ventajas, esto permite un desarrollo realmente sencillo de cada vista, así como la posibilidad de optimizar las queries muy eficientemente porque solo piden los datos necesarios. Implementar filtros u ordenación es trivial.

Y como bonus: es una solución muy escalable.

## ¿De dónde salen los datos?

En sistemas sencillos podemos simplemente hacer queries a la misma base de datos en la que escribimos. El Repositorio nos garantiza que los datos son consistentes y no tenemos más que lanzar queries SQL a medida para cada ViewModel. Esto es adecuado para sistemas pequeños y pruebas de concepto.

Podemos mejorar esto teniendo réplicas de solo lectura y accediendo a ellas en lugar de a la maestra. Prácticamente, no tenemos que cambiar nada para mejorar el rendimiento. El acceso a réplicas de solo lectura nos permite descargar la maestra de escritura y evitar la posibilidad de modificar datos.

¿Es complicado o ineficiente obtener los datos adecuados para el ViewModel? Puede ser hora de generar tablas con proyecciones de datos cuando se actualiza una entidad o agregado. Esto es más barato hacerlo en tiempo de escritura y es relativamente sencillo regenerarlos si es necesario. 

Además, esto permite que las vistas sean actualizadas cuando tienen que mostrar datos que cambian con el tiempo de una forma más sencilla. En nuestro ejemplo de la vista de pedidos pendientes, sería fácil actualizar una columna que mostrase el estado de completado de un pedido.

Para ello puedes introducir eventos de dominio y disponer un proyector que escuche el evento para actualizar cada ViewModel. Estos consumidores escuchan los eventos que les pueden afectar. Igualmente, puedes introducirlo de forma progresiva: empezando por eventos síncronos en sistemas simples, leyendo de colas o con _message brokers_ en sistemas más complejos.

Puedes pensar que esto introduce complejidad. Pero es complejidad de la buena: muchos objetos especializados que hacen muy bien una tarea muy concreta.

_Una versión reducida de este artículo se publicó en la revista de la PulpoCon24._
