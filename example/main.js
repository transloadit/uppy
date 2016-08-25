import Uppy from '../src/core/Core.js'
import Dashboard from '../src/plugins/Dashboard/index.js'
import Dummy from '../src/plugins/Dummy.js'
import GoogleDrive from '../src/plugins/GoogleDrive/index.js'
import ProgressBar from '../src/plugins/ProgressBar.js'
import Tus10 from '../src/plugins/Tus10.js'
import MetaData from '../src/plugins/MetaData.js'
import Webcam from '../src/plugins/Webcam/index.js'

// import MagicLog from '../src/plugins/MagicLog'

const uppy = new Uppy({debug: true, autoProceed: false})
  .use(Dashboard, {trigger: '#uppyModalOpener'})
  .use(GoogleDrive, {target: Dashboard, host: 'http://ya.ru'})
  .use(Dummy, {target: Dashboard})
  .use(Webcam, {target: Dashboard})
  .use(ProgressBar, {target: Dashboard})
  .use(Tus10, {endpoint: 'http://master.tus.io:8080/files/', resume: false})
  .use(MetaData, {
    fields: [
      { id: 'resizeTo', name: 'Resize to', value: 1200, placeholder: 'specify future image size' },
      { id: 'description', name: 'Description', value: '', placeholder: 'describe what the file is for' }
    ]
  })
  // .use(MagicLog)

uppy.run()

document.querySelector('#uppyModalOpener').click()
