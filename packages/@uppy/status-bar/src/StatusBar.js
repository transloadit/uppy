const throttle = require('lodash.throttle')
const classNames = require('classnames')
const statusBarStates = require('./StatusBarStates')
const prettierBytes = require('@transloadit/prettier-bytes')
const prettyETA = require('@uppy/utils/lib/prettyETA')
const { h } = require('preact')

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
    value
  }
}

function togglePauseResume (props) {
  if (props.isAllComplete) return

  if (!props.resumableUploads) {
    return props.cancelAll()
  }

  if (props.isAllPaused) {
    return props.resumeAll()
  }

  return props.pauseAll()
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
    hideRetryButton
  } = props

  const uploadState = props.uploadState

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
  const isHidden = (uploadState === statusBarStates.STATE_WAITING && props.hideUploadButton) ||
    (uploadState === statusBarStates.STATE_WAITING && !props.newFiles > 0) ||
    (uploadState === statusBarStates.STATE_COMPLETE && props.hideAfterFinish)

  const showUploadBtn = !error && newFiles &&
    !isUploadInProgress && !isAllPaused &&
    allowNewUpload && !hideUploadButton
  const showCancelBtn = !hideCancelButton &&
    uploadState !== statusBarStates.STATE_WAITING &&
    uploadState !== statusBarStates.STATE_COMPLETE
  const showPauseResumeBtn = resumableUploads && !hidePauseResumeButton &&
    uploadState === statusBarStates.STATE_UPLOADING

  const showRetryBtn = error && !hideRetryButton

  const showDoneBtn = props.doneButtonHandler && uploadState === statusBarStates.STATE_COMPLETE

  const progressClassNames = `uppy-StatusBar-progress
                           ${progressMode ? 'is-' + progressMode : ''}`

  const statusBarClassNames = classNames(
    { 'uppy-Root': props.isTargetDOMEl },
    'uppy-StatusBar',
    `is-${uploadState}`
  )

  return (
    <div class={statusBarClassNames} aria-hidden={isHidden}>
      <div
        class={progressClassNames}
        style={{ width: width + '%' }}
        role="progressbar"
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow={progressValue}
      />
      {progressBarContent}
      <div class="uppy-StatusBar-actions">
        {showUploadBtn ? <UploadBtn {...props} uploadState={uploadState} /> : null}
        {showRetryBtn ? <RetryBtn {...props} /> : null}
        {showPauseResumeBtn ? <PauseResumeButton {...props} /> : null}
        {showCancelBtn ? <CancelBtn {...props} /> : null}
        {showDoneBtn ? <DoneBtn {...props} /> : null}
      </div>
    </div>
  )
}

const UploadBtn = (props) => {
  const uploadBtnClassNames = classNames(
    'uppy-u-reset',
    'uppy-c-btn',
    'uppy-StatusBar-actionBtn',
    'uppy-StatusBar-actionBtn--upload',
    { 'uppy-c-btn-primary': props.uploadState === statusBarStates.STATE_WAITING }
  )

  return (
    <button
      type="button"
      class={uploadBtnClassNames}
      aria-label={props.i18n('uploadXFiles', { smart_count: props.newFiles })}
      onclick={props.startUpload}
      data-uppy-super-focusable
    >
      {props.newFiles && props.isUploadStarted
        ? props.i18n('uploadXNewFiles', { smart_count: props.newFiles })
        : props.i18n('uploadXFiles', { smart_count: props.newFiles })}
    </button>
  )
}

const RetryBtn = (props) => {
  return (
    <button
      type="button"
      class="uppy-u-reset uppy-c-btn uppy-StatusBar-actionBtn uppy-StatusBar-actionBtn--retry"
      aria-label={props.i18n('retryUpload')}
      onclick={props.retryAll}
      data-uppy-super-focusable
    >
      <svg aria-hidden="true" focusable="false" class="uppy-c-icon" width="8" height="10" viewBox="0 0 8 10">
        <path d="M4 2.408a2.75 2.75 0 1 0 2.75 2.75.626.626 0 0 1 1.25.018v.023a4 4 0 1 1-4-4.041V.25a.25.25 0 0 1 .389-.208l2.299 1.533a.25.25 0 0 1 0 .416l-2.3 1.533A.25.25 0 0 1 4 3.316v-.908z" />
      </svg>
      {props.i18n('retry')}
    </button>
  )
}

