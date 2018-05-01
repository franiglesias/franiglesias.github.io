---
layout: post
title: TDD de un validador
published: false
categories: articles
tags: [php, tdd, testing]
---

Un DNI es un identificador que consta de ocho cifras numéricas y una letra que actúa como dígito de control. Existen algunos casos particulares en los que el primer número se sustituye por una letra y ésta, a su vez, por un número para el cómputo de validez que viene a continuación.

El algoritmo para validar un NIF es muy sencillo: se toma la parte del numero del documento y se divide entre 23 y se obtiene el resto. Ese resto es un índice que se consulta en una tabla de letras. La letra correspondiente al índice es la que debería tener un DNI válido. Por tanto, si la letra del DNI concuerda con la que hemos obtenido, es que es válido.

La tabla en cuestión es esta:


RESTO	0	1	2	3	4	5	6	7	8	9	10  11
LETRA	T	R	W	A	G	M	Y	F	P	D	X	B
 

RESTO	12	13	14	15	16	17	18	19	20	21	22
LETRA	N	J	Z	S	Q	V	H	L	C	K	E

Como siempre, comenzamos con un test.

Voy a empezar con un 
