---
title: Getting Started
type: guide
order: 0
permalink: guide/
---

> **Compatibility Note:** Uppy does not support IE8 and below.

## NPM

NPM is the recommended installation method when building large scale apps with Uppy. It pairs nicely with a CommonJS module bundler such as [webpack](http://webpack.github.io/),  [Browserify](http://browserify.org/) or [rollup.js](http://rollupjs.org/).

``` bash
# latest stable
$ npm install --save uppy
```

{% include_code lang:js dragdrop/app.es6 %}

## Standalone & CDN

{% include_code lang:html bundle/app.html %}
