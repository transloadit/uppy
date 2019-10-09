const { h } = require('preact')

module.exports = (props) => {
  return (
    <div class="uppy-ProviderBrowser-footer">
      <button class="uppy-u-reset uppy-c-btn uppy-c-btn-primary" onclick={props.done}>
        {props.i18n('selectX', {
          smart_count: props.selected
        })}
      </button>
      <button class="uppy-u-reset uppy-c-btn uppy-c-btn-link" onclick={props.cancel}>
        {props.i18n('cancel')}
      </button>
    </div>
  )
}
