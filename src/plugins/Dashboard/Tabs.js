const ActionBrowseTagline = require('./ActionBrowseTagline')
const { localIcon } = require('./icons')
const { h, Component } = require('preact')
const hyperx = require('hyperx')
const html = hyperx(h)

class Tabs extends Component {
  render () {
    const isHidden = Object.keys(this.props.files).length === 0

    if (this.props.acquirers.length === 0) {
      return html`
        <div class="UppyDashboardTabs" aria-hidden="${isHidden}">
          <h3 class="UppyDashboardTabs-title">
            ${h(ActionBrowseTagline, {
              acquirers: this.props.acquirers,
              handleInputChange: this.props.handleInputChange,
              i18n: this.props.i18n
            })}
          </h3>
        </div>
      `
    }

    return html`<div class="UppyDashboardTabs">
        <ul class="UppyDashboardTabs-list" role="tablist">
          <li class="UppyDashboardTab" role="presentation">
            <button type="button" 
                    class="UppyDashboardTab-btn"
                    role="tab"
                    tabindex="0"
                    onclick=${(ev) => this.input.click()}>
              ${localIcon()}
              <h5 class="UppyDashboardTab-name">${this.props.i18n('myDevice')}</h5>
            </button>
            <input class="UppyDashboard-input"
                   hidden="true"
                   aria-hidden="true" 
                   tabindex="-1" 
                   type="file" 
                   name="files[]" 
                   multiple="true"
                   onchange=${this.props.handleInputChange} 
                   ref=${(input) => { this.input = input }} />
          </li>
          ${this.props.acquirers.map((target) => {
            return html`<li class="UppyDashboardTab" role="presentation">
              <button class="UppyDashboardTab-btn"
                      type="button"
                      role="tab"
                      tabindex="0"
                      aria-controls="UppyDashboardContent-panel--${target.id}"
                      aria-selected="${target.isHidden ? 'false' : 'true'}"
                      onclick=${() => this.props.showPanel(target.id)}>
                ${target.icon()}
                <h5 class="UppyDashboardTab-name">${target.name}</h5>
              </button>
            </li>`
          })}
        </ul>
    </div>`
  }
}

module.exports = Tabs
