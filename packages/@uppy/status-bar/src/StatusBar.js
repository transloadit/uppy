const throttle = require('lodash.throttle')
const classNames = require('classnames')
const statusBarStates = require('./StatusBarStates')
const prettyBytes = require('prettier-bytes')
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

  const { newFiles,
    allowNewUpload,
    isUploadInProgress,
    isAllPaused,
    resumableUploads,
    error,
    hideUploadButton,
    hidePauseResumeButton,
    hideCancelButton,
    hideRetryButton } = props

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
    uploadState !== statusBarStates.STATE_WAITING &&
    uploadState !== statusBarStates.STATE_PREPROCESSING &&
    uploadState !== statusBarStates.STATE_POSTPROCESSING &&
    uploadState !== statusBarStates.STATE_COMPLETE
  const showRetryBtn = error && !hideRetryButton

  const progressClassNames = `uppy-StatusBar-progress
                           ${progressMode ? 'is-' + progressMode : ''}`

  const statusBarClassNames = classNames(
    { 'uppy-Root': props.isTargetDOMEl },
    'uppy-StatusBar',
    `is-${uploadState}`
  )

  return (
    <div class={statusBarClassNames} aria-hidden={isHidden}>
      <div class={progressClassNames}
        style={{ width: width + '%' }}
        role="progressbar"
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow={progressValue} />
      {progressBarContent}
      <div class="uppy-StatusBar-actions">
        { showUploadBtn ? <UploadBtn {...props} uploadState={uploadState} /> : null }
        { showRetryBtn ? <RetryBtn {...props} /> : null }
        { showPauseResumeBtn ? <PauseResumeButton {...props} /> : null }
        { showCancelBtn ? <CancelBtn {...props} /> : null }
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

  return <button type="button"
    class={uploadBtnClassNames}
    aria-label={props.i18n('uploadXFiles', { smart_count: props.newFiles })}
    onclick={props.startUpload}>
    {props.newFiles && props.isUploadStarted
      ? props.i18n('uploadXNewFiles', { smart_count: props.newFiles })
      : props.i18n('uploadXFiles', { smart_count: props.newFiles })
    }
  </button>
}

const RetryBtn = (props) => {
  return <button type="button"
    class="uppy-u-reset uppy-c-btn uppy-StatusBar-actionBtn uppy-StatusBar-actionBtn--retry"
    aria-label={props.i18n('retryUpload')}
    onclick={props.retryAll}>{props.i18n('retry')}</button>
}

const CancelBtn = (props) => {
  return <button
    type="button"
    class="uppy-u-reset uppy-StatusBar-actionCircleBtn"
    title={props.i18n('cancel')}
    aria-label={props.i18n('cancel')}
    onclick={props.cancelAll}>
    <svg aria-hidden="true" class="UppyIcon" width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 16A8 8 0 1 1 8 0a8 8 0 0 1 0 16zm1.414-8l2.122-2.121-1.415-1.415L8 6.586 5.879 4.464 4.464 5.88 6.586 8l-2.122 2.121 1.415 1.415L8 9.414l2.121 2.122 1.415-1.415L9.414 8z" fill="#949494" fill-rule="evenodd" />
    </svg>
  </button>
}

const PauseResumeButton = (props) => {
  const { isAllPaused, i18n } = props
  const title = isAllPaused ? i18n('resume') : i18n('pause')

  return <button
    title={title}
    aria-label={title}
    class="uppy-u-reset uppy-StatusBar-actionCircleBtn"
    type="button"
    onclick={() => togglePauseResume(props)}>
    {isAllPaused
      ? <svg aria-hidden="true" class="UppyIcon" width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 16A8 8 0 1 1 8 0a8 8 0 0 1 0 16zM6 5v6l5-3-5-3z" fill="#949494" fill-rule="evenodd" />
      </svg>
      : <svg aria-hidden="true" class="UppyIcon" width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 16A8 8 0 1 1 8 0a8 8 0 0 1 0 16zM5 5v6h2V5H5zm4 0v6h2V5H9z" fill="#949494" fill-rule="evenodd" />
      </svg>
    }
  </button>
}

