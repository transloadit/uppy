const html = require('yo-yo')
const Column = require('./TableColumn')

module.exports = (props) => {
  const classes = props.active ? 'BrowserTable-row is-active' : 'BrowserTable-row'
  return html`
    <tr onclick=${props.handleClick} class=${classes}>
      <td onclick=${props.handleCheckboxClick} class="BrowserTable-column">
        <input type="checkbox" checked=${props.isChecked} />
      </td>
      ${Column({
        getItemIcon: props.getItemIcon,
        value: props.title
      })}
    </tr>
  `
}
