# @uppy/provider-views

<img src="https://uppy.io/img/logo.svg" width="120" alt="Uppy logo: a smiling puppy above a pink upwards arrow" align="right">

[![npm version](https://img.shields.io/npm/v/@uppy/provider-views.svg?style=flat-square)](https://www.npmjs.com/package/@uppy/provider-views)
![CI status for Uppy tests](https://github.com/transloadit/uppy/workflows/CI/badge.svg)
![CI status for Companion tests](https://github.com/transloadit/uppy/workflows/Companion/badge.svg)
![CI status for browser tests](https://github.com/transloadit/uppy/workflows/End-to-end%20tests/badge.svg)

View library for Uppy remote provider plugins.

Uppy is being developed by the folks at [Transloadit](https://transloadit.com),
a versatile file encoding service.

## Example

```js
import Plugin from '@uppy/core/lib/plugin'
import { ProviderViews } from '@uppy/provider-views'

class GoogleDrive extends UIPlugin {
  install() {
    this.view = new ProviderViews(this)
    // snip
  }

  render(state) {
    return this.view.render(state)
  }
}
```

## Installation

> Unless you are creating a custom provider plugin, you do not need to install
> this.

```bash
$ npm install @uppy/provider-views
```

<!-- Undocumented currently
## Documentation

Documentation for this plugin can be found on the [Uppy website](https://uppy.io/docs/DOC_PAGE_HERE).
-->

## License

[The MIT License](./LICENSE).
