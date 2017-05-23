const html = require('yo-yo')
const throttle = require('lodash.throttle')

function progressDetails (props) {
  return html`<span>${props.totalProgress || 0}%・${props.complete} / ${props.inProgress}・${props.totalUploadedSize} / ${props.totalSize}・↑ ${props.totalSpeed}/s・${props.totalETA}</span>`
}

const throttledProgressDetails = throttle(progressDetails, 1000, {leading: true, trailing: true})

const STATE_WAITING = 0
const STATE_PREPROCESSING = 1
const STATE_UPLOADING = 2
const STATE_POSTPROCESSING = 3
const STATE_COMPLETE = 4

function getUploadingState (props, files) {
  // If ALL files have been completed, show the completed state.
  if (props.isAllComplete) {
    return STATE_COMPLETE
  }

  let state = STATE_WAITING
  const fileIDs = Object.keys(files)
  for (let i = 0; i < fileIDs.length; i++) {
    const progress = files[fileIDs[i]].progress
    // If ANY files are being uploaded right now, show the uploading state.
    if (progress.uploadStarted && !progress.uploadComplete) {
      return STATE_UPLOADING
    }
    // If files are being preprocessed AND postprocessed at this time, we show the
    // preprocess state. If any files are being uploaded we show uploading.
    if (progress.preprocess && state !== STATE_UPLOADING) {
      state = STATE_PREPROCESSING
    }
    // If NO files are being preprocessed or uploaded right now, but some files are
    // being postprocessed, show the postprocess state.
    if (progress.postprocess && state !== STATE_UPLOADING && state !== STATE_PREPROCESSING) {
      state = STATE_POSTPROCESSING
    }
  }
  return state
}

function getUploadStateName (state) {
  return [
    'waiting',
    'preprocessing',
    'uploading',
    'postprocessing',
    'complete'
  ][state]
}

module.exports = (props) => {
  props = props || {}

  const uploadState = getUploadingState(props, props.files || {})

  let progressValue = props.totalProgress
  let progressMode
  let progressBarContent
  if (uploadState === STATE_PREPROCESSING || uploadState === STATE_POSTPROCESSING) {
    // TODO set progressValue and progressMode depending on the actual pre/postprocess
    // progress state
    progressMode = 'indeterminate'
    progressValue = undefined

    progressBarContent = ProgressBarProcessing(props)
  } else if (uploadState === STATE_COMPLETE) {
    progressBarContent = ProgressBarComplete(props)
  } else if (uploadState === STATE_UPLOADING) {
    progressBarContent = ProgressBarUploading(props)
  }

  const width = typeof progressValue === 'number' ? progressValue : 100

  return html`
    <div class="UppyDashboard-statusBar is-${getUploadStateName(uploadState)}"
                aria-hidden="${uploadState === STATE_WAITING}"
                title="">
      <progress style="display: none;" min="0" max="100" value=${progressValue}></progress>
      <div class="UppyDashboard-statusBarProgress ${progressMode ? `is-${progressMode}` : ''}"
           style="width: ${width}%"></div>
      ${progressBarContent}
    </div>
  `
}

const ProgressBarProcessing = (props) => {
  const progresses = Object.keys(props.files)
    .map(getProgress)
    .filter(Boolean)
  function getProgress (fileID) {
    const progress = props.files[fileID].progress
    // Return preprocessing or postprocessing progress.
    return progress.preprocess || progress.postprocess
  }

  // In the future we should probably do this differently. For now we'll take the
  // mode and message from the first file…
  const { mode, message } = progresses[0]
  const value = progresses.filter(isDeterminate).reduce((total, progress, all) => {
    return total + progress.value / all.length
  }, 0)
  function isDeterminate (progress) {
    return progress.mode === 'determinate'
  }

  return html`
    <div class="UppyDashboard-statusBarContent">
      ${mode === 'determinate' ? `${value * 100}%・` : ''}
      ${message}
    </div>
  `
}

const ProgressBarUploading = (props) => {
  return html`
    <div class="UppyDashboard-statusBarContent">
      ${props.isUploadStarted && !props.isAllComplete
        ? !props.isAllPaused
          ? html`<span title="Uploading">${pauseResumeButtons(props)} Uploading... ${throttledProgressDetails(props)}</span>`
          : html`<span title="Paused">${pauseResumeButtons(props)} Paused・${props.totalProgress}%</span>`
        : null
        }
    </div>
  `
}

const ProgressBarComplete = ({ totalProgress }) => {
  return html`
    <div class="UppyDashboard-statusBarContent">
      <span title="Complete">
        <svg class="UppyDashboard-statusBarAction UppyIcon" width="18" height="17" viewBox="0 0 23 17">
          <path d="M8.944 17L0 7.865l2.555-2.61 6.39 6.525L20.41 0 23 2.645z" />
        </svg>
        Upload complete・${totalProgress}%
      </span>
    </div>
  `
}

const pauseResumeButtons = (props) => {
  const title = props.resumableUploads
                ? props.isAllPaused
                  ? 'resume upload'
                  : 'pause upload'
                : 'cancel upload'

  return html`<button title="${title}" class="UppyDashboard-statusBarAction" type="button" onclick=${() => togglePauseResume(props)}>
    ${props.resumableUploads
      ? props.isAllPaused
        ? html`<svg class="UppyIcon" width="15" height="17" viewBox="0 0 11 13">
          <path d="M1.26 12.534a.67.67 0 0 1-.674.012.67.67 0 0 1-.336-.583v-11C.25.724.38.5.586.382a.658.658 0 0 1 .673.012l9.165 5.5a.66.66 0 0 1 .325.57.66.66 0 0 1-.325.573l-9.166 5.5z" />
        </svg>`
        : html`<svg class="UppyIcon" width="16" height="17" viewBox="0 0 12 13">
          <path d="M4.888.81v11.38c0 .446-.324.81-.722.81H2.722C2.324 13 2 12.636 2 12.19V.81c0-.446.324-.81.722-.81h1.444c.398 0 .722.364.722.81zM9.888.81v11.38c0 .446-.324.81-.722.81H7.722C7.324 13 7 12.636 7 12.19V.81c0-.446.324-.81.722-.81h1.444c.398 0 .722.364.722.81z"/>
        </svg>`
      : html`<svg class="UppyIcon" width="16px" height="16px" viewBox="0 0 19 19">
        <path d="M17.318 17.232L9.94 9.854 9.586 9.5l-.354.354-7.378 7.378h.707l-.62-.62v.706L9.318 9.94l.354-.354-.354-.354L1.94 1.854v.707l.62-.62h-.706l7.378 7.378.354.354.354-.354 7.378-7.378h-.707l.622.62v-.706L9.854 9.232l-.354.354.354.354 7.378 7.378.708-.707-7.38-7.378v.708l7.38-7.38.353-.353-.353-.353-.622-.622-.353-.353-.354.352-7.378 7.38h.708L2.56 1.23 2.208.88l-.353.353-.622.62-.353.355.352.353 7.38 7.38v-.708l-7.38 7.38-.353.353.352.353.622.622.353.353.354-.353 7.38-7.38h-.708l7.38 7.38z"/>
      </svg>`
    }
  </button>`
}

const togglePauseResume = (props) => {
  if (props.isAllComplete) return

  if (!props.resumableUploads) {
    return props.cancelAll()
  }

  if (props.isAllPaused) {
    return props.resumeAll()
  }

  return props.pauseAll()
}
