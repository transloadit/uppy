const html = require('yo-yo')

module.exports = (props) => {
  return html`
    <li>
      <button onclick=${props.getFolder}>${props.title}</button>
    </li>
  `
}
