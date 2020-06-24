const Uppy = require('@uppy/core')
const GoogleDrive = require('@uppy/google-drive')
const Tus = require('@uppy/tus')
const Zoom = require('./Zoom')
const Dashboard = require('@uppy/dashboard')

const uppy = Uppy({
  debug: true
})

uppy.use(GoogleDrive, {
  companionUrl: 'http://localhost:3020'
})

uppy.use(Zoom, {
  companionUrl: 'http://localhost:3020'
})

uppy.use(Dashboard, {
  inline: true,
  target: 'body',
  plugins: ['GoogleDrive', 'Zoom']
})

uppy.use(Tus, { endpoint: 'https://master.tus.io/files/' })
