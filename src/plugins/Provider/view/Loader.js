const { h } = require('preact')
const hyperx = require('hyperx')
const html = hyperx(h)

module.exports = (props) => {
  return html`
    <div class="UppyProvider-loading">
      <span>Loading...</span>
    </div>
  `
}
