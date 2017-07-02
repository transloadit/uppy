const html = require('yo-yo')

module.exports = (props) => {
  return html`
    <li>
      <button type="button" onclick=${props.getFolder}>${props.title}</button>
    </li>
  `
}
