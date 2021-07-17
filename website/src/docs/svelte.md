---
title: "Svelte"
type: docs
module: "@uppy/svelte"
permalink: docs/svelte/
order: 1
category: "Other Integrations"
---

Uppy provides [Svelte][] components for the included UI plugins.

## Installation

All Svelte components are provided through the `@uppy/svelte` package.

Install from NPM:

```shell
npm install @uppy/svelte
# Or with yarn
yarn add @uppy/svelte
```

## CSS

Make sure to also include the necessary CSS files for each Uppy Svelte component you are using.

For [the example](https://github.com/transloadit/uppy/tree/master/examples/svelte-example), we used `svelte-preprocess` and `postcss` to allow imports in CSS. Here is a basic guide for getting that configured with Rollup.

```shell
npm install -D postcss postcss-import postcss-load-config
# Or with yarn
yarn add -D postcss postcss-import postcss-load-config
```

Then create a `postcss.config.js` like so:

```js
import postcss from 'postcss-import'

export default {
  plugins: [
    postcss,
  ],
}
```

Finally, enable `postcss` in your `rollup.config.js`

```js
import preprocess from 'svelte-preprocess'
// ...
svelte({
  preprocess: preprocess({
    postcss: true,
  }),
})
// ...
```

## Usage

The components can be used with [Svelte][] and frameworks that are based off it, like [Sapper][].

Instead of adding a UI plugin to an Uppy instance with `.use()`, the Uppy instance can be passed into components as an `uppy` prop.

```html
<main> 
  <Dashboard 
      uppy={uppy} 
      plugins={["Webcam"]}
  />
</main>

<script>
import { Dashboard } from '@uppy/svelte'

import Uppy from '@uppy/core'
import Webcam from '@uppy/webcam'

const uppy = new Uppy().use(Webcam);
</script>
```

The following plugins are available as Svelte component wrappers:

*   `<Dashboard />` - renders an inline `@uppy/dashboard`
*   `<DashboardModal />` - renders a `@uppy/dashboard` modal
*   `<DragDrop />` - renders a `@uppy/drag-drop` area
*   `<ProgressBar />` - renders a `@uppy/progress-bar`
*   `<StatusBar />` - renders a `@uppy/status-bar`

Each component takes a `props` prop that will be passed to the UI Plugin. Both `@uppy/dashboard` based plugins also take a `plugins` array as a props, make it easy to add your plugins.

### Initializing Uppy

Due to the way Svelte handles reactivity, you can simply initialize Uppy the same way you would with vanilla JavaScript

```js
import Uppy from '@uppy/core'
import Webcam from '@uppy/webcam'

const uppy = new Uppy().use(Webcam)
```

## Components

### `<Dashboard />`

#### CSS

The `Dashboard` component requires the following CSS for styling:

```html
<style global>
@import '@uppy/core/dist/style.css';
@import '@uppy/dashboard/dist/style.css';
</style>
```

Import general Core styles from `@uppy/core/dist/style.css` first, then add the Dashboard styles from `@uppy/dashboard/dist/style.css`. A minified version is also available as `style.min.css` at the same path. The way to do import depends on your build system.

⚠️ The `@uppy/dashboard` plugin includes CSS for the Dashboard itself, and the various plugins used by the Dashboard, such as ([`@uppy/status-bar`](/docs/status-bar) and [`@uppy/informer`](/docs/informer)). If you also use the `@uppy/status-bar` or `@uppy/informer` plugin directly, you should not include their CSS files, but instead only use the one from the `@uppy/dashboard` plugin.

Styles for Provider plugins, like Google Drive and Instagram, are also bundled with Dashboard styles. Styles for other plugins, such as `@uppy/url` and `@uppy/webcam`, are not included. If you are using those, please see their docs and make sure to include styles for them as well.

#### Props

The `<Dashboard />` component supports all `@uppy/dashboard` options to be passed as an object to the `props` prop:

```html
<Dashboard
    uppy={uppy}
    props={{
      height: 350,
      plugins: ['Webcam']
    }}
  />
```

The `<Dashboard />` cannot be passed to a `target:` option of a remote provider or plugins such as \[`@uppy/webcam`]\[@uppy/webcam]. To use other plugins like \[`@uppy/webcam`]\[@uppy/webcam] with the `<Dashboard />` component, first add them to the Uppy instance, and then specify their `id` in the [`plugins`](/docs/dashboard/#plugins) prop:

### `<DashboardModal />`

#### CSS

The `DashboardModal` component requires the following CSS for styling:

```html
<style global>
@import '@uppy/core/dist/style.css';
@import '@uppy/dashboard/dist/style.css';
</style>
```

Import general Core styles from `@uppy/core/dist/style.css` first, then add the Dashboard styles from `@uppy/dashboard/dist/style.css`. A minified version is also available as `style.min.css` at the same path. The way to do import depends on your build system.

⚠️ The `@uppy/dashboard` plugin includes CSS for the Dashboard itself, and the various plugins used by the Dashboard, such as ([`@uppy/status-bar`](/docs/status-bar) and [`@uppy/informer`](/docs/informer)). If you also use the `@uppy/status-bar` or `@uppy/informer` plugin directly, you should not include their CSS files, but instead only use the one from the `@uppy/dashboard` plugin.

Styles for Provider plugins, like Google Drive and Instagram, are also bundled with Dashboard styles. Styles for other plugins, such as `@uppy/url` and `@uppy/webcam`, are not included. If you are using those, please see their docs and make sure to include styles for them as well.

#### Props

The `<DashboardModal />` component supports all `@uppy/dashboard` options to be passed as an object on the `props` prop. An Uppy instance must be provided in the `uppy={}` prop.

The `<DashboardModal />` cannot be passed to a `target:` option of a remote provider or plugins such as \[`@uppy/webcam`]\[@uppy/webcam]. To use other plugins like \[`@uppy/webcam`]\[@uppy/webcam] with the `<DashboardModal />` component, first add them to the Uppy instance, and then specify their `id` in the [`plugins`](/docs/dashboard/#plugins) prop:

### `<DragDrop />`

#### CSS

The `DragDrop` component includes some simple styles, like shown in the [example](/examples/dragdrop). You can also choose not to use it and provide your own styles instead:

```html
<style global>
@import '@uppy/core/dist/style.css';
@import '@uppy/drag-drop/dist/style.css';
</style>
```

Import general Core styles from `@uppy/core/dist/style.css` first, then add the Drag & Drop styles from `@uppy/drag-drop/dist/style.css`. A minified version is also available as `style.min.css` at the same path. The way to do import depends on your build system.js

#### Props

The `<DragDrop />` component supports all `@uppy/drag-drop` options to be passed as an object on the `props` prop. An Uppy instance must be provided in the `uppy={}` prop.

### `<ProgressBar />`

#### CSS

The `ProgressBar` plugin requires the following CSS for styling:

```html
<style global>
@import '@uppy/core/dist/style.css';
@import '@uppy/progress-bar/dist/style.css';
</style>
```

Import general Core styles from `@uppy/core/dist/style.css` first, then add the Progress Bar styles from `@uppy/progress-bar/dist/style.css`. A minified version is also available as `style.min.css` at the same path. The way to do import depends on your build system.

#### Props

The `<ProgressBar />` component supports all `@uppy/progress-bar` options to be passed as an object on the `props` prop. An Uppy instance must be provided in the `uppy={}` prop.

### `<StatusBar />`

#### CSS

The `StatusBar` plugin requires the following CSS for styling:

```html
<style global>
@import '@uppy/core/dist/style.css';
@import '@uppy/status-bar/dist/style.css';
</style>
```

Import general Core styles from `@uppy/core/dist/style.css` first, then add the Status Bar styles from `@uppy/status-bar/dist/style.css`. A minified version is also available as `style.min.css` at the same path. The way to do import depends on your build system.

#### Props

The `<StatusBar />` component supports all `@uppy/status-bar` options to be passed as an object on the `props` prop. An Uppy instance must be provided in the `uppy={}` prop.

[Svelte]: https://svelte.dev

[Sapper]: https://sapper.svelte.dev

[`@uppy/webcam`]: /docs/webcam/
