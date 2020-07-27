---
layout: post
title: Value Objects con Doctrine
categories: articles
tags: php bbdd good-practices
---

Como xa saberedes, os Value Objects son obxectos do dominio que representan conceptos que nos interesan polo ser valor, son inmutables, non teñen identidade, nin ciclo de vida.

A primeira razón para usar Value Objects e combatir o fedor, ou *smell*, *Primitive Obsession*. Trátase de reemplazar a representación destes valores con tipos escalares polos Value Objects. Isto é especialmente útil cando o valor non se pode representar cunha soa variable, como ocorre con aquelas magnitudes que precisan unidades.

Entre outras vantaxes, os Value Objects encapsulan as suas regras de validación, o que nos garante que poidendo instanciar un obxecto dun tipo poderemos utilizalo sen ter que validalo de novo. A máis diso, permitennos encapsular regras de negocio axudándonos a acadar o principio DRY (Don't Repeat Yourself). Son particularmente útiles para tipos de datos enumerables.

Por suposto, utilizamos Value Objects para moitas propiedades das entidades e neste artículo imos falar dun aspecto práctico: cómo xestionamos a súa persistencia có ORM Doctrine.

## Un exemplo de Value Object sinxelo

Para este exemplo, vouvos amosar un enumerable que utilizariamos para xestionar certas modalidades das comisións que reciben os comerciais dunha empresa. 

Os valores de este concepto poder ser estes tres: 'variable', 'flat' e 'mixed'. O Value Object permítenos asegurar que non utilizamos outros valores.

```php
class CommissionType
{
    public const VARIABLE = 'variable';
    public const FLAT = 'flat';
    public const MIXED = 'mixed';

    private const VALID_TYPES = [
        self::VARIABLE,
        self::FLAT,
        self::MIXED
    ];

    /** @var string */
    private $value;

    private function __construct(string $value)
    {
        if (! in_array($value, self::VALID_TYPES, true)) {
            $validTypes = implode(', ', self::VALID_TYPES);
            $errorMessage = sprintf(
                'Commission type \'%s\' is not valid. It should be one of the following: [%s].',
                $value,
                $validTypes
            );

            throw new InvalidArgumentException($errorMessage);
        }

        $this->value = $value;
    }

    public static function fromString(string $type): self
    {
        return new self($type);
    }

    public function __toString(): string
    {
        return $this->value;
    }

    public static function mixed(): CommissionType
    {
        return new self(self::MIXED);
    }

    public static function flat(): CommissionType
    {
        return new self(self::FLAT);
    }

    public static function variable(): CommissionType
    {
        return new self(self::VARIABLE);
    }
}
```

Podedes ver que empregamos varios *named constructors* para poder instanciar de diversos xeitos. A constructora valida a entrada, permitíndo só os tres valores definidos polo negocio.

### Como definir os tipos para Doctrine

É preciso facer varias cousas para que Doctrine poida saber como representar os Value Objects na base de datos e como reconstruilos.

O primeiro é definir un tipo de Doctrine que saiba convertir os valores do obxecto entre PHP e a súa representación na base de datos que, neste caso, é un `string`.

Este é:

```php
class DoctrineCommissionType extends Type
{

    public const NAME = 'commission_type';


    public function getSQLDeclaration(
        array $fieldDeclaration,
        AbstractPlatform $platform
    ) {
        return $platform->getVarcharTypeDeclarationSQL([]);
    }


    public function getName()
    {
        return self::NAME;
    }


    public function convertToDatabaseValue($value, AbstractPlatform $platform)
    {
        return (string) $value;
    }


    public function convertToPHPValue($value, AbstractPlatform $platform): CommissionType
    {
        return CommissionType::fromString($value);
    }
}
```

Os puntos nos que hai que se fixar son:

* Darlle un nome ó tipo para poder usalo nos mapeos.
* Sobreescribir os métodos `convertToDatabaseValue`, para obter a repressentación en base de datos, e `convertToPHPValue`, para obter o obxecto a partires desa representación. No fondo, este Doctrine Type non é máis ca un DataTransformer de dous sentidos.

Asemade, temos que rexistrar o tipo na configuración do Doctrine, baixo a clave `doctrine:dbal:types`. Este é un anaco do `config.yml`

```yaml
doctrine:
    dbal:
        default_connection: '%database_connection%'
        connections:
            default:
                ...
                ...
        types:
            commission_type: App\...\DoctrineCommissionType

```

Finalmente, temos que usar o tipo na definición do mapeo da entidade para o ORM. Este é un anaco do arquivo `Commission.orm.yml` no que o usamos:

```yaml
App\...Commission:
    type: entity
    repositoryClass: App\...\DoctrineCommissionRepository
    table: commission
    schema: core
    id:
        id:
            id: true
            type: uuid
    fields:
        ...
        CommissionType:
            type: commission_type
        ...
```

## Value Objects compostos: uso dos embeddables

Moitas vces precisamos de Value Objects compostos de varios campos de información. Por exemplo, Money leva conta da cantidade, pero tamén da unidade monetaria. No noso caso, como podes imaxinar, un concepto importante é **Consumption**, que tamén se compón de cantidade e unidade de medida:

```php
class Consumption
{
    /** @var float */
    private $amount;

    /** @var ConsumptionUnit $unit */
    private $unit;


    private function __construct(float $amount, ConsumptionUnit $unit)
    {
        $this->setAmount($amount);
        $this->setUnit($unit);
    }

    public static function build(float $amount, string $consumptionUnit): Consumption
    {
        return new self($amount, new ConsumptionUnit($consumptionUnit));
    }

    private function setAmount(float $amount)
    {
        $this->amount = $amount;
    }

    private function setUnit(ConsumptionUnit $consumptionUnit)
    {
        $this->unit = $consumptionUnit;
    }

    public function amount(): float
    {
        return $this->amount;
    }

    public function unit(): ConsumptionUnit
    {
        return $this->unit;
    }

    public function equals(Consumption $consumption): bool
    {
        return $this->amount === $consumption->amount()
            && $this->unit()->equals($consumption->unit());
    }

    public function greatest(Consumption $consumption): bool
    {
        $consumption = $consumption->toUnit($this->unit());

        return $this->amount() > $consumption->amount();
    }

    public function add(Consumption $consumption): Consumption
    {
        if ($this->unit() !== $consumption->unit()) {
            $consumption = $consumption->toUnit($this->unit());
        }
        $amount = $this->amount() + $consumption->amount();

        return new self($amount, $this->unit());
    }
}
```

### Como definir os embeddables en Doctrine

Neste caso o problema está en que o obxecto ten que se representar con dous campos na base de datos, para o cal empregamos os embeddables.

Un embeddable defínese cun mapeo. Neste caso, no arquivo `Consumption.orm.yml`, no que se lle di a Doctrine que campos contén o Value Object e de qué tipo son. Precisamente neste exemplo temos un decimal e outro Value Object simple, que ten a súa propia definición, que se fai exactamente igual que no exemplo anterior.

```
App\...\Consumption:
    type: embeddable
    fields:
        amount:
            type: decimal
            precision: 10
            scale: 2
        unit:
            type: consumption_unit_type

```

Aquí tes un exemplo do mapeo dunha entidade que usa o embeddable, só tes que indicar o FQCN (Full Qualified Class Name)

```yaml
App\...\Commission:
  type: entity
  indexes:
    commission_cups_idx:
      columns: [ cups ]
  repositoryClass: App\...\DoctrineCommissionRepository
    table: commission
    ...
  embedded:
    annualConsumption:
      class: App\...\Consumption
    ...
```

Unha cousa a ter en conta é o nome de campo. Doctrine neste caso vai compoñelo deste xeito:

```
annual_consumption_amount
annual_consumption_unit
```

É dicir: o nome do campo na entidade como prefixo concatenado co nome de cada un dos campos do Value Object. És posible controlar esto engadindo a clave `columnPrefix`:

```yaml
App\...\Commission:
  type: entity
  indexes:
    commission_cups_idx:
      columns: [ cups ]
  repositoryClass: App\...\DoctrineCommissionRepository
    table: commission
    ...
  embedded:
    annualConsumption:
      class: App\...\Consumption
      columnPrefix: consumption_
    ...
```

Co que obteríamos os seguintes nomes de campos:

```
annual_consumption_amount
annual_consumption_unit
```

Como dicía antes, o tipo ConsumptionUnit é un Value Object simple e se aplican as mesmas regras (ainda que vaia dentro doutro Value Object). Así, o seu Doctrine Type será:

```php
class DoctrineConsumptionUnitType extends Type
{

    public const NAME = 'consumption_unit_type';

    public function getSQLDeclaration(array $fieldDeclaration, AbstractPlatform $platform)
    {
        return $platform->getVarcharTypeDeclarationSQL([]);
    }

    public function getName()
    {
        return self::NAME;
    }

    public function convertToDatabaseValue($value, AbstractPlatform $platform)
    {
        return (string) $value;
    }


    public function convertToPHPValue($value, AbstractPlatform $platform)
    {
        if (empty($value)) {
            return null;
        }

        return ConsumptionUnit::fromString($value);
    }
}
```

## Concluindo

Os Value Objects nos procuran moitos beneficios para representar axeitadamente conceptos de negocio. Neste articulo amosamos como manexalos na capa de persistencia.
