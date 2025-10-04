import classNames from 'classnames'
import type { CompanionFile } from '@uppy/utils'
import ItemIcon from './components/ItemIcon.js'

interface SearchResultItemProps {
  file: CompanionFile
  isChecked: boolean
  toggleCheckbox: (file: CompanionFile) => void
  isDisabled: boolean
  restrictionReason?: string | null
}

const SearchResultItem = ({
  file,
  isChecked,
  toggleCheckbox,
  isDisabled,
  restrictionReason,
}: SearchResultItemProps) => {
  const itemIconString = file.icon

  console.log("SearchResultItem isChecked ---> ", isChecked, isDisabled, restrictionReason)
  return (
    <li
      className={classNames(
        'uppy-ProviderBrowserItem',
        { 'uppy-ProviderBrowserItem--disabled': isDisabled },
        { 'uppy-ProviderBrowserItem--noPreview': itemIconString === 'video' },
      )}
      title={isDisabled ? restrictionReason ?? undefined : undefined}
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
