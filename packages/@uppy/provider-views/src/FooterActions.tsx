import { h } from 'preact'
import type { I18n } from '@uppy/utils/lib/Translator'

export default function FooterActions({
  cancel,
  done,
  i18n,
  selected,
}: {
  cancel: () => void
  done: () => void
  i18n: I18n
  selected: number
}): JSX.Element {
  return (
    <div className="uppy-ProviderBrowser-footer">
      <button
        className="uppy-u-reset uppy-c-btn uppy-c-btn-primary"
        onClick={done}
        type="button"
      >
        {i18n('selectX', {
          smart_count: selected,
        })}
      </button>
      <button
        className="uppy-u-reset uppy-c-btn uppy-c-btn-link"
        onClick={cancel}
        type="button"
      >
        {i18n('cancel')}
      </button>
    </div>
  )
}
