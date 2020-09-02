---
title: "Vue Integration"
type: docs
module: "@uppy/vue"
permalink: docs/vue/
order: 0
category: "Vue"
---

Uppy provides [Vue][] components for the included UI plugins.

## Installation

All Vue components are provided through the `@uppy/vue` package

Install from NPM:

```sh
npm install @uppy/vue
```

## Usage

The components can be used with [Vue][] and frameworks that use it, like [Nuxt][].

Instead of adding a UI plugin to an Uppy instance with `.use()`, the Uppy instance can be passed into components as an `uppy` prop. 

Note: At the moment, this example is not functional due to an unresolved issue with using other plugins with the Dashboard

```vue
<template>
  <div id="app">
    <Dashboard :uppy="uppy" :plugins="['Webcam']"/>
  </div>
</template>

<script>
import { Dashboard } from '@uppy/vue'

import '@uppy/core/dist/style.css'
import '@uppy/dashboard/dist/style.css'

import Uppy from '@uppy/core'
import Webcam from '@uppy/webcam'

export default {
  name: 'App',
  components: {
    Dashboard
  },
  computed: {
    uppy: () => new Uppy().use(Webcam)
  },
  beforeDestroy () {
    this.uppy.close()
  }
}
</script>
```

The following plugins are available as Vue component wrappers:

 - `<Dashboard />` - renders an inline `@uppy/dashboard`
 - `<DashboardModal />` - renders a `@uppy/dashboard` modal
 - `<DragDrop />` - renders a `@uppy/drag-drop` area
 - `<ProgressBar />` - renders a `@uppy/progress-bar`
 - `<StatusBar />` - renders a `@uppy/status-bar`

Each component takes a `props` prop that will be passed to the UI Plugin. Both `@uppy/dashboard` based plugins also take a `plugins` array as a props, make it easy to add your plugins. 

### Initializing Uppy

The easiest way to initialize Uppy is creating a new instance in your `data` or `computed` and to run `uppy.close()` in the `beforeDestroy` method. You can do additional configuration with plugins where-ever you're initializing Uppy

```js
import Uppy from '@uppy/core'
import Webcam from '@uppy/webcam'

import '@uppy/core/dist/style.css'
import '@uppy/dashboard/dist/style.css'

export default {
  computed: {
    uppy: () => new Uppy().use(Webcam, {
    // Config
    })
  },
  beforeDestroy () {
    this.uppy.close()
  }
}
```

## Component Differences
- `<Dashboard />` 
  - Takes a `plugins` array for what plugins to use
- `<DashboardModal />`
  - Takes a `plugins` array for what plugins to use
  - A `open` boolean to determine whether or not the modal should be open

[Vue]: https://vuejs.org
[Nuxt]: https://nuxtjs.org