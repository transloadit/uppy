/* eslint-disable import/no-extraneous-dependencies */
import Uppy, { debugLogger } from '@uppy/core'
import Dashboard from '@uppy/dashboard'
import RemoteSources from '@uppy/remote-sources'
import Webcam from '@uppy/webcam'
import ScreenCapture from '@uppy/screen-capture'
import GoldenRetriever from '@uppy/golden-retriever'
import Tus from '@uppy/tus'
import AwsS3 from '@uppy/aws-s3'
import XHRUpload from '@uppy/xhr-upload'
import Transloadit from '@uppy/transloadit'
import Form from '@uppy/form'
import ImageEditor from '@uppy/image-editor'
import ImageGenerator from '@uppy/image-generator'
import DropTarget from '@uppy/drop-target'
import Audio from '@uppy/audio'
import Compressor from '@uppy/compressor'
import GoogleDrive from '@uppy/google-drive'
import english from '@uppy/locales/lib/en_US.js'
/* eslint-enable import/no-extraneous-dependencies */

import generateSignatureIfSecret from './generateSignatureIfSecret.js'

// DEV CONFIG: create a .env file in the project root directory to customize those values.
const {
  VITE_UPLOADER: UPLOADER,
  VITE_COMPANION_URL: COMPANION_URL,
  VITE_TUS_ENDPOINT: TUS_ENDPOINT,
  VITE_XHR_ENDPOINT: XHR_ENDPOINT,
  VITE_TRANSLOADIT_KEY: TRANSLOADIT_KEY,
  VITE_TRANSLOADIT_SECRET: TRANSLOADIT_SECRET,
  VITE_TRANSLOADIT_TEMPLATE: TRANSLOADIT_TEMPLATE,
  VITE_TRANSLOADIT_SERVICE_URL: TRANSLOADIT_SERVICE_URL,
} = import.meta.env

const companionAllowedHosts =
  import.meta.env.VITE_COMPANION_ALLOWED_HOSTS &&
  new RegExp(import.meta.env.VITE_COMPANION_ALLOWED_HOSTS)

import.meta.env.VITE_TRANSLOADIT_KEY &&= '***' // to avoid leaking secrets in screenshots.
import.meta.env.VITE_TRANSLOADIT_SECRET &&= '***' // to avoid leaking secrets in screenshots.
console.log(import.meta.env)

// DEV CONFIG: enable or disable Golden Retriever

const RESTORE = false
const COMPRESS = false

async function assemblyOptions() {
  return generateSignatureIfSecret(TRANSLOADIT_SECRET, {
    auth: {
      key: TRANSLOADIT_KEY,
    },
    // It's more secure to use a template_id and enable
    // Signature Authentication
    template_id: TRANSLOADIT_TEMPLATE,
  })
}

function getCompanionKeysParams(name) {
  const {
    [`VITE_COMPANION_${name}_KEYS_PARAMS_CREDENTIALS_NAME`]: credentialsName,
    [`VITE_COMPANION_${name}_KEYS_PARAMS_KEY`]: key,
  } = import.meta.env

  if (credentialsName && key) {
    // https://github.com/transloadit/uppy/pull/2802#issuecomment-1023093616
    return {
      companionKeysParams: {
        key,
        credentialsName,
      },
    }
  }

  return {}
}

// Rest is implementation! Obviously edit as necessary...

