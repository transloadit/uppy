import classNames from 'classnames'
import type { h } from 'preact'
import type {
  PartialTreeFile,
  PartialTreeFolderNode,
  PartialTreeId,
} from '../../index.js'
import type { I18n } from '../../utils/index.js'
import type { ProviderAction } from '../ProviderView/ProviderView.js'
import GridItem from './components/GridItem.js'
import ItemActionsMenu from './components/ItemActionsMenu.js'
import ListItem from './components/ListItem.js'

type ItemProps = {
  file: PartialTreeFile | PartialTreeFolderNode
  openFolder: (folderId: PartialTreeId) => void
  toggleCheckbox: (event: Event) => void
  viewType: string
  showTitles: boolean
  i18n: I18n
  utmSource: string
  actions?: ProviderAction<any, any>[]
  runAction?: (
    action: ProviderAction<any, any>,
    file: PartialTreeFile | PartialTreeFolderNode,
  ) => void
  menuOpen?: boolean
  toggleMenu?: (anchor: HTMLElement) => void
  selectable?: boolean
  onFileClick?: (file: PartialTreeFile | PartialTreeFolderNode) => void
}

export default function Item(props: ItemProps): h.JSX.Element {
  const {
    viewType,
    toggleCheckbox,
    showTitles,
    i18n,
    openFolder,
    file,
    utmSource,
    actions = [],
    runAction,
    menuOpen = false,
    toggleMenu,
    selectable = true,
    onFileClick,
  } = props

  const actionsMenu =
    actions.length > 0 && runAction && toggleMenu ? (
      <ItemActionsMenu
        file={file}
        actions={actions}
        open={menuOpen}
        onToggle={toggleMenu}
        i18n={i18n}
      />
    ) : null

  const restrictionError = file.type === 'folder' ? null : file.restrictionError
  const isDisabled = !!restrictionError && file.status !== 'checked'

  const ourProps = {
    file,
    openFolder,
    toggleCheckbox,
    utmSource,

    i18n,
    viewType,
    showTitles,
    className: classNames(
      'uppy-ProviderBrowserItem',
      { 'uppy-ProviderBrowserItem--disabled': isDisabled },
      { 'uppy-ProviderBrowserItem--noPreview': file.data.icon === 'video' },
      { 'uppy-ProviderBrowserItem--is-checked': file.status === 'checked' },
      { 'uppy-ProviderBrowserItem--is-partial': file.status === 'partial' },
    ),
    isDisabled,
    restrictionError,
    actionsMenu,
    selectable,
    onFileClick,
  }

  switch (viewType) {
    case 'grid':
      return <GridItem {...ourProps} />
    case 'list':
      return <ListItem {...ourProps} />
    case 'unsplash':
      return (
        <GridItem {...ourProps}>
          <a
            href={`${file.data.author!.url}?utm_source=${utmSource}&utm_medium=referral`}
            target="_blank"
            rel="noopener noreferrer"
            className="uppy-ProviderBrowserItem-author"
            tabIndex={-1}
          >
            {file.data.author!.name}
          </a>
        </GridItem>
      )
    default:
      throw new Error(`There is no such type ${viewType}`)
  }
}
