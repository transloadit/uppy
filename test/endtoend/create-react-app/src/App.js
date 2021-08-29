import React, { Component } from 'react'
// These are resolved from the root instead of from the local package.json in
// the create-react-app e2e test code.
/* eslint-disable import/no-extraneous-dependencies */
import Uppy from '@uppy/core'
import Tus from '@uppy/tus'
import GoogleDrive from '@uppy/google-drive'
import { Dashboard, DashboardModal } from '@uppy/react'
import '@uppy/core/dist/style.css'
import '@uppy/dashboard/dist/style.css'
/* eslint-enable import/no-extraneous-dependencies */

const isOnTravis = process.env.REACT_APP_ON_TRAVIS
const endpoint = isOnTravis ? 'http://companion.test:1080' : 'http://localhost:1080'

class App extends Component {
  constructor (props) {
    super(props)

    this.uppy = new Uppy({ id: 'uppy1', autoProceed: true, debug: true })
      .use(Tus, { endpoint: `${endpoint}/files/` })
      .use(GoogleDrive, { companionUrl: 'https://companion.uppy.io' })

    this.uppy2 = new Uppy({ id: 'uppy2', autoProceed: false, debug: true })
      .use(Tus, { endpoint: `${endpoint}/files/` })

    this.state = {
      showInlineDashboard: true,
      open: false,
    }

    this.handleModalClick = this.handleModalClick.bind(this)
  }

  componentWillUnmount () {
    this.uppy.close()
    this.uppy2.close()
  }

  handleModalClick () {
    this.setState(({ open }) => ({
      open: !open,
    }))
  }

  render () {
    const { showInlineDashboard } = this.state
    return (
      <div>
        <h1>React Examples</h1>

        <h2>Inline Dashboard</h2>
        <div id="inline-dashboard">
          <label htmlFor="inline-dashboard-toggle">
            <input
              id="inline-dashboard-toggle"
              type="checkbox"
              checked={showInlineDashboard}
              onChange={(event) => {
                this.setState({
                  showInlineDashboard: event.target.checked,
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
                { id: 'name', name: 'Name', placeholder: 'File name' },
              ]}
            />
          )}
        </div>

        <h2>Modal Dashboard</h2>
        <div id="modal-dashboard">
          <button onClick={this.handleModalClick} id="modal-dashboard-toggle" type="button">
            {this.state.open ? 'Close dashboard' : 'Open dashboard'}
          </button>
          <DashboardModal
            uppy={this.uppy2}
            open={this.state.open}
            target="#modal-dashboard"
            onRequestClose={() => this.setState({ open: false })}
          />
        </div>
      </div>
    )
  }
}

export default App
