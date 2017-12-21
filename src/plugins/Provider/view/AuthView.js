const LoaderView = require('./Loader')
const { h, Component } = require('preact')

class AuthView extends Component {
  componentDidMount () {
    this.props.checkAuth()
  }

  render () {
    const AuthBlock = () => {
      return <div class="uppy-Provider-auth">
        <h1 class="uppy-Provider-authTitle">Please authenticate with <span class="uppy-Provider-authTitleName">{this.props.pluginName}</span><br /> to select files</h1>
        <button type="button" class="uppy-Provider-authBtn" onclick={this.props.handleAuth}>Connect to {this.props.pluginName}</button>
        {this.props.demo &&
          <button class="uppy-Provider-authBtnDemo" onclick={this.props.handleDemoAuth}>Proceed with Demo Account</button>
        }
      </div>
    }

    return (
      <div style="height: 100%;">
        {this.props.checkAuthInProgress
          ? LoaderView()
          : AuthBlock()
        }
      </div>
    )
  }
}

module.exports = AuthView
