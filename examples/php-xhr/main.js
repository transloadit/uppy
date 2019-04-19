const Uppy = require('@uppy/core')
const Webcam = require('@uppy/webcam')
const Dashboard = require('@uppy/dashboard')
const xhr = require('@uppy/xhr-upload')

const uppy = Uppy({
  debug: true,
  autoProceed: false
})

uppy.use(Webcam)
uppy.use(Dashboard, {
  inline: true,
  target: 'body',
  plugins: ['Webcam']
})
uppy.use(xhr, {
  endpoint: 'http://localhost:3020/upload.php'
})
