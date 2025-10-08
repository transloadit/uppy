import type { PartialTreeFile, PartialTreeFolderNode } from '@uppy/core'
import type { I18n } from '@uppy/utils'
import classNames from 'classnames'
import type ProviderView from '../../ProviderView/ProviderView.js'
import ItemIcon from './ItemIcon.js'

interface SearchResultItemProps {
  item: PartialTreeFile | PartialTreeFolderNode
  i18n: I18n
  openFolder: ProviderView<any, any>['openSearchResultFolder']
  toggleCheckbox: ProviderView<any, any>['toggleCheckbox']
}

const SearchResultItem = ({
  i18n,
  item,
  toggleCheckbox,
  openFolder,
}: SearchResultItemProps) => {
  const isDisabled =
    'restrictionError' in item &&
    item.restrictionError != null &&
    item.status !== 'checked'

  return (
    <li
      className={classNames(
        'uppy-ProviderBrowserItem',
        { 'uppy-ProviderBrowserItem--disabled': isDisabled },
        { 'uppy-ProviderBrowserItem--noPreview': item.data.icon === 'video' },
        { 'uppy-ProviderBrowserItem--is-checked': item.status === 'checked' },
        { 'uppy-ProviderBrowserItem--is-partial': item.status === 'partial' },
      )}
      title={
        ('restrictionError' in item ? item.restrictionError : undefined) ??
        undefined
      }
    >
      <input
        type="checkbox"
        className="uppy-u-reset uppy-ProviderBrowserItem-checkbox"
        onChange={() => toggleCheckbox(item, false)}
        checked={item.status === 'checked'}
        aria-label={item.data.name ?? i18n('unnamed')}
        disabled={isDisabled}
        data-uppy-super-focusable
      />
      <button
        type="button"
        className="uppy-u-reset uppy-c-btn uppy-ProviderBrowserItem-inner"
        disabled={isDisabled}
        aria-label={item.data.name}
        onClick={() => {
          if (item.data.isFolder) {
            openFolder(item.id)
          }
        }}
      >
        <div className="uppy-ProviderBrowserItem-iconWrap">
          <ItemIcon itemIconString={item.data.icon} />
        </div>
        {item.data.name ?? i18n('unnamed')}
      </button>
    </li>
  )
}

export default SearchResultItem
