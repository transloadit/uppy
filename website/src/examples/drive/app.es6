import Uppy from 'uppy/core'
import { GoogleDrive } from 'uppy/plugins'
// import ProgressDrawer from '../../../../src/plugins/ProgressDrawer.js'
import { UPPY_SERVER } from '../env'

const uppy = new Uppy({debug: true, autoProceed: false})
uppy
  .use(GoogleDrive, { target: '#GoogleDriveContainer', host: UPPY_SERVER })
  .run()
