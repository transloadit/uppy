/* eslint-disable */
import React from'react'
import Uppy from'@uppy/core'
import Tus from'@uppy/tus'
import GoogleDrive from '@uppy/google-drive'
import Webcam from '@uppy/webcam'
import RemoteSources from '@uppy/remote-sources' 
import { Dashboard, DashboardModal, DragDrop, ProgressBar, FileInput } from'@uppy/react'

import '@uppy/core/dist/style.css'
import '@uppy/dashboard/dist/style.css'
import '@uppy/drag-drop/dist/style.css'
import '@uppy/file-input/dist/style.css'
import '@uppy/progress-bar/dist/style.css'

export default class App extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      showInlineDashboard: false,
      open: false
    }

    this.uppy = new Uppy({ id: 'uppy1', autoProceed: true, debug: true })
      .use(Tus, { endpoint: 'https://tusd.tusdemo.net/files/' })
      .use(Webcam)
      .use(RemoteSources, { companionUrl: 'https://companion.uppy.io', sources: ['GoogleDrive', 'Box', 'Dropbox', 'Facebook', 'Instagram', 'OneDrive', 'Unsplash', 'Zoom', 'Url'],
      })

    this.uppy2 = new Uppy({ id: 'uppy2', autoProceed: false, debug: true })
      .use(Tus, { endpoint: 'https://tusd.tusdemo.net/files/' })

    this.handleModalClick = this.handleModalClick.bind(this)
  }

  componentWillUnmount () {
    this.uppy.close({ reason: 'unmount' })
    this.uppy2.close({ reason: 'unmount' })
  }

  handleModalClick () {
    this.setState({
      open: !this.state.open
    })
  }

  render () {
    const { showInlineDashboard } = this.state
    return (
      <div>
        <h1>React Examples</h1>

        <h2>Inline Dashboard</h2>
        <label>
          <input
            type="checkbox"
            checked={showInlineDashboard}
            onChange={(event) => {
              this.setState({
                showInlineDashboard: event.target.checked
              })
            }}
          />
          Show Dashboard
        </label>
        {showInlineDashboard && (
          <Dashboard
            uppy={this.uppy}
            plugins={['GoogleDrive']}
            metaFields={[
              { id: 'name', name: 'Name', placeholder: 'File name' }
            ]}
          />
        )}

        <h2>Modal Dashboard</h2>
        <div>
          <button onClick={this.handleModalClick}>
            {this.state.open ? 'Close dashboard' : 'Open dashboard'}
          </button>
          <DashboardModal
            uppy={this.uppy2}
            open={this.state.open}
            target={document.body}
            onRequestClose={() => this.setState({ open: false })}
          />
        </div>

        <h2>Drag Drop Area</h2>
        <DragDrop
          uppy={this.uppy}
          locale={{
            strings: {
              chooseFile: 'Boop a file',
              orDragDrop: 'or yoink it here'
            }
          }}
        />

        <h2>Progress Bar</h2>
        <ProgressBar
          uppy={this.uppy}
          hideAfterFinish={false}
        />

        <h2>File Input</h2>
        <FileInput
          uppy={this.uppy}
        />
      </div>
    )
  }
}
