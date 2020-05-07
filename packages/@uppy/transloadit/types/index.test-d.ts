import { expectError, expectType } from 'tsd'
import Uppy = require('@uppy/core')
import Transloadit = require('../')

expectType<string>(Transloadit.COMPANION)
expectType<RegExp>(Transloadit.COMPANION_PATTERN)

const validParams = {
  auth: { key: 'not so secret key' }
}

{
  const uppy = Uppy<Uppy.StrictTypes>()
  uppy.use(Transloadit, {
    getAssemblyOptions (file) {
      expectType<Uppy.UppyFile>(file)
      return { params: validParams }
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
  const uppy = Uppy<Uppy.StrictTypes>()
  // must be bools
  expectError(
    uppy.use(Transloadit, { waitForEncoding: null, params: validParams })
  )
  expectError(
    uppy.use(Transloadit, { waitForMetadata: null, params: validParams })
  )
}

{
  const uppy = Uppy<Uppy.StrictTypes>()
  // params.auth.key must be string
  expectError(uppy.use(Transloadit, { params: {} }))
  expectError(uppy.use(Transloadit, { params: { auth: {} } }))
  expectError(
    uppy.use(Transloadit, {
      params: {
        auth: { key: null }
      }
    })
  )
  expectError(
    uppy.use(Transloadit, {
      params: {
        auth: { key: 'abc' },
        steps: 'test'
      }
    })
  )
  uppy.use(Transloadit, {
    params: {
      auth: { key: 'abc' },
      steps: { name: {} }
    }
  })
}
