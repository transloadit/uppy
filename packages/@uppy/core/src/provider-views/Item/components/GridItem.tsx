import type { h } from 'preact'
import type { PartialTreeFile, PartialTreeFolderNode } from '../../../index.js'
import ItemIcon from './ItemIcon.js'

type GridItemProps = {
  file: PartialTreeFile | PartialTreeFolderNode
  toggleCheckbox: (event: Event) => void
  className: string
  isDisabled: boolean
  restrictionError: string | null
  showTitles: boolean
  children?: h.JSX.Element | null
  i18n: any
  actionsMenu?: h.JSX.Element | null
  selectable?: boolean
  onFileClick?: (file: PartialTreeFile | PartialTreeFolderNode) => void
}

function GridItem({
  file,
  toggleCheckbox,
  className,
  isDisabled,
  restrictionError,
  showTitles,
  children = null,
  i18n,
  actionsMenu = null,
  selectable = true,
  onFileClick,
}: GridItemProps): h.JSX.Element {
  const name = file.data.name ?? i18n('unnamed')
  const content = (
    <>
      <ItemIcon itemIconString={file.data.thumbnail || file.data.icon} />
      {showTitles && name}
      {children}
    </>
  )
  return (
    <li
      className={className}
      title={isDisabled && restrictionError ? restrictionError : undefined}
    >
      {selectable && (
        <input
          type="checkbox"
          className="uppy-u-reset uppy-ProviderBrowserItem-checkbox uppy-ProviderBrowserItem-checkbox--grid"
          onChange={toggleCheckbox}
          name="listitem"
          id={file.id}
          checked={file.status === 'checked'}
          disabled={isDisabled}
          data-uppy-super-focusable
        />
      )}
      {!selectable && onFileClick && !file.data.isFolder ? (
        <button
          type="button"
          aria-label={i18n('openFileNamed', { name })}
          className="uppy-u-reset uppy-ProviderBrowserItem-inner"
          onClick={() => onFileClick(file)}
        >
          {content}
        </button>
      ) : (
        <label
          htmlFor={selectable ? file.id : undefined}
          aria-label={name}
          className="uppy-u-reset uppy-ProviderBrowserItem-inner"
        >
          {content}
        </label>
      )}
      {actionsMenu}
    </li>
  )
}

export default GridItem
