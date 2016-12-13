import html from '../../core/html'

export default (props) => {
  return html`
    <td class="BrowserTable-rowColumn BrowserTable-column">
      ${props.icon} ${props.value}
    </td>
  `
}
