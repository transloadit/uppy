const Uppy = require('@uppy/core/src')
const Dashboard = require('@uppy/dashboard/src')
const Instagram = require('@uppy/instagram/src')
const Facebook = require('@uppy/facebook/src')
const OneDrive = require('@uppy/onedrive/src')
const Dropbox = require('@uppy/dropbox/src')
const GoogleDrive = require('@uppy/google-drive/src')
const Zoom = require('@uppy/zoom/src')
const Url = require('@uppy/url/src')
const Webcam = require('@uppy/webcam/src')
const ScreenCapture = require('@uppy/screen-capture/src')
const GoldenRetriever = require('@uppy/golden-retriever/src')
const Tus = require('@uppy/tus/src')
const AwsS3 = require('@uppy/aws-s3/src')
const AwsS3Multipart = require('@uppy/aws-s3-multipart/src')
const XHRUpload = require('@uppy/xhr-upload/src')
const Transloadit = require('@uppy/transloadit/src')
const Form = require('@uppy/form/src')
const ImageEditor = require('@uppy/image-editor/src')

// DEV CONFIG: pick an uploader

const UPLOADER = 'tus'
// const UPLOADER = 's3'
// const UPLOADER = 's3-multipart'
// const UPLOADER = 'xhr'
// const UPLOADER = 'transloadit'

// DEV CONFIG: Endpoint URLs

const COMPANION_URL = 'http://localhost:3020'
const TUS_ENDPOINT = 'https://master.tus.io/files/'
const XHR_ENDPOINT = 'https://upload-endpoint.uppy.io/upload'

// DEV CONFIG: Transloadit keys

const TRANSLOADIT_KEY = '...'
const TRANSLOADIT_TEMPLATE = '...'

// DEV CONFIG: enable or disable Golden Retriever

const RESTORE = false

// Rest is implementation! Obviously edit as necessary...

module.exports = () => {
  const uppyDashboard = Uppy({
    logger: Uppy.debugLogger,
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
    .use(GoogleDrive, { target: Dashboard, companionUrl: COMPANION_URL })
    .use(Instagram, { target: Dashboard, companionUrl: COMPANION_URL })
    .use(Dropbox, { target: Dashboard, companionUrl: COMPANION_URL })
    .use(Facebook, { target: Dashboard, companionUrl: COMPANION_URL })
    .use(OneDrive, { target: Dashboard, companionUrl: COMPANION_URL })
    .use(Zoom, { target: Dashboard, companionUrl: COMPANION_URL })
    .use(Url, { target: Dashboard, companionUrl: COMPANION_URL })
    .use(Webcam, { target: Dashboard })
    .use(ScreenCapture, { target: Dashboard })
    .use(Form, { target: '#upload-form' })
    .use(ImageEditor, { target: Dashboard })

  switch (UPLOADER) {
    case 'tus':
      uppyDashboard.use(Tus, { endpoint: TUS_ENDPOINT, limit: 6 })
      break
    case 's3':
      uppyDashboard.use(AwsS3, { companionUrl: COMPANION_URL, limit: 6 })
      break
    case 's3-multipart':
      uppyDashboard.use(AwsS3Multipart, { companionUrl: COMPANION_URL, limit: 6 })
      break
    case 'xhr':
      uppyDashboard.use(XHRUpload, { endpoint: XHR_ENDPOINT, limit: 6, bundle: true })
      break
    case 'transloadit':
      uppyDashboard.use(Transloadit, {
        params: {
          auth: { key: TRANSLOADIT_KEY },
          template_id: TRANSLOADIT_TEMPLATE
        }
      })
      break
  }

  if (RESTORE) {
    uppyDashboard.use(GoldenRetriever, { serviceWorker: true })
  }

  window.uppy = uppyDashboard

  uppyDashboard.on('complete', (result) => {
    if (result.failed.length === 0) {
      console.log('Upload successful 😀')
    } else {
      console.warn('Upload failed 😞')
    }
    console.log('successful files:', result.successful)
    console.log('failed files:', result.failed)
    if (UPLOADER === 'transloadit') {
      console.log('Transloadit result:', result.transloadit)
    }
  })

  const modalTrigger = document.querySelector('#pick-files')
  if (modalTrigger) modalTrigger.click()
}
