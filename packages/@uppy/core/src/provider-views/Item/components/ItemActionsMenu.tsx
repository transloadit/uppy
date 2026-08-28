import type { h } from 'preact'
import { useEffect, useRef, useState } from 'preact/hooks'
import type { PartialTreeFile, PartialTreeFolderNode } from '../../../index.js'
import type { I18n } from '../../../utils/index.js'
import type { ProviderAction } from '../../ProviderView/ProviderView.js'

type ItemActionsMenuProps = {
  file: PartialTreeFile | PartialTreeFolderNode
  actions: ProviderAction<any, any>[]
  runAction: (
    action: ProviderAction<any, any>,
    file: PartialTreeFile | PartialTreeFolderNode,
  ) => void
  i18n: I18n
}

/**
 * A small "⋯" button that opens a menu with the provider actions that apply
 * to this item (rename, delete, copy URL, …). Used by ListItem and GridItem
 * when the view was configured with `actions`.
 */
export default function ItemActionsMenu({
  file,
  actions,
  runAction,
  i18n,
}: ItemActionsMenuProps): h.JSX.Element | null {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return undefined
    const onDocumentClick = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node))
        setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('click', onDocumentClick)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('click', onDocumentClick)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const applicable = actions.filter((action) => {
    const appliesTo = action.appliesTo ?? 'all'
    if (appliesTo === 'all') return true
    return appliesTo === 'folder' ? file.data.isFolder : !file.data.isFolder
  })
  if (applicable.length === 0) return null

  return (
    <div className="uppy-ProviderBrowserItem-actions" ref={rootRef}>
      <button
        type="button"
        className="uppy-u-reset uppy-c-btn uppy-ProviderBrowserItem-actionsBtn"
        aria-label={i18n('itemActionsNamed', {
          name: file.data.name ?? i18n('unnamed'),
        })}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(event) => {
          event.stopPropagation()
          event.preventDefault()
          setOpen((value) => !value)
        }}
      >
        <svg
          aria-hidden="true"
          width="16"
          height="16"
          viewBox="0 0 16 16"
          focusable="false"
        >
          <circle cx="3" cy="8" r="1.5" fill="currentColor" />
          <circle cx="8" cy="8" r="1.5" fill="currentColor" />
          <circle cx="13" cy="8" r="1.5" fill="currentColor" />
        </svg>
      </button>
      {open && (
        <div className="uppy-ProviderBrowserItem-actionsMenu" role="menu">
          {applicable.map((action) => (
            <button
              key={action.id}
              type="button"
              role="menuitem"
              className="uppy-u-reset uppy-c-btn uppy-ProviderBrowserItem-actionsMenuItem"
              onClick={(event) => {
                event.stopPropagation()
                event.preventDefault()
                setOpen(false)
                runAction(action, file)
              }}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
