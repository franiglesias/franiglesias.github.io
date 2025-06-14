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

    {% if serie_posts.size > 0 %}
        <ol class="post-list">
            {% for post in serie_posts %}
                <li>
                    <a href="{{ post.url }}">{{ post.title }}</a>
                    <span class="post-meta">{{ post.date | date: "%b %-d, %Y" }}</span>
                </li>
            {% endfor %}
        </ol>
    {% else %}
        <p><em>No hay capítulos publicados aún.</em></p>
    {% endif %}
{% endfor %}

</div>
