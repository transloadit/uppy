---
title: "Introduction"
type: docs
permalink: docs/react/
order: 60
---

Uppy provides [React][] components for the included UI plugins.

## Usage

The components can be used with [React][] or API-compatible alternatives such as [Preact][].

Instead of adding a UI plugin to an Uppy instance with `.use()`, the Uppy instance can be passed into components as an `uppy` prop.
All other props are passed as options to the plugin.

```js
const Uppy = require('uppy/lib/core')
const Tus = require('uppy/lib/plugins/Tus')
const DragDrop = require('uppy/lib/react/DragDrop')

const uppy = Uppy({
  meta: { type: 'avatar' },
  restrictions: { maxNumberOfFiles: 1 },
  autoProceed: true
})

uppy.use(Tus, { endpoint: '/upload' })

uppy.on('complete', (result) => {
  const url = result.successful[0].uploadURL
  store.dispatch({
    type: SET_USER_AVATAR_URL,
    payload: { url: url }
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
            chooseFile: 'Pick a new avatar'
          }
        }}
      />
    </div>
  )
}
```

The plugins that are available as React component wrappers are:

 - [&lt;Dashboard />][] - renders an inline [Dashboard][]
 - [&lt;DashboardModal />][] - renders a [Dashboard][] modal
 - [&lt;DragDrop />][] - renders a [DragDrop][] area
 - [&lt;ProgressBar />][] - renders a [ProgressBar][]
 - [&lt;StatusBar />][] - renders a [StatusBar][]

[React]: https://facebook.github.io/react
[Preact]: https://preactjs.com/
[&lt;Dashboard />]: /docs/react/dashboard
[&lt;DragDrop />]: /docs/react/dragdrop
[&lt;ProgressBar />]: /docs/react/progressbar
[&lt;StatusBar />]: /docs/react/statusbar
[&lt;DashboardModal />]: /docs/react/dashboard-modal
[Dashboard]: /docs/dashboard
[DragDrop]: /docs/dragdrop
[ProgressBar]: /docs/progressbar
[StatusBar]: /docs/statusbar
