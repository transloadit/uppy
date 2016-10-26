---
title: "Getting Started"
type: guide
order: 0
---

*Uppy is in development, some features are unavailable and things may break.*

## Installing from NPM

NPM is the recommended installation method when building large scale apps with Uppy. It pairs nicely with a CommonJS module bundler such as [Webpack](http://webpack.github.io/), [Browserify](http://browserify.org/) or [Rollup.js](http://rollupjs.org/).

``` bash
$ npm install uppy --save
```

``` javascript
// ES6
import { Core, DragDrop, Tus10 } from 'uppy'

const uppy = new Core({wait: false})
const files = uppy
  .use(DragDrop, {target: 'body'})
  .use(Tus10, {endpoint: '//tusd.tus.io/files'})
  .run()
```

or

``` javascript
// ES5
// warning: bundling with `require` will currently include the whole Uppy package, with all plugins.
// If you want to pick and choose, use `import`
var Uppy = require('uppy')

var uppy = new Uppy.Core({wait: false})
var files = uppy
  .use(Uppy.DragDrop, {target: 'body'})
  .use(Uppy.Tus10, {endpoint: '//tusd.tus.io/files'})
  .run()
```

Add CSS [uppy.min.css](https://unpkg.com/uppy/dist/uppy.min.css), either to `head` of your HTML or include in JS, if your bundler of choice supports it — transforms and plugins are available for Browserify and Webpack.

Give Uppy a spin [on RequireBin](http://requirebin.com/?gist=54e076cccc929cc567cb0aba38815105).

## Installing from CDN

But if you like, you can also use a pre-built bundle, for example from [unpkg CDN](https://unpkg.com/uppy/). In that case `Uppy` will attach itself to the global `window` object.

1\. Add a script to your the bottom of your HTML’s `<body>`:

``` html
<script src="https://unpkg.com/uppy/dist/uppy.min.js"></script>
```

2\. Add CSS to your HTML’s `<head>`:
``` html
<link href="https://unpkg.com/uppy/dist/uppy.min.css" rel="stylesheet">
```

3\. Initialize:

``` html
<script>
  var uppy = new Uppy.Core({locales: Uppy.locales.ru_RU, debug: true})
  uppy.use(Uppy.DragDrop, {target: '.UppyDragDrop'})
  uppy.use(Uppy.Tus10, {endpoint: '//tusd.tus.io/files/'})
  uppy.run()
</script>
```

## API

Check out the [API section](/api).

## Browser Support

<a href="https://saucelabs.com/u/transloadit-uppy">
  <img src="https://saucelabs.com/browser-matrix/transloadit-uppy.svg" alt="Sauce Test Status"/>
</a>

Note: we aim to support IE10+ and recent versions of Safari, Edge, Chrome, Firefox and Opera. IE6 on the chart above means we recommend setting Uppy to target a `<form>` element, so when Uppy has not yet loaded or is not supported, upload still works. Even on the refrigerator browser. Or, yes, IE6.
