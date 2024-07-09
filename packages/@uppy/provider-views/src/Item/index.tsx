/* eslint-disable react/jsx-props-no-spreading */
import { h } from 'preact'

import classNames from 'classnames'
import type { I18n } from '@uppy/utils/lib/Translator'
import type {
  PartialTreeFile,
  PartialTreeFolderNode,
  PartialTreeId,
} from '@uppy/core/lib/Uppy.js'
import GridItem from './components/GridItem.tsx'
import ListItem from './components/ListItem.tsx'

type ItemProps = {
  file: PartialTreeFile | PartialTreeFolderNode
  openFolder: (folderId: PartialTreeId) => void
  toggleCheckbox: (event: Event) => void
  viewType: string
  showTitles: boolean
  i18n: I18n
}

export default function Item(props: ItemProps): h.JSX.Element {
  const { viewType, toggleCheckbox, showTitles, i18n, openFolder, file } = props

  const restrictionError = file.type === 'folder' ? null : file.restrictionError
  const isDisabled = !!restrictionError && file.status !== 'checked'

  const ourProps = {
    file,
    openFolder,
    toggleCheckbox,

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
            href={`${file.data.author!.url}?utm_source=Companion&utm_medium=referral`}
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
