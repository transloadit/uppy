import { h } from 'preact'
import classNames from 'classnames'
import ignoreEvent from '../utils/ignoreEvent.ts'

type $TSFixMe = any

function PickerPanelContent({
  activePickerPanel,
  className,
  hideAllPanels,
  i18n,
  state,
  uppy,
}: $TSFixMe): JSX.Element {
  return (
    <div
      className={classNames('uppy-DashboardContent-panel', className)}
      role="tabpanel"
      data-uppy-panelType="PickerPanel"
      id={`uppy-DashboardContent-panel--${activePickerPanel.id}`}
      onDragOver={ignoreEvent}
      onDragLeave={ignoreEvent}
      onDrop={ignoreEvent}
      onPaste={ignoreEvent}
    >
      <div className="uppy-DashboardContent-bar">
        <div
          className="uppy-DashboardContent-title"
          role="heading"
          aria-level="1"
        >
          {i18n('importFrom', { name: activePickerPanel.name })}
        </div>
        <button
          className="uppy-DashboardContent-back"
          type="button"
          onClick={hideAllPanels}
        >
          {i18n('cancel')}
        </button>
      </div>
      <div className="uppy-DashboardContent-panelBody">
        {uppy.getPlugin(activePickerPanel.id).render(state)}
      </div>
    </div>
  )
}

export default PickerPanelContent
