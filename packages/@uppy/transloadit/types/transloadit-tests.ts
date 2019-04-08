import Uppy = require('@uppy/core')
import Transloadit = require('../')

{
  const uppy = Uppy()
  uppy.use(Transloadit, {
    getAssemblyOptions(file) {
      file // $ExpectType Uppy.UppyFile
    },
    waitForEncoding: false,
    waitForMetadata: true,
    importFromUploadURLs: false,
    params: {
      auth: { key: 'abc' },
      steps: {}
    }
  })
}

{
  const uppy = Uppy()
  // $ExpectError
  uppy.use(Transloadit, { waitForEncoding: null })
  // $ExpectError
  uppy.use(Transloadit, { waitForMetadata: null })
}

{
  const uppy = Uppy()
  // $ExpectError
  uppy.use(Transloadit, { params: {} })
  // $ExpectError
  uppy.use(Transloadit, { params: { auth: {} } })
  // $ExpectError
  uppy.use(Transloadit, {
    params: {
      auth: { key: null }
    }
  })
  // $ExpectError
  uppy.use(Transloadit, {
    params: {
      auth: { key: 'abc' },
      steps: 'test'
    }
  })
  uppy.use(Transloadit, {
    params: {
      auth: { key: 'abc' },
      steps: { name: {} }
    }
  })
}
