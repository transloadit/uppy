import type { Body, Meta, State, Uppy, UppyFile } from '@uppy/core'
import type { I18n } from '@uppy/utils/lib/Translator'
import classNames from 'classnames'
import { h } from 'preact'
import {
  CancelBtn,
  DoneBtn,
  PauseResumeButton,
  ProgressBarComplete,
  ProgressBarError,
  ProgressBarProcessing,
  ProgressBarUploading,
  RetryBtn,
  UploadBtn,
} from './Components.js'
import calculateProcessingProgress from './calculateProcessingProgress.js'
import statusBarStates from './StatusBarStates.js'

const {
  STATE_ERROR,
  STATE_WAITING,
  STATE_PREPROCESSING,
  STATE_UPLOADING,
  STATE_POSTPROCESSING,
  STATE_COMPLETE,
} = statusBarStates

export interface StatusBarUIProps<M extends Meta, B extends Body> {
  newFiles: number
  allowNewUpload: boolean
  isUploadInProgress: boolean
  isAllPaused: boolean
  resumableUploads: boolean
  error: any
  hideUploadButton?: boolean
  hidePauseResumeButton?: boolean
  hideCancelButton?: boolean
  hideRetryButton?: boolean
  recoveredState: State<M, B>['recoveredState']
  uploadState: (typeof statusBarStates)[keyof typeof statusBarStates]
  totalProgress: number
  files: Record<string, UppyFile<M, B>>
  supportsUploadProgress: boolean
  hideAfterFinish?: boolean
  isSomeGhost: boolean
  doneButtonHandler?: (() => void) | null
  isUploadStarted: boolean
  i18n: I18n
  startUpload: () => void
  uppy: Uppy<M, B>
  isAllComplete: boolean
  showProgressDetails?: boolean
  numUploads: number
  complete: number
  totalSize: number | null
  totalETA: number | null
  totalUploadedSize: number
}

export default function StatusBarUI<M extends Meta, B extends Body>({
  newFiles,
  allowNewUpload,
  isUploadInProgress,
  isAllPaused,
  resumableUploads,
  error,
  hideUploadButton = undefined,
  hidePauseResumeButton = false,
  hideCancelButton = false,
  hideRetryButton = false,
  recoveredState,
  uploadState,
  totalProgress,
  files,
  supportsUploadProgress,
  hideAfterFinish = false,
  isSomeGhost,
  doneButtonHandler = undefined,
  isUploadStarted,
  i18n,
  startUpload,
  uppy,
  isAllComplete,
  showProgressDetails = undefined,
  numUploads,
  complete,
  totalSize,
  totalETA,
  totalUploadedSize,
}: StatusBarUIProps<M, B>) {
  function getProgressValue(): number | null {
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

  function getIsIndeterminate(): boolean {
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

  const progressValue = getProgressValue()

  const width = progressValue ?? 100

  const showUploadBtn =
    !error &&
    newFiles &&
    ((!isUploadInProgress && !isAllPaused) || recoveredState) &&
    allowNewUpload &&
    !hideUploadButton

  const showCancelBtn =
    !hideCancelButton &&
    uploadState !== STATE_WAITING &&
    uploadState !== STATE_COMPLETE

  const showPauseResumeBtn =
    resumableUploads &&
    !hidePauseResumeButton &&
    uploadState === STATE_UPLOADING

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

  const progressBarStateEl = (() => {
    switch (uploadState) {
      case STATE_PREPROCESSING:
      case STATE_POSTPROCESSING:
        return (
          <ProgressBarProcessing
            progress={calculateProcessingProgress(files)}
          />
        )
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
  })()

  const atLeastOneAction =
    showUploadBtn ||
    showRetryBtn ||
    showPauseResumeBtn ||
    showCancelBtn ||
    showDoneBtn
  const thereIsNothingInside = !atLeastOneAction && !progressBarStateEl

  const isHidden =
    thereIsNothingInside || (uploadState === STATE_COMPLETE && hideAfterFinish)

  if (isHidden) {
    return null
  }

  return (
    <div className={statusBarClassNames}>
      <div
        className={progressClassNames}
        style={{ width: `${width}%` }}
        role="progressbar"
        aria-label={`${width}%`}
        aria-valuetext={`${width}%`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progressValue!}
      />

      {progressBarStateEl}

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
