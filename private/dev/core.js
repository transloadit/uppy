// The @uppy/ dependencies are resolved from source
/* eslint-disable import/no-extraneous-dependencies */
import Uppy from '@uppy/core'
import Tus from '@uppy/tus'
import AwsS3 from '@uppy/aws-s3'
import XHRUpload from '@uppy/xhr-upload'
import Transloadit from '@uppy/transloadit'
import StatusBar from '@uppy/status-bar'
import FileInput from '@uppy/file-input'

import generateSignatureIfSecret from './generateSignatureIfSecret.js'

/* eslint-enable import/no-extraneous-dependencies */
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

import.meta.env.VITE_TRANSLOADIT_KEY &&= '***' // to avoid leaking secrets in screenshots.
import.meta.env.VITE_TRANSLOADIT_SECRET &&= '***' // to avoid leaking secrets in screenshots.

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

export default () => {
  const uppy = new Uppy({
    debug: true,
    autoProceed: true,
    allowMultipleUploads: true,
  })
    .use(StatusBar, { target: '#status-bar', hideAfterFinish: false })
    .use(FileInput, { target: '#file-input' })

  switch (UPLOADER) {
    case 'tus':
      uppy.use(Tus, { endpoint: TUS_ENDPOINT, limit: 6 })
      break
    case 's3':
      uppy.use(AwsS3, {
        endpoint: COMPANION_URL,
        shouldUseMultipart: false,
      })
      break
    case 's3-multipart':
      uppy.use(AwsS3, {
        endpoint: COMPANION_URL,
        shouldUseMultipart: true,
      })
      break
    case 'xhr':
      uppy.use(XHRUpload, {
        endpoint: XHR_ENDPOINT,
        limit: 6,
        bundle: false,
      })
      break
    case 'transloadit':
      uppy.use(Transloadit, {
        service: TRANSLOADIT_SERVICE_URL,
        waitForEncoding: true,
        assemblyOptions,
      })
      break
    case 'transloadit-s3':
      uppy.use(AwsS3, { companionUrl: COMPANION_URL })
      uppy.use(Transloadit, {
        waitForEncoding: true,
        importFromUploadURLs: true,
        assemblyOptions,
      })
      break
    case 'transloadit-xhr':
      uppy.setMeta({
        params: JSON.stringify({
          auth: { key: TRANSLOADIT_KEY },
          template_id: TRANSLOADIT_TEMPLATE,
        }),
      })
      uppy.use(XHRUpload, {
        method: 'POST',
        endpoint: `${TRANSLOADIT_SERVICE_URL}/assemblies`,
        allowedMetaFields: ['params'],
        bundle: true,
      })
      break
    default:
  }

  window.uppy = uppy
}
