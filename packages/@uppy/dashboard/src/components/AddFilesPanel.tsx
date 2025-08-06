import classNames from 'classnames'
import { h } from 'preact'
import AddFiles from './AddFiles.js'

type $TSFixMe = any

const AddFilesPanel = (props: $TSFixMe): $TSFixMe => {
  return (
    <div
      className={classNames('uppy-Dashboard-AddFilesPanel', props.className)}
      data-uppy-panelType="AddFiles"
      aria-hidden={!props.showAddFilesPanel}
    >
      <div className="uppy-DashboardContent-bar">
        <div
          className="uppy-DashboardContent-title"
          // biome-ignore lint/a11y/useSemanticElements: ...
          role="heading"
          aria-level={1}
        >
          {props.i18n('addingMoreFiles')}
        </div>
        <button
          className="uppy-DashboardContent-back"
          type="button"
          onClick={() => props.toggleAddFilesPanel(false)}
        >
          {props.i18n('back')}
        </button>
      </div>
      {}
      <AddFiles {...props} />
    </div>
  )
}

export default AddFilesPanel
