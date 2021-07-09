const { h } = require('preact')

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
    id,
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
      </label>
    </li>
  )
}

module.exports = GridListItem
