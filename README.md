# Uppy

<img src="http://uppy.io/images/logos/uppy-dog-full.svg" width="120" alt="Uppy logo — a superman puppy in a pink suit" align="right">

<a href="https://www.npmjs.com/package/uppy"><img src="https://img.shields.io/badge/stability-experimental-orange.svg?style=flat-square"></a>
<a href="https://www.npmjs.com/package/uppy"><img src="https://img.shields.io/npm/v/uppy.svg?style=flat-square"></a>
<a href="https://travis-ci.org/transloadit/uppy"><img src="https://img.shields.io/travis/transloadit/uppy/master.svg?style=flat-square" alt="Build Status"></a>

Uppy is a sleek, modular file uploader that integrates seemlessly with any framework. It fetches files from local disk, Google Drive, Dropbox, Instagram, remote URLs, cameras and other exciting locations, and then uploads them to the final destination. It’s fast, easy to use and let's you worry about more important problems than building a file uploader. [Try it live](http://uppy.io/examples/dashboard/).

Uppy is developed by the [Transloadit](https://transloadit.com) team.

Check out docs and examples on [uppy.io](http://uppy.io).

<img width="700" alt="Uppy UI Demo: modal dialog with a few selected files and an upload button" src="https://github.com/transloadit/uppy/raw/master/uppy-screenshot.jpg">

- [Full featured UI](http://uppy.io/examples/dashboard)
- [Simple Drag & Drop](http://uppy.io/examples/dragdrop)

## Features

- Lightweight, modular plugin-based architecture, easy on dependencies :zap:
- Use from a CDN or as a module to import
- Resumable file uploads via the open [tus](http://tus.io/) standard
- Supports picking files from: Webcam, Dropbox, Google Drive, Instagram, bypassing the user’s device where possible, syncing between servers directly via [uppy-server](https://github.com/transloadit/uppy-server)
- A sleek user interface :sparkles:
- Speaks multiple languages (i18n) :earth_africa:
- Built with accessibility in mind
- Free for the world, forever (as in beer 🍺, pizza 🍕, and liberty 🗽)
- Works great with file encoding and processing backends, such as [Transloadit](http://transloadit.com), works great without (just roll your own Apache/Nginx/Node/etc backend)
- Cute as a puppy, also accepts cat pictures :dog:

## Installation

``` bash
$ npm install uppy
```

We recommend installing from NPM and then using a module bundler such as [Webpack](http://webpack.github.io/), [Browserify](http://browserify.org/) or [Rollup.js](http://rollupjs.org/).

Add CSS [uppy.min.css](https://cdn.jsdelivr.net/npm/uppy/dist/uppy.min.css), either to `<head>` of your HTML page or include in JS, if your bundler of choice supports it — transforms and plugins are available for Browserify and Webpack.

If you like, you can also use a pre-built bundle, from [jsDelivr](https://www.jsdelivr.com/package/npm/uppy) or [unpkg CDN](https://unpkg.com/uppy/). In that case `Uppy` will attach itself to the global `window.Uppy` object.

> ⚠️ The bundle currently consists of most Uppy plugins, so this method is not  recommended for production, as your users will have to download all plugins, even if you are using just a few.

1\. Add a script to the bottom of `<body>`:

``` html
<script src="https://cdn.jsdelivr.net/npm/uppy/dist/uppy.min.js"></script>
or
<script src="https://unpkg.com/uppy"></script>
```

2\. Add CSS to `<head>`:
``` html
<link href="https://cdn.jsdelivr.net/npm/uppy/dist/uppy.min.css" rel="stylesheet">
or
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

- [Uppy](http://uppy.io/docs/uppy/) — full list of options, methods and events.
- [Plugins](http://uppy.io/docs/plugins/) — list of Uppy plugins and their options.
- [Server](http://uppy.io/docs/server/) — setting up and running an Uppy Server instance, which adds support for Instagram, Dropbox, Google Drive and other remote sources.
- Architecture & Making a Plugin — how to write a plugin for Uppy [documentation in progress].

## Browser Support

<a href="https://saucelabs.com/u/transloadit-uppy">
  <img src="https://saucelabs.com/browser-matrix/transloadit-uppy.svg" alt="Sauce Test Status"/>
</a>

Note: we aim to support IE10+ and recent versions of Safari, Edge, Chrome, Firefox and Opera. IE6 on the chart above means we recommend setting Uppy to target a `<form>` element, so when Uppy has not yet loaded or is not supported, upload still works. Even on the refrigerator browser. Or, yes, IE6.

## FAQ

### React support?

Yep. Uppy-React component is in the works, in the meantime you can just use it as any other lib with React, [see here](https://github.com/transloadit/uppy/tree/uppy-react/src/uppy-react).

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
