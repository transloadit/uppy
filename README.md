# [Uppy](https://uppy.io)

<img src="https://uppy.io/images/logos/uppy-dog-head-arrow.svg" width="120" alt="Uppy logo: a superman puppy in a pink suit" align="right">

<a href="https://www.npmjs.com/package/uppy"><img src="https://img.shields.io/npm/v/uppy.svg?style=flat-square"></a>
<a href="https://travis-ci.org/transloadit/uppy"><img src="https://img.shields.io/travis/transloadit/uppy/master.svg?style=flat-square" alt="Build Status"></a>

Uppy is a sleek, modular JavaScript file uploader that integrates seamlessly with any application. It’s fast, easy to use and lets you worry about more important problems than building a file uploader.

- **Fetch** files from local disk, remote urls, Google Drive, Dropbox, Instagram, or snap and record selfies with a camera;
- **Preview** and edit metadata with a nice interface;
- **Upload** to the final destination, optionally process/encode

**[Read the docs](https://uppy.io/docs)** | **[Try Uppy](https://uppy.io/examples/dashboard/)**

Uppy is being developed by the folks at [Transloadit](https://transloadit.com), a versatile file encoding service.

## Example

<img width="700" alt="Uppy UI Demo: modal dialog with a few selected files and an upload button" src="https://github.com/transloadit/uppy/raw/master/uppy-screenshot.jpg">

Code used in the above example:

```js
const Uppy = require('uppy/lib/core')
const Dashboard = require('uppy/lib/plugins/Dashboard')
const GoogleDrive = require('uppy/lib/plugins/GoogleDrive')
const Instagram = require('uppy/lib/plugins/Instagram')
const Webcam = require('uppy/lib/plugins/Webcam')
const Tus = require('uppy/lib/plugins/Tus')

const uppy = Uppy({ autoProceed: false })
  .use(Dashboard, { trigger: '#select-files' })
  .use(GoogleDrive, { target: Dashboard, host: 'https://server.uppy.io' })
  .use(Instagram, { target: Dashboard, host: 'https://server.uppy.io' })
  .use(Webcam, { target: Dashboard })
  .use(Tus, { endpoint: 'https://master.tus.io/files/' })
  .run()
  .on('complete', (result) => {
    console.log('Upload result:', result)
  })
```

**[Try it online](https://uppy.io/examples/dashboard/)** or **[read the docs](https://uppy.io/docs)** for more details on how to use Uppy and its plugins.

## Features

- Lightweight, modular plugin-based architecture, easy on dependencies :zap:
- Resumable file uploads via the open [tus](https://tus.io/) standard, so large uploads survive network hiccups
- Supports picking files from: Webcam, Dropbox, Google Drive, Instagram, bypassing the user’s device where possible, syncing between servers directly via [uppy-server](https://github.com/transloadit/uppy-server)
- Works great with file encoding and processing backends, such as [Transloadit](https://transloadit.com), works great without (just roll your own Apache/Nginx/Node/FFmpeg/etc backend)
- Sleek user interface :sparkles:
- Optional file recovery (after a browser crash) with [Golden Retriever](https://uppy.io/docs/golden-retriever/)
- Speaks multiple languages (i18n) :earth_africa:
- Built with accessibility in mind
- Free for the world, forever (as in beer 🍺, pizza 🍕, and liberty 🗽)
- Cute as a puppy, also accepts cat pictures :dog:

## Installation

``` bash
$ npm install uppy --save
```

We recommend installing from npm and then using a module bundler such as [Webpack](http://webpack.github.io/), [Browserify](http://browserify.org/) or [Rollup.js](http://rollupjs.org/).

Add CSS [uppy.min.css](https://transloadit.edgly.net/releases/uppy/v0.24.2/dist/uppy.min.css), either to `<head>` of your HTML page or include in JS, if your bundler of choice supports it — transforms and plugins are available for Browserify and Webpack.

Alternatively, you can also use a pre-built bundle from Transloadit's CDN: Edgly. In that case `Uppy` will attach itself to the global `window.Uppy` object.

> ⚠️ The bundle currently consists of most Uppy plugins, so this method is not recommended for production, as your users will have to download all plugins when you are likely using just a few.

1\. Add a script to the bottom of `<body>`:

``` html
<script src="https://transloadit.edgly.net/releases/uppy/v0.24.2/dist/uppy.min.js"></script>
```

2\. Add CSS to `<head>`:
``` html
<link href="https://transloadit.edgly.net/releases/uppy/v0.24.2/dist/uppy.min.css" rel="stylesheet">
```

3\. Initialize:

``` html
<div class="UppyDragDrop"></div>
<script>
  var uppy = Uppy.Core()
  uppy.use(Uppy.DragDrop, { target: '.UppyDragDrop' })
  uppy.use(Uppy.Tus, { endpoint: '//master.tus.io/files/' })
  uppy.run()
</script>
```

## Documentation

- [Uppy](https://uppy.io/docs/uppy/) — full list of options, methods, and events.
- [Plugins](https://uppy.io/docs/plugins/) — list of Uppy plugins and their options.
- [Server](https://uppy.io/docs/server/) — setting up and running an Uppy Server instance, which adds support for Instagram, Dropbox, Google Drive and other remote sources.
- [React](https://uppy.io/docs/react/) — components to integrate Uppy UI plugins with React apps.
- [Architecture & Making a Plugin](https://uppy.io/docs/writing-plugins/) — how to write a plugin for Uppy [documentation in progress].

## Plugins

- `Tus` — resumable uploads via the open [tus](http://tus.io) standard
- `XHRUpload` — regular uploads for any backend out there (like Apache, Nginx)
- `Transloadit` — support for [Transloadit](http://transloadit.com)’s robust file uploading and encoding backend
- `AwsS3` — upload to AWS S3 (also works for Google Cloud)
- `Dashboard` — universal UI with previews, progress bars, metadata editor and all the cool stuff
- `DragDrop` — plain and simple drag and drop area
- `FileInput` — even plainer “select files” button
- `ProgressBar` — minimal progress bar that fills itself when upload progresses
- `StatusBar` — more detailed progress, pause/resume/cancel buttons, percentage, speed, uploaded/total sizes (included by default with `Dashboard`)
- `Informer` — send notifications like “smile” before taking a selfie or “upload failed” when all is lost (also included by default with `Dashboard`)
- `GoldenRetriever` — restores files after a browser crash, like it’s nothing
- `ThumbnailGenerator` — generates image previews (included by default with `Dashboard`)
- `Form` — collects metadata from `<form>` right before an Uppy upload, then optionally appends results back to the form
- `ReduxDevTools` — for your emerging [time traveling](https://github.com/gaearon/redux-devtools) needs
- `GoogleDrive`, `Dropbox`, `Instagram`, `Url` — select files from [Google Drive](https://www.google.com/drive/), [Dropbox](https://www.dropbox.com/), [Instagram](https://www.instagram.com/) and direct urls from anywhere on the web. Note that[`uppy-server`](https://github.com/transloadit/uppy-server) is needed for these.
- `Webcam` — snap and record those selfies 📷

## Browser Support

<a href="https://saucelabs.com/u/transloadit-uppy">
  <img src="https://saucelabs.com/browser-matrix/transloadit-uppy.svg" alt="Sauce Test Status"/>
</a>

We aim to support IE10+ and recent versions of Safari, Edge, Chrome, Firefox, and Opera.

## FAQ

### Why not just use `<input type="file">`?

Having no JavaScript beats having a lot of it, so that’s a fair question! Running an uploading & encoding business for ten years though we found that in cases, the file input leaves some to be desired:

- We received complaints about broken uploads and found that resumable uploads are important, especially for big files and to be inclusive towards people on poorer connections (we also launched [tus.io](https://tus.io) to attack that problem). Uppy uploads can survive network outages and browser crashes or accidental navigate-aways.
- Uppy supports editing meta information before uploading (and e.g. cropping is planned). 
- There’s the situation where people are using their mobile devices and want to upload on the go, but they have their picture on Instagram, files in Dropbox, or just a plain file url from anywhere on the open web. Uppy allows to pick files from those and push it to the destination without downloading it to your mobile device first. 
- Accurate upload progress reporting is an issue on many platforms.
- Some file validation — size, type, number of files — can be done on the client with Uppy.
- Uppy integrates webcam support, in case your users want to upload a picture/video/audio that does not exist yet :)
- A larger drag & drop surface can be pleasant to work with. Some people also like that you can control the styling, language, etc.
- Uppy is aware of encoding backends. Often after an upload, the server needs to rotate, detect faces, optimize for iPad, or what have you. Uppy can track progress of this and report back to the user in different ways.
- Sometimes you might want your uploads to happen while you continue to interact on the same single page.

Not all apps need all of these features. A `<input type="file">` is fine in many situations. But these were a few things that our customers hit / asked about enough to spark us to develop Uppy.

### Why is all this goodness free?

Transloadit’s team is small and we have a shared ambition to make a living from open source. By giving away projects like [tus.io](https://tus.io) and [Uppy](https://uppy.io),we’re hoping to advance the state of the art, make life a tiny little bit better for everyone, and in doing so have rewarding jobs and get some eyes on our commercial service: [a content ingestion & processing platform](https://transloadit.com). 

Our thinking is that if just a fraction of our open source userbase can see the appeal of hosted versions straight from the source, that could already be enough to sustain our work. So far this is working out! We’re able to dedicate 80% of our time to open source and haven’t gone bankrupt just yet :D

### Does Uppy support React?

Yep, we have Uppy React components, please see [Uppy React docs](https://uppy.io/docs/react/).

### Does Uppy support S3 uploads?

Yes, there is an S3 plugin, please check out the [docs](https://uppy.io/docs/aws-s3/) for more.

### Do I need to install special service/server for Uppy? Can I use it with Rails/Node/Go/PHP?

Yes, whatever you want on the backend will work with `XHRUpload` plugin, since it just does a `POST` or `PUT` request. Here’s a [PHP backend example](https://uppy.io/docs/xhrupload/#Uploading-to-a-PHP-Server). 

If you want resumability with the Tus plugin, use [one of the tus server implementations](https://tus.io/implementations.html) 👌🏼

And you’ll need [`uppy-server`](https://github.com/transloadit/uppy-server) if you’d like your users to be able to pick files from Instagram, Google Drive, Dropbox or via direct urls (with more services coming).

## Contributions are welcome

 - Contributor’s guide in [`website/src/docs/contributing.md`](website/src/docs/contributing.md)
 - Changelog to track our release progress (we aim to roll out a release every month): [`CHANGELOG.md`](CHANGELOG.md)

<!--contributors-->
## Contributors

[<img alt="arturi" src="https://avatars2.githubusercontent.com/u/1199054?v=4&s=117" width="117">](https://github.com/arturi) |[<img alt="goto-bus-stop" src="https://avatars1.githubusercontent.com/u/1006268?v=4&s=117" width="117">](https://github.com/goto-bus-stop) |[<img alt="kvz" src="https://avatars2.githubusercontent.com/u/26752?v=4&s=117" width="117">](https://github.com/kvz) |[<img alt="hedgerh" src="https://avatars2.githubusercontent.com/u/2524280?v=4&s=117" width="117">](https://github.com/hedgerh) |[<img alt="ifedapoolarewaju" src="https://avatars1.githubusercontent.com/u/8383781?v=4&s=117" width="117">](https://github.com/ifedapoolarewaju) |[<img alt="sadovnychyi" src="https://avatars3.githubusercontent.com/u/193864?v=4&s=117" width="117">](https://github.com/sadovnychyi) |
:---: |:---: |:---: |:---: |:---: |:---: |
[arturi](https://github.com/arturi) |[goto-bus-stop](https://github.com/goto-bus-stop) |[kvz](https://github.com/kvz) |[hedgerh](https://github.com/hedgerh) |[ifedapoolarewaju](https://github.com/ifedapoolarewaju) |[sadovnychyi](https://github.com/sadovnychyi) |

[<img alt="richardwillars" src="https://avatars3.githubusercontent.com/u/291004?v=4&s=117" width="117">](https://github.com/richardwillars) |[<img alt="AJvanLoon" src="https://avatars0.githubusercontent.com/u/15716628?v=4&s=117" width="117">](https://github.com/AJvanLoon) |[<img alt="wilkoklak" src="https://avatars1.githubusercontent.com/u/17553085?v=4&s=117" width="117">](https://github.com/wilkoklak) |[<img alt="oliverpool" src="https://avatars0.githubusercontent.com/u/3864879?v=4&s=117" width="117">](https://github.com/oliverpool) |[<img alt="nqst" src="https://avatars0.githubusercontent.com/u/375537?v=4&s=117" width="117">](https://github.com/nqst) |[<img alt="janko-m" src="https://avatars2.githubusercontent.com/u/795488?v=4&s=117" width="117">](https://github.com/janko-m) |
:---: |:---: |:---: |:---: |:---: |:---: |
[richardwillars](https://github.com/richardwillars) |[AJvanLoon](https://github.com/AJvanLoon) |[wilkoklak](https://github.com/wilkoklak) |[oliverpool](https://github.com/oliverpool) |[nqst](https://github.com/nqst) |[janko-m](https://github.com/janko-m) |

[<img alt="gavboulton" src="https://avatars0.githubusercontent.com/u/3900826?v=4&s=117" width="117">](https://github.com/gavboulton) |[<img alt="bertho-zero" src="https://avatars0.githubusercontent.com/u/8525267?v=4&s=117" width="117">](https://github.com/bertho-zero) |[<img alt="johnunclesam" src="https://avatars3.githubusercontent.com/u/21275217?v=4&s=117" width="117">](https://github.com/johnunclesam) |[<img alt="ogtfaber" src="https://avatars2.githubusercontent.com/u/320955?v=4&s=117" width="117">](https://github.com/ogtfaber) |[<img alt="sunil-shrestha" src="https://avatars3.githubusercontent.com/u/2129058?v=4&s=117" width="117">](https://github.com/sunil-shrestha) |[<img alt="tim-kos" src="https://avatars1.githubusercontent.com/u/15005?v=4&s=117" width="117">](https://github.com/tim-kos) |
:---: |:---: |:---: |:---: |:---: |:---: |
[gavboulton](https://github.com/gavboulton) |[bertho-zero](https://github.com/bertho-zero) |[johnunclesam](https://github.com/johnunclesam) |[ogtfaber](https://github.com/ogtfaber) |[sunil-shrestha](https://github.com/sunil-shrestha) |[tim-kos](https://github.com/tim-kos) |

[<img alt="phitranphitranphitran" src="https://avatars2.githubusercontent.com/u/14257077?v=4&s=117" width="117">](https://github.com/phitranphitranphitran) |[<img alt="btrice" src="https://avatars2.githubusercontent.com/u/4358225?v=4&s=117" width="117">](https://github.com/btrice) |[<img alt="Martin005" src="https://avatars0.githubusercontent.com/u/10096404?v=4&s=117" width="117">](https://github.com/Martin005) |[<img alt="martiuslim" src="https://avatars2.githubusercontent.com/u/17944339?v=4&s=117" width="117">](https://github.com/martiuslim) |[<img alt="richmeij" src="https://avatars0.githubusercontent.com/u/9741858?v=4&s=117" width="117">](https://github.com/richmeij) |[<img alt="Burkes" src="https://avatars2.githubusercontent.com/u/9220052?v=4&s=117" width="117">](https://github.com/Burkes) |
:---: |:---: |:---: |:---: |:---: |:---: |
[phitranphitranphitran](https://github.com/phitranphitranphitran) |[btrice](https://github.com/btrice) |[Martin005](https://github.com/Martin005) |[martiuslim](https://github.com/martiuslim) |[richmeij](https://github.com/richmeij) |[Burkes](https://github.com/Burkes) |

[<img alt="ThomasG77" src="https://avatars2.githubusercontent.com/u/642120?v=4&s=117" width="117">](https://github.com/ThomasG77) |[<img alt="zhuangya" src="https://avatars2.githubusercontent.com/u/499038?v=4&s=117" width="117">](https://github.com/zhuangya) |[<img alt="fortrieb" src="https://avatars0.githubusercontent.com/u/4126707?v=4&s=117" width="117">](https://github.com/fortrieb) |[<img alt="muhammadInam" src="https://avatars1.githubusercontent.com/u/7801708?v=4&s=117" width="117">](https://github.com/muhammadInam) |[<img alt="rosenfeld" src="https://avatars1.githubusercontent.com/u/32246?v=4&s=117" width="117">](https://github.com/rosenfeld) |[<img alt="ajschmidt8" src="https://avatars0.githubusercontent.com/u/7400326?v=4&s=117" width="117">](https://github.com/ajschmidt8) |
:---: |:---: |:---: |:---: |:---: |:---: |
[ThomasG77](https://github.com/ThomasG77) |[zhuangya](https://github.com/zhuangya) |[fortrieb](https://github.com/fortrieb) |[muhammadInam](https://github.com/muhammadInam) |[rosenfeld](https://github.com/rosenfeld) |[ajschmidt8](https://github.com/ajschmidt8) |

[<img alt="rhymes" src="https://avatars3.githubusercontent.com/u/146201?v=4&s=117" width="117">](https://github.com/rhymes) |[<img alt="functino" src="https://avatars0.githubusercontent.com/u/415498?v=4&s=117" width="117">](https://github.com/functino) |[<img alt="radarhere" src="https://avatars2.githubusercontent.com/u/3112309?v=4&s=117" width="117">](https://github.com/radarhere) |[<img alt="azeemba" src="https://avatars0.githubusercontent.com/u/2160795?v=4&s=117" width="117">](https://github.com/azeemba) |[<img alt="bducharme" src="https://avatars2.githubusercontent.com/u/4173569?v=4&s=117" width="117">](https://github.com/bducharme) |[<img alt="chao" src="https://avatars2.githubusercontent.com/u/55872?v=4&s=117" width="117">](https://github.com/chao) |
:---: |:---: |:---: |:---: |:---: |:---: |
[rhymes](https://github.com/rhymes) |[functino](https://github.com/functino) |[radarhere](https://github.com/radarhere) |[azeemba](https://github.com/azeemba) |[bducharme](https://github.com/bducharme) |[chao](https://github.com/chao) |

[<img alt="csprance" src="https://avatars0.githubusercontent.com/u/7902617?v=4&s=117" width="117">](https://github.com/csprance) |[<img alt="danmichaelo" src="https://avatars1.githubusercontent.com/u/434495?v=4&s=117" width="117">](https://github.com/danmichaelo) |[<img alt="mrboomer" src="https://avatars0.githubusercontent.com/u/5942912?v=4&s=117" width="117">](https://github.com/mrboomer) |[<img alt="lowsprofile" src="https://avatars1.githubusercontent.com/u/11029687?v=4&s=117" width="117">](https://github.com/lowsprofile) |[<img alt="gjungb" src="https://avatars0.githubusercontent.com/u/3391068?v=4&s=117" width="117">](https://github.com/gjungb) |[<img alt="Cloud887" src="https://avatars1.githubusercontent.com/u/27247160?v=4&s=117" width="117">](https://github.com/Cloud887) |
:---: |:---: |:---: |:---: |:---: |:---: |
[csprance](https://github.com/csprance) |[danmichaelo](https://github.com/danmichaelo) |[mrboomer](https://github.com/mrboomer) |[lowsprofile](https://github.com/lowsprofile) |[gjungb](https://github.com/gjungb) |[Cloud887](https://github.com/Cloud887) |

[<img alt="jagoPG" src="https://avatars3.githubusercontent.com/u/16286114?v=4&s=117" width="117">](https://github.com/jagoPG) |[<img alt="jcjmcclean" src="https://avatars3.githubusercontent.com/u/1822574?v=4&s=117" width="117">](https://github.com/jcjmcclean) |[<img alt="jessica-coursera" src="https://avatars1.githubusercontent.com/u/35155465?v=4&s=117" width="117">](https://github.com/jessica-coursera) |[<img alt="lucaperret" src="https://avatars1.githubusercontent.com/u/1887122?v=4&s=117" width="117">](https://github.com/lucaperret) |[<img alt="mperrando" src="https://avatars2.githubusercontent.com/u/525572?v=4&s=117" width="117">](https://github.com/mperrando) |[<img alt="mnafees" src="https://avatars1.githubusercontent.com/u/1763885?v=4&s=117" width="117">](https://github.com/mnafees) |
:---: |:---: |:---: |:---: |:---: |:---: |
[jagoPG](https://github.com/jagoPG) |[jcjmcclean](https://github.com/jcjmcclean) |[jessica-coursera](https://github.com/jessica-coursera) |[lucaperret](https://github.com/lucaperret) |[mperrando](https://github.com/mperrando) |[mnafees](https://github.com/mnafees) |

[<img alt="pauln" src="https://avatars3.githubusercontent.com/u/574359?v=4&s=117" width="117">](https://github.com/pauln) |[<img alt="phillipalexander" src="https://avatars0.githubusercontent.com/u/1577682?v=4&s=117" width="117">](https://github.com/phillipalexander) |[<img alt="luarmr" src="https://avatars3.githubusercontent.com/u/817416?v=4&s=117" width="117">](https://github.com/luarmr) |[<img alt="sergei-zelinsky" src="https://avatars2.githubusercontent.com/u/19428086?v=4&s=117" width="117">](https://github.com/sergei-zelinsky) |[<img alt="tomsaleeba" src="https://avatars0.githubusercontent.com/u/1773838?v=4&s=117" width="117">](https://github.com/tomsaleeba) |[<img alt="eltercero" src="https://avatars0.githubusercontent.com/u/545235?v=4&s=117" width="117">](https://github.com/eltercero) |
:---: |:---: |:---: |:---: |:---: |:---: |
[pauln](https://github.com/pauln) |[phillipalexander](https://github.com/phillipalexander) |[luarmr](https://github.com/luarmr) |[sergei-zelinsky](https://github.com/sergei-zelinsky) |[tomsaleeba](https://github.com/tomsaleeba) |[eltercero](https://github.com/eltercero) |

[<img alt="xhocquet" src="https://avatars2.githubusercontent.com/u/8116516?v=4&s=117" width="117">](https://github.com/xhocquet) |[<img alt="avalla" src="https://avatars1.githubusercontent.com/u/986614?v=4&s=117" width="117">](https://github.com/avalla) |[<img alt="c0b41" src="https://avatars1.githubusercontent.com/u/2834954?v=4&s=117" width="117">](https://github.com/c0b41) |[<img alt="franckl" src="https://avatars0.githubusercontent.com/u/3875803?v=4&s=117" width="117">](https://github.com/franckl) |[<img alt="kiloreux" src="https://avatars0.githubusercontent.com/u/6282557?v=4&s=117" width="117">](https://github.com/kiloreux) |[<img alt="raineluntta" src="https://avatars0.githubusercontent.com/u/14221637?v=4&s=117" width="117">](https://github.com/raineluntta) |
:---: |:---: |:---: |:---: |:---: |:---: |
[xhocquet](https://github.com/xhocquet) |[avalla](https://github.com/avalla) |[c0b41](https://github.com/c0b41) |[franckl](https://github.com/franckl) |[kiloreux](https://github.com/kiloreux) |[raineluntta](https://github.com/raineluntta) |

[<img alt="amitport" src="https://avatars1.githubusercontent.com/u/1131991?v=4&s=117" width="117">](https://github.com/amitport) |
:---: |
[amitport](https://github.com/amitport) |
<!--/contributors-->

## License

[The MIT License](LICENSE).
