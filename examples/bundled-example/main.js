const Uppy = require('../../src/core')
const Dashboard = require('../../src/plugins/Dashboard')
const Instagram = require('../../src/plugins/Instagram')
const GoogleDrive = require('../../src/plugins/GoogleDrive')
const Webcam = require('../../src/plugins/Webcam')
const Tus = require('../../src/plugins/Tus')
const Form = require('../../src/plugins/Form')

// const Dropbox = require('../../src/plugins/Dropbox')
// const XHRUpload = require('../../src/plugins/XHRUpload')
// const FileInput = require('../../src/plugins/FileInput')
// const MetaData = require('../../src/plugins/MetaData')
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
    username: 'John',
    license: 'Creative Commons'
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
    trigger: '#pick-files',
    metaFields: [
      { id: 'license', name: 'License', placeholder: 'specify license' },
      { id: 'caption', name: 'Caption', placeholder: 'add caption' }
    ]
    // target: '.uppy-target',
    // inline: true,
    // maxWidth: 500,
    // maxHeight: 350,
    // replaceTargetContent: true,
    // closeModalOnClickOutside: false,
    // note: 'Images and video only, 300kb or less',
    // locale: {
    //   strings: { browse: 'browse' }
    // }
  })
  .use(GoogleDrive, { target: Dashboard, host: 'http://localhost:3020' })
  .use(Instagram, { target: Dashboard, host: 'http://localhost:3020' })
  .use(Webcam, { target: Dashboard })
  .use(Tus, { endpoint: TUS_ENDPOINT })
  .use(Form, { target: '#upload-form' })
  // .use(GoldenRetriever, {serviceWorker: true})
  .run()

uppy.on('complete', (result) => {
  if (result.failed.length === 0) {
    console.log('Upload successful 😀')
  } else {
    console.warn('Upload failed 😞')
  }
  console.log('successful files:', result.successful)
  console.log('failed files:', result.failed)
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

// var modalTrigger = document.querySelector('#uppyModalOpener')
// if (modalTrigger) modalTrigger.click()
