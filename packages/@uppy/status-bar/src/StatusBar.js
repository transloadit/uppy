const throttle = require('lodash.throttle')
const classNames = require('classnames')
const statusBarStates = require('./StatusBarStates')
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
    progressBarContent = ProgressBarUploading(props)
  } else if (uploadState === statusBarStates.STATE_ERROR) {
    progressValue = undefined
    progressBarContent = ProgressBarError(props)
  }

  const width = typeof progressValue === 'number' ? progressValue : 100
  const isHidden = (uploadState === statusBarStates.STATE_WAITING && props.hideUploadButton) ||
    (uploadState === statusBarStates.STATE_WAITING && !props.newFiles > 0) ||
    (uploadState === statusBarStates.STATE_COMPLETE && props.hideAfterFinish)

  const progressClassNames = `uppy-StatusBar-progress
                           ${progressMode ? 'is-' + progressMode : ''}`

  const statusBarClassNames = classNames(
    'uppy',
    'uppy-StatusBar',
    `is-${uploadState}`,
    { 'uppy-StatusBar--detailedProgress': props.showProgressDetails }
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
        { props.newFiles && !props.hideUploadButton ? <UploadBtn {...props} uploadState={uploadState} /> : null }
        { props.error && !props.hideRetryButton ? <RetryBtn {...props} /> : null }
        { !props.hidePauseResumeCancelButtons && uploadState !== statusBarStates.STATE_WAITING && uploadState !== statusBarStates.STATE_COMPLETE
          ? <CancelBtn {...props} />
          : null
        }
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
    {props.newFiles && props.uploadStarted
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
  return <button type="button"
    class="uppy-u-reset uppy-c-btn uppy-StatusBar-actionBtn uppy-StatusBar-actionBtn--cancel"
    aria-label={props.i18n('cancel')}
    onclick={props.cancelAll}>{props.i18n('cancel')}</button>
}

const PauseResumeButtons = (props) => {
  const { resumableUploads, isAllPaused, i18n } = props
  const title = resumableUploads
                ? isAllPaused
                  ? i18n('resumeUpload')
                  : i18n('pauseUpload')
                : i18n('cancelUpload')

  return <button title={title} class="uppy-u-reset uppy-StatusBar-statusIndicator" type="button" onclick={() => togglePauseResume(props)}>
    {resumableUploads
      ? isAllPaused
        ? <svg aria-hidden="true" class="UppyIcon" width="15" height="17" viewBox="0 0 11 13">
          <path d="M1.26 12.534a.67.67 0 0 1-.674.012.67.67 0 0 1-.336-.583v-11C.25.724.38.5.586.382a.658.658 0 0 1 .673.012l9.165 5.5a.66.66 0 0 1 .325.57.66.66 0 0 1-.325.573l-9.166 5.5z" />
        </svg>
        : <svg aria-hidden="true" class="UppyIcon" width="16" height="17" viewBox="0 0 12 13">
          <path d="M4.888.81v11.38c0 .446-.324.81-.722.81H2.722C2.324 13 2 12.636 2 12.19V.81c0-.446.324-.81.722-.81h1.444c.398 0 .722.364.722.81zM9.888.81v11.38c0 .446-.324.81-.722.81H7.722C7.324 13 7 12.636 7 12.19V.81c0-.446.324-.81.722-.81h1.444c.398 0 .722.364.722.81z" />
        </svg>
      : <svg aria-hidden="true" class="UppyIcon" width="16px" height="16px" viewBox="0 0 19 19">
        <path d="M17.318 17.232L9.94 9.854 9.586 9.5l-.354.354-7.378 7.378h.707l-.62-.62v.706L9.318 9.94l.354-.354-.354-.354L1.94 1.854v.707l.62-.62h-.706l7.378 7.378.354.354.354-.354 7.378-7.378h-.707l.622.62v-.706L9.854 9.232l-.354.354.354.354 7.378 7.378.708-.707-7.38-7.378v.708l7.38-7.38.353-.353-.353-.353-.622-.622-.353-.353-.354.352-7.378 7.38h.708L2.56 1.23 2.208.88l-.353.353-.622.62-.353.355.352.353 7.38 7.38v-.708l-7.38 7.38-.353.353.352.353.622.622.353.353.354-.353 7.38-7.38h-.708l7.38 7.38z" />
      </svg>
    }
  </button>
}

const ProgressBarProcessing = (props) => {
  const value = Math.round(props.value * 100)

  return <div class="uppy-StatusBar-content">
    {props.mode === 'determinate' ? `${value}% \u00B7 ` : ''}
    {props.message}
  </div>
}

const progressDetails = (props) => {
  return <span class="uppy-StatusBar-statusSecondary">
    { props.inProgress > 1 && props.i18n('filesUploadedOfTotal', { complete: props.complete, smart_count: props.inProgress }) + ' \u00B7 ' }
    { props.i18n('dataUploadedOfTotal', { complete: props.totalUploadedSize, total: props.totalSize }) + ' \u00B7 ' }
    { props.i18n('xTimeLeft', { time: props.totalETA }) }
  </span>
}

const ThrottledProgressDetails = throttle(progressDetails, 500, { leading: true, trailing: true })

const ProgressBarUploading = (props) => {
  if (!props.isUploadStarted || props.isAllComplete) {
    return null
  }

  const title = props.isAllPaused ? props.i18n('paused') : props.i18n('uploading')

  return (
    <div class="uppy-StatusBar-content" aria-label={title} title={title}>
      { !props.hidePauseResumeCancelButtons && <PauseResumeButtons {...props} /> }
      <div class="uppy-StatusBar-status">
        <span class="uppy-StatusBar-statusPrimary">{title}: {props.totalProgress}%</span>
        <br />
        { !props.isAllPaused && <ThrottledProgressDetails {...props} /> }
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
      <strong class="uppy-StatusBar-contentPadding">{i18n('uploadFailed')}.</strong>
      { !hideRetryButton && <span class="uppy-StatusBar-contentPadding">{i18n('pleasePressRetry')}</span> }
      <span class="uppy-StatusBar-details"
        aria-label={error}
        data-microtip-position="top"
        data-microtip-size="large"
        role="tooltip">?</span>
    </div>
  )
}
