import Uppy = require('@uppy/core')
import XHRUpload = require('../')

Uppy<Uppy.StrictTypes>().use(XHRUpload, {
  bundle: false,
  formData: true,
  endpoint: 'xyz'
})

function methodMayBeUpperOrLowerCase () {
  Uppy<Uppy.StrictTypes>().use(XHRUpload, {
    endpoint: '/upload',
    method: 'post'
  })
  Uppy<Uppy.StrictTypes>().use(XHRUpload, {
    endpoint: '/upload',
    method: 'PUT'
  })
}
