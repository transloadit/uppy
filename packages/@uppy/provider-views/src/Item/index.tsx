/* eslint-disable react/require-default-props */
import { h } from 'preact'

import classNames from 'classnames'
import type { I18n } from '@uppy/utils/lib/Translator'
import type { Meta, Body, UppyFile } from '@uppy/utils/lib/UppyFile'
import ItemIcon from './components/ItemIcon.tsx'
import GridListItem from './components/GridLi.tsx'
import ListItem from './components/ListLi.tsx'
import type { PartialTreeFile, PartialTreeFolderNode, PartialTreeId, Uppy } from '@uppy/core/lib/Uppy.ts'
import remoteFileObjToLocal from '@uppy/utils/lib/remoteFileObjToLocal'

const VIRTUAL_SHARED_DIR = 'shared-with-me'

type ItemProps<M extends Meta, B extends Body> = {
  currentSelection: any[]
  uppyFiles: UppyFile<M, B>[]
  viewType: string
  toggleCheckbox: (event: Event, file: (PartialTreeFile | PartialTreeFolderNode)) => void
  recordShiftKeyPress: (event: KeyboardEvent | MouseEvent) => void
  showTitles: boolean
  i18n: I18n
  validateRestrictions: Uppy<M, B>['validateRestrictions']
  getFolder: (folderId: PartialTreeId) => void
  file: PartialTreeFile | PartialTreeFolderNode
}

export default function Item<M extends Meta, B extends Body>(
  props: ItemProps<M, B>,
): h.JSX.Element {
  const { currentSelection, uppyFiles, viewType, toggleCheckbox, recordShiftKeyPress, showTitles, i18n, validateRestrictions, getFolder, file } = props

  const restrictionError = file.data.isFolder ? null : validateRestrictions(remoteFileObjToLocal(file.data), [...uppyFiles, ...currentSelection])
  const isDisabled = file.data.isFolder ? false : (Boolean(restrictionError) && (file.status !== "checked"))

  const sharedProps = {
    id: file.id,
    title: file.data.name,
    status: file.status,

    i18n,
    toggleCheckbox: (event: Event) => toggleCheckbox(event, file),
    viewType,
    showTitles,
    recordShiftKeyPress,
    className: classNames(
      'uppy-ProviderBrowserItem',
      { 'uppy-ProviderBrowserItem--disabled': isDisabled },
      { 'uppy-ProviderBrowserItem--noPreview': file.data.icon === 'video' },
      { 'uppy-ProviderBrowserItem--is-checked': file.status === 'checked' },
      { 'uppy-ProviderBrowserItem--is-partial': file.status === 'partial' }
    ),
    itemIconEl: <ItemIcon itemIconString={file.data.icon} />,
    isDisabled,
  }

  let ourProps = file.data.isFolder ?
    {
      ...sharedProps,
      type: 'folder',
      isCheckboxDisabled: file.id === VIRTUAL_SHARED_DIR,
      handleFolderClick: () => getFolder(file.id),
    } :
    {
      ...sharedProps,
      isCheckboxDisabled: false,
      type: 'file',
      restrictionError,
    }

  switch (viewType) {
    case 'grid':
      return <GridListItem<M, B> {...ourProps} />
    case 'list':
      return (
        <ListItem<M, B> {...ourProps} />
      )
    case 'unsplash':
      return (
        <GridListItem<M, B> {...ourProps} >
          <a
            href={`${file.data.author!.url}?utm_source=Companion&utm_medium=referral`}
            target="_blank"
            rel="noopener noreferrer"
            className="uppy-ProviderBrowserItem-author"
            tabIndex={-1}
          >
            {file.data.author!.name}
          </a>
        </GridListItem>
      )
    default:
      throw new Error(`There is no such type ${viewType}`)
  }
}
