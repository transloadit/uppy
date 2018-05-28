const { h } = require('preact')

module.exports = (props) => {
  const stop = (ev) => {
    if (ev.keyCode === 13) {
      ev.stopPropagation()
      ev.preventDefault()
    }
  }

  const handleItemClick = (ev) => {
    ev.preventDefault()
    // when file is clicked, select it, but when folder is clicked, open it
    if (props.type === 'folder') {
      return props.handleClick(ev)
    }
    props.handleCheckboxClick(ev)
  }

  return (
    <li class={'uppy-ProviderBrowserItem' + (props.isChecked ? ' uppy-ProviderBrowserItem--selected' : '')}>
      <div class="uppy-ProviderBrowserItem-checkbox">
        <input type="checkbox"
          role="option"
          tabindex={0}
          aria-label={`Select ${props.title}`}
          id={props.id}
          checked={props.isChecked}
          disabled={props.isDisabled}
          onchange={props.handleCheckboxClick}
          onkeyup={stop}
          onkeydown={stop}
          onkeypress={stop} />
        <label
          for={props.id}
          onclick={props.handleCheckboxClick}
         />
      </div>
      <button type="button"
        class="uppy-ProviderBrowserItem-inner"
        aria-label={`Select ${props.title}`}
        tabindex={0}
        onclick={handleItemClick}>
        {props.getItemIcon()} {props.showTitles && props.title}
      </button>
    </li>
  )
}
