const { h, Fragment } = require('preact')

module.exports = (props) => {
  const { searchTerm, triggerSearchInput, i18n } = props
  return (
    <Fragment>
      <button type="button" onClick={triggerSearchInput} className="uppy-u-reset uppy-ProviderBrowser-userLogout">
        {i18n('backToSearch')}
      </button>
      <div className="uppy-ProviderBrowser-headerSearchTerm">
        “{searchTerm}”
      </div>
    </Fragment>
  )
}
