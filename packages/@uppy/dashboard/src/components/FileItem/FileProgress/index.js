const { h } = require('preact')

function onPauseResumeCancelRetry (props) {
  if (props.isUploaded) return

  if (props.error && !props.hideRetryButton) {
    props.retryUpload(props.file.id)
    return
  }

  if (props.resumableUploads && !props.hidePauseResumeButton) {
    props.pauseUpload(props.file.id)
  } else if (props.individualCancellation && !props.hideCancelButton) {
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

function ProgressIndicatorButton (props) {
  return (
    <div class="uppy-Dashboard-Item-progress">
      <button
        class="uppy-u-reset uppy-Dashboard-Item-progressIndicator"
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
      width="70"
      height="70"
      viewBox="0 0 36 36"
      class="uppy-c-icon uppy-Dashboard-Item-progressIcon--circle"
    >
      {children}
    </svg>
  )
}

function ProgressCircle ({ progress }) {
  // circle length equals 2 * PI * R
  const circleLength = 2 * Math.PI * 15

  return (
    <g>
      <circle class="uppy-Dashboard-Item-progressIcon--bg" r="15" cx="18" cy="18" stroke-width="2" fill="none" />
      <circle
        class="uppy-Dashboard-Item-progressIcon--progress" r="15" cx="18" cy="18" transform="rotate(-90, 18, 18)" stroke-width="2" fill="none"
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
      <div class="uppy-Dashboard-Item-progress">
        <div class="uppy-Dashboard-Item-progressIndicator">
          <ProgressCircleContainer>
            <circle r="15" cx="18" cy="18" fill="#1bb240" />
            <polygon class="uppy-Dashboard-Item-progressIcon--check" transform="translate(2, 3)" points="14 22.5 7 15.2457065 8.99985857 13.1732815 14 18.3547104 22.9729883 9 25 11.1005634" />
          </ProgressCircleContainer>
        </div>
      </div>
    )
  }

  // Retry button for error
  if (props.error && !props.hideRetryButton) {
    return (
      <ProgressIndicatorButton {...props}>
        <svg aria-hidden="true" focusable="false" class="uppy-c-icon uppy-Dashboard-Item-progressIcon--retry" width="28" height="31" viewBox="0 0 16 19">
          <path d="M16 11a8 8 0 1 1-8-8v2a6 6 0 1 0 6 6h2z" />
          <path d="M7.9 3H10v2H7.9z" />
          <path d="M8.536.5l3.535 3.536-1.414 1.414L7.12 1.914z" />
          <path d="M10.657 2.621l1.414 1.415L8.536 7.57 7.12 6.157z" />
        </svg>
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
              ? <polygon class="uppy-Dashboard-Item-progressIcon--play" transform="translate(3, 3)" points="12 20 12 10 20 15" />
              : (
                <g class="uppy-Dashboard-Item-progressIcon--pause" transform="translate(14.5, 13)">
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
    <div class="uppy-Dashboard-Item-progress">
      <div class="uppy-Dashboard-Item-progressIndicator">
        <ProgressCircleContainer>
          <ProgressCircle progress={props.file.progress.percentage} />
        </ProgressCircleContainer>
      </div>
    </div>
  )
}
