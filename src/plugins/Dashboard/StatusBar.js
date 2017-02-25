const html = require('yo-yo')
const throttle = require('lodash.throttle')

function progressBarWidth (props) {
  return props.totalProgress
}

function progressDetails (props) {
  // console.log(Date.now())
  return html`<span>${props.totalProgress || 0}%・${props.complete} / ${props.inProgress}・${props.totalUploadedSize} / ${props.totalSize}・↑ ${props.totalSpeed}/s・${props.totalETA}</span>`
}

const throttledProgressDetails = throttle(progressDetails, 1000, {leading: true, trailing: true})
// const throttledProgressBarWidth = throttle(progressBarWidth, 300, {leading: true, trailing: true})

module.exports = (props) => {
  props = props || {}

  const isHidden = props.totalFileCount === 0 || !props.isUploadStarted

  return html`
    <div class="UppyDashboard-statusBar
                ${props.isAllComplete ? 'is-complete' : ''}"
                aria-hidden="${isHidden}"
                title="">
      <progress style="display: none;" min="0" max="100" value="${props.totalProgress}"></progress>
      <div class="UppyDashboard-statusBarProgress" style="width: ${progressBarWidth(props)}%"></div>
      <div class="UppyDashboard-statusBarContent">
        ${props.isUploadStarted && !props.isAllComplete
          ? !props.isAllPaused
            ? html`<span title="Uploading">${pauseResumeButtons(props)} Uploading... ${throttledProgressDetails(props)}</span>`
            : html`<span title="Paused">${pauseResumeButtons(props)} Paused・${props.totalProgress}%</span>`
          : null
          }
        ${props.isAllComplete
          ? html`<span title="Complete"><svg class="UppyDashboard-statusBarAction UppyIcon" width="18" height="17" viewBox="0 0 23 17">
              <path d="M8.944 17L0 7.865l2.555-2.61 6.39 6.525L20.41 0 23 2.645z" />
            </svg>Upload complete・${props.totalProgress}%</span>`
          : null
        }
      </div>
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
