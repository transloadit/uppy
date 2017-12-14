const ActionBrowseTagline = require('./ActionBrowseTagline')
const { localIcon } = require('./icons')
const { h } = require('preact')
const hyperx = require('hyperx')
const html = hyperx(h)

let inputEl

module.exports = (props) => {
  const isHidden = Object.keys(props.files).length === 0

  if (props.acquirers.length === 0) {
    return html`
      <div class="UppyDashboardTabs" aria-hidden="${isHidden}">
        <h3 class="UppyDashboardTabs-title">
          ${h(ActionBrowseTagline, {
            acquirers: props.acquirers,
            handleInputChange: props.handleInputChange,
            i18n: props.i18n
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
                  onclick=${ev => inputEl.click()}>
            ${localIcon()}
            <h5 class="UppyDashboardTab-name">${props.i18n('myDevice')}</h5>
          </button>
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
                 }} />
        </li>
        ${props.acquirers.map((target) => {
          return html`<li class="UppyDashboardTab" role="presentation">
            <button class="UppyDashboardTab-btn"
                    type="button"
                    role="tab"
                    tabindex="0"
                    aria-controls="UppyDashboardContent-panel--${target.id}"
                    aria-selected="${target.isHidden ? 'false' : 'true'}"
                    onclick=${() => props.showPanel(target.id)}>
              ${target.icon()}
              <h5 class="UppyDashboardTab-name">${target.name}</h5>
            </button>
          </li>`
        })}
      </ul>
  </div>`
}
