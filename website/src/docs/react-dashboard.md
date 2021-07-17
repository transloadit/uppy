---
title: "&lt;Dashboard />"
type: docs
module: "@uppy/react"
permalink: docs/react/dashboard/
order: 5
category: "React"
---

The `<Dashboard />` component wraps the \[`@uppy/dashboard`]\[@uppy/dashboard] plugin. It only renders the Dashboard inline. To use the Dashboard modal (`inline: false`), use the [`<DashboardModal />`](/docs/react/dashboard-modal) component.

## Installation

Install from NPM:

```shell
npm install @uppy/react
```

```js
import { Dashboard } from '@uppy/react'

// Alternatively, you can also use a default import:
// import Dashboard from '@uppy/react/lib/Dashboard'
```

## CSS

The `Dashboard` component requires the following CSS for styling:

```js
import '@uppy/core/dist/style.css'
import '@uppy/dashboard/dist/style.css'
```

Import general Core styles from `@uppy/core/dist/style.css` first, then add the Dashboard styles from `@uppy/dashboard/dist/style.css`. A minified version is also available as `style.min.css` at the same path. The way to do import depends on your build system.

⚠️ The `@uppy/dashboard` plugin includes CSS for the Dashboard itself, and the various plugins used by the Dashboard, such as ([`@uppy/status-bar`](/docs/status-bar) and [`@uppy/informer`](/docs/informer)). If you also use the `@uppy/status-bar` or `@uppy/informer` plugin directly, you should not include their CSS files, but instead only use the one from the `@uppy/dashboard` plugin.

Styles for Provider plugins, like Google Drive and Instagram, are also bundled with Dashboard styles. Styles for other plugins, such as `@uppy/url` and `@uppy/webcam`, are not included. If you are using those, please see their docs and make sure to include styles for them as well.

## Props

The `<Dashboard />` component supports all \[`@uppy/dashboard`]\[@uppy/dashboard] options as props. Additionally, an Uppy instance must be provided in the `uppy={}` prop: see [Initializing Uppy](/docs/react/initializing) for details.

> The `<Dashboard />` cannot be passed to a `target:` option of a remote provider or plugins such as \[`@uppy/webcam`]\[@uppy/webcam]. To use other plugins like \[`@uppy/webcam`]\[@uppy/webcam] (Image Editor, Google Drive, etc) with the `<Dashboard />` component, first add them to the Uppy instance, and then specify their `id` in the [`plugins`](/docs/dashboard/#plugins) prop:

<!-- eslint-disable react/jsx-props-no-spreading -->

```js
import React from 'react'
import { Dashboard } from '@uppy/react'

function Uploader () {
  const uppy = React.useMemo(() => {
    return new Uppy()
      .use(Webcam) // `id` defaults to "Webcam". Note: no `target` option!
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
