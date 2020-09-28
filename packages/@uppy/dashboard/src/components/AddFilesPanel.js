const { h } = require('preact')
const classNames = require('classnames')
const AddFiles = require('./AddFiles')

const AddFilesPanel = (props) => {
  return (
    <div
      class={classNames('uppy-Dashboard-AddFilesPanel', props.className)}
      data-uppy-panelType="AddFiles"
      aria-hidden={props.showAddFilesPanel}
    >
      <div class="uppy-DashboardContent-bar">
        <div class="uppy-DashboardContent-title" role="heading" aria-level="1">
          {props.i18n('addingMoreFiles')}
        </div>
        <button
          class="uppy-DashboardContent-back"
          type="button"
          onclick={(ev) => props.toggleAddFilesPanel(false)}
        >{props.i18n('back')}
        </button>
      </div>
      <AddFiles {...props} />
    </div>
  )
}

module.exports = AddFilesPanel
