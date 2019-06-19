const { h } = require('preact')

// it could be a <li><button class="fake-checkbox"/> <button/></li>
module.exports = (props) => {
  return <li class={props.className}>
    <div aria-hidden class={`uppy-ProviderBrowserItem-fakeCheckbox ${props.isChecked ? 'uppy-ProviderBrowserItem-fakeCheckbox--is-checked' : ''}`} />
    <button
      type="button"
      class="uppy-u-reset uppy-ProviderBrowserItem-inner"
      onclick={props.toggleCheckbox}

      role="option"
      aria-label={`${props.isChecked ? 'Unselect' : 'Select'} ${props.title} file`}
      aria-selected={props.isChecked}
      aria-disabled={props.isDisabled}
      data-uppy-super-focusable
    >
      {props.itemIconEl}
      {props.showTitles && props.title}
    </button>
  </li>
}
