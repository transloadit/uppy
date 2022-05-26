import { h } from 'preact'
import classNames from 'classnames'

function EditorPanel (props) {
  const file = props.files[props.fileCardFor]

  return (
    <div
      className={classNames('uppy-DashboardContent-panel', props.className)}
      role="tabpanel"
      data-uppy-panelType="FileEditor"
      id="uppy-DashboardContent-panel--editor"
    >
      <div className="uppy-DashboardContent-bar">
        <div className="uppy-DashboardContent-title" role="heading" aria-level="1">
          {props.i18nArray('editing', {
            file: <span className="uppy-DashboardContent-titleFile">{file.meta ? file.meta.name : file.name}</span>,
          })}
        </div>
        <button
          className="uppy-DashboardContent-back"
          type="button"
          onClick={props.hideAllPanels}
        >
          {props.i18n('cancel')}
        </button>
        <button
          className="uppy-DashboardContent-save"
          type="button"
          onClick={props.saveFileEditor}
        >
          {props.i18n('save')}
        </button>
      </div>
      <div className="uppy-DashboardContent-panelBody">
        {props.editors.map((target) => {
          return props.uppy.getPlugin(target.id).render(props.state)
        })}
      </div>
    </div>
  )
}

export default EditorPanel
