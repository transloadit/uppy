# @uppy/drop-target

<img src="https://uppy.io/img/logo.svg" width="120" alt="Uppy logo: a smiling puppy above a pink upwards arrow" align="right">

[![npm version](https://img.shields.io/npm/v/@uppy/drop-target.svg?style=flat-square)](https://www.npmjs.com/package/@uppy/drop-target)

The Drop Target plugin lets users drag and drop files onto any element on the
page, for example the whole page, and adds them to Uppy. Use it alongside the
Dashboard, or with your own UI.

Uppy is being developed by the folks at [Transloadit](https://transloadit.com),
a versatile file encoding service.

## Example

```js
import Uppy from '@uppy/core'
import DropTarget from '@uppy/drop-target'

const uppy = new Uppy()
uppy.use(DropTarget, {
  target: document.body,
})
```

## Installation

```bash
$ npm install @uppy/drop-target
```

## Documentation

Documentation for this plugin can be found on the
[Uppy website](https://uppy.io/docs/drop-target).

## License

[The MIT License](https://github.com/transloadit/uppy/blob/main/LICENSE).
