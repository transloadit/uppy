# @uppy/vue

<img src="https://uppy.io/images/logos/uppy-dog-head-arrow.svg" width="120" alt="Uppy logo: a superman puppy in a pink suit" align="right">

<a href="https://www.npmjs.com/package/@uppy/vue"><img src="https://img.shields.io/npm/v/@uppy/vue.svg?style=flat-square"></a>
<a href="https://travis-ci.org/transloadit/uppy"><img src="https://img.shields.io/travis/transloadit/uppy/master.svg?style=flat-square" alt="Build Status"></a>

Vue component wrappers around Uppy's officially maintained UI plugins.

Uppy is being developed by the folks at [Transloadit](https://transloadit.com), a versatile file encoding service.

## Example

```vue
<template>
  <dashboard-modal 
  :uppy="uppy" 
  :open="open" 
  :props="{
    onRequestCloseModal: handleClose
  }"/>
</template>

<script>
import Uppy from '@uppy/core'
import { DashboardModal } from '@uppy/vue'

export default {
  components: {
    DashboardModal
  },
  computed: {
    uppy: () => new Uppy()
  },
  data () {
    return {
      open: false
    }
  },
  methods: {
    handleClose: () => ''
  }
}
</script>
```

## Installation

```bash
$ npm install @uppy/vue
```

We recommend installing from npm and then using a module bundler such as [Webpack](https://webpack.js.org/), [Browserify](http://browserify.org/) or [Rollup.js](http://rollupjs.org/).

Alternatively, you can also use this plugin in a pre-built bundle from Transloadit's CDN: Edgly. In that case `Uppy` will attach itself to the global `window.Uppy` object. See the [main Uppy documentation](https://uppy.io/docs/#Installation) for instructions.

## Documentation

Documentation for this plugin can be found on the [Uppy website](https://uppy.io/docs/vue), when finalized. For now, you can read them [here](../../../website/src/docs/vue.md)

## License

[The MIT License](./LICENSE).

