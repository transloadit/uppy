import type {
  Body,
  Meta,
  PartialTreeFile,
  PartialTreeFolderNode,
} from '@uppy/core'
import type { I18n } from '@uppy/utils/lib/Translator'
// @ts-ignore untyped
import VirtualList from '@uppy/utils/lib/VirtualList'
import { h } from 'preact'
import { useEffect, useState } from 'preact/hooks'
import Item from './Item/index.js'
import type ProviderView from './ProviderView/ProviderView.js'

type BrowserProps<M extends Meta, B extends Body> = {
  displayedPartialTree: (PartialTreeFile | PartialTreeFolderNode)[]
  viewType: string
  toggleCheckbox: ProviderView<M, B>['toggleCheckbox']
  handleScroll: ProviderView<M, B>['handleScroll']
  showTitles: boolean
  i18n: I18n
  isLoading: boolean | string
  openFolder: ProviderView<M, B>['openFolder']
  noResultsLabel: string
  virtualList: boolean
  utmSource: string
}

function Browser<M extends Meta, B extends Body>(props: BrowserProps<M, B>) {
  const {
    displayedPartialTree,
    viewType,
    toggleCheckbox,
    handleScroll,
    showTitles,
    i18n,
    isLoading,
    openFolder,
    noResultsLabel,
    virtualList,
    utmSource,
  } = props

  const [isShiftKeyPressed, setIsShiftKeyPressed] = useState(false)

  // This records whether the user is holding the SHIFT key this very moment.
  // Typically, this is implemented using `onClick((e) => e.shiftKey)` -
  // however we can't use that, because for accessibility reasons
  // we're using html tags that don't support `e.shiftKey` property (see #3768).
  useEffect(() => {
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setIsShiftKeyPressed(false)
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setIsShiftKeyPressed(true)
    }
    document.addEventListener('keyup', handleKeyUp)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keyup', handleKeyUp)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  if (isLoading) {
    return (
      <div className="uppy-Provider-loading">
        {typeof isLoading === 'string' ? isLoading : i18n('loading')}
      </div>
    )
  }

  if (displayedPartialTree.length === 0) {
    return <div className="uppy-Provider-empty">{noResultsLabel}</div>
  }

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
      openFolder={openFolder}
      file={item}
      utmSource={utmSource}
    />
  )

  if (virtualList) {
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
        // making <ul> not focusable for firefox
        tabIndex={-1}
      >
        {displayedPartialTree.map(renderItem)}
      </ul>
    </div>
  )
}

export default Browser
