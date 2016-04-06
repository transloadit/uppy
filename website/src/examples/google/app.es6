import Uppy from 'uppy/core'
import { GoogleDrive } from 'uppy/plugins'
import ProgressDrawer from '../../../../src/plugins/ProgressDrawer.js'

const uppy = new Uppy({debug: true, autoProceed: false})
uppy
  .use(GoogleDrive, {target: '#GoogleDriveContainer'})
  .run()
