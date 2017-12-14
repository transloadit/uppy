const { h, Component } = require('preact')
const hyperx = require('hyperx')
const html = hyperx(h)

class ActionBrowseTagline extends Component {
  render () {
    return html`
      <span>
        ${this.props.acquirers.length === 0
          ? this.props.i18n('dropPaste')
          : this.props.i18n('dropPasteImport')
        }
        <button type="button"
                class="UppyDashboard-browse"
                onclick=${(ev) => this.input.click()}>
          ${this.props.i18n('browse')}
        </button>
        <input class="UppyDashboard-input"
               hidden="true"
               aria-hidden="true"
               tabindex="-1" 
               type="file"
               name="files[]"
               multiple="true"
               onchange=${this.props.handleInputChange}
               ref=${(input) => {
                 this.input = input
               }} />
      </span>
    `
  }
}

module.exports = ActionBrowseTagline
