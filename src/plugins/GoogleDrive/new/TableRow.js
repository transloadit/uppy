import html from '../../../core/html'
import Column from './TableColumn'

export default (props) => {
  return html`
    <tr class="BrowserTable-row">
      ${props.columns.map((column) => {
        return Column({
          value: props[column.key] || ''
        })
      })}
    </tr>
  `
}
