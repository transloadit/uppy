import { Uppy } from '@uppy/core'
import Dashboard from '@uppy/dashboard'
import AwsS3Multipart from '@uppy/aws-s3'

import '@uppy/core/dist/style.css'
import '@uppy/dashboard/dist/style.css'

const uppy = new Uppy()
  .use(Dashboard, { target: '#app', inline: true })
  .use(AwsS3Multipart, {
    limit: 2,
    endpoint: process.env.VITE_COMPANION_URL,
    shouldUseMultipart: true,
  })

// Keep this here to access uppy in tests
window.uppy = uppy
