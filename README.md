# Uppy

<img src="http://uppy.io/images/logos/uppy-dog-full.svg" width="120" alt="Uppy logo — a superman puppy in a pink suit" align="right">

<a href="https://www.npmjs.com/package/uppy"><img src="https://img.shields.io/badge/stability-experimental-orange.svg?style=flat-square"></a>
<a href="https://www.npmjs.com/package/uppy"><img src="https://img.shields.io/npm/v/uppy.svg?style=flat-square"></a>
<a href="https://travis-ci.org/transloadit/uppy"><img src="https://img.shields.io/travis/transloadit/uppy/master.svg?style=flat-square" alt="Build Status"></a>

Uppy is (going to be) a sleek, modular file uploader that integrates seemlessly with any framework. It fetches files from local disk, Google Drive, Dropbox, Instagram, remote URLs, cameras and other exciting locations, and then uploads them to the final destination. It’s fast, easy to use and let's you worry about more important problems than building a file uploader.

Uppy is developed by the [Transloadit](https://transloadit.com) team.

Check out [uppy.io](http://uppy.io/) for docs, API, examples and stats.

## Features (some in development)

- Lightweight, modular plugin-based architecture, easy on dependencies :zap:
- Use from a CDN or as a module to import
- Resumable file uploads via the open [tus](http://tus.io/) standard
- Supports picking files from sources like: Webcam, Dropbox, Facebook, bypassing the user's device where possible, syncing between servers directly via [uppy-server](https://github.com/transloadit/uppy-server)
- A nice user interface :sparkles:
- Speaks multiple languages (i18n) :earth_africa:
- Built with accessibility in mind
- Free for the world, forever (as in beer 🍺, pizza 🍕, and liberty 🗽)
- Works great with file encoding and processing backends, such as [Transloadit](http://transloadit.com), works great without (just roll your own Apache/Nginx/Node/etc backend)
- Cute as a puppy, also accepts cat pictures :dog:

## Demo

<img width="700" alt="Uppy UI Demo: modal dialog with a few selected files and an upload button" src="https://github.com/transloadit/uppy/raw/master/uppy-screenshot.jpg">

- [Full featured UI](http://uppy.io/examples/dashboard)
- [Simple Drag & Drop](http://uppy.io/examples/dragdrop)

## Usage

:warning: :construction: **Don’t use Uppy in production just yet, we’re working on it**

### Installing from NPM

```sh
$ npm install uppy --save
```

Bundle with Browserify or Webpack:

```js
import Uppy from 'uppy/lib/core'
import DragDrop from 'uppy/lib/plugins/DragDrop'
import Tus10 from 'uppy/lib/plugins/Tus10'

const uppy = Uppy()
uppy
  .use(DragDrop, {target: 'body'})
  .use(Tus10, {endpoint: '//master.tus.io/files/'})
  .run()
```

Add CSS [uppy.min.css](https://unpkg.com/uppy/dist/uppy.min.css), either to `<head>` of your HTML page or include in JS, if your bundler of choice supports it — transforms and plugins are available for Browserify and Webpack.

Give Uppy a spin [on RequireBin](http://requirebin.com/?gist=54e076cccc929cc567cb0aba38815105).

### Installing from CDN

But if you like, you can also use a pre-built bundle, for example from [unpkg CDN](https://unpkg.com/uppy/). In that case `Uppy` will attach itself to the global `window` object.

1\. Add a script to your the bottom of your HTML’s `<body>`:

```html
<script src="https://unpkg.com/uppy/dist/uppy.min.js"></script>
```

2\. Add CSS to your HTML’s `<head>`:
```html
<link href="https://unpkg.com/uppy/dist/uppy.min.css" rel="stylesheet">
```

3\. Initialize:

```js
<script>
  var uppy = new Uppy.Core({autoProceed: false, debug: true})
  uppy.use(Uppy.DragDrop, {target: '.UppyDragDrop'})
  uppy.use(Uppy.Tus10, {endpoint: '//master.tus.io/files/'})
  uppy.run()
</script>
```

## API

Uppy exposes events that you can subscribe to in your app:

### Event `core:upload-progress` when file upload progress is available

```js
uppy.on('core:upload-progress', (data) => {
  console.log(data.id, data.bytesUploaded, data.bytesTotal)
})
```

### Event `core:upload-success` when one upload is complete

```js
uppy.on('core:upload-success', (fileId, response) => {
  console.log(response.url)
  var img = new Image()
  img.width = 300
  img.alt = fileId
  img.src = response.url
  document.body.appendChild(img)
})
```

### Event `core:success` when all uploads are complete

```js
uppy.on('core:success', (fileCount) => {
  console.log(fileCount)
})
```

## Browser Support

<a href="https://saucelabs.com/u/transloadit-uppy">
  <img src="https://saucelabs.com/browser-matrix/transloadit-uppy.svg" alt="Sauce Test Status"/>
</a>

Note: we aim to support IE10+ and recent versions of Safari, Edge, Chrome, Firefox and Opera. IE6 on the chart above means we recommend setting Uppy to target a `<form>` element, so when Uppy has not yet loaded or is not supported, upload still works. Even on the refrigerator browser. Or, yes, IE6.

## FAQ

### React support?

Yep. Uppy-React component is in the works, in the meantime you can just use it as any other lib with React, [see here](https://github.com/transloadit/uppy/tree/uppy-react/src/uppy-react).

### Can I use it with Rails/Node/Go/PHP?

Yes, whatever you want on the backend will work with `Multipart` plugin, since it just does a `POST` request. If you want resumability, use [one of tus implementations](http://tus.io/implementations.html) 👌🏼

### Do I need to install special service/server for it?

No, as mentioned previosely, `Multipart` plugin is old-school and just works with everything. However, you need `[uppy-server](https://github.com/transloadit/uppy-server)` if you want your users to be able to pick files from Google Drive or Dropbox (more services coming too), and you can add [tus](http://tus.io) is you want resumability in your uploads.

### Does it support S3 direct upload?

Not at the moment, but you can write a plugin and send us a PR. That would be awesome :)

## Contributions are welcome

 - Contributor’s guide in [`website/src/guide/contributing.md`](website/src/guide/contributing.md)
 - Architecture in [`website/src/api/architecture.md`](website/src/api/architecture.md)
 - Changelog to track our release progress (we aim to roll out a release every month): [`CHANGELOG.md`](CHANGELOG.md)

## License

[The MIT License](LICENSE).
