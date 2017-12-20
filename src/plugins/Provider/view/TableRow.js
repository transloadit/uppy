const cuid = require('cuid')
const { h } = require('preact')

module.exports = (props) => {
  const uniqueId = cuid()

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
    <tr class="uppy-ProviderBrowserTable-row">
      <td class="uppy-ProviderBrowserTable-column">
        <div class="uppy-ProviderBrowserTable-checkbox">
          <input type="checkbox"
            role="option"
            tabindex="0"
            aria-label={`Select ${props.title}`}
            id={uniqueId}
            checked={props.isChecked}
            disabled={props.isDisabled}
            onchange={props.handleCheckboxClick}
            onkeyup={stop}
            onkeydown={stop}
            onkeypress={stop} />
          <label for={uniqueId} onclick={handleItemClick} />
        </div>
        <button type="button" class="uppy-ProviderBrowserTable-item" aria-label={`Select ${props.title}`} tabindex="0" onclick={handleItemClick}>
          {props.getItemIcon()} {props.title}
        </button>
      </td>
    </tr>
  )
}
