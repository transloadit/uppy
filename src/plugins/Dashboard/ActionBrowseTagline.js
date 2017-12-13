const { h } = require('preact')
const hyperx = require('hyperx')
const html = hyperx(h)

let inputEl

module.exports = (props) => {
  const input = html`
    <input class="UppyDashboard-input"
           hidden="true"
           aria-hidden="true" 
           tabindex="-1" 
           type="file" 
           name="files[]" 
           multiple="true"
           onchange=${props.handleInputChange} 
           ref=${(input) => {
             inputEl = input
           }} />`

  return html`
    <span>
      ${props.acquirers.length === 0
        ? props.i18n('dropPaste')
        : props.i18n('dropPasteImport')
      }
      <button type="button"
              class="UppyDashboard-browse"
              onclick=${(ev) => inputEl.click()}>${props.i18n('browse')}</button>
      ${input}
    </span>
  `
}
