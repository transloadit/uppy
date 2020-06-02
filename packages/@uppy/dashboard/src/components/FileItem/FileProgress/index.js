const { h } = require('preact')
const { iconRetry } = require('../../icons')

function onPauseResumeCancelRetry (props) {
  if (props.isUploaded) return

  if (props.error && !props.hideRetryButton) {
    props.retryUpload(props.file.id)
    return
  }

  if (props.resumableUploads && !props.hidePauseResumeButton) {
    props.pauseUpload(props.file.id)
  } else if (props.individualCancellatio && !props.hideCancelButton) {
    props.cancelUpload(props.file.id)
  }
}

function progressIndicatorTitle (props) {
  if (props.isUploaded) {
    return props.i18n('uploadComplete')
  }

  if (props.error) {
    return props.i18n('retryUpload')
  }

  if (props.resumableUploads) {
    if (props.file.isPaused) {
      return props.i18n('resumeUpload')
    }
    return props.i18n('pauseUpload')
  } else if (props.individualCancellation) {
    return props.i18n('cancelUpload')
  }

  return ''
}

// function PauseResumeCancelIcon (props) {
//   return (
//     <svg aria-hidden="true" focusable="false" width="70" height="70" viewBox="0 0 36 36" class="UppyIcon UppyIcon-progressCircle">
//       <g class="progress-group">
//         <circle class="bg" r="15" cx="18" cy="18" stroke-width="2" fill="none" />
//         <circle
//           class="progress" r="15" cx="18" cy="18" transform="rotate(-90, 18, 18)" stroke-width="2" fill="none"
//           stroke-dasharray={circleLength}
//           stroke-dashoffset={circleLength - (circleLength / 100 * props.progress)}
//         />
//       </g>
//       {!props.hidePauseResumeButton && (
//         <g>
//           <polygon class="play" transform="translate(3, 3)" points="12 20 12 10 20 15" />
//           <g class="pause" transform="translate(14.5, 13)">
//             <rect x="0" y="0" width="2" height="10" rx="0" />
//             <rect x="5" y="0" width="2" height="10" rx="0" />
//           </g>
//         </g>
//       )}
//       {!props.hideCancelButton && (
//         <polygon class="cancel" transform="translate(2, 2)" points="19.8856516 11.0625 16 14.9481516 12.1019737 11.0625 11.0625 12.1143484 14.9481516 16 11.0625 19.8980263 12.1019737 20.9375 16 17.0518484 19.8856516 20.9375 20.9375 19.8980263 17.0518484 16 20.9375 12" />
//       )}
//       <polygon class="check" transform="translate(2, 3)" points="14 22.5 7 15.2457065 8.99985857 13.1732815 14 18.3547104 22.9729883 9 25 11.1005634" />
//     </svg>
//   )
// }

function ProgressIndicatorButton (props) {
  return (
    <div class="uppy-DashboardItem-progress">
      <button
        class="uppy-u-reset uppy-DashboardItem-progressIndicator"
        type="button"
        aria-label={progressIndicatorTitle(props)}
        title={progressIndicatorTitle(props)}
        onclick={() => onPauseResumeCancelRetry(props)}
      >
        {props.children}
      </button>
    </div>
  )
}

function ProgressCircleContainer ({ children }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width="70" height="70"
      viewBox="0 0 36 36"
      class="UppyIcon UppyIcon-progressCircle"
    >
      {children}
    </svg>
  )
}

function ProgressCircle ({ progress }) {
  // circle length equals 2 * PI * R
  const circleLength = 2 * Math.PI * 15

  return (
    <g class="progress-group">
      <circle class="bg" r="15" cx="18" cy="18" stroke-width="2" fill="none" />
      <circle
        class="progress" r="15" cx="18" cy="18" transform="rotate(-90, 18, 18)" stroke-width="2" fill="none"
        stroke-dasharray={circleLength}
        stroke-dashoffset={circleLength - (circleLength / 100 * progress)}
      />
    </g>
  )
}

module.exports = function FileProgress (props) {
  // Nothing if upload has not started
  if (!props.file.progress.uploadStarted) {
    return null
  }

  // Green checkmark when complete
  if (props.isUploaded) {
    return (
      <div class="uppy-DashboardItem-progress">
        <div class="uppy-DashboardItem-progressIndicator">
          <ProgressCircleContainer>
            <circle class="progress" r="15" cx="18" cy="18" transform="rotate(-90, 18, 18)" stroke-width="2" fill="none" />
            <polygon class="check" transform="translate(2, 3)" points="14 22.5 7 15.2457065 8.99985857 13.1732815 14 18.3547104 22.9729883 9 25 11.1005634" />
          </ProgressCircleContainer>
        </div>
      </div>
    )
  }

  // Retry button for error
  if (props.error && !props.hideRetryButton) {
    return (
      <ProgressIndicatorButton {...props}>
        {iconRetry()}
      </ProgressIndicatorButton>
    )
  }

  // Pause/resume button for resumable uploads
  if (props.resumableUploads && !props.hidePauseResumeButton) {
    return (
      <ProgressIndicatorButton {...props}>
        <ProgressCircleContainer>
          <ProgressCircle progress={props.file.progress.percentage} />
          {
            props.file.isPaused
              ? <polygon class="play" transform="translate(3, 3)" points="12 20 12 10 20 15" />
              : (
                <g class="pause" transform="translate(14.5, 13)">
                  <rect x="0" y="0" width="2" height="10" rx="0" />
                  <rect x="5" y="0" width="2" height="10" rx="0" />
                </g>
              )
          }
        </ProgressCircleContainer>
      </ProgressIndicatorButton>
    )
  }

  // Cancel button for non-resumable uploads if individualCancellation is supported (not bundled)
  if (!props.resumableUploads && props.individualCancellation && !props.hideCancelButton) {
    return (
      <ProgressIndicatorButton {...props}>
        <ProgressCircleContainer>
          <ProgressCircle progress={props.file.progress.percentage} />
          <polygon class="cancel" transform="translate(2, 2)" points="19.8856516 11.0625 16 14.9481516 12.1019737 11.0625 11.0625 12.1143484 14.9481516 16 11.0625 19.8980263 12.1019737 20.9375 16 17.0518484 19.8856516 20.9375 20.9375 19.8980263 17.0518484 16 20.9375 12" />
        </ProgressCircleContainer>
      </ProgressIndicatorButton>
    )
  }

  // Just progress when buttons are disabled
  return (
    <div class="uppy-DashboardItem-progress">
      <div class="uppy-DashboardItem-progressIndicator">
        <ProgressCircleContainer>
          <ProgressCircle progress={props.file.progress.percentage} />
        </ProgressCircleContainer>
      </div>
    </div>
  )
}
