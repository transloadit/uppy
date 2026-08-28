import type { h } from 'preact'
import type { PartialTreeFile, PartialTreeFolderNode } from '../../../index.js'
import type { I18n } from '../../../utils/index.js'
import type { ProviderAction } from '../../ProviderView/ProviderView.js'

type ItemActionsMenuProps = {
  file: PartialTreeFile | PartialTreeFolderNode
  actions: ProviderAction<any, any>[]
  open: boolean
  onToggle: (anchor: HTMLElement) => void
  i18n: I18n
}

/** The actions from `actions` that apply to this item (file vs folder). */
export function getApplicableActions(
  actions: ProviderAction<any, any>[],
  file: PartialTreeFile | PartialTreeFolderNode,
): ProviderAction<any, any>[] {
  return actions.filter((action) => {
    const appliesTo = action.appliesTo ?? 'all'
    if (appliesTo === 'all') return true
    return appliesTo === 'folder' ? file.data.isFolder : !file.data.isFolder
  })
}

/**
 * The "⋯" trigger for an item's actions menu (rename, delete, copy URL, …).
 * The menu itself is rendered by `Browser` (see ItemActionsPopover) so that it
 * is not clipped by the scrolling list and only one can be open at a time.
 */
export default function ItemActionsMenu({
  file,
  actions,
  open,
  onToggle,
  i18n,
}: ItemActionsMenuProps): h.JSX.Element | null {
  if (getApplicableActions(actions, file).length === 0) return null

  return (
    <div className="uppy-ProviderBrowserItem-actions">
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
          onToggle(event.currentTarget as HTMLElement)
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
    </div>
  )
}
