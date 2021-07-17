---
title: "Angular"
type: docs
module: "@uppy/angular"
permalink: docs/angular/
order: 0
category: "Other Integrations"
---

Uppy provides [Angular][] components for the included UI plugins.

## Installation

All Angular components are provided through the `@uppy/angular` package

Install from NPM:

```shell
npm install @uppy/angular
# Or with yarn
yarn add @uppy/angular
```

## CSS

Make sure to also include the necessary CSS files for each Uppy Angular component you are using.

## Usage

The components can be used with [Angular][].

Instead of adding a UI plugin to an Uppy instance with `.use()`, the Uppy instance can be passed into components as a `props` prop.

```typescript
// app.module.ts

import { NgModule } from '@angular/core'
import { UppyAngularDashboardModule } from '@uppy/angular'

import { BrowserModule } from '@angular/platform-browser'
import { AppComponent } from './app.component'

@NgModule({
  declarations: [
    AppComponent,
  ],
  imports: [
    BrowserModule,
    UppyAngularDashboardModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
class {}
```

```html
<!--- app.component.html -->
<uppy-dashboard
  [uppy]='uppy'>
</uppy-dashboard>
```

```typescript
// app.component.ts

import { Component } from '@angular/core'
import { Uppy } from '@uppy/core'

@Component({
  selector: 'app-root',
})
export class AppComponent {
  uppy: Uppy = new Uppy({ debug: true, autoProceed: true })
}
```

The following plugins are available as Angular component wrappers:

*   `<uppy-dashboard />` - renders a `@uppy/dashboard`
*   `<uppy-drag-drop />` - renders a `@uppy/drag-drop` area
*   `<uppy-progress-bar />` - renders a `@uppy/progress-bar`
*   `<uppy-status-bar />` - renders a `@uppy/status-bar`

Each component takes a `props` prop that will be passed to the UI Plugin.

### Initializing Uppy

You should initialize Uppy as a property of your component.

```typescript
import { Uppy } from '@uppy/core'

export class AppComponent {
  uppy: Uppy = new Uppy({ debug: true, autoProceed: true })
}
```

## Components

### `<uppy-dashboard />`

#### CSS

The `UppyAngularDashboardModule` component requires the following CSS for styling (added to your component decorator or to your `angular.json`). You can also provide your own styles if you prefer:

```typescript
@Component({
  // Snip
  styleUrls: [
    '../node_modules/@uppy/core/dist/style.css',
    '../node_modules/@uppy/dashboard/dist/style.css',
  ],
})
class {}
```

Import general Core styles from `@uppy/core/dist/style.css` first, then add the Dashboard styles from `@uppy/dashboard/dist/style.css`. A minified version is also available as `style.min.css` at the same path.

⚠️ The `@uppy/dashboard` plugin includes CSS for the Dashboard itself, and the various plugins used by the Dashboard, such as ([`@uppy/status-bar`](/docs/status-bar) and [`@uppy/informer`](/docs/informer)). If you also use the `@uppy/status-bar` or `@uppy/informer` plugin directly, you should not include their CSS files, but instead only use the one from the `@uppy/dashboard` plugin.

Styles for Provider plugins, like Google Drive and Instagram, are also bundled with Dashboard styles. Styles for other plugins, such as `@uppy/url` and `@uppy/webcam`, are not included. If you are using those, please see their docs and make sure to include styles for them as well.

#### Props

The `<uppy-dashboard />` component supports all `@uppy/dashboard` options to be passed as an object on the `props` prop. An Uppy instance must be provided in the `[uppy]=''` prop.

The `<uppy-dashboard />` cannot be passed to a `target:` option of a remote provider or plugins such as \[`@uppy/webcam`]\[@uppy/webcam]. To use other plugins like \[`@uppy/webcam`]\[@uppy/webcam] with the `<uppy-dashboard />` component, first add them to the Uppy instance, and then specify their `id` in the options you pass.

### `<uppy-dashboard-modal />`

#### CSS

The `UppyAngularDashboardModalModule` component requires the following CSS for styling (added to your component decorator or to your `angular.json`). You can also provide your own styles if you prefer:

