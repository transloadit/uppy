import type { PartialTreeFile, PartialTreeFolderNode } from '@uppy/core'
import type { I18n } from '@uppy/utils'
import SearchResultItem from '../Item/components/SearchResultItem.js'
import type ProviderView from './ProviderView.js'

interface GlobalSearchViewProps {
  searchResults: (PartialTreeFile | PartialTreeFolderNode)[]
  openFolder: ProviderView<any, any>['openSearchResultFolder']
  toggleCheckbox: ProviderView<any, any>['toggleCheckbox']
  i18n: I18n
}

const GlobalSearchView = ({
  searchResults,
  toggleCheckbox,
  openFolder,
  i18n,
}: GlobalSearchViewProps) => {
  if (searchResults.length === 0) {
    return <div className="uppy-Provider-empty">{i18n('noFilesFound')}</div>
  }

  return (
    <div className="uppy-ProviderBrowser-body">
      <ul className="uppy-ProviderBrowser-list">
        {searchResults.map((item) => (
          <SearchResultItem
            i18n={i18n}
            key={item.id}
            item={item}
            toggleCheckbox={toggleCheckbox}
            openFolder={openFolder}
          />
        ))}
      </ul>
    </div>
  )
}

export default GlobalSearchView
