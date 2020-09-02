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
## CSS

Make sure to also include the necessary CSS files for each Uppy Vue component you are using.

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

## Components

### `<Dashboard />` 
  
#### CSS

The `Dashboard` component requires the following CSS for styling:

```js
import '@uppy/core/dist/style.css'
import '@uppy/dashboard/dist/style.css'
```

Import general Core styles from `@uppy/core/dist/style.css` first, then add the Dashboard styles from `@uppy/dashboard/dist/style.css`. A minified version is also available as `style.min.css` at the same path. The way to do import depends on your build system.

⚠️ The `@uppy/dashboard` plugin includes CSS for the Dashboard itself, and the various plugins used by the Dashboard, such as ([`@uppy/status-bar`](/docs/status-bar) and [`@uppy/informer`](/docs/informer)). If you also use the `@uppy/status-bar` or `@uppy/informer` plugin directly, you should not include their CSS files, but instead only use the one from the `@uppy/dashboard` plugin.

Styles for Provider plugins, like Google Drive and Instagram, are also bundled with Dashboard styles. Styles for other plugins, such as `@uppy/url` and `@uppy/webcam`, are not inluded. If you are using those, please see their docs and make sure to include styles for them as well.

#### Props

The `Dashboard` component supports all `@uppy/dashboard` options to be passed as an object on the `props` prop. An Uppy instance must be provided in the `:uppy=''` prop. 

The `<Dashboard />` cannot be passed to a `target:` option of a remote provider or plugins such as [`@uppy/webcam`][]. To use other plugins like [`@uppy/webcam`][] with the `<Dashboard />` component, first add them to the Uppy instance, and then specify their `id` in the [`plugins`](/docs/dashboard/#plugins) prop:

### `<DashboardModal />` 
  
#### CSS

The `DashboardModal` component requires the following CSS for styling:

```js
import '@uppy/core/dist/style.css'
import '@uppy/dashboard/dist/style.css'
```

Import general Core styles from `@uppy/core/dist/style.css` first, then add the Dashboard styles from `@uppy/dashboard/dist/style.css`. A minified version is also available as `style.min.css` at the same path. The way to do import depends on your build system.

⚠️ The `@uppy/dashboard` plugin includes CSS for the Dashboard itself, and the various plugins used by the Dashboard, such as ([`@uppy/status-bar`](/docs/status-bar) and [`@uppy/informer`](/docs/informer)). If you also use the `@uppy/status-bar` or `@uppy/informer` plugin directly, you should not include their CSS files, but instead only use the one from the `@uppy/dashboard` plugin.

Styles for Provider plugins, like Google Drive and Instagram, are also bundled with Dashboard styles. Styles for other plugins, such as `@uppy/url` and `@uppy/webcam`, are not inluded. If you are using those, please see their docs and make sure to include styles for them as well.

#### Props

The `DashboardModal` component supports all `@uppy/dashboard` options to be passed as an object on the `props` prop. An Uppy instance must be provided in the `:uppy=''` prop. 

The `<DashboardModal />` cannot be passed to a `target:` option of a remote provider or plugins such as [`@uppy/webcam`][]. To use other plugins like [`@uppy/webcam`][] with the `<DashboardModal />` component, first add them to the Uppy instance, and then specify their `id` in the [`plugins`](/docs/dashboard/#plugins) prop:



[Vue]: https://vuejs.org
[Nuxt]: https://nuxtjs.org

[`@uppy/dashboard`]: /docs/dashboard/
[`@uppy/webcam`]: /docs/webcam/
