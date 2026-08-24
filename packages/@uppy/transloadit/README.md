# @uppy/transloadit

<img src="https://uppy.io/img/logo.svg" width="120" alt="Uppy logo: a smiling puppy above a pink upwards arrow" align="right">

[![npm version](https://img.shields.io/npm/v/@uppy/transloadit.svg?style=flat-square)](https://www.npmjs.com/package/@uppy/transloadit)
![CI status for Uppy tests](https://github.com/transloadit/uppy/workflows/CI/badge.svg)
![CI status for Companion tests](https://github.com/transloadit/uppy/workflows/Companion/badge.svg)
![CI status for browser tests](https://github.com/transloadit/uppy/workflows/End-to-end%20tests/badge.svg)

The Transloadit plugin can be used to upload files to Transloadit for all kinds
of processing, such as transcoding video, resizing images, zipping/unzipping,
[and more](https://transloadit.com/services/).

Uppy owns the open-source browser upload experience. Transloadit is the managed
backend that receives those uploads and runs the processing workflow. This
plugin connects the two; Uppy can also be used with other upload destinations.

[Run the unsigned local demo →](https://github.com/transloadit/uppy/tree/main/examples/transloadit)
(test use only). For production, follow the server-signed integration guide
above.

Uppy is being developed by the folks at [Transloadit](https://transloadit.com),
a versatile file encoding service.

## Example

```js
import Uppy from '@uppy/core'
import Transloadit from '@uppy/transloadit'

const uppy = new Uppy().use(Transloadit, {
  async assemblyOptions() {
    const response = await fetch('/api/transloadit-params', { method: 'POST' })
    if (!response.ok) {
      throw new Error(`Could not prepare the upload (${response.status})`)
    }
    return response.json()
  },
})
```

Generate the returned `params` and `signature` on your server. Never include
your Transloadit Auth Secret in browser code. See the canonical
[JavaScript, React, Next.js, Vue, and Angular guide](https://uppy.io/docs/guides/uppy-transloadit/)
for complete examples.

## Installation

```bash
$ npm install @uppy/transloadit
```

Alternatively, you can also use this plugin in a pre-built bundle from
Transloadit’s CDN: Smart CDN. In that case `Uppy` will attach itself to the
global `window.Uppy` object. See the
[main Uppy documentation](https://uppy.io/docs/#Installation) for instructions.

## Documentation

Documentation for this plugin can be found on the
[Uppy website](https://uppy.io/docs/transloadit).

## License

[The MIT License](./LICENSE).
