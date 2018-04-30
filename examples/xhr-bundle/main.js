const Uppy = require('uppy/lib/core')
const Dashboard = require('uppy/lib/plugins/Dashboard')
const XHRUpload = require('uppy/lib/plugins/XHRUpload')

const uppy = Uppy({
  autoProceed: false,
  debug: true
})

uppy.use(Dashboard, {
  target: '#app',
  inline: true
})

uppy.use(XHRUpload, {
  bundle: true,
  endpoint: 'http://localhost:9967/upload',
  fieldName: 'files'
})