```typescript
@Component({
  // Snip
  styleUrls: [
    '../node_modules/@uppy/core/dist/style.css',
    '../node_modules/@uppy/dashboard/dist/style.css',
  ],
})
class{}
```

Import general Core styles from `@uppy/core/dist/style.css` first, then add the Dashboard styles from `@uppy/dashboard/dist/style.css`. A minified version is also available as `style.min.css` at the same path.

⚠️ The `@uppy/dashboard` plugin includes CSS for the Dashboard itself, and the various plugins used by the Dashboard, such as ([`@uppy/status-bar`](/docs/status-bar) and [`@uppy/informer`](/docs/informer)). If you also use the `@uppy/status-bar` or `@uppy/informer` plugin directly, you should not include their CSS files, but instead only use the one from the `@uppy/dashboard` plugin.

Styles for Provider plugins, like Google Drive and Instagram, are also bundled with Dashboard styles. Styles for other plugins, such as `@uppy/url` and `@uppy/webcam`, are not included. If you are using those, please see their docs and make sure to include styles for them as well.

#### Props

The `<uppy-dashboard-modal />` component supports all `@uppy/dashboard` options to be passed as an object on the `props` prop. An Uppy instance must be provided in the `[uppy]=''` prop. Additionally, it takes an `[open]=''` prop, telling it which state to display in

The `<uppy-dashboard-modal />` cannot be passed to a `target:` option of a remote provider or plugins such as \[`@uppy/webcam`]\[@uppy/webcam]. To use other plugins like \[`@uppy/webcam`]\[@uppy/webcam] with the `<uppy-dashboard-modal />` component, first add them to the Uppy instance, and then specify their `id` in the options you pass.

### `<uppy-drag-drop />`

#### CSS

The `UppyAngularDragDropModule` component includes some simple styles, like shown in the [example](/examples/dragdrop). You can also choose not to use it and provide your own styles instead:

```typescript
@Component({
  // Snip
  styleUrls: [
    '../node_modules/@uppy/core/dist/style.css',
    '../node_modules/@uppy/drag-drop/dist/style.css',
  ],
})
class{}
```

Import general Core styles from `@uppy/core/dist/style.css` first, then add the Drag & Drop styles from `@uppy/drag-drop/dist/style.css`. A minified version is also available as `style.min.css` at the same path.

#### Props

The `<uppy-drag-drop />` component supports all `@uppy/drag-drop` options to be passed as an object on the `props` prop. An Uppy instance must be provided in the `[uppy]=''` prop.

### `<uppy-progress-bar />`

#### CSS

The `UppyAngularProgressBarModule` plugin requires the following CSS for styling:

```typescript
@Component({
  // Snip
  styleUrls: [
    '../node_modules/@uppy/core/dist/style.css',
    '../node_modules/@uppy/progress-bar/dist/style.css',
  ],
})
class {}
```

Import general Core styles from `@uppy/core/dist/style.css` first, then add the Progress Bar styles from `@uppy/progress-bar/dist/style.css`. A minified version is also available as `style.min.css` at the same path. The way to do import depends on your build system.

#### Props

The `<uppy-progress-bar />` component supports all `@uppy/progress-bar` options to be passed as an object on the `props` prop. An Uppy instance must be provided in the `[uppy]=''` prop.

### `<uppy-status-bar />`

#### CSS

The `UppyAngularStatusBar` plugin requires the following CSS for styling:

```typescript
@Component({
  // Snip
  styleUrls: [
    '../node_modules/@uppy/core/dist/style.css',
    '../node_modules/@uppy/status-bar/dist/style.css',
  ],
})
class {}
```

Import general Core styles from `@uppy/core/dist/style.css` first, then add the Status Bar styles from `@uppy/status-bar/dist/style.css`. A minified version is also available as `style.min.css` at the same path. The way to do import depends on your build system.

#### Props

The `<uppy-status-bar />` component supports all `@uppy/status-bar` options to be passed as an object on the `props` prop. An Uppy instance must be provided in the `[uppy]=''` prop.

[Angular]: https://angular.io

[`@uppy/webcam`]: /docs/webcam/
