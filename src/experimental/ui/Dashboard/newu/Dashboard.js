import html from '../../../../core/html'
import cx from 'classnames'
import Tabs from './Tabs'
import FileCard from './FileCard'
import { closeIcon } from './icons'

export default (props) => {
  const {
    container,
    hideModal,
    i18n,
    inline,
    onPaste,
    panelSelectorPrefix,
    showPanel
  } = props

  const getActivePanel = (key) => {
    switch (key) {
      case 0:
        return FileCard(props)
      case 1:
        return FileList(props)
      default:
        return props.panels[key](props)
    }
  }

  // temporary to pass linting
  const state = {}
  const modal = false
  const localInputChange = false
  const acquirers = []
  const progressindicators = []

  const dashboardClasses = cx({
    'Uppy': true,
    'UppyDashboard': true,
    'UppyTheme--default': true,
    // 'Uppy--isTouchDevice': isTouchDevice(),
    'UppyDashboard--modal': !inline
  })

  return html`
    <div class=${dashboardClasses}
      aria-hidden="${inline ? 'false' : modal.isHidden}"
      aria-label="${!inline ? i18n('dashboardWindowTitle') : i18n('dashboardTitle')}"
      role="dialog"
      onpaste=${onPaste}>

      <div class="UppyDashboard-overlay" onclick=${hideModal}>
      </div>

      <button class="UppyDashboard-close"
              aria-label="${i18n('closeModal')}"
              title="${i18n('closeModal')}"
              onclick=${hideModal}>
        ${closeIcon()}
      </button>

      <div class="UppyDashboard-inner" tabindex="0">
        <div class="UppyDashboard-innerWrap">

          ${Tabs({
            localInputChange: localInputChange,
            acquirers: acquirers,
            container: container,
            panelSelectorPrefix: panelSelectorPrefix,
            showPanel: showPanel,
            i18n: i18n
          })}

          ${getActivePanel(props.activePanel)}

          <div class="UppyDashboard-progressindicators">
            ${progressindicators.map((target) => {
              return target.render(state)
            })}
          </div>
        </div>
      </div>
    </div>
  `
}