const LoadingSpinner = (props) => {
  return <svg class="uppy-StatusBar-spinner" width="14" height="14" xmlns="http://www.w3.org/2000/svg">
    <path d="M13.983 6.547c-.12-2.509-1.64-4.893-3.939-5.936-2.48-1.127-5.488-.656-7.556 1.094C.524 3.367-.398 6.048.162 8.562c.556 2.495 2.46 4.52 4.94 5.183 2.932.784 5.61-.602 7.256-3.015-1.493 1.993-3.745 3.309-6.298 2.868-2.514-.434-4.578-2.349-5.153-4.84a6.226 6.226 0 0 1 2.98-6.778C6.34.586 9.74 1.1 11.373 3.493c.407.596.693 1.282.842 1.988.127.598.073 1.197.161 1.794.078.525.543 1.257 1.15.864.525-.341.49-1.05.456-1.592-.007-.15.02.3 0 0" fill-rule="evenodd" />
  </svg>
}

const ProgressBarProcessing = (props) => {
  const value = Math.round(props.value * 100)

  return <div class="uppy-StatusBar-content">
    <LoadingSpinner {...props} />
    {props.mode === 'determinate' ? `${value}% \u00B7 ` : ''}
    {props.message}
  </div>
}

const ProgressDetails = (props) => {
  return <div class="uppy-StatusBar-statusSecondary">
    { props.numUploads > 1 && props.i18n('filesUploadedOfTotal', { complete: props.complete, smart_count: props.numUploads }) + ' \u00B7 ' }
    { props.i18n('dataUploadedOfTotal', {
      complete: prettyBytes(props.totalUploadedSize),
      total: prettyBytes(props.totalSize)
    }) + ' \u00B7 ' }
    { props.i18n('xTimeLeft', { time: prettyETA(props.totalETA) }) }
  </div>
}

const UnknownProgressDetails = (props) => {
  return <div class="uppy-StatusBar-statusSecondary">
    { props.i18n('filesUploadedOfTotal', { complete: props.complete, smart_count: props.numUploads }) }
  </div>
}

const UploadNewlyAddedFiles = (props) => {
  const uploadBtnClassNames = classNames(
    'uppy-u-reset',
    'uppy-c-btn',
    'uppy-StatusBar-actionBtn'
  )

  return <div class="uppy-StatusBar-statusSecondary">
    <div class="uppy-StatusBar-statusSecondaryHint">
      { props.i18n('xMoreFilesAdded', { smart_count: props.newFiles }) }
    </div>
    <button type="button"
      class={uploadBtnClassNames}
      aria-label={props.i18n('uploadXFiles', { smart_count: props.newFiles })}
      onclick={props.startUpload}>
      {props.i18n('upload')}
    </button>
  </div>
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
      { !props.isAllPaused ? <LoadingSpinner {...props} /> : null }
      <div class="uppy-StatusBar-status">
        <div class="uppy-StatusBar-statusPrimary">
          {props.supportsUploadProgress ? `${title}: ${props.totalProgress}%` : title}
        </div>
        { !props.isAllPaused && !showUploadNewlyAddedFiles && props.showProgressDetails
          ? (props.supportsUploadProgress ? <ThrottledProgressDetails {...props} /> : <UnknownProgressDetails {...props} />)
          : null
        }
        { showUploadNewlyAddedFiles ? <UploadNewlyAddedFiles {...props} /> : null }
      </div>
    </div>
  )
}

const ProgressBarComplete = ({ totalProgress, i18n }) => {
  return (
    <div class="uppy-StatusBar-content" role="status" title={i18n('complete')}>
      <svg aria-hidden="true" class="uppy-StatusBar-statusIndicator UppyIcon" width="18" height="17" viewBox="0 0 23 17">
        <path d="M8.944 17L0 7.865l2.555-2.61 6.39 6.525L20.41 0 23 2.645z" />
      </svg>
      {i18n('complete')}
    </div>
  )
}

const ProgressBarError = ({ error, retryAll, hideRetryButton, i18n }) => {
  return (
    <div class="uppy-StatusBar-content" role="alert">
      <span class="uppy-StatusBar-contentPadding">{i18n('uploadFailed')}.</span>
      {/* {!hideRetryButton &&
        <span class="uppy-StatusBar-contentPadding">{i18n('pleasePressRetry')}</span>
      } */}
      <span class="uppy-StatusBar-details"
        aria-label={error}
        data-microtip-position="top-right"
        data-microtip-size="medium"
        role="tooltip">?</span>
    </div>
  )
}
