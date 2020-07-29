const { h, Component } = require('preact')

class AuthView extends Component {
  render () {
    const pluginNameComponent = (
      <span class="uppy-Provider-authTitleName">{this.props.pluginName}<br /></span>
    )
    return (
      <div class="uppy-Provider-auth">
        <div class="uppy-Provider-authIcon">{this.props.pluginIcon()}</div>
        <div class="uppy-Provider-authTitle">
          {this.props.i18nArray('authenticateWithTitle', { pluginName: pluginNameComponent })}
        </div>
        <button
          type="button"
          class="uppy-u-reset uppy-c-btn uppy-c-btn-primary uppy-Provider-authBtn"
          onclick={this.props.handleAuth}
          data-uppy-super-focusable
        >
          {this.props.i18nArray('authenticateWith', { pluginName: this.props.pluginName })}
        </button>
      </div>
    )
  }
}

module.exports = AuthView
