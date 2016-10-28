import html from '../../core/html'
// import { makeCachingFunction } from '../../core/Utils'

// let cachedElement = makeCachingFunction()

const togglePauseResume = (props) => {
  if (props.isAllComplete) return

  if (props.isAllPaused) {
    return props.resumeAll()
  }

  return props.pauseAll()
}

export default (props) => {
  props = props || {}

  let statusBar = html`
    <div class="UppyDashboard-statusBar" onclick=${() => togglePauseResume(props)}>
      ${props.isAllPaused
        ? html`<svg class="UppyIcon UppyDashboard-statusBarAction" width="15" height="17" viewBox="0 0 11 13">
          <path d="M1.26 12.534a.67.67 0 0 1-.674.012.67.67 0 0 1-.336-.583v-11C.25.724.38.5.586.382a.658.658 0 0 1 .673.012l9.165 5.5a.66.66 0 0 1 .325.57.66.66 0 0 1-.325.573l-9.166 5.5z" />
        </svg>`
        : html`<svg class="UppyIcon UppyDashboard-statusBarAction" width="16" height="17" viewBox="0 0 12 13">
          <path d="M4.888.81v11.38c0 .446-.324.81-.722.81H2.722C2.324 13 2 12.636 2 12.19V.81c0-.446.324-.81.722-.81h1.444c.398 0 .722.364.722.81zM9.888.81v11.38c0 .446-.324.81-.722.81H7.722C7.324 13 7 12.636 7 12.19V.81c0-.446.324-.81.722-.81h1.444c.398 0 .722.364.722.81z"/>
        </svg>`
      }
      <div class="UppyDashboard-statusBarProgress" style="width: ${props.totalProgress}%"></div>
      <div class="UppyDashboard-statusBarText">
        ${!props.isAllComplete
          ? !props.isAllPaused
            ? `Uploading... ${props.complete} / ${props.inProgress}・${props.totalProgress || 0}%・${props.totalETA}・↑ ${props.totalSpeed}/s`
            : `Paused・${props.totalProgress}%`
          : null
        }
      </div>
    </div>
  `

  return statusBar

  // return cachedElement(statusBar, 1000)
}
