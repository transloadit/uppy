const { h } = require('preact')

function EditorPanel (props) {
  return (
    <div
      class="uppy-DashboardContent-panel"
      role="tabpanel"
      data-uppy-panelType="PickerPanel"
      id="uppy-DashboardContent-panel--editor"
    >
      <div class="uppy-DashboardContent-bar">
        <div class="uppy-DashboardContent-title" role="heading" aria-level="1">
          123
        </div>
        <button
          class="uppy-DashboardContent-back"
          type="button"
          onclick={props.hideAllPanels}
        >{props.i18n('done')}
        </button>
      </div>
      <div class="uppy-DashboardContent-panelBody">
        {props.editors.map((target) => {
          return props.getPlugin(target.id).render(props.state)
        })}
      </div>
    </div>
  )
}

module.exports = EditorPanel
