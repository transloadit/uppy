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

function formatBytes(size: number): string {
  if (size < 1024) return `${size} B`
  const units = ['KB', 'MB', 'GB', 'TB']
  let value = size
  let unit = 'B'
  for (const next of units) {
    if (value < 1024) break
    value /= 1024
    unit = next
  }
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${unit}`
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
    else dialog.setAttribute('open', '')
  }, [])

  useEffect(() => {
    if (!getPreviewUrl || item.data.isFolder) return
    let cancelled = false
    getPreviewUrl(item)
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
  const size = (item.data as { size?: number | null }).size
  const mimeType = (item.data as { mimeType?: string | null }).mimeType
  const modified = (item.data as { modifiedDate?: string | null }).modifiedDate

  return (
    <dialog
      ref={dialogRef}
      className="uppy-ProviderDialog uppy-ItemDetail"
      aria-label={name}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClose={onClose}
    >
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
      <div className="uppy-ItemDetail-meta">
        <h3 className="uppy-ProviderDialog-title uppy-ItemDetail-name">
          {name}
        </h3>
        <dl className="uppy-ItemDetail-facts">
          {typeof size === 'number' && (
            <div className="uppy-ItemDetail-fact">
              <dt>{i18n('detailSize')}</dt>
              <dd>{formatBytes(size)}</dd>
            </div>
          )}
          {mimeType && (
            <div className="uppy-ItemDetail-fact">
              <dt>{i18n('detailType')}</dt>
              <dd>{mimeType}</dd>
            </div>
          )}
          {modified && (
            <div className="uppy-ItemDetail-fact">
              <dt>{i18n('detailModified')}</dt>
              <dd>{modified}</dd>
            </div>
          )}
        </dl>
      </div>
      <div className="uppy-ProviderDialog-actions uppy-ItemDetail-actions">
        {applicable.map((action) => (
          <button
            key={action.id}
            type="button"
            className="uppy-u-reset uppy-c-btn uppy-c-btn-secondary uppy-ItemDetail-action"
            onClick={() => {
              onClose()
              runAction(action, item)
            }}
          >
            {action.label}
          </button>
        ))}
        <button
          type="button"
          className="uppy-u-reset uppy-c-btn uppy-c-btn-primary"
          onClick={onClose}
        >
          {i18n('close')}
        </button>
      </div>
    </dialog>
  )
}
