const Uppy = require('uppy/lib/core/Core')
const GoogleDrive = require('uppy/lib/plugins/GoogleDrive')
const UPPY_SERVER = require('../env')

const uppy = new Uppy({debug: true, autoProceed: false})
uppy
  .use(GoogleDrive, { target: '#GoogleDriveContainer', host: UPPY_SERVER })
  .run()
