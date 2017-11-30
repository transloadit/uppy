'use strict';

var _appendChild = require('yo-yoify/lib/appendChild');

module.exports = function (props) {
  var _span, _uppyProviderLoading;

  return _uppyProviderLoading = document.createElement('div'), _uppyProviderLoading.setAttribute('class', 'UppyProvider-loading'), _appendChild(_uppyProviderLoading, [' ', (_span = document.createElement('span'), _span.textContent = 'Loading...', _span), ' ']), _uppyProviderLoading;
};
//# sourceMappingURL=Loader.js.map