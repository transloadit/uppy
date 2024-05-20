import { h } from 'preact'
import type { I18n } from '@uppy/utils/lib/Translator'
import type ProviderView from './ProviderView'
import type { Meta, Body } from '@uppy/utils/lib/UppyFile'
import classNames from 'classnames'
import type { PartialTree } from '@uppy/core/lib/Uppy'
import getNOfSelectedFiles from './utils/PartialTreeUtils/getNOfSelectedFiles'
import { useMemo } from 'preact/hooks'

export default function FooterActions<M extends Meta, B extends Body>({
  cancelSelection,
  donePicking,
  i18n,
  partialTree,
  validateAggregateRestrictions
}: {
  cancelSelection: ProviderView<M, B>['cancelSelection']
  donePicking: ProviderView<M, B>['donePicking']
  i18n: I18n
  partialTree: PartialTree
  validateAggregateRestrictions: ProviderView<M, B>['validateAggregateRestrictions']
}) {
  const aggregateRestrictionError = useMemo(() => {
    return validateAggregateRestrictions(partialTree)
  }, [partialTree])

  const nOfSelectedFiles = useMemo(() => {
    return getNOfSelectedFiles(partialTree)
  }, [partialTree])

  if (nOfSelectedFiles === 0) {
    return null
  }

  return (
    <div className="uppy-ProviderBrowser-footer">
      <div className="uppy-ProviderBrowser-footer-buttons">
        <button
          className={classNames(
            'uppy-u-reset uppy-c-btn uppy-c-btn-primary',
            { 'uppy-c-btn--disabled': aggregateRestrictionError }
          )}
          disabled={!!aggregateRestrictionError}
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

      {
        aggregateRestrictionError &&
        <div className="uppy-ProviderBrowser-footer-error">
          {aggregateRestrictionError}
        </div>
      }
    </div>
  )
}
