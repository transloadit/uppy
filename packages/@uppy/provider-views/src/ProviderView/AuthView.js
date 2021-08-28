const { h } = require('preact')

function AuthView (props) {
  const pluginNameComponent = (
    <span className="uppy-Provider-authTitleName">
      {props.pluginName}
      <br />
    </span>
  )
  return (
    <div className="uppy-Provider-auth">
      <div className="uppy-Provider-authIcon">{props.pluginIcon()}</div>
      <div className="uppy-Provider-authTitle">
        {props.i18nArray('authenticateWithTitle', { pluginName: pluginNameComponent })}
      </div>
      <button
        type="button"
        className="uppy-u-reset uppy-c-btn uppy-c-btn-primary uppy-Provider-authBtn"
        onClick={props.handleAuth}
        data-uppy-super-focusable
      >
        {props.i18nArray('authenticateWith', { pluginName: props.pluginName })}
      </button>
    </div>
  )
}

module.exports = AuthView
