const html = require('yo-yo')

module.exports = (props) => {
  return html`
    <td class="BrowserTable-rowColumn BrowserTable-column">
      <img src=${props.iconLink}/> ${props.value}
    </td>
  `
}
