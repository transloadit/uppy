import { prettierBytes } from '@transloadit/prettier-bytes'
import classNames from 'classnames'
import type { h } from 'preact'
import { useEffect, useId, useState } from 'preact/hooks'
import type {
  Body,
  Meta,
  PartialTreeFile,
  PartialTreeFolderNode,
} from '../index.js'
import type { I18n } from '../utils/index.js'
import { getApplicableActions } from './Item/components/ItemActionsMenu.js'
import ItemIcon from './Item/components/ItemIcon.js'
import ModalDialog from './ModalDialog.js'
import type ProviderView from './ProviderView/ProviderView.js'
import type { Opts, ProviderAction } from './ProviderView/ProviderView.js'

type ItemDetailDialogProps<M extends Meta, B extends Body> = {
  item: PartialTreeFile | PartialTreeFolderNode
  actions: ProviderAction<M, B>[]
  runAction: ProviderView<M, B>['runAction']
  /** Resolves a preview image URL for a file (e.g. a signed thumbnail URL). */
  getPreviewUrl?: Opts<M, B>['getPreviewUrl']
  onClose: () => void
  i18n: I18n
}

/**
 * The detail view of one item in manager mode: a {@link ModalDialog} with a
 * preview, the item's metadata, and the same actions the "…" menu offers (they
 * are the one shared list).
 */
export default function ItemDetailDialog<M extends Meta, B extends Body>({
  item,
  actions,
  runAction,
  getPreviewUrl,
  onClose,
  i18n,
}: ItemDetailDialogProps<M, B>): h.JSX.Element {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const titleId = useId()
  // The item as the dialog opened: a listing update replaces the `item` object
  // but not the preview (another item gets a new dialog; see its `key`).
  const [previewItem] = useState(item)

  useEffect(() => {
    if (!getPreviewUrl || previewItem.data.isFolder) return
    let cancelled = false
    // Inside `then`: a JavaScript integrator may throw synchronously or return
    // any thenable.
    Promise.resolve()
      .then(() => getPreviewUrl(previewItem))
      .then((url) => {
        if (!cancelled) setPreviewUrl(url)
      })
      .catch(() => {
        /* previews are a nicety: fall back to the icon */
      })
    return () => {
      cancelled = true
    }
  }, [getPreviewUrl, previewItem])

  const name = item.data.name ?? i18n('unnamed')
  const applicable = getApplicableActions(actions, item)
  // Only files carry these; Companion answers `null` for what it does not know.
  const file = item.type === 'file' ? item.data : undefined
  const size = file?.size
  const mimeType = file?.mimeType
  const modified = file?.modifiedDate

  return (
    <ModalDialog
      className="uppy-ProviderDialog uppy-ItemDetail"
      aria-labelledby={titleId}
      onDismiss={onClose}
      restoreFocus={(dialog) => {
        // The item's (re-rendered) row, or at least its list.
        const browser = dialog.closest('.uppy-ProviderBrowser')
        return (
          browser?.querySelector<HTMLElement>(
            `[data-uppy-item-id="${CSS.escape(item.id)}"]`,
          ) ?? browser?.querySelector<HTMLElement>('.uppy-ProviderBrowser-list')
        )
      }}
    >
      <header className="uppy-ItemDetail-header">
        <h3 id={titleId} className="uppy-ItemDetail-name">
          {name}
        </h3>
        <button
          type="button"
          className="uppy-u-reset uppy-c-btn uppy-ItemDetail-close"
          aria-label={i18n('close')}
          onClick={onClose}
        >
          <svg
            aria-hidden="true"
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
          >
            <path
              d="M2 2l10 10M12 2L2 12"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linecap="round"
            />
          </svg>
        </button>
      </header>
      <div className="uppy-ItemDetail-body">
        <div
          className="uppy-ItemDetail-preview"
          data-testid="file-detail-preview"
        >
          {previewUrl ? (
            <img
              src={previewUrl}
              alt=""
              className="uppy-ItemDetail-previewImage"
            />
          ) : (
            <span className="uppy-ItemDetail-previewIcon" aria-hidden="true">
              <ItemIcon itemIconString={item.data.icon} />
            </span>
          )}
        </div>
        <dl className="uppy-ItemDetail-facts">
          {typeof size === 'number' ? (
            <>
              <dt>{i18n('detailSize')}</dt>
              <dd>{prettierBytes(size)}</dd>
            </>
          ) : null}
          {mimeType ? (
            <>
              <dt>{i18n('detailType')}</dt>
              <dd>{mimeType}</dd>
            </>
          ) : null}
          {modified ? (
            <>
              <dt>{i18n('detailModified')}</dt>
              <dd>{modified}</dd>
            </>
          ) : null}
        </dl>
      </div>
      <footer className="uppy-ItemDetail-actions">
        {applicable.map((action) => (
          <button
            key={action.id}
            type="button"
            className={classNames(
              'uppy-u-reset uppy-c-btn uppy-ItemDetail-action',
              action.danger && 'uppy-ItemDetail-action--danger',
            )}
            onClick={() => {
              onClose()
              runAction(action, item)
            }}
          >
            {action.label}
          </button>
        ))}
      </footer>
    </ModalDialog>
  )
}
