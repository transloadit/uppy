# [Uppy](http://uppy.io)

<img src="http://uppy.io/images/logos/uppy-dog-head-arrow.svg" width="120" alt="Uppy logo — a superman puppy in a pink suit" align="right">

<a href="https://www.npmjs.com/package/uppy"><img src="https://img.shields.io/npm/v/uppy.svg?style=flat-square"></a>
<a href="https://travis-ci.org/transloadit/uppy"><img src="https://img.shields.io/travis/transloadit/uppy/master.svg?style=flat-square" alt="Build Status"></a>
<a href="https://www.npmjs.com/package/uppy"><img src="https://img.shields.io/badge/stability-experimental-orange.svg?style=flat-square"></a>

Uppy is a sleek, modular file uploader that integrates seemlessly with any application. It’s fast, easy to use and lets you worry about more important problems than building a file uploader.

- **Fetch** files from local disk, Google Drive, Dropbox, Instagram, or snap and record selfies with a camera;
- **Preview** and edit metadata with a nice interface;
- **Upload** to the final destination, optionally processing/encoding on the way;

**[Read the docs](http://uppy.io/docs)** | **[Try Uppy](http://uppy.io/examples/dashboard/)**

Uppy is being developed by the [Transloadit](https://transloadit.com) team.

## Example

<img width="700" alt="Uppy UI Demo: modal dialog with a few selected files and an upload button" src="https://github.com/transloadit/uppy/raw/master/uppy-screenshot.jpg">

```js
const Uppy = require('uppy/lib/core')
const Dashboard = require('uppy/lib/plugins/Dashboard')
const Webcam = require('uppy/lib/plugins/Webcam')
const GoogleDrive = require('uppy/lib/plugins/GoogleDrive')
const Tus = require('uppy/lib/plugins/Tus')

const uppy = Uppy({ autoProceed: false })
  .use(Dashboard, { trigger: '#select-files' })
  .use(Webcam, { target: Dashboard })
  .use(GoogleDrive, { target: Dashboard, host: 'https://server.uppy.io' })
  .use(Tus, { endpoint: '://master.tus.io/files/' })
  .run()
  .on('core:success', files => console.log(`Successfully uploaded these files: ${files}`))
```

**[Try it online](http://uppy.io/examples/dashboard/)** or **[read the docs](http://uppy.io/docs)**  for details on how to use Uppy and its plugins.

## Features

- Lightweight, modular plugin-based architecture, easy on dependencies :zap:
- Resumable file uploads via the open [tus](http://tus.io/) standard
- Supports picking files from: Webcam, Dropbox, Google Drive, Instagram, bypassing the user’s device where possible, syncing between servers directly via [uppy-server](https://github.com/transloadit/uppy-server)
- Works great with file encoding and processing backends, such as [Transloadit](http://transloadit.com), works great without (just roll your own Apache/Nginx/Node/etc backend)
- Sleek user interface :sparkles:
- Optional file recovering (after a browser crash) with [Golden Retriever](https://uppy.io/docs/golden-retriever/)
- Speaks multiple languages (i18n) :earth_africa:
- Built with accessibility in mind
- Free for the world, forever (as in beer 🍺, pizza 🍕, and liberty 🗽)
- Cute as a puppy, also accepts cat pictures :dog:

## Installation

``` bash
$ npm install uppy --save
```

We recommend installing from NPM and then using a module bundler such as [Webpack](http://webpack.github.io/), [Browserify](http://browserify.org/) or [Rollup.js](http://rollupjs.org/).

Add CSS [uppy.min.css](https://unpkg.com/uppy/dist/uppy.min.css), either to `<head>` of your HTML page or include in JS, if your bundler of choice supports it — transforms and plugins are available for Browserify and Webpack.

If you like, you can also use a pre-built bundle, for example from [unpkg CDN](https://unpkg.com/uppy/). In that case `Uppy` will attach itself to the global `window.Uppy` object.

> ⚠️ The bundle currently consists of most Uppy plugins, so this method is not recommended for production, as your users will have to download all plugins, when you are likely using just a few.

1\. Add a script to the bottom of `<body>`:

``` html
<script src="https://unpkg.com/uppy"></script>
```

2\. Add CSS to `<head>`:
``` html
<link href="https://unpkg.com/uppy/dist/uppy.min.css" rel="stylesheet">
```

3\. Initialize:

``` html
<script>
  var uppy = Uppy.Core()
  uppy.use(Uppy.DragDrop, { target: '.UppyDragDrop' })
  uppy.use(Uppy.Tus, { endpoint: '//master.tus.io/files/' })
  uppy.run()
</script>
```

## Documentation

- [Uppy](http://uppy.io/docs/uppy/) — full list of options, methods and events.
- [Plugins](http://uppy.io/docs/plugins/) — list of Uppy plugins and their options.
- [Server](http://uppy.io/docs/server/) — setting up and running an Uppy Server instance, which adds support for Instagram, Dropbox, Google Drive and other remote sources.
- [React](/docs/react/) — components to integrate uppy UI plugins with react apps.
- Architecture & Making a Plugin — how to write a plugin for Uppy [documentation in progress].

## Plugins

- `Tus` — resumable uploads via [tus.io](http://tus.io) open standard
- `XHRUpload` — regular uploads for any backend out there
- `Transloadit` — support for [Transloadit](http://transloadit.com)’s robust file encoding and processing backend
- `Dashboard` — universal UI with previews, progress bars, metadata editor and all the cool stuff
- `DragDrop` — plain and simple drag and drop area
- `FileInput` — even more plain “select files” button
- `ProgressBar` — minimal progress bar that fills itself when upload progresses
- `StatusBar` — more detailed progress, pause/resume/cancel buttons, percentage, speed, uploaded/total sizes (included by default with `Dashboard`)
- `Informer` — send notifications like “smile” before taking a selfie or “upload failed” when all is lost (also included by default with `Dashboard`)
- `GoldenRetriever` — restores files after a browser crash, like it’s nothing
- `ReduxDevTools` — for your emerging [time traveling](https://github.com/gaearon/redux-devtools) needs
- `GoogleDrive` — select files from [Google Drive](https://www.google.com/drive/)
- `Dropbox` — select files from [Dropbox](https://www.dropbox.com/)
- `Instagram` — you guessed right — select files from [Instagram](https://www.instagram.com/)
- `Webcam` — snap and record those selfies 📷

## Browser Support

<a href="https://saucelabs.com/u/transloadit-uppy">
  <img src="https://saucelabs.com/browser-matrix/transloadit-uppy.svg" alt="Sauce Test Status"/>
</a>

Note: we aim to support IE10+ and recent versions of Safari, Edge, Chrome, Firefox and Opera.

## FAQ

### React support?

Yep, see [Uppy React docs](https://uppy.io/docs/react/).

### Can I use it with Rails/Node/Go/PHP?

Yes, whatever you want on the backend will work with `XHRUpload` plugin, since it just does a `POST` or `PUT` request. If you want resumability, use [one of tus implementations](http://tus.io/implementations.html) 👌🏼

### Do I need to install special service/server for it?

No, as mentioned previously, `XHRUpload` plugin is old-school and just works with everything. However, you need [`uppy-server`](https://github.com/transloadit/uppy-server) if you’d like your users to be able to pick files from Google Drive or Dropbox (more services coming). And you can add [tus](http://tus.io) if you want resumability.

### Does Uppy support S3 uploads?

Yes, since 0.18, there is an S3 plugin. Check out the [docs](https://uppy.io/docs/aws-s3/) for more information.

## Contributions are welcome

 - Contributor’s guide in [`website/src/guide/contributing.md`](website/src/guide/contributing.md)
 - Changelog to track our release progress (we aim to roll out a release every month): [`CHANGELOG.md`](CHANGELOG.md)

## License

[The MIT License](LICENSE).
