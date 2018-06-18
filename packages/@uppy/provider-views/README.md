# @uppy/provider-views

<img src="https://uppy.io/images/logos/uppy-dog-head-arrow.svg" width="120" alt="Uppy logo: a superman puppy in a pink suit" align="right">

<a href="https://www.npmjs.com/package/@uppy/provider-views"><img src="https://img.shields.io/npm/v/@uppy/provider-views.svg?style=flat-square"></a>
<a href="https://travis-ci.org/transloadit/uppy"><img src="https://img.shields.io/travis/transloadit/uppy/master.svg?style=flat-square" alt="Build Status"></a>

View library for Uppy remote provider plugins.

Uppy is being developed by the folks at [Transloadit](https://transloadit.com), a versatile file encoding service.

## Example

```js
const Plugin = require('@uppy/core/lib/plugin')
const ProviderViews = require('@uppy/provider-views')

class GoogleDrive extends Plugin {
  constructor () { /* snip */ }
  install () {
    this.view = new ProviderViews(this)
    // snip
  }

  render (state) {
    return this.view.render(state)
  }
}
```

## Installation

> Unless you are creating a custom provider plugin, you do not need to install this.

```bash
$ npm install @uppy/provider-views --save
```

<!-- Undocumented currently
## Documentation

Documentation for this plugin can be found on the [Uppy website](https://uppy.io/docs/DOC_PAGE_HERE).
-->

## License

[The MIT License](./LICENSE).
