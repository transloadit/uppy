import { expectError, expectType } from 'tsd'
import Uppy = require('@uppy/core')
import AwsS3 = require('../')

{
  const uppy = Uppy<Uppy.StrictTypes>()
  uppy.use(AwsS3, {
    getUploadParameters (file) {
      expectType<Uppy.UppyFile>(file)
      return { url: '' }
    }
  })
}

{
  const uppy = Uppy<Uppy.StrictTypes>()
  expectError(uppy.use(AwsS3, { getChunkSize: 100 }))
  expectError(uppy.use(AwsS3, { getChunkSize: () => 'not a number' }))
  uppy.use(AwsS3, { getChunkSize: () => 100 })
  uppy.use(AwsS3, { getChunkSize: (file) => file.size })
}
