import { h } from 'preact'

export default ({ cancel, done, i18n, selected }) => {
  return (
    <div className="uppy-ProviderBrowser-footer">
      <button className="uppy-u-reset uppy-c-btn uppy-c-btn-primary" onClick={done} type="button">
        {i18n('selectX', {
          smart_count: selected,
        })}
      </button>
      <button className="uppy-u-reset uppy-c-btn uppy-c-btn-link" onClick={cancel} type="button">
        {i18n('cancel')}
      </button>
    </div>
  )
}
