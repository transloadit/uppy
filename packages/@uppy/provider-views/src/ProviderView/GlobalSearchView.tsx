import type { CompanionFile } from '@uppy/utils'
import SearchResultItem from '../Item/SearchResultItem.js'

interface GlobalSearchViewProps {
  searchResults: CompanionFile[]
  checkedSearchResults: Set<string>
  toggleSearchResultCheckbox: (file: CompanionFile) => void
  validateSingleFile: (file: CompanionFile) => string | null
  i18n: (key: string) => string
}

const GlobalSearchView = ({
  searchResults,
  checkedSearchResults,
  toggleSearchResultCheckbox,
  validateSingleFile,
  i18n,
}: GlobalSearchViewProps) => {
  if (searchResults.length === 0) {
    return (
      <div className="uppy-Provider-empty">
        {i18n('noFilesFound')}
      </div>
    )
  }

  return (
    <div className="uppy-ProviderBrowser-body">
      <ul className="uppy-ProviderBrowser-list">
        {searchResults.map((file) => {
          const restrictionReason = validateSingleFile(file)
          const isDisabled = restrictionReason != null
          const isChecked = checkedSearchResults.has(file.requestPath)

          return (
            <SearchResultItem
              key={file.requestPath}
              file={file}
              isChecked={isChecked}
              toggleCheckbox={toggleSearchResultCheckbox}
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
