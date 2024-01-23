---
layout: micro-post
title: Breaking out of legacy with 3P
categories: articles
tags: tb-list refactoring
---

Me ha llamado la atención esta receta 3P de Johan Martinsson. A la hora de iniciar el trabajo en una historia de usuario o tarea:

* Empezaremos protegiendo el comportamiento existente con los tests que sean necesarios (Protect). 
* Luego refactorizaremos para que la nueva funcionalidad se pueda introducir fácilmente (Prepare)
* Cuando tenemos esto, desarrollamos la nueva funcionalidad con TDD (Produce):

> This is where the idea of the 3Ps comes in, where we not only bring the investment closer to the benefit, but also we are the foremost beneficiaries of the tests just wrote and the refactoring we just did! This has the added benefit that any ill-conceived tests and refactoring are immediately brought to the attention of just the right person to fix the issue. 
> 
> The idea is simple, for each story break down the work into:
> 
> * Protect 
> * Prepare 
> * Produce

[Breaking out of legacy with 3P](https://martinsson-johan.blogspot.com/2022/11/breaking-out-of-legacy-with-3p.html)
