import Uppy from '../src/core/index.js'
// import Dummy from '../src/plugins/Dummy.js'
import Dashboard from '../src/plugins/Dashboard'
// import GoogleDrive from '../src/plugins/GoogleDrive'
// import Webcam from '../src/plugins/Webcam'
import Tus10 from '../src/plugins/Tus10'
import MetaData from '../src/plugins/MetaData'
import Informer from '../src/plugins/Informer'
// import Multipart from '../src/plugins/Multipart'

const PROTOCOL = location.protocol === 'https:' ? 'https' : 'http'
const TUS_ENDPOINT = PROTOCOL + '://master.tus.io/files/'

// import ru_RU from '../src/locales/ru_RU.js'
// import MagicLog from '../src/plugins/MagicLog'
// import PersistentState from '../src/plugins/PersistentState'

// const dummy = Dummy({bla: 'boop'})

const uppy = Uppy({debug: true, autoProceed: false})
  .use(Dashboard, {trigger: '#uppyModalOpener', inline: false})
  // .use(GoogleDrive, {target: Dashboard, host: 'http://localhost:3020'})
  // .use(Dummy, {target: Dashboard})
  // .use(dummy)
  // .use(Webcam, {target: Dashboard})
  // .use(Multipart, {endpoint: '//api2.transloadit.com'})
  .use(Tus10, {endpoint: TUS_ENDPOINT, resume: true})
  // .use(Multipart)
  .use(Informer, {target: Dashboard})
  .use(MetaData, {
    fields: [
      { id: 'resizeTo', name: 'Resize to', value: 1200, placeholder: 'specify future image size' },
      { id: 'description', name: 'Description', value: 'none', placeholder: 'describe what the file is for' }
    ]
  })
uppy.run()

uppy.on('core:success', (fileCount) => {
  console.log(fileCount)
})

// uppy.emit('informer', 'Smile!', 'info', 2000)

document.querySelector('#uppyModalOpener').click()
