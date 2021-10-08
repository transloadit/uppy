const { h } = require('preact')

module.exports = (props) => {
  return (
    <div className="uppy-ProviderBrowser-footer">
      <button className="uppy-u-reset uppy-c-btn uppy-c-btn-primary" onClick={props.done} type="button">
        {props.i18n('selectX', {
          smart_count: props.selected,
        })}
      </button>
      <button className="uppy-u-reset uppy-c-btn uppy-c-btn-link" onClick={props.cancel} type="button">
        {props.i18n('cancel')}
      </button>
    </div>
  )
}
