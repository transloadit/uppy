const { h } = require('preact')
const hyperx = require('hyperx')
const html = hyperx(h, {attrToProp: false})

module.exports = (props) => {
  return html`
    <li>
      <button type="button" onclick=${props.getFolder}>${props.title}</button>
    </li>
  `
}
