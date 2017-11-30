'use strict';

var Core = require('./core/index.js');

// Parent
var Plugin = require('./plugins/Plugin');

// Orchestrators
var Dashboard = require('./plugins/Dashboard/index.js');

// Acquirers
var Dummy = require('./plugins/Dummy');
var DragDrop = require('./plugins/DragDrop/index.js');
var FileInput = require('./plugins/FileInput.js');
var GoogleDrive = require('./plugins/GoogleDrive/index.js');
var Dropbox = require('./plugins/Dropbox/index.js');
var Instagram = require('./plugins/Instagram/index.js');
var Webcam = require('./plugins/Webcam/index.js');

// Progressindicators
var StatusBar = require('./plugins/StatusBar');
var ProgressBar = require('./plugins/ProgressBar.js');
var Informer = require('./plugins/Informer.js');

// Modifiers
var MetaData = require('./plugins/MetaData.js');

// Uploaders
var Tus = require('./plugins/Tus');
var XHRUpload = require('./plugins/XHRUpload');
var Transloadit = require('./plugins/Transloadit');
var AwsS3 = require('./plugins/AwsS3');

// Helpers and utilities
var GoldenRetriever = require('./plugins/GoldenRetriever');
var ReduxDevTools = require('./plugins/ReduxDevTools');
var ReduxStore = require('./plugins/Redux');

module.exports = {
  Core: Core,
  Plugin: Plugin,
  Dummy: Dummy,
  StatusBar: StatusBar,
  ProgressBar: ProgressBar,
  Informer: Informer,
  DragDrop: DragDrop,
  GoogleDrive: GoogleDrive,
  Dropbox: Dropbox,
  Instagram: Instagram,
  FileInput: FileInput,
  Tus: Tus,
  XHRUpload: XHRUpload,
  Transloadit: Transloadit,
  AwsS3: AwsS3,
  Dashboard: Dashboard,
  MetaData: MetaData,
  Webcam: Webcam,
  GoldenRetriever: GoldenRetriever,
  ReduxDevTools: ReduxDevTools,
  ReduxStore: ReduxStore
};

Object.defineProperty(module.exports, 'RestoreFiles', {
  enumerable: true,
  configurable: true,
  get: function get() {
    console.warn('Uppy.RestoreFiles is deprecated and will be removed in v0.22. Use Uppy.GoldenRetriever instead.');
    Object.defineProperty(module.exports, 'RestoreFiles', {
      enumerable: true,
      configurable: true,
      writable: true,
      value: GoldenRetriever
    });
    return GoldenRetriever;
  }
});

Object.defineProperty(module.exports, 'Tus10', {
  enumerable: true,
  configurable: true,
  get: function get() {
    console.warn('Uppy.Tus10 is deprecated and will be removed in v0.22. Use Uppy.Tus instead.');
    Object.defineProperty(module.exports, 'Tus10', {
      enumerable: true,
      configurable: true,
      writable: true,
      value: Tus
    });
    return Tus;
  }
});
//# sourceMappingURL=index.js.map