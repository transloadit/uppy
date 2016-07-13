# Uppy

<img src="http://uppy.io/images/logos/uppy-dog-full.svg" width="100" alt="Uppy logo — a puppy superman">

<a href="https://www.npmjs.com/package/uppy"><img src="https://img.shields.io/badge/stability-experimental-orange.svg?style=flat-square"></a>
<a href="https://www.npmjs.com/package/uppy"><img src="https://img.shields.io/npm/v/uppy.svg?style=flat-square"></a>
<a href="https://travis-ci.org/transloadit/uppy"><img src="https://img.shields.io/travis/transloadit/uppy/master.svg?style=flat-square" alt="Build Status"></a>
<a href="https://saucelabs.com/u/transloadit-uppy"><img src="https://saucelabs.com/buildstatus/transloadit-uppy?style=flat-square" alt="Sauce Test Status"></a>

Uppy is (going to be) a JavaScript file uploader that fetches files from Dropbox, Instagram, local disk, remote URLs, and other exciting locations. It has a plugin-based architecture, first-class support for resumable uploads according to the open standard: [tus](http://tus.io/), and custom encoding backends, making it extensible and robust. Uppy is in the early stages of development and should not be used for anything serious yet.

Check out [uppy.io](http://uppy.io/) for docs, API, examples and stats.

## Features

- Lightweight / easy on dependencies
- Usable as a bundle straight from a CDN as well as a module to import
- Resumable file uploads via the open [tus](http://tus.io/) standard
- Uppy speaks multiple languages (i18n support)
- Works great with [Transloadit](http://transloadit.com). Works great without
- Small core, modular architecture. Everything is a plugin
- Qute as a puppy, also accepts cat pictures

## Demo

- [Full featured UI](http://uppy.io/examples/modal)
- [Simple Drag & Drop](http://uppy.io/examples/dragdrop)

## Usage

It’s easy to start using Uppy, we recommend installing from npm with `npm install uppy` and then:

```javascript
import Uppy from 'uppy/core'
import { DragDrop, Tus10 } from 'uppy/plugins'

const uppy = new Uppy({wait: false})
const files = uppy
  .use(DragDrop, {selector: '#upload-target'})
  .use(Tus10, {endpoint: 'http://master.tus.io:8080/files/'})
  .run()
```

But if you like, you can also use a pre-built bundle, in that case Uppy will attach itself to `window.Uppy`:

```javascript
<script src="uppy.min.js"></script>
<script>
var uppy = new Uppy.Core({locales: Uppy.locales.ru_RU, debug: true});
  uppy.use(Uppy.plugins.DragDrop, {target: '.UppyDragDrop'});
  uppy.use(Uppy.plugins.Tus10, {endpoint: 'http://master.tus.io:3020/files/'});
  uppy.run();
</script>
```

## Contributors are welcome

 - Contributor's guide in [`website/src/guide/contributing.md`](website/src/guide/contributing.md)
 - Architecture in [`website/src/api/architecture.md`](website/src/api/architecture.md)
 - Open todos in for a minimum valuable product [`CHANGELOG.md`](CHANGELOG.md#todo)
