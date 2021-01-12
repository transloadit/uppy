# [Uppy](https://uppy.io)

<img src="https://uppy.io/images/logos/uppy-logo-2019.svg" width="120" alt="Uppy logo: a superman puppy in a pink suit" align="right">

<a href="https://www.npmjs.com/package/uppy"><img src="https://img.shields.io/npm/v/uppy.svg?style=flat-square"></a>

Uppy is a sleek, modular JavaScript file uploader that integrates seamlessly with any application. It’s fast, easy to use and lets you worry about more important problems than building a file uploader.

- **Fetch** files from local disk, remote URLs, Google Drive, Dropbox, Box, Instagram or snap and record selfies with a camera
- **Preview** and edit metadata with a nice interface
- **Upload** to the final destination, optionally process/encode

<img src="https://github.com/transloadit/uppy/raw/master/assets/uppy-demo-oct-2018.gif">

**[Read the docs](https://uppy.io/docs)** | **[Try Uppy](https://uppy.io/examples/dashboard/)**

<a href="https://transloadit.com" target="_blank"><img width="185" src="https://github.com/transloadit/uppy/raw/master/assets/developed-by-transloadit.png"></a>

Uppy is being developed by the folks at [Transloadit](https://transloadit.com), a versatile file encoding service.

## Example

Code used in the above example:

```js
const Uppy = require('@uppy/core')
const Dashboard = require('@uppy/dashboard')
const GoogleDrive = require('@uppy/google-drive')
const Instagram = require('@uppy/instagram')
const Webcam = require('@uppy/webcam')
const Tus = require('@uppy/tus')

const uppy = new Uppy({ autoProceed: false })
  .use(Dashboard, { trigger: '#select-files' })
  .use(GoogleDrive, { target: Dashboard, companionUrl: 'https://companion.uppy.io' })
  .use(Instagram, { target: Dashboard, companionUrl: 'https://companion.uppy.io' })
  .use(Webcam, { target: Dashboard })
  .use(Tus, { endpoint: 'https://tusd.tusdemo.net/files/' })
  .on('complete', (result) => {
    console.log('Upload result:', result)
  })
```

**[Try it online](https://uppy.io/examples/dashboard/)** or **[read the docs](https://uppy.io/docs)** for more details on how to use Uppy and its plugins.

## Features

- Lightweight, modular plugin-based architecture, easy on dependencies :zap:
- Resumable file uploads via the open [tus](https://tus.io/) standard, so large uploads survive network hiccups
- Supports picking files from: Webcam, Dropbox, Box, Google Drive, Instagram, bypassing the user’s device where possible, syncing between servers directly via [@uppy/companion](https://uppy.io/docs/companion)
- Works great with file encoding and processing backends, such as [Transloadit](https://transloadit.com), works great without (just roll your own Apache/Nginx/Node/FFmpeg/etc backend)
- Sleek user interface :sparkles:
- Optional file recovery (after a browser crash) with [Golden Retriever](https://uppy.io/docs/golden-retriever/)
- Speaks multiple languages (i18n) :earth_africa:
- Built with accessibility in mind
- Free for the world, forever (as in beer 🍺, pizza 🍕, and liberty 🗽)
- Cute as a puppy, also accepts cat pictures :dog:

## Installation

``` bash
$ npm install @uppy/core @uppy/dashboard @uppy/tus
```

We recommend installing from npm and then using a module bundler such as [Webpack](https://webpack.js.org/), [Browserify](http://browserify.org/) or [Rollup.js](http://rollupjs.org/).

Add CSS [uppy.min.css](https://releases.transloadit.com/uppy/v1.24.0/uppy.min.css), either to your HTML page's `<head>` or include in JS, if your bundler of choice supports it — transforms and plugins are available for Browserify and Webpack.

Alternatively, you can also use a pre-built bundle from Transloadit's CDN: Edgly. In that case `Uppy` will attach itself to the global `window.Uppy` object.

> ⚠️ The bundle currently consists of most Uppy plugins, so this method is not recommended for production, as your users will have to download all plugins when you are likely using just a few.

```html
<!-- 1. Add CSS to `<head>` -->
<link href="https://releases.transloadit.com/uppy/v1.24.0/uppy.min.css" rel="stylesheet">

<!-- 2. Add JS before the closing `</body>` -->
<script src="https://releases.transloadit.com/uppy/v1.24.0/uppy.min.js"></script>

<!-- 3. Initialize -->
<div class="UppyDragDrop"></div>
<script>
  var uppy = Uppy.Core()
  uppy.use(Uppy.DragDrop, { target: '.UppyDragDrop' })
  uppy.use(Uppy.Tus, { endpoint: '//tusd.tusdemo.net/files/' })
</script>
```

## Documentation

- [Uppy](https://uppy.io/docs/uppy/) — full list of options, methods and events
- [Plugins](https://uppy.io/docs/plugins/) — list of Uppy plugins and their options
- [Companion](https://uppy.io/docs/companion/) — setting up and running a Companion instance, which adds support for Instagram, Dropbox, Box, Google Drive and remote URLs
- [React](https://uppy.io/docs/react/) — components to integrate Uppy UI plugins with React apps
- [Architecture & Writing a Plugin](https://uppy.io/docs/writing-plugins/) — how to write a plugin for Uppy

## Plugins

[List of plugins and their common options](https://uppy.io/docs/plugins/)

### UI Elements

- [`Dashboard`](https://uppy.io/docs/dashboard/) — universal UI with previews, progress bars, metadata editor and all the cool stuff. Required for most UI plugins like Webcam and Instagram
- [`Progress Bar`](https://uppy.io/docs/progress-bar/) — minimal progress bar that fills itself when upload progresses
- [`Status Bar`](https://uppy.io/docs/status-bar/) — more detailed progress, pause/resume/cancel buttons, percentage, speed, uploaded/total sizes (included by default with `Dashboard`)
- [`Informer`](https://uppy.io/docs/informer/) — send notifications like “smile” before taking a selfie or “upload failed” when all is lost (also included by default with `Dashboard`)

### Sources

- [`Drag & Drop`](https://uppy.io/docs/drag-drop/) — plain and simple drag and drop area
- [`File Input`](https://uppy.io/docs/file-input/) — even plainer “select files” button
- [`Webcam`](https://uppy.io/docs/webcam/) — snap and record those selfies 📷
- ⓒ [`Google Drive`](https://uppy.io/docs/google-drive/) — import files from Google Drive
- ⓒ [`Dropbox`](https://uppy.io/docs/dropbox/) — import files from Dropbox
- ⓒ [`Box`](https://uppy.io/docs/box/) — import files from Box
- ⓒ [`Instagram`](https://uppy.io/docs/instagram/) — import images and videos from Instagram
- ⓒ [`Facebook`](https://uppy.io/docs/facebook/) — import images and videos from Facebook
- ⓒ [`OneDrive`](https://uppy.io/docs/onedrive/) — import files from Microsoft OneDrive
- ⓒ [`Import From URL`](https://uppy.io/docs/url/) — import direct URLs from anywhere on the web

The ⓒ mark means that [`@uppy/companion`](https://uppy.io/docs/companion), a server-side component, is needed for a plugin to work.

### Destinations

- [`Tus`](https://uppy.io/docs/tus/) — resumable uploads via the open [tus](http://tus.io) standard
- [`XHR Upload`](https://uppy.io/docs/xhr-upload/) — regular uploads for any backend out there (like Apache, Nginx)
- [`AWS S3`](https://uppy.io/docs/aws-s3/) — plain upload to AWS S3 or compatible services
- [`AWS S3 Multipart`](https://uppy.io/docs/aws-s3-multipart/) — S3-style "Multipart" upload to AWS or compatible services

### File Processing

- [`Robodog`](https://uppy.io/docs/robodog/) — user friendly abstraction to do file processing with Transloadit
- [`Transloadit`](https://uppy.io/docs/transloadit/) — support for [Transloadit](http://transloadit.com)’s robust file uploading and encoding backend

### Miscellaneous

- [`Golden Retriever`](https://uppy.io/docs/golden-retriever/) — restores files after a browser crash, like it’s nothing
- [`Thumbnail Generator`](https://uppy.io/docs/thumbnail-generator/) — generates image previews (included by default with `Dashboard`)
- [`Form`](https://uppy.io/docs/form/) — collects metadata from `<form>` right before an Uppy upload, then optionally appends results back to the form
- [`Redux`](https://uppy.io/docs/redux/) — for your emerging [time traveling](https://github.com/gaearon/redux-devtools) needs

## React

- [React](https://uppy.io/docs/react/) — components to integrate Uppy UI plugins with React apps
- [React Native](https://uppy.io//docs/react/native/) — basic Uppy component for React Native with Expo

## Browser Support

<a href="https://saucelabs.com/u/transloadit-uppy">
  <img src="https://saucelabs.com/browser-matrix/transloadit-uppy.svg" alt="Sauce Test Status"/>
</a>

We aim to support IE11 and recent versions of Safari, Edge, Chrome, Firefox and Opera.

We still run end-to-end tests with IE10, but we are not actively supporting it or fixing visual / minor issues.

### Polyfills

Uppy heavily uses Promises. If your target environment [does not support Promises](https://caniuse.com/#feat=promises), use a polyfill like `es6-promise` before initializing Uppy.

When using remote providers like Google Drive or Dropbox, the Fetch API is used. If your target environment does not support the [Fetch API](https://caniuse.com/#feat=fetch), use a polyfill like `whatwg-fetch` before initializing Uppy. The Fetch API polyfill must be loaded _after_ the Promises polyfill, because Fetch uses Promises.

With a module bundler, you can use the required polyfills like so:

```shell
npm install es6-promise whatwg-fetch
```
```js
require('es6-promise/auto')
require('whatwg-fetch')
const Uppy = require('@uppy/core')
```

If you're using Uppy from CDN, `es6-promise` and `whatwg-fetch` are already included in the bundle, so no need to include anything additionally:

```html
<script src="https://releases.transloadit.com/uppy/v1.24.0/uppy.min.js"></script>
```

## FAQ

### Why not just use `<input type="file">`?

Having no JavaScript beats having a lot of it, so that’s a fair question! Running an uploading & encoding business for ten years though we found that in cases, the file input leaves some to be desired:

- We received complaints about broken uploads and found that resumable uploads are important, especially for big files and to be inclusive towards people on poorer connections (we also launched [tus.io](https://tus.io) to attack that problem). Uppy uploads can survive network outages and browser crashes or accidental navigate-aways.
- Uppy supports editing meta information before uploading (and e.g. cropping is planned).
- There’s the situation where people are using their mobile devices and want to upload on the go, but they have their picture on Instagram, files in Dropbox or just a plain file URL from anywhere on the open web. Uppy allows to pick files from those and push it to the destination without downloading it to your mobile device first.
- Accurate upload progress reporting is an issue on many platforms.
- Some file validation — size, type, number of files — can be done on the client with Uppy.
- Uppy integrates webcam support, in case your users want to upload a picture/video/audio that does not exist yet :)
- A larger drag and drop surface can be pleasant to work with. Some people also like that you can control the styling, language, etc.
- Uppy is aware of encoding backends. Often after an upload, the server needs to rotate, detect faces, optimize for iPad, or what have you. Uppy can track progress of this and report back to the user in different ways.
- Sometimes you might want your uploads to happen while you continue to interact on the same single page.

Not all apps need all of these features. An `<input type="file">` is fine in many situations. But these were a few things that our customers hit / asked about enough to spark us to develop Uppy.

### Why is all this goodness free?

Transloadit’s team is small and we have a shared ambition to make a living from open source. By giving away projects like [tus.io](https://tus.io) and [Uppy](https://uppy.io), we’re hoping to advance the state of the art, make life a tiny little bit better for everyone and in doing so have rewarding jobs and get some eyes on our commercial service: [a content ingestion & processing platform](https://transloadit.com).

Our thinking is that if just a fraction of our open source userbase can see the appeal of hosted versions straight from the source, that could already be enough to sustain our work. So far this is working out! We’re able to dedicate 80% of our time to open source and haven’t gone bankrupt yet. :D

### Does Uppy support React?

Yep, we have Uppy React components, please see [Uppy React docs](https://uppy.io/docs/react/).

### Does Uppy support S3 uploads?

Yes, there is an S3 plugin, please check out the [docs](https://uppy.io/docs/aws-s3/) for more.

### Do I need to install a special service/server for Uppy? Can I use it with Rails/Node/Go/PHP?

Yes, whatever you want on the backend will work with `@uppy/xhr-upload` plugin, since it just does a `POST` or `PUT` request. Here’s a [PHP backend example](https://uppy.io/docs/xhr-upload/#Uploading-to-a-PHP-Server).

If you want resumability with the Tus plugin, use [one of the tus server implementations](https://tus.io/implementations.html) 👌🏼

And you’ll need [`@uppy/companion`](https://uppy.io/docs/companion) if you’d like your users to be able to pick files from Instagram, Google Drive, Dropbox or via direct URLs (with more services coming).

## Contributions are welcome

- Contributor’s guide in [`.github/CONTRIBUTING.md`](.github/CONTRIBUTING.md)
- Changelog to track our release progress (we aim to roll out a release every month): [`CHANGELOG.md`](CHANGELOG.md)

## Used by

Uppy is used by: [Photobox](http://photobox.com), [Issuu](https://issuu.com/), [Law Insider](https://lawinsider.com), [Cool Tabs](https://cool-tabs.com), [Soundoff](https://soundoff.io), [Scrumi](https://www.scrumi.io/), [Crive](https://crive.co/) and others.

Use Uppy in your project? [Let us know](https://github.com/transloadit/uppy/issues/769)!

## Contributors

<!--contributors-->
[<img alt="arturi" src="https://avatars2.githubusercontent.com/u/1199054?v=4&s=117" width="117">](https://github.com/arturi) |[<img alt="goto-bus-stop" src="https://avatars1.githubusercontent.com/u/1006268?v=4&s=117" width="117">](https://github.com/goto-bus-stop) |[<img alt="kvz" src="https://avatars2.githubusercontent.com/u/26752?v=4&s=117" width="117">](https://github.com/kvz) |[<img alt="ifedapoolarewaju" src="https://avatars1.githubusercontent.com/u/8383781?v=4&s=117" width="117">](https://github.com/ifedapoolarewaju) |[<img alt="hedgerh" src="https://avatars2.githubusercontent.com/u/2524280?v=4&s=117" width="117">](https://github.com/hedgerh) |[<img alt="AJvanLoon" src="https://avatars0.githubusercontent.com/u/15716628?v=4&s=117" width="117">](https://github.com/AJvanLoon) |
:---: |:---: |:---: |:---: |:---: |:---: |
[arturi](https://github.com/arturi) |[goto-bus-stop](https://github.com/goto-bus-stop) |[kvz](https://github.com/kvz) |[ifedapoolarewaju](https://github.com/ifedapoolarewaju) |[hedgerh](https://github.com/hedgerh) |[AJvanLoon](https://github.com/AJvanLoon) |

[<img alt="nqst" src="https://avatars0.githubusercontent.com/u/375537?v=4&s=117" width="117">](https://github.com/nqst) |[<img alt="lakesare" src="https://avatars1.githubusercontent.com/u/7578559?v=4&s=117" width="117">](https://github.com/lakesare) |[<img alt="kiloreux" src="https://avatars0.githubusercontent.com/u/6282557?v=4&s=117" width="117">](https://github.com/kiloreux) |[<img alt="sadovnychyi" src="https://avatars3.githubusercontent.com/u/193864?v=4&s=117" width="117">](https://github.com/sadovnychyi) |[<img alt="samuelayo" src="https://avatars1.githubusercontent.com/u/14964486?v=4&s=117" width="117">](https://github.com/samuelayo) |[<img alt="richardwillars" src="https://avatars3.githubusercontent.com/u/291004?v=4&s=117" width="117">](https://github.com/richardwillars) |
:---: |:---: |:---: |:---: |:---: |:---: |
[nqst](https://github.com/nqst) |[lakesare](https://github.com/lakesare) |[kiloreux](https://github.com/kiloreux) |[sadovnychyi](https://github.com/sadovnychyi) |[samuelayo](https://github.com/samuelayo) |[richardwillars](https://github.com/richardwillars) |

[<img alt="zcallan" src="https://avatars0.githubusercontent.com/u/13760738?v=4&s=117" width="117">](https://github.com/zcallan) |[<img alt="ajkachnic" src="https://avatars3.githubusercontent.com/u/44317699?v=4&s=117" width="117">](https://github.com/ajkachnic) |[<img alt="tim-kos" src="https://avatars1.githubusercontent.com/u/15005?v=4&s=117" width="117">](https://github.com/tim-kos) |[<img alt="janko" src="https://avatars2.githubusercontent.com/u/795488?v=4&s=117" width="117">](https://github.com/janko) |[<img alt="wilkoklak" src="https://avatars1.githubusercontent.com/u/17553085?v=4&s=117" width="117">](https://github.com/wilkoklak) |[<img alt="oliverpool" src="https://avatars0.githubusercontent.com/u/3864879?v=4&s=117" width="117">](https://github.com/oliverpool) |
:---: |:---: |:---: |:---: |:---: |:---: |
[zcallan](https://github.com/zcallan) |[ajkachnic](https://github.com/ajkachnic) |[tim-kos](https://github.com/tim-kos) |[janko](https://github.com/janko) |[wilkoklak](https://github.com/wilkoklak) |[oliverpool](https://github.com/oliverpool) |

[<img alt="Botz" src="https://avatars3.githubusercontent.com/u/2706678?v=4&s=117" width="117">](https://github.com/Botz) |[<img alt="dependabot[bot]" src="https://avatars0.githubusercontent.com/in/29110?v=4&s=117" width="117">](https://github.com/apps/dependabot) |[<img alt="mcallistertyler" src="https://avatars1.githubusercontent.com/u/14939210?v=4&s=117" width="117">](https://github.com/mcallistertyler) |[<img alt="mokutsu-coursera" src="https://avatars3.githubusercontent.com/u/65177495?v=4&s=117" width="117">](https://github.com/mokutsu-coursera) |[<img alt="DJWassink" src="https://avatars3.githubusercontent.com/u/1822404?v=4&s=117" width="117">](https://github.com/DJWassink) |[<img alt="taoqf" src="https://avatars3.githubusercontent.com/u/15901911?v=4&s=117" width="117">](https://github.com/taoqf) |
:---: |:---: |:---: |:---: |:---: |:---: |
[Botz](https://github.com/Botz) |[dependabot[bot]](https://github.com/apps/dependabot) |[mcallistertyler](https://github.com/mcallistertyler) |[mokutsu-coursera](https://github.com/mokutsu-coursera) |[DJWassink](https://github.com/DJWassink) |[taoqf](https://github.com/taoqf) |

[<img alt="tuoxiansp" src="https://avatars1.githubusercontent.com/u/3960056?v=4&s=117" width="117">](https://github.com/tuoxiansp) |[<img alt="elenalape" src="https://avatars2.githubusercontent.com/u/22844059?v=4&s=117" width="117">](https://github.com/elenalape) |[<img alt="gavboulton" src="https://avatars0.githubusercontent.com/u/3900826?v=4&s=117" width="117">](https://github.com/gavboulton) |[<img alt="bertho-zero" src="https://avatars0.githubusercontent.com/u/8525267?v=4&s=117" width="117">](https://github.com/bertho-zero) |[<img alt="tranvansang" src="https://avatars1.githubusercontent.com/u/13043196?v=4&s=117" width="117">](https://github.com/tranvansang) |[<img alt="ap--" src="https://avatars1.githubusercontent.com/u/1463443?v=4&s=117" width="117">](https://github.com/ap--) |
:---: |:---: |:---: |:---: |:---: |:---: |
[tuoxiansp](https://github.com/tuoxiansp) |[elenalape](https://github.com/elenalape) |[gavboulton](https://github.com/gavboulton) |[bertho-zero](https://github.com/bertho-zero) |[tranvansang](https://github.com/tranvansang) |[ap--](https://github.com/ap--) |

[<img alt="ofhope" src="https://avatars3.githubusercontent.com/u/1826459?v=4&s=117" width="117">](https://github.com/ofhope) |[<img alt="mrbatista" src="https://avatars0.githubusercontent.com/u/6544817?v=4&s=117" width="117">](https://github.com/mrbatista) |[<img alt="MikeKovarik" src="https://avatars0.githubusercontent.com/u/3995401?v=4&s=117" width="117">](https://github.com/MikeKovarik) |[<img alt="pauln" src="https://avatars3.githubusercontent.com/u/574359?v=4&s=117" width="117">](https://github.com/pauln) |[<img alt="szh" src="https://avatars2.githubusercontent.com/u/546965?v=4&s=117" width="117">](https://github.com/szh) |[<img alt="toadkicker" src="https://avatars1.githubusercontent.com/u/523330?v=4&s=117" width="117">](https://github.com/toadkicker) |
:---: |:---: |:---: |:---: |:---: |:---: |
[ofhope](https://github.com/ofhope) |[mrbatista](https://github.com/mrbatista) |[MikeKovarik](https://github.com/MikeKovarik) |[pauln](https://github.com/pauln) |[szh](https://github.com/szh) |[toadkicker](https://github.com/toadkicker) |

[<img alt="mejiaej" src="https://avatars1.githubusercontent.com/u/4699893?v=4&s=117" width="117">](https://github.com/mejiaej) |[<img alt="johnnyperkins" src="https://avatars3.githubusercontent.com/u/16482282?v=4&s=117" width="117">](https://github.com/johnnyperkins) |[<img alt="dargmuesli" src="https://avatars2.githubusercontent.com/u/4778485?v=4&s=117" width="117">](https://github.com/dargmuesli) |[<img alt="manuelkiessling" src="https://avatars2.githubusercontent.com/u/206592?v=4&s=117" width="117">](https://github.com/manuelkiessling) |[<img alt="nndevstudio" src="https://avatars2.githubusercontent.com/u/22050968?v=4&s=117" width="117">](https://github.com/nndevstudio) |[<img alt="ogtfaber" src="https://avatars2.githubusercontent.com/u/320955?v=4&s=117" width="117">](https://github.com/ogtfaber) |
:---: |:---: |:---: |:---: |:---: |:---: |
[mejiaej](https://github.com/mejiaej) |[johnnyperkins](https://github.com/johnnyperkins) |[dargmuesli](https://github.com/dargmuesli) |[manuelkiessling](https://github.com/manuelkiessling) |[nndevstudio](https://github.com/nndevstudio) |[ogtfaber](https://github.com/ogtfaber) |

[<img alt="sksavant" src="https://avatars1.githubusercontent.com/u/1040701?v=4&s=117" width="117">](https://github.com/sksavant) |[<img alt="sunil-shrestha" src="https://avatars3.githubusercontent.com/u/2129058?v=4&s=117" width="117">](https://github.com/sunil-shrestha) |[<img alt="yonahforst" src="https://avatars3.githubusercontent.com/u/1440796?v=4&s=117" width="117">](https://github.com/yonahforst) |[<img alt="stephentuso" src="https://avatars2.githubusercontent.com/u/11889560?v=4&s=117" width="117">](https://github.com/stephentuso) |[<img alt="mskelton" src="https://avatars3.githubusercontent.com/u/25914066?v=4&s=117" width="117">](https://github.com/mskelton) |[<img alt="ahmedkandel" src="https://avatars3.githubusercontent.com/u/28398523?v=4&s=117" width="117">](https://github.com/ahmedkandel) |
:---: |:---: |:---: |:---: |:---: |:---: |
[sksavant](https://github.com/sksavant) |[sunil-shrestha](https://github.com/sunil-shrestha) |[yonahforst](https://github.com/yonahforst) |[stephentuso](https://github.com/stephentuso) |[mskelton](https://github.com/mskelton) |[ahmedkandel](https://github.com/ahmedkandel) |

[<img alt="btrice" src="https://avatars2.githubusercontent.com/u/4358225?v=4&s=117" width="117">](https://github.com/btrice) |[<img alt="behnammodi" src="https://avatars0.githubusercontent.com/u/1549069?v=4&s=117" width="117">](https://github.com/behnammodi) |[<img alt="Burkes" src="https://avatars2.githubusercontent.com/u/9220052?v=4&s=117" width="117">](https://github.com/Burkes) |[<img alt="craigjennings11" src="https://avatars2.githubusercontent.com/u/1683368?v=4&s=117" width="117">](https://github.com/craigjennings11) |[<img alt="davekiss" src="https://avatars2.githubusercontent.com/u/1256071?v=4&s=117" width="117">](https://github.com/davekiss) |[<img alt="frobinsonj" src="https://avatars3.githubusercontent.com/u/16726902?v=4&s=117" width="117">](https://github.com/frobinsonj) |
:---: |:---: |:---: |:---: |:---: |:---: |
[btrice](https://github.com/btrice) |[behnammodi](https://github.com/behnammodi) |[Burkes](https://github.com/Burkes) |[craigjennings11](https://github.com/craigjennings11) |[davekiss](https://github.com/davekiss) |[frobinsonj](https://github.com/frobinsonj) |

[<img alt="geertclerx" src="https://avatars0.githubusercontent.com/u/1381327?v=4&s=117" width="117">](https://github.com/geertclerx) |[<img alt="jasonbosco" src="https://avatars3.githubusercontent.com/u/458383?v=4&s=117" width="117">](https://github.com/jasonbosco) |[<img alt="jedwood" src="https://avatars0.githubusercontent.com/u/369060?v=4&s=117" width="117">](https://github.com/jedwood) |[<img alt="dogrocker" src="https://avatars0.githubusercontent.com/u/8379027?v=4&s=117" width="117">](https://github.com/dogrocker) |[<img alt="lamartire" src="https://avatars0.githubusercontent.com/u/13414205?v=4&s=117" width="117">](https://github.com/lamartire) |[<img alt="Mactaivsh" src="https://avatars0.githubusercontent.com/u/12948083?v=4&s=117" width="117">](https://github.com/Mactaivsh) |
:---: |:---: |:---: |:---: |:---: |:---: |
[geertclerx](https://github.com/geertclerx) |[jasonbosco](https://github.com/jasonbosco) |[jedwood](https://github.com/jedwood) |[dogrocker](https://github.com/dogrocker) |[lamartire](https://github.com/lamartire) |[Mactaivsh](https://github.com/Mactaivsh) |

[<img alt="maferland" src="https://avatars3.githubusercontent.com/u/5889721?v=4&s=117" width="117">](https://github.com/maferland) |[<img alt="Martin005" src="https://avatars0.githubusercontent.com/u/10096404?v=4&s=117" width="117">](https://github.com/Martin005) |[<img alt="martiuslim" src="https://avatars2.githubusercontent.com/u/17944339?v=4&s=117" width="117">](https://github.com/martiuslim) |[<img alt="MatthiasKunnen" src="https://avatars3.githubusercontent.com/u/16807587?v=4&s=117" width="117">](https://github.com/MatthiasKunnen) |[<img alt="msand" src="https://avatars2.githubusercontent.com/u/1131362?v=4&s=117" width="117">](https://github.com/msand) |[<img alt="richartkeil" src="https://avatars0.githubusercontent.com/u/8680858?v=4&s=117" width="117">](https://github.com/richartkeil) |
:---: |:---: |:---: |:---: |:---: |:---: |
[maferland](https://github.com/maferland) |[Martin005](https://github.com/Martin005) |[martiuslim](https://github.com/martiuslim) |[MatthiasKunnen](https://github.com/MatthiasKunnen) |[msand](https://github.com/msand) |[richartkeil](https://github.com/richartkeil) |

[<img alt="richmeij" src="https://avatars0.githubusercontent.com/u/9741858?v=4&s=117" width="117">](https://github.com/richmeij) |[<img alt="rosenfeld" src="https://avatars1.githubusercontent.com/u/32246?v=4&s=117" width="117">](https://github.com/rosenfeld) |[<img alt="jrschumacher" src="https://avatars1.githubusercontent.com/u/46549?v=4&s=117" width="117">](https://github.com/jrschumacher) |[<img alt="ThomasG77" src="https://avatars2.githubusercontent.com/u/642120?v=4&s=117" width="117">](https://github.com/ThomasG77) |[<img alt="sparanoid" src="https://avatars0.githubusercontent.com/u/96356?v=4&s=117" width="117">](https://github.com/sparanoid) |[<img alt="zhuangya" src="https://avatars2.githubusercontent.com/u/499038?v=4&s=117" width="117">](https://github.com/zhuangya) |
:---: |:---: |:---: |:---: |:---: |:---: |
[richmeij](https://github.com/richmeij) |[rosenfeld](https://github.com/rosenfeld) |[jrschumacher](https://github.com/jrschumacher) |[ThomasG77](https://github.com/ThomasG77) |[sparanoid](https://github.com/sparanoid) |[zhuangya](https://github.com/zhuangya) |

[<img alt="allenfantasy" src="https://avatars1.githubusercontent.com/u/1009294?v=4&s=117" width="117">](https://github.com/allenfantasy) |[<img alt="Zyclotrop-j" src="https://avatars0.githubusercontent.com/u/4939546?v=4&s=117" width="117">](https://github.com/Zyclotrop-j) |[<img alt="fortrieb" src="https://avatars0.githubusercontent.com/u/4126707?v=4&s=117" width="117">](https://github.com/fortrieb) |[<img alt="jarey" src="https://avatars1.githubusercontent.com/u/5025224?v=4&s=117" width="117">](https://github.com/jarey) |[<img alt="muhammadInam" src="https://avatars1.githubusercontent.com/u/7801708?v=4&s=117" width="117">](https://github.com/muhammadInam) |[<img alt="rettgerst" src="https://avatars2.githubusercontent.com/u/11684948?v=4&s=117" width="117">](https://github.com/rettgerst) |
:---: |:---: |:---: |:---: |:---: |:---: |
[allenfantasy](https://github.com/allenfantasy) |[Zyclotrop-j](https://github.com/Zyclotrop-j) |[fortrieb](https://github.com/fortrieb) |[jarey](https://github.com/jarey) |[muhammadInam](https://github.com/muhammadInam) |[rettgerst](https://github.com/rettgerst) |

[<img alt="mkabatek" src="https://avatars0.githubusercontent.com/u/1764486?v=4&s=117" width="117">](https://github.com/mkabatek) |[<img alt="jukakoski" src="https://avatars0.githubusercontent.com/u/52720967?v=4&s=117" width="117">](https://github.com/jukakoski) |[<img alt="olemoign" src="https://avatars3.githubusercontent.com/u/11632871?v=4&s=117" width="117">](https://github.com/olemoign) |[<img alt="ajschmidt8" src="https://avatars0.githubusercontent.com/u/7400326?v=4&s=117" width="117">](https://github.com/ajschmidt8) |[<img alt="superhawk610" src="https://avatars1.githubusercontent.com/u/18172185?v=4&s=117" width="117">](https://github.com/superhawk610) |[<img alt="abannach" src="https://avatars2.githubusercontent.com/u/43150303?v=4&s=117" width="117">](https://github.com/abannach) |
:---: |:---: |:---: |:---: |:---: |:---: |
[mkabatek](https://github.com/mkabatek) |[jukakoski](https://github.com/jukakoski) |[olemoign](https://github.com/olemoign) |[ajschmidt8](https://github.com/ajschmidt8) |[superhawk610](https://github.com/superhawk610) |[abannach](https://github.com/abannach) |

[<img alt="adamelmore" src="https://avatars2.githubusercontent.com/u/2363879?v=4&s=117" width="117">](https://github.com/adamelmore) |[<img alt="adamvigneault" src="https://avatars2.githubusercontent.com/u/18236120?v=4&s=117" width="117">](https://github.com/adamvigneault) |[<img alt="adritasharma" src="https://avatars0.githubusercontent.com/u/29271635?v=4&s=117" width="117">](https://github.com/adritasharma) |[<img alt="asmt3" src="https://avatars1.githubusercontent.com/u/1777709?v=4&s=117" width="117">](https://github.com/asmt3) |[<img alt="alexnj" src="https://avatars0.githubusercontent.com/u/683500?v=4&s=117" width="117">](https://github.com/alexnj) |[<img alt="aalepis" src="https://avatars2.githubusercontent.com/u/35684834?v=4&s=117" width="117">](https://github.com/aalepis) |
:---: |:---: |:---: |:---: |:---: |:---: |
[adamelmore](https://github.com/adamelmore) |[adamvigneault](https://github.com/adamvigneault) |[adritasharma](https://github.com/adritasharma) |[asmt3](https://github.com/asmt3) |[alexnj](https://github.com/alexnj) |[aalepis](https://github.com/aalepis) |

[<img alt="amitport" src="https://avatars1.githubusercontent.com/u/1131991?v=4&s=117" width="117">](https://github.com/amitport) |[<img alt="functino" src="https://avatars0.githubusercontent.com/u/415498?v=4&s=117" width="117">](https://github.com/functino) |[<img alt="radarhere" src="https://avatars2.githubusercontent.com/u/3112309?v=4&s=117" width="117">](https://github.com/radarhere) |[<img alt="superandrew213" src="https://avatars3.githubusercontent.com/u/13059204?v=4&s=117" width="117">](https://github.com/superandrew213) |[<img alt="andychongyz" src="https://avatars0.githubusercontent.com/u/12697240?v=4&s=117" width="117">](https://github.com/andychongyz) |[<img alt="anthony0030" src="https://avatars0.githubusercontent.com/u/13033263?v=4&s=117" width="117">](https://github.com/anthony0030) |
:---: |:---: |:---: |:---: |:---: |:---: |
[amitport](https://github.com/amitport) |[functino](https://github.com/functino) |[radarhere](https://github.com/radarhere) |[superandrew213](https://github.com/superandrew213) |[andychongyz](https://github.com/andychongyz) |[anthony0030](https://github.com/anthony0030) |

[<img alt="arthurdenner" src="https://avatars0.githubusercontent.com/u/13774309?v=4&s=117" width="117">](https://github.com/arthurdenner) |[<img alt="apuyou" src="https://avatars2.githubusercontent.com/u/520053?v=4&s=117" width="117">](https://github.com/apuyou) |[<img alt="bochkarev-artem" src="https://avatars2.githubusercontent.com/u/11025874?v=4&s=117" width="117">](https://github.com/bochkarev-artem) |[<img alt="atsawin" src="https://avatars2.githubusercontent.com/u/666663?v=4&s=117" width="117">](https://github.com/atsawin) |[<img alt="ayhankesicioglu" src="https://avatars2.githubusercontent.com/u/36304312?v=4&s=117" width="117">](https://github.com/ayhankesicioglu) |[<img alt="azeemba" src="https://avatars0.githubusercontent.com/u/2160795?v=4&s=117" width="117">](https://github.com/azeemba) |
:---: |:---: |:---: |:---: |:---: |:---: |
[arthurdenner](https://github.com/arthurdenner) |[apuyou](https://github.com/apuyou) |[bochkarev-artem](https://github.com/bochkarev-artem) |[atsawin](https://github.com/atsawin) |[ayhankesicioglu](https://github.com/ayhankesicioglu) |[azeemba](https://github.com/azeemba) |

[<img alt="azizk" src="https://avatars2.githubusercontent.com/u/37282?v=4&s=117" width="117">](https://github.com/azizk) |[<img alt="bducharme" src="https://avatars2.githubusercontent.com/u/4173569?v=4&s=117" width="117">](https://github.com/bducharme) |[<img alt="Quorafind" src="https://avatars1.githubusercontent.com/u/13215013?v=4&s=117" width="117">](https://github.com/Quorafind) |[<img alt="wbaaron" src="https://avatars1.githubusercontent.com/u/1048988?v=4&s=117" width="117">](https://github.com/wbaaron) |[<img alt="bedgerotto" src="https://avatars2.githubusercontent.com/u/4459657?v=4&s=117" width="117">](https://github.com/bedgerotto) |[<img alt="cyu" src="https://avatars1.githubusercontent.com/u/2431?v=4&s=117" width="117">](https://github.com/cyu) |
:---: |:---: |:---: |:---: |:---: |:---: |
[azizk](https://github.com/azizk) |[bducharme](https://github.com/bducharme) |[Quorafind](https://github.com/Quorafind) |[wbaaron](https://github.com/wbaaron) |[bedgerotto](https://github.com/bedgerotto) |[cyu](https://github.com/cyu) |

[<img alt="cartfisk" src="https://avatars2.githubusercontent.com/u/8764375?v=4&s=117" width="117">](https://github.com/cartfisk) |[<img alt="cellvinchung" src="https://avatars2.githubusercontent.com/u/5347394?v=4&s=117" width="117">](https://github.com/cellvinchung) |[<img alt="chao" src="https://avatars2.githubusercontent.com/u/55872?v=4&s=117" width="117">](https://github.com/chao) |[<img alt="csprance" src="https://avatars0.githubusercontent.com/u/7902617?v=4&s=117" width="117">](https://github.com/csprance) |[<img alt="Aarbel" src="https://avatars2.githubusercontent.com/u/25119847?v=4&s=117" width="117">](https://github.com/Aarbel) |[<img alt="cbush06" src="https://avatars0.githubusercontent.com/u/15720146?v=4&s=117" width="117">](https://github.com/cbush06) |
:---: |:---: |:---: |:---: |:---: |:---: |
[cartfisk](https://github.com/cartfisk) |[cellvinchung](https://github.com/cellvinchung) |[chao](https://github.com/chao) |[csprance](https://github.com/csprance) |[Aarbel](https://github.com/Aarbel) |[cbush06](https://github.com/cbush06) |

[<img alt="czj" src="https://avatars2.githubusercontent.com/u/14306?v=4&s=117" width="117">](https://github.com/czj) |[<img alt="ardeois" src="https://avatars0.githubusercontent.com/u/1867939?v=4&s=117" width="117">](https://github.com/ardeois) |[<img alt="sercraig" src="https://avatars3.githubusercontent.com/u/24261518?v=4&s=117" width="117">](https://github.com/sercraig) |[<img alt="danmichaelo" src="https://avatars1.githubusercontent.com/u/434495?v=4&s=117" width="117">](https://github.com/danmichaelo) |[<img alt="mrboomer" src="https://avatars0.githubusercontent.com/u/5942912?v=4&s=117" width="117">](https://github.com/mrboomer) |[<img alt="akizor" src="https://avatars1.githubusercontent.com/u/1052439?v=4&s=117" width="117">](https://github.com/akizor) |
:---: |:---: |:---: |:---: |:---: |:---: |
[czj](https://github.com/czj) |[ardeois](https://github.com/ardeois) |[sercraig](https://github.com/sercraig) |[danmichaelo](https://github.com/danmichaelo) |[mrboomer](https://github.com/mrboomer) |[akizor](https://github.com/akizor) |

[<img alt="davilima6" src="https://avatars0.githubusercontent.com/u/422130?v=4&s=117" width="117">](https://github.com/davilima6) |[<img alt="DennisKofflard" src="https://avatars2.githubusercontent.com/u/8669129?v=4&s=117" width="117">](https://github.com/DennisKofflard) |[<img alt="jeetiss" src="https://avatars1.githubusercontent.com/u/6726016?v=4&s=117" width="117">](https://github.com/jeetiss) |[<img alt="dominiceden" src="https://avatars2.githubusercontent.com/u/6367692?v=4&s=117" width="117">](https://github.com/dominiceden) |[<img alt="sweetro" src="https://avatars1.githubusercontent.com/u/6228717?v=4&s=117" width="117">](https://github.com/sweetro) |[<img alt="efbautista" src="https://avatars3.githubusercontent.com/u/35430671?v=4&s=117" width="117">](https://github.com/efbautista) |
:---: |:---: |:---: |:---: |:---: |:---: |
[davilima6](https://github.com/davilima6) |[DennisKofflard](https://github.com/DennisKofflard) |[jeetiss](https://github.com/jeetiss) |[dominiceden](https://github.com/dominiceden) |[sweetro](https://github.com/sweetro) |[efbautista](https://github.com/efbautista) |

[<img alt="yoldar" src="https://avatars3.githubusercontent.com/u/1597578?v=4&s=117" width="117">](https://github.com/yoldar) |[<img alt="eliOcs" src="https://avatars1.githubusercontent.com/u/1283954?v=4&s=117" width="117">](https://github.com/eliOcs) |[<img alt="EnricoSottile" src="https://avatars2.githubusercontent.com/u/10349653?v=4&s=117" width="117">](https://github.com/EnricoSottile) |[<img alt="ethanwillis" src="https://avatars3.githubusercontent.com/u/182492?v=4&s=117" width="117">](https://github.com/ethanwillis) |[<img alt="Gkleinereva" src="https://avatars1.githubusercontent.com/u/23621633?v=4&s=117" width="117">](https://github.com/Gkleinereva) |[<img alt="fgallinari" src="https://avatars1.githubusercontent.com/u/6473638?v=4&s=117" width="117">](https://github.com/fgallinari) |
:---: |:---: |:---: |:---: |:---: |:---: |
[yoldar](https://github.com/yoldar) |[eliOcs](https://github.com/eliOcs) |[EnricoSottile](https://github.com/EnricoSottile) |[ethanwillis](https://github.com/ethanwillis) |[Gkleinereva](https://github.com/Gkleinereva) |[fgallinari](https://github.com/fgallinari) |

[<img alt="ferdiusa" src="https://avatars1.githubusercontent.com/u/1997982?v=4&s=117" width="117">](https://github.com/ferdiusa) |[<img alt="dtrucs" src="https://avatars2.githubusercontent.com/u/1926041?v=4&s=117" width="117">](https://github.com/dtrucs) |[<img alt="geoffappleford" src="https://avatars2.githubusercontent.com/u/731678?v=4&s=117" width="117">](https://github.com/geoffappleford) |[<img alt="gjungb" src="https://avatars0.githubusercontent.com/u/3391068?v=4&s=117" width="117">](https://github.com/gjungb) |[<img alt="roenschg" src="https://avatars2.githubusercontent.com/u/9590236?v=4&s=117" width="117">](https://github.com/roenschg) |[<img alt="HughbertD" src="https://avatars0.githubusercontent.com/u/1580021?v=4&s=117" width="117">](https://github.com/HughbertD) |
:---: |:---: |:---: |:---: |:---: |:---: |
[ferdiusa](https://github.com/ferdiusa) |[dtrucs](https://github.com/dtrucs) |[geoffappleford](https://github.com/geoffappleford) |[gjungb](https://github.com/gjungb) |[roenschg](https://github.com/roenschg) |[HughbertD](https://github.com/HughbertD) |

[<img alt="HussainAlkhalifah" src="https://avatars1.githubusercontent.com/u/43642162?v=4&s=117" width="117">](https://github.com/HussainAlkhalifah) |[<img alt="huydod" src="https://avatars2.githubusercontent.com/u/37580530?v=4&s=117" width="117">](https://github.com/huydod) |[<img alt="ishendyweb" src="https://avatars1.githubusercontent.com/u/10582418?v=4&s=117" width="117">](https://github.com/ishendyweb) |[<img alt="NaxYo" src="https://avatars3.githubusercontent.com/u/1963876?v=4&s=117" width="117">](https://github.com/NaxYo) |[<img alt="ghasrfakhri" src="https://avatars1.githubusercontent.com/u/4945963?v=4&s=117" width="117">](https://github.com/ghasrfakhri) |[<img alt="intenzive" src="https://avatars1.githubusercontent.com/u/11055931?v=4&s=117" width="117">](https://github.com/intenzive) |
:---: |:---: |:---: |:---: |:---: |:---: |
[HussainAlkhalifah](https://github.com/HussainAlkhalifah) |[huydod](https://github.com/huydod) |[ishendyweb](https://github.com/ishendyweb) |[NaxYo](https://github.com/NaxYo) |[ghasrfakhri](https://github.com/ghasrfakhri) |[intenzive](https://github.com/intenzive) |

[<img alt="JacobMGEvans" src="https://avatars1.githubusercontent.com/u/27247160?v=4&s=117" width="117">](https://github.com/JacobMGEvans) |[<img alt="jdssem" src="https://avatars0.githubusercontent.com/u/978944?v=4&s=117" width="117">](https://github.com/jdssem) |[<img alt="jcjmcclean" src="https://avatars3.githubusercontent.com/u/1822574?v=4&s=117" width="117">](https://github.com/jcjmcclean) |[<img alt="janklimo" src="https://avatars1.githubusercontent.com/u/7811733?v=4&s=117" width="117">](https://github.com/janklimo) |[<img alt="vith" src="https://avatars1.githubusercontent.com/u/3265539?v=4&s=117" width="117">](https://github.com/vith) |[<img alt="jessica-coursera" src="https://avatars1.githubusercontent.com/u/35155465?v=4&s=117" width="117">](https://github.com/jessica-coursera) |
:---: |:---: |:---: |:---: |:---: |:---: |
[JacobMGEvans](https://github.com/JacobMGEvans) |[jdssem](https://github.com/jdssem) |[jcjmcclean](https://github.com/jcjmcclean) |[janklimo](https://github.com/janklimo) |[vith](https://github.com/vith) |[jessica-coursera](https://github.com/jessica-coursera) |

[<img alt="Jmales" src="https://avatars3.githubusercontent.com/u/22914881?v=4&s=117" width="117">](https://github.com/Jmales) |[<img alt="theJoeBiz" src="https://avatars1.githubusercontent.com/u/189589?v=4&s=117" width="117">](https://github.com/theJoeBiz) |[<img alt="jonathanarbely" src="https://avatars1.githubusercontent.com/u/18177203?v=4&s=117" width="117">](https://github.com/jonathanarbely) |[<img alt="jderrough" src="https://avatars3.githubusercontent.com/u/1108358?v=4&s=117" width="117">](https://github.com/jderrough) |[<img alt="jonathanly" src="https://avatars3.githubusercontent.com/u/13286473?v=4&s=117" width="117">](https://github.com/jonathanly) |[<img alt="jorgeepc" src="https://avatars3.githubusercontent.com/u/3879892?v=4&s=117" width="117">](https://github.com/jorgeepc) |
:---: |:---: |:---: |:---: |:---: |:---: |
[Jmales](https://github.com/Jmales) |[theJoeBiz](https://github.com/theJoeBiz) |[jonathanarbely](https://github.com/jonathanarbely) |[jderrough](https://github.com/jderrough) |[jonathanly](https://github.com/jonathanly) |[jorgeepc](https://github.com/jorgeepc) |

[<img alt="julianocomg" src="https://avatars1.githubusercontent.com/u/7483557?v=4&s=117" width="117">](https://github.com/julianocomg) |[<img alt="firesharkstudios" src="https://avatars1.githubusercontent.com/u/17069637?v=4&s=117" width="117">](https://github.com/firesharkstudios) |[<img alt="elkebab" src="https://avatars0.githubusercontent.com/u/6313468?v=4&s=117" width="117">](https://github.com/elkebab) |[<img alt="kyleparisi" src="https://avatars0.githubusercontent.com/u/1286753?v=4&s=117" width="117">](https://github.com/kyleparisi) |[<img alt="lafe" src="https://avatars1.githubusercontent.com/u/4070008?v=4&s=117" width="117">](https://github.com/lafe) |[<img alt="leaanthony" src="https://avatars1.githubusercontent.com/u/1943904?v=4&s=117" width="117">](https://github.com/leaanthony) |
:---: |:---: |:---: |:---: |:---: |:---: |
[julianocomg](https://github.com/julianocomg) |[firesharkstudios](https://github.com/firesharkstudios) |[elkebab](https://github.com/elkebab) |[kyleparisi](https://github.com/kyleparisi) |[lafe](https://github.com/lafe) |[leaanthony](https://github.com/leaanthony) |

[<img alt="larowlan" src="https://avatars2.githubusercontent.com/u/555254?v=4&s=117" width="117">](https://github.com/larowlan) |[<img alt="dviry" src="https://avatars3.githubusercontent.com/u/1230260?v=4&s=117" width="117">](https://github.com/dviry) |[<img alt="galli-leo" src="https://avatars3.githubusercontent.com/u/5339762?v=4&s=117" width="117">](https://github.com/galli-leo) |[<img alt="leods92" src="https://avatars0.githubusercontent.com/u/879395?v=4&s=117" width="117">](https://github.com/leods92) |[<img alt="louim" src="https://avatars2.githubusercontent.com/u/923718?v=4&s=117" width="117">](https://github.com/louim) |[<img alt="lucaperret" src="https://avatars1.githubusercontent.com/u/1887122?v=4&s=117" width="117">](https://github.com/lucaperret) |
:---: |:---: |:---: |:---: |:---: |:---: |
[larowlan](https://github.com/larowlan) |[dviry](https://github.com/dviry) |[galli-leo](https://github.com/galli-leo) |[leods92](https://github.com/leods92) |[louim](https://github.com/louim) |[lucaperret](https://github.com/lucaperret) |

[<img alt="mperrando" src="https://avatars2.githubusercontent.com/u/525572?v=4&s=117" width="117">](https://github.com/mperrando) |[<img alt="marcusforsberg" src="https://avatars0.githubusercontent.com/u/1009069?v=4&s=117" width="117">](https://github.com/marcusforsberg) |[<img alt="Acconut" src="https://avatars3.githubusercontent.com/u/1375043?v=4&s=117" width="117">](https://github.com/Acconut) |[<img alt="mattfik" src="https://avatars2.githubusercontent.com/u/1638028?v=4&s=117" width="117">](https://github.com/mattfik) |[<img alt="matthewhartstonge" src="https://avatars2.githubusercontent.com/u/6119549?v=4&s=117" width="117">](https://github.com/matthewhartstonge) |[<img alt="hrsh" src="https://avatars3.githubusercontent.com/u/1929359?v=4&s=117" width="117">](https://github.com/hrsh) |
:---: |:---: |:---: |:---: |:---: |:---: |
[mperrando](https://github.com/mperrando) |[marcusforsberg](https://github.com/marcusforsberg) |[Acconut](https://github.com/Acconut) |[mattfik](https://github.com/mattfik) |[matthewhartstonge](https://github.com/matthewhartstonge) |[hrsh](https://github.com/hrsh) |

[<img alt="mhulet" src="https://avatars0.githubusercontent.com/u/293355?v=4&s=117" width="117">](https://github.com/mhulet) |[<img alt="achmiral" src="https://avatars0.githubusercontent.com/u/10906059?v=4&s=117" width="117">](https://github.com/achmiral) |[<img alt="mnafees" src="https://avatars1.githubusercontent.com/u/1763885?v=4&s=117" width="117">](https://github.com/mnafees) |[<img alt="shahimclt" src="https://avatars3.githubusercontent.com/u/8318002?v=4&s=117" width="117">](https://github.com/shahimclt) |[<img alt="pleasespammelater" src="https://avatars3.githubusercontent.com/u/11870394?v=4&s=117" width="117">](https://github.com/pleasespammelater) |[<img alt="naveed-ahmad" src="https://avatars2.githubusercontent.com/u/701567?v=4&s=117" width="117">](https://github.com/naveed-ahmad) |
:---: |:---: |:---: |:---: |:---: |:---: |
[mhulet](https://github.com/mhulet) |[achmiral](https://github.com/achmiral) |[mnafees](https://github.com/mnafees) |[shahimclt](https://github.com/shahimclt) |[pleasespammelater](https://github.com/pleasespammelater) |[naveed-ahmad](https://github.com/naveed-ahmad) |

[<img alt="nicojones" src="https://avatars2.githubusercontent.com/u/6078915?v=4&s=117" width="117">](https://github.com/nicojones) |[<img alt="leftdevel" src="https://avatars3.githubusercontent.com/u/843337?v=4&s=117" width="117">](https://github.com/leftdevel) |[<img alt="cryptic022" src="https://avatars2.githubusercontent.com/u/18145703?v=4&s=117" width="117">](https://github.com/cryptic022) |[<img alt="patricklindsay" src="https://avatars0.githubusercontent.com/u/7923681?v=4&s=117" width="117">](https://github.com/patricklindsay) |[<img alt="pedrofs" src="https://avatars0.githubusercontent.com/u/56484?v=4&s=117" width="117">](https://github.com/pedrofs) |[<img alt="phillipalexander" src="https://avatars0.githubusercontent.com/u/1577682?v=4&s=117" width="117">](https://github.com/phillipalexander) |
:---: |:---: |:---: |:---: |:---: |:---: |
[nicojones](https://github.com/nicojones) |[leftdevel](https://github.com/leftdevel) |[cryptic022](https://github.com/cryptic022) |[patricklindsay](https://github.com/patricklindsay) |[pedrofs](https://github.com/pedrofs) |[phillipalexander](https://github.com/phillipalexander) |

[<img alt="Pzoco" src="https://avatars0.githubusercontent.com/u/3101348?v=4&s=117" width="117">](https://github.com/Pzoco) |[<img alt="eman8519" src="https://avatars2.githubusercontent.com/u/2380804?v=4&s=117" width="117">](https://github.com/eman8519) |[<img alt="luarmr" src="https://avatars3.githubusercontent.com/u/817416?v=4&s=117" width="117">](https://github.com/luarmr) |[<img alt="SxDx" src="https://avatars3.githubusercontent.com/u/2004247?v=4&s=117" width="117">](https://github.com/SxDx) |[<img alt="phobos101" src="https://avatars2.githubusercontent.com/u/7114944?v=4&s=117" width="117">](https://github.com/phobos101) |[<img alt="romain-preston" src="https://avatars3.githubusercontent.com/u/1517040?v=4&s=117" width="117">](https://github.com/romain-preston) |
:---: |:---: |:---: |:---: |:---: |:---: |
[Pzoco](https://github.com/Pzoco) |[eman8519](https://github.com/eman8519) |[luarmr](https://github.com/luarmr) |[SxDx](https://github.com/SxDx) |[phobos101](https://github.com/phobos101) |[romain-preston](https://github.com/romain-preston) |

[<img alt="scherroman" src="https://avatars3.githubusercontent.com/u/7923938?v=4&s=117" width="117">](https://github.com/scherroman) |[<img alt="fortunto2" src="https://avatars1.githubusercontent.com/u/1236751?v=4&s=117" width="117">](https://github.com/fortunto2) |[<img alt="samuelcolburn" src="https://avatars2.githubusercontent.com/u/9741902?v=4&s=117" width="117">](https://github.com/samuelcolburn) |[<img alt="sergei-zelinsky" src="https://avatars2.githubusercontent.com/u/19428086?v=4&s=117" width="117">](https://github.com/sergei-zelinsky) |[<img alt="SpazzMarticus" src="https://avatars0.githubusercontent.com/u/5716457?v=4&s=117" width="117">](https://github.com/SpazzMarticus) |[<img alt="suchoproduction" src="https://avatars3.githubusercontent.com/u/6931349?v=4&s=117" width="117">](https://github.com/suchoproduction) |
:---: |:---: |:---: |:---: |:---: |:---: |
[scherroman](https://github.com/scherroman) |[fortunto2](https://github.com/fortunto2) |[samuelcolburn](https://github.com/samuelcolburn) |[sergei-zelinsky](https://github.com/sergei-zelinsky) |[SpazzMarticus](https://github.com/SpazzMarticus) |[suchoproduction](https://github.com/suchoproduction) |

[<img alt="waptik" src="https://avatars1.githubusercontent.com/u/1687551?v=4&s=117" width="117">](https://github.com/waptik) |[<img alt="steverob" src="https://avatars2.githubusercontent.com/u/1220480?v=4&s=117" width="117">](https://github.com/steverob) |[<img alt="taj" src="https://avatars3.githubusercontent.com/u/16062635?v=4&s=117" width="117">](https://github.com/taj) |[<img alt="Tashows" src="https://avatars2.githubusercontent.com/u/16656928?v=4&s=117" width="117">](https://github.com/Tashows) |[<img alt="twarlop" src="https://avatars3.githubusercontent.com/u/2856082?v=4&s=117" width="117">](https://github.com/twarlop) |[<img alt="tmaier" src="https://avatars0.githubusercontent.com/u/350038?v=4&s=117" width="117">](https://github.com/tmaier) |
:---: |:---: |:---: |:---: |:---: |:---: |
[waptik](https://github.com/waptik) |[steverob](https://github.com/steverob) |[taj](https://github.com/taj) |[Tashows](https://github.com/Tashows) |[twarlop](https://github.com/twarlop) |[tmaier](https://github.com/tmaier) |

[<img alt="tomsaleeba" src="https://avatars0.githubusercontent.com/u/1773838?v=4&s=117" width="117">](https://github.com/tomsaleeba) |[<img alt="tvaliasek" src="https://avatars2.githubusercontent.com/u/8644946?v=4&s=117" width="117">](https://github.com/tvaliasek) |[<img alt="vially" src="https://avatars1.githubusercontent.com/u/433598?v=4&s=117" width="117">](https://github.com/vially) |[<img alt="nagyv" src="https://avatars2.githubusercontent.com/u/126671?v=4&s=117" width="117">](https://github.com/nagyv) |[<img alt="willycamargo" src="https://avatars1.githubusercontent.com/u/5041887?v=4&s=117" width="117">](https://github.com/willycamargo) |[<img alt="xhocquet" src="https://avatars2.githubusercontent.com/u/8116516?v=4&s=117" width="117">](https://github.com/xhocquet) |
:---: |:---: |:---: |:---: |:---: |:---: |
[tomsaleeba](https://github.com/tomsaleeba) |[tvaliasek](https://github.com/tvaliasek) |[vially](https://github.com/vially) |[nagyv](https://github.com/nagyv) |[willycamargo](https://github.com/willycamargo) |[xhocquet](https://github.com/xhocquet) |

[<img alt="yaegor" src="https://avatars2.githubusercontent.com/u/3315?v=4&s=117" width="117">](https://github.com/yaegor) |[<img alt="YehudaKremer" src="https://avatars3.githubusercontent.com/u/946652?v=4&s=117" width="117">](https://github.com/YehudaKremer) |[<img alt="zachconner" src="https://avatars0.githubusercontent.com/u/11339326?v=4&s=117" width="117">](https://github.com/zachconner) |[<img alt="zacharylawson" src="https://avatars3.githubusercontent.com/u/7375444?v=4&s=117" width="117">](https://github.com/zacharylawson) |[<img alt="agreene-coursera" src="https://avatars0.githubusercontent.com/u/30501355?v=4&s=117" width="117">](https://github.com/agreene-coursera) |[<img alt="alfatv" src="https://avatars2.githubusercontent.com/u/62238673?v=4&s=117" width="117">](https://github.com/alfatv) |
:---: |:---: |:---: |:---: |:---: |:---: |
[yaegor](https://github.com/yaegor) |[YehudaKremer](https://github.com/YehudaKremer) |[zachconner](https://github.com/zachconner) |[zacharylawson](https://github.com/zacharylawson) |[agreene-coursera](https://github.com/agreene-coursera) |[alfatv](https://github.com/alfatv) |

[<img alt="arggh" src="https://avatars3.githubusercontent.com/u/17210302?v=4&s=117" width="117">](https://github.com/arggh) |[<img alt="avalla" src="https://avatars1.githubusercontent.com/u/986614?v=4&s=117" width="117">](https://github.com/avalla) |[<img alt="bdirito" src="https://avatars0.githubusercontent.com/u/8117238?v=4&s=117" width="117">](https://github.com/bdirito) |[<img alt="c0b41" src="https://avatars1.githubusercontent.com/u/2834954?v=4&s=117" width="117">](https://github.com/c0b41) |[<img alt="canvasbh" src="https://avatars3.githubusercontent.com/u/44477734?v=4&s=117" width="117">](https://github.com/canvasbh) |[<img alt="craigcbrunner" src="https://avatars3.githubusercontent.com/u/2780521?v=4&s=117" width="117">](https://github.com/craigcbrunner) |
:---: |:---: |:---: |:---: |:---: |:---: |
[arggh](https://github.com/arggh) |[avalla](https://github.com/avalla) |[bdirito](https://github.com/bdirito) |[c0b41](https://github.com/c0b41) |[canvasbh](https://github.com/canvasbh) |[craigcbrunner](https://github.com/craigcbrunner) |

[<img alt="darthf1" src="https://avatars2.githubusercontent.com/u/17253332?v=4&s=117" width="117">](https://github.com/darthf1) |[<img alt="dkisic" src="https://avatars2.githubusercontent.com/u/32257921?v=4&s=117" width="117">](https://github.com/dkisic) |[<img alt="fingul" src="https://avatars3.githubusercontent.com/u/894739?v=4&s=117" width="117">](https://github.com/fingul) |[<img alt="franckl" src="https://avatars0.githubusercontent.com/u/3875803?v=4&s=117" width="117">](https://github.com/franckl) |[<img alt="gaelicwinter" src="https://avatars3.githubusercontent.com/u/6510266?v=4&s=117" width="117">](https://github.com/gaelicwinter) |[<img alt="green-mike" src="https://avatars1.githubusercontent.com/u/5584225?v=4&s=117" width="117">](https://github.com/green-mike) |
:---: |:---: |:---: |:---: |:---: |:---: |
[darthf1](https://github.com/darthf1) |[dkisic](https://github.com/dkisic) |[fingul](https://github.com/fingul) |[franckl](https://github.com/franckl) |[gaelicwinter](https://github.com/gaelicwinter) |[green-mike](https://github.com/green-mike) |

[<img alt="johnmanjiro13" src="https://avatars1.githubusercontent.com/u/28798279?v=4&s=117" width="117">](https://github.com/johnmanjiro13) |[<img alt="kode-ninja" src="https://avatars1.githubusercontent.com/u/7857611?v=4&s=117" width="117">](https://github.com/kode-ninja) |[<img alt="magumbo" src="https://avatars3.githubusercontent.com/u/6683765?v=4&s=117" width="117">](https://github.com/magumbo) |[<img alt="ninesalt" src="https://avatars2.githubusercontent.com/u/7952255?v=4&s=117" width="117">](https://github.com/ninesalt) |[<img alt="phil714" src="https://avatars0.githubusercontent.com/u/7584581?v=4&s=117" width="117">](https://github.com/phil714) |[<img alt="luntta" src="https://avatars0.githubusercontent.com/u/14221637?v=4&s=117" width="117">](https://github.com/luntta) |
:---: |:---: |:---: |:---: |:---: |:---: |
[johnmanjiro13](https://github.com/johnmanjiro13) |[kode-ninja](https://github.com/kode-ninja) |[magumbo](https://github.com/magumbo) |[ninesalt](https://github.com/ninesalt) |[phil714](https://github.com/phil714) |[luntta](https://github.com/luntta) |

[<img alt="rhymes" src="https://avatars3.githubusercontent.com/u/146201?v=4&s=117" width="117">](https://github.com/rhymes) |[<img alt="rlebosse" src="https://avatars0.githubusercontent.com/u/2794137?v=4&s=117" width="117">](https://github.com/rlebosse) |[<img alt="rtaieb" src="https://avatars2.githubusercontent.com/u/35224301?v=4&s=117" width="117">](https://github.com/rtaieb) |[<img alt="thanhthot" src="https://avatars0.githubusercontent.com/u/50633205?v=4&s=117" width="117">](https://github.com/thanhthot) |[<img alt="tinny77" src="https://avatars2.githubusercontent.com/u/1872936?v=4&s=117" width="117">](https://github.com/tinny77) |[<img alt="vedran555" src="https://avatars1.githubusercontent.com/u/38395951?v=4&s=117" width="117">](https://github.com/vedran555) |
:---: |:---: |:---: |:---: |:---: |:---: |
[rhymes](https://github.com/rhymes) |[rlebosse](https://github.com/rlebosse) |[rtaieb](https://github.com/rtaieb) |[thanhthot](https://github.com/thanhthot) |[tinny77](https://github.com/tinny77) |[vedran555](https://github.com/vedran555) |

[<img alt="yoann-hellopret" src="https://avatars3.githubusercontent.com/u/46525558?v=4&s=117" width="117">](https://github.com/yoann-hellopret) |[<img alt="olitomas" src="https://avatars0.githubusercontent.com/u/6918659?v=4&s=117" width="117">](https://github.com/olitomas) |
:---: |:---: |
[yoann-hellopret](https://github.com/yoann-hellopret) |[olitomas](https://github.com/olitomas) |


<!--/contributors-->

## Software

We use Browserstack for manual testing
<a href="https://www.browserstack.com" target="_blank">
  <img align="left" width="117" alt="BrowserStack logo" src="https://i.ibb.co/HDRDHmx/Browserstack-logo-2x.png">
</a>

## License

[The MIT License](LICENSE).
