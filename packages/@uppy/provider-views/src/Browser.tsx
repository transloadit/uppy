/* eslint-disable react/require-default-props */
import { h } from 'preact'

import classNames from 'classnames'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore untyped
import VirtualList from '@uppy/utils/lib/VirtualList'
import type { Body, Meta } from '@uppy/utils/lib/UppyFile'
import type { I18n } from '@uppy/utils/lib/Translator'
import SearchFilterInput from './SearchFilterInput.tsx'
import FooterActions from './FooterActions.tsx'
import Item from './Item/index.tsx'
import type { PartialTree, PartialTreeFile, PartialTreeFolderNode } from '@uppy/core/lib/Uppy.ts'
import type { RestrictionError } from '@uppy/core/lib/Restricter.ts'
import type { CompanionFile } from '@uppy/utils/lib/CompanionFile'
import { useEffect, useState } from 'preact/hooks'
import type ProviderView from './ProviderView/ProviderView.tsx'

type BrowserProps<M extends Meta, B extends Body> = {
  displayedPartialTree: (PartialTreeFile | PartialTreeFolderNode)[],
  nOfSelectedFiles: number,

  viewType: string
  headerComponent?: JSX.Element
  toggleCheckbox: ProviderView<M, B>['toggleCheckbox']
  handleScroll: (event: Event) => Promise<void>
  showTitles: boolean
  i18n: I18n
  validateRestrictions: (file: CompanionFile) => RestrictionError<M, B> | null
  isLoading: boolean | string
  showSearchFilter: boolean
  searchString: string
  setSearchString: (s: string) => void
  submitSearchString: () => void
  searchInputLabel: string
  clearSearchLabel: string
  openFolder: (folderId: any) => void
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
    nOfSelectedFiles,
    viewType,
    headerComponent,
    toggleCheckbox,
    handleScroll,
    showTitles,
    i18n,
    validateRestrictions,
    isLoading,
    showSearchFilter,

    searchString,
    setSearchString,
    submitSearchString,

    searchInputLabel,
    clearSearchLabel,
    openFolder,
    cancel,
    done,
    noResultsLabel,
    loadAllFiles,
  } = props

  const [isShiftKeyPressed, setIsShiftKeyPressed] = useState(false)

  // This records whether the user is holding the SHIFT key this very moment.
  // Typically this is implemented using `onClick((e) => e.shiftKey)` - but we can't use that, because for accessibility reasons we're using html tags that don't support `e.shiftKey` property (see #3768).
  useEffect(() => {
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key == 'Shift') setIsShiftKeyPressed(false)
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key == 'Shift') setIsShiftKeyPressed(true)
    }
    document.addEventListener('keyup', handleKeyUp)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keyup', handleKeyUp)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  const renderItem = (item: PartialTreeFile | PartialTreeFolderNode) => (
    <Item
      viewType={viewType}
      toggleCheckbox={(event: Event) => {
        event.stopPropagation()
        event.preventDefault()
        // Prevent shift-clicking from highlighting file names
        // (https://stackoverflow.com/a/1527797/3192470)
        document.getSelection()?.removeAllRanges()
        toggleCheckbox(item, isShiftKeyPressed)
      }}
      showTitles={showTitles}
      i18n={i18n}
      validateRestrictions={validateRestrictions}
      openFolder={openFolder}
      file={item}
    />
  )

  return (
    <div
      className={classNames(
        'uppy-ProviderBrowser',
        `uppy-ProviderBrowser-viewType--${viewType}`,
      )}
    >
      {headerComponent || null}

      {showSearchFilter && (
        <SearchFilterInput
          searchString={searchString}
          setSearchString={setSearchString}
          submitSearchString={submitSearchString}
          inputLabel={searchInputLabel}
          clearSearchLabel={clearSearchLabel}
          wrapperClassName="uppy-ProviderBrowser-searchFilter"
          inputClassName="uppy-ProviderBrowser-searchFilterInput"
        />
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
                  renderRow={renderItem}
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
              {displayedPartialTree.map(renderItem)}
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
