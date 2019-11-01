const Uppy = require('@uppy/core')
const Webcam = require('@uppy/webcam')
const Dashboard = require('@uppy/dashboard')
const BackblazeB2Multipart = require('@uppy/backblaze-b2-multipart')

const uppy = Uppy({
  debug: true,
  autoProceed: false
})

uppy.use(Webcam)
uppy.use(Dashboard, {
  inline: true,
  target: 'body',
  plugins: ['GoogleDrive', 'Webcam']
})
uppy.use(BackblazeB2Multipart, {
  companionUrl: 'http://localhost:3020'
})

uppy.on('upload-success', function (file, response) {
  console.log('uploaded', file, response)
})
