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

## CSS

Make sure to also include the necessary CSS files for each Uppy React component you are using. Follow links for individual components docs below for details on that.

## Usage

The components can be used with either [React][] or API-compatible alternatives such as [Preact][].

Instead of adding a UI plugin to an Uppy instance with `.use()`, the Uppy instance can be passed into components as an `uppy` prop.
All other props are passed as options to the plugin.

```js
import React from 'react'
import Uppy from '@uppy/core'
import Tus from '@uppy/tus'
import { DragDrop } from '@uppy/react'

const uppy = new Uppy({
  meta: { type: 'avatar' },
  restrictions: { maxNumberOfFiles: 1 },
  autoProceed: true,
})

uppy.use(Tus, { endpoint: '/upload' })

uppy.on('complete', (result) => {
  const url = result.successful[0].uploadURL
  store.dispatch({
    type: 'SET_USER_AVATAR_URL',
    payload: { url },
  })
})

const AvatarPicker = ({ currentAvatar }) => {
  return (
    <div>
      <img src={currentAvatar} alt="Current Avatar" />
      <DragDrop
        uppy={uppy}
        locale={{
          strings: {
            // Text to show on the droppable area.
            // `%{browse}` is replaced with a link that opens the system file selection dialog.
            dropHereOr: 'Drop here or %{browse}',
            // Used as the label for the link that opens the system file selection dialog.
            browse: 'browse',
          },
        }}
      />
    </div>
  )
}
```

The following plugins are available as React component wrappers:

*   [\<Dashboard />][<Dashboard />] - renders an inline \[`@uppy/dashboard`]\[@uppy/dashboard]
*   [\<DashboardModal />][<DashboardModal />] - renders a \[`@uppy/dashboard`]\[@uppy/dashboard] modal
*   [\<DragDrop />][<DragDrop />] - renders a \[`@uppy/drag-drop`]\[@uppy/drag-drop] area
*   [\<ProgressBar />][<ProgressBar />] - renders a \[`@uppy/progress-bar`]\[@uppy/progress-bar]
*   [\<StatusBar />][<StatusBar />] - renders a \[`@uppy/status-bar`]\[@uppy/status-bar]

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
