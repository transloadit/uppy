const html = require('yo-yo')

module.exports = (props) => {
  return html`
    <div class="UppyProvider-error">
      <span>
        Something went wrong.  Probably our fault. ${props.error}
      </span>
    </div>
  `
}
