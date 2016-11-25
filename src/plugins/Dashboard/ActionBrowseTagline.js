import html from '../../core/html'

export default (props) => {
  return html`
    <span>
      ${props.acquirers.length === 0
        ? props.i18n('dropPaste')
        : props.i18n('dropPasteImport')
      }
      <button type="button"
              class="UppyDashboard-browse"
              onclick=${(ev) => {
                const input = document.querySelector(`${props.container} .UppyDashboard-input`)
                input.click()
              }}>${props.i18n('browse')}</button>
      <input class="UppyDashboard-input" type="file" name="files[]" multiple="true"
             onchange=${props.handleInputChange} />
    </span>
  `
}
