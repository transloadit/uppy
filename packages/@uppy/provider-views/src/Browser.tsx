/* eslint-disable react/require-default-props */
import { h } from 'preact'

import classNames from 'classnames'
import remoteFileObjToLocal from '@uppy/utils/lib/remoteFileObjToLocal'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore untyped
import VirtualList from '@uppy/utils/lib/VirtualList'
import type { Body, Meta, UppyFile } from '@uppy/utils/lib/UppyFile'
import type { I18n } from '@uppy/utils/lib/Translator'
import type Uppy from '@uppy/core'
import SearchFilterInput from './SearchFilterInput.tsx'
import FooterActions from './FooterActions.tsx'
import Item from './Item/index.tsx'
import type { FileInPartialTree, PartialTree } from '@uppy/core/lib/Uppy.ts'

const VIRTUAL_SHARED_DIR = 'shared-with-me'

type ListItemProps<M extends Meta, B extends Body> = {
  currentSelection: any[]
  uppyFiles: UppyFile<M, B>[]
  viewType: string
  toggleCheckbox: (event: Event, file: FileInPartialTree) => void
  recordShiftKeyPress: (event: KeyboardEvent | MouseEvent) => void
  showTitles: boolean
  i18n: I18n
  validateRestrictions: Uppy<M, B>['validateRestrictions']
  getFolder: (folderId: string) => void
  f: FileInPartialTree
}

function ListItem<M extends Meta, B extends Body>(
  props: ListItemProps<M, B>,
): JSX.Element {
  const {
    currentSelection,
    uppyFiles,
    viewType,
    toggleCheckbox,
    recordShiftKeyPress,
    showTitles,
    i18n,
    validateRestrictions,
    getFolder,
    f,
  } = props

  if (f.data.isFolder) {
    return Item<M, B>({
      showTitles,
      viewType,
      i18n,
      id: f.id,
      title: f.data.name,
      getItemIcon: () => f.data.icon,
      status: f.status,
      toggleCheckbox: (event: Event) => toggleCheckbox(event, f),
      recordShiftKeyPress,
      type: 'folder',
      // TODO: when was this supposed to be true?
      isDisabled: false,
      isCheckboxDisabled: f.id === VIRTUAL_SHARED_DIR,
      handleFolderClick: () => getFolder(f.id),
    })
  }
  const restrictionError = validateRestrictions(remoteFileObjToLocal(f.data), [
    ...uppyFiles,
    ...currentSelection,
  ])

  return Item<M, B>({
    id: f.id,
    title: f.data.name,
    author: f.data.author,
    getItemIcon: () => f.data.icon,
    toggleCheckbox: (event: Event) => toggleCheckbox(event, f),
    isCheckboxDisabled: false,
    status: f.status,
    recordShiftKeyPress,
    showTitles,
    viewType,
    i18n,
    type: 'file',
    isDisabled: Boolean(restrictionError) && (f.status !== "checked"),
    restrictionError,
  })
}

type BrowserProps<M extends Meta, B extends Body> = {
  displayedPartialTree: PartialTree,
  currentSelection: FileInPartialTree[],
  uppyFiles: UppyFile<M, B>[]
  viewType: string
  headerComponent?: JSX.Element
  showBreadcrumbs: boolean
  toggleCheckbox: (event: Event, file: FileInPartialTree) => void
  recordShiftKeyPress: (event: KeyboardEvent | MouseEvent) => void
  handleScroll: (event: Event) => Promise<void>
  showTitles: boolean
  i18n: I18n
  validateRestrictions: Uppy<M, B>['validateRestrictions']
  isLoading: boolean | string
  showSearchFilter: boolean
  search: (query: string) => void
  searchTerm?: string | null
  clearSearch: () => void
  searchOnInput: boolean
  searchInputLabel: string
  clearSearchLabel: string
  getFolder: (folderId: any) => void
  cancel: () => void
  done: () => void
  noResultsLabel: string
  loadAllFiles?: boolean
}

function Browser<M extends Meta, B extends Body>(
  props: BrowserProps<M, B>,
): JSX.Element {
  const {
    displayedPartialTree,
    uppyFiles,
    viewType,
    headerComponent,
    showBreadcrumbs,
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
    getFolder,
    cancel,
    done,
    noResultsLabel,
    loadAllFiles,
    currentSelection
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

        if (displayedPartialTree.length === 0) {
          return <div className="uppy-Provider-empty">{noResultsLabel}</div>
        }

        if (loadAllFiles) {
          return (
            <div className="uppy-ProviderBrowser-body">
              <ul className="uppy-ProviderBrowser-list">
                <VirtualList
                  data={displayedPartialTree}
                  renderRow={(f: FileInPartialTree) => (
                    <ListItem
                      currentSelection={currentSelection}
                      uppyFiles={uppyFiles}
                      viewType={viewType}
                      toggleCheckbox={toggleCheckbox}
                      recordShiftKeyPress={recordShiftKeyPress}
                      showTitles={showTitles}
                      i18n={i18n}
                      validateRestrictions={validateRestrictions}
                      getFolder={getFolder}
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
              tabIndex={-1}
            >
              {displayedPartialTree.map((f) => (
                <ListItem
                  currentSelection={currentSelection}
                  uppyFiles={uppyFiles}
                  viewType={viewType}
                  toggleCheckbox={toggleCheckbox}
                  recordShiftKeyPress={recordShiftKeyPress}
                  showTitles={showTitles}
                  i18n={i18n}
                  validateRestrictions={validateRestrictions}
                  getFolder={getFolder}
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
