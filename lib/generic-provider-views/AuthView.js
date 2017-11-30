'use strict';

var _appendChild = require('yo-yoify/lib/appendChild');

var onload = require('on-load');
var LoaderView = require('./Loader');

module.exports = function (props) {
  var _uppyProviderAuthBtnDemo, _div;

  var demoLink = props.demo ? (_uppyProviderAuthBtnDemo = document.createElement('button'), _uppyProviderAuthBtnDemo.onclick = props.handleDemoAuth, _uppyProviderAuthBtnDemo.setAttribute('class', 'UppyProvider-authBtnDemo'), _uppyProviderAuthBtnDemo.textContent = 'Proceed with Demo Account', _uppyProviderAuthBtnDemo) : null;
  var AuthBlock = function AuthBlock() {
    var _uppyProviderAuthTitleName, _br, _uppyProviderAuthTitle, _uppyProviderAuthBtn, _uppyProviderAuth;

    return _uppyProviderAuth = document.createElement('div'), _uppyProviderAuth.setAttribute('class', 'UppyProvider-auth'), _appendChild(_uppyProviderAuth, [' ', (_uppyProviderAuthTitle = document.createElement('h1'), _uppyProviderAuthTitle.setAttribute('class', 'UppyProvider-authTitle'), _appendChild(_uppyProviderAuthTitle, ['Please authenticate with ', (_uppyProviderAuthTitleName = document.createElement('span'), _uppyProviderAuthTitleName.setAttribute('class', 'UppyProvider-authTitleName'), _appendChild(_uppyProviderAuthTitleName, [props.pluginName]), _uppyProviderAuthTitleName), (_br = document.createElement('br'), _br), ' to select files']), _uppyProviderAuthTitle), ' ', (_uppyProviderAuthBtn = document.createElement('button'), _uppyProviderAuthBtn.setAttribute('type', 'button'), _uppyProviderAuthBtn.onclick = props.handleAuth, _uppyProviderAuthBtn.setAttribute('class', 'UppyProvider-authBtn'), _uppyProviderAuthBtn.textContent = 'Authenticate', _uppyProviderAuthBtn), ' ', demoLink, ' ']), _uppyProviderAuth;
  };
  return onload((_div = document.createElement('div'), _div.setAttribute('style', 'height: 100%;'), _appendChild(_div, [' ', props.checkAuthInProgress ? LoaderView() : AuthBlock(), ' ']), _div), props.checkAuth, null, 'auth' + props.pluginName);
};
//# sourceMappingURL=AuthView.js.map