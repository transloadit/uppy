const { h } = require('preact')
const ignoreEvent = require('../utils/ignoreEvent.js')

function PanelContent (props) {
  return (
    <div class="uppy-DashboardContent-panel"
      role="tabpanel"
      data-uppy-panelType="PickerPanel"
      id={props.activePickerPanel && `uppy-DashboardContent-panel--${props.activePickerPanel.id}`}
      onDragOver={ignoreEvent}
      onDragLeave={ignoreEvent}
      onDrop={ignoreEvent}
      onPaste={ignoreEvent}>
      <div class="uppy-DashboardContent-bar">
        <div class="uppy-DashboardContent-title" role="heading" aria-level="h1">
          {props.i18n('importFrom', { name: props.activePickerPanel.name })}
        </div>
        <button class="uppy-DashboardContent-back"
          type="button"
          onclick={props.hideAllPanels}>{props.i18n('done')}</button>
      </div>
      <div class="uppy-DashboardContent-panelBody">
        {props.getPlugin(props.activePickerPanel.id).render(props.state)}
      </div>
    </div>
  )
}

module.exports = PanelContent
