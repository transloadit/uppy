/* eslint-disable react/require-default-props */
import { h } from 'preact'

import classNames from 'classnames'
import type { I18n } from '@uppy/utils/lib/Translator'
import type { CompanionFile } from '@uppy/utils/lib/CompanionFile'
import type { RestrictionError } from '@uppy/core/lib/Restricter.ts'
import type { Meta, Body } from '@uppy/utils/lib/UppyFile'
import ItemIcon from './components/ItemIcon.tsx'
import GridListItem from './components/GridLi.tsx'
import ListItem from './components/ListLi.tsx'

type ItemProps<M extends Meta, B extends Body> = {
  showTitles: boolean
  i18n: I18n
  id: string
  title: string
  toggleCheckbox: (event: Event) => void
  recordShiftKeyPress: (event: KeyboardEvent | MouseEvent) => void
  handleFolderClick?: () => void
  restrictionError?: RestrictionError<M, B> | null
  isCheckboxDisabled: boolean
  type: 'folder' | 'file'
  author?: CompanionFile['author']
  getItemIcon: () => string
  isChecked: boolean
  isDisabled: boolean
  viewType: string
}

export default function Item<M extends Meta, B extends Body>(
  props: ItemProps<M, B>,
): h.JSX.Element {
  const { author, getItemIcon, isChecked, isDisabled, viewType } = props
  const itemIconString = getItemIcon()

  const className = classNames(
    'uppy-ProviderBrowserItem',
    { 'uppy-ProviderBrowserItem--selected': isChecked },
    { 'uppy-ProviderBrowserItem--disabled': isDisabled },
    { 'uppy-ProviderBrowserItem--noPreview': itemIconString === 'video' },
  )

  const itemIconEl = <ItemIcon itemIconString={itemIconString} />

  switch (viewType) {
    case 'grid':
      return (
        <GridListItem<M, B>
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...props}
          className={className}
          itemIconEl={itemIconEl}
        />
      )
    case 'list':
      return (
        <ListItem<M, B>
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...props}
          className={className}
          itemIconEl={itemIconEl}
        />
      )
    case 'unsplash':
      return (
        <GridListItem<M, B>
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...props}
          className={className}
          itemIconEl={itemIconEl}
        >
          <a
            href={`${author!.url}?utm_source=Companion&utm_medium=referral`}
            target="_blank"
            rel="noopener noreferrer"
            className="uppy-ProviderBrowserItem-author"
            tabIndex={-1}
          >
            {author!.name}
          </a>
        </GridListItem>
      )
    default:
      throw new Error(`There is no such type ${viewType}`)
  }
}
