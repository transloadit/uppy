import Uppy from '@uppy/core'
import Dashboard from '@uppy/dashboard'
import Webcam from '@uppy/webcam'
import XHRUpload from '@uppy/xhr-upload'

import '@uppy/core/dist/style.css'
import '@uppy/dashboard/css/style.css'
import '@uppy/webcam/dist/style.css'

const uppy = new Uppy({
  debug: true,
  autoProceed: false,
})

uppy.use(Webcam)
uppy.use(Dashboard, {
  inline: true,
  target: 'body',
  plugins: ['Webcam'],
})
uppy.use(XHRUpload, {
  endpoint: 'http://localhost:3020/upload',
})
