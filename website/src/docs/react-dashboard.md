---
title: "&lt;Dashboard />"
type: docs
permalink: docs/react/dashboard/
order: 4
category: 'React'
---

The `<Dashboard />` component wraps the [`@uppy/dashboard`][] plugin. It only renders the Dashboard inline. To use the Dashboard modal (`inline: false`), use the [`<DashboardModal />`](/docs/react/dashboard-modal) component.

## Installation

Install from NPM:

```shell
npm install @uppy/react
```

```js
// Either:
import Dashboard from '@uppy/react/lib/Dashboard'
// Or:
import { Dashboard } from '@uppy/react'
```

## CSS

The `Dashboard` component requires the following CSS for styling:

```js
import '@uppy/core/dist/style.css'
import '@uppy/dashboard/dist/style.css'
```

Import general Core styles from `@uppy/core/dist/style.css` first, then add the Dashboard styles from `@uppy/dashboard/dist/style.css`. A minified version is also available as `style.min.css` at the same path. The way to do import depends on your build system.

⚠️ The `@uppy/dashboard` plugin includes CSS for the Dashboard itself, and the various plugins used by the Dashboard, such as ([`@uppy/status-bar`](/docs/status-bar) and [`@uppy/informer`](/docs/informer)). If you also use the `@uppy/status-bar` or `@uppy/informer` plugin directly, you should not include their CSS files, but instead only use the one from the `@uppy/dashboard` plugin.

Styles for Provider plugins, like Google Drive and Instagram, are also bundled with Dashboard styles. Styles for other plugins, such as `@uppy/url` and `@uppy/webcam`, are not inluded. If you are using those, please see their docs and make sure to include styles for them as well.

## Initializing Uppy

Your Uppy instance must be initialized before passing it to an `uppy={}` prop, and should be cleaned up using `uppy.close()` when you are done with it. A simple approach is to initialize it in your React component's `constructor()` and destroy it in `componentWillUnmount()`.

> ⚠ Uppy instances are stateful, so the same instance must be used across different renders.
> Do **NOT** initialize Uppy in a `render()` method!
> Do **NOT** initialize Uppy in a function component!

```js
class MyComponent extends React.Component {
  constructor (props) {
    super(props)
    this.uppy = Uppy()
      .use(Transloadit, {})
  }

  componentWillUnmount () {
    this.uppy.close()
  }

  render () {
    return <Dashboard uppy={this.uppy} />
  }
}
```

## Props

The `<Dashboard />` component supports all [`@uppy/dashboard`][] options as props.

The `<Dashboard />` cannot be passed to a `target:` option of a remote provider or plugins such as [`@uppy/webcam`][]. To use other plugins like [`@uppy/webcam`][] with the `<Dashboard />` component, first add them to the Uppy instance, and then specify their `id` in the [`plugins`](/docs/dashboard/#plugins) prop:

```js
// Do this wherever you initialize Uppy, e.g., in a React component's constructor method.
// Do NOT do it in `render()` or any other method that is called more than once!
uppy.use(Webcam) // `id` defaults to "Webcam"
uppy.use(Webcam, { id: 'MyWebcam' }) // `id` is… "MyWebcam"
```

Then add the following to `render()`:

```js
<Dashboard
  plugins={['Webcam']}
  {...props}
/>
```

[`@uppy/dashboard`]: /docs/dashboard/
[`@uppy/webcam`]: /docs/webcam/
