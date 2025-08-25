# @uppy/remote-sources

<img src="https://uppy.io/img/logo.svg" width="120" alt="Uppy logo: a smiling puppy above a pink upwards arrow" align="right">

<a href="https://www.npmjs.com/package/@uppy/remote-sources"><img src="https://img.shields.io/npm/v/@uppy/compressor.svg?style=flat-square"></a>
<img src="https://github.com/transloadit/uppy/workflows/Tests/badge.svg" alt="CI status for Uppy tests">
<img src="https://github.com/transloadit/uppy/workflows/Companion/badge.svg" alt="CI status for Companion tests">
<img src="https://github.com/transloadit/uppy/workflows/End-to-end%20tests/badge.svg" alt="CI status for browser tests">

## Example

```js
import Uppy from '@uppy/core'
import RemoteSources from '@uppy/remote-sources'

const uppy = new Uppy()
uppy.use(RemoteSources, {
  companionUrl: 'https://your-companion-url',
})
```

## Installation

```bash
npm install @uppy/remote-sources
# or
yarn add @uppy/remote-sources
```

Alternatively, you can also use this plugin in a pre-built bundle from
Transloadit’s CDN: Smart CDN. In that case `Uppy.RemoteSources` will attach
itself to the global `window.Uppy` object. See the
[main Uppy documentation](https://uppy.io/docs/#Installation) for instructions.

## Documentation

Documentation for this plugin can be found on the
[Uppy website](https://uppy.io/docs/remote-sources).

## License

[The MIT License](./LICENSE).
