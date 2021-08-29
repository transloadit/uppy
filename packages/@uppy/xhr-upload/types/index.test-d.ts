import Uppy from '@uppy/core'
import XHRUpload from '..'

new Uppy().use(XHRUpload, {
  bundle: false,
  formData: true,
  endpoint: 'xyz',
})

new Uppy().use(XHRUpload, {
  endpoint: '/upload',
  method: 'post',
})

new Uppy().use(XHRUpload, {
  endpoint: '/upload',
  method: 'PUT',
})
