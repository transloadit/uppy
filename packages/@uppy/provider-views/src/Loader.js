const { h } = require('preact')

module.exports = (props) => {
  return (
    <div className="uppy-Provider-loading">
      <span>{props.i18n('loading')}</span>
    </div>
  )
}
