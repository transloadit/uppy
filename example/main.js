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
  // .use(FileInput, {text: 'Выбрать файл', pretty: true})
  .use(Dashboard, {trigger: '#uppyModalOpener', inline: false})
  .use(GoogleDrive, {target: Dashboard, host: 'http://localhost:3020'})
  .use(Dummy, {target: Dashboard})
  .use(Webcam, {target: Dashboard})
  .use(Tus10, {endpoint: 'https://tusd.tus.io/files/', resume: true})
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
