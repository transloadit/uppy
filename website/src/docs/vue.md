---
title: "Vue"
type: docs
module: "@uppy/vue"
permalink: docs/vue/
order: 0
category: "Other Integrations"
---

Uppy provides [Vue][] components for the included UI plugins.

Note: *All plugin names are in kebab-case for the HTML element, and in CamelCase for the JavaScript imports, following Vue conventions*

## Installation

All Vue components are provided through the `@uppy/vue` package

Install from NPM:

```shell
npm install @uppy/vue
# Or with yarn
yarn add @uppy/vue
```

## CSS

Make sure to also include the necessary CSS files for each Uppy Vue component you are using.

## Usage

The components can be used with [Vue][] and frameworks that use it, like [Nuxt][].

Instead of adding a UI plugin to an Uppy instance with `.use()`, the Uppy instance can be passed into components as an `uppy` prop.

```html
<template>
  <div id="app">
    <dashboard :uppy="uppy" :plugins="['Webcam']" :props="{theme: 'light'}" />
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

*   `<dashboard />` - renders an inline `@uppy/dashboard`
*   `<dashboard-modal />` - renders a `@uppy/dashboard` modal
*   `<drag-drop />` - renders a `@uppy/drag-drop` area
*   `<progress-bar />` - renders a `@uppy/progress-bar`
*   `<status-bar />` - renders a `@uppy/status-bar`

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
    }),
  },
  beforeDestroy () {
    this.uppy.close()
  },
}
```

## Components

### `<dashboard />`

#### CSS

The `Dashboard` component requires the following CSS for styling:

```html
<style src='@uppy/core/dist/style.css'></style> 
<style src='@uppy/dashboard/dist/style.css'></style> 
```

Import general Core styles from `@uppy/core/dist/style.css` first, then add the Dashboard styles from `@uppy/dashboard/dist/style.css`. A minified version is also available as `style.min.css` at the same path. The way to do import depends on your build system. With default Vue, you can just add a `style` tag and make the `src` attribute the file you need.

⚠️ The `@uppy/dashboard` plugin includes CSS for the Dashboard itself, and the various plugins used by the Dashboard, such as ([`@uppy/status-bar`](/docs/status-bar) and [`@uppy/informer`](/docs/informer)). If you also use the `@uppy/status-bar` or `@uppy/informer` plugin directly, you should not include their CSS files, but instead only use the one from the `@uppy/dashboard` plugin.

Styles for Provider plugins, like Google Drive and Instagram, are also bundled with Dashboard styles. Styles for other plugins, such as `@uppy/url` and `@uppy/webcam`, are not included. If you are using those, please see their docs and make sure to include styles for them as well.

#### Props

The `<dashboard />` component supports all `@uppy/dashboard` options to be passed as an object on the `props` prop. An Uppy instance must be provided in the `:uppy=''` prop.

The `<dashboard />` cannot be passed to a `target:` option of a remote provider or plugins such as \[`@uppy/webcam`]\[@uppy/webcam]. To use other plugins like \[`@uppy/webcam`]\[@uppy/webcam] with the `<dashboard />` component, first add them to the Uppy instance, and then specify their `id` in the [`plugins`](/docs/dashboard/#plugins) prop:

### `<dashboard-modal />`

#### CSS

The `DashboardModal` component requires the following CSS for styling:

```html
<style src='@uppy/core/dist/style.css'></style> 
<style src='@uppy/dashboard/dist/style.css'></style> 
```

Import general Core styles from `@uppy/core/dist/style.css` first, then add the Dashboard styles from `@uppy/dashboard/dist/style.css`. A minified version is also available as `style.min.css` at the same path. The way to do import depends on your build system. With default Vue, you can just add a `style` tag and make the `src` attribute the file you need.

⚠️ The `@uppy/dashboard` plugin includes CSS for the Dashboard itself, and the various plugins used by the Dashboard, such as ([`@uppy/status-bar`](/docs/status-bar) and [`@uppy/informer`](/docs/informer)). If you also use the `@uppy/status-bar` or `@uppy/informer` plugin directly, you should not include their CSS files, but instead only use the one from the `@uppy/dashboard` plugin.

Styles for Provider plugins, like Google Drive and Instagram, are also bundled with Dashboard styles. Styles for other plugins, such as `@uppy/url` and `@uppy/webcam`, are not included. If you are using those, please see their docs and make sure to include styles for them as well.

#### Props

The `<dashboard-modal />` component supports all `@uppy/dashboard` options to be passed as an object on the `props` prop. An Uppy instance must be provided in the `:uppy=''` prop.

The `<dashboard-modal />` cannot be passed to a `target:` option of a remote provider or plugins such as \[`@uppy/webcam`]\[@uppy/webcam]. To use other plugins like \[`@uppy/webcam`]\[@uppy/webcam] with the `<dashboard-modal />` component, first add them to the Uppy instance, and then specify their `id` in the [`plugins`](/docs/dashboard/#plugins) prop:

### `<drag-drop />`

#### CSS

The `DragDrop` component includes some simple styles, like shown in the [example](/examples/dragdrop). You can also choose not to use it and provide your own styles instead:

```html
<style src='@uppy/core/dist/style.css'></style> 
<style src='@uppy/drag-drop/dist/style.css'></style> 
```

Import general Core styles from `@uppy/core/dist/style.css` first, then add the Drag & Drop styles from `@uppy/drag-drop/dist/style.css`. A minified version is also available as `style.min.css` at the same path. The way to do import depends on your build system.

#### Props

The `<drag-drop />` component supports all `@uppy/drag-drop` options to be passed as an object on the `props` prop. An Uppy instance must be provided in the `:uppy=''` prop.

### `<progress-bar />`

#### CSS

The `ProgressBar` plugin requires the following CSS for styling:

```html
<style src='@uppy/core/dist/style.css'></style> 
<style src='@uppy/progress-bar/dist/style.css'></style> 
```

Import general Core styles from `@uppy/core/dist/style.css` first, then add the Progress Bar styles from `@uppy/progress-bar/dist/style.css`. A minified version is also available as `style.min.css` at the same path. The way to do import depends on your build system.

#### Props

The `<progress-bar />` component supports all `@uppy/progress-bar` options to be passed as an object on the `props` prop. An Uppy instance must be provided in the `:uppy=''` prop.

### `<status-bar />`

#### CSS

The `StatusBar` plugin requires the following CSS for styling:

```html
<style src='@uppy/core/dist/style.css'></style> 
<style src='@uppy/status-bar/dist/style.css'></style> 
```

Import general Core styles from `@uppy/core/dist/style.css` first, then add the Status Bar styles from `@uppy/status-bar/dist/style.css`. A minified version is also available as `style.min.css` at the same path. The way to do import depends on your build system.

#### Props

The `<status-bar />` component supports all `@uppy/status-bar` options to be passed as an object on the `props` prop. An Uppy instance must be provided in the `:uppy=''` prop.

[Vue]: https://vuejs.org

[Nuxt]: https://nuxtjs.org

[`@uppy/webcam`]: /docs/webcam/
