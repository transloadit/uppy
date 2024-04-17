/* eslint-disable react/require-default-props */
import { h } from 'preact'

import classNames from 'classnames'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore untyped
import VirtualList from '@uppy/utils/lib/VirtualList'
import type { Body, Meta, UppyFile } from '@uppy/utils/lib/UppyFile'
import type { I18n } from '@uppy/utils/lib/Translator'
import type Uppy from '@uppy/core'
import SearchFilterInput from './SearchFilterInput.tsx'
import FooterActions from './FooterActions.tsx'
import Item from './Item/index.tsx'
import type { PartialTree, PartialTreeFile, PartialTreeFolderNode } from '@uppy/core/lib/Uppy.ts'
import type { RestrictionError } from '@uppy/core/lib/Restricter.ts'
import type { CompanionFile } from '@uppy/utils/lib/CompanionFile'
import getNOfSelectedFiles from './utils/getNOfSelectedFiles.ts'
import filterItems from './utils/filterItems.ts'

type BrowserProps<M extends Meta, B extends Body> = {
  partialTree: PartialTree,
  currentFolderId: string | null,

  viewType: string
  headerComponent?: JSX.Element
  showBreadcrumbs: boolean
  toggleCheckbox: (event: Event, file: PartialTreeFile | PartialTreeFolderNode) => void
  handleScroll: (event: Event) => Promise<void>
  showTitles: boolean
  i18n: I18n
  validateRestrictions: (file: CompanionFile) => RestrictionError<M, B> | null
  isLoading: boolean | string
  showSearchFilter: boolean
  search: (query: string) => void
  searchTerm: string
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
    partialTree,
    currentFolderId,
    viewType,
    headerComponent,
    showBreadcrumbs,
    toggleCheckbox,
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
  } = props

  const itemsInThisFolder = partialTree.filter((item) => item.type !== 'root' && item.parentId === currentFolderId)
  const displayedPartialTree = filterItems(itemsInThisFolder, searchTerm) as (PartialTreeFile | PartialTreeFolderNode)[]

  const nOfSelectedFiles = getNOfSelectedFiles(partialTree)

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
                  renderRow={(file: PartialTreeFile | PartialTreeFolderNode) => (
                    <Item
                      viewType={viewType}
                      toggleCheckbox={toggleCheckbox}
                      showTitles={showTitles}
                      i18n={i18n}
                      validateRestrictions={validateRestrictions}
                      getFolder={getFolder}
                      file={file}
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
              {displayedPartialTree.map((file) => (
                <Item
                  viewType={viewType}
                  toggleCheckbox={toggleCheckbox}
                  showTitles={showTitles}
                  i18n={i18n}
                  validateRestrictions={validateRestrictions}
                  getFolder={getFolder}
                  file={file}
                />
              ))}
            </ul>
          </div>
        )
      })()}

      {nOfSelectedFiles > 0 && (
        <FooterActions
          selected={nOfSelectedFiles}
          done={done}
          cancel={cancel}
          i18n={i18n}
        />
      )}
    </div>
  )
}

export default Browser
