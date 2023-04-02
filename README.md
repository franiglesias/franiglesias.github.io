The talking bit
===============

This is a blog I write to learn about things I'm interested in.

Read [The talking bit](https://franiglesias.github.io)

## Development notes

### Local

For local testing, use the following command:

```
jekyll serve --incremental --livereload
```

The `--incremental` flag only updates the changed files. Remove it if you experience problems when rendering the site locally. For example, because the index page will not updated if you change the title of a post, etc.

Check [Jekyll documentation](https://jekyllrb.com/docs/configuration/options/#build-command-options) for details.

## CSS

In order to style the site you need to work in the `assets/css` folder. Jekyll will compile and move needed files to the `_site/assets` folder, from where it will serve them.
