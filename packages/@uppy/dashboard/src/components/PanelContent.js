const { h } = require('preact')
const ignoreEvent = require('../utils/ignoreEvent.js')

function PanelContent (props) {
  return (
    <div class="uppy-DashboardContent-panel"
      role="tabpanel"
      id={props.activePanel && `uppy-DashboardContent-panel--${props.activePanel.id}`}
      onDragOver={ignoreEvent}
      onDragLeave={ignoreEvent}
      onDrop={ignoreEvent}
      onPaste={ignoreEvent}>
      <div class="uppy-DashboardContent-bar">
        <div class="uppy-DashboardContent-title" role="heading" aria-level="h1">
          {props.i18n('importFrom', { name: props.activePanel.name })}
        </div>
        <button class="uppy-DashboardContent-back"
          type="button"
          onclick={props.hideAllPanels}>{props.i18n('done')}</button>
      </div>
      <div class="uppy-DashboardContent-panelBody">
        {props.getPlugin(props.activePanel.id).render(props.state)}
      </div>
    </div>
  )
}

module.exports = PanelContent
