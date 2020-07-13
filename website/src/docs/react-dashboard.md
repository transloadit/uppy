---
title: "&lt;Dashboard />"
type: docs
module: "@uppy/react"
permalink: docs/react/dashboard/
order: 5
category: "React"
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

## Props

The `<Dashboard />` component supports all [`@uppy/dashboard`][] options as props. Additionally, an Uppy instance must be provided in the `uppy={}` prop: see [Initializing Uppy](/docs/react/initializing) for details.

The `<Dashboard />` cannot be passed to a `target:` option of a remote provider or plugins such as [`@uppy/webcam`][]. To use other plugins like [`@uppy/webcam`][] with the `<Dashboard />` component, first add them to the Uppy instance, and then specify their `id` in the [`plugins`](/docs/dashboard/#plugins) prop:

```js
function Uploader () {
  const uppy = React.useMemo(() => {
    return Uppy()
      .use(Webcam) // `id` defaults to "Webcam"
      // or
      .use(Webcam, { id: 'MyWebcam' }) // `id` is… "MyWebcam"
  }, [])
  React.useEffect(() => {
    return () => uppy.close()
  }, [])

  return (
    <Dashboard
      uppy={uppy}
      plugins={['Webcam']}
      {...props}
    />
  )
}
```

[`@uppy/dashboard`]: /docs/dashboard/
[`@uppy/webcam`]: /docs/webcam/
