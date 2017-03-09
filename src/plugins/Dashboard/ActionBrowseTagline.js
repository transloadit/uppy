const html = require('yo-yo')

module.exports = (props) => {
  const input = html`
    <input class="UppyDashboard-input" type="file" name="files[]" multiple="true"
           onchange=${props.handleInputChange} />
  `

  return html`
    <span>
      ${props.acquirers.length === 0
        ? props.i18n('dropPaste')
        : props.i18n('dropPasteImport')
      }
      <button type="button"
              class="UppyDashboard-browse"
              onclick=${(ev) => {
                input.click()
              }}>${props.i18n('browse')}</button>
      ${input}
    </span>
  `
}
