const { h } = require('preact')
const hyperx = require('hyperx')
const html = hyperx(h, {attrToProp: false})

module.exports = (props) => {
  return html`<svg aria-hidden="true" class="UppyIcon" width="100" height="100" viewBox="0 0 100 100">
    <rect x="15" y="15" width="70" height="70" />
  </svg>`
}
