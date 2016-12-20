// Parent
const Plugin = require('./Plugin')

// Orchestrators
const Dashboard = require('./Dashboard/index.js')

// Acquirers
const Dummy = require('./Dummy')
const DragDrop = require('./DragDrop/index.js')
const FileInput = require('./FileInput')
const GoogleDrive = require('./GoogleDrive/index.js')
const Webcam = require('./Webcam/index.js')

// Progressindicators
const ProgressBar = require('./ProgressBar.js')
const Informer = require('./Informer.js')

// Uploaders
const Tus10 = require('./Tus10')
const Multipart = require('./Multipart')

// Presenters
// import Present from './Present'

// Presetters
// import TransloaditBasic from './TransloaditBasic'

module.exports = {
  Plugin,
  Dummy,
  ProgressBar,
  Informer,
  DragDrop,
  GoogleDrive,
  FileInput,
  Tus10,
  Multipart,
  // TransloaditBasic,
  Dashboard,
  Webcam
}
