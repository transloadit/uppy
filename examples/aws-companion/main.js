const Uppy = require('@uppy/core')
const GoogleDrive = require('@uppy/google-drive')
const Webcam = require('@uppy/webcam')
const Dashboard = require('@uppy/dashboard')
const AwsS3 = require('@uppy/aws-s3')

const uppy = Uppy({
  debug: true,
  autoProceed: false
})

uppy.use(GoogleDrive, {
  serverUrl: 'http://localhost:3020'
})
uppy.use(Webcam)
uppy.use(Dashboard, {
  inline: true,
  target: 'body',
  plugins: ['GoogleDrive', 'Webcam']
})
uppy.use(AwsS3, {
  serverUrl: 'http://localhost:3020'
})
