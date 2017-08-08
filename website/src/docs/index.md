---
title: "Getting Started"
type: docs
permalink: docs/
order: 0
---

Uppy file uploader consists of a core module and [various plugins](/docs/plugins/) for  selecting, manipulating and uploading files. Here’s how it works:

```js
const Uppy = require('uppy/lib/core')
const Dashboard = require('uppy/lib/plugins/Dashboard')
const Tus10 = require('uppy/lib/plugins/Tus10')
 
const uppy = Uppy({ autoProceed: false })
  .use(Dashboard, {
    trigger: '#select-files', 
    replaceTargetContent: true
  })
  .use(Tus10, {endpoint: '//master.tus.io/files/'})
  .run()
 
uppy.on('core:success', (files) => {
  console.log(`Upload complete! We’ve uploaded these files: ${files}`)
})
```

[Try it live](/examples/dashboard/)

Drag and Drop, Webcam, basic file manipulation (adding metadata, for example) and uploading via tus resumable uploads or XHR/Multipart is all possible using just the `uppy` client module. However, if you add [uppy-server](https://github.com/transloadit/uppy-server) to the mix, your users will be able to select files from remote sources, such as Instagram, Google Drive and Dropbox, bypassing the client (so a 5 GB video isn’t eating into your mobile data plan), and then uploaded to the final distanation. Files are removed from uppy-server after an upload is complete, or after a resonable timeout. Access tokens also don’t stick around for long, for security.

## Installation

NPM is the recommended installation method when building large scale apps with Uppy. It pairs nicely with a CommonJS module bundler such as [Webpack](http://webpack.github.io/), [Browserify](http://browserify.org/) or [Rollup.js](http://rollupjs.org/). 

``` bash
$ npm install uppy
```

If you like, you can also use a pre-built bundle, for example from [unpkg CDN](https://unpkg.com/uppy/). In that case `Uppy` will attach itself to the global `window.Uppy` object. 

> ⚠️ The bundle currently consists of most Uppy plugins, so this method is not  recommended for production, as your users will have to download all plugins, even if you are using just a few.

1\. Add a script to the bottom of `<body>`:

``` html
<script src="https://unpkg.com/uppy/dist/uppy.min.js"></script>
```

2\. Add CSS to `<head>`:
``` html
<link href="https://unpkg.com/uppy/dist/uppy.min.css" rel="stylesheet">
```

3\. Initialize:

``` html
<script>
  var uppy = Uppy.Core()
  uppy.use(Uppy.DragDrop, {target: '.UppyDragDrop'})
  uppy.use(Uppy.Tus10, {endpoint: '//master.tus.io/files/'})
  uppy.run()
</script>
```

## Documentation

- [Uppy](/docs/uppy.html) — full list of options, methods and events.
- [Plugins](/docs/plugins.html) — list of Uppy plugins and their options.
- [Server](https://github.com/transloadit/uppy-server) — setting up and running an uppy-server instance, which adds support for Instagram, Dropbox, Google Drive and other remote sources.
- Making a plugin — how to write a plugin for Uppy.

## Browser Support

<a href="https://saucelabs.com/u/transloadit-uppy">
  <img src="https://saucelabs.com/browser-matrix/transloadit-uppy.svg" alt="Sauce Test Status"/>
</a>

Note: we aim to support IE10+ and recent versions of Safari, Edge, Chrome, Firefox and Opera. IE6 on the chart above means we recommend setting Uppy to target a `<form>` element, so when Uppy has not yet loaded or is not supported, upload still works. Even on the refrigerator browser. Or, yes, IE6.
