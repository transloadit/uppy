import html from '../../../../core/html'

const ContentPanel = (props) => {
  const {
    i18n,
    hideAllPanels,
    target
  } = props

  return html`
    <div class="UppyDashboardContent-panel"
         role="tabpanel">
      <div class="UppyDashboardContent-bar">
        <button
          class="UppyDashboardContent-back"
          onclick=${hideAllPanels}>${i18n('done')}</button>
      </div>
      ${target(props)}
    </div>
  `
}

export default ContentPanel
