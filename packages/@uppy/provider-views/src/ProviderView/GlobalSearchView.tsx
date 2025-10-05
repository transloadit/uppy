import type { CompanionFile } from '@uppy/utils'
import SearchResultItem from '../Item/SearchResultItem.js'

interface GlobalSearchViewProps {
  searchResults: CompanionFile[]
  searchResultStatuses: Map<string, 'checked' | 'partial'>
  toggleSearchResultCheckbox: (file: CompanionFile) => void
  openSearchResultFolder: (file: CompanionFile) => void
  validateSingleFile: (file: CompanionFile) => string | null
  i18n: (key: string) => string
}

const GlobalSearchView = ({
  searchResults,
  searchResultStatuses,
  toggleSearchResultCheckbox,
  openSearchResultFolder,
  validateSingleFile,
  i18n,
}: GlobalSearchViewProps) => {
  if (searchResults.length === 0) {
    return <div className="uppy-Provider-empty">{i18n('noFilesFound')}</div>
  }

  return (
    <div className="uppy-ProviderBrowser-body">
      <ul className="uppy-ProviderBrowser-list">
        {searchResults.map((file) => {
          const restrictionReason = validateSingleFile(file)
          const isDisabled = restrictionReason != null
          const status = searchResultStatuses.get(file.requestPath)
          const isChecked = status === 'checked'
          const isPartial = status === 'partial'

          return (
            <SearchResultItem
              key={file.requestPath}
              file={file}
              isChecked={isChecked}
              isPartial={isPartial}
              toggleCheckbox={toggleSearchResultCheckbox}
              openFolder={openSearchResultFolder}
              isDisabled={isDisabled}
              restrictionReason={restrictionReason}
            />
          )
        })}
      </ul>
    </div>
  )
}

export default GlobalSearchView
