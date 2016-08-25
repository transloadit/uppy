import Uppy from '../../../../src/core/Core.js'
import Dummy from '../../../../src/plugins/Dummy'
import Tus10 from '../../../../src/plugins/Tus10.js'
import Dashboard from '../../../../src/plugins/Dashboard'
import GoogleDrive from '../../../../src/plugins/GoogleDrive'
import ProgressBar from '../../../../src/plugins/ProgressBar.js'
import Webcam from '../../../../src/plugins/Webcam/index.js'
import MetaData from '../../../../src/plugins/MetaData.js'
import { UPPY_SERVER } from '../env'

const uppy = new Uppy({debug: true, autoProceed: false})
uppy
  .use(Dashboard, {trigger: '#uppyModalOpener'})
  .use(GoogleDrive, {target: Dashboard, host: UPPY_SERVER})
  .use(Webcam, {target: Dashboard})
  .use(Dummy, {target: Dashboard})
  .use(Tus10, {endpoint: 'http://master.tus.io:8080/files/'})
  .use(ProgressBar, {target: 'body'})
  .use(MetaData, {
    fields: [
      { id: 'resizeTo', name: 'Resize to', value: 1200, placeholder: 'specify future image size' },
      { id: 'description', name: 'Description', value: 'something', placeholder: 'describe what the file is for' }
    ]
  })
  .run()
