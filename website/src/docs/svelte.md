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

All Svelte components are provided through the `@uppy/svelte` package

Install from NPM:

```shell
npm install @uppy/svelte
# Or with yarn
yarn add @uppy/svelte
```
## CSS

Make sure to also include the necessary CSS files for each Uppy Svelte component you are using.

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

let uppy = new Uppy().use(Webcam);
</script>
```

The following plugins are available as Svelte component wrappers:

 - `<Dashboard />` - renders an inline `@uppy/dashboard`
 - `<DashboardModal />` - renders a `@uppy/dashboard` modal
 - `<DragDrop />` - renders a `@uppy/drag-drop` area
 - `<ProgressBar />` - renders a `@uppy/progress-bar`
 - `<StatusBar />` - renders a `@uppy/status-bar`

Each component takes a `props` prop that will be passed to the UI Plugin. Both `@uppy/dashboard` based plugins also take a `plugins` array as a props, make it easy to add your plugins. 

### Initializing Uppy

Due to the way Svelte handles reactivity, you can simply initialize Uppy the same way you would with vanilla JavaScript

```js
import Uppy from '@uppy/core'
import Webcam from '@uppy/webcam'

let uppy = new Uppy().use(Webcam)
```

## Components

### `<Dashboard />` 
  
#### Props

The `<Dashboard />` component supports all `@uppy/dashboard` options to be passed as an object on the `props` prop. An Uppy instance must be provided in the `uppy={}` prop. 

The `<Dashboard />` cannot be passed to a `target:` option of a remote provider or plugins such as [`@uppy/webcam`][]. To use other plugins like [`@uppy/webcam`][] with the `<Dashboard />` component, first add them to the Uppy instance, and then specify their `id` in the [`plugins`](/docs/dashboard/#plugins) prop:

### `<DashboardModal />` 
  
#### Props

The `<DashboardModal />` component supports all `@uppy/dashboard` options to be passed as an object on the `props` prop. An Uppy instance must be provided in the `uppy={}` prop. 

The `<DashboardModal />` cannot be passed to a `target:` option of a remote provider or plugins such as [`@uppy/webcam`][]. To use other plugins like [`@uppy/webcam`][] with the `<DashboardModal />` component, first add them to the Uppy instance, and then specify their `id` in the [`plugins`](/docs/dashboard/#plugins) prop:

### `<DragDrop />`

#### Props

The `<DragDrop />` component supports all `@uppy/drag-drop` options to be passed as an object on the `props` prop. An Uppy instance must be provided in the `uppy={}` prop. 

### `<ProgressBar />`

#### Props

The `<ProgressBar />` component supports all `@uppy/progress-bar` options to be passed as an object on the `props` prop. An Uppy instance must be provided in the `uppy={}` prop. 

### `<StatusBar />`

#### Props

The `<StatusBar />` component supports all `@uppy/status-bar` options to be passed as an object on the `props` prop. An Uppy instance must be provided in the `uppy={}` prop. 

[Svelte]: https://svelte.dev
[Sapper]: https://sapper.svelte.dev

[`@uppy/webcam`]: /docs/webcam/
