/* eslint-disable */
const React = require('react')
const Uppy = require('uppy/lib/core')
const Tus10 = require('uppy/lib/plugins/Tus10')
const { Dashboard, DashboardModal, DragDrop, ProgressBar } = require('uppy/lib/uppy-react')

module.exports = class App extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      showInlineDashboard: false,
      open: false
    }

    this.handleModalClick = this.handleModalClick.bind(this)
  }

  componentWillMount () {
    this.uppy = new Uppy({ autoProceed: false })
      .use(Tus10, { endpoint: 'https://master.tus.io/files' })
      .run()

    this.uppy2 = new Uppy({ autoProceed: false })
      .use(Tus10, { endpoint: 'https://master.tus.io/files' })
      .run()
  }

  componentWillUnmount () {
    this.uppy.close()
    this.uppy2.close()
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
          <Dashboard uppy={this.uppy} />
        )}

        <h2>Modal Dashboard</h2>
        <div>
          <button onClick={this.handleModalClick}>
            {this.state.open ? 'Close dashboard' : 'Open dashboard'}
          </button>
          <DashboardModal
            uppy={this.uppy2}
            open={this.state.open}
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
        <ProgressBar uppy={this.uppy} />
      </div>
    )
  }
}
