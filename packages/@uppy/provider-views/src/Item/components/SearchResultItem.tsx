import type { CompanionFile } from '@uppy/utils'
import classNames from 'classnames'
import ItemIcon from './ItemIcon.js'

interface SearchResultItemProps {
  file: CompanionFile
  isChecked: boolean
  isPartial: boolean
  toggleCheckbox: (file: CompanionFile) => void
  openFolder?: (file: CompanionFile) => void
  isDisabled: boolean
  restrictionReason?: string | null
}

const SearchResultItem = ({
  file,
  isChecked,
  isPartial,
  toggleCheckbox,
  openFolder,
  isDisabled,
  restrictionReason,
}: SearchResultItemProps) => {
  const itemIconString = file.icon
  return (
    <li
      className={classNames(
        'uppy-ProviderBrowserItem',
        { 'uppy-ProviderBrowserItem--disabled': isDisabled },
        { 'uppy-ProviderBrowserItem--noPreview': itemIconString === 'video' },
        { 'uppy-ProviderBrowserItem--is-checked': isChecked },
        { 'uppy-ProviderBrowserItem--is-partial': isPartial },
      )}
      title={isDisabled ? (restrictionReason ?? undefined) : undefined}
    >
      <input
        type="checkbox"
        className={classNames(
          'uppy-u-reset',
          'uppy-ProviderBrowserItem-checkbox',
          'uppy-ProviderBrowserItem-checkbox--is-root',
        )}
        onChange={() => toggleCheckbox(file)}
        checked={isChecked}
        aria-label={file.name}
        disabled={isDisabled}
        data-uppy-super-focusable
      />
      <button
        type="button"
        className="uppy-u-reset uppy-c-btn uppy-ProviderBrowserItem-inner"
        disabled={isDisabled}
        aria-label={file.name}
        onClick={() => {
          if (file.isFolder && openFolder) {
            openFolder(file)
          }
        }}
      >
        <div className="uppy-ProviderBrowserItem-iconWrap">
          <ItemIcon itemIconString={itemIconString} />
        </div>
        <span className="uppy-ProviderBrowserItem-name">
          {file.name || 'Unnamed'}
        </span>
      </button>
    </li>
  )
}

export default SearchResultItem
