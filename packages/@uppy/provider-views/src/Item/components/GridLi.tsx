/* eslint-disable react/require-default-props */
import { h } from 'preact'
import classNames from 'classnames'
import type { RestrictionError } from '@uppy/core/lib/Restricter'
import type { Body, Meta } from '@uppy/utils/lib/UppyFile'
import type { PartialTreeStatus } from '@uppy/core/lib/Uppy'

type GridListItemProps<M extends Meta, B extends Body> = {
  className: string
  isDisabled: boolean
  restrictionError?: RestrictionError<M, B> | null
  status: PartialTreeStatus
  title?: string
  itemIconEl: any
  showTitles?: boolean
  toggleCheckbox: (event: Event) => void
  id: string
  children?: JSX.Element
}

function GridListItem<M extends Meta, B extends Body>(
  props: GridListItemProps<M, B>,
): h.JSX.Element {
  const {
    className,
    isDisabled,
    restrictionError,
    status,
    title,
    itemIconEl,
    showTitles,
    toggleCheckbox,
    id,
    children,
  } = props

  return (
    <li
      className={className}
      title={isDisabled ? restrictionError?.message : undefined}
    >
      <input
        type="checkbox"
        className="uppy-u-reset uppy-ProviderBrowserItem-checkbox uppy-ProviderBrowserItem-checkbox--grid"
        onChange={toggleCheckbox}
        name="listitem"
        id={id}
        checked={status === "checked" ? true : false}
        disabled={isDisabled}
        data-uppy-super-focusable
      />
      <label
        htmlFor={id}
        aria-label={title}
        className="uppy-u-reset uppy-ProviderBrowserItem-inner"
      >
        {itemIconEl}
        {showTitles && title}
        {children}
      </label>
    </li>
  )
}

export default GridListItem
