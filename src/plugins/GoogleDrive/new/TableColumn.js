import html from '../../../core/html'

export default (props) => {
  return html`
    <td class="BrowserTable-rowColumn BrowserTable-column">
      <img src=${props.iconLink}/> ${props.value}
    </td>
  `
}
