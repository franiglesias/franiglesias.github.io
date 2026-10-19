---
layout: drifting-layout
title: Archivo de The Drifting Bit
permalink: /drifting/archive/
---

<div class="archive-page">
  {% assign years_str = "" %}
  {% assign total_posts = 0 %}

  {% if site.drifting %}
  {% for post in site.drifting %}
    {% unless post.hide %}
      {% assign total_posts = total_posts | plus: 1 %}
      {% assign post_year = post.date | date: "%Y" %}
      {% assign year_tag = post_year | append: "," %}
      {% unless years_str contains year_tag %}
        {% assign years_str = years_str | append: year_tag %}
      {% endunless %}
    {% endunless %}
  {% endfor %}
  {% endif %}

  {% assign year_list = years_str | split: "," %}

  <div class="archive-summary">
    <p class="archive-summary__count">Un total de <strong>{{ total_posts }}</strong> artículos publicados en The Drifting Bit.</p>
    {% if total_posts > 0 %}
    <nav class="archive-year-nav" aria-label="Navegación por años">
      {% for y in year_list %}
        {% if y != "" %}
          <a href="#year-{{ y }}" class="archive-year-pill">{{ y }}</a>
        {% endif %}
      {% endfor %}
    </nav>
    {% endif %}
  </div>

  <div class="archive-timeline">
  {% assign current_year = "" %}
  {% assign current_month = "" %}

  {% if site.drifting %}
  {% assign sorted_drifting = site.drifting | sort: "date" | reverse %}
  {% for post in sorted_drifting %}
    {% unless post.hide %}
      {% assign post_year = post.date | date: "%Y" %}
      {% assign post_month = post.date | date: "%m" %}

      {% if post_year != current_year %}
        {% if current_month != "" %}
            </ul>
          </div>
        {% endif %}
        {% if current_year != "" %}
          </section>
        {% endif %}

        {% assign current_year = post_year %}
        {% assign current_month = "" %}

        <section id="year-{{ current_year }}" class="archive-year-section">
          <h2 class="archive-year-heading">
            <span class="archive-year-text">{{ current_year }}</span>
            <a href="#year-{{ current_year }}" class="archive-year-anchor" aria-label="Enlace a {{ current_year }}">#</a>
          </h2>
      {% endif %}

      {% if post_month != current_month %}
        {% if current_month != "" %}
            </ul>
          </div>
        {% endif %}

        {% assign current_month = post_month %}

        {% case post_month %}
          {% when "01" %}{% assign month_name = "Enero" %}{% assign month_short = "ene" %}
          {% when "02" %}{% assign month_name = "Febrero" %}{% assign month_short = "feb" %}
          {% when "03" %}{% assign month_name = "Marzo" %}{% assign month_short = "mar" %}
          {% when "04" %}{% assign month_name = "Abril" %}{% assign month_short = "abr" %}
          {% when "05" %}{% assign month_name = "Mayo" %}{% assign month_short = "may" %}
          {% when "06" %}{% assign month_name = "Junio" %}{% assign month_short = "jun" %}
          {% when "07" %}{% assign month_name = "Julio" %}{% assign month_short = "jul" %}
          {% when "08" %}{% assign month_name = "Agosto" %}{% assign month_short = "ago" %}
          {% when "09" %}{% assign month_name = "Septiembre" %}{% assign month_short = "sep" %}
          {% when "10" %}{% assign month_name = "Octubre" %}{% assign month_short = "oct" %}
          {% when "11" %}{% assign month_name = "Noviembre" %}{% assign month_short = "nov" %}
          {% when "12" %}{% assign month_name = "Diciembre" %}{% assign month_short = "dic" %}
        {% endcase %}

        <div class="archive-month-block">
          <h3 class="archive-month-heading">{{ month_name }}</h3>
          <ul class="archive-post-list">
      {% endif %}

      <li class="archive-post-item">
        <time datetime="{{ post.date | date_to_xmlschema }}" class="archive-post-date">{{ post.date | date: "%d" }} {{ month_short }}</time>
        <div class="archive-post-content">
          <a href="{{ post.url | relative_url }}" class="archive-post-title">{{ post.title }}</a>
          {% if post.subtitle %}
            <span class="archive-post-subtitle">{{ post.subtitle }}</span>
          {% endif %}
        </div>
      </li>
    {% endunless %}
  {% endfor %}

  {% if current_month != "" %}
        </ul>
      </div>
  {% endif %}
  {% if current_year != "" %}
    </section>
  {% endif %}
  {% endif %}
  </div>
</div>
