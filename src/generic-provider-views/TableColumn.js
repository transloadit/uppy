const html = require('yo-yo')

module.exports = (props) => {
  return html`
    <td class="BrowserTable-rowColumn BrowserTable-column">
      ${props.getItemIcon()} ${props.value}
    </td>
  `
}
