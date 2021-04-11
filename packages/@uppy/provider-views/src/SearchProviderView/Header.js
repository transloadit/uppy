const { h } = require('preact')

module.exports = (props) => {
  return (
    <button type="button" onClick={props.triggerSearchInput} className="uppy-u-reset uppy-ProviderBrowser-userLogout">
      {props.i18n('backToSearch')}
    </button>
  )
}
