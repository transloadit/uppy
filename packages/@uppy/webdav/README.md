# @uppy/webdav

<img src="https://uppy.io/img/logo.svg" width="120" alt="Uppy logo: a smiling puppy above a pink upwards arrow" align="right">

[![npm version](https://img.shields.io/npm/v/@uppy/webdav.svg?style=flat-square)](https://www.npmjs.com/package/@uppy/webdav)

The WebDAV plugin for Uppy lets users import files from any WebDAV server, such
as Nextcloud or ownCloud. Only public WebDAV URLs are supported.

A [Companion](https://uppy.io/docs/companion) instance is required for the
WebDAV plugin to work. Companion connects to the WebDAV server, downloads the
files and uploads them to the destination, which saves the user bandwidth.

Uppy is being developed by the folks at [Transloadit](https://transloadit.com),
a versatile file encoding service.

## Example

```js
import Uppy from '@uppy/core'
import WebDav from '@uppy/webdav'

const uppy = new Uppy()
uppy.use(WebDav, {
  companionUrl: 'https://companion.example.com',
})
```

## Installation

```bash
$ npm install @uppy/webdav
```

## Documentation

Documentation for this plugin can be found on the
[Uppy website](https://uppy.io/docs/webdav).

## License

[The MIT License](https://github.com/transloadit/uppy/blob/main/LICENSE).
