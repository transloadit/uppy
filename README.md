# Uppy

<img src="http://uppy.io/images/logos/uppy-dog-full.svg" width="150" alt="Uppy logo — a puppy superman">

<a href="https://www.npmjs.com/package/uppy"><img src="https://img.shields.io/badge/stability-experimental-orange.svg?style=flat-square"></a>
<a href="https://www.npmjs.com/package/uppy"><img src="https://img.shields.io/npm/v/uppy.svg?style=flat-square"></a>
<a href="https://travis-ci.org/transloadit/uppy"><img src="https://img.shields.io/travis/transloadit/uppy/master.svg?style=flat-square" alt="Build Status"></a>
<a href="https://saucelabs.com/u/transloadit-uppy"><img src="https://saucelabs.com/buildstatus/transloadit-uppy" alt="Sauce Test Status"></a>

Uppy is (going to be) a cool JavaScript file uploader that fetches files for you from local disk, Google Drive, Dropbox, Instagram, remote URLs, cameras and other exciting locations, and then uploads them to wherever you want. Uppy is being developed by the [Transloadit](https://transloadit.com) team because we want file uploading experience to be better — both for users and developers.

Check out [uppy.io](http://uppy.io/) for docs, API, examples and stats.

## Features

- Lightweight / easy on dependencies
- Usable as a bundle straight from a CDN as well as a module to import
- Resumable file uploads via the open [tus](http://tus.io/) standard
- Uppy speaks multiple languages (i18n support)
- Works great with file encoding and processing backends, such as [Transloadit](http://transloadit.com)
- Small core, modular plugin-based architecture.
- Cute as a puppy :dog:, also accepts cat pictures

## Demo

<img width="600" alt="Uppy UI Demo: modal dialog with a few selected files and an upload button" src="https://cloud.githubusercontent.com/assets/1199054/16790119/2dd6eda2-4881-11e6-908b-4de5581d2de6.png">

- [Full featured UI](http://uppy.io/examples/modal)
- [Simple Drag & Drop](http://uppy.io/examples/dragdrop)

## Usage

:warning: **Don’t use Uppy in production just yet, we’re working on it**

It’s easy to start using Uppy, we recommend installing from npm with `npm install uppy` and then:

``` javascript
import Uppy from 'uppy/core'
import { DragDrop, Tus10 } from 'uppy/plugins'

const uppy = new Uppy({wait: false})
const files = uppy
  .use(DragDrop, {target: '#upload-target'})
  .use(Tus10, {endpoint: 'http://master.tus.io:8080/files/'})
  .run()
```

But if you like, you can also use a pre-built bundle, in that case `Uppy` will attach itself to the global `window` object:

``` javascript
<script src="uppy.min.js"></script>
<script>
var uppy = new Uppy.Core({locales: Uppy.locales.ru_RU, debug: true});
  uppy.use(Uppy.plugins.DragDrop, {target: '.UppyDragDrop'});
  uppy.use(Uppy.plugins.Tus10, {endpoint: 'http://master.tus.io:3020/files/'});
  uppy.run();
</script>
```

## Browser Support

<a href="https://saucelabs.com/u/transloadit-uppy">
  <img src="https://saucelabs.com/browser-matrix/transloadit-uppy.svg" alt="Sauce Test Status"/>
</a> 

## Contributions are welcome

 - Contributor’s guide in [`website/src/guide/contributing.md`](website/src/guide/contributing.md)
 - Architecture in [`website/src/api/architecture.md`](website/src/api/architecture.md)
 - Changelog to track our release progress (we aim to roll out a release every month): [`CHANGELOG.md`](CHANGELOG.md)
 
## License
 
[The MIT License](LICENSE).
