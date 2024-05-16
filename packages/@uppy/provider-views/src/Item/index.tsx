/* eslint-disable react/require-default-props */
import { h } from 'preact'

import classNames from 'classnames'
import type { I18n } from '@uppy/utils/lib/Translator'
import type { Meta, Body } from '@uppy/utils/lib/UppyFile'
import ItemIcon from './components/ItemIcon.tsx'
import GridItem from './components/GridItem.tsx'
import ListItem from './components/ListItem.tsx'
import type { PartialTreeFile, PartialTreeFolderNode, PartialTreeId } from '@uppy/core/lib/Uppy.ts'

type ItemProps<M extends Meta, B extends Body> = {
  viewType: string
  toggleCheckbox: (event: Event) => void
  showTitles: boolean
  i18n: I18n
  openFolder: (folderId: PartialTreeId) => void
  file: PartialTreeFile | PartialTreeFolderNode
}

export default function Item<M extends Meta, B extends Body>(
  props: ItemProps<M, B>,
): h.JSX.Element {
  const { viewType, toggleCheckbox, showTitles, i18n, openFolder, file } = props

  const restrictionError = file.type === 'folder' ? null : file.restrictionError
  const isDisabled = Boolean(restrictionError) && file.status !== 'checked'

  const sharedProps = {
    id: file.id,
    title: file.data.name,
    status: file.status,

    i18n,
    toggleCheckbox,
    viewType,
    showTitles,
    className: classNames(
      'uppy-ProviderBrowserItem',
      { 'uppy-ProviderBrowserItem--disabled': isDisabled },
      { 'uppy-ProviderBrowserItem--noPreview': file.data.icon === 'video' },
      { 'uppy-ProviderBrowserItem--is-checked': file.status === 'checked' },
      { 'uppy-ProviderBrowserItem--is-partial': file.status === 'partial' }
    ),
    itemIconEl: <ItemIcon itemIconString={file.data.icon} />,
    isDisabled,
    restrictionError
  }

  let ourProps = file.data.isFolder ?
    {
      ...sharedProps,
      type: 'folder',
      handleFolderClick: () => openFolder(file.id),
    } :
    {
      ...sharedProps,
      type: 'file'
    }

  switch (viewType) {
    case 'grid':
      return <GridItem<M, B> {...ourProps} />
    case 'list':
      return <ListItem<M, B> {...ourProps} />
    case 'unsplash':
      return (
        <GridItem<M, B> {...ourProps} >
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
