import html from '../../core/html'
// import { cacheElement } from '../../core/Utils'

let lastUpdate = Date.now()
let cachedEl

function cacheElement (el, time) {
  console.log('throttleElement')

  if (Date.now() - lastUpdate < time) {
    console.log('returning cached!')
    return cachedEl
  }

  console.log('returning new!')
  cachedEl = el
  lastUpdate = Date.now()

  return el
}

export default (props) => {
  props = props || {}

  let statusBar = html`
    <div class="UppyDashboard-statusBar">
      ${!props.isAllComplete
        ? !props.isAllPaused
          ? `Uploading... ${props.complete} / ${props.inProgress}・${props.totalProgress || 0}%・${props.totalETA}・↑ ${props.totalSpeed}/s`
          : `Paused・${props.totalProgress}%`
        : null
      }
    </div>
  `

  return cacheElement(statusBar, 1000)
}
