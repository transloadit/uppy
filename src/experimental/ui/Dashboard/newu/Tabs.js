import html from '../../core/html'
import { localIcon } from './icons'

export default (props) => {
  const {
    acquirers,
    container,
    i18n,
    localInputChange,
    panelSelectorPrefix,
    showPanel
  } = props

  return html`
    <div class="UppyDashboardTabs">
      <h3 class="UppyDashboardTabs-title">
        ${i18n('dropPasteImport')}
      </h3>
      <nav>
        <ul class="UppyDashboardTabs-list" role="tablist">
          <li class="UppyDashboardTab">
            <button
              class="UppyDashboardTab-btn UppyDashboard-focus"
              role="tab"
              tabindex="0"
              onclick=${(ev) => {
                const input = document.querySelector(`${container} .UppyDashboard-input`)
                input.click()
              }}>
              ${localIcon()}
              <h5 class="UppyDashboardTab-name">
                ${i18n('localDisk')}
              </h5>
            </button>
            <input
              class="UppyDashboard-input"
              type="file"
              name="files[]"
              multiple="true"
              onchange=${localInputChange}/>
          </li>

          ${acquirers.map((target) => {
            return html`
              <li class="UppyDashboardTab">
                <button
                  class="UppyDashboardTab-btn"
                  role="tab"
                  tabindex="0"
                  aria-controls="${panelSelectorPrefix}--${target.id}"
                  aria-selected="${target.isHidden ? 'false' : 'true'}"
                  onclick=${() => showPanel(target.id)}>
                  ${target.icon}
                  <h5 class="UppyDashboardTab-name">
                    ${target.name}
                  </h5>
                </button>
              </li>
            `
          })}

        </ul>
      </nav>
    </div>
  `
}
