/* eslint-disable react/require-default-props */
import type { RestrictionError } from '@uppy/core/lib/Restricter'
import type { Body, Meta } from '@uppy/utils/lib/UppyFile'
import { h } from 'preact'

// if folder:
//   + checkbox (selects all files from folder)
//   + folder name (opens folder)
// if file:
//   + checkbox (selects file)
//   + file name (selects file)

type ListItemProps<M extends Meta, B extends Body> = {
  className: string
  isDisabled: boolean
  restrictionError?: RestrictionError<M, B> | null
  isCheckboxDisabled: boolean
  isChecked: boolean
  toggleCheckbox: (event: Event) => void
  recordShiftKeyPress: (event: KeyboardEvent | MouseEvent) => void
  type: string
  id: string
  itemIconEl: any
  title: string
  handleFolderClick?: () => void
  showTitles: boolean
  i18n: any
}

export default function ListItem<M extends Meta, B extends Body>(
  props: ListItemProps<M, B>,
): h.JSX.Element {
  const {
    className,
    isDisabled,
    restrictionError,
    isCheckboxDisabled,
    isChecked,
    toggleCheckbox,
    recordShiftKeyPress,
    type,
    id,
    itemIconEl,
    title,
    handleFolderClick,
    showTitles,
    i18n,
  } = props

  return (
    <li
      className={className}
      title={isDisabled ? restrictionError?.message : undefined}
    >
      {!isCheckboxDisabled ?
        <input
          type="checkbox"
          className={`uppy-u-reset uppy-ProviderBrowserItem-checkbox ${isChecked ? 'uppy-ProviderBrowserItem-checkbox--is-checked' : ''}`}
          onChange={toggleCheckbox}
          onKeyDown={recordShiftKeyPress}
          onMouseDown={recordShiftKeyPress}
          // for the <label/>
          name="listitem"
          id={id}
          checked={isChecked}
          aria-label={
            type === 'file' ? null : (
              i18n('allFilesFromFolderNamed', { name: title })
            )
          }
          disabled={isDisabled}
          data-uppy-super-focusable
        />
      : null}

      {
        type === 'file' ?
          // label for a checkbox
          <label
            htmlFor={id}
            className="uppy-u-reset uppy-ProviderBrowserItem-inner"
          >
            <div className="uppy-ProviderBrowserItem-iconWrap">
              {itemIconEl}
            </div>
            {showTitles && title}
          </label>
          // button to open a folder
        : <button
            type="button"
            className="uppy-u-reset uppy-c-btn uppy-ProviderBrowserItem-inner"
            onClick={handleFolderClick}
            aria-label={i18n('openFolderNamed', { name: title })}
          >
            <div className="uppy-ProviderBrowserItem-iconWrap">
              {itemIconEl}
            </div>
            {showTitles && <span>{title}</span>}
          </button>

      }
    </li>
  )
}
