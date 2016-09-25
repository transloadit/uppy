import html from '../../../core/html'

export default (props) => {
  return html`
    <li>
      <button onclick=${props.getNextFolder}>${props.title}</button>
    </li>
  `
}
