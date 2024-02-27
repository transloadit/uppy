/* eslint-disable react/require-default-props */
import { h } from 'preact'

import classNames from 'classnames'
import remoteFileObjToLocal from '@uppy/utils/lib/remoteFileObjToLocal'
import { useMemo } from 'preact/hooks'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore untyped
import VirtualList from '@uppy/utils/lib/VirtualList'
import type { CompanionFile } from '@uppy/utils/lib/CompanionFile'
import type { Body, Meta, UppyFile } from '@uppy/utils/lib/UppyFile'
import type { I18n } from '@uppy/utils/lib/Translator'
import type Uppy from '@uppy/core'
import SearchFilterInput from './SearchFilterInput.tsx'
import FooterActions from './FooterActions.tsx'
import Item from './Item/index.tsx'

const VIRTUAL_SHARED_DIR = 'shared-with-me'

type ListItemProps<M extends Meta, B extends Body> = {
  currentSelection: any[]
  uppyFiles: UppyFile<M, B>[]
  viewType: string
  isChecked: (file: any) => boolean
  toggleCheckbox: (event: Event, file: CompanionFile) => void
  recordShiftKeyPress: (event: KeyboardEvent | MouseEvent) => void
  showTitles: boolean
  i18n: I18n
  validateRestrictions: Uppy<M, B>['validateRestrictions']
  getNextFolder?: (folder: any) => void
  f: CompanionFile
}

function ListItem<M extends Meta, B extends Body>(
  props: ListItemProps<M, B>,
): JSX.Element {
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
    f,
  } = props

  if (f.isFolder) {
    return Item<M, B>({
      showTitles,
      viewType,
      i18n,
      id: f.id,
      title: f.name,
      getItemIcon: () => f.icon,
      isChecked: isChecked(f),
      toggleCheckbox: (event: Event) => toggleCheckbox(event, f),
      recordShiftKeyPress,
      type: 'folder',
      // TODO: when was this supposed to be true?
      isDisabled: false,
      isCheckboxDisabled: f.id === VIRTUAL_SHARED_DIR,
      // getNextFolder always exists when f.isFolder is true
      handleFolderClick: () => getNextFolder!(f),
    })
  }
  const restrictionError = validateRestrictions(remoteFileObjToLocal(f), [
    ...uppyFiles,
    ...currentSelection,
  ])

  return Item<M, B>({
    id: f.id,
    title: f.name,
    author: f.author,
    getItemIcon: () => f.icon,
    isChecked: isChecked(f),
    toggleCheckbox: (event: Event) => toggleCheckbox(event, f),
    isCheckboxDisabled: false,
    recordShiftKeyPress,
    showTitles,
    viewType,
    i18n,
    type: 'file',
    isDisabled: Boolean(restrictionError) && !isChecked(f),
    restrictionError,
  })
}

type BrowserProps<M extends Meta, B extends Body> = {
  currentSelection: any[]
  folders: CompanionFile[]
  files: CompanionFile[]
  uppyFiles: UppyFile<M, B>[]
  viewType: string
  headerComponent?: JSX.Element
  showBreadcrumbs: boolean
  isChecked: (file: any) => boolean
  toggleCheckbox: (event: Event, file: CompanionFile) => void
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
  getNextFolder?: (folder: any) => void
  cancel: () => void
  done: () => void
  noResultsLabel: string
  loadAllFiles?: boolean
}

function Browser<M extends Meta, B extends Body>(
  props: BrowserProps<M, B>,
): JSX.Element {
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
                  renderRow={(f: CompanionFile) => (
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
