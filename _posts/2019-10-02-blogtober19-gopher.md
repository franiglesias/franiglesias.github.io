---
layout: post
title: Gopher (Blogtober2019)
categories: articles
tags: blogtober19
---

Mi compañera y manager en Holaluz [Mavi Jiménez](https://twitter.com/Linkita) va a hacer un dibujo cada día del mes sobre una palabra propuesta en twitter. Y aquí vamos a intentar escribir [un post por cada una de ellas](https://franiglesias.github.io/blogtober19-status/).

<blockquote class="twitter-tweet" data-conversation="none" data-theme="dark"><p lang="en" dir="ltr">2. Gopher <a href="https://twitter.com/gonzaloserrano?ref_src=twsrc%5Etfw">@gonzaloserrano</a> <a href="https://twitter.com/hashtag/Inktober2019?src=hash&amp;ref_src=twsrc%5Etfw">#Inktober2019</a> <a href="https://twitter.com/hashtag/linkitober2019?src=hash&amp;ref_src=twsrc%5Etfw">#linkitober2019</a> <a href="https://t.co/24Cne94WB7">pic.twitter.com/24Cne94WB7</a></p>&mdash; Maybe (@Linkita) <a href="https://twitter.com/Linkita/status/1179492009939263488?ref_src=twsrc%5Etfw">October 2, 2019</a></blockquote> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>

## Gopher

Seguramente hoy identificas Gopher como el roedor elegido como mascota del lenguaje Go, pero no voy a hablar ni de Go, ni de animales, sino del uno de los antecesores del "Cloud".

Hasta finales de los años 90, los servicios que funcionaban sobre Internet definían sus propios protocolos de comunicación, montados sobre los protocolos básicos TCP y UDP. DNS (nombres de dominio), Telnet (acceso remoto), SMTP (correo electrónico), FTP (transferencia de archivos) o HTTP (world wide web), entre otros. Y uno de esos otros era Gopher [RFC-1436](http://www.faqs.org/rfcs/rfc1436.html).

Gopher fue inventado en la Universidad de Minnesota por [Mark P. McCahill](https://en.wikipedia.org/wiki/Mark_P._McCahill).

Su idea básica era presentarse a los usuarios como un sistema de almacenamiento _montable_ de solo lectura y acceso global, una especie de disco de red. Los documentos podrían residir físicamente en numerosos servidores, lo que supone una ventaja sobre el FTP, en el cual tienes que saber previamente en qué servidor concreto se encuentra el archivo que buscas, al proporcionarte un único punto de entrada.

Gopher incorporaba sistemas de búsqueda y jerarquía de la información, de modo que podrías examinar documentos organizados en carpetas y realizar búsquedas contra un servidor que te proporcionarían listados de documentos relevantes. Su mayor inconveniente era la rigidez en el formato de archivo y en la forma en que los servidores definían la navegación.

A finales de los años 90, el HTTP, o sea la web, barrió literalmente a Gopher de la red gracias a su tremenda flexibilidad a la hora de compartir documentos y relacionarlos a través de hiperenlaces. 

Gopher era una idea muy interesante, pero creo que pecó de ser un protocolo excesivamente "listo". Por decirlo de alguna manera, sabía demasiado sobre la información que manejaba, lo que acabó por volverla inflexible.

Hoy, HTTP es el protocolo básico sobre el que se mueven casi todos los servicios que usamos a diario. Se ha convertido en la base de una estructura que la mayoría de la gente identifica como "Internet". La base de su éxito puede ser, precisamente, el definirse como un protocolo "tonto" que ha permitido inventar un montón de usos más allá de los que Tim Benders-Lee imaginó al inventarlo.

[Gopher](http://personales.upv.es/rmartin/TcpIp/cap06s01.html)

[World of ends](https://worldofends.com)

