import Uppy from '../../../../src/core/Core.js'
import GoogleDrive from '../../../../src/plugins/GoogleDrive'
import { UPPY_SERVER } from '../env'

const uppy = new Uppy({debug: true, autoProceed: false})
uppy
  .use(GoogleDrive, { target: '#GoogleDriveContainer', host: UPPY_SERVER })
  .run()
