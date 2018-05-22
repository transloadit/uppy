---
title: "&lt;DashboardModal />"
type: docs
permalink: docs/react/dashboard-modal/
order: 55
---

The `<DashboardModal />` component wraps the [Dashboard][] plugin, allowing control over the modal `open` state using a prop.

```js
import DashboardModal from 'uppy/lib/react/DashboardModal';
```

<!-- Make sure the old name of this section still works -->
<a id="Options"></a>
## Props

On top of all the [Dashboard][] options, the `<DashboardModal />` plugin adds two additional props:

 - `open` - Boolean true or false, setting this to `true` opens the modal and setting it to `false` closes it.
 - `onRequestClose` - Callback called when the user attempts to close the modal, either by clicking the close button or by clicking outside the modal (if the `closeModalOnClickOutside` prop is set).

To use other plugins like [Webcam][] with the `<DashboardModal />` component, add them to the Uppy instance and then specify their `id` in the [`plugins`](/docs/dashboard/#plugins) prop:

```js
// Do this wherever you initialize Uppy, eg. in a React component's constructor method.
// Do NOT do it in `render()` or any other method that is called more than once!
uppy.use(Webcam) // `id` defaults to "Webcam"
uppy.use(Webcam, { id: 'MyWebcam' }) // `id` is… "MyWebcam"
```

Then do `plugins={['Webcam']}`.

A full example that uses a button to open the modal is shown below:

```js
class MusicUploadButton extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      modalOpen: false
    }

    this.handleOpen = this.handleOpen.bind(this)
    this.handleClose = this.handleClose.bind(this)
  }

  handleOpen () {
    this.setState({
      modalOpen: true
    })
  }

  handleClose () {
    this.setState({
      modalOpen: false
    })
  }

  render () {
    return (
      <div>
        <button onClick={this.handleOpen}>Upload some music</button>
        <DashboardModal
          uppy={this.props.uppy}
          closeModalOnClickOutside
          open={this.state.modalOpen}
          onRequestClose={this.handleClose}
          plugins={['Webcam']}
        />
      </div>
    );
  }
}
```

[Dashboard]: /docs/dashboard/
[Webcam]: /docs/webcam/