const CancelBtn = (props) => {
  return (
    <button
      type="button"
      class="uppy-u-reset uppy-StatusBar-actionCircleBtn"
      title={props.i18n('cancel')}
      aria-label={props.i18n('cancel')}
      onclick={props.cancelAll}
      data-uppy-super-focusable
    >
      <svg aria-hidden="true" focusable="false" class="uppy-c-icon" width="16" height="16" viewBox="0 0 16 16">
        <g fill="none" fill-rule="evenodd">
          <circle fill="#888" cx="8" cy="8" r="8" />
          <path fill="#FFF" d="M9.283 8l2.567 2.567-1.283 1.283L8 9.283 5.433 11.85 4.15 10.567 6.717 8 4.15 5.433 5.433 4.15 8 6.717l2.567-2.567 1.283 1.283z" />
        </g>
      </svg>
    </button>
  )
}

const PauseResumeButton = (props) => {
  const { isAllPaused, i18n } = props
  const title = isAllPaused ? i18n('resume') : i18n('pause')

  return (
    <button
      title={title}
      aria-label={title}
      class="uppy-u-reset uppy-StatusBar-actionCircleBtn"
      type="button"
      onclick={() => togglePauseResume(props)}
      data-uppy-super-focusable
    >
      {isAllPaused ? (
        <svg aria-hidden="true" focusable="false" class="uppy-c-icon" width="16" height="16" viewBox="0 0 16 16">
          <g fill="none" fill-rule="evenodd">
            <circle fill="#888" cx="8" cy="8" r="8" />
            <path fill="#FFF" d="M6 4.25L11.5 8 6 11.75z" />
          </g>
        </svg>
      ) : (
        <svg aria-hidden="true" focusable="false" class="uppy-c-icon" width="16" height="16" viewBox="0 0 16 16">
          <g fill="none" fill-rule="evenodd">
            <circle fill="#888" cx="8" cy="8" r="8" />
            <path d="M5 4.5h2v7H5v-7zm4 0h2v7H9v-7z" fill="#FFF" />
          </g>
        </svg>
      )}
    </button>
  )
}

const DoneBtn = (props) => {
  const { i18n } = props
  return (
    <button
      type="button"
      class="uppy-u-reset uppy-c-btn uppy-StatusBar-actionBtn uppy-StatusBar-actionBtn--done"
      onClick={props.doneButtonHandler}
      data-uppy-super-focusable
    >
      {i18n('done')}
    </button>
  )
}

const LoadingSpinner = () => {
  return (
    <svg class="uppy-StatusBar-spinner" aria-hidden="true" focusable="false" width="14" height="14">
      <path d="M13.983 6.547c-.12-2.509-1.64-4.893-3.939-5.936-2.48-1.127-5.488-.656-7.556 1.094C.524 3.367-.398 6.048.162 8.562c.556 2.495 2.46 4.52 4.94 5.183 2.932.784 5.61-.602 7.256-3.015-1.493 1.993-3.745 3.309-6.298 2.868-2.514-.434-4.578-2.349-5.153-4.84a6.226 6.226 0 0 1 2.98-6.778C6.34.586 9.74 1.1 11.373 3.493c.407.596.693 1.282.842 1.988.127.598.073 1.197.161 1.794.078.525.543 1.257 1.15.864.525-.341.49-1.05.456-1.592-.007-.15.02.3 0 0" fill-rule="evenodd" />
    </svg>
  )
}

const ProgressBarProcessing = (props) => {
  const value = Math.round(props.value * 100)

  return (
    <div class="uppy-StatusBar-content">
      <LoadingSpinner />
      {props.mode === 'determinate' ? `${value}% \u00B7 ` : ''}
      {props.message}
    </div>
  )
}

const renderDot = () =>
  ' \u00B7 '

const ProgressDetails = (props) => {
  const ifShowFilesUploadedOfTotal = props.numUploads > 1

  return (
    <div class="uppy-StatusBar-statusSecondary">
      {
        ifShowFilesUploadedOfTotal &&
        props.i18n('filesUploadedOfTotal', {
          complete: props.complete,
          smart_count: props.numUploads
        })
      }
      <span class="uppy-StatusBar-additionalInfo">
        {/* When should we render this dot?
          1. .-additionalInfo is shown (happens only on desktops)
          2. AND 'filesUploadedOfTotal' was shown
        */}
        {ifShowFilesUploadedOfTotal && renderDot()}

        {
          props.i18n('dataUploadedOfTotal', {
            complete: prettierBytes(props.totalUploadedSize),
            total: prettierBytes(props.totalSize)
          })
        }

        {renderDot()}

        {
          props.i18n('xTimeLeft', {
            time: prettyETA(props.totalETA)
          })
        }
      </span>
    </div>
  )
}

