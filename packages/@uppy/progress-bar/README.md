# @uppy/progress-bar

<img src="https://uppy.io/img/logo.svg" width="120" alt="Uppy logo: a smiling puppy above a pink upwards arrow" align="right">

[![npm version](https://img.shields.io/npm/v/@uppy/progress-bar.svg?style=flat-square)](https://www.npmjs.com/package/@uppy/progress-bar)
![CI status for Uppy tests](https://github.com/transloadit/uppy/workflows/CI/badge.svg)
![CI status for Companion tests](https://github.com/transloadit/uppy/workflows/Companion/badge.svg)
![CI status for browser tests](https://github.com/transloadit/uppy/workflows/End-to-end%20tests/badge.svg)

ProgressBar is a minimalist plugin that shows the current upload progress in a
thin bar element. Like the ones used by YouTube and GitHub when navigating
between pages.

Uppy is being developed by the folks at [Transloadit](https://transloadit.com),
a versatile file encoding service.

## Example

```js
import Uppy from '@uppy/core'
import ProgressBar from '@uppy/progress-bar'

const uppy = new Uppy()
uppy.use(ProgressBar, {
  // Options
})
```

## Installation

```bash
$ npm install @uppy/progress-bar
```

Alternatively, you can also use this plugin in a pre-built bundle from
Transloadit’s CDN: Smart CDN. In that case `Uppy` will attach itself to the
global `window.Uppy` object. See the
[main Uppy documentation](https://uppy.io/docs/#Installation) for instructions.

## Documentation

Documentation for this plugin can be found on the
[Uppy website](https://uppy.io/docs/progress-bar).

## License

[The MIT License](./LICENSE).
