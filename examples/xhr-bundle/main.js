const Uppy = require('@uppy/core')
const Dashboard = require('@uppy/dashboard')
const XHRUpload = require('@uppy/xhr-upload')

const uppy = new Uppy({
  debug: true,
  meta: { something: 'xyz' }
})

uppy.use(Dashboard, {
  target: '#app',
  inline: true,
  hideRetryButton: true,
  hideCancelButton: true
})

uppy.use(XHRUpload, {
  bundle: true,
  endpoint: 'http://localhost:9967/upload',
  metaFields: ['something'],
  fieldName: 'files'
})
