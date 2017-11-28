const html = require('yo-yo')
const onload = require('on-load')
const LoaderView = require('./Loader')

module.exports = (props) => {
  const demoLink = props.demo ? html`<button class="UppyProvider-authBtnDemo" onclick=${props.handleDemoAuth}>Proceed with Demo Account</button>` : null
  const AuthBlock = () => html`
    <div class="UppyProvider-auth">
      <h1 class="UppyProvider-authTitle">Please connect your ${props.pluginName}<br> account to select files</h1>
      <button type="button" class="UppyProvider-authBtn" onclick=${props.handleAuth}>Connect to ${props.pluginName}</button>
      ${demoLink}
    </div>
  `
  return onload(html`
    <div style="height: 100%;">
      ${props.checkAuthInProgress
        ? LoaderView()
        : AuthBlock()
      }
    </div>`, props.checkAuth, null, `auth${props.pluginName}`)
}
