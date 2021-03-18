const { h } = require('preact')
const classNames = require('classnames')
const ignoreEvent = require('../utils/ignoreEvent.js')

function PickerPanelContent (props) {
  return (
    <div
      className={classNames('uppy-DashboardContent-panel', props.className)}
      role="tabpanel"
      data-uppy-panelType="PickerPanel"
      id={`uppy-DashboardContent-panel--${props.activePickerPanel.id}`}
      onDragOver={ignoreEvent}
      onDragLeave={ignoreEvent}
      onDrop={ignoreEvent}
      onPaste={ignoreEvent}
    >
      <div className="uppy-DashboardContent-bar">
        <div className="uppy-DashboardContent-title" role="heading" aria-level="1">
          {props.i18n('importFrom', { name: props.activePickerPanel.name })}
        </div>
        <button
          className="uppy-DashboardContent-back"
          type="button"
          onClick={props.hideAllPanels}
        >
          {props.i18n('done')}
        </button>
      </div>
      <div className="uppy-DashboardContent-panelBody">
        {props.getPlugin(props.activePickerPanel.id).render(props.state)}
      </div>
    </div>
  )
}

module.exports = PickerPanelContent
