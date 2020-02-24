---
type: docs
order: 6
title: "Locale Packs"
permalink: docs/locales/
category: "Docs"
body_class: "page-docs-locales"
---

Uppy speaks multiple languages, English being the default. You can use a locale pack to translate Uppy into your language of choice.

[List of our locale packs](#List-of-locale-packs)

## Using a locale pack from npm

This is the recommded way. Install `@uppy/locales` package from npm, then [choose the locale](#List-of-locale-packs) you’d like to use: `@uppy/locales/lib/LANGUAGE_CODE`.

```bash
npm i @uppy/core @uppy/locales
```

```js
const Uppy = require('@uppy/core')
const German = require('@uppy/locales/lib/de_DE') // see below for the full list of locales
const uppy = Uppy({
  debug: true,
  locale: German
})
```

## Using a locale pack from CDN

Add a `<script>` tag with Uppy bundle and the locale pack you’d like to use. You can copy/paste the link from the CDN column in the [locales table](#List-of-locale-packs). The locale will attach itself to the `Uppy.locales` object.

```html
<script src="https://transloadit.edgly.net/releases/uppy/v1.9.2/uppy.min.js"></script>
<script src="https://transloadit.edgly.net/releases/uppy/locales/v1.11.3/de_DE.min.js"></script>

<script>
var uppy = Uppy.Core({
  debug: true,
  locale: Uppy.locales.de_DE
})
</script>
```

## Overriding locale strings for a specific plugin

Many plugins come with their own locale strings, and the packs we provide consist of most of those strings. You can, however, override a locale string for a specific plugin, regardless of whether you are using locale pack or not. See the plugin documentation for the list of locale strings it uses (for example, [here’s Dashboard](http://localhost:4000/docs/dashboard/#locale)).

```js
const Uppy = require('@uppy/core')
const DragDrop = require('@uppy/drag-drop')
const Russian = require('@uppy/locales/lib/ru_RU')
const uppy = Uppy({
  debug: true,
  autoProceed: true,
  locale: Russian
})
uppy.use(DragDrop, {
  target: '.UppyDragDrop',
  // We are using the ru_RU locale pack (set above in Uppy options),
  // but you can also override specific strings like so:
  locale: {
    strings: {
      browse: 'выберите ;-)'
    }
  }
})

```

## List of locale packs

<!-- md list_of_locale_packs.md -->

## Contributing a new language

If you speak a language we don’t yet support, you can contribute! Here’s how you do it:

1. Go to the [uppy/locales](https://github.com/transloadit/uppy/tree/master/packages/%40uppy/locales/src) directory in the Uppy GitHub repo.
2. Go to `en_US.js` and copy its contents, as English is the most up-to-date locale.
3. Press “Create new file”, name it according to the [`language_COUNTRY` format](http://www.i18nguy.com/unicode/language-identifiers.html), make sure to use underscore `_` as a divider. Examples: `en_US`, `en_GB`, `ru_RU`, `ar_AE`. Variants should be trailing, e.g.: `sr_RS_Latin` for Serbian Latin vs Cyrillic.
4. Paste what you’ve copied from `en_US.js` and use it as a starting point to translate strings into your language.
5. When you are ready, save the file — this should create a PR that we’ll then review 🎉 Thanks!
