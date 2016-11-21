import html from '../../core/html'

export default (props) => {
  props = props || {}

  const isHidden = props.totalFileCount === 0 || !props.isUploadStarted

  return html`
    <div class="UppyDashboard-statusBar
                ${props.isAllComplete ? 'is-complete' : ''}"
                aria-hidden="${isHidden}">

      <div class="UppyDashboard-statusBarProgress" style="width: ${props.totalProgress}%"></div>
      <div class="UppyDashboard-statusBarContent">
        ${props.isUploadStarted && !props.isAllComplete
          ? !props.isAllPaused
            ? html`<span>${pauseResumeButtons(props)} Uploading... ${props.complete} / ${props.inProgress}・${props.totalProgress || 0}%・${props.totalETA}・↑ ${props.totalSpeed}/s</span>`
            : html`<span>${pauseResumeButtons(props)} Paused・${props.totalProgress}%</span>`
          : null
          }
        ${props.isAllComplete
          ? html`<span><svg class="UppyIcon" width="18" height="17" viewBox="0 0 23 17">
              <path d="M8.944 17L0 7.865l2.555-2.61 6.39 6.525L20.41 0 23 2.645z" />
            </svg>Upload complete・${props.totalProgress}%</span>`
          : null
        }
      </div>
    </div>
  `
}

// ${!props.autoProceed && props.newFileCount > 0
//   ? startUpload(props)
//   : null
// }

// const startUpload = (props) => {
//   return html`<button type="button" onclick=${props.startUpload}>
//     Upload
//     <sup class="UppyDashboard-uploadCountf"
//          title="${props.i18n('numberOfSelectedFiles')}"
//          aria-label="${props.i18n('numberOfSelectedFiles')}">
//       ${props.newFileCount}
//     </sup>
//   </button>`
// }

const pauseResumeButtons = (props) => {
  return html`<button class="UppyDashboard-statusBarAction" type="button" onclick=${() => togglePauseResume(props)}>
    ${props.isAllPaused
      ? html`<svg class="UppyIcon" width="15" height="17" viewBox="0 0 11 13">
        <path d="M1.26 12.534a.67.67 0 0 1-.674.012.67.67 0 0 1-.336-.583v-11C.25.724.38.5.586.382a.658.658 0 0 1 .673.012l9.165 5.5a.66.66 0 0 1 .325.57.66.66 0 0 1-.325.573l-9.166 5.5z" />
      </svg>`
      : html`<svg class="UppyIcon" width="16" height="17" viewBox="0 0 12 13">
        <path d="M4.888.81v11.38c0 .446-.324.81-.722.81H2.722C2.324 13 2 12.636 2 12.19V.81c0-.446.324-.81.722-.81h1.444c.398 0 .722.364.722.81zM9.888.81v11.38c0 .446-.324.81-.722.81H7.722C7.324 13 7 12.636 7 12.19V.81c0-.446.324-.81.722-.81h1.444c.398 0 .722.364.722.81z"/>
      </svg>`
    }
  </button>`
}

const togglePauseResume = (props) => {
  if (props.isAllComplete) return

  if (props.isAllPaused) {
    return props.resumeAll()
  }

  return props.pauseAll()
}
