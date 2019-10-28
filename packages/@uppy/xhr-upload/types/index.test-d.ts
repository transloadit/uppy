import Uppy = require('@uppy/core')
import XHRUpload = require('../')

Uppy().use(XHRUpload, {
  bundle: false,
  formData: true,
  endpoint: 'xyz'
})

function methodMayBeUpperOrLowerCase () {
  Uppy().use(XHRUpload, {
    endpoint: '/upload',
    method: 'post'
  })
  Uppy().use(XHRUpload, {
    endpoint: '/upload',
    method: 'PUT'
  })
}
