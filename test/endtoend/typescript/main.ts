import Uppy = require('@uppy/core')
import Dashboard = require('@uppy/dashboard')
import Instagram = require('@uppy/instagram')
import Dropbox = require('@uppy/dropbox')
import GoogleDrive = require('@uppy/google-drive')
import Url = require('@uppy/url')
import Webcam = require('@uppy/webcam')
import Tus = require('@uppy/tus')
import Form = require('@uppy/form')

window.onerror = (err) => {
  const el = document.createElement('p') as HTMLParagraphElement
  el.textContent = err.stack
  document.body.appendChild(el)
}

const TUS_ENDPOINT = 'https://master.tus.io/files/'

const uppy = Uppy({
  debug: true,
  meta: {
    username: 'John',
    license: 'Creative Commons'
  }
})
  .use(Dashboard, {
    target: document.body,
    trigger: '#pick-files',
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
  .use(Dropbox, { target: Dashboard, serverUrl: 'http://localhost:3020' })
  .use(Url, { target: Dashboard, serverUrl: 'http://localhost:3020' })
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
