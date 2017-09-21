// const html = require('yo-yo')

const { h } = require('preact')
const hyperx = require('hyperx')
const html = hyperx(h, {attrToProp: false})

const ActionBrowseTagline = require('./ActionBrowseTagline')
const { localIcon } = require('./icons')

let inputEl

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

  return html`<div class="UppyDashboardTabs">
    <nav>
      <ul class="UppyDashboardTabs-list" role="tablist">
        <li class="UppyDashboardTab">
          <button type="button" class="UppyDashboardTab-btn UppyDashboard-focus"
                  role="tab"
                  tabindex="0"
                  onclick=${(ev) => {
                    inputEl.click()
                  }}>
            ${localIcon()}
            <h5 class="UppyDashboardTab-name">${props.i18n('myDevice')}</h5>
          </button>
          <input class="UppyDashboard-input" type="file" name="files[]" multiple="true"
                 ref=${(el) => { inputEl = el }}
                 onchange=${props.handleInputChange} />
        </li>
        ${props.acquirers.map((target) => {
          return html`<li class="UppyDashboardTab">
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
    </nav>
  </div>`
}
