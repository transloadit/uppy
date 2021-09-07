const { h } = require('preact')
const classNames = require('classnames')
const statusBarStates = require('./StatusBarStates')
const calculateProcessingProgress = require('./calculateProcessingProgress')

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

module.exports = StatusBar

function StatusBar (props) {
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
    uploadState,
    totalProgress,
    files,
    supportsUploadProgress,
    hideAfterFinish,
    isSomeGhost,
    isTargetDOMEl,
    doneButtonHandler,
    isUploadStarted,
    i18n,
    startUpload,
    uppy,
    isAllComplete,
  } = props

  let progressValue = totalProgress
  let progressMode
  let progressBarContent

  if (
    uploadState === statusBarStates.STATE_PREPROCESSING
    || uploadState === statusBarStates.STATE_POSTPROCESSING
  ) {
    const progress = calculateProcessingProgress(files)
    progressMode = progress.mode
    if (progressMode === 'determinate') {
      progressValue = progress.value * 100
    }

    progressBarContent = ProgressBarProcessing(progress)
  } else if (uploadState === statusBarStates.STATE_COMPLETE) {
    progressBarContent = ProgressBarComplete(props)
  } else if (uploadState === statusBarStates.STATE_UPLOADING) {
    if (!supportsUploadProgress) {
      progressMode = 'indeterminate'
      progressValue = null
    }

    progressBarContent = ProgressBarUploading(props)
  } else if (uploadState === statusBarStates.STATE_ERROR) {
    progressValue = undefined
    progressBarContent = ProgressBarError(props)
  }

  const width = typeof progressValue === 'number' ? progressValue : 100
  let isHidden
    = (uploadState === statusBarStates.STATE_WAITING && hideUploadButton)
    || (uploadState === statusBarStates.STATE_WAITING && !newFiles > 0)
    || (uploadState === statusBarStates.STATE_COMPLETE && hideAfterFinish)

  let showUploadBtn
    = !error
    && newFiles
    && !isUploadInProgress
    && !isAllPaused
    && allowNewUpload
    && !hideUploadButton

  if (recoveredState) {
    isHidden = false
    showUploadBtn = true
  }

  const showCancelBtn
    = !hideCancelButton
    && uploadState !== statusBarStates.STATE_WAITING
    && uploadState !== statusBarStates.STATE_COMPLETE
  const showPauseResumeBtn
    = resumableUploads
    && !hidePauseResumeButton
    && uploadState === statusBarStates.STATE_UPLOADING

  const showRetryBtn = error && !hideRetryButton

  const showDoneBtn
    = doneButtonHandler && uploadState === statusBarStates.STATE_COMPLETE

  const progressClassNames = `uppy-StatusBar-progress
                           ${progressMode ? `is-${progressMode}` : ''}`

  const statusBarClassNames = classNames(
    { 'uppy-Root': isTargetDOMEl },
    'uppy-StatusBar',
    `is-${uploadState}`,
    { 'has-ghosts': isSomeGhost }
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
        {showUploadBtn ? (
          <UploadBtn
            newFiles={newFiles}
            isUploadStarted={isUploadStarted}
            recoveredState={recoveredState}
            i18n={i18n}
            isSomeGhost={isSomeGhost}
            startUpload={startUpload}
            uploadState={uploadState}
          />
        ) : null}

        {showRetryBtn ? <RetryBtn i18n={i18n} uppy={uppy} /> : null}

        {showPauseResumeBtn ? (
          <PauseResumeButton
            isAllPaused={isAllPaused}
            i18n={i18n}
            isAllComplete={isAllComplete}
            resumableUploads={resumableUploads}
            uppy={uppy}
          />
        ) : null}

        {showCancelBtn ? <CancelBtn i18n={i18n} uppy={uppy} /> : null}

        {showDoneBtn ? <DoneBtn i18n={i18n} doneButtonHandler={doneButtonHandler} /> : null}
      </div>
    </div>
  )
}
