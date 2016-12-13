import html from '../core/html'

export default (props) => {
  return html`
    <div>
      <span>
        Something went wrong.  Probably our fault. ${props.error}
      </span>
    </div>
  `
}
