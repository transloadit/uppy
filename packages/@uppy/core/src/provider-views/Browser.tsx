import { useEffect, useRef, useState } from 'preact/hooks'
import type {
  Body,
  Meta,
  PartialTreeFile,
  PartialTreeFolderNode,
} from '../index.js'
import type { I18n } from '../utils/index.js'
import { VirtualList } from '../utils/index.js'
import { getApplicableActions } from './Item/components/ItemActionsMenu.js'
import ItemActionsPopover from './Item/components/ItemActionsPopover.js'
import Item from './Item/index.js'
import type ProviderView from './ProviderView/ProviderView.js'
import type { ProviderAction } from './ProviderView/ProviderView.js'

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
  actions?: ProviderAction<M, B>[]
  runAction?: ProviderView<M, B>['runAction']
}

type OpenMenu = { id: string; anchor: HTMLElement }

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
    actions = [],
    runAction,
  } = props

  const [isShiftKeyPressed, setIsShiftKeyPressed] = useState(false)
  // At most one item actions menu is open; it lives here (not in the item) so
  // it can be rendered outside the scrolling list.
  const [openMenu, setOpenMenu] = useState<OpenMenu | null>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const openMenuItem = openMenu
    ? displayedPartialTree.find((item) => item.id === openMenu.id)
    : undefined

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

  // The item behind an open menu can disappear (deleted, folder refreshed).
  useEffect(() => {
    if (openMenu && !openMenuItem) setOpenMenu(null)
  }, [openMenu, openMenuItem])

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

  const closeMenu = () => setOpenMenu(null)

  const renderItem = (item: PartialTreeFile | PartialTreeFolderNode) => (
    <Item
      key={item.id}
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
      actions={actions}
      runAction={runAction}
      menuOpen={openMenu?.id === item.id}
      toggleMenu={(anchor) =>
        setOpenMenu((current) =>
          current?.id === item.id ? null : { id: item.id, anchor },
        )
      }
    />
  )

  const popover =
    openMenu && openMenuItem && runAction ? (
      <ItemActionsPopover
        file={openMenuItem}
        actions={getApplicableActions(actions, openMenuItem)}
        anchor={openMenu.anchor}
        containerRef={bodyRef}
        runAction={runAction}
        onClose={closeMenu}
        i18n={i18n}
      />
    ) : null

  // todo remove virtuallist option and always use virtual list
  if (virtualList) {
    return (
      <div className="uppy-ProviderBrowser-body" ref={bodyRef}>
        <VirtualList
          className="uppy-ProviderBrowser-list"
          data={displayedPartialTree}
          renderRow={renderItem}
          rowHeight={35.5}
        />
        {popover}
      </div>
    )
  }
  return (
    <div className="uppy-ProviderBrowser-body" ref={bodyRef}>
      <ul
        className="uppy-ProviderBrowser-list"
        onScroll={handleScroll}
        // making <ul> not focusable for firefox
        tabIndex={-1}
      >
        {displayedPartialTree.map(renderItem)}
      </ul>
      {popover}
    </div>
  )
}

export default Browser
