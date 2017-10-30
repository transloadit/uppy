// const html = require('yo-yo')

const { h } = require('picodom')
const hyperx = require('hyperx')
const html = hyperx(h, {attrToProp: false})

module.exports = (props) => {
  return html`
    <td class="BrowserTable-rowColumn BrowserTable-column">
      ${props.getItemIcon()} ${props.value}
    </td>
  `
}
