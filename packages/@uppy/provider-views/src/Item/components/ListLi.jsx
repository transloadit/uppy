import { h } from 'preact'

// if folder:
//   + checkbox (selects all files from folder)
//   + folder name (opens folder)
// if file:
//   + checkbox (selects file)
//   + file name (selects file)

function ListItem (props) {
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
      title={isDisabled ? restrictionError?.message : null}
    >
      {!isCheckboxDisabled ? (
        <input
          type="checkbox"
          className={`uppy-u-reset uppy-ProviderBrowserItem-checkbox ${isChecked ? 'uppy-ProviderBrowserItem-checkbox--is-checked' : ''}`}
          onChange={toggleCheckbox}
          onKeyDown={recordShiftKeyPress}
          // for the <label/>
          name="listitem"
          id={id}
          checked={isChecked}
          aria-label={type === 'file' ? null : i18n('allFilesFromFolderNamed', { name: title })}
          disabled={isDisabled}
          data-uppy-super-focusable
        />
      ) : null}

      {type === 'file' ? (
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
      ) : (
        // button to open a folder
        <button
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
      )}
    </li>
  )
}

export default ListItem
