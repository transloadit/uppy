const Uppy = require('../../src/core')
const Dashboard = require('../../src/plugins/Dashboard')
// const GoogleDrive = require('../../src/plugins/GoogleDrive')
const Dropbox = require('../../src/plugins/Dropbox')
const Instagram = require('../../src/plugins/Instagram')
// const Webcam = require('../../src/plugins/Webcam')
const Tus10 = require('../../src/plugins/Tus10')
// const XHRUpload = require('../../src/plugins/XHRUpload')
// const FileInput = require('../../src/plugins/FileInput')
const MetaData = require('../../src/plugins/MetaData')
// const Informer = require('../../src/plugins/Informer')
// const StatusBar = require('../../src/plugins/StatusBar')
// const DragDrop = require('../../src/plugins/DragDrop')
// const GoldenRetriever = require('../../src/plugins/GoldenRetriever')

const PROTOCOL = location.protocol === 'https:' ? 'https' : 'http'
const TUS_ENDPOINT = PROTOCOL + '://master.tus.io/files/'

const uppy = Uppy({
  debug: true,
  autoProceed: false,
  meta: {
    username: 'John'
  }
  // restrictions: {
  //   maxFileSize: 300000,
  //   maxNumberOfFiles: 10,
  //   minNumberOfFiles: 2,
  //   allowedFileTypes: ['image/*', 'video/*']
  // }
  // onBeforeFileAdded: (currentFile, files) => {
  //   if (currentFile.name === 'pitercss-IMG_0616.jpg') {
  //     return Promise.resolve()
  //   }
  //   return Promise.reject('this is not the file I was looking for')
  // },
  // onBeforeUpload: (files) => {
  //   if (Object.keys(files).length < 2) {
  //     return Promise.reject('too few files')
  //   }
  //   return Promise.resolve()
  // }
})
  .use(Dashboard, {
    trigger: '#uppyModalOpener',
    // maxWidth: 350,
    // maxHeight: 400,
    inline: false,
    disableStatusBar: false,
    disableInformer: false,
    getMetaFromForm: true,
    replaceTargetContent: true,
    target: '.MyForm',
    hideUploadButton: false,
    closeModalOnClickOutside: false,
    locale: {
      strings: {browse: 'browse'}
    }
    // note: 'Images and video only, 300kb or less'
  })
  // .use(GoogleDrive, {target: Dashboard, host: 'http://localhost:3020'})
  .use(Dropbox, {target: Dashboard, host: 'http://localhost:3020'})
  .use(Instagram, {target: Dashboard, host: 'http://localhost:3020'})
  .use(Tus10, {endpoint: TUS_ENDPOINT, resume: true})
  .use(MetaData, {
    fields: [
      { id: 'license', name: 'License', value: 'Creative Commons', placeholder: 'specify license' },
      { id: 'caption', name: 'Caption', value: 'none', placeholder: 'describe what the image is about' }
    ]
  })
  // .use(GoldenRetriever, {serviceWorker: true})
  .run()

uppy.on('core:success', (fileList) => {
  console.log('UPLOAD SUCCESSFUL!!!')
  console.log(fileList)
})

if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('/sw.js')
    .then((registration) => {
      console.log('ServiceWorker registration successful with scope: ', registration.scope)
    })
    .catch((error) => {
      console.log('Registration failed with ' + error)
    })
}

// uppy.emit('informer', 'Smile!', 'info', 2000)

var modalTrigger = document.querySelector('#uppyModalOpener')
if (modalTrigger) modalTrigger.click()
