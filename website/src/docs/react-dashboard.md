---
title: "DashboardModal"
type: docs
permalink: docs/react/dashboard-modal/
order: 51
---

The `<DashboardModal />` component wraps the [Dashboard][] plugin, allowing control over the modal `open` state using a prop.

## Options

On top of all the [Dashboard][] options, the `<DashboardModal />` plugin adds two additional props:

 - `open` - Boolean true or false, setting this to `true` opens the modal and setting it to `false` closes it.
 - `onRequestClose` - Callback called when the user attempts to close the modal, either by clicking the close button or by clicking outside the modal (if the `closeModalOnClickOutside` prop is set).

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
        />
      </div>
    );
  }
}
```

[Dashboard]: /docs/dashboard/
