const { h } = require('preact')
const classNames = require('classnames')
const AddFiles = require('./AddFiles')

const AddFilesPanel = (props) => {
  return (
    <div
      className={classNames('uppy-Dashboard-AddFilesPanel', props.className)}
      data-uppy-panelType="AddFiles"
      aria-hidden={props.showAddFilesPanel}
    >
      <div className="uppy-DashboardContent-bar">
        <div className="uppy-DashboardContent-title" role="heading" aria-level="1">
          {props.i18n('addingMoreFiles')}
        </div>
        <button
          className="uppy-DashboardContent-back"
          type="button"
          onClick={(ev) => props.toggleAddFilesPanel(false)}
        >
          {props.i18n('back')}
        </button>
      </div>
      <AddFiles {...props} />
    </div>
  )
}

module.exports = AddFilesPanel
