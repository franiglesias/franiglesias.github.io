---
layout: page
title: Series de artículos
permalink: /series/
---

<div class="posts">

{% for serie_entry in site.data.series %}
    {% assign serie_slug = serie_entry[0] %}
    {% assign serie_data = serie_entry[1] %}
    {% assign serie_posts = site.posts | where: "series", serie_slug | sort: "date" %}

    <h2>{{ serie_data.title }}</h2>
    <p>{{ serie_data.description }}</p>

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
