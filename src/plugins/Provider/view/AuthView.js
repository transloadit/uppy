const LoaderView = require('./Loader')
const { h, Component } = require('preact')

class AuthView extends Component {
  componentDidMount () {
    this.props.checkAuth()
  }

  render () {
    const AuthBlock = () => {
      return <div class="uppy-Provider-auth">
        <div class="uppy-Provider-authIcon">{this.props.pluginIcon()}</div>
        <h1 class="uppy-Provider-authTitle">Please authenticate with <br /> <span class="uppy-Provider-authTitleName">{this.props.pluginName}</span> to select files</h1>
        <button type="button" class="uppy-u-reset uppy-c-buttonLarge uppy-c-buttonLarge--blue uppy-Provider-authBtn" onclick={this.props.handleAuth}>Connect to {this.props.pluginName}</button>
        {this.props.demo &&
          <button class="uppy-u-reset uppy-c-buttonLarge uppy-c-buttonLarge--blue uppy-Provider-authBtn" onclick={this.props.handleDemoAuth}>Proceed with Demo Account</button>
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
