const html = require('yo-yo')

module.exports = (props) => {
  return html`
    <li>
      <button onclick=${props.getNextFolder}>${props.title}</button>
    </li>
  `
}
