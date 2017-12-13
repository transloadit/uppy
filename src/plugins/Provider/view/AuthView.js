const LoaderView = require('./Loader')

const { h, Component } = require('preact')
const hyperx = require('hyperx')
const html = hyperx(h)

class AuthView extends Component {
  componentDidMount () {
    this.props.checkAuth()
  }

  render () {
    const demoLink = this.props.demo ? html`<button class="UppyProvider-authBtnDemo" onclick=${this.props.handleDemoAuth}>Proceed with Demo Account</button>` : null
    const AuthBlock = () => html`
      <div class="UppyProvider-auth">
        <h1 class="UppyProvider-authTitle">Please authenticate with <span class="UppyProvider-authTitleName">${this.props.pluginName}</span><br> to select files</h1>
        <button type="button" class="UppyProvider-authBtn" onclick=${this.props.handleAuth}>Connect to ${this.props.pluginName}</button>
        ${demoLink}
      </div>
    `

    return html`
      <div style="height: 100%;">
        ${this.props.checkAuthInProgress
          ? LoaderView()
          : AuthBlock()
        }
      </div>
    `
  }
}

module.exports = AuthView
