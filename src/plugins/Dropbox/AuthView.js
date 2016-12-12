import html from '../../core/html'

export default (props) => {
  const demoLink = props.demo ? html`<a onclick=${props.handleDemoAuth}>Proceed with Demo Account</a>` : null
  return html`
    <div class="UppyGoogleDrive-authenticate">
      <h1>You need to authenticate with Dropbox before selecting files.</h1>
      <a href=${props.link}>Authenticate</a>
      ${demoLink}
    </div>
  `
}
