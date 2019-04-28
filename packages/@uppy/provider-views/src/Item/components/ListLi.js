const { h } = require('preact')

// if folder:
//   + checkbox (selects all files from folder)
//   + folder name (opens folder)
// if file:
//   + checkbox (selects file)
//   + file name (selects file)
module.exports = (props) => {
  return <li class={props.className}>
    <button
      type="button"
      class={`uppy-u-reset uppy-ProviderBrowserItem-fakeCheckbox ${props.isChecked ? 'uppy-ProviderBrowserItem-fakeCheckbox--is-checked' : ''}`}
      onClick={props.toggleCheckbox}

      // for the <label/>
      id={props.id}
      role="option"
      aria-label={
        props.type === 'folder'
        ? `${props.isChecked ? 'Unselect' : 'Select'} all files from ${props.title} folder`
        : `${props.isChecked ? 'Unselect' : 'Select'} ${props.title} file`
      }
      aria-selected={props.isChecked}
      aria-disabled={props.isDisabled}
      data-uppy-super-focusable
    />

    {
      props.type === 'file'
        // label for a checkbox
        ? <label for={props.id} className="uppy-u-reset uppy-ProviderBrowserItem-inner">
          {props.itemIconEl}
          {props.showTitles && props.title}
        </label>
        // button to open a folder
        : <button
          type="button"
          class="uppy-u-reset uppy-ProviderBrowserItem-inner"
          onclick={props.handleFolderClick}
          aria-label={`Open ${props.title} folder`}
        >
          {props.itemIconEl}
          {props.showTitles && props.title}
        </button>
    }
  </li>
}
