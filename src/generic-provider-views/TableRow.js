const html = require('yo-yo')
const cuid = require('cuid')

module.exports = (props) => {
  // const classes = props.active ? 'BrowserTable-row is-active' : 'BrowserTable-row'
  const uniqueId = cuid()

  return html`
    <tr class="BrowserTable-row">
      <td class="BrowserTable-column">
        <div class="BrowserTable-checkbox">
          <input type="checkbox"
                 role="option" 
                 tabindex="0"
                 id=${uniqueId}
                 checked=${props.isChecked}
                 disabled=${props.isDisabled}
                 onchange=${props.handleCheckboxClick} />
          <label for=${uniqueId}></label>
        </div>
        <button class="BrowserTable-item" tabindex="0" onclick=${props.handleClick}>${props.getItemIcon()} ${props.title}</button>
      </td>
    </tr>
  `
}
