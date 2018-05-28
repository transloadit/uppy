const LoaderView = require('./Loader')
const { h, Component } = require('preact')

class AuthBlock extends Component {
  componentDidMount () {
    this.connectButton.focus()
  }

  render () {
    return <div class="uppy-Provider-auth">
      <div class="uppy-Provider-authIcon">{this.props.pluginIcon()}</div>
      <h1 class="uppy-Provider-authTitle">Please authenticate with <span class="uppy-Provider-authTitleName">{this.props.pluginName}</span><br /> to select files</h1>
      <button
        type="button"
        class="uppy-u-reset uppy-c-btn uppy-c-btn-primary uppy-Provider-authBtn"
        onclick={this.props.handleAuth}
        ref={(el) => { this.connectButton = el }}
      >
        Connect to {this.props.pluginName}
      </button>
      {this.props.demo &&
        <button class="uppy-u-reset uppy-c-btn uppy-c-btn-primary uppy-Provider-authBtn" onclick={this.props.handleDemoAuth}>Proceed with Demo Account</button>
      }
    </div>
  }
}

class AuthView extends Component {
  componentDidMount () {
    this.props.checkAuth()
  }

  render () {
    return (
      <div style={{ height: '100%' }}>
        {this.props.checkAuthInProgress
          ? <LoaderView />
          : <AuthBlock {...this.props} />
        }
      </div>
    )
  }
}

module.exports = AuthView
