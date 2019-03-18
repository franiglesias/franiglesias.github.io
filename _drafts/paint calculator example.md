Supongamos por ejemplo, un programa que calcula la pintura necesaria para pintar una habitación. Fundamentalmente lo que hace este programa es obtener el área de las paredes y multiplicarlo por la densidad de cobertura que tiene la pintura. 

Las paredes tienen una superficie, que se obtiene de sus medidas, restando los huecos que no se van a pintar. Nuestro algoritmo de cálculo tiene que lidiar con paredes que pueden ser rectángulos perfectos y otros que tienen nu número indeterminado de huecos.

Así pues, una habitación será una colección de paredes (habitualmente cuatro, pero `¿quién sabe?`), cada una de las cuales será una colección de superficies que suman o restan área que pintar. Para simplificar supondremos que esas zonas o regiones son siempre rectangulares.

```
class Region implements TwoDimensionalShapeInterface
{
    public function area(): float
    {
        return $this->width * $this->height;
    }
}
```

Las paredes son también figuras de dos dimensiones, al menos en lo que toca a pintarlas, por lo que pueden implementar la misma interfaz:

```php
class Wall implementes TwoDimensionalShapeInterface
    public function addingRegion(Region $region)
    {
    }
    
    public function substractingRegion(Region $region)
    {
    }
    
    public function area(): float
    {
        return array_reduce();
    }
```

De hecho, la habitación puede modelarse como una figura de dos dimensiones en lo que respecta al dominio Pintura y su área no será más que la suma de las áreas de las paredes que la componen.

```php
class Room implementes TwoDimensionalShapeInterface
    public function addWall(Wall $wall)
    {
    }
        
    public function area(): float
    {
        return array_reduce();
    }
```

Con este modelo, podemos obtener el área de cualquier habitación, así que sólo nos queda implementar ese conocimiento:

```php
class CalculatePaint
{
    public function withDensity(TwoDimensionalShapeInterface $room, Density $density): float
    {
        return $room->area() * $density->inLittersBySquareMeter();
    }
}
```

¿Qué hemos hecho aquí? Pues fundamentalmente hemos llevado cada responsabilidad al lugar que le corresponde. Esto nos proporciona varias ventajas.

`CalculatePaint` puede usarse con cualquier tipo de clase que implemente `TwoDimensionalShapeInterface`, por lo que podemos emplearlo para calcular la pintura necesaria en cualquier tipo de trabajo.

Por otra parte, `Wall` nos permite modelar cualquier forma de pared pasándole tantos objetos `Region` como sean necesarios, lo que que implica que podríamos añadir soporte para huecos con arcos o formas triangulares si fuese preciso.

En otras palabras, el software está listo para ser ampliado simplemente añadiendo más clases.
