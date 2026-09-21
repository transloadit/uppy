import { prettierBytes } from '@transloadit/prettier-bytes'
import type { h } from 'preact'
import { useEffect, useRef, useState } from 'preact/hooks'
import type {
  Body,
  Meta,
  PartialTreeFile,
  PartialTreeFolderNode,
} from '../index.js'
import type { I18n } from '../utils/index.js'
import { getApplicableActions } from './Item/components/ItemActionsMenu.js'
import ItemIcon from './Item/components/ItemIcon.js'
import type { ProviderAction } from './ProviderView/ProviderView.js'

type ItemDetailDialogProps<M extends Meta, B extends Body> = {
  item: PartialTreeFile | PartialTreeFolderNode
  actions: ProviderAction<M, B>[]
  runAction: (
    action: ProviderAction<M, B>,
    item: PartialTreeFile | PartialTreeFolderNode,
  ) => void
  /** Resolves a preview image URL for a file (e.g. a signed thumbnail URL). */
  getPreviewUrl?: (
    item: PartialTreeFile | PartialTreeFolderNode,
  ) => Promise<string>
  onClose: () => void
  i18n: I18n
}

/**
 * The detail view of one item in manager mode: a native modal with a preview,
 * the item's metadata, and the same actions the "…" menu offers (they are the
 * one shared list). Closing restores focus per the browser's dialog semantics.
 */
export default function ItemDetailDialog<M extends Meta, B extends Body>({
  item,
  actions,
  runAction,
  getPreviewUrl,
  onClose,
  i18n,
}: ItemDetailDialogProps<M, B>): h.JSX.Element {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (typeof dialog.showModal === 'function') dialog.showModal()
    else {
      // No focus trap without showModal(): put focus on the close button
      // ourselves so Escape reaches this dialog and not the page behind it.
      dialog.setAttribute('open', '')
      dialog.querySelector<HTMLButtonElement>('button')?.focus()
    }
  }, [])

  useEffect(() => {
    if (!getPreviewUrl || item.data.isFolder) return
    let cancelled = false
    // `Promise.resolve`: a JavaScript integrator may return any thenable.
    Promise.resolve(getPreviewUrl(item))
      .then((url) => {
        if (!cancelled) setPreviewUrl(url)
      })
      .catch(() => {
        /* previews are a nicety: fall back to the icon */
      })
    return () => {
      cancelled = true
    }
  }, [getPreviewUrl, item])

  const name = item.data.name ?? i18n('unnamed')
  const applicable = getApplicableActions(actions, item)
  // Only files carry these; Companion answers `null` for what it does not know.
  const file = item.type === 'file' ? item.data : undefined
  const size = file?.size
  const mimeType = file?.mimeType
  const modified = file?.modifiedDate

  return (
    <dialog
      ref={dialogRef}
      className="uppy-ProviderDialog uppy-ItemDetail"
      aria-label={name}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onKeyDown={(event) => {
        if (event.key !== 'Escape') return
        // Close it here rather than through the `cancel` event, which only a
        // modal dialog fires, and keep the Dashboard from treating the same
        // key press as "close the modal".
        event.preventDefault()
        event.stopPropagation()
        onClose()
      }}
      onClose={onClose}
    >
      <header className="uppy-ItemDetail-header">
        <h3 className="uppy-ItemDetail-name">{name}</h3>
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
            className={`uppy-u-reset uppy-c-btn uppy-ItemDetail-action${
              action.danger ? ' uppy-ItemDetail-action--danger' : ''
            }`}
            onClick={() => {
              onClose()
              runAction(action, item)
            }}
          >
            {action.label}
          </button>
        ))}
      </footer>
    </dialog>
  )
}
