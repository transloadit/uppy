import { Core,
         Dummy,
         Dashboard,
         GoogleDrive,
         Webcam,
         Tus10,
         MetaData,
         Informer } from '../src/index.js'

// import ru_RU from '../src/locales/ru_RU.js'
// import MagicLog from '../src/plugins/MagicLog'

const uppy = new Core({debug: true, autoProceed: false})
  .use(Dashboard, {trigger: '#uppyModalOpener', inline: false})
  .use(GoogleDrive, {target: Dashboard, host: 'http://ya.ru'})
  .use(Dummy, {target: Dashboard})
  .use(Webcam, {target: Dashboard})
  // .use(ProgressBar, {target: Dashboard})
  .use(Tus10, {endpoint: 'http://master.tus.io:8080/files/', resume: false})
  .use(Informer, {target: Dashboard})
  .use(MetaData, {
    fields: [
      { id: 'resizeTo', name: 'Resize to', value: 1200, placeholder: 'specify future image size' },
      { id: 'description', name: 'Description', value: 'none', placeholder: 'describe what the file is for' }
    ]
  })
uppy.run()
// uppy.emit('informer', 'Smile!', 'info', 2000)
uppy.on('core:success', (fileCount) => {
  console.log(fileCount)
})

document.querySelector('#uppyModalOpener').click()