export default () => {
  const restrictions = undefined
  // const restrictions = {
  //   maxFileSize:      1 * 1000000, // 1mb
  //   minFileSize:      1 * 1000000, // 1mb
  //   maxTotalFileSize: 1 * 1000000, // 1mb
  //   maxNumberOfFiles: 3,
  //   minNumberOfFiles: 1,
  //   allowedFileTypes: ['image/*', '.jpg', '.jpeg', '.png', '.gif'],
  //   requiredMetaFields: ['caption'],
  // }

  const uppyDashboard = new Uppy({
    locale: english,
    // logger: debugLogger,
    meta: {
      username: 'John',
      license: 'Creative Commons',
    },
    allowMultipleUploadBatches: false,
    restrictions,
  })
    .use(Dashboard, {
      trigger: '#pick-files',
      // inline: true,
      target: '.foo',
      metaFields: [
        { id: 'license', name: 'License', placeholder: 'specify license' },
        { id: 'caption', name: 'Caption', placeholder: 'add caption' },
      ],
      showProgressDetails: true,
      proudlyDisplayPoweredByUppy: true,
      note: `${JSON.stringify(restrictions)}`,
    })
    .use(GoogleDrive, {
      target: Dashboard,
      companionUrl: COMPANION_URL,
      companionAllowedHosts,
      ...getCompanionKeysParams('GOOGLE_DRIVE'),
    })
    // .use(Instagram, { target: Dashboard, companionUrl: COMPANION_URL, companionAllowedHosts })
    // .use(Dropbox, { target: Dashboard, companionUrl: COMPANION_URL, companionAllowedHosts })
    // .use(Box, { target: Dashboard, companionUrl: COMPANION_URL, companionAllowedHosts })
    // .use(Facebook, { target: Dashboard, companionUrl: COMPANION_URL, companionAllowedHosts })
    // .use(OneDrive, { target: Dashboard, companionUrl: COMPANION_URL, companionAllowedHosts })
    // .use(Zoom, { target: Dashboard, companionUrl: COMPANION_URL, companionAllowedHosts })
    // .use(Url, { target: Dashboard, companionUrl: COMPANION_URL, companionAllowedHosts })
    // .use(Unsplash, { target: Dashboard, companionUrl: COMPANION_URL, companionAllowedHosts })
    .use(RemoteSources, {
      companionUrl: COMPANION_URL,
      sources: [
        'GooglePhotos',
        'Box',
        'Dropbox',
        'Facebook',
        'Instagram',
        'OneDrive',
        'Unsplash',
        'Zoom',
        'Url',
      ],
      companionAllowedHosts,
    })
    .use(Webcam, {
      target: Dashboard,
      showVideoSourceDropdown: true,
      showRecordingLength: true,
    })
    .use(Audio, {
      target: Dashboard,
      showRecordingLength: true,
    })
    .use(ScreenCapture, { target: Dashboard })
    .use(Form, { target: '#upload-form' })
    .use(ImageEditor, { target: Dashboard })
    .use(ImageGenerator, { target: Dashboard })
    .use(DropTarget, {
      target: document.body,
    })

  if (COMPRESS) {
    uppyDashboard.use(Compressor)
  }

  switch (UPLOADER) {
    case 'tus':
      uppyDashboard.use(Tus, { endpoint: TUS_ENDPOINT, limit: 6 })
      break
    case 's3':
      uppyDashboard.use(AwsS3, { companionUrl: COMPANION_URL, limit: 6 })
      break
    case 's3-multipart':
      uppyDashboard.use(AwsS3, {
        companionUrl: COMPANION_URL,
        shouldUseMultipart: true,
      })
      break
    case 'xhr':
      uppyDashboard.use(XHRUpload, {
        endpoint: XHR_ENDPOINT,
        limit: 6,
        bundle: false,
      })
      break
    case 'transloadit':
      uppyDashboard.use(Transloadit, {
        service: TRANSLOADIT_SERVICE_URL,
        waitForEncoding: true,
        assemblyOptions,
      })
      break
    case 'transloadit-s3':
      uppyDashboard.use(AwsS3, { companionUrl: COMPANION_URL })
      uppyDashboard.use(Transloadit, {
        waitForEncoding: true,
        importFromUploadURLs: true,
        assemblyOptions,
      })
      break
    case 'transloadit-xhr':
      uppyDashboard.setMeta({
        params: JSON.stringify({
          auth: { key: TRANSLOADIT_KEY },
          template_id: TRANSLOADIT_TEMPLATE,
        }),
      })
      uppyDashboard.use(XHRUpload, {
        method: 'POST',
        endpoint: `${TRANSLOADIT_SERVICE_URL}/assemblies`,
        allowedMetaFields: ['params'],
        bundle: true,
      })
      break
    default:
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
