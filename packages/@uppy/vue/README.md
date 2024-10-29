# @uppy/vue

<img src="https://uppy.io/img/logo.svg" width="120" alt="Uppy logo: a smiling puppy above a pink upwards arrow" align="right">

[![npm version](https://img.shields.io/npm/v/@uppy/vue.svg?style=flat-square)](https://www.npmjs.com/package/@uppy/vue)
![CI status for Uppy tests](https://github.com/transloadit/uppy/workflows/CI/badge.svg)
![CI status for Companion tests](https://github.com/transloadit/uppy/workflows/Companion/badge.svg)
![CI status for browser tests](https://github.com/transloadit/uppy/workflows/End-to-end%20tests/badge.svg)

Vue component wrappers around Uppy’s officially maintained UI plugins.

Uppy is being developed by the folks at [Transloadit](https://transloadit.com),
a versatile file encoding service.

## Example

```vue
<template>
  <dashboard-modal
    :uppy="uppy"
    :open="open"
    :props="{
      onRequestCloseModal: handleClose,
    }"
  />
</template>

<script>
import Uppy from '@uppy/core'
import { DashboardModal } from '@uppy/vue'

export default {
  components: {
    DashboardModal,
  },
  computed: {
    uppy: () => new Uppy(),
  },
  data() {
    return {
      open: false,
    }
  },
  methods: {
    handleClose() {
      this.open = false
    },
  },
}
</script>
```

## Installation

```bash
$ npm install @uppy/vue
```

Alternatively, you can also use this plugin in a pre-built bundle from
Transloadit’s CDN: Smart CDN. In that case `Uppy` will attach itself to the
global `window.Uppy` object. See the
[main Uppy documentation](https://uppy.io/docs/#Installation) for instructions.

## Documentation

Documentation for this plugin can be found on the
[Uppy website](https://uppy.io/docs/vue).

## License

[The MIT License](./LICENSE).
