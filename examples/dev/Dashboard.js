const Uppy = require('@uppy/core/src')
const Dashboard = require('@uppy/dashboard/src')
const Instagram = require('@uppy/instagram/src')
const Dropbox = require('@uppy/dropbox/src')
const GoogleDrive = require('@uppy/google-drive/src')
const Url = require('@uppy/url/src')
const Webcam = require('@uppy/webcam/src')
const Tus = require('@uppy/tus/src')
// const XHRUpload = require('@uppy/xhr-upload/src')
const Form = require('@uppy/form/src')

const TUS_ENDPOINT = 'https://master.tus.io/files/'
// const XHR_ENDPOINT = 'https://api2.transloadit.com'

module.exports = () => {
  const uppyDashboard = Uppy({
    debug: true,
    meta: {
      username: 'John',
      license: 'Creative Commons'
    }
  })
    .use(Dashboard, {
      trigger: '#pick-files',
      // inline: true,
      target: '.foo',
      metaFields: [
        { id: 'license', name: 'License', placeholder: 'specify license' },
        { id: 'caption', name: 'Caption', placeholder: 'add caption' }
      ],
      showProgressDetails: true,
      proudlyDisplayPoweredByUppy: true,
      note: '2 files, images and video only'
    })
    .use(GoogleDrive, { target: Dashboard, companionUrl: 'http://localhost:3020' })
    .use(Instagram, { target: Dashboard, companionUrl: 'http://localhost:3020' })
    .use(Dropbox, { target: Dashboard, companionUrl: 'http://localhost:3020' })
    .use(Url, { target: Dashboard, companionUrl: 'http://localhost:3020' })
    .use(Webcam, { target: Dashboard })
    .use(Tus, { endpoint: TUS_ENDPOINT })
    // .use(XHRUpload, { endpoint: XHR_ENDPOINT })
    .use(Form, { target: '#upload-form' })
    // .use(GoldenRetriever, {serviceWorker: true})

  uppyDashboard.on('complete', (result) => {
    if (result.failed.length === 0) {
      console.log('Upload successful 😀')
    } else {
      console.warn('Upload failed 😞')
    }
    console.log('successful files:', result.successful)
    console.log('failed files:', result.failed)
  })

  const modalTrigger = document.querySelector('#pick-files')
  if (modalTrigger) modalTrigger.click()
}
