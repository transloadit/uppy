const { h } = require('preact')
const classNames = require('classnames')
const statusBarStates = require('./StatusBarStates')

const {
  UploadBtn,
  RetryBtn,
  CancelBtn,
  PauseResumeButton,
  DoneBtn,
  ProgressBarProcessing,
  ProgressBarError,
  ProgressBarUploading,
  ProgressBarComplete,
} = require('./Components')

function calculateProcessingProgress (files) {
  // Collect pre or postprocessing progress states.
  const progresses = []
  Object.keys(files).forEach((fileID) => {
    const { progress } = files[fileID]
    if (progress.preprocess) {
      progresses.push(progress.preprocess)
    }
    if (progress.postprocess) {
      progresses.push(progress.postprocess)
    }
  })

  // In the future we should probably do this differently. For now we'll take the
  // mode and message from the first file…
  const { mode, message } = progresses[0]
  const value = progresses.filter(isDeterminate).reduce((total, progress, index, all) => {
    return total + progress.value / all.length
  }, 0)
  function isDeterminate (progress) {
    return progress.mode === 'determinate'
  }

  return {
    mode,
    message,
    value,
  }
}

module.exports = (props) => {
  props = props || {}

  const {
    newFiles,
    allowNewUpload,
    isUploadInProgress,
    isAllPaused,
    resumableUploads,
    error,
    hideUploadButton,
    hidePauseResumeButton,
    hideCancelButton,
    hideRetryButton,
    recoveredState,
  } = props

  const { uploadState } = props

  let progressValue = props.totalProgress
  let progressMode
  let progressBarContent

  if (uploadState === statusBarStates.STATE_PREPROCESSING || uploadState === statusBarStates.STATE_POSTPROCESSING) {
    const progress = calculateProcessingProgress(props.files)
    progressMode = progress.mode
    if (progressMode === 'determinate') {
      progressValue = progress.value * 100
    }

    progressBarContent = ProgressBarProcessing(progress)
  } else if (uploadState === statusBarStates.STATE_COMPLETE) {
    progressBarContent = ProgressBarComplete(props)
  } else if (uploadState === statusBarStates.STATE_UPLOADING) {
    if (!props.supportsUploadProgress) {
      progressMode = 'indeterminate'
      progressValue = null
    }

    progressBarContent = ProgressBarUploading(props)
  } else if (uploadState === statusBarStates.STATE_ERROR) {
    progressValue = undefined
    progressBarContent = ProgressBarError(props)
  }

  const width = typeof progressValue === 'number' ? progressValue : 100
  let isHidden = (uploadState === statusBarStates.STATE_WAITING && props.hideUploadButton)
    || (uploadState === statusBarStates.STATE_WAITING && !props.newFiles > 0)
    || (uploadState === statusBarStates.STATE_COMPLETE && props.hideAfterFinish)

  let showUploadBtn = !error && newFiles
    && !isUploadInProgress && !isAllPaused
    && allowNewUpload && !hideUploadButton

  if (recoveredState) {
    isHidden = false
    showUploadBtn = true
  }

  const showCancelBtn = !hideCancelButton
    && uploadState !== statusBarStates.STATE_WAITING
    && uploadState !== statusBarStates.STATE_COMPLETE
  const showPauseResumeBtn = resumableUploads && !hidePauseResumeButton
    && uploadState === statusBarStates.STATE_UPLOADING

  const showRetryBtn = error && !hideRetryButton

  const showDoneBtn = props.doneButtonHandler && uploadState === statusBarStates.STATE_COMPLETE

  const progressClassNames = `uppy-StatusBar-progress
                           ${progressMode ? `is-${progressMode}` : ''}`

  const statusBarClassNames = classNames(
    { 'uppy-Root': props.isTargetDOMEl },
    'uppy-StatusBar',
    `is-${uploadState}`,
    { 'has-ghosts': props.isSomeGhost }
  )

  return (
    <div className={statusBarClassNames} aria-hidden={isHidden}>
      <div
        className={progressClassNames}
        style={{ width: `${width}%` }}
        role="progressbar"
        aria-label={`${width}%`}
        aria-valuetext={`${width}%`}
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow={progressValue}
      />
      {progressBarContent}
      <div className="uppy-StatusBar-actions">
        {showUploadBtn ? <UploadBtn {...props} uploadState={uploadState} /> : null}
        {showRetryBtn ? <RetryBtn {...props} /> : null}
        {showPauseResumeBtn ? <PauseResumeButton {...props} /> : null}
        {showCancelBtn ? <CancelBtn {...props} /> : null}
        {showDoneBtn ? <DoneBtn {...props} /> : null}
      </div>
    </div>
  )
}
