const Uppy = require('../../../../src/core/Core.js')
const GoogleDrive = require('../../../../src/plugins/GoogleDrive')
const UPPY_SERVER = require('../env')

const uppy = new Uppy({debug: true, autoProceed: false})
uppy
  .use(GoogleDrive, { target: '#GoogleDriveContainer', host: UPPY_SERVER })
  .run()
