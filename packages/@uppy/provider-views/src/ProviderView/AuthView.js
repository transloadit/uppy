const { h, Component } = require('preact')

class AuthView extends Component {
  render () {
    const pluginNameComponent = (
      <span className="uppy-Provider-authTitleName">
        {this.props.pluginName}
        <br />
      </span>
    )
    return (
      <div className="uppy-Provider-auth">
        <div className="uppy-Provider-authIcon">{this.props.pluginIcon()}</div>
        <div className="uppy-Provider-authTitle">
          {this.props.i18nArray('authenticateWithTitle', { pluginName: pluginNameComponent })}
        </div>
        <button
          type="button"
          className="uppy-u-reset uppy-c-btn uppy-c-btn-primary uppy-Provider-authBtn"
          onClick={this.props.handleAuth}
          data-uppy-super-focusable
        >
          {this.props.i18nArray('authenticateWith', { pluginName: this.props.pluginName })}
        </button>
      </div>
    )
  }
}

module.exports = AuthView
