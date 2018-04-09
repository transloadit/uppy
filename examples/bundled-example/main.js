const Uppy = require('../../src/core')
const Dashboard = require('../../src/plugins/Dashboard')
const Instagram = require('../../src/plugins/Instagram')
const GoogleDrive = require('../../src/plugins/GoogleDrive')
const Webcam = require('../../src/plugins/Webcam')
const Tus = require('../../src/plugins/Tus')
const Form = require('../../src/plugins/Form')

const TUS_ENDPOINT = 'https://master.tus.io/files/'

const uppy = Uppy({
  debug: true,
  autoProceed: false,
  meta: {
    username: 'John',
    license: 'Creative Commons'
  }
})
  .use(Dashboard, {
    trigger: '#pick-files',
    // inline: true,
    // target: 'body',
    metaFields: [
      { id: 'license', name: 'License', placeholder: 'specify license' },
      { id: 'caption', name: 'Caption', placeholder: 'add caption' }
    ],
    showProgressDetails: true,
    proudlyDisplayPoweredByUppy: true,
    note: '2 files, images and video only'
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

var modalTrigger = document.querySelector('#pick-files')
if (modalTrigger) modalTrigger.click()
