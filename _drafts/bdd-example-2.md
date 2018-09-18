---
layout: post
title: Introducción a Behavior Driven Development en PHP (2)
categories: articles
tags: php bdd testing
---

En el [artículo anterior](/2018-09-16-bdd-example-1) comenzamos introduciendo el concepto de BDD, el lenguaje Gherkin y la herramienta Behat. Al final del mismo, nos habíamos quedado con una feature escrita en Gherkin y un test de aceptación vinculado fallando.

Antes de continuar me gustaría puntualizar algunas cosas cuya ausencia podríais haber notado.

## Hagamos un inciso

**Qué hay de los tests de navegador**. Muchas personas sabéis que es frecuente hacer tests de navegador con ayuda de estas herramientas ya que en muchos casos es el modo en que el usuario va a interactuar con la aplicación. En su lugar he planteado un test más centrado en el backend. Primero porque es un terreno más familiar para mi, pero también me parece que es más fácil entender el funcionamiento del ecosistema BDD sin introducir dificultades extras.

Sin embargo, mi plan es cubrir ese tipo de tests en el futuro. 

**Tests de integración con Behat**. Con relación a lo anterior, decir que es perfectamente válido utilizar Gherkin y behat para plantear tests de integración de esta forma. Asumo que en cada equipo de desarrollo y en cada proyecto las cosas pueden ser distintas pero en mi caso esta aproximación sería más que suficiente en la mayor parte de ocasiones.

**¿Esta cosa es configurable?** Bajando a aspectos más técnicos, todavía no me parado en introducir los detalles de configuración de Behat. Con toda razón habrá quien se pregunte si no es posible guardar los archivos en otra parte o generar más tests que el FeatureContext que se crea por defecto. Por supuesto que es posible personalizar la herramienta pero, de nuevo, me ha parecido más fácil centrarnos en entender bien el flujo de trabajo antes de tratar de personalizarlo sin saber por qué o para qué.

**¿Otro entorno de test? ¿Tengo que aprender phpspec?** En la entrega anterior mencioné que usaríamos phpspec para la siguiente fase de desarrollo BDD. Sin embargo, no es estrictamente necesario ya que con phpunit podemos desarrollar el mismo tipo de test, aunque nos exige algo más de disciplina. Como ya he comentado anteriormente, y la documentación de phpspec insiste, se trata de un framework de test con opiniones muy marcadas acerca de cómo deberías programar.

PHPspec impone muchas restricciones que son buenas para forzarnos a respetar los principios de diseños y construir un código desacoplado y sostenible guiados por ejemplos. 

Y con esto, termina este inciso y volvemos al trabajo.

## Recuperando el hilo

El artículo anterior finalizaba con el siguiente test:

```php
<?php

use Behat\Behat\Tester\Exception\PendingException;
use Behat\Behat\Context\Context;
use Behat\Gherkin\Node\PyStringNode;
use Behat\Gherkin\Node\TableNode;

/**
 * Defines application features from the specific context.
 */
class FeatureContext implements Context
{
    private $productRepository;
    private $updatePricesFromUploadedFile;
    private $readCSVFile;
    private $filename;
    /**
     * Initializes context.
     *
     * Every scenario gets its own context instance.
     * You can also pass arbitrary arguments to the
     * context constructor through behat.yml.
     */
    public function __construct()
    {
        $this->productRepository = new ProductRepository();
        $this->readCSVFile = new ReadCSVFile();
        $this->updatePricesFromUploadedFile = new UpdatePricesFromUploadedFile(
            $this->productRepository,
            $this->readCSVFile
        );
    }

    /**
     * @Given /There are (current )?prices in the system/
     */
    public function thereAreCurrentPricesInTheSystem()
    {
        $this->productRepository->addProduct(new Product('Product 1', 15));
        $this->productRepository->addProduct(new Product('Product 2', 20));
    }

    /**
     * @Given I have a file named :filename with the new prices
     */
    public function iHaveAFileNamedWithTheNewPrices(string $filename)
    {
        $this->filename = '/var/tmp/'.$filename;
    }

    /**
     * @When I upload the file
     */
    public function iUploadTheFile()
    {
        $newPrices = <<<EOD
product,price
"Product 1",17
"Product 2",23
EOD;
        file_put_contents($this->filename, $newPrices);
        $request = new UpdatePricesFromUploadedFileRequest($this->filename);
        $this->updatePricesFromUploadedFile()->execute($request);
    }

    /**
     * @Then Changes are applied to the current prices
     */
    public function changesAreAppliedToTheCurrentPrices()
    {
        $product1 = $this->productRepository->getByName('Product 1');
        Assert::assertEquals(17, $product1->price());
        $product2 = $this->productRepository->getByName('Product 2');
        Assert::assertEquals(23, $product2->price());
    }
}
```

Este test tiene muchos detalles mejorables, incluyendo el diseño de la solución.

Sin embargo, me gustaría partir de este ejemplo tal como está y hacer un ejercicio completo de desarrollo en BDD. En entregas futuras sí me gustaría introducir mejoras en el test que nos sirvan para aprender cómo expresar una serie de elementos en Gherkin, cómo introducirlo en el test y otras cuestiones. Pero creo que será más fácil si conocemos el proceso completo.

Y ahora, sí:

## Del test de aceptación a la especificación mediante ejemplos

Tenemos el test de aceptación, pero pretendemos ejecutarlo con elementos que no existen todavía. Podríamos empezar a escribir código sin más, pero queremos ser más rigurosos y desarrollar las clases implicadas mediante TDD, pero sin salirnos del enfoque BDD.

Para ello usaremos una metodología conocida como especificación mediante ejemplos.

Los tests tradicionales suelen tener un lenguaje aseverativo: el código hace algo y el test confirma que lo hace. 

Los tests BDD tienen un lenguaje más desiderativo y suelen nombrarse con la fórmula "debería" (should...) porque se definen como un descripción del comportamiento que se espera de ese objeto en una situación dada.

Este tipo de tests se pueden crear en phpunit con un poco de disciplina, pero contamos con una herramienta diseñada específicamente para ello que es phpspec.

### Añadiendo phpspec al proyecto



### Nuestro primer ejemplo




