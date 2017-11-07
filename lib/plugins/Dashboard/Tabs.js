'use strict';

var _appendChild = require('yo-yoify/lib/appendChild');

var ActionBrowseTagline = require('./ActionBrowseTagline');

var _require = require('./icons'),
    localIcon = _require.localIcon;

module.exports = function (props) {
  var _uppyDashboardInput, _uppyDashboardTabName, _uppyDashboardTabBtn, _uppyDashboardTab, _uppyDashboardTabsList, _nav, _uppyDashboardTabs2;

  var isHidden = Object.keys(props.files).length === 0;

  if (props.acquirers.length === 0) {
    var _uppyDashboardTabsTitle, _uppyDashboardTabs;

    return _uppyDashboardTabs = document.createElement('div'), _uppyDashboardTabs.setAttribute('aria-hidden', '' + String(isHidden) + ''), _uppyDashboardTabs.setAttribute('class', 'UppyDashboardTabs'), _appendChild(_uppyDashboardTabs, [' ', (_uppyDashboardTabsTitle = document.createElement('h3'), _uppyDashboardTabsTitle.setAttribute('class', 'UppyDashboardTabs-title'), _appendChild(_uppyDashboardTabsTitle, [' ', ActionBrowseTagline({
      acquirers: props.acquirers,
      handleInputChange: props.handleInputChange,
      i18n: props.i18n
    }), ' ']), _uppyDashboardTabsTitle), ' ']), _uppyDashboardTabs;
  }

  var input = (_uppyDashboardInput = document.createElement('input'), _uppyDashboardInput.setAttribute('type', 'file'), _uppyDashboardInput.setAttribute('name', 'files[]'), 'true' && _uppyDashboardInput.setAttribute('multiple', 'multiple'), _uppyDashboardInput.onchange = props.handleInputChange, _uppyDashboardInput.setAttribute('class', 'UppyDashboard-input'), _uppyDashboardInput);

  return _uppyDashboardTabs2 = document.createElement('div'), _uppyDashboardTabs2.setAttribute('class', 'UppyDashboardTabs'), _appendChild(_uppyDashboardTabs2, [' ', (_nav = document.createElement('nav'), _appendChild(_nav, [' ', (_uppyDashboardTabsList = document.createElement('ul'), _uppyDashboardTabsList.setAttribute('role', 'tablist'), _uppyDashboardTabsList.setAttribute('class', 'UppyDashboardTabs-list'), _appendChild(_uppyDashboardTabsList, [' ', (_uppyDashboardTab = document.createElement('li'), _uppyDashboardTab.setAttribute('class', 'UppyDashboardTab'), _appendChild(_uppyDashboardTab, [' ', (_uppyDashboardTabBtn = document.createElement('button'), _uppyDashboardTabBtn.setAttribute('type', 'button'), _uppyDashboardTabBtn.setAttribute('role', 'tab'), _uppyDashboardTabBtn.setAttribute('tabindex', '0'), _uppyDashboardTabBtn.onclick = function (ev) {
    input.click();
  }, _uppyDashboardTabBtn.setAttribute('class', 'UppyDashboardTab-btn UppyDashboard-focus'), _appendChild(_uppyDashboardTabBtn, [' ', localIcon(), ' ', (_uppyDashboardTabName = document.createElement('h5'), _uppyDashboardTabName.setAttribute('class', 'UppyDashboardTab-name'), _appendChild(_uppyDashboardTabName, [props.i18n('myDevice')]), _uppyDashboardTabName), ' ']), _uppyDashboardTabBtn), ' ', input, ' ']), _uppyDashboardTab), ' ', props.acquirers.map(function (target) {
    var _uppyDashboardTabName2, _uppyDashboardTabBtn2, _uppyDashboardTab2;

    return _uppyDashboardTab2 = document.createElement('li'), _uppyDashboardTab2.setAttribute('class', 'UppyDashboardTab'), _appendChild(_uppyDashboardTab2, [' ', (_uppyDashboardTabBtn2 = document.createElement('button'), _uppyDashboardTabBtn2.setAttribute('type', 'button'), _uppyDashboardTabBtn2.setAttribute('role', 'tab'), _uppyDashboardTabBtn2.setAttribute('tabindex', '0'), _uppyDashboardTabBtn2.setAttribute('aria-controls', 'UppyDashboardContent-panel--' + String(target.id) + ''), _uppyDashboardTabBtn2.setAttribute('aria-selected', '' + String(target.isHidden ? 'false' : 'true') + ''), _uppyDashboardTabBtn2.onclick = function () {
      return props.showPanel(target.id);
    }, _uppyDashboardTabBtn2.setAttribute('class', 'UppyDashboardTab-btn'), _appendChild(_uppyDashboardTabBtn2, [' ', target.icon(), ' ', (_uppyDashboardTabName2 = document.createElement('h5'), _uppyDashboardTabName2.setAttribute('class', 'UppyDashboardTab-name'), _appendChild(_uppyDashboardTabName2, [target.name]), _uppyDashboardTabName2), ' ']), _uppyDashboardTabBtn2), ' ']), _uppyDashboardTab2;
  }), ' ']), _uppyDashboardTabsList), ' ']), _nav), ' ']), _uppyDashboardTabs2;
};
//# sourceMappingURL=Tabs.js.map