import { h } from 'preact'

function LoadingProgress (props) {
  const { i18n, loadedItemsProgress } = props

  return (
    <div className="uppy-ProviderBrowser-footer uppy-ProviderBrowser-footer--centered">
      <div data-uppy-super-focusable>
        <svg
          className="uppy-ProviderBrowser-spinner"
          aria-hidden="true"
          focusable="false"
          width="14"
          height="14"
        >
          <path
            d="M13.983 6.547c-.12-2.509-1.64-4.893-3.939-5.936-2.48-1.127-5.488-.656-7.556 1.094C.524 3.367-.398 6.048.162 8.562c.556 2.495 2.46 4.52 4.94 5.183 2.932.784 5.61-.602 7.256-3.015-1.493 1.993-3.745 3.309-6.298 2.868-2.514-.434-4.578-2.349-5.153-4.84a6.226 6.226 0 0 1 2.98-6.778C6.34.586 9.74 1.1 11.373 3.493c.407.596.693 1.282.842 1.988.127.598.073 1.197.161 1.794.078.525.543 1.257 1.15.864.525-.341.49-1.05.456-1.592-.007-.15.02.3 0 0"
            fillRule="evenodd"
          />
        </svg>
        {i18n('loadingX', { numFiles:  loadedItemsProgress })}
      </div>
    </div>
  )
}

function LoadAllButton (props) {
  const { i18n, loadAllPages } = props
  return (
    <div className="uppy-ProviderBrowser-footer uppy-ProviderBrowser-footer--centered">
      <button
        className="uppy-u-reset uppy-c-btn uppy-c-btn-link"
        type="button"
        onClick={loadAllPages}
      >
        {i18n('loadAllFilesFolders')}
      </button>
    </div>
  )
}

export default (props) => {
  const { cancel, done, i18n, selected, loadedItemsProgress, viewType } = props
  const shouldShowLoadAll = viewType === 'list'

  if (selected === 0 && loadedItemsProgress && shouldShowLoadAll) {
    return LoadingProgress(props)
  }

  if (selected === 0 && shouldShowLoadAll) {
    return LoadAllButton(props)
  }

  if (selected > 0) {
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

  return null
}
