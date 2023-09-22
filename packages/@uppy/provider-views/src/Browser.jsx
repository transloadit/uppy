import { h } from 'preact'

import classNames from 'classnames'
import remoteFileObjToLocal from '@uppy/utils/lib/remoteFileObjToLocal'
import { useMemo } from 'preact/hooks'
import VirtualList from '@uppy/utils/lib/VirtualList'
import SearchFilterInput from './SearchFilterInput.jsx'
import FooterActions from './FooterActions.jsx'
import Item from './Item/index.jsx'

const VIRTUAL_SHARED_DIR = 'shared-with-me'

function ListItem (props) {
  const {
    currentSelection,
    uppyFiles,
    viewType,
    isChecked,
    toggleCheckbox,
    recordShiftKeyPress,
    showTitles,
    i18n,
    validateRestrictions,
    getNextFolder,
    columns,
    f,
  } = props

  if (f.isFolder) {
    return Item({
      columns,
      showTitles,
      viewType,
      i18n,
      id: f.id,
      title: f.name,
      getItemIcon: () => f.icon,
      isChecked: isChecked(f),
      toggleCheckbox: (event) => toggleCheckbox(event, f),
      recordShiftKeyPress,
      type: 'folder',
      isDisabled: isChecked(f)?.loading,
      isCheckboxDisabled: f.id === VIRTUAL_SHARED_DIR,
      handleFolderClick: () => getNextFolder(f),
    })
  }
  const restrictionError = validateRestrictions(remoteFileObjToLocal(f), [
    ...uppyFiles,
    ...currentSelection,
  ])

  return Item({
    id: f.id,
    title: f.name,
    author: f.author,
    getItemIcon: () => f.icon,
    isChecked: isChecked(f),
    toggleCheckbox: (event) => toggleCheckbox(event, f),
    recordShiftKeyPress,
    columns,
    showTitles,
    viewType,
    i18n,
    type: 'file',
    isDisabled: restrictionError && !isChecked(f),
    restrictionError,
  })
}

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
    loadAllFiles,
  } = props

  const selected = currentSelection.length

  const rows = useMemo(() => [...folders, ...files], [folders, files])

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
          return <div className="uppy-Provider-empty">{noResultsLabel}</div>
        }

        if (loadAllFiles) {
          return (
            <div className="uppy-ProviderBrowser-body">
              <ul className="uppy-ProviderBrowser-list">
                <VirtualList
                  data={rows}
                  renderRow={(f) => (
                    <ListItem
                      currentSelection={currentSelection}
                      uppyFiles={uppyFiles}
                      viewType={viewType}
                      isChecked={isChecked}
                      toggleCheckbox={toggleCheckbox}
                      recordShiftKeyPress={recordShiftKeyPress}
                      showTitles={showTitles}
                      i18n={i18n}
                      validateRestrictions={validateRestrictions}
                      getNextFolder={getNextFolder}
                      columns={columns}
                      f={f}
                    />
                  )}
                  rowHeight={31}
                />
              </ul>
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
              {rows.map((f) => (
                <ListItem
                  currentSelection={currentSelection}
                  uppyFiles={uppyFiles}
                  viewType={viewType}
                  isChecked={isChecked}
                  toggleCheckbox={toggleCheckbox}
                  recordShiftKeyPress={recordShiftKeyPress}
                  showTitles={showTitles}
                  i18n={i18n}
                  validateRestrictions={validateRestrictions}
                  getNextFolder={getNextFolder}
                  columns={columns}
                  f={f}
                />
              ))}
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
