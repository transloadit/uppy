---
title: "Introduction"
type: docs
module: "@uppy/react"
permalink: docs/react/
order: 0
category: "React"
---

Uppy provides [React][] components for the included UI plugins.

## Installation

All React components are provided through the `@uppy/react` package.

Install from NPM:

```shell
npm install @uppy/react
```

## Usage

The components can be used with either [React][] or API-compatible alternatives such as [Preact][].

Instead of adding a UI plugin to an Uppy instance with `.use()`, the Uppy instance can be passed into components as an `uppy` prop.
All other props are passed as options to the plugin.

You have to pass the IDs of your `use`d plugins to the `plugins` array props so Dashboard knows it needs to render them.

```js
import React, { useEffect } from 'react'
import Uppy from '@uppy/core'
import Webcam from '@uppy/webcam'
import { Dashboard } from '@uppy/react'

const uppy = new Uppy().use(Webcam)

function Component () {
  return <Dashboard uppy={uppy} plugins={['Webcam']} />
}
```

### Dynamic options

```js
import React, { useState, useEffect } from 'react'
import Uppy from '@uppy/core'
import { Dashboard } from '@uppy/react'

const uppy = new Uppy()

function Component ({ maxFileSize }) {
  useEffect(() => {
    // Change @uppy/core options
    uppy.setOptions({ restrictions: { maxFileSize } })

    // Or change some plugin dynamically
    uppy.getPlugin('SomePlugin').setOptions({ /* options */ })
  }, [maxFileSize])

  return <Dashboard uppy={uppy} />
}
```

## CSS

Make sure to also include the necessary CSS files for each Uppy React component you are using. Follow links for individual components docs below for details on that.

## Components

The following plugins are available as React component wrappers (you need to
install each package separately):

* [\<Dashboard />][<Dashboard />] - renders an inline [`@uppy/dashboard`][].
* [\<DashboardModal />][<DashboardModal />] - renders a [`@uppy/dashboard`][] modal.
* [\<DragDrop />][<DragDrop />] - renders a [`@uppy/drag-drop`][] area.
* [\<ProgressBar />][<ProgressBar />] - renders a [`@uppy/progress-bar`][].
* [\<StatusBar />][<StatusBar />] - renders a [`@uppy/status-bar`][].

[React]: https://facebook.github.io/react

[Preact]: https://preactjs.com/

[<Dashboard />]: /docs/react/dashboard

[<DragDrop />]: /docs/react/dragdrop

[<ProgressBar />]: /docs/react/progress-bar

[<StatusBar />]: /docs/react/status-bar

[<DashboardModal />]: /docs/react/dashboard-modal

[`@uppy/dashboard`]: /docs/dashboard

[`@uppy/drag-drop`]: /docs/drag-drop

[`@uppy/progress-bar`]: /docs/progress-bar

[`@uppy/status-bar`]: /docs/status-bar
