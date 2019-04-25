const { h, Component } = require('preact')

class AuthBlock extends Component {
  componentDidMount () {
    setTimeout(() => {
      if (!this.connectButton) return
      this.connectButton.focus({ preventScroll: true })
    }, 150)
  }

  render () {
    const pluginNameComponent = (
      <span class="uppy-Provider-authTitleName">{this.props.pluginName}<br /></span>
    )
    return <div class="uppy-Provider-auth">
      <div class="uppy-Provider-authIcon">{this.props.pluginIcon()}</div>
      <div class="uppy-Provider-authTitle">
        {this.props.i18nArray('authenticateWithTitle', { pluginName: pluginNameComponent })}
      </div>
      <button
        type="button"
        class="uppy-u-reset uppy-c-btn uppy-c-btn-primary uppy-Provider-authBtn"
        onclick={this.props.handleAuth}
        ref={(el) => { this.connectButton = el }}
      >
        {this.props.i18nArray('authenticateWith', { pluginName: this.props.pluginName })}
      </button>
    </div>
  }
}

class AuthView extends Component {
  render () {
    return <AuthBlock {...this.props} />
  }
}

module.exports = AuthView
