import type { h } from 'preact'
import type {
  PartialTreeFile,
  PartialTreeFolderNode,
  PartialTreeId,
} from '../../../index.js'
import ItemIcon from './ItemIcon.js'

// if folder:
//   + checkbox (selects all files from folder)
//   + folder name (opens folder)
// if file:
//   + checkbox (selects file)
//   + file name (selects file)
type ListItemProps = {
  file: PartialTreeFile | PartialTreeFolderNode
  openFolder: (folderId: PartialTreeId) => void
  toggleCheckbox: (event: Event) => void
  className: string
  isDisabled: boolean
  restrictionError: string | null
  showTitles: boolean
  i18n: any
  actionsMenu?: h.JSX.Element | null
  /** Picker mode (or manager mode with the toggle on): rows are checkboxes. */
  selectable?: boolean
  /** Manager mode: a plain click on a file opens its details. */
  onFileClick?: (file: PartialTreeFile | PartialTreeFolderNode) => void
}

export default function ListItem({
  file,
  openFolder,
  className,
  isDisabled,
  restrictionError,
  toggleCheckbox,
  showTitles,
  i18n,
  actionsMenu = null,
  selectable = true,
  onFileClick,
}: ListItemProps): h.JSX.Element {
  return (
    <li
      className={className}
      title={
        file.status !== 'checked' && restrictionError
          ? restrictionError
          : undefined
      }
    >
      {selectable && (
        <input
          type="checkbox"
          className="uppy-u-reset uppy-ProviderBrowserItem-checkbox"
          onChange={toggleCheckbox}
          // for the <label/>
          name="listitem"
          id={file.id}
          checked={file.status === 'checked'}
          aria-label={
            file.data.isFolder
              ? i18n('allFilesFromFolderNamed', {
                  name: file.data.name ?? i18n('unnamed'),
                })
              : null
          }
          disabled={isDisabled}
          data-uppy-super-focusable
        />
      )}

      {file.data.isFolder ? (
        // button to open a folder
        <button
          type="button"
          className="uppy-u-reset uppy-c-btn uppy-ProviderBrowserItem-inner"
          onClick={() => openFolder(file.id)}
          aria-label={i18n('openFolderNamed', {
            name: file.data.name ?? i18n('unnamed'),
          })}
        >
          <div className="uppy-ProviderBrowserItem-iconWrap">
            <ItemIcon itemIconString={file.data.icon} />
          </div>
          {showTitles && file.data.name ? (
            <span className="uppy-truncate-text">{file.data.name}</span>
          ) : (
            i18n('unnamed')
          )}
        </button>
      ) : selectable ? (
        // label for a checkbox
        <label
          htmlFor={file.id}
          className="uppy-u-reset uppy-ProviderBrowserItem-inner"
        >
          <div className="uppy-ProviderBrowserItem-iconWrap">
            <ItemIcon itemIconString={file.data.icon} />
          </div>
          {showTitles && (
            <span className="uppy-truncate-text">
              {file.data.name ?? i18n('unnamed')}
            </span>
          )}
        </label>
      ) : (
        // manager mode: a plain click opens the item's details
        <button
          type="button"
          className="uppy-u-reset uppy-c-btn uppy-ProviderBrowserItem-inner"
          onClick={() => onFileClick?.(file)}
          aria-label={i18n('openFileNamed', {
            name: file.data.name ?? i18n('unnamed'),
          })}
        >
          <div className="uppy-ProviderBrowserItem-iconWrap">
            <ItemIcon itemIconString={file.data.icon} />
          </div>
          {showTitles && (
            <span className="uppy-truncate-text">
              {file.data.name ?? i18n('unnamed')}
            </span>
          )}
        </button>
      )}
      {actionsMenu}
    </li>
  )
}
