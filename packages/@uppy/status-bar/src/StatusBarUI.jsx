import { h } from 'preact'
import classNames from 'classnames'
import statusBarStates from './StatusBarStates.js'
import calculateProcessingProgress from './calculateProcessingProgress.js'

import {
  UploadBtn,
  RetryBtn,
  CancelBtn,
  PauseResumeButton,
  DoneBtn,
  ProgressBarProcessing,
  ProgressBarError,
  ProgressBarUploading,
  ProgressBarComplete,
} from './Components.jsx'

const {
  STATE_ERROR,
  STATE_WAITING,
  STATE_PREPROCESSING,
  STATE_UPLOADING,
  STATE_POSTPROCESSING,
  STATE_COMPLETE,
} = statusBarStates

// TODO: rename the function to StatusBarUI on the next major.
export default function StatusBar (props) {
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

  function getProgressValue () {
    switch (uploadState) {
      case STATE_POSTPROCESSING:
      case STATE_PREPROCESSING: {
        const progress = calculateProcessingProgress(files)

        if (progress.mode === 'determinate') {
          return progress.value * 100
        }
        return totalProgress
      }
      case STATE_ERROR: {
        return null
      }
      case STATE_UPLOADING: {
        if (!supportsUploadProgress) {
          return null
        }
        return totalProgress
      }
      default:
        return totalProgress
    }
  }

  function getIsIndeterminate () {
    switch (uploadState) {
      case STATE_POSTPROCESSING:
      case STATE_PREPROCESSING: {
        const { mode } = calculateProcessingProgress(files)
        return mode === 'indeterminate'
      }
      case STATE_UPLOADING: {
        if (!supportsUploadProgress) {
          return true
        }
        return false
      }
      default:
        return false
    }
  }

  function getIsHidden () {
    if (recoveredState) {
      return false
    }

    switch (uploadState) {
      case STATE_WAITING:
        return hideUploadButton || newFiles === 0
      case STATE_COMPLETE:
        return hideAfterFinish
      default:
        return false
    }
  }

  const progressValue = getProgressValue()

  const isHidden = getIsHidden()

  const width = progressValue ?? 100

  const showUploadBtn = !error
    && newFiles
    && !isUploadInProgress
    && !isAllPaused
    && allowNewUpload
    && !hideUploadButton

  const showCancelBtn = !hideCancelButton
    && uploadState !== STATE_WAITING
    && uploadState !== STATE_COMPLETE

  const showPauseResumeBtn = resumableUploads
    && !hidePauseResumeButton
    && uploadState === STATE_UPLOADING

  const showRetryBtn = error && !isAllComplete && !hideRetryButton

  const showDoneBtn = doneButtonHandler && uploadState === STATE_COMPLETE

  const progressClassNames = classNames('uppy-StatusBar-progress', {
    'is-indeterminate': getIsIndeterminate(),
  })

  const statusBarClassNames = classNames(
    'uppy-StatusBar',
    `is-${uploadState}`,
    { 'has-ghosts': isSomeGhost },
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
            return (
              <ProgressBarError
                error={error}
                i18n={i18n}
                numUploads={numUploads}
                complete={complete}
              />
            )
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
        {recoveredState || showUploadBtn ? (
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
