import html from '../../core/html'

export default (props) => {
  return html`
    <li>
      <button onclick=${props.getFolder}>${props.title}</button>
    </li>
  `
}
