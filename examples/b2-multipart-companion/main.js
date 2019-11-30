const Uppy = require('@uppy/core')
const Webcam = require('@uppy/webcam')
const GoogleDrive = require('@uppy/google-drive')
const Dropbox = require('@uppy/dropbox')
const Dashboard = require('@uppy/dashboard')
const BackblazeB2Multipart = require('@uppy/backblaze-b2-multipart')
const Url = require('@uppy/url')

const uppy = Uppy({
  debug: true,
  autoProceed: false
})
uppy.use(Webcam)
uppy.use(GoogleDrive, {
  companionUrl: 'http://localhost:3020'
})
uppy.use(Dropbox, {
  companionUrl: 'http://localhost:3020'
})
uppy.use(BackblazeB2Multipart, {
  companionUrl: 'http://localhost:3020'
})
uppy.use(Url, {
  companionUrl: 'http://localhost:3020',
  locale: {}
})
uppy.use(Dashboard, {
  inline: true,
  target: 'body',
  plugins: ['Dropbox', 'GoogleDrive', 'Webcam', 'BackblazeB2Multipart']
})

uppy.on('upload-success', function (file, response) {
  console.log('uploaded', file, response)
})
