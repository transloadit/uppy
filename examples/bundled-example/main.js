const Uppy = require('@uppy/core')
const Dashboard = require('@uppy/dashboard')
const Instagram = require('@uppy/instagram')
const GoogleDrive = require('@uppy/google-drive')
const Webcam = require('@uppy/webcam')
const Tus = require('@uppy/tus')
const Form = require('@uppy/form')

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
  .use(GoogleDrive, { target: Dashboard, serverUrl: 'http://localhost:3020' })
  .use(Instagram, { target: Dashboard, serverUrl: 'http://localhost:3020' })
  .use(Webcam, { target: Dashboard })
  .use(Tus, { endpoint: TUS_ENDPOINT })
  .use(Form, { target: '#upload-form' })
  // .use(GoldenRetriever, {serviceWorker: true})

uppy.on('complete', (result) => {
  if (result.failed.length === 0) {
    console.log('Upload successful 😀')
  } else {
    console.warn('Upload failed 😞')
  }
  console.log('successful files:', result.successful)
  console.log('failed files:', result.failed)
})

/* eslint-disable compat/compat */
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
/* eslint-enable */

var modalTrigger = document.querySelector('#pick-files')
if (modalTrigger) modalTrigger.click()
