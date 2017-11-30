'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Plugin = require('../Plugin');
var ServiceWorkerStore = require('./ServiceWorkerStore');
var IndexedDBStore = require('./IndexedDBStore');
var MetaDataStore = require('./MetaDataStore');

/**
* The Golden Retriever plugin — restores selected files and resumes uploads
* after a closed tab or a browser crash!
*
* Uses localStorage, IndexedDB and ServiceWorker to do its magic, read more:
* https://uppy.io/blog/2017/07/golden-retriever/
*/
module.exports = function (_Plugin) {
  _inherits(GoldenRetriever, _Plugin);

  function GoldenRetriever(core, opts) {
    _classCallCheck(this, GoldenRetriever);

    var _this = _possibleConstructorReturn(this, _Plugin.call(this, core, opts));

    _this.type = 'debugger';
    _this.id = 'GoldenRetriever';
    _this.title = 'Golden Retriever';

    var defaultOptions = {
      expires: 24 * 60 * 60 * 1000, // 24 hours
      serviceWorker: false
    };

    _this.opts = _extends({}, defaultOptions, opts);

    _this.MetaDataStore = new MetaDataStore({
      expires: _this.opts.expires,
      storeName: core.getID()
    });
    _this.ServiceWorkerStore = null;
    if (_this.opts.serviceWorker) {
      _this.ServiceWorkerStore = new ServiceWorkerStore({ storeName: core.getID() });
    }
    _this.IndexedDBStore = new IndexedDBStore(_extends({ expires: _this.opts.expires }, opts.indexedDB || {}, { storeName: core.getID() }));

    _this.saveFilesStateToLocalStorage = _this.saveFilesStateToLocalStorage.bind(_this);
    _this.loadFilesStateFromLocalStorage = _this.loadFilesStateFromLocalStorage.bind(_this);
    _this.loadFileBlobsFromServiceWorker = _this.loadFileBlobsFromServiceWorker.bind(_this);
    _this.loadFileBlobsFromIndexedDB = _this.loadFileBlobsFromIndexedDB.bind(_this);
    _this.onBlobsLoaded = _this.onBlobsLoaded.bind(_this);
    return _this;
  }

  GoldenRetriever.prototype.loadFilesStateFromLocalStorage = function loadFilesStateFromLocalStorage() {
    var savedState = this.MetaDataStore.load();

    if (savedState) {
      this.core.log('Recovered some state from Local Storage');
      this.core.setState(savedState);
    }
  };

  /**
   * Get file objects that are currently waiting: they've been selected,
   * but aren't yet being uploaded.
   */


  GoldenRetriever.prototype.getWaitingFiles = function getWaitingFiles() {
    var _this2 = this;

    var waitingFiles = {};

    var allFiles = this.core.state.files;
    Object.keys(allFiles).forEach(function (fileID) {
      var file = _this2.core.getFile(fileID);
      if (!file.progress || !file.progress.uploadStarted) {
        waitingFiles[fileID] = file;
      }
    });

    return waitingFiles;
  };

  /**
   * Get file objects that are currently being uploaded. If a file has finished
   * uploading, but the other files in the same batch have not, the finished
   * file is also returned.
   */


  GoldenRetriever.prototype.getUploadingFiles = function getUploadingFiles() {
    var _this3 = this;

    var uploadingFiles = {};

    var currentUploads = this.core.state.currentUploads;

    if (currentUploads) {
      var uploadIDs = Object.keys(currentUploads);
      uploadIDs.forEach(function (uploadID) {
        var filesInUpload = currentUploads[uploadID].fileIDs;
        filesInUpload.forEach(function (fileID) {
          uploadingFiles[fileID] = _this3.core.getFile(fileID);
        });
      });
    }

    return uploadingFiles;
  };

  GoldenRetriever.prototype.saveFilesStateToLocalStorage = function saveFilesStateToLocalStorage() {
    var filesToSave = _extends(this.getWaitingFiles(), this.getUploadingFiles());

    this.MetaDataStore.save({
      currentUploads: this.core.state.currentUploads,
      files: filesToSave
    });
  };

  GoldenRetriever.prototype.loadFileBlobsFromServiceWorker = function loadFileBlobsFromServiceWorker() {
    var _this4 = this;

    this.ServiceWorkerStore.list().then(function (blobs) {
      var numberOfFilesRecovered = Object.keys(blobs).length;
      var numberOfFilesTryingToRecover = Object.keys(_this4.core.state.files).length;
      if (numberOfFilesRecovered === numberOfFilesTryingToRecover) {
        _this4.core.log('Successfully recovered ' + numberOfFilesRecovered + ' blobs from Service Worker!');
        _this4.core.info('Successfully recovered ' + numberOfFilesRecovered + ' files', 'success', 3000);
        _this4.onBlobsLoaded(blobs);
      } else {
        _this4.core.log('Failed to recover blobs from Service Worker, trying IndexedDB now...');
        _this4.loadFileBlobsFromIndexedDB();
      }
    });
  };

  GoldenRetriever.prototype.loadFileBlobsFromIndexedDB = function loadFileBlobsFromIndexedDB() {
    var _this5 = this;

    this.IndexedDBStore.list().then(function (blobs) {
      var numberOfFilesRecovered = Object.keys(blobs).length;

      if (numberOfFilesRecovered > 0) {
        _this5.core.log('Successfully recovered ' + numberOfFilesRecovered + ' blobs from Indexed DB!');
        _this5.core.info('Successfully recovered ' + numberOfFilesRecovered + ' files', 'success', 3000);
        return _this5.onBlobsLoaded(blobs);
      }
      _this5.core.log('Couldn’t recover anything from IndexedDB :(');
    });
  };

  GoldenRetriever.prototype.onBlobsLoaded = function onBlobsLoaded(blobs) {
    var _this6 = this;

    var obsoleteBlobs = [];
    var updatedFiles = _extends({}, this.core.state.files);
    Object.keys(blobs).forEach(function (fileID) {
      var originalFile = _this6.core.getFile(fileID);
      if (!originalFile) {
        obsoleteBlobs.push(fileID);
        return;
      }

      var cachedData = blobs[fileID];

      var updatedFileData = {
        data: cachedData,
        isRestored: true
      };
      var updatedFile = _extends({}, originalFile, updatedFileData);
      updatedFiles[fileID] = updatedFile;

      _this6.core.generatePreview(updatedFile);
    });
    this.core.setState({
      files: updatedFiles
    });
    this.core.emit('core:restored');

    if (obsoleteBlobs.length) {
      this.deleteBlobs(obsoleteBlobs).then(function () {
        _this6.core.log('[GoldenRetriever] cleaned up ' + obsoleteBlobs.length + ' old files');
      });
    }
  };

  GoldenRetriever.prototype.deleteBlobs = function deleteBlobs(fileIDs) {
    var _this7 = this;

    var promises = [];
    fileIDs.forEach(function (id) {
      if (_this7.ServiceWorkerStore) {
        promises.push(_this7.ServiceWorkerStore.delete(id));
      }
      if (_this7.IndexedDBStore) {
        promises.push(_this7.IndexedDBStore.delete(id));
      }
    });
    return Promise.all(promises);
  };

  GoldenRetriever.prototype.install = function install() {
    var _this8 = this;

    this.loadFilesStateFromLocalStorage();

    if (Object.keys(this.core.state.files).length > 0) {
      if (this.ServiceWorkerStore) {
        this.core.log('Attempting to load files from Service Worker...');
        this.loadFileBlobsFromServiceWorker();
      } else {
        this.core.log('Attempting to load files from Indexed DB...');
        this.loadFileBlobsFromIndexedDB();
      }
    }

    this.core.on('core:file-added', function (file) {
      if (file.isRemote) return;

      if (_this8.ServiceWorkerStore) {
        _this8.ServiceWorkerStore.put(file).catch(function (err) {
          _this8.core.log('Could not store file', 'error');
          _this8.core.log(err);
        });
      }

      _this8.IndexedDBStore.put(file).catch(function (err) {
        _this8.core.log('Could not store file', 'error');
        _this8.core.log(err);
      });
    });

    this.core.on('core:file-removed', function (fileID) {
      if (_this8.ServiceWorkerStore) _this8.ServiceWorkerStore.delete(fileID);
      _this8.IndexedDBStore.delete(fileID);
    });

    this.core.on('core:complete', function (_ref) {
      var successful = _ref.successful;

      var fileIDs = successful.map(function (file) {
        return file.id;
      });
      _this8.deleteBlobs(fileIDs).then(function () {
        _this8.core.log('[GoldenRetriever] removed ' + successful.length + ' files that finished uploading');
      });
    });

    this.core.on('core:state-update', this.saveFilesStateToLocalStorage);

    this.core.on('core:restored', function () {
      // start all uploads again when file blobs are restored
      var _core$getState = _this8.core.getState(),
          currentUploads = _core$getState.currentUploads;

      if (currentUploads) {
        Object.keys(currentUploads).forEach(function (uploadId) {
          _this8.core.restore(uploadId, currentUploads[uploadId]);
        });
      }
    });
  };

  return GoldenRetriever;
}(Plugin);
//# sourceMappingURL=index.js.map