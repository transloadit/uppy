const { h } = require('preact')

module.exports = (props) => {
  return (
    <button type="button" onclick={props.triggerSearchInput} class="uppy-u-reset uppy-ProviderBrowser-userLogout">
      {props.i18n('backToSearch')}
    </button>
  )
}
