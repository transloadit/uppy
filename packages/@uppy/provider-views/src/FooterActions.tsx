import { h } from 'preact'
import type { I18n } from '@uppy/utils/lib/Translator'
import type ProviderView from './ProviderView'
import type { Meta, Body } from '@uppy/utils/lib/UppyFile'

export default function FooterActions<M extends Meta, B extends Body>({
  cancelSelection,
  donePicking,
  i18n,
  nOfSelectedFiles,
}: {
  cancelSelection: ProviderView<M, B>['cancelSelection']
  donePicking: ProviderView<M, B>['donePicking']
  i18n: I18n
  nOfSelectedFiles: number
}): JSX.Element {
  return (
    <div className="uppy-ProviderBrowser-footer">
      <button
        className="uppy-u-reset uppy-c-btn uppy-c-btn-primary"
        onClick={donePicking}
        type="button"
      >
        {i18n('selectX', {
          smart_count: nOfSelectedFiles,
        })}
      </button>
      <button
        className="uppy-u-reset uppy-c-btn uppy-c-btn-link"
        onClick={cancelSelection}
        type="button"
      >
        {i18n('cancel')}
      </button>
    </div>
  )
}
