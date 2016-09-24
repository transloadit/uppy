import html from '../../core/html'

export default (props) => {
  props = props || {}

  return html`
    <div class="UppyDashboard-statusBar">
      ${!props.isAllComplete
        ? !props.isAllPaused
          ? `Uploading... ${props.complete} / ${props.inProgress}・${props.totalProgress || 0}%・${props.totalETA}・↑ ${props.totalSpeed}/s`
          : `Paused ・${props.totalProgress}%`
        : null
      }
    </div>`
}
