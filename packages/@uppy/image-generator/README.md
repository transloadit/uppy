# @uppy/image-generator

<img src="https://uppy.io/img/logo.svg" width="120" alt="Uppy logo: a smiling puppy above a pink upwards arrow" align="right">

[![npm version](https://img.shields.io/npm/v/@uppy/image-generator.svg?style=flat-square)](https://www.npmjs.com/package/@uppy/image-generator)
![CI status for Uppy tests](https://github.com/transloadit/uppy/workflows/Tests/badge.svg)
![CI status for Companion tests](https://github.com/transloadit/uppy/workflows/Companion/badge.svg)
![CI status for browser tests](https://github.com/transloadit/uppy/workflows/End-to-end%20tests/badge.svg)

**[Read the docs](https://uppy.io/docs/image-generator)** |
**[Try it](https://uppy.io/examples/)**

Uppy is being developed by the folks at [Transloadit](https://transloadit.com),
a versatile file encoding service.

## Example

```js
import Uppy from '@uppy/core'
import ImageGenerator from '@uppy/image-generator'

const uppy = new Uppy()
  .use(ImageGenerator, {
    assemblyOptions: async (prompt) => {
      const res = await fetch(`/assembly-options?prompt=${encodeURIComponent(prompt)}`)
      return res.json()
    }
  })
```

## Installation

```bash
$ npm install @uppy/image-generator
```

Alternatively, you can also use this plugin in a pre-built bundle from
Transloadit’s CDN: Edgly. In that case `Uppy` will attach itself to the global
`window.Uppy` object. See the
[main Uppy documentation](https://uppy.io/docs/#Installation) for instructions.

## Documentation

Documentation for this plugin can be found on the
[Uppy website](https://uppy.io/docs/image-generator).

## License

[The MIT License](./LICENSE).
