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

const {
  STATE_ERROR,
  STATE_WAITING,
  STATE_PREPROCESSING,
  STATE_UPLOADING,
  STATE_POSTPROCESSING,
  STATE_COMPLETE,
} = statusBarStates

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
    showProgressDetails,
    numUploads,
    complete,
    totalSize,
    totalETA,
    totalUploadedSize,
  } = props

  let progressValue = totalProgress
  let progressMode

  if (
    uploadState === STATE_PREPROCESSING
    || uploadState === STATE_POSTPROCESSING
  ) {
    const progress = calculateProcessingProgress(files)
    progressMode = progress.mode
    if (progressMode === 'determinate') {
      progressValue = progress.value * 100
    }
  } else if (uploadState === STATE_UPLOADING) {
    if (!supportsUploadProgress) {
      progressMode = 'indeterminate'
      progressValue = null
    }
  } else if (uploadState === STATE_ERROR) {
    progressValue = undefined
  }

  const width = typeof progressValue === 'number' ? progressValue : 100
  let isHidden
    = (uploadState === STATE_WAITING && hideUploadButton)
    || (uploadState === STATE_WAITING && !newFiles > 0)
    || (uploadState === STATE_COMPLETE && hideAfterFinish)

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
    && uploadState !== STATE_WAITING
    && uploadState !== STATE_COMPLETE
  const showPauseResumeBtn
    = resumableUploads
    && !hidePauseResumeButton
    && uploadState === STATE_UPLOADING

  const showRetryBtn = error && !hideRetryButton

  const showDoneBtn
    = doneButtonHandler && uploadState === STATE_COMPLETE

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

      {(() => {
        switch (uploadState) {
          case STATE_PREPROCESSING:
          case STATE_POSTPROCESSING:
            return <ProgressBarProcessing progress={calculateProcessingProgress(files)} />
          case STATE_COMPLETE:
            return <ProgressBarComplete i18n={i18n} />
          case STATE_ERROR:
            return <ProgressBarError error={error} i18n={i18n} />
          case STATE_UPLOADING:
            return (
              <ProgressBarUploading
                i18n={i18n}
                supportsUploadProgress={supportsUploadProgress}
                totalProgress={totalProgress}
                showProgressDetails={showProgressDetails}
                isUploadStarted={isUploadStarted}
                isAllComplete={isAllComplete}
                isAllPaused={isAllPaused}
                newFiles={newFiles}
                numUploads={numUploads}
                complete={complete}
                totalUploadedSize={totalUploadedSize}
                totalSize={totalSize}
                totalETA={totalETA}
                startUpload={startUpload}
              />
            )
          default:
            return null
        }
      })()}

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

        {showDoneBtn ? (
          <DoneBtn i18n={i18n} doneButtonHandler={doneButtonHandler} />
        ) : null}
      </div>
    </div>
  )
}
