/* eslint-disable react/destructuring-assignment */
import { h } from 'preact'
import classNames from 'classnames'
import AddFiles from './AddFiles.tsx'

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
          role="heading"
          aria-level="1"
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
      {/* eslint-disable-next-line react/jsx-props-no-spreading */}
      <AddFiles {...props} />
    </div>
  )
}

export default AddFilesPanel
