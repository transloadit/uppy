import { h } from 'preact'
import classNames from 'classnames'

function GridListItem (props) {
  const {
    className,
    isDisabled,
    restrictionError,
    isChecked,
    title,
    itemIconEl,
    showTitles,
    toggleCheckbox,
    recordShiftKeyPress,
    id,
    children,
  } = props

  const checkBoxClassName = classNames(
    'uppy-u-reset',
    'uppy-ProviderBrowserItem-checkbox',
    'uppy-ProviderBrowserItem-checkbox--grid',
    { 'uppy-ProviderBrowserItem-checkbox--is-checked': isChecked },
  )

  return (
    <li
      className={className}
      title={isDisabled ? restrictionError?.message : null}
    >
      <input
        type="checkbox"
        className={checkBoxClassName}
        onChange={toggleCheckbox}
        onKeyDown={recordShiftKeyPress}
        onMouseDown={recordShiftKeyPress}
        name="listitem"
        id={id}
        checked={isChecked}
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
