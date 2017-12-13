const { h } = require('preact')
const hyperx = require('hyperx')
const html = hyperx(h)
const cuid = require('cuid')

module.exports = (props) => {
  const uniqueId = cuid()

  const stop = (ev) => {
    if (ev.keyCode === 13) {
      ev.stopPropagation()
      ev.preventDefault()
    }
  }

  const handleItemClick = (ev) => {
    // when file is clicked, select it, but when folder is clicked, open it
    if (props.type === 'folder') {
      return props.handleClick()
    }
    props.handleCheckboxClick(ev)
  }

  return html`
    <tr class="BrowserTable-row" onclick=${handleItemClick}>
      <td class="BrowserTable-column">
        <div class="BrowserTable-checkbox">
          <input type="checkbox"
                 role="option" 
                 tabindex="0"
                 aria-label="Select ${props.title}"
                 id=${uniqueId}
                 ${props.isChecked
                  ? { 'checked': true }
                 : {}}
                 ${props.isDisabled
                  ? { 'disabled': true }
                 : {}}
                 onchange=${props.handleCheckboxClick}
                 onkeyup=${stop}
                 onkeydown=${stop}
                 onkeypress=${stop} />
          <label for=${uniqueId}></label>
        </div>
        <button type="button" class="BrowserTable-item" aria-label="Select ${props.title}" tabindex="0" onclick=${handleItemClick}>
          ${props.getItemIcon()} ${props.title}
        </button>
      </td>
    </tr>
  `
}
