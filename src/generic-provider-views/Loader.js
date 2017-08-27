// const html = require('yo-yo')

const { h } = require('picodom')
const hyperx = require('hyperx')
const html = hyperx(h, {attrToProp: false})

module.exports = (props) => {
  return html`
    <div class="UppyProvider-loading">
      <span>Loading...</span>
    </div>
  `
}
