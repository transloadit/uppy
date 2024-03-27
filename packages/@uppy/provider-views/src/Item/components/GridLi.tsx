/* eslint-disable react/require-default-props */
import { h } from 'preact'
import classNames from 'classnames'
import type { RestrictionError } from '@uppy/core/lib/Restricter'
import type { Body, Meta } from '@uppy/utils/lib/UppyFile'
import type { StatusInPartialTree } from '@uppy/core/lib/Uppy'

type GridListItemProps<M extends Meta, B extends Body> = {
  className: string
  isDisabled: boolean
  restrictionError?: RestrictionError<M, B> | null
  status: StatusInPartialTree | null
  title?: string
  itemIconEl: any
  showTitles?: boolean
  toggleCheckbox: (event: Event) => void
  recordShiftKeyPress: (event: KeyboardEvent) => void
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
    recordShiftKeyPress,
    id,
    children,
  } = props

  let statusClassName
  if (status === "checked") {
    statusClassName = "uppy-ProviderBrowserItem-checkbox--is-checked"
  } else if (status === "unchecked") {
    statusClassName = ""
  } else if (status === "partial") {
    statusClassName = "uppy-ProviderBrowserItem-checkbox--is-partial"
  }

  const checkBoxClassName = classNames(
    'uppy-u-reset',
    'uppy-ProviderBrowserItem-checkbox',
    'uppy-ProviderBrowserItem-checkbox--grid',
    statusClassName
  )

  return (
    <li
      className={className}
      title={isDisabled ? restrictionError?.message : undefined}
    >
      <input
        type="checkbox"
        className={checkBoxClassName}
        onChange={toggleCheckbox}
        onKeyDown={recordShiftKeyPress}
        // @ts-expect-error this is fine onMouseDown too
        onMouseDown={recordShiftKeyPress}
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
