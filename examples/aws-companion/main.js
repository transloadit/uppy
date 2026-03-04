import AwsS3 from '@uppy/aws-s3'
import Uppy from '@uppy/core'
import Dashboard from '@uppy/dashboard'
import GoogleDrive from '@uppy/google-drive'
import Webcam from '@uppy/webcam'

import '@uppy/core/css/style.css'
import '@uppy/dashboard/css/style.css'
import '@uppy/webcam/css/style.css'

// Companion URL — serves both as:
//  1. OAuth + remote download proxy for Google Drive files
//  2. S3 signing server for local file uploads (POST /s3/sign)
const COMPANION_URL = 'http://localhost:3020'

const uppy = new Uppy({
  debug: true,
  autoProceed: false,
})

uppy.use(GoogleDrive, {
  companionUrl: COMPANION_URL,
})
uppy.use(Webcam)
uppy.use(Dashboard, {
  inline: true,
  target: 'body',
  plugins: ['GoogleDrive', 'Webcam'],
})

// The `endpoint` option points to Companion, which signs S3 requests
// via POST /s3/sign. AWS credentials never leave the server.
//
// Two upload flows happen transparently:
//  - Local files (drag & drop, webcam): signed by Companion, uploaded
//    directly from the browser to S3.
//  - Remote files (Google Drive): Companion downloads from the provider
//    and uploads to S3 server-side using its own AWS credentials.
uppy.use(AwsS3, {
  endpoint: COMPANION_URL,
  // These must match the Companion server's COMPANION_AWS_BUCKET
  // and COMPANION_AWS_REGION environment variables.
  bucket: 'uppy-test',
  region: 'us-east-1',
})
