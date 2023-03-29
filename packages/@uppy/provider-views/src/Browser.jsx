import { h } from 'preact'

import classNames from 'classnames'
import remoteFileObjToLocal from '@uppy/utils/lib/remoteFileObjToLocal'
import SearchFilterInput from './SearchFilterInput.jsx'
import FooterActions from './FooterActions.jsx'
import Item from './Item/index.jsx'

const VIRTUAL_SHARED_DIR = 'shared-with-me'

function Browser (props) {
  const {
    currentSelection,
    folders,
    files,
    uppyFiles,
    viewType,
    headerComponent,
    showBreadcrumbs,
    isChecked,
    toggleCheckbox,
    recordShiftKeyPress,
    handleScroll,
    showTitles,
    i18n,
    validateRestrictions,
    isLoading,
    showSearchFilter,
    search,
    searchTerm,
    clearSearch,
    searchOnInput,
    searchInputLabel,
    clearSearchLabel,
    getNextFolder,
    cancel,
    done,
    columns,
    noResultsLabel,
  } = props

  const selected = currentSelection.length

  return (
    <div
      className={classNames(
        'uppy-ProviderBrowser',
        `uppy-ProviderBrowser-viewType--${viewType}`,
      )}
    >
      {headerComponent && (
        <div className="uppy-ProviderBrowser-header">
          <div
            className={classNames(
              'uppy-ProviderBrowser-headerBar',
              !showBreadcrumbs && 'uppy-ProviderBrowser-headerBar--simple',
            )}
          >
            {headerComponent}
          </div>
        </div>
      )}

      {showSearchFilter && (
        <div class="uppy-ProviderBrowser-searchFilter">
          <SearchFilterInput
            search={search}
            searchTerm={searchTerm}
            clearSearch={clearSearch}
            inputLabel={searchInputLabel}
            clearSearchLabel={clearSearchLabel}
            inputClassName="uppy-ProviderBrowser-searchFilterInput"
            searchOnInput={searchOnInput}
          />
        </div>
      )}

      {(() => {
        if (isLoading) {
          return (
            <div className="uppy-Provider-loading">
              <span>{i18n('loading')}</span>
            </div>
          )
        }

        if (!folders.length && !files.length) {
          return (
            <div className="uppy-Provider-empty">
              {noResultsLabel}
            </div>
          )
        }

        return (
          <div className="uppy-ProviderBrowser-body">
            <ul
              className="uppy-ProviderBrowser-list"
              onScroll={handleScroll}
              role="listbox"
              // making <ul> not focusable for firefox
              tabIndex="-1"
            >
              {folders.map((folder) => {
                return Item({
                  columns,
                  showTitles,
                  viewType,
                  i18n,
                  id: folder.id,
                  title: folder.name,
                  getItemIcon: () => folder.icon,
                  isChecked: isChecked(folder),
                  toggleCheckbox: (event) => toggleCheckbox(event, folder),
                  recordShiftKeyPress,
                  type: 'folder',
                  isDisabled: isChecked(folder)?.loading,
                  isCheckboxDisabled: folder.id === VIRTUAL_SHARED_DIR,
                  handleFolderClick: () => getNextFolder(folder),
                })
              })}

              {files.map((file) => {
                const restrictionError = validateRestrictions(
                  remoteFileObjToLocal(file),
                  [...uppyFiles, ...currentSelection],
                )

                return Item({
                  id: file.id,
                  title: file.name,
                  author: file.author,
                  getItemIcon: () => file.icon,
                  isChecked: isChecked(file),
                  toggleCheckbox: (event) => toggleCheckbox(event, file),
                  recordShiftKeyPress,
                  columns,
                  showTitles,
                  viewType,
                  i18n,
                  type: 'file',
                  isDisabled: restrictionError && !isChecked(file),
                  restrictionError,
                })
              })}
            </ul>
          </div>
        )
      })()}

      {selected > 0 && (
        <FooterActions
          selected={selected}
          done={done}
          cancel={cancel}
          i18n={i18n}
        />
      )}
    </div>
  )
}

export default Browser
