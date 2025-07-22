import {  h, Component  } from 'preact'
import classNames from 'classnames'
import shallowEqual from 'is-shallow-equal'
import FilePreviewAndLink from './FilePreviewAndLink/index.jsx'
import FileProgress from './FileProgress/index.jsx'
import FileInfo from './FileInfo/index.jsx'
import Buttons from './Buttons/index.jsx'

export const SpeakerCountOptions = [
  { value: 'auto', label: 'Auto' },
  { value: '1', label: '1' },
  { value: '2', label: '2' },
  { value: '3', label: '3' },
  { value: '4', label: '4' },
  { value: '5', label: '5' },
  { value: '6', label: '6' },
  { value: '7', label: '7' },
  { value: '8', label: '8' },
  { value: '9', label: '9' }
];

export default class FileItem extends Component {
  constructor(props) {
    super(props)
    this.state = {
      speakers: 1
    }
  }

  componentDidMount () {
    const { file } = this.props
    if (!file.preview) {
      this.props.handleRequestThumbnail(file)
    }
  }

  shouldComponentUpdate (nextProps) {
    return !shallowEqual(this.props, nextProps)
  }

  // VirtualList mounts FileItems again and they emit `thumbnail:request`
  // Otherwise thumbnails are broken or missing after Golden Retriever restores files
  componentDidUpdate () {
    const { file } = this.props
    if (!file.preview) {
      this.props.handleRequestThumbnail(file)
    }
  }

  componentWillUnmount () {
    const { file } = this.props
    if (!file.preview) {
      this.props.handleCancelThumbnail(file)
    }
  }

  setSpeakers = (event) => {
    this.setState({
      speakers: event.target.value
    });
    var file = this.props.file;
    if (file && file.id) {
      this.props.uppy.setFileMeta(file.id, {
        speakerCount: event.target.value
      });
    }
  }

  render () {
    const { file } = this.props

    const isProcessing = file.progress.preprocess || file.progress.postprocess
    const isUploaded = file.progress.uploadComplete && !isProcessing && !file.error
    const uploadInProgressOrComplete = file.progress.uploadStarted || isProcessing
    const uploadInProgress = (file.progress.uploadStarted && !file.progress.uploadComplete) || isProcessing
    const error = file.error || false

    // File that Golden Retriever was able to partly restore (only meta, not blob),
    // users still need to re-add it, so it’s a ghost
    const { isGhost } = file

    let showRemoveButton = this.props.individualCancellation
      ? !isUploaded
      : !uploadInProgress && !isUploaded

    if (isUploaded && this.props.showRemoveButtonAfterComplete) {
      showRemoveButton = true
    }

    const dashboardItemClass = classNames({
      'uppy-Dashboard-Item': true,
      'is-inprogress': uploadInProgress && !this.props.recoveredState,
      'is-processing': isProcessing,
      'is-complete': isUploaded,
      'is-error': !!error,
      'is-resumable': this.props.resumableUploads,
      'is-noIndividualCancellation': !this.props.individualCancellation,
      'is-ghost': isGhost,
    })

    return (
      <div
        className={dashboardItemClass}
        id={`uppy_${file.id}`}
        role={this.props.role}
      >
        <div className="uppy-Dashboard-Item-preview">
          <FilePreviewAndLink
            file={file}
            showLinkToFileUploadResult={this.props.showLinkToFileUploadResult}
            i18n={this.props.i18n}
            toggleFileCard={this.props.toggleFileCard}
            metaFields={this.props.metaFields}
          />
          <FileProgress
            uppy={this.props.uppy}
            file={file}
            error={error}
            isUploaded={isUploaded}
            hideRetryButton={this.props.hideRetryButton}
            hideCancelButton={this.props.hideCancelButton}
            hidePauseResumeButton={this.props.hidePauseResumeButton}
            recoveredState={this.props.recoveredState}
            showRemoveButtonAfterComplete={this.props.showRemoveButtonAfterComplete}
            resumableUploads={this.props.resumableUploads}
            individualCancellation={this.props.individualCancellation}
            i18n={this.props.i18n}
          />
        </div>

        <div className="uppy-Dashboard-Item-fileInfoAndButtons">
          <FileInfo
            file={file}
            id={this.props.id}
            acquirers={this.props.acquirers}
            containerWidth={this.props.containerWidth}
            containerHeight={this.props.containerHeight}
            i18n={this.props.i18n}
            toggleAddFilesPanel={this.props.toggleAddFilesPanel}
            toggleFileCard={this.props.toggleFileCard}
            metaFields={this.props.metaFields}
            isSingleFile={this.props.isSingleFile}
          />
          <Buttons
            file={file}
            metaFields={this.props.metaFields}
            showLinkToFileUploadResult={this.props.showLinkToFileUploadResult}
            showRemoveButton={showRemoveButton}
            canEditFile={this.props.canEditFile}
            uploadInProgressOrComplete={uploadInProgressOrComplete}
            toggleFileCard={this.props.toggleFileCard}
            openFileEditor={this.props.openFileEditor}
            uppy={this.props.uppy}
            i18n={this.props.i18n}
          />
          <div class="uppy-DropDown-SpeakerCount">
            <select class="uppy-Dropdown-SpeakerCount-Select" value={this.state.speakers} onChange={this.setSpeakers}>
             {
              SpeakerCountOptions.map((option) => {
                return (
                  <option value={option.value} key={option.value} id={`uppy_speakerCount_${option.value}`}>
                    {option.label}
                  </option>
                )
              })
             }
            </select>
          </div>
        </div>
      </div>
    )
  }
}
