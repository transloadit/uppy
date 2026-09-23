import Uppy from '@uppy/core'
import Dashboard from '@uppy/dashboard'
import XHRUpload from '@uppy/xhr-upload'

import '@uppy/core/css/style.css'
import '@uppy/dashboard/css/style.css'

const uppy = new Uppy({
  debug: true,
  meta: { something: 'xyz' },
})

uppy.use(Dashboard, {
  target: '#app',
  inline: true,
  hideRetryButton: true,
  hideCancelButton: true,
})

uppy.use(XHRUpload, {
  bundle: true,
  endpoint: 'http://localhost:9967/upload',
  allowedMetaFields: ['something'],
  fieldName: 'files',
})
