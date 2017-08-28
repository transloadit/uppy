const { h } = require('preact')
const hyperx = require('hyperx')
const html = hyperx(h, {attrToProp: false})

let inputEl

module.exports = (props) => {
  return html`
    <span>
      ${props.acquirers.length === 0
        ? props.i18n('dropPaste')
        : props.i18n('dropPasteImport')
      }
      <button type="button"
              class="UppyDashboard-browse"
              onclick=${(ev) => {
                inputEl.click()
              }}>${props.i18n('browse')}</button>
      <input class="UppyDashboard-input" type="file" name="files[]" multiple="true"
             ref=${(el) => { inputEl = el }}
             onchange=${props.handleInputChange} />
    </span>
  `
}
