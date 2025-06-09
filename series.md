---
layout: page
title: Series de artículos
permalink: /series/
---

<div class="posts">

{% for serie_id in site.data.series %}
    {% assign serie_posts = site.posts | where: "series", serie_id[0] | sort: "date" %}
    {% assign primer_post = serie_posts | first %}
    
    <h2>{{ site.data.series[primer_post.series].title }}</h2>
    <p>{{ site.data.series[primer_post.series].description }}</p>
    
    {% if primer_post %}
        <p><a href="{{ primer_post.url }}">Primer capítulo: {{ primer_post.title }}</a></p>
    
    {% else %}
        <p><em>No hay capítulos publicados aún.</em></p>
    {% endif %}
{% endfor %}

</div>
