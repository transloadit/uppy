import html from '../../../core/html'
import Icon from '../icon'

export default (props) => {
  return html`
    <td class="BrowserTable-rowColumn BrowserTable-column">
      ${Icon(props.icon)} ${props.value}
    </td>
  `
}
