# @uppy/dashboard

<img src="https://uppy.io/img/logo.svg" width="120" alt="Uppy logo: a smiling puppy above a pink upwards arrow" align="right">

[![npm version](https://img.shields.io/npm/v/@uppy/dashboard.svg?style=flat-square)](https://www.npmjs.com/package/@uppy/dashboard)
![CI status for Uppy tests](https://github.com/transloadit/uppy/workflows/CI/badge.svg)
![CI status for Companion tests](https://github.com/transloadit/uppy/workflows/Companion/badge.svg)
![CI status for browser tests](https://github.com/transloadit/uppy/workflows/End-to-end%20tests/badge.svg)

Dashboard is a universal UI plugin for Uppy:

- Drag and Drop, paste, select from local disk / my device
- UI for Webcam and remote sources: Google Drive, Dropbox, Instagram (all
  optional, added via plugins)
- File previews and info
- Metadata editor
- Progress: total and for individual files
- Ability to pause/resume or cancel (depending on uploader plugin) individual or
  all files

**[Read the docs](https://uppy.io/docs/dashboard/)** |
**[Try it](https://uppy.io/examples/dashboard/)**

Uppy is being developed by the folks at [Transloadit](https://transloadit.com),
a versatile file encoding service.

## Example

```js
import Uppy from '@uppy/core'
import Dashboard from '@uppy/dashboard'

const uppy = new Uppy()
uppy.use(Dashboard, {
  target: 'body',
  inline: true,
})
```

## Installation

```bash
$ npm install @uppy/dashboard
```

Alternatively, you can also use this plugin in a pre-built bundle from
Transloadit’s CDN: Smart CDN. In that case `Uppy` will attach itself to the
global `window.Uppy` object. See the
[main Uppy documentation](https://uppy.io/docs/#Installation) for instructions.

## Documentation

Documentation for this plugin can be found on the
[Uppy website](https://uppy.io/docs/dashboard).

## License

[The MIT License](./LICENSE).
