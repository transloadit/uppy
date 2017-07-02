const html = require('yo-yo')

module.exports = (props) => {
  const demoLink = props.demo ? html`<button class="UppyProvider-authBtnDemo" onclick=${props.handleDemoAuth}>Proceed with Demo Account</button>` : null
  return html`
    <div class="UppyProvider-auth">
      <h1 class="UppyProvider-authTitle">
        Please authenticate with <span class="UppyProvider-authTitleName">${props.pluginName}</span><br> to select files
      </h1>
      <button type="button" class="UppyProvider-authBtn" onclick=${props.handleAuth}>Authenticate</button>
      ${demoLink}
    </div>
  `
}
