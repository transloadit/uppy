import classNames from 'classnames'
import type { h } from 'preact'
import type { Body, Meta } from '../index.js'
import type { I18n } from '../utils/index.js'
import type ProviderView from './ProviderView/ProviderView.js'
import type { ProviderBulkAction } from './ProviderView/ProviderView.js'

/**
 * Manager-mode footer: instead of the picker's "Select N", the selection feeds
 * bulk actions (delete, move, …) supplied by the provider plugin.
 */
export default function BulkActions<M extends Meta, B extends Body>({
  selectedCount,
  bulkActions,
  runBulkAction,
  i18n,
}: {
  /** How many items the bulk actions get (see `ProviderView.getBulkActionItems`). */
  selectedCount: number
  bulkActions: ProviderBulkAction<M, B>[]
  runBulkAction: ProviderView<M, B>['runBulkAction']
  i18n: I18n
}): h.JSX.Element | null {
  if (selectedCount === 0) return null

  return (
    <div className="uppy-ProviderBrowser-footer">
      <div className="uppy-ProviderBrowser-footer-buttons">
        <span className="uppy-ProviderBrowser-footer-count">
          {i18n('itemsSelected', { smart_count: selectedCount })}
        </span>
        {bulkActions.map((action) => (
          <button
            key={action.id}
            type="button"
            className={classNames(
              'uppy-u-reset uppy-c-btn uppy-c-btn-primary',
              {
                'uppy-ProviderDialog-confirm--danger': action.danger,
              },
            )}
            onClick={() => runBulkAction(action)}
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  )
}
