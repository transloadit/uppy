import { Uppy } from '@uppy/core'
import Dashboard from '@uppy/dashboard'
import AwsS3 from '@uppy/aws-s3-multipart'

import '@uppy/core/dist/style.css'
import '@uppy/dashboard/dist/style.css'

const uppy = new Uppy()
  .use(Dashboard, { target: '#app', inline: true })
  .use(AwsS3, {
    limit: 2,
    companionUrl: process.env.VITE_COMPANION_URL,
  })

// Keep this here to access uppy in tests
window.uppy = uppy
