---
title: "Getting Started"
type: docs
permalink: docs/
alias: api/
order: 0
category: "Docs"
---

Uppy is a sleek and modular file uploader. It fetches files from local disk, Google Drive, Instagram, remote urls, cameras etc, and then uploads them to the final destination. It’s fast, easy to use and lets you worry about more important problems than building a file uploader.

Uppy consists of a core module and [various plugins](/docs/plugins/) for selecting, manipulating and uploading files.

Here’s the simplest example html page with Uppy (it uses a CDN bundle, while we recommend to use a bundler, see [Installation](#Installation)):

```html
<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Uppy</title>
    <link href="https://transloadit.edgly.net/releases/uppy/v1.9.3/uppy.min.css" rel="stylesheet">
  </head>
  <body>
    <div id="drag-drop-area"></div>

    <script src="https://transloadit.edgly.net/releases/uppy/v1.9.3/uppy.min.js"></script>
    <script>
      var uppy = Uppy.Core()
        .use(Uppy.Dashboard, {
          inline: true,
          target: '#drag-drop-area'
        })
        .use(Uppy.Tus, {endpoint: 'https://master.tus.io/files/'})

      uppy.on('complete', (result) => {
        console.log('Upload complete! We’ve uploaded these files:', result.successful)
      })
    </script>
  </body>
</html>
```

<a class="TryButton" href="/examples/dashboard/">Try it live</a>

Drag and drop, webcam, basic file manipulation (adding metadata), uploading via tus-resumable uploads or XHR/Multipart is all possible using just the Uppy client module.

Adding [Companion](/docs/companion/) to the mix enables remote sources such as Instagram, Google Drive, Dropbox, and remote URLs. Uploads from remote sources are handled server-to-server, so a 5 GB video won’t be eating into your mobile data plan. Files are removed from Companion after an upload is complete, or after a reasonable timeout. Access tokens also don’t stick around for long, for security reasons.

## Installation

Uppy can be used with a module bundler such as [Webpack](http://webpack.js.org/) or [Browserify](http://browserify.org/), or by including it in a script tag.

> You may need polyfills if your application supports Internet Explorer or other older browsers. See [Browser Support](#Browser-Support).

### With a module bundler

Install the `@uppy/core` package from npm:

``` bash
$ npm install @uppy/core
```

And install the plugins you need separately. The documentation pages for plugins in the sidebar show the necessary `npm install` commands. You can then import Uppy like so:

```bash
npm install @uppy/core @uppy/xhr-upload @uppy/dashboard
```

```js
// Import the plugins
const Uppy = require('@uppy/core')
const XHRUpload = require('@uppy/xhr-upload')
const Dashboard = require('@uppy/dashboard')

// And their styles (for UI plugins)
require('@uppy/core/dist/style.css')
require('@uppy/dashboard/dist/style.css')
 
const uppy = Uppy()
  .use(Dashboard, {
    trigger: '#select-files'
  })
  .use(XHRUpload, { endpoint: 'https://api2.transloadit.com' })
 
uppy.on('complete', (result) => {
  console.log('Upload complete! We’ve uploaded these files:', result.successful)
})
```

Many plugins include a CSS file for the necessary styles in their `dist/` folder. The plugin documentation pages will tell you which to use and when. When using multiple plugin CSS files, some code is duplicated. A CSS minifier like [clean-css](https://www.npmjs.com/package/clean-css) is recommended to remove the duplicate selectors.

You can also use the combined `uppy` package, which includes all plugins that are maintained by the Uppy team. Only use it if you have tree-shaking set up in your module bundler, otherwise you may end up sending a lot of unused code to your users.

```bash
$ npm install uppy
```

Then you can import Uppy and plugins like so:

```js
import Uppy, { XHRUpload, DragDrop } from 'uppy'
```

And add the `uppy/dist/uppy.min.css` file to your page.

### With a script tag

You can also use a pre-built bundle from Transloadit's CDN: Edgly. `Uppy` will attach itself to the global `window.Uppy` object.

> ⚠️ The bundle consists of all plugins maintained by the Uppy team. This method is therefore not recommended for production, as your users will have to download all plugins, even if you are only using a few of them.

1\. Add a script at the bottom of the closing `</body>` tag:

``` html
<script src="https://transloadit.edgly.net/releases/uppy/v1.9.3/uppy.min.js"></script>
```

2\. Add CSS to `<head>`:
``` html
<link href="https://transloadit.edgly.net/releases/uppy/v1.9.3/uppy.min.css" rel="stylesheet">
```

3\. Initialize at the bottom of the closing `</body>` tag:

``` html
<script>
  var uppy = Uppy.Core()
  uppy.use(Uppy.DragDrop, { target: '#drag-drop-area' })
  uppy.use(Uppy.Tus, { endpoint: 'https://master.tus.io/files/' })
</script>
```

## Documentation

- [Uppy](/docs/uppy/) — full list of options, methods and events.
- [Plugins](/docs/plugins/) — list of Uppy plugins and their options.
- [Server](/docs/companion/) — setting up and running a Companion instance, which adds support for Instagram, Dropbox, Google Drive, direct links, and other remote sources.
- [React](/docs/react/) — components to integrate Uppy UI plugins with React apps.
- [Writing Plugins](/docs/writing-plugins) — how to write a plugin for Uppy [documentation in progress].

## Browser Support

<a href="https://saucelabs.com/u/transloadit-uppy">
  <img src="https://saucelabs.com/browser-matrix/transloadit-uppy.svg" alt="Sauce Test Status"/>
</a>

We currently aim to support IE11+ and recent versions of Safari, Edge, Chrome, Firefox and Opera.

We still run end to end tests with IE10, but we are not actively supporting it or fixing visual / minor issues.

### Polyfills

Uppy heavily uses Promises. If your target environment [does not support Promises](https://caniuse.com/#feat=promises), use a polyfill like `es6-promise` before initialising Uppy.

When using remote providers like Google Drive or Dropbox, the Fetch API is used. If your target environment does not support the [Fetch API](https://caniuse.com/#feat=fetch), use a polyfill like `whatwg-fetch` before initialising Uppy. The Fetch API polyfill must be loaded _after_ the Promises polyfill, because Fetch uses Promises.

With a module bundler, you can use the required polyfills like so:

```shell
npm install es6-promise whatwg-fetch
```
```js
require('es6-promise/auto')
require('whatwg-fetch')
const Uppy = require('@uppy/core')
```

If you're using Uppy from CDN, `es6-promise` and  `whatwg-fetch` are already included in the bundle, no need to include anything additionally:

```html
<script src="https://transloadit.edgly.net/releases/uppy/v1.9.3/uppy.min.js"></script>
```
