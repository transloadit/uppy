// const html = require('yo-yo')

const { h } = require('picodom')
const hyperx = require('hyperx')
const html = hyperx(h, {attrToProp: false})

// const onload = require('on-load')
const LoaderView = require('./Loader')

module.exports = (props) => {
  const demoLink = props.demo ? html`<button class="UppyProvider-authBtnDemo" onclick=${props.handleDemoAuth}>Proceed with Demo Account</button>` : null
  const AuthBlock = () => html`
    <div class="UppyProvider-auth">
      <h1 class="UppyProvider-authTitle">Please authenticate with <span class="UppyProvider-authTitleName">${props.pluginName}</span><br> to select files</h1>
      <button type="button" class="UppyProvider-authBtn" onclick=${props.handleAuth}>Authenticate</button>
      ${demoLink}
    </div>
  `

  return html`
    <div style=${{height: '100%'}} oncreate=${props.checkAuth}>
      ${props.checkAuthInProgress
        ? LoaderView()
        : AuthBlock()
      }
    </div>
  `
  // return onload(html`
  //   <div style="height: 100%;">
  //     ${props.checkAuthInProgress
  //       ? LoaderView()
  //       : AuthBlock()
  //     }
  //   </div>`, props.checkAuth, null, `auth${props.pluginName}`)
}
