import { h } from 'preact'

function GridListItem (props) {
  const {
    className,
    isDisabled,
    restrictionReason,
    isChecked,
    title,
    itemIconEl,
    showTitles,
    toggleCheckbox,
    recordShiftKeyPress,
    id,
    children,
  } = props

  return (
    <li
      className={className}
      title={isDisabled ? restrictionReason : null}
    >
      <input
        type="checkbox"
        className={`uppy-u-reset uppy-ProviderBrowserItem-checkbox ${
          isChecked ? 'uppy-ProviderBrowserItem-checkbox--is-checked' : ''
        } uppy-ProviderBrowserItem-checkbox--grid`}
        onChange={toggleCheckbox}
        onKeyDown={recordShiftKeyPress}
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
        <span className="uppy-ProviderBrowserItem-inner-relative">
          {itemIconEl}

          {showTitles && title}

          {children}
        </span>
      </label>
    </li>
  )
}

export default GridListItem
