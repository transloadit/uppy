import type { Body, Meta, PartialTree } from '@uppy/core'
import type { I18n } from '@uppy/utils/lib/Translator'
import classNames from 'classnames'
import { h } from 'preact'
import { useMemo } from 'preact/hooks'
import type ProviderView from './ProviderView/ProviderView.js'
import getNumberOfSelectedFiles from './utils/PartialTreeUtils/getNumberOfSelectedFiles.js'

export default function FooterActions<M extends Meta, B extends Body>({
  cancelSelection,
  donePicking,
  i18n,
  partialTree,
  validateAggregateRestrictions,
}: {
  cancelSelection: ProviderView<M, B>['cancelSelection']
  donePicking: ProviderView<M, B>['donePicking']
  i18n: I18n
  partialTree: PartialTree
  validateAggregateRestrictions: ProviderView<
    M,
    B
  >['validateAggregateRestrictions']
}) {
  const aggregateRestrictionError = useMemo(() => {
    return validateAggregateRestrictions(partialTree)
  }, [partialTree, validateAggregateRestrictions])

  const nOfSelectedFiles = useMemo(() => {
    return getNumberOfSelectedFiles(partialTree)
  }, [partialTree])

  if (nOfSelectedFiles === 0) {
    return null
  }

  return (
    <div className="uppy-ProviderBrowser-footer">
      <div className="uppy-ProviderBrowser-footer-buttons">
        <button
          className={classNames('uppy-u-reset uppy-c-btn uppy-c-btn-primary', {
            'uppy-c-btn--disabled': aggregateRestrictionError,
          })}
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

      {aggregateRestrictionError && (
        <div className="uppy-ProviderBrowser-footer-error">
          {aggregateRestrictionError}
        </div>
      )}
    </div>
  )
}
