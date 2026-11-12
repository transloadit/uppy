import classNames from 'classnames'
import type { ComponentChildren } from 'preact'
import type { AddFilesProps } from './AddFiles.js'
import AddFiles from './AddFiles.js'

interface AddFilesPanelProps extends AddFilesProps {
  className?: string | undefined
  showAddFilesPanel: boolean
  toggleAddFilesPanel: (enabled: boolean) => void
}

const AddFilesPanel = (props: AddFilesPanelProps): ComponentChildren => {
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
      <AddFiles {...props} />
    </div>
  )
}

export default AddFilesPanel
