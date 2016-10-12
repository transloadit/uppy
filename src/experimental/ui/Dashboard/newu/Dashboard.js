import html from '../../../../core/html'
import cx from 'classnames'
import Tabs from './Tabs'
import FileCard from './FileCard'

export default (props) => {
  const {
    container,
    hideAllPanels,
    hideModal,
    i18n,
    inline,
    log,
    onPaste,
    panelSelectorPrefix,
    pauseAll,
    resumeAll,
    showPanel,
    showProgressDetails,
    removeFile,
    pauseUpload,
    startUpload
  } = props

  // temporary to pass linting
  const state = {}
  const modal = false
  const closeIcon = false
  const localInputChange = false
  const acquirers = []
  const files = []
  const fileCardDone = false
  const showFileCard = false
  const totalProgress = 0
  const info = ''
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

      <div class="UppyDashboard-overlay"
           onclick=${hideModal}>
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

          ${FileCard({
            files: files,
            fileCardFor: modal.fileCardFor,
            done: fileCardDone,
            metaFields: state.metaFields,
            log: log,
            i18n: i18n
          })}

          ${FileList({
            files: files,
            showFileCard: showFileCard,
            showProgressDetails: showProgressDetails,
            totalProgress: totalProgress,
            info: info,
            i18n: i18n,
            log: log,
            removeFile: removeFile,
            pauseAll: pauseAll,
            resumeAll: resumeAll,
            pauseUpload: pauseUpload,
            startUpload: startUpload
          })}

          ${acquirers.map((target) => {
            return html`
              <div class="UppyDashboardContent-panel"
                   id="${panelSelectorPrefix}--${target.id}"
                   role="tabpanel"
                   aria-hidden="${target.isHidden}">
                <div class="UppyDashboardContent-bar">
                  <h2 class="UppyDashboardContent-title">${i18n('importFrom')} ${target.name}</h2>
                  <button
                    class="UppyDashboardContent-back"
                    onclick=${hideAllPanels}>${i18n('done')}</button>
                </div>
                ${target.render(state)}
              </div>
            `
          })}

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
