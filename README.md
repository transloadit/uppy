# [Uppy](https://uppy.io) [![uppy on npm](https://img.shields.io/npm/v/uppy.svg?style=flat-square)](https://www.npmjs.com/package/uppy)

<img src="https://uppy.io/img/logo.svg" width="120" alt="Uppy logo: a smiling puppy above a pink upwards arrow" align="right">

Uppy is a sleek, modular JavaScript file uploader that integrates seamlessly
with any application. It’s fast, has a comprehensible API and lets you worry
about more important problems than building a file uploader.

- **Fetch** files from local disk, remote URLs, Google Drive, Dropbox, Box,
  Instagram or snap and record selfies with a camera
- **Preview** and edit metadata with a nice interface
- **Upload** to the final destination, optionally process/encode

<img src="https://github.com/transloadit/uppy/raw/main/assets/uppy-2-0-demo-aug-2021.gif">

**[Read the docs](https://uppy.io/docs)** |
**[Try Uppy](https://uppy.io/examples/dashboard/)**

<p>
  <a href="https://transloadit.com" target="_blank">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://github.com/transloadit/uppy/assets/375537/6651e57e-cb57-4336-8745-6473ae68d0bd">
      <source media="(prefers-color-scheme: light)" srcset="https://github.com/transloadit/uppy/assets/375537/7f14421d-1e37-464e-8203-ade121216c88">
      <img src="https://github.com/transloadit/uppy/assets/375537/7f14421d-1e37-464e-8203-ade121216c88" alt="Developed by Transloadit">
    </picture>
  </a>
</p>

Uppy is being developed by the folks at [Transloadit](https://transloadit.com),
a versatile API to handle any file in your app.

<table>
<tr><th>Tests</th><td><img src="https://github.com/transloadit/uppy/workflows/CI/badge.svg" alt="CI status for Uppy tests"></td><td><img src="https://github.com/transloadit/uppy/workflows/Companion/badge.svg" alt="CI status for Companion tests"></td></tr>
<tr><th>Deploys</th><td><img src="https://github.com/transloadit/uppy/workflows/Release/badge.svg" alt="CI status for CDN deployment"></td><td><img src="https://github.com/transloadit/uppy/workflows/Companion%20Edge%20Deploy/badge.svg" alt="CI status for Companion deployment"></td><td><img src="https://github.com/transloadit/uppy.io/workflows/Deploy%20to%20GitHub%20Pages/badge.svg" alt="CI status for website deployment"></td></tr>
</table>

## Example

Code used in the above example:

```js
import Uppy from '@uppy/core'
import Dashboard from '@uppy/dashboard'
import RemoteSources from '@uppy/remote-sources'
import ImageEditor from '@uppy/image-editor'
import Webcam from '@uppy/webcam'
import Tus from '@uppy/tus'

const uppy = new Uppy()
  .use(Dashboard, { trigger: '#select-files' })
  .use(RemoteSources, { companionUrl: 'https://companion.uppy.io' })
  .use(Webcam)
  .use(ImageEditor)
  .use(Tus, { endpoint: 'https://tusd.tusdemo.net/files/' })
  .on('complete', (result) => {
    console.log('Upload result:', result)
  })
```

**[Try it online](https://uppy.io/examples/dashboard/)** or
**[read the docs](https://uppy.io/docs)** for more details on how to use Uppy
and its plugins.

## Integrations

Uppy has first-class support for plain JS/HTML,
[React](https://uppy.io/docs/react/), [Svelte](https://uppy.io/docs/svelte/),
[Vue](https://uppy.io/docs/vue/), and [Angular](https://uppy.io/docs/angular/).

For the supported frameworks (except Angular) Uppy offers three ways to build user interfaces:

1. **Pre-composed, plug-and-play components.** Mainly `<Dashboard />`.
   The downside is that you can’t customize the UI.
2. **Headless components.** Smaller components, easier to override the styles
   or compose them together with your own components.
3. **Hooks.** Attach our logic to your own components, no restrictions, create a
   tailor-made UI.


## Features

- Lightweight, modular plugin-based architecture, light on dependencies :zap:
- Resumable file uploads via the open [tus](https://tus.io/) standard, so large
  uploads survive network hiccups
- Supports picking files from: Webcam, Dropbox, Box, Google Drive, Instagram,
  bypassing the user’s device where possible, syncing between servers directly
  via [@uppy/companion](https://uppy.io/docs/companion)
- Works great with file encoding and processing backends, such as
  [Transloadit](https://transloadit.com), works great without (all you need is
  to roll your own Apache/Nginx/Node/FFmpeg/etc backend)
- Sleek user interface :sparkles:
- Optional file recovery (after a browser crash) with
  [Golden Retriever](https://uppy.io/docs/golden-retriever/)
- Speaks several languages (i18n) :earth_africa:
- Built with accessibility in mind
- Free for the world, forever (as in beer 🍺, pizza 🍕, and liberty 🗽)
- Cute as a puppy, also accepts cat pictures :dog:

## Installation

```bash
npm install @uppy/core @uppy/dashboard @uppy/tus
```

Add CSS
[uppy.min.css](https://releases.transloadit.com/uppy/v5.1.0/uppy.min.css),
either to your HTML page’s `<head>` or include in JS, if your bundler of choice
supports it.

Alternatively, you can also use a pre-built bundle from Transloadit’s CDN: Smart
CDN. In that case `Uppy` will attach itself to the global `window.Uppy` object.

> ⚠️ The bundle consists of most Uppy plugins, so this method is not recommended
> for production, as your users will have to download all plugins when you are
> likely using only a few.

```html
<!-- 1. Add CSS to `<head>` -->
<link
  href="https://releases.transloadit.com/uppy/v5.1.0/uppy.min.css"
  rel="stylesheet"
/>

<!-- 2. Initialize -->
<div id="files-drag-drop"></div>
<script type="module">
  import {
    Uppy,
    Dashboard,
    Tus,
  } from 'https://releases.transloadit.com/uppy/v5.1.0/uppy.min.mjs'

  const uppy = new Uppy()
  uppy.use(Dashboard, { target: '#files-drag-drop' })
  uppy.use(Tus, { endpoint: 'https://tusd.tusdemo.net/files/' })
</script>
```

## Documentation

- [Uppy](https://uppy.io/docs/uppy/) — full list of options, methods and events
- [Companion](https://uppy.io/docs/companion/) — setting up and running a
  Companion instance, which adds support for Instagram, Dropbox, Box, Google
  Drive and remote URLs
- [React](https://uppy.io/docs/react/) — components to integrate Uppy UI plugins
  with React apps
- [Architecture & Writing a Plugin](https://uppy.io/docs/writing-plugins/) — how
  to write a plugin for Uppy

## Plugins

### UI Elements

- [`Dashboard`](https://uppy.io/docs/dashboard/) — universal UI with previews,
  progress bars, metadata editor and all the cool stuff. Required for most UI
  plugins like Webcam and Instagram
- Headless components ([react](https://uppy.io/docs/react/), [svelte](https://uppy.io/docs/svelte/), [vue](https://uppy.io/docs/vue/))

### Sources

- [`Drag & Drop`](https://uppy.io/docs/drag-drop/) — plain drag and drop area
- [`File Input`](https://uppy.io/docs/file-input/) — even plainer “select files”
  button
- [`Webcam`](https://uppy.io/docs/webcam/) — snap and record those selfies 📷
- ⓒ [`Google Drive`](https://uppy.io/docs/google-drive/) — import files from
  Google Drive
- ⓒ [`Dropbox`](https://uppy.io/docs/dropbox/) — import files from Dropbox
- ⓒ [`Box`](https://uppy.io/docs/box/) — import files from Box
- ⓒ [`Instagram`](https://uppy.io/docs/instagram/) — import images and videos
  from Instagram
- ⓒ [`Facebook`](https://uppy.io/docs/facebook/) — import images and videos from
  Facebook
- ⓒ [`OneDrive`](https://uppy.io/docs/onedrive/) — import files from Microsoft
  OneDrive
- ⓒ [`Import From URL`](https://uppy.io/docs/url/) — import direct URLs from
  anywhere on the web

The ⓒ mark means that [`@uppy/companion`](https://uppy.io/docs/companion), a
server-side component, is needed for a plugin to work.

### Destinations

- [`Tus`](https://uppy.io/docs/tus/) — resumable uploads via the open
  [tus](http://tus.io) standard
- [`XHR Upload`](https://uppy.io/docs/xhr-upload/) — regular uploads for any
  backend out there (like Apache, Nginx)
- [`AWS S3`](https://uppy.io/docs/aws-s3/) — plain upload to AWS S3 or
  compatible services

### File Processing

- [`Transloadit`](https://uppy.io/docs/transloadit/) — support for
  [Transloadit](http://transloadit.com)’s robust file uploading and encoding
  backend

### Miscellaneous

- [`Golden Retriever`](https://uppy.io/docs/golden-retriever/) — restores files
  after a browser crash, like it’s nothing
- [`Thumbnail Generator`](https://uppy.io/docs/thumbnail-generator/) — generates
  image previews (included by default with `Dashboard`)
- [`Form`](https://uppy.io/docs/form/) — collects metadata from `<form>` right
  before an Uppy upload, then optionally appends results back to the form

## Browser Support

We aim to support recent versions of Chrome, Firefox, and Safari.

## FAQ

### Why not use `<input type="file">`?

Having no JavaScript beats having a lot of it, so that’s a fair question!
Running an uploading & encoding business for ten years though we found that in
cases, the file input leaves some to be desired:

- We received complaints about broken uploads and found that resumable uploads
  are important, especially for big files and to be inclusive towards people on
  poorer connections (we also launched [tus.io](https://tus.io) to attack that
  problem). Uppy uploads can survive network outages and browser crashes or
  accidental navigate-aways.
- Uppy supports editing meta information before uploading.
- Uppy allows cropping images before uploading.
- There’s the situation where people are using their mobile devices and want to
  upload on the go, but they have their picture on Instagram, files in Dropbox
  or a plain file URL from anywhere on the open web. Uppy allows to pick files
  from those and push it to the destination without downloading it to your
  mobile device first.
- Accurate upload progress reporting is an issue on many platforms.
- Some file validation — size, type, number of files — can be done on the client
  with Uppy.
- Uppy integrates webcam support, in case your users want to upload a
  picture/video/audio that does not exist yet :)
- A larger drag and drop surface can be pleasant to work with. Some people also
  like that you can control the styling, language, etc.
- Uppy is aware of encoding backends. Often after an upload, the server needs to
  rotate, detect faces, optimize for iPad, or what have you. Uppy can track
  progress of this and report back to the user in different ways.
- Sometimes you might want your uploads to happen while you continue to interact
  on the same single page.

Not all apps need all these features. An `<input type="file">` is fine in many
situations. But these were a few things that our customers hit / asked about
enough to spark us to develop Uppy.

### Why is all this goodness free?

Transloadit’s team is small and we have a shared ambition to make a living from
open source. By giving away projects like [tus.io](https://tus.io) and
[Uppy](https://uppy.io), we’re hoping to advance the state of the art, make life
a tiny little bit better for everyone and in doing so have rewarding jobs and
get some eyes on our commercial service:
[a content ingestion & processing platform](https://transloadit.com).

Our thinking is that if only a fraction of our open source userbase can see the
appeal of hosted versions straight from the source, that could already be enough
to sustain our work. So far this is working out! We’re able to dedicate 80% of
our time to open source and haven’t gone bankrupt yet. :D

### Does Uppy support S3 uploads?

Yes, please check out the [docs](https://uppy.io/docs/aws-s3/) for more
information.

### Can I use Uppy with Rails/Node.js/Go/PHP?

Yes, whatever you want on the backend will work with `@uppy/xhr-upload` plugin,
since it only does a `POST` or `PUT` request. Here’s a
[PHP backend example](https://uppy.io/docs/xhr-upload/#Uploading-to-a-PHP-Server).

If you want resumability with the Tus plugin, use
[one of the tus server implementations](https://tus.io/implementations.html) 👌🏼

And you’ll need [`@uppy/companion`](https://uppy.io/docs/companion) if you’d
like your users to be able to pick files from Instagram, Google Drive, Dropbox
or via direct URLs (with more services coming).

## Contributions are welcome

- Contributor’s guide in [`.github/CONTRIBUTING.md`](.github/CONTRIBUTING.md)
- Changelog to track our release progress (we aim to roll out a release every
  month): [`CHANGELOG.md`](CHANGELOG.md)

## Used by

Uppy is used by: [Photobox](http://photobox.com), [Issuu](https://issuu.com/),
[Law Insider](https://lawinsider.com), [Cool Tabs](https://cool-tabs.com),
[Soundoff](https://soundoff.io), [Scrumi](https://www.scrumi.io/),
[Crive](https://crive.co/) and others.

Use Uppy in your project?
[Let us know](https://github.com/transloadit/uppy/issues/769)!

## Contributors

![contributors table](https://contrib.rocks/image?repo=transloadit/uppy)

## License

The [MIT License](./LICENSE).
