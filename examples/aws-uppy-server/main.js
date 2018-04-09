const Uppy = require('uppy/lib/core')
const GoogleDrive = require('uppy/lib/plugins/GoogleDrive')
const Webcam = require('uppy/lib/plugins/Webcam')
const Dashboard = require('uppy/lib/plugins/Dashboard')
const AwsS3 = require('uppy/lib/plugins/AwsS3')

const uppy = Uppy({
  debug: true,
  autoProceed: false
})

uppy.use(GoogleDrive, {
  host: 'http://localhost:3020'
})
uppy.use(Webcam)
uppy.use(Dashboard, {
  inline: true,
  target: 'body',
  plugins: ['GoogleDrive', 'Webcam']
})
uppy.use(AwsS3, {
  host: 'http://localhost:3020'
})

uppy.run()
