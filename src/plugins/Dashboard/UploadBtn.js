import html from '../../core/html'
import { uploadIcon } from './icons'

export default (props) => {
  props = props || {}

  return html`<button class="UppyButton--circular
                   UppyButton--blue
                   UppyDashboard-upload"
                 type="button"
                 title="${props.i18n('uploadAllNewFiles')}"
                 aria-label="${props.i18n('uploadAllNewFiles')}"
                 onclick=${props.startUpload}>
            ${uploadIcon()}
            <sup class="UppyDashboard-uploadCount"
                 title="${props.i18n('numberOfSelectedFiles')}"
                 aria-label="${props.i18n('numberOfSelectedFiles')}">
                  ${props.newFileCount}</sup>
    </button>
  `
}
