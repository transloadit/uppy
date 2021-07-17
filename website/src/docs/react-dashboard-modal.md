---
title: "&lt;DashboardModal />"
type: docs
module: "@uppy/react"
permalink: docs/react/dashboard-modal/
order: 6
category: "React"
---

The `<DashboardModal />` component wraps the \[`@uppy/dashboard`]\[@uppy/dashboard] plugin, allowing control over the modal `open` state using a prop.

## Installation

Install from NPM:

```shell
npm install @uppy/react
```

```js
import { DashboardModal } from '@uppy/react'

// Alternatively, you can also use a default import:
// import DashboardModal from '@uppy/react/lib/DashboardModal'
```

## CSS

The `DashboardModal` component requires the following CSS for styling:

```js
import '@uppy/core/dist/style.css'
import '@uppy/dashboard/dist/style.css'
```

Import general Core styles from `@uppy/core/dist/style.css` first, then add the Dashboard styles from `@uppy/dashboard/dist/style.css`. A minified version is also available as `style.min.css` at the same path. The way to do import depends on your build system.

⚠️ The `@uppy/dashboard` plugin includes CSS for the Dashboard itself, and the various plugins used by the Dashboard, such as ([`@uppy/status-bar`](/docs/status-bar) and [`@uppy/informer`](/docs/informer)). If you also use the `@uppy/status-bar` or `@uppy/informer` plugin directly, you should not include their CSS files, but instead only use the one from the `@uppy/dashboard` plugin.

Styles for Provider plugins, like Google Drive and Instagram, are also bundled with Dashboard styles. Styles for other plugins, such as `@uppy/url` and `@uppy/webcam`, are not included. If you are using those, please see their docs and make sure to include styles for them as well.

<!-- Make sure the old name of this section still works -->

<a id="Options"></a>

## Props

The `<DashboardModal />` component supports most \[`@uppy/dashboard`]\[@uppy/dashboard] options as props. It adds two more:

*   `open` - Boolean true or false, setting this to `true` opens the modal and setting it to `false` closes it.
*   `onRequestClose` - Callback called when the user attempts to close the modal, either by clicking the close button or by clicking outside the modal (if the `closeModalOnClickOutside` prop is set).

An Uppy instance must be provided in the `uppy={}` prop: see [Initializing Uppy](/docs/react/initializing) for details.

The `target={}` prop can be used to mount the Dashboard modal elsewhere in the DOM. If not given, the modal will be mounted at where the component is used. Unlike the raw \[`@uppy/dashboard`]\[@uppy/dashboard] plugin, the `<DashboardModal />` component can *only* take DOM element objects, not CSS selectors.

To use other plugins like \[`@uppy/webcam`]\[@uppy/webcam] with the `<DashboardModal />` component, add them to the Uppy instance and then specify their `id` in the [`plugins`](/docs/dashboard/#plugins) prop:

```js
// Do this wherever you initialize Uppy, e.g., in a React component's constructor method.
// Do NOT do it in `render()` or any other method that is called more than once!
uppy.use(Webcam) // `id` defaults to "Webcam"
uppy.use(Webcam, { id: 'MyWebcam' }) // `id` is… "MyWebcam"
```

Then do `plugins={['Webcam']}`.

Here is a full example that uses a button to open the modal:

```js
import React from 'react'
import { DashboardModal } from '@uppy/react'

class MusicUploadButton extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      modalOpen: false,
    }

    this.uppy = new Uppy()
      .use(XHRUpload, { endpoint: '/api/songs/upload' })
      .use(Webcam, { modes: ['audio-only'] })

    this.handleOpen = this.handleOpen.bind(this)
    this.handleClose = this.handleClose.bind(this)
  }

  componentWillUnmount () {
    this.uppy.close()
  }

  handleOpen () {
    this.setState({
      modalOpen: true,
    })
  }

  handleClose () {
    this.setState({
      modalOpen: false,
    })
  }

  render () {
    return (
      <div>
        <button type="button" onClick={this.handleOpen}>Upload some music</button>
        <DashboardModal
          uppy={this.uppy}
          closeModalOnClickOutside
          open={this.state.modalOpen}
          onRequestClose={this.handleClose}
          plugins={['Webcam']}
        />
      </div>
    )
  }
}
```

[`@uppy/dashboard`]: /docs/dashboard/

[`@uppy/webcam`]: /docs/webcam/
