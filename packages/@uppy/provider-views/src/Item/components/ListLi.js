const { h } = require('preact')

const getAriaLabelOfCheckbox = (props) => {
  if (props.type === 'folder') {
    if (props.isChecked) {
      return props.i18n('unselectAllFilesFromFolderNamed', { name: props.title })
    }
    return props.i18n('selectAllFilesFromFolderNamed', { name: props.title })
  }
  if (props.isChecked) {
    return props.i18n('unselectFileNamed', { name: props.title })
  }
  return props.i18n('selectFileNamed', { name: props.title })
}

// if folder:
//   + checkbox (selects all files from folder)
//   + folder name (opens folder)
// if file:
//   + checkbox (selects file)
//   + file name (selects file)
module.exports = (props) => {
  return (
    <li className={props.className} title={props.isDisabled ? props.restrictionReason : null}>
      {!props.isCheckboxDisabled ? (
        <button
          type="button"
          className={`uppy-u-reset uppy-ProviderBrowserItem-fakeCheckbox ${props.isChecked ? 'uppy-ProviderBrowserItem-fakeCheckbox--is-checked' : ''}`}
          onClick={props.toggleCheckbox}
          // for the <label/>
          id={props.id}
          role="option"
          aria-label={getAriaLabelOfCheckbox(props)}
          aria-selected={props.isChecked}
          aria-disabled={props.isDisabled}
          disabled={props.isDisabled}
          data-uppy-super-focusable
        />
      ) : null}

      {props.type === 'file' ? (
        // label for a checkbox
        <label htmlFor={props.id} className="uppy-u-reset uppy-ProviderBrowserItem-inner">
          <div className="uppy-ProviderBrowserItem-iconWrap">
            {props.itemIconEl}
          </div>
          {props.showTitles && props.title}
        </label>
      ) : (
        // button to open a folder
        <button
          type="button"
          className="uppy-u-reset uppy-ProviderBrowserItem-inner"
          onClick={props.handleFolderClick}
          aria-label={props.i18n('openFolderNamed', { name: props.title })}
        >
          <div className="uppy-ProviderBrowserItem-iconWrap">
            {props.itemIconEl}
          </div>
          {props.showTitles && <span>{props.title}</span>}
        </button>
      )}
    </li>
  )
}
