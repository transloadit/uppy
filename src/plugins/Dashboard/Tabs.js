const html = require('yo-yo')
const ActionBrowseTagline = require('./ActionBrowseTagline')
const { localIcon } = require('./icons')

module.exports = (props) => {
  const isHidden = Object.keys(props.files).length === 0

  if (props.acquirers.length === 0) {
    return html`
      <div class="UppyDashboardTabs" aria-hidden="${isHidden}">
        <h3 class="UppyDashboardTabs-title">
        ${ActionBrowseTagline({
          acquirers: props.acquirers,
          handleInputChange: props.handleInputChange,
          i18n: props.i18n
        })}
        </h3>
      </div>
    `
  }

  const input = html`
    <input class="UppyDashboard-input" type="file" name="files[]" multiple="true"
           onchange=${props.handleInputChange} />
  `

  return html`<div class="UppyDashboardTabs">
    <nav>
      <ul class="UppyDashboardTabs-list" role="tablist">
        <li class="UppyDashboardTab">
          <button type="button" class="UppyDashboardTab-btn UppyDashboard-focus"
                  role="tab"
                  tabindex="0"
                  onclick=${(ev) => {
                    input.click()
                  }}>
            ${localIcon()}
            <h5 class="UppyDashboardTab-name">${props.i18n('localDisk')}</h5>
          </button>
          ${input}
        </li>
        ${props.acquirers.map((target) => {
          return html`<li class="UppyDashboardTab">
            <button class="UppyDashboardTab-btn"
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
    </nav>
  </div>`
}
