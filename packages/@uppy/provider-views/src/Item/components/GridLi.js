const { h } = require('preact')

// it could be a <li><button class="fake-checkbox"/> <button/></li>
module.exports = (props) => {
  return (
    <li class={props.className} title={props.isDisabled ? props.restrictionReason : null}>
      <div aria-hidden class={`uppy-ProviderBrowserItem-fakeCheckbox ${props.isChecked ? 'uppy-ProviderBrowserItem-fakeCheckbox--is-checked' : ''}`} />
      <button
        type="button"
        class="uppy-u-reset uppy-ProviderBrowserItem-inner"
        onclick={props.toggleCheckbox}
        role="option"
        aria-label={props.isChecked ? props.i18n('unselectFileNamed', { name: props.title }) : props.i18n('selectFileNamed', { name: props.title })}
        aria-selected={props.isChecked}
        aria-disabled={props.isDisabled}
        disabled={props.isDisabled}
        data-uppy-super-focusable
      >
        {props.itemIconEl}
        {props.showTitles && props.title}
      </button>
    </li>
  )
}
