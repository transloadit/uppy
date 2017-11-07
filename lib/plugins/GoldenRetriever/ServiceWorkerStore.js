'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _Promise = typeof Promise === 'undefined' ? require('es6-promise').Promise : Promise;

var isSupported = typeof navigator !== 'undefined' && 'serviceWorker' in navigator;

function waitForServiceWorker() {
  return new _Promise(function (resolve, reject) {
    if (!isSupported) {
      reject(new Error('Unsupported'));
    } else if (navigator.serviceWorker.controller) {
      // A serviceWorker is already registered and active.
      resolve();
    } else {
      navigator.serviceWorker.addEventListener('controllerchange', function () {
        resolve();
      });
    }
  });
}

var ServiceWorkerStore = function () {
  function ServiceWorkerStore(opts) {
    _classCallCheck(this, ServiceWorkerStore);

    this.ready = waitForServiceWorker();
    this.name = opts.storeName;
  }

  ServiceWorkerStore.prototype.list = function list() {
    var _this = this;

    var defer = {};
    var promise = new _Promise(function (resolve, reject) {
      defer.resolve = resolve;
      defer.reject = reject;
    });

    console.log('Loading stored blobs from Service Worker');
    var onMessage = function onMessage(event) {
      if (event.data.store !== _this.name) {
        return;
      }
      switch (event.data.type) {
        case 'uppy/ALL_FILES':
          defer.resolve(event.data.files);
          navigator.serviceWorker.removeEventListener('message', onMessage);
          break;
      }
    };

    this.ready.then(function () {
      navigator.serviceWorker.addEventListener('message', onMessage);

      navigator.serviceWorker.controller.postMessage({
        type: 'uppy/GET_FILES',
        store: _this.name
      });
    });

    return promise;
  };

  ServiceWorkerStore.prototype.put = function put(file) {
    var _this2 = this;

    return this.ready.then(function () {
      navigator.serviceWorker.controller.postMessage({
        type: 'uppy/ADD_FILE',
        store: _this2.name,
        file: file
      });
    });
  };

  ServiceWorkerStore.prototype.delete = function _delete(fileID) {
    var _this3 = this;

    return this.ready.then(function () {
      navigator.serviceWorker.controller.postMessage({
        type: 'uppy/REMOVE_FILE',
        store: _this3.name,
        fileID: fileID
      });
    });
  };

  return ServiceWorkerStore;
}();

ServiceWorkerStore.isSupported = isSupported;

module.exports = ServiceWorkerStore;
//# sourceMappingURL=ServiceWorkerStore.js.map