const UnknownProgressDetails = (props) => {
  return (
    <div class="uppy-StatusBar-statusSecondary">
      {props.i18n('filesUploadedOfTotal', { complete: props.complete, smart_count: props.numUploads })}
    </div>
  )
}

const UploadNewlyAddedFiles = (props) => {
  const uploadBtnClassNames = classNames(
    'uppy-u-reset',
    'uppy-c-btn',
    'uppy-StatusBar-actionBtn',
    'uppy-StatusBar-actionBtn--uploadNewlyAdded'
  )

  return (
    <div class="uppy-StatusBar-statusSecondary">
      <div class="uppy-StatusBar-statusSecondaryHint">
        {props.i18n('xMoreFilesAdded', { smart_count: props.newFiles })}
      </div>
      <button
        type="button"
        class={uploadBtnClassNames}
        aria-label={props.i18n('uploadXFiles', { smart_count: props.newFiles })}
        onclick={props.startUpload}
      >
        {props.i18n('upload')}
      </button>
    </div>
  )
}

const ThrottledProgressDetails = throttle(ProgressDetails, 500, { leading: true, trailing: true })

const ProgressBarUploading = (props) => {
  if (!props.isUploadStarted || props.isAllComplete) {
    return null
  }

  const title = props.isAllPaused ? props.i18n('paused') : props.i18n('uploading')
  const showUploadNewlyAddedFiles = props.newFiles && props.isUploadStarted

  return (
    <div class="uppy-StatusBar-content" aria-label={title} title={title}>
      {!props.isAllPaused ? <LoadingSpinner /> : null}
      <div class="uppy-StatusBar-status">
        <div class="uppy-StatusBar-statusPrimary">
          {props.supportsUploadProgress ? `${title}: ${props.totalProgress}%` : title}
        </div>
        {!props.isAllPaused && !showUploadNewlyAddedFiles && props.showProgressDetails
          ? (props.supportsUploadProgress ? <ThrottledProgressDetails {...props} /> : <UnknownProgressDetails {...props} />)
          : null}
        {showUploadNewlyAddedFiles ? <UploadNewlyAddedFiles {...props} /> : null}
      </div>
    </div>
  )
}

const ProgressBarComplete = ({ totalProgress, i18n }) => {
  return (
    <div class="uppy-StatusBar-content" role="status" title={i18n('complete')}>
      <div class="uppy-StatusBar-status">
        <div class="uppy-StatusBar-statusPrimary">
          <svg aria-hidden="true" focusable="false" class="uppy-StatusBar-statusIndicator uppy-c-icon" width="15" height="11" viewBox="0 0 15 11">
            <path d="M.414 5.843L1.627 4.63l3.472 3.472L13.202 0l1.212 1.213L5.1 10.528z" />
          </svg>
          {i18n('complete')}
        </div>
      </div>
    </div>
  )
}

const ProgressBarError = ({ error, retryAll, hideRetryButton, i18n }) => {
  function displayErrorAlert () {
    const errorMessage = `${i18n('uploadFailed')} \n\n ${error}`
    alert(errorMessage)
  }

  return (
    <div class="uppy-StatusBar-content" role="alert" title={i18n('uploadFailed')}>
      <div class="uppy-StatusBar-status">
        <div class="uppy-StatusBar-statusPrimary">
          <svg aria-hidden="true" focusable="false" class="uppy-StatusBar-statusIndicator uppy-c-icon" width="11" height="11" viewBox="0 0 11 11">
            <path d="M4.278 5.5L0 1.222 1.222 0 5.5 4.278 9.778 0 11 1.222 6.722 5.5 11 9.778 9.778 11 5.5 6.722 1.222 11 0 9.778z" />
          </svg>
          {i18n('uploadFailed')}
        </div>
      </div>
      <span
        class="uppy-StatusBar-details"
        aria-label={error}
        data-microtip-position="top-right"
        data-microtip-size="medium"
        role="tooltip"
        onclick={displayErrorAlert}
      >
        ?
      </span>
    </div>
  )
}
