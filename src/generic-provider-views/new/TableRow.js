import html from '../../core/html'
import Column from './TableColumn'

export default (props) => {
  const classes = props.active ? 'BrowserTable-row is-active' : 'BrowserTable-row'
  return html`
    <tr onclick=${props.handleClick} ondblclick=${props.handleDoubleClick} class=${classes}>
      ${Column({
        icon: props.icon,
        value: props.title
      })}
    </tr>
  `
}
