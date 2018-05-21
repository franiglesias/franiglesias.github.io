phpspec

Phpspec es un framework para el diseño basado en especificaciones. Se trata de una variante de TDD que se centra en la descripción del comportamiento de los objetos que diseñamos mediante ejemplos.

## Instalación y configuración

La instalación a través de composer es sencilla

```bash
composer require --dev phpspec/phpspec
```

En cuanto a la configuración, este sería un buen **composer.json** mínimo para usar phpspec con soporte de PSR-4. También puedes configurar el autoload para que use PSR-0.

```json
{
  "autoload": {
    "psr-4": {
      "Dojo\\": ["src/"]
    }
  },
  "config": {
    "bin-dir": "bin"
  },
  "require-dev": {
    "phpspec/phpspec": "5.0.x-dev",
  }
}
```

Si basas el autoload en PSR-0 no necesitarías nada más, pero como nosotros lo vamos a configurar para PSR-4, aquí tienes un archivo **phpspec.yml** de ejemplo (y que podríamos ampliar más adelante para dar soporte a otras características).

**nif_suite**: un nombre para la suite de specs que queramos configurar.

**namespace**: es la raíz del namespace que hayas definido en **composer.json** **psr-4: autoload**.

**psr4-prefix**: en principio, coincide con la anterior, pero se refiere a la ruta que debe usar en el sistema de archivos para guardar el código.

**spec_prefix**: es el nombre de la carpeta que contiene los archivos de especificaciones, que se nombran con el sufijo *Spec.php.

**src_path**: es la ruta bajo la que se guardará el código generado. En el ejemplo %paths.config% apunta a la raíz del proyecto y la carpeta es src.

**spec_path** es la ruta bajo la que se almacenarán las especificaciones, creándose en ella la carpeta definida en **spec_prefix**.

```yaml
suites:
    nif_suite:
        namespace: Dojo
        psr4_prefix: Dojo
        spec_prefix: spec
        src_path: '%paths.config%/src'
        spec_path: '%paths.config%'
```
## Primera especificación

Para ahorrarnos un poco de trabajo phpspec se maneja con dos comandos principales.

El primero es describe y nos permite iniciar la descripción de un clase a través de ejemplos. Tomando como punto de partida la configuración que acabamos de hacer, vamos a imaginar que queremos describir una clase Dojo\Domain\Customer\Customer. Lo haríamos así:

```bash
bin/phpspec describe Dojo/Domain/Customer/Customer
```

Una forma altenativa es:

```phpspec
bin/phpspec describe 'Dojo\Domain\Customer\Customer'
```

Al ejecutar este comando se creará una especificación inicial para esta clase, que se guardará en el archivo **spec/Dojo/Domain/Customer/CustomerSpec.php**. Tendrá esta pinta:

```php
<?php

namespace spec\Dojo\Domain\Customer;

use Dojo\Domain\Customer\Customer;
use PhpSpec\ObjectBehavior;
use Prophecy\Argument;

class CustomerSpec extends ObjectBehavior
{
    function it_is_initializable()
    {
        $this->shouldHaveType(Customer::class);
    }
}
```

Cosas interesantes:

+ La clase `CustomerSpec` viene a ser el equivalente de un TestSuite de PHPUnit, pero está creado de tal manera que $this puede usarse como proxy a la clase Customer que es la que estamos especificando.
+ El método `it_is_initializable` es un ejemplo. Equivale a un test. Se escriben en *snake_case*.
+ En el método podemos ver un matcher, similar a una aserción, y que, en este caso es shouldHaveType (assertInstanceOf).


