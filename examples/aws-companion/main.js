import AwsS3 from '@uppy/aws-s3'
import Uppy from '@uppy/core'
import Dashboard from '@uppy/dashboard'
import GoogleDrive from '@uppy/google-drive'
import Webcam from '@uppy/webcam'

import '@uppy/core/css/style.css'
import '@uppy/dashboard/css/style.css'
import '@uppy/webcam/css/style.css'

const uppy = new Uppy({
  debug: true,
  autoProceed: false,
})

uppy.use(GoogleDrive, {
  companionUrl: 'http://localhost:3020',
})
uppy.use(Webcam)
uppy.use(Dashboard, {
  inline: true,
  target: 'body',
  plugins: ['GoogleDrive', 'Webcam'],
})
uppy.use(AwsS3, {
  companionUrl: 'http://localhost:3020',
})
